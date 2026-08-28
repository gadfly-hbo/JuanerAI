# CHG-xanthil-desktop-session-bootstrap — D1-A Intake Candidate

> Intake ID: `D1A-XDSB-001`
> Change ID: `CHG-xanthil-desktop-session-bootstrap`
> Status: Review 001 `NEEDS_CLARIFICATION`; one bounded correction closed by Controller targeted readback; dependency policy frozen; DISPATCH blocked on final authority integration and freshness
> Date: 2026-08-28
> Controller device: MacBook
> Current-Change executor after valid signed DISPATCH: Mac mini

## 1. Authorization chain

- The user accepted the dual-mode UI evidence and requested formal-development preparation.
- D0.5 Review 001 returned `NEEDS_CLARIFICATION`; the corrected package received fresh Review 002 `PASS`.
- The user approved `D05-XD-001` and `D05-XD-STRUCT-001` S01-S23 as one package on 2026-08-28.
- That approval authorizes this D1-A intake only. It does not authorize OpenSpec creation, dependency installation, tests, implementation, DISPATCH, provider/model calls, real data, a second Runtime, or Model Pack work.
- This D1-A requires its own fresh read-only Product Plan Reviewer. Its result does not replace Spec Gate, causal RED, TDD_READY, Validator, Controller Acceptance, or archive.

## 2. Product objective

Deliver the smallest packaged Xanthil Desktop behavior that proves a reusable Application-led Project/Session path on both supported platforms without pretending that analysis exists.

On a packaged macOS Apple Silicon build, with the same frozen behavior contract built and smoke-tested in hosted Windows CI, the user can:

1. choose a writable local Project root and create a Project, or open an existing supported Project;
2. use the persistent top selector to show quick or professional mode without converting an existing Session;
3. explicitly create a new fixed-mode Session;
4. observe `session.json`, `010_draw/`, `020_clean/`, and `060_reports/` as one complete published Session;
5. close and reopen the application and read back the same Project/Session identity and immutable mode;
6. receive closed failure/next-action behavior for unavailable, malformed, newer, concurrent, cancelled, and crash-interrupted creation.

The visible Session state is `not_started`. The Change must not display a fake Run, Evidence, report, professional workbench, Fork, Subagent, model result, or successful analysis.

## 3. Product acceptance identifiers

| ID | Required observable result |
|---|---|
| `AC-XDSB-001` | New Project publication is same-filesystem atomic and exact-readback gated; valid existing Project open is idempotent; unavailable, malformed, identity-conflicting, or newer Project state is read-only blocked with the approved next actions. |
| `AC-XDSB-002` | New Session mode is exactly `quick` or `professional` and immutable; the top selector switches to the last Session or empty home of the selected mode and never converts or implicitly creates a Session. |
| `AC-XDSB-003` | Session publication exposes the manifest and all three required directories only after atomic rename plus exact readback; repeating one operation is idempotent and a distinct operation never overwrites an existing identity. |
| `AC-XDSB-004` | One OS-user application instance routes a second launch to the first; each Project admits one active plus one pending mutation; overflow rejects before identity/side effects; cancellation before rename wins, committed rename wins over late cancellation, and crash remnants move to retained non-discoverable quarantine. |
| `AC-XDSB-005` | Restart preserves identity/mode; existing CLI history remains read-only and unchanged; rollback/uninstall preserves Desktop Project data and never downgrades a newer manifest. |
| `AC-XDSB-006` | The acceptance runs in packaged form on Apple Silicon macOS; hosted Windows CI builds the distributable and runs the approved automated smoke/contracts against the same frozen source and contract identity. Final installed Windows 11 x64 replay and both platform signing requirements belong only to `JUANERAI_PUBLIC_RELEASE_GATE` and are not this Change's completion evidence. |

Exact serialized error strings, manifest fields, temp names, fsync mechanics, and UI component names are not acceptance semantics and remain later Gate outputs.

## 4. Architecture and exact reuse

```text
sandboxed renderer
  -> narrow typed preload
  -> Electron main / Desktop Profile
  -> Xanthil Application
  -> Desktop Workspace Store Port
  -> local file Adapter
```

- Product Core/Application/Port/Adapter/Profile dependency direction remains authoritative.
- Application is the sole semantic writer. Renderer, Electron IPC, and the file Adapter do not invent Session status or success.
- UUIDv7 identity, retry-as-new-attempt, fail-closed path validation, immutable terminal meaning, atomic physical write, and readback-before-success reuse current accepted direction.
- Electron/Node types remain in the Desktop surface/Profile/Adapter and do not enter Product Core, Application, or public business contracts.
- Current CLI behavior and historical Runs remain protected compatibility surfaces; they are not migrated or reused as writable Desktop state.
- The current Pi-backed `AgentAnalysisRuntime` is not invoked or changed. No Runtime registry, fallback, second Runtime, Python, DuckDB, SQLite, or provider is introduced.

