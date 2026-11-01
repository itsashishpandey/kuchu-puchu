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

export const metadata: Metadata = {
  metadataBase: new URL("https://kuchupuchu.com"),
  title: {
    default: "Kuchu Puchu — Create Kids Videos. Get Views. Earn Real Money.",
    template: "%s | Kuchu Puchu",
  },
  description:
    "Kuchu Puchu pays kids-content creators for every qualified view and every approved original upload. Make cartoon videos, nursery rhymes and fun stories — build your channel and withdraw real earnings.",
  keywords: [
    "kids video platform", "creator monetization", "kids cartoon creators",
    "nursery rhymes", "earn from kids videos", "Kuchu Puchu", "creator payouts",
    "kids content", "cartoon shorts",
  ],
  authors: [{ name: "Kuchu Puchu" }],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "Kuchu Puchu — Create Kids Videos. Get Views. Earn Real Money.",
    description:
      "The creator-first kids short video platform. $1.00 per 1,000 qualified views + $0.50 per approved original upload.",
    url: "https://kuchupuchu.com",
    siteName: "Kuchu Puchu",
    type: "website",
    images: [{ url: "/images/hero-wide.webp", width: 1344, height: 672, alt: "Kuchu Puchu creators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kuchu Puchu — Create Kids Videos. Get Views. Earn Real Money.",
    description: "Earn from qualified views and approved original kids uploads.",
  },
  robots: { index: true, follow: true },
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
  url: "https://kuchupuchu.com",
  description: "Creator-first kids short video monetization platform.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://kuchupuchu.com/#/explore?q={search_term_string}",
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
