# Product Change Execution Policy

This document is the sole durable policy authority for JuanerAI dual-device
product execution. Other project documents link here without restating it.

## Current Mode — User-approved Semi-automatic Development

On 2026-09-18 the user approved manual authorization and Controller-organized
role progression, without successful automatic recovery as a prerequisite for
product development. The user confirmed this as the long-term default for
JuanerAI product development; changing that default requires explicit approval.
The signed automatic execution, release and recovery mechanics below apply
only to separately authorized automatic operation; they are not prerequisites
for this manual path. This policy does not reconfigure a host or bypass the
installed Host Loop's signature and safety checks.

- MacBook remains Controller; Mac mini remains the initial product executor.
  Exactly one device owns and writes a work branch at a time. Use the existing
  Git workflow: the sender commits/pushes within its authority and stops;
  the receiver verifies the branch, commit and evidence, and human handoff
  confirmation precedes further writes. No new scheduler or state system is
  introduced.
- During requirements intake, the user and MacBook Controller may consult the
  JuanerAI whitepaper and product-module Demos in the research project. Demos
  are reference material, not automatically approved product requirements.
  Record explicitly adopted behavior, source/version, applicability limits and
  acceptance criteria in the existing product plan or Change. Make necessary
  adopted inputs accessible in the execution package; do not require the
  executor to rediscover the research history. Demo code, dependencies, scope
  and PASS results do not automatically become production implementation,
  authority or acceptance evidence. Unselected Demo content stays out of scope.
- Every product Change completes the MacBook-side `UI_CONTRACT` and
  `USER_UI_GATE` states before OpenSpec creation or production-role dispatch.
  The Controller freezes the exact clickable UI Contract version/path and the
  user's PASS in the execution package. Backend, Runtime, Adapter and
  infrastructure scope does not bypass this Gate. A material change to the
  approved workflow or visible acceptance surface returns to `UI_CONTRACT` and
  requires a new user verdict before execution can continue.
- Before execution, bind the approved Change, repository, exact worktree,
  branch, fresh baseline, owning device, path scope, role inputs, validation
  commands and stop lines in the existing intake/handoff. Manual approval is
  not a signed command and must not be submitted as one. Do not derive current
  execution authority from expired signatures or historical one-use approvals.
- MacBook Controller authorizes one complete bounded execution package, including
  stage-entry checks, stop conditions and exact Git permissions. The user
  initially opens/creates the Mac mini execution session and forwards that
  package once. The Mac mini session coordinates fresh isolated roles and
  performs the package's preauthorized stage checks locally:
  Spec -> Test / valid RED -> TDD_READY -> Worker -> applicable regression and
  Test Asset Retirement -> independent Validator -> authorized Git delivery.
  The MacBook-side path is Request -> Explore -> Proposal -> UI Contract ->
  User UI Gate -> execution-package freeze. Normal successful Mac mini
  progression requires neither a cross-device message nor
  renewed user approval at every Gate. This delegates bounded stage execution,
  not product, architecture, shared-contract or scope decisions. Any required
  decision outside the approved inputs returns to MacBook; the executor must
  not invent it or waive a Gate.
- At completion, Mac mini stops and emits one delivery receipt; the user
  forwards it once to MacBook. MacBook obtains the code through Git and owns
  review, final acceptance, authorized merge and archive. An unresolved failure,
  changed scope/contract or missing authority causes an early exception handoff
  instead. Existing session tools may replace message copying only when their
  use is explicitly authorized and connectivity is verified; they are not a
  prerequisite and do not justify new automation development. Reuse approved
  product decisions, D1-A reviews and valid evidence; refresh only facts that
  require freshness or have materially changed.
- Exceptions stop safely with preserved code, raw outputs and accurate results.
  Controller proposes the minimum manual disposition; tool repair, expanded
  tests or automatic recovery is not the default response. The stopped
  ERA-MIN-001 repair is not reopened or accepted by this policy.
  Any separately approved development-tool repair names its product acceptance
  point, minimum scope, validation budget, closing condition and return point.
  Safe manual intervention is an acceptable limitation; an exhausted or failed
  final validation budget stops the repair rather than starting another round.
