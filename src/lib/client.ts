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
  };
  liked: boolean;
  following: boolean;
};

export type CommentItem = {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
};
