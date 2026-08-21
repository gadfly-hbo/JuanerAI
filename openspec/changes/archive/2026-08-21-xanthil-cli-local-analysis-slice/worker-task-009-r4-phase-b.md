# TASK-009 Embedded Runtime R4 — Worker Phase B

## Gate

Controller verdict: `TDD_READY_TASK009_EMBEDDED_RUNTIME_R4_PHASE_B`.

Phase A is independently GREEN. Its model identity, local-only refresh, dynamic
templates, Application provenance, and Profile composition are frozen. The
M3-only Adapter contract now reaches the raw terminal parser and exposes exactly
three missing behaviors.

## Allowed Production Path

- `adapters/agent-pi/local-analysis.mjs`

`packages/application/local-analysis.mjs`,
`profiles/personal/local-analysis.mjs`, all tests, Product Core, Ports, CLI,
other Adapters, manifests, dependencies, global Pi configuration, credentials,
and every other path are frozen.

## Minimum Phase B Change

Change only the Adapter-owned raw terminal transport parsing used before Port
return:

1. Continue accepting one complete plain JSON object.
2. Also accept exactly one complete leading `<think>...</think>` prefix followed
   by one complete JSON object, discard the think content, and return the same
   parsed object as the plain form.
3. Detect and reject duplicate JSON object member names at every nesting level
   before Port return, including identical duplicate values.
4. Preserve fail-closed rejection for fences, commentary, repeated/non-leading
   or unterminated think tags, suffixes, malformed/multiple/non-object JSON,
   empty output, and all existing lifecycle/stream/tool errors.
5. Return only the existing sanitized `PROTOCOL_FAILURE` contract for raw
   transport rejection. Do not return raw model text or parser diagnostics.

Do not change model/refresh/session construction, prompts/templates, stream or
event projection, native tool policy, Application semantics, retry/fallback,
public exports, or Port shapes. Do not add a dependency.

## Frozen Evidence

Use command-local:

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin
```

Controller observed Phase A GREEN:

- syntax for all three Phase A files: PASS;
- unit baseline: `250/250` PASS;
- R4 Application/construction: `6/6` PASS;
- Profile construction/composition: `3/3` PASS;
- R4 M3 identity and dynamic-template contract: PASS.

The complete focused R4 TEST-XCLI-006 group is `9/12` PASS with exactly these
three causal failures:

- one complete leading think prefix: unexpected `PROTOCOL_FAILURE`;
- top-level duplicate member: missing expected rejection;
- nested duplicate member: missing expected rejection.

All eight other malformed/wrapper leaves pass and must remain passing.

Frozen current production SHA-256 values:

- Adapter — `08ae999597dd192a133d43ab556da6948d861c5ddc27eceb71d420f4d97d6a2f`
- Application — `16b274f9f3de7e93d4f509c9bae66ccab4f8e1bb67ea0d2b63e5fd4b6604bb08`
- Profile — `1796e147a82b0ecf2472785520ee17ee476f54d6944ab54194efc279dfa912a8`

Frozen test hashes remain those in `worker-task-009-r4-phase-a.md`.

## Exit

Return the Adapter final SHA, implementation summary, syntax result, focused
`12/12` GREEN, full contract result, and any regression failure. Do not call a
real model or network. Stop before real TEST-XCLI-013 or any additional repair.

