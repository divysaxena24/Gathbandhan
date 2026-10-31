import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { bookingRequests, bookingRequestMessages, users, notifications } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

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

    // Verify booking request exists
    const [request] = await db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Booking request not found." }, { status: 404 });
    }

    // Determine sender
    let senderId: string | null = null;
    let senderName = "Guest";
    let senderRole: "CLIENT" | "PLANNER" = "CLIENT";

    if (clerkUserId) {
      const primaryEmail =
        clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
      const [dbUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.authProviderId, clerkUserId), eq(users.email, primaryEmail)))
        .limit(1);

      if (dbUser) {
        senderId = dbUser.id;
        senderName = dbUser.name;
        senderRole = dbUser.role === "CLIENT" ? "CLIENT" : "PLANNER";
      }
    }

    const [newMessage] = await db
      .insert(bookingRequestMessages)
      .values({
        bookingRequestId: requestId,
        senderId,
        senderName: senderName || "Client",
        senderRole,
        message: message.trim(),
        isInternal: !!isInternal,
      })
      .returning();

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("POST /api/booking-requests/[id]/messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

