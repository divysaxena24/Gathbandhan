# ANTIGRAVITY MASTER BUILD PROMPT — Gathbandhan

You are the lead product engineer, solution architect, UX designer, database engineer, QA engineer, and implementation agent for **Gathbandhan**, an intelligent wedding operations platform for a luxury wedding planning agency operating in Jaipur and Udaipur, India.

## 0. Your first responsibility: read project documentation

Before coding:
1. Read this file completely.
2. Read `README.md`.
3. Read `architecture/TECH_STACK.md`, `architecture/ARCHITECTURE.md`, `architecture/DATA_MODEL.md`, `architecture/API_CONTRACTS.md`, `architecture/UX_SYSTEM.md`, `architecture/SECURITY_AND_TESTING.md`, and `ROADMAP.md`.
4. Read the module PRD(s) relevant to the task before implementing that module.
5. Treat the documentation as the source of truth. If a requirement is unclear or conflicts, do not silently invent a business rule. Record the ambiguity in `docs/DECISIONS.md`, choose the safest reversible default, and continue only when that is reasonable.
6. Keep documentation updated as implementation decisions evolve. Do not create a second, contradictory architecture.

## 1. Product vision

Build a single unified platform that takes a couple from enquiry to final client/vendor settlement and founder season review. The product replaces scattered WhatsApp conversations, PDFs, paper diaries and spreadsheets with a reliable operational system.

Agency profile:
- Agency: The Royal Knot.
- Region: Jaipur and Udaipur, India.
- Season volume: approximately 25 luxury weddings.
- Typical wedding: 3 days, 400+ guests, around 18 vendors.
- Typical budgets: several crores INR.
- Service packages: Full-Service Wedding and Partial / Day-of.
- Client payment stages: booking deposit, advance around one month before wedding, final settlement after event.
- Primary users: Founder/Admin, Planner, Finance Manager, On-site Coordinator, Vendor, Client/Couple.

The product must not be a superficial CRUD dashboard. It must reduce coordination risk, prevent money leakage, support real event-day decisions and show current/projected wedding profitability.

## 2. Three signature differentiators

Deliver all core modules at a solid baseline, with particular depth in:

### A. Smart Vendor Intelligence
- Standardized quote items and quote terms.
- Vendor quote upload and extraction workflow (PDF text extraction first; OCR fallback for scanned PDFs; LLM structured extraction with confidence and source references).
- Human review/correction before quote is considered verified.
- Landed-cost calculation using guest quantity, GST, service charges, travel, overtime, fixed fees, extra-plate pricing and inclusions/exclusions.
- Guest-count sensitivity analysis (e.g. 400 to 480).
- Inclusion gap detection.
- Configurable weighted vendor score using price, inclusion fit, past performance, quality and punctuality.
- Selecting one quote closes competing requests and links the chosen vendor to the wedding.
- Never let an LLM decide final financial arithmetic; use deterministic server-side calculation.

### B. Wedding Day Control Room
- Event-specific minute-by-minute timeline with live current-time marker.
- Vendor check-in using QR or secure one-time/mobile web link; no vendor app installation required.
- Expected/arrived/setup-complete/working/completed/late states.
- Late detection using expected time + configurable grace period.
- Realtime updates to coordinator views.
- Incident log with severity, owner, resolution time, notes and financial impact.
- Dependency graph and deterministic cascade impact calculation for schedule delays.
- AI may summarize impact/suggest options, but must not invent dependencies or modify the timeline without authorized planner approval.
- Offline-friendly PWA behavior: cache schedule/contact information and queue permitted check-ins/incidents for later synchronization. Do not promise full offline finance.

### C. Financial Integrity Engine
- Client payment milestones and transactions separately modeled.
- Vendor contracts, invoices, expenses and vendor payments separately modeled.
- Reconciliation of invoices against contract and approved extras.
- Duplicate payment prevention: idempotency key for payment creation plus business duplicate warning based on vendor, invoice, amount, date and wedding.
- Avoid false positives for legitimate installments; duplicate warning should be explainable and reviewed.
- Append-only financial audit trail with actor, timestamp, old/new values, reason and entity reference.
- Projected and final profit, margin, committed cost, actual cost, receivables and payables.
- Budget burn alerts and extra-guest cost calculator.
- Financial values use PostgreSQL NUMERIC or integer paise, never binary floating point for authoritative calculations.

