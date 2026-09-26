# Test Asset Retirement

For adopted continuous engineering under `product-change-execution-policy.md`,
review changed tests, fixtures, helpers, doubles, mocks, snapshots, coverage maps
and harness code within development and independent verification. This is not a
separate Gate, Spec/Test handoff, compulsory lifecycle ledger or repository-wide
cleanup project. Historical retirement verdicts and evidence remain preserved.

## Preserve the Evidence Purpose

A passing or old test is not a deletion signal. Retain coverage for every current
acceptance, contract, regression, boundary, failure and forbidden side effect.
Causal RED normally becomes permanent regression coverage after GREEN.

For each material test change/removal, explain its purpose and retained coverage
in existing diff/verification references. Unchanged assets need no new inventory.
A removal is justified only when:

- a retained test covers the same behavior and material failure/mutation;
- an updated authorized consumer no longer needs that fixture/helper; or
- the asset is a diagnostic-only probe outside accepted coverage with no
  retained consumer.

Age, coverage percentage, passing status or a filename is insufficient proof.
Absence-of-retired-path tests remain useful when that absence is an approved
contract. The engineering agent owns authorized corrections and runs affected
tests/regression; it does not weaken assertions to make retirement pass.

## Temporary Material

Disposable probes may use temporary storage. Inputs/output needed for acceptance,
resumption or historical attribution follow AGENTS.md's persistent-evidence rule,
not a blanket temporary-directory default. Preserve failed evidence and source
binding; do not erase history as cleanup.

Keep diagnostic clutter out of permanent regression where its purpose has ended.
Inspect skip/todo/only, scratch markers, obsolete formats and equivalent cases
as signals, not automatic deletion or failure rules. Different boundaries,
failure modes or mutation sensitivity can justify similar-looking tests.

## One Independent Review

Validator reviews the full changed test surface and its evidence with the
candidate. Check that assertions/negative cases remain meaningful, removed
coverage has a successor or sound diagnostic-only justification, helpers retain
consumers, and tests still exercise the actual behavior. Use focused counterexamples
or safe authorized probes when sensitivity is uncertain.

Missing required coverage, weakened assertions, hidden skipped behavior, unsafe
data or materially false evidence block the affected claim. Duplicate/unused
assets or format tidying are advisory unless their concrete impact meets the
sole policy's blocking criteria. State the actual impact, not merely a missing
ledger or retirement PASS. Necessary repairs return to the same engineering
agent, then the affected new candidate is independently rechecked.

No automatic deletion, tombstone registry, mandatory extra skill run, background
scan or tool framework is authorized here.
