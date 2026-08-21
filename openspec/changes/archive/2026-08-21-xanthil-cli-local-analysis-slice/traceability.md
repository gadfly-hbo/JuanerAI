# Traceability: Xanthil CLI Local Analysis Slice

## Status

Specification mapping is complete. Controller has accepted TASK-002 Product
Core, TASK-003/TASK-003B Ports and Application, TASK-004 real
Analysis/Artifact Adapters, TASK-005 Pi Adapter, TASK-006
CLI/Profile/example, TASK-007 exact dependency evidence, TASK-008 complete
deterministic regression, and TASK-009 real-provider acceptance. Final targets
are unit `250/250`, contract `174/174`, integration `162/162`, default E2E
`131 pass / 1 explicit real-provider skip`, and the gated real
TEST-XCLI-013 `1/1` PASS against `minimax-cn/MiniMax-M3`. Implementation and
evidence are frozen. TASK-010 independent validation, final acceptance,
baseline merge, and archive remain honestly `PENDING`.

TASK-009 prompt-contract clarification R3.1 has **CONTROLLER SPEC GATE PASS**.
It preserves the normative Requirements/ACs/planned-test/task inventory and
closes the Application-owned `discovery_context` and `finding_context` /
Adapter transport-policy seam, including Discovery zero-tool, Execution
admitted-tool completion, and R3.1 seventeen-case transport/business
disposition. Test C2 must return focused RED before Controller may issue
`TDD_READY_TASK009_PROMPT_R3_1`. Test C2 and Controller independent reruns now
establish that Gate: contract `153 pass / 7 expected transport RED`, integration
`153/153`, and default E2E `131 pass / 1 explicit real-Pi skip`. A fresh bounded
Worker is released; no GREEN or real-run claim follows from this Gate.

TASK-009 R4 Embedded Runtime revision has **CONTROLLER SPEC GATE PASS AND REAL
ACCEPTANCE GREEN**.
Decisive real evidence restores the embedded SDK with native custom
tools: M3 completed both turns in one in-memory session with Discovery zero
tools, Execution three exact callbacks, normal stops, and semantic
Proposal/Finding after dynamic Application-context templates. R4 keeps
object-key order non-semantic, disables create-time refresh then performs one
explicit local-only model refresh, rejects closed transport failures, disables
retry/fallback, changes Application's frozen model identity/provenance chain
only to MiniMax, and makes M3 an activation candidate only. CLI/JSONL documents
are non-normative exploration evidence. Staged Test/Worker gates established
and closed the required RED/GREEN chain; the final real TEST-XCLI-013 passed
with exact M3 provenance and the complete persisted synthetic evidence chain.
TASK-010 remains independent and read-only.

The matrix `Code` and `Result` columns are resolved to the frozen code groups
and current evidence gates below. `R-T008` means deterministic
implementation/regression evidence is GREEN and only TASK-010 independent
verification remains for that row. `R-T009` and `R-T009-R4` mean the row also
has the completed real-provider TASK-009 evidence and now awaits TASK-010.
TEST-XCLI-013 remains the sole real production-default Pi prompt/provider proof
and is not implied by deterministic acceptance.

TASK-006 contract clarification: `AC-XCLI-002-03` maps unsupported `edit` to cancellation rather than an unimplemented re-proposal loop. Its executable protocol coverage remains TEST-XCLI-003 and TEST-XCLI-009; no Requirement, Acceptance-Criterion, planned-Test, or Task identifier is added or removed. A future semantic-edit capability requires a separately approved Application Test/Worker revision and is not TASK-006 scope.

TASK-006 runtime-value clarification: TEST-XCLI-009's Correction 002 must prove direct `next()->Event` admission, first-question rejection, complete Product-Core-valid terminal result arms, CLI-owned clone/deep-freeze without Application mutation, deterministic Application-error mapping, and writer-stage causality. It adds no identifier, product surface, or real-Pi evidence; TEST-XCLI-013 remains deferred to TASK-009.

## TASK-010 Validator-FAIL Remediation R3 (Controller Spec Gate PASS)

| Remediation requirement | Existing normative requirement / AC | Planned causal evidence |
|---|---|---|
| R3-REQ-001 preflight/read provenance | REQ-XCLI-001 / AC-XCLI-001-02; REQ-XCLI-002 / AC-XCLI-002-02; REQ-XCLI-004 / AC-XCLI-004-01..02; REQ-XCLI-015 / AC-XCLI-015-01 | TEST-XCLI-009 exact closed preflight mapping/order/zero effect, read-time, mutation recheck |
| R3-REQ-002..003 deadline/publication | REQ-XCLI-013 / AC-XCLI-013-01..04 | TEST-XCLI-006 and TEST-XCLI-013 scheduler and pending doubles, aborted-zero-write/no-next-unit, candidate/no-success-manifest tests |
| R3-REQ-004 observed Pi state | REQ-XCLI-007 / AC-XCLI-007-03; REQ-XCLI-015 / AC-XCLI-015-01 | TEST-XCLI-006 cached-runtime/same-session actual-model/active-tool mismatch facade contract |

