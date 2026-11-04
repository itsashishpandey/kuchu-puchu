// Real page addresses (no "#") with their search titles and descriptions. A plain module shared by
// the server pages (metadata), the router (which paths are real pages) and the browser (titles).
// Search engines ignore everything after "#", so every page meant to be found lives here.
import type { Metadata } from "next";

export const SITE_URL = "https://mykuchupuchu.com";

export const SITE_TITLE = "Kuchu Puchu App — 5M+ Kuchu Puchu Educational Videos for kids";
export const SITE_DESCRIPTION =
  "Free Kuchu Puchu Funny Learning Videos for Kids and Parents | Kuchu Puchu app helps kids to learn ABCs, counting, colors, names, poems & more. Download Kuchu Puchu App";

export type SeoPage = { path: string; title: string; description: string; label: string };

/** Pages other than the homepage and categories. Policy pages show POLICIES[policy] (policies-data.ts). */
export const STATIC_PAGES: (SeoPage & { policy?: string })[] = [
  { path: "/about", label: "About",
    title: "About Kuchu Puchu — Safe Educational Video App for Kids",
    description: "About Kuchu Puchu | A free, ad-free kids video app with funny learning videos for kids aged 3–8, made by approved creators. Download Kuchu Puchu App" },
  { path: "/contact", label: "Contact",
    title: "Contact Kuchu Puchu — Help for Parents & Creators",
    description: "Contact the Kuchu Puchu team | Help with the Kuchu Puchu app, videos for kids, reports or your creator account. Email support@mykuchupuchu.com" },
  { path: "/explore", label: "Explore videos",
    title: "Kuchu Puchu Videos — Watch Free Kids Videos Online",
    description: "Watch free Kuchu Puchu videos for kids online | Cartoons, nursery rhymes, stories, ABC and learning videos by category and language. Download Kuchu Puchu App" },
  { path: "/trending", label: "Trending",
    title: "Trending Kuchu Puchu Videos — Popular Kids Videos",
    description: "Trending Kuchu Puchu videos for kids | The most-watched cartoons, rhymes and learning videos from the last 30 days. Download Kuchu Puchu App" },
  { path: "/monetization", label: "Monetization policy", policy: "monetization",
    title: "Kuchu Puchu Monetization Policy — Earn from Kids Videos",
    description: "How Kuchu Puchu creators earn from kids videos | Pay per 1,000 qualified views, upload rewards, earning unlock and payouts explained in plain words." },
  { path: "/payment-policy", label: "Payment policy", policy: "payment",
    title: "Kuchu Puchu Payment Policy — Creator Payouts & Withdrawals",
    description: "Kuchu Puchu payment and withdrawal policy | When creator earnings become available, minimum payout, bank and PayPal withdrawals and review steps." },
  { path: "/copyright-policy", label: "Copyright policy", policy: "copyright",
    title: "Kuchu Puchu Copyright Policy — Original Kids Content",
    description: "Kuchu Puchu copyright and content policy | Original kids videos only, music rights, duplicate detection and how to report a copied video." },
  { path: "/community-guidelines", label: "Community guidelines", policy: "community",
    title: "Kuchu Puchu Community Guidelines — Safe Videos for Kids",
    description: "Kuchu Puchu community guidelines | What is allowed in videos for kids aged 3–8: no violence, scary content, ads or bad language. Safe videos for kids." },
  { path: "/privacy", label: "Privacy policy", policy: "privacy",
    title: "Kuchu Puchu Privacy Policy — No Ads, No Tracking",
    description: "Kuchu Puchu privacy policy | Made for kids aged 3–8: no ads, no tracking, no data sold. What the Kuchu Puchu app and website store and why." },
  { path: "/terms", label: "Terms & conditions", policy: "terms",
    title: "Kuchu Puchu Terms & Conditions",
    description: "Kuchu Puchu terms and conditions | The rules for using the Kuchu Puchu app and website, for parents, viewers and kids video creators." },
];

