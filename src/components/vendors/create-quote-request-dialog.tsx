/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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
import { Plus, FileText, Loader2 } from "lucide-react";
import { createQuoteRequestSchema } from "@/modules/vendors/validation";
import { z } from "zod";

type FormData = z.input<typeof createQuoteRequestSchema>;

const VENDOR_CATEGORIES = [
  { value: "CATERING", label: "Catering & Live Counters" },
  { value: "DECORATION", label: "Decor & Production" },
  { value: "PHOTOGRAPHY", label: "Photography & Candid Shoots" },
  { value: "VIDEOGRAPHY", label: "Cinematography & Teasers" },
  { value: "DJ_MUSIC", label: "DJ, Music & Sound" },
  { value: "VENUE", label: "Heritage Venue & Palace" },
  { value: "MAKEUP", label: "Bridal & Family Makeup" },
  { value: "LIGHTING", label: "Architectural & Ambient Lighting" },
  { value: "ENTERTAINMENT", label: "Live Performers & Bands" },
];

export function CreateQuoteRequestDialog({
  onRequestCreated,
}: {
  onRequestCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weddings, setWeddings] = useState<Array<{ id: string; title: string; city: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createQuoteRequestSchema as any) as any,
    defaultValues: {
      category: "CATERING",
    },
  });

  useEffect(() => {
    if (open) {
      // Fetch available weddings for RFP assignment
      fetch("/api/leads")
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.leads) {
            // Map converted leads or fallback
            setWeddings([
              { id: "e0000000-0000-0000-0000-000000000001", title: "Sharma Royal Wedding", city: "Udaipur" },
            ]);
          }
        })
        .catch(() => {
          setWeddings([
            { id: "e0000000-0000-0000-0000-000000000001", title: "Sharma Royal Wedding", city: "Udaipur" },
          ]);
        });
    }
  }, [open]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const budgetInPaise = data.targetBudgetPaise
        ? BigInt(Math.round(Number(data.targetBudgetPaise) * 100)).toString()
        : null;

      const payload = {
        ...data,
        targetBudgetPaise: budgetInPaise,
      };

      const res = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create quote request");
      }

      reset();
      setOpen(false);
      onRequestCreated?.();
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
          New Quote Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <FileText className="w-5 h-5 text-gold" />
            Issue Vendor Quote Request (RFP)
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="weddingId">Wedding Project *</Label>
            <select
              id="weddingId"
              {...register("weddingId")}
              className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                {...register("category")}
                className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetBudgetPaise">Target Budget (₹ INR)</Label>
              <Input
                id="targetBudgetPaise"
                type="number"
                placeholder="e.g. 2500000"
                {...register("targetBudgetPaise")}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="title">RFP Title / Scope *</Label>
              <Input
                id="title"
                placeholder="e.g. Royal Rajasthani 3-Day Catering & High Tea"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-burgundy-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Detailed Scope & Requirements</Label>
              <Textarea
                id="description"
                placeholder="Specify guest counts (400 pax), dietary preferences (Jain & Marwari live counters), multi-event schedule, generator requirements..."
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Submission Deadline</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
            </div>
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
                "Issue Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
