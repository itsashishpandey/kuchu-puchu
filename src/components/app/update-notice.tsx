"use client";

// Tabs that stay open keep running the code they loaded. When a new version is deployed, offer a refresh
// so creators and admins see fixes without wondering why nothing changed.
import { useEffect, useState } from "react";
import * as Icons from "lucide-react";

const MY_BUILD = process.env.NEXT_PUBLIC_BUILD_ID || "";

export function UpdateNotice() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!MY_BUILD) return;
    let stop = false;
    const check = async () => {
      if (stop || document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/public/version", { cache: "no-store" });
        const { build } = await r.json();
        if (build && build !== MY_BUILD) setStale(true);
      } catch { /* offline — try again later */ }
    };
    const t = setInterval(check, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const first = setTimeout(check, 30_000);
    return () => { stop = true; clearInterval(t); clearTimeout(first); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  if (!stale) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-2xl sm:inset-x-auto sm:right-4">
      <Icons.Sparkles size={18} className="shrink-0 text-brand-yellow" />
      <span className="flex-1">A new version of Kuchu Puchu is available.</span>
      <button onClick={() => window.location.reload()} className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-brand-yellow">
        Refresh
      </button>
    </div>
  );
}
