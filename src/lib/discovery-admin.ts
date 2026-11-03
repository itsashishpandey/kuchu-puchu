// Admin operations on the discovery taxonomy: merges (videos + viewer interests are redirected),
// audit logging, and the aggregate analytics behind the admin "Content Discovery" pages.
// Everything here is aggregate-only — no per-viewer data leaves these functions.
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Taxonomy } from "@/lib/discovery/types";
import { slugify as slugifyName } from "../../prisma/discovery-data.mjs";

export const slugify = (name: string): string => slugifyName(String(name || ""));

type Tx = Prisma.TransactionClient;
export type Actor = { id: string; email: string };
const DAY = 864e5;

export async function taxAudit(
  client: Tx | typeof db, actor: Actor, action: string, entityType: string, entityId: string | null,
  before?: unknown, after?: unknown,
) {
  await client.taxonomyAuditLog.create({
    data: {
      actorId: actor.id, actorEmail: actor.email, action, entityType, entityId,
      before: before === undefined ? null : JSON.stringify(before),
      after: after === undefined ? null : JSON.stringify(after),
    },
  });
}

type TagRow = { categoryId: string; subcategoryId: string; source: string; assignedById: string | null };

/** Rewrite one video's tags: dedupe by main category (first wins), keep ≤ 3, renumber 1..n. */
async function rewriteVideoTags(tx: Tx, videoId: string, list: TagRow[], actorId: string) {
  const seen = new Set<string>();
  const out: TagRow[] = [];
  for (const t of list) {
    if (seen.has(t.categoryId)) continue;
    seen.add(t.categoryId);
    out.push(t);
    if (out.length === 3) break;
  }
  await tx.videoCategoryAssignment.deleteMany({ where: { videoId } });
  for (const [i, t] of out.entries()) {
    await tx.videoCategoryAssignment.create({
      data: { videoId, categoryId: t.categoryId, subcategoryId: t.subcategoryId, priority: i + 1, source: t.source, assignedById: t.assignedById, updatedById: actorId },
    });
  }
  if (out[0]) {
    const sub = await tx.subcategory.findUnique({ where: { id: out[0].subcategoryId }, select: { name: true } });
    await tx.video.update({ where: { id: videoId }, data: { category: sub?.name ?? "Uncategorized", tagsUpdatedAt: new Date() } });
  }
}

async function bumpUsers(tx: Tx, userIds: string[]) {
  if (userIds.length) await tx.userRecommendationPreference.updateMany({ where: { userId: { in: userIds } }, data: { prefsVersion: { increment: 1 } } });
}

/** Merge subcategory → subcategory (any category). Videos and interests follow; the source is retired. */
export async function mergeSubcategory(sourceId: string, targetId: string, actor: Actor) {
  if (sourceId === targetId) throw new Error("Choose a different subcategory to merge into.");
  return db.$transaction(async tx => {
    const [src, dst] = await Promise.all([
      tx.subcategory.findUnique({ where: { id: sourceId } }),
      tx.subcategory.findUnique({ where: { id: targetId }, include: { category: true } }),
    ]);
    if (!src || !dst) throw new Error("Subcategory not found.");
    if (!dst.active || dst.retiredAt || !dst.category.active || dst.category.retiredAt) throw new Error("Merge into an active subcategory.");
    const videoIds = [...new Set((await tx.videoCategoryAssignment.findMany({ where: { subcategoryId: sourceId }, select: { videoId: true } })).map(a => a.videoId))];
    for (const videoId of videoIds) {
      const cur = await tx.videoCategoryAssignment.findMany({ where: { videoId }, orderBy: { priority: "asc" } });
      await rewriteVideoTags(tx, videoId, cur.map(a => (a.subcategoryId === sourceId ? { ...a, categoryId: dst.categoryId, subcategoryId: dst.id } : a)), actor.id);
    }
    const prefs = await tx.userSubcategoryPreference.findMany({ where: { subcategoryId: sourceId } });
    for (const p of prefs) {
      await tx.userSubcategoryPreference.upsert({ where: { userId_subcategoryId: { userId: p.userId, subcategoryId: dst.id } }, update: {}, create: { userId: p.userId, subcategoryId: dst.id } });
      await tx.userCategoryPreference.upsert({ where: { userId_categoryId: { userId: p.userId, categoryId: dst.categoryId } }, update: {}, create: { userId: p.userId, categoryId: dst.categoryId } });
    }
    await tx.userSubcategoryPreference.deleteMany({ where: { subcategoryId: sourceId } });
    await tx.subcategory.update({ where: { id: sourceId }, data: { active: false, retiredAt: new Date(), mergedIntoId: dst.id } });
    await bumpUsers(tx, prefs.map(p => p.userId));
    const result = { videos: videoIds.length, interests: prefs.length };
    await taxAudit(tx, actor, "SUBCATEGORY_MERGED", "SUBCATEGORY", sourceId, { name: src.name, categoryId: src.categoryId }, { mergedIntoId: dst.id, mergedIntoName: dst.name, ...result });
    return result;
  }, { timeout: 120_000 });
}

