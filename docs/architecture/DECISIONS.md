# Architecture Decision Log

Record material decisions here. Each entry should include date, status, context, decision, alternatives and consequences.

## Template
### DEC-XXX — Short title
- Date:
- Status: Proposed | Accepted | Superseded
- Context:
- Decision:
- Alternatives:
- Consequences:
- Related PRDs:

## Initial decisions
### DEC-001 — Modular monolith
- Status: Accepted
- Decision: Build a single Next.js application with modular domains and one PostgreSQL source of truth.
- Reason: The project needs transaction consistency and fast iteration; microservices would add unnecessary operational overhead.

### DEC-002 — Deterministic financial engine
- Status: Accepted
- Decision: AI can extract/interpret source data, but pricing, reconciliation, payment and profitability arithmetic must be deterministic server-side logic.
- Reason: Financial correctness, auditability and reproducibility.

### DEC-003 — Wedding as central entity
- Status: Accepted
- Decision: Wedding is the central record with explicit relationships to events, tasks, vendors, guests, finance and incidents.
- Reason: All operational and financial reporting must reconcile to the wedding.

### DEC-004 — Node.js and pnpm runtime compatibility
- Date: 2026-10-31
- Status: Accepted
- Context: Environment has Node.js v22.19.0 installed (specification baseline: v22.20.0 LTS) and pnpm v10.17.1.
- Decision: Use Node.js v22.19.0 with pnpm v10.17.1; all specified packages and dependencies resolve cleanly without incompatibilities.
- Consequences: Full reproducibility guaranteed via committed `pnpm-lock.yaml`.

### DEC-005 — Exact paise representation for money calculations
- Date: 2026-10-31
- Status: Accepted
- Context: Floating point arithmetic introduces rounding errors in luxury budgets (e.g. ₹2+ Crore).
- Decision: All monetary figures in database tables (`leads`, `weddings`, `wedding_vendors`, `invoices`, `transactions`) are persisted as `bigint` storing exact paise (1 INR = 100 paise). The shared `src/lib/money` module performs deterministic conversions.
- Consequences: Eliminates monetary drift across all financial reconciliation and quotation scoring engines.

### DEC-006 — Product Rebranding to Gathbandhan
- Date: 2026-10-31
- Status: Accepted
- Context: Product identity was rebranded from "The Royal Knot" to "Gathbandhan" and "Gathbandhan OS".
- Decision: Rebranded all client-facing and internal documentation, metadata, landing pages, application shells, and seed fixtures across the codebase to Gathbandhan while preserving client/vendor identity records and historical migration identifiers.
- Consequences: Unified product naming throughout all views, routes, and documentation.

### DEC-007 — CRM Sales Pipeline & Atomic Lead Conversion
- Date: 2026-10-31
- Status: Accepted
- Context: Converting leads to weddings requires transactional consistency across clients, weddings, and multi-day events while strictly preventing duplicate or concurrent conversions.
- Decision: Implement an 8-stage pipeline (`NEW`, `CONTACTED`, `CONSULTATION_SCHEDULED`, `PROPOSAL_SENT`, `NEGOTIATION`, `CONVERTED`, `LOST`, `ARCHIVED`) with mandatory lost reasons for `LOST`. Enforce lead-to-wedding conversion within an atomic database transaction (`db.transaction`), verified against status flags, client foreign key links, and unique database indexes on `clients.converted_from_lead_id`. Lead communication history is tracked via a dedicated `lead_activities` table.
- Consequences: Guaranteed idempotency, zero orphaned records on conversion failures, and complete auditable communication logs.

