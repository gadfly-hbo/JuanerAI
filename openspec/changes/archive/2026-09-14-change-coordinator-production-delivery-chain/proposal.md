# Proposal: Change Coordinator Production Delivery Chain

> Archive history (2026-09-14): Controller accepted the applicable local repair under R242/R248 and authorized mechanical archive in R258. Historical Gate/task/evidence text below is preserved, not a current pending verdict. S09/A2 remains USER_WAIVED / NOT_VERIFIED; target-host deployment, EMPTY/D1 and BLK-D1A-008 remain pending. This archive does not authorize Desktop or a product DISPATCH.

## Status

- Change ID: `change-coordinator-production-delivery-chain`
- Change class: R2 boundary Change
- Milestone: M2 / B1 through B5
- Internal checkpoints: K1 `Regression -> Candidate`; K2 `Candidate -> Handoff`
- Current verdict: `SPEC_READY / CONTROLLER_GATE_PENDING_R109`
- Product authority: the user-adopted C2-C7 semantics in `m2-contract-change-request-001.md`
- Development readiness: original `m2-plan-readiness-001.md` PASS plus CCR003 `m2-ccr003-readiness-001.md` PASS, both accepted by the Controller

## Problem

The accepted Foundation and WVEB components do not yet form the production delivery chain. The Coordinator currently loses signed validation definitions at Regression, assumes a clean post-Worker worktree, stages scope rules instead of observed paths, validates a Candidate through the old WORKTREE request, derives Validator Head and repair eligibility without the report, and constructs PR/Handoff/Ledger evidence with placeholders or incomplete identity.

Component behavior is not sufficient. M2 must prove one continuous offline chain through the four public Coordinator methods, with actual Worker-owned file changes, real temporary Git and validation children, exact evidence readback, and fail-closed negative frontiers.

## Proposed Change

Implement one bounded delta to the existing Coordinator and its existing Git, validation, Ledger, PR, Handoff, and host-loop seams:

1. retain signed six-field validation definitions while admitting exactly three fixed IDs and deriving their exact eight-field execution definitions;
2. bind two WORKTREE Regression executions to one post-Worker subject and content identity;
3. admit a legitimate dirty worktree with an empty index, stage only the fresh exact observed paths, bind the staged tree and Candidate readback to the Regression content, and—only for the existing four-key `readCommit` success—represent a physically proven zero-parent root as `parent:null`, while every nonroot read and every Candidate parent remains an accurate nonzero, non-self full 40-hex SHA;
4. add only the closed `CANDIDATE / FINAL_VALIDATION` branch to the existing `validation.execute` method while preserving the accepted WORKTREE branch;
5. consume a closed Validator artifact that proves the actual Head, findings, risks, unverified items, and open questions; preserve the approved repair-only derived-input binding; and let the existing Host Loop, after the Test Agent closes, rerun every mapped RED/control against an independently sealed immutable-Candidate-plus-final-Test snapshot and publish the only admissible repair PASS proof;
6. close the existing seven Ledger event details and the legacy-12/new-24 validation receipt union; retain the raw canonical-diff Buffer and expose the NUL path stdout through the same minimum byte mechanism in one closed byte/hash/path result that Core independently verifies; then build PR and Handoff from remotely read-back facts with a stable non-self-referential delivery identity; and
7. map every failure to the existing stop/local-pause policy and keep recovery to the four existing readback boundaries; and
8. make the existing Host launcher and Handoff producer test-reachable without creating a new runtime or file abstraction: one closed Host factory may receive only a trusted result root and result-root preparation function, while the existing `createHandoffGateway(stateRoot)` becomes the sole exported Handoff construction entry. Production keeps its fixed roots, identity, trust/configuration, process and atomic-write behavior.

R106 added three approved clarifications to that same Change. First, after Freeze a fresh Core may use the existing `applyControllerCommand({command_body_bytes,signature_bytes})` entry to reauthenticate the caller-retained original complete signed DISPATCH against exact current State, current authorization-cycle provenance, and the authoritative remote Ledger; this is read-only reauthentication, not DISPATCH replay. Second, the production Ledger Adapter owns the physical fixed `tip -> tree -> authoritative_path -> bytes` Git proof, while Core independently owns the closed receipt, byte, path, slice, hash, reference, and current-delivery consistency checks. R109 closes that second item through the single approved purpose-bound object reader shared by production and Test without exposing production authority. Third, if a durable business `BLOCKED` event has been proven but the following State CAS loses, the current call and local diagnostic report only `POINTER_STATE_CONFLICT / MANUAL_CONTROLLER_STOP` while retaining the real business event reference and the original State identity.

