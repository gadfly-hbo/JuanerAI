# Traceability: Model Pack Contract Enabler

## Requirement / Acceptance / Test / Task Map

The Node v26 paired loader-chain correction passed Spec Gate and Test. The first
bounded Worker candidate passed the existing suite and retirement review, but
fresh independent validation of Head
`c0bdf3a158a81d45131862debc8e2b1a24f076c3` returned FAIL on four already
specified public behaviors and the missing material Test mutations. Formal Test
added five exact leaves, the bounded Worker repaired only the package contract
file, and Controller confirmed remediation GREEN plus Test Asset Retirement
PASS. Current bytes are frozen for a fresh Validator; no acceptance or archive
is claimed.

| Requirement | Acceptance | Planned test/evidence | Task | Candidate code/evidence | Current result |
|---|---|---|---|---|---|
| REQ-MPC-001 | AC-MPC-001-01 | TEST-MPC-001 | TASK-003,006 | exact manifest serialize/admit signatures; malformed release-status shape classification; immutable manifest/revocation policy and package driver | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-02 | TEST-MPC-001 | TASK-003,006 | canonical synchronous serializer/admission; exact closed call object; detached bytes/value; forbidden-effect observer | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-03 | TEST-MPC-001 | TASK-003,006 | exact sanitized error carrier; synchronous contract throw; compatibility/artifact/status mapping | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-04 | TEST-MPC-001 | TASK-003,006 | purpose/permission/runtime manifest admission | GREEN PASS |
| REQ-MPC-001 | AC-MPC-001-05 | TEST-MPC-002 | TASK-003,006 | exact input admission/canonical-byte signatures; precise decimal ordering; Unicode scalar category length | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-06 | TEST-MPC-002 | TASK-003,006 | exact forecast admission and precise interval ordering; Runtime-owned result/provenance boundary | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-07 | TEST-MPC-001 | TASK-003,006 | evaluation metadata/no-data-access proof | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-01 | TEST-MPC-003 | TASK-003,006 | exact release serialize/admit signatures + release bytes/observation/expected binding + closed local-URI verification assertion; real root proof remains P-private | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-02 | TEST-MPC-003 | TASK-003,006 | release-stage/decision gate | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-03 | TEST-MPC-003 | TASK-003,006 | exact Registry/URI plus supplied location-verification shape/kind admission; no path access | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-04 | TEST-MPC-003 | TASK-003,006 | only repeated release bindings and observation URI/SHA/size/Signature comparisons; singleton lower-boundary codes | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-05 | TEST-MPC-003,004 | TASK-003,006 | package fixture and driver; P ownership stop line | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-01 | TEST-MPC-005 | TASK-004,007 | exact binding/predictor factory; invalid runtime/adapter/dependency identity/version and malformed exact-literal permissions reject at construction; four-field preflight; reachable Runtime/dependency comparison plus defensive permission equality with no bypass mutation | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-02 | TEST-MPC-005 | TASK-004,007 | immutable readiness/openRun/snapshot capture | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-03 | TEST-MPC-005,007 | TASK-004,007 | exact predictor request/same signal and deadline; one-shot predict; Runtime-owned result/provenance | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-04 | TEST-MPC-006 | TASK-004,007 | native mock timers + AbortController + externally ordered atomic terminal outcomes | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-05 | TEST-MPC-006,007 | TASK-004,007 | arbitrary rejection sanitization; invalid unknown fulfillment; late settlement | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-06 | TEST-MPC-007 | TASK-004,007 | separate-Run deterministic comparison | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-07 | TEST-MPC-005,007 | TASK-004,007 | closed Port/result and forbidden-effect evidence | GREEN PASS |
| REQ-MPC-004 | AC-MPC-004-01 | TEST-MPC-004 | TASK-003 | package driver/double health | GREEN PASS |
| REQ-MPC-004 | AC-MPC-004-02 | TEST-MPC-008 | TASK-004 | exact Runtime harness/driver via public predictor seam; double health | GREEN PASS |
| REQ-MPC-004 | AC-MPC-004-03 | TEST-MPC-001..009 | TASK-003,004 | exact signature/error-delivery leaves including all five Validator counterexamples; E contract 292/292 | REMEDIATION GREEN |
| REQ-MPC-004 | AC-MPC-004-04 | TEST-MPC-004,008 | TASK-003,004,011 | shared drivers plus Controller/Validator ownership review | DRIVER/OWNERSHIP PASS |
| REQ-MPC-004 | AC-MPC-004-05 | Controller TDD_READY evidence | TASK-005 | historical TDD_READY plus corrected remediation causal RED and one-file Worker freeze | REMEDIATION TDD_READY PASS |
| REQ-MPC-004 | AC-MPC-004-06 | Controller retirement Gate | TASK-004,010 | five new leaves retained as permanent distinct regressions; ledger/scans clean; fresh ponytail lean | REMEDIATION RETIREMENT PASS |
| REQ-MPC-005 | AC-MPC-005-01 | TEST-MPC-009 + TEST-XCLI-021 affected existing regression | TASK-004,008,009 | inactive integration plus completed, byte-frozen exact eight-entry mirrored `approvedTsconfig.files` append; every other Xanthil assertion/current behavior preserved | GREEN PASS |
| REQ-MPC-005 | AC-MPC-005-02 | TEST-MPC-009 | TASK-004,006,007 | inert import/build/driver composition; exact Node loader paired source-read chains classified as toolchain mechanics, every other filesystem/product effect forbidden | GREEN PASS |
| REQ-MPC-005 | AC-MPC-005-03 | TEST-MPC-009 + Validator review | TASK-004,011,012 | no active binding in E; activation stop line | GREEN PASS; FRESH VALIDATOR PENDING |
| REQ-MPC-005 | AC-MPC-005-04 | TEST-MPC-001,005,007,009 | TASK-003,004,011 | supplied revoked-status block, retained admitted evidence, rollback review | GREEN PASS; FRESH VALIDATOR PENDING |
| REQ-MPC-005 | AC-MPC-005-05 | Controller/Validator evidence | TASK-011,012 | scope/ownership/integration-order review | FRESH VALIDATOR PENDING |

