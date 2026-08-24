# Traceability: Model Pack Contract Enabler

## Requirement / Acceptance / Test / Task Map

The Node v26 paired loader-chain correction passed Spec Gate and Test. The first
bounded Worker candidate passed the existing suite and retirement review, but
fresh independent validation of Head
`c0bdf3a158a81d45131862debc8e2b1a24f076c3` returned FAIL on four already
specified public behaviors and the missing material Test mutations. Formal Test
added five exact leaves, the bounded Worker repaired only the package contract
file, and Controller confirmed remediation GREEN plus Test Asset Retirement
PASS. Validator 002 confirmed those five repairs and every standard suite but
returned FAIL on nine additional frozen-contract counterexamples. The
complexity stop line returned to two-suite Test Design; formal Test added all
nine leaves and Controller confirmed exact causal RED with only the two
existing production files released. The bounded Worker closed all nine leaves;
Controller confirmed 301/301 E GREEN, complete affected/canonical regression,
and repeated Test Asset Retirement PASS. Validator 003 confirmed all standard
evidence and historical probes but found two Runtime violations: missing
governed identity length enforcement and spoofable named-Error sanitization.
Formal Test added exactly those two Runtime leaves, and Controller confirmed
causal RED only on the leaves plus their aggregate parent. The bounded Worker
changed only Runtime production; Controller confirmed 303/303 E GREEN,
complete affected/canonical regression, and repeated Test Asset Retirement
PASS. Validator 004 confirmed all declared evidence and historical probes but
found 11 additional package/Runtime boundary violations across spoofed carrier
trust, Proxy sanitization, permission precedence, governed identities, and
closed own-key shapes. Formal Test added exactly those leaves and Controller
confirmed causal RED only on them plus their parents. Renewed TDD_READY
released only the two production files. The bounded Worker closed all 11
leaves; Controller confirmed package 233/233, Runtime 81/81, E 314/314,
complete affected/canonical regression, and Test Asset Retirement PASS with a
fresh `Lean already. Ship.` Production and Test bytes are frozen for Validator
005. No acceptance or archive is claimed.
Validator 005 confirmed the complete standard matrix and all historical probes
but found four further material public-boundary leaves: two public factory
carrier-injection context violations and two array own-key closure violations.
Production is frozen and only the two existing contract suites are released to
formal Test. Current GREEN, retirement, and independent verification are
reopened; no Spec semantic or scope change is required.
Formal Test added exactly the four leaves. Controller independently confirmed
package 232/235, Runtime 80/83, and E 312/318 fail only on those leaves plus
their two parents. Renewed TDD_READY releases only the same two production
files; every Test and all other paths are frozen.
The bounded Worker closed all four leaves. Controller confirmed package
235/235, Runtime 83/83, E 318/318, the full affected/canonical matrix, and Test
Asset Retirement PASS with a fresh `Lean already. Ship.` Production and Test
bytes are frozen for Validator 006.
Validator 006 confirmed every standard/historical/array result but found three
missing Unicode `Cf` Runtime identity leaves at the Runtime, Adapter, and
dependency positions. Package and production remain frozen; only the Runtime
contract suite is released to formal Test. Current GREEN, retirement, and
independent verification are reopened without a Spec or scope change.
Formal Test added exactly those three values to the existing Runtime binding
table. Controller confirmed package 235/235, Runtime 82/86, and E 317/321 fail
only on the three leaves plus their parent. Renewed TDD_READY releases only
Runtime production; every Test and all other paths are frozen.