The remediation is **CONTROLLER_SPEC_GATE_PASS_TASK010_VALIDATOR_REMEDIATION_R3**.
The configured Test role is released only for causal RED. This neither changes
historical TASK-009 mapping nor records TDD_READY, Worker release, GREEN,
TASK-010 acceptance, or Validator PASS.

Phase-A Port-shape evidence is now
**TDD_READY_TASK010_REMEDIATION_R3_PHASE_A_PORT_SHAPES**: the three exact
preflight-plus-business Port shapes have causal RED, and only
`packages/ports/local-analysis.mjs` is released. Remaining Application,
Adapter, Profile, deadline, publication, provenance, and actual-state work is
still Test-locked until Phase-A GREEN and a subsequent RED Gate.

Phase-A is now **GREEN_TASK010_REMEDIATION_R3_PHASE_A_PORT_SHAPES** with the
Port-only production SHA recorded in verification. The remaining three Port
suite failures are the concrete Adapter preflight boundary, so all non-Port
R3 production paths remain locked while the configured Test role establishes
the next causal RED.

Phase-B1 is
**TDD_READY_TASK010_REMEDIATION_R3_PHASE_B1_SCHEDULER_DEPENDENCY** with two
causal Application-composition RED leaves. It releases only closed acceptance
of the required scheduler dependency; all scheduler use and remaining R3
behavior stay Test-locked.

Phase-B1 is now
**GREEN_TASK010_REMEDIATION_R3_PHASE_B1_SCHEDULER_DEPENDENCY**. Focused
composition is `9/9`; the scheduler is validated and retained but never used.
Remaining R3 behavior and concrete composition stay Test-locked.

Phase-B2a is **TDD_READY_TASK010_REMEDIATION_R3_PHASE_B2A_PREFLIGHT_ORDER**.
It releases only the five-event Application admission prefix; result semantics
and every downstream R3 behavior remain Test-locked.

Phase-B2a is now **GREEN_TASK010_REMEDIATION_R3_PHASE_B2A_PREFLIGHT_ORDER**.
The exact prefix is implemented; preflight result semantics, provenance,
failure mapping, scheduling, and all concrete Adapter behavior remain locked.

Phase-B2b is
**TDD_READY_TASK010_REMEDIATION_R3_PHASE_B2B_PREFLIGHT_SEMANTICS** with seven
stable failure leaves GREEN and nine causal result/provenance/mapping RED
leaves. It releases only the bounded Application semantics recorded in
verification.

Phase-B2b is now
**GREEN_TASK010_REMEDIATION_R3_PHASE_B2B_PREFLIGHT_SEMANTICS** with focused
`16/16` and strict order `1/1`. Active deadline, Artifact signals/publication,
and all concrete Adapter/Profile behavior remain Test-locked.

Phase-B2c is **TDD_READY_TASK010_REMEDIATION_R3_PHASE_B2C_SCHEDULER_ADMISSION**.
It releases only one scheduled handle and success-path cleanup; deadline
expiry and every pending/cancellation behavior remain Test-locked.

Phase-B2c is now **GREEN_TASK010_REMEDIATION_R3_PHASE_B2C_SCHEDULER_ADMISSION**
at focused `1/1`. The handle exists and success cleans it; active expiry,
pending work, failure/cancellation cleanup, and shared signals remain locked.

TASK-006 proposal-validator revision: TEST-XCLI-003 receives the bounded Product Core unit RED/GREEN prerequisite for `createLocalAnalysisDomain().validateAnalysisProposal(proposal)`. The Core-only revision is the existing TASK-002 path; TASK-006 resumes only after Controller accepts that GREEN, with no Application change and its original Worker budget preserved. The validator is traced to REQ-XCLI-002 and AC-XCLI-002-01 through AC-XCLI-002-03; no identifier is added or removed.

`TASK-001` is the isolated Test role task. `TASK-002` through `TASK-007` are production/dependency tasks gated by `EXPECTED_RED` and Controller authority. `TASK-008` through `TASK-010` are validation, real-run, and independent-verification tasks.

Normative identifier inventory:

- Requirements: `REQ-XCLI-001`, `REQ-XCLI-002`, `REQ-XCLI-003`, `REQ-XCLI-004`, `REQ-XCLI-005`, `REQ-XCLI-006`, `REQ-XCLI-007`, `REQ-XCLI-008`, `REQ-XCLI-009`, `REQ-XCLI-010`, `REQ-XCLI-011`, `REQ-XCLI-012`, `REQ-XCLI-013`, `REQ-XCLI-014`, `REQ-XCLI-015`, `REQ-XCLI-016`.
- Planned tests: `TEST-XCLI-001`, `TEST-XCLI-002`, `TEST-XCLI-003`, `TEST-XCLI-004`, `TEST-XCLI-005`, `TEST-XCLI-006`, `TEST-XCLI-007`, `TEST-XCLI-008`, `TEST-XCLI-009`, `TEST-XCLI-010`, `TEST-XCLI-011`, `TEST-XCLI-012`, `TEST-XCLI-013`, `TEST-XCLI-014`, `TEST-XCLI-015`, `TEST-XCLI-016`, `TEST-XCLI-017`, `TEST-XCLI-018`, `TEST-XCLI-019`, `TEST-XCLI-020`, `TEST-XCLI-021`, `TEST-XCLI-022`.
- Tasks: `TASK-001`, `TASK-002`, `TASK-003`, `TASK-004`, `TASK-005`, `TASK-006`, `TASK-007`, `TASK-008`, `TASK-009`, `TASK-010`.

