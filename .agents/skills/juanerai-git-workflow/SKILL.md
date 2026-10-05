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
- Stage and commit only reviewed task paths and push the work branch within
  existing authority. For adopted v0.9 Mini product engineering, daily
  checkpoints/pushes do not each open a PR; concentrate one PR to `main` at
  formal Change closeout with applicable independent verification, required
  user acceptance and required CI. MacBook product/governance delivery keeps
  its existing path. Use the sole execution policy's MacBook Trial Delivery
  section for updates of the designated trial copy and actual runtime readback.
- Preserve the repository's OpenSpec, TDD, validation, and independent-review
  Gates; the Git workflow does not approve product scope or acceptance.
- Recheck affected failures and changed candidates; keep CI on updates to an
  existing PR. Daily focused checks and trial feedback do not replace formal
  acceptance, required CI or branch protection.
- Squash merge after the PR diff and evidence are accepted. The merging device
  then runs `tools/harness/git/sync-main` to synchronize its own and configured
  SSH peers' `main`, regardless of which device performed the merge. Follow the
  workflow document's target setup and checked-out-main consent rules; never
  switch an active work branch just to synchronize.
- Report each target's verified main commit or precise skip/failure. A merged
  PR with a skipped peer is merged but not fully synchronized; do not retry
  indefinitely or require in-flight sessions to adopt updated rules.
- Stop on ambiguous local changes, divergent same-branch work, or a conflict
  that could discard either device's commits. Do not reset, force-push, or hide
  the conflict with a new branch unless the user explicitly chooses recovery.
