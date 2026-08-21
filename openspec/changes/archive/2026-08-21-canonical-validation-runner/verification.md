# Verification

## Current verdict

**ACCEPTED; ACTIVATION COMPLETE; ARCHIVE READY.** The user approved
`CVR-PACKAGE-002` all A on 2026-08-21. The one bounded DuckDB correction is
complete, the frozen focused suite is 4/4 GREEN, the canonical offline runner
completed with exit 0, and the fresh read-only Validator returned PASS. No
real model/provider call occurred.

The first post-Gate clarification changes no other version, execution, output,
or safety contract and does not restore a generic parser/protocol.

## Frozen Final Evidence

- Production: `tools/harness/validation/run`, executable mode `755`
- Production SHA-256: `62e1533bb7137df697795024f2fc7299df6fe64349c0e8d3bf1f78a41bb71334`
- Test SHA-256: `d1ef4b6944c022589cf0995b6bc5fede7fd87a0fb210bf591ab3b96c693d8f66`
- Delta spec SHA-256: `e2ad4ff462ed0d5ed9f20e827af014b15c72111f2915e714e96a9ccf7cec5522`
- `sh -n`: PASS; focused tests: 4 pass, 0 fail
- Canonical runner: exit 0 from repository root
- Unit: 250 pass, 0 fail
- Contract: 198 pass, 0 fail
- Integration: 243 pass, 0 fail
- Default E2E: 131 pass, 0 fail, 1 intentionally skipped real Pi leaf
- Project board: 12 pass, 0 fail
- `git diff --check`: PASS
- Runner-owned persisted output: none; no install, dependency/global mutation,
  credential read, provider/model call, retry, fallback, or real mode

## Independent Verdict and Acceptance

- Validator: configured `juaner_validator`, fresh read-only context, PASS
- Independently reproduced: `sh -n` PASS; focused 4/4; canonical runner exit 0
- Independent counts: unit 250/250, contract 198/198, integration 243/243,
  E2E 131 pass and 1 real-leaf skip, project-board 12/12
- Dirty-worktree fingerprint before/after Validator run: unchanged
  `65d52d70492e35a05e145a517b15d0afba6720eae0e992b954058653c67ab3ca`
- Scope: only `run` and `run.test.mjs` are executable CVR changes; activation
  is limited to the two approved discoverability references
- Controller acceptance: PASS; current specification published at
  `openspec/specs/canonical-validation/spec.md`
- Archive target:
  `openspec/changes/archive/2026-08-21-canonical-validation-runner/`

## Frozen DuckDB-Clarification RED

- Test: `tools/harness/validation/run.test.mjs`
- SHA-256: `d1ef4b6944c022589cf0995b6bc5fede7fd87a0fb210bf591ab3b96c693d8f66`
- Command: `PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin /Users/huangbo/Dev/Env/homebrew/bin/node --test tools/harness/validation/run.test.mjs`
- Result: 4 top-level tests; TEST-002 passes its wrong/missing/mismatched
  fail-fast cases; TEST-001/003/004 fail because accepted DuckDB suffix output
  is rejected before their intended positive/validation paths.
- Static checks: focused test `node --check` PASS; `git diff --check` PASS.
- Forbidden effects: no production, dependency, manifest, project-board,
  credential, provider, network, model, or global-environment mutation.

## Frozen Worker Candidate

- Production: `tools/harness/validation/run`, executable mode `755`
- SHA-256: `99affa347cb0767a34510dc55ae87ebbda6b1753dc8186e754ee601de973bb34`
- Focused evidence: 4 pass, 0 fail
- Actual DuckDB preflight: expected contract mismatch; regression BLOCKED

## Evidence plan

1. Test Agent proves a healthy isolated fixture and causal RED for the missing public shell entrypoint.
2. Worker changes only `tools/harness/validation/run`; focused tests go GREEN.
3. Controller runs the accepted default offline matrix through the runner and records observed output/counts without treating them as a fixed contract.
4. Fresh Validator inspects scope, runs focused and relevant regression checks, and proves inherited real-gate removal/no persistent runner output. No real model/provider invocation occurs.

## Release and rollback

Activation awaits the normal gates and acceptance. The Controller may then add
only narrow discoverability references to `tools/harness/README.md` and the
`Validation and Completion` section of `AGENTS.md`. A failed or rejected change
is recoverable by removing the single runner and those two references; direct
validation commands remain available. Controller lifecycle project-board updates
remain governed by AGENTS.md and are not changed here.
