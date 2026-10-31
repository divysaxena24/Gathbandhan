/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CreateTaskDialog } from "@/components/planning/create-task-dialog";
import { DependencyGraphModal } from "@/components/planning/dependency-graph-modal";
import { DateShiftDialog } from "@/components/planning/date-shift-dialog";
import { TeamWorkloadModal } from "@/components/planning/team-workload-modal";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

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
  const [planners, setPlanners] = useState<Array<{ id: string; fullName: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (selectedPriority !== "ALL") params.set("priority", selectedPriority);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.data || []);
      }

      // Fetch planners for assignment dialogs
      const pRes = await fetch("/api/planners");
      if (pRes.ok) {
        const pJson = await pRes.json();
        setPlanners(pJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedCategory, selectedPriority, search]);

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
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // KPIs
  const now = new Date();
  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const criticalCount = tasks.filter((t) => t.isCriticalPath || t.priority === "CRITICAL").length;
  const overdueCount = activeTasks.filter((t) => new Date(t.dueAt) < now).length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;

  const currentWedding = tasks[0]?.wedding || {
    id: "e0000000-0000-0000-0000-000000000001",
    title: "Sharma Royal Wedding",
    startDate: "2027-02-12",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning & Dependency Engine"
        description="Backward-scheduled milestones, acyclic dependency graphs, and team capacity"
      >
        <div className="flex flex-wrap items-center gap-2">
          <DateShiftDialog
            weddingId={currentWedding.id}
            currentStartDate={currentWedding.startDate}
            onDatesShifted={fetchTasks}
          />
          <TeamWorkloadModal />
          <DependencyGraphModal
            tasks={tasks as any}
            onDependencyChanged={fetchTasks}
          />
          <CreateTaskDialog
            weddingId={currentWedding.id}
            planners={planners}
            existingTasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
            onTaskCreated={fetchTasks}
          />
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
              Total Milestones
            </span>
            <span className="text-xl font-bold font-serif text-charcoal">
              {tasks.length}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              In Progress
            </span>
            <span className="text-xl font-bold font-serif text-amber-800">
              {inProgressCount}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Completed
            </span>
            <span className="text-xl font-bold font-serif text-emerald-800">
              {doneCount}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-burgundy-700 block">
              Overdue
            </span>
            <span className="text-xl font-bold font-serif text-burgundy-800">
              {overdueCount}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">
              Blocked
            </span>
            <span className="text-xl font-bold font-serif text-purple-800">
              {blockedCount}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-gold-700 block">
              Critical Path
            </span>
            <span className="text-xl font-bold font-serif text-charcoal">
              {criticalCount}
            </span>
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
            className="pl-9 bg-white border-ivory-300 text-sm"
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

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="h-10 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical Path</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Task List Table */}
      {loading ? (
        <div className="p-16 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Calculating dependency schedule...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-ivory-200">
          <CheckSquare className="w-8 h-8 text-gold mx-auto mb-2" />
          <h3 className="text-base font-serif font-bold text-charcoal">No Tasks Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Try adjusting your search filters or create a new task milestone.
          </p>
        </div>
      ) : (
        <div className="border border-ivory-300 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="divide-y divide-ivory-200">
            {tasks.map((task) => {
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
                    <div className="flex flex-wrap items-center gap-2">
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
                      className={`font-serif text-base font-bold text-charcoal ${
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

                    <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gold" />
                        Due: {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                        {task.estimatedMinutes} mins est.
                      </span>
                      {task.owner && (
                        <span>Assigned to: {task.owner.fullName}</span>
                      )}
                    </div>

                    {/* Dependencies render */}
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
        </div>
      )}
    </div>
  );
}
