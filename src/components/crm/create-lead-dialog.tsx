"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, Sparkles, Building, Calendar, Users, IndianRupee } from "lucide-react";
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
import { createLeadSchema, type CreateLeadInput } from "@/modules/crm/validation";
import { toast } from "sonner";
import { rupeesToPaise } from "@/lib/money";

interface CreateLeadDialogProps {
  onLeadCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateLeadDialog({ onLeadCreated, trigger }: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateLeadInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createLeadSchema as any) as any,
    defaultValues: {
      coupleName: "",
      partnerOneName: "",
      partnerOneEmail: "",
      partnerOnePhone: "+91",
      partnerTwoName: "",
      partnerTwoPhone: "",
      partnerTwoEmail: "",
      source: "Instagram",
      city: "Udaipur",
      venue: "",
      packageType: "FULL_SERVICE",
      dateFlexibility: "EXACT",
      qualificationStatus: "PENDING",
      notes: "",
    },
  });

  const packageType = watch("packageType");
  const dateFlexibility = watch("dateFlexibility");

  const onSubmit = async (data: CreateLeadInput) => {
    try {
      setIsSubmitting(true);

      // Convert raw INR input string to integer paise if entered
      let budgetPaise = data.estimatedBudgetPaise;
      const rawInrBudget = (data as unknown as { rawBudgetInr?: string }).rawBudgetInr;
      if (rawInrBudget && !isNaN(Number(rawInrBudget))) {
        budgetPaise = rupeesToPaise(Number(rawInrBudget));
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          estimatedBudgetPaise: budgetPaise ? budgetPaise.toString() : null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to create lead");
      }

      toast.success("Enquiry created successfully", {
        description: `Lead for ${data.coupleName} is now registered in the pipeline.`,
      });

      reset();
      setOpen(false);
      onLeadCreated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error("Error creating enquiry", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
            <Plus className="w-4 h-4" />
            New Enquiry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-gold mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Gathbandhan CRM</span>
          </div>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            Register New Wedding Enquiry
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Capture prospective couple contact details, wedding vision, estimated budget, and guest count.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Couple & Contacts Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5">
              Couple & Contacts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="coupleName" className="text-xs font-semibold">
                  Couple Reference Title *
                </Label>
                <Input
                  id="coupleName"
                  placeholder="e.g. Aarav & Meera Sharma"
                  {...register("coupleName")}
                  className={errors.coupleName ? "border-destructive" : ""}
                />
                {errors.coupleName && (
                  <p className="text-[11px] text-destructive">{errors.coupleName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partnerOneName" className="text-xs font-semibold">
                  Primary Contact Name *
                </Label>
                <Input
                  id="partnerOneName"
                  placeholder="e.g. Aarav Sharma"
                  {...register("partnerOneName")}
                  className={errors.partnerOneName ? "border-destructive" : ""}
                />
                {errors.partnerOneName && (
                  <p className="text-[11px] text-destructive">{errors.partnerOneName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partnerTwoName" className="text-xs font-semibold">
                  Partner / Fiancé Name
                </Label>
                <Input
                  id="partnerTwoName"
                  placeholder="e.g. Meera Joshi"
                  {...register("partnerTwoName")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partnerOnePhone" className="text-xs font-semibold">
                  Primary Phone (+91)
                </Label>
                <Input
                  id="partnerOnePhone"
                  placeholder="+919812345678"
                  {...register("partnerOnePhone")}
                  className={errors.partnerOnePhone ? "border-destructive" : ""}
                />
                {errors.partnerOnePhone && (
                  <p className="text-[11px] text-destructive">{errors.partnerOnePhone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partnerOneEmail" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="partnerOneEmail"
                  type="email"
                  placeholder="aarav@sharma.com"
                  {...register("partnerOneEmail")}
                  className={errors.partnerOneEmail ? "border-destructive" : ""}
                />
                {errors.partnerOneEmail && (
                  <p className="text-[11px] text-destructive">{errors.partnerOneEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Wedding Preferences & Scope */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5">
              Wedding Logistics & Preferences
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gold" />
                  Destination City
                </Label>
                <Input
                  id="city"
                  placeholder="Jaipur, Udaipur, Jodhpur, etc."
                  {...register("city")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="venue" className="text-xs font-semibold">
                  Preferred Venue (if any)
                </Label>
                <Input
                  id="venue"
                  placeholder="e.g. Taj Lake Palace, City Palace"
                  {...register("venue")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventDate" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  Estimated Date (YYYY-MM-DD)
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  {...register("eventDate")}
                  className={errors.eventDate ? "border-destructive" : ""}
                />
                {errors.eventDate && (
                  <p className="text-[11px] text-destructive">{errors.eventDate.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateFlexibility" className="text-xs font-semibold">
                  Date Flexibility
                </Label>
                <Select
                  value={dateFlexibility}
                  onValueChange={(val: "EXACT" | "ONE_WEEK" | "ONE_MONTH" | "FLEXIBLE") =>
                    setValue("dateFlexibility", val)
                  }
                >
                  <SelectTrigger id="dateFlexibility">
                    <SelectValue placeholder="Select flexibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXACT">Exact Date Confirmed</SelectItem>
                    <SelectItem value="ONE_WEEK">+/- 1 Week</SelectItem>
                    <SelectItem value="ONE_MONTH">+/- 1 Month</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible Season</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estimatedGuestCount" className="text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gold" />
                  Estimated Guests
                </Label>
                <Input
                  id="estimatedGuestCount"
                  type="number"
                  placeholder="400"
                  {...register("estimatedGuestCount")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rawBudgetInr" className="text-xs font-semibold flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-gold" />
                  Estimated Budget (₹ Rupees)
                </Label>
                <Input
                  id="rawBudgetInr"
                  type="number"
                  placeholder="e.g. 20000000 for ₹2 Crore"
                  {...register("rawBudgetInr" as unknown as "coupleName")}
                />
                <p className="text-[10px] text-muted-foreground">
                  Stored deterministically in exact paise (1 INR = 100 paise)
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="packageType" className="text-xs font-semibold">
                  Planning Package
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
                    <SelectItem value="FULL_SERVICE">
                      Full-Service Planning (Design, Vendors, Itinerary, Production)
                    </SelectItem>
                    <SelectItem value="PARTIAL">
                      Partial Planning (Vendor Coordination & Milestone Support)
                    </SelectItem>
                    <SelectItem value="DAY_OF">
                      Day-Of Coordination (Onsite Control Room & Schedule Execution)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="source" className="text-xs font-semibold">
                  Enquiry Source
                </Label>
                <Input
                  id="source"
                  placeholder="Instagram, Referral from Kapoor Family, Wedding Fair, etc."
                  {...register("source")}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="themeNotes" className="text-xs font-semibold">
                  Theme & Style Vision
                </Label>
                <Input
                  id="themeNotes"
                  placeholder="Royal Rajasthani heritage, lakeside mandap, modern sangeet"
                  {...register("themeNotes")}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes" className="text-xs font-semibold">
                  Internal Initial Notes
                </Label>
                <textarea
                  id="notes"
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Family requirements, specific vendor preferences, astrologer auspicious date window..."
                  {...register("notes")}
                />
              </div>
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
                  Registering...
                </>
              ) : (
                "Save Enquiry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
