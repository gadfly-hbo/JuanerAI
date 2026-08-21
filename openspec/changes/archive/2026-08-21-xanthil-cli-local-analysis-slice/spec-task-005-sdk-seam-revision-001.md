# TASK-005 Spec Revision 001 — Close Facade Signatures and Evidence Split

Status: **FROZEN**  
Controller: Codex  
Date: 2026-08-20

Preserve the selected single `sdkSessionFactory` construction seam and all accepted scope/ID/path decisions. Revise only `design.md`, `test-plan.md`, and `tasks.md` to close these combined Controller findings:

1. Remove current-state wording that says root manifest/lock/install remain unauthorized or blocked. Record that TASK-007 is accepted while preserving the rule that future manifest/dependency changes still require authority.
2. Freeze exact opaque facade method signatures and closed results:
   - `subscribe(listener)` listener input and exact unsubscribe result/function;
   - `setActiveTools(names)` sync/async status result;
   - `prompt(text,{expandPromptTemplates:false})` completion semantics/result;
   - `getActualModel()` exact closed result;
   - `abort()`, `waitForIdle()`, and `dispose()` idempotency plus exact void/status results.
   Missing/unknown arguments or result fields must fail closed. Do not expose raw Pi objects.
3. Freeze the offline/real evidence split:
   - TEST-XCLI-011 exercises the production-default project-local SDK construction only through open/readiness/policy inspection and dispose, without calling `prompt`, reading credentials, or contacting a provider.
   - TEST-XCLI-006 uses injected `sdkSessionFactory` to drive the complete shared business contract and Adapter translation/event/tool/cancel/failure matrix without claiming a real SDK/provider turn.
   - TEST-XCLI-021 remains exact package/version/ESM evidence; TEST-XCLI-013 remains the only real prompt/provider proof.
4. State explicitly that the optional second argument is dependency injection at the Adapter construction seam, not a test mode, output substitute, product/Profile option, environment switch, or hardcoded deterministic branch. It replaces only SDK session construction and has two implementations (production Pi and deterministic test), while all business behavior remains in the same Adapter implementation.
5. Ensure Test/Task wording does not claim the injected lifecycle is itself a real Pi session or that the production-default prompt path is proven before TEST-XCLI-013.

Run the same bounded static scope/ID/fence/SHA checks. Return changed sections and `SPEC_READY_TASK_005_SEAM_R1` or `SPEC_CONFLICT`. Do not edit any other path or start downstream roles.
