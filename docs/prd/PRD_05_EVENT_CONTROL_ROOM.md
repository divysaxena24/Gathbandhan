# PRD 05 — Wedding Day Control Room

## Goal
Coordinate the event in real time and surface vendor delays, incidents and schedule risks before guests are affected.

## Timeline
- Event-specific timeline, start/end times, activity owner, linked vendor and dependencies.
- Live current-time marker.
- Status and schedule updates.
- Timezone display: Asia/Kolkata.
- Touch-friendly mobile/tablet design.

## Vendor check-in
- Secure QR code or web link per wedding-vendor assignment.
- No app installation required.
- Token expires/rotates; store token hash.
- Record expected arrival, checked-in timestamp, check-in source and status.
- Status: EXPECTED, ARRIVED, SETUP_COMPLETE, WORKING, COMPLETED, LATE.
- Avoid requiring GPS for MVP.

## Late detection
Expected arrival + grace period; if no check-in, persist one late alert and notify assigned coordinator. Job must be idempotent.

## Delay cascade
Use explicit timeline dependency graph. Calculate downstream affected items and estimated shift. Explain which dependencies cause impact. AI can summarize recovery options, but cannot create hidden dependencies or silently alter event times.

## Incident log
Severity, title/description, owner, vendor/event relation, reported time, resolution time, resolution notes and cost impact. Include open/resolved status and audit history.

## Realtime/offline
Persist changes first, then broadcast via realtime provider. Cache schedule and emergency contacts for offline viewing. Queue permitted check-ins/incidents and reconcile safely when online.

## Acceptance criteria
- QR/link check-in updates coordinator view.
- Late vendor alert occurs after configured grace period.
- Delay analysis lists affected activities and reason.
- Incident can be assigned, resolved and cost impact recorded.
- Offline schedule view works in supported browser/PWA mode.
