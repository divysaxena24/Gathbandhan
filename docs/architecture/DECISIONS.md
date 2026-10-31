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
