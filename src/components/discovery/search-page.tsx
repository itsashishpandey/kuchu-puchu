"use client";

// Unified search. The server reads languages / categories / subcategories out of the text
// ("Hindi nursery rhymes" → Hindi + Rhymes & Songs › Nursery Rhymes); those become
// removable filter chips here. Near-misses ("hindhi") are only offered as "Did you mean …?".
import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { get, type FeedVideo } from "@/lib/client";
import { compact } from "@/lib/format";
import { useLanguages, useCategories, useUiLocale } from "@/lib/use-taxonomy";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { VideoGrid, LoadMore } from "./video-grid";

type Suggestion = { type: "language" | "category" | "subcategory"; id: string; label: string; reason: string; token: string; categoryId: string | null };
type SearchResponse = {
  query: string;
  interpretation: {
    languages: { code: string; nameEn: string; nameNative: string }[];
    category: { id: string; slug: string; name: string; emoji: string | null } | null;
    subcategory: { id: string; slug: string; name: string } | null;
    text: string; suggestions: Suggestion[];
  };
  videos: FeedVideo[];
  creators: { username: string; channelName: string; avatarUrl: string | null; verified: boolean; followerCount: number }[];
  total: number; nextOffset: number | null;
};

function withParams(base: URLSearchParams, changes: Record<string, string | null>) {
  const p = new URLSearchParams(base);
  for (const [k, v] of Object.entries(changes)) { if (v) p.set(k, v); else p.delete(k); }
  return p;
}

