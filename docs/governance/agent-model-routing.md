# Agent and Model Routing

## Authority and Adoption

Follow `product-change-execution-policy.md`. This configuration implements the
user-approved continuous-engineering v0.8; publication, receiver readback and any
stopped-task resume decision remain separate. Historical dispatch settings are
not rewritten. The inactive Host Loop is not compatible by inference and stays
inactive pending its separately authorized alignment.

## Fixed Roles

| Role | Agent | Model / reasoning | Sandbox | Use |
|---|---|---|---|---|
| Product Manager / Engineering Controller | primary sessions | gpt-6-astra / high | parent session policy | product work / Mini engineering control |
| Engineering agent | juaner_worker | gpt-6-astra / high | workspace-write | approved product/UI input, confirmed intake and authorized result-sized package |
| Independent Validator | juaner_validator | gpt-6-astra / high | read-only | complete candidate and evidence frozen; author-independent review |
| Spec specialist | juaner_spec | gpt-6-astra / high | workspace-write | optional bounded spec/design question within approved product input |
| Test specialist | juaner_test | gpt-6-astra / high | workspace-write | optional bounded test/coverage question from approved behavior |
| Other authorized support | support subagents | gpt-6-astra / high | approved task permissions | bounded review or investigation; not a new mandatory role |

Default: engineering agent -> independent Validator. Spec/Test are not
mandatory phases. They preserve their scoped no-production-write boundaries,
but the engineering agent itself may maintain tests and necessary engineering
spec/design. No candidate author becomes its final Validator.

## Configuration and Dispatch

All JuanerAI development agents and subagents use GPT-6 Astra (`gpt-6-astra`)
with `high` reasoning. `.codex/config.toml` pins both primary and default
subagent settings; every role TOML pins the same model and effort. Keep existing
sandboxes and concurrency limits. There is no model/effort upgrade, downgrade,
fallback, per-dispatch risk matrix or upgrade ledger. A difficult task calls for
diagnosis or scoped expertise under this same configuration, not model routing.

At intake or configuration change, verify the active session actually exposes
the intended role descriptions and settings. A file edit does not prove an
already open session loaded it. Incompatible role definitions require a bounded
reload/resumption at a safe boundary; do not launch product work as a probe,
migrate the original task, or silently substitute a generic role.

Record the actual model/effort with the existing handoff, not a new state system.
Use the configured roles without redundant model/effort overrides. No role
changes these fixed settings or gains permissions from its name. If this
configuration is unavailable, report the concrete availability or loading
problem; do not silently substitute a model or create an upgrade approval loop.

## Context and Concurrency

Reuse the engineering context through in-boundary corrections. Provide optional
specialists only their concrete question, relevant approved inputs, write roots
and exit condition. Final validation uses fresh read-only context and fixed
inputs, with acceptance-first reading order.

At most three engineering subagents run concurrently. Parallel work is useful
only for independent investigation or non-overlapping ownership with stable
shared contracts; shared-worktree write-heavy work is serial. Filling slots is
not a goal. User product/safety/resource decisions go directly to Mini's user,
not MacBook technical approval.
