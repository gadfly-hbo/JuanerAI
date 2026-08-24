# Model Pack v1 shared contract

`packages/contracts/model-pack.ts` provides a closed, canonical and pure v1
package/release contract. It accepts only supplied values and performs no
filesystem, Artifact, MLflow, network, provider, SDK, Profile, registry, or
activation operation.

`packages/ports/analytical-model-runtime.ts` supplies the scenario-specific,
one-shot `AnalyticalModelRuntime` Port. Construction binds one Runtime and
Adapter value; each preflight consumes a supplied release status and each Run
captures one confirmed input snapshot. The Port is inactive by default and has
no selection, fallback, cache, retry, registration, or hot-switching behavior.

Artifact-store existence/root authorization and real model inference remain
outside this Change. Runtime results retain only the closed package, release,
snapshot, Runtime, and Adapter provenance; they never expose an Artifact URI
or provider/tool/session detail.
