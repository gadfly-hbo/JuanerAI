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
4. Before final validation, fingerprint the repository/branch/HEAD identity,
   porcelain status, tracked diffs, and hashes of every intended changed file.
   Run the applicable final checks from the actual diff, not the task label:
   - A delivery containing only governance documents, instructions, templates
     or development-agent configuration uses complete diff/path review,
     applicable syntax/reference/configuration checks and independent
     consistency review.
   - Product source, executable tests/tools/hooks/CI, dependencies, runtime
     configuration, schemas or mixed deliveries use affected tests, type/build,
     contract/regression and independent review as required by the Change.
     Apply the sole execution policy's Continuous SDD and TDD section for
     current CI inputs and normal-user-path evidence. Executable or product
     changes are not documentation.
5. Review the full diff and every intended changed path, including untracked,
   removed and renamed files. Inspect affected entrypoints/callers and retired
   references through source search and applicable checks. A codebase graph is
   an optional navigation aid, not a commit prerequisite: missing file nodes,
   stale indexes or indexing failure need no exception approval. Check any
   graph result used against the actual repository, branch, HEAD and current
   source; discard unreliable results and use source inspection instead.
   Missing required verification or an unresolved source/identity mismatch
   still stops delivery; absence from a graph is not proof of absence in code.
6. Recompute the fingerprint after validation. If it changed, inspect and
   attribute the changes, then revalidate the affected scope before staging.
   This applies to mutations by any tool, including an indexer.
7. Stage explicit paths. Do not use `git add .` blindly, and do not include
   credentials, caches, dependency folders, `.DS_Store`, or unrelated changes.
8. Review the complete staged diff and confirm it matches the validated scope
   and fingerprint from the applicable path.
9. Use the user's exact commit message when supplied; otherwise generate one
   concise Conventional Commit message that fits the coherent staged scope.
10. Commit without amending or rewriting history. Push the current work branch,
   setting its upstream when needed.
11. Report the commit SHA, branch and remote, validation evidence, the selected
    validation scope and remaining worktree state. A push does not merge the
    pull request or authorize the next product Gate.

Never amend, rebase, reset, force-push, delete branches, or rewrite history
unless the user explicitly requests that exact operation after its target and
consequence are clear.
