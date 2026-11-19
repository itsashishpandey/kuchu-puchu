import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/app/app";
import { JsonLd, breadcrumbLd } from "@/components/app/server-page";
import { SITE_URL } from "@/lib/seo-pages";
import { blogPostBySlug } from "@/lib/blog-posts";

// mykuchupuchu.com/blog/<slug>: one blog post (text in src/lib/blog-posts.ts). Unknown slugs are 404.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) return { title: "Page not found", robots: { index: false } };
  const path = `/blog/${post.slug}`;
  return {
    title: { absolute: post.title },
    description: post.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article", title: post.title, description: post.description, url: path, siteName: "Kuchu Puchu",
      publishedTime: post.published, modifiedTime: post.updated, authors: ["Kuchu Puchu"],
      images: [{ url: "/images/hero-wide.webp", width: 1344, height: 672, alt: post.imageAlt }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPostRoute({ params }: Props) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) notFound();
  const url = `${SITE_URL}/blog/${post.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.h1,
        description: post.description,
        datePublished: post.published,
        dateModified: post.updated,
        image: `${SITE_URL}/images/hero-wide.webp`,
        url,
        mainEntityOfPage: url,
        inLanguage: "en",
        author: { "@type": "Organization", name: "Kuchu Puchu", url: SITE_URL },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      breadcrumbLd([{ name: "Blog", path: "/blog" }, { name: post.crumb, path: `/blog/${post.slug}` }]),
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: post.h1,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: post.apps.length,
        itemListElement: post.apps.map(a => ({
          "@type": "ListItem",
          position: a.rank,
          url: `${url}#${a.id}`,
          item: {
            "@type": "SoftwareApplication",
            name: a.name,
            applicationCategory: a.rank === 1 ? "EducationalApplication" : "EntertainmentApplication",
            operatingSystem: a.platforms,
            description: a.bestFor,
            ...(a.links[0] ? { sameAs: a.links.filter(l => l.url.startsWith("http")).map(l => l.url) } : {}),
          },
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: post.faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  return (
    <>
      <JsonLd data={ld} />
      <App initialPath={`/blog/${post.slug}`} />
    </>
  );
}
