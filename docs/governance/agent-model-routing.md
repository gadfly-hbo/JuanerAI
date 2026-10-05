# Agent and Model Routing

## Authority and Adoption

Follow `product-change-execution-policy.md`. This configuration implements the
user-approved Mini lean-engineering v0.9 of 2026-10-05; publication, receiver readback and any
stopped-task resume decision remain separate. Historical dispatch settings are
not rewritten. The inactive Host Loop is not compatible by inference and stays
inactive pending its separately authorized alignment.

## Fixed Roles

| Role | Agent | Model / reasoning | Sandbox | Use |
|---|---|---|---|---|
| MacBook Product Manager | primary session | gpt-6-astra / high (unchanged) | parent session policy | existing product preparation and approval workflow |
| MacBook product support | support subagents | gpt-6-astra / medium (unchanged) | approved task permissions | existing bounded product review/investigation, not the Mini engineering roles |
| Mini engineering primary | primary session | gpt-6.1-sol / medium | parent session policy | intake, spec/design, tests, implementation, correction, engineering state/acceptance and authorized delivery |
| Independent engineering Validator | juaner_validator | gpt-6.1-sol / high | read-only | complete candidate and evidence frozen; author-independent formal closeout review |
| Optional engineering support | juaner_worker | gpt-6.1-sol / medium | workspace-write | concrete scoped or parallel work with non-overlapping ownership; not a required handoff |
| Optional Spec / Test | juaner_spec / juaner_test | gpt-6.1-sol / medium | workspace-write | bounded spec/design or test/coverage question; existing no-production-write boundaries |
| Other Mini support | support subagents | gpt-6.1-sol / medium | approved task permissions | explicit scoped investigation or assistance, not a new mandatory role |

Default: Mini primary directly implements -> independent Validator at formal
closeout. Worker/Spec/Test are optional, not serial phases. The primary owns
necessary engineering design and tests as well as code; it also remains the
single engineering-state writer. No candidate author becomes its final Validator.

## Configuration and Dispatch

Mini engineering uses GPT-6.1 Sol (`gpt-6.1-sol`): primary and implementation/
support `medium`, independent final Validator `high`. MacBook product settings
remain unchanged. Keep existing sandboxes, permissions and concurrency limits.

The shared `.codex/config.toml` remains Astra/high with Astra/medium support,
preserving MacBook defaults. Each of the four `.codex/agents/juaner_*.toml` files
pins its Mini engineering entry above; they are not MacBook product-review roles.
At adoption, select Sol/medium for the Mini primary through the supported native
session model/effort setting and read back the actual session. Do not edit shared
defaults, introduce profiles/launchers or change global settings to accomplish
this. A generic Mini support dispatch must explicitly select Sol/medium because
the shared support default is still Astra; formal role files need no redundant
override. MacBook support keeps its existing routing.

Custom-role file model/effort pins take precedence over spawn defaults; generic
agents resolve explicit dispatch settings before shared defaults and parent
settings ([official configuration reference](https://learn.chatgpt.com/docs/agent-configuration/subagents)).
The static config check proves those files, not the Mini primary's loaded model.
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
The `medium` support setting does not make a generic support agent the final
Validator; use the independent `juaner_validator` role with its fixed `high`.
No role changes these fixed settings or gains permissions from its name. If this
configuration is unavailable, report the concrete availability or loading
problem; do not silently substitute a model or create an upgrade approval loop.

## Context and Concurrency

Keep the primary's engineering context continuous. For optional support dispatch,
use a fresh focused context, not a full parent history fork, and reuse it through
in-boundary corrections. Follow the sole
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
