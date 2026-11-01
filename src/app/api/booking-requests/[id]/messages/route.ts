import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, logDbFallbackWarning } from "@/lib/db";
import { bookingRequestMessages, users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { addFallbackMessage, getFallbackBookingRequestById } from "@/lib/booking-requests-fallback";
import { isAuthorizedAdminEmail } from "@/lib/auth/admin-whitelist";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ error: "Missing request ID." }, { status: 400 });
    }

    // 1. Try DB fetch first
    try {
      const dbMessages = await db
        .select()
        .from(bookingRequestMessages)
        .where(eq(bookingRequestMessages.bookingRequestId, requestId))
        .orderBy(bookingRequestMessages.createdAt);

      if (dbMessages && dbMessages.length > 0) {
        return NextResponse.json({
          success: true,
          messages: dbMessages,
        });
      }
    } catch (dbErr) {
      logDbFallbackWarning("Booking Messages GET API", dbErr);
    }

    // 2. Fallback to in-memory store
    const fallback = getFallbackBookingRequestById(requestId);
    return NextResponse.json({
      success: true,
      messages: fallback?.messages || [],
    });
  } catch (error: any) {
    console.error("GET /api/booking-requests/[id]/messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const { userId: clerkUserId } = await auth();
    const clerkUser = clerkUserId ? await currentUser() : null;

    const body = await req.json();
    const { message, isInternal } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const primaryEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
    const isPlannerAdmin = isAuthorizedAdminEmail(primaryEmail);

    let senderId: string | null = null;
    let senderName =
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      clerkUser?.username ||
      (isPlannerAdmin ? "Wedding Planner" : "Client");
    let senderRole: "CLIENT" | "PLANNER" = isPlannerAdmin ? "PLANNER" : "CLIENT";

    // 1. Try DB operations if available
    try {
      if (clerkUserId) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(or(eq(users.authProviderId, clerkUserId), eq(users.email, primaryEmail)))
          .limit(1);

        if (dbUser) {
          senderId = dbUser.id;
          if (dbUser.name) senderName = dbUser.name;
          if (isPlannerAdmin || dbUser.role === "FOUNDER_ADMIN" || dbUser.role === "PLANNER") {
            senderRole = "PLANNER";
          } else {
            senderRole = dbUser.role === "CLIENT" ? "CLIENT" : "PLANNER";
          }
        }
      }

      const [newMessage] = await db
        .insert(bookingRequestMessages)
        .values({
          bookingRequestId: requestId,
          senderId,
          senderName: senderName || (senderRole === "PLANNER" ? "Wedding Planner" : "Client"),
          senderRole,
          message: message.trim(),
          isInternal: !!isInternal,
        })
        .returning();

      // Sync with in-memory fallback
      addFallbackMessage(requestId, {
        senderId,
        senderName: senderName || (senderRole === "PLANNER" ? "Wedding Planner" : "Client"),
        senderRole,
        message: message.trim(),
        isInternal: !!isInternal,
      });

      return NextResponse.json({ success: true, message: newMessage });
    } catch (dbErr) {
      logDbFallbackWarning("Booking Messages API", dbErr);
    }

    // 2. Fallback in-memory save
    const fallbackMsg = addFallbackMessage(requestId, {
      senderId: clerkUserId || null,
      senderName: senderName || (senderRole === "PLANNER" ? "Wedding Planner" : "Client"),
      senderRole,
      message: message.trim(),
      isInternal: !!isInternal,
    });

    return NextResponse.json({ success: true, message: fallbackMsg });
  } catch (error: any) {
    console.error("POST /api/booking-requests/[id]/messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
