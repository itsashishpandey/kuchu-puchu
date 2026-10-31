"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, StatusBadge, EmptyState } from "@/components/shared/ui-bits";
import { AdminPageHeader } from "./shell";
import { get } from "@/lib/client";
import { usd, compact, timeAgo, fmtDate, WITHDRAWAL_FLOW, STATUS_LABELS } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

async function action(path: string, body: unknown): Promise<{ message?: string }> {
  const res = await fetch(`/api${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Action failed");
  return data;
}

// ── Withdrawal Requests ────────────────────────────────────────────────────

type AdminWithdrawal = {
  id: string; amount: number; method: string; status: string;
  details: { maskedAccount: string; accountName?: string; bank?: string };
  adminNote: string | null; paymentRef: string | null;
  createdAt: string; updatedAt: string;
  creator: { id: string; name: string; email: string; username: string; avatarUrl: string | null };
};

export function AdminWithdrawalsPage() {
  const [data, setData] = useState<{ withdrawals: AdminWithdrawal[]; totals: Record<string, number> } | null>(null);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = () => {
    const params = status ? `?status=${status}` : "";
    get<{ withdrawals: AdminWithdrawal[]; totals: Record<string, number> }>(`/admin/withdrawals${params}`)
      .then(setData).catch(() => {});
  };
  useEffect(() => { load(); }, [status]);  

  const act = async (w: AdminWithdrawal, a: string, extra?: Record<string, unknown>) => {
    setBusyId(w.id);
    try {
      const res = await action(`/admin/withdrawals/${w.id}/action`, { action: a, ...extra });
      toast({ title: res.message ?? "Done" });
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally { setBusyId(""); }
  };

  const tabs = ["", "REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID", "REJECTED"];

  return (
    <div>
      <AdminPageHeader
        title="Withdrawal Requests"
        description="Review, approve, process and pay creator payouts. Duplicate payouts are impossible — one payment per withdrawal."
      />

      {/* totals */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID", "REJECTED"].map(s => (
          <div key={s} className="bento p-4">
            <p className="font-display text-lg font-bold">{usd(data?.totals?.[s] ?? 0, 0)}</p>
            <p className="text-[11px] text-muted-foreground">{STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map(t => (
          <button key={t || "all"} onClick={() => setStatus(t)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${status === t ? "bg-ink text-white" : "bg-white ring-1 ring-black/5 hover:bg-secondary"}`}>
            {t ? STATUS_LABELS[t] : "All"}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}</div>
      ) : data.withdrawals.length === 0 ? (
        <EmptyState icon="Banknote" title="No withdrawal requests" description="Creator payout requests will appear here." />
      ) : (
        <div className="space-y-3">
          {data.withdrawals.map(w => {
            const stageIdx = WITHDRAWAL_FLOW.indexOf(w.status);
            return (
              <div key={w.id} className="bento p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar src={w.creator.avatarUrl} name={w.creator.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-bold">{usd(w.amount)}</p>
                      <StatusBadge status={w.status} />
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {w.method === "PAYPAL" ? "PayPal" : "Bank transfer"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {w.creator.name} (@{w.creator.username}) · {w.details.maskedAccount}{w.details.bank ? ` · ${w.details.bank}` : ""}
                      {w.details.accountName ? ` · ${w.details.accountName}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Requested {timeAgo(w.createdAt)}</p>
                    {w.paymentRef && (
                      <p className="mt-1 inline-block rounded bg-secondary px-2 py-0.5 font-mono text-[11px]">{w.paymentRef}</p>
                    )}
                    {w.adminNote && <p className="mt-2 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">Note: {w.adminNote}</p>}
                    {stageIdx >= 0 && w.status !== "REJECTED" && (
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
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {w.status === "REQUESTED" && (
                      <Button size="sm" variant="outline" className="rounded-full" disabled={busyId === w.id} onClick={() => act(w, "review")}>
                        Start review
                      </Button>
                    )}
                    {(w.status === "REQUESTED" || w.status === "UNDER_REVIEW") && (
                      <>
                        <Button size="sm" className="grad-btn rounded-full text-white" disabled={busyId === w.id} onClick={() => act(w, "approve")}>
                          <Icons.Check size={13} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full border-rose-200 text-rose-600" disabled={busyId === w.id}
                          onClick={() => {
                            const note = window.prompt("Rejection reason (required — funds return to the creator's available balance):");
                            if (note && note.trim().length >= 5) act(w, "reject", { note: note.trim() });
                            else if (note !== null) toast({ title: "Reason of 5+ characters required", variant: "destructive" });
                          }}>
                          Reject
                        </Button>
                      </>
                    )}
                    {w.status === "APPROVED" && (
                      <Button size="sm" className="rounded-full bg-blue-600 text-white hover:bg-blue-700" disabled={busyId === w.id} onClick={() => act(w, "processing")}>
                        Mark processing
                      </Button>
                    )}
                    {(w.status === "APPROVED" || w.status === "PROCESSING") && (
                      <Button size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={busyId === w.id}
                        onClick={() => {
                          const ref = window.prompt("Payment reference (leave blank to auto-generate):") ?? "";
                          act(w, "paid", ref.trim() ? { paymentRef: ref.trim() } : {});
                        }}>
                        <Icons.Banknote size={13} className="mr-1" /> Mark paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Earnings Management ────────────────────────────────────────────────────

type EarningsCreator = {
  id: string; name: string; email: string; username: string; avatarUrl: string | null;
  lifetimeEarnings: number; pendingBalance: number; availableBalance: number; totalWithdrawn: number;
};

type LedgerRow = {
  id: string; type: string; amount: number; status: string; description: string;
  reference: string | null; createdAt: string; availableAt: string | null;
};

export function AdminEarningsPage() {
  const [creators, setCreators] = useState<EarningsCreator[] | null>(null);
  const [selected, setSelected] = useState<EarningsCreator | null>(null);
  const [detail, setDetail] = useState<{ entries: LedgerRow[]; wallet: EarningsCreator["availableBalance"] extends never ? never : Record<string, number> } | null>(null);
  const [adjust, setAdjust] = useState({ amount: "", reason: "" });
  const [busy, setBusy] = useState(false);

  const load = () => get<{ creators: EarningsCreator[] }>("/admin/earnings").then(d => setCreators(d.creators)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openDetail = async (c: EarningsCreator) => {
    setSelected(c);
    setDetail(null);
    get<{ entries: LedgerRow[]; wallet: { lifetimeEarnings: number; pendingBalance: number; availableBalance: number; totalWithdrawn: number } }>(`/admin/earnings?userId=${c.id}`)
      .then(setDetail).catch(() => {});
  };

  const submitAdjust = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await action("/admin/adjust", {
        userId: selected.id, amount: parseFloat(adjust.amount), reason: adjust.reason.trim(),
      });
      toast({ title: res.message ?? "Adjustment recorded" });
      setAdjust({ amount: "", reason: "" });
      openDetail(selected);
      load();
    } catch (e) {
      toast({ title: "Adjustment failed", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const typeLabel: Record<string, string> = {
    VIEW_EARNING: "View earnings", UPLOAD_REWARD: "Upload reward",
    ADJUSTMENT: "Adjustment", WITHDRAWAL_PAID: "Payout",
    WITHDRAWAL_HOLD: "Lock", WITHDRAWAL_REJECTED: "Return",
  };

  return (
    <div>
      <AdminPageHeader
        title="Earnings Management"
        description="Inspect creator ledgers and perform audited adjustments. Every adjustment is logged and notified."
      />

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        {/* creator list */}
        <div className="bento p-4">
          <h2 className="mb-3 px-1 font-display text-sm font-bold">Creators by lifetime earnings</h2>
          <div className="scroll-slim max-h-[600px] space-y-1.5 overflow-y-auto pr-1">
            {(creators ?? []).map(c => (
              <button key={c.id} onClick={() => openDetail(c)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-secondary ${selected?.id === c.id ? "bg-secondary ring-1 ring-brand-red/30" : ""}`}>
                <Avatar src={c.avatarUrl} name={c.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">@{c.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-brand-red">{usd(c.lifetimeEarnings)}</p>
                  <p className="text-[10px] text-muted-foreground">lifetime</p>
                </div>
              </button>
            ))}
            {creators && creators.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No approved creators yet.</p>}
          </div>
        </div>

        {/* detail */}
        {!selected ? (
          <div className="bento flex items-center justify-center p-10">
            <div className="text-center text-muted-foreground">
              <Icons.Landmark size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a creator to inspect their ledger</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bento p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={selected.avatarUrl} name={selected.name} size={44} />
                  <div>
                    <p className="font-display text-base font-bold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {detail ? [
                    { l: "Lifetime", v: usd((detail.wallet as Record<string, number>).lifetimeEarnings) },
                    { l: "Pending", v: usd((detail.wallet as Record<string, number>).pendingBalance) },
                    { l: "Available", v: usd((detail.wallet as Record<string, number>).availableBalance) },
                    { l: "Withdrawn", v: usd((detail.wallet as Record<string, number>).totalWithdrawn) },
                  ].map(c => (
                    <div key={c.l} className="rounded-xl bg-secondary/70 px-3 py-2">
                      <p className="font-display text-sm font-bold">{c.v}</p>
                      <p className="text-[10px] text-muted-foreground">{c.l}</p>
                    </div>
                  )) : <Icons.Loader2 size={20} className="animate-spin" />}
                </div>
              </div>
            </div>

            {/* adjustment */}
            <div className="bento p-5">
              <h3 className="font-display text-sm font-bold">Audited adjustment</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Credits or debits the creator's balance. Use negatives to reverse erroneous credits. Both the creator and the audit log are notified.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                  <Input value={adjust.amount} onChange={e => setAdjust(a => ({ ...a, amount: e.target.value }))}
                    type="number" step="0.01" placeholder="10.00 or -5.00" className="h-11 rounded-xl pl-6" aria-label="Adjustment amount" />
                </div>
                <Input value={adjust.reason} onChange={e => setAdjust(a => ({ ...a, reason: e.target.value }))}
                  placeholder="Reason (required, e.g. Goodwill credit for false-positive review delay)" className="h-11 rounded-xl" aria-label="Adjustment reason" />
                <Button className="grad-btn h-11 rounded-xl text-white" disabled={busy || !adjust.amount || adjust.reason.trim().length < 5} onClick={submitAdjust}>
                  {busy ? "Recording…" : "Record adjustment"}
                </Button>
              </div>
            </div>

            {/* ledger */}
            <div className="bento overflow-hidden">
              <div className="border-b bg-secondary/50 px-5 py-3">
                <h3 className="font-display text-sm font-bold">Ledger — latest 100 entries</h3>
              </div>
              <div className="scroll-slim max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 font-semibold">Type</th>
                      <th className="px-5 py-2.5 font-semibold">Description</th>
                      <th className="px-5 py-2.5 font-semibold">Date</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail?.entries ?? []).map(e => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-secondary/30">
                        <td className="whitespace-nowrap px-5 py-2.5 text-xs font-semibold">{typeLabel[e.type] ?? e.type}</td>
                        <td className="max-w-80 truncate px-5 py-2.5 text-xs text-muted-foreground">{e.description}</td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-xs text-muted-foreground">{fmtDate(e.createdAt)}</td>
                        <td className={`whitespace-nowrap px-5 py-2.5 text-right text-xs font-bold ${e.amount >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {e.amount >= 0 ? "+" : ""}{usd(e.amount)}
                        </td>
                      </tr>
                    ))}
                    {detail && detail.entries.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">No entries.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fraud Monitoring ───────────────────────────────────────────────────────

type FraudFlag = {
  id: string; userId: string | null; videoId: string | null; type: string;
  severity: string; details: string; status: string; createdAt: string;
};

export function AdminFraudPage() {
  const [data, setData] = useState<{
    flags: FraudFlag[];
    stats: { totalExcludedViews: number };
    recentEvents: { id: string; qualified: boolean; reason: string | null; watchSeconds: number; createdAt: string; contentId: string }[];
  } | null>(null);

  const load = () => get<typeof data>("/admin/fraud").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (id: string, a: "dismiss" | "confirm") => {
    try {
      const res = await action(`/admin/fraud/${id}/action`, { action: a });
      toast({ title: res.message ?? "Done" });
      load();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const FRAUD_LABEL: Record<string, string> = {
    VIEW_BOT: "Bot traffic", SELF_VIEW: "Self-view burst", RAPID_REFRESH: "Rapid refresh",
    DUPLICATE_CONTENT: "Duplicate content", UNUSUAL_PATTERN: "Unusual pattern", FAKE_ENGAGEMENT: "Fake engagement",
  };
  const REASON_LABEL: Record<string, string> = {
    CREATOR_SELF_VIEW: "Creator self-view", BOT_USER_AGENT: "Bot user-agent",
    INSUFFICIENT_WATCH_TIME: "Watch time under 2s", DUPLICATE_VIEWER_DAILY_CAP: "Daily cap exceeded",
    VIDEO_NOT_APPROVED: "Video not approved", MONETIZATION_WINDOW_EXPIRED: "Earning window expired",
  };

  return (
    <div>
      <AdminPageHeader
        title="Fraud Monitoring"
        description="Suspicious view patterns, duplicate content attempts and earning manipulation — resolved views never pay."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { l: "Excluded views (all time)", v: compact(data?.stats.totalExcludedViews ?? 0), i: Icons.EyeOff, c: "text-rose-500 bg-rose-50" },
          { l: "Open flags", v: String(data?.flags.filter(f => f.status === "OPEN").length ?? 0), i: Icons.Flag, c: "text-amber-600 bg-amber-50" },
          { l: "Confirmed fraud", v: String(data?.flags.filter(f => f.status === "CONFIRMED").length ?? 0), i: Icons.ShieldAlert, c: "text-rose-500 bg-rose-50" },
          { l: "Monitoring", v: "Active", i: Icons.Radar, c: "text-emerald-600 bg-emerald-50" },
        ].map(s => (
          <div key={s.l} className="bento p-4">
            <span className={`rounded-xl ${s.c} inline-flex p-2`}><s.i size={17} /></span>
            <p className="mt-2.5 font-display text-xl font-bold">{s.v}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-base font-bold">Fraud flags</h2>
          {!data ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
          ) : data.flags.length === 0 ? (
            <EmptyState icon="ShieldCheck" title="No fraud flags" description="The platform looks clean." />
          ) : (
            <div className="scroll-slim max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {data.flags.map(f => (
                <div key={f.id} className="bento p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">{FRAUD_LABEL[f.type] ?? f.type}</p>
                        <StatusBadge status={f.severity} />
                        <StatusBadge status={f.status} />
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.details}</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                        {f.videoId ? `Video ${f.videoId} · ` : ""}{timeAgo(f.createdAt)}
                      </p>
                    </div>
                    {f.status === "OPEN" && (
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => act(f.id, "dismiss")}>Dismiss</Button>
                        <Button size="sm" className="rounded-full bg-rose-500 text-white hover:bg-rose-600" onClick={() => act(f.id, "confirm")}>Confirm</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-base font-bold">Live view-event stream</h2>
          <div className="bento overflow-hidden">
            <div className="scroll-slim max-h-[640px] overflow-y-auto">
              {data?.recentEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
                  <span className={`rounded-lg p-1.5 ${e.qualified ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                    {e.qualified ? <Icons.Check size={13} /> : <Icons.X size={13} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">
                      {e.qualified ? "Qualified" : `Excluded — ${REASON_LABEL[e.reason ?? ""] ?? e.reason}`} · {e.contentId}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{Math.round(e.watchSeconds)}s watched · {timeAgo(e.createdAt)}</p>
                  </div>
                </div>
              ))}
              {data && data.recentEvents.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">No recent view events.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
