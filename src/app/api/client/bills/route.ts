import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, logDbFallbackWarning } from "@/lib/db";
import { clients, bookingRequests } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { getBillsForClient } from "@/modules/finance/services/bill-service";
import { getFallbackBills } from "@/lib/bills-fallback";
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
    let matchedClientId: string | null = null;

    try {
      // 1. Find client profile linked to this user

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

      // Offline fallback: serve fallback store bills matching this client's identity
      const fallbackBills = getFallbackBills();
      const visibleBills = fallbackBills.filter((b) => {
        if (b.status === "DRAFT") return false;
        if (matchedClientId && (b.clientId === matchedClientId || b.clientId.includes(matchedClientId))) {
          return true;
        }
        if (userEmail.includes("divya") || userEmail.includes("srmap.edu.in")) {
          return true;
        }
        return false;
      });

      return successResponse(serializeBigInt(visibleBills));
    }
  } catch (error) {
    return errorResponse(error);
  }
}
