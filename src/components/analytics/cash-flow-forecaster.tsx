"use client";

import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupees } from "@/lib/money";
import { CashFlowBucket, WeeklyCashFlow } from "@/modules/analytics/types";

interface CashFlowForecasterProps {
  buckets: CashFlowBucket[];
  weekly: WeeklyCashFlow[];
}

export function CashFlowForecaster({ buckets, weekly }: CashFlowForecasterProps) {
  const [activeTab, setActiveTab] = useState<"HORIZONS" | "WEEKLY">("HORIZONS");

  const toBigInt = (val: unknown): bigint => {
    if (typeof val === "bigint") return val;
    if (typeof val === "string" || typeof val === "number") return BigInt(val);
    return 0n;
  };

  return (
    <Card className="border-sand-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-sand-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-serif font-bold text-charcoal-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gold-600" />
              Cash Flow Forecast &amp; Liquidity Horizons
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-500 mt-0.5">
              Scheduled milestone receivables versus vendor payables answering:{" "}
              <strong className="text-charcoal-700">What payments are due in 7/30/60/90 days?</strong>
            </CardDescription>
          </div>

          <div className="flex items-center gap-1 bg-sand-100 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("HORIZONS")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "HORIZONS"
                  ? "bg-white text-charcoal-900 shadow-xs"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              Horizon Windows (7/30/60/90)
            </button>
            <button
              onClick={() => setActiveTab("WEEKLY")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === "WEEKLY"
                  ? "bg-white text-charcoal-900 shadow-xs"
                  : "text-charcoal-600 hover:text-charcoal-900"
              }`}
            >
              Weekly Projection (8 Weeks)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {activeTab === "HORIZONS" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {buckets.map((b) => {
              const inflow = toBigInt(b.inflowPaise);
              const outflow = toBigInt(b.outflowPaise);
              const net = toBigInt(b.netCashFlowPaise);
              const isPositive = net >= 0n;

              return (
                <div
                  key={b.bucketKey}
                  className="p-4 rounded-xl border border-sand-200 bg-sand-50/40 hover:bg-white hover:border-gold-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif font-bold text-sm text-charcoal-900">
                      {b.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isPositive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-ruby-50 text-ruby-800 border-ruby-300"
                      }`}
                    >
                      {isPositive ? "Net Inflow" : "Net Outflow"}
                    </Badge>
                  </div>

                  <div className="text-xl font-serif font-bold my-2 font-mono">
                    <span className={isPositive ? "text-emerald-700" : "text-ruby-700"}>
                      {isPositive ? "+" : "-"}
                      {formatRupees(isPositive ? net : -net)}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-sand-200 text-xs">
                    <div className="flex items-center justify-between text-charcoal-500">
                      <span className="flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        Inflows ({b.inflowCount}):
                      </span>
                      <span className="font-mono font-medium text-emerald-700">
                        {formatRupees(inflow)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-charcoal-500">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-ruby-600" />
                        Outflows ({b.outflowCount}):
                      </span>
                      <span className="font-mono font-medium text-ruby-700">
                        {formatRupees(outflow)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-sand-50 text-charcoal-600 font-semibold border-b border-sand-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-3">Calendar Window</th>
                  <th className="py-2.5 px-3 text-right">Inflows (INR)</th>
                  <th className="py-2.5 px-3 text-right">Outflows (INR)</th>
                  <th className="py-2.5 px-4 text-right">Net Liquidity Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {weekly.map((w, idx) => {
                  const inflow = toBigInt(w.inflowPaise);
                  const outflow = toBigInt(w.outflowPaise);
                  const net = toBigInt(w.netPaise);
                  const isPositive = net >= 0n;

                  return (
                    <tr key={idx} className="hover:bg-sand-50/40">
                      <td className="py-3 px-4 font-semibold text-charcoal-900">
                        {w.weekLabel}
                      </td>
                      <td className="py-3 px-3 text-charcoal-500 font-mono text-[11px]">
                        {w.startDate} to {w.endDate}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                        {formatRupees(inflow)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-ruby-700 font-medium">
                        {formatRupees(outflow)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? "text-emerald-700" : "text-ruby-700"}>
                          {isPositive ? "+" : "-"}
                          {formatRupees(isPositive ? net : -net)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
