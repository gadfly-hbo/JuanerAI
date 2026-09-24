# Product Change Execution Policy

This document is the sole durable policy authority for JuanerAI dual-device
product execution. Other project documents link here without restating it.

## Current Mode — Product / Engineering Split

The user approved the following long-term semi-automatic division on
2026-09-24. It supersedes the former current-mode rule that made the MacBook
Controller the engineering approval and return point. It does not restart the
old Host Loop, clear WIP, expand a product Change, or grant a new external,
provider, dependency, host, destructive, Git, or release permission.

| Authority | Owns | Does not own |
|---|---|---|
| MacBook Product Manager | Whitepaper and Research Demo interpretation; Blueprint; product proposal and vertical slice; UI Contract; product goal, scope, business semantics, visible behavior, product acceptance criteria, non-goals and prohibitions; product-planning records | ordinary OpenSpec/design choices, internal or compatible shared contracts, paths, commands, environments, validation mechanics, engineering repairs, stage execution, engineering state, or technical sign-off |
| Mac mini Engineering Controller | feasibility; OpenSpec/design/tasks; engineering contracts inside approved boundaries; role dispatch and Gates; test/RED/TDD_READY/Worker/GREEN/regression/retirement/Validator; engineering exceptions and budgets; engineering state; Engineering Acceptance; authorized Git delivery, integration and archive | changing product meaning/UI/scope, crossing architecture/security/data/permission/external-effect boundaries, granting itself budget or permissions, accepting residual risk for the user, or claiming user Product Acceptance |
| User | final product decisions and Product Acceptance; scope/boundary/risk/budget/permission decisions; direct control of the Mini task | role work that remains delegated and in bounds |

Use these full role names in current rules and receipts. An unqualified
`Controller` is ambiguous and does not identify a current authority.

The Engineering Controller asks the user directly in its current task when a
decision exceeds the approved product, architecture, safety, operation,
permission, or budget boundary. It does not return to MacBook by default. The
user may ask the Product Manager to help with product discussion, but that help
is not an engineering approval dependency.

## Product Input and Engineering Intake

The Product Manager freezes a **Product Input Package** containing:

- Change identity and product objective;
- product scope, non-goals, forbidden product outcomes, and deferred returns;
- exact UI Contract identity and user UI Gate verdict;
- business terminology, semantics, defaults, visible failures, cancellation,
  recovery, and product acceptance criteria;
- adopted Whitepaper/Demo sources with versions and applicability limits; and
- product, data, safety, permission, cost, and external-effect stop lines known
  at product freeze.

The Product Input Package does not need to preselect internal types, schemas,
Ports, file paths, commands, tool locations, environment variables, test
harnesses, or evidence capture mechanics. Those are Engineering Inputs unless
they are themselves part of the approved user-visible behavior or an upper
boundary.

The Engineering Controller performs a read-only intake against the current
repository, branch ownership, active WIP, frozen product input, existing code,
and retained evidence. It then creates or updates the existing Change's
engineering package: feasibility result, OpenSpec, design, contracts, allowed
paths, task slices, role briefs, toolchain/dependency plan, validation plan,
budgets, stop lines, and Git delivery plan. It records contradictions rather
than silently changing product input.

A newly transferred execution batch normally uses one dedicated Mac mini task
bound to the saved JuanerAI project, with the product package identity in its
initial message. An already active batch remains in its explicitly identified
task; responsibility adoption never duplicates or migrates it. A manual
create/open-and-forward by the user is an acceptable handoff and does not
justify a new scheduler or message system.

Git publication, message delivery, task existence, or branch fetch is not proof
of intake. Adoption requires a receiver readback of the exact rule/product
identities, repository/task/branch, current stop point, preserved history and
next permitted action. Until that receipt exists, status is `UNCONFIRMED`.

## Current Semi-automatic Lifecycle

The Product Manager owns:

```text
Request -> Explore -> Product Proposal -> UI Contract -> User UI Gate
-> Product Input Freeze
```

After confirmed intake, the Engineering Controller owns:

```text
Feasibility -> OpenSpec / Design / Tasks -> Spec Gate -> Test / causal RED
-> TDD_READY -> Worker -> GREEN / Regression -> Test Asset Retirement
-> independent Validator -> Engineering Acceptance -> authorized Git delivery
-> applicable Product Acceptance -> integration / archive
```

The exact order of delivery, Product Acceptance, merge, and archive follows the
frozen Change and its Git authority. Engineering Acceptance or Validator PASS
never impersonates a required Product Acceptance. Where Product Acceptance is
required, the Engineering Controller asks the user directly and records the
verdict before the dependent transition.

