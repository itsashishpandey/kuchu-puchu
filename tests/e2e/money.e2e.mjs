// End-to-end checks of the money rules: admin rate versions, the earning unlock, per-view pay,
// one counted view per viewer, the per-connection view cap, upload rewards, pause, the earning
// window, the holding period and withdrawals (including simultaneous requests and double clicks).
// Run against a server using a SCRATCH database (never production):
//   DATABASE_URL=file:/path/to/scratch.db  BASE=http://127.0.0.1:5055  node tests/e2e/money.e2e.mjs
// It creates its own creator and removes everything it made at the end.
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = (process.env.BASE || "http://127.0.0.1:5055").replace(/\/$/, "");
const db = new PrismaClient();
const UA = "KuchuPuchuApp/1.5.2 (Android)";
const results = [];
const started = new Date();
let ipSeq = 1;
const freshIp = () => `10.88.${Math.floor(ipSeq / 250)}.${(ipSeq++ % 250) + 1}`;

async function call(method, url, { token, body, ip, ua } = {}) {
  const headers = { "user-agent": ua ?? UA, "x-forwarded-for": ip ?? freshIp() };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(BASE + "/api" + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
function check(cond, msg) { if (!cond) throw new Error(msg); }
const near = (a, b) => Math.abs(a - b) < 1e-9;
async function test(name, fn) {
  try { const note = await fn(); results.push({ name, ok: true }); console.log(`✔ ${name}${note ? ` — ${note}` : ""}`); }
  catch (e) { results.push({ name, ok: false }); console.log(`✖ ${name} — ${e.message}`); }
}

// ── setup: admin, known rates, a brand-new creator with three pending videos ──
const login = await call("POST", "/auth/login", { body: { email: "admin@mykuchupuchu.com", password: "Admin@123" } });
const admin = login.data.token;
check(admin, `admin login: ${login.data.error}`);
const saveRates = extra => call("POST", "/admin/monetization", { token: admin, body: {
  ratePer1000Views: 2, rewardPerUploadInr: 50, inrPerUsd: 100, minMonthlyChannelViews: 3, monetizationDurationMonths: 3,
  minWithdrawalAmount: 1, holdingPeriodDays: 7, monetizationPaused: false, ...extra,
} });
check((await saveRates()).status === 200, "could not save the test rates");

const tag = randomBytes(4).toString("hex");
const creator = await db.user.create({ data: {
  email: `money-e2e-${tag}@example.test`, passwordHash: "x", name: `Money Test ${tag}`, role: "CREATOR", status: "APPROVED", monetizationEligible: true,
} });
await db.channel.create({ data: { userId: creator.id, name: `Money Test ${tag}`, username: `moneytest${tag}` } });
const ctoken = randomBytes(32).toString("hex");
await db.session.create({ data: { token: ctoken, userId: creator.id, expiresAt: new Date(Date.now() + 3600e3) } });
const mk = n => db.video.create({ data: {
  contentId: `E2E-MONEY-${tag}-${n}`, creatorId: creator.id, title: `Money test ${n}`, category: "Cartoons",
  videoUrl: `/videos/v01.mp4`, duration: 20, status: "PENDING",
} });
const [A, B, C] = [await mk("A"), await mk("B"), await mk("C")];
const approve = contentId => call("POST", `/admin/videos/${contentId}/action`, { token: admin, body: { action: "approve" } });
const view = (v, ip) => call("POST", `/social/view/${v.contentId}`, { ip, body: { watchSeconds: 15, durationSeconds: 20 } });
const ledger = where => db.ledgerEntry.findMany({ where: { userId: creator.id, ...where }, orderBy: { createdAt: "asc" } });
const wallet = async () => (await call("GET", "/creator/withdrawals", { token: ctoken })).data.wallet;
const withdraw = amount => call("POST", "/creator/withdraw", { token: ctoken, body: { amount, method: "PAYPAL", details: { paypalEmail: "parent@example.test" } } });

await test("Admin rates — the version in effect, scheduled versions, date checks", async () => {
  const g = (await call("GET", "/admin/monetization", { token: admin })).data;
  check(g.current.ratePer1000Views === 2 && near(g.current.rewardPerUpload, 0.5), `current = ${g.current.ratePer1000Views} / ${g.current.rewardPerUpload}`);
  check(g.inEffectId === g.current.id, "inEffectId should be the current version");
  const past = await saveRates({ effectiveDate: "2000-01-01" });
  check(past.status === 400 && /past/.test(past.data.error), `past date: ${past.status} ${past.data.error}`);
  const junk = await saveRates({ effectiveDate: "not-a-date" });
  check(junk.status === 400, `invalid date: ${junk.status}`);
  const future = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  check((await saveRates({ ratePer1000Views: 9, effectiveDate: future })).status === 200, "scheduling failed");
  const g2 = (await call("GET", "/admin/monetization", { token: admin })).data;
  check(g2.current.ratePer1000Views === 2, `a scheduled version must not apply yet (current ${g2.current.ratePer1000Views})`);
  check(g2.history.some(h => h.ratePer1000Views === 9 && new Date(h.effectiveDate) > new Date()), "scheduled version missing from history");
  await db.monetizationSetting.deleteMany({ where: { ratePer1000Views: 9, createdAt: { gte: started } } }); // keep the rest deterministic
  return "in-effect version shown as current; future date only scheduled; past/invalid dates refused";
});

await test("Before unlock — views count, nothing earns, no upload reward", async () => {
  check((await approve(A.contentId)).status === 200, "approve A failed");
  const a = await db.video.findUnique({ where: { id: A.id } });
  const windowDays = (a.earningExpiresAt - a.publishedAt) / 864e5;
  check(a.publishedAt && Math.round(windowDays) === 90, `earning window ${windowDays} days (expected 90 for 3 months)`);
  check((await ledger({ type: "UPLOAD_REWARD" })).length === 0 && !a.uploadRewardCredited, "upload reward paid before unlock");
  const reasons = [];
  for (let i = 0; i < 3; i++) reasons.push((await view(A)).data.reason);
  check(reasons.every(r => r === "CHANNEL_BELOW_VIEW_THRESHOLD"), `reasons: ${reasons}`);
  const a2 = await db.video.findUnique({ where: { id: A.id } });
  check(a2.views === 3 && a2.qualifiedViews === 0, `views ${a2.views}, qualified ${a2.qualifiedViews}`);
  check((await ledger({ type: "VIEW_EARNING" })).length === 0, "views earned before unlock");
  return "3 views counted publicly, $0 earned, no reward";
});

console.log("  (waiting 61 s: the channel's 30-day view count is cached for a minute)");
await new Promise(r => setTimeout(r, 61_000));

await test("Unlock — the next view earns exactly rate ÷ 1,000, held for 7 days", async () => {
  const r = await view(A);
  check(r.data.qualified && r.data.credited, `view after target: ${JSON.stringify(r.data)}`);
  const u = await db.user.findUnique({ where: { id: creator.id } });
  check(u.monetizationUnlockedAt, "unlock not recorded");
  const [e] = await ledger({ type: "VIEW_EARNING" });
  check(e && near(e.amount, 0.002) && e.rateSnapshot === 2 && e.status === "PENDING", `entry ${e?.amount} @ ${e?.rateSnapshot} ${e?.status}`);
  const holdDays = (e.availableAt - e.createdAt) / 864e5;
  check(Math.abs(holdDays - 7) < 0.01, `hold ${holdDays} days`);
  const a = await db.video.findUnique({ where: { id: A.id } });
  check(a.views === 4 && a.qualifiedViews === 1, `views ${a.views}, qualified ${a.qualifiedViews}`);
  return "$0.002 for 1 view at $2/1K, pending 7 days; public views 4, earning views 1";
});

await test("One viewer counts once — even 10 simultaneous requests", async () => {
  const ip = freshIp();
  const burst = await Promise.all(Array.from({ length: 10 }, () => view(A, ip)));
  const counted = burst.filter(r => r.data.qualified).length;
  const repeats = burst.filter(r => r.data.reason === "REPEAT_VIEW_WITHIN_WINDOW").length;
  check(counted === 1 && repeats === 9, `counted ${counted}, repeats ${repeats}`);
  const later = await view(A, ip);
  check(later.data.reason === "REPEAT_VIEW_WITHIN_WINDOW", `replay: ${later.data.reason}`);
  check((await ledger({ type: "VIEW_EARNING" })).length === 2, "burst credited more than one view");
  return "1 counted + 9 refused, and a later replay refused";
});

await test("Upload reward — paid once, even when Approve is clicked twice at once", async () => {
  const both = await Promise.all([approve(B.contentId), approve(B.contentId)]);
  check(both.every(r => r.status === 200), `approve statuses ${both.map(r => r.status)}`);
  check((await approve(B.contentId)).status === 200, "re-approve failed");
  check((await approve(C.contentId)).status === 200, "approve C failed");
  const rewards = await ledger({ type: "UPLOAD_REWARD" });
  const forB = rewards.filter(r => r.videoId === B.id), forC = rewards.filter(r => r.videoId === C.id);
  check(forB.length === 1 && forC.length === 1, `rewards B ${forB.length}, C ${forC.length}`);
  check(near(forB[0].amount, 0.5) && near(forC[0].amount, 0.5), `amounts ${forB[0].amount} / ${forC[0].amount}`);
  return "one $0.50 reward per video (₹50 at ₹100/$1)";
});

await test("Rate change — applies to new views only", async () => {
  check((await saveRates({ ratePer1000Views: 5 })).status === 200, "rate change failed");
  const r = await view(A);
  check(r.data.qualified, `view: ${r.data.reason}`);
  const entries = await ledger({ type: "VIEW_EARNING" });
  const last = entries[entries.length - 1];
  check(near(last.amount, 0.005) && last.rateSnapshot === 5, `new view ${last.amount} @ ${last.rateSnapshot}`);
  check(entries.slice(0, -1).every(e => near(e.amount, 0.002) && e.rateSnapshot === 2), "older earnings changed");
  return "new view $0.005 at $5/1K; earlier views kept $0.002";
});

await test("Pause — no new earnings and no withdrawals until switched back on", async () => {
  check((await saveRates({ ratePer1000Views: 5, monetizationPaused: true })).status === 200, "pause failed");
  const before = (await ledger({})).length;
  const r = await view(A);
  check(!r.data.qualified && r.data.reason === "MONETIZATION_PAUSED", `paused view: ${JSON.stringify(r.data)}`);
  check((await ledger({})).length === before, "credited while paused");
  const w = await withdraw(1);
  check(w.status === 400 && /paused/i.test(w.data.error), `withdraw while paused: ${w.status} ${w.data.error}`);
  check((await saveRates({ ratePer1000Views: 5, monetizationPaused: false })).status === 200, "unpause failed");
  return "paused view credited nothing; withdrawal refused";
});

await test("Earning window — an expired video stops earning", async () => {
  const keep = (await db.video.findUnique({ where: { id: C.id } })).earningExpiresAt;
  await db.video.update({ where: { id: C.id }, data: { earningExpiresAt: new Date(Date.now() - 1000) } });
  const r = await view(C);
  check(r.data.reason === "MONETIZATION_WINDOW_EXPIRED", `expired: ${r.data.reason}`);
  await db.video.update({ where: { id: C.id }, data: { earningExpiresAt: keep } });
  const r2 = await view(C);
  check(r2.data.qualified, `inside the window: ${r2.data.reason}`);
  return "refused after the window, earning inside it";
});

await test("Wallet & withdrawals — hold, minimum, balance, simultaneous requests, payout once", async () => {
  // earned so far: views 0.002 + 0.002 + 0.005 + 0.005 (C) + rewards 0.50 + 0.50 = 1.014
  const earned = (await ledger({})).reduce((a, e) => a + e.amount, 0);
  check(near(earned, 1.014), `earned ${earned}`);
  let w = await wallet();
  check(w.availableBalance === 0 && w.pendingBalance === 1.01 && w.lifetimeEarnings === 1.01, `in hold: ${JSON.stringify(w)}`);
  check((await withdraw(1)).status === 400, "withdrew money still in the holding period");
  await db.ledgerEntry.updateMany({ where: { userId: creator.id }, data: { availableAt: new Date(Date.now() - 1000) } }); // hold over
  w = await wallet();
  check(w.availableBalance === 1.01 && w.pendingBalance === 0, `after hold: ${JSON.stringify(w)}`);
  const small = await withdraw(0.5);
  check(small.status === 400 && /Minimum/.test(small.data.error), `below minimum: ${small.data.error}`);
  const five = await Promise.all(Array.from({ length: 5 }, () => withdraw(1)));
  const okCount = five.filter(r => r.status === 201).length;
  check(okCount === 1, `simultaneous withdrawals accepted: ${okCount} (statuses ${five.map(r => r.status)})`);
  w = await wallet();
  check(w.availableBalance === 0.01 && w.pendingBalance === 1, `with $1 requested: ${JSON.stringify(w)}`);
  const wd = await db.withdrawal.findFirst({ where: { userId: creator.id } });
  check((await call("POST", `/admin/withdrawals/${wd.id}/action`, { token: admin, body: { action: "approve" } })).status === 200, "admin approve failed");
  const paid = await Promise.all([1, 2].map(() => call("POST", `/admin/withdrawals/${wd.id}/action`, { token: admin, body: { action: "paid" } })));
  check(paid.filter(r => r.status === 200).length === 1, `"paid" accepted ${paid.filter(r => r.status === 200).length} times`);
  check((await ledger({ type: "WITHDRAWAL_PAID" })).length === 1, "payout recorded more than once");
  w = await wallet();
  check(w.totalWithdrawn === 1 && w.availableBalance === 0.01 && w.pendingBalance === 0, `after payout: ${JSON.stringify(w)}`);
  return "held 7 days, $1 minimum, 1 of 5 simultaneous requests accepted, paid once";
});

await test("Rejected withdrawal — the money returns to the balance", async () => {
  await db.ledgerEntry.create({ data: { userId: creator.id, type: "ADJUSTMENT", amount: 2, status: "PENDING", availableAt: new Date(Date.now() - 1000), description: "e2e top-up" } });
  const r = await withdraw(1.5);
  check(r.status === 201, `request: ${r.data.error}`);
  let w = await wallet();
  check(w.availableBalance === 0.51, `while requested: ${JSON.stringify(w)}`);
  const rej = await call("POST", `/admin/withdrawals/${r.data.withdrawal.id}/action`, { token: admin, body: { action: "reject", note: "Test rejection" } });
  check(rej.status === 200, `reject: ${rej.data.error}`);
  w = await wallet();
  check(w.availableBalance === 2.01 && w.totalWithdrawn === 1, `after rejection: ${JSON.stringify(w)}`);
  return "$1.50 locked, then returned on rejection";
});

await test("One internet connection — at most 5 counted views per video; faked headers can't dodge it", async () => {
  const viewsBefore = (await db.video.findUnique({ where: { id: A.id } })).views;
  const creditsBefore = (await ledger({ type: "VIEW_EARNING" })).length;
  const send = (ip, i) => call("POST", `/social/view/${A.contentId}`, { ip, ua: `KuchuPuchuApp/1.5.${i} (Android; fake-device-${i})`, body: { watchSeconds: 15, durationSeconds: 20 } });
  // 7 "different viewers" on one connection, all at once, each also faking the first forwarded address
  const home = freshIp();
  const a = await Promise.all(Array.from({ length: 7 }, (_, i) => send(`9.9.${i}.${i + 1}, ${home}`, i)));
  const aCounted = a.filter(r => r.data.qualified).length, aCapped = a.filter(r => r.data.reason === "NETWORK_VIEW_CAP").length;
  check(aCounted === 5 && aCapped === 2, `one IPv4 connection: counted ${aCounted}, capped ${aCapped}`);
  // 7 addresses inside one IPv6 /64 are one connection
  const b = await Promise.all(Array.from({ length: 7 }, (_, i) => send(`2001:db8:77:1::${(i + 1).toString(16)}`, 10 + i)));
  const bCounted = b.filter(r => r.data.qualified).length;
  check(bCounted === 5, `one IPv6 /64: counted ${bCounted}`);
  // a different connection still counts
  check((await send(freshIp(), 30)).data.qualified, "another connection was refused");
  const v = await db.video.findUnique({ where: { id: A.id } });
  check(v.views === viewsBefore + 11, `public views moved by ${v.views - viewsBefore} (expected 11)`);
  check((await ledger({ type: "VIEW_EARNING" })).length === creditsBefore + 11, "capped views were credited");
  // the admin can change the cap
  const set = cap => call("POST", "/admin/platform", { token: admin, body: { viewCounting: { appOnly: true, repeatWindowHours: 4, maxViewsPerNetwork: cap } } });
  check((await set(0)).status === 400, "a cap of 0 must be refused");
  check((await set(2)).status === 200, "saving cap 2 failed");
  const school = freshIp();
  const c = await Promise.all(Array.from({ length: 3 }, (_, i) => send(school, 40 + i)));
  check(c.filter(r => r.data.qualified).length === 2, `cap 2: counted ${c.filter(r => r.data.qualified).length}`);
  check((await set(5)).status === 200, "restoring cap 5 failed");
  const got = (await call("GET", "/admin/platform", { token: admin })).data.settings.viewCounting;
  check(got.maxViewsPerNetwork === 5, `cap now ${got.maxViewsPerNetwork}`);
  return "IPv4 connection 5 of 7 (faked forwarded addresses ignored), IPv6 /64 5 of 7, other connection counts, admin cap 2 → 2 of 3";
});

// ── cleanup: everything this run created ──
await db.withdrawal.deleteMany({ where: { userId: creator.id } });
await db.ledgerEntry.deleteMany({ where: { userId: creator.id } });
await db.fraudFlag.deleteMany({ where: { userId: creator.id } });
await db.notification.deleteMany({ where: { userId: creator.id } });
await db.user.delete({ where: { id: creator.id } }); // videos, channel, views and the session go with it
await db.monetizationSetting.deleteMany({ where: { createdAt: { gte: started } } });
await db.notification.deleteMany({ where: { title: "Monetization rates updated", createdAt: { gte: started } } });
await db.$disconnect();

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
