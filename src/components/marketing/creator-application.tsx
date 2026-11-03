"use client";

// "Become a creator" — 5-step application: verify email (6-digit code) → about you → channel →
// government ID (private, admins only) → rules. Text fields survive a page refresh; the password,
// files and email token never leave memory.
import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { usd } from "@/lib/format";
import { usePublicSettings, lengthRange } from "@/lib/use-public-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { navigate, Link } from "@/components/app/router";
import { api, get } from "@/lib/client";
import { useAuth } from "@/components/app/auth-provider";
import { useCategories, useLanguages } from "@/lib/use-taxonomy";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { COUNTRIES } from "@/components/dashboard/channel-studio";
import { AuthShell, AuthSide } from "./auth-pages";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Rules = {
  usernameRule: string; usernamePattern: string; documentMaxMB: number; strikeLimit: number;
  documentTypes: { id: string; label: string; countries: string[] | null }[];
  agreements: { id: string; text: string }[];
  minMonthlyChannelViews: number; uploadRewardInr: number; uploadRewardUsd: number; ratePer1000Views: number;
};

const DRAFT_KEY = "kp_creator_application";
const STEPS = ["Verify email", "About you", "Your channel", "ID check", "Rules"];

type Draft = {
  email: string; legalName: string; phone: string; country: string; city: string; postalCode: string;
  channelName: string; username: string; category: string; languages: string[]; description: string;
  existingCreator: "" | "yes" | "no"; instagramUrl: string; youtubeUrl: string; documentType: string; documentLast4: string;
};
const EMPTY: Draft = {
  email: "", legalName: "", phone: "", country: "India", city: "", postalCode: "", channelName: "", username: "",
  category: "", languages: [], description: "", existingCreator: "", instagramUrl: "", youtubeUrl: "", documentType: "", documentLast4: "",
};

const pinOk = (country: string, pin: string) => (country === "India" ? /^[1-9][0-9]{5}$/.test(pin.trim()) : /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(pin.trim()));
const phoneOk = (p: string) => /^\+?[0-9]{7,15}$/.test(p.replace(/[\s()-]/g, ""));
const igOk = (v: string) => !v.trim() || /^@?[A-Za-z0-9._]{1,30}$/.test(v.trim()) || /instagram\.com\/[^/\s]+/i.test(v);
const ytOk = (v: string) => !v.trim() || /^@[A-Za-z0-9._-]{3,30}$/.test(v.trim()) || /(youtube\.com\/[^\s]+|youtu\.be\/[^\s]+)/i.test(v);

