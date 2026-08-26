# Verification: Mode Activation

## Current Verdict

- Verdict: `SPEC_REGATE_PASS_REPLACEMENT_CANDIDATE_AUTHORIZED`
- Meaning: The Controller read back the exact strictly bounded R3 seven-file package and issued Spec re-gate `PASS`. The revision still defers only the production-positive Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback obligations of `CAN-MA-07/08` to the first separately user-authorized real product Change; it adds no Canary interface, direct production-adapter invocation, or disposable Change, and every deferred failure is `BLOCKED` with no Acceptance. This verdict authorizes creation of a descendant replacement Candidate only; it does not claim that Candidate exists, Validator, PR/archive/merge, Activation readiness, or product-Change authority.
- Baseline/main/origin-main: `fec08a5300869d9f8411c406c2f4efd79af95467`
- Current branch HEAD / pre-revision Candidate: `09a38c7d3656189241e6226b64a1f5f76f802c59`
- Branch: `work/macbook/mode-activation`
- Next Gate: create and read back a descendant replacement Candidate from `09a38c7d3656189241e6226b64a1f5f76f802c59`. Only after that readback may the prior Candidate be marked `SUPERSEDED` without erasing it, followed by final validation and a fresh exact-Candidate Validator.

## Historical Intake Facts

### MacBook

- Git: `/Users/huangbo/Dev/Env/homebrew/bin/git`, `2.54.0`, SHA-256 `6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab`.
- Node: `v26.0.0`.
- no configured default signing key/format/signing flag found; `/private/etc/juanerai` absent.
- GitHub CLI authenticated from keyring as `gadfly-hbo`; confirmed scopes are `gist`, `read:org`, `repo`, and `workflow`. These broad MacBook Controller scopes are not a Mac mini credential.

### Mac mini `myhost`

- repository `/Users/bendandebaba/JuanerAI`: clean `HEAD == main == origin/main == fec08a5300869d9f8411c406c2f4efd79af95467` at intake evidence time.
- login Node: `/opt/homebrew/bin/node` `v25.9.0`.
- Git: only `/usr/bin/git` `2.50.1`, SHA-256 `a961f78075d8e7621ef4f5d764c64ef8a41bf66c0a98ab5cb6ca39b85ce31c93`; no Homebrew Git installed.
- `/private/etc/juanerai` absent; no trusted host loop installed; `sudo -n` unavailable.
- GitHub CLI authentication is invalid.

These facts are preserved intake evidence and are superseded where the current host readback below records a later installed state.

## R3 Courier and Positive Admission Decision

- Codex Remote is only a best-effort courier for a Controller-selected Brief, task, or exact signed envelope. It is not a message bus, exactly-once authority, receipt/outbox/queue/replay platform, Foundation component, or business-evidence authority.
- Controller signature protects authorization/content; the root-owned Host Loop executes; only existing pointer, State, Ledger, and PR facts prove business effects.
- Missing Remote output causes a Controller read of those existing authorities: admitted continues from durable state; clearly not admitted permits a new explicit decision; conflict or inconsistency is `BLOCKED`. No automatic retry, replay, or SSH failover is authorized.
- The prior real-signed admission-precondition rejection canary is `RETIRED_INCONCLUSIVE` and must not be retried because it intentionally wrote no pointer, State, or Ledger fact and lost Remote output cannot prove its rejection reason.
- `CAN-MA-01` now proves installed current-key/trust mathematics and forged-signature host rejection without taking WIP. `CAN-MA-02` keeps deterministic Foundation product-ID admission and Global-WIP safety evidence; neither submits a production-valid DISPATCH.
- Activation stops at `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`. The first separately user-authorized real product DISPATCH is also the deferred durable positive Remote/real-signature acceptance proof through pointer, State, Ledger, and later PR.

## Current Read-only Host Evidence

These facts are readback only. They prove installed identities and current WIP absence, not completion of the fourteen-canary matrix.

### Status, service, and socket