/** The 15 kids categories: database slug → page address, name and search texts. Content: category-pages.ts. */
export const CATEGORY_SEO: (SeoPage & { dbSlug: string; emoji: string })[] = [
  { dbSlug: "cartoons-animation", path: "/cartoons-for-kids", label: "Cartoons", emoji: "🎬",
    title: "Kuchu Puchu Cartoons — Funny Cartoon Videos for Kids",
    description: "Free Kuchu Puchu Cartoons for Kids and Parents | Funny, gentle cartoon videos and animated adventures for kids aged 3–8, with no ads. Download Kuchu Puchu App" },
  { dbSlug: "rhymes-songs", path: "/nursery-rhymes", label: "Nursery Rhymes", emoji: "🎵",
    title: "Kuchu Puchu Nursery Rhymes — Kids Songs & Poems Videos",
    description: "Free Kuchu Puchu Nursery Rhymes for Kids and Parents | Sing-along rhymes, poems, lullabies and learning songs in Hindi, English & more. Download Kuchu Puchu App" },
  { dbSlug: "stories", path: "/kids-stories", label: "Stories", emoji: "📖",
    title: "Kuchu Puchu Stories — Moral & Bedtime Stories for Kids",
    description: "Free Kuchu Puchu Stories for Kids and Parents | Short bedtime stories, moral stories, fairy tales and folk tales for kids aged 3–8. Download Kuchu Puchu App" },
  { dbSlug: "early-learning", path: "/learning-videos-for-kids", label: "ABC & Learning", emoji: "🔤",
    title: "Kuchu Puchu Learning — ABC, Numbers & Colors Videos for Kids",
    description: "Free Kuchu Puchu Learning Videos for Kids and Parents | Learn ABCs, phonics, counting, colors, shapes and first words through play. Download Kuchu Puchu App" },
  { dbSlug: "science-nature", path: "/science-videos-for-kids", label: "Science", emoji: "🔬",
    title: "Kuchu Puchu Science — Space & Dinosaur Videos for Kids",
    description: "Free Kuchu Puchu Science Videos for Kids and Parents | Curious questions, safe experiments, space, plants and dinosaurs for kids aged 3–8. Download Kuchu Puchu App" },
  { dbSlug: "animals", path: "/animal-videos-for-kids", label: "Animals", emoji: "🦁",
    title: "Kuchu Puchu Animals — Animal Names & Sounds for Kids",
    description: "Free Kuchu Puchu Animal Videos for Kids and Parents | Learn farm, jungle and ocean animal names, animal sounds and caring for pets. Download Kuchu Puchu App" },
  { dbSlug: "arts-crafts", path: "/drawing-for-kids", label: "Drawing & Crafts", emoji: "🎨",
    title: "Kuchu Puchu Drawing — Arts, Coloring & Crafts for Kids",
    description: "Free Kuchu Puchu Drawing and Craft Videos for Kids and Parents | Easy drawing, coloring, painting and simple crafts kids can make. Download Kuchu Puchu App" },
  { dbSlug: "dance-movement", path: "/dance-videos-for-kids", label: "Dance", emoji: "💃",
    title: "Kuchu Puchu Dance — Dance Songs & Kids Yoga Videos",
    description: "Free Kuchu Puchu Dance Videos for Kids and Parents | Dance-along songs, movement games and kids yoga to keep little bodies active. Download Kuchu Puchu App" },
  { dbSlug: "kids-comedy", path: "/funny-videos-for-kids", label: "Funny Videos", emoji: "😂",
    title: "Kuchu Puchu Funny Videos — Comedy Cartoons for Kids",
    description: "Free Kuchu Puchu Funny Videos for Kids and Parents | Gentle, silly comedy cartoons that make kids laugh, with no pranks or stunts. Download Kuchu Puchu App" },
  { dbSlug: "toys-play", path: "/toys-and-play-videos", label: "Toys & Play", emoji: "🧸",
    title: "Kuchu Puchu Toys & Play — Pretend Play Videos for Kids",
    description: "Free Kuchu Puchu Toys and Play Videos for Kids and Parents | Pretend play, building blocks and puzzles, with no unboxing ads. Download Kuchu Puchu App" },
  { dbSlug: "our-world", path: "/our-world-videos-for-kids", label: "Our World", emoji: "🌍",
    title: "Kuchu Puchu Our World — Festivals & Vehicles for Kids",
    description: "Free Kuchu Puchu Our World Videos for Kids and Parents | Learn about festivals, places, cultures, community helpers and vehicles. Download Kuchu Puchu App" },
  { dbSlug: "good-habits", path: "/good-habits-for-kids", label: "Good Habits", emoji: "💛",
    title: "Kuchu Puchu Good Habits — Manners & Feelings Videos for Kids",
    description: "Free Kuchu Puchu Good Habits Videos for Kids and Parents | Manners, healthy habits, safety and understanding feelings for little ones. Download Kuchu Puchu App" },
  { dbSlug: "kids-cooking", path: "/cooking-videos-for-kids", label: "Cooking", emoji: "🍳",
    title: "Kuchu Puchu Cooking — Easy Recipe Videos for Kids",
    description: "Free Kuchu Puchu Cooking Videos for Kids and Parents | Simple, safe recipes kids can make with a grown-up. Download Kuchu Puchu App" },
  { dbSlug: "learn-languages", path: "/learn-languages-for-kids", label: "Languages", emoji: "🗣️",
    title: "Kuchu Puchu Languages — Learn Hindi & English Words for Kids",
    description: "Free Kuchu Puchu Language Videos for Kids and Parents | Learn first words and simple phrases in Hindi, English and more. Download Kuchu Puchu App" },
  { dbSlug: "sports-play", path: "/sports-videos-for-kids", label: "Sports", emoji: "⚽",
    title: "Kuchu Puchu Sports — Outdoor Play & Sports Videos for Kids",
    description: "Free Kuchu Puchu Sports Videos for Kids and Parents | Active outdoor play and first sports skills, always played safely. Download Kuchu Puchu App" },
];

