---
name: juanerai-mini
description: 在 Mac mini 开始、继续或交付一次 JuanerAI 工作。
---

# JuanerAI Mac mini

Read `docs/governance/git-development-workflow.md`, then verify the repository
root, worktree, branch, upstream, remote, and `juanerai.device`. Continue only
when the configured device is `mac-mini`.

Choose the mode from the user's invocation:

## 开始

- Require a concrete task. Derive one short lowercase hyphenated slug when the
  task is clear; ask only when the task itself is ambiguous.
- Run `tools/harness/git/start-work <slug>` and verify the resulting branch is
  `work/mac-mini/<slug>` with a clean worktree.
- Report the branch and invite the user to state the product task. The new
  branch does not waive OpenSpec, TDD, role, or approval Gates.

## 继续

- Require or identify one existing `work/mac-mini/*` branch. Do not take over a
  branch currently owned by the MacBook without an explicit handoff.
- Fetch with pruning. Switch to the branch and use `git pull --ff-only` only
  when it already has an upstream. Preserve local-only commits and changes.
- Report current status, latest commit, upstream, and the next recorded task;
  stop on divergence or ambiguous changes.

## 交付

- Require a `work/mac-mini/*` branch and completed applicable project Gates.
  Stop and name missing evidence instead of treating a push as acceptance.
- Read `.agents/skills/git-commit-push/SKILL.md` and follow it to validate,
  stage explicit paths, commit, and push the work branch.
- Verify `gh auth status`. If GitHub CLI is unavailable or unauthenticated,
  stop with the one-time setup command; do not install or expose a token.
- Create or update one pull request targeting `main`, using the repository PR
  template and current validation evidence. Report its URL and leave it open
  for MacBook review; delivery never merges it.

With no mode, inspect read-only state and recommend exactly one of `开始`,
`继续`, or `交付`. Mutate nothing until the user selects or clearly states a
mode.
