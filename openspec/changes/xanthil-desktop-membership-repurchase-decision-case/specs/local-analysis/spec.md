# Local Analysis Compatibility Delta

## Status

- Baseline: openspec/specs/local-analysis/spec.md
- Change: xanthil-desktop-membership-repurchase-decision-case
- Status: SPEC_AUTHOR_COMPLETE_INTERRUPTED_RESUMPTION_001; independent
  whole-package review and affected Spec Gate pending; final compatibility
  meaning is unchanged; temporary tuple Test/runner changes remain locked behind
  Gate and loop-scoped TDD_READY

Incremental Contract Amendment 001 resolves the factory/Port bootstrap and
authorizes only the finite C1a/C1b/C1/C2/C3 execution tuples. P4 and the
original final P5 meaning remain unchanged; temporary recognition is retired
before final evidence.

Every REQ-XCLI requirement and acceptance criterion remains unchanged unless
this delta explicitly modifies the named native-toolchain clause. The Desktop
does not claim that the fixed member-orders-v1 CLI fixture implements the new
double-CSV Case.

## MODIFIED REQ-XTS-001 — Keep one explicit native TypeScript graph

The root TypeScript graph SHALL remain an explicit files list containing the
current CLI, Console, Model Pack contract-enabler, and exact Desktop files in
path-contract.md.

- **AC-XDESK-LA-001-01:** Every pre-Change TypeScript path and import remains in
  tsconfig.json and keeps its current public export and behavior.
- **AC-XDESK-LA-001-02:** P4 retains the exact twelve compiler options and 43
  ordered files frozen in dependency-decision.md. C1a/C1b/C1/C2/C3 add only
  `jsx:"react-jsx"` and the exact enumerated ordered subsequences of the same
  final 25 paths. Final P5 appends all 25 in order. No tuple adds an unbounded
  include, inferred directory glob, skip-lib bypass, emitted compatibility
  bridge, duplicate, or reordered pre-Change source owner.
- **AC-XDESK-LA-001-03:** Pi SDK types/imports remain inside
  adapters/agent-pi; Electron/React types remain inside apps/desktop and build
  configuration; node:sqlite remains inside the Desktop storage Adapter.
- **AC-XDESK-LA-001-04:** Product Core, Application, business Ports, current
  CLI/Console, and persisted business contracts expose only JuanerAI business
  or standard platform values.

## MODIFIED REQ-XTS-002 — Use the exact approved root toolchain

The repository SHALL remain one private npm package and one npm v3 lock with
the exact P4 adoption and P5 manifest delta in dependency-decision.md.

- **AC-XDESK-LA-002-01:** P4 repository package.json is exactly 808 bytes with
  SHA-256 5a5e225cab86826b78afb2b94eb18a4064ab75c1115aa27dfb1342a927ed264a,
  and package-lock.json is exactly 319836 bytes with SHA-256
  861326061cd570b0e81584f149012b13228aec3da6528d82536f89cbb5d535c0.
- **AC-XDESK-LA-002-02:** P5 adds only main, the one-key nested config.forge,
  desktop:start, desktop:package, and desktop:test with the exact values in
  dependency-decision.md; existing typecheck/test semantics and every
  dependency version remain unchanged. During the approved batch TEST-XCLI-021
  accepts only exact C0, C1a, C1b, C1, C2, or C3 and rejects mixed/partial
  state. Final retirement deletes intermediate cases, after which it accepts
  only the complete closed P4 tuple or complete closed P5 tuple.
- **AC-XDESK-LA-002-03:** No range/latest, alternate package manager, nested
  lock, dependency override, hidden install/test network behavior, SQLite npm
  package, Maker, publisher, updater, or additional test runner is introduced.
- **AC-XDESK-LA-002-04:** The local toolchain descriptor is generated for the
  package only, contains exactly the approved DuckDB/Python paths and versions,
  and is absent from Git, Project data, Renderer values, provider payloads, and
  reports.

## MODIFIED REQ-XTS-004 — Extend canonical offline validation without drift

The canonical validation runner SHALL retain its current fail-fast phases and
append the exact Desktop validation phases only after their P4/P5 prerequisites
exist.

