// The creator-earning numbers shown on public pages (Admin → Monetization Settings, Upload Rules and
// Platform → View counting), as returned by GET /api/public/settings. All money is in US dollars.
// Plain module (no "use client"), so server-rendered pages can use the defaults and helpers too.
import { usd } from "@/lib/format";

export type PublicSettings = {
  ratePer1000Views: number; // USD per 1,000 qualified views
  rewardPerUpload: number; // USD credited once per approved upload
  minMonthlyChannelViews: number; // views within 30 days that unlock earning
  monetizationDurationMonths: number; // how long each video earns from views
  minWithdrawalAmount: number; // USD
  holdingPeriodDays: number;
  minDurationSec: number;
  maxDurationSec: number;
  maxFileSizeMB: number;
  formats: string; // "mp4,mov"
  maxDailyUploads: number;
  maxWeeklyUploads: number;
  appOnlyViews: boolean; // only views in the mobile app count
  repeatWindowHours: number; // the same viewer counts once per video in this window
  homepage: { announcement?: string; heroTitle?: string; heroSubtitle?: string } | null;
};

/** Shown until the settings load (and if they can't) — the live values on 2026-11-03. */
export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  ratePer1000Views: 1,
  rewardPerUpload: 0.26,
  minMonthlyChannelViews: 2500,
  monetizationDurationMonths: 3,
  minWithdrawalAmount: 25,
  holdingPeriodDays: 7,
  minDurationSec: 10,
  maxDurationSec: 90,
  maxFileSizeMB: 200,
  formats: "mp4,mov",
  maxDailyUploads: 25,
  maxWeeklyUploads: 100,
  appOnlyViews: true,
  repeatWindowHours: 4,
  homepage: null,
};

// ── wording helpers ──
/** "$25" for whole amounts, "$0.26" otherwise. */
export const money = (n: number) => usd(n, Number.isInteger(n) ? 0 : 2);
export const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
/** "2,500 views within 30 days" — the one-time target that unlocks earning. */
export const unlockTarget = (s: PublicSettings) => `${s.minMonthlyChannelViews.toLocaleString("en-US")} views within 30 days`;
/** "10–90 seconds" */
export const lengthRange = (s: PublicSettings, unit = " seconds") => `${s.minDurationSec}–${s.maxDurationSec}${unit}`;
/** "MP4 or MOV" */
export const formatList = (s: PublicSettings) => {
  const f = s.formats.split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
  return f.length <= 1 ? f.join("") : `${f.slice(0, -1).join(", ")} or ${f[f.length - 1]}`;
};
/** "every 4 hours" / "every hour" */
export const repeatWindow = (s: PublicSettings) => (s.repeatWindowHours === 1 ? "every hour" : `every ${s.repeatWindowHours} hours`);
/** "in the Kuchu Puchu mobile app" / "in the Kuchu Puchu app or on the website" */
export const whereViewsCount = (s: PublicSettings) => (s.appOnlyViews ? "in the Kuchu Puchu mobile app" : "in the Kuchu Puchu app or on the website");

/**
 * Fills {placeholders} in policy and help texts with the live numbers, e.g. "{uploadReward}" → "$0.26".
 * Unknown placeholders are left as they are.
 */
export function fillNumbers(text: string, s: PublicSettings): string {
  const values: Record<string, string> = {
    rate: usd(s.ratePer1000Views),
    uploadReward: usd(s.rewardPerUpload),
    unlockViews: s.minMonthlyChannelViews.toLocaleString("en-US"),
    months: plural(s.monetizationDurationMonths, "month"),
    holdDays: String(s.holdingPeriodDays),
    minPayout: money(s.minWithdrawalAmount),
    repeatWindow: repeatWindow(s),
    whereViewsCount: whereViewsCount(s),
    websitePlays: s.appOnlyViews ? "website plays, " : "",
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}
