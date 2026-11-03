import { db } from "@/lib/db";
import { getSessionUser, viewerKeyFromRequest, hashPassword, verifyPassword, jsonError, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { deleteAccount } from "@/lib/account-deletion";
import { loadTaxonomy, interfaceLocales } from "@/lib/taxonomy";
import { getPreferences, validatePreferences, savePreferences, saveOnboardingProgress, type PreferencesInput } from "@/lib/preferences";
import { clearRankedCacheFor } from "@/lib/feed";
import { VIDEO_CARD_INCLUDE, viewerFlags, toVideoDTO } from "@/lib/video-dto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Account endpoints for any signed-in app user (User/viewer or Creator).
 * Admin accounts are refused — they use the website. Creator-only features
 * (studio, uploads, wallet) stay under /api/creator.
 */
export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

async function requireAppUser() {
  const me = await getSessionUser();
  if (!me) return { error: jsonError("Login required", 401) } as const;
  if (me.role === "ADMIN") return { error: jsonError("Not available for admin accounts", 403) } as const;
  return { me } as const;
}

export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const r = await requireAppUser();
  if ("error" in r) return r.error;
  const me = r.me;

  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") || "en").slice(0, 10);
  const limit = Math.max(1, Math.min(60, parseInt(url.searchParams.get("limit") || "40", 10) || 40));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  // GET /api/me/likes — videos this user liked, newest like first
  if (seg === "likes") {
    const likes = await db.videoLike.findMany({
      where: { userId: me.id, video: { status: "APPROVED" } },
      orderBy: { createdAt: "desc" }, take: 100, include: { video: { include: VIDEO_CARD_INCLUDE } },
    });
    const t = await loadTaxonomy(locale);
    const flags = await viewerFlags(me.id, viewerKeyFromRequest(req), likes.map(l => l.videoId));
    return Response.json({ videos: likes.map(l => ({ ...toVideoDTO(l.video, flags, t), liked: true })) });
  }

  // GET /api/me/saved — "Save" list, newest first
  if (seg === "saved") {
    const rows = await db.savedVideo.findMany({
      where: { userId: me.id, video: { status: "APPROVED" } },
      orderBy: { createdAt: "desc" }, take: limit + 1, skip: offset, include: { video: { include: VIDEO_CARD_INCLUDE } },
    });
    const page = rows.slice(0, limit);
    const t = await loadTaxonomy(locale);
    const flags = await viewerFlags(me.id, viewerKeyFromRequest(req), page.map(r => r.videoId));
    return Response.json({
      videos: page.map(r => ({ ...toVideoDTO(r.video, flags, t), saved: true, savedAt: r.createdAt })),
      nextOffset: rows.length > limit ? offset + limit : null,
    });
  }

  // GET /api/me/not-interested — videos hidden with "Not interested" (reviewable, undoable)
  if (seg === "not-interested") {
    const rows = await db.videoFeedback.findMany({
      where: { userId: me.id, kind: "NOT_INTERESTED" }, orderBy: { createdAt: "desc" }, take: 200,
      include: { video: { select: { id: true, contentId: true, title: true, thumbnailUrl: true, status: true, creator: { select: { name: true, channel: { select: { name: true, username: true } } } } } } },
    });
    return Response.json({
      items: rows.map(r => ({
        videoId: r.video.id, contentId: r.video.contentId, title: r.video.title, thumbnailUrl: r.video.thumbnailUrl,
        channelName: r.video.creator.channel?.name ?? r.video.creator.name, username: r.video.creator.channel?.username ?? "",
        available: r.video.status === "APPROVED", markedAt: r.createdAt,
      })),
    });
  }

  // GET /api/me/blocked-creators — "Don't recommend this creator" list
  if (seg === "blocked-creators") {
    const rows = await db.blockedCreator.findMany({
      where: { userId: me.id }, orderBy: { createdAt: "desc" },
      include: { creator: { select: { id: true, name: true, avatarUrl: true, channel: { select: { id: true, name: true, username: true, avatarUrl: true, verified: true } } } } },
    });
    return Response.json({
      creators: rows.map(r => ({
        creatorId: r.creator.id, channelId: r.creator.channel?.id ?? null, channelName: r.creator.channel?.name ?? r.creator.name,
        username: r.creator.channel?.username ?? "", avatarUrl: r.creator.channel?.avatarUrl ?? r.creator.avatarUrl,
        verified: r.creator.channel?.verified ?? false, blockedAt: r.createdAt,
      })),
    });
  }

  // GET /api/me/profile — name, country, and whether creators I follow may see my name & country
  if (seg === "profile") {
    const u = await db.user.findUnique({ where: { id: me.id }, select: { name: true, email: true, country: true, avatarUrl: true, followsPrivate: true } });
    return Response.json({ profile: u });
  }

  // GET /api/me/preferences — languages, interests, discovery toggle, onboarding progress
  if (seg === "preferences") {
    const [prefs, locales] = await Promise.all([getPreferences(me.id, locale), interfaceLocales()]);
    return Response.json({ preferences: prefs, interfaceLocales: locales });
  }

  // GET /api/me/following — creators this user follows
  if (seg === "following") {
    const follows = await db.follow.findMany({
      where: { followerId: me.id },
      orderBy: { createdAt: "desc" },
      include: {
        channel: {
          include: {
            user: { select: { status: true } },
            _count: { select: { videos: { where: { status: "APPROVED" } } } },
          },
        },
      },
    });
    return Response.json({
      creators: follows
        .filter(f => f.channel.user.status === "APPROVED")
        .map(f => ({
          channelId: f.channel.id, username: f.channel.username, channelName: f.channel.name,
          avatarUrl: f.channel.avatarUrl, category: f.channel.category, verified: f.channel.verified,
          followerCount: f.channel.followerCount, theme: f.channel.theme,
          videoCount: f.channel._count.videos,
        })),
    });
  }

  return jsonError("Not found", 404);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const r = await requireAppUser();
  if ("error" in r) return r.error;
  const me = r.me;
  const body = await req.json().catch(() => null);

  // PATCH /api/me/profile — { name?, country?, followsPrivate? } (each optional)
  if (seg === "profile") {
    const name = body?.name !== undefined ? String(body.name || "").trim() : undefined;
    if (name !== undefined && name.length < 2) return jsonError("Name is required");
    await db.user.update({
      where: { id: me.id },
      data: {
        name: name || undefined,
        country: body?.country !== undefined ? (String(body.country || "").slice(0, 60) || null) : undefined,
        followsPrivate: typeof body?.followsPrivate === "boolean" ? body.followsPrivate : undefined,
      },
    });
    return Response.json({ ok: true, message: "Profile updated" });
  }

  // PATCH /api/me/onboarding — { step, draft } — saves progress of an interrupted onboarding
  if (seg === "onboarding") {
    const step = Number(body?.step ?? 0);
    if (!Number.isFinite(step)) return jsonError("Invalid step");
    try { await saveOnboardingProgress(me.id, step, body?.draft ?? null); }
    catch { return jsonError("Onboarding progress is too large"); }
    return Response.json({ ok: true });
  }

  // PATCH /api/me/password — { currentPassword, newPassword }
  if (seg === "password") {
    const current = String(body?.currentPassword || "");
    const next = String(body?.newPassword || "");
    if (next.length < 8) return jsonError("New password must be at least 8 characters");
    const user = await db.user.findUnique({ where: { id: me.id } });
    if (!user || !verifyPassword(current, user.passwordHash)) {
      return jsonError("Current password is incorrect", 403);
    }
    await db.user.update({ where: { id: me.id }, data: { passwordHash: hashPassword(next) } });
    return Response.json({ ok: true, message: "Password changed" });
  }

  return jsonError("Not found", 404);
}

