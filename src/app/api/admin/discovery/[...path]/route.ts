// Admin → "Content Discovery & Personalization": Languages, Main Categories, Subcategories,
// Video Tag Review, User Interest Analytics, Recommendation Settings, Content Discovery Reports.
// Every change is written to the TaxonomyAuditLog (before/after snapshots).
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getSessionUser, jsonError } from "@/lib/auth";
import { loadTaxonomy, invalidateTaxonomy, interfaceLocales, clearTaxonomyCounts } from "@/lib/taxonomy";
import { invalidateRecoConfig, clearAllRankedCache, previewRanking } from "@/lib/feed";
import { normalizeRecoSettings, RECO_DEFAULTS, RECO_LIMITS } from "@/lib/discovery/reco-config";
import { parseTagInput, firstError, writeVideoTags, validateVideoTags } from "@/lib/video-tags";
import { tagLabels, safeJsonArray } from "@/lib/video-dto";
import { listParam } from "@/lib/channel-prefs";
import { notify } from "@/lib/platform";
import {
  taxAudit, mergeCategory, mergeSubcategory, languageStats, categoryStats, interestAnalytics, discoveryReports, slugify,
} from "@/lib/discovery-admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };
type Body = Record<string, any>;

// SUPER_ADMIN everything; MODERATOR manages taxonomy + tag review; FINANCE reads analytics only.
const ALL = ["SUPER_ADMIN", "MODERATOR", "FINANCE"];
const MOD = ["SUPER_ADMIN", "MODERATOR"];
const SUPER = ["SUPER_ADMIN"];
const READ: Record<string, string[]> = {
  summary: ALL, interests: ALL, reports: ALL,
  languages: MOD, categories: MOD, subcategories: MOD, translations: MOD, locales: MOD, tags: MOD, audit: MOD,
  recommendation: SUPER,
};
const WRITE: Record<string, string[]> = {
  languages: MOD, categories: MOD, subcategories: MOD, translations: MOD, tags: MOD,
  locales: SUPER, recommendation: SUPER,
};

async function requireDiscovery(section: string, write: boolean) {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") return { error: jsonError("Admin access required", 403) } as const;
  const allowed = (write ? WRITE : READ)[section] ?? [];
  if (!allowed.includes(me.adminRole ?? "MODERATOR")) return { error: jsonError("Your admin role does not permit this action", 403) } as const;
  return { me, actor: { id: me.id, email: me.email } } as const;
}

// ── small input helpers ──
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
const optStr = (v: unknown, max = 500) => str(v, max) || null;
const bool = (v: unknown) => v === true || v === "true" || v === 1;
const HEX = /^#[0-9a-fA-F]{6}$/;
const emojiOf = (v: unknown) => str(v, 16) || null;
const urlOf = (v: unknown) => {
  const s = str(v, 400);
  return s && (/^\/uploads\/[\w./-]+$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s)) ? s : null;
};
const keywordList = (v: unknown) =>
  [...new Set(listParam(v).map(x => String(x).trim().toLowerCase()).filter(x => x.length >= 2 && x.length <= 40))].slice(0, 40);
const intIn = (v: unknown, lo: number, hi: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null;
};
const parseJson = (s: string | null | undefined) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const pick = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.map(k => [k, o[k]]));
const PAGE = 30;

