"use client";

import { Fragment, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/ui-bits";
import { useAuth } from "@/components/app/auth-provider";
import { fmtDate, timeAgo } from "@/lib/format";
import { AdminPageHeader } from "../shell";
import { useApi, LoadingBlock, ErrorBlock, TableCard, Th, Td, n, pct } from "./shared";

type Metrics = {
  views: number; qualifiedViews: number; tracked: number; completes: number; likes: number; saves: number;
  shares: number; notInterested: number; hidden: number; reports: number; completionRate: number | null;
};
type Reports = {
  days: number; attribution: string;
  byLanguage: (Metrics & { code: string; name: string })[];
  byCategory: (Metrics & { id: string; name: string; emoji: string | null })[];
  bySubcategory: (Metrics & { id: string; name: string; category: string })[];
  search: { top: { query: string; count: number }[]; noResults: { query: string; count: number }[] };
};
type AuditEntry = { id: string; actorEmail: string; action: string; entityType: string; entityId: string | null; before: unknown; after: unknown; createdAt: string };
type AuditResp = { total: number; page: number; pageSize: number; entries: AuditEntry[] };

const TABS = [
  { key: "languages", label: "By language" },
  { key: "categories", label: "By category" },
  { key: "subcategories", label: "By subcategory" },
  { key: "search", label: "Search" },
  { key: "audit", label: "Audit log" },
] as const;

export function ReportsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("languages");
  const canAudit = user?.adminRole === "SUPER_ADMIN" || user?.adminRole === "MODERATOR";
  const { data, error, loading, reload } = useApi<Reports>(`/admin/discovery/reports?days=${days}`);

  return (
    <div>
      <AdminPageHeader
        title="Content Discovery Reports"
        description="How videos are found and watched across languages and categories, what people search for, and every change to the discovery setup."
        actions={tab !== "audit" && (
          <div className="flex gap-1.5">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${days === d ? "border-transparent bg-foreground text-background" : "bg-background hover:bg-secondary"}`}>
                {d} days
              </button>
            ))}
          </div>
        )}
      />

      <div className="-mx-1 mb-4 overflow-x-auto pb-1 [scrollbar-width:none]">
        <div className="flex w-max gap-1.5 px-1">
          {TABS.filter(t => t.key !== "audit" || canAudit).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition ${tab === t.key ? "border-transparent bg-ink text-white" : "bg-background hover:bg-secondary"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "audit" ? <AuditLog /> : loading && !data ? <LoadingBlock rows={6} height="h-12" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : data && (
        <div className={loading ? "opacity-60" : ""}>
          {tab === "languages" && <MetricsTable rows={data.byLanguage.map(r => ({ key: r.code, label: <><b>{r.name}</b> <code className="text-[11px] text-muted-foreground">{r.code}</code></>, m: r }))} empty="No views in this period" />}
          {tab === "categories" && <MetricsTable rows={data.byCategory.map(r => ({ key: r.id, label: <b>{r.emoji} {r.name}</b>, m: r }))} empty="No views in this period" />}
          {tab === "subcategories" && <MetricsTable rows={data.bySubcategory.map(r => ({ key: r.id, label: <><b>{r.name}</b> <span className="text-muted-foreground">· {r.category}</span></>, m: r }))} empty="No views in this period" />}
          {tab === "search" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <SearchList title="Top searches" icon={Icons.Search} rows={data.search.top} empty="No searches in this period" />
              <SearchList title="Searches with no results" icon={Icons.SearchX} rows={data.search.noResults} empty="Every search found something"
                note="Content gaps — topics viewers look for that no approved video covers yet." />
            </div>
          )}
          {tab !== "search" && (
            <p className="mt-3 text-xs text-muted-foreground">
              <Icons.Info size={12} className="mr-1 inline" />
              Last {data.days} days. Each video is counted once, under its primary language, category and subcategory — no double counting.
              Completion = viewers who watched to the end ÷ views with watch-time data (suspicious views excluded).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricsTable({ rows, empty }: { rows: { key: string; label: React.ReactNode; m: Metrics }[]; empty: string }) {
  if (!rows.length) return <EmptyState icon="FileBarChart2" title={empty} description="Views, completions and feedback appear here as viewers watch." />;
  return (
    <TableCard minWidth={980}>
      <thead>
        <tr className="border-b bg-secondary/50">
          <Th>Name</Th><Th right>Views</Th><Th right>Qualified</Th><Th right>Completion</Th><Th right>Likes</Th><Th right>Saves</Th>
          <Th right>Shares</Th><Th right>Not interested</Th><Th right>Hidden</Th><Th right>Reports</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.key} className="border-b last:border-0 hover:bg-secondary/30">
            <Td>{r.label}</Td>
            <Td right>{n(r.m.views)}</Td><Td right>{n(r.m.qualifiedViews)}</Td>
            <Td right>{pct(r.m.completionRate)}{r.m.tracked > 0 && <p className="text-[10px] text-muted-foreground">of {n(r.m.tracked)}</p>}</Td>
            <Td right>{n(r.m.likes)}</Td><Td right>{n(r.m.saves)}</Td><Td right>{n(r.m.shares)}</Td>
            <Td right className={r.m.notInterested > 0 ? "text-amber-700" : ""}>{n(r.m.notInterested)}</Td>
            <Td right className={r.m.hidden > 0 ? "text-amber-700" : ""}>{n(r.m.hidden)}</Td>
            <Td right className={r.m.reports > 0 ? "font-semibold text-rose-600" : ""}>{n(r.m.reports)}</Td>
          </tr>
        ))}
      </tbody>
    </TableCard>
  );
}

function SearchList({ title, icon: Icon, rows, empty, note }: {
  title: string; icon: React.ComponentType<{ size?: number; className?: string }>; rows: { query: string; count: number }[]; empty: string; note?: string;
}) {
  return (
    <div className="bento overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-secondary/50 px-4 py-3"><Icon size={15} className="text-muted-foreground" /><h2 className="font-display text-sm font-bold">{title}</h2></div>
      {note && <p className="border-b px-4 py-2 text-xs text-muted-foreground">{note}</p>}
      {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p> : (
        <ol className="divide-y">
          {rows.map((r, i) => (
            <li key={r.query} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">&ldquo;{r.query}&rdquo;</span>
              <span className="tabular-nums text-muted-foreground">{n(r.count)}×</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const ENTITY_TYPES = ["ALL", "LANGUAGE", "CATEGORY", "SUBCATEGORY", "TRANSLATION", "VIDEO_TAGS", "RECO_CONFIG", "LOCALE"];

function AuditLog() {
  const [entityType, setEntityType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const qs = new URLSearchParams({ page: String(page) });
  if (entityType !== "ALL") qs.set("entityType", entityType);
  const { data, error, loading, reload } = useApi<AuditResp>(`/admin/discovery/audit?${qs.toString()}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={entityType} onValueChange={v => { setEntityType(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-full rounded-full sm:w-56" aria-label="Filter audit log"><SelectValue /></SelectTrigger>
          <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t === "ALL" ? "All changes" : t.replace("_", " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}</SelectItem>)}</SelectContent>
        </Select>
        {data && <span className="text-xs text-muted-foreground">{n(data.total)} entries</span>}
      </div>
      {loading && !data ? <LoadingBlock rows={6} height="h-11" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : !data || data.entries.length === 0 ? (
        <EmptyState icon="ScrollText" title="No changes recorded yet" />
      ) : (
        <>
          <TableCard minWidth={760}>
            <thead><tr className="border-b bg-secondary/50"><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Entity</Th><Th right>Details</Th></tr></thead>
            <tbody>
              {data.entries.map(e => (
                <Fragment key={e.id}>
                  <tr className="border-b last:border-0 hover:bg-secondary/30">
                    <Td><span title={new Date(e.createdAt).toLocaleString()}>{timeAgo(e.createdAt)}</span><p className="text-[11px] text-muted-foreground">{fmtDate(e.createdAt)}</p></Td>
                    <Td className="text-xs">{e.actorEmail}</Td>
                    <Td><code className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{e.action}</code></Td>
                    <Td className="text-xs"><b>{e.entityType}</b>{e.entityId && <span className="block max-w-56 truncate text-muted-foreground">{e.entityId}</span>}</Td>
                    <Td right>
                      <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
                        {open === e.id ? "Hide" : "Before / after"}
                      </Button>
                    </Td>
                  </tr>
                  {open === e.id && (
                    <tr className="border-b bg-secondary/20">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <JsonBox label="Before" value={e.before} />
                          <JsonBox label="After" value={e.after} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </TableCard>
          {pages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><Icons.ChevronLeft size={15} /> Newer</Button>
              <span className="tabular-nums text-muted-foreground">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" className="rounded-full" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Older <Icons.ChevronRight size={15} /></Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JsonBox({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-xl border bg-background p-3 text-[11px] leading-relaxed">
        {value === null || value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
