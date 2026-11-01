import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db, logDbFallbackWarning } from "@/lib/db";
import { clients, bookingRequests, weddings } from "@/lib/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import { successResponse, mutationResponse, errorResponse } from "@/lib/errors/api-response";
import { getFallbackBookingRequests } from "@/lib/booking-requests-fallback";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();

    try {
      // 1. Direct clients table records
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

      // 2. Also retrieve clients from accepted booking projects to ensure none are missed
      const acceptedBookings = await db
        .select({
          id: bookingRequests.id,
          userId: bookingRequests.userId,
          coupleName: bookingRequests.coupleName,
          contactName: bookingRequests.contactName,
          contactEmail: bookingRequests.contactEmail,
          contactPhone: bookingRequests.contactPhone,
          destinationCity: bookingRequests.destinationCity,
          weddingType: bookingRequests.weddingType,
          status: bookingRequests.status,
          createdAt: bookingRequests.createdAt,
          updatedAt: bookingRequests.updatedAt,
        })
        .from(bookingRequests)
        .where(eq(bookingRequests.status, "ACCEPTED"))
        .orderBy(desc(bookingRequests.createdAt));

      // 3. Also retrieve client details from wedding projects
      const weddingProjects = await db
        .select({
          id: weddings.id,
          clientId: weddings.clientId,
          title: weddings.title,
          clientName: clients.coupleName,
          clientEmail: clients.partnerOneEmail,
          clientPhone: clients.partnerOnePhone,
          createdAt: weddings.createdAt,
          updatedAt: weddings.updatedAt,
        })
        .from(weddings)
        .leftJoin(clients, eq(weddings.clientId, clients.id))
        .where(isNull(weddings.deletedAt));

      // Aggregate and deduplicate by ID, email, or coupleName
      const clientMap = new Map<string, any>();
      for (const row of rows) {
        clientMap.set(row.id, row);
      }

      for (const booking of acceptedBookings) {
        const key = booking.userId || booking.id;
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            id: key,
            coupleName: booking.coupleName || booking.contactName,
            partnerOneName: booking.contactName,
            partnerOneEmail: booking.contactEmail,
            partnerOnePhone: booking.contactPhone,
            partnerTwoName: null,
            partnerTwoEmail: null,
            portalUserId: booking.userId,
            address: booking.destinationCity || "Udaipur",
            notes: `Accepted Booking Project (${booking.weddingType || "Custom"})`,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
          });
        }
      }

      for (const w of weddingProjects) {
        if (w.clientId && !clientMap.has(w.clientId)) {
          clientMap.set(w.clientId, {
            id: w.clientId,
            coupleName: w.clientName || w.title,
            partnerOneName: w.clientName || w.title,
            partnerOneEmail: w.clientEmail,
            partnerOnePhone: w.clientPhone,
            partnerTwoName: null,
            partnerTwoEmail: null,
            portalUserId: null,
            address: "Udaipur",
            notes: `Wedding Project: ${w.title}`,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
          });
        }
      }

      const allClients = Array.from(clientMap.values());
      return successResponse(allClients.length > 0 ? allClients : rows);
    } catch (dbErr: unknown) {
      logDbFallbackWarning("Clients API", dbErr);

      // Offline / dev fallback: include base client + all accepted fallback projects
      const clientMap = new Map<string, any>();

      clientMap.set("client-demo-1", {
        id: "client-demo-1",
        coupleName: "Divya & Knox",
        partnerOneName: "Divya Saxena",
        partnerOneEmail: "divya_saxena@srmap.edu.in",
        partnerOnePhone: "+91 98765 43210",
        partnerTwoName: "Knox",
        partnerTwoEmail: "knox@example.com",
        portalUserId: null,
        address: "Udaipur, Rajasthan",
        notes: "Grand Heritage Palace Wedding (Accepted Project)",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const fallbackRequests = getFallbackBookingRequests();
      for (const req of fallbackRequests) {
        const cId = req.userId || req.id;
        if (!clientMap.has(cId)) {
          clientMap.set(cId, {
            id: cId,
            coupleName: req.coupleName || req.contactName,
            partnerOneName: req.contactName,
            partnerOneEmail: req.contactEmail || "divya_saxena@srmap.edu.in",
            partnerOnePhone: req.contactPhone || "+91 98765 43210",
            partnerTwoName: null,
            partnerTwoEmail: null,
            portalUserId: req.userId,
            address: req.destinationCity || "Udaipur",
            notes: `Project: ${req.weddingType || "Bespoke Royal Wedding"} (${req.status})`,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
          });
        }
      }

      return successResponse(Array.from(clientMap.values()));
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

    return mutationResponse(created, "Client created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
