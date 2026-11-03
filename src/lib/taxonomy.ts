// Taxonomy (languages + categories + subcategories) loaded from the database, localized, cached
// in memory (stable data) and invalidated whenever an admin changes it.
import { db } from "@/lib/db";
import type { Taxonomy, TaxCategory, TaxLanguage, TaxSubcategory } from "@/lib/discovery/types";
import { LANGUAGE_ALIASES } from "../../prisma/discovery-data.mjs";

const TTL_MS = 5 * 60_000;
type Entry = { at: number; value: Taxonomy };
const cache = new Map<string, Entry>();
let countsCache: { at: number; categories: Map<string, number>; subcategories: Map<string, number>; languages: Map<string, number> } | null = null;

/** Video counts only (after tag edits); names/structure stay cached. */
export function clearTaxonomyCounts() { countsCache = null; }

export function invalidateTaxonomy() {
  cache.clear();
  countsCache = null;
}

function parseList(json: string | null | undefined): string[] {
  try { const v = JSON.parse(json || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}

export async function interfaceLocales(): Promise<{ code: string; name: string; nameNative: string }[]> {
  const row = await db.platformSetting.findUnique({ where: { key: "interfaceLocales" } });
  try { const v = JSON.parse(row?.value || "[]"); if (Array.isArray(v) && v.length) return v; } catch { /* default */ }
  return [{ code: "en", name: "English", nameNative: "English" }];
}

/** Full taxonomy (including inactive/retired items — callers filter), with names in `locale`. */
export async function loadTaxonomy(locale = "en"): Promise<Taxonomy> {
  const key = locale || "en";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const [languages, categories, translations] = await Promise.all([
    db.language.findMany({ orderBy: [{ priority: "asc" }, { nameEn: "asc" }] }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } } }),
    key === "en" ? Promise.resolve([]) : db.categoryTranslation.findMany({ where: { locale: key } }),
  ]);
  const tCat = new Map(translations.filter(t => t.categoryId).map(t => [t.categoryId!, t]));
  const tSub = new Map(translations.filter(t => t.subcategoryId).map(t => [t.subcategoryId!, t]));
  const aliases = LANGUAGE_ALIASES as Record<string, string[]>;

  const value: Taxonomy = {
    languages: languages.map<TaxLanguage>(l => ({
      id: l.id, code: l.code, nameEn: l.nameEn, nameNative: l.nameNative, script: l.script, direction: l.direction,
      group: l.group, popular: l.popular, priority: l.priority, active: l.active, aliases: aliases[l.code] ?? [],
    })),
    categories: categories.map<TaxCategory>(c => ({
      id: c.id, slug: c.slug, name: tCat.get(c.id)?.name ?? c.name, nameEn: c.name, emoji: c.emoji, color: c.color,
      coverImageUrl: c.coverImageUrl, description: tCat.get(c.id)?.description ?? c.description, active: c.active,
      retired: !!c.retiredAt, keywords: parseList(c.keywords), sortOrder: c.sortOrder, mergedIntoId: c.mergedIntoId,
      subcategories: c.subcategories.map(s => ({
        id: s.id, slug: s.slug, name: tSub.get(s.id)?.name ?? s.name, nameEn: s.name, categoryId: c.id, emoji: s.emoji,
        active: s.active, retired: !!s.retiredAt, keywords: parseList(s.keywords), sortOrder: s.sortOrder, mergedIntoId: s.mergedIntoId,
      })),
    })),
  };
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Only what viewers/creators may pick: active, not retired (categories without active subs hidden). */
export function selectable(t: Taxonomy): Taxonomy {
  return {
    languages: t.languages.filter(l => l.active),
    categories: t.categories
      .filter(c => c.active && !c.retired)
      .map(c => ({ ...c, subcategories: c.subcategories.filter(s => s.active && !s.retired) }))
      .filter(c => c.subcategories.length > 0),
  };
}

