"use client";

// API client + typed helpers
export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const post = <T = unknown,>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T = unknown,>(path: string, body?: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const get = <T = unknown,>(path: string) => api<T>(path);
export const put = <T = unknown,>(path: string, body?: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) });
export const del = <T = unknown,>(path: string) => api<T>(path, { method: "DELETE" });

// ── shared types ───────────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  adminRole: string | null;
  status: string;
  avatarUrl: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  monetizationEligible: boolean;
  channel: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    verified: boolean;
    followerCount: number;
    category: string | null;
    showEarnings: boolean;
  } | null;
  /** language & interest onboarding — shown until completed */
  onboarding?: { completed: boolean; step: number };
  interfaceLocale?: string;
};

export type FeedVideo = {
  id: string;
  contentId: string;
  title: string;
  description: string;
  category: string;
  hashtags: string[];
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  views: number;
  qualifiedViews: number;
  likes: number;
  commentsCount: number;
  shares: number;
  publishedAt: string | null;
  featured?: boolean;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    username: string;
    channelName: string;
    verified: boolean;
    channelId?: string | null;
    theme?: string;
  };
  liked: boolean;
  following: boolean;
  saved?: boolean;
  languages?: VideoLanguage[];
  tags?: VideoTag[];
};

// ── discovery (languages, categories, feeds) ──────────────────────────────

export type VideoLanguage = { code: string; nameEn: string; nameNative: string; direction: string; isPrimary: boolean };
export type VideoTag = {
  priority: number;
  category: { id: string; slug: string; name: string; emoji: string | null; color: string | null };
  subcategory: { id: string; slug: string; name: string };
};
export type TaxLanguage = {
  id: string; code: string; nameEn: string; nameNative: string; script: string; direction: string;
  group: string; popular: boolean; priority: number; videoCount: number;
};
export type TaxSubcategory = { id: string; slug: string; name: string; nameEn: string; emoji: string | null; sortOrder: number; videoCount: number };
export type TaxCategory = {
  id: string; slug: string; name: string; nameEn: string; description: string | null; emoji: string | null;
  color: string | null; coverImageUrl: string | null; sortOrder: number; videoCount: number; subcategories: TaxSubcategory[];
};
export type FeedMeta = {
  feed: string; languages: string[]; discoverOtherLanguages?: boolean; personalized?: boolean;
  tiers?: number[]; emptyReason?: "NO_VIDEOS_IN_YOUR_LANGUAGES" | "NO_VIDEOS" | null;
};
export type FeedPage = { videos: FeedVideo[]; nextOffset: number | null; meta?: FeedMeta };
/** Upload/edit form value: one primary language + ≤ 2 extra, 1–3 category → subcategory pairs (first = primary). */
export type TagFormValue = { primary: string; additional: string[]; tags: { categoryId: string; subcategoryId: string }[] };
export type TagSuggestions = {
  languages: { code: string; confidence: "high" | "medium" | "low"; reason: string; nameEn: string; nameNative: string }[];
  categories: { categoryId: string; categorySlug: string; categoryName: string; subcategoryId: string; subcategoryName: string; score: number; matched: string[] }[];
};
export type Preferences = {
  languages: { code: string; nameEn: string; nameNative: string; direction: string; isPrimary: boolean }[];
  categories: { id: string; slug: string; name: string; emoji: string | null; color: string | null; allSubcategories: boolean }[];
  subcategories: { id: string; slug: string; name: string; categoryId: string; categorySlug: string }[];
  discoverOtherLanguages: boolean;
  interfaceLocale: string;
  onboarding: { completed: boolean; step: number; draft: unknown };
  prefsVersion: number;
};

export type CommentItem = {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
};
