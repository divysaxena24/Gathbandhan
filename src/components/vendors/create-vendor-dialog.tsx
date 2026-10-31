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
import { Plus, Building2, Loader2 } from "lucide-react";
import { createVendorSchema } from "@/modules/vendors/validation";
import { z } from "zod";

type FormData = z.input<typeof createVendorSchema>;

const VENDOR_CATEGORIES = [
  { value: "VENUE", label: "Venue & Palaces" },
  { value: "CATERING", label: "Royal Catering" },
  { value: "DECORATION", label: "Decor & Production" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "VIDEOGRAPHY", label: "Cinematography" },
  { value: "DJ_MUSIC", label: "DJ & Sound" },
  { value: "MAKEUP", label: "Bridal Makeup" },
  { value: "MEHENDI_ARTIST", label: "Mehendi Artist" },
  { value: "LIGHTING", label: "Architectural Lighting" },
  { value: "ENTERTAINMENT", label: "Live Entertainment" },
  { value: "TRANSPORT", label: "Vintage Cars & Transport" },
  { value: "ACCOMMODATION", label: "Guest Accommodation" },
  { value: "INVITATION", label: "Luxury Invitations" },
  { value: "GIFTING", label: "Hampers & Gifting" },
  { value: "PANDIT", label: "Pandit / Officiant" },
  { value: "SECURITY", label: "Royal Guard & Security" },
  { value: "COORDINATION", label: "Event Coordination" },
  { value: "OTHER", label: "Other Services" },
];

export function CreateVendorDialog({ onVendorCreated }: { onVendorCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createVendorSchema as any) as any,
    defaultValues: {
      category: "CATERING",
      city: "Udaipur",
      serviceArea: ["Udaipur", "Jaipur"],
      averageRating: "4.80",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to create vendor");
      }

      reset();
      setOpen(false);
      onVendorCreated?.();
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
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <Building2 className="w-5 h-5 text-gold" />
            Register Luxury Vendor
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Business / Vendor Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Royal Rajasthani Caterers"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-burgundy-600">{errors.name.message}</p>
              )}
            </div>

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
              <Label htmlFor="city">Primary City</Label>
              <Input id="city" placeholder="e.g. Udaipur, Jaipur" {...register("city")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactName">Primary Contact Person</Label>
              <Input id="contactName" placeholder="e.g. Suresh Kumar" {...register("contactName")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="e.g. +91 98123 45101" {...register("phone")} />
              {errors.phone && (
                <p className="text-xs text-burgundy-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. contact@royalcatering.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-burgundy-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Capabilities & Specialties</Label>
              <Textarea
                id="description"
                placeholder="Details on culinary repertoire, production scale, or signature royal wedding themes..."
                rows={3}
                {...register("description")}
              />
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
                  Saving...
                </>
              ) : (
                "Register Vendor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
