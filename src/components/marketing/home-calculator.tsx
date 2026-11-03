"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { SectionHeading, PrimaryCTA, CategoryIcon } from "@/components/shared/ui-bits";
import { Link } from "@/components/app/router";
import { get } from "@/lib/client";
import { usd, compact } from "@/lib/format";
import { Slider } from "@/components/ui/slider";

// ── Section 4 + 12: Earnings calculator ────────────────────────────────────

export function EarningsCalculator() {
  const [views, setViews] = useState(100000);
  const [uploads, setUploads] = useState(10);
  const [rates, setRates] = useState<{ ratePer1000Views: number; rewardPerUpload: number; rewardPerUploadInr?: number; minMonthlyChannelViews?: number } | null>(null);

  useEffect(() => {
    get<{ ratePer1000Views: number; rewardPerUpload: number; rewardPerUploadInr: number; minMonthlyChannelViews: number }>("/public/settings")
      .then(setRates).catch(() => setRates({ ratePer1000Views: 1, rewardPerUpload: 0.32, rewardPerUploadInr: 30, minMonthlyChannelViews: 2500 }));
  }, []);

  const rate = rates?.ratePer1000Views ?? 1;
  const reward = rates?.rewardPerUpload ?? 0.32;
  const viewEarnings = (views / 1000) * rate;
  const uploadEarnings = uploads * reward;
  const total = viewEarnings + uploadEarnings;

  return (
    <section className="py-16 md:py-24" aria-label="Earnings calculator">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Your Videos Could Be Your Next Income Stream"
          title={<>Calculate your <span className="grad-text">potential earnings</span></>}
          subtitle="Move the sliders to estimate what your content could earn. Estimates assume all views qualify and all uploads are approved originals."
        />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* interactive calculator */}
          <div className="reveal bento p-6 md:p-8">
            <div className="mb-8">
              <div className="mb-3 flex items-end justify-between">
                <label htmlFor="views-slider" className="text-sm font-semibold">Estimated qualified views</label>
                <span className="font-display text-2xl font-bold text-brand-blue">{compact(views)}</span>
              </div>
              <Slider
                id="views-slider"
                value={[views]} min={1000} max={1000000} step={1000}
                onValueChange={([v]) => setViews(v)}
                aria-label="Estimated qualified views"
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>1K</span><span>250K</span><span>500K</span><span>1M</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-3 flex items-end justify-between">
                <label htmlFor="uploads-slider" className="text-sm font-semibold">Approved original uploads</label>
                <span className="font-display text-2xl font-bold text-brand-red">{uploads}</span>
              </div>
              <Slider
                id="uploads-slider"
                value={[uploads]} min={1} max={40} step={1}
                onValueChange={([v]) => setUploads(v)}
                aria-label="Approved original uploads"
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>1</span><span>10</span><span>20</span><span>30</span><span>40</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-blue-soft p-4">
                <p className="text-xs font-semibold text-brand-blue">Views revenue</p>
                <p className="mt-1 font-display text-2xl font-bold">{usd(viewEarnings)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{compact(views)} qualified views ÷ 1,000 × ${rate.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-brand-red-soft p-4">
                <p className="text-xs font-semibold text-brand-red">Upload rewards</p>
                <p className="mt-1 font-display text-2xl font-bold">{usd(uploadEarnings)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{uploads} approved uploads × ${reward.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-ink p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Estimated total earnings</p>
                <Icons.Sparkles size={16} className="text-brand-yellow" />
              </div>
              <p className="mt-1 font-display text-4xl font-bold grad-text">{usd(total)}</p>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Estimates assume all views count as qualified under our <Link to="/policies/monetization" className="underline hover:text-ink">monetization rules</Link> and all uploads are approved original content. Actual earnings depend on view quality, duration window (4 months per video) and rates in effect at the time.
            </p>
          </div>

          {/* example + earning cards */}
          <div className="flex flex-col gap-4">
            <div className="reveal bento overflow-hidden">
              <div className="grad-sun flex items-center gap-2 px-5 py-3">
                <Icons.Lightbulb size={16} className="text-ink" />
                <p className="text-sm font-bold text-ink">Worked example — default rates</p>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Icons.Eye size={15} className="text-brand-blue" /> 100,000 qualified views</span>
                  <span className="font-bold">{usd(100)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Icons.UploadCloud size={15} className="text-brand-red" /> 10 approved videos</span>
                  <span className="font-bold">{usd(5)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Estimated total</span>
                    <span className="font-display text-2xl font-bold text-brand-red">{usd(105)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Worked example at the current rates.</p>
              </div>
            </div>

            <div className="reveal bento flex-1 p-5">
              <p className="mb-3 text-sm font-bold">Good to know</p>
              <ul className="space-y-2.5 text-[13px] text-muted-foreground">
                {[
                  "View earnings are calculated proportionally — no rounding down to full thousands.",
                  "Each video keeps earning views revenue for 4 months from publication.",
                  "Earnings clear to your available balance after a 7-day holding period.",
                  "Withdraw to bank or PayPal from just $25.",
                ].map(t => (
                  <li key={t} className="flex gap-2">
                    <Icons.CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    {t}
                  </li>
                ))}
              </ul>
              <PrimaryCTA to="/register" size="default" className="mt-5 w-full">
                Start Earning Today
              </PrimaryCTA>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 6: Top earning creators (consent-only, colourful Creator Economy cards) ──

export function TopCreators() {
  const [creators, setCreators] = useState<{
    username: string; channelName: string; avatarUrl: string | null;
    category: string | null; verified: boolean; followerCount: number;
    videoCount: number; verifiedEarnings: number; theme?: string;
  }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    get<{ creators: typeof creators }>("/public/top-creators").then(d => setCreators(d.creators)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const themeOf = (t?: string) => (t === "PINK" ? "pink" : "blue");
  const themeClasses = {
    blue: {
      card: "bg-gradient-to-b from-brand-blue-soft to-white border-brand-blue/20 hover:border-brand-blue/50",
      chip: "bg-brand-blue-soft text-brand-blue",
      earnings: "text-brand-blue",
      glow: "from-brand-blue/25 to-brand-blue/5",
      ring: "ring-brand-blue/30",
      rank: "bg-brand-blue text-white",
    },
    pink: {
      card: "bg-gradient-to-b from-brand-pink-soft to-white border-brand-pink/20 hover:border-brand-pink/50",
      chip: "bg-brand-pink-soft text-brand-pink",
      earnings: "text-brand-pink",
      glow: "from-brand-pink/25 to-brand-pink/5",
      ring: "ring-brand-pink/30",
      rank: "bg-brand-pink text-white",
    },
  } as const;

  if (loaded && creators.length === 0) return null;

  return (
    <section className="py-16 md:py-24" aria-label="Top earning creators">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Creator leaderboard"
          title={<>Top earning <span className="grad-text">creators</span></>}
          subtitle="Verified lifetime earnings, shown only with each creator's explicit consent. No estimates, no inflated numbers."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creators.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-64 rounded-2xl" />)
            : creators.slice(0, 8).map((c, i) => {
                const t = themeClasses[themeOf(c.theme)];
                return (
                  <Link
                    key={c.username} to={`/c/${c.username}`}
                    className={`reveal group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${t.card}`}
                  >
                    <span className={`absolute -left-1.5 top-3 rounded-r-full px-3 py-1 font-display text-xs font-bold shadow sticker-shadow ${t.rank}`}>
                      #{i + 1}
                    </span>
                    <div className={`absolute right-3 top-3 h-16 w-16 rounded-full bg-gradient-to-br blur-xl ${t.glow}`} aria-hidden />
                    <div className="relative mt-5">
                      <div className="relative flex items-center gap-3">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.channelName} className={`h-14 w-14 rounded-full object-cover ring-2 ${t.ring} shadow`} />
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-pink font-bold text-white">
                            {c.channelName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-display text-sm font-bold">
                            {c.channelName}
                            {c.verified && <Icons.BadgeCheck size={14} className={`shrink-0 ${themeOf(c.theme) === "pink" ? "text-brand-pink" : "text-brand-blue"}`} />}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                        </div>
                      </div>
                      <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${t.chip}`}>
                        <CategoryIcon name={c.category} size={13} /> {c.category ?? "Creator"}
                      </div>
                      <div className="mt-4 rounded-xl bg-white/80 p-3.5 shadow-sm backdrop-blur">
                        <p className="text-[11px] font-medium text-muted-foreground">Verified lifetime earnings</p>
                        <p className={`font-display text-2xl font-bold ${t.earnings}`}>{usd(c.verifiedEarnings)}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">with creator consent</p>
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Icons.Video size={12} /> {c.videoCount} videos</span>
                        <span className="flex items-center gap-1"><Icons.Users size={12} /> {compact(c.followerCount)} followers</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
