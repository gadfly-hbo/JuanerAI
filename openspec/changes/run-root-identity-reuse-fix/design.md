# Design: descriptor-pinned run-root identity

## Architecture

Only `adapters/storage-local/local-analysis.ts` changes. Product Core, Application, Ports, Profile, and CLI continue to see the same business-oriented Store and errors. The Adapter's constructor already validates an absolute, non-symlink, non-root directory and freezes its `realpath`, device, and inode. Immediately after that validation it synchronously opens that same physical root read-only using Node filesystem primitives and the supported directory/no-follow flags, `fstat`s the returned descriptor, verifies directory plus exact `(dev, ino)` agreement, and retains the descriptor in the factory closure.

At every preflight, the Adapter performs its existing configured-path `lstat` plus `realpath` checks, then `fstat`s the retained descriptor. All identities must agree with the frozen constructor identity. The descriptor is not used to create, read, rename, or write Artifacts; current path-based publication remains unchanged. Its sole purpose is to keep the original directory object referenced, so a path removal/recreation cannot recycle the original inode while the Store lives.

## Failure Semantics

Construction cannot safely establish the descriptor: fail `ARTIFACT_WRITE_FAILED`, synchronously, with no Artifact side effect. A later descriptor `fstat` failure or any mismatch during preflight: fail `RUN_ROOT_UNSAFE`, before session/Discovery/model/run/Artifact effects. Existing mutators retain their current error semantics; this Change does not insert new preflight calls, retries, retries-after-error, compensation, or cleanup.

The exact POSIX descriptor flags are an approved-runtime dependency, not an optional safety fallback. If this Node/OS combination cannot supply directory/no-follow descriptor acquisition, construction fails closed. The baseline supports the stated GitHub-hosted Ubuntu and macOS temporary descriptor observation; any different deployment profile requires its own approved compatibility decision.

## Data and Security Boundaries

The descriptor contains no source rows, user data, credentials, provider data, prompts, logs, traces, manifests, or new persisted state. It is private local process state under the personal Profile trust boundary. No model or network action occurs, and no external data boundary expands. Holding a removed directory descriptor does not grant a public deletion/list/repair capability and does not change user-owned terminal Artifact retention.

## Lifetime and Resource Bound

One Store owns one descriptor. It is intentionally not externally closable because the accepted Store/Port lifecycle has no close contract and adding one would broaden the boundary. Each personal-Profile composition constructs one Store; ordinary process exit closes its descriptor. If Controller evidence shows that this retained-until-exit lifetime is unacceptable to the approved deployment, this Change is BLOCKED; do not introduce a lifecycle protocol.

## Rejected Alternatives

Marker files add persisted state and cleanup/recovery semantics. Timestamp/birthtime checks are not reliable object identity. Retrying/re-opening makes the original identity ambiguous again. A global registry/cache/listener or public close API adds lifecycle/concurrency scope. None is needed for the accepted single-Store personal Profile.
