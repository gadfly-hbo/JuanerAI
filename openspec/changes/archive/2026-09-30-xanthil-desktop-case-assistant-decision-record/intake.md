# Change 002 Engineering Intake — 2026-09-29

Confirmed by Mac mini Engineering Controller in this Change 002 chat after the
user explicitly lifted the prior waiting stop and authorized intake, OpenSpec,
tests, implementation and independent verification. Adopt continuous-engineering
policy v0.8; no legacy role-return quotas or separate Spec/Test approval hops.

## Fixed input and receipt

- Repository: `/Users/bendandebaba/JuanerAI`; device: mac-mini.
- Received `origin/main` / local main: `dfe2fa5d88f23e9049476423b222d29b22edc579`.
- Tree: `0c46c4fd985a71cc6da05fc2538f356c2b098e21` (PR #45).
- Clean sole worktree before intake; safely fast-forwarded, then created
  `work/mac-mini/case-assistant-decision-record` through `tools/harness/git/start-work`.
- Blueprint v2.0: `docs/planning/2026-09-26/juanerai-product-development-blueprint-v2.0.md`,
  SHA-256 `a7181f5a62e41955c7753b018c922701296948b593e9b7ffc164de549b768a30`.
- Product plan v1.0 SHA-256 `930f564593547df5a16bd1be44173e581be0d1f876ed5b281ca3527ac3f110c2`.
- UI Contract v1.0 SHA-256 `09275e1dc115d5f18e6e629e5adefd878421eadfc401cd79b9c9436820ad7747`.
- Both documents and clickable attachment under `docs/planning/2026-09-28/`.
  All frozen clickable-file hashes match. Review 006 PASS and user UI Gate PASS
  apply; no repeat product review is needed.
- Required ordered reads completed: AGENTS, planning index, plan, UI Contract,
  clickable README, freeze record, Review 006.
- First Change acceptance is bound by the archived 2026-09-27 Desktop Change's
  acceptance.md and current canonical Desktop/local-analysis specifications.
- Current exposed roles: juaner_worker and juaner_validator, both fixed
  gpt-6-astra/high. Repository role files request workspace-write/read-only;
  actual execution limitations must be reported, never bypassed. Parent runtime
  settings are not independently attested by reading those files.

## Accepted result and compatibility

Deliver the plan's AC-01–13 and UI-00–20: an independent Quick Case Assistant
linked to an eligible Completed professional Case; exact task authorization,
bounded conversation/read-only business tools and auditable history; editable,
rejectable draft; deterministic, idempotent atomic adoption appending formal
Decision Record, Expected Outcome and report version; professional stage-6 return.
Completed analysis revisions, original reports, existing six stages, CSV /
DuckDB / Python computation, accepted evidence/Finding and three one-shot
assistance disclosures remain compatible. Preserve first Change tests and
canonical behavior; use new contract leaves for the new business capability.

This is a boundary-sensitive incremental Change, not greenfield_fast_path:
persistence, identity/versioning, exact egress authorization, cancellation,
budget and atomic-publication contracts need explicit in-scope engineering
decisions before dependent implementation. The worker drafts the concrete
reuse mapping and contract impact for Controller decision. Product semantics
and safety boundaries are already closed; any discovered ambiguity goes to user.

## Work package and limits

- Worker owns this Change's spec/design/tasks/verification and scoped additions
  in `packages/product-core`, `packages/application`, `packages/ports`,
  `packages/contracts`, `adapters/storage-local`, `adapters/agent-pi`,
  `profiles/personal`, `apps/desktop`, and corresponding `tests`.
- Controller alone writes `.juanerai/project-control` through status-cli.
- Conditional: existing build/validation entrypoints only when needed to include
  new tests or assets; public/persistent contract changes require Controller
  impact decision. Dependency graph/install changes require separate authority.
- Forbidden: product-plan/UI-contract changes, archived records, old WIP/Host
  Loop/pointer state, unrelated modules, real user Projects, external writes,
  business-data egress, real Provider/model calls or spending. No publish,
  merge, deployment or release is inferred from engineering authorization.
- Fork/Subagent remain product Preview. Development worker/Validator delegation
  is authorized by AGENTS and does not activate those product capabilities.
- No additional user-set numeric engineering quota. Preserve platform limits,
  progress-based stop-loss, failures and UNKNOWN; do not fabricate product PASS.
- Reuse existing installed toolchain/dependencies; resolve local tool paths from
  Mac mini records. Do not use MacBook paths or install prerequisites implicitly.
- Before implementation, worker names focused Node test commands per AC and
  checks toolchain health. Final regression uses `tools/harness/validation/run`
  with local `JUANERAI_TOOLCHAIN_BIN`; native/UI checks are synthetic/offline.
- Real Provider proof and user Product Acceptance remain separately outstanding.

## Evidence and next action

Single new Change evidence root (mac-mini):
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/`.
`intake-001/` preserves input bytes, sizes/SHA-256, command outputs/exits and the
prior board snapshot. Copies were read back; local accessible, not remote backup.
Historical first-Change artifacts stay in their original root, unchanged.

Intake PASS for authorized offline engineering. Next: continuous worker creates
the minimal spec, exact reuse/contract design and focused verification plan;
Controller decides material in-boundary contracts before implementation, then
causal RED/GREEN and complete-candidate independent validation.