## 5. UI evidence boundary

- PX-2026-006 v0.2 is interaction evidence for the persistent top mode selector, fixed-mode Session choice, quick-mode shell, and independent-conversation navigation vocabulary.
- PX-2026-004 remains the authority for the later professional six-stage workbench, Gates, 循证分析, report, and execution feedback.
- This Change implements neither analysis surface. The professional landing state may identify its mode and `not_started` status but cannot copy PX-2026-006's read-only professional placeholder as a completion claim.
- Demo state objects, timers, reducers, identifiers, and mocked filesystem behavior are forbidden architecture inputs.

## 6. Candidate frozen path scope for later signed DISPATCH

No path below exists or is writable under this intake alone. The D1-A Reviewer must identify any missing ownership or unsafe breadth before the Controller freezes a signed package.

### Spec role

- `openspec/changes/xanthil-desktop-session-bootstrap/**`

### Test role

- `package-lock.json`
- `package.json`
- `tests/contract/xanthil-desktop-session/**`
- `tests/e2e/xanthil-desktop-session/**`
- `tests/integration/xanthil-desktop-session/**`
- `tests/unit/xanthil-desktop-session/**`

### Worker role

- `adapters/storage-local/desktop-workspace-store.ts`
- `apps/desktop/**`
- `packages/application/desktop-session.ts`
- `packages/ports/desktop-workspace-store.ts`
- `packages/product-core/desktop-session.ts`
- `profiles/personal/desktop.ts`
- `tsconfig.json`

### Controller-only planning and evidence

- `.juanerai/project-control/**`
- `docs/planning/2026-08-28/**`

All other production, test, fixture, OpenSpec, governance, architecture, CLI, Runtime, Python, model, data, and Model Pack paths are forbidden. A required out-of-scope path produces a Contract Change Request and blocks; it does not widen automatically.

## 7. Dependency policy candidate

- Candidate allowed families are Electron, Electron Forge, React, Vite, their direct TypeScript/build integrations, and narrowly required test tooling for the packaged Desktop surface.
- Before signed DISPATCH, the MacBook Controller must freeze a content-addressed dependency manifest that names every direct package, exact version, purpose, runtime/dev classification, registry identity/integrity, license disposition, required install script, supported Node range, and forbidden transitive capability. Missing or ambiguous metadata is `DEPENDENCY_POLICY_BLOCKED`; it cannot be delegated to Spec, Test, or Worker.
- The signed package may authorize the Test role to perform one mechanical environment-provisioning step inside the exact `package.json` and `package-lock.json` paths: materialize only the frozen dependency manifest, run the reviewed install scripts under the approved network/install boundary, then freeze and return the resulting lockfile hash. The Test role may not select, add, upgrade, substitute, or remove a dependency.
- Before any behavior failure is counted as RED, the Test role must prove environment health: fresh lockfile installation succeeds; baseline typecheck and existing deterministic suites remain GREEN; each frozen package resolves to the expected version/integrity; the Electron executable/package smoke succeeds; test helpers/fixtures are healthy; and no unapproved package, script, registry, network destination, or generated repository path appears.
- Dependency, install, loader, Electron-binary, runner, compiler, helper, fixture, or platform-environment failure is `TEST_CONFLICT`/`BLOCKED`, never causal RED and never TDD_READY. Causal RED begins only after environment health and must fail at the missing Product Core/Application/Port/Adapter/Desktop behavior asserted by the approved ACs.
- After dependency/lock health is frozen, `package.json` and `package-lock.json` become read-only to Worker. A Worker need for any dependency or lockfile delta returns to Controller and invalidates TDD_READY; it is not an implementation fix.
- No Python, DuckDB, SQLite/native database, auto-update, telemetry, crash-upload, remote-content, generic filesystem, shell, or provider dependency is allowed.
- Runtime download of code, packages, UI, or updates is forbidden.

## 8. Required RED and verification classes

- Product Core/Application unit tests for closed values, modes, operation identity, state, and next-action results.
- Port/Adapter contract tests for exact read/write authority, traversal/symlink rejection, malformed/newer manifests, idempotency, atomic collision, readback, and quarantine.
- Integration tests for mutation admission, cancellation/publication races, second-launch routing, restart, unavailable roots, partial trees, and external disappearance.
- Packaged Electron E2E for top selector, explicit Session creation, no implicit conversion/creation, close/reopen, visible failure, and `not_started` truthfulness.
- Fault injection must establish causal RED before production implementation for rename/readback failure, concurrent creator, cancellation boundary, and crash recovery.
- Test Design must record the environment-health evidence separately from RED evidence. At least one causal RED leaf in each Product Core/Application, Port/Adapter, and Desktop/preload acceptance class must be executable after dependency health and before Worker starts; a missing package, missing runner, or non-starting Electron binary cannot satisfy this requirement.
- macOS Apple Silicon packaged replay and hosted Windows build/smoke are required Change evidence and remain separately labeled. Controlled real Windows 11 x64 packaged replay and signing are deferred to `JUANERAI_PUBLIC_RELEASE_GATE`; hosted CI must never be relabeled as final Windows acceptance.
- Canonical offline regression remains `tools/harness/validation/run`; no real provider/model gate is enabled.

