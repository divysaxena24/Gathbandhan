"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Kanban,
  Table as TableIcon,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateLeadDialog } from "@/components/crm/create-lead-dialog";
import { LeadPipelineBoard } from "@/components/crm/lead-pipeline-board";
import { LeadTable } from "@/components/crm/lead-table";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { type Lead, PIPELINE_STAGES } from "@/modules/crm/types";
import { formatINRCompact } from "@/lib/money";

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [leads, setLeads] = useState<(Lead & { assignedPlannerName?: string | null })[]>([]);
  const [stats, setStats] = useState<{
    totalLeads: number;
    newEnquiries: number;
    qualifiedLeads: number;
    followUpsDueToday: number;
    followUpsOverdue: number;
    pipelineBudgetPaise: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedQualification, setSelectedQualification] = useState<string>("ALL");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (selectedStage !== "ALL") params.set("status", selectedStage);
      if (selectedQualification !== "ALL") params.set("qualificationStatus", selectedQualification);
      params.set("pageSize", "100");

      const [leadsRes, statsRes] = await Promise.all([
        fetch(`/api/leads?${params.toString()}`),
        fetch("/api/leads/stats"),
      ]);

      if (!leadsRes.ok) {
        throw new Error("Failed to load leads");
      }

      const leadsJson = await leadsRes.json();
      setLeads(leadsJson.data || []);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.data || null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching CRM data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, selectedStage, selectedQualification]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Page Header */}
      <PageHeader
        title="CRM & Enquiry Pipeline"
        description="Capture enquiries, qualify luxury couples, manage follow-ups, and convert leads into weddings"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeads}
          className="gap-1.5"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <CreateLeadDialog onLeadCreated={fetchLeads} />
      </PageHeader>

      {/* KPI Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-border bg-card p-3 shadow-xs">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Leads
            </div>
            <div className="text-xl font-bold font-display text-charcoal mt-1">
              {stats.totalLeads}
            </div>
          </Card>

          <Card className="border-border bg-card p-3 shadow-xs">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              New Enquiries
            </div>
            <div className="text-xl font-bold font-display text-blue-600 mt-1">
              {stats.newEnquiries}
            </div>
          </Card>

          <Card className="border-border bg-card p-3 shadow-xs">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Qualified Leads
            </div>
            <div className="text-xl font-bold font-display text-purple-600 mt-1">
              {stats.qualifiedLeads}
            </div>
          </Card>

          <Card className="border-border bg-card p-3 shadow-xs">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Follow-ups Today
            </div>
            <div className="text-xl font-bold font-display text-amber-600 mt-1">
              {stats.followUpsDueToday}
            </div>
          </Card>

          <Card className="border-border bg-card p-3 shadow-xs">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Overdue Follow-ups
            </div>
            <div className="text-xl font-bold font-display text-status-critical mt-1">
              {stats.followUpsOverdue}
            </div>
          </Card>

          <Card className="border-border bg-card p-3 shadow-xs">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline Budget
            </div>
            <div className="text-xl font-bold font-display text-status-success mt-1">
              {formatINRCompact(BigInt(stats.pipelineBudgetPaise || "0"))}
            </div>
          </Card>
        </div>
      )}

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search couples, contacts, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* Pipeline Stage Filter */}
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Qualification Filter */}
          <Select value={selectedQualification} onValueChange={setSelectedQualification}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
              <SelectValue placeholder="Qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="QUALIFIED">Qualified</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/40 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("board")}
            className={`h-7 px-2.5 text-xs gap-1.5 ${
              viewMode === "board"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Pipeline
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={`h-7 px-2.5 text-xs gap-1.5 ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Table
          </Button>
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <LoadingState message="Loading CRM pipeline and enquiries..." />
      ) : error ? (
        <ErrorState
          title="Failed to load CRM data"
          message={error}
          onRetry={fetchLeads}
        />
      ) : viewMode === "board" ? (
        <LeadPipelineBoard leads={leads} />
      ) : (
        <LeadTable leads={leads} onRefresh={fetchLeads} />
      )}
    </div>
  );
}
