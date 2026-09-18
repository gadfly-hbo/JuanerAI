# Xanthil Desktop First Product Change Execution Package v1.0

## Package identity

| Field | Value |
|---|---|
| Package ID | `PKG-XANTHIL-DESKTOP-001` |
| Package owner | MacBook Controller |
| Intended receiver | Mac mini execution coordinator |
| Product Change ID | `xanthil-desktop-membership-repurchase-decision-case` |
| Product | Xanthil Desktop Free |
| Change class | Foundation / bootstrap, R2 |
| Product authorization | User command `授权启动首个 Xanthil Desktop 生产 OpenSpec Change` |
| Package authorization | User command `制作并转发任务包` on 2026-09-19 |
| UI Gate | `PASS`, user accepted the directly reused PX-2026-004/006 clickable UI |
| Clickable UI Contract | `docs/planning/2026-09-18/clickable-ui-contract-v1.1/`; sorted per-file SHA-256 manifest digest `39964927d40f756e93bafc8ae8bedd93482a40778316cc22aaad6b2ebad10a67` |
| UI reference plates | `docs/planning/2026-09-18/attachments/xanthil-ui-reference/`; sorted per-file SHA-256 manifest digest `e986d85f63d2c1dd19399454e99bbbe78c116e9ee954e6299244284391b95327` |
| Current first action | Read-only global-WIP preflight on Mac mini |
| Final integration owner | MacBook Controller; Mac mini must not merge |

This is the one-transfer execution package for the first production Xanthil
Desktop Change. It does not revive any withdrawn Desktop or Model Pack plan,
does not authorize the retired Host Loop, and does not treat a historical
signature, pointer, review, Demo PASS, or branch as current execution authority.

The package commit and branch are supplied in the transfer message after this
document is committed. The receiver must verify those exact Git identities
before acting.

## Frozen product outcome

Build the minimum coherent, real macOS Desktop vertical slice through which a
non-technical user can:

1. create and later reopen one professional Product Session for the fixed
   membership-repurchase diagnosis scenario;
2. receive one durable Session record and the completed local folder structure
   `010_draw`, `020_clean`, and `060_reports` before the Session becomes usable;
3. work with exactly one Decision Case whose revision is the sole business
   revision in this slice;
4. optionally use `帮我整理问题` after exact payload disclosure and explicit
   confirmation, without sending `010_draw`, raw rows, file content, file paths,
   internal IDs, or automatic attachments to the model;
5. run the approved local analysis path through a distinct Analysis Run;
6. inspect traceable evidence, produce the first decision-oriented report, and
   close the Case only through the approved closure states; and
7. see the accepted PX-2026-004 professional mode and PX-2026-006 dual-mode
   shell, including the visible Skill, Prompt, Fork, Subagent, report,
   Inspector/drawer, and Session-navigation capability inventory.

Only the professional membership-repurchase path becomes real in this Change.
Other visible capabilities may remain clearly labelled `Preview`; they must not
fake persistence, execution, completion, evidence, provider use, or results.

Session creation itself performs no provider call. An Assistance Attempt is
distinct from an Analysis Run and never mutates authoritative Session, Case,
analysis, or report state merely because the attempt settles. Pi is the only
current Agent Runtime Adapter. Pi-internal session types and events remain
inside the Pi Adapter. A second Runtime, Runtime registry, fallback, hot
switching, or universal Runtime interface is a separate Change.

## Binding product inputs

The Mac mini coordinator and formal roles use these repository inputs. They do
not rediscover or reinterpret the research repository.

1. `AGENTS.md`
2. `CONTEXT.md`
3. `Orchestration.md`
4. `docs/planning/README.md`
5. `docs/product/product-brief.md`
6. `docs/planning/2026-09-18/juanerai-product-development-blueprint-v1.0.md`
7. `docs/planning/2026-09-18/juanerai-product-development-blueprint-v1.1.md`
8. `docs/planning/2026-09-18/xanthil-desktop-ui-contract-v1.1.md`
9. `docs/planning/2026-09-18/xanthil-ui-reference-adoption-map-v1.0.md`
10. `docs/planning/2026-09-18/xanthil-ui-state-and-closure-matrix-v1.0.md`
11. `docs/planning/2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md`
12. `docs/planning/2026-09-18/clickable-ui-contract-v1.1/README.md` and its
    exact `dist/` files
