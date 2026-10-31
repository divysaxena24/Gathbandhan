/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  GitBranch,
  ArrowRight,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  dependencies?: Array<{
    id: string;
    dependsOnTaskId: string;
    dependsOnTaskTitle?: string;
  }>;
}

export function DependencyGraphModal({
  tasks,
  onDependencyChanged,
}: {
  tasks: TaskItem[];
  onDependencyChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDependsOnId, setSelectedDependsOnId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddDependency = async () => {
    if (!selectedTaskId || !selectedDependsOnId) {
      setError("Please select both a dependent task and a prerequisite task.");
      return;
    }
    if (selectedTaskId === selectedDependsOnId) {
      setError("A task cannot depend on itself (circular dependency).");
      return;
    }

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/tasks/${selectedTaskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dependsOnTaskId: selectedDependsOnId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to add dependency");
      }

      setSuccess("Dependency added successfully!");
      setSelectedTaskId("");
      setSelectedDependsOnId("");
      onDependencyChanged?.();
    } catch (err: any) {
      setError(err.message || "Failed to add dependency");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDependency = async (taskId: string, dependsOnTaskId: string) => {
    setIsDeleting(`${taskId}-${dependsOnTaskId}`);
    setError(null);

    try {
      const res = await fetch(
        `/api/tasks/${taskId}/dependencies?dependsOnTaskId=${dependsOnTaskId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to remove dependency");
      }

      onDependencyChanged?.();
    } catch (err: any) {
      setError(err.message || "Failed to remove dependency");
    } finally {
      setIsDeleting(null);
    }
  };

  // Collect all dependency edges
  const allEdges: Array<{
    taskId: string;
    taskTitle: string;
    taskCategory: string;
    dependsOnTaskId: string;
    dependsOnTitle: string;
  }> = [];

  for (const t of tasks) {
    if (t.dependencies) {
      for (const d of t.dependencies) {
        allEdges.push({
          taskId: t.id,
          taskTitle: t.title,
          taskCategory: t.category,
          dependsOnTaskId: d.dependsOnTaskId,
          dependsOnTitle: d.dependsOnTaskTitle || "Prerequisite Task",
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-ivory-300 text-charcoal hover:bg-ivory-100">
          <GitBranch className="w-4 h-4 text-gold" />
          Dependency Graph ({allEdges.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <GitBranch className="w-5 h-5 text-gold" />
            Task Dependency Graph & Acyclic Validator
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-6 py-2">
          {/* Add Dependency Control */}
          <div className="p-4 bg-ivory-100/70 rounded-xl border border-ivory-300 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">
              Add New Dependency Edge
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="depTask" className="text-xs">
                  This Task (Dependent):
                </Label>
                <select
                  id="depTask"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
                >
                  <option value="">-- Choose Dependent Task --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="prereqTask" className="text-xs">
                  Depends On (Must complete first):
                </Label>
                <select
                  id="prereqTask"
                  value={selectedDependsOnId}
                  onChange={(e) => setSelectedDependsOnId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
                >
                  <option value="">-- Choose Prerequisite Task --</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleAddDependency}
                disabled={isAdding || !selectedTaskId || !selectedDependsOnId}
                size="sm"
                className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-1.5"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Validating Graph...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Link Dependency
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Dependency List Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Active Dependency Chains ({allEdges.length})
              </h4>
              <span className="text-xs text-charcoal-500">
                Verified Direct Acyclic Graph (DAG)
              </span>
            </div>

            {allEdges.length === 0 ? (
              <div className="p-8 text-center text-charcoal-500 bg-white rounded-lg border border-ivory-200 text-xs">
                No dependencies defined yet. All tasks are currently scheduled independently.
              </div>
            ) : (
              <div className="border border-ivory-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-200 text-charcoal-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Prerequisite Task (First)</th>
                      <th className="p-3 text-center w-12"></th>
                      <th className="p-3">Dependent Task (After)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {allEdges.map((edge, idx) => (
                      <tr key={idx} className="hover:bg-ivory-50">
                        <td className="p-3 font-semibold text-charcoal">
                          {edge.dependsOnTitle}
                        </td>
                        <td className="p-3 text-center text-gold">
                          <ArrowRight className="w-4 h-4 mx-auto" />
                        </td>
                        <td className="p-3 text-charcoal">
                          <span className="font-semibold text-charcoal block">
                            {edge.taskTitle}
                          </span>
                          <span className="text-[10px] text-charcoal-400">
                            {edge.taskCategory}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveDependency(edge.taskId, edge.dependsOnTaskId)
                            }
                            disabled={
                              isDeleting === `${edge.taskId}-${edge.dependsOnTaskId}`
                            }
                            className="h-7 w-7 p-0 text-burgundy-600 hover:text-burgundy-800 hover:bg-burgundy-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
