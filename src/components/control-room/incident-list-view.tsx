"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IncidentRecord, IncidentSeverity } from "@/modules/control-room/types";
import { formatINR } from "@/lib/money";
import {
  CreateIncidentModal,
  ResolveIncidentModal,
} from "./incident-modal";

interface IncidentListViewProps {
  incidents: IncidentRecord[];
  weddingId: string;
  eventId?: string;
  onRefresh: () => void;
}

export function IncidentListView({
  incidents,
  weddingId,
  eventId,
  onRefresh,
}: IncidentListViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedToResolve, setSelectedToResolve] = useState<IncidentRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus =
      statusFilter === "ALL" || inc.status === statusFilter;
    const matchesSeverity =
      severityFilter === "ALL" || inc.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const openCount = incidents.filter((i) => i.status !== "RESOLVED").length;
  const criticalCount = incidents.filter(
    (i) => i.severity === "CRITICAL" && i.status !== "RESOLVED"
  ).length;

  const totalCostPaise = incidents.reduce(
    (acc, cur) => acc + (cur.costImpactPaise || 0n),
    0n
  );

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <Badge className="bg-status-critical text-white border-none gap-1 font-semibold animate-pulse">
            <AlertOctagon className="w-3 h-3" />
            Critical
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="bg-status-critical/15 text-status-critical border-status-critical/30 font-medium">
            High
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-status-warning/20 text-status-warning border-status-warning/40 font-medium">
            Medium
          </Badge>
        );
      case "LOW":
      default:
        return (
          <Badge className="bg-sand/30 text-charcoal/70 border-sand font-normal">
            Low
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <Badge className="bg-status-success/15 text-status-success border-status-success/30 gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </Badge>
        );
      case "INVESTIGATING":
        return (
          <Badge className="bg-blue-600/15 text-blue-800 border-blue-300 font-medium">
            Investigating
          </Badge>
        );
      case "OPEN":
      default:
        return (
          <Badge className="bg-status-critical/15 text-status-critical border-status-critical/30 font-medium">
            Open
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-sand/40">
          <div className="text-xs font-medium text-charcoal/60">Total Incidents Logged</div>
          <div className="text-2xl font-serif font-bold text-charcoal mt-1">
            {incidents.length}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            openCount > 0
              ? "bg-status-warning/10 border-status-warning/30"
              : "bg-white border-sand/40"
          }`}
        >
          <div className="text-xs font-medium text-charcoal/60">Open Incident Tickets</div>
          <div
            className={`text-2xl font-serif font-bold mt-1 ${
              openCount > 0 ? "text-status-warning" : "text-status-success"
            }`}
          >
            {openCount}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            criticalCount > 0
              ? "bg-status-critical/10 border-status-critical/30"
              : "bg-white border-sand/40"
          }`}
        >
          <div className="text-xs font-medium text-charcoal/60 flex items-center gap-1">
            {criticalCount > 0 && (
              <ShieldAlert className="w-3.5 h-3.5 text-status-critical" />
            )}
            <span>Active Critical Issues</span>
          </div>
          <div
            className={`text-2xl font-serif font-bold mt-1 ${
              criticalCount > 0 ? "text-status-critical" : "text-charcoal"
            }`}
          >
            {criticalCount}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-sand/40">
          <div className="text-xs font-medium text-charcoal/60">Total Incurred Cost</div>
          <div className="text-2xl font-serif font-bold text-gold mt-1">
            {formatINR(totalCostPaise)}
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-ivory rounded-lg border border-sand/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-charcoal/60 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-sand rounded-md p-1.5 bg-white text-charcoal"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-charcoal/60 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-sand rounded-md p-1.5 bg-white text-charcoal"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <Button
          size="sm"
          className="bg-status-critical text-white hover:bg-status-critical/90 text-xs gap-1.5 shadow-sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log New Incident</span>
        </Button>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="p-8 text-center bg-white border border-sand/40 rounded-lg text-charcoal/50 text-xs">
            No incident tickets match the selected filters.
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-lg border transition-all ${
                inc.severity === "CRITICAL" && inc.status !== "RESOLVED"
                  ? "bg-status-critical/5 border-status-critical/30 shadow-sm"
                  : "bg-white border-sand/40 hover:border-sand"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-sand/20">
                <div className="flex items-center gap-2 flex-wrap">
                  {getSeverityBadge(inc.severity)}
                  {getStatusBadge(inc.status)}
                  <h4 className="font-serif font-bold text-charcoal text-base">
                    {inc.title}
                  </h4>
                  {inc.eventName && (
                    <span className="text-xs text-gold font-medium bg-gold/10 px-2 py-0.5 rounded">
                      {inc.eventName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-charcoal/60 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Reported:{" "}
                    {new Date(inc.reportedAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    IST
                  </span>
                </div>
              </div>

              <div className="pt-3 space-y-2 text-xs">
                <p className="text-charcoal/80 leading-relaxed">{inc.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-charcoal/60">
                  <div className="flex items-center gap-3">
                    <span>
                      Reporter: <strong className="text-charcoal">{inc.reportedBy}</strong>
                    </span>
                    {inc.vendorName && (
                      <span>
                        Vendor: <strong className="text-gold">{inc.vendorName}</strong>
                      </span>
                    )}
                    {inc.costImpactPaise > 0n && (
                      <span className="font-mono text-charcoal font-semibold">
                        Cost Impact: {formatINR(inc.costImpactPaise)}
                      </span>
                    )}
                  </div>

                  {inc.status !== "RESOLVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-status-success text-status-success hover:bg-status-success/10 gap-1"
                      onClick={() => setSelectedToResolve(inc)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve & Record Impact</span>
                    </Button>
                  )}
                </div>

                {inc.status === "RESOLVED" && inc.resolutionNotes && (
                  <div className="mt-2 p-2.5 rounded bg-status-success/10 border border-status-success/20 text-xs text-charcoal/80 space-y-1">
                    <div className="font-semibold text-status-success flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolution Log:</span>
                    </div>
                    <p>{inc.resolutionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        weddingId={weddingId}
        eventId={eventId}
        onCreated={onRefresh}
      />

      {/* Resolve Modal */}
      <ResolveIncidentModal
        incident={selectedToResolve}
        onClose={() => setSelectedToResolve(null)}
        onResolved={onRefresh}
      />
    </div>
  );
}
