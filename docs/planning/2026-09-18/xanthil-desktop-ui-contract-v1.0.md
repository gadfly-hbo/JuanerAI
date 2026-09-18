# Xanthil Desktop UI Contract v1.0

> Historical base notice (2026-09-18): the detailed first-slice business,
> data, state and recovery rules remain the v1.1 base. Sections 5, 10, 11, 12
> and 13 are amended by
> [UI Contract v1.1](./xanthil-desktop-ui-contract-v1.1.md). The v1.0 statement
> that quick/pro mode and Fork/Subagent are UI non-goals is no longer current.

## Document control

| Field | Value |
|---|---|
| Parent plan | [JuanerAI Product Development Blueprint v1.0](./juanerai-product-development-blueprint-v1.0.md) |
| Version | `1.0` |
| Status | Development-readiness Review 002 PASS; frozen for clickable UI creation; user UI Gate not yet completed |
| Product surface | Xanthil Desktop Free |
| First task | Membership repurchase diagnosis Decision Case |
| Audience | Non-technical membership-operations analyst or business analyst |

## 1. Contract purpose

This document defines what a non-technical user must see, understand, control, and complete in the first Xanthil Desktop vertical slice.

It governs both:

1. the high-fidelity clickable UI Contract used for the user UI Gate; and
2. the later production Desktop UI used for integrated technical acceptance.

The clickable UI may use synthetic data and simulated execution only when the simulation is unmistakably labeled. The production UI must consume real local product behavior and may not reuse a simulated state as proof.

## 2. User and job

The user is responsible for membership operations or business analysis but is not required to know programming, SQL, Python, schemas, hashes, Runtime terminology, or statistical implementation details.

The job is:

> Determine whether the current period's repurchase rate is below a comparable earlier period, understand which confirmed member segment contributes to the repeat-revenue change, decide what should be validated next, and preserve a reviewable Case.

The UI succeeds only when the user can complete this job without opening a terminal or reading source code.

## 3. Product language

The primary UI uses business language:

- “分析案例” instead of internal Case serialization terms;
- “我要验证什么” instead of prompt or Contract payload;
- “数据范围与口径” instead of raw Binding/IR terminology;
- “支持证据 / 反证与其他解释 / 当前判断” instead of evaluator internals;
- “下一步候选” instead of strategy execution;
- “技术详情” for optional Contract, IR, SQL, Python, hashes, Runtime, and logs.

Technical objects retain their formal identity in the evidence drawer and exported provenance, but the main path never requires the user to edit JSON or code.

## 4. Supported first-slice boundary

- Platform: macOS only.
- Files: exactly one UTF-8 `members.csv` and one UTF-8 `orders.csv`.
- Currency: `CNY` only.
- Time zone: `Asia/Shanghai` only.
- Analysis mode: hypothesis-first, supervised, local by default.
- External model: optional and separately authorized per call.
- Action execution: absent.
- Outcome claim: absent.

Unsupported formats, encodings, platforms, currencies, or tasks are rejected with a plain-language explanation and a later-scope label.

## 5. Information architecture

The first slice uses one guided task surface. It does not expose quick/pro mode switching.

Persistent frame:

- top bar: product, current Case name, local/offline/model-exposure status, save state;
- left rail: Case list and current six-step progress;
- main workspace: current step and primary action;
- right evidence drawer: optional provenance and technical details;
- bottom status area: active local run, cancellation, last stable state, and recovery action.

The six user steps are:

1. New Case
2. Import and understand data
3. Confirm hypothesis and plan
4. Run analysis
5. Review evidence and judgment
6. Compare candidates and preserve the Case

## 6. Screen and interaction contract

### 6.1 New Case

The user:

- names the Case;
- writes in natural language what they want to verify;
- sees that raw files remain local by default;
- sees whether an external model is configured;
- can continue without an external model.

The UI must not ask for provider, Runtime, Contract, IR, or database terminology on this screen.

### 6.2 Import and understand data

The user selects or drops `members.csv` and `orders.csv`.

The UI presents:

- filename, byte size, row count, columns, and import status;
- data-quality issues grouped as blocking or reviewable;
- business-field mapping for member ID, optional group, order ID, member ID, paid time, amount, order status, and currency;
- exact `CNY` and `Asia/Shanghai` scope;
- comparison and current-period date pickers;
- explicit valid-order-status selection;
- a summary of what will be snapshotted.

Parsing and mapping rules:

