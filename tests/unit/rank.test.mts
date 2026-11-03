import { test } from "node:test";
import assert from "node:assert/strict";
import { rankFeed, emptyProfile, type Candidate, type Profile } from "../../src/lib/discovery/rank.ts";
import { RECO_DEFAULTS } from "../../src/lib/discovery/reco-config.ts";

const NOW = Date.UTC(2026, 10, 2);
let n = 0;
function video(lang: string[], tags: [string, string][], extra: Partial<Candidate> = {}): Candidate {
  n++;
  return {
    id: extra.id ?? `v${n}`, creatorId: extra.creatorId ?? `creator${n}`, publishedAt: NOW - 2 * 864e5,
    languageCodes: lang, tags: tags.map(([c, s], i) => ({ categoryId: c, subcategoryId: `${c}/${s}`, priority: i + 1 })),
    views: 1000, qualifiedViews: 800, likes: 80, comments: 5, shares: 5, saves: 3, completionRate: null,
    highFraud: false, reportCount: 0, creatorApprovedAt: null, ...extra,
  };
}
function profile(langs: string[], cats: string[], subs: string[], extra: Partial<Profile> = {}): Profile {
  return { ...emptyProfile(langs), categoryIds: new Set(cats), subcategoryIds: new Set(subs), ...extra };
}
const rank = (c: Candidate[], p: Profile) => rankFeed(c, p, RECO_DEFAULTS, { now: NOW, seed: "u1:2026-11-02" });

test("Test 1 — Hindi + Rhymes & Songs › Nursery Rhymes: exact Hindi matches lead, other languages excluded", () => {
  const hw = video(["hi"], [["rhymes-songs", "nursery-rhymes"]], { id: "hindi-hw" });
  const office = video(["hi"], [["rhymes-songs", "action-songs"]], { id: "hindi-office" });
  const cooking = video(["hi"], [["kids-cooking", "easy-snacks"]], { id: "hindi-food" });
  const englishHw = video(["en"], [["rhymes-songs", "nursery-rhymes"]], { id: "english-hw" });
  const out = rank([cooking, englishHw, office, hw], profile(["hi"], ["rhymes-songs"], ["rhymes-songs/nursery-rhymes"]));
  assert.equal(out[0].id, "hindi-hw");
  assert.equal(out[1].id, "hindi-office");
  assert.ok(!out.some(o => o.id === "english-hw"), "English video must not appear without discovery mode");
  assert.ok(out.findIndex(o => o.id === "hindi-food") > 1);
});

test("Test 2 — Hindi, English and Bengali are all eligible", () => {
  const vids = [video(["hi"], [["sports-play", "ball-games"]], { id: "hi" }), video(["en"], [["sports-play", "ball-games"]], { id: "en" }),
    video(["bn"], [["sports-play", "ball-games"]], { id: "bn" }), video(["ta"], [["sports-play", "ball-games"]], { id: "ta" })];
  const ids = rank(vids, profile(["hi", "en", "bn"], ["sports-play"], ["sports-play/ball-games"])).map(o => o.id);
  assert.deepEqual(new Set(ids), new Set(["hi", "en", "bn"]));
});

test("bilingual video reaches both language audiences; a multi-category video appears once", () => {
  const bi = video(["hi", "en"], [["early-learning", "numbers-counting"], ["rhymes-songs", "counting-songs"]], { id: "bi" });
  const out1 = rank([bi], profile(["en"], ["early-learning"], ["early-learning/numbers-counting"]));
  const out2 = rank([bi, bi], profile(["hi"], ["rhymes-songs", "early-learning"], ["rhymes-songs/counting-songs"]));
  assert.equal(out1.length, 1);
  assert.equal(out2.length, 1, "no duplicate feed entries");
});

test("Test 11 — no exact subcategory: same-language category matches first, then other categories, other languages never", () => {
  const sameCat = video(["hi"], [["rhymes-songs", "action-songs"]], { id: "same-cat" });
  const otherCat = video(["hi"], [["our-world", "places-to-visit"]], { id: "other-cat" });
  const otherLang = video(["fr"], [["rhymes-songs", "nursery-rhymes"]], { id: "other-lang" });
  const out = rank([otherCat, otherLang, sameCat], profile(["hi"], ["rhymes-songs"], ["rhymes-songs/nursery-rhymes"]));
  assert.deepEqual(out.map(o => o.id), ["same-cat", "other-cat"]);
  assert.equal(out[0].tier, 2);
  assert.equal(out[1].tier, 3);
});

