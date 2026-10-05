# GitHub Multi-device Development

## Purpose

GitHub is the synchronization and integration point for JuanerAI development on
the MacBook and Mac mini. The repository carries project instructions, Codex
agents, Skills, specifications, and evidence so both machines start from the
same method and product state.

## Authority and Branches

- `origin/main` is the sole integration authority.
- Local `main` mirrors `origin/main`; it is not a development branch.
- Every change uses one short-lived branch named `work/<device>/<slug>`.
- `<device>` is `macbook` or `mac-mini`; `<slug>` is lowercase words, digits,
  and hyphens describing one task.
- One device owns a branch at a time. Push and stop on the first device before
  continuing that branch on the other device.
- A branch contains one coherent Change or governance task. Unrelated work uses
  another branch.

GitHub protects `main`: changes arrive through pull requests, history stays
linear, and force-push and deletion remain blocked. Pull requests use squash
merge and merged branches are deleted.

For current product Changes, the Mac mini engineering main Agent (Engineering Controller) organizes
branch review, push, PR, squash merge, OpenSpec archive, and delivery readback
inside the user's granted Git permissions. MacBook Product Manager technical
sign-off is not required. Engineering Acceptance, user Product Acceptance, and
Git permission are separate: a Validator PASS or PR status supplies neither a
required user verdict nor an ungranted merge/release permission.

## First Setup on Each Machine

Clone the repository, enter its root, and record the device-local Git policy:

```sh
git clone https://github.com/gadfly-hbo/JuanerAI.git
cd JuanerAI
tools/harness/git/bootstrap mac-mini
```

Use `macbook` instead on the MacBook. The bootstrap writes only repository-local
Git configuration: device identity, fast-forward-only pull, fetch pruning, and
automatic upstream setup. Credentials, global Git configuration, installed
tools, dependencies, and secrets remain machine-local.

Start Codex from the repository root after cloning or pulling. Codex then loads
the tracked `AGENTS.md`, `.codex/config.toml`, `.codex/agents/`,
`.agents/skills/`, `.ai-coding/`, OpenSpec, and governance documents.

Install project dependencies separately on a new machine with `npm ci`. The
canonical validation runner may need `JUANERAI_TOOLCHAIN_BIN` when the approved
toolchain is installed at a different path; machine paths never enter Git.

## Start Work

Begin only with a clean worktree:

```sh
tools/harness/git/start-work <slug>
```

The command fetches and prunes `origin`, fast-forwards local `main`, and creates
`work/<configured-device>/<slug>`. It fails instead of reusing an existing
branch or carrying local changes across branches.

If Codex finds tracked changes while on `main`, it stops and asks how to preserve
them; it does not silently move, stash, reset, or discard them.

## Develop and Publish

The following ordinary delivery path remains applicable to MacBook product and
governance work. Mini product engineering that has adopted v0.9 uses the daily
and formal-closeout cadence below, within the same branch/permission protections.

1. Follow the repository Change and TDD Gates.
2. Commit coherent, reviewed changes with explicit staging.
3. Push the work branch to `origin`; never push directly to `main`.
4. Open a pull request targeting `main` and complete the repository PR template.
5. Run the Change-specific focused checks and applicable regression. Use
   `tools/harness/validation/run` when the Change requires the canonical offline
   matrix.
6. Review the PR diff and evidence, then squash merge. Do not require a second
   human approval when both devices belong to the same developer.

### Adopted v0.9 Mini Product Engineering

During daily iteration, run affected checks and the relevant main path, explicitly
stage coherent changes, commit and push the owned work branch when needed within
existing Git authority. Internal corrections and subtasks do not each require a
PR, full CI, independent review or packaging. The user tries and completes any
required Product Acceptance directly on Mini under the sole execution policy's
**Mac mini Trial and User Acceptance** section. A local trial identifies the
commit and relevant uncommitted differences; push, PR and mainline merge are not
trial prerequisites. Trial feedback is not formal Change acceptance.

At the formal Change's complete-result closeout, concentrate one PR targeting
`main`, its complete diff/evidence review, applicable independent verification,
required user acceptance, required CI, authorized squash merge and archive in
the task's permitted order. Do not accumulate the whole Blueprint into one PR.
Failed checks or changed candidates still receive affected revalidation;
invalidated PASS cannot authorize merge. An existing PR's branch updates may
trigger CI again: preserve those checks and keep the PR open rather than hiding
updates to avoid CI. This cadence changes no CI triggers or branch protection;
verify actual workflows and required checks before merge.

