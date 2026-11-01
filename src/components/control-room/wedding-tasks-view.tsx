"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  GitBranch,
  Crown,
  Loader2,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateTaskDialog } from "@/components/planning/create-task-dialog";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  category: string;
  ownerId: string | null;
  status: "TO_PLAN" | "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueAt: string;
  estimatedMinutes: number;
  actualMinutes: number;
  isCriticalPath: boolean;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  dependencies?: Array<{
    id: string;
    dependsOnTaskId: string;
    dependsOnTaskTitle?: string;
    dependsOnTaskStatus?: string;
  }>;
}

export function WeddingTasksView({
  weddingId,
  weddingTitle,
}: {
  weddingId: string;
  weddingTitle?: string;
}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [planners, setPlanners] = useState<Array<{ id: string; fullName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ weddingId });
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data || []);
      }

      const pRes = await fetch("/api/planners");
      if (pRes.ok) {
        const pJson = await pRes.json();
        setPlanners(pJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load wedding tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [weddingId, selectedStatus, selectedCategory, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateStatus = async (
    taskId: string,
    newStatus: "TO_PLAN" | "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE"
  ) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        toast.success(`Task status updated to ${newStatus}`);
      } else {
        const errJson = await res.json();
        toast.error(errJson.error?.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("Could not update task status");
    }
  };

  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const criticalCount = tasks.filter((t) => t.isCriticalPath).length;
  const now = new Date();
  const overdueCount = tasks.filter(
    (t) => t.status !== "DONE" && new Date(t.dueAt) < now
  ).length;

  const progressPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Add Task */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-charcoal">
            Planning Milestones & Execution Tasks
          </h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Backward-scheduled deadlines, critical path constraints, and deliverables for {weddingTitle || "this wedding"}
          </p>
        </div>

        <CreateTaskDialog
          weddingId={weddingId}
          planners={planners}
          existingTasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
          onTaskCreated={fetchTasks}
        />
      </div>

      {/* Progress Bar & Summary */}
      <div className="p-4 rounded-xl bg-white border border-ivory-300 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-charcoal flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Milestone Progress: {doneCount} of {tasks.length} Completed
          </span>
          <span className="font-bold text-charcoal font-display">{progressPercent}%</span>
        </div>
        <div className="w-full bg-ivory-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
              Total Milestones
            </span>
            <span className="text-xl font-bold font-serif text-charcoal">{tasks.length}</span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              In Progress
            </span>
            <span className="text-xl font-bold font-serif text-amber-800">{inProgressCount}</span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Completed
            </span>
            <span className="text-xl font-bold font-serif text-emerald-800">{doneCount}</span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-burgundy-700 block">
              Overdue
            </span>
            <span className="text-xl font-bold font-serif text-burgundy-800">{overdueCount}</span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white col-span-2 md:col-span-1">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-gold-700 block">
              Critical Path
            </span>
            <span className="text-xl font-bold font-serif text-charcoal">{criticalCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <Input
            placeholder="Search tasks by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-ivory-300 text-xs"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-10 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
        >
          <option value="ALL">All Statuses</option>
          <option value="TO_PLAN">To Plan</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="p-12 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Loading wedding milestones...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-ivory-200">
          <CheckSquare className="w-8 h-8 text-gold mx-auto mb-2" />
          <h4 className="font-serif font-bold text-base text-charcoal">No Tasks Scheduled</h4>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
            Create milestone deadlines to track venue permits, catering tasting, and live execution.
          </p>
        </div>
      ) : (
        <div className="border border-ivory-300 rounded-xl overflow-hidden bg-white shadow-sm divide-y divide-ivory-200">
          {tasks.map((task) => {
            const isOverdue = task.status !== "DONE" && new Date(task.dueAt) < now;
            const hasPrereqs = task.dependencies && task.dependencies.length > 0;
            const uncompletedPrereq = task.dependencies?.some(
              (d) => d.dependsOnTaskStatus !== "DONE"
            );

            return (
              <div
                key={task.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  task.status === "DONE"
                    ? "bg-emerald-50/20 opacity-75"
                    : isOverdue
                    ? "bg-burgundy-50/30"
                    : "hover:bg-ivory-50/50"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ivory-100 text-charcoal-700">
                      {task.category}
                    </span>

                    {task.isCriticalPath && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gold text-charcoal">
                        <Crown className="w-3 h-3" />
                        Critical Path
                      </span>
                    )}

                    {task.priority === "HIGH" && !task.isCriticalPath && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        High Priority
                      </span>
                    )}

                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-burgundy-100 text-burgundy-800">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}

                    {hasPrereqs && uncompletedPrereq && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        <GitBranch className="w-3 h-3" />
                        Blocked by Prerequisite
                      </span>
                    )}
                  </div>

                  <h4
                    className={`font-serif text-sm font-bold text-charcoal ${
                      task.status === "DONE" ? "line-through text-charcoal-400" : ""
                    }`}
                  >
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs text-charcoal-500 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      Due: {new Date(task.dueAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                      {task.estimatedMinutes} mins est.
                    </span>
                    {task.owner && (
                      <span className="truncate">Assigned: {task.owner.fullName}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleUpdateStatus(task.id, e.target.value as any)
                    }
                    className={`h-8 px-2.5 rounded text-xs font-bold border focus:ring-2 focus:ring-gold ${
                      task.status === "DONE"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : task.status === "IN_PROGRESS"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : task.status === "BLOCKED"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : "bg-white text-charcoal border-ivory-300"
                    }`}
                  >
                    <option value="TO_PLAN">To Plan</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
