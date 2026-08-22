# Delta for `local-analysis`: physical Run Artifact Store root continuity

## ADDED Requirement: REQ-RRIF-001 — Physical Run Root Continuity

For the lifetime of each `createLocalRunArtifactStore({runRoot})` result, each `preflightRunRoot()` has one physical-root identity linearization point: acquisition of a private identity-only descriptor for the configured path. The preflight result concerns the directory object acquired at that point; it makes no assertion about a later pathname replacement.

- **AC-RRIF-001-01:** If that acquisition obtains the same directory object accepted at Store construction, zero-argument `preflightRunRoot()` returns the existing frozen `{ready:true}` result, including when the root grants owner write/search but not read permission (mode `0300`) on the approved macOS and Ubuntu personal runtimes.
- **AC-RRIF-001-02:** If the configured path is missing, symlinked, non-directory, or resolves at acquisition to a directory object other than the Store's construction object—including removal/replacement before acquisition and immediate same-path recreation with device/inode reuse—`preflightRunRoot()` rejects exactly `RUN_ROOT_UNSAFE` before session, Discovery, model, run, or Artifact effects; it creates no run and writes no Artifact.
- **AC-RRIF-001-03:** A replacement that occurs only after successful live-path descriptor acquisition does not retroactively alter that preflight result. The Run Artifact Store Port/public Store surface, Artifact data/lifecycle, and persisted run data remain unchanged; this Requirement adds no public lifecycle operation or persistent root-identity record.

## Compatibility

This Requirement makes existing unsafe-run-root behavior reliable under inode reuse while preserving owner-write/search-only roots on the approved macOS and Ubuntu personal runtimes. It does not alter accepted local-analysis Requirements/ACs, the Run Artifact Store interface, error vocabulary, Artifact data/lifecycle, Profile, CLI, canonical runner, or compatibility/version rules.
