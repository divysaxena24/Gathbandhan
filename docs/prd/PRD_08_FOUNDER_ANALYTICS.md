# PRD 08 — Founder Analytics & Season Review

## Goal
Answer founder questions with reliable, explainable operational and financial metrics.

## Dashboard metrics
- Weddings by lifecycle status.
- Contracted/collected revenue.
- Projected and final costs.
- Projected/final profit and margin.
- Receivables and payables.
- Upcoming cash inflows/outflows.
- Budget overrun.
- Tasks overdue/at risk.
- Vendor performance.
- Team workload.

## Founder questions
- Which weddings made money and which did not?
- Which wedding package has best margin?
- Which vendors are late or over budget repeatedly?
- Which employees are overloaded?
- What payments are due in 7/30/60/90 days?
- What is the season cash flow by week?
- Which wedding has the highest unresolved operational risk?

## Vendor reliability
Use documented, configurable scoring from punctuality, quality, incident rate/resolution and cost variance. Display component values and sample size. Avoid misleading score when data is sparse.

## Reports
CSV/PDF exports for wedding P&L, season P&L, vendor performance, payment due list, cash flow and team workload. Report generation must honor RBAC.

## Acceptance criteria
- Metrics derive from persisted operational/financial records.
- Projected vs final values are distinct.
- Every metric shows date range/as-of timestamp and definition.
- Season filter and wedding drill-down work.
- Export values reconcile with displayed values.
