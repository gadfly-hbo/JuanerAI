# Verification: Mode Activation

## Current Verdict

- Verdict: `FOUNDATION_RELEASE_SAFETY_REPAIR_IN_PROGRESS`
- Meaning: Exact Candidate `716c0ac7809f118e54c741645fd25ec4962c7c98` is rejected/superseded delivery evidence after its fresh exact-Candidate Validator returned `FAIL` for RELEASE pointer ownership, dual-main SHA binding, and current-evidence ambiguity. The earlier `10ba759eefe3d4ff3bae08d5775882e28422fad8` Candidate and Validator `BLOCKED` result remain older rejected history. The successful Host Install Gate evidence below remains current for the installed `coordinator.mjs=4efc2f28...` bytes and is not overwritten; once the authorized RELEASE repair changes repository Coordinator bytes, that installed runtime is explicitly stale until a separately authorized bounded Host Runtime replacement rebinds and reads it back. No reinstall, fresh Validator, PR, archive, merge, main synchronization, Activation readiness, or product-Change authority is currently allowed.
- Baseline/main/origin-main: `fec08a5300869d9f8411c406c2f4efd79af95467`
- Most recent rejected exact Candidate: `716c0ac7809f118e54c741645fd25ec4962c7c98`; local and remote branch refs were equal at validation intake. Its fresh Validator returned `FAIL`; this Candidate SHALL NOT be relabeled current, PASS, final, or Activation-ready. Candidate `10ba759eefe3d4ff3bae08d5775882e28422fad8` remains older rejected historical evidence.
- Branch: `work/macbook/mode-activation`
- Next Gate: complete the strictly bounded Foundation RELEASE causal RED/GREEN and form a descendant code Candidate. Because its `coordinator.mjs` bytes will differ from the installed Host Loop, stop for separate Host Runtime replacement authorization. Only after exact runtime hash/status/pointer/Socket/Host Install readback may one fresh exact-Candidate Validator start. `MA-TASK-013` remains locked until that Validator passes and first PR review completes.

## Current Foundation RELEASE Safety Repair GREEN

- Rejected subject: Candidate `716c0ac7809f118e54c741645fd25ec4962c7c98`; its fresh exact-Candidate Validator `FAIL` identified missing RELEASE pointer ownership, missing signed dual-main SHA equality, and ambiguous current evidence. It remains immutable rejected/superseded history.
- Frozen causal Test: `tools/harness/change-coordinator/coordinator.test.mjs` SHA-256 `c1a4833fcab24d3710abdbda767e8c1fa3f77d984b9d654b57d373403f86c3af`. Ten new permanent regression leaves cover first RELEASE foreign-pointer rejection, CLOSED retained-pointer ownership, all seven non-equal MacBook/origin/squash SHA combinations, and the final pointer-clear ownership reread.
- Credible RED: `179/191 PASS`; the ten new leaves plus their two parent aggregations failed, while every pre-existing leaf passed. Observed unsafe outcomes included foreign-pointer `CLOSED`, unequal-SHA `CLOSED` or late `BLOCKED`, and pointer-clear race `CLOSED`.
- Minimal Worker GREEN: only `tools/harness/change-coordinator/coordinator.mjs` changed, from installed/rejected-Candidate SHA-256 `4efc2f2835c3bd31516cc2761c099dbb118993eaf9035edccbd50e718ce0ed55` to repository SHA-256 `c04193f05a704890be51a22938123c527d0157f0f6270ad2324fc4b65415e996`. No interface, state, event, Gateway, Schema, lock, error vocabulary, or recovery boundary was added.
- Validation: directed RELEASE safety `23/23 PASS`; complete `coordinator.test.mjs` `191/191 PASS`; all Coordinator tests `259/259 PASS` outside the sandbox; project-control/project-board `12/12 PASS`; canonical runner exit `0`; `git diff --check` PASS.
- Test Asset Retirement: all ten new leaves are permanent regression evidence owned by `TEST-DTF-R1-010 / AC-DTF-006-01..05`; no helper, fixture, temporary asset, duplicate compatibility form, skip/todo/only marker, or retirement candidate was introduced. `ponytail-review`: `Lean already. Ship.`
- Runtime binding: the installed Mac mini Host Loop still contains `coordinator.mjs=4efc2f28...`, while the repaired repository code is `c04193f0...`. Therefore the successful Host Install evidence below remains valid only for the installed pre-repair runtime. It SHALL NOT be used to claim that the repaired Candidate is deployed or Activation-ready. No product Change, valid RELEASE, PR, archive, merge, or main synchronization is allowed until a separately authorized bounded Host Runtime replacement installs and reads back the exact repaired Coordinator bytes.

