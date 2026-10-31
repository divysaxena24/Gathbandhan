import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { bookingRequestMessages, users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { addFallbackMessage } from "@/lib/booking-requests-fallback";

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

    let senderId: string | null = null;
    let senderName =
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      clerkUser?.username ||
      "Client";
    let senderRole: "CLIENT" | "PLANNER" = "CLIENT";

    // 1. Try DB operations if available
    try {
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

      // Sync with in-memory fallback
      addFallbackMessage(requestId, {
        senderId,
        senderName,
        senderRole,
        message: message.trim(),
        isInternal: !!isInternal,
      });

      return NextResponse.json({ success: true, message: newMessage });
    } catch (dbErr) {
      console.warn("Could not save booking message to DB (database may be offline or starting):", dbErr);
    }

    // 2. Fallback in-memory save
    const fallbackMsg = addFallbackMessage(requestId, {
      senderId: clerkUserId || null,
      senderName,
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
