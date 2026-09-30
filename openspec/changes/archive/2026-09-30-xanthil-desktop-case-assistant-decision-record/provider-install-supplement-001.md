# Provider activation and internal installer supplement 001

Status: candidate005 author closure. Current user authorization and matching
plan003 receipt were exercised by Controller; actual production Pi journey PASS,
canonical2170/2169PASS/0FAIL/1SKIP, internal005 DMG/install/LaunchServices PASS.
The initial proposals and pending-approval text below remain historical; see
verification.md and handoff.md for current authority, evidence and limitations.
Final independent review and user Product/UI Acceptance remain pending.

## Initial wiring observations (before implementation)

User selected Xiaomi Token Plan CN, model mimo-v2.6-pro; Controller owns credential
inspection/provisioning and host execution. Worker does not read ~/.zcode. Official
Pi catalog and installed Pi0.84.2 identify provider xiaomi-token-plan-cn, API
openai-completions, base URL https://token-plan-cn.xiaomimimo.com/v1. Pricing zero
is subscription catalog metadata, not permission for unlimited/free requests.
No ZCode setting is modified and no new dependency is required.

Main currently supplies no caseAssistantConfig. Profile already composes the
production Application/SQLite/Pi Adapter from a Main-owned setting. Adapter uses
installed Pi core Agent plus ModelRuntime.streamSimple, no direct HTTP. Existing
Application/Adapter require strictly positive monetary limits/reservations, which
cannot truthfully express the user's zero incremental spend boundary.

Package006 already contains descriptor2.0, 1934 runtime inventory entries,
Python3.14.4, DuckDB1.5.2 and THIRD_PARTY_NOTICES. Build receipt uses the accepted
profile-resources-002 and internal Forge sealing hook. Therefore it is not an
absolute development-toolchain package. Actual standalone DMG/install proof is
still required; provider-dependent final package will get a new unique identity.

## Original deployment proposal — superseded by accepted revision below

1. Main accepts one explicit local activation capability supplied only by the
   dedicated host launcher: fixed provider/model/endpoint, expiry, one task-owned
   synthetic Project realpath, and finite shared run allowance. Absent/malformed/
   expired configuration or missing credential fails closed to the existing
   unconfigured UI. No registry, settings UI, keychain or persisted key schema.
2. Credential supplied privately to Adapter from Main memory; Pi AuthStorage.inMemory
   and explicit per-request apiKey avoid ambient Pi credentials/config writes.
   Launcher reads only the Controller-identified ZCode entry at execution after
   approval/preflight. It never modifies the original file or logs raw config/key.
   SDK catalog refresh is disabled; exact selected baseURL/API/model/rates are
   checked before admission. No fallback/PAYG and no automatic retries.
3. Keep existing stored shapes; allow zero monetary cap and zero per-turn
   reservation as a matched pair, retaining positive finite turn/time limits.
   A zero reservation permits only the exact selected subscription model with
   zero catalog rates and zero reported incremental cost. Positive priced models
   remain refused. Existing positive-cost validation remains. This changes a
   budget-validation invariant and requires Controller's explicit contract decision
   before dependent implementation; no schema migration/backfill is proposed.
4. Request/token/time allowance is private to the Main deployment and shared by
   all Sessions/Attempts in that one activated process; no reopen reset is used
   for real calls. One exclusive evidence/run directory blocks command replay.
   Reopen verification omits activation/credential and cannot auto-resume.
5. Fixed synthetic input only: user-authored test task/answer, completed synthetic
   Case identifiers, accepted finding/evidence, approved aggregate subset, selected
   report summary and explicit history, plus the production assistant instruction.
   No CSV raw rows, business Project, repository documents, machine paths, secrets,
   arbitrary files or network tool. Scan full outgoing prompt/tool history before
   Pi admission; failures stop without sending. Tools remain the existing five
   readonly Application tools. Draft adoption is a separate explicit command.
6. No business schema, new public IPC, professional-assistance activation or stage6
   change. Errors expose fixed codes only; raw SDK/credential exceptions never
   enter evidence. Transport stays installed Pi Adapter, no substitute for real
   execution. Output must meet existing exact JSON contract; no JSON repair loop.

### Proposed finite acceptance budget (not approved or executable)

