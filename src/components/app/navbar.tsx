"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, Avatar } from "@/components/shared/ui-bits";
import { Link, navigate } from "@/components/app/router";
import { useAuth } from "@/components/app/auth-provider";
import { get } from "@/lib/client";

const NAV = [
  { to: "/explore", label: "Explore" },
  { to: "/trending", label: "Trending" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifs, setNotifs] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (user?.role === "CREATOR") {
      get<{ unread: number }>("/creator/notifications")
        .then(d => setNotifs(d.unread))
        .catch(() => {});
    }
  }, [user]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-[0_4px_24px_-12px_rgba(21,25,35,0.15)]" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6" aria-label="Main">
        <Link to="/" aria-label="Kuchu Puchu home"><Logo /></Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink/80 transition-colors hover:bg-white/70 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/policies/monetization"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink/80 transition-colors hover:bg-white/70 hover:text-ink"
          >
            Monetization
          </Link>
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          {user ? (
            <>
              {user.role === "CREATOR" && (
                <Button
                  variant="ghost" size="sm"
                  className="relative rounded-full"
                  onClick={() => navigate("/dashboard/notifications")}
                  aria-label="Notifications"
                >
                  <Icons.Bell size={19} />
                  {notifs > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                      {notifs}
                    </span>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border bg-white/80 py-1 pl-1 pr-3 shadow-sm transition hover:shadow" aria-label="Account menu">
                    <Avatar src={user.avatarUrl ?? user.channel?.avatarUrl} name={user.name} size={30} />
                    <span className="max-w-28 truncate text-sm font-semibold">{user.channel?.name ?? user.name}</span>
                    <Icons.ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  {user.role === "CREATOR" ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2">
                        <Icons.LayoutDashboard size={15} /> Creator dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/c/${user.channel?.username}`)} className="gap-2">
                        <Icons.AtSign size={15} /> My public channel
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2">
                      <Icons.ShieldCheck size={15} /> Admin dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout().then(() => navigate("/"))} className="gap-2 text-brand-red">
                    <Icons.LogOut size={15} /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full font-semibold" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button
                className="grad-btn rounded-full px-5 text-white shadow-[0_6px_20px_-6px_rgba(255,23,68,0.5)]"
                onClick={() => navigate("/register")}
              >
                Become a Creator
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 lg:hidden"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu" aria-expanded={mobileOpen}
        >
          {mobileOpen ? <Icons.X size={22} /> : <Icons.Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="glass border-t border-white/60 px-4 pb-5 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map(item => (
              <Link
                key={item.to} to={item.to}
                className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/policies/monetization" className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white" onClick={() => setMobileOpen(false)}>
              Monetization
            </Link>
            <div className="mt-3 flex gap-2">
              {user ? (
                <>
                  <Button className="flex-1 rounded-full" onClick={() => { setMobileOpen(false); navigate(user.role === "CREATOR" ? "/dashboard" : "/admin"); }}>
                    Dashboard
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => { logout(); setMobileOpen(false); navigate("/"); }}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setMobileOpen(false); navigate("/login"); }}>
                    Log in
                  </Button>
                  <Button className="grad-btn flex-1 rounded-full text-white" onClick={() => { setMobileOpen(false); navigate("/register"); }}>
                    Become a Creator
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
