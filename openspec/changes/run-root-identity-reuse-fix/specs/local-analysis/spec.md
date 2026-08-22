# Delta for `local-analysis`: physical Run Artifact Store root continuity

## ADDED Requirement: REQ-RRIF-001 — Physical Run Root Continuity

For the lifetime of each `createLocalRunArtifactStore({runRoot})` result, `preflightRunRoot()` SHALL accept only the same physical directory object accepted by that Store at construction.

- **AC-RRIF-001-01:** If the configured root remains the directory object accepted at Store construction, zero-argument `preflightRunRoot()` returns the existing frozen `{ready:true}` result.
- **AC-RRIF-001-02:** If that directory object is removed or replaced after construction—including immediate recreation at the same pathname when Linux would reuse the prior device/inode pair—`preflightRunRoot()` rejects exactly `RUN_ROOT_UNSAFE` before session, Discovery, model, run, or Artifact effects; it creates no run and writes no Artifact. Existing missing, symlink, and non-directory unsafe-root outcomes remain unchanged.
- **AC-RRIF-001-03:** The Run Artifact Store Port surface, public Store object surface, Artifact data/lifecycle, and persisted run data remain unchanged; this requirement adds no public lifecycle operation or persistent root-identity record.

## Compatibility

This Requirement makes the existing unsafe-run-root behavior reliable under inode reuse; it does not alter accepted local-analysis Requirements/ACs, the Run Artifact Store interface, error vocabulary, Artifact data/lifecycle, Profile, CLI, canonical runner, or compatibility/version rules.