/**
 * Merge category → category. Subcategories with the same name/slug merge into the target's;
 * the rest move under the target. Videos, viewer interests and channel preferences follow.
 */
export async function mergeCategory(sourceId: string, targetId: string, actor: Actor) {
  if (sourceId === targetId) throw new Error("Choose a different category to merge into.");
  return db.$transaction(async tx => {
    const [src, dst] = await Promise.all([
      tx.category.findUnique({ where: { id: sourceId }, include: { subcategories: true } }),
      tx.category.findUnique({ where: { id: targetId }, include: { subcategories: true } }),
    ]);
    if (!src || !dst) throw new Error("Category not found.");
    if (!dst.active || dst.retiredAt) throw new Error("Merge into an active category.");
    const subMap = new Map<string, string>();
    const moved: string[] = [];
    for (const s of src.subcategories) {
      const match = dst.subcategories.find(d => d.slug === s.slug || d.name.toLowerCase() === s.name.toLowerCase());
      if (match) subMap.set(s.id, match.id); else moved.push(s.id);
    }
    const maxSort = Math.max(0, ...dst.subcategories.map(s => s.sortOrder));
    for (const [i, id] of moved.entries()) await tx.subcategory.update({ where: { id }, data: { categoryId: dst.id, sortOrder: maxSort + 10 * (i + 1) } });

    const videoIds = [...new Set((await tx.videoCategoryAssignment.findMany({ where: { categoryId: sourceId }, select: { videoId: true } })).map(a => a.videoId))];
    for (const videoId of videoIds) {
      const cur = await tx.videoCategoryAssignment.findMany({ where: { videoId }, orderBy: { priority: "asc" } });
      await rewriteVideoTags(tx, videoId, cur.map(a => (a.categoryId !== sourceId ? a : { ...a, categoryId: dst.id, subcategoryId: subMap.get(a.subcategoryId) ?? a.subcategoryId })), actor.id);
    }
    // merged subcategories: retire + move interests
    const touched = new Set<string>();
    for (const [from, to] of subMap) {
      const prefs = await tx.userSubcategoryPreference.findMany({ where: { subcategoryId: from } });
      for (const p of prefs) {
        touched.add(p.userId);
        await tx.userSubcategoryPreference.upsert({ where: { userId_subcategoryId: { userId: p.userId, subcategoryId: to } }, update: {}, create: { userId: p.userId, subcategoryId: to } });
      }
      await tx.userSubcategoryPreference.deleteMany({ where: { subcategoryId: from } });
      await tx.subcategory.update({ where: { id: from }, data: { active: false, retiredAt: new Date(), mergedIntoId: to } });
    }
    const catPrefs = await tx.userCategoryPreference.findMany({ where: { categoryId: sourceId } });
    for (const p of catPrefs) {
      touched.add(p.userId);
      const existing = await tx.userCategoryPreference.findUnique({ where: { userId_categoryId: { userId: p.userId, categoryId: dst.id } } });
      if (existing) {
        if (p.allSubcategories && !existing.allSubcategories) await tx.userCategoryPreference.update({ where: { id: existing.id }, data: { allSubcategories: true } });
      } else {
        await tx.userCategoryPreference.create({ data: { userId: p.userId, categoryId: dst.id, allSubcategories: p.allSubcategories } });
      }
    }
    await tx.userCategoryPreference.deleteMany({ where: { categoryId: sourceId } });
    const chPrefs = await tx.channelCategoryPreference.findMany({ where: { categoryId: sourceId } });
    for (const c of chPrefs) {
      await tx.channelCategoryPreference.upsert({ where: { channelId_categoryId: { channelId: c.channelId, categoryId: dst.id } }, update: {}, create: { channelId: c.channelId, categoryId: dst.id } });
    }
    await tx.channelCategoryPreference.deleteMany({ where: { categoryId: sourceId } });
    await tx.category.update({ where: { id: sourceId }, data: { active: false, retiredAt: new Date(), mergedIntoId: dst.id } });
    await bumpUsers(tx, [...touched]);
    const result = { videos: videoIds.length, interests: catPrefs.length, subcategoriesMerged: subMap.size, subcategoriesMoved: moved.length, channels: chPrefs.length };
    await taxAudit(tx, actor, "CATEGORY_MERGED", "CATEGORY", sourceId, { name: src.name }, { mergedIntoId: dst.id, mergedIntoName: dst.name, ...result });
    return result;
  }, { timeout: 120_000 });
}

