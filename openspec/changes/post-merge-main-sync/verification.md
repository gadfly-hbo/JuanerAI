# Verification

## Evidence location and status

Owning device: MacBook. Persistent task evidence:
`/Users/huangbo/JuanerAI-artifacts/post-merge-main-sync-20261002`.
This is a device-local location, not a claim of cross-device backup or adoption.

- `initial-red-sync-main.sh`, `initial-red-sync-main.test.mjs`, `initial-red.log`:
  public command with real healthy Git fixtures fails AC1 because synchronization
  is explicitly unimplemented (exit 1; 1 failing test).
- `idempotence-red.log`: later added AC4 fails because an already-current
  checked-out main incorrectly demanded idle permission (exit 1; 1 failing test).

First-candidate author command `node --test tools/harness/git/sync-main.test.mjs` exited 0:
15 tests passed, 0 failed/skipped. Raw output: `author-green.log`.
`sh -n tools/harness/git/sync-main`, `node --check` on its test and
`git diff --check` also exited 0. Author source snapshots are preserved as
`author-sync-main.sh` and `author-sync-main.test.mjs` in that evidence directory.

| First candidate file | Bytes | SHA-256 |
| --- | ---: | --- |
| `tools/harness/git/sync-main` | 8667 | `3f4f2fca4d1e0d9a84de8bce58bdbb387f118997db4b858393b9d910285e7b05` |
| `tools/harness/git/sync-main.test.mjs` | 14241 | `5705a37bc475110fb8223ef33f5924b26b119269c5df4906aae4a5ecc9cf5b2a` |

## Independent review and correction

The first frozen candidate independently passed 15 tests, but review returned
`NEEDS_FIX`: an allowed local main update could replace the running script before
SSH opened it, resulting in exit 0 with a stale peer main. The original candidate,
exact reproduction and false-success output remain in
`independent-first-candidate-probe/`; `independent-review-test.log` preserves the
first suite run. Passing tests did not override the finding.

The correction snapshots source bytes in memory before updates, including
trailing newlines, and streams that snapshot. The failure is now a permanent
public-command regression; its causal RED is retained in
`source-snapshot-false-success-red.log`. No assertion was weakened or test retired.

Final frozen identities:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `tools/harness/git/sync-main` | 8962 | `5f86aac14eacef4417b041b16fec5739aedca70e569dfa216ef635a2f59e4414` |
| `tools/harness/git/sync-main.test.mjs` | 16006 | `d58d57b63353ab993a8a2ecd8a8de1867c2c56b13ab3fb5c400b4fcd2232be01` |

Author `author-green-r3.log` and independent `independent-review-r2-test.log`
both record **17/17 PASS**, exit 0, no skipped tests. Shell syntax, test syntax,
`git diff --check`, and skill metadata validation passed. The independent exact
self-update probe now reaches the pinned commit on both sides without executing
replacement code (`independent-r2-probe/`). Final independent verdict: **PASS**,
no remaining material findings. Reverse-first tests actually advance both refs;
they are not merely a repeat after a forward synchronization.

## Live-device validation — 2026-10-02

Both existing non-interactive SSH directions were verified without changing
credentials, host trust or services (`bidirectional-ssh-readback.log`). Reciprocal
`sync.targets` were configured only in each repository's local Git config.

The corrected script was separately hash/byte-verified as a diagnostic copy at
Mini's `/Users/bendandebaba/JuanerAI-artifacts/post-merge-main-sync-20261002/sync-main-5f86aac14eac.sh`.
This is not installation into its active product checkout or formal publication.

- Corrected reverse `--check`: exit 0; Mini honestly reported ancestry unverified
  until fetch (`live-reverse-check-r2.log`).
- MacBook-initiated run: exit 0. MacBook main was unchanged; Mini main and
  origin/main advanced from `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79` to the pinned
  `5bbe6f179cb5dc6c21493395e23a99acf0ebab61`, using `mode=ref-only`
  (`live-forward-sync-r2.log`).
- Mini-initiated run: exit 0, both mains already at the same pin; no-op success
  (`live-reverse-sync-r2.log`). This live reverse check proves invocation and
  connectivity; actual reverse fast-forward is covered by the real-Git fixture.
- Mini kept `work/mac-mini/change-004-ai-led-analysis`, HEAD `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`
  and the same index SHA-256 `e778aadb06c28856337dc4d379f355ce637fe05465ba2321ede25773b445f1f6`.
  Its status and tracked-diff fingerprints changed between observations; no
  whole-worktree immutability claim is made for this active development window.
  The synchronization used ref-only Git operations, not worktree updates.
- The MacBook peer root retained its existing work branch, HEAD, index and
  clean-state fingerprints; before/after records compare byte-identically.

Snapshot records: `mini-before-sync.log`, `mini-after-sync.log`,
`macbook-peer-before-sync.log`, `macbook-peer-after-sync.log`.
No Change 004 execution, adoption, acceptance or work-branch update was requested.

## Publication validation and one-time exception — 2026-10-02

The user authorized commit, push, PR squash merge and safe dual-main
synchronization for this tooling delivery. Full indexing completed with
`mode=full`, `persistence=false`, using a process-local allowed root limited to
this worktree; no global configuration was changed. The single Branch identity
matched worktree `/Users/huangbo/.codex/worktrees/caaa/JuanerAI`, branch
`work/macbook/post-merge-main-sync` and pre-commit HEAD
`5bbe6f179cb5dc6c21493395e23a99acf0ebab61`.

Ten of the eleven intended files have current graph File nodes. The extensionless
`tools/harness/git/sync-main` has no graph node. The user explicitly approved a
**single-file, single-publication exception** to that node requirement, using
the exact source fingerprint above, source review, shell syntax check, 17/17
public-command tests and independent PASS instead. This is not a full-index
waiver, a permanent rule change, or permission for another file or task.
No removed/renamed/legacy paths are in scope. The script's entry path is checked
directly by those public-command tests; remaining documents/tests use File
identity checks, with no additional public runtime symbol contract.

Publication validation evidence remains under the same local evidence root;
the PR records the final validation results and this exception. This section
records authority and checks, not a claim that merge or device sync has already
completed.

## Limitations

Offline SSH is a transport fixture. It proves script streaming, quoting,
required SSH options and both invocation directions while Git repositories and
effects are real; it does not prove live SSH authentication. Connection and
keepalive waits are bounded, but responsive long-running remote Git operations
have no total-duration deadline. Exact effective origin URL equality intentionally
rejects alternate spellings. A target lacking the pinned object cannot prove
ancestry in `--check`; write-time fetch and FF checks remain authoritative.

The isolated tool's local implementation and validation are complete. At this
pre-publication verification snapshot, commit, push, PR merge and post-merge
device synchronization are not yet asserted. Archive, live task adoption and
product completion are outside this record. Existing in-flight sessions are not
required to adopt the published workflow/skill changes.
