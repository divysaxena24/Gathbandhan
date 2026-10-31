/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
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
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { paiseToRupees, rupeesToPaise } from "@/lib/money";

interface QuoteItemData {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPricePaise: string;
  fixedChargePaise: string;
  isPerGuest: boolean;
  taxPercent: string;
  serviceChargePercent: string;
  inclusionStatus: "INCLUDED" | "EXCLUDED" | "OPTIONAL" | "UNSPECIFIED";
  notes?: string | null;
}

export function QuoteReviewDialog({
  quote,
  onReviewed,
}: {
  quote: {
    id: string;
    vendorName: string;
    status: string;
    travelFeePaise?: string;
    items?: QuoteItemData[];
  };
  onReviewed?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<QuoteItemData[]>(quote.items || []);
  const [travelFeeRupees, setTravelFeeRupees] = useState<number>(
    quote.travelFeePaise ? paiseToRupees(BigInt(quote.travelFeePaise)) : 0
  );
  const [notes, setNotes] = useState("");

  const handleItemChange = (index: number, field: keyof QuoteItemData, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleVerify = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        status: "VERIFIED",
        travelFeePaise: rupeesToPaise(travelFeeRupees).toString(),
        notes: notes || "Human planner reviewed and verified quote items.",
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          category: it.category || "General",
          quantity: it.quantity || 1,
          unit: it.unit || "plate",
          unitPricePaise: it.unitPricePaise || "0",
          fixedChargePaise: it.fixedChargePaise || "0",
          isPerGuest: it.isPerGuest,
          taxPercent: it.taxPercent || "18.00",
          serviceChargePercent: it.serviceChargePercent || "0.00",
          inclusionStatus: it.inclusionStatus,
          notes: it.notes,
        })),
      };

      const res = await fetch(`/api/quotes/${quote.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Verification failed");
      }

      setOpen(false);
      onReviewed?.();
    } catch (err: any) {
      setError(err.message || "Failed to verify quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs border-gold text-charcoal hover:bg-gold/10">
          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
          Review & Verify
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <ShieldCheck className="w-5 h-5 text-gold" />
            Human Verification — {quote.vendorName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 py-2">
          <p className="text-xs text-charcoal-500">
            Per platform governance, all extracted line items, plate rates, and inclusions must be reviewed and verified by a wedding planner before quote comparison or contract award.
          </p>

          <div className="border border-ivory-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-200 text-charcoal-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5 w-28">Type</th>
                  <th className="p-2.5 w-32">Rate (₹)</th>
                  <th className="p-2.5 w-24">GST %</th>
                  <th className="p-2.5 w-32">Inclusion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-ivory-50">
                    <td className="p-2">
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                        className="h-8 text-xs font-medium text-charcoal"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.isPerGuest ? "per_guest" : "fixed"}
                        onChange={(e) =>
                          handleItemChange(idx, "isPerGuest", e.target.value === "per_guest")
                        }
                        className="h-8 px-2 rounded border border-ivory-300 text-xs bg-white"
                      >
                        <option value="per_guest">Per Plate</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={
                          item.isPerGuest
                            ? paiseToRupees(BigInt(item.unitPricePaise || "0"))
                            : paiseToRupees(BigInt(item.fixedChargePaise || "0"))
                        }
                        onChange={(e) => {
                          const valInPaise = rupeesToPaise(Number(e.target.value)).toString();
                          if (item.isPerGuest) {
                            handleItemChange(idx, "unitPricePaise", valInPaise);
                          } else {
                            handleItemChange(idx, "fixedChargePaise", valInPaise);
                          }
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.taxPercent}
                        onChange={(e) => handleItemChange(idx, "taxPercent", e.target.value)}
                        className="h-8 text-xs w-16"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={item.inclusionStatus}
                        onChange={(e) =>
                          handleItemChange(idx, "inclusionStatus", e.target.value as any)
                        }
                        className="h-8 px-2 rounded border border-ivory-300 text-xs bg-white"
                      >
                        <option value="INCLUDED">Included</option>
                        <option value="EXCLUDED">Excluded</option>
                        <option value="OPTIONAL">Optional</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="travelFee">Outstation Travel / Logistics Fee (₹)</Label>
              <Input
                id="travelFee"
                type="number"
                value={travelFeeRupees}
                onChange={(e) => setTravelFeeRupees(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Verification Notes</Label>
              <Input
                id="notes"
                placeholder="Confirmed menu count and generator terms via call"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
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
            type="button"
            onClick={handleVerify}
            className="bg-emerald-700 text-white hover:bg-emerald-800 font-medium gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Certify & Mark Verified
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