Range notation in the tables is inclusive and is only a compact display; the inventory above is authoritative for identifier completeness.

## Requirement-to-Evidence Matrix

Code groups: `C-CORE` = `packages/product-core/local-analysis.mjs`; `C-PORTS` = `packages/ports/local-analysis.mjs`; `C-APP` = `packages/application/local-analysis.mjs`; `C-PI` = `adapters/agent-pi/local-analysis.mjs`; `C-ANALYTICS` = `adapters/analytics-duckdb/local-analysis.mjs`; `C-ARTIFACT` = `adapters/storage-local/local-analysis.mjs`; `C-CLI` = `apps/cli/xanthil.mjs`; `C-PROFILE` = `profiles/personal/local-analysis.mjs`; `C-FIXTURE` = `examples/member-analysis/member-orders-v1.csv`; `C-STACK` = root `package.json`/`package-lock.json` and their project-local install.

| Requirement | Acceptance Criterion | Planned Test(s) | Planned Task(s) | Code | Result |
|---|---|---|---|---|---|
| REQ-XCLI-001 | AC-XCLI-001-01 | TEST-XCLI-009, 011, 021 | TASK-001, 003, 005..007 | `C-CLI`, `C-PROFILE`, `C-PI`, `C-STACK` | `R-T008` |
| REQ-XCLI-001 | AC-XCLI-001-02 | TEST-XCLI-009, 011, 014 | TASK-001, 003, 005, 006 | `C-CLI`, `C-PROFILE`, `C-APP` | `R-T008` |
| REQ-XCLI-002 | AC-XCLI-002-01 | TEST-XCLI-003, 009, 013 | TASK-001, 003, 005, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-CLI` | `R-T009` |
| REQ-XCLI-002 | AC-XCLI-002-02 | TEST-XCLI-003, 009 | TASK-001, 003, 005, 006 | `C-CORE`, `C-APP`, `C-CLI` | `R-T008` |
| REQ-XCLI-002 | AC-XCLI-002-03 | TEST-XCLI-003, 009, 013 | TASK-001, 003, 005, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-CLI` | `R-T009` |
| REQ-XCLI-002 | AC-XCLI-002-04 | TEST-XCLI-003, 009, 015 | TASK-001, 003, 006 | `C-CORE`, `C-APP`, `C-CLI` | `R-T008` |
| REQ-XCLI-003 | AC-XCLI-003-01 | TEST-XCLI-004, 008, 009 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-003 | AC-XCLI-003-02 | TEST-XCLI-008, 009 | TASK-001, 003, 004, 006 | `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-003 | AC-XCLI-003-03 | TEST-XCLI-008, 010, 015 | TASK-001, 003, 004, 006 | `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-004 | AC-XCLI-004-01 | TEST-XCLI-001, 007, 010 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS`, `C-FIXTURE` | `R-T008` |
| REQ-XCLI-004 | AC-XCLI-004-02 | TEST-XCLI-001, 007, 014 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS`, `C-FIXTURE` | `R-T008` |
| REQ-XCLI-004 | AC-XCLI-004-03 | TEST-XCLI-014 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS` | `R-T008` |
| REQ-XCLI-005 | AC-XCLI-005-01 | TEST-XCLI-001, 007, 010, 012, 013 | TASK-001..004, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-ANALYTICS`, `C-FIXTURE` | `R-T009` |
| REQ-XCLI-005 | AC-XCLI-005-02 | TEST-XCLI-002, 007, 012 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS` | `R-T008` |
| REQ-XCLI-005 | AC-XCLI-005-03 | TEST-XCLI-001, 002, 007, 012 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS`, `C-FIXTURE` | `R-T008` |
| REQ-XCLI-005 | AC-XCLI-005-04 | TEST-XCLI-001, 007, 012 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS`, `C-FIXTURE` | `R-T008` |
| REQ-XCLI-006 | AC-XCLI-006-01 | TEST-XCLI-006, 010, 014 | TASK-001, 003, 005, 006 | `C-PORTS`, `C-APP`, `C-PI` | `R-T008` |
| REQ-XCLI-006 | AC-XCLI-006-02 | TEST-XCLI-006, 014 | TASK-001, 003, 005, 006 | `C-PORTS`, `C-APP`, `C-PI` | `R-T008` |
| REQ-XCLI-006 | AC-XCLI-006-03 | TEST-XCLI-006, 014 | TASK-001, 003, 005, 006 | `C-PORTS`, `C-APP`, `C-PI` | `R-T008` |
| REQ-XCLI-007 | AC-XCLI-007-01 | TEST-XCLI-006, 011, 021 | TASK-001, 003, 005, 007 | `C-PORTS`, `C-PI`, `C-STACK` | `R-T008` |
| REQ-XCLI-007 | AC-XCLI-007-02 | TEST-XCLI-006, 011, 013 | TASK-001, 003, 005, 009 | `C-PORTS`, `C-PI`, `C-STACK` | `R-T009` |
| REQ-XCLI-007 | AC-XCLI-007-03 | TEST-XCLI-006, 011 | TASK-001, 003, 005 | `C-PORTS`, `C-PI` | `R-T008` |
| REQ-XCLI-007 | AC-XCLI-007-04 | TEST-XCLI-006, 011, 013, 021 | TASK-009 | `C-PI`, `C-STACK` | `R-T009-R4` |
| REQ-XCLI-007 | AC-XCLI-007-05 | TEST-XCLI-006, 011, 013, 014, 015 | TASK-009 | `C-PI`, `C-APP` | `R-T009-R4` |
| REQ-XCLI-007 | AC-XCLI-007-06 | TEST-XCLI-003, 006, 011, 013 | TASK-009 | `C-CORE`, `C-APP`, `C-PI` | `R-T009-R4` |
| REQ-XCLI-008 | AC-XCLI-008-01 | TEST-XCLI-007, 012, 021 | TASK-001, 003, 004, 007 | `C-PORTS`, `C-ANALYTICS`, `C-STACK` | `R-T008` |
| REQ-XCLI-008 | AC-XCLI-008-02 | TEST-XCLI-007, 012 | TASK-001, 003, 004 | `C-PORTS`, `C-ANALYTICS` | `R-T008` |
| REQ-XCLI-008 | AC-XCLI-008-03 | TEST-XCLI-007, 012 | TASK-001, 003, 004 | `C-PORTS`, `C-ANALYTICS` | `R-T008` |
| REQ-XCLI-009 | AC-XCLI-009-01 | TEST-XCLI-004, 008 | TASK-001..004 | `C-CORE`, `C-APP`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-009 | AC-XCLI-009-02 | TEST-XCLI-008, 016 | TASK-001..004 | `C-CORE`, `C-APP`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-009 | AC-XCLI-009-03 | TEST-XCLI-008 | TASK-001, 003, 004 | `C-APP`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-009 | AC-XCLI-009-04 | TEST-XCLI-008, 016 | TASK-001..004 | `C-CORE`, `C-APP`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-010 | AC-XCLI-010-01 | TEST-XCLI-004, 008, 010 | TASK-001..004 | `C-CORE`, `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-010 | AC-XCLI-010-02 | TEST-XCLI-004, 008, 015 | TASK-001..004 | `C-CORE`, `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-010 | AC-XCLI-010-03 | TEST-XCLI-008, 016 | TASK-001..004 | `C-CORE`, `C-APP`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-011 | AC-XCLI-011-01 | TEST-XCLI-002, 005, 010, 013 | TASK-001..003, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-ARTIFACT` | `R-T009` |
| REQ-XCLI-011 | AC-XCLI-011-02 | TEST-XCLI-005, 017 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-011 | AC-XCLI-011-03 | TEST-XCLI-002, 005 | TASK-001..003, 006 | `C-CORE`, `C-APP` | `R-T008` |
| REQ-XCLI-012 | AC-XCLI-012-01 | TEST-XCLI-002, 010, 013, 018 | TASK-001..003, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-ARTIFACT`, `C-CLI` | `R-T009` |
| REQ-XCLI-012 | AC-XCLI-012-02 | TEST-XCLI-005, 010, 017, 018 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-012 | AC-XCLI-012-03 | TEST-XCLI-005, 018 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-013 | AC-XCLI-013-01 | TEST-XCLI-008, 015 | TASK-001, 003..006 | `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-013 | AC-XCLI-013-02 | TEST-XCLI-006, 015 | TASK-001, 003..006 | `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-013 | AC-XCLI-013-03 | TEST-XCLI-006, 007, 015 | TASK-001, 003..006 | `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-013 | AC-XCLI-013-04 | TEST-XCLI-008, 015, 016 | TASK-001, 003..006 | `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT`, `C-CLI` | `R-T008` |
| REQ-XCLI-014 | AC-XCLI-014-01 | TEST-XCLI-011, 014 | TASK-001, 003, 005, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT`, `C-CLI`, `C-PROFILE` | `R-T009` |
| REQ-XCLI-014 | AC-XCLI-014-02 | TEST-XCLI-011, 014 | TASK-001, 003, 005, 006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT`, `C-CLI`, `C-PROFILE` | `R-T009` |
| REQ-XCLI-014 | AC-XCLI-014-03 | TEST-XCLI-014, 020 | TASK-001, 003, 005, 006, 008..010 | `C-CORE`, `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT`, `C-CLI`, `C-PROFILE` | `R-T008` |
| REQ-XCLI-015 | AC-XCLI-015-01 | TEST-XCLI-005, 010, 011, 013, 017 | TASK-001..006, 009 | `C-CORE`, `C-APP`, `C-PI`, `C-ANALYTICS`, `C-ARTIFACT` | `R-T009` |
| REQ-XCLI-015 | AC-XCLI-015-02 | TEST-XCLI-010, 017 | TASK-001..004, 006 | `C-CORE`, `C-APP`, `C-ANALYTICS`, `C-ARTIFACT` | `R-T008` |
| REQ-XCLI-016 | AC-XCLI-016-01 | TEST-XCLI-013, 019, 021, 022 | TASK-001..010 | `C-STACK`, `C-PROFILE`, `C-CLI`, `C-PI`, `C-FIXTURE` | `R-T009` |
| REQ-XCLI-016 | AC-XCLI-016-02 | TEST-XCLI-004, 008, 019 | TASK-001..004, 006, 008, 010 | `C-CORE`, `C-APP`, `C-ARTIFACT`, `C-PROFILE` | `R-T008` |
| REQ-XCLI-016 | AC-XCLI-016-03 | TEST-XCLI-008, 019 | TASK-001, 004, 006, 008, 010 | `C-APP`, `C-ARTIFACT`, `C-PROFILE` | `R-T008` |
| REQ-XCLI-016 | AC-XCLI-016-04 | TEST-XCLI-020, 022 | TASK-001, 006, 008, 010 | `C-CLI`, `C-PROFILE`, `C-STACK` | `R-T008` |

