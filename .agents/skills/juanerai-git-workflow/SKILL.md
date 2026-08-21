---
name: juanerai-git-workflow
description: Start, synchronize, hand off, review, or merge JuanerAI work across the MacBook and Mac mini through GitHub branches and pull requests.
---

# JuanerAI Git Workflow

Read `docs/governance/git-development-workflow.md` before acting.

- Inspect the current branch, worktree, upstream, and device configuration.
- Treat `main` as a read-only integration mirror. For tracked-file changes,
  start `work/<device>/<slug>` with `tools/harness/git/start-work <slug>`.
- Keep one task and one active writing device per branch.
- Stage and commit only reviewed task paths, push the work branch, and open a
  pull request to `main`.
- Preserve the repository's OpenSpec, TDD, validation, and independent-review
  Gates; the Git workflow does not approve product scope or acceptance.
- Squash merge after the PR diff and evidence are accepted, then fast-forward
  local `main` and prune deleted remote branches.
- Stop on ambiguous local changes, divergent same-branch work, or a conflict
  that could discard either device's commits. Do not reset, force-push, or hide
  the conflict with a new branch unless the user explicitly chooses recovery.
