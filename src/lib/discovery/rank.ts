// For You ranking (pure; unit-tested). Spec §6:
//  • language is an ELIGIBILITY rule (other languages only if the viewer enabled discovery)
//  • weighted score: exact subcategory, main category, engagement/quality, recency, discovery
//  • fallback cascade: exact sub+lang → category+lang → other categories same lang → discovery langs
//  • one entry per video (multi-category videos never duplicate), creator cap per page,
//    watched/not-interested/blocked/reported handling, follow boost, new-creator discovery
//  • monetization is NOT a signal (pay-per-view must never boost ranking)
import type { RecoSettings } from "./types";
import { hash01 } from "./text.ts";

export type Candidate = {
  id: string;
  creatorId: string;
  publishedAt: number; // ms
  languageCodes: string[]; // [primary, ...additional]
  tags: { categoryId: string; subcategoryId: string; priority: number }[];
  views: number;
  qualifiedViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  completionRate: number | null; // 0..1 from non-suspicious completion events
  highFraud: boolean; // open HIGH-severity fraud flag
  reportCount: number; // open user reports
  creatorApprovedAt: number | null; // ms — for new-creator discovery
};

export type Profile = {
  languages: string[]; // ordered; [0] = primary. Empty = no language preference (guest/cold start)
  discoverOtherLanguages: boolean;
  categoryIds: Set<string>;
  allSubcategoryCategoryIds: Set<string>; // categories where the viewer chose "All subcategories"
  subcategoryIds: Set<string>;
  followedCreatorIds: Set<string>;
  watchedVideoIds: Set<string>;
  notInterestedVideoIds: Set<string>;
  notInterestedCreatorIds: Set<string>;
  notInterestedSubcategoryIds: Set<string>;
  blockedCreatorIds: Set<string>;
  reportedVideoIds: Set<string>;
  learnedCategory: Map<string, number>; // 0..1 affinity from likes/saves/completions
  learnedSubcategory: Map<string, number>;
};

export type Ranked = { id: string; score: number; tier: number; reasons: string[] };

const PRIORITY_WEIGHT = [1, 0.85, 0.7];
const DAY = 864e5;

export function emptyProfile(languages: string[] = []): Profile {
  return {
    languages, discoverOtherLanguages: false, categoryIds: new Set(), allSubcategoryCategoryIds: new Set(),
    subcategoryIds: new Set(), followedCreatorIds: new Set(), watchedVideoIds: new Set(), notInterestedVideoIds: new Set(),
    notInterestedCreatorIds: new Set(), notInterestedSubcategoryIds: new Set(), blockedCreatorIds: new Set(),
    reportedVideoIds: new Set(), learnedCategory: new Map(), learnedSubcategory: new Map(),
  };
}

export function engagementScore(c: Candidate): number {
  const interactions = c.likes + 2 * c.shares + 1.5 * c.saves + 1.5 * c.comments;
  const rate = Math.min(1, interactions / (c.views + 100) / 0.25); // 25% interaction rate = top
  const quality = c.views > 0 ? Math.min(1, c.qualifiedViews / c.views) : 0.5; // filtered-view share resists manipulation
  const completion = c.completionRate ?? 0.5;
  const reach = Math.min(1, Math.log10(1 + c.qualifiedViews) / 6);
  return 0.45 * rate + 0.2 * quality + 0.2 * completion + 0.15 * reach;
}

