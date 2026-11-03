"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, LineChart, Legend,
} from "recharts";
import { AdminPageHeader } from "./shell";
import { StatusBadge } from "@/components/shared/ui-bits";
import { get } from "@/lib/client";
import { usd, compact, timeAgo } from "@/lib/format";

type AdminOverview = {
  kpis: {
    totalCreators: number; pendingCreators: number; approvedCreators: number; activeCreators: number;
    totalVideos: number; pendingVideos: number; flaggedVideos: number;
    totalViews: number; qualifiedViews: number;
    totalCreatorEarnings: number; totalPaidToCreators: number; pendingWithdrawals: number;
    outstandingLiability: number; openFraudFlags: number; openAppeals: number; openReports: number;
    appUsers?: number; commentsToday?: number;
  };
  charts: {
    dates: string[]; creatorGrowth: number[]; uploads: number[]; views: number[];
    earnings: number[]; payouts: number[];
  };
  recentAudit: { id: string; actorEmail: string; action: string; targetType: string; targetId: string | null; details: string | null; createdAt: string }[];
};

export function AdminDashboard() {
  const [data, setData] = useState<AdminOverview | null>(null);
  useEffect(() => { get<AdminOverview>("/admin/overview").then(setData).catch(() => {}); }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-10 w-72 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
        <div className="shimmer h-80 rounded-2xl" />
      </div>
    );
  }

  const k = data.kpis;
  const chartData = data.charts.dates.map((d, i) => ({
    date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    creators: data.charts.creatorGrowth[i],
    uploads: data.charts.uploads[i],
    views: data.charts.views[i],
    earnings: data.charts.earnings[i],
    payouts: data.charts.payouts[i],
  }));

  const kpiCards = [
    { l: "Registered Creators", v: compact(k.totalCreators), sub: `${k.approvedCreators} approved · ${k.activeCreators} active 30d`, icon: Icons.Users, c: "text-brand-blue", bg: "bg-brand-blue-soft", to: "/admin/creators" },
    { l: "Pending Approvals", v: String(k.pendingCreators), sub: "Creator applications waiting", icon: Icons.UserPlus, c: "text-amber-600", bg: "bg-amber-50", to: "/admin/creators" },
    { l: "Total Videos", v: compact(k.totalVideos), sub: `${k.pendingVideos} pending · ${k.flaggedVideos} flagged`, icon: Icons.Video, c: "text-brand-red", bg: "bg-brand-red-soft", to: "/admin/videos" },
    { l: "Total Views", v: compact(k.totalViews), sub: `${compact(k.qualifiedViews)} qualified (${k.totalViews ? Math.round((k.qualifiedViews / k.totalViews) * 100) : 0}%)`, icon: Icons.Eye, c: "text-brand-yellow", bg: "bg-brand-yellow-soft", to: "/admin/reports" },
    { l: "Creator Earnings", v: usd(k.totalCreatorEarnings, 0), sub: "Lifetime credited", icon: Icons.Landmark, c: "text-brand-red", bg: "bg-brand-red-soft", to: "/admin/earnings" },
    { l: "Paid to Creators", v: usd(k.totalPaidToCreators, 0), sub: "Completed payouts", icon: Icons.Banknote, c: "text-emerald-600", bg: "bg-emerald-50", to: "/admin/withdrawals" },
    { l: "Pending Withdrawals", v: usd(k.pendingWithdrawals, 0), sub: "Requested → processing", icon:Icons.Send, c: "text-amber-600", bg: "bg-amber-50", to: "/admin/withdrawals" },
    { l: "Outstanding Liability", v: usd(k.outstandingLiability, 0), sub: "Credits still in holding", icon: Icons.Scale, c: "text-slate-600", bg: "bg-slate-100", to: "/admin/earnings" },
    { l: "App Users", v: compact(k.appUsers ?? 0), sub: "Viewer accounts from the app", icon: Icons.Smartphone, c: "text-sky-600", bg: "bg-sky-50", to: "/admin/app-users" },
    { l: "Open Reports", v: String(k.openReports), sub: `${k.commentsToday ?? 0} comments in the last 24h`, icon: Icons.Flag, c: "text-rose-500", bg: "bg-rose-50", to: "/admin/safety" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Platform Overview"
        description="Live health of the creator economy: growth, content, earnings and payouts."
      />

      {/* KPI bento */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(c => (
          <div key={c.l} className="bento group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <span className={`rounded-xl ${c.bg} p-2.5`}><c.icon size={19} className={c.c} /></span>
              <Icons.ArrowUpRight size={15} className="text-muted-foreground/30 transition group-hover:text-brand-blue" />
            </div>
            <p className="mt-4 font-display text-2xl font-bold">{c.v}</p>
            <p className="text-sm font-semibold">{c.l}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Creator growth</h2>
          <p className="text-xs text-muted-foreground">Cumulative registered creators — last 30 days</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="aGrow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1677FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1677FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7e9f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="creators" stroke="#1677FF" strokeWidth={2.5} fill="url(#aGrow)" name="Creators" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Daily video uploads</h2>
          <p className="text-xs text-muted-foreground">Upload volume — last 30 days</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7e9f0", fontSize: 12 }} />
                <Bar dataKey="uploads" fill="#FF1744" radius={[4, 4, 0, 0]} name="Uploads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Daily earnings credited</h2>
          <p className="text-xs text-muted-foreground">View revenue + upload rewards — last 30 days</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="aEarn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD600" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FFD600" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => usd(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e7e9f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="earnings" stroke="#F5B800" strokeWidth={2.5} fill="url(#aEarn)" name="Earnings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Payout trend</h2>
          <p className="text-xs text-muted-foreground">Daily payments to creators — last 30 days</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef4" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "#9aa3b5" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => usd(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e7e9f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="payouts" stroke="#22c55e" strokeWidth={2.5} name="Payouts" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* queues + audit */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Review queues</h2>
          <div className="mt-4 space-y-2.5">
            {[
              { l: "Creator applications", v: k.pendingCreators, to: "/admin/creators", c: "bg-amber-50 text-amber-700" },
              { l: "Videos pending approval", v: k.pendingVideos, to: "/admin/videos", c: "bg-blue-50 text-blue-700" },
              { l: "Duplicate review queue", v: k.flaggedVideos, to: "/admin/duplicates", c: "bg-orange-50 text-orange-700" },
              { l: "Open appeals", v: k.openAppeals, to: "/admin/duplicates", c: "bg-violet-50 text-violet-700" },
              { l: "Fraud flags", v: k.openFraudFlags, to: "/admin/fraud", c: "bg-rose-50 text-rose-700" },
              { l: "User reports on videos", v: k.openReports, to: "/admin/safety", c: "bg-slate-100 text-slate-700" },
            ].map(q => (
              <div key={q.l} className="flex items-center justify-between rounded-xl bg-secondary/60 p-3.5">
                <span className="text-sm font-semibold">{q.l}</span>
                <span className={`rounded-full px-3 py-1 font-display text-sm font-bold ${q.c}`}>{q.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Recent admin actions</h2>
          <p className="text-xs text-muted-foreground">Every administrative action is audit-logged</p>
          <div className="scroll-slim mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
            {data.recentAudit.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                <span className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5">
                  <Icons.History size={14} className="text-brand-blue" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs">
                    <span className="font-bold">{a.action}</span>
                    {a.targetId && <span className="text-muted-foreground"> → {a.targetId}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{a.actorEmail} · {timeAgo(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
