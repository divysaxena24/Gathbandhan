"use client";

import React, { useState } from "react";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupees } from "@/lib/money";
import { WeddingPnlSummary } from "@/modules/analytics/types";

interface WeddingPnlTableProps {
  weddings: WeddingPnlSummary[];
}

export function WeddingPnlTable({ weddings }: WeddingPnlTableProps) {
  const [search, setSearch] = useState("");
  const [profitabilityFilter, setProfitabilityFilter] = useState<"ALL" | "PROFIT" | "DEFICIT">("ALL");

  const toBigInt = (val: unknown): bigint => {
    if (typeof val === "bigint") return val;
    if (typeof val === "string" || typeof val === "number") return BigInt(val);
    return 0n;
  };

  const filtered = weddings.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.clientName.toLowerCase().includes(search.toLowerCase()) ||
      w.destination.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (profitabilityFilter === "PROFIT") return w.isProfitable;
    if (profitabilityFilter === "DEFICIT") return !w.isProfitable;
    return true;
  });

  return (
    <Card className="border-sand-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-sand-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-serif font-bold text-charcoal-900">
              Wedding P&amp;L Drill-Down
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-500 mt-0.5">
              Granular project profitability answering:{" "}
              <strong className="text-charcoal-700">Which weddings made money and which did not?</strong>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search wedding, couple, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-sand-300 bg-sand-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={profitabilityFilter}
              onChange={(e) => setProfitabilityFilter(e.target.value as "ALL" | "PROFIT" | "DEFICIT")}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-sand-300 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="PROFIT">Profitable Only</option>
              <option value="DEFICIT">Deficit / At Risk</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-sand-50/80 text-charcoal-600 font-semibold border-b border-sand-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Wedding &amp; Destination</th>
                <th className="py-2.5 px-3">Package</th>
                <th className="py-2.5 px-3 text-right">Contracted (INR)</th>
                <th className="py-2.5 px-3 text-right">Committed (INR)</th>
                <th className="py-2.5 px-3 text-right">Projected Profit</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
                <th className="py-2.5 px-4 text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-500">
                    No wedding records match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const rev = toBigInt(w.contractedRevenuePaise);
                  const cost = toBigInt(w.committedCostsPaise);
                  const profit = toBigInt(w.projectedProfitPaise);

                  return (
                    <tr key={w.id} className="hover:bg-sand-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{w.title}</div>
                        <div className="text-[11px] text-charcoal-500">
                          {w.clientName} • {w.destination}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] border-sand-300 text-charcoal-700">
                          {w.packageType}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-charcoal-900">
                        {formatRupees(rev)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-charcoal-700">
                        {formatRupees(cost)}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold ${w.isProfitable ? "text-emerald-700" : "text-ruby-700"}`}>
                        {formatRupees(profit)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-charcoal-800">
                        {w.projectedMarginPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {w.isProfitable ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                            Profitable
                          </Badge>
                        ) : (
                          <Badge className="bg-ruby-100 text-ruby-800 border-ruby-300 text-[10px] font-semibold">
                            <XCircle className="w-3 h-3 mr-1 inline" />
                            Deficit
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
