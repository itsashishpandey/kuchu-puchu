"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "./shell";
import { StatusBadge, EmptyState } from "@/components/shared/ui-bits";
import { navigate, Link } from "@/components/app/router";
import { get } from "@/lib/client";
import { usd, compact, timeAgo, fmtDate, daysUntil } from "@/lib/format";

type Overview = {
  kpis: {
    totalEarnings: number; availableBalance: number; pendingEarnings: number;
    totalVideos: number; totalQualifiedViews: number; earningsThisMonth: number;
    remainingDailyUploads: number; remainingWeeklyUploads: number;
    dailyUploadLimit: number; weeklyUploadLimit: number;
    monetization?: { eligible: boolean; unlocked?: boolean; unlockedAt?: string | null; last30DaysViews: number; threshold: number; uploadRewardInr: number; uploadRewardUsd: number; inrPerUsd: number };
    standing?: { strikes: number; limit: number; list: { reason: string; contentId: string | null; createdAt: string }[] };
  };
  chart: { date: string; earnings: number }[];
  videos: {
    id: string; contentId: string; title: string; thumbnailUrl: string | null;
    status: string; views: number; qualifiedViews: number; likes: number;
    earningExpiresAt: string | null; createdAt: string;
  }[];
  recentTransactions: {
    id: string; type: string; amount: number; description: string;
    reference: string | null; createdAt: string;
  }[];
  settings: { ratePer1000Views: number; rewardPerUpload: number; rewardPerUploadInr?: number };
};

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  VIEW_EARNING: { icon: Icons.Eye, color: "text-brand-blue bg-brand-blue-soft" },
  UPLOAD_REWARD: { icon: Icons.BadgeDollarSign, color: "text-brand-red bg-brand-red-soft" },
  ADJUSTMENT: { icon: Icons.Scale, color: "text-brand-yellow bg-brand-yellow-soft" },
  WITHDRAWAL_PAID: { icon: Icons.Banknote, color: "text-emerald-600 bg-emerald-50" },
  WITHDRAWAL_HOLD: { icon: Icons.Lock, color: "text-slate-500 bg-slate-100" },
  WITHDRAWAL_REJECTED: { icon: Icons.RotateCcw, color: "text-rose-500 bg-rose-50" },
};

