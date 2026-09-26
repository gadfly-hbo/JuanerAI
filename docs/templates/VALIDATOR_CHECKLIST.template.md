# Independent Validator Checklist

Use materially applicable checks in one review under the sole execution policy.
Explain section-level non-applicability instead of creating new requirements.
Formatting preferences and optional template fields are not delivery blockers.

## Acceptance-first Reading

- [ ] Before the author's solution/tests, derive key positive, negative and failure expectations from approved product acceptance and necessary contracts.
- [ ] Independently exercise the key real business and failure paths using authorized checks; do not rely only on the author's passing tests.

## Frozen Inputs

- Change and accepted specification:
- implementation reference or complete write-set baseline:
- frozen test and critical artifact hashes:
- approved validation environment/entrypoint:
- required real-runtime evidence:
- forbidden calls and writes:

## Independence

- [ ] Validator context is fresh and read-only.
- [ ] Validator did not author the candidate's engineering spec/design, tests or implementation.
- [ ] No production, test, spec, project-control, dependency, credential, or global state was modified.
- [ ] Network/provider/model calls were made only when the validation brief explicitly authorized them.

## Scope and Contracts

- [ ] Actual changes remain within approved roots/conditions, with overlapping prior work attributed; normal file selection inside those roots is not scope drift.
- [ ] Intended delta is distinguishable from reused baseline behavior.
- [ ] Important contract changes have their required impact decision and affected verification; private adjustments preserve approved behavior and compatibility.
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
- [ ] Changed test assets and coverage retirement are checked in this review; no separate retirement PASS or compulsory ledger is required.
- [ ] Temporary/unused/equivalent assets are evaluated for actual impact; only material coverage, correctness, safety or evidence gaps block delivery.
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
- [ ] `verification.md` current verdict, traceability, test output, Engineering Controller state, and project board agree.
- [ ] Residual risks and mixed external evidence are disclosed without being converted into PASS by omission.
- [ ] Archive candidates have a current baseline, exact archive destination, and valid project-board references.

## Findings

Each blocker must identify an acceptance failure, concrete engineering defect,
violation of an approved architecture/safety/permission/contract boundary, or
material evidence gap preventing a required claim. Report all material findings
together when inputs suffice. Put nonessential format/style/tidying suggestions
in a separate advisory list; missing real authority/evidence is not cosmetic.

| Severity | Requirement/AC | File/Line or Command | Counterexample | Release Condition |
|---|---|---|---|---|
| | | | | |

## Verdict

- verdict: PASS / FAIL / BLOCKED
- reproduced evidence:
- advisory findings, not required for PASS:
- non-blocking residual risks:
- no-write attestation:
- acceptance/approval reminder: Validator does not grant Engineering Acceptance,
  Product Acceptance, merge, release, or archive.
