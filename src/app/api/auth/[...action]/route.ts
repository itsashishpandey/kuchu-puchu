import { PARENT_CONFIRM_TEXT } from "@/lib/kids";
import { db } from "@/lib/db";
import { loadTaxonomy } from "@/lib/taxonomy";
import { resolveChannelCategories, resolveChannelLanguages, listParam, setChannelPreferences } from "@/lib/channel-prefs";
import {
  createSession, destroySession, getSessionUser, hashPassword, verifyPassword,
  SESSION_COOKIE, toSafeUser, jsonError,
} from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/platform";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "crypto";
import { sendMail, canSendMail } from "@/lib/mailer";
import { savePrivate, sniffDocument } from "@/lib/private-files";
import {
  USERNAME_RE, USERNAME_RULE, DOCUMENT_TYPES, DOCUMENT_MAX_MB, AGREEMENTS, AGREEMENTS_VERSION,
  postalCodeError, normalizePhone, socialUrl,
} from "@/lib/creator-application";

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;
const otpHash = (email: string, code: string) => createHash("sha256").update(`${email.toLowerCase()}|${code}|${process.env.OTP_PEPPER ?? "kp-otp"}`).digest("hex");
const bool = (v: FormDataEntryValue | null) => v === "true" || v === "1" || v === "on";

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

  // ── EMAIL OTP: send a 6-digit code (creator application) ──────────────
  // POST /api/auth/email-otp {email}  ·  POST /api/auth/email-otp/verify {email, code} → {emailToken}
  if (seg === "email-otp" && !action[1]) {
    if (!rateLimit(`otp:${ip}`, 10, 10 * 60_000)) return jsonError("Too many code requests. Please wait a few minutes.", 429);
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return jsonError("Enter a valid email address");
    if (await db.user.findUnique({ where: { email } })) return jsonError("An account with this email already exists — please log in instead.", 409);
    const last = await db.emailOtp.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });
    const wait = last ? 60 - Math.floor((Date.now() - last.createdAt.getTime()) / 1000) : 0;
    if (wait > 0) return Response.json({ error: `Please wait ${wait}s before asking for another code.`, resendIn: wait }, { status: 429 });
    const hourly = await db.emailOtp.count({ where: { email, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (hourly >= 5) return jsonError("Too many codes for this email. Please try again in an hour.", 429);
    const code = String(randomInt(100000, 1000000));
    await db.emailOtp.create({ data: { email, purpose: "CREATOR_SIGNUP", codeHash: otpHash(email, code), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) } });
    const sent = await sendMail({
      to: email,
      subject: `${code} is your Kuchu Puchu verification code`,
      text: `Your Kuchu Puchu verification code is ${code}.\n\nIt expires in ${OTP_TTL_MIN} minutes. Enter it on the creator application page to verify your email.\n\nIf you didn't ask for this code, you can ignore this email.\n\n— Kuchu Puchu · support@mykuchupuchu.com`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#151923"><h2 style="margin:0 0 8px;color:#FF4E9B">Kuchu Puchu</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:12px 0;color:#1677FF">${code}</p><p>It expires in ${OTP_TTL_MIN} minutes. Enter it on the creator application page to verify your email.</p><p style="color:#666;font-size:13px">If you didn't ask for this code, you can ignore this email.</p></div>`,
      logBody: `Verification code ••••••  (sent to ${email}; codes are never stored in the log)`,
    });
    if (!sent.sent && canSendMail()) return jsonError("We couldn't send the email right now. Please try again in a minute.", 502);
    return Response.json({
      ok: true, resendIn: 60, expiresInMinutes: OTP_TTL_MIN,
      message: `We sent a 6-digit code to ${email}. Check your inbox (and spam folder).`,
      ...(canSendMail() ? {} : { devNote: "Email sending isn't set up on this server — the code is in Admin → Mail log." }),
    });
  }

  if (seg === "email-otp" && action[1] === "verify") {
    if (!rateLimit(`otpv:${ip}`, 30, 10 * 60_000)) return jsonError("Too many attempts. Please wait a few minutes.", 429);
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").replace(/\D/g, "");
    if (code.length !== 6) return jsonError("Enter the 6-digit code from the email");
    const otp = await db.emailOtp.findFirst({ where: { email, verifiedAt: null }, orderBy: { createdAt: "desc" } });
    if (!otp || otp.expiresAt < new Date()) return jsonError("This code has expired. Please ask for a new one.", 410);
    if (otp.attempts >= OTP_MAX_ATTEMPTS) return jsonError("Too many wrong codes. Please ask for a new one.", 429);
    await db.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    const a = Buffer.from(otp.codeHash, "hex"), b = Buffer.from(otpHash(email, code), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
      return jsonError(left > 0 ? `That code isn't right — ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong codes. Please ask for a new one.", 400);
    }
    const token = randomBytes(24).toString("hex");
    await db.emailOtp.update({ where: { id: otp.id }, data: { verifiedAt: new Date(), token } });
    return Response.json({ ok: true, emailToken: token, message: "Email verified ✅" });
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────
  if (seg === "login") {
    if (!rateLimit(`login:${ip}`, 12)) return jsonError("Too many attempts. Please wait a minute.", 429);
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return jsonError("Email and password are required");
    const user = await db.user.findUnique({
      where: { email }, include: { channel: true, recoPrefs: true },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return jsonError("Invalid email or password", 401);
    }
    // The mobile app says which door it is using ("as"). The website doesn't
    // send it, so web logins behave exactly as before.
    const as = String(body?.as || "").toUpperCase();
    if (as) {
      if (user.role === "ADMIN") {
        return jsonError("Admin accounts can't sign in to the app. Please use the website.", 403);
      }
      if (as === "CREATOR" && user.role !== "CREATOR") {
        return jsonError("This is a User account. Switch to “User” to log in.", 403);
      }
      if (as === "VIEWER" && user.role !== "VIEWER") {
        return jsonError("This is a Creator account. Switch to “Creator” to log in.", 403);
      }
    }
    if (user.status === "SUSPENDED") {
      return jsonError(
        user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : "Account suspended. Contact support@mykuchupuchu.com.",
        403
      );
    }
    const token = await createSession(user.id);
    // token is for the mobile app (sent back as a Bearer header); the website uses the cookie
    const res = Response.json({ user: toSafeUser(user), token });
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

    // ── Parent (viewer) account: instant, no channel, no review. Kids watch without an account. ──
    if (get("accountType").toUpperCase() === "VIEWER") {
      if (get("parentConfirm") !== "true") {
        return jsonError(`Accounts are for parents and guardians only. Please confirm: "${PARENT_CONFIRM_TEXT}" If you're using the app, update it to the latest version.`);
      }
      if (!fullName || fullName.length < 2) return jsonError("Name is required");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError("A valid email address is required");
      if (password.length < 8) return jsonError("Password must be at least 8 characters");
      if (await db.user.findUnique({ where: { email } })) {
        return jsonError("An account with this email already exists");
      }
      const viewer = await db.user.create({
        data: {
          email, name: fullName, passwordHash: hashPassword(password),
          role: "VIEWER", status: "APPROVED", emailVerified: true,
          country: get("country") || null, monetizationEligible: false,
        },
        include: { channel: true },
      });
      const vtoken = await createSession(viewer.id);
      const vres = Response.json({ user: toSafeUser(viewer), token: vtoken }, { status: 201 });
      vres.headers.append(
        "Set-Cookie",
        `${SESSION_COOKIE}=${vtoken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 86400}`
      );
      return vres;
    }
    const channelName = get("channelName");
    const username = get("username").toLowerCase();
    const description = get("description");
    const country = get("country");
    const category = get("category");
    const legalName = (get("legalName") || fullName).replace(/\s+/g, " ").slice(0, 100);
    const city = get("city").slice(0, 80);
    const postalCode = get("postalCode").toUpperCase().slice(0, 12);
    const phone = normalizePhone(mobile);
    const documentType = get("documentType").toUpperCase();
    const documentLast4 = get("documentLast4").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const existingCreator = bool(form.get("existingCreator"));
    const instagram = socialUrl("instagram", get("instagramUrl"));
    const youtube = socialUrl("youtube", get("youtubeUrl"));

    // every check runs before anything is stored
    if (!get("emailToken")) return jsonError("Please verify your email with the 6-digit code first. Using the app? Update it to the latest version.");
    if (legalName.length < 3 || !/^[\p{L}][\p{L} .'-]+$/u.test(legalName)) return jsonError("Enter your legal name exactly as on your government ID");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError("A valid email address is required");
    if (!phone) return jsonError("Enter a valid phone number with country code, e.g. +91 98765 43210");
    if (password.length < 8) return jsonError("Password must be at least 8 characters");
    if (!country) return jsonError("Country is required");
    if (city.length < 2) return jsonError("City is required");
    const pcErr = postalCodeError(country, postalCode);
    if (pcErr) return jsonError(pcErr);
    if (!channelName || channelName.length < 3) return jsonError("Channel name must be at least 3 characters");
    if (!USERNAME_RE.test(username)) return jsonError(`Username: ${USERNAME_RULE}`);
    if (!category) return jsonError("Content category is required");
    if (existingCreator && !instagram && !youtube) return jsonError("Add your Instagram or YouTube link (or choose “No”)");
    if (get("instagramUrl") && !instagram) return jsonError("That doesn't look like an Instagram profile link");
    if (get("youtubeUrl") && !youtube) return jsonError("That doesn't look like a YouTube channel link");
    if (!DOCUMENT_TYPES.some(d => d.id === documentType)) return jsonError("Choose the type of government ID");
    if (!/^[A-Z0-9]{4}$/.test(documentLast4)) return jsonError("Enter the last 4 characters of your ID number");
    const missing = AGREEMENTS.filter(a => !bool(form.get(`agree_${a.id}`)));
    if (missing.length) return jsonError(`Please accept: “${missing[0].text}”`);
    const avatarFile = form.get("avatar");
    if (!avatarFile || !(avatarFile instanceof File) || avatarFile.size === 0) return jsonError("Add a profile picture");
    const doc = form.get("document");
    if (!doc || !(doc instanceof File) || doc.size === 0) return jsonError("Upload one government ID document");
    if (doc.size > DOCUMENT_MAX_MB * 1024 * 1024) return jsonError(`The ID document must be under ${DOCUMENT_MAX_MB}MB`);
    const docBuf = Buffer.from(await doc.arrayBuffer());
    const docType = sniffDocument(docBuf);
    if (!docType) return jsonError("The ID document must be a photo (JPG, PNG, WebP) or a PDF");

    // the email must have been verified with a code in the last 30 minutes, and each code works once
    const otp = await db.emailOtp.findUnique({ where: { token: get("emailToken") } });
    if (!otp || otp.email !== email || !otp.verifiedAt || otp.consumedAt || otp.verifiedAt < new Date(Date.now() - 30 * 60_000)) {
      return jsonError("Your email verification has expired. Please verify your email again.", 401);
    }

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
    const avatar = avatarFile;
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

    const docPath = await savePrivate("kyc", docBuf, docType.ext);
    const user = await db.user.create({
      data: {
        email, name: legalName, legalName, passwordHash: hashPassword(password), phone,
        role: "CREATOR", status: "PENDING", country, city, postalCode,
        emailVerified: true, emailVerifiedAt: otp.verifiedAt, avatarUrl,
        agreements: JSON.stringify({ version: AGREEMENTS_VERSION, accepted: AGREEMENTS.map(a => a.id), at: new Date().toISOString() }),
        channel: {
          create: {
            name: channelName, username, description, category, country, avatarUrl,
            socialLinks: JSON.stringify({ instagram: instagram ?? null, youtube: youtube ?? null, x: null, website: null }),
          },
        },
        verification: { create: { documentType, documentLast4, fileName: docPath, mimeType: docType.mime } },
      },
      include: { channel: true },
    });
    await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

    // channel's preferred categories + publishing languages (the old form sends one category name)
    if (user.channel) {
      const t = await loadTaxonomy("en");
      const cats = resolveChannelCategories(t, [category, ...listParam(form.get("preferredCategories"))]);
      const langs = resolveChannelLanguages(t, listParam(form.get("languages")));
      if (cats.length || langs.length) await setChannelPreferences(user.channel.id, cats, langs).catch(() => {});
    }

    await notify({
      userId: user.id, type: "APPLICATION_SUBMITTED",
      title: "Application received ✅",
      body: `Thanks for applying, ${legalName}! Your channel "${channelName}" and your ID are now pending review. We usually review applications within 2 business days.`,
      link: "#/dashboard",
      email: {
        to: email, subject: "We received your Kuchu Puchu application",
        body: `Hi ${legalName}, thanks for applying to Kuchu Puchu. We're reviewing "${channelName}" and will email you within 2 business days.`,
      },
    });

    const token = await createSession(user.id);
    const res = Response.json({ user: toSafeUser(user), token }, { status: 201 });
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
          body: `Reset your password with this link (demo): https://mykuchupuchu.com/reset?token=${token}`,
        },
      });
    }
    return Response.json({ ok: true, message: "If an account exists for that email, a reset link has been sent." });
  }

  return jsonError("Not found", 404);
}
