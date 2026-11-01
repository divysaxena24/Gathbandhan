"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Heart,
  CheckSquare,
  Building2,
  Radio,
  IndianRupee,
  UserCheck,
  BarChart3,
  Settings,
  Crown,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  ShieldAlert,
  Lock,
  LogOut,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationsDrawer } from "@/components/shared/notifications-drawer";
import { isAuthorizedAdminEmail, PRIMARY_ADMIN_EMAIL } from "@/lib/auth/admin-whitelist";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Booking Requests", href: "/booking-requests", icon: Sparkles, badge: "Requests" },
  { title: "Weddings", href: "/weddings", icon: Heart },
  { title: "Planning & Tasks", href: "/planning", icon: CheckSquare },
  { title: "Vendors", href: "/vendors", icon: Building2 },
  { title: "AI Quotation Analyzer", href: "/quotation-analyzer", icon: Sparkles, badge: "AI" },
  { title: "Event Control Room", href: "/control-room", icon: Radio, badge: "Live" },
  { title: "Finance", href: "/finance", icon: IndianRupee },
  { title: "Guests & Logistics", href: "/guests", icon: UserCheck },
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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAuthorizedAdmin = isAuthorizedAdminEmail(userEmail);

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;

    // Strict security check: If signed in with an unauthorized email, prevent admin navigation
    if (user && !isAuthorizedAdminEmail(userEmail)) {
      return;
    }

    const cachedRole = sessionStorage.getItem("gathbandhan_role");
    
    // If the authorized admin explicitly chose PLANNER or FOUNDER_ADMIN, keep them in organizer workspace
    if (isAuthorizedAdmin && (cachedRole === "PLANNER" || cachedRole === "FOUNDER_ADMIN")) {
      return;
    }

    if (cachedRole === "CLIENT") {
      router.replace("/client/portal");
      return;
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.isAdmin && data.role === "CLIENT") {
          router.replace("/client/portal");
          return;
        }
        const activeRole = sessionStorage.getItem("gathbandhan_role") || data.role;
        if (data.role && !sessionStorage.getItem("gathbandhan_role")) {
          sessionStorage.setItem("gathbandhan_role", data.role);
        }
        if (activeRole === "CLIENT") {
          router.replace("/client/portal");
        }
      })
      .catch(() => {});
  }, [router, isLoaded, user, userEmail, isAuthorizedAdmin]);

  // Loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-xs text-charcoal-500 font-sans tracking-wide">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  // ACCESS DENIED WARNING: Non-whitelisted accounts attempting to enter the admin panel
  if (user && !isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col justify-between selection:bg-gold/20 p-6">
        <header className="max-w-5xl mx-auto w-full py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30">
              <Crown className="w-4 h-4 text-gold-600" />
            </div>
            <span className="font-heading font-bold text-xl text-maroon-deep">
              Gathbandhan
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="text-xs text-charcoal-600 hover:text-maroon"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        </header>

        <main className="max-w-md w-full mx-auto my-auto bg-white rounded-3xl p-8 sm:p-10 border-2 border-amber-300 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3 text-amber-700" />
              Admin Access Restricted
            </div>
            <h1 className="font-heading text-2xl font-bold text-charcoal">
              Administrator Access Denied
            </h1>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              You are signed in as <strong className="text-charcoal font-semibold">{userEmail}</strong>.
              <br />
              This account does not have administrator privileges.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span> Authorized Admin Required
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Only the organizer account (<span className="font-mono font-medium underline">{PRIMARY_ADMIN_EMAIL}</span>) is authorized to access the Gathbandhan Operations Admin Panel.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              asChild
              className="w-full bg-maroon hover:bg-maroon-deep text-white h-11 text-xs font-semibold shadow-md"
            >
              <Link href="/client/portal">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-gold-light" />
                Go to Client Wedding Portal
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full border-gold/40 hover:bg-gold/10 text-charcoal h-11 text-xs font-semibold"
            >
              <Link href="/plan-your-wedding">
                <Heart className="w-3.5 h-3.5 mr-2 text-rose-600" />
                Plan Your Dream Wedding
              </Link>
            </Button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                className="text-xs text-charcoal-500 hover:text-maroon underline transition-colors"
              >
                Sign in with an authorized admin account
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-charcoal-400 py-4">
          © 2026 Gathbandhan
        </footer>
      </div>
    );
  }

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
            <span className="font-display font-bold text-base text-ivory tracking-wide block leading-tight">
              Gathbandhan
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-widest text-charcoal-300 px-3 py-2">
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
                    ? "bg-gold/20 text-gold border border-gold/40 shadow-sm"
                    : "text-charcoal-200 hover:bg-charcoal-700 hover:text-ivory"
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
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      isActive
                        ? "bg-gold text-charcoal font-bold"
                        : "bg-charcoal-600 text-charcoal-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Portal Switcher & User Profile */}
        <div className="p-4 border-t border-charcoal-700/60 bg-charcoal/50 space-y-3">
          {/* Quick Switcher back to Client Portal */}
          <Link
            href="/portal-select"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-charcoal-700/60 hover:bg-gold/20 text-xs font-medium text-gold hover:text-gold border border-gold/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Switch Portal</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-charcoal-400">
              Client / Admin
            </span>
          </Link>

          <div className="flex items-center gap-3 pt-1">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-gold/40",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ivory truncate">
                {user?.fullName || "Event Planner"}
              </p>
              <p className="text-[10px] text-charcoal-300 truncate">
                {user?.primaryEmailAddress?.emailAddress || "organizer@gathbandhan.com"}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="System Operational" />
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
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
          {/* Tagline parallely opposite the notifications bell icon */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-serif italic text-maroon-deep bg-gradient-to-r from-gold/15 via-gold/10 to-gold/5 px-4 py-1.5 rounded-full border border-gold/30 shadow-xs">
            <span className="text-gold font-bold text-xs">✦</span>
            <span className="tracking-wide select-none">हर पल को इतना खूबसूरत बनाओ कि वो याद बन जाए।</span>
            <span className="text-gold font-bold text-xs">✦</span>
          </div>

          <div className="flex items-center gap-4">
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
