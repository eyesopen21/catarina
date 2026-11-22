# QA harness (WP-03)

Runs on the Node 22 built-in test runner. Two scanners guard privacy and
secrets; a real PostgreSQL 17 server and reusable race barriers support the
concurrency suites of later WPs. Everything under `tests/` is synthetic.

## Commands (run from the repository root)

```sh
node --test tests/**/*.test.mjs
node tests/security/pii-scan.mjs .
node tests/security/secret-scan.mjs .
```

All three are blocking: a nonzero exit code fails the job. Neither scanner
skips files; both exclude only `.git`, `node_modules`, `dist`, `target` and
`.codegraph`, and both report **every** occurrence (not just the first).

## Real PostgreSQL 17 — CI contract for WP-10

The harness never mocks PostgreSQL. It either starts its own
`postgres:17.5-alpine` container (`docker run`, loopback-only random port,
`POSTGRES_HOST_AUTH_METHOD=trust`, removed after the run) or connects to a CI
service container through `CATARINA_TEST_PG_URL`. Each `psql` call is a
separate process and therefore a separate database session; the harness test
asserts two distinct `pg_backend_pid()` values at a barrier.

Local runs require a Docker Linux daemon. This environment has no Linux engine
(`npipe:////./pipe/dockerDesktopLinuxEngine` unavailable), so local PostgreSQL
evidence is **pendiente**; the valid evidence comes from CI on `ubuntu-latest`,
which provides it.

Suggested GitHub Actions service (ephemeral, synthetic data only):

```yaml
jobs:
  qa:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: postgres
          POSTGRES_DB: postgres
          POSTGRES_HOST_AUTH_METHOD: trust
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d postgres"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      CATARINA_TEST_PG_URL: postgres://postgres@127.0.0.1:5432/postgres
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node --test tests/**/*.test.mjs
      - run: node tests/security/pii-scan.mjs .
      - run: node tests/security/secret-scan.mjs .
      - run: gitleaks git . --log-opts=--all --redact
```

`gitleaks` covers the full history (docs/09 §8); the in-repo secret scanner
covers the working tree, fixtures and synthetic log samples. Checkout with
`fetch-depth: 0` is required for the history scan. Do not upload source or scan
artifacts to an external service.

## Reusable race barriers

`tests/support/barriers.mjs` exposes `R-01` … `R-10` from docs/08 §4 as generic
start barriers (`raceBarriers['R-04']({ parties: 2, point: 'before-cas' })`).
They carry stable ids and descriptions and wrap `createBarrier(parties)`.
Domain WPs import them and inject `wait()` at their CAS/commit/upload points;
no domain test or domain code lives outside its own WP.

## Coverage status (CI vs pilot)

| Test | Scope | Status |
|---|---|---|
| TC-NFR-PRV-01 | CI: scanner over repository, fixtures and synthetic logs | Verde: 0 findings |
| TC-NFR-PRV-01 | Pilot: real pilot log/trace/metric/embedding samples | Pendiente — muestras no disponibles; no aprobado |
| TC-SPR-03 | CI: secret scanner over working tree + Gitleaks history | Verde: 0 findings |
| TC-SPR-03 | Pilot: real sandboxes / staging credentials review | Pendiente — no aprobado |

Pilot approval is a human gate and is deliberately left open.
