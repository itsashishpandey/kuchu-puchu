// Upload-time suggestions (pure). Suggestions only — creators confirm or change them, and nothing
// is ever applied automatically (spec §2, §4). No transcript/audio analysis exists, so this uses
// the title, description and hashtags: Unicode-script detection + keyword/synonym matching.
import type { Taxonomy } from "./types";
import { stem, stems, normalize, GENERIC } from "./text.ts";

export type LanguageSuggestion = { code: string; confidence: "high" | "medium" | "low"; reason: string };
export type CategorySuggestion = {
  categoryId: string; categorySlug: string; categoryName: string;
  subcategoryId: string; subcategoryName: string; score: number; matched: string[];
};

// ── language detection ──────────────────────────────────────────────────────

const SCRIPT_RANGES: [RegExp, string[], string][] = [
  [/[ऀ-ॿ]/g, ["hi", "mr", "ne", "bho", "raj", "bgc"], "Devanagari script"],
  [/[ঀ-৿]/g, ["bn", "as"], "Bengali script"],
  [/[਀-੿]/g, ["pa"], "Gurmukhi script"],
  [/[઀-૿]/g, ["gu"], "Gujarati script"],
  [/[଀-୿]/g, ["or"], "Odia script"],
  [/[஀-௿]/g, ["ta"], "Tamil script"],
  [/[ఀ-౿]/g, ["te"], "Telugu script"],
  [/[ಀ-೿]/g, ["kn"], "Kannada script"],
  [/[ഀ-ൿ]/g, ["ml"], "Malayalam script"],
  [/[඀-෿]/g, ["si"], "Sinhala script"],
  [/[฀-๿]/g, ["th"], "Thai script"],
  [/[຀-໿]/g, ["lo"], "Lao script"],
  [/[ༀ-࿿]/g, ["bo"], "Tibetan script"],
  [/[က-႟]/g, ["my"], "Myanmar script"],
  [/[Ⴀ-ჿ]/g, ["ka"], "Georgian script"],
  [/[ሀ-፿]/g, ["am", "ti"], "Ethiopic script"],
  [/[ក-៿]/g, ["km"], "Khmer script"],
  [/[가-힯ᄀ-ᇿ]/g, ["ko"], "Hangul"],
  [/[぀-ヿ]/g, ["ja"], "Japanese kana"],
  [/[一-鿿]/g, ["zh-Hans", "ja"], "Chinese characters"],
  [/[֐-׿]/g, ["he"], "Hebrew script"],
  [/[԰-֏]/g, ["hy"], "Armenian script"],
  [/[Ͱ-Ͽ]/g, ["el"], "Greek script"],
  [/[Ѐ-ӿ]/g, ["ru", "uk", "bg", "sr", "mk", "kk", "ky", "tg", "mn"], "Cyrillic script"],
  [/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g, ["ar", "ur", "fa", "ps", "sd", "ug", "pnb"], "Arabic script"],
];

// distinguishing letters inside a shared script
const ARABIC_HINTS: [RegExp, string][] = [
  [/[ۆۇۈېئ]/, "ug"], [/[ڄڃڇڌڏڙٺ]/, "sd"], [/[ټډړښږځڅ]/, "ps"], [/[ےٹڈڑںھ]/, "ur"], [/[پچژگ]/, "fa"],
];
const CYRILLIC_HINTS: [RegExp, string][] = [
  [/[әғқңұһ]/i, "kk"], [/[іїєґ]/i, "uk"], [/[ђћџ]/i, "sr"], [/[ѓќѕ]/i, "mk"], [/[ңөү]/i, "ky"], [/[ҷӣӯҳқ]/i, "tg"],
];

// frequent words in romanized text (Latin script) — weak signals
const LATIN_HINTS: Record<string, string[]> = {
  hi: ["hai", "kya", "nahi", "nahin", "bhai", "yaar", "mera", "meri", "tum", "kaise", "kyun", "acha", "accha", "bahut", "wala", "wali", "dekho", "ghar", "pyaar", "desi", "chalo", "aaj", "bachcho", "bachon", "bacchon", "kahani", "seekho", "seekhenge"],
  en: ["the", "and", "with", "this", "that", "you", "how", "what", "when", "my", "your", "funny", "best", "easy", "learn"],
  es: ["el", "los", "las", "que", "para", "con", "una", "muy", "como", "pero"],
  fr: ["les", "est", "pour", "avec", "une", "dans", "très", "comment", "mais", "nous"],
  pt: ["você", "não", "uma", "para", "com", "muito", "como", "isso"],
  id: ["yang", "dan", "ini", "itu", "dengan", "untuk", "tidak", "saya"],
  de: ["und", "der", "die", "das", "ist", "nicht", "mit", "ein", "eine"],
  tr: ["bir", "için", "çok", "ama", "nasıl", "ile"],
};

