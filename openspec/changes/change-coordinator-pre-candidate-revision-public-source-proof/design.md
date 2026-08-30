# Design: Change Coordinator Pre-candidate Revision Public-source Proof

## Decision

Keep production immutable and strengthen only the existing Test evidence. Test changes the eighteen existing leaves in the physical Test file without changing any other physical byte. The Controller then extracts that exact delta and applies it to the frozen Test inheritance blob in an untracked isolation directory.

```text
physical Test preimage
-> eighteen-leaf order/identity edit only
-> exact preimage/postimage delta
-> apply delta to frozen Test inheritance blob in /private/tmp
-> final Test adoption blob
```

The delta must apply uniquely and must not overlap the excluded two-line residue. The final evidence tree uses the frozen production blob, the derived final Test adoption blob, and clean-baseline bytes elsewhere. The integration stop is owned by Proposal and REQ-003.

## Public-source Proof Algorithm

The existing `TEST-PCRR-004/005` matrix retains all 31 cases on each of the Test and Worker routes. Only the nine state-mutation cases below receive the strengthened order contract. Test must express the following statements in this exact source and runtime order for every one of the eighteen leaves:

1. create the existing deterministic Coordinator harness;
2. call public `applyControllerCommand` with a real signed DISPATCH and use public `run` to reach the selected Test or Worker action;
3. call public `settlement` for exact STARTED and then exact `RESULT/FAIL`;
4. assert the existing route-specific blocked reason and next action;
5. immediately call public `status` before any private-state clone, mutation, `primeState`, or REVISION construction;
6. assert that source status `state`, `state_version`, and `state_hash` exactly equal the authentic FAIL settlement result, and assert the expected existing status payload;
7. only after step 6, clone the current state, apply exactly one named mutation, and call the existing `primeState` Test helper once;
8. call public `status` again and assert that its `state`, `state_version`, and `state_hash` exactly equal the primed mutated-state identity; also assert the mutation-relevant existing payload;
9. snapshot the complete existing forbidden-effect counters;
10. construct the existing signed REVISION against the second public status identity and call public `applyControllerCommand`;
11. require `REJECTED` without adding or weakening an error vocabulary;
12. call final public `status` and require the complete public result identity and payload to equal step 8; and
13. require the effect counters to equal step 9 exactly.

The Controller's line-by-line Gate is:

```text
settle FAIL
< source status and exact identity assertion
< clone
< exactly one mutation
< primeState
< mutated status and exact identity assertion
< REVISION rejection
< final status and zero-effect assertion
```

Moving only method calls without the corresponding identity assertions does not satisfy this contract. Comparing only `status.payload` does not satisfy it. A private state read or clone before source status invalidates the leaf.

## Frozen Eighteen Leaves

Each mutation runs once on the Test route and once on the Worker route:

| Mutation | Required isolation |
|---|---|
| wrong blocked reason | change only `blocked_reason` |
| wrong route macro | change only the route macro fields required by the existing case |
| non-null Candidate | change only Candidate nullability |
| non-null delivery | change only delivery nullability |
| persisted repository root | change only persisted `repository.worktree_root` |
| persisted repository branch | change only persisted `repository.branch` |
| persisted baseline | change only persisted `repository.baseline_sha` |
| persisted admission identity | change only the existing admission identity field used by the inherited case |
| stale assignment claim | change only the existing pending assignment claim used by the inherited case |

The other 22 inherited request/preparation mutations remain unchanged permanent evidence. They do not permit a new Test ID, leaf, helper, or count.

## Authentic and Mutated Identity Binding

The authentic source is established only by the four public methods:

- `applyControllerCommand`: admits the real signed DISPATCH and later rejects the signed REVISION;
- `run`: requests the exact Test or Worker route;
- `settlement`: records STARTED and `RESULT/FAIL` and returns the authentic blocked identity; and
- `status`: independently reads the authentic source, the primed mutated source, and the unchanged final source.

`primeState` is allowed only after the authentic public status because it is the existing Test mutation mechanism, not a source-of-truth observer. The second status makes the mutated state externally visible through the public read model before the rejection is tested.

## Forbidden-effect Vector

The before/after comparison must retain the existing counters for:

- State writes;
- Ledger append preparation and Agent events;
- Worktree creation;
- stage and Candidate commit;
- branch push;
- validation execution;
- pull-request creation/reuse; and
- Handoff write/readback.

Status calls and the rejected REVISION add zero to every counter. `primeState` is the controlled Test setup between the two public status observations and is not misreported as a production State write.

## Candidate Isolation

The production candidate is the exact 196-line / 55,683-byte blob with SHA-256 `ac81f5b44cbca2e9984edf92620fc15da9af91712a3a936fb35b7b1ceb352927`. The physical 207-line file must not be used as candidate identity.

Before Test writes, the physical file must match SHA-256 `0476bd89c8a54ff9df5c378e9de0b9c0fbcbfd8b94433e14366b522c297e3198`. Test changes only the eighteen existing leaves and preserves every other physical byte. The Controller extracts that exact delta and applies it without ambiguity to the 1,743-line / 160,122-byte inheritance blob at SHA-256 `0a2f4e3db19bfbdd4b3ccab062b901702fcce2a60ba666b213013f540dfda582` in `/private/tmp` or an equivalent untracked directory. The Controller freezes the derived blob's hash, line count, byte count, delta, and test counts before Validator dispatch.

Validation must execute in an isolated candidate tree whose production and Test blobs match those frozen identities and whose other paths match clean baseline. Running against the mixed physical worktree alone is not adoption proof.

## Compatibility

The four-method surface, signed command shape, State/Event schema, fixtures, helper API, Test IDs, Test counts, production behavior, and canonical baseline remain unchanged. There is no migration or compatibility path for excluded physical hunks.

## Implementability Stop Line

If the proof cannot close by editing only the existing matrix logic in `coordinator.test.mjs`, stop. Do not create a fixture exception, helper, source scan, temporary tracked probe, public seam, production edit, or alternate candidate assembly mechanism.
