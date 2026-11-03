"use client";

// Admin → Video Management → View: one large popup (80% of the screen) to watch the video with sound,
// edit its title, description, hashtags, languages and categories, check its uniqueness (content ID,
// fingerprints, duplicates) and approve / reject / remove it — all without leaving the list.
import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, StatusBadge } from "@/components/shared/ui-bits";
import { VideoTagEditor, tagFormFromVideo, tagFormBody, validateTagForm } from "@/components/shared/video-tag-editor";
import { useCategories } from "@/lib/use-taxonomy";
import { get, post, patch, type TagFormValue, type TagSuggestions, type VideoTag, type VideoLanguage } from "@/lib/client";
import { compact, fmtDate, timeAgo } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

type Brief = { contentId: string; title: string; status: string; thumbnailUrl: string | null; createdAt: string; creator: string };
type Detail = {
  video: {
    id: string; contentId: string; title: string; description: string; hashtags: string[];
    status: string; rejectionReason: string | null; videoUrl: string; thumbnailUrl: string | null;
    duration: number; fileSizeMB: number; resolution: string; format: string;
    sha256: string | null; visualHash: string | null; audioHash: string | null;
    duplicateOfId: string | null; similarityScore: number | null; duplicateStatus: string | null;
    uploadRewardCredited: boolean; monetizationEnabled: boolean; featured: boolean;
    earningExpiresAt: string | null; publishedAt: string | null; createdAt: string; updatedAt: string;
    views: number; qualifiedViews: number; likes: number; shares: number;
    tagStatus: string; tagFlagReason: string | null; tagsUpdatedAt: string | null;
    languages: VideoLanguage[]; tags: VideoTag[]; suggestions: TagSuggestions | null;
  };
  creator: {
    id: string; name: string; email: string; status: string; avatarUrl: string | null; username: string; channelName: string;
    idCheck: string | null; strikes: number; videoCount: number; monetizationUnlocked: boolean;
  };
  uniqueness: { original: Brief | null; sameFile: Brief[] };
  reports: { id: string; reason: string; details: string | null; status: string; createdAt: string }[];
  fraud: { id: string; type: string; severity: string; details: string; status: string; createdAt: string }[];
  history: { at: string; actor: string; action: string; details: string | null }[];
};

const secs = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function Copy({ text }: { text: string }) {
  return (
    <button type="button" aria-label="Copy" className="ml-1 shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-ink"
      onClick={() => { navigator.clipboard?.writeText(text).then(() => toast({ title: "Copied" })).catch(() => {}); }}>
      <Icons.Copy size={12} />
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-semibold text-ink">{children}</span>
    </div>
  );
}

function Section({ title, icon, children, tone }: { title: string; icon: keyof typeof Icons; children: React.ReactNode; tone?: "warn" | "ok" }) {
  const Icon = Icons[icon] as React.ComponentType<{ size?: number; className?: string }>;
  return (
    <section className={`rounded-2xl border p-4 ${tone === "warn" ? "border-amber-200 bg-amber-50/60" : tone === "ok" ? "border-emerald-200 bg-emerald-50/50" : "bg-white"}`}>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold"><Icon size={15} className="text-brand-blue" /> {title}</h3>
      {children}
    </section>
  );
}

