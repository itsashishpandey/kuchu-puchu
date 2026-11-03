// End-to-end acceptance tests for languages, kids categories & personalised feeds (spec §17, Tests 1–11),
// plus the kids-only safety rules, the creator application, strikes and the monetization unlock.
// Run against a server using a SCRATCH database (never production):
//   DATABASE_URL=file:/path/to/scratch.db  BASE=http://127.0.0.1:5055  CLIPS=/dir/with/e2e_{hi,bn,mis}.mp4  node tests/e2e/discovery.e2e.mjs
// The clips must be unique 40–60 s videos (so duplicate detection doesn't flag them).
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE = (process.env.BASE || "http://127.0.0.1:5055").replace(/\/$/, "");
const CLIPS = process.env.CLIPS || ".";
const db = new PrismaClient();
// requests look like the Android app: only app views count (Admin → Platform → View counting)
const UA = "KuchuPuchuApp/1.5.1 (Android)";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
let ipSeq = 1;
const results = [];

async function call(method, url, { token, body, form, ip, ua } = {}) {
  const headers = { "user-agent": ua ?? UA, "x-forwarded-for": ip ?? `10.77.0.${(ipSeq++ % 250) + 1}` };
  if (token) headers.authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(BASE + "/api" + url, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
const login = async (email, password) => {
  const r = await call("POST", "/auth/login", { body: { email, password } });
  if (!r.data.token) throw new Error(`login ${email}: ${r.data.error}`);
  return r.data.token;
};
function check(cond, msg) { if (!cond) throw new Error(msg); }
async function test(name, fn) {
  const t0 = Date.now();
  try { const note = await fn(); results.push({ name, ok: true, note: note ?? "", ms: Date.now() - t0 }); console.log(`✔ ${name}${note ? ` — ${note}` : ""}`); }
  catch (e) { results.push({ name, ok: false, note: e.message, ms: Date.now() - t0 }); console.log(`✖ ${name} — ${e.message}`); }
}

// ── taxonomy helpers ──
const tax = (await call("GET", "/taxonomy/categories")).data.categories;
const langs = (await call("GET", "/taxonomy/languages")).data.languages;
const cat = slug => { const c = tax.find(x => x.slug === slug); if (!c) throw new Error(`no category ${slug}`); return c; };
const sub = (cslug, sslug) => { const s = cat(cslug).subcategories.find(x => x.slug === sslug); if (!s) throw new Error(`no subcategory ${cslug}/${sslug}`); return s; };
const pair = (c, s) => ({ categoryId: cat(c).id, subcategoryId: sub(c, s).id });
const firstSub = c => cat(c).subcategories[0];
check(langs.some(l => l.code === "hi") && langs.some(l => l.code === "bn"), "Hindi and Bengali must be active");

// Tests 1–11 assume an earning channel: switch the monthly-views threshold off for them; the
// threshold has its own test below (and is restored at the end).
const originalThreshold = (await db.monetizationSetting.findFirst({ orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }] }))?.minMonthlyChannelViews ?? 2500;
await db.monetizationSetting.updateMany({ data: { minMonthlyChannelViews: 0 } });

const admin = await login("admin@mykuchupuchu.com", "Admin@123");
const meera = await login("meera@mykuchupuchu.com", "Creator@123");
const aarav = await login("aarav@mykuchupuchu.com", "Creator@123");

async function upload(token, file, fields) {
  const fd = new FormData();
  fd.append("video", new Blob([readFileSync(path.join(CLIPS, file))], { type: "video/mp4" }), file);
  fd.append("originalityDeclaration", "true");
  fd.append("copyrightConfirmation", "true");
  if (!fields.noKidsSafe) fd.append("kidsSafeDeclaration", "true");
  delete fields.noKidsSafe;
  for (const [k, v] of Object.entries(fields)) fd.append(k, typeof v === "string" ? v : JSON.stringify(v));
  return call("POST", "/creator/upload", { token, form: fd });
}
const approve = contentId => call("POST", `/admin/videos/${contentId}/action`, { token: admin, body: { action: "approve" } });
const feedIds = async (token, extra = "") => (await call("GET", `/public/videos?feed=foryou&limit=48${extra}`, { token })).data;