- CSV uses comma separation, one unique non-empty header row, RFC 4180 double-quote escaping, and LF or CRLF; a UTF-8 BOM is accepted and removed.
- Invalid UTF-8, malformed quoting, unequal column counts, or duplicate/empty headers reject the import rather than skip rows.
- IDs and statuses are exact case-sensitive strings; they are not trimmed, case-folded, or converted to numbers. Leading zeroes remain significant.
- Empty or duplicate member/order IDs and unknown order member references are blocking.
- Currency must be exactly `CNY`; other or mixed values are blocking.
- Amount must be positive with at most two decimals. It is converted to integer fen without rounding. Out-of-range values are blocking.
- `paid_at` is ISO 8601 date-time. Offset values are converted to `Asia/Shanghai`; offset-free values must resolve to exactly one instant in the recorded time-zone database.
- The two periods use local-midnight `[start, end)` boundaries, are non-overlapping, and contain the same number of local calendar days.

Import authority and issue classes:

- Selecting a local file does not prove authority. Before snapshot creation, the user must confirm: “我有权将这两份本地数据用于本次分析”. The revision records the confirmation time, source display names, fingerprints, mapping, included/excluded counts, and confirmed business definitions. It never claims legal ownership or broader reuse permission.
- Blocking issues are malformed or unsupported CSV, invalid UTF-8, duplicate or empty headers, unequal columns, missing or duplicate required IDs, unknown order-member references, invalid or ambiguous time, non-`CNY` or mixed currency, invalid or out-of-range amount, an unconfirmed required mapping, overlapping or unequal periods, or no valid row after the confirmed filters. Snapshot creation remains disabled.
- Reviewable issues are rows outside both periods, statuses excluded by the user's valid-status selection, missing optional group values, leading or trailing whitespace preserved in exact IDs or statuses, unmapped extra columns, and equal `paid_at` values resolved by the documented order-ID tie-break. The UI shows affected counts and the exact include, exclude, or tie-break treatment.
- Reviewable issues require one explicit “我理解并接受以上处理” confirmation for that Draft revision. Changing a mapping, filter, period, or issue treatment invalidates the confirmation and creates a new Draft revision.

After confirmation, the product creates an immutable local snapshot and displays its short identity. Full SHA-256 and file details remain in the evidence drawer.

### 6.3 Confirm hypothesis and plan

The first-slice formal hypothesis is fixed as:

> H1: 当前期会员复购率低于对比期。

The UI shows one hypothesis card with:

- target population;
- current and comparison periods;
- supporting-evidence condition;
- refuting condition;
- alternative explanations;
- evidence-sufficiency rule;
- possible result: Confirmed, Rejected, or Inconclusive.

The user may edit the Case question, hypothesis display title, business context,
and alternative explanations. The user may not change the formal target,
metric, comparator, or judgment rule in this slice; such a request is labeled
unsupported rather than converted into a different computation.

The visible default judgment rules are:

- `Confirmed` when both periods have at least one Active Member, the primary and independent results agree, and current Repurchase Rate is lower than comparison Repurchase Rate;
- `Rejected` when both periods have at least one Active Member, the two implementations agree, and current Repurchase Rate is equal to or higher than comparison Repurchase Rate;
- `Inconclusive` when either period has zero Active Members, so the comparison rate cannot be interpreted. The verified counts and limitation remain visible;
- validation mismatch, calculation failure, cancellation or deadline does not produce an Inconclusive Finding: it produces no new Finding and follows the failure matrix.

This is a descriptive comparison, not a significance test or causal claim. No
minimum sample threshold is silently added. The UI displays both denominators
and this limitation before Finding acceptance.

The user reviews a plain-language analysis plan:

- which data is included;
- the confirmed business definitions;
- what will be calculated;
- whether segment contribution applies;
- what the method can and cannot prove;
- what information, if any, will be sent to an external model.

The user can edit business fields through forms. Contract, Binding, and IR are generated and versioned behind the form. Their structured representation is available only in technical details.

Any change that affects computation creates a new Draft revision and requires confirmation. It never rewrites an earlier revision.

### 6.4 Run analysis

The primary screen presents business-level progress:

1. verifying the immutable snapshot;
2. preparing local calculation;
3. running primary calculation;
4. running independent verification;
5. assembling evidence and judgment.

The user can cancel. The UI shows deadline, failure, interruption, or validation mismatch without terminal output by default.

For every failure the UI states:

- what happened;
- what did not happen;
- whether prior Case history remains safe;
- the permitted next action.

SQL, Python, Runtime identity, exact error, settlement ledger, and hashes are available in technical details.

### 6.5 Review evidence and judgment

The primary evidence view contains:

- current and comparison active-member count;
- repeat-member count;
- repurchase rate;
- repeat revenue;
- absolute and applicable relative change;
- optional segment repeat-revenue contribution;
- supporting evidence;
- refuting evidence and alternative explanations;
- limitations;
- the H1 judgment: Confirmed, Rejected, or Inconclusive.

