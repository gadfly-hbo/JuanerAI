# Focused verification

Run `node --test tools/harness/git/sync-main.test.mjs` and
`sh -n tools/harness/git/sync-main`; inspect `git diff --check` and allowed paths.
The test command creates temporary real bare origins, clones and linked
worktrees. Its SSH fixture checks required transport flags and executes the
streamed script through a shell. Git itself is real. This fixture proves
orchestration/quoting and Git effects, not network authentication or live devices.

Acceptance cases:

1. Both roots converge on one pinned origin commit; repeat and reverse caller.
2. Dirty non-main branch, HEAD, raw index bytes, tracked and untracked contents
   remain unchanged while main refs advance.
3. Clean checked-out main requires exact explicit idle permission; dirty main,
   operation markers and main in another worktree refuse updates.
4. Divergence, missing main, absent/local-only configuration, malformed values,
   unmatched permission, unavailable/missing/wrong peers and moving origin yield
   aggregate failure, retaining successful sides. Already-current dirty main is
   a byte-preserving no-op success.
5. `--check` leaves all repository file bytes unchanged and labels missing
   ancestry evidence honestly.
6. Spaces/apostrophes and shell text in target paths are quoted; hooks do not run;
   relative invocation and source paths with spaces work. Advancing caller main
   may replace its tracked command with an exit-zero stub; the peer still runs
   the original implementation and reaches the same pinned main commit.

No existing test asset is removed or weakened. Full product, UI, model-provider
and dependency validation is inapplicable to this isolated Git developer tool.
Independent review and live SSH evidence are separate from author tests.
