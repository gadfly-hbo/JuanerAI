# Engineering decision 002 — bounded verification execution

Owner: Mac mini Engineering Controller. This records validation mechanics within
the existing intake permissions; it grants no credential access or risk waiver.

The default `tools/harness/validation/run` full entry includes the test named
`PS-01–05 real Keychain through normal packaged settings: test/save/reopen/replace/delete and exact fixed probe`
in `tests/e2e/xanthil-desktop/provider-settings-native.e2e.test.ts`. That case
inspects and mutates the real Keychain through the production helper. Intake
forbids real Keychain access; the engineering package omits that helper.

Continue all authorized verification rather than running the prohibited case.
Reuse the canonical portable entry and execute every remaining full-entry
package/native check against the current frozen engineering package, with the
same test inputs and assertions. The host runner may use an exact, anchored
test-name exclusion for this one case and must record its full name and reason
as NOT RUN (permission), separate from existing real-model gating. Preserve the
test, assertions and canonical runner unchanged. Do not omit another test by
inference, replace a real boundary with a passing stub, or count the excluded
case as passed. Existing synthetic OS/Pi transport seams are permitted for the
other tests within their stated evidence limits.

Call this the authorized offline/native matrix, never full canonical PASS.
If another check requires a prohibited effect, stop that check and return its
exact effects and required inputs; continue independent authorized work.
Record commands, frozen identities, all outputs/exits, test accounting and
the missing full-command obligation in verification and HANDOFF_BACK.

After all authorized implementation and checks finish, freeze the complete code
candidate with this explicit evidence limitation for independent review. The
Validator must evaluate the candidate and available evidence, report other
material findings, and retain the full-command obligation as unresolved. This
decision does not grant Engineering Acceptance, user Product Acceptance, Git
delivery or archive. Any necessary permission or residual-risk decision goes
to the user only after the result and remaining verification are concrete.