// ── Test 3: one video, three valid category paths ──
let hiVideo = null;
await test("Test 3 — three categories, one video ID, one reward", async () => {
  const r = await upload(meera, "e2e_hi.mp4", {
    title: "E2E गिनती गीत | Counting farm animals in Hindi",
    description: "एक गाय, दो बकरी, तीन मुर्गी — चलो गिनती गाएँ", hashtags: "#ginti #hindi",
    languages: { primary: "hi", additional: [] },
    tags: [pair("rhymes-songs", "counting-songs"), pair("early-learning", "numbers-counting"), pair("animals", "farm-animals")],
  });
  check(r.status === 201, `upload failed: ${r.status} ${r.data.error}`);
  hiVideo = r.data.video;
  check((await approve(hiVideo.contentId)).status === 200, "approve failed");
  for (const c of ["rhymes-songs", "early-learning", "animals"]) {
    const list = (await call("GET", `/public/videos?feed=explore&category=${c}&limit=48`)).data.videos;
    check(list.some(v => v.contentId === hiVideo.contentId), `not found under ${c}`);
  }
  const rows = await db.video.count({ where: { title: { startsWith: "E2E गिनती" } } });
  const rewards = await db.ledgerEntry.count({ where: { type: "UPLOAD_REWARD", videoId: hiVideo.id } });
  const assignments = await db.videoCategoryAssignment.count({ where: { videoId: hiVideo.id } });
  check(rows === 1 && rewards === 1 && assignments === 3, `rows=${rows} rewards=${rewards} assignments=${assignments}`);
  const ms = await db.monetizationSetting.findFirst({ orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }] });
  const reward = await db.ledgerEntry.findFirst({ where: { type: "UPLOAD_REWARD", videoId: hiVideo.id } });
  check(Math.abs(reward.amount - Math.round((ms.rewardPerUploadInr / ms.inrPerUsd) * 100) / 100) < 0.001 && reward.description.includes("₹"), `reward ${reward.amount} "${reward.description}"`);
  return `${hiVideo.contentId}: found under all 3 paths; 1 video row, 1 upload reward (₹${ms.rewardPerUploadInr} → ${reward.amount}), 3 tag rows`;
});