// ═════════════════════════════════════════ GET ═════════════════════════════════════════
export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg = "summary", id] = segs;
  const r = await requireDiscovery(seg, false);
  if ("error" in r) return r.error;
  const url = new URL(req.url);
  const t = await loadTaxonomy("en");

  // badges for the admin menu
  if (seg === "summary") {
    const [needsReview, flagged] = await Promise.all([
      db.video.count({ where: { tagStatus: "NEEDS_REVIEW" } }),
      db.video.count({ where: { tagStatus: "FLAGGED" } }),
    ]);
    return Response.json({
      needsReview, flagged,
      languages: t.languages.filter(l => l.active).length,
      categories: t.categories.filter(c => c.active && !c.retired).length,
      subcategories: t.categories.flatMap(c => c.subcategories).filter(s => s.active && !s.retired).length,
    });
  }

  // Languages: Language / Code / Status / Videos / Viewers / Total Views / Actions
  if (seg === "languages") {
    const [rows, s] = await Promise.all([db.language.findMany({ orderBy: [{ priority: "asc" }, { nameEn: "asc" }] }), languageStats()]);
    const q = str(url.searchParams.get("q"), 60).toLowerCase();
    const status = url.searchParams.get("status") || "all";
    const list = rows
      .filter(l => (status === "active" ? l.active : status === "inactive" ? !l.active : true))
      .filter(l => !q || l.code.toLowerCase().includes(q) || l.nameEn.toLowerCase().includes(q) || l.nameNative.toLowerCase().includes(q))
      .map(l => ({
        ...l, videos: s.videos.get(l.id) ?? 0, viewers: s.viewers.get(l.id) ?? 0,
        views: s.views.get(l.id)?.views ?? 0, qualifiedViews: s.views.get(l.id)?.qualifiedViews ?? 0,
      }));
    return Response.json({ languages: list, total: rows.length, active: rows.filter(l => l.active).length, attribution: "Views are counted once, under each video's primary language." });
  }

  // Main categories (list, or one with subcategories + performance by language)
  if (seg === "categories") {
    const [rows, s, trans] = await Promise.all([
      db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } } }),
      categoryStats(),
      db.categoryTranslation.findMany(),
    ]);
    const tr = new Map<string, Record<string, string>>();
    for (const x of trans) {
      const k = x.categoryId ?? x.subcategoryId!;
      tr.set(k, { ...(tr.get(k) ?? {}), [x.locale]: x.name });
    }
    const allSubs = rows.flatMap(c => c.subcategories.map(sx => ({ ...sx, categoryName: c.name })));
    const mergedName = (mid: string | null, sub = false) => {
      if (!mid) return null;
      if (sub || mid.startsWith("sub:")) {
        const x = allSubs.find(a => a.id === mid.replace(/^sub:/, ""));
        return x ? `${x.categoryName} › ${x.name}` : null;
      }
      return rows.find(c => c.id === mid)?.name ?? null;
    };
    const shape = (c: (typeof rows)[number]) => ({
      id: c.id, slug: c.slug, name: c.name, icon: c.icon, emoji: c.emoji, color: c.color, coverImageUrl: c.coverImageUrl,
      description: c.description, keywords: safeJsonArray(c.keywords), sortOrder: c.sortOrder, active: c.active,
      retired: !!c.retiredAt, retiredAt: c.retiredAt, mergedIntoId: c.mergedIntoId, mergedIntoName: mergedName(c.mergedIntoId),
      translations: tr.get(c.id) ?? {},
      subcategoryCount: c.subcategories.filter(x => x.active && !x.retiredAt).length, totalSubcategories: c.subcategories.length,
      videos: s.catTagged.get(c.id) ?? 0, primaryVideos: s.catPrimary.get(c.id)?.videos ?? 0,
      views: s.catPrimary.get(c.id)?.views ?? 0, qualifiedViews: s.catPrimary.get(c.id)?.qualifiedViews ?? 0,
      interestedViewers: s.catUsers.get(c.id) ?? 0, allSubcategoriesViewers: s.catAllSubs.get(c.id) ?? 0,
    });
    if (id) {
      const c = rows.find(x => x.id === id || x.slug === id);
      if (!c) return jsonError("Category not found", 404);
      const prim = await db.videoCategoryAssignment.findMany({
        where: { categoryId: c.id, priority: 1, video: { status: "APPROVED" } },
        select: { video: { select: { views: true, qualifiedViews: true, likes: true, languages: { where: { isPrimary: true }, select: { language: { select: { code: true, nameEn: true } } } } } } },
      });
      const byLang = new Map<string, { code: string; name: string; videos: number; views: number; qualifiedViews: number; likes: number }>();
      for (const p of prim) {
        const l = p.video.languages[0]?.language;
        const k = l?.code ?? "?";
        const row = byLang.get(k) ?? { code: k, name: l?.nameEn ?? "Unknown", videos: 0, views: 0, qualifiedViews: 0, likes: 0 };
        row.videos++; row.views += p.video.views; row.qualifiedViews += p.video.qualifiedViews; row.likes += p.video.likes;
        byLang.set(k, row);
      }
      return Response.json({
        category: {
          ...shape(c),
          subcategories: c.subcategories.map(x => ({
            id: x.id, slug: x.slug, name: x.name, emoji: x.emoji, description: x.description, keywords: safeJsonArray(x.keywords),
            sortOrder: x.sortOrder, active: x.active, retired: !!x.retiredAt, mergedIntoId: x.mergedIntoId,
            mergedIntoName: mergedName(x.mergedIntoId, true), translations: tr.get(x.id) ?? {},
            videos: s.subTagged.get(x.id) ?? 0, primaryVideos: s.subPrimary.get(x.id)?.videos ?? 0,
            views: s.subPrimary.get(x.id)?.views ?? 0, interestedViewers: s.subUsers.get(x.id) ?? 0,
          })),
          performanceByLanguage: [...byLang.values()].sort((a, b) => b.views - a.views),
        },
      });
    }
    return Response.json({ categories: rows.map(shape) });
  }

  // Subcategories: ?categoryId= (with stats) — or every subcategory (for merge pickers)
  if (seg === "subcategories") {
    const categoryId = url.searchParams.get("categoryId");
    const s = await categoryStats();
    const list = t.categories
      .filter(c => !categoryId || c.id === categoryId)
      .flatMap(c => c.subcategories.map(x => ({
        id: x.id, slug: x.slug, name: x.name, emoji: x.emoji, categoryId: c.id, categoryName: c.name, sortOrder: x.sortOrder,
        active: x.active, retired: x.retired, keywords: x.keywords,
        videos: s.subTagged.get(x.id) ?? 0, views: s.subPrimary.get(x.id)?.views ?? 0, interestedViewers: s.subUsers.get(x.id) ?? 0,
      })));
    return Response.json({ subcategories: list });
  }

  // Localized names for one interface locale
  if (seg === "translations") {
    const locale = str(url.searchParams.get("locale") || "hi", 10);
    const rows = await db.categoryTranslation.findMany({ where: { locale } });
    const byCat = new Map(rows.filter(x => x.categoryId).map(x => [x.categoryId!, x]));
    const bySub = new Map(rows.filter(x => x.subcategoryId).map(x => [x.subcategoryId!, x]));
    return Response.json({
      locale, locales: await interfaceLocales(),
      translated: { categories: byCat.size, subcategories: bySub.size },
      categories: t.categories.filter(c => !c.retired).map(c => ({
        id: c.id, nameEn: c.nameEn, emoji: c.emoji, name: byCat.get(c.id)?.name ?? null, description: byCat.get(c.id)?.description ?? null,
        subcategories: c.subcategories.filter(x => !x.retired).map(x => ({ id: x.id, nameEn: x.nameEn, name: bySub.get(x.id)?.name ?? null })),
      })),
    });
  }

  if (seg === "locales") return Response.json({ locales: await interfaceLocales() });

  // Video Tag Review queue
  if (seg === "tags") {
    const status = (url.searchParams.get("status") || "NEEDS_REVIEW").toUpperCase();
    const q = str(url.searchParams.get("q"), 80);
    const lang = url.searchParams.get("language");
    const cat = url.searchParams.get("categoryId");
    const page = intIn(url.searchParams.get("page") || 1, 1, 10_000) ?? 1;
    const where: Prisma.VideoWhereInput = {};
    if (status !== "ALL") where.tagStatus = status;
    const and: Prisma.VideoWhereInput[] = [];
    if (q) and.push({ OR: [{ title: { contains: q } }, { contentId: { contains: q.toUpperCase() } }] });
    if (lang) and.push({ languages: { some: { language: { code: lang } } } });
    if (cat) and.push({ tags: { some: { categoryId: cat } } });
    if (and.length) where.AND = and;
    const [total, rows, counts] = await Promise.all([
      db.video.count({ where }),
      db.video.findMany({
        where, orderBy: [{ createdAt: "desc" }], take: PAGE, skip: (page - 1) * PAGE,
        include: {
          creator: { select: { name: true, channel: { select: { name: true, username: true } } } },
          languages: { orderBy: { position: "asc" }, include: { language: { select: { code: true, nameEn: true, nameNative: true } } } },
          tags: { orderBy: { priority: "asc" } },
        },
      }),
      db.video.groupBy({ by: ["tagStatus"], _count: { _all: true } }),
    ]);
    return Response.json({
      total, page, pageSize: PAGE,
      counts: Object.fromEntries(counts.map(c => [c.tagStatus, c._count._all])),
      videos: rows.map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, description: v.description, hashtags: safeJsonArray(v.hashtags),
        thumbnailUrl: v.thumbnailUrl, videoUrl: v.videoUrl, status: v.status, createdAt: v.createdAt, publishedAt: v.publishedAt, views: v.views,
        creator: { name: v.creator.name, channelName: v.creator.channel?.name ?? v.creator.name, username: v.creator.channel?.username ?? "" },
        languages: v.languages.map(l => ({ code: l.language.code, nameEn: l.language.nameEn, nameNative: l.language.nameNative, isPrimary: l.isPrimary, source: l.source })),
        tags: tagLabels(t, v.tags).map((x, i) => ({ ...x, source: v.tags[i]?.source ?? "CREATOR" })),
        tagStatus: v.tagStatus, tagFlagReason: v.tagFlagReason, tagsUpdatedAt: v.tagsUpdatedAt,
        suggestions: parseJson(v.tagSuggestions),
      })),
    });
  }

  if (seg === "interests") return Response.json(await interestAnalytics(t));

  if (seg === "reports") {
    const days = intIn(url.searchParams.get("days") || 30, 1, 365) ?? 30;
    return Response.json(await discoveryReports(t, days));
  }

  if (seg === "recommendation") {
    const rows = await db.recommendationConfig.findMany({ orderBy: { version: "desc" }, take: 40 });
    const shape = (x: (typeof rows)[number]) => ({
      version: x.version, label: x.label, status: x.status, experimentPercent: x.experimentPercent, notes: x.notes,
      createdByEmail: x.createdByEmail, createdAt: x.createdAt, settings: normalizeRecoSettings(parseJson(x.settings)).settings,
    });
    const active = rows.find(x => x.status === "ACTIVE");
    const exp = rows.find(x => x.status === "EXPERIMENT");
    return Response.json({
      active: active ? shape(active) : { version: 0, label: "Built-in defaults", status: "ACTIVE", experimentPercent: 0, notes: null, createdByEmail: null, createdAt: null, settings: RECO_DEFAULTS },
      experiment: exp ? shape(exp) : null,
      history: rows.map(shape), limits: RECO_LIMITS, defaults: RECO_DEFAULTS,
      principles: [
        "Language is an eligibility rule: viewers only see their languages unless they turn on discovery.",
        "Payments never influence ranking — no boost for videos that earn more.",
        "Weights are kept within safe limits; personal relevance (subcategory + category) stays the largest signal.",
      ],
    });
  }

  if (seg === "audit") {
    const page = intIn(url.searchParams.get("page") || 1, 1, 10_000) ?? 1;
    const entityType = url.searchParams.get("entityType") || undefined;
    const entityId = url.searchParams.get("entityId") || undefined;
    const where: Prisma.TaxonomyAuditLogWhereInput = { ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) };
    const [total, rows] = await Promise.all([
      db.taxonomyAuditLog.count({ where }),
      db.taxonomyAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, skip: (page - 1) * 50 }),
    ]);
    return Response.json({ total, page, pageSize: 50, entries: rows.map(x => ({ ...x, before: parseJson(x.before), after: parseJson(x.after) })) });
  }

  return jsonError("Not found", 404);
}

