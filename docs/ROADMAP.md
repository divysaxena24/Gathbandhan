# Implementation Roadmap

## Phase 0 — Repository discovery and planning
- [x] Inspect existing repository and assets.
- [x] Read master prompt and all architecture/PRD documents.
- [x] Record decisions and clarify conflicts.
- [x] Confirm exact package versions and compatible lockfile.
- [x] Create implementation plan and issue checklist.

Gate: Architecture, data boundaries, project commands and env placeholders documented.

## Phase 1 — Foundation
- [x] Next.js app shell and responsive navigation.
- [x] Auth and RBAC.
- [x] PostgreSQL + Drizzle schema/migrations.
- [x] Shared validation, error handling and logging.
- [x] Design tokens and reusable UI.
- [x] Seed data and demo mode.
- [x] Lint/typecheck/test/build scripts.

## Phase 2 — CRM and conversion
- [x] Lead pipeline and detail view.
- [x] Follow-up reminders.
- [x] Proposal/agreement baseline.
- [x] Transactional lead conversion.
- [x] Wedding overview.

## Phase 3 — Vendor intelligence
- [x] Vendor directory.
- [x] Quote requests and quote line items.
- [x] PDF upload/extraction adapter.
- [x] Human review.
- [x] Landed-cost engine.
- [x] Guest-count sensitivity and inclusion gaps.
- [x] Weighted scoring and vendor selection.

## Phase 4 — Planning engine
- [x] Task template CRUD.
- [x] Package/event template support.
- [x] Backward scheduling.
- [x] Dependencies and cycle validation.
- [x] Task assignment and status workflow.
- [x] At-risk/overdue alerts and workload view.

## Phase 5 — Event control room
- [x] Timeline.
- [x] Secure vendor check-in links/QR.
- [x] Realtime check-in/timeline updates.
- [x] Grace-period late detection.
- [x] Incident log.
- [x] Dependency-based schedule impact.
- [x] Mobile/offline schedule basics.

## Phase 6 — Financial integrity
- [ ] Client milestones/transactions.
- [ ] Vendor contracts/invoices/payments.
- [ ] Expense and approved extra model.
- [ ] Invoice reconciliation.
- [ ] Duplicate/idempotency handling.
- [ ] Append-only audit trail.
- [ ] Projected and final profit.

## Phase 7 — Guests and client portal
- [ ] Guest and household records.
- [ ] Event RSVP.
- [ ] Dietary summary.
- [ ] Accommodation/transport.
- [ ] Client portal.
- [ ] Agreement and payment views.

## Phase 8 — Analytics and release
- [ ] Founder dashboard.
- [ ] Vendor reliability.
- [ ] Team workload.
- [ ] Cash-flow forecast.
- [ ] Reports/export.
- [ ] Notifications and reminders.
- [ ] PWA hardening.
- [ ] E2E demo flows.
- [ ] Deployment and demo runbook.

## Phase completion protocol
For each phase:
1. Read relevant PRD(s).
2. Inspect current code.
3. Implement schema/service/UI/tests in a vertical slice.
4. Run lint, typecheck, tests and build as applicable.
5. Update PRD status, roadmap and decision log.
6. Report completed scope, evidence, known gaps and next phase.