- Fixed CLI `status` reported `active_change_id: null`, `pointer_status: EMPTY`, and no current State object. No WIP admission or product command was performed.
- LaunchDaemon `system/com.juanerai.change-coordinator` is running as PID `15235`, program `/opt/homebrew/bin/node`, runtime `host-loop.mjs`.
- Socket parent `/private/var/run/juanerai` is `root:wheel` mode `0755`; the active socket is `root:staff` mode `0660`.
- A direct non-login SSH shell cannot resolve the CLI's `/usr/bin/env node`; explicit `/opt/homebrew/bin/node /usr/local/bin/juanerai-coordinator status` succeeds. This does not block the normal Remote courier path, but remains a `CAN-MA-14` invocation/readback risk.

### Install receipt `install-receipt-341a08e.json`

- Receipt file SHA-256: `36d118fa7c2f271eff6bbb04293d3e619a64ba39579d4d42474bd500eac16f7a`; service SHA-256: `53fb11ed4690a9741edc35390fb8028a8c25d9828935fa1ece113c924ce6fde9`; manifest SHA-256: `1d19a25d75fc50d75e6155e7a984071402c060169a0f762096aa9a563372e264`.
- Pinned Git directory is `root:root` mode `0755`. Git is mode `0755`, SHA-256 `6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab`, and non-root effective write is denied. `libintl.8.dylib` is mode `0444`, SHA-256 `9cf2cc193c7ee8db00d4a5df13f6f0f0277f6b83e45177dece6f9c99fc454dbd`, effective-write denied; `libpcre2-8.0.dylib` is mode `0444`, SHA-256 `0d3fcf6ef5dc2c42cbc6ce2326b5266715461892e4f635b4ebfbce646667e84d`, effective-write denied.
- Controller trust is `root:root` mode `0600`, SHA-256 `073faa77e876673f60bec16843a4b573b66785a91f3ae6f45eab6a21dcd119c2`, ACL SHA-256 `a391804eaad04e843b9b8efa135186e4317a9e5f2ee2c02e5c77d323e33b6838`. Host config is `root:root` mode `0640`, SHA-256 `31f7164d5eac43d325e63d627f727fb738a5d8f6abe40d619547aef6f380efbe`.
- Branch-push key is `root:root` mode `0640`, SHA-256 `826c136bf053448c4474b021b21d94d54579a44f062a08de2b1ab70ee2b39b61`; PR API credential is `root:root` mode `0600`, SHA-256 `d8d796b351098a401be2dec2a5f4d3db02b4fe7e9e6629ec4a50e7a9e129243a`. Receipt ACL/effective-write readback found no runtime-user write grant for the protected trust/config/credential targets. These are identity/ownership/permission readbacks only; no secret bytes were read or recorded.
- State root is `root:root` mode `0700`; the active pointer is mode `0600` with non-root effective write denied.
- Fixed CLI is `root:wheel` mode `0755`, SHA-256 `f5d0d9270c09ec51915bb755b0ac260cb130b396929870cd40e737cc5974cf93`. Runtime directory is `root:root` mode `0755`; installed files are `adapters.mjs` `ce8da4f6c72427a45e09b503436b6368672811b9d66db9b954c132ed0acacd53`, `coordinator.mjs` `2d221ce17a5c33d603320391daabf99f7cb80d85efe419dec2b6170399fb4a7b`, `host-loop.mjs` `8ef00f8a066142a12bd86908b51004fdb52016199334ace2d88f3671fd499c91`, and `production.mjs` `c11e9feee21903c085f0534a7a4a1b1a2a9bb610927593dfcce5829f46ce56bd`; non-root effective write is denied for each.

### Trust binding and rollback

