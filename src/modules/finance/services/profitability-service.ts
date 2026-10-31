import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  weddings,
  weddingVendors,
  vendors,
  clientPaymentMilestones,
  clientPaymentTransactions,
  vendorInvoices,
  vendorPaymentTransactions,
  expenses,
} from "@/lib/db/schema";
import { CategoryFinancials, WeddingProfitability } from "../types";
import { NotFoundError } from "@/lib/errors";

/**
 * Calculates comprehensive wedding profitability and settlement metrics.
 * Uses exact BigInt integer paise arithmetic.
 */
export async function calculateWeddingProfit(
  weddingId: string
): Promise<WeddingProfitability> {
  // 1. Fetch wedding base
  const [wedding] = await db
    .select({
      id: weddings.id,
      budgetPaise: weddings.budgetPaise,
    })
    .from(weddings)
    .where(eq(weddings.id, weddingId))
    .limit(1);

  if (!wedding) {
    throw new NotFoundError(`Wedding ${weddingId} not found`);
  }

  // 2. Client Milestones & Payments (Revenue)
  const milestones = await db
    .select({ amountPaise: clientPaymentMilestones.amountPaise })
    .from(clientPaymentMilestones)
    .where(eq(clientPaymentMilestones.weddingId, weddingId));

  const clientTransactions = await db
    .select({ amountPaise: clientPaymentTransactions.amountPaise })
    .from(clientPaymentTransactions)
    .where(eq(clientPaymentTransactions.weddingId, weddingId));

  const milestonesTotalPaise = milestones.reduce(
    (sum, m) => sum + m.amountPaise,
    0n
  );
  // Contracted revenue defaults to sum of milestones or wedding budget
  const contractedRevenuePaise =
    milestonesTotalPaise > 0n ? milestonesTotalPaise : wedding.budgetPaise || 0n;

  const collectedRevenuePaise = clientTransactions.reduce(
    (sum, t) => sum + t.amountPaise,
    0n
  );

  const pendingReceivablesPaise =
    contractedRevenuePaise > collectedRevenuePaise
      ? contractedRevenuePaise - collectedRevenuePaise
      : 0n;

  // 3. Vendor Commitments & Invoices (Costs)
  const vendorAssignments = await db
    .select({
      id: weddingVendors.id,
      vendorId: weddingVendors.vendorId,
      category: vendors.category,
      contractAmountPaise: weddingVendors.contractAmountPaise,
    })
    .from(weddingVendors)
    .innerJoin(vendors, eq(weddingVendors.vendorId, vendors.id))
    .where(eq(weddingVendors.weddingId, weddingId));

  const committedVendorCostsPaise = vendorAssignments.reduce(
    (sum, v) => sum + (v.contractAmountPaise || 0n),
    0n
  );

  const invoices = await db
    .select({
      totalPaise: vendorInvoices.totalPaise,
      vendorId: vendorInvoices.vendorId,
    })
    .from(vendorInvoices)
    .where(eq(vendorInvoices.weddingId, weddingId));

  const actualInvoicedCostsPaise = invoices.reduce(
    (sum, inv) => sum + inv.totalPaise,
    0n
  );

  const disbursements = await db
    .select({
      amountPaise: vendorPaymentTransactions.amountPaise,
      weddingVendorId: vendorPaymentTransactions.weddingVendorId,
    })
    .from(vendorPaymentTransactions)
    .where(eq(vendorPaymentTransactions.weddingId, weddingId));

  const paidToVendorsPaise = disbursements.reduce(
    (sum, d) => sum + d.amountPaise,
    0n
  );

  const pendingPayablesPaise =
    actualInvoicedCostsPaise > paidToVendorsPaise
      ? actualInvoicedCostsPaise - paidToVendorsPaise
      : 0n;

  // 4. Miscellaneous Approved Expenses
  const approvedExpenseRows = await db
    .select({ amountPaise: expenses.amountPaise })
    .from(expenses)
    .where(
      and(eq(expenses.weddingId, weddingId), eq(expenses.isApproved, true))
    );

  const approvedExpensesPaise = approvedExpenseRows.reduce(
    (sum, e) => sum + e.amountPaise,
    0n
  );

  // 5. Total Projected & Actual Costs
  const totalProjectedCostsPaise =
    committedVendorCostsPaise + approvedExpensesPaise;
  const totalActualCostsPaise = actualInvoicedCostsPaise + approvedExpensesPaise;

  // 6. Profits and Margins
  const projectedProfitPaise =
    contractedRevenuePaise - totalProjectedCostsPaise;
  const projectedMarginPercentage =
    contractedRevenuePaise > 0n
      ? Number((projectedProfitPaise * 10000n) / contractedRevenuePaise) / 100
      : 0;

  const realizedProfitPaise = collectedRevenuePaise - totalActualCostsPaise;
  const realizedMarginPercentage =
    collectedRevenuePaise > 0n
      ? Number((realizedProfitPaise * 10000n) / collectedRevenuePaise) / 100
      : 0;

  // 7. Category Breakdown
  const categoryMap = new Map<
    string,
    { committed: bigint; invoiced: bigint; paid: bigint }
  >();
  const vendorCategoryMap = new Map<string, string>();
  const assignmentCategoryMap = new Map<string, string>();

  vendorAssignments.forEach((va) => {
    vendorCategoryMap.set(va.vendorId, va.category);
    assignmentCategoryMap.set(va.id, va.category);
    const cur = categoryMap.get(va.category) || {
      committed: 0n,
      invoiced: 0n,
      paid: 0n,
    };
    cur.committed += va.contractAmountPaise || 0n;
    categoryMap.set(va.category, cur);
  });

  invoices.forEach((inv) => {
    const cat = vendorCategoryMap.get(inv.vendorId) || "OTHER";
    const cur = categoryMap.get(cat) || {
      committed: 0n,
      invoiced: 0n,
      paid: 0n,
    };
    cur.invoiced += inv.totalPaise;
    categoryMap.set(cat, cur);
  });

  disbursements.forEach((d) => {
    const cat = assignmentCategoryMap.get(d.weddingVendorId) || "OTHER";
    const cur = categoryMap.get(cat) || {
      committed: 0n,
      invoiced: 0n,
      paid: 0n,
    };
    cur.paid += d.amountPaise;
    categoryMap.set(cat, cur);
  });

  const categoryBreakdown: CategoryFinancials[] = Array.from(
    categoryMap.entries()
  ).map(([category, vals]) => ({
    category,
    committedPaise: vals.committed,
    invoicedPaise: vals.invoiced,
    paidPaise: vals.paid,
  }));

  return {
    weddingId,
    contractedRevenuePaise,
    collectedRevenuePaise,
    pendingReceivablesPaise,
    committedVendorCostsPaise,
    actualInvoicedCostsPaise,
    paidToVendorsPaise,
    pendingPayablesPaise,
    approvedExpensesPaise,
    totalProjectedCostsPaise,
    totalActualCostsPaise,
    projectedProfitPaise,
    projectedMarginPercentage,
    realizedProfitPaise,
    realizedMarginPercentage,
    categoryBreakdown,
    asOf: new Date().toISOString(),
  };
}
