"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DashboardPageHeader } from "./shell";
import { StatusBadge, EmptyState, Avatar } from "@/components/shared/ui-bits";
import { navigate } from "@/components/app/router";
import { get, post, patch } from "@/lib/client";
import { usd, compact, timeAgo, fmtDate, WITHDRAWAL_FLOW, STATUS_LABELS } from "@/lib/format";
import { useAuth } from "@/components/app/auth-provider";
import { toast } from "@/hooks/use-toast";

// ── My Channel page ────────────────────────────────────────────────────────

export function ChannelPage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: "", username: "", description: "", category: "",
    showEarnings: false,
    socialLinks: { instagram: "", youtube: "", x: "", website: "" } as Record<string, string>,
  });
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    get<{ channel: typeof form } & Record<string, unknown>>("/creator/channel").then(d => {
      setForm(f => ({
        ...f,
        name: d.channel.name, username: d.channel.username,
        description: d.channel.description ?? "",
        category: d.channel.category ?? "",
        showEarnings: d.channel.showEarnings,
        socialLinks: { ...f.socialLinks, ...(d.channel.socialLinks ?? {}) },
      }));
    }).catch(() => {});
    get<{ categories: { name: string }[] }>("/public/categories").then(d => setCategories(d.categories)).catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await patch("/creator/channel", { ...form, avatar: avatarFile ? "pending" : undefined });
      if (avatarFile) {
        // upload avatar via multipart (update through channel PATCH accepts JSON only; use profile avatar endpoint through register-like flow)
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await fetch("/api/creator/avatar", { method: "POST", body: fd }).catch(() => {});
      }
      await refresh();
      toast({ title: "Channel updated ✅", description: "Your public channel reflects the changes." });
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <DashboardPageHeader
        title="My Channel"
        description="Your public identity on Kuchu Puchu. Changes appear on your channel page immediately."
        actions={user?.channel && (
          <Button variant="outline" className="rounded-full" onClick={() => navigate(`/c/${user.channel!.username}`)}>
            <Icons.ExternalLink size={15} className="mr-1.5" /> View public channel
          </Button>
        )}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="bento p-6">
          <div className="grid gap-5">
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer">
                <Avatar src={avatarPreview ?? user?.channel?.avatarUrl ?? user?.avatarUrl} name={user?.name ?? ""} size={72} />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-brand-red p-1.5 shadow">
                  <Icons.Camera size={13} className="text-white" />
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              </label>
              <div>
                <p className="font-display text-lg font-bold">{form.name || "Your channel"}</p>
                <p className="text-sm text-muted-foreground">@{form.username} · username can't be changed</p>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ch-name">Channel name</Label>
              <Input id="ch-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="h-11 rounded-xl" maxLength={60} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ch-bio">Biography</Label>
              <Textarea id="ch-bio" rows={4} value={form.description} maxLength={500}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell viewers what your channel is about…" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["instagram", "youtube", "x", "website"] as const).map(k => (
                <div key={k} className="grid gap-1.5">
                  <Label htmlFor={`soc-${k}`} className="capitalize">{k === "x" ? "X (Twitter)" : k}</Label>
                  <Input id={`soc-${k}`} value={form.socialLinks[k] ?? ""} className="h-11 rounded-xl"
                    onChange={e => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [k]: e.target.value } }))}
                    placeholder={k === "website" ? "https://…" : k === "youtube" ? "channel name or URL" : "handle"} />
                </div>
              ))}
            </div>
            <Button className="grad-btn h-12 w-full rounded-xl text-white sm:w-auto sm:px-10" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save channel"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bento p-5">
            <p className="text-sm font-bold">Earnings visibility</p>
            <div className="mt-3 flex items-start gap-3">
              <Switch checked={form.showEarnings} onCheckedChange={v => setForm(f => ({ ...f, showEarnings: v }))} />
              <div>
                <p className="text-[13px] font-semibold">Show verified earnings publicly</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Display your verified lifetime earnings on your public channel page. Only ledger-verified amounts are ever shown, and only with your consent.
                </p>
              </div>
            </div>
          </div>
          <div className="bento p-5">
            <p className="text-sm font-bold">Channel health</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status="APPROVED" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monetization</span>
                <span className="font-bold text-emerald-600">Eligible</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-bold">{compact(user?.channel?.followerCount ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw Money page ────────────────────────────────────────────────────

