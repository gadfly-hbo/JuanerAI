# Agent and Model Routing

## Authority and Adoption

Follow `product-change-execution-policy.md`. This is the user-approved v0.9
two-role correction, not authority to resume a stopped task or the inactive Host
Loop. Publication, actual loading and receiver adoption remain separate.

## Fixed Roles

| Role | Agent | Model / reasoning | Sandbox | Use |
|---|---|---|---|---|
| MacBook Product Manager | primary session | gpt-6-astra / high (unchanged) | parent session policy | existing product workflow |
| MacBook product support | support subagents | gpt-6-astra / medium (unchanged) | approved task permissions | existing bounded product review/investigation |
| Mini engineering primary | primary session | gpt-6.1-sol / medium | parent session policy | intake, persisted spec/design, tests, implementation, corrections, engineering state/acceptance and authorized delivery |
| Independent engineering Validator | juaner_validator | gpt-6.1-sol / high | read-only | complete fixed candidate and evidence; author-independent formal review |

Mini has exactly these two engineering roles. Do not dispatch Worker/Spec/Test
or generic engineering helpers. The primary is the single author/state writer;
it never becomes its own final Validator. MacBook product support and product
runtime agents are outside this engineering-role restriction.

## Configuration and Dispatch

The shared `.codex/config.toml` remains Astra/high with Astra/medium support,
preserving MacBook defaults, sandbox and concurrency. Only
`.codex/agents/juaner_validator.toml` remains as a project engineering role.
The three retired role files are removed from current configuration, not from
Git history or historical receipts. Do not restore them under different names.

Select Sol/medium for the Mini primary through supported native session settings
and verify the actual session. At final review, verify the actual independent
Validator's Sol/high, read-only context and instructions. File checks alone do
not prove loading. Native role configuration is described in the
[official reference](https://learn.chatgpt.com/docs/agent-configuration/subagents).

There is no automatic model/effort upgrade, downgrade, fallback or model approval
loop. Difficult work requires root-cause diagnosis, not a different role or
renewed attempt count. Unavailable Validator blocks final review, not unrelated
safe implementation; never report missing independent review as PASS.

Apply the sole policy's Native-first Role Execution section. CLI substitution
requires explicit user consent and actual instruction/model/sandbox readback;
it is not a default route. No role setting grants new permissions, lifts a stop,
changes global configuration or authorizes a product probe.

## Context and Continuity

Keep the same main engineering context through ordinary corrections. Give final
Validator a fresh read-only context, approved acceptance, necessary contracts,
complete candidate identity and evidence pointers, not the author's reasoning
history. No other Mini engineering agent is dispatched; concurrency limits are
not a target to fill. Report progress without ending authorized work at a
milestone. Apply the sole policy's end-of-turn check. Actual user, safety,
permission and resource stops remain binding.
