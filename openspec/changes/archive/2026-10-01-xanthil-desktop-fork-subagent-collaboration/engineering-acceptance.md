# Change003 Engineering Acceptance — fixed composite candidate

Owner: Mac mini Engineering Controller. Recorded: 2026-10-01T06:07:03.879855+00:00.
State: **ENGINEERING_ACCEPT — PASS; AWAITING_USER_PRODUCT_ACCEPTANCE**.

This is the current engineering conclusion. Earlier candidate003 verification/HANDOFF_BACK and task entries naming F6 NOT RUN(permission) are preserved historical records; decision004 and this acceptance supersede only that current-status claim. Engineering Acceptance is distinct from completed archive, user Product/UI Acceptance, Git integration, installation and release.

## Fixed scope and identity

Branch: `work/mac-mini/change-003-fork-subagent`.
Base commit: `5a8fe7b38ebdb1c2a8d49dcb5bdc5fa9d4bc3041`.
Base tree: `e5c40042ff5d75606afa208ba4b8ac8b9d4cac50`.
Mac mini persistent evidence root: `/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-fork-subagent-collaboration`.

- Production and approved behavior: `worker/author-candidate-003/manifest.json`, SHA-256 `04eb3655b40b6674ae65e58e944a24cafbdaee9e7d9bccb3d5a37debbce08911`.
- Exact one-file test correction and helper-enabled verification package: `worker/keychain-supplement-002/manifest.json`, SHA-256 `140ef5e45d61fde9d3b6cc1e20e298ccfad214ee374b4255e5168e998a72da8d`.
- Retained helper-build supplement001: SHA-256 `fdb87ed8c6d6c4595dfa1e203a0ac7217adf8453708eaf10d7cbe212f1e3070a`.
- Corrected native test SHA-256: `db9ee378be0abbdc27c77a65be299412fd853b88328fc6333d4d9416dee30ee1`.
- Application ASAR remains `e4ff0e58fb57ca4f30c6ead79f0b5574a12bf298505714d86d840ec1a0dd99c9`; no production source change in this supplement.
- Full host002 raw manifest: `controller/keychain-full-host-002/readback-manifest.json`, SHA-256 `7b3d3c7f3281cfaa7cce0ca3a07d6593644ab4ecda2e4cecf0d8430ba769d102`.
- Independent final review: `controller/validator-review-004/last-message.txt`, SHA-256 `2f48701b31fab88ed45c57435b04d1c357ec9a6e8ea9c33bcb9e9f26fa182ff6`.

## Controller acceptance basis

Approved frozen product/UI input, confirmed intake, behavior specifications, causal RED/GREEN, regression, traceability, scope/security/architecture and test-retirement review are bound by candidate003 and review003. F1–F5 were independently closed. Decision004 records the user's explicit “授权” to the concrete Keychain/full-validation proposal. No product scope or real Provider permission was inferred.

Complete default `tools/harness/validation/run`, without arguments or test exclusions, exited 0: **2305 PASS, 0 FAIL, 1 existing real-model-gate skip**; native **73/73 PASS**. The single skip is retained by the unchanged offline runner, which removes the real-model gate. Existing daily regression additionally recorded 2241 PASS/0 FAIL/1 gated skip in the prior fixed candidate. These counts describe different commands and are not summed.

The unchanged PS-01–05 real Keychain settings case passed using synthetic credentials and offline installed-SDK transport. The fixed application item was absent before and after. No existing credential was read, replaced or deleted. The helper-enabled package was isolated and not installed; complete package comparison shows only helper and signature changes, unchanged ASAR and unchanged executable content outside its signature. Producer006 copy lineage is explicit and does not claim a new Forge build.

Host001 initially failed solely because the collaboration test still required a helper-absent package. The authorized package legitimately includes the helper. The corrected test preserves that original default branch and adds an exact helper identity/presence-only absent guard for this authorized host environment. Main must remain unconfigured before and after; all business, sender authority and no-implicit-model assertions remain. No test was deleted. Author sensitivity checks: 11/11; independent read-only positive/negative checks: 13/13. Host002 proves the actual native path after this correction.

Controller and Validator independently verified all 9010 host002 evidence entries. All 75 captured native processes exited; no residual process or forced cleanup, no source/package drift. Readback: `controller/keychain-host002-readback.json`. Validator actual configuration: gpt-6-astra/high/read-only/never, separately attested; author remained gpt-6-astra/high/workspace-write/never. Final independent verdict **PASS**, F6 closed, no remaining material findings or new advisory. This Controller separately records Engineering Acceptance against the fixed composite above.

## Preserved limits and next action

Historical candidate001/002 and host001 failures remain unchanged. The older U2 cancellation marker timeout has unknown cause and was independently classified as nonblocking after subsequent unchanged-test passes; this record does not invent a cause or relabel it.

User Product/UI Acceptance remains pending. No Git commit, push, PR, merge, archive, dependency installation, installed-app modification, production business-data access, actual Provider/model call or release occurred in this verification. Development files and this acceptance remain local uncommitted work; they are not yet integrated preserved assets or a cross-device backup. The accessible evidence root is on Mac mini; MacBook receipt is not claimed.

Exact return point: user evaluates the approved Fork/Subagent product/UI acceptance surface for this fixed composite. Then perform only separately authorized Git delivery/integration and applicable archive. Do not repeat completed verification absent a changed candidate, new failure or relevant unresolved concern.
