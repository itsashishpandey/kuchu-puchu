"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Link, navigate } from "@/components/app/router";
import { get } from "@/lib/client";
import { compact } from "@/lib/format";

// shared shape for public video payloads
export type PubVideo = {
  id: string; title: string; thumbnailUrl: string | null; videoUrl: string;
  views: number; likes: number; duration: number; category: string;
  publishedAt: string;
  creator: { username: string; channelName: string; avatarUrl: string | null; verified: boolean };
};

function openFeed(id: string) {
  navigate(`/feed?v=${id}`);
}

// ── Section 4: Trending now — dual auto-scrolling video rails ─────────────

function MarqueeVideoCard({ v, rank }: { v: PubVideo; rank: number }) {
  return (
    <button
      onClick={() => openFeed(v.id)}
      className="group relative aspect-[9/16] w-40 shrink-0 overflow-hidden rounded-2xl bg-ink text-left shadow-md ring-1 ring-black/5 transition-all hover:z-10 hover:scale-[1.04] hover:shadow-xl focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-brand-blue sm:w-44 md:w-48"
      aria-label={`Watch ${v.title} by ${v.creator.channelName}`}
    >
      <img
        src={v.thumbnailUrl ?? ""} alt={v.title} loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <video
        src={v.videoUrl} muted loop playsInline preload="metadata" aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity data-[play=true]:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/25" />
      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
        <Icons.Flame size={11} className="text-brand-yellow" /> #{rank}
      </span>
      <span className="absolute right-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
        {Math.floor(v.duration)}s
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="flex items-center gap-1.5">
          {v.creator.avatarUrl && (
            <img src={v.creator.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-white/60" />
          )}
          <span className="truncate text-[11px] font-semibold text-white/85">@{v.creator.username}</span>
          {v.creator.verified && <Icons.BadgeCheck size={12} className="shrink-0 text-brand-blue" />}
        </div>
        <p className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-white">{v.title}</p>
        <p className="mt-1 flex items-center gap-3 text-[10px] text-white/70">
          <span className="flex items-center gap-1"><Icons.Play size={10} fill="currentColor" /> {compact(v.views)}</span>
          <span className="flex items-center gap-1"><Icons.Heart size={10} fill="currentColor" /> {compact(v.likes)}</span>
        </p>
      </div>
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 backdrop-blur-md ring-1 ring-white/50">
          <Icons.Play size={20} fill="currentColor" className="text-white translate-x-[1px]" />
        </span>
      </span>
    </button>
  );
}

function MarqueePosterCard({ v }: { v: PubVideo }) {
  return (
    <button
      onClick={() => openFeed(v.id)}
      className="group relative aspect-[9/16] w-36 shrink-0 overflow-hidden rounded-2xl bg-ink text-left shadow-md ring-1 ring-black/5 transition-all hover:z-10 hover:scale-[1.04] hover:shadow-xl focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-brand-pink sm:w-40 md:w-44"
      aria-label={`Watch ${v.title} by ${v.creator.channelName}`}
    >
      <img
        src={v.thumbnailUrl ?? ""} alt={v.title} loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/20" />
      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full grad-pink px-2.5 py-1 text-[10px] font-bold text-white shadow">
        <Icons.Sparkles size={10} /> NEW
      </span>
      <span className="absolute right-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
        {Math.floor(v.duration)}s
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-[12px] font-bold leading-snug text-white">{v.title}</p>
        <p className="mt-1 flex items-center gap-2 text-[10px] text-white/70">
          <span className="truncate">@{v.creator.username}</span>
          <span className="flex shrink-0 items-center gap-1"><Icons.Play size={10} fill="currentColor" /> {compact(v.views)}</span>
        </p>
      </div>
    </button>
  );
}

export function TrendingMarquee() {
  const [trending, setTrending] = useState<PubVideo[]>([]);
  const [fresh, setFresh] = useState<PubVideo[]>([]);
  const [loaded, setLoaded] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    get<{ videos: PubVideo[] }>("/public/videos?feed=trending&limit=10").then(d => setTrending(d.videos)).catch(() => {}).finally(() => setLoaded(n => n + 1));
    get<{ videos: PubVideo[] }>("/public/videos?feed=explore&limit=10").then(d => setFresh(d.videos)).catch(() => {}).finally(() => setLoaded(n => n + 1));
  }, []);

  // play marquee videos only while the rail is on screen
  useEffect(() => {
    const row = rowRef.current;
    if (!row || trending.length === 0) return;
    const videos = Array.from(row.querySelectorAll<HTMLVideoElement>("video"));
    const setPlay = (on: boolean) => videos.forEach(v => {
      if (on) { v.play().then(() => v.dataset.play = "true").catch(() => {}); }
      else { v.pause(); delete v.dataset.play; }
    });
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting), { threshold: 0.15 });
    io.observe(row);
    const onVis = () => setPlay(!document.hidden && !!io.takeRecords().length);
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [trending.length]);

  if (trending.length === 0 && fresh.length === 0) {
    if (loaded >= 2) return null;
    return (
      <section className="py-10" aria-label="Trending videos">
        <div className="mx-auto max-w-7xl space-y-4 px-4 md:px-6">
          <div className="shimmer h-8 w-56 rounded-full" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer aspect-[9/16] w-44 shrink-0 rounded-2xl" />)}
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer aspect-[9/16] w-40 shrink-0 rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden py-12 md:py-16" aria-label="Trending videos">
      <div className="mx-auto mb-7 flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 md:px-6">
        <div>
          <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-yellow-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#b07800]">
            <Icons.Flame size={13} /> Trending now
          </span>
          <h2 className="font-display text-3xl font-bold md:text-[2.5rem]">What kids are watching right now</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
            Real videos from approved creators — playing live. Tap any card to jump into the feed.
          </p>
        </div>
        <Link
          to="/trending"
          className="inline-flex items-center gap-1.5 rounded-full border bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-brand-pink/40 hover:text-brand-pink"
        >
          View all trending <Icons.ArrowRight size={15} />
        </Link>
      </div>

      {/* row A — autoplaying trending videos, scroll left */}
      <div ref={rowRef} className="marquee-hover group relative" style={{ ["--marquee-fade" as string]: "linear-gradient(90deg,transparent,black 4%,black 96%,transparent)" }}>
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_3%,black_97%,transparent)]">
          <div className="animate-marquee flex w-max" style={{ animationDuration: "55s" }}>
            {[0, 1].map(copy => (
              <div key={copy} className="flex gap-4 pr-4" aria-hidden={copy === 1}>
                {trending.map((v, i) => <MarqueeVideoCard key={`${copy}-${v.id}`} v={v} rank={i + 1} />)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* row B — fresh drops posters, scroll right */}
      <div className="marquee-hover group mt-4">
        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_3%,black_97%,transparent)]">
          <div className="animate-marquee reverse flex w-max" style={{ animationDuration: "62s" }}>
            {[0, 1].map(copy => (
              <div key={copy} className="flex gap-4 pr-4" aria-hidden={copy === 1}>
                {fresh.map(v => <MarqueePosterCard key={`${copy}-${v.id}`} v={v} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section: Fresh drops — hover-preview grid of the newest uploads ───────

export function FreshDrops() {
  const [videos, setVideos] = useState<PubVideo[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    get<{ videos: PubVideo[] }>("/public/videos?feed=explore&limit=8").then(d => setVideos(d.videos)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  if (loaded && videos.length === 0) return null;

  return (
    <section className="py-16 md:py-24" aria-label="New videos from creators">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-pink-soft px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-pink">
              <Icons.Sparkles size={13} /> Fresh drops
            </span>
            <h2 className="font-display text-3xl font-bold md:text-[2.6rem]">New Kuchu Puchu Videos for Kids</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              The newest cartoons, rhymes and learning videos from our approved creators. Hover a card to preview it.
            </p>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-brand-blue/40 hover:text-brand-blue">
            Explore all videos <Icons.ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {videos.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer aspect-[9/16] rounded-2xl" />
              ))
            : videos.map((v, i) => (
                <button
                  key={v.id}
                  className="reveal group relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-brand-pink"
                  style={{ transitionDelay: `${i * 40}ms` }}
                  onMouseEnter={() => setHovered(v.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => openFeed(v.id)}
                  aria-label={`Watch ${v.title} by ${v.creator.channelName}`}
                >
                  <img
                    src={v.thumbnailUrl ?? ""} alt={v.title} loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {hovered === v.id && (
                    <video
                      src={v.videoUrl} muted loop playsInline autoPlay
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/20" />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                    <Icons.Clock size={10} className="mr-1 inline" />
                    {new Date(v.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                    {Math.floor(v.duration)}s
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white">{v.title}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {v.creator.avatarUrl && (
                        <img src={v.creator.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                      )}
                      <span className="truncate text-[11px] text-white/75">@{v.creator.username}</span>
                      {v.creator.verified && <Icons.BadgeCheck size={12} className="shrink-0 text-brand-blue" />}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-white/70">
                      <span className="flex items-center gap-1"><Icons.Play size={11} fill="currentColor" /> {compact(v.views)}</span>
                      <span className="flex items-center gap-1"><Icons.Heart size={11} fill="currentColor" /> {compact(v.likes)}</span>
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </section>
  );
}
