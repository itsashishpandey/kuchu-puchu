// Server only: a category page's live data (the category, its topics and newest videos), read
// with the same code as GET /api/public/videos so the page and the API always agree.
import { cache } from "react";
import { loadTaxonomy, selectable, taxonomyCounts, resolveFilterParams } from "@/lib/taxonomy";
import { listFeed } from "@/lib/feed";
import type { FeedVideo } from "@/lib/client";
import type { PageData } from "@/components/app/page-data";

export const CATEGORY_PAGE_VIDEOS = 24;

/** Cached per request, so the page and its metadata share one database read. */
export const loadCategoryPageData = cache(async (dbSlug: string): Promise<PageData> => {
  const empty: PageData = { kind: "category", dbSlug, category: null, videos: [] };
  try {
    const [t, counts] = await Promise.all([loadTaxonomy("en"), taxonomyCounts()]);
    // language pages ("lang-hi"): every video in that language, shown like a category without topics
    if (dbSlug.startsWith("lang-")) {
      const lang = t.languages.find(l => l.active && l.code === dbSlug.slice(5));
      if (!lang) return empty;
      const res = await listFeed({
        feed: "explore", filters: { languages: [lang.code], categoryId: null, subcategoryId: null },
        limit: CATEGORY_PAGE_VIDEOS, offset: 0, userId: null, guestKey: "", taxonomy: t,
      });
      const videos = "error" in res ? [] : (JSON.parse(JSON.stringify(res.videos)) as FeedVideo[]);
      return {
        kind: "category", dbSlug, videos,
        category: {
          id: lang.id, name: lang.nameEn, slug: lang.code, description: null, emoji: null, color: null,
          videoCount: counts.languages.get(lang.id) ?? 0, subcategories: [],
        },
      };
    }
    const c = selectable(t).categories.find(x => x.slug === dbSlug);
    if (!c) return empty;
    const f = resolveFilterParams(t, dbSlug, null);
    const res = await listFeed({
      feed: "explore", filters: { languages: [], categoryId: f.categoryId, subcategoryId: null },
      limit: CATEGORY_PAGE_VIDEOS, offset: 0, userId: null, guestKey: "", taxonomy: t,
    });
    // the same JSON shape the browser gets from the API (dates as strings)
    const videos = "error" in res ? [] : (JSON.parse(JSON.stringify(res.videos)) as FeedVideo[]);
    return {
      kind: "category", dbSlug, videos,
      category: {
        id: c.id, name: c.name, slug: c.slug, description: c.description, emoji: c.emoji, color: c.color,
        videoCount: counts.categories.get(c.id) ?? 0,
        subcategories: c.subcategories.map(s => ({ id: s.id, name: s.name, slug: s.slug })),
      },
    };
  } catch {
    return empty;
  }
});
