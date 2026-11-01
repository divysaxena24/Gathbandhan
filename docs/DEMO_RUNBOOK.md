# Gathbandhan — End-to-End Evaluation & Demo Runbook

Welcome to **Gathbandhan** — Where Every Celebration Comes Together, built for high-end wedding planning agencies in Rajasthan (Jaipur, Udaipur, Jodhpur).

This runbook provides a complete step-by-step walkthrough to evaluate, demo, and verify every phase of the platform.

---

## 1. System Overview & Technology Stack

| Component | Technology | Specification |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.5.6 (App Router) | React 19.1.1, TypeScript 5.9.2 (Strict) |
| **Styling** | Tailwind CSS 3.4.17 | Luxury Rajasthan Palette (Gold, Charcoal, Sand, Ivory, Ruby) |
| **Database** | PostgreSQL 16 + Drizzle ORM 0.44.5 | 33 relational tables, BigInt integer paise mode |
| **Authentication** | Clerk 6.32.0 | Role-Based Access Control (FOUNDER_ADMIN, PLANNER, FINANCE, ONSITE_COORDINATOR, VENDOR, CLIENT) |
| **Testing** | Vitest 3.2.4 | 25 test suites, 137+ unit & integration tests |
| **Offline/PWA** | Web App Manifest + Service Worker Ready | Standalone luxury UI with network status caching |

---

## 2. Environment Setup & Seed Data

Run the database seed script to populate realistic luxury destination wedding data centered around the **Sharma Royal Wedding** in Udaipur (₹2 Crore budget, 400 guests, Taj Lake Palace & The Oberoi Udaivilas):

```bash
# Generate database migrations
pnpm db:generate

# Seed 25 season weddings, vendors, tasks, timeline items, finances, guests & notifications
pnpm db:seed
```

Start the development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Step-by-Step E2E Demo Walkthrough

### Flow 1: CRM & Lead-to-Wedding Conversion (Phase 2)
1. Navigate to `/leads`.
2. Inspect the **Sales Pipeline**:
   - Stages: New Enquiry -> Contacted -> Qualified -> Consultation Scheduled -> Proposal Sent -> Negotiation -> Won -> Lost.
3. Open an active enquiry (e.g. *Dr. Vikram Sharma & Ananya Joshi*).
4. Review the **Lead Detail Panel**:
   - Destination: Udaipur, Budget: ₹2,00,00,000 (₹2 Crore), Guest Count: 400.
   - Activity timeline tracking notes and stage history.
5. Click **Convert Lead to Wedding**:
   - Automatically provisions a Client record and initializes a Project Wedding in the database in a single atomic transaction.

### Flow 2: Vendor Intelligence & AI Quotation Analyzer (Phase 3)
1. Navigate to `/vendors`:
   - Explore verified Rajasthan vendors across categories: Venues, Catering, Royal Decor, Heritage Photography, DJ/Sound.
2. Navigate to `/quotation-analyzer`:
   - Upload sample vendor PDF proposals (catering menu, palace floral layout).
   - Review extracted line items: base price, travel fees, overtime charges, inclusions, and exclusions.
3. Navigate to `/quotations/compare`:
   - Inspect the **Landed Cost Engine**: Normalizes quotes to landed costs incorporating guest sensitivity and inclusion gap penalties.

### Flow 3: Planning Engine & Backward Scheduling (Phase 4)
1. Navigate to `/planning`:
   - View the 28+ milestone phases of royal wedding planning.
2. Inspect **Backward Scheduling**:
   - All tasks automatically anchor backward from the auspicious Mahurat ceremony date (`T-90`, `T-60`, `T-30`, `T-7`, `T-1`).
   - Dependency graph enforces that critical predecessor tasks (e.g., *Palace NOC License*) must precede successor tasks.
3. Trigger a Date Shift:
   - Rescheduling a wedding date recalculates all downstream due dates atomically without circular loops.

### Flow 4: Event Control Room & Real-Time Operations (Phase 5)
1. Navigate to `/control-room`:
   - Live minute-by-minute wedding day execution timeline in Asia/Kolkata (`IST`).
2. Test **QR Gate Clearance**:
   - Open `/check-in/[token]` on a mobile viewport.
   - Chauffeurs and decor trucks check in at palace gates without downloading apps or creating accounts.
3. Test **Cascade Impact Engine**:
   - Mark a ceremony activity or vendor setup as 45 minutes delayed.
   - Traverses the dependency graph, flags affected Key Moments (Varmala, Mahurat Pheras), and displays tactical recovery options.
4. Review **Incident Command Log**:
   - Log emergency incidents (e.g., lake wind gusts, power generator trip), assign severity, and record cost impact in paise.