- Global WIP remains one. Preserve the existing active pointer, State, pause,
  Ledger and evidence; a parked automation incident does not imply an empty
  slot. A retained reservation does not authorize continuing a withdrawn plan;
  use `docs/planning/README.md` for current product-plan authority. Do not create
  a second Change to evade the reservation. Verify current ownership and absence of competing execution
  before writing. A different Change requires explicit disposition of any
  reserved earlier WIP. Manual progress/acceptance must not be represented as
  Host Loop READY/CLOSED, signed RELEASE or pointer clearing.
- Git integration follows the existing PR/squash/ff-only policy under applicable
  authorization. This mode approval does not itself authorize product execution,
  commit/push/merge, installation, provider calls, deployment, service operations
  or a new signed DISPATCH. Credentials and permission boundaries are unchanged.

The current product-plan authority and return point are recorded in
`docs/planning/README.md`.
`CHG-xanthil-desktop-session-bootstrap` is a withdrawn future execution plan,
not a dispatch target. The semi-automatic workflow remains available for future
approved plans; it does not revive this or the withdrawn Model Pack roadmap.

### Retained Gates and Stage Records

Use `.ai-coding/state-machine.md`, `.ai-coding/workflow.md` and
`.ai-coding/definition-of-done.md`; semi-automatic operation changes who drives
the transitions, not their evidence or completion conditions. The Mac mini
entry session is a delegated execution coordinator, not a substitute for the
fresh Spec, Test, Worker or independent Validator roles. Its package explicitly
delegates the applicable Controller stage checks, including Spec Gate,
TDD_READY and Test Asset Retirement, within the frozen UI Contract and product
decisions. It records
each verdict and its authority before dispatching the next role. Missing
delegation or a check requiring a new product/contract decision returns to
MacBook. Final acceptance, risk waivers and integration remain with MacBook
Controller and the user as applicable.

Before each material transition, the execution coordinator updates the current
Change's `verification.md` and `traceability.md`, with `tasks.md` reflecting
actual completion. Record the prior/current stage, Gate verdict, responsible
session/role, approval reference, frozen code/input/test identities, exact
commands and results, durable evidence references, outstanding risks and next
permitted action. Preserve failed attempts and distinguish not run, not verified
and explicitly waived outcomes; a status label alone is not evidence. Use the
existing handoff templates and record files, not a second ledger or scheduler.

MacBook remains the sole project-board writer. During a remote execution batch,
the board represents its last confirmed handoff, not live Mac mini progress.
MacBook updates it on dispatch, received exception/completion, acceptance and
archive using the existing status CLI, after checking the execution records.
This is the semi-automatic timing rule for board updates in AGENTS.md,
change-complexity-control.md and agent-model-routing.md; local Gate evidence
and traceability must still agree before every role transition. A final receipt
summarizes intermediate transitions; no per-Gate user relay is required.

### OpenSpec, Git and Evidence Handoff

Keep product plans and decisions in their existing `docs/` locations. Each
product Change retains the artifacts required by `openspec/changes/README.md`,
REQ -> AC -> TEST -> TASK -> CODE -> RESULT traceability, and accepted baseline
specifications in `openspec/specs/`. Archive only after the applicable acceptance
conditions; mode changes neither reapprove old decisions nor erase history.

Use `docs/governance/git-development-workflow.md` for both the initial task
package and final delivery. Formal documents, source, tests and approved status
records travel through Git with an exact branch/commit; conversation receipts
locate those assets rather than replace them. The sender commits/pushes under
the batch's Git authority and stops writing before the receiver takes ownership.
MacBook reviews the PR and frozen evidence, accepts within its authority,
arranges the applicable OpenSpec archive, and squash merges; both devices then
fast-forward their clean local main mirrors and read back the merged identity.
Dirty worktrees are preserved and isolated, not reset or silently overwritten.

Raw evidence follows AGENTS.md Development Material Preservation and
`docs/templates/HANDOFF_BACK.template.md`: device-local persistent storage,
identity/hash/readback and receiver access. Git references do not copy external
logs. Arrange access or an explicitly scoped evidence copy when needed; do not
sync credentials, runtime databases, all archives or machine configuration.
Acceptance must not rely on a locator the receiving reviewer cannot access.

