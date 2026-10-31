"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon, StatusBadge, EmptyState } from "@/components/shared/ui-bits";
import { AdminPageHeader } from "./shell";
import { get, patch, post } from "@/lib/client";
import { usd, compact, fmtDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

async function action(path: string, body: unknown): Promise<{ message?: string }> {
  const res = await fetch(`/api${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Action failed");
  return data;
}

// ── Monetization Settings ──────────────────────────────────────────────────

type Monetization = {
  id: string; ratePer1000Views: number; rewardPerUpload: number;
  monetizationDurationMonths: number; minWithdrawalAmount: number;
  holdingPeriodDays: number; monetizationPaused: boolean;
  effectiveDate: string;
};

export function AdminMonetizationPage() {
  const [current, setCurrent] = useState<Monetization | null>(null);
  const [history, setHistory] = useState<Monetization[]>([]);
  const [form, setForm] = useState({
    ratePer1000Views: "", rewardPerUpload: "", monetizationDurationMonths: "",
    minWithdrawalAmount: "", holdingPeriodDays: "", monetizationPaused: false, effectiveDate: "",
  });
  const [busy, setBusy] = useState(false);

  const load = () => get<{ current: Monetization; history: Monetization[] }>("/admin/monetization").then(d => {
    setCurrent(d.current);
    setHistory(d.history);
    setForm({
      ratePer1000Views: String(d.current.ratePer1000Views),
      rewardPerUpload: String(d.current.rewardPerUpload),
      monetizationDurationMonths: String(d.current.monetizationDurationMonths),
      minWithdrawalAmount: String(d.current.minWithdrawalAmount),
      holdingPeriodDays: String(d.current.holdingPeriodDays),
      monetizationPaused: d.current.monetizationPaused,
      effectiveDate: "",
    });
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await action("/admin/monetization", {
        ratePer1000Views: parseFloat(form.ratePer1000Views),
        rewardPerUpload: parseFloat(form.rewardPerUpload),
        monetizationDurationMonths: parseInt(form.monetizationDurationMonths),
        minWithdrawalAmount: parseFloat(form.minWithdrawalAmount),
        holdingPeriodDays: parseInt(form.holdingPeriodDays),
        monetizationPaused: form.monetizationPaused,
        effectiveDate: form.effectiveDate || undefined,
      });
      toast({ title: res.message ?? "Saved" });
      load();
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const fields = [
    { k: "ratePer1000Views" as const, l: "Revenue per 1,000 qualified views (USD)", step: "0.01", hint: "Credited proportionally per view event" },
    { k: "rewardPerUpload" as const, l: "Reward per approved upload (USD)", step: "0.01", hint: "One-time credit per video after approval" },
    { k: "monetizationDurationMonths" as const, l: "Monetization duration (months)", step: "1", hint: "How long each video earns from views" },
    { k: "minWithdrawalAmount" as const, l: "Minimum withdrawal amount (USD)", step: "1", hint: "Creators must have at least this available" },
    { k: "holdingPeriodDays" as const, l: "Payment holding period (days)", step: "1", hint: "Fraud-review window before earnings clear" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Monetization Settings"
        description="Rates are versioned: new settings apply to future earnings only — stored earnings keep their original rates."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="bento p-6">
          <h2 className="font-display text-base font-bold">Current & new rates</h2>
          <div className="mt-5 grid gap-5">
            {fields.map(f => (
              <div key={f.k} className="grid gap-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor={`m-${f.k}`}>{f.l}</Label>
                  {current && (
                    <span className="text-xs text-muted-foreground">
                      current: <strong className="text-ink">{f.k.includes("Views") || f.k.includes("Amount") || f.k.includes("Upload") ? usd(Number(current[f.k])) : current[f.k]}</strong>
                    </span>
                  )}
                </div>
                <Input id={`m-${f.k}`} type="number" step={f.step} min="0" value={form[f.k]}
                  onChange={e => setForm(fm => ({ ...fm, [f.k]: e.target.value }))} className="h-11 rounded-xl" />
                <p className="text-[11px] text-muted-foreground">{f.hint}</p>
              </div>
            ))}
            <div className="grid gap-1.5">
              <Label htmlFor="m-eff">Effective date (optional — default now)</Label>
              <Input id="m-eff" type="date" value={form.effectiveDate}
                onChange={e => setForm(fm => ({ ...fm, effectiveDate: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/70 p-4">
              <div>
                <p className="text-sm font-bold">Monetization status</p>
                <p className="text-xs text-muted-foreground">{form.monetizationPaused ? "Paused — no new earnings credit" : "Active — earning normally"}</p>
              </div>
              <Switch checked={!form.monetizationPaused} onCheckedChange={v => setForm(fm => ({ ...fm, monetizationPaused: !v }))} />
            </div>
            <Button className="grad-btn h-12 rounded-xl text-white" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save new rate version"}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Saving creates a new rate version. If the view rate or upload reward changed, all approved creators are notified
              in-app and by email. Previously credited earnings are never recalculated.
            </p>
          </div>
        </div>

        <div className="bento p-5">
          <h2 className="font-display text-base font-bold">Rate history</h2>
          <p className="text-xs text-muted-foreground">Append-only versions with effective dates</p>
          <div className="scroll-slim mt-4 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div key={h.id} className={`rounded-xl p-4 ${i === 0 ? "bg-brand-red-soft/50 ring-1 ring-brand-red/30" : "bg-secondary/60"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{fmtDate(h.effectiveDate)}</p>
                  {i === 0 && <span className="rounded-full grad-btn px-2.5 py-0.5 text-[10px] font-bold text-white">ACTIVE</span>}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>Rate/1K views: <strong className="text-ink">{usd(h.ratePer1000Views)}</strong></span>
                  <span>Upload reward: <strong className="text-ink">{usd(h.rewardPerUpload)}</strong></span>
                  <span>Duration: <strong className="text-ink">{h.monetizationDurationMonths}mo</strong></span>
                  <span>Hold: <strong className="text-ink">{h.holdingPeriodDays}d</strong></span>
                  <span>Min payout: <strong className="text-ink">{usd(h.minWithdrawalAmount)}</strong></span>
                  <span>Status: <strong className={h.monetizationPaused ? "text-rose-500" : "text-emerald-600"}>{h.monetizationPaused ? "paused" : "active"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Rules ───────────────────────────────────────────────────────────

type UploadRules = {
  minDurationSec: number; maxDurationSec: number; maxFileSizeMB: number;
  maxResolution: string; formats: string; maxDailyUploads: number; maxWeeklyUploads: number;
  requireVideoApproval: boolean; rewardRequiresApproval: boolean;
};

export function AdminUploadRulesPage() {
  const [rules, setRules] = useState<UploadRules | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get<{ rules: UploadRules }>("/admin/upload-rules").then(d => setRules(d.rules)).catch(() => {});
  }, []);

  const save = async () => {
    if (!rules) return;
    setBusy(true);
    try {
      const res = await action("/admin/upload-rules", rules);
      toast({ title: res.message ?? "Saved" });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (!rules) return <div className="shimmer h-96 rounded-2xl" />;

  const num = (k: keyof UploadRules) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRules(r => ({ ...r!, [k]: parseInt(e.target.value) || 0 }));

  return (
    <div>
      <AdminPageHeader
        title="Upload Rules"
        description="Video constraints enforced server-side on every upload. Changes apply immediately to new uploads."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bento space-y-5 p-6">
          <h2 className="font-display text-base font-bold">Video constraints</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="r-min">Min duration (sec)</Label>
              <Input id="r-min" type="number" min="5" value={rules.minDurationSec} onChange={num("minDurationSec")} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-max">Max duration (sec)</Label>
              <Input id="r-max" type="number" min="10" value={rules.maxDurationSec} onChange={num("maxDurationSec")} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-size">Max file size (MB)</Label>
              <Input id="r-size" type="number" min="10" value={rules.maxFileSizeMB} onChange={num("maxFileSizeMB")} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-res">Max resolution</Label>
              <Input id="r-res" value={rules.maxResolution} onChange={e => setRules(r => ({ ...r!, maxResolution: e.target.value }))} className="h-11 rounded-xl" placeholder="1080p" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="r-fmt">Supported formats (comma-separated)</Label>
            <Input id="r-fmt" value={rules.formats} onChange={e => setRules(r => ({ ...r!, formats: e.target.value }))} className="h-11 rounded-xl" />
            <p className="text-[11px] text-muted-foreground">Currently validated server-side: format extension, file size, duration (via ffprobe) and resolution.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="r-day">Max uploads / day</Label>
              <Input id="r-day" type="number" min="1" value={rules.maxDailyUploads} onChange={num("maxDailyUploads")} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="r-week">Max uploads / week</Label>
              <Input id="r-week" type="number" min="1" value={rules.maxWeeklyUploads} onChange={num("maxWeeklyUploads")} className="h-11 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bento space-y-4 p-6">
            <h2 className="font-display text-base font-bold">Approval workflow</h2>
            {[
              { k: "requireVideoApproval" as const, t: "Videos require manual approval", d: "New uploads wait in the review queue before going public. Turning off auto-publishes after fingerprint checks pass." },
              { k: "rewardRequiresApproval" as const, t: "Upload rewards require approval", d: "The $ reward is credited only after approval (or instantly on publish when off)." },
            ].map(s => (
              <div key={s.k} className="flex items-start justify-between gap-4 rounded-xl bg-secondary/60 p-4">
                <div>
                  <p className="text-sm font-bold">{s.t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
                <Switch checked={rules[s.k]} onCheckedChange={v => setRules(r => ({ ...r!, [s.k]: v }))} />
              </div>
            ))}
          </div>
          <div className="bento bg-ink p-6 text-white">
            <p className="flex items-center gap-1.5 text-sm font-bold"><Icons.Fingerprint size={16} className="text-brand-yellow" /> Always-on protections</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/65">
              <li>• SHA-256 exact-match detection cannot be disabled</li>
              <li>• Perceptual visual + audio fingerprinting on every upload</li>
              <li>• Duration, format, size and resolution validated server-side with ffprobe</li>
              <li>• Duplicate flags withhold all rewards pending human review</li>
            </ul>
          </div>
          <Button className="grad-btn h-12 w-full rounded-xl text-white" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save upload rules"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Categories & Hashtags ──────────────────────────────────────────────────

export function AdminCategoriesPage() {
  const [cats, setCats] = useState<{ id: string; name: string; slug: string; icon: string | null; videoCount: number; active: boolean }[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Film");
  const [busy, setBusy] = useState(false);

  const load = () => get<{ categories: typeof cats }>("/admin/categories").then(d => setCats(d.categories)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      const res = await action("/admin/categories", { name, icon });
      toast({ title: res.message ?? "Created" });
      setName("");
      load();
    } catch (e) {
      toast({ title: "Couldn't create", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const ICONS = ["Film", "Laugh", "Coffee", "GraduationCap", "UtensilsCrossed", "Plane", "Cpu", "Dumbbell", "Flower2", "Music", "PawPrint", "Shirt", "Gamepad2", "Palette", "Mountain", "PartyPopper"];

  return (
    <div>
      <AdminPageHeader
        title="Categories & Hashtags"
        description="Categories power Explore, Trending and creator onboarding. Hashtags are free-form on upload."
      />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="bento h-fit p-6">
          <h2 className="font-display text-base font-bold">Create category</h2>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Automotive" className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-1.5">
                {ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)}
                    className={`flex h-9 items-center justify-center rounded-lg transition ${icon === i ? "grad-btn text-white" : "bg-secondary hover:bg-secondary/70"}`}
                    aria-label={i}>
                    <CategoryIcon name={ICONS.find(() => i === ("" + i)) ? undefined : undefined} size={0} />
                    <span className="sr-only">{i}</span>
                    <IconByName name={i} />
                  </button>
                ))}
              </div>
            </div>
            <Button className="grad-btn h-11 rounded-xl text-white" disabled={busy || name.trim().length < 2} onClick={create}>
              {busy ? "Creating…" : "Create category"}
            </Button>
          </div>
        </div>

        <div className="bento overflow-hidden">
          <div className="border-b bg-secondary/50 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold">All categories ({cats.length})</h2>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {cats.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border p-3.5">
                <span className="rounded-lg bg-brand-red-soft p-2"><CategoryIcon name={c.name} size={16} className="text-brand-red" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{compact(c.videoCount)} videos · /{c.slug}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconByName({ name }: { name: string }) {
  const map: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Film: Icons.Film, Laugh: Icons.Laugh, Coffee: Icons.Coffee, GraduationCap: Icons.GraduationCap,
    UtensilsCrossed: Icons.UtensilsCrossed, Plane: Icons.Plane, Cpu: Icons.Cpu, Dumbbell: Icons.Dumbbell,
    Flower2: Icons.Flower2, Music: Icons.Music, PawPrint: Icons.PawPrint, Shirt: Icons.Shirt,
    Gamepad2: Icons.Gamepad2, Palette: Icons.Palette, Mountain: Icons.Mountain, PartyPopper: Icons.PartyPopper,
  };
  const Icon = map[name] ?? Icons.Film;
  return <Icon size={15} />;
}

// ── Homepage Management ────────────────────────────────────────────────────

export function AdminHomepagePage() {
  const [config, setConfig] = useState({ heroTitle: "", heroSubtitle: "", announcement: "" });
  const [videos, setVideos] = useState<{ id: string; contentId: string; title: string; thumbnailUrl: string | null; views: number; featured: boolean; creator: { username: string } }[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => get<{ videos: typeof videos; config: typeof config }>("/admin/homepage").then(d => {
    setVideos(d.videos);
    setConfig(c => ({ ...c, ...d.config }));
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await action("/admin/homepage", config);
      toast({ title: res.message ?? "Saved" });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const toggleFeature = async (v: typeof videos[0]) => {
    try {
      const res = await action(`/admin/videos/${v.contentId}/action`, { action: "toggle-featured" });
      toast({ title: res.message ?? "Done" });
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Homepage Management"
        description="Hero copy, announcement bar and featured videos shown on the public homepage."
      />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="bento h-fit space-y-4 p-6">
          <h2 className="font-display text-base font-bold">Marketing content</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="h-title">Hero title</Label>
            <Input id="h-title" value={config.heroTitle} onChange={e => setConfig(c => ({ ...c, heroTitle: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="h-sub">Hero subtitle</Label>
            <Textarea id="h-sub" rows={3} value={config.heroSubtitle} onChange={e => setConfig(c => ({ ...c, heroSubtitle: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="h-ann">Announcement bar</Label>
            <Input id="h-ann" value={config.announcement} onChange={e => setConfig(c => ({ ...c, announcement: e.target.value }))} className="h-11 rounded-xl" placeholder="Shown above the hero title" />
          </div>
          <Button className="grad-btn h-11 w-full rounded-xl text-white" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save homepage content"}
          </Button>
        </div>

        <div className="bento overflow-hidden">
          <div className="border-b bg-secondary/50 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold">Featured videos (homepage "Trending" grid)</h2>
            <p className="text-xs text-muted-foreground">Featured videos get priority placement on the homepage.</p>
          </div>
          <div className="scroll-slim max-h-[600px] overflow-y-auto p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map(v => (
                <div key={v.id} className="overflow-hidden rounded-xl border">
                  <div className="relative aspect-video bg-ink">
                    {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                    {v.featured && (
                      <span className="absolute left-2 top-2 rounded-full bg-brand-yellow px-2.5 py-1 text-[10px] font-bold text-ink">★ Featured</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-xs font-bold">{v.title}</p>
                    <p className="text-[11px] text-muted-foreground">{v.contentId} · {compact(v.views)} views · @{v.creator.username}</p>
                    <Button size="sm" variant={v.featured ? "outline" : "default"}
                      className={`mt-2 h-8 w-full rounded-full text-xs ${v.featured ? "" : "grad-btn text-white"}`}
                      onClick={() => toggleFeature(v)}>
                      {v.featured ? "Remove from homepage" : "Feature on homepage"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Notifications (broadcast) ──────────────────────────────────────────────

export function AdminNotificationsPage() {
  const [form, setForm] = useState({ title: "", message: "" });
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const res = await action("/admin/broadcast", form);
      toast({ title: "Announcement sent 📣", description: res.message });
      setForm({ title: "", message: "" });
    } catch (e) {
      toast({ title: "Couldn't send", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        description="Broadcast platform announcements to creators — delivered in-app and by email (logged in the demo mail log)."
      />
      <div className="grid gap-4 lg:grid-cols-[480px_1fr]">
        <div className="bento space-y-4 p-6">
          <h2 className="font-display text-base font-bold">New announcement</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. PayPal payouts now available in the EU" className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="n-msg">Message</Label>
            <Textarea id="n-msg" rows={6} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="What should creators know? Keep it clear and actionable." className="rounded-xl" />
          </div>
          <Button className="grad-btn h-11 w-full rounded-xl text-white" disabled={busy || form.title.length < 3 || form.message.length < 10} onClick={send}>
            {busy ? "Sending…" : "Send to all creators"}
          </Button>
        </div>

        <div className="bento p-6">
          <h2 className="font-display text-base font-bold">Automated notifications</h2>
          <p className="mt-1 text-xs text-muted-foreground">These fire automatically from platform workflows — no manual action needed.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { t: "Application submitted", d: "Creator applies" },
              { t: "Account approved / rejected", d: "Admin decision (with reason)" },
              { t: "Video upload received", d: "Passes technical validation" },
              { t: "Video approved / rejected", d: "Admin decision (with reason)" },
              { t: "Duplicate content detected", d: "Fingerprint match ≥ threshold" },
              { t: "Daily / weekly limit reached", d: "Upload caps" },
              { t: "Earnings credited", d: "View events & rewards" },
              { t: "Monetization window expiring", d: "Reminder near 4-month mark" },
              { t: "Withdrawal status changes", d: "Requested → paid / rejected" },
              { t: "Account warning / suspension", d: "Trust & safety" },
              { t: "Rate change announcement", d: "Monetization settings saved" },
              { t: "Admin adjustments", d: "Ledger corrections" },
            ].map(n => (
              <div key={n.t} className="flex items-start gap-2.5 rounded-xl bg-secondary/60 p-3.5">
                <Icons.BellRing size={15} className="mt-0.5 shrink-0 text-brand-red" />
                <div>
                  <p className="text-xs font-bold">{n.t}</p>
                  <p className="text-[11px] text-muted-foreground">{n.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reports & Analytics ────────────────────────────────────────────────────

export function AdminReportsPage() {
  const [data, setData] = useState<{
    summary: { creators: number; videos: number; totalEarnings: number; paidOut: number; avgPayout: number };
  } | null>(null);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    get<typeof data>("/admin/reports").then(setData).catch(() => {});
  }, []);

  const exportCsv = (kind: string) => {
    setExporting(kind);
    // build CSV client-side from admin APIs
    const urls: Record<string, string> = {
      creators: "/admin/creators",
      videos: "/admin/videos",
      withdrawals: "/admin/withdrawals",
    };
    fetch(`/api${urls[kind]}`)
      .then(r => r.json())
      .then(json => {
        const rows = json.creators ?? json.videos ?? json.withdrawals ?? [];
        if (rows.length === 0) { toast({ title: "Nothing to export" }); setExporting(""); return; }
        const headers = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== "object");
        const csv = [
          headers.join(","),
          ...rows.map((r: Record<string, unknown>) =>
            headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `clipora-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        toast({ title: `Exported ${kind}`, description: `${rows.length} rows downloaded as CSV.` });
        setExporting("");
      })
      .catch(() => { toast({ title: "Export failed", variant: "destructive" }); setExporting(""); });
  };

  return (
    <div>
      <AdminPageHeader
        title="Reports & Analytics"
        description="Platform-wide summaries and exportable datasets for finance and operations."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { l: "Registered creators", v: compact(data?.summary.creators ?? 0) },
          { l: "Total videos", v: compact(data?.summary.videos ?? 0) },
          { l: "Lifetime earnings", v: usd(data?.summary.totalEarnings ?? 0, 0) },
          { l: "Paid to creators", v: usd(data?.summary.paidOut ?? 0, 0) },
          { l: "Average payout", v: usd(data?.summary.avgPayout ?? 0) },
        ].map(c => (
          <div key={c.l} className="bento p-5">
            <p className="font-display text-2xl font-bold">{c.v}</p>
            <p className="text-xs text-muted-foreground">{c.l}</p>
          </div>
        ))}
      </div>

      <div className="bento mt-4 p-6">
        <h2 className="font-display text-base font-bold">Data exports</h2>
        <p className="mt-1 text-xs text-muted-foreground">Download platform datasets as CSV for reconciliation and accounting.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { k: "creators", t: "Creator report", d: "Accounts, statuses, channels, lifetime earnings" },
            { k: "videos", t: "Video report", d: "Content IDs, statuses, views, qualified views, fingerprints" },
            { k: "withdrawals", t: "Payment report", d: "Payout requests, methods, statuses, references" },
          ].map(x => (
            <div key={x.k} className="rounded-2xl border p-5">
              <Icons.FileDown size={20} className="text-brand-blue" />
              <p className="mt-3 text-sm font-bold">{x.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{x.d}</p>
              <Button size="sm" variant="outline" className="mt-4 w-full rounded-full"
                disabled={exporting === x.k} onClick={() => exportCsv(x.k)}>
                {exporting === x.k ? "Preparing…" : "Download CSV"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Admin Users & Roles ────────────────────────────────────────────────────

export function AdminUsersPage() {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; adminRole: string | null; status: string; createdAt: string }[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", adminRole: "MODERATOR" });
  const [busy, setBusy] = useState(false);

  const load = () => get<{ users: typeof users }>("/admin/users").then(d => setUsers(d.users)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy(true);
    try {
      const res = await action("/admin/users", form);
      toast({ title: res.message ?? "Created" });
      setForm({ name: "", email: "", password: "", adminRole: "MODERATOR" });
      load();
    } catch (e) {
      toast({ title: "Couldn't create admin", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const ROLE_DESC: Record<string, string> = {
    SUPER_ADMIN: "Full access — settings, monetization, admins, everything",
    FINANCE: "Withdrawals, earnings adjustments, reports, creator & video views",
    MODERATOR: "Creators, videos, duplicates, fraud, categories, broadcasts",
  };

  return (
    <div>
      <AdminPageHeader
        title="Admin Users & Roles"
        description="Role-based access control. Every admin action is audit-logged with the actor's identity."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="bento overflow-hidden">
          <div className="border-b bg-secondary/50 px-5 py-3.5">
            <h2 className="font-display text-sm font-bold">Team ({users.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Since</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      u.adminRole === "SUPER_ADMIN" ? "bg-brand-red-soft text-brand-red"
                      : u.adminRole === "FINANCE" ? "bg-emerald-50 text-emerald-700"
                      : "bg-brand-blue-soft text-brand-blue"}`}>
                      {u.adminRole}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bento h-fit space-y-4 p-6">
          <h2 className="font-display text-base font-bold">Add admin user</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="a-name">Name</Label>
            <Input id="a-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="a-email">Email</Label>
            <Input id="a-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="a-pw">Temporary password (8+ chars)</Label>
            <Input id="a-pw" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <div className="space-y-2">
              {["SUPER_ADMIN", "FINANCE", "MODERATOR"].map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, adminRole: r }))}
                  className={`w-full rounded-xl border-2 p-3 text-left transition ${form.adminRole === r ? "border-brand-red bg-brand-red-soft/40" : "hover:border-border"}`}>
                  <p className="text-xs font-bold">{r}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{ROLE_DESC[r]}</p>
                </button>
              ))}
            </div>
          </div>
          <Button className="grad-btn h-11 w-full rounded-xl text-white" disabled={busy || form.name.length < 2 || !form.email.includes("@") || form.password.length < 8} onClick={create}>
            {busy ? "Creating…" : "Create admin"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Platform Settings ──────────────────────────────────────────────────────

export function AdminPlatformPage() {
  const [data, setData] = useState<{
    settings: {
      branding: { name: string; tagline: string; supportEmail: string; domain: string } | null;
      payouts: { methods: { id: string; name: string; regions: string }[]; processingDays: string } | null;
    };
    auditLog: { id: string; actorEmail: string; action: string; targetType: string; targetId: string | null; details: string | null; createdAt: string }[];
    mailLog: { id: string; toEmail: string; subject: string; createdAt: string }[];
    contacts: { id: string; name: string; email: string; category: string; subject: string; message: string; status: string; createdAt: string }[];
    subscribers: { id: string; email: string; createdAt: string }[];
  } | null>(null);
  const [branding, setBranding] = useState({ name: "", tagline: "", supportEmail: "", domain: "" });
  const [busy, setBusy] = useState(false);

  const load = () => get<typeof data>("/admin/platform").then(d => {
    setData(d);
    if (d.settings.branding) setBranding(d.settings.branding);
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await action("/admin/platform", { branding });
      toast({ title: res.message ?? "Saved" });
      load();
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (!data) return <div className="shimmer h-96 rounded-2xl" />;

  return (
    <div>
      <AdminPageHeader
        title="Platform Settings"
        description="Branding, payout configuration, audit trail, outbound mail log and support inbox."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bento space-y-4 p-6">
          <h2 className="font-display text-base font-bold">Branding</h2>
          {[
            { k: "name" as const, l: "Platform name" },
            { k: "tagline" as const, l: "Tagline" },
            { k: "supportEmail" as const, l: "Support email" },
            { k: "domain" as const, l: "Domain" },
          ].map(f => (
            <div key={f.k} className="grid gap-1.5">
              <Label htmlFor={`b-${f.k}`}>{f.l}</Label>
              <Input id={`b-${f.k}`} value={branding[f.k]} onChange={e => setBranding(b => ({ ...b, [f.k]: e.target.value }))} className="h-11 rounded-xl" />
            </div>
          ))}
          <div className="rounded-xl bg-secondary/70 p-4">
            <p className="text-xs font-bold">Payout methods (regional availability)</p>
            <div className="mt-2 space-y-1.5">
              {data.settings.payouts?.methods.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs">
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-muted-foreground">{m.regions}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Processing: {data.settings.payouts?.processingDays}</p>
          </div>
          <Button className="grad-btn h-11 w-full rounded-xl text-white" disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save platform settings"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bento p-5">
            <h2 className="font-display text-sm font-bold">Audit log (latest 30)</h2>
            <div className="scroll-slim mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {data.auditLog.map(a => (
                <div key={a.id} className="rounded-lg bg-secondary/60 px-3 py-2">
                  <p className="text-[11px]"><span className="font-bold">{a.action}</span>{a.targetId ? ` → ${a.targetId}` : ""}</p>
                  <p className="text-[10px] text-muted-foreground">{a.actorEmail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bento p-5">
            <h2 className="font-display text-sm font-bold">Outbound mail log (demo email)</h2>
            <p className="text-xs text-muted-foreground">Demo environment: emails are recorded, not sent.</p>
            <div className="scroll-slim mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {data.mailLog.map(m => (
                <div key={m.id} className="rounded-lg bg-secondary/60 px-3 py-2">
                  <p className="text-[11px] font-semibold">{m.subject}</p>
                  <p className="text-[10px] text-muted-foreground">to {m.toEmail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bento p-5">
            <h2 className="font-display text-sm font-bold">Support inbox ({data.contacts.length})</h2>
            <div className="scroll-slim mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {data.contacts.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No messages.</p>}
              {data.contacts.map(c => (
                <div key={c.id} className="rounded-lg bg-secondary/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold">{c.subject}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">{c.category}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{c.name} · {c.email}</p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{c.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
