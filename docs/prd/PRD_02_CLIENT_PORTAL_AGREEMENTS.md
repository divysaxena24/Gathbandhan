# PRD 02 — Client Portal & Agreements

## Goal
Give each couple a secure, simplified view of their wedding, agreement, progress and payments.

## User stories
- Couple can access only their own wedding(s).
- Couple can review wedding summary, dates, package and milestones.
- Couple can view/download agreement and invoices.
- Couple can see payment schedule, received payments and outstanding balance.
- Couple can approve proposal/vendor selection where enabled.
- Couple can submit guest/RSVP details.

## Agreement workflow
Draft from approved template → preview → issue secure link → client reviews → signs/accepts → signed version stored → status updated and audit record created.

## Requirements
- Version agreement template and final document.
- Record signer identity, timestamp, document hash, provider transaction/reference and evidence.
- Electronic signature demo must be labeled accurately; do not claim legal certification.
- Use expiring secure links and authorization.
- Client UI must not expose internal quote alternatives, agency margin, staff notes, or other clients.
- Document storage is private with signed URL access.

## Acceptance criteria
- Client cannot access another couple's record by changing URL/ID.
- Agreement status and document are persisted.
- Signature/acceptance evidence is retained.
- Payment display reconciles with transaction records.
- Responsive mobile client portal.
