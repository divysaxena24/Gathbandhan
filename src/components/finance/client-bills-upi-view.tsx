"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Download,
  Building2,
  RefreshCw,
  XCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitRatePaise: string;
  totalPaise: string;
}

interface BillInstallment {
  id: string;
  title: string;
  percentage: string;
  amountPaise: string;
  paidPaise: string;
  remainingPaise: string;
  dueAt: string;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  orderIndex: number;
}

interface ClientBill {
  id: string;
  weddingId: string;
  weddingTitle?: string;
  clientId: string;
  clientName?: string;
  billNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  subtotalPaise: string;
  taxPaise: string;
  totalPaise: string;
  paidPaise: string;
  outstandingPaise: string;
  advancePercentage: string;
  advanceAmountPaise: string;
  remainingBalancePaise: string;
  balanceDueAt: string | null;
  status: "DRAFT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "DECLINED" | "DUE" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  publishedAt: string | null;
  items?: BillItem[];
  installments?: BillInstallment[];
}

interface PaymentSessionData {
  id: string;
  sessionToken: string;
  billId: string;
  billNumber: string;
  billTitle: string;
  coupleName: string;
  paymentType: "INSTALLMENT" | "FULL_BALANCE";
  installmentTitle?: string;
  amountPaise: string;
  qrPayload: string;
  qrDataUrl: string;
}

