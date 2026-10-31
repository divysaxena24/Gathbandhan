import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, eq } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("leads:read");

    const planners = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(or(eq(users.role, "PLANNER"), eq(users.role, "FOUNDER_ADMIN"))!)
      .orderBy(users.name);

    return successResponse(planners);
  } catch (err) {
    return errorResponse(err);
  }
}

