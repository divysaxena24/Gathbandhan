"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  TrendingUp,
  Wallet,
  Award,
  Users,
  ShieldAlert,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SeasonKpiCards } from "@/components/analytics/season-kpi-cards";
import { PackageMarginComparison } from "@/components/analytics/package-margin-comparison";
import { WeddingPnlTable } from "@/components/analytics/wedding-pnl-table";
import { CashFlowForecaster } from "@/components/analytics/cash-flow-forecaster";
import { VendorReliabilityTable } from "@/components/analytics/vendor-reliability-table";
import { TeamWorkloadGrid } from "@/components/analytics/team-workload-grid";
import { OperationalRiskRadar } from "@/components/analytics/operational-risk-radar";
import { FounderDashboardOverview } from "@/modules/analytics/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<FounderDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "EXECUTIVE" | "WEDDING_PNL" | "CASH_FLOW" | "VENDORS" | "TEAM"
  >("EXECUTIVE");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/season");
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || "Failed to load season analytics");
      }
      const json = await res.json();
      setData(json.data);
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDownloadReport = (reportType: string) => {
    window.open(`/api/reports/${reportType}`, "_blank");
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Founder Analytics & Season Review"
        description="Comprehensive agency balance sheet, package margins, vendor reliability ratings, and operational capacity"
      >
        <div className="flex items-center gap-2 relative">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <div className="relative">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="gap-1.5 bg-charcoal text-ivory hover:bg-charcoal-800"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              Export Report
            </Button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-sand-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-charcoal-400 tracking-wider">
                  Download CSV Reports
                </div>
                <button
                  onClick={() => handleDownloadReport("season-pl")}
                  className="w-full text-left px-3 py-2 hover:bg-sand-50 flex items-center gap-2 text-charcoal-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-gold-600" />
                  Season Executive P&amp;L
                </button>
                <button
                  onClick={() => handleDownloadReport("wedding-pl")}
                  className="w-full text-left px-3 py-2 hover:bg-sand-50 flex items-center gap-2 text-charcoal-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  All Weddings P&amp;L Breakdown
                </button>
                <button
                  onClick={() => handleDownloadReport("cash-flow")}
                  className="w-full text-left px-3 py-2 hover:bg-sand-50 flex items-center gap-2 text-charcoal-700"
                >
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Cash Flow Horizon Forecast
                </button>
                <button
                  onClick={() => handleDownloadReport("vendor-reliability")}
                  className="w-full text-left px-3 py-2 hover:bg-sand-50 flex items-center gap-2 text-charcoal-700"
                >
                  <Award className="w-4 h-4 text-amber-600" />
                  Vendor Reliability &amp; Ratings
                </button>
                <button
                  onClick={() => handleDownloadReport("team-workload")}
                  className="w-full text-left px-3 py-2 hover:bg-sand-50 flex items-center gap-2 text-charcoal-700"
                >
                  <Users className="w-4 h-4 text-purple-600" />
                  Team Workload &amp; Capacity
                </button>
              </div>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-sand-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("EXECUTIVE")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "EXECUTIVE"
              ? "border-gold-600 text-gold-900 bg-gold-50/30"
              : "border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-300"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-gold-600" />
          Executive Overview
        </button>

        <button
          onClick={() => setActiveTab("WEDDING_PNL")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "WEDDING_PNL"
              ? "border-gold-600 text-gold-900 bg-gold-50/30"
              : "border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-300"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Wedding P&amp;L Drill-Down
        </button>

        <button
          onClick={() => setActiveTab("CASH_FLOW")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "CASH_FLOW"
              ? "border-gold-600 text-gold-900 bg-gold-50/30"
              : "border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-300"
          }`}
        >
          <Wallet className="w-4 h-4 text-blue-600" />
          Cash Flow Forecast (7/30/60/90)
        </button>

        <button
          onClick={() => setActiveTab("VENDORS")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "VENDORS"
              ? "border-gold-600 text-gold-900 bg-gold-50/30"
              : "border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-300"
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          Vendor Reliability
        </button>

        <button
          onClick={() => setActiveTab("TEAM")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === "TEAM"
              ? "border-gold-600 text-gold-900 bg-gold-50/30"
              : "border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-sand-300"
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          Team Capacity
        </button>
      </div>

      {/* Main Workspace Body */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-gold-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-charcoal-700">
            Reconciling multi-wedding ledgers &amp; vendor performance metrics...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-ruby-200 bg-ruby-50/60 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-ruby-600 mx-auto" />
          <h3 className="font-serif font-bold text-ruby-900">Failed to load analytics</h3>
          <p className="text-xs text-ruby-700 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            Try Again
          </Button>
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {activeTab === "EXECUTIVE" && (
            <>
              <SeasonKpiCards season={data.season} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PackageMarginComparison packages={data.packages} />
                <OperationalRiskRadar risks={data.operationalRisks} />
              </div>
            </>
          )}

          {activeTab === "WEDDING_PNL" && (
            <WeddingPnlTable weddings={data.weddingPnls} />
          )}

          {activeTab === "CASH_FLOW" && (
            <CashFlowForecaster
              buckets={data.cashFlowBuckets}
              weekly={data.weeklyCashFlow}
            />
          )}

          {activeTab === "VENDORS" && (
            <VendorReliabilityTable vendors={data.vendorReliabilities} />
          )}

          {activeTab === "TEAM" && (
            <TeamWorkloadGrid team={data.teamWorkloads} />
          )}
        </div>
      )}
    </div>
  );
}
