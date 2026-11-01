import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Crown, Shield, HeartHandshake, Compass, Sparkles, Building2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  try {
    const { userId } = await auth();
    if (userId) {
      redirect("/portal-select");
    }
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-ivory flex flex-col justify-between selection:bg-gold/20">
      {/* Navigation header */}
      <header className="border-b border-gold/15 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30">
              <Crown className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-maroon-deep tracking-wide">
                Gathbandhan
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/client">
              <Button variant="ghost" size="sm" className="text-charcoal hover:bg-gold/10 hidden sm:inline-flex">
                Client Showcase
              </Button>
            </Link>
            <Link href="/plan-your-wedding">
              <Button size="sm" className="bg-maroon hover:bg-maroon-deep text-soft-white gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                Plan Your Wedding
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="sm" variant="outline" className="border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-white">
                Organizer Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-xs font-semibold text-gold-700 mb-6">
          <Crown className="w-3.5 h-3.5 text-gold" />
          The Two-Way Luxury Wedding Platform
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-maroon-deep tracking-tight max-w-4xl leading-tight">
          Where Sacred Traditions Meet Operational Mastery
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-warm-gray max-w-2xl leading-relaxed">
          Gathbandhan bridges clients and wedding planners into one connected ecosystem. Couples design bespoke multi-day celebrations while agency teams manage live control rooms, landed-cost vendor audits, and milestone payments.
        </p>

        {/* Big Dual Choice Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link href="/plan-your-wedding" className="flex-1">
            <Button size="lg" className="w-full bg-maroon hover:bg-maroon-deep text-soft-white gap-2 h-14 px-6 text-base font-semibold shadow-md">
              <Sparkles className="w-5 h-5 text-gold-light" />
              I Am A Client / Couple
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
          <Link href="/sign-in" className="flex-1">
            <Button size="lg" variant="outline" className="w-full border-2 border-charcoal/30 text-charcoal bg-white hover:bg-charcoal hover:text-white gap-2 h-14 px-6 text-base font-semibold shadow-xs">
              <Building2 className="w-5 h-5 text-gold-600" />
              I Am An Event Organizer
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
        </div>

        {/* 2-Way Flow Demonstration Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full max-w-4xl">
          {/* Client Card */}
          <div className="p-8 rounded-3xl border border-gold/30 bg-gradient-to-br from-white via-soft-white to-ivory shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center text-maroon">
                <Heart className="w-6 h-6 fill-rose/20 text-maroon" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gold/10 text-gold-700">
                Client Portal
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl text-maroon-deep mb-2">
              Bespoke Wedding Discovery
            </h3>
            <p className="text-xs text-warm-gray leading-relaxed mb-4">
              Explore Hindu, Muslim, Sikh, Christian, and Interfaith traditions. Curate multi-day events, calculate transparent budgets, and request customized wedding proposals.
            </p>
            <Link href="/plan-your-wedding" className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-dark hover:text-maroon">
              Start 14-Step Wedding Wizard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Organizer Card */}
          <div className="p-8 rounded-3xl border border-border/80 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-charcoal/5 flex items-center justify-center text-charcoal">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-charcoal text-white">
                Organizer Portal
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl text-charcoal mb-2">
              Organizer Operations Control
            </h3>
            <p className="text-xs text-charcoal-400 leading-relaxed mb-4">
              Receive client consultation bookings in real time. Orchestrate the minute-by-minute timeline, perform AI vendor quotation audits, and manage guest transfers and rooms.
            </p>
            <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal-600 hover:text-charcoal-900">
              Access Operational Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border border-gold/20 bg-white shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center mb-4 text-gold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-charcoal text-base">
              Smart Vendor Intelligence
            </h3>
            <p className="mt-2 text-xs text-warm-gray leading-relaxed">
              Automated quote extraction, landed-cost sensitivity, inclusion gap detection, and deterministic multi-criteria scoring.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-gold/20 bg-white shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center mb-4 text-gold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-charcoal text-base">
              Wedding Day Control Room
            </h3>
            <p className="mt-2 text-xs text-warm-gray leading-relaxed">
              Live minute-by-minute timeline, friction-free QR vendor check-ins, automated grace period late alerts, and cascade impact graphs.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-gold/20 bg-white shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center mb-4 text-gold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-charcoal text-base">
              Financial Integrity Engine
            </h3>
            <p className="mt-2 text-xs text-warm-gray leading-relaxed">
              Exact paise arithmetic, duplicate payment prevention, milestone ledger reconciliation, and append-only financial audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/15 py-6 text-center text-xs text-warm-gray">
        <p>© 2026 Gathbandhan — Where Every Celebration Comes Together.</p>
      </footer>
    </main>
  );
}
