"use client";

import React, { useState } from "react";
import {
  Award,
  Clock,
  DollarSign,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupees } from "@/lib/money";
import { VendorReliabilityMetrics } from "@/modules/analytics/types";

interface VendorReliabilityTableProps {
  vendors: VendorReliabilityMetrics[];
}

export function VendorReliabilityTable({ vendors }: VendorReliabilityTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "WATCHLIST_RISK" | "REPEATED_LATE" | "OVER_BUDGET">("ALL");

  const toBigInt = (val: unknown): bigint => {
    if (typeof val === "bigint") return val;
    if (typeof val === "string" || typeof val === "number") return BigInt(val);
    return 0n;
  };

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "WATCHLIST_RISK") {
      return v.reliabilityGrade === "WATCHLIST" || v.reliabilityGrade === "RISK";
    }
    if (filter === "REPEATED_LATE") return v.isRepeatedlyLate;
    if (filter === "OVER_BUDGET") return v.isRepeatedlyOverBudget;
    return true;
  });

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "ELITE":
        return <Badge className="bg-gold text-charcoal font-bold text-[10px]">ELITE (90+)</Badge>;
      case "RELIABLE":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">RELIABLE</Badge>;
      case "WATCHLIST":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">WATCHLIST</Badge>;
      case "RISK":
        return <Badge className="bg-ruby-100 text-ruby-800 border-ruby-300 text-[10px]">HIGH RISK</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-sand-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-sand-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-serif font-bold text-charcoal-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-gold-600" />
              Vendor Reliability &amp; Performance Ratings
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-500 mt-0.5">
              Weighted composite scores (Punctuality 35%, Incidents 30%, Budget 20%, Quality 15%) answering:{" "}
              <strong className="text-charcoal-700">Which vendors are late or over budget repeatedly?</strong>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search vendor, category, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-sand-300 bg-sand-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "ALL" | "WATCHLIST_RISK" | "REPEATED_LATE" | "OVER_BUDGET")}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-sand-300 bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="ALL">All Vendors</option>
              <option value="WATCHLIST_RISK">Watchlist &amp; Risk Only</option>
              <option value="REPEATED_LATE">Repeatedly Late</option>
              <option value="OVER_BUDGET">Over Budget Invoices</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-sand-50/80 text-charcoal-600 font-semibold border-b border-sand-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Vendor &amp; Category</th>
                <th className="py-2.5 px-3">City &amp; Tier</th>
                <th className="py-2.5 px-3 text-center">Punctuality (35%)</th>
                <th className="py-2.5 px-3 text-center">Incident Freedom (30%)</th>
                <th className="py-2.5 px-3 text-center">Budget Adherence (20%)</th>
                <th className="py-2.5 px-3 text-center">Overall Score</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-4">Alert Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-500">
                    No vendors match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const variance = toBigInt(v.costVariancePaise);

                  return (
                    <tr key={v.vendorId} className="hover:bg-sand-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{v.vendorName}</div>
                        <div className="text-[11px] text-charcoal-500">
                          {v.category} • {v.totalEngagements} {v.totalEngagements === 1 ? "Wedding" : "Weddings"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-charcoal-700">{v.city}</div>
                        <Badge variant="outline" className="text-[9px] border-sand-300 text-charcoal-500">
                          {v.tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-medium text-charcoal-800">
                          {v.punctualityScore}%
                        </div>
                        <div className="text-[10px] text-charcoal-400">
                          {v.onTimeCheckIns}/{v.checkInTotal} on-time
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-medium text-charcoal-800">
                          {v.incidentFreedomScore}%
                        </div>
                        <div className="text-[10px] text-charcoal-400">
                          {v.incidentCount} incidents
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono font-medium text-charcoal-800">
                          {v.budgetAdherenceScore}%
                        </div>
                        {variance > 0n && (
                          <div className="text-[10px] text-ruby-600 font-mono">
                            +{formatRupees(variance)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="text-sm font-serif font-bold text-charcoal-900">
                          {v.overallScore}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {getGradeBadge(v.reliabilityGrade)}
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        {v.isSparseData && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300 block w-fit">
                            Sparse Data (&lt;3 samples)
                          </Badge>
                        )}
                        {v.isRepeatedlyLate && (
                          <Badge className="bg-ruby-100 text-ruby-800 border-ruby-300 text-[9px] block w-fit">
                            <Clock className="w-2.5 h-2.5 mr-0.5 inline" /> Repeatedly Late
                          </Badge>
                        )}
                        {v.isRepeatedlyOverBudget && (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[9px] block w-fit">
                            <DollarSign className="w-2.5 h-2.5 mr-0.5 inline" /> Over Budget
                          </Badge>
                        )}
                        {!v.isSparseData && !v.isRepeatedlyLate && !v.isRepeatedlyOverBudget && (
                          <span className="text-[11px] text-emerald-700 font-medium">Clean Record</span>
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
