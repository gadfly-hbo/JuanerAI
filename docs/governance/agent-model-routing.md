# Agent and Model Routing

## Authority and Adoption

Follow `product-change-execution-policy.md`. This configuration implements the
user-approved continuous-engineering v0.8 and fixed role-effort adjustment of
2026-10-04; publication, receiver readback and any
stopped-task resume decision remain separate. Historical dispatch settings are
not rewritten. The inactive Host Loop is not compatible by inference and stays
inactive pending its separately authorized alignment.

## Fixed Roles

| Role | Agent | Model / reasoning | Sandbox | Use |
|---|---|---|---|---|
| Product Manager / Engineering Controller | primary sessions | gpt-6-astra / high | parent session policy | product work / Mini engineering control |
| Engineering agent | juaner_worker | gpt-6-astra / medium | workspace-write | approved product/UI input, confirmed intake and authorized result-sized package |
| Independent Validator | juaner_validator | gpt-6-astra / high | read-only | complete candidate and evidence frozen; author-independent review |
| Spec specialist | juaner_spec | gpt-6-astra / medium | workspace-write | optional bounded spec/design question within approved product input |
| Test specialist | juaner_test | gpt-6-astra / medium | workspace-write | optional bounded test/coverage question from approved behavior |
| Other authorized support | support subagents | gpt-6-astra / medium | approved task permissions | bounded review or investigation; not a new mandatory role |

Default: engineering agent -> independent Validator. Spec/Test are not
mandatory phases. They preserve their scoped no-production-write boundaries,
but the engineering agent itself may maintain tests and necessary engineering
spec/design. No candidate author becomes its final Validator.

## Configuration and Dispatch

All JuanerAI development agents and subagents use GPT-6 Astra (`gpt-6-astra`).
Reasoning is fixed by role: primary Product Manager/Engineering Controller and
final Validator use `high`; continuous Worker, optional Spec/Test and other
support use `medium`. The Worker still owns package-level spec/design as well
as implementation; the lower effort does not move that work back to Controller.
`.codex/config.toml` pins primary `high` and default subagent `medium`; each role
TOML pins its table entry. Keep existing sandboxes and concurrency limits.
There is no automatic model/effort upgrade, downgrade or fallback, per-dispatch
risk matrix or upgrade ledger. A difficult task calls for diagnosis or scoped
expertise, not an automatic effort change or retry quota.

At intake, dispatch or configuration change, apply the sole execution policy's
Native-first Role Execution section, including explicit user consent for CLI
role substitution and verified stop/checkpoint transfer when changing routes.
Verify the active native role descriptions and primary/default/role settings;
a file edit does not prove an open session loaded them. For a user-consented
CLI exception, also read back its actual role instructions and CLI/session
overrides; an old `high` override can mask the Worker default. Incompatible
definitions require a bounded correction at a safe boundary; do not launch
product work as a probe, migrate the parent task or silently substitute a role.

Record the actual model/effort with the existing handoff, not a new state system.
Use the configured roles without redundant model/effort overrides. The default
`medium` support setting does not make a generic support agent the final
Validator; use the independent `juaner_validator` role with its fixed `high`.
No role changes these fixed settings or gains permissions from its name. If this
configuration is unavailable, report the concrete availability or loading
problem; do not silently substitute a model or create an upgrade approval loop.

## Context and Concurrency

For initial Worker dispatch, use a fresh focused task context, not a full parent
history fork. Then reuse it through in-boundary corrections. Follow the sole
policy's Lean Context and Continuous Ownership section for input selection,
delta follow-ups, recovery and return handling. Optional specialists receive
only their concrete question, relevant approved inputs, write roots and exit
condition. Final validation uses fresh read-only context and complete fixed
inputs, with acceptance-first reading order, not the author's reasoning history.

At most three engineering subagents run concurrently. Parallel work is useful
only for independent investigation or non-overlapping ownership with stable
shared contracts; shared-worktree write-heavy work is serial. Filling slots is
not a goal. User product/safety/resource decisions go directly to Mini's user,
not MacBook technical approval.
