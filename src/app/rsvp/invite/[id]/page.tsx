"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Sparkles, Crown, ArrowLeft, AlertCircle } from "lucide-react";
import { RoyalRsvpInvitationCard } from "@/components/guests/royal-rsvp-invitation-card";

export default function StandaloneRsvpInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/booking-requests?id=${id}`);
        if (!res.ok) {
          throw new Error("Unable to locate wedding invitation details");
        }
        const data = await res.json();
        setBookingData(data);
      } catch (err: any) {
        console.error("Failed to load invitation:", err);
        setErrorNotice(err.message || "Invitation not found");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mb-4 border border-gold/30 animate-pulse">
          <Crown className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-maroon-deep mb-2">
          Opening Royal Wedding Invitation
        </h2>
        <p className="text-xs text-warm-gray max-w-sm">
          Retrieving wedding traditions, ceremony itinerary, and RSVP registry...
        </p>
      </div>
    );
  }

  if (errorNotice || !bookingData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gold/30 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-maroon-deep">
            Invitation Not Found
          </h2>
          <p className="text-xs text-warm-gray leading-relaxed">
            {errorNotice || "This wedding invitation link might be expired or invalid. Please check your message."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-maroon font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Visit Gathbandhan Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-12 px-4 selection:bg-gold/20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Minimal Navigation */}
        <div className="flex items-center justify-between pb-2">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="font-heading font-bold text-base text-maroon-deep">
              Gathbandhan
            </span>
          </Link>
          <span className="text-[11px] text-gold-800 uppercase tracking-widest font-semibold">
            Official Royal Invitation
          </span>
        </div>

        {/* The Card */}
        <RoyalRsvpInvitationCard
          coupleName={bookingData.coupleName || "Kira"}
          bookingRequestId={bookingData.id || id}
          weddingId={bookingData.weddingId}
          weddingType={bookingData.weddingType}
          destinationCity={bookingData.destinationCity || "Udaipur"}
          venueType={bookingData.venueType || "Heritage Palace Resort"}
          preferredDate={bookingData.preferredDate}
          durationDays={bookingData.durationDays || 2}
          totalGuestsEstimated={bookingData.guestCount || 400}
          theme={bookingData.theme || "Royal Traditional Heritage"}
          ceremonies={bookingData.ceremonies}
          isStandaloneGuestView={true}
        />

        {/* Footer */}
        <div className="text-center py-6 text-xs text-warm-gray">
          © 2026 Gathbandhan — Where Every Celebration Comes Together.
        </div>
      </div>
    </div>
  );
}