13. `docs/planning/2026-09-18/attachments/xanthil-ui-reference/README.md` and
    the eight frozen visual plates
14. `docs/planning/2026-09-18/reviews/ui-contract-development-readiness-review-005.md`
15. `docs/planning/2026-09-18/reviews/session-runtime-development-readiness-review-002.md`
16. `docs/adr/0003-business-runtime-port-strategy.md`
17. `docs/architecture/asset-and-model-capability-architecture.md`
18. `docs/architecture/data-authority.md`
19. `docs/architecture/security-boundaries.md`
20. `docs/governance/product-change-execution-policy.md`
21. `docs/governance/git-development-workflow.md`
22. `docs/governance/change-complexity-control.md`
23. `docs/governance/xanthil-first-slice-reuse-baseline.md`
24. `docs/governance/test-asset-retirement.md`
25. `.ai-coding/state-machine.md`, `.ai-coding/workflow.md`,
    `.ai-coding/policies/testing.md`, and `.ai-coding/definition-of-done.md`

PX-2026-001/002 AnalysisOps material is adopted only where the approved
planning package explicitly names a behavior. PX-2026-004/006 is the binding UI
reference. Semantica is excluded from this slice. Demo code, dependency choices,
scope, and PASS evidence are not production implementation or acceptance.

## Stage 0 — Git intake and ownership transfer

Before any repository write, the Mac mini coordinator must:

1. verify the familiar JuanerAI repository root, `origin`, device identity,
   current branch, HEAD, upstream, and worktree state;
2. fetch and verify the exact MacBook package branch and commit supplied in the
   transfer message;
3. preserve any existing local modifications or execution state; do not reset,
   clean, overwrite, or silently stash them;
4. confirm that the user has transferred this package to the Mac mini session;
5. make the Mac mini the sole writer of the transferred work branch; and
6. stop if the exact package commit cannot be verified or the branch cannot be
   safely acquired without disturbing existing work.

No production role is dispatched in Stage 0.

## Stage 1 — mandatory read-only global-WIP preflight

Global WIP remains one. The old active pointer was deliberately preserved when
the prior product plans were withdrawn. Its presence does not authorize old
work, imply `CLOSED`, or allow a new Change to bypass the reservation.

The Mac mini coordinator performs a bounded read-only inspection of the
existing coordinator state only if it is safely readable without privilege
changes. The installed default root is expected to be
`/private/var/db/juanerai/change-coordinator`, with `active-change.json`,
`local-pause.json`, and `changes/<change-id>/state.json`, but the actual host
configuration and readable paths are facts to verify. Inspect the applicable
pointer, State, pause, Ledger/evidence locators, and ownership using existing
read-only mechanisms. Record exact paths, readability, byte lengths, SHA-256
digests, parsed active Change ID and state, and any conflict. Exclude secrets.

During this preflight, do not:

- use `sudo`, change permissions, or install anything;
- start, restart, enable, or repair a service or Host Loop;
- submit a command, replay a signature, update State/Ledger, clear a pointer,
  modify a pause, or write canonical/candidate repositories;
- create the new OpenSpec Change; or
- infer an empty slot from a branch, PR, task tracker, log, or missing process.

Proceed past Stage 1 only when the sole WIP authority proves no competing
execution and the slot is usable, or after the user separately authorizes and
the Mac mini completes the minimum exact disposition of the retained WIP.

If the pointer is occupied, unreadable, contradictory, or requires any write or
host action, stop with `WIP_PREFLIGHT_EXCEPTION`. Return one concise receipt
containing the verified facts, unchanged-state statement, durable evidence
locator, and the minimum proposed disposition. Do not begin Spec and do not
expand into automation repair.

## Stage 2 — OpenSpec and Spec Gate

After Stage 1 is satisfied, create only:

`openspec/changes/xanthil-desktop-membership-repurchase-decision-case/`