// ── Test 4 + 5 via the real upload endpoint (rejected before any file work) ──
await test("Test 4 — a fourth category is rejected with a clear error", async () => {
  const r = await upload(meera, "e2e_bn.mp4", {
    title: "E2E four categories", languages: { primary: "en" },
    tags: [pair("cartoons-animation", "funny-cartoons"), pair("rhymes-songs", "nursery-rhymes"), { categoryId: cat("early-learning").id, subcategoryId: firstSub("early-learning").id }, { categoryId: cat("science-nature").id, subcategoryId: firstSub("science-nature").id }],
  });
  check(r.status === 400 && /at most 3 categories/i.test(r.data.error), `${r.status} ${r.data.error}`);
  return r.data.error;
});
await test("Test 5 — Nursery Rhymes under Arts & Crafts is rejected", async () => {
  const rhymes = sub("rhymes-songs", "nursery-rhymes");
  const r = await upload(meera, "e2e_bn.mp4", { title: "E2E invalid parent", languages: { primary: "en" }, tags: [{ categoryId: cat("arts-crafts").id, subcategoryId: rhymes.id }] });
  check(r.status === 400 && /isn't part of Arts & Crafts/.test(r.data.error), `${r.status} ${r.data.error}`);
  return r.data.error;
});

// Bengali video for Test 2
let bnVideo = null;
await test("setup — Bengali kids video", async () => {
  const r = await upload(meera, "e2e_bn.mp4", { title: "E2E বাংলা ছড়া | Bengali rhyme", description: "ছোটদের ছড়া", languages: { primary: "bn" }, tags: [pair("rhymes-songs", "nursery-rhymes")] });
  check(r.status === 201, `${r.status} ${r.data.error}`);
  bnVideo = r.data.video;
  check((await approve(bnVideo.contentId)).status === 200, "approve failed");
  return bnVideo.contentId;
});

// ── Test 1: new parent picks Hindi + Rhymes & Songs › Counting Songs ──
let viewer = null;
await test("Test 1 — new user's For You prioritises relevant Hindi videos", async () => {
  const fd = new FormData();
  const email = `e2e.viewer.${Date.now()}@example.com`;
  for (const [k, v] of Object.entries({ accountType: "VIEWER", parentConfirm: "true", fullName: "E2E Viewer", email, password: "Viewer@1234" })) fd.append(k, v);
  const reg = await call("POST", "/auth/register", { form: fd });
  check(reg.status === 201 && reg.data.token, `register ${reg.status} ${reg.data.error}`);
  viewer = reg.data.token;
  check(reg.data.user.onboarding && reg.data.user.onboarding.completed === false, "new account should need onboarding");
  const p = await call("PUT", "/me/preferences", { token: viewer, body: {
    languages: ["hi"], primaryLanguage: "hi", categories: [{ id: cat("rhymes-songs").id }], subcategoryIds: [sub("rhymes-songs", "counting-songs").id], completeOnboarding: true,
  } });
  check(p.status === 200 && p.data.preferences.onboarding.completed, `prefs ${p.status} ${p.data.error}`);
  const f = await feedIds(viewer);
  check(f.videos.length > 0, `empty feed: ${JSON.stringify(f.meta)}`);
  check(f.videos[0].contentId === hiVideo.contentId, `first video is ${f.videos[0].contentId} (${f.videos[0].title})`);
  check(f.videos.every(v => v.languages.some(l => l.code === "hi")), "a non-Hindi video leaked into a Hindi-only feed");
  return `first = ${f.videos[0].contentId} (tier ${f.meta.tiers[0]}), ${f.videos.length} Hindi video(s), personalized=${f.meta.personalized}`;
});

// ── Test 2: Hindi + English + Bengali ──
await test("Test 2 — Hindi, English and Bengali can all be recommended", async () => {
  const p = await call("PUT", "/me/preferences", { token: viewer, body: {
    languages: ["hi", "en", "bn"], primaryLanguage: "hi",
    categories: [{ id: cat("rhymes-songs").id, allSubcategories: true }, { id: cat("cartoons-animation").id, allSubcategories: true }], subcategoryIds: [],
  } });
  check(p.status === 200, `${p.status} ${p.data.error}`);
  const f = await feedIds(viewer);
  const seen = new Set(f.videos.flatMap(v => v.languages.filter(l => l.isPrimary).map(l => l.code)));
  check(["hi", "en", "bn"].every(c => seen.has(c)), `languages in feed: ${[...seen].join(",")}`);
  check(f.videos.every(v => v.languages.some(l => ["hi", "en", "bn"].includes(l.code))), "a video outside the 3 languages appeared");
  return `primary languages in feed: ${[...seen].join(", ")} (${f.videos.length} videos)`;
});

// ── Test 6: switch to Stories + Kids Comedy, remove Rhymes & Songs → next request reflects it ──
await test("Test 6 — preference update is reflected on the next feed request", async () => {
  const before = await feedIds(viewer);
  check(before.videos.some(v => v.contentId === hiVideo.contentId && before.meta.tiers[before.videos.indexOf(v)] <= 2), "counting song should be an interest match before");
  const p = await call("PUT", "/me/preferences", { token: viewer, body: {
    languages: ["hi", "en", "bn"], primaryLanguage: "hi",
    categories: [{ id: cat("stories").id, allSubcategories: true }, { id: cat("kids-comedy").id, allSubcategories: true }], subcategoryIds: [],
  } });
  check(p.status === 200, `${p.status} ${p.data.error}`);
  const after = await feedIds(viewer);
  const i = after.videos.findIndex(v => v.contentId === hiVideo.contentId);
  check(i === -1 || after.meta.tiers[i] >= 3, `counting song still ranked as an interest (tier ${after.meta.tiers[i]})`);
  check(after.videos.slice(0, 3).every(v => v.tags.some(t => ["stories", "kids-comedy"].includes(t.category.slug))), "top of feed doesn't follow the new interests");
  return `counting song moved from tier ${before.meta.tiers[before.videos.findIndex(v => v.contentId === hiVideo.contentId)]} to ${i === -1 ? "not shown" : `tier ${after.meta.tiers[i]}`}`;
});

// ── Test 7: admin adds a category + subcategory → shows up without a deployment ──
let newSubId = null;
await test("Test 7 — admin-added category appears in the pickers immediately", async () => {
  const c = await call("POST", "/admin/discovery/categories", { token: admin, body: { name: "E2E Shadow Puppets", emoji: "🧸", color: "#FF4E9B", keywords: "shadow puppet, shadow play" } });
  check(c.status === 201, `${c.status} ${c.data.error}`);
  const s = await call("POST", "/admin/discovery/subcategories", { token: admin, body: { categoryId: c.data.category.id, name: "Hand Shadow Animals", emoji: "🖐️" } });
  check(s.status === 201, `${s.status} ${s.data.error}`);
  newSubId = s.data.subcategory.id;
  const t = (await call("GET", "/taxonomy/categories")).data.categories;
  const found = t.find(x => x.id === c.data.category.id);
  check(found && found.subcategories.some(x => x.id === newSubId), "new category/subcategory not in /api/taxonomy/categories");
  return "visible in /api/taxonomy/categories (used by onboarding, settings, upload and explore)";
});

// ── Test 8: deactivate a subcategory → no new tagging; history intact ──
await test("Test 8 — deactivated subcategory: blocked for new tags, history kept", async () => {
  const hw = sub("rhymes-songs", "counting-songs");
  const off = await call("PATCH", `/admin/discovery/subcategories/${hw.id}`, { token: admin, body: { active: false } });
  check(off.status === 200, `${off.status} ${off.data.error}`);
  try {
    const t = (await call("GET", "/taxonomy/categories")).data.categories;
    check(!t.find(c => c.slug === "rhymes-songs").subcategories.some(s => s.id === hw.id), "still offered in pickers");
    const r = await upload(aarav, "e2e_mis.mp4", { title: "E2E inactive", languages: { primary: "hi" }, tags: [pair("rhymes-songs", "counting-songs")] });
    check(r.status === 400 && /no longer available/.test(r.data.error), `upload: ${r.status} ${r.data.error}`);
    const kept = await db.videoCategoryAssignment.count({ where: { videoId: hiVideo.id, subcategoryId: hw.id } });
    check(kept === 1, "existing video lost its tag");
    const still = (await call("GET", `/public/videos?feed=explore&category=rhymes-songs&subcategory=counting-songs`)).data.videos;
    check(still.some(v => v.contentId === hiVideo.contentId), "historical video no longer reachable via its tag");
    return `new tagging rejected: "${r.data.error}"; ${hiVideo.contentId} keeps the tag`;
  } finally {
    await call("PATCH", `/admin/discovery/subcategories/${hw.id}`, { token: admin, body: { active: true } });
  }
});

// ── Test 9: 1,000 qualified views on a 3-category video → paid once ──
await test("Test 9 — 1,000 qualified views pay like one video, not three", async () => {
  const before = await db.ledgerEntry.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { videoId: hiVideo.id, type: "VIEW_EARNING" } });
  const settings = await db.monetizationSetting.findFirst();
  let qualified = 0;
  const one = async i => {
    const r = await call("POST", `/social/view/${hiVideo.contentId}`, { ip: `10.${50 + (i >> 16)}.${(i >> 8) & 255}.${i & 255}`, body: { watchSeconds: 30, durationSeconds: 45 } });
    if (r.data.qualified) qualified++;
  };
  for (let i = 0; i < 1000; i += 20) await Promise.all(Array.from({ length: 20 }, (_, k) => one(1000 + i + k)));
  const after = await db.ledgerEntry.aggregate({ _sum: { amount: true }, _count: { _all: true }, where: { videoId: hiVideo.id, type: "VIEW_EARNING" } });
  const earned = Math.round(((after._sum.amount ?? 0) - (before._sum.amount ?? 0)) * 100) / 100;
  const expected = Math.round(((settings?.ratePer1000Views ?? 1) * qualified / 1000) * 100) / 100;
  const rewards = await db.ledgerEntry.count({ where: { videoId: hiVideo.id, type: "UPLOAD_REWARD" } });
  const v = await db.video.findUnique({ where: { id: hiVideo.id } });
  check(qualified === 1000, `only ${qualified} of 1000 views qualified`);
  check(Math.abs(earned - expected) < 0.011, `earned $${earned}, expected $${expected}`);
  check(rewards === 1 && v.qualifiedViews >= 1000, `rewards=${rewards} qualifiedViews=${v.qualifiedViews}`);
  return `1,000 qualified views → $${earned.toFixed(2)} (rate $${settings?.ratePer1000Views ?? 1}/1,000), 1 upload reward, 1 video row`;
});

