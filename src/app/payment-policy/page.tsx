import { StaticSeoPage, staticMetadata } from "@/components/app/server-page";

// mykuchupuchu.com/payment-policy: a real page (title, description and text in the server HTML)
export const dynamic = "force-dynamic";
export const metadata = staticMetadata("/payment-policy");

export default function Page() {
  return <StaticSeoPage path="/payment-policy" />;
}
