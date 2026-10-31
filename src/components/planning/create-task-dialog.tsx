/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckSquare, Loader2 } from "lucide-react";
import { createTaskSchema } from "@/modules/planning/validation";
import { z } from "zod";

type FormData = z.input<typeof createTaskSchema>;

const CATEGORIES = [
  "Venue & Layout",
  "Decor & Production",
  "Catering & Menu",
  "Invitations & Stationery",
  "Media & Films",
  "Rituals & Pandit",
  "Guest Logistics",
  "Hospitality",
  "Bridal & Beauty",
  "Event Execution",
  "Finance",
  "General",
];

export function CreateTaskDialog({
  weddingId,
  planners,
  existingTasks,
  onTaskCreated,
}: {
  weddingId: string;
  planners?: Array<{ id: string; fullName: string }>;
  existingTasks?: Array<{ id: string; title: string }>;
  onTaskCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepId, setSelectedDepId] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createTaskSchema as any) as any,
    defaultValues: {
      weddingId,
      category: "Decor & Production",
      priority: "MEDIUM",
      status: "TO_PLAN",
      estimatedMinutes: 120,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...data,
        weddingId,
        dependsOnTaskIds: selectedDepId ? [selectedDepId] : [],
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create task");
      }

      reset();
      setSelectedDepId("");
      setOpen(false);
      onTaskCreated?.();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <CheckSquare className="w-5 h-5 text-gold" />
            Create Wedding Planning Task
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Mandap Floral Architecture & Setup"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-burgundy-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical Path</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueAt">Deadline / Target Due Date *</Label>
              <Input
                id="dueAt"
                type="datetime-local"
                {...register("dueAt")}
              />
              {errors.dueAt && (
                <p className="text-xs text-burgundy-600">{errors.dueAt.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estimatedMinutes">Est. Effort (Minutes)</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                step="15"
                {...register("estimatedMinutes", { valueAsNumber: true })}
              />
            </div>

            {planners && (
              <div className="space-y-1.5">
                <Label htmlFor="ownerId">Assigned Planner</Label>
                <select
                  id="ownerId"
                  {...register("ownerId")}
                  className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">-- Unassigned --</option>
                  {planners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {existingTasks && existingTasks.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="depSelect">Prerequisite Task (Optional)</Label>
                <select
                  id="depSelect"
                  value={selectedDepId}
                  onChange={(e) => setSelectedDepId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">-- None (Independent) --</option>
                  {existingTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Scope & Action Items</Label>
            <Textarea
              id="description"
              placeholder="Key checkpoints, vendor deliverables, client approvals required..."
              rows={3}
              {...register("description")}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gold text-charcoal hover:bg-gold-400 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
