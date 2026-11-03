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
import { api, post, type SessionUser } from "@/lib/client";
import { useAuth } from "@/components/app/auth-provider";
import { toast } from "@/hooks/use-toast";
import { useCategories, useLanguages } from "@/lib/use-taxonomy";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { needsOnboarding } from "@/components/discovery/onboarding";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France",
  "Spain", "Italy", "Netherlands", "Brazil", "Mexico", "Japan", "South Korea", "Singapore",
  "United Arab Emirates", "Nigeria", "South Africa", "Other",
];

export function AuthShell({ children, side }: { children: React.ReactNode; side: React.ReactNode }) {
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

export function AuthSide({ title, sub }: { title: React.ReactNode; sub: string }) {
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
            { l: "Per approved upload", v: "₹30" },
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
      const res = await post<{ user: SessionUser }>("/auth/login", { email, password });
      await refresh();
      const role = res.user.role;
      toast({ title: "Welcome back 👋", description: "You're logged in." });
      // first visit since languages & interests were introduced → offer onboarding (skippable)
      navigate(needsOnboarding(res.user) ? "/onboarding" : role === "ADMIN" ? "/admin" : role === "CREATOR" ? "/dashboard" : "/feed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };


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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here? <Link to="/join" className="font-bold text-brand-red hover:underline">Create a free account</Link>
        {" "}· <Link to="/register" className="font-bold text-brand-blue hover:underline">Become a Creator</Link>
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

// ── REGISTER: the creator application lives in creator-application.tsx ──

// ── JOIN (free parent account — kids watch without one) ─────────────────────

export function JoinPage() {
  const { refresh } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", country: "" });
  const [agree, setAgree] = useState(false);
  const [parent, setParent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = form.fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8 && agree && parent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      fd.append("accountType", "VIEWER");
      fd.append("parentConfirm", "true");
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await api("/auth/register", { method: "POST", body: fd });
      await refresh();
      navigate("/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell side={<AuthSide title={<>Safe videos for kids, <span className="grad-text">in your language</span></>} sub="Kids aged 3–8 watch without an account. A free parent account lets you save videos, follow creators and set your family's languages and favourite topics." />}>
      <h1 className="font-display text-3xl font-bold">Create a parent account</h1>
      <p className="mt-2 text-sm text-muted-foreground">For parents and guardians aged 18+. Kids don't need an account to watch — please don't let a child create one.</p>
      {error && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 ring-1 ring-rose-200">
          <Icons.AlertCircle size={17} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="j-name">Your name (parent or guardian)</Label>
          <Input id="j-name" required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Priya Sharma" className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="j-email">Email address</Label>
          <Input id="j-email" type="email" required autoComplete="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="j-password">Password</Label>
          <Input id="j-password" type="password" required autoComplete="new-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="8+ characters" className="h-11 rounded-xl" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="j-country">Country <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Select value={form.country || undefined} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
            <SelectTrigger className="h-11 rounded-xl" id="j-country"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent className="max-h-72">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">Creators you follow can see your name and country — you can make your follows private any time.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
          <Checkbox checked={parent} onCheckedChange={v => setParent(!!v)} className="mt-0.5" />
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            I am a parent or guardian aged 18 or over. Kids watch without an account.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
          <Checkbox checked={agree} onCheckedChange={v => setAgree(!!v)} className="mt-0.5" />
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            I agree to the <Link to="/policies/terms" className="font-semibold text-brand-red hover:underline">Terms</Link>,{" "}
            <Link to="/policies/community" className="font-semibold text-brand-red hover:underline">Community Guidelines</Link> and{" "}
            <Link to="/policies/privacy" className="font-semibold text-brand-red hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        <Button type="submit" disabled={busy || !valid} className="grad-btn h-12 w-full rounded-xl text-white">
          {busy ? "Creating your account…" : "Create parent account"} <Icons.ArrowRight size={16} className="ml-1" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-bold text-brand-red hover:underline">Log in</Link>
        {" "}· Make kids' videos? <Link to="/register" className="font-bold text-brand-blue hover:underline">Become a Creator</Link>
      </p>
    </AuthShell>
  );
}
