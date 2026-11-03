import type { Metadata } from "next";
import { StaticPolicy, policy } from "@/components/marketing/static-policy";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default function Page() {
  return <StaticPolicy policy={policy("terms")} />;
}
