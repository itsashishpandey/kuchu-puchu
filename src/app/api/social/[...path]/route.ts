import { db } from "@/lib/db";
import { getSessionUser, viewerKeyFromRequest, jsonError } from "@/lib/auth";
import { evaluateQualifiedView, creditViewEarning } from "@/lib/monetization";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

async function getVideoOr404(id: string) {
  const v = await db.video.findFirst({ where: { OR: [{ id }, { contentId: id }] } });
  return v;
}

export async function POST(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg, id] = segs;
  const viewerKey = viewerKeyFromRequest(req);
  const me = await getSessionUser();

  // ── VIEW (qualified-view engine) ──────────────────────────────────────
  if (segs.length === 2 && seg === "view") {
    if (!rateLimit(`view:${viewerKey}`, 120, 60_000)) {
      return jsonError("Too many view events", 429);
    }
    const body = await req.json().catch(() => ({}));
    const watchSeconds = Number(body?.watchSeconds ?? 0);
    const video = await getVideoOr404(id);
    if (!video) return jsonError("Video not found", 404);

    const result = await evaluateQualifiedView({
      video: {
        id: video.id, creatorId: video.creatorId, status: video.status,
        monetizationEnabled: video.monetizationEnabled,
        earningExpiresAt: video.earningExpiresAt, publishedAt: video.publishedAt,
        contentId: video.contentId,
      },
      viewerKey,
      viewerUserId: me?.id ?? null,
      watchSeconds,
      userAgent: req.headers.get("user-agent") || "",
    });

    await db.viewEvent.create({
      data: {
        videoId: video.id, viewerKey, isSelf: !!me && me.id === video.creatorId,
        qualified: result.qualified, reason: result.reason ?? null, watchSeconds,
      },
    });

    let credited = false;
    if (result.qualified) {
      const entry = await creditViewEarning({
        userId: video.creatorId, videoId: video.id, contentId: video.contentId,
      });
      credited = !!entry;
      await db.video.update({
        where: { id: video.id },
        data: { views: { increment: 1 }, qualifiedViews: { increment: 1 } },
      });
    } else {
      await db.video.update({ where: { id: video.id }, data: { views: { increment: 1 } } });
    }

    return Response.json({ qualified: result.qualified, reason: result.reason ?? null, credited });
  }

  // ── LIKE / UNLIKE ─────────────────────────────────────────────────────
  if (segs.length === 2 && seg === "like") {
    if (!rateLimit(`like:${viewerKey}`, 60, 60_000)) return jsonError("Too many actions", 429);
    const video = await getVideoOr404(id);
    if (!video || video.status !== "APPROVED") return jsonError("Video not found", 404);
    const existing = await db.videoLike.findFirst({
      where: { videoId: video.id, ...(me ? { userId: me.id } : { guestKey: viewerKey, userId: null }) },
    });
    if (existing) {
      await db.videoLike.delete({ where: { id: existing.id } });
      await db.video.update({ where: { id: video.id }, data: { likes: { decrement: 1 } } });
      return Response.json({ liked: false, likes: Math.max(0, video.likes - 1) });
    }
    await db.videoLike.create({
      data: { videoId: video.id, userId: me?.id ?? null, guestKey: viewerKey },
    });
    await db.video.update({ where: { id: video.id }, data: { likes: { increment: 1 } } });
    return Response.json({ liked: true, likes: video.likes + 1 });
  }

  // ── COMMENT ───────────────────────────────────────────────────────────
  if (segs.length === 2 && seg === "comment") {
    if (!me) return jsonError("Login required to comment", 401);
    if (!rateLimit(`comment:${me.id}`, 20, 60_000)) return jsonError("You're commenting too fast", 429);
    const body = await req.json().catch(() => null);
    const text = String(body?.body || "").trim();
    if (!text || text.length < 1) return jsonError("Comment cannot be empty");
    if (text.length > 500) return jsonError("Comment is too long (max 500 characters)");
    const video = await getVideoOr404(id);
    if (!video || video.status !== "APPROVED") return jsonError("Video not found", 404);
    const comment = await db.comment.create({
      data: {
        videoId: video.id, userId: me.id,
        authorName: me.channel?.name ?? me.name,
        authorAvatar: me.avatarUrl ?? me.channel?.avatarUrl ?? null,
        body: text,
      },
    });
    await db.video.update({ where: { id: video.id }, data: { commentsCount: { increment: 1 } } });
    return Response.json({ comment });
  }

  // ── SHARE ─────────────────────────────────────────────────────────────
  if (segs.length === 2 && seg === "share") {
    const video = await getVideoOr404(id);
    if (!video) return jsonError("Video not found", 404);
    await db.video.update({ where: { id: video.id }, data: { shares: { increment: 1 } } });
    return Response.json({ shares: video.shares + 1 });
  }

  // ── FOLLOW / UNFOLLOW ─────────────────────────────────────────────────
  if (segs.length === 2 && seg === "follow") {
    if (!me) return jsonError("Login required to follow creators", 401);
    const body = await req.json().catch(() => null);
    const channelId = String(body?.channelId || "");
    if (!channelId) return jsonError("Channel required");
    const channel = await db.channel.findUnique({ where: { id: channelId } });
    if (!channel) return jsonError("Channel not found", 404);
    if (channel.userId === me.id) return jsonError("You cannot follow your own channel");
    const existing = await db.follow.findUnique({
      where: { followerId_channelId: { followerId: me.id, channelId } },
    });
    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      await db.channel.update({ where: { id: channelId }, data: { followerCount: { decrement: 1 } } });
      return Response.json({ following: false, followerCount: Math.max(0, channel.followerCount - 1) });
    }
    await db.follow.create({ data: { followerId: me.id, channelId } });
    await db.channel.update({ where: { id: channelId }, data: { followerCount: { increment: 1 } } });
    return Response.json({ following: true, followerCount: channel.followerCount + 1 });
  }

  // ── REPORT ────────────────────────────────────────────────────────────
  if (segs.length === 2 && seg === "report") {
    if (!rateLimit(`report:${viewerKey}`, 10, 60_000)) return jsonError("Too many reports", 429);
    const body = await req.json().catch(() => null);
    const reason = String(body?.reason || "");
    const details = String(body?.details || "").slice(0, 500);
    if (!["COPYRIGHT", "INAPPROPRIATE", "SPAM", "OTHER"].includes(reason)) {
      return jsonError("Invalid report reason");
    }
    const video = await getVideoOr404(id);
    if (!video) return jsonError("Video not found", 404);
    await db.contentReport.create({
      data: { videoId: video.id, reporterKey: viewerKey, reason, details: details || null },
    });
    return Response.json({ ok: true, message: "Report submitted. Our trust & safety team will review it." });
  }

  return jsonError("Not found", 404);
}
