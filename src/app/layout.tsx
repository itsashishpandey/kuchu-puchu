import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { App } from "@/components/app/app";

const display = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// The home page's title and description: used for search results and link previews.
const SITE_TITLE = "Kuchu Puchu App — 5M+ Kuchu Puchu Educational Videos for kids";
const SITE_DESCRIPTION =
  "Free Kuchu Puchu Funny Learning Videos for Kids and Parents | Kuchu Puchu app helps kids to learn ABCs, counting, colors, names, poems & more. Download Kuchu Puchu App";

export const metadata: Metadata = {
  metadataBase: new URL("https://mykuchupuchu.com"),
  title: {
    default: SITE_TITLE,
    template: "%s | Kuchu Puchu",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "kids video platform", "creator monetization", "kids cartoon creators",
    "nursery rhymes", "earn from kids videos", "Kuchu Puchu", "creator payouts",
    "kids content", "cartoon shorts",
  ],
  authors: [{ name: "Kuchu Puchu" }],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "https://mykuchupuchu.com",
    siteName: "Kuchu Puchu",
    type: "website",
    images: [{ url: "/images/hero-wide.webp", width: 1344, height: 672, alt: "Kuchu Puchu creators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  // Google Search Console ownership check
  verification: { google: "HbJKsTTjiv8DCV7_saQC_o2d31vqcmZvxnKUH7-cbdc" },
};

export const viewport: Viewport = {
  themeColor: "#1677FF",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kuchu Puchu",
  url: "https://mykuchupuchu.com",
  description: "Creator-first kids short video monetization platform.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://mykuchupuchu.com/#/explore?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
