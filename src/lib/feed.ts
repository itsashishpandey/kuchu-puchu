// Feeds: For You (personalized), Trending, Explore (newest), Following — all with optional language,
// category and subcategory filters, and all respecting blocked creators / not-interested videos.
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { RecoSettings, Taxonomy } from "@/lib/discovery/types";
import { rankFeed, emptyProfile, type Candidate, type Profile } from "@/lib/discovery/rank";
import { normalizeRecoSettings, experimentBucket } from "@/lib/discovery/reco-config";
import { loadRankingProfile } from "@/lib/preferences";
import { VIDEO_CARD_INCLUDE, viewerFlags, toVideoDTO, type VideoDTO } from "@/lib/video-dto";

const DAY = 864e5;

// ── recommendation config (active + optional experiment), cached briefly ──
let configCache: { at: number; active: { version: number; settings: RecoSettings }; experiment: { version: number; settings: RecoSettings; percent: number } | null } | null = null;
export function invalidateRecoConfig() { configCache = null; }

export async function recoConfigFor(userKey: string) {
  if (!configCache || Date.now() - configCache.at > 60_000) {
    const rows = await db.recommendationConfig.findMany({ where: { status: { in: ["ACTIVE", "EXPERIMENT"] } }, orderBy: { version: "desc" } });
    const act = rows.find(r => r.status === "ACTIVE");
    const exp = rows.find(r => r.status === "EXPERIMENT");
    const parse = (s?: string) => normalizeRecoSettings(s ? JSON.parse(s) : {}).settings;
    configCache = {
      at: Date.now(),
      active: { version: act?.version ?? 0, settings: parse(act?.settings) },
      experiment: exp && exp.experimentPercent > 0 ? { version: exp.version, settings: parse(exp.settings), percent: exp.experimentPercent } : null,
    };
  }
  const c = configCache;
  if (c.experiment && experimentBucket(userKey) < c.experiment.percent) return { ...c.experiment, variant: "experiment" as const };
  return { ...c.active, variant: "active" as const };
}

export type FeedFilters = {
  languages: string[]; // codes
  categoryId: string | null;
  subcategoryId: string | null;
  q?: string;
};

