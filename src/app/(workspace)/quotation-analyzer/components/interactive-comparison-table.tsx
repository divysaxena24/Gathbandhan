"use client";

import React, { useState, useMemo } from "react";
import {
  MultiVendorComparisonResult,
  ComparedVendorSummary,
  ComparisonMatrixRow,
  EvidenceDetailRecord,
} from "@/lib/ai/comparison-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table as TableIcon,
  ArrowUpDown,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Coins,
  Layers,
  Calendar,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";

interface InteractiveComparisonTableProps {
  comparisonResult: MultiVendorComparisonResult;
  onSelectVendorDrilldown: (vendorId: string) => void;
  onInspectEvidence?: (record: EvidenceDetailRecord) => void;
}

type SortOption = "rank" | "price_asc" | "price_desc" | "coverage" | "audit";
type FilterCategory = "all" | "commercial" | "scope" | "terms" | "financial_audit";

export function InteractiveComparisonTable({
  comparisonResult,
  onSelectVendorDrilldown,
  onInspectEvidence,
}: InteractiveComparisonTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [disabledVendorIds, setDisabledVendorIds] = useState<Set<string>>(new Set());

  const { vendors, matrix, scoring, recommendation } = comparisonResult;

  // Toggle vendor visibility
  const toggleVendor = (vendorId: string) => {
    setDisabledVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        // Prevent disabling all vendors
        if (next.size < vendors.length - 1) {
          next.add(vendorId);
        }
      }
      return next;
    });
  };

  const enableAllVendors = () => {
    setDisabledVendorIds(new Set());
  };

  // Filter vendors by disabled set and sort
  const visibleVendors = useMemo(() => {
    const list = vendors.filter((v) => !disabledVendorIds.has(v.uploadId));

    return [...list].sort((a, b) => {
      const scoreA = scoring.vendorScores[a.uploadId]?.totalScore ?? 0;
      const scoreB = scoring.vendorScores[b.uploadId]?.totalScore ?? 0;
      const priceA = a.calculatedGrandTotal ?? a.statedGrandTotal ?? 0;
      const priceB = b.calculatedGrandTotal ?? b.statedGrandTotal ?? 0;

      switch (sortBy) {
        case "rank":
          return scoreB - scoreA;
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "coverage":
          return b.inclusionsCount - a.inclusionsCount;
        case "audit":
          // Matched first, then fewer discrepancies
          if (a.financialAuditStatus === "MATCHED" && b.financialAuditStatus !== "MATCHED") return -1;
          if (b.financialAuditStatus === "MATCHED" && a.financialAuditStatus !== "MATCHED") return 1;
          return a.discrepancyCount - b.discrepancyCount;
        default:
          return 0;
      }
    });
  }, [vendors, disabledVendorIds, sortBy, scoring]);

  // Filter matrix rows by category
  const filteredMatrix = useMemo(() => {
    if (selectedCategory === "all") return matrix;
    return matrix.filter((row) => row.category === selectedCategory);
  }, [matrix, selectedCategory]);

  const formatCurrency = (amount: number | null | undefined, currency = "INR") => {
    if (amount === null || amount === undefined || isNaN(amount)) return "—";
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <Card className="border border-border/70 shadow-xs bg-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground font-display">
              <TableIcon className="w-4 h-4 text-gold-600" />
              Interactive Multi-Vendor Comparison Matrix
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Side-by-side comparative analysis with dynamic sorting, category filtering, and risk highlighting.
            </CardDescription>
          </div>

          {/* Sort Controller */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-background border border-border/70 rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-gold"
            >
              <option value="rank">Composite Score (Rank)</option>
              <option value="price_asc">Lowest Price (Ascending)</option>
              <option value="price_desc">Highest Price (Descending)</option>
              <option value="coverage">Most Inclusions (Coverage)</option>
              <option value="audit">Best Financial Audit</option>
            </select>
          </div>
        </div>

        {/* Vendor Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40 mt-3 text-xs">
          <span className="text-muted-foreground font-medium">Visible Vendors:</span>
          {vendors.map((v) => {
            const isVisible = !disabledVendorIds.has(v.uploadId);
            return (
              <button
                key={v.uploadId}
                onClick={() => toggleVendor(v.uploadId)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  isVisible
                    ? "bg-gold/15 text-charcoal-950 dark:text-gold-300 border-gold/40 shadow-2xs"
                    : "bg-muted/40 text-muted-foreground border-border/50 line-through opacity-60"
                }`}
              >
                {isVisible && <Check className="w-3 h-3 text-gold-700 dark:text-gold-400" />}
                {v.vendorName}
              </button>
            );
          })}
          {disabledVendorIds.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={enableAllVendors}
              className="text-[11px] h-6 px-2 text-gold-700 dark:text-gold-400"
            >
              Reset All
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 pt-2 overflow-x-auto text-xs">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="text-xs h-7 px-2.5"
          >
            All Matrix Rows ({matrix.length})
          </Button>
          <Button
            variant={selectedCategory === "commercial" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("commercial")}
            className="text-xs h-7 px-2.5"
          >
            <Coins className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            Commercial & Pricing
          </Button>
          <Button
            variant={selectedCategory === "scope" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("scope")}
            className="text-xs h-7 px-2.5"
          >
            <Layers className="w-3.5 h-3.5 mr-1 text-blue-500" />
            Scope & Deliverables
          </Button>
          <Button
            variant={selectedCategory === "terms" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("terms")}
            className="text-xs h-7 px-2.5"
          >
            <Calendar className="w-3.5 h-3.5 mr-1 text-purple-500" />
            Terms & Milestones
          </Button>
          <Button
            variant={selectedCategory === "financial_audit" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("financial_audit")}
            className="text-xs h-7 px-2.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Audit & Safety
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40">
                <th className="py-3 px-4 font-bold text-foreground w-[240px] min-w-[200px] sticky left-0 bg-muted/40 z-10">
                  Comparison Metric / Criterion
                </th>
                {visibleVendors.map((vendor) => {
                  const score = scoring.vendorScores[vendor.uploadId];
                  const isTop = recommendation.recommendedVendorId === vendor.uploadId;

                  return (
                    <th
                      key={vendor.uploadId}
                      className={`py-3 px-4 font-bold min-w-[200px] border-l border-border/60 ${
                        isTop ? "bg-gold/10" : "bg-card"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display text-sm text-foreground truncate" title={vendor.vendorName}>
                            {vendor.vendorName}
                          </span>
                          {isTop && (
                            <Badge className="bg-gold text-charcoal-950 font-bold text-[10px] shrink-0">
                              Top Pick
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px] font-normal">
                          <span className="text-muted-foreground">{vendor.category}</span>
                          {score && (
                            <span className="font-mono font-bold text-gold-700 dark:text-gold-400">
                              #{score.rank} ({score.totalScore} pts)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {formatCurrency(vendor.calculatedGrandTotal ?? vendor.statedGrandTotal, vendor.currency)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectVendorDrilldown(vendor.uploadId)}
                            className="h-6 text-[10px] px-1.5 text-gold-700 dark:text-gold-400 hover:text-gold-800 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Drilldown
                          </Button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50">
              {filteredMatrix.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground sticky left-0 bg-card z-10 border-r border-border/60 shadow-xs">
                    <div className="flex flex-col">
                      <span>{row.criterion}</span>
                      {row.notes && (
                        <span className="text-[10px] text-muted-foreground font-normal mt-0.5">{row.notes}</span>
                      )}
                    </div>
                  </td>

                  {visibleVendors.map((vendor) => {
                    const val = row.values[vendor.uploadId];
                    const isBest = row.highlightBest === vendor.uploadId;

                    return (
                      <td
                        key={vendor.uploadId}
                        className={`py-2.5 px-4 border-l border-border/50 ${
                          isBest ? "bg-emerald-500/5 font-semibold" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`${
                              isBest
                                ? "text-emerald-700 dark:text-emerald-400"
                                : val === false || val === "Discrepancy" || val === "Not Provided"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-foreground"
                            }`}
                          >
                            {typeof val === "boolean" ? (
                              val ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                                  <AlertCircle className="w-3.5 h-3.5" /> No
                                </span>
                              )
                            ) : val !== null && val !== undefined ? (
                              String(val)
                            ) : (
                              "—"
                            )}
                          </span>

                          {isBest && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 border-emerald-500/40 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                            >
                              Best
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Missing Information Alerts Row */}
              <tr className="bg-amber-500/5 border-t-2 border-amber-500/20">
                <td className="py-3 px-4 font-bold text-amber-800 dark:text-amber-400 sticky left-0 bg-card z-10 border-r border-border/60">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Missing Information Alerts
                  </div>
                </td>
                {visibleVendors.map((vendor) => (
                  <td key={vendor.uploadId} className="py-3 px-4 border-l border-border/50 align-top">
                    {vendor.missingInfoAlerts.length === 0 ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Fully Detailed
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {vendor.missingInfoAlerts.map((alert, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 justify-start"
                          >
                            ⚠ {alert}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
