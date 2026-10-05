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

The 2026-10-03 browser/internal-trial alignment implements the approved
[roadmap revision 002 §7](../planning/2026-10-03/juanerai-blueprint-v4.1-full-change-roadmap-v0.1.md#7-交给-mini-后怎样连续推进)
and [product slice §7.2](../planning/2026-10-03/xanthil-task-experience-integration-proposal-v0.1.md#72-给工程师-agent工程规则最小调整-prompt)
published at `d89f7d45f6c5ecab7440d66e4747ee3ef6625826`. It retains formal
Changes, user UI approval, independent validation and required CI.

The 2026-10-04 efficiency adjustment adds impact-scoped CI and fixed role effort
under `agent-model-routing.md`. It retains continuous Worker spec/design/TDD,
independent final validation and the adoption boundary below; it does not
transfer package design back to Controller or authorize dynamic effort routing.

Publication and adoption are separate. New work must identify the published
policy version and approved product input. An active Mini task adopts at a safe
boundary only after reading back that version, its actual loaded roles, the
preserved task/branch/tree, replaced old restrictions, remaining real resource
limits, unresolved decisions, and next permitted action. Until then adoption
is UNCONFIRMED. Receipt alone does not resume a stopped product task.
Publication does not force other in-flight sessions onto a new baseline.

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
known safety/data/permission/resource boundaries. Reuse valid same-batch product,
UI, authorization and environment decisions; resolve only missing, expired or
changed items without extending permissions or resetting consumption. One approved
UI Contract may cover several Changes when applicable to each; new or materially
changed visible behavior requires the user's affected UI approval. Research Demos
are behavior references, not production authority.
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
Keep formal Changes result-sized: the global roadmap is neither one giant
Change nor permission to start all candidates. Commits, internal subtasks and
ordinary corrections do not each restart product preparation or the full workflow.

A message, Git fetch, published commit or task existence is not receiver
adoption. Manual forwarding by the user is sufficient; no message automation is
required. Do not create or migrate tasks without the user's explicit request.

## Lean Context and Continuous Ownership

At initial engineering dispatch, give the Worker a focused task context rather
than the full Product Manager/Controller conversation. Use the existing work
package: result and acceptance references, current input/baseline identities,
allowed roots/effects, limits/stops and unresolved risks, plus accessible source
and evidence pointers. Read required authority, acceptance, applicable contracts
and target code before acting; load further material when the current question
requires it. Context reduction never omits a binding constraint, relevant failure
or UNKNOWN. A missing reference needed for a decision is a gap, not permission
to guess; no duplicate briefing document is required.

One Worker owns the result-sized package through engineering design, tests,
implementation, diagnosis, affected regression and review repairs. Resume that
context with the changed decision/finding, affected scope and evidence pointers;
reuse valid inputs instead of resending or rereading the whole package. Refresh
invalidated inputs when the baseline, authority or task changes. If context is
unavailable or unreliable, recover from existing spec/verification/handoff and
live worktree evidence, preserve history and stops, and ensure only one active
writer owns the package. A routine correction does not start another role.

Worker progress is a concise delta: acceptance point advanced, actual result,
next action or blocker, and evidence locator. Send it at meaningful outcomes or
new blockers while continuing authorized work; a progress update is not a task
return or request to continue. Full handoff is for the package outcome, a real
decision/execution boundary or diagnosed non-convergence. Keep complete raw
evidence at its existing root rather than copying logs into both conversations.

Mini uses those deltas for decisions and status, opens underlying evidence when
needed to assess identity, risk, a blocker or acceptance, and does not replay
the Worker's ordinary debugging or duplicate the Validator's review. A resolved
decision returns to the same Worker with the bounded change; unaffected work
continues. Mini owns result collection and the next authorized action: use the
available wait/notification mechanism, or an already authorized follow-up, to
consume returns and continue without another user prompt. Ending a reply while
a detached process runs is not automatic continuation; before yielding establish
how this task will resume, or disclose the concrete unsupported continuation
boundary. Report user decisions and completion honestly, not ordinary milestones
as completion. This introduces no scheduler, polling quota or new permission.

### Native-first Role Execution

Use the parent task's native `juaner_worker` and independent
`juaner_validator` by default; optional Spec/Test support follows the same
native-first preference. Terminal `codex exec` / `codex exec resume` as a
replacement for an engineering role is a lower-priority exception, not an equal
alternative. Before using it, obtain the user's explicit consent identifying
the task/role, concrete reason, bounded scope and endpoint. Historical CLI use,
general development permission or native-role unavailability is not that
consent. Reuse still-valid explicit exception consent inside its stated bounds;
ordinary commands and corrections do not each renew it. A changed exception
boundary requires the user's decision.

An approved exception retains the role's instructions, fixed model/effort,
sandbox, permissions, single writer, result collection and author-independent
final validation. Disclose actual loaded settings; an exception cannot bypass
a role, safety or permission boundary. Ordinary terminal tests, builds and
already authorized host verification are not CLI role substitution and retain
their existing permissions. This adds no launcher, scheduler or approval stage
to the normal native workflow.

On a user stop, Mini interrupts the affected agents and verified task-owned
processes through authorized controls, checks that work has stopped and records
any remaining activity or uncertainty. An interrupted parent turn does not
prove its children stopped. If controls or authority are missing, disclose the
specific gap and seek the needed decision; do not claim a completed stop.

Switch routes at a safe boundary only after the previous writer and affected
task processes have stopped. In the same parent task, Change and worktree,
transfer a focused checkpoint from existing spec/verification/handoff records:
candidate identity, valid evidence, interrupted checks, failures/UNKNOWN,
remaining limits and next action. Do not claim native resumption of a CLI
session; preserve its history and reuse the receiving Worker thereafter.
Read back the adopted route and actual roles. Rule adoption or a route change
does not lift an explicit user pause or reset acceptance and consumed resources.

When claiming efficiency gains, compare equivalent accepted work including Mini,
Worker, Validator and repair/coordination, distinguishing cached input, other
input and output from elapsed time and user interventions. Use available logs
and the existing retrospective; missing measurements remain unknown, not a new
benchmark stage or evidence of lower cost from quieter UI alone.

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

For affected user-visible claims, verify the normal supported user entry and
its actual configuration, not only a test launcher or helper. Check that the
approved UI communicates choices, state and required limits in user-readable
terms; raw payloads do not substitute for that experience. Cover relevant
first-use/reopen, failure after persistence, retry/readback and lifecycle paths
when the changed behavior depends on them. Helper-only replay or idempotency
tests do not establish the UI-to-storage sequence. Reuse still-valid evidence
for unaffected behavior; this is not a whole-product retest or an extra Gate.
Unapproved provider/data/host effects remain untested and explicitly limited,
not implicitly authorized to obtain real-path evidence.

Before a costly validation run or publication, use the current executable
entrypoints and CI definition to identify the applicable commands, required
environment and approved input artifacts. Reuse that invocation with its input
identities in existing verification; do not reconstruct it from partial old
logs or duplicate changing file counts/hashes in instruction documents. When
source layout, package inputs or validation entrypoints change, check affected
CI manifests/contracts early and run the applicable existing regression before
delivery. A stale derived inventory/fixture may be corrected in scope with
source-based proof; a dependency, trust pin, acceptance or permission change
keeps its own authority boundary. Missing approved inputs are setup failures,
not product RED. Disclose unavailable platform checks; a local subset is not
CI PASS and a CI definition is not permission to install or download resources.

CI reliability is part of this engineering loop. Keep one required CI result;
select checks by proven impact, not line count, an agent's label or a filename
containing `desktop`. The trusted PR-base classifier owns this selection:

| CI scope | Selection and evidence |
|---|---|
| Documentation | Explicit non-runtime Markdown paths: diff checks; no product dependency installation or unrelated harness selftests. Necessary content/reference checks remain in the applicable product/governance review. |
| Affected | Only a small explicit mapping with known consumers and closed impact: execute the mapped checks and necessary boundary regression. Initially this covers model/effort-only edits to the existing project/role TOMLs, with parsed non-routing fields unchanged and the complete role configuration checked. It does not cover arbitrary role instructions, permissions or product modules. |
| Full portable | Unmapped/unknown scope, runtime behavior, safety/permissions, persistence/migration/replay, public contracts, shared dependencies, build configuration, or CI selection/checking machinery itself. Run the canonical portable matrix and applicable configuration checks; native acceptance remains separate. |

Combine mapped checks for a mixed change only when every changed object is
proven covered; an unmapped or risky object requires the full path. Preserve
structural fallbacks for deletion, rename/copy, symlink and mode changes. Changes
to the selector, its mapping, workflow or check helpers cannot grant themselves
lighter validation. Keep `tools/harness/validation/run` as the complete default
offline entry and reuse the checked-in CI/check entrypoints locally. Missing
validation prerequisites fail closed; they do not grant a lighter scope or
permission to install anything.

The TOML configuration check uses Python 3.11+ standard-library `tomllib`.
Select an already available compatible interpreter through the command-local
toolchain when running these checks locally; the older product runner's Python
minimum alone does not prove this check is available. Do not silently skip it
or install/upgrade the host to satisfy it.

Report the selected scope and omitted checks. Documentation or affected PASS
is not complete product regression or formal Change acceptance. Formal Changes
still finish their applicable regression, independent verification and required
user acceptance; CI selection does not postpone those to stage end. Extend the
small mapping only with actual consumer and failure-path evidence, not a new
dependency-analysis platform or per-change approval process.

Keep deterministic regression for false positives, source/fixture drift,
scope selection and failure propagation. Retain approved input/trust pins;
deriving a new hash does not approve its source. Test optimization preserves
acceptance, negative inputs, isolation and required real-boundary evidence.
Consolidate equivalent cases only with retained failure sensitivity; prefer
observable outcomes to incidental file ordering or internal call sequences.
Measure representative pre/post cost before claiming a performance improvement;
stream failure output and show suite timings in the existing verification log.
Classify repeated CI failures from evidence before retrying. A green rerun or a
larger timeout does not close an unexplained failure, and routine in-boundary
CI correction follows the same engineering package without another approval.

Spec and Test specialists are optional scoped support, not mandatory stages;
they do not import the retired approval chain. A contributing specialist cannot
validate its own candidate. The final Validator remains fresh and read-only.
An unavailable role is disclosed, not silently replaced with author self-review.
Use Lean Context and Continuous Ownership for dispatch, progress and resumption;
ordinary spec/test edits and commands stay inside that engineering loop.

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

## Verification Cadence and Internal Trial

These are work/claim distinctions within the existing lifecycle, not new Gates.

| Work / claim | Applicable verification and feedback |
|---|---|
| Daily iteration | Run affected tests and the relevant main path; retain valid RED/GREEN and key counterexamples. Reuse unaffected evidence, product/UI approvals and the engineering context rather than repeating full regression or dispatching a Validator for each edit. |
| Early internal trial / preview | Within approved trial, data/model, budget and environment permissions, identify fixed code/runtime configuration, approved inputs, available paths, actual checks, unopened scope and known issues. Verify the exposed path's safety, authorization, calculation/evidence, saving and stopping/recovery before feedback. The first approved simple-mode path need not wait for all S1 variants; this is not formal Change/stage acceptance or external/commercial trial authority. |
| Complete result / formal Change | Complete applicable regression, independent validation and required user Product Acceptance for that Change; retain required CI before authorized merge. A batch label cannot defer these obligations to stage end while claiming the Change complete. |
| Integrated stage | Evaluate scenario, capability and experience on the same integrated product across Changes; reuse valid scoped evidence and disclose remaining gaps. Early trial feedback or individual Change PASS does not establish stage acceptance. |

Use the existing verification/delivery record for each claim and its limitations.
This cadence does not change CI triggers or waive required checks. Apply the
impact-scoped CI rules above; daily focused checks cannot substitute for the
PR's selected required checks or the Change's applicable regression.

## Independent Validation and Acceptance

Before inspecting the implementation explanation and author tests, Validator
derives its key positive, negative and failure expectations from approved
product acceptance and necessary contracts. This is a reading order within the
same review, not another artifact or Gate. Independently exercise the key real
business and failure paths in the approved environment, then compare the full
candidate, tests and claims. Apply the normal-user-path and current-CI-input
checks above to affected claims; mocks cannot replace the behavior being proved.

Freeze the complete candidate (committed, staged, unstaged and added scope) and
evidence; overlapping pre-existing changes need attribution, not blanket exclusion.
Verify causal RED, test sensitivity, negative cases, relevant quality/regression,
scope/architecture/safety and evidence identity. Test retirement is part of this
review under `test-asset-retirement.md`, not a separate PASS prerequisite.
Reuse complete, trustworthy CI/check evidence after verifying its candidate,
inputs and environment applicability. Independence does not require rerunning
every identical suite: target missing coverage, suspect evidence and affected
risks while retaining independent judgment and key real/failure-path checks.
This neither waives required CI nor makes author self-review independent.

A blocking finding identifies an acceptance failure, material engineering defect,
violation of an approved architecture/safety/permission/contract boundary, or
material evidence gap that prevents a required claim. Give the affected requirement
or boundary, counterexample/evidence and recheck condition. Formatting, preferred
implementation style and nonessential document tidying are advisory when they
do not affect those claims. Missing authority or meaningful evidence is never
reclassified as cosmetic.

Ordinary low-risk layout/copy issues may remain while work continues, with their
impact, workaround and specific return point in the existing issue/delivery
record. Wrong calculations/evidence, unauthorized access/privacy exposure,
budget or stop failure, lost results and an unusable promised main path block
the affected trial/delivery; safely isolated unrelated work may continue. Copy
that changes metric meaning, obscures authorization or falsely signals success
is not cosmetic. This does not waive required UI approval or accepted commitments.

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
Maintain one concise current result/next-action summary in the existing
verification or handoff and link it from other surfaces. Update it at meaningful
outcomes; preserve issued receipts, failed probe source/inputs/outputs and raw
history separately. A passing rerun does not explain a lost failure: retain
UNKNOWN where attribution is unavailable. Optional template fields do not
require duplicate reports or per-command handoffs.

One device writes a branch. Preserve dirty work; use the existing PR/squash/
ff-only protections. Mini organizes review, authorized Git delivery and archive
without MacBook technical sign-off. Missing Git/release permission goes directly
to the user. Git publication and a readable receipt do not transfer branch
ownership or authorize the next Change.

## Blueprint Capability Coverage

Keep one cumulative capability register at
`docs/planning/capability-coverage/register.md`, derived from the entire effective
Blueprint, not just the current Change or Analysis IR. Its stable capability IDs
link Blueprint sections, target users/value, target scope and capability-specific
observable completion conditions. Product Manager owns definitions and Blueprint
scope; ordinary evidence/status updates belong to Mini Engineering Controller
after intake. Neither may narrow a target merely to mark it complete. Retain IDs
across Blueprint revisions; append or explicitly retire/replace entries with
history rather than reusing IDs or silently deleting deferred capabilities.

This register is a product-coverage projection of approved plans and actual
delivery evidence, not a second engineering phase/state authority. Mini remains
the sole engineering-status writer. One assigned device writes the register in
an owned work branch at a time; use existing Git handoff protections for a
product-baseline revision. MacBook need not approve routine coverage updates.
Latest map and delivery snapshots are views of that register, not parallel
editable status stores. Publication and receiving-task adoption still require
separate evidence; no background sync, scheduler or new dispatch is implied.

For each capability retain target scope, implemented/connected/accepted scope,
uncovered parts, linked Changes, evidence with identity and limitations, and
last update. Separate planning, code presence, real-path connection and accepted
target evidence; these are facts, not universal maturity levels. Use these
statuses with a scope-qualified explanation:

| Status | Meaning |
|---|---|
| 未启动 | No scoped work started in the checked boundary; identify that boundary, not an unverified repository-wide absence. |
| 规划中 | A roadmap/proposal or scoped plan exists; no delivered behavior is implied. |
| 实现中 | Current engineering work is evidenced; forecasts are not delivered coverage. |
| 局部实现 | Evidence supports a subset, but the named target is not fully accepted; show the subset and missing links. |
| 目标范围已验收 | This entry's explicit target and capability-specific conditions have sufficient acceptance evidence. It is not all-product completion. |
| 待核验 | Available evidence cannot establish the relevant state; record what is unknown and the next evidence needed. |

Preserve already accepted subscopes when later work is in progress. A status is
not a score: one example, code presence, several disconnected parts, Change
counts, code volume or averaged percentages cannot prove general capability or
an end-to-end loop. Parent status is a reasoned scope statement, never an
arithmetic roll-up; disclose unknown children. Each capability uses its own
completion conditions. Undefined future scenarios/thresholds stay pending
product decisions, not invented acceptance criteria.

Within the existing work, not a new stage:

1. At product preparation/intake, link the Change's approved user story to the
   affected capability IDs in its existing proposal/tasks. Keep expected coverage
   separate from current coverage. Reuse valid acceptance; do not reopen accepted
   Changes merely to backfill links.
2. At candidate verification, assess affected cumulative claims against their
   capability conditions. A new `目标范围已验收` claim must bind the fixed
   integrated candidate, relevant cross-Change integration, real execution path,
   applicable scenarios and key negative/boundary cases, plus required user
   Product Acceptance. Reuse valid evidence with its identity and limitations;
   independent Validator checks the material new claims in the same review.
   If required user acceptance follows engineering validation, keep the target
   unaccepted and record the technical evidence first; update the projection
   after that existing user decision. Recording its receipt alone does not
   trigger another Validator round or delay the original acceptance sequence.
   Change acceptance answers the user story; capability acceptance answers the
   cumulative target. Neither replaces the other or authorizes new tests/data.
3. At every Change completion, Mini updates affected register entries and
   `docs/planning/capability-coverage/latest.md`, then preserves a non-overwritten
   snapshot under its `snapshots/` directory, linked from the existing delivery
   record. Include a fixed register revision or a same-commit relative register
   link plus candidate/evidence identities. Later corrections append a new
   snapshot with a correction link; never rewrite an issued snapshot. Bootstrap
   reconstructions explicitly name their retrospective date and unknown prior
   state. In-progress snapshots are not completion snapshots.
4. Every Change delivery response shows the before/after scope/status delta,
   remaining gaps and evidence, and links the latest full map and its Change
   snapshot without another reminder. Display the full stable-layout six-plus-two
   map in the response at stage acceptance or when the user requests it. The
   latest map and each completion snapshot still retain unaffected capabilities;
   detail stays in the register. A Change with no business delta reports that
   fact and still updates the records and preserves its full-map snapshot.

Missing evidence limits the capability claim to partial/unknown; it does not
block an otherwise valid unrelated user story or require a global revalidation.
Newly discovered gaps become recommendations for the user/existing priority
mechanism, not automatically authorized implementation. This adds no approval,
mandatory specialist, separate report ledger, product behavior or execution
permission. Update the projection proportionately rather than repairing every
historical document or running all product tests just to refresh a picture.

## Preserved Product and Historical Boundaries

Product authority remains at `docs/planning/README.md`. Withdrawn plans stay
void; a Blueprint, Demo or development-readiness PASS does not itself authorize
product execution or external operations. Global product WIP remains one.
Do not edit old pointer, State, pause, Ledger or historical worktrees.

The 2026-09-24 takeover note is a historical snapshot, not a live Mini stop-point
claim. Verify the original task's current state at adoption; keep all unresolved
safety/product obligations and the separately required resume decision.

## Fixed-Code Business Acceptance and Installed Artifacts

Use the approved delivery surface's normal entry: browser plus same-host service,
or native Desktop development when applicable, with the real Application/backends.
Formal business acceptance binds frozen source, test inputs, frontend/service
configuration and runtime identities, plus emitted Main/Preload for Desktop.
A changing HMR session is working evidence only; stop edits and recheck the
fixed candidate before acceptance.
Product/UI acceptance and independent engineering verification remain separate.

For approved browser delivery, defer only Desktop-shell, packaging, installation
and distribution-specific checks. Map applicability by the behavior proved in
existing Change verification, not by a path containing `desktop`. Retain shared
business tests and verify browser/service connection and cross-site protection,
file/credential permissions, key calculations/evidence, state persistence and
stop/recovery. Browser PASS neither closes old native E2 nor erases historical
failures, waivers or unresolved gaps. Shared correctness/safety defects still
block the affected browser path. Select required CI by the impact rules above,
not suite names containing `desktop`; browser delivery does not authorize
deleting shared tests.

Installed-artifact acceptance additionally binds the exact package, resources,
runtime, signature and installation context. Packaging is an explicit check when
affected by Main/Preload, packaging, resources, security or deployment changes;
ordinary test runs need not create another application copy. Record each retained
acceptance item and its command/evidence surface. Existing explicit artifact
obligations remain binding until fulfilled or their non-applicability is justified
within approved scope. This does not weaken any prior accepted artifact or DMG.

Several accepted Changes may accumulate into one stable application version/DMG.
That release requires its own affected artifact checks and authorized delivery;
a development business PASS does not establish installation or release acceptance.
No new process stage, board or permission source is created by this distinction.

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
