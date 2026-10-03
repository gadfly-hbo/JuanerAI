# Minimum engineering specification

## CI-CHECK-001 — One executable check inventory

Input: full/default or portable canonical invocation with the approved toolchain.
Output: applicable validation-tool contracts before repository
syntax, typecheck and expensive product suites. Any contract failure preserves
its numeric exit and prevents later suites. Contract fixtures invoke a copied
runner with inert child commands, never recursively execute the actual suite.
Inherited real-provider gates are removed before every child. Preserve existing
dependency trust pins and independent negative inventory tests; derive redundant
counts from the independently approved inventory, not the configuration under test.
Manifest/lock identity and rejection checks always run without network inputs.
The two cloud archive/member proofs run when the explicit pinned archive is
supplied; its absence locally reports `NOT RUN`, while absence in GitHub Actions
or any supplied invalid archive fails. No new local download prerequisite.

## CI-SCOPE-002 — Conservative CI path selection

Input: GitHub-provided base commit and checked-out PR merge commit. Only added or
modified regular, non-executable Markdown in explicitly enumerated documentation
and instruction locations qualifies for focused checks: root `README.md`,
`AGENTS.md`, `CONTEXT.md`, `Orchestration.md`, and Markdown under
`docs/governance/` or `.ai-coding/`. Planning/frozen-contract Markdown stays full.
Mixed/unknown paths,
product/runtime/schema/dependency/test/tool/workflow changes, rename/copy/delete
or type/mode changes require full portable regression. Missing base, Git or
classifier errors fail the required Canonical validation job; they never become
a documentation success. Classification executes the base revision's classifier
when available; its initial introduction uses full regression. PR environment
switches cannot request focused mode. Focused checks verify the actual diff and
applicable tooling contracts without dependency installation or product suites.

## CI-LOG-003 — Live feedback and exact failure

Input: each sequential validation group and existing bounded CI command. Output:
native stdout/stderr while running, then group duration and exact exit status.
CI retains exclusive separate stream files and reports them without buffering
until completion. Failure stops later work. Keep the 20-minute job cap and
1080-second portable/180-second other command limits; no automatic retries or
blanket timeout increases. Portable output explicitly excludes native packaging,
GUI and installed-artifact acceptance.

## CI-PRIVACY-004 — Collision-safe privacy oracle

Inputs include legitimate opaque UUID identifiers and distinctive synthetic row
values. Legitimate identifiers must not cause privacy failure merely because
they contain a short numeric substring. Injected forbidden row-level data must
still fail. Preserve the existing privacy and boundary assertions.

## CI-PERF-005 — Test efficiency with isolation

Repeated fixtures may reuse immutable synthetic seed construction, with fresh
writable copies per test. Before/after real fixture measurements must bind code,
commands and outputs. Mutation, corruption and cross-fixture tests must remain
effective; production database verification and test assertions are not removed.

An oversized integration file may be mechanically partitioned into independent
files under the existing Node test runner. Preserve every original case name,
assertion, negative input and required from-scratch path; shared fixture support
must not register tests when imported. Keep the existing runner concurrency and
timeouts, with fresh per-process state and per-test writable roots. Update the
independent file inventory and typecheck roots explicitly. Compare the same
cases before/after; the full portable run, not a projected saving, closes CI.
Record actual runtime/toolchain and available CPU parallelism in the existing CI
log to distinguish execution environment from source changes; do not dump the
environment or add a telemetry service. A checkpoint containing a live expiring
grant is not an immutable reusable seed.

Contract decision: these are internal engineering/test interfaces within the
approved workflow repair; no product, persistent business or permission contract
changes. The focused CI result is explicitly narrower than product regression.
