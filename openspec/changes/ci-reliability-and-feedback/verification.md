# Current result and next action

## Candidate-001 correction scope

Independent review returned FAIL on two CI-SCOPE-002 counterexamples, and the
parent released the fixed candidate for this bounded repair. Input remains a
real Git diff against the trusted base; output must be `full` for every control
character filename and detected copy, whether the copy source changed or stayed
unchanged. `--check-docs` must reject both. Genuine added/modified allowlisted
documentation with spaces or ordinary Unicode remains eligible. No additional
skip route, permission, dependencies or product behavior is permitted. Necessary
contract decision: implement the already-approved `control-character` and
`copy` exclusions; preserve candidate-001 and its earlier evidence.

Correction completed in `ci-scope.mjs` and its existing test file only. The
filename exclusion now spans C0, DEL and C1; Git diff enables copy detection
including unchanged source files. No acceptance assertion or old negative case
was removed. Ordinary Unicode/spaces still pass focused classification.

- `runtime-correction-controls-red.log`: exit 1; eight C0/tab/ESC/DEL/C1
  counterexamples returned `documentation`, while the Unicode positive passed.
- `runtime-correction-copies-red.log`: exit 1; both real-Git `C100` fixtures
  (modified and unchanged source) returned `documentation`. Each fixture proved
  its Git copy classification before asserting the actual CLI result.
- Each RED has `.exit`, `.sha256`, `.source.mjs` and `.test.mjs` companions,
  preserving exact pre-fix input bytes separately from candidate-001 history.
- `runtime-correction-final-harness.log`: same full harness command below,
  exit 0, 148 tests / 146 PASS / 0 FAIL / 2 explicit cloud-proof NOT RUN,
  60.508 seconds. Both repaired classes now require full and reject
  `--check-docs`. All previous scope/workflow/runner/source checks remain GREEN.
- Corrected classifier SHA-256:
  `685cbca99858012f5af9b7bcc33709e51d851e03b6a8192341aa276f15d78e7c`;
  corrected scope tests:
  `62b5bd2b8d522770882e3fd2d67f870a68252e3f961581d8b97757605cdb03da`.
  `runtime-correction-final-harness.sha256` records both, and the bounded
  `runtime-correction-candidate-source.tar.gz` preserves this correction.

`git diff --check` passed. Full Linux/product/native and independent acceptance
remain outside this author result; parent freezes and revalidates the corrected
candidate. The two original Validator findings remain historical FAIL evidence.

The complete local candidate is frozen for independent review and authorized
candidate publication. Author checks below passed within their stated scopes;
complete Linux CI and independent disposition remain pending at this snapshot.
No business capability delta; the [full coverage snapshot](../../../docs/planning/capability-coverage/snapshots/ci-reliability-and-feedback-2026-10-03.md)
retains all prior accepted scopes and gaps. This is not product acceptance.

## Identity and scope

- Device: MacBook; branch `work/macbook/workflow-efficiency-hardening`.
- Baseline: `789edd63d05ff729404b6c11a5d82e8c9c36450d`.
- Engineering worker: `juaner_worker`, configured GPT-6 Astra / high,
  workspace-write; no model/effort or sandbox change.
- Runtime/tooling candidate hashes: `runtime-final-harness.sha256` in the root below.
- Persistent evidence root:
  `/Users/huangbo/JuanerAI-artifacts/workflow-efficiency-hardening/ci-20261003-HA69r0`.
  Same-device files are readable; remote receiver readback and backup not claimed.
- Worker wrote CI workflow, validation tools/tests, this Change and current
  canonical/CI specification clauses. Parent owns governance edits; fixture
  worker owns the two existing Desktop test files. No product source, lock,
  dependency, board/Host Loop, remote/Mini or Git writes by this worker.

## Acceptance, tests, code and results

| Acceptance | Permanent test / implementation | Evidence |
|---|---|---|
| CI-CHECK-001 | `run.test.mjs` checks public canonical fail-fast order, inherited gate removal and fixed actual suite inventory; `prepare-ci-install.test.mjs` checks always-on source identities and local/cloud applicability; `run` owns the single early contract group | `runtime-check-red.log`: old runner returned 0 instead of child 23. `runtime-applicability-causal-red.log`: old archive tests blocked local execution; cloud absence/invalid inputs already rejected. Final suite GREEN. |
| CI-SCOPE-002 | `ci-scope.test.mjs` uses real isolated Git histories and extracted actual workflow selection; `ci-scope.mjs` and `ci.yml` use trusted-base classification | `runtime-scope-red.log`, final scope cases GREEN: approved docs, mixed/unknown/contract/runtime paths, rename/delete/symlink/mode, newline filenames, missing base, hostile PR classifier, broken/unknown classifier results. |
| CI-LOG-003 | `ci-workflow.test.mjs` observes both streams before allowing child exit; existing timeout/log-slot tests preserve 0/17/124 and prior bytes; `run.test.mjs` checks group duration and exit 23 | `runtime-logging-red.log`: buffered logger caused child deadline 88 instead of 17; runner lacked timings. Final live handshake, timeout/exit and canonical order tests GREEN. |
| CI-PRIVACY-004 | Existing `AC-XDESK-006-05` in `xanthil-desktop-assistance.contract.test.ts` exercises the actual Application projection and its privacy oracle; valid schema-declared identities are distinguished from content | `privacy-red-20261003.log` reproduces the observed UUID collision; `privacy-green-20261003.log` passes with content/unknown-ID/malformed-identity mutations still rejected. Full Assistance suite: 38/38 PASS, exit 0. |
| CI-PERF-005 | Four existing material-policy matrices reuse copies of a real completed synthetic task; all original case bodies and inputs remain. New `CI-PERF-005` checks independent copies, source and SQLite corruption refusal, and unchanged seed bytes | Same 8 cases: 85.6617s before, 62.4088s after (27.14% reduction in this local sample). Related retained regression: 46/46 PASS, exit 0, including lifecycle/expiry/source/authority checks. Full Linux cost remains unmeasured for this candidate. |

