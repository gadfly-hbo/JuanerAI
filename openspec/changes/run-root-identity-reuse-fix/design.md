# Design: pinned and live descriptor identity

## Architecture

Only `adapters/storage-local/local-analysis.ts` changes. The factory pins the construction directory object with one private identity-only descriptor. Each preflight separately acquires a private identity-only descriptor for the configured pathname; that live acquisition is the linearization point. It accepts only if `fstat` of the live descriptor and the pinned descriptor identify the same directory object. The live descriptor is closed after the comparison; the pinned descriptor remains private for the Store lifetime.

Replacement before live acquisition is observed as a different/missing/unsafe object and rejects. Replacement after live acquisition cannot retrospectively invalidate that completed preflight. Existing path checks may reject before acquisition, but cannot make an acceptance claim after it. The descriptors are never used for Artifact reads/writes; current path-based publication is unchanged.

## Failure Semantics

Construction cannot safely establish the pinned descriptor: fail `ARTIFACT_WRITE_FAILED`, synchronously, with no Artifact side effect. A later live acquisition/`fstat` failure or identity mismatch: fail `RUN_ROOT_UNSAFE`, before session/Discovery/model/run/Artifact effects. Existing mutators retain their current error semantics; this Change does not insert retries, compensation, or cleanup.

The private descriptor must be identity/search-only, never `O_RDONLY`, so mode `0300` remains valid. On approved macOS, use native `O_SEARCH`/`O_EXEC` numeric flag `0x40000000` with `O_DIRECTORY` and `O_NOFOLLOW`. On approved Linux, use native `O_PATH` numeric flag `0x200000` with `O_DIRECTORY` and `O_NOFOLLOW`. Node 26 does not export these constants; numeric use remains Adapter-private, scoped only to these two approved runtimes, and adds no platform abstraction. The implementation verifies the resulting descriptor with `fstat`. Unsupported platform/flag/open conditions fail closed.

## Data and Security Boundaries

The descriptor contains no source rows, user data, credentials, provider data, prompts, logs, traces, manifests, or new persisted state. It is private local process state under the personal Profile trust boundary. No model or network action occurs, and no external data boundary expands. Holding a removed directory descriptor does not grant a public deletion/list/repair capability and does not change user-owned terminal Artifact retention.

## Lifetime and Resource Bound

One Store owns one descriptor. It is intentionally not externally closable because the accepted Store/Port lifecycle has no close contract and adding one would broaden the boundary. Each personal-Profile composition constructs one Store; ordinary process exit closes its descriptor. If Controller evidence shows that this retained-until-exit lifetime is unacceptable to the approved deployment, this Change is BLOCKED; do not introduce a lifecycle protocol.

## Rejected Alternatives

Marker files add persisted state and cleanup/recovery semantics. Timestamp/birthtime checks are not reliable object identity. Retrying/re-opening makes the original identity ambiguous again. A global registry/cache/listener or public close API adds lifecycle/concurrency scope. None is needed for the accepted single-Store personal Profile.
