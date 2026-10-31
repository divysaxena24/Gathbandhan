import React from "react";
import { CheckSquare, Plus, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning & Task Engine"
        description="Backward-scheduled task templates, dependency graphs, and team workload"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <GitBranch className="w-4 h-4" />
          View Dependencies
        </Button>
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </PageHeader>

      <EmptyState
        icon={<CheckSquare className="w-6 h-6 text-gold" />}
        title="Task Dependency Engine Ready for Phase 4"
        description="Acyclic dependency checks, package-based task templates, and backward date recalculation will be implemented in Phase 4."
      />
    </div>
  );
}

