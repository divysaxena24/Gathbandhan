"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
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
import { ExpenseRecord, ApprovedExtraRecord } from "@/modules/finance/types";
import { formatINR } from "@/lib/money";

interface ExpensesExtrasViewProps {
  expenses: ExpenseRecord[];
  extras: ApprovedExtraRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function ExpensesExtrasView({
  expenses,
  extras,
  weddingId,
  onRefresh,
}: ExpensesExtrasViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"extras" | "expenses">("extras");

  // Log Expense modal
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("TRANSPORT");
  const [expenseAmountRupees, setExpenseAmountRupees] = useState("");
  const [expenseBillable, setExpenseBillable] = useState(false);
  const [expenseReceiptUrl, setExpenseReceiptUrl] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  // Add Extra modal
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [extraTitle, setExtraTitle] = useState("");
  const [extraCategory, setExtraCategory] = useState("Decor");
  const [extraUnitRateRupees, setExtraUnitRateRupees] = useState("");
  const [extraQuantity, setExtraQuantity] = useState("1");
  const [extraVendorCostRupees, setExtraVendorCostRupees] = useState("");
  const [extraClientAmountRupees, setExtraClientAmountRupees] = useState("");
  const [extraBillable, setExtraBillable] = useState(true);
  const [extraDescription, setExtraDescription] = useState("");

  // Submitting & status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Totals calculations
  const totalApprovedExtrasPaise = extras
    .filter((e) => e.status === "APPROVED" || e.status === "BILLED")
    .reduce((acc, e) => acc + BigInt(e.clientAmountPaise || 0), 0n);

  const totalPendingExtrasPaise = extras
    .filter((e) => e.status === "PENDING_APPROVAL")
    .reduce((acc, e) => acc + BigInt(e.clientAmountPaise || 0), 0n);

  const totalExpensesPaise = expenses.reduce(
    (acc, e) => acc + BigInt(e.amountPaise || 0),
    0n
  );

  const totalApprovedExpensesPaise = expenses
    .filter((e) => e.isApproved)
    .reduce((acc, e) => acc + BigInt(e.amountPaise || 0), 0n);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setIsSubmitting(true);

    try {
      const amountPaise = BigInt(Math.round(parseFloat(expenseAmountRupees || "0") * 100));
      if (amountPaise <= 0n) {
        throw new Error("Amount must be greater than zero");
      }

      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          title: expenseTitle,
          category: expenseCategory,
          amountPaise: amountPaise.toString(),
          incurredAt: new Date().toISOString(),
          billableToClient: expenseBillable,
          receiptUrl: expenseReceiptUrl.trim() || null,
          notes: expenseNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to log expense");
      }

      setIsExpenseOpen(false);
      setExpenseTitle("");
      setExpenseAmountRupees("");
      setExpenseReceiptUrl("");
      setExpenseNotes("");
      onRefresh();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveExpense = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/finance/expenses/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to approve expense");
      }
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setIsSubmitting(true);

