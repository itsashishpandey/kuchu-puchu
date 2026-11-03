"use client";

// Creator studio: "Customize channel" (YouTube-style branding + basic info + content) and
// "Followers" (count, list with name + country, country mix, new followers per day).
import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageHeader } from "./shell";
import { Avatar, EmptyState } from "@/components/shared/ui-bits";
import { navigate } from "@/components/app/router";
import { get, patch, api } from "@/lib/client";
import { compact, timeAgo } from "@/lib/format";
import { useAuth } from "@/components/app/auth-provider";
import { useCategories, useLanguages } from "@/lib/use-taxonomy";
import { LanguageCombobox } from "@/components/shared/video-tag-editor";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "United Arab Emirates", "Saudi Arabia", "Nepal",
  "Bangladesh", "Sri Lanka", "Singapore", "Malaysia", "Indonesia", "Philippines", "Germany", "France", "Spain", "Italy",
  "Netherlands", "Brazil", "Mexico", "Japan", "South Korea", "Nigeria", "Kenya", "South Africa", "Other",
];

type ChannelForm = {
  name: string; username: string; tagline: string; description: string; supportEmail: string; country: string;
  showEarnings: boolean; socialLinks: Record<string, string>; avatarUrl: string | null; bannerUrl: string | null;
  preferredCategoryIds: string[]; languageCodes: string[]; followerCount: number; verified: boolean;
};

