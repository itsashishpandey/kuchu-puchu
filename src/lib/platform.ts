import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/seo-pages";

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

// ── Notifications + email ──────────────────────────────────────────────────

/**
 * In-app notification, plus an email when `email` is given. The email repeats the notification's
 * `body` (the full message) with a button to `link`; `email.body` is an optional extra paragraph.
 * Mail goes out through sendMail (and lands in the admin Mail log); a mail failure never fails the
 * action that triggered it.
 */
export async function notify(opts: {
  userId: string; type: string; title: string; body: string; link?: string;
  email?: { to: string; subject: string; body?: string };
}) {
  await db.notification.create({
    data: { userId: opts.userId, type: opts.type, title: opts.title, body: opts.body, link: opts.link },
  });
  if (opts.email && !opts.email.to.endsWith(".invalid")) {
    try {
      const user = await db.user.findUnique({ where: { id: opts.userId }, select: { name: true } });
      await sendMail({ to: opts.email.to, subject: opts.email.subject, ...notificationEmail({ ...opts, name: user?.name ?? "" }) });
    } catch (e) {
      console.error("notify email failed:", (e as Error).message);
    }
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const BUTTON_LABEL: [RegExp, string][] = [
  [/^#\/dashboard\/upload/, "Upload a video"],
  [/^#\/dashboard\/videos/, "Open My Videos"],
  [/^#\/dashboard\/(withdraw|transactions)/, "Open Earnings"],
];

export function notificationEmail(o: { title: string; body: string; link?: string; email?: { body?: string }; name: string }) {
  const first = o.name.trim().split(/\s+/)[0] || "there";
  const url = o.link ? `${SITE_URL}/${o.link.replace(/^\/?/, "")}` : null;
  const label = (o.link && BUTTON_LABEL.find(([re]) => re.test(o.link!))?.[1]) || "Open your dashboard";
  const extra = o.email?.body?.trim();
  const footer = "You're getting this email because you have a creator account on Kuchu Puchu.";
  const text = [
    `Hi ${first},`, o.title, o.body, extra, url ? `${label}: ${url}` : null,
    `Questions? Reply to this email or write to support@mykuchupuchu.com.\n\n— Kuchu Puchu\n${footer}`,
  ].filter(Boolean).join("\n\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#151923;line-height:1.5">`
    + `<h2 style="margin:0 0 16px;color:#FF4E9B">Kuchu Puchu</h2>`
    + `<p>Hi ${esc(first)},</p>`
    + `<p style="font-size:18px;font-weight:bold;margin:16px 0 8px">${esc(o.title)}</p>`
    + `<p>${esc(o.body)}</p>`
    + (extra ? `<p>${esc(extra)}</p>` : "")
    + (url ? `<p style="margin:24px 0"><a href="${esc(url)}" style="background:#FF1744;color:#fff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;display:inline-block">${esc(label)}</a></p>` : "")
    + `<p>Questions? Reply to this email or write to <a href="mailto:support@mykuchupuchu.com" style="color:#1677FF">support@mykuchupuchu.com</a>.</p>`
    + `<p style="color:#888;font-size:12px;margin-top:24px">${esc(footer)}</p></div>`;
  return { text, html };
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
