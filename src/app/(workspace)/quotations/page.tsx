import React from "react";
import { Plus, Upload, Scale } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Quotations"
        description="Structured quote parsing, landed-cost sensitivity, and multi-quote comparison"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload PDF Quote
        </Button>
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </PageHeader>

      <EmptyState
        icon={<Scale className="w-6 h-6 text-gold" />}
        title="Smart Vendor Intelligence Ready for Phase 3"
        description="Line-item extraction, GST & service charge landed cost calculations, and guest sensitivity analysis will be implemented in Phase 3."
      />
    </div>
  );
}