export function CreatorApplicationPage() {
  const { refresh } = useAuth();
  const { data: categories = [] } = useCategories("en");
  const { data: languages = [] } = useLanguages();
  const [rules, setRules] = useState<Rules | null>(null);
  const live = usePublicSettings();
  const [step, setStep] = useState(1);
  const [d, setD] = useState<Draft>(EMPTY);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [emailToken, setEmailToken] = useState("");
  const [devNote, setDevNote] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [username, setUsername] = useState<{ checking: boolean; available: boolean | null; reason: string | null }>({ checking: false, available: null, reason: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { get<Rules>("/public/creator-application").then(setRules).catch(() => {}); }, []);
  // text fields survive a refresh (never the password, files or email token)
  useEffect(() => { try { const s = sessionStorage.getItem(DRAFT_KEY); if (s) setD({ ...EMPTY, ...JSON.parse(s) }); } catch { /* ignore */ } }, []);
  useEffect(() => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ } }, [d]);
  useEffect(() => { if (resendIn <= 0) return; const t = setTimeout(() => setResendIn(n => n - 1), 1000); return () => clearTimeout(t); }, [resendIn]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }));
  const usernameRe = new RegExp(rules?.usernamePattern ?? "^[a-z0-9]{6,20}$");

  // live username check
  useEffect(() => {
    const u = d.username;
    if (!u) { setUsername({ checking: false, available: null, reason: null }); return; }
    if (!usernameRe.test(u)) { setUsername({ checking: false, available: false, reason: rules?.usernameRule ?? "6–20 letters or numbers" }); return; }
    setUsername(s => ({ ...s, checking: true }));
    const t = setTimeout(() => {
      get<{ available: boolean; reason: string | null }>(`/public/check-username?username=${u}`)
        .then(r => setUsername({ checking: false, available: r.available, reason: r.available ? "Available ✓" : r.reason }))
        .catch(() => setUsername({ checking: false, available: null, reason: null }));
    }, 400);
    return () => clearTimeout(t);
  }, [d.username, rules]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendCode = async () => {
    setError(""); setBusy(true);
    try {
      const r = await api<{ message: string; resendIn: number; devNote?: string }>("/auth/email-otp", { method: "POST", body: JSON.stringify({ email: d.email.trim().toLowerCase() }) });
      setOtpSent(true); setResendIn(r.resendIn ?? 60); setDevNote(r.devNote ?? ""); setCode("");
      toast({ title: "Code sent 📧", description: r.message });
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const verifyCode = async () => {
    setError(""); setBusy(true);
    try {
      const r = await api<{ emailToken: string }>("/auth/email-otp/verify", { method: "POST", body: JSON.stringify({ email: d.email.trim().toLowerCase(), code }) });
      setEmailToken(r.emailToken);
      toast({ title: "Email verified ✅" });
      go(2);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const docTypes = (rules?.documentTypes ?? []).filter(t => !t.countries || t.countries.includes(d.country));
  const maxDocMB = rules?.documentMaxMB ?? 8;
  const valid: Record<number, boolean> = {
    1: !!emailToken,
    2: d.legalName.trim().length >= 3 && phoneOk(d.phone) && password.length >= 8 && !!d.country && d.city.trim().length >= 2 && pinOk(d.country, d.postalCode),
    3: d.channelName.trim().length >= 3 && username.available === true && !!avatar && !!d.category && d.existingCreator !== "" &&
      (d.existingCreator === "no" || ((!!d.instagramUrl.trim() || !!d.youtubeUrl.trim()) && igOk(d.instagramUrl) && ytOk(d.youtubeUrl))),
    4: docTypes.some(t => t.id === d.documentType) && /^[A-Za-z0-9]{4}$/.test(d.documentLast4) && !!doc,
    5: (rules?.agreements ?? []).every(a => agree[a.id]),
  };
  const go = (n: number) => { setError(""); setStep(n); topRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const pickImage = (f: File | undefined, kind: "avatar" | "doc") => {
    if (!f) return;
    if (kind === "avatar") {
      if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return toast({ title: "Use a PNG, JPG or WebP photo", variant: "destructive" });
      if (f.size > 5 * 1024 * 1024) return toast({ title: "Profile picture must be under 5MB", variant: "destructive" });
      setAvatar(f); setAvatarPreview(URL.createObjectURL(f));
    } else {
      if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/.test(f.type)) return toast({ title: "Upload a photo (JPG, PNG, WebP) or a PDF", variant: "destructive" });
      if (f.size > maxDocMB * 1024 * 1024) return toast({ title: `The document must be under ${maxDocMB}MB`, variant: "destructive" });
      setDoc(f);
    }
  };

  const submit = async () => {
    if (!valid[5]) return;
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      const fields: Record<string, string> = {
        legalName: d.legalName.trim(), email: d.email.trim().toLowerCase(), emailToken, mobile: d.phone, password,
        country: d.country, city: d.city.trim(), postalCode: d.postalCode.trim(), channelName: d.channelName.trim(), username: d.username,
        category: d.category, description: d.description.trim(), languages: JSON.stringify(d.languages),
        existingCreator: d.existingCreator === "yes" ? "true" : "false",
        instagramUrl: d.existingCreator === "yes" ? d.instagramUrl.trim() : "", youtubeUrl: d.existingCreator === "yes" ? d.youtubeUrl.trim() : "",
        documentType: d.documentType, documentLast4: d.documentLast4.toUpperCase(),
      };
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      (rules?.agreements ?? []).forEach(a => fd.append(`agree_${a.id}`, agree[a.id] ? "true" : "false"));
      fd.append("avatar", avatar!);
      fd.append("document", doc!);
      await api("/auth/register", { method: "POST", body: fd });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      await refresh();
      toast({ title: "Application submitted 🎉", description: "We'll review your channel and ID — usually within 2 business days." });
      navigate("/onboarding");
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      if (/verify your email/i.test(msg)) { setEmailToken(""); setOtpSent(false); go(1); }
    } finally { setBusy(false); }
  };

  const L = (p: { children: React.ReactNode; htmlFor?: string; optional?: boolean }) => (
    <Label htmlFor={p.htmlFor}>{p.children}{p.optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : <span className="text-brand-red"> *</span>}</Label>
  );

  return (
    <AuthShell side={<AuthSide title={<>Turn creativity into <span className="grad-text">income</span></>}
      sub={`Free to join, non-exclusive, and you keep ownership of every video. Earn ${usd(rules?.uploadRewardUsd ?? live.rewardPerUpload)} per approved upload and ${usd(rules?.ratePer1000Views ?? live.ratePer1000Views)} per 1,000 qualified views once your channel unlocks earning with ${(rules?.minMonthlyChannelViews ?? live.minMonthlyChannelViews).toLocaleString("en-US")} views within 30 days.`} />}>
      <div ref={topRef} />
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Step {step} of {STEPS.length} · {STEPS[step - 1]}</span>
          <span>{Math.round(((step - 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step - 1) / STEPS.length) * 100} className="mt-2 h-1.5" />
      </div>

      <h1 className="font-display text-3xl font-bold">
        {step === 1 ? "Become a creator" : step === 2 ? "About you" : step === 3 ? "Set up your channel" : step === 4 ? "Verify your identity" : "Creator rules"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step === 1 ? "First, let's verify your email with a 6-digit code." :
          step === 2 ? "Use your real details — they must match your government ID." :
          step === 3 ? "This is how viewers will see you." :
          step === 4 ? "Upload one government ID. Only our review team can see it — it's never shown publicly." :
          "Please read and accept each rule."}
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 ring-1 ring-rose-200" role="alert">
          <Icons.AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <div className="grid gap-1.5">
              <L htmlFor="a-email">Email address</L>
              <div className="flex gap-2">
                <Input id="a-email" type="email" autoComplete="email" value={d.email} disabled={!!emailToken}
                  onChange={e => { set("email", e.target.value); setOtpSent(false); setEmailToken(""); }} placeholder="you@example.com" className="h-11 rounded-xl" />
                <Button type="button" variant="outline" className="h-11 shrink-0 rounded-xl" disabled={busy || !/\S+@\S+\.\S+/.test(d.email) || resendIn > 0 || !!emailToken} onClick={sendCode}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : otpSent ? "Resend code" : "Send code"}
                </Button>
              </div>
            </div>
            {otpSent && !emailToken && (
              <div className="grid gap-1.5">
                <L htmlFor="a-code">6-digit code</L>
                <div className="flex gap-2">
                  <Input id="a-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••"
                    className="h-12 rounded-xl text-center font-mono text-xl tracking-[0.5em]" />
                  <Button type="button" className="grad-btn h-12 shrink-0 rounded-xl px-6 text-white" disabled={busy || code.length !== 6} onClick={verifyCode}>Verify</Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Sent to {d.email}. It expires in 10 minutes — check your spam folder too.</p>
                {devNote && <p className="rounded-lg bg-brand-yellow-soft px-3 py-2 text-[11px]">{devNote}</p>}
              </div>
            )}
            {emailToken && <p className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700"><Icons.CheckCircle2 size={16} /> {d.email} is verified</p>}
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-1.5">
              <L htmlFor="a-legal">Legal name</L>
              <Input id="a-legal" autoComplete="name" value={d.legalName} onChange={e => set("legalName", e.target.value)} placeholder="Exactly as on your government ID" className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <L htmlFor="a-phone">Phone number</L>
                <Input id="a-phone" type="tel" autoComplete="tel" value={d.phone} onChange={e => set("phone", e.target.value)} placeholder={d.country === "India" ? "+91 98765 43210" : "+1 555 010 2030"} className="h-11 rounded-xl" />
                {d.phone && !phoneOk(d.phone) && <p className="text-[11px] text-rose-500">Include your country code, e.g. +91…</p>}
              </div>
              <div className="grid gap-1.5">
                <L htmlFor="a-pass">Password</L>
                <Input id="a-pass" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8+ characters" className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <L>Country</L>
              <Select value={d.country} onValueChange={v => { set("country", v); set("documentType", ""); }}>
                <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-72">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <L htmlFor="a-city">City</L>
                <Input id="a-city" autoComplete="address-level2" value={d.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Pune" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <L htmlFor="a-pin">{d.country === "India" ? "PIN code" : "Postal code"}</L>
                <Input id="a-pin" autoComplete="postal-code" inputMode={d.country === "India" ? "numeric" : "text"} value={d.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder={d.country === "India" ? "6 digits" : ""} className="h-11 rounded-xl" />
                {d.postalCode && !pinOk(d.country, d.postalCode) && <p className="text-[11px] text-rose-500">{d.country === "India" ? "Enter your 6-digit PIN code" : "Enter a valid postal code"}</p>}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer">
                {avatarPreview ? <img src={avatarPreview} alt="Profile preview" className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-pink/20" />
                  : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary"><Icons.Camera size={24} className="text-muted-foreground" /></span>}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => pickImage(e.target.files?.[0], "avatar")} />
              </label>
              <div>
                <L>Profile picture</L>
                <p className="text-xs text-muted-foreground">Square photo or logo · PNG, JPG or WebP · max 5MB</p>
              </div>
            </div>
            <div className="grid gap-1.5">
              <L htmlFor="a-channel">Channel name</L>
              <Input id="a-channel" value={d.channelName} maxLength={60} onChange={e => set("channelName", e.target.value)} placeholder="e.g. Asha's Toon Town" className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <L htmlFor="a-user">Username</L>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <Input id="a-user" value={d.username} maxLength={20} onChange={e => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} placeholder="ashatoons" className="h-11 rounded-xl pl-8" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {username.checking ? <Icons.Loader2 size={16} className="animate-spin text-muted-foreground" /> : username.available ? <Icons.CheckCircle2 size={16} className="text-emerald-500" /> : username.available === false ? <Icons.XCircle size={16} className="text-rose-500" /> : null}
                </span>
              </div>
              <p className={cn("text-[11px]", username.available ? "text-emerald-600" : username.available === false ? "text-rose-500" : "text-muted-foreground")}>
                {username.reason ?? `${rules?.usernameRule ?? "6–20 letters or numbers"} — it can't be changed later.`}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <L>Main category</L>
                <Select value={d.category || undefined} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue placeholder="What will you create?" /></SelectTrigger>
                  <SelectContent className="max-h-72">{categories.map(c => <SelectItem key={c.id} value={c.nameEn}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <L optional>Languages you'll publish in</L>
                {d.languages.length < 3 ? (
                  <LanguageCombobox languages={languages} exclude={d.languages} placeholder="Add a language (up to 3)" className="h-11 rounded-xl" onSelect={c => set("languages", [...d.languages, c].slice(0, 3))} />
                ) : <p className="text-xs text-muted-foreground">Maximum 3</p>}
              </div>
            </div>
            {d.languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {d.languages.map(c => {
                  const l = languages.find(x => x.code === c);
                  return <span key={c} className="inline-flex items-center gap-1 rounded-full bg-brand-blue-soft px-2.5 py-1 text-xs font-semibold text-brand-blue">{l?.nameNative ?? c}<button type="button" aria-label="Remove" onClick={() => set("languages", d.languages.filter(x => x !== c))}><Icons.X size={12} /></button></span>;
                })}
              </div>
            )}
            <div className="grid gap-1.5">
              <L htmlFor="a-desc" optional>Channel description</L>
              <Textarea id="a-desc" rows={3} maxLength={500} value={d.description} onChange={e => set("description", e.target.value)} placeholder="Tell viewers what your channel is about…" className="rounded-xl" />
            </div>
            <div className="grid gap-2 rounded-2xl border p-4">
              <L>Are you already a creator on Instagram or YouTube?</L>
              <div className="flex gap-2">
                {(["yes", "no"] as const).map(v => (
                  <button key={v} type="button" onClick={() => set("existingCreator", v)}
                    className={cn("flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition", d.existingCreator === v ? "border-brand-pink bg-brand-pink-soft" : "hover:border-brand-pink/40")}>
                    {v === "yes" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
              {d.existingCreator === "yes" && (
                <div className="mt-1 grid gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="a-ig" className="flex items-center gap-1.5 text-xs"><Icons.Instagram size={14} /> Instagram profile</Label>
                    <Input id="a-ig" value={d.instagramUrl} onChange={e => set("instagramUrl", e.target.value)} placeholder="instagram.com/yourname or @yourname" className="h-10 rounded-xl" />
                    {!igOk(d.instagramUrl) && <p className="text-[11px] text-rose-500">That doesn't look like an Instagram profile</p>}
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="a-yt" className="flex items-center gap-1.5 text-xs"><Icons.Youtube size={14} /> YouTube channel</Label>
                    <Input id="a-yt" value={d.youtubeUrl} onChange={e => set("youtubeUrl", e.target.value)} placeholder="youtube.com/@yourchannel" className="h-10 rounded-xl" />
                    {!ytOk(d.youtubeUrl) && <p className="text-[11px] text-rose-500">That doesn't look like a YouTube channel link</p>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Add at least one. It helps us review your application faster.</p>
                </div>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <L>Type of ID</L>
                <Select value={d.documentType || undefined} onValueChange={v => set("documentType", v)}>
                  <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent>{docTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <L htmlFor="a-last4">Last 4 characters of the ID number</L>
                <Input id="a-last4" value={d.documentLast4} maxLength={4} onChange={e => set("documentLast4", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="e.g. 1234" className="h-11 rounded-xl font-mono tracking-widest" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition hover:border-brand-pink/50">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary">
                {doc ? (doc.type === "application/pdf" ? <Icons.FileText size={24} className="text-brand-pink" /> : <Icons.Image size={24} className="text-brand-pink" />) : <Icons.Upload size={22} className="text-muted-foreground" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{doc ? doc.name : "Upload your ID"}</span>
                <span className="block text-xs text-muted-foreground">{doc ? `${doc.size < 1024 * 1024 ? `${Math.max(1, Math.round(doc.size / 1024))} KB` : `${(doc.size / 1024 / 1024).toFixed(1)} MB`} · tap to replace` : `Clear photo or PDF of the front · max ${maxDocMB}MB`}</span>
              </span>
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={e => pickImage(e.target.files?.[0], "doc")} />
            </label>
            <div className="flex items-start gap-2.5 rounded-xl bg-brand-blue-soft p-3.5 text-xs leading-relaxed">
              <Icons.Lock size={15} className="mt-0.5 shrink-0 text-brand-blue" />
              <span>Your ID is stored privately and seen only by our review team to confirm you are who you say you are. It is never shown on your channel. We ask for only the last 4 characters of the number.</span>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="space-y-2.5">
              {(rules?.agreements ?? []).map(a => (
                <label key={a.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition", agree[a.id] && "border-emerald-300 bg-emerald-50/50")}>
                  <Checkbox checked={!!agree[a.id]} onCheckedChange={v => setAgree(x => ({ ...x, [a.id]: !!v }))} className="mt-0.5" />
                  <span className="text-[13px] leading-relaxed">
                    {a.id === "terms" ? <>I agree to the <Link to="/policies/terms" className="font-semibold text-brand-red hover:underline">Terms</Link>, <Link to="/policies/community" className="font-semibold text-brand-red hover:underline">Community Guidelines</Link> and <Link to="/policies/privacy" className="font-semibold text-brand-red hover:underline">Privacy Policy</Link>, and I will only upload original content I own.</> : a.text}
                  </span>
                </label>
              ))}
            </div>
            <div className="rounded-2xl bg-secondary p-4 text-[13px] text-muted-foreground">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink"><Icons.Clock size={13} className="text-brand-blue" /> What happens next?</p>
              <ol className="mt-2 space-y-1">
                <li>1. We review your channel and ID — usually within 2 business days.</li>
                <li>2. Once approved you can upload original short videos ({lengthRange(live)}).</li>
                <li>3. You earn {usd(rules?.uploadRewardUsd ?? live.rewardPerUpload)} per approved upload and {usd(rules?.ratePer1000Views ?? live.ratePer1000Views)} per 1,000 qualified views once your channel unlocks earning — a one-time target of {(rules?.minMonthlyChannelViews ?? live.minMonthlyChannelViews).toLocaleString("en-US")} views within 30 days.</li>
              </ol>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 1 && <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={() => go(step - 1)} disabled={busy}>Back</Button>}
          {step > 1 && step < 5 && (
            <Button type="button" className="grad-btn h-12 flex-1 rounded-xl text-white" disabled={!valid[step]} onClick={() => go(step + 1)}>
              Continue <Icons.ArrowRight size={16} className="ml-1" />
            </Button>
          )}
          {step === 1 && emailToken && (
            <Button type="button" className="grad-btn h-12 flex-1 rounded-xl text-white" onClick={() => go(2)}>Continue <Icons.ArrowRight size={16} className="ml-1" /></Button>
          )}
          {step === 5 && (
            <Button type="button" className="grad-btn h-12 flex-1 rounded-xl text-white" disabled={!valid[5] || busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit application"} <Icons.Send size={15} className="ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      {step === 1 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-bold text-brand-red hover:underline">Log in</Link>
          {" "}· A parent? <Link to="/join" className="font-bold text-brand-blue hover:underline">Free parent account</Link>
        </p>
      )}
    </AuthShell>
  );
}
