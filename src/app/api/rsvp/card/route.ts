import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  saveCardRsvpResponse,
  getCardRsvpResponses,
  getFallbackBookingRequestById,
} from "@/lib/booking-requests-fallback";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingRequestId = searchParams.get("bookingRequestId");

    if (!bookingRequestId) {
      return NextResponse.json(
        { error: "bookingRequestId query parameter is required" },
        { status: 400 }
      );
    }

    const responses = getCardRsvpResponses(bookingRequestId);
    return NextResponse.json({
      success: true,
      responses,
      count: responses.length,
    });
  } catch (error: any) {
    console.error("GET /api/rsvp/card error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve RSVPs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingRequestId,
      guestName,
      guestPhone,
      guestEmail,
      ceremonies,
      allergies,
      accessibilityNeeds,
    } = body;

    if (!bookingRequestId || !guestName || !guestPhone) {
      return NextResponse.json(
        { error: "Booking request ID, guest name, and phone number are required." },
        { status: 400 }
      );
    }

    // Determine maximum attendees across any ceremony for pass issuance
    const normalizedCeremonies = Array.isArray(ceremonies) ? ceremonies : [];
    let maxAttendees = 0;
    for (const c of normalizedCeremonies) {
      if (c.attending && typeof c.attendeeCount === "number" && c.attendeeCount > maxAttendees) {
        maxAttendees = c.attendeeCount;
      }
    }
    if (maxAttendees === 0) {
      // If none attending, or default
      maxAttendees = normalizedCeremonies.some((c) => c.attending) ? 1 : 0;
    }

    // Generate unique pass token
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const passToken = `GB-PASS-${maxAttendees}PAX-${randomSuffix}`;

    // Get booking request details for title
    const booking = getFallbackBookingRequestById(bookingRequestId);
    const coupleName = booking?.coupleName || "The Royal Wedding";
    const venue = `${booking?.venueType || "Heritage Palace"}, ${booking?.destinationCity || "Udaipur"}`;

    // Construct verifiable QR payload
    const qrPayload = JSON.stringify({
      passType: "GATHBANDHAN_ROYAL_GATE_PASS",
      passToken,
      bookingRequestId,
      couple: coupleName,
      guestName,
      guestPhone,
      maxAttendees,
      venue,
      ceremonyBreakdown: normalizedCeremonies.map((c) => ({
        ceremony: c.ceremonyName,
        attending: c.attending,
        headcount: c.attending ? c.attendeeCount : 0,
      })),
      gateClearance: "AUTHORIZED",
      issuedAt: new Date().toISOString(),
    });

    // Generate High-Resolution QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 480,
      color: {
        dark: "#4A0E17", // Maroon deep
        light: "#FFFFFF",
      },
    });

    const saved = saveCardRsvpResponse({
      bookingRequestId,
      guestName,
      guestPhone,
      guestEmail: guestEmail || null,
      maxAttendees,
      ceremonies: normalizedCeremonies,
      allergies: allergies || null,
      accessibilityNeeds: accessibilityNeeds || null,
      passToken,
      qrPayload,
      qrDataUrl,
    });

    return NextResponse.json({
      success: true,
      message: `Royal RSVP confirmed! Pass generated for ${maxAttendees} people.`,
      pass: saved,
    });
  } catch (error: any) {
    console.error("POST /api/rsvp/card error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit RSVP and generate pass" },
      { status: 500 }
    );
  }
}

