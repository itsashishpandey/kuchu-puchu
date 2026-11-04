// Server side of the real pages: search metadata, structured data and the first render of the site
// at that address (so the page's text is in the HTML for search engines and AI assistants).
import type { Metadata } from "next";
import { App } from "@/components/app/app";
import { SITE_URL, staticPage, seoMetadata, type SeoPage } from "@/lib/seo-pages";

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** Home › … breadcrumb for structured data. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path === "/" ? "/" : it.path}`,
    })),
  };
}

export function webPageLd(page: SeoPage, type = "WebPage") {
  return {
    "@type": type,
    "@id": `${SITE_URL}${page.path}#webpage`,
    url: `${SITE_URL}${page.path}`,
    name: page.title,
    description: page.description,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function staticMetadata(path: string): Metadata {
  return seoMetadata(staticPage(path)!);
}

/** A page from STATIC_PAGES (about, contact, explore, trending, policies). */
export function StaticSeoPage({ path }: { path: string }) {
  const page = staticPage(path)!;
  const type = page.path === "/about" ? "AboutPage" : page.path === "/contact" ? "ContactPage" : page.path === "/explore" || page.path === "/trending" ? "CollectionPage" : "WebPage";
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [webPageLd(page, type), breadcrumbLd([{ name: page.label, path: page.path }])] }} />
      <App initialPath={page.path} />
    </>
  );
}
