// Recommendation settings validation (pure). Admins can tune weights and limits, but only within
// safe bounds; anything outside is clamped and reported.
import type { RecoSettings } from "./types";

export const RECO_DEFAULTS: RecoSettings = {
  weights: { subcategory: 40, category: 25, engagement: 20, recency: 10, discovery: 5 },
  followBoost: 5,
  learnedAffinity: 30,
  recencyHalfLifeDays: 14,
  maxPerCreatorPerPage: 2,
  pageSize: 10,
  discoveryShare: 15,
  newCreatorDays: 30,
  newCreatorBoost: 4,
  watchedPenalty: 50,
  notInterestedCreatorPenalty: 40,
  notInterestedSubcategoryPenalty: 15,
  otherLanguagePenalty: 50,
  minQuality: { excludeHighFraudFlags: true, maxReportsBeforeHidden: 5 },
};

export const RECO_LIMITS: Record<string, [number, number]> = {
  "weights.subcategory": [0, 60], "weights.category": [0, 60], "weights.engagement": [0, 60],
  "weights.recency": [0, 40], "weights.discovery": [0, 20],
  followBoost: [0, 20], learnedAffinity: [0, 60], recencyHalfLifeDays: [1, 90], maxPerCreatorPerPage: [1, 5],
  pageSize: [5, 30], discoveryShare: [0, 40], newCreatorDays: [0, 180], newCreatorBoost: [0, 15],
  watchedPenalty: [0, 90], notInterestedCreatorPenalty: [0, 90], notInterestedSubcategoryPenalty: [0, 60],
  otherLanguagePenalty: [0, 90], "minQuality.maxReportsBeforeHidden": [1, 50],
};

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeRecoSettings(input: unknown): { settings: RecoSettings; adjustments: string[] } {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const adjustments: string[] = [];
  const clamp = (key: string, value: number) => {
    const [lo, hi] = RECO_LIMITS[key];
    const v = Math.min(hi, Math.max(lo, value));
    if (v !== value) adjustments.push(`${key} limited to ${v} (allowed ${lo}–${hi})`);
    return v;
  };
  const d = RECO_DEFAULTS;
  const wIn = (src.weights ?? {}) as Record<string, unknown>;
  const weights = {
    subcategory: clamp("weights.subcategory", num(wIn.subcategory, d.weights.subcategory)),
    category: clamp("weights.category", num(wIn.category, d.weights.category)),
    engagement: clamp("weights.engagement", num(wIn.engagement, d.weights.engagement)),
    recency: clamp("weights.recency", num(wIn.recency, d.weights.recency)),
    discovery: clamp("weights.discovery", num(wIn.discovery, d.weights.discovery)),
  };
  // personal relevance must stay the largest signal
  if (weights.subcategory + weights.category < 30) {
    adjustments.push("subcategory + category weights must total at least 30 — restored defaults for those two");
    weights.subcategory = d.weights.subcategory;
    weights.category = d.weights.category;
  }
  const mq = (src.minQuality ?? {}) as Record<string, unknown>;
  const settings: RecoSettings = {
    weights,
    followBoost: clamp("followBoost", num(src.followBoost, d.followBoost)),
    learnedAffinity: clamp("learnedAffinity", num(src.learnedAffinity, d.learnedAffinity)),
    recencyHalfLifeDays: clamp("recencyHalfLifeDays", num(src.recencyHalfLifeDays, d.recencyHalfLifeDays)),
    maxPerCreatorPerPage: Math.round(clamp("maxPerCreatorPerPage", num(src.maxPerCreatorPerPage, d.maxPerCreatorPerPage))),
    pageSize: Math.round(clamp("pageSize", num(src.pageSize, d.pageSize))),
    discoveryShare: clamp("discoveryShare", num(src.discoveryShare, d.discoveryShare)),
    newCreatorDays: clamp("newCreatorDays", num(src.newCreatorDays, d.newCreatorDays)),
    newCreatorBoost: clamp("newCreatorBoost", num(src.newCreatorBoost, d.newCreatorBoost)),
    watchedPenalty: clamp("watchedPenalty", num(src.watchedPenalty, d.watchedPenalty)),
    notInterestedCreatorPenalty: clamp("notInterestedCreatorPenalty", num(src.notInterestedCreatorPenalty, d.notInterestedCreatorPenalty)),
    notInterestedSubcategoryPenalty: clamp("notInterestedSubcategoryPenalty", num(src.notInterestedSubcategoryPenalty, d.notInterestedSubcategoryPenalty)),
    otherLanguagePenalty: clamp("otherLanguagePenalty", num(src.otherLanguagePenalty, d.otherLanguagePenalty)),
    minQuality: {
      excludeHighFraudFlags: mq.excludeHighFraudFlags === undefined ? d.minQuality.excludeHighFraudFlags : Boolean(mq.excludeHighFraudFlags),
      maxReportsBeforeHidden: Math.round(clamp("minQuality.maxReportsBeforeHidden", num(mq.maxReportsBeforeHidden, d.minQuality.maxReportsBeforeHidden))),
    },
  };
  return { settings, adjustments };
}

/** Stable experiment bucketing: the same viewer always lands in the same bucket (0–99). */
export function experimentBucket(userKey: string): number {
  let h = 0;
  for (let i = 0; i < userKey.length; i++) h = (h * 31 + userKey.charCodeAt(i)) >>> 0;
  return h % 100;
}
