"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Download,
  IndianRupee,
  RefreshCw,
  Percent,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  id?: string;
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
  status: string;
  orderIndex: number;
}

interface ClientBillRecord {
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

export function AdminBillsManagementView({ weddingId }: { weddingId?: string }) {
  const [bills, setBills] = useState<ClientBillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("Full Wedding Planning & Execution Package");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [balanceDueAt, setBalanceDueAt] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [totalAmountINR, setTotalAmountINR] = useState("500000");
  const [advancePercentage, setAdvancePercentage] = useState("20");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded bill details
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // 1. Live Calculations Preview
  const liveCalculations = useMemo(() => {
    const totalINR = parseFloat(totalAmountINR) || 0;
    const pct = parseFloat(advancePercentage) || 0;

    const totalPaise = BigInt(Math.max(0, Math.round(totalINR * 100)));
    const validPct = Math.min(100, Math.max(0, pct));

    const advanceAmountPaise = BigInt(
      Math.round((Number(totalPaise) * validPct) / 100)
    );
    const remainingBalancePaise =
      totalPaise > advanceAmountPaise ? totalPaise - advanceAmountPaise : 0n;

    return {
      totalPaise,
      validPct,
      advanceAmountPaise,
      remainingBalancePaise,
      isValid: totalINR > 0 && pct >= 0 && pct <= 100,
    };
  }, [totalAmountINR, advancePercentage]);

  // Load Bills
  const loadBills = useCallback(async () => {
    try {
      setRefreshing(true);
      const url = weddingId
        ? `/api/finance/bills?weddingId=${encodeURIComponent(weddingId)}`
        : "/api/finance/bills";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setBills(json.data);
      }
    } catch (err: any) {
      console.error("Failed to load bills:", err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weddingId]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // Handle Publish Bill
  const handlePublish = async (billId: string) => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/finance/bills/${billId}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to publish bill");
      }
      await loadBills();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (bill: ClientBillRecord) => {
    if (BigInt(bill.paidPaise) > 0n) {
      setErrorMessage("Cannot modify bill: Payments have already been recorded on this bill.");
      return;
    }
    setEditingBillId(bill.id);
    setTitle(bill.title);
    setIssueDate(bill.issueDate);
    setDueDate(bill.dueDate);
    setBalanceDueAt(bill.balanceDueAt || bill.dueDate);
    setTotalAmountINR((Number(bill.totalPaise) / 100).toString());
    setAdvancePercentage(Number(bill.advancePercentage).toString());
    setIsModalOpen(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBillId(null);
    setTitle("Full Wedding Planning & Execution Package");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setBalanceDueAt(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setTotalAmountINR("500000");
    setAdvancePercentage("20");
    setNotes("");
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveCalculations.isValid) {
      setErrorMessage("Please enter a valid total amount and percentage between 0 and 100%");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (editingBillId) {
        // Edit Bill
        const res = await fetch(`/api/finance/bills/${editingBillId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            issueDate,
            dueDate,
            balanceDueAt,
            totalPaise: liveCalculations.totalPaise.toString(),
            advancePercentage: liveCalculations.validPct,
            notes: notes.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error?.message || "Failed to update bill");
        }
      } else {
        // Create Bill
        // Fetch client ID from wedding
        let clientIdToUse: string | null = null;
        if (weddingId) {
          const weddingRes = await fetch(`/api/weddings/${weddingId}`);
          const weddingJson = await weddingRes.json();
          clientIdToUse = weddingJson.data?.clientId;
        }

        if (!clientIdToUse && bills.length > 0) {
          clientIdToUse = bills[0].clientId;
        }

        if (!clientIdToUse) {
          // Fetch first client as fallback
          const clientsRes = await fetch("/api/clients");
          const clientsJson = await clientsRes.json();
          if (clientsJson.data && clientsJson.data.length > 0) {
            clientIdToUse = clientsJson.data[0].id;
          }
        }

        if (!clientIdToUse || !weddingId) {
          throw new Error("Wedding ID and Client ID are required to create a bill.");
        }

        const res = await fetch("/api/finance/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId,
            clientId: clientIdToUse,
            title: title.trim(),
            issueDate,
            dueDate,
            balanceDueAt,
            totalPaise: liveCalculations.totalPaise.toString(),
            advancePercentage: liveCalculations.validPct,
            notes: notes.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error?.message || "Failed to create bill");
        }
      }

      setIsModalOpen(false);
      await loadBills();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial KPI totals
  const totalBilledPaise = bills.reduce(
    (acc, b) => acc + BigInt(b.totalPaise || 0),
    0n
  );
  const totalCollectedPaise = bills.reduce(
    (acc, b) => acc + BigInt(b.paidPaise || 0),
    0n
  );
  const totalOutstandingPaise = bills.reduce(
    (acc, b) => acc + BigInt(b.outstandingPaise || 0),
    0n
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-300">
        <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          <strong>SIMULATED PAYMENT ENVIRONMENT:</strong> All invoices and payments generated here operate on Gathbandhan&apos;s virtual UPI ledger.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Total Billed
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {formatINR(totalBilledPaise)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Across {bills.length} client invoice(s)
          </div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Virtually Collected
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatINR(totalCollectedPaise)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {totalBilledPaise > 0n
              ? `${((Number(totalCollectedPaise) / Number(totalBilledPaise)) * 100).toFixed(1)}% recovery`
              : "0% recovery"}
          </div>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Outstanding Balance
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {formatINR(totalOutstandingPaise)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Due for collection</div>
        </div>
      </div>

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-100">
            Client Billing & Payment Schedules
          </h3>
          <p className="text-xs text-stone-400">
            Configure advance payment percentages, due dates, and publish to the Client Portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBills}
            disabled={refreshing}
            className="border-stone-800 text-stone-300 hover:bg-stone-900 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Client Bill
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bills Table */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs">Loading bills...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="border border-stone-800 rounded-xl p-12 text-center bg-stone-950/40">
          <FileText className="h-10 w-10 text-stone-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-stone-300">No Bills Created Yet</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Create a bill with total amount and advance percentage to initiate the client payment workflow.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const isDraft = bill.status === "DRAFT";
            const isAwaiting = bill.status === "AWAITING_ACCEPTANCE";
            const isDue = bill.status === "DUE" || bill.status === "ACCEPTED";
            const isPartiallyPaid = bill.status === "PARTIALLY_PAID";
            const isPaid = bill.status === "PAID";
            const isDeclined = bill.status === "DECLINED";

            const canEdit = BigInt(bill.paidPaise) === 0n;
            const isExpanded = expandedBillId === bill.id;

            return (
              <div
                key={bill.id}
                className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-colors"
              >
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        {bill.billNumber}
                      </span>
                      {isDraft && <Badge variant="outline" className="text-[10px] border-stone-700 text-stone-400">Draft</Badge>}
                      {isAwaiting && <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">Awaiting Acceptance</Badge>}
                      {isDue && <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px]">Accepted • Payment Due</Badge>}
                      {isPartiallyPaid && <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px]">Partially Paid</Badge>}
                      {isPaid && <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">Paid in Full</Badge>}
                      {isDeclined && <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 text-[10px]">Declined</Badge>}
                    </div>
                    <h4 className="text-sm font-bold text-white">{bill.title}</h4>
                    <div className="text-xs text-stone-400 flex items-center gap-3">
                      <span>Couple: {bill.clientName || "Client"}</span>
                      <span>•</span>
                      <span>Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}</span>
                      {bill.balanceDueAt && (
                        <>
                          <span>•</span>
                          <span>Balance Due: {new Date(bill.balanceDueAt).toLocaleDateString("en-IN")}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-[10px] text-stone-400 uppercase">Total Bill</div>
                      <div className="text-sm font-bold text-white">
                        {formatINR(BigInt(bill.totalPaise))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-400 uppercase">
                        Advance ({Number(bill.advancePercentage)}%)
                      </div>
                      <div className="text-sm font-bold text-amber-400">
                        {formatINR(BigInt(bill.advanceAmountPaise))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-400 uppercase">Remaining</div>
                      <div className="text-sm font-bold text-stone-300">
                        {formatINR(BigInt(bill.remainingBalancePaise))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
                      {isDraft && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(bill.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs h-8"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Publish
                        </Button>
                      )}

                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(bill)}
                          className="border-stone-800 text-stone-300 hover:bg-stone-900 text-xs h-8"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                        className="text-stone-400 hover:text-stone-200 text-xs h-8 px-2"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-stone-900/50 border-t border-stone-800 space-y-3 text-xs">
                    {/* Decline Reason if any */}
                    {isDeclined && bill.declineReason && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg">
                        <strong>Client Decline Reason:</strong> {bill.declineReason}
                      </div>
                    )}

                    {/* Installments Table */}
                    {bill.installments && bill.installments.length > 0 && (
                      <div className="border border-stone-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-stone-900 text-stone-400 border-b border-stone-800 text-[11px]">
                            <tr>
                              <th className="p-2 font-medium">Milestone</th>
                              <th className="p-2 font-medium text-center">%</th>
                              <th className="p-2 font-medium text-right">Amount</th>
                              <th className="p-2 font-medium text-right">Paid</th>
                              <th className="p-2 font-medium text-center">Due Date</th>
                              <th className="p-2 font-medium text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-800 text-stone-300">
                            {bill.installments.map((inst) => (
                              <tr key={inst.id}>
                                <td className="p-2 font-medium">{inst.title}</td>
                                <td className="p-2 text-center text-stone-400">{inst.percentage}%</td>
                                <td className="p-2 text-right font-mono text-stone-200">
                                  {formatINR(BigInt(inst.amountPaise))}
                                </td>
                                <td className="p-2 text-right font-mono text-emerald-400">
                                  {formatINR(BigInt(inst.paidPaise))}
                                </td>
                                <td className="p-2 text-center text-stone-400">
                                  {new Date(inst.dueAt).toLocaleDateString("en-IN")}
                                </td>
                                <td className="p-2 text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${
                                      inst.status === "PAID"
                                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                                        : "border-stone-700 text-stone-400"
                                    }`}
                                  >
                                    {inst.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Bill Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl bg-stone-950 border-stone-800 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingBillId ? "Edit Client Bill" : "Create New Client Bill"}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              Enter total bill amount and advance percentage. Advance and remaining balance are automatically calculated immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBill} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Bill Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Full Wedding Planning & Execution Package"
                className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                required
              />
            </div>

            {/* Total Amount & Advance Percentage Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Total Bill Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 text-xs font-bold">₹</span>
                  <Input
                    type="number"
                    value={totalAmountINR}
                    onChange={(e) => setTotalAmountINR(e.target.value)}
                    placeholder="500000"
                    min="1"
                    className="bg-stone-900 border-stone-800 text-stone-200 text-xs pl-7"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Advance Payment Percentage (0–100%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(e.target.value)}
                    placeholder="20"
                    min="0"
                    max="100"
                    step="0.01"
                    className="bg-stone-900 border-stone-800 text-stone-200 text-xs pr-7"
                    required
                  />
                  <span className="absolute right-3 top-2 text-stone-500 text-xs font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Slider for Advance Percentage */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={liveCalculations.validPct}
                onChange={(e) => setAdvancePercentage(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                <span>0% (No Advance)</span>
                <span>20% (Recommended)</span>
                <span>50%</span>
                <span>100% (Full Advance)</span>
              </div>
            </div>

            {/* AUTOMATIC LIVE CALCULATION PREVIEW BOX */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center justify-between">
                <span>Automatic Calculation Preview</span>
                <span className="text-[9px] font-normal text-stone-400">Server validated</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400">Total Bill</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {formatINR(liveCalculations.totalPaise)}
                  </div>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-amber-500/30">
                  <div className="text-[10px] text-amber-400">
                    Advance ({liveCalculations.validPct}%)
                  </div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {formatINR(liveCalculations.advanceAmountPaise)}
                  </div>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400">
                    Remaining Balance ({Number((100 - liveCalculations.validPct).toFixed(2))}%)
                  </div>
                  <div className="text-sm font-bold text-stone-200 mt-0.5">
                    {formatINR(liveCalculations.remainingBalancePaise)}
                  </div>
                </div>
              </div>
            </div>

            {/* Due Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Issue Date
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Advance Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Balance Due Date
                </label>
                <Input
                  type="date"
                  value={balanceDueAt}
                  onChange={(e) => setBalanceDueAt(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Notes / Terms Summary
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include custom terms or scope notes..."
                rows={2}
                className="w-full rounded-lg bg-stone-900 border border-stone-800 p-2.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="border-stone-800 text-stone-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !liveCalculations.isValid}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
              >
                {isSubmitting ? "Saving..." : editingBillId ? "Update Bill" : "Save as Draft"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
