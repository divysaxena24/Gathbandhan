"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
import { IncidentRecord, IncidentSeverity } from "@/modules/control-room/types";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  eventId?: string;
  onCreated: () => void;
}

export function CreateIncidentModal({
  isOpen,
  onClose,
  weddingId,
  eventId,
  onCreated,
}: CreateIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");
  const [reportedBy, setReportedBy] = useState("Vikram Patel (On-Site Coordinator)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !reportedBy) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/control-room/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          eventId: eventId || null,
          title,
          description,
          severity,
          reportedBy,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTitle("");
        setDescription("");
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create incident:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-warm-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-status-critical/15 text-status-critical">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl text-charcoal">
                Log Event Day Incident
              </DialogTitle>
              <DialogDescription className="text-xs text-charcoal/60">
                Immediately report operational, vendor, venue, or schedule incidents for rapid command resolution.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sangeet DJ Power Trip / Generator Backup Failure"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-sand rounded-md p-2 bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full text-xs border border-sand rounded-md p-2 bg-white text-charcoal"
              >
                <option value="LOW">Low (Minor Delay / Cosmetic)</option>
                <option value="MEDIUM">Medium (Setup Lag / Minor Missing Item)</option>
                <option value="HIGH">High (Vendor Late / Power Deficit)</option>
                <option value="CRITICAL">Critical (Immediate Escalation Required)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                Reported By *
              </label>
              <input
                type="text"
                required
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full text-xs border border-sand rounded-md p-2 bg-white text-charcoal"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Detailed Description & Current Status *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe exact venue location, equipment affected, guest exposure, and immediate steps taken..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-sand text-xs"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-status-critical text-white hover:bg-status-critical/90 text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging Incident..." : "Dispatch & Log Incident"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ResolveIncidentModalProps {
  incident: IncidentRecord | null;
  onClose: () => void;
  onResolved: () => void;
}

export function ResolveIncidentModal({
  incident,
  onClose,
  onResolved,
}: ResolveIncidentModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [costRupees, setCostRupees] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!incident) return null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes) return;

    setIsSubmitting(true);
    try {
      const parsedRupees = parseFloat(costRupees) || 0;
      const costImpactPaise = BigInt(Math.round(parsedRupees * 100));

      const res = await fetch(`/api/control-room/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          resolutionNotes,
          costImpactPaise: costImpactPaise.toString(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        onResolved();
        onClose();
      }
    } catch (err) {
      console.error("Failed to resolve incident:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!incident} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-warm-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-status-success/15 text-status-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl text-charcoal">
                Resolve Incident
              </DialogTitle>
              <DialogDescription className="text-xs text-charcoal/60">
                Record resolution action steps and financial cost impact incurred for client/agency reconciliation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleResolve} className="space-y-4 py-2">
          <div className="p-3 bg-ivory rounded-md border border-sand/40 space-y-1">
            <div className="text-xs font-semibold text-charcoal">{incident.title}</div>
            <div className="text-[11px] text-charcoal/60 line-clamp-2">
              {incident.description}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Resolution Action Notes *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail how the issue was fixed, backup vendors engaged, or timeline adjusted..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-gold resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Financial Cost Impact (₹ Rupees)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50 text-xs">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={costRupees}
                onChange={(e) => setCostRupees(e.target.value)}
                className="w-full text-xs border border-sand rounded-md pl-7 pr-3 py-2 bg-white text-charcoal font-mono"
              />
            </div>
            <p className="text-[11px] text-charcoal/50 mt-1">
              Stored in integer paise for Phase 6 financial settlement and billing reconciliation.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-sand text-xs"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-status-success text-white hover:bg-status-success/90 text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resolving..." : "Mark Incident Resolved"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
