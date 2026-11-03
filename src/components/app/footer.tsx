"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo, ANDROID_APK_URL, ANDROID_APK_NOTE } from "@/components/shared/ui-bits";
import { Link, navigate } from "@/components/app/router";
import { post } from "@/lib/client";
import { toast } from "@/hooks/use-toast";

const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { to: "/explore", label: "Explore videos" },
      { to: "/trending", label: "Trending" },
      { to: "/register", label: "Become a creator" },
      { to: "/policies/monetization", label: "Earnings & monetization" },
    ],
  },
  {
    title: "Policies",
    links: [
      { to: "/policies/community", label: "Community guidelines" },
      { to: "/policies/copyright", label: "Copyright & content" },
      { to: "/policies/payment", label: "Payment & withdrawals" },
      { to: "/policies/privacy", label: "Privacy policy" },
      { to: "/policies/terms", label: "Terms & conditions" },
      { to: "/delete-account", label: "Delete my account" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About us" },
      { to: "/contact", label: "Contact us" },
      { to: "/policies/monetization", label: "How earnings work" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async () => {
    if (!email) return;
    setBusy(true);
    try {
      const res = await post<{ message: string }>("/public/newsletter", { email });
      toast({ title: "Subscribed 🎉", description: res.message });
      setEmail("");
    } catch (e) {
      toast({ title: "Couldn't subscribe", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="mt-auto border-t bg-white">
      {/* newsletter */}
      <div className="border-b bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center md:px-6">
          <div>
            <h3 className="font-display text-2xl font-bold">Creator tips, straight to your inbox</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For creators and parents aged 18+: one useful email a week with tips and platform news. No spam, ever.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} className="h-12 rounded-full bg-white px-5"
              aria-label="Email address"
              onKeyDown={e => e.key === "Enter" && subscribe()}
            />
            <Button
              className="grad-btn h-12 rounded-full px-7 text-white"
              disabled={busy} onClick={subscribe}
            >
              {busy ? "Subscribing…" : "Subscribe"}
              <Icons.ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The creator-first kids video platform. Original cartoons, rhymes and stories earn from qualified views and approved uploads — transparently, from day one.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: Icons.Instagram, label: "Instagram" },
                { icon: Icons.Youtube, label: "YouTube" },
                { icon: Icons.Twitter, label: "X" },
                { icon: Icons.Send, label: "Telegram" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label} aria-label={label}
                  className="rounded-full border p-2.5 text-muted-foreground transition hover:border-brand-red/40 hover:bg-brand-red-soft hover:text-brand-red"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
            <a
              href={ANDROID_APK_URL}
              download
              className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-ink px-4 py-2.5 text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <img src="/brand/icon-96.png" alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-lg" />
              <span className="leading-tight">
                <span className="block text-[11px] text-white/70">Get the Android app</span>
                <span className="block font-display text-[15px] font-bold">Download APK</span>
              </span>
              <Icons.Download size={16} className="ml-1 text-white/80" />
            </a>
            <p className="mt-2 max-w-[16rem] text-[11px] leading-snug text-muted-foreground">{ANDROID_APK_NOTE}</p>
            <div className="mt-5 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Icons.Mail size={14} /> support@mykuchupuchu.com</p>
              <p className="flex items-center gap-2"><Icons.MapPin size={14} /> Made with 💙 & 💗 for kids creators worldwide</p>
            </div>
          </div>
          {COLUMNS.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-brand-red">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Kuchu Puchu. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/policies/privacy" className="hover:text-ink">Privacy</Link>
            <Link to="/policies/terms" className="hover:text-ink">Terms</Link>
            <Link to="/policies/copyright" className="hover:text-ink">Copyright</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
