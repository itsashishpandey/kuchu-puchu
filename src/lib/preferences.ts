// Viewer language & interest preferences, onboarding progress, and the ranking profile.
import { db } from "@/lib/db";
import type { Taxonomy } from "@/lib/discovery/types";
import { emptyProfile, type Profile } from "@/lib/discovery/rank";
import { loadTaxonomy, selectable } from "@/lib/taxonomy";

const DAY = 864e5;

export async function getPreferences(userId: string, locale = "en") {
  const [langs, cats, subs, reco, tax] = await Promise.all([
    db.userLanguagePreference.findMany({ where: { userId }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], include: { language: true } }),
    db.userCategoryPreference.findMany({ where: { userId } }),
    db.userSubcategoryPreference.findMany({ where: { userId } }),
    db.userRecommendationPreference.findUnique({ where: { userId } }),
    loadTaxonomy(locale),
  ]);
  const catById = new Map(tax.categories.map(c => [c.id, c]));
  const subById = new Map(tax.categories.flatMap(c => c.subcategories.map(s => [s.id, s] as const)));
  let draft: unknown = null;
  try { draft = reco?.onboardingDraft ? JSON.parse(reco.onboardingDraft) : null; } catch { draft = null; }
  return {
    languages: langs.map(l => ({ code: l.language.code, nameEn: l.language.nameEn, nameNative: l.language.nameNative, direction: l.language.direction, isPrimary: l.isPrimary })),
    categories: cats.map(c => {
      const cat = catById.get(c.categoryId);
      return { id: c.categoryId, slug: cat?.slug ?? "", name: cat?.name ?? "", emoji: cat?.emoji ?? null, color: cat?.color ?? null, allSubcategories: c.allSubcategories };
    }),
    subcategories: subs.map(s => {
      const sub = subById.get(s.subcategoryId);
      const cat = sub ? catById.get(sub.categoryId) : undefined;
      return { id: s.subcategoryId, slug: sub?.slug ?? "", name: sub?.name ?? "", categoryId: sub?.categoryId ?? "", categorySlug: cat?.slug ?? "" };
    }),
    discoverOtherLanguages: reco?.discoverOtherLanguages ?? false,
    interfaceLocale: reco?.interfaceLocale ?? "en",
    onboarding: { completed: !!reco?.onboardingCompletedAt, step: reco?.onboardingStep ?? 0, draft },
    prefsVersion: reco?.prefsVersion ?? 0,
  };
}

export type PreferencesInput = {
  languages?: string[]; // codes, ordered
  primaryLanguage?: string;
  categories?: { id: string; allSubcategories?: boolean }[];
  subcategoryIds?: string[];
  discoverOtherLanguages?: boolean;
  interfaceLocale?: string;
  completeOnboarding?: boolean;
};

export function validatePreferences(input: PreferencesInput, t: Taxonomy, allowedLocales: string[]) {
  const errors: string[] = [];
  const sel = selectable(t);
  const langByCode = new Map(sel.languages.map(l => [l.code, l]));
  const codes = [...new Set((input.languages ?? []).map(String))].filter(c => langByCode.has(c)).slice(0, 30);
  if (!codes.length) errors.push("Choose at least one language you'd like to watch.");
  const primary = input.primaryLanguage && codes.includes(input.primaryLanguage) ? input.primaryLanguage : codes[0];

  const catById = new Map(sel.categories.map(c => [c.id, c]));
  const cats = (input.categories ?? []).filter(c => c && catById.has(c.id));
  const catIds = new Set(cats.map(c => c.id));
  if (!cats.length) errors.push("Pick at least one category you love watching.");
  const subs = [...new Set(input.subcategoryIds ?? [])].filter(id => {
    const parent = sel.categories.find(c => c.subcategories.some(s => s.id === id));
    return parent && catIds.has(parent.id); // only subcategories of selected categories
  });
  const anyAll = cats.some(c => c.allSubcategories);
  if (cats.length && !subs.length && !anyAll) errors.push('Choose at least one subcategory, or "All" for a category.');
  const locale = input.interfaceLocale && allowedLocales.includes(input.interfaceLocale) ? input.interfaceLocale : undefined;
  return {
    errors,
    value: {
      languages: codes.map((code, i) => ({ languageId: langByCode.get(code)!.id, isPrimary: code === primary, sortOrder: i })),
      categories: cats.map(c => ({ categoryId: c.id, allSubcategories: !!c.allSubcategories })),
      subcategoryIds: subs,
      discoverOtherLanguages: input.discoverOtherLanguages,
      interfaceLocale: locale,
      completeOnboarding: !!input.completeOnboarding,
    },
  };
}

export async function savePreferences(userId: string, v: ReturnType<typeof validatePreferences>["value"]) {
  await db.$transaction(async tx => {
    await tx.userLanguagePreference.deleteMany({ where: { userId } });
    await tx.userCategoryPreference.deleteMany({ where: { userId } });
    await tx.userSubcategoryPreference.deleteMany({ where: { userId } });
    for (const l of v.languages) await tx.userLanguagePreference.create({ data: { userId, ...l } });
    for (const c of v.categories) await tx.userCategoryPreference.create({ data: { userId, ...c } });
    for (const s of v.subcategoryIds) await tx.userSubcategoryPreference.create({ data: { userId, subcategoryId: s } });
    const existing = await tx.userRecommendationPreference.findUnique({ where: { userId } });
    const data = {
      ...(v.discoverOtherLanguages !== undefined ? { discoverOtherLanguages: v.discoverOtherLanguages } : {}),
      ...(v.interfaceLocale ? { interfaceLocale: v.interfaceLocale } : {}),
      ...(v.completeOnboarding && !existing?.onboardingCompletedAt ? { onboardingCompletedAt: new Date(), onboardingStep: 4, onboardingDraft: null } : {}),
    };
    await tx.userRecommendationPreference.upsert({
      where: { userId },
      update: { ...data, prefsVersion: { increment: 1 } },
      create: { userId, ...data, prefsVersion: 1 },
    });
  });
}

