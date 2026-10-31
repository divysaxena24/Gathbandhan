import { describe, it, expect } from "vitest";

interface CateringInput {
  totalAttendingHeadcount: number;
  bufferPercentage: number;
  allergiesList: string[];
}

export function calculateCateringCommitment(input: CateringInput) {
  const bufferHeadcount = Math.ceil(
    input.totalAttendingHeadcount * (input.bufferPercentage / 100)
  );
  const totalCateringPlatesCommitted =
    input.totalAttendingHeadcount + bufferHeadcount;

  // Anonymized Allergy Matrix
  const allergyMap = new Map<string, number>();
  input.allergiesList.forEach((entry) => {
    if (!entry) return;
    const parts = entry
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    parts.forEach((a) => {
      const normalized =
        a.charAt(0).toUpperCase() + a.slice(1).toLowerCase();
      allergyMap.set(normalized, (allergyMap.get(normalized) || 0) + 1);
    });
  });

  const anonymizedAllergies = Array.from(allergyMap.entries()).map(
    ([allergy, count]) => ({ allergy, count })
  );

  return {
    totalAttendingHeadcount: input.totalAttendingHeadcount,
    bufferPercentage: input.bufferPercentage,
    bufferHeadcount,
    totalCateringPlatesCommitted,
    anonymizedAllergies,
  };
}

describe("Catering Buffer & Confidential Dietary Matrix Engine", () => {
  it("computes exact catering commitments with 5% standard buffer", () => {
    // 350 attending guests with 5% buffer
    const result = calculateCateringCommitment({
      totalAttendingHeadcount: 350,
      bufferPercentage: 5,
      allergiesList: [],
    });

    // 350 * 0.05 = 17.5 => ceil = 18 buffer plates
    expect(result.bufferHeadcount).toBe(18);
    // 350 + 18 = 368 guaranteed plates
    expect(result.totalCateringPlatesCommitted).toBe(368);
  });

  it("handles 10% buffer with clean ceiling rounding", () => {
    // 385 attending guests with 10% buffer
    const result = calculateCateringCommitment({
      totalAttendingHeadcount: 385,
      bufferPercentage: 10,
      allergiesList: [],
    });

    // 385 * 0.10 = 38.5 => ceil = 39 buffer plates
    expect(result.bufferHeadcount).toBe(39);
    expect(result.totalCateringPlatesCommitted).toBe(424);
  });

  it("handles 0% buffer for exact catering without overage", () => {
    const result = calculateCateringCommitment({
      totalAttendingHeadcount: 100,
      bufferPercentage: 0,
      allergiesList: [],
    });

    expect(result.bufferHeadcount).toBe(0);
    expect(result.totalCateringPlatesCommitted).toBe(100);
  });

  it("anonymizes and consolidates critical medical allergies without leaking guest identities", () => {
    const allergiesList = [
      "Peanuts",
      "peanuts, Gluten",
      "Shellfish; Dairy",
      "Gluten, lactose",
      "PEANUTS",
    ];

    const result = calculateCateringCommitment({
      totalAttendingHeadcount: 150,
      bufferPercentage: 5,
      allergiesList,
    });

    const peanuts = result.anonymizedAllergies.find((a) => a.allergy === "Peanuts");
    const gluten = result.anonymizedAllergies.find((a) => a.allergy === "Gluten");
    const shellfish = result.anonymizedAllergies.find((a) => a.allergy === "Shellfish");
    const dairy = result.anonymizedAllergies.find((a) => a.allergy === "Dairy");
    const lactose = result.anonymizedAllergies.find((a) => a.allergy === "Lactose");

    expect(peanuts?.count).toBe(3);
    expect(gluten?.count).toBe(2);
    expect(shellfish?.count).toBe(1);
    expect(dairy?.count).toBe(1);
    expect(lactose?.count).toBe(1);
  });
});

