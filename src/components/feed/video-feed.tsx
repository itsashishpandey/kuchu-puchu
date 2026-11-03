"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToastAction } from "@/components/ui/toast";
import { Logo, Avatar } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { get, post, type FeedVideo, type FeedPage, type FeedMeta, type SessionUser } from "@/lib/client";
import { compact } from "@/lib/format";
import { useAuth } from "@/components/app/auth-provider";
import { useLanguages, useCategories, useUiLocale, getGuestLanguages, setGuestLanguages, defaultGuestLanguages } from "@/lib/use-taxonomy";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { toast } from "@/hooks/use-toast";

type FeedTab = "foryou" | "following" | "trending";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "foryou", label: "For You" },
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
];
const PAGE = 10;

export function VideoFeed() {
  const route = useRoute();
  const q = route.query;
  const { user, loading: authLoading } = useAuth();
  const locale = useUiLocale();
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories();
  const [tab, setTab] = useState<FeedTab>((q.get("tab") as FeedTab) || "foryou");
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [guestLangs, setGuestLangsState] = useState<string[] | null>(null);
  const [langFilter, setLangFilter] = useState<string[]>(() => (q.get("languages") ?? "").split(",").filter(Boolean));
  const startId = q.get("v");
  const fresh = q.get("fresh") === "1";

  // a category/subcategory context (opened from Explore or search) keeps that filter while scrolling
  const ctxCat = categories.find(c => c.slug === q.get("category") || c.id === q.get("category"));
  const ctxSub = ctxCat?.subcategories.find(s => s.slug === q.get("subcategory") || s.id === q.get("subcategory"));

  // guests: languages live only on this device
  useEffect(() => {
    if (authLoading || user || !languages.length || guestLangs) return;
    const saved = getGuestLanguages();
    setGuestLangsState(saved.length ? saved : defaultGuestLanguages(languages));
  }, [authLoading, user, languages, guestLangs]);

  const query = useMemo(() => {
    const p = new URLSearchParams({ limit: String(PAGE), locale });
    if (ctxCat) {
      p.set("feed", tab === "trending" ? "trending" : "explore");
      p.set("category", ctxCat.slug);
      if (ctxSub) p.set("subcategory", ctxSub.slug);
    } else {
      p.set("feed", tab);
    }
    const langs = langFilter.length ? langFilter : !user && tab === "foryou" ? guestLangs ?? [] : [];
    if (langs.length) p.set("languages", langs.join(","));
    if (fresh && tab === "foryou") p.set("fresh", "1");
    return p.toString();
  }, [tab, locale, ctxCat, ctxSub, langFilter, user, guestLangs, fresh]);

  const ready = !authLoading && (user || guestLangs !== null || !languages.length);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true); setError(""); setActive(0);
    (async () => {
      try {
        const d = await get<FeedPage>(`/public/videos?${query}`);
        let list = d.videos;
        if (startId && !list.some(v => v.id === startId || v.contentId === startId)) {
          const one = await get<{ video: FeedVideo }>(`/public/videos/${startId}`).catch(() => null);
          if (one) list = [one.video, ...list];
        } else if (startId) {
          const i = list.findIndex(v => v.id === startId || v.contentId === startId);
          if (i > 0) list = [list[i], ...list.slice(0, i), ...list.slice(i + 1)];
        }
        if (!alive) return;
        setVideos(list); setNext(d.nextOffset); setMeta(d.meta ?? null);
      } catch (e) {
        if (alive) { setVideos([]); setNext(null); setError((e as Error).message); }
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [query, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // endless feed: fetch the next page when the viewer is 3 videos from the end
  useEffect(() => {
    if (loading || loadingMore || next === null || active < videos.length - 3) return;
    setLoadingMore(true);
    get<FeedPage>(`/public/videos?${query}&offset=${next}`)
      .then(d => { setVideos(v => [...v, ...d.videos.filter(x => !v.some(y => y.id === x.id))]); setNext(d.nextOffset); })
      .catch(() => setNext(null))
      .finally(() => setLoadingMore(false));
  }, [active, videos.length, next, loading, loadingMore, query]);

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
      inLanguage: v.languages?.find(l => l.isPrimary)?.code,
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

  const switchTab = (t: FeedTab) => {
    if (startId) navigate(`/feed?tab=${t}`, { replace: true }); // drop the shared-link video once the viewer moves on
    if (t !== tab) { setTab(t); setVideos([]); }
  };
  const clearContext = () => navigate("/feed", { replace: true });

  // remove a card (not interested / hidden creator) with an Undo that puts it back in place
  const removeVideos = useCallback((pred: (v: FeedVideo) => boolean, undo: () => Promise<unknown>, label: string) => {
    let removed: { v: FeedVideo; i: number }[] = [];
    setVideos(list => {
      removed = list.map((v, i) => ({ v, i })).filter(x => pred(x.v));
      return list.filter(v => !pred(v));
    });
    toast({
      title: label,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          undo().then(() => setVideos(list => {
            const out = [...list];
            removed.forEach(({ v, i }) => { if (!out.some(x => x.id === v.id)) out.splice(Math.min(i, out.length), 0, v); });
            return out;
          })).catch(() => {});
        }}>Undo</ToastAction>
      ),
    });
  }, []);

  const setGuest = (codes: string[]) => { setGuestLanguages(codes); setGuestLangsState(codes); };
  const shownLangs = langFilter.length ? langFilter : !user ? guestLangs ?? [] : meta?.languages ?? [];
  const byCode = new Map(languages.map(l => [l.code, l]));

  const languageButton = (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 hover:bg-white/15" aria-label="Choose feed languages">
          <Icons.Languages size={14} />
          <span className="max-w-[110px] truncate">{shownLangs.length ? shownLangs.map(c => byCode.get(c)?.nameNative ?? c).join(", ") : "Languages"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,320px)] space-y-3" align="end">
        <p className="text-sm font-bold">{user ? "Filter this feed by language" : "Which languages do you watch?"}</p>
        <div className="flex flex-wrap gap-1.5">
          {(user ? langFilter : guestLangs ?? []).map(code => (
            <span key={code} className="inline-flex items-center gap-1 rounded-full bg-brand-pink-soft px-2.5 py-1 text-xs font-semibold">
              {byCode.get(code)?.nameNative ?? code}
              <button aria-label="Remove" onClick={() => user ? setLangFilter(l => l.filter(c => c !== code)) : setGuest((guestLangs ?? []).filter(c => c !== code))}><Icons.X size={12} /></button>
            </span>
          ))}
          {user && !langFilter.length && <span className="text-xs text-muted-foreground">Showing your languages{meta?.languages?.length ? `: ${meta.languages.map(c => byCode.get(c)?.nameEn ?? c).join(", ")}` : ""}.</span>}
        </div>
        <LanguageCombobox languages={languages} placeholder="+ Add a language" exclude={user ? langFilter : guestLangs ?? []}
          onSelect={code => user ? setLangFilter(l => [...l, code]) : setGuest([...(guestLangs ?? []), code])} />
        {user ? (
          <button className="text-xs font-semibold text-brand-blue hover:underline" onClick={() => navigate("/settings/interests")}>Change my languages permanently →</button>
        ) : (
          <p className="text-[11px] text-muted-foreground">Saved on this device only. <button className="font-semibold text-brand-blue hover:underline" onClick={() => navigate("/join")}>Create a free account</button> to personalise everything.</p>
        )}
      </PopoverContent>
    </Popover>
  );

  const showOnboardingBanner = !!user && user.role !== "ADMIN" && user.onboarding && !user.onboarding.completed && !ctxCat;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-ink text-white">
      {/* desktop left rail */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/10 p-5 lg:flex" aria-label="Feed navigation">
        <button onClick={() => navigate("/")} aria-label="Kuchu Puchu home" className="mb-8 w-fit">
          <Logo dark />
        </button>
        <nav className="space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { clearContext(); switchTab(t.id); }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                tab === t.id && !ctxCat ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
              {t.id === "foryou" ? <Icons.Sparkles size={18} /> : t.id === "following" ? <Icons.Users size={18} /> : <Icons.Flame size={18} />}
              {t.label}
            </button>
          ))}
          <button onClick={() => navigate("/explore")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/50 transition hover:bg-white/5 hover:text-white">
            <Icons.LayoutGrid size={18} /> Explore categories
          </button>
          <button onClick={() => navigate("/search")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/50 transition hover:bg-white/5 hover:text-white">
            <Icons.Search size={18} /> Search
          </button>
          {user && user.role !== "ADMIN" && (
            <>
              <button onClick={() => navigate("/saved")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/50 transition hover:bg-white/5 hover:text-white">
                <Icons.Bookmark size={18} /> Saved
              </button>
              <button onClick={() => navigate("/settings/interests")} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white/50 transition hover:bg-white/5 hover:text-white">
                <Icons.SlidersHorizontal size={18} /> My Interests &amp; Languages
              </button>
            </>
          )}
          {(!user || user.role === "CREATOR") && (
            <button onClick={() => navigate(user ? "/dashboard" : "/register")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-red to-brand-yellow px-4 py-3 text-sm font-bold text-ink transition hover:opacity-90">
              <Icons.Sparkles size={16} /> {user ? "Creator dashboard" : "Start earning"}
            </button>
          )}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-white/50">
          <Icons.Info size={14} className="mb-1.5 text-brand-yellow" />
          {user ? "Use ⋯ on any video to save it, see fewer like it, or stop a creator from being recommended." : "Log in to like, save and follow — and to get a feed built around your interests."}
        </div>
      </aside>

      {/* top bar (all sizes): tabs or context chip, language filter, search */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 lg:left-[260px] xl:right-[340px]">
        <button onClick={() => navigate("/")} className="pointer-events-auto lg:hidden" aria-label="Home"><Logo dark size={28} /></button>
        <div className="pointer-events-auto mx-auto flex min-w-0 items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
          {ctxCat ? (
            <span className="flex min-w-0 items-center gap-1.5 px-3 py-1 text-xs font-bold">
              <span className="truncate">{ctxCat.emoji} {ctxCat.name}{ctxSub ? ` › ${ctxSub.name}` : ""}</span>
              <button onClick={clearContext} aria-label="Back to For You" className="rounded-full p-0.5 hover:bg-white/15"><Icons.X size={13} /></button>
            </span>
          ) : TABS.map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${tab === t.id ? "bg-white text-ink" : "text-white/70"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden sm:block">{languageButton}</div>
          <button onClick={() => navigate("/search")} aria-label="Search" className="rounded-full bg-black/40 p-2 backdrop-blur"><Icons.Search size={18} /></button>
        </div>
      </div>
      <div className="pointer-events-auto absolute left-3 top-14 z-30 sm:hidden">{languageButton}</div>

      {showOnboardingBanner && (
        <button onClick={() => navigate("/onboarding")}
          className="absolute left-1/2 top-24 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-brand-pink to-brand-blue px-4 py-2 text-xs font-bold text-white shadow-lg lg:top-16">
          <Icons.Sparkles size={14} /> Personalize your feed — pick your languages &amp; interests
        </button>
      )}

      {/* feed scroller */}
      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Icons.Loader2 size={32} className="animate-spin text-white/50" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-white/70">{error}</p>
            {/login/i.test(error) && (
              <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/login")}>Log in</Button>
            )}
          </div>
        ) : videos.length === 0 ? (
          <EmptyFeed tab={tab} meta={meta} user={user} hasFilter={langFilter.length > 0 || !!ctxCat}
            onForYou={() => { clearContext(); setLangFilter([]); switchTab("foryou"); }} />
        ) : (
          <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
            {videos.map((v, i) => (
              <FeedItem
                key={v.id} video={v} user={user} index={i}
                onVisible={setActive}
                onNotInterested={() => removeVideos(x => x.id === v.id, () => post(`/social/not-interested/${v.id}`, { undo: true }), "Got it — you'll see fewer videos like this")}
                onHideCreator={() => removeVideos(x => x.creator.id === v.creator.id, () => post(`/social/hide-creator/${v.creator.id}`, { undo: true }), `We won't recommend @${v.creator.username} to you`)}
              />
            ))}
            {loadingMore && <div className="flex h-24 items-center justify-center"><Icons.Loader2 className="animate-spin text-white/50" /></div>}
            {next === null && videos.length > 3 && (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-white/60">
                <p>You're all caught up ✨</p>
                <button className="font-bold text-brand-yellow hover:underline" onClick={() => navigate("/explore")}>Explore more categories</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* desktop right rail */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-l border-white/10 xl:flex" aria-label="Video details">
        {videos[active] && <InfoPanel video={videos[active]} />}
      </aside>
    </div>
  );
}

function EmptyFeed({ tab, meta, user, hasFilter, onForYou }: { tab: FeedTab; meta: FeedMeta | null; user: SessionUser | null; hasFilter: boolean; onForYou: () => void }) {
  const noLang = meta?.emptyReason === "NO_VIDEOS_IN_YOUR_LANGUAGES";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      {noLang ? <Icons.Languages size={36} className="text-white/40" /> : <Icons.Users size={36} className="text-white/40" />}
      <p className="font-display text-lg font-bold">{noLang ? "No videos in your languages yet" : "Nothing here yet"}</p>
      <p className="max-w-xs text-sm text-white/50">
        {tab === "following" && !hasFilter ? "Follow creators and their newest videos will appear here."
          : noLang ? "New creators join every day. Meanwhile you can add a language, or let us show you videos in other languages."
          : "No videos match this feed right now."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {noLang && user && (
          <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/settings/interests")}>Discover other languages</Button>
        )}
        <Button variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10" onClick={() => (tab === "foryou" && !hasFilter ? navigate("/explore") : onForYou())}>
          {tab === "foryou" && !hasFilter ? "Explore categories" : "Back to For You"}
        </Button>
      </div>
    </div>
  );
}

// ── Single feed item ───────────────────────────────────────────────────────

function FeedItem({
  video, user, index, onVisible, onNotInterested, onHideCreator,
}: {
  video: FeedVideo; user: SessionUser | null; index: number;
  onVisible: (i: number) => void; onNotInterested: () => void; onHideCreator: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(video.liked);
  const [likes, setLikes] = useState(video.likes);
  const [following, setFollowing] = useState(video.following);
  const [saved, setSaved] = useState(!!video.saved);
  const [reportOpen, setReportOpen] = useState(false);
  const [credited, setCredited] = useState(false);
  const viewSent = useRef(false);
  const completeSent = useRef(false);
  const watchStart = useRef<number>(0);
  const watchedMs = useRef(0);
  const lastTime = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const loggedIn = !!user;
  const primaryTag = video.tags?.[0];
  const primaryLang = video.languages?.find(l => l.isPrimary) ?? video.languages?.[0];

  const watchedSecs = () => (watchedMs.current + (watchStart.current ? performance.now() - watchStart.current : 0)) / 1000;

  // record a view once per watch session (the server decides whether it qualifies)
  const sendView = useCallback(() => {
    if (viewSent.current) return;
    const secs = watchedSecs();
    if (secs < 2) return;
    viewSent.current = true;
    post<{ qualified: boolean; credited: boolean }>(`/social/view/${video.id}`, { watchSeconds: Math.round(secs), durationSeconds: video.duration })
      .then(res => { if (res.credited) setCredited(true); })
      .catch(() => {});
  }, [video.id, video.duration]);

  // watched to the end → completion signal (recommendations + creator analytics; never money)
  const sendComplete = useCallback(() => {
    if (completeSent.current || !video.duration) return;
    const secs = watchedSecs();
    if (secs < video.duration * 0.85) return;
    completeSent.current = true;
    sendView();
    post(`/social/complete/${video.id}`, { watchSeconds: Math.round(secs), durationSeconds: video.duration }).catch(() => {});
  }, [video.id, video.duration, sendView]);

  // autoplay active video, pause off-screen
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      entries => {
        const visible = entries[0].intersectionRatio > 0.6;
        setIsVisible(visible);
        if (visible) onVisible(index);
        const v = videoRef.current;
        if (!v) return;
        if (visible) v.play().catch(() => {});
        else { v.pause(); sendView(); }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(node);
    return () => { io.disconnect(); sendView(); };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // track watch time; the player loops, so a jump from the end back to the start counts as "ended"
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => { watchStart.current = performance.now(); setPlaying(true); };
    const onPause = () => {
      if (watchStart.current) watchedMs.current += performance.now() - watchStart.current;
      watchStart.current = 0;
      setPlaying(false);
      sendView();
    };
    const onTime = () => {
      const d = Math.max(v.duration || video.duration || 1, 1);
      if (lastTime.current > d - 1.2 && v.currentTime < 1) sendComplete();
      lastTime.current = v.currentTime;
      setProgress((v.currentTime / d) * 100);
    };
    const onEnded = () => { sendComplete(); };
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const needLogin = (what: string) => { toast({ title: "Log in first", description: what }); navigate("/login"); };

  const toggleLike = async () => {
    if (!loggedIn) return needLogin("Create a free account to like videos.");
    try {
      const res = await post<{ liked: boolean; likes: number }>(`/social/like/${video.id}`);
      setLiked(res.liked); setLikes(res.likes);
    } catch (e) { toast({ title: "Couldn't like", description: (e as Error).message, variant: "destructive" }); }
  };

  const toggleFollow = async () => {
    if (!loggedIn) return needLogin("Log in to follow creators.");
    try {
      const channelId = video.creator.channelId ?? (await get<{ channel: { id: string } }>(`/public/creator/${video.creator.username}`)).channel.id;
      const res = await post<{ following: boolean }>(`/social/follow/${video.id}`, { channelId });
      setFollowing(res.following);
      toast({ title: res.following ? `Following @${video.creator.username}` : `Unfollowed @${video.creator.username}` });
    } catch (e) { toast({ title: "Couldn't follow", description: (e as Error).message, variant: "destructive" }); }
  };

  const toggleSave = async () => {
    if (!loggedIn) return needLogin("Log in to save videos.");
    try {
      const res = await post<{ saved: boolean; message: string }>(`/social/save/${video.id}`, { saved: !saved });
      setSaved(res.saved);
      toast({ title: res.saved ? "Saved 🔖" : "Removed from saved" });
    } catch (e) { toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" }); }
  };

  const notInterested = async () => {
    if (!loggedIn) return needLogin("Log in to personalise your feed.");
    try { await post(`/social/not-interested/${video.id}`); onNotInterested(); }
    catch (e) { toast({ title: "Couldn't update", description: (e as Error).message, variant: "destructive" }); }
  };

  const hideCreator = async () => {
    if (!loggedIn) return needLogin("Log in to personalise your feed.");
    try { await post(`/social/hide-creator/${video.creator.id}`); onHideCreator(); }
    catch (e) { toast({ title: "Couldn't update", description: (e as Error).message, variant: "destructive" }); }
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
      post(`/social/share/${video.id}`).catch(() => {});
    } catch { /* dismissed */ }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const moreMenu = (trigger: React.ReactNode) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onClick={toggleSave} className="gap-2">
          <Icons.Bookmark size={15} fill={saved ? "currentColor" : "none"} /> {saved ? "Remove from saved" : "Save"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={notInterested} className="gap-2"><Icons.EyeOff size={15} /> Not interested</DropdownMenuItem>
        {user?.id !== video.creator.id && (
          <DropdownMenuItem onClick={hideCreator} className="gap-2"><Icons.UserX size={15} /> Don't recommend @{video.creator.username}</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setReportOpen(true)} className="gap-2 text-brand-red"><Icons.Flag size={15} /> Report</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div ref={containerRef} className="relative flex h-full snap-start snap-always items-center justify-center" style={{ scrollSnapStop: "always" }}>
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

        {!playing && isVisible && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center" aria-label="Play">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/45 backdrop-blur">
              <Icons.Play size={36} fill="#fff" color="#fff" className="ml-1" />
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        {credited && (
          <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-emerald-500/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-lg">
            ✓ Qualified view — creator earned
          </div>
        )}

        {/* desktop side actions */}
        <div className="absolute bottom-24 right-3 z-20 hidden flex-col items-center gap-4 md:flex">
          <FeedAction active={liked} onClick={toggleLike} icon={<Icons.Heart size={26} fill={liked ? "currentColor" : "none"} />} label={compact(likes)} activeClass="text-brand-red" />
          <FeedAction active={saved} onClick={toggleSave} icon={<Icons.Bookmark size={24} fill={saved ? "currentColor" : "none"} />} label={saved ? "Saved" : "Save"} activeClass="text-brand-yellow" />
          <FeedAction onClick={share} icon={<Icons.Share2 size={24} />} label={compact(video.shares + 1)} />
          {moreMenu(
            <button aria-label="More options" className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:scale-110">
              <Icons.MoreHorizontal size={24} />
            </button>
          )}
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
            {user?.id !== video.creator.id && (
              <button onClick={toggleFollow}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${following ? "border border-white/40 text-white/80" : "bg-brand-red text-white hover:bg-brand-red/85"}`}>
                {following ? "Following" : "Follow"}
              </button>
            )}
          </div>
          <p className="mt-2.5 line-clamp-2 max-w-lg text-sm leading-snug">{video.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-white/75">
            {primaryTag && (
              <button onClick={() => navigate(`/explore?category=${primaryTag.category.slug}&sub=${primaryTag.subcategory.slug}`)}
                className="rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white backdrop-blur hover:bg-white/25">
                {primaryTag.category.emoji} {primaryTag.subcategory.name}
              </button>
            )}
            {primaryLang && (
              <span className="rounded-full bg-brand-yellow/90 px-2 py-0.5 font-bold text-ink" dir={primaryLang.direction === "RTL" ? "rtl" : undefined}>
                {primaryLang.nameNative}{video.languages && video.languages.length > 1 ? ` +${video.languages.length - 1}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1"><Icons.Play size={11} fill="currentColor" /> {compact(video.views)} views</span>
            {video.hashtags.slice(0, 3).map(h => (
              <button key={h} onClick={() => navigate(`/search?q=${encodeURIComponent(h)}`)} className="font-semibold text-white/85 hover:text-brand-yellow">#{h}</button>
            ))}
          </div>

          {/* mobile action row */}
          <div className="mt-3 flex items-center gap-5 md:hidden">
            <MobileAction onClick={toggleLike} icon={<Icons.Heart size={25} fill={liked ? "currentColor" : "none"} />} label={compact(likes)} active={liked} activeClass="text-brand-red" />
            <MobileAction onClick={toggleSave} icon={<Icons.Bookmark size={23} fill={saved ? "currentColor" : "none"} />} label={saved ? "Saved" : "Save"} active={saved} activeClass="text-brand-yellow" />
            <MobileAction onClick={share} icon={<Icons.Share2 size={23} />} label="Share" />
            {moreMenu(
              <button className="flex flex-col items-center gap-1 text-white" aria-label="More options">
                <Icons.MoreHorizontal size={25} />
                <span className="text-[10px] font-semibold text-white/70">More</span>
              </button>
            )}
          </div>
        </div>

        <button onClick={() => setMuted(m => !m)} className="absolute right-3 top-28 z-20 rounded-full bg-black/45 p-2.5 backdrop-blur md:top-16" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <Icons.VolumeX size={17} /> : <Icons.Volume2 size={17} />}
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 px-1 pb-0.5">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

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
      await post(`/social/report/${videoId}`, { reason, details });
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
          <li>• ₹30 one-time approved-upload reward</li>
          <li>• Earning unlocks once a channel gets 2,500 views within 30 days</li>
          <li>• Only app views count — once per viewer every 4 hours</li>
        </ul>
        <Progress value={0} className="mt-3 h-0" />
      </div>
    </div>
  );
}
