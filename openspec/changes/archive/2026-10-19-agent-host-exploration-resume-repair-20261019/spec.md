# Workspace exploration readback repair — local candidate only

Authority: user's 2026-10-19 continuation of agent-host-simplification. Keep the
existing worktree/branch, original candidate003 and PR106 as immutable history.
No Git writes or delivery, Provider/business data, SDK/dependency/model/policy
changes, installation/release, production switch or old-task recovery.

Restore only the existing Workspace → Application input for persisted
explorations. Application's existing task/revision/scope/config identity filter,
value hash check, source checks and authorization remain authoritative. Do not
add a Session, cache, recovery framework, storage format or second read path.

Allowed: packages/application/open-analysis-workspace.ts; focused additions to
the existing native-session integration test; this thin spec/result record;
sole-writer project-control updates after preserving its previous WIP.
Conditional: necessary existing focused test assets if an actual gap requires
them. Forbidden: SDK/vendor/dependencies, runtime policy/configuration, old
archives/receipts and either stopped historical task.

Acceptance:

- WR-01: A new synthetic Task uses real Workspace, local Store, offline native
  transport and supervised Python to persist an exploration and return its
  original full_exploration.path. Tests must not inject qualifiedExplorations.
- WR-02: Stop; collect physical requests/effects; close and rebuild Workspace.
  Passive reopen does not run work. Explicitly resume the same Task and use
  native read of that original path, paginating until all original chart data
  is recovered and matches the durable record.
- WR-03: Reading executes no additional Python or independent verification,
  keeps MODEL_EXPLORATION/not_performed, and does not create a formal Outcome.
- WR-04: Stale revision/config identity, other Task, changed scope and incorrect
  value hash remain rejected by the existing contracts.
- WR-05: UNKNOWN, unsettled model/tool effects and revoked authority remain
  fenced; this repair cannot reconcile/replay them or renew authorization.
- WR-06: Preserve causal RED against the unmodified production implementation,
  then GREEN through the same Workspace entry and assertions; run applicable
  native read, stop/reopen/resume, identity and recovery regression.
- WR-07: Freeze the complete local candidate and evidence, obtain independent
  read-only review under current native-role rules, disclose actual permissions.
- WR-08: Return identities/diff/commands/logs/exits/PASS/FAIL/SKIP/limitations and
  stop with no Git delivery. Real-model quality and Product Acceptance stay open.

Persistent raw evidence: existing Mini engineering evidence root, new child
workspace-exploration-resume-repair-001. Original issued receipts are untouched.

## Authorized Git continuation — 2026-10-19

The local-only stop in WR-08 was fulfilled before the next user instruction.
The user now explicitly authorizes standard Git delivery of frozen repair001:
commit, push, PR, required checks, squash integration, safe main synchronization
and applicable archive. This extends delivery authority only; WR-01 through07
and every Provider/data/SDK/model/policy/production/old-task boundary stay fixed.
The original local candidate/spec/receipts remain immutable in the persistent
repair root. Current publication facts and stop point are owned by
[engineering-delivery.md](engineering-delivery.md), not the historical freeze.
