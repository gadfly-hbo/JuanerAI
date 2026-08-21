# Cancelled Project-Board Transaction Design Retrospective

## Outcome

`project-board-atomic-transactions` was cancelled on 2026-08-21 before
acceptance, archive, or live activation. No revision-1 transaction or
`transactions/` authority existed in the real project board. Its production
diff, transaction schemas, focused tests, and active OpenSpec package were
therefore safely removed rather than migrated.

The approved replacement direction is recorded in
`openspec/changes/project-board-status-authority/structure-confirmation.md`:
`status.json` is the sole current-state authority; events are best-effort
non-authoritative history; Controller is the only supported writer; the browser
remains read-only.

## Why It Was Stopped

The board is a local human observability surface, not an audit system. The
transaction proposal introduced revision sequencing, hash chains, activation
baselines, staging publication, compatibility projections, recovery semantics,
and concurrent-writer linearization. Independent validation then exposed a
successive-revision projection race, and the correction loop required
increasingly implementation-sensitive FIFO process orchestration.

That complexity did not protect a supported product scenario: concurrent
Controllers are outside the board contract. Because the protocol was still
unactivated, continuing would have spent more cost defending an unnecessary
assurance level while making later removal harder.

## Controls That Worked

- The one-commit activation point kept experimental authority out of the real
  board until acceptance.
- Independent Validator review found a race that the first GREEN suite missed.
- The complexity stop line exposed repeated Spec/Test/Worker correction as a
  root-cause signal rather than normalizing the repair loop.
- User review reclassified the board's actual assurance and concurrency needs
  before revision 1 existed.

## Reusable Lessons

1. Classify an internal tool's assurance level before designing persistence.
   Atomic replacement of one authoritative snapshot is enough for a
   single-writer, non-audit read model.
2. Do not solve unsupported concurrency. A sole-writer contract is a valid
   boundary when ownership is explicit and external effects are low risk.
3. Separate current state from history by authority, not by machinery. A
   best-effort event can aid observation without becoming a recovery log.
4. Define an activation point for risky infrastructure changes. The absence of
   live activation made full rollback cheap and evidence-based.
5. When tests require increasingly elaborate scheduling to protect a
   non-required scenario, return to product scope instead of refining the
   harness indefinitely.

## Deferred Work

- The replacement Change still needs a complete Spec package, Spec Gate,
  focused RED, minimum Worker change, regression, fresh Validator, acceptance,
  and archive.
- The canonical validation runner remains a separate later Change.
- TypeScript migration remains deferred by user direction.
