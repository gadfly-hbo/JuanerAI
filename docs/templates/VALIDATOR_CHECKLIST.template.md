# Independent Validator Checklist

## Frozen Inputs

- Change and accepted specification:
- implementation reference or complete write-set baseline:
- frozen test and critical artifact hashes:
- approved validation environment/entrypoint:
- required real-runtime evidence:
- forbidden calls and writes:

## Independence

- [ ] Validator context is fresh and read-only.
- [ ] Validator did not author the tests or implementation being judged.
- [ ] No production, test, spec, project-control, dependency, credential, or global state was modified.
- [ ] Network/provider/model calls were made only when the validation brief explicitly authorized them.

## Scope and Contracts

- [ ] Actual changed paths equal the approved write set.
- [ ] Intended delta is distinguishable from reused baseline behavior.
- [ ] Shared Port, schema, identity, status, version, persistence, model, dependency, and Profile contracts did not drift.
- [ ] Product Core/Application dependency direction remains inward.
- [ ] Runtime SDK types, events, errors, tool structures, and session structures remain confined to their owning Adapter and do not appear in business Ports or public/versioned contracts.
- [ ] Every replaceable Adapter passes the unchanged relevant contract suite.

## Test Integrity

- [ ] Expected RED was causal and captured before production implementation.
- [ ] Tests were not weakened during implementation.
- [ ] Helper/environment health is independent of target behavior.
- [ ] Material invariants use independent positive, negative, boundary, failure, and forbidden-side-effect leaves where applicable.
- [ ] Broad titles or representative examples do not hide unscheduled mutations.
- [ ] Doubles exercise the public boundary without replacing the core behavior under test.
- [ ] When test assets changed, the Test Asset Retirement Gate is PASS and its lifecycle ledger matches the frozen tree.
- [ ] No tracked temporary evidence, unresolved retirement candidate, or retained test-only asset without a consumer remains.
- [ ] Every retired behavior test names retained coverage for the same REQ/AC and material mutation, or proves it was diagnostic-only and outside accepted traceability.
- [ ] Equivalent retained tests have distinct current evidence purposes; obsolete implementation, format, error, or toolchain tests map to a current approved contract.

## Physical and External Boundaries

- [ ] Physical source, run root, identity, containment, and version checks occur before the first disallowed external or model effect.
- [ ] Post-preflight deletion, replacement, symlink, mutation, and non-regular targets map to the approved failures.
- [ ] Requested configuration is not reported as observed runtime/model/tool state.
- [ ] Source read time and other provenance values come from the authoritative observation, not confirmation time or ambient metadata.
- [ ] Runtime initialization failures are distinct from model absence/selection failures.

## Timeout, Cancellation, and Publication

- [ ] Admission, already-issued work, physical/Application linearization points, and race winners match the specification.
- [ ] User cancellation closes future normal work and public calls converge as specified.
- [ ] Deadline/expiry actively bounds permanently pending work and is the approved absolute winner.
- [ ] Late results cannot regain success, start a terminal write, or reopen admission.
- [ ] Exceptional terminal writes are unique and occur only in their approved windows.
- [ ] Success becomes authoritative only at the specified final publication point.
- [ ] No hidden retry, fallback, repair, cleanup, or next-startup mutation exists.

## Data and Security

- [ ] Data classification and model-egress boundaries match the approved Profile.
- [ ] Credentials, environment values, raw provider/SDK content, transcripts, sensitive rows, and unrelated files are absent from prompts, logs, fixtures, traces, and artifacts.
- [ ] Tool inventory is least-capability and contains no generic or unexpected network/filesystem/code execution path.
- [ ] Failure outputs are closed and sanitized.

## Evidence and Read Models

- [ ] Unit, contract, integration, E2E, syntax, static, and real-runtime counts reproduce as required.
- [ ] Toolchain and dependency versions come from the approved canonical entrypoint.
- [ ] Critical hashes match frozen inputs.
- [ ] `verification.md` current verdict, traceability, test output, Controller state, and project board agree.
- [ ] Residual risks and mixed external evidence are disclosed without being converted into PASS by omission.
- [ ] Archive candidates have a current baseline, exact archive destination, and valid project-board references.

## Findings

| Severity | Requirement/AC | File/Line or Command | Counterexample | Release Condition |
|---|---|---|---|---|
| | | | | |

## Verdict

- verdict: PASS / FAIL / BLOCKED
- reproduced evidence:
- non-blocking residual risks:
- no-write attestation:
- acceptance/approval reminder: Validator does not accept or archive.