## Authority and Global WIP

The MacBook Controller is the sole decision authority and the Mac mini is the
sole current-Change executor. Global WIP is exactly 1.
`active-change.json.active_change_id` is the sole WIP authority. Task-tracker
records, scheduling facilities, Ledger, Evidence Ref, branches, PRs, and scans
are observational only and never infer an empty slot.

The Controller alone owns product semantics, the signed authority package, PR
review, `changes_requested`, archive decision, Acceptance, squash merge,
RELEASE, project-control, and authorization of future work. The automated host
can act only on the currently signed Change; manually supervised roles follow
the approved semi-automatic path above and do not consume host authority.

## D1-A Intake — Retained Product Gate

Before initial product execution, manual or signed, D1-A requires one fresh
read-only Product Plan Reviewer. An already completed applicable review is
reused, not repeated because the mode changed. The
Reviewer receives only the plan, formal attachments, explicitly cited JuanerAI
authority, and its seven-part review brief. Findings are classified as
`SPEC_BLOCKER`, `TEST_REQUIRED`, `IMPLEMENTATION_DETAIL`,
`ACTIVATION_OR_HOST_VALIDATION`, or `NON_BLOCKING_FOLLOWUP`.

The Controller may make at most one bounded semantic correction and then does
a targeted readback. It does not automatically launch a second Reviewer. There
is no post-DISPATCH Reviewer route. The final Artifact Package and review,
correction, disposition, and receipt hashes are frozen before manual execution
or signature, as applicable.

## Signed Automatic Execution — Separate Authorization Required

A valid signed DISPATCH binds the exact repository, Change, Worktree, baseline,
branch, scope, role routes, validation definitions, archive target, external
prerequisites, and stop lines. After DISPATCH the existing Coordinator advances
without per-Gate human acknowledgement:

```text
Worktree -> Spec -> Test RED -> Worker GREEN -> Regression and Retirement
-> Candidate -> final validation -> Validator -> branch push/readback
-> Candidate freeze -> PR/readback -> Handoff -> AWAITING_CONTROLLER
```

The four project roles remain fresh and isolated. The host launches only the
exact `AGENT_ACTION`; Git, Ledger, validation, PR, Handoff, and state mechanics
remain inside the existing Coordinator interfaces.

Each DISPATCH or signed REVISION authorization cycle permits at most one
same-scope Validator automatic repair, and only after finding-specific causal
RED. A second Validator FAIL enters `BLOCKED`. Any contract, architecture,
scope, path, dependency, permission, credential, host, identity, or evidence
ambiguity also enters `BLOCKED` and never widens authority by default.

## Automatic Review, Archive, Release, and Final Stop

The first Handoff stops at `AWAITING_CONTROLLER` and does not archive. After PR
review the Controller alone may sign an archive REVISION binding the current
Frozen Candidate and exact active, archive, and canonical paths. The Mac mini
performs only that mechanical same-scope archive, creates a descendant
Candidate on the same branch and PR, and repeats final validation, Validator,
and Handoff. It never decides archive or Acceptance.

After Controller Acceptance, squash merge, archive readback, and MacBook-main
readback, signed RELEASE allows only the existing clean ff-only Mac mini main
synchronization, durable CLOSED state, and pointer-clear-last sequence. RELEASE
does not merge, push main, clear evidence, or authorize a new Change.

Successful activation ends only at
`ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`. A separate
explicit user authorization and a completed new D1-A intake are required before
the first or any next product Change.

## Automatic Fail-closed Recovery and Rollback

Candidate commit, branch push, Ledger append, and final PR/Handoff remain the
only four automatic readback boundaries. Unresolved ambiguity becomes
`MANUAL_CONTROLLER_STOP`; restart never invents route, scope, state,
credential, or recovery authority.

Rollback stops ingress and restores the exact recorded installation or absence
while preserving the active pointer, Coordinator state, Ledger, Handoff,
canary evidence, and Git history. It never resets history, clears WIP, deletes
evidence, or claims success without readback.
