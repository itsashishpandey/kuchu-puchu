"use client";

import * as Icons from "lucide-react";
import { PrimaryCTA, SecondaryCTA } from "@/components/shared/ui-bits";
import { usd } from "@/lib/format";

// ── Creator appeal: upload videos & earn money ─────────────────────────────

export function UploadAndEarn({
  rate = 1, reward = 0.5,
}: { rate?: number; reward?: number }) {
  const steps = [
    { icon: Icons.UploadCloud, title: "Upload", desc: "40–60s original, MP4/MOV — up to 2 a day" },
    { icon: Icons.Fingerprint, title: "Verified", desc: "fingerprinted so no one can steal it" },
    { icon: Icons.CheckCircle2, title: "Approved", desc: "quick review, usually within a day" },
    { icon: Icons.BadgeDollarSign, title: "Paid", desc: "reward + views earnings credited" },
  ];
  const chips = [
    "Proportional payouts — no rounding down",
    "Each video earns for 4 months",
    "$25 minimum withdrawal",
    "Bank transfer or PayPal",
    "You keep your rights",
    "Non-exclusive — post anywhere",
  ];

  return (
    <section className="relative overflow-hidden bg-surface py-16 md:py-24" aria-label="Upload videos and earn money">
      <div className="mesh-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="reveal mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-blue-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue">
            <Icons.UploadCloud size={13} /> Creators earn from day one
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-[2.6rem]">
            Made something cute? <span className="grad-text">Upload it. Get paid.</span>
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Two simple ways to earn on every original video you post — whether it&rsquo;s your first upload or your hundredth.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          {/* visual: kid creator + earnings */}
          <div className="reveal relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_20px_60px_-20px_rgba(34,31,61,0.35)] ring-1 ring-black/5">
              <img
                src="/images/upload-kid.webp"
                alt="A young creator filming his own video with a smartphone"
                className="aspect-[3/4] w-full rounded-[1.6rem] object-cover"
              />
              <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-red" /> Recording… 00:42
              </span>
              <div className="glass absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-xl bg-brand-blue-soft p-2"><Icons.UploadCloud size={16} className="text-brand-blue" /></span>
                  <div>
                    <p className="text-[11px] text-ink/60">Upload approved — reward credited</p>
                    <p className="text-sm font-bold text-ink">+{usd(reward)}</p>
                  </div>
                </div>
                <Icons.CheckCircle2 size={20} className="text-emerald-500" />
              </div>
            </div>
            {/* overlapping earnings card */}
            <div className="animate-floaty absolute -bottom-8 -right-2 w-40 rotate-3 overflow-hidden rounded-3xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 sm:-right-6 md:w-48" style={{ "--r": "3deg" } as React.CSSProperties}>
              <img
                src="/images/earn-kid.webp"
                alt="A young creator celebrating her earnings"
                className="aspect-[3/4] w-full rounded-[1.3rem] object-cover"
              />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-ink/75 px-3 py-2 backdrop-blur">
                <p className="text-[10px] text-white/70">This month</p>
                <p className="font-display text-lg font-bold text-white">$1,241.62</p>
              </div>
            </div>
            <span className="absolute -left-3 top-8 -rotate-6 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-pink shadow-md ring-1 ring-black/5">
              No follower minimums 🎉
            </span>
          </div>

          {/* earning cards + steps */}
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="reveal bento group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-pink/10 blur-xl" aria-hidden />
                <span className="inline-flex rounded-xl bg-brand-pink-soft p-3"><Icons.UploadCloud size={22} className="text-brand-pink" /></span>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Per approved upload</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-brand-pink">{usd(reward)}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  A one-time reward for every original video our team approves — credited automatically, exactly once per video.
                </p>
              </div>
              <div className="reveal bento group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-xl" style={{ transitionDelay: "80ms" }}>
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-blue/10 blur-xl" aria-hidden />
                <span className="inline-flex rounded-xl bg-brand-blue-soft p-3"><Icons.Eye size={22} className="text-brand-blue" /></span>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Per 1,000 qualified views</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-brand-blue">{usd(rate)}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  Real watch-time from real viewers — bots and refreshes never count. Calculated proportionally, never rounded down.
                </p>
              </div>
            </div>

            {/* mini flow */}
            <div className="reveal mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.title} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
                  <span className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl grad-btn text-white shadow">
                    <s.icon size={18} />
                    <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-ink shadow ring-1 ring-black/5">{i + 1}</span>
                  </span>
                  <p className="mt-2.5 text-[13px] font-bold">{s.title}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="reveal mt-5 flex flex-wrap gap-2">
              {chips.map(c => (
                <span key={c} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-black/5">
                  <Icons.CheckCircle2 size={12} className="mr-1 inline text-emerald-500" />
                  {c}
                </span>
              ))}
            </div>

            <div className="reveal mt-7 flex flex-wrap items-center gap-3">
              <PrimaryCTA to="/register">
                Start Uploading &amp; Earning <Icons.ArrowRight size={16} className="ml-1" />
              </PrimaryCTA>
              <SecondaryCTA to="/policies/monetization" size="default">
                Full monetization rules
              </SecondaryCTA>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