## Current Host Install Gate PASS Evidence

- Gate decision: user confirmed `Mode Activation Host Install Gate PASS` and released only the Host Install-specific `MANUAL_CONTROLLER_STOP`. This does not authorize reinstall, contract expansion, a disposable Change, or a product Change.
- Successful installer invocation used the repaired installer bytes only once against the canonical plan. Receipt manifest: `/private/var/db/juanerai/change-coordinator-install-backups/bf56303f56170cec712b77d276b9fff7/manifest.json`; manifest SHA-256 `abdb59817d3c4fad937261d47fcecdbef65228378dd9b7b1504a72d7624d793d`; LaunchDaemon service readback SHA-256 `c01d6e9f440219d6d8b870e12ef079d4c1f071d1e661c39a44e68c2ccc6f75a8`; successful receipt installed 19 governed targets.
- Installed source binding at Host Install Gate: `install-host-loop` SHA-256 `c25e6634b9e225a893b83a027c2323606c84fb80e4049646d7d121fd02bed8ff`; installed runtime files are `adapters.mjs=ce8da4f6c72427a45e09b503436b6368672811b9d66db9b954c132ed0acacd53`, `coordinator.mjs=4efc2f2835c3bd31516cc2761c099dbb118993eaf9035edccbd50e718ce0ed55`, `host-loop.mjs=8ef00f8a066142a12bd86908b51004fdb52016199334ace2d88f3671fd499c91`, and `production.mjs=4fec4c2a5ad803a607fa799ff514dbe20669a5e7dd2c4f209bc190238d098509`. Those bytes matched Candidate `716c0ac` at installation/validation intake. The authorized RELEASE repair now makes repository `coordinator.mjs=c04193f0...`; the installed Coordinator is intentionally marked stale pending bounded replacement.
- Pointer/status: `/private/var/db/juanerai/change-coordinator/active-change.json` SHA-256 is `811f872ce38df88357395b2a438eb1c96504f1b583dd77724867f6dc0eaf32a9`, parsed as schema `1.0` with `active_change_id=null`. Fixed CLI `status` exited `0`, returned one canonical JSON line with SHA-256 `de94a7b9a1585f1282a3ddf580950347c2a81eaebf854111fb2252a796c37938`, `pointer_status=EMPTY`, and null State/Candidate/Delivery.
- Fixed Git: installed `/Users/huangbo/Dev/Env/homebrew/bin/git` is unchanged Git `2.54.0`, SHA-256 `6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab`. Its non-system libraries are `libintl.8.dylib=9cf2cc193c7ee8db00d4a5df13f6f0f0277f6b83e45177dece6f9c99fc454dbd` and `libpcre2-8.0.dylib=0d3fcf6ef5dc2c42cbc6ce2326b5266715461892e4f635b4ebfbce646667e84d`; all three files are root-owned and runtime-user write is denied.
- Runtime authority: every required ancestor `/Users/huangbo`, `/Users/huangbo/Dev`, `/Users/huangbo/Dev/Env`, `/Users/huangbo/Dev/Env/homebrew`, `/Users/huangbo/Dev/Env/homebrew/opt`, `/Users/huangbo/Dev/Env/homebrew/opt/gettext`, and `/Users/huangbo/Dev/Env/homebrew/opt/pcre2` has the single normalized traversal entry `user:bendandebaba allow search`, effective write denied, root ownership, and mode `0700`. No listing, write, or ownership authority was granted.
- Runtime and Socket: `/usr/local/libexec/juanerai-change-coordinator` is root-owned mode `0755`, all installed runtime children are mode `0644` and runtime-user write denied; `/private/var/run/juanerai` is root-owned mode `0755`; `/private/var/run/juanerai/change-coordinator.sock` is a Socket owned by `root:staff` with mode `0660`. CLI SHA-256 is `f5d0d9270c09ec51915bb755b0ac260cb130b396929870cd40e737cc5974cf93`.
- Root-owned configuration target hashes from the successful receipt are: `controller-trust.json=073faa77e876673f60bec16843a4b573b66785a91f3ae6f45eab6a21dcd119c2`, `github-branch-push-key=826c136bf053448c4474b021b21d94d54579a44f062a08de2b1ab70ee2b39b61`, `github-pr-api-credential=d8d796b351098a401be2dec2a5f4d3db02b4fe7e9e6629ec4a50e7a9e129243a`, and `host-loop.json=31f7164d5eac43d325e63d627f727fb738a5d8f6abe40d619547aef6f380efbe`. Secret bytes are not reproduced in evidence.
- Failure recovery precedent remains preserved separately: the immediately preceding partial install was recovered from its exact manifest without residue, kept pointer SHA-256 unchanged, removed only its three recorded temporary ACL entries, and did not overwrite State, Ledger, Handoff, canary evidence, or Git history. It is historical recovery evidence, not part of the successful install identity.
- Readback disposition at installation: `PASS`. Manifest, receipt, status, pointer, Git closure, Socket, ACL, runtime permissions, and target hashes agreed with the then-current Mode Activation source and canonical plan. The later RELEASE repair changes only repository Coordinator bytes and does not invalidate the recorded host facts, but it does invalidate source/runtime equality until replacement. No product Change, valid DISPATCH, Worktree, Agent, Evidence Ref append, product branch push, or product PR effect occurred.

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

