"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import {
  SectionHeading, PrimaryCTA, SecondaryCTA, DemoBadge, PhoneMockup, BrowserMockup,
  StatCounter, CategoryIcon,
} from "@/components/shared/ui-bits";
import { Link } from "@/components/app/router";
import { get } from "@/lib/client";
import { usd, compact } from "@/lib/format";

// ── Section 7: Why join ────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Icons.Eye, color: "text-brand-red", bg: "bg-brand-red-soft", title: "Transparent earnings", desc: "Every qualified view and reward is itemized in an immutable ledger. You always see exactly where each cent came from." },
  { icon: Icons.BarChart3, color: "text-brand-blue", bg: "bg-brand-blue-soft", title: "Creator analytics", desc: "Track views, qualified views, likes, shares and per-video earnings with 7/30/90-day filters." },
  { icon: Icons.ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", title: "Originality protection", desc: "Every upload is fingerprinted — visual and audio — so nobody can re-upload your work and get paid for it." },
  { icon: Icons.Banknote, color: "text-brand-yellow", bg: "bg-brand-yellow-soft", title: "Fair, fast payouts", desc: "Withdraw from $25 via bank transfer or PayPal. Payout status is tracked end-to-end, no black boxes." },
  { icon: Icons.Users, color: "text-brand-red", bg: "bg-brand-red-soft", title: "Growth from day one", desc: "No follower minimums. New creators get discoverability in Explore and Trending from their very first upload." },
  { icon: Icons.Scale, color: "text-brand-blue", bg: "bg-brand-blue-soft", title: "You keep your rights", desc: "You own your content. We only license what's needed to host, stream and monetize it on the platform." },
];

