import React from "react";
import { Shield, Database } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Configuration"
        description="Role management, integrations, audit settings, and agency defaults"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              <CardTitle className="text-base">Role-Based Access Control (RBAC)</CardTitle>
            </div>
            <CardDescription>
              Enforcing 6 discrete roles defined in the system architecture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="font-semibold text-foreground">FOUNDER_ADMIN</span>
              <Badge variant="outline" className="text-[10px]">Full Operational Authority</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="font-semibold text-foreground">PLANNER</span>
              <Badge variant="outline" className="text-[10px]">Lead, Vendor & Wedding Mgmt</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="font-semibold text-foreground">FINANCE</span>
              <Badge variant="outline" className="text-[10px]">Invoice Reconciliation & Payments</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="font-semibold text-foreground">ONSITE_COORDINATOR</span>
              <Badge variant="outline" className="text-[10px]">Control Room & Incidents</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="font-semibold text-foreground">VENDOR</span>
              <Badge variant="outline" className="text-[10px]">Assigned Wedding Check-in</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="font-semibold text-foreground">CLIENT</span>
              <Badge variant="outline" className="text-[10px]">Couple Portal & RSVPs</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gold" />
              <CardTitle className="text-base">Environment & Storage Configuration</CardTitle>
            </div>
            <CardDescription>
              Configured service providers and operational boundaries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="font-semibold text-foreground">PostgreSQL 16 + Drizzle ORM</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="text-muted-foreground">Authentication Provider</span>
              <span className="font-semibold text-foreground">Clerk (SSR + Middleware)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="text-muted-foreground">Financial Unit</span>
              <span className="font-semibold text-foreground">Exact Paise (BigInt) / INR</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/40">
              <span className="text-muted-foreground">Primary Timezone</span>
              <span className="font-semibold text-foreground">Asia/Kolkata (IST)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
