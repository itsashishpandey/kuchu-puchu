import { db } from "@/lib/db";
import { VIDEO_CARD_INCLUDE, toVideoDTO, safeJsonArray } from "@/lib/video-dto";
import { loadTaxonomy as loadTaxonomyForVideo } from "@/lib/taxonomy";
import { getSessionUser, hashPassword, jsonError } from "@/lib/auth";
import { getViewCounting, forgetViewCounting } from "@/lib/monetization";
import { getMonetizationSettings, getUploadRules, walletSummary, creditUploadReward, round2, channelMonetization, forgetUnlock } from "@/lib/monetization";
import { notify, audit, setSetting, getSetting, payoutRef } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";
import { readPrivate } from "@/lib/private-files";
import { addStrike, revokeStrike } from "@/lib/strikes";
import { DOCUMENT_TYPES, STRIKE_LIMIT } from "@/lib/creator-application";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  FINANCE: ["overview", "withdrawals", "earnings", "reports", "creators", "videos", "duplicates", "fraud", "notifications", "mail"],
  MODERATOR: [
    "overview", "creators", "videos", "duplicates", "fraud", "categories", "notifications", "mail", "reports",
    // kid-safety moderation of what app users post and report
    "safety", "content-reports", "comments", "app-users",
  ],
};

async function requireAdmin(section: string) {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") return { error: jsonError("Admin access required", 403) } as const;
  const allowed = PERMISSIONS[me.adminRole ?? "MODERATOR"] ?? [];
  if (!allowed.includes("*") && !allowed.includes(section)) {
    return { error: jsonError("Your admin role does not permit this action", 403) } as const;
  }
  return { me } as const;
}

