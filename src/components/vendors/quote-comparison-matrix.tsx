/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Scale,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Info,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { formatINR } from "@/lib/money";

interface QuoteComparisonData {
  quoteRequestId: string;
  weddingId: string;
  category: string;
  scenario: {
    guestCount: number;
    overtimeHours: number;
  };
  weights: {
    cost: number;
    reliability: number;
    quality: number;
    inclusions: number;
  };
  quotes: Array<{
    quoteId: string;
    vendorId: string;
    vendorName: string;
    guestCount: number;
    itemsSubtotalPaise: string;
    totalServiceChargePaise: string;
    totalTaxPaise: string;
    travelFeePaise: string;
    overtimePaise: string;
    totalLandedCostPaise: string;
    costPerGuestPaise: string;
    assumptions: string[];
    itemBreakdowns: Array<{
      id: string;
      name: string;
      category: string;
      quantity: number;
      unit: string;
      unitPricePaise: string;
      fixedChargePaise: string;
      isPerGuest: boolean;
      subtotalPaise: string;
      taxPaise: string;
      totalPaise: string;
      inclusionStatus: "INCLUDED" | "EXCLUDED" | "OPTIONAL" | "UNSPECIFIED";
      effectivePerGuestPaise: string;
    }>;
  }>;
  scores: Array<{
    quoteId: string;
    vendorId: string;
    vendorName: string;
    costScore: number;
    reliabilityScore: number;
    qualityScore: number;
    inclusionsScore: number;
    compositeScore: number;
    landedCostPaise: string;
    rank: number;
    highlights: string[];
    flags: string[];
  }>;
  inclusionGaps: Array<{
    itemName: string;
    category: string;
    statusByQuote: Record<string, "INCLUDED" | "EXCLUDED" | "OPTIONAL" | "UNSPECIFIED">;
    riskDescription: string;
  }>;
}

