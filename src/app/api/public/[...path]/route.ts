import { db } from "@/lib/db";
import { getSessionUser, viewerKeyFromRequest, jsonError } from "@/lib/auth";
import { getMonetizationSettings } from "@/lib/monetization";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const url = new URL(req.url);
  const [seg, second] = segs;

  // GET /api/public/stats — live platform counters (real DB aggregates)
  if (seg === "stats") {
    const [creators, approved, active, videos, viewsAgg, qualAgg, paidAgg, pendingPayouts] =
      await Promise.all([
        db.user.count({ where: { role: "CREATOR" } }),
        db.user.count({ where: { role: "CREATOR", status: "APPROVED" } }),
        db.user.count({ where: { role: "CREATOR", status: "APPROVED", updatedAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
        db.video.count(),
        db.video.aggregate({ _sum: { views: true } }),
        db.video.aggregate({ _sum: { qualifiedViews: true } }),
        db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
        db.ledgerEntry.aggregate({ _sum: { amount: true }, where: { type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } } }),
      ]);
    return Response.json({
      totalCreators: creators,
      approvedCreators: approved,
      activeCreators: active,
      totalVideos: videos,
      totalViews: viewsAgg._sum.views ?? 0,
      qualifiedViews: qualAgg._sum.qualifiedViews ?? 0,
      totalPaidOut: paidAgg._sum.amount ?? 0,
      lifetimeCreatorEarnings: pendingPayouts._sum.amount ?? 0,
    });
  }

  // GET /api/public/settings — public rates + homepage config
  if (seg === "settings") {
    const settings = await getMonetizationSettings();
    const branding = await db.platformSetting.findUnique({ where: { key: "branding" } });
    const homepage = await db.platformSetting.findUnique({ where: { key: "homepage" } });
    return Response.json({
      ratePer1000Views: settings.ratePer1000Views,
      rewardPerUpload: settings.rewardPerUpload,
      monetizationDurationMonths: settings.monetizationDurationMonths,
      minWithdrawalAmount: settings.minWithdrawalAmount,
      monetizationPaused: settings.monetizationPaused,
      branding: branding ? JSON.parse(branding.value) : null,
      homepage: homepage ? JSON.parse(homepage.value) : null,
    });
  }

  // GET /api/public/videos/:id — single video with comments
  if (seg === "videos" && second) {
    const v = await db.video.findFirst({
      where: { OR: [{ id: second }, { contentId: second }] },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true, channel: true } },
        comments: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!v || v.status !== "APPROVED") return jsonError("Video not found", 404);
    const me = await getSessionUser();
    const guestKey = viewerKeyFromRequest(req);
    const liked = me
      ? !!(await db.videoLike.findFirst({ where: { videoId: v.id, userId: me.id } }))
      : !!(await db.videoLike.findFirst({ where: { videoId: v.id, guestKey } }));
    const following = me ? !!(await db.follow.findFirst({ where: { followerId: me.id, channelId: v.creator.channel.id } })) : false;
    return Response.json({
      video: {
        ...v, hashtags: JSON.parse(v.hashtags || "[]"),
        creator: {
          id: v.creator.id, name: v.creator.name, avatarUrl: v.creator.avatarUrl,
          username: v.creator.channel.username, channelName: v.creator.channel.name,
          verified: v.creator.channel.verified, followerCount: v.creator.channel.followerCount,
          description: v.creator.channel.description,
        },
        comments: v.comments,
        liked, following,
      },
    });
  }

  // GET /api/public/videos?feed=trending|explore|following&category=&q=&limit=
  if (seg === "videos") {
    const feed = url.searchParams.get("feed") || "explore";
    const category = url.searchParams.get("category") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(48, parseInt(url.searchParams.get("limit") || "24", 10));

    const where: Record<string, unknown> = { status: "APPROVED" };
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q } }, { description: { contains: q } },
        { hashtags: { contains: q.replace(/^#/, "") } },
      ];
    }
    if (feed === "trending") {
      where.publishedAt = { gte: new Date(Date.now() - 30 * 864e5) };
    }
    if (feed === "following") {
      const user = await getSessionUser();
      if (!user) return jsonError("Login required", 401);
      const follows = await db.follow.findMany({ where: { followerId: user.id } });
      const ids = follows.map(f => f.channelId);
      if (ids.length === 0) return Response.json({ videos: [] });
      where.creatorId = { in: ids };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (feed === "trending") orderBy = { views: "desc" };

    const videos = await db.video.findMany({
      where, orderBy, take: limit,
      include: {
        creator: {
          select: {
            id: true, name: true, avatarUrl: true,
            channel: { select: { username: true, name: true, verified: true } },
          },
        },
      },
    });

    const me = await getSessionUser();
    const guestKey = viewerKeyFromRequest(req);
    let likedIds = new Set<string>();
    let followedIds = new Set<string>();
    if (me) {
      const likes = await db.videoLike.findMany({ where: { userId: me.id }, select: { videoId: true } });
      likedIds = new Set(likes.map(l => l.videoId));
      const follows = await db.follow.findMany({ where: { followerId: me.id }, select: { channelId: true } });
      followedIds = new Set(follows.map(f => f.channelId));
    } else {
      const likes = await db.videoLike.findMany({ where: { guestKey }, select: { videoId: true } });
      likedIds = new Set(likes.map(l => l.videoId));
    }

    return Response.json({
      videos: videos.map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, description: v.description,
        category: v.category, hashtags: JSON.parse(v.hashtags || "[]"),
        videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl, duration: v.duration,
        views: v.views, qualifiedViews: v.qualifiedViews, likes: v.likes,
        commentsCount: v.commentsCount, shares: v.shares,
        publishedAt: v.publishedAt, featured: v.featured,
        creator: {
          id: v.creator.id, name: v.creator.name, avatarUrl: v.creator.avatarUrl,
          username: v.creator.channel?.username ?? "", channelName: v.creator.channel?.name ?? v.creator.name,
          verified: v.creator.channel?.verified ?? false,
        },
        liked: likedIds.has(v.id),
        following: followedIds.has(v.creator.id),
      })),
    });
  }

  // GET /api/public/creator/:username — public channel page
  if (seg === "creator" && second) {
    const channel = await db.channel.findUnique({
      where: { username: second },
      include: {
        user: {
          select: {
            id: true, name: true, avatarUrl: true, status: true, createdAt: true,
            videos: {
              where: { status: "APPROVED" },
              orderBy: { publishedAt: "desc" },
              include: {},
            },
          },
        },
      },
    });
    if (!channel || channel.user.status !== "APPROVED") return jsonError("Creator not found", 404);
    const earningsConsent = channel.showEarnings;
    let verifiedEarnings: number | null = null;
    if (earningsConsent) {
      const agg = await db.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: { userId: channel.user.id, type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } },
      });
      verifiedEarnings = Math.round((agg._sum.amount ?? 0) * 100) / 100;
    }
    const me = await getSessionUser();
    const following = me ? !!(await db.follow.findFirst({ where: { followerId: me.id, channelId: channel.id } })) : false;
    return Response.json({
      channel: {
        id: channel.id,
        name: channel.name, username: channel.username, description: channel.description,
        avatarUrl: channel.avatarUrl, bannerUrl: channel.bannerUrl, category: channel.category,
        country: channel.country, socialLinks: channel.socialLinks ? JSON.parse(channel.socialLinks) : null,
        followerCount: channel.followerCount, verified: channel.verified,
        joinedAt: channel.user.createdAt, showEarnings: channel.showEarnings,
        verifiedEarnings,
        videos: channel.user.videos.map(v => ({
          id: v.id, contentId: v.contentId, title: v.title, thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl, duration: v.duration, views: v.views, likes: v.likes,
          category: v.category, publishedAt: v.publishedAt,
        })),
        following,
      },
    });
  }

  // GET /api/public/categories
  if (seg === "categories") {
    const categories = await db.category.findMany({
      where: { active: true }, orderBy: { name: "asc" },
    });
    const withCounts = await Promise.all(
      categories.map(async c => ({
        ...c,
        videoCount: await db.video.count({ where: { category: c.name, status: "APPROVED" } }),
      }))
    );
    return Response.json({ categories: withCounts });
  }

  // GET /api/public/check-username?username=
  if (seg === "check-username") {
    const username = (url.searchParams.get("username") || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return Response.json({ available: false, reason: "Username must be 3–20 characters (a–z, 0–9, _)" });
    }
    const taken = await db.channel.findUnique({ where: { username } });
    return Response.json({ available: !taken, reason: taken ? "This username is already taken" : null });
  }

  // GET /api/public/top-creators — leaderboard (only with earnings consent)
  if (seg === "top-creators") {
    const channels = await db.channel.findMany({
      where: { user: { status: "APPROVED" }, showEarnings: true },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    const list = await Promise.all(
      channels.map(async c => {
        const agg = await db.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: { userId: c.user.id, type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } },
        });
        const videoCount = await db.video.count({ where: { creatorId: c.user.id, status: "APPROVED" } });
        return {
          username: c.username, channelName: c.name, avatarUrl: c.avatarUrl,
          category: c.category, verified: c.verified, followerCount: c.followerCount,
          videoCount, verifiedEarnings: Math.round((agg._sum.amount ?? 0) * 100) / 100,
        };
      })
    );
    list.sort((a, b) => b.verifiedEarnings - a.verifiedEarnings);
    return Response.json({ creators: list.slice(0, 8) });
  }

  return jsonError("Not found", 404);
}

