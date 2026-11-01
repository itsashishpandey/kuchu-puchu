"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Logo, Avatar } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { get, post, type FeedVideo, type CommentItem } from "@/lib/client";
import { compact, timeAgo } from "@/lib/format";
import { useAuth } from "@/components/app/auth-provider";
import { toast } from "@/hooks/use-toast";

type FeedTab = "explore" | "following" | "trending";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "explore", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];

export function VideoFeed() {
  const route = useRoute();
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>("explore");
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startVideoId, setStartVideoId] = useState<string | null>(route.query.get("v"));

  useEffect(() => {
    let alive = true;
    get<{ videos: FeedVideo[] }>(`/public/videos?feed=${tab}&limit=24`)
      .then(d => { if (alive) setVideos(d.videos); })
      .catch(e => { if (alive) setError((e as Error).message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tab]);

  // SEO: VideoObject structured data for the first video
  useEffect(() => {
    if (videos.length === 0) return;
    const v = videos[0];
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "kuchupuchu-video-jsonld";
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title,
      description: v.description,
      thumbnailUrl: [`${window.location.origin}${v.thumbnailUrl ?? ""}`],
      uploadDate: v.publishedAt ?? undefined,
      contentUrl: `${window.location.origin}${v.videoUrl}`,
      embedUrl: `${window.location.origin}/#/feed?v=${v.id}`,
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: { "@type": "WatchAction" },
        userInteractionCount: v.views,
      },
    });
    document.getElementById("kuchupuchu-video-jsonld")?.remove();
    document.head.appendChild(el);
    return () => el.remove();
  }, [videos]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-ink text-white">
      {/* desktop left rail */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/10 p-5 lg:flex" aria-label="Feed navigation">
        <button onClick={() => navigate("/")} aria-label="Kuchu Puchu home" className="mb-8 w-fit">
          <Logo dark />
        </button>
        <nav className="space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setLoading(true); setVideos([]); }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.id === "explore" ? <Icons.Home size={18} /> : t.id === "following" ? <Icons.Users size={18} /> : <Icons.Flame size={18} />}
              {t.label}
            </button>
          ))}
          <button
            onClick={() => navigate(user ? "/dashboard" : "/register")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-red to-brand-yellow px-4 py-3 text-sm font-bold text-ink transition hover:opacity-90"
          >
            <Icons.Sparkles size={16} />
            {user ? "Creator dashboard" : "Start earning"}
          </button>
        </nav>
        <div className="mt-auto rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-white/50">
          <Icons.Info size={14} className="mb-1.5 text-brand-yellow" />
          Videos monetize per qualified view. Login to like, comment and follow creators.
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 lg:hidden">
        <button onClick={() => navigate("/")} className="pointer-events-auto" aria-label="Home">
          <Logo dark size={30} />
        </button>
        <div className="pointer-events-auto flex gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setLoading(true); setVideos([]); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tab === t.id ? "bg-white text-ink" : "text-white/70"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => navigate("/explore")} className="pointer-events-auto" aria-label="Search">
          <Icons.Search size={22} />
        </button>
      </div>

      {/* feed scroller */}
      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Icons.Loader2 size={32} className="animate-spin text-white/50" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-white/70">{error}</p>
            {error.includes("Login") && (
              <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/login")}>Log in</Button>
            )}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Icons.Users size={36} className="text-white/40" />
            <p className="font-display text-lg font-bold">Nothing here yet</p>
            <p className="max-w-xs text-sm text-white/50">
              {tab === "following"
                ? "Follow creators and their newest videos will appear here."
                : "No videos in this feed right now."}
            </p>
            <Button variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => setTab("explore")}>
              Browse For You
            </Button>
          </div>
        ) : (
          <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
            {videos.map((v, i) => (
              <FeedItem
                key={v.id} video={v} user={!!user}
                isStart={startVideoId === v.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* desktop right rail */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-l border-white/10 xl:flex" aria-label="Video details">
        {videos[0] && <InfoPanel video={videos[0]} />}
      </aside>
    </div>
  );
}

// ── Single feed item ───────────────────────────────────────────────────────

function FeedItem({
  video, user, isStart,
}: {
  video: FeedVideo; user: boolean; isStart: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(video.liked);
  const [likes, setLikes] = useState(video.likes);
  const [following, setFollowing] = useState(video.following);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [credited, setCredited] = useState(false);
  const viewSent = useRef(false);
  const watchStart = useRef<number>(0);
  const watchedMs = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  // record qualified view once per watch session (server evaluates qualification)
  const sendView = useCallback((final: boolean) => {
    if (viewSent.current) return;
    const secs = watchedMs.current / 1000;
    if (secs < 2) return;
    viewSent.current = true;
    post<{ qualified: boolean; credited: boolean }>(`/social/${video.id}/view`, { watchSeconds: Math.round(secs) })
      .then(res => { if (res.credited) setCredited(true); })
      .catch(() => {});
  }, [video.id]);

  // autoplay active video, pause off-screen
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      entries => {
        const visible = entries[0].intersectionRatio > 0.6;
        setIsVisible(visible);
        const v = videoRef.current;
        if (!v) return;
        if (visible) v.play().catch(() => {});
        else { v.pause(); sendView(false); }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(node);
    return () => { io.disconnect(); sendView(false); };
     
  }, []);

  // scroll to requested start video
  useEffect(() => {
    if (isStart && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "auto" });
    }
     
  }, []);

  // track watch time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => { watchStart.current = performance.now(); setPlaying(true); };
    const onPause = () => {
      if (watchStart.current) watchedMs.current += performance.now() - watchStart.current;
      watchStart.current = 0;
      setPlaying(false);
      sendView(false);
    };
    const onTime = () => setProgress((v.currentTime / Math.max(v.duration, 1)) * 100);
    const onEnded = () => { if (watchStart.current) watchedMs.current += performance.now() - watchStart.current; sendView(true); };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
     
  }, []);

  const toggleLike = async () => {
    if (!user) { toast({ title: "Login required", description: "Create a free account to like videos." }); navigate("/login"); return; }
    try {
      const res = await post<{ liked: boolean; likes: number }>(`/social/${video.id}/like`);
      setLiked(res.liked); setLikes(res.likes);
    } catch (e) { toast({ title: "Couldn't like", description: (e as Error).message, variant: "destructive" }); }
  };

  const toggleFollow = async () => {
    if (!user) { toast({ title: "Login required", description: "Log in to follow creators." }); navigate("/login"); return; }
    try {
      // follow endpoint takes channelId in body
      const ch = await get<{ channel: { id: string } }>(`/public/creator/${video.creator.username}`);
      const res = await post<{ following: boolean }>(`/social/${video.id}/follow`, { channelId: ch.channel.id });
      setFollowing(res.following);
      toast({ title: res.following ? `Following @${video.creator.username}` : `Unfollowed @${video.creator.username}` });
    } catch (e) { toast({ title: "Couldn't follow", description: (e as Error).message, variant: "destructive" }); }
  };

  const share = async () => {
    const url = `${window.location.origin}/#/feed?v=${video.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, text: `Watch "${video.title}" on Kuchu Puchu`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share it anywhere — views support the creator." });
      }
      post(`/social/${video.id}/share`).catch(() => {});
    } catch { /* dismissed */ }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full snap-start snap-always items-center justify-center"
      style={{ scrollSnapStop: "always" }}
    >
      {/* 9:16 player frame */}
      <div className="relative h-full w-full max-w-[min(100vw,calc((100vh)*9/16))] overflow-hidden bg-black md:my-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          loop muted={muted} playsInline preload="metadata"
          onClick={togglePlay}
        />

        {/* tap to indicate paused */}
        {!playing && isVisible && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center" aria-label="Play">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/45 backdrop-blur">
              <Icons.Play size={36} fill="#fff" color="#fff" className="ml-1" />
            </span>
          </button>
        )}

        {/* gradient scrims */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        {/* qualified-view credit chip */}
        {credited && (
          <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-emerald-500/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg">
            ✓ Qualified view — creator earned
          </div>
        )}

        {/* desktop side actions */}
        <div className="absolute bottom-24 right-3 z-20 hidden flex-col items-center gap-4 md:flex">
          <FeedAction
            active={liked} onClick={toggleLike}
            icon={<Icons.Heart size={26} fill={liked ? "currentColor" : "none"} />}
            label={compact(likes)} activeClass="text-brand-red"
          />
          <FeedAction
            onClick={() => setCommentsOpen(true)}
            icon={<Icons.MessageCircle size={26} />} label={compact(video.commentsCount)}
          />
          <FeedAction onClick={share} icon={<Icons.Share2 size={24} />} label={compact(video.shares + 1)} />
          <FeedAction onClick={() => setReportOpen(true)} icon={<Icons.Flag size={22} />} label="Report" />
        </div>

        {/* bottom info */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-6 pr-16 md:pb-8">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate(`/c/${video.creator.username}`)} className="flex items-center gap-2.5" aria-label={`View ${video.creator.channelName}`}>
              <Avatar src={video.creator.avatarUrl} name={video.creator.name} size={40} ring />
              <span className="flex items-center gap-1 text-sm font-bold">
                @{video.creator.username}
                {video.creator.verified && <Icons.BadgeCheck size={15} className="text-brand-blue" />}
              </span>
            </button>
            <button
              onClick={toggleFollow}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                following ? "border border-white/40 text-white/80" : "bg-brand-red text-white hover:bg-brand-red/85"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
          <p className="mt-2.5 line-clamp-2 max-w-lg text-sm leading-snug">{video.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75">
            <button className="flex items-center gap-1" onClick={() => navigate(`/c/${video.creator.username}`)}>
              <Icons.Play size={11} fill="currentColor" /> {compact(video.views)} views
            </button>
            {video.hashtags.slice(0, 4).map(h => (
              <button key={h} onClick={() => navigate(`/explore?q=${encodeURIComponent("#" + h)}`)} className="font-semibold text-white/85 hover:text-brand-yellow">
                #{h}
              </button>
            ))}
            <span className="text-white/50">{video.contentId}</span>
          </div>

          {/* mobile action row */}
          <div className="mt-3 flex items-center gap-5 md:hidden">
            <MobileAction onClick={toggleLike} icon={<Icons.Heart size={25} fill={liked ? "currentColor" : "none"} />} label={compact(likes)} active={liked} activeClass="text-brand-red" />
            <MobileAction onClick={() => setCommentsOpen(true)} icon={<Icons.MessageCircle size={25} />} label={compact(video.commentsCount)} />
            <MobileAction onClick={share} icon={<Icons.Share2 size={23} />} label="Share" />
            <MobileAction onClick={() => setMuted(m => !m)} icon={muted ? <Icons.VolumeX size={23} /> : <Icons.Volume2 size={23} />} label={muted ? "Muted" : "Sound"} />
            <MobileAction onClick={() => setReportOpen(true)} icon={<Icons.Flag size={21} />} label="Report" />
          </div>
        </div>

        {/* mute + progress */}
        <button
          onClick={() => setMuted(m => !m)}
          className="absolute right-3 top-16 z-20 rounded-full bg-black/45 p-2.5 backdrop-blur md:top-4"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <Icons.VolumeX size={17} /> : <Icons.Volume2 size={17} />}
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 px-1 pb-0.5">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* comments sheet */}
      <CommentsSheet
        videoId={video.id} open={commentsOpen} onOpenChange={setCommentsOpen}
        loggedIn={user} count={video.commentsCount}
      />

      {/* report dialog */}
      <ReportDialog videoId={video.id} open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}

function FeedAction({
  icon, label, onClick, active, activeClass,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  active?: boolean; activeClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur transition hover:scale-110 ${active ? activeClass : "text-white"}`}
      >
        {icon}
      </button>
      <span className="text-[11px] font-bold text-white/85">{label}</span>
    </div>
  );
}

