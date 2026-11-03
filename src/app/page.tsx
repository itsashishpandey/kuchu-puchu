import { App } from "@/components/app/app";

// always serve the latest shell (no year-long caching), so a deploy reaches everyone on the next visit
export const dynamic = "force-dynamic";

export default function Page() {
  return <App />;
}