## Planned Test-to-Task Ownership

| Planned test | Authoring task | Principal production task(s) | Evidence task(s) |
|---|---|---|---|
| TEST-XCLI-001..005 | TASK-001 | TASK-002, 003 | TASK-008, 010 |
| TEST-XCLI-006 | TASK-001 | TASK-003, 005 | TASK-008..010 |
| TEST-XCLI-007 | TASK-001 | TASK-003, 004 | TASK-008, 010 |
| TEST-XCLI-008 | TASK-001 | TASK-003, 004 | TASK-008, 010 |
| TEST-XCLI-009..010 | TASK-001 | TASK-003..006 | TASK-008, 010 |
| TEST-XCLI-011 | TASK-001 | TASK-005, 007 | TASK-008..010 |
| TEST-XCLI-012 | TASK-001 | TASK-004, 007 | TASK-008, 010 |
| TEST-XCLI-013 | TASK-001 | TASK-002..007 | TASK-009, 010 |
| TEST-XCLI-014..018 | TASK-001 | TASK-002..006 | TASK-008..010 |
| TEST-XCLI-019..020 | TASK-001 | TASK-002..006 | TASK-008, 010 |
| TEST-XCLI-021 | TASK-001 | TASK-005, 007 | TASK-008, 010 |
| TEST-XCLI-022 | TASK-001 | TASK-002..007 | TASK-008, 010 |

