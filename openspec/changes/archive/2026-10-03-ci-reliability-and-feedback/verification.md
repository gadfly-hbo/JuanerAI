# Current result and next action

## Engineering Acceptance and archive — 2026-10-03

The Engineering Controller accepts candidate-003 for this bounded CI/workflow
repair after independent engineering Validator PASS and matching complete cloud
evidence. Published HEAD `6c31aef701ae050c42713dc71a248cc5c6504e1f`, tree
`15329211aea787702c95594766cbb5e60480c566`, matches all 28 frozen files.
GitHub tested merge `72bd552c47e1893bc4d674c28590d0b6939c9339` with the expected
base/head parents and that same tree. No behavior, permission, timeout,
concurrency, dependency or assertion waiver was used.

[Run 37122653004](https://github.com/gadfly-hbo/JuanerAI/actions/runs/37122653004)
finished successfully in 12m32s job time: portable validation 727s, exit 0;
17/17 canonical groups completed. Harness 158/158, Desktop contracts 658/658
and Desktop integration 498/498 passed; every one of the 159 partitioned member
cases appears individually as PASS. Pinned installation, both cloud archive
proofs, syntax and typecheck passed. The sole skipped test is the explicitly
gated real-provider acceptance test. Native GUI, packaging/DMG and installed
artifact acceptance were not run and are not part of this tooling acceptance.
No business capability or user product acceptance is newly claimed.

The actual runtime reported Node 26.0.0, npm 11.12.1, Python 3.12.3,
DuckDB 1.5.2 and four available CPUs (AMD EPYC 9V74); CPU quota was UNKNOWN.
Desktop integration completed in 662s. This corrects the earlier incomplete
1080s portable run without reducing coverage or increasing its limit; it does
not guarantee that future source or runner changes cannot cause a failure.

Native evidence under the existing persistent root:

- `github-candidate003-attempt1.run.json`, 12,635 bytes, SHA-256
  `08c20e4566b164f33225332db5279d0ea8f19fdebc7831272a20abaa061e6aec`.
- `github-candidate003-attempt1.job.json`, 2,136 bytes, SHA-256
  `ed8a0db05b03a94a83da40297ac720678ff658d1d941c1f0f583d46e931e9e6c`.
- `github-candidate003-attempt1.log`, 652,426 bytes, SHA-256
  `ef15bc8eaac358ace62e3f3a9e7f71905ab460a819fe9a9c3ccbd68b452da9bb`.
- `github-candidate003-merge-input.json`, 2,616 bytes, SHA-256
  `77c8bf80b7c77617b76ef3f7e6788662309e26864ee13f4b8b7b48c08e05c081`.

The four accepted Change documents are moved together to this archive; current
requirements are integrated in the canonical-validation and pr-ci-validation
specifications and existing sole execution policy. Verify document preservation,
references and unchanged executable bytes before publishing this mechanical
archive. Final PR-revision checks, authorized merge and main synchronization
remain delivery actions. Their exact receipts belong to
[PR #61](https://github.com/gadfly-hbo/JuanerAI/pull/61) and the same evidence root.
No Mini task adoption or execution resumption is implied.

The sections below retain the earlier fixed-candidate snapshots and their
then-current limits. This acceptance supersedes their pending status, not their
historical FAIL, UNKNOWN or unverified results.

## Candidate-003 local correction

The mechanical split preserves all 159 member cases: 84 task/formal/human-review
cases in `member-task.integration.test.ts`, 75 retained/material cases in
`member-task-retained.integration.test.ts`. The support module registers zero
tests. `partition-equivalence-20261003.log` and its retained script compare all
103 non-import top-level statements with published `b36facf`; test names, bodies,
assertions and negative inputs are unchanged. Only necessary support exports,
imports and file placement differ. The immutable seed and final immutability
check stay process-local to the retained file.

The identical 17-case non-UI sample passed before and after: 164.464485s versus
102.678961s, a 37.57% reduction in this local sample. Native process/fixture-root
records show separate child processes and writable roots; both children were
observed using a CPU simultaneously. No within-file concurrency or timeout was
changed. This sample is not a full Linux or UI performance result.

Both independent typecheck inventories now append the two explicit new roots;
the original Change004 tuple and all rejection coverage remain. H-TUPLE focused
checks pass 3/3. Actual workflow diagnostics have a retained causal RED and now
report selected tool paths/versions and CPU facts without environment leakage.
Complete local harness: 158 tests, 156 PASS, 0 FAIL, two explicit unavailable
cloud archive/member proofs, exit 0 in 50.448935s. `git diff --check` passes.
Local full typecheck/UI/product regression remain unavailable with the existing
partial dependency installation; no installation was performed.

Evidence is in the same persistent root: `member-partition-before-20261003.log`,
`member-partition-after-20261003.log`, `member-partition-cpu-sample-20261003.log`,
`partition-equivalence-20261003.log`, `runtime-split-full-harness.log`,
`runtime-split-htuple.log`, and their source/identity records. The complete
candidate is to be frozen and independently reviewed before publication; full
cloud portable PASS and final disposition are still required. No merge,
Engineering Acceptance, archive or receiver adoption is claimed here.

## Candidate-002 cloud result and bounded follow-up

Published HEAD `b36facf189a5c39307cc31cd0cecefdb0639cf6e`, tree
`910b93f23995ee9240d0cfd4c4a2aeac4fcde3fa`, was checked in
[run 37119557289](https://github.com/gadfly-hbo/JuanerAI/actions/runs/37119557289).
Its PR merge input `3079c3c7c51ae9394e7ac15eb22b921708492c0a` has parents
`d0b6f2a933cbf21b913fdd2751761705e0fa5016` and that published HEAD; its tree
matches the candidate tree. Candidate-002 passed independent source/publication
review, not final Engineering Acceptance.

The actual full cloud run FAILED: portable validation reached the unchanged
1080-second limit, exit 124. All 148 cloud harness tests passed, including the
two archive/member proofs omitted locally. Typecheck and 16 of the 17 canonical
groups completed successfully. Desktop integration was incomplete; the member
file reported 154 of 159 cases before interruption. Output order does not prove
other interrupted files had not started. No blind same-SHA rerun, timeout
increase, merge or acceptance followed this failure.

Compared with the preceding failed PR run, 31 common optimized matrix cases
took 387.466s before and 239.479s after (38.19% less). The 106 common unmodified
member cases took 594.519s and 595.311s (0.13% more). These are sums for matching
cases, not full-job wall time; the successful optimization alone did not close
the total runtime gap. Runner CPU/quota and exact effective Python path were
not captured, so an environment explanation remains unproven.

The follow-up mechanically partitions the oversized member integration file,
preserving all cases and assertions and using the runner's existing file-level
parallelism. Shared fixture support registers no tests. Exact typecheck roots
and independent fixture inventories follow the split. Minimal toolchain/CPU
diagnostics go in the existing CI log. No dependency, test concurrency, timeout,
production behavior or acceptance change is approved by this correction.
The test-only refactor requires pre/post GREEN equivalence; only a subsequent
full portable run can establish CI completion.

A separate proposed review-state seed was rejected before implementation:
the checkpoint retained a live expiring grant. Reuse would change authorization
semantics. Its diagnostic PASS proves detection of that unsafe checkpoint,
not permission to reuse it or a performance benefit in the delivered suite.
`review-seed-probe-source.ts` and `review-seed-probe-20261003.log` retain the
probe in the same evidence root. Historical failures and rejected probes remain.

Native GitHub evidence, independently read back in the evidence root below:

- `github-candidate002-attempt1.run.json`, 12,617 bytes, SHA-256
  `5094c72f6230d9c6a29b6787464ec6b3a0858f2ae03caacf946fa8be49ffa3e0`.
- `github-candidate002-attempt1.job.json`, 2,136 bytes, SHA-256
  `202aae2e637d3d57273710088fc79190706f831a9b2187fe48494034494be83a`.
- `github-candidate002-attempt1.log`, 392,301 bytes, SHA-256
  `364377e7ef7d980c0e6f449d2bc45fe9100bc2cf9f66d0b41bd50998e79348e8`.

The sections below preserve earlier fixed-candidate evidence and its then-current
limits; this section supersedes their pending-cloud status, not their results.

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
No business capability delta; the [full coverage snapshot](../../../../docs/planning/capability-coverage/snapshots/ci-reliability-and-feedback-2026-10-03.md)
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
