import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, CATEGORIES, LEGACY_KIDS_CATEGORIES, LEGACY_KIDS_MAP, KIDS_AUDIENCE } from "../../prisma/discovery-data.mjs";

test("exactly 104 languages with unique codes and names", () => {
  assert.equal(LANGUAGES.length, 104);
  assert.equal(new Set(LANGUAGES.map((l: any) => l.code)).size, 104);
  assert.equal(new Set(LANGUAGES.map((l: any) => l.nameEn)).size, 104);
  assert.equal(LANGUAGES.filter((l: any) => l.group === "INDIAN").length, 14);
  for (const l of LANGUAGES as any[]) {
    assert.match(l.script, /^[A-Z][a-z]{3}$/, `${l.code} script must be ISO 15924`);
    assert.ok(["LTR", "RTL"].includes(l.direction));
    assert.ok(l.nameNative.length > 0);
  }
});

test("right-to-left scripts are marked RTL", () => {
  const rtl = new Set(LANGUAGES.filter((l: any) => l.direction === "RTL").map((l: any) => l.code));
  for (const code of ["ur", "ar", "fa", "he", "ps", "sd", "ug", "pnb"]) assert.ok(rtl.has(code), code);
  assert.ok(!rtl.has("hi"));
});

test("kids-only audience is ages 3–8", () => {
  assert.equal(KIDS_AUDIENCE.minAge, 3);
  assert.equal(KIDS_AUDIENCE.maxAge, 8);
});

test("25 kids categories with 131 subcategories, unique slugs and names", () => {
  const expected: Record<string, number> = {
    "cartoons-animation": 7, "rhymes-songs": 7, stories: 7, "early-learning": 7, "science-nature": 7,
    animals: 7, "arts-crafts": 6, "dance-movement": 4, "kids-comedy": 4, "toys-play": 4,
    "our-world": 6, "good-habits": 5, "kids-cooking": 4, "learn-languages": 6, "sports-play": 4,
    // added 2026-11
    "school-classroom": 5, poems: 5, maths: 5, alphabets: 5, "words-names": 4, "body-routine": 5,
    "fruits-vegetables": 4, "family-friends": 4, "music-instruments": 4, vehicles: 5,
  };
  assert.equal(CATEGORIES.length, 25);
  assert.deepEqual((CATEGORIES as any[]).map(c => c.slug), Object.keys(expected));
  assert.equal(new Set((CATEGORIES as any[]).map(c => c.name)).size, 25, "duplicate category names");
  let total = 0;
  for (const c of CATEGORIES as any[]) {
    assert.equal(c.subcategories.length, expected[c.slug], `${c.slug} subcategory count`);
    assert.equal(new Set(c.subcategories.map((s: any) => s.slug)).size, c.subcategories.length, `${c.slug} duplicate slugs`);
    assert.ok(c.keywords.length > 0, `${c.slug} needs search keywords`);
    total += c.subcategories.length;
  }
  assert.equal(total, 131);
});

test("no adult topics anywhere in the taxonomy", () => {
  const banned = /\b(husband|wife|dating|romance|romantic|relationship|finance|money|stock|crypto|religion|spiritual|politic|news|gaming|esports|beauty|makeup|fashion|career|jobs|business|gym|alcohol|horror|prank)\b/i;
  for (const c of CATEGORIES as any[]) {
    const words = [c.name, c.slug, c.description ?? "", ...c.keywords];
    for (const s of c.subcategories) words.push(s.name, s.slug, ...s.keywords);
    for (const w of words) assert.doesNotMatch(String(w), banned, `${c.slug}: "${w}"`);
  }
});

test("every old kids category maps to a live kids subcategory", () => {
  for (const name of LEGACY_KIDS_CATEGORIES as string[]) {
    const target = (LEGACY_KIDS_MAP as Record<string, [string, string]>)[name];
    assert.ok(target, `no mapping for ${name}`);
    const cat = (CATEGORIES as any[]).find(c => c.slug === target[0]);
    assert.ok(cat, `${name} → unknown category ${target[0]}`);
    assert.ok(cat.subcategories.some((s: any) => s.slug === target[1]), `${name} → unknown subcategory ${target.join("/")}`);
  }
});
