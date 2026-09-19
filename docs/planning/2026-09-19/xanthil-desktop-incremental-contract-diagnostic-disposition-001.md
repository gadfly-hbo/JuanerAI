# Incremental Contract 001 — Diagnostic Disposition and Read-only Review 001

## Authority and current stop

On 2026-09-19, after the Controller disclosed both the recovered historical
records and the remaining uncertainty, the user replied **“确认并授权”**.
This accepts the disclosed residual risk that prior content at the two named
temporary paths may have been overwritten/deleted, and authorizes evidence
correction and a complete **read-only** review of the existing twelve drafts.

Current disposition: **DIAGNOSTIC_RESIDUAL_RISK_ACCEPTED / READ_ONLY_REVIEW_NEEDS_FIX**.
The historical event remains a scope violation with residual UNKNOWN; it is
not retroactively safe, compliant, recovered, a successful diagnostic or PASS.
This is not an additional Spec return allowance, approval to edit Mini's drafts,
Spec Gate, Test dispatch, TDD_READY, implementation, installation, Git publication,
automatic forwarding or a product/UI/contract decision. Mini remains stopped
pending an explicit permitted next action after the review.

- Package: `PKG-XANTHIL-DESKTOP-001`.
- Change: `xanthil-desktop-membership-repurchase-decision-case`.
- Original Mini task: `纵切-1.0 / 01a0b45a-13ad-7b92-a2b4-cdde980558e1`.
- Mini branch/upstream: `work/macbook/whitepaper-blueprint-v1` /
  `origin/work/macbook/whitepaper-blueprint-v1`, unchanged.
- Mini HEAD: `0cdc3c2dfa8e3482dd3c7e6b6e55aa6bb12c0cdf`.
- Historical stop: `BLOCKED_NEW_DIAGNOSTIC_EFFECT_UNKNOWN`.
- Old Reslice Spec 1/1 and Incremental Spec 1/1 remain consumed.
  Additional Test corrections remain 0/2, max one per root cause. No budget resets.
- Spec Gate, Test, Worker and Validator have not been activated by this disposition.
  Old `CHG-xanthil-desktop-session-bootstrap` is not CLOSED.

## Evidence correction — recovered records, not replay

The source is the existing Codex Spec subtask
`01a0ba07-33c1-7d00-b5c6-30640758a26a`,
`/root/desktop_spec_incremental001_xhigh`, on the Mini host.
The Controller read historical command records without resuming that task.

| Historical record | What is now available | What it does not prove |
|---|---|---|
| `exec-50ebc90c-90d0-4010-9af5-a358278df947` | Displayed command text containing the two `tee` writes; outer exit 0; untruncated combined output with 15/91/91 text counts | Pre-write identity, each pipeline's exit, valid behavioral coverage, or authorized external writes |
| `exec-9c74db04-8dc8-482e-a965-4549f2aa8618` | Displayed `rm --` and absence-check command; outer exit 0; untruncated combined output `temporary static lists removed` | Ownership or contents before writing, recoverability, safe deletion, or no earlier overwrite |
| `exec-6b7daecf-58c8-4e53-a276-d65e4dcdaa6d` | Displayed backtick-containing search; outer exit 0; twenty `command not found` messages in retained output | Correct IPC count, individual child exits, separately captured stderr, or the complete 24861-character output; this read view is truncated |

The two disclosed paths are `/tmp/juaner-spec-acs-001.txt` and
`/tmp/juaner-trace-acs-001.txt`. Their pre-write identities remain UNKNOWN;
prior contents and symlink-related effects cannot be excluded by these records.
No claim of general filesystem harmlessness is made. No command was replayed,
and the Controller did not inspect, clean, restore or otherwise operate on
either temporary path.

The prior exception receipt and diagnostic disclosure remain unchanged.
Only their statement that the above recorded command text, outer exits and
outputs were unavailable is corrected to the extent shown here. Combined tool
output is not reconstructed into separate stdout/stderr. Missing facts stay
missing. The recovered counts are not Spec Gate or behavior evidence.

## Frozen inputs and availability

The unique Mini evidence root remains:

`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`.

Under `technical-decision-001/`:

- Original receipt `incremental-contract-exception-receipt-001.md`:
  11023 bytes, SHA-256
  `4572dc089ba842829990f6f5622d4acabe24a71148e96a1c63213ea733128fb9`.
- Stop index `incremental-contract-stop-index-001.json`:
  229492 bytes, SHA-256
  `5337aa200027236779746971a37384f2185104124fdb9361861170165c4f9ca2`.
- Original disclosure `incremental-contract-spec-diagnostic-disclosure-001.json`:
  4066 bytes, SHA-256
  `0e550658d4878585368887ea710005797e1e59dc78bc555cbbe5cc8184053fdb`.

Controller independently matched all31 current files and all31 stopped copies,
current HEAD/branch, and the original stop index. This proves file identity,
not product behavior or absence of unrelated historical side effects.

