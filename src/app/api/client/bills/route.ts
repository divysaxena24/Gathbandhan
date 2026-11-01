import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, logDbFallbackWarning } from "@/lib/db";
import { clients, weddings } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import {
  getBillsForWedding,
  getBillsForClient,
} from "@/modules/finance/services/bill-service";
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

    try {
      // Find client profile linked to this user
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(
          or(
            eq(clients.portalUserId, user.id),
            eq(clients.partnerOneEmail, user.email),
            user.clerkId ? eq(clients.portalUserId, user.clerkId) : undefined
          )
        )
        .limit(1);

      if (client) {
        const bills = await getBillsForClient(client.id);
        return successResponse(serializeBigInt(bills));
      }

      // Fallback: check weddings assigned to or created for client
      const [wedding] = await db
        .select({ id: weddings.id })
        .from(weddings)
        .limit(1);

      if (wedding) {
        const bills = await getBillsForWedding(wedding.id);
        return successResponse(serializeBigInt(bills));
      }

      return successResponse([]);
    } catch (dbErr: unknown) {
      logDbFallbackWarning("Client Bills API", dbErr);
      return successResponse([]);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