export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg, second, third] = segs;
  const url = new URL(req.url);
  const section = seg === "creators" && third === "action" ? "creators" : seg ?? "overview";
  const r = await requireAdmin(section);
  if ("error" in r) return r.error;
  const me = r.me;

  // ── OVERVIEW ──────────────────────────────────────────────────────────
  if (seg === "overview" || !seg) {
    const [
      totalCreators, pendingCreators, approvedCreators, activeCreators,
      totalVideos, pendingVideos, flaggedVideos,
    ] = await Promise.all([
      db.user.count({ where: { role: "CREATOR" } }),
      db.user.count({ where: { role: "CREATOR", status: "PENDING" } }),
      db.user.count({ where: { role: "CREATOR", status: "APPROVED" } }),
      db.user.count({ where: { role: "CREATOR", status: "APPROVED", updatedAt: { gte: new Date(Date.now() - 30 * 864e5) } } }),
      db.video.count(),
      db.video.count({ where: { status: "PENDING" } }),
      db.video.count({ where: { status: "FLAGGED_DUPLICATE" } }),
    ]);
    const [viewsAgg, qualAgg, earningsAgg, paidAgg, pendingW, pendingWCount, openFraud, openAppeals, openReports, outstandingLiability] =
      await Promise.all([
        db.video.aggregate({ _sum: { views: true } }),
        db.video.aggregate({ _sum: { qualifiedViews: true } }),
        db.ledgerEntry.aggregate({ _sum: { amount: true }, where: { type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } } }),
        db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
        db.withdrawal.aggregate({ _sum: { amount: true }, where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING"] } } }),
        db.withdrawal.count({ where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING"] } } }),
        db.fraudFlag.count({ where: { status: "OPEN" } }),
        db.appeal.count({ where: { status: "OPEN" } }),
        db.contentReport.count({ where: { status: "OPEN" } }),
        // "still in holding" = credits whose holding period hasn't ended yet
        // (status stays PENDING forever on these rows, so filter on availableAt)
        db.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: {
            type: { in: ["VIEW_EARNING", "UPLOAD_REWARD", "ADJUSTMENT"] },
            status: { not: "REVERSED" }, availableAt: { gt: new Date() },
          },
        }),
      ]);
    const [appUsers, commentsToday] = await Promise.all([
      db.user.count({ where: { role: "VIEWER" } }),
      db.comment.count({ where: { createdAt: { gte: new Date(Date.now() - 864e5) } } }),
    ]);

    // charts: last 90 days of creator growth, uploads, views, earnings, payouts
    const days: string[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const [creatorsOverTime, uploadsOverTime, earningsOverTime, payoutRows] = await Promise.all([
      db.user.findMany({ where: { role: "CREATOR" }, select: { createdAt: true } }),
      db.video.findMany({ select: { createdAt: true, views: true, qualifiedViews: true } }),
      db.ledgerEntry.findMany({
        where: { type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } },
        select: { createdAt: true, amount: true },
      }),
      db.withdrawal.findMany({ where: { status: "PAID" }, select: { amount: true, updatedAt: true } }),
    ]);
    const growth = days.map(d => creatorsOverTime.filter(c => c.createdAt.toISOString().slice(0, 10) <= d).length);
    const uploadsSeries = days.map(d => uploadsOverTime.filter(v => v.createdAt.toISOString().slice(0, 10) === d).length);
    const earningsSeries = days.map(d =>
      round2(earningsOverTime.filter(e => e.createdAt.toISOString().slice(0, 10) === d).reduce((a, e) => a + e.amount, 0))
    );
    const payoutSeries = days.map(d =>
      round2(payoutRows.filter(w => w.updatedAt.toISOString().slice(0, 10) === d).reduce((a, w) => a + w.amount, 0))
    );
    const viewSeries = days.map(d =>
      uploadsOverTime.filter(v => v.createdAt.toISOString().slice(0, 10) === d).reduce((a, v) => a + v.views, 0)
    );

    const recentAudit = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 });

    return Response.json({
      kpis: {
        totalCreators, pendingCreators, approvedCreators, activeCreators,
        totalVideos, pendingVideos, flaggedVideos,
        totalViews: viewsAgg._sum.views ?? 0,
        qualifiedViews: qualAgg._sum.qualifiedViews ?? 0,
        totalCreatorEarnings: round2(earningsAgg._sum.amount ?? 0),
        totalPaidToCreators: round2(paidAgg._sum.amount ?? 0),
        pendingWithdrawals: round2(pendingW._sum.amount ?? 0),
        pendingWithdrawalCount: pendingWCount,
        outstandingLiability: round2(outstandingLiability._sum.amount ?? 0),
        openFraudFlags: openFraud, openAppeals, openReports,
        appUsers, commentsToday,
      },
      charts: {
        dates: days.slice(-30),
        creatorGrowth: growth.slice(-30),
        uploads: uploadsSeries.slice(-30),
        views: viewSeries.slice(-30),
        earnings: earningsSeries.slice(-30),
        payouts: payoutSeries.slice(-30),
      },
      recentAudit,
      settings: await getMonetizationSettings(),
    });
  }

  // ── CREATORS ──────────────────────────────────────────────────────────
  // GET /api/admin/creators/:id/document — the private government ID (never web-served); every view is audit-logged
  if (seg === "creators" && second && third === "document") {
    const v = await db.creatorVerification.findUnique({ where: { userId: second }, include: { user: { select: { email: true } } } });
    if (!v) return jsonError("No ID document on file", 404);
    let buf: Buffer;
    try { buf = await readPrivate(v.fileName); } catch { return jsonError("The document file is missing", 404); }
    await audit({ actorId: me.id, actorEmail: me.email, action: "KYC_DOCUMENT_VIEWED", targetType: "CREATOR", targetId: v.user.email });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": v.mimeType, "Content-Disposition": `inline; filename="id-document.${v.mimeType.split("/")[1]}"`,
        "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  }

  if (seg === "creators") {
    const status = url.searchParams.get("status") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const where: Record<string, unknown> = { role: "CREATOR" };
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } }, { email: { contains: q } },
        { channel: { name: { contains: q } } }, { channel: { username: { contains: q } } },
      ];
    }
    const users = await db.user.findMany({
      where, orderBy: { createdAt: "desc" }, take: 100,
      include: { channel: true, verification: true, strikes: { orderBy: { createdAt: "desc" } } },
    });
    const list = await Promise.all(users.map(async u => {
      const [videoCount, earningsAgg] = await Promise.all([
        db.video.count({ where: { creatorId: u.id } }),
        db.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: { userId: u.id, type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } },
        }),
      ]);
      return {
        id: u.id, name: u.name, email: u.email, status: u.status,
        rejectionReason: u.rejectionReason, suspensionReason: u.suspensionReason,
        monetizationEligible: u.monetizationEligible, country: u.country,
        createdAt: u.createdAt, updatedAt: u.updatedAt,
        channel: u.channel ? {
          name: u.channel.name, username: u.channel.username, avatarUrl: u.channel.avatarUrl,
          category: u.channel.category, followerCount: u.channel.followerCount,
          verified: u.channel.verified, description: u.channel.description,
        } : null,
        videoCount, lifetimeEarnings: round2(earningsAgg._sum.amount ?? 0),
        application: {
          legalName: u.legalName, phone: u.phone, city: u.city, postalCode: u.postalCode,
          emailVerified: u.emailVerified, emailVerifiedAt: u.emailVerifiedAt,
          agreements: (() => { try { return u.agreements ? JSON.parse(u.agreements) : null; } catch { return null; } })(),
          socialLinks: (() => { try { return u.channel?.socialLinks ? JSON.parse(u.channel.socialLinks) : null; } catch { return null; } })(),
        },
        verification: u.verification ? {
          status: u.verification.status, documentType: u.verification.documentType,
          documentLabel: DOCUMENT_TYPES.find(d => d.id === u.verification!.documentType)?.label ?? u.verification.documentType,
          documentLast4: u.verification.documentLast4, mimeType: u.verification.mimeType, submittedAt: u.verification.createdAt,
          reviewedAt: u.verification.reviewedAt, reviewedByEmail: u.verification.reviewedByEmail, reviewNote: u.verification.reviewNote,
        } : null,
        strikes: {
          active: u.strikes.filter(x => !x.revokedAt).length, limit: STRIKE_LIMIT,
          list: u.strikes.map(x => ({ id: x.id, reason: x.reason, contentId: x.contentId, createdAt: x.createdAt, createdByEmail: x.createdByEmail, revokedAt: x.revokedAt, revokeNote: x.revokeNote })),
        },
        monetization: u.status === "APPROVED" ? await channelMonetization(u.id) : null,
      };
    }));
    return Response.json({ creators: list });
  }

  // ── VIDEOS ────────────────────────────────────────────────────────────
  if (seg === "videos" && second) {
    const v = await db.video.findFirst({
      where: { OR: [{ id: second }, { contentId: second }] },
      include: { ...VIDEO_CARD_INCLUDE, creator: { include: { channel: true, verification: { select: { status: true, documentType: true } } } } },
    });
    if (!v) return jsonError("Video not found", 404);
    const t = await loadTaxonomyForVideo("en");
    const dto = toVideoDTO(v as never, { liked: new Set(), followedChannels: new Set(), saved: new Set() }, t);
    const [original, sameFile, reports, fraud, audits, tagAudits, strikes, creatorVideos] = await Promise.all([
      v.duplicateOfId ? db.video.findUnique({ where: { contentId: v.duplicateOfId }, include: { creator: { include: { channel: true } } } }) : null,
      v.sha256 ? db.video.findMany({ where: { sha256: v.sha256, NOT: { id: v.id } }, include: { creator: { include: { channel: true } } }, take: 10 }) : [],
      db.contentReport.findMany({ where: { videoId: v.id }, orderBy: { createdAt: "desc" }, take: 20 }),
      db.fraudFlag.findMany({ where: { videoId: v.contentId }, orderBy: { createdAt: "desc" }, take: 20 }),
      db.auditLog.findMany({ where: { targetId: v.contentId }, orderBy: { createdAt: "desc" }, take: 30 }),
      db.taxonomyAuditLog.findMany({ where: { entityId: v.contentId }, orderBy: { createdAt: "desc" }, take: 30 }),
      db.channelStrike.count({ where: { userId: v.creatorId, revokedAt: null } }).catch(() => 0),
      db.video.count({ where: { creatorId: v.creatorId } }),
    ]);
    let suggestions: unknown = null;
    try { suggestions = v.tagSuggestions ? JSON.parse(v.tagSuggestions) : null; } catch { suggestions = null; }
    const brief = (x: { contentId: string; title: string; status: string; thumbnailUrl: string | null; createdAt: Date; creator: { name: string; channel: { username: string } | null } }) =>
      ({ contentId: x.contentId, title: x.title, status: x.status, thumbnailUrl: x.thumbnailUrl, createdAt: x.createdAt, creator: x.creator.channel?.username ?? x.creator.name });
    return Response.json({
      video: {
        id: v.id, contentId: v.contentId, title: v.title, description: v.description, hashtags: safeJsonArray(v.hashtags),
        status: v.status, rejectionReason: v.rejectionReason, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl,
        duration: v.duration, fileSizeMB: v.fileSizeMB, resolution: v.resolution, format: v.format,
        sha256: v.sha256, visualHash: v.visualHash, audioHash: v.audioHash,
        duplicateOfId: v.duplicateOfId, similarityScore: v.similarityScore, duplicateStatus: v.duplicateStatus,
        uploadRewardCredited: v.uploadRewardCredited, monetizationEnabled: v.monetizationEnabled, featured: v.featured,
        earningExpiresAt: v.earningExpiresAt, publishedAt: v.publishedAt, createdAt: v.createdAt, updatedAt: v.updatedAt,
        views: v.views, qualifiedViews: v.qualifiedViews, likes: v.likes, shares: v.shares,
        tagStatus: v.tagStatus, tagFlagReason: v.tagFlagReason, tagsUpdatedAt: v.tagsUpdatedAt,
        languages: dto.languages, tags: dto.tags, suggestions,
      },
      creator: {
        id: v.creatorId, name: v.creator.name, email: v.creator.email, status: v.creator.status, avatarUrl: v.creator.avatarUrl,
        username: v.creator.channel?.username ?? "", channelName: v.creator.channel?.name ?? v.creator.name,
        idCheck: v.creator.verification?.status ?? null, strikes, videoCount: creatorVideos,
        monetizationUnlocked: !!v.creator.monetizationUnlockedAt,
      },
      uniqueness: {
        original: original ? brief(original) : null,
        sameFile: sameFile.map(brief),
      },
      reports: reports.map(r => ({ id: r.id, reason: r.reason, details: r.details, status: r.status, createdAt: r.createdAt })),
      fraud: fraud.map(f => ({ id: f.id, type: f.type, severity: f.severity, details: f.details, status: f.status, createdAt: f.createdAt })),
      history: [
        ...audits.map(a => ({ at: a.createdAt, actor: a.actorEmail, action: a.action, details: a.details })),
        ...tagAudits.map(a => ({ at: a.createdAt, actor: a.actorEmail, action: a.action, details: null })),
      ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 40),
    });
  }

  if (seg === "videos") {
    const status = url.searchParams.get("status") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q) where.OR = [{ title: { contains: q } }, { contentId: { contains: q.toUpperCase() } }];
    const videos = await db.video.findMany({
      where, include: { creator: { include: { channel: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    });
    return Response.json({
      videos: videos.map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, status: v.status,
        category: v.category, thumbnailUrl: v.thumbnailUrl, duration: v.duration,
        views: v.views, qualifiedViews: v.qualifiedViews, likes: v.likes,
        rejectionReason: v.rejectionReason, featured: v.featured,
        monetizationEnabled: v.monetizationEnabled, similarityScore: v.similarityScore,
        duplicateOfId: v.duplicateOfId, duplicateStatus: v.duplicateStatus,
        createdAt: v.createdAt, publishedAt: v.publishedAt,
        sha256: v.sha256, visualHash: v.visualHash, audioHash: v.audioHash,
        creator: {
          name: v.creator.name, email: v.creator.email,
          username: v.creator.channel?.username ?? "", avatarUrl: v.creator.avatarUrl,
        },
      })),
    });
  }

  // ── DUPLICATES (review queue + appeals) ───────────────────────────────
  if (seg === "duplicates") {
    const [flagged, appeals] = await Promise.all([
      db.video.findMany({
        where: { status: "FLAGGED_DUPLICATE" },
        include: { creator: { include: { channel: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.appeal.findMany({
        where: {}, orderBy: { createdAt: "desc" },
        include: { video: { include: { creator: true } }, user: true },
      }),
    ]);
    return Response.json({
      queue: flagged.map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, thumbnailUrl: v.thumbnailUrl,
        similarityScore: v.similarityScore, duplicateOfId: v.duplicateOfId,
        duplicateStatus: v.duplicateStatus, createdAt: v.createdAt,
        sha256: v.sha256?.slice(0, 16) + "…", visualHash: v.visualHash, audioHash: v.audioHash,
        creator: { name: v.creator.name, username: v.creator.channel?.username ?? "", email: v.creator.email },
      })),
      appeals: appeals.map(a => ({
        id: a.id, reason: a.reason, status: a.status, createdAt: a.createdAt,
        video: a.video ? { contentId: a.video.contentId, title: a.video.title, similarityScore: a.video.similarityScore, duplicateOfId: a.video.duplicateOfId } : null,
        user: { name: a.user.name, email: a.user.email },
      })),
    });
  }

  // ── MONETIZATION SETTINGS + HISTORY ───────────────────────────────────
  if (seg === "monetization") {
    // "current" is the version in effect now; a version with a future date is only scheduled
    const [inEffect, history] = await Promise.all([
      getMonetizationSettings(),
      db.monetizationSetting.findMany({ orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }] }),
    ]);
    return Response.json({ current: inEffect, inEffectId: inEffect.id, history });
  }

  // ── UPLOAD RULES ──────────────────────────────────────────────────────
  if (seg === "upload-rules") {
    return Response.json({ rules: await getUploadRules() });
  }

  // ── EARNINGS MANAGEMENT ───────────────────────────────────────────────
  if (seg === "earnings") {
    const userId = url.searchParams.get("userId");
    if (userId) {
      const [user, entries, wallet] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, include: { channel: true } }),
        db.ledgerEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
        walletSummary(userId),
      ]);
      return Response.json({ user, entries, wallet });
    }
    const creators = await db.user.findMany({
      where: { role: "CREATOR", status: "APPROVED" }, include: { channel: true },
    });
    const list = await Promise.all(creators.map(async c => ({
      id: c.id, name: c.name, email: c.email, username: c.channel?.username ?? "",
      avatarUrl: c.avatarUrl, ...(await walletSummary(c.id)),
    })));
    list.sort((a, b) => b.lifetimeEarnings - a.lifetimeEarnings);
    return Response.json({ creators: list });
  }

  // ── WITHDRAWALS ───────────────────────────────────────────────────────
  if (seg === "withdrawals") {
    const status = url.searchParams.get("status") || "";
    const where = status ? { status } : {};
    const withdrawals = await db.withdrawal.findMany({
      where, include: { user: { include: { channel: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    });
    const totals = await db.withdrawal.groupBy({ by: ["status"], _sum: { amount: true } });
    return Response.json({
      withdrawals: withdrawals.map(w => ({
        id: w.id, amount: w.amount, method: w.method, status: w.status,
        details: JSON.parse(w.details), adminNote: w.adminNote, paymentRef: w.paymentRef,
        createdAt: w.createdAt, updatedAt: w.updatedAt,
        creator: {
          id: w.user.id, name: w.user.name, email: w.user.email,
          username: w.user.channel?.username ?? "", avatarUrl: w.user.avatarUrl,
        },
      })),
      totals: Object.fromEntries(totals.map(t => [t.status, round2(t._sum.amount ?? 0)])),
    });
  }

  // ── FRAUD MONITORING ──────────────────────────────────────────────────
  if (seg === "fraud") {
    const flags = await db.fraudFlag.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100,
    });
    const [viewEvents, excludedAgg] = await Promise.all([
      db.viewEvent.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { video: true } }),
      db.viewEvent.count({ where: { qualified: false } }),
    ]);
    return Response.json({
      flags,
      stats: { totalExcludedViews: excludedAgg },
      recentEvents: viewEvents.map(e => ({
        id: e.id, qualified: e.qualified, reason: e.reason, watchSeconds: e.watchSeconds,
        createdAt: e.createdAt, contentId: e.video.contentId,
      })),
    });
  }

  // ── CATEGORIES ────────────────────────────────────────────────────────
  if (seg === "categories") {
    const categories = await db.category.findMany({ orderBy: { name: "asc" } });
    const withCounts = await Promise.all(categories.map(async c => ({
      ...c, videoCount: await db.video.count({ where: { category: c.name } }),
    })));
    return Response.json({ categories: withCounts });
  }

  // ── HOMEPAGE MANAGEMENT ───────────────────────────────────────────────
  if (seg === "homepage") {
    const [videos, channels, setting] = await Promise.all([
      db.video.findMany({ where: { status: "APPROVED" }, orderBy: { views: "desc" }, take: 30, include: { creator: { include: { channel: true } } } }),
      db.channel.findMany({ where: { user: { status: "APPROVED" } }, take: 30 }),
      db.platformSetting.findUnique({ where: { key: "homepage" } }),
    ]);
    return Response.json({
      videos: videos.map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, thumbnailUrl: v.thumbnailUrl,
        views: v.views, featured: v.featured,
        creator: { username: v.creator.channel?.username ?? "", name: v.creator.name },
      })),
      channels: channels.map(c => ({ id: c.id, name: c.name, username: c.username, avatarUrl: c.avatarUrl, followerCount: c.followerCount })),
      config: setting ? JSON.parse(setting.value) : {},
    });
  }

  // ── REPORTS & ANALYTICS (exportable) ──────────────────────────────────
  if (seg === "reports") {
    const [creators, videos, earningsAgg, withdrawals] = await Promise.all([
      db.user.count({ where: { role: "CREATOR" } }),
      db.video.count(),
      db.ledgerEntry.aggregate({ _sum: { amount: true }, where: { type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] } } }),
      db.withdrawal.findMany({ include: { user: true } }),
    ]);
    const paid = withdrawals.filter(w => w.status === "PAID");
    return Response.json({
      summary: {
        creators, videos,
        totalEarnings: round2(earningsAgg._sum.amount ?? 0),
        paidOut: round2(paid.reduce((a, w) => a + w.amount, 0)),
        avgPayout: paid.length ? round2(paid.reduce((a, w) => a + w.amount, 0) / paid.length) : 0,
      },
    });
  }

  // ── ADMIN USERS ───────────────────────────────────────────────────────
  if (seg === "users") {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
    return Response.json({
      users: admins.map(a => ({
        id: a.id, name: a.name, email: a.email, adminRole: a.adminRole,
        status: a.status, createdAt: a.createdAt,
      })),
    });
  }

  // ── PLATFORM SETTINGS ─────────────────────────────────────────────────
  if (seg === "platform") {
    const keys = ["branding", "payouts", "homepage", "demo"];
    const settings: Record<string, unknown> = {};
    for (const k of keys) {
      const row = await db.platformSetting.findUnique({ where: { key: k } });
      settings[k] = row ? JSON.parse(row.value) : null;
    }
    settings.viewCounting = await getViewCounting(true);
    const [auditLog, mailLog, contacts, subscribers] = await Promise.all([
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      db.mailLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return Response.json({ settings, auditLog, mailLog, contacts, subscribers });
  }

  // ── SAFETY: user reports on videos + recent comments ───────────────────
  if (seg === "safety") {
    const [reports, comments] = await Promise.all([
      db.contentReport.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 150,
        include: { video: { include: { creator: { include: { channel: true } } } } },
      }),
      db.comment.findMany({
        orderBy: { createdAt: "desc" }, take: 150,
        include: { video: { select: { contentId: true, title: true, thumbnailUrl: true } } },
      }),
    ]);
    const authorIds = [...new Set(comments.map(c => c.userId).filter((x): x is string => !!x))];
    const authors = await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, email: true, role: true, status: true } });
    const byId = new Map(authors.map(a => [a.id, a]));
    return Response.json({
      reports: reports.map(r => ({
        id: r.id, reason: r.reason, details: r.details, status: r.status, createdAt: r.createdAt,
        reporter: r.reporterKey.slice(0, 8),
        video: {
          id: r.video.id, contentId: r.video.contentId, title: r.video.title, status: r.video.status,
          thumbnailUrl: r.video.thumbnailUrl, videoUrl: r.video.videoUrl,
          creator: { name: r.video.creator.name, username: r.video.creator.channel?.username ?? "" },
        },
      })),
      comments: comments.map(c => {
        const a = c.userId ? byId.get(c.userId) : undefined;
        return {
          id: c.id, body: c.body, authorName: c.authorName, authorAvatar: c.authorAvatar, createdAt: c.createdAt,
          author: a ? { id: a.id, email: a.email, role: a.role, status: a.status } : null,
          video: c.video,
        };
      }),
    });
  }

  // ── APP USERS (viewer accounts from the mobile app) ────────────────────
  if (seg === "app-users") {
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const where: Record<string, unknown> = { role: "VIEWER" };
    if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
    const users = await db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
    const ids = users.map(u => u.id);
    const [likes, comments, follows, sessions] = await Promise.all([
      db.videoLike.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: true }),
      db.comment.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: true }),
      db.follow.groupBy({ by: ["followerId"], where: { followerId: { in: ids } }, _count: true }),
      db.session.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _max: { createdAt: true } }),
    ]);
    const count = (rows: { _count: number }[], key: string, id: string) =>
      (rows as unknown as Record<string, unknown>[]).find(r => r[key] === id)?._count as number ?? 0;
    return Response.json({
      users: users.map(u => ({
        id: u.id, name: u.name, email: u.email, status: u.status, country: u.country,
        suspensionReason: u.suspensionReason, avatarUrl: u.avatarUrl, createdAt: u.createdAt,
        likes: count(likes, "userId", u.id), comments: count(comments, "userId", u.id),
        follows: count(follows, "followerId", u.id),
        lastLogin: sessions.find(s => s.userId === u.id)?._max.createdAt ?? null,
      })),
    });
  }

  return jsonError("Not found", 404);
}

