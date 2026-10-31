import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadActivities, users, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadName, leadEmail, leadPhone, selections, budget } = body;

    if (!leadName || (!leadEmail && !leadPhone)) {
      return NextResponse.json(
        { error: "Name and at least one contact method (email or phone) are required." },
        { status: 400 }
      );
    }

    // Find the lead planner to assign and notify
    const plannerUsers = await db.select().from(users).limit(1);
    const assignedPlanner = plannerUsers[0] || null;

    // Build human-readable theme notes from selections
    const ceremoniesCount =
      (selections?.selectedCeremonies?.length || 0) + (selections?.customCeremonies?.length || 0);
    const ceremoniesSummary = selections?.selectedCeremonies
      ?.map((c: { ceremonyName: string; eventDay?: number }) => `${c.ceremonyName} (Day ${c.eventDay || 1})`)
      .join(", ") || "None specified";

    const budgetTotalPaise = budget?.grandTotalInPaise
      ? BigInt(budget.grandTotalInPaise)
      : 0n;

    const notesSummary = [
      `Tradition: ${selections?.weddingType || "Custom"}`,
      `Estimated Guests: ${selections?.totalGuests || selections?.guestRange || "250"}`,
      `Destination / City: ${selections?.destinationCity || selections?.destination || "Not Decided"}`,
      `Venue Type: ${selections?.venueType || "Luxury Resort"}`,
      `Selected Ceremonies (${ceremoniesCount}): ${ceremoniesSummary}`,
      `Decor Theme: ${selections?.decorTheme || "Royal Traditional"}`,
      `Catering: ${selections?.cateringType || "Vegetarian & Non-Vegetarian"} (${selections?.cuisines?.join(", ") || "Multi-cuisine"})`,
      `Photography: ${selections?.photography?.join(", ") || "Standard Coverage"}`,
      `Entertainment: ${selections?.entertainment?.join(", ") || "Live Music"}`,
      `Estimated Budget: ₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}`,
    ].join(" | ");

    // 1. Insert new Lead
    const [newLead] = await db
      .insert(leads)
      .values({
        coupleName: leadName.trim(),
        partnerOneName: leadName.trim(),
        partnerOneEmail: leadEmail ? leadEmail.trim() : null,
        partnerOnePhone: leadPhone ? leadPhone.trim() : null,
        source: "CLIENT_PORTAL",
        status: "NEW",
        qualificationStatus: "PENDING",
        city: selections?.destinationCity || selections?.destination || "Udaipur",
        estimatedGuestCount: parseInt(selections?.totalGuests) || 250,
        estimatedBudgetPaise: budgetTotalPaise,
        themeNotes: notesSummary,
        packageType: "FULL_SERVICE",
        assignedPlannerId: assignedPlanner?.id || null,
        notes: `Client online consultation submitted through Gathbandhan Client Experience. Total Estimated Budget: ₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}`,
      })
      .returning();

    // 2. Insert Lead Activity
    await db.insert(leadActivities).values({
      leadId: newLead.id,
      actorId: assignedPlanner?.id || null,
      activityType: "CREATED",
      title: "Online Wedding Consultation Received",
      description: `Client ${newLead.coupleName} submitted their bespoke wedding plan for ${newLead.city}. Estimated Budget: ₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}.`,
      metadata: {
        tradition: selections?.weddingType,
        ceremoniesCount,
        city: newLead.city,
        grandTotalInPaise: Number(budgetTotalPaise),
      },
    });

    // 3. Dispatch Notification to Planner
    if (assignedPlanner) {
      await db.insert(notifications).values({
        userId: assignedPlanner.id,
        channel: "IN_APP",
        template: "LEAD_FOLLOW_UP",
        title: `💍 New Wedding Booking Request: ${newLead.coupleName}`,
        body: `New client enquiry received for ${newLead.city} with estimated investment of ₹${(Number(budgetTotalPaise) / 100).toLocaleString("en-IN")}. Review in Leads CRM.`,
        status: "PENDING",
        payload: {
          leadId: newLead.id,
          coupleName: newLead.coupleName,
          city: newLead.city,
          estimatedBudgetPaise: Number(budgetTotalPaise),
        },
      });
    }

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      message: "Consultation booked successfully. Your wedding designer will reach out shortly.",
    });
  } catch (error: any) {
    console.error("Client consultation submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit consultation" },
      { status: 500 }
    );
  }
}

