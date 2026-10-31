"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Crown,
  FileCheck2,
  Calendar,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  Download,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";
import { ClientBillsUpiView } from "@/components/finance/client-bills-upi-view";

interface PortalData {
  wedding: {
    id: string;
    title: string;
    coupleName: string;
    partnerOneName: string;
    partnerTwoName: string | null;
    city: string | null;
    venue: string | null;
    startDate: string | null;
    endDate: string | null;
    packageType: string | null;
    estimatedGuestCount: number | null;
  };
  agreement: {
    id: string;
    title: string;
    version: string;
    status: "DRAFT" | "SENT" | "SIGNED" | "EXPIRED" | "CANCELLED";
    totalAmountPaise: string;
    documentUrl: string | null;
    documentHash: string | null;
    termsSummary: string | null;
    sentAt: string | null;
    signedAt: string | null;
    signerName: string | null;
    signatureEvidence: string | null;
  } | null;
  financials: {
    totalContractPaise: string;
    totalPaidPaise: string;
    remainingPaise: string;
    milestones: Array<{
      id: string;
      title: string;
      percentage: string | null;
      amountPaise: string;
      paidPaise: string;
      remainingPaise: string;
      dueAt: string;
      status: string;
      orderIndex: number;
    }>;
    transactions: Array<{
      id: string;
      milestoneId: string;
      amountPaise: string;
      paidAt: string;
      paymentMethod: string;
      reference: string;
      receiptUrl: string | null;
    }>;
  };
  itinerary: Array<{
    id: string;
    name: string;
    eventType: string;
    startsAt: string | null;
    endsAt: string | null;
    venue: string | null;
  }>;
  guestStats: {
    totalInvited: number;
    confirmedAttending: number;
    declined: number;
    pending: number;
  };
}

