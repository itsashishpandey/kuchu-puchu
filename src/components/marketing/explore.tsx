"use client";

// Explore / Trending: browse by main category, then narrow with horizontal subcategory chips and a
// language filter — all combinable, URL-driven (/explore?category=&sub=&languages=), no reloads.
import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/ui-bits";
import { AppButtons, AppCtaBand } from "@/components/shared/app-buttons";
import { Link, navigate, useRoute } from "@/components/app/router";
import { CATEGORY_SEO } from "@/lib/seo-pages";
import { get, type FeedPage, type FeedVideo } from "@/lib/client";
import { useLanguages, useCategories, useUiLocale } from "@/lib/use-taxonomy";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { VideoGrid, LoadMore } from "@/components/discovery/video-grid";
import { cn } from "@/lib/utils";

const PAGE = 24;

export function ExplorePage({ trending = false }: { trending?: boolean }) {
  const route = useRoute();
  const params = route.query;
  const locale = useUiLocale();
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [search, setSearch] = useState("");

  const catParam = params.get("category") ?? "";
  // older links used the category name or an old kids category — match by slug, id or name
  const cat = categories.find(c => c.slug === catParam || c.id === catParam || c.nameEn.toLowerCase() === catParam.toLowerCase());
  const subParam = params.get("sub") ?? params.get("subcategory") ?? "";
  const sub = cat?.subcategories.find(s => s.slug === subParam || s.id === subParam);
  const langCodes = (params.get("languages") ?? "").split(",").filter(Boolean);
  const hashtag = params.get("q") ?? "";

  const query = () => {
    const p = new URLSearchParams({ feed: trending ? "trending" : "explore", limit: String(PAGE), locale });
    if (cat) p.set("category", cat.slug); else if (catParam) p.set("category", catParam);
    if (sub) p.set("subcategory", sub.slug);
    if (langCodes.length) p.set("languages", langCodes.join(","));
    if (hashtag) p.set("q", hashtag.replace(/^#/, ""));
    return p;
  };
  const key = `${trending}|${cat?.id ?? catParam}|${sub?.id ?? ""}|${langCodes.join(",")}|${hashtag}|${locale}`;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    get<FeedPage>(`/public/videos?${query()}`)
      .then(d => { if (alive) { setVideos(d.videos); setNext(d.nextOffset); } })
      .catch(() => { if (alive) { setVideos([]); setNext(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    if (next === null) return;
    setMore(true);
    try {
      const p = query(); p.set("offset", String(next));
      const d = await get<FeedPage>(`/public/videos?${p}`);
      setVideos(v => [...v, ...d.videos.filter(x => !v.some(y => y.id === x.id))]); setNext(d.nextOffset);
    } finally { setMore(false); }
  };

  const set = (changes: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) { if (v) p.set(k, v); else p.delete(k); }
    p.delete("subcategory");
    navigate(`/${trending ? "trending" : "explore"}${p.toString() ? `?${p}` : ""}`, { replace: true });
  };

  const feedQuery = new URLSearchParams({
    ...(cat ? { category: cat.slug } : {}), ...(sub ? { subcategory: sub.slug } : {}),
    ...(langCodes.length ? { languages: langCodes.join(",") } : {}), ...(trending ? { tab: "trending" } : {}),
  }).toString();
  const byCode = new Map(languages.map(l => [l.code, l]));

  return (
    <>
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-6 md:pt-32">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            {trending ? <>🔥 Trending <span className="grad-text">Kuchu Puchu Videos</span></> : cat ? <>{cat.emoji} <span className="grad-text">{cat.name}</span></> : <>Kuchu Puchu <span className="grad-text">Videos for Kids</span></>}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {trending
              ? "The most-watched kids videos on Kuchu Puchu from the last 30 days: cartoons, rhymes, stories and learning videos."
              : cat?.description ?? "Watch free Kuchu Puchu videos online: cartoons, nursery rhymes, stories, ABC and learning videos for kids aged 3–8. Pick a category, then narrow it by topic and language."}
          </p>
          <AppButtons className="mt-4" />
        </div>
        <form onSubmit={e => { e.preventDefault(); if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`); }} className="relative w-full max-w-sm" role="search">
          <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos, creators, languages…" className="h-11 rounded-full border-2 pl-10" aria-label="Search" />
        </form>
      </div>

      {/* main categories */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Categories">
        <button role="tab" aria-selected={!cat && !catParam} onClick={() => set({ category: null, sub: null })}
          className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition", !cat && !catParam ? "grad-btn border-transparent text-white" : "bg-white hover:border-brand-pink/40")}>
          All
        </button>
        {categories.map(c => (
          <button key={c.id} role="tab" aria-selected={cat?.id === c.id} onClick={() => set({ category: c.slug, sub: null })}
            className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
              cat?.id === c.id ? "grad-btn border-transparent text-white" : "bg-white hover:border-brand-pink/40")}>
            <span aria-hidden>{c.emoji}</span> {c.name}
            {c.videoCount > 0 && <span className={cn("text-xs", cat?.id === c.id ? "text-white/80" : "text-muted-foreground")}>{c.videoCount}</span>}
          </button>
        ))}
      </div>

      {/* subcategory chips for the chosen category */}
      {cat && (
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-2" aria-label={`${cat.name} subcategories`}>
          <button onClick={() => set({ sub: null })}
            className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition", !sub ? "bg-ink text-white" : "bg-muted hover:bg-muted/70")}>
            All {cat.name}
          </button>
          {cat.subcategories.map(s => (
            <button key={s.id} onClick={() => set({ sub: s.slug })}
              className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition", sub?.id === s.id ? "bg-ink text-white" : "bg-muted hover:bg-muted/70")}>
              {s.emoji ? `${s.emoji} ` : ""}{s.name}{s.videoCount > 0 ? ` · ${s.videoCount}` : ""}
            </button>
          ))}
        </div>
      )}

      {/* language filter */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"><Icons.Languages size={15} /> Language:</span>
        {langCodes.length === 0 && <span className="rounded-full bg-muted px-3 py-1 text-sm">All languages</span>}
        {langCodes.map(code => (
          <span key={code} className="inline-flex items-center gap-1 rounded-full bg-brand-yellow-soft px-3 py-1 text-sm font-semibold">
            {byCode.get(code)?.nameNative ?? code}
            <button aria-label="Remove language" onClick={() => set({ languages: langCodes.filter(c => c !== code).join(",") || null })} className="rounded-full p-0.5 hover:bg-black/10"><Icons.X size={13} /></button>
          </span>
        ))}
        <div className="w-48">
          <LanguageCombobox languages={languages} placeholder="+ Add language" exclude={langCodes} className="h-8 rounded-full text-xs"
            onSelect={code => set({ languages: [...langCodes, code].join(",") })} />
        </div>
        {hashtag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue-soft px-3 py-1 text-sm font-semibold text-brand-blue">
            {hashtag.startsWith("#") ? hashtag : `“${hashtag}”`}
            <button aria-label="Remove search" onClick={() => set({ q: null })} className="rounded-full p-0.5 hover:bg-black/10"><Icons.X size={13} /></button>
          </span>
        )}
      </div>

      <div className="mt-6">
        {!loading && videos.length === 0 ? (
          <EmptyState icon="SearchX" title="No videos here yet"
            description={langCodes.length ? "Nothing in these languages for this filter yet — try adding another language." : "Nothing matches this filter yet — try another category or check back soon."}
            action={{ label: "Clear filters", onClick: () => navigate(trending ? "/trending" : "/explore", { replace: true }) }} />
        ) : (
          <>
            <VideoGrid videos={videos} loading={loading} feedQuery={feedQuery} />
            <LoadMore show={next !== null} busy={more} onClick={loadMore} />
          </>
        )}
      </div>
    </div>

    <AppCtaBand heading="Watch Kuchu Puchu in the App" text="The free Kuchu Puchu app opens straight into short videos for kids, with no ads and no sign-up." />

    {/* every category page, as real links */}
    <section className="bg-white py-14 md:py-16" aria-labelledby="explore-browse">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
        <h2 id="explore-browse" className="font-display text-2xl font-bold text-ink md:text-3xl">Browse Kuchu Puchu Videos by Category</h2>
        <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_SEO.map(c => (
            <li key={c.dbSlug}>
              <Link to={c.path} className="bento flex h-full items-center gap-2 p-4 text-left text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:text-brand-blue">
                <span className="text-2xl" aria-hidden>{c.emoji}</span> {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <AppCtaBand tone="dark" heading="Download the Kuchu Puchu App"
      text="Funny learning videos for kids aged 3–8: ABCs, counting, colors, rhymes and stories. Free, with no ads." />
    </>
  );
}