Method contract:

- Each period is calculated independently.
- Active Member: at least one valid order in the period.
- Repeat Member: at least two valid orders in the period.
- Repurchase Rate: Repeat Member count divided by Active Member count.
- Repeat Revenue: for every member, the sum of the second and later valid orders in that period.
- Orders are sorted by paid time, then by the unsigned-byte lexicographic order of the original UTF-8 order ID.
- M1 compares the two periods.
- M2, when the user selected one member group, reports each group's current Repeat Revenue minus comparison Repeat Revenue. Group contributions must sum exactly to the total change.
- M2 is `not_applicable` when no group was selected.
- Structural contribution is not presented as a causal root cause, causal increment, or action effect.
- Any primary/independent mismatch prevents a successful Finding.

### 6.6 Compare candidates and preserve the Case

To complete the Case the user chooses one closure:

1. compare at least two DecisionCandidates and optionally mark exactly one as “优先验证”, recording the reason; or
2. record “证据不足 / 暂不选择” with a reason.

Every candidate includes:

- evidence basis;
- refutation or risk;
- applicability conditions;
- a future validation metric.

Candidates are always available as user-authored forms. The user may add,
edit, duplicate, or remove Draft candidates. Optional model assistance can only
create a visibly labeled Draft that the user must review; it cannot create a
closure. A valid candidate requires all four fields above. The comparison route
requires at least two valid candidates; at most one may be marked “优先验证”.
The insufficient-evidence route requires a non-empty reason and no preferred
candidate.

In Review, the user first selects “接受本次分析结果”, after seeing the evidence,
limitations, and judgment. This appends a Finding-acceptance record; it does not
authorize an Action. After a valid candidate comparison or insufficient-evidence
closure exists, “完成分析案例” becomes enabled. That action appends the Decision
Closure and completion record and moves the revision to Completed. Back or
Close before either action preserves the revision in Review without silently
accepting or completing it.

“优先验证” is not approval, Action, or execution permission.

The user can:

- save and close;
- reopen without changing history;
- rerun the same snapshot;
- import a new snapshot to create a new Draft revision;
- export local UTF-8 Markdown and self-contained HTML.

Exports include Case/revision/Run identity, question, source display names and fingerprints, mapping and business definitions, plan, method version, actual calculation code, results, evidence/refutation/limitations, judgment, candidates/closure, provenance, timestamps, and integrity manifest. Technical material is placed after the business report. Review exports are marked `UNACCEPTED`; integrity-blocked exports are marked `INTEGRITY_BLOCKED` and omit damaged bytes.

## 7. Model-exposure interaction

The first slice exposes exactly three optional assisted actions. None is
automatic and none is required to complete the Case.

| User action | Allowed draft | Payload categories shown before confirmation | Refusal or provider failure |
|---|---|---|---|
| “帮我整理问题” on New Case or Confirm Plan | Case question, display title, business context and alternative explanations; never the fixed method or judgment rule | User-authored text plus selected period labels and aggregate column names | Return to the same editable form with its prior contents intact |
| “帮我解释证据” in Review | Plain-language explanation of already verified aggregates, refutation prompts and limitations | Verified aggregate metrics, pseudonymous segment aggregates, method label and user-authored context | Keep the verified evidence visible and let the user write or skip the explanation |
| “帮我起草候选” after Finding acceptance | One or more visibly labeled Draft candidates | Accepted Finding, limitations, aggregate evidence and user-authored context | Open empty manual candidate forms; insufficient-evidence closure remains available |

Every generated value remains Draft until the user explicitly confirms or edits
it. Model output can never change source data, mapping, method, computed values,
judgment, acceptance, preferred candidate, closure, Case state, or Run state.

Before every external model call, the UI displays:

- provider and model;
- the exact payload;
- categories included;
- the fact that already-sent content cannot be retracted;
- estimated or provider-reported cost information when available.

Automatically selected data never includes raw rows, file contents, absolute paths, member/order IDs, original group values, credentials, or unselected logs. Group aggregates use a revision-local pseudonym that is not reused across Cases or revisions.

User-authored free text is a separate category. It is shown byte-for-byte and requires a second confirmation that it may contain sensitive business content. Refusal causes zero network activity and returns to the complete manual path.

## 8. State, history, and integrity presentation

User-facing Case states map to the formal revision states:

- Draft: still being configured;
- Ready: confirmed and ready to run;
- Review: a verified result awaits user review;
- Needs attention: no accepted result exists and the latest attempt needs recovery;
- Completed: an accepted Finding and Decision Closure exist.