export function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => { get<Overview>("/creator/overview").then(setData).catch(() => {}); }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-10 w-64 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}</div>
        <div className="shimmer h-72 rounded-2xl" />
      </div>
    );
  }

  const k = data.kpis;
  const cards = [
    { label: "Total Earnings", value: usd(k.totalEarnings), sub: "Lifetime, all sources", icon: Icons.Banknote, accent: "text-brand-red", bg: "bg-brand-red-soft", span: "" },
    { label: "Available Balance", value: usd(k.availableBalance), sub: "Ready to withdraw", icon: Icons.Wallet, accent: "text-emerald-600", bg: "bg-emerald-50", span: "" },
    { label: "Pending Earnings", value: usd(k.pendingEarnings), sub: "Holding period + locked payouts", icon: Icons.Hourglass, accent: "text-brand-yellow", bg: "bg-brand-yellow-soft", span: "" },
    { label: "Earnings This Month", value: usd(k.earningsThisMonth), sub: new Date().toLocaleDateString("en-US", { month: "long" }), icon: Icons.TrendingUp, accent: "text-brand-blue", bg: "bg-brand-blue-soft", span: "" },
    { label: "Videos Uploaded", value: String(k.totalVideos), sub: "All statuses", icon: Icons.Video, accent: "text-brand-blue", bg: "bg-brand-blue-soft", span: "" },
    { label: "Qualified Views", value: compact(k.totalQualifiedViews), sub: "Earning-eligible views", icon: Icons.Eye, accent: "text-emerald-600", bg: "bg-emerald-50", span: "" },
    { label: "Daily Uploads Left", value: `${k.remainingDailyUploads} / ${k.dailyUploadLimit}`, sub: "Resets at midnight", icon: Icons.CalendarClock, accent: "text-brand-red", bg: "bg-brand-red-soft", span: "" },
    { label: "Weekly Uploads Left", value: `${k.remainingWeeklyUploads} / ${k.weeklyUploadLimit}`, sub: "Rolling 7 days", icon: Icons.CalendarDays, accent: "text-brand-yellow", bg: "bg-brand-yellow-soft", span: "" },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Overview"
        description={`${usd(data.settings.ratePer1000Views)} per 1,000 qualified views + ${usd(data.settings.rewardPerUpload)} per approved upload`}
        actions={
          <div className="flex gap-2">
            <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/dashboard/upload")}>
              <Icons.UploadCloud size={16} className="mr-1.5" /> Upload Video
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/dashboard/withdraw")}>
              Withdraw
            </Button>
          </div>
        }
      />

      {/* monetization threshold + channel standing */}
      {(data.kpis.monetization || data.kpis.standing) && (
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {data.kpis.monetization && (() => {
            const m = data.kpis.monetization!;
            const pct = Math.min(100, Math.round((m.last30DaysViews / Math.max(1, m.threshold)) * 100));
            return (
              <div className={`bento p-5 ${m.eligible ? "ring-1 ring-emerald-200" : "ring-1 ring-brand-yellow/40"}`}>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold"><Icons.BadgeDollarSign size={17} className="text-brand-pink" /> Monetization</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${m.eligible ? "bg-emerald-50 text-emerald-700" : "bg-brand-yellow-soft text-ink"}`}>{m.eligible ? "Unlocked ✓" : "Locked"}</span>
                </div>
                {m.eligible ? (
                  <>
                    <p className="mt-3 font-display text-2xl font-bold text-emerald-600">Earning is on</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {m.unlockedAt ? `Unlocked ${fmtDate(m.unlockedAt)}. ` : ""}Every approved upload earns {usd(m.uploadRewardUsd)} and every qualified view earns — for good.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 font-display text-2xl font-bold">{m.last30DaysViews.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">/ {m.threshold.toLocaleString()} views in the last 30 days</span></p>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-brand-pink to-brand-yellow" style={{ width: `${pct}%` }} /></div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Get {(m.threshold - m.last30DaysViews).toLocaleString()} more genuine views within 30 days to unlock earning — it's a one-time target, then upload rewards ({usd(m.uploadRewardUsd)} each) and view earnings stay on. Only views in the Kuchu Puchu app count — each viewer once every few hours; self-views and bots never count.
                    </p>
                  </>
                )}
              </div>
            );
          })()}
          {data.kpis.standing && (
            <div className={`bento p-5 ${data.kpis.standing.strikes ? "ring-1 ring-rose-200" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold"><Icons.ShieldCheck size={17} className="text-brand-blue" /> Channel standing</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${data.kpis.standing.strikes ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                  {data.kpis.standing.strikes} of {data.kpis.standing.limit} strikes
                </span>
              </div>
              {data.kpis.standing.list.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No strikes — your channel is in good standing. Each upheld complaint is a strike; {data.kpis.standing.limit} strikes suspend the channel.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.kpis.standing.list.map((s, i) => (
                    <li key={i} className="rounded-lg bg-rose-50/60 px-3 py-2 text-xs">
                      <span className="font-semibold">{fmtDate(s.createdAt)}{s.contentId ? ` · ${s.contentId}` : ""}</span> — {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* KPI bento */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <div key={c.label} className={`bento p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${i === 0 ? "xl:col-span-2 xl:row-span-1" : ""}`}>
            <div className="flex items-start justify-between">
              <span className={`rounded-xl ${c.bg} p-2.5`}><c.icon size={19} className={c.accent} /></span>
              <Icons.MoreHorizontal size={16} className="text-muted-foreground/40" />
            </div>
            <p className={`mt-4 font-display font-bold ${i === 0 ? "text-3xl" : "text-2xl"} ${i === 0 ? "grad-text" : "text-ink"}`}>{c.value}</p>
            <p className="mt-1 text-sm font-semibold">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* chart + transactions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="bento p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold">Earnings — last 14 days</h2>
              <p className="text-xs text-muted-foreground">View revenue + upload rewards credited per day</p>
            </div>
            <Link to="/dashboard/earnings" className="text-xs font-bold text-brand-red hover:underline">Full analytics →</Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF1744" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#FF1744" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef4" vertical={false} />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  tick={{ fontSize: 11, fill: "#9aa3b5" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#9aa3b5" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={v => [usd(Number(v)), "Earnings"]}
                  labelFormatter={d => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e7e9f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#FF1744" strokeWidth={2.5} fill="url(#earnGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Recent transactions</h2>
            <Link to="/dashboard/transactions" className="text-xs font-bold text-brand-red hover:underline">View all →</Link>
          </div>
          <div className="scroll-slim max-h-64 space-y-2.5 overflow-y-auto pr-1">
            {data.recentTransactions.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>}
            {data.recentTransactions.map(t => {
              const meta = TYPE_ICON[t.type] ?? TYPE_ICON.ADJUSTMENT;
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                  <span className={`rounded-lg p-2 ${meta.color}`}><meta.icon size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground">{timeAgo(t.createdAt)} · {t.reference}</p>
                  </div>
                  <span className={`text-sm font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {t.amount >= 0 ? "+" : ""}{usd(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* recent videos */}
      <div className="bento mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Your videos</h2>
          <Link to="/dashboard/videos" className="text-xs font-bold text-brand-red hover:underline">Manage all →</Link>
        </div>
        {data.videos.length === 0 ? (
          <EmptyState icon="Video" title="No videos yet" description="Upload your first original short to start earning."
            action={{ label: "Upload Video", onClick: () => navigate("/dashboard/upload") }} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {data.videos.map(v => {
              const expiresIn = daysUntil(v.earningExpiresAt);
              return (
                <div key={v.id} className="group overflow-hidden rounded-xl border bg-white transition hover:shadow-md">
                  <div className="relative aspect-video overflow-hidden bg-ink">
                    {v.thumbnailUrl && <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover transition group-hover:scale-105" />}
                    <span className="absolute right-2 top-2"><StatusBadge status={v.status} /></span>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-xs font-bold">{v.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{v.contentId} · {timeAgo(v.createdAt)}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{compact(v.views)} views</span>
                      <span>{compact(v.likes)} likes</span>
                    </div>
                    {v.earningExpiresAt && (
                      <p className={`mt-1.5 flex items-center gap-1 text-[10px] ${expiresIn < 30 ? "text-amber-600" : "text-muted-foreground"}`}>
                        <Icons.Clock size={10} />
                        {expiresIn > 0 ? `Earns for ${expiresIn} more days` : "Earning window closed"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Earnings page ───────────────────────────────────────────────────────

type EarningsData = {
  range: string;
  wallet: { lifetimeEarnings: number; pendingBalance: number; availableBalance: number; totalWithdrawn: number };
  series: { date: string; views: number; uploads: number; adjustments: number }[];
  byVideo: { contentId: string; title: string; thumbnailUrl: string | null; earned: number }[];
  total: number;
};

export function EarningsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<EarningsData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ range });
    if (range === "custom") { if (from) params.set("from", from); if (to) params.set("to", to); }
    get<EarningsData>(`/creator/earnings?${params}`).then(setData).catch(() => {});
  }, [range, from, to]);

  return (
    <div>
      <DashboardPageHeader
        title="My Earnings"
        description="Revenue from qualified views and approved uploads, with your full wallet position."
      />

      {/* wallet cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { l: "Lifetime Earnings", v: data ? usd(data.wallet.lifetimeEarnings) : "—", i: Icons.Banknote, c: "text-brand-red", bg: "bg-brand-red-soft" },
          { l: "Pending Balance", v: data ? usd(data.wallet.pendingBalance) : "—", i: Icons.Hourglass, c: "text-brand-yellow", bg: "bg-brand-yellow-soft" },
          { l: "Available Balance", v: data ? usd(data.wallet.availableBalance) : "—", i: Icons.Wallet, c: "text-emerald-600", bg: "bg-emerald-50" },
          { l: "Total Withdrawn", v: data ? usd(data.wallet.totalWithdrawn) : "—", i: Icons.Send, c: "text-brand-blue", bg: "bg-brand-blue-soft" },
        ].map(c => (
          <div key={c.l} className="bento p-5">
            <span className={`rounded-xl ${c.bg} p-2.5`}><c.i size={19} className={c.c} /></span>
            <p className="mt-3 font-display text-2xl font-bold">{c.v}</p>
            <p className="text-xs text-muted-foreground">{c.l}</p>
          </div>
        ))}
      </div>

      {/* chart */}
      <div className="bento mt-4 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold">Earnings breakdown</h2>
            <p className="text-xs text-muted-foreground">Stacked by source — qualified views, upload rewards, adjustments</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["7d", "30d", "90d", "custom"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${range === r ? "grad-btn text-white" : "bg-secondary hover:bg-secondary/70"}`}
              >
                {r === "7d" ? "7 days" : r === "30d" ? "30 days" : r === "90d" ? "90 days" : "Custom"}
              </button>
            ))}
            {range === "custom" && (
              <div className="flex items-center gap-1.5">
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="rounded-lg border bg-white px-2.5 py-1.5 text-xs" aria-label="From date" />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="rounded-lg border bg-white px-2.5 py-1.5 text-xs" aria-label="To date" />
              </div>
            )}
          </div>
        </div>

        {data ? (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1677FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1677FF" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF1744" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#FF1744" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef4" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    tick={{ fontSize: 11, fill: "#9aa3b5" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#9aa3b5" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, name) => [usd(Number(v)), name === "views" ? "View earnings" : name === "uploads" ? "Upload rewards" : "Adjustments"]}
                    labelFormatter={d => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e7e9f0", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="views" stackId="1" stroke="#1677FF" strokeWidth={2} fill="url(#gViews)" />
                  <Area type="monotone" dataKey="uploads" stackId="1" stroke="#FF1744" strokeWidth={2} fill="url(#gUploads)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-blue" /> Qualified view revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-red" /> Upload rewards</span>
              <span className="ml-auto font-bold">Period total: <span className="grad-text text-base">{usd(data.total)}</span></span>
            </div>
          </>
        ) : (
          <div className="shimmer h-72 rounded-xl" />
        )}
      </div>

      {/* by video */}
      <div className="bento mt-4 overflow-hidden p-5">
        <h2 className="mb-4 font-display text-base font-bold">Earnings by video</h2>
        <div className="space-y-2">
          {(data?.byVideo ?? []).slice(0, 10).map(v => (
            <div key={v.contentId} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
              {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{v.title}</p>
                <p className="text-[11px] text-muted-foreground">{v.contentId}</p>
              </div>
              <span className="font-display text-base font-bold text-brand-red">{usd(v.earned)}</span>
            </div>
          ))}
          {data && data.byVideo.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No earnings in this period.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Video Analytics page ───────────────────────────────────────────────────

type AnalyticsData = {
  videos: {
    contentId: string; title: string; thumbnailUrl: string | null;
    views: number; qualifiedViews: number; qualificationRate: number;
    likes: number; commentsCount: number; shares: number; earned: number;
    recentQualified: number; recentExcluded: number;
    exclusions: Record<string, number>;
    completionRate?: number | null;
  }[];
  breakdowns?: BreakdownData;
};

const EXCLUSION_LABELS: Record<string, string> = {
  CREATOR_SELF_VIEW: "Creator self-views",
  BOT_USER_AGENT: "Bot / crawler traffic",
  INSUFFICIENT_WATCH_TIME: "Under 2s watch time",
  DUPLICATE_VIEWER_DAILY_CAP: "Repeat views over daily cap",
  REPEAT_VIEW_WITHIN_WINDOW: "Repeat views (same viewer within the repeat window)",
  NETWORK_VIEW_CAP: "Extra views from one internet connection",
  WEB_VIEW_NOT_COUNTED: "Website views (only app views count)",
  VIDEO_NOT_APPROVED: "Video not approved",
  MONETIZATION_WINDOW_EXPIRED: "Earning window expired",
  VIDEO_MONETIZATION_DISABLED: "Monetization disabled",
  CREATOR_NOT_ELIGIBLE: "Creator not eligible",
  MONETIZATION_PAUSED: "Monetization paused",
  OTHER: "Other",
};

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  useEffect(() => { get<AnalyticsData>("/creator/analytics").then(setData).catch(() => {}); }, []);

  return (
    <div>
      <DashboardPageHeader
        title="Video Analytics"
        description="Views vs qualified views, engagement and earnings for every video — including why views were excluded."
      />
      {!data ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}</div>
      ) : data.videos.length === 0 ? (
        <EmptyState icon="BarChart3" title="No analytics yet" description="Upload a video to start tracking performance." />
      ) : (
        <div className="space-y-4">
          {data.breakdowns && <Breakdowns b={data.breakdowns} />}
          {data.videos.map(v => (
            <div key={v.contentId} className="bento p-5">
              <div className="flex flex-wrap items-center gap-4">
                {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-16 w-11 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.contentId}{typeof v.completionRate === "number" ? ` · ${v.completionRate}% watched to the end` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-brand-red">{usd(v.earned)}</p>
                  <p className="text-[11px] text-muted-foreground">earned</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[
                  { l: "Views", v: compact(v.views) },
                  { l: "Qualified", v: compact(v.qualifiedViews) },
                  { l: "Qual. rate", v: `${v.qualificationRate}%` },
                  { l: "Likes", v: compact(v.likes) },
                  { l: "Comments", v: compact(v.commentsCount) },
                  { l: "Shares", v: compact(v.shares) },
                ].map(s => (
                  <div key={s.l} className="rounded-xl bg-secondary/70 p-3 text-center">
                    <p className="font-display text-base font-bold">{s.v}</p>
                    <p className="text-[10px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              {/* qualification bar */}
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Qualification breakdown</span>
                  <span>{compact(v.qualifiedViews)} of {compact(v.views)} views monetized</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="bg-gradient-to-r from-brand-blue to-brand-blue/70" style={{ width: `${v.qualificationRate}%` }} />
                  <div className="flex-1 bg-muted" />
                </div>
              </div>
              {Object.keys(v.exclusions).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(v.exclusions).map(([reason, n]) => (
                    <span key={reason} className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      {EXCLUSION_LABELS[reason] ?? reason}: {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── audience breakdowns (by language / category / subcategory / country + completion) ──

type BreakRow = { key: string; label: string; emoji?: string | null; videos: number; taggedVideos: number; views: number; qualifiedViews: number; likes: number };
type BreakdownData = {
  primaryAttribution: boolean;
  byLanguage: BreakRow[]; byCategory: BreakRow[]; bySubcategory: BreakRow[];
  byCountry: { country: string; views: number; qualifiedViews: number }[];
  completion: { overallRate: number | null; trackedViews: number; completedViews: number };
};

function Breakdowns({ b }: { b: BreakdownData }) {
  const [tab, setTab] = useState<"language" | "category" | "subcategory" | "country">("language");
  const rows = tab === "language" ? b.byLanguage : tab === "category" ? b.byCategory : tab === "subcategory" ? b.bySubcategory : [];
  const max = Math.max(1, ...rows.map(r => r.views), ...b.byCountry.map(c => c.views));
  return (
    <div className="bento p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-bold">Audience breakdown</p>
          <p className="text-xs text-muted-foreground">Each video's views are counted once — under its primary language, category and subcategory.</p>
        </div>
        <div className="rounded-xl bg-secondary/70 px-3 py-2 text-right">
          <p className="font-display text-lg font-bold">{b.completion.overallRate === null ? "—" : `${b.completion.overallRate}%`}</p>
          <p className="text-[10px] text-muted-foreground">watched to the end{b.completion.trackedViews ? ` (${b.completion.trackedViews} tracked views)` : ""}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["language", "category", "subcategory", "country"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${tab === t ? "bg-ink text-white" : "bg-secondary hover:bg-secondary/70"}`}>
            By {t}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        {tab === "country" ? (
          b.byCountry.length === 0 ? <p className="text-sm text-muted-foreground">No views yet.</p> : (
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-semibold">Country</th><th className="font-semibold">Views</th><th className="font-semibold">Qualified</th><th className="w-1/3" /></tr></thead>
              <tbody>{b.byCountry.map(c => (
                <tr key={c.country} className="border-t"><td className="py-2">{c.country}</td><td>{compact(c.views)}</td><td>{compact(c.qualifiedViews)}</td>
                  <td><div className="h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${(c.views / max) * 100}%` }} /></div></td></tr>
              ))}</tbody>
            </table>
          )
        ) : rows.length === 0 ? <p className="text-sm text-muted-foreground">No tagged videos yet.</p> : (
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 font-semibold capitalize">{tab}</th><th className="font-semibold">Primary videos</th><th className="font-semibold">Tagged in</th><th className="font-semibold">Views</th><th className="font-semibold">Qualified</th><th className="w-1/4" />
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.key} className="border-t">
                <td className="py-2">{r.emoji ? `${r.emoji} ` : ""}{r.label}</td><td>{r.videos}</td><td>{r.taggedVideos}</td><td>{compact(r.views)}</td><td>{compact(r.qualifiedViews)}</td>
                <td><div className="h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-brand-pink" style={{ width: `${(r.views / max) * 100}%` }} /></div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
