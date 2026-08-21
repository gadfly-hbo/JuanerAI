# Harness Automation

The canonical default offline validation command is:

```sh
tools/harness/validation/run
```

It replaces ambient PATH with the approved command-local toolchain, checks the
accepted versions, removes the real-model test gate, and runs syntax, unit,
contract, integration, default E2E, and project-board checks fail-fast. It has
no real-model mode, performs no installation or repair, and writes no report.

Candidate checks include OpenSpec validation, scope control, expected RED evidence, traceability, architecture boundaries, package contracts, verification assembly, and archive readiness.

Change-specific direct commands remain valid when a narrower evidence scope is
required.