### Flow 5: Financial Integrity & Settlement (Phase 6)
1. Navigate to `/finance`:
   - Dual-ledger architecture strictly separating receivables from payables.
2. Review **Client Payment Tranches**:
   - Milestone schedule (Booking Advance, Mid-Planning Tranche, Final Settlement).
   - Disbursal transactions with idempotency key enforcement.
3. Test **Non-Auto-Approving Invoice Reconciler**:
   - Matches vendor invoices against contract values and approved extras.
   - Invariant: Positive cost variance (`variancePaise > 0n`) is **NEVER** auto-approved. It is flagged `OVER_BUDGET` and requires finance approval.
4. Review **Dual-Margin Profitability Engine**:
   - Displays Projected Margin (contracted) vs Realized Margin (cash collected minus disbursed).

### Flow 6: Guest Logistics & Client Portal (Phase 7)
1. Navigate to `/guests`:
   - **Guest Roster**: Household groupings, wedding side filters (Bride / Groom / VIP), and one-click WhatsApp RSVP link sharing.
   - **Dietary Matrix**: Per-ceremony plate commitments with a dynamic 5-10% buffer selector, Jain/Veg breakdown, and confidential chef allergy matrix.
   - **Palace Allocations**: Suite assignments at Taj Lake Palace and The Oberoi Udaivilas.
   - **Transfers**: Airport arrival transfers and chauffeur fleet tracking.
2. Test **Public Guest RSVP**:
   - Open `/rsvp/[token]` in a mobile browser.
   - Submit per-event RSVPs (Mehendi, Sangeet, Ceremony, Reception) with plus-ones and meal preferences.
3. Navigate to `/portal`:
   - Experience the luxury Couple Portal.
   - Review the Master Service Agreement and execute an electronic signature with SHA-256 digital stamp.
   - Invariant: Client financial view strictly redacts agency vendor markups and internal notes.

### Flow 7: Founder Analytics & Season Review (Phase 8)
1. Navigate to `/analytics`:
   - **Season KPIs**: Live balance sheet, contracted revenue, collected revenue, committed costs, projected profit, and margins.
   - **Package Margins**: Answers *Which wedding package has the best margin?*
   - **Wedding P&L Drill-Down**: Answers *Which weddings made money and which did not?*
   - **Cash Flow Horizons**: Answers *What payments are due in 7/30/60/90 days?*
   - **Vendor Reliability Ratings**: Answers *Which vendors are late or over budget repeatedly?* (with sparse data warnings).
   - **Team Capacity**: Answers *Which employees are overloaded?*
   - **Operational Risk Radar**: Answers *Which wedding has the highest unresolved risk?*
2. Test **Report Exports**:
   - Click **Export Report** to download CSV exports for Season P&L, Wedding P&L, Cash Flow, Vendor Reliability, and Team Capacity.

### Flow 8: Multi-Channel Platform Notifications (Phase 8)
1. Click the **Notification Bell** in the top navigation bar.
2. Review multi-channel alerts (In-App, WhatsApp, SMS simulator alerts).
3. Test marking individual notifications as read or clicking **Mark all read**.
4. Test deduplication: repeated notifications with identical `dedupeKey` are deduplicated safely.

---

## 4. Quality Verification & Test Execution

Run the complete test suite and verification commands:

```bash
# 1. ESLint verification (0 errors, 0 warnings)
pnpm lint

# 2. Strict TypeScript type check (0 errors)
pnpm typecheck

# 3. Vitest test runner (25 test files, 137+ tests)
pnpm test -- --run

# 4. Next.js production build (50+ routes compiled)
pnpm build
```

---

## 5. Architectural Decision Records (ADRs)

Key architectural decisions are documented in [`docs/architecture/DECISIONS.md`](file:///c:/Users/HP/OneDrive/Desktop/Padhai/Hackathon/Gathbandhan/docs/architecture/DECISIONS.md):
- `DEC-001` to `DEC-008`: Core stack, Next.js App Router, Clerk Auth, Integer Paise Arithmetic.
- `DEC-009`: Backward Scheduling & Chronological Invariants.
- `DEC-010`: Real-Time Timeline, QR Vendor Gate Clearance & Idempotent Late Detection.
- `DEC-011`: Dual-Ledger Financial Integrity, Idempotent Disbursements & Non-Auto-Approving Invoice Reconciliation.
- `DEC-012`: Per-Event RSVP Architecture, Confidential Dietary Matrix & Tamper-Evident Client Agreements.
- `DEC-013`: Founder Season Analytics, Multi-Dimensional Vendor Scoring & Idempotent Notification Dispatch.
