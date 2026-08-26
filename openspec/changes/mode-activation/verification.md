# Verification: Mode Activation

## Current Verdict

- Verdict: `REPOSITORY_GREEN_HOST_CANARY_READY`
- Meaning: Spec, causal Test, repository implementation, focused regression, canonical regression, scope readback, and Test Asset Retirement have passed. The exact repository tree is ready for Candidate creation and bounded real-host installation/canaries; no host canary, Validator, PR, archive, merge, RELEASE, Activation-ready state, or product-Change authority is claimed yet.
- Baseline/HEAD/main/origin-main: `fec08a5300869d9f8411c406c2f4efd79af95467`
- Branch: `work/macbook/mode-activation`
- Next Gate: exact repository Candidate, then external prerequisites and `CAN-MA-01..14`

## Frozen Read-only Facts

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

These facts are intake evidence, not proof that prerequisites remain current at installation. Gate 4 must re-read them.

## Controller Spec Gate Evidence

- Controller verdict: `PASS` after complete readback of all seven files and comparison with the canonical Foundation.
- Official GitHub permission correction: closed. Git transport and PR API credentials are separate and purpose-bound; the PR API credential has Metadata read, Contents read, and Pull Requests write but no Contents write.
- Mandatory `ponytail-review`: `Lean already. Ship.` No persistent abstraction or dependency was identified for deletion.
- `git diff --check -- openspec/changes/mode-activation`: PASS.
- Static inventory: 7 files / 8 Requirements / 37 Acceptance Criteria / 14 canaries.
- Canonical Foundation spec SHA-256 remained `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.
- Scope readback: every Spec write remained inside `openspec/changes/mode-activation/**`; pre-existing `.juanerai/project-control/**` changes remained untouched.
- `openspec validate mode-activation --strict`: not run because the `openspec` CLI is unavailable locally.

Spec Gate input file SHA-256 values, read back immediately before this verdict transition:

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

## External Prerequisites — Current Status

| Prerequisite | Current status | Release evidence |
|---|---|---|
| Mac mini administrator install/rollback authority | `BLOCKED_EXTERNAL` (`sudo -n` unavailable) | explicit approval plus root owner/mode/ACL/backup/readback receipts |
| dual-host Git `2.54.0` same executable SHA | `BLOCKED_EXTERNAL` | executable artifact, version/hash/run proof on both devices; no `/usr/bin/git` replacement |
| Mac mini compatible Node/Codex route | `BLOCKED_EXTERNAL` | absolute executable versions/hashes and exact four-role route canary |
| isolated Mac mini GitHub credentials | `BLOCKED_EXTERNAL` | repository deploy-key Git transport receipt; PR API Metadata read/Contents read/Pull Requests write receipt; absent Contents write; transport cross-use rejection; protected-main no-bypass push rejection; PR merge rejection; no secret bytes |
| real Ed25519 trust and host loop | `NOT_STARTED` | key fingerprint, trust ACL/effective-write, service/socket/PID/config hashes, rotation/revocation |

These do not block fresh Test Design and causal RED. They block host installation and every claim of Activation readiness.

## Repository GREEN and Test Asset Retirement

- Foundation Core SHA-256 remained `2d221ce17a5c33d603320391daabf99f7cb80d85efe419dec2b6170399fb4a7b`; canonical Foundation Spec SHA-256 remained `139ec5107d0908ed1f3676cef6d877f26c76c2bcdeb076d411493375caa49d69`.
- `node --test tools/harness/change-coordinator/*.test.mjs`: `221/221 PASS`, no fail/cancel/skip/todo.
- `node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs`: `12/12 PASS`.
- `JUANERAI_TOOLCHAIN_BIN=/Users/huangbo/Dev/Env/homebrew/bin tools/harness/validation/run`: exit `0`.
- `node --check` passed for every changed Coordinator runtime/CLI/installer module; `plutil -lint` passed for the LaunchDaemon; `git diff --check` passed.
- Frozen Test hashes: `mode-activation.test.mjs` `51cf95c12716ed498363984e78b4f45b2e2af02692eed052e9a0d411171872ae`; `git.integration.test.mjs` `9931c741e62c83357b6e83aa28c93d26ce54fe2707caf7c3ca39dde642e19b08`; `cli.test.mjs` `257a35d20fbfe2aafba8c7be9fc4a27e9228152ec81b9b0974ae89df046505d6`.
- Test Asset Retirement: all three Activation Test surfaces are retained as permanent regression coverage. No temporary test, dual-shape compatibility helper, obsolete recovery leaf, or secret-bearing fixture remains.
- Mandatory Test-diff `ponytail-review`: `Lean already. Ship.` No test-only abstraction or speculative compatibility surface was identified for deletion.
- The only non-product writes outside the Proposal's Worker allowlist are Controller-owned append-only project-control events and its current status read model; they are not Worker implementation changes.

## Future Current-read-model Fields

At each Gate this file must be updated with the exact current verdict, subject Candidate/config hashes, evidence matrix, Test Asset Retirement verdict, fourteen-canary results, Validator verdict/Head, PR/Handoff/archive/main identities, backup/rollback result, residual risk, and next Gate. Historical failures remain in immutable detailed evidence and are linked rather than overwritten.

## Stop Condition

Any requirement to alter the canonical Foundation contract/interface/schema/state/event/Gateway/lock/recovery boundary, any unresolved secret exposure, or any unprovable host/GitHub/Git identity changes the current verdict to `BLOCKED` and returns to the Controller. The furthest success state for this Change is `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`.
