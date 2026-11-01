"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useRoute, navigate, Link } from "@/components/app/router";
import {
  PrimaryCTA, SecondaryCTA, StatCounter, DemoBadge, PhoneMockup, SectionHeading,
} from "@/components/shared/ui-bits";
import { get } from "@/lib/client";
import { usd, compact } from "@/lib/format";

// ── Section 1: Hero ─────────────────────────────────────────────────────────

export function Hero({ announcement }: { announcement?: string }) {
  const phoneRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    phoneRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden mesh-bg pt-16" aria-label="Hero">
      {/* playful floating decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <span className="animate-bounce-soft absolute left-[6%] top-[18%] text-3xl opacity-60">🎈</span>
        <span className="animate-bounce-soft absolute right-[10%] top-[14%] text-3xl opacity-60" style={{ animationDelay: "0.7s" }}>⭐</span>
        <span className="animate-wiggle absolute left-[14%] bottom-[16%] text-3xl opacity-50">🧸</span>
        <span className="animate-bounce-soft absolute right-[6%] bottom-[24%] text-3xl opacity-60" style={{ animationDelay: "1.3s" }}>🦄</span>
        <span className="animate-wiggle absolute left-[42%] top-[8%] text-2xl opacity-40" style={{ animationDelay: "0.4s" }}>🌈</span>
        <span className="absolute left-[24%] top-[38%] h-3 w-3 rounded-full bg-brand-pink/40" />
        <span className="absolute right-[30%] top-[30%] h-2 w-2 rounded-full bg-brand-blue/40" />
        <span className="absolute bottom-[12%] left-[38%] h-2.5 w-2.5 rounded-full bg-brand-yellow/60" />
      </div>

      {announcement && (
        <div className="relative z-10 flex justify-center pt-6">
          <div className="glass flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-ink shadow-sm">
            <Icons.Sparkles size={13} className="text-brand-pink" />
            {announcement}
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 md:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:pb-24 lg:pt-16">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue ring-1 ring-brand-blue/25">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
              </span>
              Creators are earning right now
            </span>
            <DemoBadge className="!bg-white/80 !text-brand-blue" />
          </div>

          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] md:text-6xl">
            Create Kids Videos.<br />
            Get Views.<br />
            <span className="grad-text">Earn Real Money.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg">
            Kuchu Puchu pays kids-content creators for every qualified view and every approved
            original upload. Cartoons, rhymes, stories and fun — no follower minimums, just your
            creativity, fairly rewarded from day one.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryCTA to="/register">
              Become a Creator <Icons.ArrowRight size={17} className="ml-1" />
            </PrimaryCTA>
            <SecondaryCTA to="/feed">
              <Icons.Play size={16} className="mr-1" fill="currentColor" /> Watch Kids Videos
            </SecondaryCTA>
          </div>

          {/* social proof */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-2.5">
              {["av02", "av01", "av04", "av07", "av12"].map(a => (
                <img
                  key={a} src={`/images/avatars/${a}.webp`} alt="Kuchu Puchu creator"
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow"
                />
              ))}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-pink text-[10px] font-bold text-white ring-2 ring-white">
                12K+
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-brand-yellow">
                {Array.from({ length: 5 }).map((_, i) => <Icons.Star key={i} size={15} fill="currentColor" />)}
                <span className="ml-1.5 text-xs font-bold text-ink">4.9/5</span>
              </div>
              <p className="text-xs text-muted-foreground">from 2,300+ creator reviews</p>
            </div>
          </div>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {[
              { label: "Per 1,000 qualified views", value: "$1.00" },
              { label: "Per approved upload", value: "$0.50" },
              { label: "Payout methods", value: "Bank + PayPal" },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl px-3.5 py-3">
                <p className="font-display text-lg font-bold grad-text">{s.value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-ink/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* phone mockup with live video + floating creator cards */}
        <div className="relative hidden lg:block">
          <div className="animate-floaty" style={{ "--r": "2deg" } as React.CSSProperties}>
            <PhoneMockup>
              <video
                ref={phoneRef} muted loop playsInline
                className="h-full w-full object-cover"
                src="/videos/v14.mp4"
                poster="/images/thumbs/th14.webp"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-4 pt-16">
                <div className="flex items-center gap-2.5">
                  <img src="/images/avatars/av02.webp" alt="Meera's Playtime" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/60" />
                  <div>
                    <p className="text-sm font-bold">@meeraplaytime</p>
                    <p className="text-[11px] text-white/70">Rocket Trip to Candy Planet 🚀</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-white/85">
                  <span className="flex items-center gap-1 text-xs"><Icons.Heart size={15} /> 198K</span>
                  <span className="flex items-center gap-1 text-xs"><Icons.MessageCircle size={15} /> 2.1K</span>
                  <span className="flex items-center gap-1 text-xs"><Icons.Share2 size={15} /> 9.8K</span>
                </div>
              </div>
              <div className="absolute right-3 top-3 rounded-full grad-btn px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Earning
              </div>
            </PhoneMockup>
          </div>

          {/* floating glass cards — earnings highlights */}
          <div className="glass animate-floaty absolute -left-10 top-8 z-20 rounded-2xl p-4 shadow-lg" style={{ animationDelay: "0.8s", "--r": "-3deg" } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-brand-blue/10 p-2.5"><Icons.TrendingUp size={18} className="text-brand-blue" /></span>
              <div>
                <p className="text-[11px] text-ink/60">Qualified views today</p>
                <p className="font-display text-lg font-bold text-ink"><StatCounter value={28412} /></p>
              </div>
            </div>
          </div>
          <div className="glass animate-floaty absolute -right-6 bottom-24 z-20 rounded-2xl p-4 shadow-lg" style={{ animationDelay: "1.6s", "--r": "2deg" } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-brand-pink/10 p-2.5"><Icons.Wallet size={18} className="text-brand-pink" /></span>
              <div>
                <p className="text-[11px] text-ink/60">Payout sent</p>
                <p className="font-display text-lg font-bold text-ink">$600.00</p>
              </div>
            </div>
          </div>
          {/* mini creator cards */}
          <div className="glass animate-floaty absolute -left-4 bottom-6 z-20 flex items-center gap-2.5 rounded-2xl p-3 shadow-lg" style={{ animationDelay: "1.1s", "--r": "1deg" } as React.CSSProperties}>
            <img src="/images/avatars/av04.webp" alt="Bunny Bloom Tales" className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-pink/30" />
            <div>
              <p className="text-xs font-bold text-ink">Bunny Bloom Tales</p>
              <p className="text-[11px] font-semibold text-brand-pink">$1,240 this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* wave divider */}
      <div className="relative z-10 -mb-px">
        <svg viewBox="0 0 1440 70" className="block h-[52px] w-full fill-background md:h-[70px]" aria-hidden>
          <path d="M0,70 C240,10 480,0 720,30 C960,60 1200,60 1440,20 L1440,70 Z" />
        </svg>
      </div>
    </section>
  );
}

// ── Section 2: Live creator earnings (real platform data) ──────────────────

type Stats = {
  totalCreators: number; approvedCreators: number; activeCreators: number;
  totalVideos: number; totalViews: number; qualifiedViews: number;
  totalPaidOut: number; lifetimeCreatorEarnings: number;
};

export function LiveEarnings() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    get<Stats>("/public/stats").then(setStats).catch(() => {});
  }, []);

  const cards = [
    {
      icon: Icons.Banknote, label: "Total creator payouts", accent: "text-brand-red", bg: "bg-brand-red-soft",
      render: stats
        ? <span className="text-3xl md:text-4xl"><StatCounter value={stats.totalPaidOut} prefix="$" decimals={0} /></span>
        : <span className="shimmer inline-block h-10 w-40 rounded-lg align-middle" />,
    },
    {
      icon: Icons.Users, label: "Active creators", accent: "text-brand-blue", bg: "bg-brand-blue-soft",
      render: stats
        ? <span className="text-3xl md:text-4xl"><StatCounter value={stats.approvedCreators} /></span>
        : <span className="shimmer inline-block h-10 w-32 rounded-lg align-middle" />,
    },
    {
      icon: Icons.Video, label: "Videos published", accent: "text-brand-yellow", bg: "bg-brand-yellow-soft",
      render: stats
        ? <span className="text-3xl md:text-4xl"><StatCounter value={stats.totalVideos} /></span>
        : <span className="shimmer inline-block h-10 w-32 rounded-lg align-middle" />,
    },
    {
      icon: Icons.Eye, label: "Qualified views", accent: "text-emerald-600", bg: "bg-emerald-50",
      render: stats
        ? <span className="text-3xl md:text-4xl"><StatCounter value={stats.qualifiedViews} /></span>
        : <span className="shimmer inline-block h-10 w-32 rounded-lg align-middle" />,
    },
  ];

  return (
    <section className="py-16 md:py-24" aria-label="Live creator earnings">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Live on Kuchu Puchu"
          title={<>Real numbers, <span className="grad-text">real payouts</span></>}
          subtitle="Counters update from live platform data. Payout totals only include completed withdrawals paid to creators."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="reveal bento group p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className={`inline-flex rounded-xl ${c.bg} p-3`}><c.icon size={22} className={c.accent} /></span>
              <div className="mt-4 font-display font-bold text-ink">{c.render}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
        <p className="reveal mt-5 text-center text-xs text-muted-foreground">
          <Icons.Info size={12} className="mr-1 inline" />
          Demo environment: figures reflect the platform database, which currently contains clearly-labeled sample data.
        </p>
      </div>
    </section>
  );
}

