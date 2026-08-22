# Tasks

## Gate sequence

1. [x] Controller records this R2 boundary correction and the unavailable Sol-high Spec-route constraint; performs complete-package `ponytail-review` before Spec Gate. [REQ-RRIF-001]
2. [x] Test role changes no tracked asset. It freezes the existing `TEST-XCLI-008` integration leaf as the permanent regression asset, runs the focused RED against the uncorrected Adapter on clean GitHub-hosted Linux, and returns exact command/output/hash/environment evidence. [AC-RRIF-001-02]
3. [x] After TDD_READY, Worker changes only `adapters/storage-local/local-analysis.ts`: use a private descriptor to pin/verify the construction directory and compare it at preflight; its acquisition, verification, lifetime, and fail-closed handling stay implementation detail. No test/spec/Port/Profile write. [AC-RRIF-001-01..03]
4. [x] Worker runs the frozen focused integration leaf and affected existing contract suite once each as authorized by the Test brief; reports output and scope evidence. [AC-RRIF-001-01..03]
5. [ ] Controller obtains one evidence-only clean remote Linux GREEN as described in `verification.md`, performs required offline canonical regression, scope/traceability review, then freezes implementation/evidence. [AC-RRIF-001-01..03]
6. [ ] Validator independently checks descriptor safety, no contract/data-surface drift, exact existing-leaf mapping, remote evidence boundary, and validation evidence. [REQ-RRIF-001]

## Stop lines

- Any need to alter a test, workflow, Port, Profile, data format, public lifecycle, or more than the single Adapter path: return to Controller as `SCOPE_ESCALATION`.
- Descriptor acquisition unavailable in the approved personal deployment, or evidence of unbounded Store lifetime: `BLOCKED` pending Controller/user lifecycle/compatibility decision.
- A second remote proof attempt, any retry/fallback policy, or a remote result that does not prove the target leaf: stop for Controller evidence review; it is not a product retry.
