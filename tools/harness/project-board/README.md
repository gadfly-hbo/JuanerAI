# JuanerAI Human Project Board

The board is a repository-backed, read-only human observability surface. It does not submit decisions, start Codex, execute commands, or grant authority.

```bash
node tools/harness/project-board/server.mjs
```

Open `http://127.0.0.1:41739`. Directly opening `index.html` shows a labelled static snapshot; durable state requires the server.

On macOS, double-click `Start-JuanerAI-Board.command` to start or reuse the local service and open the board in the default browser. The launcher never terminates a process occupying the configured port.

Controller examples:

```bash
node tools/harness/project-board/status-cli.mjs show
node tools/harness/project-board/status-cli.mjs set --health active --summary "Spec exploration started" --event-summary "Started product clarification"
node tools/harness/project-board/status-cli.mjs milestone --id spec_gate --status active --event-summary "Entered Spec Gate"
```

Use `replace --input FILE --event-summary TEXT` for a complete validated snapshot. Formal decisions remain in Codex CLI. `status.json` is a read model, not a replacement for OpenSpec, tests, Task Bus, evidence, or acceptance. Browser notes and exports remain local and non-authoritative.