## Historical Pre-successful-install Host Evidence

These facts describe the superseded `install-receipt-341a08e.json` installation and are retained only as historical readback. They do not override the current successful Host Install Gate evidence above and do not identify the runtime to be delivered by the next Candidate.

### Status, service, and socket

- Fixed CLI `status` reported `active_change_id: null`, `pointer_status: EMPTY`, and no current State object. No WIP admission or product command was performed.
- LaunchDaemon `system/com.juanerai.change-coordinator` is running as PID `15235`, program `/opt/homebrew/bin/node`, runtime `host-loop.mjs`.
- Socket parent `/private/var/run/juanerai` is `root:wheel` mode `0755`; the active socket is `root:staff` mode `0660`.
- A direct non-login SSH shell cannot resolve the CLI's `/usr/bin/env node`; explicit `/opt/homebrew/bin/node /usr/local/bin/juanerai-coordinator status` succeeds. This does not block the normal Remote courier path, but remains a `CAN-MA-14` invocation/readback risk.

### Historical install receipt `install-receipt-341a08e.json`

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

## Historical R3 Deferral Revision

- Historical result: `SPEC_REGATE_PASS_REPLACEMENT_CANDIDATE_CREATED`; it was superseded by Candidate `10ba759e` and the fresh Validator `BLOCKED` result below.
- Controller exact re-gate input SHA-256 readback: `proposal.md=f5db31dcffd4651aaf4c5615343779f5ee5091e8b88fe826ee1cbb2920a5375b`; `design.md=ec8abe19c0aa46eb1b4ea6c4b336a20c70e013c5ecacbeecea9905a43861f67a`; `specs/mode-activation/spec.md=d670f17e1c123e4a5e19de9ddf0df590b81d9c4891e5becff7d863f6470a9775`; `tasks.md=e9b4cd17dc0d35a65a29f9974c99580203c7b54006abb8884aefa4e7251a25b3`; `test-plan.md=a48682ebca50a9e13f3f6af4167328e318a084204d05b457166c01cbf4272389`; `traceability.md=6c5e6bff72be883ebda72502c53818eccfb0b6586d04ffda6a057ad448a7cb06`; `verification.md=d3adec0eee9b565fd688a38d9983dca5f61625022f4e917d8228404f51fc4326`. The `verification.md` value is the exact Gate input before this evidence-only verdict update; its new final hash is reported by the Spec handoff.
- Static inventory readback: 7 files / 8 Requirements / 37 Acceptance Criteria / 14 unchanged Canary IDs; `git diff --check -- openspec/changes/mode-activation` PASS.
- The first sandboxed full-Coordinator run had one environment-only false failure because Unix socket `listen` returned `EPERM`. The same full command outside the sandbox, `node --test tools/harness/change-coordinator/*.test.mjs`, passed `222/222`, with no failure.
- Project-board rerun passed `12/12`; the canonical runner exited `0`.
- Controller authorization produced and read back first descendant replacement Candidate `c4a4f4dca8c7c0a7970d6cc0901b39f1578baa93`; its local and remote branch refs matched. This post-Candidate evidence closure requires a new descendant commit and Controller HEAD/remote readback before any final exact subject exists; no final validation or Validator result is claimed.
- Deferral is closed to exactly three first-product effects: Evidence Ref append/readback, product-branch push/readback, and PR create/update/readback.
- No new Canary interface, direct production-adapter invocation, disposable Change, Foundation/interface/state/event/Gateway/lock/recovery delta, or real-product merge call is authorized.
- All deferred effects use existing Foundation/Host Loop execution and exact readback; any unavailable, ambiguous, conflicting, or mismatched evidence is `BLOCKED` and forbids Acceptance.
- PR no-merge authority was satisfied before Activation-ready by the deterministic, no-merge-side-effect permission negative recorded above; the positive PR create/update/read path remains deferred and `CAN-MA-07` remains not PASS.

