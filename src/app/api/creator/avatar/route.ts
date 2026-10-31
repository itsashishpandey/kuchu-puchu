import { db } from "@/lib/db";
import { getSessionUser, jsonError } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me || me.role !== "CREATOR") return jsonError("Creator login required", 401);

  const form = await req.formData().catch(() => null);
  const avatar = form?.get("avatar");
  if (!avatar || !(avatar instanceof File) || avatar.size === 0) return jsonError("Avatar file required");
  if (avatar.size > 5 * 1024 * 1024) return jsonError("Avatar must be under 5MB");
  if (!/^image\/(png|jpe?g|webp)$/.test(avatar.type)) return jsonError("Avatar must be PNG, JPG or WebP");

  const ext = avatar.type.includes("png") ? "png" : avatar.type.includes("webp") ? "webp" : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const fname = `${me.channel?.username ?? "creator"}-${randomBytes(4).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, fname), Buffer.from(await avatar.arrayBuffer()));
  const avatarUrl = `/uploads/avatars/${fname}`;

  await db.user.update({ where: { id: me.id }, data: { avatarUrl } });
  if (me.channel) {
    await db.channel.update({ where: { userId: me.id }, data: { avatarUrl } });
  }

  return Response.json({ ok: true, avatarUrl });
}
