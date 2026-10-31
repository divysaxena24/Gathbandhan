"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UtensilsCrossed,
  Building2,
  Car,
  RefreshCw,
  Calendar,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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

interface WeddingOption {
  id: string;
  title: string;
  city: string | null;
  venue: string | null;
  startDate: string | null;
}

export default function GuestsPage() {
  const [weddings, setWeddings] = useState<WeddingOption[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Logistics states
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [dietaryOverview, setDietaryOverview] = useState<WeddingLogisticsOverview | null>(null);
  const [bookings, setBookings] = useState<AccommodationBookingRecord[]>([]);
  const [transfers, setTransfers] = useState<TransportAssignmentRecord[]>([]);

  // 1. Load active weddings
  const loadWeddings = useCallback(async () => {
    try {
      const res = await fetch("/api/weddings");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setWeddings(json.data);
        if (!selectedWeddingId) {
          setSelectedWeddingId(json.data[0].id);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load weddings:", err);
      setErrorMessage("Could not load weddings list");
    }
  }, [selectedWeddingId]);

  useEffect(() => {
    loadWeddings();
  }, [loadWeddings]);

  // 2. Load all guest & logistics data for selected wedding
  const loadAllData = useCallback(async (weddingId: string) => {
    if (!weddingId) return;
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [guestsRes, dietaryRes, accommodationRes, transportRes] =
        await Promise.all([
          fetch(`/api/guests?weddingId=${weddingId}`),
          fetch(`/api/guests/dietary-summary?weddingId=${weddingId}`),
          fetch(`/api/guests/accommodation?weddingId=${weddingId}`),
          fetch(`/api/guests/transport?weddingId=${weddingId}`),
        ]);

      const [guestsJson, dietaryJson, accommodationJson, transportJson] =
        await Promise.all([
          guestsRes.json(),
          dietaryRes.json(),
          accommodationRes.json(),
          transportRes.json(),
        ]);

      if (guestsJson.success) setGuests(guestsJson.data);
      if (dietaryJson.success) setDietaryOverview(dietaryJson.data);
      if (accommodationJson.success) setBookings(accommodationJson.data);
      if (transportJson.success) setTransfers(transportJson.data);
    } catch (err: unknown) {
      console.error("Failed to load logistics data:", err);
      setErrorMessage("Failed to load guest logistics records");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWeddingId) {
      loadAllData(selectedWeddingId);
    }
  }, [selectedWeddingId, loadAllData]);

  const selectedWedding = weddings.find((w) => w.id === selectedWeddingId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests & Logistics"
        description="Per-event RSVP tracking, confidential catering dietary matrix, room block assignments, and airport convoys"
      >
        <div className="flex items-center gap-3">
          {weddings.length > 0 && (
            <div className="relative">
              <select
                value={selectedWeddingId}
                onChange={(e) => setSelectedWeddingId(e.target.value)}
                className="text-xs bg-white border border-sand-300 rounded-lg py-2 pl-3 pr-8 font-medium text-charcoal focus:ring-1 focus:ring-gold-500 shadow-sm"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.city || "Rajasthan"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAllData(selectedWeddingId)}
            disabled={isRefreshing}
            className="gap-1.5 text-xs text-charcoal-700 hover:text-charcoal border-sand-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Meta Sub-bar */}
      {selectedWedding && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-sand-50/70 border border-sand-200/80 px-4 py-2.5 rounded-xl text-xs text-charcoal-600">
          <div className="flex items-center gap-4">
            <span className="font-serif font-medium text-charcoal-900 text-sm">
              {selectedWedding.title}
            </span>
            {selectedWedding.venue && (
              <span className="flex items-center gap-1 text-charcoal-500">
                <MapPin className="w-3.5 h-3.5 text-gold-600" />
                {selectedWedding.venue}, {selectedWedding.city}
              </span>
            )}
            {selectedWedding.startDate && (
              <span className="flex items-center gap-1 text-charcoal-500">
                <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                {new Date(selectedWedding.startDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-charcoal-800">
              {guests.length} Invited Guests
            </span>
            <span>•</span>
            <span className="text-emerald-800 font-medium">
              {dietaryOverview?.totalConfirmedGuests || 0} Confirmed
            </span>
            <span>•</span>
            <span className="text-charcoal-500">
              {dietaryOverview?.totalRoomsBooked || 0} Rooms
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs defaultValue="guests" className="space-y-6">
        <TabsList className="bg-sand-100/60 p-1 border border-sand-200 rounded-xl">
          <TabsTrigger
            value="guests"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-gold-600" />
            Guest Roster & RSVPs ({guests.length})
          </TabsTrigger>
          <TabsTrigger
            value="dietary"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-charcoal-600" />
            Catering & Dietary Matrix
          </TabsTrigger>
          <TabsTrigger
            value="accommodation"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-charcoal-600" />
            Palace Room Allocations ({bookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="transport"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Car className="w-3.5 h-3.5 text-charcoal-600" />
            Airport & Venue Transfers ({transfers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-6">
          <GuestListView
            guests={guests}
            weddingId={selectedWeddingId}
            onRefresh={() => loadAllData(selectedWeddingId)}
          />
        </TabsContent>

        <TabsContent value="dietary" className="space-y-6">
          <DietarySummaryView overview={dietaryOverview} />
        </TabsContent>

        <TabsContent value="accommodation" className="space-y-6">
          <AccommodationView
            bookings={bookings}
            weddingId={selectedWeddingId}
            onRefresh={() => loadAllData(selectedWeddingId)}
          />
        </TabsContent>

        <TabsContent value="transport" className="space-y-6">
          <TransportView
            transfers={transfers}
            weddingId={selectedWeddingId}
            onRefresh={() => loadAllData(selectedWeddingId)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