let misVideo = null;
// ── Test 10: Hindi-only video tagged as English → review queue → admin corrects with audit trail ──
await test("Test 10 — wrong language is flagged and corrected by admin with an audit trail", async () => {
  const r = await upload(aarav, "e2e_mis.mp4", {
    title: "E2E चिड़िया और चूहे की कहानी", description: "यह वीडियो पूरी तरह हिंदी में है", hashtags: "#हिंदी",
    languages: { primary: "en" }, tags: [pair("stories", "animal-stories")],
  });
  check(r.status === 201, `${r.status} ${r.data.error}`);
  const cid = r.data.video.contentId;
  misVideo = cid;
  check(r.data.video.tagStatus === "NEEDS_REVIEW", `tagStatus=${r.data.video.tagStatus} (expected NEEDS_REVIEW)`);
  const q = (await call("GET", "/admin/discovery/tags?status=NEEDS_REVIEW&q=" + cid, { token: admin })).data;
  check(q.videos.some(v => v.contentId === cid), "not in the admin review queue");
  const fix = await call("PATCH", `/admin/discovery/tags/${cid}`, { token: admin, body: { languages: { primary: "hi" }, tags: [pair("stories", "animal-stories")], note: "Spoken language is Hindi" } });
  check(fix.status === 200, `${fix.status} ${fix.data.error}`);
  const vl = await db.videoLanguage.findMany({ where: { video: { contentId: cid } }, include: { language: true } });
  check(vl.length === 1 && vl[0].language.code === "hi" && vl[0].source === "ADMIN", `languages now ${vl.map(x => x.language.code)}`);
  const auditRow = await db.taxonomyAuditLog.findFirst({ where: { entityId: cid, action: "VIDEO_TAGS_CORRECTED" }, orderBy: { createdAt: "desc" } });
  check(auditRow && JSON.parse(auditRow.before).languages[0] === "en" && JSON.parse(auditRow.after).languages[0] === "hi", "audit row missing before/after");
  const vid = await db.video.findUnique({ where: { contentId: cid } });
  check(vid.tagStatus === "OK" && vid.contentId === cid, "status/content ID changed");
  return `${cid}: flagged (${r.data.video.tagFlagReason}); corrected en → hi by ${auditRow.actorEmail}`;
});

