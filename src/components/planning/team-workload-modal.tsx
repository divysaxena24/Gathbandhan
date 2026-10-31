"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  CheckCircle2,
  Briefcase,
  Loader2,
} from "lucide-react";

interface PlannerWorkload {
  plannerId: string;
  plannerName: string;
  plannerEmail: string;
  activeWeddingsCount: number;
  totalTasksCount: number;
  activeTasksCount: number;
  overdueTasksCount: number;
  atRiskTasksCount: number;
  completedTasksCount: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
}

export function TeamWorkloadModal() {
  const [open, setOpen] = useState(false);
  const [workloads, setWorkloads] = useState<PlannerWorkload[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/tasks/workload")
        .then((res) => res.json())
        .then((json) => {
          setWorkloads(json.data || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-ivory-300 text-charcoal hover:bg-ivory-100">
          <Users className="w-4 h-4 text-gold" />
          Team Workload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <Users className="w-5 h-5 text-gold" />
            Planner Workload & Capacity Management
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-12 text-center text-charcoal-500">
            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
            <p className="text-sm">Aggregating planner schedules & task loads...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-xs text-charcoal-500">
              Real-time workload distribution across lead wedding planners and coordinators to balance task assignments and prevent delivery bottlenecks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workloads.map((w) => {
                const totalHours = (w.totalEstimatedMinutes / 60).toFixed(1);
                const actualHours = (w.totalActualMinutes / 60).toFixed(1);

                return (
                  <div
                    key={w.plannerId}
                    className="p-4 rounded-xl border border-ivory-300 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-charcoal text-base">
                          {w.plannerName}
                        </h4>
                        <span className="text-xs text-charcoal-500 block">
                          {w.plannerEmail}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ivory-100 text-charcoal-700 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gold" />
                        {w.activeWeddingsCount} Weddings
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 bg-ivory-100 rounded">
                        <span className="text-[10px] text-charcoal-500 uppercase block font-semibold">
                          Active
                        </span>
                        <span className="text-sm font-bold text-charcoal">
                          {w.activeTasksCount}
                        </span>
                      </div>
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                        <span className="text-[10px] text-amber-700 uppercase block font-semibold">
                          At Risk
                        </span>
                        <span className="text-sm font-bold text-amber-800">
                          {w.atRiskTasksCount}
                        </span>
                      </div>
                      <div className="p-2 bg-burgundy-50 border border-burgundy-200 rounded">
                        <span className="text-[10px] text-burgundy-700 uppercase block font-semibold">
                          Overdue
                        </span>
                        <span className="text-sm font-bold text-burgundy-800">
                          {w.overdueTasksCount}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-ivory-200 flex items-center justify-between text-xs text-charcoal-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold" />
                        Est: {totalHours} hrs | Logged: {actualHours} hrs
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {w.completedTasksCount} Done
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
