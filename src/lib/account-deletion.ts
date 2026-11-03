// Self-service account deletion (Google Play / App Store account-deletion rules, COPPA parents' rights).
//  • Parent (viewer) accounts are deleted completely: the user row and everything linked to it.
//  • Creator accounts are anonymised instead, because earnings, ledger and payout records must be
//    kept 7 years for accounting: personal data, the ID document, the channel profile and every video
//    are removed from the platform, and only anonymous financial records remain.
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { audit } from "@/lib/platform";
import { deletePrivate } from "@/lib/private-files";
import { hashPassword } from "@/lib/auth";
import { clearRankedCacheFor } from "@/lib/feed";

const OPEN_WITHDRAWALS = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING"];

export type DeletionResult = { ok: true; kind: "deleted" | "anonymised" } | { ok: false; error: string; status: number };

/** Detach the person from activity rows that keep a plain user id (no relation), and drop their follows. */
async function detachActivity(userId: string) {
  const follows = await db.follow.findMany({ where: { followerId: userId }, select: { id: true, channelId: true } });
  for (const f of follows) {
    await db.follow.delete({ where: { id: f.id } });
    await db.channel.updateMany({ where: { id: f.channelId, followerCount: { gt: 0 } }, data: { followerCount: { decrement: 1 } } });
  }
  const comments = await db.comment.findMany({ where: { userId }, select: { id: true, videoId: true } });
  for (const c of comments) {
    await db.comment.delete({ where: { id: c.id } });
    await db.video.updateMany({ where: { id: c.videoId, commentsCount: { gt: 0 } }, data: { commentsCount: { decrement: 1 } } });
  }
  const anon = `deleted:${randomBytes(8).toString("hex")}`;
  await db.videoLike.updateMany({ where: { userId }, data: { userId: null, guestKey: anon } }).catch(async () => {
    // [videoId, guestKey] is unique — fall back to one key per like
    for (const l of await db.videoLike.findMany({ where: { userId }, select: { id: true } })) {
      await db.videoLike.update({ where: { id: l.id }, data: { userId: null, guestKey: `deleted:${randomBytes(8).toString("hex")}` } });
    }
  });
  await db.viewEvent.updateMany({ where: { userId }, data: { userId: null } });
  await db.contentReport.updateMany({ where: { userId }, data: { userId: null } });
  await db.videoInteractionEvent.updateMany({ where: { userId }, data: { userId: null } });
}

export async function deleteAccount(userId: string): Promise<DeletionResult> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { channel: true, verification: true } });
  if (!user) return { ok: false, error: "Account not found", status: 404 };
  if (user.role === "ADMIN") return { ok: false, error: "Admin accounts can't be deleted here", status: 403 };

  if (user.role !== "CREATOR") {
    await detachActivity(user.id);
    await db.user.delete({ where: { id: user.id } }); // sessions, preferences, saved videos, notifications… cascade
    clearRankedCacheFor(user.id);
    await audit({ actorId: user.id, actorEmail: "deleted-parent-account", action: "ACCOUNT_DELETED", targetType: "USER", targetId: user.id, details: "Parent account deleted by its owner" });
    return { ok: true, kind: "deleted" };
  }

  const open = await db.withdrawal.count({ where: { userId: user.id, status: { in: OPEN_WITHDRAWALS } } });
  if (open > 0) {
    return { ok: false, error: "You have a withdrawal in progress. Please wait until it's paid (or cancelled) before deleting your account.", status: 409 };
  }

  await detachActivity(user.id);
  if (user.verification) {
    await deletePrivate(user.verification.fileName).catch(() => {});
    await db.creatorVerification.delete({ where: { userId: user.id } });
  }
  const tag = user.id.slice(-8).toLowerCase();
  if (user.channel) {
    await db.follow.deleteMany({ where: { channelId: user.channel.id } });
    await db.channel.update({
      where: { id: user.channel.id },
      data: {
        name: "Deleted channel", username: `deleted${tag}${randomBytes(2).toString("hex")}`, description: "", tagline: null,
        supportEmail: null, avatarUrl: null, bannerUrl: null, country: null, socialLinks: null, paymentDetails: null,
        followerCount: 0, verified: false, showEarnings: false,
      },
    });
  }
  await db.video.updateMany({
    where: { creatorId: user.id, status: { not: "REMOVED" } },
    data: { status: "REMOVED", rejectionReason: "Creator deleted their account", monetizationEnabled: false, featured: false },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.user.update({
    where: { id: user.id },
    data: {
      email: `deleted-${user.id}@deleted.invalid`, name: "Deleted creator", passwordHash: hashPassword(randomBytes(24).toString("hex")),
      status: "SUSPENDED", suspensionReason: "Account deleted by its owner",
      avatarUrl: null, phone: null, country: null, legalName: null, city: null, postalCode: null, agreements: null,
      followsPrivate: true, emailVerified: false, emailVerifiedAt: null,
    },
  });
  clearRankedCacheFor(user.id);
  await audit({ actorId: user.id, actorEmail: "deleted-creator-account", action: "ACCOUNT_DELETED", targetType: "USER", targetId: user.id, details: "Creator account anonymised by its owner; financial records kept for accounting" });
  return { ok: true, kind: "anonymised" };
}
