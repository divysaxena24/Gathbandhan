"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Clock,
  Plus,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  RefreshCw,
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
import {
  ClientPaymentMilestoneRecord,
  ClientPaymentTransactionRecord,
  MilestoneStatus,
} from "@/modules/finance/types";
import { formatINR } from "@/lib/money";

interface ClientMilestonesViewProps {
  milestones: ClientPaymentMilestoneRecord[];
  transactions: ClientPaymentTransactionRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function ClientMilestonesView({
  milestones,
  transactions,
  weddingId,
  onRefresh,
}: ClientMilestonesViewProps) {
  const [selectedMilestone, setSelectedMilestone] =
    useState<ClientPaymentMilestoneRecord | null>(null);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);

  // Form states
  const [amountRupees, setAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("RTGS");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(
    `client_pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [allowBusinessDuplicate, setAllowBusinessDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const getStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-status-success/15 text-status-success border-status-success/30 font-medium">
            Paid in Full
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge className="bg-blue-600/15 text-blue-800 border-blue-300 font-medium">
            Partially Paid
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-status-critical/15 text-status-critical border-status-critical/30 font-semibold animate-pulse">
            Overdue
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-sand/30 text-charcoal/70 border-sand font-normal">
            Pending Due
          </Badge>
        );
    }
  };

  const handleOpenRecordPayment = (m: ClientPaymentMilestoneRecord) => {
    setSelectedMilestone(m);
    setAmountRupees(
      m.remainingPaise > 0n
        ? (Number(m.remainingPaise) / 100).toString()
        : (Number(m.amountPaise) / 100).toString()
    );
    setIdempotencyKey(
      `client_pay_${m.id.substring(0, 8)}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 6)}`
    );
    setErrorNotice(null);
    setIsRecordOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !amountRupees || !reference) return;

    setIsSubmitting(true);
    setErrorNotice(null);
    try {
      const parsedRupees = parseFloat(amountRupees) || 0;
      const amountPaise = BigInt(Math.round(parsedRupees * 100));

      const res = await fetch("/api/finance/payments/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: selectedMilestone.id,
          amountPaise: amountPaise.toString(),
          paidAt: new Date().toISOString(),
          paymentMethod,
          reference,
          idempotencyKey,
          allowBusinessDuplicate,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsRecordOpen(false);
        setReference("");
        setNotes("");
        onRefresh();
      } else {
        setErrorNotice(
          json.error?.message ||
            "Failed to record payment. Check duplicate transaction warning."
        );
      }
    } catch {
      setErrorNotice("Network error while recording client payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Milestone Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-sand/40">
        <div>
          <h3 className="font-serif font-bold text-lg text-charcoal">
            Client Milestone Billing Schedule
          </h3>
          <p className="text-xs text-charcoal/60">
            Booking deposit, pre-production advances, and final balance settlement.
          </p>
        </div>

        <Button
          size="sm"
          className="bg-gold text-white hover:bg-gold-dark text-xs gap-1.5"
          onClick={() => setIsCreateMilestoneOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Milestone</span>
        </Button>
      </div>

      {/* Milestones Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {milestones.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-gold">
                  {m.percentage ? `${m.percentage}%` : "Milestone"}
                </span>
                {getStatusBadge(m.status)}
              </div>

              <h4 className="font-serif font-bold text-base text-charcoal">
                {m.title}
              </h4>

              <div className="text-xs text-charcoal/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>Due Date: {m.dueAt}</span>
              </div>

              <div className="pt-2 border-t border-sand/20 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-charcoal/50">Amount:</span>
                  <span className="font-semibold text-charcoal">
                    {formatINR(m.amountPaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/50">Paid:</span>
                  <span className="font-medium text-status-success">
                    {formatINR(m.paidPaise)}
                  </span>
                </div>
                {m.remainingPaise > 0n && (
                  <div className="flex justify-between font-bold text-status-warning pt-0.5">
                    <span>Balance Due:</span>
                    <span>{formatINR(m.remainingPaise)}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs border-sand bg-ivory hover:bg-cream gap-1.5 mt-2"
              onClick={() => handleOpenRecordPayment(m)}
              disabled={m.status === "PAID"}
            >
              <CreditCard className="w-3.5 h-3.5 text-gold" />
              <span>{m.status === "PAID" ? "Settled" : "Record Payment Receipt"}</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Transactions History */}
      <div className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold" />
            <span>Client Payment Receipts & Idempotent Audit Records</span>
          </h3>
          <span className="text-xs text-charcoal/50">
            {transactions.length} receipts registered
          </span>
        </div>

        <div className="border border-sand/40 rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sand/40 text-charcoal/70 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date (IST)</th>
                  <th className="py-2.5 px-3">Milestone</th>
                  <th className="py-2.5 px-3">Amount Received</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Bank Reference / UTR</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/20">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-charcoal/50">
                      No payments recorded yet for this wedding.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-ivory/40">
                      <td className="py-2.5 px-3 font-mono text-charcoal/70">
                        {new Date(tx.paidAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-charcoal">
                        {tx.milestoneTitle || "Milestone"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-status-success">
                        {formatINR(tx.amountPaise)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] border-sand">
                          {tx.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-charcoal/80">
                        {tx.reference}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal/60">
                        {tx.recordedByName || "Finance Officer"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-charcoal/40 truncate max-w-[120px]">
                        {tx.idempotencyKey}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {selectedMilestone && (
        <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
          <DialogContent className="max-w-md bg-warm-white">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-gold/15 text-gold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-xl text-charcoal">
                    Record Client Receipt
                  </DialogTitle>
                  <DialogDescription className="text-xs text-charcoal/60">
                    Milestone: <strong>{selectedMilestone.title}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmitPayment} className="space-y-4 py-2">
              {errorNotice && (
                <div className="p-3 text-xs bg-status-critical/10 border border-status-critical/30 rounded-lg text-status-critical space-y-1">
                  <div className="flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Payment Validation Warning</span>
                  </div>
                  <p>{errorNotice}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                  Amount Received (₹ Rupees) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    className="w-full text-sm border border-sand rounded-md pl-7 pr-3 py-2 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                    Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs border border-sand rounded-md p-2 bg-white"
                  >
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="IMPS">IMPS</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                    UTR / Reference *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0001928371"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
                    Idempotency Key (Duplicate-Safe)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setIdempotencyKey(
                        `client_pay_${Date.now()}_${Math.random()
                          .toString(36)
                          .substring(2, 8)}`
                      )
                    }
                    className="text-[10px] text-gold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="w-full text-[11px] font-mono border border-sand rounded-md p-1.5 bg-ivory text-charcoal/70"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allowDuplicate"
                  checked={allowBusinessDuplicate}
                  onChange={(e) => setAllowBusinessDuplicate(e.target.checked)}
                  className="rounded border-sand text-gold mt-0.5"
                />
                <label
                  htmlFor="allowDuplicate"
                  className="text-[11px] text-charcoal/70 leading-tight"
                >
                  Authorized legitimate installment (Bypass 24-hour duplicate heuristic warning)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sand/30">
                <Button
                  type="button"
                  variant="outline"
                  className="border-sand text-xs"
                  onClick={() => setIsRecordOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gold text-white hover:bg-gold-dark text-xs gap-1.5"
                  disabled={isSubmitting}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Recording..." : "Certify Receipt"}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Custom Milestone Dialog */}
      <CreateMilestoneDialog
        isOpen={isCreateMilestoneOpen}
        onClose={() => setIsCreateMilestoneOpen(false)}
        weddingId={weddingId}
        onCreated={onRefresh}
      />
    </div>
  );
}

function CreateMilestoneDialog({
  isOpen,
  onClose,
  weddingId,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [amountRupees, setAmountRupees] = useState("2000000");
  const [dueAt, setDueAt] = useState("2027-01-15");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueAt) return;

    setIsSubmitting(true);
    try {
      const parsedRupees = parseFloat(amountRupees) || 0;
      const amountPaise = BigInt(Math.round(parsedRupees * 100));

      const res = await fetch("/api/finance/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          title,
          percentage,
          amountPaise: amountPaise.toString(),
          dueAt,
        }),
      });

      const json = await res.json();
      if (json.success) {
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create milestone:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-warm-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-charcoal">
            Add Client Payment Milestone
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Milestone Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Venue Handover & Final Balance 10%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                Percentage %
              </label>
              <input
                type="text"
                placeholder="10"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                Due Date (YYYY-MM-DD) *
              </label>
              <input
                type="text"
                required
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
              Amount (₹ Rupees)
            </label>
            <input
              type="number"
              required
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-sand/30">
            <Button type="button" variant="outline" className="border-sand text-xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gold text-white hover:bg-gold-dark text-xs"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Milestone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
