// One-off (Nov 2026): put live videos into the 10 new categories and fix clearly wrong categories
// (e.g. "Learn Musical Instruments" under Alphabet & Phonics). Same records as the admin "correct
// tags" action: assignments with source ADMIN, video.category = primary subcategory, a taxonomy audit
// entry VIDEO_TAGS_CORRECTED per video. Languages are not touched. One in-app note per creator, no email.
//
//   node prisma/retag-2026-11.mjs            → dry run: prints every change, writes nothing
//   node prisma/retag-2026-11.mjs --apply    → backs up the database (VACUUM INTO), then writes
//
// Run AFTER the deploy that adds the new categories (seedDiscovery creates them).
import { PrismaClient } from "@prisma/client";
import path from "path";
import { mkdirSync } from "fs";

const APPLY = process.argv.includes("--apply");
const db = new PrismaClient();

// contentId → [primary, second, third] as "category/subcategory" slugs
const MAP = {
  "VID-2026-000001": ["fruits-vegetables/fruits", "early-learning/colours-shapes", "cartoons-animation/adventure-cartoons"],
  "VID-2026-000004": ["rhymes-songs/sing-along-songs", "fruits-vegetables/food-rhymes", "poems/hindi-poems-kavita"],
  "VID-2026-000005": ["fruits-vegetables/food-names", "words-names/names-in-hindi-english", "learn-languages/learn-hindi"],
  "VID-2026-000007": ["poems/hindi-poems-kavita", "family-friends/maa-papa", "rhymes-songs/nursery-rhymes"],
  "VID-2026-000008": ["good-habits/good-manners", "family-friends/grandparents", "our-world/family-adventures"],
  "VID-2026-000009": ["poems/hindi-poems-kavita", "animals/wild-animals", "rhymes-songs/nursery-rhymes"],
  "VID-2026-000011": ["body-routine/body-parts", "words-names/names-in-hindi-english", "early-learning/first-words"],
  "VID-2026-000012": ["words-names/things-around-us", "early-learning/first-words"],
  "VID-2026-000013": ["words-names/things-around-us", "sports-play/ball-games", "early-learning/first-words"],
  "VID-2026-000014": ["words-names/simple-sentences", "learn-languages/learn-english"],
  "VID-2026-000015": ["music-instruments/musical-instruments", "early-learning/first-words"],
  "VID-2026-000016": ["alphabets/abc-phonics", "early-learning/alphabet-phonics"],
  "VID-2026-000017": ["alphabets/abc-phonics", "early-learning/alphabet-phonics"],
  "VID-2026-000018": ["animals/birds-insects", "words-names/names-in-hindi-english", "early-learning/first-words"],
  "VID-2026-000019": ["rhymes-songs/nursery-rhymes", "poems/hindi-poems-kavita"],
  "VID-2026-000021": ["body-routine/daily-routine", "good-habits/healthy-habits"],
  "VID-2026-000023": ["school-classroom/animal-school", "kids-comedy/funny-animals", "cartoons-animation/animal-cartoons"],
  "VID-2026-000024": ["maths/counting-numbers", "early-learning/numbers-counting", "school-classroom/animal-school"],
  "VID-2026-000025": ["school-classroom/classroom-comedy", "cartoons-animation/funny-cartoons", "kids-comedy/funny-animals"],
  "VID-2026-000026": ["school-classroom/animal-school", "kids-comedy/funny-animals", "animals/animal-friends"],
  "VID-2026-000027": ["school-classroom/classroom-comedy", "maths/counting-numbers", "kids-comedy/funny-animals"],
  "VID-2026-000028": ["school-classroom/animal-school", "kids-comedy/funny-animals", "cartoons-animation/funny-cartoons"],
  "VID-2026-000030": ["school-classroom/animal-school", "learn-languages/learn-urdu", "cartoons-animation/animal-cartoons"],
  "VID-2026-000031": ["poems/english-poems", "school-classroom/animal-school", "rhymes-songs/nursery-rhymes"],
  "VID-2026-000032": ["school-classroom/animal-school", "learn-languages/learn-hindi", "kids-comedy/funny-animals"],
  "VID-2026-000033": ["music-instruments/indian-instruments", "school-classroom/animal-school", "kids-comedy/funny-animals"],
  "VID-2026-000034": ["stories/moral-stories", "school-classroom/animal-school", "cartoons-animation/funny-cartoons"],
  "VID-2026-000035": ["sports-play/outdoor-games", "early-learning/learning-games", "cartoons-animation/adventure-cartoons"],
  "VID-2026-000036": ["sports-play/outdoor-games", "early-learning/learning-games", "cartoons-animation/adventure-cartoons"],
  "VID-2026-000042": ["arts-crafts/painting", "early-learning/colours-shapes", "school-classroom/fun-school-lessons"],
  "VID-2026-000043": ["science-nature/weather-seasons", "school-classroom/fun-school-lessons", "early-learning/opposites-patterns"],
  "VID-2026-000044": ["sports-play/outdoor-games", "early-learning/learning-games", "school-classroom/fun-school-lessons"],
  "VID-2026-000045": ["sports-play/outdoor-games", "early-learning/learning-games", "school-classroom/fun-school-lessons"],
  "VID-2026-000046": ["science-nature/science-for-kids", "early-learning/colours-shapes", "vehicles/cars-buses"],
  "VID-2026-000047": ["school-classroom/animal-school", "cartoons-animation/animal-cartoons", "kids-comedy/funny-animals"],
  "VID-2026-000048": ["maths/tables-pahade", "school-classroom/fun-school-lessons", "early-learning/numbers-counting"],
  "VID-2026-000049": ["alphabets/punjabi-gurmukhi", "learn-languages/learn-punjabi", "early-learning/alphabet-phonics"],
  "VID-2026-000050": ["school-classroom/fun-school-lessons", "learn-languages/learn-punjabi", "kids-comedy/riddles-kids-jokes"],
  "VID-2026-000051": ["stories/heritage-history-stories", "school-classroom/fun-school-lessons"],
  "VID-2026-000052": ["poems/poem-recitation", "school-classroom/fun-school-lessons", "rhymes-songs/nursery-rhymes"],
  "VID-2026-000053": ["maths/counting-numbers", "rhymes-songs/nursery-rhymes", "animals/farm-animals"],
};

