# D0 reconciliation and product-side integration preparation

Approved task: PI-HARNESS-FIRST-LOOP-20261017, joint plan v0.2.
See spec.md for authority/scope and verification.md for the sole current result.

## Historical intake baseline and receipts (before fixed .2 delivery)

- Mini source HEAD `081031af8c17242f93c94f8f5b4d035328bc9a36`,
  tree `8b06db5fa84ce87a202b0a63c5a0c2f10a5c13a3`.
  Independent branch `work/mac-mini/pi-harness-first-loop-20261017`.
  Review tree ad70 and all paused task worktrees are not implementation targets.
- At original intake root package/lock pinned formal SDK 0.5.1, 148236 bytes/SHA-256
  `3af3f895a2466b7947b9b9b0025231f856e3a5c4773782c9dabd460e924bfad9`.
  Offline scripts-off installation in this tree: 53 installed SDK files match
  that tgz. ESM resolution/content are baseline evidence, not new SDK adoption.
  Root lock SHA-256 remains
  `487b964ea8638697062a7a822921e897c26ce83113cdd84d5681d62e4baf5a45`.
- Historical 0.5.2-parameters.1: 150595 bytes/SHA-256
  `7436a572bf03fc0eb6de84363a8a2233f7f5ca3fa197320c2251ee83ca88bc66`.
  Its six real source delta files match the attached identity; Apple metadata
  entries are not source changes. Expanded only as historical data, never
  installed/imported. Existing prepareToolArguments directly reuses Pi's
  validator; do not recreate it or confuse it with edit.prepareArguments.
- Core/AI stay 0.86.1; retained coding-agent stays 0.84.2. No dependency
  upgrades, supplier changes or active process adoption are claimed.
- The prior mixed 0.5.2 product declaration/0.5.1 SDK snapshot is now explained
  by the actual historical tgz and source receipts. It is still not one
  installable aggregate. rc13/fixed019 WIP remains historical, not this branch.
- fixed019 B-ENV, the misleading green-final log with 4 PASS/1 FAIL, later
  green-002/core scoped passes, live8 and fixed115 failures, original
  UNKNOWN, F-ROLE-01 and SKIPs remain unchanged. No paused task is resumed.

## Historical preparation classification (current closure below)

| Item | Classification | Product evidence/action | Remaining dependency |
|---|---|---|---|
| R1 final DTO/read | B0 reuse; affected B4 | Existing admitModelRequest/read and guard ordering retained; no new guard or pagination algorithm | New stage view must enter the same sent DTO after actual SDK delivery; production overhead/image UNKNOWN |
| R2 actual outcome/usage | B0 reuse; B4 | Actual installed Session reserves and retains unknown timed-out tokens; safe old carriers retained | New admission facts must not manufacture Provider/effect truth |
| R3 output/receipt | B0 reuse; B4/B5 | Full calculation/Python receipt/independent qualification retained; no output warehouse | Map new pre-effect facts separately; preserve completed/unknown ToolOutcome enum |
| R4 fallback/once-extra | B0 reuse; B4 | Actual unchanged primary/fallback routes exercised with 32768/16384 caps and existing extra-attempt scope | Shared safe feedback/stop cannot silently add requests or reset task accounting |
| Native parameter helper | Historical B0; remaining B2 | Recognized existing 0.5.2 implementation, tests and interpretation-only approval; no reinstall or duplicate helper | Fixed new SDK's actual preparation/stage/batch Interface |
| Product contract source | B1 preparation; B2 bridge pending | captureAnalysisToolContracts clones/freezes real Application schemas/model derivation and preserves executor reference plus policy/digest; actual nested required_plans/group_by tested | SDK must bind request/reply/execution to its actual fixed stage view; current wide registry is not resolved yet |
| Parameter policy | B5; affected B4 | Only interpret_meaning metadata selects approved native-pi-v1 for new first-loop Tasks; others remain strict-v1; no converter/inference | Actual delivered prepared object, strict gate and hook policy still need integration; metadata is not execution proof |
| Draft read/write/edit | B1 preparation; B5 | Real existing SDK factories, one memory-only run-local file, path/auth/cancel/UTF-8/65536-byte host constraints; final full code enters real supervisor and independent qualification | Attach these prepared tools/code reference to the final native Browser stage view; no final Browser code_path claim yet |
| Limits | B1 product wiring; B4 | Opt-in firstLoop:v0.2 selects approved immutable limits through existing SDK config; legacy defaults and task identity rejection retained | Normal Browser new-task composition is pending actual new SDK; existing running services untouched |
| Passive facts / UI | B2/B5 | Existing Port/UI semantics retained; exact mapping requirements below, no invented SDK exports/carrier | Delivered trusted passive admission/stop Interface; then thin Port/HTTP/client/UI mapping and reread tests |
| R5/R6 / plugins | B3 / B5 | No search expansion, wholesale legacy retirement, supplier upgrade or plugin platform | Out of this first loop |

## Product facts to map from the actual delivered Interface

