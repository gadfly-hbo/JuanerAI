# Windows CI Scope Targeted Readback 001

> Evidence ID: `EVD-D1A-007`
>
> Observed: 2026-08-28
>
> Owner: MacBook Controller

## Finding

The integrated workflow `.github/workflows/ci.yml` has one `ubuntu-latest` canonical-validation job. It has no Windows runner, Desktop package build, or Windows automated smoke. At the same time:

- the user's current explicit approval requires local macOS validation plus hosted Windows CI build and automated tests throughout development;
- `AC-XDSB-006` requires the same frozen source and contract to build and smoke in hosted Windows CI;
- the D1-A scope previously excluded `.github/workflows/ci.yml`, so a signed DISPATCH could not produce the required evidence.

Signing the prior scope would therefore create a known acceptance/evidence contradiction.

## Bounded closure

The Test role receives exactly one additional path: `.github/workflows/ci.yml`. Its permitted change is limited to the hosted Windows x64 build and automated Desktop smoke for `AC-XDSB-006`.

This path grant does not authorize:

- a release workflow, public artifact, deployment, upload, signing, notarization, Authenticode, installer publication, or production-ready claim;
- unrelated CI jobs, permission expansion, new triggers, secret use, provider/model calls, real data, Python, DuckDB, SQLite, Runtime, Schema, IPC, or persistence expansion;
- any additional package, production, test, governance, OpenSpec, or project-control path.

The Product Change PR must report the hosted result precisely as `Windows CI PASS` or failure. It cannot claim final Windows product acceptance.

## Classification and disposition

Classification: `TEST_REQUIRED` path-ownership closure for an already approved acceptance requirement, not a new product semantic or a new D1-A review cycle. Authority comes directly from the user's current instruction and `AC-XDSB-006`. The prior unique D1-A Review and its dependency-order correction remain unchanged.

Disposition: D1-A remains blocked until this exact scope record is integrated, both Mac mini checkouts and the Host Loop canonical repository are fast-forward aligned to the new integration SHA, and the empty WIP pointer is read again. No DISPATCH, dependency installation, OpenSpec, test, implementation, provider/model call, real data access, or Model Pack work is created by this readback.