The reviewed originals are under
`technical-decision-001/incremental-contract-stop-freeze-001/openspec/changes/xanthil-desktop-membership-repurchase-decision-case/`:

| Relative file | bytes | SHA-256 |
|---|---:|---|
| `decision-brief.md` | 10642 | `f0cbbfb62b4793a1351e73d636aa9d365caba4363a53e305e0a5b70572163abe` |
| `dependency-decision.md` | 20054 | `01e7722bf3b0f0c534fd8d2964c82a369552d216af1a65dec9ee5c6bf80132fb` |
| `design.md` | 70885 | `949f0256b34ae025efe32a50ab6b0dfe41152a8c85befbc062460b3a286ee1a5` |
| `path-contract.md` | 20541 | `f15fa9492ccb4c46c8f486e198398b8863d21bf85b0e7913bf1732ebc517fec2` |
| `proposal.md` | 18202 | `b67b616e616e386e96e18c4ffd925292cd50510ef46aeda6785d8cd8eeaa53f2` |
| `specs/local-analysis/spec.md` | 8790 | `0df46cba1752104e4da2d74c6ab855eeea1fa503cbb2953e1e3d37cbdd3cfddb` |
| `specs/xanthil-desktop-decision-case/spec.md` | 31161 | `1a4627d4fbf9f584267b488b9da949ade8858dfe8623743f3a52bfe06d61f175` |
| `structure-decision.md` | 64902 | `7c86f1e1d980c095f061b36cac50b21cf6e4c103ed07a1fc1d95f0e0c87e366c` |
| `tasks.md` | 42751 | `df38358aaac3a898c20b2db3a823fea1a1c235cfa4133e6f21fdfccbb66a053b` |
| `test-plan.md` | 39047 | `187a9a6f11467520045be9975825457825c10a5fb22ad2c0706cda0ba13a3bcd` |
| `traceability.md` | 62109 | `c13c1c682be7674ee1a06b90931bd15c815f7c52199bc3400c5d5ba463c5b42d` |
| `verification.md` | 61109 | `9e922b4f0b8d8ab740a457ad79a6efc3ca78fa4466f75213a1f5862f2b1c8818` |

A proposed local byte-preserving draft copy was rejected by the safety reviewer
because the original contains provisional/historical readiness statements.
No copy was created, no changed encoding/name or indirect write was used to
bypass that refusal, and no source text was edited to make it copyable.
Review instead reads the original hash-bound Mini files directly over the
existing read-only connection. The three current stage records' BLOCKED status
and the user-authorized review boundary override stale/provisional readiness
headers. A raw header is never a current Gate verdict.

MacBook-owned durable evidence is under:

`/Users/huangbo/JuanerAI-artifacts/PKG-XANTHIL-DESKTOP-001/dependency-structure-decision-20260919/incremental-contract-disposition-001/`.

- `recovered-historical-tool-records-001.json`: 22484 bytes, SHA-256
  `ff4b593158f1fb0c582eab0c3698ac2d62f133ade0b4db036575ed34a22165ea`.
- `frozen-intake-readback-001.json`: 33769 bytes, SHA-256
  `e2ae0511269503bbf3c4bdebd0c636d12a7cbe0c48f99dc3f30568c931772997`.

Both were independently read using SHA-256, OpenSSL and byte count. No full
Mini evidence backup or complete frozen-draft copy on MacBook is claimed.
Formal Controller conclusions are stored here on the MacBook work branch;
until committed/published they remain local, not delivered Git assets.

## Read-only review result — NEEDS_FIX, not Spec Gate

The complete twelve-file package was reviewed read-only. Two independent
Controller support contexts returned NEEDS_FIX:

- `/root/incremental_contract_static_review_001`: U1/cross-layer/persistence.
- `/root/incremental_contract_test_complexity_review_001`: whole-package
  TDD/path/AC consistency and ponytail complexity.

Both used inherited model/requested R2 xhigh, not production roles. The tool
does not independently echo an effective runtime model/effort tuple. Controller
read back each finding's cited frozen text; no finding relies on the invalid
diagnostic described below. Source line numbers refer to the frozen twelve
files whose identities are above, not to later edits.

