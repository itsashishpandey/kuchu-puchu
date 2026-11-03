// Unified search query interpretation (pure; unit-tested). Spec §14:
// "Hindi nursery rhymes" → language Hindi + subcategory Nursery Rhymes (parent Rhymes & Songs).
// Exact matches are applied as filters; near-misses (typos) are only offered as suggestions so the
// user's intended language/category is never silently changed.
import type { Taxonomy, TaxCategory, TaxSubcategory } from "./types";
import { tokens, stem, editDistance, typoBudget, GENERIC } from "./text.ts";

export type Interpretation = {
  languageCodes: string[];
  categoryId: string | null;
  subcategoryId: string | null;
  textTerms: string[];
  // token = the words in the query this suggestion is about (so a UI can swap them for the filter)
  suggestions: { type: "language" | "category" | "subcategory"; id: string; label: string; reason: string; token: string; categoryId: string | null }[];
};

// source "name" = the official category/subcategory name; "keyword" = a synonym. A lone synonym
// only becomes a filter when it's the whole query; otherwise it's offered as a suggestion.
type Phrase = {
  words: string[]; kind: "language" | "category" | "subcategory"; id: string; label: string;
  categoryId?: string; distinct: string[]; source: "name" | "keyword";
};

function phrasesFor(taxonomy: Taxonomy): Phrase[] {
  const out: Phrase[] = [];
  for (const l of taxonomy.languages) {
    if (!l.active) continue;
    const names = new Set([l.nameEn.toLowerCase().replace(/\s*\(.*?\)\s*/g, " ").trim(), ...l.aliases, l.nameNative.toLowerCase()]);
    for (const n of names) {
      const words = tokens(n, { keepStop: true });
      if (words.length) out.push({ words, kind: "language", id: l.code, label: l.nameEn, distinct: words, source: "name" });
    }
  }
  for (const c of taxonomy.categories) {
    if (!c.active || c.retired) continue;
    [c.nameEn, ...c.keywords].forEach((k, i) => {
      const words = tokens(k).map(stem);
      if (words.length) out.push({ words, kind: "category", id: c.id, label: c.name, distinct: words.filter(w => !GENERIC.has(w)), source: i === 0 ? "name" : "keyword" });
    });
    for (const s of c.subcategories) {
      if (!s.active || s.retired) continue;
      [s.nameEn, ...s.keywords].forEach((k, i) => {
        const words = tokens(k).map(stem);
        const distinct = words.filter(w => !GENERIC.has(w) && !GENERIC.has(w + "s"));
        if (words.length) out.push({ words, kind: "subcategory", id: s.id, label: s.name, categoryId: c.id, distinct: distinct.length ? distinct : words, source: i === 0 ? "name" : "keyword" });
      });
    }
  }
  return out;
}

const FILLER = new Set(["and", "or", "the", "of", "for", "in", "a", "an", "video", "videos", "ka", "ki", "ke"]);

