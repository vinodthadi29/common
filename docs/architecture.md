# COMMON ONE — Technical Architecture

**Status:** Proposal for approval  
**Product:** COMMON ONE, a privacy-first personal intelligence platform  
**Initial users:** Students and early-career job seekers

## 1. Goals and non-goals

### Goals
- Help people organise important life information.
- Turn verified personal context into clear responsibilities, risks, and next actions.
- Keep facts, user-provided evidence, and AI inferences visibly distinct.
- Require human approval before external or consequential actions.
- Provide strong tenant isolation, auditability, accessibility, and responsive UX.

### Non-goals for the first implementation stage
- No complete application build.
- No autonomous external actions.
- No medical, legal, financial, or employment decisions presented as authoritative advice.
- No broad family, business, or elderly-user workflows until the core model is validated.

## 2. Proposed system shape

```text
Browser
  -> Next.js App Router UI
  -> Server Actions / Route Handlers
      -> Domain services
          -> Repositories / Supabase client
          -> AI orchestration service
          -> Audit and policy checks
      -> Supabase Auth / PostgreSQL / Storage
      -> Provider-independent model gateway

Optional later service:
  FastAPI AI worker for long-running, CPU/GPU-heavy, or isolated processing.
```

The initial system should remain a modular Next.js application. A separate FastAPI service is justified only when processing needs exceed request/response limits, require specialized Python libraries, or benefit from independent scaling and isolation.

## 3. Core modules

- **Identity and access:** Supabase Auth, profile management, session handling, authorization checks.
- **Personal knowledge:** User-owned records, documents, facts, sources, tags, and lifecycle state.
- **Responsibilities:** Deadlines, recurring obligations, status, priority, and evidence links.
- **Intelligence:** Explainable extraction, classification, summaries, risk signals, and suggested actions.
- **Action center:** Review queue, user approval, reminders, and future integrations.
- **Evidence and provenance:** Source references, confidence, timestamps, model metadata, and human corrections.
- **Privacy and governance:** Consent, retention, export, deletion, audit events, and access boundaries.

## 4. Data boundaries and security

- Every user-owned table includes an owner or account scope and is protected with Supabase Row Level Security.
- Frontend code uses only publishable Supabase configuration. Service-role credentials remain server-only.
- Sensitive writes and AI requests run through server-side actions or route handlers with schema validation.
- File uploads use private Supabase Storage buckets, signed URLs, MIME/size validation, and virus-scanning hooks when available.
- AI inputs are minimized, redacted where practical, and never treated as verified facts without user confirmation.
- External actions are represented as pending proposals until explicit approval.
- Audit events record security-sensitive mutations, approvals, exports, deletions, and model-generated changes.
- Rate limiting, structured logging, abuse monitoring, and secure response headers are required before production launch.

## 5. AI architecture

Use an internal provider-independent interface, for example:

```ts
type IntelligenceTask =
  | "extract_facts"
  | "summarize"
  | "identify_responsibilities"
  | "suggest_next_actions"

type IntelligenceResult<T> = {
  output: T
  evidence: EvidenceReference[]
  confidence?: number
  model: { provider: string; model: string; version?: string }
  requiresReview: boolean
}
```

The UI and domain services should depend on this interface, not on a vendor SDK. AI outputs are versioned, attributable, reviewable, and stored separately from user-authored facts. Prompt templates, safety rules, and evaluation fixtures belong in the AI module and must not contain secrets.

## 6. Initial domain model

Proposed entities:

- `profiles` — user preferences and account metadata.
- `knowledge_items` — user-authored or imported information.
- `documents` — file metadata and storage references.
- `facts` — normalized claims with source and verification state.
- `responsibilities` — obligations, deadlines, recurrence, and status.
- `recommendations` — AI-generated suggestions linked to evidence.
- `review_items` — proposed changes or actions requiring user approval.
- `audit_events` — append-only security and provenance trail.

All schemas should be introduced through versioned Supabase migrations. Exact columns, indexes, retention rules, and RLS policies should be approved before implementation.

## 7. Request and error conventions

- Validate all external input with a shared schema library at the boundary.
- Return typed success/error envelopes from server actions and route handlers.
- Use stable error codes for expected failures; do not expose stack traces or provider details.
- Add correlation IDs to server logs and audit records.
- Keep authorization checks close to data access so callers cannot accidentally bypass ownership rules.

## 8. Observability and quality gates

- Unit tests for domain rules, authorization helpers, validation, and AI parsing.
- Integration tests for Supabase queries and RLS policies.
- Browser tests for authentication, document ingestion, review, approval, export, and deletion.
- AI evaluation set measuring extraction accuracy, unsupported-claim rate, citation coverage, and refusal behavior.
- Production telemetry must avoid logging document contents, prompts, tokens, or secrets.

## 9. Open decisions for approval

1. Use Supabase Edge Functions or Next.js Route Handlers for the first AI orchestration boundary.
2. Define the minimum supported document types and upload limits.
3. Choose reminder delivery for the first release: in-app only, email, or both.
4. Define retention and deletion semantics for source files, derived facts, and AI results.
5. Confirm whether the first release supports only individual accounts or also introduces household/shared spaces.
