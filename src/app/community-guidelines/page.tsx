import type { Metadata } from "next";
import { StaticPolicy, policy } from "@/components/marketing/static-policy";

export const metadata: Metadata = { title: "Community Guidelines", alternates: { canonical: "/community-guidelines" } };

export default function Page() {
  return <StaticPolicy policy={policy("community")} />;
}
