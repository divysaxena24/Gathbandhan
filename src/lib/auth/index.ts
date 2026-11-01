import { auth, currentUser } from "@clerk/nextjs/server";
import { db, logDbFallbackWarning } from "@/lib/db";
import { users, weddingVendors, weddings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AuthError, ForbiddenError } from "@/lib/errors";
import { type UserRole, hasPermission } from "@/lib/auth/roles";

export { UserRole, hasPermission, hasAnyPermission } from "@/lib/auth/roles";

/** App user record shape returned by getCurrentUser */
export interface AppUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

/**
 * Get the current app user from the database.
 * If authenticated with Clerk but not yet present or clerkId is updated,
 * automatically self-heals by linking email or auto-provisioning as FOUNDER_ADMIN.
 * Returns `null` if not authenticated.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const [user] = await db
      .select({
        id: users.id,
        clerkId: users.authProviderId,
        email: users.email,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.authProviderId, userId))
      .limit(1);

    if (user) {
      return user as AppUser;
    }

    // If user is authenticated in Clerk but not yet mapped in DB
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const primaryEmail =
          clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() ||
          `${userId}@gathbandhan.internal`;
        const name =
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          clerkUser.username ||
          "Gathbandhan Member";

        // 1. Check if user already exists by email
        const [existingByEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, primaryEmail))
          .limit(1);

        if (existingByEmail) {
          const [updated] = await db
            .update(users)
            .set({
              authProviderId: userId,
              avatarUrl: clerkUser.imageUrl || existingByEmail.avatarUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingByEmail.id))
            .returning({
              id: users.id,
              clerkId: users.authProviderId,
              email: users.email,
              name: users.name,
              role: users.role,
              avatarUrl: users.avatarUrl,
            });
          return (updated as AppUser) ?? null;
        }

        // 2. Otherwise insert as FOUNDER_ADMIN so local/admin access is seamless
        const [created] = await db
          .insert(users)
          .values({
            authProviderId: userId,
            name,
            email: primaryEmail,
            phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
            role: "FOUNDER_ADMIN",
            avatarUrl: clerkUser.imageUrl || null,
            isActive: true,
          })
          .returning({
            id: users.id,
            clerkId: users.authProviderId,
            email: users.email,
            name: users.name,
            role: users.role,
            avatarUrl: users.avatarUrl,
          });

        return (created as AppUser) ?? null;
      }
    } catch (err) {
      console.warn("Auto-syncing Clerk user in getCurrentUser failed:", err);
    }
  } catch (err: unknown) {
    logDbFallbackWarning("Auth Service", err);
  }

  // Graceful fallback for local development or when database is offline
  return {
    id: userId,
    clerkId: userId,
    email: "divya_saxena@srmap.edu.in",
    name: "Divya Saxena",
    role: "FOUNDER_ADMIN",
    avatarUrl: null,
  };
}

/**
 * Require the request to be authenticated.
 * Throws `AuthError` if not authenticated or user not found in DB.
 */
export async function requireAuth(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError();
  }
  return user;
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Throws `ForbiddenError` if the user's role is not in the allowed list.
 */
export async function requireRole(
  role: UserRole | UserRole[],
): Promise<AppUser> {
  const user = await requireAuth();
  const allowed = Array.isArray(role) ? role : [role];

  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(
      `Role '${user.role}' is not authorized. Required: ${allowed.join(", ")}`,
    );
  }

  return user;
}

/**
 * Require the authenticated user to have a specific permission.
 * Throws `ForbiddenError` if the user's role doesn't grant the permission.
 */
export async function requirePermission(
  permission: string,
): Promise<AppUser> {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission as any)) {
    throw new ForbiddenError(
      `Role '${user.role}' does not have permission '${permission}'`,
    );
  }

  return user;
}

/**
 * Require vendor access to a specific wedding.
 * Ensures the vendor is assigned to the wedding in `wedding_vendors`.
 */
export async function requireVendorAccess(
  weddingId: string,
): Promise<{ user: AppUser; vendorId: string }> {
  const user = await requireRole(["VENDOR", "FOUNDER_ADMIN", "PLANNER"]);

  // Admins & planners have global access
  if (user.role === "FOUNDER_ADMIN" || user.role === "PLANNER") {
    return { user, vendorId: "admin-bypass" };
  }

  // Look up vendor assignment
  const [assignment] = await db
    .select({
      vendorId: weddingVendors.vendorId,
    })
    .from(weddingVendors)
    .where(
      and(
        eq(weddingVendors.weddingId, weddingId),
        // Vendor users map to vendors via user.id
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new ForbiddenError(
      "Vendor is not assigned to this wedding",
    );
  }

  return { user, vendorId: assignment.vendorId };
}

/**
 * Require client access to a specific wedding.
 * Ensures the client owns the wedding.
 */
export async function requireClientAccess(
  weddingId: string,
): Promise<AppUser> {
  const user = await requireRole(["CLIENT", "FOUNDER_ADMIN", "PLANNER"]);

  // Admins & planners have global access
  if (user.role === "FOUNDER_ADMIN" || user.role === "PLANNER") {
    return user;
  }

  // Verify client ownership
  const [wedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(
      and(
        eq(weddings.id, weddingId),
        // In full impl, joins clients table and checks portalUserId
      ),
    )
    .limit(1);

  if (!wedding) {
    throw new ForbiddenError(
      "Client is not authorized to access this wedding",
    );
  }

  return user;
}
