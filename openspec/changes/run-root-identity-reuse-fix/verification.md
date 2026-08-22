# Verification Intent and Evidence Boundary

## Current verdict

**IMPLEMENTATION AND EVIDENCE FROZEN; VALIDATOR PENDING.** Controller Spec Gate and corrected TDD_READY passed. Worker changed only `adapters/storage-local/local-analysis.ts`; Controller reviewed the candidate and reproduced focused `1/1`, Artifact Port contract `198/198`, `git diff --check`, and the canonical offline runner at exit 0. The one authorized GitHub-hosted Ubuntu proof also passed integration `243/243`; implementation and evidence are now frozen for independent validation.

GitHub-hosted Ubuntu PR #4 run `32575185495`, job `97036374334`, supplies causal RED: integration `242/243`, with `Missing expected rejection` at the frozen unsafe-root leaf. The conclusion that `replaced` is the failing loop member is a source-based deduction, not a runner label: missing, symlink, and non-directory hit explicit reject branches, while replacement alone depends on the released device/inode pair.

The observable product contract is closed: a Store must preflight only its original physical directory object, and same-path immediate replacement must reject before effects even under inode reuse. The allowed production scope is one Storage Adapter file; public contracts, persisted data, Artifact lifecycle, workflow behavior, and tests are frozen unchanged.

Route constraint is recorded, not waived: this is an R2 persistence/filesystem-identity correction, while `docs/governance/agent-model-routing.md` requires the Spec role at Sol-high and the configured `juaner_spec` runtime is fixed at Terra-medium. The required Spec role drafted and revised the complete package; Controller at Sol-xhigh then reviewed proposal, delta, design, tasks, test plan, traceability, verification intent, existing Adapter, and existing regression leaf before issuing this Gate. Risk remains R2 and no authority or path scope is broadened.

Ponytail disposition: **Lean already. Ship it.** The first complete-diff review found descriptor flags, `fstat`, acquisition failure, and process-exit lifetime over-specified in the normative delta. Spec revision removed them from the observable contract and retained only the minimum private Adapter design. The revised complete diff adds no abstraction, test seam, marker, retry, recovery protocol, dependency, or public lifecycle machinery.

Gate rationale: the pre-existing check can observe pathname, `realpath`, device, and inode but cannot distinguish immediate same-path replacement after Linux reuses the released inode. A private read-only directory reference is the minimum design that prevents that identity from becoming reusable while the Store lives; existing path checks and error vocabulary remain authoritative. Construction and preflight fail closed, and the frozen existing test proves unchanged-root success plus missing/replaced/symlink/non-directory rejection and zero-write behavior.

Test handoff: `test-handoff.md` freezes the test file SHA-256 `f94895a0a55a2886cc26bce4aad4c2a912bc7242ebf8ccf0ad4a280e828c6723`, uncorrected Adapter SHA-256 `3e40eaf9cc0997ca5b708ac056ebd3e3132d4d9e9521af6ae7e103d1d027b170`, exact focused and contract commands, source-deductive `replaced` attribution, and the initial Test Asset Retirement ledger. Controller rejected the first documented focused pattern because its doubled escaping was not executable under Node 26; Test Correction 001 replaced it with a unique unescaped title fragment and both Test and Controller executed the corrected command at exit 0, `1/1`.

Test routing constraint is recorded, not waived: the R2 Test floor is Terra-high while the configured `juaner_test` role is fixed Terra-medium. The required Test role supplied and corrected the handoff; Controller at Sol-xhigh checked the commands, hashes, unchanged test diff, causal attribution, and retirement ledger before issuing TDD_READY.

## Local implementation and GREEN evidence

- Worker candidate SHA-256: `b846c6b6c20535f156ff699c3666d9768984ec23705f4d939032935efa1f654b`.
- Production diff: `adapters/storage-local/local-analysis.ts` only. It acquires one private read-only directory descriptor, verifies directory/device/inode at construction, closes it if construction fails, retains it only in the Store closure, and re-verifies it during existing preflight. It is never exposed or used for Artifact I/O.
- Corrected focused command from `test-handoff.md`: exit 0; tests `1`, pass `1`, fail `0`.
- Existing Artifact Port contract: exit 0; tests `198`, pass `198`, fail `0`.
- `tools/harness/validation/run`: exit 0; typecheck passed; deterministic suites `250/250`, `198/198`, `243/243`, `131/132` with the one explicitly gated real-Pi leaf skipped, and project-board `12/12`.
- Scope checks: `git diff --exit-code -- tests tools/harness .github packages/ports profiles apps/cli` and `git diff --check` both exit 0.

