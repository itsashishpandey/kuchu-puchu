import { db } from "@/lib/db";

// ── Active settings ────────────────────────────────────────────────────────

export async function getMonetizationSettings() {
  const rows = await db.monetizationSetting.findMany({
    where: { effectiveDate: { lte: new Date() } },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
  if (rows.length === 0) {
    return await db.monetizationSetting.create({ data: {} });
  }
  return rows[0];
}

export async function getUploadRules() {
  let rule = await db.uploadRule.findFirst();
  if (!rule) rule = await db.uploadRule.create({ data: {} });
  return rule;
}

/** Rate that was in effect at a given time (for historical accuracy) */
export async function rateAt(date: Date) {
  const rows = await db.monetizationSetting.findMany({
    where: { effectiveDate: { lte: date } },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });
  return rows[0] ?? (await getMonetizationSettings());
}

// ── Earnings engine ────────────────────────────────────────────────────────

export type QualifiedViewResult = {
  qualified: boolean;
  reason?: string;
};

/**
 * Server-side qualified-view evaluation. NOT trusted from the frontend.
 * Rules (anti-fraud):
 *  - creator self-views never count
 *  - bot / crawler user-agents rejected (+ fraud flag)
 *  - watch time < 2s rejected (refresh manipulation)
 *  - same viewer counts at most `maxPerViewerPerDay` times per video per day
 *  - videos past their monetization window no longer earn
 *  - monetization must not be paused; creator & video must be eligible
 */
export async function evaluateQualifiedView(opts: {
  video: {
    id: string; creatorId: string; status: string; monetizationEnabled: boolean;
    earningExpiresAt: Date | null; publishedAt: Date | null; contentId: string;
  };
  viewerKey: string;
  viewerUserId?: string | null;
  watchSeconds: number;
  userAgent: string;
  maxPerViewerPerDay?: number;
}): Promise<QualifiedViewResult> {
  const { video, viewerKey, watchSeconds, userAgent } = opts;

  // Bot detection
  const ua = (userAgent || "").toLowerCase();
  if (/bot|crawler|spider|headless|python-requests|curl\//.test(ua)) {
    await db.fraudFlag.create({
      data: {
        videoId: video.contentId, userId: video.creatorId, type: "VIEW_BOT",
        severity: "LOW", details: `Bot user-agent excluded from qualified views (${ua.slice(0, 80)})`,
      },
    }).catch(() => {});
    return { qualified: false, reason: "BOT_USER_AGENT" };
  }

  // Self-view exclusion
  if (opts.viewerUserId && opts.viewerUserId === video.creatorId) {
    return { qualified: false, reason: "CREATOR_SELF_VIEW" };
  }

  // Watch-time threshold (refresh manipulation)
  if (watchSeconds < 2) {
    return { qualified: false, reason: "INSUFFICIENT_WATCH_TIME" };
  }

  // Status checks
  if (video.status !== "APPROVED") return { qualified: false, reason: "VIDEO_NOT_APPROVED" };
  if (!video.monetizationEnabled) return { qualified: false, reason: "VIDEO_MONETIZATION_DISABLED" };

  // Monetization window
  if (video.earningExpiresAt && video.earningExpiresAt < new Date()) {
    return { qualified: false, reason: "MONETIZATION_WINDOW_EXPIRED" };
  }

  const settings = await getMonetizationSettings();
  if (settings.monetizationPaused) return { qualified: false, reason: "MONETIZATION_PAUSED" };

  const creator = await db.user.findUnique({ where: { id: video.creatorId } });
  if (!creator || creator.status !== "APPROVED" || !creator.monetizationEligible) {
    return { qualified: false, reason: "CREATOR_NOT_ELIGIBLE" };
  }

  // Per-viewer daily cap on the same video
  const maxPerDay = opts.maxPerViewerPerDay ?? 3;
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const recent = await db.viewEvent.count({
    where: { videoId: video.id, viewerKey, createdAt: { gte: dayStart } },
  });
  if (recent >= maxPerDay) {
    // rapid repeated viewing — flag suspicious pattern at higher volume
    if (recent >= maxPerDay * 4) {
      await db.fraudFlag.create({
        data: {
          videoId: video.contentId, userId: video.creatorId, type: "RAPID_REFRESH",
          severity: "MEDIUM",
          details: `Viewer ${viewerKey.slice(0, 10)}… hit ${recent} views on ${video.contentId} today (cap ${maxPerDay})`,
        },
      }).catch(() => {});
    }
    return { qualified: false, reason: "DUPLICATE_VIEWER_DAILY_CAP" };
  }

  return { qualified: true };
}

/** Credit proportional view earnings: (qualifiedViews/1000) × rate, per event. */
export async function creditViewEarning(opts: {
  userId: string; videoId: string; contentId: string;
}) {
  const settings = await getMonetizationSettings();
  if (settings.monetizationPaused) return null;
  const amount = (1 / 1000) * settings.ratePer1000Views; // proportional, never rounds down
  const availableAt = new Date(Date.now() + settings.holdingPeriodDays * 864e5);
  return db.ledgerEntry.create({
    data: {
      userId: opts.userId, videoId: opts.videoId, type: "VIEW_EARNING",
      amount, status: "PENDING", availableAt, rateSnapshot: settings.ratePer1000Views,
      description: `Qualified view on ${opts.contentId}`,
      reference: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    },
  });
}

/** One-time upload reward, credited only after approval. */
export async function creditUploadReward(opts: {
  userId: string; videoId: string; contentId: string;
}) {
  const settings = await getMonetizationSettings();
  if (settings.monetizationPaused) return null;
  const availableAt = new Date(Date.now() + settings.holdingPeriodDays * 864e5);
  return db.ledgerEntry.create({
    data: {
      userId: opts.userId, videoId: opts.videoId, type: "UPLOAD_REWARD",
      amount: settings.rewardPerUpload, status: "PENDING", availableAt,
      rateSnapshot: settings.rewardPerUpload,
      description: `Approved original upload reward for ${opts.contentId}`,
      reference: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    },
  });
}

// ── Wallet (computed from the immutable ledger + withdrawal records) ───────

export async function walletSummary(userId: string) {
  const entries = await db.ledgerEntry.findMany({ where: { userId } });
  const now = new Date();
  let lifetime = 0, pendingCredits = 0, availableCredits = 0;
  for (const e of entries) {
    if (e.type === "UPLOAD_REWARD" || e.type === "VIEW_EARNING" || e.type === "ADJUSTMENT") {
      if (e.status === "REVERSED") continue;
      lifetime += e.amount;
      if (e.availableAt && e.availableAt > now) pendingCredits += e.amount;
      else availableCredits += e.amount;
    }
  }
  // Funds locked by active withdrawal requests (REQUESTED → PROCESSING)
  const activeWithdrawals = await db.withdrawal.findMany({
    where: { userId, status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING"] } },
  });
  const locked = activeWithdrawals.reduce((a, w) => a + w.amount, 0);
  const paidAgg = await db.withdrawal.aggregate({
    _sum: { amount: true },
    where: { userId, status: "PAID" },
  });
  return {
    lifetimeEarnings: round2(lifetime),
    pendingBalance: round2(pendingCredits + locked), // holding-period funds + locked payouts
    availableBalance: round2(availableCredits - locked),
    totalWithdrawn: round2(paidAgg._sum.amount ?? 0),
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ── Upload limits ──────────────────────────────────────────────────────────

export async function remainingUploads(userId: string) {
  const rules = await getUploadRules();
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 864e5);
  const [today, week] = await Promise.all([
    db.video.count({ where: { creatorId: userId, createdAt: { gte: dayStart } } }),
    db.video.count({ where: { creatorId: userId, createdAt: { gte: weekStart } } }),
  ]);
  return {
    rules,
    dailyUsed: today,
    weeklyUsed: week,
    dailyRemaining: Math.max(0, rules.maxDailyUploads - today),
    weeklyRemaining: Math.max(0, rules.maxWeeklyUploads - week),
  };
}
