# PKG-XANTHIL-DESKTOP-001 — Routing Amendment 001

## Authority and exact base

On 2026-09-19 the user authorized the configuration correction and requested
ordinary tasks at `high` and R2 tasks at `xhigh` (极高). This amendment changes
only development-agent reasoning selection and the bounded Git intake needed
to resume the already-authorized batch. It is not a new product plan, UI
Contract, production Change, or execution task.

- Package: `PKG-XANTHIL-DESKTOP-001`.
- Change: `xanthil-desktop-membership-repurchase-decision-case`.
- Original frozen package branch: `work/macbook/whitepaper-blueprint-v1`,
  now owned exclusively by the Mac mini execution coordinator.
- Original commit: `bb667a6886023c984d7faf8d7a992f4120f2e978`.
- Original tree: `b7308fad77cd5bab9c08cd76ef0fbb34e243d4a9`.
- Original package: `xanthil-desktop-first-product-change-execution-package-v1.0.md`
  in this directory; SHA-256
  `72504be4fe0b6c32cf120a62ac43a0b41d2125f6c2bebc8ef86a90dd6204fb92`.
- Amendment source branch: `work/macbook/wip-preflight-exception-disposition`,
  owned by MacBook. Its fixed commit, tree and this file's SHA-256 are supplied
  in the manual transfer message after commit and remote readback.

The v1.0 file and product/UI inputs are not rewritten. This amendment
supersedes only its R2 `high` selection with `xhigh`; every product decision,
role boundary, path restriction and lifecycle Gate remains in force.

## Confirmed exception and cause

The latest Mac mini receipt reports Stage 0 PASS, Stage 1 PASS and Stage 2 not
entered, stopped at `STAGE2_ROUTE_PREFLIGHT_BLOCKED_R2_ROLE_UNAVAILABLE`.
No OpenSpec or product role was created. Stage 1 consumed the Controller's
accepted `WIP_DISPOSITION_COMPLETE`; it must not repeat privileged WIP work.

All four custom role files fixed effort to `medium`, while the package required
R2 `high`. Codex gives role-local settings precedence over spawn settings, so
the former policy's dispatch override could not take effect. The Controller
failed to check executable routing when freezing the package. The correction
removes those four pins instead of adding duplicate roles or a routing system.

The three source artifacts remain under the existing Mac mini evidence root:

