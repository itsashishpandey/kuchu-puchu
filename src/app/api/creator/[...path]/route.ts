import { db } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword, jsonError } from "@/lib/auth";
import {
  getMonetizationSettings, getUploadRules, walletSummary, remainingUploads,
  creditUploadReward, round2,
} from "@/lib/monetization";
import { notify } from "@/lib/platform";
import { nextContentId, payoutRef } from "@/lib/platform";
import {
  sha256Buffer, visualHash, audioHash, visualSimilarityFine, audioSimilarity,
  DUP_VISUAL_THRESHOLD, DUP_AUDIO_THRESHOLD,
} from "@/lib/fingerprint";
import { rateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const exec = promisify(execFile);
export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

async function requireCreator() {
  const me = await getSessionUser();
  if (!me) return { error: jsonError("Login required", 401) } as const;
  if (me.role !== "CREATOR") return { error: jsonError("Creator account required", 403) } as const;
  return { me } as const;
}

async function ffprobeJson(filePath: string) {
  const { stdout } = await exec("ffprobe", [
    "-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath,
  ], { timeout: 30000, maxBuffer: 1 << 24 });
  return JSON.parse(stdout);
}

export async function GET(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const url = new URL(req.url);
  const r = await requireCreator();
  if ("error" in r) return r.error;
  const me = r.me;

  // ── OVERVIEW: KPI cards + chart + recent activity ─────────────────────
  if (seg === "overview") {
    const wallet = await walletSummary(me.id);
    const [videos, monthStart] = [
      await db.video.findMany({ where: { creatorId: me.id }, orderBy: { createdAt: "desc" } }),
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ];
    const monthAgg = await db.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        userId: me.id, type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] },
        createdAt: { gte: monthStart },
      },
    });
    const qualAgg = await db.video.aggregate({
      _sum: { qualifiedViews: true }, where: { creatorId: me.id },
    });
    const limits = await remainingUploads(me.id);

    // earnings chart — last 14 days
    const days: { date: string; earnings: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, earnings: 0 });
    }
    const entries = await db.ledgerEntry.findMany({
      where: {
        userId: me.id, type: { in: ["VIEW_EARNING", "UPLOAD_REWARD"] },
        createdAt: { gte: new Date(Date.now() - 14 * 864e5) },
      },
    });
    for (const e of entries) {
      const key = e.createdAt.toISOString().slice(0, 10);
      const day = days.find(d => d.date === key);
      if (day) day.earnings = round2(day.earnings + e.amount);
    }

    const recentTransactions = await db.ledgerEntry.findMany({
      where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 6,
    });

    return Response.json({
      kpis: {
        totalEarnings: wallet.lifetimeEarnings,
        availableBalance: wallet.availableBalance,
        pendingEarnings: wallet.pendingBalance,
        totalVideos: videos.length,
        totalQualifiedViews: qualAgg._sum.qualifiedViews ?? 0,
        earningsThisMonth: round2(monthAgg._sum.amount ?? 0),
        remainingDailyUploads: limits.dailyRemaining,
        remainingWeeklyUploads: limits.weeklyRemaining,
        dailyUploadLimit: limits.rules.maxDailyUploads,
        weeklyUploadLimit: limits.rules.maxWeeklyUploads,
      },
      chart: days,
      videos: videos.slice(0, 5).map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, thumbnailUrl: v.thumbnailUrl,
        status: v.status, views: v.views, qualifiedViews: v.qualifiedViews,
        likes: v.likes, earningExpiresAt: v.earningExpiresAt, createdAt: v.createdAt,
      })),
      recentTransactions,
      settings: await getMonetizationSettings(),
      uploadRules: limits.rules,
    });
  }

  // ── EARNINGS: chart with range filter ─────────────────────────────────
  if (seg === "earnings") {
    const range = url.searchParams.get("range") || "30d";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let start: Date;
    if (range === "custom" && from && to) {
      start = new Date(from);
    } else {
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      start = new Date(Date.now() - days * 864e5);
    }
    const end = range === "custom" && to ? new Date(to + "T23:59:59") : new Date();

    const entries = await db.ledgerEntry.findMany({
      where: { userId: me.id, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
    });
    // bucket by day
    const buckets = new Map<string, { views: number; uploads: number; adjustments: number }>();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      buckets.set(d.toISOString().slice(0, 10), { views: 0, uploads: 0, adjustments: 0 });
    }
    for (const e of entries) {
      const key = e.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(key) ?? { views: 0, uploads: 0, adjustments: 0 };
      if (e.type === "VIEW_EARNING") b.views = round2(b.views + e.amount);
      else if (e.type === "UPLOAD_REWARD") b.uploads = round2(b.uploads + e.amount);
      else b.adjustments = round2(b.adjustments + e.amount);
      buckets.set(key, b);
    }
    const byVideoAgg = new Map<string, number>();
    for (const e of entries) {
      if (e.type === "VIEW_EARNING" || e.type === "UPLOAD_REWARD") {
        byVideoAgg.set(e.videoId ?? "none", round2((byVideoAgg.get(e.videoId ?? "none") ?? 0) + e.amount));
      }
    }
    const videoIds = [...byVideoAgg.keys()].filter(k => k !== "none");
    const vids = await db.video.findMany({ where: { id: { in: videoIds } } });
    const wallet = await walletSummary(me.id);
    return Response.json({
      range,
      wallet,
      series: [...buckets.entries()].map(([date, v]) => ({ date, ...v })),
      byVideo: vids.map(v => ({
        contentId: v.contentId, title: v.title, thumbnailUrl: v.thumbnailUrl,
        earned: byVideoAgg.get(v.id) ?? 0,
      })).sort((a, b) => b.earned - a.earned),
      total: round2(entries.filter(e => ["VIEW_EARNING", "UPLOAD_REWARD"].includes(e.type)).reduce((a, e) => a + e.amount, 0)),
    });
  }

  // ── MY VIDEOS ─────────────────────────────────────────────────────────
  if (seg === "videos") {
    const videos = await db.video.findMany({
      where: { creatorId: me.id }, orderBy: { createdAt: "desc" },
    });
    const settings = await getMonetizationSettings();
    return Response.json({
      videos: videos.map(v => ({
        id: v.id, contentId: v.contentId, title: v.title, description: v.description,
        category: v.category, hashtags: JSON.parse(v.hashtags || "[]"),
        thumbnailUrl: v.thumbnailUrl, videoUrl: v.videoUrl, duration: v.duration,
        status: v.status, rejectionReason: v.rejectionReason,
        duplicateOfId: v.duplicateOfId, similarityScore: v.similarityScore,
        duplicateStatus: v.duplicateStatus,
        views: v.views, qualifiedViews: v.qualifiedViews, likes: v.likes,
        commentsCount: v.commentsCount, shares: v.shares,
        monetizationEnabled: v.monetizationEnabled,
        earningExpiresAt: v.earningExpiresAt, publishedAt: v.publishedAt,
        createdAt: v.createdAt,
      })),
      settings,
    });
  }

  // ── VIDEO ANALYTICS (per video) ────────────────────────────────────────
  if (seg === "analytics") {
    const videos = await db.video.findMany({
      where: { creatorId: me.id }, orderBy: { views: "desc" },
    });
    const ids = videos.map(v => v.id);
    const entries = await db.ledgerEntry.findMany({
      where: { userId: me.id, videoId: { in: ids } },
    });
    const earnedByVideo = new Map<string, number>();
    for (const e of entries) {
      if (e.type === "VIEW_EARNING" || e.type === "UPLOAD_REWARD") {
        earnedByVideo.set(e.videoId!, round2((earnedByVideo.get(e.videoId!) ?? 0) + e.amount));
      }
    }
    // audience: qualified vs not, from view events
    const viewEvents = await db.viewEvent.findMany({
      where: { videoId: { in: ids } },
    });
    return Response.json({
      videos: videos.map(v => {
        const evs = viewEvents.filter(e => e.videoId === v.id);
        return {
          contentId: v.contentId, title: v.title, thumbnailUrl: v.thumbnailUrl,
          views: v.views, qualifiedViews: v.qualifiedViews,
          qualificationRate: v.views > 0 ? Math.round((v.qualifiedViews / v.views) * 100) : 0,
          likes: v.likes, commentsCount: v.commentsCount, shares: v.shares,
          earned: earnedByVideo.get(v.id) ?? 0,
          recentQualified: evs.filter(e => e.qualified).length,
          recentExcluded: evs.filter(e => !e.qualified).length,
          exclusions: evs.filter(e => !e.qualified).reduce((acc, e) => {
            acc[e.reason ?? "OTHER"] = (acc[e.reason ?? "OTHER"] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
      }),
    });
  }

  // ── TRANSACTIONS ──────────────────────────────────────────────────────
  if (seg === "transactions") {
    const [entries, withdrawals] = await Promise.all([
      db.ledgerEntry.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 200 }),
      db.withdrawal.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } }),
    ]);
    const wallet = await walletSummary(me.id);
    return Response.json({ entries, withdrawals, wallet });
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────
  if (seg === "notifications") {
    const notifications = await db.notification.findMany({
      where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 50,
    });
    return Response.json({ notifications, unread: notifications.filter(n => !n.read).length });
  }

  // ── WALLET ────────────────────────────────────────────────────────────
  if (seg === "wallet") {
    const wallet = await walletSummary(me.id);
    const settings = await getMonetizationSettings();
    const payoutSetting = await db.platformSetting.findUnique({ where: { key: "payouts" } });
    const channel = await db.channel.findUnique({ where: { userId: me.id } });
    return Response.json({
      wallet, settings,
      payoutMethods: payoutSetting ? JSON.parse(payoutSetting.value).methods : [],
      paymentDetails: channel?.paymentDetails ? JSON.parse(channel.paymentDetails) : null,
    });
  }

  // ── WITHDRAWALS ───────────────────────────────────────────────────────
  if (seg === "withdrawals") {
    const [withdrawals, wallet] = await Promise.all([
      db.withdrawal.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } }),
      walletSummary(me.id),
    ]);
    const settings = await getMonetizationSettings();
    const payoutSetting = await db.platformSetting.findUnique({ where: { key: "payouts" } });
    return Response.json({
      withdrawals, wallet, settings,
      payoutMethods: payoutSetting ? JSON.parse(payoutSetting.value).methods : [],
    });
  }

  // ── CHANNEL (edit form data) ─────────────────────────────────────────
  if (seg === "channel") {
    const user = await db.user.findUnique({
      where: { id: me.id }, include: { channel: true },
    });
    if (!user?.channel) return jsonError("Channel not found", 404);
    return Response.json({
      channel: {
        name: user.channel.name, username: user.channel.username,
        description: user.channel.description, avatarUrl: user.channel.avatarUrl,
        category: user.channel.category, country: user.channel.country,
        socialLinks: user.channel.socialLinks ? JSON.parse(user.channel.socialLinks) : {},
        showEarnings: user.channel.showEarnings,
        followerCount: user.channel.followerCount, verified: user.channel.verified,
      },
      profile: {
        name: user.name, email: user.email, phone: user.phone, country: user.country,
        avatarUrl: user.avatarUrl, paymentDetails: user.channel.paymentDetails
          ? JSON.parse(user.channel.paymentDetails) : null,
      },
    });
  }

  return jsonError("Not found", 404);
}

