"use client";

// Section B (language) + Section C (categories) of the upload/edit form. Shared by the creator
// upload page, "My Videos" tag editing and the admin Video Tag Review correction dialog.
// Mirrors the server rules; the server re-validates everything.
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLanguages, useCategories } from "@/lib/use-taxonomy";
import type { TagFormValue, TagSuggestions, TaxLanguage, TaxCategory, VideoTag } from "@/lib/client";

export const MAX_TAGS = 3;
export const MAX_EXTRA_LANGUAGES = 2;
export const EMPTY_TAGS: TagFormValue = { primary: "", additional: [], tags: [{ categoryId: "", subcategoryId: "" }] };

/** Client-side copy of the server rules (same messages). Returns the first problem, or null. */
export function validateTagForm(v: TagFormValue, categories: TaxCategory[], keep: VideoTag[] = []): string | null {
  if (!v.primary) return "Choose the main language spoken in your video.";
  if (v.additional.filter(c => c !== v.primary).length > MAX_EXTRA_LANGUAGES) return "Add at most 2 extra languages — only ones actually spoken in the video.";
  const rows = v.tags.filter(t => t.categoryId || t.subcategoryId);
  if (!rows.length) return "Pick at least one category and subcategory.";
  if (rows.length > MAX_TAGS) return "A video can have at most 3 categories. Remove one to continue.";
  const seen = new Set<string>();
  for (const t of rows) {
    const cat = categories.find(c => c.id === t.categoryId);
    const kept = keep.find(k => k.category.id === t.categoryId);
    if (!cat && !kept) return "Choose a category.";
    const catName = cat?.nameEn ?? kept!.category.name;
    if (seen.has(t.categoryId)) return `${catName} is already selected — each category can be used once.`;
    seen.add(t.categoryId);
    if (!t.subcategoryId) return `Choose a subcategory for ${catName}.`;
    if (cat && !cat.subcategories.some(s => s.id === t.subcategoryId) && !keep.some(k => k.subcategory.id === t.subcategoryId)) {
      return `That subcategory isn't part of ${catName}. Choose a subcategory from that category.`;
    }
  }
  return null;
}

/** Multipart fields for POST /api/creator/upload */
export function tagFormFields(v: TagFormValue) {
  return {
    languages: JSON.stringify({ primary: v.primary, additional: v.additional.filter(c => c && c !== v.primary) }),
    tags: JSON.stringify(v.tags.filter(t => t.categoryId && t.subcategoryId)),
  };
}

/** JSON body for PATCH …/tags */
export function tagFormBody(v: TagFormValue) {
  return {
    languages: { primary: v.primary, additional: v.additional.filter(c => c && c !== v.primary) },
    tags: v.tags.filter(t => t.categoryId && t.subcategoryId),
  };
}

export function tagFormFromVideo(languages: { code: string; isPrimary: boolean }[] = [], tags: VideoTag[] = []): TagFormValue {
  const primary = languages.find(l => l.isPrimary)?.code ?? languages[0]?.code ?? "";
  return {
    primary,
    additional: languages.filter(l => l.code !== primary).map(l => l.code),
    tags: tags.length ? [...tags].sort((a, b) => a.priority - b.priority).map(t => ({ categoryId: t.category.id, subcategoryId: t.subcategory.id })) : [{ categoryId: "", subcategoryId: "" }],
  };
}

// ── language picker (search by English name, native name or code) ──