The Mac mini coordinator dispatches a fresh `juaner_spec` role at the R2 route
defined by `docs/governance/agent-model-routing.md`. The Spec role drafts the
complete proposal, specification, design, tasks, verification, traceability,
and path contract. It may write only the new Change directory during this
stage. It must not write production code or tests.

The OpenSpec package must close, at minimum:

- Desktop/application/core/Port/Adapter/Profile boundaries;
- Product Session, Decision Case, Case revision, Analysis Run, Assistance
  Attempt, report, closure, reopen, cancellation, failure, and recovery states;
- durable Session creation ordering and partial-failure behavior for all three
  local folders;
- exact LLM payload disclosure, confirmation, minimization, cancellation,
  provider error, and zero-authoritative-mutation behavior;
- Pi Adapter contract and the prohibition on Pi types outside that Adapter;
- reuse versus extension of the existing local-analysis capabilities;
- a complete REQ -> AC -> TEST -> TASK -> CODE -> RESULT plan;
- exact allowed, conditional, and forbidden paths; and
- the Desktop dependency/build/package decision needed for the approved
  Electron + React + TypeScript direction.

No new dependency or lockfile change, dependency installation, schema creation,
real provider call, or host operation is authorized by this package. If the
Spec cannot close the exact dependency/build decision from existing approved
facts, it must return `DEPENDENCY_DECISION_REQUIRED` with the minimum options
and evidence; it must not invent or install the choice.

Because this is a Foundation/R2 Change and the formal Spec route is high
reasoning, run `ponytail-review` on the complete OpenSpec diff before Spec Gate.
Return deletion/simplification findings to Spec. Material scope or architecture
beyond the frozen outcome returns to MacBook for explicit approval.

The delegated Mac mini coordinator may pass Spec Gate only inside the frozen
product decisions and path boundary. It records the verdict and fixed OpenSpec
identity before Test dispatch. A product, architecture, shared-contract,
dependency, data-boundary, acceptance, or scope decision absent from this
package is an exception handoff, not coordinator discretion.

## Stage 3 — Test Design and valid RED

After Spec Gate `PASS`, dispatch a fresh `juaner_test` role. It derives
executable positive, negative, recovery, contract, persistence, privacy, and
real Desktop-flow tests from Requirement and Acceptance Criteria IDs. It must
establish an expected RED caused by missing production behavior before Worker
dispatch, without weakening or pre-solving the tests.

Run the Test Asset Retirement Gate at Test Design. Freeze the Test/RED evidence,
test identity, commands, failures, allowed paths, and `TDD_READY` verdict. No
real provider call is permitted; provider behavior uses approved deterministic
doubles at this stage.

## Stage 4 — minimum implementation and GREEN

After `TDD_READY`, dispatch a fresh `juaner_worker` role. It implements only the
frozen OpenSpec and allowed paths. It reuses existing local-analysis, Pi Adapter,
storage, DuckDB, Profile, contract, and test foundations where the Spec proves
them applicable. It does not rewrite those foundations or implement Preview
capabilities merely because they are visible in the shell.

The Worker runs focused tests to GREEN and reports every changed path and
command. Any new contract, dependency, permission, path, data boundary,
provider access, platform assumption, or architecture decision stops as an
exception. It may not suppress failures, change approved assertions, or claim
simulated behavior as real.

## Stage 5 — regression, retirement, and independent validation

After GREEN, the coordinator runs the applicable focused suites and
`tools/harness/validation/run`, then repeats the Test Asset Retirement Gate.
The canonical offline validation command cannot perform a real-model call.
Desktop acceptance must exercise the actual public macOS entry and accepted UI
workflow, including negative and recovery behavior; a running page or component
snapshot alone is insufficient.

Freeze implementation and evidence, then dispatch a fresh independent
read-only `juaner_validator`. Validator verifies scope, contracts, architecture,
privacy, data authority, UI workflow, real Session/folder behavior, persistence
and reopen, Preview honesty, traceability, tests, regression, and evidence. It
does not implement or approve missing product decisions.

The Change is not accepted on Mac mini. A Validator failure returns only through
the bounded correction rules already approved by project governance; contract,
scope, dependency, or architecture drift returns to MacBook.

