"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth-provider";
import { useRoute, useScrollReset } from "./router";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { Home } from "@/components/marketing/home";
import { AboutPage } from "@/components/marketing/about";
import { ContactPage } from "@/components/marketing/contact";
import { ExplorePage } from "@/components/marketing/explore";
import { PolicyPage } from "@/components/marketing/policies";
import { CreatorChannelPage } from "@/components/marketing/creator-channel";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "@/components/marketing/auth-pages";
import { VideoFeed } from "@/components/feed/video-feed";
import { DashboardShell } from "@/components/dashboard/shell";
import { OverviewPage, EarningsPage, AnalyticsPage } from "@/components/dashboard/overview-earnings";
import { UploadPage, MyVideosPage } from "@/components/dashboard/upload-videos";
import { ChannelPage, WithdrawPage, TransactionsPage, NotificationsPage, SettingsPage } from "@/components/dashboard/channel-wallet";
import { AdminShell } from "@/components/admin/shell";
import { AdminDashboard } from "@/components/admin/overview";
import { AdminCreatorsPage, AdminVideosPage, AdminDuplicatesPage } from "@/components/admin/creators-videos";
import { AdminWithdrawalsPage, AdminEarningsPage, AdminFraudPage } from "@/components/admin/finance";
import {
  AdminMonetizationPage, AdminUploadRulesPage, AdminCategoriesPage,
  AdminHomepagePage, AdminNotificationsPage, AdminReportsPage,
  AdminUsersPage, AdminPlatformPage,
} from "@/components/admin/settings-pages";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function Routes() {
  const route = useRoute();
  useScrollReset(route.path);
  const [first, second] = route.segments;

  // ── Immersive video feed (own chrome) ──
  if (first === "feed") return <VideoFeed />;

  // ── Auth pages (own chrome) ──
  if (first === "login") return <LoginPage />;
  if (first === "register") return <RegisterPage />;
  if (first === "forgot-password") return <ForgotPasswordPage />;

  // ── Creator dashboard ──
  if (first === "dashboard") {
    const page =
      !second ? <OverviewPage /> :
      second === "channel" ? <ChannelPage /> :
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
  else if (first === "policies" && second) page = <PolicyPage slug={second} />;
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

export function App() {
  useEffect(() => {
    // SEO: dynamic title per hash route
    const titles: Record<string, string> = {
      "": "Kuchu Puchu — Create Videos. Get Views. Earn Real Money.",
      about: "About Us — Kuchu Puchu",
      contact: "Contact Us — Kuchu Puchu",
      explore: "Explore Videos — Kuchu Puchu",
      trending: "Trending Videos — Kuchu Puchu",
      register: "Become a Creator — Kuchu Puchu",
      login: "Log In — Kuchu Puchu",
      feed: "Video Feed — Kuchu Puchu",
      dashboard: "Creator Dashboard — Kuchu Puchu",
      admin: "Admin Console — Kuchu Puchu",
    };
    const apply = () => {
      const seg = (window.location.hash.replace(/^#\/?/, "").split("/")[0]) ?? "";
      document.title = titles[seg] ?? (seg === "policies" ? "Policies — Kuchu Puchu" : seg === "c" ? "Creator — Kuchu Puchu" : titles[""]);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </QueryClientProvider>
  );
}
