import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/about: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/about");

export default function Page() {
  return <StaticSeoPage path="/about" />;
}
