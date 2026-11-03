// Shared shapes for the discovery modules. Type-only file (erased at runtime), so the pure modules
// in this folder can be unit-tested with `node --test` without a bundler.

export type TaxSubcategory = {
  id: string;
  slug: string;
  name: string; // localized display name
  nameEn: string;
  categoryId: string;
  emoji: string | null;
  active: boolean;
  retired: boolean;
  keywords: string[];
  sortOrder: number;
  mergedIntoId?: string | null; // subcategory id it was merged into
};

export type TaxCategory = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  emoji: string | null;
  color: string | null;
  coverImageUrl: string | null;
  description: string | null;
  active: boolean;
  retired: boolean;
  keywords: string[];
  sortOrder: number;
  mergedIntoId?: string | null; // category id, or "sub:<subcategoryId>"
  subcategories: TaxSubcategory[];
};

export type TaxLanguage = {
  id: string;
  code: string;
  nameEn: string;
  nameNative: string;
  script: string;
  direction: "LTR" | "RTL" | string;
  group: string;
  popular: boolean;
  priority: number;
  active: boolean;
  aliases: string[];
};

export type Taxonomy = {
  categories: TaxCategory[];
  languages: TaxLanguage[];
};

export type RecoSettings = {
  weights: { subcategory: number; category: number; engagement: number; recency: number; discovery: number };
  followBoost: number;
  learnedAffinity: number;
  recencyHalfLifeDays: number;
  maxPerCreatorPerPage: number;
  pageSize: number;
  discoveryShare: number;
  newCreatorDays: number;
  newCreatorBoost: number;
  watchedPenalty: number;
  notInterestedCreatorPenalty: number;
  notInterestedSubcategoryPenalty: number;
  otherLanguagePenalty: number;
  minQuality: { excludeHighFraudFlags: boolean; maxReportsBeforeHidden: number };
};
