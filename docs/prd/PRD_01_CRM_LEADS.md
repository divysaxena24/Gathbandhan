# PRD 01 — CRM & Enquiry Pipeline

## Goal
Capture and track every couple enquiry from calls, WhatsApp, Instagram and web forms, then convert confirmed clients into weddings.

## User stories
- As a planner, I can create a lead with couple, contact, wedding date, guest count, theme, budget, package and source.
- I can assign an owner and next follow-up.
- I can move leads through a pipeline.
- I can schedule consultation and record notes.
- I can see potential date/capacity conflicts.
- I can convert a signed/confirmed lead into a wedding without re-entering information.

## Pipeline
NEW → CONTACTED → CONSULTATION → PROPOSAL_SENT → NEGOTIATION → SIGNED; alternative terminal state LOST.

## Requirements
- Kanban and table views.
- Search/filter by status, owner, date, source and budget.
- Lead detail activity timeline.
- Follow-up date/time and reminder status.
- Duplicate detection by contact details and date.
- Date conflict/capacity warning; allow authorized override with reason.
- Proposal package and budget data.
- Conversion is transactional and idempotent: client, wedding, events, tasks, milestones, lead status and audit events must not partially create.
- Record lost reason.
- Every mutation validates and authorizes server-side.

## Data
Lead, LeadActivity, Consultation, Client, Wedding, AuditLog, Notification.

## Acceptance criteria
- Lead is saved and visible after refresh.
- Lead owner and follow-up date are shown.
- Conversion creates one wedding only.
- Duplicate conversion returns a clear conflict or existing result.
- Pipeline status changes persist and are audited.
- Unauthorized roles cannot access unrelated leads.
