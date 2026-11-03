import { COMMENTS_ENABLED, COMMENTS_OFF_MESSAGE } from "@/lib/kids";
import { db } from "@/lib/db";
import { getSessionUser, viewerKeyFromRequest, jsonError } from "@/lib/auth";
import { evaluateQualifiedView, creditViewEarning, NOT_COUNTED_REASONS } from "@/lib/monetization";
import { rateLimit } from "@/lib/rate-limit";
import { recordInteraction } from "@/lib/interactions";
import { clearRankedCacheFor } from "@/lib/feed";

const ACTIONS = new Set(["view", "complete", "like", "comment", "share", "follow", "report", "save", "not-interested", "hide-creator"]);
// views from these outcomes are excluded from recommendation learning
const SUSPICIOUS = new Set(["BOT_USER_AGENT", "CREATOR_SELF_VIEW", "DUPLICATE_VIEWER_DAILY_CAP"]);


export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

async function getVideoOr404(id: string) {
  const v = await db.video.findFirst({ where: { OR: [{ id }, { contentId: id }] } });
  return v;
}

export async function POST(req: Request, ctx: Ctx) {
  const { path: raw } = await ctx.params;
  // canonical form is /social/<action>/<id>; the website historically sent /social/<id>/<action>
  const segs = raw.length === 2 && !ACTIONS.has(raw[0]) && ACTIONS.has(raw[1]) ? [raw[1], raw[0]] : raw;
  const [seg, id] = segs;
  const viewerKey = viewerKeyFromRequest(req);
  const me = await getSessionUser();

  // ── VIEW (qualified-view engine) ──────────────────────────────────────
  if (segs.length === 2 && seg === "view") {
    if (!rateLimit(`view:${viewerKey}`, 120, 60_000)) {
      return jsonError("Too many view events", 429);
    }
    const body = await req.json().catch(() => ({}));
    const watchSeconds = Math.max(0, Math.min(3600, Number(body?.watchSeconds ?? 0) || 0));
    const video = await getVideoOr404(id);
    // only published videos count (views on pending/rejected videos never reach totals or earnings)
    if (!video || video.status !== "APPROVED") return jsonError("Video not found", 404);
    const durationSeconds = Number(body?.durationSeconds) > 0 ? Math.min(3600, Number(body.durationSeconds)) : video.duration || null;

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
        durationSeconds, userId: me?.id ?? null,
        // no country (or any location) is stored for views: kids' platform, nothing location-based is collected
      },
    });
    await recordInteraction({
      videoId: video.id, userId: me?.id ?? null, viewerKey, type: "VIEW", watchSeconds,
      completion: durationSeconds ? Math.min(1, watchSeconds / durationSeconds) : null,
      suspicious: SUSPICIOUS.has(result.reason ?? ""),
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
    } else if (!NOT_COUNTED_REASONS.includes(result.reason ?? "")) {
      // e.g. self-views or a channel below the unlock target: a real view, it just doesn't earn
      await db.video.update({ where: { id: video.id }, data: { views: { increment: 1 } } });
    }

    return Response.json({ qualified: result.qualified, reason: result.reason ?? null, credited });
  }

  // ── COMPLETE (watched to the end; recommendation + analytics signal only, never money) ──
  if (segs.length === 2 && seg === "complete") {
    if (!rateLimit(`complete:${viewerKey}`, 120, 60_000)) return jsonError("Too many events", 429);
    const body = await req.json().catch(() => ({}));
    const video = await getVideoOr404(id);
    if (!video || video.status !== "APPROVED") return jsonError("Video not found", 404);
    const watchSeconds = Math.max(0, Math.min(3600, Number(body?.watchSeconds ?? 0) || 0));
    const duration = video.duration || Number(body?.durationSeconds) || 0;
    // must have actually watched (most of) it; counted once per viewer per video per day
    if (!duration || watchSeconds < duration * 0.85) return Response.json({ ok: true, counted: false });
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const dup = await db.videoInteractionEvent.count({ where: { videoId: video.id, viewerKey, type: "COMPLETE", createdAt: { gte: dayStart } } });
    if (dup) return Response.json({ ok: true, counted: false });
    const self = !!me && me.id === video.creatorId;
    await recordInteraction({ videoId: video.id, userId: me?.id ?? null, viewerKey, type: "COMPLETE", watchSeconds, completion: 1, suspicious: self });
    return Response.json({ ok: true, counted: !self });
  }

  // ── SAVE / UNSAVE ("Save" list) ───────────────────────────────────────
  if (segs.length === 2 && seg === "save") {
    if (!me) return jsonError("Log in to save videos", 401);
    if (!rateLimit(`save:${me.id}`, 60, 60_000)) return jsonError("Too many actions", 429);
    const video = await getVideoOr404(id);
    if (!video || video.status !== "APPROVED") return jsonError("Video not found", 404);
    const body = await req.json().catch(() => ({}));
    const existing = await db.savedVideo.findUnique({ where: { userId_videoId: { userId: me.id, videoId: video.id } } });
    const want = typeof body?.saved === "boolean" ? body.saved : !existing;
    if (want && !existing) {
      await db.savedVideo.create({ data: { userId: me.id, videoId: video.id } });
      await recordInteraction({ videoId: video.id, userId: me.id, viewerKey, type: "SAVE" });
    } else if (!want && existing) {
      await db.savedVideo.delete({ where: { id: existing.id } });
      await recordInteraction({ videoId: video.id, userId: me.id, viewerKey, type: "UNSAVE" });
    }
    return Response.json({ saved: want, message: want ? "Saved" : "Removed from saved" });
  }

  // ── NOT INTERESTED (hide this video; repeated marks lower similar content) ──
  if (segs.length === 2 && seg === "not-interested") {
    if (!me) return jsonError("Log in to personalise your feed", 401);
    if (!rateLimit(`ni:${me.id}`, 60, 60_000)) return jsonError("Too many actions", 429);
    const video = await getVideoOr404(id);
    if (!video) return jsonError("Video not found", 404);
    const body = await req.json().catch(() => ({}));
    const key = { userId_videoId_kind: { userId: me.id, videoId: video.id, kind: "NOT_INTERESTED" } };
    if (body?.undo) {
      await db.videoFeedback.delete({ where: key }).catch(() => {});
    } else {
      await db.videoFeedback.upsert({ where: key, update: {}, create: { userId: me.id, videoId: video.id, kind: "NOT_INTERESTED" } });
      await recordInteraction({ videoId: video.id, userId: me.id, viewerKey, type: "NOT_INTERESTED" });
    }
    await bumpPrefs(me.id);
    return Response.json({ ok: true, notInterested: !body?.undo, message: body?.undo ? "Video restored to your feed" : "Got it — you'll see fewer videos like this" });
  }

  // ── DON'T RECOMMEND THIS CREATOR (id = creator user id, channel id, or one of their videos) ──
  if (segs.length === 2 && seg === "hide-creator") {
    if (!me) return jsonError("Log in to personalise your feed", 401);
    if (!rateLimit(`hide:${me.id}`, 30, 60_000)) return jsonError("Too many actions", 429);
    const body = await req.json().catch(() => ({}));
    const creatorId = await resolveCreatorId(id);
    if (!creatorId) return jsonError("Creator not found", 404);
    if (creatorId === me.id) return jsonError("You can't hide your own channel");
    const key = { userId_creatorId: { userId: me.id, creatorId } };
    if (body?.undo) {
      await db.blockedCreator.delete({ where: key }).catch(() => {});
    } else {
      await db.blockedCreator.upsert({ where: key, update: {}, create: { userId: me.id, creatorId } });
      const v = await db.video.findFirst({ where: { OR: [{ id }, { contentId: id }] }, select: { id: true } });
      if (v) await recordInteraction({ videoId: v.id, userId: me.id, viewerKey, type: "HIDE_CREATOR" });
    }
    await bumpPrefs(me.id);
    return Response.json({ ok: true, hidden: !body?.undo, message: body?.undo ? "Creator can be recommended again" : "We won't recommend this creator to you" });
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
      await recordInteraction({ videoId: video.id, userId: me?.id ?? null, viewerKey, type: "UNLIKE" });
      return Response.json({ liked: false, likes: Math.max(0, video.likes - 1) });
    }
    // Signed-in likes get their own key, so a guest like from the same device
    // can't collide with it on the [videoId, guestKey] unique index.
    await db.videoLike.create({
      data: { videoId: video.id, userId: me?.id ?? null, guestKey: me ? `user:${me.id}` : viewerKey },
    });
    await db.video.update({ where: { id: video.id }, data: { likes: { increment: 1 } } });
    await recordInteraction({ videoId: video.id, userId: me?.id ?? null, viewerKey, type: "LIKE", suspicious: !!me && me.id === video.creatorId });
    return Response.json({ liked: true, likes: video.likes + 1 });
  }

  // ── COMMENT ───────────────────────────────────────────────────────────
  if (segs.length === 2 && seg === "comment") {
    if (!COMMENTS_ENABLED) return jsonError(COMMENTS_OFF_MESSAGE, 403);
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
    if (!rateLimit(`share:${viewerKey}`, 30, 60_000)) return jsonError("Too many actions", 429);
    const video = await getVideoOr404(id);
    if (!video || video.status !== "APPROVED") return jsonError("Video not found", 404);
    await db.video.update({ where: { id: video.id }, data: { shares: { increment: 1 } } });
    await recordInteraction({ videoId: video.id, userId: me?.id ?? null, viewerKey, type: "SHARE", suspicious: !!me && me.id === video.creatorId });
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
      data: { videoId: video.id, reporterKey: viewerKey, userId: me?.id ?? null, reason, details: details || null },
    });
    await recordInteraction({ videoId: video.id, userId: me?.id ?? null, viewerKey, type: "REPORT" });
    if (me) await bumpPrefs(me.id); // reported videos leave the reporter's feed right away
    return Response.json({ ok: true, message: "Report submitted. Our trust & safety team will review it." });
  }

  return jsonError("Not found", 404);
}

async function resolveCreatorId(id: string): Promise<string | null> {
  const user = await db.user.findFirst({ where: { id, role: "CREATOR" }, select: { id: true } });
  if (user) return user.id;
  const ch = await db.channel.findUnique({ where: { id }, select: { userId: true } });
  if (ch) return ch.userId;
  const v = await db.video.findFirst({ where: { OR: [{ id }, { contentId: id }] }, select: { creatorId: true } });
  return v?.creatorId ?? null;
}

/** Feedback changes the viewer's feed on the next request (new cache key). */
async function bumpPrefs(userId: string) {
  await db.userRecommendationPreference.upsert({
    where: { userId }, update: { prefsVersion: { increment: 1 } }, create: { userId, prefsVersion: 1 },
  }).catch(() => {});
  clearRankedCacheFor(userId);
}
