# Product Change Execution Policy

This document is the sole durable policy authority for JuanerAI dual-device
product execution. Other project documents link here without restating it.

## Current Mode — User-approved Semi-automatic Development

On 2026-09-18 the user approved manual authorization and Controller-organized
role progression, without successful automatic recovery as a prerequisite for
product development. The user confirmed this as the long-term default for
JuanerAI product development; changing that default requires explicit approval.
On 2026-09-19 the user made dedicated new-session creation and initial-message
package delivery the default MacBook-to-Mac-mini dispatch mechanism.
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
  stage-entry checks, stop conditions and exact Git permissions. After the user
  authorizes package transfer, MacBook commits and pushes the package branch,
  reads back the exact remote branch, commit, tree and package hash, and stops
  writing that branch. It then creates one new Codex task bound to the saved
  Mac mini JuanerAI project and sends the complete package as that task's first
  message. New-task creation and first-message delivery are standing-authorized
  parts of package transfer; they do not require the user to create the task by
  hand. The Mac mini task coordinates fresh isolated roles and performs the
  package's preauthorized stage checks locally:
  Spec -> Test / valid RED -> TDD_READY -> Worker -> applicable regression and
  Test Asset Retirement -> independent Validator -> authorized Git delivery.
  The MacBook-side path is Request -> Explore -> Proposal -> UI Contract ->
  User UI Gate -> execution-package freeze -> new Mac mini task dispatch.
  Normal successful Mac mini progression requires neither a cross-device message nor
  renewed user approval at every Gate. This delegates bounded stage execution
  and the in-scope technical decisions defined below, not new product meaning
  or architecture/safety boundaries. Decisions outside that authority return
  to MacBook; the executor must not invent them or waive a Gate.
- A newly authorized execution batch gets a dedicated new Mac mini task. The
  Controller resolves the saved Mac mini JuanerAI project and expected familiar
  repository from current project configuration and uses that saved-project
  checkout directly unless the user or package explicitly requires a managed
  worktree. It never resolves the destination from task recency, foreground
  state, or ambient UI. The initial message binds the exact package branch,
  commit, tree, path and hash. Record the returned task/thread identity, host,
  project, repository and active/ready status before treating dispatch as
  complete. A pending task remains at `MAC_MINI_SESSION_DISPATCH`. An existing
  task is eligible only when the user explicitly identifies that exact task.
  If new-task creation, connectivity, project resolution, or delivery cannot be
  verified, enter `BLOCKED_SESSION_DISPATCH` and preserve the frozen package;
  the fallback is one user-created/opened Mac mini task and one manual forward,
  not delivery to an arbitrary existing task. One task then retains the whole
  execution batch, including normal Gates and bounded exception handling.
  Do not duplicate or migrate a batch that was already delivered and is active
  when this rule is adopted; the dedicated-new-task default begins with the
  next authorized package dispatch.
- At completion, Mac mini stops and emits one delivery receipt; the user
  forwards it once to MacBook. MacBook obtains the code through Git and owns
  review, final acceptance, authorized merge and archive. An unresolved failure,
  out-of-scope decision or missing authority causes an early exception handoff
  instead. The dedicated new-session dispatch above is the approved default;
  its failure uses the bounded manual fallback and does not justify new
  automation development. Reuse approved
  product decisions, D1-A reviews and valid evidence; refresh only facts that
  require freshness or have materially changed.
- Execution errors first use the bounded self-correction rule below when all
  its conditions hold. Other exceptions stop safely with preserved code, raw
  outputs and accurate results. Controller proposes the minimum disposition;
  expanded tool repair,
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

### Bounded Execution Self-correction

On 2026-09-19 the user approved this standing permission for semi-automatic
batches. Within an already authorized stage, the Mac mini coordinator may fix
command arguments, task-local paths/configuration and task-local diagnostic or
validation scripts, then repeat the affected authorized operation, when:

- the cause is an execution mistake, not a product defect or unresolved
  requirement, failed acceptance assertion, incompatible dependency or new
  architecture/contract decision;
