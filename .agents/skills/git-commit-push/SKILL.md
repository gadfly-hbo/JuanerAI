---
name: git-commit-push
description: Safely stage, commit, and push the current repository changes, generating a commit message when the user does not provide one.
---

# Git Commit and Push

Use this when the user asks to commit and push current work.

1. Confirm the repository root, current branch, `HEAD`, remote, upstream, and
   absence of an in-progress merge, rebase, cherry-pick, or revert.
2. Inspect status, staged and unstaged diffs, untracked paths, and likely
   sensitive or generated files. Define the exact intended commit scope and
   stop when it is ambiguous.
3. Never develop or commit on JuanerAI `main`; follow
   `docs/governance/git-development-workflow.md` and move cleanly to the
   approved work branch before staging.
4. Run final validation relevant to the exact intended scope before final
   staging.
5. Before final staging or commit, fingerprint the worktree with porcelain
   status, tracked diffs, and hashes of intended untracked files. Rebuild the
   available codebase-memory index from the current repository worktree with
   `mode=full` and `persistence=false`. An `indexed` status alone is not
   freshness evidence.
6. Query the rebuilt graph to prove that current entry paths and critical
   symbols resolve to the intended files. For every removed, renamed, or legacy
   path in scope, prove zero graph hits; explicitly record when none apply.
   Recompute the fingerprint and require it to be identical after indexing. If
   indexing is unavailable, fails, returns stale results, or changes the
   worktree, report the condition and stop before staging until the user
   explicitly authorizes proceeding without fresh-index evidence.
7. Stage explicit paths. Do not use `git add .` blindly, and do not include
   credentials, caches, dependency folders, `.DS_Store`, or unrelated changes.
8. Review the complete staged diff and confirm it matches the validated and
   freshly indexed scope.
9. Use the user's exact commit message when supplied; otherwise generate one
   concise Conventional Commit message that fits the coherent staged scope.
10. Commit without amending or rewriting history. Push the current work branch,
   setting its upstream when needed.
11. Report the commit SHA, branch and remote, validation evidence, fresh-index
    evidence or explicit exception, and remaining worktree state. A push does
    not merge the pull request or authorize the next product Gate.

Never amend, rebase, reset, force-push, delete branches, or rewrite history
unless the user explicitly requests that exact operation after its target and
consequence are clear.
