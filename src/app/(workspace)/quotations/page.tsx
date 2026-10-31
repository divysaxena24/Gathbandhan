/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CreateQuoteRequestDialog } from "@/components/vendors/create-quote-request-dialog";
import { UploadQuoteDialog } from "@/components/vendors/upload-quote-dialog";
import { QuoteReviewDialog } from "@/components/vendors/quote-review-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  FileText,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Crown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatINR } from "@/lib/money";

interface QuoteItem {
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

interface Quote {
  id: string;
  vendorId: string;
  status: string;
  extractionStatus: string;
  confidenceScore: string | null;
  basePricePaise: string | null;
  travelFeePaise: string | null;
  overtimeHourlyRatePaise: string | null;
  createdAt: string;
  vendor: {
    id: string;
    name: string;
    city: string | null;
    averageRating: string | null;
  };
  items?: QuoteItem[];
}

interface QuoteRequest {
  id: string;
  weddingId: string;
  weddingTitle: string;
  weddingCity: string;
  category: string;
  title: string;
  description: string | null;
  targetBudgetPaise: string | null;
  deadline: string | null;
  status: string;
  selectedQuoteId: string | null;
  createdAt: string;
  quotes?: Quote[];
}

export default function QuotationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  const fetchQuoteRequests = async () => {
    setLoading(true);
    try {
      // Fetch quote requests
      const res = await fetch("/api/quote-requests");
      if (res.ok) {
        const json = await res.json();
        const baseRequests = json.data || [];

        // Fetch quotes for each request
        const detailedRequests = await Promise.all(
          baseRequests.map(async (req: any) => {
            const detailRes = await fetch(`/api/quote-requests/${req.id}`);
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              return detailJson.data;
            }
            return req;
          })
        );

        setRequests(detailedRequests);
      }

      // Fetch vendors for quick upload modal
      const vendorRes = await fetch("/api/vendors");
      if (vendorRes.ok) {
        const vendorJson = await vendorRes.json();
        setVendors(vendorJson.data || []);
      }
    } catch (err) {
      console.error("Failed to load quotations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteRequests();
  }, []);

  const toggleSelectQuote = (quoteId: string) => {
    if (selectedQuoteIds.includes(quoteId)) {
      setSelectedQuoteIds(selectedQuoteIds.filter((id) => id !== quoteId));
    } else {
      setSelectedQuoteIds([...selectedQuoteIds, quoteId]);
    }
  };

  const handleLaunchCompare = () => {
    if (selectedQuoteIds.length < 2) return;
    router.push(`/quotations/compare?quotes=${selectedQuoteIds.join(",")}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Quotations"
        description="RFP dispatch, structured proposal parsing, landed-cost recalculation, and side-by-side comparison"
      >
        <div className="flex items-center gap-2">
          {selectedQuoteIds.length >= 2 && (
            <Button
              onClick={handleLaunchCompare}
              size="sm"
              className="bg-gold text-charcoal hover:bg-gold-400 font-medium gap-1.5 shadow-sm"
            >
              <Scale className="w-4 h-4" />
              Compare Selected ({selectedQuoteIds.length})
            </Button>
          )}
          <CreateQuoteRequestDialog onRequestCreated={fetchQuoteRequests} />
        </div>
      </PageHeader>

      {/* Quote Requests List */}
      {loading ? (
        <div className="p-16 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Loading quote requests and proposals...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-ivory-200">
          <FileText className="w-8 h-8 text-gold mx-auto mb-2" />
          <h3 className="text-base font-serif font-bold text-charcoal">
            No Active Quote Requests
          </h3>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
            Issue an RFP quote request for wedding catering, decor, or cinematography to start receiving and comparing vendor proposals.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => {
            const quoteList = request.quotes || [];
            const isClosed = request.status === "CLOSED";

            return (
              <Card key={request.id} className="border-ivory-300 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-ivory-50/70 border-b border-ivory-200 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-charcoal text-ivory">
                          {request.category.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isClosed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {request.status}
                        </span>
                        <span className="text-xs text-charcoal-500 font-medium">
                          for {request.weddingTitle} ({request.weddingCity})
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-charcoal">
                        {request.title}
                      </h3>
                      {request.description && (
                        <p className="text-xs text-charcoal-600 line-clamp-1">
                          {request.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {request.targetBudgetPaise && (
                        <div className="text-right">
                          <span className="text-[10px] text-charcoal-400 block uppercase">
                            Target Budget
                          </span>
                          <span className="text-sm font-bold font-mono text-charcoal">
                            {formatINR(BigInt(request.targetBudgetPaise))}
                          </span>
                        </div>
                      )}
                      {!isClosed && (
                        <UploadQuoteDialog
                          quoteRequestId={request.id}
                          vendors={vendors}
                          onQuoteCreated={fetchQuoteRequests}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {quoteList.length === 0 ? (
                    <div className="p-8 text-center text-charcoal-500 text-xs">
                      No vendor proposals received yet for this RFP. Use &quot;Upload / Parse Quote&quot; to submit one.
                    </div>
                  ) : (
                    <div className="divide-y divide-ivory-200">
                      {quoteList.map((quote) => {
                        const isSelected = selectedQuoteIds.includes(quote.id);
                        const isWon = quote.status === "SELECTED";
                        const isNeedsReview = quote.status === "NEEDS_REVIEW";

                        return (
                          <div
                            key={quote.id}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                              isWon
                                ? "bg-emerald-50/40"
                                : isSelected
                                ? "bg-amber-50/30"
                                : "hover:bg-ivory-50/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {!isClosed && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectQuote(quote.id)}
                                  className="w-4 h-4 text-gold rounded border-ivory-300 focus:ring-gold"
                                />
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif font-bold text-charcoal">
                                    {quote.vendor.name}
                                  </h4>
                                  {isWon && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                      <Crown className="w-3.5 h-3.5" />
                                      Contract Awarded
                                    </span>
                                  )}
                                  {isNeedsReview && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      Needs Human Review
                                    </span>
                                  )}
                                  {quote.status === "VERIFIED" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Verified
                                    </span>
                                  )}
                                  {quote.status === "REJECTED" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal-500 bg-ivory-200 px-2 py-0.5 rounded">
                                      <XCircle className="w-3.5 h-3.5" />
                                      Closed
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-charcoal-500">
                                  <span>{quote.items?.length || 0} line items parsed</span>
                                  {quote.confidenceScore && (
                                    <span>
                                      Confidence: {(Number(quote.confidenceScore) * 100).toFixed(0)}%
                                    </span>
                                  )}
                                  {quote.vendor.city && <span>Hub: {quote.vendor.city}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[10px] text-charcoal-400 block uppercase font-medium">
                                  Estimated Base
                                </span>
                                <span className="text-sm font-bold font-mono text-charcoal">
                                  {quote.basePricePaise
                                    ? formatINR(BigInt(quote.basePricePaise))
                                    : "Per-Plate Model"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isNeedsReview && (
                                  <QuoteReviewDialog
                                    quote={{
                                      id: quote.id,
                                      vendorName: quote.vendor.name,
                                      status: quote.status,
                                      travelFeePaise: quote.travelFeePaise || "0",
                                      items: quote.items as any,
                                    }}
                                    onReviewed={fetchQuoteRequests}
                                  />
                                )}
                                <Link
                                  href={`/quotations/compare?quotes=${quoteList.map((q) => q.id).join(",")}`}
                                >
                                  <Button size="sm" variant="ghost" className="text-xs text-gold gap-1">
                                    Compare <ChevronRight className="w-3 h-3" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
