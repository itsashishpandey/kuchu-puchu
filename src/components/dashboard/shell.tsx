"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Logo, StatusBadge } from "@/components/shared/ui-bits";
import { navigate, useRoute, Link } from "@/components/app/router";
import { useAuth } from "@/components/app/auth-provider";
import { get } from "@/lib/client";
import { compact } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

const MENU = [
  { to: "/dashboard", label: "Overview", icon: Icons.LayoutDashboard, exact: true },
  { to: "/dashboard/channel", label: "My Channel", icon: Icons.AtSign },
  { to: "/dashboard/upload", label: "Upload Video", icon: Icons.UploadCloud },
  { to: "/dashboard/videos", label: "My Videos", icon: Icons.Video },
  { to: "/dashboard/analytics", label: "Video Analytics", icon: Icons.BarChart3 },
  { to: "/dashboard/earnings", label: "My Earnings", icon: Icons.DollarSign },
  { to: "/dashboard/withdraw", label: "Withdraw Money", icon: Icons.Banknote },
  { to: "/dashboard/transactions", label: "Transaction History", icon: Icons.ReceiptText },
  { to: "/dashboard/notifications", label: "Notifications", icon: Icons.Bell },
  { to: "/dashboard/settings", label: "Account Settings", icon: Icons.Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const route = useRoute();
  const [unread, setUnread] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (user?.role === "CREATOR") {
      get<{ unread: number }>("/creator/notifications").then(d => setUnread(d.unread)).catch(() => {});
    }
  }, [user, route.path]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Icons.Loader2 size={30} className="animate-spin text-brand-red" />
      </div>
    );
  }

  if (!user || user.role !== "CREATOR") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
        <Icons.Lock size={36} className="text-brand-red" />
        <h1 className="font-display text-2xl font-bold">Creator access required</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {user ? "This area is for creator accounts." : "Log in with your creator account to view your dashboard."}
        </p>
        <div className="flex gap-2">
          <Button className="grad-btn rounded-full text-white" onClick={() => navigate(user ? "/" : "/login")}>
            {user ? "Back to home" : "Log in"}
          </Button>
          {!user && (
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/register")}>Become a Creator</Button>
          )}
        </div>
      </div>
    );
  }

  // ── status gates ──
  if (user.status === "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="bento max-w-lg p-8 text-center md:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Icons.Hourglass size={30} className="text-amber-500" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">Your application is in review</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Thanks for applying{user.channel ? `, ${user.name}` : ""}! Our team is reviewing
            <strong className="text-ink"> {user.channel?.name}</strong> for originality and completeness.
            You'll get an in-app notification and an email the moment your status changes — usually within 2 business days.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <StatusBadge status="PENDING" /> <span className="text-muted-foreground">Application submitted</span>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/explore")}>Explore videos meanwhile</Button>
            <Button variant="ghost" className="rounded-full text-brand-red" onClick={() => logout().then(() => navigate("/"))}>Log out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "REJECTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="bento max-w-lg p-8 text-center md:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <Icons.XCircle size={30} className="text-rose-500" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">Application not approved</h1>
          <div className="mt-4 rounded-xl bg-rose-50 p-4 text-left text-sm text-rose-800 ring-1 ring-rose-200">
            <p className="mb-1 flex items-center gap-1.5 font-bold"><Icons.MessageSquareWarning size={15} /> Reason from our review team:</p>
            <p>{user.rejectionReason}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You can update your channel details and re-apply. Contact <span className="font-semibold text-ink">support@kuchupuchu.com</span> if you believe this was a mistake.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button className="grad-btn rounded-full text-white" onClick={() => navigate("/contact")}>Contact support</Button>
            <Button variant="ghost" className="rounded-full text-brand-red" onClick={() => logout().then(() => navigate("/"))}>Log out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "SUSPENDED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="bento max-w-lg p-8 text-center md:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <Icons.ShieldAlert size={30} className="text-rose-500" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">Account suspended</h1>
          <div className="mt-4 rounded-xl bg-rose-50 p-4 text-left text-sm text-rose-800 ring-1 ring-rose-200">
            <p className="mb-1 font-bold">Reason:</p>
            <p>{user.suspensionReason}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Your videos remain public but uploads and earnings are paused. Contact support to appeal.</p>
          <Button className="grad-btn mt-6 rounded-full text-white" onClick={() => navigate("/contact")}>Appeal via support</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 lg:hidden" onClick={() => setMobileNavOpen(v => !v)} aria-label="Toggle navigation">
              {mobileNavOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
            </button>
            <Link to="/" aria-label="Home"><Logo size={32} /></Link>
            <span className="hidden rounded-full bg-brand-red-soft px-3 py-1 text-xs font-bold text-brand-red sm:inline">Creator Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative rounded-full"
              onClick={() => navigate("/dashboard/notifications")} aria-label="Notifications">
              <Icons.Bell size={19} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Button>
            {user.channel && (
              <button
                onClick={() => navigate(`/c/${user.channel!.username}`)}
                className="hidden items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 text-sm font-semibold shadow-sm hover:shadow sm:flex"
              >
                <Avatar src={user.avatarUrl ?? user.channel.avatarUrl} name={user.name} size={28} />
                <span className="max-w-32 truncate">{user.channel.name}</span>
              </button>
            )}
            <Button size="sm" className="grad-btn hidden rounded-full text-white md:inline-flex" onClick={() => navigate("/dashboard/upload")}>
              <Icons.UploadCloud size={15} className="mr-1" /> Upload
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full"
              onClick={async () => {
                await get("/creator/wallet")
                  .then(d => toast({ title: "Wallet", description: `Available: $${(d as { wallet: { availableBalance: number } }).wallet.availableBalance.toFixed(2)}` }))
                  .catch(() => {});
                navigate("/dashboard/withdraw");
              }}>
              <Icons.Wallet size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 md:px-6">
        {/* sidebar */}
        <aside className={`${mobileNavOpen ? "fixed inset-x-4 top-20 z-50 shadow-2xl" : "hidden"} lg:sticky lg:top-22 lg:block lg:h-fit lg:w-60 lg:shrink-0 lg:shadow-none`} aria-label="Dashboard navigation">
          <nav className="bento space-y-1 p-3">
            {MENU.map(m => {
              const active = m.exact ? route.path === m.to : route.path.startsWith(m.to);
              return (
                <button
                  key={m.to}
                  onClick={() => { navigate(m.to); setMobileNavOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    active ? "grad-btn text-white shadow" : "text-muted-foreground hover:bg-secondary hover:text-ink"
                  }`}
                >
                  <m.icon size={17} />
                  <span className="flex-1 text-left">{m.label}</span>
                  {m.label === "Notifications" && unread > 0 && (
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${active ? "bg-white/25 text-white" : "bg-brand-red text-white"}`}>
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="my-2 border-t" />
            <button
              onClick={() => logout().then(() => navigate("/"))}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Icons.LogOut size={17} /> Log out
            </button>
          </nav>
          {user.channel && (
            <div className="bento mt-3 hidden p-4 lg:block">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your channel</p>
              <div className="mt-2 flex items-center gap-2.5">
                <Avatar src={user.channel.avatarUrl} name={user.channel.name} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.channel.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{compact(user.channel.followerCount)} followers</p>
                </div>
              </div>
              <button onClick={() => navigate(`/c/${user.channel!.username}`)} className="mt-3 w-full rounded-lg border py-2 text-xs font-bold hover:bg-secondary">
                View public channel
              </button>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}

export function DashboardPageHeader({
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
