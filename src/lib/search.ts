// Unified search: interprets languages/categories/subcategories in the query (exact matches become
// filters, typos become suggestions), then ranks videos by text relevance + engagement.
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Taxonomy } from "@/lib/discovery/types";
import { interpretQuery, describeInterpretation } from "@/lib/discovery/search-parse";
import { normalize } from "@/lib/discovery/text";
import { VIDEO_CARD_INCLUDE, viewerFlags, toVideoDTO } from "@/lib/video-dto";

export async function searchAll(opts: {
  q: string; explicit: { languages: string[]; categoryId: string | null; subcategoryId: string | null };
  limit: number; offset: number; userId: string | null; guestKey: string; taxonomy: Taxonomy; log: boolean;
}) {
  const q = opts.q.trim().slice(0, 120);
  const interp = interpretQuery(q, opts.taxonomy);
  // explicit filter chips (from the UI) override what was read from the text
  const languages = opts.explicit.languages.length ? opts.explicit.languages : interp.languageCodes;
  const subcategoryId = opts.explicit.subcategoryId ?? (opts.explicit.categoryId ? null : interp.subcategoryId);
  const categoryId = opts.explicit.categoryId ?? interp.categoryId;
  const terms = interp.textTerms.slice(0, 6);

  const [blocked, ni] = opts.userId ? await Promise.all([
    db.blockedCreator.findMany({ where: { userId: opts.userId }, select: { creatorId: true } }),
    db.videoFeedback.findMany({ where: { userId: opts.userId }, select: { videoId: true } }),
  ]) : [[], []];

  const and: Prisma.VideoWhereInput[] = [];
  if (languages.length) and.push({ languages: { some: { language: { code: { in: languages } } } } });
  if (subcategoryId) and.push({ tags: { some: { subcategoryId } } });
  else if (categoryId) and.push({ tags: { some: { categoryId } } });
  for (const t of terms) {
    and.push({ OR: [
      { title: { contains: t } }, { description: { contains: t } }, { hashtags: { contains: t } },
      { channel: { name: { contains: t } } }, { channel: { username: { contains: t } } },
    ] });
  }
  if (blocked.length) and.push({ creatorId: { notIn: blocked.map(b => b.creatorId) } });
  if (ni.length) and.push({ id: { notIn: ni.map(n => n.videoId) } });
  const where: Prisma.VideoWhereInput = { status: "APPROVED", AND: and };

  const hasFilter = !!(languages.length || categoryId || subcategoryId || terms.length);
  const rows = hasFilter ? await db.video.findMany({ where, take: 300, include: VIDEO_CARD_INCLUDE, orderBy: { publishedAt: "desc" } }) : [];
  // relevance: title > channel/hashtag > description, then engagement and recency
  const scored = rows.map(v => {
    const title = normalize(v.title), desc = normalize(v.description), tags = v.hashtags.toLowerCase();
    const ch = normalize(`${v.creator.channel?.name ?? ""} ${v.creator.channel?.username ?? ""}`);
    let s = 0;
    for (const t of terms) { if (title.includes(t)) s += 3; if (tags.includes(t)) s += 2; if (ch.includes(t)) s += 2; if (desc.includes(t)) s += 1; }
    s += Math.min(2, Math.log10(1 + v.qualifiedViews) / 3);
    return { v, s };
  }).sort((a, b) => b.s - a.s);
  const page = scored.slice(opts.offset, opts.offset + opts.limit).map(x => x.v);
  const flags = await viewerFlags(opts.userId, opts.guestKey, page.map(v => v.id));

  // creators whose channel matches the free text
  const creators = terms.length ? await db.channel.findMany({
    where: { user: { status: "APPROVED" }, OR: terms.flatMap(t => [{ name: { contains: t } }, { username: { contains: t } }]) },
    take: 6, orderBy: { followerCount: "desc" },
    select: { username: true, name: true, avatarUrl: true, verified: true, followerCount: true },
  }) : [];

  if (opts.log && q.length >= 2 && opts.offset === 0) {
    db.searchLog.create({
      data: {
        query: q, normalized: normalize(q).slice(0, 120), resultCount: scored.length,
        interpreted: JSON.stringify({ languages, categoryId, subcategoryId, terms }),
      },
    }).catch(() => {});
  }

  const described = describeInterpretation({ ...interp, languageCodes: languages, categoryId, subcategoryId }, opts.taxonomy);
  return {
    query: q,
    interpretation: { ...described, text: terms.join(" "), suggestions: interp.suggestions },
    videos: page.map(v => toVideoDTO(v, flags, opts.taxonomy)),
    creators: creators.map(c => ({ username: c.username, channelName: c.name, avatarUrl: c.avatarUrl, verified: c.verified, followerCount: c.followerCount })),
    total: scored.length,
    nextOffset: opts.offset + opts.limit < scored.length ? opts.offset + opts.limit : null,
  };
}
