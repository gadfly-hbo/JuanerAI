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