export function interpretQuery(q: string, taxonomy: Taxonomy): Interpretation {
  const raw = tokens(q, { keepStop: true });
  const words = raw.map(stem);
  const used = new Set<number>();
  const result: Interpretation = { languageCodes: [], categoryId: null, subcategoryId: null, textTerms: [], suggestions: [] };
  const phrases = phrasesFor(taxonomy);
  const indexOfAll = (needle: string[]) => {
    const idx: number[] = [];
    for (const n of needle) {
      const i = words.findIndex((w, j) => w === n && !used.has(j) && !idx.includes(j));
      if (i === -1) return null;
      idx.push(i);
    }
    return idx;
  };

  // 1) languages (multi-word names first, e.g. "western punjabi", "haitian creole")
  for (const p of phrases.filter(x => x.kind === "language").sort((a, b) => b.words.length - a.words.length)) {
    const idx = indexOfAll(p.words.map(stem));
    if (idx && !result.languageCodes.includes(p.id)) { idx.forEach(i => used.add(i)); result.languageCodes.push(p.id); }
  }

  // A match from a single synonym only filters when nothing else meaningful is left in the query.
  const leftoverAfter = (idx: number[]) =>
    raw.filter((w, j) => !used.has(j) && !idx.includes(j) && !FILLER.has(w)).length;
  const offer = (p: Phrase, idx: number[]) => {
    if (!result.suggestions.some(s => s.id === p.id)) {
      result.suggestions.push({ type: p.kind, id: p.id, label: p.label, reason: `Filter by ${p.label}?`, token: idx.map(i => raw[i]).join(" "), categoryId: p.categoryId ?? null });
    }
  };

  // 2) subcategory: every distinctive word present; prefer more matched words, then fewer leftovers
  let bestSub: { p: Phrase; idx: number[]; score: number } | null = null;
  for (const p of phrases.filter(x => x.kind === "subcategory")) {
    const idx = indexOfAll(p.distinct);
    if (!idx) continue;
    const extra = p.words.filter(w => !p.distinct.includes(w)).map(w => words.findIndex((x, j) => x === w && !used.has(j) && !idx.includes(j))).filter(i => i >= 0);
    const score = idx.length * 2 + extra.length - (p.words.length - idx.length - extra.length) * 0.5 + (p.source === "name" ? 0.5 : 0);
    if (!bestSub || score > bestSub.score) bestSub = { p, idx: [...idx, ...extra], score };
  }
  if (bestSub && (bestSub.p.distinct.length >= 2 || bestSub.score >= 2)) {
    const lone = bestSub.p.source === "keyword" && bestSub.p.words.length === 1;
    if (lone && leftoverAfter(bestSub.idx) > 0) {
      offer(bestSub.p, bestSub.idx);
    } else {
      bestSub.idx.forEach(i => used.add(i));
      result.subcategoryId = bestSub.p.id;
      result.categoryId = bestSub.p.categoryId ?? null;
    }
  }

  // 3) category (if no subcategory pinned it already) — also consumes its keywords
  for (const p of phrases.filter(x => x.kind === "category").sort((a, b) => b.words.length - a.words.length)) {
    if (result.categoryId && result.categoryId !== p.id) continue;
    const idx = indexOfAll(p.words);
    if (!idx) continue;
    if (result.categoryId === p.id) { idx.forEach(i => used.add(i)); continue; } // e.g. "jokes" after a comedy subcategory
    const lone = p.source === "keyword" && p.words.length === 1 && !["cartoon", "rhyme", "song", "poem", "story", "comedy", "dance", "yoga", "science", "animal", "art", "craft", "toy", "cooking", "sport"].includes(p.words[0]);
    if (lone && leftoverAfter(idx) > 0) { offer(p, idx); continue; }
    idx.forEach(i => used.add(i));
    result.categoryId = p.id;
  }

  // 4) leftovers → text search, and typo suggestions (never auto-applied)
  raw.forEach((w, i) => {
    if (used.has(i)) return;
    if (FILLER.has(w)) return;
    result.textTerms.push(w);
    const budget = typoBudget(w.length);
    if (!budget) return;
    let best: { p: Phrase; d: number } | null = null;
    for (const p of phrases) {
      if (p.words.length !== 1) continue;
      if (p.kind === "language" && result.languageCodes.includes(p.id)) continue;
      const d = editDistance(stem(w), p.words[0], budget);
      if (d > 0 && d <= budget && (!best || d < best.d)) best = { p, d };
    }
    if (best && !result.suggestions.some(s => s.id === best!.p.id)) {
      result.suggestions.push({ type: best.p.kind, id: best.p.id, label: best.p.label, reason: `Did you mean ${best.p.label}?`, token: w, categoryId: best.p.categoryId ?? null });
    }
  });
  return result;
}

export function describeInterpretation(i: Interpretation, taxonomy: Taxonomy): {
  languages: { code: string; nameEn: string; nameNative: string }[];
  category: Pick<TaxCategory, "id" | "slug" | "name" | "emoji"> | null;
  subcategory: Pick<TaxSubcategory, "id" | "slug" | "name"> | null;
} {
  const cat = i.categoryId ? taxonomy.categories.find(c => c.id === i.categoryId) ?? null : null;
  const sub = cat && i.subcategoryId ? cat.subcategories.find(s => s.id === i.subcategoryId) ?? null : null;
  return {
    languages: i.languageCodes.map(code => {
      const l = taxonomy.languages.find(x => x.code === code)!;
      return { code, nameEn: l?.nameEn ?? code, nameNative: l?.nameNative ?? code };
    }),
    category: cat ? { id: cat.id, slug: cat.slug, name: cat.name, emoji: cat.emoji } : null,
    subcategory: sub ? { id: sub.id, slug: sub.slug, name: sub.name } : null,
  };
}
