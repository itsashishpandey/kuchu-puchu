"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/ui-bits";
import { navigate, Link } from "@/components/app/router";
import { api, post } from "@/lib/client";
import { useAuth } from "@/components/app/auth-provider";
import { toast } from "@/hooks/use-toast";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France",
  "Spain", "Italy", "Netherlands", "Brazil", "Mexico", "Japan", "South Korea", "Singapore",
  "United Arab Emirates", "Nigeria", "South Africa", "Other",
];
const CATEGORIES = [
  "Cartoons & Animation", "Nursery Rhymes", "Kids Comedy", "Learning & Fun", "Story Time",
  "Kids Songs", "Toys & Play", "Animals & Friends", "Arts & Crafts", "Dance & Fun",
  "Family Adventures", "Science for Kids",
];

function AuthShell({ children, side }: { children: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 pb-10 pt-8 md:px-12">
        <Link to="/" aria-label="Home"><Logo /></Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">{side}</div>
    </div>
  );
}

function AuthSide({ title, sub }: { title: React.ReactNode; sub: string }) {
  return (
    <div className="relative flex h-full flex-col justify-end p-12 text-white">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-red/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-blue/25 blur-3xl" />
        <div className="absolute right-24 top-24 h-48 w-48 rounded-full bg-brand-yellow/20 blur-3xl" />
      </div>
      <div className="relative">
        <h2 className="font-display text-4xl font-bold leading-tight">{title}</h2>
        <p className="mt-4 max-w-md text-white/70">{sub}</p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { l: "Per 1K qualified views", v: "$1.00" },
            { l: "Per approved upload", v: "$0.50" },
            { l: "Minimum payout", v: "$25" },
          ].map(s => (
            <div key={s.l} className="glass-dark rounded-xl p-3.5">
              <p className="font-display text-lg font-bold text-brand-yellow">{s.v}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-white/60">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await post<{ user: { role: string; status: string } }>("/auth/login", { email, password });
      await refresh();
      const role = res.user.role;
      toast({ title: "Welcome back 👋", description: "You're logged in." });
      navigate(role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <AuthShell side={<AuthSide title={<>Welcome back to <span className="grad-text">your earnings</span></>} sub="Log in to upload videos, track qualified views and manage your payouts." />}>
      <h1 className="font-display text-3xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Welcome back — your channel missed you.</p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 ring-1 ring-rose-200">
          <Icons.AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button type="button" className="text-xs font-semibold text-brand-red hover:underline"
              onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>
          </div>
          <Input id="login-password" type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl" />
        </div>
        <Button type="submit" disabled={busy} className="grad-btn h-12 w-full rounded-xl text-white">
          {busy ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl bg-brand-blue-soft p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-brand-blue">
          <Icons.FlaskConical size={13} /> Demo accounts (click to fill)
        </p>
        <div className="mt-2.5 grid gap-1.5">
          {[
            { label: "Creator — Meera (approved, rich data)", email: "meera@kuchupuchu.com", pass: "Creator@123" },
            { label: "Creator — Samir (pending approval)", email: "samir@kuchupuchu.com", pass: "Creator@123" },
            { label: "Admin — Ava (super admin)", email: "admin@kuchupuchu.com", pass: "Admin@123" },
          ].map(a => (
            <button key={a.email} type="button" onClick={() => fill(a.email, a.pass)}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-xs ring-1 ring-black/5 transition hover:ring-brand-blue/40">
              <span className="font-semibold">{a.label}</span>
              <Icons.Wand2 size={13} className="text-brand-blue" />
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Kuchu Puchu? <Link to="/register" className="font-bold text-brand-red hover:underline">Become a Creator</Link>
      </p>
    </AuthShell>
  );
}

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await post<{ message: string }>("/auth/forgot-password", { email });
      setSent(true);
      toast({ title: "Reset link sent", description: res.message });
    } catch (err) {
      toast({ title: "Couldn't send reset", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side={<AuthSide title="We'll get you <span class='grad-text'>back in</span>" sub="Password resets are handled securely — we'll never ask for your password by email or chat." />}>
      <h1 className="font-display text-3xl font-bold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email linked to your account and we'll send a reset link.
      </p>
      {sent ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <Icons.MailCheck size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-0.5">If an account exists for {email}, a reset link is on its way. In this demo environment, the email content is recorded in the admin mail log instead of being sent.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="fp-email">Email</Label>
            <Input id="fp-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="h-11 rounded-xl" />
          </div>
          <Button type="submit" disabled={busy} className="grad-btn h-12 w-full rounded-xl text-white">
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/login" className="font-bold text-brand-red hover:underline">Back to login</Link>
      </p>
    </AuthShell>
  );
}

// ── REGISTER ───────────────────────────────────────────────────────────────

export function RegisterPage() {
  const { refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarFile = useRef<File | null>(null);
  const [form, setForm] = useState({
    fullName: "", email: "", mobile: "", password: "",
    channelName: "", username: "", description: "", country: "", category: "",
  });
  const [usernameState, setUsernameState] = useState<{ checking: boolean; available: boolean | null; reason: string | null }>({
    checking: false, available: null, reason: null,
  });
  const [agree, setAgree] = useState(false);

  // username availability check (debounced)
  useEffect(() => {
    const u = form.username.trim().toLowerCase();
    if (!u) { setUsernameState({ checking: false, available: null, reason: null }); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      setUsernameState({ checking: false, available: false, reason: "3–20 characters: a–z, 0–9, _" });
      return;
    }
    setUsernameState(s => ({ ...s, checking: true }));
    const t = setTimeout(async () => {
      try {
        const res = await api<{ available: boolean; reason: string | null }>(`/public/check-username?username=${u}`);
        setUsernameState({ checking: false, available: res.available, reason: res.reason });
      } catch {
        setUsernameState({ checking: false, available: null, reason: null });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [form.username]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const pwStrength = (() => {
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[0-9]/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  })();

  const step1Valid = form.fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) &&
    /^\+?[\d\s-]{7,20}$/.test(form.mobile) && form.password.length >= 8 && !!form.country;
  const step2Valid = form.channelName.trim().length >= 3 && usernameState.available === true &&
    form.country && form.category;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) { setError("Please accept the Terms and Community Guidelines to continue."); return; }
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile.current) fd.append("avatar", avatarFile.current);
      await api("/auth/register", { method: "POST", body: fd });
      await refresh();
      toast({ title: "Application submitted 🎉", description: "Your channel is now pending review — usually within 2 business days." });
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side={
      <AuthSide title={<>Turn creativity into <span className="grad-text">income</span></>}
        sub="Free to join, non-exclusive, and you keep ownership of every video you upload. Approved creators start earning from their first upload." />
    }>
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
              step > n ? "bg-emerald-500 text-white" : step === n ? "grad-btn text-white" : "bg-secondary text-muted-foreground"
            }`}>
              {step > n ? <Icons.Check size={14} /> : n}
            </span>
            {n < 3 && <div className={`h-1 flex-1 rounded-full ${step > n ? "bg-emerald-400" : "bg-secondary"}`} />}
          </div>
        ))}
      </div>

      <h1 className="font-display text-3xl font-bold">
        {step === 1 ? "Create your account" : step === 2 ? "Set up your channel" : "Almost there"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step === 1 ? "Tell us who you are — this stays private." :
         step === 2 ? "Your channel is your public identity on Kuchu Puchu." :
         "Add a face to the name (optional) and confirm the rules."}
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 ring-1 ring-rose-200">
          <Icons.AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="r-name">Full name</Label>
              <Input id="r-name" required value={form.fullName} onChange={set("fullName")} placeholder="Alex Rivera" className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-email">Email address</Label>
              <Input id="r-email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="r-mobile">Mobile number</Label>
                <Input id="r-mobile" required value={form.mobile} onChange={set("mobile")} placeholder="+1 555 010 2030" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-country">Country</Label>
                <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger className="h-11 rounded-xl" id="r-country"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-password">Password</Label>
              <Input id="r-password" type="password" required autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="8+ characters" className="h-11 rounded-xl" />
              {form.password && (
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={pwStrength * 25} className="h-1.5 flex-1" />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {["Weak", "Weak", "Okay", "Good", "Strong"][pwStrength]}
                  </span>
                </div>
              )}
            </div>
            <Button type="button" disabled={!step1Valid} onClick={() => setStep(2)} className="grad-btn h-12 w-full rounded-xl text-white">
              Continue <Icons.ArrowRight size={16} className="ml-1" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="r-channel">Channel name</Label>
              <Input id="r-channel" required value={form.channelName} onChange={set("channelName")} placeholder="Alex Creates" className="h-11 rounded-xl" />
              <p className="text-[11px] text-muted-foreground">This is how viewers will know you. Must be unique.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-username">Channel username</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <Input id="r-username" required value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  placeholder="alexcreates" className="h-11 rounded-xl pl-8" />
                {form.username && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {usernameState.checking ? <Icons.Loader2 size={16} className="animate-spin text-muted-foreground" /> :
                     usernameState.available ? <Icons.CheckCircle2 size={16} className="text-emerald-500" /> :
                     usernameState.available === false ? <Icons.XCircle size={16} className="text-rose-500" /> : null}
                  </span>
                )}
              </div>
              {usernameState.reason && (
                <p className={`text-[11px] ${usernameState.available ? "text-emerald-600" : "text-rose-500"}`}>{usernameState.reason}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-category">Content category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-11 rounded-xl" id="r-category"><SelectValue placeholder="What will you create?" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-desc">Channel description</Label>
              <Textarea id="r-desc" value={form.description} onChange={set("description")} rows={3}
                placeholder="Tell viewers what your channel is about…" className="rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 rounded-xl">Back</Button>
              <Button type="button" disabled={!step2Valid} onClick={() => setStep(3)} className="grad-btn h-12 flex-1 rounded-xl text-white">
                Continue <Icons.ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-1.5">
              <Label>Profile photo <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition hover:border-brand-red/50">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <Icons.Camera size={22} className="text-muted-foreground" />
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold">{avatarFile.current ? avatarFile.current.name : "Upload a photo"}</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG or WebP · max 5MB</p>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { avatarFile.current = f; setAvatarPreview(URL.createObjectURL(f)); }
                  }} />
              </label>
            </div>

            <div className="rounded-2xl bg-secondary p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold">
                <Icons.Clock size={13} className="text-brand-blue" /> What happens next?
              </p>
              <ol className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">
                <li>1. Your application enters review (usually ≤ 2 business days)</li>
                <li>2. Once approved, you can upload videos and start earning</li>
                <li>3. We'll notify you in-app and by email about your status</li>
              </ol>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <Checkbox checked={agree} onCheckedChange={v => setAgree(!!v)} className="mt-0.5" />
              <span className="text-[13px] leading-relaxed text-muted-foreground">
                I agree to the{" "}
                <Link to="/policies/terms" className="font-semibold text-brand-red hover:underline">Terms &amp; Conditions</Link>,{" "}
                <Link to="/policies/community" className="font-semibold text-brand-red hover:underline">Community Guidelines</Link> and{" "}
                <Link to="/policies/privacy" className="font-semibold text-brand-red hover:underline">Privacy Policy</Link>.
                I will only upload original content I own the rights to.
              </span>
            </label>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-12 rounded-xl">Back</Button>
              <Button type="submit" disabled={busy || !agree} className="grad-btn h-12 flex-1 rounded-xl text-white">
                {busy ? "Submitting…" : "Submit application"} <Icons.Send size={15} className="ml-1.5" />
              </Button>
            </div>
          </>
        )}
      </form>

      {step === 1 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-bold text-brand-red hover:underline">Log in</Link>
        </p>
      )}
    </AuthShell>
  );
}
