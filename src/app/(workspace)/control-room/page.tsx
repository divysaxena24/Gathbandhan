import React from "react";
import { Radio, QrCode, AlertOctagon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function ControlRoomPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Day Control Room"
        description="Live minute-by-minute timeline, QR check-ins, late detection, and incident logs"
      >
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          Generate Check-in QR
        </Button>
        <Button size="sm" className="bg-status-critical text-white hover:bg-status-critical/90 gap-2">
          <AlertOctagon className="w-4 h-4" />
          Log Incident
        </Button>
      </PageHeader>

      <EmptyState
        icon={<Radio className="w-6 h-6 text-gold" />}
        title="Wedding Day Control Room Ready for Phase 5"
        description="Frictionless QR vendor check-ins, grace-period late warnings, schedule cascade impact graphs, and incident logging will be implemented in Phase 5."
      />
    </div>
  );
}
