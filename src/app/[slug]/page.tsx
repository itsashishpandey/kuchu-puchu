import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/app/app";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/app/server-page";
import { categorySeoByPath, seoMetadata, SITE_URL } from "@/lib/seo-pages";
import { categoryContent } from "@/lib/category-pages";
import { loadCategoryPageData } from "@/lib/category-data";

// Category landing pages: mykuchupuchu.com/nursery-rhymes, /cartoons-for-kids… (list in seo-pages.ts).
// Every other unknown address is a 404. Pages of categories with no approved videos yet are left out of
// search (noindex) until their first video is approved.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = categorySeoByPath(`/${slug}`);
  if (!seo) return { title: "Page not found", robots: { index: false } };
  const data = await loadCategoryPageData(seo.dbSlug);
  return seoMetadata(seo, { noindex: (data.category?.videoCount ?? 0) === 0 });
}

export default async function CategoryRoute({ params }: Props) {
  const { slug } = await params;
  const seo = categorySeoByPath(`/${slug}`);
  const content = seo && categoryContent(seo.dbSlug);
  if (!seo || !content) notFound();
  const data = await loadCategoryPageData(seo.dbSlug);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...webPageLd(seo, "CollectionPage"),
        about: content.h1,
        audience: { "@type": "PeopleAudience", suggestedMinAge: 3, suggestedMaxAge: 8 },
        isFamilyFriendly: true,
      },
      breadcrumbLd([{ name: seo.label, path: seo.path }]),
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}${seo.path}#faq`,
        mainEntity: content.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  return (
    <>
      <JsonLd data={ld} />
      <App initialPath={seo.path} pageData={data} />
    </>
  );
}
