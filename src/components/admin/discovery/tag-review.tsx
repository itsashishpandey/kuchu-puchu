"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, StatusBadge } from "@/components/shared/ui-bits";
import { VideoTagEditor, tagFormFromVideo, tagFormBody, validateTagForm } from "@/components/shared/video-tag-editor";
import { useLanguages, useCategories } from "@/lib/use-taxonomy";
import type { TagFormValue, TagSuggestions, VideoTag } from "@/lib/client";
import { fmtDate, timeAgo } from "@/lib/format";
import { AdminPageHeader } from "../shell";
import { useApi, run, LoadingBlock, ErrorBlock, n, ConfirmDialog, Field } from "./shared";

type ReviewVideo = {
  id: string; contentId: string; title: string; description: string; hashtags: string[];
  thumbnailUrl: string | null; videoUrl: string; status: string; createdAt: string; publishedAt: string | null; views: number;
  creator: { name: string; channelName: string; username: string };
  languages: { code: string; nameEn: string; nameNative: string; isPrimary: boolean; source: string }[];
  tags: (VideoTag & { source: string })[];
  tagStatus: string; tagFlagReason: string | null; tagsUpdatedAt: string | null;
  suggestions: TagSuggestions | null;
};
type ReviewResp = { total: number; page: number; pageSize: number; counts: Record<string, number>; videos: ReviewVideo[] };

const TABS = [
  { key: "NEEDS_REVIEW", label: "Needs review" },
  { key: "FLAGGED", label: "Flagged" },
  { key: "OK", label: "Confirmed" },
  { key: "ALL", label: "All" },
] as const;

const SOURCE_LABEL: Record<string, string> = { CREATOR: "creator", ADMIN: "moderator", BACKFILL: "backfill" };
const FLAG_PRESETS = [
  "The language doesn't match what's spoken in the video",
  "These categories don't describe the video",
  "Tags look chosen for reach, not accuracy",
  "Not suitable for the Kids & Cartoons category",
];

export function TagStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    NEEDS_REVIEW: ["Needs review", "bg-amber-50 text-amber-700 border-amber-200"],
    FLAGGED: ["Flagged", "bg-rose-50 text-rose-700 border-rose-200"],
    OK: ["Tags OK", "bg-emerald-50 text-emerald-700 border-emerald-200"],
  };
  const [label, cls] = map[status] ?? [status, "bg-slate-100 text-slate-600 border-slate-200"];
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