The C1 and C3 contracts remain closed. For C2, the user approved one credential-free, read-only, purpose-bound `createLedgerObjectReader({repositoryRoot,gitExecutable,runtime_uid,runtime_gid}) -> {read}` export in the existing `production.mjs`. Its exact request is `{remote_ref,expected_tip,tip,tip_tree,change_id}` and its result is the existing `GatewayResultV1<LedgerRemoteReadReceiptV2>`. Production's private Ledger factory and original `010-L13` use this same real Git-object implementation; `tip_tree` is an untrusted claim and success requires the fixed commit -> physical tree -> authoritative path -> blob-byte proof. The complete Ledger factory, credential/transport/process seams, Core public request, State/Event/Delivery contracts, and fixed composition remain closed. Real credentials/privilege and A2 expansion are not proposed. The specification package is ready only for the Controller's complete correctness and mandatory ponytail Gate; no downstream authority follows.

## Observable Acceptance Endpoint

In an isolated temporary repository with a local bare remote, a real allowed Worker file modification passes through:

`applyControllerCommand -> run -> settlement -> status`

and reaches:

`Worker dirty tree -> affected Regression -> Test Asset Retirement -> exact STAGE -> Candidate commit/readback -> Candidate Final Validation -> Validator -> branch push/readback -> freeze -> PR readback -> Handoff -> AWAITING_CONTROLLER`.

The same public path also proves the admitted negative frontiers, one causal Validator repair to a new Candidate, and a second or ineligible Validator failure stopping without later effects.

## Scope

### Future production paths eligible only after Spec Gate, Test RED, and TDD_READY

- `tools/harness/change-coordinator/coordinator.mjs`
- `tools/harness/change-coordinator/production.mjs`
- `tools/harness/change-coordinator/adapters.mjs`
- `tools/harness/change-coordinator/host-loop.mjs`

These are proposed Worker paths, not write authority granted by this Specification.

### Planned Test Design paths after Spec Gate

- `tools/harness/change-coordinator/coordinator.test.mjs`
- `tools/harness/change-coordinator/git.integration.test.mjs`
- `tools/harness/change-coordinator/mode-activation.test.mjs` (retained host route/isolation plus the shared-launcher ordinary/Validator child path, the separate real one-hour `012-L06` offline case, and the purpose-bound repair proof contract subject to A2)
- `tools/harness/change-coordinator/fixtures.mjs`
- `tools/harness/change-coordinator/production-delivery-chain.test.mjs` (new, if the Test role confirms the real K1/K2 chain cannot be expressed without hiding it in an existing broad suite)

The Test role freezes the minimum subset and causal RED identity before TDD_READY. The new integration Test is allowed only as one permanent current consumer; it is not a new harness framework.

### Conditional paths

None for production. If the four production files cannot implement the approved behavior, the Change is `BLOCKED / CONTRACT_CHANGE_REQUIRED`; the Controller must freeze any additional path before a new Spec cycle.

### Forbidden paths and effects

- `tools/harness/change-coordinator/worktree-snapshot-contract.mjs` and the accepted WVEB Test body;
- canonical `openspec/specs/**`, archived Changes, and historical evidence;
- CLI/controller CLI, plist/install scripts, dependencies, lockfiles, roles, governance, planning, and project-control;
- Product Core, Application, Domain/Model Packs, databases, Runtime/Profile code, Desktop, or another repository;
- real Agent/provider/model calls, production credentials, GitHub PRs, product branches, host installation, deployment, merge, archive, RELEASE, or Desktop DISPATCH.

## Preserved Baselines

- exactly four public methods, six macro states, seven event classes, one short process mutex, four recovery boundaries, Global WIP one, Controller stop authority, and one repair budget;
- accepted WVEB L1 snapshot algorithm and the entire `WORKTREE / REGRESSION` execution behavior;
- Candidate V1 field set; changed paths are not added to Candidate state;
- canonical diff raw-byte contract `JUANERAI_GIT_DIFF_V1`;
- exactly two cumulative canonical-diff observations, the existing delivery preimage and `DeliveryV1`/Candidate field sets;
- current Foundation release, pointer, public error, and Agent STARTED/INTERRUPTED binding rules;
- M1/B0 acceptance and history.

## Compatibility, Activation, and Rollback

Old placeholder or incomplete validation definitions, receipts, Validator results, Ledger records, PR requests, and Handoffs are not migrated and fail closed. The signed six-field definition envelope remains stable; execution definitions and receipt consumers become closed.

M2 remains offline. Under the exact user waiver A2, the privileged fixed-root/runtime-uid/fixed-profile sealed-proof preflight and the dependent repair-proof/K2 positive stay `USER_WAIVED / NOT_VERIFIED` and do not block current TDD_READY or M2 acceptance; their production checks are neither removed nor simulated, and no broader Host, Test, K2, deployment, or failure-path evidence is waived. The new shared launcher must instead be exercised on a real current-user temporary result root with a real offline fixture executable, actual files/stdin/child/error/close/output parsing/inventory/re-read/settlement, plus one separate true one-hour deadline case. This proves the shared local process implementation, not the fixed production root, uid/gid transition, sandbox, real Codex/provider, installed Host, or A2-waived proof. M3 separately owns specifically authorized target-host installation/rollback and activation readback. M4 only produces the Desktop-start decision.

