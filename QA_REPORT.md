# COMMON ONE QA Report

Date: 2026-11-06

## Scope

Tested authentication entry points, protected navigation, server-side API authorization, assistant privacy controls, build integrity, responsive layout, accessibility tree output, security checks, and dependency health. Destructive tests were not run against the connected database and no real mailbox was used.

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

## Resolved in follow-up

- Removed the unused `shadcn` runtime dependency and its vulnerable MCP/Express/Hono chain.
- Updated Next.js to 16.4.5.
- Added ESLint 10 and `eslint-config-next` 16.4.3 with flat config; `pnpm run lint` now passes.
- Migrated `middleware.ts` to the supported Next.js 16 `proxy.ts` convention while preserving Supabase session refresh and route redirects.
- Added `scripts/auth-rls-e2e.mjs` and `pnpm run test:auth-rls` for real two-user Supabase RLS verification.

## Failed or blocked tests

- Full authenticated E2E execution requires an approved isolated Supabase test environment. The harness is destructive to only its generated fixtures, but must not run against production data without that approval.
- `pnpm audit --audit-level high` now passes with zero high/critical vulnerabilities. One moderate `minimatch` advisory remains in the ESLint-only development toolchain because the current `eslint-config-next` dependency graph does not yet accept the patched major version.
- Signup confirmation, password recovery completion, uploads, extraction, graph relationships, deadline detection, prevention persistence, action completion, notifications, and authenticated AI generation still require an authenticated browser/data fixture pass.

## Fixed bugs

### Unauthenticated protected pages were accessible

- Reproduced by opening `/dashboard` with no session: the demo dashboard rendered instead of redirecting.
- Root cause: `lib/supabase/proxy.ts` refreshed sessions but never enforced protected route redirects.
- Fix: added server-side session enforcement for dashboard, capture, memory, timeline, prevention, actions, insights, assistant, and settings routes, preserving the requested path in the login URL.
- Regression coverage: `scripts/security-check.mjs` checks the redirect guard, and browser verification confirms `/dashboard` redirects to login.

## Remaining limitations

- A real authenticated test matrix is still required using two separate users to prove RLS cannot cross-read or cross-write data.
- Email confirmation and reset-link flows need a controlled mailbox or Supabase test harness.
- Upload/extraction and context graph workflows need fixture documents and database assertions.
- AI assistant success, citations, and rate-limit behavior need an authenticated model-backed run; only unauthenticated protection and static safeguards were verified.
- Dependency audit remediation and an ESLint setup are outstanding.

## Production readiness assessment

**Not production-ready.** High and critical dependency findings, missing lint tooling, and deprecated middleware are resolved. Release remains blocked until the real authenticated Supabase RLS harness passes against an isolated target environment, the authenticated browser workflow matrix is completed, and the remaining development-only moderate `minimatch` advisory is accepted or removed.
