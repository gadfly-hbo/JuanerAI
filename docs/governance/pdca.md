# PDCA

JuanerAI applies PDCA within the continuous OpenSpec engineering loop under
`product-change-execution-policy.md`. These are activities, not extra stages or approvals.

## Plan

Clarify the approved result and the next behavior's minimum specification,
necessary design, scope, risks and verification; use existing Change records.

Completion criterion: the behavior and necessary boundaries are clear enough to
write its causal test; no separate Spec Gate is required.

## Do

Test implementation, expected RED, minimum production implementation, GREEN, and bounded refactor.

Completion criterion: target behavior is GREEN without contract or scope drift.

## Check

Regression, quality checks, architecture and security checks, traceability, independent verification, and risk-based acceptance.

Completion criterion: evidence supports every required claim and exposes every exception.

## Act

Complete authorized archive, update the current behavior specification, retain
approved terminology/ADR decisions, and record material reusable learning in
existing records. Use `docs/templates/CHANGE_RETROSPECTIVE.template.md` when a substantive incident
or lesson warrants it, not every correction. New work requires its own authority.

Completion criterion: the repository baseline represents current behavior; reusable learning has been reviewed and applied to the appropriate specification, governance document, test asset, or template; product work and tooling debt remain separately authorized; and the next action is explicit.

PDCA does not weaken approved behavior, verification or safety boundaries, or
authorize behavior implementation before causal RED.

See `docs/governance/change-complexity-control.md` for Change classification, stop-line triggers, root-cause routing, and evidence closure.
