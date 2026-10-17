# MacBook XLSX package-root compatibility repair

## Scope and acceptance

User report 2026-10-17: selected XLSX is rejected with SOURCE_ARCHIVE_INVALID before source registration. Existing authority: `../xanthil-browser-multisource-membership-analysis/spec.md` BF-R04/08/13 and SC02/CAP04, ordinary value-cell XLSX extraction with immutable originals and no implicit model dispatch.

XLSX-ROOT-01: a worksheet relationship targeting `/xl/worksheets/sheet1.xml` resolves inside the ZIP package and yields exactly the same sheet/cell evidence as `worksheets/sheet1.xml`. This is not an OS absolute path. Microsoft OPC reference: https://learn.microsoft.com/en-us/dotnet/api/system.io.packaging.package.createrelationship

XLSX-ROOT-02: external relationships, network/URI targets, traversal, malformed/noncanonical paths and missing ZIP members remain rejected. All existing formula, macro, XML, archive and capacity checks remain unchanged. No filesystem extraction or network access is introduced.

Allowed: `adapters/analytics-duckdb/member-source-inspection.ts`, new focused integration test, this repair record. Forbidden: provider/model behavior, user workbook changes, UI redesign, Mini worktree changes, unrelated project-selection bug, Git publication without authorization.

## Reproduction and evidence

MacBook runtime: `/Users/huangbo/JuanerAI-browser-current`, source a0b6491ddc4700fef881317f44f2c51c699d8f9c. Real input SHA-256 c1cdbc26e6b6166371b8458aa8e2ba21e9ccc19c082eac0deeb8ad12d14beb6b, 26576 bytes. Original read-only call to the actual `inspectSources` returned SOURCE_ARCHIVE_INVALID; ZIP integrity passed. Four worksheet relationships use package-root paths. No user content enters Git/tests. No Provider calls authorized or performed.

Evidence root (MacBook): `/Users/huangbo/JuanerAI-artifacts/xlsx-package-root-repair-20261017`. Mini active engineering state is not adopted or modified; overlap is not independently established. Repair remains isolated and unpublished.

## Verification and fixed candidate

- Causal RED: `red.log`, 17 checks, 6 reported failures including the positive package-root case. Four unsafe variants were already rejected but with SOURCE_UNREADABLE rather than the explicit SOURCE_ARCHIVE_INVALID classification. No assertion was weakened. Original-input RED is separately retained in `original-red.json`.
- Minimal implementation resolves a single package-root slash into a ZIP member name only, checks canonical member existence, and retains all prior checks. No archive member is written to disk. URI punctuation, network paths and empty targets are explicitly invalid.
- GREEN: `green.log`, 17/17. Test setup then switched to the existing observed-version toolchain fixture rather than a fixed version string; behavior assertions unchanged.
- Affected regression: `regression.log`, 44/44, zero skips. Command: `JUANERAI_TOOLCHAIN_BIN=<local toolchain bin> JUANERAI_TEST_EVIDENCE_DIR=<evidence>/regression node --test tests/integration/xanthil-desktop/xlsx-package-root.integration.test.ts tests/integration/xanthil-desktop/browser-preparation.integration.test.ts`. Covers extraction, shared strings/dates, corrupt/formula/external/XML cases, capacity, qualification and existing preparation boundaries. No existing test removed or altered. No new dependencies or TypeScript interfaces; Node executes affected TS modules directly; full repository type/build and hosted CI NOT_RUN.
- Original unchanged input: `original-candidate.json`, PASS, four sheets with 164/162/159/163 rows and 492/486/477/489 cells. Probe prints counts/hashes only. SHA remains c1cdbc26e6b6166371b8458aa8e2ba21e9ccc19c082eac0deeb8ad12d14beb6b. This is actual extractor evidence, not model analysis or live task-registration evidence.
- Fixed implementation SHA-256: `2c7c8f9e560f47c79f22660dbcac6e4da7d7f2a130921d8d1cb0796456ff192e`; test SHA-256: `624a1a134901f5af34fc01bcaa8f30e0d7262cc4fcb4770233fb8d0ed1cb5656`. Base a0b6491ddc4700fef881317f44f2c51c699d8f9c; branch `work/macbook/xlsx-package-root-repair`; candidate consists of these two files plus this record. No commit/push requested or performed.

## Return point

