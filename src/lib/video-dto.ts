// One shape for every video card the API returns (feeds, search, saved, channel pages).
// Backward compatible with the existing app/web fields; adds languages, tags and `saved`.
import { COMMENTS_ENABLED } from "@/lib/kids";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Taxonomy } from "@/lib/discovery/types";

export const VIDEO_CARD_INCLUDE = {
  creator: {
    select: {
      id: true, name: true, avatarUrl: true,
      channel: { select: { id: true, username: true, name: true, verified: true, theme: true } },
    },
  },
  languages: {
    select: { position: true, isPrimary: true, language: { select: { code: true, nameEn: true, nameNative: true, direction: true } } },
    orderBy: { position: "asc" },
  },
  tags: { select: { priority: true, categoryId: true, subcategoryId: true }, orderBy: { priority: "asc" } },
} satisfies Prisma.VideoInclude;

export type CardVideo = Prisma.VideoGetPayload<{ include: typeof VIDEO_CARD_INCLUDE }>;

export type ViewerFlags = { liked: Set<string>; followedChannels: Set<string>; saved: Set<string> };

export async function viewerFlags(userId: string | null, guestKey: string, videoIds: string[]): Promise<ViewerFlags> {
  if (!videoIds.length) return { liked: new Set(), followedChannels: new Set(), saved: new Set() };
  const [likes, follows, saves] = await Promise.all([
    db.videoLike.findMany({
      where: { videoId: { in: videoIds }, ...(userId ? { userId } : { guestKey, userId: null }) },
      select: { videoId: true },
    }),
    userId ? db.follow.findMany({ where: { followerId: userId }, select: { channelId: true } }) : Promise.resolve([]),
    userId ? db.savedVideo.findMany({ where: { userId, videoId: { in: videoIds } }, select: { videoId: true } }) : Promise.resolve([]),
  ]);
  return {
    liked: new Set(likes.map(l => l.videoId)),
    followedChannels: new Set(follows.map(f => f.channelId)),
    saved: new Set(saves.map(s => s.videoId)),
  };
}

export function tagLabels(t: Taxonomy | null, tags: { priority: number; categoryId: string; subcategoryId: string }[]) {
  if (!t) return [];
  const cats = new Map(t.categories.map(c => [c.id, c]));
  return tags.map(tag => {
    const c = cats.get(tag.categoryId);
    const s = c?.subcategories.find(x => x.id === tag.subcategoryId);
    return {
      priority: tag.priority,
      category: c ? { id: c.id, slug: c.slug, name: c.name, emoji: c.emoji, color: c.color } : { id: tag.categoryId, slug: "", name: "", emoji: null, color: null },
      subcategory: s ? { id: s.id, slug: s.slug, name: s.name } : { id: tag.subcategoryId, slug: "", name: "" },
    };
  });
}

export function toVideoDTO(v: CardVideo, flags: ViewerFlags, t: Taxonomy | null) {
  const ch = v.creator.channel;
  return {
    id: v.id, contentId: v.contentId, title: v.title, description: v.description,
    category: v.category, hashtags: safeJsonArray(v.hashtags),
    videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl, duration: v.duration,
    views: v.views, qualifiedViews: v.qualifiedViews, likes: v.likes, commentsCount: COMMENTS_ENABLED ? v.commentsCount : 0, commentsEnabled: COMMENTS_ENABLED, shares: v.shares,
    publishedAt: v.publishedAt, featured: v.featured,
    creator: {
      id: v.creator.id, name: v.creator.name, avatarUrl: v.creator.avatarUrl,
      username: ch?.username ?? "", channelName: ch?.name ?? v.creator.name, verified: ch?.verified ?? false,
      theme: ch?.theme ?? "BLUE", channelId: ch?.id ?? null,
    },
    languages: v.languages.map(l => ({ code: l.language.code, nameEn: l.language.nameEn, nameNative: l.language.nameNative, direction: l.language.direction, isPrimary: l.isPrimary })),
    tags: tagLabels(t, v.tags),
    liked: flags.liked.has(v.id),
    following: !!ch && flags.followedChannels.has(ch.id),
    saved: flags.saved.has(v.id),
  };
}

export type VideoDTO = ReturnType<typeof toVideoDTO>;

export function safeJsonArray(s: string | null | undefined): string[] {
  try { const v = JSON.parse(s || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}