export function TagReviewPage() {
  const [status, setStatus] = useState<(typeof TABS)[number]["key"]>("NEEDS_REVIEW");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [language, setLanguage] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories("en");
  const [playing, setPlaying] = useState<ReviewVideo | null>(null);
  const [flagging, setFlagging] = useState<ReviewVideo | null>(null);
  const [correcting, setCorrecting] = useState<ReviewVideo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const params = new URLSearchParams({ status, page: String(page) });
  if (dq) params.set("q", dq);
  if (language !== "all") params.set("language", language);
  if (categoryId !== "all") params.set("categoryId", categoryId);
  const { data, error, loading, reload } = useApi<ReviewResp>(`/admin/discovery/tags?${params.toString()}`);

  const counts = data?.counts ?? {};
  const countOf = (k: string) => (k === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[k] ?? 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const approve = async (v: ReviewVideo) => {
    setBusy(v.contentId);
    await run(`/admin/discovery/tags/${v.contentId}/approve`, { method: "POST" }, reload);
    setBusy(null);
  };

  return (
    <div>
      <AdminPageHeader
        title="Video Tag Review"
        description="Check the languages and categories creators chose. Correct misleading tags or ask the creator to fix them — the video, its views and earnings never change."
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setStatus(t.key); setPage(1); }}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${status === t.key ? "border-transparent bg-foreground text-background" : "bg-background hover:bg-secondary"}`}>
            {t.label}
            <span className={`rounded-full px-1.5 text-[11px] ${status === t.key ? "bg-white/20" : "bg-secondary"}`}>{n(countOf(t.key))}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title or content ID…" className="h-10 rounded-full pl-9" aria-label="Search videos" />
        </div>
        <Select value={language} onValueChange={v => { setLanguage(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-full rounded-full sm:w-48" aria-label="Filter by language"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All languages</SelectItem>
            {languages.map(l => <SelectItem key={l.code} value={l.code}>{l.nameEn}{l.nameNative !== l.nameEn ? ` · ${l.nameNative}` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-full rounded-full sm:w-56" aria-label="Filter by category"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading && !data ? <LoadingBlock rows={4} height="h-40" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : !data || data.videos.length === 0 ? (
        <EmptyState icon="CheckCheck" title={status === "NEEDS_REVIEW" ? "Nothing waiting for review" : "No videos here"}
          description={status === "NEEDS_REVIEW" ? "New uploads whose tags look off, and creator edits after a flag, show up here." : "Try another tab or filter."} />
      ) : (
        <>
          <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
            {data.videos.map(v => (
              <ReviewCard key={v.id} v={v} busy={busy === v.contentId}
                onPlay={() => setPlaying(v)} onApprove={() => approve(v)} onFlag={() => setFlagging(v)} onCorrect={() => setCorrecting(v)} />
            ))}
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><Icons.ChevronLeft size={15} /> Previous</Button>
              <span className="tabular-nums text-muted-foreground">Page {page} of {pages} · {n(data.total)} videos</span>
              <Button variant="outline" size="sm" className="rounded-full" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next <Icons.ChevronRight size={15} /></Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!playing} onOpenChange={v => !v && setPlaying(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{playing?.title}</DialogTitle>
            <DialogDescription>{playing?.contentId} · {playing?.creator.channelName}</DialogDescription>
          </DialogHeader>
          {playing && <video src={playing.videoUrl} controls autoPlay playsInline className="max-h-[65vh] w-full rounded-xl bg-black" />}
        </DialogContent>
      </Dialog>

      {flagging && <FlagDialog v={flagging} onClose={() => setFlagging(null)} onDone={() => { setFlagging(null); reload(); }} />}
      {correcting && <CorrectDialog v={correcting} onClose={() => setCorrecting(null)} onDone={() => { setCorrecting(null); reload(); }} />}
    </div>
  );
}

function ReviewCard({ v, busy, onPlay, onApprove, onFlag, onCorrect }: {
  v: ReviewVideo; busy: boolean; onPlay: () => void; onApprove: () => void; onFlag: () => void; onCorrect: () => void;
}) {
  const chosenSubs = new Set(v.tags.map(t => t.subcategory.id));
  const chosenLangs = new Set(v.languages.map(l => l.code));
  return (
    <div className="bento flex flex-col gap-4 p-4 sm:flex-row">
      <button onClick={onPlay} className="group relative h-40 w-24 shrink-0 self-center overflow-hidden rounded-xl bg-secondary sm:self-start" aria-label={`Play ${v.title}`}>
        {v.thumbnailUrl ? <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <Icons.Video className="m-auto h-full text-muted-foreground" />}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-80 transition group-hover:opacity-100">
          <Icons.Play size={26} className="fill-white text-white" />
        </span>
      </button>

      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-snug">{v.title}</p>
            <p className="text-[12px] text-muted-foreground">
              <code>{v.contentId}</code> · {v.creator.channelName}{v.creator.username ? ` (@${v.creator.username})` : ""} · uploaded {fmtDate(v.createdAt)} · {n(v.views)} views
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1.5"><StatusBadge status={v.status} /><TagStatusBadge status={v.tagStatus} /></div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted-foreground">Languages:</span>
          {v.languages.length === 0 && <span className="text-rose-600">none</span>}
          {v.languages.map(l => (
            <span key={l.code} className={`rounded-full px-2.5 py-0.5 ${l.isPrimary ? "bg-brand-blue text-white" : "bg-brand-blue-soft text-brand-blue"}`}>
              {l.isPrimary && "★ "}{l.nameNative}{l.nameNative !== l.nameEn ? ` · ${l.nameEn}` : ""}
            </span>
          ))}
          {v.languages[0] && <span className="text-[11px] text-muted-foreground">by {SOURCE_LABEL[v.languages[0].source] ?? v.languages[0].source}</span>}
        </div>

        <ol className="space-y-1 text-sm">
          {v.tags.length === 0 && <li className="text-rose-600">No categories</li>}
          {v.tags.map(t => (
            <li key={t.priority} className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${t.priority === 1 ? "bg-brand-pink text-white" : "bg-secondary"}`}>{t.priority}</span>
              <span>{t.category.emoji} {t.category.name || "Retired category"} › <b>{t.subcategory.name || "Retired subcategory"}</b></span>
              <span className="text-[11px] text-muted-foreground">({SOURCE_LABEL[t.source] ?? t.source})</span>
            </li>
          ))}
        </ol>

        {v.tagFlagReason && (
          <p className={`rounded-xl px-3 py-2 text-xs ${v.tagStatus === "FLAGGED" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"}`}>
            <Icons.Flag size={12} className="mr-1 inline" /> {v.tagFlagReason}
          </p>
        )}

        {v.suggestions && (v.suggestions.languages?.length > 0 || v.suggestions.categories?.length > 0) && (
          <div className="rounded-xl border border-dashed px-3 py-2 text-xs">
            <p className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground"><Icons.Sparkles size={12} /> Automated suggestions at upload</p>
            {v.suggestions.languages?.length > 0 && (
              <p>Language: {v.suggestions.languages.map(l => `${l.nameNative ?? l.code} (${l.confidence}${chosenLangs.has(l.code) ? " ✓" : ""})`).join(", ")}</p>
            )}
            {v.suggestions.categories?.length > 0 && (
              <p>Categories: {v.suggestions.categories.slice(0, 4).map(c => `${c.categoryName} › ${c.subcategoryName}${chosenSubs.has(c.subcategoryId) ? " ✓" : ""}`).join(" · ")}</p>
            )}
          </div>
        )}
        {v.tagsUpdatedAt && <p className="text-[11px] text-muted-foreground">Tags last changed {timeAgo(v.tagsUpdatedAt)}</p>}
      </div>

      <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:w-36 sm:flex-col">
        {v.tagStatus !== "OK" && (
          <Button size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy} onClick={onApprove}>
            <Icons.Check size={14} className="mr-1" /> Approve tags
          </Button>
        )}
        <Button size="sm" variant="outline" className="rounded-full" onClick={onCorrect}><Icons.Wand2 size={14} className="mr-1" /> Correct</Button>
        <Button size="sm" variant="outline" className="rounded-full text-rose-600" onClick={onFlag}><Icons.Flag size={14} className="mr-1" /> Flag</Button>
      </div>
    </div>
  );
}

