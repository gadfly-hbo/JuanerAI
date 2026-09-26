# Product Change Execution Policy

This is the sole durable execution-policy authority for JuanerAI dual-device
product work. Supporting rules and role instructions implement this policy;
planning drafts explain the design but are not a second authority.

## Applicability and Adoption

The user-approved 2026-09-26 continuous-engineering revision (v0.8) retains the
2026-09-24 Product Manager / Engineering Controller split. It replaces the
default four-role serial pipeline, universal Spec Gate and TDD_READY dispatch
approvals, separate Test Asset Retirement Gate, automatic reasoning escalation,
and ordinary correction-count renewal in the current semi-automatic path.

Publication and adoption are separate. New work must identify the published
policy version and approved product input. An active Mini task adopts at a safe
boundary only after reading back that version, its actual loaded roles, the
preserved task/branch/tree, replaced old restrictions, remaining real resource
limits, unresolved decisions, and next permitted action. Until then adoption
is UNCONFIRMED. Receipt alone does not resume a stopped product task.

An active task keeps its Change identity, branch ownership, code, uncommitted
work, valid product approvals, evidence, failures, UNKNOWN and spent resources.
The adoption record names which old role/attempt restrictions this user-approved
revision replaces once; it does not grant repeated exceptions. An explicit user
stop, exhausted real resource budget, missing authority or unsafe effect still
needs its own release decision. No new task, WIP migration, retroactive approval,
history reset, Host Loop restart, dependency installation, provider/data access,
host/destructive operation, Git delivery or release is authorized by this policy.

## Authorities

| Authority | Owns | Does not own |
|---|---|---|
| MacBook Product Manager | Whitepaper/Demo interpretation; Blueprint; product scope, UI, business meaning, acceptance criteria, prohibitions and planning | routine engineering contracts, paths, commands, environments, repairs, state or technical sign-off |
| Mac mini Engineering Controller | intake, feasibility, work-package boundaries, important engineering decisions, progress diagnosis, single engineering state, engineering acceptance and authorized Git delivery | changing product or safety boundaries, granting new permissions/resources, accepting residual risk for the user, claiming Product Acceptance |
| Engineering agent (`juaner_worker`) | necessary engineering spec/design, tests, implementation, diagnosis, integration and affected verification inside its work package | changing product commitments, weakening acceptance, expanding its own authority, final validation of its own candidate |
| Independent Validator | acceptance-first evaluation of a fixed complete candidate and its evidence | authoring/repairing that candidate, granting acceptance, Git or execution permission |
| User | final product, scope, boundary, permission, resource, risk and required Product Acceptance decisions | routine in-boundary corrections already delegated |

Use these names; an unqualified Controller does not identify a current
authority. Mini asks the user directly in the original task when a decision is
needed. MacBook participation is optional product support requested by the user.

## Product Input and Engineering Intake

MacBook freezes the existing Product Input Package: Change identity, approved
objective/scope/non-goals, business and failure semantics, exact UI Contract and
user UI approval, acceptance criteria, prohibitions, reference versions and
known safety/data/permission/resource boundaries. Reuse an applicable approved
UI Contract; materially changed visible behavior requires the user's affected
UI approval. Research Demos are behavior references, not production authority.
New or materially revised product plans retain the existing independent
development-readiness review; it checks product gaps, not implementation names.

MacBook does not pre-freeze private types, file names, commands, environments,
fixtures or evidence mechanics. Mini reads the real repository, branch, WIP,
code, evidence and stopping point before defining a result-sized work package:

- one demonstrable or independently verifiable result, approved behavior and
  acceptance references, non-goals and prohibitions;
- allowed module/directory roots, conditional/forbidden paths, important
  compatibility promises and safety boundaries;
- approved toolchain, validation effects/entrypoints, evidence root and Git
  permissions; normal safe parameter/path choices within that scope may evolve;
- existing resource limits, unresolved decisions and next permitted action.

