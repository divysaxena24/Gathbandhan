"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Crown,
  Users,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  ArrowLeft,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function GatePassContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "GB-PASS-4PAX-DEMO";
  const couple = searchParams.get("couple") || "Kira";
  const guest = searchParams.get("guest") || "Honoured Guest & Family";
  const pax = parseInt(searchParams.get("pax") || "4", 10);
  const venue = searchParams.get("venue") || "Heritage Palace Resort, Udaipur";

  const [admitted, setAdmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-charcoal py-10 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl border-2 border-gold/40 shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease]">
        {/* Top Royal Banner */}
        <div className="bg-gradient-to-r from-maroon-deep via-maroon to-maroon-deep text-soft-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-gold/20 rounded-full blur-xl" />
          <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center mx-auto mb-2">
            <Crown className="w-6 h-6 text-gold" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gold-light">
            Palace Gate Security Clearance
          </span>
          <h1 className="font-heading text-xl font-bold text-ivory mt-0.5">
            The Royal Wedding of {couple}
          </h1>
        </div>

        {/* Verification Status Card */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>OFFICIALLY VERIFIED PASS</span>
            </div>
            <div className="font-heading text-3xl font-extrabold text-emerald-900 pt-2">
              {pax} {pax === 1 ? "Guest" : "People"} Admitted
            </div>
            <p className="text-xs text-emerald-700">
              Authorized for palace entry across all selected ceremonies
            </p>
          </div>

          {/* Details Breakdown */}
          <div className="space-y-3 text-xs divide-y divide-gold/15">
            <div className="pt-2 flex justify-between items-center">
              <span className="text-warm-gray font-medium">Guest / Family:</span>
              <strong className="text-charcoal text-sm">{guest}</strong>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-warm-gray font-medium">Clearance Pass ID:</span>
              <span className="font-mono font-bold text-maroon bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                {token}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-start">
              <span className="text-warm-gray font-medium">Venue:</span>
              <div className="text-right font-medium text-charcoal">
                <MapPin className="w-3.5 h-3.5 text-gold inline mr-1" />
                {venue}
              </div>
            </div>

            <div className="pt-2 space-y-1.5">
              <span className="text-warm-gray font-medium block">Ceremony Access Authorized:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-xl bg-cream border border-gold/20 font-bold text-maroon">
                  Sangeet
                  <span className="block text-xs font-extrabold text-charcoal mt-0.5">{pax} pax</span>
                </div>
                <div className="p-2 rounded-xl bg-cream border border-gold/20 font-bold text-maroon">
                  Mehndi
                  <span className="block text-xs font-extrabold text-charcoal mt-0.5">{pax} pax</span>
                </div>
                <div className="p-2 rounded-xl bg-cream border border-gold/20 font-bold text-maroon">
                  Wedding
                  <span className="block text-xs font-extrabold text-charcoal mt-0.5">{pax} pax</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gatekeeper Action */}
          <div className="pt-2">
            {admitted ? (
              <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-400 text-center text-xs font-bold text-emerald-900 animate-[fadeIn_0.2s_ease]">
                ✓ Party of {pax} Admitted through Palace Main Gate
              </div>
            ) : (
              <Button
                onClick={() => setAdmitted(true)}
                className="w-full bg-maroon hover:bg-maroon-deep text-white font-bold h-12 rounded-xl shadow-md"
              >
                <ShieldCheck className="w-4 h-4 mr-2 text-gold-light" />
                Confirm Gate Entry for {pax} People
              </Button>
            )}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/client/portal"
              className="inline-flex items-center gap-1.5 text-xs text-warm-gray hover:text-maroon transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Client Wedding Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GatePassVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
          <Sparkles className="w-8 h-8 text-gold animate-spin" />
        </div>
      }
    >
      <GatePassContent />
    </Suspense>
  );
}