export function WhyJoin() {
  return (
    <section className="py-16 md:py-24" aria-label="Why join our platform">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Why Clipora"
          title={<>Built for creators, <span className="grad-text">not advertisers</span></>}
          subtitle="Everything on Clipora is designed around one question: does this help creators earn more, fairly?"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(b => (
            <div key={b.title} className="reveal bento group p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className={`inline-flex rounded-xl ${b.bg} p-3 transition-transform group-hover:scale-110`}>
                <b.icon size={22} className={b.color} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sections 8 & 9: Earn per upload + earn per views ──────────────────────

export function EarnPerUpload({ reward = 0.5 }: { reward?: number }) {
  const steps = [
    { icon: Icons.UploadCloud, title: "Upload an original short", desc: "40–60 seconds, MP4 or MOV, up to 2 uploads per day." },
    { icon: Icons.Fingerprint, title: "We verify originality", desc: "SHA-256 checksums plus visual & audio fingerprinting catch re-uploads instantly." },
    { icon: Icons.CheckCircle2, title: "Get approved", desc: "Our team confirms the video meets content and originality standards." },
    { icon: Icons.BadgeDollarSign, title: "Reward credited once", desc: `A one-time $${reward.toFixed(2)} reward lands in your pending balance — per video, not per view.` },
  ];
  return (
    <section className="bg-surface py-16 md:py-24" aria-label="Earn per video upload">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-red-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-red">
              <Icons.UploadCloud size={13} /> Upload rewards
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-[2.4rem]">
              Get paid for every <span className="grad-text">approved original upload</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Original work deserves more than exposure. Every video our team approves earns a one-time reward —
              credited exactly once per video, automatically.
            </p>
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-sm font-semibold text-muted-foreground">Current reward per approved video</span>
                <span className="font-display text-3xl font-bold text-brand-red">{usd(reward)}</span>
              </div>
              <p className="pt-3 text-xs text-muted-foreground">
                Rates are set by the platform and shown live here. Historical earnings are never recalculated when rates change.
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {steps.map((s, i) => (
              <div key={s.title} className="reveal bento flex items-start gap-4 p-4 transition-all hover:translate-x-1">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow ring-1 ring-black/5">
                  <s.icon size={20} className="text-brand-red" />
                  <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full grad-btn text-[10px] font-bold text-white">{i + 1}</span>
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold">{s.title}</h3>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EarnFromViews({ rate = 1 }: { rate?: number }) {
  const chips = [
    "Real watch-time, not refreshes",
    "Bot & crawler views excluded",
    "Creator self-views never paid",
    "Per-viewer daily caps",
    "Auditable view records",
    "Proportional payouts — no rounding down",
  ];
  return (
    <section className="py-16 md:py-24" aria-label="Earn from video views">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal order-2 lg:order-1">
            <div className="bento overflow-hidden">
              <div className="bg-ink p-6 text-white">
                <p className="text-sm text-white/60">Views earnings formula</p>
                <div className="mt-3 space-y-2 font-mono text-sm">
                  <p><span className="text-brand-yellow">Views Earnings</span> = (Qualified Views ÷ 1,000) × Rate</p>
                  <p className="text-white/60">= (100,000 ÷ 1,000) × ${rate.toFixed(2)}</p>
                  <p className="text-2xl font-bold text-white">= {usd(100 * rate)} <span className="text-sm font-normal text-white/50">per 100K qualified views</span></p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm font-bold">What makes a view "qualified"?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map(c => (
                    <span key={c} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Each video earns view revenue for <strong className="text-ink">4 months</strong> from publication.
                  After that it stays public — it just stops generating new view earnings.
                </p>
              </div>
            </div>
          </div>
          <div className="reveal order-1 lg:order-2">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-blue-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue">
              <Icons.Eye size={13} /> View revenue
            </span>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-[2.4rem]">
              Every qualified view <span className="grad-text-blue">adds up</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              We only pay for views that matter — real people actually watching. That keeps rates sustainable
              and means your earnings aren't diluted by bots and refresh spam.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { v: 10000, l: "10K qualified views" },
                { v: 100000, l: "100K qualified views" },
                { v: 1000000, l: "1M qualified views" },
              ].map(s => (
                <div key={s.l} className="rounded-xl bg-brand-blue-soft p-4 text-center">
                  <p className="font-display text-xl font-bold text-brand-blue">
                    <StatCounter value={s.v * rate} prefix="$" decimals={0} />
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
            <PrimaryCTA to="/register" className="mt-7">
              Create Your Channel
            </PrimaryCTA>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 10: Creator success stories (illustrative) ────────────────────

const STORIES = [
  {
    name: "Maya Torres", role: "Lifestyle · 148K followers", avatar: "/images/avatars/av01.webp",
    quote: "I started posting morning-routine shorts between shifts. Eight months later, view earnings cover my rent — and the analytics finally show me which videos actually work.",
    metric: "$1,612 lifetime earnings",
  },
  {
    name: "Priya Sharma", role: "Food · 211K followers", avatar: "/images/avatars/av03.webp",
    quote: "The originality fingerprinting is what sold me. My recipes can't be re-uploaded by strangers for someone else's payout. That protection is priceless.",
    metric: "2 viral originals protected",
  },
  {
    name: "Daniel Okafor", role: "Education · 119K followers", avatar: "/images/avatars/av08.webp",
    quote: "Withdrawals just work. Request on Monday, money's in my bank by Thursday, with a reference number I can actually track.",
    metric: "12 on-time payouts",
  },
];

export function SuccessStories() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-label="Creator success stories">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Success stories"
          title={<>Creators growing with <span className="grad-text">Clipora</span></>}
          subtitle="Illustrative examples from our demo data — real testimonials and payout proof will appear here only with each creator's verified data and written permission."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {STORIES.map(s => (
            <figure key={s.name} className="reveal bento flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex text-brand-yellow" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, i) => <Icons.Star key={i} size={15} fill="currentColor" />)}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/85">“{s.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <img src={s.avatar} alt={s.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.role}</p>
                </div>
                <span className="ml-auto whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  {s.metric}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="reveal mt-5 flex justify-center">
          <DemoBadge />
        </div>
      </div>
    </section>
  );
}

// ── Section 11: Dashboard preview ─────────────────────────────────────────

export function DashboardPreview() {
  return (
    <section className="py-16 md:py-24" aria-label="Creator dashboard preview">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Creator studio"
          title={<>A dashboard that feels like a <span className="grad-text-blue">mission control</span></>}
          subtitle="Real-time earnings, qualified-view analytics and per-video performance — on desktop and on the go."
        />
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_380px]">
          <div className="reveal">
            <BrowserMockup url="clipora.io/dashboard">
              <div className="bg-surface p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold">Good morning, Maya 👋</p>
                    <p className="text-xs text-muted-foreground">Here's how your channel is performing</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Approved</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { l: "Total earnings", v: "$1,612.49", c: "text-brand-red", bg: "bg-brand-red-soft", icon: Icons.Banknote },
                    { l: "Available balance", v: "$616.83", c: "text-emerald-600", bg: "bg-emerald-50", icon: Icons.Wallet },
                    { l: "Qualified views", v: "1.59M", c: "text-brand-blue", bg: "bg-brand-blue-soft", icon: Icons.Eye },
                    { l: "This month", v: "$214.62", c: "text-brand-yellow", bg: "bg-brand-yellow-soft", icon: Icons.TrendingUp },
                  ].map(k => (
                    <div key={k.l} className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
                      <span className={`inline-flex rounded-lg ${k.bg} p-1.5`}><k.icon size={14} className={k.c} /></span>
                      <p className={`mt-2 font-display text-lg font-bold ${k.c}`}>{k.v}</p>
                      <p className="text-[10px] text-muted-foreground">{k.l}</p>
                    </div>
                  ))}
                </div>
                {/* mini chart */}
                <div className="mt-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold">Earnings — last 14 days</p>
                    <span className="rounded-full bg-brand-blue-soft px-2 py-0.5 text-[10px] font-bold text-brand-blue">+$12.40 today</span>
                  </div>
                  <div className="flex h-28 items-end gap-1.5">
                    {[24, 31, 28, 42, 38, 55, 47, 61, 53, 72, 64, 83, 71, 92].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md grad-btn" style={{ height: `${h}%`, opacity: 0.35 + (i / 14) * 0.65 }} />
                    ))}
                  </div>
                </div>
              </div>
            </BrowserMockup>
          </div>
          <div className="reveal space-y-4">
            <PhoneMockup>
              <div className="flex h-full flex-col bg-surface">
                <div className="bg-white px-4 pb-3 pt-8">
                  <p className="text-[10px] text-muted-foreground">Available balance</p>
                  <p className="font-display text-2xl font-bold text-emerald-600">$616.83</p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="flex-1 rounded-lg grad-btn py-1.5 text-center text-[10px] font-bold text-white">Withdraw</span>
                    <span className="flex-1 rounded-lg border py-1.5 text-center text-[10px] font-bold">History</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-hidden p-3">
                  {[
                    { t: "Qualified views · v14", a: "+$8.24", d: "2h ago" },
                    { t: "Upload reward · v02", a: "+$0.50", d: "3h ago" },
                    { t: "Qualified views · v12", a: "+$5.71", d: "5h ago" },
                    { t: "Payout PAY-3J7…", a: "-$250.00", d: "1d ago" },
                    { t: "Qualified views · v14", a: "+$11.02", d: "1d ago" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold">{r.t}</p>
                        <p className="text-[9px] text-muted-foreground">{r.d}</p>
                      </div>
                      <span className={`text-xs font-bold ${r.a.startsWith("+") ? "text-emerald-600" : "text-brand-red"}`}>{r.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PhoneMockup>
            <p className="text-center text-xs text-muted-foreground">
              <DemoBadge />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 12: Video categories ──────────────────────────────────────────

export function VideoCategories() {
  const [cats, setCats] = useState<{ name: string; slug: string; videoCount: number }[]>([]);
  useEffect(() => {
    get<{ categories: { name: string; slug: string; videoCount: number }[] }>("/public/categories")
      .then(d => setCats(d.categories.filter(c => c.videoCount > 0))).catch(() => {});
  }, []);
  const display = cats.length > 0
    ? cats
    : ["Entertainment", "Comedy", "Lifestyle", "Education", "Food", "Travel", "Technology", "Fitness", "Beauty", "Music", "Pets", "Fashion"].map(name => ({ name, slug: name.toLowerCase(), videoCount: 0 }));

  return (
    <section className="bg-surface py-16 md:py-24" aria-label="Video categories">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Find your niche"
          title={<>Every category has an <span className="grad-text">audience</span></>}
          subtitle="From food to fintech — pick your lane, or invent your own. Categories power discovery in Explore and Trending."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {display.slice(0, 12).map((c, i) => (
            <Link
              key={c.slug} to={`/explore?category=${c.slug}`}
              className="reveal bento group flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`rounded-xl p-2.5 ${i % 3 === 0 ? "bg-brand-red-soft" : i % 3 === 1 ? "bg-brand-blue-soft" : "bg-brand-yellow-soft"}`}>
                <CategoryIcon name={c.name} size={19} className={i % 3 === 0 ? "text-brand-red" : i % 3 === 1 ? "text-brand-blue" : "text-brand-yellow"} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold group-hover:text-brand-red">{c.name}</p>
                <p className="text-xs text-muted-foreground">{compact(c.videoCount)} videos</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section 13: Creator community ─────────────────────────────────────────

export function CreatorCommunity() {
  const [creators, setCreators] = useState<{ avatarUrl: string | null; username: string }[]>([]);
  useEffect(() => {
    get<{ videos: { creator: { avatarUrl: string | null; username: string } }[] }>("/public/videos?limit=24")
      .then(d => {
        const seen = new Set<string>();
        setCreators(d.videos.map(v => v.creator).filter(c => !seen.has(c.username) && seen.add(c.username)));
      }).catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden py-16 md:py-24" aria-label="Creator community">
      <div className="mesh-bg absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Creator community"
          title={<>You'll be in good <span className="grad-text">company</span></>}
          subtitle="Thousands of creators publish on Clipora every week — sharing techniques, hosting challenges and lifting each other up."
        />
        {/* avatar marquee */}
        <div className="reveal relative mx-auto mb-10 max-w-3xl overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="animate-marquee flex w-max gap-4">
            {[...creators, ...creators].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                {c.avatarUrl
                  ? <img src={c.avatarUrl} alt={`@${c.username}`} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white shadow-md" />
                  : <span className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-red/70 to-brand-blue/70" />}
                <span className="text-[11px] font-semibold text-muted-foreground">@{c.username}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal grid gap-4 sm:grid-cols-3">
          {[
            { icon: Icons.MessageSquareHeart, title: "Creator spaces", desc: "Category channels where creators swap editing tips, hooks and growth tactics." },
            { icon: Icons.Trophy, title: "Weekly challenges", desc: "Themed challenges with featured placement in Explore for the best originals." },
            { icon: Icons.HandHeart, title: "Creator-first support", desc: "Real humans answering monetization, payout and policy questions within a day." },
          ].map(f => (
            <div key={f.title} className="bento p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow ring-1 ring-black/5">
                <f.icon size={22} className="text-brand-red" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold">{f.title}</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryCTA to="/register">Apply as a Creator</PrimaryCTA>
          <SecondaryCTA to="/explore">Browse the Community</SecondaryCTA>
        </div>
      </div>
    </section>
  );
}