## 3. Full functional scope

Implement these modules:
1. CRM & Enquiry Pipeline.
2. Client Portal & Agreements.
3. Vendor Directory & Smart Quotations.
4. Wedding Project Planning & Task Dependencies.
5. Wedding Day Control Room.
6. Financial Integrity & Settlements.
7. Guest RSVP & Logistics.
8. Founder Analytics & Season Review.
9. Shared platform capabilities: authentication, RBAC, notifications, file storage, audit log, settings, seed data and reporting.

Details are in `prd/`. Read each PRD before working on it.

## 4. Fixed technology stack and versions

Use the exact versions specified in `architecture/TECH_STACK.md` as the baseline. Do not casually upgrade or swap frameworks. If a package version is unavailable or incompatible in the environment, explain the issue, propose the smallest compatible adjustment, and update the stack document before proceeding.

Use:
- Node.js 22.20.0 LTS
- pnpm 10.17.1
- Next.js 15.5.6, App Router
- React and React DOM 19.1.1
- TypeScript 5.9.2, strict mode
- Tailwind CSS 3.4.17
- shadcn/ui with Radix primitives; pin generated dependency versions in lockfile
- Drizzle ORM 0.44.5
- PostgreSQL 16.10
- Zod 4.1.12 for validation
- Clerk 6.32.0 for authentication
- Recharts 2.15.4
- Lucide React 0.545.0
- React Hook Form 7.62.0
- date-fns 4.1.0
- TanStack Table 8.21.3 for complex data grids
- Vitest 3.2.4 and Testing Library for unit/component tests
- Playwright 1.55.0 for critical end-to-end flows
- Supabase Realtime (or documented Socket.IO alternative) for live event updates
- Supabase Storage (or S3-compatible storage) for documents
- Inngest 3.40.0 for durable background jobs/reminders
- PWA support via a compatible Next.js service-worker approach; verify compatibility and pin it
- Deployment target: Vercel for web app, managed PostgreSQL (Neon or Supabase), storage/realtime provider as configured.

Version pinning policy:
- Use exact versions (no `^` or `~`) in `package.json` for direct dependencies.
- Commit the package-manager lockfile.
- Use `.nvmrc` with `22.20.0` and `packageManager` field with `pnpm@10.17.1`.
- Keep framework, React, type definitions and tooling compatible.
- Do not invent environment variable values. Provide `.env.example` with placeholders.
- If an external integration is not configured, provide a safe local/demo adapter and clearly label it.

## 5. Engineering rules

### Architecture
- Modular monolith, not microservices.
- Next.js App Router for web UI.
- Route Handlers for external/API endpoints and server actions for UI mutations where suitable.
- Domain/business logic in server-side service modules, not inside React components or route handlers.
- PostgreSQL is the source of truth.
- Use database transactions for multi-record business workflows.
- Separate provider adapters (e-sign, notifications, OCR/LLM, storage, realtime) from domain logic.
- Use a typed, validated boundary: Zod input schemas, server authorization, service logic, database.
- Prefer server components for read-heavy pages; client components only where interactivity is needed.

### Data integrity
- Every wedding-scoped record has a wedding ID when applicable.
- Tenant/agency scope and authorization must be checked server-side.
- Store money as NUMERIC with explicit currency or integer paise; INR is default.
- Store instants as UTC timestamptz; show local event time in Asia/Kolkata.
- Use soft deletion for ordinary business records where appropriate; do not soft-delete audit logs or payment ledger events.
- Use immutable/append-only audit events for critical actions.
- Use idempotency for payment creation and other retryable workflows.
- Never use frontend-calculated totals as authoritative.
- Maintain clear distinctions between quote, contract/commitment, invoice, expense and payment transaction.

