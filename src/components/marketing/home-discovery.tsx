"use client";

// Homepage: "Discover Videos in Your Language." + "Something for Every Interest."
// Everything shown comes from the live catalogue (languages, categories, real thumbnails and
// counts) — no invented statistics.
import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { SectionHeading } from "@/components/shared/ui-bits";
import { Link, navigate } from "@/components/app/router";
import { get, type FeedVideo } from "@/lib/client";
import { useLanguages, useCategories } from "@/lib/use-taxonomy";
import { categoryPath } from "@/lib/seo-pages";

function useShowcaseVideos() {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  useEffect(() => {
    get<{ videos: FeedVideo[] }>("/public/videos?feed=explore&limit=48").then(d => setVideos(d.videos)).catch(() => {});
  }, []);
  return videos;
}

export function DiscoverInYourLanguage() {
  const { data: languages = [] } = useLanguages();
  const videos = useShowcaseVideos();
  const chips = useMemo(() => {
    const withVideos = languages.filter(l => l.videoCount > 0);
    const popular = languages.filter(l => l.popular && l.videoCount === 0);
    return [...withVideos, ...popular].slice(0, 18);
  }, [languages]);

  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="discover-lang">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 id="discover-lang" className="font-display text-3xl font-bold leading-tight md:text-5xl">
              Discover Videos in <span className="grad-text">Your Language.</span>
            </h2>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Safe, original short videos for kids aged 3–8 in Hindi, English, Punjabi, Haryanvi, Urdu and
              more: cartoons, rhymes, stories and early learning. Pick the languages your family speaks.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {chips.map(l => (
                <Link key={l.code} to={`/explore?languages=${l.code}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border-2 border-transparent bg-surface px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:border-brand-pink/40">
                  <span dir={l.direction === "RTL" ? "rtl" : undefined}>{l.nameNative}</span>
                  {l.nameNative !== l.nameEn && <span className="text-xs font-normal text-muted-foreground">{l.nameEn}</span>}
                  {l.videoCount > 0 && <span className="rounded-full bg-brand-yellow-soft px-1.5 text-[10px] font-bold">{l.videoCount}</span>}
                </Link>
              ))}
              {languages.length > chips.length && (
                <Link to="/onboarding" className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-brand-blue hover:underline">
                  + {languages.length - chips.length} more <Icons.ArrowRight size={14} />
                </Link>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate("/join")} className="grad-btn rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg">Pick my languages</button>
              <button onClick={() => navigate("/feed")} className="rounded-full border-2 px-6 py-3 text-sm font-bold hover:border-brand-pink/40">Start watching</button>
            </div>
          </div>
          {videos.length === 0 && (
            <img src="/images/hero-wide.webp" alt="Cute cartoon characters celebrating together" className="w-full rounded-3xl object-cover shadow-md" />
          )}
          <div className="grid grid-cols-3 gap-3">
            {videos.slice(0, 6).map((v, i) => {
              const lang = v.languages?.find(l => l.isPrimary) ?? v.languages?.[0];
              return (
                <button key={v.id} onClick={() => navigate(`/feed?v=${v.id}`)}
                  className={`group relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink shadow-md transition hover:-translate-y-1 ${i % 3 === 1 ? "translate-y-6" : ""}`}
                  aria-label={`Play ${v.title}`}>
                  <img src={v.thumbnailUrl ?? ""} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                  {lang && (
                    <span className="absolute left-2 top-2 rounded-md bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold text-ink" dir={lang.direction === "RTL" ? "rtl" : undefined}>
                      {lang.nameNative}
                    </span>
                  )}
                  <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-left text-[11px] font-bold text-white">{v.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SomethingForEveryInterest() {
  const { data: categories = [] } = useCategories();
  const videos = useShowcaseVideos();
  const thumbFor = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of videos) {
      const c = v.tags?.[0]?.category.id;
      if (c && v.thumbnailUrl && !m.has(c)) m.set(c, v.thumbnailUrl);
    }
    return m;
  }, [videos]);
  const featured = useMemo(
    () => [...categories].sort((a, b) => (b.videoCount > 0 ? 1 : 0) - (a.videoCount > 0 ? 1 : 0) || a.sortOrder - b.sortOrder).slice(0, 12),
    [categories],
  );

  return (
    <section className="bg-surface py-16 md:py-24" aria-label="Categories">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          eyebrow={`${categories.length || 15} kids categories`}
          title={<>Something for <span className="grad-text">Every Little Interest.</span></>}
          subtitle="From cartoons and nursery rhymes to stories, animals, science and crafts — tap a category to watch."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {featured.map(c => {
            const img = c.coverImageUrl ?? thumbFor.get(c.id);
            return (
              <Link key={c.id} to={categoryPath(c.slug)}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl p-4 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${c.color ?? "#1677FF"}, ${c.color ?? "#1677FF"}AA 55%, #151923)` }}>
                {img && <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-110" />}
                <span className="absolute right-3 top-2 text-5xl drop-shadow-md transition-transform group-hover:scale-110" aria-hidden>{c.emoji}</span>
                <div className="relative">
                  <p className="font-display text-base font-bold leading-tight drop-shadow">{c.name}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-white/85">{c.subcategories.slice(0, 3).map(s => s.name).join(" · ")}</p>
                  {c.videoCount > 0 && <p className="mt-1 text-[11px] font-semibold text-brand-yellow">{c.videoCount} video{c.videoCount === 1 ? "" : "s"}</p>}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link to="/explore" className="inline-flex items-center gap-1.5 rounded-full border-2 bg-white px-6 py-3 text-sm font-bold hover:border-brand-pink/40">
            See all categories <Icons.ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