export function ClientBillsUpiView({ weddingId }: { weddingId?: string }) {
  const [bills, setBills] = useState<ClientBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Expanded items state
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // Active Payment QR Modal
  const [activeSession, setActiveSession] = useState<PaymentSessionData | null>(null);
  const [generatingSession, setGeneratingSession] = useState(false);

  // Decline Dialog
  const [declineBillId, setDeclineBillId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  const loadBills = useCallback(async () => {
    try {
      setRefreshing(true);
      const url = weddingId
        ? `/api/client/bills?weddingId=${encodeURIComponent(weddingId)}`
        : "/api/client/bills";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setBills(json.data);
      }
    } catch (err: any) {
      console.error("Failed to load client bills:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weddingId]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // Handle Accept Bill
  const handleAcceptBill = async (billId: string) => {
    try {
      setActionError(null);
      const res = await fetch(`/api/client/bills/${billId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to accept bill");
      }
      await loadBills();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle Decline Bill
  const handleDeclineBill = async () => {
    if (!declineBillId) return;
    try {
      setIsSubmittingDecline(true);
      setActionError(null);
      const res = await fetch(`/api/client/bills/${declineBillId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECLINE",
          reason: declineReason.trim() || "Requested revision by client",
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to decline bill");
      }
      setDeclineBillId(null);
      setDeclineReason("");
      await loadBills();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  // Generate Virtual UPI QR code
  const handleOpenPaymentSession = async (
    billId: string,
    paymentType: "INSTALLMENT" | "FULL_BALANCE",
    installmentId?: string
  ) => {
    try {
      setGeneratingSession(true);
      setActionError(null);
      const res = await fetch("/api/payments/vupi/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId,
          paymentType,
          installmentId,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to generate QR payment session");
      }
      setActiveSession(json.data);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setGeneratingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Disclaimer Banner */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Simulated Payment Sandbox — No Real Money Transferred
          </div>
          <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
            All UPI QR codes and checkout sessions below are virtual sandbox simulations for test and demonstration purposes. No real banking accounts, UPI handles, or financial networks will be charged.
          </p>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-maroon-deep flex items-center gap-2">
            Bills & Virtual UPI Payments
          </h2>
          <p className="text-xs text-warm-gray mt-0.5">
            Review event billing invoices, choose advance or full payment, and pay via simulated UPI.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadBills}
          disabled={refreshing}
          className="border-gold/30 text-maroon-deep hover:bg-gold/10 hover:text-maroon-deep text-xs h-8 rounded-xl font-medium"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Bills List */}
      {loading ? (
        <div className="py-16 text-center text-warm-gray space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full mx-auto" />
          <p className="text-xs">Loading billing schedules...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="border border-gold/25 rounded-3xl p-12 text-center bg-white shadow-xs">
          <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3 text-gold-700">
            <FileText className="h-6 w-6 text-gold-700" />
          </div>
          <h3 className="text-base font-bold font-heading text-maroon-deep">No Bills Published Yet</h3>
          <p className="text-xs text-warm-gray max-w-sm mx-auto mt-1 leading-relaxed">
            Your wedding planner has not yet published any billing invoices to your portal. Once published, you can accept and make payments here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const isAwaitingAcceptance = bill.status === "AWAITING_ACCEPTANCE";
            const isDue = bill.status === "DUE" || bill.status === "ACCEPTED";
            const isPartiallyPaid = bill.status === "PARTIALLY_PAID";
            const isPaid = bill.status === "PAID";
            const isDeclined = bill.status === "DECLINED";

            const advanceInst = bill.installments?.[0];
            const remainingInst = bill.installments?.[1];

            const isAdvancePaid =
              advanceInst &&
              (advanceInst.status === "PAID" ||
                BigInt(bill.paidPaise) >= BigInt(bill.advanceAmountPaise));

            const isExpanded = expandedBillId === bill.id;

            return (
              <div
                key={bill.id}
                className="bg-white border border-gold/25 rounded-3xl overflow-hidden shadow-xs transition-all"
              >
                {/* Bill Card Header */}
                <div className="p-5 border-b border-gold/15 bg-cream/40 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-gold-800 font-bold bg-gold/15 px-2 py-0.5 rounded-md">
                        {bill.billNumber}
                      </span>
                      {isAwaitingAcceptance && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold">
                          Awaiting Your Acceptance
                        </Badge>
                      )}
                      {isDue && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] font-semibold">
                          Accepted — Payment Due
                        </Badge>
                      )}
                      {isPartiallyPaid && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] font-semibold">
                          Partially Paid
                        </Badge>
                      )}
                      {isPaid && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                          Paid in Full
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-semibold">
                          Declined
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-heading font-bold text-maroon-deep mt-1">{bill.title}</h3>
                    <div className="text-xs text-warm-gray flex items-center gap-4 mt-0.5">
                      <span>Issued: {new Date(bill.issueDate).toLocaleDateString("en-IN")}</span>
                      <span>Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}</span>
                      {bill.balanceDueAt && (
                        <span>Balance Due: {new Date(bill.balanceDueAt).toLocaleDateString("en-IN")}</span>
                      )}
                    </div>
                  </div>

                  {/* Financial KPI Summary */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-warm-gray font-medium">
                        Total Bill
                      </div>
                      <div className="text-lg font-bold text-charcoal">
                        {formatINR(BigInt(bill.totalPaise))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-warm-gray font-medium">
                        Outstanding
                      </div>
                      <div className={`text-lg font-extrabold ${isPaid ? "text-emerald-700" : "text-maroon-deep"}`}>
                        {formatINR(BigInt(bill.outstandingPaise))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill Advance & Schedule Breakdown */}
                <div className="p-5 space-y-4">
                  {/* Advance Configuration Highlight */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-cream/50 border border-gold/20 rounded-2xl p-3.5">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-warm-gray font-medium">
                        Admin Advance Percentage
                      </div>
                      <div className="text-sm font-bold text-gold-800 mt-0.5">
                        {Number(bill.advancePercentage)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-warm-gray font-medium">
                        Calculated Advance Amount
                      </div>
                      <div className="text-sm font-bold text-charcoal mt-0.5">
                        {formatINR(BigInt(bill.advanceAmountPaise))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-warm-gray font-medium">
                        Remaining Balance
                      </div>
                      <div className="text-sm font-bold text-charcoal mt-0.5">
                        {formatINR(BigInt(bill.remainingBalancePaise))}
                      </div>
                    </div>
                  </div>

                  {/* Expand Items Toggle */}
                  {bill.items && bill.items.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                        className="text-xs text-maroon hover:text-maroon-deep flex items-center gap-1 font-semibold transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {isExpanded ? "Hide item breakdown" : `View ${bill.items.length} line items`}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 border border-gold/20 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-cream/70 text-warm-gray border-b border-gold/20">
                              <tr>
                                <th className="p-2.5 font-medium">Description</th>
                                <th className="p-2.5 font-medium text-center">Qty</th>
                                <th className="p-2.5 font-medium text-right">Rate</th>
                                <th className="p-2.5 font-medium text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gold/15 text-charcoal">
                              {bill.items.map((it) => (
                                <tr key={it.id} className="hover:bg-cream/30">
                                  <td className="p-2.5 font-medium">{it.description}</td>
                                  <td className="p-2.5 text-center text-warm-gray">{it.quantity}</td>
                                  <td className="p-2.5 text-right font-mono text-warm-gray">
                                    {formatINR(BigInt(it.unitRatePaise))}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-medium text-maroon-deep">
                                    {formatINR(BigInt(it.totalPaise))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTION SECTION */}
                  {isAwaitingAcceptance && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Bill Acceptance Required
                        </h4>
                        <p className="text-xs text-amber-800/90 mt-0.5">
                          Please accept the terms and payment schedule to unlock simulated Virtual UPI payments.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeclineBillId(bill.id)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs flex-1 sm:flex-none rounded-xl"
                        >
                          Decline Bill
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptBill(bill.id)}
                          className="bg-maroon hover:bg-maroon-deep text-white font-bold text-xs flex-1 sm:flex-none rounded-xl shadow-xs"
                        >
                          Accept Bill
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* PAYMENT CHOICE SECTION (FOR ACCEPTED / DUE / PARTIALLY PAID BILLS) */}
                  {(isDue || isPartiallyPaid) && BigInt(bill.outstandingPaise) > 0n && (
                    <div className="pt-2 border-t border-gold/15 space-y-3">
                      <div className="text-xs font-semibold text-maroon-deep">
                        Select Your Payment Choice:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* OPTION 1: PAY ADVANCE (If advance not yet paid) OR REMAINING BALANCE */}
                        {!isAdvancePaid && advanceInst && BigInt(bill.advanceAmountPaise) > 0n ? (
                          <div className="bg-white border border-gold/30 hover:border-gold rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-colors">
                            <div>
                              <div className="flex items-center justify-between">
                                <Badge className="bg-gold/15 text-gold-800 border-gold/30 text-[10px]">
                                  Option 1: Pay Advance
                                </Badge>
                                <span className="text-[11px] text-warm-gray font-medium">
                                  {bill.advancePercentage}%
                                </span>
                              </div>
                              <div className="text-lg font-bold text-maroon-deep mt-2">
                                {formatINR(BigInt(bill.advanceAmountPaise))}
                              </div>
                              <p className="text-[11px] text-warm-gray mt-1">
                                Exact advance configured by planner. Unlocks remaining milestones.
                              </p>
                            </div>

                            <Button
                              onClick={() =>
                                handleOpenPaymentSession(bill.id, "INSTALLMENT", advanceInst.id)
                              }
                              disabled={generatingSession}
                              className="mt-4 w-full bg-cream/70 hover:bg-gold/15 text-maroon-deep font-bold text-xs border border-gold/30 rounded-xl"
                            >
                              <QrCode className="h-3.5 w-3.5 mr-1.5 text-gold-700" />
                              Generate Advance QR
                            </Button>
                          </div>
                        ) : (
                          /* If advance is already paid, show Pay Remaining Balance */
                          <div className="bg-white border border-gold/30 hover:border-gold rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-colors">
                            <div>
                              <div className="flex items-center justify-between">
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                                  Advance Paid
                                </Badge>
                                <span className="text-[11px] text-warm-gray">Remaining</span>
                              </div>
                              <div className="text-lg font-bold text-maroon-deep mt-2">
                                {formatINR(BigInt(bill.outstandingPaise))}
                              </div>
                              <p className="text-[11px] text-warm-gray mt-1">
                                Settle the remaining unpaid balance in full.
                              </p>
                            </div>

                            <Button
                              onClick={() => handleOpenPaymentSession(bill.id, "FULL_BALANCE")}
                              disabled={generatingSession}
                              className="mt-4 w-full bg-cream/70 hover:bg-gold/15 text-maroon-deep font-bold text-xs border border-gold/30 rounded-xl"
                            >
                              <QrCode className="h-3.5 w-3.5 mr-1.5 text-gold-700" />
                              Pay Remaining Balance
                            </Button>
                          </div>
                        )}

                        {/* OPTION 2: PAY FULL AMOUNT IN ONE GO */}
                        <div className="bg-gradient-to-br from-gold/15 via-white to-white border border-gold/50 hover:border-gold rounded-2xl p-4 flex flex-col justify-between shadow-xs transition-all">
                          <div>
                            <div className="flex items-center justify-between">
                              <Badge className="bg-maroon text-soft-white font-bold text-[10px]">
                                Option 2: Pay Full Amount
                              </Badge>
                              <span className="text-[11px] font-semibold text-gold-800">
                                100% Settle
                              </span>
                            </div>
                            <div className="text-lg font-bold text-maroon-deep mt-2">
                              {formatINR(BigInt(bill.outstandingPaise))}
                            </div>
                            <p className="text-[11px] text-warm-gray mt-1">
                              Pay the entire remaining balance in a single simulated transaction.
                            </p>
                          </div>

                          <Button
                            onClick={() => handleOpenPaymentSession(bill.id, "FULL_BALANCE")}
                            disabled={generatingSession}
                            className="mt-4 w-full bg-maroon hover:bg-maroon-deep text-white font-bold text-xs rounded-xl shadow-xs"
                          >
                            <QrCode className="h-3.5 w-3.5 mr-1.5 text-gold-light" />
                            Generate Full Payment QR
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PAID CONFIRMATION */}
                  {isPaid && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <div>
                          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                            Bill Fully Settled
                          </div>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Total amount of {formatINR(BigInt(bill.totalPaise))} was received via simulated UPI.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Virtual UPI Modal */}
      <Dialog open={!!activeSession} onOpenChange={(open) => !open && setActiveSession(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-gold/30 text-charcoal rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="text-[10px] uppercase tracking-wider text-gold-700 font-bold">
              Gathbandhan Virtual Payment QR
            </div>
            <DialogTitle className="text-lg font-heading font-bold text-maroon-deep">
              Scan or Click to Pay
            </DialogTitle>
            <DialogDescription className="text-xs text-warm-gray">
              {activeSession?.paymentType === "FULL_BALANCE"
                ? "Full Balance Settlement"
                : activeSession?.installmentTitle || "Advance Payment"}
            </DialogDescription>
          </DialogHeader>

          {activeSession && (
            <div className="space-y-4 py-2">
              {/* Simulation Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Simulated Payment — No Real Money Transferred
                </div>
              </div>

              {/* QR Image Box */}
              <div className="bg-white p-4 rounded-2xl w-64 h-64 mx-auto flex items-center justify-center border border-gold/25 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSession.qrDataUrl}
                  alt="Virtual UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Amount Display */}
              <div className="text-center">
                <div className="text-xs text-warm-gray">Total Payable Amount</div>
                <div className="text-2xl font-black text-maroon-deep mt-0.5">
                  {formatINR(BigInt(activeSession.amountPaise))}
                </div>
                <div className="text-[11px] text-warm-gray mt-1">
                  Bill {activeSession.billNumber} • {activeSession.coupleName}
                </div>
              </div>

              {/* Interactive Actions */}
              <div className="space-y-2 pt-2">
                <a
                  href={`/pay/vupi/${activeSession.sessionToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-maroon hover:bg-maroon-deep text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <span>Open Simulated Mobile UPI Checkout</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveSession(null);
                    loadBills();
                  }}
                  className="w-full border-gold/30 text-warm-gray hover:text-maroon-deep hover:bg-gold/10 text-xs rounded-xl"
                >
                  Done / Refresh Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Bill Modal */}
      <Dialog open={!!declineBillId} onOpenChange={(open) => !open && setDeclineBillId(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-gold/30 text-charcoal rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold text-maroon-deep">Decline Bill</DialogTitle>
            <DialogDescription className="text-xs text-warm-gray">
              Please specify why you are declining this bill so the planner can revise it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Please revise advance percentage to 15% as agreed in our meeting."
              rows={3}
              className="w-full rounded-xl bg-cream/40 border border-gold/30 p-2.5 text-xs text-charcoal placeholder:text-warm-gray focus:outline-none focus:ring-1 focus:ring-gold"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeclineBillId(null)}
                className="border-gold/30 text-warm-gray text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeclineBill}
                disabled={isSubmittingDecline}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
              >
                {isSubmittingDecline ? "Submitting..." : "Confirm Decline"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