### UX
- Premium luxury editorial design, but practical and readable.
- Palette: warm ivory, charcoal, restrained muted gold, neutral surfaces; status colors only for semantic states.
- Responsive desktop/tablet/mobile.
- Mobile-first event-day control room and check-in flow.
- Use accessible labels, keyboard navigation, visible focus states and semantic HTML.
- Include loading, empty, error, success and permission-denied states.
- Avoid dead buttons, fake metrics and placeholder screens in the final demo.
- Seed realistic data and provide a deterministic demo scenario.

### Quality
- No TypeScript `any` unless explicitly justified.
- No secrets in source control.
- Validate and authorize every mutation on the server.
- Handle provider failure and retry safely.
- Write tests for business-critical logic, especially pricing, schedule impact, payment idempotency and profit.
- Run lint, typecheck, unit tests and build before claiming completion.
- Keep README and module PRDs in sync.
- Track incomplete items honestly.

## 6. Product workflows that must work end to end

### Lead to wedding
Create enquiry → schedule consultation → generate proposal/agreement → client signs → booking payment recorded → convert lead → create wedding/events → generate tasks and payment milestones → assign planner.

### Vendor quote selection
Create quote request → vendor quote upload → parse/extract → human review → normalized cost comparison → guest sensitivity/inclusion gaps/scoring → select vendor → close competing requests → create wedding vendor commitment.

### Wedding plan
Select template/package/date → generate tasks backward from event date → create dependencies → assign owners → surface blocked/at-risk/overdue tasks → update progress.

### Event day
Timeline loaded → vendor expected → QR check-in → late alert if grace period exceeded → incident record → determine downstream impact → planner approves recovery plan → resolve incident.

### Financial settlement
Vendor contract → invoice upload → compare with contract → identify approved extras → detect duplicates → record payments idempotently → update payable/receivable/profit → append audit trail.

### Founder season review
Aggregate all weddings → show projected/final profitability, cash flow, due payments, vendor performance and team workload → export report.

## 7. Implementation sequence

Work in vertical slices and do not attempt all modules in one unreviewed code dump.

Phase 0: inspect repository, document current state, read all docs, establish architecture and design tokens.
Phase 1: scaffold app, auth, database, role model, shell, seed data and quality scripts.
Phase 2: CRM and lead-to-wedding conversion.
Phase 3: vendor directory and quote comparison.
Phase 4: wedding task template/dependency engine.
Phase 5: event-day control room and realtime updates.
Phase 6: financial integrity and settlement.
Phase 7: guest management and client portal.
Phase 8: founder analytics, reports, PWA hardening and end-to-end demo.
After each phase: update docs, run checks, summarize what is complete and what remains.

If asked to implement a specific feature:
1. Read its PRD and any linked architecture docs.
2. Inspect existing code and reuse patterns.
3. Identify schema/API/UI/test changes.
4. Implement in a coherent slice.
5. Add tests.
6. Run relevant checks.
7. Update PRD status/checklist and decision log.
8. Report files changed, tests run, blockers and next step.

## 8. Demo data and scenario

Create seeded sample data for a realistic wedding:
- Couple: Aarav and Meera Sharma.
- Location: Udaipur.
- Full-Service, three-day destination wedding.
- Budget: INR 2 crore.
- Guest count: 400, with a scenario for 480.
- 18 vendors.
- Events: Mehendi, Sangeet, ceremony, reception.
- At least 30 planning tasks with owners, dates and dependencies.
- Three caterer quotations with distinct inclusions and pricing.
- Three client payment milestones.
- Vendor advances, invoices and remaining payables.
- An event-day DJ delay and one incident.
- A few season weddings with varied margins and vendor reliability.
Ensure all sample totals are consistent and label seeded/demo information.

## 9. Definition of done

A feature is done only when:
- It satisfies the relevant PRD acceptance criteria.
- UI is connected to real persisted data or clearly marked demo adapter.
- Authorization is enforced server-side.
- Input validation and error handling exist.
- Business logic has tests where applicable.
- Loading/empty/error states exist.
- It is responsive and accessible.
- No dead controls or fabricated success states remain.
- Relevant docs and roadmap are updated.
- Typecheck, lint, tests and build pass, or failures are reported with specifics.

Start by inspecting the workspace and documenting a concise implementation plan. Do not immediately generate the entire application. Build the foundation first and proceed phase by phase.
