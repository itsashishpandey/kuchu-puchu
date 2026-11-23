import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/app/app";
import { JsonLd, breadcrumbLd, webPageLd } from "@/components/app/server-page";
import { landingSeoByPath, seoMetadata, SITE_URL } from "@/lib/seo-pages";
import { categoryContent } from "@/lib/category-pages";
import { loadCategoryPageData } from "@/lib/category-data";
import { DRAWING_GUIDES } from "@/lib/drawing-guide";

// Category and language landing pages: mykuchupuchu.com/nursery-rhymes, /hindi-videos-for-kids… (lists
// in seo-pages.ts). Every other unknown address is a 404. A page with no approved videos yet is left out
// of search (noindex) until its first video is approved, unless it has evergreen content (alwaysIndex).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = landingSeoByPath(`/${slug}`);
  if (!seo) return { title: "Page not found", robots: { index: false } };
  const data = await loadCategoryPageData(seo.dbSlug);
  return seoMetadata(seo, { noindex: (data.category?.videoCount ?? 0) === 0 && !seo.alwaysIndex });
}

export default async function CategoryRoute({ params }: Props) {
  const { slug } = await params;
  const seo = landingSeoByPath(`/${slug}`);
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
        ...(seo.lang ? { inLanguage: seo.lang } : {}),
      },
      breadcrumbLd([{ name: seo.label, path: seo.path }]),
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}${seo.path}#faq`,
        mainEntity: content.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      ...(content.drawingGuide ? DRAWING_GUIDES.map(g => ({
        "@type": "HowTo",
        "@id": `${SITE_URL}${seo.path}#draw-${g.id}`,
        name: `How to Draw ${g.name} from Kuchu Puchu (Easy Drawing for Kids)`,
        description: `Draw ${g.name}, ${g.who} in the Kuchu Puchu app icon, in 6 easy steps.`,
        tool: [{ "@type": "HowToTool", name: "Pencil" }, { "@type": "HowToTool", name: "Crayons or colour pencils" }],
        supply: [{ "@type": "HowToSupply", name: "A sheet of paper" }],
        step: g.steps.map((st, i) => ({ "@type": "HowToStep", position: i + 1, name: st.title, text: st.text, url: `${SITE_URL}${seo.path}#draw-${g.id}` })),
      })) : []),
    ],
  };
  return (
    <>
      <JsonLd data={ld} />
      <App initialPath={seo.path} pageData={data} />
    </>
  );
}
