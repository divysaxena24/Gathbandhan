/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import {
  MultiVendorComparisonResult,
  ComparisonWeights,
  DEFAULT_COMPARISON_WEIGHTS,
} from "@/lib/ai/comparison-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  ShieldCheck,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight,
  Receipt,
  Layers,
  Coins,
  Calendar,
  CheckSquare,
  Square,
  Building2,
  Info,
  RefreshCw,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface VendorComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisonResult: MultiVendorComparisonResult | null;
  onRecalculateWeights: (weights: Partial<ComparisonWeights>) => Promise<void>;
  isRecalculating: boolean;
}

export function VendorComparisonModal({
  isOpen,
  onClose,
  comparisonResult,
  onRecalculateWeights,
  isRecalculating,
}: VendorComparisonModalProps) {
  const [activeTab, setActiveTab] = useState<string>("recommendation");
  const [checkedClarifications, setCheckedClarifications] = useState<Record<string, boolean>>({});
  const [activePreset, setActivePreset] = useState<"balanced" | "cost" | "coverage" | "custom">("balanced");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/quotation-analyzer/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonResult,
          metadata: {
            eventName: "Wedding Proposal Comparison",
            generatedAt: new Date().toLocaleDateString(),
            preparedBy: "Gathbandhan AI Quotation Analyzer",
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate PDF report.");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "Gathbandhan_Vendor_Comparison.pdf";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF Report downloaded successfully!");
    } catch (err: any) {
      toast.error("PDF Export Failed", { description: err.message });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      const res = await fetch("/api/quotation-analyzer/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonResult,
          metadata: {
            eventName: "Wedding Proposal Comparison",
            generatedAt: new Date().toLocaleDateString(),
            preparedBy: "Gathbandhan AI Quotation Analyzer",
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate Excel report.");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "Gathbandhan_Vendor_Comparison.xlsx";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel Workbook downloaded successfully!");
    } catch (err: any) {
      toast.error("Excel Export Failed", { description: err.message });
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!isOpen || !comparisonResult) return null;

  const {
    recommendation,
    scoring,
    matrix,
    vendors,
    categoryCompatibility,
    currencyCompatibility,
    alerts,
  } = comparisonResult;

  const toggleClarification = (index: number) => {
    setCheckedClarifications((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleApplyPreset = async (preset: "balanced" | "cost" | "coverage") => {
    setActivePreset(preset);
    let weights: Partial<ComparisonWeights>;
    if (preset === "cost") {
      weights = {
        costCompetitiveness: 50,
        serviceCoverage: 20,
        qualityAndPortfolio: 10,
        pastPerformance: 10,
        commercialTerms: 5,
        transparency: 5,
      };
    } else if (preset === "coverage") {
      weights = {
        costCompetitiveness: 15,
        serviceCoverage: 45,
        qualityAndPortfolio: 15,
        pastPerformance: 10,
        commercialTerms: 10,
        transparency: 5,
      };
    } else {
      weights = DEFAULT_COMPARISON_WEIGHTS;
    }
    await onRecalculateWeights(weights);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal-950/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-card border border-gold/30 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-foreground">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 border-b border-gold/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/50 flex items-center justify-center text-gold shadow-xs">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold font-display text-white">
                  Vendor Comparison & Strategic Recommendation
                </h3>
                <Badge variant="outline" className="border-gold/60 text-gold-300 bg-gold/10 text-xs font-semibold">
                  {vendors.length} Quotations Analyzed
                </Badge>
                {categoryCompatibility.isCompatible && (
                  <Badge variant="secondary" className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
                    {categoryCompatibility.primaryCategory}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-charcoal-300 mt-0.5">
                Objective multi-dimensional weighted scoring, Groq AI pros/cons audit, and exactly one final recommendation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compatibility Warning Banners */}
        {!categoryCompatibility.isCompatible && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{categoryCompatibility.warningMessage}</span>
          </div>
        )}

        {!currencyCompatibility.isCompatible && (
          <div className="bg-blue-500/15 border-b border-blue-500/30 px-6 py-2.5 flex items-center gap-3 text-blue-800 dark:text-blue-300 text-xs">
            <Info className="w-4 h-4 shrink-0 text-blue-500" />
            <span>{currencyCompatibility.warningMessage}</span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="px-6 pt-3 bg-muted/30 border-b border-border/60 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/80 p-1 rounded-xl">
              <TabsTrigger value="recommendation" className="text-xs font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Final Recommendation
              </TabsTrigger>
              <TabsTrigger value="matrix" className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Comparison Matrix
              </TabsTrigger>
              <TabsTrigger value="scoring" className="text-xs font-semibold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
                Scoring Breakdown ({scoring.rankings.length})
              </TabsTrigger>
              <TabsTrigger value="proscons" className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                AI Pros & Cons
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Risk & Alerts ({alerts.financialDiscrepancies.length + alerts.hiddenCharges.length + alerts.missingCriticalInfo.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: FINAL RECOMMENDATION */}
          {activeTab === "recommendation" && (
            <div className="space-y-6">
              {/* Grand Recommendation Banner */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-gold/60 bg-gradient-to-br from-gold/15 via-gold/5 to-transparent p-6 shadow-md">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-charcoal-950 font-bold shadow-md shrink-0">
                      <Award className="w-8 h-8 text-charcoal-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-gold text-charcoal-950 font-bold px-2.5 py-0.5 text-xs shadow-xs">
                          RANK #1 RECOMMENDATION
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${
                            recommendation.confidenceLevel === "HIGH"
                              ? "border-emerald-500 text-emerald-700 bg-emerald-50/70"
                              : "border-amber-500 text-amber-700 bg-amber-50/70"
                          }`}
                        >
                          Confidence: {recommendation.confidenceLevel}
                        </Badge>
                        {recommendation.isProvisional && (
                          <Badge variant="outline" className="border-amber-600 bg-amber-50 text-amber-800 text-xs font-semibold">
                            ⚠️ Provisional Match
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold font-display text-foreground mt-2">
                        {recommendation.headline}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                        {recommendation.executiveSummary}
                      </p>
                    </div>
                  </div>

                  <div className="text-left md:text-right shrink-0 bg-card/80 p-3.5 rounded-xl border border-gold/40 shadow-xs">
                    <div className="text-xs uppercase font-semibold text-gold-700">Audit Status</div>
                    <div className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5 justify-start md:justify-end">
                      {recommendation.financialAuditAssessment.status === "VERIFIED" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">100% Math Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-700">Math Warning</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
                      {recommendation.financialAuditAssessment.details}
                    </div>
                  </div>
                </div>

                {/* Major Advantages vs Commercial Trade-offs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gold/30">
                  <div className="bg-card/70 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Major Commercial Advantages
                    </div>
                    <ul className="space-y-2 text-xs text-foreground">
                      {recommendation.majorAdvantages.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card/70 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Commercial Disadvantages & Trade-offs
                    </div>
                    <ul className="space-y-2 text-xs text-foreground">
                      {recommendation.commercialDisadvantages.map((dis, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{dis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Questions Planner Must Clarify Before Signing */}
                <div className="mt-6 pt-6 border-t border-gold/30">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-3">
                    <HelpCircle className="w-4 h-4 text-gold-600" />
                    Essential Questions to Clarify Before Signing Contract
                  </div>
                  <div className="space-y-2">
                    {recommendation.questionsToClarifyBeforeSigning.map((q, idx) => {
                      const isChecked = Boolean(checkedClarifications[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleClarification(idx)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500/40 text-muted-foreground line-through"
                              : "bg-card border-border/70 hover:border-gold/60 text-foreground"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-gold-600">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="leading-relaxed">{q}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Advisory Notice Footer */}
                <div className="mt-6 pt-4 border-t border-gold/20 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="italic">{recommendation.advisoryNotice}</span>
                  <Badge variant="outline" className="border-border text-[10px]">
                    Advisory Recommendation
                  </Badge>
                </div>
              </div>

              {/* Quick Rankings Podium */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold-600" />
                  All Compared Vendors Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {scoring.rankings.map((rankItem) => {
                    const vendor = vendors.find((v) => v.uploadId === rankItem.uploadId);
                    const breakdown = scoring.vendorScores[rankItem.uploadId];
                    const isWinner = rankItem.rank === 1;

                    return (
                      <Card
                        key={rankItem.uploadId}
                        className={`transition-all ${
                          isWinner
                            ? "border-2 border-gold shadow-md bg-gold/5"
                            : "border-border/60 hover:border-border bg-card"
                        }`}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={`text-xs font-bold ${
                                isWinner
                                  ? "bg-gold text-charcoal-950 font-bold"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              Rank #{rankItem.rank}
                            </Badge>
                            <span className="text-lg font-bold font-display text-foreground">
                              {rankItem.totalScore}
                              <span className="text-xs font-normal text-muted-foreground">/100</span>
                            </span>
                          </div>

                          <div>
                            <h5 className="font-semibold text-sm text-foreground truncate" title={rankItem.vendorName}>
                              {rankItem.vendorName}
                            </h5>
                            <p className="text-xs text-muted-foreground truncate">{vendor?.category}</p>
                          </div>

                          <div className="pt-2 border-t border-border/60 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quoted Price:</span>
                              <span className="font-bold text-foreground">
                                {vendor?.statedGrandTotal
                                  ? `${vendor.currency} ${vendor.statedGrandTotal.toLocaleString()}`
                                  : "Unstated"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Inclusions:</span>
                              <span className="font-medium">{vendor?.inclusionsCount || 0} items</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Math Audit:</span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  vendor?.financialAuditStatus === "MATCHED"
                                    ? "text-emerald-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {vendor?.financialAuditStatus === "MATCHED" ? "Verified" : "Discrepancy"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPARISON MATRIX */}
          {activeTab === "matrix" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Side-by-Side Comparison Matrix</h4>
                  <p className="text-xs text-muted-foreground">
                    Direct comparison of cost, deliverables, terms, and audit integrity across all {vendors.length} vendors.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Top Benchmark
                  </span>
                </div>
              </div>

              <div className="border border-border/70 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/70 border-b border-border text-charcoal-700 dark:text-charcoal-200">
                      <th className="p-3 font-bold sticky left-0 bg-muted/95 min-w-[180px] z-10">
                        Criteria & Scope
                      </th>
                      {vendors.map((v) => {
                        const rank = scoring.rankings.find((r) => r.uploadId === v.uploadId)?.rank;
                        return (
                          <th key={v.uploadId} className="p-3 font-bold min-w-[200px] border-l border-border">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate max-w-[140px]" title={v.vendorName}>
                                {v.vendorName}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                #{rank}
                              </Badge>
                            </div>
                            <div className="text-[11px] font-normal text-muted-foreground truncate">
                              {v.category}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground sticky left-0 bg-card/95 z-10">
                          <div>{row.criterion}</div>
                          {row.notes && (
                            <div className="text-[10px] text-muted-foreground font-normal">{row.notes}</div>
                          )}
                        </td>
                        {vendors.map((v) => {
                          const val = row.values[v.uploadId];
                          const isBest = row.highlightBest === v.uploadId;
                          return (
                            <td
                              key={v.uploadId}
                              className={`p-3 border-l border-border/60 ${
                                isBest ? "bg-emerald-500/10 font-semibold text-emerald-900 dark:text-emerald-300" : ""
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {isBest && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                <span>{val !== null && val !== undefined ? String(val) : "—"}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SCORING BREAKDOWN */}
          {activeTab === "scoring" && (
            <div className="space-y-6">
              {/* Weights Presets & Controls */}
              <div className="p-4 bg-muted/40 border border-border/70 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-gold-600" />
                      Configurable Weight Model & Dynamic Normalization
                    </h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {scoring.methodologyDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Presets:</span>
                    <Button
                      variant={activePreset === "balanced" ? "default" : "outline"}
                      size="sm"
                      disabled={isRecalculating}
                      onClick={() => handleApplyPreset("balanced")}
                      className="text-xs h-7 px-2.5"
                    >
                      Balanced (Default)
                    </Button>
                    <Button
                      variant={activePreset === "cost" ? "default" : "outline"}
                      size="sm"
                      disabled={isRecalculating}
                      onClick={() => handleApplyPreset("cost")}
                      className="text-xs h-7 px-2.5"
                    >
                      Cost-Focused
                    </Button>
                    <Button
                      variant={activePreset === "coverage" ? "default" : "outline"}
                      size="sm"
                      disabled={isRecalculating}
                      onClick={() => handleApplyPreset("coverage")}
                      className="text-xs h-7 px-2.5"
                    >
                      Coverage-Focused
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-2 border-t border-border/60">
                  <span>Weights:</span>
                  <Badge variant="outline">Cost: {scoring.weights.costCompetitiveness}%</Badge>
                  <Badge variant="outline">Coverage: {scoring.weights.serviceCoverage}%</Badge>
                  <Badge variant="outline">Quality: {scoring.weights.qualityAndPortfolio}%</Badge>
                  <Badge variant="outline">Past Perf: {scoring.weights.pastPerformance}%</Badge>
                  <Badge variant="outline">Terms: {scoring.weights.commercialTerms}%</Badge>
                  <Badge variant="outline">Audit: {scoring.weights.transparency}%</Badge>
                </div>
              </div>

              {/* Vendor Scoring Cards */}
              <div className="space-y-4">
                {scoring.rankings.map((r) => {
                  const breakdown = scoring.vendorScores[r.uploadId];
                  const isTop = r.rank === 1;

                  return (
                    <Card key={r.uploadId} className={`border ${isTop ? "border-gold/60 bg-gold/5" : "border-border/60"}`}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <Badge className={isTop ? "bg-gold text-charcoal-950 font-bold" : "bg-muted text-foreground"}>
                              Rank #{r.rank}
                            </Badge>
                            <h4 className="font-bold text-base text-foreground">{r.vendorName}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Total Weighted Score:</span>
                            <span className="text-xl font-bold font-display text-foreground">{r.totalScore}/100</span>
                          </div>
                        </div>

                        {/* Criteria Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.values(breakdown.criteria).map((crit) => (
                            <div key={crit.key} className="bg-muted/40 p-3 rounded-lg border border-border/50 text-xs space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-foreground truncate">{crit.name}</span>
                                {crit.isAvailable ? (
                                  <span className="font-bold text-foreground">
                                    {crit.normalizedScore}
                                    <span className="text-[10px] text-muted-foreground font-normal">/100</span>
                                  </span>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 border-amber-300">
                                    Not Evaluated
                                  </Badge>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    !crit.isAvailable
                                      ? "bg-transparent"
                                      : crit.normalizedScore >= 80
                                      ? "bg-emerald-500"
                                      : crit.normalizedScore >= 60
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                                  }`}
                                  style={{ width: `${crit.isAvailable ? crit.normalizedScore : 0}%` }}
                                />
                              </div>

                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Adjusted Weight: {crit.adjustedWeight}%</span>
                                <span>Weighted: {crit.weightedScore} pts</span>
                              </div>

                              <p className="text-[10px] text-muted-foreground italic leading-tight pt-1 border-t border-border/40">
                                {crit.evidenceNotes}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AI PROS & CONS */}
          {activeTab === "proscons" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  Evidence-Traceable AI Pros & Cons
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extracted directly from quotation text. Never fabricates reviews or reputation absent from proposals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors.map((v) => {
                  const rank = scoring.rankings.find((r) => r.uploadId === v.uploadId)?.rank;
                  const isTop = rank === 1;

                  return (
                    <Card key={v.uploadId} className={`border ${isTop ? "border-gold shadow-xs" : "border-border/60"}`}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={isTop ? "bg-gold text-charcoal-950 font-bold" : "bg-muted text-muted-foreground"}>
                                #{rank}
                              </Badge>
                              <h5 className="font-bold text-sm text-foreground truncate max-w-[200px]" title={v.vendorName}>
                                {v.vendorName}
                              </h5>
                            </div>
                            <span className="text-xs text-muted-foreground">{v.category}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-foreground">
                              {v.statedGrandTotal ? `${v.currency} ${v.statedGrandTotal.toLocaleString()}` : "Price TBD"}
                            </span>
                          </div>
                        </div>

                        {/* Pros */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Strengths & Inclusions
                          </span>
                          <ul className="space-y-1 text-xs">
                            {v.pros.length > 0 ? (
                              v.pros.map((p, idx) => (
                                <li key={idx} className="flex items-start gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20 text-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span>{p}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-muted-foreground italic">No unique advantages itemized.</li>
                            )}
                          </ul>
                        </div>

                        {/* Cons */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Commercial Trade-offs & Risks
                          </span>
                          <ul className="space-y-1 text-xs">
                            {v.cons.length > 0 ? (
                              v.cons.map((c, idx) => (
                                <li key={idx} className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20 text-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                  <span>{c}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-muted-foreground italic">No critical risks identified.</li>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: RISK & ALERTS */}
          {activeTab === "alerts" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Commercial Auditing & Risk Flags
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mathematical discrepancies, undisclosed fee structures, and critical omissions that require clarification.
                </p>
              </div>

              {/* Financial Discrepancies */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-charcoal-300">
                  Deterministic Financial Audit Warnings ({alerts.financialDiscrepancies.length})
                </h5>
                {alerts.financialDiscrepancies.length === 0 ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    All compared vendor proposals passed 100% mathematical integrity verification!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.financialDiscrepancies.map((flag, idx) => (
                      <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{flag.vendorName}:</span> {flag.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden / Additional Charges */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-charcoal-300">
                  Additional / Incidental Charges ({alerts.hiddenCharges.length})
                </h5>
                {alerts.hiddenCharges.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No extra unexpected surcharge line items flagged.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.hiddenCharges.map((hc, idx) => (
                      <div key={idx} className="p-3 bg-muted/60 border border-border rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-foreground">{hc.vendorName}:</span> {hc.description}
                        </div>
                        <Badge variant="outline">
                          {hc.amount ? `₹${hc.amount.toLocaleString()}` : "Cost Unstated"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Information */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-charcoal-300">
                  Missing Contractual Terms ({alerts.missingCriticalInfo.length} Vendors)
                </h5>
                <div className="space-y-2">
                  {alerts.missingCriticalInfo.map((mi, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-xl text-xs">
                      <span className="font-bold text-foreground">{mi.vendorName}:</span> Missing{" "}
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {mi.missingItems.join(", ")}
                      </span>
                      .
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-muted/40 border-t border-border flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Scale className="w-4 h-4 text-gold-600" />
            <span>Advisory AI Decision Support • Wedding Planner Retains Authority</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="text-xs border-gold/50 hover:bg-gold/10 text-charcoal-900 dark:text-gold-300 font-semibold shadow-xs"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                  Download PDF Report
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="text-xs border-emerald-500/50 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Download Excel Workbook (.xlsx)
                </>
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
              Close Comparison
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
