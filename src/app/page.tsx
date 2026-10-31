import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Crown, Shield, HeartHandshake, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-ivory-50 flex flex-col justify-between">
      {/* Navigation header */}
      <header className="border-b border-border/40 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30">
              <Crown className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-charcoal tracking-wide">
                Gathbandhan
              </span>
              <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-gold/10 text-gold-600 border border-gold/20">
                OS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-charcoal hover:bg-gold/10">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-xs font-medium text-gold-700 mb-6">
          <Crown className="w-3.5 h-3.5 text-gold" />
          Intelligent Luxury Wedding Operations Platform
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-charcoal tracking-tight max-w-3xl leading-tight">
          Operational Mastery for Extraordinary Celebrations
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-charcoal-400 max-w-2xl leading-relaxed">
          From first enquiry to final vendor settlement in Jaipur & Udaipur. Replace scattered WhatsApps and spreadsheets with a single, calm, resilient operating system.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg" className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-2 h-12 px-6">
              Launch Workspace
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="border-charcoal/20 text-charcoal h-12 px-6 hover:bg-gold/5">
              Request Agency Access
            </Button>
          </Link>
        </div>

        {/* Pillars */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-xl border border-border/80 bg-white/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center mb-4 text-gold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">
              Smart Vendor Intelligence
            </h3>
            <p className="mt-2 text-sm text-charcoal-400 leading-relaxed">
              Automated quote extraction, landed-cost sensitivity, inclusion gap detection, and deterministic multi-criteria scoring.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/80 bg-white/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center mb-4 text-gold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">
              Wedding Day Control Room
            </h3>
            <p className="mt-2 text-sm text-charcoal-400 leading-relaxed">
              Live minute-by-minute timeline, friction-free QR vendor check-ins, automated grace period late alerts, and cascade impact graphs.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border/80 bg-white/80 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center mb-4 text-gold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-charcoal text-base">
              Financial Integrity Engine
            </h3>
            <p className="mt-2 text-sm text-charcoal-400 leading-relaxed">
              Exact paise arithmetic, duplicate payment prevention, milestone ledger reconciliation, and append-only financial audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-charcoal-400">
        <p>© 2026 Gathbandhan OS — Jaipur & Udaipur, Rajasthan. Built for luxury wedding planners.</p>
      </footer>
    </main>
  );
}

