"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigate } from "@/components/app/router";

// ── Logo ───────────────────────────────────────────────────────────────────

export function Logo({ dark = false, size = 36 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className="relative inline-flex items-center justify-center rounded-xl shadow-lg"
        style={{
          width: size, height: size,
          background: "linear-gradient(135deg,#1677FF 0%,#1677FF 49%,#FF4E9B 51%,#FF4E9B 100%)",
        }}
      >
        <Icons.Play size={size * 0.44} fill="#fff" color="#fff" className="translate-x-[1px]" />
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-yellow ring-2 ring-white"
          aria-hidden
        />
      </span>
      <span
        className={`font-display text-[1.35rem] leading-none tracking-tight ${dark ? "text-white" : "text-ink"}`}
        style={{ fontWeight: 800 }}
      >
        <span className="text-brand-blue">Kuchu</span>
        <span className="text-brand-pink"> Puchu</span>
      </span>
    </span>
  );
}

// ── Section heading ────────────────────────────────────────────────────────

export function SectionHeading({
  eyebrow, title, subtitle, align = "center", light = false,
}: {
  eyebrow?: string; title: React.ReactNode; subtitle?: string;
  align?: "center" | "left"; light?: boolean;
}) {
  return (
    <div className={`reveal max-w-3xl ${align === "center" ? "mx-auto text-center" : ""} mb-10 md:mb-14`}>
      {eyebrow && (
        <span
          className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${
            light ? "bg-white/10 text-brand-yellow" : "bg-brand-pink-soft text-brand-pink"
          }`}
        >
          <Icons.Sparkles size={13} />
          {eyebrow}
        </span>
      )}
      <h2 className={`font-display text-3xl font-bold leading-[1.1] md:text-[2.6rem] ${light ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed md:text-lg ${light ? "text-white/70" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Animated counter ───────────────────────────────────────────────────────

export function StatCounter({
  value, prefix = "", suffix = "", decimals = 0, duration = 1600, className,
}: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
  duration?: number; className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// ── Phone mockup (live content inside) ────────────────────────────────────

export function PhoneMockup({
  children, className, notch = true,
}: { children: React.ReactNode; className?: string; notch?: boolean }) {
  return (
    <div className={`relative mx-auto w-[270px] md:w-[300px] ${className ?? ""}`}>
      <div className="absolute -inset-6 rounded-[3.2rem] bg-gradient-to-tr from-brand-blue/20 via-brand-yellow/10 to-brand-pink/25 blur-2xl" aria-hidden />
      <div className="relative rounded-[2.6rem] border-[10px] border-ink bg-ink shadow-2xl">
        {notch && (
          <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
        )}
        <div className="relative aspect-[9/19] overflow-hidden rounded-[1.9rem] bg-ink">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Browser mockup ────────────────────────────────────────────────────────

export function BrowserMockup({
  children, url = "kuchupuchu.com", className,
}: { children: React.ReactNode; url?: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-card shadow-xl ${className ?? ""}`}>
      <div className="flex items-center gap-2 border-b bg-secondary px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-pink" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow" />
        <span className="ml-3 flex-1 truncate rounded-full bg-background px-3 py-1 text-[11px] text-muted-foreground">
          https://{url}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

// ── Demo badge (transparent sample-data labeling) ─────────────────────────

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand-blue-soft px-2.5 py-1 text-[11px] font-semibold text-brand-blue ${className ?? ""}`}
    >
      <Icons.FlaskConical size={12} />
      Demo data — illustrative example
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FALSE_POSITIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
  REMOVED: "bg-slate-100 text-slate-600 border-slate-200",
  FLAGGED_DUPLICATE: "bg-orange-50 text-orange-700 border-orange-200",
  CONFIRMED_DUPLICATE: "bg-orange-50 text-orange-700 border-orange-200",
  REQUESTED: "bg-blue-50 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PROCESSING: "bg-violet-50 text-violet-700 border-violet-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OPEN: "bg-amber-50 text-amber-700 border-amber-200",
  DISMISSED: "bg-slate-100 text-slate-600 border-slate-200",
  CONFIRMED: "bg-rose-50 text-rose-700 border-rose-200",
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_TEXT: Record<string, string> = {
  PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", SUSPENDED: "Suspended",
  FLAGGED_DUPLICATE: "Duplicate review", REMOVED: "Removed", REQUESTED: "Requested",
  UNDER_REVIEW: "Under review", PROCESSING: "Processing", PAID: "Paid",
  PENDING_REVIEW: "Pending review", CONFIRMED_DUPLICATE: "Duplicate", FALSE_POSITIVE: "Cleared",
  OPEN: "Open", DISMISSED: "Dismissed", CONFIRMED: "Confirmed", NEW: "New",
  LOW: "Low", MEDIUM: "Medium", HIGH: "High", IN_PROGRESS: "In progress", RESOLVED: "Resolved",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-200"} ${className ?? ""}`}
    >
      {STATUS_TEXT[status] ?? status}
    </span>
  );
}

// ── Category icon helper ──────────────────────────────────────────────────

export function CategoryIcon({ name, size = 18, className }: { name?: string | null; size?: number; className?: string }) {
  const map: Record<string, string> = {
    "Cartoons & Animation": "Clapperboard",
    "Nursery Rhymes": "Music",
    "Kids Comedy": "Laugh",
    "Learning & Fun": "GraduationCap",
    "Story Time": "BookOpen",
    "Kids Songs": "Mic",
    "Toys & Play": "ToyBrick",
    "Animals & Friends": "PawPrint",
    "Arts & Crafts": "Palette",
    "Dance & Fun": "PartyPopper",
    "Family Adventures": "Baby",
    "Science for Kids": "FlaskConical",
    Entertainment: "Film", Comedy: "Laugh", Lifestyle: "Coffee", Education: "GraduationCap",
    Food: "UtensilsCrossed", Travel: "Plane", Technology: "Cpu", Fitness: "Dumbbell",
    Beauty: "Flower2", Music: "Music", Pets: "PawPrint", Fashion: "Shirt",
    Gaming: "Gamepad2", Art: "Palette", Nature: "Mountain", Dance: "PartyPopper",
  };
  const Icon = (Icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[map[name ?? ""] ?? "Sparkles"];
  return <Icon size={size} className={className} />;
}

// ── Avatar with fallback initials ─────────────────────────────────────────

export function Avatar({
  src, name, size = 40, className, ring = false,
}: { src?: string | null; name: string; size?: number; className?: string; ring?: boolean }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-blue to-brand-pink font-bold text-white ${ring ? "ring-2 ring-white ring-offset-2" : ""} ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
         
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

export function EmptyState({
  icon = "Inbox", title, description, action,
}: {
  icon?: string; title: string; description?: string;
  action?: { label: string; onClick: () => void };
}) {
  const Icon = (Icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[icon] ?? Icons.Inbox;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-secondary/50 px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-background p-4 shadow-sm">
        <Icon size={26} className="text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

// ── CTA button helpers ────────────────────────────────────────────────────

export function PrimaryCTA({ children, to, className, size = "lg" }: {
  children: React.ReactNode; to: string; className?: string; size?: "lg" | "default";
}) {
  return (
    <Button
      size={size}
      className={`grad-btn rounded-full px-7 text-white shadow-[0_8px_24px_-8px_rgba(22,119,255,0.55)] hover:shadow-[0_12px_32px_-8px_rgba(255,78,155,0.6)] transition-all hover:-translate-y-0.5 ${className ?? ""}`}
      onClick={() => navigate(to)}
    >
      {children}
    </Button>
  );
}

export function SecondaryCTA({ children, to, className, size = "lg" }: {
  children: React.ReactNode; to: string; className?: string; size?: "lg" | "default";
}) {
  return (
    <Button
      size={size}
      variant="outline"
      className={`rounded-full border-2 border-ink/10 bg-white px-7 font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-blue/40 hover:text-brand-blue ${className ?? ""}`}
      onClick={() => navigate(to)}
    >
      {children}
    </Button>
  );
}