function MobileAction({
  icon, label, onClick, active, activeClass,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  active?: boolean; activeClass?: string;
}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? activeClass : "text-white"}`}>
      {icon}
      <span className="text-[10px] font-semibold text-white/70">{label}</span>
    </button>
  );
}

// ── Comments sheet ─────────────────────────────────────────────────────────

function CommentsSheet({
  videoId, open, onOpenChange, loggedIn, count,
}: {
  videoId: string; open: boolean; onOpenChange: (v: boolean) => void;
  loggedIn: boolean; count: number;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      get<{ video: { comments: CommentItem[] } }>(`/public/videos/${videoId}`)
        .then(d => setComments(d.video.comments))
        .catch(() => {});
    }
  }, [open, videoId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await post<{ comment: CommentItem }>(`/social/${videoId}/comment`, { body: text.trim() });
      setComments(c => [res.comment, ...c]);
      setText("");
    } catch (err) {
      toast({ title: "Couldn't comment", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[75vh] overflow-hidden rounded-t-3xl border-white/10 bg-ink/95 p-0 text-white sm:rounded-3xl sm:max-w-md">
        <DialogHeader className="border-b border-white/10 px-5 py-4">
          <DialogTitle className="font-display text-base">{count + Math.max(0, comments.length - count)} comments</DialogTitle>
        </DialogHeader>
        <div className="scroll-slim max-h-[46vh] space-y-4 overflow-y-auto px-5 py-4">
          {comments.length === 0 && <p className="py-8 text-center text-sm text-white/50">Be the first to comment.</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <Avatar src={c.authorAvatar} name={c.authorName} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white/80">{c.authorName} <span className="ml-1.5 font-normal text-white/40">{timeAgo(c.createdAt)}</span></p>
                <p className="mt-0.5 break-words text-sm text-white/90">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-4">
          {loggedIn ? (
            <form onSubmit={submit} className="flex gap-2">
              <Input
                value={text} onChange={e => setText(e.target.value)}
                placeholder="Add a comment…" maxLength={500}
                className="rounded-full border-white/15 bg-white/5 text-white placeholder:text-white/40"
              />
              <Button type="submit" size="icon" disabled={busy || !text.trim()} className="grad-btn shrink-0 rounded-full text-white">
                <Icons.ArrowUp size={16} />
              </Button>
            </form>
          ) : (
            <Button variant="outline" className="w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => { onOpenChange(false); navigate("/login"); }}>
              Log in to comment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Report dialog ──────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { id: "COPYRIGHT", label: "Copyright infringement", desc: "Contains content I own rights to" },
  { id: "INAPPROPRIATE", label: "Inappropriate content", desc: "Violates community guidelines" },
  { id: "SPAM", label: "Spam or misleading", desc: "Bait, scams or misrepresentation" },
  { id: "OTHER", label: "Something else", desc: "Tell us more in the note" },
];

function ReportDialog({
  videoId, open, onOpenChange,
}: { videoId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [reason, setReason] = useState("COPYRIGHT");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await post(`/social/${videoId}/report`, { reason, details });
      toast({ title: "Report submitted", description: "Our trust & safety team will review it. Thank you." });
      onOpenChange(false);
      setDetails("");
    } catch (e) {
      toast({ title: "Couldn't report", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-white/10 bg-ink/95 text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Report this video</DialogTitle>
          <DialogDescription className="text-white/60">
            Reports are confidential. Copyright reports may qualify the original creator for protection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {REPORT_REASONS.map(r => (
            <button
              key={r.id} onClick={() => setReason(r.id)}
              className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition ${
                reason === r.id ? "bg-brand-red/20 ring-1 ring-brand-red" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-bold">{r.label}</p>
                <p className="text-xs text-white/50">{r.desc}</p>
              </div>
              {reason === r.id && <Icons.CheckCircle2 size={18} className="text-brand-red" />}
            </button>
          ))}
        </div>
        <Input
          value={details} onChange={e => setDetails(e.target.value)}
          placeholder="Add context (optional)…" maxLength={500}
          className="rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
        />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="grad-btn flex-1 rounded-full text-white" disabled={busy} onClick={submit}>
            {busy ? "Sending…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Desktop right info panel (shows first video contextually) ─────────────

function InfoPanel({ video }: { video: FeedVideo }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">Now playing</p>
      <div className="rounded-2xl bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <Avatar src={video.creator.avatarUrl} name={video.creator.name} size={44} />
          <div className="min-w-0 flex-1">
            <button onClick={() => navigate(`/c/${video.creator.username}`)} className="flex items-center gap-1 text-sm font-bold hover:underline">
              @{video.creator.username}
              {video.creator.verified && <Icons.BadgeCheck size={13} className="text-brand-blue" />}
            </button>
            <p className="truncate text-xs text-white/50">{video.creator.channelName}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/85">{video.title}</p>
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-white/50">{video.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {video.hashtags.map(h => (
            <span key={h} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-brand-yellow">#{h}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { l: "Views", v: compact(video.views) },
          { l: "Likes", v: compact(video.likes) },
          { l: "Shares", v: compact(video.shares) },
        ].map(s => (
          <div key={s.l} className="rounded-xl bg-white/5 p-3">
            <p className="font-display text-lg font-bold">{s.v}</p>
            <p className="text-[11px] text-white/50">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-red/15 to-brand-blue/15 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-brand-yellow">
          <Icons.BadgeDollarSign size={14} /> How this video earns
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-white/65">
          <li>• $1.00 per 1,000 qualified views (4-month window)</li>
          <li>• $0.50 one-time approved-upload reward</li>
          <li>• Bots, self-views and refreshes never count</li>
        </ul>
        <Progress value={0} className="mt-3 h-0" />
      </div>
    </div>
  );
}
