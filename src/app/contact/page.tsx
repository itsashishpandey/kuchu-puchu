import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/contact: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/contact");

export default function Page() {
  return <StaticSeoPage path="/contact" />;
}
