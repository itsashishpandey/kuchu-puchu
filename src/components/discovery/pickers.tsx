"use client";

// Pickers shared by onboarding and "My Interests & Languages": languages (multi-select with
// search, chips, native + English names, a primary language), category cards, subcategory chips.
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TaxLanguage, TaxCategory } from "@/lib/client";

export const MAX_VIEWER_LANGUAGES = 20;

export function languageLabel(l?: Pick<TaxLanguage, "nameEn" | "nameNative"> | null) {
  if (!l) return "";
  return l.nameNative && l.nameNative !== l.nameEn ? `${l.nameNative} · ${l.nameEn}` : l.nameEn;
}

export function LanguageMultiPicker({
  languages, selected, primary, onChange, onPrimary, compact = false,
}: {
  languages: TaxLanguage[];
  selected: string[];
  primary: string;
  onChange: (codes: string[]) => void;
  onPrimary: (code: string) => void;
  compact?: boolean;
}) {
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(!compact);
  const byCode = useMemo(() => new Map(languages.map(l => [l.code, l])), [languages]);
  const query = q.trim().toLowerCase();
  const filtered = languages.filter(l => !query || l.nameEn.toLowerCase().includes(query) || l.nameNative.toLowerCase().includes(query) || l.code.toLowerCase() === query);
  const groups: [string, TaxLanguage[]][] = query
    ? [["Results", filtered]]
    : [
        ["Popular", filtered.filter(l => l.popular)],
        ["Indian languages", filtered.filter(l => !l.popular && l.group === "INDIAN")],
        ["More languages", filtered.filter(l => !l.popular && l.group !== "INDIAN")],
      ];

  const toggle = (code: string) => {
    if (selected.includes(code)) {
      const next = selected.filter(c => c !== code);
      onChange(next);
      if (primary === code) onPrimary(next[0] ?? "");
    } else if (selected.length < MAX_VIEWER_LANGUAGES) {
      onChange([...selected, code]);
      if (!primary) onPrimary(code);
    }
  };

  return (
    <div className="space-y-4">
      {/* chosen languages */}
      <div className="min-h-[44px] rounded-2xl border border-dashed bg-muted/30 p-2.5" aria-live="polite">
        {selected.length === 0 ? (
          <p className="px-1 py-1.5 text-sm text-muted-foreground">No languages chosen yet — tap any language below.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map(code => {
              const l = byCode.get(code);
              const isPrimary = code === primary;
              return (
                <span key={code} className={cn("inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-2 text-sm font-medium",
                  isPrimary ? "bg-brand-pink text-white" : "bg-white text-foreground ring-1 ring-black/10")}>
                  <button type="button" onClick={() => onPrimary(code)} aria-label={isPrimary ? `${l?.nameEn} is your main language` : `Make ${l?.nameEn} your main language`}
                    title={isPrimary ? "Main language" : "Make main language"}
                    className={cn("rounded-full p-1", isPrimary ? "text-brand-yellow" : "text-muted-foreground hover:text-brand-yellow")}>
                    <Icons.Star size={14} fill={isPrimary ? "currentColor" : "none"} />
                  </button>
                  <span dir={l?.direction === "RTL" ? "rtl" : undefined}>{l?.nameNative ?? code}</span>
                  {l && l.nameNative !== l.nameEn && <span className={cn("text-xs", isPrimary ? "text-white/80" : "text-muted-foreground")}>{l.nameEn}</span>}
                  <button type="button" onClick={() => toggle(code)} aria-label={`Remove ${l?.nameEn ?? code}`}
                    className={cn("ml-0.5 rounded-full p-0.5", isPrimary ? "hover:bg-white/20" : "hover:bg-muted")}>
                    <Icons.X size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {selected.length > 1 && <p className="mt-2 px-1 text-[11px] text-muted-foreground">★ marks your main language — tap a star to change it.</p>}
      </div>

      <div className="relative">
        <Icons.Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => { setQ(e.target.value); setShowAll(true); }} placeholder="Search languages — Hindi, தமிழ், Español…"
          className="h-11 rounded-full pl-10" aria-label="Search languages" />
      </div>

      <div className={cn("space-y-4", !showAll && "max-h-[340px] overflow-hidden")}>
        {groups.filter(([, ls]) => ls.length).map(([label, ls]) => (
          <div key={label}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {ls.map(l => {
                const on = selected.includes(l.code);
                return (
                  <button key={l.code} type="button" onClick={() => toggle(l.code)} aria-pressed={on}
                    className={cn("flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition",
                      on ? "border-brand-pink bg-brand-pink-soft" : "border-transparent bg-white ring-1 ring-black/5 hover:ring-brand-pink/40")}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold" dir={l.direction === "RTL" ? "rtl" : undefined}>{l.nameNative}</span>
                      {l.nameNative !== l.nameEn && <span className="block truncate text-[11px] text-muted-foreground">{l.nameEn}</span>}
                    </span>
                    {on ? <Icons.CheckCircle2 size={18} className="shrink-0 text-brand-pink" /> : <Icons.Plus size={16} className="shrink-0 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No language matches “{q}”.</p>}
      </div>
      {!showAll && (
        <button type="button" onClick={() => setShowAll(true)} className="w-full rounded-full border py-2 text-sm font-semibold hover:bg-muted">
          Show all {languages.length} languages
        </button>
      )}
    </div>
  );
}

export function CategoryCardGrid({
  categories, selected, onToggle, dense = false,
}: {
  categories: TaxCategory[]; selected: string[]; onToggle: (id: string) => void; dense?: boolean;
}) {
  return (
    <div className={cn("grid gap-2.5", dense ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
      {categories.map(c => {
        const on = selected.includes(c.id);
        return (
          <button key={c.id} type="button" onClick={() => onToggle(c.id)} aria-pressed={on}
            className={cn("relative flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition",
              on ? "border-brand-blue bg-brand-blue-soft shadow-sm" : "border-transparent bg-white ring-1 ring-black/5 hover:-translate-y-0.5 hover:ring-brand-blue/40")}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ background: `${c.color ?? "#1677FF"}22` }} aria-hidden>{c.emoji ?? "✨"}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold leading-tight">{c.name}</span>
              {c.videoCount > 0 && <span className="mt-0.5 block text-[11px] text-muted-foreground">{c.videoCount} video{c.videoCount === 1 ? "" : "s"}</span>}
            </span>
            {on && <Icons.CheckCircle2 size={18} className="absolute right-2 top-2 text-brand-blue" />}
          </button>
        );
      })}
    </div>
  );
}

/** Per selected category: "All Subcategories" or specific subcategories. */
export function SubcategoryPicker({
  categories, all, subs, onAll, onSubs,
}: {
  categories: TaxCategory[]; // only the selected ones
  all: Record<string, boolean>;
  subs: string[];
  onAll: (next: Record<string, boolean>) => void;
  onSubs: (next: string[]) => void;
}) {
  return (
    <div className="space-y-4">
      {categories.map(c => {
        const isAll = !!all[c.id];
        const chosen = c.subcategories.filter(s => subs.includes(s.id)).length;
        return (
          <div key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display text-base font-bold"><span aria-hidden>{c.emoji}</span>{c.name}</p>
              <span className={cn("text-xs", isAll || chosen ? "text-emerald-600" : "text-muted-foreground")}>
                {isAll ? "All subcategories" : chosen ? `${chosen} chosen` : "Pick at least one"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={isAll}
                onClick={() => onAll({ ...all, [c.id]: !isAll })}
                className={cn("rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition",
                  isAll ? "border-brand-pink bg-brand-pink text-white" : "border-brand-pink/40 text-brand-pink hover:bg-brand-pink-soft")}>
                ✨ All Subcategories
              </button>
              {c.subcategories.map(s => {
                const on = subs.includes(s.id);
                return (
                  <button key={s.id} type="button" aria-pressed={on} disabled={isAll}
                    onClick={() => onSubs(on ? subs.filter(x => x !== s.id) : [...subs, s.id])}
                    className={cn("rounded-full border px-3.5 py-1.5 text-sm transition disabled:opacity-40",
                      on ? "border-brand-blue bg-brand-blue text-white" : "bg-white hover:border-brand-blue/50")}>
                    {s.emoji ? `${s.emoji} ` : ""}{s.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** True when every selected category has "All" or at least one chosen subcategory. */
export function interestsComplete(categories: TaxCategory[], all: Record<string, boolean>, subs: string[]) {
  return categories.length > 0 && categories.every(c => all[c.id] || c.subcategories.some(s => subs.includes(s.id)));
}