Inside already authorized roots and effects, do not require a new approval for
each file, command or role return. Allowed, conditional and forbidden paths
remain binding. A package may span Store, Application, Profile and UI. Splitting
preserves overall scope, history and resource limits. Use existing OpenSpec/task/
handoff locations, not another PRD, authority package format, board or approval
system. The existing authority-package template is an optional reference only
when already selected by the Change; it is not an additional required artifact.

A message, Git fetch, published commit or task existence is not receiver
adoption. Manual forwarding by the user is sufficient; no message automation is
required. Do not create or migrate tasks without the user's explicit request.

## Continuous SDD and TDD

After approved product/UI input and engineering intake:

```text
result-sized work package
-> one engineering agent: behavior spec -> causal RED -> minimal GREEN
   -> necessary refactor / next behavior -> regression and candidate freeze
-> independent Validator -> Engineering Acceptance
-> required Product Acceptance and authorized delivery / integration / archive
```

For each behavior, first state the smallest sufficient engineering specification
in the existing Change: input and observable output, important success/failure
rules, forbidden effects, acceptance reference and any necessary contract
decision. Resolve load-bearing product ambiguity before implementing it.
Internal design may evolve; changing an approved commitment requires the
appropriate decision before dependent implementation.

Then write and run the test, observe failure caused by the missing behavior,
implement the minimum change to make it GREEN, and refactor only while GREEN.
Keep this a small vertical loop, not a system-wide test-writing phase. Environment,
import, locator and fixture failures are not causal RED. A missing prerequisite
may mask later assertions; disclose that and actually execute all required
assertions in final verification. Pure refactors use pre/post GREEN and relevant
equivalence evidence; documentation-only work does not fabricate RED.

The same engineering agent writes tests and code within the authorized roots,
preserving unrelated edits, acceptance assertions and negative/failure cases.
It may correct stale fixtures and private interfaces, update necessary design,
and retire test assets with retained coverage proof. Build the thinnest real
approved runtime path early. Run affected type/build, contract, integration,
regression and security checks proportionate to the actual change.

Spec and Test specialists are optional scoped support, not mandatory stages;
they do not import the retired approval chain. A contributing specialist cannot
validate its own candidate. The final Validator remains fresh and read-only.
An unavailable role is disclosed, not silently replaced with author self-review.

## Engineering Decisions and Local Correction

Ordinary private interfaces, local types, fixtures, command parameters and
evidence locations are continuous engineering work when meaning, compatibility,
permissions and effects remain in bounds. A technical word, cross-file edit or
call through an existing database interface is not by itself a boundary change.

Before changing an important public/compatibility, persistent-data, authority or
irreversible-effect contract, Mini identifies the specific impact and necessary
checks in the existing design. It can decide in-boundary engineering choices;
product, architecture, security, data, dependency, permission, cost or external
effect expansion goes directly to the user. Update only affected spec/design
and tests, then return to development, not the entire former Gate chain.
Use CONTRACT_CHANGE_REQUEST only for a material contract decision, not every
private adjustment. Never weaken product requirements or tests to fit a defect.

Thus authorized new log IDs, corrected SHA records with stable sources, stale
test fixtures, compatible private parameters and restoration of approved behavior
close locally without new user approvals or per-action Mini sign-off. Generate
unique non-overwriting evidence IDs; they are not an enumerated allowance.
Compute identities from actual inputs, preserve bad records, and rerun affected
verification when needed; a new hash cannot authenticate unbound old output.
Unsafe/unapproved data deletion or boundary-breaking changes stop for the user.

## Progress-based Stop-loss and Real Resource Limits

Authorization to deliver the result includes normal design/test/implementation,
debugging, regression and review repair. There is no ordinary role-return,
correction-command or total-repair-count renewal. Counts may signal a need for
internal diagnosis; they do not alone trigger user approval. Do not require a
new numerical quota when the user has not imposed one.

User-set cost, compute and execution-time limits remain hard boundaries.
Platform limits cannot be bypassed. No numerical cap does not authorize new
paid resources, providers or external effects. Preserve actual consumption.

