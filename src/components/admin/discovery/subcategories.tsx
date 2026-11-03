"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { AdminPageHeader } from "../shell";
import { useApi, run, LoadingBlock, ErrorBlock, TableCard, Th, Td, n, ActiveBadge, ConfirmDialog, Field, kwToText } from "./shared";
import { CatBubble, type CatRow, type CatDetail, type SubRow } from "./categories";

type AnySub = { id: string; name: string; emoji: string | null; categoryId: string; categoryName: string; active: boolean; retired: boolean };

export function SubcategoriesPage() {
  const route = useRoute();
  const cats = useApi<{ categories: CatRow[] }>("/admin/discovery/categories");
  const liveCats = useMemo(() => (cats.data?.categories ?? []).filter(c => !c.retired).sort((a, b) => a.sortOrder - b.sortOrder), [cats.data]);
  const retiredCats = useMemo(() => (cats.data?.categories ?? []).filter(c => c.retired), [cats.data]);
  const selectedId = route.query.get("category") || liveCats[0]?.id || null;
  const detail = useApi<{ category: CatDetail }>(selectedId ? `/admin/discovery/categories/${encodeURIComponent(selectedId)}` : null);
  const cat = detail.data?.category;

  const [editing, setEditing] = useState<SubRow | "new" | null>(null);
  const [merging, setMerging] = useState<SubRow | null>(null);
  const [retiring, setRetiring] = useState<SubRow | null>(null);
  const [q, setQ] = useState("");

  const live = useMemo(() => (cat?.subcategories ?? []).filter(s => !s.retired).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)), [cat]);
  const retired = useMemo(() => (cat?.subcategories ?? []).filter(s => s.retired), [cat]);
  const s = q.trim().toLowerCase();
  const shown = live.filter(x => !s || x.name.toLowerCase().includes(s) || x.slug.includes(s) || (x.translations.hi ?? "").includes(q.trim()));
  const reloadAll = () => { detail.reload(); cats.reload(); };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= live.length) return;
    const order = live.map(x => x.id);
    [order[idx], order[j]] = [order[j], order[idx]];
    detail.setData(d => d && { category: { ...d.category, subcategories: d.category.subcategories.map(x => (order.includes(x.id) ? { ...x, sortOrder: (order.indexOf(x.id) + 1) * 10 } : x)) } });
    const ok = await run("/admin/discovery/subcategories/reorder", { method: "POST", body: { ids: order } }, undefined, "Order saved");
    if (!ok) detail.reload();
  };

  return (
    <div>
      <AdminPageHeader
        title="Subcategories"
        description="Each main category's subcategories. Viewers pick them in onboarding; creators pick one per category when tagging."
        actions={cat && !cat.retired && <Button className="grad-btn rounded-full text-white" onClick={() => setEditing("new")}><Icons.Plus size={16} className="mr-1" /> Add subcategory</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={selectedId ?? undefined} onValueChange={v => navigate(`/admin/discovery/subcategories?category=${v}`, { replace: true })}>
          <SelectTrigger className="h-10 w-full rounded-full sm:w-80" aria-label="Main category"><SelectValue placeholder={cats.loading ? "Loading categories…" : "Choose a main category"} /></SelectTrigger>
          <SelectContent className="max-h-80">
            {liveCats.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name} ({c.subcategoryCount})</SelectItem>)}
            {retiredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name} — retired</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative w-full sm:max-w-xs">
          <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search subcategories…" className="h-10 rounded-full pl-9" aria-label="Search subcategories" />
        </div>
        {cat && (
          <button className="text-sm font-semibold text-brand-blue hover:underline sm:ml-auto" onClick={() => navigate(`/admin/discovery/categories/${cat.id}`)}>
            Category details →
          </button>
        )}
      </div>

      {cats.error && !cats.data ? <ErrorBlock message={cats.error} onRetry={cats.reload} />
        : (detail.loading && !detail.data) || (cats.loading && !cats.data) ? <LoadingBlock rows={8} height="h-12" />
        : detail.error && !detail.data ? <ErrorBlock message={detail.error} onRetry={detail.reload} />
        : !cat ? <EmptyState icon="ListTree" title="Choose a main category" />
        : (
          <>
            <div className="mb-3 flex items-center gap-2 text-sm">
              <CatBubble emoji={cat.emoji} color={cat.color} size={30} />
              <span className="font-semibold">{cat.name}</span>
              <ActiveBadge active={cat.active} retired={cat.retired} />
              <span className="text-muted-foreground">· {live.filter(x => x.active).length} active of {live.length}</span>
            </div>
            {cat.retired && <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">This category is retired{cat.mergedIntoName ? ` (merged into ${cat.mergedIntoName})` : ""}. Restore it from Main Categories to add subcategories.</p>}
            {shown.length === 0 ? (
              <EmptyState icon="ListTree" title={live.length ? "No subcategories match" : "No subcategories yet"}
                description={live.length ? undefined : "A category needs at least one active subcategory to appear for viewers and creators."}
                action={!live.length && !cat.retired ? { label: "Add subcategory", onClick: () => setEditing("new") } : undefined} />
            ) : (
              <TableCard minWidth={900}>
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <Th className="w-20">Order</Th><Th>Subcategory</Th><Th>Status</Th><Th right>Videos</Th><Th right>Primary</Th>
                    <Th right>Primary views</Th><Th right>Interested viewers</Th><Th right>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(x => {
                    const idx = live.findIndex(y => y.id === x.id);
                    return (
                      <tr key={x.id} className="border-b last:border-0 hover:bg-secondary/30">
                        <Td>
                          <div className="flex items-center gap-0.5">
                            <span className="w-6 text-xs tabular-nums text-muted-foreground">{idx + 1}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0 || !!s} onClick={() => move(idx, -1)} aria-label={`Move ${x.name} up`}><Icons.ChevronUp size={15} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === live.length - 1 || !!s} onClick={() => move(idx, 1)} aria-label={`Move ${x.name} down`}><Icons.ChevronDown size={15} /></Button>
                          </div>
                        </Td>
                        <Td>
                          <span className="font-semibold">{x.emoji ? `${x.emoji} ` : ""}{x.name}</span>
                          <span className="block text-[11px] text-muted-foreground">{x.translations.hi ? `${x.translations.hi} · ` : ""}/{x.slug}{x.keywords.length ? ` · ${x.keywords.length} keyword${x.keywords.length > 1 ? "s" : ""}` : ""}</span>
                        </Td>
                        <Td><ActiveBadge active={x.active} /></Td>
                        <Td right>{n(x.videos)}</Td><Td right>{n(x.primaryVideos)}</Td><Td right>{n(x.views)}</Td><Td right>{n(x.interestedViewers)}</Td>
                        <Td right>
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => setEditing(x)}><Icons.Pencil size={13} className="mr-1" /> Edit</Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 rounded-full p-0" aria-label={`More actions for ${x.name}`}><Icons.Ellipsis size={15} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => run(`/admin/discovery/subcategories/${x.id}`, { method: "PATCH", body: { active: !x.active } }, reloadAll)}>
                                  {x.active ? <><Icons.EyeOff size={14} className="mr-2" /> Deactivate</> : <><Icons.Eye size={14} className="mr-2" /> Activate</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setMerging(x)}><Icons.Merge size={14} className="mr-2" /> Merge into…</DropdownMenuItem>
                                <DropdownMenuItem className="text-rose-600" onClick={() => setRetiring(x)}><Icons.Archive size={14} className="mr-2" /> Retire</DropdownMenuItem>
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
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Retired subcategories ({retired.length})</h3>
                <div className="bento divide-y">
                  {retired.map(x => (
                    <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                      <span>{x.emoji ? `${x.emoji} ` : ""}{x.name}{x.mergedIntoName && <span className="text-muted-foreground"> → merged into {x.mergedIntoName}</span>}<span className="text-muted-foreground"> · {n(x.videos)} videos</span></span>
                      <Button size="sm" variant="outline" className="h-8 rounded-full" disabled={cat.retired}
                        onClick={() => run(`/admin/discovery/subcategories/${x.id}/restore`, { method: "POST" }, reloadAll)}>
                        <Icons.RotateCcw size={13} className="mr-1" /> Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      {editing && cat && (
        <SubcategoryDialog categoryId={cat.id} categoryName={cat.name} sub={editing === "new" ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadAll(); }} />
      )}
      {merging && <MergeSubDialog source={merging} cats={cats.data?.categories ?? []} onClose={() => setMerging(null)} onDone={() => { setMerging(null); reloadAll(); }} />}
      <ConfirmDialog
        open={!!retiring} onOpenChange={v => !v && setRetiring(null)} destructive confirmLabel="Retire subcategory"
        title={`Retire ${retiring?.name ?? ""}?`}
        description={<>
          <p>It&apos;s hidden from onboarding, filters and the upload form. Videos keep the tag and their history; viewers who chose it keep the rest of their interests.</p>
          <p>You can restore it later.</p>
        </>}
        onConfirm={async () => { if (retiring) await run(`/admin/discovery/subcategories/${retiring.id}/retire`, { method: "POST" }, () => { setRetiring(null); reloadAll(); }); }}
      />
    </div>
  );
}

function SubcategoryDialog({ categoryId, categoryName, sub, onClose, onSaved }: {
  categoryId: string; categoryName: string; sub: SubRow | null; onClose: () => void; onSaved: () => void;
}) {
  const isNew = !sub;
  const [f, setF] = useState({
    name: sub?.name ?? "", slug: sub?.slug ?? "", emoji: sub?.emoji ?? "", description: sub?.description ?? "",
    keywords: kwToText(sub?.keywords), nameHi: sub?.translations.hi ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: string) => setF(p => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      if (isNew) {
        const res = await run("/admin/discovery/subcategories", {
          method: "POST", body: { categoryId, name: f.name, emoji: f.emoji, description: f.description, keywords: f.keywords, nameHi: f.nameHi },
        });
        if (res) onSaved();
        return;
      }
      const changed: Record<string, string> = {};
      if (f.name !== sub!.name) changed.name = f.name;
      if (f.slug !== sub!.slug) changed.slug = f.slug;
      if (f.emoji !== (sub!.emoji ?? "")) changed.emoji = f.emoji;
      if (f.description !== (sub!.description ?? "")) changed.description = f.description;
      if (f.keywords !== kwToText(sub!.keywords)) changed.keywords = f.keywords;
      let ok = true;
      if (Object.keys(changed).length) ok = !!(await run(`/admin/discovery/subcategories/${sub!.id}`, { method: "PATCH", body: changed }));
      if (ok && f.nameHi.trim() !== (sub!.translations.hi ?? "")) {
        ok = !!(await run("/admin/discovery/translations", { method: "PUT", body: { locale: "hi", items: [{ subcategoryId: sub!.id, name: f.nameHi.trim() }] } }, undefined, "Hindi name saved"));
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
          <DialogTitle>{isNew ? `Add a subcategory to ${categoryName}` : `Edit ${sub!.name}`}</DialogTitle>
          <DialogDescription>Keywords help search and upload suggestions find the right subcategory.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2"><Input value={f.name} onChange={e => set("name", e.target.value)} maxLength={60} className="rounded-xl" /></Field>
          <Field label="Hindi name" hint="optional"><Input value={f.nameHi} onChange={e => set("nameHi", e.target.value)} maxLength={80} className="rounded-xl" lang="hi" /></Field>
          <Field label="Emoji" hint="optional"><Input value={f.emoji} onChange={e => set("emoji", e.target.value)} maxLength={16} className="rounded-xl" /></Field>
          {!isNew && <Field label="Slug" hint="changes links" className="sm:col-span-2"><Input value={f.slug} onChange={e => set("slug", e.target.value)} maxLength={60} className="rounded-xl" /></Field>}
          <Field label="Description" hint="optional" className="sm:col-span-2"><Textarea value={f.description} onChange={e => set("description", e.target.value)} maxLength={300} rows={2} className="rounded-xl" /></Field>
          <Field label="Search keywords" hint="comma-separated" className="sm:col-span-2"><Textarea value={f.keywords} onChange={e => set("keywords", e.target.value)} rows={2} className="rounded-xl" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button className="grad-btn rounded-full text-white" disabled={busy || f.name.trim().length < 2} onClick={save}>{busy ? "Saving…" : isNew ? "Add subcategory" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MergeSubDialog({ source, cats, onClose, onDone }: { source: SubRow; cats: CatRow[]; onClose: () => void; onDone: () => void }) {
  const all = useApi<{ subcategories: AnySub[] }>("/admin/discovery/subcategories");
  const [target, setTarget] = useState<AnySub | null>(null);
  const liveCatIds = new Set(cats.filter(c => c.active && !c.retired).map(c => c.id));
  const options = (all.data?.subcategories ?? []).filter(x => x.id !== source.id && x.active && !x.retired && liveCatIds.has(x.categoryId));
  const byCat = new Map<string, AnySub[]>();
  options.forEach(o => byCat.set(o.categoryName, [...(byCat.get(o.categoryName) ?? []), o]));

  return (
    <ConfirmDialog
      open onOpenChange={v => !v && onClose()} destructive confirmLabel="Merge subcategories" confirmDisabled={!target}
      title={`Merge ${source.name} into…`}
      description={<>
        <p><b>{n(source.videos)}</b> video(s) and <b>{n(source.interestedViewers)}</b> viewer interest(s) move to the subcategory you pick (it can be in another category). {source.name} is then retired; content IDs, views and history stay.</p>
      </>}
      onConfirm={async () => { if (target) await run(`/admin/discovery/subcategories/${source.id}/merge`, { method: "POST", body: { targetId: target.id } }, onDone); }}
    >
      {all.loading && !all.data ? <LoadingBlock rows={3} height="h-9" /> : all.error ? <ErrorBlock message={all.error} onRetry={all.reload} /> : (
        <div className="rounded-xl border">
          <Command filter={(v, s) => (v.toLowerCase().includes(s.toLowerCase().trim()) ? 1 : 0)}>
            <CommandInput placeholder="Search subcategories…" />
            <CommandList className="max-h-60">
              <CommandEmpty>No subcategory found.</CommandEmpty>
              {[...byCat.entries()].map(([catName, subs]) => (
                <CommandGroup key={catName} heading={catName}>
                  {subs.map(x => (
                    <CommandItem key={x.id} value={`${x.categoryName} ${x.name}`} onSelect={() => setTarget(x)}>
                      <span className="flex-1">{x.emoji ? `${x.emoji} ` : ""}{x.name}</span>
                      {target?.id === x.id && <Icons.Check size={15} className="text-brand-blue" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </div>
      )}
      {target && <p className="text-xs text-muted-foreground">{source.name} → <b>{target.categoryName} › {target.name}</b></p>}
    </ConfirmDialog>
  );
}
