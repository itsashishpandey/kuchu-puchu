"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/client";
import { DEFAULT_PUBLIC_SETTINGS, type PublicSettings } from "@/lib/public-settings";

export * from "@/lib/public-settings";

// one request per page load, shared by every section that needs the numbers
let cached: PublicSettings | null = null;
let pending: Promise<PublicSettings> | null = null;

function load(): Promise<PublicSettings> {
  pending ??= get<Partial<PublicSettings>>("/public/settings")
    .then(d => {
      const next = { ...DEFAULT_PUBLIC_SETTINGS };
      for (const k of Object.keys(next) as (keyof PublicSettings)[]) {
        if (d[k] !== undefined && d[k] !== null) (next as Record<string, unknown>)[k] = d[k];
      }
      if (d.homepage !== undefined) next.homepage = d.homepage;
      return (cached = next);
    })
    .catch(() => {
      pending = null; // try again next time a section mounts
      return DEFAULT_PUBLIC_SETTINGS;
    });
  return pending;
}

/** Live creator-earning numbers (Admin → Monetization, Upload Rules, View counting), in USD. */
export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>(cached ?? DEFAULT_PUBLIC_SETTINGS);
  useEffect(() => {
    let alive = true;
    load().then(s => alive && setSettings(s));
    return () => { alive = false; };
  }, []);
  return settings;
}
