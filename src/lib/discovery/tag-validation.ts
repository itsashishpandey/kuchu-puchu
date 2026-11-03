// Server-side validation for a video's languages and category tags (pure; unit-tested).
// Rules (spec §2, §4): one primary language + up to two genuinely spoken additional languages;
// 1–3 DISTINCT main categories, each with exactly one subcategory that belongs to it; no inactive,
// retired or unknown selections (except ones already on the video, which editors may keep).
import type { Taxonomy } from "./types";

export type TagInput = {
  primaryLanguage?: string | null; // language code
  additionalLanguages?: string[] | null; // language codes
  tags?: { categoryId?: string | null; subcategoryId?: string | null }[] | null; // order = priority
};

export type TagError = { field: "languages" | "tags"; message: string; index?: number };

export type ValidTags = {
  languages: { languageId: string; code: string; position: number; isPrimary: boolean }[];
  tags: { categoryId: string; subcategoryId: string; priority: number }[];
};

export const MAX_CATEGORIES = 3;
export const MAX_ADDITIONAL_LANGUAGES = 2;

export function validateVideoTags(
  input: TagInput,
  taxonomy: Taxonomy,
  opts: { keepIds?: Set<string> } = {},
): { ok: true; value: ValidTags; errors: [] } | { ok: false; value: null; errors: TagError[] } {
  const errors: TagError[] = [];
  const keep = opts.keepIds ?? new Set<string>();
  const langByCode = new Map(taxonomy.languages.map(l => [l.code.toLowerCase(), l]));
  const catById = new Map(taxonomy.categories.map(c => [c.id, c]));
  const subById = new Map(taxonomy.categories.flatMap(c => c.subcategories.map(s => [s.id, s] as const)));

  // ── languages ──
  const languages: ValidTags["languages"] = [];
  const primaryCode = (input.primaryLanguage ?? "").trim().toLowerCase();
  if (!primaryCode) {
    errors.push({ field: "languages", message: "Choose the main language spoken in your video." });
  } else {
    const l = langByCode.get(primaryCode);
    if (!l) errors.push({ field: "languages", message: `"${input.primaryLanguage}" isn't a supported language.` });
    else if (!l.active && !keep.has(l.id)) errors.push({ field: "languages", message: `${l.nameEn} isn't available for new videos right now.` });
    else languages.push({ languageId: l.id, code: l.code, position: 1, isPrimary: true });
  }
  const extra = (input.additionalLanguages ?? []).map(c => String(c).trim().toLowerCase()).filter(Boolean);
  const extraUnique = [...new Set(extra)].filter(c => c !== primaryCode);
  if (extraUnique.length > MAX_ADDITIONAL_LANGUAGES) {
    errors.push({ field: "languages", message: "Add at most 2 extra languages — only ones actually spoken in the video." });
  } else {
    extraUnique.forEach((code, i) => {
      const l = langByCode.get(code);
      if (!l) errors.push({ field: "languages", message: `"${code}" isn't a supported language.` });
      else if (!l.active && !keep.has(l.id)) errors.push({ field: "languages", message: `${l.nameEn} isn't available for new videos right now.` });
      else languages.push({ languageId: l.id, code: l.code, position: i + 2, isPrimary: false });
    });
  }

  // ── category tags ──
  const raw = (input.tags ?? []).filter(t => t && (t.categoryId || t.subcategoryId));
  const tags: ValidTags["tags"] = [];
  if (raw.length === 0) {
    errors.push({ field: "tags", message: "Pick at least one category and subcategory." });
  } else if (raw.length > MAX_CATEGORIES) {
    errors.push({ field: "tags", message: "A video can have at most 3 categories. Remove one to continue." });
  } else {
    const seen = new Set<string>();
    raw.forEach((t, i) => {
      const cat = t.categoryId ? catById.get(t.categoryId) : undefined;
      const sub = t.subcategoryId ? subById.get(t.subcategoryId) : undefined;
      if (!cat) { errors.push({ field: "tags", index: i, message: "Choose a category." }); return; }
      if ((!cat.active || cat.retired) && !keep.has(cat.id)) {
        errors.push({ field: "tags", index: i, message: `${cat.nameEn} is no longer available — pick another category.` });
        return;
      }
      if (seen.has(cat.id)) {
        errors.push({ field: "tags", index: i, message: `${cat.nameEn} is already selected — each category can be used once.` });
        return;
      }
      seen.add(cat.id);
      if (!sub) { errors.push({ field: "tags", index: i, message: `Choose a subcategory for ${cat.nameEn}.` }); return; }
      if (sub.categoryId !== cat.id) {
        errors.push({ field: "tags", index: i, message: `"${sub.nameEn}" isn't part of ${cat.nameEn}. Choose a subcategory from that category.` });
        return;
      }
      if ((!sub.active || sub.retired) && !keep.has(sub.id)) {
        errors.push({ field: "tags", index: i, message: `"${sub.nameEn}" is no longer available — pick another subcategory.` });
        return;
      }
      tags.push({ categoryId: cat.id, subcategoryId: sub.id, priority: tags.length + 1 });
    });
  }

  if (errors.length) return { ok: false, value: null, errors };
  return { ok: true, value: { languages, tags }, errors: [] };
}
