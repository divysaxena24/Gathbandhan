# Core Data Model

This is a domain-oriented schema reference. Antigravity should create normalized Drizzle schemas and migrations. Fields below are illustrative requirements, not an instruction to cram every attribute into one table.

## Core entities

### User
- id, authProviderId, name, email, role, status, createdAt
- Roles: FOUNDER_ADMIN, PLANNER, FINANCE, ONSITE_COORDINATOR, VENDOR, CLIENT.
- Use explicit membership/assignment tables if multiple agency tenants are introduced.

### Lead
- id, coupleName, contact details, source, event date, guest count, budget, theme, package type, status, assigned planner, follow-up timestamp, createdAt.

### Client
- id, couple profile, contact details, portal identity mapping.
- A lead may convert to a client; conversion must be transactional.

### Wedding
- id, clientId, title, location, startDate, endDate, guestEstimate, budget, packageType, lifecycleStatus, assignedPlannerId, currency (INR), createdAt.
- Central record for all wedding-scoped modules.

### WeddingEvent
- id, weddingId, name, eventType, startsAt, endsAt, venue/location, expectedGuestCount, status.
- Example: Mehendi, Sangeet, ceremony, reception.

### Vendor
- id, name, category, contact details, service area, rating data, active status.
- Performance metrics should be derived or stored as clearly versioned snapshots.

### WeddingVendor
- id, weddingId, vendorId, eventId optional, contractAmount, currency, scope, status, terms, expectedArrivalAt, graceMinutes.
- Join table; supports same vendor on multiple weddings and multiple vendors per wedding.

### QuotationRequest / Quotation / QuotationItem
- Request: weddingId, category, vendorId, requestedAt, dueAt, status.
- Quote: requestId, submittedAt, validity, currency, extraction status, confidence, reviewedBy, reviewedAt, raw document reference.
- Item: quoteId, name, quantity/unit, unitPrice, fixedAmount, tax rule, service charge rule, inclusion status, notes.
- Preserve original source and normalized representation.

### TaskTemplate / TaskTemplateDependency / Task / TaskDependency
- Templates support package, wedding type, event duration and offset days.
- Task: weddingId, title, description, ownerId, dueAt, status, priority, estimatedMinutes, actualMinutes, sourceTemplateId.
- Dependency relation must be explicit and acyclic.
- Task status: TO_PLAN, IN_PROGRESS, BLOCKED, REVIEW, DONE.

### Agreement
- weddingId or leadId, template/version, document reference, status, signer identity, signedAt, document hash, provider reference, audit data.
- Signature evidence must not be misrepresented as a legally certified signature.

### Guest / GuestEventRSVP
- Guest: weddingId, household/group, name, contact, dietary notes with appropriate privacy controls.
- RSVP: guestId, eventId, response, plusOnes, meal choice, arrival/departure info.
- Event attendance is not one global guest count.

### TimelineItem / VendorCheckIn / Incident
- TimelineItem: eventId, title, startsAt, endsAt, ownerId, vendor link optional, dependency links, status.
- CheckIn: weddingVendorId, token hash, expectedAt, checkedInAt, status, source.
- Incident: weddingId, eventId, title, description, severity, ownerId, reportedAt, resolvedAt, resolution, costImpact, vendorId optional.

### Finance
Separate these entities:
- ClientPaymentMilestone: weddingId, title, amount, dueAt, status.
- ClientPaymentTransaction: milestoneId, amount, paidAt, method, reference, idempotencyKey.
- VendorInvoice: weddingVendorId, invoiceNumber, issueDate, dueDate, subtotal, tax, total, status, document reference.
- VendorPaymentTransaction: invoiceId, amount, paidAt, method, reference, idempotencyKey.
- Expense: weddingId, category, amount, incurredAt, vendorId optional, billableToClient, approval status.
- AuditLog: actorId, entityType, entityId, action, oldValue, newValue, reason, occurredAt, requestId.
- Use NUMERIC or integer paise; enforce unique idempotency keys and appropriate invoice uniqueness scope.

### Guest logistics
- AccommodationBooking: weddingId, guest/group, hotel, room type, check-in/out, confirmation.
- TransportAssignment: weddingId, guest/group, pickup, dropoff, time, vehicle, status.

### Notifications
- userId, weddingId optional, channel, template, payload, scheduledAt, sentAt, status, provider reference, dedupe key.

## Constraints and invariants
- A selected vendor quote belongs to one quote request and one wedding vendor assignment.
- Competing requests should be closed in the same transaction as vendor selection.
- Prevent duplicate transaction processing using idempotency key.
- Store original invoice/quote documents and extracted structured data separately.
- Audit critical financial mutations; audit records are append-only.
- No client/vendor may access another wedding's records.
- Event and wedding times are displayed in Asia/Kolkata; store timezone-aware instants.
