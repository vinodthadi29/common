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

## Failed or blocked tests

- ESLint could not run because the repository has no `eslint` executable or ESLint dependency. This is a tooling gap, not an ignored lint failure.
- `pnpm audit --audit-level high` failed: 25 vulnerabilities were reported, including high-severity advisories in transitive `zod` and `body-parser` paths through `shadcn` / MCP dependencies. These require dependency-tree remediation before production release.
- Full signup, email verification, password recovery completion, CRUD, RLS cross-account isolation, uploads, extraction, graph relationships, deadline detection, prevention persistence, action completion, notifications, and AI generation could not be completed end-to-end without a confirmed test account, mailbox, and safe test fixtures in the connected Supabase project.
- Build reports the Next.js 16 middleware convention deprecation; `middleware.ts` should migrate to `proxy.ts` before the framework removes compatibility.

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

**Not production-ready.** The core application builds and the unauthenticated boundary is now protected, but high-severity dependency findings, missing lint tooling, deprecated middleware convention, and incomplete authenticated/database end-to-end coverage remain release blockers.
