"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Heart,
  CheckSquare,
  Building2,
  FileText,
  Radio,
  IndianRupee,
  UserCheck,
  BarChart3,
  Settings,
  Crown,
  Menu,
  X,
  ChevronRight,
  Search,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationsDrawer } from "@/components/shared/notifications-drawer";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads & Clients", href: "/leads", icon: Users },
  { title: "Weddings", href: "/weddings", icon: Heart },
  { title: "Planning & Tasks", href: "/planning", icon: CheckSquare },
  { title: "Vendors", href: "/vendors", icon: Building2 },
  { title: "Quotations", href: "/quotations", icon: FileText },
  { title: "AI Quotation Analyzer", href: "/quotation-analyzer", icon: Sparkles, badge: "AI" },
  { title: "Event Control Room", href: "/control-room", icon: Radio, badge: "Live" },
  { title: "Finance", href: "/finance", icon: IndianRupee },
  { title: "Guests & Logistics", href: "/guests", icon: UserCheck },
  { title: "Booking Requests", href: "/booking-requests", icon: Sparkles, badge: "Requests" },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cachedRole = sessionStorage.getItem("gathbandhan_role");
    if (cachedRole === "CLIENT") {
      router.replace("/client/portal");
      return;
    }
    if (cachedRole) return;

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role) {
          sessionStorage.setItem("gathbandhan_role", data.role);
        }
        if (data.role === "CLIENT") {
          router.replace("/client/portal");
        }
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen bg-ivory-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 bg-charcoal text-ivory border-r border-charcoal-700/60 shadow-xl">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-charcoal-700/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40 group-hover:scale-105 transition-transform">
              <Crown className="w-4 h-4 text-gold" />
            </div>
            <div>
              <span className="font-display font-bold text-base text-ivory tracking-wide block leading-tight">
                Gathbandhan
              </span>
              <span className="text-[10px] uppercase font-semibold text-gold tracking-widest">
                Operations
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-charcoal-300">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold/15 text-gold border border-gold/30"
                    : "text-charcoal-200 hover:text-ivory hover:bg-charcoal-700/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-gold" : "text-charcoal-300"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-critical/20 text-status-critical border border-status-critical/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Portal Switcher */}
        <div className="p-3 border-t border-charcoal-700/60 bg-charcoal-800/30">
          <Link
            href="/portal-select"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold transition-all border border-gold/30"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Switch Portal
            </span>
            <span className="text-[10px] text-ivory/60 uppercase">Client / Admin</span>
          </Link>
        </div>

        {/* User Profile in Sidebar */}
        <div className="p-4 border-t border-charcoal-700/60 bg-charcoal-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-ivory truncate">
                  {user?.fullName || "Agency Staff"}
                </p>
                <p className="text-[10px] text-charcoal-300 truncate">
                  {user?.primaryEmailAddress?.emailAddress || "Verified"}
                </p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-status-success ring-4 ring-status-success/20" />
          </div>
        </div>
      </aside>

      {/* Mobile Header and Drawer */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-charcoal text-ivory border-b border-charcoal-700/60 h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40">
            <Crown className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="font-display font-bold text-sm text-ivory">
            Gathbandhan
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <UserButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-ivory hover:bg-charcoal-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-charcoal/95 backdrop-blur-md pt-16 px-4 pb-6 flex flex-col justify-between">
          <div className="space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium",
                    isActive
                      ? "bg-gold/20 text-gold"
                      : "text-charcoal-200 hover:text-ivory"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Operational Status Bar */}
        <header className="hidden lg:flex h-16 bg-white/70 backdrop-blur-md border-b border-border/60 sticky top-0 z-30 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search weddings, leads, vendors (Ctrl+K)..."
                className="pl-9 pr-4 py-1.5 text-xs rounded-full border border-border/80 bg-background/50 focus:outline-none focus:ring-1 focus:ring-gold w-72"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span>Jaipur & Udaipur Season 2026-27</span>
            </div>

            <NotificationsDrawer />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 sm:p-8 pt-20 lg:pt-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


