"use client";

import * as Icons from "lucide-react";
import { navigate } from "@/components/app/router";
import type { FeedVideo } from "@/lib/client";
import { compact } from "@/lib/format";

/** Grid of 9:16 video cards (explore, search, saved, channel). `feedQuery` keeps the context when opening the player. */
export function VideoGrid({ videos, feedQuery = "", loading = false, skeletons = 12 }: {
  videos: FeedVideo[]; feedQuery?: string; loading?: boolean; skeletons?: number;
}) {
  if (loading && videos.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: skeletons }).map((_, i) => <div key={i} className="shimmer aspect-[9/16] rounded-2xl" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {videos.map(v => <VideoCard key={v.id} video={v} feedQuery={feedQuery} />)}
    </div>
  );
}

export function VideoCard({ video: v, feedQuery = "" }: { video: FeedVideo; feedQuery?: string }) {
  const primary = v.tags?.[0];
  const lang = v.languages?.find(l => l.isPrimary) ?? v.languages?.[0];
  return (
    <button
      onClick={() => navigate(`/feed?v=${v.id}${feedQuery ? `&${feedQuery}` : ""}`)}
      className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
      aria-label={`Play ${v.title}`}
    >
      <img src={v.thumbnailUrl ?? ""} alt={v.title} loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/20" />
      <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
        <span className="max-w-[75%] truncate rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {primary ? `${primary.category.emoji ?? ""} ${primary.subcategory.name}` : v.category}
        </span>
        <span className="shrink-0 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">{Math.round(v.duration)}s</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3">
        {lang && (
          <span className="mb-1.5 inline-block rounded-md bg-brand-yellow/90 px-1.5 py-0.5 text-[10px] font-bold text-ink" dir={lang.direction === "RTL" ? "rtl" : undefined}>
            {lang.nameNative}{v.languages && v.languages.length > 1 ? ` +${v.languages.length - 1}` : ""}
          </span>
        )}
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white">{v.title}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {v.creator.avatarUrl && <img src={v.creator.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />}
          <span className="truncate text-[11px] text-white/75">@{v.creator.username}</span>
          {v.saved && <Icons.Bookmark size={11} className="ml-auto shrink-0 text-brand-yellow" fill="currentColor" aria-label="Saved" />}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-white/70">
          <span className="flex items-center gap-1"><Icons.Play size={11} fill="currentColor" /> {compact(v.views)}</span>
          <span className="flex items-center gap-1"><Icons.Heart size={11} fill="currentColor" /> {compact(v.likes)}</span>
        </div>
      </div>
    </button>
  );
}

export function LoadMore({ onClick, busy, show }: { onClick: () => void; busy: boolean; show: boolean }) {
  if (!show) return null;
  return (
    <div className="mt-8 flex justify-center">
      <button onClick={onClick} disabled={busy}
        className="rounded-full border-2 bg-white px-6 py-2.5 text-sm font-bold transition hover:border-brand-pink/50 disabled:opacity-60">
        {busy ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
