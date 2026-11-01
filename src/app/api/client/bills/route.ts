import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, logDbFallbackWarning } from "@/lib/db";
import { clients, bookingRequests } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { getBillsForClient } from "@/modules/finance/services/bill-service";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

function serializeBigInt<T>(obj: T): any {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const userEmail = (user.email || "").toLowerCase().trim();

    try {
      // 1. Find client profile linked to this user
      let matchedClientId: string | null = null;

      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(
          or(
            eq(clients.portalUserId, user.id),
            user.clerkId ? eq(clients.portalUserId, user.clerkId) : undefined,
            userEmail ? eq(clients.partnerOneEmail, userEmail) : undefined,
            userEmail ? eq(clients.partnerTwoEmail, userEmail) : undefined
          )
        )
        .limit(1);

      if (client) {
        matchedClientId = client.id;
      } else {
        // 2. Check if user has an accepted booking request converted to a client
        const [bookingReq] = await db
          .select({ leadId: bookingRequests.leadId })
          .from(bookingRequests)
          .where(
            or(
              eq(bookingRequests.userId, user.id),
              userEmail ? eq(bookingRequests.contactEmail, userEmail) : undefined
            )
          )
          .limit(1);

        if (bookingReq?.leadId) {
          const [linkedClient] = await db
            .select({ id: clients.id })
            .from(clients)
            .where(eq(clients.convertedFromLeadId, bookingReq.leadId))
            .limit(1);

          if (linkedClient) {
            matchedClientId = linkedClient.id;
          }
        }
      }

      // 3. Client Isolation: If client profile is found, return ONLY bills tagged to that client
      if (matchedClientId) {
        const bills = await getBillsForClient(matchedClientId);
        // Clients only see bills that belong to them AND have been published by the planner (non-DRAFT)
        const clientVisibleBills = bills.filter(
          (b) => b.clientId === matchedClientId && b.status !== "DRAFT"
        );
        return successResponse(serializeBigInt(clientVisibleBills));
      }

      // If user is not associated with any client, return empty list (never expose another client's bills)
      return successResponse([]);
    } catch (dbErr: unknown) {
      logDbFallbackWarning("Client Bills API", dbErr);

      // Offline fallback: only serve demo bill if user matches demo client identity
      if (userEmail.includes("divya") || userEmail.includes("srmap.edu.in")) {
        const demoBill = {
          id: "bill-demo-101",
          weddingId: "wedding-demo-1",
          weddingTitle: "The Royal Udaipur Heritage Wedding",
          clientId: "client-demo-1",
          clientName: "Divya & Knox",
          billNumber: "GB-2026-0001",
          title: "Full Wedding Planning & Execution Package",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          subtotalPaise: "42372881",
          taxPaise: "7627119",
          totalPaise: "50000000", // ₹5,00,000
          paidPaise: "0",
          outstandingPaise: "50000000",
          advancePercentage: "20.00",
          advanceAmountPaise: "10000000", // ₹1,00,000
          remainingBalancePaise: "40000000", // ₹4,00,000
          balanceDueAt: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
          status: "AWAITING_ACCEPTANCE",
          acceptedAt: null,
          declinedAt: null,
          declineReason: null,
          publishedAt: new Date().toISOString(),
          items: [
            {
              id: "item-1",
              description: "Turnkey Palace Wedding Planning & Production",
              quantity: 1,
              unitRatePaise: "42372881",
              totalPaise: "42372881",
            },
          ],
          installments: [
            {
              id: "inst-demo-1",
              title: "Advance Deposit (20%)",
              percentage: "20.00",
              amountPaise: "10000000",
              paidPaise: "0",
              remainingPaise: "10000000",
              dueAt: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
              status: "PENDING",
              orderIndex: 0,
            },
            {
              id: "inst-demo-2",
              title: "Remaining Balance (80%)",
              percentage: "80.00",
              amountPaise: "40000000",
              paidPaise: "0",
              remainingPaise: "40000000",
              dueAt: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
              status: "PENDING",
              orderIndex: 1,
            },
          ],
        };
        return successResponse([demoBill]);
      }

      return successResponse([]);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
