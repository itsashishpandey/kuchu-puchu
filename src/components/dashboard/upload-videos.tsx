"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { DashboardPageHeader } from "./shell";
import { StatusBadge, EmptyState } from "@/components/shared/ui-bits";
import { navigate } from "@/components/app/router";
import { get, post, api } from "@/lib/client";
import { usd, compact, timeAgo, fmtDuration } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

// ── Upload page ────────────────────────────────────────────────────────────

type UploadRules = {
  minDurationSec: number; maxDurationSec: number; maxFileSizeMB: number;
  maxResolution: string; formats: string; maxDailyUploads: number; maxWeeklyUploads: number;
  requireVideoApproval: boolean; rewardRequiresApproval: boolean;
};

export function UploadPage() {
  const [rules, setRules] = useState<UploadRules | null>(null);
  const [limits, setLimits] = useState<{ dailyRemaining: number; weeklyRemaining: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [originality, setOriginality] = useState(false);
  const [copyright, setCopyright] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    contentId: string; title: string; status: string;
    duplicateOfId: string | null; similarityScore: number | null;
  } | null>(null);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    get<{ uploadRules: UploadRules; kpis: { remainingDailyUploads: number; remainingWeeklyUploads: number } }>("/creator/overview")
      .then(d => {
        setRules(d.uploadRules);
        setLimits({ dailyRemaining: d.kpis.remainingDailyUploads, weeklyRemaining: d.kpis.remainingWeeklyUploads });
      }).catch(() => {});
    get<{ categories: { name: string }[] }>("/public/categories").then(d => setCategories(d.categories)).catch(() => {});
  }, []);

  const validateFile = (f: File): string | null => {
    if (!rules) return null;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const formats = rules.formats.split(",").map(x => x.trim());
    if (!formats.includes(ext)) return `Unsupported format ".${ext}" — allowed: ${formats.map(x => x.toUpperCase()).join(", ")}`;
    if (f.size > rules.maxFileSizeMB * 1024 * 1024) return `File too large (${(f.size / 1024 / 1024).toFixed(1)}MB) — max ${rules.maxFileSizeMB}MB`;
    return null;
  };

  const pickFile = (f: File) => {
    const err = validateFile(f);
    if (err) { toast({ title: "Can't use this file", description: err, variant: "destructive" }); return; }
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setVideoMeta(null);
    // probe duration/resolution client-side
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = URL.createObjectURL(f);
    v.onloadedmetadata = () => {
      setVideoMeta({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
      URL.revokeObjectURL(v.src);
    };
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 80));
  };

  const metaError = videoMeta && rules
    ? (videoMeta.duration < rules.minDurationSec
        ? `Video is ${Math.round(videoMeta.duration)}s — minimum is ${rules.minDurationSec}s`
        : videoMeta.duration > rules.maxDurationSec
        ? `Video is ${Math.round(videoMeta.duration)}s — maximum is ${rules.maxDurationSec}s`
        : null)
    : null;

  const canSubmit = file && videoMeta && !metaError && title.trim().length >= 3 && category && originality && copyright &&
    (limits?.dailyRemaining ?? 1) > 0 && (limits?.weeklyRemaining ?? 1) > 0;

  const submit = async () => {
    if (!file || !canSubmit) return;
    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append("video", file);
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("category", category);
    fd.append("hashtags", hashtags);
    fd.append("duration", String(videoMeta?.duration ?? 0));
    fd.append("originalityDeclaration", "true");
    fd.append("copyrightConfirmation", "true");
    if (thumbFile) fd.append("thumbnail", thumbFile);

    // simulated progress + real fetch
    try {
      const progressTimer = setInterval(() => setProgress(p => Math.min(p + Math.random() * 12, 92)), 400);
      const res = await fetch("/api/creator/upload", { method: "POST", body: fd });
      clearInterval(progressTimer);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProgress(100);
      setResult(data.video);
      toast({ title: "Upload received ✅", description: `${data.video.contentId} — ${data.video.status === "APPROVED" ? "published" : "in review"}` });
    } catch (e) {
      setProgress(0);
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null); setFileUrl(null); setVideoMeta(null); setThumbFile(null); setThumbPreview(null);
    setTitle(""); setDescription(""); setCategory(""); setHashtags("");
    setOriginality(false); setCopyright(false); setProgress(0); setResult(null);
    if (fileInput.current) fileInput.current.value = "";
    if (thumbInput.current) thumbInput.current.value = "";
  };

  return (
    <div>
      <DashboardPageHeader
        title="Upload Video"
        description="Original shorts only — every upload is fingerprinted to protect your work and everyone's earnings."
      />

      {/* limits bar */}
      {rules && limits && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
            {rules.minDurationSec}–{rules.maxDurationSec}s duration
          </span>
          <span className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
            ≤ {rules.maxFileSizeMB}MB · {rules.maxResolution} · {rules.formats.toUpperCase()}
          </span>
          <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${limits.dailyRemaining > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
            {limits.dailyRemaining}/{rules.maxDailyUploads} uploads left today
          </span>
          <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${limits.weeklyRemaining > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
            {limits.weeklyRemaining}/{rules.maxWeeklyUploads} left this week
          </span>
        </div>
      )}

      {result ? (
        <div className="bento p-8 text-center">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${result.status === "FLAGGED_DUPLICATE" ? "bg-orange-50" : "bg-emerald-50"}`}>
            {result.status === "FLAGGED_DUPLICATE"
              ? <Icons.CopyX size={28} className="text-orange-500" />
              : <Icons.CheckCircle2 size={28} className="text-emerald-500" />}
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">
            {result.status === "FLAGGED_DUPLICATE" ? "Flagged for duplicate review" : "Upload received!"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {result.status === "FLAGGED_DUPLICATE"
              ? `"${result.title}" (${result.contentId}) matched existing content with ${Math.round((result.similarityScore ?? 0) * 100)}% similarity. It's queued for human review — rewards are on hold until then. If this is a mistake, appeal from My Videos.`
              : `"${result.title}" (${result.contentId}) passed technical validation and is now ${result.status === "APPROVED" ? "live and earning" : "pending review"}.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/dashboard/videos")}>View My Videos</Button>
            <Button variant="outline" className="rounded-full" onClick={reset}>Upload another</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="bento p-5 md:p-6">
            {/* dropzone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-brand-red bg-brand-red-soft/40" : "border-border bg-secondary/40"} ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              {fileUrl ? (
                <div className="w-full">
                  <div className="mx-auto w-fit">
                    <video src={fileUrl} className="max-h-64 rounded-xl bg-ink" controls muted playsInline />
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold">{file?.name}</p>
                  {videoMeta && !metaError && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ {fmtDuration(videoMeta.duration)} · {videoMeta.width}×{videoMeta.height}
                      {file ? ` · ${(file.size / 1024 / 1024).toFixed(1)}MB` : ""}
                    </p>
                  )}
                  {metaError && <p className="mt-1 text-xs font-semibold text-rose-500">✗ {metaError}</p>}
                  <button className="mt-3 text-xs font-bold text-brand-red hover:underline" onClick={() => { setFile(null); setFileUrl(null); setVideoMeta(null); }}>
                    Choose a different file
                  </button>
                </div>
              ) : (
                <>
                  <span className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <Icons.UploadCloud size={28} className="text-brand-red" />
                  </span>
                  <p className="mt-4 font-display text-base font-bold">Drag & drop your video</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rules ? `${rules.formats.toUpperCase()} · ${rules.minDurationSec}–${rules.maxDurationSec} seconds · up to ${rules.maxFileSizeMB}MB` : "MP4 or MOV"}
                  </p>
                  <input ref={fileInput} type="file" accept="video/mp4,video/quicktime" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
                  <Button variant="outline" className="mt-4 rounded-full" onClick={() => fileInput.current?.click()}>
                    Browse file
                  </Button>
                </>
              )}
            </div>

            {/* form */}
            <div className="mt-5 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="up-title">Video title <span className="text-brand-red">*</span></Label>
                <Input id="up-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
                  placeholder="Give it a hook viewers can't skip" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="up-desc">Description</Label>
                <Textarea id="up-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="What's in the video? Add context for reviewers and viewers…" className="rounded-xl" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Category <span className="text-brand-red">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="up-tags">Hashtags</Label>
                  <Input id="up-tags" value={hashtags} onChange={e => setHashtags(e.target.value)}
                    placeholder="#morningroutine #slowliving" className="h-11 rounded-xl" />
                </div>
              </div>

              {/* custom thumbnail */}
              <div className="grid gap-1.5">
                <Label>Custom thumbnail <span className="font-normal text-muted-foreground">(optional — auto-generated if empty)</span></Label>
                <div className="flex items-center gap-4">
                  <input ref={thumbInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }
                    }} />
                  {thumbPreview ? (
                    <img src={thumbPreview} alt="Thumbnail preview" className="h-20 w-14 rounded-lg object-cover ring-2 ring-brand-red/40" />
                  ) : (
                    <span className="flex h-20 w-14 items-center justify-center rounded-lg bg-secondary">
                      <Icons.ImageIcon size={20} className="text-muted-foreground" />
                    </span>
                  )}
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => thumbInput.current?.click()}>
                    {thumbPreview ? "Replace" : "Upload thumbnail"}
                  </Button>
                  {thumbPreview && (
                    <button className="text-xs font-bold text-brand-red hover:underline"
                      onClick={() => { setThumbFile(null); setThumbPreview(null); if (thumbInput.current) thumbInput.current.value = ""; }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* declarations */}
              <div className="space-y-2.5 rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Required declarations</p>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox checked={originality} onCheckedChange={v => setOriginality(!!v)} className="mt-0.5" />
                  <span className="text-[13px] leading-relaxed text-muted-foreground">
                    <strong className="text-ink">Originality declaration:</strong> I confirm this video is my original work, is not a re-upload or re-encode of existing content, and I have not published this identical video on another channel.
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox checked={copyright} onCheckedChange={v => setCopyright(!!v)} className="mt-0.5" />
                  <span className="text-[13px] leading-relaxed text-muted-foreground">
                    <strong className="text-ink">Copyright confirmation:</strong> I hold all necessary rights to the video, its audio and all included material.
                  </span>
                </label>
              </div>

              {progress > 0 && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-semibold">{progress < 100 ? "Uploading & fingerprinting…" : "Complete"}</span>
                    <span className="text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {progress > 40 && progress < 100 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Icons.Fingerprint size={12} className="text-brand-blue" />
                      Computing SHA-256 checksum, visual fingerprint and audio fingerprint…
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="grad-btn h-12 flex-1 rounded-xl text-white"
                  disabled={!canSubmit || uploading}
                  onClick={submit}
                >
                  {uploading ? "Uploading…" : "Submit video"} <Icons.Send size={15} className="ml-1.5" />
                </Button>
                <Button variant="outline" className="h-12 rounded-xl" onClick={reset} disabled={uploading}>Reset</Button>
              </div>
            </div>
          </div>

          {/* side info */}
          <div className="space-y-4">
            <div className="bento p-5">
              <p className="flex items-center gap-1.5 text-sm font-bold"><Icons.ShieldCheck size={16} className="text-brand-blue" /> What happens after upload</p>
              <ol className="mt-3 space-y-2.5 text-[13px] text-muted-foreground">
                {[
                  "Technical validation: duration, format, size, resolution",
                  "Fingerprinting: SHA-256 + visual & audio hashes computed server-side",
                  "Duplicate comparison against all existing uploads",
                  rules?.requireVideoApproval ? "Human review for originality and quality" : "Auto-published (manual review off)",
                  rules?.rewardRequiresApproval ? "Upload reward credited after approval" : "Upload reward credited instantly",
                ].map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bento bg-ink p-5 text-white">
              <p className="flex items-center gap-1.5 text-sm font-bold"><Icons.BadgeDollarSign size={16} className="text-brand-yellow" /> Earning potential</p>
              <p className="mt-2 text-xs leading-relaxed text-white/65">
                Once approved, this video earns{" "}
                <strong className="text-brand-yellow">$1.00 per 1,000 qualified views</strong> for 4 months,
                plus a <strong className="text-brand-yellow">$0.50</strong> one-time upload reward.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Videos page ─────────────────────────────────────────────────────────

type MyVideo = {
  id: string; contentId: string; title: string; description: string;
  category: string; hashtags: string[]; thumbnailUrl: string | null;
  videoUrl: string; duration: number; status: string; rejectionReason: string | null;
  duplicateOfId: string | null; similarityScore: number | null; duplicateStatus: string | null;
  views: number; qualifiedViews: number; likes: number; commentsCount: number; shares: number;
  monetizationEnabled: boolean; earningExpiresAt: string | null; publishedAt: string | null;
  createdAt: string;
};

export function MyVideosPage() {
  const [videos, setVideos] = useState<MyVideo[] | null>(null);
  const [appealFor, setAppealFor] = useState<MyVideo | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => get<{ videos: MyVideo[] }>("/creator/videos").then(d => setVideos(d.videos)).catch(() => {});
  useEffect(() => { load(); }, []);

  const submitAppeal = async () => {
    if (!appealFor) return;
    setBusy(true);
    try {
      const res = await post<{ message: string }>("/creator/appeal", { contentId: appealFor.contentId, reason: appealReason.trim() });
      toast({ title: "Appeal submitted", description: res.message });
      setAppealFor(null); setAppealReason("");
      load();
    } catch (e) {
      toast({ title: "Couldn't submit appeal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!videos) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-72 rounded-2xl" />)}</div>;
  }

  return (
    <div>
      <DashboardPageHeader title="My Videos" description={`${videos.length} upload${videos.length === 1 ? "" : "s"} — statuses, performance and monetization windows.`} />
      {videos.length === 0 ? (
        <EmptyState icon="Video" title="No videos yet" description="Your uploads will appear here with live performance stats."
          action={{ label: "Upload your first video", onClick: () => navigate("/dashboard/upload") }} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map(v => {
            const expiresIn = v.earningExpiresAt ? Math.ceil((new Date(v.earningExpiresAt).getTime() - Date.now()) / 864e5) : null;
            return (
              <div key={v.id} className="bento overflow-hidden transition hover:shadow-lg">
                <div className="relative aspect-video bg-ink">
                  {v.thumbnailUrl && <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />}
                  <span className="absolute left-2.5 top-2.5"><StatusBadge status={v.status} /></span>
                  <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    {fmtDuration(v.duration)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 font-display text-sm font-bold">{v.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{v.contentId} · {v.category} · {timeAgo(v.createdAt)}</p>

                  {(v.status === "REJECTED" || v.status === "REMOVED") && v.rejectionReason && (
                    <div className="mt-2.5 rounded-lg bg-rose-50 p-2.5 text-[11px] leading-relaxed text-rose-700">
                      <Icons.MessageSquareWarning size={12} className="mr-1 inline" />{v.rejectionReason}
                    </div>
                  )}
                  {v.status === "FLAGGED_DUPLICATE" && (
                    <div className="mt-2.5 rounded-lg bg-orange-50 p-2.5 text-[11px] leading-relaxed text-orange-700">
                      <Icons.CopyX size={12} className="mr-1 inline" />
                      {v.similarityScore !== null && <>Matched {v.duplicateOfId} with {Math.round(v.similarityScore * 100)}% similarity. </>}
                      {v.duplicateStatus === "PENDING_REVIEW" ? "Awaiting human review." : "Confirmed duplicate."} No rewards paid.
                      <button className="ml-1 font-bold underline" onClick={() => setAppealFor(v)}>Appeal</button>
                    </div>
                  )}
                  {v.status === "PENDING" && (
                    <div className="mt-2.5 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-700">
                      <Icons.Hourglass size={12} className="mr-1 inline" />
                      In review — usually approved within 24 hours.
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { l: "Views", v: compact(v.views) },
                      { l: "Qualified", v: compact(v.qualifiedViews) },
                      { l: "Likes", v: compact(v.likes) },
                      { l: "Shares", v: compact(v.shares) },
                    ].map(s => (
                      <div key={s.l} className="rounded-lg bg-secondary/70 py-2">
                        <p className="text-xs font-bold">{s.v}</p>
                        <p className="text-[9px] text-muted-foreground">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px]">
                    {v.earningExpiresAt && (
                      <span className={`flex items-center gap-1 ${(expiresIn ?? 0) > 0 ? "text-muted-foreground" : "text-amber-600"}`}>
                        <Icons.Clock size={11} />
                        {(expiresIn ?? 0) > 0 ? `Earns for ${expiresIn}d more` : "Earning window closed"}
                      </span>
                    )}
                    <button onClick={() => navigate(`/feed?v=${v.id}`)} className="font-bold text-brand-red hover:underline">
                      {v.status === "APPROVED" ? "View in feed →" : "Preview →"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* appeal dialog */}
      <Dialog open={!!appealFor} onOpenChange={v => !v && setAppealFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appeal duplicate flag</DialogTitle>
            <DialogDescription>
              Tell us why <strong>{appealFor?.contentId}</strong> is original. Our team reviews appeals within 2 business days.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5} value={appealReason} onChange={e => setAppealReason(e.target.value)}
            placeholder="Explain how this content is original — e.g. you are the creator of both videos, or the match is coincidental…"
            className="rounded-xl" maxLength={1000}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setAppealFor(null)}>Cancel</Button>
            <Button className="grad-btn rounded-full text-white" disabled={busy || appealReason.trim().length < 20} onClick={submitAppeal}>
              {busy ? "Submitting…" : "Submit appeal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
