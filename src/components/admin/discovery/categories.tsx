"use client";

import { useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { fmtDate } from "@/lib/format";
import { AdminPageHeader } from "../shell";
import {
  useApi, run, LoadingBlock, ErrorBlock, TableCard, Th, Td, n, StatTile, ActiveBadge, ConfirmDialog, Field, kwToText,
} from "./shared";

export type CatRow = {
  id: string; slug: string; name: string; icon: string | null; emoji: string | null; color: string | null;
  coverImageUrl: string | null; description: string | null; keywords: string[]; sortOrder: number;
  active: boolean; retired: boolean; retiredAt: string | null; mergedIntoId: string | null; mergedIntoName: string | null;
  translations: Record<string, string>; subcategoryCount: number; totalSubcategories: number;
  videos: number; primaryVideos: number; views: number; qualifiedViews: number; interestedViewers: number; allSubcategoriesViewers: number;
};
export type SubRow = {
  id: string; slug: string; name: string; emoji: string | null; description: string | null; keywords: string[];
  sortOrder: number; active: boolean; retired: boolean; mergedIntoId: string | null; mergedIntoName: string | null;
  translations: Record<string, string>; videos: number; primaryVideos: number; views: number; interestedViewers: number;
};
export type CatDetail = CatRow & {
  subcategories: SubRow[];
  performanceByLanguage: { code: string; name: string; videos: number; views: number; qualifiedViews: number; likes: number }[];
};

export function CategoriesPage() {
  const route = useRoute();
  const detail = route.segments[3];
  return detail ? <CategoryDetailView id={detail} /> : <CategoryList />;
}

export function CatBubble({ emoji, color, size = 36 }: { emoji: string | null; color: string | null; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: `${color ?? "#1677FF"}22`, fontSize: size * 0.5 }} aria-hidden>
      {emoji ?? "📁"}
    </span>
  );
}

