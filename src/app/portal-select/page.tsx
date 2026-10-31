import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Crown, Sparkles, Building2, Heart, ArrowRight, Compass, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PortalSelectPage() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "Distinguished Guest";

  return (
    <main className="min-h-screen bg-ivory flex flex-col justify-between selection:bg-gold/20">
      {/* Header */}
      <header className="border-b border-gold/15 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30 shadow-xs">
              <Crown className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-maroon-deep tracking-wide">
                Gathbandhan
              </span>
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/10 text-gold-600 border border-gold/20 uppercase">
                Unified Portals
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-charcoal-500 hidden sm:inline">Signed in as <strong className="text-charcoal-800">{displayName}</strong></span>
            <Link href="/" className="text-gold-600 hover:text-maroon font-medium transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Role Selection Content */}
      <section className="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-semibold text-gold-700 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Two-Way Wedding Operating Platform
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-maroon-deep tracking-tight mb-4">
            Select Your Portal
          </h1>
          <p className="text-warm-gray text-sm sm:text-base leading-relaxed">
            Welcome to Gathbandhan. Connect seamlessly between operational agency management and client wedding consultation. Choose how you want to proceed:
          </p>
        </div>

        {/* 2 Big Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* OPTION 1: Admin / Event Organizer */}
          <div className="group relative rounded-3xl p-8 bg-white border-2 border-border/70 hover:border-gold/60 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between">
            <div className="absolute top-5 right-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-charcoal text-white">
                Admin / Organizer
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-charcoal/5 flex items-center justify-center text-charcoal mb-6 border border-charcoal/10 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                <Building2 className="w-7 h-7" />
              </div>

              <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">
                Event Organizer OS
              </h2>
              <p className="text-xs text-charcoal-500 mb-6 leading-relaxed">
                For wedding planners, operational directors, coordinators, and agency team members.
              </p>

              <ul className="space-y-3 mb-8 text-xs text-charcoal-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Live Control Room:</strong> Minute-by-minute timeline & QR check-ins</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Leads CRM:</strong> Inbound client proposals & pipeline tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>AI Quotation Analyzer:</strong> PDF extraction & landed-cost audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Finance & Ledger:</strong> Invoices, milestones, exact paise arithmetic</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Founder Analytics:</strong> Season reviews, KPI cards & team workload</span>
                </li>
              </ul>
            </div>

            <Link href="/dashboard" className="w-full">
              <Button size="lg" className="w-full bg-charcoal text-ivory hover:bg-charcoal-700 h-12 font-semibold group-hover:bg-gold group-hover:text-maroon-deep transition-all">
                Enter Organizer Workspace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* OPTION 2: Client / Event Conduct */}
          <div className="group relative rounded-3xl p-8 bg-gradient-to-b from-white via-soft-white to-ivory border-2 border-gold/40 hover:border-gold transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between">
            <div className="absolute top-5 right-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold text-maroon-deep">
                Client / Host
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center text-gold-600 mb-6 border border-gold/30 group-hover:scale-105 transition-transform">
                <Heart className="w-7 h-7 text-maroon fill-rose/20" />
              </div>

              <h2 className="font-heading text-2xl font-bold text-maroon-deep mb-2">
                Plan Your Wedding
              </h2>
              <p className="text-xs text-warm-gray mb-6 leading-relaxed">
                For couples, brides, grooms, and host families planning their celebration.
              </p>

              <ul className="space-y-3 mb-8 text-xs text-charcoal-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span><strong>14-Step Planning Wizard:</strong> Sacred ceremonies & traditions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span><strong>Cultural Traditions:</strong> Hindu, Muslim, Sikh, Christian, Jain</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span><strong>Live Cost Estimator:</strong> Itemised budget & transparent pricing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span><strong>AI Wedding Concierge:</strong> Instant answers on rituals & themes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span><strong>Instant CRM Sync:</strong> Submissions directly alert the organizers</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link href="/plan-your-wedding" className="w-full block">
                <Button size="lg" className="w-full bg-maroon hover:bg-maroon-deep text-soft-white h-12 font-semibold shadow-md">
                  <Sparkles className="w-4 h-4 mr-2 text-gold-light" />
                  Start Wedding Consultation Wizard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/client" className="w-full block text-center text-xs text-warm-gray hover:text-maroon font-medium py-1">
                Explore Client Landing Page →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/15 py-6 text-center text-xs text-warm-gray">
        <p>© 2026 Gathbandhan — The Operating System & Client Platform for Luxury Weddings.</p>
      </footer>
    </main>
  );
}

