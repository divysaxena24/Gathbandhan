import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  bookingRequests,
  bookingRequestMessages,
  leads,
  leadActivities,
  users,
  notifications,
} from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const clerkUser = clerkUserId ? await currentUser() : null;

    const body = await req.json();
    const { leadName, leadEmail, leadPhone, preferredContactMethod, selections, budget } = body;

    const contactName = (leadName || selections?.contactName || "").trim();
    const contactEmail = (leadEmail || selections?.contactEmail || clerkUser?.emailAddresses?.[0]?.emailAddress || "").trim();
    const contactPhone = (leadPhone || selections?.contactPhone || clerkUser?.phoneNumbers?.[0]?.phoneNumber || "").trim();

    if (!contactName || (!contactEmail && !contactPhone)) {
      return NextResponse.json(
        { error: "Name and at least one contact method (email or phone) are required." },
        { status: 400 }
      );
    }

    // 1. Identify or ensure DB user
    let dbUserId: string | null = null;
    if (clerkUserId) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.authProviderId, clerkUserId),
            contactEmail ? eq(users.email, contactEmail.toLowerCase()) : undefined
          )
        )
        .limit(1);

      if (existingUser) {
        dbUserId = existingUser.id;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            authProviderId: clerkUserId,
            name: contactName,
            email: contactEmail.toLowerCase() || `${clerkUserId}@gathbandhan.internal`,
            phone: contactPhone || null,
            role: "CLIENT",
            avatarUrl: clerkUser?.imageUrl || null,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: {
              authProviderId: clerkUserId,
              updatedAt: new Date(),
            },
          })
          .returning();
        dbUserId = newUser.id;
      }
    }

    // 2. Find planner to notify
    const [assignedPlanner] = await db
      .select()
      .from(users)
      .where(or(eq(users.role, "PLANNER"), eq(users.role, "FOUNDER_ADMIN")))
      .limit(1);

    // 3. Calculate budget in integer paise
    const budgetTotalPaise = budget?.grandTotalInPaise
      ? BigInt(budget.grandTotalInPaise)
      : 0n;

    // 4. Extract structured fields from 14-step form
    const weddingType = selections?.weddingType || "custom";
    const destinationCity =
      selections?.destinationCity || selections?.customCity || selections?.destination || "Udaipur";
    const guestCount =
      typeof selections?.totalGuests === "number"
        ? selections.totalGuests
        : parseInt(selections?.totalGuests) || 250;

    // Construct theme notes summary
    const ceremoniesCount =
      (selections?.selectedCeremonies?.length || 0) + (selections?.customCeremonies?.length || 0);
    const ceremoniesSummary =
      selections?.selectedCeremonies
        ?.map((c: any) => `${c.ceremonyName} (Day ${c.eventDay || 1})`)
        .join(", ") || "None specified";

    const notesSummary = [
      `Tradition: ${weddingType}`,
      `Guests: ${guestCount}`,
      `Destination: ${destinationCity}`,
      `Venue: ${selections?.venueType || "Luxury Heritage Resort"}`,
      `Ceremonies (${ceremoniesCount}): ${ceremoniesSummary}`,
      `Theme: ${selections?.theme || "Royal Traditional"}`,
      `Catering: ${selections?.cateringType || "Full Catering"}`,
      `Budget: ₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}`,
    ].join(" | ");

    // 5. Insert CRM Lead
    const [newLead] = await db
      .insert(leads)
      .values({
        coupleName: contactName,
        partnerOneName: contactName,
        partnerOneEmail: contactEmail || null,
        partnerOnePhone: contactPhone || null,
        source: "CLIENT_PORTAL",
        status: "NEW",
        qualificationStatus: "PENDING",
        city: destinationCity,
        estimatedGuestCount: guestCount,
        estimatedBudgetPaise: budgetTotalPaise,
        themeNotes: notesSummary,
        packageType: "FULL_SERVICE",
        assignedPlannerId: assignedPlanner?.id || null,
        notes: `Online consultation submitted via 14-step wizard. Estimated budget: ₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}`,
      })
      .returning();

    // 6. Insert Lead Activity
    await db.insert(leadActivities).values({
      leadId: newLead.id,
      actorId: assignedPlanner?.id || null,
      activityType: "CREATED",
      title: "Wedding Consultation Request Received",
      description: `Client ${contactName} submitted their 14-step wedding consultation for ${destinationCity}.`,
      metadata: {
        tradition: weddingType,
        ceremoniesCount,
        city: destinationCity,
        grandTotalInPaise: Number(budgetTotalPaise),
      },
    });

    // 7. Insert Booking Request
    const [newBookingRequest] = await db
      .insert(bookingRequests)
      .values({
        userId: dbUserId,
        leadId: newLead.id,
        coupleName: contactName,
        contactName,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        preferredContactMethod: preferredContactMethod || selections?.preferredContactMethod || "whatsapp",
        weddingType,
        regionalTraditions: selections?.regionalTraditions || [],
        ceremonies: selections?.selectedCeremonies || [],
        destination: selections?.destination || "destination",
        destinationCity,
        venueType: selections?.venueType || "Heritage Palace",
        preferredDate: selections?.preferredDate || null,
        dateFlexible: selections?.dateFlexible ?? true,
        durationDays: selections?.duration?.days || 2,
        guestCount,
        guestBreakdown: selections?.guestBreakdown || null,
        theme: selections?.theme || "Royal Rajasthani Heritage",
        decorPreferences: selections?.decorPreferences || [],
        colorPalette: selections?.colorPalette || [],
        cateringType: selections?.cateringType || "Traditional Feast",
        cuisines: selections?.cuisines || [],
        dietaryRestrictions: selections?.dietaryRestrictions || [],
        foodCounters: {
          liveFoodCounters: selections?.liveFoodCounters ?? true,
          dessertCounter: selections?.dessertCounter ?? true,
          beverageCounter: selections?.beverageCounter ?? true,
        },
        photography: selections?.photography || [],
        entertainment: selections?.entertainment || [],
        accommodation: {
          needAccommodation: selections?.needAccommodation ?? true,
          accommodationRooms: selections?.accommodationRooms || 50,
          accommodationNights: selections?.accommodationNights || 2,
          accommodationCategory: selections?.accommodationCategory || "Luxury Suites",
        },
        transportation: selections?.transportation || [],
        additionalServices: selections?.additionalServices || [],
        customRequirements: selections?.customRequirements || null,
        estimatedBudgetPaise: budgetTotalPaise,
        budgetBreakdown: budget?.categories || {},
        fullSelections: selections || {},
        status: "SUBMITTED",
      })
      .returning();

    // 8. Insert initial welcome message
    await db.insert(bookingRequestMessages).values({
      bookingRequestId: newBookingRequest.id,
      senderId: assignedPlanner?.id || null,
      senderName: assignedPlanner?.name || "The Royal Knot Concierge",
      senderRole: "PLANNER",
      message: `Namaste ${contactName}! We have received your 14-step bespoke wedding plan for ${destinationCity}. Our senior wedding architects are reviewing venue availability and crafting your personalized proposal. Feel free to send us any questions here!`,
      isInternal: false,
    });

    // 9. Dispatch notification to planner
    if (assignedPlanner) {
      await db.insert(notifications).values({
        userId: assignedPlanner.id,
        channel: "IN_APP",
        template: "LEAD_FOLLOW_UP",
        title: `💍 New Booking Request: ${contactName}`,
        body: `14-step wedding consultation submitted for ${destinationCity} (₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}). Review and accept in Booking Requests.`,
        status: "PENDING",
        payload: {
          bookingRequestId: newBookingRequest.id,
          leadId: newLead.id,
          coupleName: contactName,
          destinationCity,
          estimatedBudgetPaise: Number(budgetTotalPaise),
        },
      });
    }

    return NextResponse.json({
      success: true,
      bookingRequestId: newBookingRequest.id,
      leadId: newLead.id,
      status: "SUBMITTED",
      message: "Wedding consultation submitted successfully! Redirecting to your wedding portal...",
    });
  } catch (error: any) {
    console.error("POST /api/booking-requests error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit booking request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("id");

    if (requestId) {
      const [request] = await db
        .select()
        .from(bookingRequests)
        .where(eq(bookingRequests.id, requestId))
        .limit(1);

      if (!request) {
        return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
      }

      // Fetch messages
      const messages = await db
        .select()
        .from(bookingRequestMessages)
        .where(eq(bookingRequestMessages.bookingRequestId, requestId))
        .orderBy(bookingRequestMessages.createdAt);

      return NextResponse.json({
        ...request,
        estimatedBudgetPaise: request.estimatedBudgetPaise?.toString() || "0",
        messages,
      });
    }

    // List for admin or user
    const statusFilter = searchParams.get("status");
    let query = db.select().from(bookingRequests);

    if (statusFilter && statusFilter !== "ALL") {
      query = query.where(eq(bookingRequests.status, statusFilter)) as any;
    }

    const allRequests = await query.orderBy(desc(bookingRequests.createdAt)).limit(50);

    return NextResponse.json(
      allRequests.map((r) => ({
        ...r,
        estimatedBudgetPaise: r.estimatedBudgetPaise?.toString() || "0",
      }))
    );
  } catch (error: any) {
    console.error("GET /api/booking-requests error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

