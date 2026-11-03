/**
 * Kuchu Puchu seed — kids-content creator demo data, clearly separated from production data.
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import { visualHash, audioHash, sha256Buffer } from "../src/lib/fingerprint";
import fs from "fs";
import { seedDiscovery, applyKidsTaxonomy, backfillVideoTags } from "./seed-discovery.mjs";

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
  console.log("🌱 Seeding Kuchu Puchu…");

  // ── wipe ──
  await db.$transaction([
    // discovery tables first (they reference videos, users, categories)
    db.videoInteractionEvent.deleteMany(), db.videoFeedback.deleteMany(), db.savedVideo.deleteMany(),
    db.blockedCreator.deleteMany(), db.videoCategoryAssignment.deleteMany(), db.videoLanguage.deleteMany(),
    db.userLanguagePreference.deleteMany(), db.userCategoryPreference.deleteMany(),
    db.userSubcategoryPreference.deleteMany(), db.userRecommendationPreference.deleteMany(),
    db.channelCategoryPreference.deleteMany(), db.channelLanguage.deleteMany(),
    db.categoryTranslation.deleteMany(), db.subcategory.deleteMany(),
    db.recommendationConfig.deleteMany(), db.taxonomyAuditLog.deleteMany(), db.searchLog.deleteMany(),
    db.emailOtp.deleteMany(), db.creatorVerification.deleteMany(), db.channelStrike.deleteMany(),
    db.appeal.deleteMany(), db.contentReport.deleteMany(), db.comment.deleteMany(),
    db.videoLike.deleteMany(), db.viewEvent.deleteMany(), db.ledgerEntry.deleteMany(),
    db.withdrawal.deleteMany(), db.fraudFlag.deleteMany(), db.auditLog.deleteMany(),
    db.notification.deleteMany(), db.mailLog.deleteMany(), db.follow.deleteMany(),
    db.video.deleteMany(), db.channel.deleteMany(), db.session.deleteMany(),
    db.user.deleteMany(), db.category.deleteMany(), db.platformSetting.deleteMany(),
    db.monetizationSetting.deleteMany(), db.uploadRule.deleteMany(),
    db.newsletterSubscriber.deleteMany(), db.contactMessage.deleteMany(), db.language.deleteMany(),
  ]);

  // ── settings ──
  await db.monetizationSetting.create({ data: {} }); // defaults: $1/1000, $0.50/upload, 4 months, $25 min, 7d hold
  await db.uploadRule.create({ data: {} }); // 40-60s, 2/day, 4/week, mp4/mov
  await db.platformSetting.createMany({
    data: [
      {
        key: "branding",
        value: JSON.stringify({
          name: "Kuchu Puchu", tagline: "Create. Play. Earn.",
          supportEmail: "support@mykuchupuchu.com", domain: "mykuchupuchu.com",
        }),
      },
      {
        key: "payouts",
        value: JSON.stringify({
          methods: [
            { id: "BANK_TRANSFER", name: "Bank Transfer (ACH / SEPA / IMPS)", regions: "US, EU, UK, India" },
            { id: "PAYPAL", name: "PayPal", regions: "Worldwide" },
          ],
          processingDays: "3–5 business days",
        }),
      },
      {
        key: "homepage",
        value: JSON.stringify({
          heroTitle: "Create Kids Videos. Get Views. Earn Real Money.",
          heroSubtitle:
            "Kuchu Puchu pays kids-content creators for every qualified view and every approved original upload. Cartoons, rhymes, stories and fun — your creativity, fairly rewarded.",
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

  // ── categories (kids content) ──
  const cats = [
    ["Cartoons & Animation", "cartoons", "Clapperboard"],
    ["Nursery Rhymes", "rhymes", "Music"],
    ["Kids Comedy", "comedy", "Laugh"],
    ["Learning & Fun", "learning", "GraduationCap"],
    ["Story Time", "stories", "BookOpen"],
    ["Kids Songs", "songs", "Mic"],
    ["Toys & Play", "toys", "ToyBrick"],
    ["Animals & Friends", "animals", "PawPrint"],
    ["Arts & Crafts", "crafts", "Palette"],
    ["Dance & Fun", "dance", "PartyPopper"],
    ["Family Adventures", "family", "Baby"],
    ["Science for Kids", "science", "FlaskConical"],
  ] as const;
  for (const [name, slug, icon] of cats) {
    await db.category.create({
      data: { name, slug, icon, description: `Original ${name.toLowerCase()} shorts made for little viewers.` },
    });
  }

  // ── admins ──
  const admin = await db.user.create({
    data: {
      email: "admin@mykuchupuchu.com", name: "Ava Sterling", passwordHash: hashPassword("Admin@123"),
      role: "ADMIN", adminRole: "SUPER_ADMIN", status: "APPROVED", emailVerified: true,
      country: "United States", createdAt: daysAgo(300),
    },
  });
  await db.user.create({
    data: {
      email: "finance@mykuchupuchu.com", name: "Felix Grant", passwordHash: hashPassword("Admin@123"),
      role: "ADMIN", adminRole: "FINANCE", status: "APPROVED", emailVerified: true, country: "United Kingdom",
    },
  });
  await db.user.create({
    data: {
      email: "moderator@mykuchupuchu.com", name: "Mia Lopez", passwordHash: hashPassword("Admin@123"),
      role: "ADMIN", adminRole: "MODERATOR", status: "APPROVED", emailVerified: true, country: "Spain",
    },
  });

  // ── demo User (viewer) account for the mobile app ──
  await db.user.create({
    data: {
      email: "user@mykuchupuchu.com", name: "Kiara Demo", passwordHash: hashPassword("User@1234"),
      role: "VIEWER", status: "APPROVED", emailVerified: true, monetizationEligible: false,
    },
  });

  // ── creators (kids-content channels; theme: BLUE = boys' channels, PINK = girls' channels) ──
  type CreatorSpec = {
    email: string; name: string; username: string; channel: string; category: string;
    country: string; avatar: string; desc: string; status?: string; followers: number;
    verified?: boolean; showEarnings?: boolean; approvedDaysAgo: number;
    theme: "BLUE" | "PINK";
    social?: Record<string, string>;
  };
  const creatorSpecs: CreatorSpec[] = [
    { email: "meera@mykuchupuchu.com", name: "Meera Iyer", username: "meeraplaytime", channel: "Meera's Playtime", category: "Nursery Rhymes", country: "India", avatar: "/images/avatars/av02.webp", desc: "Sing-along nursery rhymes and playful songs for tiny humans 🎵 New rhyme every week!", status: "APPROVED", followers: 210900, verified: true, showEarnings: true, approvedDaysAgo: 150, theme: "PINK", social: { instagram: "meeraplaytime", youtube: "MeerasPlaytime", x: "meeraplaytime" } },
    { email: "aarav@mykuchupuchu.com", name: "Aarav Mehta", username: "aaravtoons", channel: "Aarav Toons", category: "Cartoons & Animation", country: "India", avatar: "/images/avatars/av01.webp", desc: "Hand-drawn cartoon adventures with big hearts. Meet Kuchu and friends! ✏️", status: "APPROVED", followers: 148300, verified: true, showEarnings: true, approvedDaysAgo: 132, theme: "BLUE", social: { instagram: "aaravtoons", youtube: "AaravToons" } },
    { email: "riya@mykuchupuchu.com", name: "Riya Sharma", username: "bunnybloom", channel: "Bunny Bloom Tales", category: "Story Time", country: "India", avatar: "/images/avatars/av04.webp", desc: "Gentle bedtime stories and tiny tales that end with a smile 🌙", status: "APPROVED", followers: 187500, verified: true, showEarnings: true, approvedDaysAgo: 141, theme: "PINK", social: { instagram: "bunnybloomtales" } },
    { email: "vikram@mykuchupuchu.com", name: "Vikram Singh", username: "lioncubsongs", channel: "Lion Cub Songs", category: "Kids Songs", country: "United Kingdom", avatar: "/images/avatars/av07.webp", desc: "Roar-some songs and sing-along classics with Leo the lion cub 🦁", status: "APPROVED", followers: 96700, verified: true, showEarnings: true, approvedDaysAgo: 118, theme: "BLUE", social: { youtube: "LionCubSongs" } },
    { email: "sara@mykuchupuchu.com", name: "Sara Khan", username: "kittycraftclub", channel: "Kitty Craft Club", category: "Arts & Crafts", country: "UAE", avatar: "/images/avatars/av06.webp", desc: "Easy crafts, rainbow paintings and glitter galore with Mimi the kitten 🎨", status: "APPROVED", followers: 132200, verified: true, showEarnings: true, approvedDaysAgo: 110, theme: "PINK", social: { x: "kittycraftclub" } },
    { email: "rohan@mykuchupuchu.com", name: "Rohan Kapoor", username: "pandapals", channel: "Panda Pals", category: "Kids Comedy", country: "Singapore", avatar: "/images/avatars/av05.webp", desc: "Silly panda giggles, pranks and funny faces for little laughers 😹", status: "APPROVED", followers: 78400, approvedDaysAgo: 96, theme: "BLUE" },
    { email: "karan@mykuchupuchu.com", name: "Karan Patel", username: "dinodayout", channel: "Dino Day Out", category: "Learning & Fun", country: "India", avatar: "/images/avatars/av09.webp", desc: "Counting, colors and dino-sized fun facts for curious kids 🦕", status: "APPROVED", followers: 64800, showEarnings: true, approvedDaysAgo: 88, theme: "BLUE" },
    { email: "ananya@mykuchupuchu.com", name: "Ananya Reddy", username: "teddyhugs", channel: "Teddy Hugs Club", category: "Toys & Play", country: "India", avatar: "/images/avatars/av08.webp", desc: "Toy stories, block towers and tea parties with Tedy the teddy bear 🧸", status: "APPROVED", followers: 118600, verified: true, showEarnings: true, approvedDaysAgo: 80, theme: "PINK" },
    { email: "pari@mykuchupuchu.com", name: "Pari Gupta", username: "parispenguin", channel: "Pari's Penguin Parade", category: "Nursery Rhymes", country: "Canada", avatar: "/images/avatars/av10.webp", desc: "Skating penguins, winter rhymes and sparkling sing-alongs ⛸️", status: "APPROVED", followers: 156800, verified: true, showEarnings: true, approvedDaysAgo: 74, theme: "PINK" },
    { email: "arjun@mykuchupuchu.com", name: "Arjun Nair", username: "monkeymischief", channel: "Monkey Mischief", category: "Family Adventures", country: "India", avatar: "/images/avatars/av11.webp", desc: "Family day-outs, playground adventures and cheeky monkey business 🐒", status: "APPROVED", followers: 52300, approvedDaysAgo: 66, theme: "BLUE" },
    { email: "ishita@mykuchupuchu.com", name: "Ishita Verma", username: "uniwhispers", channel: "Uni-Whispers", category: "Dance & Fun", country: "Australia", avatar: "/images/avatars/av12.webp", desc: "Dance-alongs, wiggle songs and magical unicorn moments 🦄", status: "APPROVED", followers: 243100, verified: true, showEarnings: true, approvedDaysAgo: 58, theme: "PINK" },
    { email: "kabir@mykuchupuchu.com", name: "Kabir Anand", username: "bububuddy", channel: "Bubu & Buddy", category: "Animals & Friends", country: "India", avatar: "/images/avatars/av03.webp", desc: "Ellie the baby elephant and her tiny best friend Mouse 🐘💞", status: "APPROVED", followers: 94700, verified: true, showEarnings: true, approvedDaysAgo: 50, theme: "BLUE", social: { youtube: "BubuAndBuddy" } },
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
            verified: !!c.verified, showEarnings: !!c.showEarnings, theme: c.theme,
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
      email: "samir@mykuchupuchu.com", name: "Samir Rao", passwordHash: hashPassword("Creator@123"),
      role: "CREATOR", status: "PENDING", emailVerified: true, country: "India",
      createdAt: daysAgo(2),
      channel: {
        create: {
          name: "Samir Rhymes", username: "samirrhymes", description: "Action-rhymes and clap-along songs for energetic toddlers 👏",
          category: "Nursery Rhymes", country: "India", avatarUrl: null, theme: "BLUE",
        },
      },
    },
  });
  await db.user.create({
    data: {
      email: "kim@mykuchupuchu.com", name: "Kim Park", passwordHash: hashPassword("Creator@123"),
      role: "CREATOR", status: "REJECTED", rejectionReason:
        "Channel name is too similar to the Kuchu Puchu brand. Please choose a different channel name and re-apply.",
      emailVerified: true, country: "South Korea", createdAt: daysAgo(9),
      channel: { create: { name: "Kuchu Cartoon TV", username: "kuchucartoontv", description: "Cartoon clips", category: "Cartoons & Animation", country: "South Korea", theme: "PINK" } },
    },
  });
  const suspended = await db.user.create({
    data: {
      email: "tara@mykuchupuchu.com", name: "Tara Bakshi", passwordHash: hashPassword("Creator@123"),
      role: "CREATOR", status: "SUSPENDED",
      suspensionReason: "Repeated community-guideline violations: spam comments on other creators' videos.",
      emailVerified: true, country: "India", createdAt: daysAgo(60),
      channel: { create: { name: "Tara Clips", username: "taraclips", description: "Clips and re-uploads", category: "Kids Comedy", country: "India", theme: "PINK" } },
    },
  });

  // ── videos (kids content) ──
  type VideoSpec = {
    file: string; thumb: string; title: string; description: string; category: string;
    creator: string; hashtags: string[]; duration: number; publishedDaysAgo: number;
    views: number; qualRatio: number; likes: number; shares: number; featured?: boolean;
    status?: string;
  };
  const videoSpecs: VideoSpec[] = [
    { file: "v12.mp4", thumb: "th12.webp", title: "Twinkle Twinkle Little Star Remix ⭐", description: "Pari the penguin skates under the stars in our dreamiest remix yet. Sing along!", category: "Nursery Rhymes", creator: "meeraplaytime", hashtags: ["twinkletwinkle", "nurseryrhymes", "songsforkids"], duration: 48, publishedDaysAgo: 62, views: 512400, qualRatio: 0.82, likes: 48200, shares: 3120, featured: true },
    { file: "v14.mp4", thumb: "th14.webp", title: "Rocket Trip to Candy Planet 🚀", description: "Countdown, lift-off and a whole planet made of lollipops! Kuchu's biggest adventure yet.", category: "Cartoons & Animation", creator: "meeraplaytime", hashtags: ["rocket", "candyplanet", "cartoon"], duration: 42, publishedDaysAgo: 21, views: 1241500, qualRatio: 0.84, likes: 198600, shares: 12800, featured: true },
    { file: "v02.mp4", thumb: "th02.webp", title: "Bunny in the Rainbow Garden 🌈", description: "Bloom the bunny hops through a magical garden where flowers sing. Can you name every color?", category: "Story Time", creator: "meeraplaytime", hashtags: ["rainbow", "bunny", "colors"], duration: 52, publishedDaysAgo: 8, views: 187300, qualRatio: 0.79, likes: 22400, shares: 2980 },
    { file: "v01.mp4", thumb: "th01.webp", title: "Baby Elephant's Bubble Bath Day 🛁", description: "Ellie discovers bubbles — and a little yellow duck friend. Splash along!", category: "Animals & Friends", creator: "bububuddy", hashtags: ["elephant", "bubblebath", "jungle"], duration: 47, publishedDaysAgo: 55, views: 612300, qualRatio: 0.85, likes: 98700, shares: 12400, featured: true },
    { file: "v16.mp4", thumb: "th16.webp", title: "Puppy's Surprise Birthday Party 🎂", description: "Balloon, presents and one very happy puppy. Happy birthday, Coco!", category: "Family Adventures", creator: "bububuddy", hashtags: ["birthday", "puppy", "party"], duration: 44, publishedDaysAgo: 18, views: 128900, qualRatio: 0.77, likes: 15300, shares: 1410 },
    { file: "v13.mp4", thumb: "th13.webp", title: "Baby Fox and the Magic Fireflies ✨", description: "A tiny fox follows glowing fireflies deep into the enchanted forest. A gentle goodnight story.", category: "Cartoons & Animation", creator: "aaravtoons", hashtags: ["fireflies", "fox", "bedtimestory"], duration: 41, publishedDaysAgo: 12, views: 892400, qualRatio: 0.83, likes: 112300, shares: 9840, featured: true },
    { file: "v03.mp4", thumb: "th03.webp", title: "The Kuchu Puchu Dance Party! 💃", description: "Wiggle, giggle and dance with the whole gang. Can you do the Kuchu spin?", category: "Dance & Fun", creator: "uniwhispers", hashtags: ["danceparty", "dancealong", "kidsongs"], duration: 49, publishedDaysAgo: 30, views: 892400, qualRatio: 0.83, likes: 112300, shares: 9840 },
    { file: "v04.mp4", thumb: "th04.webp", title: "The Little Sparrow Who Believed 🐦", description: "She was the smallest bird in the jungle — but she had the biggest dream. A story about courage.", category: "Story Time", creator: "kittycraftclub", hashtags: ["sparrow", "believeinyourself", "story"], duration: 51, publishedDaysAgo: 26, views: 458200, qualRatio: 0.78, likes: 51200, shares: 6210 },
    { file: "v15.mp4", thumb: "th15.webp", title: "Best Friends Forever: Ellie & Mouse 💕", description: "The biggest hug in the meadow! Because friends come in every size.", category: "Animals & Friends", creator: "kittycraftclub", hashtags: ["friendship", "elephant", "mouse"], duration: 48, publishedDaysAgo: 6, views: 76300, qualRatio: 0.74, likes: 8900, shares: 760 },
    { file: "v05.mp4", thumb: "th05.webp", title: "Panda's Bamboo Cookie Party 🍪", description: "Pom the panda bakes (and mostly eats) bamboo cookies. Count along — one, two, three!", category: "Kids Comedy", creator: "dinodayout", hashtags: ["panda", "cookies", "counting"], duration: 45, publishedDaysAgo: 15, views: 198700, qualRatio: 0.76, likes: 24100, shares: 3880 },
    { file: "v06.mp4", thumb: "th06.webp", title: "Building the Tallest Block Tower 🧱", description: "Red, blue, pink — stack them high! What's the tallest tower YOU ever built?", category: "Toys & Play", creator: "teddyhugs", hashtags: ["blocks", "toys", "building"], duration: 43, publishedDaysAgo: 11, views: 389500, qualRatio: 0.79, likes: 56700, shares: 7230 },
    { file: "v07.mp4", thumb: "th07.webp", title: "ABC Song with Lion Cub 🔤", description: "Leo the lion cub learns his ABCs on the classroom chalkboard. Sing every letter!", category: "Nursery Rhymes", creator: "parispenguin", hashtags: ["abc", "alphabet", "learningsongs"], duration: 46, publishedDaysAgo: 150, views: 267800, qualRatio: 0.75, likes: 31400, shares: 5210 },
    { file: "v08.mp4", thumb: "th08.webp", title: "Kitty Paints a Rainbow 🎨", description: "Mimi the kitten paints the biggest rainbow ever — with one surprise splash of pink!", category: "Arts & Crafts", creator: "bunnybloom", hashtags: ["painting", "rainbow", "crafts"], duration: 40, publishedDaysAgo: 4, views: 612300, qualRatio: 0.85, likes: 98700, shares: 12400, featured: true },
    { file: "v09.mp4", thumb: "th09.webp", title: "Sleepy Bunny's Bedtime Story 🌙", description: "Pajamas on, stars out. The perfect 40 seconds to end the day. Night night!", category: "Story Time", creator: "lioncubsongs", hashtags: ["bedtime", "sleepy", "goodnight"], duration: 40, publishedDaysAgo: 9, views: 84600, qualRatio: 0.72, likes: 9800, shares: 1120 },
    { file: "v10.mp4", thumb: "th10.webp", title: "Dino's Rainy Day Puddle Jump 🦕", description: "Yellow boots, big puddles, gigantic splashes! Why is rain so much fun?", category: "Learning & Fun", creator: "monkeymischief", hashtags: ["rainyday", "puddles", "dinofun"], duration: 57, publishedDaysAgo: 20, views: 132400, qualRatio: 0.81, likes: 18600, shares: 2440 },
    { file: "v11.mp4", thumb: "th11.webp", title: "Panda's Silly Toy Box Surprise 🧸", description: "What's inside the mystery toy box? Pom the panda finds out the goofy way!", category: "Kids Comedy", creator: "pandapals", hashtags: ["toybox", "surprise", "funny"], duration: 42, publishedDaysAgo: 7, views: 421800, qualRatio: 0.8, likes: 71200, shares: 15600 },
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
        contentId, creatorId: creators["pandapals"].id,
        title: "Baby Elephant's Bubble Bath (HD Re-Upload)",
        description: "Re-uploading in higher quality!",
        category: "Animals & Friends", hashtags: JSON.stringify(["elephant", "bubblebath"]),
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
        userId: creators["pandapals"].id, videoId: contentId, type: "DUPLICATE_CONTENT",
        severity: "HIGH",
        details: `VID-2026-000017 matches VID-2026-000004 (Bubu & Buddy) with 97% visual similarity and 99% audio similarity. Upload reward withheld pending review.`,
      },
    });
    await db.notification.create({
      data: {
        userId: creators["pandapals"].id, type: "DUPLICATE",
        title: "Duplicate content detected",
        body: `Your upload ${contentId} was flagged: 97% similar to an existing video. Upload rewards are on hold until review. You can submit an appeal from My Videos.`,
        link: "#/dashboard/videos",
      },
    });
  }

  // ── comments ──
  const commenters = [
    ["Layla H.", "My toddler asks for this every night! 🥰"], ["Tomás R.", "Watched this 4 times with my son already"],
    ["Jenny W.", "How is this only 60 seconds, we need a whole series"], ["Ahmed K.", "Saving this for road trips"],
    ["Rosa M.", "The animation style is so soft and cute 👏"], ["Kevin P.", "My daughter now knows all her colors thanks to this"],
    ["Ines F.", "Ellie the elephant deserves way more views"], ["Dara S.", "Kuchu Puchu finally showing my kids the good stuff"],
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

  // ── follows (meera follows a few channels) ──
  for (const uname of ["bunnybloom", "teddyhugs", "uniwhispers", "kittycraftclub"]) {
    await db.follow.create({
      data: { followerId: creators["meeraplaytime"].id, channelId: (await db.channel.findUnique({ where: { username: uname } }))!.id },
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
  const meera = creators["meeraplaytime"].id;
  await db.withdrawal.create({
    data: {
      userId: meera, amount: 600, method: "BANK_TRANSFER",
      details: JSON.stringify({ accountName: "Meera Iyer", maskedAccount: "•••• 4821", bank: "HDFC" }),
      status: "PAID", paymentRef: "PAY-8K2NQX91", adminNote: "Paid via IMPS batch #42",
      createdAt: daysAgo(35), updatedAt: daysAgo(32),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: meera, amount: 250, method: "PAYPAL",
      details: JSON.stringify({ accountName: "Meera Iyer", maskedAccount: "meera•••@mykuchupuchu.com" }),
      status: "PROCESSING", paymentRef: "PAY-3J7MDP24", adminNote: "PayPal payout submitted",
      createdAt: daysAgo(4), updatedAt: daysAgo(1),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: meera, amount: 150, method: "BANK_TRANSFER",
      details: JSON.stringify({ accountName: "Meera Iyer", maskedAccount: "•••• 4821", bank: "HDFC" }),
      status: "REQUESTED", createdAt: daysAgo(0, 9),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: creators["aaravtoons"].id, amount: 120, method: "PAYPAL",
      details: JSON.stringify({ accountName: "Aarav Mehta", maskedAccount: "aarav•••@mykuchupuchu.com" }),
      status: "PAID", paymentRef: "PAY-9Z4TQR58", createdAt: daysAgo(20), updatedAt: daysAgo(17),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: creators["bunnybloom"].id, amount: 75, method: "BANK_TRANSFER",
      details: JSON.stringify({ accountName: "Riya Sharma", maskedAccount: "•••• 7710", bank: "ICICI" }),
      status: "UNDER_REVIEW", createdAt: daysAgo(2),
    },
  });
  await db.withdrawal.create({
    data: {
      userId: creators["lioncubsongs"].id, amount: 30, method: "PAYPAL",
      details: JSON.stringify({ accountName: "V. Singh", maskedAccount: "vs•••@mykuchupuchu.com" }),
      status: "REJECTED", adminNote: "PayPal account name does not match your verified channel name. Please update payment details and re-request.",
      createdAt: daysAgo(12), updatedAt: daysAgo(11),
    },
  });

  // ── fraud flags ──
  const saraV = created.find(c => c.spec.file === "v04.mp4")!;
  const meeraV12 = created.find(c => c.spec.file === "v12.mp4")!;
  const meeraV14 = created.find(c => c.spec.file === "v14.mp4")!;
  await db.fraudFlag.create({
    data: {
      userId: saraV.creatorId, videoId: saraV.contentId, type: "VIEW_BOT", severity: "MEDIUM",
      details: "42 views from a known bot user-agent were excluded from qualified views in the last 24h.",
    },
  });
  await db.fraudFlag.create({
    data: {
      userId: meeraV12.creatorId, videoId: meeraV12.contentId, type: "RAPID_REFRESH", severity: "LOW",
      details: "One viewer generated 14 views in 10 minutes (daily cap is 3). Extra views were not credited.",
    },
  });
  await db.fraudFlag.create({
    data: {
      userId: meeraV14.creatorId, videoId: meeraV14.contentId, type: "SELF_VIEW", severity: "LOW",
      details: "23 self-views detected from the creator's own device. Self-views are never monetized.",
    },
  });
  await db.fraudFlag.create({
    data: {
      userId: suspended.id, videoId: null, type: "UNUSUAL_PATTERN", severity: "HIGH",
      details: "Engagement spike with 96% duplicate viewer keys within 2 hours of upload. Account suspended pending review.",
    },
  });

  // ── notifications for meera ──
  const meeraN = [
    ["APPLICATION_SUBMITTED", "Application received", "Your creator application is now pending review. We usually review within 2 business days.", daysAgo(154)],
    ["ACCOUNT_STATUS", "Welcome to Kuchu Puchu, creator! 🎉", "Your channel Meera's Playtime has been approved. You can now upload videos and start earning.", daysAgo(150)],
    ["VIDEO_STATUS", "Video approved: Twinkle Twinkle Little Star Remix ⭐", "Your video passed originality checks and is now live and monetized.", daysAgo(61)],
    ["EARNING", "You earned $18.24 yesterday", "Earnings from qualified views were credited to your pending balance.", daysAgo(1)],
    ["EARNING", "Upload reward credited", "$0.50 was credited for your approved original upload VID-2026-000002.", daysAgo(20)],
    ["WITHDRAWAL", "Withdrawal paid ✅", "Your $600.00 withdrawal (PAY-8K2NQX91) has been paid to your bank account.", daysAgo(32)],
    ["WITHDRAWAL", "Withdrawal processing", "Your $250.00 PayPal withdrawal is being processed. Expect it within 3–5 business days.", daysAgo(1)],
    ["LIMIT", "Daily upload limit reached", "You've used 2 of 2 uploads today. Your upload allowance resets at midnight.", daysAgo(6)],
    ["MONETIZATION", "Monetization window reminder", "VID-2026-000001 stops generating view earnings on its 4-month anniversary. It stays public — it just stops earning.", daysAgo(3)],
    ["ANNOUNCEMENT", "PayPal payouts now worldwide 🌍", "You can now receive Kuchu Puchu payouts via PayPal in every supported country.", daysAgo(9)],
  ] as const;
  for (const [type, title, body, at] of meeraN) {
    await db.notification.create({
      data: { userId: meera, type, title, body, read: at < daysAgo(5), createdAt: at },
    });
  }
  // notifications for others (approval etc.)
  for (const uname of Object.keys(creators).slice(1, 6)) {
    await db.notification.create({
      data: {
        userId: creators[uname].id, type: "ACCOUNT_STATUS",
        title: "Your channel has been approved 🎉",
        body: "Welcome to Kuchu Puchu! You can now upload original videos and start earning.",
        createdAt: daysAgo(rand(10, 100)),
      },
    });
  }

  // ── mail log (simulated outbound emails) ──
  await db.mailLog.createMany({
    data: [
      { toEmail: "meera@mykuchupuchu.com", subject: "Your Kuchu Puchu creator account is approved", body: "Hi Meera, your channel Meera's Playtime has been approved. Start uploading to earn.", createdAt: daysAgo(150) },
      { toEmail: "meera@mykuchupuchu.com", subject: "Withdrawal paid: $600.00", body: "Your withdrawal PAY-8K2NQX91 was paid to your bank account.", createdAt: daysAgo(32) },
      { toEmail: "kim@mykuchupuchu.com", subject: "Your Kuchu Puchu application was not approved", body: "Channel name is too similar to the Kuchu Puchu brand. You may re-apply with a new channel name.", createdAt: daysAgo(8) },
      { toEmail: "samir@mykuchupuchu.com", subject: "We received your application", body: "Thanks for applying to Kuchu Puchu. Our team is reviewing your channel — usually within 2 business days.", createdAt: daysAgo(2) },
    ],
  });

  // ── audit logs ──
  await db.auditLog.createMany({
    data: [
      { actorId: admin.id, actorEmail: admin.email, action: "CREATOR_APPROVED", targetType: "CREATOR", targetId: creators["meeraplaytime"].username, details: "Approved after originality review", createdAt: daysAgo(150) },
      { actorId: admin.id, actorEmail: admin.email, action: "CREATOR_REJECTED", targetType: "CREATOR", targetId: "kuchucartoontv", details: "Channel name too similar to Kuchu Puchu brand", createdAt: daysAgo(8) },
      { actorId: admin.id, actorEmail: admin.email, action: "VIDEO_APPROVED", targetType: "VIDEO", targetId: "VID-2026-000001", details: "Passed duplicate checks", createdAt: daysAgo(55) },
      { actorId: admin.id, actorEmail: admin.email, action: "WITHDRAWAL_PAID", targetType: "WITHDRAWAL", targetId: "PAY-8K2NQX91", details: "$600 IMPS payout to Meera Iyer", createdAt: daysAgo(32) },
      { actorId: admin.id, actorEmail: admin.email, action: "CREATOR_SUSPENDED", targetType: "CREATOR", targetId: "taraclips", details: "Spam comments — 3rd strike", createdAt: daysAgo(5) },
    ],
  });

  // ── content report ──
  const reported = created.find(c => c.spec.file === "v11.mp4")!;
  await db.contentReport.create({
    data: {
      videoId: reported.id, reporterKey: randomBytes(12).toString("hex"),
      reason: "COPYRIGHT", details: "Contains a 10-second clip from a licensed cartoon show.",
      status: "OPEN", createdAt: daysAgo(1),
    },
  });

  // ── contact + newsletter ──
  await db.contactMessage.createMany({
    data: [
      { name: "Omar Haddad", email: "omar@example.com", category: "PAYMENTS", subject: "PayPal not available in my country?", message: "Hi! I make nursery rhyme videos with my daughter and would love to join, but PayPal payouts aren't available in Morocco. Are bank transfers coming?", createdAt: daysAgo(3) },
      { name: "Greta Lind", email: "greta@example.com", category: "CREATOR_SUPPORT", subject: "Duplicate flag by mistake", message: "My hand-drawn cartoon was flagged as duplicate but it's 100% my own animation. How do I appeal?", createdAt: daysAgo(1) },
    ],
  });
  await db.newsletterSubscriber.createMany({
    data: [
      { email: "creator.news@example.com" }, { email: "samir@example.com" }, { email: "hello@example.com" },
    ],
  });

  // ── languages, 31 categories + subcategories, recommendation config; tag the demo videos ──
  await seedDiscovery(db);
  await applyKidsTaxonomy(db);
  await backfillVideoTags(db);

  // ── summary ──
  const walletMeera = await db.ledgerEntry.aggregate({ _sum: { amount: true }, where: { userId: meera } });
  console.log("Meera lifetime earnings ≈ $", (walletMeera._sum.amount ?? 0).toFixed(2));
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
