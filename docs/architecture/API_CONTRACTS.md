# API Contracts and Service Boundaries

Use consistent REST resource names, JSON payloads, Zod validation and typed response envelopes. These routes are a contract guide; Antigravity may adapt route grouping to existing Next.js conventions but must preserve use cases.

## API groups
- `/api/leads`
- `/api/leads/:id/convert`
- `/api/clients`
- `/api/weddings`
- `/api/weddings/:id/events`
- `/api/weddings/:id/tasks`
- `/api/weddings/:id/vendors`
- `/api/vendors`
- `/api/quotation-requests`
- `/api/quotations/:id/extract`
- `/api/quotations/:id/review`
- `/api/quotations/compare`
- `/api/quotations/:id/select`
- `/api/weddings/:id/timeline`
- `/api/check-in/:secureToken`
- `/api/weddings/:id/incidents`
- `/api/weddings/:id/client-payment-milestones`
- `/api/client-payments`
- `/api/vendor-invoices`
- `/api/vendor-payments`
- `/api/invoices/:id/reconcile`
- `/api/weddings/:id/guests`
- `/api/weddings/:id/rsvps`
- `/api/analytics/season`
- `/api/reports/:reportType`

## Response conventions
- Successful read: `{ data, meta? }`
- Successful mutation: `{ data, message? }`
- Validation failure: 400 with field errors.
- Unauthorized: 401.
- Forbidden: 403.
- Not found: 404.
- Conflict (duplicate/state conflict): 409 with safe explanation.
- Unexpected error: 500 with correlation ID; no stack trace to client.

## Critical service contracts

### convertLeadToWedding
Input: leadId, approved proposal/agreement, package, wedding date and initial payment evidence as appropriate.
Behavior: transactionally create client/wedding/events/milestones/tasks, update lead status and record conversion audit. Must be idempotent or reject repeat conversion with conflict.

### compareVendorQuotations
Input: quote IDs, guest count, scoring weights, required inclusion set.
Output: per quote line items, tax/service/travel/overtime assumptions, landed cost, per-plate effective cost, inclusion gaps, normalized score, confidence/review state.
Must be deterministic and explainable.

### selectVendorQuote
Input: quoteId, approved terms.
Behavior: transactionally select quote, create wedding vendor assignment/contract commitment, close competing requests, write audit log.

### checkVendorLateStatus
Input: expected arrival and grace minutes, current time.
Behavior: if not checked in and threshold exceeded, persist late status/alert idempotently and notify assigned coordinator.

### calculateScheduleImpact
Input: delayed timeline item/vendor and proposed delay.
Output: affected downstream items, estimated shifted times, criticality and reasons.
Use graph traversal and scheduling rules; never use AI for arithmetic or dependency discovery.

### reconcileVendorInvoice
Input: invoice, contract, approved extras, discrepancy handling.
Output: variance lines, billable client extras, approval requirements, payable balance.
Do not auto-approve unknown variance.

### createPaymentTransaction
Input: invoice/milestone, amount, method/reference, idempotency key.
Behavior: validate amount and permission, detect duplicate, transactionally write transaction and audit event. Return existing transaction on exact idempotent retry; return conflict/warning for likely business duplicate.

### calculateWeddingProfit
Output: contracted revenue, collected revenue, projected/committed costs, actual costs, receivables, payables, projected profit, final profit, margin, as-of timestamp and assumptions.
