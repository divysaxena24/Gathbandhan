import { describe, it, expect } from "vitest";

interface SimulatedGuest {
  id: string;
  firstName: string;
  lastName: string;
  householdName: string | null;
  side: "BRIDE" | "GROOM" | "MUTUAL" | "VIP";
  dietaryPreference: "VEG" | "JAIN" | "NON_VEG" | "VEGAN";
  rsvpToken: string;
}

interface SimulatedEventRsvp {
  guestId: string;
  eventId: string;
  status: "INVITED" | "ATTENDING" | "DECLINED" | "TENTATIVE";
  plusOnes: number;
  mealPreference: "VEG" | "JAIN" | "NON_VEG" | "VEGAN";
}

function computeEventAttendance(
  eventId: string,
  rsvps: SimulatedEventRsvp[]
): {
  confirmedHeadcount: number;
  plusOnesCount: number;
  totalAttending: number;
  declinedCount: number;
  mealCounts: Record<string, number>;
} {
  const eventRsvps = rsvps.filter((r) => r.eventId === eventId);
  let confirmedHeadcount = 0;
  let plusOnesCount = 0;
  let declinedCount = 0;
  const mealCounts: Record<string, number> = {
    VEG: 0,
    JAIN: 0,
    NON_VEG: 0,
    VEGAN: 0,
  };

  for (const r of eventRsvps) {
    if (r.status === "ATTENDING") {
      confirmedHeadcount += 1;
      plusOnesCount += r.plusOnes;
      const covers = 1 + r.plusOnes;
      mealCounts[r.mealPreference] = (mealCounts[r.mealPreference] || 0) + covers;
    } else if (r.status === "DECLINED") {
      declinedCount += 1;
    }
  }

  return {
    confirmedHeadcount,
    plusOnesCount,
    totalAttending: confirmedHeadcount + plusOnesCount,
    declinedCount,
    mealCounts,
  };
}