// ── Test 11: preferred subcategory has no videos → alternatives in the same languages ──
await test("Test 11 — empty exact subcategory falls back to same-language alternatives", async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ accountType: "VIEWER", parentConfirm: "true", fullName: "E2E Viewer Two", email: `e2e.viewer2.${Date.now()}@example.com`, password: "Viewer@1234" })) fd.append(k, v);
  const reg = await call("POST", "/auth/register", { form: fd });
  const tok = reg.data.token;
  const food = cat("kids-cooking");
  const p = await call("PUT", "/me/preferences", { token: tok, body: { languages: ["hi"], primaryLanguage: "hi", categories: [{ id: food.id }], subcategoryIds: [food.subcategories[0].id], completeOnboarding: true } });
  check(p.status === 200, `${p.status} ${p.data.error}`);
  const f = await feedIds(tok);
  check(f.videos.length > 0, `feed empty (${f.meta.emptyReason})`);
  check(f.videos.every(v => v.languages.some(l => l.code === "hi")), "alternatives must stay in Hindi");
  check(!f.videos.some(v => v.tags.some(t => t.subcategory.id === food.subcategories[0].id)), "unexpected exact match");
  return `${f.videos.length} Hindi alternative(s), tiers ${[...new Set(f.meta.tiers)].join("/")}`;
});

// ── Kids-only platform: ages 3–8, no comments, parent accounts only, every upload made for kids ──
await test("Kids safety — no comments, parent-only accounts, kids-safe uploads, kids taxonomy", async () => {
  const settings = (await call("GET", "/public/settings")).data;
  check(settings.audience?.minAge === 3 && settings.audience?.maxAge === 8 && settings.audience.ads === false && settings.audience.commentsEnabled === false, `audience ${JSON.stringify(settings.audience)}`);
  check(tax.length === 15 && !tax.some(c => ["comedy-jokes", "relationships-friendship", "kids-cartoons", "religion-spirituality"].includes(c.slug)), `categories: ${tax.map(c => c.slug).join(",")}`);
  const c = await call("POST", `/social/comment/${hiVideo.contentId}`, { token: viewer, body: { body: "hello" } });
  check(c.status === 403 && /turned off/i.test(c.data.error), `comment: ${c.status} ${c.data.error}`);
  const detail = (await call("GET", `/public/videos/${hiVideo.contentId}`)).data.video;
  check(Array.isArray(detail.comments) && detail.comments.length === 0 && detail.commentsEnabled === false && detail.commentsCount === 0, "video detail still exposes comments");
  const fd = new FormData();
  for (const [k, v] of Object.entries({ accountType: "VIEWER", fullName: "E2E No Parent", email: `e2e.noparent.${Date.now()}@example.com`, password: "Viewer@1234" })) fd.append(k, v);
  const reg = await call("POST", "/auth/register", { form: fd });
  check(reg.status === 400 && /parents and guardians/i.test(reg.data.error), `sign-up without parent confirmation: ${reg.status} ${reg.data.error}`);
  const up = await upload(meera, "e2e_bn.mp4", { noKidsSafe: true, title: "E2E no kids declaration", languages: { primary: "en" }, tags: [pair("cartoons-animation", "funny-cartoons")] });
  check(up.status === 400 && /children aged 3–8/.test(up.data.error), `upload without kids declaration: ${up.status} ${up.data.error}`);
  const legacy = (await call("GET", "/public/videos?feed=explore&category=Nursery%20Rhymes&limit=48")).data.videos;
  check(Array.isArray(legacy), "old app category names must still resolve");
  return "audience 3–8, no ads; comments 403 + hidden; parent confirmation and kids declaration required; 15 kids categories only";
});

