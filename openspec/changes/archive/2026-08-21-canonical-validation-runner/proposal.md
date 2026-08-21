# Canonical Validation Runner

- Change ID: `canonical-validation-runner`
- Class: R1 ordinary, reversible governance tool
- Status: accepted; activation complete; archive ready

## Objective

Make the accepted offline validation baseline reproducible without each role rebuilding PATH and tool-version assumptions. The delivery is one POSIX command: `tools/harness/validation/run`.

The learning objective is narrow: prove that the repository can select its accepted local toolchain and run its existing offline checks from one public entrypoint. It does not evaluate a model, Pi runtime, provider, or product behavior.

## Delta and non-goals

The runner replaces ambient PATH for its own process tree, checks the accepted tools/dependencies, removes the inherited real-model test gate, then runs existing syntax, unit, contract, integration, default E2E, and project-board commands in that order.

It SHALL NOT add a real-model mode or call, retry/fallback, report/ledger, install/repair action, package/lock change, global environment mutation, generic command interface, persistent data, or fixed historic test-count contract. Existing direct commands remain supported.

## Reused boundaries and paths

This Change reuses the accepted first-slice suites and existing gated real E2E leaf. It changes no Product Core, Application, Port, Adapter, Profile, data, credential, persistence, or model boundary. Every child has `XANTHIL_REAL_PI_ACCEPTANCE` removed, so no external/model call is admitted.

- Test after Spec Gate: `tools/harness/validation/run.test.mjs` only.
- Worker after TDD_READY: `tools/harness/validation/run` only.
- Controller-only after acceptance: add narrow discoverability references to
  `tools/harness/README.md` and the `Validation and Completion` section of
  `AGENTS.md`. These are the only activation paths.

All manifests, dependencies, existing tests, product code, CI, global shell
configuration, and `exploration.md` are forbidden. Test, Worker, and Validator
shall not write `.juanerai/project-control/` or alter project-board schema or
behavior; the Controller's existing AGENTS.md lifecycle updates remain
permitted and are not a Change deliverable.

## Activation and rollback

The command becomes canonical only after RED, GREEN, regression, independent
verification, and acceptance. Rollback deletes the one runner and the two
approved discoverability references; direct commands remain the recovery path.
No data or dependency rollback exists.
