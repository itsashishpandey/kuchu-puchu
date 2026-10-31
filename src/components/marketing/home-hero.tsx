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
  const bgRef = useRef<HTMLVideoElement>(null);
  const phoneRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    bgRef.current?.play().catch(() => {});
    phoneRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {/* background video layer */}
      <div className="absolute inset-0" aria-hidden>
        <video
          ref={bgRef} muted loop playsInline preload="metadata"
          className="h-full w-full scale-110 object-cover opacity-25"
          src="/videos/v14.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(52rem 30rem at 20% 10%, rgba(255,23,68,0.22), transparent 60%), radial-gradient(44rem 26rem at 90% 80%, rgba(22,119,255,0.25), transparent 60%)" }} />
      </div>

      {announcement && (
        <div className="relative z-10 flex justify-center pt-16">
          <div className="glass-dark flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white/90">
            <Icons.Sparkles size={13} className="text-brand-yellow" />
            {announcement}
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-20">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-brand-red/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-red" />
              </span>
              Creators are earning right now
            </span>
            <DemoBadge className="!bg-white/10 !text-white/75" />
          </div>

          <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] md:text-6xl">
            Create Videos.<br />
            Get Views.<br />
            <span className="grad-text">Earn Real Money.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            Clipora pays you for every qualified view and every approved original upload.
            No follower minimums, no gatekeeping — just your creativity, fairly rewarded from day one.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryCTA to="/register">
              Become a Creator <Icons.ArrowRight size={17} className="ml-1" />
            </PrimaryCTA>
            <SecondaryCTA to="/feed" className="!border-white/20 !bg-white/5 !text-white hover:!border-white/40 hover:!text-white">
              <Icons.Play size={16} className="mr-1" fill="currentColor" /> Explore Videos
            </SecondaryCTA>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {[
              { label: "Per 1,000 qualified views", value: "$1.00" },
              { label: "Per approved upload", value: "$0.50" },
              { label: "Payout methods", value: "Bank + PayPal" },
            ].map(s => (
              <div key={s.label} className="glass-dark rounded-xl px-3.5 py-3">
                <p className="font-display text-lg font-bold text-brand-yellow">{s.value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-white/65">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* phone mockup with live video */}
        <div className="relative hidden lg:block">
          <div className="animate-floaty" style={{ "--r": "2deg" } as React.CSSProperties}>
            <PhoneMockup>
              <video
                ref={phoneRef} muted loop playsInline
                className="h-full w-full object-cover"
                src="/videos/v03.mp4"
                poster="/images/thumbs/th03.webp"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-4 pt-16">
                <div className="flex items-center gap-2.5">
                  <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-red to-brand-yellow ring-2 ring-white/60" />
                  <div>
                    <p className="text-sm font-bold">@marcusgroove</p>
                    <p className="text-[11px] text-white/70">Sunset Freestyle in Downtown LA</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-white/85">
                  <span className="flex items-center gap-1 text-xs"><Icons.Heart size={15} /> 112K</span>
                  <span className="flex items-center gap-1 text-xs"><Icons.MessageCircle size={15} /> 2.1K</span>
                  <span className="flex items-center gap-1 text-xs"><Icons.Share2 size={15} /> 9.8K</span>
                </div>
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Earning
              </div>
            </PhoneMockup>
          </div>

          {/* floating glass cards */}
          <div className="glass-dark animate-floaty absolute -left-10 top-8 z-20 rounded-2xl p-4" style={{ animationDelay: "0.8s", "--r": "-3deg" } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-400/15 p-2.5"><Icons.TrendingUp size={18} className="text-emerald-400" /></span>
              <div>
                <p className="text-[11px] text-white/60">Qualified views today</p>
                <p className="font-display text-lg font-bold"><StatCounter value={28412} /> </p>
              </div>
            </div>
          </div>
          <div className="glass-dark animate-floaty absolute -right-6 bottom-24 z-20 rounded-2xl p-4" style={{ animationDelay: "1.6s", "--r": "2deg" } as React.CSSProperties}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-brand-yellow/15 p-2.5"><Icons.Wallet size={18} className="text-brand-yellow" /></span>
              <div>
                <p className="text-[11px] text-white/60">Payout sent</p>
                <p className="font-display text-lg font-bold">$600.00</p>
              </div>
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
          eyebrow="Live on Clipora"
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
  { icon: Icons.UserPlus, title: "Sign Up", desc: "Create your account and channel in under 3 minutes. Pick your category and tell us about your content." },
  { icon: Icons.ShieldCheck, title: "Get Approved", desc: "Our team reviews every application — usually within 2 business days — to keep the platform original and safe." },
  { icon: Icons.UploadCloud, title: "Upload Videos", desc: "Post original 40–60 second shorts. Every upload is fingerprinted to protect originality for everyone." },
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