## 9. Route and execution boundary

The Change is R2 because it introduces persistent identity/file formats, crash recovery, concurrency/idempotency/cancellation, IPC/security boundaries, cross-module Port/Adapter/Profile seams, and cross-platform packaging.

After a valid signed DISPATCH only:

1. `juaner_spec`: `gpt-5.6-sol/high`, workspace-write, Spec-role paths only;
2. `juaner_test`: `gpt-5.6-terra/high`, after Spec Gate PASS, Test-role paths only;
3. `juaner_worker`: `gpt-5.6-terra/high`, after TDD_READY, Worker-role paths only;
4. `juaner_validator`: `gpt-5.6-sol/high`, fresh read-only context after frozen implementation/evidence.

MacBook remains Controller and integration authority. Mac mini is the sole current-Change executor under `product-change-execution-policy.md`. No role dispatch occurs from this D1-A document.

## 10. External prerequisites and current blockers

| Prerequisite | Required disposition | Current state | Effect |
|---|---|---|---|
| Approved D0.5 package on integration authority | reviewed commit/PR/squash on `origin/main`, followed by exact MacBook readback | PR #21 squash `103bd88216d7f397967bdabb7fbfb250eea3f996`; MacBook and Mac mini exact clean readback in `EVD-D1A-005` | PASS |
| Frozen dependency policy | content-addressed exact direct-dependency manifest plus reviewed registry/integrity/license/install-script/Node boundary and Test provisioning contract | `D1A-XDSB-DEP-001` freezes all direct packages, provisioning commands, Electron checksums, Node/npm boundary, network and forbidden capabilities; final integrated file hash still required | authority-package branch integration blocks signing |
| Global WIP authority | live Mac mini `active-change.json` readback proves `active_change_id: null` and expected empty-pointer hash | verified empty at PR #21 integration SHA `103bd882…`; evidence `EVD-D1A-005`; must be re-read immediately before signing | current observation PASS; freshness required before DISPATCH |
| Real Windows acceptance host | controlled Windows 11 x64 VM/physical host, install/run access, evidence return path | product owner reports unavailable; deferred by `D05-XD-PRG-001` | observed release-resource gap; not a D1-A or DISPATCH blocker |
| macOS signing/notarization | credential availability, secure non-repository custody, CI/local use boundary | product owner reports pending verification; deferred by `D05-XD-PRG-001` | observed release-resource gap; not a D1-A or DISPATCH blocker |
| Windows signing | credential availability, secure non-repository custody, CI/local use boundary | product owner reports unavailable; deferred by `D05-XD-PRG-001` | observed release-resource gap; not a D1-A or DISPATCH blocker |
| Mac mini executable baseline | clean supported main plus an empty global pointer immediately before signed DISPATCH; Coordinator creates the bounded Change worktree only after admission | PR #21 baseline is exact and clean at `103bd882…`, pointer `EMPTY`; must repeat after the authority-package branch is integrated | freshness blocks signing, not product intent |

The D1-A Review may complete while these are open. The Controller must not produce or transmit a signed DISPATCH until every row whose effect is explicitly blocking has a verified disposition; the three `JUANERAI_PUBLIC_RELEASE_GATE` rows do not block development dispatch. The repository must not contain credentials, private keys, signature bytes, or raw secret material. No artifact may be publicly distributed or described as production/public-release ready until all three deferred resources and same-Release-Candidate cross-platform acceptance pass the separately activated `JUANERAI_PUBLIC_RELEASE_GATE`.

## 11. D1-A review brief

The fresh Reviewer receives only this intake, the approved D0.5 package and formal attachments, baseline attestation, and explicitly cited JuanerAI authorities. It must return the seven required sections and classify every finding as one of:

- `SPEC_BLOCKER`
- `TEST_REQUIRED`
- `IMPLEMENTATION_DETAIL`
- `ACTIVATION_OR_HOST_VALIDATION`
- `NON_BLOCKING_FOLLOWUP`

`PASS` means the Artifact Package is semantically ready for Controller disposition; it does not clear the blockers in §10 or authorize DISPATCH. `NEEDS_CLARIFICATION` allows at most one bounded semantic correction plus targeted readback under `product-change-execution-policy.md`; there is no automatic second D1-A Reviewer.
