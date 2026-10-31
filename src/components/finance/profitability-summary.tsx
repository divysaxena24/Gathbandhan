"use client";

import React from "react";
import {
  TrendingUp,
  Wallet,
  ArrowDownRight,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import { WeddingProfitability } from "@/modules/finance/types";
import { formatINR, formatINRCompact } from "@/lib/money";

interface ProfitabilitySummaryProps {
  profitability: WeddingProfitability | null;
}

export function ProfitabilitySummary({
  profitability,
}: ProfitabilitySummaryProps) {
  if (!profitability) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-sand/40 text-charcoal/50 text-xs">
        Loading financial balance sheet...
      </div>
    );
  }

  const {
    contractedRevenuePaise,
    collectedRevenuePaise,
    pendingReceivablesPaise,
    committedVendorCostsPaise,
    actualInvoicedCostsPaise,
    paidToVendorsPaise,
    pendingPayablesPaise,
    projectedProfitPaise,
    projectedMarginPercentage,
    realizedProfitPaise,
    realizedMarginPercentage,
    categoryBreakdown,
  } = profitability;

  const collectionRate =
    contractedRevenuePaise > 0n
      ? Math.round(Number((collectedRevenuePaise * 100n) / contractedRevenuePaise))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Financial Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contracted Revenue */}
        <div className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-charcoal/60">
            <span>Contracted Revenue</span>
            <Wallet className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-charcoal">
            {formatINRCompact(contractedRevenuePaise)}
          </div>
          <div className="text-[11px] text-charcoal/50">
            Exact: {formatINR(contractedRevenuePaise)}
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-charcoal/60">
            <span>Collected In Bank</span>
            <ArrowDownRight className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-serif font-bold text-status-success">
            {formatINRCompact(collectedRevenuePaise)}
          </div>
          <div className="text-[11px] text-charcoal/50 flex items-center justify-between">
            <span>{collectionRate}% of contracted budget</span>
            <span className="font-semibold text-status-warning">
              {formatINRCompact(pendingReceivablesPaise)} pending
            </span>
          </div>
        </div>

        {/* Projected Profit */}
        <div className="p-5 rounded-xl bg-gold/5 border border-gold/30 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-charcoal/70">
            <span>Projected Profit</span>
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-charcoal">
            {formatINRCompact(projectedProfitPaise)}
          </div>
          <div className="text-[11px] text-charcoal/70 flex items-center gap-1 font-medium">
            <span className="text-gold font-bold">
              {projectedMarginPercentage.toFixed(2)}%
            </span>
            <span>projected net agency margin</span>
          </div>
        </div>

        {/* Realized Profit */}
        <div className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-charcoal/60">
            <span>Realized Closeout Profit</span>
            <ShieldCheck className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-serif font-bold text-charcoal">
            {formatINRCompact(realizedProfitPaise)}
          </div>
          <div className="text-[11px] text-charcoal/60">
            Margin:{" "}
            <strong className="text-status-success">
              {realizedMarginPercentage.toFixed(2)}%
            </strong>{" "}
            on collected cash
          </div>
        </div>
      </div>

      {/* Payables & Commitments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-ivory border border-sand/40 space-y-2">
          <div className="text-xs font-medium text-charcoal/60">Committed Vendor Contracts</div>
          <div className="text-xl font-serif font-bold text-charcoal">
            {formatINR(committedVendorCostsPaise)}
          </div>
          <p className="text-[11px] text-charcoal/60">
            Contracted amounts committed across all awarded vendors.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-ivory border border-sand/40 space-y-2">
          <div className="text-xs font-medium text-charcoal/60">Invoiced Total (GST Inc.)</div>
          <div className="text-xl font-serif font-bold text-charcoal">
            {formatINR(actualInvoicedCostsPaise)}
          </div>
          <p className="text-[11px] text-charcoal/60">
            Sum of all submitted vendor invoices pending or certified.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-ivory border border-sand/40 space-y-2">
          <div className="text-xs font-medium text-charcoal/60">Disbursed to Vendors</div>
          <div className="text-xl font-serif font-bold text-status-success">
            {formatINR(paidToVendorsPaise)}
          </div>
          <div className="text-[11px] text-charcoal/60 flex items-center justify-between">
            <span>Remaining Payable:</span>
            <strong className="text-status-warning font-mono">
              {formatINR(pendingPayablesPaise)}
            </strong>
          </div>
        </div>
      </div>

      {/* Category Budget Breakdown */}
      <div className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
            <PieChart className="w-4 h-4 text-gold" />
            <span>Category Commitment & Settlement Breakdown</span>
          </h3>
          <span className="text-[11px] text-charcoal/50">Values in INR (Paise exact)</span>
        </div>

        <div className="divide-y divide-sand/20 text-xs">
          {categoryBreakdown.map((cat) => {
            const isSettled = cat.invoicedPaise > 0n && cat.invoicedPaise <= cat.paidPaise;
            return (
              <div
                key={cat.category}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-charcoal">{cat.category}</div>
                  <div className="text-[11px] text-charcoal/50">
                    Committed Contract: {formatINR(cat.committedPaise)}
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-xs">
                  <div>
                    <span className="text-charcoal/50 text-[10px] block">Invoiced:</span>
                    <span className="text-charcoal font-medium">
                      {formatINR(cat.invoicedPaise)}
                    </span>
                  </div>

                  <div>
                    <span className="text-charcoal/50 text-[10px] block">Disbursed:</span>
                    <span
                      className={`font-medium ${
                        isSettled ? "text-status-success" : "text-charcoal"
                      }`}
                    >
                      {formatINR(cat.paidPaise)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
