// Seeds languages, the kids-only taxonomy (ages 3–8), Hindi category names, interface locales and
// the default recommendation config. Idempotent: creates what's missing and never overwrites admin
// edits. `applyKidsTaxonomy` runs ONCE per database (flag in PlatformSetting "kidsTaxonomy") to turn
// an older database — the 12 original kids categories or the 31-category taxonomy — into the kids
// taxonomy: videos and viewer interests move to kids subcategories, everything else is retired
// (history kept, nothing deleted). Then untagged videos get a controlled backfill (marked for review).
//
//   node prisma/seed-discovery.mjs            (uses DATABASE_URL from the environment / .env)
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import {
  LANGUAGES, CATEGORIES, INTERFACE_LOCALES, LEGACY_KIDS_CATEGORIES, LEGACY_KIDS_MAP, DEFAULT_RECO_SETTINGS,
} from "./discovery-data.mjs";

const SYSTEM = { id: "system", email: "system@seed" };
const KIDS_FLAG = "kidsTaxonomy";

async function ensureSubcategories(db, cat, c, stats) {
  for (const s of c.subcategories) {
    const sub = await db.subcategory.findUnique({ where: { categoryId_slug: { categoryId: cat.id, slug: s.slug } } });
    if (sub) continue;
    await db.subcategory.create({
      data: { categoryId: cat.id, name: s.name, slug: s.slug, emoji: s.emoji, keywords: JSON.stringify(s.keywords), sortOrder: s.sortOrder, active: true },
    });
    stats.subcategories++;
  }
}

async function ensureTranslation(db, cat, c, stats) {
  if (!c.nameHi) return;
  const t = await db.categoryTranslation.findUnique({ where: { locale_categoryId: { locale: "hi", categoryId: cat.id } } });
  if (!t) { await db.categoryTranslation.create({ data: { locale: "hi", categoryId: cat.id, name: c.nameHi } }); stats.translations++; }
  else if (t.name !== c.nameHi && stats.converting) await db.categoryTranslation.update({ where: { id: t.id }, data: { name: c.nameHi } });
}

export async function seedDiscovery(db, log = console.log) {
  const stats = { languages: 0, categories: 0, subcategories: 0, translations: 0, retired: 0 };

  for (const l of LANGUAGES) {
    if (await db.language.findUnique({ where: { code: l.code } })) continue;
    await db.language.create({ data: { ...l, active: true } });
    stats.languages++;
  }

  // kids categories: create the missing ones; existing live ones get any new subcategories.
  // (A same-slug row that is retired — e.g. an original kids category — is revived by applyKidsTaxonomy.)
  for (const c of CATEGORIES) {
    let cat = await db.category.findUnique({ where: { slug: c.slug } });
    // an original-app category with the same name is revived (and re-slugged) by applyKidsTaxonomy
    if (!cat && (await db.category.findUnique({ where: { name: c.name } }))) continue;
    if (!cat) {
      cat = await db.category.create({
        data: {
          name: c.name, slug: c.slug, emoji: c.emoji, color: c.color, description: c.description ?? null,
          keywords: JSON.stringify(c.keywords), sortOrder: c.sortOrder, active: true,
        },
      });
      stats.categories++;
    }
    if (cat.retiredAt) continue;
    await ensureSubcategories(db, cat, c, stats);
    await ensureTranslation(db, cat, c, stats);
  }

  const loc = await db.platformSetting.findUnique({ where: { key: "interfaceLocales" } });
  if (!loc) await db.platformSetting.create({ data: { key: "interfaceLocales", value: JSON.stringify(INTERFACE_LOCALES) } });

  if ((await db.recommendationConfig.count()) === 0) {
    await db.recommendationConfig.create({
      data: {
        version: 1, label: "Initial weights", status: "ACTIVE", settings: JSON.stringify(DEFAULT_RECO_SETTINGS),
        notes: "Starting weights from the product spec (subcategory 40 / category 25 / engagement 20 / recency 10 / discovery 5).",
        createdById: SYSTEM.id, createdByEmail: SYSTEM.email,
      },
    });
  }

  if (stats.languages || stats.categories || stats.subcategories) {
    await db.taxonomyAuditLog.create({ data: { actorId: SYSTEM.id, actorEmail: SYSTEM.email, action: "SEED", entityType: "TAXONOMY", after: JSON.stringify(stats) } });
  }
  log(`discovery seed: +${stats.languages} languages, +${stats.categories} categories, +${stats.subcategories} subcategories, +${stats.translations} translations`);
  return stats;
}