## Test Asset Ownership

| Asset group | Initial owner | Later unchanged consumer | Retirement expectation |
|---|---|---|---|
| package contract test and driver | Controller/Test Agent | P Provider real-SDK conformance; Validator | permanent while MP-C01/02 active |
| Runtime contract test and driver | Controller/Test Agent | C Consumer Adapter conformance; later eligible same-semantics Adapter; Validator | permanent while MP-C03 active |
| canonical fixtures/doubles | Controller/Test Agent | both E driver-health suites and future implementation wrappers | retain only with named consumer |
| controlled settlement helper | Controller/Test Agent | Runtime race/late-settlement regressions | permanent while concurrency contract active |
| inactive integration test | Controller/Test Agent | E regression, C/A pre-activation checks, Validator | permanent while inactive-by-default contract active |
| existing Local Analysis integration test / `TEST-XCLI-021` | Xanthil baseline; conditionally Test Agent for exact E list append only | existing Xanthil regression and Validator | preserve identity/file; E adds no helper or new Test and owns no other assertion |

## Task Coverage

| Task | Requirement/Test coverage | Gate result expected |
|---|---|---|
| TASK-001 | REQ-MPC-001..005 R2 decision package | complete; current Controller Spec Gate PASS |
| TASK-002 | every REQ/AC/design mechanism | fresh complete-diff ponytail `Lean already. Ship.` and Controller PASS |
| TASK-003 | TEST-MPC-001..004 | remediation complete; five exact package Test leaves added, all prior coverage preserved |
| TASK-004 | TEST-MPC-005..009 plus existing frozen TEST-XCLI-021 | complete; inactive 15/15 and seven causal production leaves frozen |
| TASK-005 | all tests and exact Worker scope | remediation TDD_READY PASS; one production file released |
| TASK-006 | REQ-MPC-001, 002, 005 | remediation complete and GREEN; package contract frozen |
| TASK-007 | REQ-MPC-003, 005 | complete and GREEN; Runtime file frozen |
| TASK-008 | REQ-MPC-004, 005 | exact graph integration complete and frozen |
| TASK-009 | TEST-MPC-001..009 and affected baseline | remediation GREEN/regression PASS; canonical exit 0 |
| TASK-010 | every changed test asset | remediation Retirement PASS; final `Lean already. Ship.` |
| TASK-011 | all Requirements, ACs, tests, code, scope, evidence | first frozen Head FAIL; fresh recheck ready on remediation candidate |
| TASK-012 | all accepted evidence and E integration constraint | acceptance and archive |

## Integration Trace

| Node | Consumes | May write | Must not claim |
|---|---|---|---|
| E | frozen product plan/attachments | shared contracts, Port, docs, shared suites, exact conditional graph | SDK, real inference, Xanthil consumption, activation |
| H | E-merged main but product-independent | approved current Xanthil hypothesis-first paths | Model Pack completion |
| P | E contracts/package driver read-only; H-merged main before merge | Provider/SDK/Builder/independent Consumer private paths | shared-contract authority, Xanthil consumption, product activation |
| C | E Runtime driver read-only; H/P integrated main for final evidence | Xanthil Consumer private paths | final GREEN from double; active Profile |
| A | exact E/H/P/C integrated identities | only approved activation/integration/rollback paths | contract/threshold/data/Provider/Consumer rewrite |

Strict merge order is E -> H -> P -> C -> A. A Head, Pack, Runtime, Adapter, Profile, and evidence must be exact; historical or double-only evidence cannot substitute.

## Evidence Integrity Rules

- `verification.md` is the current read model. Historical RED/GREEN/repair attempts must be appended or linked without rewriting prior facts.
- The recorded TDD_READY hashes/counts remain historical evidence. The exact
  post-GREEN Test Asset Retirement hashes/counts are frozen separately in
  `test-plan.md`; all affected commands were rerun after the authorized cleanup.
- Every current Test asset is frozen for Validator. Any further Test or
  production byte change invalidates the current GREEN/retirement evidence and
  returns to the owning Gate.
- Causal RED may be the missing exact approved target module after drivers/helpers pass; unrelated import, environment, toolchain, fixture, or helper failure is never acceptable evidence.
- For this return, a loader-chain failure is specifically non-causal. After the
  paired-chain oracle correction passes, any RED must identify only missing
  behavior already frozen by a Requirement/AC, with exact failing Test leaf,
  count, command, and production Head/worktree hash context. If no such RED is
  observed, Test reports that fact rather than inventing one and Controller
  decides the next Gate.
- Pre-Validator scope evidence combines baseline-to-working-tree tracked diff, mandatory full `git status --short`, untracked inventory, and explicit whitespace checks of the new E files; post-commit Head evidence is separate.
- A changed Test or production Head invalidates earlier evidence for that Head until affected commands and independent verification are rerun.
- No Requirement is complete until every AC has executable evidence, an approved Task, in-scope code, GREEN/regression, retirement PASS when applicable, and fresh Validator evidence.