export async function POST(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const r = await requireAppUser();
  if ("error" in r) return r.error;
  const me = r.me;

  // POST /api/me/preferences — same as PUT (the web and app clients only have GET/POST/PATCH helpers)
  if (seg === "preferences") return putPreferences(req, me.id);

  // POST /api/me/delete-account — { password, confirm: "DELETE" } — permanent, signs the user out
  if (seg === "delete-account") {
    if (!rateLimit(`delete-account:${me.id}`, 5, 600_000)) return jsonError("Too many attempts. Please wait a few minutes.", 429);
    const body = await req.json().catch(() => null);
    if (String(body?.confirm || "") !== "DELETE") return jsonError('Type DELETE to confirm');
    const user = await db.user.findUnique({ where: { id: me.id } });
    if (!user || !verifyPassword(String(body?.password || ""), user.passwordHash)) return jsonError("Password is incorrect", 403);
    const result = await deleteAccount(me.id);
    if (!result.ok) return jsonError(result.error, result.status);
    const res = Response.json({
      ok: true, kind: result.kind,
      message: result.kind === "deleted"
        ? "Your account and its data have been deleted."
        : "Your creator account has been deleted. Your videos are removed; anonymous earnings records are kept for accounting as required by law.",
    });
    res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return res;
  }

  // POST /api/me/recommendations/reset — forget learned behaviour (declared interests stay)
  if (seg === "recommendations" && segs[1] === "reset") {
    await db.userRecommendationPreference.upsert({
      where: { userId: me.id },
      update: { learnedResetAt: new Date(), prefsVersion: { increment: 1 } },
      create: { userId: me.id, learnedResetAt: new Date(), prefsVersion: 1 },
    });
    clearRankedCacheFor(me.id);
    return Response.json({ ok: true, message: "Recommendations reset. Your feed now follows only the interests you chose." });
  }

  // POST /api/me/avatar — multipart "avatar" (PNG/JPG/WebP, ≤ 5MB)
  if (seg === "avatar") {
    const form = await req.formData().catch(() => null);
    const avatar = form?.get("avatar");
    if (!avatar || !(avatar instanceof File) || avatar.size === 0) return jsonError("Avatar file required");
    if (avatar.size > 5 * 1024 * 1024) return jsonError("Avatar must be under 5MB");
    if (!/^image\/(png|jpe?g|webp)$/.test(avatar.type)) return jsonError("Avatar must be PNG, JPG or WebP");
    const ext = avatar.type.includes("png") ? "png" : avatar.type.includes("webp") ? "webp" : "jpg";
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });
    const fname = `${me.channel?.username ?? "user"}-${randomBytes(4).toString("hex")}.${ext}`;
    await writeFile(path.join(dir, fname), Buffer.from(await avatar.arrayBuffer()));
    const avatarUrl = `/uploads/avatars/${fname}`;
    await db.user.update({ where: { id: me.id }, data: { avatarUrl } });
    if (me.channel) await db.channel.update({ where: { userId: me.id }, data: { avatarUrl } });
    return Response.json({ ok: true, avatarUrl });
  }

  return jsonError("Not found", 404);
}

// PUT /api/me/preferences — { languages:[codes], primaryLanguage, categories:[{id, allSubcategories}],
//   subcategoryIds, discoverOtherLanguages, interfaceLocale, completeOnboarding }
export async function PUT(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const r = await requireAppUser();
  if ("error" in r) return r.error;
  if (segs[0] === "preferences") return putPreferences(req, r.me.id);
  return jsonError("Not found", 404);
}

async function putPreferences(req: Request, userId: string) {
  const body = (await req.json().catch(() => null)) as PreferencesInput | null;
  if (!body) return jsonError("Invalid request");
  const url = new URL(req.url);
  const locale = (url.searchParams.get("locale") || "en").slice(0, 10);
  const [t, locales] = await Promise.all([loadTaxonomy("en"), interfaceLocales()]);
  const { errors, value } = validatePreferences(body, t, locales.map(l => l.code));
  if (errors.length) return Response.json({ error: errors[0], errors }, { status: 400 });
  await savePreferences(userId, value);
  clearRankedCacheFor(userId);
  return Response.json({ ok: true, preferences: await getPreferences(userId, locale) });
}
