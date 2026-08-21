# TASK-009 R4 — Real E2E Test Correction 001

## Cause

After raw Pi event projection was corrected, the real TEST-XCLI-013 completed
the product path successfully. All assertions for M3 provenance, the synthetic
fixture and oracle, Finding, CLI event order, terminal status, persisted
manifest/evidence/Markdown, six asset bytes/checksums, unchanged source, and
closed directory contents passed.

The sole remaining failure compared filesystem `mtimeMs` values to infer that
`run.json` was published after Evidence and Markdown. Filesystem modification
timestamps are wall-clock metadata, not a deterministic operation-order log;
they can disagree under timestamp granularity or clock behavior even when the
awaited write sequence is correct.

## Correction

The Test role removed only that `mtimeMs` comparison and the now-unused `stat`
import from:

- `tests/e2e/xanthil-local-analysis/local-analysis.e2e.test.mjs`

The success-last contract remains executable in the frozen Artifact Adapter
contract/integration suite through its exact closed
`{committed:true,success_manifest_is_last:true}` result, exact succeeded
manifest, and post-validation obstruction negative. The real E2E continues to
verify the externally observable successful terminal tree and every persisted
asset checksum.

## Evidence

- E2E test SHA:
  `73c9734799e502322058507d5eb83c2100fb0e93060965cd3b664c724ffb3f41`
- Adapter SHA unchanged:
  `dcad20ce5f2e153d748726731f6fb00e1e24933db16fdff80eade02f7590c510`
- syntax PASS;
- default E2E: `131` PASS, `0` fail, one explicit real-Pi skip;
- no real model/network call was made by the Test role.
