# Security, Privacy and Testing Requirements

## Security
- Clerk authentication; never trust client-supplied role or user ID.
- Server-side authorization on every read/mutation, scoped by wedding and role.
- Validate every request with Zod.
- Protect upload endpoints: size/type checks, safe filenames, private storage, signed URLs, virus scanning where available.
- Store secrets only in environment variables.
- Do not log raw contracts, guest allergy details, payment credentials or sensitive personal information.
- Use secure, expiring vendor check-in tokens; store token hashes, not plaintext.
- Rate limit public RSVP, check-in, auth-adjacent and document endpoints.
- Use CSRF protections where applicable and secure cookies.
- Use least-privilege provider keys.
- Avoid exposing internal financial reports to clients/vendors.
- Financial audit log is append-only and must not be editable by normal users.
- Establish retention/deletion policy for personal data; provide data export and deletion workflows where legally applicable.
- Do not claim an e-sign integration is legally compliant without verifying provider and jurisdiction requirements.

## Testing
Unit tests:
- Money calculations, tax/service-charge handling, guest sensitivity.
- Quote scoring and inclusion match.
- Backward task scheduling and dependency cycle rejection.
- Delay cascade computation.
- Payment idempotency and duplicate heuristics.
- Invoice reconciliation.
- Profit and margin calculation.
- Vendor reliability scoring.

Integration tests:
- Lead conversion transaction.
- Vendor quote selection and competitor closure.
- Check-in creates realtime event and late detection.
- Invoice reconciliation and payment transaction.
- RBAC across wedding boundaries.

E2E critical paths:
1. Lead → agreement → booking → wedding → generated tasks.
2. Upload/enter quotes → compare → select vendor.
3. Vendor QR check-in → late alert → incident resolution.
4. Vendor invoice → approved extra → payment → profit updated.
5. Client portal cannot access another couple's wedding.
6. Founder can view season analytics.

Quality gates:
- Typecheck.
- Lint.
- Unit tests.
- Integration tests where configured.
- Playwright critical flows.
- Production build.
- No unresolved critical vulnerabilities or exposed secrets.
