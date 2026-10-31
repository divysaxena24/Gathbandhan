"use client";

import React from "react";
import { Award, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupees } from "@/lib/money";
import { PackageProfitability } from "@/modules/analytics/types";

interface PackageMarginComparisonProps {
  packages: PackageProfitability[];
}

export function PackageMarginComparison({ packages }: PackageMarginComparisonProps) {
  const toBigInt = (val: unknown): bigint => {
    if (typeof val === "bigint") return val;
    if (typeof val === "string" || typeof val === "number") return BigInt(val);
    return 0n;
  };

  // Find best margin package
  const sorted = [...packages].sort((a, b) => b.averageMarginPct - a.averageMarginPct);
  const bestPackageType = sorted[0]?.packageType;

  return (
    <Card className="border-sand-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-sand-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-serif font-bold text-charcoal-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-600" />
              Package Margin Analysis
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-500 mt-0.5">
              Comparative profitability answering:{" "}
              <strong className="text-charcoal-700">Which wedding package has the best margin?</strong>
            </CardDescription>
          </div>
          {sorted[0] && (
            <Badge className="bg-gold-100 text-gold-900 border-gold-300 text-xs px-2.5 py-1 flex items-center gap-1.5 self-start sm:self-auto">
              <Award className="w-3.5 h-3.5 text-gold-700" />
              Top Margin: {sorted[0].label} ({sorted[0].averageMarginPct.toFixed(1)}%)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const isBest = pkg.packageType === bestPackageType;
            const rev = toBigInt(pkg.totalRevenuePaise);
            const cost = toBigInt(pkg.totalCostPaise);
            const profit = toBigInt(pkg.totalProfitPaise);

            return (
              <div
                key={pkg.packageType}
                className={`p-4 rounded-xl border relative transition-all ${
                  isBest
                    ? "bg-gradient-to-br from-gold-50/60 via-white to-gold-50/30 border-gold-400 shadow-sm ring-1 ring-gold-200"
                    : "bg-sand-50/50 border-sand-200 hover:border-sand-300"
                }`}
              >
                {isBest && (
                  <div className="absolute -top-2.5 right-4">
                    <Badge className="bg-gold text-charcoal text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      <Sparkles className="w-3 h-3 mr-1 inline" />
                      Highest Margin
                    </Badge>
                  </div>
                )}

                <h3 className="font-serif font-bold text-sm text-charcoal-900 mb-1">
                  {pkg.label}
                </h3>
                <p className="text-xs text-charcoal-500 mb-3">
                  {pkg.weddingCount} {pkg.weddingCount === 1 ? "Wedding" : "Weddings"} Booked
                </p>

                <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-sand-200">
                  <span className="text-xs text-charcoal-600">Average Margin</span>
                  <span className={`text-2xl font-serif font-bold ${isBest ? "text-gold-700" : "text-charcoal-900"}`}>
                    {pkg.averageMarginPct.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-charcoal-500">
                    <span>Total Revenue:</span>
                    <span className="font-mono font-medium text-charcoal-900">
                      {formatRupees(rev)}
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-500">
                    <span>Committed Costs:</span>
                    <span className="font-mono text-charcoal-700">
                      {formatRupees(cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-700 pt-1 border-t border-sand-200/60 font-medium">
                    <span>Net Profit:</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {formatRupees(profit)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
