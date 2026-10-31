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
