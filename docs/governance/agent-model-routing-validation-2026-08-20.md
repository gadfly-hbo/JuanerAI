# Agent Model Routing Runtime Validation

## Scope

Date: 2026-08-20

The Controller performed one real bounded subagent launch for each JuanerAI project role using the approved R1 standard route. Every probe was read-only, used a bounded context, inspected the role TOML, routing policy, and handoff template, and was forbidden to repair or write.

## Results

| Role | Requested Runtime Route | Declared Default | Process Started | Governance Match | Boundary Understood | Audit Fields | Writes | Verdict |
|---|---|---|---|---|---|---|---|---|
| juaner_spec | gpt-5.6-terra / medium | gpt-5.6-terra / medium | true | true | true | true | 0 | PASS |
| juaner_test | gpt-5.6-terra / medium | gpt-5.6-terra / medium | true | true | true | true | 0 | PASS |
| juaner_worker | gpt-5.6-terra / medium | gpt-5.6-terra / medium | true | true | true | true | 0 | PASS |
| juaner_validator | gpt-5.6-sol / medium | gpt-5.6-sol / medium | true | true | true | true | 0 | PASS |

## Probe Notes

- Spec, Worker, and Validator returned internally consistent PASS reports on their first turn.
- Test returned a PASS report whose `process_started` field was incorrectly `false` despite the live process. The Controller rejected the contradiction and requested a metadata-only re-evaluation. The same probe corrected the field to `true` without additional file reads or writes.
- Model and reasoning availability are evidenced by successful launches with explicit runtime route parameters plus matching declared configuration.
- The probes confirm default R1 routing, configuration consistency, bounded-context dispatch, role-boundary recognition, and zero-write behavior.

## Remaining Coverage

- R2 and R3 automatic upgrade paths are policy-approved but were not synthetically invoked; they should be evidenced when the first real qualifying task occurs.
- A bounded routing probe does not replace lifecycle evidence for Spec Gate, expected RED, implementation GREEN, or independent product validation.
- Sandbox declarations match the role TOML. This probe verified read-only behavior, not an adversarial operating-system sandbox escape test.

## Verdict

PASS for first formal dispatch readiness of all four role defaults. No model-availability or route-configuration blocker remains.
