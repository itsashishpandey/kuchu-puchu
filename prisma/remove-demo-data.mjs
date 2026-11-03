// One-time cleanup: removes ALL demo/sample data so the platform starts empty for real creators.
// Keeps: the one admin account (KEEP_ADMIN), languages, kids categories/subcategories/translations,
// monetization settings, upload rules, recommendation config and platform settings (minus the demo notice).
// Removes: every other user (demo creators, viewers, demo admin staff), channels, videos and everything
// linked to them (tags, views, likes, comments, reports, follows, earnings, withdrawals, notifications, ID
// checks, strikes, preferences), plus logs made by demo/test activity.
// Private ID files of removed creators are deleted too.
//   DATABASE_URL=file:/path/db KEEP_ADMIN=admin@mykuchupuchu.com node prisma/remove-demo-data.mjs --yes
import { PrismaClient } from "@prisma/client";
import { unlink } from "node:fs/promises";
import path from "node:path";

if (!process.argv.includes("--yes")) {
  console.log("Dry run only. Re-run with --yes to delete.");
}
const APPLY = process.argv.includes("--yes");
const KEEP_ADMIN = (process.env.KEEP_ADMIN || "admin@mykuchupuchu.com").toLowerCase();
const PRIVATE_DIR = process.env.PRIVATE_UPLOAD_DIR || "";
const db = new PrismaClient();

const admin = await db.user.findUnique({ where: { email: KEEP_ADMIN } });
if (!admin || admin.role !== "ADMIN") throw new Error(`Keep-admin ${KEEP_ADMIN} not found or not an admin — aborting`);

const counts = async () => ({
  users: await db.user.count(), channels: await db.channel.count(), videos: await db.video.count(),
  ledger: await db.ledgerEntry.count(), withdrawals: await db.withdrawal.count(), views: await db.viewEvent.count(),
  comments: await db.comment.count(), follows: await db.follow.count(), notifications: await db.notification.count(),
  categories: await db.category.count(), subcategories: await db.subcategory.count(), languages: await db.language.count(),
});
console.log("before:", JSON.stringify(await counts()));
if (!APPLY) { await db.$disconnect(); process.exit(0); }

const kyc = await db.creatorVerification.findMany({ select: { fileName: true } });
const others = { NOT: { id: admin.id } };
const steps = [
  ["video interactions", () => db.videoInteractionEvent.deleteMany({})],
  ["video likes", () => db.videoLike.deleteMany({})],
  ["comments", () => db.comment.deleteMany({})],
  ["view events", () => db.viewEvent.deleteMany({})],
  ["reports", () => db.contentReport.deleteMany({})],
  ["saved videos", () => db.savedVideo.deleteMany({})],
  ["video feedback", () => db.videoFeedback.deleteMany({})],
  ["video languages", () => db.videoLanguage.deleteMany({})],
  ["video categories", () => db.videoCategoryAssignment.deleteMany({})],
  ["appeals", () => db.appeal.deleteMany({})],
  ["ledger entries", () => db.ledgerEntry.deleteMany({})],
  ["withdrawals", () => db.withdrawal.deleteMany({})],
  ["notifications", () => db.notification.deleteMany({})],
  ["follows", () => db.follow.deleteMany({})],
  ["blocked creators", () => db.blockedCreator.deleteMany({})],
  ["channel categories", () => db.channelCategoryPreference.deleteMany({})],
  ["channel languages", () => db.channelLanguage.deleteMany({})],
  ["strikes", () => db.channelStrike.deleteMany({})],
  ["ID checks", () => db.creatorVerification.deleteMany({})],
  ["videos", () => db.video.deleteMany({})],
  ["channels", () => db.channel.deleteMany({})],
  ["user languages", () => db.userLanguagePreference.deleteMany({ where: { userId: { not: admin.id } } })],
  ["user categories", () => db.userCategoryPreference.deleteMany({ where: { userId: { not: admin.id } } })],
  ["user subcategories", () => db.userSubcategoryPreference.deleteMany({ where: { userId: { not: admin.id } } })],
  ["user reco prefs", () => db.userRecommendationPreference.deleteMany({ where: { userId: { not: admin.id } } })],
  ["sessions", () => db.session.deleteMany({})],
  ["email codes", () => db.emailOtp.deleteMany({})],
  ["mail log", () => db.mailLog.deleteMany({})],
  ["search log", () => db.searchLog.deleteMany({})],
  ["fraud flags", () => db.fraudFlag.deleteMany({})],
  ["newsletter (seed)", () => db.newsletterSubscriber.deleteMany({})],
  ["contact messages (seed)", () => db.contactMessage.deleteMany({})],
  ["audit log", () => db.auditLog.deleteMany({})],
  ["video tag audit", () => db.taxonomyAuditLog.deleteMany({ where: { entityType: "VIDEO_TAGS" } })],
  ["other users", () => db.user.deleteMany({ where: others })],
  ["demo notice setting", () => db.platformSetting.deleteMany({ where: { key: "demo" } })],
];
for (const [name, fn] of steps) {
  const r = await fn();
  console.log(`  ${name}: ${r.count}`);
}
let files = 0;
if (PRIVATE_DIR) {
  for (const k of kyc) {
    const full = path.resolve(PRIVATE_DIR, k.fileName);
    if (full.startsWith(path.resolve(PRIVATE_DIR) + path.sep)) { await unlink(full).then(() => files++, () => {}); }
  }
}
console.log(`  private ID files deleted: ${files}`);
await db.auditLog.create({
  data: { actorId: admin.id, actorEmail: admin.email, action: "DEMO_DATA_REMOVED", targetType: "PLATFORM", details: "All demo creators, users, videos, earnings and logs removed; platform starts empty" },
});
console.log("after:", JSON.stringify(await counts()));
await db.$disconnect();
