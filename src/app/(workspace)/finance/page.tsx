"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfitabilitySummary } from "@/components/finance/profitability-summary";
import { ClientMilestonesView } from "@/components/finance/client-milestones-view";
import { VendorSettlementView } from "@/components/finance/vendor-settlement-view";
import { ExpensesExtrasView } from "@/components/finance/expenses-extras-view";
import { AdminBillsManagementView } from "@/components/finance/admin-bills-management-view";
import {
  WeddingProfitability,
  ClientPaymentMilestoneRecord,
  ClientPaymentTransactionRecord,
  VendorInvoiceRecord,
  VendorPaymentTransactionRecord,
  ExpenseRecord,
  ApprovedExtraRecord,
} from "@/modules/finance/types";

interface WeddingOption {
  id: string;
  title: string;
  city: string | null;
  venue: string | null;
  startDate: string | null;
  budgetPaise: string;
  lifecycleStatus: string;
}

export default function FinancePage() {
  const [weddings, setWeddings] = useState<WeddingOption[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Financial States
  const [profitability, setProfitability] = useState<WeddingProfitability | null>(null);
  const [milestones, setMilestones] = useState<ClientPaymentMilestoneRecord[]>([]);
  const [clientTransactions, setClientTransactions] = useState<ClientPaymentTransactionRecord[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoiceRecord[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPaymentTransactionRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [extras, setExtras] = useState<ApprovedExtraRecord[]>([]);

  // 1. Fetch available weddings
  const loadWeddings = useCallback(async () => {
    try {
      const res = await fetch("/api/weddings");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setWeddings(json.data);
        if (!selectedWeddingId) {
          setSelectedWeddingId(json.data[0].id);
        }
      } else {
        // Fallback: try tasks API if weddings endpoint empty
        const taskRes = await fetch("/api/tasks");
        const taskJson = await taskRes.json();
        if (taskJson.success && taskJson.data.length > 0) {
          const fallbackWeddingId = taskJson.data[0].weddingId;
          setSelectedWeddingId(fallbackWeddingId);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load weddings:", err);
      setErrorMessage("Could not load weddings list");
    }
  }, [selectedWeddingId]);

  useEffect(() => {
    loadWeddings();
  }, [loadWeddings]);

  // 2. Fetch all financial records for the active wedding
  const loadFinancialData = useCallback(async (weddingId: string) => {
    if (!weddingId) return;
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [
        profitRes,
        milestonesRes,
        clientPayRes,
        invoicesRes,
        vendorPayRes,
        expensesRes,
        extrasRes,
      ] = await Promise.all([
        fetch(`/api/finance/profitability?weddingId=${weddingId}`),
        fetch(`/api/finance/milestones?weddingId=${weddingId}`),
        fetch(`/api/finance/payments/client?weddingId=${weddingId}`),
        fetch(`/api/finance/invoices?weddingId=${weddingId}`),
        fetch(`/api/finance/payments/vendor?weddingId=${weddingId}`),
        fetch(`/api/finance/expenses?weddingId=${weddingId}`),
        fetch(`/api/finance/extras?weddingId=${weddingId}`),
      ]);

      const [
        profitJson,
        milestonesJson,
        clientPayJson,
        invoicesJson,
        vendorPayJson,
        expensesJson,
        extrasJson,
      ] = await Promise.all([
        profitRes.json(),
        milestonesRes.json(),
        clientPayRes.json(),
        invoicesRes.json(),
        vendorPayRes.json(),
        expensesRes.json(),
        extrasRes.json(),
      ]);

      if (profitJson.success) setProfitability(profitJson.data);
      if (milestonesJson.success) setMilestones(milestonesJson.data);
      if (clientPayJson.success) setClientTransactions(clientPayJson.data);
      if (invoicesJson.success) setInvoices(invoicesJson.data);
      if (vendorPayJson.success) setVendorPayments(vendorPayJson.data);
      if (expensesJson.success) setExpenses(expensesJson.data);
      if (extrasJson.success) setExtras(extrasJson.data);
    } catch (err: unknown) {
      console.error("Error loading financial data:", err);
      setErrorMessage("Failed to load full balance sheet. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWeddingId) {
      loadFinancialData(selectedWeddingId);
    }
  }, [selectedWeddingId, loadFinancialData]);

  const selectedWedding = weddings.find((w) => w.id === selectedWeddingId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Integrity & Settlements"
        description="Dual-ledger accounting, milestone schedules, invoice variance reconciliation, and agency margin audits"
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
                    {w.title} ({w.city || "Rajasthan"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFinancialData(selectedWeddingId)}
            disabled={isRefreshing}
            className="gap-1.5 text-xs text-charcoal-700 hover:text-charcoal border-sand-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Wedding Meta Sub-bar */}
      {selectedWedding && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-sand-50/70 border border-sand-200/80 px-4 py-2.5 rounded-xl text-xs text-charcoal-600">
          <div className="flex items-center gap-4">
            <span className="font-serif font-medium text-charcoal-900 text-sm">
              {selectedWedding.title}
            </span>
            {selectedWedding.venue && (
              <span className="flex items-center gap-1 text-charcoal-500">
                <Building2 className="w-3.5 h-3.5 text-gold-600" />
                {selectedWedding.venue}, {selectedWedding.city}
              </span>
            )}
            {selectedWedding.startDate && (
              <span className="flex items-center gap-1 text-charcoal-500">
                <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                {new Date(selectedWedding.startDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]">
              Active Balance Sheet
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="profitability" className="space-y-6">
        <TabsList className="bg-sand-100/60 p-1 border border-sand-200 rounded-xl">
          <TabsTrigger
            value="bills"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            Bills & Advance UPI
          </TabsTrigger>
          <TabsTrigger
            value="profitability"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-gold-600" />
            Executive Profitability
          </TabsTrigger>
          <TabsTrigger
            value="milestones"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-charcoal-600" />
            Client Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-charcoal-600" />
            Vendor Settlements ({invoices.length})
          </TabsTrigger>
          <TabsTrigger
            value="extras"
            className="data-[state=active]:bg-white data-[state=active]:text-charcoal data-[state=active]:shadow-sm text-xs font-medium px-4 py-2 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            Variations & Expenses ({extras.length + expenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Executive Profitability Summary */}
        <TabsContent value="profitability" className="space-y-6">
          <ProfitabilitySummary profitability={profitability} />
        </TabsContent>

        {/* Tab 2: Client Milestones & Payments */}
        <TabsContent value="milestones" className="space-y-6">
          <ClientMilestonesView
            milestones={milestones}
            transactions={clientTransactions}
            weddingId={selectedWeddingId}
            onRefresh={() => loadFinancialData(selectedWeddingId)}
          />
        </TabsContent>

        {/* Tab 3: Vendor Invoices & Disbursements */}
        <TabsContent value="invoices" className="space-y-6">
          <VendorSettlementView
            invoices={invoices}
            payments={vendorPayments}
            weddingId={selectedWeddingId}
            onRefresh={() => loadFinancialData(selectedWeddingId)}
          />
        </TabsContent>

        {/* Tab 4: Scope Variations & Incidentals */}
        <TabsContent value="extras" className="space-y-6">
          <ExpensesExtrasView
            expenses={expenses}
            extras={extras}
            weddingId={selectedWeddingId}
            onRefresh={() => loadFinancialData(selectedWeddingId)}
          />
        </TabsContent>
        {/* Tab 5: Client Bills & Advance Virtual UPI */}
        <TabsContent value="bills" className="space-y-6">
          <AdminBillsManagementView weddingId={selectedWeddingId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
