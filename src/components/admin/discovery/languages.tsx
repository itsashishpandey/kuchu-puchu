"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/ui-bits";
import { AdminPageHeader } from "../shell";
import { useApi, run, LoadingBlock, ErrorBlock, TableCard, Th, Td, n, StatTile, ActiveBadge, LangLabel, Field } from "./shared";

type LangRow = {
  id: string; code: string; iso6391: string | null; iso6393: string; nameEn: string; nameNative: string;
  script: string; direction: string; region: string | null; group: string; popular: boolean; priority: number;
  active: boolean; videos: number; viewers: number; views: number; qualifiedViews: number;
};
type LangResp = { languages: LangRow[]; total: number; active: number; attribution: string };

const SORTS = {
  order: { label: "Display order", fn: (a: LangRow, b: LangRow) => a.priority - b.priority || a.nameEn.localeCompare(b.nameEn) },
  videos: { label: "Most videos", fn: (a: LangRow, b: LangRow) => b.videos - a.videos || a.priority - b.priority },
  viewers: { label: "Most viewers", fn: (a: LangRow, b: LangRow) => b.viewers - a.viewers || a.priority - b.priority },
  views: { label: "Most views", fn: (a: LangRow, b: LangRow) => b.views - a.views || a.priority - b.priority },
  az: { label: "A–Z", fn: (a: LangRow, b: LangRow) => a.nameEn.localeCompare(b.nameEn) },
} as const;

