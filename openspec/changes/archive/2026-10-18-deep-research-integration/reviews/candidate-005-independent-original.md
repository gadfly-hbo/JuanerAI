**PASS — candidate005 passes the bounded independent engineering re-review.** All four candidate004 findings are resolved within the authorized offline integration scope. F-DR-003-01 remains repaired. No new material blocker was found.

This verdict combines independent checks with inspected executable evidence; it does not establish real research quality or product acceptance.

| Finding / requirements | Recheck and result |
|---|---|
| **F-DR-004-01 — stale-view writes; R10/C04** | [server.mjs:94](/Users/bendandebaba/.codex/worktrees/7a90/JuanerAI/adapters/deep-research/server.mjs:94) rechecks the view across the affected waits. Independent memory checks rejected stale requests during body, HTTP authorization, attachment authorization, settings reads, publish locking and handler transitions, with no subsequent simulated writes. Current-view and owner requests succeeded. Profile checks independently rejected control/task revocation during asynchronous authorization. Actual-listener regression evidence is preserved in `focused-014.log`. **Resolved.** |
| **F-DR-004-02 — failed startup blocks shutdown; R06/C03** | The actual [process adapter](/Users/bendandebaba/.codex/worktrees/7a90/JuanerAI/adapters/deep-research/process.mjs:43) rejected a deliberately wrong manifest before directory creation/spawn, then allowed idle inspection and repeated close. Memory checks retained rejection for post-spawn failure, UNKNOWN work and abnormal exit. Configured-service evidence covers project switching and shutdown after bad-package rejection. **Resolved.** |
| **F-DR-004-03 — save status crosses tasks; R01/R05** | Independent checks of the actual [browser client](/Users/bendandebaba/.codex/worktrees/7a90/JuanerAI/apps/browser/deep-research-client.mjs:29) covered another task, another project with the same task identifier, returning before the response, and lost-response retry. Completion stayed with the originating task; receipt recovery issued no second save. **Resolved.** |
| **F-DR-004-04 — normal-entry evidence; C02/C11** | Inspected the configured-service fixture, permanent tests, logs and browser006 artifacts. They exercise the actual deployment descriptor → `startIndependentBrowserService` → project/task context → research path, without a production `researchBundle` override. Save, return with draft, reopen, repeated save and download are evidenced. Research was preloaded synthetically through the original gates; production Provider access remained denied. **Resolved for this scope.** |
| **F-DR-003-01 — host-save revocation; R05/R10/C04** | Fresh memory checks of actual HTTP/Application code passed both body-wait and export-wait revocation cases, reservation preservation, current-control retry, receipt readback, command/version conflict and task invalidation before saving. Unchanged copy/export implementation retains the previously verified coverage. **Remains resolved.** |

**Identity and drift**

- Candidate005 manifest SHA-256: `3ee960a21cfd47474d9f2ee3b95c270ddb563a89431b98dbd8af2d406a1e5ea6`. All **130 archived files** match; the frozen Git-status inventory matches the manifest.
- Candidate004’s manifest and archived files remain unchanged. The production tracked diff is unchanged from004; the newly added-file repairs and tests were reviewed separately.
- Bundle009 and browser006’s actual copied bundle each contain **17,411 verified files / 317,906,174 bytes**, matching manifest `fabb1adaad46b96d48ad88782ad5ca7388fc4b1f2f178ba17c19b274cf10e1f9`, with no extra/missing files or symlinks.
- Bundled server/runtime/child/MCP entry match the frozen source. All **200 pinned plugin source files** match. Compared with008, non-cache bundle differences are the repaired server and reordered transform metadata; original business/UI bytes remain unchanged.
- Final comparison of manifest-listed live files found only the declared `status.json` difference. The additional board event is parent-declared status-only; no fresh Git census was run.

**Evidence and acceptance coverage**

- Fresh independent **Node26 memory checks** and **`tsc --noEmit --incremental false` exit0** completed.
- Inspected genuine RED failures, subsequent GREEN, and retained repeated-close failure. Final focused014 records **24 PASS / 0 FAIL / 0 SKIP**.
- Independently summed portable011’s raw output: **4938 PASS / 0 FAIL / 24 SKIP**, with all 19 stage exits0. This is supplied execution evidence, not an independently rerun full suite.
- Resource-build005 records **1 PASS**. Changed tests preserve existing assertions and add failure-sensitive regressions; no test retirement or weakened coverage was found.
- Browser screenshot/DOM/evidence hashes match. The downloaded ZIP and stored copy are both **5281 bytes**, SHA-256 `7676e6a7b678b0ec36cecd342ef8f50a430c784224ba00b12f21bc86b8d1b7f3`. Receipt identity, run, limitations, unresolved items and internal file hashes agree.
- R01–R10/C01–C12 were assessed through the repaired paths plus verified unchanged candidate004 coverage: original gates, disabled followup/memory, library/settings boundaries, task isolation, stable copies, recovery, fixed resources and authorization. Historical evidence is reused only for unchanged behavior.

**Remaining limits**

Actual listener, child-process and filesystem-fault suites were **not rerun independently** under this sandbox. Their supplied evidence was inspected; memory checks do not establish physical crash durability or subprocess settlement.

The original plugin’s **421 PASS / 12 missing-historical-fixture failures**, 24 environment skips and unmeasured strict MCP physical settlement remain. Real Provider/data/semantic quality, full application installation, clean-machine redistribution, hosted CI, Product Acceptance and peer operations remain **NOT_RUN**. No additional nonblocking advisories.

**Runtime and role**

Same independent session retained. Parent-confirmed runtime is **gpt-6-astra / high / read-only / never**; current instructions expose read-only/never. Model/effort telemetry verification remains parent-owned, not self-introspection. The candidate005 exception applies; historical native-role failures are not retrospectively cleared. Graph discovery remained **NOT_AVAILABLE**, without retry.

No files or project-control state were changed. **WIP UNKNOWN** is preserved. This PASS is engineering evidence only—not Engineering Acceptance, Product Acceptance, archive, Git delivery or release authority.

