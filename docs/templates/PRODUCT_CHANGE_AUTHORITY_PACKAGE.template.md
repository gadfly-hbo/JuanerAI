# Product Change Authority Package

This pre-existing template is optional/reference-only when already selected by
the Change. Normally record the same applicable information once in existing
OpenSpec/handoff records; do not add a mandatory package or approval stage.

For the current semi-automatic path, the MacBook Product Manager freezes the
Product Input section and the Mac mini Engineering Controller fills the
Engineering Intake section. The signed sections apply only to the separately
authorized inactive Host Loop. Never place a secret, private key, credential,
signature bytes, raw prompt, or raw model output here.

## Product Input — MacBook Product Manager

- Change ID / product objective:
- Product scope / non-goals / prohibited outcomes / deferred returns:
- UI Contract version / path / SHA-256:
- User UI Gate verdict / reference:
- Business terms, semantics, defaults, visible failures and recovery:
- Product Acceptance IDs and required user verdict:
- Adopted Whitepaper/Demo sources, versions, and applicability:
- Product/data/safety/permission/cost/external-effect stop lines:
- Product Input SHA-256 / user approval reference:

## Engineering Intake — Mac mini Engineering Controller

- Receiver task / host / repository / branch / owning device:
- Current WIP, stop point, history, actual resource consumption, UNKNOWN, and evidence readback:
- Feasibility result:
- OpenSpec / design / contract / task / allowed-path plan:
- Dependency, toolchain, commands, environment, validation, and evidence plan:
- Engineering agent / independent Validator, optional specialist question, real resource limits and stop conditions:
- Published rule version / actually loaded roles / replaced old restrictions / retained stops:
- Git permissions and delivery plan:
- Intake receipt / state: `UNCONFIRMED` / `ADOPTED_STOP_RETAINED` / `READY_FOR_AUTHORIZED_EXECUTION`:

## Signed Host Loop — Retained Inactive Reference

The following original signed-package fields are retained unchanged for historical
reference only. They are not current semi-automatic requirements; this alignment
does not activate, revise or authorize the old Host Loop.

## Artifact Package

- Change ID:
- Repository / integration branch:
- Baseline / Worktree / current branch:
- Approved clickable UI Contract version / path / SHA-256:
- User UI Gate verdict / approval reference: `PASS` / `BLOCKED`
- Product objective and Acceptance IDs:
- Allowed paths (sorted, exact):
- Forbidden paths (sorted, exact):
- Dependency policy:
- Archive active / archive / canonical paths:
- Stop lines and external prerequisites:
- Bounded execution self-correction: inherit `docs/governance/product-change-execution-policy.md#bounded-execution-self-correction`, or record the explicit narrower limit; adoption reference for an already frozen batch:
- In-scope technical decisions (semi-automatic only): inherit `docs/governance/product-change-execution-policy.md#in-scope-technical-decision-authority`, or record an explicit narrower limit; approved module roots / compatibility obligations / adoption reference for an already frozen batch:
- Artifact Package SHA-256:

## D1-A Receipt

- Reviewer fresh-context receipt:
- Plan / attachments / cited authority hashes:
- Seven-part review artifact SHA-256:
- Finding classifications:
- Bounded semantic correction SHA-256 or `null`:
- Targeted readback SHA-256:
- Final disposition SHA-256:

## DISPATCH

- New Mac mini execution task required: `true`
- Saved Mac mini project / expected repository:
- New task title:
- New task or client-task ID / host ID / project ID:
- Task status: `PENDING` / `ACTIVE_READY` / `BLOCKED_SESSION_DISPATCH`
- Initial-message package branch / commit / tree / path / SHA-256:
- Delivery readback / timestamp:
- Manual fallback, if required: exact failure and user create/open-and-forward receipt
- Command ID / key ID / nonce / validity / idempotency ID:
- Exact repository, scope, Worktree, routes, and validations:
- Expected empty-pointer SHA-256:
- Receipt digest and evidence references:
- Canonical command-body SHA-256:
- Transport envelope: `{command_body_base64,signature_base64}`:

## REVISION

- Changes-requested reference and SHA-256:
- Current state version / state SHA-256:
- Frozen Candidate SHA or `null`:
- Same-scope readback:
- Kind: `IMPLEMENTATION_REPAIR` / `PR_REVISION` / `ARCHIVE_REQUIRED`:
- Canonical command-body SHA-256:

## Handoff Review

- Baseline / Candidate / tree / branch / remote / Validator / PR Heads:
- Changed paths / canonical diff SHA-256 / contract ID:
- Validation and Test Asset Retirement receipts:
- Ledger / Handoff fixed references:
- Risks / unverified / open questions:
- Controller verdict:

## RELEASE

- Acceptance / merge / archive references:
- Squash SHA / origin-main SHA / MacBook-main SHA:
- Expected state version / state SHA-256:
- Release command-body SHA-256:
- Readback: local main = origin/main = squash SHA; CLOSED; pointer cleared last:
- Final stop: `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`:
