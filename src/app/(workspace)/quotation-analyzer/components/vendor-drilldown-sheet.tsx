"use client";

import React, { useState } from "react";
import {
  ComparedVendorSummary,
  VendorScoringBreakdown,
  EvidenceDetailRecord,
} from "@/lib/ai/comparison-types";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X,
  Building2,
  Receipt,
  Layers,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Coins,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Award,
  Check,
} from "lucide-react";

interface VendorDrilldownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  vendorSummary: ComparedVendorSummary | null;
  quotationResult: QuotationAnalysisResult | null;
  vendorScore?: VendorScoringBreakdown;
  onInspectEvidence?: (record: EvidenceDetailRecord) => void;
  onOpenPdfPage?: (vendorId: string, pageNumber: number) => void;
}

export function VendorDrilldownSheet({
  isOpen,
  onClose,
  vendorSummary,
  quotationResult,
  vendorScore,
  onInspectEvidence,
  onOpenPdfPage,
}: VendorDrilldownSheetProps) {
  const [activeTab, setActiveTab] = useState<string>("commercial");

  if (!isOpen || !vendorSummary) return null;

  const currency = vendorSummary.currency || "INR";
  const formatCurrency = (amount: number | null | undefined) => {
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

  const lineItems = quotationResult?.commercialDetails?.lineItems || [];
  const taxes = quotationResult?.commercialDetails?.taxes || [];
  const discounts = quotationResult?.commercialDetails?.discounts || [];
  const inclusions = quotationResult?.serviceDetails?.servicesIncluded || [];
  const exclusions = quotationResult?.serviceDetails?.servicesExcluded || [];
  const deliverables = quotationResult?.serviceDetails?.deliverables || [];
  const paymentSchedule = quotationResult?.commercialDetails?.paymentSchedule || [];
  const financialAudit = quotationResult?.financialAudit;

  const handleInspect = (
    category: EvidenceDetailRecord["category"],
    field: string,
    extractedValue: string,
    snippet?: string | null,
    sourcePage?: number | null,
    isExplicit = true
  ) => {
    if (!onInspectEvidence) return;
    onInspectEvidence({
      vendorId: vendorSummary.uploadId,
      vendorName: vendorSummary.vendorName,
      originalFileName: vendorSummary.originalName,
      sourcePage: sourcePage || 1,
      category,
      field,
      extractedValue,
      evidenceSnippet: snippet || extractedValue,
      isExplicit,
      auditStatus: vendorSummary.financialAuditStatus === "MATCHED" ? "VERIFIED" : "DISCREPANCY",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-950/50 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-4xl bg-card border-l border-border/80 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Vendor Drilldown Details"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/70 bg-muted/40 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold-700 dark:text-gold-400 font-bold shrink-0 border border-gold/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-semibold bg-background">
                  {vendorSummary.category}
                </Badge>
                {vendorScore && (
                  <Badge className="bg-gold text-charcoal-950 font-bold text-xs shadow-2xs">
                    Rank #{vendorScore.rank} • {vendorScore.totalScore} Pts
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    vendorSummary.financialAuditStatus === "MATCHED"
                      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                      : "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                  }`}
                >
                  {vendorSummary.financialAuditStatus === "MATCHED" ? "✓ 100% Math Verified" : "⚠ Audit Discrepancy"}
                </Badge>
              </div>
              <h2 className="text-xl font-bold font-display text-foreground mt-1">
                {vendorSummary.vendorName}
              </h2>
              <p className="text-xs text-muted-foreground">
                Original file: <span className="font-mono text-foreground/80">{vendorSummary.originalName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenPdfPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenPdfPage(vendorSummary.uploadId, 1)}
                className="text-xs hidden sm:flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PDF
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close drilldown"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pricing Quick Bar */}
        <div className="px-6 py-3 bg-muted/20 border-b border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground uppercase text-[10px] font-bold">Stated Grand Total</div>
            <div className="text-sm font-bold text-foreground font-mono mt-0.5">
              {formatCurrency(vendorSummary.statedGrandTotal)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase text-[10px] font-bold">Calculated Total</div>
            <div className="text-sm font-bold text-foreground font-mono mt-0.5">
              {formatCurrency(vendorSummary.calculatedGrandTotal)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase text-[10px] font-bold">Inclusions / Exclusions</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              <span className="text-emerald-700 dark:text-emerald-400">{vendorSummary.inclusionsCount} included</span> /{" "}
              <span className="text-amber-700 dark:text-amber-400">{vendorSummary.exclusionsCount} excluded</span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase text-[10px] font-bold">Advance Required</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {vendorSummary.advancePaymentPercent !== null
                ? `${vendorSummary.advancePaymentPercent}%`
                : vendorSummary.advancePaymentAmount !== null
                ? formatCurrency(vendorSummary.advancePaymentAmount)
                : "Not stated"}
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-2 bg-card border-b border-border/60 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/80 p-1 rounded-xl">
              <TabsTrigger value="commercial" className="text-xs font-semibold flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                Line Items ({lineItems.length})
              </TabsTrigger>
              <TabsTrigger value="scope" className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Scope & Deliverables
              </TabsTrigger>
              <TabsTrigger value="terms" className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                Terms & Milestones
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Math Audit Proof
              </TabsTrigger>
              {vendorScore && (
                <TabsTrigger value="scoring" className="text-xs font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gold-600" />
                  Scorecard
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: COMMERCIAL & LINE ITEMS */}
          {activeTab === "commercial" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/70 overflow-hidden bg-card">
                <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Itemized Quotation Line Items
                  </span>
                  <span className="text-xs text-muted-foreground">{lineItems.length} items extracted</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                        <th className="py-2.5 px-3 font-semibold">#</th>
                        <th className="py-2.5 px-3 font-semibold">Description</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Stated Amount</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Unit Math</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-muted-foreground font-sans">
                            No granular line items extracted. Quotation may be lump-sum or unstructured.
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item, idx) => {
                          const hasUnitPriceAndQty =
                            item.quantity !== null &&
                            item.unitPrice !== null &&
                            item.quantity > 0 &&
                            item.unitPrice > 0;
                          const calculatedLineTotal = hasUnitPriceAndQty
                            ? Math.round(item.quantity! * item.unitPrice!)
                            : null;
                          const isLineMismatch =
                            calculatedLineTotal !== null &&
                            item.statedAmount !== null &&
                            Math.abs(calculatedLineTotal - item.statedAmount) > 1;

                          return (
                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-sans font-medium text-foreground max-w-[260px] truncate" title={item.description}>
                                {item.description}
                              </td>
                              <td className="py-2.5 px-3 text-right text-muted-foreground">
                                {item.quantity !== null ? `${item.quantity} ${item.unit || ""}`.trim() : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right text-muted-foreground">
                                {item.unitPrice !== null ? formatCurrency(item.unitPrice) : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-foreground">
                                {item.statedAmount !== null ? formatCurrency(item.statedAmount) : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {!hasUnitPriceAndQty ? (
                                  <span className="text-[10px] text-muted-foreground font-sans">Lump sum</span>
                                ) : isLineMismatch ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-300 font-sans font-semibold">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Mismatch
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300 font-sans font-semibold">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Match
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-sans">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleInspect(
                                      "line_item",
                                      item.description,
                                      formatCurrency(item.statedAmount),
                                      item.evidenceSnippet,
                                      item.sourcePage,
                                      item.isExplicit
                                    )
                                  }
                                  className="h-6 text-[11px] px-1.5 text-gold-700 dark:text-gold-400 hover:text-gold-800"
                                >
                                  P.{item.sourcePage || 1}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-border/70 p-4 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Commercial Breakdown</span>
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Stated Subtotal:</span>
                      <span className="font-mono font-medium">{formatCurrency(quotationResult?.commercialDetails?.statedSubtotal)}</span>
                    </div>
                    {taxes.map((t, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
                        <span>{t.description} {t.ratePercent ? `(${t.ratePercent}%)` : ""}:</span>
                        <span className="font-mono">{formatCurrency(t.statedAmount)}</span>
                      </div>
                    ))}
                    {discounts.map((d, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-border/40 text-emerald-700 dark:text-emerald-400">
                        <span>Discount ({d.description}):</span>
                        <span className="font-mono">-{formatCurrency(d.statedAmount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 text-sm font-bold text-foreground">
                      <span>Stated Grand Total:</span>
                      <span className="font-mono text-gold-700 dark:text-gold-400">{formatCurrency(vendorSummary.statedGrandTotal)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="border border-border/70 p-4 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Deterministic Math Proof</span>
                    <ShieldCheck className="w-4 h-4 text-gold-600" />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Sum of Line Items:</span>
                      <span className="font-mono font-medium">{formatCurrency(financialAudit?.calculatedSubtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Calculated Grand Total:</span>
                      <span className="font-mono font-medium">{formatCurrency(vendorSummary.calculatedGrandTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Total Discrepancy:</span>
                      <span className={`font-mono font-bold ${vendorSummary.discrepancyCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {vendorSummary.discrepancyCount > 0 ? "Discrepancy Detected" : "₹0 (Exact Match)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                      Independent decimal arithmetic validation audits every addition, tax percentage, and item quantity to protect clients against billing surprises.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: SCOPE & DELIVERABLES */}
          {activeTab === "scope" && (
            <div className="space-y-6">
              {/* Inclusions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Included Services & Deliverables ({inclusions.length + deliverables.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {inclusions.concat(deliverables).map((inc, idx) => (
                    <div key={idx} className="bg-card border border-border/70 p-3 rounded-xl flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="text-foreground leading-snug">{inc.text}</span>
                      </div>
                      {inc.sourcePage && (
                        <button
                          onClick={() => handleInspect("inclusion", inc.text, "Included", inc.evidence, inc.sourcePage)}
                          className="text-[10px] text-gold-700 dark:text-gold-400 hover:underline shrink-0 font-mono"
                        >
                          P.{inc.sourcePage}
                        </button>
                      )}
                    </div>
                  ))}
                  {inclusions.length === 0 && deliverables.length === 0 && (
                    <div className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-xl col-span-2">
                      No explicit scope inclusions listed in quotation.
                    </div>
                  )}
                </div>
              </div>

              {/* Exclusions & Caveats */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Exclusions, Caveats & Hidden Charges ({exclusions.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {exclusions.map((exc, idx) => (
                    <div key={idx} className="bg-amber-50/40 dark:bg-amber-950/15 border border-amber-500/30 p-3 rounded-xl flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="text-foreground leading-snug">{exc.text}</span>
                      </div>
                      {exc.sourcePage && (
                        <button
                          onClick={() => handleInspect("exclusion", exc.text, "Excluded", exc.evidence, exc.sourcePage)}
                          className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline shrink-0 font-mono"
                        >
                          P.{exc.sourcePage}
                        </button>
                      )}
                    </div>
                  ))}
                  {exclusions.length === 0 && (
                    <div className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-xl col-span-2">
                      No explicit exclusions noted in quotation.
                    </div>
                  )}
                </div>
              </div>

              {/* Operational & Setup Details */}
              <Card className="border border-border/70 p-4 space-y-2 text-xs">
                <div className="font-bold text-foreground">Operational Execution Parameters</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Setup Time:</span>{" "}
                    {quotationResult?.serviceDetails?.setupDetails || "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Dismantling:</span>{" "}
                    {quotationResult?.serviceDetails?.dismantlingDetails || "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Overtime Rates:</span>{" "}
                    {quotationResult?.serviceDetails?.overtimeCharges || "Not specified"}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: TERMS & MILESTONES */}
          {activeTab === "terms" && (
            <div className="space-y-6">
              {/* Payment Schedule */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" /> Milestone Payment Schedule ({paymentSchedule.length})
                </span>
                <div className="rounded-xl border border-border/70 overflow-hidden bg-card">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                        <th className="py-2.5 px-3 font-semibold">Milestone</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Percentage</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                        <th className="py-2.5 px-3 font-semibold">Due Date / Trigger</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Citation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {paymentSchedule.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground font-sans">
                            No structured milestone payment schedule found in quotation.
                          </td>
                        </tr>
                      ) : (
                        paymentSchedule.map((p, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-sans font-medium text-foreground">{p.milestone}</td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground">
                              {p.percentage ? `${p.percentage}%` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-foreground">
                              {p.statedAmount ? formatCurrency(p.statedAmount) : "—"}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-muted-foreground">{p.dueDate || "Per contract"}</td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleInspect(
                                    "payment",
                                    p.milestone,
                                    `${p.percentage ? `${p.percentage}%` : ""} ${p.statedAmount ? formatCurrency(p.statedAmount) : ""}`,
                                    p.evidenceSnippet,
                                    p.sourcePage
                                  )
                                }
                                className="h-6 text-[11px] px-1.5 text-purple-700 dark:text-purple-400"
                              >
                                P.{p.sourcePage || 1}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cancellation & Refund Policies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-border/70 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600" /> Cancellation Terms
                  </div>
                  <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {quotationResult?.commercialDetails?.cancellationTerms || "No cancellation clause explicitly provided."}
                  </p>
                </Card>

                <Card className="border border-border/70 p-4 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-600" /> Refund Terms
                  </div>
                  <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {quotationResult?.commercialDetails?.refundTerms || "No refund timeline explicitly outlined."}
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: DETERMINISTIC MATH AUDIT PROOF */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  vendorSummary.financialAuditStatus === "MATCHED"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                }`}
              >
                {vendorSummary.financialAuditStatus === "MATCHED" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-bold">
                    {vendorSummary.financialAuditStatus === "MATCHED"
                      ? "100% Mathematically Sound & Line-Item Verified"
                      : "Discrepancies Detected in Commercial Calculation"}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {vendorSummary.financialAuditStatus === "MATCHED"
                      ? "All line items, taxes, discounts, and advance payment calculations match the vendor's stated totals exactly."
                      : `${vendorSummary.discrepancyCount} discrepancy flags detected between stated amounts and deterministic line-item sums.`}
                  </p>
                </div>
              </div>

              {/* Audit Flags */}
              {financialAudit && financialAudit.discrepancyFlags && financialAudit.discrepancyFlags.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Audit Discrepancy Log
                  </span>
                  <div className="space-y-2">
                    {financialAudit.discrepancyFlags.map((flag, idx) => (
                      <div key={idx} className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-800 dark:text-rose-300 capitalize">{flag.type.replace("_", " ")}</span>
                            <p className="text-foreground/90 mt-0.5">{flag.message}</p>
                          </div>
                        </div>
                        {(flag as any).difference !== undefined && (
                          <span className="font-mono font-bold text-rose-600 shrink-0">
                            Diff: {formatCurrency((flag as any).difference)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stated vs Calculated Reconciliation */}
              <Card className="border border-border/70 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stated vs Calculated Financial Reconciliation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-muted/30 p-3 rounded-xl">
                    <div className="text-muted-foreground font-sans text-[11px]">Stated Grand Total</div>
                    <div className="text-base font-bold text-foreground mt-1">
                      {formatCurrency(vendorSummary.statedGrandTotal)}
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl">
                    <div className="text-muted-foreground font-sans text-[11px]">Calculated Line-Item Sum</div>
                    <div className="text-base font-bold text-foreground mt-1">
                      {formatCurrency(vendorSummary.calculatedGrandTotal)}
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl">
                    <div className="text-muted-foreground font-sans text-[11px]">Calculated Variance</div>
                    <div className="text-base font-bold text-emerald-600 mt-1">
                      {vendorSummary.discrepancyCount === 0 ? "₹0 (Zero Drift)" : "Variance Flagged"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: SCORING BREAKDOWN */}
          {activeTab === "scoring" && vendorScore && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Transparent Weighted Score Contribution
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Rank #{vendorScore.rank} overall with a composite score of {vendorScore.totalScore} / 100.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(vendorScore.criteria).map(([key, crit]) => (
                  <Card key={key} className="border border-border/70 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{crit.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          Weight: {crit.adjustedWeight}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-muted-foreground">Raw: {crit.normalizedScore}/100</span>
                        <span className="font-bold text-gold-700 dark:text-gold-400 text-sm">
                          +{crit.weightedScore.toFixed(1)} Pts
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gold h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, crit.normalizedScore)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{crit.evidenceNotes}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/70 bg-muted/30 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Back to Comparison Dashboard
          </Button>
          {onOpenPdfPage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenPdfPage(vendorSummary.uploadId, 1)}
              className="text-xs bg-gold hover:bg-gold-600 text-charcoal-950 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Original PDF Document
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