The configured Spec, Test, Worker, and Validator roles remain fresh and
isolated. The Engineering Controller performs delegated stage checks; it does
not substitute for those roles. Role isolation, OpenSpec, valid RED,
TDD_READY, regression, Test Asset Retirement, independent validation, honest
UNKNOWN reporting, and executable evidence remain mandatory.
Validator independence comes from a fresh role/context, read-only permissions,
and frozen inputs; it does not require a second device.

## In-scope Technical Decision Authority

The Engineering Controller may approve internal types, fields, schemas,
versioning, interfaces, storage mappings, paths, commands, environments, and
minimal Port/Adapter or compatible shared-contract changes when all are true:

- the decision implements named approved Requirements/Acceptance Criteria and
  preserves product meaning, UI behavior, defaults, failure/recovery semantics,
  evidence authority, and product acceptance obligations;
- existing supported behavior, consumers, CLI, and historical records remain
  compatible, with no silent replacement, fabricated provenance, unapproved
  migration, or data deletion; and
- it remains inside approved architecture, security, data, dependency,
  permission, module, cost, and external-effect boundaries and introduces only
  what the current Change needs.

Spec writes the formal contract and Design; the Engineering Controller records
the approved need, minimum delta, affected consumers/paths, compatibility,
required evidence, decision, and Gate in existing Change records. Exact paths
inside approved candidate roots may be frozen there; forbidden paths and module
boundaries remain binding. Compatibility needs affected old/new contract suites
and independent validation, not merely an "additive" label. If a later role finds a gap, affected implementation
freezes and returns locally to Spec/Design. Repeat the affected Spec Gate, Test
Design/RED, TDD_READY, briefs, and verification before resuming. Worker never
changes its own contract, Test never weakens acceptance, and a tool failure is
not product RED.

Changed product meaning/UI/scope, incompatibility or migration, a new
architecture/security/data boundary, a dependency source/version outside the
approved dependency plan or a new script permission, real
data/provider access, new host/destructive operation, or another permission or
external effect goes directly to the user. It is not routed to MacBook for
technical approval.

## Bounded Execution Self-correction

Ordinary diagnosis and correction stay in the Mini task while scope, role
isolation, assertions, side effects, dependency sources, permissions, and the
approved engineering budget remain unchanged. Preserve failed commands,
outputs, UNKNOWN, side effects, consumed role returns, and budget counts.

This covers command arguments, task-local paths/configuration and authorized
task-local diagnostic or validation scripts, not product defects, failed
acceptance assertions, incompatible dependencies, or unresolved contracts.
Repeat only an authorized read-only or task-local, reversible operation whose
previous effects are understood and which is known safe to repeat. It does not
permit direct production/permanent-test work in place of the required role,
replay of non-idempotent operations, or a change to product retry behavior.

For the same execution issue, allow at most three correction-and-verification
rounds, counted cumulatively across sessions and amendments in existing stage
records, unless the frozen package sets a narrower bound. Each round must narrow
the cause or resolve it. Repeated failure triggers root-cause analysis and, when
needed, task re-slicing; it does not permit indefinite retry, relabeling, or
self-increasing a budget. A successful operation is not replayed merely because
a later review stopped.

## Low-risk Static Reading

Pure static reading errors may be corrected without a fixed three-round limit
or charging a substantive Spec/Test/Worker return only when the operation reads already authorized local
text or metadata, does not import or execute project code, changes no state
except approved evidence recording, has understood effects, and preserves the
assertion and evidence standard. It makes no network/provider call, host or
privilege change, temporary-file mutation, or project execution. Syntax, build, test, fixture-health,
RED/GREEN, integration, and GUI commands are not static reading. Repeated
guessing without a narrowing cause is still no progress.

Classify actual effects, not a diagnostic label. Empty extraction or outer exit
zero is not a proven assertion; a real content difference remains a finding.
Disclose failed attempts, preserve full comparisons, and never replay a
successful check or lost historical process merely to repair its record.

## Execution Accounting and Mistaken Pauses

Keep these distinct in the existing stage record; no new ledger is required:

| Category | Counted evidence |
|---|---|
| Read/command error | failed operation and observed effects; not by itself a correction round or substantive role return |
| Execution correction round | actual correction of the same identified issue plus verification; cause, change, result, progress, and cumulative count |
| Substantive role return/rework | completed work-package return or actual reviewed revision under its budget; not automatically a progress message, evidence clarification, or forced partial return |

