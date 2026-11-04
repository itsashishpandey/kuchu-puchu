import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/explore: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/explore");

export default function Page() {
  return <StaticSeoPage path="/explore" />;
}
