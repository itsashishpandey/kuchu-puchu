// Private uploads (government ID documents). Never under public/ and never web-served: the live
// server keeps them next to the data folder (~/mykuchupuchu-data/private), local dev in
// ./private-uploads. Admins read them only through an authenticated, audit-logged API route.
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { realpathSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

export function privateDir(): string {
  if (process.env.PRIVATE_UPLOAD_DIR) return process.env.PRIVATE_UPLOAD_DIR;
  const pub = path.join(process.cwd(), "public", "uploads");
  try {
    // live: public/uploads is a symlink into ~/mykuchupuchu-data → keep private files beside it
    const real = realpathSync(pub);
    if (path.resolve(real) !== path.resolve(pub)) return path.join(path.dirname(real), "private");
  } catch { /* no uploads folder yet */ }
  return path.join(process.cwd(), "private-uploads");
}

/** Detects the real file type from its first bytes (the browser-supplied MIME type is not trusted). */
export function sniffDocument(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 4).toString("latin1") === "%PDF") return { mime: "application/pdf", ext: "pdf" };
  if (buf[0] === 0x89 && buf.subarray(1, 4).toString("latin1") === "PNG") return { mime: "image/png", ext: "png" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

export async function savePrivate(folder: string, buf: Buffer, ext: string): Promise<string> {
  const dir = path.join(privateDir(), folder);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(12).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), buf, { mode: 0o600 });
  return `${folder}/${name}`;
}

export async function readPrivate(relative: string): Promise<Buffer> {
  const base = path.resolve(privateDir());
  const full = path.resolve(base, relative);
  if (!full.startsWith(base + path.sep)) throw new Error("Invalid path");
  return readFile(full);
}

export async function deletePrivate(relative: string): Promise<void> {
  const base = path.resolve(privateDir());
  const full = path.resolve(base, relative);
  if (!full.startsWith(base + path.sep)) throw new Error("Invalid path");
  await unlink(full).catch(() => {});
}