export function LanguageCombobox({
  value, onSelect, exclude = [], placeholder = "Choose a language", languages, className, disabled,
}: {
  value?: string; onSelect: (code: string) => void; exclude?: string[]; placeholder?: string;
  languages: TaxLanguage[]; className?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = languages.find(l => l.code === value);
  const list = languages.filter(l => !exclude.includes(l.code) || l.code === value);
  const groups: [string, TaxLanguage[]][] = [
    ["Popular", list.filter(l => l.popular)],
    ["Indian languages", list.filter(l => !l.popular && l.group === "INDIAN")],
    ["International", list.filter(l => !l.popular && l.group !== "INDIAN")],
  ];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled}
          className={cn("w-full justify-between font-normal", !current && "text-muted-foreground", className)}>
          {current ? (
            <span className="truncate"><span dir={current.direction === "RTL" ? "rtl" : undefined}>{current.nameNative}</span>
              {current.nameNative !== current.nameEn && <span className="text-muted-foreground"> · {current.nameEn}</span>}</span>
          ) : placeholder}
          <Icons.ChevronsUpDown size={15} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,340px)] p-0" align="start">
        <Command filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0)}>
          <CommandInput placeholder="Search 100+ languages…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No language found.</CommandEmpty>
            {groups.filter(([, ls]) => ls.length).map(([label, ls]) => (
              <CommandGroup key={label} heading={label}>
                {ls.map(l => (
                  <CommandItem key={l.code} value={`${l.nameEn} ${l.nameNative} ${l.code}`} onSelect={() => { onSelect(l.code); setOpen(false); }}>
                    <span className="flex-1 truncate">
                      <span dir={l.direction === "RTL" ? "rtl" : undefined}>{l.nameNative}</span>
                      {l.nameNative !== l.nameEn && <span className="text-muted-foreground"> · {l.nameEn}</span>}
                    </span>
                    {l.code === value && <Icons.Check size={15} className="text-brand-blue" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const ROW_LABEL = ["Primary", "Secondary", "Third"];

export function VideoTagEditor({
  value, onChange, suggestions, keep = [], disabled,
}: {
  value: TagFormValue;
  onChange: (v: TagFormValue) => void;
  suggestions?: TagSuggestions | null;
  /** tags already on the video that may since have been retired (kept, shown read-only) */
  keep?: VideoTag[];
  disabled?: boolean;
}) {
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories();
  const langName = (code: string) => {
    const l = languages.find(x => x.code === code);
    return l ? (l.nameNative !== l.nameEn ? `${l.nameNative} · ${l.nameEn}` : l.nameEn) : code;
  };
  const rows = value.tags.length ? value.tags : [{ categoryId: "", subcategoryId: "" }];
  const setRows = (tags: TagFormValue["tags"]) => onChange({ ...value, tags });
  const usedCats = rows.map(r => r.categoryId).filter(Boolean);

  const langSuggestion = suggestions?.languages?.find(l => l.code !== value.primary && l.confidence !== "low");
  const catSuggestions = useMemo(
    () => (suggestions?.categories ?? []).filter(s => !rows.some(r => r.categoryId === s.categoryId && r.subcategoryId === s.subcategoryId)).slice(0, 4),
    [suggestions, rows],
  );

  const applyCategorySuggestion = (s: TagSuggestions["categories"][number]) => {
    const idx = rows.findIndex(r => r.categoryId === s.categoryId);
    if (idx >= 0) { const next = [...rows]; next[idx] = { categoryId: s.categoryId, subcategoryId: s.subcategoryId }; setRows(next); return; }
    const empty = rows.findIndex(r => !r.categoryId);
    if (empty >= 0) { const next = [...rows]; next[empty] = { categoryId: s.categoryId, subcategoryId: s.subcategoryId }; setRows(next); return; }
    if (rows.length < MAX_TAGS) setRows([...rows, { categoryId: s.categoryId, subcategoryId: s.subcategoryId }]);
  };

  return (
    <div className="space-y-6">
      {/* ── B. Language ── */}
      <section className="space-y-3" aria-labelledby="tag-lang-heading">
        <div>
          <h3 id="tag-lang-heading" className="font-display text-base font-bold">Language</h3>
          <p className="text-xs text-muted-foreground">Pick only languages actually spoken in the video. Our detection is just a suggestion — you decide.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Main language spoken <span className="text-brand-red">*</span></Label>
            <LanguageCombobox languages={languages} value={value.primary} disabled={disabled}
              exclude={value.additional}
              onSelect={code => onChange({ ...value, primary: code, additional: value.additional.filter(c => c !== code) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Other languages spoken <span className="text-muted-foreground">(optional, up to {MAX_EXTRA_LANGUAGES})</span></Label>
            <LanguageCombobox languages={languages} placeholder={value.additional.length >= MAX_EXTRA_LANGUAGES ? "Maximum reached" : "Add a language"}
              disabled={disabled || value.additional.length >= MAX_EXTRA_LANGUAGES || !value.primary}
              exclude={[value.primary, ...value.additional]}
              onSelect={code => onChange({ ...value, additional: [...value.additional, code].slice(0, MAX_EXTRA_LANGUAGES) })} />
          </div>
        </div>
        {value.additional.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.additional.map(code => (
              <span key={code} className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
                {langName(code)}
                <button type="button" aria-label={`Remove ${langName(code)}`} disabled={disabled}
                  onClick={() => onChange({ ...value, additional: value.additional.filter(c => c !== code) })}
                  className="rounded-full p-0.5 hover:bg-brand-blue/20"><Icons.X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        {langSuggestion && !disabled && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-brand-blue/40 bg-brand-blue/5 px-3 py-2 text-xs">
            <Icons.Sparkles size={14} className="text-brand-blue" />
            <span>Looks like <b>{langName(langSuggestion.code)}</b> <span className="text-muted-foreground">({langSuggestion.reason})</span></span>
            <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
              onClick={() => onChange({ ...value, primary: langSuggestion.code, additional: value.additional.filter(c => c !== langSuggestion.code) })}>
              Use as main
            </Button>
            {value.primary && value.additional.length < MAX_EXTRA_LANGUAGES && !value.additional.includes(langSuggestion.code) && (
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
                onClick={() => onChange({ ...value, additional: [...value.additional, langSuggestion.code] })}>Add as extra</Button>
            )}
          </div>
        )}
      </section>

      {/* ── C. Categories ── */}
      <section className="space-y-3" aria-labelledby="tag-cat-heading">
        <div>
          <h3 id="tag-cat-heading" className="font-display text-base font-bold">Categories</h3>
          <p className="text-xs text-muted-foreground">Up to 3 different categories, each with one subcategory. The first is the primary one. Misleading tags are flagged for review.</p>
        </div>
        <div className="space-y-2.5">
          {rows.map((row, i) => {
            const cat = categories.find(c => c.id === row.categoryId);
            const kept = !cat && row.categoryId ? keep.find(k => k.category.id === row.categoryId) : undefined;
            const subs = cat?.subcategories ?? [];
            const keptSub = cat && row.subcategoryId && !subs.some(s => s.id === row.subcategoryId) ? keep.find(k => k.subcategory.id === row.subcategoryId) : undefined;
            return (
              <div key={i} className="rounded-2xl border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", i === 0 ? "bg-brand-pink/15 text-brand-pink" : "bg-muted text-muted-foreground")}>
                    {ROW_LABEL[i]}
                  </span>
                  <div className="flex items-center gap-1">
                    {i > 0 && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={disabled}
                        onClick={() => { const next = [...rows]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setRows(next); }}
                        aria-label="Move up"><Icons.ArrowUp size={14} /></Button>
                    )}
                    {rows.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-brand-red" disabled={disabled}
                        onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove category"><Icons.Trash2 size={14} /></Button>
                    )}
                  </div>
                </div>
                {kept ? (
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                    {kept.category.emoji} {kept.category.name} › {kept.subcategory.name}
                    <span className="ml-2 text-xs text-muted-foreground">(no longer offered — kept on this video)</span>
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select value={row.categoryId || undefined} disabled={disabled}
                      onValueChange={v => { const next = [...rows]; next[i] = { categoryId: v, subcategoryId: "" }; setRows(next); }}>
                      <SelectTrigger aria-label={`${ROW_LABEL[i]} category`}><SelectValue placeholder="Main category" /></SelectTrigger>
                      <SelectContent className="max-h-80">
                        {categories.filter(c => c.id === row.categoryId || !usedCats.includes(c.id)).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={row.subcategoryId || undefined} disabled={disabled || !cat}
                      onValueChange={v => { const next = [...rows]; next[i] = { ...row, subcategoryId: v }; setRows(next); }}>
                      <SelectTrigger aria-label={`${ROW_LABEL[i]} subcategory`}>
                        <SelectValue placeholder={cat ? "Subcategory" : "Choose a category first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {keptSub && <SelectItem value={keptSub.subcategory.id}>{keptSub.subcategory.name} (kept)</SelectItem>}
                        {subs.map(s => <SelectItem key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ""}{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {rows.length < MAX_TAGS && (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setRows([...rows, { categoryId: "", subcategoryId: "" }])}>
            <Icons.Plus size={15} className="mr-1" /> Add another category <span className="ml-1 text-muted-foreground">({rows.length}/{MAX_TAGS})</span>
          </Button>
        )}
        {catSuggestions.length > 0 && !disabled && (
          <div className="rounded-xl border border-dashed border-brand-pink/40 bg-brand-pink/5 px-3 py-2">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium"><Icons.Sparkles size={14} className="text-brand-pink" /> Suggested from your title and hashtags</p>
            <div className="flex flex-wrap gap-1.5">
              {catSuggestions.map(s => {
                const cat = categories.find(c => c.id === s.categoryId);
                const full = rows.length >= MAX_TAGS && !rows.some(r => r.categoryId === s.categoryId || !r.categoryId);
                return (
                  <button type="button" key={s.subcategoryId} disabled={full} onClick={() => applyCategorySuggestion(s)}
                    className="rounded-full border bg-background px-2.5 py-1 text-xs hover:border-brand-pink disabled:opacity-50">
                    {cat?.emoji} {cat?.name ?? s.categoryName} › {cat?.subcategories.find(x => x.id === s.subcategoryId)?.name ?? s.subcategoryName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