Rollback for a future activated implementation remains stop ingress and restore the recorded installation/absence while preserving pointer, State, Ledger, Handoff, evidence, and Git history. No reset, force push, history rewrite, evidence deletion, or replacement identity is introduced.

## Gate

Controller reviews 001 through 004 did not pass the Spec Gate and remain historical evidence. F01-R remains closed fail-closed: after physical stage or a branch move, restart without the independently retained verified tree always takes the existing Candidate ambiguity/manual-stop path; a fresh STAGE entry with unchanged parent and empty index still performs the normal Regression-bound stage sequence. The user-approved `DECISION-M2-REPAIR-EVIDENCE-001` remains frozen for immutable base and derived input bytes/binding.

The user-approved `DECISION-M2-REPAIR-RUNTIME-CONTENT-002` is now expressed by one purpose-bound Host operation in Design 7.4. It does not retroactively attest what the Agent ran: it produces new evidence by rerunning exact per-finding RED/control IDs against the final captured Test bytes over the immutable Candidate tree in a sealed sandbox. Old JSONL, TAP declarations, and post-close hashes remain non-causal history. Activation still requires real fixed-profile capability/readback evidence; this draft claims no Mac mini deployment.

CCR002, not the earlier input-only decision, owns the minimum new closed contract fields: repair Test RESULT adds `repair_proof`; the sole subsequent repair Worker binding adds `repair_proof`; repair Worker RESULT adds `repair_delivery` with the post-Worker WVEB snapshot. They are retained inside existing complete AGENT_RUN detail and let existing Regression/STAGE receipts reject Test-content substitution without a new artifact Gateway, State field, event class, or public method. Ordinary role branches remain exact.

CCR003 is now expressed as the minimum bounded delta. In `host-loop.mjs`, production and Test must use the same purpose-bound launcher implementation; only `resultRoot` and the no-result directory preparation operation vary at trusted construction. In `production.mjs`, the existing Handoff factory alone becomes exported and keeps the same `atomicWrite`/readback implementation and exact delivery identity. No fifth production path, Test mode, clock/process/filesystem/parser injection, new public method, recovery boundary, or generalized seam is added.

The prior R044 Test return remains authoritative evidence history: original F01/F02/F04/F05 assets and causal frontiers are still incomplete; the two missing factory/export frontiers prove only CCR003 reachability. Every downstream assertion blocked by those frontiers remains `NOT_REACHED`, not a causal RED or PASS. Test must freeze those assertions and their independent controls before TDD_READY, then run them through the newly reachable shared implementations after Worker without adding or weakening Test assets. Final Test Asset Retirement remains after GREEN/regression and before the fresh implementation Validator.

R047's complete correctness/ponytail review and R059's `SPEC_GATE_PASS_S17` remain accepted historical Gates for every unaffected contract. S19/R063 reopens only the CCR004 root-parent representation in the existing `readCommit` result and its owning B2 acceptance/Test/task references. The success value keeps exactly `{sha,parent,tree,branch}` and the existing Gateway receipt rules. `parent:null` is legal only after successful physical commit-byte inspection at the existing `canonical_root` cwd proves zero parent headers; failed/absent/malformed/graph-derived/zero-OID/self-parent/uncertain reads never become root success or fabricated nonroot success. Nonroot `readCommit`, `commitCandidate`, Candidate event/State/success/readback, the one-parent Candidate proof, exact stage sequence, and every other contract remain unchanged. No parents array, new method/field/parser service, State, recovery rule, root-baseline ban, merge-policy expansion, or waiver is added.

R063's root-parent closure and all other accepted contracts remain historical inputs. S21/R085 reopens only original009/010's `CanonicalDiffResultV2` path-byte/hash consumption: accepted `raw_stdout` remains the exact Buffer, `path_raw_stdout` uses the same minimum representation, both lengths/full hashes and the explicit byte-normalized receipt preimage are independently verified, and Handoff restart reconstruction uses the existing persisted raw hash and unchanged delivery-ID preimage without adding durable fields. The only S21 Test consumers eligible for the later isolated rebind are the directly affected original009 assertions/helpers in `git.integration.test.mjs` and original009/010 assertions/helpers in `production-delivery-chain.test.mjs`; existing raw-Buffer assertions are retained and unrelated Tests remain frozen.

R109 preserves that accepted history and the exact mapping R104 C1 to original `TEST-M2-010 / 010-L01,L05`, C2 to original `TEST-M2-010 / 010-L13`, and C3 to original `TEST-M2-011 / 011-L08,L09`. C2 now has the user-approved single purpose-bound `createLedgerObjectReader/read` contract in Design 8.2 and `AC-M2-005-03`; an unchanged full-factory export remains explicitly insufficient and forbidden. Privileged credentials, real remote effects, and A2 expansion remain excluded. Status is `SPEC_READY / CONTROLLER_GATE_PENDING_R109`: the Controller must still run complete correctness and mandatory ponytail review and decide the Spec Gate. This package authorizes no Test write, RED execution, implementation, external execution, or lifecycle advance.
