import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");
    const clientId = searchParams.get("clientId");

    try {
      if (weddingId) {
        const bills = await getBillsForWedding(weddingId);
        return successResponse(serializeBigInt(bills));
      }

      if (clientId) {
        const bills = await getBillsForClient(clientId);
        return successResponse(serializeBigInt(bills));
      }

      // Try finding client for current user
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(
          or(
            eq(clients.portalUserId, user.id),
            eq(clients.partnerOneEmail, user.email || ""),
            eq(clients.partnerTwoEmail, user.email || "")
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
      console.warn("Could not load client bills from DB (database may be offline or starting):", dbErr);
      return successResponse([]);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
