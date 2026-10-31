import React from "react";
import { Users, Plus, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads & Client Pipeline"
        description="Enquiry intake, consultation scheduling, and proposal conversion"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          New Enquiry
        </Button>
      </PageHeader>

      <EmptyState
        icon={<Users className="w-6 h-6 text-gold" />}
        title="Lead Pipeline Ready for Phase 2"
        description="Lead qualification stages, follow-up calendar, and transactional lead-to-wedding conversion engine will be implemented in Phase 2."
      />
    </div>
  );
}

