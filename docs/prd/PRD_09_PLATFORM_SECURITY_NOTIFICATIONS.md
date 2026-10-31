# PRD 09 — Shared Platform, Security & Notifications

## Goal
Provide safe, consistent platform services for all modules.

## Authentication and authorization
- Clerk authentication.
- Roles: FOUNDER_ADMIN, PLANNER, FINANCE, ONSITE_COORDINATOR, VENDOR, CLIENT.
- Server-side role and record scope checks on every operation.
- Wedding assignment and client ownership checks.
- Never rely on hidden UI controls as authorization.

## Notifications
Channels: in-app first, email next; WhatsApp/SMS provider adapter when configured.
Events: lead follow-up, task deadline, client payment due, vendor payment due, vendor late, incident assigned/resolved, agreement signed.
- Notification preferences.
- Deduplication key.
- Retry-safe delivery.
- Delivery state and provider reference.
- Do not claim messages sent in mock mode.

## Files
- Private storage for quotes, contracts, invoices and reports.
- Signed access URLs.
- File size/type validation and safe naming.
- File metadata in DB.
- Upload/extraction status.
- Do not store raw file bytes in database.

## Audit
Audit critical actions: agreement issue/sign, quote selection, task override, vendor contract change, invoice approval, payment, expense, role change, client data export.

## Operational requirements
- Structured logs and request IDs.
- Error boundary and safe error messages.
- Loading/empty/error states.
- Rate limits for public RSVP and check-in.
- Environment example file.
- Backup/restore plan documented.

## Acceptance criteria
- Role tests cover cross-wedding access.
- Public endpoints are scoped and rate-limited.
- Notifications are retry-safe and clearly show mock/provider status.
- Critical actions generate audit events.
