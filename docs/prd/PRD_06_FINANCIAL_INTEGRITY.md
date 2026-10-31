# PRD 06 — Financial Integrity & Settlement

## Goal
Maintain reliable client receivables, vendor payables, invoice reconciliation, extras, audit history and wedding profitability.

## Model separation
Do not conflate:
- Client payment milestone (due obligation).
- Client payment transaction (receipt).
- Vendor contract/commitment.
- Vendor invoice.
- Vendor payment transaction.
- Expense.
- Approved client-billable extra.
- Audit event.

## Client payments
- Configurable booking, advance and final milestones.
- Milestone percentages/amounts and due dates.
- Partial payments, receipt/reference, method and status.
- Due reminders and overdue indicators.
- Validate milestones and total schedule; permit documented custom schedule.

## Vendor settlement
- Contract amount and terms.
- Advances.
- Invoice lines/tax.
- Approved extras.
- Reconcile actual invoice against contract.
- Calculate paid-to-date and remaining payable.
- Do not auto-approve unexplained variance.

## Duplicate prevention
- Idempotency key unique per transaction creation request.
- Exact retry returns existing transaction.
- Business duplicate heuristic using vendor, invoice number, wedding, amount and near date.
- Warning/conflict is explainable; legitimate installment may be allowed with reason/authorization.
- Never silently create a second payment.

## Audit
Append-only audit record for financial changes with actor, time, entity, old/new values, reason, request/correlation ID. Do not permit regular update/delete of audit records.

## Profitability
Show contracted revenue, collected revenue, committed costs, actual costs, projected costs, receivables, payables, projected profit/margin and final profit/margin. Clearly define treatment of internal staff labor and client-billable extras.

## Budget alerts and extras
- Category budget vs projected/actual cost.
- Alert at configurable thresholds and over-budget.
- Calculate extra guests using actual vendor contract rates and applicable services.
- Require approval before billable extra is added to client invoice.

## Acceptance criteria
- Payment retry cannot duplicate a transaction.
- Invoice reconciliation explains variance.
- Extra is approved and linked to source.
- Financial totals reconcile and are server-calculated.
- Audit trail records financial mutations.
- Founder sees projected profit before event closeout and final profit after closeout.
