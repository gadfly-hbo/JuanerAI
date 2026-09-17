> Archive note (R378, 2026-09-17): the complete original text below is the
> frozen Spec-stage record, including its historical pending/NOT_RUN status.
> Current completion and limits are in [the archive acceptance record](verification.md#archive-acceptance-and-evidence--r378-2026-09-17).

# Verification: Change Coordinator Startup Directory Preparation

## Current Verdict

`SPEC_GATE_PASS / TEST_ENTRY_PENDING / EXECUTABLE_NOT_RUN`

Controller R342 accepted the complete revised Spec and overdesign review.
This does not claim Test Design, RED, TDD_READY, implementation, GREEN, regression,
Retirement, Validator, integration, deployment, host validation,
`SERVICE_BEFORE`, D1, `BLK-D1A-008`, or M4 completion.

## Frozen Spec Inputs

- R342 actual entry and temporary carrier authorization.
- R341 approved `plan-delta.md`, Reviewer seven-part `PASS`, Controller
  acceptance, Spec brief, and `source-binding.json`.
- R340 accepted proposed contract; its old `deferred` status is historical.
- Worktree constitution, product Change policy, routing, complexity control,
  Test Asset Retirement, testing/DoD, security/deployment/data boundaries,
  canonical Mode Activation spec, and referenced Mode Activation/RIC designs.
- Frozen worktree five-module identity equal to deployed R274 payload;
  `host-loop.mjs` SHA-256
  `d9470869397877c4de3c3afa8aa4f24485f959aa5c04063b133ccf0d0f1d4c49`.

## Spec Output Inventory

Exactly seven files are in this Change package:

1. `proposal.md`
2. `design.md`
3. `specs/mode-activation/spec.md`
4. `test-plan.md`
5. `tasks.md`
6. `traceability.md`
7. `verification.md`

No production, Test, canonical, archive, plist, installer, configuration,
project-control, Git, MASTER/NEXT, or historical evidence file is part of this
Spec write set.

## Contract Review Checklist

| Item | Spec disposition | Evidence status |
|---|---|---|
| one fixed pre-listen target and real listener entry | `REQ-SDP-001` | SPECIFIED / NOT_RUN |
| safe existing object, no repair | `REQ-SDP-002` | SPECIFIED / NOT_RUN |
| exact absence, bound create, repeated lifecycle | `REQ-SDP-003` | SPECIFIED / NOT_RUN |
| parent root:daemon 0775 preserved | 001-02 and Design 2 | SPECIFIED / NOT_RUN |
| ACL/runtime access/no-follow/race semantics | 002-01..02, 003-01..03 | SPECIFIED / NOT_RUN |
| created object retained; no business effects | `REQ-SDP-004` | SPECIFIED / NOT_RUN |
| real socket/status, negatives, half-close protection | `REQ-SDP-005` | SPECIFIED / NOT_RUN |
| exact package, rollback, host proof, return point | `REQ-SDP-006` | SPECIFIED / NOT_RUN |
| only named `AC-RIC-004-01` exception | modified criterion | SPECIFIED / NOT_RUN |

## Controller Review-1 Disposition

| Item | Disposition in revised package |
|---|---|
| C1 native boundary and identity | CLOSED R2: Design 1/2 freezes the fourth startup input without `runtime_user`, five-method OS/FileHandle shape, `/bin/ls -led` ACL parse, and a constant Node probe whose same numeric `runtime_uid` binds `initgroups` and `setuid` while the same `runtime_gid` binds the extra group and `setgid`; supplementary-group readback, fixed argv/environment, and finite time/output/failure rules remain |
| C2 created provenance/races | CLOSED WITH BOUNDED CLAIM: `0700` creation and root-owner/ACL/runtime-write predicate precede all mutation; descriptor binds later changes; runtime user is proved unable to write every ancestor; unrelated daemon/root writers and post-final-check privileged replacement are explicitly not claimed defeated |
| C3 diagnostics/listener | CLOSED: six exact startup-only codes are normative; no-listener/no-method applies only to preparation rejection; existing socket-authority close and half-close behavior remain separate regressions |
| C4 RED/seam | CLOSED: current listener ignores the extra Test argument and fails on a real temporary missing parent; the same call consumes the frozen seam after implementation; independent real-filesystem/socket oracle remains required; undefined protection intent removed |
| C5 activation/rollback | CLOSED: rollback exists only in a later separately approved exact package operation under the original plan, never automatic old-installer execution; stop/start and real reboot evidence are recorded without substitution |

## Current Evidence Matrix

| Gate/evidence | Status | Release condition |
|---|---|---|
| product direction | APPROVED_INPUT | retained R341 decision |
| independent development readiness | PASS_INPUT | retained R341 Reviewer/Controller acceptance |
| seven-file Spec package | SPEC_ACCEPTED | R342 review.md and spec-freeze.json |
| required overdesign review | PASS | R342 ponytail-review-final.md; redundant username removed |
| Spec Gate | PASS | Controller R342 complete review and C1-C5 closure |
| Test Design / health / causal RED | NOT_RUN | fresh `juaner_test` after Spec Gate |
| implementation / GREEN / regression | NOT_RUN | TDD_READY then fresh `juaner_worker` and frozen commands |
| Test Asset Retirement | NOT_RUN | reconciled ledger, ponytail, rerun, Controller PASS |
| independent Validator | NOT_RUN | frozen implementation/evidence and fresh read-only return |
| integration/deployment/host | NOT_RUN | separate exact authority and operation package |
| SERVICE_BEFORE / D1 / M4 | BLOCKED_BY_EXISTING_PLAN | return only after required host evidence |

## Residual Risks and Stop Lines

- Target-host owner/group/ACL/access and launchd behavior are deliberately not
  inferred from local controlled evidence.
- The accepted `root:daemon 0775` parent is preserved; this package does not
  speculate why the directory was absent or change the parent boundary.
- The approved protected subject is the configured runtime user. The package
  binds its supplementary groups and user drop to the same numeric runtime UID
  and proves those complete credentials cannot write ancestors;
  it does not claim defense against unrelated daemon-group or privileged path
  replacement outside `AC-MA-003-02`.
- Safe induction of a fixed-path missing state on the target requires a later
  exact operation package. If the directory is nonempty, a socket/process is
  present, or removal is not separately authorized, that positive remains
  `NOT_VERIFIED` and acceptance is blocked.
- Any need for plist/installer/another module, target cleanup, new protocol,
  dependency, automatic retry, or weaker identity/ACL/access binding returns to
  Controller as contract or scope drift.

## Next Gate

Next is isolated Test Design/source review/health/causal RED, not Worker.
The current callable Test role is fixed terra/medium; this Change requires
terra/high. The current temporary sol/high exception ended with Spec.
R342 test-brief.pending.md records the requested fresh Test-only carrier;
no Test has been dispatched. All runtime evidence remains `NOT_RUN`.

Controller evidence:
[R342 acceptance](/Users/huangbo/JuanerAI/.recovery/m2-20260906/evidence/controller-startup-spec-r342/review.md),
[final Spec freeze](/Users/huangbo/JuanerAI/.recovery/m2-20260906/evidence/controller-startup-spec-r342/spec-freeze.json).
Role returns and NEEDS_FIX history are retained, not overwritten.

## Archive acceptance and evidence — R378 (2026-09-17)

Status: ACCEPTED_FOR_ARCHIVE / D1_FINALIZATION_PENDING. This completion record
supersedes the historical status assertions above, not the approved contracts.
R378 explicit user authority covers this documentation archive, canonical merge,
review and Git/PR integration only. It grants no new host, provider or Desktop
action.

### Frozen implementation and local acceptance

- PR #31: https://github.com/gadfly-hbo/JuanerAI/pull/31
- Accepted integration: ebb93de91db083b8f46f8e5a15baeaea65bbb20a;
  tree 4201653aed3b25c86fe254c90dce34e0a4d7fb5e.
- Production host-loop.mjs: 114685 bytes; SHA256
  c0f23d7462fa3ae8e94d98f2c530c13d680fadc711628e81c41f7077592bff7a.
- Test mode-activation.test.mjs: 284510 bytes; SHA256
  81e92381fedd6d2a13fe5aed7e45f2f58c6633923581a4bcb96acaf7ba7a3e6f.
- Approved seven-file Spec package identity:
  59b8df5a13a43535b2bd402d7d1e4556fcdc0c2b4a28f894468299db279e1e17.
- Final R349 validation-freeze.json SHA256:
  7378dd9e565929b04e31fec9ede16f94150a058f135b1a31849a0bad522fa8fd.
- R348 valid F1/F2 RED/TDD record SHA256:
  d8929bf266f5f57ebac3544a44148bb3be14ad16dd58e163f00035c208f25f57.
- R349 final runs: helper 1 PASS; health 2 PASS; causal GREEN 2 PASS;
  startup 173 PASS; ordinary mode 273 PASS/19 A2 skips;
  canonical offline 1410 PASS/1 provider skip. Retirement PASS.
  Node v26.0.0; command-local environment and complete raw streams/exit
  results remain in the frozen record.
- R350 fresh independent Validator PASS and Controller local acceptance.
  Earlier R347 F1/F2 findings, invalid preliminary RED and auxiliary failures
  remain historical evidence, not erased or represented as successful runs.

The Controller-retained evidence root is
.recovery/m2-20260906/evidence/ (local, deliberately not published in Git).
Exact relative locators: controller-startup-test-r344/final-review.md,
controller-startup-correction-r348/tdd-ready.json,
controller-startup-worker-r349/validation-freeze.json,
controller-startup-validator-r350/acceptance.md,
controller-startup-integration-r351/integration.json, and
controller-d1-acceptance-r377/R377_ACCEPTANCE_AND_CLOSEOUT.md.
The full logs referenced by those records remain local; these citations are
not a claim that a public checkout alone contains raw host evidence.

### Real host acceptance and return to D1

R363 single-file replacement/stopped readback was accepted at R364. R367 proved
the safely-created directory startup, status and planned stop. Its residual
socket STOP was preserved. R369 separately authorized operator maintenance;
R371 precisely removed that old socket once, retained the RUN directory and
completed safe-existing startup. R368/R372 accepted these bounded observations.

R374 full environment and R376 PRE → five Git steps → POST were accepted at
R375/R377. R376 POST at 2026-09-17T14:03:29.838982Z–14:03:33.012932Z proved all
three host repository roles at ebb93de91db083b8f46f8e5a15baeaea65bbb20a,
live origin, strict STATUS/EMPTY, fresh WIP and complete protection/transport
binding. Two worktrees were clean; canonical was bare (clean not applicable).
MacBook's clean acceptance worktree readback matched that integration as recorded
in R377. This is window-bound evidence, not a continuous availability promise.

Raw host report: 40948494 bytes, SHA256
ee14e3bddda00d92465552daaa09b7ced13f5a9af4015af3c9775ade3d2646fc.
Controller independent nested-capture review:
controller-d1-acceptance-r377/raw-review.json, SHA256
850fd68c1ca98a9536a460f0bf24838d2a236132b982126bc598e9ea69193727.
The original failures, full command/input/source bindings, raw streams and exit
results remain in that append-only report.

### Reuse, explicit limits and remaining endpoint

This archive changes documentation only. Its mechanical checks must show every
original seven-file body retained, canonical's prior content unchanged and the
approved normative delta copied exactly. Production/Test/tools bytes must remain
equal to ebb93de9. Their original R349/R350 evidence is reused by demonstrated
no-impact equivalence, not relabeled as newly executed tests. K1/K2/hour remain
their separately accepted baselines; final applicable gates are not waived.

Real host evidence is maintenance-assisted stop/start. It is not real reboot,
automatic stale-socket recovery, old installer repair or rollback proof.
S09/A2 remain USER_WAIVED / NOT_VERIFIED. No external provider or real product
DISPATCH positive full run is inferred from local tests or STATUS/EMPTY.
No new waiver is introduced.

The startup/helper/baseline sub-branches are CLOSED_RETURNED at the original D1
acceptance point. BLK-D1A-008 overall release and M4 are not issued by this
archive: final documentation integration must first exist, D1 sources must bind
that exact identity and required final baseline/WIP readback must be accepted.
The Controller records that continuation in the existing MASTER_PLAN and
NEXT_ACTION, not a parallel state system. Desktop remains separately authorized.