// New videos since the 13 Nov title update (each checked frame by frame): SEO title + description.
// Hashtags are not touched. Same records as the admin "update details" action (AuditLog VIDEO_DETAILS_EDITED).
const DETAILS = {
  "VID-2026-000042": ["Colour Mixing for Kids | Anime Art Class with Red, Yellow & Blue Paint | Kuchu Puchu",
    "Join a cheerful anime art class where the teacher shows how colours mix! Kids watch red, yellow and blue paint on a palette and see the new colours they make together. A fun first painting lesson that helps children learn colour names and get creative."],
  "VID-2026-000043": ["Hot and Cold Weather for Kids | Anime Weather Class with the Sun | Kuchu Puchu",
    "In this anime classroom, Teacher Hana and her students learn about the weather. Kids meet the sun, talk about hot and cold days and raise their hands to answer. A simple, friendly science lesson for young learners."],
  "VID-2026-000044": ["Playground Games for Kids Part 1 | Hopscotch, Tag & Running Games | Kuchu Puchu",
    "Let's play outside! In part 1 of this anime school adventure, friends learn fun playground games like hopscotch and tag with their teacher, then run and play together on the field and in the sports hall. A playful video that gets kids excited to move, take turns and have fun with friends."],
  "VID-2026-000045": ["Traditional Games for Kids Part 2 | Pittu (Lagori) & Gilli Danda | Kuchu Puchu",
    "In part 2, Teacher Hana shows Aki, Yuki and Ken more outdoor games. Kids see pittu (lagori), where a ball knocks down a tower of stones, and gilli danda, played with a long stick and a short one. A fun way for children to discover classic outdoor games and play safely with friends."],
  "VID-2026-000046": ["How Are Rainbows Made? | 7 Colours of the Rainbow for Kids | Kuchu Puchu",
    "Why do we see a rainbow after the rain? Friendly cartoon cars and a tiny raindrop show how sunlight and water make a rainbow, then kids learn its seven colours with bright balloons. A colourful first science lesson for curious kids."],
  "VID-2026-000047": ["Funny Animal School for Kids | Cute Animal Students in the Classroom | Kuchu Puchu",
    "Welcome to a funny animal school! A bear, a bunny, a puppy, a chick and their friends go to school, play on the swings, read in the library, eat lunch together and learn their ABCs in class. A cheerful cartoon about a happy school day for little ones."],
  "VID-2026-000048": ["2 Ka Table in Punjabi | Learn the 2 Times Table (Pahada) for Kids | Kuchu Puchu",
    "Learn the table of 2 with a kind teacher in a Punjabi classroom! She writes 2 × 1 = 2, 2 × 2 = 4 and more on the blackboard, and the children say it along with her. A short, easy maths lesson to help kids learn their first times table."],
  "VID-2026-000049": ["Learn Punjabi Alphabet for Kids | Gurmukhi Letters ੳ ਅ ੲ in Class | Kuchu Puchu",
    "Learn the Punjabi alphabet with a friendly teacher! He shows the Gurmukhi letters ੳ, ਅ, ੲ, ਸ and ਹ on the blackboard, and the happy children say each letter after him. A cheerful first Punjabi lesson for young learners."],
  "VID-2026-000050": ["Punjabi Classroom Questions for Kids | Master Ji's Class | Kuchu Puchu",
    "Master Ji writes questions in Punjabi on the blackboard while the children sit together and think about the answers. A short Punjabi classroom moment that helps kids listen, read and learn in their own language."],
  "VID-2026-000051": ["Chaar Sahibzaade Story for Kids | Names of the Four Sahibzaade | Punjabi | Kuchu Puchu",
    "Master Ji teaches the children the names of the Chaar Sahibzaade: Baba Ajit Singh Ji, Baba Jujhar Singh Ji, Baba Zorawar Singh Ji and Baba Fateh Singh Ji. A short, respectful Punjabi lesson about the courage and sacrifice of the four Sahibzaade, to help kids remember Sikh history."],
  "VID-2026-000052": ["Punjabi Poem Recitation for Kids | Classroom Kavita with Master Ji | Kuchu Puchu",
    "Master Ji recites a Punjabi poem written on the blackboard while the children listen and learn the lines. A sweet classroom recitation that helps kids enjoy poetry and practise for their own school poem recitation."],
  "VID-2026-000053": ["Counting with Ducklings | 1, 2, 3 Counting Song for Kids | Kuchu Puchu",
    "Count along with three cute little ducklings as they dance by the pond in a garden full of flowers! A short, happy counting song that helps toddlers and preschoolers count to three and sing along."],
};