- **AC-XDESK-LA-004-01:** Validation first proves the exact command-local
  Node/npm/DuckDB/Python plus each direct package's approved exact
  name/version/source/integrity, actual Project-local installation, and
  required entry capability under the outcome/method boundary in
  dependency-decision.md, then native syntax and strict root typecheck.
  Metadata identity alone is insufficient; missing tool/dependency/required
  entry fails before product tests and is never labeled expected RED. The
  bounded TEST-XCLI-021 correction must pass a refreshed affected Spec Gate,
  its focused 021/022 command, a complete canonical P4 baseline, and the four
  explicit unchanged Console suites before product Test/RED is eligible.
- **AC-XDESK-LA-004-02:** Existing local-analysis, Model Pack
  contract-enabler, and project-board phases remain unchanged except for the
  exact TEST-XCLI-021 P4/P5 configuration oracle. TEST-XCLI-022 and every
  business/CLI/Console/Run assertion remain unchanged. P5 inserts the four
  currently omitted unchanged unit/contract/integration/E2E
  run-evidence-console commands. During the batch its source contains one exact
  literal command list for the active tuple, with no runtime/environment phase
  selector; the list grows monotonically and does not mark future leaves
  passed. Final CF replaces it with the full Desktop unit, contract,
  integration, and package/E2E phases.
- **AC-XDESK-LA-004-03:** A phase streams native output, stops subsequent
  phases on failure, exits nonzero, and creates no success receipt. The runner
  always removes the real-model gate and performs zero provider call.
- **AC-XDESK-LA-004-04:** Desktop package/E2E and the separate normal no-debug
  acceptance use the same frozen production `.app` and are reported distinctly.
  Offline provider doubles remain contract/integration-only; a production-app
  GUI may open their closed synthetic persisted Projects but that evidence
  cannot claim packaged injection, the normal local application journey, a
  production Provider call, or real-provider quality.

## Unchanged local-analysis authority

The following remain explicit compatibility authorities:

- AgentAnalysisRuntime, LocalAnalysisExecution, and RunArtifactStore existing
  method sets and definition functions;
- createLocalAnalysisApplication and createPersonalLocalAnalysisProfile;
- apps/cli/xanthil.ts commands and stable failure vocabulary;
- Run schema 2.0 plus legacy read continuity and .xanthil/runs publication;
- current requested/observed model provenance and real-model Gate;
- 22 TEST-XCLI cases, current fixture oracle, contract drivers, coverage map,
  public seams, and CLI/Profile harness. Only TEST-XCLI-021's closed root-
  configuration literals/helper/body may evolve as specified below;
  TEST-XCLI-022 remains unmodified.

## Historical completed post-Gate compatibility correction

The already-approved P4 manifest legitimately changed TEST-XCLI-021's exact
root-configuration authority. The bounded one-file correction preserved every
old negative, added fail-closed new/mixed-state and dependency-health negatives,
left TEST-XCLI-022 and all business assertions untouched, and passed its
refreshed Gate and focused command. The subsequent complete canonical baseline
and four explicitly invoked unchanged Console suites also passed. This
maintenance was not product RED or TDD_READY. It is retained historical
evidence, grants no current compatibility-test write permission, and is not
replayed by the recovered Desktop Test stage.

The approved reuse edits are the private analytics subprocess-helper extraction
and additive DecisionAssistanceRuntime/Pi factory described by REQ-XDESK-010.
Neither changes an existing signature, accepted implementation shape,
provider/model default, or current persisted Run contract.

## Additive Desktop Run compatibility

REQ-XDESK-005 requires a truthful double-CSV, no-provider deterministic Run
under `.xanthil/runs`. The Desktop delta therefore owns a closed 3.0 manifest,
validator, `DesktopRunEvidenceStore`, and factory only in the existing approved
Desktop Core/Port/storage paths. It does not modify this local-analysis
capability.

- Existing `LocalRunArtifactStore` creates 2.0 and reads terminal 1.0/2.0 only;
  selecting 3.0 retains its unsupported-version behavior.
- Existing Console `createLocalRunEvidenceReader` remains a selected-directory
  1.0-only reader and returns `RUN_CONTRACT_UNSUPPORTED` for 3.0. It neither
  enumerates the mixed-version root nor gains 2.0 support.
- The Desktop store accepts only exact 3.0 and addresses one UUIDv7 directly.
- There is no registry, dispatcher, migration, scan, adoption, backfill, or
  rewrite of old Runs.

The four unchanged `tests/{unit,contract,integration,e2e}/run-evidence-console`
suites are explicit compatibility evidence. They are not currently included by
the canonical runner; P5 must append them unchanged before the Desktop phases.
