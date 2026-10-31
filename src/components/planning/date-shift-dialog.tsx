/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Loader2,
} from "lucide-react";

interface DateShiftPreviewData {
  weddingId: string;
  previousStartDate: string;
  newStartDate: string;
  shiftDays: number;
  totalTasks: number;
  affectedTasks: Array<{
    taskId: string;
    title: string;
    category: string;
    currentDueAt: string;
    newDueAt: string;
    isOverdue: boolean;
    isAtRisk: boolean;
  }>;
  atRiskCount: number;
  overdueCount: number;
}

export function DateShiftDialog({
  weddingId,
  currentStartDate,
  onDatesShifted,
}: {
  weddingId: string;
  currentStartDate: string;
  onDatesShifted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [preview, setPreview] = useState<DateShiftPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!newDate) {
      setError("Please select a new wedding start date.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks/date-shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          newStartDate: newDate,
          apply: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to preview date shift");
      }

      const json = await res.json();
      setPreview(json.data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!newDate) return;

    setIsApplying(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks/date-shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          newStartDate: newDate,
          apply: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to apply date shift");
      }

      alert("Wedding dates and all backward-scheduled tasks successfully updated!");
      setOpen(false);
      onDatesShifted?.();
    } catch (err: any) {
      setError(err.message || "Failed to apply date shift");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-ivory-300 text-charcoal hover:bg-ivory-100">
          <CalendarDays className="w-4 h-4 text-gold" />
          Date Shift Simulator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <CalendarDays className="w-5 h-5 text-gold" />
            Backward Date Recalculation Engine
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 py-2">
          <p className="text-xs text-charcoal-500">
            When a destination wedding date moves, the backward scheduling engine re-computes all dependent task deadlines, detecting at-risk milestones and overdue deadlines prior to commitment.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-charcoal-500">Current Wedding Date</Label>
              <Input
                value={new Date(currentStartDate).toLocaleDateString("en-IN", {
                  dateStyle: "long",
                })}
                disabled
                className="bg-ivory-100 font-semibold text-charcoal h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newDateInput" className="text-xs">
                Proposed New Date *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newDateInput"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-9"
                />
                <Button
                  onClick={handlePreview}
                  disabled={isLoading || !newDate}
                  size="sm"
                  className="bg-charcoal text-ivory hover:bg-charcoal-700"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preview"}
                </Button>
              </div>
            </div>
          </div>

          {preview && (
            <div className="space-y-4 pt-3 border-t border-ivory-200">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-ivory-100 rounded-lg text-center">
                  <span className="text-[10px] uppercase font-bold text-charcoal-400 block">
                    Net Schedule Shift
                  </span>
                  <span className="font-serif text-lg font-bold text-charcoal">
                    {preview.shiftDays > 0 ? `+${preview.shiftDays}` : preview.shiftDays} Days
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">
                    At-Risk Milestones
                  </span>
                  <span className="font-serif text-lg font-bold text-amber-800">
                    {preview.atRiskCount} Tasks
                  </span>
                </div>
                <div className="p-3 bg-burgundy-50 rounded-lg text-center border border-burgundy-200">
                  <span className="text-[10px] uppercase font-bold text-burgundy-700 block">
                    Overdue Milestones
                  </span>
                  <span className="font-serif text-lg font-bold text-burgundy-800">
                    {preview.overdueCount} Tasks
                  </span>
                </div>
              </div>

              {/* Impacted Tasks Preview List */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                  Schedule Impact Preview ({preview.totalTasks} Tasks)
                </h4>
                <div className="border border-ivory-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-200 text-charcoal-600 font-semibold uppercase sticky top-0">
                      <tr>
                        <th className="p-2.5">Task Description</th>
                        <th className="p-2.5">Current Due</th>
                        <th className="p-2.5">New Target</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-200">
                      {preview.affectedTasks.map((t) => (
                        <tr key={t.taskId} className="hover:bg-ivory-50">
                          <td className="p-2.5 font-medium text-charcoal">{t.title}</td>
                          <td className="p-2.5 text-charcoal-500">
                            {new Date(t.currentDueAt).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 font-semibold text-charcoal">
                            {new Date(t.newDueAt).toLocaleDateString()}
                          </td>
                          <td className="p-2.5">
                            {t.isOverdue && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-burgundy-100 text-burgundy-800">
                                Overdue
                              </span>
                            )}
                            {t.isAtRisk && !t.isOverdue && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                At Risk
                              </span>
                            )}
                            {!t.isOverdue && !t.isAtRisk && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                On Schedule
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-gold text-charcoal hover:bg-gold-400 font-medium"
            disabled={isApplying || !preview}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Dates...
              </>
            ) : (
              "Confirm & Shift All Tasks"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
