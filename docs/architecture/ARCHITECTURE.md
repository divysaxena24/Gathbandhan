# Architecture — The Royal Knot OS

## Architecture style
Use a modular monolith. One Next.js codebase and one PostgreSQL database, separated into business domains. Avoid premature microservices.

## Logical layers
1. Presentation: App Router pages, layouts, server components, client interaction components.
2. API/transport: Route Handlers and server actions; request parsing and response mapping only.
3. Application services: orchestrate use cases and transactions.
4. Domain logic: deterministic calculations and state transitions.
5. Persistence: Drizzle repositories/schema and PostgreSQL.
6. Provider adapters: Clerk, storage, realtime, notifications, OCR/LLM, e-sign.

## Suggested repository structure
```text
src/
  app/
    (auth)/
    (workspace)/
      dashboard/
      leads/
      weddings/
      vendors/
      quotations/
      control-room/
      finance/
      guests/
      analytics/
    api/
  components/
    ui/
    shared/
    wedding/
    finance/
    control-room/
  modules/
    auth/
    crm/
    clients/
    weddings/
    vendors/
    quotations/
    planning/
    control-room/
    finance/
    guests/
    analytics/
    notifications/
  lib/
    db/
    auth/
    validation/
    money/
    dates/
    files/
    providers/
  tests/
drizzle/
docs/
```

## Domain boundaries
- CRM: Lead, consultation, follow-up, conversion.
- Client: couple identity, portal access, agreements.
- Wedding: central record, package, dates, lifecycle.
- Vendor: vendor master and wedding-specific assignment.
- Quotations: request, quote, quote items, normalized price/inclusions.
- Planning: templates, tasks, dependencies, workload.
- Control room: timeline items, check-ins, incidents, delay impact.
- Finance: milestones, client receipts, vendor invoices/payments, expenses, audit.
- Guest logistics: guests, event RSVP, accommodation, transport.
- Analytics: read models/queries derived from operational records.

## Central wedding relationship
Wedding is the aggregate root for wedding-scoped operations. Store `wedding_id` on related records and enforce access using server-side authorization. Use explicit join entities such as `wedding_vendors`; never place a list of vendor IDs in a wedding column.

## Realtime
Publish narrowly scoped events, such as:
- `vendor.checked_in`
- `vendor.late`
- `timeline.updated`
- `incident.created`
- `incident.resolved`
- `task.updated`
- `payment.recorded` (authorized finance views only)

Realtime is a notification/update transport, not the source of truth. Persist first, then broadcast. Client must refetch or reconcile from PostgreSQL.

## Background jobs
Use Inngest for:
- Follow-up reminders.
- Client/vendor payment due reminders.
- Vendor late checks.
- Task deadline notifications.
- Quote extraction async processing.
- Season report/export jobs.
- Retryable notification delivery.

Jobs must be idempotent and safe to retry.

## Error handling
Use typed domain errors; map them to safe user-facing messages. Do not expose stack traces or provider secrets. Log correlation/request IDs and relevant entity IDs without logging sensitive payment data.
