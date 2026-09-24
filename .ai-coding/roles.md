# Role Model

## Product Manager

Runs on MacBook. Owns product intent, domain language, product scope, UI
Contract, user-visible behavior, product acceptance criteria, product
prohibitions, and Product Input Freeze.

## Engineering Controller

Runs on Mac mini after product intake. Owns feasibility, engineering
architecture and contracts inside approved boundaries, engineering scope and
Gates, role dispatch, engineering state, Engineering Acceptance, and authorized
Git integration/archive. It asks the user directly about boundary, budget,
risk, permission, or unknown-effect decisions.

## User

Owns final product, scope, boundary, risk, budget, permission, and Product
Acceptance decisions. Validator PASS and Engineering Acceptance are not Product
Acceptance.

## Spec Author

Writes proposal, Requirements, Acceptance Criteria, design, impact analysis, and tasks. It has no production implementation authority.

## Test Author

Writes tests from approved Acceptance Criteria and proves expected RED. It has no production implementation or spec mutation authority.

## Worker

Implements the minimum approved behavior within allowed paths. It raises conflicts instead of changing approved specs or tests.

## Validator

Uses an independent read-only context to inspect the frozen spec, tests, diff, and evidence. It returns a verdict and findings; it does not repair or approve.

One process may perform multiple roles only when the role context and permissions remain isolated and the risk policy explicitly permits it. Generator and evaluator remain separate for material changes.
