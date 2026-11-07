# COMMON ONE deployment and recovery

## Current release

- Working branch: `v0/action-prevention-systems`
- Local release-hardening commit: `3825051`
- Current beta-readiness changes are intentionally local and must not be pushed or deployed without explicit approval.
- Preview: `https://common.v0.build`

## Required project inputs

The app requires Supabase URL and publishable/anon key variables at runtime. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and use it only for isolated E2E administration or approved recovery scripts. AI generation uses the Vercel AI Gateway through the configured model name. The current model `alibaba/qwen-3-14b` is present in the gateway catalog, but generation is blocked until the Vercel team has a valid credit card on file; this is an account entitlement issue, not a model or request-format issue. `/api/ai/health` intentionally reports `gateway: reachable`, `modelInCatalog: true`, `generation: not_tested`, and `schema: not_tested`; catalog reachability is never treated as a generation pass.

Email/password recovery now completes the loop: reset requests use the callback route, recovery callbacks land on `/reset-password`, password updates use Supabase Auth, and callback destinations are allowlisted to prevent open redirects. Synthetic document-to-facts-to-graph and mocked notification delivery fixtures are available for release verification.
Never copy secrets into Git, QA reports, blueprints, browser fixtures, or client-side code. Rotate the service-role key immediately if it appears in logs or a committed file.

## Database migration status

The repository currently contains one migration: `supabase/migrations/20261106000100_life_context_graph.sql`. It creates the life-context tables, indexes, RLS policies, storage policies, and assistant/action/prevention structures used by the app. Apply migrations through the approved Supabase migration workflow against a backup or isolated environment first; do not hand-edit production tables.

Before a production migration:

1. Confirm the target project and branch.
2. Take a database backup or point-in-time recovery checkpoint.
3. Apply the migration in a staging project.
4. Run `pnpm run test:auth-rls` with `RUN_AUTH_E2E=1` against that isolated project.
5. Verify the storage bucket `private-captures` and its owner-scoped policies.
6. Apply to production during an approved change window.

## Backup checklist

- Keep the exact Git commit and lockfile that produced the deployment.
- Export Supabase schema/migration state and confirm the migration file is present in the release artifact.
- Enable and verify Supabase point-in-time recovery for the production project.
- Record the project URL, migration version, deployment URL, and environment-variable names in the team release record; never record secret values.
- Keep a recent data export available through the authenticated `/api/privacy/export` control for user-requested portability.
- Store E2E fixture credentials only in a temporary secret store and delete them after the run.

## Recovery procedure

1. Stop the rollout and preserve logs and the last known-good commit.
2. If application-only, redeploy the last known-good commit without changing database state.
3. If a migration or data change is involved, restore the database to the approved recovery point in Supabase and verify RLS before reopening traffic.
4. Reapply only migrations known to be included in the recovered commit.
5. Run strict TypeScript, lint, security checks, production build, and the authenticated RLS harness against the recovered environment.
6. Verify login redirect protection, capture storage isolation, action persistence, assistant authorization, and privacy export before resuming beta access.

## Controlled authentication email workflow

Use a dedicated Supabase test project and a local Mailpit/MailHog inbox or an approved disposable test mailbox. Never use a customer mailbox. Create a disposable confirmed/unconfirmed test user with the service-role E2E script, then exercise these cases in order: signup verification, password reset, expired verification link, malformed/invalid link, and a second use of the same link. Record HTTP/result states without storing link tokens in Git or QA reports, then delete the test user and any generated rows/storage objects.

The current repository has the UI and callback routes, but this controlled-mailbox run is still required before beta approval. Keep email delivery configuration separate from application secrets and rotate any temporary test credentials after the run.

## Notification operations

`POST /api/notifications` schedules deduplicated in-app notifications using the user preference cadence and timezone. `POST /api/notifications/dispatch` is an internal cron endpoint and requires `Authorization: Bearer $NOTIFICATION_CRON_SECRET`; it retries delivery up to three attempts and records audit events. Configure the cron secret only in the server environment, never in browser code. External email delivery is not claimed by the current implementation until a mail provider and delivery receipt workflow are connected.

## Beta operating limits

The private beta should start with 20–30 invited users and a monitored support path. Do not enable broad public signup until authenticated workflow coverage, model generation, storage cleanup, email verification/reset flows, notification dispatch, and the remaining development-only minimatch advisory have been reviewed and accepted by the release owner.