Progress needs evidence: eliminating a relevant cause, narrowing failure
conditions, enabling a real path or closing an original acceptance point.
Diagnostic learning must lead toward a verifiable repair of the current result;
repeated new observations without narrowing the blocker or an executable repair
path are non-convergence. New files, more rules, weaker tests, new IDs/agents or
session changes are not progress and do not reset history.

When the same problem repeats without useful progress, stop blind retries.
Mini diagnoses from existing evidence. A supported in-boundary alternative may
receive one bounded attempt with a hypothesis and an observable exit condition.
If no viable route exists, or the attempt returns to the problem without
progress, stop affected work and ask the user for a concrete scope/approach/
resource/risk decision, not just more attempts. This is not a renewable quota.
Use existing work returns; no per-round progress report or new accounting system.

User stops, unknown side effects, missing permissions and actual resource limits
take precedence even when progress exists. Investigate uncertain effects
read-only first; stop affected actions if safety remains unknown. After timeout,
check processes and effects before repeating only known-safe operations.
An erroneous self-imposed pause may be corrected with evidence only when original
authority remains valid; it cannot relabel a real stop or missing evidence.

## Independent Validation and Acceptance

Before inspecting the implementation explanation and author tests, Validator
derives its key positive, negative and failure expectations from approved
product acceptance and necessary contracts. This is a reading order within the
same review, not another artifact or Gate. Independently exercise the key real
business and failure paths in the approved environment, then compare the full
candidate, tests and claims. Mocks cannot replace the behavior being proved.

Freeze the complete candidate (committed, staged, unstaged and added scope) and
evidence; overlapping pre-existing changes need attribution, not blanket exclusion.
Verify causal RED, test sensitivity, negative cases, relevant quality/regression,
scope/architecture/safety and evidence identity. Test retirement is part of this
review under `test-asset-retirement.md`, not a separate PASS prerequisite.

A blocking finding identifies an acceptance failure, concrete engineering defect,
violation of an approved architecture/safety/permission/contract boundary, or
material evidence gap that prevents a required claim. Give the affected requirement
or boundary, counterexample/evidence and recheck condition. Formatting, preferred
implementation style and nonessential document tidying are advisory when they
do not affect those claims. Missing authority or meaningful evidence is never
reclassified as cosmetic.

Return all material findings together when inputs suffice. Engineering repairs
continuously; revalidate the new fixed candidate's affected and collateral risks
in an independent read-only context. Do not reuse invalidated PASS or restart
unaffected stages. Mini checks blockers, candidate identity, authority and
acceptance obligations without repeating the entire code review.

Validator PASS, Engineering Acceptance, user Product Acceptance, Git merge and
deployment are different claims. Preserve required user/UI acceptance; a risk
waiver requires an explicit user decision and never becomes a Validator PASS.
Delivery/acceptance/merge/archive order follows the task's actual permissions.

## State, Evidence and Delivery

Mini alone writes `.juanerai/project-control/status.json` through the existing
CLI at material result, phase, blocker, decision and acceptance transitions.
MacBook maintains planning; its last synchronized copy is not live Mini status.
Workers and Validator return evidence, not competing board writes. Existing
machine label `controller` means Mini Engineering Controller in this mode.
Do not change the board schema or create a second state authority.

Use existing OpenSpec records for necessary spec/design, acceptance-to-test/
code/result traceability and verification references. No empty mandatory
document suite or duplicate phase log. Preserve required evidence under the
existing device-local persistent root: actual commands/environment/inputs,
complete outputs and exits, failures and UNKNOWN. Ordinary source reads need
not each have an archive. Follow AGENTS.md and HANDOFF_BACK for evidence identity
and receiver access; do not reconstruct lost historical results as past PASS.

One device writes a branch. Preserve dirty work; use the existing PR/squash/
ff-only protections. Mini organizes review, authorized Git delivery and archive
without MacBook technical sign-off. Missing Git/release permission goes directly
to the user. Git publication and a readable receipt do not transfer branch
ownership or authorize the next Change.

## Preserved Product and Historical Boundaries

