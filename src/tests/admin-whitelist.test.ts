import { describe, it, expect } from "vitest";
import {
  isAuthorizedAdminEmail,
  getAuthorizedAdminEmails,
  PRIMARY_ADMIN_EMAIL,
} from "@/lib/auth/admin-whitelist";

describe("Admin Whitelist & Access Control", () => {
  it("primary admin email is configured to karankmt2006@gmail.com", () => {
    expect(PRIMARY_ADMIN_EMAIL).toBe("karankmt2006@gmail.com");
  });

  it("authorizes karankmt2006@gmail.com with exact match", () => {
    expect(isAuthorizedAdminEmail("karankmt2006@gmail.com")).toBe(true);
  });

  it("authorizes karankmt2006@gmail.com case-insensitively with leading/trailing spaces", () => {
    expect(isAuthorizedAdminEmail("  KaranKmt2006@Gmail.Com  ")).toBe(true);
    expect(isAuthorizedAdminEmail("KARANKMT2006@GMAIL.COM")).toBe(true);
  });

  it("denies access to any unauthorized email address", () => {
    expect(isAuthorizedAdminEmail("guest@example.com")).toBe(false);
    expect(isAuthorizedAdminEmail("client@gmail.com")).toBe(false);
    expect(isAuthorizedAdminEmail("hacker@malicious.org")).toBe(false);
    expect(isAuthorizedAdminEmail("karankmt.other@gmail.com")).toBe(false);
  });

  it("handles empty or null or undefined emails safely by returning false", () => {
    expect(isAuthorizedAdminEmail("")).toBe(false);
    expect(isAuthorizedAdminEmail(null)).toBe(false);
    expect(isAuthorizedAdminEmail(undefined)).toBe(false);
    expect(isAuthorizedAdminEmail("   ")).toBe(false);
  });

  it("getAuthorizedAdminEmails includes primary admin email", () => {
    const list = getAuthorizedAdminEmails();
    expect(list).toContain("karankmt2006@gmail.com");
  });
});

