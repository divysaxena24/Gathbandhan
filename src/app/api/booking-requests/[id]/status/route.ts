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
import { updateFallbackBookingRequestStatus, addFallbackMessage } from "@/lib/booking-requests-fallback";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAuth();
    const { id: requestId } = await params;
    const body = await req.json();
    const { action, reviewNotes, internalNotes } = body;

    // 1. Try DB operations
    try {
      const [request] = await db
        .select()
        .from(bookingRequests)
        .where(eq(bookingRequests.id, requestId))
        .limit(1);

      if (request) {
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
                  : ceremonyName.toLowerCase().includes("haldi")
                  ? "HALDI"
                  : ceremonyName.toLowerCase().includes("pheras") || ceremonyName.toLowerCase().includes("vows")
                  ? "WEDDING_CEREMONY"
                  : ceremonyName.toLowerCase().includes("reception")
                  ? "RECEPTION"
                  : "OTHER";

              const eventDateStr = request.preferredDate || new Date().toISOString().split("T")[0];
              await db.insert(weddingEvents).values({
                weddingId: newWedding.id,
                name: ceremonyName,
                eventType: eventType as any,
                startsAt: new Date(`${eventDateStr}T18:00:00Z`),
                endsAt: new Date(`${eventDateStr}T22:00:00Z`),
                venue: request.venueType || "Grand Ballroom",
                expectedGuestCount: request.guestCount || 250,
                status: "CONFIRMED",
                notes: c.culturalSignificance || null,
              });
            }
          }

          // 4. Update lead status if exists
          if (request.leadId) {
            await db
              .update(leads)
              .set({
                status: "CONVERTED",
                qualificationStatus: "QUALIFIED",
                updatedAt: new Date(),
              })
              .where(eq(leads.id, request.leadId));

            await db.insert(leadActivities).values({
              leadId: request.leadId,
              actorId: adminUser.id,
              activityType: "STATUS_CHANGE",
              title: "Consultation Booking Accepted",
              description: `Booking request accepted by ${adminUser.name}. Wedding project initialized.`,
            });
          }

          // 5. Update Booking Request Status
          const [updatedRequest] = await db
            .update(bookingRequests)
            .set({
              status: "ACCEPTED",
              weddingId: newWedding.id,
              reviewedBy: adminUser.id,
              reviewedAt: new Date(),
              reviewNotes: reviewNotes || null,
              internalNotes: internalNotes || null,
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

          updateFallbackBookingRequestStatus(requestId, "ACCEPTED", reviewNotes);

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

          updateFallbackBookingRequestStatus(requestId, "CHANGES_REQUESTED", reviewNotes);

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

          updateFallbackBookingRequestStatus(requestId, "REJECTED", reviewNotes);

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
      }
    } catch (dbErr) {
      console.warn("Could not process booking status update in DB (database may be offline or starting):", dbErr);
    }

    // 2. Fallback in-memory status update
    const targetStatus =
      action === "ACCEPT"
        ? "ACCEPTED"
        : action === "REJECT"
        ? "REJECTED"
        : action === "CHANGES_REQUESTED"
        ? "CHANGES_REQUESTED"
        : "SUBMITTED";

    const updatedFallback = updateFallbackBookingRequestStatus(requestId, targetStatus, reviewNotes);

    if (action === "ACCEPT") {
      addFallbackMessage(requestId, {
        senderId: adminUser.id,
        senderName: adminUser.name || "Wedding Director",
        senderRole: "PLANNER",
        message:
          "🎉 Great news! We have accepted your wedding consultation. Your dedicated planner has been assigned. You can now track your ceremonies, venue options, and proposal in your Client Portal.",
        isInternal: false,
      });
    } else if (action === "CHANGES_REQUESTED" && reviewNotes) {
      addFallbackMessage(requestId, {
        senderId: adminUser.id,
        senderName: adminUser.name || "Wedding Designer",
        senderRole: "PLANNER",
        message: `📝 Note from Planner: ${reviewNotes}`,
        isInternal: false,
      });
    }

    return NextResponse.json({
      success: true,
      status: targetStatus,
      weddingId: "fallback_wedding_" + requestId,
      clientId: "fallback_client_" + requestId,
      request: updatedFallback,
    });
  } catch (error: any) {
    console.error("POST /api/booking-requests/[id]/status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