async function main() {
  const cats = await db.category.findMany({ include: { subcategories: true } });
  const bySlug = new Map(cats.map(c => [c.slug, c]));
  const resolve = key => {
    const [cs, ss] = key.split("/");
    const c = bySlug.get(cs);
    const s = c?.subcategories.find(x => x.slug === ss);
    if (!c || !s || !c.active || c.retiredAt || !s.active || s.retiredAt) throw new Error(`unknown or inactive "${key}" — deploy the new categories first`);
    return { categoryId: c.id, subcategoryId: s.id, label: s.name, key };
  };
  const label = a => { const c = cats.find(x => x.id === a.categoryId); return `${c?.slug}/${c?.subcategories.find(s => s.id === a.subcategoryId)?.slug}`; };

  const admin = await db.user.findFirst({ where: { role: "ADMIN", status: { not: "SUSPENDED" } }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("no admin account to record as the actor");
  const actor = { id: admin.id, email: admin.email };

  const plans = [];
  for (const [contentId, keys] of Object.entries(MAP)) {
    const v = await db.video.findUnique({ where: { contentId } });
    if (!v) { console.log(`skip ${contentId}: not found`); continue; }
    if (v.status !== "APPROVED") { console.log(`skip ${contentId}: status ${v.status}`); continue; }
    const want = keys.map(resolve);
    if (new Set(want.map(w => w.categoryId)).size !== want.length) throw new Error(`${contentId}: a category appears twice`);
    const cur = await db.videoCategoryAssignment.findMany({ where: { videoId: v.id }, orderBy: { priority: "asc" } });
    const same = cur.length === want.length && cur.every((a, i) => a.categoryId === want[i].categoryId && a.subcategoryId === want[i].subcategoryId);
    console.log(`${same ? "=" : "~"} ${contentId} ${v.title.split(" | ")[0].slice(0, 40).padEnd(40)}  ${cur.map(label).join(", ") || "(none)"}  →  ${want.map(w => w.key).join(", ")}`);
    if (!same) plans.push({ v, cur, want });
  }
  console.log(`\n${plans.length} video(s) to change, ${Object.keys(MAP).length - plans.length} unchanged or skipped.`);

  const details = [];
  for (const [contentId, [title, description]] of Object.entries(DETAILS)) {
    if (title.length < 3 || title.length > 100 || description.length > 1000) throw new Error(`${contentId}: title/description length`);
    const v = await db.video.findUnique({ where: { contentId } });
    if (!v || v.status !== "APPROVED") { console.log(`skip details ${contentId}: ${v ? v.status : "not found"}`); continue; }
    if (v.title === title && v.description === description) continue;
    console.log(`T ${contentId} "${v.title.slice(0, 60)}"\n   → "${title}" (${title.length})`);
    details.push({ v, title, description });
  }
  console.log(`${details.length} title/description update(s).`);
  if (!APPLY) { console.log("Dry run — nothing written. Re-run with --apply."); return; }
  if (!plans.length && !details.length) return;

  // backup next to the database: <db dir>/backups/custom-before-retag-<ts>.db
  const dbFile = (process.env.DATABASE_URL || "").replace(/^file:/, "");
  const dir = path.join(path.dirname(path.resolve(dbFile)), "backups");
  mkdirSync(dir, { recursive: true });
  const backup = path.join(dir, `custom-before-retag-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
  await db.$executeRawUnsafe(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
  console.log(`backup: ${backup}`);

  const byCreator = new Map();
  for (const { v, cur, want } of plans) {
    await db.$transaction(async tx => {
      await tx.videoCategoryAssignment.deleteMany({ where: { videoId: v.id } });
      for (const [i, w] of want.entries()) {
        await tx.videoCategoryAssignment.create({
          data: { videoId: v.id, categoryId: w.categoryId, subcategoryId: w.subcategoryId, priority: i + 1, source: "ADMIN", assignedById: actor.id, updatedById: actor.id },
        });
      }
      await tx.video.update({ where: { id: v.id }, data: { category: want[0].label, tagsUpdatedAt: new Date(), tagStatus: "OK", tagFlagReason: null } });
      await tx.taxonomyAuditLog.create({
        data: {
          actorId: actor.id, actorEmail: actor.email, action: "VIDEO_TAGS_CORRECTED", entityType: "VIDEO_TAGS", entityId: v.contentId,
          before: JSON.stringify({ tags: cur.map(a => ({ priority: a.priority, categoryId: a.categoryId, subcategoryId: a.subcategoryId, source: a.source })) }),
          after: JSON.stringify({ tags: want.map((w, i) => ({ priority: i + 1, categoryId: w.categoryId, subcategoryId: w.subcategoryId })), note: "Nov 2026: new categories" }),
        },
      });
    });
    byCreator.set(v.creatorId, [...(byCreator.get(v.creatorId) ?? []), v.contentId]);
  }
  const detailsByCreator = new Map();
  for (const { v, title, description } of details) {
    const before = { title: v.title, description: v.description };
    const after = { title, description };
    const changed = ["title", "description"].filter(k => before[k] !== after[k]);
    await db.$transaction([
      db.video.update({ where: { id: v.id }, data: { title, description } }),
      db.auditLog.create({ data: { actorId: actor.id, actorEmail: actor.email, action: "VIDEO_DETAILS_EDITED", targetType: "VIDEO", targetId: v.contentId, details: JSON.stringify({ changed, before, after }).slice(0, 2000) } }),
    ]);
    detailsByCreator.set(v.creatorId, [...(detailsByCreator.get(v.creatorId) ?? []), v.contentId]);
  }
  const creators = new Set([...byCreator.keys(), ...detailsByCreator.keys()]);
  for (const userId of creators) {
    const cats = byCreator.get(userId) ?? [], det = detailsByCreator.get(userId) ?? [];
    const parts = [];
    if (cats.length) parts.push(`updated the categories on ${cats.length} of your videos (${cats.join(", ")}), using new categories like School & Classroom, Poems for Kids and Maths for Kids`);
    if (det.length) parts.push(`wrote clearer titles and descriptions for ${det.length} videos (${det.join(", ")}); your hashtags are unchanged`);
    await db.notification.create({
      data: {
        userId, type: "VIDEO_STATUS", link: "#/dashboard/videos",
        title: "We updated your videos so more families find them",
        body: `Our team ${parts.join(", and ")}. The videos, their views and earnings are unchanged. You can see and edit everything in My Videos.`,
      },
    });
  }
  console.log(`done: ${plans.length} videos re-categorised, ${details.length} titles updated, ${creators.size} creator note(s).`);
}

main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