export function VideoReviewDialog({ contentId, onClose, onChanged }: { contentId: string; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [tags, setTags] = useState<TagFormValue | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [askFor, setAskFor] = useState<"reject" | "remove" | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: categories = [] } = useCategories();

  const load = () => get<Detail>(`/admin/videos/${contentId}`).then(x => {
    setD(x);
    setTitle(x.video.title); setDescription(x.video.description); setHashtags(x.video.hashtags.map(h => `#${h}`).join(" "));
    setTags(tagFormFromVideo(x.video.languages, x.video.tags));
  }).catch(e => setError((e as Error).message));
  useEffect(() => { load(); }, [contentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // start playing with sound (the click on "View" lets the browser allow audio); controls stay available
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !d) return;
    v.muted = false; v.volume = 1;
    v.play().catch(() => { /* the browser asked for a tap first — the play button is right there */ });
  }, [d?.video.videoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const original = useMemo(() => d ? {
    title: d.video.title, description: d.video.description, hashtags: d.video.hashtags.map(h => `#${h}`).join(" "),
    tags: JSON.stringify(tagFormBody(tagFormFromVideo(d.video.languages, d.video.tags))),
  } : null, [d]);
  const detailsChanged = !!original && (title !== original.title || description !== original.description || hashtags.trim() !== original.hashtags);
  const tagsChanged = !!original && !!tags && JSON.stringify(tagFormBody(tags)) !== original.tags;
  const tagProblem = tags && categories.length ? validateTagForm(tags, categories, d?.video.tags ?? []) : null;
  const detailProblem = title.trim().length < 3 ? "Title must be at least 3 characters."
    : title.trim().length > 100 ? "Title can be at most 100 characters."
    : description.length > 1000 ? "Description can be at most 1,000 characters." : null;

  const save = async () => {
    if (!d || !tags) return;
    setBusy(true);
    try {
      if (detailsChanged) await post(`/admin/videos/${d.video.contentId}/action`, { action: "update-details", title: title.trim(), description: description.trim(), hashtags });
      if (tagsChanged) await patch(`/admin/discovery/tags/${d.video.contentId}`, { ...tagFormBody(tags), note: note.trim() });
      toast({ title: "Saved", description: "The creator has been notified of the changes." });
      setNote("");
      await load(); onChanged();
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const act = async (a: string, why?: string) => {
    if (!d) return;
    setBusy(true);
    try {
      const res = await post<{ message?: string }>(`/admin/videos/${d.video.contentId}/action`, { action: a, reason: why });
      toast({ title: res.message ?? "Done" });
      setAskFor(null); setReason("");
      await load(); onChanged();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const v = d?.video;
  const unsaved = detailsChanged || tagsChanged;

  return (
    <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-none overflow-y-auto p-0 sm:max-w-none lg:w-[80vw]">
        <DialogHeader className="sticky top-0 z-10 border-b bg-white/95 px-6 py-4 backdrop-blur">
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-8 text-lg">
            <span className="truncate">{v?.title ?? "Loading…"}</span>
            {v && <StatusBadge status={v.status} />}
            {v?.featured && <span className="rounded bg-brand-yellow-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-yellow">★ featured</span>}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
            {v ? (<><span className="flex items-center">{v.contentId}<Copy text={v.contentId} /></span><span>uploaded {fmtDate(v.createdAt)} ({timeAgo(v.createdAt)})</span></>) : "Fetching the video…"}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="m-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        {!d && !error && <div className="m-6 shimmer h-[60vh] rounded-2xl" />}

        {d && v && tags && (
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* ── left: player, decision, uniqueness (stays in view while the right side scrolls) ── */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl bg-ink">
                <video ref={videoRef} key={v.videoUrl} src={v.videoUrl} poster={v.thumbnailUrl ?? undefined}
                  controls playsInline preload="auto" className="mx-auto max-h-[62vh] w-full bg-black object-contain" />
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                {secs(v.duration)} · {v.resolution} · {v.fileSizeMB} MB · {v.format.toUpperCase()} — plays with sound
              </p>

              <Section title="Decision" icon="Gavel">
                {v.rejectionReason && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Last reason: {v.rejectionReason}</p>}
                <div className="flex flex-wrap gap-2">
                  {(v.status === "PENDING" || v.status === "FLAGGED_DUPLICATE" || v.status === "REJECTED") && (
                    <Button disabled={busy} className="grad-btn rounded-full text-white" onClick={() => act("approve")}><Icons.Check size={15} className="mr-1" /> Approve</Button>
                  )}
                  {(v.status === "PENDING" || v.status === "FLAGGED_DUPLICATE") && (
                    <Button disabled={busy} variant="outline" className="rounded-full border-rose-200 text-rose-600" onClick={() => setAskFor("reject")}>Reject</Button>
                  )}
                  {v.status === "APPROVED" && (
                    <>
                      <Button disabled={busy} variant="outline" className="rounded-full" onClick={() => act("toggle-featured")}>{v.featured ? "Unfeature" : "Feature"}</Button>
                      <Button disabled={busy} variant="outline" className="rounded-full" onClick={() => act("toggle-monetization")}>{v.monetizationEnabled ? "Restrict earning" : "Enable earning"}</Button>
                      <Button disabled={busy} variant="outline" className="rounded-full border-rose-200 text-rose-600" onClick={() => setAskFor("remove")}>Remove</Button>
                    </>
                  )}
                </div>
                {askFor && (
                  <div className="mt-3 space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                    <Label htmlFor="vr-reason" className="text-xs">Reason for {askFor === "reject" ? "rejecting" : "removing"} (the creator sees this)</Label>
                    <Textarea id="vr-reason" rows={2} value={reason} onChange={e => setReason(e.target.value)} maxLength={300} className="rounded-xl bg-white" />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy || reason.trim().length < 5} className="rounded-full bg-rose-600 text-white hover:bg-rose-700" onClick={() => act(askFor, reason.trim())}>
                        Confirm {askFor}
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setAskFor(null); setReason(""); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Uniqueness" icon="Fingerprint" tone={v.duplicateOfId || d.uniqueness.sameFile.length ? "warn" : "ok"}>
                <Row label="Content ID"><span className="flex items-center font-mono">{v.contentId}<Copy text={v.contentId} /></span></Row>
                <Row label="File fingerprint (SHA-256)">
                  {v.sha256 ? <span className="flex items-center font-mono text-[10px] break-all">{v.sha256}<Copy text={v.sha256} /></span> : "—"}
                </Row>
                <Row label="Visual fingerprint"><span className="font-mono">{v.visualHash ?? "—"}</span></Row>
                <Row label="Audio fingerprint"><span className="font-mono">{v.audioHash ?? "—"}</span></Row>
                <Row label="Duplicate check">
                  {v.duplicateOfId
                    ? <span className="text-amber-700">Matches {v.duplicateOfId}{v.similarityScore != null ? ` · ${Math.round(v.similarityScore * (v.similarityScore <= 1 ? 100 : 1))}% similar` : ""}{v.duplicateStatus ? ` · ${v.duplicateStatus.replace(/_/g, " ").toLowerCase()}` : ""}</span>
                    : <span className="text-emerald-700">✓ Unique — no similar video found</span>}
                </Row>
                {d.uniqueness.original && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-amber-200">
                    {d.uniqueness.original.thumbnailUrl && <img src={d.uniqueness.original.thumbnailUrl} alt="" className="h-14 w-10 rounded-md object-cover" />}
                    <div className="min-w-0 text-xs">
                      <p className="truncate font-semibold">Original: {d.uniqueness.original.title}</p>
                      <p className="text-muted-foreground">{d.uniqueness.original.contentId} · @{d.uniqueness.original.creator} · {d.uniqueness.original.status.toLowerCase()}</p>
                    </div>
                  </div>
                )}
                {d.uniqueness.sameFile.length > 0 && (
                  <p className="mt-2 text-xs text-amber-800">Exactly the same file was also uploaded as: {d.uniqueness.sameFile.map(s => `${s.contentId} (@${s.creator}, ${s.status.toLowerCase()})`).join(", ")}</p>
                )}
              </Section>
            </div>

            {/* ── right: editable details + everything else ── */}
            <div className="space-y-4">
              <Section title="Title, description & hashtags" icon="PencilLine">
                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="vr-title">Title <span className="text-muted-foreground">({title.trim().length}/100)</span></Label>
                    <Input id="vr-title" value={title} maxLength={100} onChange={e => setTitle(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="vr-desc">Description <span className="text-muted-foreground">({description.length}/1000)</span></Label>
                    <Textarea id="vr-desc" rows={4} value={description} maxLength={1000} onChange={e => setDescription(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="vr-tags">Hashtags <span className="text-muted-foreground">(up to 10)</span></Label>
                    <Input id="vr-tags" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#nurseryrhymes #kidssongs" className="h-11 rounded-xl" />
                  </div>
                </div>
              </Section>

              <Section title="Languages & categories" icon="Tags" tone={v.tagStatus !== "OK" ? "warn" : undefined}>
                {v.tagStatus !== "OK" && (
                  <p className="mb-2 rounded-lg bg-white px-3 py-2 text-xs text-amber-800">
                    Tag review: {v.tagStatus.replace(/_/g, " ").toLowerCase()}{v.tagFlagReason ? ` — ${v.tagFlagReason}` : ""}
                  </p>
                )}
                <VideoTagEditor value={tags} onChange={setTags} suggestions={v.suggestions} keep={v.tags} disabled={busy} />
                {tagsChanged && (
                  <div className="mt-3 grid gap-1.5">
                    <Label htmlFor="vr-note" className="text-xs">Note to the creator about the category change <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="vr-note" value={note} maxLength={300} onChange={e => setNote(e.target.value)} className="h-10 rounded-xl" placeholder="e.g. The video is in Hindi, so Hindi is now the main language." />
                  </div>
                )}
              </Section>

              <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-xs text-muted-foreground">
                  {detailProblem ?? tagProblem ?? (unsaved ? "You have unsaved changes." : "Everything is saved. The creator is told about any change.")}
                </p>
                <div className="flex gap-2">
                  {unsaved && <Button variant="ghost" className="rounded-full" disabled={busy} onClick={() => load()}>Discard</Button>}
                  <Button className="grad-btn rounded-full text-white" disabled={busy || !unsaved || !!detailProblem || (tagsChanged && !!tagProblem)} onClick={save}>
                    {busy ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Section title="Creator" icon="UserRound">
                  <div className="mb-2 flex items-center gap-2.5">
                    <Avatar src={d.creator.avatarUrl} name={d.creator.name} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{d.creator.channelName}</p>
                      <a href={`/c/${d.creator.username}`} target="_blank" rel="noreferrer" className="text-xs text-brand-blue hover:underline">@{d.creator.username} ↗</a>
                    </div>
                  </div>
                  <Row label="Name">{d.creator.name}</Row>
                  <Row label="Email"><span className="break-all">{d.creator.email}</span></Row>
                  <Row label="Account">{d.creator.status.toLowerCase()}</Row>
                  <Row label="ID check">{d.creator.idCheck ? d.creator.idCheck.toLowerCase() : "no document"}</Row>
                  <Row label="Strikes">{d.creator.strikes} of 3</Row>
                  <Row label="Videos uploaded">{d.creator.videoCount}</Row>
                  <Row label="Earning unlocked">{d.creator.monetizationUnlocked ? "yes" : "not yet"}</Row>
                </Section>

                <Section title="File & publishing" icon="FileVideo">
                  <Row label="Length">{secs(v.duration)} ({Math.round(v.duration)} s)</Row>
                  <Row label="Resolution">{v.resolution}</Row>
                  <Row label="File size">{v.fileSizeMB} MB</Row>
                  <Row label="Format">{v.format.toUpperCase()}</Row>
                  <Row label="Uploaded">{fmtDate(v.createdAt)}</Row>
                  <Row label="Published">{v.publishedAt ? fmtDate(v.publishedAt) : "not yet"}</Row>
                  <Row label="Earns views until">{v.earningExpiresAt ? fmtDate(v.earningExpiresAt) : "—"}</Row>
                  <Row label="Earning">{v.monetizationEnabled ? "on" : "restricted"}</Row>
                  <Row label="Upload reward">{v.uploadRewardCredited ? "credited" : "not credited"}</Row>
                </Section>

                <Section title="Performance" icon="ChartNoAxesColumn">
                  <Row label="Views">{compact(v.views)}</Row>
                  <Row label="Qualified views">{compact(v.qualifiedViews)}</Row>
                  <Row label="Likes">{compact(v.likes)}</Row>
                  <Row label="Shares">{compact(v.shares)}</Row>
                </Section>

                <Section title={`Reports & flags (${d.reports.length + d.fraud.length})`} icon="Flag" tone={d.reports.length + d.fraud.length ? "warn" : undefined}>
                  {d.reports.length + d.fraud.length === 0 ? <p className="text-xs text-muted-foreground">No reports or fraud flags.</p> : (
                    <ul className="space-y-1.5 text-xs">
                      {d.reports.map(r => <li key={r.id}><span className="font-semibold">Report · {r.reason.toLowerCase()}</span> ({r.status.toLowerCase()}){r.details ? ` — ${r.details}` : ""} · {timeAgo(r.createdAt)}</li>)}
                      {d.fraud.map(f => <li key={f.id}><span className="font-semibold">Fraud · {f.type.replace(/_/g, " ").toLowerCase()}</span> ({f.severity.toLowerCase()}, {f.status.toLowerCase()}) — {f.details}</li>)}
                    </ul>
                  )}
                </Section>
              </div>

              <Section title="History" icon="History">
                {d.history.length === 0 ? <p className="text-xs text-muted-foreground">No admin actions yet.</p> : (
                  <ul className="scroll-slim max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {d.history.map((h, i) => (
                      <li key={i} className="rounded-lg bg-secondary/60 px-3 py-1.5">
                        <span className="font-semibold">{h.action.replace(/_/g, " ").toLowerCase()}</span> · {h.actor} · {timeAgo(h.at)}
                        {h.details && !h.details.startsWith("{") && <span className="text-muted-foreground"> — {h.details}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
