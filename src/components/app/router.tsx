"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// ── Hash router (single visible route: /) ──────────────────────────────────

export type RouteInfo = {
  path: string;          // e.g. "/dashboard/upload"
  segments: string[];    // ["dashboard","upload"]
  query: URLSearchParams;
  full: string;          // "/dashboard/upload?x=1"
};

export function navigate(path: string, opts?: { replace?: boolean }) {
  const target = `#${path.startsWith("/") ? path : `/${path}`}`;
  if (opts?.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function useRoute(): RouteInfo {
  // useSyncExternalStore keeps SSR and hydration snapshots identical ("/"),
  // then React re-renders with the real hash right after mount — no mismatch.
  const raw = useSyncExternalStore(
    (cb: () => void) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash.replace(/^#/, "") || "/",
    () => "/"
  );
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

export function Link({
  to, children, className, onClick, ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return (
    <a href={`#${to}`} className={className} onClick={onClick} {...rest}>
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
