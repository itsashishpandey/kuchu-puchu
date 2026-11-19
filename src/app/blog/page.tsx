import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/blog: list of blog posts (src/lib/blog-posts.ts)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/blog");

export default function Page() {
  return <StaticSeoPage path="/blog" />;
}
