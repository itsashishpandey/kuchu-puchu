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

// ── Monetization unlock (one-time): a channel starts earning (upload rewards + view earnings)
// the first time it has `minMonthlyChannelViews` genuine views within 30 days, and stays unlocked.
// Self-views, bots, refresh spam, sub-2-second "views" and views on unpublished videos don't count.
const INVALID_VIEW_REASONS = ["BOT_USER_AGENT", "CREATOR_SELF_VIEW", "DUPLICATE_VIEWER_DAILY_CAP", "INSUFFICIENT_WATCH_TIME", "VIDEO_NOT_APPROVED", "WEB_VIEW_NOT_COUNTED", "REPEAT_VIEW_WITHIN_WINDOW"];

/** Views that don't count at all — not in the public view count, earnings or the unlock target. */
export const NOT_COUNTED_REASONS = ["BOT_USER_AGENT", "WEB_VIEW_NOT_COUNTED", "REPEAT_VIEW_WITHIN_WINDOW", "INSUFFICIENT_WATCH_TIME", "DUPLICATE_VIEWER_DAILY_CAP"];

// ── View counting rules (Admin → Platform). Defaults: only app views; one view per viewer per video every 4 h.
export type ViewCounting = { appOnly: boolean; repeatWindowHours: number };
export const VIEW_COUNTING_DEFAULTS: ViewCounting = { appOnly: true, repeatWindowHours: 4 };
let viewCountingCache: { at: number; v: ViewCounting } | null = null;
export async function getViewCounting(fresh = false): Promise<ViewCounting> {
  if (!fresh && viewCountingCache && Date.now() - viewCountingCache.at < 30_000) return viewCountingCache.v;
  const row = await db.platformSetting.findUnique({ where: { key: "viewCounting" } });
  let v = VIEW_COUNTING_DEFAULTS;
  try { if (row) v = { ...VIEW_COUNTING_DEFAULTS, ...JSON.parse(row.value) }; } catch { /* keep defaults */ }
  viewCountingCache = { at: Date.now(), v };
  return v;
}
export function forgetViewCounting() { viewCountingCache = null; }

/** The Android app identifies itself as "KuchuPuchuApp/<version> (Android)". */
export const isAppUserAgent = (ua: string) => /^KuchuPuchuApp\//i.test(ua || "");
const viewsCache = new Map<string, { at: number; n: number }>();

export async function channelViews30d(creatorId: string, fresh = false): Promise<number> {
  const hit = viewsCache.get(creatorId);
  if (!fresh && hit && Date.now() - hit.at < 60_000) return hit.n;
  const n = await db.viewEvent.count({
    where: {
      video: { creatorId }, isSelf: false, createdAt: { gte: new Date(Date.now() - 30 * 864e5) },
      OR: [{ reason: null }, { reason: { notIn: INVALID_VIEW_REASONS } }],
    },
  });
  viewsCache.set(creatorId, { at: Date.now(), n });
  if (viewsCache.size > 5000) viewsCache.delete(viewsCache.keys().next().value!);
  return n;
}

const unlockedIds = new Set<string>(); // unlocks are permanent, so a hit never expires (admin re-lock clears it)
export function forgetUnlock(creatorId: string) { unlockedIds.delete(creatorId); viewsCache.delete(creatorId); }

/** Unlocked already, or reaching the target right now (then it's recorded once and the creator is told). */
export async function monetizationUnlock(creatorId: string, opts: { fresh?: boolean; settings?: { minMonthlyChannelViews: number; rewardPerUpload: number; ratePer1000Views: number } } = {}) {
  if (unlockedIds.has(creatorId)) return { unlocked: true, unlockedAt: null as Date | null };
  const u = await db.user.findUnique({ where: { id: creatorId }, select: { monetizationUnlockedAt: true } });
  if (u?.monetizationUnlockedAt) { unlockedIds.add(creatorId); return { unlocked: true, unlockedAt: u.monetizationUnlockedAt }; }
  const s = opts.settings ?? (await getMonetizationSettings());
  const views = await channelViews30d(creatorId, opts.fresh);
  if (views < s.minMonthlyChannelViews) return { unlocked: false, unlockedAt: null };
  const at = new Date();
  const res = await db.user.updateMany({ where: { id: creatorId, monetizationUnlockedAt: null }, data: { monetizationUnlockedAt: at } });
  unlockedIds.add(creatorId);
  if (res.count === 1) {
    await db.notification.create({
      data: {
        userId: creatorId, type: "MONETIZATION", link: "#/dashboard",
        title: "🎉 Monetization unlocked!",
        body: `Your channel reached ${s.minMonthlyChannelViews.toLocaleString()} views within 30 days. From now on you earn $${s.rewardPerUpload.toFixed(2)} for every approved upload and $${s.ratePer1000Views.toFixed(2)} per 1,000 qualified views — for good.`,
      },
    }).catch(() => {});
  }
  return { unlocked: true, unlockedAt: at };
}

