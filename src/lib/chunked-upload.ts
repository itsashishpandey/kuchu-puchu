// Videos are sent in small pieces. One long upload request is cut off by Cloudflare after about
// 100 seconds (HTTP 524), which slow home connections hit with bigger phone videos. Each piece is
// written into a private part file (never web-served); the final /api/creator/upload request names
// the finished upload by its id, and the file is moved into place from there.
import { open, stat, mkdir, readdir, unlink, rename, copyFile, chmod } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { privateDir } from "@/lib/private-files";

/** Piece size. 2 MB finishes in under a minute even at ~40 KB/s. The browser uses the same value. */
export const CHUNK_BYTES = 2 * 1024 * 1024;
const ID_RE = /^[a-f0-9]{32}$/;
const STALE_MS = 24 * 3600 * 1000;

const partsDir = () => path.join(privateDir(), "upload-parts");

function partPath(userId: string, uploadId: string): string | null {
  if (!ID_RE.test(uploadId) || !/^[A-Za-z0-9_-]+$/.test(userId)) return null;
  return path.join(partsDir(), `${userId}-${uploadId}.part`);
}

export const pieceCount = (totalBytes: number) => Math.max(1, Math.ceil(totalBytes / CHUNK_BYTES));

/** Removes part files nobody finished within a day. */
async function dropStaleParts() {
  const dir = partsDir();
  const names = await readdir(dir).catch(() => [] as string[]);
  const now = Date.now();
  await Promise.all(names.filter(n => n.endsWith(".part")).map(async n => {
    const f = path.join(dir, n);
    const s = await stat(f).catch(() => null);
    if (s && now - s.mtimeMs > STALE_MS) await unlink(f).catch(() => {});
  }));
}

type ChunkResult = { ok: true; received: number; bytes: number } | { ok: false; status: number; error: string };

/**
 * Writes piece `index` (0-based) of an upload of `totalBytes`. Pieces arrive in order; sending the
 * same piece again (a retry after a lost reply) simply rewrites the same bytes.
 */
export async function writeChunk(userId: string, uploadId: string, index: number, totalBytes: number, data: Buffer): Promise<ChunkResult> {
  const file = partPath(userId, uploadId);
  if (!file) return { ok: false, status: 400, error: "Invalid upload id" };
  const total = pieceCount(totalBytes);
  if (!Number.isInteger(index) || index < 0 || index >= total) return { ok: false, status: 400, error: "Invalid piece number" };
  const expected = index < total - 1 ? CHUNK_BYTES : totalBytes - CHUNK_BYTES * (total - 1);
  if (data.length !== expected) return { ok: false, status: 400, error: `Piece ${index + 1} has the wrong size` };

  await mkdir(partsDir(), { recursive: true });
  const offset = index * CHUNK_BYTES;
  if (index === 0) {
    await dropStaleParts();
  } else {
    const have = (await stat(file).catch(() => null))?.size ?? -1;
    if (have < 0) return { ok: false, status: 409, error: "This upload has expired. Please start it again." };
    if (have < offset) return { ok: false, status: 409, error: `Piece ${index} is missing. Please start the upload again.` };
  }
  // positional write without truncating: a late duplicate of an earlier piece can't erase later ones
  const fh = await open(file, constants.O_RDWR | constants.O_CREAT, 0o600);
  try {
    const { bytesWritten } = await fh.write(data, 0, data.length, offset);
    if (bytesWritten !== data.length) return { ok: false, status: 500, error: "Could not save this piece. Please retry." };
  } finally {
    await fh.close();
  }
  return { ok: true, received: index + 1, bytes: offset + data.length };
}

/** The finished part file, if every byte arrived. */
export async function finishedUpload(userId: string, uploadId: string, totalBytes: number): Promise<{ path: string; size: number } | null> {
  const file = partPath(userId, uploadId);
  if (!file || !(totalBytes > 0)) return null;
  const s = await stat(file).catch(() => null);
  if (!s || s.size !== totalBytes) return null;
  return { path: file, size: s.size };
}

/** Moves a finished upload to its final place. */
export async function moveUpload(from: string, to: string) {
  try {
    await rename(from, to);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EXDEV") throw e;
    await copyFile(from, to); // different disk: copy, then remove the part
    await unlink(from).catch(() => {});
  }
  // The part file is private (0600) and a rename keeps that, but the web server reads the
  // videos folder as another user: without this, every pieced upload played as a 404.
  await chmod(to, 0o644);
}

export async function dropUpload(userId: string, uploadId: string) {
  const file = partPath(userId, uploadId);
  if (file) await unlink(file).catch(() => {});
}
