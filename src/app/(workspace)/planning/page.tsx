/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { CreateTaskDialog } from "@/components/planning/create-task-dialog";
import { DependencyGraphModal } from "@/components/planning/dependency-graph-modal";
import { DateShiftDialog } from "@/components/planning/date-shift-dialog";
import { TeamWorkloadModal } from "@/components/planning/team-workload-modal";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Radio,
  ArrowRight,
  MapPin,
  Heart,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface WeddingItem {
  id: string;
  title: string;
  clientName: string | null;
  city: string | null;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  lifecycleStatus: string;
}

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
  wedding?: {
    id: string;
    title: string;
    startDate: string;
  };
  dependencies?: Array<{
    id: string;
    dependsOnTaskId: string;
    dependsOnTaskTitle?: string;
    dependsOnTaskStatus?: string;
  }>;
}

export default function PlanningPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [weddings, setWeddings] = useState<WeddingItem[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("ALL");
  const [planners, setPlanners] = useState<Array<{ id: string; fullName: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Load weddings
  useEffect(() => {
    fetch("/api/weddings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setWeddings(json.data);
        }
      })
      .catch(console.error);

    fetch("/api/planners")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setPlanners(json.data);
        }
      })
      .catch(console.error);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWeddingId !== "ALL") params.set("weddingId", selectedWeddingId);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedPriority !== "ALL") params.set("priority", selectedPriority);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  }, [selectedWeddingId, selectedStatus, selectedCategory, selectedPriority, search]);

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
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const now = new Date();
  const overdueCount = tasks.filter(
    (t) => t.status !== "DONE" && new Date(t.dueAt) < now
  ).length;

  // Group tasks by Wedding
  const weddingGroups = weddings
    .filter((w) => selectedWeddingId === "ALL" || w.id === selectedWeddingId)
    .map((w) => {
      const weddingTasks = tasks.filter((t) => t.weddingId === w.id);
      return {
        wedding: w,
        tasks: weddingTasks,
        done: weddingTasks.filter((t) => t.status === "DONE").length,
        total: weddingTasks.length,
      };
    });

  // Handle tasks that might not match a known wedding id
  const unassignedTasks = tasks.filter(
    (t) => !weddings.some((w) => w.id === t.weddingId)
  );

  const activeWeddingForDialog =
    selectedWeddingId !== "ALL"
      ? weddings.find((w) => w.id === selectedWeddingId) || weddings[0]
      : weddings[0];

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <PageHeader
        title="Planning & Dependency Engine"
        description="Milestones, dependency graphs, and critical paths categorized strictly by wedding"
      >
        <div className="flex flex-wrap items-center gap-2">
          {activeWeddingForDialog && (
            <DateShiftDialog
              weddingId={activeWeddingForDialog.id}
              currentStartDate={activeWeddingForDialog.startDate || "2027-02-12"}
              onDatesShifted={fetchTasks}
            />
          )}

          <TeamWorkloadModal />

          <DependencyGraphModal
            tasks={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              category: t.category,
              status: t.status,
              priority: t.priority,
              isCriticalPath: t.isCriticalPath,
              dependencies: t.dependencies || [],
            }))}
          />

          {activeWeddingForDialog && (
            <CreateTaskDialog
              weddingId={activeWeddingForDialog.id}
              planners={planners}
              existingTasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
              onTaskCreated={fetchTasks}
            />
          )}
        </div>
      </PageHeader>

      {/* Top Wedding Selector Tabs — Categorizes tasks by wedding */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
            Categorized by Wedding Celebration:
          </span>
          <span className="text-xs text-charcoal-400">
            {selectedWeddingId === "ALL"
              ? `Showing all ${weddings.length} weddings`
              : `Filtered to 1 wedding`}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedWeddingId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedWeddingId === "ALL"
                ? "bg-charcoal text-ivory shadow-sm"
                : "bg-white text-charcoal-600 border border-ivory-300 hover:bg-ivory-100"
            }`}
          >
            All Weddings ({tasks.length} tasks)
          </button>

          {weddings.map((w) => {
            const count = tasks.filter((t) => t.weddingId === w.id).length;
            const isSelected = selectedWeddingId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWeddingId(w.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-gold text-charcoal font-bold shadow-sm border border-gold"
                    : "bg-white text-charcoal-700 border border-ivory-300 hover:bg-ivory-100"
                }`}
              >
                <Heart className={`w-3 h-3 ${isSelected ? "text-charcoal fill-charcoal" : "text-gold"}`} />
                <span>{w.title.split("—")[0].trim()}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? "bg-charcoal text-gold" : "bg-ivory-200 text-charcoal-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">
              Blocked
            </span>
            <span className="text-xl font-bold font-serif text-purple-800">{blockedCount}</span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-gold-700 block">
              Critical Path
            </span>
            <span className="text-xl font-bold font-serif text-charcoal">{criticalCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <Input
            placeholder="Search tasks by title, category, or deliverables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-ivory-300 text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
        >
          <option value="ALL">All Categories</option>
          <option value="Venue & Layout">Venue & Layout</option>
          <option value="Decor & Production">Decor & Production</option>
          <option value="Catering & Menu">Catering & Menu</option>
          <option value="Guest Logistics">Guest Logistics</option>
          <option value="Event Execution">Event Execution</option>
          <option value="Finance">Finance</option>
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="h-10 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-10 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
        >
          <option value="ALL">All Statuses</option>
          <option value="TO_PLAN">To Plan</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Task List — Categorized by Wedding Sections */}
      {loading ? (
        <div className="p-16 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Calculating categorized wedding schedule...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-ivory-200">
          <CheckSquare className="w-8 h-8 text-gold mx-auto mb-2" />
          <h3 className="text-base font-serif font-bold text-charcoal">No Tasks Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Try adjusting your search filters or select a different wedding celebration.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {weddingGroups.map(({ wedding: w, tasks: wTasks, done, total }) => {
            if (wTasks.length === 0 && selectedWeddingId === "ALL") return null;

            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-ivory-300 shadow-sm overflow-hidden"
              >
                {/* Wedding Header Card */}
                <div className="p-5 bg-gradient-to-r from-ivory-100 via-white to-ivory-50 border-b border-ivory-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-gold/20 text-gold-800 border-gold/40 text-[10px] font-bold uppercase">
                        {w.lifecycleStatus || "PLANNING"}
                      </Badge>
                      <span className="text-xs font-medium text-charcoal-500">
                        {w.clientName || "Bespoke Couple"}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-charcoal">
                      {w.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                        {w.venue || "Palace"}, {w.city || "Rajasthan"}
                      </span>
                      {w.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                          {new Date(w.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-start md:self-center">
                    {/* Progress Indicator */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-charcoal">
                        {done} / {total} Completed ({progress}%)
                      </div>
                      <div className="w-32 bg-ivory-200 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Link to Control Room for this specific wedding */}
                    <Link href={`/control-room?weddingId=${w.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-gold/40 text-charcoal hover:bg-gold/10 text-xs shrink-0"
                      >
                        <Radio className="w-3.5 h-3.5 text-gold animate-pulse" />
                        <span>Control Room</span>
                        <ArrowRight className="w-3 h-3 text-gold" />
                      </Button>
                    </Link>

                    {/* Add Task for this wedding */}
                    <CreateTaskDialog
                      weddingId={w.id}
                      planners={planners}
                      existingTasks={wTasks.map((t) => ({ id: t.id, title: t.title }))}
                      onTaskCreated={fetchTasks}
                    />
                  </div>
                </div>

                {/* Task Items belonging to this wedding */}
                {wTasks.length === 0 ? (
                  <div className="p-8 text-center text-charcoal-400 text-xs">
                    No milestones found for this filter criteria.
                  </div>
                ) : (
                  <div className="divide-y divide-ivory-200">
                    {wTasks.map((task) => {
                      const isOverdue =
                        task.status !== "DONE" && new Date(task.dueAt) < now;
                      const hasPrereqs =
                        task.dependencies && task.dependencies.length > 0;
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

                            {/* Dependencies */}
                            {hasPrereqs && (
                              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-charcoal-500">
                                <span className="font-semibold text-charcoal-600">
                                  Prerequisites:
                                </span>
                                {task.dependencies?.map((d) => (
                                  <span
                                    key={d.id}
                                    className={`px-1.5 py-0.5 rounded border text-[10px] flex items-center gap-1 ${
                                      d.dependsOnTaskStatus === "DONE"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-ivory-100 text-charcoal border-ivory-300"
                                    }`}
                                  >
                                    {d.dependsOnTaskStatus === "DONE" && (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    {d.dependsOnTaskTitle}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Status Dropdown Action */}
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
          })}

          {/* Unassigned tasks if any */}
          {unassignedTasks.length > 0 && selectedWeddingId === "ALL" && (
            <div className="bg-white rounded-2xl border border-ivory-300 shadow-sm overflow-hidden p-5">
              <h4 className="font-serif font-bold text-sm text-charcoal mb-3">General Operational Tasks</h4>
              <div className="divide-y divide-ivory-200">
                {unassignedTasks.map((task) => (
                  <div key={task.id} className="py-2 flex items-center justify-between text-xs">
                    <span>{task.title}</span>
                    <span className="font-semibold text-charcoal-500">{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
