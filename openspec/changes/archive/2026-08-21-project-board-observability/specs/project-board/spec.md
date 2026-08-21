# Project Board Specification

## PB-REQ-001 Durable State

The system SHALL persist versioned current status, immutable material-transition events, and display-only decision briefs. Restarting later SHALL render the last valid Controller state. Unsupported, unknown, malformed, or invalid records SHALL fail closed. **PB-AC-001**

## PB-REQ-002 Read-Only Browser Boundary

The server SHALL bind to loopback and expose only the reads needed for approved records and referenced documents. Browser requests SHALL NOT change files, execute commands, start agents, access arbitrary paths, or reach external systems. Invalid Host, Origin, method, brief, and reference inputs SHALL be rejected. **PB-AC-002**

## PB-REQ-003 Human Comprehension

The board SHALL show phase, milestones, objective, next action, blockers, agents, evidence, risks, history, and decision context. Repository, static, unavailable, and stale states SHALL be distinct. Decision briefs SHALL direct formal decisions to Codex CLI. **PB-AC-003**

## PB-REQ-004 Controller Updates

The system SHALL provide an atomic, validated CLI for snapshot, phase, milestone, event, and decision-brief display changes. Material mutations SHALL append history and reject invalid inputs without partial writes. **PB-AC-004**

## PB-REQ-005 No Decision Submission

The HTML board SHALL NOT submit, approve, claim, or execute a user decision. Browser notes SHALL remain local and non-authoritative. **PB-AC-005**
