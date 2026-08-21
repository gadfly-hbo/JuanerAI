# TASK-009 Embedded Runtime R4 — Worker Phase A

## Gate

Controller verdict: `TDD_READY_TASK009_EMBEDDED_RUNTIME_R4_PHASE_A`.

This is a staged release, not the complete R4 TDD Gate. Phase A exists because
the frozen production model guard still admits only Mimo, so M3-only runtime
tests cannot yet reach the closed transport parser or Application semantic
checks without violating the approved positive-identity policy.

## Allowed Production Paths

- `adapters/agent-pi/local-analysis.mjs`
- `packages/application/local-analysis.mjs`
- `profiles/personal/local-analysis.mjs`

All tests, Product Core, Ports, CLI, analytical and Artifact Adapters, examples,
manifests, lockfiles, dependencies, global Pi configuration, credentials, and
other paths are frozen.

## Minimum Phase A Change

1. Replace the frozen production identity with exactly
   `minimax-cn/MiniMax-M3` in Adapter, Application, and Personal Profile.
   Mimo remains rejected and is not a fallback.
2. In production SDK realization, keep
   `ModelRuntime.create({allowModelNetwork:false,refreshOnCreate:false})`, then
   execute exactly one `runtime.refresh({allowNetwork:false})` before
   `getModel`. Do not add network refresh, retry, or a finish-reason bypass.
3. Derive the Discovery `response_template` only from the validated
   `discovery_context` and the Execution `response_template` only from the
   validated `finding_context`. Execution also sets
   `copy_response_template_values_exactly_after_tools_succeed: true`.
4. Application changes are limited to `modelIdentity` and the already-dependent
   validation, `actual_model`, and run provenance flow. Profile changes are
   limited to its guarded provider/model constants.

Phase A must not change `parseFinalText`, duplicate-member handling, stream
projection/failure mapping, business validation, Port shapes, native tool
ordering, retry policy, or any public surface. Those remain Phase B candidates
only after the M3 runtime tests can reach them and establish focused RED.

## Frozen Test Evidence

Run with:

```sh
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin
```

The Controller independently observed:

- unit baseline: `250/250` PASS;
- source identity: RED because Adapter still names Mimo;
- local-only refresh: RED because zero explicit refresh calls exist;
- dynamic templates: RED because `response_template` is absent;
- Application/Run provenance: RED at the frozen Mimo dependency guard;
- retry/no-fallback/finish-reason-bypass negative: PASS and must remain PASS.

Frozen test SHA-256 values:

- `tests/fixtures/xanthil-local-analysis/coverage-map.mjs` — `b8db9c053a909cf7059e0f12fac8ccf64fd86160677fe67e60752a0dda47fc17`
- `tests/fixtures/xanthil-local-analysis/fixture-oracle.mjs` — `711eddbc5ce1e8f328d0f724752d7b43f1a1706944b98cc64ac0156f7c26b7f0`
- `tests/fixtures/xanthil-local-analysis/port-contracts.mjs` — `9783e21752f2f939330c6f9dcb136fe940b911ee6511f3cb38522267293349db`
- `tests/contract/xanthil-local-analysis/local-analysis-ports.contract.test.mjs` — `f8c373a7a14799d9aa05d13c26731995dbb0f84b276f0578782725bef997ed81`
- `tests/integration/xanthil-local-analysis/local-analysis.integration.test.mjs` — `e6db4f2927bc65c2eb8e1a1f5954882eafc1da8f0c79776d6bfc15974a2393e7`

Pre-Worker production SHA-256 values:

- Adapter — `91146cf2b7d16724c44419a19306fe1d6cfdb1a475e9fb778a653e33c62dee13`
- Application — `45d49c45fbca0e7862aa20a2510bd28379fdfafb3fe42c4ae1e9f440b27180f6`
- Profile — `707d0ac3b50054e255ec7b4a70aa6898aec8d6c48a31212f98b753acabfc9134`

## Exit

Return changed-path inventory, final hashes, syntax results, the focused Phase A
GREEN commands/results, and the remaining newly reachable Phase B REDs. Do not
call a real model or network, and do not continue into Phase B implementation.

