// The visitor's real address. Never trust the FIRST X-Forwarded-For entry: the client writes it,
// and Cloudflare passes it through (checked on live 2026-11-04 — a fake value reached the app).
// Live path: visitor → Cloudflare → Apache → Node. Apache appends the address it accepted the
// connection from as the LAST X-Forwarded-For entry; Cloudflare puts the real visitor address in
// CF-Connecting-IP (a visitor can't override it on that path).
//  - last entry is a Cloudflare address (or already the visitor) → use CF-Connecting-IP
//  - otherwise someone reached the server directly → the last entry is the real peer; any
//    CF-Connecting-IP they sent is ignored
import { createHash } from "crypto";

// https://www.cloudflare.com/ips/
const CF_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CF_V6 = ["2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"];

const v4ToInt = (ip: string): number | null => {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) {
    const b = Number(x);
    if (!/^\d{1,3}$/.test(x) || b > 255) return null;
    n = n * 256 + b;
  }
  return n;
};

/** 8 groups of 16 bits, or null. Handles "::" and an embedded IPv4 tail. */
function v6Groups(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const tail = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const n = v4ToInt(tail[1]);
    if (n === null) return null;
    s = s.slice(0, -tail[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - left.length - right.length : 0;
  const all = [...left, ...Array(Math.max(0, fill)).fill("0"), ...right];
  if (all.length !== 8 || all.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return all.map(g => parseInt(g, 16));
}

function inV4(ip: string, cidr: string) {
  const [base, bits] = cidr.split("/");
  const a = v4ToInt(ip), b = v4ToInt(base);
  if (a === null || b === null) return false;
  const mask = Number(bits) === 0 ? 0 : (0xffffffff << (32 - Number(bits))) >>> 0;
  return ((a & mask) >>> 0) === ((b & mask) >>> 0);
}
function inV6(ip: string, cidr: string) {
  const [base, bitsStr] = cidr.split("/");
  const a = v6Groups(ip), b = v6Groups(base);
  if (!a || !b) return false;
  let bits = Number(bitsStr);
  for (let i = 0; i < 8 && bits > 0; i++, bits -= 16) {
    const m = bits >= 16 ? 0xffff : (0xffff << (16 - bits)) & 0xffff;
    if ((a[i] & m) !== (b[i] & m)) return false;
  }
  return true;
}

/** "::ffff:1.2.3.4" → "1.2.3.4" */
const plain = (ip: string) => ip.trim().replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i, "$1");

export function isCloudflareIp(ip: string): boolean {
  const x = plain(ip);
  return x.includes(":") ? CF_V6.some(c => inV6(x, c)) : CF_V4.some(c => inV4(x, c));
}

export function clientIp(req: Request): string {
  const hops = (req.headers.get("x-forwarded-for") || "").split(",").map(plain).filter(Boolean);
  const peer = hops[hops.length - 1] || plain(req.headers.get("x-real-ip") || "");
  const cf = plain(req.headers.get("cf-connecting-ip") || "");
  if (cf && peer && (peer === cf || isCloudflareIp(peer))) return cf;
  return peer || "0.0.0.0";
}

/**
 * A scrambled code for the visitor's internet connection (the address itself is never stored).
 * IPv4: the whole address. IPv6: the /64 block — one home or phone gets a whole block, so
 * rotating addresses inside it stays the same connection.
 */
export function networkKeyFromIp(ip: string): string {
  const x = plain(ip);
  let net = x;
  if (x.includes(":")) {
    const g = v6Groups(x);
    net = g ? g.slice(0, 4).map(n => n.toString(16)).join(":") + "::/64" : x;
  }
  return createHash("sha256").update(`net|${net}`).digest("hex").slice(0, 32);
}