Historical re-gate non-self-referential file SHA-256 values:

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

- `09a38c7d3656189241e6226b64a1f5f76f802c59` is the preserved pre-revision Candidate, parent `341a08ebfeb20b2b56ae911bd35f88e27f3b5018`, status `SUPERSEDED` by `c4a4f4dca8c7c0a7970d6cc0901b39f1578baa93`. Its commit, prior validation, host evidence, and historical Gate records remain immutable and are never deleted or rewritten.
- `c4a4f4dca8c7c0a7970d6cc0901b39f1578baa93` is the first descendant replacement Candidate; its direct parent is `09a38c7d3656189241e6226b64a1f5f76f802c59`, its committed `verification.md` SHA-256 is `7d66d5245ea24bee0c0061253412a0128a108c5503a3a6e512270e84bbd4fd37`, and its local/remote branch readback was exact. The evidence-closure commit after it becomes the final validation subject only after Controller post-commit local/remote HEAD readback; that future SHA is not written here.
- `10ba759eefe3d4ff3bae08d5775882e28422fad8` is the exact descendant Candidate of `c4a4f4d`, with equal local/remote branch refs at validation intake. A fresh Validator returned `BLOCKED` on the Mode Activation archive route plus three production execution safety defects. `10ba759e` remains rejected historical evidence and SHALL NOT be relabeled PASS, final, or Activation-ready.

## Current Foundation Repository Identity GREEN