## Runtime Product Traceability Target

For the accepted run, the required product chain is:

```text
member-orders-v1 fixture identity and bytes
  -> confirmed Analysis Contract and inclusive windows
  -> Q-001 canonical window-local repurchase SQL + O-001 exact-rational result
  -> S-001 canonical Python standard-library validation + O-002 independent exact-rational result
  -> E-* Evidence Items
  -> F-001 supported synthetic Finding
  -> summary.md and evidence.md projections
```

The chain ends at a Finding. There is intentionally no `Decision -> authorization -> Action -> Outcome` continuation in this Change.

## Acceptance Blockers Encoded by This Matrix

Acceptance remains blocked if any row lacks an executable test, any test lacks an approved AC, code lacks an approved Task/path, an AC is not verified, a Port suite is not run unchanged against its concrete Adapter, deterministic evidence disagrees with a narrative claim, or independent evidence contradicts the claimed result.

## TASK-009 R4 Staged Gate Status — 2026-08-21

- `AC-XCLI-007-04` and the model/provenance portion of `AC-XCLI-007-06` have
  focused Phase A RED with a healthy `250/250` unit baseline.
- `R4-AC-003-01` and `R4-AC-003-02` have focused dynamic-template RED.
- `AC-XCLI-007-05`, the parser/stream portion of `AC-XCLI-007-06`, and
  `R4-AC-004-01` have executable M3-only tests but remain causally masked by the
  old production model guard. They are not yet TDD_READY.
- Worker Phase A is restricted by `worker-task-009-r4-phase-a.md`; Phase B,
  real TEST-XCLI-013, independent verification, acceptance, and archive remain
  pending.

Phase A is now GREEN for `AC-XCLI-007-04`, dynamic-template
`R4-AC-003-01/02`, Application provenance, and the positive model/tool identity
portion of `AC-XCLI-007-06`. The existing M3-only TEST-XCLI-006 group now gives
focused `AC-XCLI-007-05` / `R4-AC-002-01/02` RED for exactly leading-think
acceptance plus top-level and nested duplicate-member rejection. Phase B is
restricted to the Adapter parser by `worker-task-009-r4-phase-b.md`.

Corrected Phase B is GREEN for the complete closed transport matrix, including
the added repeated/nested think rejection. `R4-AC-001-03` now has focused Phase
C RED in three existing TEST-XCLI-006 leaves for missing terminal message,
missing finish reason, and non-stop terminal mapping. Only that Adapter
classification work is released by `worker-task-009-r4-phase-c.md`.

