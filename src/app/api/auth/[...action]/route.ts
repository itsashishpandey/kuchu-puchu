import { db } from "@/lib/db";
import {
  createSession, destroySession, getSessionUser, hashPassword, verifyPassword,
  SESSION_COOKIE, toSafeUser, jsonError,
} from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/platform";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ action: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  const [seg] = action;
  if (seg === "me") {
    const user = await getSessionUser();
    return Response.json({ user });
  }
  return jsonError("Not found", 404);
}

export async function POST(req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  const [seg] = action;
  const ip = clientIp(req);

  // ── LOGIN ─────────────────────────────────────────────────────────────
  if (seg === "login") {
    if (!rateLimit(`login:${ip}`, 12)) return jsonError("Too many attempts. Please wait a minute.", 429);
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return jsonError("Email and password are required");
    const user = await db.user.findUnique({
      where: { email }, include: { channel: true },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return jsonError("Invalid email or password", 401);
    }
    if (user.status === "SUSPENDED") {
      return jsonError(
        user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : "Account suspended. Contact support@kuchupuchu.com.",
        403
      );
    }
    const token = await createSession(user.id);
    const res = Response.json({ user: toSafeUser(user) });
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 86400}`
    );
    return res;
  }

  // ── REGISTER ──────────────────────────────────────────────────────────
  if (seg === "register") {
    if (!rateLimit(`register:${ip}`, 6)) return jsonError("Too many attempts. Please wait a minute.", 429);
    const form = await req.formData().catch(() => null);
    if (!form) return jsonError("Invalid form data");

    const get = (k: string) => String(form.get(k) || "").trim();
    const fullName = get("fullName");
    const email = get("email").toLowerCase();
    const mobile = get("mobile");
    const password = String(form.get("password") || "");
    const channelName = get("channelName");
    const username = get("username").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const description = get("description");
    const country = get("country");
    const category = get("category");

    if (!fullName || fullName.length < 2) return jsonError("Full name is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError("A valid email address is required");
    if (!/^\+?[\d\s-]{7,20}$/.test(mobile)) return jsonError("A valid mobile number is required");
    if (password.length < 8) return jsonError("Password must be at least 8 characters");
    if (!channelName || channelName.length < 3) return jsonError("Channel name must be at least 3 characters");
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return jsonError("Username must be 3–20 characters (a–z, 0–9, _)");
    if (!country) return jsonError("Country is required");
    if (!category) return jsonError("Content category is required");

    const [emailTaken, usernameTaken, nameTaken] = await Promise.all([
      db.user.findUnique({ where: { email } }),
      db.channel.findUnique({ where: { username } }),
      db.channel.findFirst({ where: { name: channelName } }),
    ]);
    if (emailTaken) return jsonError("An account with this email already exists");
    if (usernameTaken) return jsonError("This username is already taken");
    if (nameTaken) return jsonError("This channel name is already taken");

    // avatar upload
    let avatarUrl: string | null = null;
    const avatar = form.get("avatar");
    if (avatar && avatar instanceof File && avatar.size > 0) {
      if (avatar.size > 5 * 1024 * 1024) return jsonError("Profile photo must be under 5MB");
      if (!/^image\/(png|jpe?g|webp)$/.test(avatar.type)) return jsonError("Profile photo must be PNG, JPG or WebP");
      const ext = avatar.type.includes("png") ? "png" : avatar.type.includes("webp") ? "webp" : "jpg";
      const dir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(dir, { recursive: true });
      const fname = `${username}-${randomBytes(4).toString("hex")}.${ext}`;
      await writeFile(path.join(dir, fname), Buffer.from(await avatar.arrayBuffer()));
      avatarUrl = `/uploads/avatars/${fname}`;
    }

    const user = await db.user.create({
      data: {
        email, name: fullName, passwordHash: hashPassword(password), phone: mobile,
        role: "CREATOR", status: "PENDING", country, emailVerified: true,
        avatarUrl,
        channel: {
          create: {
            name: channelName, username, description, category, country, avatarUrl,
          },
        },
      },
      include: { channel: true },
    });

    await notify({
      userId: user.id, type: "APPLICATION_SUBMITTED",
      title: "Application received ✅",
      body: `Thanks for applying, ${fullName}! Your channel "${channelName}" is now pending review. We usually review applications within 2 business days.`,
      link: "#/dashboard",
      email: {
        to: email, subject: "We received your Kuchu Puchu application",
        body: `Hi ${fullName}, thanks for applying to Kuchu Puchu. We're reviewing "${channelName}" and will email you within 2 business days.`,
      },
    });

    const token = await createSession(user.id);
    const res = Response.json({ user: toSafeUser(user) }, { status: 201 });
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 86400}`
    );
    return res;
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────
  if (seg === "logout") {
    await destroySession();
    const res = Response.json({ ok: true });
    res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    return res;
  }

  // ── FORGOT PASSWORD (simulated email in demo) ─────────────────────────
  if (seg === "forgot-password") {
    if (!rateLimit(`forgot:${ip}`, 5)) return jsonError("Too many attempts. Please wait a minute.", 429);
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) return jsonError("Email is required");
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(24).toString("hex");
      await notify({
        userId: user.id, type: "ACCOUNT_STATUS",
        title: "Password reset requested",
        body: "We received a password reset request for your account. In this demo environment the reset link is recorded in the admin mail log instead of being emailed.",
        link: "#/login",
        email: {
          to: email, subject: "Reset your Kuchu Puchu password",
          body: `Reset your password with this link (demo): https://kuchupuchu.com/reset?token=${token}`,
        },
      });
    }
    return Response.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
  }

  return jsonError("Not found", 404);
}
