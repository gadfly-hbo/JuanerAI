---
name: git-commit-push
description: Safely stage, commit, and push the current repository changes, generating a commit message when the user does not provide one.
---

# Git Commit and Push

Use this when the user asks to commit and push current work.

1. Confirm the repository, current branch, remote, upstream, and absence of an
   in-progress merge, rebase, cherry-pick, or revert.
2. Inspect status, diff, untracked paths, and likely sensitive or generated
   files. Stop when the intended scope is ambiguous.
3. Never develop or commit on JuanerAI `main`; follow
   `docs/governance/git-development-workflow.md` and move cleanly to the
   approved work branch before staging.
4. Stage explicit paths. Do not use `git add .` blindly, and do not include
   credentials, caches, dependency folders, `.DS_Store`, or unrelated changes.
5. Run validation relevant to the change and review the complete staged diff.
6. Use the user's exact commit message when supplied; otherwise generate one
   concise Conventional Commit message that fits the coherent staged scope.
7. Commit without amending or rewriting history. Push the current work branch,
   setting its upstream when needed.
8. Report the commit SHA, branch and remote, validation evidence, and remaining
   worktree state. A push does not merge the pull request or authorize the next
   product Gate.

Never amend, rebase, reset, force-push, delete branches, or rewrite history
unless the user explicitly requests that exact operation after its target and
consequence are clear.
