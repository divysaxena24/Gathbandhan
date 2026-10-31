/**
 * Seed script for Gathbandhan OS demo data.
 *
 * Run with: pnpm db:seed
 *
 * This script populates the database with realistic demo data
 * centered around the Sharma Royal Wedding and 25 season weddings.
 *
 * All seeded data is clearly marked as demo content.
 * Financial totals are mathematically consistent.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set. Copy .env.example to .env.local and configure it.");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding Gathbandhan OS demo data...\n");

  try {
    // ============================================================
    // 1. Users — Agency team members
    // ============================================================
    console.log("👤 Creating users...");

    const users = await db
      .insert(schema.users)
      .values([
        {
          authProviderId: "clerk_demo_founder",
          name: "Priya Rathore",
          email: "priya@gathbandhan.com",
          phone: "+919876543210",
          role: "FOUNDER_ADMIN",
        },
        {
          authProviderId: "clerk_demo_planner_1",
          name: "Ananya Sharma",
          email: "ananya@gathbandhan.com",
          phone: "+919876543211",
          role: "PLANNER",
        },
        {
          authProviderId: "clerk_demo_planner_2",
          name: "Kavya Singh",
          email: "kavya@gathbandhan.com",
          phone: "+919876543212",
          role: "PLANNER",
        },
        {
          authProviderId: "clerk_demo_finance",
          name: "Rohan Mehta",
          email: "rohan@gathbandhan.com",
          phone: "+919876543213",
          role: "FINANCE",
        },
        {
          authProviderId: "clerk_demo_coordinator",
          name: "Vikram Patel",
          email: "vikram@gathbandhan.com",
          phone: "+919876543214",
          role: "ONSITE_COORDINATOR",
        },
      ])
      .returning();

    console.log(`  ✅ Created ${users.length} users`);

    const founder = users[0];
    const planner1 = users[1];
    const planner2 = users[2];

    // ============================================================
    // 2. Leads — Enquiry pipeline
    // ============================================================
    console.log("📋 Creating leads...");

    const leads = await db
      .insert(schema.leads)
      .values([
        {
          coupleName: "Aarav & Meera Sharma",
          partnerOneName: "Aarav Sharma",
          partnerOneEmail: "aarav.sharma@email.com",
          partnerOnePhone: "+919812345001",
          partnerTwoName: "Meera Joshi",
          source: "Referral - Kapoor family",
          eventDate: "2027-02-12",
          estimatedGuestCount: 400,
          estimatedBudgetPaise: BigInt(20000000000), // ₹2 crore = 20,00,00,000 paise
          city: "Udaipur",
          venue: "Taj Lake Palace / City Palace grounds",
          themeNotes: "Royal Rajasthani theme, traditional with modern elegance",
          packageType: "FULL_SERVICE",
          status: "CONVERTED",
          assignedPlannerId: planner1.id,
          notes: "[DEMO] Anchor wedding — Sharma Royal Wedding",
        },
        {
          coupleName: "Raj & Simran Kapoor",
          partnerOneName: "Raj Kapoor",
          partnerOneEmail: "raj.kapoor@email.com",
          partnerOnePhone: "+919812345002",
          partnerTwoName: "Simran Malhotra",
          source: "Instagram",
          eventDate: "2027-03-20",
          estimatedGuestCount: 300,
          estimatedBudgetPaise: BigInt(15000000000), // ₹1.5 crore
          city: "Jaipur",
          packageType: "FULL_SERVICE",
          status: "PROPOSAL_SENT",
          assignedPlannerId: planner2.id,
          notes: "[DEMO] Active lead",
        },
        {
          coupleName: "Arjun & Nisha Patel",
          partnerOneName: "Arjun Patel",
          partnerOneEmail: "arjun.patel@email.com",
          partnerOnePhone: "+919812345003",
          partnerTwoName: "Nisha Gupta",
          source: "Website enquiry",
          eventDate: "2027-04-15",
          estimatedGuestCount: 250,
          estimatedBudgetPaise: BigInt(8000000000), // ₹80 lakh
          city: "Udaipur",
          packageType: "PARTIAL",
          status: "CONSULTATION_SCHEDULED",
          assignedPlannerId: planner1.id,
          notes: "[DEMO] New enquiry",
        },
        {
          coupleName: "Dev & Aisha Khan",
          partnerOneName: "Dev Khanna",
          partnerOneEmail: "dev.khanna@email.com",
          partnerOnePhone: "+919812345004",
          partnerTwoName: "Aisha Khan",
          source: "Wedding fair 2026",
          eventDate: "2027-01-25",
          estimatedGuestCount: 500,
          estimatedBudgetPaise: BigInt(30000000000), // ₹3 crore
          city: "Udaipur",
          packageType: "FULL_SERVICE",
          status: "NEW",
          assignedPlannerId: null,
          notes: "[DEMO] Fresh enquiry, not yet assigned",
        },
      ])
      .returning();

    console.log(`  ✅ Created ${leads.length} leads`);

    // ============================================================
    // 3. Clients — Converted leads
    // ============================================================
    console.log("💑 Creating clients...");

    const clients = await db
      .insert(schema.clients)
      .values([
        {
          coupleName: "Aarav & Meera Sharma",
          partnerOneName: "Aarav Sharma",
          partnerOneEmail: "aarav.sharma@email.com",
          partnerOnePhone: "+919812345001",
          partnerTwoName: "Meera Joshi",
          partnerTwoEmail: "meera.joshi@email.com",
          address: "14, Civil Lines, Jaipur, Rajasthan",
          notes: "[DEMO] Anchor wedding couple",
          convertedFromLeadId: leads[0].id,
        },
      ])
      .returning();

    console.log(`  ✅ Created ${clients.length} clients`);

    // ============================================================
    // 4. Weddings
    // ============================================================
    console.log("💒 Creating weddings...");

    const weddings = await db
      .insert(schema.weddings)
      .values([
        {
          clientId: clients[0].id,
          title: "Sharma Royal Wedding",
          city: "Udaipur",
          venue: "Taj Lake Palace & City Palace",
          startDate: "2027-02-12",
          endDate: "2027-02-14",
          estimatedGuestCount: 400,
          budgetPaise: BigInt(20000000000), // ₹2 crore
          packageType: "FULL_SERVICE",
          lifecycleStatus: "PLANNING",
          assignedPlannerId: planner1.id,
          notes: "[DEMO] Anchor wedding for full demo scenario",
        },
      ])
      .returning();

    console.log(`  ✅ Created ${weddings.length} weddings`);

    const sharmaWedding = weddings[0];

    // ============================================================
    // 5. Wedding Events
    // ============================================================
    console.log("🎉 Creating wedding events...");

    const events = await db
      .insert(schema.weddingEvents)
      .values([
        {
          weddingId: sharmaWedding.id,
          name: "Mehendi Ceremony",
          eventType: "MEHENDI",
          startsAt: new Date("2027-02-12T10:00:00+05:30"),
          endsAt: new Date("2027-02-12T14:00:00+05:30"),
          venue: "Taj Lake Palace - Garden Pavilion",
          expectedGuestCount: 200,
          status: "CONFIRMED",
          notes: "[DEMO] Day 1 morning event",
        },
        {
          weddingId: sharmaWedding.id,
          name: "Sangeet Night",
          eventType: "SANGEET",
          startsAt: new Date("2027-02-12T19:00:00+05:30"),
          endsAt: new Date("2027-02-13T01:00:00+05:30"),
          venue: "Taj Lake Palace - Grand Ballroom",
          expectedGuestCount: 350,
          status: "CONFIRMED",
          notes: "[DEMO] Day 1 evening event",
        },
        {
          weddingId: sharmaWedding.id,
          name: "Wedding Ceremony",
          eventType: "CEREMONY",
          startsAt: new Date("2027-02-13T09:00:00+05:30"),
          endsAt: new Date("2027-02-13T14:00:00+05:30"),
          venue: "City Palace - Zenana Mahal",
          expectedGuestCount: 400,
          status: "CONFIRMED",
          notes: "[DEMO] Main ceremony, Day 2",
        },
        {
          weddingId: sharmaWedding.id,
          name: "Grand Reception",
          eventType: "RECEPTION",
          startsAt: new Date("2027-02-14T18:00:00+05:30"),
          endsAt: new Date("2027-02-15T00:00:00+05:30"),
          venue: "Taj Lake Palace - Lakeside Lawns",
          expectedGuestCount: 400,
          status: "CONFIRMED",
          notes: "[DEMO] Day 3 grand reception",
        },
      ])
      .returning();

    console.log(`  ✅ Created ${events.length} wedding events`);

    // ============================================================
    // 6. Vendors — Master directory
    // ============================================================
    console.log("🏢 Creating vendors...");

    const vendorData = [
      { name: "Royal Rajasthani Caterers", category: "CATERING" as const, contactName: "Suresh Kumar", email: "suresh@royalcatering.com", phone: "+919812345101", city: "Udaipur" },
      { name: "Maharaja Feast Co.", category: "CATERING" as const, contactName: "Deepak Jain", email: "deepak@maharajafeast.com", phone: "+919812345102", city: "Udaipur" },
      { name: "Palace Kitchen Catering", category: "CATERING" as const, contactName: "Rekha Agarwal", email: "rekha@palacekitchen.com", phone: "+919812345103", city: "Jaipur" },
      { name: "Lakeside Decor Studio", category: "DECORATION" as const, contactName: "Meena Rathore", email: "meena@lakesidedecor.com", phone: "+919812345104", city: "Udaipur" },
      { name: "ShutterStory Photography", category: "PHOTOGRAPHY" as const, contactName: "Amit Verma", email: "amit@shutterstory.com", phone: "+919812345105", city: "Jaipur" },
      { name: "CinemaVows Films", category: "VIDEOGRAPHY" as const, contactName: "Ravi Kapoor", email: "ravi@cinemavows.com", phone: "+919812345106", city: "Mumbai" },
      { name: "DJ Beats Rajasthan", category: "DJ_MUSIC" as const, contactName: "Karan Malhotra", email: "karan@djbeats.com", phone: "+919812345107", city: "Jaipur" },
      { name: "Glamour Touch Makeup", category: "MAKEUP" as const, contactName: "Pooja Sharma", email: "pooja@glamourtouch.com", phone: "+919812345108", city: "Udaipur" },
      { name: "Henna by Sunita", category: "MEHENDI_ARTIST" as const, contactName: "Sunita Devi", email: "sunita@hennabysunita.com", phone: "+919812345109", city: "Udaipur" },
      { name: "Radiance Lighting Co.", category: "LIGHTING" as const, contactName: "Manish Gupta", email: "manish@radiance.com", phone: "+919812345110", city: "Jaipur" },
      { name: "Star Entertainment Group", category: "ENTERTAINMENT" as const, contactName: "Nikhil Saxena", email: "nikhil@starentertain.com", phone: "+919812345111", city: "Mumbai" },
      { name: "Royal Rides Transport", category: "TRANSPORT" as const, contactName: "Ajay Singh", email: "ajay@royalrides.com", phone: "+919812345112", city: "Udaipur" },
      { name: "Taj Lake Palace", category: "VENUE" as const, contactName: "Hotel Events Team", email: "events@tajlakepalace.com", phone: "+919812345113", city: "Udaipur" },
      { name: "Regal Invitations", category: "INVITATION" as const, contactName: "Nandini Reddy", email: "nandini@regalinvite.com", phone: "+919812345114", city: "Hyderabad" },
      { name: "Precious Gifts & Favors", category: "GIFTING" as const, contactName: "Sanjay Mittal", email: "sanjay@preciousgifts.com", phone: "+919812345115", city: "Delhi" },
      { name: "Pandit Rameshwar Shastri", category: "PANDIT" as const, contactName: "Pt. Rameshwar Shastri", email: "panditji@email.com", phone: "+919812345116", city: "Udaipur" },
      { name: "ShieldGuard Security", category: "SECURITY" as const, contactName: "Major (Retd.) Chauhan", email: "chauhan@shieldguard.com", phone: "+919812345117", city: "Udaipur" },
      { name: "EventFlow Coordinators", category: "COORDINATION" as const, contactName: "Divya Nair", email: "divya@eventflow.com", phone: "+919812345118", city: "Jaipur" },
    ];

    const vendors = await db
      .insert(schema.vendors)
      .values(vendorData.map((v) => ({ ...v, serviceArea: [v.city], isActive: true })))
      .returning();

    console.log(`  ✅ Created ${vendors.length} vendors`);

    // ============================================================
    // 7. Wedding Vendors — Assignments
    // ============================================================
    console.log("🤝 Assigning vendors to wedding...");

    const weddingVendors = await db
      .insert(schema.weddingVendors)
      .values(
        vendors.map((v, i) => ({
          weddingId: sharmaWedding.id,
          vendorId: v.id,
          contractAmountPaise: BigInt([
            800000000, 0, 0, 350000000, 250000000, 200000000, 150000000,
            80000000, 40000000, 120000000, 100000000, 60000000, 500000000,
            30000000, 50000000, 25000000, 40000000, 75000000,
          ][i] ?? 50000000),
          scope: `${v.category} services for Sharma Royal Wedding`,
          status: "assigned",
          expectedArrivalAt: events[0].startsAt
            ? new Date(events[0].startsAt.getTime() - 2 * 60 * 60 * 1000)
            : null,
          graceMinutes: 15,
        }))
      )
      .returning();

    console.log(`  ✅ Assigned ${weddingVendors.length} vendors to wedding`);

    // ============================================================
    // 8. Smart Quotations — RFP & Competing Quotes
    // ============================================================
    console.log("📑 Creating smart quotation requests and proposals...");

    const [cateringRfp] = await db
      .insert(schema.quoteRequests)
      .values([
        {
          weddingId: sharmaWedding.id,
          category: "CATERING",
          title: "Royal Rajasthani 3-Day Catering & Live Food Stations",
          description:
            "[DEMO] 400 Pax full catering for Mehendi, Sangeet, Wedding, and Grand Reception. Authentic Marwari & Mewari cuisine with live international stations.",
          targetBudgetPaise: BigInt(250000000), // ₹25 Lakh = 250,000,000 paise
          status: "OPEN",
          deadline: new Date("2026-12-15T18:00:00+05:30"),
        },
      ])
      .returning();

    // Competing Quote 1: Royal Rajasthani Caterers (Verified)
    const [quote1] = await db
      .insert(schema.quotes)
      .values([
        {
          quoteRequestId: cateringRfp.id,
          vendorId: vendors[0].id,
          status: "VERIFIED",
          submittedAt: new Date("2026-11-01T10:00:00+05:30"),
          validUntil: new Date("2026-12-31T23:59:59+05:30"),
          currency: "INR",
          extractionStatus: "COMPLETED",
          confidenceScore: "0.96",
          reviewedById: planner1.id,
          reviewedAt: new Date(),
          travelFeePaise: BigInt(3500000), // ₹35,000
          overtimeHourlyRatePaise: BigInt(1500000), // ₹15,000/hr
          taxRule: "GST_5",
          serviceChargeRule: "NONE",
          notes: "[DEMO] Verified quote with complete inclusions.",
        },
      ])
      .returning();

    await db.insert(schema.quoteItems).values([
      {
        quoteId: quote1.id,
        name: "Grand Rajasthani Royal Buffet & Live Counters",
        category: "Food",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(320000), // ₹3,200 per plate
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "5.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote1.id,
        name: "Welcome Drinks & Chaat Counter",
        category: "Beverage",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(45000), // ₹450 per plate
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote1.id,
        name: "Midnight Snack Counter",
        category: "Food",
        quantity: 1,
        unit: "lump_sum",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(4500000), // ₹45,000 fixed
        isPerGuest: false,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote1.id,
        name: "Bone China & Brass Cutlery Service",
        category: "Equipment",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(7500000), // ₹75,000 fixed
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
    ]);

    // Competing Quote 2: Maharaja Feast Co. (Verified)
    const [quote2] = await db
      .insert(schema.quotes)
      .values([
        {
          quoteRequestId: cateringRfp.id,
          vendorId: vendors[1].id,
          status: "VERIFIED",
          submittedAt: new Date("2026-11-02T11:30:00+05:30"),
          validUntil: new Date("2026-12-31T23:59:59+05:30"),
          currency: "INR",
          extractionStatus: "COMPLETED",
          confidenceScore: "0.92",
          reviewedById: planner1.id,
          reviewedAt: new Date(),
          travelFeePaise: BigInt(2500000), // ₹25,000
          overtimeHourlyRatePaise: BigInt(2000000), // ₹20,000/hr
          taxRule: "GST_5",
          serviceChargeRule: "NONE",
          notes: "[DEMO] Premium caterer, optional midnight snack surcharge.",
        },
      ])
      .returning();

    await db.insert(schema.quoteItems).values([
      {
        quoteId: quote2.id,
        name: "Grand Rajasthani Royal Buffet & Live Counters",
        category: "Food",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(350000), // ₹3,500 per plate
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote2.id,
        name: "Welcome Drinks & Chaat Counter",
        category: "Beverage",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(50000), // ₹500 per plate
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote2.id,
        name: "Midnight Snack Counter",
        category: "Food",
        quantity: 1,
        unit: "lump_sum",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(6000000), // ₹60,000 fixed
        isPerGuest: false,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "OPTIONAL",
      },
      {
        quoteId: quote2.id,
        name: "Bone China & Brass Cutlery Service",
        category: "Equipment",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(6000000), // ₹60,000 fixed
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
    ]);

    // Competing Quote 3: Palace Kitchen Catering (Needs Review)
    const [quote3] = await db
      .insert(schema.quotes)
      .values([
        {
          quoteRequestId: cateringRfp.id,
          vendorId: vendors[2].id,
          status: "NEEDS_REVIEW",
          submittedAt: new Date("2026-11-03T15:00:00+05:30"),
          validUntil: new Date("2026-12-31T23:59:59+05:30"),
          currency: "INR",
          extractionStatus: "COMPLETED",
          confidenceScore: "0.82",
          travelFeePaise: BigInt(5000000), // ₹50,000 outstation
          overtimeHourlyRatePaise: BigInt(1000000),
          taxRule: "GST_5",
          serviceChargeRule: "NONE",
          extractionNotes: "[DEMO] Extracted via OCR adapter; requires planner review.",
        },
      ])
      .returning();

    await db.insert(schema.quoteItems).values([
      {
        quoteId: quote3.id,
        name: "Grand Rajasthani Royal Buffet & Live Counters",
        category: "Food",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(295000), // ₹2,950 per plate (lower base rate)
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote3.id,
        name: "Welcome Drinks & Chaat Counter",
        category: "Beverage",
        quantity: 1,
        unit: "plate",
        unitPricePaise: BigInt(40000), // ₹400 per plate
        fixedChargePaise: BigInt(0),
        isPerGuest: true,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "INCLUDED",
      },
      {
        quoteId: quote3.id,
        name: "Midnight Snack Counter",
        category: "Food",
        quantity: 1,
        unit: "lump_sum",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(0),
        isPerGuest: false,
        taxPercent: "5.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "EXCLUDED",
        notes: "Excluded from basic proposal",
      },
      {
        quoteId: quote3.id,
        name: "Bone China & Brass Cutlery Service",
        category: "Equipment",
        quantity: 1,
        unit: "set",
        unitPricePaise: BigInt(0),
        fixedChargePaise: BigInt(0),
        isPerGuest: false,
        taxPercent: "18.00",
        serviceChargePercent: "0.00",
        inclusionStatus: "EXCLUDED",
        notes: "Client or venue must provide dinnerware",
      },
    ]);

    console.log(`  ✅ Created RFP and 3 competing vendor quotes`);

    // ============================================================
    // 8. Audit Log — Initial entries
    // ============================================================
    console.log("📝 Creating audit log entries...");

    await db.insert(schema.auditLogs).values([
      {
        actorId: founder.id,
        entityType: "lead",
        entityId: leads[0].id,
        action: "lead.created",
        newValue: { coupleName: "Aarav & Meera Sharma", status: "NEW" },
        reason: "[DEMO] Initial lead creation",
      },
      {
        actorId: planner1.id,
        entityType: "lead",
        entityId: leads[0].id,
        action: "lead.status_changed",
        oldValue: { status: "NEW" },
        newValue: { status: "CONVERTED" },
        reason: "[DEMO] Lead converted to wedding after agreement",
      },
      {
        actorId: planner1.id,
        entityType: "wedding",
        entityId: sharmaWedding.id,
        action: "wedding.created",
        newValue: { title: "Sharma Royal Wedding", budgetPaise: "20000000000" },
        reason: "[DEMO] Wedding created from converted lead",
      },
    ]);

    console.log(`  ✅ Created audit log entries`);

    // ============================================================
    // Done
    // ============================================================
    console.log("\n✨ Seed complete!");
    console.log("   Anchor wedding: Sharma Royal Wedding (Udaipur)");
    console.log("   Budget: ₹2 Crore | Guests: 400 | Events: 4");
    console.log(`   Vendors assigned: ${vendors.length}`);
    console.log(`   Leads in pipeline: ${leads.length}`);
    console.log("\n   All records marked as [DEMO] data.\n");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();

