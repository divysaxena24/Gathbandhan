import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  bookingRequests,
  bookingRequestMessages,
  clients,
  weddings,
  weddingEvents,
  leads,
  leadActivities,
  notifications,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAuth();
    const { id: requestId } = await params;
    const body = await req.json();
    const { action, reviewNotes, internalNotes } = body;

    const [request] = await db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      // 1. Create or retrieve client
      let clientId: string;
      const [existingClient] = await db
        .select()
        .from(clients)
        .where(
          request.contactEmail
            ? eq(clients.partnerOneEmail, request.contactEmail)
            : eq(clients.coupleName, request.coupleName)
        )
        .limit(1);

      if (existingClient) {
        clientId = existingClient.id;
        if (request.userId && !existingClient.portalUserId) {
          await db
            .update(clients)
            .set({ portalUserId: request.userId, updatedAt: new Date() })
            .where(eq(clients.id, clientId));
        }
      } else {
        const [newClient] = await db
          .insert(clients)
          .values({
            coupleName: request.coupleName,
            partnerOneName: request.contactName,
            partnerOneEmail: request.contactEmail,
            partnerOnePhone: request.contactPhone,
            portalUserId: request.userId || null,
            convertedFromLeadId: request.leadId || null,
            notes: `Converted from online booking request #${request.id.slice(0, 8)}`,
          })
          .returning();
        clientId = newClient.id;
      }

      // 2. Create Wedding Record
      const [newWedding] = await db
        .insert(weddings)
        .values({
          clientId,
          title: `The Wedding of ${request.coupleName}`,
          city: request.destinationCity || "Udaipur",
          venue: request.venueType || "Heritage Palace Resort",
          estimatedGuestCount: request.guestCount || 250,
          budgetPaise: request.estimatedBudgetPaise || 0n,
          packageType: "FULL_SERVICE",
          lifecycleStatus: "PLANNING",
          assignedPlannerId: adminUser.id,
          currency: "INR",
          notes: `Bespoke 14-step consultation accepted by ${adminUser.name}. Tradition: ${request.weddingType || "Custom"}. Theme: ${request.theme || "Royal Traditional"}.`,
        })
        .returning();

      // 3. Populate Wedding Events from selected ceremonies
      const ceremonies = (request.ceremonies as any[]) || [];
      if (ceremonies.length > 0) {
        for (const c of ceremonies) {
          const ceremonyName = c.ceremonyName || c.name || "Ceremony";
          const eventType =
            ceremonyName.toLowerCase().includes("sangeet")
              ? "SANGEET"
              : ceremonyName.toLowerCase().includes("mehendi")
              ? "MEHENDI"
              : ceremonyName.toLowerCase().includes("reception")
              ? "RECEPTION"
              : "CEREMONY";

          await db.insert(weddingEvents).values({
            weddingId: newWedding.id,
            name: ceremonyName,
            eventType: eventType as any,
            venue: request.destinationCity || "Main Venue",
            expectedGuestCount: request.guestCount || 250,
            status: "DRAFT",
            notes: `Day ${c.eventDay || 1} • Estimated duration: ${c.estimatedDuration || "3 hours"}`,
          });
        }
      }

      // 4. Update CRM Lead
      if (request.leadId) {
        await db
          .update(leads)
          .set({
            status: "CONVERTED",
            qualificationStatus: "QUALIFIED",
            convertedToClientId: clientId,
            convertedToWeddingId: newWedding.id,
            convertedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, request.leadId));

        await db.insert(leadActivities).values({
          leadId: request.leadId,
          actorId: adminUser.id,
          activityType: "CONVERTED",
          title: "Booking Request Accepted & Converted to Wedding",
          description: `Booking request accepted by ${adminUser.name}. Created Wedding Project: ${newWedding.title}.`,
        });
      }

      // 5. Update Booking Request
      const [updatedRequest] = await db
        .update(bookingRequests)
        .set({
          status: "ACCEPTED",
          weddingId: newWedding.id,
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || "Congratulations! Your wedding consultation has been officially accepted. We are now preparing your comprehensive proposal and timeline.",
          internalNotes: internalNotes || request.internalNotes,
          updatedAt: new Date(),
        })
        .where(eq(bookingRequests.id, requestId))
        .returning();

      // 6. Post acceptance message in thread
      await db.insert(bookingRequestMessages).values({
        bookingRequestId: requestId,
        senderId: adminUser.id,
        senderName: adminUser.name || "Wedding Director",
        senderRole: "PLANNER",
        message: `🎉 Great news! We have accepted your wedding consultation for ${request.destinationCity}. Your dedicated planner has been assigned. You can now track your ceremonies, venue options, and proposal in your Client Portal.`,
        isInternal: false,
      });

      // 7. Dispatch notification if client user exists
      if (request.userId) {
        await db.insert(notifications).values({
          userId: request.userId,
          channel: "IN_APP",
          template: "LEAD_FOLLOW_UP",
          title: "💍 Your Wedding Plan Has Been Accepted!",
          body: `The Royal Knot team has accepted your consultation for ${request.destinationCity}. Check your Client Portal for next steps.`,
          status: "PENDING",
          payload: {
            weddingId: newWedding.id,
            bookingRequestId: requestId,
          },
        });
      }

      return NextResponse.json({
        success: true,
        status: "ACCEPTED",
        weddingId: newWedding.id,
        clientId,
        request: updatedRequest,
      });
    }

    if (action === "CHANGES_REQUESTED") {
      const [updatedRequest] = await db
        .update(bookingRequests)
        .set({
          status: "CHANGES_REQUESTED",
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || "Please review our notes regarding dates and venue availability.",
          internalNotes: internalNotes || request.internalNotes,
          updatedAt: new Date(),
        })
        .where(eq(bookingRequests.id, requestId))
        .returning();

      if (reviewNotes) {
        await db.insert(bookingRequestMessages).values({
          bookingRequestId: requestId,
          senderId: adminUser.id,
          senderName: adminUser.name || "Wedding Designer",
          senderRole: "PLANNER",
          message: `📝 Note from Planner: ${reviewNotes}`,
          isInternal: false,
        });
      }

      return NextResponse.json({ success: true, status: "CHANGES_REQUESTED", request: updatedRequest });
    }

    if (action === "REJECT") {
      const [updatedRequest] = await db
        .update(bookingRequests)
        .set({
          status: "REJECTED",
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || "We are currently fully booked for these dates.",
          internalNotes: internalNotes || request.internalNotes,
          updatedAt: new Date(),
        })
        .where(eq(bookingRequests.id, requestId))
        .returning();

      return NextResponse.json({ success: true, status: "REJECTED", request: updatedRequest });
    }

    if (action === "UPDATE_NOTES") {
      const [updatedRequest] = await db
        .update(bookingRequests)
        .set({
          internalNotes: internalNotes !== undefined ? internalNotes : request.internalNotes,
          reviewNotes: reviewNotes !== undefined ? reviewNotes : request.reviewNotes,
          updatedAt: new Date(),
        })
        .where(eq(bookingRequests.id, requestId))
        .returning();

      return NextResponse.json({ success: true, request: updatedRequest });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/booking-requests/[id]/status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