type WalletData = {
  wallet: { lifetimeEarnings: number; pendingBalance: number; availableBalance: number; totalWithdrawn: number };
  settings: { minWithdrawalAmount: number; holdingPeriodDays: number };
  payoutMethods: { id: string; name: string; regions: string }[];
  paymentDetails: { method: string; maskedAccount: string; accountName?: string } | null;
  withdrawals?: Withdrawal[];
};

type Withdrawal = {
  id: string; amount: number; method: string; status: string;
  details: { maskedAccount: string }; adminNote: string | null;
  paymentRef: string | null; createdAt: string; updatedAt: string;
};

export function WithdrawPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [details, setDetails] = useState({ accountName: "", bank: "", accountNumber: "", paypalEmail: "" });
  const [busy, setBusy] = useState(false);

  const load = () => {
    api_withdrawals();
  };
  const api_withdrawals = () => {
    get<WalletData>("/creator/withdrawals").then(setData).catch(() => {});
  };
  useEffect(() => { load(); }, []);  

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await post("/creator/withdraw", {
        amount: parseFloat(amount), method,
        details: method === "BANK_TRANSFER"
          ? { accountName: details.accountName, bank: details.bank, accountNumber: details.accountNumber }
          : { paypalEmail: details.paypalEmail },
      });
      toast({ title: "Withdrawal requested ✅", description: "Track its status below — funds are locked until paid or rejected." });
      setAmount("");
      load();
    } catch (err) {
      toast({ title: "Couldn't request withdrawal", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const w = data?.wallet;
  const min = data?.settings.minWithdrawalAmount ?? 25;

  return (
    <div>
      <DashboardPageHeader title="Withdraw Money" description="Request payouts from your available balance — bank transfer or PayPal." />

      {/* wallet summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { l: "Lifetime Earnings", v: w ? usd(w.lifetimeEarnings) : "—", i: Icons.Banknote, c: "text-brand-red", bg: "bg-brand-red-soft" },
          { l: "Pending Balance", v: w ? usd(w.pendingBalance) : "—", i: Icons.Hourglass, c: "text-brand-yellow", bg: "bg-brand-yellow-soft", sub: `Clears after ${data?.settings.holdingPeriodDays ?? 7}-day hold` },
          { l: "Available Balance", v: w ? usd(w.availableBalance) : "—", i: Icons.Wallet, c: "text-emerald-600", bg: "bg-emerald-50" },
          { l: "Total Withdrawn", v: w ? usd(w.totalWithdrawn) : "—", i: Icons.Send, c: "text-brand-blue", bg: "bg-brand-blue-soft" },
        ].map(c => (
          <div key={c.l} className="bento p-5">
            <span className={`rounded-xl ${c.bg} p-2.5`}><c.i size={19} className={c.c} /></span>
            <p className="mt-3 font-display text-2xl font-bold">{c.v}</p>
            <p className="text-xs text-muted-foreground">{c.l}</p>
            {c.sub && <p className="mt-0.5 text-[10px] text-muted-foreground/70">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* request form */}
        <form onSubmit={submit} className="bento p-6">
          <h2 className="font-display text-base font-bold">New withdrawal request</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum {usd(min)} · available {w ? usd(w.availableBalance) : "—"}
          </p>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="w-amount">Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-muted-foreground">$</span>
                <Input id="w-amount" type="number" inputMode="decimal" min={min} step="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="h-12 rounded-xl pl-8 font-display text-lg" required />
              </div>
              {w && (
                <div className="flex gap-2">
                  {[50, 100, 250].map(a => (
                    <button key={a} type="button" disabled={w.availableBalance < a}
                      onClick={() => setAmount(String(a))}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground transition enabled:hover:bg-brand-red-soft enabled:hover:text-brand-red disabled:opacity-40">
                      ${a}
                    </button>
                  ))}
                  <button type="button" onClick={() => setAmount(w.availableBalance.toFixed(2))}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-brand-blue-soft hover:text-brand-blue">
                    Max
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>Payout method</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(data?.payoutMethods ?? []).map(m => (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                    className={`rounded-xl border-2 p-3.5 text-left transition ${method === m.id ? "border-brand-red bg-brand-red-soft/40" : "hover:border-border"}`}>
                    <p className="text-sm font-bold">{m.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.regions}</p>
                  </button>
                ))}
              </div>
            </div>

            {method === "BANK_TRANSFER" ? (
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="w-name">Account holder name</Label>
                  <Input id="w-name" value={details.accountName} onChange={e => setDetails(d => ({ ...d, accountName: e.target.value }))}
                    className="h-11 rounded-xl" required placeholder="As it appears on your account" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="w-bank">Bank name</Label>
                    <Input id="w-bank" value={details.bank} onChange={e => setDetails(d => ({ ...d, bank: e.target.value }))}
                      className="h-11 rounded-xl" placeholder="Chase, HSBC…" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="w-acc">Account number</Label>
                    <Input id="w-acc" value={details.accountNumber} onChange={e => setDetails(d => ({ ...d, accountNumber: e.target.value }))}
                      className="h-11 rounded-xl" required placeholder="Stored masked — never displayed again" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="w-paypal">PayPal email</Label>
                <Input id="w-paypal" type="email" value={details.paypalEmail} onChange={e => setDetails(d => ({ ...d, paypalEmail: e.target.value }))}
                  className="h-11 rounded-xl" required placeholder="you@example.com" />
                <p className="text-[11px] text-muted-foreground">Your PayPal name must match your verified channel name.</p>
              </div>
            )}

            <Button type="submit" className="grad-btn h-12 rounded-xl text-white" disabled={busy}>
              {busy ? "Submitting…" : "Request withdrawal"} <Icons.ArrowRight size={16} className="ml-1.5" />
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              By requesting a withdrawal you confirm the payout details are yours. Funds are locked from your available balance
              until the request is paid or rejected. Payments process 3–5 business days after approval.
            </p>
          </div>
        </form>

        {/* history */}
        <div className="bento p-6">
          <h2 className="font-display text-base font-bold">Withdrawal history</h2>
          <div className="scroll-slim mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {(data?.withdrawals ?? []).length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No withdrawals yet.</p>
            )}
            {(data?.withdrawals ?? []).map(wd => {
              const stageIdx = WITHDRAWAL_FLOW.indexOf(wd.status);
              return (
                <div key={wd.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-bold">{usd(wd.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {wd.method === "PAYPAL" ? "PayPal" : "Bank transfer"} · {wd.details?.maskedAccount}
                      </p>
                    </div>
                    <StatusBadge status={wd.status} />
                  </div>
                  {stageIdx >= 0 && wd.status !== "REJECTED" && (
                    <div className="mt-3 flex items-center gap-1">
                      {WITHDRAWAL_FLOW.map((s, i) => (
                        <div key={s} className="flex flex-1 flex-col items-center gap-1">
                          <div className={`h-1.5 w-full rounded-full ${i <= stageIdx ? "grad-btn" : "bg-secondary"}`} />
                          <span className={`text-[8px] font-bold ${i <= stageIdx ? "text-brand-red" : "text-muted-foreground/50"}`}>
                            {STATUS_LABELS[s].split(" ")[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                    <span>{timeAgo(wd.createdAt)}</span>
                    {wd.paymentRef && <span className="rounded bg-secondary px-2 py-0.5 font-mono">{wd.paymentRef}</span>}
                  </div>
                  {wd.adminNote && (
                    <p className="mt-2 rounded-lg bg-secondary p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                      <Icons.Info size={11} className="mr-1 inline" />{wd.adminNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Transaction History page ───────────────────────────────────────────────

export function TransactionsPage() {
  const [data, setData] = useState<{
    entries: { id: string; type: string; amount: number; status: string; description: string; reference: string | null; createdAt: string; availableAt: string | null }[];
    wallet: { lifetimeEarnings: number; pendingBalance: number; availableBalance: number; totalWithdrawn: number };
  } | null>(null);
  useEffect(() => { get<typeof data>("/creator/transactions").then(setData).catch(() => {}); }, []);

  const typeLabel: Record<string, string> = {
    VIEW_EARNING: "View earnings", UPLOAD_REWARD: "Upload reward",
    ADJUSTMENT: "Admin adjustment", WITHDRAWAL_PAID: "Withdrawal paid",
    WITHDRAWAL_HOLD: "Withdrawal locked", WITHDRAWAL_REJECTED: "Withdrawal returned",
  };

  return (
    <div>
      <DashboardPageHeader
        title="Transaction History"
        description="Your complete, immutable ledger: every credit, adjustment and payout."
      />
      {!data ? (
        <div className="shimmer h-96 rounded-2xl" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { l: "Lifetime", v: usd(data.wallet.lifetimeEarnings) },
              { l: "Pending", v: usd(data.wallet.pendingBalance) },
              { l: "Available", v: usd(data.wallet.availableBalance) },
              { l: "Withdrawn", v: usd(data.wallet.totalWithdrawn) },
            ].map(c => (
              <div key={c.l} className="bento p-4">
                <p className="font-display text-xl font-bold">{c.v}</p>
                <p className="text-xs text-muted-foreground">{c.l}</p>
              </div>
            ))}
          </div>
          <div className="bento mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Description</th>
                    <th className="px-5 py-3.5 font-semibold">Reference</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map(e => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-secondary/30">
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold">{typeLabel[e.type] ?? e.type}</td>
                      <td className="max-w-72 truncate px-5 py-3.5 text-muted-foreground">{e.description}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-muted-foreground">{e.reference ?? "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">{fmtDate(e.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          e.status === "PENDING" ? "bg-amber-50 text-amber-700" : e.status === "FINALIZED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {e.status === "PENDING" ? "In holding" : e.status === "FINALIZED" ? "Finalized" : e.status}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-5 py-3.5 text-right font-bold ${e.amount >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {e.amount >= 0 ? "+" : ""}{usd(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Notifications page ─────────────────────────────────────────────────────

const NOTIF_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  APPLICATION_SUBMITTED: { icon: Icons.FileUp, color: "text-brand-blue bg-brand-blue-soft" },
  ACCOUNT_STATUS: { icon: Icons.UserCheck, color: "text-emerald-600 bg-emerald-50" },
  VIDEO_STATUS: { icon: Icons.Video, color: "text-brand-red bg-brand-red-soft" },
  DUPLICATE: { icon: Icons.CopyX, color: "text-orange-500 bg-orange-50" },
  LIMIT: { icon: Icons.CalendarClock, color: "text-amber-600 bg-amber-50" },
  EARNING: { icon: Icons.BadgeDollarSign, color: "text-brand-yellow bg-brand-yellow-soft" },
  MONETIZATION: { icon: Icons.TrendingUp, color: "text-brand-blue bg-brand-blue-soft" },
  WITHDRAWAL: { icon: Icons.Banknote, color: "text-emerald-600 bg-emerald-50" },
  WARNING: { icon: Icons.TriangleAlert, color: "text-rose-500 bg-rose-50" },
  ANNOUNCEMENT: { icon: Icons.Megaphone, color: "text-brand-red bg-brand-red-soft" },
};

export function NotificationsPage() {
  const [items, setItems] = useState<{
    id: string; type: string; title: string; body: string; read: boolean;
    link: string | null; createdAt: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ notifications: typeof items }>("/creator/notifications")
      .then(d => setItems(d.notifications)).finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await post("/creator/notifications-read").catch(() => {});
    setItems(items.map(i => ({ ...i, read: true })));
    toast({ title: "All caught up ✅" });
  };

  return (
    <div>
      <DashboardPageHeader
        title="Notifications"
        description="Approval updates, upload limits, earnings and payout alerts."
        actions={
          <Button variant="outline" className="rounded-full" onClick={markAll}>
            <Icons.CheckCheck size={15} className="mr-1.5" /> Mark all read
          </Button>
        }
      />
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="Bell" title="No notifications yet" description="Platform updates will land here." />
      ) : (
        <div className="space-y-2.5">
          {items.map(n => {
            const meta = NOTIF_ICON[n.type] ?? NOTIF_ICON.ANNOUNCEMENT;
            return (
              <button
                key={n.id}
                onClick={() => n.link && navigate(n.link.replace("#", ""))}
                className={`bento flex w-full items-start gap-4 p-4 text-left transition hover:shadow-md ${!n.read ? "ring-1 ring-brand-red/30" : ""}`}
              >
                <span className={`rounded-xl p-2.5 ${meta.color}`}><meta.icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-red" />}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{n.body}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                </div>
                {n.link && <Icons.ChevronRight size={16} className="mt-1 shrink-0 text-muted-foreground/50" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Account Settings page ──────────────────────────────────────────────────

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({ name: "", phone: "", country: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pay, setPay] = useState({ method: "BANK_TRANSFER", accountName: "", bank: "", accountNumber: "", paypalEmail: "" });
  const [savedPay, setSavedPay] = useState<{ method: string; maskedAccount: string } | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    get<{ profile: { name: string; phone: string | null; country: string | null; paymentDetails: { method: string; maskedAccount: string } | null } }>("/creator/channel")
      .then(d => {
        setProfile({ name: d.profile.name, phone: d.profile.phone ?? "", country: d.profile.country ?? "" });
        if (d.profile.paymentDetails) {
          setSavedPay(d.profile.paymentDetails);
          setPay(p => ({ ...p, method: d.profile.paymentDetails!.method }));
        }
      }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setBusy("profile");
    try {
      await patch("/creator/profile", profile);
      await refresh();
      toast({ title: "Profile updated ✅" });
    } catch (e) { toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(""); }
  };

  const savePassword = async () => {
    if (pw.newPassword !== pw.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setBusy("password");
    try {
      await patch("/creator/password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast({ title: "Password changed ✅", description: "Use your new password next time you log in." });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) { toast({ title: "Couldn't change password", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(""); }
  };

  const savePayment = async () => {
    setBusy("payment");
    try {
      await patch("/creator/payment", {
        method: pay.method,
        details: pay.method === "BANK_TRANSFER"
          ? { accountName: pay.accountName, bank: pay.bank, accountNumber: pay.accountNumber }
          : { paypalEmail: pay.paypalEmail },
      });
      const d = await get<{ profile: { paymentDetails: { method: string; maskedAccount: string } | null } }>("/creator/channel");
      setSavedPay(d.profile.paymentDetails);
      toast({ title: "Payment details saved ✅", description: "Account numbers are stored masked for security." });
    } catch (e) { toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(""); }
  };

  return (
    <div>
      <DashboardPageHeader title="Account Settings" description="Profile, password, payout details and security." />
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="h-11 rounded-full bg-secondary p-1">
          <TabsTrigger value="profile" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:shadow">Profile</TabsTrigger>
          <TabsTrigger value="password" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:shadow">Password</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:shadow">Payment details</TabsTrigger>
          <TabsTrigger value="security" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:shadow">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="bento max-w-xl space-y-4 p-6">
          <div className="grid gap-1.5">
            <Label htmlFor="s-name">Full name</Label>
            <Input id="s-name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-email">Email (login)</Label>
            <Input id="s-email" value={user?.email ?? ""} disabled className="h-11 rounded-xl opacity-60" />
            <p className="text-[11px] text-muted-foreground">Contact support to change your login email.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="s-phone">Mobile number</Label>
              <Input id="s-phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-country">Country</Label>
              <Input id="s-country" value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} className="h-11 rounded-xl" />
            </div>
          </div>
          <Button className="grad-btn rounded-full text-white" disabled={busy === "profile"} onClick={saveProfile}>
            {busy === "profile" ? "Saving…" : "Save profile"}
          </Button>
        </TabsContent>

        <TabsContent value="password" className="bento max-w-xl space-y-4 p-6">
          <div className="grid gap-1.5">
            <Label htmlFor="s-cur">Current password</Label>
            <Input id="s-cur" type="password" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="s-new">New password</Label>
              <Input id="s-new" type="password" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} className="h-11 rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-conf">Confirm new password</Label>
              <Input id="s-conf" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className="h-11 rounded-xl" />
            </div>
          </div>
          <Button className="grad-btn rounded-full text-white" disabled={busy === "password" || !pw.currentPassword || pw.newPassword.length < 8} onClick={savePassword}>
            {busy === "password" ? "Changing…" : "Change password"}
          </Button>
        </TabsContent>

        <TabsContent value="payment" className="bento max-w-xl space-y-4 p-6">
          {savedPay && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <Icons.ShieldCheck size={18} className="text-emerald-600" />
              <div className="text-sm">
                <p className="font-bold text-emerald-800">Saved: {savedPay.method === "PAYPAL" ? "PayPal" : "Bank transfer"}</p>
                <p className="text-emerald-700">{savedPay.maskedAccount}</p>
              </div>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>Method</Label>
            <Select value={pay.method} onValueChange={v => setPay(p => ({ ...p, method: v }))}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank transfer (ACH/SEPA)</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pay.method === "BANK_TRANSFER" ? (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="p-name">Account holder name</Label>
                <Input id="p-name" value={pay.accountName} onChange={e => setPay(p => ({ ...p, accountName: e.target.value }))} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="p-bank">Bank name</Label>
                  <Input id="p-bank" value={pay.bank} onChange={e => setPay(p => ({ ...p, bank: e.target.value }))} className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-acc">Account number</Label>
                  <Input id="p-acc" value={pay.accountNumber} onChange={e => setPay(p => ({ ...p, accountNumber: e.target.value }))} className="h-11 rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="p-pp">PayPal email</Label>
              <Input id="p-pp" type="email" value={pay.paypalEmail} onChange={e => setPay(p => ({ ...p, paypalEmail: e.target.value }))} className="h-11 rounded-xl" />
            </div>
          )}
          <Button className="grad-btn rounded-full text-white" disabled={busy === "payment"} onClick={savePayment}>
            {busy === "payment" ? "Saving…" : "Save payment details"}
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Account numbers are validated then stored masked — full details are never displayed again and are excluded from all public APIs.
          </p>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="bento max-w-xl divide-y p-0">
            {[
              { icon: Icons.KeyRound, t: "Password hashing", d: "Your password is stored as a salted scrypt hash — never in plain text." },
              { icon:Icons.Cookie, t: "Session cookies", d: "HttpOnly, SameSite cookies with 14-day server-side expiry. Logging out revokes the session immediately." },
              { icon: Icons.Gauge, t: "Rate limiting", d: "Login, registration and API actions are rate-limited per IP and account to block brute force." },
              { icon: Icons.FileLock2, t: "Data minimization", d: "Payment details are masked at rest. View events use hashed viewer keys, not identities." },
            ].map(s => (
              <div key={s.t} className="flex items-start gap-4 p-5">
                <span className="rounded-xl bg-brand-blue-soft p-2.5"><s.icon size={18} className="text-brand-blue" /></span>
                <div>
                  <p className="text-sm font-bold">{s.t}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bento max-w-xl border-rose-200 bg-rose-50/50 p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-rose-700"><Icons.TriangleAlert size={16} /> Danger zone</p>
            <p className="mt-2 text-[13px] text-rose-600/80">
              Deleting your account removes your personal data and unpublished drafts. Published videos, earnings records and payout history are retained for accounting compliance (7 years) in anonymized form. Contact support to request deletion.
            </p>
            <Button variant="outline" className="mt-4 rounded-full border-rose-300 text-rose-600 hover:bg-rose-100"
              onClick={() => navigate("/contact")}>
              Request account deletion
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
