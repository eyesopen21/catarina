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
It is now **wired into CI in `phase-f1` @ `81ab364`**: the harness job checks out
with `fetch-depth: 0` and pins Gitleaks 8.30.1 with a checksum. The **real CI
execution is still pending** because no push is authorized from this worktree;
"wired" is not the same as "has run". `secret-scan.mjs` covers only the working
tree and **cannot replace** the history scan.

## Real PostgreSQL 17 — CI contract for WP-10

The harness never mocks PostgreSQL. It either starts its own
`postgres:17.5-alpine` container (`docker run`, loopback-only random port,
`POSTGRES_HOST_AUTH_METHOD=trust`, removed after the run) or connects to a real
server through a libpq URL in `CATARINA_TEST_PG_URL`. In external mode the
harness uses a **native `psql` client** — `psql` on PATH, or the absolute binary
path in `CATARINA_TEST_PSQL` — and never invokes Docker. Each `psql` call is a
separate process and therefore a separate database session; the harness test
asserts two distinct `pg_backend_pid()` values at a barrier.

When `CATARINA_TEST_PG_URL` is unset the Docker Linux daemon is still required.
It is also possible to run the same real server locally **without Docker**:
unpack the EDB Windows x64 binaries zip for PostgreSQL 17 into a temp dir,
`initdb -D <temp>/pgdata -U postgres --auth=trust`, `pg_ctl -D <temp>/pgdata
-o "-p <free-port> -h 127.0.0.1" start`, `CREATE DATABASE catarina_test`, then
export `CATARINA_TEST_PG_URL=postgresql://postgres@127.0.0.1:<free-port>/catarina_test`
and `CATARINA_TEST_PSQL=<temp>/pgsql/bin/psql.exe`. No mock, SQLite or in-memory
fallback is involved.

Verified locally on 2026-11-22 with EDB portable PostgreSQL 17.5
(`SELECT version()` → `PostgreSQL 17.5 on x86_64-windows`, `SHOW
server_version_num` → `170005`): `node --test tests/**/*.test.mjs` →
`# tests 28 | # pass 28 | # fail 0`. CI on `ubuntu-latest` with the
`postgres:17` service remains the canonical automated path.

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
| TC-SPR-03 | Escaneo de secretos en el historial (Gitleaks, `--all`) | **Cableado en CI** (`phase-f1` @ `81ab364`: Gitleaks 8.30.1 con checksum, `fetch-depth: 0`). **Ejecución real pendiente**: sin push autorizado |
| TC-SPR-03 | Sandboxes / credenciales reales de staging | **Pendiente** — no aprobado |
| Harness PostgreSQL | `postgres:17` real + barreras con sesiones independientes | **Verde local**: PostgreSQL 17.5 portable (EDB, sin Docker), `server_version_num=170005`, 2/2 tests reales; suite completa 28/28. Ejecución en CI: **pendiente** |

Pilot approval is a human gate and is deliberately left open.
