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
