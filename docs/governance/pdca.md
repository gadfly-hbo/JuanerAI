# PDCA

JuanerAI applies PDCA within the continuous OpenSpec engineering loop under
`product-change-execution-policy.md`. These are activities, not extra stages or approvals.

## Plan

Clarify the approved result and the next behavior's minimum specification,
necessary design, scope, risks and verification; use existing Change records.

Completion criterion: the behavior, boundaries and applicable verification are
clear under the sole policy; no separate Spec Gate is required.

## Do

Apply the sole policy's Continuous SDD and TDD behavior/evidence rules: minimum
implementation, early real-path feedback, affected tests and bounded refactor.

Completion criterion: target behavior is GREEN without contract or scope drift.

## Check

Daily work uses affected checks. Concentrate applicable regression, quality,
architecture/security checks, traceability and independent verification at
complete-result closeout under the sole policy.

Completion criterion: evidence supports every required claim and exposes every exception.

## Act

Complete authorized archive, update the current behavior specification, retain
approved terminology/ADR decisions, and record material reusable learning in
existing records. Use `docs/templates/CHANGE_RETROSPECTIVE.template.md` when a substantive incident
or lesson warrants it, not every correction. New work requires its own authority.

Completion criterion: the repository baseline represents current behavior; reusable learning has been reviewed and applied to the appropriate specification, governance document, test asset, or template; product work and tooling debt remain separately authorized; and the next action is explicit.

PDCA does not weaken approved behavior or safety boundaries. Evidence and causal
ordering follow the sole policy, including its unchanged rules for other work.

See `docs/governance/change-complexity-control.md` for Change classification, stop-line triggers, root-cause routing, and evidence closure.
