import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();

    try {
      const rows = await db
        .select({
          id: clients.id,
          coupleName: clients.coupleName,
          partnerOneName: clients.partnerOneName,
          partnerOneEmail: clients.partnerOneEmail,
          partnerOnePhone: clients.partnerOnePhone,
          partnerTwoName: clients.partnerTwoName,
          partnerTwoEmail: clients.partnerTwoEmail,
          portalUserId: clients.portalUserId,
          address: clients.address,
          notes: clients.notes,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        })
        .from(clients)
        .orderBy(desc(clients.createdAt));

      return successResponse(rows);
    } catch (dbErr: unknown) {
      console.warn(
        "Could not load clients from DB (database may be offline or starting):",
        dbErr
      );
      // Fallback demo client for local development or offline DB
      return successResponse([
        {
          id: "client-demo-1",
          coupleName: "Divya & Knox",
          partnerOneName: "Divya Saxena",
          partnerOneEmail: "divya_saxena@srmap.edu.in",
          partnerOnePhone: "+91 98765 43210",
          partnerTwoName: "Knox",
          partnerTwoEmail: "knox@example.com",
          portalUserId: null,
          address: "Udaipur, Rajasthan",
          notes: "Grand Heritage Palace Wedding",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();

    const [created] = await db
      .insert(clients)
      .values({
        coupleName: body.coupleName,
        partnerOneName: body.partnerOneName,
        partnerOneEmail: body.partnerOneEmail,
        partnerOnePhone: body.partnerOnePhone,
        partnerTwoName: body.partnerTwoName,
        partnerTwoEmail: body.partnerTwoEmail,
        address: body.address,
        notes: body.notes,
      })
      .returning();

    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
