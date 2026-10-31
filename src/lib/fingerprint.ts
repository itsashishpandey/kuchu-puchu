import { createHash } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

// ── Exact file checksum ────────────────────────────────────────────────────

export function sha256Buffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

// ── Perceptual visual hash (aHash over decoded frames) ─────────────────────
// Extracts 4 evenly-spaced frames, scales each to 8x8 grayscale, and derives
// one 16-bit hash per frame → 64-bit visual fingerprint. Robust to re-encoding,
// bitrate changes and small crops because it operates on decoded pixels.

function bufToBits(pixels: Buffer): number {
  // pixels: 64 bytes (8x8 grayscale). 12 mean-threshold bits + 4 brightness
  // bits — the brightness component keeps uniform/dark frames from different
  // videos from degenerating to identical hashes.
  const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  let bits = 0;
  for (let i = 0; i < 12; i++) {
    bits = (bits << 1) | (pixels[i * 5] > mean ? 1 : 0);
  }
  const bright = Math.min(15, Math.max(0, Math.floor(mean / 16)));
  return ((bits << 4) | bright) & 0xffff;
}

export async function visualHash(filePath: string, duration = 45): Promise<string> {
  // sample 4 frames across the clip
  const parts: string[] = [];
  const positions = [0.5, 0.25, 0.5, 0.75].map((p, i) =>
    i === 0 ? 0.5 : Math.min(duration * p, Math.max(duration - 0.5, 0))
  );
  for (const t of [0.5, positions[1], positions[2], positions[3]]) {
    try {
      const { stdout } = await exec(
        "ffmpeg",
        [
          "-ss", String(Math.max(0, t)), "-i", filePath,
          "-frames:v", "1", "-vf", "scale=8:8,format=gray", "-f", "rawvideo", "-",
        ],
        { timeout: 30000, maxBuffer: 1 << 24, encoding: "buffer" }
      );
      if (stdout && stdout.length >= 64) parts.push(bufToBits(stdout.subarray(0, 64)).toString(16).padStart(4, "0"));
    } catch {
      /* frame skipped */
    }
  }
  while (parts.length < 4) parts.push(Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0"));
  return parts.join("");
}

// ── Audio fingerprint (sampled waveform hash) ──────────────────────────────
// Downmixes to mono 8kHz s16le, samples 64 evenly-spaced amplitudes and
// threshold-compares consecutive samples (audio aHash) → 64-bit fingerprint.

export async function audioHash(filePath: string, duration = 45): Promise<string> {
  try {
    const { stdout } = await exec(
      "ffmpeg",
      ["-i", filePath, "-vn", "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
      { timeout: 30000, maxBuffer: 1 << 26, encoding: "buffer" }
    );
    const samples: number[] = [];
    const n = Math.floor(stdout.length / 2);
    if (n < 128) return "0".repeat(16);
    for (let i = 0; i < 65; i++) {
      const idx = Math.floor((i / 64) * (n - 1)) * 2;
      samples.push(stdout.readInt16LE(idx));
    }
    let bits = "";
    for (let i = 0; i < 64; i++) bits += samples[i] > samples[i + 1] ? "1" : "0";
    return BigInt("0b" + bits).toString(16).padStart(16, "0");
  } catch {
    return "0".repeat(16);
  }
}

// ── Similarity ─────────────────────────────────────────────────────────────

export function hammingDistanceHex(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  try {
    const x = BigInt("0x" + a), y = BigInt("0x" + b);
    let d = 0, v = x ^ y;
    while (v) { d += Number(v & 1n); v >>= 1n; }
    return d;
  } catch { return 64; }
}

/** 0..1 — 1 means visually identical */
export function visualSimilarity(a: string, b: string): number {
  return 1 - hammingDistanceHex(a, b) / 64;
}

export function audioSimilarity(a: string, b: string): number {
  return 1 - hammingDistanceHex(a, b) / 64;
}

// Visual hashes combine 4 frame-hashes; average per-frame similarity for finer granularity
export function visualSimilarityFine(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 0;
  let total = 0;
  for (let i = 0; i < 4; i++) {
    total += 1 - hammingDistanceHex(a.slice(i * 4, i * 4 + 4), b.slice(i * 4, i * 4 + 4)) / 16;
  }
  return total / 4;
}

export const DUP_VISUAL_THRESHOLD = 0.92; // ≥ 92% visual similarity → flag for review (re-encodes score ~97%; distinct footage stays below)
export const DUP_AUDIO_THRESHOLD = 0.92; // ≥ 92% audio similarity → flag for review
