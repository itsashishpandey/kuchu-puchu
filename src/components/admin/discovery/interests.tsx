"use client";

import * as Icons from "lucide-react";
import { EmptyState } from "@/components/shared/ui-bits";
import { AdminPageHeader } from "../shell";
import { useApi, LoadingBlock, ErrorBlock, TableCard, Th, Td, n, StatTile, Bar } from "./shared";

type Interests = {
  totals: { accounts: number; onboarded: number; onboardingRate: number; discoveryOptIn: number; discoveryRate: number };
  signals30d: Record<string, number>;
  languages: { code: string; nameEn: string; nameNative: string; viewers: number; primaryViewers: number; videos: number }[];
  categories: { id: string; slug: string; name: string; emoji: string | null; interestedViewers: number; allSubcategories: number; videos: number; primaryViews: number }[];
  subcategories: { id: string; name: string; category: string; emoji: string | null; interestedViewers: number; videos: number }[];
  gaps: { type: string; name: string; emoji: string | null; interestedViewers: number; videos: number }[];
};

const SIGNALS: { key: string; label: string; icon: React.ComponentType<{ size?: number }>; tone: "blue" | "pink" | "yellow" | "green" | "slate" }[] = [
  { key: "LIKE", label: "Likes", icon: Icons.ThumbsUp, tone: "pink" },
  { key: "SAVE", label: "Saves", icon: Icons.Bookmark, tone: "blue" },
  { key: "SHARE", label: "Shares", icon: Icons.Share2, tone: "yellow" },
  { key: "COMPLETE", label: "Watched to the end", icon: Icons.CircleCheckBig, tone: "green" },
  { key: "NOT_INTERESTED", label: "Not interested", icon: Icons.ThumbsDown, tone: "slate" },
  { key: "HIDE_CREATOR", label: "Creators hidden", icon: Icons.UserX, tone: "slate" },
  { key: "REPORT", label: "Reports", icon: Icons.Flag, tone: "slate" },
];

export function InterestsPage() {
  const { data, error, loading, reload } = useApi<Interests>("/admin/discovery/interests");
  if (loading && !data) return <><Header /><LoadingBlock rows={5} height="h-24" /></>;
  if (error && !data) return <><Header /><ErrorBlock message={error} onRetry={reload} /></>;
  if (!data) return null;
  const t = data.totals;
  const maxLang = Math.max(1, ...data.languages.map(l => l.viewers));
  const maxCat = Math.max(1, ...data.categories.map(c => c.interestedViewers));
  const maxSub = Math.max(1, ...data.subcategories.map(s => s.interestedViewers));
  const cats = data.categories.filter(c => c.interestedViewers > 0 || c.videos > 0);

  return (
    <div>
      <Header />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Viewer & creator accounts" value={n(t.accounts)} icon={Icons.Users} tone="blue" />
        <StatTile label="Finished interest onboarding" value={`${n(t.onboarded)} · ${t.onboardingRate}%`} icon={Icons.UserCheck} tone="green" />
        <StatTile label="Opted in to other-language discovery" value={`${n(t.discoveryOptIn)} · ${t.discoveryRate}%`} icon={Icons.Globe} tone="yellow" hint="share of onboarded accounts" />
      </div>

      <h2 className="mb-2 font-display text-base font-bold">Feedback signals — last 30 days</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {SIGNALS.map(s => <StatTile key={s.key} label={s.label} value={n(data.signals30d[s.key] ?? 0)} icon={s.icon} tone={s.tone} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-2 font-display text-base font-bold">Languages viewers chose</h2>
          {data.languages.length === 0 ? <EmptyState icon="Languages" title="No language choices yet" description="Viewers pick languages during onboarding or in Settings → My Interests & Languages." /> : (
            <TableCard minWidth={560}>
              <thead><tr className="border-b bg-secondary/50"><Th>Language</Th><Th className="w-1/3">Viewers</Th><Th right>As primary</Th><Th right>Videos</Th></tr></thead>
              <tbody>
                {data.languages.slice(0, 30).map(l => (
                  <tr key={l.code} className="border-b last:border-0">
                    <Td><span className="font-semibold">{l.nameNative}</span>{l.nameNative !== l.nameEn && <span className="text-muted-foreground"> · {l.nameEn}</span>}</Td>
                    <Td><div className="flex items-center gap-2"><span className="w-10 text-right tabular-nums">{n(l.viewers)}</span><Bar value={l.viewers} max={maxLang} /></div></Td>
                    <Td right>{n(l.primaryViewers)}</Td>
                    <Td right className={l.videos < 3 ? "font-semibold text-amber-700" : ""}>{n(l.videos)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-bold">Content gaps</h2>
          <p className="mb-2 text-xs text-muted-foreground">Interests viewers chose that have fewer than 3 approved videos — good prompts for creators.</p>
          {data.gaps.length === 0 ? <EmptyState icon="CheckCheck" title="No gaps right now" /> : (
            <div className="bento divide-y">
              {data.gaps.map(g => (
                <div key={`${g.type}-${g.name}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${g.type === "LANGUAGE" ? "bg-brand-blue-soft text-brand-blue" : "bg-brand-pink-soft text-brand-pink"}`}>{g.type === "LANGUAGE" ? "Language" : "Category"}</span>
                    {g.emoji ? `${g.emoji} ` : ""}{g.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground"><b className="text-ink">{n(g.interestedViewers)}</b> interested · <b className="text-amber-700">{n(g.videos)}</b> videos</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-base font-bold">Main categories — interest vs supply</h2>
        {cats.length === 0 ? <EmptyState icon="LayoutGrid" title="No category interests yet" /> : (
          <TableCard minWidth={720}>
            <thead><tr className="border-b bg-secondary/50"><Th>Category</Th><Th className="w-1/3">Interested viewers</Th><Th right>Chose “All”</Th><Th right>Videos</Th><Th right>Primary views</Th></tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <Td><span className="font-semibold">{c.emoji} {c.name}</span></Td>
                  <Td><div className="flex items-center gap-2"><span className="w-10 text-right tabular-nums">{n(c.interestedViewers)}</span><Bar value={c.interestedViewers} max={maxCat} tone="pink" /></div></Td>
                  <Td right>{n(c.allSubcategories)}</Td>
                  <Td right className={c.interestedViewers > 0 && c.videos < 3 ? "font-semibold text-amber-700" : ""}>{n(c.videos)}</Td>
                  <Td right>{n(c.primaryViews)}</Td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-base font-bold">Top subcategories</h2>
        {data.subcategories.length === 0 ? <EmptyState icon="ListTree" title="No subcategory interests yet" /> : (
          <div className="bento grid gap-x-6 gap-y-2.5 p-4 md:grid-cols-2">
            {data.subcategories.map(s => (
              <div key={s.id} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{s.emoji ? `${s.emoji} ` : ""}<b>{s.name}</b> <span className="text-muted-foreground">· {s.category}</span></span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{n(s.interestedViewers)} · {n(s.videos)} videos</span>
                </div>
                <Bar value={s.interestedViewers} max={maxSub} tone="yellow" />
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="mt-4 text-xs text-muted-foreground"><Icons.Lock size={12} className="mr-1 inline" /> Aggregated counts only — no individual viewer&apos;s choices are shown anywhere on this page.</p>
    </div>
  );
}

function Header() {
  return (
    <AdminPageHeader
      title="User Interest Analytics"
      description="What viewers told us they love — languages, categories and subcategories — and where interest outruns the videos we have."
    />
  );
}
