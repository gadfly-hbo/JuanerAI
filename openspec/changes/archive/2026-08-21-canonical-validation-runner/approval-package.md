# CVR-PACKAGE-002 — Lean Canonical Validation Runner

Status: **APPROVED — ALL A, 2026-08-21**

Approve this package to authorize Spec Gate only; Test, Worker, and activation remain gated.

| Item | Recommendation A |
|---|---|
| Entry | One executable POSIX `tools/harness/validation/run`; default offline run and optional `--help` only. |
| Toolchain | Replace PATH with `/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin`; permit only `JUANERAI_TOOLCHAIN_BIN` as an explicit override. |
| Preflight | Fail fast on Node 26.0.0, npm 11.12.1, DuckDB 1.5.2, Python >=3.9, Pi SDK 0.84.2, TypeBox 1.3.7. Post-Gate clarification: DuckDB alone compares the first token of normal output, so `v1.5.2 (Variegata) 8a5851971f` is accepted; no generic parser/protocol is added. |
| Checks | Run existing syntax, unit, contract, integration, default E2E, then project-board commands; stream output and stop on first failure. |
| Safety | Remove `XANTHIL_REAL_PI_ACCEPTANCE` from every child; no real mode/call, retry, fallback, install, repair, report, or persistence. |
| Tests | Four focused public-entrypoint leaves; one test file and one shell implementation file only. |
| Activation | After normal gates, Controller only adds narrow discoverability references to `tools/harness/README.md` and AGENTS.md `Validation and Completion`; rollback removes the runner and those references, keeping direct commands. |

Controller lifecycle updates to `.juanerai/project-control/` remain permitted
by AGENTS.md; Test, Worker, and Validator do not write it, and this Change does
not alter project-board schema or behavior.

Formal approval received: `批准 CVR-PACKAGE-002 全部 A`.
