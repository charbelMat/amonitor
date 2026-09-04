# amonitor

A self-hosted platform for Node.js: error/issue tracking,
performance tracing, uptime monitoring and alerting, built with clean
architecture and a component-based React dashboard.

See `docs/architecture.md` for how the codebase is laid out and why.

## Status

**All 6 delivery milestones are done**, including a polish pass: 40+ unit
tests across the API's use-cases (in-memory fakes, no DB needed — see
`docs/architecture.md`), 10 SDK tests, a handful of dashboard tests, an
updated architecture doc, and a real security fix — `ProjectsController`'s
key-rotation endpoint checked that the caller belonged to the organization
in the URL, but never checked that the *project* being rotated actually
belonged to that organization, so any authenticated member of any org could
rotate a different tenant's project DSN key by guessing its UUID. Fixed and
covered by a regression test; verified against the running system that the
legitimate same-org flow still works and the cross-tenant attempt now
correctly 404s.

Auth + multi-tenancy, error tracking, performance tracing, and uptime
monitoring + alerting: each uptime monitor gets its own dynamically
scheduled check (via `@nestjs/schedule`'s `SchedulerRegistry`, one per
monitor's configured interval) that pings its URL and compares the
response status; going from up to down fires an alert. Alert rules match
on two triggers — a new issue, or a monitor going down — and deliver via
email (SMTP, skipped with a log warning if unconfigured) or a generic
webhook, dispatched through a BullMQ worker.

## Accounts & admin

Self-signup is disabled — accounts are provisioned by a platform admin.
A fixed default admin is seeded on first boot if it doesn't already exist:

```
admin@amonitor.local / ChangeMe123!
```

You're forced to change this password on first login. From the dashboard
header, an admin sees a **User management** link (`/admin/users`) to create
accounts (each new one also starts with a forced password change), list
everyone, reset a password, or delete a user (you can't delete yourself).
A "platform admin" flag is separate from per-organization owner/admin/member
roles — it grants access to user management, not to other people's orgs.
Once an account exists, that person can log in and create their own
organization (the "+ New org" button) or be added to an existing one by its
owner.

Try it end-to-end:
1. Log in as the default admin above, set a new password when prompted, then create a project (via "+ New org" then "+ New project") to get a DSN key.
2. `npm run sdk:build`, then `AMONITOR_DSN=<your key> npm run example` to run the demo app.
3. Hit `http://localhost:3000/boom` (uncaught exception), `/report` (manual capture), or `/slow` (traced transaction + span) and watch it show up under that project in the dashboard.
4. From the project's "Uptime" page, add a monitor; from "Alerts", add a webhook or email rule for `uptime_down` or `issue_created`.

## Packages

- `packages/api` — NestJS backend (REST, clean architecture layering per module).
- `packages/dashboard` — React + Redux Toolkit + Tailwind CSS web UI.
- `packages/sdk` — Node.js client library, published to npm as `amonitor`. See `packages/sdk/README.md`.

## Local development

```bash
npm install

# start Postgres, ClickHouse and Redis for local dev
docker compose up -d postgres clickhouse redis

# terminal 1 — copy packages/api/.env.example to packages/api/.env first
npm run api:dev
# -> http://localhost:3001/api/health, Swagger docs at http://localhost:3001/docs
# migrations run automatically on boot (migrationsRun: true)

# terminal 2
npm run dashboard:dev
# -> http://localhost:5173 (proxies /api/* to the API above)
```

## Tests

```bash
npm test
```

## Docker

```bash
npm run docker:up   # postgres, clickhouse, redis, api, dashboard
npm run docker:down
```

Dashboard will be at http://localhost:8080, API at http://localhost:3001.

## Publishing the SDK

The SDK is published to npm as [`amonitor`](https://www.npmjs.com/package/amonitor).
It has no runtime dependencies and ships only `dist/`, `README.md` and `LICENSE`.

```bash
npm login                      # once per machine
cd packages/sdk
npm publish                    # prepublishOnly rebuilds + runs the tests first
```

`prepublishOnly` runs a clean build and the test suite, so a broken or stale
`dist/` can't be published by accident. To see exactly what would ship
without publishing:

```bash
cd packages/sdk && npm pack --dry-run
```

Bump the version with `npm version patch|minor|major` in `packages/sdk`
before each release — npm rejects a re-publish of an existing version.

## Delivery milestones

1. ✅ Skeleton & infra
2. ✅ Auth + multi-tenancy (organizations, projects, JWT auth)
3. ✅ Error tracking (SDK capture, ingestion pipeline, issue grouping, issue UI)
4. ✅ Performance tracing (spans/transactions)
5. ✅ Uptime monitoring + alerting (email/webhook)
6. ✅ Polish: test coverage, docs, security fix
7. ✅ Admin-provisioned accounts: self-signup removed, platform admin role + user management, seeded default admin, forced password change

Full architectural decisions and rationale are recorded in the project plan.
