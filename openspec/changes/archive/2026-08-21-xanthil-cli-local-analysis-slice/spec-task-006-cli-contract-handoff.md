# TASK-006 Spec Handoff — CLI Interaction and Personal Composition Contract

Date: 2026-08-20  
Trigger: fresh TASK-006 Test role returned `TEST_CONFLICT_TASK_006` before writing or consuming RED budget  
Route: project `juaner_spec` before the TASK-006 Test Gate

## Objective

Close the complete CLI interaction, Personal Profile, canonical-source connection, and user-visible result contract needed to test and implement TASK-006 without inventing a terminal protocol or widening the product. Deliver one coherent revision package; do not split this into repeated micro-decisions.

Preserve the approved first-slice intent: one personal local Analyst Assistant scenario, one canonical synthetic CSV, explicit Analysis Gate, deterministic Evidence/Artifacts, no real Pi call in TASK-006 tests, and no Desktop/Console/enterprise/RPC/workflow/action expansion.

## Ownership

Allowed writes only inside the current Change:

- `specs/local-analysis/spec.md`
- `design.md`
- `test-plan.md`
- `tasks.md`
- `traceability.md`

Conditional write, only if needed to record an explicit Controller-ready decision package:

- one new `spec-task-006-*.md` addendum in this Change

Forbidden: production, tests, fixtures, manifests/lockfiles/dependencies, project board, other Changes, global Pi/config/credentials, and every external repository.

All accepted TASK-002..005/007 behavior and evidence remain authoritative. If closing semantic edit requires a Product Application surface change, describe and freeze the smallest exact revision and its new Test/Worker gate; do not modify production or pretend it belongs to the TASK-006 Worker path.

## Required Reading

Read completely:

- `AGENTS.md`, Spec role config, Orchestration, routing governance;
- approved capability Spec, Design, Tasks, Test Plan, Traceability, Verification;
- `test-task-006-handoff.md` and the Test role's seven-gap return;
- current Product Core, Ports, Application public surface, public seam helper, existing integration/E2E tests;
- the detailed product plan's Analyst Assistant, Analysis Gate, CLI/Session, Artifact, and first-demo sections.

## Seven Gaps to Close as One Package

### 1. Closed `runXanthil` input protocol

Keep the public factory signature exactly `runXanthil({input,output,application})` unless a real contradiction is proven. Freeze:

- the exact closed outer object and argument validation;
- the input object's/stream's exact public methods or async event union;
- exact line, explicit confirmation, rejection, EOF, and Ctrl-C representations;
- whether method/event values are frozen, sync/async, one-shot, ordered, and how unknown/late/duplicate input fails;
- no caller-supplied provider, model, source path, run root, tools, Adapter, command, environment, or output location.

Prefer a small structured event union over parsing ambient terminal signals or magic raw strings if that materially improves closure. This is the pure CLI boundary; do not implement a second full TUI framework.

### 2. Closed output and return protocol

Freeze a minimal structured user-visible event union and exact ordering sufficient to prove:

- prompt/readiness without a success claim;
- complete Analysis Contract proposal presentation;
- awaiting explicit confirmation;
- rejection/edit/cancellation acknowledgement;
- post-confirmation progress without raw SDK/provider/row data;
- success only after a succeeded manifest, with exact oracle/F-001/limitations/Evidence/Summary references;
- sanitized failure/cancelled completion with no false success.

Freeze the exact `output` method signature/status and `runXanthil` resolved/rejected return shapes. Keep decorative terminal copy outside the stable contract. Unknown fields/events, writer failure, writer wrong return, and output after terminal must fail closed.

### 3. Confirmation, rejection, and semantic edit

Resolve the normative promise that semantic editing creates a new proposal requiring confirmation against the current Application handle, which exposes only `discover()`, `confirm(proposal)`, and `cancel()` and accepts only the single approved entry question.

Choose one honest minimal contract:

- freeze a smallest new Application `revise`/new-proposal operation with exact state/effects and route it through a separate bounded Application Test/Worker revision before TASK-006; or
- if the first fixed scenario intentionally does not support in-session semantic editing, explicitly revise the normative first-slice wording and interaction union so `edit` exits/cancels without executing and is not falsely called a re-proposal loop.