Fixture evidence: `fixture-evidence-identities.json` binds 16 source/output files
(491,116 bytes), SHA-256
`a01ecb073daef9be808f0169db0d3872eef371b3ff2784015198f51655c3da04`.
Each was independently read back and hashed. `member-baseline-source.ts` matches
the HEAD integration source (SHA-256
`bf351c66ac426898d2361ebaf10d469e97bb7c743f97e0521d6584d8a78650e0`).
The closed seed has 20 files / 671,627 bytes, recorded and read back in
`clone-probe-20261003.log`; native baseline, clone and candidate fixtures remain
under this device's evidence root. No active grant or model lease is reused.

`retention-check-20261003.log` and its retained AST script establish 87 original versus
88 current test declarations: zero removed tests, zero changed assertions or
negative inputs, four fixture-call-only changes and one isolation test. The
opaque projection cursor check in the privacy oracle is private test knowledge
of the current storage implementation, not a new public product contract.

Final command (actual local invocation):

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin /Users/huangbo/Dev/Env/homebrew/bin/node --test tools/harness/validation/*.test.mjs
```

`runtime-final-harness.log`: exit 0, 135 tests, 133 PASS, 0 FAIL,
2 explicit `NOT RUN` cloud archive/member proofs; 48.511 seconds.
`runtime-final-harness.exit` preserves the numeric result; corresponding
`.sha256` binds all validation source, workflow and affected current specs.
`git diff --check` and POSIX runner `sh -n` passed. Actual workflow Bash syntax,
logging, timeout selection and scope-selection shells run in retained tests.

Read back on this device: `runtime-final-harness.log` is 9,351 bytes, SHA-256
`e08e52c117c15b84652a8b185520a6977121cfe9fcbd94640118c154cdd27b39`.
The current worker source bundle is `runtime-candidate-source.tar.gz`; its
separate `.sha256` records its captured byte identity. Parent candidate freezing
must include the other writers' changes as well.

## Retained tests, failures and limits

No test or negative assertion was removed. Existing fixed Desktop fixture
members were updated against actual suite files, and a new independent
inventory comparison prevents silent omission. Total count and appendix offsets
now derive from independent literal inventories; dependency/trust pins are
unchanged. Cloud proofs remain mandatory when GitHub Actions runs full CI;
local absence is disclosed, and invalid supplied inputs always fail.

`member-d00403-baseline-20261003.log` preserves an initial missing-Pi setup
failure; it is neither causal RED nor a valid performance baseline. Existing
approved TypeBox and Pi installations were then linked into this worktree's
ignored dependency directory without download or modification of those packages.
The valid before/after logs are `member-d00403-baseline-ready-20261003.log` and
`member-d00403-green-20261003.log`. Existing Node/npm/DuckDB and system Python
were selected through command-local links under `toolchain/`; global and Mini
environments were unchanged. Real Provider calls were not made.

`runtime-applicability-red.log` is a setup failure, not causal RED: Node inherited
its test-child marker and declined a nested filtered launch. The fixture now
removes that marker for an independent filtered child; the subsequent
`runtime-applicability-causal-red.log` proves the intended behavior gap. Both
records and test source snapshots remain preserved.

An intermediate streaming implementation failed on macOS Bash 3 because it
cannot wait for those process-substitution PIDs. It was replaced by short-lived
named pipes and explicitly waited tee children; final zero/failure/timeout and
live-output tests pass. That intermediate full raw output was not persisted as
a standalone artifact; exact historical attribution beyond the task tool output
is UNKNOWN, and it is not presented as final evidence. The host Bash startup
also printed an existing missing `/.local/bin/env` diagnostic in a passing
Python-selection test; no host startup file was changed.

No complete product typecheck/portable regression or cloud installation is
claimed here: the checkout lacks the complete approved dependency installation
and raw archive. No dependency was installed to bypass that boundary. Native
packaging, GUI, real-provider and installed-artifact checks remain NOT RUN.
Focused documentation results likewise never claim product regression.

Next: independent evaluation of the complete fixed diff, then the separately
authorized PR #61 delivery path and actual required CI. Final CI/merge receipts
may be appended to that PR and retained in the same evidence root without a
second source commit merely to repeat an unchanged product suite. Until those
receipts exist, this snapshot does not claim CI PASS, merge, receiver adoption
or execution resumption. The governing permission and acceptance boundaries
remain unchanged.
