"use client";

import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/ui-bits";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { useLanguages, useCategories } from "@/lib/use-taxonomy";
import { api, type VideoLanguage, type VideoTag } from "@/lib/client";
import { fmtDate, timeAgo } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { AdminPageHeader } from "../shell";
import { useApi, run, LoadingBlock, ErrorBlock, TableCard, Th, Td, ConfirmDialog, Field } from "./shared";

type Settings = {
  weights: { subcategory: number; category: number; engagement: number; recency: number; discovery: number };
  followBoost: number; learnedAffinity: number; recencyHalfLifeDays: number; maxPerCreatorPerPage: number; pageSize: number;
  discoveryShare: number; newCreatorDays: number; newCreatorBoost: number; watchedPenalty: number;
  notInterestedCreatorPenalty: number; notInterestedSubcategoryPenalty: number; otherLanguagePenalty: number;
  minQuality: { excludeHighFraudFlags: boolean; maxReportsBeforeHidden: number };
};
type Version = {
  version: number; label: string; status: string; experimentPercent: number; notes: string | null;
  createdByEmail: string | null; createdAt: string | null; settings: Settings;
};
type RecoResp = { active: Version; experiment: Version | null; history: Version[]; limits: Record<string, [number, number]>; defaults: Settings; principles: string[] };
type PreviewItem = {
  position: number; contentId: string; title: string; thumbnailUrl: string | null; channelName: string;
  languages: VideoLanguage[]; tags: VideoTag[]; score: number; tier: number; reasons: string[];
};

const WEIGHTS: { key: keyof Settings["weights"]; label: string; hint: string }[] = [
  { key: "subcategory", label: "Subcategory match", hint: "The viewer chose this exact subcategory (or “All” for its category)" },
  { key: "category", label: "Category match", hint: "The viewer chose the main category" },
  { key: "engagement", label: "Engagement", hint: "Likes, saves, shares, completion and genuine (qualified) views" },
  { key: "recency", label: "Recency", hint: "Newer videos rank higher" },
  { key: "discovery", label: "Discovery", hint: "A little variety so feeds don't get stuck" },
];

type NumKey = Exclude<keyof Settings, "weights" | "minQuality">;
const OTHER: { key: NumKey | "minQuality.maxReportsBeforeHidden"; label: string; unit: string; hint?: string }[] = [
  { key: "learnedAffinity", label: "Learned from viewing", unit: "%", hint: "How much watching behaviour may add on top of declared interests" },
  { key: "followBoost", label: "Followed-creator boost", unit: "pts" },
  { key: "recencyHalfLifeDays", label: "Recency half-life", unit: "days" },
  { key: "discoveryShare", label: "Discovery share of a page", unit: "%", hint: "Other topics in the viewer's languages, interleaved" },
  { key: "maxPerCreatorPerPage", label: "Max videos per creator per page", unit: "" },
  { key: "pageSize", label: "Page size", unit: "videos" },
  { key: "newCreatorDays", label: "New-creator window", unit: "days" },
  { key: "newCreatorBoost", label: "New-creator boost", unit: "pts" },
  { key: "watchedPenalty", label: "Already-watched penalty", unit: "%", hint: "Videos watched in the last 14 days" },
  { key: "notInterestedCreatorPenalty", label: "“Not interested” creator penalty", unit: "%", hint: "After 2 “Not interested” marks on a creator" },
  { key: "notInterestedSubcategoryPenalty", label: "“Not interested” subcategory penalty", unit: "%" },
  { key: "otherLanguagePenalty", label: "Other-language penalty", unit: "%", hint: "Only for viewers who turned on other-language discovery" },
  { key: "minQuality.maxReportsBeforeHidden", label: "Hide after open reports", unit: "reports" },
];

const TIER: Record<number, { label: string; cls: string }> = {
  1: { label: "Exact subcategory", cls: "bg-brand-pink-soft text-brand-pink" },
  2: { label: "Category / fresh start", cls: "bg-brand-blue-soft text-brand-blue" },
  3: { label: "Discovery · same language", cls: "bg-brand-yellow-soft text-amber-700" },
  4: { label: "Other language", cls: "bg-secondary text-muted-foreground" },
};

