# Change004 deferred E2 verification

Status: **OPEN — user accepted deferral for Change004 delivery on 2026-10-02**.
Owner: Mac mini Engineering Controller. User decision: “放行E2，后续再修，交付change004”.

## Observed failure

The unchanged native test builds Main, Preload and Renderer, then Electron exits
SIGABRT before a window/IPC or product Main entry is established. Latest attempt:
`controller/validator-permitted-001/validation-007/native-001`, PID34623.
Playwright kill and Validator process enumeration returned EPERM. Playwright
observed exit/temporary cleanup; Controller later found the exact PID absent.
No claim of independent complete descendant cleanup is made.

The matching macOS crash reaches application registration/NSApplication setup.
Controller's filtered kernel/launchd logs explicitly deny WindowServer,
LaunchServices and other desktop services. This establishes a concrete sandbox
incompatibility; sole root cause and repair effectiveness remain unproven.
Evidence lives under the existing Mac mini root
`/Users/bendandebaba/JuanerAI-artifacts/change-004/controller/validator-permitted-001`.

## Exact return and closure conditions

1. Establish a supported native execution environment with the required desktop
   services while preserving approved source/data/permission boundaries. Keep
   all failures and process identities; do not blindly retry or disable controls.
2. Re-run the retained `tests/e2e/xanthil-desktop/member-task-native.e2e.test.ts`
   on the fixed or explicitly corrected candidate; prove preparation, consent,
   authorization, continue, stop and reopen through actual native UI and IPC.
3. Complete applicable native keyboard/focus/viewport and owned-process cleanup,
   registered current-package GUI readback and default canonical/native/package
   checks. Preserve assertions and existing negative cases.
4. Independently verify any repair and record exact source/build/package/results.
   Close this follow-up only on executable evidence, not the current waiver.

E1 stays independently passed. User experience review remains user-owned later.
The waiver permits this Git delivery, not installed release or real Provider/data
activation. No new runtime, dependency, remote host or system-security change is
preapproved. Approval for isolated test writes and local Electron startup persists.