`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `STAGE2_ROUTING_EXCEPTION-20260919T001847Z.md` | 3903 | `7668c79a389b0c80b9190f2f172e7db9a7701d0ab27457a9e131ddea37963d73` |
| `package-resume-routing-preflight-20260919T001847Z.transcript` | 5939 | `0b9322cf8db83153450bb0f53464542449378ac27aa4087adc489cd239fcbddc` |
| `stage2-routing-exception-integrity-20260919T001847Z.transcript` | 1186 | `4f512157bc0bed7742d3aa25f97f7e594609984e1f08a7fa5f1ead1326cd4bc6` |

MacBook read these sources over SSH and verified their sizes and hashes when
processing the exception. These are historical observations, not live remote
state or evidence of a successful revised dispatch.

## Approved correction

The current authority is `docs/governance/agent-model-routing.md`:

| Role | Preserved model | Ordinary | R2 / this batch | Preserved sandbox |
|---|---|---|---|---|
| `juaner_spec` | `gpt-5.6-sol` | `high` | `xhigh` | `workspace-write` |
| `juaner_test` | `gpt-5.6-terra` | `high` | `xhigh` | `workspace-write` |
| `juaner_worker` | `gpt-5.6-terra` | `high` | `xhigh` | `workspace-write` |
| `juaner_validator` | `gpt-5.6-sol` | `high` | `xhigh` | `read-only` |

Remove only the effort assignment from each `.codex/agents/juaner_*.toml` role
file. The existing project `[agents]` default already selects `high`; the
project config, configured models, concurrency, permissions, network setting,
disabled skills and all role instructions remain unchanged. The Controller
session itself is not switched by this amendment.

At each applicable Gate, use the actual named role with explicit
`reasoning_effort: "xhigh"` and a bounded fresh context; omit a model override
because the role pins its model. Do not use `fork_turns: "all"` for an explicit
reasoning selection. Ordinary future work explicitly selects `high`.
`ponytail-review` remains required before this batch's Spec Gate; updating the
ordinary default does not weaken that existing review trigger.

## Bounded adoption and return point

The user manually forwards this amendment to the original Mac mini task
`纵切-1.0` (`01a0b45a-13ad-7b92-a2b4-cdde980558e1`). No automatic message retry,
new execution task, branch ownership transfer back to MacBook, or duplicate
batch is needed.

1. Verify the familiar Mac mini repository, `mac-mini` device, origin, clean
   worktree, branch ownership and current HEAD. Preserve any unexpected work.
   The confirmed pre-correction HEAD is the original package commit above.
2. Fetch the amendment source branch. Require the fixed commit/tree/amendment
   hash from the transfer message, the unchanged original package hash, and
   the expected ancestry. Inspect the delta before integrating. If the source
   ref has advanced or the receiver has unexpected commits or changes, stop
   with exact identities; do not reset, stash, force-push or silently select a
   different revision.
3. This amendment specifically authorizes a one-time `git merge --ff-only`
   of that fixed correction commit into the Mac mini-owned package branch.
   It imports the published Controller governance/config/status records; it
   does not authorize Mac mini to edit the project board or role definitions.
   If already at the fixed commit, verify and skip the merge. No main merge,
   push or dependency action is part of this intake.
4. Confirm the receiving session actually exposes all four named roles with
   their preserved model/sandbox and permits explicit `xhigh`. Reading a TOML
   or seeing an updated Git HEAD alone does not prove a live session reload.
   If stale role metadata remains, stop for the user to reload/resume this
   same task after configuration is available. Do not restart services,
   patch the app, create replacement roles, or probe production-role writes.
   One failed effective-route check is the limit of this correction attempt;
   return the evidence rather than expanding tool repair.
5. Retain the accepted Stage 0/1 evidence and original WIP disposition. Do not
   repeat sudo, write pointer/State/pause/Ledger, or restart the Host Loop.
   New contradictory evidence still stops execution; historical PASS is not
   a license to ignore a newly observed conflict.
6. Once the effective route is available, resume Stage 2 with the real
   `juaner_spec` at `gpt-5.6-sol / xhigh`. Subsequent roles stay at R2 `xhigh`
   and activate only after their original Gates. Record actual settings in
   the existing Change evidence. MacBook does not execute production roles.

Success for this correction means the published configuration is adopted and
the required role route is available on Mac mini. Local parsing and static
checks cannot alone close the remote routing blocker. No downgrade to `high`
or `medium` for this R2 batch, generic-role substitution, new product scope,
dependency installation, provider call or host repair is authorized.

## Validation scope

Use bounded offline checks: parse the project and four role TOMLs, compare
each role against its prior content except the removed effort pin, assert
ordinary `high` / R2 `xhigh` selection and unchanged frozen-package hash,
validate current project-board records with their existing tests, and run
`git diff --check`. Confirm the fresh Git index before staging as required by
the Git skill. Do not dispatch any production role for this configuration
check, install a parser, or claim a remote live-route PASS from static checks.

### MacBook verification result

- Project TOML and all four role TOMLs parsed successfully. Each role differs
  from pre-correction `03ae64e90c2992afa9a12302ad79d3847d8f0723` only by removal
  of its effort assignment; model, sandbox and developer instructions match.
- The project config is byte-identical to that baseline and already defaults
  to `high`. The local model catalog lists `high` and `xhigh` for both selected
  models. This is local capability metadata, not a remote dispatch result.
- Routing matrix, unchanged original-package hash, preserved historical role
  records, locked production roles and retained ponytail trigger: PASS.
- Existing project-board suites: **12/12 PASS**. `git diff --check`: PASS.
- An additional `codex --strict-config features list` probe exited 1 because
  this CLI does not support `--strict-config` for `features`. It is not claimed
  as a configuration PASS; the failed probe is retained alongside successful
  TOML parsing and offline checks. No CLI repair or installation was attempted.
- Product regression and live production-role dispatch: **NOT RUN**; no
  product source or test asset changed. Mac mini route: **NOT VERIFIED**.

Owning device: MacBook. Raw check scripts and outputs are persisted at:

`/Users/huangbo/JuanerAI-artifacts/PKG-XANTHIL-DESKTOP-001/routing-amendment-001-20260919`

| File | Bytes | SHA-256 |
|---|---:|---|
| `verify-routing-offline.py` | 3511 | `87b373f3a03d09a7a6586f0bfcfbcc49991062c6a35f87842fffc8ca0cc7a75f` |
| `validation-offline.transcript` | 2074 | `4f2f28f0c218e3c65a18abb70c8cc09a2f0bdbde5796e5a1edeaf9dc8e9d9715` |
| `verify-routing.py` | 3565 | `3250194250ed8bbf29c485c228416f00b9f66694a3c5dc3abcbc524ccfae4f77` |
| `validation.transcript` | 1052 | `ce27388787b5a607bf4300af9be5f9f982009f6c5940bf0a27431dd52bf46b87` |

Persistent copies were independently read back with `shasum` and OpenSSL;
hashes agree. They are MacBook-local evidence, not copied to Mac mini by Git.
The Git amendment carries the validation conclusion and exact locators;
the receiver must independently check its own effective route.
