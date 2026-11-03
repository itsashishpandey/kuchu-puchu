import { db } from "@/lib/db";
import { getSessionUser, viewerKeyFromRequest, jsonError } from "@/lib/auth";
import { getMonetizationSettings } from "@/lib/monetization";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { loadTaxonomy, selectable, taxonomyCounts, resolveFilterParams, languageCodesFromParam } from "@/lib/taxonomy";
import { VIDEO_CARD_INCLUDE, viewerFlags, toVideoDTO } from "@/lib/video-dto";
import { forYouFeed, listFeed } from "@/lib/feed";
import { AUDIENCE_INFO, COMMENTS_ENABLED } from "@/lib/kids";
import { USERNAME_RE, USERNAME_RULE, DOCUMENT_TYPES, DOCUMENT_MAX_MB, AGREEMENTS, AGREEMENTS_VERSION, STRIKE_LIMIT } from "@/lib/creator-application";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

const localeOf = (url: URL) => (url.searchParams.get("locale") || "en").slice(0, 10);

export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const url = new URL(req.url);
  const [seg, second] = segs;

  // GET /api/public/version — build stamp of the running site (open tabs offer a refresh when it changes)
  if (seg === "version") {
    return Response.json({ build: process.env.NEXT_PUBLIC_BUILD_ID || "" }, { headers: { "Cache-Control": "no-store" } });
  }

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
      audience: AUDIENCE_INFO,
      ratePer1000Views: settings.ratePer1000Views,
      rewardPerUpload: settings.rewardPerUpload,
      rewardPerUploadInr: settings.rewardPerUploadInr,
      inrPerUsd: settings.inrPerUsd,
      minMonthlyChannelViews: settings.minMonthlyChannelViews,
      monetizationDurationMonths: settings.monetizationDurationMonths,
      minWithdrawalAmount: settings.minWithdrawalAmount,
      monetizationPaused: settings.monetizationPaused,
      branding: branding ? JSON.parse(branding.value) : null,
      homepage: homepage ? JSON.parse(homepage.value) : null,
    });
  }

  // GET /api/public/videos/:id — single video (comments are off on the kids platform)
  if (seg === "videos" && second) {
    const v = await db.video.findFirst({
      where: { OR: [{ id: second }, { contentId: second }] },
      include: { ...VIDEO_CARD_INCLUDE, ...(COMMENTS_ENABLED ? { comments: { orderBy: { createdAt: "desc" as const }, take: 50 } } : {}) },
    });
    if (!v || v.status !== "APPROVED") return jsonError("Video not found", 404);
    const me = await getSessionUser();
    const guestKey = viewerKeyFromRequest(req);
    const [flags, channel, t] = await Promise.all([
      viewerFlags(me?.id ?? null, guestKey, [v.id]),
      db.channel.findUnique({ where: { userId: v.creatorId }, select: { followerCount: true, description: true } }),
      loadTaxonomy(localeOf(url)),
    ]);
    const dto = toVideoDTO(v, flags, t);
    return Response.json({
      video: {
        ...dto,
        creator: { ...dto.creator, followerCount: channel?.followerCount ?? 0, description: channel?.description ?? "" },
        comments: COMMENTS_ENABLED ? (v as { comments?: unknown[] }).comments ?? [] : [],
      },
    });
  }

  // GET /api/public/videos?feed=foryou|trending|explore|following&languages=hi,en&category=<slug>
  //   &subcategory=<slug>&q=&limit=&offset=     (old apps' `category=<name>` keeps working)
  if (seg === "videos") {
    const feedParam = url.searchParams.get("feed") || "explore";
    const limit = Math.max(1, Math.min(48, parseInt(url.searchParams.get("limit") || "24", 10) || 24));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase().slice(0, 80);
    const me = await getSessionUser();
    const guestKey = viewerKeyFromRequest(req);
    const t = await loadTaxonomy(localeOf(url));
    const languages = languageCodesFromParam(t, url.searchParams.get("languages"));
    const f = resolveFilterParams(t, url.searchParams.get("category"), url.searchParams.get("subcategory"));
    const filters = { languages, categoryId: f.categoryId, subcategoryId: f.subcategoryId, q: q || undefined };
    const legacyCategory = f.legacyCategory;

    if (feedParam === "foryou") {
      const res = await forYouFeed({
        userId: me?.id ?? null, guestKey, guestLanguages: languages, filters, limit, offset, taxonomy: t,
        fresh: url.searchParams.get("fresh") === "1",
      });
      return Response.json(res);
    }
    const feed = feedParam === "trending" || feedParam === "following" ? feedParam : "explore";
    const res = await listFeed({ feed, filters, limit, offset, userId: me?.id ?? null, guestKey, taxonomy: t, legacyCategory });
    if ("error" in res) return jsonError(res.error!, 401);
    return Response.json({ ...res, meta: { feed, languages } });
  }

  // GET /api/public/creator/:username — public channel page
  if (seg === "creator" && second) {
    const channel = await db.channel.findUnique({
      where: { username: second },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, status: true, createdAt: true },
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
    const [t, prefs] = await Promise.all([
      loadTaxonomy(localeOf(url)),
      db.channel.findUnique({
        where: { id: channel.id },
        select: {
          preferredCategories: { select: { categoryId: true } },
          publishingLanguages: { select: { language: { select: { code: true, nameEn: true, nameNative: true } } } },
        },
      }),
    ]);
    const sort = url.searchParams.get("sort");
    const cards = await db.video.findMany({
      where: { creatorId: channel.user.id, status: "APPROVED" }, include: VIDEO_CARD_INCLUDE,
      orderBy: sort === "popular" ? [{ views: "desc" }, { publishedAt: "desc" }] : { publishedAt: sort === "oldest" ? "asc" : "desc" },
    });
    const totalViews = cards.reduce((a, v) => a + v.views, 0);
    const flags = await viewerFlags(me?.id ?? null, viewerKeyFromRequest(req), cards.map(c => c.id));
    return Response.json({
      channel: {
        id: channel.id,
        name: channel.name, username: channel.username, description: channel.description,
        tagline: channel.tagline ?? "", supportEmail: channel.supportEmail, videoCount: cards.length, totalViews,
        avatarUrl: channel.avatarUrl, bannerUrl: channel.bannerUrl, category: channel.category,
        country: channel.country, socialLinks: channel.socialLinks ? JSON.parse(channel.socialLinks) : null,
        followerCount: channel.followerCount, verified: channel.verified, theme: channel.theme,
        joinedAt: channel.user.createdAt, showEarnings: channel.showEarnings,
        verifiedEarnings,
        preferredCategories: (prefs?.preferredCategories ?? []).map(p => {
          const c = t.categories.find(x => x.id === p.categoryId);
          return c ? { id: c.id, slug: c.slug, name: c.name, emoji: c.emoji } : null;
        }).filter(Boolean),
        languages: (prefs?.publishingLanguages ?? []).map(l => l.language),
        videos: cards.map(v => toVideoDTO(v, flags, t)),
        following,
      },
    });
  }

  // GET /api/public/categories — kept for older app/web builds; new clients use /api/taxonomy/categories
  if (seg === "categories") {
    const [t, counts] = await Promise.all([loadTaxonomy(localeOf(url)), taxonomyCounts()]);
    return Response.json({
      categories: selectable(t).categories.map(c => ({
        id: c.id, name: c.name, slug: c.slug, icon: null, emoji: c.emoji, color: c.color, description: c.description,
        active: true, videoCount: counts.categories.get(c.id) ?? 0,
      })),
    });
  }

  // GET /api/public/creator-application — rules and texts for the web + app application forms
  if (seg === "creator-application") {
    const s = await getMonetizationSettings();
    return Response.json({
      audience: AUDIENCE_INFO,
      usernameRule: USERNAME_RULE, usernamePattern: USERNAME_RE.source,
      documentTypes: DOCUMENT_TYPES, documentMaxMB: DOCUMENT_MAX_MB,
      agreements: AGREEMENTS, agreementsVersion: AGREEMENTS_VERSION, strikeLimit: STRIKE_LIMIT,
      minMonthlyChannelViews: s.minMonthlyChannelViews, uploadRewardInr: s.rewardPerUploadInr,
      uploadRewardUsd: s.rewardPerUpload, inrPerUsd: s.inrPerUsd, ratePer1000Views: s.ratePer1000Views,
    });
  }

  // GET /api/public/check-username?username=
  if (seg === "check-username") {
    const username = (url.searchParams.get("username") || "").toLowerCase();
    if (!USERNAME_RE.test(username)) {
      return Response.json({ available: false, reason: `Username: ${USERNAME_RULE}` });
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
          theme: c.theme,
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
        toEmail: email, subject: "We received your message — Kuchu Puchu Support",
        body: `Hi ${name}, thanks for reaching out about "${subject}". Our team replies within one business day.`,
      },
    });
    return Response.json({ ok: true, message: "Message sent! We reply within one business day." });
  }

  return jsonError("Not found", 404);
}
