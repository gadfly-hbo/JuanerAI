---
name: juanerai-mini
description: 在 Mac mini 开始、继续或交付一次 JuanerAI 工作。
---

# JuanerAI Mac mini

Activated dual-device product Changes use the sole authority in
`docs/governance/product-change-execution-policy.md`.

Read `docs/governance/git-development-workflow.md`, then verify the repository
root, worktree, branch, upstream, remote, and `juanerai.device`. Continue only
when the configured device is `mac-mini`.

Choose the mode from the user's invocation:

## 开始

- Require a concrete task. Derive one short lowercase hyphenated slug when the
  task is clear; ask only when the task itself is ambiguous.
- Run `tools/harness/git/start-work <slug>` and verify the resulting branch is
  `work/mac-mini/<slug>` with a clean worktree.
- Report the branch and next permitted action for the stated task. A new branch
  does not supply approved product/UI input, confirmed intake, causal RED/GREEN,
  independent validation, required acceptance or missing safety/resource/Git
  authority; follow the current execution policy, not retired role Gates.

## 继续

- Identify the existing work branch owned by Mini, including an explicitly
  handed-over branch with another device prefix. Preserve its identity; do not
  take over MacBook-owned work without explicit handoff.
- Fetch with pruning. Switch to the branch and use `git pull --ff-only` only
  when it already has an upstream. Preserve local-only commits and changes.
- Report current status, latest commit, upstream, and the next recorded task;
  stop on divergence or ambiguous changes.

## 交付

- Require a work branch owned by Mini and completed applicable acceptance and verification.
  Stop and name missing evidence instead of treating a push as acceptance.
- Read `.agents/skills/git-commit-push/SKILL.md` and follow it to validate,
  stage explicit paths, commit, and push the work branch.
- Verify `gh auth status`. If GitHub CLI is unavailable or unauthenticated,
  stop with the one-time setup command; do not install or expose a token.
- Create or update one pull request targeting `main`, using the repository PR
  template and current validation evidence. Report its URL. Delivery alone does
  not grant merge permission; leave it open unless the user has separately
  granted the relevant integration authority. Mini organizes independent review
  and authorized integration under the sole policy; MacBook technical sign-off
  is not a prerequisite.

With no mode, inspect read-only state and recommend exactly one of `开始`,
`继续`, or `交付`. Mutate nothing until the user selects or clearly states a
mode.
