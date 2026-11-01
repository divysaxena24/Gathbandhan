"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Sparkles,
  Crown,
  Heart,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  FileText,
  Building2,
  Camera,
  Music,
  UtensilsCrossed,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  Home,
  Check,
  CreditCard,
  ArrowRight,
  FileCheck2,
  QrCode,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientBillsUpiView } from "@/components/finance/client-bills-upi-view";
import { RoyalRsvpInvitationCard } from "@/components/guests/royal-rsvp-invitation-card";

interface BookingRequestData {
  id: string;
  weddingId: string | null;
  coupleName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  preferredContactMethod: string | null;
  weddingType: string | null;
  regionalTraditions: string[] | null;
  ceremonies: Array<{
    ceremonyName?: string;
    name?: string;
    eventDay?: number;
    estimatedDuration?: string;
    culturalSignificance?: string;
  }> | null;
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
  budgetBreakdown: Record<string, { totalInPaise: number; label?: string }> | null;
  status: "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "ACCEPTED" | "REJECTED";
  reviewNotes: string | null;
  createdAt: string;
  messages?: Array<{
    id: string;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }>;
}

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get("requestId");
  const tabParam = searchParams.get("tab");
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingRequestData | null>(null);
  const [activeTab, setActiveTab] = useState(tabParam || "rsvp");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Milestone Journey & Stage Progression State
  const [currentStage, setCurrentStage] = useState<number>(3);
  const [activeViewingStage, setActiveViewingStage] = useState<number>(3);
  const [signerName, setSignerName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signedRecord, setSignedRecord] = useState<{
    signerName: string;
    signedAt: string;
    agreementId: string;
  } | null>(null);

  const fetchPortalData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. If explicit requestId passed, load that directly
      let targetId = requestIdParam;

      if (!targetId) {
        // Query /api/auth/me to find active booking request
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          targetId = meData.activeBookingRequestId;
        }
      }

      if (targetId) {
        const res = await fetch(`/api/booking-requests?id=${targetId}`);
        if (res.ok) {
          const data = await res.json();
          setBookingData(data);
          return;
        }
      }

      // If still none, fetch recent requests for current user
      const listRes = await fetch("/api/booking-requests");
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData) && listData.length > 0) {
          setBookingData(listData[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load client portal data:", err);
    } finally {
      setLoading(false);
    }
  }, [requestIdParam]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Sync Stage & Signature State from localStorage & booking data
  useEffect(() => {
    if (typeof window !== "undefined" && bookingData?.id) {
      const savedStage = localStorage.getItem(`gathbandhan_stage_${bookingData.id}`);
      if (savedStage) {
        const num = parseInt(savedStage, 10);
        if (!isNaN(num) && num >= 1 && num <= 5) {
          setCurrentStage(num);
          setActiveViewingStage(num);
        }
      } else {
        const initial = bookingData.status === "ACCEPTED" ? 3 : 2;
        setCurrentStage(initial);
        setActiveViewingStage(initial);
      }

      const savedSig = localStorage.getItem(`gathbandhan_agreement_sig_${bookingData.id}`);
      if (savedSig) {
        try {
          setSignedRecord(JSON.parse(savedSig));
        } catch {
          // ignore
        }
      }

      if (bookingData.contactName) {
        setSignerName((prev) => prev || bookingData.contactName);
      }
    }
  }, [bookingData?.id, bookingData?.status, bookingData?.contactName]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !bookingData) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/booking-requests/${bookingData.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        setFeedbackToast("Message sent to your wedding designer!");
        setTimeout(() => setFeedbackToast(null), 3000);
        fetchPortalData();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatCurrency = (paiseStr: string | number) => {
    const paise = typeof paiseStr === "string" ? parseInt(paiseStr, 10) : paiseStr;
    if (isNaN(paise) || paise === 0) return "₹0";
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mb-4 border border-gold/30 animate-pulse">
          <Sparkles className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-maroon-deep mb-2">
          Loading Your Wedding Portal
        </h2>
        <p className="text-xs text-warm-gray max-w-sm">
          Retrieving your 14-step bespoke wedding selections, ceremony itinerary, and designer notes...
        </p>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
        <header className="border-b border-gold/15 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="font-heading text-xl font-bold text-maroon-deep">Gathbandhan</span>
          </Link>
          <UserButton />
        </header>

        <main className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-6 border border-gold/30">
            <Heart className="w-8 h-8 text-maroon" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-maroon-deep mb-3">
            Start Planning Your Wedding
          </h1>
          <p className="text-sm text-warm-gray mb-8 leading-relaxed">
            You don't have an active wedding consultation submitted yet. Step through our 14-step royal wedding wizard to discover sacred ceremonies, venues, themes, and transparent pricing.
          </p>
          <div className="space-y-3">
            <Link href="/plan-your-wedding" className="block w-full">
              <Button size="lg" className="w-full bg-maroon hover:bg-maroon-deep text-soft-white h-12 font-bold shadow-md">
                <Sparkles className="w-4 h-4 mr-2 text-gold-light" />
                Start 14-Step Planning Wizard
              </Button>
            </Link>
            <Link href="/client" className="block text-xs text-warm-gray hover:text-maroon font-medium py-1">
              View Wedding Inspirations & Traditions →
            </Link>
          </div>
        </main>

        <footer className="border-t border-gold/15 py-6 text-center text-xs text-warm-gray">
          © 2026 Gathbandhan — Where Every Celebration Comes Together.
        </footer>
      </div>
    );
  }

  const isAccepted = bookingData.status === "ACCEPTED";
  const isChangesRequested = bookingData.status === "CHANGES_REQUESTED";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-charcoal selection:bg-gold/20 flex flex-col justify-between">
      {/* Top Royal Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gold/20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30 group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <span className="font-heading font-bold text-lg text-maroon-deep block leading-tight">
                  Gathbandhan
                </span>
                <span className="text-[10px] uppercase font-bold text-gold-700 tracking-wider">
                  Client Wedding Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-xs font-semibold text-maroon-deep">
              <Heart className="w-3.5 h-3.5 text-rose fill-rose/30" />
              <span>{bookingData.coupleName}</span>
            </div>

            <Link
              href="/portal-select"
              className="text-xs font-semibold text-warm-gray hover:text-maroon transition-colors px-2 py-1"
            >
              Switch Portal
            </Link>

            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-8 h-8 ring-2 ring-gold/30",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Toast alert */}
        {feedbackToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-maroon-deep text-soft-white px-5 py-3 rounded-2xl shadow-2xl border border-gold/40 flex items-center gap-3 text-sm animate-[fadeIn_0.2s_ease]">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Hero Wedding Banner */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-maroon-deep via-maroon to-maroon-deep text-soft-white shadow-xl border border-gold/30">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-rose/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-gold-light">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                {isAccepted
                  ? "Production Active • Wedding In Planning"
                  : isChangesRequested
                  ? "Review Required • Note from Planner"
                  : "Awaiting Review • Bespoke Consultation Submitted"}
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ivory">
                The Royal Wedding of {bookingData.coupleName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-soft-white/80">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gold" />
                  {bookingData.destinationCity || "Udaipur"} • {bookingData.venueType || "Heritage Palace"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold" />
                  {bookingData.durationDays} Days Duration
                  {bookingData.preferredDate && ` • ${bookingData.preferredDate}`}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gold" />
                  {bookingData.guestCount} Guests
                </span>
              </div>
            </div>

            {/* Budget Display Card */}
            <div className="bg-black/25 backdrop-blur-md p-5 rounded-2xl border border-gold/30 flex flex-col justify-center min-w-[220px]">
              <span className="text-[11px] uppercase tracking-wider text-gold-light font-semibold">
                Estimated Investment
              </span>
              <span className="font-heading text-2xl sm:text-3xl font-bold text-soft-white mt-1">
                {formatCurrency(bookingData.estimatedBudgetPaise)}
              </span>
              <span className="text-[10px] text-soft-white/60 mt-0.5">
                Calculated across all 14 selections
              </span>
            </div>
          </div>

          {/* Review status note */}
          {bookingData.reviewNotes && (
            <div className="mt-6 pt-6 border-t border-white/15 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 border border-gold/40">
                <MessageSquare className="w-4 h-4 text-gold" />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="text-gold block mb-0.5">Note from Senior Wedding Designer:</strong>
                <p className="text-soft-white/90 leading-relaxed">{bookingData.reviewNotes}</p>
              </div>
            </div>
          )}

          {/* Quick Action: Royal RSVP & Guest Pass */}
          <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-light" />
              <span className="text-xs text-soft-white/90 font-medium">
                Digital Royal RSVP & Entry QR Pass Ready
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setActiveTab("rsvp");
                  document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-gold hover:bg-gold-light text-maroon-deep font-bold text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                View & Share Royal RSVP Card
              </Button>

              <Link
                href={`/rsvp/invite/${bookingData.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-soft-white border border-white/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gold-light" />
                Open Guest Link
              </Link>
            </div>
          </div>
        </section>

        {/* 5-Stage Milestone Progress */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-maroon-deep flex items-center gap-2">
                <span>Planning Journey & Milestones</span>
                <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-gold/15 text-gold-900 border border-gold/30">
                  Stage {currentStage} of 5 Active
                </span>
              </h2>
              <p className="text-xs text-warm-gray mt-0.5">
                Follow every step from your initial 14-step consultation to live execution day. Click any milestone to view details or proceed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  currentStage >= 5
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50 font-bold"
                    : currentStage === 4
                    ? "border-amber-500 text-amber-800 bg-amber-50 font-bold"
                    : isAccepted
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50 font-semibold"
                    : "border-gold text-gold-700 bg-gold/10"
                }
              >
                {currentStage >= 5
                  ? "🚀 Royal Knot Live Execution Active"
                  : currentStage === 4
                  ? "✍️ Contract Signing Active"
                  : isAccepted
                  ? "Accepted & Active"
                  : "In Review"}
              </Badge>
            </div>
          </div>

          {/* 5 Milestone Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
            {[
              {
                stage: 1,
                title: "1. Consultation",
                subtitle: "14-Step Form",
                status: "completed" as const,
              },
              {
                stage: 2,
                title: "2. Planner Review",
                subtitle: isAccepted || currentStage >= 2 ? "Completed" : "Under Review",
                status: isAccepted || currentStage >= 2 ? ("completed" as const) : ("active" as const),
              },
              {
                stage: 3,
                title: "3. Bespoke Proposal",
                subtitle:
                  currentStage > 3
                    ? "Approved"
                    : currentStage === 3
                    ? "Action Required"
                    : isAccepted
                    ? "Ready"
                    : "Queued",
                status:
                  currentStage > 3
                    ? ("completed" as const)
                    : currentStage === 3
                    ? ("active" as const)
                    : ("upcoming" as const),
              },
              {
                stage: 4,
                title: "4. Contract & Signing",
                subtitle:
                  currentStage > 4
                    ? "Signed & Executed"
                    : currentStage === 4
                    ? "Signature Required"
                    : "Agreement",
                status:
                  currentStage > 4
                    ? ("completed" as const)
                    : currentStage === 4
                    ? ("active" as const)
                    : ("upcoming" as const),
              },
              {
                stage: 5,
                title: "5. Royal Knot Execution",
                subtitle:
                  currentStage >= 5
                    ? "Live Control Room"
                    : "Control Room",
                status:
                  currentStage >= 5
                    ? ("active" as const)
                    : ("upcoming" as const),
              },
            ].map((step, idx) => {
              const isViewing = activeViewingStage === step.stage;
              const isCurrent = currentStage === step.stage;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveViewingStage(step.stage)}
                  role="button"
                  tabIndex={0}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    isViewing ? "ring-2 ring-maroon shadow-md " : ""
                  }${
                    step.status === "completed"
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-100/60"
                      : step.status === "active"
                      ? "bg-gold/15 border-gold text-maroon-deep ring-2 ring-gold/40 shadow-xs hover:bg-gold/25"
                      : "bg-cream/40 border-gold/15 text-warm-gray opacity-80 hover:opacity-100 hover:bg-cream/70"
                  }`}
                >
                  {isViewing && (
                    <span className="absolute -top-2.5 right-3 bg-maroon-deep text-[9px] font-bold text-soft-white px-2 py-0.5 rounded-full shadow-xs">
                      Viewing
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      Stage {step.stage}
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
                      )}
                    </span>
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : step.status === "active" ? (
                      <Clock className="w-4 h-4 text-gold animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-warm-gray/40" />
                    )}
                  </div>
                  <h4 className="font-bold text-xs">{step.title}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5 font-medium">{step.subtitle}</p>
                </div>
              );
            })}
          </div>

          {/* Interactive Stage Action & Detail Card for activeViewingStage */}
          <div className="mt-2">
            {/* STAGE 1 VIEW */}
            {activeViewingStage === 1 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream/40 border border-gold/30 space-y-4 animate-[fadeIn_0.2s_ease]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        Stage 1 Completed ✓
                      </Badge>
                      <span className="text-xs text-warm-gray">Initial Wedding Consultation</span>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-maroon-deep mt-1">
                      14-Step Bespoke Consultation Submitted
                    </h3>
                    <p className="text-xs text-warm-gray mt-0.5">
                      Your comprehensive wedding intake including traditions, dates, destination, and guest preferences was recorded.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTab("overview");
                        document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-white hover:bg-gold/10 text-maroon-deep border border-gold/30 text-xs rounded-xl"
                    >
                      View Wedding Overview
                    </Button>
                    {currentStage > 1 && (
                      <Button
                        size="sm"
                        onClick={() => setActiveViewingStage(currentStage)}
                        className="bg-maroon hover:bg-maroon-deep text-white font-bold text-xs rounded-xl"
                      >
                        Return to Active Stage {currentStage} →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2 VIEW */}
            {activeViewingStage === 2 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream/40 border border-gold/30 space-y-4 animate-[fadeIn_0.2s_ease]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        Stage 2 Completed ✓
                      </Badge>
                      <span className="text-xs text-warm-gray">Planner Feasibility Review</span>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-maroon-deep mt-1">
                      Senior Planner Review Completed & Accepted
                    </h3>
                    <p className="text-xs text-warm-gray mt-0.5">
                      Gathbandhan&apos;s senior luxury wedding planner evaluated venue slots, ceremony flow, and vendor availability.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTab("ceremonies");
                        document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-white hover:bg-gold/10 text-maroon-deep border border-gold/30 text-xs rounded-xl"
                    >
                      View Events & Schedule ({bookingData.ceremonies?.length || 2})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveViewingStage(3)}
                      className="bg-maroon hover:bg-maroon-deep text-white font-bold text-xs rounded-xl"
                    >
                      Proceed to Proposal (Stage 3) →
                    </Button>
                  </div>
                </div>
                {bookingData.reviewNotes && (
                  <div className="bg-white p-3.5 rounded-xl border border-gold/20 text-xs text-charcoal">
                    <span className="font-bold text-maroon-deep">Planner Notes: </span>
                    {bookingData.reviewNotes}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 3 VIEW (THE BESPOKE PROPOSAL - USER ASKS HOW TO MOVE AFTER THIS STAGE) */}
            {activeViewingStage === 3 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream/40 border border-gold/30 space-y-4 animate-[fadeIn_0.2s_ease]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        currentStage > 3
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold"
                          : "bg-gold/20 text-maroon-deep border-gold/40 text-[10px] font-bold"
                      }>
                        {currentStage > 3 ? "Stage 3 Approved ✓" : "Stage 3 Action Required"}
                      </Badge>
                      <span className="text-xs text-warm-gray">Bespoke Proposal Review</span>
                    </div>
                    <h3 className="font-heading font-bold text-xl text-maroon-deep mt-1">
                      {currentStage > 3 ? "Bespoke Royal Proposal Approved" : "Bespoke Proposal Ready for Your Approval"}
                    </h3>
                    <p className="text-xs text-warm-gray mt-0.5 max-w-2xl">
                      {currentStage > 3
                        ? "You have successfully approved this bespoke wedding proposal. Proceed to Stage 4 to digitally sign your Royal Master Service Agreement."
                        : "Your wedding designer has structured your bespoke multi-day ceremonies, guest capacity, and budget. Review the details below, then click the button to approve and advance to Stage 4 (Contract & Signing)."}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {currentStage === 3 ? (
                      <Button
                        onClick={() => {
                          const next = 4;
                          setCurrentStage(next);
                          setActiveViewingStage(next);
                          if (bookingData?.id) {
                            localStorage.setItem(`gathbandhan_stage_${bookingData.id}`, String(next));
                          }
                          setFeedbackToast("✨ Bespoke Proposal Approved! Welcome to Stage 4: Contract & Signing.");
                          setTimeout(() => setFeedbackToast(null), 4000);
                        }}
                        className="bg-maroon hover:bg-maroon-deep text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-gold-light" />
                        <span>Approve Proposal & Proceed to Contract</span>
                        <ArrowRight className="w-4 h-4 text-gold-light" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setActiveViewingStage(4)}
                        className="bg-maroon hover:bg-maroon-deep text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                      >
                        <span>View Stage 4: Contract & Signing</span>
                        <ArrowRight className="w-4 h-4 text-gold-light" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Proposal Quick Digest */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-gold/20 shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-warm-gray tracking-wider">Sacred Events</div>
                    <div className="text-sm font-bold text-maroon-deep mt-0.5">
                      {bookingData.ceremonies?.length || 2} Ceremonies
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("ceremonies");
                        document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-[11px] text-gold-800 hover:underline font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Schedule <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gold/20 shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-warm-gray tracking-wider">Total Investment</div>
                    <div className="text-sm font-bold text-maroon-deep mt-0.5">
                      {formatCurrency(bookingData.estimatedBudgetPaise)}
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("budget");
                        document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-[11px] text-gold-800 hover:underline font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Budget <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gold/20 shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-warm-gray tracking-wider">Royal Guests</div>
                    <div className="text-sm font-bold text-maroon-deep mt-0.5">
                      {bookingData.guestCount} Headcount
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("rsvp");
                        document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-[11px] text-gold-800 hover:underline font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      RSVP & Card <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gold/20 shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-warm-gray tracking-wider">Venue & Location</div>
                    <div className="text-sm font-bold text-maroon-deep mt-0.5 truncate">
                      {bookingData.destination || "Private Property"}
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("overview");
                        document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-[11px] text-gold-800 hover:underline font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Overview <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4 VIEW (CONTRACT & SIGNING) */}
            {activeViewingStage === 4 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-cream/40 border border-gold/30 space-y-4 animate-[fadeIn_0.2s_ease]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        currentStage > 4
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold"
                          : "bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold"
                      }>
                        {currentStage > 4 ? "Stage 4 Signed ✓" : "Stage 4 Action Required"}
                      </Badge>
                      <span className="text-xs text-warm-gray">Master Wedding Service Agreement</span>
                    </div>
                    <h3 className="font-heading font-bold text-xl text-maroon-deep mt-1">
                      Royal Service Contract & Digital Sign-off
                    </h3>
                    <p className="text-xs text-warm-gray mt-0.5 max-w-2xl">
                      Review the master service contract for {bookingData.coupleName}&apos;s celebration and execute your electronic signature to officially activate live event execution.
                    </p>
                  </div>

                  {currentStage > 4 && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs px-3 py-1 font-bold">
                      ✓ Agreement Signed & Executed
                    </Badge>
                  )}
                </div>

                {/* Agreement Summary Box */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gold/25 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gold/15 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-gold-700" />
                      <span className="font-heading font-bold text-sm text-maroon-deep">
                        Gathbandhan Royal Wedding Master Service Agreement (v2.4)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-warm-gray">
                      Ref: GATH-{bookingData.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-charcoal/90 space-y-1.5 leading-relaxed bg-cream/30 p-3.5 rounded-xl border border-gold/15">
                    <p className="font-bold text-maroon-deep">Key Production Commitments:</p>
                    <ul className="list-disc list-inside space-y-1 text-warm-gray">
                      <li><strong>Guaranteed Date Hold:</strong> Full exclusive hold on selected venue and wedding production dates.</li>
                      <li><strong>Escrow Protection:</strong> Vendor disbursements are safeguarded in milestone-based escrow accounts.</li>
                      <li><strong>Live Production Control:</strong> 24/7 bridal concierge, real-time gate security QR scanner, and emergency dispatch.</li>
                      <li><strong>Payment Terms:</strong> Milestone-based settlements via virtual UPI or bank wire.</li>
                    </ul>
                  </div>

                  {/* Signature Form or Signed Confirmation */}
                  {signedRecord || currentStage > 4 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Digitally Signed & Validated
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Signed by <strong>{signedRecord?.signerName || signerName || bookingData.contactName}</strong> on {signedRecord?.signedAt || new Date().toLocaleDateString("en-IN")}. Legal electronic timestamp attached.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setActiveViewingStage(5);
                          setCurrentStage(5);
                        }}
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Proceed to Stage 5: Live Execution →
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-maroon-deep mb-1">
                            Authorized Signer Full Name *
                          </label>
                          <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="e.g. Kira Sharma"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-gold/30 bg-cream/20 focus:outline-none focus:ring-2 focus:ring-gold text-charcoal font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-maroon-deep mb-1">
                            Signing Capacity
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`Client / Royal Couple (${bookingData.coupleName})`}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-gold/20 bg-cream/40 text-warm-gray"
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 rounded border-gold/40 text-maroon focus:ring-maroon h-4 w-4"
                        />
                        <span className="text-xs text-warm-gray leading-tight">
                          I confirm that I have reviewed the bespoke wedding proposal and agreement terms. I understand that executing this contract transitions our wedding into live production execution.
                        </span>
                      </label>

                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveViewingStage(3)}
                          className="border-gold/30 text-warm-gray hover:text-maroon-deep text-xs rounded-xl cursor-pointer"
                        >
                          ← Back to Proposal
                        </Button>

                        <Button
                          onClick={async () => {
                            if (!signerName.trim()) {
                              setFeedbackToast("Please provide your full legal name to sign.");
                              setTimeout(() => setFeedbackToast(null), 3000);
                              return;
                            }
                            if (!agreedToTerms) {
                              setFeedbackToast("Please check the agreement box before submitting.");
                              setTimeout(() => setFeedbackToast(null), 3000);
                              return;
                            }
                            setIsSigning(true);
                            try {
                              const record = {
                                signerName: signerName.trim(),
                                signedAt: new Date().toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }),
                                agreementId: `AGR-${bookingData.id.slice(0, 8).toUpperCase()}`,
                              };
                              setSignedRecord(record);
                              if (bookingData?.id) {
                                localStorage.setItem(`gathbandhan_agreement_sig_${bookingData.id}`, JSON.stringify(record));
                                localStorage.setItem(`gathbandhan_stage_${bookingData.id}`, "5");
                              }
                              setCurrentStage(5);
                              setActiveViewingStage(5);
                              setFeedbackToast("🎉 Agreement signed successfully! Live Execution is now ACTIVE.");
                              setTimeout(() => setFeedbackToast(null), 5000);
                            } finally {
                              setIsSigning(false);
                            }
                          }}
                          disabled={isSigning || !signerName.trim() || !agreedToTerms}
                          className="bg-maroon hover:bg-maroon-deep text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-gold-light" />
                          <span>{isSigning ? "Signing Contract..." : "✍️ Digitally Sign Agreement & Advance to Stage 5"}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 5 VIEW (ROYAL KNOT EXECUTION) */}
            {activeViewingStage === 5 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cream/60 via-gold/10 to-cream/40 border border-gold/40 space-y-4 shadow-sm animate-[fadeIn_0.2s_ease]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        Stage 5 Active • Live Production
                      </Badge>
                      <span className="text-xs text-warm-gray font-medium">Royal Knot Execution Control</span>
                    </div>
                    <h3 className="font-heading font-bold text-xl text-maroon-deep mt-1 flex items-center gap-2">
                      <span>🎉 Royal Knot Live Execution Active!</span>
                    </h3>
                    <p className="text-xs text-warm-gray mt-0.5 max-w-2xl">
                      Congratulations! Your wedding is officially in Live Production. All operations including gate passes, incident reporting, vendor dispatch, and bridal concierge are now synchronized in the Control Room.
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href="/control-room"
                      className="inline-flex items-center gap-2 bg-maroon hover:bg-maroon-deep text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="w-4 h-4 text-gold" />
                      <span>Open Live Execution Control Room</span>
                      <ArrowRight className="w-4 h-4 text-gold-light" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-gold/25 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-maroon-deep">
                      <QrCode className="w-4 h-4 text-gold-700" />
                      Gate Admission & RSVP Pass
                    </div>
                    <p className="text-[11px] text-warm-gray mt-1 leading-relaxed">
                      Guests receive digital passes with real-time capacity QR codes. Simulated gate check-in available.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("rsvp");
                          document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs text-gold-800 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        View Royal RSVP Card <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gold/25 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-maroon-deep">
                      <CreditCard className="w-4 h-4 text-gold-700" />
                      Bills & Virtual UPI Payments
                    </div>
                    <p className="text-[11px] text-warm-gray mt-1 leading-relaxed">
                      Settle vendor advances and balance invoices via simulated UPI QR codes.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("bills-upi");
                          document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs text-gold-800 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        Open Bills & Payments <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gold/25 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-maroon-deep">
                      <Clock className="w-4 h-4 text-gold-700" />
                      Ceremony Milestones
                    </div>
                    <p className="text-[11px] text-warm-gray mt-1 leading-relaxed">
                      {bookingData.ceremonies?.length || 2} sacred events programmed across {bookingData.durationDays} day(s) duration.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("ceremonies");
                          document.getElementById("portal-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs text-gold-800 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        View Full Itinerary <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Helper Nav strip */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-warm-gray pt-2 border-t border-gold/15">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Click any milestone card above to view stage actions, proposal approvals, and agreement signing.</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-warm-gray">Stage Switcher:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setActiveViewingStage(s);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    activeViewingStage === s
                      ? "bg-maroon text-soft-white"
                      : "bg-cream/70 text-maroon-deep hover:bg-gold/20"
                  }`}
                >
                  Stage {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tabbed Interactive Experience */}
        <div id="portal-tabs-section">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-2xl border border-gold/20 shadow-xs flex flex-wrap h-auto gap-1">
              <TabsTrigger
                value="rsvp"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 text-gold" />
                Royal Invitation & RSVP
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-gold/20 text-gold-800 text-[10px] font-bold">New</span>
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold"
              >
                Wedding Overview
              </TabsTrigger>
              <TabsTrigger
                value="ceremonies"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold"
              >
                Events & Schedule ({bookingData.ceremonies?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="budget"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold"
              >
                Budget & Categories
              </TabsTrigger>
              <TabsTrigger
                value="vendors"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold"
              >
                Approved Vendors
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-gold" />
                Designer Chat ({bookingData.messages?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="bills-upi"
                className="data-[state=active]:bg-maroon data-[state=active]:text-soft-white rounded-xl text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 text-gold" />
                Bills & Virtual UPI
              </TabsTrigger>
            </TabsList>

            {/* TAB 0: Royal Invitation & RSVP Card */}
            <TabsContent value="rsvp" className="space-y-6">
              <RoyalRsvpInvitationCard
                coupleName={bookingData.coupleName}
                bookingRequestId={bookingData.id}
                weddingId={bookingData.weddingId}
                weddingType={bookingData.weddingType}
                destinationCity={bookingData.destinationCity || "Udaipur"}
                venueType={bookingData.venueType || "Heritage Palace"}
                preferredDate={bookingData.preferredDate}
                durationDays={bookingData.durationDays}
                totalGuestsEstimated={bookingData.guestCount}
                theme={bookingData.theme}
                ceremonies={bookingData.ceremonies}
              />
            </TabsContent>

          {/* TAB 1: Wedding Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Traditions & Ceremonies */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon">
                  <Crown className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-maroon-deep">
                  Traditions & Heritage
                </h3>
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <p><strong>Wedding Type:</strong> <span className="capitalize">{bookingData.weddingType || "Custom"}</span></p>
                  <p><strong>Regional Flavor:</strong> {bookingData.regionalTraditions?.join(", ") || "North Indian Rajasthani"}</p>
                  <p><strong>Selected Ceremonies:</strong> {bookingData.ceremonies?.length || 0} events across {bookingData.durationDays} days</p>
                </div>
              </div>

              {/* Card 2: Theme & Decor */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon">
                  <Sparkles className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-maroon-deep">
                  Theme & Visual Identity
                </h3>
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <p><strong>Concept Theme:</strong> {bookingData.theme || "Royal Traditional Heritage"}</p>
                  <p><strong>Decor Preferences:</strong> {bookingData.decorPreferences?.join(", ") || "Grand Floral Mandap, Palace Lighting"}</p>
                  {bookingData.colorPalette && bookingData.colorPalette.length > 0 && (
                    <div>
                      <span className="font-bold block mb-1">Color Palette:</span>
                      <div className="flex gap-2">
                        {bookingData.colorPalette.map((color, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-cream border border-gold/20 text-[10px] font-semibold">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Catering & Feasts */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon">
                  <UtensilsCrossed className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-maroon-deep">
                  Culinary Experience
                </h3>
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <p><strong>Catering Style:</strong> {bookingData.cateringType || "Multi-Cuisine Royal Banquet"}</p>
                  <p><strong>Cuisines:</strong> {bookingData.cuisines?.join(", ") || "Rajasthani Royal, Pan-Indian, Continental"}</p>
                  <p><strong>Live Food Counters:</strong> {bookingData.foodCounters?.liveFoodCounters ? "Yes (Chaat, Grills, Desserts)" : "Standard Buffet"}</p>
                </div>
              </div>

              {/* Card 4: Entertainment & Media */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon">
                  <Camera className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-maroon-deep">
                  Photography & Entertainment
                </h3>
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <p><strong>Photography:</strong> {bookingData.photography?.join(", ") || "Cinematic 4K, Drone, Pre-wedding"}</p>
                  <p><strong>Entertainment:</strong> {bookingData.entertainment?.join(", ") || "Live Shehnai, Sufi Band, Celebrity DJ"}</p>
                </div>
              </div>

              {/* Card 5: Accommodation & Travel */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon">
                  <Building2 className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-maroon-deep">
                  Hospitality & Stays
                </h3>
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <p><strong>Rooms Required:</strong> {bookingData.accommodation?.accommodationRooms || 50} Luxury Rooms</p>
                  <p><strong>Duration:</strong> {bookingData.accommodation?.accommodationNights || bookingData.durationDays} Nights</p>
                  <p><strong>Airport Transfers:</strong> {bookingData.transportation?.join(", ") || "Luxury Vintage Fleet & Guest Shuttles"}</p>
                </div>
              </div>

              {/* Card 6: Additional Services */}
              <div className="bg-white rounded-3xl p-6 border border-gold/20 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon">
                  <ShieldCheck className="w-5 h-5 text-gold-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-maroon-deep">
                  Concierge & Logistics
                </h3>
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <p><strong>Add-ons:</strong> {bookingData.additionalServices?.join(", ") || "Pundit/Priest, Fireworks, Safa Tying, Welcome Hampers"}</p>
                  <p><strong>Custom Requests:</strong> {bookingData.customRequirements || "Full wedding concierge coordination"}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Ceremonies & Schedule */}
          <TabsContent value="ceremonies" className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm">
              <h3 className="font-heading font-bold text-xl text-maroon-deep mb-2">
                Curated Ceremonies & Schedule
              </h3>
              <p className="text-xs text-warm-gray mb-6">
                Your selected sequence of sacred rituals, celebrations, and feasts.
              </p>

              <div className="space-y-4">
                {bookingData.ceremonies && bookingData.ceremonies.length > 0 ? (
                  bookingData.ceremonies.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-gold/20 bg-cream/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-maroon text-soft-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-maroon-deep">
                            {c.ceremonyName || c.name}
                          </h4>
                          <p className="text-xs text-warm-gray mt-0.5">
                            Day {c.eventDay || 1} • Expected Duration: {c.estimatedDuration || "2.5 Hours"}
                          </p>
                          {c.culturalSignificance && (
                            <p className="text-xs text-charcoal-600 mt-2 bg-white/70 p-2.5 rounded-xl border border-gold/15">
                              {c.culturalSignificance}
                            </p>
                          )}
                        </div>
                      </div>

                      <Badge className="bg-gold/20 text-maroon-deep border border-gold/40 self-start sm:self-center">
                        Included in Consultation
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-warm-gray py-6 text-center">
                    No individual ceremonies selected yet.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Budget & Breakdown */}
          <TabsContent value="budget" className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-maroon-deep">
                    Transparent Investment Breakdown
                  </h3>
                  <p className="text-xs text-warm-gray">
                    Live calculation across all {bookingData.guestCount} guests and selected luxury tiers.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-warm-gray block">Estimated Total</span>
                  <span className="font-heading text-2xl font-bold text-maroon">
                    {formatCurrency(bookingData.estimatedBudgetPaise)}
                  </span>
                </div>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {bookingData.budgetBreakdown && Object.keys(bookingData.budgetBreakdown).length > 0 ? (
                  Object.entries(bookingData.budgetBreakdown).map(([catKey, catVal]: any) => (
                    <div
                      key={catKey}
                      className="p-4 rounded-2xl border border-gold/20 bg-soft-white flex flex-col justify-between"
                    >
                      <span className="text-xs font-bold text-maroon-deep capitalize">
                        {catVal.label || catKey.replace(/_/g, " ")}
                      </span>
                      <span className="font-heading text-lg font-bold text-charcoal mt-2">
                        {formatCurrency(catVal.totalInPaise || catVal)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-3 text-center py-8 text-xs text-warm-gray">
                    Detailed category breakdown will appear once formal quotation is generated.
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-cream/60 border border-gold/30 text-xs text-warm-gray flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <p>
                  Gathbandhan guarantees 100% price transparency with integer-paise accounting. No hidden agency surcharges or surprise vendor markups.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Approved Vendors */}
          <TabsContent value="vendors" className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-xl text-maroon-deep">
                    Gathbandhan Curated Vendors
                  </h3>
                  <p className="text-xs text-warm-gray">
                    Rajasthan's most acclaimed palace venues, royal caterers, and artists.
                  </p>
                </div>
                <Badge className="bg-gold/15 text-gold-700 border-gold/30">
                  {isAccepted ? "Allocated" : "Preliminary Shortlist"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    category: "Heritage Venue",
                    title: `${bookingData.destinationCity || "Udaipur"} Palace & Resort`,
                    status: isAccepted ? "Reserved" : "Checking Dates",
                    desc: "Expansive courtyards, poolside sangeet lawns, and royal suites.",
                  },
                  {
                    category: "Royal Catering",
                    title: "The Maharani Imperial Feast",
                    status: "Custom Menu Drafting",
                    desc: "Authentic Dal Baati Churma, Pan-Asian woks, and live mithai counters.",
                  },
                  {
                    category: "Floral & Production",
                    title: "Vedic Mandap & Architectural Illuminations",
                    status: "Concept Board Ready",
                    desc: "Fresh marigold garlands, lotus installations, and palace projection mapping.",
                  },
                  {
                    category: "Cinematography",
                    title: "Royal Knot Signature Visuals",
                    status: "Crew Shortlisted",
                    desc: "Full 4K documentary crew, pre-wedding couple shoot, and drone highlights.",
                  },
                ].map((v, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-gold/20 bg-cream/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gold-700 uppercase tracking-wider text-[10px]">
                          {v.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-gold/20 text-[10px] font-semibold text-maroon">
                          {v.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-maroon-deep mt-1">{v.title}</h4>
                      <p className="text-xs text-warm-gray mt-1 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: Designer Chat */}
          <TabsContent value="messages" className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm flex flex-col h-[520px]">
              <div className="pb-4 border-b border-gold/15 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg text-maroon-deep">
                    Direct Planner Concierge
                  </h3>
                  <p className="text-xs text-warm-gray">
                    Real-time collaboration with your assigned wedding designer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-700 font-semibold">Concierge Online</span>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {bookingData.messages && bookingData.messages.length > 0 ? (
                  bookingData.messages.map((m) => {
                    const isClient = m.senderRole === "CLIENT";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isClient ? "items-end" : "items-start"}`}
                      >
                        <div className="text-[10px] text-warm-gray mb-1 px-1">
                          {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isClient
                              ? "bg-maroon text-soft-white rounded-br-none"
                              : "bg-cream/80 text-charcoal border border-gold/30 rounded-bl-none"
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-warm-gray py-8">
                    Start a conversation with your wedding planner below!
                  </p>
                )}
              </div>

              {/* Input box */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-gold/15 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about your ceremonies, venue options, or dates..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gold/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-[#FAF7F2]"
                />
                <Button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-maroon hover:bg-maroon-deep text-soft-white px-5 rounded-xl text-xs font-bold"
                >
                  <Send className="w-4 h-4 mr-1 text-gold-light" />
                  Send
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* TAB 6: Bills & Virtual UPI Payments */}
          <TabsContent value="bills-upi" className="space-y-6">
            <ClientBillsUpiView weddingId={bookingData.weddingId || undefined} />
          </TabsContent>
        </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/15 py-6 bg-white/60 text-center text-xs text-warm-gray">
        <p>© 2026 Gathbandhan — Where Every Celebration Comes Together.</p>
      </footer>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
          <Sparkles className="w-8 h-8 text-gold animate-spin" />
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}

