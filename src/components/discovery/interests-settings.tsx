"use client";

// Settings → My Interests & Languages: everything chosen in onboarding plus discovery controls,
// learned-recommendation reset, blocked creators and "Not interested" review.
import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar } from "@/components/shared/ui-bits";
import { navigate, Link } from "@/components/app/router";
import { useAuth } from "@/components/app/auth-provider";
import { get, post, patch, type Preferences } from "@/lib/client";
import { COUNTRIES } from "@/components/dashboard/channel-studio";
import { useLanguages, useCategories } from "@/lib/use-taxonomy";
import { LanguageMultiPicker, CategoryCardGrid, SubcategoryPicker, interestsComplete } from "./pickers";
import { toast } from "@/hooks/use-toast";
import { timeAgo } from "@/lib/format";
import { DeleteAccountCard } from "@/components/shared/delete-account";

type Blocked = { creatorId: string; channelName: string; username: string; avatarUrl: string | null; verified: boolean; blockedAt: string };
type NotInterested = { videoId: string; contentId: string; title: string; thumbnailUrl: string | null; channelName: string; username: string; available: boolean; markedAt: string };

function Card({ title, icon, description, children, id }: { title: string; icon: keyof typeof Icons; description?: string; children: React.ReactNode; id?: string }) {
  const Icon = Icons[icon] as React.ComponentType<{ size?: number; className?: string }>;
  return (
    <section id={id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Icon size={19} className="text-brand-pink" /> {title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function InterestsSettingsPage() {
  const { user, loading, refresh } = useAuth();
  const { data: languages = [] } = useLanguages();
  const { data: categories = [] } = useCategories();
  const [loaded, setLoaded] = useState(false);
  const [langs, setLangs] = useState<string[]>([]);
  const [primary, setPrimary] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [all, setAll] = useState<Record<string, boolean>>({});
  const [subs, setSubs] = useState<string[]>([]);
  const [discover, setDiscover] = useState(false);
  const [locale, setLocale] = useState("en");
  const [locales, setLocales] = useState<{ code: string; name: string; nameNative: string }[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [ni, setNi] = useState<NotInterested[]>([]);
  const [profile, setProfile] = useState<{ country: string | null; followsPrivate: boolean } | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/login", { replace: true }); }, [loading, user]);

  const load = () => {
    get<{ preferences: Preferences; interfaceLocales: { code: string; name: string; nameNative: string }[] }>("/me/preferences").then(({ preferences: p, interfaceLocales }) => {
      setLangs(p.languages.map(l => l.code)); setPrimary(p.languages.find(l => l.isPrimary)?.code ?? p.languages[0]?.code ?? "");
      setCats(p.categories.map(c => c.id));
      setAll(Object.fromEntries(p.categories.filter(c => c.allSubcategories).map(c => [c.id, true])));
      setSubs(p.subcategories.map(s => s.id));
      setDiscover(p.discoverOtherLanguages); setLocale(p.interfaceLocale); setLocales(interfaceLocales);
      setDirty(false); setLoaded(true);
    }).catch(e => toast({ title: "Couldn't load your settings", description: (e as Error).message, variant: "destructive" }));
    get<{ creators: Blocked[] }>("/me/blocked-creators").then(d => setBlocked(d.creators)).catch(() => {});
    get<{ items: NotInterested[] }>("/me/not-interested").then(d => setNi(d.items)).catch(() => {});
    get<{ profile: { country: string | null; followsPrivate: boolean } }>("/me/profile").then(d => setProfile(d.profile)).catch(() => {});
  };
  const saveProfile = async (change: { country?: string; followsPrivate?: boolean }) => {
    try {
      await patch("/me/profile", change);
      setProfile(p => p ? { ...p, ...change } : p);
      toast({ title: "Saved", description: change.followsPrivate !== undefined ? (change.followsPrivate ? "Creators you follow now see you as a private follower." : "Creators you follow can see your name and country.") : "Country updated." });
    } catch (e) { toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" }); }
  };
  useEffect(() => { if (user && user.role !== "ADMIN") load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosenCats = useMemo(() => categories.filter(c => cats.includes(c.id)), [categories, cats]);
  const problem =
    !langs.length ? "Choose at least one language." :
    !cats.length ? "Pick at least one category." :
    !interestsComplete(chosenCats, all, subs) ? "Each category needs “All Subcategories” or at least one subcategory." : null;
  const touch = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setDirty(true); };

  const save = async () => {
    if (problem) { toast({ title: "Almost there", description: problem, variant: "destructive" }); return; }
    setSaving(true);
    try {
      await post("/me/preferences", {
        languages: [primary, ...langs.filter(c => c !== primary)], primaryLanguage: primary,
        categories: chosenCats.map(c => ({ id: c.id, allSubcategories: !!all[c.id] })),
        subcategoryIds: subs.filter(id => chosenCats.some(c => !all[c.id] && c.subcategories.some(s => s.id === id))),
        discoverOtherLanguages: discover, interfaceLocale: locale, completeOnboarding: true,
      });
      await refresh();
      setDirty(false);
      toast({ title: "Saved ✅", description: "Your feed updates right away." });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const resetLearned = async () => {
    try {
      const r = await post<{ message: string }>("/me/recommendations/reset");
      toast({ title: "Recommendations reset", description: r.message });
    } catch (e) { toast({ title: "Couldn't reset", description: (e as Error).message, variant: "destructive" }); }
  };
  const unblock = async (b: Blocked) => {
    try {
      await post(`/social/hide-creator/${b.creatorId}`, { undo: true });
      setBlocked(list => list.filter(x => x.creatorId !== b.creatorId));
      toast({ title: `@${b.username} can be recommended again` });
    } catch (e) { toast({ title: "Couldn't update", description: (e as Error).message, variant: "destructive" }); }
  };
  const restore = async (n: NotInterested) => {
    try {
      await post(`/social/not-interested/${n.videoId}`, { undo: true });
      setNi(list => list.filter(x => x.videoId !== n.videoId));
      toast({ title: "Video restored to your feed" });
    } catch (e) { toast({ title: "Couldn't update", description: (e as Error).message, variant: "destructive" }); }
  };

  if (loading || !user || !loaded) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Icons.Loader2 className="animate-spin text-brand-pink" size={28} /></div>;
  }
  if (user.role === "ADMIN") {
    return <div className="mx-auto max-w-xl px-4 pt-32 text-center text-muted-foreground">Admin accounts don't have a personal feed.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-32 pt-24 md:pt-28">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold md:text-4xl">My Interests &amp; Languages</h1>
        <p className="mt-2 text-muted-foreground">These choices decide what For You shows you. Change them whenever you like.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/feed?fresh=1")}><Icons.RefreshCw size={15} className="mr-1.5" /> Refresh my feed</Button>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/saved")}><Icons.Bookmark size={15} className="mr-1.5" /> Saved videos</Button>
        </div>
      </div>

      <div className="space-y-5">
        <Card title="Languages I watch" icon="Languages" description="Your feed only shows videos in these languages unless you turn on discovery below.">
          <LanguageMultiPicker compact languages={languages} selected={langs} primary={primary} onChange={touch(setLangs)} onPrimary={touch(setPrimary)} />
        </Card>

        <Card title="Discover other languages" icon="Globe2">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Also show me videos in other languages</span>
              <span className="block text-xs text-muted-foreground">Off by default. When on, a few videos in other languages appear after the ones in your languages.</span>
            </span>
            <Switch checked={discover} onCheckedChange={touch(setDiscover)} aria-label="Also show me videos in other languages" />
          </label>
        </Card>

        <Card title="Categories" icon="Shapes" description="What do you love watching?">
          <CategoryCardGrid dense categories={categories} selected={cats}
            onToggle={id => { setCats(cs => cs.includes(id) ? cs.filter(x => x !== id) : [...cs, id]); setDirty(true); }} />
        </Card>

        {chosenCats.length > 0 && (
          <Card title="Subcategories" icon="ListChecks" description="Fine-tune each category, or keep “All Subcategories”.">
            <SubcategoryPicker categories={chosenCats} all={all} subs={subs} onAll={touch(setAll)} onSubs={touch(setSubs)} />
          </Card>
        )}

        {locales.length > 1 && (
          <Card title="Category names" icon="Type" description="Show category and subcategory names in:">
            <Select value={locale} onValueChange={touch(setLocale)}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{locales.map(l => <SelectItem key={l.code} value={l.code}>{l.nameNative}{l.nameNative !== l.name ? ` · ${l.name}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </Card>
        )}

        <Card title="Learned recommendations" icon="Brain" description="We also learn from what you like, save, share and finish watching. Reset it to go back to just the interests above.">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="rounded-full"><Icons.RotateCcw size={15} className="mr-1.5" /> Reset learned recommendations</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset learned recommendations?</AlertDialogTitle>
                <AlertDialogDescription>Your languages, interests, follows, saved videos and blocked creators stay as they are. Only what we learned from your viewing is forgotten.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetLearned}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>

        {profile && (
          <Card title="Following & privacy" icon="ShieldCheck" description="Creators can see a list of their followers, like on YouTube.">
            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4">
                <span>
                  <span className="block text-sm font-semibold">Show my name and country to creators I follow</span>
                  <span className="block text-xs text-muted-foreground">Turn off to appear as “Private follower”. Your follows still count.</span>
                </span>
                <Switch checked={!profile.followsPrivate} onCheckedChange={v => saveProfile({ followsPrivate: !v })} aria-label="Show my name and country to creators I follow" />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">My country</span>
                <Select value={profile.country ?? undefined} onValueChange={v => saveProfile({ country: v })}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Not shared" /></SelectTrigger>
                  <SelectContent className="max-h-72">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">Optional — only the country, never your city or exact location.</span>
              </div>
            </div>
          </Card>
        )}

        <Card id="blocked" title="Creators I don't want recommended" icon="UserX">
          {blocked.length === 0 ? <p className="text-sm text-muted-foreground">None. Use “Don't recommend this creator” on any video to hide a creator from your feeds and search.</p> : (
            <ul className="divide-y">
              {blocked.map(b => (
                <li key={b.creatorId} className="flex items-center gap-3 py-2.5">
                  <Avatar src={b.avatarUrl} name={b.channelName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.channelName}</p>
                    <p className="text-xs text-muted-foreground">@{b.username} · hidden {timeAgo(b.blockedAt)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => unblock(b)}>Allow again</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card id="not-interested" title="Videos marked “Not interested”" icon="EyeOff">
          {ni.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here. Videos you mark “Not interested” are listed so you can undo it.</p> : (
            <ul className="divide-y">
              {ni.map(n => (
                <li key={n.videoId} className="flex items-center gap-3 py-2.5">
                  <img src={n.thumbnailUrl ?? ""} alt="" className="h-14 w-10 shrink-0 rounded-lg bg-muted object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.channelName} · {timeAgo(n.markedAt)}{!n.available && " · no longer available"}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => restore(n)}>Restore</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <DeleteAccountCard />

        <p className="text-center text-xs text-muted-foreground">
          We never use sensitive personal traits for recommendations. <Link to="/policies/privacy" className="underline">Privacy policy</Link>
        </p>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted-foreground">{problem ?? "You have unsaved changes."}</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="rounded-full" onClick={load}>Undo</Button>
              <Button className="grad-btn rounded-full px-6 text-white" disabled={saving || !!problem} onClick={save}>{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
