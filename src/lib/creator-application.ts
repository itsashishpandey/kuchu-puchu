// Rules for the creator application (shared by the API; the web and app forms mirror them).
export const USERNAME_RE = /^[a-z0-9]{6,20}$/;
export const USERNAME_RULE = "6–20 letters or numbers — no spaces or symbols";

export const DOCUMENT_TYPES = [
  { id: "AADHAAR", label: "Aadhaar card", countries: ["India"] },
  { id: "PAN", label: "PAN card", countries: ["India"] },
  { id: "VOTER_ID", label: "Voter ID", countries: ["India"] },
  { id: "PASSPORT", label: "Passport", countries: null },
  { id: "DRIVING_LICENCE", label: "Driving licence", countries: null },
  { id: "NATIONAL_ID", label: "National ID card", countries: null },
  { id: "OTHER", label: "Other government ID", countries: null },
] as const;

export const DOCUMENT_MAX_MB = 8;

/** The declarations a creator must accept; the version is stored with the acceptance. */
export const AGREEMENTS_VERSION = "2026-11-02-kids";
export const AGREEMENTS = [
  { id: "kids", text: "Kuchu Puchu is only for children aged 3–8. Every video I upload will be made for them: no violence, scary or adult content, bad language, ads, product promotion or links to outside sites." },
  { id: "responsibility", text: "I am solely responsible for every video I upload — its content, legality, originality and suitability for children." },
  { id: "takedown", text: "Kuchu Puchu may remove my content without notice if it receives a valid complaint or the content breaks the Community Guidelines." },
  { id: "strikes", text: "Each upheld complaint is a strike on my channel. 3 active strikes suspend my channel and it may be permanently deleted." },
  { id: "age", text: "I am at least 18 years old." },
  { id: "terms", text: "I agree to the Terms & Conditions, Community Guidelines and Privacy Policy, and I will only upload original content I own." },
] as const;

export const STRIKE_LIMIT = 3;

export function postalCodeError(country: string, code: string): string | null {
  const c = code.trim();
  if (!c) return "PIN / postal code is required";
  if (country === "India") return /^[1-9][0-9]{5}$/.test(c) ? null : "Enter your 6-digit PIN code";
  return /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(c) ? null : "Enter a valid postal code";
}

export function normalizePhone(raw: string): string | null {
  const p = raw.replace(/[\s()-]/g, "");
  return /^\+?[0-9]{7,15}$/.test(p) ? p : null;
}

/** Instagram / YouTube profile links: returns a clean https URL, or null if it isn't one. */
export function socialUrl(kind: "instagram" | "youtube", raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;
  if (kind === "instagram" && /^@?[A-Za-z0-9._]{1,30}$/.test(v)) return `https://www.instagram.com/${v.replace(/^@/, "")}`;
  if (kind === "youtube" && /^@[A-Za-z0-9._-]{3,30}$/.test(v)) return `https://www.youtube.com/${v}`;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    const host = u.hostname.replace(/^www\.|^m\./, "").toLowerCase();
    const ok = kind === "instagram" ? host === "instagram.com" : host === "youtube.com" || host === "youtu.be";
    if (!ok || u.pathname.length < 2) return null;
    return `https://${u.hostname.replace(/^m\./, "www.")}${u.pathname}`.replace(/\/+$/, "");
  } catch { return null; }
}
