"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UtensilsCrossed,
  Building2,
  Car,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GuestListView } from "@/components/guests/guest-list-view";
import { DietarySummaryView } from "@/components/guests/dietary-summary-view";
import { AccommodationView } from "@/components/guests/accommodation-view";
import { TransportView } from "@/components/guests/transport-view";
import {
  GuestRecord,
  WeddingLogisticsOverview,
  AccommodationBookingRecord,
  TransportAssignmentRecord,
} from "@/modules/guests/types";

export function GuestLogisticsView({
  weddingId,
  weddingTitle,
}: {
  weddingId: string;
  weddingTitle?: string;
}) {
  const [activeTab, setActiveTab] = useState("roster");
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [dietaryOverview, setDietaryOverview] = useState<WeddingLogisticsOverview | null>(null);
  const [bookings, setBookings] = useState<AccommodationBookingRecord[]>([]);
  const [transfers, setTransfers] = useState<TransportAssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const [guestsRes, dietaryRes, accommodationRes, transportRes] = await Promise.all([
        fetch(`/api/guests?weddingId=${weddingId}`),
        fetch(`/api/guests/dietary-summary?weddingId=${weddingId}`),
        fetch(`/api/guests/accommodation?weddingId=${weddingId}`),
        fetch(`/api/guests/transport?weddingId=${weddingId}`),
      ]);

      const [guestsJson, dietaryJson, accommodationJson, transportJson] = await Promise.all([
        guestsRes.json(),
        dietaryRes.json(),
        accommodationRes.json(),
        transportRes.json(),
      ]);

      if (guestsJson.success) setGuests(guestsJson.data || []);
      if (dietaryJson.success) setDietaryOverview(dietaryJson.data);
      if (accommodationJson.success) setBookings(accommodationJson.data || []);
      if (transportJson.success) setTransfers(transportJson.data || []);
    } catch (err) {
      console.error("Failed to load guest logistics for control room:", err);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-charcoal">
            Guest Management & Logistics
          </h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            RSVP roster, confidential dietary matrix, palace room allocations, and airport transfer convoys
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAllData}
          disabled={loading}
          className="gap-1.5 border-ivory-300 text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold ${loading ? "animate-spin" : ""}`} />
          Refresh Logistics
        </Button>
      </div>

      {/* Sub Tabs for Guests */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-ivory-300 p-1 flex-wrap">
          <TabsTrigger value="roster" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5 text-gold" />
            Guest Roster & RSVPs ({guests.length})
          </TabsTrigger>
          <TabsTrigger value="dietary" className="text-xs gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-gold" />
            Catering & Dietary Matrix
          </TabsTrigger>
          <TabsTrigger value="accommodation" className="text-xs gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gold" />
            Room Allocations ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="transport" className="text-xs gap-1.5">
            <Car className="w-3.5 h-3.5 text-gold" />
            Airport & Transfers ({transfers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <GuestListView
            guests={guests}
            weddingId={weddingId}
            onRefresh={loadAllData}
          />
        </TabsContent>

        <TabsContent value="dietary" className="space-y-4">
          <DietarySummaryView
            overview={dietaryOverview}
          />
        </TabsContent>

        <TabsContent value="accommodation" className="space-y-4">
          <AccommodationView
            bookings={bookings}
            weddingId={weddingId}
            onRefresh={loadAllData}
          />
        </TabsContent>

        <TabsContent value="transport" className="space-y-4">
          <TransportView
            transfers={transfers}
            weddingId={weddingId}
            onRefresh={loadAllData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
