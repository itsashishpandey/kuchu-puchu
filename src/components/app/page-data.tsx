"use client";

// Data a server page fetched for its first render (so search engines see it in the HTML).
// Pages fall back to fetching it themselves after an in-site navigation.
import { createContext, useContext } from "react";
import type { FeedVideo } from "@/lib/client";

export type CategoryInfo = {
  id: string; name: string; slug: string; description: string | null; emoji: string | null; color: string | null;
  videoCount: number; subcategories: { id: string; name: string; slug: string }[];
};

export type PageData = { kind: "category"; dbSlug: string; category: CategoryInfo | null; videos: FeedVideo[] };

export const PageDataContext = createContext<PageData | null>(null);
export const usePageData = () => useContext(PageDataContext);
