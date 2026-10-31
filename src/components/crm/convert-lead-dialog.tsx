"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, Loader2, Calendar, CheckCircle2, Building, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertLeadSchema, type ConvertLeadInput } from "@/modules/crm/validation";
import { toast } from "sonner";
import { formatINR } from "@/lib/money";
import { type Lead } from "@/modules/crm/types";

interface ConvertLeadDialogProps {
  lead: Lead;
  onConverted?: () => void;
  trigger?: React.ReactNode;
}

export function ConvertLeadDialog({ lead, onConverted, trigger }: ConvertLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultStartDate = lead.eventDate || "2027-02-12";
  const defaultEndDate = lead.eventDate || "2027-02-14";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConvertLeadInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(convertLeadSchema as any) as any,
    defaultValues: {
      weddingTitle: `${lead.coupleName} Royal Wedding`,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      city: lead.city || "Udaipur",
      venue: lead.venue || "Taj Lake Palace",
      packageType: (lead.packageType as "FULL_SERVICE" | "PARTIAL" | "DAY_OF") || "FULL_SERVICE",
      budgetPaise: lead.estimatedBudgetPaise ? BigInt(lead.estimatedBudgetPaise) : null,
      estimatedGuestCount: lead.estimatedGuestCount || 400,
      notes: lead.notes || "",
    },
  });

  const packageType = watch("packageType");

  const onSubmit = async (data: ConvertLeadInput) => {
    try {
      setIsSubmitting(true);

      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          budgetPaise: data.budgetPaise ? data.budgetPaise.toString() : null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to convert lead");
      }

      toast.success("Lead successfully converted!", {
        description: `Created active wedding '${result.data.wedding.title}' and verified client profile.`,
      });

      setOpen(false);
      onConverted?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error("Conversion failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyConverted = lead.status === "CONVERTED" || Boolean(lead.convertedToClientId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            disabled={isAlreadyConverted}
            className="bg-gold text-charcoal-900 hover:bg-gold-400 gap-1.5 font-medium"
          >
            <Heart className="w-4 h-4 fill-current" />
            {isAlreadyConverted ? "Converted to Wedding" : "Convert to Wedding"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-gold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Transactional Lead Conversion</span>
          </div>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            Convert Lead into Active Wedding Project
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This will transactionally generate a verified client record, an active wedding project, and initial 4-event itinerary (Mehendi, Sangeet, Ceremony, Reception).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Summary Banner */}
          <div className="p-3.5 rounded-lg bg-gold/10 border border-gold/25 space-y-1 text-xs">
            <div className="flex items-center justify-between font-semibold text-charcoal">
              <span>Couple: {lead.coupleName}</span>
              <span>Estimated: {lead.estimatedGuestCount || "—"} Guests</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Contact: {lead.partnerOneName} ({lead.partnerOnePhone || "No phone"})</span>
              <span className="font-medium text-charcoal">
                Budget: {lead.estimatedBudgetPaise ? formatINR(lead.estimatedBudgetPaise) : "Not set"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="weddingTitle" className="text-xs font-semibold">
                Official Wedding Project Title *
              </Label>
              <Input
                id="weddingTitle"
                {...register("weddingTitle")}
                className={errors.weddingTitle ? "border-destructive" : ""}
              />
              {errors.weddingTitle && (
                <p className="text-[11px] text-destructive">{errors.weddingTitle.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  Celebration Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className={errors.startDate ? "border-destructive" : ""}
                />
                {errors.startDate && (
                  <p className="text-[11px] text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  Celebration End Date *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className={errors.endDate ? "border-destructive" : ""}
                />
                {errors.endDate && (
                  <p className="text-[11px] text-destructive">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gold" />
                  Destination City *
                </Label>
                <Input
                  id="city"
                  {...register("city")}
                  className={errors.city ? "border-destructive" : ""}
                />
                {errors.city && (
                  <p className="text-[11px] text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue" className="text-xs font-semibold">
                  Primary Venue
                </Label>
                <Input id="venue" {...register("venue")} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="packageType" className="text-xs font-semibold">
                  Service Package
                </Label>
                <Select
                  value={packageType}
                  onValueChange={(val: "FULL_SERVICE" | "PARTIAL" | "DAY_OF") =>
                    setValue("packageType", val)
                  }
                >
                  <SelectTrigger id="packageType">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_SERVICE">Full-Service Luxury Package</SelectItem>
                    <SelectItem value="PARTIAL">Partial Planning Package</SelectItem>
                    <SelectItem value="DAY_OF">Day-Of Coordination Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Verification safeguard notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-status-success-light/50 border border-status-success/30 text-xs">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
            <div className="text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground block">
                Atomic Database Guarantee
              </span>
              Conversion executes as a single transaction. Repeated or concurrent requests are rejected safely.
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Converting...
                </>
              ) : (
                "Confirm & Create Wedding Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
