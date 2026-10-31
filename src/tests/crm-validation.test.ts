import { describe, it, expect } from "vitest";
import {
  createLeadSchema,
  changeStageSchema,
  convertLeadSchema,
  assignPlannerSchema,
  scheduleFollowUpSchema,
} from "@/modules/crm/validation";

describe("CRM Validation Schemas", () => {
  describe("createLeadSchema", () => {
    it("validates valid lead input", () => {
      const valid = {
        coupleName: "Aarav & Meera Sharma",
        partnerOneName: "Aarav Sharma",
        partnerOneEmail: "aarav@sharma.com",
        partnerOnePhone: "+919876543210",
        city: "Udaipur",
        eventDate: "2027-02-12",
        packageType: "FULL_SERVICE",
        estimatedGuestCount: 400,
        estimatedBudgetPaise: 20000000000n,
      };

      const result = createLeadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails when coupleName is too short", () => {
      const invalid = {
        coupleName: "A",
        partnerOneName: "Aarav Sharma",
      };

      const result = createLeadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("coupleName");
      }
    });

    it("fails when primary contact name is missing", () => {
      const invalid = {
        coupleName: "Aarav & Meera Sharma",
        partnerOneName: "",
      };

      const result = createLeadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("fails when email is improperly formatted", () => {
      const invalid = {
        coupleName: "Aarav & Meera Sharma",
        partnerOneName: "Aarav Sharma",
        partnerOneEmail: "not-an-email",
      };

      const result = createLeadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("partnerOneEmail");
      }
    });

    it("accepts empty optional email and phone", () => {
      const valid = {
        coupleName: "Aarav & Meera Sharma",
        partnerOneName: "Aarav Sharma",
        partnerOneEmail: "",
        partnerOnePhone: "",
      };

      const result = createLeadSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("changeStageSchema", () => {
    it("permits valid pipeline transitions without lostReason when not LOST", () => {
      const result = changeStageSchema.safeParse({
        status: "CONSULTATION_SCHEDULED",
      });
      expect(result.success).toBe(true);
    });

    it("rejects transition to LOST without a lostReason", () => {
      const result = changeStageSchema.safeParse({
        status: "LOST",
        lostReason: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("lostReason");
      }
    });

    it("accepts transition to LOST with a valid lostReason", () => {
      const result = changeStageSchema.safeParse({
        status: "LOST",
        lostReason: "Selected competing planner for Udaipur venue",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = changeStageSchema.safeParse({
        status: "INVALID_STATUS",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("assignPlannerSchema", () => {
    it("accepts valid UUID for planner", () => {
      const result = assignPlannerSchema.safeParse({
        assignedPlannerId: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null to unassign planner", () => {
      const result = assignPlannerSchema.safeParse({
        assignedPlannerId: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const result = assignPlannerSchema.safeParse({
        assignedPlannerId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("scheduleFollowUpSchema", () => {
    it("accepts valid datetime string and notes", () => {
      const result = scheduleFollowUpSchema.safeParse({
        nextFollowUpAt: "2027-01-15T15:00:00Z",
        notes: "Discuss sangeet choreographer selection",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty datetime string", () => {
      const result = scheduleFollowUpSchema.safeParse({
        nextFollowUpAt: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("convertLeadSchema", () => {
    it("validates complete conversion payload", () => {
      const result = convertLeadSchema.safeParse({
        weddingTitle: "Sharma Royal Destination Wedding",
        startDate: "2027-02-12",
        endDate: "2027-02-14",
        city: "Udaipur",
        venue: "Taj Lake Palace",
        packageType: "FULL_SERVICE",
        budgetPaise: 20000000000n,
        estimatedGuestCount: 400,
        notes: "Anchor luxury celebration",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing wedding title or invalid date format", () => {
      const result = convertLeadSchema.safeParse({
        weddingTitle: "",
        startDate: "invalid-date",
        endDate: "2027-02-14",
        city: "Udaipur",
      });
      expect(result.success).toBe(false);
    });
  });
});

