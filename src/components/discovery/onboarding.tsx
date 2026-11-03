"use client";

// Language & interest onboarding (viewers and creators) — 4 steps, progress saved after each step
// so an interrupted sign-up resumes where it stopped. Shown once; everything is editable later in
// "My Interests & Languages".
import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { useAuth } from "@/components/app/auth-provider";
import { get, patch, post, type Preferences } from "@/lib/client";
import { useLanguages, useCategories, defaultGuestLanguages } from "@/lib/use-taxonomy";
import { LanguageMultiPicker, CategoryCardGrid, SubcategoryPicker, interestsComplete, languageLabel } from "./pickers";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Draft = { languages: string[]; primary: string; categories: string[]; all: Record<string, boolean>; subcategoryIds: string[] };

export const ONBOARDING_SKIP_KEY = "kp_onboarding_later";

export function OnboardingPage() {
  const { user, loading, refresh } = useAuth();
  const route = useRoute();
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories();
  const [step, setStep] = useState(1);
  const [langs, setLangs] = useState<string[]>([]);
  const [primary, setPrimary] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [all, setAll] = useState<Record<string, boolean>>({});
  const [subs, setSubs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // who may be here
  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/join", { replace: true });
    else if (user.role === "ADMIN") navigate("/admin", { replace: true });
  }, [loading, user]);

  // resume an interrupted onboarding, or start from the browser's language
  useEffect(() => {
    if (!user || user.role === "ADMIN" || ready || !languages.length) return;
    get<{ preferences: Preferences }>("/me/preferences").then(({ preferences: p }) => {
      if (p.onboarding.completed && route.query.get("redo") !== "1") {
        navigate("/settings/interests", { replace: true });
        return;
      }
      const d = (p.onboarding.draft ?? null) as Partial<Draft> | null;
      if (d && Array.isArray(d.languages)) {
        setLangs(d.languages); setPrimary(d.primary ?? d.languages[0] ?? "");
        setCats(d.categories ?? []); setAll(d.all ?? {}); setSubs(d.subcategoryIds ?? []);
        setStep(Math.min(4, Math.max(1, (p.onboarding.step || 0) + 1)));
      } else if (p.languages.length) {
        setLangs(p.languages.map(l => l.code)); setPrimary(p.languages.find(l => l.isPrimary)?.code ?? p.languages[0].code);
        setCats(p.categories.map(c => c.id));
        setAll(Object.fromEntries(p.categories.filter(c => c.allSubcategories).map(c => [c.id, true])));
        setSubs(p.subcategories.map(s => s.id));
      } else {
        const def = defaultGuestLanguages(languages);
        setLangs(def); setPrimary(def[0] ?? "");
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [user, languages, ready, route.query]);

  const chosenCats = useMemo(() => categories.filter(c => cats.includes(c.id)), [categories, cats]);
  const draft: Draft = { languages: langs, primary, categories: cats, all, subcategoryIds: subs };
  const canNext =
    step === 1 ? langs.length > 0 :
    step === 2 ? cats.length > 0 :
    step === 3 ? interestsComplete(chosenCats, all, subs) : true;

  const go = async (next: number) => {
    if (next > step) patch("/me/onboarding", { step, draft }).catch(() => {}); // remember progress
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const later = () => {
    try { sessionStorage.setItem(ONBOARDING_SKIP_KEY, "1"); } catch { /* private mode */ }
    patch("/me/onboarding", { step: step - 1, draft }).catch(() => {});
    navigate(user?.role === "CREATOR" ? "/dashboard" : "/feed");
  };

  const finish = async () => {
    setBusy(true);
    try {
      const keptSubs = subs.filter(id => chosenCats.some(c => !all[c.id] && c.subcategories.some(s => s.id === id)));
      await post("/me/preferences", {
        languages: [primary, ...langs.filter(c => c !== primary)], primaryLanguage: primary,
        categories: chosenCats.map(c => ({ id: c.id, allSubcategories: !!all[c.id] })),
        subcategoryIds: keptSubs, completeOnboarding: true,
      });
      await refresh();
      navigate("/feed?fresh=1");
    } catch (e) {
      toast({ title: "Couldn't save your choices", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user || !ready) {
    return <div className="flex min-h-screen items-center justify-center bg-surface"><Icons.Loader2 className="animate-spin text-brand-pink" size={30} /></div>;
  }

  const byCode = new Map(languages.map(l => [l.code, l]));

  return (
    <div className="min-h-screen bg-surface" ref={topRef}>
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4">
          <Logo size={32} />
          <div className="flex items-center gap-1.5" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map(n => (
              <span key={n} className={cn("h-2 rounded-full transition-all", n === step ? "w-8 bg-brand-pink" : n < step ? "w-2 bg-brand-blue" : "w-2 bg-black/15")} />
            ))}
          </div>
          {step < 4 ? (
            <button onClick={later} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Maybe later</button>
          ) : <span className="w-16" />}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-32 pt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-pink">Step {step} of 4</p>

        {step === 1 && (
          <section aria-labelledby="ob-1">
            <h1 id="ob-1" className="mt-1 font-display text-3xl font-bold md:text-4xl">Which languages do you love watching?</h1>
            <p className="mt-2 text-muted-foreground">Choose your favorite languages. We'll help you discover videos you'll enjoy.</p>
            <div className="mt-6"><LanguageMultiPicker languages={languages} selected={langs} primary={primary} onChange={setLangs} onPrimary={setPrimary} /></div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="ob-2">
            <h1 id="ob-2" className="mt-1 font-display text-3xl font-bold md:text-4xl">What do you love watching?</h1>
            <p className="mt-2 text-muted-foreground">Pick at least 3 for the best feed — or just one if you already know what you like.</p>
            <p className="mt-1 text-sm font-semibold text-brand-blue">{cats.length} selected</p>
            <div className="mt-5"><CategoryCardGrid categories={categories} selected={cats}
              onToggle={id => setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id])} /></div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="ob-3">
            <h1 id="ob-3" className="mt-1 font-display text-3xl font-bold md:text-4xl">Let's make your feed even better.</h1>
            <p className="mt-2 text-muted-foreground">For each category, choose the kinds of videos you like — or pick “All Subcategories”.</p>
            <button type="button" className="mt-3 text-sm font-semibold text-brand-pink hover:underline"
              onClick={() => setAll(Object.fromEntries(chosenCats.map(c => [c.id, true])))}>Choose All Subcategories everywhere</button>
            <div className="mt-5"><SubcategoryPicker categories={chosenCats} all={all} subs={subs} onAll={setAll} onSubs={setSubs} /></div>
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby="ob-4" className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-yellow text-4xl shadow-lg" aria-hidden>🎉</div>
            <h1 id="ob-4" className="mt-5 font-display text-3xl font-bold md:text-4xl">Your feed is ready!</h1>
            <p className="mt-2 text-muted-foreground">Here's what we'll show you. You can change it any time in My Interests &amp; Languages.</p>
            <div className="mx-auto mt-8 max-w-2xl space-y-5 text-left">
              <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {[primary, ...langs.filter(c => c !== primary)].map(code => (
                    <span key={code} className={cn("rounded-full px-3 py-1 text-sm", code === primary ? "bg-brand-pink text-white" : "bg-muted")}>
                      {code === primary && "★ "}{languageLabel(byCode.get(code)) || code}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Interests</p>
                <ul className="space-y-2.5">
                  {chosenCats.map(c => (
                    <li key={c.id} className="text-sm">
                      <span className="font-bold">{c.emoji} {c.name}</span>
                      <span className="text-muted-foreground"> — {all[c.id] ? "All subcategories" : c.subcategories.filter(s => subs.includes(s.id)).map(s => s.name).join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" className="rounded-full" disabled={step === 1} onClick={() => go(step - 1)}>
            <Icons.ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          {step < 4 ? (
            <Button className="grad-btn h-12 rounded-full px-8 text-white" disabled={!canNext} onClick={() => go(step + 1)}>
              Continue <Icons.ArrowRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button className="grad-btn h-12 rounded-full px-8 text-white" disabled={busy} onClick={finish}>
              {busy ? "Saving…" : "Start Watching Videos"} <Icons.Play size={16} className="ml-1.5" fill="currentColor" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

/** After login/registration: should this account be sent to onboarding? (offered, never forced twice per session) */
export function needsOnboarding(u: { role: string; onboarding?: { completed: boolean } } | null) {
  if (!u || u.role === "ADMIN" || !u.onboarding || u.onboarding.completed) return false;
  try { return sessionStorage.getItem(ONBOARDING_SKIP_KEY) !== "1"; } catch { return true; }
}
