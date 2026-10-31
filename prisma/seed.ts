/**
 * Clipora seed — realistic demo data, clearly separated from production data.
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import { visualHash, audioHash, sha256Buffer } from "../src/lib/fingerprint";
import fs from "fs";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, Math.floor(Math.random() * 50), 0, 0);
  return d;
};
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("🌱 Seeding Clipora…");

  // ── wipe ──
  await db.$transaction([
    db.appeal.deleteMany(), db.contentReport.deleteMany(), db.comment.deleteMany(),
    db.videoLike.deleteMany(), db.viewEvent.deleteMany(), db.ledgerEntry.deleteMany(),
    db.withdrawal.deleteMany(), db.fraudFlag.deleteMany(), db.auditLog.deleteMany(),
    db.notification.deleteMany(), db.mailLog.deleteMany(), db.follow.deleteMany(),
    db.video.deleteMany(), db.channel.deleteMany(), db.session.deleteMany(),
    db.user.deleteMany(), db.category.deleteMany(), db.platformSetting.deleteMany(),
    db.monetizationSetting.deleteMany(), db.uploadRule.deleteMany(),
    db.newsletterSubscriber.deleteMany(), db.contactMessage.deleteMany(),
  ]);

  // ── settings ──
  await db.monetizationSetting.create({ data: {} }); // defaults: $1/1000, $0.50/upload, 4 months, $25 min, 7d hold
  await db.uploadRule.create({ data: {} }); // 40-60s, 2/day, 4/week, mp4/mov
  await db.platformSetting.createMany({
    data: [
      {
        key: "branding",
        value: JSON.stringify({
          name: "Clipora", tagline: "Create. Share. Earn.",
          supportEmail: "support@clipora.io", domain: "clipora.io",
        }),
      },
      {
        key: "payouts",
        value: JSON.stringify({
          methods: [
            { id: "BANK_TRANSFER", name: "Bank Transfer (ACH / SEPA)", regions: "US, EU, UK" },
            { id: "PAYPAL", name: "PayPal", regions: "Worldwide" },
          ],
          processingDays: "3–5 business days",
        }),
      },
      {
        key: "homepage",
        value: JSON.stringify({
          heroTitle: "Create Videos. Get Views. Earn Real Money.",
          heroSubtitle:
            "Clipora pays creators for every qualified view and every approved original upload. No follower minimums — just original content.",
          announcement: "🎉 New: PayPal payouts are now available worldwide",
        }),
      },
      {
        key: "demo",
        value: JSON.stringify({
          notice: "Demo environment — all creators, videos and earnings are sample data for demonstration.",
        }),
      },
    ],
  });

  // ── categories ──
  const cats = [
    ["Entertainment", "entertainment", "Film"], ["Comedy", "comedy", "Laugh"],
    ["Lifestyle", "lifestyle", "Coffee"], ["Education", "education", "GraduationCap"],
    ["Food", "food", "UtensilsCrossed"], ["Travel", "travel", "Plane"],
    ["Technology", "technology", "Cpu"], ["Fitness", "fitness", "Dumbbell"],
    ["Beauty", "beauty", "Flower2"], ["Music", "music", "Music"],
    ["Pets", "pets", "PawPrint"], ["Fashion", "fashion", "Shirt"],
    ["Gaming", "gaming", "Gamepad2"], ["Art", "art", "Palette"],
    ["Nature", "nature", "Mountain"], ["Dance", "dance", "PartyPopper"],
  ] as const;
  for (const [name, slug, icon] of cats) {
    await db.category.create({
      data: { name, slug, icon, description: `Original ${name.toLowerCase()} shorts from verified creators.` },
    });
  }

  // ── admins ──
  const admin = await db.user.create({
    data: {
      email: "admin@clipora.io", name: "Ava Sterling", passwordHash: hashPassword("Admin@123"),
      role: "ADMIN", adminRole: "SUPER_ADMIN", status: "APPROVED", emailVerified: true,
      country: "United States", createdAt: daysAgo(300),
    },
  });
  await db.user.create({
    data: {
      email: "finance@clipora.io", name: "Felix Grant", passwordHash: hashPassword("Admin@123"),
      role: "ADMIN", adminRole: "FINANCE", status: "APPROVED", emailVerified: true, country: "United Kingdom",
    },
  });
  await db.user.create({
    data: {
      email: "moderator@clipora.io", name: "Mia Lopez", passwordHash: hashPassword("Admin@123"),
      role: "ADMIN", adminRole: "MODERATOR", status: "APPROVED", emailVerified: true, country: "Spain",
    },
  });

  // ── creators ──
  type CreatorSpec = {
    email: string; name: string; username: string; channel: string; category: string;
    country: string; avatar: string; desc: string; status?: string; followers: number;
    verified?: boolean; showEarnings?: boolean; approvedDaysAgo: number;
    social?: Record<string, string>;
  };
  const creatorSpecs: CreatorSpec[] = [
    { email: "maya@clipora.io", name: "Maya Torres", username: "mayacreates", channel: "Maya Creates", category: "Lifestyle", country: "United States", avatar: "/images/avatars/av01.webp", desc: "Slow living, morning routines and honest creator-life diaries. New shorts every week 🌤️", status: "APPROVED", followers: 148300, verified: true, showEarnings: true, approvedDaysAgo: 150, social: { instagram: "mayacreates", youtube: "MayaCreates", x: "mayacreates" } },
    { email: "leo@clipora.io", name: "Leo Carter", username: "leocarter", channel: "Leo Carter", category: "Travel", country: "Australia", avatar: "/images/avatars/av02.webp", desc: "One planet, 60-second stories. Currently: everywhere 🌏", status: "APPROVED", followers: 96700, verified: true, showEarnings: true, approvedDaysAgo: 132, social: { instagram: "leocarter" } },
    { email: "priya@clipora.io", name: "Priya Sharma", username: "priyacooks", channel: "Priya Cooks", category: "Food", country: "India", avatar: "/images/avatars/av03.webp", desc: "Street-food inspired recipes you can actually cook. 15-minute dinners, zero fuss 🌶️", status: "APPROVED", followers: 210900, verified: true, showEarnings: true, approvedDaysAgo: 141, social: { instagram: "priyacooks", youtube: "PriyaCooks" } },
    { email: "marcus@clipora.io", name: "Marcus Webb", username: "marcusgroove", channel: "Marcus Groove", category: "Dance", country: "United States", avatar: "/images/avatars/av04.webp", desc: "Choreographer. I turn city streets into stages 🕺", status: "APPROVED", followers: 187500, verified: true, showEarnings: true, approvedDaysAgo: 118 },
    { email: "sofia@clipora.io", name: "Sofia Chen", username: "sofiatech", channel: "Sofia Tech", category: "Technology", country: "Singapore", avatar: "/images/avatars/av05.webp", desc: "Honest tech reviews. No sponsors, just facts ⚡", status: "APPROVED", followers: 132200, verified: true, showEarnings: true, approvedDaysAgo: 110, social: { x: "sofiatech" } },
    { email: "jack@clipora.io", name: "Jack Miller", username: "jacklaughs", channel: "Jack Laughs", category: "Comedy", country: "Canada", avatar: "/images/avatars/av06.webp", desc: "Sketches about the absurdity of everyday life 😅", status: "APPROVED", followers: 78400, approvedDaysAgo: 96 },
    { email: "aisha@clipora.io", name: "Aisha Khan", username: "aishafit", channel: "Aisha Fit", category: "Fitness", country: "UAE", avatar: "/images/avatars/av07.webp", desc: "45-second workouts. Real coaching, real results 💪", status: "APPROVED", followers: 64800, showEarnings: true, approvedDaysAgo: 88 },
    { email: "daniel@clipora.io", name: "Daniel Okafor", username: "danielexplains", channel: "Daniel Explains", category: "Education", country: "Nigeria", avatar: "/images/avatars/av08.webp", desc: "Money, science and history — explained in 60 seconds 🧠", status: "APPROVED", followers: 118600, verified: true, showEarnings: true, approvedDaysAgo: 80 },
    { email: "chloe@clipora.io", name: "Chloe Laurent", username: "chloeglow", channel: "Chloe Glow", category: "Beauty", country: "France", avatar: "/images/avatars/av09.webp", desc: "Glass skin, clean beauty and honest product tests ✨", status: "APPROVED", followers: 156800, verified: true, showEarnings: true, approvedDaysAgo: 74 },
    { email: "ravi@clipora.io", name: "Ravi Mehta", username: "ravistrings", channel: "Ravi Strings", category: "Music", country: "India", avatar: "/images/avatars/av10.webp", desc: "Acoustic covers from rooftops and living rooms 🎸", status: "APPROVED", followers: 52300, approvedDaysAgo: 66 },
    { email: "emma@clipora.io", name: "Emma Wilson", username: "emmawags", channel: "Emma & Biscuit", category: "Pets", country: "United Kingdom", avatar: "/images/avatars/av11.webp", desc: "A golden retriever, a corgi and zero chill 🐶", status: "APPROVED", followers: 243100, verified: true, showEarnings: true, approvedDaysAgo: 58 },
    { email: "diego@clipora.io", name: "Diego Ramirez", username: "diegofits", channel: "Diego Fits", category: "Fashion", country: "Mexico", avatar: "/images/avatars/av12.webp", desc: "Capsule wardrobes and styling hacks 👟", status: "APPROVED", followers: 71900, approvedDaysAgo: 50 },
  ];
  const creators: Record<string, { id: string; username: string }> = {};
  for (const c of creatorSpecs) {
    const u = await db.user.create({
      data: {
        email: c.email, name: c.name, passwordHash: hashPassword("Creator@123"),
        role: "CREATOR", status: "APPROVED", emailVerified: true, country: c.country,
        avatarUrl: c.avatar, monetizationEligible: true,
        createdAt: daysAgo(c.approvedDaysAgo + 4),
        channel: {
          create: {
            name: c.channel, username: c.username, description: c.desc, avatarUrl: c.avatar,
            category: c.category, country: c.country, followerCount: c.followers,
            verified: !!c.verified, showEarnings: !!c.showEarnings,
            socialLinks: c.social ? JSON.stringify(c.social) : null,
          },
        },
      },
      include: { channel: true },
    });
    creators[c.username] = { id: u.id, username: c.username };
  }

  // pending + rejected + suspended examples
  await db.user.create({
    data: {
      email: "sam@clipora.io", name: "Sam Rivera", passwordHash: hashPassword("Creator@123"),
      role: "CREATOR", status: "PENDING", emailVerified: true, country: "United States",
      createdAt: daysAgo(2),
      channel: {
        create: {
          name: "Sam Builds", username: "sambuilds", description: "Weekend woodworking and DIY projects 🪵",
          category: "Education", country: "United States", avatarUrl: null,
        },
      },
    },
  });
  await db.user.create({
    data: {
      email: "kim@clipora.io", name: "Kim Park", passwordHash: hashPassword("Creator@123"),
      role: "CREATOR", status: "REJECTED", rejectionReason:
        "Channel name is too similar to an existing verified brand. Please choose a different channel name and re-apply.",
      emailVerified: true, country: "South Korea", createdAt: daysAgo(9),
      channel: { create: { name: "Sofia Tech Reviews", username: "sofiatechreviews", description: "Tech reviews", category: "Technology", country: "South Korea" } },
    },
  });
  const suspended = await db.user.create({
    data: {
      email: "trent@clipora.io", name: "Trent Cole", passwordHash: hashPassword("Creator@123"),
      role: "CREATOR", status: "SUSPENDED",
      suspensionReason: "Repeated community-guideline violations: spam comments on other creators' videos.",
      emailVerified: true, country: "United States", createdAt: daysAgo(60),
      channel: { create: { name: "Trent Clips", username: "trentclips", description: "Clips and reactions", category: "Entertainment", country: "United States" } },
    },
  });

  // ── videos ──
  type VideoSpec = {
    file: string; thumb: string; title: string; description: string; category: string;
    creator: string; hashtags: string[]; duration: number; publishedDaysAgo: number;
    views: number; qualRatio: number; likes: number; shares: number; featured?: boolean;
    status?: string;
  };
  const videoSpecs: VideoSpec[] = [
    { file: "v12.mp4", thumb: "th12.webp", title: "My 5AM Morning Routine (Realistic Version)", description: "No 4-hour rituals. Just the 45 seconds that actually changed my mornings.", category: "Lifestyle", creator: "mayacreates", hashtags: ["morningroutine", "slowliving", "5am"], duration: 48, publishedDaysAgo: 62, views: 512400, qualRatio: 0.82, likes: 48200, shares: 3120, featured: true },
    { file: "v14.mp4", thumb: "th14.webp", title: "Painting With My Left Hand for 60 Seconds", description: "I broke my right wrist, so obviously I made art with my left. Day 12.", category: "Art", creator: "mayacreates", hashtags: ["art", "challenge", "lefthanded"], duration: 42, publishedDaysAgo: 21, views: 1241500, qualRatio: 0.84, likes: 198600, shares: 12800, featured: true },
    { file: "v02.mp4", thumb: "th02.webp", title: "This Beach in Bali Looks Unreal", description: "No filter needed. Location in comments 📍", category: "Travel", creator: "mayacreates", hashtags: ["bali", "travel", "beach"], duration: 52, publishedDaysAgo: 8, views: 187300, qualRatio: 0.79, likes: 22400, shares: 2980 },
    { file: "v01.mp4", thumb: "th01.webp", title: "15-Minute Street Tacos That Actually Slap", description: "Corn tortillas, quick-pickled onions, and a 3-ingredient salsa. Full recipe on my channel.", category: "Food", creator: "priyacooks", hashtags: ["tacos", "streetfood", "recipe"], duration: 47, publishedDaysAgo: 55, views: 341800, qualRatio: 0.81, likes: 41700, shares: 5640, featured: true },
    { file: "v16.mp4", thumb: "th16.webp", title: "Plating Pasta Like a Michelin Chef", description: "Twirl, height, sauce circle. That's the whole secret.", category: "Food", creator: "priyacooks", hashtags: ["pasta", "plating", "foodart"], duration: 44, publishedDaysAgo: 18, views: 128900, qualRatio: 0.77, likes: 15300, shares: 1410 },
    { file: "v13.mp4", thumb: "th13.webp", title: "Sunrise at the Alpine Lake Nobody Talks About", description: "Woke up at 3AM for this. Worth it.", category: "Nature", creator: "leocarter", hashtags: ["sunrise", "hiking", "alps"], duration: 41, publishedDaysAgo: 12, views: 214600, qualRatio: 0.8, likes: 28900, shares: 4120, featured: true },
    { file: "v03.mp4", thumb: "th03.webp", title: "Sunset Freestyle in Downtown LA", description: "One take. One golden hour. Full choreo on my channel.", category: "Dance", creator: "marcusgroove", hashtags: ["dance", "freestyle", "sunset"], duration: 49, publishedDaysAgo: 30, views: 892400, qualRatio: 0.83, likes: 112300, shares: 9840 },
    { file: "v04.mp4", thumb: "th04.webp", title: "The $29 Earbuds That Beat $200 Ones", description: "I bought them expecting garbage. I was wrong. Full breakdown.", category: "Technology", creator: "sofiatech", hashtags: ["tech", "earbuds", "review"], duration: 51, publishedDaysAgo: 26, views: 458200, qualRatio: 0.78, likes: 51200, shares: 6210 },
    { file: "v15.mp4", thumb: "th15.webp", title: "My 2026 Desk Setup Tour", description: "Cable management finally done. Parts list in comments.", category: "Gaming", creator: "sofiatech", hashtags: ["setup", "desksetup", "rgb"], duration: 48, publishedDaysAgo: 6, views: 76300, qualRatio: 0.74, likes: 8900, shares: 760 },
    { file: "v05.mp4", thumb: "th05.webp", title: "Full-Body Burn in 45 Seconds", description: "No equipment. Do it with me — right now.", category: "Fitness", creator: "aishafit", hashtags: ["workout", "fitness", "homeworkout"], duration: 45, publishedDaysAgo: 15, views: 198700, qualRatio: 0.76, likes: 24100, shares: 3880 },
    { file: "v06.mp4", thumb: "th06.webp", title: "5-Minute Glass Skin Routine", description: "Four products. That's it. Links in bio.", category: "Beauty", creator: "chloeglow", hashtags: ["glassskin", "skincare", "beauty"], duration: 43, publishedDaysAgo: 11, views: 389500, qualRatio: 0.79, likes: 56700, shares: 7230 },
    { file: "v07.mp4", thumb: "th07.webp", title: "Why Compounding Is the 8th Wonder", description: "Einstein allegedly said it. Here's the 60-second proof.", category: "Education", creator: "danielexplains", hashtags: ["money", "investing", "compounding"], duration: 46, publishedDaysAgo: 150, views: 267800, qualRatio: 0.75, likes: 31400, shares: 5210 },
    { file: "v08.mp4", thumb: "th08.webp", title: "My Corgi Reviews Sunglasses", description: "He has opinions. Strong ones.", category: "Pets", creator: "emmawags", hashtags: ["corgi", "dogs", "pets"], duration: 40, publishedDaysAgo: 4, views: 612300, qualRatio: 0.85, likes: 98700, shares: 12400, featured: true },
    { file: "v09.mp4", thumb: "th09.webp", title: "3 Outfits, 1 Sneaker", description: "Capsule styling: one white sneaker, three fits.", category: "Fashion", creator: "diegofits", hashtags: ["fashion", "styling", "sneakers"], duration: 50, publishedDaysAgo: 9, views: 84600, qualRatio: 0.72, likes: 9800, shares: 1120 },
    { file: "v10.mp4", thumb: "th10.webp", title: "Rooftop Acoustic Session — Golden Hour", description: "Recorded in one take on a Lisbon rooftop.", category: "Music", creator: "ravistrings", hashtags: ["acoustic", "livemusic", "rooftop"], duration: 57, publishedDaysAgo: 20, views: 132400, qualRatio: 0.81, likes: 18600, shares: 2440 },
    { file: "v11.mp4", thumb: "th11.webp", title: "When the Group Chat Goes Quiet", description: "Tag the friend who does this.", category: "Comedy", creator: "jacklaughs", hashtags: ["comedy", "relatable", "groupchat"], duration: 42, publishedDaysAgo: 7, views: 421800, qualRatio: 0.8, likes: 71200, shares: 15600 },
  ];

  const monetization = await db.monetizationSetting.findFirst();
  const holdingDays = monetization?.holdingPeriodDays ?? 7;

  const created: { id: string; contentId: string; spec: VideoSpec; creatorId: string }[] = [];
  let seq = 0;
  for (const spec of videoSpecs) {
    seq++;
    const contentId = `VID-2026-${String(seq).padStart(6, "0")}`;
    const path = `/home/z/my-project/public/videos/${spec.file}`;
    let sha = "", vh = "", ah = "", sizeMB = 0;
    try {
      const buf = fs.readFileSync(path);
      sha = sha256Buffer(buf);
      sizeMB = Math.round((buf.length / 1024 / 1024) * 10) / 10;
      vh = await visualHash(path, spec.duration);
      ah = await audioHash(path, spec.duration);
    } catch (e) {
      console.warn("fingerprint failed for", spec.file, e);
    }
    const publishedAt = daysAgo(spec.publishedDaysAgo, rand(8, 20));
    const expires = new Date(publishedAt);
    expires.setMonth(expires.getMonth() + (monetization?.monetizationDurationMonths ?? 4));
    const v = await db.video.create({
      data: {
        contentId, creatorId: creators[spec.creator].id,
        title: spec.title, description: spec.description, category: spec.category,
        hashtags: JSON.stringify(spec.hashtags), videoUrl: `/videos/${spec.file}`,
        thumbnailUrl: `/images/thumbs/${spec.thumb}`, duration: spec.duration,
        fileSizeMB: sizeMB, resolution: "720x1280", format: "mp4",
        status: "APPROVED", sha256: sha, visualHash: vh, audioHash: ah,
        uploadRewardCredited: true, monetizationEnabled: true,
        earningExpiresAt: expires, publishedAt,
        views: spec.views, qualifiedViews: Math.floor(spec.views * spec.qualRatio),
        likes: spec.likes, shares: spec.shares, featured: !!spec.featured,
        createdAt: publishedAt,
      },
    });
    created.push({ id: v.id, contentId, spec, creatorId: creators[spec.creator].id });
    console.log(`video ${contentId} — ${spec.title} (vh:${vh})`);
  }

  // near-duplicate upload (re-encode of v01) → duplicate-detection queue
  {
    seq++;
    const contentId = `VID-2026-${String(seq).padStart(6, "0")}`;
    const path = "/home/z/my-project/public/videos/v01_dup.mp4";
    const buf = fs.readFileSync(path);
    const vh = await visualHash(path, 47);
    const ah = await audioHash(path, 47);
    const original = created.find(c => c.spec.file === "v01.mp4")!;
    const publishedAt = daysAgo(2, 14);
    await db.video.create({
      data: {
        contentId, creatorId: creators["jacklaughs"].id,
        title: "15-Minute Street Tacos Tutorial (HD Re-Upload)",
        description: "Re-uploading in higher quality!",
        category: "Food", hashtags: JSON.stringify(["tacos", "streetfood"]),
        videoUrl: "/videos/v01_dup.mp4", thumbnailUrl: "/images/thumbs/th01.webp",
        duration: 47, fileSizeMB: Math.round((buf.length / 1024 / 1024) * 10) / 10,
        resolution: "720x1280", format: "mp4",
        status: "FLAGGED_DUPLICATE", sha256: sha256Buffer(buf), visualHash: vh, audioHash: ah,
        duplicateOfId: original.contentId, similarityScore: 0.97, duplicateStatus: "PENDING_REVIEW",
        uploadRewardCredited: false, monetizationEnabled: false,
        earningExpiresAt: new Date(publishedAt.getTime() + 4 * 30 * 864e5),
        publishedAt, views: 1240, qualifiedViews: 0, likes: 89, shares: 4, createdAt: publishedAt,
      },
    });
    await db.fraudFlag.create({
      data: {
        userId: creators["jacklaughs"].id, videoId: contentId, type: "DUPLICATE_CONTENT",
        severity: "HIGH",
        details: `VID-2026-000017 matches VID-2026-000004 (Priya Cooks) with 97% visual similarity and 99% audio similarity. Upload reward withheld pending review.`,
      },
    });
    await db.notification.create({
      data: {
        userId: creators["jacklaughs"].id, type: "DUPLICATE",
        title: "Duplicate content detected",
        body: `Your upload ${contentId} was flagged: 97% similar to an existing video. Upload rewards are on hold until review. You can submit an appeal from My Videos.`,
        link: "#/dashboard/videos",
      },
    });
  }

  // ── comments ──
  const commenters = [
    ["Layla H.", "This is the content I signed up for 🔥"], ["Tomás R.", "Watched this 4 times already"],
    ["Jenny W.", "How is this only 60 seconds, I need a whole series"], ["Ahmed K.", "Saving this immediately"],
    ["Rosa M.", "The editing on this is so clean 👏"], ["Kevin P.", "Came for the tips, stayed for the vibes"],
    ["Ines F.", "Okay this deserves way more views"], ["Dara S.", "Clipora algorithm finally showing me good stuff"],
  ];
  for (const v of created) {
    const n = rand(3, 6);
    for (let i = 0; i < n; i++) {
      const [name, body] = pick(commenters);
      await db.comment.create({
        data: {
          videoId: v.id, authorName: name, body,
          createdAt: daysAgo(rand(0, Math.min(v.spec.publishedDaysAgo, 25)), rand(0, 23)),
        },
      });
    }
    await db.video.update({ where: { id: v.id }, data: { commentsCount: n } });
  }

  // ── follows (maya follows a few channels) ──
  for (const uname of ["priyacooks", "danielexplains", "emmawags", "sofiatech"]) {
    await db.follow.create({
      data: { followerId: creators["mayacreates"].id, channelId: (await db.channel.findUnique({ where: { username: uname } }))!.id },
    });
  }

  // ── earnings ledger: daily aggregated qualified-view earnings + upload rewards ──
  const rate = 1.0;
  let ledgerCount = 0;
  for (const v of created) {
    const totalQual = Math.floor(v.spec.views * v.spec.qualRatio);
    const publishedDays = v.spec.publishedDaysAgo;
    const activeDays = Math.min(publishedDays, 90); // earn for up to ~3 months of history
    // decay curve: recent days stronger for newer videos
    const perDay: number[] = [];
    for (let d = activeDays; d >= 0; d--) {
      const age = publishedDays - d;
      const wave = Math.exp(-age / (publishedDays * 0.45)) + 0.15;
      perDay.push(wave);
    }
    const waveSum = perDay.reduce((a, b) => a + b, 0);
    for (let i = 0; i < perDay.length; i++) {
      const dayOffset = activeDays - i; // 0 = today
      const qualToday = Math.max(0, Math.round((perDay[i] / waveSum) * totalQual));
      if (qualToday <= 0) continue;
      const amount = (qualToday / 1000) * rate;
      const createdAt = daysAgo(dayOffset, 23);
      const availableAt = new Date(createdAt.getTime() + holdingDays * 864e5);
      await db.ledgerEntry.create({
        data: {
          userId: v.creatorId, videoId: v.id, type: "VIEW_EARNING",
          amount: Math.round(amount * 10000) / 10000,
          status: "PENDING", availableAt, rateSnapshot: rate,
          description: `${qualToday.toLocaleString()} qualified views on ${v.contentId}`,
          reference: `TXN-SEED-${v.contentId}-${dayOffset}`,
          createdAt,
        },
      });
      ledgerCount++;
    }
    // upload reward (credited after approval — 1 day after publish)
    const rewardAt = new Date(v.spec.publishedDaysAgo > 1 ? daysAgo(v.spec.publishedDaysAgo - 1, 11) : new Date());
    await db.ledgerEntry.create({
      data: {
        userId: v.creatorId, videoId: v.id, type: "UPLOAD_REWARD",
        amount: 0.5, status: "PENDING",
        availableAt: new Date(rewardAt.getTime() + holdingDays * 864e5),
        rateSnapshot: 0.5, description: `Approved original upload reward for ${v.contentId}`,
        reference: `TXN-SEED-REWARD-${v.contentId}`, createdAt: rewardAt,
      },
    });
    ledgerCount++;
  }
  console.log(`ledger entries: ${ledgerCount}`);

  // view events sample (recent, mixed qualified)
  const reasons = ["CREATOR_SELF_VIEW", "BOT_USER_AGENT", "INSUFFICIENT_WATCH_TIME", "DUPLICATE_VIEWER_DAILY_CAP"];
  for (const v of created.slice(0, 10)) {
    for (let i = 0; i < rand(2, 5); i++) {
      const qualified = Math.random() > 0.35;
      await db.viewEvent.create({
        data: {
          videoId: v.id,
          viewerKey: randomBytes(16).toString("hex"),
          isSelf: !qualified && Math.random() > 0.7,
          qualified,
          reason: qualified ? null : pick(reasons),
          watchSeconds: qualified ? rand(12, 58) : rand(0, 3),
          createdAt: daysAgo(rand(0, 3), rand(0, 23)),
        },
      });
    }
  }

  // ── withdrawals ──
  const maya = creators["mayacreates"].id;
  await db.withdrawal.create({
    data: {
      userId: maya, amount: 600, method: "BANK_TRANSFER",
      details: JSON.stringify({ accountName: "Maya Torres", maskedAccount: "•••• 4821", bank: "Chase" }),
      status: "PAID", paymentRef: "PAY-8K2NQX91", adminNote: "Paid via ACH batch #42",
      createdAt: daysAgo(35), updatedAt: daysAgo(32),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: maya, amount: 250, method: "PAYPAL",
      details: JSON.stringify({ accountName: "Maya Torres", maskedAccount: "maya•••@clipora.io" }),
      status: "PROCESSING", paymentRef: "PAY-3J7MDP24", adminNote: "PayPal payout submitted",
      createdAt: daysAgo(4), updatedAt: daysAgo(1),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: maya, amount: 150, method: "BANK_TRANSFER",
      details: JSON.stringify({ accountName: "Maya Torres", maskedAccount: "•••• 4821", bank: "Chase" }),
      status: "REQUESTED", createdAt: daysAgo(0, 9),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: creators["leocarter"].id, amount: 120, method: "PAYPAL",
      details: JSON.stringify({ accountName: "Leo Carter", maskedAccount: "leo•••@clipora.io" }),
      status: "PAID", paymentRef: "PAY-9Z4TQR58", createdAt: daysAgo(20), updatedAt: daysAgo(17),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: creators["priyacooks"].id, amount: 75, method: "BANK_TRANSFER",
      details: JSON.stringify({ accountName: "Priya Sharma", maskedAccount: "•••• 7710", bank: "HDFC" }),
      status: "UNDER_REVIEW", createdAt: daysAgo(2),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: creators["marcusgroove"].id, amount: 30, method: "PAYPAL",
      details: JSON.stringify({ accountName: "M. Webb", maskedAccount: "mw•••@clipora.io" }),
      status: "REJECTED", adminNote: "PayPal account name does not match your verified channel name. Please update payment details and re-request.",
      createdAt: daysAgo(12), updatedAt: daysAgo(11),
    },
  });

  // ── fraud flags ──
  const sofiaV = created.find(c => c.spec.file === "v04.mp4")!;
  const mayaV12 = created.find(c => c.spec.file === "v12.mp4")!;
  const mayaV14 = created.find(c => c.spec.file === "v14.mp4")!;
  await db.fraudFlag.create({
    data: {
      userId: sofiaV.creatorId, videoId: sofiaV.contentId, type: "VIEW_BOT", severity: "MEDIUM",
      details: "42 views from a known bot user-agent were excluded from qualified views in the last 24h.",
    },
  });
  await db.fraudFlag.create({
    data: {
      userId: mayaV12.creatorId, videoId: mayaV12.contentId, type: "RAPID_REFRESH", severity: "LOW",
      details: "One viewer generated 14 views in 10 minutes (daily cap is 3). Extra views were not credited.",
    },
  });
  await db.fraudFlag.create({
    data: {
      userId: mayaV14.creatorId, videoId: mayaV14.contentId, type: "SELF_VIEW", severity: "LOW",
      details: "23 self-views detected from the creator's own device. Self-views are never monetized.",
    },
  });
  await db.fraudFlag.create({
    data: {
      userId: suspended.id, videoId: null, type: "UNUSUAL_PATTERN", severity: "HIGH",
      details: "Engagement spike with 96% duplicate viewer keys within 2 hours of upload. Account suspended pending review.",
    },
  });

  // ── notifications for maya ──
  const mayaN = [
    ["APPLICATION_SUBMITTED", "Application received", "Your creator application is now pending review. We usually review within 2 business days.", daysAgo(154)],
    ["ACCOUNT_STATUS", "Welcome to Clipora, creator! 🎉", "Your channel Maya Creates has been approved. You can now upload videos and start earning.", daysAgo(150)],
    ["VIDEO_STATUS", "Video approved: My 5AM Morning Routine", "Your video passed originality checks and is now live and monetized.", daysAgo(61)],
    ["EARNING", "You earned $18.24 yesterday", "Earnings from qualified views were credited to your pending balance.", daysAgo(1)],
    ["EARNING", "Upload reward credited", "$0.50 was credited for your approved original upload VID-2026-000002.", daysAgo(20)],
    ["WITHDRAWAL", "Withdrawal paid ✅", "Your $600.00 withdrawal (PAY-8K2NQX91) has been paid to your bank account.", daysAgo(32)],
    ["WITHDRAWAL", "Withdrawal processing", "Your $250.00 PayPal withdrawal is being processed. Expect it within 3–5 business days.", daysAgo(1)],
    ["LIMIT", "Daily upload limit reached", "You've used 2 of 2 uploads today. Your upload allowance resets at midnight.", daysAgo(6)],
    ["MONETIZATION", "Monetization window reminder", "VID-2026-000001 stops generating view earnings on its 4-month anniversary. It stays public — it just stops earning.", daysAgo(3)],
    ["ANNOUNCEMENT", "PayPal payouts now worldwide 🌍", "You can now receive Clipora payouts via PayPal in every supported country.", daysAgo(9)],
  ] as const;
  for (const [type, title, body, at] of mayaN) {
    await db.notification.create({
      data: { userId: maya, type, title, body, read: at < daysAgo(5), createdAt: at },
    });
  }
  // notifications for others (approval etc.)
  for (const uname of Object.keys(creators).slice(1, 6)) {
    await db.notification.create({
      data: {
        userId: creators[uname].id, type: "ACCOUNT_STATUS",
        title: "Your channel has been approved 🎉",
        body: "Welcome to Clipora! You can now upload original videos and start earning.",
        createdAt: daysAgo(rand(10, 100)),
      },
    });
  }

  // ── mail log (simulated outbound emails) ──
  await db.mailLog.createMany({
    data: [
      { toEmail: "maya@clipora.io", subject: "Your Clipora creator account is approved", body: "Hi Maya, your channel Maya Creates has been approved. Start uploading to earn.", createdAt: daysAgo(150) },
      { toEmail: "maya@clipora.io", subject: "Withdrawal paid: $600.00", body: "Your withdrawal PAY-8K2NQX91 was paid to your bank account.", createdAt: daysAgo(32) },
      { toEmail: "kim@clipora.io", subject: "Your Clipora application was not approved", body: "Channel name is too similar to an existing verified brand. You may re-apply with a new channel name.", createdAt: daysAgo(8) },
      { toEmail: "sam@clipora.io", subject: "We received your application", body: "Thanks for applying to Clipora. Our team is reviewing your channel — usually within 2 business days.", createdAt: daysAgo(2) },
    ],
  });

  // ── audit logs ──
  await db.auditLog.createMany({
    data: [
      { actorId: admin.id, actorEmail: admin.email, action: "CREATOR_APPROVED", targetType: "CREATOR", targetId: creators["mayacreates"].username, details: "Approved after originality review", createdAt: daysAgo(150) },
      { actorId: admin.id, actorEmail: admin.email, action: "CREATOR_REJECTED", targetType: "CREATOR", targetId: "sofiatechreviews", details: "Channel name too similar to existing brand", createdAt: daysAgo(8) },
      { actorId: admin.id, actorEmail: admin.email, action: "VIDEO_APPROVED", targetType: "VIDEO", targetId: "VID-2026-000001", details: "Passed duplicate checks", createdAt: daysAgo(55) },
      { actorId: admin.id, actorEmail: admin.email, action: "WITHDRAWAL_PAID", targetType: "WITHDRAWAL", targetId: "PAY-8K2NQX91", details: "$600 ACH payout to Maya Torres", createdAt: daysAgo(32) },
      { actorId: admin.id, actorEmail: admin.email, action: "CREATOR_SUSPENDED", targetType: "CREATOR", targetId: "trentclips", details: "Spam comments — 3rd strike", createdAt: daysAgo(5) },
    ],
  });

  // ── content report ──
  const reported = created.find(c => c.spec.file === "v11.mp4")!;
  await db.contentReport.create({
    data: {
      videoId: reported.id, reporterKey: randomBytes(12).toString("hex"),
      reason: "COPYRIGHT", details: "Contains a 10-second clip from a licensed TV show.",
      status: "OPEN", createdAt: daysAgo(1),
    },
  });

  // ── contact + newsletter ──
  await db.contactMessage.createMany({
    data: [
      { name: "Omar Haddad", email: "omar@example.com", category: "PAYMENTS", subject: "PayPal not available in my country?", message: "Hi! I'd love to join but PayPal payouts aren't available in Morocco. Are bank transfers coming?", createdAt: daysAgo(3) },
      { name: "Greta Lind", email: "greta@example.com", category: "CREATOR_SUPPORT", subject: "Duplicate flag by mistake", message: "My video was flagged as duplicate but it's 100% my own footage. How do I appeal?", createdAt: daysAgo(1) },
    ],
  });
  await db.newsletterSubscriber.createMany({
    data: [
      { email: "creator.news@example.com" }, { email: "sam@example.com" }, { email: "hello@example.com" },
    ],
  });

  // ── summary ──
  const walletMaya = await db.ledgerEntry.aggregate({ _sum: { amount: true }, where: { userId: maya } });
  console.log("Maya lifetime earnings ≈ $", (walletMaya._sum.amount ?? 0).toFixed(2));
  console.log("✅ Seed complete:", {
    creators: await db.user.count({ where: { role: "CREATOR" } }),
    videos: await db.video.count(),
    ledger: await db.ledgerEntry.count(),
    withdrawals: await db.withdrawal.count(),
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
