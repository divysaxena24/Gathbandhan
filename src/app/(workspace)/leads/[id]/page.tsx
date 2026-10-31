"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Building,
  Users,
  IndianRupee,
  Phone,
  Mail,
  Heart,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConvertLeadDialog } from "@/components/crm/convert-lead-dialog";
import { LeadActivityTimeline } from "@/components/crm/lead-activity-timeline";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  type Lead,
  type PipelineStage,
  PIPELINE_STAGES,
} from "@/modules/crm/types";
import { formatINR } from "@/lib/money";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<
    | (Lead & {
        assignedPlannerName?: string | null;
        assignedPlannerEmail?: string | null;
        activities: {
          id: string;
          activityType: string;
          title: string;
          description: string | null;
          metadata?: Record<string, unknown> | null;
          createdAt: string;
          actorName?: string | null;
        }[];
      })
    | null
  >(null);

  const [planners, setPlanners] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stage change modal state
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<PipelineStage>("CONTACTED");
  const [lostReason, setLostReason] = useState("");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [leadRes, plannersRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch("/api/planners"),
      ]);

      if (!leadRes.ok) {
        throw new Error("Failed to load lead details");
      }

      const leadJson = await leadRes.json();
      setLead(leadJson.data);

      if (plannersRes.ok) {
        const plannersJson = await plannersRes.json();
        setPlanners(plannersJson.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading lead";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStageChange = async () => {
    if (targetStage === "LOST" && !lostReason.trim()) {
      toast.error("Lost reason required", {
        description: "Please specify why this lead was lost.",
      });
      return;
    }

    try {
      setIsUpdatingStage(true);
      const res = await fetch(`/api/leads/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStage,
          lostReason: targetStage === "LOST" ? lostReason.trim() : null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to update stage");
      }

      toast.success(`Stage updated to ${targetStage}`);
      setStageDialogOpen(false);
      setLostReason("");
      fetchLead();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error("Failed to change stage", { description: msg });
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAssignPlanner = async (plannerId: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedPlannerId: plannerId === "NONE" ? null : plannerId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to assign planner");
      }

      toast.success("Planner assignment updated");
      fetchLead();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error("Assignment failed", { description: msg });
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;

    try {
      setIsSchedulingFollowUp(true);
      const res = await fetch(`/api/leads/${id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextFollowUpAt: followUpDate,
          notes: followUpNotes,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to schedule follow-up");
      }

      toast.success("Follow-up scheduled");
      setFollowUpDate("");
      setFollowUpNotes("");
      fetchLead();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error("Follow-up failed", { description: msg });
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm(`Are you sure you want to delete lead for ${lead?.coupleName}?`)) return;

    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to delete lead");
      }

      toast.success("Lead soft-deleted successfully");
      router.push("/leads");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error("Deletion failed", { description: msg });
    }
  };

  if (loading) {
    return <LoadingState message="Loading lead profile & activity log..." />;
  }

  if (error || !lead) {
    return (
      <ErrorState
        title="Could not load lead"
        message={error || "Lead not found"}
        onRetry={fetchLead}
      />
    );
  }

  const currentStage = PIPELINE_STAGES.find((s) => s.key === lead.status);
  const isConverted = lead.status === "CONVERTED" || Boolean(lead.convertedToClientId);

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-12">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Pipeline
        </Link>

        <div className="flex items-center gap-2">
          {!isConverted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetStage(lead.status as PipelineStage);
                  setStageDialogOpen(true);
                }}
                className="text-xs"
              >
                Change Stage
              </Button>
              <ConvertLeadDialog lead={lead} onConverted={fetchLead} />
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteLead}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Lead Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {lead.coupleName}
            </h1>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                currentStage?.color || "bg-muted text-muted-foreground"
              )}
            >
              {currentStage?.label || lead.status}
            </span>
            {lead.qualificationStatus === "QUALIFIED" && (
              <Badge className="bg-status-success text-white text-[10px] uppercase">
                Qualified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enquiry captured {new Date(lead.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
            {lead.source && ` via ${lead.source}`}
          </p>
        </div>

        {isConverted && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-success-light border border-status-success/30 text-status-success text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Converted to Active Wedding Project</span>
          </div>
        )}
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Wedding Details & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Couple & Wedding Overview Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Wedding Logistics & Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Primary Contact</span>
                  <span className="font-semibold text-foreground">{lead.partnerOneName}</span>
                  {lead.partnerOnePhone && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3 text-gold" />
                      <span>{lead.partnerOnePhone}</span>
                    </div>
                  )}
                  {lead.partnerOneEmail && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-gold" />
                      <span className="truncate">{lead.partnerOneEmail}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Partner / Fiancé</span>
                  <span className="font-semibold text-foreground">
                    {lead.partnerTwoName || "—"}
                  </span>
                  {lead.partnerTwoPhone && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3 text-gold" />
                      <span>{lead.partnerTwoPhone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Destination & Venue</span>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Building className="w-3 h-3 text-gold" />
                    <span>{lead.city || "Not specified"}</span>
                  </div>
                  {lead.venue && (
                    <span className="text-muted-foreground text-[11px] block">{lead.venue}</span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Event Date</span>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gold" />
                    <span>{lead.eventDate || "Flexible"}</span>
                  </div>
                  {lead.dateFlexibility && lead.dateFlexibility !== "EXACT" && (
                    <span className="text-muted-foreground text-[10px]">
                      Flexibility: {lead.dateFlexibility.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Estimated Guests</span>
                  <div className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    <span>{lead.estimatedGuestCount ? `${lead.estimatedGuestCount} Guests` : "—"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Planning Package</span>
                  <span className="font-semibold text-foreground block mt-0.5">
                    {lead.packageType ? lead.packageType.replace("_", " ") : "Full-Service"}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Estimated Budget</span>
                  <div className="font-bold text-foreground text-sm flex items-center gap-1 mt-0.5">
                    <IndianRupee className="w-3.5 h-3.5 text-gold" />
                    <span>
                      {lead.estimatedBudgetPaise
                        ? formatINR(lead.estimatedBudgetPaise)
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {lead.themeNotes && (
                <div className="pt-3 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Theme & Style Vision</span>
                  <p className="mt-0.5 text-foreground leading-relaxed italic">
                    &ldquo;{lead.themeNotes}&rdquo;
                  </p>
                </div>
              )}

              {lead.notes && (
                <div className="pt-3 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Internal Notes</span>
                  <p className="mt-0.5 text-muted-foreground leading-relaxed">
                    {lead.notes}
                  </p>
                </div>
              )}

              {lead.lostReason && (
                <div className="p-3 rounded-lg bg-status-critical-light border border-status-critical/30 text-xs text-status-critical space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Lead Lost Reason:
                  </span>
                  <p>{lead.lostReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline Card */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <LeadActivityTimeline
                leadId={lead.id}
                activities={lead.activities}
                onActivityAdded={fetchLead}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions, Planner, Follow-up */}
        <div className="space-y-6">
          {/* Planner Assignment Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-gold" />
                Assigned Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Select
                  value={lead.assignedPlannerId || "NONE"}
                  onValueChange={handleAssignPlanner}
                >
                  <SelectTrigger className="text-xs bg-background">
                    <SelectValue placeholder="Assign a planner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Unassigned</SelectItem>
                    {planners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {lead.assignedPlannerName && (
                <div className="text-xs text-muted-foreground pt-1">
                  Currently assigned to <span className="font-semibold text-foreground">{lead.assignedPlannerName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Next Follow-up Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gold" />
                Follow-Up Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {lead.nextFollowUpAt ? (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Scheduled Follow-up:</span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span>
                      {new Date(lead.nextFollowUpAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      IST
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No follow-up currently scheduled.</p>
              )}

              <form onSubmit={handleScheduleFollowUp} className="space-y-3 pt-1 border-t border-border/40">
                <div className="space-y-1">
                  <Label htmlFor="followUpDate" className="text-[11px] font-semibold">
                    Set Follow-up Date/Time
                  </Label>
                  <Input
                    id="followUpDate"
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="h-8 text-xs bg-background"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="followUpNotes" className="text-[11px] font-semibold">
                    Follow-up Objective
                  </Label>
                  <Input
                    id="followUpNotes"
                    placeholder="e.g. Present finalized catering quote"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSchedulingFollowUp || !followUpDate}
                  className="w-full text-xs bg-charcoal text-ivory hover:bg-charcoal-700 h-8"
                >
                  {isSchedulingFollowUp ? "Saving..." : "Update Follow-up"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Conversion Action Card */}
          <Card className="border-gold/30 bg-gradient-to-b from-gold/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gold-700 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-current text-gold" />
                Wedding Conversion Gate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {isConverted ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground leading-relaxed">
                    This enquiry has converted to an active client and wedding project.
                  </p>
                  <Link href="/weddings">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                      Open Wedding Projects
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    When the agreement is confirmed, convert this lead to generate the official wedding workspace and client portal.
                  </p>
                  <ConvertLeadDialog
                    lead={lead}
                    onConverted={fetchLead}
                    trigger={
                      <Button
                        size="sm"
                        className="w-full bg-gold text-charcoal-900 hover:bg-gold-400 font-semibold gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        Convert to Wedding
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stage Change Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Update Pipeline Stage
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transition {lead.coupleName} across sales pipeline stages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Target Stage</Label>
              <Select
                value={targetStage}
                onValueChange={(val: PipelineStage) => setTargetStage(val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.filter((s) => s.key !== "CONVERTED").map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetStage === "LOST" && (
              <div className="space-y-1.5 p-3 rounded-lg bg-status-critical-light border border-status-critical/30">
                <Label htmlFor="lostReason" className="font-semibold text-status-critical">
                  Reason for Losing Enquiry *
                </Label>
                <textarea
                  id="lostReason"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-status-critical"
                  placeholder="e.g. Chosen competitor, date unavailable at City Palace, budget reduction..."
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdatingStage}
              onClick={handleStageChange}
              className="bg-charcoal text-ivory hover:bg-charcoal-700"
            >
              {isUpdatingStage ? "Updating..." : "Confirm Transition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
