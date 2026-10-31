"use client";

import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryIcon, EmptyState } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { get, type FeedVideo } from "@/lib/client";
import { compact } from "@/lib/format";

export function ExplorePage({ trending = false }: { trending?: boolean }) {
  const route = useRoute();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string; videoCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(route.query.get("category") ?? "");

  useEffect(() => {
    get<{ categories: { name: string; slug: string; videoCount: number }[] }>("/public/categories")
      .then(d => setCategories(d.categories.filter(c => c.videoCount > 0))).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ feed: trending ? "trending" : "explore", limit: "24" });
    if (category) params.set("category", category);
    if (search.trim()) params.set("q", search.trim());
    get<{ videos: FeedVideo[] }>(`/public/videos?${params}`)
      .then(d => { if (alive) setVideos(d.videos); })
      .catch(() => { if (alive) setVideos([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [category, trending, search]);

  const debouncedSearch = useMemo(() => search, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-6 md:pt-32">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          {trending ? (
            <>🔥 Trending <span className="grad-text">this month</span></>
          ) : (
            <>Explore <span className="grad-text">original shorts</span></>
          )}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {trending
            ? "The most-watched originals from the last 30 days — every view here was qualified and paid."
            : "Fresh originals from approved creators across every category. All monetized, all original."}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-md flex-1">
          <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search titles, creators, #hashtags…"
            className="h-11 rounded-full border-2 pl-10"
            aria-label="Search videos"
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => { setCategory(""); setLoading(true); }}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${!category ? "grad-btn border-transparent text-white" : "bg-white hover:border-brand-red/40"}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.slug} onClick={() => { setCategory(c.slug); setLoading(true); }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${category === c.slug ? "grad-btn border-transparent text-white" : "bg-white hover:border-brand-red/40"}`}
            >
              <CategoryIcon name={c.name} size={14} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="shimmer aspect-[9/16] rounded-2xl" />)}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon="SearchX" title="No videos found"
          description={`Nothing matches${search ? ` "${debouncedSearch}"` : " this filter"} yet — try another category or check back soon.`}
          action={{ label: "Clear filters", onClick: () => { setSearch(""); setCategory(""); } }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {videos.map(v => (
            <button
              key={v.id}
              onClick={() => navigate(`/feed?v=${v.id}`)}
              className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <img src={v.thumbnailUrl ?? ""} alt={v.title} loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/10 to-ink/15" />
              <span className="absolute left-2.5 top-2.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                {v.category}
              </span>
              <span className="absolute right-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {Math.round(v.duration)}s
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white">{v.title}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {v.creator.avatarUrl && <img src={v.creator.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />}
                  <span className="truncate text-[11px] text-white/75">@{v.creator.username}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-white/70">
                  <span className="flex items-center gap-1"><Icons.Play size={11} fill="currentColor" /> {compact(v.views)}</span>
                  <span className="flex items-center gap-1"><Icons.Heart size={11} fill="currentColor" /> {compact(v.likes)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
