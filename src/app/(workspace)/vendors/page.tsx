import React from "react";
import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Directory"
        description="Master directory of venues, caterers, decorators, and luxury service providers"
      >
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </PageHeader>

      <EmptyState
        icon={<Building2 className="w-6 h-6 text-gold" />}
        title="Vendor Directory Ready for Phase 3"
        description="Vendor categorization, rating snapshots, and wedding assignments will be expanded in Phase 3."
      />
    </div>
  );
}
