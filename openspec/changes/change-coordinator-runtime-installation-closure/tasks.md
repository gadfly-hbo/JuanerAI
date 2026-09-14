# Tasks: Change Coordinator Runtime Installation Closure

## Status and Fixed Order

- Current: `SPEC_READY / CONTROLLER_SPEC_GATE_PENDING`
- Sequence: complete Spec review/ponytail/Gate -> isolated Test Design/health/
  RED -> TDD_READY -> minimum Worker -> source/GREEN -> applicable regression/
  Retirement -> fresh Validator/Controller -> original M3 package preparation.

## 1. Specification Gate

- [ ] `TASK-RIC-001` — Controller reviews all seven files against R243/R245,
  canonical `AC-MA-003-02`, `AC-MA-007-04/05`, archived Install/Backup/Rollback,
  and the two future path boundaries.
- [ ] `TASK-RIC-002` — Controller runs `ponytail-review` over the complete
  OpenSpec diff and returns any nonessential mechanism to Spec for deletion.
- [ ] `TASK-RIC-003` — Controller records Spec Gate PASS or one complete bounded
  clarification. No downstream role starts before PASS.

## 2. Test Design and RED

- [ ] `TASK-RIC-010` — Fresh isolated Test role freezes preimages, exact local
  write regions, leaf IDs/selectors, Node command/environment, budget, ordered
  expectations, and lifecycle ledger in the one allowed Test file.
- [ ] `TASK-RIC-011` — Prove helper/source/module-load health with production
  frozen; realize the required `RED-RIC-001/002` intent frontiers as the Test-
  frozen actual leaves/causes, without predeclaring a count or forcing controls.
- [ ] `TASK-RIC-012` — Controller validates RED causality, complete positive/
  negative/boundary/failure intent mapping, protected controls, and the single
  production Worker path; then records TDD_READY or returns to Test Design.

## 3. Minimum Production Change

- [ ] `TASK-RIC-020` — Worker changes only
  `tools/harness/change-coordinator/install-host-loop`: exact new5 source,
  exact `ABSENT|old4|new5` predecessor classification, existing-manifest backup
  source/name/actual-byte validation, and exact runtime restore.
- [ ] `TASK-RIC-021` — Controller performs full source/contract/protected-scope
  review. Any public/schema/non-runtime/second-path change blocks and returns.

## 4. GREEN, Regression, and Retirement

- [ ] `TASK-RIC-030` — Run the frozen RED leaves and exact INSTALL001/002
  selector for GREEN with complete inner/outer logs and exit/signal evidence.
- [ ] `TASK-RIC-031` — Run complete ordinary Mode Activation excluding the
  previously proven real-hour leaf, preserving A2 dispositions; run any
  actual-diff-required connection check.
- [ ] `TASK-RIC-032` — Run canonical validation and scoped diff checks using the
  Test-frozen exact commands. Record actual counts only after execution.
- [ ] `TASK-RIC-033` — Reconcile the Test Asset Lifecycle Ledger, run complete
  test-diff `ponytail-review`, and record Retirement Gate PASS/FAIL.

## 5. Independent Verification and Return

- [ ] `TASK-RIC-040` — Freeze all seven specs, production/Test bytes, command
  environment, raw logs, results, scope inventory, and residual host items.
- [ ] `TASK-RIC-041` — Dispatch a fresh read-only/R2-equivalent Validator over
  the frozen package and record its verdict; Controller decides local acceptance.
- [ ] `TASK-RIC-042` — On acceptance, return immediately to original M3 exact
  deployment-package preparation, then A4 local deliverables/M4 conditional
  material. Do not infer integration SHA, host readiness, or Desktop authority.

## 6. Ownership and Stop Conditions

- Spec writes only this seven-file package.
- Test writes only `mode-activation.test.mjs` within frozen regions.
- Worker writes only `install-host-loop`; it does not edit Test or Spec.
- Validator is independent and read-only.

Stop for Controller on any new contract/schema/field, error vocabulary, target,
public export, dependency, permission, retry/recovery/atomicity promise, another
write path, real host/provider/network action, Git write, or contradictory
evidence. No task checkbox may be marked from a document claim.
