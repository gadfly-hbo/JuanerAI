# Engineering workflow correction

## Requirements and acceptance

- FLOW-01: Mini uses main Agent Sol/medium and independent read-only Validator
  Sol/high only. Retired or renamed `juaner_*` helpers fail config checks;
  MacBook shared model/sandbox/concurrency remain unchanged.
- FLOW-02: Non-trivial behavior work retains current proposal/input reference,
  OpenSpec behavior specs, tasks, verification and necessary design. Actual
  causal RED precedes dependent production implementation; GREEN/regression and
  REQ/AC traceability remain. File existence does not prove semantic acceptance.
- FLOW-03: The end check only reads existing schema-valid status and referenced
  local materials. Manual checking reports CONTINUE, STOP or UNKNOWN and missing
  materials without executing work, granting authority or writing any file.
- FLOW-04: Native Stop may request one bounded continuation only for a status
  explicitly bound to BOTH the current session and turn as
  `mini-engineering:<session_id>:<turn_id>`, active/validating, in IMPLEMENTATION,
  REGRESSION or VERIFY, with no blockers. Other sessions, turns, unknown state,
  explicit waiting/blocked/complete, Interrupt and repeated Stop pass through.
  No host IDs means no automatic continuation; manual checks still apply.
- FLOW-05: Parent-checkout sessions may resolve an exactly matching state in
  registered Git worktrees, read-only. Ambiguous matches, invalid input/status,
  symlinked or oversized state/materials never authorize automatic work.
- FLOW-06: No command copied from status/evidence is executed. Output uses fixed
  instructions and missing material categories, not raw status/private content.
  The host must review/trust the exact hook; delivery alone is not live adoption.
- FLOW-07: UserPromptSubmit may expose host-provided session/turn binding to a
  Sol primary as read-only context. It does not inspect/store the user prompt,
  bind/write state, approve intake or start/resume work. Astra MacBook prompts
  receive no added context. Invalid IDs are ignored.

Public test seams: actual config-check CLI, existing CI classifier CLI, and the
new end-check CLI/Stop JSON interface. These are within the approved tooling
scope; not a new product/UI Gate. Synthetic isolated repositories only.
