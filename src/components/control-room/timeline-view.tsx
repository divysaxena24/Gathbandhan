"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Sparkles,
  Sliders,
  Plus,
  MapPin,
  User,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineItemStatus, TimelineItemWithDeps } from "@/modules/control-room/types";
import { DelayCascadeModal } from "./delay-cascade-modal";

interface TimelineViewProps {
  timelineItems: TimelineItemWithDeps[];
  weddingId: string;
  eventId: string;
  onRefresh: () => void;
}

export function TimelineView({
  timelineItems,
  weddingId,
  eventId,
  onRefresh,
}: TimelineViewProps) {
  const [currentTimeIST, setCurrentTimeIST] = useState<string>("");
  const [selectedCascadeItem, setSelectedCascadeItem] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Keep live Asia/Kolkata clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeIST(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatIST = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleUpdateStatus = async (
    itemId: string,
    newStatus: TimelineItemStatus
  ) => {
    try {
      await fetch(`/api/control-room/timeline/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update timeline item status:", err);
    }
  };

  const filteredItems = timelineItems.filter((i) => {
    if (statusFilter === "ALL") return true;
    return i.status === statusFilter;
  });

  const getStatusBadge = (status: TimelineItemStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-status-success/15 text-status-success border-status-success/30 font-medium">
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-600/15 text-blue-800 border-blue-300 font-medium animate-pulse">
            In Progress
          </Badge>
        );
      case "DELAYED":
        return (
          <Badge className="bg-status-critical/15 text-status-critical border-status-critical/30 font-medium">
            Delayed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-charcoal/20 text-charcoal/60 border-sand font-normal">
            Cancelled
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-sand/30 text-charcoal/70 border-sand font-normal">
            Upcoming
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Time & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-lg border border-sand/40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gold/15 text-gold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-charcoal/50 font-semibold">
              Live Control Room Clock (Asia/Kolkata)
            </div>
            <div className="font-mono text-xl font-bold text-charcoal">
              {currentTimeIST || "Syncing IST..."} <span className="text-xs font-sans text-gold">IST</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-sand rounded-md p-2 bg-white text-charcoal"
          >
            <option value="ALL">All Items ({timelineItems.length})</option>
            <option value="PENDING">Upcoming</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
          </select>

          <Button
            size="sm"
            variant="outline"
            className="border-sand bg-white text-xs gap-1.5 hover:bg-cream"
            onClick={() => setSelectedCascadeItem(timelineItems[0]?.id || null)}
          >
            <Sliders className="w-3.5 h-3.5 text-gold" />
            <span>Simulate Delay Cascade</span>
          </Button>

          <Button
            size="sm"
            className="bg-gold text-white hover:bg-gold-dark text-xs gap-1.5"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </Button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative border-l-2 border-gold/40 pl-6 ml-3 space-y-6 my-4">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white border border-sand/40 rounded-lg text-charcoal/50 text-xs">
            No timeline activities scheduled for this event.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Node Marker */}
              <div
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white transition-all ${
                  item.status === "COMPLETED"
                    ? "border-status-success bg-status-success text-white"
                    : item.status === "IN_PROGRESS"
                    ? "border-blue-600 bg-blue-600 animate-ping"
                    : item.isKeyMoment
                    ? "border-gold bg-gold"
                    : "border-sand bg-white"
                }`}
              />

              {/* Activity Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  item.isKeyMoment
                    ? "bg-gold/5 border-gold/40 shadow-sm"
                    : item.status === "IN_PROGRESS"
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-white border-sand/40 hover:border-sand"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-charcoal bg-sand/20 px-2 py-0.5 rounded">
                      {formatIST(item.startsAt)} – {formatIST(item.endsAt)}
                    </span>

                    {item.isKeyMoment && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded">
                        <Sparkles className="w-3 h-3" />
                        Key Moment
                      </span>
                    )}

                    {getStatusBadge(item.status)}

                    {item.delayMinutes > 0 && (
                      <span className="text-[11px] font-mono font-semibold text-status-critical bg-status-critical/10 px-1.5 py-0.5 rounded">
                        +{item.delayMinutes}m delay
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-gold hover:text-gold-dark hover:bg-gold/10 gap-1"
                      onClick={() => setSelectedCascadeItem(item.id)}
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Test Delay Impact</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-sand bg-white hover:bg-cream"
                        >
                          Status ▾
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(item.id, "IN_PROGRESS")}
                        >
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(item.id, "COMPLETED")}
                        >
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(item.id, "DELAYED")}
                          className="text-status-critical"
                        >
                          Mark Delayed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(item.id, "PENDING")}
                        >
                          Reset to Upcoming
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="pt-1 space-y-2">
                  <h4 className="font-serif font-bold text-base text-charcoal">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-charcoal/70">{item.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal/60 pt-1">
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        <span>{item.location}</span>
                      </span>
                    )}

                    {item.vendorName && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-gold" />
                        <span>Vendor: {item.vendorName}</span>
                      </span>
                    )}

                    {item.ownerName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gold" />
                        <span>Lead: {item.ownerName}</span>
                      </span>
                    )}
                  </div>

                  {/* Prerequisites info */}
                  {item.prerequisites.length > 0 && (
                    <div className="pt-2 border-t border-sand/20 flex items-center gap-1.5 flex-wrap text-[11px] text-charcoal/60">
                      <span className="font-medium text-charcoal/70">Depends On:</span>
                      {item.prerequisites.map((p) => (
                        <span
                          key={p.id}
                          className="bg-ivory border border-sand/40 px-2 py-0.5 rounded text-charcoal flex items-center gap-1"
                        >
                          <span>{p.dependsOnTitle}</span>
                          {p.bufferMinutes > 0 && (
                            <span className="text-gold font-mono">(+{p.bufferMinutes}m buffer)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delay Cascade Simulator Modal */}
      {selectedCascadeItem && (
        <DelayCascadeModal
          isOpen={!!selectedCascadeItem}
          onClose={() => setSelectedCascadeItem(null)}
          timelineItems={timelineItems}
          initialItemId={selectedCascadeItem}
          weddingId={weddingId}
          eventId={eventId}
        />
      )}

      {/* Create Activity Dialog */}
      <CreateActivityDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        weddingId={weddingId}
        eventId={eventId}
        onCreated={onRefresh}
      />
    </div>
  );
}

function CreateActivityDialog({
  isOpen,
  onClose,
  weddingId,
  eventId,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  eventId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("2027-02-12T11:00:00+05:30");
  const [endsAt, setEndsAt] = useState("2027-02-12T11:45:00+05:30");
  const [location, setLocation] = useState("");
  const [isKeyMoment, setIsKeyMoment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/control-room/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          eventId,
          title,
          description,
          startsAt,
          endsAt,
          location,
          isKeyMoment,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to add timeline item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-warm-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-charcoal">
            Add Timeline Activity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Groom Varmala Entry & Flower Shower"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white text-charcoal"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Operational details or coordinator checklist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white text-charcoal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                Start Time (IST)
              </label>
              <input
                type="text"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                End Time (IST)
              </label>
              <input
                type="text"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Venue Location / Pavilion
            </label>
            <input
              type="text"
              placeholder="e.g. Courtyard / Lake Garden"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isKeyMoment"
              checked={isKeyMoment}
              onChange={(e) => setIsKeyMoment(e.target.checked)}
              className="rounded border-sand text-gold"
            />
            <label htmlFor="isKeyMoment" className="text-xs font-medium text-charcoal">
              Flag as Key Moment (Mahurat, Pheras, Grand Entry)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="border-sand text-xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gold text-white hover:bg-gold-dark text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