test("discovery mode adds other-language videos, always after the viewer's languages", () => {
  const hi = video(["hi"], [["our-world", "places-to-visit"]], { id: "hi" });
  const fr = video(["fr"], [["rhymes-songs", "nursery-rhymes"]], { id: "fr", likes: 900 });
  const out = rank([fr, hi], profile(["hi"], ["rhymes-songs"], ["rhymes-songs/nursery-rhymes"], { discoverOtherLanguages: true }));
  assert.deepEqual(out.map(o => o.id), ["hi", "fr"]);
  assert.equal(out[1].tier, 4);
});

test("blocked creators, not-interested and reported videos are removed", () => {
  const a = video(["hi"], [["sports-play", "ball-games"]], { id: "a", creatorId: "blocked" });
  const b = video(["hi"], [["sports-play", "ball-games"]], { id: "b" });
  const c = video(["hi"], [["sports-play", "ball-games"]], { id: "c" });
  const d = video(["hi"], [["sports-play", "ball-games"]], { id: "d" });
  const p = profile(["hi"], ["sports-play"], ["sports-play/ball-games"], {
    blockedCreatorIds: new Set(["blocked"]), notInterestedVideoIds: new Set(["b"]), reportedVideoIds: new Set(["c"]),
  });
  assert.deepEqual(rank([a, b, c, d], p).map(o => o.id), ["d"]);
});

test("one creator can't fill a page (max 2 per page of 10)", () => {
  const vids = [
    ...Array.from({ length: 6 }, (_, i) => video(["hi"], [["sports-play", "ball-games"]], { id: `star${i}`, creatorId: "star", likes: 500 })),
    ...Array.from({ length: 8 }, (_, i) => video(["hi"], [["sports-play", "ball-games"]], { id: `other${i}`, likes: 10 })),
  ];
  const page1 = rank(vids, profile(["hi"], ["sports-play"], ["sports-play/ball-games"])).slice(0, 10);
  assert.ok(page1.filter(o => o.id.startsWith("star")).length <= 2);
});

test("watched videos sink; followed creators rise", () => {
  const watched = video(["hi"], [["sports-play", "ball-games"]], { id: "watched" });
  const fresh = video(["hi"], [["sports-play", "ball-games"]], { id: "fresh" });
  const followed = video(["hi"], [["sports-play", "ball-games"]], { id: "followed", creatorId: "fav", likes: 10 });
  const out = rank([watched, fresh, followed], profile(["hi"], ["sports-play"], ["sports-play/ball-games"], {
    watchedVideoIds: new Set(["watched"]), followedCreatorIds: new Set(["fav"]),
  }));
  assert.equal(out[out.length - 1].id, "watched");
  assert.ok(out.findIndex(o => o.id === "followed") < out.findIndex(o => o.id === "watched"));
});

test("Test 6 — preference change is reflected on the next request", () => {
  const rhyme = video(["en"], [["rhymes-songs", "action-songs"]], { id: "rhyme" });
  const science = video(["en"], [["science-nature", "easy-experiments"]], { id: "science" });
  const before = rank([rhyme, science], profile(["en"], ["rhymes-songs"], []));
  const after = rank([rhyme, science], profile(["en"], ["science-nature"], []));
  assert.equal(before[0].id, "rhyme");
  assert.equal(after[0].id, "science");
});

test("monetization is not a ranking input; high-fraud videos are excluded", () => {
  const flagged = video(["hi"], [["sports-play", "ball-games"]], { id: "flagged", highFraud: true, likes: 1000 });
  const clean = video(["hi"], [["sports-play", "ball-games"]], { id: "clean" });
  assert.deepEqual(rank([flagged, clean], profile(["hi"], ["sports-play"], [])).map(o => o.id), ["clean"]);
});

test("guest / cold start: language-only ranking, no interests needed", () => {
  const vids = [video(["hi"], [["sports-play", "ball-games"]], { id: "a" }), video(["en"], [["sports-play", "ball-games"]], { id: "b" })];
  assert.deepEqual(rankFeed(vids, emptyProfile(["hi"]), RECO_DEFAULTS, { now: NOW, seed: "guest" }).map(o => o.id), ["a"]);
  assert.equal(rankFeed(vids, emptyProfile([]), RECO_DEFAULTS, { now: NOW, seed: "guest" }).length, 2);
});
