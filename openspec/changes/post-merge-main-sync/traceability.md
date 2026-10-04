# Traceability

| Requirement / acceptance | Public command regression evidence |
| --- | --- |
| R1 / AC1 | both-main convergence; relative saved command invocation |
| R2 / AC2 | dirty branch/index/file byte preservation; repeat; reverse caller |
| R3 / AC3 | explicit idle consent; dirty/operation/other-worktree refusal |
| R4 / AC4 | divergence; missing/unavailable/wrong targets; malformed config; advancing origin; global-only config; unchanged checked-out main |
| R5 / AC5 | read-only byte snapshots and ancestry-unverified output |
| R6 / AC6 | transport option assertions; shell injection refusal; hooks disabled; source snapshot survives caller-main update |

Implementation: `tools/harness/git/sync-main`.
Permanent tests: `tools/harness/git/sync-main.test.mjs`.
Results and their limits: `verification.md`.