| ID | Finding and current consequence | Minimum correction within approved scope |
|---|---|---|
| F1 | `design.md:65-75,95,115` universally requires a command UUID before admission, but the six non-effecting requests at `:697-722` explicitly have no command ID. Active U1 list/open/read/wait can be incorrectly rejected, as can valid inactive requests. | Use the existing per-method request definitions for the minimal envelope: CV-only for those reads and CV + validated command ID only where it already exists; then active-route full validation. Do not add public fields. |
| F2 | `design.md:101-106,373-378,397-400,483-501,655-660` leaves the real read edges implicit: ProjectOpenValue requires sessions absent from Store.openProject's result; openSession has only project/session while readProjection requires case/current-revision too. | Add the actual Store.listSessions reads and authoritative current-ID mapping to the U1 closure, with existing not-found/stale/error translation. No new Port or UI cache authority. |
| F3 | `design.md:23-41` freezes completed I1 and partial micro-loop additions, but not which public routes are active at each M1 prefix. Test/Worker must infer whether early list/read routes execute or refuse. | One compact M1.1–M1.5 table: active public methods/tag, separate exact Application/Store calls and dependencies; all other methods use the already-defined refusal. Not a 100-row framework or runtime selector. |
| F4 | `test-plan.md:79-114` and `tasks.md:109-123` allow later E2E RED against an old package missing its already-GREEN prerequisites: U1.5 gets U1.1 rather than U1.4; U3.3 gets U2.4 rather than U3.2; U4.3 gets U3.3 rather than U4.2. Failure would not be causal for the target loop. | Before those three REDs, package/freeze the required already-GREEN predecessor (U1.4/U3.2/U4.2) as health input. After Worker, package and run E2E GREEN on the new source. Packaging itself never supplies RED. |
| F5 | `test-plan.md:75-76,103,109,624-629` requires final CF retirement but gives its XCLI-021/runner paths only health checks, outside U4.3's R/G file list. An oracle requiring CF either fails the health gate too early or never proves removal of C1a–C3 acceptance. | Add a named restoration-contract RED/GREEN in the already-approved test paths, separate from passing environment health; preserve final exact P4/P5 and full-runner proof. No new harness or allowance. |
| F6 | `test-plan.md:39-58` forbids bare node/npm, while its still-active GREEN list at `:591-604` uses them and a bare runner. These competing executable instructions repeat the known environment ambiguity. | Replace the redundant list with references to the existing frozen command IDs and exact argv/cwd/env envelope. No dependency/toolchain change. |

F1–F5 concern contract closure or causal testability. F6 is command/document
consistency, not a new product decision or toolchain defect. Stale readiness
headers are a separate bookkeeping item: retain historical copies and make the
current verdict consistent when a later authorized role updates the drafts.
They are not counted as another product blocker.

Positive static checks: the full-schema/read-all-tables admission boundary,
native hot-journal exception, COMMIT-unknown handling, forward reopen and final
I4 restoration showed no further same-level contradiction on this review.
The 79 Desktop and12 compatibility ACs have mapped assertions/oracles and
final/manual checkpoints; that is test-plan review, not executed coverage.
The nineteen non-Spec files match their pre-Spec hashes. Native test-control
implementation remains safely deferred to Test/Worker.

### Ponytail result and limits

The complete-package complexity review returned **“Lean already. Ship.”**
This narrowly means no additional over-engineering deletion finding; it does
not approve shipping, production readiness or Spec Gate. Correctness findings
F1–F6 remain. Retain the existing modules and loops; do not respond by adding
another registry, process framework, new product plan or broader safety scope.

### Review diagnostic deviation — excluded

The second support reviewer used backticks around HOME in one remote grep
pattern despite its brief's no-backtick instruction. The submitted command and
displayed output are retained in `review-diagnostic-disclosure-001.json` under
the MacBook evidence root above. The display includes
`zsh:1: command not found: HOME`; the reviewer did not retain numeric outer
exit/signal or separate stderr. They remain UNKNOWN, not inferred as zero.

Controller stopped further reviewer commands; no replay, cleanup or attempt to
inspect temporary files followed. The disclosed command consists of a scoped
directory change, reads of the frozen test-plan, and the unintended HOME lookup.
It specifies no file write/delete or product/Provider operation. This supports
excluding an unusable read diagnostic; it is not a blanket host-side-effect
audit, a new risk waiver or evidence that every command complied with the brief.
The previous user risk acceptance applies only to the earlier disclosed incident.

Every accepted finding was independently checked against the already hash-bound
source text and valid earlier fixed reads. This erroneous grep is not used as
evidence for any finding, PASS, output count or lifecycle decision.

## Minimum return point — no extra Spec allowance yet

The authorized evidence correction and read-only review are complete.
Current Controller result is **DIAGNOSTIC_RESIDUAL_RISK_ACCEPTED /
READ_ONLY_REVIEW_NEEDS_FIX**. Mini's actual last-confirmed state remains stopped;
this local record has not been sent or adopted and cannot change it remotely.

Recommended next decision, not current permission: authorize one **targeted**
formal Mini Spec correction covering only F1–F6 and current-status consistency
within the same twelve Markdown files. Preserve the product/UI, final91 AC,
Run3.0, full schema, dependency and tool permissions. Then review the affected
diff and pass the real Spec Gate before any Test. Do not rewrite the whole plan,
reopen completed WIP/P1–P4, reset historical budgets or spend Test quota on Spec.
Extra Test remains0/2. Until separately authorized and handed off, no Spec
correction, Test, Worker or Validator is released.

This turn does not authorize commit/push, a new task, automatic messaging,
production execution or a new Gate waiver. Formal conclusions are local
uncommitted Controller records until a later authorized Git publication.
