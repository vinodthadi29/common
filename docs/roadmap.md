# COMMON ONE — Implementation Roadmap

**Status:** Proposal for approval  
**Rule:** Complete each stage with tests and a security review before starting the next.

## Stage 0 — Product and safety alignment
- Approve the initial student/job-seeker scope.
- Define supported use cases, explicit non-goals, and unsafe/high-stakes boundaries.
- Agree on privacy language, consent, retention, deletion, and export behavior.
- Define success metrics: time-to-organize, review completion, recommendation usefulness, and unsupported-claim rate.

**Exit criteria:** Signed product brief, threat assumptions, and acceptance criteria.

## Stage 1 — Foundation and data boundaries
- Add Supabase integration and environment configuration.
- Establish typed server/client Supabase helpers.
- Create initial migration for profiles, audit events, and ownership primitives.
- Enable and test RLS policies.
- Add validation, error envelopes, logging, and security headers.
- Establish test and CI conventions.

**Exit criteria:** Authenticated user can access only their own test data; RLS and integration tests pass.

## Stage 2 — Personal knowledge capture
- Build onboarding and a focused information-capture flow.
- Add private document upload and metadata management.
- Implement knowledge items and source references.
- Add search/filtering with accessible empty, loading, and error states.
- Implement export and deletion for captured data.

**Exit criteria:** User can securely create, view, update, export, and delete owned information.

## Stage 3 — Responsibilities and review workflow
- Normalize deadlines, recurrence, status, and priority.
- Build a responsibility dashboard and review queue.
- Add reminders without manipulative defaults.
- Introduce approval states for every suggested change or external action.
- Record audit events for review and approval decisions.

**Exit criteria:** User can understand pending responsibilities and approve/reject proposals with provenance.

## Stage 4 — Explainable intelligence
- Implement the provider-independent intelligence interface.
- Start with bounded tasks: extraction, summarization, and responsibility suggestions.
- Store evidence, confidence, model metadata, and review status.
- Add prompt/version tracking and an evaluation fixture set.
- Add explicit unsupported-claim and uncertainty handling.

**Exit criteria:** AI outputs are evidence-linked, reviewable, measurable, and never silently become facts.

## Stage 5 — Pilot hardening
- Run a small usability pilot with the target audience.
- Measure quality, latency, cost, privacy comprehension, and failure recovery.
- Add rate limits, abuse controls, backup/restore checks, and incident runbooks.
- Perform accessibility, threat-model, and data-retention reviews.
- Fix the highest-impact usability and safety findings.

**Exit criteria:** Pilot report, resolved critical findings, and launch decision.

## Stage 6 — Production release
- Configure Vercel environments and Supabase production project.
- Add monitoring, alerting, structured audit review, and support workflows.
- Verify migrations, rollback strategy, exports, deletion, and account recovery.
- Publish privacy/security documentation and user-facing limitations.
- Release to a controlled cohort before wider availability.

**Exit criteria:** Production readiness checklist approved and controlled release monitored.

## Later expansion
- Shared household spaces with explicit permissions.
- Additional audiences and role-specific workflows.
- Integrations and external actions with consent and revocation.
- Separate FastAPI processing service if justified by scale or specialized AI workloads.
