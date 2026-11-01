"use client";

import React from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  ShieldAlert,
  Crown,
  Heart,
  ArrowRight,
  LogOut,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_ADMIN_EMAIL } from "@/lib/auth/admin-whitelist";

export default function AdminAccessDeniedPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const userEmail = user?.primaryEmailAddress?.emailAddress || "your account";

  return (
    <main className="min-h-screen bg-ivory flex flex-col justify-between selection:bg-gold/20">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-maroon/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30 group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-gold-600" />
          </div>
          <span className="font-heading font-bold text-2xl text-maroon-deep tracking-tight">
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

      {/* Main Warning Card */}
      <section className="relative z-10 max-w-xl mx-auto w-full px-6 py-8 flex-1 flex flex-col justify-center items-center">
        <div className="w-full bg-white rounded-3xl p-8 sm:p-10 border-2 border-amber-300 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-[11px] font-bold uppercase tracking-wider text-amber-800">
              <Lock className="w-3 h-3" />
              Restricted Area
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal">
              Administrator Access Required
            </h1>
            <p className="text-sm text-charcoal-600 leading-relaxed pt-1">
              You are signed in as{" "}
              <strong className="text-charcoal font-semibold">{userEmail}</strong>.
              This account does not have administrator privileges.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 text-left space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span> Access Restricted to Authorized Organizers
            </p>
            <p className="text-amber-800/90 leading-relaxed">
              Only the authorized organizer account (
              <span className="font-mono font-medium underline">
                {PRIMARY_ADMIN_EMAIL}
              </span>
              ) is permitted to access the internal Agency Workspace, financials, and vendor controls.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full bg-maroon hover:bg-maroon-deep text-white h-12 font-semibold shadow-md"
            >
              <Link href="/client/portal">
                <Sparkles className="w-4 h-4 mr-2 text-gold-light" />
                Go to Client Wedding Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-gold/40 hover:bg-gold/10 text-charcoal h-11 text-xs font-semibold"
            >
              <Link href="/plan-your-wedding">
                <Heart className="w-3.5 h-3.5 mr-2 text-rose-600" />
                Plan Your Dream Wedding (14-Step Wizard)
              </Link>
            </Button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                className="text-xs text-charcoal-500 hover:text-maroon underline transition-colors"
              >
                Sign in with an authorized administrator account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-charcoal-400">
        © 2026–2027 Gathbandhan Luxury Wedding Operations OS. All rights reserved.
      </footer>
    </main>
  );
}
