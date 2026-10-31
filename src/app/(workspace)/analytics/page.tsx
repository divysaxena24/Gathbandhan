import React from "react";
import { BarChart3, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Founder Analytics & Season Review"
        description="Cross-wedding profitability, vendor reliability ratings, and agency capacity analysis"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </PageHeader>

      <EmptyState
        icon={<BarChart3 className="w-6 h-6 text-gold" />}
        title="Founder Analytics Ready for Phase 8"
        description="Multi-wedding profitability models, vendor punctuality metrics, and team workload analytics will be implemented in Phase 8."
      />
    </div>
  );
}