- Canonical Foundation specification SHA-256: `2633ad86bbafe2aff61d61e4c1bf8c9d4dd5d439141731c1f41afa9ab8f33df8`.
- `coordinator.mjs`: `4efc2f2835c3bd31516cc2761c099dbb118993eaf9035edccbd50e718ce0ed55`; `coordinator.test.mjs`: `de93ab87043ff945f4759e4854f52b80429bc1bdc327784ae7623f56440b4696`; `fixtures.mjs`: `48b1265a4d8c15179c8b9f2384d5f0d9477a877a61176ff79816f43c354b83d8`.
- Focused Foundation result: `180/180 PASS`; canonical runner exit `0`; Test Asset Retirement PASS; archived Foundation history unchanged.
- Frozen contract: same-process verified `acceptedDispatch.body.repository.repository_id == 'gadfly-hbo/JuanerAI'`, with independent production second match `config.github_repository == 'gadfly-hbo/JuanerAI'`. Config, State, digest, or `change_id` never substitutes for signed authority; authority-less restart remains `BLOCKED`.
- Disposition: mandatory safety regression/integration evidence only. `coordinator.mjs`, `coordinator.test.mjs`, fixtures, and canonical Foundation spec are not Mode Activation Test/Worker write paths and repository identity is not a remaining causal RED.

## Current Bounded Safety Repair

- User-approved remaining scope: one MacBook Controller bootstrap mechanic plus two production safety repairs; no Foundation interface, State, event, Gateway, lock, recovery, dependency, or product contract change.
- Bootstrap route: after first PR review MacBook Controller mechanically archives and publishes canonical bytes on the same branch/PR descendant Candidate without Foundation REVISION, active pointer, DISPATCH, Mac mini archive, or Worker production implementation. Static contract/path tests remain regression only. The exception never applies to product Changes.
- Git runtime closure: fixed Git/library bytes remain unchanged; no `install_name_tool` or root-Git substitution. Runtime UID `501` requires search/execute-only traversal across every needed ancestor, complete owner/mode/ACL/effective-write backup/readback/rollback, and real UID `501` Git `2.54.0`/SHA proof.
- Branch push: existing Gateway reads local `refs/heads/<branch> == Candidate`, requires remote predecessor `== expected_remote_head`, pushes that exact Candidate to the same ref, and reads back remote `== Candidate`; mismatch stops before push or uses only the existing ambiguity boundary.
- Test mapping: exactly `RED-MA-GIT-RUNTIME-ACL` and `RED-MA-LOCAL-REF-CANDIDATE`. Only `mode-activation.test.mjs` and `git.integration.test.mjs` may change; `cli.test.mjs` and Foundation tests remain frozen regression. No new Test or production execution has started under this revision.
- Historical pre-repair `mode-activation.test.mjs` SHA-256: `3155bbad4eddad0015dc10529f6744c4dd1bfd6a272d248e51bb6a5b997d7442`. The previously recorded `51cf95c1...` value was not the actual Candidate file hash and is corrected here without overwriting the historical Candidate/Validator result.

### Static Spec Repair Readback

- `git diff --check` on the exact seven allowed files: PASS.
- Inventory: 7 changed Mode Activation files; 8 Requirements; 37 Acceptance Criteria; 14 unchanged Canary IDs; exactly 2 causal RED rows.
- Current non-self-referential SHA-256 readback at rejected Candidate `716c0ac`: `proposal.md=09d31657d483e275b2ac04dd5870ee3933f6c3e6cff8eafbe82f2fd7e3d7f6cd`; `design.md=3a79cd496edc08b356232493bcbf3b701e8522468c934466f9980e79ad826bc2`; `specs/mode-activation/spec.md=6b468718cdc6582233f57270a73d8898645446c75a8218a1aeb5de82898d5df4`; `tasks.md=30c77e0b9625651eb9c8b9c2780bc41a42f0fc53a289f1758fff608cc0013e1b`; `test-plan.md=54ca341bb747fa7fb751a96921aae42647d150fc048037b7eb7f02c633779be3`; `traceability.md=89519d334efacb3e257fce5cde6cbbb28f1177f7c8823d24735261355a7568b0`. The final `verification.md` hash is returned by the Controller handoff to avoid self-reference.
- Current canonical Foundation specification SHA-256 is `2633ad86bbafe2aff61d61e4c1bf8c9d4dd5d439141731c1f41afa9ab8f33df8`; `139ec510...` remains historical prior-Candidate evidence only. Actual historical Test SHA remains `3155bbad4eddad0015dc10529f6744c4dd1bfd6a272d248e51bb6a5b997d7442`.
- Spec Agent writes are limited to the seven allowed files. Pre-existing `.codex/config.toml` and `.juanerai/project-control/**` dirty state remains outside this Spec Agent's writes.