- MacBook signer directory is mode `0700`; signer config and private key are mode `0600`, owned by `huangbo`. No private bytes are recorded here.
- The derived public SPKI fingerprint is `ace797ad909a0373b771aec70c309daa3adce8de3653409b56cdc767725aa8a4`. It equals the staged trust active-key fingerprint, and staged trust bytes equal the installed receipt trust SHA-256 `073faa77e876673f60bec16843a4b573b66785a91f3ae6f45eab6a21dcd119c2`.
- The bounded rollback-rehearsal receipt file SHA-256 is `eb2f55211fa5d70eb6fa37390cf114cf5211b721c097fb73df22c2f4a2a46974`; `rolled_back: true`; preserved classes are active pointer, State, Ledger, Handoff, canary evidence, and Git history; rollback readback SHA-256 is `08c320619613638dcf98d031de59cd3532bd714a251618f8661e87d838cfe03a`.

### GitHub metadata and closed deferral, not `CAN-MA-07/08` PASS

- Repository `gadfly-hbo/JuanerAI` has verified write-enabled deploy key ID `161370084`, title `juanerai-mode-activation-branch-2026-08-26`, `read_only: false`.
- Active ruleset `main-protection` ID `21155736` applies to `~DEFAULT_BRANCH`, has `bypass_actors: []`, and includes deletion, non-fast-forward, required-linear-history, and pull-request rules.
- The installed PR credential is a fine-grained PAT whose source file SHA-256 remains `d8d796b351098a401be2dec2a5f4d3db02b4fe7e9e6629ec4a50e7a9e129243a`. Read-only API probes returned `200` for repository Metadata read, `200` for `contents/README.md` with Contents read, and `200` for Pull Requests read; no credential bytes are recorded.
- Controller GitHub UI readback shows `Access on gadfly-hbo`; repository access is limited to `gadfly-hbo/JuanerAI`; User permissions are absent; Repository permissions are exactly `Read access to code and metadata` and `Read and Write access to pull requests`, with no Contents write displayed. The token has no expiration date; this is a residual credential-lifetime risk, not security PASS evidence.
- MacBook `gh` first read back Foundation PR `#16` as already merged at `2026-08-26T07:43:07Z`, merge SHA `fec08a5300869d9f8411c406c2f4efd79af95467`. The installed PAT was then used once against only that already-merged Foundation PR for a deterministic no-merge-side-effect permission negative: HTTP `403`, accepted permission `contents=write`, message `Resource not accessible by personal access token`, sanitized response SHA-256 `4f12f19a7a726a59f1b55ab5395f93e52c30fa24a45d2b5155e79f19c63233a9`. No product PR merge endpoint was called. This closes the pre-Activation PR-credential no-merge-authority prerequisite without claiming a positive PR mutation path.
- Structural credential isolation, deterministic safety, and ruleset metadata remain preserved. No real product PR merge endpoint may be called.
- Only production-positive Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback are deferred to the first authorized real product Change through the existing Foundation/Host Loop route. Any absence, ambiguity, conflict, or mismatch is `BLOCKED` and prevents Acceptance. `CAN-MA-07/08` are not yet PASS.

## Prior Controller Spec Gate Evidence

This section preserves the pre-R3 Spec Gate result as historical evidence; it is not the verdict for the revised bytes above.