    try {
      const unitRatePaise = BigInt(Math.round(parseFloat(extraUnitRateRupees || "0") * 100));
      const qty = parseInt(extraQuantity || "1", 10);
      const vendorCostPaise = BigInt(Math.round(parseFloat(extraVendorCostRupees || "0") * 100));
      const clientAmountPaise = BigInt(Math.round(parseFloat(extraClientAmountRupees || "0") * 100));

      if (clientAmountPaise <= 0n) {
        throw new Error("Client amount must be greater than zero");
      }

      const res = await fetch("/api/finance/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          title: extraTitle,
          category: extraCategory,
          unitRatePaise: unitRatePaise.toString(),
          quantity: qty,
          vendorCostPaise: vendorCostPaise.toString(),
          clientAmountPaise: clientAmountPaise.toString(),
          billableToClient: extraBillable,
          description: extraDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create extra variation");
      }

      setIsExtraOpen(false);
      setExtraTitle("");
      setExtraUnitRateRupees("");
      setExtraQuantity("1");
      setExtraVendorCostRupees("");
      setExtraClientAmountRupees("");
      setExtraDescription("");
      onRefresh();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveExtra = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/finance/extras/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to approve variation");
      }
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Highlight Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
          <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
            Approved Variations
          </div>
          <div className="text-xl font-medium text-emerald-800 mt-1">
            {formatINR(totalApprovedExtrasPaise)}
          </div>
          <div className="text-xs text-charcoal-500 mt-0.5">
            {extras.filter((e) => e.status === "APPROVED" || e.status === "BILLED").length} billable variations
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
          <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
            Pending Variations
          </div>
          <div className="text-xl font-medium text-amber-800 mt-1">
            {formatINR(totalPendingExtrasPaise)}
          </div>
          <div className="text-xs text-charcoal-500 mt-0.5">
            {extras.filter((e) => e.status === "PENDING_APPROVAL").length} awaiting client sign-off
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
          <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
            Operational Expenses
          </div>
          <div className="text-xl font-medium text-charcoal-900 mt-1">
            {formatINR(totalExpensesPaise)}
          </div>
          <div className="text-xs text-charcoal-500 mt-0.5">
            {expenses.length} petty cash & logistical items
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm">
          <div className="text-xs font-serif uppercase tracking-wider text-charcoal-400">
            Approved Disbursements
          </div>
          <div className="text-xl font-medium text-purple-900 mt-1">
            {formatINR(totalApprovedExpensesPaise)}
          </div>
          <div className="text-xs text-charcoal-500 mt-0.5">
            Audit-verified by lead planner
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-sand-50 p-2 rounded-xl border border-sand-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab("extras")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "extras"
                ? "bg-white text-charcoal shadow-sm border border-sand-200 font-semibold"
                : "text-charcoal-600 hover:text-charcoal"
            }`}
          >
            <Sparkles className="w-4 h-4 inline-block mr-2 text-gold-600" />
            Approved Variations & Extras ({extras.length})
          </button>
          <button
            onClick={() => setActiveSubTab("expenses")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === "expenses"
                ? "bg-white text-charcoal shadow-sm border border-sand-200 font-semibold"
                : "text-charcoal-600 hover:text-charcoal"
            }`}
          >
            <Receipt className="w-4 h-4 inline-block mr-2 text-charcoal-500" />
            Operational & Incidental Expenses ({expenses.length})
          </button>
        </div>

        <div>
          {activeSubTab === "extras" ? (
            <Button
              onClick={() => setIsExtraOpen(true)}
              size="sm"
              className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Variation Order
            </Button>
          ) : (
            <Button
              onClick={() => setIsExpenseOpen(true)}
              size="sm"
              className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Log Expense Item
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Variations & Extras */}
      {activeSubTab === "extras" && (
        <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-sand-200 flex justify-between items-center bg-sand-50/50">
            <div>
              <h3 className="font-serif text-lg text-charcoal-900">
                Client Variations & Out-of-Scope Additions
              </h3>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Every scope adjustment is cataloged with vendor cost vs client billing markup
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-white text-charcoal-600">
              Contract Expansion Tracking
            </Badge>
          </div>

          {extras.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="w-10 h-10 text-gold-500 mx-auto mb-3 opacity-60" />
              <p className="font-serif text-base text-charcoal-800">
                No variations or extras recorded yet
              </p>
              <p className="text-xs text-charcoal-500 mt-1 max-w-md mx-auto">
                Capture unanticipated decor expansions, added guest dining covers, or artist upgrades to preserve agency margin.
              </p>
              <Button
                onClick={() => setIsExtraOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Variation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50/30 text-xs text-charcoal-500 font-serif uppercase tracking-wider">
                    <th className="py-3 px-4">Title & Category</th>
                    <th className="py-3 px-4">Vendor Partner</th>
                    <th className="py-3 px-4 text-center">Qty × Rate</th>
                    <th className="py-3 px-4 text-right">Vendor Cost</th>
                    <th className="py-3 px-4 text-right">Client Billable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {extras.map((extra) => (
                    <tr key={extra.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-900">{extra.title}</div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {extra.category}
                          </Badge>
                          {extra.description && (
                            <span className="text-xs text-charcoal-500 truncate max-w-xs">
                              {extra.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-charcoal-700">
                        {extra.vendorName || "General / Agency Incurred"}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-charcoal-600">
                        {extra.quantity} × {formatINR(BigInt(extra.unitRatePaise || 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono text-charcoal-700">
                        {formatINR(BigInt(extra.vendorCostPaise || 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-800">
                        {formatINR(BigInt(extra.clientAmountPaise || 0))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {extra.status === "APPROVED" || extra.status === "BILLED" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[11px] hover:bg-emerald-100 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
                            Approved
                          </Badge>
                        ) : extra.status === "REJECTED" ? (
                          <Badge className="bg-rose-100 text-rose-800 text-[11px] hover:bg-rose-100 border-rose-200">
                            Rejected
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-[11px] hover:bg-amber-100 border-amber-200">
                            <Clock className="w-3 h-3 mr-1 inline-block" />
                            Pending Sign-off
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {extra.status === "PENDING_APPROVAL" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approvingId === extra.id}
                            onClick={() => handleApproveExtra(extra.id)}
                            className="h-7 text-xs border-sand-300 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {approvingId === extra.id ? "Approving..." : "Approve"}
                          </Button>
                        ) : (
                          <span className="text-xs text-charcoal-400 italic">
                            Signed off
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Operational Expenses */}
      {activeSubTab === "expenses" && (
        <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-sand-200 flex justify-between items-center bg-sand-50/50">
            <div>
              <h3 className="font-serif text-lg text-charcoal-900">
                Logistical & Operational Disbursal Log
              </h3>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Every on-ground cash, logistics, or agency-incurred incident is tracked with receipt proofs
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-white text-charcoal-600">
              Audit-Ready Disbursals
            </Badge>
          </div>

          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-10 h-10 text-charcoal-400 mx-auto mb-3 opacity-60" />
              <p className="font-serif text-base text-charcoal-800">
                No operational expenses logged
              </p>
              <p className="text-xs text-charcoal-500 mt-1 max-w-md mx-auto">
                Keep on-ground fuel, local municipal licenses, emergency transfers, and staff meals neatly recorded.
              </p>
              <Button
                onClick={() => setIsExpenseOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Log First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50/30 text-xs text-charcoal-500 font-serif uppercase tracking-wider">
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Incurred Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Billable to Client</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4 text-center">Audit Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-900">{exp.title}</div>
                        {exp.notes && (
                          <div className="text-xs text-charcoal-500 truncate max-w-xs mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs bg-sand-50">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-charcoal-600">
                        {new Date(exp.incurredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-charcoal-900">
                        {formatINR(BigInt(exp.amountPaise || 0))}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exp.billableToClient ? (
                          <Badge className="bg-blue-100 text-blue-800 text-[10px] hover:bg-blue-100">
                            Yes (Rebillable)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Internal Cost
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exp.receiptUrl ? (
                          <a
                            href={exp.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-gold-700 hover:text-gold-900 hover:underline gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-charcoal-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {exp.isApproved ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[11px] hover:bg-emerald-100 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-[11px] hover:bg-amber-100 border-amber-200">
                            <Clock className="w-3 h-3 mr-1 inline-block" />
                            Pending Review
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!exp.isApproved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approvingId === exp.id}
                            onClick={() => handleApproveExpense(exp.id)}
                            className="h-7 text-xs border-sand-300 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {approvingId === exp.id ? "Approving..." : "Approve"}
                          </Button>
                        ) : (
                          <span className="text-xs text-charcoal-400 italic">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dialog: Log Operational Expense */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-charcoal-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gold-600" />
              Log Operational Expense
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-500">
              Record incidental costs, travel outlays, or destination permits.
            </DialogDescription>
          </DialogHeader>

          {errorNotice && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Udaipur Police Permission & NOC Fee"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Category *
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  <option value="TRANSPORT">Logistics & Freight (Transport)</option>
                  <option value="COORDINATION">Permits & NOC (Coordination)</option>
                  <option value="SECURITY">Security & Staffing</option>
                  <option value="LIGHTING">Power & Generator Fuel (Lighting)</option>
                  <option value="OTHER">Miscellaneous / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-charcoal-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="25,000"
                    value={expenseAmountRupees}
                    onChange={(e) => setExpenseAmountRupees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Receipt / Document URL
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={expenseReceiptUrl}
                onChange={(e) => setExpenseReceiptUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Operational Notes
              </label>
              <textarea
                rows={2}
                placeholder="Notes for lead planner review..."
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="expenseBillable"
                checked={expenseBillable}
                onChange={(e) => setExpenseBillable(e.target.checked)}
                className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
              />
              <label htmlFor="expenseBillable" className="text-xs text-charcoal-700 font-medium">
                Billable to Client (Rebill on final settlement invoice)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-sand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-charcoal text-ivory hover:bg-charcoal-800"
              >
                {isSubmitting ? "Logging..." : "Log Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Extra Variation Order */}
      <Dialog open={isExtraOpen} onOpenChange={setIsExtraOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-charcoal-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-600" />
              Add Scope Variation / Client Extra
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-500">
              Catalog an out-of-scope addition with exact vendor cost and client markup.
            </DialogDescription>
          </DialogHeader>

          {errorNotice && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateExtra} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Variation Item Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Additional 50 Royal Dining Covers (Sangeet)"
                value={extraTitle}
                onChange={(e) => setExtraTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Category *
                </label>
                <select
                  value={extraCategory}
                  onChange={(e) => setExtraCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  <option value="Catering">Catering & Bar</option>
                  <option value="Decor">Decor & Floral</option>
                  <option value="Production">Production & Sound</option>
                  <option value="Hospitality">Guest Hospitality & Transport</option>
                  <option value="Entertainment">Entertainment & Artists</option>
                  <option value="Photography">Photography & Cinematography</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={extraQuantity}
                  onChange={(e) => setExtraQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Unit Rate (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-charcoal-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="6,000"
                    value={extraUnitRateRupees}
                    onChange={(e) => {
                      setExtraUnitRateRupees(e.target.value);
                      const unit = parseFloat(e.target.value || "0");
                      const q = parseInt(extraQuantity || "1", 10);
                      const totalClient = unit * q;
                      setExtraClientAmountRupees(totalClient ? totalClient.toString() : "");
                    }}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Vendor Cost (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-charcoal-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="2,40,000"
                    value={extraVendorCostRupees}
                    onChange={(e) => setExtraVendorCostRupees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Client Billable (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-charcoal-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="3,00,000"
                    value={extraClientAmountRupees}
                    onChange={(e) => setExtraClientAmountRupees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium text-emerald-800"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Description / Scope Justification
              </label>
              <textarea
                rows={2}
                placeholder="Requested by Groom's family for extended dinner buffet..."
                value={extraDescription}
                onChange={(e) => setExtraDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="extraBillable"
                checked={extraBillable}
                onChange={(e) => setExtraBillable(e.target.checked)}
                className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
              />
              <label htmlFor="extraBillable" className="text-xs text-charcoal-700 font-medium">
                Include in Client Settlement Invoice
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-sand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExtraOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-charcoal text-ivory hover:bg-charcoal-800"
              >
                {isSubmitting ? "Adding..." : "Add Variation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
