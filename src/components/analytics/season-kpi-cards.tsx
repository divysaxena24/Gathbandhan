"use client";

import React from "react";
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  Building2,
  Clock,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupees } from "@/lib/money";
import { SeasonFinancialMetrics } from "@/modules/analytics/types";

interface SeasonKpiCardsProps {
  season: SeasonFinancialMetrics;
}

export function SeasonKpiCards({ season }: SeasonKpiCardsProps) {
  // Financial values from API are strings because of BigInt serialization
  const toBigInt = (val: unknown): bigint => {
    if (typeof val === "bigint") return val;
    if (typeof val === "string" || typeof val === "number") return BigInt(val);
    return 0n;
  };

  const contractedRev = toBigInt(season.contractedRevenuePaise);
  const collectedRev = toBigInt(season.collectedRevenuePaise);
  const receivables = toBigInt(season.pendingReceivablesPaise);
  const committedCosts = toBigInt(season.committedCostsPaise);
  const actualCosts = toBigInt(season.actualInvoicedCostsPaise);
  const pendingPayables = toBigInt(season.pendingPayablesPaise);
  const projectedProfit = toBigInt(season.projectedProfitPaise);
  const realizedProfit = toBigInt(season.realizedProfitPaise);

  const collectionRate =
    contractedRev > 0n
      ? ((Number(collectedRev) / Number(contractedRev)) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4">
      {/* As-of timestamp header & Definitions notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-charcoal-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gold-600" />
          <span>
            As of:{" "}
            <strong className="text-charcoal-700 font-mono">
              {new Date(season.asOf).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-charcoal-400">
          <Info className="w-3.5 h-3.5" />
          <span>
            Projected metrics derive from signed client contracts & vendor commitments; realized metrics derive from reconciled transactions.
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Contracted & Collected Revenue */}
        <Card className="border-sand-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Contracted Revenue
              </span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-serif font-bold text-charcoal-900">
              {formatRupees(contractedRev)}
            </div>
            <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs">
              <span className="text-charcoal-500">
                Collected:{" "}
                <strong className="text-emerald-700 font-mono">
                  {formatRupees(collectedRev)}
                </strong>
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                {collectionRate}% Realized
              </Badge>
            </div>
            <div className="mt-1 text-[11px] text-amber-700 flex justify-between">
              <span>Pending Receivables:</span>
              <span className="font-mono font-medium">{formatRupees(receivables)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Committed & Invoiced Vendor Costs */}
        <Card className="border-sand-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Committed Outlays
              </span>
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-serif font-bold text-charcoal-900">
              {formatRupees(committedCosts)}
            </div>
            <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs">
              <span className="text-charcoal-500">
                Invoiced:{" "}
                <strong className="text-charcoal-800 font-mono">
                  {formatRupees(actualCosts)}
                </strong>
              </span>
              <Badge variant="outline" className="text-[10px] bg-sand-100 text-charcoal-700 border-sand-300">
                Vendor Ledgers
              </Badge>
            </div>
            <div className="mt-1 text-[11px] text-charcoal-500 flex justify-between">
              <span>Pending Payables:</span>
              <span className="font-mono font-medium text-charcoal-700">{formatRupees(pendingPayables)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Projected Season Profit & Margin */}
        <Card className="border-sand-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Projected Profit
              </span>
              <div className="p-1.5 rounded-md bg-gold-50 text-gold-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-serif font-bold text-gold-700">
              {formatRupees(projectedProfit)}
            </div>
            <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs">
              <span className="text-charcoal-500">Projected Margin:</span>
              <Badge className="bg-gold-100 text-gold-900 border-gold-300 font-bold text-xs">
                {season.projectedMarginPct.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-1 text-[11px] text-charcoal-500 flex justify-between">
              <span>Realized Margin to Date:</span>
              <span className="font-mono font-medium text-emerald-700">
                {season.realizedMarginPct.toFixed(1)}% ({formatRupees(realizedProfit)})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Portfolio Weddings Lifecycle */}
        <Card className="border-sand-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                Season Weddings
              </span>
              <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-serif font-bold text-charcoal-900">
              {season.totalWeddings}{" "}
              <span className="text-xs font-sans font-normal text-charcoal-500">
                Weddings Booked
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-sand-100 grid grid-cols-2 gap-1 text-[11px]">
              <div className="flex items-center justify-between pr-2">
                <span className="text-charcoal-500">Planning:</span>
                <span className="font-bold text-blue-600">
                  {season.weddingsByStatus.PLANNING || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">Active Days:</span>
                <span className="font-bold text-emerald-600">
                  {season.weddingsByStatus.ACTIVE || 0}
                </span>
              </div>
              <div className="flex items-center justify-between pr-2">
                <span className="text-charcoal-500">Completed:</span>
                <span className="font-bold text-charcoal-700">
                  {season.weddingsByStatus.COMPLETED || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500">Cancelled:</span>
                <span className="font-bold text-charcoal-400">
                  {season.weddingsByStatus.CANCELLED || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
