# COMMON security notes

## Authentication and ownership

Assistant, export, action, prevention, capture, and notification APIs resolve the Supabase session on the server with `auth.getUser()`. Every query scopes records to the authenticated `user.id`; the assistant never accepts a caller-provided owner id. Conversation and message tables enforce the same ownership boundary with Supabase RLS.

## Assistant data flow

The assistant performs bounded, keyword-based retrieval from the signed-in user's facts, commitments, and captures. Retrieved rows are passed as private context to the AI Gateway model. Responses are stored only in the user's conversation tables and include source references for review. Inputs are capped at 4,000 characters, stored content at 20,000 characters, and requests are limited to 10 per user per minute.

The model instruction explicitly forbids unsupported claims, cross-user disclosure, prompt disclosure, and high-stakes decision-making. The application treats model output as guidance, not as an authorization or execution channel. No assistant tool can mutate commitments, actions, or external systems.

## Privacy controls

`GET /api/privacy/export` returns the authenticated user's context, assistant conversations, actions, and prevention records as JSON. The assistant UI also supports deleting an individual conversation. Source content remains subject to the underlying table RLS and is never returned to an unauthenticated caller.

## Browser and transport hardening

Next.js sends `nosniff`, strict referrer policy, HSTS, same-origin framing, a restrictive permissions policy, and a report-only CSP. The CSP intentionally remains report-only during preview so Supabase auth and the AI Gateway can be observed before enforcement. Before production CSP enforcement, keep the Supabase and AI Gateway origins in `connect-src` and replace unsafe script allowances with a nonce-based policy.

## Verification

Run `pnpm exec tsc --noEmit` for the application type check and `pnpm run security:check` for static checks that the assistant and privacy routes authenticate, validate input, scope queries by user, and avoid service-role imports.
