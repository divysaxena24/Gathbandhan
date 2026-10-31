"use client";

import React from "react";
import { Users, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamWorkloadMetrics } from "@/modules/analytics/types";

interface TeamWorkloadGridProps {
  team: TeamWorkloadMetrics[];
}

export function TeamWorkloadGrid({ team }: TeamWorkloadGridProps) {
  const getStatusBadge = (status: "BALANCED" | "HIGH" | "OVERLOADED") => {
    switch (status) {
      case "OVERLOADED":
        return (
          <Badge className="bg-ruby-100 text-ruby-800 border-ruby-300 font-bold text-xs">
            <AlertCircle className="w-3 h-3 mr-1 inline" />
            OVERLOADED
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs">
            High Capacity
          </Badge>
        );
      case "BALANCED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
            Balanced
          </Badge>
        );
    }
  };

  return (
    <Card className="border-sand-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-sand-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-serif font-bold text-charcoal-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-600" />
              Team Workload &amp; Operational Capacity
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-500 mt-0.5">
              Live coordinator assignments and task loads answering:{" "}
              <strong className="text-charcoal-700">Which employees are overloaded?</strong>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((m) => {
            const isOverloaded = m.workloadStatus === "OVERLOADED";

            return (
              <div
                key={m.userId}
                className={`p-4 rounded-xl border transition-all ${
                  isOverloaded
                    ? "bg-ruby-50/40 border-ruby-300 shadow-xs"
                    : "bg-sand-50/40 border-sand-200 hover:border-sand-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-charcoal-900 text-sm">
                      {m.name}
                    </h3>
                    <p className="text-[11px] text-charcoal-500">
                      {m.role.replace("_", " ")} • {m.email}
                    </p>
                  </div>
                  {getStatusBadge(m.workloadStatus)}
                </div>

                <div className="mt-3 pt-3 border-t border-sand-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">Active Weddings</span>
                    <span className="text-base font-serif font-bold text-charcoal-900">
                      {m.activeWeddingsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">Assigned Tasks</span>
                    <span className="text-base font-serif font-bold text-charcoal-900">
                      {m.totalAssignedTasks}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-sand-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-charcoal-600">
                    In Progress: <strong>{m.inProgressTasks}</strong>
                  </span>
                  {m.overdueTasks > 0 ? (
                    <span className="text-ruby-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {m.overdueTasks} Overdue
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      0 Overdue
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
