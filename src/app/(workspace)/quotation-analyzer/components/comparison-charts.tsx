"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  MultiVendorComparisonResult,
  ScoreChartItem,
  CostChartItem,
  CoverageChartItem,
} from "@/lib/ai/comparison-types";
import {
  prepareScoreChartData,
  prepareCostChartData,
  prepareCoverageChartData,
} from "@/lib/ai/comparison-charts-utils";
import { QuotationAnalysisResult } from "@/lib/ai/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Coins, Layers, PieChart, ShieldCheck } from "lucide-react";

interface ComparisonChartsProps {
  comparisonResult: MultiVendorComparisonResult;
  analyzedQuotations?: QuotationAnalysisResult[];
  onSelectVendor?: (vendorId: string) => void;
}

export function ComparisonCharts({
  comparisonResult,
  analyzedQuotations = [],
  onSelectVendor,
}: ComparisonChartsProps) {
  const [activeChart, setActiveChart] = useState<"score" | "cost" | "breakdown" | "coverage">("score");

  const scoreData: ScoreChartItem[] = prepareScoreChartData(comparisonResult);
  const costData: CostChartItem[] = prepareCostChartData(comparisonResult, analyzedQuotations);
  const coverageData: CoverageChartItem[] = prepareCoverageChartData(comparisonResult);

  const formatRupee = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  return (
    <Card className="border border-border/70 shadow-xs bg-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground font-display">
              <BarChart3 className="w-4 h-4 text-gold-600" />
              Comparative Commercial Intelligence & Analytics
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Interactive data visualizations derived directly from verified vendor quotation line items.
            </CardDescription>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs shrink-0 flex-wrap">
            <Button
              variant={activeChart === "score" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChart("score")}
              className="text-xs h-7 px-2.5"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1 text-gold-500" />
              Scores
            </Button>
            <Button
              variant={activeChart === "cost" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChart("cost")}
              className="text-xs h-7 px-2.5"
            >
              <Coins className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              Pricing
            </Button>
            <Button
              variant={activeChart === "breakdown" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChart("breakdown")}
              className="text-xs h-7 px-2.5"
            >
              <PieChart className="w-3.5 h-3.5 mr-1 text-purple-500" />
              Criteria Split
            </Button>
            <Button
              variant={activeChart === "coverage" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChart("coverage")}
              className="text-xs h-7 px-2.5"
            >
              <Layers className="w-3.5 h-3.5 mr-1 text-blue-500" />
              Coverage
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* CHART 1: Overall Score Comparison */}
        {activeChart === "score" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Composite Score (0 - 100 Points)</span>
              <span className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" /> Top Recommendation
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="vendorName"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    interval={0}
                    tickFormatter={(v: string) => (v.length > 15 ? `${v.slice(0, 14)}...` : v)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "currentColor" }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as ScoreChartItem;
                      return (
                        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-bold text-foreground">{d.vendorName}</p>
                          <p className="text-gold-600 font-semibold">
                            Total Score: {d.totalScore}/100 (Rank #{d.rank})
                          </p>
                          {d.isRecommended && (
                            <Badge className="bg-gold text-charcoal-950 font-bold text-[10px]">
                              #1 Final Recommendation
                            </Badge>
                          )}
                          <div className="pt-1.5 border-t border-border/60 text-[10px] text-muted-foreground space-y-0.5">
                            <p>Cost Competitiveness: {d.costScore}/100</p>
                            <p>Service Coverage: {d.coverageScore}/100</p>
                            <p>Commercial Terms: {d.termsScore}/100</p>
                            <p>Math Audit: {d.auditScore}/100</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="totalScore"
                    radius={[6, 6, 0, 0]}
                    onClick={(d: any) => onSelectVendor?.(d.vendorId)}
                    cursor="pointer"
                  >
                    {scoreData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isRecommended ? "#C5A855" : "#64748B"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: Quoted Cost Comparison */}
        {activeChart === "cost" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Proposal Grand Total (INR)</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Lowest Quoted Price
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="vendorName"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    interval={0}
                    tickFormatter={(v: string) => (v.length > 15 ? `${v.slice(0, 14)}...` : v)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as CostChartItem;
                      return (
                        <div className="bg-popover border border-border p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-bold text-foreground">{d.vendorName}</p>
                          <p className="text-emerald-600 font-bold text-sm">
                            Total: {d.currency} {d.statedTotal.toLocaleString()}
                          </p>
                          {d.isLowest && (
                            <Badge className="bg-emerald-600 text-white text-[10px]">
                              Lowest Price in Group
                            </Badge>
                          )}
                          <div className="pt-1.5 border-t border-border/60 text-[10px] text-muted-foreground space-y-0.5">
                            <p>Stated Subtotal: {formatRupee(d.subtotal)}</p>
                            <p>Taxes & Fees: {formatRupee(d.taxes)}</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="statedTotal"
                    radius={[6, 6, 0, 0]}
                    onClick={(d: any) => onSelectVendor?.(d.vendorId)}
                    cursor="pointer"
                  >
                    {costData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isLowest ? "#10B981" : "#3B82F6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Weighted Scoring Criteria Breakdown */}
        {activeChart === "breakdown" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Multi-Dimensional Score Breakdown per Vendor</span>
              <span className="text-[11px] italic">Normalized 0-100 score per criterion</span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="vendorName"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    interval={0}
                    tickFormatter={(v: string) => (v.length > 15 ? `${v.slice(0, 14)}...` : v)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "currentColor" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="costScore" name="Cost (30%)" fill="#10B981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="coverageScore" name="Coverage (25%)" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="termsScore" name="Terms (10%)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="auditScore" name="Audit (5%)" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 4: Service Coverage Comparison */}
        {activeChart === "coverage" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Service Inclusions vs. Explicit Exclusions Count</span>
              <span className="text-[11px] italic">Higher inclusions indicate bundled scope</span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                  <XAxis
                    dataKey="vendorName"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    interval={0}
                    tickFormatter={(v: string) => (v.length > 15 ? `${v.slice(0, 14)}...` : v)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "currentColor" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="inclusionsCount" name="Included Services" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exclusionsCount" name="Excluded Components" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
