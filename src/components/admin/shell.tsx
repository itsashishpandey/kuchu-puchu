"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, Avatar } from "@/components/shared/ui-bits";
import { navigate, useRoute } from "@/components/app/router";
import { useAuth } from "@/components/app/auth-provider";
import { get } from "@/lib/client";
import { toast } from "@/hooks/use-toast";

type AdminMenuItem = {
  to: string; label: string; icon: React.ComponentType<{ size?: number }>;
  exact?: boolean; role?: string;
  /** menu section heading; items of a group are listed together */
  group?: string;
  /** admin roles that may see the item (when set, overrides `role`) */
  roles?: string[];
};

const DISCOVERY_GROUP = "Content Discovery & Personalization";
const MOD_ROLES = ["SUPER_ADMIN", "MODERATOR"];
const ANALYTICS_ROLES = ["SUPER_ADMIN", "MODERATOR", "FINANCE"];

export const ADMIN_MENU: AdminMenuItem[] = [
  { to: "/admin", label: "Dashboard", icon: Icons.LayoutDashboard, exact: true, role: "*" },
  { to: "/admin/creators", label: "Creator Management", icon: Icons.Users },
  { to: "/admin/videos", label: "Video Management", icon: Icons.Video },
  { to: "/admin/duplicates", label: "Duplicate Detection", icon: Icons.CopyX },
  { to: "/admin/safety", label: "Reports & Comments", icon: Icons.Flag },
  { to: "/admin/app-users", label: "App Users", icon: Icons.Smartphone },
  { to: "/admin/monetization", label: "Monetization Settings", icon: Icons.BadgeDollarSign, role: "SUPER_ADMIN" },
  { to: "/admin/upload-rules", label: "Upload Rules", icon: Icons.UploadCloud, role: "SUPER_ADMIN" },
  { to: "/admin/earnings", label: "Earnings Management", icon: Icons.Landmark },
  { to: "/admin/withdrawals", label: "Withdrawal Requests", icon: Icons.Banknote },
  { to: "/admin/fraud", label: "Fraud Monitoring", icon: Icons.ShieldAlert },
  { to: "/admin/homepage", label: "Homepage Management", icon: Icons.LayoutTemplate },
  { to: "/admin/notifications", label: "Notifications", icon: Icons.Bell },
  { to: "/admin/reports", label: "Reports & Analytics", icon: Icons.FileBarChart },
  { to: "/admin/users", label: "Admin Users & Roles", icon: Icons.UserCog, role: "SUPER_ADMIN" },
  { to: "/admin/platform", label: "Platform Settings", icon: Icons.Settings, role: "SUPER_ADMIN" },
  { to: "/admin/discovery/languages", label: "Languages", icon: Icons.Languages, group: DISCOVERY_GROUP, roles: MOD_ROLES },
  { to: "/admin/discovery/categories", label: "Main Categories", icon: Icons.LayoutGrid, group: DISCOVERY_GROUP, roles: MOD_ROLES },
  { to: "/admin/discovery/subcategories", label: "Subcategories", icon: Icons.ListTree, group: DISCOVERY_GROUP, roles: MOD_ROLES },
  { to: "/admin/discovery/tags", label: "Video Tag Review", icon: Icons.Tags, group: DISCOVERY_GROUP, roles: MOD_ROLES },
  { to: "/admin/discovery/interests", label: "User Interest Analytics", icon: Icons.HeartPulse, group: DISCOVERY_GROUP, roles: ANALYTICS_ROLES },
  { to: "/admin/discovery/recommendation", label: "Recommendation Settings", icon: Icons.SlidersHorizontal, group: DISCOVERY_GROUP, roles: ["SUPER_ADMIN"] },
  { to: "/admin/discovery/reports", label: "Content Discovery Reports", icon: Icons.FileBarChart2, group: DISCOVERY_GROUP, roles: ANALYTICS_ROLES },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const route = useRoute();
  const [pending, setPending] = useState({ creators: 0, videos: 0, withdrawals: 0, fraud: 0, reports: 0, tags: 0 });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      get<{ kpis: { pendingCreators: number; pendingVideos: number; pendingWithdrawalCount: number; openFraudFlags: number; openReports: number } }>("/admin/overview")
        .then(d => setPending(p => ({
          ...p,
          creators: d.kpis.pendingCreators, videos: d.kpis.pendingVideos,
          withdrawals: d.kpis.pendingWithdrawalCount, fraud: d.kpis.openFraudFlags,
          reports: d.kpis.openReports,
        }))).catch(() => {});
      // tag-review queue badge (discovery group)
      get<{ needsReview: number }>("/admin/discovery/summary")
        .then(d => setPending(p => ({ ...p, tags: d.needsReview }))).catch(() => {});
    }
  }, [user, route.path]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface"><Icons.Loader2 size={30} className="animate-spin text-brand-blue" /></div>;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
        <Icons.ShieldOff size={36} className="text-brand-red" />
        <h1 className="font-display text-2xl font-bold">Admin access required</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This is the Kuchu Puchu operations area. Log in with an admin account to continue.
        </p>
        <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/login")}>Go to login</Button>
      </div>
    );
  }

  const badgeFor = (to: string) =>
    to === "/admin/creators" ? pending.creators
    : to === "/admin/videos" ? pending.videos
    : to === "/admin/withdrawals" ? pending.withdrawals
    : to === "/admin/fraud" ? pending.fraud
    : to === "/admin/safety" ? pending.reports
    : to === "/admin/duplicates" ? 1
    : to === "/admin/discovery/tags" ? pending.tags
    : 0;

  const allowed = (m: AdminMenuItem) =>
    m.roles ? m.roles.includes(user.adminRole ?? "MODERATOR")
      : !m.role || m.role === "*" || user.adminRole === "SUPER_ADMIN" || user.adminRole === m.role;
  const visible = ADMIN_MENU.filter(allowed);
  // #/admin/discovery (no page) opens the first discovery page this role may see
  const firstDiscovery = visible.find(m => m.group === DISCOVERY_GROUP)?.to;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 lg:hidden" onClick={() => setMobileNavOpen(v => !v)} aria-label="Toggle navigation">
              {mobileNavOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
            </button>
            <Link_home />
            <span className="hidden rounded-full bg-brand-blue-soft px-3 py-1 text-xs font-bold text-brand-blue sm:inline">Admin Console</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground md:inline">
              {user.adminRole ?? "ADMIN"} · {user.name}
            </span>
            <Avatar src={user.avatarUrl} name={user.name} size={34} />
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => logout().then(() => navigate("/"))}>
              <Icons.LogOut size={17} />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 md:px-6">
        <aside className={`${mobileNavOpen ? "fixed inset-x-4 top-20 z-50 max-h-[80vh] overflow-y-auto shadow-2xl" : "hidden"} lg:sticky lg:top-22 lg:block lg:h-fit lg:w-64 lg:shrink-0`}>
          <nav className="bento space-y-0.5 p-3" aria-label="Admin navigation">
            {visible.map((m, i) => {
              const active = m.exact ? route.path === m.to
                : route.path.startsWith(m.to) || (route.path === "/admin/discovery" && m.to === firstDiscovery);
              const badge = badgeFor(m.to);
              const heading = m.group && m.group !== visible[i - 1]?.group ? m.group : null;
              return (
                <div key={m.to}>
                {heading && (
                  <p className="mt-3 border-t px-3.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{heading}</p>
                )}
                <button
                  onClick={() => { navigate(m.to); setMobileNavOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition ${
                    active ? "bg-ink text-white shadow" : "text-muted-foreground hover:bg-secondary hover:text-ink"
                  }`}
                >
                  <m.icon size={16} />
                  <span className="flex-1 text-left">{m.label}</span>
                  {badge > 0 && (
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      active ? "bg-brand-red text-white" : "bg-brand-red text-white"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}

function Link_home() {
  return (
    <button onClick={() => navigate("/")} aria-label="Home">
      <span className="flex items-center gap-2">
        <span className="relative inline-flex h-9 w-9">
          <img src="/brand/icon-96.png" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px]" />
          <span className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue text-white ring-2 ring-white">
            <Icons.ShieldCheck size={10} />
          </span>
        </span>
        <span className="font-display text-lg font-bold tracking-tight">Kuchu Puchu <span className="text-brand-blue">Admin</span></span>
      </span>
    </button>
  );
}

export function AdminPageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function useAdminAction() {
  return async (path: string, body: unknown, onDone: () => void, label = "Done") => {
    try {
      const res = await get_post(path, body);
      toast({ title: res.message ?? label });
      onDone();
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    }
  };
}

async function get_post(path: string, body: unknown): Promise<{ message?: string }> {
  const res = await fetch(`/api${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Action failed");
  return data;
}