/** Old in-site policy addresses (/policies/<slug>) → their real pages. */
const POLICY_PATHS: Record<string, string> = Object.fromEntries(
  STATIC_PAGES.filter(p => p.policy).map(p => [p.policy!, p.path]),
);

const bare = (p: string) => (p.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";

export const staticPage = (path: string) => STATIC_PAGES.find(p => p.path === bare(path));
export const categorySeoByPath = (path: string) => CATEGORY_SEO.find(c => c.path === bare(path));
export const categorySeoBySlug = (dbSlug: string) => CATEGORY_SEO.find(c => c.dbSlug === dbSlug);
/** The page address for a database category slug, e.g. "rhymes-songs" → "/nursery-rhymes". */
export const categoryPath = (dbSlug: string) => categorySeoBySlug(dbSlug)?.path ?? `/explore?category=${dbSlug}`;

/** Channel pages: mykuchupuchu.com/c/<username>. */
export const isChannelPath = (p: string) => /^\/c\/[^/?#]+/.test(p);

/** True for addresses that are real pages (rendered by the server), not "/#/..." screens. */
export function isCleanPath(p: string): boolean {
  const b = bare(p);
  return b === "/" || isChannelPath(b) || !!staticPage(b) || !!categorySeoByPath(b);
}

/** Maps an old in-site address to its real page, e.g. "/policies/monetization" → "/monetization". */
export function toCleanPath(p: string): string {
  const m = /^\/policies\/([a-z-]+)\/?(\?.*)?$/.exec(p);
  if (m && POLICY_PATHS[m[1]]) return POLICY_PATHS[m[1]] + (m[2] ?? "");
  return p;
}

/** The browser tab title for a real page, or null when the page sets its own (channels). */
export function titleForPath(path: string): string | null {
  const b = bare(path);
  if (b === "/") return SITE_TITLE;
  return staticPage(b)?.title ?? categorySeoByPath(b)?.title ?? null;
}

/** Search metadata for a page from the lists above. */
export function seoMetadata(page: SeoPage, opts: { noindex?: boolean } = {}): Metadata {
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: { title: page.title, description: page.description, url: page.path, siteName: "Kuchu Puchu", type: "website", images: [{ url: "/images/hero-wide.webp", width: 1344, height: 672, alt: "Kuchu Puchu videos for kids" }] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
