import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  virtualPaymentTransactions,
  virtualPaymentAllocations,
  clientBills,
  clientBillInstallments,
  weddings,
  clients,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateVirtualReceiptPdf } from "@/modules/finance/services/receipt-service";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;

    const [tx] = await db
      .select({
        id: virtualPaymentTransactions.id,
        virtualUtr: virtualPaymentTransactions.virtualUtr,
        billId: virtualPaymentTransactions.billId,
        amountPaise: virtualPaymentTransactions.amountPaise,
        payerVpa: virtualPaymentTransactions.payerVpa,
        payerName: virtualPaymentTransactions.payerName,
        paymentType: virtualPaymentTransactions.paymentType,
        createdAt: virtualPaymentTransactions.createdAt,
        billNumber: clientBills.billNumber,
        billTitle: clientBills.title,
        totalPaise: clientBills.totalPaise,
        paidPaise: clientBills.paidPaise,
        weddingId: clientBills.weddingId,
        clientId: clientBills.clientId,
      })
      .from(virtualPaymentTransactions)
      .leftJoin(clientBills, eq(virtualPaymentTransactions.billId, clientBills.id))
      .where(eq(virtualPaymentTransactions.id, transactionId))
      .limit(1);

    if (!tx || !tx.billNumber) {
      throw new NotFoundError(`Virtual payment transaction ${transactionId} not found`);
    }

    let coupleName = "Valued Client";
    let weddingTitle: string | undefined;

    if (tx.clientId) {
      const [c] = await db
        .select({ coupleName: clients.coupleName })
        .from(clients)
        .where(eq(clients.id, tx.clientId))
        .limit(1);
      if (c?.coupleName) coupleName = c.coupleName;
    }

    if (tx.weddingId) {
      const [w] = await db
        .select({ title: weddings.title })
        .from(weddings)
        .where(eq(weddings.id, tx.weddingId))
        .limit(1);
      if (w?.title) weddingTitle = w.title;
    }

    const allocations = await db
      .select({
        amountPaise: virtualPaymentAllocations.amountPaise,
        installmentTitle: clientBillInstallments.title,
      })
      .from(virtualPaymentAllocations)
      .leftJoin(
        clientBillInstallments,
        eq(virtualPaymentAllocations.installmentId, clientBillInstallments.id)
      )
      .where(eq(virtualPaymentAllocations.transactionId, tx.id));

    const totalBillPaise = tx.totalPaise || 0n;
    const currentPaidPaise = tx.paidPaise || 0n;
    const remainingBillPaise =
      totalBillPaise > currentPaidPaise ? totalBillPaise - currentPaidPaise : 0n;

    const pdfBuffer = await generateVirtualReceiptPdf({
      transactionId: tx.id,
      virtualUtr: tx.virtualUtr,
      billNumber: tx.billNumber,
      billTitle: tx.billTitle || "Wedding Planning Services",
      coupleName,
      weddingTitle,
      payerVpa: tx.payerVpa,
      payerName: tx.payerName || undefined,
      paymentType: tx.paymentType,
      amountPaise: tx.amountPaise,
      totalBillPaise,
      remainingBillPaise,
      paidAt: tx.createdAt,
      allocations: allocations.map((a) => ({
        installmentTitle: a.installmentTitle || undefined,
        amountPaise: a.amountPaise,
      })),
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Virtual_Receipt_${tx.virtualUtr}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Failed to generate receipt" } },
      { status: error.statusCode || 500 }
    );
  }
}