// ── Section 3: How it works ────────────────────────────────────────────────

const STEPS = [
  { icon: Icons.UserPlus, title: "Sign Up", desc: "Create your kids-content channel in under 3 minutes. Pick your category and tell us about your videos." },
  { icon: Icons.ShieldCheck, title: "Get Approved", desc: "Our team reviews every application — usually within 2 business days — to keep content original and safe for little viewers." },
  { icon: Icons.UploadCloud, title: "Upload Videos", desc: "Post original 40–60 second cartoons, rhymes and stories. Every upload is fingerprinted to protect originality." },
  { icon: Icons.DollarSign, title: "Earn Money", desc: "Get $1.00 per 1,000 qualified views plus $0.50 for every approved upload. Watch earnings credit in real time." },
  { icon: Icons.Banknote, title: "Withdraw", desc: "Request payouts to your bank or PayPal once your available balance passes $25. No lock-in, ever." },
];

export function HowItWorks() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-label="How it works">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="How it works"
          title={<>From sign-up to <span className="grad-text-blue">first payout</span></>}
          subtitle="Five steps. No follower minimums, no invitation codes — every original creator starts earning on day one."
        />
        <div className="relative grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-brand-red/25 lg:block" aria-hidden />
          {STEPS.map((s, i) => (
            <div key={s.title} className="reveal bento relative p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                <s.icon size={30} className={i % 2 === 0 ? "text-brand-red" : "text-brand-blue"} />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full grad-btn text-xs font-bold text-white shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