### DEC-008 — Deterministic Landed-Cost Engine, Human Verification & Transactional Quote Commitment
- Date: 2026-10-31
- Status: Accepted
- Context: Wedding proposals vary widely in pricing structures (per-plate vs fixed charges, optional inclusions, outstation travel, overtime, varying GST brackets). Raw AI extraction cannot be trusted blindly for legal commitments.
- Decision:
  1. All quotes, items, travel, and overtime are calculated deterministically via a dedicated Landed-Cost Engine using exact integer paise (`bigint`).
  2. Extracted quotes are flagged with `NEEDS_REVIEW` and cannot be committed without human planner verification (`reviewAndVerifyQuote`).
  3. Dynamic guest-count sensitivity recalculates variable line items in real time.
  4. Inclusion gap analysis automatically highlights excluded or optional deliverables across competing proposals.
  5. Winning quote selection executes inside an atomic `db.transaction`, which awards the contract, transitions the quote to `SELECTED`, creates/updates the `wedding_vendors` assignment, closes the RFP (`CLOSED`), rejects competing quotes (`REJECTED`), and records an immutable audit log entry.
- Consequences: Mathematical precision across multi-crore vendor commitments, full protection against hidden vendor exclusions, and complete transactional integrity.

### DEC-009 — Acyclic Planning Dependency Graph & Backward Scheduling Engine
- Date: 2026-10-31
- Status: Accepted
- Context: Luxury destination weddings involve dozens of interconnected vendor deliverables and ceremonies (e.g., Palace Floor Plan → Mandap 3D Render → Production Setup → Sacred Fire Pheras). Deadlines must be calculated backward from event dates, and circular dependencies must be strictly prevented.
- Decision:
  1. Database-driven task templates (`task_templates`) define offset days relative to wedding milestones (e.g. -180d, -60d, -2d, +7d) and package tiers (`FULL_SERVICE`, `PARTIAL`, `DAY_OF`).
  2. Directed Acyclic Graph (DAG) validation via Depth-First Search (`checkForCycles`) strictly prevents circular dependency deadlocks when creating or updating task dependencies.
  3. Topological sorting guarantees valid execution order (prerequisites completed before dependents).
  4. Date-shift simulator recalculates backward-scheduled task target dates with an interactive impact preview showing overdue and at-risk milestones before applying changes.
  5. Capacity management aggregates active task counts, overdue counts, and estimated versus actual logged hours per planner.
- Consequences: Enforces chronological consistency across 28+ milestone phases, eliminates scheduling circularities, and provides full transparency on planner team capacity.

### DEC-010 — Event Control Room Real-Time Timeline, QR Vendor Check-in & Idempotent Late Detection
- Date: 2026-10-31
- Status: Accepted
- Context: On wedding day in Rajasthan heritage palaces, coordinators manage simultaneous multi-vendor operations across large grounds where spotty cellular connectivity and schedule delays occur. Planners need real-time gate clearance, early warning for late arrivals, downstream cascade impact projection, and incident cost tracking.
- Decision:
  1. Minute-by-minute timeline items (`timeline_items`) and explicit dependencies (`timeline_dependencies`) store timezone-aware instants in Asia/Kolkata (`IST`).
  2. Pure graph traversal (`calculateCascadeImpact`) projects downstream schedule shifts when an activity or vendor setup is delayed, flags affected Key Moments (Varmala, Mahurat Pheras), and provides deterministic tactical recovery options (buffer absorption, catering/emcee pacing).
  3. Frictionless vendor gate clearance uses secure cryptographic tokens (`vendor_check_ins.token_hash` via SHA-256) allowing vendor crews to confirm arrival at palace gates without downloading apps or creating accounts (`/check-in/[token]`).
  4. Idempotent late arrival detection (`checkVendorLateStatus`) compares current time against `expectedArrivalAt + graceMinutes`, flags status `LATE`, and uses `lateAlertSentAt` tracking to guarantee exactly one alert is generated even across repeated background runs.
  5. Live incident command log tracks title, severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), resolution steps, and emergency cost impact in integer paise (`bigint`) for client and agency reconciliation.
  6. Offline resilience caches current schedule, emergency directories, and vendor contacts in client-side storage with an explicit network drop banner.
- Consequences: Gives on-site coordinators full control of palace wedding execution, prevents vendor arrival surprises, protects auspicious ceremony timings, and records audit trails for billing reconciliation.