Independent repair-scoped fixed-candidate validation pending, then install the verified local repair in the designated MacBook trial runtime and check byte identity/readback. No full Change closure, Mini adoption, Product Acceptance or model outcome claim. The separate project-selection UI defect remains outside this repair.

## Publication addendum (2026-10-17)

The preceding sections preserve the initial local-trial snapshot. The user subsequently explicitly authorized committing, merging to GitHub and synchronizing Mac mini. Publication covers this bounded repair only, not Mini's active Change acceptance or service adoption.

- Local trial completed: `validator-first.json` retains a procedural BLOCKED result (acceptance-first reading order); fresh acceptance-first `validator-final.json` records independent PASS for the fixed parser/test. `deployed-original.json` and `deployment.json` retain successful MacBook extractor and deployed-byte readback. Browser upload automation and model outcome remain unverified.
- Formal validation first attempt: `portable.log`, exit 1. System Python 3.9 lacks the TOML standard library required by configuration checks; additionally the new regression file was absent from the explicit harness fixture inventory. Neither failure is product RED or waived. The invocation stopped in validation-contracts before product checks.
- Necessary publication correction: add only the new regression filename to `tools/harness/validation/run.test.mjs`'s fixed inventory. This fourth allowed path preserves all existing entries, assertions and negative cases; no runner, CI workflow, threshold or dependency changes. Reuse installed Python 3.12.14 through a command-local toolchain, with pinned Node 26.0.0, npm 11.12.1 and DuckDB 1.5.2. Dependencies copied from the designated local deployment with identical lockfile, isolated from its live runtime.
- Receiving device preflight: Mini main equals the pinned base; its active decision-platform worktree has no parser diff or parser commits beyond main. Other Mini work remains untouched. Safe synchronization will update main only, never switch active branches or restart services.
- Return point: complete canonical portable regression, fresh independent four-file review, exact-head hosted CI, squash merge and main synchronization. Full Desktop packaging/native GUI, Provider invocation and Mini task adoption are not claimed.

### Formal repair verification receipt

- `portable-final.log` preserves a second invocation failure: five Desktop unit cases could not create their fixture directories because the caller omitted the evidence-root directory. After creating that directory, `portable-confirmed.log` passed syntax, strict typecheck and every preceding suite, including Desktop unit 404/404 and Desktop contract 725/725. The complete final integration group ran 1675 checks: 1654 passed, 20 explicitly skipped, one failed; overall command exit 1 is retained, not relabeled PASS.
- The remaining failure was unrelated RS-PROFILE-01: its fixture copies `process.execPath`. A copied Homebrew Node 26 binary aborts before JavaScript because `@rpath/libnode.147.dylib` is missing (independent `homebrew-copy-probe/result.log`, exit 134). Re-running the entire unchanged Report Studio profile file with the already installed standalone Node 26.0.0 passed 6/6, zero skips (`report-studio-standalone.log`, exit 0). This closes the affected host-toolchain failure without modifying product/tests. Valid passed groups are reused; the local aggregate remains historically failed. Exact-head GitHub canonical portable CI must pass in full before merge, not be substituted by the focused rerun.
- Fresh independent `xlsx_publication_validator`: PASS for the four-file candidate, acceptance-first; independently constructed in-memory ZIPs verify rooted/relative equivalence, hidden/Chinese/numeric/location preservation, unchanged input hashes, old-parser failure sensitivity, 16 unsafe variants plus external/formula/XML/cancellation rejection. Permanent focused suite 17/17; actual inventory test 1/1. No assertion or existing test removed. Receipt: `validator-publication.json`. At review, complete portable was still running and hosted CI was NOT_RUN; neither was waived.
- Repair-scoped Engineering Acceptance: the bounded extractor correction satisfies XLSX-ROOT-01/02, with independent evidence and the explained host-toolchain correction. Publication remains gated on exact-head hosted full portable CI and final diff/base readback. Existing UI/spec input is reused; this internal parser repair changes no UI/build entry, so native packaging/GUI is inapplicable to this repair claim, not accepted by portable evidence. No parent Change archive, Product Acceptance, live browser upload or model-result claim.
- Handoff owner: MacBook; source branch `work/macbook/xlsx-package-root-repair`; evidence root above is MacBook-local and not independently copied to Mini. Git carries the complete source, synthetic regression and this record; receiving-task adoption remains UNCONFIRMED. Authorized merge and safe main synchronization do not restart Mini work. The PR supplies immutable commit/CI/merge identities after publication; any failed CI blocks merge.