const EMPTY: ChannelForm = {
  name: "", username: "", tagline: "", description: "", supportEmail: "", country: "", showEarnings: false,
  socialLinks: { instagram: "", youtube: "", x: "", website: "" }, avatarUrl: null, bannerUrl: null,
  preferredCategoryIds: [], languageCodes: [], followerCount: 0, verified: false,
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bento p-5 md:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ChannelPage() {
  const { user, refresh } = useAuth();
  const { data: categories = [] } = useCategories("en");
  const { data: languages = [] } = useLanguages();
  const [form, setForm] = useState<ChannelForm>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"" | "logo" | "banner">("");
  const bannerInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    get<{ channel: Partial<ChannelForm> & { socialLinks?: Record<string, string> | null } }>("/creator/channel").then(d => {
      const c = d.channel;
      setForm(f => ({
        ...f, ...c,
        tagline: c.tagline ?? "", description: c.description ?? "", supportEmail: c.supportEmail ?? "", country: c.country ?? "",
        socialLinks: { ...f.socialLinks, ...Object.fromEntries(Object.entries(c.socialLinks ?? {}).map(([k, v]) => [k, v ?? ""])) },
        preferredCategoryIds: c.preferredCategoryIds ?? [], languageCodes: c.languageCodes ?? [],
      }));
      setLoaded(true);
    }).catch(e => toast({ title: "Couldn't load your channel", description: (e as Error).message, variant: "destructive" }));
  }, []);

  const set = <K extends keyof ChannelForm>(k: K, v: ChannelForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const emailOk = !form.supportEmail || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.supportEmail);

  const upload = async (kind: "logo" | "banner", file: File) => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append(kind, file);
      const res = await api<{ avatarUrl?: string; bannerUrl?: string; message: string }>(`/creator/channel/${kind}`, { method: "POST", body: fd });
      if (res.bannerUrl) set("bannerUrl", res.bannerUrl);
      if (res.avatarUrl) { set("avatarUrl", res.avatarUrl); await refresh(); }
      toast({ title: res.message });
    } catch (e) {
      toast({ title: `Couldn't upload the ${kind}`, description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading("");
      if (bannerInput.current) bannerInput.current.value = "";
      if (logoInput.current) logoInput.current.value = "";
    }
  };

  const removeBanner = async () => {
    try { await api("/creator/channel/banner", { method: "DELETE" }); set("bannerUrl", null); toast({ title: "Banner removed" }); }
    catch (e) { toast({ title: "Couldn't remove the banner", description: (e as Error).message, variant: "destructive" }); }
  };

  const save = async () => {
    if (!emailOk) { toast({ title: "Check the support email", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const primaryCat = categories.find(c => c.id === form.preferredCategoryIds[0]);
      await patch("/creator/channel", {
        name: form.name, tagline: form.tagline, description: form.description, supportEmail: form.supportEmail,
        country: form.country, socialLinks: form.socialLinks, showEarnings: form.showEarnings,
        category: primaryCat?.nameEn, preferredCategoryIds: form.preferredCategoryIds, languageCodes: form.languageCodes,
      });
      await refresh();
      toast({ title: "Channel updated ✅", description: "Your public channel shows the changes now." });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (!loaded) return <div className="flex min-h-[40vh] items-center justify-center"><Icons.Loader2 className="animate-spin text-brand-pink" /></div>;

  return (
    <div>
      <DashboardPageHeader
        title="Customize channel"
        description="Your channel page works like a YouTube channel: banner, logo, name, @username, tagline, followers and an About tab."
        actions={user?.channel && (
          <Button variant="outline" className="rounded-full" onClick={() => navigate(`/c/${user.channel!.username}`)}>
            <Icons.ExternalLink size={15} className="mr-1.5" /> View channel
          </Button>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Section title="Branding" description="Your banner and logo appear on your channel and next to your videos in the feed.">
            <div className="space-y-5">
              <div>
                <Label>Banner image</Label>
                <div className="relative mt-2 aspect-[4/1] overflow-hidden rounded-2xl bg-gradient-to-r from-brand-blue to-brand-pink md:aspect-[6.2/1]">
                  {form.bannerUrl && <img src={form.bannerUrl} alt="Channel banner" className="absolute inset-0 h-full w-full object-cover" />}
                  {uploading === "banner" && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Icons.Loader2 className="animate-spin text-white" /></div>}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Recommended 2560 × 1440 px (PNG, JPG or WebP, up to 6 MB). Keep text and logos in the centre 1546 × 423 px so they show on every screen.</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" disabled={!!uploading} onClick={() => bannerInput.current?.click()}>
                    <Icons.ImagePlus size={15} className="mr-1.5" /> {form.bannerUrl ? "Change" : "Upload"}
                  </Button>
                  {form.bannerUrl && <Button variant="ghost" size="sm" className="rounded-full text-brand-red" onClick={removeBanner}>Remove</Button>}
                </div>
                <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) upload("banner", f); }} />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Avatar src={form.avatarUrl} name={form.name} size={96} className="ring-4 ring-white shadow" />
                  {uploading === "logo" && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"><Icons.Loader2 className="animate-spin text-white" /></div>}
                </div>
                <div>
                  <Label>Logo (channel picture)</Label>
                  <p className="mt-1 text-xs text-muted-foreground">A square image, at least 98 × 98 px, shown as a circle. PNG, JPG or WebP up to 5 MB.</p>
                  <Button variant="outline" size="sm" className="mt-2 rounded-full" disabled={!!uploading} onClick={() => logoInput.current?.click()}>
                    <Icons.Camera size={15} className="mr-1.5" /> {form.avatarUrl ? "Change logo" : "Upload logo"}
                  </Button>
                  <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) upload("logo", f); }} />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Basic info">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ch-name">Name</Label>
                <Input id="ch-name" value={form.name} maxLength={60} onChange={e => set("name", e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>Username</Label>
                <div className="flex h-11 items-center rounded-xl border bg-muted/40 px-3 text-sm">
                  <span className="text-muted-foreground">mykuchupuchu.com/c/</span><span className="font-semibold">{form.username}</span>
                  <Icons.Lock size={13} className="ml-auto text-muted-foreground" aria-label="Can't be changed" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <div className="flex justify-between"><Label htmlFor="ch-tag">Tagline</Label><span className="text-xs text-muted-foreground">{form.tagline.length}/100</span></div>
                <Input id="ch-tag" value={form.tagline} maxLength={100} onChange={e => set("tagline", e.target.value)}
                  placeholder="e.g. Songs, stories and giggles for little ones" className="h-11 rounded-xl" />
                <p className="text-xs text-muted-foreground">One line shown under your channel name.</p>
              </div>
              <div className="grid gap-1.5">
                <div className="flex justify-between"><Label htmlFor="ch-desc">Description</Label><span className="text-xs text-muted-foreground">{form.description.length}/500</span></div>
                <Textarea id="ch-desc" rows={5} value={form.description} maxLength={500} onChange={e => set("description", e.target.value)}
                  placeholder="Tell viewers what your channel is about…" className="rounded-xl" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="ch-email">Support email <span className="font-normal text-muted-foreground">(public, optional)</span></Label>
                  <Input id="ch-email" type="email" value={form.supportEmail} onChange={e => set("supportEmail", e.target.value)}
                    placeholder="hello@yourchannel.com" className={cn("h-11 rounded-xl", !emailOk && "border-brand-red")} />
                  <p className={cn("text-xs", emailOk ? "text-muted-foreground" : "text-brand-red")}>{emailOk ? "Shown on your About tab for viewers and brands." : "That email doesn't look right."}</p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Country</Label>
                  <Select value={form.country || undefined} onValueChange={v => set("country", v)}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="max-h-72">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Links</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {(["instagram", "youtube", "x", "website"] as const).map(k => (
                    <Input key={k} aria-label={k} value={form.socialLinks[k] ?? ""} className="h-11 rounded-xl"
                      onChange={e => set("socialLinks", { ...form.socialLinks, [k]: e.target.value })}
                      placeholder={k === "website" ? "Website — https://…" : k === "youtube" ? "YouTube channel or URL" : k === "x" ? "X handle" : "Instagram handle"} />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="What you make" description="Shown on your channel and used to pre-fill the upload form. Each video still gets its own language and categories.">
            <Label>Main categories <span className="font-normal text-muted-foreground">(up to 5)</span></Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map(c => {
                const on = form.preferredCategoryIds.includes(c.id);
                const full = !on && form.preferredCategoryIds.length >= 5;
                return (
                  <button key={c.id} type="button" disabled={full} aria-pressed={on}
                    onClick={() => set("preferredCategoryIds", on ? form.preferredCategoryIds.filter(x => x !== c.id) : [...form.preferredCategoryIds, c.id])}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-40", on ? "border-brand-blue bg-brand-blue text-white" : "bg-white hover:border-brand-blue/50")}>
                    {c.emoji} {c.name}
                  </button>
                );
              })}
            </div>
            <Label className="mt-5 block">Publishing languages <span className="font-normal text-muted-foreground">(up to 3)</span></Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {form.languageCodes.map(code => {
                const l = languages.find(x => x.code === code);
                return (
                  <span key={code} className="inline-flex items-center gap-1 rounded-full bg-brand-blue-soft px-3 py-1 text-sm font-semibold text-brand-blue">
                    {l?.nameNative ?? code}{l && l.nameNative !== l.nameEn ? ` · ${l.nameEn}` : ""}
                    <button type="button" aria-label="Remove" onClick={() => set("languageCodes", form.languageCodes.filter(c => c !== code))}><Icons.X size={13} /></button>
                  </span>
                );
              })}
              {form.languageCodes.length < 3 && (
                <div className="w-56"><LanguageCombobox languages={languages} exclude={form.languageCodes} placeholder="+ Add language" className="h-9 rounded-full"
                  onSelect={code => set("languageCodes", [...form.languageCodes, code].slice(0, 3))} /></div>
              )}
            </div>
          </Section>

          <div className="flex justify-end">
            <Button className="grad-btn h-12 rounded-xl px-10 text-white" disabled={busy || !emailOk} onClick={save}>{busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bento p-5">
            <p className="text-sm font-bold">Followers</p>
            <p className="mt-1 font-display text-3xl font-bold">{compact(form.followerCount)}</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => navigate("/dashboard/followers")}>
              <Icons.Users size={14} className="mr-1.5" /> See who follows you
            </Button>
          </div>
          <div className="bento p-5">
            <p className="text-sm font-bold">Earnings visibility</p>
            <div className="mt-3 flex items-start gap-3">
              <Switch checked={form.showEarnings} onCheckedChange={v => set("showEarnings", v)} />
              <div>
                <p className="text-[13px] font-semibold">Show verified earnings publicly</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Only ledger-verified amounts are ever shown, and only with your consent.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Followers ──────────────────────────────────────────────────────────────

type Follower = { id: string; name: string; avatarUrl: string | null; country: string | null; followedAt: string; isPrivate: boolean };
type FollowersResponse = {
  total: number; visible: number; private: number; followerCount: number; followers: Follower[]; nextOffset: number | null;
  byCountry: { country: string; count: number }[]; growth: { date: string; count: number }[];
};

export function FollowersPage() {
  const [data, setData] = useState<FollowersResponse | null>(null);
  const [list, setList] = useState<Follower[]>([]);
  const [q, setQ] = useState("");
  const [more, setMore] = useState(false);

  const load = (query: string) => {
    get<FollowersResponse>(`/creator/followers?limit=30${query ? `&q=${encodeURIComponent(query)}` : ""}`)
      .then(d => { setData(d); setList(d.followers); })
      .catch(e => toast({ title: "Couldn't load followers", description: (e as Error).message, variant: "destructive" }));
  };
  useEffect(() => { const t = setTimeout(() => load(q.trim()), q ? 350 : 0); return () => clearTimeout(t); }, [q]);

  const loadMore = async () => {
    if (data?.nextOffset == null) return;
    setMore(true);
    try {
      const d = await get<FollowersResponse>(`/creator/followers?limit=30&offset=${data.nextOffset}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`);
      setList(l => [...l, ...d.followers]); setData(prev => prev ? { ...prev, nextOffset: d.nextOffset } : d);
    } finally { setMore(false); }
  };

  const maxGrowth = useMemo(() => Math.max(1, ...(data?.growth ?? []).map(g => g.count)), [data]);
  const new30 = (data?.growth ?? []).reduce((a, g) => a + g.count, 0);
  const totalCountries = (data?.byCountry ?? []).reduce((a, c) => a + c.count, 0);

  return (
    <div>
      <DashboardPageHeader title="Followers" description="People who follow your channel. Names and countries are shown only for followers who keep their follows public." />
      {!data ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Icons.Loader2 className="animate-spin text-brand-pink" /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="bento p-5"><p className="text-xs text-muted-foreground">Followers</p><p className="mt-1 font-display text-3xl font-bold">{data.followerCount.toLocaleString()}</p></div>
            <div className="bento p-5"><p className="text-xs text-muted-foreground">New in the last 30 days</p><p className="mt-1 font-display text-3xl font-bold text-emerald-600">+{new30}</p></div>
            <div className="bento p-5"><p className="text-xs text-muted-foreground">Following privately</p><p className="mt-1 font-display text-3xl font-bold">{data.private}</p></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="bento p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold">Your followers</h2>
                <div className="relative w-full max-w-xs">
                  <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name" className="h-10 rounded-full pl-9" />
                </div>
              </div>
              {list.length === 0 ? (
                <div className="mt-4"><EmptyState icon="Users" title={q ? "No follower with that name" : "No followers listed yet"}
                  description={q ? "Private followers can't be searched." : "When viewers follow your channel they show up here, newest first."} /></div>
              ) : (
                <ul className="mt-3 divide-y">
                  {list.map(f => (
                    <li key={f.id} className="flex items-center gap-3 py-3">
                      {f.isPrivate
                        ? <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Icons.EyeOff size={16} className="text-muted-foreground" /></span>
                        : <Avatar src={f.avatarUrl} name={f.name} size={40} />}
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-semibold", f.isPrivate && "text-muted-foreground")}>{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.isPrivate ? "Keeps follows private" : f.country ? <><Icons.MapPin size={11} className="mr-0.5 inline" />{f.country}</> : "Country not shared"}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(f.followedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {data.nextOffset != null && (
                <div className="mt-3 flex justify-center"><Button variant="outline" className="rounded-full" disabled={more} onClick={loadMore}>{more ? "Loading…" : "Load more"}</Button></div>
              )}
              {data.followerCount > data.total && (
                <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  Your follower count includes {(data.followerCount - data.total).toLocaleString()} followers from the starter demo data that aren't linked to real accounts, so they can't be listed.
                </p>
              )}
            </section>

            <div className="space-y-4">
              <section className="bento p-5">
                <h2 className="text-sm font-bold">New followers · last 30 days</h2>
                <div className="mt-4 flex h-24 items-end gap-[3px]" role="img" aria-label={`${new30} new followers in the last 30 days`}>
                  {data.growth.map(g => (
                    <div key={g.date} title={`${g.date}: ${g.count}`} className="flex-1 rounded-t bg-brand-blue/80"
                      style={{ height: `${Math.max(4, (g.count / maxGrowth) * 100)}%`, opacity: g.count ? 1 : 0.25 }} />
                  ))}
                </div>
              </section>
              <section className="bento p-5">
                <h2 className="text-sm font-bold">Where your followers are</h2>
                {data.byCountry.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No public followers yet.</p> : (
                  <ul className="mt-3 space-y-2.5">
                    {data.byCountry.slice(0, 8).map(c => (
                      <li key={c.country}>
                        <div className="flex justify-between text-xs"><span>{c.country}</span><span className="font-semibold">{c.count}</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-pink" style={{ width: `${(c.count / Math.max(1, totalCountries)) * 100}%` }} /></div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">Countries are the ones followers chose in their own profile — never worked out from their location.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