export function LanguagesPage() {
  const { data, error, loading, reload } = useApi<LangResp>("/admin/discovery/languages");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<keyof typeof SORTS>("order");
  const [editing, setEditing] = useState<LangRow | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.languages ?? [])
      .filter(l => (status === "active" ? l.active : status === "inactive" ? !l.active : true))
      .filter(l => !s || l.code.toLowerCase().includes(s) || l.nameEn.toLowerCase().includes(s) || l.nameNative.toLowerCase().includes(s) || (l.region ?? "").toLowerCase().includes(s))
      .sort(SORTS[sort].fn);
  }, [data, q, status, sort]);

  const toggle = async (l: LangRow) => {
    setBusyId(l.id);
    await run(`/admin/discovery/languages/${l.id}`, { method: "PATCH", body: { active: !l.active } }, reload);
    setBusyId(null);
  };

  const withVideos = (data?.languages ?? []).filter(l => l.videos > 0).length;

  return (
    <div>
      <AdminPageHeader
        title="Languages"
        description="The languages viewers can choose and creators can tag. Deactivating hides a language from pickers; videos already tagged keep it."
        actions={<Button className="grad-btn rounded-full text-white" onClick={() => setEditing("new")}><Icons.Plus size={16} className="mr-1" /> Add language</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Languages" value={data ? n(data.total) : "—"} icon={Icons.Languages} tone="blue" />
        <StatTile label="Active in pickers" value={data ? n(data.active) : "—"} icon={Icons.CircleCheck} tone="green" />
        <StatTile label="With approved videos" value={data ? n(withVideos) : "—"} icon={Icons.Video} tone="pink" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, native name or code…" className="h-10 rounded-full pl-9" aria-label="Search languages" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "inactive"] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition ${status === s ? "border-transparent bg-foreground text-background" : "bg-background hover:bg-secondary"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <Select value={sort} onValueChange={v => setSort(v as keyof typeof SORTS)}>
            <SelectTrigger className="h-9 w-44 rounded-full" aria-label="Sort languages"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SORTS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {loading && !data ? <LoadingBlock rows={6} height="h-12" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : rows.length === 0 ? (
        <EmptyState icon="Languages" title="No languages match" description="Try another search or status filter." />
      ) : (
        <>
          <TableCard minWidth={820}>
            <thead>
              <tr className="border-b bg-secondary/50">
                <Th>Language</Th><Th>Code</Th><Th>Status</Th><Th right>Videos</Th><Th right>Viewers</Th><Th right>Total Views</Th><Th right>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <Td>
                    <div className="flex items-center gap-2">
                      <LangLabel nameNative={l.nameNative} nameEn={l.nameEn} direction={l.direction} />
                      {l.popular && <span className="rounded-full bg-brand-yellow-soft px-2 py-0.5 text-[10px] font-bold text-amber-700">Popular</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {l.group === "INDIAN" ? "Indian" : "International"} · {l.script}{l.direction === "RTL" ? " · right-to-left" : ""}{l.region ? ` · ${l.region}` : ""} · order {l.priority}
                    </p>
                  </Td>
                  <Td>
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{l.code}</code>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">ISO {l.iso6391 ? `${l.iso6391} / ` : ""}{l.iso6393}</p>
                  </Td>
                  <Td><ActiveBadge active={l.active} /></Td>
                  <Td right>{n(l.videos)}</Td>
                  <Td right>{n(l.viewers)}</Td>
                  <Td right>
                    {n(l.views)}
                    {l.qualifiedViews > 0 && <p className="text-[11px] text-muted-foreground">{n(l.qualifiedViews)} qualified</p>}
                  </Td>
                  <Td right>
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => setEditing(l)}><Icons.Pencil size={13} className="mr-1" /> Edit</Button>
                      <Button size="sm" variant="outline" disabled={busyId === l.id}
                        className={`h-8 rounded-full ${l.active ? "text-amber-700" : "text-emerald-700"}`} onClick={() => toggle(l)}>
                        {l.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableCard>
          <p className="mt-3 text-xs text-muted-foreground">
            <Icons.Info size={12} className="mr-1 inline" />
            Views are counted once, under each video&apos;s primary language. &ldquo;Videos&rdquo; counts approved videos tagged with the language in any position; &ldquo;Viewers&rdquo; counts viewers who chose it.
          </p>
        </>
      )}

      {editing && <LanguageDialog lang={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function LanguageDialog({ lang, onClose, onSaved }: { lang: LangRow | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    code: lang?.code ?? "", iso6391: lang?.iso6391 ?? "", iso6393: lang?.iso6393 ?? "",
    nameEn: lang?.nameEn ?? "", nameNative: lang?.nameNative ?? "", script: lang?.script ?? "Latn",
    direction: lang?.direction ?? "LTR", region: lang?.region ?? "", group: lang?.group ?? "INTERNATIONAL",
    popular: lang?.popular ?? false, priority: lang ? String(lang.priority) : "", active: lang?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }));
  const isNew = !lang;
  const valid = f.nameEn.trim().length >= 2 && /^[A-Z][a-z]{3}$/.test(f.script) &&
    (!isNew || (/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(f.code) && /^[a-z]{3}$/.test(f.iso6393))) &&
    (!f.iso6391 || /^[a-z]{2}$/.test(f.iso6391));

  const save = async () => {
    setBusy(true);
    const body = {
      nameEn: f.nameEn, nameNative: f.nameNative || f.nameEn, script: f.script, direction: f.direction,
      region: f.region, group: f.group, popular: f.popular, iso6391: f.iso6391,
      ...(f.priority ? { priority: Number(f.priority) } : {}),
      ...(isNew ? { code: f.code, iso6393: f.iso6393, active: f.active } : {}),
    };
    const res = await run(isNew ? "/admin/discovery/languages" : `/admin/discovery/languages/${lang!.id}`, { method: isNew ? "POST" : "PATCH", body });
    setBusy(false);
    if (res) onSaved();
  };

  return (
    <Dialog open onOpenChange={v => !v && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add a language" : `Edit ${lang!.nameEn}`}</DialogTitle>
          <DialogDescription>
            {isNew ? "Codes follow BCP 47 (e.g. hi, pnb, zh-Hans) and can't be changed later because they're used in links and the app."
              : <>Code <code>{lang!.code}</code> and ISO 639-3 <code>{lang!.iso6393}</code> are fixed.</>}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {isNew && (
            <>
              <Field label="Code (BCP 47)" hint="e.g. hi, pnb, zh-Hans"><Input value={f.code} onChange={e => set("code", e.target.value.trim())} className="rounded-xl" /></Field>
              <Field label="ISO 639-3" hint="three letters"><Input value={f.iso6393} onChange={e => set("iso6393", e.target.value.trim().toLowerCase())} maxLength={3} className="rounded-xl" /></Field>
            </>
          )}
          <Field label="English name"><Input value={f.nameEn} onChange={e => set("nameEn", e.target.value)} className="rounded-xl" /></Field>
          <Field label="Native name"><Input value={f.nameNative} dir={f.direction === "RTL" ? "rtl" : undefined} onChange={e => set("nameNative", e.target.value)} className="rounded-xl" /></Field>
          <Field label="ISO 639-1" hint="optional, two letters"><Input value={f.iso6391} onChange={e => set("iso6391", e.target.value.trim().toLowerCase())} maxLength={2} className="rounded-xl" /></Field>
          <Field label="Script (ISO 15924)" hint="e.g. Latn, Deva, Arab"><Input value={f.script} onChange={e => set("script", e.target.value.trim())} maxLength={4} className="rounded-xl" /></Field>
          <Field label="Text direction">
            <Select value={f.direction} onValueChange={v => set("direction", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="LTR">Left to right</SelectItem><SelectItem value="RTL">Right to left</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Group">
            <Select value={f.group} onValueChange={v => set("group", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="INDIAN">Indian languages</SelectItem><SelectItem value="INTERNATIONAL">International</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Region" hint="optional"><Input value={f.region} onChange={e => set("region", e.target.value)} className="rounded-xl" /></Field>
          <Field label="Display order" hint="lower shows first"><Input type="number" min={1} value={f.priority} onChange={e => set("priority", e.target.value)} placeholder={isNew ? "last" : ""} className="rounded-xl" /></Field>
          <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm sm:col-span-2">
            <span><span className="font-semibold">Popular</span> <span className="text-muted-foreground">— shown first in pickers</span></span>
            <Switch checked={f.popular} onCheckedChange={v => set("popular", v)} />
          </label>
          {isNew && (
            <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm sm:col-span-2">
              <span><span className="font-semibold">Active</span> <span className="text-muted-foreground">— available to viewers and creators</span></span>
              <Switch checked={f.active} onCheckedChange={v => set("active", v)} />
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button className="grad-btn rounded-full text-white" disabled={busy || !valid} onClick={save}>{busy ? "Saving…" : isNew ? "Add language" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
