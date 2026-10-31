"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { CascadeImpactAnalysis, TimelineItemWithDeps } from "@/modules/control-room/types";

interface DelayCascadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineItems: TimelineItemWithDeps[];
  initialItemId?: string;
  weddingId: string;
  eventId: string;
}

export function DelayCascadeModal({
  isOpen,
  onClose,
  timelineItems,
  initialItemId,
  weddingId,
  eventId,
}: DelayCascadeModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItemId || (timelineItems[0]?.id ?? "")
  );
  const [delayMinutes, setDelayMinutes] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CascadeImpactAnalysis | null>(null);

  // Sync initialItemId if changed
  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId]);

  const runAnalysis = useCallback(
    async (targetId?: string, minutes?: number) => {
      const idToUse = targetId || selectedItemId;
      const minsToUse = minutes !== undefined ? minutes : delayMinutes;

      if (!idToUse) return;

      setIsLoading(true);
      try {
        const res = await fetch("/api/control-room/timeline/cascade-impact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId,
            eventId,
            delayedItemId: idToUse,
            delayMinutes: minsToUse,
          }),
        });

        const json = await res.json();
        if (json.success) {
          setAnalysis(json.data);
        }
      } catch (err) {
        console.error("Failed to calculate cascade impact:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [weddingId, eventId, selectedItemId, delayMinutes]
  );

  useEffect(() => {
    if (isOpen && (selectedItemId || timelineItems[0]?.id)) {
      runAnalysis(selectedItemId || timelineItems[0]?.id, delayMinutes);
    }
  }, [isOpen, selectedItemId, delayMinutes, timelineItems, runAnalysis]);

  const selectedItem = timelineItems.find((i) => i.id === selectedItemId);

  const formatIST = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-warm-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-gold/15 text-gold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-2xl text-charcoal">
                Timeline Delay Cascade Simulator
              </DialogTitle>
              <DialogDescription className="text-xs text-charcoal/60">
                Deterministic graph traversal projecting downstream delays for {selectedItem?.title || "selected activity"}, key moment risks, and tactical recovery options.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="p-4 rounded-lg bg-ivory border border-sand/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1.5">
                Trigger Activity (Delayed Item)
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  runAnalysis(e.target.value, delayMinutes);
                }}
                className="w-full text-sm border border-sand rounded-md p-2 bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {timelineItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.isKeyMoment ? "★ " : ""}
                    {item.title} (
                    {new Date(item.startsAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1.5">
                Simulated Delay: +{delayMinutes} Minutes
              </label>
              <div className="flex items-center gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <Button
                    key={mins}
                    type="button"
                    size="sm"
                    variant={delayMinutes === mins ? "default" : "outline"}
                    className={`h-9 px-3 text-xs ${
                      delayMinutes === mins
                        ? "bg-gold text-white hover:bg-gold-dark"
                        : "border-sand bg-white hover:bg-cream"
                    }`}
                    onClick={() => {
                      setDelayMinutes(mins);
                      runAnalysis(selectedItemId, mins);
                    }}
                  >
                    +{mins}m
                  </Button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={delayMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDelayMinutes(val);
                    if (val > 0) runAnalysis(selectedItemId, val);
                  }}
                  className="w-20 text-sm border border-sand rounded-md p-1.5 bg-white text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center text-sm text-charcoal/60">
            Calculating dependency propagation across timeline graph...
          </div>
        )}

        {/* Analysis Results */}
        {!isLoading && analysis && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-white border border-sand/40">
                <div className="text-xs font-medium text-charcoal/60">Downstream Impacted</div>
                <div className="text-2xl font-serif font-bold text-charcoal mt-1">
                  {analysis.affectedItems.length}{" "}
                  <span className="text-xs font-sans font-normal text-charcoal/50">
                    activities shifted
                  </span>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border ${
                  analysis.criticalMomentsAffected > 0
                    ? "bg-status-critical/10 border-status-critical/30"
                    : "bg-white border-sand/40"
                }`}
              >
                <div className="text-xs font-medium text-charcoal/60 flex items-center gap-1">
                  {analysis.criticalMomentsAffected > 0 && (
                    <ShieldAlert className="w-3.5 h-3.5 text-status-critical" />
                  )}
                  <span>Key Moments At Risk</span>
                </div>
                <div
                  className={`text-2xl font-serif font-bold mt-1 ${
                    analysis.criticalMomentsAffected > 0
                      ? "text-status-critical"
                      : "text-status-success"
                  }`}
                >
                  {analysis.criticalMomentsAffected}
                  <span className="text-xs font-sans font-normal ml-1">
                    {analysis.criticalMomentsAffected > 0 ? "Mahurat / Key Events" : "Safe"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-sand/40">
                <div className="text-xs font-medium text-charcoal/60">Max Cascade Shift</div>
                <div className="text-2xl font-serif font-bold text-gold mt-1">
                  +{Math.max(
                    analysis.delayMinutes,
                    ...analysis.affectedItems.map((i) => i.delayShiftMinutes),
                    0
                  )}{" "}
                  <span className="text-xs font-sans font-normal text-charcoal/50">mins</span>
                </div>
              </div>
            </div>

            {/* Affected Items Table */}
            <div>
              <h4 className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Cascaded Schedule Adjustments ({analysis.affectedItems.length})</span>
                <span className="text-[11px] font-normal normal-case text-charcoal/50">
                  Times in Asia/Kolkata (IST)
                </span>
              </h4>

              {analysis.affectedItems.length === 0 ? (
                <div className="p-6 text-center rounded-lg bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No downstream activities forced to shift! Existing schedule buffers absorbed the +{analysis.delayMinutes}m delay completely.</span>
                </div>
              ) : (
                <div className="border border-sand/40 rounded-lg overflow-hidden bg-white">
                  <div className="divide-y divide-sand/20">
                    {analysis.affectedItems.map((item) => (
                      <div
                        key={item.itemId}
                        className={`p-3 text-sm flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                          item.isKeyMoment ? "bg-gold/5" : "hover:bg-ivory/50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {item.isKeyMoment && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded">
                                <Sparkles className="w-3 h-3" />
                                Key Moment
                              </span>
                            )}
                            <span className="font-medium text-charcoal">{item.title}</span>
                            <span className="text-xs font-mono font-semibold text-status-warning bg-status-warning/10 px-1.5 py-0.5 rounded">
                              +{item.delayShiftMinutes}m
                            </span>
                          </div>
                          <p className="text-xs text-charcoal/60">{item.reason}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="text-charcoal/40 line-through">
                            {formatIST(item.originalStartsAt)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gold" />
                          <span className="font-semibold text-charcoal">
                            {formatIST(item.projectedStartsAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Recovery Advisory */}
            <div className="p-4 rounded-lg bg-burgundy/5 border border-burgundy/20 space-y-2">
              <div className="flex items-center gap-2 text-burgundy font-serif font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>On-Site Tactical Recovery Recommendations</span>
              </div>
              <ul className="space-y-1.5 text-xs text-charcoal/80">
                {analysis.recoveryRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gold font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="outline" className="border-sand" onClick={onClose}>
            Close Simulation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