// ── View counting: app views only; the same viewer counts once per video in the repeat window ──
await test("View counting — app views only, one per viewer every 4 hours, admin-controlled", async () => {
  const vid = hiVideo.contentId;
  const views = async () => (await db.video.findUnique({ where: { contentId: vid } })).views;
  const before = await views();
  const web = await call("POST", `/social/view/${vid}`, { ip: "10.123.0.1", ua: BROWSER_UA, body: { watchSeconds: 30 } });
  check(web.data.reason === "WEB_VIEW_NOT_COUNTED", `website view: ${web.data.reason}`);
  const first = await call("POST", `/social/view/${vid}`, { ip: "10.123.0.2", body: { watchSeconds: 30 } });
  const again = await call("POST", `/social/view/${vid}`, { ip: "10.123.0.2", body: { watchSeconds: 30 } });
  check(first.data.qualified === true, `first app view: ${first.data.reason}`);
  check(again.data.reason === "REPEAT_VIEW_WITHIN_WINDOW", `repeat view: ${again.data.reason}`);
  check((await views()) === before + 1, `view count moved by ${(await views()) - before} (expected 1)`);
  const bad = await call("POST", "/admin/platform", { token: admin, body: { viewCounting: { appOnly: true, repeatWindowHours: 0 } } });
  check(bad.status === 400, "a 0-hour window must be refused");
  const open = await call("POST", "/admin/platform", { token: admin, body: { viewCounting: { appOnly: false, repeatWindowHours: 4 } } });
  check(open.status === 200, `save: ${open.data.error}`);
  const web2 = await call("POST", `/social/view/${vid}`, { ip: "10.123.0.3", ua: BROWSER_UA, body: { watchSeconds: 30 } });
  check(web2.data.qualified === true, `website view with app-only off: ${web2.data.reason}`);
  await call("POST", "/admin/platform", { token: admin, body: { viewCounting: { appOnly: true, repeatWindowHours: 4 } } });
  const got = (await call("GET", "/admin/platform", { token: admin })).data.settings.viewCounting;
  check(got.appOnly === true && got.repeatWindowHours === 4, `settings now ${JSON.stringify(got)}`);
  return "web view ignored, first app view counted, replay within 4 h ignored; admin can switch website views on/off";
});

// ── Creator application: email code → full application with ID → admin views the ID → approve ──
await test("Creator application — email code, ID check, rules, admin review", async () => {
  const email = `e2e.creator.${Date.now()}@example.com`;
  const send = await call("POST", "/auth/email-otp", { body: { email } });
  check(send.status === 200, `send code: ${send.status} ${send.data.error}`);
  const again = await call("POST", "/auth/email-otp", { body: { email } });
  check(again.status === 429, "a second code within 60 s must be refused");
  const log = await db.mailLog.findFirst({ where: { toEmail: email }, orderBy: { createdAt: "desc" } });
  const code = (log.body.match(/\b(\d{6})\b/) || [])[1];
  check(code, "dev mail log should hold the code when no mail server is configured");
  const bad = await call("POST", "/auth/email-otp/verify", { body: { email, code: code === "000000" ? "111111" : "000000" } });
  check(bad.status === 400, "wrong code must fail");
  const ok = await call("POST", "/auth/email-otp/verify", { body: { email, code } });
  check(ok.data.emailToken, `verify: ${ok.data.error}`);
  const rules = (await call("GET", "/public/creator-application")).data;
  const img = new Blob([readFileSync(path.join(CLIPS, "tina.jpg"))], { type: "image/jpeg" });
  const form = (over = {}) => {
    const fd = new FormData();
    const fields = { legalName: "Asha Rao", email, emailToken: ok.data.emailToken, mobile: "+91 98765 43210", password: "Creator@123", country: "India", city: "Pune", postalCode: "411001",
      channelName: `E2E Toons ${Date.now() % 100000}`, username: `etoons${Date.now() % 100000}`, category: "Cartoons & Animation", description: "e2e", languages: JSON.stringify(["hi"]),
      existingCreator: "true", instagramUrl: "instagram.com/e2etoons", youtubeUrl: "", documentType: "AADHAAR", documentLast4: "1234", ...over };
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    for (const a of rules.agreements) fd.append(`agree_${a.id}`, over[`agree_${a.id}`] ?? "true");
    fd.append("avatar", img, "me.jpg"); fd.append("document", over.noDoc ? new Blob(["nope"], { type: "application/pdf" }) : img, "id.jpg");
    return fd;
  };
  check((await call("POST", "/auth/register", { form: form({ username: "ab_1" }) })).status === 400, "bad username accepted");
  check((await call("POST", "/auth/register", { form: form({ postalCode: "4110" }) })).status === 400, "bad PIN accepted");
  check((await call("POST", "/auth/register", { form: form({ agree_strikes: "false" }) })).status === 400, "missing rule accepted");
  check(rules.agreements.some(a => a.id === "kids") && (await call("POST", "/auth/register", { form: form({ agree_kids: "false" }) })).status === 400, "kids-only rule missing or not required");
  check((await call("POST", "/auth/register", { form: form({ noDoc: true }) })).status === 400, "non-image/PDF document accepted");
  const reg = await call("POST", "/auth/register", { form: form() });
  check(reg.status === 201 && reg.data.user.status === "PENDING", `register: ${reg.status} ${reg.data.error}`);
  check((await call("POST", "/auth/register", { form: form({ username: `other${Date.now() % 100000}` }) })).status === 401, "email token reused");
  const u = await db.user.findUnique({ where: { email }, include: { verification: true } });
  check(u.legalName === "Asha Rao" && u.emailVerified && u.verification?.status === "PENDING" && !u.verification.fileName.includes("public"), "stored application looks wrong");
  const docRes = await fetch(`${BASE}/api/admin/creators/${u.id}/document`, { headers: { authorization: `Bearer ${admin}`, "user-agent": UA } });
  check(docRes.status === 200 && docRes.headers.get("content-type") === "image/jpeg", `admin document view: ${docRes.status}`);
  const anon = await fetch(`${BASE}/api/admin/creators/${u.id}/document`);
  check(anon.status === 403, "document readable without admin login");
  const ap = await call("POST", `/admin/creators/${u.id}/action`, { token: admin, body: { action: "approve" } });
  check(ap.status === 200, `approve: ${ap.data.error}`);
  const v = await db.creatorVerification.findUnique({ where: { userId: u.id } });
  const viewed = await db.auditLog.count({ where: { action: "KYC_DOCUMENT_VIEWED", targetId: email } });
  check(v.status === "VERIFIED" && viewed >= 1, `ID status ${v.status}, views logged ${viewed}`);
  return `code by email, 5 bad submissions refused (incl. the kids-only rule), applied as PENDING, ID viewed by admin (logged) and verified on approval`;
});

