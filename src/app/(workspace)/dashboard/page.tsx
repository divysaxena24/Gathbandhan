import React from "react";
import Link from "next/link";
import {
  Heart,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50">
      <PageHeader
        title="Agency Operations Overview"
        description="Jaipur & Udaipur luxury season command summary"
      >
        <Link href="/weddings">
          <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700">
            View All Weddings
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Weddings
            </CardTitle>
            <Heart className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">25</div>
            <p className="text-xs text-muted-foreground mt-1">
              4 anchor celebrations in Udaipur
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Open Enquiries
            </CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              3 proposals pending client review
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Next Live Event
            </CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-display text-charcoal truncate">
              Sharma Royal
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              12 Feb 2027 · Taj Lake Palace
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Season Target
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-status-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">₹50 Cr</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gross planned client budget
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anchor Demo Wedding Showcase */}
      <Card className="border-gold/30 bg-gradient-to-r from-gold/5 via-card to-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600 bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                Anchor Showcase Wedding
              </span>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-charcoal mt-2">
                Sharma Royal Wedding — Udaipur
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Aarav & Meera Sharma · 3 Days · 400 Guests · 18 Vendors · ₹2,00,00,000 Budget
              </p>
            </div>
            <Link href="/control-room">
              <Button size="sm" variant="outline" className="border-gold/40 text-charcoal gap-1.5 hover:bg-gold/10">
                Launch Control Room
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-border/50 text-xs">
            <div>
              <span className="text-muted-foreground block">Planning Progress</span>
              <span className="font-semibold text-charcoal">68% completed (22/32 tasks)</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Chosen Caterer</span>
              <span className="font-semibold text-charcoal">Royal Rajasthani Caterers</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Client Deposit</span>
              <span className="font-semibold text-status-success">₹40,00,000 Received</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Event Dates</span>
              <span className="font-semibold text-charcoal">12 - 14 Feb 2027</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Highlights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              Upcoming Operational Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Catering Quote Selection Review</p>
                <p className="text-muted-foreground">Sharma Wedding · 400 vs 480 guest sensitivity</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-status-warning-light text-status-warning font-medium">
                Due Today
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Sangeet Choreography Vendor Deposit</p>
                <p className="text-muted-foreground">Kapoor Wedding · ₹2,50,000 advance</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                In 2 Days
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">City Palace Zenana Mahal Setup Inspection</p>
                <p className="text-muted-foreground">Onsite Coordinator: Vikram Patel</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                In 4 Days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              Operational Safeguards Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-status-success/30 bg-status-success-light/40">
              <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Idempotency & Duplicate Prevention</p>
                <p className="text-muted-foreground mt-0.5">
                  Financial transactions guarded with unique payment keys and exact paise calculation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Role-Based Server Authorization</p>
                <p className="text-muted-foreground mt-0.5">
                  Enforcing 6 strict roles across agency staff, coordinators, vendors, and couples.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Append-Only Audit Ledger</p>
                <p className="text-muted-foreground mt-0.5">
                  Immutable change logs capturing actor, timestamp, diff, and operational reason.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