export function rankFeed(
  candidates: Candidate[],
  p: Profile,
  s: RecoSettings,
  opts: { now: number; seed: string },
): Ranked[] {
  const w = s.weights;
  const wSum = Math.max(1, w.subcategory + w.category + w.engagement + w.recency + w.discovery);
  const hasLangPref = p.languages.length > 0;
  const hasInterests = p.categoryIds.size + p.subcategoryIds.size + p.allSubcategoryCategoryIds.size > 0;
  const langSet = new Set(p.languages);
  const seen = new Set<string>();
  const scored: (Ranked & { creatorId: string; primarySub: string | null })[] = [];

  for (const c of candidates) {
    if (seen.has(c.id)) continue; // one entry per video, whatever its category count
    seen.add(c.id);
    if (p.blockedCreatorIds.has(c.creatorId) || p.notInterestedVideoIds.has(c.id) || p.reportedVideoIds.has(c.id)) continue;
    if (s.minQuality.excludeHighFraudFlags && c.highFraud) continue;
    if (c.reportCount >= s.minQuality.maxReportsBeforeHidden) continue;

    // language eligibility
    const langMatch = !hasLangPref || c.languageCodes.some(code => langSet.has(code));
    if (!langMatch && !p.discoverOtherLanguages) continue;

    const reasons: string[] = [];
    let sub = 0, cat = 0, learnedSub = 0, learnedCat = 0;
    c.tags.forEach(t => {
      const pw = PRIORITY_WEIGHT[t.priority - 1] ?? 0.6;
      if (p.subcategoryIds.has(t.subcategoryId) || p.allSubcategoryCategoryIds.has(t.categoryId)) sub = Math.max(sub, pw);
      if (p.categoryIds.has(t.categoryId) || p.allSubcategoryCategoryIds.has(t.categoryId)) cat = Math.max(cat, pw);
      learnedSub = Math.max(learnedSub, (p.learnedSubcategory.get(t.subcategoryId) ?? 0) * pw);
      learnedCat = Math.max(learnedCat, (p.learnedCategory.get(t.categoryId) ?? 0) * pw);
    });
    const learnShare = s.learnedAffinity / 100; // behaviour can add to, never replace, declared interests
    const subSignal = Math.max(sub, learnShare * learnedSub);
    const catSignal = Math.max(cat, learnShare * learnedCat);
    if (sub > 0) reasons.push("your subcategory");
    else if (cat > 0) reasons.push("your category");
    else if (subSignal > 0 || catSignal > 0) reasons.push("similar to what you watch");

    const eng = engagementScore(c);
    const ageDays = Math.max(0, (opts.now - c.publishedAt) / DAY);
    const rec = Math.pow(0.5, ageDays / Math.max(1, s.recencyHalfLifeDays));
    const isNewCreator = c.creatorApprovedAt != null && opts.now - c.creatorApprovedAt < s.newCreatorDays * DAY;
    const disc = hash01(`${opts.seed}:${c.id}`);

    let score = (w.subcategory * subSignal + w.category * catSignal + w.engagement * eng + w.recency * rec + w.discovery * disc) / wSum * 100;
    if (p.followedCreatorIds.has(c.creatorId)) { score += s.followBoost; reasons.push("you follow this creator"); }
    if (isNewCreator) { score += s.newCreatorBoost; reasons.push("new creator"); }

    // dampeners
    if (p.watchedVideoIds.has(c.id)) { score *= 1 - s.watchedPenalty / 100; reasons.push("already watched"); }
    if (p.notInterestedCreatorIds.has(c.creatorId)) score *= 1 - s.notInterestedCreatorPenalty / 100;
    if (c.tags.some(t => p.notInterestedSubcategoryIds.has(t.subcategoryId))) score *= 1 - s.notInterestedSubcategoryPenalty / 100;
    if (!langMatch) { score *= 1 - s.otherLanguagePenalty / 100; reasons.push("other language (discovery on)"); }
    else if (hasLangPref && c.languageCodes[0] !== p.languages[0] && !c.languageCodes.includes(p.languages[0])) score *= 0.95;

    // cascade tier
    let tier: number;
    if (!langMatch) tier = 4;
    else if (!hasInterests && learnedSub === 0 && learnedCat === 0) tier = 2; // cold start: language-only ranking
    else if (subSignal > 0) tier = 1;
    else if (catSignal > 0) tier = 2;
    else tier = 3;

    const primary = c.tags.find(t => t.priority === 1);
    scored.push({ id: c.id, score: Math.round(score * 100) / 100, tier, reasons, creatorId: c.creatorId, primarySub: primary?.subcategoryId ?? null });
  }

  // Tiers 1+2 compete on score (weights already favour exact subcategories); tier 3 = discovery
  // inside the viewer's languages, interleaved at most `discoveryShare`% while better matches remain;
  // tier 4 (other languages, opt-in) always last.
  const byScore = (a: { score: number }, b: { score: number }) => b.score - a.score;
  const main = scored.filter(x => x.tier <= 2).sort(byScore);
  const discovery = scored.filter(x => x.tier === 3).sort(byScore);
  const other = scored.filter(x => x.tier === 4).sort(byScore);

  const merged: typeof scored = [];
  const every = s.discoveryShare > 0 ? Math.max(2, Math.round(100 / s.discoveryShare)) : Infinity;
  let mi = 0, di = 0;
  while (mi < main.length || di < discovery.length) {
    const slot = merged.length + 1;
    const wantDiscovery = di < discovery.length && (mi >= main.length || slot % every === 0);
    merged.push(wantDiscovery ? discovery[di++] : main[mi++]);
  }
  merged.push(...other);

  // Per-page diversity: max N videos per creator and max 4 of the same primary subcategory per page.
  const out: Ranked[] = [];
  const pending = [...merged];
  const maxSameSub = 4;
  while (pending.length) {
    const pageStart = out.length - (out.length % s.pageSize);
    const page = out.slice(pageStart) as typeof pending;
    const creatorOk = (x: (typeof pending)[number]) => page.filter(y => y.creatorId === x.creatorId).length < s.maxPerCreatorPerPage;
    const subOk = (x: (typeof pending)[number]) => !x.primarySub || page.filter(y => y.primarySub === x.primarySub).length < maxSameSub;
    // creator cap is the hard rule; subcategory variety is relaxed first when nothing fits both
    let idx = pending.findIndex(x => creatorOk(x) && subOk(x));
    if (idx === -1) idx = pending.findIndex(creatorOk);
    const next = pending.splice(idx === -1 ? 0 : idx, 1)[0]; // only one creator left → accept rather than starve
    out.push(next);
  }
  return out.map(({ id, score, tier, reasons }) => ({ id, score, tier, reasons }));
}
