// Text helpers shared by suggestions and search (pure).

const STOP = new Set([
  "a", "an", "the", "and", "or", "of", "for", "in", "on", "to", "with", "my", "your", "our", "is", "are", "it",
  "this", "that", "by", "at", "from", "how", "what", "why", "video", "videos", "short", "shorts", "new", "best",
  "ka", "ki", "ke", "aur", "se", "me", "mein", "hai",
]);

// Words that describe the *kind* of content but don't identify a topic on their own.
export const GENERIC = new Set([
  "jokes", "joke", "education", "educational", "stories", "story", "tips", "reviews", "review", "videos", "music",
  "news", "tutorials", "tutorial", "content", "experiences", "experience", "performances", "performance",
  "learning", "recipes", "recipe", "fashion", "relationships", "relationship", "awareness", "basics",
]);

export function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[#@]/g, " ")
    .replace(/[^\p{L}\p{N}\p{M}\s'-]/gu, " ")
    .replace(/['’-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Light English stemming: plural / -ing / -ed so "conversations" ~ "conversation", "jokes" ~ "joke". */
export function stem(word: string): string {
  if (word.length <= 3 || /[^\x00-\x7f]/.test(word)) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("es") && /(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokens(text: string, opts: { keepStop?: boolean } = {}): string[] {
  const out = normalize(text).split(" ").filter(Boolean);
  return opts.keepStop ? out : out.filter(t => !STOP.has(t));
}

export function stems(text: string): string[] {
  return tokens(text).map(stem);
}

/** Damerau–Levenshtein (optimal string alignment) distance, capped for speed. */
export function editDistance(a: string, b: string, max = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** Allowed typo distance for a word length (no fuzzy matching for short words). */
export function typoBudget(len: number): number {
  if (len < 5) return 0;
  if (len < 9) return 1;
  return 2;
}

/** Deterministic 0..1 hash (for stable "random" discovery ordering per viewer/day). */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
