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
import crypto from "crypto";
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
    // Clean old demo data so seed is completely idempotent
    console.log("🧹 Resetting existing demo records...");
    await client.unsafe(`
      TRUNCATE TABLE 
        notifications,
        agreements,
        transport_assignments,
        accommodation_bookings,
        guest_event_rsvps,
        guests,
        approved_extras,
        expenses,
        vendor_payment_transactions,
        vendor_invoices,
        client_payment_transactions,
        client_payment_milestones,
        control_room_alerts,
        incidents,
        vendor_check_ins,
        timeline_dependencies,
        timeline_items,
        tasks,
        task_dependencies,
        task_template_dependencies,
        task_templates,
        quote_items,
        quotes,
        quote_requests,
        wedding_vendors,
        wedding_events,
        weddings,
        clients,
        lead_activities,
        leads,
        vendors,
        audit_logs,
        users
      CASCADE;
    `);

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
    // 9. Task Templates & Backward Scheduled Wedding Plan
    // ============================================================
    console.log("📋 Seeding task templates & backward scheduled wedding plan...");

    const templateDefinitions = [
      { category: "Venue & Layout", title: "Venue Contract & Palace Booking", offsetDays: -180, defaultPriority: "CRITICAL", estimatedMinutes: 240 },
      { category: "Venue & Layout", title: "Palace Floor Plan & Spatial Layout", offsetDays: -150, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Decor & Production", title: "Decor 3D Render & Mandap Design", offsetDays: -120, defaultPriority: "HIGH", estimatedMinutes: 240 },
      { category: "Decor & Production", title: "Decor & Production Vendor Award", offsetDays: -100, defaultPriority: "CRITICAL", estimatedMinutes: 180 },
      { category: "Catering & Menu", title: "Catering Menu Tasting & Master Chef Brief", offsetDays: -90, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Catering & Menu", title: "Catering RFP Finalization & Award", offsetDays: -80, defaultPriority: "CRITICAL", estimatedMinutes: 180 },
      { category: "Invitations & Stationery", title: "Luxury Digital & Foil Invitation Design", offsetDays: -75, defaultPriority: "MEDIUM", estimatedMinutes: 120 },
      { category: "Invitations & Stationery", title: "Invitation Dispatch & Courier Track", offsetDays: -60, defaultPriority: "HIGH", estimatedMinutes: 240 },
      { category: "Decor & Production", title: "Sound, DJ & Architectural Lighting Rig Approval", offsetDays: -60, defaultPriority: "HIGH", estimatedMinutes: 120 },
      { category: "Media & Films", title: "Cinematography & Photography Shot List Brief", offsetDays: -60, defaultPriority: "MEDIUM", estimatedMinutes: 120 },
      { category: "Rituals & Pandit", title: "Panditji Ritual Schedule & Samagri Prep", offsetDays: -50, defaultPriority: "MEDIUM", estimatedMinutes: 90 },
      { category: "Guest Logistics", title: "Guest RSVP Tracking & Preliminary Headcount", offsetDays: -45, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Guest Logistics", title: "Airport Shuttle & Vintage Car Fleet Roster", offsetDays: -30, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Hospitality", title: "Taj Lake Palace Rooming List Finalization", offsetDays: -25, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Catering & Menu", title: "Final Headcount Lock & Dietary Matrix Lock", offsetDays: -14, defaultPriority: "CRITICAL", estimatedMinutes: 120 },
      { category: "Catering & Menu", title: "Catering Advance & Plate Quantity Confirmation", offsetDays: -10, defaultPriority: "HIGH", estimatedMinutes: 90 },
      { category: "Decor & Production", title: "On-Site Production Load-in & Generator Fuel Test", offsetDays: -3, defaultPriority: "CRITICAL", estimatedMinutes: 300 },
      { category: "Bridal & Beauty", title: "Bridal Suite Henna Station & Mehendi Crew Arrival", offsetDays: -2, defaultPriority: "HIGH", estimatedMinutes: 120 },
      { category: "Event Execution", title: "Mehendi Ceremony Live Execution", offsetDays: -2, defaultPriority: "HIGH", estimatedMinutes: 360 },
      { category: "Decor & Production", title: "Sangeet Choreography & Artist Soundcheck", offsetDays: -1, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Event Execution", title: "Sangeet Night Stage Production", offsetDays: -1, defaultPriority: "CRITICAL", estimatedMinutes: 360 },
      { category: "Decor & Production", title: "Mandap Floral Installation & Cold Pyros Verification", offsetDays: 0, defaultPriority: "CRITICAL", estimatedMinutes: 240 },
      { category: "Event Execution", title: "Baraat Procession & Vintage Car Staging", offsetDays: 0, defaultPriority: "HIGH", estimatedMinutes: 120 },
      { category: "Event Execution", title: "Pheras & Sacred Fire Ceremony Coordination", offsetDays: 0, defaultPriority: "CRITICAL", estimatedMinutes: 300 },
      { category: "Event Execution", title: "Grand Reception Banquet & Champagne Toast", offsetDays: 1, defaultPriority: "CRITICAL", estimatedMinutes: 360 },
      { category: "Post-Wedding", title: "Vendor Tear-Down & Palace Handover Audit", offsetDays: 2, defaultPriority: "MEDIUM", estimatedMinutes: 180 },
      { category: "Guest Logistics", title: "Guest Departure Logistics & Gift Favors Handover", offsetDays: 2, defaultPriority: "HIGH", estimatedMinutes: 180 },
      { category: "Finance", title: "Vendor Final Invoice Reconciliation & Settlement", offsetDays: 7, defaultPriority: "CRITICAL", estimatedMinutes: 240 },
    ];

    const insertedTemplates = await db
      .insert(schema.taskTemplates)
      .values(
        templateDefinitions.map((t) => ({
          packageType: "FULL_SERVICE" as const,
          category: t.category,
          title: t.title,
          offsetDays: t.offsetDays,
          defaultPriority: t.defaultPriority,
          estimatedMinutes: t.estimatedMinutes,
          referenceEvent: "WEDDING_START",
          suggestedRole: "PLANNER",
        }))
      )
      .returning();

    console.log(`  ✅ Created ${insertedTemplates.length} database task templates`);

    // Template dependency rules (index-based)
    // 1 (Floor Plan) depends on 0 (Venue Contract)
    // 2 (Decor 3D Render) depends on 1 (Floor Plan)
    // 3 (Decor Vendor Award) depends on 2 (Decor 3D Render)
    // 7 (Invitation Dispatch) depends on 6 (Invitation Design)
    // 8 (Sound Rig) depends on 3 (Decor Award)
    // 11 (RSVP Tracking) depends on 7 (Dispatch)
    // 13 (Rooming List) depends on 11 (RSVP)
    // 14 (Headcount Lock) depends on 11 (RSVP) & 5 (Catering Award)
    // 15 (Catering Advance) depends on 14 (Headcount Lock)
    // 16 (Load-in & DG test) depends on 8 (Sound Rig)
    // 19 (Sangeet Soundcheck) depends on 16 (Load-in)
    // 21 (Mandap Florals) depends on 16 (Load-in)
    // 23 (Pheras Coordination) depends on 21 (Mandap Florals) & 10 (Panditji Prep)
    // 24 (Grand Reception) depends on 15 (Catering Advance)
    // 27 (Final Invoice Reconciliation) depends on 25 (Tear-down)
    const templateDepPairs = [
      [1, 0],
      [2, 1],
      [3, 2],
      [7, 6],
      [8, 3],
      [11, 7],
      [13, 11],
      [14, 11],
      [14, 5],
      [15, 14],
      [16, 8],
      [19, 16],
      [21, 16],
      [23, 21],
      [23, 10],
      [24, 15],
      [27, 25],
    ];

    await db.insert(schema.taskTemplateDependencies).values(
      templateDepPairs.map(([depIdx, prereqIdx]) => ({
        templateId: insertedTemplates[depIdx].id,
        dependsOnTemplateId: insertedTemplates[prereqIdx].id,
      }))
    );

    // Instantiate tasks for Sharma Royal Wedding (Feb 12, 2027)
    const weddingBaseDate = new Date(sharmaWedding.startDate || "2027-02-12");
    const createdTasks = await db
      .insert(schema.tasks)
      .values(
        insertedTemplates.map((t, idx) => {
          const due = new Date(weddingBaseDate.getTime() + t.offsetDays * 24 * 60 * 60 * 1000);
          due.setHours(18, 0, 0, 0);

          let status: "TO_PLAN" | "IN_PROGRESS" | "DONE" = "TO_PLAN";
          if (idx <= 4) status = "DONE";
          else if (idx <= 8) status = "IN_PROGRESS";

          return {
            weddingId: sharmaWedding.id,
            sourceTemplateId: t.id,
            title: t.title,
            category: t.category,
            ownerId: idx % 2 === 0 ? planner1.id : planner2.id,
            status,
            priority: t.defaultPriority,
            dueAt: due,
            estimatedMinutes: t.estimatedMinutes,
            actualMinutes: status === "DONE" ? t.estimatedMinutes : 0,
            isCriticalPath: t.defaultPriority === "CRITICAL",
          };
        })
      )
      .returning();

    // Instantiate task dependencies
    await db.insert(schema.taskDependencies).values(
      templateDepPairs.map(([depIdx, prereqIdx]) => ({
        taskId: createdTasks[depIdx].id,
        dependsOnTaskId: createdTasks[prereqIdx].id,
      }))
    );

    console.log(`  ✅ Generated ${createdTasks.length} backward-scheduled tasks with dependency graph`);

    // ============================================================
    // 10. Control Room — Timeline, Gate Check-ins & Incidents
    // ============================================================
    console.log("⏱️ Seeding Event Control Room data (Day-of timeline, QR gate passes, incidents)...");

    const coordinator = users[4]; // Vikram Patel (ONSITE_COORDINATOR)

    // 10.1 Day-of Timeline Items for Mehendi Ceremony
    const timelineItemsData = [
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Floral & Marigold Stage Setup Complete",
        description: "Stage floral backdrop and seating arranged with fresh marigolds.",
        startsAt: new Date("2027-02-12T08:00:00+05:30"),
        endsAt: new Date("2027-02-12T09:30:00+05:30"),
        location: "Garden Pavilion Stage",
        status: "COMPLETED",
        isKeyMoment: false,
        orderIndex: 1,
        vendorId: vendors[3].id, // Floral vendor
        ownerId: coordinator.id,
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Sound System & Folk Troupe Soundcheck",
        description: "PA speakers and wireless mics tested with folk artists.",
        startsAt: new Date("2027-02-12T08:30:00+05:30"),
        endsAt: new Date("2027-02-12T09:45:00+05:30"),
        location: "Courtyard Stage",
        status: "COMPLETED",
        isKeyMoment: false,
        orderIndex: 2,
        vendorId: vendors[5].id, // Sound vendor
        ownerId: coordinator.id,
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Guest Welcome & Refreshment Station Open",
        description: "Chilled tender coconut and Rajasthani spiced buttermilk station opens.",
        startsAt: new Date("2027-02-12T09:45:00+05:30"),
        endsAt: new Date("2027-02-12T10:15:00+05:30"),
        location: "Pavilion Archway Entrance",
        status: "IN_PROGRESS",
        isKeyMoment: false,
        orderIndex: 3,
        ownerId: coordinator.id,
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Bride Entry & Floral Chhappar Procession",
        description: "Bride enters under floral canopy accompanied by traditional Manganiyar singers.",
        startsAt: new Date("2027-02-12T10:15:00+05:30"),
        endsAt: new Date("2027-02-12T10:45:00+05:30"),
        location: "Garden Promenade to Main Stage",
        status: "PENDING",
        isKeyMoment: true,
        orderIndex: 4,
        ownerId: planner1.id,
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Bridal Mehendi Artist Session Begins",
        description: "Master artist starts intricate organic Rajasthani mehendi application.",
        startsAt: new Date("2027-02-12T10:45:00+05:30"),
        endsAt: new Date("2027-02-12T12:30:00+05:30"),
        location: "Royal Mehendi Lounge",
        status: "PENDING",
        isKeyMoment: false,
        orderIndex: 5,
        vendorId: vendors[7].id, // Mehendi artist
        ownerId: coordinator.id,
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Live Rajasthani Dhol & Ghoomar Folk Performance",
        description: "High-energy cultural showcase with guest participation.",
        startsAt: new Date("2027-02-12T11:15:00+05:30"),
        endsAt: new Date("2027-02-12T12:45:00+05:30"),
        location: "Center Courtyard",
        status: "PENDING",
        isKeyMoment: false,
        orderIndex: 6,
        ownerId: planner2.id,
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Royal Marwari Lunch Buffet Opens",
        description: "Live Dal Baati Churma, Ker Sangri, and Chaat stations.",
        startsAt: new Date("2027-02-12T12:30:00+05:30"),
        endsAt: new Date("2027-02-12T14:30:00+05:30"),
        location: "Lakeside Dining Pavilion",
        status: "PENDING",
        isKeyMoment: true,
        orderIndex: 7,
        vendorId: vendors[0].id, // Royal Mewar Catering
        ownerId: coordinator.id,
      },
    ];

    const seededTimeline = await db
      .insert(schema.timelineItems)
      .values(timelineItemsData)
      .returning();

    // 10.2 Timeline Dependencies
    await db.insert(schema.timelineDependencies).values([
      {
        timelineItemId: seededTimeline[3].id,
        dependsOnItemId: seededTimeline[2].id,
        bufferMinutes: 5,
      },
      {
        timelineItemId: seededTimeline[4].id,
        dependsOnItemId: seededTimeline[3].id,
        bufferMinutes: 0,
      },
      {
        timelineItemId: seededTimeline[6].id,
        dependsOnItemId: seededTimeline[3].id,
        bufferMinutes: 105,
      },
    ]);

    // 10.3 Vendor Check-in Passes for assigned wedding vendors
    const checkInValues = weddingVendors.map((wv, idx) => {
      const rawToken = `gate_token_${idx + 1}_${crypto.randomBytes(8).toString("hex")}`;
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const expectedArrival = events[0].startsAt
        ? new Date(events[0].startsAt.getTime() - (idx % 3 === 0 ? 3 : 2) * 60 * 60 * 1000)
        : new Date();

      let status: "EXPECTED" | "ARRIVED" | "SETUP_COMPLETE" | "WORKING" | "COMPLETED" | "LATE" = "EXPECTED";
      let arrivedAt: Date | null = null;
      let setupCompletedAt: Date | null = null;
      let checkInSource: string | null = null;

      if (idx <= 3) {
        status = "SETUP_COMPLETE";
        arrivedAt = new Date(expectedArrival.getTime() - 15 * 60 * 1000);
        setupCompletedAt = new Date(arrivedAt.getTime() + 45 * 60 * 1000);
        checkInSource = "QR_SCAN";
      } else if (idx <= 6) {
        status = "ARRIVED";
        arrivedAt = new Date(expectedArrival.getTime() - 10 * 60 * 1000);
        checkInSource = "WEB_LINK";
      } else if (idx === 7) {
        status = "LATE";
        checkInSource = null;
      }

      return {
        weddingVendorId: wv.id,
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        rawToken,
        tokenHash,
        expectedArrivalAt: expectedArrival,
        graceMinutes: 15,
        status,
        arrivedAt,
        setupCompletedAt,
        checkInSource,
        checkedInBy: arrivedAt ? "Lead Crew Supervisor" : null,
        lateAlertSentAt: status === "LATE" ? new Date() : null,
      };
    });

    await db.insert(schema.vendorCheckIns).values(checkInValues);

    // 10.4 Incidents Log
    await db.insert(schema.incidents).values([
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Main Courtyard Silent Generator Voltage Fluctuation",
        description: "Primary 100kVA generator showed 15V fluctuation during soundcheck. Risk of amp speaker distortion.",
        severity: "HIGH",
        status: "RESOLVED",
        ownerId: coordinator.id,
        vendorId: vendors[5].id,
        reportedBy: "Vikram Patel (On-Site Coordinator)",
        reportedAt: new Date("2027-02-12T08:40:00+05:30"),
        resolvedAt: new Date("2027-02-12T08:52:00+05:30"),
        resolutionNotes: "Switched to secondary 125kVA backup genset within 12 minutes. Sound and stage power stabilized with clean sine wave.",
        costImpactPaise: 1500000n, // ₹15,000 emergency surcharge
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[0].id,
        title: "Chilled Welcome Drink Glassware Breakage near Pier",
        description: "2 crates of crystal water goblets chipped during boat transport from jetty.",
        severity: "LOW",
        status: "RESOLVED",
        ownerId: coordinator.id,
        vendorId: vendors[0].id,
        reportedBy: "Banquet Captain - Taj Lake Palace",
        reportedAt: new Date("2027-02-12T09:10:00+05:30"),
        resolvedAt: new Date("2027-02-12T09:20:00+05:30"),
        resolutionNotes: "Jetty dock cleared in 10 minutes. Premium acrylic tumblers deployed for pier walkway, crystal reserved for pavilion tables.",
        costImpactPaise: 500000n, // ₹5,000 breakage deposit deduction
      },
      {
        weddingId: sharmaWedding.id,
        eventId: events[1].id,
        title: "Baraat Vintage Car Radiator Running Hot During Test",
        description: "1948 Rolls Royce Silver Wraith radiator temperature elevated during pre-procession trial run.",
        severity: "MEDIUM",
        status: "OPEN",
        ownerId: coordinator.id,
        vendorId: vendors[11].id,
        reportedBy: "Major Chauhan (ShieldGuard Security)",
        reportedAt: new Date("2027-02-12T09:30:00+05:30"),
        costImpactPaise: 0n,
      },
    ]);

    // 10.5 Control Room Alert for Late Vendor
    await db.insert(schema.controlRoomAlerts).values([
      {
        weddingId: sharmaWedding.id,
        alertType: "VENDOR_LATE",
        severity: "WARNING",
        title: "Vendor Late: Mehendi Artist Crew",
        message: "Expected arrival was 07:00 AM IST. Grace period of 15m exceeded without gate check-in.",
        relatedEntityType: "vendor_check_ins",
        isDismissed: false,
      },
    ]);

    console.log(`  ✅ Seeded ${seededTimeline.length} timeline items, 3 dependencies, ${checkInValues.length} QR gate passes, and 3 incident logs`);

    // ============================================================
    // 11. Financial Integrity & Settlement — Phase 6
    // ============================================================
    console.log("💰 Seeding Financial Integrity & Settlement records...");

    const financeUser = users[3]; // Rohan Mehta (FINANCE)

    // 11.1 Client Payment Milestones for Sharma Royal Wedding (₹2 Crore budget)
    const seededMilestones = await db
      .insert(schema.clientPaymentMilestones)
      .values([
        {
          weddingId: sharmaWedding.id,
          title: "Initial Engagement Deposit & Date Lock",
          percentage: "20.00",
          amountPaise: 400000000n, // ₹40 Lakh
          paidPaise: 400000000n,
          dueAt: "2026-11-01",
          status: "PAID",
          orderIndex: 1,
          notes: "Initial advance to secure Taj Lake Palace & flagship dates",
        },
        {
          weddingId: sharmaWedding.id,
          title: "Vendor Retainers & Concept Sign-off",
          percentage: "30.00",
          amountPaise: 600000000n, // ₹60 Lakh
          paidPaise: 600000000n,
          dueAt: "2026-12-15",
          status: "PAID",
          orderIndex: 2,
          notes: "Disbursal for catering retainers and artist booking advances",
        },
        {
          weddingId: sharmaWedding.id,
          title: "Production, Decor & Hospitality Advance",
          percentage: "30.00",
          amountPaise: 600000000n, // ₹60 Lakh
          paidPaise: 400000000n, // Partially paid ₹40 Lakh
          dueAt: "2027-01-20",
          status: "PARTIALLY_PAID",
          orderIndex: 3,
          notes: "Fabrication, trussing, floral imports, and vintage car fleet locks",
        },
        {
          weddingId: sharmaWedding.id,
          title: "Final Settlement & Post-Wedding Handover",
          percentage: "20.00",
          amountPaise: 400000000n, // ₹40 Lakh
          paidPaise: 0n,
          dueAt: "2027-02-15",
          status: "PENDING",
          orderIndex: 4,
          notes: "Post-event final reconciliation including incidentals and extra guest covers",
        },
      ])
      .returning();

    // 11.2 Client Payment Transactions (Receipts)
    await db.insert(schema.clientPaymentTransactions).values([
      {
        milestoneId: seededMilestones[0].id,
        weddingId: sharmaWedding.id,
        amountPaise: 400000000n,
        paidAt: new Date("2026-10-28T11:30:00+05:30"),
        paymentMethod: "RTGS",
        reference: "HDFC000192837461",
        idempotencyKey: "idemp_cl_sharma_001_initial_dep",
        recordedBy: financeUser.id,
        receiptUrl: "https://documents.gathbandhan.internal/receipts/rec-sharma-001.pdf",
        notes: "Transferred from Mr. Aarav Sharma HDFC Private Banking",
      },
      {
        milestoneId: seededMilestones[1].id,
        weddingId: sharmaWedding.id,
        amountPaise: 600000000n,
        paidAt: new Date("2026-12-14T15:45:00+05:30"),
        paymentMethod: "RTGS",
        reference: "ICIC000847291823",
        idempotencyKey: "idemp_cl_sharma_002_retainers",
        recordedBy: financeUser.id,
        receiptUrl: "https://documents.gathbandhan.internal/receipts/rec-sharma-002.pdf",
        notes: "Milestone 2 cleared. Verified in corporate account.",
      },
      {
        milestoneId: seededMilestones[2].id,
        weddingId: sharmaWedding.id,
        amountPaise: 400000000n,
        paidAt: new Date("2027-01-19T17:15:00+05:30"),
        paymentMethod: "RTGS",
        reference: "KKBK000491827451",
        idempotencyKey: "idemp_cl_sharma_003_prod_adv",
        recordedBy: financeUser.id,
        receiptUrl: "https://documents.gathbandhan.internal/receipts/rec-sharma-003.pdf",
        notes: "First tranche of Milestone 3. Balance ₹20 Lakh due before Mehendi.",
      },
    ]);

    // 11.3 Approved Extras (Out of scope variations)
    const seededExtras = await db
      .insert(schema.approvedExtras)
      .values([
        {
          weddingId: sharmaWedding.id,
          weddingVendorId: weddingVendors[0].id, // Royal Mewar Catering
          title: "Additional 50 Royal Dining Covers (Sangeet)",
          description: "Groom family guest count increased from 350 to 400 for Sangeet dinner buffet",
          category: "Catering",
          unitRatePaise: 600000n, // ₹6,000 per cover
          quantity: 50,
          vendorCostPaise: 24000000n, // ₹2.4 Lakh cost
          clientAmountPaise: 30000000n, // ₹3.0 Lakh billed
          billableToClient: true,
          status: "APPROVED",
          approvedBy: founder.id,
          approvedAt: new Date("2027-01-15T10:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          weddingVendorId: weddingVendors[5].id, // Sound & Light
          title: "Extended 2-Hour Sound Curfew Genset & Acoustic Shroud",
          description: "Night permit acoustics for Jagmandir island courtyard until 1:00 AM",
          category: "Production",
          unitRatePaise: 15000000n, // ₹1.5 Lakh
          quantity: 1,
          vendorCostPaise: 10000000n, // ₹1.0 Lakh
          clientAmountPaise: 15000000n, // ₹1.5 Lakh
          billableToClient: true,
          status: "APPROVED",
          approvedBy: founder.id,
          approvedAt: new Date("2027-01-20T16:30:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          weddingVendorId: weddingVendors[3].id, // Royal Floral Decor
          title: "Imported Dutch Hydrangeas & White Orchids Mandap Enhancement",
          description: "Delicate floral dome addition for lakeside wedding ceremony",
          category: "Decor",
          unitRatePaise: 25000000n, // ₹2.5 Lakh
          quantity: 1,
          vendorCostPaise: 20000000n, // ₹2.0 Lakh
          clientAmountPaise: 25000000n, // ₹2.5 Lakh
          billableToClient: true,
          status: "PENDING_APPROVAL",
        },
      ])
      .returning();

    // 11.4 Operational Expenses
    await db.insert(schema.expenses).values([
      {
        weddingId: sharmaWedding.id,
        title: "Udaipur Municipal Police & Lake Authority NOC",
        category: "COORDINATION",
        amountPaise: 4500000n, // ₹45,000
        incurredAt: new Date("2026-12-10T11:00:00+05:30"),
        billableToClient: true,
        isApproved: true,
        approvedBy: founder.id,
        approvedAt: new Date("2026-12-11T09:00:00+05:30"),
        receiptUrl: "https://documents.gathbandhan.internal/receipts/noc-udaipur-45k.pdf",
        notes: "Official receipt from Udaipur Municipal Corporation",
      },
      {
        weddingId: sharmaWedding.id,
        title: "Emergency High-Diesel Fuel for Secondary Genset",
        category: "TRANSPORT",
        amountPaise: 1850000n, // ₹18,500
        incurredAt: new Date("2027-02-12T09:00:00+05:30"),
        billableToClient: false,
        isApproved: true,
        approvedBy: financeUser.id,
        approvedAt: new Date("2027-02-12T09:30:00+05:30"),
        receiptUrl: "https://documents.gathbandhan.internal/receipts/fuel-genset-18500.pdf",
        notes: "Incurred during 15V fluctuation incident response",
      },
      {
        weddingId: sharmaWedding.id,
        title: "Airport Chauffeur Refreshments & Fleet Parking Passes",
        category: "TRANSPORT",
        amountPaise: 1200000n, // ₹12,000
        incurredAt: new Date("2027-02-11T18:00:00+05:30"),
        billableToClient: true,
        isApproved: false,
        receiptUrl: null,
        notes: "Maharana Pratap Airport parking coupons for 15 Innova Crysta cabs",
      },
    ]);

    // 11.5 Vendor Invoices & Disbursements
    const seededInvoices = await db
      .insert(schema.vendorInvoices)
      .values([
        {
          weddingVendorId: weddingVendors[0].id, // Royal Mewar Catering
          weddingId: sharmaWedding.id,
          vendorId: vendors[0].id,
          invoiceNumber: "INV-RMC-2026-088",
          issueDate: "2026-12-01",
          dueDate: "2026-12-15",
          subtotalPaise: 380952380n,
          taxPaise: 19047620n, // 5% GST
          totalPaise: 400000000n, // ₹40 Lakh (First 50% retainer of ₹80 Lakh contract)
          paidPaise: 400000000n,
          status: "PAID",
          documentUrl: "https://documents.gathbandhan.internal/invoices/inv-rmc-088.pdf",
          notes: "Catering booking advance and menu degustation sign-off",
          isReconciled: true,
          reconciledAt: new Date("2026-12-05T14:00:00+05:30"),
          reconciledBy: financeUser.id,
          reconciliationNotes: "Reconciled with 50% contract milestone terms. Exact match.",
        },
        {
          weddingVendorId: weddingVendors[3].id, // Royal Floral Decor
          weddingId: sharmaWedding.id,
          vendorId: vendors[3].id,
          invoiceNumber: "RFD-UDZ-2027-014",
          issueDate: "2027-01-10",
          dueDate: "2027-01-25",
          subtotalPaise: 175000000n,
          taxPaise: 0n,
          totalPaise: 175000000n, // ₹17.5 Lakh (50% of ₹35 Lakh contract)
          paidPaise: 175000000n,
          status: "PAID",
          documentUrl: "https://documents.gathbandhan.internal/invoices/inv-rfd-014.pdf",
          notes: "Decor fabrication advance and flower procurement advance",
          isReconciled: true,
          reconciledAt: new Date("2027-01-12T16:00:00+05:30"),
          reconciledBy: financeUser.id,
          reconciliationNotes: "Reconciled against contract terms. Advance schedule verified.",
        },
        {
          weddingVendorId: weddingVendors[4].id, // Photography
          weddingId: sharmaWedding.id,
          vendorId: vendors[4].id,
          invoiceNumber: "INV-EP-2027-003",
          issueDate: "2027-01-20",
          dueDate: "2027-02-05",
          subtotalPaise: 125000000n,
          taxPaise: 0n,
          totalPaise: 125000000n, // ₹12.5 Lakh (50% of ₹25 Lakh contract)
          paidPaise: 0n,
          status: "APPROVED",
          documentUrl: "https://documents.gathbandhan.internal/invoices/inv-ep-003.pdf",
          notes: "Pre-wedding shoot delivery and team travel booking advance",
          isReconciled: true,
          reconciledAt: new Date("2027-01-22T11:00:00+05:30"),
          reconciledBy: financeUser.id,
          reconciliationNotes: "Pre-wedding photos delivered in high resolution. Approved for payment.",
        },
        {
          weddingVendorId: weddingVendors[0].id, // Royal Mewar Catering Second Invoice (Final + Extras)
          weddingId: sharmaWedding.id,
          vendorId: vendors[0].id,
          invoiceNumber: "INV-RMC-2027-012",
          issueDate: "2027-02-10",
          dueDate: "2027-02-20",
          subtotalPaise: 403809524n,
          taxPaise: 20190476n,
          totalPaise: 424000000n, // ₹42.4 Lakh (₹40 Lakh balance + ₹2.4 Lakh approved extra)
          paidPaise: 0n,
          status: "SENT",
          documentUrl: "https://documents.gathbandhan.internal/invoices/inv-rmc-012.pdf",
          notes: "Balance 50% catering contract plus 50 additional Sangeet dinner covers",
          isReconciled: false,
          reconciliationNotes: null,
        },
      ])
      .returning();

    // 11.6 Vendor Payment Disbursements (Idempotent transactions)
    await db.insert(schema.vendorPaymentTransactions).values([
      {
        invoiceId: seededInvoices[0].id,
        weddingVendorId: weddingVendors[0].id,
        weddingId: sharmaWedding.id,
        amountPaise: 400000000n,
        paidAt: new Date("2026-12-14T11:00:00+05:30"),
        paymentMethod: "RTGS",
        reference: "KKBK000982736412",
        idempotencyKey: "idemp_vnd_pay_rmc_001_adv",
        recordedBy: financeUser.id,
        notes: "Advance 50% transferred to Royal Mewar Catering current account",
      },
      {
        invoiceId: seededInvoices[1].id,
        weddingVendorId: weddingVendors[3].id,
        weddingId: sharmaWedding.id,
        amountPaise: 175000000n,
        paidAt: new Date("2027-01-20T14:30:00+05:30"),
        paymentMethod: "NEFT",
        reference: "HDFC000762514930",
        idempotencyKey: "idemp_vnd_pay_rfd_001_adv",
        recordedBy: financeUser.id,
        notes: "Transferred from Gathbandhan client escrow sub-ledger",
      },
    ]);

    console.log(`  ✅ Seeded ${seededMilestones.length} client milestones, 3 client receipts, ${seededInvoices.length} vendor invoices, 2 vendor disbursements, ${seededExtras.length} approved extras, and 3 operational expenses`);

    // ============================================================
    // 12. Guests, RSVPs, Logistics & Client Portal — Phase 7
    // ============================================================
    console.log("💌 Seeding Guests, RSVPs, Room Allocations, Transports & Master Agreement...");

    // 12.1 Master Agreement
    await db.insert(schema.agreements).values([
      {
        weddingId: sharmaWedding.id,
        clientId: clients[0].id,
        title: "Master Wedding Planning & Coordination Agreement",
        version: "1.0",
        status: "SIGNED",
        totalAmountPaise: 2000000000n, // ₹2 Crore
        documentUrl: "https://documents.gathbandhan.internal/agreements/agr-sharma-royal-2027.pdf",
        documentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        termsSummary: "Full destination coordination across Taj Lake Palace, Jagmandir Island, and Udaivilas covering decor, catering, guest transfers, and production.",
        sentAt: new Date("2026-10-25T11:00:00+05:30"),
        signedAt: new Date("2026-10-28T10:00:00+05:30"),
        signerName: "Aarav Sharma",
        signerEmail: "aarav.sharma@email.com",
        signerIp: "103.21.244.1",
        signatureEvidence: "ELECTRONIC ACCEPTANCE by Aarav Sharma (aarav.sharma@email.com) via Gathbandhan Portal on 2026-10-28T10:00:00+05:30 [IP: 103.21.244.1]",
        notes: "Countersigned by Priya Rathore (Founder). Stored in private S3 bucket.",
      },
    ]);

    // 12.2 Guest Roster & Family Delegations
    const seededGuests = await db
      .insert(schema.guests)
      .values([
        {
          weddingId: sharmaWedding.id,
          householdName: "Sharma Family (Groom Core)",
          firstName: "Rajesh",
          lastName: "Sharma",
          email: "rajesh.sharma@email.com",
          phone: "+919811100001",
          side: "GROOM",
          isPrimaryContact: true,
          dietaryPreference: "VEG",
          allergies: null,
          accessibilityNeeds: null,
          rsvpToken: "rsvp_sharma_groom_rajesh_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Sharma Family (Groom Core)",
          firstName: "Sunita",
          lastName: "Sharma",
          email: "sunita.sharma@email.com",
          phone: "+919811100002",
          side: "GROOM",
          isPrimaryContact: false,
          dietaryPreference: "VEG",
          allergies: null,
          accessibilityNeeds: null,
          rsvpToken: "rsvp_sharma_groom_sunita_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Sharma Family (Groom Core)",
          firstName: "Rohan",
          lastName: "Sharma",
          email: "rohan.sharma@email.com",
          phone: "+919811100003",
          side: "GROOM",
          isPrimaryContact: false,
          dietaryPreference: "NON_VEG",
          allergies: "Peanuts",
          accessibilityNeeds: null,
          rsvpToken: "rsvp_sharma_groom_rohan_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Joshi Family (Bride Core)",
          firstName: "Dr. Vikram",
          lastName: "Joshi",
          email: "dr.vikram.joshi@email.com",
          phone: "+919822200001",
          side: "BRIDE",
          isPrimaryContact: true,
          dietaryPreference: "JAIN",
          allergies: null,
          accessibilityNeeds: null,
          rsvpToken: "rsvp_joshi_bride_vikram_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Joshi Family (Bride Core)",
          firstName: "Geeta",
          lastName: "Joshi",
          email: "geeta.joshi@email.com",
          phone: "+919822200002",
          side: "BRIDE",
          isPrimaryContact: false,
          dietaryPreference: "JAIN",
          allergies: "Shellfish",
          accessibilityNeeds: null,
          rsvpToken: "rsvp_joshi_bride_geeta_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Joshi Family (Bride Core)",
          firstName: "Ananya",
          lastName: "Joshi",
          email: "ananya.joshi@email.com",
          phone: "+919822200003",
          side: "BRIDE",
          isPrimaryContact: false,
          dietaryPreference: "VEGAN",
          allergies: "Lactose, Gluten",
          accessibilityNeeds: null,
          rsvpToken: "rsvp_joshi_bride_ananya_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Singhania Delegation",
          firstName: "Justice P. K.",
          lastName: "Singhania",
          email: "pk.singhania@email.com",
          phone: "+919833300001",
          side: "VIP",
          isPrimaryContact: true,
          dietaryPreference: "VEG",
          allergies: null,
          accessibilityNeeds: "Wheelchair assistance required for palace boat pier",
          rsvpToken: "rsvp_singhania_vip_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "Kapoor Family Friends",
          firstName: "Aditya Birla",
          lastName: "Kapoor",
          email: "aditya.kapoor@email.com",
          phone: "+919844400001",
          side: "MUTUAL",
          isPrimaryContact: true,
          dietaryPreference: "NON_VEG",
          allergies: null,
          accessibilityNeeds: null,
          rsvpToken: "rsvp_kapoor_mutual_aditya_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
        {
          weddingId: sharmaWedding.id,
          householdName: "University Friends",
          firstName: "Nikhil",
          lastName: "Verma",
          email: "nikhil.verma@email.com",
          phone: "+919855500001",
          side: "MUTUAL",
          isPrimaryContact: true,
          dietaryPreference: "VEG",
          allergies: null,
          accessibilityNeeds: null,
          rsvpToken: "rsvp_verma_mutual_nikhil_demo",
          invitationSentAt: new Date("2026-11-01T12:00:00+05:30"),
        },
      ])
      .returning();

    // 12.3 Event RSVPs for Each Wedding Event
    // events[0] = Mehendi, events[1] = Sangeet, events[2] = Ceremony/Pheras, events[3] = Reception
    const rsvpValues = [];
    for (const g of seededGuests) {
      for (const ev of events) {
        let status: "ATTENDING" | "DECLINED" | "TENTATIVE" | "INVITED" = "ATTENDING";
        let plusOnes = 0;
        const mealPref = g.dietaryPreference;

        if (g.firstName === "Nikhil") {
          // Declined due to international travel
          status = "DECLINED";
        } else if (g.firstName === "Rajesh" || g.firstName === "Dr. Vikram") {
          // Head of households bringing spouse/family plus-ones
          plusOnes = 1;
        } else if (g.firstName === "Justice P. K.") {
          // Attending Ceremony and Reception only
          status = ev.id === events[0].id ? "DECLINED" : "ATTENDING";
          plusOnes = 1;
        }

        rsvpValues.push({
          weddingId: sharmaWedding.id,
          guestId: g.id,
          eventId: ev.id,
          status,
          plusOnes,
          mealPreference: mealPref,
          dietaryNotes: g.allergies ? `Medical allergy note: ${g.allergies}` : null,
          respondedAt: new Date("2026-11-15T14:00:00+05:30"),
        });
      }
    }

    await db.insert(schema.guestEventRsvps).values(rsvpValues);

    // 12.4 Palace Accommodation Bookings
    await db.insert(schema.accommodationBookings).values([
      {
        weddingId: sharmaWedding.id,
        guestId: seededGuests[0].id,
        householdName: "Sharma Family (Groom Core)",
        hotelName: "Taj Lake Palace, Udaipur",
        roomNumber: "Suite 204",
        roomType: "Palace Lake View Suite",
        checkInDate: "2027-02-11",
        checkOutDate: "2027-02-14",
        confirmationCode: "TLP-77182",
        status: "CONFIRMED",
        notes: "Overlooking Jagmandir Island courtyard",
      },
      {
        weddingId: sharmaWedding.id,
        guestId: seededGuests[3].id,
        householdName: "Joshi Family (Bride Core)",
        hotelName: "Taj Lake Palace, Udaipur",
        roomNumber: "Suite 208",
        roomType: "Grand Royal Heritage Suite",
        checkInDate: "2027-02-11",
        checkOutDate: "2027-02-14",
        confirmationCode: "TLP-77189",
        status: "CONFIRMED",
        notes: "Adjacent to bridal makeup suite",
      },
      {
        weddingId: sharmaWedding.id,
        guestId: seededGuests[6].id,
        householdName: "Singhania Delegation",
        hotelName: "The Oberoi Udaivilas, Udaipur",
        roomNumber: "Room 114",
        roomType: "Premier Pool View Room",
        checkInDate: "2027-02-11",
        checkOutDate: "2027-02-13",
        confirmationCode: "OU-90123",
        status: "CONFIRMED",
        notes: "Ground floor allocation for wheelchair access",
      },
    ]);

    // 12.5 Airport & Venue Transport Assignments
    await db.insert(schema.transportAssignments).values([
      {
        weddingId: sharmaWedding.id,
        guestId: seededGuests[3].id,
        guestName: "Dr. Vikram Joshi & Family",
        transferType: "AIRPORT_PICKUP",
        pickupTime: new Date("2027-02-11T14:30:00+05:30"),
        pickupLocation: "Maharana Pratap Airport (UDR), Arrival Gate",
        dropoffLocation: "Taj Lake Palace Pier (Private Jetty)",
        vehicleType: "Toyota Innova Crysta",
        vehicleNumber: "RJ-27-PA-4421",
        driverName: "Suresh Singh",
        driverPhone: "+919829088771",
        passengerCount: 3,
        status: "COMPLETED",
        flightTrainNumber: "6E-2094 from DEL",
        notes: "Flight landed on time. Chauffeur met family with flower garlands.",
      },
      {
        weddingId: sharmaWedding.id,
        guestId: seededGuests[6].id,
        guestName: "Justice P. K. Singhania",
        transferType: "AIRPORT_PICKUP",
        pickupTime: new Date("2027-02-11T16:00:00+05:30"),
        pickupLocation: "Maharana Pratap Airport (UDR), VIP Exit",
        dropoffLocation: "The Oberoi Udaivilas Main Porch",
        vehicleType: "Mercedes S-Class",
        vehicleNumber: "RJ-27-CD-0001",
        driverName: "Harish Rao",
        driverPhone: "+919829088772",
        passengerCount: 2,
        status: "SCHEDULED",
        flightTrainNumber: "AI-471 from BOM",
        notes: "VIP protocol escort. Chauffeur alerted to wheelchair transfer.",
      },
      {
        weddingId: sharmaWedding.id,
        guestId: null,
        guestName: "Guest Inter-Venue Convoy (Udaivilas to Pier)",
        transferType: "INTER_VENUE_SHUTTLE",
        pickupTime: new Date("2027-02-12T18:00:00+05:30"),
        pickupLocation: "The Oberoi Udaivilas Lobby",
        dropoffLocation: "Jagmandir Island Jetty Pier",
        vehicleType: "Force Urbania 17-Seater",
        vehicleNumber: "RJ-27-TA-8822",
        driverName: "Mohan Lal",
        driverPhone: "+919829088773",
        passengerCount: 16,
        status: "SCHEDULED",
        flightTrainNumber: null,
        notes: "Continuous 15-minute loop shuttle for Sangeet night",
      },
    ]);

    console.log(`  ✅ Seeded ${seededGuests.length} guests across 4 households, ${rsvpValues.length} event RSVPs, 3 palace room allocations, 3 airport transfers, and 1 signed Master Agreement`);

    // ============================================================
    // 13. Notifications — Multi-channel platform alerts
    // ============================================================
    console.log("🔔 Creating demo notifications & reminders...");

    await db.insert(schema.notifications).values([
      {
        userId: users[0].id, // Priya Rathore (Founder)
        weddingId: sharmaWedding.id,
        channel: "IN_APP",
        template: "AGREEMENT_SIGNED",
        title: "Master Wedding Agreement Executed",
        body: "Dr. Vikram Sharma has signed the luxury full-service wedding agreement for Udaipur with verified SHA-256 digital stamp.",
        status: "SENT",
        providerReference: "mock-inapp-sig-001",
        isSimulator: true,
        dedupeKey: `agreement-signed-${sharmaWedding.id}`,
        sentAt: new Date(),
      },
      {
        userId: users[0].id,
        weddingId: sharmaWedding.id,
        channel: "WHATSAPP",
        template: "CLIENT_PAYMENT_DUE",
        title: "Upcoming Milestone: Second Tranche Due in 7 Days",
        body: "Reminder: ₹60,00,000 milestone invoice scheduled for Sharma Wedding on 2026-11-15.",
        status: "SENT",
        providerReference: "mock-wa-pay-001",
        isSimulator: true,
        dedupeKey: `milestone-due-${sharmaWedding.id}-tranche2`,
        sentAt: new Date(),
      },
      {
        userId: users[1].id, // Rahul Sharma (Senior Planner)
        weddingId: sharmaWedding.id,
        channel: "IN_APP",
        template: "TASK_DEADLINE",
        title: "Critical Task Due: Sangeet Pyrotechnic Fire License",
        body: "Local administration NOC for Jagmandir Island fireworks must be uploaded within 48 hours.",
        status: "SENT",
        providerReference: "mock-inapp-task-001",
        isSimulator: true,
        dedupeKey: `task-deadline-${sharmaWedding.id}-noc`,
        sentAt: new Date(),
      },
      {
        userId: users[3].id, // Vikram Meena (On-site Coordinator)
        weddingId: sharmaWedding.id,
        channel: "SMS",
        template: "VENDOR_LATE",
        title: "Gate Clearance Alert: Floral Decor Crew Arrived",
        body: "Royal Flora truck RJ-14-GA-9912 verified arrival at Taj Lake Palace Jetty gate.",
        status: "SENT",
        providerReference: "mock-sms-gate-001",
        isSimulator: true,
        dedupeKey: `gate-alert-${sharmaWedding.id}-floral`,
        sentAt: new Date(),
      },
    ]);

    console.log("  ✅ Seeded 4 platform notifications across In-App, WhatsApp, and SMS channels");

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

