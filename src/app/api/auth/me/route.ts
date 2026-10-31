import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, bookingRequests, clients, weddings } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { getFallbackBookingRequests } from "@/lib/booking-requests-fallback";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ authenticated: false, user: null, role: null });
    }

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
    const cookieRole = req.cookies.get("gathbandhan_role")?.value;

    // 1. Look up user in database
    let dbUser: any = null;
    try {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.authProviderId, userId), eq(users.email, primaryEmail)))
        .limit(1);
      dbUser = foundUser;

      // If user not in DB yet, create user record
      if (!dbUser && clerkUser) {
        const name =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "Gathbandhan Member";

        [dbUser] = await db
          .insert(users)
          .values({
            authProviderId: userId,
            name,
            email: primaryEmail || `${userId}@gathbandhan.internal`,
            phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
            role: (cookieRole as any) || "CLIENT",
            avatarUrl: clerkUser.imageUrl || null,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: {
              authProviderId: userId,
              avatarUrl: clerkUser.imageUrl || null,
              updatedAt: new Date(),
            },
          })
          .returning();
      }
    } catch (dbErr) {
      console.warn("GET /api/auth/me: Database offline, continuing with session defaults:", dbErr);
    }

    if (!dbUser) {
      const activeRole = cookieRole || "CLIENT";
      const fallbackRequests = getFallbackBookingRequests();
      const activeBookingRequestId = fallbackRequests.length > 0 ? fallbackRequests[0].id : null;

      return NextResponse.json({
        authenticated: true,
        user: {
          id: userId,
          name: `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || "Gathbandhan Member",
          email: primaryEmail,
          role: activeRole,
        },
        role: activeRole,
        activeBookingRequestId,
        activeWeddingId: null,
      });
    }

    // 2. Find their active booking request or wedding
    let activeBookingRequestId: string | null = null;
    let activeWeddingId: string | null = null;

    try {
      // Find latest booking request
      const [latestRequest] = await db
        .select({ id: bookingRequests.id, weddingId: bookingRequests.weddingId })
        .from(bookingRequests)
        .where(
          or(
            eq(bookingRequests.userId, dbUser.id),
            eq(bookingRequests.contactEmail, dbUser.email)
          )
        )
        .orderBy(desc(bookingRequests.createdAt))
        .limit(1);

      if (latestRequest) {
        activeBookingRequestId = latestRequest.id;
        activeWeddingId = latestRequest.weddingId || null;
      }

      // If no wedding from request, check clients table
      if (!activeWeddingId) {
        const [clientRecord] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(
            or(
              eq(clients.portalUserId, dbUser.id),
              eq(clients.partnerOneEmail, dbUser.email)
            )
          )
          .limit(1);

        if (clientRecord) {
          const [weddingRecord] = await db
            .select({ id: weddings.id })
            .from(weddings)
            .where(eq(weddings.clientId, clientRecord.id))
            .limit(1);

          if (weddingRecord) {
            activeWeddingId = weddingRecord.id;
          }
        }
      }
    } catch (queryErr) {
      console.warn("GET /api/auth/me: Error querying active booking or wedding:", queryErr);
    }

    if (!activeBookingRequestId) {
      const fallbackRequests = getFallbackBookingRequests();
      if (fallbackRequests.length > 0) {
        activeBookingRequestId = fallbackRequests[0].id;
      }
    }

    const finalRole = cookieRole || dbUser.role;
    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        authProviderId: dbUser.authProviderId,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: finalRole,
        avatarUrl: dbUser.avatarUrl,
      },
      role: finalRole,
      activeBookingRequestId,
      activeWeddingId,
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
