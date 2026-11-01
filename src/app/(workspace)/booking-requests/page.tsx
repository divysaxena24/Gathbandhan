"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  MessageSquare,
  Send,
  Building2,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Phone,
  Mail,
  Heart,
  Crown,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  FileText,
  UtensilsCrossed,
  Camera,
  Music,
  Loader2,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { compareBudgets } from "@/lib/services/budget-comparison";
import { OverbudgetTag } from "@/components/common/overbudget-tag";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BookingRequest {
  id: string;
  userId: string | null;
  leadId: string | null;
  weddingId: string | null;
  coupleName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  preferredContactMethod: string | null;
  weddingType: string | null;
  regionalTraditions: string[] | null;
  ceremonies: any[] | null;
  destination: string | null;
  destinationCity: string | null;
  venueType: string | null;
  preferredDate: string | null;
  dateFlexible: boolean;
  durationDays: number;
  guestCount: number;
  guestBreakdown: any;
  theme: string | null;
  decorPreferences: string[] | null;
  colorPalette: string[] | null;
  cateringType: string | null;
  cuisines: string[] | null;
  dietaryRestrictions: string[] | null;
  foodCounters: any;
  photography: string[] | null;
  entertainment: string[] | null;
  accommodation: any;
  transportation: string[] | null;
  additionalServices: string[] | null;
  customRequirements: string | null;
  estimatedBudgetPaise: string;
  clientBudgetPaise?: string | null;
  budgetBreakdown: any;
  fullSelections: any;
  status: "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "ACCEPTED" | "REJECTED";
  reviewNotes: string | null;
  internalNotes: string | null;
  createdAt: string;
  messages?: any[];
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

  const selectedComp = selectedRequest
    ? compareBudgets(
        selectedRequest.estimatedBudgetPaise,
        selectedRequest.clientBudgetPaise || selectedRequest.fullSelections?.clientBudgetPaise,
        selectedRequest.fullSelections?.budgetRange
      )
    : null;
  const [actionLoading, setActionLoading] = useState(false);
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [reviewNoteDraft, setReviewNoteDraft] = useState("");
  const [adminReplyDraft, setAdminReplyDraft] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<"details" | "notes" | "messages">("details");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "ALL"
          ? "/api/booking-requests"
          : `/api/booking-requests?status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch booking requests:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
    // Auto-poll for new inbound booking requests every 8 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const loadRequestDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/booking-requests?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
        setInternalNoteDraft(data.internalNotes || "");
        setReviewNoteDraft(data.reviewNotes || "");
      }
    } catch (err) {
      console.error("Failed to load detail:", err);
    }
  };

  const handleStatusAction = async (action: "ACCEPT" | "REJECT" | "CHANGES_REQUESTED") => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/booking-requests/${selectedRequest.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNotes: reviewNoteDraft,
          internalNotes: internalNoteDraft,
        }),
      });
      if (res.ok) {
        await fetchRequests();
        await loadRequestDetail(selectedRequest.id);
      }
    } catch (err) {
      console.error(`Failed to execute ${action}:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await fetch(`/api/booking-requests/${selectedRequest.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_NOTES",
          internalNotes: internalNoteDraft,
          reviewNotes: reviewNoteDraft,
        }),
      });
      await loadRequestDetail(selectedRequest.id);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyDraft.trim() || !selectedRequest) return;
    try {
      const res = await fetch(`/api/booking-requests/${selectedRequest.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: adminReplyDraft.trim() }),
      });
      if (res.ok) {
        setAdminReplyDraft("");
        await loadRequestDetail(selectedRequest.id);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const formatCurrency = (paiseStr: string | number) => {
    const paise = typeof paiseStr === "string" ? parseInt(paiseStr, 10) : paiseStr;
    if (isNaN(paise) || paise === 0) return "₹0";
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
  };

  // KPIs
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW"
  ).length;
  const acceptedRequests = requests.filter((r) => r.status === "ACCEPTED").length;
  const totalPipelinePaise = requests.reduce((acc, r) => {
    const p = parseInt(r.estimatedBudgetPaise || "0", 10);
    return acc + (isNaN(p) ? 0 : p);
  }, 0);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.coupleName.toLowerCase().includes(q) ||
      (r.destinationCity && r.destinationCity.toLowerCase().includes(q)) ||
      (r.contactEmail && r.contactEmail.toLowerCase().includes(q)) ||
      (r.contactPhone && r.contactPhone.includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inbound Booking Requests"
        description="Review 14-step bespoke wedding plans submitted by clients. Accept consultations into production, request changes, or message couples directly."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Badge variant="outline" className="text-xs border-primary text-primary">
            {pendingRequests} Pending Review
          </Badge>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border/80 shadow-xs">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Total Requests
          </span>
          <p className="font-heading text-2xl font-bold mt-1 text-foreground">
            {totalRequests}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            14-step client submissions
          </span>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-amber-500/30 shadow-xs bg-amber-50/20 dark:bg-amber-950/10">
          <span className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider font-semibold">
            Awaiting Review
          </span>
          <p className="font-heading text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
            {pendingRequests}
          </p>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">
            Requires planner review
          </span>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-emerald-500/30 shadow-xs bg-emerald-50/20 dark:bg-emerald-950/10">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-semibold">
            Accepted & Converted
          </span>
          <p className="font-heading text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
            {acceptedRequests}
          </p>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
            Active wedding projects
          </span>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-gold/30 shadow-xs bg-gold/5">
          <span className="text-xs text-gold-700 dark:text-gold-400 uppercase tracking-wider font-semibold">
            Pipeline Potential
          </span>
          <p className="font-heading text-2xl font-bold mt-1 text-gold-700 dark:text-gold-400">
            {formatCurrency(totalPipelinePaise)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Total client estimated budget
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/70">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {["ALL", "SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "ACCEPTED", "REJECTED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search couple or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Request Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p>Loading booking requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 border border-border text-center space-y-3">
          <Sparkles className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-foreground">
            No Booking Requests Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {statusFilter === "ALL"
              ? "When clients submit consultations via the 14-step wizard, they will appear here automatically."
              : `No requests with status '${statusFilter}' found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-card rounded-2xl p-5 border border-border/80 shadow-xs hover:border-gold/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase ${
                      req.status === "ACCEPTED"
                        ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                        : req.status === "CHANGES_REQUESTED"
                        ? "border-amber-500 text-amber-600 bg-amber-50/50"
                        : req.status === "REJECTED"
                        ? "border-rose-500 text-rose-600 bg-rose-50/50"
                        : "border-primary text-primary bg-primary/5"
                    }`}
                  >
                    {req.status.replace("_", " ")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(req.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base text-foreground group-hover:text-gold transition-colors">
                  {req.coupleName}
                </h3>

                <div className="space-y-1 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    <span>{req.destinationCity || "Udaipur"} • {req.venueType || "Heritage Resort"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    <span>{req.durationDays} Days Duration • {req.guestCount} Guests</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    <strong className="text-foreground">{formatCurrency(req.estimatedBudgetPaise)}</strong>
                    {(() => {
                      const comp = compareBudgets(
                        req.estimatedBudgetPaise,
                        req.clientBudgetPaise || req.fullSelections?.clientBudgetPaise,
                        req.fullSelections?.budgetRange
                      );
                      return comp.isOverBudget ? (
                        <OverbudgetTag
                          isOverBudget={true}
                          overBudgetPaise={comp.overBudgetPaise}
                          clientBudgetPaise={comp.clientBudgetPaise}
                          size="xs"
                        />
                      ) : null;
                    })()}
                  </div>
                </div>

                {req.ceremonies && req.ceremonies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {req.ceremonies.length} Ceremonies:
                    </span>{" "}
                    {req.ceremonies
                      .slice(0, 3)
                      .map((c: any) => c.ceremonyName || c.name)
                      .join(", ")}
                    {req.ceremonies.length > 3 && ` +${req.ceremonies.length - 3} more`}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRequestDetail(req.id)}
                className="w-full text-xs font-semibold border-gold/40 hover:bg-gold/10 hover:text-gold-700"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Review 14-Step Plan
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Detail & Action Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl">
            <DialogHeader className="space-y-2 border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <Badge
                  className={`text-[11px] font-bold uppercase ${
                    selectedRequest.status === "ACCEPTED"
                      ? "bg-emerald-500 text-white"
                      : selectedRequest.status === "CHANGES_REQUESTED"
                      ? "bg-amber-500 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {selectedRequest.status.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}
                </span>
              </div>

              <DialogTitle className="font-heading text-2xl font-bold text-foreground">
                {selectedRequest.coupleName} — Wedding Plan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Complete 14-step consultation responses and client contact profile.
              </DialogDescription>
            </DialogHeader>

            {/* Sub-Tabs: Details, Internal Notes, Client Chat */}
            <div className="flex gap-2 border-b border-border/60 pb-2">
              <button
                onClick={() => setActiveDetailTab("details")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  activeDetailTab === "details" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                14-Step Selections
              </button>
              <button
                onClick={() => setActiveDetailTab("notes")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  activeDetailTab === "notes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Review & Internal Notes
              </button>
              <button
                onClick={() => setActiveDetailTab("messages")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeDetailTab === "messages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Client Chat ({selectedRequest.messages?.length || 0})
              </button>
            </div>

            {/* TAB CONTENT: 14-Step Selections */}
            {activeDetailTab === "details" && (
              <div className="space-y-6 pt-2">
                {/* Contact Banner */}
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Contact Person</span>
                    <strong className="text-sm font-bold text-foreground">{selectedRequest.contactName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Email</span>
                    <span className="text-foreground">{selectedRequest.contactEmail || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Phone / WhatsApp</span>
                    <span className="text-foreground">{selectedRequest.contactPhone || "N/A"}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Estimated Budget</span>
                      {selectedComp?.isOverBudget && (
                        <OverbudgetTag
                          isOverBudget={true}
                          overBudgetPaise={selectedComp.overBudgetPaise}
                          clientBudgetPaise={selectedComp.clientBudgetPaise}
                          size="xs"
                        />
                      )}
                    </div>
                    <strong className="text-sm font-bold text-gold-700 flex items-center gap-2">
                      {formatCurrency(selectedRequest.estimatedBudgetPaise)}
                    </strong>
                    {selectedComp?.isOverBudget && (
                      <span className="text-[10px] text-rose-500 font-medium block">
                        Target: {selectedComp.formattedClientBudget} (+{selectedComp.formattedOverBudget})
                      </span>
                    )}
                    <span className="sr-only">
                      {formatCurrency(selectedRequest.estimatedBudgetPaise)}
                    </span>
                  </div>
                </div>

                {/* 14 Steps Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Step 13: Budget Framework & Variance */}
                  <div className={`p-4 rounded-xl border col-span-1 md:col-span-2 space-y-2.5 ${
                    selectedComp?.isOverBudget
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                      : "bg-card border-border"
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <strong className="text-foreground font-bold flex items-center gap-1.5 text-xs">
                        <IndianRupee className="w-3.5 h-3.5 text-gold-600" />
                        Budget Framework & Financial Status
                      </strong>
                      {selectedComp?.isOverBudget ? (
                        <OverbudgetTag
                          isOverBudget={true}
                          overBudgetPaise={selectedComp.overBudgetPaise}
                          clientBudgetPaise={selectedComp.clientBudgetPaise}
                          size="sm"
                          showAmount={true}
                        />
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                          Within Client Budget
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-background border border-border/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Client Target Budget</span>
                        <span className="text-sm font-bold text-foreground">{selectedComp?.formattedClientBudget || "Flexible / Not set"}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">Tier: {selectedRequest.fullSelections?.budgetRange || "Standard"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border border-border/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Our Estimated Budget</span>
                        <span className="text-sm font-bold text-gold-700">{selectedComp?.formattedEstimated}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">Total calculated plan</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border border-border/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Budget Variance</span>
                        <span className={`text-sm font-bold ${selectedComp?.isOverBudget ? "text-rose-600" : "text-emerald-600"}`}>
                          {selectedComp?.isOverBudget ? `+${selectedComp.formattedOverBudget} (+${selectedComp.percentageOver}%)` : "Within Range"}
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {selectedComp?.isOverBudget ? "Overbudget — vendor optimization needed" : "Aligned with client expectations"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 1 & 2: Traditions */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <strong className="text-foreground font-bold block mb-1">Traditions & Cultural Vows</strong>
                    <p><strong>Wedding Type:</strong> <span className="capitalize">{selectedRequest.weddingType || "Custom"}</span></p>
                    <p><strong>Regional Traditions:</strong> {selectedRequest.regionalTraditions?.join(", ") || "North Indian"}</p>
                  </div>

                  {/* Step 5 & 6: Destination & Dates */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <strong className="text-foreground font-bold block mb-1">Destination & Timing</strong>
                    <p><strong>City & Venue:</strong> {selectedRequest.destinationCity} • {selectedRequest.venueType}</p>
                    <p><strong>Duration:</strong> {selectedRequest.durationDays} Days {selectedRequest.preferredDate ? `• Date: ${selectedRequest.preferredDate}` : ""}</p>
                    <p><strong>Date Flexible:</strong> {selectedRequest.dateFlexible ? "Yes" : "Strict"}</p>
                  </div>

                  {/* Step 7: Guests */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <strong className="text-foreground font-bold block mb-1">Guests & Scale</strong>
                    <p><strong>Total Expected Guests:</strong> {selectedRequest.guestCount}</p>
                    <p><strong>Rooms Requested:</strong> {selectedRequest.accommodation?.accommodationRooms || 50} Luxury Suites</p>
                  </div>

                  {/* Step 8: Theme & Decor */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <strong className="text-foreground font-bold block mb-1">Theme & Visual Identity</strong>
                    <p><strong>Concept:</strong> {selectedRequest.theme || "Royal Traditional Heritage"}</p>
                    <p><strong>Preferences:</strong> {selectedRequest.decorPreferences?.join(", ") || "Palace Grandeur"}</p>
                    {selectedRequest.colorPalette && (
                      <p><strong>Palette:</strong> {selectedRequest.colorPalette.join(", ")}</p>
                    )}
                  </div>

                  {/* Step 9: Catering */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <strong className="text-foreground font-bold block mb-1">Catering & Feasts</strong>
                    <p><strong>Catering Type:</strong> {selectedRequest.cateringType || "Full Royal Catering"}</p>
                    <p><strong>Cuisines:</strong> {selectedRequest.cuisines?.join(", ") || "Multi-cuisine"}</p>
                  </div>

                  {/* Step 10: Photography & Entertainment */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <strong className="text-foreground font-bold block mb-1">Media & Entertainment</strong>
                    <p><strong>Photography:</strong> {selectedRequest.photography?.join(", ") || "Standard"}</p>
                    <p><strong>Entertainment:</strong> {selectedRequest.entertainment?.join(", ") || "Live Shehnai & DJ"}</p>
                  </div>
                </div>

                {/* Ceremonies List */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                  <strong className="text-foreground font-bold block">
                    Selected Ceremonies ({selectedRequest.ceremonies?.length || 0})
                  </strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRequest.ceremonies?.map((c: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{c.ceremonyName || c.name}</span>
                        <span className="text-[10px] text-muted-foreground">Day {c.eventDay || 1} • {c.estimatedDuration || "2h"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Notes & Feedback */}
            {activeDetailTab === "notes" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Feedback / Review Notes for Client (Visible on Client Portal):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide notes on venue availability, date confirmations, or requested modifications..."
                    value={reviewNoteDraft}
                    onChange={(e) => setReviewNoteDraft(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Internal Planner Notes (Confidential to Gathbandhan Team):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Private notes regarding vendor margin, hotel negotiations, lead qualification..."
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={handleSaveNotes}
                  className="text-xs font-semibold"
                >
                  Save Notes
                </Button>
              </div>
            )}

            {/* TAB CONTENT: Client Chat */}
            {activeDetailTab === "messages" && (
              <div className="space-y-4 pt-2">
                <div className="h-64 overflow-y-auto p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  {selectedRequest.messages && selectedRequest.messages.length > 0 ? (
                    selectedRequest.messages.map((m: any) => {
                      const isPlanner = m.senderRole === "PLANNER";
                      return (
                        <div key={m.id} className={`flex flex-col ${isPlanner ? "items-end" : "items-start"}`}>
                          <span className="text-[10px] text-muted-foreground mb-0.5">
                            {m.senderName} ({m.senderRole}) • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <div className={`p-3 rounded-xl text-xs max-w-sm ${isPlanner ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
                            {m.message}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-10">No messages yet.</p>
                  )}
                </div>

                <form onSubmit={handleSendAdminReply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reply to client..."
                    value={adminReplyDraft}
                    onChange={(e) => setAdminReplyDraft(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs rounded-xl border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="text-xs font-bold">
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send Reply
                  </Button>
                </form>
              </div>
            )}

            {/* Action Bar */}
            <div className="border-t border-border/60 pt-4 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
                className="text-xs font-medium"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionLoading || selectedRequest.status === "REJECTED"}
                  onClick={() => handleStatusAction("REJECT")}
                  className="text-xs font-semibold"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject Request
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => handleStatusAction("CHANGES_REQUESTED")}
                  className="text-xs font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Request Clarification
                </Button>

                <Button
                  size="sm"
                  disabled={actionLoading || selectedRequest.status === "ACCEPTED"}
                  onClick={() => handleStatusAction("ACCEPT")}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  {selectedRequest.status === "ACCEPTED" ? "Already Accepted" : "Accept & Convert to Wedding"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
