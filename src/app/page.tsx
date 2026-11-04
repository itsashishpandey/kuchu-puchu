import { App } from "@/components/app/app";
import { PARENT_FAQS, SITE_URL } from "@/lib/home-seo";

// always serve the latest shell (no year-long caching), so a deploy reaches everyone on the next visit
export const dynamic = "force-dynamic";

// The app and the parents' FAQ as structured data, so search engines and AI assistants can read
// what Kuchu Puchu is. The FAQ text is the same as the one shown on the page.
const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MobileApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Kuchu Puchu",
      alternateName: "Kuchu Puchu - videos for kids",
      description: "A free kids video app with short, funny educational videos for children aged 3–8: ABCs, counting, colors, shapes, names, nursery rhymes, poems and stories. No ads and no sign-up.",
      operatingSystem: "Android",
      applicationCategory: "EducationalApplication",
      downloadUrl: `${SITE_URL}/downloads/my-kuchu-puchu.apk`,
      image: `${SITE_URL}/brand/icon-192.png`,
      isFamilyFriendly: true,
      audience: { "@type": "PeopleAudience", suggestedMinAge: 3, suggestedMaxAge: 8 },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: PARENT_FAQS.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <App />
    </>
  );
}
