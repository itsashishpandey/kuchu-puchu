"use client";

// "Delete my account" — used in parent settings, creator settings and the public /delete-account page
// (the web link Google Play asks for). Deletion is permanent and signs the person out.
import { useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, navigate } from "@/components/app/router";
import { useAuth } from "@/components/app/auth-provider";
import { post } from "@/lib/client";
import { toast } from "@/hooks/use-toast";

export function DeleteAccountCard({ className = "" }: { className?: string }) {
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user || user.role === "ADMIN") return null;
  const creator = user.role === "CREATOR";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await post<{ message: string }>("/me/delete-account", { password, confirm: typed.trim() });
      toast({ title: "Account deleted", description: res.message });
      await refresh().catch(() => {});
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className={`rounded-2xl border border-rose-200 bg-rose-50/50 p-6 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-bold text-rose-700"><Icons.TriangleAlert size={16} /> Delete my account</p>
      <p className="mt-2 text-[13px] leading-relaxed text-rose-700/80">
        {creator
          ? "Permanently deletes your creator account: your channel and all your videos are removed, your ID document and personal details are erased, and any unpaid balance is forfeited. Anonymous earnings and payout records are kept for 7 years because accounting law requires it."
          : "Permanently deletes your parent account and its data: your name, email, saved videos, follows, languages and interests. This can't be undone."}
      </p>
      {!open ? (
        <Button variant="outline" className="mt-4 rounded-full border-rose-300 text-rose-600 hover:bg-rose-100" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          {error && <p className="rounded-xl bg-white p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="del-password">Your password</Label>
            <Input id="del-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="h-11 rounded-xl bg-white" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="del-confirm">Type <strong>DELETE</strong> to confirm</Label>
            <Input id="del-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" className="h-11 rounded-xl bg-white" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || !password || typed.trim() !== "DELETE"} className="rounded-full bg-rose-600 text-white hover:bg-rose-700">
              {busy ? "Deleting…" : "Permanently delete"}
            </Button>
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => { setOpen(false); setError(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Public page: https://mykuchupuchu.com/#/delete-account — works with or without the app. */
export function DeleteAccountPage() {
  const { user, loading } = useAuth();
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 md:py-20">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Delete your Kuchu Puchu account</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Kids watch Kuchu Puchu without an account, and the Kuchu Puchu app has no accounts at all. Parent and
        creator accounts exist only on this website and can be deleted at any time, right here.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
        <li>• <strong className="text-ink">Parent accounts:</strong> deleted completely — name, email, saved videos, follows, languages and interests.</li>
        <li>• <strong className="text-ink">Creator accounts:</strong> channel, videos, ID document and personal details are removed. Anonymous earnings and payout records are kept for 7 years for accounting.</li>
        <li>• Deletion is immediate and can't be undone.</li>
      </ul>
      <div className="mt-8">
        {loading ? null : user && user.role !== "ADMIN" ? (
          <>
            <p className="mb-3 text-sm">Signed in as <strong>{user.email}</strong>.</p>
            <DeleteAccountCard />
          </>
        ) : (
          <div className="rounded-2xl border bg-white p-6">
            <p className="text-sm">Log in to the account you want to delete, then come back to this page.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/login")}>Log in</Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Can't log in? Email <a className="font-semibold text-brand-red hover:underline" href="mailto:support@mykuchupuchu.com?subject=Delete%20my%20account">support@mykuchupuchu.com</a> from
              the address on the account and we'll delete it within 7 days.
            </p>
          </div>
        )}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">See our <Link to="/policies/privacy" className="underline">Privacy Policy</Link> for what we keep and why.</p>
    </section>
  );
}