// ── aggregate stats ────────────────────────────────────────────────────────

/** Per-language: approved videos (any position), viewers who chose it, views (primary attribution). */
export async function languageStats() {
  const [videos, viewers, primary] = await Promise.all([
    db.videoLanguage.groupBy({ by: ["languageId"], where: { video: { status: "APPROVED" } }, _count: { _all: true } }),
    db.userLanguagePreference.groupBy({ by: ["languageId"], _count: { _all: true } }),
    db.videoLanguage.findMany({ where: { isPrimary: true, video: { status: "APPROVED" } }, select: { languageId: true, video: { select: { views: true, qualifiedViews: true } } } }),
  ]);
  const views = new Map<string, { views: number; qualifiedViews: number }>();
  for (const p of primary) {
    const r = views.get(p.languageId) ?? { views: 0, qualifiedViews: 0 };
    r.views += p.video.views; r.qualifiedViews += p.video.qualifiedViews;
    views.set(p.languageId, r);
  }
  return {
    videos: new Map(videos.map(v => [v.languageId, v._count._all])),
    viewers: new Map(viewers.map(v => [v.languageId, v._count._all])),
    views,
  };
}

/** Per category + subcategory: tagged videos (any position), primary videos/views, interested viewers. */
export async function categoryStats() {
  const approved = { video: { status: "APPROVED" } };
  const [catTagged, subTagged, primary, catUsers, subUsers, allSubs] = await Promise.all([
    db.videoCategoryAssignment.groupBy({ by: ["categoryId"], where: approved, _count: { _all: true } }),
    db.videoCategoryAssignment.groupBy({ by: ["subcategoryId"], where: approved, _count: { _all: true } }),
    db.videoCategoryAssignment.findMany({ where: { ...approved, priority: 1 }, select: { categoryId: true, subcategoryId: true, video: { select: { views: true, qualifiedViews: true } } } }),
    db.userCategoryPreference.groupBy({ by: ["categoryId"], _count: { _all: true } }),
    db.userSubcategoryPreference.groupBy({ by: ["subcategoryId"], _count: { _all: true } }),
    db.userCategoryPreference.groupBy({ by: ["categoryId"], where: { allSubcategories: true }, _count: { _all: true } }),
  ]);
  const prim = (key: "categoryId" | "subcategoryId") => {
    const m = new Map<string, { videos: number; views: number; qualifiedViews: number }>();
    for (const p of primary) {
      const r = m.get(p[key]) ?? { videos: 0, views: 0, qualifiedViews: 0 };
      r.videos++; r.views += p.video.views; r.qualifiedViews += p.video.qualifiedViews;
      m.set(p[key], r);
    }
    return m;
  };
  return {
    catTagged: new Map(catTagged.map(c => [c.categoryId, c._count._all])),
    subTagged: new Map(subTagged.map(s => [s.subcategoryId, s._count._all])),
    catPrimary: prim("categoryId"),
    subPrimary: prim("subcategoryId"),
    catUsers: new Map(catUsers.map(c => [c.categoryId, c._count._all])),
    subUsers: new Map(subUsers.map(s => [s.subcategoryId, s._count._all])),
    catAllSubs: new Map(allSubs.map(c => [c.categoryId, c._count._all])),
  };
}

