"use client";

import React, { useState } from "react";
import {
  MultiVendorComparisonResult,
  ComparisonWeights,
  ComparisonScenarioType,
  SCENARIO_PRESETS,
  EvidenceDetailRecord,
} from "@/lib/ai/comparison-types";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Loader2,
  Building2,
  Coins,
  ShieldCheck,
  Layers,
  HelpCircle,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { ComparisonCharts } from "./comparison-charts";
import { InteractiveScoringControls } from "./interactive-scoring-controls";
import { InteractiveComparisonTable } from "./interactive-comparison-table";
import { VendorDrilldownSheet } from "./vendor-drilldown-sheet";
import { EvidenceInspectorDrawer } from "./evidence-inspector-drawer";

interface VendorComparisonDashboardProps {
  comparisonResult: MultiVendorComparisonResult;
  analyzedQuotations?: QuotationAnalysisResult[];
  onRecalculateWeights: (weights: Partial<ComparisonWeights>) => Promise<void>;
  isRecalculating: boolean;
  onOpenPdfPage?: (uploadId: string, pageNumber: number) => void;
  onClose?: () => void;
}

export function VendorComparisonDashboard({
  comparisonResult,
  analyzedQuotations = [],
  onRecalculateWeights,
  isRecalculating,
  onOpenPdfPage,
  onClose,
}: VendorComparisonDashboardProps) {
  const [selectedDrilldownVendorId, setSelectedDrilldownVendorId] = useState<string | null>(null);
  const [inspectingEvidence, setInspectingEvidence] = useState<EvidenceDetailRecord | null>(null);
  const [checkedClarifications, setCheckedClarifications] = useState<Record<string, boolean>>({});
  const [activeScenario, setActiveScenario] = useState<ComparisonScenarioType>("balanced");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const {
    vendors,
    scoring,
    recommendation,
    categoryCompatibility,
    currencyCompatibility,
    alerts,
  } = comparisonResult;

  // Selected vendor objects for drilldown
  const drilldownVendorSummary = selectedDrilldownVendorId
    ? vendors.find((v) => v.uploadId === selectedDrilldownVendorId) || null
    : null;

  const drilldownQuotationResult = selectedDrilldownVendorId
? analyzedQuotations.find((q) => (q?.uploadId || (q as any)?.meta?.uploadId) === selectedDrilldownVendorId) || null
    : null;

  const drilldownVendorScore = selectedDrilldownVendorId
    ? scoring.vendorScores[selectedDrilldownVendorId]
    : undefined;

  // KPI Calculations
  const prices = vendors
    .map((v) => v.calculatedGrandTotal ?? v.statedGrandTotal)
    .filter((p): p is number => p !== null && !isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const priceSpread = maxPrice - minPrice;

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

  const handleApplyWeights = async (
    newWeights: ComparisonWeights,
    scenarioId: ComparisonScenarioType = "custom"
  ) => {
    setActiveScenario(scenarioId);
    await onRecalculateWeights(newWeights);
  };

  const toggleClarification = (key: string) => {
    setCheckedClarifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Export PDF Report
  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/quotation-analyzer/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comparisonResult,
          analyzedQuotations,
          activeScenario,
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
      toast.error("PDF Export failed", { description: err.message });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold-700 dark:text-gold-400 font-bold border border-gold/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-display text-foreground">
                Vendor Comparison Dashboard
              </h1>
              <Badge className="bg-gold text-charcoal-950 font-bold text-[10px]">
                {vendors.length} Vendors Evaluated
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audited Commercials • Dynamic Sensitivity Scenarios • Source Citations
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="text-xs h-8"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
            )}
            {isExportingPdf ? "Generating PDF..." : "Export PDF Report"}
          </Button>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Category & Currency Alerts */}
      {!categoryCompatibility.isCompatible && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{categoryCompatibility.warningMessage}</span>
        </div>
      )}

      {/* SECTION 1: EXECUTIVE RECOMMENDATION HERO CARD */}
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
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40"
                      : "border-amber-500 text-amber-700 bg-amber-50/70 dark:bg-amber-950/40"
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
            <div className="text-xs uppercase font-semibold text-gold-700 dark:text-gold-400">Audit Status</div>
            <div className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5 justify-start md:justify-end">
              {recommendation.financialAuditAssessment.status === "VERIFIED" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">100% Math Verified</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">Math Warning</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
              {recommendation.financialAuditAssessment.details}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDrilldownVendorId(recommendation.recommendedVendorId)}
              className="mt-2.5 text-xs h-7 w-full border-gold/50 text-gold-800 dark:text-gold-300 hover:bg-gold/10"
            >
              Drill Down Winner
            </Button>
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
              Commercial Trade-offs & Disadvantages
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

        {/* Questions to Clarify Before Signing */}
        {recommendation.questionsToClarifyBeforeSigning.length > 0 && (
          <div className="mt-4 bg-card/70 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-sm mb-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Pre-Contract Clarification Checklist for Planner
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {recommendation.questionsToClarifyBeforeSigning.map((q, idx) => {
                const key = `rec-q-${idx}`;
                const isChecked = !!checkedClarifications[key];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleClarification(key)}
                    className="flex items-start gap-2 p-2 rounded-lg bg-background/60 hover:bg-muted/40 cursor-pointer text-xs transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <span className={isChecked ? "line-through text-muted-foreground" : "text-foreground"}>
                      {q}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: KPI SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/70 p-4 space-y-1 bg-card">
          <div className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Recommended Vendor</span>
            <Award className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-base font-bold text-foreground font-display truncate">
            {recommendation.recommendedVendorName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
            Score:{" "}
            <span className="font-bold text-gold-700 dark:text-gold-400">
              {scoring.vendorScores[recommendation.recommendedVendorId]?.totalScore ?? "—"}/100
            </span>
          </div>
        </Card>

        <Card className="border border-border/70 p-4 space-y-1 bg-card">
          <div className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Lowest Quoted Price</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-foreground font-mono">
            {formatCurrency(minPrice)}
          </div>
          <div className="text-xs text-muted-foreground">
            Spread: <span className="font-mono font-medium">+{formatCurrency(priceSpread)}</span>
          </div>
        </Card>

        <Card className="border border-border/70 p-4 space-y-1 bg-card">
          <div className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Average Quoted Cost</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base font-bold text-foreground font-mono">
            {formatCurrency(avgPrice)}
          </div>
          <div className="text-xs text-muted-foreground">Across {vendors.length} comparable proposals</div>
        </Card>

        <Card className="border border-border/70 p-4 space-y-1 bg-card">
          <div className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Math Audit Integrity</span>
            <ShieldCheck className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-base font-bold text-foreground">
            {vendors.filter((v) => v.financialAuditStatus === "MATCHED").length} / {vendors.length} Verified
          </div>
          <div className="text-xs text-muted-foreground">
            {alerts.financialDiscrepancies.length === 0
              ? "0 arithmetic mismatches"
              : `${alerts.financialDiscrepancies.length} discrepancy warnings`}
          </div>
        </Card>
      </div>

      {/* SECTION 3: INTERACTIVE SCORING CONTROLS */}
      <InteractiveScoringControls
        currentWeights={scoring.weights}
        onApplyWeights={handleApplyWeights}
        isRecalculating={isRecalculating}
        baselineWinnerName={recommendation.recommendedVendorName}
        currentWinnerName={recommendation.recommendedVendorName}
        activeScenario={activeScenario}
      />

      {/* SECTION 4: INTERACTIVE VISUAL CHARTS */}
      <ComparisonCharts
        comparisonResult={comparisonResult}
        analyzedQuotations={analyzedQuotations}
        onSelectVendor={(vId) => setSelectedDrilldownVendorId(vId)}
      />

      {/* SECTION 5: INTERACTIVE COMPARISON MATRIX TABLE */}
      <InteractiveComparisonTable
        comparisonResult={comparisonResult}
        onSelectVendorDrilldown={(vId) => setSelectedDrilldownVendorId(vId)}
        onInspectEvidence={(rec) => setInspectingEvidence(rec)}
      />

      {/* VENDOR DRILLDOWN SHEET */}
      <VendorDrilldownSheet
        isOpen={!!selectedDrilldownVendorId}
        onClose={() => setSelectedDrilldownVendorId(null)}
        vendorSummary={drilldownVendorSummary}
        quotationResult={drilldownQuotationResult}
        vendorScore={drilldownVendorScore}
        onInspectEvidence={(rec) => setInspectingEvidence(rec)}
        onOpenPdfPage={onOpenPdfPage}
      />

      {/* EVIDENCE INSPECTOR DRAWER */}
      <EvidenceInspectorDrawer
        isOpen={!!inspectingEvidence}
        onClose={() => setInspectingEvidence(null)}
        record={inspectingEvidence}
        onOpenPdfPage={onOpenPdfPage}
      />
    </div>
  );
}