TASK-009 R4 is now GREEN through the real provider path. The final embedded Pi
Adapter projects raw user/toolResult messages away while retaining only the
closed assistant/tool/lifecycle event union; deterministic failure and tool
policy matrices remain unchanged. Real TEST-XCLI-013 passed `1/1` against the
canonical synthetic fixture and exact `minimax-cn/MiniMax-M3`, covering the
complete source -> confirmed contract -> Q/S/O assets -> Evidence -> Finding ->
Markdown chain. `R-T009-R4` is therefore executable real evidence rather than a
readiness placeholder. TASK-010 independent verification is the only remaining
acceptance gate.

TASK-010 remediation R3 Phase B2d-A now has a causal Application RED for the
shared Artifact cancellation signal. The test-owned Artifact contract requires
one live same-identity `AbortSignal` on all five mutators and no signal on
`readTerminalRun`; helper health is `1/1` PASS while the focused Application
leaf is `0/1` because production omits the signal at the first `beginRun`
admission. Only the Application signal propagation slice is TDD_READY; active
deadline behavior, concrete Adapter enforcement, Profile composition, and
independent verification remain pending.

The Phase B2d-A Application slice is now GREEN at SHA-256
`767640748473849b6825563eb2dc5ef8e4558503b64c533a179780609320310c`;
Controller reproduced the shared-signal leaf at `1/1`. This verifies signal
identity and propagation only. Scheduler expiry remains a no-op, so pending
work, timeout victory, cancellation races, cleanup, and late-result exclusion
remain Test-locked.

TASK-010 remediation R3 Phase B2d-B now has a complete active-deadline causal
RED at integration SHA-256
`4da60611e16e6abb9de5e451dbbed7bfc0f7136773e321cbd19d9ea19cd4a58a`.
The frozen matrix is `0/12` with zero cancelled/hanging tests and maps
`AC-XCLI-013-01/02` to Runtime, native tool, SQL/Python, every Artifact
publication kind, both user-cancel orderings, late-result exclusion, and
one-shot scheduler cleanup. The Application-only active-deadline slice is
TDD_READY; concrete Adapter atomicity/enforcement and Profile timer composition
remain pending.

Phase B2d-B Application is now GREEN at SHA-256
`7437962e43b00a573b28acca4b49c4e804ecfb5497271b3112039d44e6625a8a`:
Controller reproduced all twelve active-deadline leaves plus the B2d-A/B2c
regressions. Test-only migration removed eight superseded legacy event/cancel
assumptions without weakening execution or publication assertions. The frozen
integration suite is `200/203`; its three failures form the Phase B2e Profile
scheduler causal RED. Profile-only timer composition is TDD_READY, while the
three concrete Adapter R3 contracts remain locked for the following phase.

Phase B2e is GREEN at Profile SHA-256
`b03af9d409fdf579cfe4ed48ba10b21229905c1cf95815cf22693503c01f8bb2`.
The timer quality leaf and all twelve Application deadline leaves pass. Public
Profile composition now reaches the first concrete Adapter contract and fails
because Pi lacks `preflightModel`; this releases no Adapter code, but provides
the next Test-owned causal boundary.

TASK-010 remediation R3 Phase B3a is TDD_READY for the Pi Adapter at frozen
contract/integration/helper SHA-256 values
`2225f6ec88d3137e148d276e00973d76130593f0d16737582ed0222e6d5e460e`,
`f263c656c06df081fbe1cd6835db0d07537cd1db94fb831aaa33eb6d97227f5b`,
and `afc9905402279aba6a075fc9cfc9850732775a7c3d77686ad10ecaaad64622aa`.
Controller reproduced `2/20` PASS and `18/20` expected RED: all failures are
caused by the unchanged concrete Adapter lacking `preflightModel`, including
the production-default local-SDK no-prompt leaf. This maps R3-REQ-004 to
TEST-XCLI-006 deterministic actual-state/mismatch evidence and TEST-XCLI-011
local-only cached-runtime/single-Session evidence. Only the Pi Adapter is
released for implementation; the other concrete Adapter phases remain locked.

Phase B3a Pi is GREEN at Adapter SHA-256
`42740306d7764f4f3d2017b0b446d338336102d6e0ab2ac514e4a6303e56a6f2`.
After migrating the R3-superseded empty-directory assertions, Controller
reproduced TEST-XCLI-006/011 focused `20/20`, full contract `195/197`, and full
integration `201/203` under Node `v26.0.0` and npm `11.12.1`. The two remaining
failures are the exact concrete analytics/storage Port-shape boundaries and
release no Pi work. R3-REQ-004 therefore has deterministic and production-
default local-SDK GREEN evidence; analytics preflight/atomic cancellation is
the next independent Test slice.

