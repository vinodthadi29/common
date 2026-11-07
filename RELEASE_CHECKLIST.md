# COMMON ONE release checklist

## Resolved in this branch

- [x] Removed unused `shadcn` runtime dependency and its MCP/Express/Hono dependency chain.
- [x] Updated Next.js from 16.4.3 to 16.4.5.
- [x] Added ESLint 10, `eslint-config-next` 16.4.3, flat config, and a `lint` script.
- [x] Fixed all ESLint errors in the action and prevention clients.
- [x] Migrated `middleware.ts` to Next.js 16 `proxy.ts` while preserving Supabase session refresh and protected redirects.
- [x] Added `scripts/auth-rls-e2e.mjs` for two-user authenticated RLS isolation tests.
- [x] Added strict build, TypeScript, lint, security, and production-build commands.

## Verification commands

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm run security:check
pnpm run build
pnpm run test:auth-rls
```

`test:auth-rls` creates two confirmed test users with the Supabase Admin API, signs in through the public auth API, tests own reads plus cross-user read/update/delete attempts against `captured_items` and `assistant_conversations`, checks anonymous and invalid-session reads, and deletes all fixtures in `finally`. Run it only against a dedicated test project or an approved isolated environment.

## Current audit status

- High and critical vulnerabilities: 0.
- Low vulnerabilities: 0.
- Remaining moderate vulnerability: `minimatch` in the ESLint toolchain. It is development-only, is currently constrained by the `eslint-config-next` dependency graph, and must be revisited when the upstream toolchain publishes a compatible patched range.

## Environment requirements

- Supabase URL and publishable/anon key for the app.
- `SUPABASE_SERVICE_ROLE_KEY` only for the isolated E2E harness; never expose it to browser code or deployment client variables.
- A dedicated mailbox or confirmed test users for full email-link and password-reset flows.
- AI Gateway availability for authenticated assistant-generation tests.

## Deployment blockers

- Do not release until `pnpm run test:auth-rls` passes against the target Supabase project.
- Authenticated browser pass completed for login, protected navigation, text capture upload, action creation/completion, prevention empty-state scan, and session expiration. The AI model is catalog-configured, but a direct smoke test identified a Vercel AI Gateway billing-entitlement blocker; authenticated model generation/extraction remains **BLOCKED** until billing is enabled. Signup confirmation, password reset completion, graph relationships, notifications, and assistant citations remain blocked or unverified as recorded in `QA_REPORT.md`.
- Run `pnpm run test:beta-fixtures` before each beta candidate; it covers deterministic prevention, extraction fallback constraints, source references, timezone formatting, and notification dedup inputs.
- Run the controlled Mailpit/disposable-mailbox workflow in `DEPLOYMENT.md` for signup, reset, expired, invalid, and reused links.
- Review and accept the remaining development-only `minimatch` advisory or upgrade the Next ESLint toolchain when a compatible patched version is available. Do not force an incompatible override.
- Keep the service-role key limited to CI/E2E secrets and rotate it if it is ever exposed.
- Read `DEPLOYMENT.md` before any private-beta deployment or database change.
