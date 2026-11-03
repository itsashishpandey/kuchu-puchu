"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, StatusBadge, EmptyState } from "@/components/shared/ui-bits";
import { AdminPageHeader } from "./shell";
import { get } from "@/lib/client";
import { timeAgo, fmtDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

async function action(path: string, body: unknown): Promise<{ message?: string }> {
  const res = await fetch(`/api${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Action failed");
  return data;
}

function useAct(reload: () => void) {
  return async (path: string, body: unknown) => {
    try {
      const res = await action(path, body);
      toast({ title: res.message ?? "Done" });
      reload();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };
}

// ── Reports & Comments (kid-safety moderation) ────────────────────────────

type Report = {
  id: string; reason: string; details: string | null; status: string; createdAt: string; reporter: string;
  video: {
    id: string; contentId: string; title: string; status: string; thumbnailUrl: string | null; videoUrl: string;
    creator: { name: string; username: string };
  };
};
type AdminComment = {
  id: string; body: string; authorName: string; authorAvatar: string | null; createdAt: string;
  author: { id: string; email: string; role: string; status: string } | null;
  video: { contentId: string; title: string; thumbnailUrl: string | null };
};

const REASON: Record<string, { label: string; cls: string }> = {
  INAPPROPRIATE: { label: "Not OK for kids", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  COPYRIGHT: { label: "Copyright", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  SPAM: { label: "Spam", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  OTHER: { label: "Other", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function AdminSafetyPage() {
  const [data, setData] = useState<{ reports: Report[]; comments: AdminComment[] } | null>(null);
  const [tab, setTab] = useState<"reports" | "comments">("reports");
  const [showResolved, setShowResolved] = useState(false);
  const [q, setQ] = useState("");
  const load = () => get<{ reports: Report[]; comments: AdminComment[] }>("/admin/safety").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);
  const act = useAct(load);

  const open = data?.reports.filter(r => r.status === "OPEN") ?? [];
  const reports = (data?.reports ?? []).filter(r => showResolved || r.status === "OPEN");
  const comments = (data?.comments ?? []).filter(c =>
    !q || c.body.toLowerCase().includes(q.toLowerCase()) || c.authorName.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <AdminPageHeader
        title="Reports & Comments"
        description="What parents report from the app and website — keep Kuchu Puchu safe for kids. Comments are turned off platform-wide; older comments stay here for moderation."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { l: "Open reports", v: open.length, i: Icons.Flag, c: "text-rose-500 bg-rose-50" },
          { l: "Not-OK-for-kids reports", v: open.filter(r => r.reason === "INAPPROPRIATE").length, i: Icons.Baby, c: "text-amber-600 bg-amber-50" },
          { l: "Comments (latest 150)", v: data?.comments.length ?? 0, i: Icons.MessageCircle, c: "text-sky-600 bg-sky-50" },
        ].map(s => (
          <div key={s.l} className="bento p-4">
            <span className={`rounded-xl ${s.c} inline-flex p-2`}><s.i size={17} /></span>
            <p className="mt-2.5 font-display text-xl font-bold">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["reports", "comments"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${tab === t ? "border-transparent bg-foreground text-background" : "bg-background hover:bg-secondary"}`}
          >
            {t === "reports" ? `Video reports (${open.length} open)` : "Comments"}
          </button>
        ))}
        {tab === "reports" ? (
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} /> Show resolved
          </label>
        ) : (
          <div className="relative ml-auto w-full max-w-xs">
            <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search comments or names…" className="h-9 rounded-full pl-9" aria-label="Search comments" />
          </div>
        )}
      </div>

      {!data ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
      ) : tab === "reports" ? (
        reports.length === 0 ? (
          <EmptyState icon="ShieldCheck" title="No open reports" description="When a viewer taps Report on a video, it shows up here." />
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="bento flex flex-col gap-4 p-4 sm:flex-row">
                <a href={r.video.videoUrl} target="_blank" rel="noreferrer" className="block h-32 w-[74px] shrink-0 overflow-hidden rounded-xl bg-secondary" title="Open video">
                  {r.video.thumbnailUrl && <img src={r.video.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${REASON[r.reason]?.cls ?? REASON.OTHER.cls}`}>
                      {REASON[r.reason]?.label ?? r.reason}
                    </span>
                    <StatusBadge status={r.status} />
                    {r.video.status !== "APPROVED" && <StatusBadge status={r.video.status} />}
                  </div>
                  <p className="mt-1.5 truncate text-sm font-bold">{r.video.title}</p>
                  <p className="text-xs text-muted-foreground">{r.video.contentId} · by {r.video.creator.name} (@{r.video.creator.username})</p>
                  {r.details && <p className="mt-2 rounded-xl bg-secondary/60 px-3 py-2 text-[13px]">“{r.details}”</p>}
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70">Reported {timeAgo(r.createdAt)} · reporter #{r.reporter}</p>
                </div>
                {r.status === "OPEN" && (
                  <div className="flex shrink-0 flex-row gap-1.5 sm:flex-col">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => act(`/admin/content-reports/${r.id}/action`, { action: "dismiss" })}>
                      Video is fine
                    </Button>
                    {r.video.status !== "REMOVED" && (
                      <Button
                        size="sm"
                        className="rounded-full bg-rose-500 text-white hover:bg-rose-600"
                        onClick={() => {
                          const reason = window.prompt(`Remove ${r.video.contentId}? Reason shown to the creator:`, `Not suitable for kids (${REASON[r.reason]?.label ?? r.reason})`);
                          if (reason !== null) act(`/admin/content-reports/${r.id}/action`, { action: "remove-video", reason });
                        }}
                      >
                        Remove video
                      </Button>
                    )}
                    {r.video.status !== "REMOVED" && (
                      <Button
                        size="sm" variant="outline"
                        className="rounded-full border-rose-300 text-rose-600 hover:bg-rose-50"
                        title="Uphold the complaint: remove the video and add a strike to the channel (3 strikes suspend it)"
                        onClick={() => {
                          const reason = window.prompt(`Uphold the complaint: remove ${r.video.contentId} AND add a strike to the channel (3 strikes suspend it). Reason shown to the creator:`, `Upheld complaint: ${REASON[r.reason]?.label ?? r.reason}`);
                          if (reason !== null) act(`/admin/content-reports/${r.id}/action`, { action: "remove-video-strike", reason });
                        }}
                      >
                        Remove + strike
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : comments.length === 0 ? (
        <EmptyState icon="MessageCircle" title="No comments" description="Comments posted from the app and website appear here." />
      ) : (
        <div className="bento divide-y">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-3 p-4">
              <Avatar src={c.authorAvatar} name={c.authorName} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{c.authorName}</span>
                  {c.author && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {c.author.role === "VIEWER" ? "App user" : c.author.role === "CREATOR" ? "Creator" : c.author.role} · {c.author.email}
                    </span>
                  )}
                  {c.author?.status === "SUSPENDED" && <StatusBadge status="SUSPENDED" />}
                  <span className="text-[11px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed">{c.body}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">on {c.video.contentId} · {c.video.title}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-full text-rose-600"
                onClick={() => { if (window.confirm("Delete this comment?")) act(`/admin/comments/${c.id}/action`, { action: "delete" }); }}
              >
                <Icons.Trash2 size={14} /> Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── App Users (viewer accounts) ───────────────────────────────────────────

type AppUser = {
  id: string; name: string; email: string; status: string; country: string | null;
  suspensionReason: string | null; avatarUrl: string | null; createdAt: string;
  likes: number; comments: number; follows: number; lastLogin: string | null;
};

export function AdminAppUsersPage() {
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [q, setQ] = useState("");
  const load = () => get<{ users: AppUser[] }>(`/admin/app-users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(d => setUsers(d.users)).catch(() => {});
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  const act = useAct(load);

  const active = users?.filter(u => u.status !== "SUSPENDED").length ?? 0;
  const thisWeek = users?.filter(u => Date.now() - new Date(u.createdAt).getTime() < 7 * 864e5).length ?? 0;

  return (
    <div>
      <AdminPageHeader
        title="App Users"
        description="Viewer accounts created in the Kuchu Puchu app. Suspending signs the user out of every device immediately."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { l: "User accounts", v: users?.length ?? 0, i: Icons.Smartphone, c: "text-sky-600 bg-sky-50" },
          { l: "Active", v: active, i: Icons.UserCheck, c: "text-emerald-600 bg-emerald-50" },
          { l: "Joined this week", v: thisWeek, i: Icons.Sparkles, c: "text-violet-600 bg-violet-50" },
        ].map(s => (
          <div key={s.l} className="bento p-4">
            <span className={`rounded-xl ${s.c} inline-flex p-2`}><s.i size={17} /></span>
            <p className="mt-2.5 font-display text-xl font-bold">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or email…" className="h-10 rounded-full pl-9" aria-label="Search app users" />
      </div>

      {!users ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon="Smartphone" title="No app users yet" description="People who sign up as a User in the app will appear here." />
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bento flex flex-wrap items-center gap-4 p-4">
              <Avatar src={u.avatarUrl} name={u.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{u.name}</p>
                  <StatusBadge status={u.status === "APPROVED" ? "ACTIVE" : u.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {u.email}{u.country ? ` · ${u.country}` : ""} · joined {fmtDate(u.createdAt)}
                  {u.lastLogin ? ` · last login ${timeAgo(u.lastLogin)}` : ""}
                </p>
                {u.suspensionReason && <p className="mt-1 text-xs text-rose-600">Suspended: {u.suspensionReason}</p>}
              </div>
              <div className="flex gap-4 text-center text-xs text-muted-foreground">
                <div><p className="font-display text-base font-bold text-foreground">{u.likes}</p>likes</div>
                <div><p className="font-display text-base font-bold text-foreground">{u.comments}</p>comments</div>
                <div><p className="font-display text-base font-bold text-foreground">{u.follows}</p>follows</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {u.comments > 0 && (
                  <Button size="sm" variant="outline" className="rounded-full"
                    onClick={() => { if (window.confirm(`Delete all ${u.comments} comment(s) by ${u.name}?`)) act(`/admin/app-users/${u.id}/action`, { action: "delete-comments" }); }}>
                    Delete comments
                  </Button>
                )}
                {u.status === "SUSPENDED" ? (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => act(`/admin/app-users/${u.id}/action`, { action: "reactivate" })}>
                    Reactivate
                  </Button>
                ) : (
                  <Button size="sm" className="rounded-full bg-rose-500 text-white hover:bg-rose-600"
                    onClick={() => {
                      const reason = window.prompt(`Suspend ${u.name}? Reason (kept in the audit log):`, "Inappropriate comments");
                      if (reason) act(`/admin/app-users/${u.id}/action`, { action: "suspend", reason });
                    }}>
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
