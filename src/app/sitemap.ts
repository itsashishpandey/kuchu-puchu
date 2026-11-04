import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL, STATIC_PAGES, CATEGORY_SEO } from "@/lib/seo-pages";
import { loadTaxonomy, selectable, taxonomyCounts } from "@/lib/taxonomy";

// Only real addresses (search engines ignore everything after "#"): the homepage, the pages in
// seo-pages.ts, category pages that have approved videos (empty ones are noindex until then) and
// approved channel pages (/c/<username>).
export const dynamic = "force-dynamic";

const PRIORITY: Record<string, number> = { "/explore": 0.8, "/trending": 0.7, "/about": 0.6, "/contact": 0.4 };

async function categoriesWithVideos(): Promise<Set<string>> {
  try {
    const [t, counts] = await Promise.all([loadTaxonomy("en"), taxonomyCounts()]);
    return new Set(selectable(t).categories.filter(c => (counts.categories.get(c.id) ?? 0) > 0).map(c => c.slug));
  } catch {
    return new Set();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [withVideos, channels] = await Promise.all([
    categoriesWithVideos(),
    db.channel.findMany({
      where: { user: { status: "APPROVED" } },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }).catch(() => []),
  ]);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...CATEGORY_SEO.filter(c => withVideos.has(c.dbSlug)).map(c => ({
      url: `${SITE_URL}${c.path}`, changeFrequency: "daily" as const, priority: 0.9,
    })),
    ...STATIC_PAGES.map(p => ({
      url: `${SITE_URL}${p.path}`,
      changeFrequency: (p.policy ? "monthly" : "weekly") as "monthly" | "weekly",
      priority: PRIORITY[p.path] ?? 0.3,
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
