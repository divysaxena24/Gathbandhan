"use client";

import React from "react";
import { ShieldAlert, CheckCircle2, AlertOctagon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OperationalRiskWedding } from "@/modules/analytics/types";

interface OperationalRiskRadarProps {
  risks: OperationalRiskWedding[];
}

export function OperationalRiskRadar({ risks }: OperationalRiskRadarProps) {
  const getRiskBadge = (level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => {
    switch (level) {
      case "CRITICAL":
        return (
          <Badge className="bg-ruby-600 text-white font-bold text-xs">
            <AlertOctagon className="w-3 h-3 mr-1 inline" />
            CRITICAL RISK
          </Badge>
        );
      case "HIGH":
        return (
          <Badge className="bg-ruby-100 text-ruby-800 border-ruby-300 font-semibold text-xs">
            High Risk
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
            Moderate Risk
          </Badge>
        );
      case "LOW":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
            Stable
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
              <ShieldAlert className="w-4 h-4 text-ruby-600" />
              Operational Risk Radar
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-500 mt-0.5">
              Live index across overdue milestones, late vendor arrivals &amp; unresolved palace incidents answering:{" "}
              <strong className="text-charcoal-700">Which wedding has the highest unresolved operational risk?</strong>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-sand-50 text-charcoal-600 font-semibold border-b border-sand-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Wedding</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3 text-center">Overdue Tasks</th>
                <th className="py-2.5 px-3 text-center">Late Check-Ins</th>
                <th className="py-2.5 px-3 text-center">Open Incidents</th>
                <th className="py-2.5 px-4 text-center">Composite Risk Score</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {risks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-500">
                    No active weddings found.
                  </td>
                </tr>
              ) : (
                risks.map((r, idx) => (
                  <tr key={r.weddingId} className="hover:bg-sand-50/40">
                    <td className="py-3 px-4 font-semibold text-charcoal-900 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-charcoal-400">#{idx + 1}</span>
                      {r.weddingTitle}
                    </td>
                    <td className="py-3 px-3 text-charcoal-600">{r.destination}</td>
                    <td className="py-3 px-3 text-center">
                      {r.overdueTasksCount > 0 ? (
                        <span className="text-ruby-700 font-bold font-mono">
                          {r.overdueTasksCount}
                        </span>
                      ) : (
                        <span className="text-charcoal-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.lateVendorCheckInsCount > 0 ? (
                        <span className="text-amber-700 font-bold font-mono">
                          {r.lateVendorCheckInsCount}
                        </span>
                      ) : (
                        <span className="text-charcoal-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.unresolvedIncidentsCount > 0 ? (
                        <span className="text-ruby-700 font-bold font-mono">
                          {r.unresolvedIncidentsCount}{" "}
                          {r.criticalIncidentsCount > 0 && `(${r.criticalIncidentsCount} crit)`}
                        </span>
                      ) : (
                        <span className="text-charcoal-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-sand-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              r.riskScore >= 75
                                ? "bg-ruby-600"
                                : r.riskScore >= 50
                                ? "bg-ruby-400"
                                : r.riskScore >= 20
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${r.riskScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-charcoal-800">
                          {r.riskScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getRiskBadge(r.riskLevel)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
