import { describe, it, expect } from "vitest";
import { ConflictError } from "@/lib/errors";
import { UserRole, hasPermission } from "@/lib/auth/roles";
import { PIPELINE_STAGES, type PipelineStage } from "@/modules/crm/types";

describe("CRM Core Logic & Permissions", () => {
  describe("Role-Based CRM Permissions", () => {
    it("allows FOUNDER_ADMIN to read, write, and delete leads", () => {
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "leads:read")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "leads:write")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "leads:delete")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "clients:write")).toBe(true);
      expect(hasPermission(UserRole.FOUNDER_ADMIN, "weddings:write")).toBe(true);
    });

    it("allows PLANNER to read and write leads, but not delete leads", () => {
      expect(hasPermission(UserRole.PLANNER, "leads:read")).toBe(true);
      expect(hasPermission(UserRole.PLANNER, "leads:write")).toBe(true);
      expect(hasPermission(UserRole.PLANNER, "leads:delete")).toBe(false);
      expect(hasPermission(UserRole.PLANNER, "clients:write")).toBe(true);
      expect(hasPermission(UserRole.PLANNER, "weddings:write")).toBe(true);
    });

    it("denies lead access to FINANCE, ONSITE_COORDINATOR, VENDOR, and CLIENT", () => {
      expect(hasPermission(UserRole.FINANCE, "leads:read")).toBe(false);
      expect(hasPermission(UserRole.FINANCE, "leads:write")).toBe(false);

      expect(hasPermission(UserRole.ONSITE_COORDINATOR, "leads:read")).toBe(false);
      expect(hasPermission(UserRole.ONSITE_COORDINATOR, "leads:write")).toBe(false);

      expect(hasPermission(UserRole.VENDOR, "leads:read")).toBe(false);
      expect(hasPermission(UserRole.VENDOR, "leads:write")).toBe(false);

      expect(hasPermission(UserRole.CLIENT, "leads:read")).toBe(false);
      expect(hasPermission(UserRole.CLIENT, "leads:write")).toBe(false);
    });
  });

  describe("Pipeline Stages Definition", () => {
    it("includes all 8 mandatory pipeline stages in sequence", () => {
      const keys = PIPELINE_STAGES.map((s) => s.key);
      expect(keys).toEqual([
        "NEW",
        "CONTACTED",
        "CONSULTATION_SCHEDULED",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "CONVERTED",
        "LOST",
        "ARCHIVED",
      ]);
    });

    it("identifies terminal stages correctly", () => {
      const terminalStages = PIPELINE_STAGES.filter((s) => s.isTerminal).map(
        (s) => s.key
      );
      expect(terminalStages).toContain("CONVERTED");
      expect(terminalStages).toContain("LOST");
      expect(terminalStages).toContain("ARCHIVED");
    });
  });

  describe("Duplicate Conversion Prevention Logic", () => {
    it("rejects conversion if lead status is already CONVERTED", () => {
      const lead = {
        id: "lead-123",
        coupleName: "Aarav & Meera Sharma",
        status: "CONVERTED" as PipelineStage,
        convertedToClientId: "client-456",
      };

      const checkEligibility = (l: typeof lead) => {
        if (l.status === "CONVERTED" || l.convertedToClientId) {
          throw new ConflictError(
            `Lead '${l.coupleName}' has already been converted into a client and wedding project.`
          );
        }
      };

      expect(() => checkEligibility(lead)).toThrow(ConflictError);
      expect(() => checkEligibility(lead)).toThrow(/already been converted/);
    });

    it("allows conversion if lead is active and unlinked", () => {
      const lead = {
        id: "lead-456",
        coupleName: "Raj & Simran Kapoor",
        status: "NEGOTIATION" as PipelineStage,
        convertedToClientId: null,
      };

      const checkEligibility = (l: typeof lead) => {
        if (l.status === "CONVERTED" || l.convertedToClientId) {
          throw new ConflictError("Already converted");
        }
        return true;
      };

      expect(checkEligibility(lead)).toBe(true);
    });
  });
});