Do not simulate editing by resubmitting the unchanged proposal, silently execute the old proposal, or create an untestable conversational side channel. Clearly state whether this choice is product-significant enough to require a user decision; otherwise provide the recommended Controller-ready choice and rationale.

### 4. EOF and Ctrl-C causality

Freeze exact behavior before and after confirmation:

- which input event represents EOF/interrupt;
- when `handle.cancel()` is called and awaited;
- idempotency for repeated interrupts;
- no run/success before confirmation;
- after confirmation, cancellation owns no direct Artifact writes in CLI, waits for Application's terminal outcome where available, discards late success, and emits only the approved cancelled/failure terminal event;
- writer/input failures and process death do not invent a succeeded/failed run.

No real signals, sleeps, clock seam, or process termination is needed in deterministic TASK-006 tests.

### 5. Personal Profile public surface and root rule

Freeze the exact closed factory configuration and returned public value for `createPersonalLocalAnalysisProfile`.

Use the already-approved exact provider/model. Unify `runRoot` with the existing Artifact Adapter contract: decide whether it must already exist or may be created, and make Design/tests/tasks consistent. Prefer an existing absolute safe directory if no product reason requires composition-time creation, because composition itself must have zero writes.

Define how the public behavior proves selection of the three concrete Adapters without adding inspection/test exports or exposing SDK/filesystem objects. Keep composition import/construction free of source-row reads, run creation, Pi prompt/session realization, credential access, provider/network calls, or ambient cwd/home/env fallback.

### 6. Profile-to-CLI source/application connection

Freeze where the canonical source descriptor lives and how `runXanthil` obtains it while retaining the exact three-argument signature. Current Application requires `start({question,source})`; source is the closed `{version,kind,sha256,path}` input and may use only workspace-relative `member-orders-v1.csv`.

A minimal acceptable direction is that this single-scenario CLI owns the immutable canonical source descriptor and receives a Profile-composed Application, but the Spec role must confirm the exact boundary and avoid hidden absolute path, cwd, clock, or alternate-fixture discovery. State how an actual composition caller connects `createPersonalLocalAnalysisProfile(...)` to `runXanthil(...)` without adding another product surface unless necessary.

### 7. Canonical example and activation inventory

Freeze:

- exact example directory/file inventory;
- literal CSV bytes, 530-byte size, and SHA-256 `c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0`;
- whether any minimal example-local instruction file is required; if not, prohibit extras;
- import/composition/start boundaries that create no run before confirmation;
- personal-only activation and absence of Desktop/Console/enterprise/RPC/resume/list/delete/repair/Decision/recommendation/Action surfaces.

## Required Deliverable Quality

- Closed schemas at every object/event layer; no unknown/null/default fields.
- Exact state transitions and event ordering, including writer/input failure semantics.
- Separate stable semantic events from decorative copy.
- Exact ownership: CLI orchestrates user interaction only; Application remains semantic writer; Profile selects infrastructure; Adapters own infrastructure.
- Exact tests and task routing for any Application revision needed before CLI implementation.
- Update Test Plan/Tasks/Traceability consistently; preserve all 16 Requirement IDs, 51 AC IDs, 22 TEST IDs, and 10 task IDs unless a new ID is unavoidable and explicitly justified.
- Do not claim executable proof, real Pi readiness, credentials, provider/model output, independent validation, acceptance, or activation.

## Return

Return:

- `SPEC_READY_TASK_006_CLI_CONTRACT` or `SPEC_CONFLICT_TASK_006_CLI_CONTRACT`;
- exact files changed and SHA-256;
- the closed input/output/Profile/source/edit/cancellation package;
- whether a separate Application revision is required and its precise Gate/path/test impact;
- static identifier/schema/forbidden-surface checks;
- confirmation of no production/test/manifest/dependency/board/credential/model/network write or call.

Do not start Test, Worker, or Validator. Controller reviews and owns the revised Spec Gate.
