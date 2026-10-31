export const UserRole = {
  FOUNDER_ADMIN: "FOUNDER_ADMIN",
  PLANNER: "PLANNER",
  FINANCE: "FINANCE",
  ONSITE_COORDINATOR: "ONSITE_COORDINATOR",
  VENDOR: "VENDOR",
  CLIENT: "CLIENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Exhaustive permission map per role */
export const ROLE_PERMISSIONS = {
  FOUNDER_ADMIN: [
    "leads:read", "leads:write", "leads:delete",
    "clients:read", "clients:write",
    "weddings:read", "weddings:write", "weddings:delete",
    "vendors:read", "vendors:write", "vendors:delete",
    "quotations:read", "quotations:write",
    "finance:read", "finance:write", "finance:approve",
    "tasks:read", "tasks:write",
    "control-room:read", "control-room:write",
    "guests:read", "guests:write",
    "analytics:read",
    "settings:read", "settings:write",
    "users:read", "users:write",
    "audit:read",
  ],
  PLANNER: [
    "leads:read", "leads:write",
    "clients:read", "clients:write",
    "weddings:read", "weddings:write",
    "vendors:read",
    "quotations:read", "quotations:write",
    "finance:read",
    "tasks:read", "tasks:write",
    "control-room:read", "control-room:write",
    "guests:read", "guests:write",
    "analytics:read",
  ],
  FINANCE: [
    "weddings:read",
    "vendors:read",
    "quotations:read",
    "finance:read", "finance:write", "finance:approve",
    "audit:read",
  ],
  ONSITE_COORDINATOR: [
    "weddings:read",
    "vendors:read",
    "tasks:read",
    "control-room:read", "control-room:write",
    "guests:read",
  ],
  VENDOR: [
    "weddings:read",      // only assigned weddings
    "control-room:read",  // only own check-in
  ],
  CLIENT: [
    "weddings:read",              // only own wedding
    "guests:read", "guests:write", // own wedding guests
    "finance:read",               // own payment schedule
  ],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number];

/** Check if a role has a specific permission */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] as readonly string[];
  return permissions.includes(permission);
}

/** Check if a role has any of the given permissions */
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
