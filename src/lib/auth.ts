import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "kuchupuchu_session";
const SESSION_DAYS = 14;

// ── Passwords ──────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ── Anonymous viewer key (device fingerprint surrogate) ────────────────────

export function viewerKeyFromRequest(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ua = req.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { token, userId, expiresAt } });
  return token;
}

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  adminRole: string | null;
  status: string;
  avatarUrl: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  monetizationEligible: boolean;
  channel: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    verified: boolean;
    followerCount: number;
    category: string | null;
    showEarnings: boolean;
  } | null;
  /** Language & interest onboarding (viewers and creators). Clients show it until completed. */
  onboarding: { completed: boolean; step: number };
  interfaceLocale: string;
};

export function toSafeUser(user: {
  id: string; email: string; name: string; role: string; adminRole: string | null;
  status: string; avatarUrl: string | null; rejectionReason: string | null;
  suspensionReason: string | null; monetizationEligible: boolean;
  channel?: SafeUser["channel"] | null;
  recoPrefs?: { onboardingCompletedAt: Date | null; onboardingStep: number; interfaceLocale: string } | null;
}): SafeUser {
  return {
    id: user.id, email: user.email, name: user.name, role: user.role,
    adminRole: user.adminRole, status: user.status, avatarUrl: user.avatarUrl,
    rejectionReason: user.rejectionReason, suspensionReason: user.suspensionReason,
    monetizationEligible: user.monetizationEligible,
    channel: user.channel
      ? {
          id: user.channel.id, name: user.channel.name, username: user.channel.username,
          avatarUrl: user.channel.avatarUrl, verified: user.channel.verified,
          followerCount: user.channel.followerCount, category: user.channel.category,
          showEarnings: user.channel.showEarnings,
        }
      : null,
    onboarding: { completed: !!user.recoPrefs?.onboardingCompletedAt, step: user.recoPrefs?.onboardingStep ?? 0 },
    interfaceLocale: user.recoPrefs?.interfaceLocale ?? "en",
  };
}

/**
 * The session token for this request: the website sends it as a cookie, the
 * mobile app as `Authorization: Bearer <token>`. Both resolve to the same
 * Session row.
 */
async function sessionToken(): Promise<string | null> {
  const auth = (await headers()).get("authorization") || "";
  const bearer = auth.match(/^Bearer\s+([a-f0-9]{64})$/i)?.[1];
  if (bearer) return bearer;
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SafeUser | null> {
  const token = await sessionToken();
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { channel: true, recoPrefs: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  // a suspension takes effect immediately on every device (app tokens last 14 days)
  if (session.user.status === "SUSPENDED") return null;
  return toSafeUser(session.user);
}

export async function destroySession(): Promise<void> {
  const token = await sessionToken();
  if (token) await db.session.deleteMany({ where: { token } });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
