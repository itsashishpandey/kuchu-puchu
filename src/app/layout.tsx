import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SITE_TITLE, SITE_DESCRIPTION } from "@/lib/seo-pages";

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

// The home page's title and description (search results and link previews) live in seo-pages.ts.
export const metadata: Metadata = {
  metadataBase: new URL("https://mykuchupuchu.com"),
  title: {
    default: SITE_TITLE,
    template: "%s | Kuchu Puchu",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Kuchu Puchu", "Kuchu Puchu app", "educational videos for kids", "learning videos for kids",
    "kids learning app", "ABC videos for kids", "counting videos for kids", "colors for kids",
    "nursery rhymes", "poems for kids", "Hindi rhymes for kids", "safe video app for kids",
    "kids cartoon videos", "kids video creators",
  ],
  applicationName: "Kuchu Puchu",
  category: "education",
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

// Who we are, on every page (the homepage adds the app and its FAQ in src/app/page.tsx).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://mykuchupuchu.com/#organization",
      name: "Kuchu Puchu",
      url: "https://mykuchupuchu.com",
      logo: "https://mykuchupuchu.com/brand/icon-192.png",
      email: "support@mykuchupuchu.com",
      description: "Kuchu Puchu makes a free, ad-free video app and website with educational videos for kids aged 3–8.",
    },
    {
      "@type": "WebSite",
      "@id": "https://mykuchupuchu.com/#website",
      name: "Kuchu Puchu",
      url: "https://mykuchupuchu.com",
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": "https://mykuchupuchu.com/#organization" },
    },
  ],
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