export async function saveOnboardingProgress(userId: string, step: number, draft: unknown) {
  const json = JSON.stringify(draft ?? null);
  if (json.length > 20_000) throw new Error("Onboarding draft too large");
  await db.userRecommendationPreference.upsert({
    where: { userId },
    update: { onboardingStep: Math.max(0, Math.min(4, Math.floor(step))), onboardingDraft: json },
    create: { userId, onboardingStep: Math.max(0, Math.min(4, Math.floor(step))), onboardingDraft: json },
  });
}

/** Everything the ranker needs about a signed-in viewer (or a guest's on-device languages). */
export async function loadRankingProfile(userId: string | null, guest: { languages: string[] }): Promise<{ profile: Profile; prefsVersion: number; hasPrefs: boolean }> {
  if (!userId) return { profile: emptyProfile(guest.languages), prefsVersion: 0, hasPrefs: guest.languages.length > 0 };
  const since14 = new Date(Date.now() - 14 * DAY);
  const [langs, cats, subs, reco, follows, views, feedback, blocked, reports] = await Promise.all([
    db.userLanguagePreference.findMany({ where: { userId }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], include: { language: { select: { code: true } } } }),
    db.userCategoryPreference.findMany({ where: { userId } }),
    db.userSubcategoryPreference.findMany({ where: { userId } }),
    db.userRecommendationPreference.findUnique({ where: { userId } }),
    db.follow.findMany({ where: { followerId: userId }, select: { channel: { select: { userId: true } } } }),
    db.viewEvent.findMany({ where: { userId, createdAt: { gte: since14 } }, select: { videoId: true }, distinct: ["videoId"] }),
    db.videoFeedback.findMany({ where: { userId, kind: "NOT_INTERESTED" }, include: { video: { select: { creatorId: true, tags: { select: { subcategoryId: true } } } } } }),
    db.blockedCreator.findMany({ where: { userId }, select: { creatorId: true } }),
    db.contentReport.findMany({ where: { userId }, select: { videoId: true } }),
  ]);
  const profile = emptyProfile(langs.map(l => l.language.code));
  profile.discoverOtherLanguages = reco?.discoverOtherLanguages ?? false;
  cats.forEach(c => {
    profile.categoryIds.add(c.categoryId);
    if (c.allSubcategories) profile.allSubcategoryCategoryIds.add(c.categoryId);
  });
  subs.forEach(s => profile.subcategoryIds.add(s.subcategoryId));
  follows.forEach(f => profile.followedCreatorIds.add(f.channel.userId));
  views.forEach(v => profile.watchedVideoIds.add(v.videoId));
  // not-interested: hide the video; a creator counts as "not interesting" after 2 such marks
  const perCreator = new Map<string, number>();
  feedback.forEach(f => {
    profile.notInterestedVideoIds.add(f.videoId);
    perCreator.set(f.video.creatorId, (perCreator.get(f.video.creatorId) ?? 0) + 1);
    f.video.tags.forEach(t => profile.notInterestedSubcategoryIds.add(t.subcategoryId));
  });
  perCreator.forEach((n, c) => { if (n >= 2) profile.notInterestedCreatorIds.add(c); });
  blocked.forEach(b => profile.blockedCreatorIds.add(b.creatorId));
  reports.forEach(r => profile.reportedVideoIds.add(r.videoId));

  // learned affinity from positive, non-suspicious signals (last 90 days, after any reset)
  const learnedFrom = new Date(Math.max(Date.now() - 90 * DAY, reco?.learnedResetAt?.getTime() ?? 0));
  const events = await db.videoInteractionEvent.findMany({
    where: { userId, suspicious: false, createdAt: { gte: learnedFrom }, type: { in: ["LIKE", "SAVE", "COMPLETE", "SHARE"] } },
    select: { type: true, video: { select: { tags: { select: { categoryId: true, subcategoryId: true } } } } },
    take: 500, orderBy: { createdAt: "desc" },
  });
  const weightOf: Record<string, number> = { LIKE: 1, SAVE: 1.5, COMPLETE: 0.7, SHARE: 1.2 };
  const catScore = new Map<string, number>(), subScore = new Map<string, number>();
  events.forEach(e => e.video.tags.forEach(t => {
    catScore.set(t.categoryId, (catScore.get(t.categoryId) ?? 0) + weightOf[e.type]);
    subScore.set(t.subcategoryId, (subScore.get(t.subcategoryId) ?? 0) + weightOf[e.type]);
  }));
  const norm = (m: Map<string, number>) => { const max = Math.max(1, ...m.values()); m.forEach((v, k) => m.set(k, Math.min(1, v / Math.max(3, max)))); return m; };
  profile.learnedCategory = norm(catScore);
  profile.learnedSubcategory = norm(subScore);

  return { profile, prefsVersion: reco?.prefsVersion ?? 0, hasPrefs: langs.length > 0 };
}
