"use client";

// Shared bits for the admin "Content Discovery & Personalization" pages.
import { useCallback, useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { navigate } from "@/components/app/router";
import { api } from "@/lib/client";
import { full } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

// ── navigation (mirrors the API's READ permissions) ──
const ALL = ["SUPER_ADMIN", "MODERATOR", "FINANCE"];
const MOD = ["SUPER_ADMIN", "MODERATOR"];
export const DISCOVERY_NAV = [
  { slug: "languages", label: "Languages", icon: Icons.Languages, roles: MOD },
  { slug: "categories", label: "Main Categories", icon: Icons.LayoutGrid, roles: MOD },
  { slug: "subcategories", label: "Subcategories", icon: Icons.ListTree, roles: MOD },
  { slug: "tags", label: "Video Tag Review", icon: Icons.Tags, roles: MOD },
  { slug: "interests", label: "User Interest Analytics", icon: Icons.HeartPulse, roles: ALL },
  { slug: "recommendation", label: "Recommendation Settings", icon: Icons.SlidersHorizontal, roles: ["SUPER_ADMIN"] },
  { slug: "reports", label: "Content Discovery Reports", icon: Icons.FileBarChart2, roles: ALL },
] as const;

export type DiscoverySlug = (typeof DISCOVERY_NAV)[number]["slug"];

export function canSeeDiscovery(slug: string, adminRole: string | null | undefined) {
  const item = DISCOVERY_NAV.find(n => n.slug === slug);
  return !!item && (item.roles as readonly string[]).includes(adminRole ?? "MODERATOR");
}

/** Pills linking the seven pages (scrolls sideways on phones). */
export function DiscoveryNav({ current, adminRole }: { current: string; adminRole: string | null | undefined }) {
  return (
    <div className="-mx-1 mb-5 overflow-x-auto pb-1 [scrollbar-width:none] lg:overflow-visible">
      <div className="flex w-max gap-1.5 px-1 lg:w-auto lg:flex-wrap">
        {DISCOVERY_NAV.filter(n => canSeeDiscovery(n.slug, adminRole)).map(n => (
          <button
            key={n.slug}
            onClick={() => navigate(`/admin/discovery/${n.slug}`)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              current === n.slug ? "border-transparent bg-ink text-white" : "bg-background hover:bg-secondary"
            }`}
          >
            <n.icon size={14} /> {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── data loading ──
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load, setData };
}

/** Call a mutating endpoint, toast the server's message, then refresh. Returns the response or null. */
export async function run<T extends { message?: string } = { message?: string }>(
  path: string,
  init: { method: "POST" | "PATCH" | "PUT"; body?: unknown; form?: FormData },
  onDone?: () => void,
  fallback = "Saved",
): Promise<T | null> {
  try {
    const res = await api<T>(path, {
      method: init.method,
      body: init.form ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
    });
    toast({ title: res.message ?? fallback });
    onDone?.();
    return res;
  } catch (e) {
    toast({ title: "Couldn't complete that", description: (e as Error).message, variant: "destructive" });
    return null;
  }
}

// ── states ──
export function LoadingBlock({ rows = 4, height = "h-16" }: { rows?: number; height?: string }) {
  return <div className="space-y-2.5">{Array.from({ length: rows }).map((_, i) => <div key={i} className={`shimmer rounded-2xl ${height}`} />)}</div>;
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <Icons.TriangleAlert size={24} className="text-rose-500" />
      <p className="text-sm font-semibold text-rose-700">{message}</p>
      {onRetry && <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

// ── table helpers (tables scroll inside their card; the page never scrolls sideways) ──
export function TableCard({ children, minWidth = 720 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="bento overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, right, className }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${right ? "text-right" : "text-left"} ${className ?? ""}`}>{children}</th>;
}

export function Td({ children, right, className }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${right ? "text-right tabular-nums" : ""} ${className ?? ""}`}>{children}</td>;
}

export const n = (v: number | null | undefined) => full(v ?? 0);
export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);

export function StatTile({ label, value, icon: Icon, tone = "blue", hint }: {
  label: string; value: React.ReactNode; icon: React.ComponentType<{ size?: number }>; tone?: "blue" | "pink" | "yellow" | "green" | "slate"; hint?: string;
}) {
  const tones = {
    blue: "bg-brand-blue-soft text-brand-blue", pink: "bg-brand-pink-soft text-brand-pink", yellow: "bg-brand-yellow-soft text-amber-700",
    green: "bg-emerald-50 text-emerald-600", slate: "bg-secondary text-muted-foreground",
  } as const;
  return (
    <div className="bento p-4">
      <span className={`inline-flex rounded-xl p-2 ${tones[tone]}`}><Icon size={17} /></span>
      <p className="mt-2.5 font-display text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Horizontal bar (relative to the largest value in the list). */
export function Bar({ value, max, tone = "blue" }: { value: number; max: number; tone?: "blue" | "pink" | "yellow" }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const c = tone === "pink" ? "bg-brand-pink" : tone === "yellow" ? "bg-brand-yellow" : "bg-brand-blue";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
      <div className={`h-full rounded-full ${c}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export function ActiveBadge({ active, retired }: { active: boolean; retired?: boolean }) {
  if (retired) return <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">Retired</span>;
  return active
    ? <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
    : <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Inactive</span>;
}

// ── confirm dialog for destructive actions ──
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, onConfirm, children, confirmDisabled,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: React.ReactNode;
  confirmLabel?: string; destructive?: boolean; onConfirm: () => Promise<unknown> | void; children?: React.ReactNode; confirmDisabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={v => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription asChild><div className="space-y-2 text-sm text-muted-foreground">{description}</div></DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className={`rounded-full text-white ${destructive ? "bg-rose-600 hover:bg-rose-700" : "grad-btn"}`}
            disabled={busy || confirmDisabled}
            onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Keywords are stored as a list; edited as a comma-separated string. */
export const kwToText = (k: string[] | undefined) => (k ?? []).join(", ");

export function LangLabel({ nameNative, nameEn, direction }: { nameNative: string; nameEn: string; direction?: string }) {
  return (
    <span>
      <span dir={direction === "RTL" ? "rtl" : undefined} className="font-semibold">{nameNative}</span>
      {nameNative !== nameEn && <span className="text-muted-foreground"> · {nameEn}</span>}
    </span>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    // a wrapping <label> names the control inside it for screen readers
    <label className={`grid gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold leading-none">{label}{hint && <span className="ml-1 font-normal text-muted-foreground">({hint})</span>}</span>
      {children}
    </label>
  );
}