- Whole dedicated run: at most 8 SDK provider requests, 0 retries, 0 fallback.
- At most 12000 UTF-8 bytes of complete application text/context per request;
  reserve 16384 input tokens plus 2048 completion tokens per admitted request.
- Whole-run reservation: 131072 input + 16384 completion = 147456 tokens.
  Reservation is conservative local accounting, not a provider tokenizer proof;
  enforce the exact serialized-text byte cap and completion-token API cap, record
  provider usage, and stop on missing/invalid/over-reservation usage. Do not label
  this exact provider tokenization. Controller must accept or revise this accounting
  contract before a numeric budget is submitted for user approval.
- Per request deadline 60s; total model execution 300s; user wait 120s; whole
  launcher deadline 600s. Stop aborts current stream and prevents later admission.
- Incremental spend ceiling 0 USD; subscription entitlement only, no PAYG.
  Provider account entitlement is Controller-owned; endpoint alone cannot verify
  subscription account billing or replace the user's numeric approval.

### RED/GREEN and real execution plan

Before production edits: permanent RED for default/explicit activation and zero
subscription budget behavior; negatives for wrong endpoint/model, missing/expired
capability, foreign Project, exhausted request/time allowance, nonzero tariff,
missing/invalid usage, secret/path rejection and replay. Use fake credential strings
and offline admission seams, never actual credentials. Retain original tests.

Dedicated command will target a fixed packaged app and one exact synthetic Project,
with frozen launcher/config/fixture hashes. Its plan mode never reads credentials
or calls a provider. Execution mode requires Controller-provisioned approved
budget/command receipt, exclusive evidence directory, exact runtime/package and
fixture readback. Required real result: question -> explicit synthetic answer ->
readonly tool -> draft -> explicit adoption; second bounded Attempt Stop; close
and reopen same Project without activation. Preserve any model/protocol failure;
no automatic retries, substitutions or arbitrary output repair.

Original pending request (now resolved below): accept/revise the six deployment points and the zero
monetary-budget invariant; numeric real-call approval remains a later separate
user decision after the concrete runner/config is reviewable.

## Independent offline installer work

Reuse tools/desktop/INTERNAL_INSTALL.md, archived internal-install-supplement-001
and ui-demo-restoration-001, original make-dmg-003.mjs, accepted relative runtime
resources/licenses and existing cached Electron. Preserve original DMG003 and all
old apps. Stage a distinct Change002/internal004 package and DMG inside the same
task root. No dependency install, original-resource mutation, certificate,
notarization, quarantine/Gatekeeper bypass or /Applications overwrite.

Host requests serialize hdiutil/GUI: strict deep ad-hoc verification, exclusive
DMG create/verify, readonly mount and full identity, isolated copied-app install,
normal LaunchServices/Finder launch, empty external cwd and PATH=/usr/bin:/bin,
real SQLite/DuckDB/Python synthetic calculation and Case Assistant/reopen. Record
any macOS trust block unchanged. Actual target-device user acceptance remains
separate. Final provider activation build receives a new candidate after all
actually authorized checks and the same independent Validator.


## Accepted Controller revision and vertical implementation specification

Controller accepted points1/2/4/5/6 and replaced proposed point3. The earlier
zero-cap proposal above is retained as superseded reasoning, not implementation.
Existing positive monetary invariants and stored shapes remain unchanged.
Currency XIAOMI_CREDITS means millionths of one Token Plan Credit in existing
*_microunits fields. Official rates: input miss300, cache hit2.5, output600
Credits/token (https://mimo.mi.com/docs/en-US/quick-start/faq/token-plan/Usage%26Quota,
updated2026-09-22). Conservatively account every input/cache token at300; no
cache/off-peak discount and no provider-invoice claim. Reserve6144000 Credits per
request, 49152000 for8 requests, encoded as6144000000000 /49152000000000 microunits.

ACTIVATE-001 input: absent or exact Main-only deployment JSON plus memory credential;
output: null/unconfigured or fixed Xiaomi authorization/private Pi runtime. Success
requires fixed endpoint/model, known finite caps, expiry and exact syntheticProject.
Failure never opens ambient auth/config, sends traffic, discloses key or broadens
Project scope. Acceptance: §7.3, AC-02/03 and Controller decision001.