| Requirement | Acceptance | Planned test/evidence | Task | Candidate code/evidence | Current result |
|---|---|---|---|---|---|
| REQ-MPC-001 | AC-MPC-001-01 | TEST-MPC-001 | TASK-003,006 | exact manifest serialize/admit signatures; malformed status shape; printable bounded identities/categories; immutable manifest/revocation policy | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-02 | TEST-MPC-001 | TASK-003,006 | canonical synchronous serializer/admission; closed all-own-key calls including arrays; exact bounds; Proxy sanitization; detached bytes/value | REMEDIATION GREEN; VALIDATOR PENDING |
| REQ-MPC-001 | AC-MPC-001-03 | TEST-MPC-001 | TASK-003,006 | exact sanitized error carrier with provenance/context ownership; synchronous contract throw; compatibility/artifact/status/permission precedence | REMEDIATION GREEN; VALIDATOR PENDING |
| REQ-MPC-001 | AC-MPC-001-04 | TEST-MPC-001 | TASK-003,006 | purpose/permission/runtime manifest admission including missing/extra/widened-permission precedence | REMEDIATION GREEN; VALIDATOR PENDING |
| REQ-MPC-001 | AC-MPC-001-05 | TEST-MPC-002 | TASK-003,006 | exact input admission/canonical-byte signatures; precise decimal ordering; Unicode scalar category length | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-06 | TEST-MPC-002 | TASK-003,006 | exact forecast admission and precise interval ordering; Runtime-owned result/provenance boundary | REMEDIATION GREEN |
| REQ-MPC-001 | AC-MPC-001-07 | TEST-MPC-001 | TASK-003,006 | exact evaluation decimal thresholds and metadata/no-data-access proof | REMEDIATION GREEN |
| REQ-MPC-002 | AC-MPC-002-01 | TEST-MPC-003 | TASK-003,006 | exact release serialize/admit signatures + bounded non-path identities + release bytes/observation/expected binding + closed local-URI verification assertion | REMEDIATION GREEN |
| REQ-MPC-002 | AC-MPC-002-02 | TEST-MPC-003 | TASK-003,006 | release-stage/decision gate | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-03 | TEST-MPC-003 | TASK-003,006 | exact Registry/URI plus supplied location-verification shape/kind admission; no path access | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-04 | TEST-MPC-003 | TASK-003,006 | only repeated release bindings and observation URI/SHA/size/Signature comparisons; singleton lower-boundary codes | GREEN PASS |
| REQ-MPC-002 | AC-MPC-002-05 | TEST-MPC-003,004 | TASK-003,006 | package fixture and driver; P ownership stop line | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-01 | TEST-MPC-005 | TASK-004,007 | exact binding/predictor factory; closed dependencies array; governed identity printable/no-control/length/no-credential boundary; adversarial carrier sanitization | CAUSAL RED PASS |
| REQ-MPC-003 | AC-MPC-003-02 | TEST-MPC-005 | TASK-004,007 | immutable readiness/openRun/snapshot capture | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-03 | TEST-MPC-005,007 | TASK-004,007 | exact predictor request/same signal and deadline; one-shot predict; Runtime-owned result/provenance | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-04 | TEST-MPC-006 | TASK-004,007 | native mock timers + AbortController + externally ordered atomic terminal outcomes | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-05 | TEST-MPC-006,007 | TASK-004,007 | arbitrary rejection sanitization; invalid unknown fulfillment; late settlement | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-06 | TEST-MPC-007 | TASK-004,007 | separate-Run deterministic comparison | GREEN PASS |
| REQ-MPC-003 | AC-MPC-003-07 | TEST-MPC-005,007 | TASK-004,007 | closed Port/result and forbidden-effect evidence | GREEN PASS |
| REQ-MPC-004 | AC-MPC-004-01 | TEST-MPC-004 | TASK-003 | package driver/double health | GREEN PASS |
| REQ-MPC-004 | AC-MPC-004-02 | TEST-MPC-008 | TASK-004 | exact Runtime harness/driver via public predictor seam; double health | GREEN PASS |
| REQ-MPC-004 | AC-MPC-004-03 | TEST-MPC-001..009 | TASK-003,004 | exact signature/error-delivery and independently named material mutation leaves | THREE CONTROL LEAVES FROZEN; CAUSAL RED PASS |
| REQ-MPC-004 | AC-MPC-004-04 | TEST-MPC-004,008 | TASK-003,004,011 | shared drivers plus Controller/Validator ownership review | DRIVER/OWNERSHIP PASS |
| REQ-MPC-004 | AC-MPC-004-05 | Controller TDD_READY evidence | TASK-005 | Runtime Test hash/count and exact three-leaf causal RED; Runtime-only release | TDD_READY PASS |
| REQ-MPC-004 | AC-MPC-004-06 | Controller retirement Gate | TASK-003,004,010 | prior delta healthy; three material Unicode-control leaves absent | REOPENED |
| REQ-MPC-005 | AC-MPC-005-01 | TEST-MPC-009 + TEST-XCLI-021 affected existing regression | TASK-004,008,009 | inactive integration plus completed, byte-frozen exact eight-entry mirrored `approvedTsconfig.files` append; every other Xanthil assertion/current behavior preserved | GREEN PASS |
| REQ-MPC-005 | AC-MPC-005-02 | TEST-MPC-009 | TASK-004,006,007 | inert import/build/driver composition; exact Node loader paired source-read chains classified as toolchain mechanics, every other filesystem/product effect forbidden | GREEN PASS |
| REQ-MPC-005 | AC-MPC-005-03 | TEST-MPC-009 + Validator review | TASK-004,011,012 | no active binding in E; activation stop line | SCOPE PASS; FRESH VALIDATOR PENDING |
| REQ-MPC-005 | AC-MPC-005-04 | TEST-MPC-001,005,007,009 | TASK-003,004,011 | supplied revoked-status block, retained admitted evidence, rollback review | REMEDIATION GREEN; VALIDATOR PENDING |
| REQ-MPC-005 | AC-MPC-005-05 | Controller/Validator evidence | TASK-011,012 | scope/ownership/integration-order review | SCOPE PASS; FRESH VALIDATOR PENDING |

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
| TASK-003 | TEST-MPC-001..004 | Validator 005 package Test return complete; two leaves causal RED |
| TASK-004 | TEST-MPC-005..009 plus existing frozen TEST-XCLI-021 | Validator 006 Runtime Test return complete; three leaves causal RED |
| TASK-005 | all tests and exact Worker scope | renewed TDD_READY PASS; Runtime-only path released |
| TASK-006 | REQ-MPC-001, 002, 005 | Validator 005 bounded package Worker complete and frozen |
| TASK-007 | REQ-MPC-003, 005 | Validator 005 bounded Runtime Worker complete and GREEN |
| TASK-008 | REQ-MPC-004, 005 | exact graph integration complete and frozen |
| TASK-009 | TEST-MPC-001..009 and affected baseline | historical standard GREEN; three material leaves reopen |
| TASK-010 | every changed test asset | reopened after Validator 006 |
| TASK-011 | all Requirements, ACs, tests, code, scope, evidence | Validator 001..006 FAIL historical; fresh Validator required after correction |
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