// ── Strikes: 3 upheld complaints suspend the channel ──
await test("Strikes — 3 upheld complaints suspend the channel", async () => {
  const u = await db.user.findFirst({ where: { email: { startsWith: "e2e.creator." } }, orderBy: { createdAt: "desc" } });
  for (let i = 1; i <= 3; i++) {
    const r = await call("POST", `/admin/creators/${u.id}/action`, { token: admin, body: { action: "add-strike", reason: `E2E upheld complaint ${i}` } });
    check(r.status === 200, `strike ${i}: ${r.data.error}`);
  }
  const after = await db.user.findUnique({ where: { id: u.id } });
  check(after.status === "SUSPENDED", `status ${after.status}`);
  const notes = await db.notification.count({ where: { userId: u.id, type: "WARNING" } });
  return `suspended automatically after 3 strikes; creator got ${notes} warnings`;
});

// ── Monetization unlock: no earnings until the channel first reaches the views target; then for good ──
await test("Monetization unlock — earning starts at the views target and stays on", async () => {
  const aaravUser = await db.user.findUnique({ where: { email: "aarav@mykuchupuchu.com" } });
  // start from a locked channel (demo creators were unlocked by the migration because they had earned before)
  check((await call("POST", `/admin/creators/${aaravUser.id}/action`, { token: admin, body: { action: "lock-monetization" } })).status === 200, "admin lock failed");
  const invalid = ["BOT_USER_AGENT", "CREATOR_SELF_VIEW", "DUPLICATE_VIEWER_DAILY_CAP", "INSUFFICIENT_WATCH_TIME", "VIDEO_NOT_APPROVED"];
  const views30 = await db.viewEvent.count({ where: { video: { creatorId: aaravUser.id }, isSelf: false, createdAt: { gte: new Date(Date.now() - 30 * 864e5) }, OR: [{ reason: null }, { reason: { notIn: invalid } }] } });
  await db.monetizationSetting.updateMany({ data: { minMonthlyChannelViews: views30 + 3 } });
  const vid = await db.video.findUnique({ where: { contentId: misVideo } });
  check((await approve(misVideo)).status === 200, "approve failed");
  const reward = await db.ledgerEntry.count({ where: { type: "UPLOAD_REWARD", videoId: vid.id } });
  check(reward === 0, "upload reward paid below the threshold");
  const reasons = [];
  for (let i = 0; i < 3; i++) {
    const r = await call("POST", `/social/view/${misVideo}`, { ip: `10.99.1.${i + 1}`, body: { watchSeconds: 30 } });
    reasons.push(r.data.qualified ? "qualified" : r.data.reason);
  }
  check(reasons.every(x => x === "CHANNEL_BELOW_VIEW_THRESHOLD"), `below-threshold views: ${reasons.join(",")}`);
  await new Promise(r => setTimeout(r, 61_000)); // the 30-day count is cached for 60 s
  const r4 = await call("POST", `/social/view/${misVideo}`, { ip: "10.99.1.9", body: { watchSeconds: 30 } });
  check(r4.data.qualified === true, `after reaching the target: ${r4.data.reason}`);
  const unlocked = await db.user.findUnique({ where: { id: aaravUser.id }, select: { monetizationUnlockedAt: true } });
  const told = await db.notification.count({ where: { userId: aaravUser.id, title: { contains: "Monetization unlocked" } } });
  check(unlocked.monetizationUnlockedAt && told >= 1, `unlock recorded=${!!unlocked.monetizationUnlockedAt}, notified=${told}`);
  // one-time: raising the target afterwards doesn't lock the channel again
  await db.monetizationSetting.updateMany({ data: { minMonthlyChannelViews: 1_000_000 } });
  const r5 = await call("POST", `/social/view/${misVideo}`, { ip: "10.99.1.10", body: { watchSeconds: 30 } });
  check(r5.data.qualified === true, `after unlock with a higher target: ${r5.data.reason}`);
  return `3 views below ${views30 + 3} earned nothing and no upload reward; at the target earning unlocked (creator notified) and stayed on after the target was raised`;
});