TASK-010 remediation R3 Phase B3b analytics is TDD_READY at contract/helper/
integration SHA-256 values
`3134b696f9ae5fee466cd3a22a17190dfe2f9c841a87195e4def1eb35bcbbe5e`,
`70260713384c9f809d82105fe98cc76c5c83d4f6b26243801e1d921c810ebb45`,
and `029ac1bbad81c7363d6f4767633e078309ae3344c6b19563db7bea21d0fa6097`.
Controller reproduced `0/21` focused RED, all caused by the unchanged concrete
Adapter lacking `preflightApprovedFixture`. This maps R3-REQ-001 to real
closed identity/read-time/failure/SOURCE_CHANGED evidence and retains the
existing already-aborted analytical-call evidence for R3-REQ-003. Only the
analytics Adapter is released; storage remains the next locked phase.

Phase B3b analytics is GREEN at Adapter SHA-256
`6dffebc4645344c7bf5c992b5cd044caeb3e9918b24cdfd393771699f0772454`.
Controller reproduced the 21 real preflight/source-recheck leaves, the shared
real Local Analysis contract within full contract `196/197`, and full
integration `222/224`. The one contract and two integration failures are all
the concrete storage Adapter's missing `preflightRunRoot`; analytics is frozen
with R3-REQ-001/003 executable evidence and storage is the next Test slice.

TASK-010 remediation R3 Phase B3c storage is TDD_READY at contract/helper/
integration SHA-256 values
`f9e11e7989fd89026f91a42ca8e71eaeefdd762554d5f3661e8d0fcbbda80fca`,
`d542f96fc4f8ad23b6905fb9448c6a955079ae8355e3a4618ade356de18d93d0`,
and `d3813a98a45d6b40461a417f48246c75af6dd9fd58d93f426d8de015d4afb497`.
Controller reproduced the exact focused `3/12` PASS and `9/12` causal RED,
helper health `1/1`, full contract `195/198`, and full integration `198/232`.
The failures are confined to the unchanged concrete Storage Adapter's missing
preflight, mandatory signal, and resulting Profile Port boundary. This maps
R3-REQ-002/003 to physical-root revalidation, five already-aborted
zero-mutation write units, complete run admission, and success-last
publication evidence. Only the Storage Adapter is released for implementation.

Controller rejected the first B3c candidate after proving that the test title's
`replaced` root case had not actually been executed. The configured Test role
added the missing same-path/new-directory branch at integration SHA-256
`fd22ebe939ccf621b80a81ed313589c169a8e1f2e40dffb3e19dd6e6182d7ca1`.
Controller reproduced focused `11/12` and integration `231/232`, with the sole
RED being acceptance of a changed physical root identity; contract remains
`198/198` and helper health `1/1`. R3-REQ-001 root replacement is now causally
executable and releases only a same-file Storage Worker correction.

Phase B3c final Storage is GREEN at SHA-256
`0884f8e974c4e4c4fe78b3db036345b273b654e93592df61217fca4b46c99a0f`.
The corrected physical-root identity leaf and all signal/atomic-publication
leaves pass within contract `198/198` and integration `232/232`, completing
R3-REQ-001/003 concrete Adapter evidence.

TASK-010 final deterministic regression is unit `250/250`, contract `198/198`,
integration `232/232`, and default E2E `131` PASS plus the sole gated real leaf
skip. The configured Test role migrated the stale deterministic E2E
Application constructor to the R3 scheduler dependency without production
change; final E2E SHA-256 is
`e6f8d0ccb294fdeff280edaef52da4c7dcaacf141806e3f1c632daf4df25cfb1`.
All 22 `.mjs` syntax checks and the frozen stack/fixture checks pass.

Real TEST-XCLI-013 evidence is mixed but explicit: the first post-R3 formal M3
run returned one closed failed result; a bounded sanitized identical-path
diagnostic then succeeded, and a formal gated repetition passed `1/1` against
exact `minimax-cn/MiniMax-M3`. There was no fallback or hidden product retry.
R3-REQ-004 has actual-model succeeded evidence while the initial transient
failure remains a disclosed reliability observation. Implementation and
evidence are frozen for independent Validator judgment; acceptance and archive
remain locked.

Independent Validator verdict is FAIL despite reproducing the complete frozen
test/hash/toolchain baseline. Three missing causal rows return to Test Design:
user cancellation during pending Artifact admission (R3-REQ-002/003),
post-confirm fixture deletion -> `SOURCE_CHANGED` (R3-REQ-001), and Pi runtime
initialization failure -> `RUNTIME_UNAVAILABLE` distinct from model absence
(R3-REQ-001/004). The real M3 failure/success sequence is a disclosed but
non-blocking residual risk under the current no-threshold specification.
Acceptance/archive remain locked pending corrected RED, minimum GREEN, full
regression, formal M3 evidence, and a fresh independent Validator PASS.

Validator-FAIL Test correction adds executable real-path rows for
post-confirm deletion and Pi import/create/refresh/model selection plus four
user-cancel/Artifact windows. Controller reproduced the new group at `3/10`
PASS and `7` causal RED; full integration is `235/242`, while all non-target
suites remain GREEN under the frozen PATH. Analytics deletion and Pi runtime
classification are independently TDD_READY. The Application branch remains
NOT_TDD_READY because R3 does not yet uniquely order user cancellation against
an already-issued, still-live `commitSuccess`; configured Spec clarification
must precede its Worker.