Worker routing constraint is recorded, not waived: the R2 Worker floor is Terra-high while the configured `juaner_worker` role is fixed Terra-medium. The required Worker role returned GREEN under the frozen single-file brief; Controller at Sol-xhigh inspected the complete implementation diff, failure-path descriptor close, private lifetime, unchanged public Store surface, exact commands, and scope evidence.

## Test Asset Retirement Gate after GREEN

PASS. The complete diff adds, changes, or retires no test, fixture, helper, double, mock, snapshot, coverage map, or harness asset. Frozen test SHA-256 remains `f94895a0a55a2886cc26bce4aad4c2a912bc7242ebf8ccf0ad4a280e828c6723`. Existing `TEST-XCLI-008` remains the permanent consumer for unchanged-root success, unsafe-root replacement rejection, and zero-write behavior; there is no orphan, duplicate-purpose, temporary, obsolete, or cleanup asset.

## Remote Linux GREEN

- Evidence-only draft PR: `#5`, closed without merge after its single authorized result.
- GitHub Actions run `32576797214`, job `97040205704`, head SHA `19c843af236c32a419b84a2bcf62df02f40824fa`; conclusion `success`.
- Ubuntu canonical counts: `250/250`, `198/198`, integration `243/243`, `131/132` with the one explicitly gated real-Pi leaf skipped, and `12/12`; every suite reported zero failures.
- The proof-only workflow blob `289ab6238864d49191f4df977f04c9695010c716` exactly matched the already-reviewed workflow on `work/macbook/pr-ci-validation`; no workflow behavior or test changed.
- After evidence capture, Controller closed PR `#5` and deleted both remote and local `work/macbook/proof-run-root-identity-linux`. The proof commit was not merged. The final fix branch contains no `.github` file or diff.

RED-to-GREEN comparison is environment-matched: the uncorrected PR #4 Ubuntu run failed this integration suite at `242/243`; the frozen Adapter candidate on GitHub-hosted Ubuntu passed it at `243/243`. Local and remote canonical regressions agree, and no second proof attempt occurred.

## Required evidence

1. Test role records a healthy focused environment and the unmodified integration file/hash, then establishes expected RED on one clean GitHub-hosted Ubuntu execution: only the same-path `replaced` subcase lacks `RUN_ROOT_UNSAFE`; its zero-write assertion remains the causal observation.
2. Worker records the exact Adapter diff and focused GREEN for the frozen leaf plus the affected existing Artifact Store contract suite, with no test mutation.
3. Controller runs `tools/harness/validation/run` offline and records actual output. A local all-GREEN result alone is not proof of the Linux inode-reuse mutation.
4. Controller obtains exactly one evidence-only remote Linux GREEN after the fixed candidate is frozen, then Validator independently reviews the frozen revision and evidence.

## Remote proof method

The smallest permitted remote method is a temporary draft proof branch/PR containing the frozen Adapter candidate and the already-reviewed CI workflow needed to execute canonical validation on GitHub-hosted Ubuntu. It exists only to observe the existing test in that environment; it must not merge, modify the test, alter workflow behavior, expose secrets, invoke a real model, or be included in the final fix PR. Its inputs are repository source and synthetic test data only; it produces CI logs/test output, not product data. After its single result is captured, Controller closes/deletes the draft proof branch/PR according to repository workflow. A dispatch failure, unavailable runner, unrelated workflow failure, or non-target result is an evidence blocker for Controller review—not authorization for reruns, retries, workflow edits, or weakened assertions.

## Validation checks

- Diff is limited to the approved Adapter path after gates, and final PR has no `.github` change.
- No Port/public/runtime export, Profile composition, data format, error code, Artifact lifecycle, model/network behavior, dependency, or test asset changes.
- Private Adapter design pins/verifies the construction directory without a public close/reopen path; its mechanics do not expand the observable contract.
- Per-start check rejects every unsafe-root mode before Artifact/model/session effects, including immediate same-path replacement.
- No source rows, credentials, user data, external calls, logs, persistent marker, or new recovery behavior are introduced.

## Acceptance and rollback evidence

Activation requires Controller acceptance after Validator PASS. Rollback evidence is a normal source revert with no run-data action. Retirement remains normal process descriptor release; no migration or user-Artifact rewrite is permitted.