// ═════════════════════════════════════════ POST ════════════════════════════════════════
export async function POST(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg = "", id, action] = segs;
  const isPreview = seg === "recommendation" && id === "preview";
  const r = await requireDiscovery(seg, !isPreview);
  if ("error" in r) return r.error;
  const actor = r.actor;

  // cover image upload (multipart "cover")
  if (seg === "categories" && id && action === "cover") {
    const form = await req.formData().catch(() => null);
    const file = form?.get("cover");
    if (!file || !(file instanceof File) || file.size === 0) return jsonError("Choose an image");
    if (file.size > 3 * 1024 * 1024) return jsonError("Cover image must be under 3MB");
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return jsonError("Cover image must be PNG, JPG or WebP");
    const cat = await db.category.findUnique({ where: { id } });
    if (!cat) return jsonError("Category not found", 404);
    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const dir = path.join(process.cwd(), "public", "uploads", "covers");
    await mkdir(dir, { recursive: true });
    const fname = `${cat.slug}-${randomBytes(4).toString("hex")}.${ext}`;
    await writeFile(path.join(dir, fname), Buffer.from(await file.arrayBuffer()));
    const coverImageUrl = `/uploads/covers/${fname}`;
    await db.category.update({ where: { id }, data: { coverImageUrl } });
    await taxAudit(db, actor, "CATEGORY_COVER_SET", "CATEGORY", id, { coverImageUrl: cat.coverImageUrl }, { coverImageUrl });
    invalidateTaxonomy();
    return Response.json({ ok: true, coverImageUrl, message: "Cover updated" });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const t = await loadTaxonomy("en");

  // ── languages: create ──
  if (seg === "languages" && !id) {
    const code = str(body.code, 20);
    if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code)) return jsonError('Code must be a BCP 47 tag, e.g. "hi", "pnb" or "zh-Hans"');
    if (await db.language.findUnique({ where: { code } })) return jsonError("A language with this code already exists");
    const iso6393 = str(body.iso6393, 3).toLowerCase();
    if (!/^[a-z]{3}$/.test(iso6393)) return jsonError("ISO 639-3 code must be 3 letters");
    const iso6391 = str(body.iso6391, 2).toLowerCase() || null;
    if (iso6391 && !/^[a-z]{2}$/.test(iso6391)) return jsonError("ISO 639-1 code must be 2 letters");
    const nameEn = str(body.nameEn, 60);
    if (nameEn.length < 2) return jsonError("English name is required");
    const script = str(body.script, 4) || "Latn";
    if (!/^[A-Z][a-z]{3}$/.test(script)) return jsonError("Script must be an ISO 15924 code, e.g. Latn or Deva");
    const max = await db.language.aggregate({ _max: { priority: true } });
    const lang = await db.language.create({
      data: {
        code, iso6391, iso6393, nameEn, nameNative: str(body.nameNative, 60) || nameEn, script,
        direction: body.direction === "RTL" ? "RTL" : "LTR", region: optStr(body.region, 80),
        group: body.group === "INDIAN" ? "INDIAN" : "INTERNATIONAL", popular: bool(body.popular),
        priority: intIn(body.priority, 1, 10_000) ?? (max._max.priority ?? 100) + 1,
        active: body.active === undefined ? true : bool(body.active),
      },
    });
    await taxAudit(db, actor, "LANGUAGE_CREATED", "LANGUAGE", lang.id, undefined, lang);
    invalidateTaxonomy();
    return Response.json({ ok: true, language: lang, message: `${nameEn} added` }, { status: 201 });
  }

  // ── categories / subcategories: reorder ──
  if ((seg === "categories" || seg === "subcategories") && id === "reorder") {
    const ids = listParam(body.ids).map(String).slice(0, 600);
    if (!ids.length) return jsonError("Nothing to reorder");
    if (seg === "categories") {
      if ((await db.category.count({ where: { id: { in: ids } } })) !== ids.length) return jsonError("Unknown category in the list");
      await db.$transaction(ids.map((x, i) => db.category.update({ where: { id: x }, data: { sortOrder: (i + 1) * 10 } })));
    } else {
      const subs = await db.subcategory.findMany({ where: { id: { in: ids } }, select: { categoryId: true } });
      if (subs.length !== ids.length || new Set(subs.map(x => x.categoryId)).size !== 1) return jsonError("Reorder subcategories one category at a time");
      await db.$transaction(ids.map((x, i) => db.subcategory.update({ where: { id: x }, data: { sortOrder: (i + 1) * 10 } })));
    }
    await taxAudit(db, actor, seg === "categories" ? "CATEGORIES_REORDERED" : "SUBCATEGORIES_REORDERED", seg === "categories" ? "CATEGORY" : "SUBCATEGORY", null, undefined, { order: ids });
    invalidateTaxonomy();
    return Response.json({ ok: true, message: "Order saved" });
  }

  // ── categories: create ──
  if (seg === "categories" && !id) {
    const name = str(body.name, 60);
    if (name.length < 2) return jsonError("Category name is required");
    const slug = slugify(str(body.slug, 60) || name);
    if (!slug) return jsonError("Use letters or numbers in the name");
    if (await db.category.findFirst({ where: { OR: [{ name }, { slug }] } })) return jsonError("A category with this name or slug already exists");
    const color = str(body.color, 7);
    if (color && !HEX.test(color)) return jsonError("Colour must be a hex value like #FF4E9B");
    const max = await db.category.aggregate({ _max: { sortOrder: true }, where: { retiredAt: null } });
    const cat = await db.category.create({
      data: {
        name, slug, emoji: emojiOf(body.emoji), color: color || null, icon: optStr(body.icon, 40),
        description: optStr(body.description, 300), coverImageUrl: urlOf(body.coverImageUrl),
        keywords: JSON.stringify(keywordList(body.keywords)), sortOrder: (max._max.sortOrder ?? 0) + 10, active: true,
      },
    });
    const nameHi = str(body.nameHi, 80);
    if (nameHi) await db.categoryTranslation.create({ data: { locale: "hi", categoryId: cat.id, name: nameHi } });
    await taxAudit(db, actor, "CATEGORY_CREATED", "CATEGORY", cat.id, undefined, { ...cat, nameHi: nameHi || null });
    invalidateTaxonomy();
    return Response.json({ ok: true, category: cat, message: `${name} created — add at least one subcategory so viewers and creators can pick it.` }, { status: 201 });
  }

  // ── categories: retire / restore / merge ──
  if (seg === "categories" && id && action) {
    const cat = await db.category.findUnique({ where: { id } });
    if (!cat) return jsonError("Category not found", 404);
    if (action === "retire") {
      if (cat.retiredAt) return jsonError("This category is already retired");
      await db.category.update({ where: { id }, data: { active: false, retiredAt: new Date() } });
      await taxAudit(db, actor, "CATEGORY_RETIRED", "CATEGORY", id, { active: cat.active }, { retired: true });
      invalidateTaxonomy();
      return Response.json({ ok: true, message: `${cat.name} retired — hidden from uploads and onboarding; existing videos and history are kept.` });
    }
    if (action === "restore") {
      if (!cat.retiredAt) return jsonError("This category isn't retired");
      await db.category.update({ where: { id }, data: { active: true, retiredAt: null, mergedIntoId: null } });
      await taxAudit(db, actor, "CATEGORY_RESTORED", "CATEGORY", id, { retiredAt: cat.retiredAt, mergedIntoId: cat.mergedIntoId }, { active: true });
      invalidateTaxonomy();
      return Response.json({ ok: true, message: `${cat.name} restored` });
    }
    if (action === "merge") {
      try {
        const res = await mergeCategory(id, str(body.targetId, 40), actor);
        invalidateTaxonomy(); clearAllRankedCache();
        return Response.json({ ok: true, ...res, message: `Merged — ${res.videos} video(s) and ${res.interests} viewer interest(s) moved.` });
      } catch (e) {
        return jsonError(e instanceof Error ? e.message : "Merge failed");
      }
    }
    return jsonError("Not found", 404);
  }

  // ── subcategories: create ──
  if (seg === "subcategories" && !id) {
    const categoryId = str(body.categoryId, 40);
    const cat = await db.category.findUnique({ where: { id: categoryId } });
    if (!cat) return jsonError("Choose a main category");
    if (cat.retiredAt) return jsonError("This category is retired — restore it first");
    const name = str(body.name, 60);
    if (name.length < 2) return jsonError("Subcategory name is required");
    const slug = slugify(str(body.slug, 60) || name);
    if (!slug) return jsonError("Use letters or numbers in the name");
    if (await db.subcategory.findFirst({ where: { categoryId, OR: [{ name }, { slug }] } })) return jsonError(`${cat.name} already has a subcategory with this name`);
    const max = await db.subcategory.aggregate({ _max: { sortOrder: true }, where: { categoryId } });
    const sub = await db.subcategory.create({
      data: {
        categoryId, name, slug, emoji: emojiOf(body.emoji), description: optStr(body.description, 300),
        keywords: JSON.stringify(keywordList(body.keywords)), sortOrder: (max._max.sortOrder ?? 0) + 10, active: true,
      },
    });
    const nameHi = str(body.nameHi, 80);
    if (nameHi) await db.categoryTranslation.create({ data: { locale: "hi", subcategoryId: sub.id, name: nameHi } });
    await taxAudit(db, actor, "SUBCATEGORY_CREATED", "SUBCATEGORY", sub.id, undefined, { ...sub, categoryName: cat.name, nameHi: nameHi || null });
    invalidateTaxonomy();
    return Response.json({ ok: true, subcategory: sub, message: `${name} added to ${cat.name}` }, { status: 201 });
  }

  // ── subcategories: retire / restore / merge ──
  if (seg === "subcategories" && id && action) {
    const sub = await db.subcategory.findUnique({ where: { id }, include: { category: { include: { subcategories: true } } } });
    if (!sub) return jsonError("Subcategory not found", 404);
    if (action === "retire") {
      if (sub.retiredAt) return jsonError("This subcategory is already retired");
      await db.subcategory.update({ where: { id }, data: { active: false, retiredAt: new Date() } });
      await taxAudit(db, actor, "SUBCATEGORY_RETIRED", "SUBCATEGORY", id, { active: sub.active }, { retired: true });
      invalidateTaxonomy();
      const left = sub.category.subcategories.filter(x => x.id !== id && x.active && !x.retiredAt).length;
      return Response.json({ ok: true, message: left ? `${sub.name} retired` : `${sub.name} retired — ${sub.category.name} has no other active subcategories, so it's hidden until you add one.` });
    }
    if (action === "restore") {
      if (!sub.retiredAt) return jsonError("This subcategory isn't retired");
      await db.subcategory.update({ where: { id }, data: { active: true, retiredAt: null, mergedIntoId: null } });
      await taxAudit(db, actor, "SUBCATEGORY_RESTORED", "SUBCATEGORY", id, { retiredAt: sub.retiredAt, mergedIntoId: sub.mergedIntoId }, { active: true });
      invalidateTaxonomy();
      return Response.json({ ok: true, message: `${sub.name} restored` });
    }
    if (action === "merge") {
      try {
        const res = await mergeSubcategory(id, str(body.targetId, 40), actor);
        invalidateTaxonomy(); clearAllRankedCache();
        return Response.json({ ok: true, ...res, message: `Merged — ${res.videos} video(s) and ${res.interests} viewer interest(s) moved.` });
      } catch (e) {
        return jsonError(e instanceof Error ? e.message : "Merge failed");
      }
    }
    return jsonError("Not found", 404);
  }

  // ── tag review: approve / flag ──
  if (seg === "tags" && id && (action === "approve" || action === "flag")) {
    const video = await db.video.findUnique({ where: { contentId: id } });
    if (!video) return jsonError("Video not found", 404);
    if (action === "approve") {
      await db.video.update({ where: { id: video.id }, data: { tagStatus: "OK", tagFlagReason: null } });
      await taxAudit(db, actor, "VIDEO_TAGS_APPROVED", "VIDEO_TAGS", video.contentId, { tagStatus: video.tagStatus, reason: video.tagFlagReason }, { tagStatus: "OK" });
      return Response.json({ ok: true, message: "Tags confirmed" });
    }
    const reason = str(body.reason, 300);
    if (reason.length < 5) return jsonError("Tell the creator what to fix (at least 5 characters)");
    await db.video.update({ where: { id: video.id }, data: { tagStatus: "FLAGGED", tagFlagReason: reason } });
    await taxAudit(db, actor, "VIDEO_TAGS_FLAGGED", "VIDEO_TAGS", video.contentId, { tagStatus: video.tagStatus }, { tagStatus: "FLAGGED", reason });
    await notify({
      userId: video.creatorId, type: "VIDEO_STATUS", title: "Please check your video's language & categories",
      body: `A moderator flagged the tags on "${video.title}" (${video.contentId}): ${reason}. Edit them from My Videos — the video, its views and earnings are not affected.`,
      link: "#/dashboard/videos",
    });
    return Response.json({ ok: true, message: "Flagged — the creator has been asked to fix the tags" });
  }

  // ── recommendation settings ──
  if (seg === "recommendation") {
    if (id === "preview") {
      const settings = body.settings
        ? normalizeRecoSettings(body.settings).settings
        : normalizeRecoSettings(parseJson((await db.recommendationConfig.findFirst({ where: { status: "ACTIVE" }, orderBy: { version: "desc" } }))?.settings)).settings;
      const languages = listParam(body.languages).map(String).filter(c => t.languages.some(l => l.code === c && l.active)).slice(0, 10);
      if (!languages.length) return jsonError("Pick at least one language for the sample viewer");
      const categoryIds = listParam(body.categoryIds).map(String).filter(x => t.categories.some(c => c.id === x)).slice(0, 31);
      const subIds = new Set(t.categories.flatMap(c => c.subcategories.map(x => x.id)));
      const subcategoryIds = listParam(body.subcategoryIds).map(String).filter(x => subIds.has(x)).slice(0, 120);
      const items = await previewRanking({ languages, categoryIds, subcategoryIds, discoverOtherLanguages: bool(body.discoverOtherLanguages) }, settings, t, 30);
      return Response.json({ items, settings });
    }

    const archiveAndCreate = async (status: "ACTIVE" | "EXPERIMENT", data: { label: string; settings: string; experimentPercent: number; notes: string | null }) =>
      db.$transaction(async tx => {
        const max = await tx.recommendationConfig.aggregate({ _max: { version: true } });
        await tx.recommendationConfig.updateMany({ where: { status }, data: { status: "ARCHIVED" } });
        return tx.recommendationConfig.create({
          data: { version: (max._max.version ?? 0) + 1, status, ...data, createdById: actor.id, createdByEmail: actor.email },
        });
      });
    const done = async (action: string, row: { version: number; status: string; settings: string; experimentPercent: number }, extra: Record<string, unknown> = {}) => {
      await taxAudit(db, actor, action, "RECO_CONFIG", String(row.version), undefined, { status: row.status, experimentPercent: row.experimentPercent, settings: parseJson(row.settings), ...extra });
      invalidateRecoConfig(); clearAllRankedCache();
    };

    if (!id) {
      const { settings, adjustments } = normalizeRecoSettings(body.settings);
      const mode = body.mode === "EXPERIMENT" ? "EXPERIMENT" : "ACTIVE";
      const percent = mode === "EXPERIMENT" ? intIn(body.experimentPercent ?? 10, 1, 50) ?? 10 : 0;
      const row = await archiveAndCreate(mode, {
        label: str(body.label, 80) || (mode === "EXPERIMENT" ? "Experiment" : "Updated settings"),
        settings: JSON.stringify(settings), experimentPercent: percent, notes: optStr(body.notes, 500),
      });
      await done("RECO_CONFIG_CREATED", row, { adjustments });
      return Response.json({
        ok: true, version: row.version, status: row.status, settings, adjustments,
        message: adjustments.length ? `Version ${row.version} saved — some values were kept within safe limits.`
          : mode === "ACTIVE" ? `Version ${row.version} is now live.` : `Version ${row.version} is running for ${percent}% of viewers.`,
      }, { status: 201 });
    }
    if (id === "revert") {
      const version = intIn(body.version, 1, 1_000_000);
      const old = version ? await db.recommendationConfig.findUnique({ where: { version } }) : null;
      if (!old) return jsonError("Version not found", 404);
      const row = await archiveAndCreate("ACTIVE", { label: `Revert to v${old.version}`, settings: old.settings, experimentPercent: 0, notes: optStr(body.notes, 500) });
      await done("RECO_CONFIG_REVERTED", row, { revertedTo: old.version });
      return Response.json({ ok: true, version: row.version, message: `Version ${old.version}'s settings are live again (as v${row.version}).` });
    }
    if (id === "experiment" && (action === "stop" || action === "promote")) {
      const exp = await db.recommendationConfig.findFirst({ where: { status: "EXPERIMENT" } });
      if (!exp) return jsonError("No experiment is running");
      if (action === "stop") {
        const row = await db.recommendationConfig.update({ where: { id: exp.id }, data: { status: "ARCHIVED" } });
        await done("RECO_EXPERIMENT_STOPPED", row);
        return Response.json({ ok: true, message: `Experiment v${exp.version} stopped` });
      }
      const row = await db.$transaction(async tx => {
        await tx.recommendationConfig.updateMany({ where: { status: "ACTIVE" }, data: { status: "ARCHIVED" } });
        return tx.recommendationConfig.update({ where: { id: exp.id }, data: { status: "ACTIVE", experimentPercent: 0 } });
      });
      await done("RECO_EXPERIMENT_PROMOTED", row);
      return Response.json({ ok: true, message: `Experiment v${exp.version} is now live for everyone` });
    }
  }

  return jsonError("Not found", 404);
}

