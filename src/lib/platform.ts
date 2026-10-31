import { db } from "@/lib/db";

// ── Content IDs ────────────────────────────────────────────────────────────

/** Sequential permanent content ID: VID-2026-000001 */
export async function nextContentId(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await db.video.findFirst({
    orderBy: { contentId: "desc" },
    where: { contentId: { startsWith: `VID-${year}-` } },
  });
  let n = 1;
  if (last) {
    const parts = last.contentId.split("-");
    n = parseInt(parts[2] || "0", 10) + 1;
  }
  return `VID-${year}-${String(n).padStart(6, "0")}`;
}

export function txnRef(): string {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function payoutRef(): string {
  return `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── Notifications + simulated email ────────────────────────────────────────

export async function notify(opts: {
  userId: string; type: string; title: string; body: string; link?: string;
  email?: { to: string; subject: string; body: string };
}) {
  await db.notification.create({
    data: { userId: opts.userId, type: opts.type, title: opts.title, body: opts.body, link: opts.link },
  });
  // Demo environment: SMTP is not available — outbound emails are recorded in a
  // mail log (visible in admin) instead of being sent.
  if (opts.email) {
    await db.mailLog.create({
      data: { toEmail: opts.email.to, subject: opts.email.subject, body: opts.email.body },
    });
  }
}

// ── Audit log ──────────────────────────────────────────────────────────────

export async function audit(opts: {
  actorId: string; actorEmail: string; action: string;
  targetType: string; targetId?: string; details?: string;
}) {
  await db.auditLog.create({
    data: {
      actorId: opts.actorId, actorEmail: opts.actorEmail, action: opts.action,
      targetType: opts.targetType, targetId: opts.targetId, details: opts.details,
    },
  });
}

// ── Platform settings (key/value JSON) ─────────────────────────────────────

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.platformSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}

export async function setSetting(key: string, value: unknown) {
  const str = JSON.stringify(value);
  await db.platformSetting.upsert({
    where: { key }, update: { value: str }, create: { key, value: str },
  });
}