export async function POST(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const ip = clientIp(req);

  if (seg === "newsletter") {
    if (!rateLimit(`news:${ip}`, 5)) return jsonError("Too many attempts", 429);
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError("Please enter a valid email address");
    const exists = await db.newsletterSubscriber.findUnique({ where: { email } });
    if (exists) return Response.json({ ok: true, message: "You're already on the list!" });
    await db.newsletterSubscriber.create({ data: { email } });
    return Response.json({ ok: true, message: "Subscribed! Creator tips land in your inbox weekly." });
  }

  if (seg === "contact") {
    if (!rateLimit(`contact:${ip}`, 5)) return jsonError("Too many attempts", 429);
    const body = await req.json().catch(() => null);
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const category = String(body?.category || "").trim();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();
    if (!name || !email || !category || !subject || !message) return jsonError("All fields are required");
    if (message.length < 10) return jsonError("Please describe your question in a bit more detail");
    await db.contactMessage.create({ data: { name, email, category, subject, message } });
    await db.mailLog.create({
      data: {
        toEmail: email, subject: "We received your message — Clipora Support",
        body: `Hi ${name}, thanks for reaching out about "${subject}". Our team replies within one business day.`,
      },
    });
    return Response.json({ ok: true, message: "Message sent! We reply within one business day." });
  }

  return jsonError("Not found", 404);
}
