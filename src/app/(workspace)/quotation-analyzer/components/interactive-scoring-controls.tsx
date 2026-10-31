"use client";

import React, { useState } from "react";
import {
  ComparisonWeights,
  DEFAULT_COMPARISON_WEIGHTS,
  ComparisonScenarioType,
  SCENARIO_PRESETS,
  MultiVendorComparisonResult,
} from "@/lib/ai/comparison-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
} from "lucide-react";

interface InteractiveScoringControlsProps {
  currentWeights: ComparisonWeights;
  onApplyWeights: (weights: ComparisonWeights, scenarioId?: ComparisonScenarioType) => Promise<void>;
  isRecalculating: boolean;
  baselineWinnerName: string;
  currentWinnerName: string;
  activeScenario: ComparisonScenarioType;
}

export function InteractiveScoringControls({
  currentWeights,
  onApplyWeights,
  isRecalculating,
  baselineWinnerName,
  currentWinnerName,
  activeScenario,
}: InteractiveScoringControlsProps) {
  const [weights, setWeights] = useState<ComparisonWeights>(currentWeights);
  const [selectedScenario, setSelectedScenario] = useState<ComparisonScenarioType>(activeScenario);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isNormalized = Math.abs(totalWeight - 100) < 0.5;
  const didWinnerShift = baselineWinnerName !== currentWinnerName;

  const handleSliderChange = (key: keyof ComparisonWeights, val: number) => {
    setSelectedScenario("custom");
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleNormalize = async () => {
    if (totalWeight <= 0) return;
    const factor = 100 / totalWeight;
    const normalized: ComparisonWeights = {
      costCompetitiveness: Math.round(weights.costCompetitiveness * factor),
      serviceCoverage: Math.round(weights.serviceCoverage * factor),
      qualityAndPortfolio: Math.round(weights.qualityAndPortfolio * factor),
      pastPerformance: Math.round(weights.pastPerformance * factor),
      commercialTerms: Math.round(weights.commercialTerms * factor),
      transparency: Math.round(weights.transparency * factor),
    };
    // Ensure exact 100 sum
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      normalized.costCompetitiveness += 100 - sum;
    }
    setWeights(normalized);
    await onApplyWeights(normalized, "custom");
  };

  const handleSelectScenario = async (scenarioId: ComparisonScenarioType) => {
    setSelectedScenario(scenarioId);
    const preset = SCENARIO_PRESETS[scenarioId];
    if (preset) {
      setWeights(preset.weights);
      await onApplyWeights(preset.weights, scenarioId);
    }
  };

  const handleReset = async () => {
    setSelectedScenario("balanced");
    setWeights(DEFAULT_COMPARISON_WEIGHTS);
    await onApplyWeights(DEFAULT_COMPARISON_WEIGHTS, "balanced");
  };

  return (
    <Card className="border border-border/70 shadow-xs bg-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground font-display">
              <SlidersHorizontal className="w-4 h-4 text-gold-600" />
              Dynamic Scoring Controls & Sensitivity Scenarios
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Adjust criteria weights to test commercial priorities. Unavailable evidence is automatically re-normalized without penalty.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                isNormalized ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-rose-500 text-rose-700 bg-rose-50"
              }`}
            >
              Total Weight: {totalWeight}% {isNormalized ? "✓ Balanced" : "⚠️ Needs 100%"}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isRecalculating}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Scenario Presets Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Priority Scenarios</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {SCENARIO_PRESETS[selectedScenario]?.description}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["balanced", "lowest_cost", "service_coverage", "commercial_safety"] as ComparisonScenarioType[]).map(
              (scId) => {
                const preset = SCENARIO_PRESETS[scId];
                const isActive = selectedScenario === scId;

                return (
                  <button
                    key={scId}
                    type="button"
                    disabled={isRecalculating}
                    onClick={() => handleSelectScenario(scId)}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                      isActive
                        ? "border-gold bg-gold/15 text-charcoal-950 font-bold shadow-xs ring-2 ring-gold/30"
                        : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{preset.label.split(" (")[0]}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 shrink-0" />}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Recommendation Shift Alert Banner */}
        {didWinnerShift && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Priority Shift Detected:</strong> Under this priority scenario,{" "}
                <span className="underline font-bold text-foreground">{currentWinnerName}</span> overtakes{" "}
                <span className="italic">{baselineWinnerName}</span> as the #1 recommended vendor.
              </span>
            </div>
            <Badge className="bg-amber-600 text-white text-[10px] shrink-0">Recommendation Changed</Badge>
          </div>
        )}

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* 1. Cost */}
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Cost Competitiveness</span>
              <Badge variant="outline" className="font-bold text-emerald-700 bg-emerald-50">
                {weights.costCompetitiveness}%
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={weights.costCompetitiveness}
              onChange={(e) => handleSliderChange("costCompetitiveness", parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Ratio benchmarked against lowest quoted proposal price.
            </p>
          </div>

          {/* 2. Coverage */}
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Service Coverage</span>
              <Badge variant="outline" className="font-bold text-blue-700 bg-blue-50">
                {weights.serviceCoverage}%
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={weights.serviceCoverage}
              onChange={(e) => handleSliderChange("serviceCoverage", parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Inclusions count, deliverables, and setup coverage hours.
            </p>
          </div>

          {/* 3. Commercial Terms */}
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Commercial Terms</span>
              <Badge variant="outline" className="font-bold text-amber-700 bg-amber-50">
                {weights.commercialTerms}%
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={weights.commercialTerms}
              onChange={(e) => handleSliderChange("commercialTerms", parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Low advance required, staged milestones & cancellation terms.
            </p>
          </div>

          {/* 4. Financial Audit */}
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Transparency & Audit</span>
              <Badge variant="outline" className="font-bold text-purple-700 bg-purple-50">
                {weights.transparency}%
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={weights.transparency}
              onChange={(e) => handleSliderChange("transparency", parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              100% deterministic math match; penalty for calculation errors.
            </p>
          </div>

          {/* 5. Quality Evidence */}
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Quality & Portfolio</span>
              <Badge variant="outline" className="font-bold text-gold-700 bg-gold/15">
                {weights.qualityAndPortfolio}%
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={weights.qualityAndPortfolio}
              onChange={(e) => handleSliderChange("qualityAndPortfolio", parseInt(e.target.value))}
              className="w-full accent-gold-600 cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Tasting sessions, sample portfolios, and verified websites.
            </p>
          </div>

          {/* 6. Past Performance */}
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Past Performance</span>
              <Badge variant="outline" className="font-bold text-charcoal-700 bg-muted">
                {weights.pastPerformance}%
              </Badge>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={weights.pastPerformance}
              onChange={(e) => handleSliderChange("pastPerformance", parseInt(e.target.value))}
              className="w-full accent-charcoal-600 cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              Client references, industry awards & years of verified experience.
            </p>
          </div>
        </div>

        {/* Action bar for custom weights */}
        {!isNormalized && (
          <div className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs">
            <span className="text-rose-800 dark:text-rose-300">
              Total weights equal {totalWeight}%. Click Auto-Normalize to re-scale weights to 100%.
            </span>
            <Button
              size="sm"
              onClick={handleNormalize}
              disabled={isRecalculating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-7"
            >
              Auto-Normalize to 100%
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
