"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  ShieldAlert,
  Sliders,
  Calendar,
  MapPin,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeddingLogisticsOverview } from "@/modules/guests/types";

interface DietarySummaryViewProps {
  overview: WeddingLogisticsOverview | null;
  onBufferChange?: (buffer: number) => void;
}

export function DietarySummaryView({
  overview,
}: DietarySummaryViewProps) {
  const [bufferPercentage, setBufferPercentage] = useState(5);

  if (!overview) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-sand-200 text-xs text-charcoal-400">
        Loading catering breakdown and dietary matrix...
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Buffer Configuration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-sand-50/80 p-4 rounded-xl border border-sand-200">
        <div>
          <h3 className="font-serif text-base text-charcoal-900 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-gold-600" />
            Catering & Dietary Intelligence Matrix
          </h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Aggregated plate commitments, Jain/Veg counts, and confidential allergy summaries for banquet operations.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-sand-200 shadow-sm text-xs">
            <Sliders className="w-3.5 h-3.5 text-charcoal-500" />
            <span className="font-medium text-charcoal-700">Catering Buffer:</span>
            <select
              value={bufferPercentage}
              onChange={(e) => setBufferPercentage(parseInt(e.target.value, 10))}
              className="font-mono font-medium text-gold-800 bg-transparent border-0 focus:ring-0 cursor-pointer text-xs"
            >
              <option value={0}>0% (Exact)</option>
              <option value={5}>+5% Buffer (Standard)</option>
              <option value={8}>+8% Buffer</option>
              <option value={10}>+10% Buffer (Recommended)</option>
              <option value={15}>+15% Buffer (Heavy Walk-in)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 border-sand-300 hover:bg-sand-100"
          >
            <Printer className="w-3.5 h-3.5" />
            Export for Caterer
          </Button>
        </div>
      </div>

      {/* Event Cards */}
      <div className="space-y-4">
        {overview.eventSummaries.map((summary) => {
          const totalAttending = summary.totalAttendingHeadcount;
          const dynamicBuffer = Math.ceil(totalAttending * (bufferPercentage / 100));
          const committedPlates = totalAttending + dynamicBuffer;

          return (
            <div
              key={summary.eventId}
              className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden"
            >
              {/* Event Header */}
              <div className="p-4 border-b border-sand-100 bg-sand-50/40 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center border border-gold/30">
                    <UtensilsCrossed className="w-4 h-4 text-gold-700" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-charcoal-900">
                      {summary.eventName}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-charcoal-500 mt-0.5">
                      {summary.startsAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-charcoal-400" />
                          {new Date(summary.startsAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {summary.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-charcoal-400" />
                          {summary.venue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-white text-charcoal-700">
                    {summary.confirmedGuests} Confirmed RSVPs
                  </Badge>
                  {summary.plusOnesCount > 0 && (
                    <Badge variant="outline" className="text-xs bg-white text-charcoal-700">
                      +{summary.plusOnesCount} Plus-Ones
                    </Badge>
                  )}
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {committedPlates} Plates Committed
                  </span>
                </div>
              </div>

              {/* Event Body */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Headcount & Buffer Breakdown */}
                <div className="space-y-3">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400 font-semibold">
                    Headcount Reconciliation
                  </div>
                  <div className="bg-sand-50/60 p-3.5 rounded-lg border border-sand-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-charcoal-600">
                      <span>Confirmed Guests:</span>
                      <span className="font-mono font-medium text-charcoal-900">{summary.confirmedGuests}</span>
                    </div>
                    <div className="flex justify-between items-center text-charcoal-600">
                      <span>Accompanying Plus-Ones:</span>
                      <span className="font-mono font-medium text-charcoal-900">+{summary.plusOnesCount}</span>
                    </div>
                    <div className="flex justify-between items-center font-medium text-charcoal-900 pt-1 border-t border-sand-200">
                      <span>Actual Expected Attendees:</span>
                      <span className="font-mono">{totalAttending}</span>
                    </div>
                    <div className="flex justify-between items-center text-gold-800 pt-1">
                      <span>Catering Buffer (+{bufferPercentage}%):</span>
                      <span className="font-mono font-bold">+{dynamicBuffer} plates</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-800 font-bold text-sm pt-1 border-t border-sand-200">
                      <span>Guaranteed Covers to Kitchen:</span>
                      <span className="font-mono text-base">{committedPlates}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Meal Preference Breakdown */}
                <div className="space-y-3">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400 font-semibold">
                    Kitchen Preparation Counts
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <span className="font-medium text-emerald-900">Pure Vegetarian</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {summary.vegCount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-purple-50/60 border border-purple-100 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        <div>
                          <span className="font-medium text-purple-900">Jain Specialized</span>
                          <span className="block text-[10px] text-purple-700">Strictly no root vegetables/onion/garlic</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-purple-800 text-sm">
                        {summary.jainCount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-orange-50/60 border border-orange-100 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                        <span className="font-medium text-orange-900">Non-Vegetarian</span>
                      </div>
                      <span className="font-mono font-bold text-orange-800 text-sm">
                        {summary.nonVegCount}
                      </span>
                    </div>

                    {summary.veganCount > 0 && (
                      <div className="flex justify-between items-center p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                          <span className="font-medium text-teal-900">Vegan (Dairy-Free)</span>
                        </div>
                        <span className="font-mono font-bold text-teal-800 text-sm">
                          {summary.veganCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Confidential Allergy Matrix & Special Notes */}
                <div className="space-y-3">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400 font-semibold flex items-center justify-between">
                    <span>Critical Allergies</span>
                    <Badge variant="outline" className="text-[10px] text-rose-700 bg-rose-50 border-rose-200">
                      Confidential
                    </Badge>
                  </div>

                  {summary.allergies.length === 0 ? (
                    <div className="p-4 rounded-lg bg-sand-50/60 border border-sand-200 text-xs text-charcoal-500 text-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1 inline-block mr-1" />
                      No critical medical allergies logged for this ceremony.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {summary.allergies.map((a) => (
                        <div
                          key={a.allergy}
                          className="flex justify-between items-center px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900"
                        >
                          <div className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span className="font-medium">{a.allergy} Allergy</span>
                          </div>
                          <span className="font-mono font-bold">{a.count} guests</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {summary.specialRequests.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[11px] text-charcoal-500 mb-1 font-medium">
                        Special Preparation Notes:
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {summary.specialRequests.map((req, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] bg-sand-50 p-1.5 rounded border border-sand-200 text-charcoal-700 italic"
                          >
                            &ldquo;{req}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