## External Prerequisites — Current Status

| Prerequisite | Current status | Release evidence |
|---|---|---|
| Mac mini administrator install/rollback authority | `HOST_INSTALL_GATE_PASS` | current manifest/receipt/service/Socket/ACL/runtime/target hashes are frozen above; prior failed-install recovery and bounded rollback remain preserved history |
| dual-host Git `2.54.0` same executable SHA | `PASS` | Mac mini real UID `501` executes unchanged Git `2.54.0` SHA `6b348e...` through search-only ancestors; MacBook uses the same executable/hash; libraries are pinned and runtime-unwriteable |
| Mac mini compatible Node/Codex route | `PASS_PRE_PRODUCT` | LaunchDaemon, fixed CLI status/half-close, Remote route/repository/CLI identity, deterministic exact Agent route, and missing-route manual stop are proven; no valid product DISPATCH was submitted |
| isolated Mac mini GitHub credentials | `NO_MERGE_CLOSED; FOUNDATION_REPOSITORY_IDENTITY_GREEN; LOCAL_REF_GREEN; CAN-MA-07_PENDING_DEFERRED_POSITIVE` | deploy key `161370084` remains verified/write-enabled only for branch transport; active ruleset `21155736` protects default branch without bypass; signed repository identity, fixed production match, local-ref/Candidate/predecessor binding, structural negatives, and no-side-effect merge denial are GREEN; product branch/PR positives remain deferred |
| Evidence Ref production append/readback | `CAN-MA-08_DEFERRED_POSITIVE` | deterministic append-only/readback safety preserved; exact production append/readback deferred to first authorized product Change and blocks Acceptance on any non-exact result |
| real Ed25519 trust and host loop | `PASS_PRE_PRODUCT` | current key `controller-2026-08-26-01`, public SPKI SHA `ace797ad...`, installed trust SHA `073faa77...`, mathematical sign/verify, fixed-host forged rejection, deterministic overlap/revocation/expired/unknown negatives, owner/mode/ACL/effective-write, service/Socket/config identity, and empty pointer are proven |

The prior Controller re-gate and exact local/remote Candidate readback remain historical. Fresh Validator `BLOCKED` means they do not establish current Spec PASS, repaired execution, all external prerequisites, or Activation readiness.

## Historical Pre-Candidate Non-deferred Canary Closure for Rejected `716c0ac`