export function QuoteComparisonMatrix({
  quoteIds,
  onQuoteSelected,
}: {
  quoteIds: string[];
  onQuoteSelected?: () => void;
}) {
  const [guestCount, setGuestCount] = useState<number>(400);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [weights, setWeights] = useState({
    cost: 0.4,
    reliability: 0.25,
    quality: 0.2,
    inclusions: 0.15,
  });

  const [comparison, setComparison] = useState<QuoteComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    if (quoteIds.length < 2) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quotes/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteIds,
          scenario: {
            guestCount: Number(guestCount) || 400,
            overtimeHours: Number(overtimeHours) || 0,
          },
          weights,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to compare quotes");
      }

      const data = await res.json();
      setComparison(data.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while comparing quotes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteIds, guestCount, overtimeHours, weights]);

  const handleSelectQuote = async (quoteId: string, vendorName: string) => {
    if (
      !confirm(
        `Award wedding contract to '${vendorName}'?\n\nThis will transactionally close the quote request, reject competing quotes, and bind the vendor to the wedding.`
      )
    ) {
      return;
    }

    setIsSelecting(quoteId);
    setError(null);

    try {
      const res = await fetch(`/api/quotes/${quoteId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to select quote");
      }

      alert(`Vendor '${vendorName}' successfully awarded contract!`);
      onQuoteSelected?.();
    } catch (err: any) {
      setError(err.message || "Failed to select vendor quote");
    } finally {
      setIsSelecting(null);
    }
  };

  if (quoteIds.length < 2) {
    return (
      <div className="p-8 text-center bg-ivory-100 rounded-lg border border-ivory-200">
        <Scale className="w-8 h-8 text-gold mx-auto mb-2" />
        <p className="text-sm font-medium text-charcoal">
          Select at least 2 quotes to enable side-by-side comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation & Weights Controls */}
      <Card className="border-ivory-300 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-ivory-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif flex items-center gap-2 text-charcoal">
              <SlidersHorizontal className="w-4 h-4 text-gold" />
              Real-Time Simulation Controls & Scoring Weights
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-500">Preset Scenarios:</span>
              <button
                type="button"
                onClick={() => setGuestCount(250)}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  guestCount === 250 ? "bg-charcoal text-ivory border-charcoal" : "bg-ivory-100 text-charcoal"
                }`}
              >
                Intimate (250)
              </button>
              <button
                type="button"
                onClick={() => setGuestCount(400)}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  guestCount === 400 ? "bg-charcoal text-ivory border-charcoal" : "bg-ivory-100 text-charcoal"
                }`}
              >
                Grand Royal (400)
              </button>
              <button
                type="button"
                onClick={() => setGuestCount(600)}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  guestCount === 600 ? "bg-charcoal text-ivory border-charcoal" : "bg-ivory-100 text-charcoal"
                }`}
              >
                Mega Palace (600)
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="guestCountInput" className="text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gold" />
              Simulated Guests
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="guestCountInput"
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                className="h-9 font-semibold text-charcoal"
              />
              <span className="text-xs text-charcoal-500">Pax</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="overtimeHoursInput" className="text-xs">
              Overtime Hours
            </Label>
            <Input
              id="overtimeHoursInput"
              type="number"
              step="0.5"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(Math.max(0, Number(e.target.value)))}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-charcoal">Scoring Weight Distribution</span>
              <span className="text-charcoal-500">
                Cost: {(weights.cost * 100).toFixed(0)}% | Reliability: {(weights.reliability * 100).toFixed(0)}% | Quality: {(weights.quality * 100).toFixed(0)}% | Inclusions: {(weights.inclusions * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setWeights({ cost: 0.5, reliability: 0.2, quality: 0.15, inclusions: 0.15 })}
                className="text-[11px] px-2 py-1 bg-ivory-100 hover:bg-ivory-200 rounded text-charcoal"
              >
                Budget Focused (50% Cost)
              </button>
              <button
                type="button"
                onClick={() => setWeights({ cost: 0.25, reliability: 0.35, quality: 0.25, inclusions: 0.15 })}
                className="text-[11px] px-2 py-1 bg-ivory-100 hover:bg-ivory-200 rounded text-charcoal"
              >
                Reliability Focused
              </button>
              <button
                type="button"
                onClick={() => setWeights({ cost: 0.4, reliability: 0.25, quality: 0.2, inclusions: 0.15 })}
                className="text-[11px] px-2 py-1 bg-ivory-100 hover:bg-ivory-200 rounded text-charcoal"
              >
                Standard Balanced
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="p-12 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm font-medium">Recalculating landed costs & weighted scores...</p>
        </div>
      )}

      {comparison && !isLoading && (
        <>
          {/* Side-by-Side Landed Cost Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparison.scores.map((score) => {
              const quoteData = comparison.quotes.find((q) => q.quoteId === score.quoteId)!;
              const isWinner = score.rank === 1;

              return (
                <div
                  key={score.quoteId}
                  className={`rounded-xl border p-5 flex flex-col justify-between transition-all bg-white shadow-sm ${
                    isWinner
                      ? "border-gold ring-2 ring-gold/30 bg-gradient-to-b from-amber-50/20 to-white"
                      : "border-ivory-300"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header & Badges */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {isWinner && <Crown className="w-4 h-4 text-gold" />}
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isWinner
                                ? "bg-gold text-charcoal"
                                : "bg-ivory-200 text-charcoal-700"
                            }`}
                          >
                            Rank #{score.rank}
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-charcoal mt-1.5">
                          {score.vendorName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold font-serif text-charcoal">
                          {score.compositeScore}
                        </span>
                        <span className="text-[10px] block text-charcoal-500 uppercase font-semibold">
                          Score / 100
                        </span>
                      </div>
                    </div>

                    {/* True Landed Cost Section */}
                    <div className="p-3 bg-ivory-100 rounded-lg space-y-1">
                      <div className="text-xs text-charcoal-500 font-medium">
                        True Landed Cost ({guestCount} Pax)
                      </div>
                      <div className="text-xl font-bold text-charcoal font-serif">
                        {formatINR(BigInt(quoteData.totalLandedCostPaise))}
                      </div>
                      <div className="text-xs font-medium text-gold-700">
                        ≈ {formatINR(BigInt(quoteData.costPerGuestPaise))} / guest
                      </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="text-xs space-y-1.5 pt-1 text-charcoal-600 border-t border-ivory-200">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-mono text-charcoal">
                          {formatINR(BigInt(quoteData.itemsSubtotalPaise))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Tax (Applicable rules):</span>
                        <span className="font-mono text-charcoal">
                          {formatINR(BigInt(quoteData.totalTaxPaise))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charges:</span>
                        <span className="font-mono text-charcoal">
                          {formatINR(BigInt(quoteData.totalServiceChargePaise))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Travel & Logistics:</span>
                        <span className="font-mono text-charcoal">
                          {formatINR(BigInt(quoteData.travelFeePaise))}
                        </span>
                      </div>
                    </div>

                    {/* Score Pillar Bars */}
                    <div className="space-y-1.5 pt-2 border-t border-ivory-200 text-xs">
                      <div className="flex justify-between text-[11px]">
                        <span>Cost Efficiency ({score.costScore}/100)</span>
                        <span>{score.costScore}%</span>
                      </div>
                      <div className="w-full bg-ivory-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${score.costScore}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] pt-1">
                        <span>Reliability & Track Record</span>
                        <span>{score.reliabilityScore}%</span>
                      </div>
                      <div className="w-full bg-ivory-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gold h-full rounded-full"
                          style={{ width: `${score.reliabilityScore}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] pt-1">
                        <span>Inclusions Completeness</span>
                        <span>{score.inclusionsScore}%</span>
                      </div>
                      <div className="w-full bg-ivory-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-charcoal h-full rounded-full"
                          style={{ width: `${score.inclusionsScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Flags / Alerts */}
                    {score.flags.length > 0 && (
                      <div className="space-y-1 pt-2">
                        {score.flags.map((flag, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-burgundy-700 bg-burgundy-50 p-1.5 rounded"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Commit Action */}
                  <div className="pt-4 mt-4 border-t border-ivory-200">
                    <Button
                      onClick={() => handleSelectQuote(score.quoteId, score.vendorName)}
                      disabled={isSelecting === score.quoteId}
                      className={`w-full font-medium ${
                        isWinner
                          ? "bg-gold text-charcoal hover:bg-gold-400"
                          : "bg-charcoal text-ivory hover:bg-charcoal-700"
                      }`}
                    >
                      {isSelecting === score.quoteId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Binding Contract...
                        </>
                      ) : (
                        `Award Contract to ${score.vendorName.split(" ")[0]}`
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inclusion Gap Analysis Matrix */}
          <Card className="border-ivory-300 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-ivory-200">
              <CardTitle className="text-base font-serif flex items-center gap-2 text-charcoal">
                <Info className="w-4 h-4 text-gold" />
                Line-Item Inclusion Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-200 text-charcoal-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Deliverable / Scope Item</th>
                    <th className="p-3">Category</th>
                    {comparison.quotes.map((q) => (
                      <th key={q.quoteId} className="p-3 text-center">
                        {q.vendorName}
                      </th>
                    ))}
                    <th className="p-3">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {comparison.inclusionGaps.map((gap, idx) => (
                    <tr key={idx} className="hover:bg-ivory-50">
                      <td className="p-3 font-semibold text-charcoal">{gap.itemName}</td>
                      <td className="p-3 text-charcoal-500">{gap.category}</td>
                      {comparison.quotes.map((q) => {
                        const status = gap.statusByQuote[q.quoteId] || "UNSPECIFIED";
                        return (
                          <td key={q.quoteId} className="p-3 text-center">
                            {status === "INCLUDED" && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Included
                              </span>
                            )}
                            {status === "EXCLUDED" && (
                              <span className="inline-flex items-center gap-1 text-burgundy-700 font-medium bg-burgundy-50 px-2 py-0.5 rounded">
                                <XCircle className="w-3.5 h-3.5" />
                                Excluded
                              </span>
                            )}
                            {status === "OPTIONAL" && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Optional
                              </span>
                            )}
                            {status === "UNSPECIFIED" && (
                              <span className="text-charcoal-400 italic">Not mentioned</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-xs text-charcoal-600">{gap.riskDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