function FlagDialog({ v, onClose, onDone }: { v: ReviewVideo; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(v.tagStatus === "FLAGGED" ? v.tagFlagReason ?? "" : "");
  return (
    <ConfirmDialog
      open onOpenChange={x => !x && onClose()} destructive confirmLabel="Flag & notify creator" confirmDisabled={reason.trim().length < 5}
      title="Flag these tags"
      description={<p>The creator gets a notification asking them to fix the language or categories of <b>{v.title}</b>. Nothing else about the video changes.</p>}
      onConfirm={async () => { await run(`/admin/discovery/tags/${v.contentId}/flag`, { method: "POST", body: { reason: reason.trim() } }, onDone); }}
    >
      <div className="flex flex-wrap gap-1.5">
        {FLAG_PRESETS.map(p => (
          <button key={p} type="button" onClick={() => setReason(p)} className={`rounded-full border px-2.5 py-1 text-[11px] hover:border-brand-pink ${reason === p ? "border-brand-pink bg-brand-pink-soft" : ""}`}>{p}</button>
        ))}
      </div>
      <Field label="What should the creator fix?" hint="at least 5 characters">
        <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={300} className="rounded-xl" />
      </Field>
    </ConfirmDialog>
  );
}

function CorrectDialog({ v, onClose, onDone }: { v: ReviewVideo; onClose: () => void; onDone: () => void }) {
  const { data: categories = [] } = useCategories();
  const [value, setValue] = useState<TagFormValue>(() => tagFormFromVideo(v.languages, v.tags));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const problem = categories.length ? validateTagForm(value, categories, v.tags) : null;

  const save = async () => {
    setBusy(true);
    const res = await run(`/admin/discovery/tags/${v.contentId}`, { method: "PATCH", body: { ...tagFormBody(value), note: note.trim() } });
    setBusy(false);
    if (res) onDone();
  };

  return (
    <Dialog open onOpenChange={x => !x && !busy && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Correct tags — {v.contentId}</DialogTitle>
          <DialogDescription>
            &ldquo;{v.title}&rdquo; by {v.creator.channelName}. Saving marks the tags as confirmed and tells the creator what changed. Same content ID, views and earnings.
          </DialogDescription>
        </DialogHeader>
        {(v.description || v.hashtags.length > 0) && (
          <div className="rounded-xl bg-secondary/60 px-3 py-2 text-xs">
            {v.description && <p className="line-clamp-3">{v.description}</p>}
            {v.hashtags.length > 0 && <p className="mt-1 text-muted-foreground">{v.hashtags.map(h => `#${h}`).join(" ")}</p>}
          </div>
        )}
        <VideoTagEditor value={value} onChange={setValue} suggestions={v.suggestions} keep={v.tags} disabled={busy} />
        <Field label="Note to the creator" hint="optional">
          <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={300} className="rounded-xl" placeholder="e.g. The video is in Hindi, so we set Hindi as the main language." />
        </Field>
        {problem && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{problem}</p>}
        <DialogFooter>
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button className="grad-btn rounded-full text-white" disabled={busy || !!problem} onClick={save}>{busy ? "Saving…" : "Save correction"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
