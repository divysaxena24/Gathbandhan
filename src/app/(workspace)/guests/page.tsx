import React from "react";
import { UserCheck, Plus, Bus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function GuestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests & Logistics"
        description="Household RSVPs, dietary tracking, room blocks, and airport transport rosters"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Bus className="w-4 h-4" />
          Transport Plan
        </Button>
        <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Guest
        </Button>
      </PageHeader>

      <EmptyState
        icon={<UserCheck className="w-6 h-6 text-gold" />}
        title="Guest Logistics Ready for Phase 7"
        description="Per-event attendance RSVPs, confidential dietary summaries, hotel block assignments, and transport pickup schedules will be implemented in Phase 7."
      />
    </div>
  );
}