// ── Account deletion (Google Play rule): parents are deleted completely, creators anonymised ──
await test("Account deletion — parent deleted completely, creator anonymised with records kept", async () => {
  // parent with a follow, a like and a saved video
  const email = `e2e.delete.${Date.now()}@example.com`;
  const fd = new FormData();
  for (const [k, v] of Object.entries({ accountType: "VIEWER", parentConfirm: "true", fullName: "E2E Delete Me", email, password: "Viewer@1234" })) fd.append(k, v);
  const reg = await call("POST", "/auth/register", { form: fd });
  check(reg.status === 201, `register ${reg.status} ${reg.data.error}`);
  const tok = reg.data.token;
  const meeraCh = await db.channel.findFirst({ where: { user: { email: "meera@mykuchupuchu.com" } } });
  await call("POST", `/social/follow/${meeraCh.id}`, { token: tok, body: { channelId: meeraCh.id } });
  await call("POST", `/social/like/${hiVideo.contentId}`, { token: tok });
  await call("POST", `/social/save/${hiVideo.contentId}`, { token: tok, body: { saved: true } });
  const followersBefore = (await db.channel.findUnique({ where: { id: meeraCh.id } })).followerCount;
  check((await call("POST", "/me/delete-account", { token: tok, body: { password: "wrong-pass", confirm: "DELETE" } })).status === 403, "wrong password accepted");
  check((await call("POST", "/me/delete-account", { token: tok, body: { password: "Viewer@1234", confirm: "yes" } })).status === 400, "missing DELETE confirmation accepted");
  const del = await call("POST", "/me/delete-account", { token: tok, body: { password: "Viewer@1234", confirm: "DELETE" } });
  check(del.status === 200 && del.data.kind === "deleted", `delete: ${del.status} ${del.data.error}`);
  const gone = await db.user.findUnique({ where: { email } });
  const followersAfter = (await db.channel.findUnique({ where: { id: meeraCh.id } })).followerCount;
  const after = await call("GET", "/me/profile", { token: tok });
  check(!gone && followersAfter === followersBefore - 1 && after.status === 401, `user row ${!!gone}, followers ${followersBefore}→${followersAfter}, session ${after.status}`);

  // creator: blocked while a withdrawal is open, then anonymised; ledger rows stay
  const ar = await db.user.findUnique({ where: { email: "aarav@mykuchupuchu.com" } });
  const ledgerBefore = await db.ledgerEntry.count({ where: { userId: ar.id } });
  const pending = await db.withdrawal.create({ data: { userId: ar.id, amount: 1, method: "BANK_TRANSFER", details: "{}", status: "REQUESTED" } }).catch(() => null);
  if (pending) {
    const blocked = await call("POST", "/me/delete-account", { token: aarav, body: { password: "Creator@123", confirm: "DELETE" } });
    check(blocked.status === 409, `open withdrawal should block deletion: ${blocked.status}`);
    await db.withdrawal.delete({ where: { id: pending.id } });
  }
  await db.withdrawal.updateMany({ where: { userId: ar.id, status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING"] } }, data: { status: "PAID" } });
  const cdel = await call("POST", "/me/delete-account", { token: aarav, body: { password: "Creator@123", confirm: "DELETE" } });
  check(cdel.status === 200 && cdel.data.kind === "anonymised", `creator delete: ${cdel.status} ${cdel.data.error}`);
  const anon = await db.user.findUnique({ where: { id: ar.id }, include: { channel: true, verification: true } });
  const live = await db.video.count({ where: { creatorId: ar.id, status: { not: "REMOVED" } } });
  const ledgerAfter = await db.ledgerEntry.count({ where: { userId: ar.id } });
  check(anon.email.endsWith("@deleted.invalid") && anon.status === "SUSPENDED" && !anon.phone && !anon.verification && anon.channel.name === "Deleted channel" && live === 0, "creator not anonymised");
  check(ledgerAfter === ledgerBefore, `ledger rows ${ledgerBefore} → ${ledgerAfter}`);
  const relog = await call("POST", "/auth/login", { body: { email: "aarav@mykuchupuchu.com", password: "Creator@123" } });
  check(relog.status !== 200, "deleted creator can still log in");
  return `parent row deleted (follower count ${followersBefore}→${followersAfter}); creator anonymised, ${ledgerAfter} ledger rows kept${pending ? ", open withdrawal blocked it first" : ""}`;
});

await db.monetizationSetting.updateMany({ data: { minMonthlyChannelViews: originalThreshold } });

// ── cleanup of admin-created test taxonomy ──
const testCat = await db.category.findFirst({ where: { name: "E2E Shadow Puppets" } });
if (testCat) await call("POST", `/admin/discovery/categories/${testCat.id}/retire`, { token: admin });

await db.$disconnect();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
