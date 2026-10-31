# GATHBANDHAN

This folder is the product and engineering reference pack for building Gathbandhan.

## How to use in Antigravity

1. Open the project root in Antigravity.
2. Copy `ANTIGRAVITY_MASTER_PROMPT.md` into the agent's project instructions/context.
3. Keep this documentation folder inside the repository, preferably at `/docs`.
4. Ask Antigravity to read the master prompt and `ROADMAP.md`, inspect the repo, and implement Phase 0/1 only.
5. Before asking for a module, tell it to read that module's PRD in `prd/`.
6. Require it to update the PRD checklist, roadmap and `architecture/DECISIONS.md` after implementation.

## Document map

- `ANTIGRAVITY_MASTER_PROMPT.md` — project-wide instructions and product brief.
- `ROADMAP.md` — phased implementation sequence and milestone gates.
- `prd/PRD_00_PRODUCT.md` — overall product requirements.
- `prd/PRD_01_CRM_LEADS.md` — enquiries and pipeline.
- `prd/PRD_02_CLIENT_PORTAL_AGREEMENTS.md` — client portal and agreements.
- `prd/PRD_03_VENDOR_QUOTATIONS.md` — vendor directory and smart quotations.
- `prd/PRD_04_WEDDING_PLANNING.md` — templates, tasks, dependencies.
- `prd/PRD_05_EVENT_CONTROL_ROOM.md` — live schedule, check-ins, incidents.
- `prd/PRD_06_FINANCIAL_INTEGRITY.md` — milestones, invoices, payments, profit.
- `prd/PRD_07_GUEST_LOGISTICS.md` — RSVPs, dietary, accommodation, transport.
- `prd/PRD_08_FOUNDER_ANALYTICS.md` — season dashboard and reports.
- `prd/PRD_09_PLATFORM_SECURITY_NOTIFICATIONS.md` — shared platform concerns.
- `architecture/TECH_STACK.md` — exact stack/version baseline.
- `architecture/ARCHITECTURE.md` — application architecture and patterns.
- `architecture/DATA_MODEL.md` — core entities and relationships.
- `architecture/API_CONTRACTS.md` — API groups and contract conventions.
- `architecture/UX_SYSTEM.md` — visual and interaction guidelines.
- `architecture/SECURITY_AND_TESTING.md` — security, test strategy and quality gates.
- `architecture/DECISIONS.md` — decision log template.
- `SEED_DATA_AND_DEMO.md` — consistent demo data and presentation story.

## Source of truth and change control

The master prompt and PRDs are requirements, not permission to fake a feature. When a provider credential is missing, build a clearly labeled adapter/mock mode that preserves the domain workflow. Never claim a real email, WhatsApp, signature, payment or realtime integration works unless configured and tested.

Exact dependency versions are pinned as a compatible baseline. Before installation, the agent should confirm the selected package versions resolve in the project environment; if a specific pin is unavailable, document and make the smallest compatible adjustment rather than silently upgrading the stack.
