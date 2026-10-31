# PRD 03 — Vendor Directory & Smart Quotations

## Goal
Manage vendor relationships and compare heterogeneous quotes using true landed cost, service fit and reliability.

## User stories
- Planner maintains vendor profile, categories, contacts and service area.
- Planner sends quote requests to several vendors.
- Vendor/agency uploads quote document or enters quote items.
- Extraction creates structured draft items with confidence and source evidence.
- Planner reviews and corrects extracted values.
- Planner compares all quotes line by line.
- Planner adjusts guest count and scoring weights.
- Planner selects a quote and links the vendor to wedding.
- Competing requests close automatically after selection.

## Quote schema requirements
Represent item name, quantity, unit, unit price, fixed charge, per-plate charge, tax rule, service charge, travel, overtime, inclusion/exclusion/unspecified, validity and notes. Preserve raw document and normalized form.

## Landed cost
Calculate deterministically from quote terms, guest quantity and scenario. Include tax, service fee, travel, overtime, extra plate and fixed charges. Prevent double taxation/charge application. Show assumptions and effective cost per guest/plate.

## Comparison intelligence
- Guest sensitivity at selected counts.
- Inclusion gap detection.
- Weighted scoring with adjustable weights summing to 1.
- Vendor history: punctuality, quality, incidents, final-vs-contract variance.
- Show extracted-data confidence; low-confidence quote must require human review.
- No LLM-generated amount is treated as verified without review.

## State
REQUESTED → RECEIVED → EXTRACTION_PENDING → NEEDS_REVIEW → VERIFIED → SELECTED or REJECTED/CLOSED.

## Acceptance criteria
- Three quotes compare side-by-side.
- Costs recalculate when guest count changes.
- Each amount exposes its assumptions.
- Inclusion gaps are visible.
- Quote selection creates one wedding vendor commitment and closes competitors transactionally.
- Extraction failure leaves document available for manual entry.
