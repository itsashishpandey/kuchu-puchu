"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, StatusBadge, EmptyState } from "@/components/shared/ui-bits";
import { AdminPageHeader } from "./shell";
import { navigate } from "@/components/app/router";
import { get, post } from "@/lib/client";
import { usd, compact, timeAgo, fmtDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

async function action(path: string, body: unknown): Promise<{ message?: string }> {
  const res = await fetch(`/api${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Action failed");
  return data;
}

// ── Creator Management ─────────────────────────────────────────────────────

type AdminCreator = {
  id: string; name: string; email: string; status: string;
  rejectionReason: string | null; suspensionReason: string | null;
  monetizationEligible: boolean; country: string | null;
  createdAt: string; updatedAt: string;
  channel: { name: string; username: string; avatarUrl: string | null; category: string | null; followerCount: number; verified: boolean; description: string } | null;
  videoCount: number; lifetimeEarnings: number;
};

export function AdminCreatorsPage() {
  const [creators, setCreators] = useState<AdminCreator[] | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [reasonFor, setReasonFor] = useState<{ creator: AdminCreator; action: "reject" | "suspend" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    get<{ creators: AdminCreator[] }>(`/admin/creators?${params}`).then(d => setCreators(d.creators)).catch(() => {});
  };
  useEffect(() => { load(); }, [status]);  
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [q]);  

  const act = async (creator: AdminCreator, a: string, reason?: string) => {
    setBusy(true);
    try {
      const res = await action(`/admin/creators/${creator.id}/action`, { action: a, reason });
      toast({ title: res.message ?? "Done" });
      setReasonFor(null); setReason("");
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const tabs = ["", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

  return (
    <div>
      <AdminPageHeader
        title="Creator Management"
        description="Review applications, approve, reject, suspend and manage monetization eligibility."
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(t => (
            <button key={t || "all"} onClick={() => setStatus(t)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${status === t ? "bg-ink text-white" : "bg-white ring-1 ring-black/5 hover:bg-secondary"}`}>
              {t ? t.charAt(0) + t.slice(1).toLowerCase() : `All (${creators?.length ?? "…"})`}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm lg:ml-auto">
          <Icons.Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, @username…"
            className="h-10 rounded-full pl-9" aria-label="Search creators" />
        </div>
      </div>

      {!creators ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-24 rounded-2xl" />)}</div>
      ) : creators.length === 0 ? (
        <EmptyState icon="Users" title="No creators found" description="Try a different filter or search." />
      ) : (
        <div className="space-y-3">
          {creators.map(c => (
            <div key={c.id} className="bento p-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar src={c.channel?.avatarUrl} name={c.name} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-bold">{c.channel?.name ?? c.name}</p>
                    {c.channel?.verified && <Icons.BadgeCheck size={15} className="text-brand-blue" />}
                    <StatusBadge status={c.status} />
                    {c.status === "APPROVED" && !c.monetizationEligible && (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">Monetization paused</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    @{c.channel?.username} · {c.email} · {c.channel?.category} · {c.country} · joined {fmtDate(c.createdAt)}
                  </p>
                  {c.channel?.description && <p className="mt-1.5 line-clamp-1 text-[13px] text-muted-foreground">{c.channel.description}</p>}
                  {(c.status === "REJECTED" || c.status === "SUSPENDED") && (
                    <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${c.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-rose-50 text-rose-700"}`}>
                      <Icons.MessageSquareWarning size={12} className="mr-1 inline" />
                      {c.status === "REJECTED" ? "Rejection reason: " : "Suspension reason: "}{c.rejectionReason ?? c.suspensionReason}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-display text-base font-bold">{c.videoCount}</p>
                    <p className="text-[10px] text-muted-foreground">videos</p>
                  </div>
                  <div>
                    <p className="font-display text-base font-bold">{compact(c.channel?.followerCount ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground">followers</p>
                  </div>
                  <div>
                    <p className="font-display text-base font-bold text-brand-red">{usd(c.lifetimeEarnings, 0)}</p>
                    <p className="text-[10px] text-muted-foreground">earned</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                {c.status === "PENDING" && (
                  <>
                    <Button size="sm" className="grad-btn rounded-full text-white" disabled={busy} onClick={() => act(c, "approve")}>
                      <Icons.Check size={14} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50" disabled={busy}
                      onClick={() => setReasonFor({ creator: c, action: "reject" })}>
                      <Icons.X size={14} className="mr-1" /> Reject
                    </Button>
                  </>
                )}
                {c.status === "APPROVED" && (
                  <>
                    <Button size="sm" variant="outline" className="rounded-full" disabled={busy} onClick={() => act(c, "toggle-eligibility")}>
                      {c.monetizationEligible ? <Icons.Pause size={14} className="mr-1" /> : <Icons.Play size={14} className="mr-1" />}
                      {c.monetizationEligible ? "Pause monetization" : "Enable monetization"}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50" disabled={busy}
                      onClick={() => setReasonFor({ creator: c, action: "suspend" })}>
                      <Icons.ShieldOff size={14} className="mr-1" /> Suspend
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full" onClick={() => navigate(`/c/${c.channel?.username}`)}>
                      View channel
                    </Button>
                  </>
                )}
                {(c.status === "REJECTED" || c.status === "SUSPENDED") && (
                  <Button size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy} onClick={() => act(c, "reactivate")}>
                    <Icons.RotateCcw size={14} className="mr-1" /> Reactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* reason dialog */}
      {reasonFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold">
              {reasonFor.action === "reject" ? "Reject application" : "Suspend account"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {reasonFor.creator.channel?.name ?? reasonFor.creator.name} — the reason below is shown to the creator and stored in the audit log.
            </p>
            <div className="mt-4 grid gap-1.5">
              <Label htmlFor="rs-reason">Reason (required)</Label>
              <Textarea id="rs-reason" rows={4} value={reason} onChange={e => setReason(e.target.value)}
                placeholder={reasonFor.action === "reject"
                  ? "e.g. Channel name too similar to an existing verified brand…"
                  : "e.g. Repeated spam comments — 3rd strike…"} />
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setReasonFor(null); setReason(""); }}>Cancel</Button>
              <Button className="flex-1 rounded-full bg-rose-500 text-white hover:bg-rose-600" disabled={busy || reason.trim().length < 5}
                onClick={() => act(reasonFor.creator, reasonFor.action, reason.trim())}>
                {busy ? "Working…" : reasonFor.action === "reject" ? "Reject" : "Suspend"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Video Management ───────────────────────────────────────────────────────

type AdminVideo = {
  id: string; contentId: string; title: string; status: string;
  category: string; thumbnailUrl: string | null; duration: number;
  views: number; qualifiedViews: number; likes: number;
  rejectionReason: string | null; featured: boolean; monetizationEnabled: boolean;
  similarityScore: number | null; duplicateOfId: string | null; duplicateStatus: string | null;
  createdAt: string; publishedAt: string | null;
  sha256: string | null; visualHash: string | null; audioHash: string | null;
  creator: { name: string; email: string; username: string; avatarUrl: string | null };
};

export function AdminVideosPage() {
  const [videos, setVideos] = useState<AdminVideo[] | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    get<{ videos: AdminVideo[] }>(`/admin/videos?${params}`).then(d => setVideos(d.videos)).catch(() => {});
  };
  useEffect(() => { load(); }, [status]);  
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [q]);  

  const act = async (v: AdminVideo, a: string, reason?: string) => {
    try {
      const res = await action(`/admin/videos/${v.contentId}/action`, { action: a, reason });
      toast({ title: res.message ?? "Done" });
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const askReason = (v: AdminVideo, a: string, prompt: string) => {
    const reason = window.prompt(prompt);
    if (reason === null) return;
    if (reason.trim().length < 5) { toast({ title: "A reason of 5+ characters is required", variant: "destructive" }); return; }
    act(v, a, reason.trim());
  };

  const tabs = ["", "PENDING", "APPROVED", "FLAGGED_DUPLICATE", "REJECTED", "REMOVED"];

  return (
    <div>
      <AdminPageHeader title="Video Management" description="Approve, reject, remove or restrict videos — every action is audit-logged." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(t => (
            <button key={t || "all"} onClick={() => setStatus(t)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${status === t ? "bg-ink text-white" : "bg-white ring-1 ring-black/5 hover:bg-secondary"}`}>
              {t ? t.replace("_", " ").toLowerCase() : "All"}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm lg:ml-auto">
          <Icons.Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title or content ID…" className="h-10 rounded-full pl-9" aria-label="Search videos" />
        </div>
      </div>

      {!videos ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
      ) : videos.length === 0 ? (
        <EmptyState icon="Video" title="No videos found" />
      ) : (
        <div className="bento overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3.5 font-semibold">Video</th>
                <th className="px-4 py-3.5 font-semibold">Creator</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Performance</th>
                <th className="px-4 py-3.5 font-semibold">Uploaded</th>
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(v => (
                <tr key={v.id} className="border-b last:border-0 align-top hover:bg-secondary/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-14 w-9 shrink-0 rounded-md object-cover" />}
                      <div className="min-w-0">
                        <p className="max-w-56 truncate font-semibold">{v.title}</p>
                        <p className="text-[11px] text-muted-foreground">{v.contentId} · {v.category} · {Math.round(v.duration)}s</p>
                        {v.similarityScore !== null && (
                          <p className="mt-1 text-[11px] font-semibold text-orange-600">↔ matches {v.duplicateOfId} @ {Math.round(v.similarityScore * 100)}%</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={v.creator.avatarUrl} name={v.creator.name} size={26} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{v.creator.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">@{v.creator.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={v.status} />
                    <div className="mt-1.5 flex gap-1">
                      {v.featured && <span className="rounded bg-brand-yellow-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-yellow">★ featured</span>}
                      {!v.monetizationEnabled && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">no-earn</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    <p>{compact(v.views)} views · {compact(v.qualifiedViews)} qual.</p>
                    <p className="mt-0.5">{compact(v.likes)} likes</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">{timeAgo(v.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {(v.status === "PENDING" || v.status === "FLAGGED_DUPLICATE") && (
                        <Button size="sm" className="h-8 grad-btn rounded-full text-white" onClick={() => act(v, "approve")}>Approve</Button>
                      )}
                      {v.status === "PENDING" && (
                        <Button size="sm" variant="outline" className="h-8 rounded-full border-rose-200 text-rose-600"
                          onClick={() => askReason(v, "reject", `Reason for rejecting ${v.contentId}:`)}>Reject</Button>
                      )}
                      {v.status === "APPROVED" && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => act(v, "toggle-featured")}>
                            {v.featured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => act(v, "toggle-monetization")}>
                            {v.monetizationEnabled ? "Restrict" : "Enable"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-full border-rose-200 text-rose-600"
                            onClick={() => askReason(v, "remove", `Reason for removing ${v.contentId}:`)}>Remove</Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={() => navigate(`/feed?v=${v.id}`)}>View</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Duplicate Detection ────────────────────────────────────────────────────

type DupQueue = {
  id: string; contentId: string; title: string; thumbnailUrl: string | null;
  similarityScore: number | null; duplicateOfId: string | null;
  duplicateStatus: string | null; createdAt: string;
  sha256: string; visualHash: string | null; audioHash: string | null;
  creator: { name: string; username: string; email: string };
};

type AppealItem = {
  id: string; reason: string; status: string; createdAt: string;
  video: { contentId: string; title: string; similarityScore: number | null; duplicateOfId: string | null } | null;
  user: { name: string; email: string };
};

export function AdminDuplicatesPage() {
  const [data, setData] = useState<{ queue: DupQueue[]; appeals: AppealItem[] } | null>(null);

  const load = () => get<{ queue: DupQueue[]; appeals: AppealItem[] }>("/admin/duplicates").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (contentId: string, a: string) => {
    try {
      const res = await action(`/admin/duplicates/${contentId}/action`, { action: a });
      toast({ title: res.message ?? "Done" });
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const resolveAppeal = async (id: string, a: "approve" | "reject") => {
    try {
      const res = await action(`/admin/appeals/${id}/action`, { action: a });
      toast({ title: res.message ?? "Done" });
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Duplicate Detection"
        description="Fingerprint matches above the similarity threshold queue here for human review. Confirmed duplicates never earn."
      />

      {/* how it works */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Icons.FileKey2, t: "SHA-256 checksum", d: "Identical files blocked instantly" },
          { icon: Icons.Fingerprint, t: "Visual fingerprint", d: "Perceptual hash survives re-encoding & crops" },
          { icon: Icons.AudioLines, t: "Audio fingerprint", d: "Catches reused audio tracks" },
        ].map(x => (
          <div key={x.t} className="bento flex items-center gap-3 p-4">
            <span className="rounded-xl bg-brand-blue-soft p-2.5"><x.icon size={18} className="text-brand-blue" /></span>
            <div>
              <p className="text-sm font-bold">{x.t}</p>
              <p className="text-xs text-muted-foreground">{x.d}</p>
            </div>
          </div>
        ))}
      </div>

      {!data ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* review queue */}
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">
              Review queue <span className="ml-1 text-sm font-normal text-muted-foreground">({data.queue.length})</span>
            </h2>
            {data.queue.length === 0 ? (
              <EmptyState icon="ShieldCheck" title="Queue is clear" description="No videos are currently flagged for duplicate review." />
            ) : (
              <div className="space-y-3">
                {data.queue.map(v => (
                  <div key={v.id} className="bento p-5">
                    <div className="flex flex-wrap items-start gap-4">
                      {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-24 w-16 rounded-lg object-cover" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-sm font-bold">{v.title}</p>
                          <StatusBadge status={v.duplicateStatus ?? "PENDING_REVIEW"} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {v.contentId} · by {v.creator.name} (@{v.creator.username}) · {timeAgo(v.createdAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-full bg-orange-50 px-3 py-1.5 font-bold text-orange-700">
                            ↔ {Math.round((v.similarityScore ?? 0) * 100)}% similar to {v.duplicateOfId}
                          </span>
                          <span className="rounded-full bg-secondary px-3 py-1.5 font-mono text-muted-foreground">sha: {v.sha256?.slice(0, 12)}…</span>
                          <span className="rounded-full bg-secondary px-3 py-1.5 font-mono text-muted-foreground">visual: {v.visualHash}</span>
                          <span className="rounded-full bg-secondary px-3 py-1.5 font-mono text-muted-foreground">audio: {v.audioHash?.slice(0, 12)}…</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Upload reward and view earnings are withheld while this video is flagged. Confirming a duplicate rejects the video with no rewards; clearing a false positive approves it and credits the reward.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="rounded-full bg-rose-500 text-white hover:bg-rose-600" onClick={() => act(v.contentId, "confirm-duplicate")}>
                          <Icons.CopyX size={14} className="mr-1" /> Confirm duplicate
                        </Button>
                        <Button size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => act(v.contentId, "false-positive")}>
                          <Icons.ShieldCheck size={14} className="mr-1" /> False positive
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* appeals */}
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">
              Creator appeals <span className="ml-1 text-sm font-normal text-muted-foreground">({data.appeals.filter(a => a.status === "OPEN").length} open)</span>
            </h2>
            {data.appeals.length === 0 ? (
              <EmptyState icon="Inbox" title="No appeals" description="Appeals submitted by creators will appear here." />
            ) : (
              <div className="space-y-3">
                {data.appeals.map(a => (
                  <div key={a.id} className="bento p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{a.video ? `${a.video.contentId} — ${a.video.title}` : "Video removed"}</p>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">Appeal by {a.user.name} ({a.user.email}) · {timeAgo(a.createdAt)}</p>
                        {a.video?.similarityScore !== null && a.video && (
                          <p className="mt-1 text-[11px] text-orange-600">Flagged at {Math.round((a.video.similarityScore ?? 0) * 100)}% vs {a.video.duplicateOfId}</p>
                        )}
                        <p className="mt-2 max-w-2xl rounded-lg bg-secondary p-3 text-[13px] leading-relaxed text-muted-foreground">“{a.reason}”</p>
                      </div>
                      {a.status === "OPEN" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => resolveAppeal(a.id, "approve")}>
                            Approve appeal
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full border-rose-200 text-rose-600" onClick={() => resolveAppeal(a.id, "reject")}>
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