- Prior Controller verdict: `PASS` after complete readback of all seven files and comparison with the canonical Foundation.
- Official GitHub permission correction: closed. Git transport and PR API credentials are separate and purpose-bound; the PR API credential has Metadata read, Contents read, and Pull Requests write but no Contents write.
- Mandatory `ponytail-review`: `Lean already. Ship.` No persistent abstraction or dependency was identified for deletion.
- `git diff --check -- openspec/changes/mode-activation`: PASS.
- Static inventory: 7 files / 8 Requirements / 37 Acceptance Criteria / 14 canaries.
- Canonical Foundation spec SHA-256 remained `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.
- Scope readback: every Spec write remained inside `openspec/changes/mode-activation/**`; pre-existing `.juanerai/project-control/**` changes remained untouched.
- `openspec validate mode-activation --strict`: not run because the `openspec` CLI is unavailable locally.

Historical Spec Gate input file SHA-256 values, read back immediately before that verdict transition:

| File | SHA-256 |
|---|---|
| `proposal.md` | `d033d332dc7424aea3c6699d5c94a134ca3cb66d6b32b14b735ec84cfe916717` |
| `design.md` | `fb65c14004637cdcd4de18546e8c53201cf626ebb2b84d4ea2d97bedce95b070` |
| `specs/mode-activation/spec.md` | `b3c023ae271c2b7548135fbab5e3cad49ecd569a67346847b1001c8679845cea` |
| `tasks.md` | `ec3c5a54bb2cd45349e46b3a5a1f56da683b61de7011887c32d3e22458c031e8` |
| `test-plan.md` | `714b82c93d9bce4bf1810f32a7657f8e6cb6968b71bf59661e16f1f8bf54f816` |
| `traceability.md` | `b31ef02b8723d740dcd4162f177fb9c000729f4ed8d517ba55ee417d716d106a` |
| `verification.md` pre-transition | `5ab6b26485c1901b64c9f78fdc8785e2ba62fc5f31d6a85f742f8a82a2c4aeb7` |

`verification.md` cannot contain its own post-transition SHA-256 without creating a self-reference. Its final post-transition hash is reported by the Spec handoff after this write; the other six hashes above remain the current file hashes.

The reproducible static commands are:

```text
git diff --check -- openspec/changes/mode-activation
openspec validate mode-activation --strict
git diff --name-only -- openspec/changes/mode-activation
shasum -a 256 openspec/changes/mode-activation/proposal.md \
  openspec/changes/mode-activation/design.md \
  openspec/changes/mode-activation/specs/mode-activation/spec.md \
  openspec/changes/mode-activation/tasks.md \
  openspec/changes/mode-activation/test-plan.md \
  openspec/changes/mode-activation/traceability.md \
  openspec/changes/mode-activation/verification.md
```

The current Spec Agent must also prove no write outside `openspec/changes/mode-activation/**` and preserve the pre-existing `.juanerai/project-control/**` dirty files unchanged.

## Prior Courier-only R3 Re-gate Evidence

- Prior Controller R3 Spec re-gate: `PASS` for the courier-only bytes that preceded this `CAN-MA-07/08` deferral revision. The result and `RETIRED_INCONCLUSIVE` canary disposition remain historical evidence rather than being overwritten.
- `git diff --check -- openspec/changes/mode-activation`: PASS.
- Static inventory remains 7 files / 8 Requirements / 37 Acceptance Criteria / 14 unchanged canary IDs.
- Current rerun `node --test tools/harness/change-coordinator/mode-activation.test.mjs tools/harness/change-coordinator/coordinator.test.mjs`: `171/171 PASS`, no fail/cancel/skip/todo.
- Current rerun `node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs`: `12/12 PASS`, no fail/cancel/skip/todo.
- Current rerun `JUANERAI_TOOLCHAIN_BIN=/Users/huangbo/Dev/Env/homebrew/bin tools/harness/validation/run`: exit `0`.
- `openspec validate mode-activation --strict`: not run because the `openspec` CLI remains unavailable locally.
- Scope readback: all R3 writes are limited to the existing seven files under `openspec/changes/mode-activation/**`. Pre-existing `.codex/config.toml` and `.juanerai/project-control/**` dirty files remain outside this Spec Agent's writes.

## Current R3 Deferral Revision

- Result: `SPEC_REGATE_PASS_REPLACEMENT_CANDIDATE_AUTHORIZED`.
- Controller exact re-gate input SHA-256 readback: `proposal.md=f5db31dcffd4651aaf4c5615343779f5ee5091e8b88fe826ee1cbb2920a5375b`; `design.md=ec8abe19c0aa46eb1b4ea6c4b336a20c70e013c5ecacbeecea9905a43861f67a`; `specs/mode-activation/spec.md=d670f17e1c123e4a5e19de9ddf0df590b81d9c4891e5becff7d863f6470a9775`; `tasks.md=e9b4cd17dc0d35a65a29f9974c99580203c7b54006abb8884aefa4e7251a25b3`; `test-plan.md=a48682ebca50a9e13f3f6af4167328e318a084204d05b457166c01cbf4272389`; `traceability.md=6c5e6bff72be883ebda72502c53818eccfb0b6586d04ffda6a057ad448a7cb06`; `verification.md=d3adec0eee9b565fd688a38d9983dca5f61625022f4e917d8228404f51fc4326`. The `verification.md` value is the exact Gate input before this evidence-only verdict update; its new final hash is reported by the Spec handoff.
- Static inventory readback: 7 files / 8 Requirements / 37 Acceptance Criteria / 14 unchanged Canary IDs; `git diff --check -- openspec/changes/mode-activation` PASS.
- The first sandboxed full-Coordinator run had one environment-only false failure because Unix socket `listen` returned `EPERM`. The same full command outside the sandbox, `node --test tools/harness/change-coordinator/*.test.mjs`, passed `222/222`, with no failure.
- Project-board rerun passed `12/12`; the canonical runner exited `0`.
- Controller authorization is limited to creating and reading back the descendant replacement Candidate. It has not been created; `09a38c7d3656189241e6226b64a1f5f76f802c59` remains `AWAITING_REPLACEMENT_CANDIDATE`, not `SUPERSEDED`.
- Deferral is closed to exactly three first-product effects: Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback.
- No new Canary interface, direct production-adapter invocation, disposable Change, Foundation/interface/state/event/Gateway/lock/recovery delta, or real-product merge call is authorized.
- All deferred effects use existing Foundation/Host Loop execution and exact readback; any unavailable, ambiguous, conflicting, or mismatched evidence is `BLOCKED` and forbids Acceptance.
- PR no-merge authority was satisfied before Activation-ready by the deterministic, no-merge-side-effect permission negative recorded above; the positive PR create/update/read path remains deferred and `CAN-MA-07` remains not PASS.

Current revised non-self-referential file SHA-256 values:

| File | SHA-256 |
|---|---|
| `proposal.md` | `f5db31dcffd4651aaf4c5615343779f5ee5091e8b88fe826ee1cbb2920a5375b` |
| `design.md` | `ec8abe19c0aa46eb1b4ea6c4b336a20c70e013c5ecacbeecea9905a43861f67a` |
| `specs/mode-activation/spec.md` | `d670f17e1c123e4a5e19de9ddf0df590b81d9c4891e5becff7d863f6470a9775` |
| `tasks.md` | `758a5ca1abc58505095a9921dfbad3c38759e0ccb05f9c1aa8bec023e60922c7` |
| `test-plan.md` | `a48682ebca50a9e13f3f6af4167328e318a084204d05b457166c01cbf4272389` |
| `traceability.md` | `6c5e6bff72be883ebda72502c53818eccfb0b6586d04ffda6a057ad448a7cb06` |

`verification.md` cannot contain its own final SHA-256 without self-reference; the Spec handoff reports it after final readback.

## Candidate Lineage

- `09a38c7d3656189241e6226b64a1f5f76f802c59` is the preserved pre-revision Candidate, parent `341a08ebfeb20b2b56ae911bd35f88e27f3b5018`, status `AWAITING_REPLACEMENT_CANDIDATE`.
- It SHALL be marked `SUPERSEDED` only after a descendant replacement Candidate containing this exact revision is created and read back. Its commit, prior validation, host evidence, and historical Gate records remain immutable and are never deleted or rewritten.

## External Prerequisites — Current Status

| Prerequisite | Current status | Release evidence |
|---|---|---|
| Mac mini administrator install/rollback authority | `READBACK_PRESENT` | install/manifest/service and rollback receipt hashes, owner/mode/ACL/effective-write readback; final canary/Validator review pending |
| dual-host Git `2.54.0` same executable SHA | `READBACK_PRESENT` | installed Git SHA equals MacBook canonical `6b348e...`; executable/runtime closure read back; remaining dual-host canary evidence pending |
| Mac mini compatible Node/Codex route | `PARTIAL` | LaunchDaemon runs exact Node/host-loop identity; exact four-role route canary remains pending |
| isolated Mac mini GitHub credentials | `NO_MERGE_CLOSED; CAN-MA-07_PENDING_DEFERRED_POSITIVE` | installed identities, repository-scoped UI permission readback, structural isolation, verified deploy-key/ruleset metadata, and deterministic no-side-effect `403` merge-permission negative preserved; no-expiration token remains a lifetime risk; production branch/PR positive readbacks deferred to first authorized product Change |
| Evidence Ref production append/readback | `CAN-MA-08_DEFERRED_POSITIVE` | deterministic append-only/readback safety preserved; exact production append/readback deferred to first authorized product Change and blocks Acceptance on any non-exact result |
| real Ed25519 trust and host loop | `PARTIAL` | signer/trust fingerprint binding, owner/mode/ACL/effective-write, service/socket/PID/config hashes read back; remaining trust/rotation/revocation and host canaries pending |

The current Controller re-gate authorizes creation of the replacement Candidate; these facts do not establish all external prerequisites or Activation readiness.

## Repository GREEN and Test Asset Retirement

- Foundation Core SHA-256 remained `2d221ce17a5c33d603320391daabf99f7cb80d85efe419dec2b6170399fb4a7b`; canonical Foundation Spec SHA-256 remained `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.
- `node --test tools/harness/change-coordinator/*.test.mjs`: `222/222 PASS`, no fail/cancel/skip/todo.
- `node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs`: `12/12 PASS`.
- `JUANERAI_TOOLCHAIN_BIN=/Users/huangbo/Dev/Env/homebrew/bin tools/harness/validation/run`: exit `0`.
- `node --check` passed for every changed Coordinator runtime/CLI/installer module; `plutil -lint` passed for the LaunchDaemon; `git diff --check` passed.
- Frozen Test hashes: `mode-activation.test.mjs` `51cf95c12716ed498363984e78b4f45b2e2af02692eed052e9a0d411171872ae`; `git.integration.test.mjs` `9931c741e62c83357b6e83aa28c93d26ce54fe2707caf7c3ca39dde642e19b08`; `cli.test.mjs` `257a35d20fbfe2aafba8c7be9fc4a27e9228152ec81b9b0974ae89df046505d6`.
- Test Asset Retirement: all three Activation Test surfaces are retained as permanent regression coverage. No temporary test, dual-shape compatibility helper, obsolete recovery leaf, or secret-bearing fixture remains.
- Mandatory Test-diff `ponytail-review`: `Lean already. Ship.` No test-only abstraction or speculative compatibility surface was identified for deletion.
- The only non-product writes outside the Proposal's Worker allowlist are Controller-owned append-only project-control events and its current status read model; they are not Worker implementation changes.

## Future Current-read-model Fields

At each Gate this file must be updated with the exact current verdict, subject Candidate/config hashes, evidence matrix, Test Asset Retirement verdict, fourteen-canary results, Validator verdict/Head, PR/Handoff/archive/main identities, backup/rollback result, residual risk, and next Gate. It must preserve only the exact three `CAN-MA-07/08` production-positive effects as deferred until the first separately authorized real product Change, keep the retired inconclusive canary retired, and retain `09a38c7d3656189241e6226b64a1f5f76f802c59` as superseded history after replacement. Historical failures remain in immutable detailed evidence and are linked rather than overwritten.

## Stop Condition

Any requirement to alter the canonical Foundation contract/interface/schema/state/event/Gateway/lock/recovery boundary, add a Canary interface, directly invoke a production adapter, add transport receipts/outbox/queue/replay, submit a disposable valid DISPATCH, call merge on a real product PR, expose a secret, or accept unprovable host/GitHub/Git identity changes the current verdict to `BLOCKED` and returns to the Controller. The furthest success state for this Change is `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`; the exact three deferred positive effects remain part of the separately authorized first real product Change and block its Acceptance until exact readback.
