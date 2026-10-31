# Fixed Technology Stack

## Runtime and package management
- Node.js: `22.20.0`
- pnpm: `10.17.1`
- TypeScript: `5.9.2`
- Exact direct dependency pins; no caret or tilde ranges.
- Commit `pnpm-lock.yaml`; `.nvmrc` contains `22.20.0`.

## Core app
- Next.js: `15.5.6` (App Router)
- React: `19.1.1`
- React DOM: `19.1.1`
- Tailwind CSS: `3.4.17`
- shadcn/ui: generated components based on Radix; pin resolved package versions in lockfile.
- Lucide React: `0.545.0`
- Recharts: `2.15.4`
- TanStack Table: `8.21.3`
- React Hook Form: `7.62.0`
- Zod: `4.1.12`
- date-fns: `4.1.0`

## Data and auth
- PostgreSQL: `16.10`
- Drizzle ORM: `0.44.5`
- Clerk: `6.32.0`
- Supabase Realtime for realtime events (provider adapter boundary).
- Supabase Storage or S3-compatible storage for file bytes.
- Inngest: `3.40.0` for durable jobs and scheduled reminders.

## Testing and quality
- Vitest: `3.2.4`
- Playwright: `1.55.0`
- Testing Library for React.
- ESLint/Next lint configuration compatible with Next 15; pin exact versions after setup.
- Prettier exact version pinned in package lock.

## Deployment
- Next.js app: Vercel.
- PostgreSQL: managed Neon or Supabase Postgres.
- Storage and realtime: Supabase or documented alternative.
- Jobs: Inngest.
- Use environment variables; `.env.example` has names and safe placeholders only.

## Version policy
These are intentional fixed baseline versions for reproducible implementation. Verify registry resolution and peer compatibility before installation. If a pin cannot be resolved in the actual environment, document the problem and select the smallest compatible patch/minor adjustment; do not perform a broad framework migration. The final repository must use exact direct dependency versions and a committed lockfile.