- Exact repository verification: `node --test tools/harness/change-coordinator/*.test.mjs` passed `248/248` outside the sandbox. The first in-sandbox run passed `247/248`; its sole failure was the environment-only Unix Socket `listen EPERM`, and the exact same command passed outside the sandbox. Project-control passed `12/12`; `JUANERAI_TOOLCHAIN_BIN=/Users/huangbo/Dev/Env/homebrew/bin tools/harness/validation/run` exited `0`; `node --check`, LaunchDaemon `plutil -lint`, and `git diff --check` passed.
- Current Test hashes: `mode-activation.test.mjs=9041985003453933c666caae7643fed9d283f6a529be7b9a5bdc5f33ab2a76b8`; `git.integration.test.mjs=cd027e786e035ddeb505bfa87553365a2fbf91a8d80c3bb5398d2acda356e7c2`; frozen Foundation `coordinator.test.mjs=de93ab87043ff945f4759e4854f52b80429bc1bdc327784ae7623f56440b4696`; fixtures `48b1265a4d8c15179c8b9f2384d5f0d9477a877a61176ff79816f43c354b83d8`.
- Current Controller key proof used inert canonical bytes only: signer config SHA-256 `9dc39a5f21561e0d75d71adbec7cd4be10217f9793ce1a9516ab7c23dc50d3b8`, key ID `controller-2026-08-26-01`, Ed25519 public SPKI SHA-256 `ace797ad909a0373b771aec70c309daa3adce8de3653409b56cdc767725aa8a4`, inert message SHA-256 `6e0f0b7da7d7e3f860d3a8d9cc5ecb416c8a7044d35ead5bc5554e1a099664f7`, mathematical verification `true`. Private key and signature bytes were not recorded.
- Fixed Host Loop forged-signature evidence remains bound to the same installed CLI SHA `f5d0d927...`, Host Loop SHA `8ef00f8a...`, trust SHA `073faa77...`, and public-key fingerprint above: exact fixed-path submission returned canonical `REJECTED / COMMAND_SIGNATURE_INVALID`, exit `2`, with no pointer, State, Ledger, Worktree, repository, or host metadata change. A later Remote result-loss attempt is not promoted to evidence and is not retried.
- GitHub provider readback: deploy key ID `161370084`, title `juanerai-mode-activation-branch-2026-08-26`, `verified=true`, `read_only=false`; active branch ruleset ID `21155736`, name `main-protection`, target default branch, `bypass_actors=[]`, rules `deletion`, `non_fast_forward`, `required_linear_history`, and `pull_request`. No Mode Activation PR exists before Candidate creation.
- Test Asset Retirement: all changed Test/fixture/helper surfaces have permanent named owners and active consumers; no `.skip`, `.todo`, `.only`, scratch/correction asset, untracked Test, duplicate compatibility shape, or orphaned helper remains. Temporary repositories and OS roots are bounded fixtures with `finally` cleanup. `ponytail-review` result: `Lean already. Ship.`

| Canary | Pre-Candidate disposition | Exact basis |
|---|---|---|
| `CAN-MA-01` | `PASS` | current-key/trust math, exact installed identity, forged-host rejection, deterministic unknown/expired/revoked/overlap negatives, empty pointer |
| `CAN-MA-02` | `PASS` | product-ID admission and second-Change/WIP negatives in frozen Foundation regression; no production-valid DISPATCH |
| `CAN-MA-03` | `PASS_DETERMINISTIC` | exact Worktree/baseline/branch/clean/scope positive and dirty/wrong/extra-path negatives through unchanged Foundation |
| `CAN-MA-04` | `PASS` | exact Agent binding/settlement deterministic evidence plus installed fixed-CLI status and half-close response |
| `CAN-MA-05` | `PASS` | host cannot submit mechanical receipts; Foundation-only Git/Ledger/validation/PR/Handoff ordering |
| `CAN-MA-06` | `PASS_DETERMINISTIC` | exact local Candidate, predecessor, Candidate refspec, remote/Validator/PR/Handoff mismatch negatives |
| `CAN-MA-07` | `PASS_NON_DEFERRED / DEFERRED_POSITIVE_OPEN` | signed repository authority, fixed config, credential isolation, deploy-key/ruleset/no-merge proof pass; product branch and PR positive readbacks remain deferred |
| `CAN-MA-08` | `PASS_NON_DEFERRED / DEFERRED_POSITIVE_OPEN` | append-only/identity/conflict/ambiguity negatives pass; production Evidence Ref append/readback remains deferred |
| `CAN-MA-09` | `PASS_DETERMINISTIC` | exact `AWAITING_CONTROLLER` REVISION and wrong-binding effect-free negatives |
| `CAN-MA-10` | `PASS_PRE_ARCHIVE` | descendant Candidate/update-chain regression passes; the one Mode Activation bootstrap archive remains a later Controller mechanic |
| `CAN-MA-11` | `PASS` | canonical STARTED/RESULT/START_FAILED/INTERRUPTED and Coordinator-only NOT_STARTED regression |
| `CAN-MA-12` | `PASS` | one same-scope automatic repair budget and second-FAIL BLOCKED regression |
| `CAN-MA-13` | `PASS_PRE_ARCHIVE` | static bootstrap path/authority and RELEASE safety regression pass; actual bootstrap archive/main readback occurs after first PR review |
| `CAN-MA-14` | `PASS_PRE_CANDIDATE` | D1-A guard, Remote route/fixed CLI, host install/Socket/Git ACL/rollback, missing-route stop, secret boundary and final-stop guard pass; exact Candidate dual-diff, archive, merged-main and final-stop readbacks remain later lifecycle evidence |