- approved inputs, dependency versions/sources, script permissions, write paths,
  assertions, evidence requirements and lifecycle/role Gates remain unchanged;
- the operation is read-only or task-local, reversible and known safe to repeat;
  its previous side effects are understood before another attempt.

Except for the low-risk static reading defined below, allow at most three
correction-and-verification rounds for the same issue,
counted in the existing stage record across sessions and amendments; each round
must narrow the cause or resolve it. Stop on no progress, exhaustion, unknown
side effects or any condition above becoming false. A successful operation is
not rerun merely because its subsequent review stopped. Preserve failed inputs
and outputs; record cause, change, attempt count, result and return point in
the existing verification/traceability/tasks or handoff records. A resolved
execution error stays in its current stage and requires no separate package,
new task, per-attempt user relay, scheduler or repair framework.

Technical design or contract decisions use the separate delegation below;
they are not execution-script corrections. Return to MacBook for decisions
outside that delegation, dependency version/source or script-permission changes,
real data/provider access, host privileges, destructive actions or unknown state.
This permission does not let a coordinator
write production code or permanent tests in place of a required role, weaken
tests/Gates, replay non-idempotent business operations or change the product's
own retry policy. It does not apply to signed Host Loop recovery.

New packages inherit this rule unless they explicitly narrow it. An already
frozen batch adopts it through a user-approved amendment naming that batch;
historical one-use or exhausted approvals do not silently reopen. Other
explicit validation budgets and scope stop lines remain binding.

### Low-risk Static Reading

On 2026-09-20 the user approved a risk distinction for command syntax, quoting,
text-location and extraction corrections. The coordinator may resolve these
locally, without a fixed three-attempt escalation or charging a substantive
Spec/Test/Worker rework allowance, only when the entire operation:

- reads already authorized local text or metadata with ordinary utilities or
  a reviewed text-only parser/hash; it does not import or execute project code;
- has understood effects and no writes except already authorized evidence
  recording, no network/provider call, privilege, host/configuration change,
  temporary-file mutation, product execution or test/build/install operation;
- preserves the input authority, required assertion and evidence standard.

Classify by actual commands and effects, not a "diagnostic" label. Project
syntax checks (such as `node --check`), fixture-health, contract, RED/GREEN,
integration and GUI validation commands
remain subject to their existing validation/correction budgets. A text-table
comparison is static evidence only; empty extraction or an outer exit zero is
not proof of the intended assertion or product behavior. A real content
difference remains a finding; correcting extraction cannot narrow the required
comparison to conceal it.

Use the existing role brief and stage/evidence records; the executing role must
know this boundary before it starts. Record failed attempts and their outcomes,
then return to the original task when resolved. Repeated guesses without a
narrowing cause or new evidence are no progress: stop and escalate rather than
loop indefinitely. Unknown effects, authority changes or genuine content/Gate
findings still stop. Do not replay a successful check or lost historical process
to repair its record. No new tool, ledger or approval per static read is required.

This classification applies prospectively. Frozen packages adopt it explicitly;
past excess and exhausted allowances keep their original records and require
their stated disposition. It never retroactively makes an unauthorized attempt
compliant or relaxes product tests, assertions, role isolation or safety Gates.

### Execution Accounting and Mistaken Pauses

On 2026-09-20 the user approved the following clarification. Keep the three
categories separate in the existing stage record; no new ledger is required.

| Category | What is counted |
|---|---|
| Read/command error | The failed operation and its observed effects; an occurrence is not itself a correction round or a substantive role return. |
| Execution correction round | An actual correction of the same identified execution issue plus its verification attempt. Record cause, change, result and progress, cumulatively under the existing limit. Similar wording in old errors does not prove the same issue or consumed rounds. |
| Substantive role return/rework | A completed work-package return or an actual revision after review under the role budget. Progress messages, evidence clarification and a coordinator-forced partial return are not automatically a new substantive revision. |

The three-round limit applies outside Low-risk Static Reading; the
no-progress/unknown-effect stop lines apply to both. Before declaring
exhaustion or no progress, the coordinator
checks the retained sequence, actual correction attempts and latest result.
A corrected read that already succeeded is progress, not a reason to rerun it
or to terminate an otherwise authorized stage. A brief deviation remains
disclosed even when it has been safely corrected.

