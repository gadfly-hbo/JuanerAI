# Test Plan

The Test Agent creates one public-entrypoint test file using lightweight temporary directories and stub commands. It does not copy the repository test tree, invoke a provider, or add a production seam.

| Test | AC | Observable proof |
|---|---|---|
| CVR-TEST-001 | AC-001, AC-003 | selected PATH/version stubs, including `v1.5.2 (Variegata) 8a5851971f`, pass and ordered commands start |
| CVR-TEST-002 | AC-002, AC-004 | wrong version or missing DuckDB first token exits nonzero before any validation stub |
| CVR-TEST-003 | AC-005 | inherited real gate is absent in E2E child |
| CVR-TEST-004 | AC-006, AC-007 | failing validation streams/returns nonzero, later command does not start, no result file is created |

Expected RED is the absent `tools/harness/validation/run`, with healthy fixture setup proven independently. Test output and exact hash are frozen at TDD_READY. The final regression runs the runner itself on the accepted repository; counts are reported as evidence only.
