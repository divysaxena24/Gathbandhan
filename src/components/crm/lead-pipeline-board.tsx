"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Building,
  Users,
  IndianRupee,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type Lead,
  type PipelineStage,
  PIPELINE_STAGES,
} from "@/modules/crm/types";
import { formatINRCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

interface LeadPipelineBoardProps {
  leads: (Lead & { assignedPlannerName?: string | null })[];
  onStageChange?: (leadId: string, newStage: PipelineStage) => void;
}

export function LeadPipelineBoard({ leads, onStageChange: _onStageChange }: LeadPipelineBoardProps) {
  // Group leads by stage
  const leadsByStage: Record<PipelineStage, (Lead & { assignedPlannerName?: string | null })[]> = {
    NEW: [],
    CONTACTED: [],
    CONSULTATION_SCHEDULED: [],
    PROPOSAL_SENT: [],
    NEGOTIATION: [],
    CONVERTED: [],
    LOST: [],
    ARCHIVED: [],
  };

  for (const l of leads) {
    if (l.status in leadsByStage) {
      leadsByStage[l.status as PipelineStage].push(l);
    }
  }

  // Active stages for the main kanban view
  const activeStages = PIPELINE_STAGES.filter((s) => s.key !== "ARCHIVED");

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x">
      {activeStages.map((stage) => {
        const stageLeads = leadsByStage[stage.key] || [];
        const totalBudget = stageLeads.reduce(
          (acc, l) => acc + (l.estimatedBudgetPaise ? BigInt(l.estimatedBudgetPaise) : 0n),
          0n
        );

        return (
          <div
            key={stage.key}
            className="w-80 shrink-0 flex flex-col bg-muted/30 rounded-xl border border-border/70 p-3 snap-start"
          >
            {/* Stage Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-sm text-foreground">
                    {stage.label}
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border/80 text-muted-foreground">
                    {stageLeads.length}
                  </span>
                </div>
                {totalBudget > 0n && (
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {formatINRCompact(totalBudget)} pipeline
                  </p>
                )}
              </div>
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {stageLeads.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                  No enquiries in this stage
                </div>
              ) : (
                stageLeads.map((lead) => {
                  const now = new Date();
                  const isOverdue =
                    lead.nextFollowUpAt &&
                    new Date(lead.nextFollowUpAt) < now &&
                    lead.status !== "CONVERTED" &&
                    lead.status !== "LOST";

                  return (
                    <div
                      key={lead.id}
                      className="group rounded-lg border border-border bg-card p-3.5 shadow-sm hover:border-gold/50 hover:shadow-md transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-display font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-1"
                        >
                          {lead.coupleName}
                        </Link>
                        {lead.qualificationStatus === "QUALIFIED" && (
                          <Badge variant="outline" className="text-[9px] bg-status-success-light text-status-success border-status-success/30 px-1.5 py-0">
                            Qualified
                          </Badge>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                        {lead.city && (
                          <div className="flex items-center gap-1 truncate">
                            <Building className="w-3 h-3 text-gold shrink-0" />
                            <span className="truncate">{lead.city}</span>
                          </div>
                        )}
                        {lead.eventDate && (
                          <div className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 text-gold shrink-0" />
                            <span className="truncate">{lead.eventDate}</span>
                          </div>
                        )}
                        {lead.estimatedGuestCount && (
                          <div className="flex items-center gap-1 truncate">
                            <Users className="w-3 h-3 text-gold shrink-0" />
                            <span>{lead.estimatedGuestCount} guests</span>
                          </div>
                        )}
                        {lead.estimatedBudgetPaise && (
                          <div className="flex items-center gap-1 truncate font-medium text-foreground">
                            <IndianRupee className="w-3 h-3 text-gold shrink-0" />
                            <span>{formatINRCompact(lead.estimatedBudgetPaise)}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer row */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[120px]">
                          {lead.assignedPlannerName || "Unassigned"}
                        </span>

                        <div className="flex items-center gap-1">
                          {lead.nextFollowUpAt && (
                            <span
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                                isOverdue
                                  ? "bg-status-critical-light text-status-critical"
                                  : "bg-muted text-muted-foreground"
                              )}
                              title={`Next follow-up: ${new Date(lead.nextFollowUpAt).toLocaleDateString()}`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(lead.nextFollowUpAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}

                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
