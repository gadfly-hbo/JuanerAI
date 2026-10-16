# Independent Validator verdict: FAIL

Candidate: BUI-MACBOOK-IMPLEMENTATION-001. Base 1446276011917ec46b369eadaed40c059db46b34; complete 67-file manifest digest bff54a92dcb2408b1b740d21dd5e4e8013a79ea9cd1994b10cb576b85fcaf5f5. Approved BUI-20261015-004 manifest digest 2a169062cacc2c0ff2ec83a4c0c1ad75cddea3a0f268ec4529c6021f32a85fcc. All bytes and complete dirty/untracked scope matched before and after review.

This preserves the original independent FAIL after candidate002 was submitted. It does not rewrite or invalidate historical evidence. The Validator did not author or repair candidate source/spec/tests.

## Blockers

1. BUI-R01/A01: Project A new-task draft crosses to Project B after opening an existing A task and switching projects. Global `new` UI cache key was not project-qualified. Confirmed by actual Chrome, project service manager, Profile, HTTP and SQLite, without API mocking. Evidence: real-project-isolation-probe.ts, real-project-isolation-probe.log, real-project-CAbBdI/real-project-leaked-draft.png. Recheck A/B round trips, new/existing tasks, reload and files/references, preserving same-task drafts.
2. BUI-R04/R06/A04/A06: Current-content report export omits locked derived numeric values and evidence. Actual compiled D1, label, formula, limits and proof disappear after wording-only save. Evidence: export-derived-probe.ts and export-derived-probe.log; original before/after export-facts.log. Recheck original/derived/not-applicable values, units/ranges/formula/inputs/limits/proof, confirmed/unconfirmed/manual/suggestion/history variants.
3. BUI-R07/A05: A real saved qualified partial result in settled waiting state renders an enabled partial-confirmation button, but actual HTTP returns400 and store rejects TASK_UNCONFIRMED. Ledger is empty; confirmation must not imply task completion. Evidence: partial-confirm-probe.ts, partial-confirm-browser.log, partial-confirm-rejected.png. Recheck qualified waiting save/confirm, keeping running/checking/UNKNOWN/stop/preview/physical effects fenced.

## Evidence and limits

Independent focused integration10/10 passed. Additional draft-navigation, narrow overlay focus and stopped late-result probes passed. Existing tests retained their negative assertions; new tests lacked the three scenarios above. Initial causal RED preceded implementation, independently checked against native-history source prefix and record hashes. Earlier missing ability masked later assertions; final tests execute them.

Canonical007 finished CANONICAL_EXIT=0, Desktop unit379/379, contract658/658, integration1607 pass/20 existing skip/0fail. SHA256 f9e667009581f57f8938cd89ef4dd366960ea79ce4b3e48390b23d8e29097c23. Passing suites did not detect the blockers. No claim for Provider, native Desktop, GitHub CI, Mini adoption, user Product Acceptance or Git authority. Native200% page zoom remained unverified in001; later candidate evidence is separate. No additional style blocker or separate accessibility-certification Gate was imposed.
