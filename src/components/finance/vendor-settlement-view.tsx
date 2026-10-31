"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Receipt,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Scale,
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
  InvoiceReconciliationResult,
  InvoiceStatus,
  VendorInvoiceRecord,
  VendorPaymentTransactionRecord,
} from "@/modules/finance/types";
import { formatINR } from "@/lib/money";

interface VendorSettlementViewProps {
  invoices: VendorInvoiceRecord[];
  payments: VendorPaymentTransactionRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function VendorSettlementView({
  invoices,
  payments,
  weddingId: _weddingId,
  onRefresh,
}: VendorSettlementViewProps) {
  const [selectedInvoice, setSelectedInvoice] =
    useState<VendorInvoiceRecord | null>(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [reconciliationResult, setReconciliationResult] =
    useState<InvoiceReconciliationResult | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Disbursement form states
  const [amountRupees, setAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("RTGS");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(
    `vendor_pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [allowBusinessDuplicate, setAllowBusinessDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-status-success/15 text-status-success border-status-success/30 font-medium">
            Paid in Full
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-blue-600/15 text-blue-800 border-blue-300 font-medium">
            Certified for Payment
          </Badge>
        );
      case "DISPUTED":
        return (
          <Badge className="bg-status-critical/15 text-status-critical border-status-critical/30 font-semibold">
            Disputed Variance
          </Badge>
        );
      case "SENT":
      default:
        return (
          <Badge className="bg-sand/30 text-charcoal/70 border-sand font-normal">
            Submitted
          </Badge>
        );
    }
  };

  const handleOpenReconcile = async (inv: VendorInvoiceRecord) => {
    setSelectedInvoice(inv);
    setIsReconciling(true);
    setReconciliationResult(null);
    setIsReconcileOpen(true);

    try {
      const res = await fetch(`/api/finance/invoices/${inv.id}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedExtrasAllowed: true }),
      });
      const json = await res.json();
      if (json.success) {
        setReconciliationResult(json.data);
      }
    } catch (err) {
      console.error("Failed to reconcile invoice:", err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleOpenDisburse = (inv: VendorInvoiceRecord) => {
    setSelectedInvoice(inv);
    setAmountRupees(
      inv.remainingPayablePaise > 0n
        ? (Number(inv.remainingPayablePaise) / 100).toString()
        : (Number(inv.totalPaise) / 100).toString()
    );
    setIdempotencyKey(
      `vendor_pay_${inv.id.substring(0, 8)}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 6)}`
    );
    setErrorNotice(null);
    setIsDisburseOpen(true);
  };

  const handleSubmitDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !amountRupees || !reference) return;

    setIsSubmitting(true);
    setErrorNotice(null);
    try {
      const parsedRupees = parseFloat(amountRupees) || 0;
      const amountPaise = BigInt(Math.round(parsedRupees * 100));

      const res = await fetch("/api/finance/payments/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
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
        setIsDisburseOpen(false);
        setReference("");
        setNotes("");
        onRefresh();
      } else {
        setErrorNotice(
          json.error?.message ||
            "Failed to record disbursement. Check duplicate transaction warning."
        );
      }
    } catch {
      setErrorNotice("Network error while recording disbursement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-white rounded-xl border border-sand/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-charcoal">
            Vendor Invoices & Contract Reconciliation
          </h3>
          <p className="text-xs text-charcoal/60">
            Compare invoiced line items against awarded contract terms and approved extras. Unexplained positive variances are blocked from auto-approval.
          </p>
        </div>
      </div>

      {/* Invoice Roster Table */}
      <div className="border border-sand/40 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory border-b border-sand/40 text-charcoal/70 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Vendor & Category</th>
                <th className="py-3 px-3">Invoice Number</th>
                <th className="py-3 px-3">Dates</th>
                <th className="py-3 px-3">Total (GST Inc.)</th>
                <th className="py-3 px-3">Disbursed / Balance</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reconciliation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal/50">
                    No vendor invoices recorded yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ivory/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal">{inv.vendorName}</div>
                      <div className="text-[11px] font-semibold text-gold mt-0.5">
                        {inv.category}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-charcoal/80 font-medium">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-charcoal/60">
                      <div>Issued: {inv.issueDate}</div>
                      <div>Due: {inv.dueDate}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-charcoal">
                      {formatINR(inv.totalPaise)}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="text-status-success font-medium">
                        {formatINR(inv.paidPaise)}
                      </div>
                      {inv.remainingPayablePaise > 0n && (
                        <div className="text-[10px] text-status-warning font-semibold">
                          Due: {formatINR(inv.remainingPayablePaise)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">{getStatusBadge(inv.status)}</td>

                    <td className="py-3 px-3">
                      {inv.isReconciled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-success bg-status-success/15 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Reconciled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gold bg-gold/15 px-2 py-0.5 rounded">
                          <Scale className="w-3 h-3" />
                          Pending Audit
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-sand bg-white hover:bg-cream gap-1 px-2"
                          onClick={() => handleOpenReconcile(inv)}
                        >
                          <Scale className="w-3 h-3 text-gold" />
                          <span>Reconcile</span>
                        </Button>

                        <Button
                          size="sm"
                          className="h-7 text-[11px] bg-charcoal text-white hover:bg-charcoal/90 gap-1 px-2"
                          onClick={() => handleOpenDisburse(inv)}
                          disabled={inv.status === "PAID"}
                        >
                          <DollarSign className="w-3 h-3 text-gold" />
                          <span>Disburse</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursement Transaction History */}
      <div className="p-5 rounded-xl bg-white border border-sand/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold" />
            <span>Vendor Disbursement History & Bank References</span>
          </h3>
          <span className="text-xs text-charcoal/50">
            {payments.length} disbursements made
          </span>
        </div>

        <div className="border border-sand/40 rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory border-b border-sand/40 text-charcoal/70 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date (IST)</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Disbursed Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Bank Reference / UTR</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/20">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-charcoal/50">
                      No vendor disbursements recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-ivory/40">
                      <td className="py-2.5 px-3 font-mono text-charcoal/70">
                        {new Date(p.paidAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-charcoal font-medium">
                        {p.invoiceNumber || "Invoice"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-charcoal">
                        {formatINR(p.amountPaise)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] border-sand">
                          {p.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-charcoal/80">
                        {p.reference}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal/60">
                        {p.recordedByName || "Finance Officer"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-charcoal/40 truncate max-w-[120px]">
                        {p.idempotencyKey}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Reconciliation Modal */}
      {selectedInvoice && (
        <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
          <DialogContent className="max-w-lg bg-warm-white">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-gold/15 text-gold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-xl text-charcoal">
                    Invoice Contract Reconciliation
                  </DialogTitle>
                  <DialogDescription className="text-xs text-charcoal/60">
                    Vendor: <strong>{selectedInvoice.vendorName}</strong> • Invoice:{" "}
                    <strong>{selectedInvoice.invoiceNumber}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {isReconciling ? (
              <div className="py-12 text-center text-xs text-charcoal/60">
                Auditing invoice totals against contract commitments and approved extras...
              </div>
            ) : reconciliationResult ? (
              <div className="space-y-4 py-2 text-xs">
                {/* Comparison Card */}
                <div className="p-4 bg-white rounded-xl border border-sand/40 space-y-2">
                  <div className="flex justify-between py-1 border-b border-sand/20 font-mono">
                    <span className="text-charcoal/60">Contracted Commitment:</span>
                    <span className="font-medium text-charcoal">
                      {formatINR(reconciliationResult.contractAmountPaise)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-sand/20 font-mono">
                    <span className="text-charcoal/60">Approved Extras:</span>
                    <span className="font-medium text-status-success">
                      +{formatINR(reconciliationResult.approvedExtrasPaise)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-sand/20 font-mono font-semibold">
                    <span>Total Approved Ceiling:</span>
                    <span className="text-charcoal">
                      {formatINR(reconciliationResult.totalApprovedCommitmentPaise)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-sand/20 font-mono font-bold text-sm">
                    <span>Submitted Invoice Total:</span>
                    <span className="text-gold">
                      {formatINR(reconciliationResult.invoicedTotalPaise)}
                    </span>
                  </div>

                  {/* Variance Banner */}
                  <div
                    className={`p-3 rounded-lg mt-2 flex items-center justify-between font-mono font-bold ${
                      reconciliationResult.varianceStatus === "EXACT_MATCH"
                        ? "bg-status-success/15 text-status-success border border-status-success/30"
                        : reconciliationResult.varianceStatus === "UNDER_BUDGET"
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "bg-status-critical/15 text-status-critical border border-status-critical/30"
                    }`}
                  >
                    <span>Variance:</span>
                    <span>
                      {reconciliationResult.variancePaise > 0n ? "+" : ""}
                      {formatINR(reconciliationResult.variancePaise)} (
                      {reconciliationResult.variancePercentage}%)
                    </span>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="p-3 bg-ivory rounded-lg border border-sand/40 text-charcoal/80 space-y-1">
                  <div className="font-semibold text-charcoal">Audit Certification Note:</div>
                  <p>{reconciliationResult.explanation}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-sand/30">
                  <Button
                    variant="outline"
                    className="border-sand text-xs"
                    onClick={() => {
                      setIsReconcileOpen(false);
                      onRefresh();
                    }}
                  >
                    Close Audit
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}

      {/* Record Disbursement Dialog */}
      {selectedInvoice && (
        <Dialog open={isDisburseOpen} onOpenChange={setIsDisburseOpen}>
          <DialogContent className="max-w-md bg-warm-white">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-charcoal text-white">
                  <DollarSign className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-xl text-charcoal">
                    Record Vendor Disbursement
                  </DialogTitle>
                  <DialogDescription className="text-xs text-charcoal/60">
                    Vendor: <strong>{selectedInvoice.vendorName}</strong> (Inv #
                    {selectedInvoice.invoiceNumber})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmitDisbursement} className="space-y-4 py-2">
              {errorNotice && (
                <div className="p-3 text-xs bg-status-critical/10 border border-status-critical/30 rounded-lg text-status-critical space-y-1">
                  <div className="flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Disbursement Validation Warning</span>
                  </div>
                  <p>{errorNotice}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                  Amount Disbursed (₹ Rupees) *
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
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                    Bank UTR / Reference *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR-2027-AXIS-991"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full text-xs border border-sand rounded-md p-2 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
                    Idempotency Key (Duplicate Prevention)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setIdempotencyKey(
                        `vendor_pay_${Date.now()}_${Math.random()
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
                  id="allowVendorDuplicate"
                  checked={allowBusinessDuplicate}
                  onChange={(e) => setAllowBusinessDuplicate(e.target.checked)}
                  className="rounded border-sand text-gold mt-0.5"
                />
                <label
                  htmlFor="allowVendorDuplicate"
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
                  onClick={() => setIsDisburseOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-charcoal text-white hover:bg-charcoal/90 text-xs gap-1.5"
                  disabled={isSubmitting}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  <span>{isSubmitting ? "Processing..." : "Disburse Payment"}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
