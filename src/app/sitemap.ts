import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL, STATIC_PAGES, CATEGORY_SEO, LANGUAGE_SEO } from "@/lib/seo-pages";
import { loadTaxonomy, selectable, taxonomyCounts } from "@/lib/taxonomy";
import { BLOG_POSTS } from "@/lib/blog-posts";

// Only real addresses (search engines ignore everything after "#"): the homepage, the pages in
// seo-pages.ts, category pages that have approved videos (empty ones are noindex until then) and
// approved channel pages (/c/<username>).
export const dynamic = "force-dynamic";

const PRIORITY: Record<string, number> = { "/explore": 0.8, "/blog": 0.7, "/trending": 0.7, "/about": 0.6, "/contact": 0.4 };

/** dbSlugs of category pages (and "lang-<code>" language pages) that have approved videos. */
async function categoriesWithVideos(): Promise<Set<string>> {
  try {
    const [t, counts] = await Promise.all([loadTaxonomy("en"), taxonomyCounts()]);
    return new Set([
      ...selectable(t).categories.filter(c => (counts.categories.get(c.id) ?? 0) > 0).map(c => c.slug),
      ...t.languages.filter(l => (counts.languages.get(l.id) ?? 0) > 0).map(l => `lang-${l.code}`),
    ]);
  } catch {
    return new Set();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [withVideos, channels] = await Promise.all([
    categoriesWithVideos(),
    db.channel.findMany({
      // approved channels with at least one approved video (an empty channel page is noindex)
      where: { user: { status: "APPROVED", videos: { some: { status: "APPROVED" } } } },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }).catch(() => []),
  ]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...CATEGORY_SEO.filter(c => withVideos.has(c.dbSlug) || c.alwaysIndex).map(c => ({
      url: `${SITE_URL}${c.path}`, changeFrequency: "daily" as const, priority: 0.9,
    })),
    ...LANGUAGE_SEO.filter(c => withVideos.has(c.dbSlug)).map(c => ({
      url: `${SITE_URL}${c.path}`, changeFrequency: "daily" as const, priority: 0.8,
    })),
    ...STATIC_PAGES.map(p => ({
      url: `${SITE_URL}${p.path}`,
      changeFrequency: (p.policy ? "monthly" : "weekly") as "monthly" | "weekly",
      priority: PRIORITY[p.path] ?? 0.3,
    })),
    ...BLOG_POSTS.map(p => ({
      url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(`${p.updated}T00:00:00Z`),
      changeFrequency: "monthly" as const, priority: 0.8,
    })),
    { url: `${SITE_URL}/account-deletion`, changeFrequency: "yearly", priority: 0.2 },
    ...channels.map(c => ({
      url: `${SITE_URL}/c/${c.username.toLowerCase()}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
