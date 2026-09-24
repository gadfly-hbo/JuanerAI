# Product Change Authority Package

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
- Current WIP, stop point, history, consumed budgets, UNKNOWN, and evidence readback:
- Feasibility result:
- OpenSpec / design / contract / task / allowed-path plan:
- Dependency, toolchain, commands, environment, validation, and evidence plan:
- Role sequence, budgets, correction limits, and stop lines:
- Git permissions and delivery plan:
- Intake receipt / state: `UNCONFIRMED` / `ADOPTED_STOP_RETAINED` / `READY_FOR_AUTHORIZED_EXECUTION`:

## Signed Host Loop Artifact Package — Inactive Unless Separately Authorized

- Change ID:
- Repository / integration branch:
- Baseline / Worktree / current branch:
- Product objective and Acceptance IDs:
- Allowed paths (sorted, exact):
- Forbidden paths (sorted, exact):
- Dependency policy:
- Archive active / archive / canonical paths:
- Stop lines and external prerequisites:
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
- Legacy signed-authority verdict:

## RELEASE

- Acceptance / merge / archive references:
- Squash SHA / origin-main SHA / MacBook-main SHA:
- Expected state version / state SHA-256:
- Release command-body SHA-256:
- Readback: local main = origin/main = squash SHA; CLOSED; pointer cleared last:
- Final stop: `ACTIVATION_READY_AWAITING_FIRST_PRODUCT_CHANGE_AUTHORIZATION`:
