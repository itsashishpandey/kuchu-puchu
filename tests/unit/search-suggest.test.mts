import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretQuery } from "../../src/lib/discovery/search-parse.ts";
import { suggestCategories, detectLanguages, languageMismatch } from "../../src/lib/discovery/suggest.ts";
import { normalizeRecoSettings } from "../../src/lib/discovery/reco-config.ts";
import { buildTaxonomy } from "./fixture.mts";

const tax = buildTaxonomy();

test('search: "Hindi nursery rhymes" → Hindi + Nursery Rhymes (Rhymes & Songs)', () => {
  const r = interpretQuery("Hindi nursery rhymes", tax);
  assert.deepEqual(r.languageCodes, ["hi"]);
  assert.equal(r.subcategoryId, "rhymes-songs/nursery-rhymes");
  assert.equal(r.categoryId, "rhymes-songs");
  assert.deepEqual(r.textTerms, []);
});

test("search: language + category keyword, subcategory keyword, leftovers as text", () => {
  const a = interpretQuery("tamil cooking", tax);
  assert.deepEqual(a.languageCodes, ["ta"]);
  assert.equal(a.categoryId, "kids-cooking");
  const b = interpretQuery("lullaby", tax);
  assert.equal(b.subcategoryId, "rhymes-songs/lullabies");
  const c = interpretQuery("panchatantra", tax);
  assert.equal(c.subcategoryId, "stories/folk-tales-panchatantra");
  const d = interpretQuery("bedtime story", tax);
  assert.equal(d.subcategoryId, "stories/bedtime-stories");
  const e = interpretQuery("rocket candy planet", tax);
  assert.deepEqual(e.textTerms, ["rocket", "candy", "planet"]);
});

test("search: typos are suggested, never silently applied", () => {
  const r = interpretQuery("hindhi cartoons", tax);
  assert.deepEqual(r.languageCodes, []);
  assert.equal(r.categoryId, "cartoons-animation");
  assert.ok(r.suggestions.some(s => s.type === "language" && s.id === "hi"), JSON.stringify(r.suggestions));
});

test("search: a lone synonym among other words is offered, not forced", () => {
  const r = interpretQuery("rocket trip to candy planet", tax);
  assert.equal(r.subcategoryId, null);
  assert.ok(r.suggestions.some(s => s.label === "Space Cartoons"), JSON.stringify(r.suggestions));
});

test('upload suggestions: "Funny Dinosaur Cartoon Adventure" → Cartoons first, Dinosaurs also offered', () => {
  const s = suggestCategories("Funny Dinosaur Cartoon Adventure", tax);
  assert.equal(s[0].categorySlug, "cartoons-animation");
  assert.ok(s.some(x => x.categorySlug === "science-nature" && x.subcategoryName === "Dinosaurs"), JSON.stringify(s));
  const r = suggestCategories("Twinkle Twinkle Little Star Nursery Rhyme", tax);
  assert.equal(r[0].subcategoryName, "Nursery Rhymes");
  assert.equal(suggestCategories("Learn Colours and Shapes with Balloons", tax)[0].subcategoryName, "Colours & Shapes");
});

test("language detection by script, with a suggestion only", () => {
  assert.equal(detectLanguages("मछली जल की रानी है", tax)[0].code, "hi");
  assert.equal(detectLanguages("தமிழ் குழந்தை பாடல்கள்", tax)[0].code, "ta");
  assert.equal(detectLanguages("بچوں کی نظمیں", tax)[0].code, "ur");
  assert.equal(detectLanguages("Как приготовить борщ", tax)[0].code, "ru");
  assert.equal(detectLanguages("Chalo bachcho, aaj hum ginti seekhenge", tax)[0].code, "hi");
  assert.equal(detectLanguages("Easy tamil rhymes #tamil", tax)[0].code, "ta");
});

test("Test 10 helper — a Hindi-script title tagged only English is flagged for review", () => {
  assert.match(languageMismatch("मछली जल की रानी है", ["en"], tax) ?? "", /Hindi/);
  assert.equal(languageMismatch("मछली जल की रानी है", ["hi"], tax), null);
  assert.equal(languageMismatch("Funny animal songs", ["hi"], tax), null, "Latin text alone never flags");
});

test("recommendation settings are clamped to safe limits", () => {
  const { settings, adjustments } = normalizeRecoSettings({ weights: { subcategory: 99, category: 25, engagement: -5 }, maxPerCreatorPerPage: 50 });
  assert.equal(settings.weights.subcategory, 60);
  assert.equal(settings.weights.engagement, 0);
  assert.equal(settings.maxPerCreatorPerPage, 5);
  assert.ok(adjustments.length >= 3);
  const relevance = normalizeRecoSettings({ weights: { subcategory: 5, category: 5 } });
  assert.equal(relevance.settings.weights.subcategory, 40);
});
