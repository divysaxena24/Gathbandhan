import React from "react";
import { IndianRupee, Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Integrity & Settlements"
        description="Milestone billing, vendor invoices, duplicate-safe disbursements, and audit trails"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Receipt className="w-4 h-4" />
          Reconcile Invoices
        </Button>
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          Record Payment
        </Button>
      </PageHeader>

      <EmptyState
        icon={<IndianRupee className="w-6 h-6 text-gold" />}
        title="Financial Integrity Engine Ready for Phase 6"
        description="Idempotent transactions, invoice reconciliation against contract terms, and deterministic profit margins will be implemented in Phase 6."
      />
    </div>
  );
}