function filterWhere(f: FeedFilters, exclude: { creatorIds: string[]; videoIds: string[] }): Prisma.VideoWhereInput {
  const where: Prisma.VideoWhereInput = { status: "APPROVED" };
  const and: Prisma.VideoWhereInput[] = [];
  if (f.languages.length) and.push({ languages: { some: { language: { code: { in: f.languages } } } } });
  if (f.subcategoryId) and.push({ tags: { some: { subcategoryId: f.subcategoryId } } });
  else if (f.categoryId) and.push({ tags: { some: { categoryId: f.categoryId } } });
  if (f.q) {
    const q = f.q.toLowerCase().replace(/^#/, "");
    and.push({ OR: [{ title: { contains: q } }, { description: { contains: q } }, { hashtags: { contains: q } }] });
  }
  if (exclude.creatorIds.length) and.push({ creatorId: { notIn: exclude.creatorIds } });
  if (exclude.videoIds.length) and.push({ id: { notIn: exclude.videoIds } });
  if (and.length) where.AND = and;
  return where;
}

async function exclusionsFor(userId: string | null) {
  if (!userId) return { creatorIds: [] as string[], videoIds: [] as string[] };
  const [blocked, ni] = await Promise.all([
    db.blockedCreator.findMany({ where: { userId }, select: { creatorId: true } }),
    db.videoFeedback.findMany({ where: { userId, kind: "NOT_INTERESTED" }, select: { videoId: true } }),
  ]);
  return { creatorIds: blocked.map(b => b.creatorId), videoIds: ni.map(n => n.videoId) };
}

async function toDTOs(ids: string[], userId: string | null, guestKey: string, t: Taxonomy | null): Promise<VideoDTO[]> {
  if (!ids.length) return [];
  const rows = await db.video.findMany({ where: { id: { in: ids } }, include: VIDEO_CARD_INCLUDE });
  const byId = new Map(rows.map(r => [r.id, r]));
  const flags = await viewerFlags(userId, guestKey, ids);
  return ids.map(id => byId.get(id)).filter(Boolean).map(v => toVideoDTO(v!, flags, t));
}

/** Trending / explore / following with filters (offset paging). */
export async function listFeed(opts: {
  feed: "trending" | "explore" | "following"; filters: FeedFilters; limit: number; offset: number;
  userId: string | null; guestKey: string; taxonomy: Taxonomy | null; legacyCategory?: string | null;
}) {
  const exclude = await exclusionsFor(opts.userId);
  const where = filterWhere(opts.filters, exclude);
  if (opts.legacyCategory) where.category = opts.legacyCategory;
  if (opts.feed === "trending") where.publishedAt = { gte: new Date(Date.now() - 30 * DAY) };
  if (opts.feed === "following") {
    if (!opts.userId) return { error: "Login required" as const };
    const follows = await db.follow.findMany({ where: { followerId: opts.userId }, select: { channel: { select: { userId: true } } } });
    const ids = follows.map(f => f.channel.userId);
    if (!ids.length) return { videos: [], nextOffset: null };
    where.creatorId = { in: ids };
  }
  const orderBy: Prisma.VideoOrderByWithRelationInput[] = opts.feed === "trending" ? [{ views: "desc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "asc" }];
  const rows = await db.video.findMany({ where, orderBy, take: opts.limit, skip: opts.offset, select: { id: true } });
  const videos = await toDTOs(rows.map(r => r.id), opts.userId, opts.guestKey, opts.taxonomy);
  return { videos, nextOffset: rows.length === opts.limit ? opts.offset + opts.limit : null };
}

// ── For You ──
const rankedCache = new Map<string, { at: number; ids: string[]; tiers: number[] }>();
const RANKED_TTL = 5 * 60_000;

async function loadCandidates(filters: FeedFilters, profile: Profile, discovery: boolean): Promise<Candidate[]> {
  const langFilter = filters.languages.length ? filters.languages : discovery ? [] : profile.languages;
  const where = filterWhere({ ...filters, languages: langFilter }, { creatorIds: [...profile.blockedCreatorIds], videoIds: [...profile.notInterestedVideoIds] });
  where.publishedAt = { not: null };
  const rows = await db.video.findMany({
    where, take: 2000, orderBy: [{ publishedAt: "desc" }],
    select: {
      id: true, contentId: true, creatorId: true, publishedAt: true, views: true, qualifiedViews: true, likes: true,
      commentsCount: true, shares: true,
      languages: { select: { language: { select: { code: true } } }, orderBy: { position: "asc" } },
      tags: { select: { categoryId: true, subcategoryId: true, priority: true } },
    },
  });
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const [saves, completions, viewsWithLength, fraud, reports, firstPublish] = await Promise.all([
    db.savedVideo.groupBy({ by: ["videoId"], where: { videoId: { in: ids } }, _count: { _all: true } }),
    db.videoInteractionEvent.groupBy({ by: ["videoId"], where: { videoId: { in: ids }, type: "COMPLETE", suspicious: false }, _count: { _all: true } }),
    db.videoInteractionEvent.groupBy({ by: ["videoId"], where: { videoId: { in: ids }, type: "VIEW", suspicious: false }, _count: { _all: true } }),
    db.fraudFlag.findMany({ where: { status: "OPEN", severity: "HIGH", videoId: { in: rows.map(r => r.contentId) } }, select: { videoId: true } }),
    db.contentReport.groupBy({ by: ["videoId"], where: { videoId: { in: ids }, status: "OPEN" }, _count: { _all: true } }),
    db.video.groupBy({ by: ["creatorId"], where: { status: "APPROVED", publishedAt: { not: null } }, _min: { publishedAt: true } }),
  ]);
  const count = (arr: { videoId: string; _count: { _all: number } }[]) => new Map(arr.map(a => [a.videoId, a._count._all]));
  const saveMap = count(saves), compMap = count(completions), viewMap = count(viewsWithLength), repMap = count(reports);
  const fraudSet = new Set(fraud.map(f => f.videoId));
  const firstPub = new Map(firstPublish.map(f => [f.creatorId, f._min.publishedAt?.getTime() ?? null]));
  return rows.map(r => {
    const v = viewMap.get(r.id) ?? 0;
    return {
      id: r.id, creatorId: r.creatorId, publishedAt: r.publishedAt!.getTime(),
      languageCodes: r.languages.map(l => l.language.code), tags: r.tags,
      views: r.views, qualifiedViews: r.qualifiedViews, likes: r.likes, comments: r.commentsCount, shares: r.shares,
      saves: saveMap.get(r.id) ?? 0, completionRate: v >= 5 ? Math.min(1, (compMap.get(r.id) ?? 0) / v) : null,
      highFraud: fraudSet.has(r.contentId), reportCount: repMap.get(r.id) ?? 0, creatorApprovedAt: firstPub.get(r.creatorId) ?? null,
    };
  });
}

export async function forYouFeed(opts: {
  userId: string | null; guestKey: string; guestLanguages: string[]; filters: FeedFilters;
  limit: number; offset: number; taxonomy: Taxonomy | null; fresh?: boolean;
}) {
  const userKey = opts.userId ?? `guest:${opts.guestKey}`;
  const { profile, prefsVersion } = await loadRankingProfile(opts.userId, { languages: opts.guestLanguages });
  // a viewer's explicit language filter narrows (never widens) their feed
  if (opts.filters.languages.length) profile.languages = opts.filters.languages;
  const config = await recoConfigFor(userKey);
  const day = new Date().toISOString().slice(0, 10);
  const cacheKey = JSON.stringify([userKey, prefsVersion, config.version, opts.filters, profile.languages, day]);
  let entry = rankedCache.get(cacheKey);
  if (opts.fresh || opts.offset === 0 || !entry || Date.now() - entry.at > RANKED_TTL) {
    const candidates = await loadCandidates(opts.filters, profile, profile.discoverOtherLanguages);
    const ranked = rankFeed(candidates, profile, config.settings, { now: Date.now(), seed: `${userKey}:${day}` });
    entry = { at: Date.now(), ids: ranked.map(r => r.id), tiers: ranked.map(r => r.tier) };
    rankedCache.set(cacheKey, entry);
    if (rankedCache.size > 2000) rankedCache.delete(rankedCache.keys().next().value!);
  }
  const ids = entry.ids.slice(opts.offset, opts.offset + opts.limit);
  const videos = await toDTOs(ids, opts.userId, opts.guestKey, opts.taxonomy);
  const tiers = entry.tiers.slice(opts.offset, opts.offset + opts.limit);
  let emptyReason: string | null = null;
  if (opts.offset === 0 && !videos.length) {
    emptyReason = profile.languages.length && !profile.discoverOtherLanguages ? "NO_VIDEOS_IN_YOUR_LANGUAGES" : "NO_VIDEOS";
  }
  return {
    videos,
    nextOffset: opts.offset + opts.limit < entry.ids.length ? opts.offset + opts.limit : null,
    meta: {
      feed: "foryou", languages: profile.languages, discoverOtherLanguages: profile.discoverOtherLanguages,
      personalized: !!opts.userId && (profile.categoryIds.size + profile.subcategoryIds.size > 0),
      tiers, emptyReason, configVersion: config.version, variant: config.variant,
    },
  };
}

export function clearRankedCacheFor(userId: string) {
  for (const k of rankedCache.keys()) if (k.startsWith(`["${userId}"`)) rankedCache.delete(k);
}

export function clearAllRankedCache() { rankedCache.clear(); }

/** Admin preview: how the live catalogue ranks for a hypothetical viewer under the given settings. */
export async function previewRanking(
  spec: { languages: string[]; categoryIds: string[]; subcategoryIds: string[]; discoverOtherLanguages: boolean },
  settings: RecoSettings, taxonomy: Taxonomy, limit = 30,
) {
  const profile = emptyProfile(spec.languages);
  spec.categoryIds.forEach(id => profile.categoryIds.add(id));
  spec.subcategoryIds.forEach(id => profile.subcategoryIds.add(id));
  profile.discoverOtherLanguages = spec.discoverOtherLanguages;
  const candidates = await loadCandidates({ languages: [], categoryId: null, subcategoryId: null }, profile, profile.discoverOtherLanguages);
  const ranked = rankFeed(candidates, profile, settings, { now: Date.now(), seed: "preview:" + new Date().toISOString().slice(0, 10) }).slice(0, limit);
  const rows = await db.video.findMany({ where: { id: { in: ranked.map(r => r.id) } }, include: VIDEO_CARD_INCLUDE });
  const byId = new Map(rows.map(r => [r.id, r]));
  const none = { liked: new Set<string>(), followedChannels: new Set<string>(), saved: new Set<string>() };
  return ranked.filter(r => byId.has(r.id)).map((r, i) => {
    const d = toVideoDTO(byId.get(r.id)!, none, taxonomy);
    return { position: i + 1, contentId: d.contentId, title: d.title, thumbnailUrl: d.thumbnailUrl, channelName: d.creator.channelName, languages: d.languages, tags: d.tags, score: Math.round(r.score * 10) / 10, tier: r.tier, reasons: r.reasons };
  });
}