export function SearchPage() {
  const route = useRoute();
  const params = route.query;
  const q = params.get("q") ?? "";
  const [text, setText] = useState(q);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const asked = params.get("asked") ?? q; // the words the viewer typed, before they became chips
  const locale = useUiLocale();
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories();
  const inputRef = useRef<HTMLInputElement>(null);
  const key = params.toString();

  useEffect(() => { setText(q); }, [q]);

  useEffect(() => {
    const hasAny = q.trim() || params.get("languages") || params.get("category") || params.get("subcategory");
    if (!hasAny) { setData(null); setVideos([]); return; }
    let alive = true;
    setLoading(true);
    const p = withParams(params, { asked: null, locale });
    get<SearchResponse>(`/search?${p}`).then(d => {
      if (!alive) return;
      // lift what the server understood into explicit, removable filters (URL keeps the original words in `asked`)
      const i = d.interpretation;
      const lifted: Record<string, string | null> = {};
      if (!params.get("languages") && i.languages.length) lifted.languages = i.languages.map(l => l.code).join(",");
      if (!params.get("category") && !params.get("subcategory") && i.category) {
        lifted.category = i.category.slug;
        if (i.subcategory) lifted.subcategory = i.subcategory.slug;
      }
      if (Object.keys(lifted).length && i.text !== q) {
        navigate(`/search?${withParams(params, { ...lifted, q: i.text || null, asked })}`, { replace: true });
        return;
      }
      setData(d); setVideos(d.videos);
    }).catch(() => { if (alive) { setData(null); setVideos([]); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [key, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // a fresh query starts without the previous chips
    navigate(`/search?${new URLSearchParams(text.trim() ? { q: text.trim() } : {})}`);
  };
  const loadMore = async () => {
    if (!data?.nextOffset) return;
    setMore(true);
    try {
      const d = await get<SearchResponse>(`/search?${withParams(params, { asked: null, offset: String(data.nextOffset), locale })}`);
      setVideos(v => [...v, ...d.videos.filter(x => !v.some(y => y.id === x.id))]);
      setData(prev => prev ? { ...prev, nextOffset: d.nextOffset } : d);
    } finally { setMore(false); }
  };
  const set = (changes: Record<string, string | null>) => navigate(`/search?${withParams(params, changes)}`, { replace: true });

  const langCodes = (params.get("languages") ?? "").split(",").filter(Boolean);
  const cat = categories.find(c => c.slug === params.get("category") || c.id === params.get("category"));
  const sub = cat?.subcategories.find(s => s.slug === params.get("subcategory") || s.id === params.get("subcategory"));
  const byCode = useMemo(() => new Map(languages.map(l => [l.code, l])), [languages]);

  const applySuggestion = (s: Suggestion) => {
    const words = q.split(/\s+/).filter(Boolean);
    const tokenWords = s.token.toLowerCase().split(/\s+/);
    const rest = words.filter(w => !tokenWords.includes(w.toLowerCase())).join(" ");
    if (s.type === "language") set({ q: rest || null, languages: [...new Set([...langCodes, s.id])].join(",") });
    else if (s.type === "category") set({ q: rest || null, category: s.id, subcategory: null });
    else set({ q: rest || null, category: s.categoryId, subcategory: s.id });
  };

  const hasFilters = langCodes.length > 0 || !!cat;
  const feedQuery = new URLSearchParams({
    ...(cat ? { category: cat.slug } : {}), ...(sub ? { subcategory: sub.slug } : {}), ...(langCodes.length ? { languages: langCodes.join(",") } : {}),
  }).toString();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 md:px-6 md:pt-28">
      <form onSubmit={submit} className="relative max-w-2xl" role="search">
        <Icons.Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input ref={inputRef} value={text} onChange={e => setText(e.target.value)} autoFocus={!q}
          placeholder={hasFilters ? "Add more words…" : "Try “Hindi nursery rhymes” or “bedtime stories”"}
          className="h-12 rounded-full border-2 pl-11 pr-28 text-base" aria-label="Search videos, creators, languages and categories" />
        <Button type="submit" className="grad-btn absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full px-5 text-white">Search</Button>
      </form>

      {/* what we understood + filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {asked && hasFilters && <span className="text-sm text-muted-foreground">Results for “{asked}”:</span>}
        {langCodes.map(code => (
          <span key={code} className="inline-flex items-center gap-1 rounded-full bg-brand-yellow-soft px-3 py-1 text-sm font-semibold">
            <Icons.Languages size={14} /> {byCode.get(code)?.nameNative ?? code}{byCode.get(code) && byCode.get(code)!.nameNative !== byCode.get(code)!.nameEn ? ` · ${byCode.get(code)!.nameEn}` : ""}
            <button aria-label="Remove language filter" onClick={() => set({ languages: langCodes.filter(c => c !== code).join(",") || null })} className="rounded-full p-0.5 hover:bg-black/10"><Icons.X size={13} /></button>
          </span>
        ))}
        {cat && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue-soft px-3 py-1 text-sm font-semibold text-brand-blue">
            {cat.emoji} {cat.name}{sub ? ` › ${sub.name}` : ""}
            <button aria-label="Remove category filter" onClick={() => set({ category: null, subcategory: null })} className="rounded-full p-0.5 hover:bg-black/10"><Icons.X size={13} /></button>
          </span>
        )}
        {sub && (
          <button onClick={() => set({ subcategory: null })} className="rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted">All of {cat?.name}</button>
        )}
        <div className="w-52">
          <LanguageCombobox languages={languages} placeholder="+ Language" exclude={langCodes} className="h-8 rounded-full text-xs"
            onSelect={code => set({ languages: [...langCodes, code].join(",") })} />
        </div>
      </div>

      {data && data.interpretation.suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {data.interpretation.suggestions.map(s => (
            <button key={s.type + s.id} onClick={() => applySuggestion(s)}
              className="rounded-full border border-dashed border-brand-pink/60 px-3 py-1 font-semibold text-brand-pink hover:bg-brand-pink-soft">
              {s.reason}
            </button>
          ))}
        </div>
      )}

      {data && data.creators.length > 0 && (
        <section className="mt-8" aria-label="Creators">
          <h2 className="mb-3 font-display text-lg font-bold">Creators</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {data.creators.map(c => (
              <button key={c.username} onClick={() => navigate(`/c/${c.username}`)}
                className="flex min-w-[220px] items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 hover:ring-brand-pink/40">
                <Avatar src={c.avatarUrl} name={c.channelName} size={44} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 truncate text-sm font-bold">{c.channelName}{c.verified && <Icons.BadgeCheck size={14} className="text-brand-blue" />}</span>
                  <span className="block text-xs text-muted-foreground">@{c.username} · {compact(c.followerCount)} followers</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8" aria-label="Videos">
        {data && <p className="mb-3 text-sm text-muted-foreground">{data.total} video{data.total === 1 ? "" : "s"}</p>}
        {!data && !loading ? (
          <EmptyState icon="Search" title="Search Kuchu Puchu" description="Find videos by title, creator, #hashtag, language or category — in 100+ languages." />
        ) : data && videos.length === 0 && !loading ? (
          <EmptyState icon="SearchX" title="No videos found"
            description={hasFilters ? "Try removing a filter, or another language." : "Try different words, a language name, or a category."}
            action={hasFilters ? { label: "Clear filters", onClick: () => set({ languages: null, category: null, subcategory: null }) } : undefined} />
        ) : (
          <>
            <VideoGrid videos={videos} loading={loading} feedQuery={feedQuery} />
            <LoadMore show={!!data?.nextOffset} busy={more} onClick={loadMore} />
          </>
        )}
      </section>
    </div>
  );
}

export function SavedPage() {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  useEffect(() => {
    get<{ videos: FeedVideo[]; nextOffset: number | null }>("/me/saved")
      .then(d => { setVideos(d.videos); setNext(d.nextOffset); })
      .catch(e => { if (/login/i.test((e as Error).message)) setNeedLogin(true); })
      .finally(() => setLoading(false));
  }, []);
  const loadMore = async () => {
    if (next === null) return;
    setMore(true);
    try {
      const d = await get<{ videos: FeedVideo[]; nextOffset: number | null }>(`/me/saved?offset=${next}`);
      setVideos(v => [...v, ...d.videos]); setNext(d.nextOffset);
    } finally { setMore(false); }
  };
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 md:px-6 md:pt-28">
      <h1 className="font-display text-3xl font-bold">Saved videos</h1>
      <p className="mt-1 text-muted-foreground">Videos you saved to watch again.</p>
      <div className="mt-6">
        {needLogin ? (
          <EmptyState icon="LogIn" title="Log in to see saved videos" description="Save videos from any feed with the ⋯ menu." action={{ label: "Log in", onClick: () => navigate("/login") }} />
        ) : !loading && videos.length === 0 ? (
          <EmptyState icon="Bookmark" title="Nothing saved yet" description="Tap ⋯ → Save on any video and it will appear here." action={{ label: "Watch videos", onClick: () => navigate("/feed") }} />
        ) : (
          <>
            <VideoGrid videos={videos} loading={loading} />
            <LoadMore show={next !== null} busy={more} onClick={loadMore} />
          </>
        )}
      </div>
    </div>
  );
}
