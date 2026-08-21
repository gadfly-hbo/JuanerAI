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

1. Follow the repository Change and TDD Gates.
2. Commit coherent, reviewed changes with explicit staging.
3. Push the work branch to `origin`; never push directly to `main`.
4. Open a pull request targeting `main` and complete the repository PR template.
5. Run the Change-specific focused checks and applicable regression. Use
   `tools/harness/validation/run` when the Change requires the canonical offline
   matrix.
6. Review the PR diff and evidence, then squash merge. Do not require a second
   human approval when both devices belong to the same developer.

No force-push is part of the normal workflow. If `main` advances, fetch and
merge `origin/main` into the work branch. The eventual squash merge keeps
`main` linear without rewriting the published work branch.

## Cross-device Handoff

Before changing devices, the current device must have a clean worktree and push
all branch commits. Record the branch name, latest commit, validation result,
and next action in the normal Controller handoff or conversation.

On the receiving device:

```sh
git fetch origin --prune
git switch --track origin/work/<source-device>/<slug>
```

Only the receiving device writes after the handoff. If both machines changed
the same branch, stop and inspect both commit tips before merging; never repair
the conflict by resetting or force-pushing one side away.

## After Merge

On each machine that has the repository:

```sh
git switch main
git pull --ff-only
git fetch origin --prune
```

Delete a local work branch only after its pull request is merged and its commits
are reachable from `origin/main`.

## What Travels Through Git

Project method and authority travel through Git: source, tests, `AGENTS.md`,
`.codex/`, `.agents/skills/`, `.ai-coding/`, `docs/`, OpenSpec, templates, and
approved project-control records.

Machine state does not travel through Git: credentials, GitHub login, global
Codex instructions, global Skills, tool installations, `node_modules`, caches,
runtime data, absolute paths, secrets, or unapproved user data.