Run states are Running, Succeeded, Failed, or Cancelled.

The clickable Contract uses the following transition table:

| From | User or system event and guard | Run result | Revision state and history effect | Back or recovery behavior |
|---|---|---|---|---|
| none | New Case | none | Create Draft revision | Close preserves Draft |
| Draft | Confirm authority, blocking issues absent, reviewable handling confirmed, mapping, period, H1 and plan confirmed | none | Ready; append confirmation record | Back to edit creates a new Draft revision; prior revision remains readable |
| Ready | Start analysis | Running | Remain Ready while one active Run exists | Cancel requests cancellation; no second Run may start |
| Ready | First Run succeeds and both implementations agree | Succeeded | Review; append immutable reviewable Finding | Return to Review after close and reopen |
| Ready | First Run fails, is cancelled, times out, is interrupted, or mismatches | Failed or Cancelled | Needs attention; append attempt only, no Finding | Use the failure matrix; retry creates a new Run |
| Needs attention | Retry after the listed recovery guard is satisfied | Running | Remain Needs attention until success | Prior attempts remain visible |
| Needs attention | Retry succeeds and agrees | Succeeded | Review; append immutable reviewable Finding | Return to Review after close and reopen |
| Review | Accept Finding | none | Remain Review; append Finding acceptance | Acceptance is not completion and is never silently inferred |
| Review | Accepted Finding plus valid Decision Closure; choose Complete | none | Completed; append closure and completion record | Reopen remains Completed and read-only except explicit rerun or new revision |
| Review or Completed | Edit any computation-affecting input or import a new snapshot | none | Create a new Draft revision; old revision is unchanged | User can return to old history |
| Completed | Rerun the same snapshot and revision | Running | Remain Completed; old accepted Finding remains current while the new Run is pending | Cancel or failure leaves Completed unchanged |
| Completed | Rerun succeeds and agrees | Succeeded | Remain Completed with a new reviewable Finding marked pending review | Accepting it appends a new acceptance; closing leaves the prior accepted Finding current |

The UI must preserve these rules:

- one active Run per revision;
- a later failed or cancelled Run never hides or downgrades an earlier successful Finding;
- a Completed revision remains Completed while later reruns are pending review;
- an interrupted Running Run is never silently resumed after restart;
- retry creates a new Run;
- accepted Findings and acceptance changes remain append-only history;
- integrity failure adds `integrity_blocked`, preserves readable history, and prevents run or acceptance until a new snapshot/revision is created.

## 9. Required visible failure paths

The clickable UI Contract and production UI acceptance cover at least:

1. malformed or unsupported file;
2. missing/duplicate ID or unknown member reference;
3. invalid time, non-CNY, or invalid amount;
4. unconfirmed business mapping or period;
5. declined model exposure with successful manual continuation;
6. provider failure with successful manual continuation;
7. local calculation failure;
8. primary/independent validation mismatch;
9. user cancellation;
10. deadline exceeded;
11. process interruption and restart recovery;
12. snapshot or immutable evidence tampering;
13. a rerun that fails without overwriting an earlier accepted result.

No failure path may display a successful Finding, candidate, export, or history update that did not occur.

The clickable Contract must implement this recovery matrix:

| # | Failure class | What remains safe and visible | Allowed next action | Target after recovery |
|---|---|---|---|---|
| 1 | Malformed or unsupported file | Existing Case history; rejected file is not snapshotted | Replace the affected file | Draft import review |
| 2 | Missing or duplicate ID, or unknown member reference | Existing Draft inputs and issue counts | Correct and reselect the file | Draft import review |
| 3 | Invalid time, non-CNY, or invalid amount | Existing Draft inputs and blocking-row counts | Correct and reselect the file; unsupported currency cannot be overridden | Draft import review |
| 4 | Unconfirmed authority, mapping, issue handling, or period | Files remain selected but no Ready revision exists | Complete the missing confirmation | Ready when every guard passes |
| 5 | Model exposure declined | All local form values and data remain intact; zero network activity | Continue manually or cancel the assisted action | Same screen and revision state |
| 6 | Provider failure | Local state and any pre-call user text remain intact; no model draft is accepted | Continue manually or retry through a new disclosure | Same screen and revision state |
| 7 | Local calculation failure | Snapshot, Ready revision and prior history remain safe; no new Finding | View the plain-language error, then retry a new Run or create a new Draft | Needs attention until retry success |
| 8 | Primary or independent validation mismatch | Both result identities and mismatch notice are visible in technical details; no Finding | Retry unchanged inputs or create a new Draft; mismatch cannot be overridden | Needs attention until an agreeing Run succeeds |
| 9 | User cancellation | Snapshot, revision and prior Findings remain safe; cancelled attempt is recorded | Retry as a new Run or close | Needs attention for the first result; Completed stays Completed on rerun |
| 10 | Deadline exceeded | Same preservation as cancellation; timed-out attempt is terminal | Retry as a new Run or close | Needs attention for the first result; Completed stays Completed on rerun |
| 11 | Process interruption and restart | Last durable state and interrupted attempt are visible; Running is not resumed | Mark the attempt failed, then explicitly retry | Needs attention for the first result; Completed stays Completed on rerun |
| 12 | Snapshot or evidence tampering | Readable history and integrity details remain visible; damaged bytes are not treated as valid | Create a new snapshot and revision, or export the marked integrity-blocked report | Draft new revision; old revision remains integrity-blocked |
| 13 | Failed rerun after earlier acceptance | Earlier accepted Finding, closure and Completed state remain current | Retry again, inspect failure, or close | Completed remains Completed |