These are acceptance semantics, not proposed SDK method names or a frozen new
serialization schema. Ordinary field/method mapping will be resolved once the
SDK's real Interface is forwarded; no synthetic SDK replacement is created.

1. Bind actual task/run/session/branch/operation/call, stage/contract/policy
   identity and optional native invocation. No invented invocation before one
   exists. Preserve the product's own Task identity and durable ledger.
2. Distinguish structurally not-admitted/deferred, business refusal, executor
   started/completed, output delivery failure and unknown effect. A completed
   native operation is not a saved Outcome. Recording failure does not imply
   persisted rejection or refund.
3. Consume safe bounded issues and stop reason, never raw arguments, native
   message/cause, arbitrary expected_schema or dynamic enum content. Existing
   business/UI projections must not turn rejection into execution confirmation.
4. Keep the current per-tool/run correction scope separate from R4 once-extra.
   Native feedback/stop must persist its actual cumulative scope and prevent
   hidden dispatch; do not build a product loop or a transport fake failure.
5. Passive fact retrieval must not open-and-repair JSONL, run models/tools,
   resume, seize writer ownership or infer an empty queue from unavailable
   facts. Remove only the private reads actually replaced by this delivered
   public contract; keep business authorization, settlement and writer fences.

## Fixed limits and deliberately retained independent contracts

The opt-in Adapter's actual request/SDK budget uses output 32768, primary
32768/backup 16384, model total 600000 ms, tool hard 300000 ms, control 30000 ms,
cumulative unlimited. No dynamic limit profile or new timing engine exists.
Legacy no-opt-in defaults stay compatible and cannot rebind a new Task.
The retained_case and legacy Profiles remain separate existing purposes.

The current analysis host does not expose a general command/bash capability:
its exec rejects CAPABILITY_UNAVAILABLE. The prepared draft host also denies
exec. Therefore command-soft-120-second consumption is not claimed or emulated
by a new command engine. The final consumer must identify any actually enabled
existing restricted command entry before wiring the approved 120000 ms value;
do not open shell/network to manufacture a test. The existing dedicated Python
supervisor has its own 8000 ms safety/settlement wall and payload limits; those
are recorded as an existing narrower contract, not silently replaced with a
general command timeout. Any remaining A14/A15 applicability is explicit.

The original local-analysis 300-second total contract is tested through its
actual Application clock/admission chain: runtime 200 seconds plus calculation
110 seconds produces failed/TIMEOUT before validation/success. No global
300-second cap is added to the new unlimited sustained task.

## Original integration sequence (fixed .2 now received)

1. Verify archive/receipt/content/Interface/new version/hash/SRI and evidence;
   reject the historical 0.5.2 as a delivery. Install only here, record ESM path,
   all package bytes and explained lock delta; never use live SDK sources.
2. Bind these real product definitions to its trusted stage Interface, consume
   native prepared results and all-batch structural barrier. Cover the full
   read_analysis_evidence contract, strict versus approved interpretation,
   missing/extra fields and hook replacement. Keep business semantics separate.
3. Replace this new path's transport schema rewriting, generic arguments_json,
   private rejection JSONL and fake transport stop only when their delivered
   counterparts exist. Preserve old task protocol/configuration and UNKNOWN.
4. Wire the prepared restricted draft consumer into the normal isolated
   Browser new-task path; finalize code before existing execution and proof.
   Keep normal routes, limits, current authorization and deadline propagation.
5. Map trusted passive facts through Port/HTTP/client/UI/reopen in the existing
   approved workflow. Read applicable UI Contract and design materials before
   presentation edits. Visual-browser verification is separately NOT_RUN until
   actually performed; do not infer it from render/DOM tests.
6. Run applicable A01–A16 with real Application, installed same tgz/native
   persistent Session, tools, supervised calculation, independent numerical
   check, completion review, save/reopen. Concentrate applicable full regression
   and compliant independent Validator only on the complete fixed result.

No message to another session, SDK modification, Provider call, service change,
Git publication or old-task resumption is part of this continuation.

## Current fixed .2 closure

The historical table above records D0 and preparation truth at intake, not current
missing SDK interfaces. The fixed .2 is now installed and all55 files match;
verification.md owns current identity, A01–A16 evidence and remaining limits.
The SDK actual Interface-r3 supplies toolAdmission, argumentPolicy, versioned
ToolView, safe tool.prepared and inspectFacts. Product firstLoopBusinessTools and
firstLoopToolView bind full Application definitions directly. Native draft and
code_path now reach the real normal synthetic Browser task; Port/HTTP/client/UI
consume safe facts. The new opt-in path bypasses broad registry/transport second
schema/arguments_json and legacy automatic recovery/private proof. Old default
contracts are retained, not rewritten. Existing physical ledger, writer fence,
business authorization, IR, supervisor, independent qualification and save remain.

Rollback means the original exact0.5.1 package/lock and old assembly for eligible
old contracts. Do not resume a new-contract Task with old SDK, clear its ledger,
refund UNKNOWN or replay. Preserve this WIP and every new Session/receipt/history.
No rollback, old-task recovery or production switch has been executed.