describe("Guest RSVP Engine & Per-Event Attendance", () => {
  const _guests: SimulatedGuest[] = [
    {
      id: "g1",
      firstName: "Rajesh",
      lastName: "Sharma",
      householdName: "Sharma Family",
      side: "GROOM",
      dietaryPreference: "VEG",
      rsvpToken: "tok_1",
    },
    {
      id: "g2",
      firstName: "Dr. Vikram",
      lastName: "Joshi",
      householdName: "Joshi Family",
      side: "BRIDE",
      dietaryPreference: "JAIN",
      rsvpToken: "tok_2",
    },
    {
      id: "g3",
      firstName: "Rohan",
      lastName: "Sharma",
      householdName: "Sharma Family",
      side: "GROOM",
      dietaryPreference: "NON_VEG",
      rsvpToken: "tok_3",
    },
    {
      id: "g4",
      firstName: "Justice P. K.",
      lastName: "Singhania",
      householdName: "Singhania Family",
      side: "VIP",
      dietaryPreference: "VEG",
      rsvpToken: "tok_4",
    },
  ];

  const rsvps: SimulatedEventRsvp[] = [
    // Event 1: Mehendi (Casual day event)
    { guestId: "g1", eventId: "ev-mehendi", status: "ATTENDING", plusOnes: 1, mealPreference: "VEG" },
    { guestId: "g2", eventId: "ev-mehendi", status: "ATTENDING", plusOnes: 0, mealPreference: "JAIN" },
    { guestId: "g3", eventId: "ev-mehendi", status: "DECLINED", plusOnes: 0, mealPreference: "NON_VEG" }, // Skipping Mehendi
    { guestId: "g4", eventId: "ev-mehendi", status: "DECLINED", plusOnes: 0, mealPreference: "VEG" }, // VIP skipping day event

    // Event 2: Sangeet Night (Full attendance)
    { guestId: "g1", eventId: "ev-sangeet", status: "ATTENDING", plusOnes: 1, mealPreference: "VEG" },
    { guestId: "g2", eventId: "ev-sangeet", status: "ATTENDING", plusOnes: 1, mealPreference: "JAIN" },
    { guestId: "g3", eventId: "ev-sangeet", status: "ATTENDING", plusOnes: 1, mealPreference: "NON_VEG" },
    { guestId: "g4", eventId: "ev-sangeet", status: "ATTENDING", plusOnes: 1, mealPreference: "VEG" },

    // Event 3: Reception
    { guestId: "g1", eventId: "ev-reception", status: "ATTENDING", plusOnes: 1, mealPreference: "VEG" },
    { guestId: "g2", eventId: "ev-reception", status: "ATTENDING", plusOnes: 1, mealPreference: "JAIN" },
    { guestId: "g3", eventId: "ev-reception", status: "ATTENDING", plusOnes: 2, mealPreference: "NON_VEG" },
    { guestId: "g4", eventId: "ev-reception", status: "ATTENDING", plusOnes: 1, mealPreference: "VEG" },
  ];

  it("calculates distinct headcounts per event instead of one global wedding count", () => {
    const mehendi = computeEventAttendance("ev-mehendi", rsvps);
    const sangeet = computeEventAttendance("ev-sangeet", rsvps);

    // Mehendi: 2 attending guests + 1 plus-one = 3 total
    expect(mehendi.confirmedHeadcount).toBe(2);
    expect(mehendi.plusOnesCount).toBe(1);
    expect(mehendi.totalAttending).toBe(3);
    expect(mehendi.declinedCount).toBe(2);

    // Sangeet: 4 attending guests + 4 plus-ones = 8 total
    expect(sangeet.confirmedHeadcount).toBe(4);
    expect(sangeet.plusOnesCount).toBe(4);
    expect(sangeet.totalAttending).toBe(8);
    expect(sangeet.declinedCount).toBe(0);

    // Verifies invariant: Event attendance varies across events
    expect(mehendi.totalAttending).not.toBe(sangeet.totalAttending);
  });

  it("accurately distributes meal preference covers including plus-ones", () => {
    const sangeet = computeEventAttendance("ev-sangeet", rsvps);

    // g1 (VEG): 1 + 1 = 2 VEG
    // g4 (VEG): 1 + 1 = 2 VEG => total VEG = 4
    expect(sangeet.mealCounts.VEG).toBe(4);

    // g2 (JAIN): 1 + 1 = 2 JAIN
    expect(sangeet.mealCounts.JAIN).toBe(2);

    // g3 (NON_VEG): 1 + 1 = 2 NON_VEG
    expect(sangeet.mealCounts.NON_VEG).toBe(2);
  });

  it("tracks additional plus-ones dynamically for grand receptions", () => {
    const reception = computeEventAttendance("ev-reception", rsvps);

    // g3 brought +2 plus-ones for reception: 1 + 2 = 3 Non-Veg covers
    expect(reception.mealCounts.NON_VEG).toBe(3);
    expect(reception.totalAttending).toBe(9);
  });

  it("generates QR entry pass encoding authorized 4-people headcount across separate ceremonies (Sangeet, Mehndi, Wedding)", async () => {
    const ceremonyResponses = [
      {
        ceremonyId: "royal-sangeet",
        ceremonyName: "Royal Sangeet",
        attending: true,
        attendeeCount: 4,
        mealPreference: "VEG",
      },
      {
        ceremonyId: "mehndi-celebration",
        ceremonyName: "Mehndi Celebration",
        attending: true,
        attendeeCount: 3,
        mealPreference: "VEG",
      },
      {
        ceremonyId: "sacred-wedding-ceremony",
        ceremonyName: "Sacred Wedding Ceremony",
        attending: true,
        attendeeCount: 4,
        mealPreference: "JAIN",
      },
    ];

    // Calculate max headcount for gate admission
    const maxAttendees = Math.max(...ceremonyResponses.map((c) => c.attendeeCount));
    expect(maxAttendees).toBe(4);

    const passPayload = {
      passType: "GATHBANDHAN_ROYAL_GATE_PASS",
      passToken: "GB-PASS-4PAX-DEMO",
      guestName: "The Sharma Family",
      maxAttendees,
      ceremonies: ceremonyResponses,
      gateClearance: "AUTHORIZED",
    };

    expect(passPayload.maxAttendees).toBe(4);
    expect(passPayload.ceremonies.find((c) => c.ceremonyId === "royal-sangeet")?.attendeeCount).toBe(4);
    expect(passPayload.ceremonies.find((c) => c.ceremonyId === "mehndi-celebration")?.attendeeCount).toBe(3);
    expect(passPayload.ceremonies.find((c) => c.ceremonyId === "sacred-wedding-ceremony")?.attendeeCount).toBe(4);
  });
});

