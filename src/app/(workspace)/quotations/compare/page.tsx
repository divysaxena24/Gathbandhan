"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteComparisonMatrix } from "@/components/vendors/quote-comparison-matrix";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Scale } from "lucide-react";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const quotesParam = searchParams.get("quotes");
  const quoteIds = quotesParam ? quotesParam.split(",").filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/quotations")}
          className="text-charcoal-600 hover:text-charcoal gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Quotations Hub
        </Button>
      </div>

      <PageHeader
        title="Multi-Quote Comparison Studio"
        description="Side-by-side landed cost recalculation, guest count sensitivity, and inclusion gap intelligence"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-charcoal-600 bg-ivory-100 px-3 py-1.5 rounded-lg border border-ivory-200">
          <Scale className="w-4 h-4 text-gold" />
          <span>Comparing {quoteIds.length} Vendor Proposals</span>
        </div>
      </PageHeader>

      <QuoteComparisonMatrix
        quoteIds={quoteIds}
        onQuoteSelected={() => router.push("/quotations")}
      />
    </div>
  );
}

export default function QuotationsComparePage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-charcoal-500">
          <p className="text-sm">Loading comparison studio...</p>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
