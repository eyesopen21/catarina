# QA harness (WP-03)

The harness uses Node.js built-in test runner (Node 22) and a real PostgreSQL
17.5 Alpine container. It requires Docker with a Linux container daemon. It
starts an isolated container with trust authentication on a loopback-only,
random host port and removes it after the run. The database has no application
data; all fixtures are synthetic.

Run from the repository root:

```sh
node --test tests/*.test.mjs tests/**/*.test.mjs
node tests/security/pii-scan.mjs .
```

The PostgreSQL test must fail if Docker cannot create or reach the container;
CI must not skip it or replace it with SQLite, mocks, or an external database.
`createBarrier(parties)` in `support/postgres.mjs` is the reusable start barrier
for concurrent test participants. Each `psql` call is a separate PostgreSQL
session, verified by distinct backend PIDs.

## CI contract for WP-10

- Run on `ubuntu-latest`, which provides Docker's Linux daemon.
- Checkout the full Git history (`fetch-depth: 0`) for secret-history scanning.
- Install Node 22 and invoke both commands above as required, blocking steps.
- Run Gitleaks 8.24.2 with
  `gitleaks git . --log-opts=--all --redact`; treat findings as failures.
  Do not upload source or scan artifacts to an external service.
- Keep `tests/fixtures/` and synthetic log/trace samples covered by the PII
  scanner. The default PII scan traverses repository text files and excludes
  only generated/dependency metadata directories.

No credentials, real student data, or secrets belong in fixtures, logs, or
test output. The PII scanner's detection canaries are assembled in memory.
