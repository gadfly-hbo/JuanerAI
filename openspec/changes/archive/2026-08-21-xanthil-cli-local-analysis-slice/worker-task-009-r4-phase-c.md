# TASK-009 Embedded Runtime R4 — Worker Phase C

## Gate

Controller verdict: `TDD_READY_TASK009_EMBEDDED_RUNTIME_R4_PHASE_C`.

Phase A and the corrected Phase B parser are GREEN. The complete contract now
has exactly three independently named lifecycle/stream failures; all other 171
contract tests pass.

## Allowed Production Path

- `adapters/agent-pi/local-analysis.mjs`

Every test and every other production, manifest, dependency, credential, global
Pi, and documentation path is frozen.

## Minimum Phase C Change

Preserve the existing event state machine and sanitized error surface, but map
exactly these incomplete/non-stop model terminal conditions to
`MODEL_EXECUTION_FAILED`:

1. the turn settles without a final `message_end`;
2. the assistant terminal stream ends without a finish/stop reason;
3. the assistant terminal has a non-`stop` terminal reason.

Do not globally translate `PROTOCOL_FAILURE`. Malformed event shapes, wrong
assistant role, reordered/duplicate/late terminal events, malformed JSON,
retry/compaction/continuation, and all existing protocol/tool-policy mutations
must retain their current exact codes and effect counts. A provisional
missing-message state must still become `PROTOCOL_FAILURE` if a final message
arrives later out of order.

Do not change parsing, think/duplicate handling, model/refresh construction,
prompts/templates, tool callbacks, retry/fallback, public exports, or Port
shapes. Do not add a dependency or call a real model/network.

## Frozen Evidence

Use:

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin
```

Controller independently observed:

- corrected R4 parser target: `13/13` PASS;
- complete contract: `171` PASS and exactly `3` FAIL;
- each focused failure expects `MODEL_EXECUTION_FAILED` and receives
  `PROTOCOL_FAILURE`: `missing message_end`, `stream ended without finish
  reason`, and `wrong stop reason`.

Frozen SHA-256 values:

- Adapter — `bf2976e93f6570bab9076c799e89b6c3737e4478dcfc2031597363326a80ba7e`
- Application — `16b274f9f3de7e93d4f509c9bae66ccab4f8e1bb67ea0d2b63e5fd4b6604bb08`
- Profile — `1796e147a82b0ecf2472785520ee17ee476f54d6944ab54194efc279dfa912a8`
- contract test — `8184a626cf5e4be30e233ec41de395c572c7e07c46ad7b6ba6f1c4d4227fd236`
- integration test — `e6db4f2927bc65c2eb8e1a1f5954882eafc1da8f0c79776d6bfc15974a2393e7`

## Exit

Return Adapter final SHA, syntax PASS, focused three-case `3/3` GREEN, complete
contract GREEN, and exact regression evidence. Stop before integration/E2E or
real model execution; Controller owns those gates.

