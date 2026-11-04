import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/terms: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/terms");

export default function Page() {
  return <StaticSeoPage path="/terms" />;
}
