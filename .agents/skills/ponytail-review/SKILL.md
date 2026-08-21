---
name: ponytail-review
description: Review code or OpenSpec diffs only for over-engineering and identify what can be deleted or replaced with a simpler native mechanism.
---

# Ponytail Review

Review the requested diff for unnecessary complexity. Do not implement fixes.

Report one line per finding:

`<file>:L<line>: <tag> <what>. <replacement>.`

Tags:

- `delete:` dead behavior, unused flexibility, or a speculative feature;
- `stdlib:` custom code already provided by the language standard library;
- `native:` a dependency or mechanism already provided by the platform;
- `yagni:` an abstraction, mode, protocol, or future scenario without a current
  consumer or approved acceptance criterion;
- `shrink:` the same required behavior expressed with materially less code or
  specification.

For OpenSpec, map each Requirement, design mechanism, task, and test asset back
to the current objective, consumer, and acceptance scenario. Treat team,
enterprise, concurrency, recovery, audit, retry, extensibility, and new protocol
claims without an approved current need as deletion candidates.

Correctness, security, and performance defects are outside this review. Do not
remove controls required by the approved risk boundary; question whether the
boundary itself entered scope with user approval.

End with `net: -<N> lines possible.` When nothing should be cut, say
`Lean already. Ship.` and stop.
