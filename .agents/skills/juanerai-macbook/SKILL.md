---
name: juanerai-macbook
description: 在 MacBook 同步 main、审核或合并 JuanerAI Pull Request。
---

# JuanerAI MacBook

Read `docs/governance/git-development-workflow.md`, then verify the repository
root, worktree, branch, upstream, remote, and `juanerai.device`. Continue only
when the configured device is `macbook`.

Choose the mode from the user's invocation:

## 同步

- Preserve any local changes. With a clean worktree, switch to `main`, fetch
  with pruning, and fast-forward it to `origin/main`.
- Verify local `main` equals `origin/main` and report the commit.

## 审核

- Require a pull request number or URL and verify `gh auth status`.
- Inspect the live PR metadata, diff, commits, checks, scope, and recorded
  validation evidence. Apply the repository's OpenSpec, TDD, role, traceability,
  and independent-verification Gates; dispatch required project roles rather
  than replacing them with this Skill.
- Return `PASS`, `CHANGES_REQUESTED`, or `BLOCKED` with evidence. Review is
  read-only and never repairs the branch or merges the PR.

## 合并

- Treat an invocation that explicitly says `合并` or `审核并合并` and names the
  PR as authorization for that exact squash merge.
- Re-read the live PR. Require an open, mergeable PR, a current `PASS`, complete
  required Gates, and no unresolved blocking check or scope drift.
- Squash merge through `gh`, then fetch with pruning and fast-forward local
  `main`. Verify the PR is merged, remote work branch is gone, and local
  `main` equals `origin/main`.
- Stop without merging when any precondition fails. Return fixes to the owning
  work branch; local `main` remains a read-only mirror.

With no mode, inspect read-only state and recommend exactly one of `同步`,
`审核`, or `合并`. Mutate nothing until the user selects or clearly states a
mode.
