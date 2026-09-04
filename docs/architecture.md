# Architecture

## Packages

- `packages/sdk` — Node.js client library (published to npm as `amonitor`). Captures uncaught exceptions, unhandled rejections, manually reported errors/messages (with breadcrumbs), performance transactions/spans, and periodic node health samples (CPU/memory/network/event-loop lag), and ships them to the API's ingest endpoint.
- `packages/api` — NestJS backend. REST API, multi-tenant data model, ingestion pipeline, alerting.
- `packages/dashboard` — React + Redux Toolkit + Tailwind web UI.

## Backend modules

- `users` — user persistence and password hashing (bcrypt). No auth-session logic. Split out from `auth` and holding `PasswordHasher` specifically to avoid circular dependencies: `auth` needs `organizations`, `organizations` needs user lookup, and `admin` needs both user persistence and hashing — all three depend on `users` instead of on each other. Also owns `SeedDefaultAdminService`, which creates a fixed `admin@amonitor.local` account with `isAdmin: true, mustChangePassword: true` on boot if it doesn't already exist (self-signup is disabled, so a fresh instance would otherwise have no way to log in at all).
- `auth` — login/refresh/logout/change-password, JWT (access token returned in the response body and carrying `isAdmin`/`mustChangePassword` so guards and the frontend don't need a DB round-trip; refresh token as an httpOnly cookie). There is no signup endpoint — see `admin`.
- `admin` — platform-wide user management, gated by `AdminGuard` (checks `isAdmin` on the JWT). `CreateUserUseCase` is the only way a new account gets created now that self-signup is gone; it deliberately does *not* create an organization for the new user (unlike the old signup flow) — they create their own via the existing `POST /organizations`, or an org owner adds them by email. Also: list all users, delete a user (blocks self-delete), reset a user's password (sets `mustChangePassword: true`). `isAdmin` is a flag on the user account, independent of any organization's owner/admin/member roles — it grants access to this module, not to other people's orgs.
- `organizations` — orgs, owner/admin/member membership, the `OrganizationMembershipGuard` reused by every project-scoped controller.
- `projects` — project CRUD scoped to an org, DSN key issuance/rotation.
- `issues` — error grouping. Ingested exceptions are fingerprinted (exception type + top stack frame) and grouped into Postgres `issues` rows; raw events (stack trace, breadcrumbs) live in ClickHouse.
- `performance` — transactions/spans, stored in ClickHouse only (no Postgres row — there's no mutable state or grouping workflow like issues have).
- `nodes` — per-instance host health (CPU, memory, network, event-loop lag) in ClickHouse. Each process running the SDK reports itself as a node every ~15s, so one project spread across several machines/pods shows up as several nodes. Status is derived from sample age rather than stored (online ≤2 intervals, stale ≤4, offline beyond), and live rollups exclude offline nodes so a dead instance's last numbers don't skew the averages.
- `uptime` — uptime monitors (Postgres) and checks (ClickHouse). Each monitor gets its own dynamically scheduled interval via `@nestjs/schedule`'s `SchedulerRegistry`, registered/unregistered as monitors are created/deleted and restored on boot.
- `alerts` — alert rules (Postgres) matching on a trigger (`issue_created`, `uptime_down`), delivered via email or webhook through a BullMQ worker. `EvaluateAlertsUseCase` is the single entry point other modules call when something alert-worthy happens; `issues` and `uptime` both import `AlertsModule` to call it, but `AlertsModule` imports neither, so there's no cycle.
- `ingest` — the public, DSN-key-authenticated endpoints the SDK talks to (`POST /ingest/:projectKey/exception` and `.../transaction`). No JWT — a project's DSN key is the credential here, checked by `ProjectKeyGuard`.

## Layering (per domain module)

Each module under `packages/api/src/modules/<name>` is split into:

- `domain/` — plain TypeScript interfaces and entities. No NestJS, no ORM. This is the layer a human reads first to understand the business rules.
- `application/` — use-case classes (one class per action, e.g. `CreateProjectUseCase`) that orchestrate domain logic via repository interfaces only.
- `infrastructure/` — NestJS providers: TypeORM repositories (Postgres), ClickHouse query builders, BullMQ processors/schedulers. This is the only layer allowed to import a database/queue library.
- Controllers (REST, with DTOs validated by `class-validator`) live at the module root and only call use-cases — they contain no business logic themselves. Every project-scoped controller re-checks that the `:projectId` in the URL actually belongs to the `:organizationId` in the URL (the membership guard only checks the org, not the project) — see the note on `ProjectsController.rotateKey` below.

This means: to test business rules, instantiate a use-case with an in-memory fake repository — no NestJS test module, no database needed. That's the pattern behind every `*.use-case.spec.ts` file in this codebase (40+ tests as of milestone 6). Integration tests against a real dockerized Postgres/ClickHouse/Redis are deliberately not part of the automated suite yet; every milestone has instead been verified manually end-to-end (`docker compose up` + real HTTP requests + a real browser session) before being called done.

## Data flow: error ingestion

```
SDK (captureException) --HTTP--> POST /api/ingest/:projectKey/exception
                                      |
                                      v
                         enqueue BullMQ job (issue-grouping)
                                      |
                                      v
        processor: fingerprint + upsert Postgres `issues` row,
                    then write the raw event to ClickHouse
                                      |
                                      v
              (on brand-new issue) EvaluateAlertsUseCase('issue_created')
                                      |
                                      v
                    matching `alert_rules` -> enqueue alert-dispatch
                                      |
                                      v
                         send email / webhook
```

## Data flow: uptime + alerting

```
NestUptimeScheduler (one setInterval per monitor)
                |
                v
     RunUptimeCheckUseCase pings the monitor's URL
                |
                v
      write result to ClickHouse `uptime_checks`
                |
                v
   (only on the up -> down transition) EvaluateAlertsUseCase('uptime_down')
                |
                v
      matching `alert_rules` -> enqueue alert-dispatch -> email / webhook
```

## Data flow: node health

```
SDK MetricsCollector (unref'd timer, every ~15s per process)
                |
                v
     POST /api/ingest/:projectKey/metrics   (DSN key auth, same as errors)
                |
                v
        append sample to ClickHouse `node_metrics`
                |
                v
  Nodes page: latest-per-instance (ClickHouse LIMIT 1 BY) + status from sample age
  Node detail: history() over a time window -> CPU / memory / network charts
```

Host network throughput comes from `/proc/net/dev` and is therefore Linux-only;
elsewhere the sample carries `networkSupported: false` and the UI shows `n/a`
rather than a misleading zero.

## Data flow: performance tracing

Simpler than error ingestion — there's no grouping workflow, so the ingest
controller calls `RecordTransactionUseCase` directly (no queue): it writes
the transaction and its spans to ClickHouse as one batch of rows, linked by
`trace_id`, with the transaction row flagged `is_transaction = 1`.

## Frontend structure

Navigation is **feature-first**: the sidebar routes are `/issues`, `/performance`, `/uptime`, `/alerts`, `/settings/projects` and `/admin/users`, and the *project* acts as a filter on those pages rather than as a level of the URL hierarchy. The API is still org- and project-scoped, so the active org/project is held in Redux (`currentOrganization`, `currentProject`, both persisted to `localStorage`) and fed into the query hooks by the `useWorkspace()` / `useProjectScope()` hooks, which also auto-select the first available org/project and heal stale selections left over from a previous session.

- `app/` — Redux store setup and the single RTK Query `api` instance (feature slices inject endpoints into it rather than each defining their own API instance); `AuthBootstrap` restores the session from the refresh cookie on load since the access token only lives in memory; `useWorkspace` resolves the active org/project. Route guards live here too: `RequireAuth`, `RequirePasswordChange` (redirects to `/change-password` whenever `user.mustChangePassword` is set — wraps every protected route except that page itself), `RequireAdmin`.
- `layout/` — the app shell: persistent `Sidebar` (org switcher, nav, API health, user + logout) and the `ProjectSelector` used in each page's filter bar.
- `features/<domain>/` — one RTK Query endpoint file per backend domain (health, auth, admin, organizations, projects, issues, performance, uptime, alerts), plus the org/project selection slices.
- `components/` — presentational, reusable Tailwind-based UI primitives (Card/Panel, Badge/Dot, Button, Input/SelectField, Modal, ConfirmDialog, PageHeader/FilterBar, SegmentedControl, StatTile, EmptyState, icons). No data fetching here.
- `pages/` — route-level components that compose `features` (data) with `components` (presentation).
- `lib/` — small shared helpers (`timeAgo`/`formatDuration` formatting, guarded `localStorage` access).

Theme tokens live in `tailwind.config.js` (`bg`/`surface`/`raised`/`border`, `ink`/`muted`/`faint`, `accent` plus semantic `danger`/`warning`/`success`/`info`). Components reference those names rather than raw palette values, so re-theming the app is a one-file change.

## Why this split

The goal stated by the project owner was a platform "manageable by a human if needed" — the domain/application/infrastructure split keeps business rules out of framework/ORM code so they can be read and modified without understanding NestJS or TypeORM internals, and the frontend's features/components split keeps data-fetching logic separate from presentation so either can change independently.

## Known gaps / deliberate simplifications

- **SDK spans are one level deep** — they attach directly to their transaction rather than to each other, avoiding the need for `AsyncLocalStorage`-based context propagation through arbitrary async code. Fine for "this request took 400ms, 350ms of which was one DB query"; not a full distributed-tracing context model.
- **No automated integration tests** — unit tests cover business logic via in-memory fakes; the actual TypeORM/ClickHouse/BullMQ wiring has only been exercised through manual end-to-end passes, not CI-run integration tests.
- **Uptime checks poll on a fixed schedule per monitor** — no jitter/backoff, no distinguishing a slow response from a hard failure beyond the status-code comparison.
- **Fixed a real IDOR in milestone 6**: `ProjectsController.rotateKey` checked that the caller belonged to the `:organizationId` in the URL, but never checked that `:projectId` actually belonged to that org — a member of any organization could rotate a *different* organization's project DSN key by guessing/knowing its UUID. Every other project-scoped controller (`issues`, `performance`, `uptime`, `alerts`) already had this check; `projects` itself was the one gap. Worth remembering when adding a new project-scoped route: the membership guard alone is not enough.