The pre-Candidate Gate passed before `716c0ac` was formed, but the fresh Validator subsequently rejected that Candidate. These results remain historical regression evidence only: they do not prove the RELEASE repair, current installed-runtime identity, final Candidate PASS, or product-Change authority. The three deferred first-product effects remain open.

## Historical Pre-identity-correction Repository GREEN and Test Asset Retirement

- At rejected Candidate `10ba759e` intake, Foundation Core SHA-256 was `2d221ce17a5c33d603320391daabf99f7cb80d85efe419dec2b6170399fb4a7b` and canonical Foundation Spec SHA-256 was `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`. These remain historical facts and are not current Foundation identities.
- `node --test tools/harness/change-coordinator/*.test.mjs`: `222/222 PASS`, no fail/cancel/skip/todo.
- `node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs`: `12/12 PASS`.
- `JUANERAI_TOOLCHAIN_BIN=/Users/huangbo/Dev/Env/homebrew/bin tools/harness/validation/run`: exit `0`.
- `node --check` passed for every changed Coordinator runtime/CLI/installer module; `plutil -lint` passed for the LaunchDaemon; `git diff --check` passed.
- Actual pre-repair Test hashes: `mode-activation.test.mjs` `3155bbad4eddad0015dc10529f6744c4dd1bfd6a272d248e51bb6a5b997d7442`; `git.integration.test.mjs` `9931c741e62c83357b6e83aa28c93d26ce54fe2707caf7c3ca39dde642e19b08`; `cli.test.mjs` `257a35d20fbfe2aafba8c7be9fc4a27e9228152ec81b9b0974ae89df046505d6`. The fresh Validator findings require a new Test freeze; these historical hashes do not prove the repair.
- Test Asset Retirement: all three Activation Test surfaces are retained as permanent regression coverage. No temporary test, dual-shape compatibility helper, obsolete recovery leaf, or secret-bearing fixture remains.
- Mandatory Test-diff `ponytail-review`: `Lean already. Ship.` No test-only abstraction or speculative compatibility surface was identified for deletion.
- Current repair Test writes are limited to `mode-activation.test.mjs` and `git.integration.test.mjs`; Worker writes are limited to `install-host-loop` and `production.mjs`. MacBook Controller alone owns the post-first-PR bootstrap archive/canonical mechanic.

## Future Current-read-model Fields

At each Gate this file must be updated with the exact current verdict, subject Candidate/config hashes, evidence matrix, Test Asset Retirement verdict, fourteen-canary results, Validator verdict/Head, PR/Handoff/archive/main identities, backup/rollback result, residual risk, and next Gate. It must preserve only the exact three `CAN-MA-07/08` production-positive effects as deferred until the first separately authorized real product Change, keep the retired inconclusive canary retired, and retain `09a38c7d`, `c4a4f4d`, rejected `10ba759e`, and rejected `716c0ac` as immutable history. Historical failures remain in immutable detailed evidence and are linked rather than overwritten.

## Stop Condition

Any requirement to alter the canonical Foundation contract/interface/schema/state/event/Gateway/lock/recovery boundary, add a Canary interface, directly invoke a production adapter, add transport receipts/outbox/queue/replay, submit a disposable valid DISPATCH, call merge on a real product PR, expose a secret, or accept unprovable host/GitHub/Git identity changes the current verdict to `BLOCKED` and returns to the Controller. The furthest success state for this Change is `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`; the exact three deferred positive effects remain part of the separately authorized first real product Change and block its Acceptance until exact readback.
