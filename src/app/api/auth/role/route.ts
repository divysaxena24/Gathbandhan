import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !["CLIENT", "PLANNER", "FOUNDER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified. Must be CLIENT, PLANNER, or FOUNDER_ADMIN." },
        { status: 400 }
      );
    }

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
    const name =
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      "Gathbandhan Member";

    // Update or insert user with chosen role
    try {
      const [updatedUser] = await db
        .insert(users)
        .values({
          authProviderId: userId,
          name,
          email: primaryEmail || `${userId}@gathbandhan.internal`,
          phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || null,
          role: role as any,
          avatarUrl: clerkUser?.imageUrl || null,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            role: role as any,
            authProviderId: userId,
            avatarUrl: clerkUser?.imageUrl || null,
            updatedAt: new Date(),
          },
        })
        .returning();

      const res = NextResponse.json({
        success: true,
        role: updatedUser.role,
        user: updatedUser,
      });
      res.cookies.set("gathbandhan_role", role, { path: "/", maxAge: 2592000, sameSite: "lax" });
      return res;
    } catch (dbError) {
      console.warn("POST /api/auth/role: Database offline, defaulting gracefully:", dbError);
      const res = NextResponse.json({
        success: true,
        role,
        user: { id: userId, email: primaryEmail, role, name },
      });
      res.cookies.set("gathbandhan_role", role, { path: "/", maxAge: 2592000, sameSite: "lax" });
      return res;
    }
  } catch (error: any) {
    console.error("POST /api/auth/role error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

