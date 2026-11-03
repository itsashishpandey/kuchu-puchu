import { getSessionUser, viewerKeyFromRequest, jsonError } from "@/lib/auth";
import { loadTaxonomy, languageCodesFromParam, resolveFilterParams } from "@/lib/taxonomy";
import { searchAll } from "@/lib/search";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// GET /api/search?q=hindi husband wife jokes&languages=&category=&subcategory=&limit=&offset=
// Reads languages / categories / subcategories out of the query text (exact names become filters,
// near-misses become "Did you mean" suggestions) — explicit filter params always win.
export async function GET(req: Request) {
  if (!rateLimit(`search:${clientIp(req)}`, 90)) return jsonError("Too many searches. Please wait a moment.", 429);
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").slice(0, 120);
  const limit = Math.max(1, Math.min(48, parseInt(url.searchParams.get("limit") || "24", 10) || 24));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
  const t = await loadTaxonomy((url.searchParams.get("locale") || "en").slice(0, 10));
  const f = resolveFilterParams(t, url.searchParams.get("category"), url.searchParams.get("subcategory"));
  const me = await getSessionUser();
  const res = await searchAll({
    q,
    explicit: { languages: languageCodesFromParam(t, url.searchParams.get("languages")), categoryId: f.categoryId, subcategoryId: f.subcategoryId },
    limit, offset, userId: me?.id ?? null, guestKey: viewerKeyFromRequest(req), taxonomy: t, log: true,
  });
  return Response.json(res);
}