/** Rewrite one video's tags: drop duplicates of a main category (first wins), keep ≤ 3, renumber 1..n. */
async function rewriteTags(db, videoId, list) {
  const seen = new Set();
  const out = [];
  for (const t of list) { if (seen.has(t.categoryId)) continue; seen.add(t.categoryId); out.push(t); if (out.length === 3) break; }
  await db.videoCategoryAssignment.deleteMany({ where: { videoId } });
  for (const [i, t] of out.entries()) {
    await db.videoCategoryAssignment.create({
      data: { videoId, categoryId: t.categoryId, subcategoryId: t.subcategoryId, priority: i + 1, source: t.source ?? "BACKFILL", assignedById: t.assignedById ?? null, updatedById: SYSTEM.id },
    });
  }
  if (out[0]) {
    const sub = await db.subcategory.findUnique({ where: { id: out[0].subcategoryId }, select: { name: true } });
    await db.video.update({ where: { id: videoId }, data: { category: sub?.name ?? "Uncategorized", tagsUpdatedAt: new Date() } });
  }
  return out.length;
}

/** Move videos + viewer interests from one subcategory to another, then retire the source. */
async function mergeSub(db, src, dst) {
  const videoIds = [...new Set((await db.videoCategoryAssignment.findMany({ where: { subcategoryId: src.id }, select: { videoId: true } })).map(a => a.videoId))];
  for (const videoId of videoIds) {
    const cur = await db.videoCategoryAssignment.findMany({ where: { videoId }, orderBy: { priority: "asc" } });
    await rewriteTags(db, videoId, cur.map(a => (a.subcategoryId === src.id ? { ...a, categoryId: dst.categoryId, subcategoryId: dst.id } : a)));
  }
  const prefs = await db.userSubcategoryPreference.findMany({ where: { subcategoryId: src.id } });
  for (const p of prefs) {
    await db.userSubcategoryPreference.upsert({ where: { userId_subcategoryId: { userId: p.userId, subcategoryId: dst.id } }, update: {}, create: { userId: p.userId, subcategoryId: dst.id } });
    await db.userCategoryPreference.upsert({ where: { userId_categoryId: { userId: p.userId, categoryId: dst.categoryId } }, update: {}, create: { userId: p.userId, categoryId: dst.categoryId } });
  }
  await db.userSubcategoryPreference.deleteMany({ where: { subcategoryId: src.id } });
  await db.subcategory.update({ where: { id: src.id }, data: { active: false, retiredAt: src.retiredAt ?? new Date(), mergedIntoId: dst.id } });
  return { videos: videoIds.length, interests: prefs.length };
}

/**
 * One-time conversion to the kids-only taxonomy. Safe to call on every deploy: it does nothing once
 * the "kidsTaxonomy" flag is set (so admin edits afterwards are never overwritten).
 */
