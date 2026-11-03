import { jsonError } from "@/lib/auth";
import { loadTaxonomy, selectable, taxonomyCounts, interfaceLocales } from "@/lib/taxonomy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

// Stable data: let browsers/CDN cache briefly; admin edits invalidate the server cache immediately.
const CACHE = { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" };

export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg, slug] = segs;
  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") || "en").slice(0, 10);

  // GET /api/taxonomy/languages — active languages, display order
  if (seg === "languages") {
    const [t, counts] = await Promise.all([loadTaxonomy("en"), taxonomyCounts()]);
    return Response.json({
      languages: selectable(t).languages.map(l => ({
        id: l.id, code: l.code, nameEn: l.nameEn, nameNative: l.nameNative, script: l.script, direction: l.direction,
        group: l.group, popular: l.popular, priority: l.priority, videoCount: counts.languages.get(l.id) ?? 0,
      })),
    }, { headers: CACHE });
  }

  // GET /api/taxonomy/categories[?locale=hi] and /api/taxonomy/categories/<slug>
  if (seg === "categories") {
    const [t, counts] = await Promise.all([loadTaxonomy(locale), taxonomyCounts()]);
    const cats = selectable(t).categories.map(c => ({
      id: c.id, slug: c.slug, name: c.name, nameEn: c.nameEn, description: c.description, emoji: c.emoji,
      color: c.color, coverImageUrl: c.coverImageUrl, sortOrder: c.sortOrder, videoCount: counts.categories.get(c.id) ?? 0,
      subcategories: c.subcategories.map(s => ({
        id: s.id, slug: s.slug, name: s.name, nameEn: s.nameEn, emoji: s.emoji, sortOrder: s.sortOrder,
        videoCount: counts.subcategories.get(s.id) ?? 0,
      })),
    }));
    if (slug) {
      const one = cats.find(c => c.slug === slug || c.id === slug);
      return one ? Response.json({ locale, category: one }, { headers: CACHE }) : jsonError("Category not found", 404);
    }
    return Response.json({ locale, categories: cats }, { headers: CACHE });
  }

  // GET /api/taxonomy/locales — interface languages the UI can be shown in
  if (seg === "locales") return Response.json({ locales: await interfaceLocales() }, { headers: CACHE });

  return jsonError("Not found", 404);
}
