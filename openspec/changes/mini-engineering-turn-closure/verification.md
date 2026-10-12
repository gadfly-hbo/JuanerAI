# Verification

Candidate in `work/macbook/mini-two-agent-only`, base
`506a92c0445bcc637a673ff6e07ab58d18abe73f`. Governance/tooling only; no product UI.

FLOW-01 causal RED: the valid Validator-only fixture fails the pre-correction
config checker because it requires retired `juaner_worker.toml`. Actual run
`node --test --test-name-pattern=CI-TIER-006 tools/harness/validation/ci-scope.test.mjs`
exited 1. This is tooling contract RED, not product RED.

## Current evidence and traceability

Owning device: MacBook. Persistent evidence root:
`/Users/huangbo/JuanerAI-artifacts/workflow-efficiency-hardening/mini-two-agent-stop-check-001/`.
This is local evidence, not a Mini-accessible backup. Files are copied from actual
tool output; fingerprints/readback are in `evidence-manifest.json` at that root.

| Requirement | Evidence / result |
|---|---|
| FLOW-01 | `roles-red.log`: Validator-only fixture fails the original four-role checker before correction. Current config CLI PASS; CI-scope regressions include retired/renamed/duplicate role, model/effort, sandbox, symlink and TOML-type negatives. |
| FLOW-02 | Canonical policy and linked workflow/DoD/Validator specify persisted materials and actual REQ/AC -> spec -> test -> code -> result; no product implementation or product SDD/TDD claim in this task. |
| FLOW-03 | `turn-causal-red.log`: healthy public bootstrap CLI returns UNKNOWN rather than required CONTINUE, before lifecycle implementation. Current manual CLI/material/no-write tests PASS. |
| FLOW-04–06 | Bound one-shot continuation, real stop/Interrupt, stale/unknown/multiple state, unsafe paths, private-content suppression, actual hooks.json command and parent/worktree resolution tests PASS. |
| FLOW-07 | `prompt-causal-red.log`: existing handler does not expose the host binding before implementation. Read-only binding, Astra no-context and invalid-ID negatives now PASS. |

Final focused command, with approved installed Node 26/Python 3.12 on PATH:

```sh
env PATH=/Users/huangbo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin:/Users/huangbo/Dev/Env/homebrew/bin:$PATH node --test tools/harness/validation/*.test.mjs tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs
```

Exit 0; 222 tests: 220 PASS, 0 FAIL, 2 SKIP. Full output in
`final-focused-regression.log`. The two cloud archive/member-proof checks are
NOT RUN locally; this is not an actual GitHub CI result. No business tests,
product startup, dependencies, real data/Provider or remote host operations.
`git diff --check` and actual `check-agent-config.py --check` exit 0.

After that full run, a two-line test-fixture-only correction restored the
CI-TIER-002 unmodified-config negative: corrupt the unchanged primary config
while the Validator routing delta remains valid. Source/config/policy behavior
did not change. The affected CI-TIER-002 rerun exits 0, 6 PASS / 0 FAIL; exact output
in `coverage-correction-green.log`. The full 222 count is the preceding full run,
not a claim that the later test fixture was in that run. Twelve current document
link targets resolve.

Byte comparison confirms shared `.codex/config.toml`, `.github/workflows/ci.yml`,
project-control schema/writer and the inactive Signed Host Loop section unchanged.
Targeted current-reference search leaves retired role names only in negative
fixtures/prohibitions and immutable history, not as dispatch authority.

## Failures and limitations retained

- First end-check attempt failed because the command did not yet exist; that
  bootstrap/import failure is NOT RED (`bootstrap-not-red.log`). The subsequent
  semantic assertion at a healthy public CLI is the recorded causal RED.
- Initial CI-scope rerun: 80 PASS / 2 FAIL (including parent suite count). A stale
  fixture replaced `high` after its baseline became `medium`, producing no config
  delta. Corrected the fixture to exercise wrong effort; kept the rejection
  assertion. Final regression covers it and passes; no failure is retroactively PASS.
- Full RED-time test/source preimages were not separately frozen. Exact command
  output and chronological tool observations support the described RED, but the
  current test/source files are not historical preimages or full replay proof.
  Current-source fingerprints identify this candidate only.
- Hook source and synthetic tests do not prove native host loading, trust,
  current-turn ID availability or live Mini adoption. If unavailable, automatic
  continuation stays dormant; manual end checks and valid engineering authority
  remain. One-shot reminders cannot guarantee agents never pause incorrectly.

Independent read-only candidate review returned PASS: no blocking issues; it
reproduced 91 tool tests, read the full focused regression and checked historical
preservation. It separately read the subsequent test-fixture-only correction
and its 6-PASS log, then confirmed PASS for the corrected candidate. No
business/source/config behavior changed after the full run.
At local validation closeout, Git publication, actual CI and Mini adoption/resumption were NOT PERFORMED. The user subsequently authorized this bounded commit/push/PR/merge; actual publication identities and CI results belong to the Git delivery receipt. Mini adoption/resumption is not authorized by that publication.
