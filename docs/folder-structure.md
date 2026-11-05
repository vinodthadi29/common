# COMMON ONE — Proposed Folder Structure

The current repository is a minimal Next.js 16 App Router scaffold. The structure below is the target shape for implementation; directories should be added incrementally as each roadmap stage begins.

```text
.
├── app/
│   ├── (marketing)/              # Public product and informational pages
│   ├── (auth)/                   # Sign-in, sign-up, recovery flows
│   ├── (app)/                    # Authenticated product shell
│   │   ├── dashboard/
│   │   ├── knowledge/
│   │   ├── responsibilities/
│   │   ├── review/
│   │   └── settings/
│   ├── api/                      # Small server route boundaries only
│   ├── actions/                  # Server Actions grouped by domain
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── layout/                   # Navigation, shells, responsive regions
│   ├── knowledge/                # Knowledge capture and document UI
│   ├── responsibilities/         # Obligation and deadline UI
│   ├── review/                   # Approval and provenance UI
│   └── shared/                   # Cross-domain product components
├── lib/
│   ├── supabase/                 # Browser, server, and middleware clients
│   ├── auth/                     # Session and authorization helpers
│   ├── validation/               # Shared boundary schemas
│   ├── errors/                   # Typed error codes and envelopes
│   ├── security/                 # Redaction, rate-limit, audit helpers
│   └── utils.ts
├── modules/
│   ├── knowledge/
│   │   ├── domain.ts
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   └── schemas.ts
│   ├── responsibilities/
│   ├── review/
│   ├── intelligence/
│   │   ├── provider.ts           # Provider-independent interface
│   │   ├── tasks.ts
│   │   ├── prompts/
│   │   └── evaluations/
│   └── audit/
├── supabase/
│   ├── migrations/               # Versioned SQL migrations
│   ├── seed.sql                  # Non-production development fixtures only
│   └── config.toml
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/
│   ├── architecture.md
│   ├── folder-structure.md
│   └── roadmap.md
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## Dependency direction

```text
app/components -> modules -> lib/supabase
app/actions    -> modules -> repositories
modules/intelligence -> provider interface -> selected model adapter
```

UI components must not issue unrestricted database queries. Repositories must enforce ownership and return domain-safe types. AI adapters must not be imported directly by UI code. Route handlers and server actions are the only application boundaries allowed to coordinate untrusted input, authorization, domain services, and persistence.
