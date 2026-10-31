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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientBillsUpiView } from "@/components/finance/client-bills-upi-view";

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
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingRequestData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

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
          © 2026 Gathbandhan — The Royal Knot Client Experience
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
        </section>

        {/* 5-Stage Milestone Progress */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-maroon-deep">
                Planning Journey & Milestones
              </h2>
              <p className="text-xs text-warm-gray">
                Follow every step from your initial 14-step consultation to execution day.
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                isAccepted
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                  : "border-gold text-gold-700 bg-gold/10"
              }
            >
              {isAccepted ? "Accepted & Active" : "In Review"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {[
              { title: "1. Consultation", subtitle: "14-Step Form", status: "completed" },
              {
                title: "2. Planner Review",
                subtitle: isAccepted ? "Completed" : "Under Review",
                status: isAccepted ? "completed" : "active",
              },
              {
                title: "3. Bespoke Proposal",
                subtitle: isAccepted ? "In Preparation" : "Queued",
                status: isAccepted ? "active" : "upcoming",
              },
              {
                title: "4. Contract & Signing",
                subtitle: "Agreement",
                status: "upcoming",
              },
              {
                title: "5. Royal Knot Execution",
                subtitle: "Control Room",
                status: "upcoming",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  step.status === "completed"
                    ? "bg-emerald-50/60 border-emerald-300 text-emerald-900"
                    : step.status === "active"
                    ? "bg-gold/10 border-gold text-maroon-deep ring-2 ring-gold/20"
                    : "bg-charcoal/5 border-border/50 text-warm-gray"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Stage {idx + 1}
                  </span>
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : step.status === "active" ? (
                    <Clock className="w-4 h-4 text-gold animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-warm-gray/40" />
                  )}
                </div>
                <h4 className="font-bold text-xs">{step.title}</h4>
                <p className="text-[11px] opacity-75 mt-0.5">{step.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabbed Interactive Experience */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl border border-gold/20 shadow-xs flex flex-wrap h-auto gap-1">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/15 py-6 bg-white/60 text-center text-xs text-warm-gray">
        <p>© 2026 Gathbandhan — The Operating System & Client Platform for Luxury Weddings.</p>
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

