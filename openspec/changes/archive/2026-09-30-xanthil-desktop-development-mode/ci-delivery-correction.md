# Bounded CI delivery correction

Owner: Mac mini Engineering Controller, 2026-09-30. Same supplement and PR48.
The user's Git/integration/archive permission remains applicable; this is an
ordinary delivery-tool correction, not new product scope or dependency authority.

The first [cloud run](https://github.com/gadfly-hbo/JuanerAI/actions/runs/36723488394)
failed before dependency installation: prepare-ci-install.mjs still pinned the
old package.json identity (1350 bytes, 5f986663...). The approved development
scripts already changed that manifest to 1539 bytes, SHA-256
`db19b12f4b3822f11b7567bf87d06347b64a5aca1767f41c6d3753e74bf2dacd`.
The failure remains in R/controller/ci-36723488394.log.

Controller scoped the same Worker to prepare-ci-install.mjs and its existing test.
The production correction changes only the manifest byte-count/hash literal.
Strict lock/archive/source-member/transport/receipt checks are preserved; no
runtime selector, dynamic acceptance or fallback was added. Tests additionally
reject same-size and added-byte manifest/lock changes before view creation,
post-prepare source mutations, changed view manifest and wrong receipt invocation.
The successful finalize receipt is bound to exact source identities. Original
negative assertions remain. Package, lock, dependency set and CI workflow are
unchanged, as are all reviewed Desktop product/test files.

Worker candidate aggregate:
`be168d490dea8dd0f7f6eb1535f21bb2f0cd13229270e79a110a76265a242ed0`.
R/engineering/ci-correction-001 contains manifest, source copies, commands, raw
outputs/exits, causal red-002 and green-001: **27 PASS / 0 FAIL / 0 SKIP**.
The existing approved node-gyp archive was copied/read back locally; no download
or installation. Full prepare/finalize uses synthetic npm-normalized member
fixtures and does not claim an actual dependency install or remote CI success.
Controller read back the two fixed source copies before independent review.

R = `/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-development-mode`,
owned and available on Mac mini. Independent correction verdict is PASS at
R/validator-ci-001/report.md and independent-verification-ci.md. It checked 58 file
identities and five baseline attributions, exact patch identity and memory-based
positive/negative identity checks. Its one Node26 focused test run returned
2 PASS / 8 FAIL because the read-only sandbox refused mkdtemp under /tmp; those
fixture paths were not independently executed. It relied on the bound full author
27/27 execution and independent source/memory checks, without retry/escalation or
claiming an independent full run. Remote CI and merge remain pending. Earlier freeze-004 product/native PASS and archive consistency
PASS retain their stated evidence scope. No full product rerun or new DMG is needed
for a CI manifest-literal update. No MacBook or Host Loop action.
