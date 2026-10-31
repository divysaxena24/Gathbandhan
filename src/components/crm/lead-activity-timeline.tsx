"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  ArrowRightCircle,
  UserCheck,
  Calendar,
  Heart,
  AlertTriangle,
  Plus,
  Loader2,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Activity {
  id: string;
  activityType: string;
  title: string;
  description: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string | Date;
  actorName?: string | null;
}

interface LeadActivityTimelineProps {
  leadId: string;
  activities: Activity[];
  onActivityAdded?: () => void;
}

export function LeadActivityTimeline({
  leadId,
  activities,
  onActivityAdded,
}: LeadActivityTimelineProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteText.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle.trim(),
          description: noteText.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to add note");
      }

      toast.success("Activity note added");
      setNoteTitle("");
      setNoteText("");
      setShowAddForm(false);
      onActivityAdded?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding note";
      toast.error("Failed to add note", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CREATED":
        return <Plus className="w-3.5 h-3.5 text-blue-500" />;
      case "STAGE_CHANGED":
        return <ArrowRightCircle className="w-3.5 h-3.5 text-purple-500" />;
      case "PLANNER_ASSIGNED":
        return <UserCheck className="w-3.5 h-3.5 text-gold" />;
      case "FOLLOW_UP_SCHEDULED":
      case "FOLLOW_UP_COMPLETED":
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case "CONVERTED":
        return <Heart className="w-3.5 h-3.5 text-status-success fill-current" />;
      case "MARKED_LOST":
        return <AlertTriangle className="w-3.5 h-3.5 text-status-critical" />;
      case "NOTE_ADDED":
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-charcoal-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          Communication & Activity Timeline
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-7 text-xs gap-1.5"
        >
          <Plus className="w-3 h-3" />
          {showAddForm ? "Cancel Note" : "Add Note"}
        </Button>
      </div>

      {/* Add note inline card */}
      {showAddForm && (
        <form
          onSubmit={handleAddNote}
          className="p-3.5 rounded-xl border border-gold/40 bg-gold/5 space-y-3 animate-in fade-in-50"
        >
          <div className="space-y-1">
            <Label htmlFor="noteTitle" className="text-[11px] font-semibold">
              Subject / Topic
            </Label>
            <Input
              id="noteTitle"
              placeholder="e.g. Call with Bride's Father regarding Mandap style"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="h-8 text-xs bg-background"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="noteText" className="text-[11px] font-semibold">
              Conversation Details
            </Label>
            <textarea
              id="noteText"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="Details discussed, package preference adjustments, date constraints..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-7 text-xs bg-charcoal text-ivory hover:bg-charcoal-700 gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Save Activity Note
            </Button>
          </div>
        </form>
      )}

      {/* Timeline items list */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground italic pl-2">
            No activity logged yet.
          </p>
        ) : (
          activities.map((act) => {
            const dateObj = new Date(act.createdAt);
            const formattedDate = dateObj.toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const formattedTime = dateObj.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={act.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-xs group-hover:border-gold transition-colors">
                  {getActivityIcon(act.activityType)}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      {act.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {formattedDate} · {formattedTime} IST
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {act.description}
                    </p>
                  )}

                  {act.actorName && (
                    <p className="text-[10px] text-muted-foreground/80 font-medium">
                      By {act.actorName}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
