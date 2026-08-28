# PR #21 Merge and Dual-Device Readback 001

> Evidence ID: `EVD-D1A-005`
>
> Observed: 2026-08-28
>
> Scope: D0.5/D1-A prerequisite integration only; no Product Change was dispatched

## Integration result

- Pull request: `#21`, `D0.5 Xanthil Desktop productization and D1-A intake`
- Final reviewed branch head: `7fff1b8904eb11dfc73b1e35c198bcc4b46d6f04`
- GitHub Actions run: `33170352692`, `Canonical Validation`, `success`
- Merge method: authorized squash merge
- Integration authority SHA: `103bd88216d7f397967bdabb7fbfb250eea3f996`
- Reviewer: fresh material-isolated seven-part Development-Readiness Review returned `PASS`
- Scope: 35 changed paths, limited to approved planning, handoff, review, and `.juanerai/project-control/**` records; no source, dependency, test, OpenSpec Change, Runtime, data, or Model Pack path changed.

## MacBook readback

- `HEAD == main == origin/main == 103bd88216d7f397967bdabb7fbfb250eea3f996`
- live `origin/main` readback matched the same SHA
- ahead/behind: `0/0`
- worktree: clean

## Mac mini readback

- authorized `git pull --ff-only` completed from the prior D0.5 baseline to `103bd88216d7f397967bdabb7fbfb250eea3f996`
- `HEAD == main == origin/main == 103bd88216d7f397967bdabb7fbfb250eea3f996`
- live `origin/main` readback matched the same SHA
- ahead/behind: `0/0`
- main worktree: clean
- Coordinator pointer: `EMPTY`
- `active_change_id: null`
- macro state, phase, pending agent, Candidate, and delivery: all absent

The first non-login Coordinator status probe failed with `env: node: No such file or directory`; the login-shell probe using the installed Coordinator path succeeded. The failed probe did not mutate state.

## Disposition

`BLK-D1A-001` is closed. The post-PR #21 Mac mini baseline and WIP observation is PASS, but the eventual signed DISPATCH must still repeat freshness against the final integrated authority-package baseline. No OpenSpec, Test, Worker, Validator, Product Change worktree, dependency install, or Model Pack was started by this readback.
