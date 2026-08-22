# Tasks

## Gate Order

Spec correction -> mandatory `ponytail-review` -> Spec deletes findings -> Controller re-Gate -> Test role and healthy expected RED/type health -> TDD_READY -> Worker -> GREEN and regression -> frozen evidence -> fresh Validator -> acceptance -> merge current delta/archive.

## TASK-001 — Freeze the Decision Package

- Owner: Spec role
- Maps: `REQ-XTS-001` through `REQ-XTS-005`
- Write set: this Change directory only
- Result: one internally consistent package, including Correction 001 type-interface ownership, with no open load-bearing decision

## TASK-002 — Mandatory Simplicity Review and Spec Gate

- Owner: Controller, with `ponytail-review` on the complete corrected package; findings return to Spec
- Maps: every Requirement/design mechanism/test asset to the current objective and consumer
- Exit: unnecessary mechanisms deleted; Controller records Spec Gate PASS or returns a decision blocker
- Constraint: this task does not itself approve implementation

## TASK-003 — Migrate Test Ownership and Establish RED

- Owner: `juaner_test`, dispatched only after Spec Gate
- Maps: all migration ACs; focused causal leaves are existing `TEST-XCLI-021`, `TEST-XCLI-022`, and `CVR-TEST-001` through `CVR-TEST-004`
- Allowed: 13 test/helper one-for-one renames in `exploration.md`; `tools/harness/validation/run.test.mjs`
- Forbidden: production, `package.json`, lock, `tsconfig.json`, runner implementation, CSV, current spec/archive, project-control
- Required result: helper/environment health GREEN; production and toolchain frozen at `a0ab053`; focused test fails because the approved TypeScript/toolchain contract is absent; isolated scratch compilation against mechanical copies of the real production modules, with `@ts-nocheck` only on those scratch production copies, eliminates diagnostics attributable to tests without creating a second contract; exact hashes/commands/counts and Worker write set frozen

## TASK-004 — Perform the Minimum Production Cutover

- Owner: `juaner_worker`, dispatched only after TDD_READY
- Maps: `REQ-XTS-001`, `REQ-XTS-002`, `REQ-XTS-003`, `REQ-XTS-004`
- Allowed: eight production one-for-one renames; `package.json`; `package-lock.json`; new `tsconfig.json`; `tools/harness/validation/run`
- Forbidden: all tests/helpers, CSV, current spec/archive, project-control, all other product/docs, generated/build output, Git
- Required result: native `.ts` production with Product Core/Port/Application owning shared interfaces and Adapter/Profile/CLI types module-local unless a current type import consumes an export; final strict 21-file no-emit typecheck, exact packages/config/runner, no behavior change, and no test weakening or business-type widening for negative fixtures

## TASK-005 — GREEN and Regression Evidence

- Owner: Controller reviews Worker evidence; no contract authority transfers to Worker
- Maps: all Requirements and ACs
- Commands: focused migration leaves, `npm run typecheck`, all four Xanthil layers, canonical runner, and separate runner self-test
- Evidence: stable Xanthil TEST/AC identity sets; unchanged business assertions and counts; public runtime export parity; Adapter contracts; no Xanthil `.mjs`; no build artifacts; no model call; scope diff limited to allowed paths

## TASK-006 — Independent Verification

- Owner: fresh `juaner_validator`, read-only
- Start: implementation and evidence frozen
- Maps: all Requirements and ACs
- Required verdict: PASS, FAIL, or BLOCKED with independently executed evidence; Validator does not implement or approve

## TASK-007 — Acceptance and Archive

- Owner: Controller
- Start: fresh Validator PASS or explicit authorized waiver
- Result: record acceptance, merge the smallest migration delta into the current capability spec, archive the Change, and verify read-model/project-board/archive consistency