export function detectLanguages(text: string, taxonomy: Taxonomy): LanguageSuggestion[] {
  const out: LanguageSuggestion[] = [];
  const add = (code: string, confidence: LanguageSuggestion["confidence"], reason: string) => {
    if (!out.some(o => o.code === code) && taxonomy.languages.some(l => l.code === code && l.active)) out.push({ code, confidence, reason });
  };

  // 1) explicit mentions: "#hindi", "in tamil", "हिन्दी"
  const lower = normalize(text);
  for (const l of taxonomy.languages) {
    const names = [l.nameEn.toLowerCase(), ...l.aliases, l.nameNative.toLowerCase()];
    if (names.some(n => n.length >= 4 && new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`, "u").test(lower))) {
      add(l.code, "medium", `mentions "${l.nameEn}"`);
    }
  }

  // 2) script detection (strongest signal)
  const counts = SCRIPT_RANGES.map(([re, codes, reason]) => ({ n: (text.match(re) || []).length, codes, reason }))
    .filter(x => x.n > 0).sort((a, b) => b.n - a.n);
  for (const s of counts.slice(0, 2)) {
    let first = s.codes[0];
    if (s.codes.includes("ur")) first = ARABIC_HINTS.find(([re]) => re.test(text))?.[1] ?? "ar";
    if (s.codes.includes("ru")) first = CYRILLIC_HINTS.find(([re]) => re.test(text))?.[1] ?? "ru";
    if (s.codes.includes("zh-Hans") && /[぀-ヿ]/.test(text)) first = "ja";
    const others = s.codes.filter(c => c !== first);
    add(first, "high", others.length ? `${s.reason} (could also be ${others.slice(0, 3).join(", ")})` : s.reason);
  }

  // 3) romanized hints (Latin script only)
  if (/[a-z]/i.test(text)) {
    const words = new Set(lower.split(" "));
    const scored = Object.entries(LATIN_HINTS)
      .map(([code, list]) => ({ code, hits: list.filter(w => words.has(w)).length }))
      .filter(x => x.hits >= 2).sort((a, b) => b.hits - a.hits);
    for (const s of scored.slice(0, 2)) add(s.code, "low", s.code === "hi" ? "romanized Hindi words" : "common words in the text");
  }
  return out.slice(0, 3);
}

// ── category suggestions ────────────────────────────────────────────────────

export function suggestCategories(text: string, taxonomy: Taxonomy, limit = 3): CategorySuggestion[] {
  const words = stems(text);
  if (!words.length) return [];
  const wordSet = new Set(words);
  const phrase = " " + words.join(" ") + " ";
  const hasPhrase = (p: string) => {
    const ps = stems(p);
    return ps.length > 0 && phrase.includes(" " + ps.join(" ") + " ");
  };

  const perCategory: CategorySuggestion[] = [];
  for (const c of taxonomy.categories) {
    if (!c.active || c.retired) continue;
    const catMatched = c.keywords.filter(hasPhrase);
    const catScore = catMatched.length;
    let best: CategorySuggestion | null = null;
    for (const s of c.subcategories) {
      if (!s.active || s.retired) continue;
      const nameTokens = stems(s.nameEn);
      const distinctive = nameTokens.filter(t => !GENERIC.has(t) && !GENERIC.has(t + "s"));
      const generic = nameTokens.filter(t => !distinctive.includes(t));
      const matchedD = distinctive.filter(t => wordSet.has(t));
      const matchedG = generic.filter(t => wordSet.has(t));
      const kw = s.keywords.filter(hasPhrase);
      let score = matchedD.length * 2 + matchedG.length + kw.length * 3;
      // a partial match of a multi-word name is weaker than a full one
      if (distinctive.length > 1 && matchedD.length > 0 && matchedD.length < distinctive.length) score -= 1;
      if (score <= 0) continue;
      const total = score + catScore;
      if (!best || total > best.score) {
        best = {
          categoryId: c.id, categorySlug: c.slug, categoryName: c.name, subcategoryId: s.id, subcategoryName: s.name,
          score: total, matched: [...new Set([...matchedD, ...matchedG, ...kw, ...catMatched])],
        };
      }
    }
    if (!best && catScore >= 1) {
      // category clearly mentioned but no subcategory matched → suggest its first subcategory
      const s = c.subcategories.find(x => x.active && !x.retired);
      if (s) best = {
        categoryId: c.id, categorySlug: c.slug, categoryName: c.name, subcategoryId: s.id, subcategoryName: s.name,
        score: catScore, matched: catMatched,
      };
    }
    if (best && best.score >= 2) perCategory.push(best);
  }
  return perCategory.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Flag likely-misleading language tags: the text is clearly in a script the creator didn't tag. */
export function languageMismatch(text: string, taggedCodes: string[], taxonomy: Taxonomy): string | null {
  const detected = detectLanguages(text, taxonomy).filter(d => d.confidence === "high");
  if (!detected.length) return null;
  const tagged = new Set(taggedCodes);
  const scriptOf = (code: string) => taxonomy.languages.find(l => l.code === code)?.script;
  const taggedScripts = new Set(taggedCodes.map(scriptOf));
  const offending = detected.find(d => !tagged.has(d.code) && !taggedScripts.has(scriptOf(d.code)));
  if (!offending) return null;
  const l = taxonomy.languages.find(x => x.code === offending.code);
  return `Title/description look like ${l?.nameEn ?? offending.code} (${offending.reason}), which isn't among the tagged languages.`;
}

export { stem };