Check the retained sequence before declaring no progress or exhaustion. A safe
corrected read that succeeded is progress; it need not be repeated. A temporary
pause adds no substantive rework charge. If evidence establishes that the
Engineering Controller's own pause was mistaken, it may record the reason and
resume only when original authority, scope, role isolation, and safe-resumption
conditions still hold. A user stop, real exhausted budget, unresolved blocker,
failed assertion, or explicitly closed allowance still needs its stated release
authority. Do not relabel these as mistaken pauses.

The Engineering Controller stops and asks the user in one concentrated decision
request when it needs extra budget, acceptance of residual risk, a scope or
boundary change, new permission, or resolution of genuinely unknown or unsafe
effects. A normal command error does not create a cross-device approval flow.
Historical failures, deviations, UNKNOWN, and consumed allowances are never
reset, erased, or retrospectively authorized by a role change.

These retained correction and accounting rules are prospective. New packages
inherit them unless explicitly narrowed; an already frozen package adopts them
through a user-approved amendment naming that batch. Responsibility adoption
does not reopen historical one-use/exhausted allowances or change recorded
counts. The current stopped B2 package remains subject to its separate resume
decision and remaining round 2/2; it is not a mistaken-pause exception.

## State, Evidence, and Single Writer

`.juanerai/project-control/status.json` remains the sole current project-board
state and is atomically replaced through the existing status CLI. The Mac mini
Engineering Controller is the single writer for the active engineering Change.
Workers and validators return evidence to it. MacBook maintains product
planning and may display or explain delivery, but it is not the required relay
or writer for live engineering progress.

The current board CLI and static fallback still emit the legacy machine/display
label `controller`. That label grants no authority and, for new current-mode
writes, is a compatibility alias only for the Mac mini Engineering Controller;
it never means the Product Manager. Renaming the schema enum and fallback UI is
a separate bounded tool Change with backward-compatible old-event readback, not
part of this responsibility adjustment.

Before every material transition, the Engineering Controller updates the
current Change's verification, traceability, tasks, and project-control state
as applicable. Record prior/current state, Gate and authority, frozen identities,
exact commands/results, durable evidence, outstanding risks, consumed budget,
and next action. Status labels never replace evidence. Events remain
best-effort history; no second board, state database, ledger, scheduler, or
recovery framework is created.

Ordinary source browsing need not archive every read-tool invocation. Gate,
identity, scope/write, and validation claims retain actual commands, environment,
inputs, complete stdout/stderr, numeric exit and completion evidence as required
by the frozen package. A narrative summary is not raw process evidence; missing
historical evidence stays UNKNOWN and is not reconstructed by replay.

Formal source, specs, tests, decisions, and approved state travel through Git.
Raw evidence follows AGENTS.md Development Material Preservation and
`docs/templates/HANDOFF_BACK.template.md`. Git references do not copy external
logs, and acceptance cannot depend on an unreadable locator.

## Git Delivery and Acceptance

Exactly one device owns and writes a work branch at a time. Preserve dirty
worktrees and existing changes; use PR, squash, and ff-only protection from
`git-development-workflow.md`.

Within user-granted Git authority, the Engineering Controller organizes code
review, branch push, PR, required acceptance checks, squash merge, OpenSpec
archive, delivery receipt, and readback. MacBook technical sign-off is not
required. Missing commit, push, PR, merge, archive, release, deployment, or
credential permission goes directly to the user and is never inferred from the
role split. Git authority never waives Product Acceptance or another lifecycle
Gate named by the Change.

## WIP and Responsibility Takeover

Global product WIP remains one. Preserve the active pointer, State, pause,
Ledger, branch ownership, evidence, failed attempts, UNKNOWN, and consumed
budgets. A role handover is not a new Change, a restart, an acceptance, a WIP
clear, or authorization to resume.

The current bounded takeover facts and receipt contract are in
`docs/planning/2026-09-24/xanthil-desktop-engineering-controller-takeover-001.md`.
That note does not modify old WIP records or release their stop line. The
Engineering Controller must ask the user directly in the original Mini task for
any resume decision or authority still missing after adoption.

## Product Plan Authority

The current product-plan authority and return point are recorded in
`docs/planning/README.md`. Historical plan withdrawal remains effective. A
withdrawn plan, accepted Demo, Blueprint publication, or development-readiness
PASS does not authorize product execution, external data, provider calls,
dependency installation, schema creation, merge, release, or deployment.

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