Validator-FAIL Analytics and Pi remediation is GREEN. Analytics SHA
`72ccea9268c338dd586aae3c5e9b552476a4911071effc799e12cf5ea8fffdd3`
passes preflight-missing/replacement/deletion `3/3`; Pi SHA
`b2b6ebfd98f0773beadcf0663ad5f78854a739b791231d36a87db7f6f71648af`
passes all five production-default failure classifications. Contract is
`198/198` and integration is `240/242`; only the two Application cancellation
race leaves remain RED.

Configured Spec analysis at
`spec-task-010-r3-user-cancellation-linearization-decision.md` concludes that
pending beginRun/contract/asset behavior is derivable, but the terminal winner
for user cancel versus already-admitted still-live `commitSuccess` requires an
explicit product decision. Option A success-linearization-wins is recommended;
Option B user-cancel-wins needs a newly specified Adapter ordering mechanism.
Application Test/Worker, final regression, real M3, Validator, acceptance, and
archive were locked pending that decision.

The user approved `XCLI-TASK010-CANCEL-LINEARIZATION-001`, Option A. The sole
normative clarification candidate is
`spec-task-010-validator-remediation-r3-cancel-linearization-001.md`; the
earlier decision document is provenance only. It maps R3-REQ-002/003 to
existing AC-XCLI-013-01/02 and TEST-XCLI-017: issued begin/contract/asset work
settles before one cancelled terminal; an issued `commitSuccess` settles
without a concurrent cancelled write, then success wins if its final manifest
linearized or cancellation wins if it did not; deadline always yields TIMEOUT
with no new terminal. Application is Test-locked pending Controller Spec Gate
and corrected causal RED; after TDD_READY only the Application path is
eligible for a Worker.

Controller Spec Gate PASS freezes the clarification at SHA-256
`4c7b5cb1b7c6ef6a60267697002444af9fd793a7a040fd3136807ef343a6ecfa`
and its decision provenance at SHA-256
`e6f6c4c86f96df2f6ba0a0654fee29063745b3c5364ec21b5e1a5c7572650e15`.
TEST-XCLI-017 is released only to the configured Test role for the two
deterministic pending-`commitSuccess` branches plus the retained pending
begin/contract/asset and deadline cases. Application production remains locked
until Controller-verified causal RED and TDD_READY.

TEST-XCLI-017 correction is frozen at integration SHA-256
`28199f7d91f034e7f3506d0eb168e6e700a5bbc840a6c29d9405986b02827f0b`.
Controller reproduced focused `3/5` with two causal RED, retained deadline
`5/5`, Analytics/Pi `7/7`, and full integration `241/243` under Node `v26.0.0`
and npm `11.12.1`. The only RED are pending-begin confirmation convergence and
success-linearized pending-`commitSuccess` convergence. This establishes
TDD_READY for R3-REQ-002/003 and AC-XCLI-013-01/02; only
`packages/application/local-analysis.mjs` is released for minimum production
correction, with the test hash and all other production paths frozen.

Application is GREEN at SHA-256
`b9a03a4f5cddc2c835ebeac0ad5b9dc27beeecf93a02aca5de17f45c4bd45fc5`:
TEST-XCLI-017 is `5/5`, retained deadline coverage is `5/5`, full integration
is `243/243`, and unit/contract/default-E2E are `250/250`, `198/198`, and
`131` PASS plus the one gated skip. A post-GREEN formal exact MiniMax-M3 run
passed `1/1` in approximately 12.6 seconds without fallback or product retry.
The clarification, Test, production, deterministic matrix, toolchain, and real
model evidence are frozen for a fresh independent read-only Validator;
acceptance and archive remain locked.

Fresh independent validation is PASS. The Validator matched all 12 frozen
critical hashes and reproduced TEST-XCLI-017 `5/5`, deadline `5/5`, Analytics
deletion plus all five Pi classification leaves, unit `250/250`, contract
`198/198`, integration `243/243`, default E2E `131` PASS plus one gated skip,
and all 25 `.mjs` syntax checks without a provider/network call. No material
scope, contract, architecture, security, or evidence defect remains.

Controller accepts TASK-010 and the complete Change. Option A is merged into
the current `local-analysis` baseline under AC-XCLI-013-02/03. The historical
single closed M3 failure remains disclosed as non-blocking stochastic evidence;
the final post-GREEN formal run passed and the approved contract has no rate or
consecutive-pass threshold. Acceptance unlocks baseline publication and archive
only; it does not authorize new product behavior or the later TypeScript
migration implementation.

Archive is complete: the accepted current baseline is
`openspec/specs/local-analysis/spec.md` at SHA-256
`e7a484c030455a0e1244d3af0b948f98a66bd44d1d1918c017171c7f69f9a2b6`,
byte-identical to the final capability spec. Full Change history is preserved
under
`openspec/changes/archive/2026-08-21-xanthil-cli-local-analysis-slice/`.
