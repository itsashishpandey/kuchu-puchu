"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import {
  PrimaryCTA, SecondaryCTA, StatCounter, SectionHeading, ANDROID_APK_URL, ANDROID_APK_NOTE,
} from "@/components/shared/ui-bits";
import { get } from "@/lib/client";
import { compact, usd } from "@/lib/format";
import { usePublicSettings, money, unlockTarget, lengthRange, type PublicSettings } from "@/lib/use-public-settings";

// ── Section 1: Hero — video-first, creator-appeal ─────────────────────────

const HERO_CARDS = [
  {
    file: "/videos/v10.mp4", poster: "/images/thumbs/th10.webp",
    title: "Dino's Rainy Day Puddle Jump",
  },
  {
    file: "/videos/v14.mp4", poster: "/images/thumbs/th14.webp",
    title: "Rocket Trip to Candy Planet",
  },
  {
    file: "/videos/v03.mp4", poster: "/images/thumbs/th03.webp",
    title: "The Kuchu Puchu Dance Party!",
  },
];

function HeroVideoCard({
  v, className, size = "md",
}: {
  v: typeof HERO_CARDS[number]; className?: string; size?: "md" | "lg";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  return (
    <div
      className={`group relative aspect-[9/16] select-none overflow-hidden rounded-[1.4rem] bg-ink shadow-xl ring-1 ring-white/40 transition-transform duration-500 ${
        size === "lg" ? "w-44 sm:w-52 md:w-60" : "w-36 sm:w-44 md:w-48"
      } ${className ?? ""}`}
    >
      <video
        ref={ref} src={v.file} poster={v.poster}
        muted loop playsInline autoPlay preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/25" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-white/90">{v.title}</p>
      </div>
    </div>
  );
}

export function Hero({ announcement }: { announcement?: string }) {
  const live = usePublicSettings();
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

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 md:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-24 lg:pt-16">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue ring-1 ring-brand-blue/25">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
              </span>
              Creators are earning right now
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
              <Icons.ShieldCheck size={13} /> Made for kids aged 3–8
            </span>
          </div>

          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] md:text-6xl">
            Create Videos.<br />
            Get Views.<br />
            <span className="grad-text">Earn Real Money.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg">
            Kuchu Puchu is the safe video platform made only for kids aged 3–8 — and it pays the
            creators who make it. Upload original short cartoons, rhymes and stories ({lengthRange(live)}). Once your
            channel gets {unlockTarget(live)}, earn on every qualified view plus a reward for every
            approved upload.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryCTA to="/register">
              <Icons.UploadCloud size={17} className="mr-1" /> Upload Videos &amp; Earn
            </PrimaryCTA>
            <SecondaryCTA to="/feed">
              <Icons.Play size={16} className="mr-1" fill="currentColor" /> Watch Videos
            </SecondaryCTA>
            <a
              href={ANDROID_APK_URL}
              download
              className="inline-flex h-12 items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            >
              <Icons.Smartphone size={16} /> Get the Android app
            </a>
          </div>
          <p className="mt-2.5 text-xs text-ink/55">{ANDROID_APK_NOTE}</p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Per 1,000 qualified views", value: usd(live.ratePer1000Views) },
              { label: "Per approved upload", value: usd(live.rewardPerUpload) },
              { label: "Payout methods", value: "Bank + PayPal" },
            ].map(s => (
              <div key={s.label} className="glass min-w-0 rounded-xl px-2 py-2.5 sm:px-3.5 sm:py-3">
                <p className="truncate font-display text-sm font-bold grad-text sm:text-lg">{s.value}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-ink/60 sm:text-[11px]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── video card collage — the platform, alive ── */}
        <div className="relative">
          {/* desktop collage */}
          <div className="relative hidden h-[540px] items-center justify-center lg:flex">
            <div className="absolute left-0 top-6 z-0 -rotate-6 opacity-90 transition-transform duration-500 hover:-rotate-2 hover:opacity-100">
              <HeroVideoCard v={HERO_CARDS[0]} />
            </div>
            <div className="absolute right-0 top-2 z-0 rotate-6 opacity-90 transition-transform duration-500 hover:rotate-2 hover:opacity-100">
              <HeroVideoCard v={HERO_CARDS[2]} />
            </div>
            <div className="z-10 -translate-y-3 drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
              <HeroVideoCard v={HERO_CARDS[1]} size="lg" />
            </div>

          </div>

          {/* mobile / tablet: snap-scroll strip */}
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:hidden">
            {HERO_CARDS.map(v => (
              <div key={v.file} className="snap-center">
                <HeroVideoCard v={v} size="lg" className="!w-44" />
              </div>
            ))}
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

// ── Section 2: Live platform stats (compact band) ──────────────────────────

type Stats = {
  totalCreators: number; approvedCreators: number; activeCreators: number;
  totalVideos: number; totalViews: number; qualifiedViews: number;
  totalPaidOut: number; lifetimeCreatorEarnings: number;
};

export function StatsBand() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    get<Stats>("/public/stats").then(setStats).catch(() => {});
  }, []);

  const cards = [
    {
      icon: Icons.Banknote, label: "Paid to creators", accent: "text-brand-pink", bg: "bg-brand-pink-soft",
      render: stats
        ? <span className="text-2xl md:text-3xl"><StatCounter value={stats.totalPaidOut} prefix="$" decimals={0} /></span>
        : <span className="shimmer inline-block h-8 w-28 rounded-lg align-middle" />,
    },
    {
      icon: Icons.Users, label: "Active creators", accent: "text-brand-blue", bg: "bg-brand-blue-soft",
      render: stats
        ? <span className="text-2xl md:text-3xl"><StatCounter value={stats.approvedCreators} /></span>
        : <span className="shimmer inline-block h-8 w-24 rounded-lg align-middle" />,
    },
    {
      icon: Icons.Video, label: "Videos published", accent: "text-brand-yellow", bg: "bg-brand-yellow-soft",
      render: stats
        ? <span className="text-2xl md:text-3xl"><StatCounter value={stats.totalVideos} /></span>
        : <span className="shimmer inline-block h-8 w-24 rounded-lg align-middle" />,
    },
    {
      icon: Icons.Eye, label: "Qualified views", accent: "text-emerald-600", bg: "bg-emerald-50",
      render: stats
        ? <span className="text-2xl md:text-3xl"><StatCounter value={stats.qualifiedViews} /></span>
        : <span className="shimmer inline-block h-8 w-24 rounded-lg align-middle" />,
    },
  ];

  if (!stats || (stats.totalVideos === 0 && stats.approvedCreators === 0 && stats.totalPaidOut === 0)) return null;

  return (
    <section className="py-10 md:py-14" aria-label="Live platform stats">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(c => (
            <div key={c.label} className="reveal bento flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <span className={`inline-flex shrink-0 rounded-xl ${c.bg} p-3`}><c.icon size={20} className={c.accent} /></span>
              <div className="min-w-0">
                <div className="font-display font-bold text-ink">{c.render}</div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="reveal mt-4 text-center text-[11px] text-muted-foreground">
          <Icons.Info size={12} className="mr-1 inline" />
          Live counters from the platform database. Payout totals only include completed withdrawals.
        </p>
      </div>
    </section>
  );
}

// ── Section 3: How it works ────────────────────────────────────────────────

const steps = (s: PublicSettings) => [
  { icon: Icons.UserPlus, title: "Sign Up", desc: "Create your kids-content channel in under 3 minutes. Pick your category and tell us about your videos." },
  { icon: Icons.ShieldCheck, title: "Get Approved", desc: "Our team reviews every application — usually within 2 business days — to keep content original and safe for little viewers." },
  { icon: Icons.UploadCloud, title: "Upload Videos", desc: `Post original ${lengthRange(s, "-second")} cartoons, rhymes and stories. Every upload is fingerprinted to protect originality.` },
  { icon: Icons.DollarSign, title: "Earn Money", desc: `Once your channel unlocks earning (${unlockTarget(s)}), get ${usd(s.ratePer1000Views)} per 1,000 qualified views plus ${usd(s.rewardPerUpload)} for every approved upload. Watch earnings credit in real time.` },
  { icon: Icons.Banknote, title: "Withdraw", desc: `Request payouts to your bank or PayPal once your available balance reaches ${money(s.minWithdrawalAmount)}. No lock-in, ever.` },
];

export function HowItWorks() {
  const live = usePublicSettings();
  return (
    <section className="bg-surface py-14 md:py-20" aria-label="How it works">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="How it works"
          title={<>From sign-up to <span className="grad-text-blue">first payout</span></>}
          subtitle={`Five steps. No follower minimums, no invitation codes — reach ${unlockTarget(live)} once and earning stays unlocked.`}
        />
        <div className="relative grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-brand-blue/25 lg:block" aria-hidden />
          {steps(live).map((s, i) => (
            <div key={s.title} className="reveal bento relative p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                <s.icon size={30} className={i % 2 === 0 ? "text-brand-blue" : "text-brand-pink"} />
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