export async function applyKidsTaxonomy(db, log = console.log) {
  const flag = await db.platformSetting.findUnique({ where: { key: KIDS_FLAG } });
  if (flag) { log("kids taxonomy: already applied"); return null; }
  const stats = { converting: true, categories: 0, subcategories: 0, translations: 0, revived: 0, mergedSubs: 0, movedVideos: 0, retiredCategories: 0, cleanedVideos: 0, needsReview: 0, droppedInterests: 0 };

  // 1) kids categories: create or revive (same-slug rows of the original kids app are reused) + subcategories
  const kidsSlugs = new Set(CATEGORIES.map(c => c.slug));
  const kidsSub = new Map(); // "category/sub" → subcategory row
  for (const c of CATEGORIES) {
    // same slug, or an original-app category with the same name (e.g. "Arts & Crafts", slug "crafts") → reuse that row
    let cat = (await db.category.findUnique({ where: { slug: c.slug } })) ?? (await db.category.findUnique({ where: { name: c.name } }));
    const data = { name: c.name, slug: c.slug, emoji: c.emoji, color: c.color, description: c.description ?? null, keywords: JSON.stringify(c.keywords), sortOrder: c.sortOrder, active: true, retiredAt: null, mergedIntoId: null };
    if (cat) { if (cat.retiredAt || !cat.active) stats.revived++; cat = await db.category.update({ where: { id: cat.id }, data }); }
    else { cat = await db.category.create({ data }); stats.categories++; }
    await ensureSubcategories(db, cat, c, stats);
    await ensureTranslation(db, cat, c, stats);
    for (const s of c.subcategories) {
      const row = await db.subcategory.findUnique({ where: { categoryId_slug: { categoryId: cat.id, slug: s.slug } } });
      if (row.retiredAt || !row.active) await db.subcategory.update({ where: { id: row.id }, data: { active: true, retiredAt: null, mergedIntoId: null } });
      kidsSub.set(`${c.slug}/${s.slug}`, row);
    }
  }

  // 2) the original 12 kids categories, wherever they live now (as categories, or as "Kids & Cartoons"
  //    subcategories in the 31-category version) → their kids subcategory
  const oldKids = await db.category.findUnique({ where: { slug: "kids-cartoons" }, include: { subcategories: true } });
  for (const [name, [catSlug, subSlug]] of Object.entries(LEGACY_KIDS_MAP)) {
    const dst = kidsSub.get(`${catSlug}/${subSlug}`);
    const oldSub = oldKids?.subcategories.find(s => s.name === name);
    if (oldSub && dst) { const r = await mergeSub(db, oldSub, dst); stats.mergedSubs++; stats.movedVideos += r.videos; }
    const legacyCat = await db.category.findUnique({ where: { name } });
    if (legacyCat && !kidsSlugs.has(legacyCat.slug) && dst) {
      await db.category.update({ where: { id: legacyCat.id }, data: { active: false, retiredAt: legacyCat.retiredAt ?? new Date(), mergedIntoId: `sub:${dst.id}`, sortOrder: 900 } });
    }
  }

  // 3) retire every category that isn't part of the kids taxonomy (adult topics included)
  const cartoons = await db.category.findUnique({ where: { slug: "cartoons-animation" } });
  const others = await db.category.findMany({ where: { slug: { notIn: [...kidsSlugs] } } });
  for (const o of others) {
    if (!o.retiredAt || o.active) stats.retiredCategories++;
    await db.category.update({
      where: { id: o.id },
      data: { active: false, retiredAt: o.retiredAt ?? new Date(), sortOrder: Math.max(o.sortOrder, 900), ...(o.slug === "kids-cartoons" && cartoons ? { mergedIntoId: cartoons.id } : {}) },
    });
  }
  const liveCatIds = new Set((await db.category.findMany({ where: { slug: { in: [...kidsSlugs] } }, select: { id: true } })).map(c => c.id));

  // 4) videos: drop tags in retired categories when a kids tag remains; otherwise queue for review
  const tagged = await db.videoCategoryAssignment.findMany({ where: { categoryId: { notIn: [...liveCatIds] } }, select: { videoId: true } });
  for (const videoId of new Set(tagged.map(t => t.videoId))) {
    const cur = await db.videoCategoryAssignment.findMany({ where: { videoId }, orderBy: { priority: "asc" } });
    const keep = cur.filter(a => liveCatIds.has(a.categoryId));
    if (keep.length) { await rewriteTags(db, videoId, keep); stats.cleanedVideos++; }
    else {
      await db.video.update({ where: { id: videoId }, data: { tagStatus: "NEEDS_REVIEW", tagFlagReason: "Its categories were retired when the app became kids-only (ages 3–8) — please choose kids categories or remove the video." } });
      stats.needsReview++;
    }
  }

  // 5) viewer interests and channel preferences in retired categories go away (the kids ones stay)
  const subIds = new Set([...kidsSub.values()].map(s => s.id));
  const d1 = await db.userSubcategoryPreference.deleteMany({ where: { subcategoryId: { notIn: [...subIds] } } });
  const d2 = await db.userCategoryPreference.deleteMany({ where: { categoryId: { notIn: [...liveCatIds] } } });
  await db.channelCategoryPreference.deleteMany({ where: { categoryId: { notIn: [...liveCatIds] } } });
  stats.droppedInterests = d1.count + d2.count;
  await db.userRecommendationPreference.updateMany({ data: { prefsVersion: { increment: 1 } } });

  delete stats.converting;
  await db.taxonomyAuditLog.create({ data: { actorId: SYSTEM.id, actorEmail: SYSTEM.email, action: "KIDS_TAXONOMY_APPLIED", entityType: "TAXONOMY", after: JSON.stringify(stats) } });
  await db.platformSetting.create({ data: { key: KIDS_FLAG, value: JSON.stringify({ version: 1, at: new Date().toISOString(), audience: "3-8" }) } });
  log(`kids taxonomy: ${JSON.stringify(stats)}`);
  return stats;
}

