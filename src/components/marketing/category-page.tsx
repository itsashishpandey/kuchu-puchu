"use client";

// A category landing page (mykuchupuchu.com/nursery-rhymes, /cartoons-for-kids…): written text from
// category-pages.ts, live videos and topics from the database. On the first load the server passes
// the data (so it's in the HTML for search engines); after an in-site click the page fetches it.
import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Link, navigate, useReveal } from "@/components/app/router";
import { usePageData, type CategoryInfo } from "@/components/app/page-data";
import { AppButtons, AppCtaBand } from "@/components/shared/app-buttons";
import { VideoGrid } from "@/components/discovery/video-grid";
import { FaqList, TRUST } from "./home-parents";
import { get, type FeedPage, type FeedVideo } from "@/lib/client";
import { useCategories } from "@/lib/use-taxonomy";
import { CATEGORY_SEO, categorySeoBySlug } from "@/lib/seo-pages";
import { categoryContent } from "@/lib/category-pages";

export function CategoryPage({ dbSlug }: { dbSlug: string }) {
  const setRef = useReveal<HTMLDivElement>();
  const seo = categorySeoBySlug(dbSlug)!;
  const content = categoryContent(dbSlug)!;
  const server = usePageData();
  const fromServer = server?.kind === "category" && server.dbSlug === dbSlug ? server : null;

  const [videos, setVideos] = useState<FeedVideo[]>(fromServer?.videos ?? []);
  const [loaded, setLoaded] = useState(!!fromServer);
  useEffect(() => {
    if (fromServer) return;
    get<FeedPage>(`/public/videos?feed=explore&category=${encodeURIComponent(dbSlug)}&limit=24`)
      .then(d => setVideos(d.videos)).catch(() => {}).finally(() => setLoaded(true));
  }, [dbSlug, fromServer]);

  const { data: categories = [] } = useCategories("en");
  const category: CategoryInfo | null = useMemo(() => {
    if (fromServer?.category) return fromServer.category;
    const c = categories.find(x => x.slug === dbSlug);
    return c ? { id: c.id, name: c.name, slug: c.slug, description: c.description, emoji: c.emoji, color: c.color, videoCount: c.videoCount, subcategories: c.subcategories } : null;
  }, [fromServer, categories, dbSlug]);

  const related = content.related.map(s => categorySeoBySlug(s)).filter(Boolean) as typeof CATEGORY_SEO;
  const others = CATEGORY_SEO.filter(c => c.dbSlug !== dbSlug);
  const color = category?.color ?? "#1677FF";

  return (
    <div ref={setRef}>
      {/* ── Hero + app CTA 1 ── */}
      <section className="relative overflow-hidden mesh-bg pt-24 md:pt-28" aria-labelledby="category-title">
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pb-20">
          <div>
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink/60">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link to="/" className="font-semibold hover:text-brand-blue">Home</Link></li>
                <li aria-hidden><Icons.ChevronRight size={14} /></li>
                <li aria-current="page" className="font-semibold text-ink">{seo.label}</li>
              </ol>
            </nav>
            <div className="mb-5 flex flex-wrap gap-2">
              {["Made for kids aged 3–8", "Free", "No ads"].map(b => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                  <Icons.Check size={12} /> {b}
                </span>
              ))}
            </div>
            <h1 id="category-title" className="font-display text-[2.3rem] font-extrabold leading-[1.08] text-ink md:text-6xl">{content.h1}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/70 md:text-lg">{content.intro}</p>
            <AppButtons className="mt-7" />
            <button onClick={() => videos[0] ? navigate(`/feed?v=${videos[0].id}&category=${dbSlug}`) : navigate(`/explore?category=${dbSlug}`)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue hover:underline">
              <Icons.Play size={15} fill="currentColor" /> Or watch free on the website
            </button>
          </div>
          <div className="relative mx-auto hidden w-full max-w-sm lg:block" aria-hidden>
            <div className="grid grid-cols-2 gap-3">
              {(videos.length ? videos.slice(0, 4) : [null, null, null, null]).map((v, i) => (
                <div key={v?.id ?? i} className={`relative aspect-[9/16] overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/50 ${i % 2 ? "translate-y-6" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}99 60%, #151923)` }}>
                  {v?.thumbnailUrl
                    ? <img src={v.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    : <span className="absolute inset-0 flex items-center justify-center text-6xl">{seo.emoji}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Videos ── */}
      <section className="bg-white py-14 md:py-20" aria-labelledby="category-videos">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="category-videos" className="font-display text-3xl font-bold text-ink md:text-[2.4rem]">{content.videosHeading}</h2>
              {category?.description && <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>}
            </div>
            {videos.length > 0 && (
              <Link to={`/explore?category=${dbSlug}`} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-brand-blue/40 hover:text-brand-blue">
                Filter by language <Icons.ArrowRight size={15} />
              </Link>
            )}
          </div>
          {videos.length > 0 ? (
            <VideoGrid videos={videos} feedQuery={`category=${dbSlug}`} />
          ) : !loaded ? (
            <VideoGrid videos={[]} loading skeletons={8} />
          ) : (
            <div className="reveal rounded-3xl bg-surface p-8 text-center md:p-12">
              <span className="text-5xl" aria-hidden>{seo.emoji}</span>
              <h3 className="mt-3 font-display text-xl font-bold text-ink">New {seo.label} videos are coming soon</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Our creators are making them now. Until then, kids can enjoy these:
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {related.map(r => (
                  <Link key={r.dbSlug} to={r.path} className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-black/5 hover:text-brand-blue">
                    {r.emoji} {r.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Topics ── */}
      {category && category.subcategories.length > 0 && (
        <section className="bg-surface py-14 md:py-16" aria-labelledby="category-topics">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <h2 id="category-topics" className="reveal font-display text-2xl font-bold text-ink md:text-3xl">{content.topicsHeading}</h2>
            <p className="reveal mx-auto mt-3 max-w-2xl text-muted-foreground">{content.topicsText}</p>
            <ul className="reveal mt-7 flex flex-wrap justify-center gap-2">
              {category.subcategories.map(s => (
                <li key={s.id}>
                  <Link to={`/explore?category=${dbSlug}&sub=${s.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:text-brand-blue">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── What kids learn ── */}
      <section className="bg-white py-14 md:py-20" aria-labelledby="category-learn">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 id="category-learn" className="reveal mx-auto mb-10 max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink md:text-[2.4rem]">
            {content.learnHeading}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
            {content.learn.map((l, i) => (
              <li key={l.title} className="reveal bento p-5">
                <span className="grad-btn inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-display text-base font-bold text-ink">{l.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{l.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── App CTA 2 ── */}
      <AppCtaBand heading={content.ctaHeading} text={content.ctaText} />

      {/* ── Why parents trust it ── */}
      <section className="bg-white py-14 md:py-20" aria-labelledby="category-trust">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 id="category-trust" className="reveal mx-auto mb-10 max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink md:text-[2.4rem]">
            Safe {seo.label} Videos Parents Can Trust
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map(t => (
              <li key={t.title} className="reveal bento flex gap-3 p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-soft">
                  <t.icon size={18} className="text-brand-blue" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{t.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Tips for parents ── */}
      <section className="bg-surface py-14 md:py-20" aria-labelledby="category-tips">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 id="category-tips" className="reveal mx-auto mb-10 max-w-3xl text-center font-display text-3xl font-bold leading-tight text-ink md:text-[2.4rem]">
            {content.tipsHeading}
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {content.tips.map(t => (
              <li key={t.title} className="reveal bento p-6">
                <Icons.Lightbulb size={22} className="text-brand-yellow" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold text-ink">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-14 md:py-20" aria-labelledby="category-faq">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 id="category-faq" className="reveal mb-8 text-center font-display text-3xl font-bold leading-tight text-ink md:text-[2.4rem]">
            {seo.label}: Questions Parents Ask
          </h2>
          <FaqList items={content.faqs} />
        </div>
      </section>

      {/* ── More categories (real links) ── */}
      <section className="bg-surface py-14 md:py-16" aria-labelledby="category-more">
        <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
          <h2 id="category-more" className="reveal font-display text-2xl font-bold text-ink md:text-3xl">More Kuchu Puchu Videos for Kids</h2>
          <ul className="reveal mt-7 flex flex-wrap justify-center gap-2">
            {[...related, ...others.filter(o => !related.includes(o))].map(c => (
              <li key={c.dbSlug}>
                <Link to={c.path} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:text-brand-blue">
                  <span aria-hidden>{c.emoji}</span> {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── App CTA 3 ── */}
      <AppCtaBand tone="dark" heading="Download the Kuchu Puchu App"
        text={`${seo.label} and many more funny learning videos for kids aged 3–8. Free, with no ads and no sign-up.`} />
    </div>
  );
}