/** "User Interest Analytics": what viewers chose, and where demand outruns supply. */
export async function interestAnalytics(t: Taxonomy) {
  const since30 = new Date(Date.now() - 30 * DAY);
  const [users, onboarded, discovery, langPrefs, primaryLangs, stats, feedback30] = await Promise.all([
    db.user.count({ where: { role: { in: ["VIEWER", "CREATOR"] } } }),
    db.userRecommendationPreference.count({ where: { onboardingCompletedAt: { not: null } } }),
    db.userRecommendationPreference.count({ where: { discoverOtherLanguages: true } }),
    db.userLanguagePreference.groupBy({ by: ["languageId"], _count: { _all: true } }),
    db.userLanguagePreference.groupBy({ by: ["languageId"], where: { isPrimary: true }, _count: { _all: true } }),
    categoryStats(),
    db.videoInteractionEvent.groupBy({ by: ["type"], where: { createdAt: { gte: since30 }, type: { in: ["SAVE", "NOT_INTERESTED", "HIDE_CREATOR", "LIKE", "SHARE", "COMPLETE", "REPORT"] } }, _count: { _all: true } }),
  ]);
  const langStats = await languageStats();
  const primaryMap = new Map(primaryLangs.map(p => [p.languageId, p._count._all]));
  const langName = (id: string) => t.languages.find(l => l.id === id);
  const languages = langPrefs.map(p => {
    const l = langName(p.languageId);
    return { code: l?.code ?? "?", nameEn: l?.nameEn ?? "Unknown", nameNative: l?.nameNative ?? "", viewers: p._count._all, primaryViewers: primaryMap.get(p.languageId) ?? 0, videos: langStats.videos.get(p.languageId) ?? 0 };
  }).sort((a, b) => b.viewers - a.viewers);
  const categories = t.categories.filter(c => !c.retired).map(c => ({
    id: c.id, slug: c.slug, name: c.name, emoji: c.emoji,
    interestedViewers: stats.catUsers.get(c.id) ?? 0, allSubcategories: stats.catAllSubs.get(c.id) ?? 0,
    videos: stats.catTagged.get(c.id) ?? 0, primaryViews: stats.catPrimary.get(c.id)?.views ?? 0,
  })).sort((a, b) => b.interestedViewers - a.interestedViewers);
  const subcategories = t.categories.flatMap(c => c.subcategories.filter(s => !s.retired).map(s => ({
    id: s.id, name: s.name, category: c.name, emoji: s.emoji ?? c.emoji,
    interestedViewers: stats.subUsers.get(s.id) ?? 0, videos: stats.subTagged.get(s.id) ?? 0,
  }))).filter(s => s.interestedViewers > 0).sort((a, b) => b.interestedViewers - a.interestedViewers).slice(0, 40);
  // content gaps: interest with little or no supply (aggregate counts only)
  const gaps = [
    ...categories.filter(c => c.interestedViewers > 0 && c.videos < 3).map(c => ({ type: "CATEGORY", name: c.name, emoji: c.emoji, interestedViewers: c.interestedViewers, videos: c.videos })),
    ...languages.filter(l => l.viewers > 0 && l.videos < 3).map(l => ({ type: "LANGUAGE", name: l.nameEn, emoji: null, interestedViewers: l.viewers, videos: l.videos })),
  ].sort((a, b) => b.interestedViewers - a.interestedViewers).slice(0, 20);
  return {
    totals: {
      accounts: users, onboarded, onboardingRate: users ? Math.round((onboarded / users) * 100) : 0,
      discoveryOptIn: discovery, discoveryRate: onboarded ? Math.round((discovery / onboarded) * 100) : 0,
    },
    signals30d: Object.fromEntries(feedback30.map(f => [f.type, f._count._all])),
    languages, categories, subcategories, gaps,
  };
}

