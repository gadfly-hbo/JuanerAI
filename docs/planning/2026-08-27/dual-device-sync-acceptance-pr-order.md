# JuanerAI Dual-device Sync, Acceptance, and PR Order — Revised Planning

> Status: frozen product input; planning only; no execution authority
> Date: 2026-08-27
> Current authorized work: this documentation-governance branch only

## 1. Integration authority

- `origin/main` is the sole integration authority.
- Local `main` is read-only and must equal `origin/main` before new work.
- Each task uses one `work/<device>/<slug>` branch and one writing device.
- Every integration uses a reviewed pull request and squash merge, followed by `pull --ff-only` on both devices.
- No force-push, hidden stash/reset, direct main write, or unverified cross-device continuation is allowed.

## 2. Current documentation revision

The only current branch is the MacBook-owned pure-documentation governance task. Its acceptance requires:

1. terminology, ADR, architecture, plan, attachments, ownership, contract map, and sequence are internally consistent;
2. the 2026-08-23 package remains intact as history;
3. repository search finds no current-plan claim that CLI is the active product entry or that four libraries are peer products;
4. links and Markdown structure are valid;
5. a fresh isolated Development-Readiness Reviewer returns `PASS` or all findings are corrected and re-reviewed;
6. the user explicitly approves the candidate plans as frozen product input;
7. only then may this documentation branch be committed/pushed/PR-reviewed under a separate user instruction if not already authorized.

No product branch follows automatically.

## 3. Product sequence

```text
current plan candidate
  -> Development-Readiness Review
  -> explicit user product approval
  -> D0 static Demo in the user-assigned research workflow
  -> user Demo decision
  -> D0.5 Desktop technology/reuse/Python/first-Change decisions
  -> explicit first product Change authorization
  -> D1–D5 bounded Xanthil Desktop delivery
  -> integrated development acceptance: macOS packaged replay + Windows hosted CI
  -> DA_REQUIRED_COMPLETE + explicit user acceptance
  -> explicit Model Pack start authorization
  -> Model Pack contracts/provider/consumer/activation
  -> phase-one acceptance
  -> explicit user command to prepare formal JuanerAI release
  -> JUANERAI_PUBLIC_RELEASE_GATE against one frozen Release Candidate
  -> separate phase-two enterprise decision
```

The sequence is strict at the Gate boundaries. It does not require each D stage to be one Change and does not authorize parallel Changes.

## 4. Xanthil Desktop PR order

The exact PR topology is deferred until D0.5. If multiple Changes/PRs are approved, their order follows actual contract dependencies:

1. Controller-owned contract enabler only when a shared executable contract is truly required;
2. the smallest Application-led vertical behavior, preserving current OpenSpec compatibility;
3. concrete Adapter/experience implementation behind the frozen contract;
4. cross-platform packaging/acceptance delta where not already in the slice;
5. activation and rollback only after all required providers/consumers and evidence are integrated.

A foundation-only PR without user-observable value requires an explicit reason and cannot prebuild a platform. A UI-only production PR cannot bypass Application or use static Demo data as the product backend.

## 5. Model Pack PR order

After `DA_REQUIRED_COMPLETE` and Model Pack authorization, the default dependency order is:

1. **MPC — contract enabler:** Controller freezes `MP-C01..03` executable contracts and Adapter-independent suites; no Provider/Consumer implementation.
2. **MPP — Provider:** Mac mini trains/evaluates under MP1–MP9, produces exact release input, builds the Pack SDK, and passes independent Consumer checks.
3. **MPD — Desktop Consumer:** MacBook installs the actual Pack and integrates it into Xanthil Desktop through `AnalyticalModelRuntime`; it does not modify Provider-private logic.
4. **MPA — activation/acceptance:** Controller integrates exact Provider/Consumer identities, cross-platform evidence, rollback, and future-actuals procedure; this is always last.

MPC must merge before MPP or MPD. MPP must provide an exact Pack before MPD can claim real consumption. MPD may prepare consumer-only behavior against contract doubles after MPC only if its Change explicitly permits it, but cannot pass final acceptance before the real Pack. MPA cannot overlap writes to Provider or Desktop hot paths.

## 6. Per-branch acceptance

Every future Change follows the repository lifecycle and must show:

### A — branch self-evidence

- exact base/head and allowed-path diff;
- Requirement/Acceptance Criteria traceability;
- expected RED before production implementation;
- GREEN focused tests plus applicable regression/quality checks;
- data/model/network/dependency evidence at the approved level;
- no forbidden or unrelated writes;
- clean worktree and reproducible commands.

### B — independent verification

- fresh read-only Validator context after implementation/evidence freeze;
- actual code/contracts/tests/evidence inspected, not a completion summary;
- positive, negative, cancellation, recovery, compatibility, and security boundary evidence as applicable;
- explicit verdict and unresolved risks.

### C — PR integration review

- PR diff matches the frozen allowed paths and reviewed head;
- checks run against the current head;
- shared contracts, ownership, version, compatibility, activation, and rollback remain consistent;
- squash result is identified before downstream work rebases.

### D — `origin/main` acceptance

- intended tree exists on `origin/main` at the exact merge SHA;
- MacBook and Mac mini fast-forward to the same main when cross-device work depends on it;
- required scoped worktrees are clean;
- integrated focused/regression evidence still passes;
- project state is updated only by the Controller when authorized.

PR merge never grants the next product Change or Gate automatically.

## 7. Cross-device handoff

The sending device must push a clean branch and report branch name, exact commit, validation, allowed paths, evidence, and next action. The receiving device fetches and tracks the remote branch only after the sender stops writing. Ambiguous dual-device changes, divergent tips, or unknown local configuration stop the handoff.

Model/data/runtime state, credentials, caches, MLflow databases, environment paths, and unapproved artifacts never travel through Git merely because the branch moves.

## 8. Stop conditions

Stop and return to Controller/user decision for:

- static Demo not approved or product surface materially changed;
- missing local-Python technical input;
- any attempt to label hosted Windows CI as final Windows product acceptance;
- contract/schema/ownership/data/Runtime/permission expansion;
- current CLI compatibility or historical Run migration conflict;
- Data/Ontology mismatch, prohibited egress, unavailable Evidence, or silent latest/fallback requirement;
- Model Pack attempted before `DA_REQUIRED_COMPLETE` or without explicit authorization;
- Provider/Consumer Pack identity mismatch or future-actuals custody breach;
- public distribution or production-release-ready claim before the user activates and all requirements pass `JUANERAI_PUBLIC_RELEASE_GATE`;
- dirty worktree, unexpected path, divergent device branch, validation regression, or Validator finding;
- any request to proceed because budget, schedule, or an external tool result is “close enough.”

## 9. Not approved

- any future branch, Change, OpenSpec, test, implementation, dependency, Schema, training, model/data call, deployment, or merge;
- automatic multi-device orchestration, dispatch, wakeup, reuse, validation, or release;
- a fixed number of Desktop Changes before D0.5;
- Model Pack parallelism with unfinished Data Analyst required capabilities;
- phase-two work before a separate enterprise product decision.