## Path authority

### Always allowed before Spec Gate

- `openspec/changes/xanthil-desktop-membership-repurchase-decision-case/**`
- a Change-scoped, device-local persistent evidence directory whose exact path
  is recorded in `verification.md` and the delivery receipt

### Conditional after Spec Gate and TDD_READY

The exact files must be enumerated and frozen by OpenSpec before their relevant
stage. Candidate roots are limited to:

- `apps/desktop/**`
- `apps/cli/xanthil.ts`
- `apps/console/xanthil-console.ts`
- `packages/application/**`
- `packages/contracts/**`
- `packages/ports/**`
- `packages/product-core/**`
- `adapters/agent-pi/**`
- `adapters/analytics-duckdb/**`
- `adapters/storage-local/**`
- `profiles/personal/**`
- `tests/**`
- narrowly required repository entry/build configuration explicitly approved
  at Spec Gate

Being listed as a candidate root is not write authority. Unselected paths remain
forbidden. Any shared contract change remains Controller-owned and must already
be closed by the approved Spec.

### Forbidden in this package

- `main` development or direct push/merge to `main`
- research-repository writes or copying Demo code as production authority
- old withdrawn planning packages, old Change execution, canonical/candidate
  execution libraries, State, Ledger, pause, or active-pointer writes
- `/Users/huangbo/JuanerAI-repair-archive-20260918/**` and any `.recovery` entry
- `.juanerai/project-control/**` writes on Mac mini
- dependency manifests, lockfiles, or dependency installation without a later
  exact authorization
- real provider/model calls, real user data, external data, production systems,
  deployment, release, service operations, host reconfiguration, or credentials
- a second Agent Runtime, Runtime registry/fallback/hot-switching, Semantica,
  automatic actions, enterprise identity/tenancy/policy machinery, or public
  release claims

## Preauthorized role progression

Once Stage 1 passes, the Mac mini coordinator may continuously run:

`juaner_spec -> ponytail review -> Spec Gate -> juaner_test -> valid RED -> TDD_READY -> juaner_worker -> GREEN/regression/retirement -> juaner_validator`

This is standing stage authority, not permission to change product meaning,
architecture, shared contracts, acceptance, scope, dependencies, or safety
boundaries. Record each transition in the Change's existing verification,
traceability, and task artifacts. No per-stage user relay is required for a
normal in-scope pass.

## Git and delivery authority

After independent Validator `PASS`, the Mac mini may:

1. commit only the verified Change files on the transferred work branch;
2. push that branch to `origin`;
3. open one GitHub pull request to `main`; and
4. return the fixed commit, tree, branch, PR, diff, validation, Validator, and
   evidence identities in one delivery receipt.

Mac mini must not squash, merge, archive OpenSpec, push `main`, clear execution
state, or begin another Change. MacBook retrieves the branch through Git,
reviews and accepts, and performs only separately authorized integration and
archive work.

## Required exception receipt

An early exception receipt contains:

- package ID and exact received Git commit;
- Mac mini repository root, device identity, branch, HEAD, upstream, and
  preserved dirty-state facts;
- completed stage and stop code;
- exact blocker, affected authority/Gate, and why it cannot be resolved inside
  this package;
- commands actually run and exit results;
- changed-path list, which must be empty for a Stage 1 WIP exception;
- durable evidence root, byte lengths, SHA-256 identities, and receiver-access
  status;
- smallest proposed decision or disposition; and
- explicit confirmation that no later role or forbidden action ran.

## Required successful delivery receipt

The single successful handback contains:

- package ID, Change ID, branch, fixed HEAD/tree, baseline, upstream, and PR;
- OpenSpec and every Gate identity and verdict;
- allowed/actual paths and canonical diff SHA-256;
- RED, GREEN, regression, canonical validation, Test Asset Retirement, actual
  Desktop-flow, and independent Validator evidence;
- dependency/install/provider/real-data statements;
- persistent raw-evidence root, hashes, independent readback, and receiver
  availability;
- known risks, not-run items, and explicit waivers, if any; and
- final state `AWAITING_MACBOOK_REVIEW`, with no merge or next-Change action.
