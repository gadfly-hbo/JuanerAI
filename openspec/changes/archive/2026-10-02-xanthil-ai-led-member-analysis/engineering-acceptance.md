# Change004 Engineering Acceptance with user-authorized E2 waiver

Date: 2026-10-02. Owner: Mac mini Engineering Controller.
State: **ENGINEERING_ACCEPT_WITH_E2_WAIVER — authorized for Change004 Git delivery and archive.**

## User decision and scope

In the original Change004 conversation the user explicitly instructed:

> 放行E2，后续再修，交付change004

This accepts the disclosed residual E2 risk for this fixed Change and authorizes
its Git delivery/integration and mechanical OpenSpec archive now. It resolves
the current delivery stop. It does not relabel native failures as PASS, alter
independent reports, or claim the later human experience review has occurred.
The user's earlier instruction that they will do human experience later remains
in effect; it is not made a new pre-delivery gate.

## Fixed candidate and evidence

- Branch: `work/mac-mini/change-004-ai-led-analysis`; engineering base
  `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`.
- Mac mini evidence root: `/Users/bendandebaba/JuanerAI-artifacts/change-004`.
- Fixed source: `worker/stage-fixes5-20261002T090727Z/corrected-offline-005`.
  Candidate SHA-256 `080a55f9abb23d8e1b358b96a6b6e410ef0707b095cfc2bc734a2b52b9e3009a`;
  receipt `c20455d7f53b1eab9dbb13cf30f12dfa54ebaa260b32a0bd56dd6ec25ac759b4`.
- Current app.asar SHA-256
  `d0e2b3efa4b45f98e91749cb847ad9af7b962b1622b04449366fa49d78789c8b`;
  package is an isolated engineering artifact, not an installed release.
- Independent review006 found no remaining material implementation blocker.
  Review007 independently passed all158 membership persistence tests; E1 closed.
  Supplement008 passed4 matching layout/configuration rechecks.184 source files
  remain unchanged. Independent overall verdict stays BLOCKED on E2.
- Final author273 contracts,39 focused consumers, typecheck and static package
  passed. Historical broad2446/0/1 evidence applies only to unchanged scope.
  Review007's1764/0/1 remainder and targeted supplement are component evidence,
  not a completed default canonical command. Counts overlap and are not summed.
- Commands, causal RED/GREEN, tests, scope/architecture/test-preservation and
  source identities are preserved in [verification](verification.md),
  [engineering decisions](engineering-decisions.md), and independent reports
  under `controller/validator-review-006` and
  `controller/validator-permitted-001/validation-007` and `validation-008`.

## Accepted residual risk and controls

[E2 follow-up](e2-follow-up.md) remains open: native launch/interaction,
focus/viewport/cleanup and current-package GUI/full native canonical evidence
are absent. Electron SIGABRT and sandbox desktop-service denials were observed.
This waiver covers the disclosed E2-dependent full native/package verification
gap for this delivery. It does not waive unrelated CI failures or permit test
weakening, new product scope, actual Provider calls, sensitive data, installation,
release or changed system security.

Mini accepts the fixed implementation for engineering delivery with this explicit
waiver. Tests and historical failures remain. Product experience/value and real
model quality/cost remain unverified. No new cumulative capability target is
promoted to fully accepted. This decision is separate from GitHub CI, merge and
receiving-device synchronization, which require their own actual receipts.

The exception is limited to this Change004 delivery and expires when E2 is
successfully reverified or before a later deployment/installed-artifact acceptance
claims the waived evidence. Later work must retain the exact unresolved return
points, perform a bounded repair and independently verify it. No automatic next
Change or background repair is started by this record.