export async function POST(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const r = await requireCreator();
  if ("error" in r) return r.error;
  const me = r.me;

  // ── UPLOAD VIDEO ──────────────────────────────────────────────────────
  if (seg === "upload") {
    if (me.status !== "APPROVED") {
      return jsonError("Your account must be approved before you can upload videos", 403);
    }
    if (!rateLimit(`upload:${me.id}`, 12, 3600_000)) return jsonError("Too many upload attempts", 429);

    const form = await req.formData().catch(() => null);
    if (!form) return jsonError("Invalid form data");
    const get = (k: string) => String(form.get(k) || "").trim();

    const title = get("title");
    const description = get("description");
    const category = get("category");
    const hashtags = get("hashtags");
    const originality = get("originalityDeclaration") === "true";
    const copyright = get("copyrightConfirmation") === "true";
    const durationClient = parseFloat(get("duration")) || 0;

    if (!title || title.length < 3) return jsonError("Video title is required (min 3 characters)");
    if (!category) return jsonError("Category is required");
    if (!originality) return jsonError("You must declare that this video is your original work");
    if (!copyright) return jsonError("You must confirm you hold all rights to the content");

    const file = form.get("video");
    if (!file || !(file instanceof File) || file.size === 0) return jsonError("Video file is required");

    // limits
    const limits = await remainingUploads(me.id);
    if (limits.dailyRemaining <= 0) return jsonError(`Daily upload limit reached (${limits.rules.maxDailyUploads} per day). Try again tomorrow.`);
    if (limits.weeklyRemaining <= 0) return jsonError(`Weekly upload limit reached (${limits.rules.maxWeeklyUploads} per week).`);

    const rules = limits.rules;
    const formats = rules.formats.split(",").map(f => f.trim().toLowerCase());
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!formats.includes(ext)) return jsonError(`Unsupported format ".${ext}". Supported: ${formats.join(", ").toUpperCase()}`);
    if (file.size > rules.maxFileSizeMB * 1024 * 1024) {
      return jsonError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${rules.maxFileSizeMB}MB.`);
    }

    // save to disk
    const dir = path.join(process.cwd(), "public", "uploads", "videos");
    await mkdir(dir, { recursive: true });
    const contentId = await nextContentId();
    const fname = `${contentId}.${ext}`;
    const fpath = path.join(dir, fname);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fpath, buffer);

    // server-side validation: probe duration & resolution
    let duration = durationClient, width = 0, height = 0;
    try {
      const probe = await ffprobeJson(fpath);
      duration = parseFloat(probe.format?.duration || "0") || durationClient;
      const vStream = (probe.streams || []).find((s: { codec_type?: string }) => s.codec_type === "video");
      if (vStream) { width = vStream.width ?? 0; height = vStream.height ?? 0; }
    } catch {
      return jsonError("Could not read the video file. Please verify it plays correctly and retry.");
    }
    if (duration < rules.minDurationSec) {
      return jsonError(`Video is too short (${Math.round(duration)}s). Minimum duration is ${rules.minDurationSec} seconds.`);
    }
    if (duration > rules.maxDurationSec) {
      return jsonError(`Video is too long (${Math.round(duration)}s). Maximum duration is ${rules.maxDurationSec} seconds.`);
    }
    const maxH = parseInt((rules.maxResolution || "1080p").replace(/\D/g, ""), 10) || 1080;
    // resolution cap applies to the short side (portrait 9:16 videos: 1080p = 1080x1920)
    const shortSide = Math.min(width, height);
    if (shortSide > maxH) {
      return jsonError(`Resolution ${width}x${height} exceeds the maximum (${rules.maxResolution}).`);
    }

    // fingerprinting (SHA-256 + perceptual visual hash + audio fingerprint)
    const sha = sha256Buffer(buffer);
    const vh = await visualHash(fpath, duration);
    const ah = await audioHash(fpath, duration);

    // duplicate detection against existing content
    const existing = await db.video.findMany({
      where: { sha256: { not: null } },
      select: { id: true, contentId: true, sha256: true, visualHash: true, audioHash: true, title: true, creatorId: true },
    });
    let exactMatch = existing.find(e => e.sha256 === sha);
    let bestMatch: { contentId: string; score: number; id: string } | null = null;
    if (!exactMatch) {
      for (const e of existing) {
        if (!e.visualHash || e.visualHash === "0".repeat(16)) continue;
        const vs = visualSimilarityFine(vh, e.visualHash);
        const as = ah && e.audioHash ? audioSimilarity(ah, e.audioHash) : 0;
        const score = Math.max(vs, as * 0.95); // combined score, visual weighted
        if (!bestMatch || score > bestMatch.score) bestMatch = { contentId: e.contentId, score, id: e.id };
      }
    }

    // thumbnail: custom or extracted frame
    let thumbnailUrl: string | null = null;
    const thumb = form.get("thumbnail");
    if (thumb && thumb instanceof File && thumb.size > 0 && /^image\/(png|jpe?g|webp)$/.test(thumb.type)) {
      const tdir = path.join(process.cwd(), "public", "uploads", "thumbs");
      await mkdir(tdir, { recursive: true });
      const tname = `${contentId}.jpg`;
      await writeFile(path.join(tdir, tname), Buffer.from(await thumb.arrayBuffer()));
      thumbnailUrl = `/uploads/thumbs/${tname}`;
    } else {
      try {
        const tdir = path.join(process.cwd(), "public", "uploads", "thumbs");
        await mkdir(tdir, { recursive: true });
        await exec("ffmpeg", [
          "-y", "-ss", String(Math.min(2, duration / 2)), "-i", fpath,
          "-frames:v", "1", "-vf", "scale=640:-2", path.join(tdir, `${contentId}.jpg`),
        ], { timeout: 30000 });
        thumbnailUrl = `/uploads/thumbs/${contentId}.jpg`;
      } catch { thumbnailUrl = null; }
    }

    // status: flagged duplicate / pending / auto-approve
    const settings = await getMonetizationSettings();
    let status = rules.requireVideoApproval ? "PENDING" : "APPROVED";
    let duplicateOfId: string | null = null;
    let similarityScore: number | null = null;
    let duplicateStatus: string | null = null;

    if (exactMatch) {
      duplicateOfId = exactMatch.contentId;
      similarityScore = 1.0;
      duplicateStatus = "CONFIRMED_DUPLICATE";
      status = "FLAGGED_DUPLICATE";
    } else if (bestMatch && bestMatch.score >= DUP_VISUAL_THRESHOLD) {
      duplicateOfId = bestMatch.contentId;
      similarityScore = Math.round(bestMatch.score * 100) / 100;
      duplicateStatus = "PENDING_REVIEW";
      status = "FLAGGED_DUPLICATE";
    }

    const publishedAt = status === "APPROVED" ? new Date() : null;
    const earningExpiresAt = publishedAt
      ? new Date(publishedAt.getTime() + settings.monetizationDurationMonths * 30 * 864e5)
      : null;

    const video = await db.video.create({
      data: {
        contentId, creatorId: me.id, title, description, category,
        hashtags: JSON.stringify(
          hashtags.split(/[\s,]+/).map(h => h.replace(/^#/, "")).filter(Boolean).slice(0, 10)
        ),
        videoUrl: `/uploads/videos/${fname}`, thumbnailUrl,
        duration: Math.round(duration * 10) / 10,
        fileSizeMB: Math.round((file.size / 1024 / 1024) * 10) / 10,
        resolution: width && height ? `${width}x${height}` : "unknown",
        format: ext,
        status, duplicateOfId, similarityScore, duplicateStatus,
        sha256: sha, visualHash: vh, audioHash: ah,
        monetizationEnabled: status !== "FLAGGED_DUPLICATE",
        publishedAt, earningExpiresAt,
      },
    });

    // auto-approval path → credit upload reward immediately if allowed
    if (status === "APPROVED" && !rules.rewardRequiresApproval) {
      await creditUploadReward({ userId: me.id, videoId: video.id, contentId });
      await db.video.update({ where: { id: video.id }, data: { uploadRewardCredited: true } });
    }

    // notifications
    if (status === "FLAGGED_DUPLICATE") {
      const pct = Math.round((similarityScore ?? 0) * 100);
      await db.fraudFlag.create({
        data: {
          userId: me.id, videoId: contentId, type: "DUPLICATE_CONTENT", severity: "HIGH",
          details: `${contentId} matches ${duplicateOfId} with ${pct}% combined visual/audio similarity. Upload reward and view earnings withheld pending review.`,
        },
      });
      await notify({
        userId: me.id, type: "DUPLICATE",
        title: "Possible duplicate detected",
        body: `Your upload "${title}" (${contentId}) is ${pct}% similar to an existing video (${duplicateOfId}). It's queued for review — rewards are on hold. You can appeal from My Videos if you believe this is a mistake.`,
        link: "#/dashboard/videos",
        email: {
          to: me.email, subject: `Duplicate review needed: ${contentId}`,
          body: `Your upload "${title}" was flagged as ${pct}% similar to existing content and is pending review.`,
        },
      });
    } else if (status === "PENDING") {
      await notify({
        userId: me.id, type: "VIDEO_STATUS",
        title: "Upload received — in review",
        body: `"${title}" (${contentId}) passed technical validation and is pending approval. We check originality, duration and quality — usually within 24 hours.`,
        link: "#/dashboard/videos",
        email: {
          to: me.email, subject: `Upload received: ${title}`,
          body: `Your video ${contentId} is in the review queue. We'll notify you once it's approved.`,
        },
      });
    } else {
      await notify({
        userId: me.id, type: "VIDEO_STATUS",
        title: "Video published 🎉",
        body: `"${title}" (${contentId}) is live and earning. View earnings are credited for every qualified view for ${settings.monetizationDurationMonths} months.`,
        link: "#/dashboard/videos",
        email: { to: me.email, subject: `Published: ${title}`, body: `Your video ${contentId} is now live.` },
      });
    }

    return Response.json({
      video: {
        id: video.id, contentId: video.contentId, title: video.title,
        status: video.status, duplicateOfId, similarityScore, thumbnailUrl,
      },
    }, { status: 201 });
  }

  // ── WITHDRAWAL REQUEST ────────────────────────────────────────────────
  if (seg === "withdraw") {
    if (me.status !== "APPROVED") return jsonError("Your account must be approved to withdraw earnings", 403);
    const body = await req.json().catch(() => null);
    const amount = round2(parseFloat(body?.amount));
    const method = String(body?.method || "");
    const details = body?.details ?? {};
    if (!amount || amount <= 0) return jsonError("Enter a valid amount");
    if (!["BANK_TRANSFER", "PAYPAL"].includes(method)) return jsonError("Select a payout method");

    const settings = await getMonetizationSettings();
    if (settings.monetizationPaused) return jsonError("Payouts are temporarily paused for maintenance. Please try again later.");
    if (amount < settings.minWithdrawalAmount) {
      return jsonError(`Minimum withdrawal is $${settings.minWithdrawalAmount.toFixed(2)}`);
    }
    const wallet = await walletSummary(me.id);
    if (amount > wallet.availableBalance) {
      return jsonError(`Amount exceeds your available balance ($${wallet.availableBalance.toFixed(2)})`);
    }
    // payment details validation
    if (method === "BANK_TRANSFER" && !details.accountName) return jsonError("Account holder name is required");
    if (method === "BANK_TRANSFER" && !details.accountNumber) return jsonError("Account number is required");
    if (method === "PAYPAL" && !details.paypalEmail) return jsonError("PayPal email is required");

    const masked = method === "BANK_TRANSFER"
      ? { accountName: details.accountName, bank: details.bank || "", maskedAccount: `•••• ${String(details.accountNumber).slice(-4)}` }
      : { accountName: details.accountName || me.name, maskedAccount: String(details.paypalEmail).replace(/^(.).*@/, "$1•••@") };

    const w = await db.withdrawal.create({
      data: {
        userId: me.id, amount, method,
        details: JSON.stringify(masked), status: "REQUESTED",
      },
    });
    await notify({
      userId: me.id, type: "WITHDRAWAL",
      title: "Withdrawal requested",
      body: `Your withdrawal request for $${amount.toFixed(2)} via ${method === "PAYPAL" ? "PayPal" : "bank transfer"} has been submitted and is awaiting review. Funds are locked until it is processed.`,
      link: "#/dashboard/withdraw",
      email: {
        to: me.email, subject: `Withdrawal request received: $${amount.toFixed(2)}`,
        body: `We received your withdrawal request. Payouts are processed within ${settings.holdingPeriodDays} days of approval.`,
      },
    });
    return Response.json({ withdrawal: w }, { status: 201 });
  }

  // ── MARK NOTIFICATIONS READ ───────────────────────────────────────────
  if (seg === "notifications-read") {
    await db.notification.updateMany({ where: { userId: me.id, read: false }, data: { read: true } });
    return Response.json({ ok: true });
  }

  // ── APPEAL duplicate flag ─────────────────────────────────────────────
  if (seg === "appeal") {
    const body = await req.json().catch(() => null);
    const contentId = String(body?.contentId || "");
    const reason = String(body?.reason || "").trim();
    if (!contentId) return jsonError("Video required");
    if (reason.length < 20) return jsonError("Please explain your appeal in at least 20 characters");
    const video = await db.video.findFirst({ where: { contentId, creatorId: me.id } });
    if (!video) return jsonError("Video not found", 404);
    if (video.duplicateStatus !== "PENDING_REVIEW" && video.duplicateStatus !== "CONFIRMED_DUPLICATE") {
      return jsonError("This video has no duplicate flag to appeal");
    }
    await db.appeal.create({ data: { videoId: video.id, userId: me.id, reason } });
    await notify({
      userId: me.id, type: "DUPLICATE",
      title: "Appeal submitted",
      body: `Your appeal for ${contentId} was submitted. Our team will review it within 2 business days.`,
      link: "#/dashboard/videos",
    });
    return Response.json({ ok: true, message: "Appeal submitted — we'll review it within 2 business days." });
  }

  return jsonError("Not found", 404);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { path: segs } = await ctx.params;
  const [seg] = segs;
  const r = await requireCreator();
  if ("error" in r) return r.error;
  const me = r.me;
  const body = await req.json().catch(() => null);

  // ── UPDATE CHANNEL ────────────────────────────────────────────────────
  if (seg === "channel") {
    const channel = await db.channel.findUnique({ where: { userId: me.id } });
    if (!channel) return jsonError("Channel not found", 404);
    const name = String(body?.name || "").trim();
    if (name && name !== channel.name) {
      if (name.length < 3) return jsonError("Channel name must be at least 3 characters");
      const taken = await db.channel.findFirst({ where: { name, NOT: { id: channel.id } } });
      if (taken) return jsonError("This channel name is already taken");
    }
    const social = body?.socialLinks ?? {};
    await db.channel.update({
      where: { id: channel.id },
      data: {
        name: name || channel.name,
        description: String(body?.description ?? channel.description).slice(0, 500),
        category: body?.category ? String(body.category) : channel.category,
        socialLinks: JSON.stringify({
          instagram: String(social.instagram || "").replace(/^@/, "").slice(0, 40) || null,
          youtube: String(social.youtube || "").slice(0, 60) || null,
          x: String(social.x || "").replace(/^@/, "").slice(0, 40) || null,
          website: String(social.website || "").slice(0, 120) || null,
        }),
        showEarnings: !!body?.showEarnings,
      },
    });
    return Response.json({ ok: true, message: "Channel updated" });
  }

  // ── UPDATE PROFILE ────────────────────────────────────────────────────
  if (seg === "profile") {
    const name = String(body?.name || "").trim();
    if (name.length < 2) return jsonError("Name is required");
    await db.user.update({
      where: { id: me.id },
      data: {
        name,
        phone: body?.phone ? String(body.phone).slice(0, 20) : undefined,
        country: body?.country ? String(body.country) : undefined,
      },
    });
    return Response.json({ ok: true, message: "Profile updated" });
  }

  // ── CHANGE PASSWORD ───────────────────────────────────────────────────
  if (seg === "password") {
    const current = String(body?.currentPassword || "");
    const next = String(body?.newPassword || "");
    if (next.length < 8) return jsonError("New password must be at least 8 characters");
    const user = await db.user.findUnique({ where: { id: me.id } });
    if (!user || !verifyPassword(current, user.passwordHash)) {
      return jsonError("Current password is incorrect", 403);
    }
    await db.user.update({ where: { id: me.id }, data: { passwordHash: hashPassword(next) } });
    await notify({
      userId: me.id, type: "ACCOUNT_STATUS",
      title: "Password changed",
      body: "Your password was changed successfully. If this wasn't you, contact support immediately.",
    });
    return Response.json({ ok: true, message: "Password changed" });
  }

  // ── PAYMENT DETAILS ───────────────────────────────────────────────────
  if (seg === "payment") {
    const method = String(body?.method || "");
    if (!["BANK_TRANSFER", "PAYPAL"].includes(method)) return jsonError("Select a valid payout method");
    const details = body?.details ?? {};
    if (method === "BANK_TRANSFER") {
      if (!details.accountName || !details.accountNumber) return jsonError("Account name and number are required");
    } else if (!details.paypalEmail) {
      return jsonError("PayPal email is required");
    }
    const masked = method === "BANK_TRANSFER"
      ? { method, accountName: details.accountName, bank: details.bank || "", maskedAccount: `•••• ${String(details.accountNumber).slice(-4)}` }
      : { method, maskedAccount: String(details.paypalEmail).replace(/^(.).*@/, "$1•••@") };
    await db.channel.update({
      where: { userId: me.id },
      data: { paymentDetails: JSON.stringify(masked) },
    });
    return Response.json({ ok: true, message: "Payment details saved (account numbers are stored masked)" });
  }

  return jsonError("Not found", 404);
}