const clone = (s: Settings): Settings => JSON.parse(JSON.stringify(s));
const getVal = (s: Settings, key: string): number => (key === "minQuality.maxReportsBeforeHidden" ? s.minQuality.maxReportsBeforeHidden : (s[key as NumKey] as number));
const withVal = (s: Settings, key: string, v: number): Settings => {
  const next = clone(s);
  if (key === "minQuality.maxReportsBeforeHidden") next.minQuality.maxReportsBeforeHidden = v;
  else (next as Record<string, unknown>)[key] = v;
  return next;
};

export function RecommendationPage() {
  const { data, error, loading, reload } = useApi<RecoResp>("/admin/discovery/recommendation");
  const [draft, setDraft] = useState<Settings | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [expPercent, setExpPercent] = useState(10);
  const [adjustments, setAdjustments] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<null | "live" | "experiment" | "stop" | "promote" | { revert: Version }>(null);

  useEffect(() => { if (data) setDraft(clone(data.active.settings)); }, [data]);

  const dirty = !!data && !!draft && JSON.stringify(draft) !== JSON.stringify(data.active.settings);
  const limit = (key: string): [number, number] => data?.limits[key] ?? [0, 100];
  const w = draft?.weights;
  const wSum = w ? Math.max(1, w.subcategory + w.category + w.engagement + w.recency + w.discovery) : 1;
  const relevance = w ? w.subcategory + w.category : 0;

  const save = async (mode: "ACTIVE" | "EXPERIMENT") => {
    if (!draft) return;
    const res = await run<{ message?: string; adjustments?: string[] }>("/admin/discovery/recommendation", {
      method: "POST", body: { settings: draft, mode, experimentPercent: expPercent, label: label.trim(), notes: notes.trim() },
    });
    if (res) { setAdjustments(res.adjustments ?? []); setLabel(""); setNotes(""); setConfirm(null); reload(); }
  };

  if (loading && !data) return <><Header /><LoadingBlock rows={4} height="h-28" /></>;
  if (error && !data) return <><Header /><ErrorBlock message={error} onRetry={reload} /></>;
  if (!data || !draft || !w) return null;

  return (
    <div>
      <Header />

      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        <div className="bento p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live for everyone</p>
          <p className="mt-1 font-display text-lg font-bold">v{data.active.version} · {data.active.label}</p>
          <p className="text-xs text-muted-foreground">
            {data.active.createdAt ? <>by {data.active.createdByEmail ?? "system"} · {timeAgo(data.active.createdAt)}</> : "Built-in defaults"}
            {data.experiment && <> · {100 - data.experiment.experimentPercent}% of viewers</>}
          </p>
          {data.active.notes && <p className="mt-2 text-xs">{data.active.notes}</p>}
        </div>
        <div className={`bento p-4 ${data.experiment ? "border-brand-yellow" : ""}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experiment</p>
          {data.experiment ? (
            <>
              <p className="mt-1 font-display text-lg font-bold">v{data.experiment.version} · {data.experiment.label} <span className="text-sm text-amber-700">({data.experiment.experimentPercent}% of viewers)</span></p>
              <p className="text-xs text-muted-foreground">by {data.experiment.createdByEmail} · {timeAgo(data.experiment.createdAt)} · viewers always stay in the same group</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDraft(clone(data.experiment!.settings))}><Icons.Download size={14} className="mr-1" /> Load into editor</Button>
                <Button size="sm" variant="outline" className="rounded-full text-rose-600" onClick={() => setConfirm("stop")}><Icons.Square size={14} className="mr-1" /> Stop</Button>
                <Button size="sm" className="grad-btn rounded-full text-white" onClick={() => setConfirm("promote")}><Icons.Rocket size={14} className="mr-1" /> Make live for everyone</Button>
              </div>
            </>
          ) : <p className="mt-1 text-sm text-muted-foreground">None running. Use &ldquo;Start experiment&rdquo; below to try new settings on a share of viewers first.</p>}
        </div>
      </div>

      <div className="bento mb-5 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icons.ShieldCheck size={15} className="text-emerald-600" /> Ground rules (always enforced)</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{data.principles.map(p => <li key={p}>{p}</li>)}</ul>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <section className="bento p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold">Ranking weights</h2>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => setDraft(clone(data.defaults))}>Defaults (40/25/20/10/5)</Button>
                <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" disabled={!dirty} onClick={() => setDraft(clone(data.active.settings))}>Discard changes</Button>
              </div>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Weights are relative — each signal&apos;s share is its weight ÷ the total ({wSum}).</p>
            <div className="space-y-5">
              {WEIGHTS.map(x => {
                const [lo, hi] = limit(`weights.${x.key}`);
                return (
                  <div key={x.key}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{x.label} <span className="font-normal text-muted-foreground">· {Math.round((w[x.key] / wSum) * 100)}% share</span></span>
                      <span className="font-display text-lg font-bold tabular-nums">{w[x.key]}</span>
                    </div>
                    <Slider value={[w[x.key]]} min={lo} max={hi} step={1} aria-label={x.label}
                      onValueChange={([v]) => setDraft(d => d && { ...d, weights: { ...d.weights, [x.key]: v } })} />
                    <p className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{x.hint}</span><span>{lo}–{hi}</span></p>
                  </div>
                );
              })}
            </div>
            <p className={`mt-4 rounded-xl px-3 py-2 text-xs ${relevance < 30 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
              Subcategory + category = <b>{relevance}</b>. {relevance < 30 ? "Must stay at least 30 — the server will restore the defaults for these two if you save this." : "Personal relevance stays the strongest signal."}
            </p>
          </section>

          <section className="bento p-5">
            <h2 className="mb-4 font-display text-base font-bold">Feed rules</h2>
            <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
              {OTHER.map(x => {
                const [lo, hi] = limit(x.key);
                const v = getVal(draft, x.key);
                return (
                  <div key={x.key}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">{x.label}</span>
                      <span className="tabular-nums text-sm font-bold">{v}{x.unit ? ` ${x.unit}` : ""}</span>
                    </div>
                    <Slider value={[v]} min={lo} max={hi} step={1} aria-label={x.label} onValueChange={([nv]) => setDraft(d => d && withVal(d, x.key, nv))} />
                    <p className="mt-1 flex justify-between gap-2 text-[11px] text-muted-foreground"><span>{x.hint ?? ""}</span><span className="shrink-0">{lo}–{hi}</span></p>
                  </div>
                );
              })}
              <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm md:col-span-2">
                <span><span className="font-semibold">Leave out videos with open high-severity fraud flags</span></span>
                <Switch checked={draft.minQuality.excludeHighFraudFlags}
                  onCheckedChange={v => setDraft(d => d && { ...d, minQuality: { ...d.minQuality, excludeHighFraudFlags: v } })} />
              </label>
            </div>
          </section>

          <section className="bento p-5">
            <h2 className="mb-3 font-display text-base font-bold">Publish</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Version name" hint="optional"><Input value={label} onChange={e => setLabel(e.target.value)} maxLength={80} placeholder="e.g. More recency for new uploads" className="rounded-xl" /></Field>
              <Field label="Experiment size" hint="% of viewers, 1–50">
                <Input type="number" min={1} max={50} value={expPercent} onChange={e => setExpPercent(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="rounded-xl" />
              </Field>
              <Field label="Notes" hint="why this change — kept in history" className="md:col-span-2"><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={500} className="rounded-xl" /></Field>
            </div>
            {adjustments.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-semibold">The server kept some values within safe limits:</p>
                <ul className="list-disc pl-5">{adjustments.map(a => <li key={a}>{a}</li>)}</ul>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="grad-btn rounded-full text-white" onClick={() => setConfirm("live")}><Icons.Rocket size={15} className="mr-1" /> Save & go live</Button>
              <Button variant="outline" className="rounded-full" onClick={() => setConfirm("experiment")}><Icons.FlaskConical size={15} className="mr-1" /> Start experiment ({expPercent}%)</Button>
              {!dirty && <span className="self-center text-xs text-muted-foreground">No changes from v{data.active.version} yet.</span>}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold">History</h2>
            <TableCard minWidth={760}>
              <thead><tr className="border-b bg-secondary/50"><Th>Version</Th><Th>Status</Th><Th>Weights</Th><Th>By</Th><Th>When</Th><Th right>Actions</Th></tr></thead>
              <tbody>
                {data.history.map(h => {
                  const hw = h.settings.weights;
                  return (
                    <tr key={h.version} className="border-b last:border-0">
                      <Td><b>v{h.version}</b> <span className="text-muted-foreground">· {h.label}</span>{h.notes && <p className="max-w-64 truncate text-[11px] text-muted-foreground">{h.notes}</p>}</Td>
                      <Td>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${h.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : h.status === "EXPERIMENT" ? "bg-brand-yellow-soft text-amber-700" : "bg-secondary text-muted-foreground"}`}>
                          {h.status === "ACTIVE" ? "Live" : h.status === "EXPERIMENT" ? `Experiment ${h.experimentPercent}%` : "Archived"}
                        </span>
                      </Td>
                      <Td className="tabular-nums text-xs">{hw.subcategory}/{hw.category}/{hw.engagement}/{hw.recency}/{hw.discovery}</Td>
                      <Td className="text-xs">{h.createdByEmail ?? "system"}</Td>
                      <Td className="text-xs">{fmtDate(h.createdAt)}</Td>
                      <Td right>
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => { setDraft(clone(h.settings)); toast({ title: `Loaded v${h.version} into the editor` }); }}>Load</Button>
                          {h.status !== "ACTIVE" && <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => setConfirm({ revert: h })}><Icons.Undo2 size={13} className="mr-1" /> Revert to this</Button>}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableCard>
          </section>
        </div>

        <PreviewPanel draft={draft} dirty={dirty} />
      </div>

      <ConfirmDialog open={confirm === "live"} onOpenChange={v => !v && setConfirm(null)} confirmLabel="Go live"
        title="Make these settings live?"
        description={<p>Every viewer&apos;s For You feed switches to the new version within a minute{data.experiment ? " (viewers in the running experiment keep the experiment)" : ""}. You can revert from History at any time.</p>}
        onConfirm={() => save("ACTIVE")} />
      <ConfirmDialog open={confirm === "experiment"} onOpenChange={v => !v && setConfirm(null)} confirmLabel={`Start for ${expPercent}%`}
        title="Start an experiment?"
        description={<p>{expPercent}% of viewers (always the same ones) get these settings; everyone else keeps v{data.active.version}.{data.experiment ? ` This replaces the running experiment v${data.experiment.version}.` : ""}</p>}
        onConfirm={() => save("EXPERIMENT")} />
      <ConfirmDialog open={confirm === "stop"} onOpenChange={v => !v && setConfirm(null)} destructive confirmLabel="Stop experiment"
        title="Stop the experiment?" description={<p>Everyone goes back to the live version v{data.active.version}.</p>}
        onConfirm={async () => { await run("/admin/discovery/recommendation/experiment/stop", { method: "POST" }, () => { setConfirm(null); reload(); }); }} />
      <ConfirmDialog open={confirm === "promote"} onOpenChange={v => !v && setConfirm(null)} confirmLabel="Make it live"
        title="Make the experiment live for everyone?" description={<p>v{data.experiment?.version} replaces v{data.active.version} for all viewers.</p>}
        onConfirm={async () => { await run("/admin/discovery/recommendation/experiment/promote", { method: "POST" }, () => { setConfirm(null); reload(); }); }} />
      <ConfirmDialog open={typeof confirm === "object" && confirm !== null} onOpenChange={v => !v && setConfirm(null)} confirmLabel="Revert"
        title={typeof confirm === "object" && confirm ? `Revert to v${confirm.revert.version}?` : "Revert?"}
        description={<p>Its settings become live again as a new version, so the history stays complete.</p>}
        onConfirm={async () => {
          if (typeof confirm === "object" && confirm) {
            await run("/admin/discovery/recommendation/revert", { method: "POST", body: { version: confirm.revert.version } }, () => { setConfirm(null); reload(); });
          }
        }} />
    </div>
  );
}

function Header() {
  return (
    <AdminPageHeader
      title="Recommendation Settings"
      description="Tune how For You ranks videos — within safe limits. Every version is kept and can be restored."
    />
  );
}

function PreviewPanel({ draft, dirty }: { draft: Settings; dirty: boolean }) {
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories("en");
  const [langs, setLangs] = useState<string[]>(["en"]);
  const [catIds, setCatIds] = useState<string[]>([]);
  const [subIds, setSubIds] = useState<string[]>([]);
  const [discover, setDiscover] = useState(false);
  const [useDraft, setUseDraft] = useState(true);
  const [items, setItems] = useState<PreviewItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const chosenCats = useMemo(() => categories.filter(c => catIds.includes(c.id)), [categories, catIds]);
  const langName = (code: string) => languages.find(l => l.code === code)?.nameEn ?? code;

  const toggleCat = (id: string) => {
    setCatIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
    if (catIds.includes(id)) {
      const subs = categories.find(c => c.id === id)?.subcategories.map(s => s.id) ?? [];
      setSubIds(ids => ids.filter(x => !subs.includes(x)));
    }
  };

  const preview = async () => {
    setBusy(true);
    try {
      const res = await api<{ items: PreviewItem[] }>("/admin/discovery/recommendation/preview", {
        method: "POST",
        body: JSON.stringify({ languages: langs, categoryIds: catIds, subcategoryIds: subIds, discoverOtherLanguages: discover, ...(useDraft && dirty ? { settings: draft } : {}) }),
      });
      setItems(res.items);
    } catch (e) {
      toast({ title: "Preview failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="bento h-fit space-y-4 p-5 xl:sticky xl:top-22">
      <div>
        <h2 className="font-display text-base font-bold">Preview a feed</h2>
        <p className="text-xs text-muted-foreground">Build a sample viewer and see how the live catalogue ranks for them. Nothing is saved.</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Languages they watch</p>
        <div className="flex flex-wrap gap-1.5">
          {langs.map(code => (
            <span key={code} className="inline-flex items-center gap-1 rounded-full bg-brand-blue-soft px-2.5 py-0.5 text-xs text-brand-blue">
              {langName(code)}
              <button onClick={() => setLangs(l => l.filter(x => x !== code))} aria-label={`Remove ${langName(code)}`}><Icons.X size={12} /></button>
            </span>
          ))}
        </div>
        <LanguageCombobox languages={languages} exclude={langs} placeholder="Add a language" onSelect={code => setLangs(l => [...l, code].slice(0, 10))} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Interests <span className="font-normal text-muted-foreground">(tap a chosen category to pick subcategories)</span></p>
        <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
          {categories.map(c => {
            const on = catIds.includes(c.id);
            return (
              <button key={c.id} onClick={() => (on && openCat !== c.id ? setOpenCat(c.id) : toggleCat(c.id))}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${on ? "border-brand-pink bg-brand-pink-soft font-semibold" : "hover:bg-secondary"}`}>
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>
        {chosenCats.map(c => (openCat === c.id || c.subcategories.some(s => subIds.includes(s.id))) && (
          <div key={c.id} className="rounded-xl border p-2.5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
              <span>{c.emoji} {c.name}</span>
              <button className="text-rose-600" onClick={() => { toggleCat(c.id); setOpenCat(null); }}>Remove</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {c.subcategories.map(s => {
                const on = subIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => setSubIds(ids => (on ? ids.filter(x => x !== s.id) : [...ids, s.id]))}
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${on ? "border-brand-blue bg-brand-blue-soft font-semibold text-brand-blue" : "hover:bg-secondary"}`}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Also show other languages</span>
        <Switch checked={discover} onCheckedChange={setDiscover} />
      </label>
      {dirty && (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Use my unsaved changes</span>
          <Switch checked={useDraft} onCheckedChange={setUseDraft} />
        </label>
      )}
      <Button className="grad-btn w-full rounded-full text-white" disabled={busy || !langs.length} onClick={preview}>
        {busy ? <Icons.Loader2 size={15} className="mr-1 animate-spin" /> : <Icons.Play size={15} className="mr-1" />} Run preview
      </Button>

      {items && (items.length === 0 ? (
        <EmptyState icon="Video" title="No eligible videos" description="Nothing approved matches these languages — try adding a language or turning on other languages." />
      ) : (
        <ol className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {items.map(it => (
            <li key={it.contentId} className="flex gap-2.5 rounded-xl border p-2">
              <span className="w-5 shrink-0 pt-0.5 text-center text-xs font-bold tabular-nums text-muted-foreground">{it.position}</span>
              {it.thumbnailUrl ? <img src={it.thumbnailUrl} alt="" className="h-14 w-9 shrink-0 rounded-md object-cover" /> : <span className="h-14 w-9 shrink-0 rounded-md bg-secondary" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{it.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{it.channelName} · {it.languages.map(l => l.code).join(", ")}{it.tags[0] ? ` · ${it.tags[0].subcategory.name}` : ""}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${TIER[it.tier]?.cls ?? ""}`}>{TIER[it.tier]?.label ?? `Tier ${it.tier}`}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">score {it.score}</span>
                  {it.reasons.map(r => <span key={r} className="text-[10px] text-muted-foreground">· {r}</span>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ))}
    </aside>
  );
}