export async function POST(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg, second, third, fourth] = segs;
  const body = await req.json().catch(() => ({}));
  // action endpoints: /api/admin/<section>/<id>/action
  if (third === "action" && second && seg) {
    const r = await requireAdmin(seg);
    if ("error" in r) return r.error;
    const me = r.me;

    // ── CREATOR ACTIONS ─────────────────────────────────────────────────
    if (seg === "creators") {
      const user = await db.user.findUnique({ where: { id: second }, include: { channel: true } });
      if (!user || user.role !== "CREATOR") return jsonError("Creator not found", 404);
      const action = String(body?.action || "");
      const reason = String(body?.reason || "").trim();

      if (action === "verify-id" || action === "reject-id") {
        const v = await db.creatorVerification.findUnique({ where: { userId: user.id } });
        if (!v) return jsonError("No ID document on file");
        if (action === "reject-id" && reason.length < 5) return jsonError("Tell the creator what's wrong with the document");
        await db.creatorVerification.update({ where: { id: v.id }, data: { status: action === "verify-id" ? "VERIFIED" : "REJECTED", reviewNote: reason || null, reviewedById: me.id, reviewedByEmail: me.email, reviewedAt: new Date() } });
        if (action === "reject-id") {
          await notify({ userId: user.id, type: "ACCOUNT_STATUS", title: "Please re-check your ID document", body: `We couldn't verify your government ID: ${reason} Reply to support@mykuchupuchu.com with a clear photo or PDF.`, link: "#/dashboard", email: { to: user.email, subject: "Kuchu Puchu: ID verification", body: reason } });
        }
        await audit({ actorId: me.id, actorEmail: me.email, action: action === "verify-id" ? "KYC_VERIFIED" : "KYC_REJECTED", targetType: "CREATOR", targetId: user.channel?.username ?? user.id, details: reason || undefined });
        return Response.json({ ok: true, message: action === "verify-id" ? "ID verified" : "ID marked as not verified — creator notified" });
      }
      if (action === "unlock-monetization" || action === "lock-monetization") {
        const unlock = action === "unlock-monetization";
        await db.user.update({ where: { id: user.id }, data: { monetizationUnlockedAt: unlock ? new Date() : null } });
        forgetUnlock(user.id);
        if (unlock) await notify({ userId: user.id, type: "MONETIZATION", title: "🎉 Monetization unlocked!", body: "Our team unlocked earning on your channel — approved uploads and qualified views now earn.", link: "#/dashboard" });
        await audit({ actorId: me.id, actorEmail: me.email, action: unlock ? "MONETIZATION_UNLOCKED_BY_ADMIN" : "MONETIZATION_LOCKED_BY_ADMIN", targetType: "CREATOR", targetId: user.channel?.username ?? user.id, details: reason || undefined });
        return Response.json({ ok: true, message: unlock ? "Monetization unlocked" : "Monetization locked until the channel reaches the views target again" });
      }
      if (action === "add-strike") {
        if (reason.length < 5) return jsonError("Describe the upheld complaint (at least 5 characters)");
        const r2 = await addStrike({ userId: user.id, reason, contentId: body?.contentId ? String(body.contentId) : null, actor: { id: me.id, email: me.email } });
        return Response.json({ ok: true, active: r2.active, suspended: r2.suspended, message: r2.suspended ? `Strike added — ${r2.active} strikes, channel suspended` : `Strike added (${r2.active} of ${STRIKE_LIMIT})` });
      }
      if (action === "revoke-strike") {
        const s2 = await revokeStrike(String(body?.strikeId || ""), reason, { id: me.id, email: me.email });
        if (!s2) return jsonError("Strike not found or already removed");
        return Response.json({ ok: true, message: "Strike removed" });
      }
      if (action === "approve") {
        const pendingId = await db.creatorVerification.findUnique({ where: { userId: user.id } });
        if (pendingId?.status === "REJECTED") return jsonError("The ID document was marked as not verified — verify a new document before approving");
        if (pendingId?.status === "PENDING") {
          await db.creatorVerification.update({ where: { id: pendingId.id }, data: { status: "VERIFIED", reviewedById: me.id, reviewedByEmail: me.email, reviewedAt: new Date() } });
        }
        await db.user.update({ where: { id: user.id }, data: { status: "APPROVED", rejectionReason: null, suspensionReason: null } });
        await notify({
          userId: user.id, type: "ACCOUNT_STATUS",
          title: "Your channel has been approved 🎉",
          body: `Welcome to Kuchu Puchu! "${user.channel?.name ?? user.name}" is now approved. You can upload original videos and start earning immediately.`,
          link: "#/dashboard/upload",
          email: { to: user.email, subject: "Your Kuchu Puchu channel is approved", body: "Start uploading original videos to earn from qualified views and approved uploads." },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "CREATOR_APPROVED", targetType: "CREATOR", targetId: user.channel?.username ?? user.id, details: reason || undefined });
        return Response.json({ ok: true, message: `${user.name} approved` });
      }
      if (action === "reject") {
        if (!reason) return jsonError("A rejection reason is required");
        await db.user.update({ where: { id: user.id }, data: { status: "REJECTED", rejectionReason: reason } });
        await notify({
          userId: user.id, type: "ACCOUNT_STATUS",
          title: "Your application was not approved",
          body: `Reason: ${reason} You can update your channel details and re-apply.`,
          link: "#/dashboard",
          email: { to: user.email, subject: "Your Kuchu Puchu application was not approved", body: `Reason: ${reason}` },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "CREATOR_REJECTED", targetType: "CREATOR", targetId: user.channel?.username ?? user.id, details: reason });
        return Response.json({ ok: true, message: `${user.name} rejected` });
      }
      if (action === "suspend") {
        if (!reason) return jsonError("A suspension reason is required");
        await db.user.update({ where: { id: user.id }, data: { status: "SUSPENDED", suspensionReason: reason } });
        await notify({
          userId: user.id, type: "WARNING",
          title: "Account suspended",
          body: `Your account has been suspended. Reason: ${reason} Contact support@mykuchupuchu.com to appeal.`,
          email: { to: user.email, subject: "Kuchu Puchu account suspended", body: `Reason: ${reason}` },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "CREATOR_SUSPENDED", targetType: "CREATOR", targetId: user.channel?.username ?? user.id, details: reason });
        return Response.json({ ok: true, message: `${user.name} suspended` });
      }
      if (action === "reactivate") {
        await db.user.update({ where: { id: user.id }, data: { status: "APPROVED", rejectionReason: null, suspensionReason: null } });
        await notify({
          userId: user.id, type: "ACCOUNT_STATUS",
          title: "Account reactivated ✅",
          body: "Your account has been reactivated. Welcome back!",
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "CREATOR_REACTIVATED", targetType: "CREATOR", targetId: user.channel?.username ?? user.id });
        return Response.json({ ok: true, message: `${user.name} reactivated` });
      }
      if (action === "toggle-eligibility") {
        const next = !user.monetizationEligible;
        await db.user.update({ where: { id: user.id }, data: { monetizationEligible: next } });
        await notify({
          userId: user.id, type: "MONETIZATION",
          title: next ? "Monetization enabled" : "Monetization paused",
          body: next ? "Your channel is eligible for monetization again." : "Monetization was paused on your channel by our trust & safety team.",
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: next ? "CREATOR_MONETIZATION_ON" : "CREATOR_MONETIZATION_OFF", targetType: "CREATOR", targetId: user.channel?.username ?? user.id });
        return Response.json({ ok: true, message: next ? "Monetization enabled" : "Monetization paused" });
      }
      return jsonError("Unknown action");
    }

    // ── VIDEO ACTIONS ───────────────────────────────────────────────────
    if (seg === "videos") {
      const video = await db.video.findFirst({ where: { OR: [{ id: second }, { contentId: second }] } });
      if (!video) return jsonError("Video not found", 404);
      const action = String(body?.action || "");
      const reason = String(body?.reason || "").trim();
      const settings = await getMonetizationSettings();

      if (action === "approve") {
        const publishedAt = video.publishedAt ?? new Date();
        const earningExpiresAt = new Date(publishedAt.getTime() + settings.monetizationDurationMonths * 30 * 864e5);
        await db.video.update({
          where: { id: video.id },
          data: { status: "APPROVED", rejectionReason: null, duplicateStatus: video.duplicateStatus === "PENDING_REVIEW" ? "FALSE_POSITIVE" : video.duplicateStatus, publishedAt, earningExpiresAt, monetizationEnabled: true },
        });
        // one-time upload reward on first approval — only while the channel meets the monthly view threshold
        let rewarded = false;
        if (!video.uploadRewardCredited) {
          rewarded = !!(await creditUploadReward({ userId: video.creatorId, videoId: video.id, contentId: video.contentId }));
          if (rewarded) await db.video.update({ where: { id: video.id }, data: { uploadRewardCredited: true } });
        }
        const m = await channelMonetization(video.creatorId);
        await notify({
          userId: video.creatorId, type: "VIDEO_STATUS",
          title: "Video approved 🎉",
          body: rewarded
            ? `"${video.title}" (${video.contentId}) is live. $${settings.rewardPerUpload.toFixed(2)} upload reward credited, and qualified views earn $${settings.ratePer1000Views.toFixed(2)} per 1,000.`
            : `"${video.title}" (${video.contentId}) is live. Earning unlocks once your channel gets ${m.threshold.toLocaleString()} views within 30 days (you're at ${m.last30DaysViews.toLocaleString()}) — after that, every approved upload and qualified view earns.`,
          link: "#/dashboard/videos",
          email: { to: (await db.user.findUnique({ where: { id: video.creatorId } }))!.email, subject: `Approved: ${video.title}`, body: "Your video passed review and is now earning." },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "VIDEO_APPROVED", targetType: "VIDEO", targetId: video.contentId, details: reason || undefined });
        return Response.json({ ok: true, message: `${video.contentId} approved` });
      }
      if (action === "reject") {
        if (!reason) return jsonError("A rejection reason is required");
        await db.video.update({ where: { id: video.id }, data: { status: "REJECTED", rejectionReason: reason, monetizationEnabled: false } });
        await notify({
          userId: video.creatorId, type: "VIDEO_STATUS",
          title: "Video not approved",
          body: `"${video.title}" (${video.contentId}) was not approved. Reason: ${reason}`,
          link: "#/dashboard/videos",
          email: { to: (await db.user.findUnique({ where: { id: video.creatorId } }))!.email, subject: `Not approved: ${video.title}`, body: `Reason: ${reason}` },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "VIDEO_REJECTED", targetType: "VIDEO", targetId: video.contentId, details: reason });
        return Response.json({ ok: true, message: `${video.contentId} rejected` });
      }
      if (action === "remove") {
        await db.video.update({ where: { id: video.id }, data: { status: "REMOVED", monetizationEnabled: false } });
        await notify({
          userId: video.creatorId, type: "VIDEO_STATUS",
          title: "Video removed",
          body: `"${video.title}" (${video.contentId}) was removed for policy violations. Reason: ${reason || "Community guidelines"}`,
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "VIDEO_REMOVED", targetType: "VIDEO", targetId: video.contentId, details: reason });
        if (body?.strike) {
          const st = await addStrike({ userId: video.creatorId, reason: reason || "Community guidelines violation", contentId: video.contentId, actor: { id: me.id, email: me.email } });
          return Response.json({ ok: true, message: `${video.contentId} removed — strike ${st.active} of ${STRIKE_LIMIT}${st.suspended ? ", channel suspended" : ""}` });
        }
        return Response.json({ ok: true, message: `${video.contentId} removed` });
      }
      if (action === "update-details") {
        const title = String(body?.title ?? "").trim().replace(/\s+/g, " ");
        const description = String(body?.description ?? "").trim();
        const tagsIn = Array.isArray(body?.hashtags) ? body.hashtags.join(" ") : String(body?.hashtags ?? "");
        const hashtags = [...new Set<string>(String(tagsIn).split(/[\s,]+/).map((h: string) => h.replace(/^#+/, "").trim()).filter(Boolean))].slice(0, 10)
          .map((h: string) => h.slice(0, 40));
        if (title.length < 3) return jsonError("Title must be at least 3 characters");
        if (title.length > 100) return jsonError("Title can be at most 100 characters");
        if (description.length > 1000) return jsonError("Description can be at most 1,000 characters");
        const before = { title: video.title, description: video.description, hashtags: safeJsonArray(video.hashtags) };
        const after = { title, description, hashtags };
        if (JSON.stringify(before) === JSON.stringify(after)) return Response.json({ ok: true, message: "No changes" });
        await db.video.update({ where: { id: video.id }, data: { title, description, hashtags: JSON.stringify(hashtags) } });
        const changed = (["title", "description", "hashtags"] as const).filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
        await notify({
          userId: video.creatorId, type: "VIDEO_STATUS",
          title: "Video details updated",
          body: `Our team updated the ${changed.join(", ")} of "${title}" (${video.contentId}). Your views and earnings are not affected.`,
          link: "#/dashboard/videos",
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "VIDEO_DETAILS_EDITED", targetType: "VIDEO", targetId: video.contentId, details: JSON.stringify({ changed, before, after }).slice(0, 2000) });
        return Response.json({ ok: true, message: "Video details saved" });
      }
      if (action === "toggle-monetization") {
        const next = !video.monetizationEnabled;
        await db.video.update({ where: { id: video.id }, data: { monetizationEnabled: next } });
        await audit({ actorId: me.id, actorEmail: me.email, action: next ? "VIDEO_MONETIZATION_ON" : "VIDEO_MONETIZATION_OFF", targetType: "VIDEO", targetId: video.contentId });
        return Response.json({ ok: true, message: next ? "Monetization enabled" : "Monetization restricted" });
      }
      if (action === "toggle-featured") {
        const next = !video.featured;
        await db.video.update({ where: { id: video.id }, data: { featured: next } });
        await audit({ actorId: me.id, actorEmail: me.email, action: next ? "VIDEO_FEATURED" : "VIDEO_UNFEATURED", targetType: "VIDEO", targetId: video.contentId });
        return Response.json({ ok: true, message: next ? "Added to homepage" : "Removed from homepage" });
      }
      return jsonError("Unknown action");
    }

    // ── WITHDRAWAL ACTIONS ──────────────────────────────────────────────
    if (seg === "withdrawals") {
      const w = await db.withdrawal.findUnique({ where: { id: second }, include: { user: true } });
      if (!w) return jsonError("Withdrawal not found", 404);
      const action = String(body?.action || "");
      const note = String(body?.note || "").trim();
      const ref = String(body?.paymentRef || "").trim();
      const transitions: Record<string, string[]> = {
        approve: ["REQUESTED", "UNDER_REVIEW"], review: ["REQUESTED"],
        processing: ["APPROVED"], paid: ["APPROVED", "PROCESSING"], reject: ["REQUESTED", "UNDER_REVIEW", "APPROVED"],
      };
      const actionKey = action === "review" ? "review" : action;
      if (!transitions[actionKey]) return jsonError("Unknown action");
      if (!transitions[actionKey].includes(w.status)) {
        return jsonError(`Cannot ${action} a withdrawal in "${w.status}" status`);
      }
      // move the status only if it is still what we checked: a double click or two admins can't apply it twice
      const move = async (data: Record<string, unknown>) =>
        (await db.withdrawal.updateMany({ where: { id: w.id, status: { in: transitions[actionKey] } }, data })).count === 1;
      const changedMeanwhile = () => jsonError("This withdrawal was just updated by someone else. Reload and check it.", 409);

      if (action === "review") {
        if (!(await move({ status: "UNDER_REVIEW" }))) return changedMeanwhile();
        return Response.json({ ok: true, message: "Moved to review" });
      }
      if (action === "approve") {
        if (!(await move({ status: "APPROVED", adminNote: note || w.adminNote }))) return changedMeanwhile();
        await notify({
          userId: w.userId, type: "WITHDRAWAL",
          title: "Withdrawal approved",
          body: `Your $${w.amount.toFixed(2)} withdrawal was approved and is being prepared for payment.`,
          link: "#/dashboard/withdraw",
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "WITHDRAWAL_APPROVED", targetType: "WITHDRAWAL", targetId: w.id, details: `$${w.amount}` });
        return Response.json({ ok: true, message: "Withdrawal approved" });
      }
      if (action === "processing") {
        if (!(await move({ status: "PROCESSING" }))) return changedMeanwhile();
        return Response.json({ ok: true, message: "Marked as processing" });
      }
      if (action === "paid") {
        const paymentRef = ref || payoutRef();
        if (!(await move({ status: "PAID", paymentRef, adminNote: note || w.adminNote, updatedAt: new Date() }))) return changedMeanwhile();
        // immutable ledger trail for the payout
        await db.ledgerEntry.create({
          data: {
            userId: w.userId, type: "WITHDRAWAL_PAID", amount: -w.amount, status: "FINALIZED",
            description: `Payout ${paymentRef} via ${w.method === "PAYPAL" ? "PayPal" : "bank transfer"}`,
            reference: paymentRef, withdrawalId: w.id,
          },
        });
        await notify({
          userId: w.userId, type: "WITHDRAWAL",
          title: "Withdrawal paid ✅",
          body: `Your $${w.amount.toFixed(2)} withdrawal (${paymentRef}) has been paid. It should arrive within 1–3 business days depending on your payout method.`,
          link: "#/dashboard/transactions",
          email: { to: w.user.email, subject: `Paid: $${w.amount.toFixed(2)}`, body: `Payment reference ${paymentRef}.` },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "WITHDRAWAL_PAID", targetType: "WITHDRAWAL", targetId: w.id, details: `$${w.amount} ref ${paymentRef}` });
        return Response.json({ ok: true, message: `Marked as paid (${paymentRef})` });
      }
      if (action === "reject") {
        if (!note) return jsonError("A rejection reason is required");
        if (!(await move({ status: "REJECTED", adminNote: note }))) return changedMeanwhile();
        await db.ledgerEntry.create({
          data: {
            userId: w.userId, type: "WITHDRAWAL_REJECTED", amount: w.amount, status: "FINALIZED",
            description: `Withdrawal rejected — funds returned to available balance. Reason: ${note}`,
            withdrawalId: w.id,
          },
        });
        await notify({
          userId: w.userId, type: "WITHDRAWAL",
          title: "Withdrawal rejected",
          body: `Your $${w.amount.toFixed(2)} withdrawal was rejected. Reason: ${note} The funds have been returned to your available balance.`,
          link: "#/dashboard/withdraw",
          email: { to: w.user.email, subject: `Withdrawal rejected: $${w.amount.toFixed(2)}`, body: `Reason: ${note}` },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "WITHDRAWAL_REJECTED", targetType: "WITHDRAWAL", targetId: w.id, details: note });
        return Response.json({ ok: true, message: "Withdrawal rejected — funds released" });
      }
    }

    // ── USER REPORTS ON VIDEOS ──────────────────────────────────────────
    if (seg === "content-reports") {
      const report = await db.contentReport.findUnique({ where: { id: second }, include: { video: true } });
      if (!report) return jsonError("Report not found", 404);
      const action = String(body?.action || "");
      if (action === "dismiss" || action === "resolve") {
        await db.contentReport.update({ where: { id: report.id }, data: { status: "RESOLVED" } });
        await audit({ actorId: me.id, actorEmail: me.email, action: action === "dismiss" ? "REPORT_DISMISSED" : "REPORT_RESOLVED", targetType: "VIDEO", targetId: report.video.contentId, details: report.reason });
        return Response.json({ ok: true, message: action === "dismiss" ? "Report dismissed" : "Report resolved" });
      }
      if (action === "remove-video" || action === "remove-video-strike") {
        const reason = String(body?.reason || "").trim() || `Removed after a user report (${report.reason.toLowerCase()})`;
        await db.video.update({ where: { id: report.videoId }, data: { status: "REMOVED", rejectionReason: reason, monetizationEnabled: false } });
        // one decision closes every open report on that video
        await db.contentReport.updateMany({ where: { videoId: report.videoId, status: "OPEN" }, data: { status: "RESOLVED" } });
        await notify({
          userId: report.video.creatorId, type: "VIDEO_STATUS",
          title: "Video removed",
          body: `"${report.video.title}" (${report.video.contentId}) was removed after review. Reason: ${reason}`,
          link: "#/dashboard/videos",
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "VIDEO_REMOVED", targetType: "VIDEO", targetId: report.video.contentId, details: reason });
        if (action === "remove-video-strike") {
          const st = await addStrike({ userId: report.video.creatorId, reason, contentId: report.video.contentId, reportId: report.id, actor: { id: me.id, email: me.email } });
          return Response.json({ ok: true, message: `${report.video.contentId} removed — strike ${st.active} of ${STRIKE_LIMIT}${st.suspended ? ", channel suspended" : ""}` });
        }
        return Response.json({ ok: true, message: `${report.video.contentId} removed and reports closed` });
      }
      return jsonError("Unknown action");
    }

    // ── COMMENT MODERATION ──────────────────────────────────────────────
    if (seg === "comments") {
      const comment = await db.comment.findUnique({ where: { id: second }, include: { video: true } });
      if (!comment) return jsonError("Comment not found", 404);
      if (String(body?.action || "") !== "delete") return jsonError("Unknown action");
      await db.comment.delete({ where: { id: comment.id } });
      await db.video.update({ where: { id: comment.videoId }, data: { commentsCount: { decrement: 1 } } });
      await audit({ actorId: me.id, actorEmail: me.email, action: "COMMENT_DELETED", targetType: "COMMENT", targetId: comment.video.contentId, details: `${comment.authorName}: ${comment.body.slice(0, 120)}` });
      return Response.json({ ok: true, message: "Comment deleted" });
    }

    // ── APP USER ACCOUNTS ───────────────────────────────────────────────
    if (seg === "app-users") {
      const user = await db.user.findUnique({ where: { id: second } });
      if (!user || user.role !== "VIEWER") return jsonError("User not found", 404);
      const action = String(body?.action || "");
      const reason = String(body?.reason || "").trim();
      if (action === "suspend") {
        if (!reason) return jsonError("A suspension reason is required");
        await db.user.update({ where: { id: user.id }, data: { status: "SUSPENDED", suspensionReason: reason } });
        await db.session.deleteMany({ where: { userId: user.id } }); // signs them out of the app
        await audit({ actorId: me.id, actorEmail: me.email, action: "APP_USER_SUSPENDED", targetType: "USER", targetId: user.email, details: reason });
        return Response.json({ ok: true, message: `${user.name} suspended and signed out` });
      }
      if (action === "reactivate") {
        await db.user.update({ where: { id: user.id }, data: { status: "APPROVED", suspensionReason: null } });
        await audit({ actorId: me.id, actorEmail: me.email, action: "APP_USER_REACTIVATED", targetType: "USER", targetId: user.email });
        return Response.json({ ok: true, message: `${user.name} reactivated` });
      }
      if (action === "delete-comments") {
        const mine = await db.comment.findMany({ where: { userId: user.id }, select: { id: true, videoId: true } });
        for (const c of mine) {
          await db.comment.delete({ where: { id: c.id } });
          await db.video.update({ where: { id: c.videoId }, data: { commentsCount: { decrement: 1 } } });
        }
        await audit({ actorId: me.id, actorEmail: me.email, action: "APP_USER_COMMENTS_DELETED", targetType: "USER", targetId: user.email, details: `${mine.length} comments` });
        return Response.json({ ok: true, message: `${mine.length} comment(s) deleted` });
      }
      return jsonError("Unknown action");
    }

    // ── DUPLICATE RESOLUTION ────────────────────────────────────────────
    if (seg === "duplicates") {
      const video = await db.video.findFirst({ where: { OR: [{ id: second }, { contentId: second }] } });
      if (!video) return jsonError("Video not found", 404);
      const action = String(body?.action || "");
      const reason = String(body?.reason || "").trim();

      if (action === "confirm-duplicate") {
        await db.video.update({
          where: { id: video.id },
          data: { status: "REJECTED", duplicateStatus: "CONFIRMED_DUPLICATE", monetizationEnabled: false, rejectionReason: reason || "Duplicate of existing content" },
        });
        await db.fraudFlag.updateMany({
          where: { videoId: video.contentId, status: "OPEN" }, data: { status: "CONFIRMED" },
        });
        await notify({
          userId: video.creatorId, type: "DUPLICATE",
          title: "Duplicate confirmed — video rejected",
          body: `Review confirmed that ${video.contentId} duplicates ${video.duplicateOfId}. No rewards were paid. Reason: ${reason || "visual/audio fingerprint match"}`,
          email: { to: (await db.user.findUnique({ where: { id: video.creatorId } }))!.email, subject: `Duplicate confirmed: ${video.contentId}`, body: "The video was rejected and no rewards were paid." },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "DUPLICATE_CONFIRMED", targetType: "VIDEO", targetId: video.contentId, details: `matches ${video.duplicateOfId} @ ${Math.round((video.similarityScore ?? 0) * 100)}%` });
        return Response.json({ ok: true, message: "Duplicate confirmed — video rejected" });
      }
      if (action === "false-positive") {
        const settings = await getMonetizationSettings();
        const publishedAt = new Date();
        await db.video.update({
          where: { id: video.id },
          data: {
            status: "APPROVED", duplicateStatus: "FALSE_POSITIVE", monetizationEnabled: true,
            rejectionReason: null, publishedAt,
            earningExpiresAt: new Date(publishedAt.getTime() + settings.monetizationDurationMonths * 30 * 864e5),
          },
        });
        await db.fraudFlag.updateMany({
          where: { videoId: video.contentId, status: "OPEN" }, data: { status: "DISMISSED" },
        });
        let rewarded = false;
        if (!video.uploadRewardCredited) {
          rewarded = !!(await creditUploadReward({ userId: video.creatorId, videoId: video.id, contentId: video.contentId }));
          if (rewarded) await db.video.update({ where: { id: video.id }, data: { uploadRewardCredited: true } });
        }
        await notify({
          userId: video.creatorId, type: "DUPLICATE",
          title: "False positive — video approved 🎉",
          body: `Our review confirmed ${video.contentId} is original. It's now live${rewarded ? " and your upload reward has been credited" : ""}. Sorry for the wait!`,
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: "DUPLICATE_FALSE_POSITIVE", targetType: "VIDEO", targetId: video.contentId });
        return Response.json({ ok: true, message: "Cleared as false positive — video approved" });
      }
      return jsonError("Unknown action");
    }

    // ── FRAUD FLAGS ─────────────────────────────────────────────────────
    if (seg === "fraud") {
      const flag = await db.fraudFlag.findUnique({ where: { id: second } });
      if (!flag) return jsonError("Flag not found", 404);
      const action = String(body?.action || "");
      if (action === "dismiss" || action === "confirm") {
        await db.fraudFlag.update({
          where: { id: flag.id },
          data: { status: action === "dismiss" ? "DISMISSED" : "CONFIRMED" },
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: action === "dismiss" ? "FRAUD_DISMISSED" : "FRAUD_CONFIRMED", targetType: "FRAUD", targetId: flag.id, details: flag.type });
        return Response.json({ ok: true, message: action === "dismiss" ? "Flag dismissed" : "Flag confirmed" });
      }
      return jsonError("Unknown action");
    }

    // ── APPEALS ─────────────────────────────────────────────────────────
    if (seg === "appeals") {
      const appeal = await db.appeal.findUnique({ where: { id: second }, include: { video: true } });
      if (!appeal) return jsonError("Appeal not found", 404);
      const action = String(body?.action || "");
      if (action === "approve" || action === "reject") {
        await db.appeal.update({ where: { id: appeal.id }, data: { status: action === "approve" ? "APPROVED" : "REJECTED" } });
        await notify({
          userId: appeal.userId, type: "DUPLICATE",
          title: action === "approve" ? "Appeal approved ✅" : "Appeal declined",
          body: action === "approve"
            ? `Your appeal for ${appeal.video?.contentId} was approved. The video will be re-reviewed for publication.`
            : `Your appeal for ${appeal.video?.contentId} was declined. The duplicate finding stands.`,
        });
        await audit({ actorId: me.id, actorEmail: me.email, action: `APPEAL_${action.toUpperCase()}`, targetType: "APPEAL", targetId: appeal.id });
        return Response.json({ ok: true, message: action === "approve" ? "Appeal approved" : "Appeal declined" });
      }
      return jsonError("Unknown action");
    }

    return jsonError("Unknown action section");
  }

  // ── CONFIG ENDPOINTS (body-based) ─────────────────────────────────────
  if (seg === "monetization" || seg === "upload-rules" || seg === "homepage" ||
      seg === "broadcast" || seg === "categories" || seg === "users" || seg === "platform" || seg === "adjust") {
    // "users" and "platform" are SUPER_ADMIN-only sections (they were wrongly gated on "overview",
    // which let FINANCE/MODERATOR admins create super-admin accounts)
    const r = await requireAdmin(
      seg === "adjust" ? "earnings" : seg === "broadcast" ? "notifications" : seg
    );
    if ("error" in r) return r.error;
    const me = r.me;

    // new monetization settings (append-only history; effective date)
    if (seg === "monetization") {
      const num = (v: unknown, d: number) => {
        const n = parseFloat(String(v));
        return Number.isFinite(n) && n >= 0 ? n : d;
      };
      const current = await getMonetizationSettings();
      // effective date: empty or today = from now; a future day = scheduled; the past is refused
      // (a back-dated version would never apply, and past earnings keep their rates anyway)
      let effectiveDate = new Date();
      if (body?.effectiveDate) {
        const d = new Date(String(body.effectiveDate));
        if (Number.isNaN(d.getTime())) return jsonError("The effective date isn't a valid date.");
        const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
        if (d < todayStart) return jsonError("The effective date can't be in the past. Leave it empty to apply the change now, or pick a future date.");
        if (d > effectiveDate) effectiveDate = d;
      }
      const next = {
        ratePer1000Views: Math.max(0.01, num(body?.ratePer1000Views, current.ratePer1000Views)),
        // the upload reward is set in INR and converted to the USD amount the ledger pays
        rewardPerUploadInr: Math.max(0, num(body?.rewardPerUploadInr, current.rewardPerUploadInr)),
        inrPerUsd: Math.max(1, num(body?.inrPerUsd, current.inrPerUsd)),
        minMonthlyChannelViews: Math.max(0, Math.min(1_000_000, Math.round(num(body?.minMonthlyChannelViews, current.minMonthlyChannelViews)))),
        rewardPerUpload: 0,
        monetizationDurationMonths: Math.max(1, Math.min(24, Math.round(num(body?.monetizationDurationMonths, current.monetizationDurationMonths)))),
        minWithdrawalAmount: Math.max(1, num(body?.minWithdrawalAmount, current.minWithdrawalAmount)),
        holdingPeriodDays: Math.max(0, Math.min(90, Math.round(num(body?.holdingPeriodDays, current.holdingPeriodDays)))),
        monetizationPaused: !!body?.monetizationPaused,
        effectiveDate,
      };
      next.rewardPerUpload = round2(next.rewardPerUploadInr / next.inrPerUsd);
      await db.monetizationSetting.update({ where: { id: current.id }, data: { active: false } });
      const created = await db.monetizationSetting.create({ data: { ...next, createdBy: me.email } });
      // notify creators about rate changes
      if (next.ratePer1000Views !== current.ratePer1000Views || next.rewardPerUploadInr !== current.rewardPerUploadInr || next.minMonthlyChannelViews !== current.minMonthlyChannelViews) {
        const creators = await db.user.findMany({ where: { role: "CREATOR", status: "APPROVED" }, select: { id: true } });
        for (const c of creators) {
          await notify({
            userId: c.id, type: "MONETIZATION",
            title: "Monetization rates updated",
            body: `New rates effective ${next.effectiveDate.toLocaleDateString()}: $${next.ratePer1000Views.toFixed(2)} per 1,000 qualified views and $${next.rewardPerUpload.toFixed(2)} per approved upload. New channels unlock earning once they get ${next.minMonthlyChannelViews.toLocaleString()} views within 30 days. Earnings already credited are not affected.`,
          });
        }
      }
      await audit({ actorId: me.id, actorEmail: me.email, action: "SETTINGS_MONETIZATION_UPDATED", targetType: "SETTING", details: JSON.stringify(next) });
      return Response.json({ ok: true, settings: created, message: "Monetization settings saved — historical earnings keep their original rates" });
    }

    if (seg === "upload-rules") {
      const rules = await getUploadRules();
      const int = (v: unknown, d: number, min: number, max: number) => {
        const n = Math.round(parseFloat(String(v)));
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
      };
      const minDur = int(body?.minDurationSec, rules.minDurationSec, 5, 600);
      const maxDur = int(body?.maxDurationSec, rules.maxDurationSec, 10, 3600);
      if (minDur >= maxDur) return jsonError("The minimum video length must be shorter than the maximum.");
      const formats = String(body?.formats || rules.formats).toLowerCase()
        .split(",").map(f => f.trim().replace(/^\./, "")).filter(Boolean).join(",");
      const updated = await db.uploadRule.update({
        where: { id: rules.id },
        data: {
          minDurationSec: minDur,
          maxDurationSec: maxDur,
          maxFileSizeMB: int(body?.maxFileSizeMB, rules.maxFileSizeMB, 10, 2048),
          maxResolution: String(body?.maxResolution || rules.maxResolution),
          formats: formats || "mp4,mov",
          maxDailyUploads: int(body?.maxDailyUploads, rules.maxDailyUploads, 1, 50),
          maxWeeklyUploads: int(body?.maxWeeklyUploads, rules.maxWeeklyUploads, 1, 200),
          requireVideoApproval: body?.requireVideoApproval ?? rules.requireVideoApproval,
          rewardRequiresApproval: body?.rewardRequiresApproval ?? rules.rewardRequiresApproval,
        },
      });
      await audit({ actorId: me.id, actorEmail: me.email, action: "SETTINGS_UPLOAD_RULES_UPDATED", targetType: "SETTING", details: JSON.stringify(body) });
      return Response.json({ ok: true, rules: updated, message: "Upload rules saved" });
    }

    if (seg === "homepage") {
      const config = {
        heroTitle: String(body?.heroTitle || "Create Videos. Get Views. Earn Real Money."),
        heroSubtitle: String(body?.heroSubtitle || ""),
        announcement: String(body?.announcement || ""),
      };
      await setSetting("homepage", config);
      await audit({ actorId: me.id, actorEmail: me.email, action: "HOMEPAGE_UPDATED", targetType: "SETTING", details: JSON.stringify(config) });
      return Response.json({ ok: true, message: "Homepage content saved" });
    }

    if (seg === "broadcast") {
      const title = String(body?.title || "").trim();
      const message = String(body?.message || "").trim();
      if (!title || !message) return jsonError("Title and message are required");
      const creators = await db.user.findMany({
        where: { role: "CREATOR", status: { in: ["APPROVED", "PENDING"] } }, select: { id: true, email: true },
      });
      for (const c of creators) {
        await notify({
          userId: c.id, type: "ANNOUNCEMENT", title, body: message,
          email: { to: c.email, subject: title, body: message },
        });
      }
      await audit({ actorId: me.id, actorEmail: me.email, action: "BROADCAST_SENT", targetType: "NOTIFICATION", details: `${creators.length} recipients: ${title}` });
      return Response.json({ ok: true, message: `Announcement sent to ${creators.length} creators` });
    }

    if (seg === "categories") {
      const name = String(body?.name || "").trim();
      const icon = String(body?.icon || "Film").trim();
      if (!name) return jsonError("Category name is required");
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const exists = await db.category.findFirst({ where: { OR: [{ name }, { slug }] } });
      if (exists) return jsonError("A category with this name already exists");
      const cat = await db.category.create({ data: { name, slug, icon, description: `Original ${name.toLowerCase()} shorts.` } });
      await audit({ actorId: me.id, actorEmail: me.email, action: "CATEGORY_CREATED", targetType: "CATEGORY", targetId: slug });
      return Response.json({ ok: true, category: cat, message: `Category "${name}" created` });
    }

    if (seg === "users") {
      const name = String(body?.name || "").trim();
      const email = String(body?.email || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const adminRole = String(body?.adminRole || "MODERATOR");
      if (!name || !email || password.length < 8) return jsonError("Name, email and a password of 8+ characters are required");
      if (!["SUPER_ADMIN", "FINANCE", "MODERATOR"].includes(adminRole)) return jsonError("Invalid role");
      const exists = await db.user.findUnique({ where: { email } });
      if (exists) return jsonError("A user with this email already exists");
      const user = await db.user.create({
        data: { name, email, passwordHash: hashPassword(password), role: "ADMIN", adminRole, status: "APPROVED", emailVerified: true },
      });
      await audit({ actorId: me.id, actorEmail: me.email, action: "ADMIN_CREATED", targetType: "ADMIN", targetId: email, details: adminRole });
      return Response.json({ ok: true, message: `Admin ${name} (${adminRole}) created` }, { status: 201 });
    }

    if (seg === "platform") {
      const branding = body?.branding;
      if (branding) {
        await setSetting("branding", {
          name: String(branding.name || "Kuchu Puchu").slice(0, 30),
          tagline: String(branding.tagline || "").slice(0, 80),
          supportEmail: String(branding.supportEmail || "support@mykuchupuchu.com"),
          domain: String(branding.domain || "mykuchupuchu.com"),
        });
      }
      const payouts = body?.payouts;
      if (payouts) {
        await setSetting("payouts", {
          methods: Array.isArray(payouts.methods) ? payouts.methods.slice(0, 5) : [],
          processingDays: String(payouts.processingDays || "3–5 business days"),
        });
      }
      const vc = body?.viewCounting;
      if (vc) {
        const hours = Number(vc.repeatWindowHours);
        if (!Number.isFinite(hours) || hours < 1 || hours > 72 || Math.round(hours) !== hours) {
          return jsonError("The repeat-view window must be a whole number of hours from 1 to 72.");
        }
        const cap = vc.maxViewsPerNetwork === undefined ? (await getViewCounting(true)).maxViewsPerNetwork : Number(vc.maxViewsPerNetwork);
        if (!Number.isFinite(cap) || cap < 1 || cap > 100 || Math.round(cap) !== cap) {
          return jsonError("Views per internet connection must be a whole number from 1 to 100.");
        }
        const next = { appOnly: vc.appOnly !== false, repeatWindowHours: hours, maxViewsPerNetwork: cap };
        await setSetting("viewCounting", next);
        forgetViewCounting();
        await audit({ actorId: me.id, actorEmail: me.email, action: "VIEW_COUNTING_UPDATED", targetType: "SETTING", details: JSON.stringify(next) });
        return Response.json({ ok: true, message: `View counting saved: ${next.appOnly ? "app views only" : "app and website views"}, one view per viewer every ${hours} h, up to ${cap} per video from one internet connection` });
      }
      await audit({ actorId: me.id, actorEmail: me.email, action: "PLATFORM_SETTINGS_UPDATED", targetType: "SETTING" });
      return Response.json({ ok: true, message: "Platform settings saved" });
    }

    // audited earnings adjustment
    if (seg === "adjust") {
      const userId = String(body?.userId || "");
      const amount = round2(parseFloat(body?.amount));
      const reason = String(body?.reason || "").trim();
      if (!userId) return jsonError("Creator is required");
      if (!Number.isFinite(amount) || amount === 0) return jsonError("Enter a non-zero amount (use negatives to reverse)");
      if (reason.length < 5) return jsonError("An adjustment reason is required (audited)");
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== "CREATOR") return jsonError("Creator not found", 404);
      const settings = await getMonetizationSettings();
      const entry = await db.ledgerEntry.create({
        data: {
          userId, type: "ADJUSTMENT", amount, status: "PENDING",
          availableAt: new Date(Date.now() + (amount > 0 ? settings.holdingPeriodDays * 864e5 : 0)),
          description: `Admin adjustment by ${me.email}: ${reason}`,
          reference: `TXN-ADJ-${Date.now().toString(36).toUpperCase()}`,
        },
      });
      await notify({
        userId, type: "EARNING",
        title: amount > 0 ? "Earnings adjusted (+)" : "Earnings adjusted (−)",
        body: `An adjustment of ${amount > 0 ? "+" : ""}$${amount.toFixed(2)} was applied to your balance. Reason: ${reason}`,
        link: "#/dashboard/transactions",
      });
      await audit({ actorId: me.id, actorEmail: me.email, action: "EARNINGS_ADJUSTMENT", targetType: "CREATOR", targetId: user.email, details: `$${amount} — ${reason}` });
      return Response.json({ ok: true, entry, message: `Adjustment of $${amount.toFixed(2)} recorded` });
    }
  }

  return jsonError("Not found", 404);
}
