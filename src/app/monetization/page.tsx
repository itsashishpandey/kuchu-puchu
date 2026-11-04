import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/monetization: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/monetization");

export default function Page() {
  return <StaticSeoPage path="/monetization" />;
}