// ═════════════════════════════════════════ PATCH ═══════════════════════════════════════
export async function PATCH(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg = "", id] = segs;
  const r = await requireDiscovery(seg, true);
  if ("error" in r) return r.error;
  const actor = r.actor;
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!id) return jsonError("Not found", 404);

  if (seg === "languages") {
    const lang = await db.language.findUnique({ where: { id } });
    if (!lang) return jsonError("Language not found", 404);
    const data: Prisma.LanguageUpdateInput = {};
    if (body.nameEn !== undefined) { const v = str(body.nameEn, 60); if (v.length < 2) return jsonError("English name is required"); data.nameEn = v; }
    if (body.nameNative !== undefined) { const v = str(body.nameNative, 60); if (!v) return jsonError("Native name is required"); data.nameNative = v; }
    if (body.script !== undefined) { const v = str(body.script, 4); if (!/^[A-Z][a-z]{3}$/.test(v)) return jsonError("Script must be an ISO 15924 code"); data.script = v; }
    if (body.direction !== undefined) data.direction = body.direction === "RTL" ? "RTL" : "LTR";
    if (body.region !== undefined) data.region = optStr(body.region, 80);
    if (body.group !== undefined) data.group = body.group === "INDIAN" ? "INDIAN" : "INTERNATIONAL";
    if (body.popular !== undefined) data.popular = bool(body.popular);
    if (body.priority !== undefined) { const p = intIn(body.priority, 1, 10_000); if (p === null) return jsonError("Priority must be a number"); data.priority = p; }
    if (body.iso6391 !== undefined) { const v = str(body.iso6391, 2).toLowerCase(); if (v && !/^[a-z]{2}$/.test(v)) return jsonError("ISO 639-1 code must be 2 letters"); data.iso6391 = v || null; }
    if (body.active !== undefined) data.active = bool(body.active);
    const keys = Object.keys(data);
    if (!keys.length) return jsonError("Nothing to update");
    const updated = await db.language.update({ where: { id }, data });
    const act = keys.length === 1 && keys[0] === "active" ? (updated.active ? "LANGUAGE_ACTIVATED" : "LANGUAGE_DEACTIVATED") : "LANGUAGE_UPDATED";
    await taxAudit(db, actor, act, "LANGUAGE", id, pick(lang, keys), pick(updated, keys));
    invalidateTaxonomy();
    return Response.json({
      ok: true, language: updated,
      message: act === "LANGUAGE_DEACTIVATED" ? `${updated.nameEn} hidden from pickers — existing videos keep it.` : act === "LANGUAGE_ACTIVATED" ? `${updated.nameEn} is available again` : "Language updated",
    });
  }

  if (seg === "categories") {
    const cat = await db.category.findUnique({ where: { id } });
    if (!cat) return jsonError("Category not found", 404);
    const data: Prisma.CategoryUpdateInput = {};
    if (body.name !== undefined) {
      const v = str(body.name, 60);
      if (v.length < 2) return jsonError("Category name is required");
      if (v !== cat.name && (await db.category.findFirst({ where: { name: v, NOT: { id } } }))) return jsonError("Another category already uses this name");
      data.name = v;
    }
    if (body.slug !== undefined) {
      const v = slugify(str(body.slug, 60));
      if (!v) return jsonError("Slug must contain letters or numbers");
      if (v !== cat.slug && (await db.category.findFirst({ where: { slug: v, NOT: { id } } }))) return jsonError("Another category already uses this slug");
      data.slug = v;
    }
    if (body.emoji !== undefined) data.emoji = emojiOf(body.emoji);
    if (body.icon !== undefined) data.icon = optStr(body.icon, 40);
    if (body.color !== undefined) { const v = str(body.color, 7); if (v && !HEX.test(v)) return jsonError("Colour must be a hex value like #FF4E9B"); data.color = v || null; }
    if (body.description !== undefined) data.description = optStr(body.description, 300);
    if (body.coverImageUrl !== undefined) data.coverImageUrl = urlOf(body.coverImageUrl);
    if (body.keywords !== undefined) data.keywords = JSON.stringify(keywordList(body.keywords));
    if (body.sortOrder !== undefined) { const v = intIn(body.sortOrder, 0, 10_000); if (v === null) return jsonError("Sort order must be a number"); data.sortOrder = v; }
    if (body.active !== undefined) {
      if (cat.retiredAt && bool(body.active)) return jsonError("Restore this retired category first");
      data.active = bool(body.active);
    }
    const keys = Object.keys(data);
    if (!keys.length) return jsonError("Nothing to update");
    const updated = await db.category.update({ where: { id }, data });
    const act = keys.length === 1 && keys[0] === "active" ? (updated.active ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED") : "CATEGORY_UPDATED";
    await taxAudit(db, actor, act, "CATEGORY", id, pick(cat, keys), pick(updated, keys));
    invalidateTaxonomy();
    return Response.json({ ok: true, category: updated, message: act === "CATEGORY_DEACTIVATED" ? `${updated.name} hidden for now` : act === "CATEGORY_ACTIVATED" ? `${updated.name} is visible again` : "Category updated" });
  }

  if (seg === "subcategories") {
    const sub = await db.subcategory.findUnique({ where: { id } });
    if (!sub) return jsonError("Subcategory not found", 404);
    const data: Prisma.SubcategoryUpdateInput = {};
    if (body.name !== undefined) {
      const v = str(body.name, 60);
      if (v.length < 2) return jsonError("Subcategory name is required");
      if (v !== sub.name && (await db.subcategory.findFirst({ where: { categoryId: sub.categoryId, name: v, NOT: { id } } }))) return jsonError("This category already has a subcategory with that name");
      data.name = v;
    }
    if (body.slug !== undefined) {
      const v = slugify(str(body.slug, 60));
      if (!v) return jsonError("Slug must contain letters or numbers");
      if (v !== sub.slug && (await db.subcategory.findFirst({ where: { categoryId: sub.categoryId, slug: v, NOT: { id } } }))) return jsonError("This category already uses that slug");
      data.slug = v;
    }
    if (body.emoji !== undefined) data.emoji = emojiOf(body.emoji);
    if (body.description !== undefined) data.description = optStr(body.description, 300);
    if (body.keywords !== undefined) data.keywords = JSON.stringify(keywordList(body.keywords));
    if (body.sortOrder !== undefined) { const v = intIn(body.sortOrder, 0, 10_000); if (v === null) return jsonError("Sort order must be a number"); data.sortOrder = v; }
    if (body.active !== undefined) {
      if (sub.retiredAt && bool(body.active)) return jsonError("Restore this retired subcategory first");
      data.active = bool(body.active);
    }
    const keys = Object.keys(data);
    if (!keys.length) return jsonError("Nothing to update");
    const updated = await db.subcategory.update({ where: { id }, data });
    const act = keys.length === 1 && keys[0] === "active" ? (updated.active ? "SUBCATEGORY_ACTIVATED" : "SUBCATEGORY_DEACTIVATED") : "SUBCATEGORY_UPDATED";
    await taxAudit(db, actor, act, "SUBCATEGORY", id, pick(sub, keys), pick(updated, keys));
    invalidateTaxonomy();
    return Response.json({ ok: true, subcategory: updated, message: "Subcategory updated" });
  }

  // moderator correction of a video's languages / categories (same content ID, history kept)
  if (seg === "tags") {
    const video = await db.video.findUnique({ where: { contentId: id }, include: { tags: true, languages: true } });
    if (!video) return jsonError("Video not found", 404);
    const t = await loadTaxonomy("en");
    const keepIds = new Set<string>([...video.tags.flatMap(x => [x.categoryId, x.subcategoryId]), ...video.languages.map(l => l.languageId)]);
    const check = validateVideoTags(parseTagInput({ languages: body.languages, tags: body.tags }), t, { keepIds });
    if (!check.ok) return Response.json({ error: firstError(check.errors), errors: check.errors }, { status: 400 });
    const note = str(body.note, 300);
    await db.$transaction(tx => writeVideoTags(tx, {
      videoId: video.id, contentId: video.contentId, value: check.value, source: "ADMIN", actor,
      taxonomy: t, reviewStatus: { status: "OK", reason: null }, auditAction: "VIDEO_TAGS_CORRECTED",
    }));
    clearTaxonomyCounts();
    await notify({
      userId: video.creatorId, type: "VIDEO_STATUS", title: "Tags updated by our team",
      body: `We updated the language/categories on "${video.title}" (${video.contentId}) so the right viewers can find it.${note ? ` Note: ${note}` : ""} The video, its views and earnings are unchanged.`,
      link: "#/dashboard/videos",
    });
    return Response.json({ ok: true, message: "Tags corrected and the creator notified" });
  }

  return jsonError("Not found", 404);
}

