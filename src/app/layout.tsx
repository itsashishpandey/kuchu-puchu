import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { App } from "@/components/app/app";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://clipora.io"),
  title: {
    default: "Clipora — Create Videos. Get Views. Earn Real Money.",
    template: "%s | Clipora",
  },
  description:
    "Clipora pays creators for every qualified view and every approved original upload. Build your channel, grow your audience, and withdraw real earnings.",
  keywords: [
    "creator monetization", "short video platform", "earn from videos",
    "video creator earnings", "Clipora", "creator payouts",
  ],
  authors: [{ name: "Clipora" }],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "Clipora — Create Videos. Get Views. Earn Real Money.",
    description:
      "The creator-first short video platform. $1.00 per 1,000 qualified views + $0.50 per approved original upload.",
    url: "https://clipora.io",
    siteName: "Clipora",
    type: "website",
    images: [{ url: "/images/hero-wide.webp", width: 1344, height: 672, alt: "Clipora creators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipora — Create Videos. Get Views. Earn Real Money.",
    description: "Earn from qualified views and approved original uploads.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FF1744",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Clipora",
  url: "https://clipora.io",
  description: "Creator-first short video monetization platform.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://clipora.io/#/explore?q={search_term_string}",
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
