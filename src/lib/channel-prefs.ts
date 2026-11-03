// A creator channel's preferred categories and publishing languages (shown on the channel page,
// used to pre-fill the upload form). Purely descriptive: videos are still tagged one by one.
import { db } from "@/lib/db";
import type { Taxonomy } from "@/lib/discovery/types";
import { selectable, resolveFilterParams } from "@/lib/taxonomy";

export const MAX_CHANNEL_CATEGORIES = 5;
export const MAX_CHANNEL_LANGUAGES = 3;

/** Accepts ids, slugs, English names, or (old forms) a legacy kids category name. */
export function resolveChannelCategories(t: Taxonomy, values: unknown[]): string[] {
  const sel = selectable(t);
  const ids: string[] = [];
  for (const v of values) {
    if (typeof v !== "string" || !v.trim()) continue;
    const r = resolveFilterParams(t, v.trim(), null);
    const id = r.categoryId;
    if (id && sel.categories.some(c => c.id === id) && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, MAX_CHANNEL_CATEGORIES);
}

export function resolveChannelLanguages(t: Taxonomy, values: unknown[]): string[] {
  const byCode = new Map(selectable(t).languages.map(l => [l.code, l.id]));
  const ids: string[] = [];
  for (const v of values) {
    const id = typeof v === "string" ? byCode.get(v.trim()) : undefined;
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, MAX_CHANNEL_LANGUAGES);
}

/** Parse a form/JSON field that may be a JSON array, a comma list, or an array. */
export function listParam(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string" || !v.trim()) return [];
  const s = v.trim();
  if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch { return []; } }
  return s.split(",");
}

export async function setChannelPreferences(channelId: string, categoryIds: string[] | null, languageIds: string[] | null) {
  await db.$transaction(async tx => {
    if (categoryIds) {
      await tx.channelCategoryPreference.deleteMany({ where: { channelId } });
      for (const categoryId of categoryIds) await tx.channelCategoryPreference.create({ data: { channelId, categoryId } });
    }
    if (languageIds) {
      await tx.channelLanguage.deleteMany({ where: { channelId } });
      for (const languageId of languageIds) await tx.channelLanguage.create({ data: { channelId, languageId } });
    }
  });
}

export async function getChannelPreferences(channelId: string, t: Taxonomy) {
  const [cats, langs] = await Promise.all([
    db.channelCategoryPreference.findMany({ where: { channelId }, orderBy: { createdAt: "asc" } }),
    db.channelLanguage.findMany({ where: { channelId }, orderBy: { createdAt: "asc" }, include: { language: true } }),
  ]);
  return {
    preferredCategories: cats.map(c => {
      const cat = t.categories.find(x => x.id === c.categoryId);
      return { id: c.categoryId, slug: cat?.slug ?? "", name: cat?.name ?? "", emoji: cat?.emoji ?? null };
    }),
    languages: langs.map(l => ({ code: l.language.code, nameEn: l.language.nameEn, nameNative: l.language.nameNative })),
  };
}
