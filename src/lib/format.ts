// Shared formatting helpers

export function usd(n: number | null | undefined, decimals = 2): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

export function compact(n: number | null | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  if (v < 1000) return String(Math.round(v));
  return v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

export function full(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("en-US");
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDuration(seconds: number | null | undefined): string {
  const s = Math.max(0, Math.round(seconds ?? 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function daysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.ceil((d.getTime() - Date.now()) / 864e5);
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  FLAGGED_DUPLICATE: "Duplicate review",
  REMOVED: "Removed",
  REQUESTED: "Requested",
  UNDER_REVIEW: "Under review",
  PROCESSING: "Processing",
  PAID: "Paid",
};

export const WITHDRAWAL_FLOW = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID"];

export function categoryIcon(name?: string | null): string {
  const map: Record<string, string> = {
    Entertainment: "Film", Comedy: "Laugh", Lifestyle: "Coffee", Education: "GraduationCap",
    Food: "UtensilsCrossed", Travel: "Plane", Technology: "Cpu", Fitness: "Dumbbell",
    Beauty: "Flower2", Music: "Music", Pets: "PawPrint", Fashion: "Shirt",
    Gaming: "Gamepad2", Art: "Palette", Nature: "Mountain", Dance: "PartyPopper",
  };
  return map[name ?? ""] ?? "Film";
}