ACTIVATE-002 input: production Application payload and Pi context; output: at most
one admitted Pi request, bounded completion/deadline, actual usage converted to
conservative Credits. Exact frozen authorized-context/tool values and synthetic
user messages form the outbound allowlist; previous model question/advice may be
reused only from this runtime's already accepted output. Metadata is structurally
checked. Full serialized context/system prompt/role overhead fits12000 UTF-8 bytes.
Per-run requests and execution time are shared across Sessions/Attempts. Reserve
16384 input+2048 output tokens before each request; missing/invalid/excess usage,
wrong model/endpoint/rates, unsafe payload, exhaustion or abort fail closed. No
retry, fallback, JSON repair, direct HTTP, raw errors or hidden catalog fetch.

ACTIVATE-003 existing authorization surface labels Credits as an upper-bound
account, displays per-request/input/completion/shared-run constraints, and preserves
existing exact payload review and free-text confirmation. No new public fields,
storage schema, settings screen, provider registry or professional assistance.

RUNNER-001 plan mode uses only accepted synthetic fixture and installed offline
toolchain to prepare a fixed Project, permitted contexts/tool views and command
manifest. It never reads credentials or calls a provider. Execute mode is host-only,
requires exact budget/command approval receipt and matching plan/package/source,
creates an exclusive execution directory, consumes Controller-provisioned credential
in memory and launches production packaged Main. Required outputs remain question,
answer, readonly tool, valid draft, explicit adopt, Stop and default-unconfigured
reopen. Model failures are terminal evidence; no retries to success.

INSTALL-CA-001 existing behavior coverage: installed production UI performs real
local calculation/explicit completion, links source, refuses unconfigured model,
reopens same Assistant and professional stage6 with no extra runtime effects.
Host internal004-install-host-001 is2PASS, strictdeep signature PASS, original and
copied app identities unchanged. No causal RED is fabricated for this new coverage.


## Candidate004 result

[Verification](verification.md) records final2169/2168PASS/0FAIL/1SKIP canonical,
3 installed native+1 LaunchServices PASS,exact package/DMG/plan identities,causal
RED/GREEN and preserved failures. [Handoff](handoff.md) fixes the independent review
endpoint. Original proposal reasoning above is historical;the accepted Credits
revision controls. real-pi-plan-001 and all host008 bound non-doc inputs remain
unchanged. No real provider execution or new acceptance is claimed.

## Runner review correction — 2026-09-29

Scope: plan §7.3 exact-data authorization and AC-04, runner only. Input is the
frozen synthetic authorization payload and the visible confirmation dialog.
Success requires the existing Credits label, total and request-limit assertions,
explicit expansion of review details, and exact equality of visible payload
text before any checkbox/Start action. Mismatch or UI failure stops admission.
Failures record only fixed phase/check identifiers, never caught error contents.
No product, package, authority, quota or persistent contract changes.

Host009 reproduced the missing expansion with zero Attempts/events/provider
requests; textContent and expanded innerText equal the frozen 3235-byte payload.
Permanent regression will cover collapsed review, mismatched payload and budget
labels, and fixed diagnostics. The real native host regression reuses internal004
and cancels before Start on a copy of the new synthetic plan fixture. Preserve all
existing assertions, candidate004, plan001 and failures. User's total Token Plan
authorization is recorded by Controller; existing bounded per-run limits remain.

## Packaged Pi initialization correction — 2026-09-29

AC-03 / ACTIVATE-002 requires the emitted Main's Pi Adapter to load the installed
Pi0.84.2 ESM module and its exact dependency closure. Main remains CommonJS.
Success: build with the actual Main Vite config, load emitted Adapter, complete one
installed Pi Agent turn offline; packaged production activation reaches the same
installed ModelRuntime/transport. Failure stops with existing safe product codes,
no fallback, credential persistence, retries or formal effects. No public contract,
model, budget, schema or authority changes. This is private build configuration.

Host011's installed SDK hook saw no calls. Emitted Main instead requires a Vite
SDK chunk; Pi's import.meta.url became {}.url. Offline actual emitted chunk load
reproduces TypeError ERR_INVALID_ARG_TYPE at fileURLToPath(undefined), before any
fetch/socket. Diagnostic002 binds Main/chunk hashes and sanitized stack; probe001
had a diagnostic typo and is not causal RED. Permanent build-and-load regression
must reproduce this failure before the minimum external-module configuration fix.
All prior raw failure evidence and package/internal004 remain immutable.