// Existing videos without tags: controlled backfill, always flagged for admin confirmation.
// Language: the demo cartoons have English titles/on-screen text and music-only audio → English.
// Videos whose original category is unknown get NO guessed tags — they go to the review queue instead.
export async function backfillVideoTags(db, log = console.log) {
  const english = await db.language.findUnique({ where: { code: "en" } });
  if (!english) throw new Error("run seedDiscovery first");
  const videos = await db.video.findMany({ where: { tags: { none: {} } }, select: { id: true, contentId: true, category: true } });
  let tagged = 0, queued = 0;
  for (const v of videos) {
    const [catSlug, subSlug] = LEGACY_KIDS_MAP[v.category] ?? [];
    const cat = catSlug ? await db.category.findUnique({ where: { slug: catSlug } }) : null;
    const sub = cat ? await db.subcategory.findUnique({ where: { categoryId_slug: { categoryId: cat.id, slug: subSlug } } }) : null;
    if (!cat || !sub) {
      await db.video.update({ where: { id: v.id }, data: { tagStatus: "NEEDS_REVIEW", tagFlagReason: "No language or categories yet — please tag this video." } });
      queued++;
      continue;
    }
    await db.$transaction([
      db.videoCategoryAssignment.create({ data: { videoId: v.id, categoryId: cat.id, subcategoryId: sub.id, priority: 1, source: "BACKFILL" } }),
      db.videoLanguage.create({ data: { videoId: v.id, languageId: english.id, position: 1, isPrimary: true, source: "BACKFILL" } }),
      db.video.update({ where: { id: v.id }, data: { category: sub.name, tagStatus: "NEEDS_REVIEW", tagFlagReason: "Backfilled from the original kids category — please confirm language and categories.", tagsUpdatedAt: new Date() } }),
      db.taxonomyAuditLog.create({
        data: { actorId: SYSTEM.id, actorEmail: SYSTEM.email, action: "VIDEO_TAGS_BACKFILLED", entityType: "VIDEO_TAGS", entityId: v.contentId, after: JSON.stringify({ languages: ["en"], tags: [{ priority: 1, categoryId: cat.id, subcategoryId: sub.id }] }) },
      }),
    ]);
    tagged++;
  }
  log(`video backfill: ${tagged} tagged (needs review), ${queued} queued without tags`);
  return { tagged, queued };
}

export { LEGACY_KIDS_CATEGORIES };

// CLI
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const db = new PrismaClient();
  try {
    await seedDiscovery(db);
    await applyKidsTaxonomy(db);
    await backfillVideoTags(db);
  } finally {
    await db.$disconnect();
  }
}
