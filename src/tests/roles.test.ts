import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  UserRole,
} from "@/lib/auth/roles";

describe("Role-based access control", () => {
  describe("hasPermission", () => {
    it("grants FOUNDER_ADMIN all permissions", () => {
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "leads:read")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "finance:approve")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "users:write")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "audit:read")).toBe(true);
    });

    it("restricts PLANNER from finance approval", () => {
      expect(hasPermission(UserRole.PLANNER, "leads:read")).toBe(true);
      expect(hasPermission(UserRole.PLANNER, "finance:approve")).toBe(false);
      expect(hasPermission(UserRole.PLANNER, "users:write")).toBe(false);
    });

    it("restricts FINANCE to financial operations", () => {
      expect(hasPermission(UserRole.FINANCE, "finance:read")).toBe(true);
      expect(hasPermission(UserRole.FINANCE, "finance:write")).toBe(true);
      expect(hasPermission(UserRole.FINANCE, "finance:approve")).toBe(true);
      expect(hasPermission(UserRole.FINANCE, "leads:write")).toBe(false);
    });

    it("restricts ONSITE_COORDINATOR to operational tasks", () => {
      expect(hasPermission(UserRole.ONSITE_COORDINATOR, "control-room:read")).toBe(true);
      expect(hasPermission(UserRole.ONSITE_COORDINATOR, "control-room:write")).toBe(true);
      expect(hasPermission(UserRole.ONSITE_COORDINATOR, "finance:write")).toBe(false);
    });

    it("restricts VENDOR to own check-in and assigned weddings", () => {
      expect(hasPermission(UserRole.VENDOR, "weddings:read")).toBe(true);
      expect(hasPermission(UserRole.VENDOR, "control-room:read")).toBe(true);
      expect(hasPermission(UserRole.VENDOR, "finance:read")).toBe(false);
      expect(hasPermission(UserRole.VENDOR, "leads:read")).toBe(false);
    });

    it("restricts CLIENT to own wedding data", () => {
      expect(hasPermission(UserRole.CLIENT, "weddings:read")).toBe(true);
      expect(hasPermission(UserRole.CLIENT, "guests:read")).toBe(true);
      expect(hasPermission(UserRole.CLIENT, "guests:write")).toBe(true);
      expect(hasPermission(UserRole.CLIENT, "finance:read")).toBe(true);
      expect(hasPermission(UserRole.CLIENT, "vendors:read")).toBe(false);
    });

    it("returns false for unknown permission", () => {
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "nonexistent:action")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true if any permission matches", () => {
      expect(
        hasAnyPermission(UserRole.FINANCE, ["leads:write", "finance:read"])
      ).toBe(true);
    });

    it("returns false if no permissions match", () => {
      expect(
        hasAnyPermission(UserRole.VENDOR, ["leads:write", "finance:write"])
      ).toBe(false);
    });
  });
});

