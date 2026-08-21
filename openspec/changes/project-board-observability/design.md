# Design

## Boundary

```text
User <-> Codex CLI -> Controller records -> local read-only server -> HTML board
```

There is no HTML-to-Codex decision or execution path. Browser preferences and notes are explicitly non-authoritative.

## Records

- `.juanerai/project-control/status.json`: replaceable current read model.
- `.juanerai/project-control/events/*.json`: immutable material-transition records.
- `.juanerai/project-control/decision-briefs/*.json`: display records for decisions handled in CLI.

All records use closed schema version `1.0`. The Controller writes through `status-cli.mjs`, which validates records and uses temporary-file plus rename replacement. The server supports GET and HEAD only, binds to `127.0.0.1`, validates Host and Origin, and exposes no general filesystem route. Documents are read only through a brief ID and reference index.

Invalid records fail closed. Direct `file://` opening uses a labelled static snapshot. State older than 24 hours is marked as possibly stale. The board never overrides OpenSpec, tests, repository evidence, a CLI user decision, or Controller acceptance.

This is a greenfield control surface. Browser decisions are not migrated. Schema changes require a versioned contract change. Rollback stops the server without deleting records.
