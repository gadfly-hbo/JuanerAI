# Desktop development mode completed — 2026-09-30

The bounded DEV-01–07 engineering supplement is implemented, independently
verified, accepted by Mini Engineering Controller and archived. User authorization
covered Git delivery/integration/archive and only the package.json/tsconfig.json
graph-node exception. DMG011's existing product acceptance is preserved; this
supplement is not a new product or installed-release acceptance.

[PR #48](https://github.com/gadfly-hbo/JuanerAI/pull/48) was squash-merged at 2026-09-30T13:56:36Z:

- Merge commit: `ef145f909b0695b6f56787e9f5709cb45545b57a`.
- Tree: `ee1fc9a0eb4157bf586ea665ec058f73e10372cc`.
- Reviewed head: `6b15bb7c7240a3299bac4a34e22a3e5870fa6d5d`; merged tree is identical.
- [Canonical cloud validation](https://github.com/gadfly-hbo/JuanerAI/actions/runs/36724939352) PASS. Initial failed run36723488394
  and its precisely scoped CI correction remain preserved. No guard was weakened.
- Local main was fast-forwarded to that merge and independently read back clean.
  Local work branch is retained; GitHub automatically deleted its remote branch.

Actual native development verification passed three HMR states (unsaved draft,
submitted response pending, completed report), preserving Main/document/session
and form/busy state without duplicate analysis. The formal backend completed
SQLite/DuckDB/Python calculation, draft v1/final v2, export and durable reopen.
Local portable/daily verification: 2192 tests, 2191 PASS / 1 existing real-model
SKIP / 0 FAIL; typecheck PASS. Independent product/native/archival verification
PASS. CI correction: author27/27 PASS, independent identity/source/memory PASS;
its tmpdir fixture execution was sandbox-blocked and is explicitly limited in
independent-verification-ci.md. Cloud then passed the full actual CI workflow.

Start with [the development guide](../../../../tools/desktop/DEVELOPMENT.md):
configure the approved local toolchain and isolated development root once, then
run `npm run desktop:start`. Ctrl-C stops owned processes; rerun the command to
restart Main/Preload. Renderer safe component/CSS edits use HMR. `npm test` and
`npm run desktop:test` no longer implicitly package.

The only standing-rule changes are the existing sole execution policy, testing
policy and deployment-profile documentation: fixed-code business acceptance is
separate from installed-artifact acceptance; multiple accepted Changes may share
one stable DMG; affected package/resource/runtime/signature/install checks remain
mapped and binding. No new stage, approval chain or state store.

DMG011 remains 232097609 bytes, SHA-256
`32ee23123e5d443c9558614d9645897e9c9eb2d93c10bcbe6ec43e736f450b57`;
45 frozen repository inputs are unchanged. Development uses separate data/cache/
Projects/Keychain authority. A real native chooser refused an external synthetic
Project whose files stayed unchanged. No installed Xanthil app was present in
Mini preflight; no historical business Project or MacBook was inspected. Thus
historical real-project byte equality, manual installation/LaunchServices, final
whole-release bundle and MacBook verification are not claimed. The earlier
engineering package supports only its recorded Main/Preload/security/resources/
signature scope; no new DMG was produced. No real Provider call or production key,
local dependency installation, installed-app overwrite or old Host Loop operation.

Raw evidence is owned by Mini at
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-development-mode` (R).
Accessible merge readback: R/controller/integration-receipt.json; successful cloud
log: R/controller/ci-36724939352.log. Author freeze004, independent/native probe
failures and CI-correction records retain their original identities. Three
cosmetic whitespace advisories in the initial commit were preserved with the
reviewed payload; R/controller/commit-scope-readback.json records the shell check
and exact committed-blob verification, without rewriting history.

Historical tasks/handoff/ARCHIVE/acceptance pending-delivery text records its
original point in time; this completion supersedes it. This completion and board
update are a metadata-only follow-up to the verified PR48 merge. No next product
work, MacBook configuration, model invocation or new release starts automatically.
