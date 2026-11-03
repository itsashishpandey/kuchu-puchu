"use client";

// Sends a video to /api/creator/upload-chunk in 2 MB pieces. A single long upload request is cut
// off by Cloudflare after ~100 s on slow connections; small pieces always finish in time, a piece
// that fails is retried, and the progress shown is the real number of bytes sent.

/** Must match CHUNK_BYTES in src/lib/chunked-upload.ts. */
export const PIECE_BYTES = 2 * 1024 * 1024;
const MAX_TRIES = 5;

/** A refusal from the server (wrong format, limit reached…) — retrying won't help. */
export class UploadRefused extends Error {}

type Reply = { status: number; data: { error?: string } | null };

function sendPiece(url: string, body: Blob, onSent: (bytes: number) => void): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.timeout = 95_000;
    xhr.upload.onprogress = e => onSent(e.loaded);
    xhr.onload = () => {
      let data: Reply["data"] = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* e.g. a Cloudflare error page */ }
      resolve({ status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error("The connection dropped"));
    xhr.ontimeout = () => reject(new Error("The connection timed out"));
    xhr.send(body);
  });
}

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Uploads `file` piece by piece and returns the upload id to send with the video details.
 * `onProgress(sentBytes, totalBytes)` reports real progress; `onRetry(attempt)` fires before a retry.
 */
export async function uploadInPieces(
  file: File,
  { onProgress, onRetry }: { onProgress: (sent: number, total: number) => void; onRetry?: (attempt: number) => void },
): Promise<string> {
  const id = randomId();
  const pieces = Math.max(1, Math.ceil(file.size / PIECE_BYTES));
  let done = 0;
  for (let index = 0; index < pieces; index++) {
    const piece = file.slice(index * PIECE_BYTES, Math.min(file.size, (index + 1) * PIECE_BYTES));
    const url = `/api/creator/upload-chunk?id=${id}&index=${index}&size=${file.size}&name=${encodeURIComponent(file.name)}`;
    for (let attempt = 1; ; attempt++) {
      try {
        const r = await sendPiece(url, piece, sent => onProgress(done + sent, file.size));
        if (r.status >= 200 && r.status < 300) break;
        // a clear refusal (bad format, too big, limit reached, expired): stop and show why
        if (r.status >= 400 && r.status < 500 && r.status !== 408) throw new UploadRefused(r.data?.error || `Upload refused (HTTP ${r.status})`);
        throw new Error(r.data?.error || `The server didn't answer (HTTP ${r.status})`);
      } catch (e) {
        if (e instanceof UploadRefused || attempt >= MAX_TRIES) throw e;
        onProgress(done, file.size); // back to the start of this piece
        onRetry?.(attempt); // shown until bytes flow again
        await sleep(attempt * 2000);
      }
    }
    done += piece.size;
    onProgress(done, file.size);
  }
  return id;
}