## 10. Research Demo adoption boundary

### Adopt from PX-2026-001/002

- hypothesis-first human workbench;
- evidence/refutation/alternative-explanation review;
- multi-hypothesis symmetry and supplemental investigation as interaction principles;
- Human Owner confirmation;
- immutable Case and evidence identity;
- real browser action driving real local state, restart recovery, and fail-closed mismatch handling.

Do not adopt Semantica, Ontology Hub, dual-library infrastructure, the full strategy/outcome loop, historical commands, or internal state numbering.

### Adopt from PX-2026-004/006

- Desktop workbench composition and visible guided progress;
- hypothesis cards, evidence cards, failure closure, reports, history, and recovery;
- natural-language entry, inline capability cards, visible data boundary, and evidence drawer.

Do not adopt dual-mode switching, Fork/Subagent, simulated timers, fixed reports, or Demo implementation code.

The adoption bullets in this section and in the parent Blueprint are the complete
binding Demo-derived input for the clickable Contract. Access to the research
repository or Demo implementation is not required. Unstated Demo pixels,
components, wording, state machines, and code are not requirements; visual
design choices remain subject to the user UI Gate.

## 11. UI acceptance criteria

The clickable UI Contract must demonstrate, with clearly labeled synthetic data:

- the complete six-step happy path;
- every required visible failure class;
- business-language comprehension without technical details;
- the advanced evidence drawer without making it mandatory;
- no ambiguity between simulated and real behavior;
- 1440x900 and 1366x768 layouts;
- keyboard completion of the primary path;
- visible focus, status, error, and recovery behavior.

The user UI Gate uses these observable scenarios:

1. Without opening technical details, the user completes the six-step synthetic happy path, states the two repurchase rates and denominators, identifies the judgment and one limitation, accepts the Finding, completes one of the two closure routes, closes and reopens the Case, and finds the export.
2. The user declines “帮我整理问题”, completes the same task manually, and observes that no network call or blocked step is claimed.
3. The user repairs one blocking import example, confirms one reviewable issue treatment, and reaches Ready without editing JSON, SQL, or code.
4. The user walks through every failure-matrix row and can select the documented recovery action; the resulting screen and state match the matrix and no false success artifact appears.
5. The user completes the primary path by keyboard at 1440x900 and 1366x768 with visible focus, no hidden required control, and no unlabeled simulated behavior.

PASS requires all five scenarios to complete as written and the user to confirm
that the main path is understandable without the technical drawer. Any required
Controller explanation, hidden technical action, ambiguous simulated state, or
incorrect recovery state is a UI Gate failure to correct before OpenSpec.

The production UI acceptance later requires:

- the same path through the actual Desktop public entry;
- real imported files and snapshots;
- real local computation and independent validation;
- UI identities and results matching underlying immutable evidence;
- no fixture replay or unlabeled stub;
- technical Validator evidence plus separate user acceptance of the actual UI.

## 12. Non-goals

- Semantica and Ontology Hub;
- quick/pro dual-mode switching;
- Fork/Subagent;
- autonomous exploration and deep research;
- strategy approval or execution;
- real Outcome or feedback learning;
- OSM, Workspace, enterprise governance, Model Pack, arbitrary code, Windows, additional formats, marketplace, or billing.

## 13. Next Gate

Independent development-readiness Review 001 returned `NEEDS_CLARIFICATION`; the corrected package received a fresh Review 002 `PASS`. The next Gate is creation and user review of the high-fidelity clickable UI Contract. This PASS does not authorize production implementation, OpenSpec, dependency installation, real provider use, real data, user research, or release.