This Mini cadence does not change MacBook product/governance delivery or grant
Git, installation, host, provider/data or release permissions.

No force-push is part of the normal workflow. If `main` advances, fetch and
merge `origin/main` into the work branch. The eventual squash merge keeps
`main` linear without rewriting the published work branch.

## Cross-device Handoff

Before changing devices, the current device must have a clean worktree and push
all branch commits. Record the branch name, latest commit, validation result,
and next action in the Product Manager/Engineering Controller handoff or
conversation, as applicable.

On the receiving device:

```sh
git fetch origin --prune
git switch --track origin/work/<source-device>/<slug>
```

Only the receiving device writes after the handoff. If both machines changed
the same branch, stop and inspect both commit tips before merging; never repair
the conflict by resetting or force-pushing one side away.

A responsibility handover is not branch handover or execution resumption. The
receiver first returns an exact readback of task, repository, branch, commit,
tree, status, evidence, and next permitted action. Until that receipt, adoption
is unconfirmed and the prior writer/stop line remains authoritative.

## After Merge

The device performing an authorized PR merge owns the synchronization closeout
for both devices. MacBook-to-Mini and Mini-to-MacBook use the same command;
the user does not need to relay another message to the receiving session.
Synchronize the merged `origin/main` baseline, not every pushed work branch.
First confirm that the pull request is merged and its intended tree is present
on `origin/main`.

```sh
tools/harness/git/sync-main
```

Configure reciprocal targets once in each repository's **local** Git config,
using an existing, verified non-interactive SSH alias and repository path:

```sh
git config --local --add sync.targets '<peer-ssh-alias>:/absolute/repository/path'
```

These machine-specific values never enter Git. Verify both SSH directions;
one working direction does not establish the other. Missing targets are
reported, not treated as a successful dual-device synchronization. The command
does not configure SSH, install anything, start services or schedule jobs.

`sync-main` pins one observed `origin/main` commit, checks repository/remote
identity and each target's state, and reports its main before/after identity:

- A `main` already at the pinned commit is reported unchanged without updating
  refs or files; no idle-worktree permission is needed for this no-op.
- If `main` is not checked out in any worktree, fast-forward only that ref.
  An active non-main branch may remain dirty; its branch, index and files are
  not changed. Git's non-force update and checked-out-branch protections apply.
- If `main` is checked out at the configured root, updating files requires a
  clean worktree, no in-progress Git operation, and explicit caller confirmation
  that the worktree is idle. Use `--allow-main-worktree local` or repeat that
  option with the exact configured `host:/absolute/path` target only after
  confirming no task or running process depends on that worktree's files.
  Clean status alone does not prove it is idle. A `main` checked out elsewhere
  is skipped; the command never switches or rewrites that worktree.
- Divergence, unavailable SSH, identity mismatch or unsafe state is reported
  per target and produces a nonzero overall result. Preserve successful sides;
  do not roll back the merge, reset, stash, clean, force-update or retry forever.
- `--check` performs read-only preflight, including remote discovery, without
  changing refs or working files. It does not reserve the state for a later run;
  the actual run repeats the relevant checks. If the pinned commit is absent
  locally, ancestry remains unverified until the actual fetch.

Report complete synchronization only when every configured target's local
`main` is verified at the pinned commit. This is a point-in-time result, not
continuous replication. A merge may succeed while synchronization remains
partial; report both facts without creating a new product Gate. In-flight
sessions may retain their approved branch, rules and task baseline. They need
not adopt every rule update. Before the next new task, the existing
`start-work` command still fetches, fast-forwards clean `main` and creates the
work branch; post-merge synchronization does not replace this check.

After a verified squash merge, the local work branch is
non-authoritative, but delete it only with explicit user approval; squash merge
rewrites commit ancestry, so reachability alone cannot prove inclusion.

## What Travels Through Git

Project method and authority travel through Git: source, tests, `AGENTS.md`,
`.codex/`, `.agents/skills/`, `.ai-coding/`, `docs/`, OpenSpec, templates, and
approved project-control records.

Machine state does not travel through Git: credentials, GitHub login, global
Codex instructions, global Skills, tool installations, `node_modules`, caches,
runtime data, absolute paths, secrets, or unapproved user data.
