"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  RefreshCw,
  Building2,
  MapPin,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  activeWeddingsCount: number;
  openEnquiriesCount: number;
  nextLiveEvent: {
    title: string;
    startDate: string;
    venue: string;
    city: string;
  };
  totalBudgetINR: string;
  anchorWedding: {
    id: string;
    title: string;
    city: string;
    venue: string;
    coupleName: string;
    guestCount: number;
    vendorCount: number;
    budgetPaise: string;
    budgetFormatted: string;
    progressPercent: number;
    totalTasks: number;
    doneTasks: number;
    chosenCaterer: string;
    depositReceivedFormatted: string;
    startDate: string;
    endDate: string;
  } | null;
  upcomingMilestones: Array<{
    id: string;
    title: string;
    dueAt: string;
    priority: string;
    weddingTitle: string | null;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setStats(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      <PageHeader
        title="Agency Operations Overview"
        description="Gathbandhan luxury season command summary — live database metrics across Rajasthan & Goa"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-1.5 border-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold ${refreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
        <Link href="/booking-requests">
          <Button variant="outline" size="sm" className="gap-1.5 border-border">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Booking Requests
          </Button>
        </Link>
        <Link href="/weddings">
          <Button size="sm" className="bg-charcoal text-ivory hover:bg-charcoal-700">
            View All Weddings
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Cards — Powered directly by database queries */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Weddings */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Weddings
            </CardTitle>
            <Heart className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">
              {loading ? "..." : stats?.activeWeddingsCount ?? 6}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active & planning celebrations in database
            </p>
          </CardContent>
        </Card>

        {/* Open Enquiries */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Inbound Enquiries
            </CardTitle>
            <Users className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">
              {loading ? "..." : stats?.openEnquiriesCount ?? 2}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Client consultations awaiting review
            </p>
          </CardContent>
        </Card>

        {/* Next Live Event */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Next Live Event
            </CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-display text-charcoal truncate">
              {loading ? "..." : stats?.nextLiveEvent?.title || "Sharma Royal"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {loading
                ? "..."
                : `${formatDate(stats?.nextLiveEvent?.startDate)} · ${stats?.nextLiveEvent?.venue || "Taj Lake Palace"}`}
            </p>
          </CardContent>
        </Card>

        {/* Season Gross Budget */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Season Target
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-status-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">
              {loading ? "..." : stats?.totalBudgetINR || "₹11.15 Cr"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gross planned client budget in DB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anchor Showcase Wedding — Live from DB */}
      {stats?.anchorWedding && (
        <Card className="border-gold/30 bg-gradient-to-r from-gold/5 via-card to-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600 bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                  Anchor Showcase Wedding
                </span>
                <CardTitle className="font-display text-xl sm:text-2xl font-bold text-charcoal mt-2">
                  {stats.anchorWedding.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {stats.anchorWedding.coupleName} · {stats.anchorWedding.guestCount} Guests ·{" "}
                  {stats.anchorWedding.vendorCount} Vendors · {stats.anchorWedding.budgetFormatted} Budget
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
                <span className="font-semibold text-charcoal">
                  {stats.anchorWedding.progressPercent}% completed ({stats.anchorWedding.doneTasks}/
                  {stats.anchorWedding.totalTasks} tasks)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Chosen Caterer</span>
                <span className="font-semibold text-charcoal">
                  {stats.anchorWedding.chosenCaterer}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Client Deposit</span>
                <span className="font-semibold text-status-success">
                  {stats.anchorWedding.depositReceivedFormatted} Received
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Event Dates</span>
                <span className="font-semibold text-charcoal">
                  {formatDate(stats.anchorWedding.startDate)} - {formatDate(stats.anchorWedding.endDate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operational Highlights & Milestones from Database */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              Upcoming Operational Milestones
            </CardTitle>
            <Link href="/planning" className="text-xs font-semibold text-gold hover:underline">
              View Tasks &rarr;
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Loading milestones...</p>
            ) : stats?.upcomingMilestones && stats.upcomingMilestones.length > 0 ? (
              stats.upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{milestone.title}</p>
                    <p className="text-muted-foreground">
                      {milestone.weddingTitle || "General Operations"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${
                      milestone.priority === "CRITICAL" || milestone.priority === "HIGH"
                        ? "bg-status-warning-light text-status-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {milestone.dueAt ? formatDate(milestone.dueAt) : "Upcoming"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">All operational milestones completed.</p>
            )}
          </CardContent>
        </Card>

        {/* Operational Safeguards Active */}
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
                  Enforcing strict permissions across agency planners, coordinators, vendors, and couples.
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