Pause immediately when effects or authority are uncertain. If retained evidence
then establishes that the coordinator's own pause was mistaken, the coordinator
records the reason and may resume the interrupted work in the same task when
all original authority, scope, role isolation and safe-resumption conditions
still hold. The pause itself does not create a new substantive rework charge.
A user-requested stop, an actual exhausted budget, a genuine unresolved blocker,
or a frozen package that explicitly closes the allowance still requires its
stated release authority. A real failed assertion or substantive Gate finding
cannot be relabeled a mistaken pause to bypass review or a limit.

Future briefs must distinguish a temporary pause from a completed substantive
return; they must not force a consumed BLOCKED return merely to inspect a safe
read error. Preserve historical counts/verdicts as recorded. Already frozen
one-shot packages adopt this clarification through explicit amendment, not a
retroactive reset. Successful operations and lost historical evidence are not
replayed; unknown effects and out-of-scope decisions still return to MacBook.

### In-scope Technical Decision Authority

On 2026-09-19 the user approved standing authority for the Mac mini execution
coordinator to decide how to implement an already approved product outcome.
A contract/schema/Port label alone is not a MacBook escalation trigger.
The coordinator may approve necessary internal types, fields, versioning,
interfaces, storage mappings and minimal Port/Adapter adaptations, including
additive shared-contract deltas, when all of the following hold:

- the decision implements named approved Requirements/AC and preserves the
  approved UI workflow, business meaning, defaults, failure/recovery semantics,
  data/evidence authority and acceptance obligations;
- existing supported behavior, consumers, CLI and historical records remain
  compatible; the new path is explicit and does not silently replace an old
  contract, fabricate provenance, require historical migration or delete data;
- it stays within the approved architecture and module roots, dependencies,
  permissions and external effects, and introduces only what this Change needs.

Exact filenames inside approved candidate roots may be selected and frozen by
Spec and the coordinator before the relevant role is dispatched. This cannot
override an explicit forbidden path or widen to another module, runtime,
product or enterprise capability. Missing business meaning is not an internal
field-design choice. Incompatibility, migration, changed product/UI or evidence
semantics, security/architecture boundaries, new dependency versions/sources or
scripts, real data/provider access and host/destructive operations outside the
package still require MacBook/user approval.

Use the existing Spec/Design and verification/traceability/task records: identify
the approved need, minimum delta, affected consumers/paths, compatibility and
required evidence, then record the coordinator's delegated decision. No new
approval document, ledger, user relay or MacBook amendment is required for each
eligible choice. The fresh Spec role writes formal specification; the
coordinator does not substitute for Spec, Test, Worker or Validator.

Before implementation, close the delta through the existing ponytail review
when applicable and Spec Gate, then Test/valid RED and TDD_READY. If a later
role discovers a contract gap, freeze affected implementation and return to
Spec/Design locally; refresh affected Gate verdicts, tests and frozen briefs
before resuming. Preserve failed evidence and required assertions. This is not
permission for a Worker to change its contract, a Test role to weaken acceptance,
or a coordinator to count tool failure as RED. Compatibility is proved by the
affected old/new contract suites and independent Validator, not asserted by the
word "additive". Existing correction/complexity budgets and stop lines remain.

Routine in-scope implementation defects use the existing Test/Worker correction
path, not automatic MacBook escalation. Only unresolved or out-of-authority
decisions and exhausted/unsafe correction return. MacBook retains final review,
acceptance, risk waivers, integration and authority expansion. Signed Host Loop
operation is unchanged. New semi-automatic packages inherit this rule unless
explicitly narrowed; an already frozen batch adopts it through an approved
amendment naming that batch, without rewriting its historical inputs.

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
delegation or a decision outside the in-scope technical authority returns to
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

The MacBook Controller retains product and final-acceptance authority; Mac mini
is the sole current-Change executor and exercises only the delegated technical
authority above in semi-automatic mode. Global WIP is exactly 1.
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
