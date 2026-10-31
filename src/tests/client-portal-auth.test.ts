import crypto from "crypto";
import { describe, it, expect } from "vitest";

interface SimulatedUser {
  id: string;
  email: string;
  role: "FOUNDER_ADMIN" | "PLANNER" | "FINANCE" | "CLIENT";
}

interface SimulatedWeddingClient {
  weddingId: string;
  portalUserId: string;
  clientEmail: string;
}

function verifyClientPortalAccess(
  user: SimulatedUser,
  wedding: SimulatedWeddingClient
): boolean {
  // Founders and Planners have global oversight
  if (user.role === "FOUNDER_ADMIN" || user.role === "PLANNER") {
    return true;
  }

  // Client role must own this specific wedding
  if (user.role === "CLIENT") {
    return (
      user.id === wedding.portalUserId ||
      user.email.toLowerCase() === wedding.clientEmail.toLowerCase()
    );
  }

  return false;
}

function generateTamperEvidentSignature(
  agreementId: string,
  totalAmountPaise: bigint,
  signerName: string,
  signerEmail: string,
  signedAtIso: string
): { signatureEvidence: string; documentHash: string } {
  const signatureEvidence = `ELECTRONIC ACCEPTANCE by ${signerName} (${signerEmail}) via Gathbandhan Portal on ${signedAtIso}`;
  const documentHash = crypto
    .createHash("sha256")
    .update(`${agreementId}:${totalAmountPaise}:${signatureEvidence}`)
    .digest("hex");

  return { signatureEvidence, documentHash };
}

describe("Client Portal Security Boundary & Electronic Agreements", () => {
  const wedding1: SimulatedWeddingClient = {
    weddingId: "w-sharma-1",
    portalUserId: "usr-aarav-sharma",
    clientEmail: "aarav.sharma@email.com",
  };

  const wedding2: SimulatedWeddingClient = {
    weddingId: "w-kapoor-2",
    portalUserId: "usr-vikram-kapoor",
    clientEmail: "vikram.kapoor@email.com",
  };

  it("permits planner and founder to view client portals for coordination", () => {
    const founder: SimulatedUser = {
      id: "u-founder",
      email: "priya@gathbandhan.com",
      role: "FOUNDER_ADMIN",
    };
    const planner: SimulatedUser = {
      id: "u-planner",
      email: "ananya@gathbandhan.com",
      role: "PLANNER",
    };

    expect(verifyClientPortalAccess(founder, wedding1)).toBe(true);
    expect(verifyClientPortalAccess(planner, wedding2)).toBe(true);
  });

  it("permits couple to access their own wedding portal", () => {
    const coupleUser: SimulatedUser = {
      id: "usr-aarav-sharma",
      email: "aarav.sharma@email.com",
      role: "CLIENT",
    };

    expect(verifyClientPortalAccess(coupleUser, wedding1)).toBe(true);
  });

  it("STRICT PRIVACY: blocks client from accessing another couple's wedding portal", () => {
    const maliciousClient: SimulatedUser = {
      id: "usr-vikram-kapoor",
      email: "vikram.kapoor@email.com",
      role: "CLIENT",
    };

    // Attempting to access Sharma wedding with Kapoor credentials
    const hasAccess = verifyClientPortalAccess(maliciousClient, wedding1);
    expect(hasAccess).toBe(false);
  });

  it("generates tamper-evident SHA-256 digital signature hashes", () => {
    const sig1 = generateTamperEvidentSignature(
      "agr-101",
      2000000000n, // ₹2 Crore
      "Aarav Sharma",
      "aarav.sharma@email.com",
      "2026-10-28T10:00:00.000Z"
    );

    expect(sig1.documentHash).toHaveLength(64); // Valid SHA-256 hex string
    expect(sig1.signatureEvidence).toContain("ELECTRONIC ACCEPTANCE");

    // Tampering with contract consideration modifies the document hash
    const tampered = generateTamperEvidentSignature(
      "agr-101",
      1500000000n, // Tampered consideration of ₹1.5 Crore
      "Aarav Sharma",
      "aarav.sharma@email.com",
      "2026-10-28T10:00:00.000Z"
    );

    expect(tampered.documentHash).not.toBe(sig1.documentHash);
  });
});
