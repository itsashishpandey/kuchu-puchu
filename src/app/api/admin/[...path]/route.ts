import { db } from "@/lib/db";
import { getSessionUser, hashPassword, jsonError } from "@/lib/auth";
import { getMonetizationSettings, getUploadRules, walletSummary, creditUploadReward, round2 } from "@/lib/monetization";
import { notify, audit, setSetting, getSetting, payoutRef } from "@/lib/platform";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  FINANCE: ["overview", "withdrawals", "earnings", "reports", "creators", "videos", "duplicates", "fraud", "notifications", "mail"],
  MODERATOR: ["overview", "creators", "videos", "duplicates", "fraud", "categories", "notifications", "mail", "reports"],
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
        db.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: { type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] }, status: "PENDING" },
        }),
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
      where, include: { channel: true }, orderBy: { createdAt: "desc" }, take: 100,
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
      };
    }));
    return Response.json({ creators: list });
  }

  // ── VIDEOS ────────────────────────────────────────────────────────────
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
    const history = await db.monetizationSetting.findMany({ orderBy: { effectiveDate: "desc" } });
    return Response.json({ current: history[0] ?? (await getMonetizationSettings()), history });
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
    const [auditLog, mailLog, contacts, subscribers] = await Promise.all([
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      db.mailLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return Response.json({ settings, auditLog, mailLog, contacts, subscribers });
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

      if (action === "approve") {
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
          body: `Your account has been suspended. Reason: ${reason} Contact support@kuchupuchu.com to appeal.`,
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
        // credit one-time upload reward on first approval
        if (!video.uploadRewardCredited) {
          await creditUploadReward({ userId: video.creatorId, videoId: video.id, contentId: video.contentId });
          await db.video.update({ where: { id: video.id }, data: { uploadRewardCredited: true } });
        }
        await notify({
          userId: video.creatorId, type: "VIDEO_STATUS",
          title: "Video approved 🎉",
          body: `"${video.title}" (${video.contentId}) is live and monetized. $${settings.rewardPerUpload.toFixed(2)} upload reward credited and qualified views now earn $${settings.ratePer1000Views.toFixed(2)} per 1,000.`,
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
        return Response.json({ ok: true, message: `${video.contentId} removed` });
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

      if (action === "review") {
        await db.withdrawal.update({ where: { id: w.id }, data: { status: "UNDER_REVIEW" } });
        return Response.json({ ok: true, message: "Moved to review" });
      }
      if (action === "approve") {
        await db.withdrawal.update({ where: { id: w.id }, data: { status: "APPROVED", adminNote: note || w.adminNote } });
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
        await db.withdrawal.update({ where: { id: w.id }, data: { status: "PROCESSING" } });
        return Response.json({ ok: true, message: "Marked as processing" });
      }
      if (action === "paid") {
        const paymentRef = ref || payoutRef();
        await db.withdrawal.update({ where: { id: w.id }, data: { status: "PAID", paymentRef, adminNote: note || w.adminNote, updatedAt: new Date() } });
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
        await db.withdrawal.update({ where: { id: w.id }, data: { status: "REJECTED", adminNote: note } });
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
        if (!video.uploadRewardCredited) {
          await creditUploadReward({ userId: video.creatorId, videoId: video.id, contentId: video.contentId });
          await db.video.update({ where: { id: video.id }, data: { uploadRewardCredited: true } });
        }
        await notify({
          userId: video.creatorId, type: "DUPLICATE",
          title: "False positive — video approved 🎉",
          body: `Our review confirmed ${video.contentId} is original. It's now live and monetized, and your upload reward has been credited. Sorry for the wait!`,
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
    const r = await requireAdmin(
      seg === "adjust" ? "earnings" : seg === "broadcast" ? "notifications" : seg === "users" || seg === "platform" ? "overview" : seg
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
      const next = {
        ratePer1000Views: Math.max(0.01, num(body?.ratePer1000Views, current.ratePer1000Views)),
        rewardPerUpload: Math.max(0, num(body?.rewardPerUpload, current.rewardPerUpload)),
        monetizationDurationMonths: Math.max(1, Math.min(24, Math.round(num(body?.monetizationDurationMonths, current.monetizationDurationMonths)))),
        minWithdrawalAmount: Math.max(1, num(body?.minWithdrawalAmount, current.minWithdrawalAmount)),
        holdingPeriodDays: Math.max(0, Math.min(90, Math.round(num(body?.holdingPeriodDays, current.holdingPeriodDays)))),
        monetizationPaused: !!body?.monetizationPaused,
        effectiveDate: body?.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      };
      await db.monetizationSetting.update({ where: { id: current.id }, data: { active: false } });
      const created = await db.monetizationSetting.create({ data: { ...next, createdBy: me.email } });
      // notify creators about rate changes
      if (next.ratePer1000Views !== current.ratePer1000Views || next.rewardPerUpload !== current.rewardPerUpload) {
        const creators = await db.user.findMany({ where: { role: "CREATOR", status: "APPROVED" }, select: { id: true } });
        for (const c of creators) {
          await notify({
            userId: c.id, type: "MONETIZATION",
            title: "Monetization rates updated",
            body: `New rates effective ${next.effectiveDate.toLocaleDateString()}: $${next.ratePer1000Views.toFixed(2)} per 1,000 qualified views and $${next.rewardPerUpload.toFixed(2)} per approved upload. Earnings already credited are not affected.`,
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
      const formats = String(body?.formats || rules.formats).toLowerCase()
        .split(",").map(f => f.trim().replace(/^\./, "")).filter(Boolean).join(",");
      const updated = await db.uploadRule.update({
        where: { id: rules.id },
        data: {
          minDurationSec: int(body?.minDurationSec, rules.minDurationSec, 5, 600),
          maxDurationSec: int(body?.maxDurationSec, rules.maxDurationSec, 10, 3600),
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
          supportEmail: String(branding.supportEmail || "support@kuchupuchu.com"),
          domain: String(branding.domain || "kuchupuchu.com"),
        });
      }
      const payouts = body?.payouts;
      if (payouts) {
        await setSetting("payouts", {
          methods: Array.isArray(payouts.methods) ? payouts.methods.slice(0, 5) : [],
          processingDays: String(payouts.processingDays || "3–5 business days"),
        });
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