/** Approved-video counts per category / subcategory / language (cached 60 s). */
export async function taxonomyCounts() {
  if (countsCache && Date.now() - countsCache.at < 60_000) return countsCache;
  const approved = { video: { status: "APPROVED" } };
  const [cats, subs, langs] = await Promise.all([
    db.videoCategoryAssignment.groupBy({ by: ["categoryId"], where: approved, _count: { _all: true } }),
    db.videoCategoryAssignment.groupBy({ by: ["subcategoryId"], where: approved, _count: { _all: true } }),
    db.videoLanguage.groupBy({ by: ["languageId"], where: approved, _count: { _all: true } }),
  ]);
  countsCache = {
    at: Date.now(),
    categories: new Map(cats.map(c => [c.categoryId, c._count._all])),
    subcategories: new Map(subs.map(s => [s.subcategoryId, s._count._all])),
    languages: new Map(langs.map(l => [l.languageId, l._count._all])),
  };
  return countsCache;
}

export function findCategory(t: Taxonomy, slugOrIdOrName: string | null | undefined) {
  if (!slugOrIdOrName) return null;
  const k = slugOrIdOrName.toLowerCase();
  return t.categories.find(c => c.id === slugOrIdOrName || c.slug === k || c.nameEn.toLowerCase() === k || c.name.toLowerCase() === k) ?? null;
}

export function findSubcategory(t: Taxonomy, slugOrId: string | null | undefined, categoryId?: string | null) {
  if (!slugOrId) return null;
  const k = slugOrId.toLowerCase();
  for (const c of t.categories) {
    if (categoryId && c.id !== categoryId) continue;
    const s = c.subcategories.find(x => x.id === slugOrId || x.slug === k || x.nameEn.toLowerCase() === k);
    if (s) return s;
  }
  return null;
}

/**
 * Feed/explore filter params → ids. Follows merges of retired categories/subcategories (old links
 * keep working) and accepts the old category *names* that 2026 builds of the app send
 * (e.g. "Nursery Rhymes" → Kids & Cartoons › Nursery Rhymes). Anything unknown stays a legacy label.
 */
export function resolveFilterParams(t: Taxonomy, catParam: string | null | undefined, subParam: string | null | undefined) {
  const subById = (id: string) => t.categories.flatMap(c => c.subcategories).find(s => s.id === id) ?? null;
  const followSub = (s: TaxSubcategory | null) => {
    for (let i = 0; s && s.retired && s.mergedIntoId && i < 5; i++) s = subById(s.mergedIntoId) ?? s;
    return s;
  };
  let cat: TaxCategory | null = findCategory(t, catParam);
  let mergedSub: TaxSubcategory | null = null;
  for (let i = 0; cat && cat.retired && cat.mergedIntoId && i < 5; i++) {
    if (cat.mergedIntoId.startsWith("sub:")) {
      mergedSub = followSub(subById(cat.mergedIntoId.slice(4)));
      cat = mergedSub ? t.categories.find(c => c.id === mergedSub!.categoryId) ?? null : null;
      break;
    }
    cat = t.categories.find(c => c.id === cat!.mergedIntoId) ?? cat;
  }
  let sub = followSub(findSubcategory(t, subParam, cat?.id)) ?? mergedSub;
  let legacyCategory: string | null = null;
  if (!cat && catParam) {
    sub = sub ?? followSub(findSubcategory(t, catParam));
    if (sub) cat = t.categories.find(c => c.id === sub!.categoryId) ?? null;
    else legacyCategory = catParam.slice(0, 80);
  }
  return { category: cat, subcategory: sub, categoryId: cat?.id ?? null, subcategoryId: sub?.id ?? null, legacyCategory };
}

export function languageCodesFromParam(t: Taxonomy, param: string | null | undefined): string[] {
  if (!param) return [];
  const known = new Set(t.languages.filter(l => l.active).map(l => l.code));
  return [...new Set(param.split(",").map(s => s.trim()).filter(c => known.has(c)))].slice(0, 20);
}
