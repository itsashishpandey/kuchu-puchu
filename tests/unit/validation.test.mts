import { test } from "node:test";
import assert from "node:assert/strict";
import { validateVideoTags } from "../../src/lib/discovery/tag-validation.ts";
import { buildTaxonomy, sub } from "./fixture.mts";

const tax = buildTaxonomy({ inactiveSub: ["kids-comedy/puppet-shows"] });

test("valid upload: primary Hindi + English, three distinct categories", () => {
  const r = validateVideoTags({
    primaryLanguage: "hi", additionalLanguages: ["en"],
    tags: [sub("rhymes-songs", "nursery-rhymes"), sub("animals", "farm-animals"), sub("early-learning", "numbers-counting")],
  }, tax);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value!.tags.map(t => t.priority), [1, 2, 3]);
  assert.deepEqual(r.value!.languages.map(l => [l.code, l.position, l.isPrimary]), [["hi", 1, true], ["en", 2, false]]);
});

test("Test 4 — a fourth category is rejected with a clear message", () => {
  const r = validateVideoTags({
    primaryLanguage: "hi",
    tags: [sub("kids-comedy", "silly-sketches"), sub("sports-play", "ball-games"), sub("kids-cooking", "easy-snacks"), sub("rhymes-songs", "action-songs")],
  }, buildTaxonomy());
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /at most 3 categories/);
});

test("Test 5 — Nursery Rhymes under Arts & Crafts is rejected", () => {
  const r = validateVideoTags({
    primaryLanguage: "hi",
    tags: [{ categoryId: "arts-crafts", subcategoryId: "rhymes-songs/nursery-rhymes" }],
  }, tax);
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /isn't part of Arts & Crafts/);
});

test("duplicate main category, missing subcategory and unknown category are rejected", () => {
  const r = validateVideoTags({
    primaryLanguage: "en",
    tags: [sub("animals", "farm-animals"), sub("animals", "wild-animals"), { categoryId: "nope", subcategoryId: "x" }],
  }, tax);
  assert.equal(r.ok, false);
  const msgs = r.errors.map(e => e.message).join(" | ");
  assert.match(msgs, /already selected/);
  assert.match(msgs, /Choose a category/);
});

test("old adult categories can't be used for new uploads", () => {
  const r = validateVideoTags({ primaryLanguage: "hi", tags: [{ categoryId: "comedy-jokes", subcategoryId: "comedy-jokes/husband-wife-jokes" }] }, tax);
  assert.equal(r.ok, false);
});

test("Test 8 — inactive subcategory blocked for new tagging but kept on existing videos", () => {
  const input = { primaryLanguage: "hi", tags: [sub("kids-comedy", "puppet-shows")] };
  assert.equal(validateVideoTags(input, tax).ok, false);
  assert.equal(validateVideoTags(input, tax, { keepIds: new Set(["kids-comedy/puppet-shows"]) }).ok, true);
});

test("languages: primary required, at most two extra, primary not repeated", () => {
  assert.equal(validateVideoTags({ tags: [sub("animals", "farm-animals")] }, tax).ok, false);
  const tooMany = validateVideoTags({ primaryLanguage: "hi", additionalLanguages: ["en", "bn", "ta"], tags: [sub("animals", "farm-animals")] }, tax);
  assert.equal(tooMany.ok, false);
  const dedup = validateVideoTags({ primaryLanguage: "hi", additionalLanguages: ["hi", "en", "en"], tags: [sub("animals", "farm-animals")] }, tax);
  assert.equal(dedup.ok, true);
  assert.deepEqual(dedup.value!.languages.map(l => l.code), ["hi", "en"]);
  assert.equal(validateVideoTags({ primaryLanguage: "klingon", tags: [sub("animals", "farm-animals")] }, tax).ok, false);
});
