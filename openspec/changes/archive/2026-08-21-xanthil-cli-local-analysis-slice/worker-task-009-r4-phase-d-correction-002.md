# TASK-009 Embedded Runtime R4 — Worker Phase D Correction 002

## Gate

Controller verdict:
`TDD_READY_TASK009_EMBEDDED_RUNTIME_R4_PHASE_D_CORRECTION_002`.

Correction 001 passes the deterministic suite and admits Pi's routine user
message. Real and sanitized SDK evidence now exposes the next raw-event fact:
Pi emits `message_end` for `toolResult` messages after each native tool
execution. The current projector rejects those routine messages before the
existing authoritative `tool_execution_*` state machine can complete.

This is inside the approved Design rule that routine message events carrying no
accepted output may be ignored. No Spec revision is required.

## Allowed Production Path

- `adapters/agent-pi/local-analysis.mjs`

Every other path is frozen.

## Minimum Correction

- Only when `rawSdk === true`, ignore a `message_end` whose own `role` is
  `toolResult`, just as the production projection ignores routine user
  messages.
- Keep raw roles outside `user`, `assistant`, and `toolResult` as
  `PROTOCOL_FAILURE`.
- Keep the injected/internal facade's exact three-field assistant-only message
  contract unchanged.
- Keep all `tool_execution_start/end` projection, correlation, order, empty
  arguments, callback settlement, non-error completion, and late-event checks
  unchanged. Those events remain authoritative for tool policy.

Do not change any other event, parser, model, prompt, lifecycle, tool,
retry/fallback, public surface, or file. Do not run a real model/network.

## Causal RED

- Pi 0.84.2 `docs/extensions.md` states that `message_end` fires for user,
  assistant, and `toolResult` messages.
- Pi 0.84.2 `docs/session-format.md` defines `ToolResultMessage` without
  `stopReason`.
- A sanitized real M3 run observed the exact Execution role sequence:
  user, assistant/toolUse, three toolResult messages, assistant/stop; the exact
  three authoritative tool start/end pairs also completed successfully.
- Real TEST-XCLI-013 remains `0/1`; the deterministic suite remains GREEN.
- Candidate Adapter SHA:
  `bedd47d532932d97a867aef77dbe8881e2c5febc89de42fce1e9e1e7fd676063`.

## Exit

Return Adapter final SHA, syntax PASS, focused four-case GREEN, and complete
contract GREEN. Stop before integration/E2E or any real model execution.
