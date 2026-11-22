# QA harness (WP-03)

Runs on the Node 22 built-in test runner. Two scanners guard privacy and
secrets; a real PostgreSQL 17 server and reusable race barriers support the
concurrency suites of later WPs. Everything under `tests/` is synthetic.

## Commands (run from the repository root)

```sh
node --test tests/**/*.test.mjs
node tests/security/pii-scan.mjs .
node tests/security/secret-scan.mjs .
node tests/security/gitleaks-history.mjs
```

All four are blocking: a nonzero exit code fails the job. Neither in-repo
scanner skips files; both exclude only `.git`, `node_modules`, `dist`, `target`
and `.codegraph`, neither has a shortened extension list, and both report
**every** occurrence (not just the first). `graphify-out/`, `idea/` and
`tests/fixtures/` are deliberately *not* excluded: false positives there must
be fixed by token anchoring, not by hiding findings.

`gitleaks-history.mjs` is the SPR-03 **history** half. It refuses a shallow
checkout and runs `gitleaks git . --log-opts=--all --redact --exit-code 1`.
CI must check out with `fetch-depth: 0` (AG-PLT owns the job); Gitleaks itself
must be installed in the runner. `secret-scan.mjs` covers only the working tree
and **cannot replace** the history scan.

## Real PostgreSQL 17 — CI contract for WP-10

The harness never mocks PostgreSQL. It either starts its own
`postgres:17.5-alpine` container (`docker run`, loopback-only random port,
`POSTGRES_HOST_AUTH_METHOD=trust`, removed after the run) or connects to a CI
service container through `CATARINA_TEST_PG_URL`. Each `psql` call is a
separate process and therefore a separate database session; the harness test
asserts two distinct `pg_backend_pid()` values at a barrier.

Local runs require a Docker Linux daemon. This environment has no Linux engine
(`npipe:////./pipe/dockerDesktopLinuxEngine` unavailable), so the harness has
**never actually executed** here: local PostgreSQL evidence is **pendiente de
CI**, not green. The valid evidence must come from CI on `ubuntu-latest`, which
provides the Linux daemon and the `postgres:17` service. Do not report the
database tests as passing until that run exists.

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
      - run: node tests/security/gitleaks-history.mjs
```

PII anchoring: the Unicode-aware `\p{L}\p{N}` adjacency check in `scan-util.mjs`
rejects digit runs embedded in hashes, nanosecond timestamps or decimals,
while a standalone 8-digit phone delimited by spaces/punctuation is still
detected. Two narrow structural rules are also applied: candidates fully
contained in a canonical 8-4-4-4-12 hex UUID are opaque identifiers, not PII;
and emails on a `deprecated:` metadata line of a recognized lockfile are
upstream package-maintainer contact data. The lockfile rule does **not**
exclude the file: every other line of it, and every other file, is scanned,
and regression tests assert the same address on a different line or in a
different file is still reported. The date guard from the base detector is
retained. Numeric ranges `2/6/7/8` and `+506` remain unchanged.

`gitleaks` covers the full history (docs/09 §8); the in-repo secret scanner
covers the working tree, fixtures and synthetic log samples. Checkout with
`fetch-depth: 0` is required for the history scan. Do not upload source or scan
artifacts to an external service.

## Reusable race barriers

`tests/support/barriers.mjs` exposes `R-01` … `R-10` from docs/08 §4 as generic
start barriers (`raceBarriers['R-04']({ parties: 2, point: 'before-cas' })`).
They carry stable ids and descriptions and wrap `createBarrier(parties)`.
`createBarrier` is a **Node-process synchronization point**, not yet an
injectable hook inside the services. The real before/after-CAS, before-commit
and before-upload injection points of docs/08 §7 arrive with **WP-15** (kernel:
outbox, idempotence, lease); until then these barriers only coordinate test
participants. No domain test or domain code lives outside its own WP.

## Coverage status (CI vs pilot)

| Test | Scope | Status |
|---|---|---|
| TC-NFR-PRV-01 | Escáner PII sobre repo, fixtures y logs sintéticos | **Verde local**: 0 hallazgos. Ejecución en CI: **pendiente** |
| TC-NFR-PRV-01 | Muestras reales de logs/trazas/métricas/embeddings del piloto | **Pendiente** — muestras no disponibles; no aprobado |
| TC-SPR-03 | Escáner de secretos sobre working tree | **Verde local**: 0 hallazgos. Ejecución en CI: **pendiente** |
| TC-SPR-03 | Escaneo de secretos en el historial (Gitleaks, `--all`) | **Pendiente de CI** — Gitleaks no instalado localmente; `fetch-depth: 0` requerido |
| TC-SPR-03 | Sandboxes / credenciales reales de staging | **Pendiente** — no aprobado |
| Harness PostgreSQL | `postgres:17` real + barreras con sesiones independientes | **Pendiente de CI** — sin motor Docker Linux local; nunca ejecutado |

Pilot approval is a human gate and is deliberately left open.
