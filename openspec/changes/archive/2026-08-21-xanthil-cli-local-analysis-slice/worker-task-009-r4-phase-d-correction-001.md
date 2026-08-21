# TASK-009 Embedded Runtime R4 — Worker Phase D Correction 001

## Gate

Controller verdict:
`TDD_READY_TASK009_EMBEDDED_RUNTIME_R4_PHASE_D_CORRECTION_001`.

The Phase D candidate preserves every deterministic contract but the sole real
TEST-XCLI-013 still fails in Discovery with sanitized `PROTOCOL_FAILURE` before
a model round trip. The accepted cause is a validation-order defect at the same
private raw-SDK projection boundary.

## Allowed Production Path

- `adapters/agent-pi/local-analysis.mjs`

Every other path is frozen.

## Minimum Correction

For a raw-SDK `message_end` only:

1. first require a plain message object with its own `role`;
2. if the role is `user`, return no projected event without requiring
   `content` or `stopReason`;
3. if the role is `assistant`, then require its own `content` and `stopReason`
   and preserve the Phase D projection and failure classification;
4. reject every other role as `PROTOCOL_FAILURE`.

For the injected/internal facade (`rawSdk === false`), preserve the exact
three-field `role/content/stopReason` message contract. Do not change any other
event projection, parser, model, prompt, lifecycle, tool, retry/fallback,
public surface, or file. Do not run a real model/network.

## Causal RED

- Real TEST-XCLI-013 after the Phase D candidate: `0` pass / `1` fail at
  Discovery with `PROTOCOL_FAILURE` after about 0.62 seconds.
- Pi 0.84.2 local documentation defines `UserMessage` as
  `role/content/timestamp`, with no `stopReason`:
  `node_modules/@earendil-works/pi-coding-agent/docs/session-format.md`.
- Candidate Adapter SHA:
  `c2d3f476da587650e8f3770f983b9f8a8513ee2e4b3653b61337cdfcc81fd5bd`.
- Application and Profile remain frozen at
  `16b274f9f3de7e93d4f509c9bae66ccab4f8e1bb67ea0d2b63e5fd4b6604bb08`
  and `1796e147a82b0ecf2472785520ee17ee476f54d6944ab54194efc279dfa912a8`.

## Exit

Return Adapter final SHA, syntax PASS, focused four-case GREEN, and complete
contract GREEN. Stop before integration/E2E or any real model execution.
