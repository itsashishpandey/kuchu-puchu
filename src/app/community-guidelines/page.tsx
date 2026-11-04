import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/community-guidelines: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/community-guidelines");

export default function Page() {
  return <StaticSeoPage path="/community-guidelines" />;
}
