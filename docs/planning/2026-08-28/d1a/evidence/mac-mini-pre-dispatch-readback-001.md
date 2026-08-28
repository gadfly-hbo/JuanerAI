# Mac mini Pre-DISPATCH Readback 001

> Evidence ID: `EVD-D1A-MINI-001`
> Date: 2026-08-28
> Mode: user-authorized read-only SSH verification
> Product Change effects: none

## Git baseline

- Device identity: configured JuanerAI Mac mini.
- Branch: `main`, upstream `origin/main`, ahead/behind `+0/-0`.
- Worktree: clean; porcelain v2 returned only branch headers and no changed path.
- `HEAD`: `2a59fc7cc964ee7d966e91339eb475cb81d02b77`.
- local `main`: `2a59fc7cc964ee7d966e91339eb475cb81d02b77`.
- local `origin/main`: `2a59fc7cc964ee7d966e91339eb475cb81d02b77`.
- live `ls-remote origin refs/heads/main`: `2a59fc7cc964ee7d966e91339eb475cb81d02b77`.

## Global WIP authority

The installed Coordinator returned:

```json
{
  "active_change_id": null,
  "pointer_status": "EMPTY",
  "macro_state": null,
  "phase": null,
  "pending_action": null,
  "candidate": null,
  "delivery": null
}
```

Expected canonical empty-pointer SHA-256: `811f872ce38df88357395b2a438eb1c96504f1b583dd77724867f6dc0eaf32a9`.

## Disposition

`CURRENT_WIP_EMPTY_VERIFIED` at the observed baseline. This readback does not create or reserve WIP and does not authorize DISPATCH.

The D0.5/D1-A branch was not yet merged when this evidence was collected. After an approved squash merge, MacBook and Mac mini must separately read back the exact new `origin/main`/local-main SHA and clean state before a signed Product Change worktree can be created.

No fetch, pull, checkout, branch creation, file write, Coordinator command, DISPATCH, model/data access, or credential read occurred.
