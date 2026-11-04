"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { isCleanPath, toCleanPath, isChannelPath } from "@/lib/seo-pages";

// ── Router ─────────────────────────────────────────────────────────────────
// Public pages have real addresses (mykuchupuchu.com/nursery-rhymes, /about, /c/<username>) that the
// server renders, so search engines can find them; the list lives in src/lib/seo-pages.ts.
// Private and app-like screens (feed, login, dashboard, admin…) stay at /#/<path>.

export type RouteInfo = {
  path: string;          // e.g. "/dashboard/upload"
  segments: string[];    // ["dashboard","upload"]
  query: URLSearchParams;
  full: string;          // "/dashboard/upload?x=1"
};

export { isChannelPath, isCleanPath };

/** Server-side hint for the first render on a real page (e.g. "/c/kidsminds", "/nursery-rhymes"). */
export const InitialPathContext = createContext<string>("/");

function currentRoute(): string {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash) return hash;
  const { pathname, search } = window.location;
  return isCleanPath(pathname) ? pathname + search : "/";
}

const announce = () => window.dispatchEvent(new Event("routechange"));

export function navigate(path: string, opts?: { replace?: boolean }) {
  const p = toCleanPath(path.startsWith("/") ? path : `/${path}`);
  const method = opts?.replace ? "replaceState" : "pushState";
  if (isCleanPath(p)) {
    // a real page: swap the address and re-render, no reload
    window.history[method](null, "", p);
    announce();
    return;
  }
  if (window.location.pathname !== "/") {
    // from a real page to a /#/ screen (feed, login…): the screens live at /#/..., still no reload
    window.history[method](null, "", `/#${p}`);
    announce();
    return;
  }
  const target = `#${p}`;
  if (opts?.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function useRoute(): RouteInfo {
  // useSyncExternalStore keeps SSR and hydration snapshots identical (the page's own address),
  // then React re-renders with the real hash right after mount — no mismatch.
  const initial = useContext(InitialPathContext);
  const raw = useSyncExternalStore(
    (cb: () => void) => {
      window.addEventListener("hashchange", cb);
      window.addEventListener("popstate", cb);
      window.addEventListener("routechange", cb);
      return () => {
        window.removeEventListener("hashchange", cb);
        window.removeEventListener("popstate", cb);
        window.removeEventListener("routechange", cb);
      };
    },
    currentRoute,
    () => initial
  );
  // old links (/#/about, /#/policies/monetization, /#/c/<username>) move to the real address
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const [hp, hq] = hash.split("?");
    const clean = toCleanPath(hp);
    if (isCleanPath(clean)) {
      window.history.replaceState(null, "", clean + (hq ? `?${hq}` : ""));
      announce();
    }
  }, [raw]);
  return parseRoute(raw);
}

function parseRoute(raw: string): RouteInfo {
  const [path, qs] = raw.split("?");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return {
    path: clean,
    segments: clean.split("/").filter(Boolean),
    query: new URLSearchParams(qs ?? ""),
    full: raw,
  };
}

/** A link inside the site: real pages get their real address (crawlable), screens get /#/<path>. */
export function Link({
  to, children, className, onClick, ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const dest = toCleanPath(to);
  const href = isCleanPath(dest) ? dest : `/#${dest}`;
  return (
    <a href={href} className={className} {...rest}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || rest.target === "_blank") return;
        e.preventDefault();
        navigate(dest);
      }}>
      {children}
    </a>
  );
}

// scroll to top on route change (except feed which owns its scroll)
export function useScrollReset(path: string) {
  useEffect(() => {
    if (!path.startsWith("/feed")) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [path]);
}

// ── Reveal-on-scroll helper ────────────────────────────────────────────────

export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const [node, setNode] = useState<T | null>(null);
  useEffect(() => {
    if (!node) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    const observeAll = (root: Element) => {
      if (root.classList?.contains("reveal")) io.observe(root);
      root.querySelectorAll?.(".reveal:not(.in)").forEach(el => io.observe(el));
    };
    observeAll(node);
    // late-mounted .reveal elements (async data grids) get observed too
    const mo = new MutationObserver(muts => {
      for (const m of muts) m.addedNodes.forEach(n => {
        if (n instanceof HTMLElement) observeAll(n);
      });
    });
    mo.observe(node, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [node]);
  return setNode;
}
