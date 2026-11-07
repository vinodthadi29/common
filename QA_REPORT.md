# COMMON ONE QA Report

Date: 2026-11-06

## Scope

Tested authentication entry points, protected navigation, server-side API authorization, assistant privacy controls, build integrity, responsive layout, accessibility tree output, security checks, dependency health, and a controlled authenticated browser pass. The authenticated RLS harness and browser fixture cleanup ran against the connected project; no real mailbox was used.

## Passed tests

- `pnpm exec tsc --noEmit` — passed with strict build validation enabled.
- `pnpm run build` — passed and completed TypeScript validation during the production build.
- `pnpm run security:check` — passed all ownership, input validation, rate-cap, service-role, privacy export, and protected-route checks.
- Login page rendered with labeled email/password controls and a sign-in action.
- Signup page rendered with labeled full name, email, and password controls.
- Password recovery page rendered with a labeled email control and reset-link action.
- Unauthenticated requests to `/api/assistant`, `/api/privacy/export`, `/api/actions`, and `/api/prevention` returned `401`.
- Unauthenticated `/dashboard` navigation redirects to `/login?next=%2Fdashboard` after the route-guard fix.
- Assistant preview rendered at desktop `966x609` and mobile `375x667` without browser console errors.
- Assistant UI has keyboard-submit protection for IME composition, accessible labels, source chips, privacy export, and conversation deletion controls.
- Production build emitted baseline security headers configuration.
- `pnpm run test:auth-rls` passed against the connected Supabase project: two real users, own reads, zero cross-user reads, zero cross-user updates, zero cross-user deletes, zero anonymous reads, and zero invalid-session reads. Generated users and rows were deleted in cleanup.
- Authenticated browser login passed with a confirmed test account; protected dashboard navigation loaded only after login.
- Authenticated capture upload passed for a text document and private storage/row creation returned the expected “Stored privately” state. Generated storage and database fixtures were deleted in cleanup.
- Authenticated Action Center create and persisted completion passed; the task disappeared from open actions after completion.
- Authenticated Prevention page and scan passed with the safe empty state and no active risks.
- Session expiration simulation passed by clearing browser cookies and confirming `/dashboard` redirected to `/login?next=%2Fdashboard`.

## Resolved in follow-up

- Removed the unused `shadcn` runtime dependency and its vulnerable MCP/Express/Hono chain.
- Updated Next.js to 16.4.5.
- Added ESLint 10 and `eslint-config-next` 16.4.3 with flat config; `pnpm run lint` now passes.
- Migrated `middleware.ts` to the supported Next.js 16 `proxy.ts` convention while preserving Supabase session refresh and route redirects.
- Added `scripts/auth-rls-e2e.mjs` and `pnpm run test:auth-rls` for real two-user Supabase RLS verification.

## Failed or blocked tests

- Signup email verification and password reset completion are blocked on a controlled mailbox; form rendering and reset request behavior were not treated as completion.
- PDF/image uploads, graph relationships, deadline detection with seeded commitments, prevention resolve/deduplication, notification delivery, and document deletion still need dedicated authenticated fixtures.
- Deterministic prevention, extraction fallback/unsupported-file handling, source-reference requirements, notification timezone/source mapping, and duplicate-key inputs passed via `pnpm run test:beta-fixtures`.
- `/api/ai/health` now reports `configured` for `alibaba/qwen-3-14b`: the model exists in the gateway catalog, but entitlement is not probed by health checks.
- Direct server-side smoke test traced the failure through auth/configuration and the AI SDK request to the provider: model ID and request format were accepted, but AI Gateway returned `AI Gateway requires a valid credit card on file to service requests`. The adapter now classifies this as `AiBillingRequiredError`, avoids pointless retries, and returns a safe setup-required response without exposing provider details or secrets.
- Authenticated browser smoke test passed authentication, session authorization, request validation, provider dispatch, and safe error rendering. The UI displayed “AI Gateway billing setup is required before the assistant can generate an answer.” The generated assistant answer was not persisted; the temporary test account had only a user message and no completion audit event, then was deleted.
- Authenticated assistant/extraction generation remains **BLOCKED** by gateway billing entitlement. Source citation and prompt-injection behavior are **SKIPPED** until a real model request succeeds.
- Invalid-key, timeout, malformed-provider-response, invalid-JSON, and missing-field cases are **SKIPPED** because they require mutating provider credentials or forcing provider responses; the adapter has explicit safe classification/fallback paths for these classes, and the billing path was exercised end to end.
- `pnpm audit --audit-level high` passes with zero high/critical vulnerabilities. One moderate `minimatch` advisory remains only in the ESLint development toolchain: vulnerable `>=7.0.0 <11.0.1`, patched `>=11.0.1`; `eslint@10.14.0` requires `^10.2.6`, so no compatible safe override was applied. Production code does not import this package.

## Fixed bugs

### Unauthenticated protected pages were accessible

- Reproduced by opening `/dashboard` with no session: the demo dashboard rendered instead of redirecting.
- Root cause: `lib/supabase/proxy.ts` refreshed sessions but never enforced protected route redirects.
- Fix: added server-side session enforcement for dashboard, capture, memory, timeline, prevention, actions, insights, assistant, and settings routes, preserving the requested path in the login URL.
- Regression coverage: `scripts/security-check.mjs` checks the redirect guard, and browser verification confirms `/dashboard` redirects to login.

## Remaining limitations

- Two-user RLS and session-boundary coverage passed; document access is covered at the database ownership level, while a second-user browser session remains a separate optional UI check.
- Email confirmation and reset-link completion need a controlled mailbox.
- PDF/image upload, extraction, context graph relationships, seeded deadline detection, prevention resolve/deduplication, notifications, and document deletion need dedicated fixtures.
- AI assistant success, citations, prompt-injection resistance, and rate-limit behavior need an available authenticated model-backed run.
- The only remaining audit finding is the documented development-only `minimatch` advisory.

## Production readiness assessment

**Not ready for beta invitation yet.** High and critical dependency findings, missing lint tooling, deprecated middleware, and the RLS ownership boundary are resolved. The model health catalog is available and the adapter now has timeout, retries, structured validation, rate limiting, usage audit events, fallback states, and a health endpoint, but authenticated generation still returned temporary unavailability. Beta also needs the controlled mailbox workflow, authenticated notification dispatch, seeded document/graph fixtures, and explicit release-owner acceptance of the development-only `minimatch` advisory. Backup, recovery, email, and notification operations are documented in `DEPLOYMENT.md`.
