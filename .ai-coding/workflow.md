# Change Workflow

Use `docs/governance/product-change-execution-policy.md` for authority, adoption,
local correction, stop-loss and delivery. This is its execution summary, not a
second policy or an instruction to resume an existing stopped task.

## Product Preparation

Product Manager clarifies intent and the smallest useful result, prepares the
product proposal and applicable clickable UI Contract, completes the existing
development-readiness review for new/material product plans, and obtains user
product/UI approval. Reuse valid existing inputs; do not repeat these steps for
internal engineering changes. Freeze product semantics, acceptance and prohibitions,
not ordinary implementation mechanics. Link affected Blueprint capability IDs
from `docs/planning/capability-coverage/register.md` in the existing Change input;
forecast coverage separately from delivered coverage.

## Engineering Work

After Mini verifies real intake and authorizes the result-sized work package:

1. The same Mini engineering main Agent states the minimum behavior spec and necessary design:
   input/output, success/failure, forbidden effects, acceptance reference and
   material contracts. Resolve load-bearing ambiguity before implementing it.
2. For that behavior, write and run a test that fails because the behavior is
   absent; implement the smallest GREEN change; refactor only while GREEN.
   Repeat this small vertical loop, not a whole-system test-first stage.
3. Correct code, fixtures and private design locally inside the authorized roots.
   Check important boundary changes before dependent actions. Run the thinnest
   real path early and the applicable type/build, contract and regression checks.
   In adopted v0.9 Mini work, use authorized daily checkpoints/work-branch pushes
   and the sole policy's Mac mini Trial and User Acceptance section for local
   user trials.
4. Freeze the complete candidate and evidence. Independent Validator derives
   expectations from acceptance first, then verifies real paths, test integrity,
   boundaries, coverage retirement and evidence in one review.
5. Repair material findings within the same work package and revalidate the new
   candidate. Mini records engineering acceptance without repeating full review.
6. Complete required user Product Acceptance and the concentrated formal Change
   PR/required-CI/integration/archive closeout within authorized Git permissions
   in the task's agreed order. Update the cumulative capability register and full
   latest map, preserve the Change snapshot, and show scope/status delta, gaps
   and evidence under the sole policy's Blueprint Capability Coverage section.
   No new approval stage or unrelated capability revalidation. Stop at the
   delivered result.

These are work activities, not new approvals. No universal Spec Gate, TDD_READY
dispatch approval, separate retirement Gate or routine Spec/Test agent handoff.
Worker/Spec/Test support is optional and has explicit scoped ownership; the main
Agent retains continuous responsibility. Support does not become a pipeline.

## Exceptions by Work Type

Behavior additions and fixes use causal RED before implementation. Pure
refactors use pre/post GREEN and relevant equivalence checks. Documentation-only
work uses scope, consistency and evidence review; no fake RED or product UI work.
Risk-sensitive checks run before affected dangerous actions, not only at final
review. Scope/permission/resource limits and progress-based stop-loss still apply.
