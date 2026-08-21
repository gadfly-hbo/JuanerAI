# TASK-009 Embedded Runtime R4 — Worker Phase D

## Gate

Controller verdict: `TDD_READY_TASK009_EMBEDDED_RUNTIME_R4_PHASE_D`.

The complete deterministic suite is GREEN. The sole real TEST-XCLI-013 is
causally RED at the private raw-SDK event projection boundary: the production
Adapter rejects a valid Pi `AssistantMessage` because the raw object contains
documented SDK metadata in addition to `role`, `content`, and `stopReason`.
Direct sanitized SDK evidence independently proves that the selected M3 model,
both prompts, and all three native tools complete successfully.

## Allowed Production Path

- `adapters/agent-pi/local-analysis.mjs`

Every test and every other production, manifest, dependency, credential,
global Pi, and documentation path is frozen.

## Minimum Phase D Change

At the private `projectEvent` raw-SDK boundary only:

1. accept a routine raw `message_end` whose message role is `user` and project
   it to no internal event;
2. for a raw assistant `message_end`, read only `role`, `content`, and
   `stopReason`, discard all SDK/provider metadata, and emit the existing
   three-field closed internal event;
3. preserve the existing `MODEL_EXECUTION_FAILED` classification for a missing
   or non-`stop` assistant terminal reason;
4. preserve `PROTOCOL_FAILURE` for a non-user/non-assistant message role or a
   malformed event/message/content shape.

Do not relax the injected facade contract: it continues to emit already
projected, closed internal events. Do not change parsing, prompts/templates,
model identity, refresh, tools, retry/fallback, Application, Profile, Ports,
tests, or public exports. Do not call a real model/network; Controller owns the
single post-GREEN real acceptance execution.

## Frozen Causal RED

Using command-local
`PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin`, Controller observed:

- deterministic regression GREEN: unit `250/250`, contract `174/174`,
  integration `162/162`, default E2E `131` PASS plus one explicit real skip;
- real TEST-XCLI-013: `0` pass / `1` fail, returning failed at Discovery with
  exact sanitized code `PROTOCOL_FAILURE`;
- sanitized direct embedded-SDK diagnostic: both M3 stages stop normally, the
  three tools run in exact order, and the raw assistant message carries the
  keys `api`, `content`, `model`, `provider`, `rawStopReason`, `responseId`,
  `role`, `stopReason`, `timestamp`, and `usage`.

The Test role confirmed that a new deterministic facade test would test the
wrong boundary or require a new production seam. Existing frozen mutations
remain `4/4` GREEN for missing terminal, missing finish reason, non-stop reason,
and wrong assistant role. The real E2E plus sanitized raw-SDK evidence is the
causal RED for this private production projection defect.

Frozen SHA-256 values:

- Adapter — `c7779e8b93a32fb4d19480dd3feef8bf167ff00f16bc5554ba66143e05c0901b`
- Application — `16b274f9f3de7e93d4f509c9bae66ccab4f8e1bb67ea0d2b63e5fd4b6604bb08`
- Profile — `1796e147a82b0ecf2472785520ee17ee476f54d6944ab54194efc279dfa912a8`
- contract test — `8184a626cf5e4be30e233ec41de395c572c7e07c46ad7b6ba6f1c4d4227fd236`

## Exit

Return Adapter final SHA, syntax PASS, the focused frozen four-case regression,
and complete contract GREEN. Stop before integration/E2E or any real model
execution.