export default function ClientPortalPage() {
  const [weddings, setWeddings] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("");
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Signing dialog
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // 1. Load available weddings
  const loadWeddings = useCallback(async () => {
    try {
      const res = await fetch("/api/weddings");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setWeddings(json.data);
        if (!selectedWeddingId) {
          setSelectedWeddingId(json.data[0].id);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load weddings:", err);
      setErrorNotice("Could not load weddings list");
    }
  }, [selectedWeddingId]);

  useEffect(() => {
    loadWeddings();
  }, [loadWeddings]);

  // 2. Load portal data
  const loadPortalData = useCallback(async (weddingId: string) => {
    if (!weddingId) return;
    setIsRefreshing(true);
    setErrorNotice(null);

    try {
      const res = await fetch(`/api/portal/${weddingId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load client portal data");
      }
      setPortalData(json.data);
      if (json.data.wedding) {
        setSignerName(json.data.wedding.coupleName || "");
      }
    } catch (err: unknown) {
      console.error("Failed to load portal data:", err);
      setErrorNotice((err as Error).message || "Error loading client portal");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWeddingId) {
      loadPortalData(selectedWeddingId);
    }
  }, [selectedWeddingId, loadPortalData]);

  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData?.agreement) return;

    setIsSigning(true);
    try {
      const res = await fetch(`/api/portal/agreement/${portalData.agreement.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName,
          signerEmail,
          termsAccepted: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to electronically sign agreement");
      }

      setIsSignOpen(false);
      loadPortalData(selectedWeddingId);
    } catch (err: unknown) {
      alert((err as Error).message || "Signing failed");
    } finally {
      setIsSigning(false);
    }
  };

  const wedding = portalData?.wedding;
  const agreement = portalData?.agreement;
  const financials = portalData?.financials;
  const itinerary = portalData?.itinerary || [];
  const guestStats = portalData?.guestStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Portal & Agreements"
        description="Private couple experience: Master agreement signing, milestone payment ledger, ceremony itinerary, and live RSVP counters"
      >
        <div className="flex items-center gap-3">
          {weddings.length > 0 && (
            <div className="relative">
              <select
                value={selectedWeddingId}
                onChange={(e) => setSelectedWeddingId(e.target.value)}
                className="text-xs bg-white border border-sand-300 rounded-lg py-2 pl-3 pr-8 font-medium text-charcoal focus:ring-1 focus:ring-gold-500 shadow-sm"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPortalData(selectedWeddingId)}
            disabled={isRefreshing}
            className="gap-1.5 text-xs text-charcoal-700 hover:text-charcoal border-sand-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {errorNotice && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Luxury Couple Hero Banner */}
      {wedding && (
        <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 text-ivory rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold-300 border border-gold/30 text-[11px] font-medium tracking-wide">
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span>Private Couple Concierge</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ivory">
                {wedding.coupleName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-ivory/70 pt-1">
                <span>{wedding.venue}, {wedding.city}</span>
                <span>•</span>
                {wedding.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    {new Date(wedding.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span>•</span>
                <span className="font-medium text-gold-300">
                  {wedding.packageType?.replace("_", " ")} Package
                </span>
              </div>
            </div>

            {/* Quick RSVP Snapshot */}
            {guestStats && (
              <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/15 text-center min-w-[200px]">
                <div className="text-[10px] uppercase font-serif tracking-widest text-gold-300 font-semibold">
                  Live Guest RSVPs
                </div>
                <div className="text-2xl font-serif font-bold text-ivory mt-0.5">
                  {guestStats.confirmedAttending} <span className="text-sm font-normal text-ivory/60">/ {guestStats.totalInvited}</span>
                </div>
                <div className="text-[11px] text-ivory/70 mt-0.5">
                  Confirmed Attending
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client Portal Tabs */}
      <Tabs defaultValue="agreement" className="space-y-6">
        <TabsList className="bg-sand-100/60 p-1 border border-sand-200 rounded-xl">
          <TabsTrigger
            value="agreement"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-gold-600" />
            Master Agreement
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-charcoal-600" />
            Payment Ledger & Receipts
          </TabsTrigger>
          <TabsTrigger
            value="itinerary"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-charcoal-600" />
            Ceremonies ({itinerary.length})
          </TabsTrigger>
          <TabsTrigger
            value="bills-upi"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            Bills & Virtual UPI
          </TabsTrigger>
          <TabsTrigger
            value="guests"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-charcoal-600" />
            Guest RSVP Registry
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Master Agreement */}
        <TabsContent value="agreement" className="space-y-6">
          <div className="bg-white rounded-xl border border-sand-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sand-100 pb-5">
              <div>
                <span className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                  Legal Contract
                </span>
                <h3 className="font-serif text-lg text-charcoal-900 font-bold mt-0.5">
                  {agreement?.title || "Master Wedding Planning & Management Agreement"}
                </h3>
                <div className="flex items-center gap-3 text-xs text-charcoal-500 mt-1">
                  <span>Version {agreement?.version || "1.0"}</span>
                  <span>•</span>
                  <span>
                    Contract Consideration:{" "}
                    <strong className="text-charcoal-900">
                      {formatINR(BigInt(agreement?.totalAmountPaise || "0"))}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                {agreement?.status === "SIGNED" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline-block" />
                    Electronically Signed
                  </Badge>
                ) : (
                  <Button
                    onClick={() => setIsSignOpen(true)}
                    size="sm"
                    className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 shadow-sm text-xs"
                  >
                    <FileCheck2 className="w-4 h-4 text-gold-400" />
                    Review & Sign Agreement
                  </Button>
                )}
              </div>
            </div>

            {/* Signed Evidence Audit Box */}
            {agreement?.status === "SIGNED" && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Signature Verified & Tamper-Evident</span>
                </div>
                <div className="text-emerald-800 leading-relaxed font-mono text-[11px]">
                  {agreement.signatureEvidence}
                </div>
                {agreement.documentHash && (
                  <div className="text-[10px] text-emerald-700/80 font-mono truncate">
                    SHA-256 Integrity Hash: {agreement.documentHash}
                  </div>
                )}
              </div>
            )}

            {/* Terms Summary */}
            <div className="space-y-3">
              <h4 className="font-serif text-sm font-semibold text-charcoal-900">
                Summary of Agreed Scope & Terms
              </h4>
              <div className="bg-sand-50/70 p-4 rounded-xl border border-sand-200 text-xs text-charcoal-700 space-y-2 leading-relaxed">
                <p>
                  1. <strong>Full Destination Management:</strong> Agency shall supervise and coordinate all vendors, logistics, palace permissions, and catering operations across Udaipur for the Sharma Royal Wedding.
                </p>
                <p>
                  2. <strong>Payment Milestones:</strong> Contract fees are payable in structured milestone tranches (20% Engagement Deposit, 30% Retainers, 30% Production Advance, 20% Final Settlement).
                </p>
                <p>
                  3. <strong>Scope Expansion & Extras:</strong> Any client-approved variations (such as additional guest covers or extended curfews) are cataloged transparently in the client balance sheet.
                </p>
                <p>
                  4. <strong>Audit & Reconciliation:</strong> Gathbandhan maintains dual-ledger audit logs ensuring zero duplicate vendor disbursements and total escrow transparency.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Payment Schedule & Receipts */}
        <TabsContent value="payments" className="space-y-6">
          {financials && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Total Contract Value
                  </div>
                  <div className="text-xl font-medium text-charcoal-900 mt-1">
                    {formatINR(BigInt(financials.totalContractPaise || "0"))}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Structured milestone agreement
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Total Received to Date
                  </div>
                  <div className="text-xl font-medium text-emerald-800 mt-1">
                    {formatINR(BigInt(financials.totalPaidPaise || "0"))}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Verified through corporate banking
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Remaining Balance Due
                  </div>
                  <div className="text-xl font-medium text-amber-800 mt-1">
                    {formatINR(BigInt(financials.remainingPaise || "0"))}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Payable per milestone schedule
                  </div>
                </div>
              </div>

              {/* Milestones Schedule Table */}
              <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-sand-100 bg-sand-50/50">
                  <h4 className="font-serif text-sm font-semibold text-charcoal-900">
                    Milestone Schedule
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-sand-200 bg-sand-50/30 text-[11px] text-charcoal-500 font-serif uppercase tracking-wider">
                        <th className="py-3 px-4">Milestone Stage</th>
                        <th className="py-3 px-4 text-right">Tranche Amount</th>
                        <th className="py-3 px-4 text-right">Cleared Amount</th>
                        <th className="py-3 px-4 text-right">Balance Due</th>
                        <th className="py-3 px-4 text-center">Due Date</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {financials.milestones.map((m) => (
                        <tr key={m.id} className="hover:bg-sand-50/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-charcoal-900">
                            {m.title}
                            {m.percentage && (
                              <span className="text-[11px] text-charcoal-500 ml-1">
                                ({parseFloat(m.percentage).toFixed(0)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-charcoal-900 font-medium">
                            {formatINR(BigInt(m.amountPaise))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-800">
                            {formatINR(BigInt(m.paidPaise))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-800">
                            {formatINR(BigInt(m.remainingPaise))}
                          </td>
                          <td className="py-3 px-4 text-center text-charcoal-600">
                            {new Date(m.dueAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {m.status === "PAID" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                                Paid
                              </Badge>
                            ) : m.status === "PARTIALLY_PAID" ? (
                              <Badge className="bg-blue-100 text-blue-800 text-[10px]">
                                Partially Paid
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                Scheduled
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verified Receipts List */}
              <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-sand-100 bg-sand-50/50 flex justify-between items-center">
                  <h4 className="font-serif text-sm font-semibold text-charcoal-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gold-600" />
                    Verified Payment Receipts & UTRs
                  </h4>
                  <span className="text-xs text-charcoal-500">
                    {financials.transactions.length} receipts issued
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-sand-200 bg-sand-50/30 text-[11px] text-charcoal-500 font-serif uppercase tracking-wider">
                        <th className="py-3 px-4">Receipt Date</th>
                        <th className="py-3 px-4">Bank UTR / Transaction Ref</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4 text-right">Amount Cleared</th>
                        <th className="py-3 px-4 text-right">Receipt Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {financials.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-sand-50/40 transition-colors">
                          <td className="py-3 px-4 text-charcoal-700">
                            {new Date(tx.paidAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-charcoal-900">
                            {tx.reference}
                          </td>
                          <td className="py-3 px-4 text-charcoal-600">
                            <Badge variant="outline" className="text-[10px]">
                              {tx.paymentMethod}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-emerald-800">
                            {formatINR(BigInt(tx.amountPaise))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tx.receiptUrl ? (
                              <a
                                href={tx.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-gold-700 hover:text-gold-900 hover:underline gap-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                              </a>
                            ) : (
                              <span className="text-charcoal-400 italic">E-Receipt Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Ceremonies & Itinerary */}
        <TabsContent value="itinerary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itinerary.map((ev) => (
              <div
                key={ev.id}
                className="bg-white p-5 rounded-xl border border-sand-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif text-base font-semibold text-charcoal-900">
                      {ev.name}
                    </h4>
                    <span className="text-xs text-gold-800 font-medium">
                      {ev.eventType}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[11px] bg-sand-50">
                    Confirmed
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-charcoal-600 pt-1 border-t border-sand-100">
                  {ev.startsAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>
                        {new Date(ev.startsAt).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {ev.venue && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                      <span>{ev.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 4: Live Guest Registry Counters */}
        <TabsContent value="guests" className="space-y-6">
          {guestStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm text-center">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Total Invited
                  </div>
                  <div className="text-2xl font-serif font-bold text-charcoal-900 mt-1">
                    {guestStats.totalInvited}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Across all family delegations
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm text-center">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Attending Headcount
                  </div>
                  <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
                    {guestStats.confirmedAttending}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Confirmed with meal choices
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm text-center">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Regretfully Declined
                  </div>
                  <div className="text-2xl font-serif font-bold text-rose-800 mt-1">
                    {guestStats.declined}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Unable to travel to Udaipur
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm text-center">
                  <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
                    Awaiting Response
                  </div>
                  <div className="text-2xl font-serif font-bold text-amber-800 mt-1">
                    {guestStats.pending}
                  </div>
                  <div className="text-xs text-charcoal-500 mt-0.5">
                    Follow-ups managed by concierge
                  </div>
                </div>
              </div>

              <div className="bg-sand-50/70 p-5 rounded-xl border border-sand-200 text-xs text-charcoal-600 leading-relaxed text-center">
                To manage specific guest invitations, meal adjustments, room blocks, and airport chauffeur assignments, visit the{" "}
                <a href="/guests" className="text-gold-800 font-semibold hover:underline">
                  Guests & Logistics Workspace
                </a>.
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Bills & Virtual UPI */}
        <TabsContent value="bills-upi" className="space-y-6">
          <ClientBillsUpiView weddingId={selectedWeddingId} />
        </TabsContent>
      </Tabs>

      {/* Review & Electronically Sign Dialog */}
      <Dialog open={isSignOpen} onOpenChange={setIsSignOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-charcoal-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-gold-600" />
              Sign Master Planning Agreement
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-500">
              Electronic acceptance of wedding planning scope and financial milestone schedule.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignAgreement} className="space-y-4 pt-2">
            <div className="bg-sand-50 p-3 rounded-lg border border-sand-200 text-xs text-charcoal-700 leading-relaxed">
              By typing your name and submitting, you confirm authorization to execute this agreement for the <strong>{wedding?.title}</strong> and accept the terms and payment schedule.
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Signer Legal Name *
              </label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Signer Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="aarav.sharma@email.com"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-start space-x-2 pt-1">
              <input
                type="checkbox"
                id="termsAccepted"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 mt-0.5"
              />
              <label htmlFor="termsAccepted" className="text-xs text-charcoal-700 leading-normal">
                I hereby accept and approve this Master Agreement and authorize Gathbandhan to proceed with wedding management services.
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSignOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSigning || !termsAccepted}
                className="bg-charcoal text-ivory hover:bg-charcoal-800"
              >
                {isSigning ? "Recording Signature..." : "Electronically Sign & Accept"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
