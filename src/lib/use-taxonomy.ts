"use client";

// Languages + categories for pickers, chips and filters (cached for the session; admins' edits
// show up within a few minutes or on reload).
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { get, type TaxLanguage, type TaxCategory } from "@/lib/client";
import { useAuth } from "@/components/app/auth-provider";

const STALE = 5 * 60_000;

export function useLanguages() {
  return useQuery({
    queryKey: ["taxonomy", "languages"],
    queryFn: () => get<{ languages: TaxLanguage[] }>("/taxonomy/languages").then(d => d.languages),
    staleTime: STALE,
  });
}

export function useCategories(locale?: string) {
  const ui = useUiLocale();
  const loc = locale ?? ui;
  return useQuery({
    queryKey: ["taxonomy", "categories", loc],
    queryFn: () => get<{ categories: TaxCategory[] }>(`/taxonomy/categories?locale=${encodeURIComponent(loc)}`).then(d => d.categories),
    staleTime: STALE,
  });
}

// ── viewer's interface locale (category names only; the UI copy itself is English) ──
const LOCALE_KEY = "kp_ui_locale";

export function useUiLocale(): string {
  const { user } = useAuth();
  const [guest, setGuest] = useState("en"); // read after mount (no SSR/hydration mismatch)
  useEffect(() => { try { setGuest(localStorage.getItem(LOCALE_KEY) || "en"); } catch { /* private mode */ } }, []);
  return user?.interfaceLocale ?? guest;
}

export function setGuestUiLocale(code: string) {
  try { localStorage.setItem(LOCALE_KEY, code); } catch { /* private mode */ }
}

// ── guest language choice (kept on this device only — never sent anywhere but the feed query) ──
const GUEST_LANGS_KEY = "kp_guest_languages";

export function getGuestLanguages(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(GUEST_LANGS_KEY) || "[]");
    return Array.isArray(v) ? v.map(String).slice(0, 10) : [];
  } catch { return []; }
}

export function setGuestLanguages(codes: string[]) {
  try { localStorage.setItem(GUEST_LANGS_KEY, JSON.stringify(codes.slice(0, 10))); } catch { /* private mode */ }
}

/** Best guess for a first-time guest: the browser's language if we support it, else English. */
export function defaultGuestLanguages(known: TaxLanguage[]): string[] {
  const nav = typeof navigator !== "undefined" ? (navigator.languages ?? [navigator.language]) : [];
  const codes = known.map(l => l.code);
  const picked: string[] = [];
  for (const n of nav) {
    const base = String(n).split("-")[0].toLowerCase();
    if (codes.includes(base) && !picked.includes(base)) picked.push(base);
  }
  if (!picked.includes("en")) picked.push("en");
  return picked.slice(0, 3);
}
