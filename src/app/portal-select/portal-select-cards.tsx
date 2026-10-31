"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Heart,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalSelectCardsProps {
  currentRole?: string | null;
  activeBookingRequestId?: string | null;
  activeWeddingId?: string | null;
}

export function PortalSelectCards({
  currentRole,
  activeBookingRequestId,
  activeWeddingId,
}: PortalSelectCardsProps) {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleSelectRole = async (targetRole: "CLIENT" | "PLANNER", destination: string) => {
    setLoadingRole(targetRole);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gathbandhan_role", targetRole);
        localStorage.setItem("gathbandhan_role", targetRole);
        document.cookie = `gathbandhan_role=${targetRole}; path=/; max-age=2592000; SameSite=Lax`;
      }
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      router.push(destination);
    } catch {
      router.push(destination);
    } finally {
      setLoadingRole(null);
    }
  };

  const clientDestination = activeBookingRequestId || activeWeddingId
    ? "/client/portal"
    : "/plan-your-wedding";

  return (
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
            Event Organizer Portal
          </h2>
          <p className="text-xs text-charcoal-500 mb-6 leading-relaxed">
            For wedding planners, operational directors, coordinators, and agency team members.
          </p>

          <ul className="space-y-3 mb-8 text-xs text-charcoal-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Booking Requests:</strong> Live review of client consultation forms</span>
            </li>
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
              <span><strong>AI Quotation Analyzer:</strong> PDF extraction & vendor comparisons</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Finance & Ledger:</strong> Invoices, milestones, exact paise arithmetic</span>
            </li>
          </ul>
        </div>

        <Button
          size="lg"
          disabled={loadingRole !== null}
          onClick={() => handleSelectRole("PLANNER", "/dashboard")}
          className="w-full bg-charcoal text-ivory hover:bg-charcoal-700 h-12 font-semibold group-hover:bg-gold group-hover:text-maroon-deep transition-all"
        >
          {loadingRole === "PLANNER" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <>
              Enter Organizer Workspace
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* OPTION 2: Client / Event Host */}
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
            Client Wedding Portal
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
              <span><strong>Dedicated Client Portal:</strong> Track review status & updates</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span><strong>Live Cost Estimator:</strong> Itemised budget & transparent pricing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span><strong>Two-Way Communication:</strong> Message your assigned designer</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
              <span><strong>Agreements & RSVPs:</strong> Digital signing & guest tracker</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button
            size="lg"
            disabled={loadingRole !== null}
            onClick={() => handleSelectRole("CLIENT", clientDestination)}
            className="w-full bg-maroon hover:bg-maroon-deep text-soft-white h-12 font-semibold shadow-md"
          >
            {loadingRole === "CLIENT" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-gold-light" />
                {activeBookingRequestId || activeWeddingId
                  ? "Open My Wedding Portal"
                  : "Start Wedding Consultation"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => handleSelectRole("CLIENT", "/client")}
            className="w-full text-center text-xs text-warm-gray hover:text-maroon font-medium py-1"
          >
            Explore Client Landing Page →
          </button>
        </div>
      </div>
    </div>
  );
}

