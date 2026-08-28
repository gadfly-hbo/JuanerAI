# Xanthil Desktop D0.5 Structure Decision Ledger

> Ledger ID: `D05-XD-STRUCT-001`
> Status: approved as one package by the user on 2026-08-28; executable schemas/contracts still require their Change Gates
> Date: 2026-08-28
> Scope: Project/Session persistence and later Run/Fork/Subagent/report semantics; no executable schema or storage layout authority

This ledger applies the persistent-structure Gate before any manifest, migration, table, index, durable event, or cross-module contract is created. The user approved the complete D05-XD-001 package on 2026-08-28. That approval confirms the product-level decisions below; executable shapes remain locked to D1-A, OpenSpec, Test, and Change-specific Gates.

| Seq | Topic | Recommendation | Reason | User decision | Consistency | Status | Evidence |
|---|---|---|---|---|---|---|---|
| S01 | Operational authority | Versioned closed JSON manifests and immutable artifacts are first-phase authority; no SQLite | enables atomic same-filesystem Session provisioning and avoids an unproven native DB dependency | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5; data-authority.md |
| S02 | Analytical authority | one Session-scoped DuckDB store under `020_clean` only when the Python Change starts | keeps analytical data separate from operational lifecycle | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5; ports-and-adapters.md |
| S03 | Project grain | one Project record per user-chosen local business-work root | matches product Project mental model and local ownership | 2026-08-28 user approved recommendation | 一致 | confirmed | accepted handoff; current plan |
| S04 | Session grain | one Session record per durable analytical thread with immutable quick/professional mode | prevents unsafe mode conversion and preserves history | 2026-08-28 user approved recommendation | 一致 | confirmed | PX-2026-006 accepted behavior |
| S05 | Run grain | one Run per execution attempt; retry creates a new identity | preserves terminal meaning and current retry discipline | 2026-08-28 user approved recommendation | 一致 | confirmed | local-analysis spec |
| S06 | Stable identities | generated UUIDv7 for Project, Session, Conversation, Run, Fork, Subagent task, Contribution, Evidence, and Report; names/slugs never form identity | prevents path/name collisions and preserves lineage | 2026-08-28 user approved recommendation | 一致 | confirmed | current Run identity baseline |
| S07 | Session layout | `.xanthil/sessions/<session-id>/` contains `session.json`, `010_draw/`, `020_clean/`, `060_reports/` | directly satisfies the accepted per-Session data/report boundary | 2026-08-28 user approved recommendation | 一致 | confirmed | accepted handoff |
| S08 | Creation atomicity | build a same-filesystem temporary Session tree, validate it, atomically rename, then expose after readback | all three directories appear as one user-visible completeness Gate | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5 |
| S09 | Incomplete creation | incomplete Session trees are never listed; startup moves verified in-root trees to non-discoverable retained quarantine, reports creation interrupted, and never completes or automatically deletes them | selects one fail-closed recovery outcome and preserves inspection evidence | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5 |
| S10 | Retention | retain locally until explicit user deletion; no automatic expiry in first phase | avoids silent loss before deletion/recovery semantics exist | 2026-08-28 user approved recommendation | 一致 | confirmed | data-authority pending policy |
| S11 | Deletion | no in-app deletion in the first Change; external disappearance becomes unavailable, never silent recreation | keeps destructive behavior outside the bootstrap slice | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5 |
| S12 | Migration | every manifest is versioned; newer unsupported versions are read-only blocked; existing CLI Runs are neither moved nor rewritten | permits rollback and protects history | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §10 |
| S13 | Writer ownership | Application is the sole semantic writer; local Adapter performs physical atomic writes; renderer and Runtime never mutate manifests | preserves Product/Application authority | 2026-08-28 user approved recommendation | 一致 | confirmed | AGENTS.md; Orchestration.md |
| S14 | Fork relationship | Fork is a child Conversation, not a child Session; it records immutable parent Conversation message/checkpoint plus an approved `020_clean` snapshot subset and never inherits `010_draw` | preserves lineage, fixed-mode Session identity, and data minimization | 2026-08-28 user approved recommendation | 一致 | confirmed | accepted handoff; D05 §6 |
| S15 | Subagent relationship | Subagent task owns a separate Conversation in the same Session, with bounded input/output, parent source, isolated Runtime context, and idempotent return receipt | supports independent conversation without authority leakage | 2026-08-28 user approved recommendation | 一致 | confirmed | accepted handoff; D05 §6 |
| S16 | Return versus adoption | deterministic Contribution identity makes return idempotent; return records a pending parent revision, and adoption/rejection is a separate first-writer terminal with explicit reconfirmation after parent drift | prevents duplicate return, automatic merge, race-dependent authority, or silent report mutation | 2026-08-28 user approved recommendation | 一致 | confirmed | PX-2026-006 accepted behavior; D05 §6 |
| S17 | Report versioning | stable report identity plus immutable monotonic versions; lock applies to one version only | later adoption cannot rewrite historical reports | 2026-08-28 user approved recommendation | 一致 | confirmed | accepted handoff |
| S18 | Skill/Prompt reference | Run stores immutable identity/version/content hash and compatibility; no mutable latest reference | preserves reproducibility and supply-chain provenance | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §7 |
| S19 | Concurrency | one OS-user application instance; second launch routes to it; one active plus one pending Project mutation; two active Agent Runs, one per Conversation and one Subagent per source Session, plus FIFO waiting capacity eight; overflow rejects before identity/side effects | freezes admission and removes first-phase multi-process/multi-writer ambiguity | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §§5-6 |
| S20 | Backup/recovery | no automatic backup promise; atomic write/readback and startup recovery are required; user-managed Project-folder backup remains external | avoids implying unimplemented disaster recovery | 2026-08-28 user approved recommendation | 一致 | confirmed | first-phase personal boundary |
| S21 | Project bootstrap | user chooses one writable local root; `.xanthil` creation uses same-filesystem temp plus atomic rename/readback; valid existing opens idempotently; malformed/newer/unavailable blocks read-only with closed next actions | gives Project identity the same fail-closed authority as Session identity | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5 |
| S22 | Publication and cancellation | physical publication linearizes at atomic rename; semantic success publishes only after exact readback; cancellation wins before rename and committed publication wins over late cancel/UI results | establishes one testable winner for every create race | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §5; complexity-control.md |
| S23 | Python terminal storage | every Run writes only a temporary `020_clean` area; success admits within the output ceiling, while every non-success moves partial outputs to non-discoverable quarantine and never retries/promotes in place | closes later Python cleanup and evidence-admission semantics | 2026-08-28 user approved recommendation | 一致 | confirmed | D05 §4 |

## Completeness review

- Business purpose, owners, record grain, stable identities, lineage, versioning, writer/readers, admission capacity, race winners, atomicity, recovery, retention, deletion, migration, cross-platform behavior, and first/later phase classification are explicit at the product level.
- Exact fields, enums, JSON Schema, error codes, lock files, temporary names, fsync sequence, process messages, and report/event serialization are intentionally not yet approved. They are Spec/Structure outputs after overall user approval.
- No table, view, column, index, SQLite dependency, migration, or shared executable contract is authorized.

## Overall approval record

The user approved S01-S23 as one package on 2026-08-28, matching every recommendation (`一致`). The first Change may implement only S03-S13 and S19-S22 to the degree needed for Project/Session bootstrap. S14-S18 and S23 remain approved future product semantics but require their own Change-specific executable contracts.

User decision: `批准` in direct response to the complete-package approval request for `D05-XD-001` and `D05-XD-STRUCT-001` S01-S23.