// ═════════════════════════════════════════ PUT ═════════════════════════════════════════
export async function PUT(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg = ""] = segs;
  const r = await requireDiscovery(seg, true);
  if ("error" in r) return r.error;
  const actor = r.actor;
  const body = (await req.json().catch(() => ({}))) as Body;

  // localized names: { locale, items: [{ categoryId | subcategoryId, name, description? }] } (empty name removes)
  if (seg === "translations") {
    const locale = str(body.locale, 10);
    const locales = await interfaceLocales();
    if (locale === "en" || !locales.some(l => l.code === locale)) return jsonError("Choose an interface language other than English");
    const items: Body[] = (Array.isArray(body.items) ? body.items : [body]).slice(0, 600);
    let saved = 0, removed = 0;
    await db.$transaction(async tx => {
      for (const it of items) {
        const categoryId = optStr(it.categoryId, 40), subcategoryId = optStr(it.subcategoryId, 40);
        if (!!categoryId === !!subcategoryId) continue;
        const where = { locale, ...(categoryId ? { categoryId } : { subcategoryId }) };
        const existing = await tx.categoryTranslation.findFirst({ where });
        const name = str(it.name, 80);
        if (!name) {
          if (existing) { await tx.categoryTranslation.delete({ where: { id: existing.id } }); removed++; }
          continue;
        }
        if (existing && existing.name === name && (it.description === undefined || existing.description === optStr(it.description, 300))) continue;
        if (existing) await tx.categoryTranslation.update({ where: { id: existing.id }, data: { name, ...(it.description !== undefined ? { description: optStr(it.description, 300) } : {}) } });
        else await tx.categoryTranslation.create({ data: { locale, categoryId, subcategoryId, name, description: optStr(it.description, 300) } });
        saved++;
        await taxAudit(tx, actor, "TRANSLATION_SAVED", "TRANSLATION", categoryId ?? subcategoryId, existing ? { name: existing.name } : undefined, { locale, name });
      }
    });
    if (removed) await taxAudit(db, actor, "TRANSLATIONS_REMOVED", "TRANSLATION", null, undefined, { locale, removed });
    invalidateTaxonomy();
    return Response.json({ ok: true, saved, removed, message: `Saved ${saved} name(s)${removed ? `, removed ${removed}` : ""}` });
  }

  // interface languages the UI may be shown in: { locales: [{ code, name, nameNative }] }
  if (seg === "locales") {
    const list: Body[] = Array.isArray(body.locales) ? body.locales : [];
    const seen = new Set<string>();
    const clean = list
      .map(l => ({ code: str(l?.code, 10), name: str(l?.name, 40), nameNative: str(l?.nameNative, 40) || str(l?.name, 40) }))
      .filter(l => /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(l.code) && l.name && !seen.has(l.code) && seen.add(l.code))
      .slice(0, 20);
    if (!clean.some(l => l.code === "en")) return jsonError("English must stay available");
    const before = await interfaceLocales();
    await db.platformSetting.upsert({ where: { key: "interfaceLocales" }, update: { value: JSON.stringify(clean) }, create: { key: "interfaceLocales", value: JSON.stringify(clean) } });
    await taxAudit(db, actor, "LOCALES_UPDATED", "LOCALE", null, before, clean);
    invalidateTaxonomy();
    return Response.json({ ok: true, locales: clean, message: "Interface languages saved" });
  }

  return jsonError("Not found", 404);
}
