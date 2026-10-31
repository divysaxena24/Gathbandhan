import React from "react";
import { Heart, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function WeddingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Weddings"
        description="Active and planned destination celebrations across Jaipur and Udaipur"
      >
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          Create Wedding
        </Button>
      </PageHeader>

      <EmptyState
        icon={<Heart className="w-6 h-6 text-gold" />}
        title="Wedding Workspace Overview"
        description="Comprehensive wedding workspaces with multi-event timelines, vendor assignments, and budget envelopes will activate as leads are converted."
      />
    </div>
  );
}