Product authority remains at `docs/planning/README.md`. Withdrawn plans stay
void; a Blueprint, Demo or development-readiness PASS does not itself authorize
product execution or external operations. Global product WIP remains one.
Do not edit old pointer, State, pause, Ledger or historical worktrees.

The 2026-09-24 takeover note is a historical snapshot, not a live Mini stop-point
claim. Verify the original task's current state at adoption; keep all unresolved
safety/product obligations and the separately required resume decision.

## Signed Automatic Host Loop — Separate and Inactive

The signed automatic execution, release, and recovery mechanism is not the
current semi-automatic path and is not restarted or modified by this role
split. Its historical `Controller`, signed DISPATCH/REVISION/RELEASE, pointer,
Ledger, and host semantics describe the authority frozen into that mechanism;
they do not make MacBook a current engineering approval node.

Before any future Host Loop use, the user must separately authorize a bounded
role-alignment change that names the signing, review, release, project-control,
Git, and direct-user decision authorities. Until then, existing Host Loop state
and safety checks remain preserved and no new signed command is issued.

### Legacy Authority and Global WIP

The following authority names are retained only for the inactive signed Host
Loop contract. The `MacBook Controller` below is the legacy signer/reviewer
named by that contract, not the current Product Manager or Engineering
Controller. Global WIP is exactly 1.
`active-change.json.active_change_id` is the sole WIP authority. Task-tracker
records, scheduling facilities, Ledger, Evidence Ref, branches, PRs, and scans
are observational only and never infer an empty slot.

The legacy Controller owns the signed authority package, PR review,
`changes_requested`, archive decision, Acceptance, squash merge, RELEASE,
project-control, and authorization of future automatic work. The automated host
can act only on the currently signed Change. This paragraph grants no current
semi-automatic authority and cannot be used until the user-authorized alignment
above is complete.

### D1-A Intake — Retained Product Gate

Before initial signed automatic product execution, D1-A requires one fresh
read-only Product Plan Reviewer. An already completed applicable review is
reused, not repeated because the mode changed. The Reviewer receives only the
plan, formal attachments, explicitly cited JuanerAI authority, and its
seven-part review brief. Findings are classified as `SPEC_BLOCKER`,
`TEST_REQUIRED`, `IMPLEMENTATION_DETAIL`, `ACTIVATION_OR_HOST_VALIDATION`, or
`NON_BLOCKING_FOLLOWUP`.

The legacy Controller may make at most one bounded semantic correction and then
does a targeted readback. It does not automatically launch a second Reviewer.
There is no post-DISPATCH Reviewer route. The final Artifact Package and review,
correction, disposition, and receipt hashes are frozen before signature.

### Signed Automatic Execution

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

### Automatic Review, Archive, Release, and Final Stop

The first Handoff stops at `AWAITING_CONTROLLER` and does not archive. After PR
review the legacy Controller alone may sign an archive REVISION binding the
current Frozen Candidate and exact active, archive, and canonical paths. The Mac
mini performs only that mechanical same-scope archive, creates a descendant
Candidate on the same branch and PR, and repeats final validation, Validator,
and Handoff. It never decides archive or Acceptance.

After legacy Controller Acceptance, squash merge, archive readback, and
MacBook-main readback, signed RELEASE allows only the existing clean ff-only Mac
mini main synchronization, durable CLOSED state, and pointer-clear-last
sequence. RELEASE does not merge, push main, clear evidence, or authorize a new
Change.

Successful activation ends only at
`ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`. A separate
explicit user authorization and a completed new D1-A intake are required before
the first or any next product Change.

### Automatic Fail-closed Recovery and Rollback

Candidate commit, branch push, Ledger append, and final PR/Handoff remain the
only four automatic readback boundaries. Unresolved ambiguity becomes
`MANUAL_CONTROLLER_STOP`; restart never invents route, scope, state, credential,
or recovery authority.

Rollback stops ingress and restores the exact recorded installation or absence
while preserving the active pointer, Coordinator state, Ledger, Handoff, canary
evidence, and Git history. It never resets history, clears WIP, deletes evidence,
or claims success without readback.
