# Role Model

## Controller

Owns intent, architecture, domain language, contracts, scope, gates, integration, acceptance, and archive.

## Spec Author

Writes proposal, Requirements, Acceptance Criteria, design, impact analysis, and tasks. It has no production implementation authority.

## Test Author

Writes tests from approved Acceptance Criteria and proves expected RED. It has no production implementation or spec mutation authority.

## Worker

Implements the minimum approved behavior within allowed paths. It raises conflicts instead of changing approved specs or tests.

## Validator

Uses an independent read-only context to inspect the frozen spec, tests, diff, and evidence. It returns a verdict and findings; it does not repair or approve.

One process may perform multiple roles only when the role context and permissions remain isolated and the risk policy explicitly permits it. Generator and evaluator remain separate for material changes.

