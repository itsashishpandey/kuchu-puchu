// Builds an in-memory Taxonomy from the real seed data (ids = slugs) for pure-logic tests.
import { LANGUAGES, CATEGORIES, LANGUAGE_ALIASES } from "../../prisma/discovery-data.mjs";
import type { Taxonomy } from "../../src/lib/discovery/types.ts";

export function buildTaxonomy(overrides: { inactiveSub?: string[]; inactiveCat?: string[] } = {}): Taxonomy {
  return {
    languages: LANGUAGES.map((l: any) => ({
      id: `lang:${l.code}`, code: l.code, nameEn: l.nameEn, nameNative: l.nameNative, script: l.script,
      direction: l.direction, group: l.group, popular: l.popular, priority: l.priority, active: true,
      aliases: (LANGUAGE_ALIASES as Record<string, string[]>)[l.code] ?? [],
    })),
    categories: CATEGORIES.map((c: any) => ({
      id: c.slug, slug: c.slug, name: c.name, nameEn: c.name, emoji: c.emoji, color: c.color, coverImageUrl: null,
      description: c.description ?? null, active: !(overrides.inactiveCat ?? []).includes(c.slug), retired: false,
      keywords: c.keywords, sortOrder: c.sortOrder,
      subcategories: c.subcategories.map((s: any) => ({
        id: `${c.slug}/${s.slug}`, slug: s.slug, name: s.name, nameEn: s.name, categoryId: c.slug, emoji: s.emoji,
        active: !(overrides.inactiveSub ?? []).includes(`${c.slug}/${s.slug}`), retired: false, keywords: s.keywords, sortOrder: s.sortOrder,
      })),
    })),
  };
}

export const sub = (cat: string, slug: string) => ({ categoryId: cat, subcategoryId: `${cat}/${slug}` });
