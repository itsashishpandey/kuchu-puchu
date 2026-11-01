"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import {
  SectionHeading, PrimaryCTA, SecondaryCTA, DemoBadge, PhoneMockup, BrowserMockup,
  CategoryIcon,
} from "@/components/shared/ui-bits";
import { Link } from "@/components/app/router";
import { get } from "@/lib/client";
import { compact } from "@/lib/format";

// ── Section 10: Creator success stories (illustrative) ────────────────────

const STORIES = [
  {
    name: "Meera Iyer", role: "Nursery Rhymes · 211K followers", avatar: "/images/avatars/av02.webp",
    quote: "I started posting sing-along rhymes with my daughter. Eight months later, view earnings cover her school fees — and the analytics show me exactly which songs kids love most.",
    metric: "$1,612 lifetime earnings",
  },
  {
    name: "Aarav Mehta", role: "Cartoons & Animation · 148K followers", avatar: "/images/avatars/av01.webp",
    quote: "The originality fingerprinting is what sold me. My hand-drawn Kuchu cartoons can't be re-uploaded by strangers for someone else's payout. That protection is priceless.",
    metric: "2 viral originals protected",
  },
  {
    name: "Riya Sharma", role: "Story Time · 188K followers", avatar: "/images/avatars/av04.webp",
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
          title={<>Creators growing with <span className="grad-text">Kuchu Puchu</span></>}
          subtitle="Illustrative examples from our demo data — real testimonials and payout proof will appear here only with each creator's verified data and written permission."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {STORIES.map(s => (
            <figure key={s.name} className="reveal bento flex flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex text-brand-yellow" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, i) => <Icons.Star key={i} size={15} fill="currentColor" />)}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/85">“{s.quote}”</blockquote>
              <figcaption className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
                <img src={s.avatar} alt={s.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.role}</p>
                </div>
                <span className="w-full rounded-full bg-emerald-50 px-2.5 py-1 text-center text-[11px] font-bold text-emerald-700 sm:ml-auto sm:w-auto sm:whitespace-nowrap">
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
            <BrowserMockup url="kuchupuchu.com/dashboard">
              <div className="bg-surface p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold">Good morning, Meera 👋</p>
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

// ── Section 12: Video categories (image-cover tiles) ──────────────────────

const CAT_THUMB: Record<string, string> = {
  "Cartoons & Animation": "/images/thumbs/th14.webp",
  "Nursery Rhymes": "/images/thumbs/th12.webp",
  "Kids Comedy": "/images/thumbs/th11.webp",
  "Learning & Fun": "/images/thumbs/th10.webp",
  "Story Time": "/images/thumbs/th09.webp",
  "Kids Songs": "/images/thumbs/th07.webp",
  "Toys & Play": "/images/thumbs/th06.webp",
  "Animals & Friends": "/images/thumbs/th15.webp",
  "Arts & Crafts": "/images/thumbs/th08.webp",
  "Dance & Fun": "/images/thumbs/th03.webp",
  "Family Adventures": "/images/thumbs/th16.webp",
  "Science for Kids": "/images/thumbs/th01.webp",
};

export function VideoCategories() {
  const [cats, setCats] = useState<{ name: string; slug: string; videoCount: number }[]>([]);
  useEffect(() => {
    get<{ categories: { name: string; slug: string; videoCount: number }[] }>("/public/categories")
      .then(d => setCats(d.categories.filter(c => c.videoCount > 0))).catch(() => {});
  }, []);
  const display = cats.length > 0
    ? cats
    : Object.keys(CAT_THUMB).map(name => ({ name, slug: name.toLowerCase(), videoCount: 0 }));

  return (
    <section className="bg-surface py-16 md:py-24" aria-label="Video categories">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Find your niche"
          title={<>Every category has an <span className="grad-text">audience</span></>}
          subtitle="From cartoons to counting songs — pick your lane, or invent your own. Categories power discovery in Explore and Trending."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {display.slice(0, 12).map((c, i) => (
            <Link
              key={c.slug} to={`/explore?category=${c.slug}`}
              className="reveal group relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{ transitionDelay: `${(i % 4) * 40}ms` }}
            >
              <img
                src={CAT_THUMB[c.name] ?? "/images/thumbs/th14.webp"} alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-bold text-white">
                    <CategoryIcon name={c.name} size={15} className="shrink-0 text-brand-yellow" />
                    <span className="truncate">{c.name}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/70">{compact(c.videoCount)} videos</p>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition group-hover:bg-white group-hover:text-ink">
                  <Icons.ArrowUpRight size={14} />
                </span>
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
          subtitle="Thousands of kids-content creators publish on Kuchu Puchu every week — sharing animation tips, hosting challenges and lifting each other up."
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
        <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* kuchu kids visual */}
          <div className="reveal relative mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-xl ring-1 ring-black/5">
              <img
                src="/images/hero-kids.webp"
                alt="Two young Kuchu Puchu creators celebrating their channel"
                className="aspect-[3/4] w-full rounded-[1.6rem] object-cover"
              />
            </div>
            <span className="absolute -right-3 top-8 rotate-3 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-blue shadow-md ring-1 ring-black/5">
              12K+ creators 🎉
            </span>
            <span className="absolute -left-3 bottom-10 -rotate-3 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-pink shadow-md ring-1 ring-black/5">
              Free to join
            </span>
          </div>
          <div className="reveal grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: Icons.MessageSquareHeart, title: "Creator spaces", desc: "Category channels where creators swap animation tips, story ideas and growth tactics." },
              { icon: Icons.Trophy, title: "Weekly challenges", desc: "Themed challenges with featured placement in Explore for the best originals." },
              { icon: Icons.HandHeart, title: "Creator-first support", desc: "Real humans answering monetization, payout and policy questions within a day." },
            ].map(f => (
              <div key={f.title} className="bento flex items-start gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow ring-1 ring-black/5">
                  <f.icon size={22} className="text-brand-pink" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold">{f.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryCTA to="/register">Apply as a Creator</PrimaryCTA>
          <SecondaryCTA to="/explore">Browse the Community</SecondaryCTA>
        </div>
      </div>
    </section>
  );
}
