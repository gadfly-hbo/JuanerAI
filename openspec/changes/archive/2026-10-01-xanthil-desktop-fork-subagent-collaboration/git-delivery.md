# Change003 Git delivery and archive receipt

Date: 2026-10-01. Owner: Mac mini Engineering Controller. This receipt supersedes
the earlier pending Git-delivery statements; their historical evidence remains.

The user approved Product/UI Acceptance and then explicitly authorized Git
delivery and archive. [PR #51](https://github.com/gadfly-hbo/JuanerAI/pull/51)
was squash merged at `2026-10-01T07:09:38Z`:

- Reviewed branch head: `270dede6cca6241d43b964ede41e43e44d27cf04`.
- Integration commit: `2cad5cd11480e8221ac2b1a554562a70bdc7a16b`.
- Identical candidate and integration tree:
  `c9cd9a2bd7c917dca6453cfb6a92f0203da9563f`.
- Source branch: `work/mac-mini/change-003-fork-subagent`; the local branch is
  retained. GitHub deleted its merged remote branch.
- Local `main` was fast-forwarded to the integration commit and verified clean.
  The receipt and final board status are preserved through a separate normal
  work-branch PR; no direct edits or commits were made on `main`.

## Acceptance and validation

[Engineering Acceptance](engineering-acceptance.md) and explicit
[Product/UI Acceptance](product-acceptance.md) remain separate decisions.
The accepted default local canonical result is 2305 PASS, zero failures and one
existing real-model-gate skip, including 73/73 native tests. Independent feature
review004 and archive review001 passed.

The first hosted CI run failed on a stale test oracle expecting100 roots instead
of the approved104. The bounded correction retained independent exact literals
and all existing negatives, adding12 per-root mutation checks. Independent
delivery review002 passed with18 independently exercised negative cases and783
unchanged out-of-scope files. The actual local CI contract suite passed27/27.

[Hosted CI run36828295533](https://github.com/gadfly-hbo/JuanerAI/actions/runs/36828295533)
passed on the exact reviewed head, including CI contracts and portable canonical
validation. Hosted portable CI does not replace the separate local native result.
All historical failed runs and the prior unexplained U2 timeout remain retained.

The full graph check initially omitted `tsconfig.json`. The user explicitly
approved a one-file exception using exact diff, JSON, hash and completed full
verification. No other graph requirement was waived. The subsequent six-file CI
correction passed a fresh isolated full-index identity/path check; the stale
reused-project result was rejected and preserved.

## Preservation and return point

The accepted specification, implementation, permanent tests, decisions and
acceptance records are integrated through PR51. This archive and the published
[Case collaboration specification](../../../specs/case-collaboration/spec.md)
are the canonical repository records.

Persistent evidence belongs to Mac mini at
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-fork-subagent-collaboration`:

- `controller/git-delivery-002/integration-readback.json`: matching tree and clean
  main readback; adjacent CI logs, fixed fingerprints and full-index evidence.
- `controller/validator-delivery-002/last-message.txt`: independent CI delta PASS.
- `worker/delivery-ci-001/manifest.json`: SHA256
  `2efcca082e52bdc833a6f78f7808a0fff451ca21ec30fa7ddd3863ade61c109d`.
- `controller/closeout-001/`: final receipt validation and Git closeout readbacks.
- Prior accepted candidate/native evidence locators remain in
  [completion](completion.md) and [verification](verification.md).

Receiver: the user in the original Change003 session. Evidence files were read
back on this Mac mini; another device has not acknowledged a copy. Local evidence
persistence is not a cross-device backup. A receiving MacBook must use the normal
clean fast-forward and identity readback before relying on its local snapshot.

Change003 has no remaining product or engineering blocker. Next action is to
preserve this closeout record, then await separately approved product input for
the next Change. This delivery does not claim installation, release or real
Provider/model quality acceptance, and does not authorize another Change.
