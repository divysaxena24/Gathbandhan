"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Lead, PIPELINE_STAGES } from "@/modules/crm/types";
import { formatINRCompact, formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

interface LeadTableProps {
  leads: (Lead & { assignedPlannerName?: string | null })[];
  onRefresh?: () => void;
}

export function LeadTable({ leads }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/40 text-muted-foreground text-sm">
        No enquiries match your current filters.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Couple & Contact</th>
              <th className="py-3 px-4">City / Venue</th>
              <th className="py-3 px-4">Event Date</th>
              <th className="py-3 px-4">Guests</th>
              <th className="py-3 px-4">Budget</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Planner</th>
              <th className="py-3 px-4">Next Follow-Up</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {leads.map((lead) => {
              const stageConfig = PIPELINE_STAGES.find((s) => s.key === lead.status);
              const now = new Date();
              const isOverdue =
                lead.nextFollowUpAt &&
                new Date(lead.nextFollowUpAt) < now &&
                lead.status !== "CONVERTED" &&
                lead.status !== "LOST";

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Couple & Contact */}
                  <td className="py-3 px-4">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-display font-bold text-sm text-foreground hover:text-gold transition-colors block"
                    >
                      {lead.coupleName}
                    </Link>
                    <div className="text-[11px] text-muted-foreground mt-0.5 space-x-1.5">
                      <span>{lead.partnerOneName}</span>
                      {lead.partnerOnePhone && <span>· {lead.partnerOnePhone}</span>}
                    </div>
                  </td>

                  {/* Destination */}
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="font-medium text-foreground">{lead.city || "—"}</div>
                    {lead.venue && <div className="text-[11px] truncate max-w-[140px]">{lead.venue}</div>}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4">
                    <span className="font-medium text-foreground">{lead.eventDate || "—"}</span>
                    {lead.dateFlexibility && lead.dateFlexibility !== "EXACT" && (
                      <span className="block text-[10px] text-muted-foreground">
                        {lead.dateFlexibility.replace("_", " ")}
                      </span>
                    )}
                  </td>

                  {/* Guests */}
                  <td className="py-3 px-4 font-medium text-foreground">
                    {lead.estimatedGuestCount ? `${lead.estimatedGuestCount}` : "—"}
                  </td>

                  {/* Budget */}
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {lead.estimatedBudgetPaise ? (
                      <span title={formatINR(lead.estimatedBudgetPaise)}>
                        {formatINRCompact(lead.estimatedBudgetPaise)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Stage */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        stageConfig?.color || "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {stageConfig?.label || lead.status}
                    </span>
                  </td>

                  {/* Planner */}
                  <td className="py-3 px-4 text-muted-foreground">
                    {lead.assignedPlannerName || (
                      <span className="text-muted-foreground/60 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Follow-Up */}
                  <td className="py-3 px-4">
                    {lead.nextFollowUpAt ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded",
                          isOverdue
                            ? "bg-status-critical-light text-status-critical font-semibold"
                            : "bg-muted/60 text-muted-foreground"
                        )}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(lead.nextFollowUpAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/leads/${lead.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Details
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
