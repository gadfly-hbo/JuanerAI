# Traceability

## Migration Delta

| Requirement / AC | Executable evidence | Task | Intended code/result |
|---|---|---|---|
| REQ-XTS-001 / AC-XTS-001-01 | `TEST-XCLI-022`; no-Xanthil-`.mjs` scan | TASK-003, TASK-004, TASK-005 | 21 one-for-one `.ts` paths; old paths absent |
| AC-XTS-001-02 | native syntax phase; all four test layers | TASK-003, TASK-004, TASK-005 | explicit `.ts` specifiers; Node direct execution |
| AC-XTS-001-03 | namespace/type-import scan; Contract/Integration/E2E | TASK-003, TASK-004, TASK-005 | exact runtime exports and Port methods unchanged; leaf type exports have a current consumer |
| AC-XTS-001-04 | repository artifact/config scan | TASK-005, TASK-006 | no bridge, loader, emit, or build artifact |
| REQ-XTS-002 / AC-XTS-002-01 | `TEST-XCLI-021`; runner dependency checks | TASK-003, TASK-004, TASK-005 | exact manifest shape and versions |
| AC-XTS-002-02 | `TEST-XCLI-021`; runner installed-version checks | TASK-003, TASK-004, TASK-005 | npm v3 lock mirrors exact dependencies/dev dependencies |
| AC-XTS-002-03 | `TEST-XCLI-021`; `npm run typecheck` | TASK-003, TASK-004, TASK-005 | one exact strict/no-emit `tsconfig.json` |
| AC-XTS-002-04 | syntax and typecheck commands | TASK-004, TASK-005 | Node-erasable syntax and exit-0 strict check, no output |
| REQ-XTS-003 / AC-XTS-003-01 | coverage-map test; identity extraction | TASK-003, TASK-005 | exact `TEST-XCLI-001..022` and current AC identities |
| AC-XTS-003-02 | Unit/Contract/Integration/E2E baseline matrix | TASK-003, TASK-005, TASK-006 | unchanged assertions and counts except approved mechanics leaves |
| AC-XTS-003-03 | Contract suites and runtime negative leaves | TASK-003, TASK-005, TASK-006 | static types do not replace runtime validation |
| AC-XTS-003-04 | import/type scan plus typecheck | TASK-004, TASK-005, TASK-006 | Pi SDK types confined to Pi Adapter |
| AC-XTS-003-05 | isolated copied-production test-side type health; negative Contract/Integration leaves; repository source scan | TASK-003, TASK-004, TASK-005, TASK-006 | production-derived test types; one bounded checked helper; no duplicate business types, `any`, repository suppression, or broad cast |
| REQ-XTS-004 / AC-XTS-004-01 | `CVR-TEST-001`; runner observation | TASK-003, TASK-004, TASK-005 | exact canonical order |
| AC-XTS-004-02 | `CVR-TEST-002` and `CVR-TEST-004` | TASK-003, TASK-005 | fail-fast, streamed output, no result artifact |
| AC-XTS-004-03 | `CVR-TEST-003`; E2E gated skip | TASK-003, TASK-005, TASK-006 | real-model gate absent; no provider call |
| AC-XTS-004-04 | `package.json` assertion; runner invocation | TASK-004, TASK-005 | `npm test` is the canonical runner; typecheck remains separate script/phase |
| REQ-XTS-005 / AC-XTS-005-01 | rollback inspection against `a0ab053` | TASK-005, TASK-006 | restore paths/manifest/lock/config/runner only |
| AC-XTS-005-02 | CSV hash, run-root and migration scan | TASK-005, TASK-006 | no data/schema/artifact migration or user-run mutation |

## Reused Product Contract

Every `REQ-XCLI-001..016`, the exact current set of 54 unique accepted `AC-XCLI-*` identities, and `TEST-XCLI-001..022` remains mapped by the current `tests/fixtures/xanthil-local-analysis/coverage-map` after its path-only `.ts` migration. This Change adds no business Requirement or TEST identity and does not duplicate or reinterpret the accepted matrix.