export async function channelMonetization(creatorId: string, fresh = false) {
  const settings = await getMonetizationSettings();
  const unlock = await monetizationUnlock(creatorId, { fresh, settings });
  const last30DaysViews = await channelViews30d(creatorId, fresh);
  const unlockedAt = unlock.unlockedAt ?? (unlock.unlocked ? (await db.user.findUnique({ where: { id: creatorId }, select: { monetizationUnlockedAt: true } }))?.monetizationUnlockedAt ?? null : null);
  return {
    eligible: unlock.unlocked, unlocked: unlock.unlocked, unlockedAt, last30DaysViews, threshold: settings.minMonthlyChannelViews,
    uploadRewardInr: settings.rewardPerUploadInr, uploadRewardUsd: settings.rewardPerUpload, inrPerUsd: settings.inrPerUsd,
  };
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
 *  - only views from the mobile app count, when Admin → Platform says so (default)
 *  - the same viewer counts once per video per repeat window (default 4 h)
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

  const rules = await getViewCounting();

  // Only views in the mobile app count (Admin → Platform → View counting)
  if (rules.appOnly && !isAppUserAgent(userAgent)) {
    return { qualified: false, reason: "WEB_VIEW_NOT_COUNTED" };
  }

  // Watch-time threshold (refresh manipulation)
  if (watchSeconds < 2) {
    return { qualified: false, reason: "INSUFFICIENT_WATCH_TIME" };
  }

  // One counted view per viewer per video in the repeat window (default 4 hours)
  const since = new Date(Date.now() - rules.repeatWindowHours * 3600e3);
  const earlier = await db.viewEvent.findFirst({
    where: { videoId: video.id, viewerKey, createdAt: { gte: since }, OR: [{ reason: null }, { reason: { notIn: NOT_COUNTED_REASONS } }] },
    select: { id: true },
  });
  if (earlier) {
    const attempts = await db.viewEvent.count({ where: { videoId: video.id, viewerKey, createdAt: { gte: since } } });
    if (attempts === 20) {
      await db.fraudFlag.create({
        data: {
          videoId: video.contentId, userId: video.creatorId, type: "RAPID_REFRESH", severity: "MEDIUM",
          details: `Viewer ${viewerKey.slice(0, 10)}… replayed ${video.contentId} ${attempts} times within ${rules.repeatWindowHours} h (only the first counts)`,
        },
      }).catch(() => {});
    }
    return { qualified: false, reason: "REPEAT_VIEW_WITHIN_WINDOW" };
  }

  // Self-view exclusion
  if (opts.viewerUserId && opts.viewerUserId === video.creatorId) {
    return { qualified: false, reason: "CREATOR_SELF_VIEW" };
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

  // channel hasn't unlocked monetization yet: the view counts toward the target, but doesn't earn
  if (!(await monetizationUnlock(video.creatorId, { settings })).unlocked) {
    return { qualified: false, reason: "CHANNEL_BELOW_VIEW_THRESHOLD" };
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
  // no upload reward until the channel has unlocked monetization
  if (!(await monetizationUnlock(opts.userId, { fresh: true, settings })).unlocked) return null;
  const availableAt = new Date(Date.now() + settings.holdingPeriodDays * 864e5);
  return db.ledgerEntry.create({
    data: {
      userId: opts.userId, videoId: opts.videoId, type: "UPLOAD_REWARD",
      amount: settings.rewardPerUpload, status: "PENDING", availableAt,
      rateSnapshot: settings.rewardPerUpload,
      description: `Approved upload reward for ${opts.contentId}`,
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
  const paid = paidAgg._sum.amount ?? 0;
  return {
    lifetimeEarnings: round2(lifetime),
    pendingBalance: round2(pendingCredits + locked), // holding-period funds + locked payouts
    // money already paid out has left the wallet — without subtracting it a creator
    // could request the same funds again after every payout
    availableBalance: round2(availableCredits - locked - paid),
    totalWithdrawn: round2(paid),
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
