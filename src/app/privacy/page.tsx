import type { Metadata } from "next";
import { StaticPolicy, policy } from "@/components/marketing/static-policy";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function Page() {
  return <StaticPolicy policy={policy("privacy")} />;
}
