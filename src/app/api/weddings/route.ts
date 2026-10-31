import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { weddings } from "@/lib/db/schema/weddings";
import { clients } from "@/lib/db/schema/clients";
import { isNull, desc, eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { z } from "zod";

const createWeddingSchema = z.object({
  title: z.string().min(2, "Wedding title is required"),
  clientName: z.string().min(2, "Client/couple name is required"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  city: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  guestCount: z.coerce.number().optional().default(300),
  budgetINR: z.coerce.number().optional().default(10000000), // Default 1 Crore
  packageType: z.enum(["FULL_SERVICE", "PARTIAL", "DAY_OF"]).optional().default("FULL_SERVICE"),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();

    const list = await db
      .select({
        id: weddings.id,
        title: weddings.title,
        city: weddings.city,
        venue: weddings.venue,
        startDate: weddings.startDate,
        endDate: weddings.endDate,
        estimatedGuestCount: weddings.estimatedGuestCount,
        budgetPaise: weddings.budgetPaise,
        packageType: weddings.packageType,
        lifecycleStatus: weddings.lifecycleStatus,
        notes: weddings.notes,
        createdAt: weddings.createdAt,
        clientName: clients.coupleName,
        clientEmail: clients.partnerOneEmail,
        clientPhone: clients.partnerOnePhone,
      })
      .from(weddings)
      .leftJoin(clients, eq(weddings.clientId, clients.id))
      .where(isNull(weddings.deletedAt))
      .orderBy(desc(weddings.createdAt));

    // Convert bigint budgetPaise to string for JSON serialization
    const serialized = list.map((w) => ({
      ...w,
      budgetPaise: w.budgetPaise?.toString() || "0",
    }));

    return successResponse(serialized);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const parsed = createWeddingSchema.parse(body);

    // 1. Create or find client
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.coupleName, parsed.clientName))
      .limit(1);

    let clientId = existingClient[0]?.id;

    if (!clientId) {
      const newClients = await db
        .insert(clients)
        .values({
          coupleName: parsed.clientName,
          partnerOneName: parsed.clientName.split("&")[0]?.trim() || parsed.clientName,
          partnerOneEmail: parsed.clientEmail || null,
          partnerOnePhone: parsed.clientPhone || null,
          notes: "Created via wedding workspace",
        })
        .returning();
      clientId = newClients[0].id;
    }

    // Convert budget INR to paise (1 INR = 100 paise)
    const budgetPaise = BigInt(Math.round(parsed.budgetINR * 100));

    // 2. Insert wedding
    const newWeddings = await db
      .insert(weddings)
      .values({
        clientId,
        title: parsed.title,
        city: parsed.city || "Udaipur",
        venue: parsed.venue || "Luxury Palace",
        startDate: parsed.startDate || null,
        endDate: parsed.endDate || null,
        estimatedGuestCount: parsed.guestCount,
        budgetPaise,
        packageType: parsed.packageType,
        lifecycleStatus: "PLANNING",
        notes: parsed.notes || null,
      })
      .returning();

    const created = newWeddings[0];

    return successResponse({
      ...created,
      budgetPaise: created.budgetPaise?.toString() || "0",
      clientName: parsed.clientName,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