/** "Content Discovery Reports": views, completion, feedback and search over a date range. */
export async function discoveryReports(t: Taxonomy, days: number) {
  const since = new Date(Date.now() - days * DAY);
  const [viewsByVideo, qualByVideo, interactions, searches, zero] = await Promise.all([
    db.viewEvent.groupBy({ by: ["videoId"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.viewEvent.groupBy({ by: ["videoId"], where: { createdAt: { gte: since }, qualified: true }, _count: { _all: true } }),
    db.videoInteractionEvent.groupBy({ by: ["videoId", "type"], where: { createdAt: { gte: since }, suspicious: false }, _count: { _all: true } }),
    db.searchLog.groupBy({ by: ["normalized"], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { normalized: "desc" } }, take: 25 }),
    db.searchLog.groupBy({ by: ["normalized"], where: { createdAt: { gte: since }, resultCount: 0 }, _count: { _all: true }, orderBy: { _count: { normalized: "desc" } }, take: 25 }),
  ]);
  const ids = [...new Set([...viewsByVideo.map(v => v.videoId), ...interactions.map(i => i.videoId)])];
  const vids = await db.video.findMany({
    where: { id: { in: ids } },
    select: { id: true, languages: { where: { isPrimary: true }, select: { languageId: true } }, tags: { where: { priority: 1 }, select: { categoryId: true, subcategoryId: true } } },
  });
  const primaryOf = new Map(vids.map(v => [v.id, { lang: v.languages[0]?.languageId ?? null, cat: v.tags[0]?.categoryId ?? null, sub: v.tags[0]?.subcategoryId ?? null }]));
  type R = { views: number; qualifiedViews: number; tracked: number; completes: number; likes: number; saves: number; shares: number; notInterested: number; hidden: number; reports: number };
  const blank = (): R => ({ views: 0, qualifiedViews: 0, tracked: 0, completes: 0, likes: 0, saves: 0, shares: 0, notInterested: 0, hidden: 0, reports: 0 });
  const byLang = new Map<string, R>(), byCat = new Map<string, R>(), bySub = new Map<string, R>();
  const add = (videoId: string, fn: (r: R) => void) => {
    const p = primaryOf.get(videoId);
    if (!p) return;
    for (const [m, k] of [[byLang, p.lang], [byCat, p.cat], [bySub, p.sub]] as const) {
      if (!k) continue;
      if (!m.has(k)) m.set(k, blank());
      fn(m.get(k)!);
    }
  };
  viewsByVideo.forEach(v => add(v.videoId, r => { r.views += v._count._all; }));
  qualByVideo.forEach(v => add(v.videoId, r => { r.qualifiedViews += v._count._all; }));
  const field: Record<string, keyof R> = { VIEW: "tracked", COMPLETE: "completes", LIKE: "likes", SAVE: "saves", SHARE: "shares", NOT_INTERESTED: "notInterested", HIDE_CREATOR: "hidden", REPORT: "reports" };
  interactions.forEach(i => { const k = field[i.type]; if (k) add(i.videoId, r => { r[k] += i._count._all; }); });
  const fin = (r: R) => ({ ...r, completionRate: r.tracked ? Math.round((Math.min(r.completes, r.tracked) / r.tracked) * 100) : null });
  const lang = (id: string) => t.languages.find(l => l.id === id);
  const cat = (id: string) => t.categories.find(c => c.id === id);
  const sub = (id: string) => t.categories.flatMap(c => c.subcategories).find(s => s.id === id);
  return {
    days, attribution: "primary",
    byLanguage: [...byLang].map(([id, r]) => ({ code: lang(id)?.code ?? "?", name: lang(id)?.nameEn ?? "Unknown", ...fin(r) })).sort((a, b) => b.views - a.views),
    byCategory: [...byCat].map(([id, r]) => ({ id, name: cat(id)?.name ?? "Retired", emoji: cat(id)?.emoji ?? null, ...fin(r) })).sort((a, b) => b.views - a.views),
    bySubcategory: [...bySub].map(([id, r]) => {
      const s = sub(id);
      return { id, name: s?.name ?? "Retired", category: s ? cat(s.categoryId)?.name ?? "" : "", ...fin(r) };
    }).sort((a, b) => b.views - a.views).slice(0, 50),
    search: {
      top: searches.map(s => ({ query: s.normalized, count: s._count._all })),
      noResults: zero.map(s => ({ query: s.normalized, count: s._count._all })),
    },
  };
}
