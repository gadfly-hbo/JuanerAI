# PDCA

JuanerAI applies PDCA at the OpenSpec Change level.

## Plan

Request, Explore, Proposal, Specification, Design, Tasks, Test Plan, risk, scope, activation, rollback, and evidence level.

Completion criterion: Spec Gate PASS and a valid test design.

## Do

Test implementation, expected RED, minimum production implementation, GREEN, and bounded refactor.

Completion criterion: target behavior is GREEN without contract or scope drift.

## Check

Regression, quality checks, architecture and security checks, traceability, independent verification, and risk-based acceptance.

Completion criterion: evidence supports every required claim and exposes every exception.

## Act

Archive the Change, update the current specification, retain approved terminology or ADR decisions, record reusable learning, and create a new Change only for genuinely new work. Foundation or bootstrap Changes, and any Change that crosses the complexity stop line, require an explicit retrospective using `docs/templates/CHANGE_RETROSPECTIVE.template.md`.

Completion criterion: the repository baseline represents current behavior; reusable learning has been reviewed and applied to the appropriate specification, governance document, test asset, or template; product work and tooling debt remain separately authorized; and the next action is explicit.

PDCA does not weaken OpenSpec gates or authorize implementation before RED.

See `docs/governance/change-complexity-control.md` for Change classification, stop-line triggers, root-cause routing, and evidence closure.