### DEC-011 — Dual-Ledger Financial Integrity, Idempotent Disbursements & Non-Auto-Approving Invoice Reconciliation
- Date: 2026-10-31
- Status: Accepted
- Context: Luxury destination weddings manage cashflows in crores across multiple decision-makers, milestone tranches, and external suppliers. Financial mistakes like duplicate vendor disbursements, untracked scope creep, or imbalanced ledgers destroy agency margin and trust.
- Decision:
  1. Strict separation of revenue and cost ledgers: `client_payment_milestones` & `client_payment_transactions` (receivables) vs `vendor_invoices` & `vendor_payment_transactions` (payables).
  2. Pure integer paise arithmetic (`bigint`, mode: "bigint") with zero floating-point math across all monetary fields.
  3. Strict transaction idempotency: every disbursal and receipt request enforces a unique `idempotency_key`. Exact retries return the existing transaction record safely.
  4. Business duplicate heuristic: flags any attempt to disburse or collect the exact same amount for the same invoice or milestone within 24 hours, requiring explicit `allowBusinessDuplicate: true` override.
  5. Deterministic invoice reconciliation against contract terms and approved extras (`approved_extras`):
     - Invariant: Positive cost variance (`variancePaise > 0n`) is NEVER auto-approved. It is flagged `OVER_BUDGET` and sets `requiresFinanceApproval: true`.
     - Invoiced amounts matching approved commitments (`variancePaise === 0n`) are flagged `EXACT_MATCH`.
     - Favorable discounts (`variancePaise < 0n`) are flagged `UNDER_BUDGET`.
  6. Dual-margin profitability engine: tracks both Projected Profit/Margin (contracted revenue minus committed vendor costs and approved outlays) and Realized Profit/Margin (collected receipts minus actual invoiced outlays), alongside category commitments.
- Consequences: Eliminates double disbursements, preserves agency margins against unauthorized vendor cost creep, ensures audit-ready settlement trails, and provides real-time balance sheet transparency for founders and finance leads.

### DEC-012 — Per-Event RSVP Architecture, Confidential Dietary Matrix & Tamper-Evident Client Agreements
- Date: 2026-10-31
- Status: Accepted
- Context: Destination weddings in Rajasthan (Jaipur, Udaipur, Jodhpur) span multiple ceremonies over several days with fluctuating attendance between intimate daytime rituals (Mehendi, Haldi) and high-attendance evening galas (Sangeet, Reception). Catering operations require accurate per-event plate commitments with dynamic safety buffers, while guest medical and dietary confidentiality must be protected against vendor leakage. Furthermore, high-value client agreements require verifiable, tamper-evident digital execution with strict client boundary isolation.
- Decision:
  1. Per-Event RSVP Architecture (`guest_event_rsvps`): Instead of a single static wedding headcount, attendance, plus-ones, and meal choices (`JAIN`, `VEG`, `NON_VEG`, `VEGAN`) are tracked per ceremony (`eventId`).
  2. Dynamic Catering Plate Commitments: A calculation engine computes exact plate commitments per event with configurable safety buffers (default 5-10%) to prevent food shortages while avoiding over-ordering penalties.
  3. Confidential Dietary & Allergy Matrix: Aggregates medical allergies (nut, dairy, gluten, shellfish, etc.) into an anonymized matrix for catering chefs, hiding personal guest identities and contact details to respect privacy.
  4. Luxury Client Portal Security Boundary: Strict tenant isolation verifies the authenticated client ID matches the wedding's assigned `clientId`. Cross-wedding access attempts throw `ForbiddenError`. Client financial views expose contract values and verified payment receipts while strictly redacting agency vendor margins, supplier cost sheets, and internal coordinator notes.
  5. Tamper-Evident Digital Agreements (`agreements`): Master service agreements store content SHA-256 hashes (`document_hash`). Electronic signatures log signer name, email, IP address, timestamp, and signature evidence payload, transitioning agreement status from `SENT` to `SIGNED`.
- Consequences: Eliminates guest count discrepancies across multi-day destination itineraries, prevents catering over-expenditure, protects VIP and guest medical privacy, provides a luxury branded portal for couples, and ensures enforceable digital contract execution.


