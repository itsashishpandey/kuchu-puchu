"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth-provider";
import { useRoute, useScrollReset, InitialPathContext } from "./router";
import { UpdateNotice } from "./update-notice";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { Home } from "@/components/marketing/home";
import { AboutPage } from "@/components/marketing/about";
import { ContactPage } from "@/components/marketing/contact";
import { ExplorePage } from "@/components/marketing/explore";
import { PolicyPage } from "@/components/marketing/policies";
import { DeleteAccountPage } from "@/components/shared/delete-account";
import { CreatorChannelPage } from "@/components/marketing/creator-channel";
import { LoginPage, ForgotPasswordPage, JoinPage } from "@/components/marketing/auth-pages";
import { CreatorApplicationPage } from "@/components/marketing/creator-application";
import { OnboardingPage } from "@/components/discovery/onboarding";
import { InterestsSettingsPage } from "@/components/discovery/interests-settings";
import { SearchPage, SavedPage } from "@/components/discovery/search-page";
import { VideoFeed } from "@/components/feed/video-feed";
import { DashboardShell } from "@/components/dashboard/shell";
import { OverviewPage, EarningsPage, AnalyticsPage } from "@/components/dashboard/overview-earnings";
import { UploadPage, MyVideosPage } from "@/components/dashboard/upload-videos";
import { WithdrawPage, TransactionsPage, NotificationsPage, SettingsPage } from "@/components/dashboard/channel-wallet";
import { ChannelPage, FollowersPage } from "@/components/dashboard/channel-studio";
import { AdminShell } from "@/components/admin/shell";
import { AdminDashboard } from "@/components/admin/overview";
import { AdminCreatorsPage, AdminVideosPage, AdminDuplicatesPage } from "@/components/admin/creators-videos";
import { AdminWithdrawalsPage, AdminEarningsPage, AdminFraudPage } from "@/components/admin/finance";
import { AdminSafetyPage, AdminAppUsersPage } from "@/components/admin/safety";
import {
  AdminMonetizationPage, AdminUploadRulesPage, AdminCategoriesPage,
  AdminHomepagePage, AdminNotificationsPage, AdminReportsPage,
  AdminUsersPage, AdminPlatformPage,
} from "@/components/admin/settings-pages";
import { AdminDiscoveryPage } from "@/components/admin/discovery-pages";
import { CategoryPage } from "@/components/marketing/category-page";
import { PageDataContext, type PageData } from "./page-data";
import { SITE_TITLE, staticPage, categorySeoByPath, titleForPath } from "@/lib/seo-pages";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function Routes() {
  const route = useRoute();
  useScrollReset(route.path);
  const [first, second, third] = route.segments;

  // ── Immersive video feed (own chrome) ──
  if (first === "feed") return <VideoFeed />;

  // ── Auth pages (own chrome) ──
  if (first === "login") return <LoginPage />;
  if (first === "register") return <CreatorApplicationPage />;
  if (first === "forgot-password") return <ForgotPasswordPage />;
  if (first === "join") return <JoinPage />;
  if (first === "onboarding") return <OnboardingPage />;

  // ── Creator dashboard ──
  if (first === "dashboard") {
    const page =
      !second ? <OverviewPage /> :
      second === "channel" ? <ChannelPage /> :
      second === "followers" ? <FollowersPage /> :
      second === "upload" ? <UploadPage /> :
      second === "videos" ? <MyVideosPage /> :
      second === "analytics" ? <AnalyticsPage /> :
      second === "earnings" ? <EarningsPage /> :
      second === "withdraw" ? <WithdrawPage /> :
      second === "transactions" ? <TransactionsPage /> :
      second === "notifications" ? <NotificationsPage /> :
      second === "settings" ? <SettingsPage /> :
      <OverviewPage />;
    return <DashboardShell>{page}</DashboardShell>;
  }

  // ── Admin console ──
  if (first === "admin") {
    const page =
      !second ? <AdminDashboard /> :
      second === "creators" ? <AdminCreatorsPage /> :
      second === "videos" ? <AdminVideosPage /> :
      second === "duplicates" ? <AdminDuplicatesPage /> :
      second === "safety" ? <AdminSafetyPage /> :
      second === "app-users" ? <AdminAppUsersPage /> :
      second === "monetization" ? <AdminMonetizationPage /> :
      second === "upload-rules" ? <AdminUploadRulesPage /> :
      second === "earnings" ? <AdminEarningsPage /> :
      second === "withdrawals" ? <AdminWithdrawalsPage /> :
      second === "fraud" ? <AdminFraudPage /> :
      second === "categories" ? <AdminCategoriesPage /> :
      second === "homepage" ? <AdminHomepagePage /> :
      second === "notifications" ? <AdminNotificationsPage /> :
      second === "reports" ? <AdminReportsPage /> :
      second === "users" ? <AdminUsersPage /> :
      second === "platform" ? <AdminPlatformPage /> :
      second === "discovery" ? <AdminDiscoveryPage page={third} /> :
      <AdminDashboard />;
    return <AdminShell>{page}</AdminShell>;
  }

  // ── Public marketing pages (navbar + footer) ──
  let page: React.ReactNode;
  if (!first) page = <Home />;
  else if (first === "about") page = <AboutPage />;
  else if (first === "contact") page = <ContactPage />;
  else if (first === "explore") page = <ExplorePage />;
  else if (first === "trending") page = <ExplorePage trending />;
  else if (first === "search") page = <SearchPage />;
  else if (first === "saved") page = <SavedPage />;
  else if (first === "settings" && second === "interests") page = <InterestsSettingsPage />;
  else if (first === "policies" && second) page = <PolicyPage slug={second} />;
  else if (staticPage(route.path)?.policy) page = <PolicyPage slug={staticPage(route.path)!.policy!} />;
  else if (categorySeoByPath(route.path)) {
    const dbSlug = categorySeoByPath(route.path)!.dbSlug;
    page = <CategoryPage key={dbSlug} dbSlug={dbSlug} />;
  }
  else if (first === "delete-account") page = <DeleteAccountPage />;
  else if (first === "c" && second) page = <CreatorChannelPage username={second} />;
  else page = <Home />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

export function App({ initialPath = "/", pageData = null }: { initialPath?: string; pageData?: PageData | null } = {}) {
  useEffect(() => {
    // Tab title. Real pages (/about, /nursery-rhymes…) use their search title from seo-pages.ts,
    // channel pages keep the one their server page set, /#/ screens use the list below.
    const titles: Record<string, string> = {
      "": SITE_TITLE,
      "delete-account": "Delete Your Account — Kuchu Puchu",
      about: "About Us — Kuchu Puchu",
      contact: "Contact Us — Kuchu Puchu",
      explore: "Explore Videos — Kuchu Puchu",
      trending: "Trending Videos — Kuchu Puchu",
      register: "Become a Creator — Kuchu Puchu",
      join: "Create a Parent Account — Kuchu Puchu",
      onboarding: "Personalize Your Feed — Kuchu Puchu",
      search: "Search — Kuchu Puchu",
      saved: "Saved Videos — Kuchu Puchu",
      settings: "My Interests & Languages — Kuchu Puchu",
      login: "Log In — Kuchu Puchu",
      feed: "Video Feed — Kuchu Puchu",
      dashboard: "Creator Dashboard — Kuchu Puchu",
      admin: "Admin Console — Kuchu Puchu",
    };
    const wanted = (): string | null => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (!hash) return titleForPath(window.location.pathname);
      const seg = hash.split(/[/?]/)[0] ?? "";
      return titles[seg] ?? (seg === "policies" ? "Policies — Kuchu Puchu" : seg === "c" ? "Creator — Kuchu Puchu" : titles[""]);
    };
    const apply = () => {
      const t = wanted();
      if (t && document.title !== t) document.title = t;
    };
    apply();
    // routechange fires after the router swapped the address, so read it on the next tick
    const later = () => setTimeout(apply, 0);
    window.addEventListener("hashchange", apply);
    window.addEventListener("popstate", apply);
    window.addEventListener("routechange", later);
    // Next.js puts the server page's <title> back after an address change it didn't make (e.g. an
    // old /#/about link moved to /about while the page starts): put ours back whenever that happens
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      mo.disconnect();
      window.removeEventListener("hashchange", apply);
      window.removeEventListener("popstate", apply);
      window.removeEventListener("routechange", later);
    };
  }, []);

  return (
    <InitialPathContext.Provider value={initialPath}>
      <PageDataContext.Provider value={pageData}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes />
            <UpdateNotice />
          </AuthProvider>
        </QueryClientProvider>
      </PageDataContext.Provider>
    </InitialPathContext.Provider>
  );
}
