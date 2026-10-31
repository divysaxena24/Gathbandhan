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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";

interface ExtractedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPricePaise: string;
  fixedChargePaise: string;
  isPerGuest: boolean;
  taxPercent: number;
  serviceChargePercent: number;
  inclusionStatus: "INCLUDED" | "EXCLUDED" | "OPTIONAL" | "UNSPECIFIED";
  notes?: string;
  confidence: number;
}

export function UploadQuoteDialog({
  quoteRequestId,
  vendorId,
  vendors,
  onQuoteCreated,
}: {
  quoteRequestId?: string;
  vendorId?: string;
  vendors?: Array<{ id: string; name: string }>;
  onQuoteCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedVendorId, setSelectedVendorId] = useState(vendorId || "");
  const [proposalText, setProposalText] = useState("");
  const [extractedData, setExtractedData] = useState<{
    confidenceScore: number;
    suggestedTaxRule: string;
    notes: string;
    items: ExtractedItem[];
    suggestedTravelFeePaise: string;
  } | null>(null);

  // Sample prompt template for quick demo
  const loadDemoProposal = (type: "catering" | "decor") => {
    if (type === "catering") {
      setProposalText(
        `Maharaja Feast Co. - Udaipur Palace Catering Proposal\n` +
        `Event: 3-Day Royal Rajasthani Wedding\n` +
        `Estimated Guests: 400 Pax\n` +
        `Grand Royal Buffet & 12 Live Food Stations: ₹3,400 per plate\n` +
        `Welcome Drinks & High Tea Station: ₹450 per plate\n` +
        `Midnight Snack Counter: ₹45,000 fixed\n` +
        `Bone China & Brass Cutlery Set: ₹80,000 fixed\n` +
        `Outstation travel & logistics for master chefs: ₹40,000\n` +
        `Applicable GST: 5% on food items.\n`
      );
    } else {
      setProposalText(
        `Lakeside Decor Studio - Sangeet & Mandap Proposal\n` +
        `Mandap: Heritage Palace Mandap with Imported Florals: ₹8,50,000 fixed\n` +
        `Trussing & Kinetic Lighting Package: ₹3,50,000 fixed\n` +
        `Diesel Generator backup (Fuel excluded - charged on actuals): ₹45,000\n` +
        `Drone & Live Projection Mapping: Optional ₹1,20,000\n` +
        `Standard 18% GST applies to decor setups.\n`
      );
    }
  };

  const handleExtract = async () => {
    if (!proposalText.trim()) {
      setError("Please paste the proposal text or PDF contents first.");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch("/api/quotes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: proposalText,
          fileName: "vendor_proposal.pdf",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Extraction failed");
      }

      const data = await res.json();
      setExtractedData(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to extract proposal data");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedVendorId) {
      setError("Please select a vendor.");
      return;
    }
    if (!quoteRequestId) {
      setError("Quote Request ID is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        quoteRequestId,
        vendorId: selectedVendorId,
        rawDocumentText: proposalText,
        extractionStatus: "COMPLETED",
        confidenceScore: extractedData?.confidenceScore.toString() || "0.90",
        extractionNotes: extractedData?.notes || "Parsed via AI extraction adapter",
        travelFeePaise: extractedData?.suggestedTravelFeePaise || "0",
        taxRule: extractedData?.suggestedTaxRule || "GST_18",
        items: extractedData?.items.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unitPricePaise: item.unitPricePaise,
          fixedChargePaise: item.fixedChargePaise,
          isPerGuest: item.isPerGuest,
          taxPercent: item.taxPercent.toString(),
          serviceChargePercent: item.serviceChargePercent.toString(),
          inclusionStatus: item.inclusionStatus,
          notes: item.notes,
        })) || [],
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to submit quote");
      }

      setOpen(false);
      onQuoteCreated?.();
    } catch (err: any) {
      setError(err.message || "Failed to create quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-gold/40 text-charcoal hover:bg-gold/10">
          <Upload className="w-4 h-4 text-gold" />
          Upload / Parse Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl text-charcoal">
            <Sparkles className="w-5 h-5 text-gold" />
            Smart Quote Extraction & Intake
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-burgundy-700 bg-burgundy-50 border border-burgundy-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 py-2">
          {vendors && (
            <div className="space-y-1.5">
              <Label htmlFor="vendorSelect">Select Submitting Vendor *</Label>
              <select
                id="vendorSelect"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">-- Choose Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="proposalText">Vendor Document / RFP Proposal Text *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadDemoProposal("catering")}
                  className="text-xs text-gold hover:underline font-medium"
                >
                  Load Catering Sample
                </button>
                <span className="text-xs text-ivory-400">|</span>
                <button
                  type="button"
                  onClick={() => loadDemoProposal("decor")}
                  className="text-xs text-gold hover:underline font-medium"
                >
                  Load Decor Sample
                </button>
              </div>
            </div>
            <Textarea
              id="proposalText"
              value={proposalText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProposalText(e.target.value)}
              placeholder="Paste raw vendor quote text, menu rate breakdown, or OCR extracted PDF contents here..."
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || !proposalText.trim()}
              className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                  Extracting Line Items...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-gold" />
                  Run Extraction Adapter
                </>
              )}
            </Button>
          </div>

          {extractedData && (
            <div className="space-y-3 pt-2 border-t border-ivory-200">
              <div className="flex items-center justify-between p-3 bg-ivory-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      Extraction Complete — Confidence: {(extractedData.confidenceScore * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-charcoal-500">{extractedData.notes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 border border-amber-300 rounded text-xs font-medium text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Human Review Required
                </div>
              </div>

              <div className="border border-ivory-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-200 text-charcoal-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Price Structure</th>
                      <th className="p-2.5">Tax (GST)</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {extractedData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-ivory-50">
                        <td className="p-2.5 font-medium text-charcoal">{item.name}</td>
                        <td className="p-2.5 text-charcoal-500">{item.category}</td>
                        <td className="p-2.5 text-charcoal">
                          {item.isPerGuest
                            ? `${formatINR(BigInt(item.unitPricePaise))}/plate`
                            : formatINR(BigInt(item.fixedChargePaise))}
                        </td>
                        <td className="p-2.5 text-charcoal">{item.taxPercent}%</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.inclusionStatus === "INCLUDED"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.inclusionStatus === "EXCLUDED"
                                ? "bg-burgundy-100 text-burgundy-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.inclusionStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            onClick={handleSubmitQuote}
            className="bg-gold text-charcoal hover:bg-gold-400 font-medium"
            disabled={isSubmitting || !extractedData || !selectedVendorId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Quote...
              </>
            ) : (
              "Save Quote for Planner Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
