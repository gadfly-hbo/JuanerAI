# Project Board Observability

## Why

The human user needs a durable, next-day view of JuanerAI progress without continuously interpreting agent terminal output. The standalone board is useful visually, but browser-local state cannot represent authoritative repository progress.

## Goal and Scope

Provide a local, read-only project board that renders Controller-maintained progress, evidence, risks, agent state, history, and decision briefs from closed, versioned repository records. Add atomic Controller status tooling and a loopback-only read server.

## Out of Scope

- Submitting user decisions from HTML.
- Starting Codex or other agents, executing commands, or granting authority.
- Product implementation, Task Bus activation, Git operations, deployment, authentication, or external network access.

## Risk and Dependencies

R1 local developer tooling using the existing Node.js runtime. Primary risks are stale status, path traversal, accidental browser write authority, and conflating display state with engineering evidence.

## Paths

Allowed: `tools/harness/project-board/**`, `.juanerai/project-control/**`, `openspec/changes/project-board-observability/**`, and the Human Project Board section of `AGENTS.md`.

Forbidden: Xanthil product implementation, package contracts, deployment profiles, Task Bus state, secrets, external systems, and Git history.

## Activation, Rollback, and Evidence

Activate by starting the loopback server. Roll back by stopping it; JSON records remain readable and there is no external state to reverse. Local contract, negative-path, CLI, HTTP, browser, responsive, and accessibility evidence is required before acceptance.
