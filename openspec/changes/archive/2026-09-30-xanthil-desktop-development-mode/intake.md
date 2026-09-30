# Desktop development mode — Engineering Intake

Confirmed by Mac mini Engineering Controller, 2026-09-30. The user's explicit engineering-supplement request and subsequent corrections/confirmation are the authority. Every reference to “008” in the request means the latest accepted **DMG011**. DMG011 Product Acceptance and Git delivery are complete; no repeat or change to that frozen candidate is authorized.

## Fixed starting state and policy

- Repository: JuanerAI; branch `work/mac-mini/desktop-development-mode`, sole writer Mac mini.
- Base/main `6126112aa6ae167145b9ee38c84f6a648458e0e5`, tree `1df703c3dc96cb79396e447df6016d008297aa45`; clean at intake; PR46 product and PR47 completion integrated.
- Sole policy: `docs/governance/product-change-execution-policy.md`, adopted continuous-engineering v0.8. One engineering Worker, fresh independent Validator, Controller-only board. No new stage/approval chain/state store; no old Host Loop or MacBook operations.
- Existing approved product workflows/UI remain unchanged. The user's requested development-version marking and engineering launch mode are approved here; reuse the accepted Change2 UI standard, without redesign or opening a new product slice. No new Runtime or business/persistence schema.
- Existing installed Forge7.11.2, Vite8.3.0, React19.3.0, Electron44.4.3 and approved pinned Node26/toolchain are reused. No installation or dependency/version/lockfile change is authorized by this intake.

## Approved result and acceptance

DEV-01: One documented native Desktop development command runs the actual product renderer, Main, Preload, Application, SQLite and DuckDB/Python. Renderer hot updates work in the real Electron window. Main/Preload changes require explicit stop/restart initially; never silently restart an active task or repeat a submitted operation. Stop/restart cleans owned children and port; unrelated processes remain untouched.

DEV-02: Development version visibly marked. Application data, caches, development projects and credentials/authorizations are separate from installed app/production. No automatic production-key read/import, .zcode reuse, business-data copy, existing-project modification or installed-app overwrite. Development continues to use real local business/storage/calculation behavior with synthetic non-sensitive inputs in isolated new test projects.

DEV-03: Development server binds loopback only with a bounded allowed origin and file surface. Development exceptions are impossible in packaged mode. Preserve Electron context isolation, sandbox, nodeIntegration=false, webSecurity, sender/current-main-frame checks, permission refusal, navigation/new-window restrictions and exact IPC contracts. Cover unauthorized sender/origin, wrong endpoint and packaged-mode bypass negatives.

DEV-04: Separate ordinary test commands from packaging; ordinary tests must not force rebuild/package on each run. Preserve required package-resource/runtime/signature/install checks under explicit impact-appropriate commands. Name retained acceptance requirements and any adjusted evidence surface individually; no silent removal/skips or mock proof of the core real behavior.

DEV-05: Amend the sole execution policy and only necessary supporting rules to separate fixed-code development business acceptance from installed-artifact acceptance; several accepted Changes may accumulate into one stable version/DMG. Continuous HMR state is never formal acceptance evidence: freeze exact source and execution inputs and record relevant dev server/build/runtime identity. Earlier explicit package acceptance obligations remain until fulfilled or explicitly justified by approved scope; no retroactive weakening of DMG011 or original acceptance.

DEV-06: Actual Mini evidence: real Renderer HMR, same backend/operation identity with no duplicate action, real isolated business flow through calculation/report persistence and reopen, Main/Preload explicit restart handling, local-only server/security checks, production installation/original-project non-interference. Use real implemented backends, not mock Demo. No real Provider call is required to prove this deterministic engineering supplement; existing model task authorization stays separate.

DEV-07: Deliver launch/stop/restart instructions; measured verification and limits; actual changed rules; fixed candidate/version; independent verdict; honest Git status. No next product scope starts on completion.

## Result-sized engineering package

Worker owns engineering spec/design/tasks/tests/implementation and necessary docs within: this Change directory (except this Controller intake), apps/desktop, profiles/personal/xanthil-desktop.ts, adapters/credentials-macos (only local development credential namespace/resource composition), tools/desktop, targeted Desktop/validation tests and fixtures, package.json scripts only, forge.config.cjs, vite.* configs, tsconfig.json affected file inventory; docs/governance/product-change-execution-policy.md, .ai-coding/policies/testing.md, .ai-coding/definition-of-done.md, docs/architecture/deployment-profiles.md and one concise development guide as needed. Avoid touching unnecessary files.

Conditional: any additional product Application/Port/contract/adapter path requires a concrete Controller impact decision before edits. Internal deployment-mode isolation and local-only development origin selection are authorized engineering decisions; they grant no production exception. Production credential service/account defaults remain stable. Local dev-only metadata may not become business core/vendor-specific public contracts.

Forbidden: prior Change archives/candidates/DMGs, product plans/UI frozen input, package-lock/dependency changes, .codex roles/skills, legacy Host Loop state/tools, remote MacBook, credentials/business data, installed app contents, broad cleanup, auto-upgrade/background sync/browser product, new tests claiming model behavior without actual approved model calls. Worker/Validator do not write project-control or perform Git mutation.

## Permissions, evidence and remaining delivery boundary

Allowed effects: inspect repository and installed dependency source; edit authorized worktree; use approved installed toolchain; compile/build affected code and necessary new isolated package artifacts; launch/stop only this task's local development Electron/server/test children; use loopback connections; real local SQLite/DuckDB/Python with synthetic fixtures in new owned projects; inspect hashes of existing installations/fixtures without modifying them. Stop on missing dependency or unsafe/unknown effect; send all concrete permission gaps together to Controller.

Do not invoke real Provider or reuse production credentials for this work. Earlier model authorization was Change002-specific and is not blanket permission for this supplement. Prior commit/merge approval delivered Change002; fresh supplement Git publication/integration authority is not assumed. Complete the reviewable engineering result first, then Controller asks once for any actual remaining Git-delivery permission gap.

Evidence root: sibling `JuanerAI-artifacts/xanthil-desktop-development-mode` on Mac mini (actual local path in handoff). Existing DMG011 evidence stays in its original Change002 root. Preserve raw commands, code/fixture identities, outputs/exits and failures under this one new supplement root; no duplicate state authority. No numeric resource cap was supplied; this does not permit new paid/provider/dependency effects.

## Initial feasibility observations and next action

Current `desktop:start` uses Forge/Vite but Main loads only a file URL; Renderer HMR is therefore not connected. `desktop:test` currently prepends `desktop:package`. Current normal Main initializes the production credential store. Change these deployment seams narrowly; preserve accepted Application/calculation/store contracts. No Xanthil/Electron product process was found in the preflight, and unrelated development processes were left alone.

Next: Worker closes minimal engineering decisions, establishes causal RED, implements and verifies a complete fixed candidate; fresh Validator follows. No MacBook technical approval hop.
