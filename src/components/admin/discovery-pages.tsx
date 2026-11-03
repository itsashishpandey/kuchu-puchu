"use client";

// Admin → Content Discovery & Personalization (routes: #/admin/discovery/<page>).
import * as Icons from "lucide-react";
import { useAuth } from "@/components/app/auth-provider";
import { DISCOVERY_NAV, DiscoveryNav, canSeeDiscovery } from "./discovery/shared";
import { LanguagesPage } from "./discovery/languages";
import { CategoriesPage } from "./discovery/categories";
import { SubcategoriesPage } from "./discovery/subcategories";
import { TagReviewPage } from "./discovery/tag-review";
import { InterestsPage } from "./discovery/interests";
import { RecommendationPage } from "./discovery/recommendation";
import { ReportsPage } from "./discovery/reports";

export const DISCOVERY_PAGES = DISCOVERY_NAV.map(({ slug, label }) => ({ slug, label }));

export function AdminDiscoveryPage({ page }: { page?: string }) {
  const { user } = useAuth();
  const role = user?.adminRole ?? null;
  const allowed = DISCOVERY_NAV.filter(p => canSeeDiscovery(p.slug, role));
  const known = DISCOVERY_NAV.some(p => p.slug === page);
  // no page (or an unknown one) → the first page this role may open
  const slug = page && known ? page : allowed[0]?.slug;
  const permitted = !!slug && canSeeDiscovery(slug, role);

  return (
    <div>
      <DiscoveryNav current={slug ?? ""} adminRole={role} />
      {!permitted ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-secondary/50 px-6 py-14 text-center">
          <Icons.Lock size={26} className="text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">Not available for your role</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Ask a super admin if you need access to this page.</p>
        </div>
      ) : slug === "languages" ? <LanguagesPage />
        : slug === "categories" ? <CategoriesPage />
        : slug === "subcategories" ? <SubcategoriesPage />
        : slug === "tags" ? <TagReviewPage />
        : slug === "interests" ? <InterestsPage />
        : slug === "recommendation" ? <RecommendationPage />
        : <ReportsPage />}
    </div>
  );
}
