# Post-merge main synchronization

## Why and goal

After an authorized PR merge, one explicit command should advance both devices'
repository-local main mirrors without interrupting their active work. The user
approved this bounded developer-tooling change in the current conversation.
This does not change Xanthil product behavior or claim a product UI Gate.

## Scope

Add `tools/harness/git/sync-main`, permanent real-Git tests, and operator guidance.
Use existing repository-local `sync.targets` peer entries and existing SSH trust.
Both devices must be accounted for; a local-only result is not full success.

Allowed paths: `tools/harness/git/sync-main`,
`tools/harness/git/sync-main.test.mjs`, this Change directory,
`docs/governance/git-development-workflow.md`, and
`.agents/skills/juanerai-git-workflow/SKILL.md`.

Forbidden: product source, Change 004, project-control state, other worktrees,
credentials, SSH trust, global configuration, service controls and dependencies.
No push, commit, merge authorization, work-branch synchronization, branch
deletion or automatic session adoption is introduced.

## Risk, activation and rollback

The meaningful risk is updating an active checked-out main. Default refusal,
exact idle-root consent, cleanliness/operation checks and Git's checked-out-ref
protection bound it. Cross-device completion is not atomic: retain successful
sides and report failure if a peer cannot finish; retry after resolving it.
Activate by explicitly invoking the saved executable after authorized merge.
Stop using the command to deactivate. Do not roll a main mirror backward.

Dependencies: existing Git, POSIX shell and SSH; Node only for focused tests.
Evidence: deterministic real local Git integration, transport-only SSH fixture,
then separately reported independent and live-device checks.
