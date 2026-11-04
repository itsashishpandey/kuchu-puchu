import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/copyright-policy: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/copyright-policy");

export default function Page() {
  return <StaticSeoPage path="/copyright-policy" />;
}