function CategoryList() {
  const { data, error, loading, reload, setData } = useApi<{ categories: CatRow[] }>("/admin/discovery/categories");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<CatRow | "new" | null>(null);
  const [merging, setMerging] = useState<CatRow | null>(null);
  const [retiring, setRetiring] = useState<CatRow | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const coverFor = useRef<CatRow | null>(null);

  const live = useMemo(() => (data?.categories ?? []).filter(c => !c.retired).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)), [data]);
  const retired = useMemo(() => (data?.categories ?? []).filter(c => c.retired), [data]);
  const s = q.trim().toLowerCase();
  const shown = live.filter(c => !s || c.name.toLowerCase().includes(s) || c.slug.includes(s) || (c.translations.hi ?? "").includes(q.trim()));

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= live.length) return;
    const order = live.map(c => c.id);
    [order[idx], order[j]] = [order[j], order[idx]];
    // optimistic: renumber locally, then save the full order
    setData(d => d && { categories: d.categories.map(c => (order.includes(c.id) ? { ...c, sortOrder: (order.indexOf(c.id) + 1) * 10 } : c)) });
    const ok = await run("/admin/discovery/categories/reorder", { method: "POST", body: { ids: order } }, undefined, "Order saved");
    if (!ok) reload();
  };

  const toggle = (c: CatRow) => run(`/admin/discovery/categories/${c.id}`, { method: "PATCH", body: { active: !c.active } }, reload);

  const uploadCover = async (file: File) => {
    const c = coverFor.current;
    if (!c) return;
    const form = new FormData();
    form.append("cover", file);
    await run(`/admin/discovery/categories/${c.id}/cover`, { method: "POST", form }, reload, "Cover updated");
    coverFor.current = null;
  };

  return (
    <div>
      <AdminPageHeader
        title="Main Categories"
        description="The 31 main categories viewers pick in onboarding and creators use to tag videos. Order here is the order everywhere."
        actions={<Button className="grad-btn rounded-full text-white" onClick={() => setEditing("new")}><Icons.Plus size={16} className="mr-1" /> New category</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatTile label="Live categories" value={data ? n(live.length) : "—"} icon={Icons.LayoutGrid} tone="blue" />
        <StatTile label="Active subcategories" value={data ? n(live.reduce((a, c) => a + c.subcategoryCount, 0)) : "—"} icon={Icons.ListTree} tone="pink" />
        <StatTile label="Tagged approved videos" value={data ? n(live.reduce((a, c) => a + c.primaryVideos, 0)) : "—"} icon={Icons.Video} tone="yellow" hint="each video counted once, by its primary category" />
        <StatTile label="Retired" value={data ? n(retired.length) : "—"} icon={Icons.Archive} tone="slate" />
      </div>

      <div className="mb-4 relative w-full sm:max-w-xs">
        <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search categories…" className="h-10 rounded-full pl-9" aria-label="Search categories" />
      </div>

      {loading && !data ? <LoadingBlock rows={8} height="h-14" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : shown.length === 0 ? (
        <EmptyState icon="LayoutGrid" title="No categories match" />
      ) : (
        <TableCard minWidth={980}>
          <thead>
            <tr className="border-b bg-secondary/50">
              <Th className="w-20">Order</Th><Th>Category</Th><Th right>Subcategories</Th><Th right>Videos</Th>
              <Th right>Primary views</Th><Th right>Interested viewers</Th><Th>Status</Th><Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map(c => {
              const idx = live.findIndex(x => x.id === c.id);
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <Td>
                    <div className="flex items-center gap-0.5">
                      <span className="w-6 text-xs tabular-nums text-muted-foreground">{idx + 1}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0 || !!s} onClick={() => move(idx, -1)} aria-label={`Move ${c.name} up`}><Icons.ChevronUp size={15} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === live.length - 1 || !!s} onClick={() => move(idx, 1)} aria-label={`Move ${c.name} down`}><Icons.ChevronDown size={15} /></Button>
                    </div>
                  </Td>
                  <Td>
                    <button className="flex items-center gap-3 text-left" onClick={() => navigate(`/admin/discovery/categories/${c.id}`)}>
                      {c.coverImageUrl
                        ? <img src={c.coverImageUrl} alt="" className="h-9 w-14 shrink-0 rounded-lg object-cover" />
                        : <CatBubble emoji={c.emoji} color={c.color} />}
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-semibold hover:text-brand-blue">
                          {c.coverImageUrl && <span aria-hidden>{c.emoji}</span>}{c.name}
                          {c.color && <span className="inline-block h-3 w-3 rounded-full border" style={{ background: c.color }} title={c.color} />}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{c.translations.hi ? `${c.translations.hi} · ` : ""}/{c.slug}</span>
                      </span>
                    </button>
                  </Td>
                  <Td right>{n(c.subcategoryCount)}{c.totalSubcategories !== c.subcategoryCount && <span className="text-[11px] text-muted-foreground"> / {c.totalSubcategories}</span>}</Td>
                  <Td right>{n(c.videos)}<p className="text-[11px] text-muted-foreground">{n(c.primaryVideos)} primary</p></Td>
                  <Td right>{n(c.views)}</Td>
                  <Td right>{n(c.interestedViewers)}</Td>
                  <Td>
                    <ActiveBadge active={c.active} />
                    {c.active && c.subcategoryCount === 0 && <p className="mt-1 text-[11px] text-amber-700">Hidden — add a subcategory</p>}
                  </Td>
                  <Td right>
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => setEditing(c)}><Icons.Pencil size={13} className="mr-1" /> Edit</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 rounded-full p-0" aria-label={`More actions for ${c.name}`}><Icons.Ellipsis size={15} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => navigate(`/admin/discovery/categories/${c.id}`)}><Icons.ChartColumn size={14} className="mr-2" /> Details & performance</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/discovery/subcategories?category=${c.id}`)}><Icons.ListTree size={14} className="mr-2" /> Manage subcategories</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggle(c)}>
                            {c.active ? <><Icons.EyeOff size={14} className="mr-2" /> Deactivate</> : <><Icons.Eye size={14} className="mr-2" /> Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { coverFor.current = c; coverInput.current?.click(); }}><Icons.ImageUp size={14} className="mr-2" /> Upload cover</DropdownMenuItem>
                          {c.coverImageUrl && (
                            <DropdownMenuItem onClick={() => run(`/admin/discovery/categories/${c.id}`, { method: "PATCH", body: { coverImageUrl: "" } }, reload, "Cover removed")}>
                              <Icons.ImageOff size={14} className="mr-2" /> Remove cover
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setMerging(c)}><Icons.Merge size={14} className="mr-2" /> Merge into…</DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-600" onClick={() => setRetiring(c)}><Icons.Archive size={14} className="mr-2" /> Retire</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      )}

      {retired.length > 0 && (
        <div className="mt-6">
          <button className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-ink" onClick={() => setShowRetired(v => !v)} aria-expanded={showRetired}>
            {showRetired ? <Icons.ChevronDown size={16} /> : <Icons.ChevronRight size={16} />} Retired categories ({retired.length})
          </button>
          {showRetired && (
            <div className="mt-3">
              <TableCard minWidth={720}>
                <thead><tr className="border-b bg-secondary/50"><Th>Category</Th><Th>Retired</Th><Th>Merged into</Th><Th right>Videos</Th><Th right>Actions</Th></tr></thead>
                <tbody>
                  {retired.map(c => (
                    <tr key={c.id} className="border-b last:border-0">
                      <Td><span className="flex items-center gap-2"><CatBubble emoji={c.emoji} color={c.color} size={28} /><span className="font-semibold">{c.name}</span></span></Td>
                      <Td>{fmtDate(c.retiredAt)}</Td>
                      <Td>{c.mergedIntoName ?? <span className="text-muted-foreground">—</span>}</Td>
                      <Td right>{n(c.videos)}</Td>
                      <Td right>
                        <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => run(`/admin/discovery/categories/${c.id}/restore`, { method: "POST" }, reload)}>
                          <Icons.RotateCcw size={13} className="mr-1" /> Restore
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>
              <p className="mt-2 text-xs text-muted-foreground">Retired categories keep their history. Links to a merged category open the category it was merged into.</p>
            </div>
          )}
        </div>
      )}

      <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />

      {editing && <CategoryDialog cat={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}

      {merging && (
        <MergeCategoryDialog source={merging} targets={live.filter(c => c.id !== merging.id && c.active)} onClose={() => setMerging(null)} onDone={() => { setMerging(null); reload(); }} />
      )}

      <ConfirmDialog
        open={!!retiring} onOpenChange={v => !v && setRetiring(null)} destructive confirmLabel="Retire category"
        title={`Retire ${retiring?.name ?? ""}?`}
        description={<>
          <p>It disappears from onboarding, Explore and the upload form. Videos already tagged keep their tags, views and history.</p>
          <p>You can restore it any time from &ldquo;Retired categories&rdquo;.</p>
        </>}
        onConfirm={async () => { if (retiring) await run(`/admin/discovery/categories/${retiring.id}/retire`, { method: "POST" }, () => { setRetiring(null); reload(); }); }}
      />
    </div>
  );
}

export function CategoryDialog({ cat, onClose, onSaved }: { cat: CatRow | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !cat;
  const [f, setF] = useState({
    name: cat?.name ?? "", slug: cat?.slug ?? "", emoji: cat?.emoji ?? "", color: cat?.color ?? "#1677FF",
    description: cat?.description ?? "", keywords: kwToText(cat?.keywords), nameHi: cat?.translations.hi ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: string) => setF(p => ({ ...p, [k]: v }));
  const hexOk = !f.color || /^#[0-9a-fA-F]{6}$/.test(f.color);

  const save = async () => {
    setBusy(true);
    try {
      if (isNew) {
        const res = await run("/admin/discovery/categories", {
          method: "POST",
          body: { name: f.name, emoji: f.emoji, color: f.color, description: f.description, keywords: f.keywords, nameHi: f.nameHi },
        });
        if (res) onSaved();
        return;
      }
      const changed: Record<string, string> = {};
      if (f.name !== cat!.name) changed.name = f.name;
      if (f.slug !== cat!.slug) changed.slug = f.slug;
      if (f.emoji !== (cat!.emoji ?? "")) changed.emoji = f.emoji;
      if (f.color !== (cat!.color ?? "")) changed.color = f.color;
      if (f.description !== (cat!.description ?? "")) changed.description = f.description;
      if (f.keywords !== kwToText(cat!.keywords)) changed.keywords = f.keywords;
      const hiChanged = f.nameHi.trim() !== (cat!.translations.hi ?? "");
      let ok = true;
      if (Object.keys(changed).length) ok = !!(await run(`/admin/discovery/categories/${cat!.id}`, { method: "PATCH", body: changed }));
      if (ok && hiChanged) {
        ok = !!(await run("/admin/discovery/translations", { method: "PUT", body: { locale: "hi", items: [{ categoryId: cat!.id, name: f.nameHi.trim() }] } }, undefined, "Hindi name saved"));
      }
      if (ok) onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={v => !v && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "New main category" : `Edit ${cat!.name}`}</DialogTitle>
          <DialogDescription>{isNew ? "After creating it, add at least one subcategory — categories without subcategories stay hidden." : "Names show in onboarding, Explore, filters and the upload form."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2"><Input value={f.name} onChange={e => set("name", e.target.value)} maxLength={60} className="rounded-xl" /></Field>
          <Field label="Hindi name" hint="optional"><Input value={f.nameHi} onChange={e => set("nameHi", e.target.value)} maxLength={80} className="rounded-xl" lang="hi" /></Field>
          {!isNew && (
            <Field label="Slug" hint="changes public links"><Input value={f.slug} onChange={e => set("slug", e.target.value)} maxLength={60} className="rounded-xl" /></Field>
          )}
          <Field label="Emoji / icon"><Input value={f.emoji} onChange={e => set("emoji", e.target.value)} maxLength={16} className="rounded-xl" placeholder="😂" /></Field>
          <Field label="Accent colour">
            <div className="flex gap-2">
              <input type="color" value={hexOk && f.color ? f.color : "#1677FF"} onChange={e => set("color", e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border" aria-label="Pick colour" />
              <Input value={f.color} onChange={e => set("color", e.target.value)} maxLength={7} className={`rounded-xl ${hexOk ? "" : "border-rose-400"}`} />
            </div>
          </Field>
          <Field label="Description" hint="optional" className="sm:col-span-2"><Textarea value={f.description} onChange={e => set("description", e.target.value)} maxLength={300} rows={2} className="rounded-xl" /></Field>
          <Field label="Search keywords" hint="comma-separated — used for search and upload suggestions" className="sm:col-span-2">
            <Textarea value={f.keywords} onChange={e => set("keywords", e.target.value)} rows={2} className="rounded-xl" placeholder="rhymes, songs, sing along" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button className="grad-btn rounded-full text-white" disabled={busy || f.name.trim().length < 2 || !hexOk} onClick={save}>
            {busy ? "Saving…" : isNew ? "Create category" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MergeCategoryDialog({ source, targets, onClose, onDone }: { source: CatRow; targets: CatRow[]; onClose: () => void; onDone: () => void }) {
  const [targetId, setTargetId] = useState("");
  const target = targets.find(t => t.id === targetId);
  return (
    <ConfirmDialog
      open onOpenChange={v => !v && onClose()} destructive confirmLabel="Merge categories" confirmDisabled={!targetId}
      title={`Merge ${source.name} into…`}
      description={<>
        <p>Everything moves to the category you pick:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>{n(source.videos)}</b> tagged video(s) — subcategories with the same name merge, the rest move under the new category.</li>
          <li><b>{n(source.interestedViewers)}</b> viewer interest(s) and creators&apos; channel preferences.</li>
          <li>{source.name} is then retired. Content IDs, views, earnings and the audit history are kept.</li>
        </ul>
      </>}
      onConfirm={async () => { await run(`/admin/discovery/categories/${source.id}/merge`, { method: "POST", body: { targetId } }, onDone); }}
    >
      <Field label="Merge into">
        <Select value={targetId} onValueChange={setTargetId}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a category" /></SelectTrigger>
          <SelectContent className="max-h-72">{targets.map(t => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.name}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      {target && <p className="text-xs text-muted-foreground">{source.emoji} {source.name} → {target.emoji} {target.name}</p>}
    </ConfirmDialog>
  );
}

function CategoryDetailView({ id }: { id: string }) {
  const { data, error, loading, reload } = useApi<{ category: CatDetail }>(`/admin/discovery/categories/${encodeURIComponent(id)}`);
  const [editing, setEditing] = useState(false);
  const c = data?.category;
  const maxViews = Math.max(1, ...(c?.performanceByLanguage ?? []).map(p => p.views));

  return (
    <div>
      <button className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink" onClick={() => navigate("/admin/discovery/categories")}>
        <Icons.ArrowLeft size={15} /> All categories
      </button>
      {loading && !data ? <LoadingBlock rows={4} height="h-24" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : c && (
        <>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <CatBubble emoji={c.emoji} color={c.color} size={52} />
              <div>
                <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold">{c.name} <ActiveBadge active={c.active} retired={c.retired} /></h1>
                <p className="text-sm text-muted-foreground">{c.translations.hi ? `${c.translations.hi} · ` : ""}/{c.slug}{c.mergedIntoName ? ` · merged into ${c.mergedIntoName}` : ""}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => navigate(`/admin/discovery/subcategories?category=${c.id}`)}><Icons.ListTree size={15} className="mr-1" /> Manage subcategories</Button>
              {!c.retired && <Button className="grad-btn rounded-full text-white" onClick={() => setEditing(true)}><Icons.Pencil size={15} className="mr-1" /> Edit</Button>}
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Tagged videos (any position)" value={n(c.videos)} icon={Icons.Video} tone="blue" />
            <StatTile label="Videos with this as primary" value={n(c.primaryVideos)} icon={Icons.Star} tone="yellow" />
            <StatTile label="Primary views" value={n(c.views)} icon={Icons.Eye} tone="pink" hint={`${n(c.qualifiedViews)} qualified`} />
            <StatTile label="Interested viewers" value={n(c.interestedViewers)} icon={Icons.Heart} tone="green" hint={`${n(c.allSubcategoriesViewers)} chose “All subcategories”`} />
          </div>

          {(c.coverImageUrl || c.description || c.keywords.length > 0) && (
            <div className="bento mb-5 flex flex-col gap-4 p-4 sm:flex-row">
              {c.coverImageUrl && <img src={c.coverImageUrl} alt={`${c.name} cover`} className="h-28 w-full rounded-xl object-cover sm:w-48" />}
              <div className="min-w-0 space-y-2">
                {c.description && <p className="text-sm">{c.description}</p>}
                {c.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{c.keywords.map(k => <span key={k} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">{k}</span>)}</div>
                )}
              </div>
            </div>
          )}

          <h2 className="mb-2 font-display text-base font-bold">Subcategories ({c.subcategories.length})</h2>
          {c.subcategories.length === 0 ? (
            <EmptyState icon="ListTree" title="No subcategories yet" description="Add one so viewers and creators can pick this category." action={{ label: "Add subcategories", onClick: () => navigate(`/admin/discovery/subcategories?category=${c.id}`) }} />
          ) : (
            <TableCard minWidth={720}>
              <thead><tr className="border-b bg-secondary/50"><Th>Subcategory</Th><Th>Status</Th><Th right>Videos</Th><Th right>Primary</Th><Th right>Primary views</Th><Th right>Interested viewers</Th></tr></thead>
              <tbody>
                {c.subcategories.map(s => (
                  <tr key={s.id} className="border-b last:border-0">
                    <Td>
                      <span className="font-semibold">{s.emoji ? `${s.emoji} ` : ""}{s.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{s.translations.hi ? `${s.translations.hi} · ` : ""}/{s.slug}{s.mergedIntoName ? ` · merged into ${s.mergedIntoName}` : ""}</span>
                    </Td>
                    <Td><ActiveBadge active={s.active} retired={s.retired} /></Td>
                    <Td right>{n(s.videos)}</Td><Td right>{n(s.primaryVideos)}</Td><Td right>{n(s.views)}</Td><Td right>{n(s.interestedViewers)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}

          <h2 className="mb-2 mt-6 font-display text-base font-bold">Performance by language</h2>
          {c.performanceByLanguage.length === 0 ? (
            <EmptyState icon="Languages" title="No approved videos yet" description="Shows views per primary language for videos whose primary category is this one." />
          ) : (
            <TableCard minWidth={620}>
              <thead><tr className="border-b bg-secondary/50"><Th>Language</Th><Th right>Videos</Th><Th className="w-1/3">Views</Th><Th right>Qualified</Th><Th right>Likes</Th></tr></thead>
              <tbody>
                {c.performanceByLanguage.map(p => (
                  <tr key={p.code} className="border-b last:border-0">
                    <Td><span className="font-semibold">{p.name}</span> <code className="text-[11px] text-muted-foreground">{p.code}</code></Td>
                    <Td right>{n(p.videos)}</Td>
                    <Td><div className="flex items-center gap-2"><span className="w-20 text-right tabular-nums">{n(p.views)}</span><BarInline value={p.views} max={maxViews} /></div></Td>
                    <Td right>{n(p.qualifiedViews)}</Td><Td right>{n(p.likes)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Views are attributed once, to each video&apos;s primary language and primary category — no double counting.</p>

          {editing && <CategoryDialog cat={c} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />}
        </>
      )}
    </div>
  );
}

function BarInline({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
      <div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.max(2, Math.round((value / max) * 100))}%` }} />
    </div>
  );
}
