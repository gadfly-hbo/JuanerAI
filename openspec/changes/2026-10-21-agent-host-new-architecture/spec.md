## F01 已捕获的当前根因与最小行为合同（生产修正前）

新实例命令010：真实独立SQLite进程正常INSERT/DELETE/COMMIT；公开readAccounting在第116次读取
于safe()返回STATE_FAILED。透明原生记录中同一regular journal inode73320165由nlink1变为0，
无任何SQLite原始异常，调用前后真实账户/审计相同且唯一合成请求不增加。这不是伪造元数据/错误。
历史482未记录的SQL/fs内层细节继续UNKNOWN；不反向补造它，只修正已真实捕获的同类当前机制。

F01-R02A：侧文件的regular/nlink0元数据可能来自已被正常COMMIT解除链接的inode，不能直接当
当前路径是硬链接/越界。仅对SQLite三类临时sidecar这一状态，最多再取得一次真实当前路径元数据，
然后执行原有全部文件类型/符号链接/链接数/祖先检查；不是忽略校验、放宽nlink允许值或业务重试。
主DB、目录及稳定hardlink2不获得例外。新路径不存在可以继续原SQL；新路径单链接regular仍按
原校验继续；新symlink/hardlink/directory/read-error或第二次仍nlink0必须效果前拒绝。

永久反例通过实际公共持久Adapter+固定C验证。真实OS竞态命令010为自然捕获证据；为稳定时序，
测试在lstat系统边界安排真实SQLite COMMIT，再用同一已打开inode的真实fstat(nlink0)重放已捕获
元数据状态，不造Stats/返回值/错误对象，不Mock业务/SDK/SQLite。随后重新查询pathname必须真实，
以未链接/合法新journal与真实symlink/hardlink/directory替换反例区分。保留原跨进程3次发送正例、
NS-01/UNKNOWN/ACK/锁失败/取消及计量断言，原68文件并发组不串行化。

# D008-F01 限定修正（2026-10-25，本轮当前授权）

原用户手动转交的NEEDS_REPAIR已实际取得且逐项校验，完整父对象为D008/ATTEMPT001，
2381文件/74249290bytes，清单0a69dc8b018fd0179953d8f91f49f85dfc0dbf361869152b9d0f37d01e37510c。
本轮仅归因并修正D008-F01及直接影响；精确C/SDK/依赖/模型/运行参数不变；不派助手或Validator，
用户手动转独立复核。真实Provider/数据/凭据/旧Task/现存服务/Git（包括只读及隐式）/发行生产无权。

F01-R01：真实两个OS进程在同一合法work上可各正常发送，合资格已知零503后仅一个额外恢复发送；
原总发送3/main2/extra1/consumed1/knownExtraSent1/grants1及owner/计量断言保留。
F01-R02：先取得具体公共调用相位及原生SQLite/fs原因的区分证据；诊断不得改变同步返回、原异常、
业务/权限/恢复或时限。历史482缺内层原因继续UNKNOWN，不以新例猜回旧事实，不用后来PASS闭合。
F01-R03：根据真实归因只改必要接点。保持唯一公开中立持久账户、NS-01允许L2、一次性认领/幂等、
真实暂时锁/锁失败、ACK未知/已发UNKNOWN/撤权/取消/迟到硬停和预留。不得吞异常、放宽安全、
增加隐藏重试、扩大锁等待/超时来掩盖原因，不能弱化原正例或串行化合法并发来通过。
F01-R04：原482文本和库只作不可变保护，不开原实例/不改原库/不重试、不释放32768预留。
F01-R05：最小因果RED→GREEN后运行原68文件/--test-concurrency=4同组合回归；单文件PASS不代组合。
F01-R06：按影响补当前类型/语法/持久及正常入口；复用未受影响的旧证据，不称本轮重跑或产品D_PASS。

已批准测试接缝：createPiBusinessPersistence公开BudgetStore/Audit/业务绑定与实际固定C createRuntime、
原跨进程fixture和实际SQLite/fs/OS进程边界；必要真实隔离正常产品入口。所有Provider回复合成并阻断外呼。
先保留相同入口的故障/内部事实，再作最小实现或有证据的fixture修正。原判断/安全断言不可删减或skip。
当前反馈命令为既有D03/R4双进程公开测试；先用透明诊断定位相位，若未再现则继续标未闭合，不能刷绿。

完整before/规则复用/角色/正式原件及新增证据根：
/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/new-architecture-v1.2-open-computation-d008-f01-repair-001。
固定新候选及完整作者回执后停止；未闭合如实交回，不签D_PASS。

--- 以下保留父D008及此前原时点记录 ---

### D008 RI-R04 actual finite raw values remain inspectable
Before a qualified Outcome exists, the existing computation summary/drawer must
show the actual scalar in the same current raw Finding projection, labelled
not_performed, without borrowing independent proof or dumping undeclared output
fields. Null/unsupported projection is not zero. Reuse the existing raw Finding
read projection; no new resource reader, execution or persistent state.
Raw Finding identity must include the exact current run, attempt, operation and
grant as well as Task/revision/source/config. A changed identity cannot make an
old raw result a current Finding. Formal qualified report contracts stay intact.
The previous /7/ anywhere in generated HTML was not adequate value evidence:
random receipt/hash text could satisfy it. The current test binds the actual
summary to the known raw value, and preserves this earlier limitation explicitly.

### D008 G03 latest actual preparation in one preview
A native proposal may normally revise its own preparation multiple times. The
existing preview UI and explicit adoption must both select the last same-preview,
exact-identity durable preparation. Do not display its first draft as the adopted
scope, and do not silently choose a foreign snapshot. The real Workspace case
uses two successive authorized source choices in one proposal; only the final
choice is shown and adopted. No new route, state or execution is introduced.

### D008 R07/R08 current explicit child and root Stop
Root Stop covers every existing Case family whose source.open_origin.task_id is
that exact Task, including explicitly created current Workspace children. Stop
the root's existing operation immediately and close those actual business
families through the existing CaseAssistant.stop; its existing cancellation
reaches native child transports. Preserve qualified root Outcomes, child
UNKNOWN/late facts and all usage. No new controller, Session map, queue or work
balance is introduced; no unrelated Task/project family is stopped.
Causal RED 464: real normal root qualified and saved, actual selected child native
transport held, public root Stop returned but actual child signal remained live.

### D008 RI-R03/R04/R08 current optional finite exploration check
Retain the existing limited conservation capability without the retired pool_plan,
finite method compiler or immediate calculate_and_verify tool. An Agent may
explicitly request a finite chart-total check with request_report.total_checks:
actual chart title and actual source-derived pool claim, selecting actual
exploration/computation/claim when ambiguous. Unique mechanical IDs bind inside
the existing business capability. Validate the current selections before recording
intent; no computation, qualification or saved receipt is promised at that point.
After the existing genuinely independent original-source qualification, the same
Workspace uses the retained exact checkOpenExplorationTotal against that actual
pool and exact saved raw chart. Persist only its existing total_check/version 1.1
annotation once on the same immutable exploration, under the existing lease,
authorization, transaction and physical receipt/source guards. Never alter raw
chart/program/receipt bytes, replace an existing different check, or create a new
ledger/schema/authority. Cancel/UNKNOWN and save failure retain their real facts.
Unrequested charts stay unqualified, no automatic checks are inferred from prose.
Both pass and fail are limited_check only; all chart items remain
MODEL_EXPLORATION/not_performed. A failed total cannot be presented as consistent
or heal an independent source discrepancy; the independently qualified pool and
other valid limited observations remain distinct. No extra model/recovery rounds.

### D008 seam 8 current Member cumulative usage projection
The current Member view receives SDK diagnostics for multiple grants of one
business work. These are current cumulative as-of snapshots, not disjoint per-run
charges. Display the current snapshot once; never sum repeated work balances.
Unknown/unsettled facts stay visible. Physical requests remain independently
metered; local process usage remains separate. No stored counters or SDK policy
changes are introduced. Public workspace-view counterexample binds two actual
work-snapshot shapes, each with three cumulative attempts, to display three.

### D008 G03 same-Task user-message provenance across an explicit source revision
Current immutable same-Task historical user statements remain readable as message
provenance, even after an explicit new source snapshot. They do not authorize that
old source, transfer numeric proof or override current conflicting business meaning.
All source evidence, fields, hashes, grants, physical computations and independent
coverage still validate against that revision's exact source/identity. A lawful
proposal adoption after a current source revision must not fail just because a
prior user statement is retained in the real unit-evidence catalog. Reuse current
history; no old Task migration, new storage field or source authority is added.
Causal RED 439: actual three sequential revisions, actual changed Tea CSV, saved
and independently qualified current computations, passive reopen valid, preview
operation returned; adoption transaction refused CONTEXT_CHANGED when current
revision became history and its earlier user-message catalog was scope-filtered.

### D008 G03 current explicit adoption acknowledgement
The existing client must recognize a current explicit adoption from the same
Task's durable revision command, exact baseline preview and selected preparation
content carried into the next revision. Readback after a lost reply never POSTs
again, computes, invokes a model or invents an adoption receipt/qualification.
A wrong command, Task, baseline/version, source/config identity or selected
business content cannot clear pending state. Reuse current immutable history,
preparation and command facts; do not restore retired revision_adoption/IR fields
or create a second persistent receipt authority. A model semantic candidate
remains labelled as a candidate in every existing detail projection.

### D008 R05/R07/R08 current observation and UI read model
Read only the current Store's real computation_records/explorations and immutable
Outcomes. A completed primary program stays MODEL_COMPUTATION/not_performed;
its labels, method, source scope and execution identity are inspectable without
claiming independent proof. Formal numerical/Finding grades still come only
from the separately qualified current Outcome and its exact claim coverage.
The existing source-return client must render current saved Tasks without
accessing retired partial-step state. Actual causal RED 423 has a real current
Task/list/read and blank client rendering at that obsolete access.
Current historical observations may be selected with the existing same-Task
version command, under all existing identity/idempotence/conflict and durable
checks. This grants inspection only: no report, qualification, retry, new Task,
provider execution, migration or old Task/Session reading. Actual causal RED
425 is NOT_FOUND after a real settled observation and lawful current revision.
No persistent schema or state authority is added. Old steps/IR/recipe producer
fixtures migrate to actual current business input and original-source records.
Retain source/field/condition inspection, versions, real member business facts,
unknowns, exact read/ACK recovery and escaping in the existing UI layout.

### D008 R05/R08 approved-asset current receipt and partial claims
Current source-derived approved definitions remain complete resources. No generic
six-metric execution recipe, legacy IR or Task-format authority is restored.
Actual independent proof is assessed per selected claim: a null or source-only
claim cannot inherit an arithmetic sibling's adoption. Keep the completed raw
program, null, method review and receipt; explicitly record a trial issue and
partial completion. A scenario receipt requires all its selected metric usages
to have actual numeric qualification, with no missing selected usage.
Both existing report modes consume the current same-version receipt directly,
show actual adopted metrics/scenarios and missing evidence, retain downloads,
versions, owner, fingerprints, limitations and source inspection. Generic asset
selection must not advertise net-sales/six-metric execution or invented 13-week
results. Numeric/period results remain real report claims when actually executed.
Current causal RED: 390/392 current receipt absent in the existing cards;
394 actual risk:null was incorrectly adopted through its arithmetic sibling.
Synthetic formation must not claim an unverified null as a verified report fact.
No new UI layout, SDK/Port, authorization, retry, persistence or model route.

### D008 G02 current granted metadata
The current structured material projection carries only actually selected body
fields in both content and the public fields list. Preserve the complete local
original source for provenance and parent authorization; it is not the child
grant. Current causal RED 386 inspects actual Case authorization/native payload:
body selection is correct but fields still advertised an unselected sibling.
Recompute only metadata from the selected object, with the same source identity,
scope, pointer and stop guards. No source/Task/Session authority is introduced.

### D008 RI-R04/R07 — child source projection retains per-claim limits
The actual minimal saved-source projection must not describe a source quote as
qualified arithmetic or hide that the quoted opinion remains unverified. Keep
source_attribution on its actual value and explicitly retain this limitation
for child consumers. No extra proof, source authority or read permission is
introduced. Causal current quote consumer RED: 378; original selected quote and
unselected-text exclusion already worked, but its top-level limitation was lost.

### D008 seam 1/3 — current message references precede model invocation
Actual user statements and their exact handles must be present in the first
analysis request, including approved requirement/history context. One existing
semantic identity function builds both the Application resolver and public
model view, so message:1 never silently denotes a different unit source. This
does not add information-complete admission, new confirmation or synthesized
business evidence. It discloses already authorized Task messages, not credentials
or unrelated records; the Agent chooses actual references before its action.
Current RED 361 consumes the real request and requires the catalog; native
Session input lacks user_messages and the explicit evidence choice cannot be
made. Earlier 359 preserved accurate unit_basis rejection of a wrong handle.
No new SDK/Port/persistence contract, scheduler, finite method or fallback.

### D008 RI-R01/R07 — trusted absent current runtime facts
For a fresh work, a successful read of the existing Adapter-owned public SDK
persistence with no accounting, audit, work binding or native Session selection
is known not_started, not an unavailable/unknown effect. This read-only result
does not grant execution or create/reset a ledger. An existing binding, native
selection, partial accounting/audit, any pending reservation or UNKNOWN keeps
the conservative observed/unavailable stop semantics. No inference from Task
status, exception strings, identifiers, version tags or a lack of model output.
Causal RED 357: the actual new normal requirements Task was incorrectly
unavailable; the actually sent UNKNOWN and partial-record negative both stopped.

### D008 seam 4 / RI-R01 current business-definition refusal
The pure current business-definition compiler can establish a pre-effect
structural refusal (for example duplicate source/sheet selection). Reuse the
existing trusted semantic-definition carrier and the fixed SDK invocation
refusal contract to return exact safe code/field prerequisites to the same Pi
loop. Native bounded correction remains unchanged. Wrap only the pure compiler,
not source IO, authorization, publication, preparation persistence or receipts.
Foreign scope/permission, cancellation and all actual/uncertain effects remain
stopping failures. No step graph/old producer, automatic parameter repair or
new error/recovery framework. Causal RED: 342, 19/20 PASS; actual duplicate
definition produced generic TOOL_FAILED/UNKNOWN before its persistent write.

### D008 RI-R04 raw root JSON pointer
The valid empty JSON pointer denotes the actual whole scalar result. Raw
partial Finding projection must preserve its value as not_performed with no
Outcome/proof, just like a nested scalar. It must not reinterpret the pointer
as a missing empty-key member. Current actual Workspace RED: 338, physical
result 7 saved but raw Finding rendered null. No parser, proof or schema added.

### D008 RI-R03/Q11-07 — observed OCR does not certify source values
An unconfirmed OCR observation may be read/explored within the actual grant;
its numeric appearance, two equal program outputs or a MODEL method verdict
cannot create independent numeric/source qualification. Check the actual sources
used by each claim coverage before qualification. Unused OCR materials do not
globally block independent claims from other confirmed originals. No OCR
confirmation is invented, no source record is rewritten and no old IR returns.
Current causal RED: 334, negative Core input with explicitly unconfirmed OCR
was accepted; this input is not claimed a physical Store seal/SDK completion.

### D008 RI-R04 current projection and finite check qualification
Formal Findings must match the owning Task/revision/config/source identity just
as raw observations do. An actual source-attribution value that happens to look
numeric cannot become a qualified arithmetic pool for chart conservation. Only
an actually arithmetic-qualified nonnull claim may support that limited check.
The chart stays MODEL_EXPLORATION/not_performed and no allocation method is
certified. Current physical source, scope, totals and UI limitations are tested;
retired plan/filter/step object formats are not reconstructed.

### D008 seam 4 — computation completed, Store delivery uncertain
After the actual supervised program returns its trusted completed receipt, a
Store rejection or lost commit acknowledgement cannot become a not-started
tool refusal. Preserve that physical receipt in the existing SDK unknown tool
outcome; stop the current chain with no correction/replay entitlement. Read-only
diagnostics may combine that SDK receipt id with the immutable settled execution
seal to state calculation=completed and full tool delivery=unknown. Presence or
absence of a current Store record is reported separately and does not settle
the SDK effect, release reservations, retry, or certify a formal Outcome.
No new journal, recovery authority or SDK interface. Verification faults only
the owned current Task's actual SQLite write before commit and its commit ACK,
then passively reopens with no further dispatch or Python execution.

### D008 G04 current claim coordinates
Report presentation checks keep distinct current source coordinates (such as
region and period) instead of treating every explicit condition as one axis.
An axis is obtained only from the actual claim coverage and matching observed
column values of the current source; ambiguous/unobserved conditions stay
conservative. No new plan, algorithm or inferred business meaning is supplied.
Foreign/swapped coordinates and ambiguous lists still reject the prose, while
valid sequential period references preserve the common region. A source digest
mismatch reports SOURCE_CHANGED before claim rendering. Causal current evidence:
309 AC119 valid sequential region+period RED, all original negative prose kept.

### D008 RI-R03/R04 — source correspondence is not arithmetic
Before execution a claim may explicitly request source_attribution rather than
arithmetic. It is an evidence qualification, not an analysis-method whitelist.
Both current source-only executions, actual method review, source identity and
coverage remain required. Exact nonempty quoted text must correspond to one
actual allowed observed cell inside that claim's coverage; missing, ambiguous,
changed-source or unconfirmed OCR attribution refuses qualification. No source
claim certifies the quoted opinion, a cause, a quantity, or document completeness.
Numeric/quote/null claims retain separate grades in report, Finding and Studio;
no formula can use a quote as an arithmetic operand. The original resource,
position and full quotation survive current save/reopen/export. This reuses the
existing source inspection, executor, per-claim evidence and public report contract;
no new SDK surface, method enumerator, storage authority or old Task bridge.

### D008 RI-R03/R04 — mixed numeric and explicitly unavailable claims
Actual source-bound primary and independent results may both explicitly contain
JSON null at a declared claim path. That path has no arithmetic qualification;
it remains not_performed / not_applicable, never numeric zero. Missing paths,
invalid scalar types and one-sided null remain refusals. Other actually checked
numeric claims may form the bounded partial report. A wholly nonnumeric result
does not form an independent_arithmetic Outcome. The existing result, coverage,
non-author method review and physical seals remain mandatory; no new method
registry, persistent ledger or public SDK contract is introduced. Finding/Case
exports must exclude the unavailable path. Partial observations may be objected
to without inventing an outcome_id. Validation: actual current Workspace paired
source executions, same-version report, save/reopen, null/zero/tamper negatives.

## D008 / R01,R04 partial current observations

A normal current Task may compute a truthful unqualified observation, then ask for the next missing business condition and wait. The saved original artifact remains inspectable and can form an explicitly partial editable report note through the existing report-content API. This is not a formal Outcome, independent grade, completed requirement, human business acceptance, or permission to restart. The projection binds actual Task/revision/source/config and actual settled artifact/receipt; raw claims use not_performed and no independent proof. Their input-row count is not independent claim coverage. UNKNOWN/pending effects and cancellation still block write/suggest/confirm through existing SDK/Store gates. No new stored partial authority, step ledger or compatibility shape is introduced.

## D008 / R04 current native percent representation

An actually independently qualified claim whose declared/grounded unit is percent displays the same native percent value with the percent sign. It is neither divided by nor multiplied by one hundred for presentation. Arithmetic uses the original exact value. The retained explicit older public presentation option remains bound to its existing report content identity; it does not select a Task/runtime format or grant old execution compatibility. Causal current evidence: command265 reached real programs/reports but displayed 120 rather than120%.

## D008 / RI-R08 retained test input migration

The removed finite-IR producers are not replaced with a compatibility helper or an operator interpreter. Test consumers needing qualified arithmetic obtain actual current evidence through the normal Profile/Workspace/Pi/fixed C and original-source primary plus independent programs. Tests supply concrete free programs and actual source files, never fabricated qualification, grants or settled receipts. Pure report/review/UI tests may then consume those real current business records. Integer identity guards, physical failures, source/coverage/unit negatives, exact arithmetic, zero denominators, partial observations, persisted readback and explicit source choices remain meaningful assertions. Old IR versions, method/recipe property shapes and compatibility qualification are retired requirements and are mapped to the current contract rather than restored as shell APIs. Fixture/parse failures are recorded separately from causal behavior RED. No real model quality is inferred from synthetic method/formation/review responses.

## D008 / R04–R08 current professional and finite-number consumers

Retained genuine membership evidence is displayed and explicitly selectable through the existing current source/Case/Finding/Studio capability using its real professional metrics and qualification; it is not fabricated into generic calculation artifacts or an old IR wrapper. Numeric fractional/scientific original artifacts remain exact through full review, current immutable Case source, Finding, Studio and same-version export/reopen. A current finite-JSON identity is used only for these actual JSON carriers, without loosening the retained integer-only entry. These are current business consumer reconnections, not restoration of a retired runtime or finite algorithm dispatcher.

## D008 / RI-R06 current long report resource delivery

Before report formation the actual Provider input declares the existing current run-local draft/report.json native write/edit/read capability and its limit. A current report may return its closed JSON directly or assemble that exact JSON through native tools; existing generate reads the actual current draft and validates it through the same numeric/document/full-review contracts. No extra submission tool, file service, parser, generation loop or terminal authority is introduced. Drafts from a preceding turn cannot supply the next document. Full long-document units/tail, review coverage and same-version Outcome/export survive; report intent does not raise exploration/semantic qualification. Large explorations are supplied to formation as bounded locators to their existing complete native resource, not wholesale inline chart bodies.

## D008 / current arbitrary-JSON persistence representation

Actual causal RED210 stops after a real completed Python output: current code uses the old integer-only encodeTask for an arbitrary JSON computation. Share the existing canonical encoder/key order through an explicit finite-JSON entry for current open-computation artifacts, immutable Task/Outcome/report proof and necessary current Case/Studio source carriers. Existing encodeTask/taskHash remain integer-only with identical accepted bytes; member/financial integer, safe-count, authority and schema guards are not relaxed. Finite JSON accepts finite fractional numbers; unsafe integer numbers, NaN/Infinity, undefined, BigInt, functions and non-plain objects still refuse. Actual numeric values and JSON types are preserved, not converted into an operator plan/string answer. Old Task decoders/records are not migrated or reinterpreted. This changes current host representation, not SDK/public Pi contracts, SQL schema or a new persistence authority.

## D008 / RI-R03/R04 exact numeric transport edge

Finite scientific JSON notation and a corresponding exact decimal/fraction from an independently implemented program compare by exact rational value. No floating tolerance, invented zero or lossy integer conversion grants equality. The original execution JSON/seals remain intact. A nonzero base claim must not display as an unmarked zero solely because a six-place preview rounded it away; its exact value remains inspectable. This is numeric representation/qualification, not another analysis method or allowable-operator list. Existing explicitly requested derived display rounding stays bounded and checked.

## D008 / RI-R03/R04/R05 retained professional membership evidence

The approved retained M1/M2 membership business functions are not an open-analysis method whitelist. Their actual source bindings, two periods, status/currency/group semantics, real DuckDB calculation and separate original-source Python verification remain a genuine professional capability. Rebuild its current direct business record as identity + framework + actual metrics + native execution evidence, with no old OpenIR/plan wrapper, scalar calculation alias, session/controller or legacy Task decoder. Physical admission and the exact settled result are durable receipts; a missing/unknown settlement blocks replay. Final Store save checks current identity/source/native evidence and the actual local physical seal, not a model/hash/grade object. The same current Case/Finding source boundary distinguishes genuine native membership evidence from generic qualified program evidence. Existing formal owner admission and human acceptance remain separate.

## D008 / RI-R05 / G01 actual company metric adoption

An optional per-claim company metric/scenario choice is explicit business intent. The system binds it to this Task's actual approved asset/version/owner/project/definition and exact current source columns. It is not an operator plan or a global asset prerequisite. The same original source and approved definitions are available to the independent computation context without main answers. The non-author method assessor must actually read the approved definition and both programs and specifically assess asset conformance in addition to applicability, independence and coverage. Definitions, approval/read access or two equal values do not prove conformance. Only actually qualified selected metric claims enter the existing atomic Outcome adoption receipt; no auto-adopt-all metrics/scenarios or universal net-sales gate. Current approval/disclosure and source/Task binding are rechecked before the business save; historical saved receipts remain historical after revocation, never new authority.

## D008 / RI-R01/R03/R04 action prerequisites

A computation claim may explicitly declare the existing business semantic dimensions it actually needs; this describes dependencies, never allowed algorithms. Raw computation/exploration remains unqualified and may be saved before formal prerequisites are known. Formal qualification checks those dependencies and unit evidence against the actual current meaning. Unrelated unresolved dimensions remain visible but do not block an independent finite observation. The non-author method assessment sees the entire current meaning and must assess applicability and coverage, including whether declared dependencies omit a needed condition. A hash or an empty dependency list does not independently prove applicability. The qualification stores this exact current meaning, separately from the original immutable execution context, and Store rechecks actual Task/user/source provenance. Missing relevant prerequisite stops only that report intent; authority, cancellation, UNKNOWN, settlement and audit gates remain global where required.

## D008 / G02 / G04 current downstream evidence

Collaboration and Case/Decision/Studio source consumers read actual current Store-qualified computation records and the matching reviewed numeric/document version. They disclose only selected qualified values and minimal per-claim source/coverage/method qualification; arbitrary primary result/program/private fields are not an aggregate. Missing current qualification gives an explicit ineligible source, while read/integrity errors propagate rather than becoming empty materials. Owner/project/run/task/revision and same-version report/review binding remain. Human adoption and formal Finding publication remain separate existing actions. A value's coverage comes only from that actual claim or its explicit checked numeric references, not every computation in the Task.

## D008 / RI-R01/R04/R07 / G03 current preparation and proposal adoption

Current requirement execution revisions initialize current preparation/conversation/computation facts from actual revision, not a retired Task version. They retain review policy, explicit asset choice and immutable history/commands. A current proposal preview persists only its own real preparation under the existing preview owner. An actually proposed business scope can become ready for explicit adoption; a mere prose answer cannot. Passive preview/reopen does not compute. Explicit same-baseline adoption binds that exact proposal to the new current identity without executing or promoting evidence. Scope/source and semantic differences are computed from actual facts; unavailable proposal data is not an unchanged plan. Existing authorization, lease, UNKNOWN, conflicts and transaction rules remain.

## D008 单位资格接缝（2026-10-25，因果 RED 162）

真实反例：原题明确件、不换币，两个真实程序一致得3，合成方法/全文审查均支持，仍可把3 USD保存。该旧时点FAIL保留，不把相等/作者文字/模型审查升为单位依据。

当前R03/R04的必要实现：原始计算与正式资格分开；先算/保存未核验观察无需齐备全部语义。正式request_report只对选定实际计算的实际主张补必要单位引用，可在原计算后提供，不重跑原Python或修改其不可变产物。唯一计算/主张系统绑定，多项有业务歧义时明确选择。复用原SemanticAssessment的真实message/source引用编译与验证，单位必须有同版获准来源/USER的实际依据；单位/换算声明不能靠模型自己写一个label成立。已有适用单位Binding复用，未确认不编造零/默认单位/汇率。

单位依据随对应核验记录保存，绑定实际execution/claim/source/Task与真实USER消息来源。独立源计算与非作者方法审查实际消费这些依据，仍不能只凭引用、hash、模型支持或两次相等通过。Store在最终同版事务中按本Task真实问题/历史/源重验，不从模型提供的question/evidence反向制造USER来源。现有准备/解释资源只携带真实数据，不成为Runtime或另一状态权威。

缺单位依据时仅拒绝受影响正式报告请求，保留真实计算/探索及必要读取/澄清；不得建方法算子库、全信息启动门、额外纠正模型/重试额度。条件冲突按实际依赖判断，不用无关维度冲突阻断所有动作；权限/取消/UNKNOWN/未结算/账本故障仍按原合同硬停。固定C、参数、用途和外发权限不变。真实模型语义质量仍未执行。

## D008 trusted program refusal and actual effect facts

Only the controlled executor's trusted supervisor protocol can establish payload not-started. A syntax rejection before any payload child exists may return a structured pre-effect refusal to the same Pi loop. It preserves the admission/failure/bookkeeping history and physical usage; no arbitrary exception string or TOOL_FAILED establishes no effect. A program correction requires explicit intent, system-bound original failed action and the existing at-most-one correction. Different goal/code/IDs/initial markers do not reset it; normal successful actions do not consume failure correction credit. Actual failed/settled/UNKNOWN and late results remain distinct, with native error semantics and an actual receipt locator. SDK Provider recovery remains solely the opaque public work account; tool correction is not a competing recovery balance.

## D008 same-version preparation readback and execution lease

A stopped current Task retains its real saved MODEL preparation and exploration. Passive reconstruction performs no execution. After explicit lawful resume, unchanged Task/revision/source/config/grant identities continue to identify these immutable business facts; the new execution lease epoch is still mandatory for every write and never grants a different business scope. Preparation readback and initialization consume the latest matching same-version saved preparation; they do not require an old execution lease to become writable again. Source/config/grant/revision mismatch or revoked/cancelled authority still refuses. This is current-Task business-fact readback, not old Task/Session format compatibility or migration.

A preparation producer that actually saves and independently reads back a snapshot returns its true task-local receipt and native-readable resource paths. MODEL_PROPOSAL persistence is distinct from accepted business meaning, calculation, qualification or formal Outcome save. Whole long exploration content remains paged at the original full_exploration.path. Later explicitly new computations receive separate real code/execution receipts and cannot replay the saved original Python merely to read it.

## D008 non-author method assessment before qualification

Independent recomputation metadata supplied by its program author is not a pass. Before assigning claim qualification, a separate source-bound analysis context that authored neither program consumes both sealed actual programs, same-version source/condition metadata and the proposed independent coverage. It returns per-claim applicability, independence, coverage reasons and remaining limitations, with actual program-line references. This uses the same existing analysis route/work/public Pi executor; no new model purpose, fallback or correction/review retry allowance is introduced. Native paged read exposes only those exact sealed programs plus authorized source resources. Report/content review remains separate and its existing bounded revision count is unchanged.

Qualification combines actual original-source executions, exact claim comparisons, physical seals, scope/unit checks and non-author method assessment. No model verdict, declared coverage, grade, digest or equality alone is sufficient. Missing/insufficient/conflicting method assessment blocks affected formal claims and retains the real unqualified observations. This remains bounded evidence, not a universal generated-program correctness guarantee or company/causal certification.

## D008 current independent recomputation and deliverable intent

`execute_program` may declare the numeric result paths and the business question, unit, conditions and method before execution. This metadata describes a claim; it is neither an operator plan nor its proof. Actual source, program, Task, configuration and receipt identities are system bound. Undeclared arbitrary JSON and exploration remain unqualified observations.

`request_report` records an intent against the actual current primary computation. Once the analysis Agent has completed, the existing Workspace professional workflow obtains one source-only independent analysis context on the same model route and same business work. It receives the original authorized source and the declared questions/conditions/units, never the primary program, output, intermediate table or exploration answer. It independently chooses a method and writes a program using the existing controlled executor. Qualification requires the actual source-bound independent execution, substantive method applicability/independence rationale, explicit original-source coverage for every requested claim, exact numeric/unit agreement and no unresolved discrepancy. Self-provided grade/boolean, different process/model, digest, repeated primary code or equality alone cannot qualify a claim. The independent method rationale remains a MODEL assessment; source/arithmetic evidence does not certify causal or company business meaning. Uncovered or inapplicable claims prevent a qualified full Outcome; real finite observations remain.

This is a fixed business deliverable check after an explicit intent, not a new Agent loop, model purpose, Session controller, fallback, retry budget or universal algorithm verifier. A failed/UNKNOWN physical action cannot be replayed by it. Current Store transactions revalidate actual physical source/program/output receipts before persisting the same-version numeric/report/review result.

## D008 / RI-D24 B_PASS 后完整 D（2026-10-24，当前授权）

唯一起点：RI-D24-B001/ATTEMPT001，2343文件/73969804 bytes，清单bf5609fdde3e110c0351d7b1d261c90622fb81b2a80068f4d4adb2733cdbb076。
七份B/C正式原件已通过既有SSH通道接收/逐项校验；不可变before-source、规则复用读回、角色和保护基线在：
/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/new-architecture-v1.2-open-computation-d008-001。
原RI-D24条件79字节核销关闭；以下D007及其他旧段落保留历史意义，不是本轮停点。
同一精确C 0.6.0-newarch.1/164903/5b969fb664069c1895de376cce78cc03ade6df1e0468cab80308ddaad900d012，只加载现有安装，不换包。
原主Sol/max独占写入，不派助手/Validator。当前用户指令覆盖旧OC-T12验证范围，必须八类接缝及正常入口离线联合。

行为与验证：
- RI-R01/R04/R07：唯一当前Task事实合同；真实新建与材料追加承接准备/对话空态、失效及历史，不读/迁移旧记录；source/identity/命令幂等/冲突/事务/UNKNOWN保持。先取得真实Store与Workspace行为RED，再改相同行为取得GREEN。装配错误仅SETUP_FAIL。
- RI-R02/R03/R05：Pi自主方法/代码，受控执行；数据/语义/Binding及资产按动作前提；同版原始来源独立取证、逐主张覆盖/差异/适用性与业务依据。无有限IR方法门，无同代码自证，无证据不给正式资格。
- RI-R04/R06/G01–G04：真实批准资产/明确材料选择、预览/显式采纳、分层Finding、全文报告审查/有限修订、原子同版保存读回/导出；原生资源和完整尾部；合法停止/显式续接原探索不重跑。
- RI-R08及八类：固定SDK公共schema/prepare/执行、真实拒绝与效果事实、机械身份/业务选择、最终参数、资源、正常入口、唯一状态/公开持久work。NS-01第6步允许；G不是容量，UNKNOWN/未结算/撤权/取消/审计账本失败硬停。

仅合成资料、新短隔离根/Task/Session/work和本轮自建离线进程；外部Provider合成且防外呼。既有Provider/业务数据/凭据/服务/旧任务/Git/发布无权。
当前初始完整tsc退出2，完整日志commands/003-INITIAL-TYPECHECK.*；这是删除后的装配诊断，不是业务RED，不能用旧354数量代当前证据。
先闭合必要DTO/Port/生产与fixture装配，按公开业务接缝逐项RED→GREEN，再受影响回归、完整types/build/适用canonical。不得恢复旧helper/别名/默认资格或删断言、skip/排除凑绿。
仅用户指令§7真实边界可提前交固定部分对象；普通R内实现继续。完整对象固定后交D作者回执和手动Validator消息即停，不自称D_PASS。

### RI-R03 / 独立原始来源上下文的工程承接

同一 analysis 用途/现有模型候选/接收方/权限/参数内，为一个真实已保存计算生成独立取证上下文；业务Port只传实际computation_id，不传Pi Session/消息/恢复结构。当前执行实现用既有公开SDK创建独立原生上下文；无主程序、主答案或中间结果注入。Pi仍持有原生Session/队列/上下文，宿主不建Session状态机或循环，不换模型/用途或加fallback。该真实计算关联进入配置身份和原生contextVersions；公共work/chain关联、共享恢复及现有持久账户继续唯一裁决。

独立上下文本身不授算术/业务资格；还须实际原始来源执行、方法独立性/覆盖/差异和成果前校验。它只消除将主结果放进核验提示的问题。所有正常/辅助物理请求保留真实计量；现有持久grant关联可投影同work实际native tasks，不能另建余额镜像、退款或按上下文刷新恢复。当前先以公开Agent→固定C→真实DTO的泄漏反例RED/GREEN验证，再接实际核验能力。非模型业务端不接收Pi类型。

--- 历史原文保留 ---

## D007 当前停止 / D007-RI-D24-RESIDUAL-01（2026-10-24）

正式B/C原件与2343/0a9aac58后像匹配，已冻结D-before。初始完整TypeScript退出2，
354条装配诊断，不是业务因果RED。尚未修改生产/测试/依赖/运行配置或执行SDK/产品。

按本次用户续建指令§7发现已核范围漏删：Store.addRequirementMaterials当前第192行仍有
...(t.version==='1.4'?{preparation_snapshots:[],conversation_outcome:null}:{}),
该完整79-byte旧格式初始化分派存在于原RI-D24/F01阅读副本混合行218；
当前379选择器＋五处旧残余不覆盖它。RS-0111已核销的是另一处startRequirement。
这是格式控制分支，不是普通缺失类型/producer；不得在D中静默删去或改名绕行。

保持该生产原文未改，停止受影响D重建，固定完整当前后像和B回交项。
原RI-D24已核删留依据、正常静态调用、同类Store版本命中、真实KEEP/R职责及NOT_RUN反例，
见本批AFFECTED-B-RETURN.json及PARTIAL-D-RECEIPT.md。
本次不是新的A/B/D PASS，不改变379＋五残余的正式B_PASS或历史FAIL/UNKNOWN。
状态D_PARTIAL / AWAITING_AFFECTED_B_RETIREMENT_CLOSURE / STOPPED。
等待用户手动转交对应已核RI-D24的最窄B核销及明确下一指令；不重新要求同义D启动授权。
SDK精确C等待，b883只读，现存服务/旧Task/业务库/Provider/Git/发布均未操作。

## D007 / 开放计算与 RI-G01–G04 B_PASS 后重建（2026-10-24，当前授权）

当前唯一起点是 Mini-newarch-open-computation-RI-G01-G04-B001 / ATTEMPT001 的完整后像：
2343 文件 / 73962781 bytes，清单 SHA256 0a9aac58abfae348ea7176d0282d85b04369c0afea3618ee1ba34061ab27436d。
正式 B_PASS 与同一精确 C_PASS 七份原件已按用户提供的 bytes/SHA256 只读取回；
不可变 D-before、原件、完整日志在
/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/new-architecture-v1.2-open-computation-d007-001。
历史 HEAD/tree 仅来源定位，旧 D006 结论和以下历史段落不放行本次对象。

本轮由原主 Agent 单独实施 RI-R01–R08，沿 OC-T01–T11、F01 及 CURRENT 四组职责；
当前用户明确要求八类联合验证，取代 OC-T12 当时“不重审八类”的验证范围限制。
实际 Sol/max / danger-full-access / never 不变，复用用户此前明确 Sol/max 授权；
不派 helper/Validator，不联系其他 session。固定 SDK 0.6.0-newarch.1 / 164903 bytes /
5b969fb664069c1895de376cce78cc03ade6df1e0468cab80308ddaad900d012；
只可加载当前已核安装，不安装/升级/改包/私有绕行。

目标结果：Pi 自主选择方法和原生多轮；产品按动作最小前提提供当前数据/语义/Binding、
受控真实计算、独立原始来源核验、分层资格及同版正式报告/审查/保存重开。
信息不全可开始获准读取/探索，只暂停依赖缺项的动作；真实 UNKNOWN/未结算/
撤权/取消/审计故障保持硬停。无旧 IR 方法枚举、步骤图、兼容壳或第二运行/恢复权威。
普通已删 producer 的 Port/类型/fixture/界面接线直接在本轮迁移，保留真实业务/安全断言。

实施/验证接点（均由本次用户指令批准，无新增技术审批）：
- 正常 Browser/npm → Application/Profile → 同一专业 Adapter → 精确 SDK/Pi 编码/prepare/实际 executor；
  只在外部 Provider fetch/transport 接缝提供明确合成响应，白名单环境及防外呼。
- 当前 Store、真实受控 executor/supervisor、原始合成资料独立核验、公开 BudgetStore.work.read/atomic、
  原生资源/Session 和当前正式报告/全文审查接口；不以替身 Store/固定答案顶替。
- 依次闭合动作可信输入与真实执行/反馈、独立核验/四层事实、同版成果与 G01–G04、资源和正常入口；
  对确定性行为保存因果 RED→GREEN。初始语法/类型/导入诊断只称装配 FAIL，不冒称业务 RED。
- 最终完整 types/build/受影响与关键回归、Adapter 合同、八类正反例、NS-01/跨进程/ACK未知/
  停止被动重开零执行/合法续接原路径不重跑、长尾与逐主张报告资格均需真实当前证据。
  45 文档案例逐项映射实际适用证据/不适用理由，不按数量充当完成。
- 固定完整 D-before/after/WIP、两种完整差异及静态重建、精确安装/实际加载、配置/资源/
  合成输入/全部命令失败和日志；作者回执后停止等待用户手动转交独立 D。

范围：必要 Product Core/Application/业务 Port/现有 Adapter/Profile/正常消费者/测试及本薄记录；
旧包和历史记录不迁移，不改模型用途/权限/参数/依赖，不降低独立核验或正式成果标准。
参数仍主32768/备16384、模型600000ms、工具硬300000ms、命令软120000ms、control30000ms、
cumulative unlimited 并逐次持久计量。程序一次纠正、SDK共享一次故障额外实际发送、
报告有限修订/重审互不借额；NS-01 第6步允许的语义不变。

真正停点仅依本次用户 §7：新范围外实质旧权威需退役则先冻结并回 A/B；固定 C 公共缺陷则交最小反例；
重大未批业务/持久/权限变更、材料或现场漂移、隔离/效果不明则保全交回。
普通装配/私有字段/现有 R 断口不新增审批。无真实 Provider、旧 Task/库/现存服务、Git（含只读）、
发行/生产或其他 session 操作。板只用现有 CLI 登记本轮状态并单列差异。
当前状态 IN_PROGRESS；不是 D_PASS/产品接受。最终唯一对象 Mini-newarch-open-computation-D007。

## D006 repair002 / D006-R001-F03（2026-10-23，当前普通D修正）

独立NEEDS_REPAIR绑定repair001完整2363文件/738776f7；本轮在该后像继续，原F01/F02专项已核销但整体D未通过。新阻断位于当前Pi持久Adapter正常跨进程read/snapshot/accounting/audit的瞬时SQLite锁竞争，不归因为SDK缺陷，也不改写先前失败/未知预留。精确C包、用途/参数/权限/共享一次恢复与所有旧任务停止线不变；无新增退役A/B或产品审批。

F03合同：真实两进程、同一数据库/work的正常有限锁竞争应允许现有合法读取完成，结果来自真实提交的唯一账户和审计；沿用此Adapter已有写连接1000ms SQLite原生有限锁等待，应用于只读连接。它是底层同一SQL操作的有限锁等待，不是模型额外请求/调度重试/授权续期，也不改变30000ms control、600000ms模型、累计unlimited等参数。锁超过该有限窗口、真实SQL/存储/审计错误、COMMIT ACK不明和UNKNOWN继续保守失败，不返回假空值/成功、不重新派发、不释放预留/清账。保留事务与digest/原子唯一裁决，没有WAL迁移、第二缓存/余额或新恢复框架。

先用真实独立SQLite写进程持EXCLUSIVE锁和公开当前Reader建立确定性RED（仅Provider边界合成，实际SDK、BudgetLease.snapshot、readAccounting/readAudit/readWorkAccounting/readWorkAudit/public inspectWork）；同入口同断言GREEN。记录PID、锁获得/释放、读起止和实际字节/账户/审计不变。真实超窗口锁、SQL失败、未知用量预留和既有COMMIT丢ACK/NS-01/取消/撤权/迟到/UNKNOWN拒绝不退化。原跨进程正例不改发送断言，两main加唯一extra，按事前固定次数在全新根重验；不挑绿覆盖失败。

补充F03同一持久化断口：第一轮读锁GREEN后，事前3次真实跨进程正例仍有一次STATE_FAILED、0次发送；其无SQLite错误日志，内部原因尚不能从结果反推。核查safe的existsSync→lstatSync发现SQLite正常COMMIT删除瞬时journal存在元数据竞争。另立真实两进程COMMIT同步反例：路径检查实际看到journal后，允许原写进程COMMIT删除，再执行真实lstat；不替换文件系统返回值、不改业务记录，要求正常读回及账户/审计/发送数不变。路径检查应使用一次真实lstat的缺失结果，不能以先前存在性推定稍后仍存在；保留真实存在的symlink/hardlink/越界拒绝和其他I/O错误。此为同Adapter必要私有修正，无新SDK/存储结构/调度重试。先RED后改safe，保留首轮016-2失败及UNKNOWN预留，禁止把它回填成功。

最后运行受影响真实发布/正常入口/参数/共享持久组、完整types/canonical portable和适用组件build；原F01/F02正反例保持。固定Mini-newarch-D006-repair002完整源码/WIP、两diff、同C安装/加载、参数、全日志/新合成事实与安全归档后停止。作者回执不是D_PASS，独立结果由用户手动转交。

## D006 repair001 / F01–F02（2026-10-23，当前限定授权）

来源为 D006 的2363文件后像（manifest 389c2889），保留全部既有 WIP；独立 NEEDS_REPAIR 的 F01/F02 是本轮唯一行为增量。精确 C 包/安装、模型/参数、恢复策略与旧任务停止边界不变。新对象 Mini-newarch-D006-repair001，不追认原 D006 通过；独立复核由用户手动转交。

- F01：完成资格须比较同一原生 run 的实际可信 audit contextVersions.scope/configuration/revision 与当前业务 identity，并保留 Task 派生、work/chain、Session/operation、物理终态、计量和 UNKNOWN 门。缺失/错绑拒绝，不以调用者标签、假完成或审计重写替代。正常 Case Application 的真实 propose_decision 正例与只变 scope 负例先 RED 后 GREEN；同时覆盖各字段实际职责及共享 Case/Desktop/Member/Workspace/报告发布接点，正式人工采纳/CAS不改变。
- F02：link 的异步读源、创建提交与 close 必须有一致准入/结算边界。关闭后拒绝新建，close 等待本实例已受理的 link；效果前再次检查当前授权，真实已提交的本次会话按现有业务生命周期关闭。ACK不明保留真实记录/回执和错误，不假称未执行，不重发创建、不删除记录。close失败可按原合同显式重试，不能假成功。已有Session关闭、被动跨实例读回与显式重开语义不变，不新建运行/恢复权威。

验收：原独立公开反例仅适配绝对导入路径，实际 Store/Application/Adapter/C、合成 Provider、全新根、真实受限计算/核验，分别保留因果 RED/GREEN 和实际持久事实。补充读源/提交时序、ACK未知、身份/未结算/UNKNOWN反例。最后当前正常入口、完整types/build/canonical portable与受影响回归，八接缝增量矩阵；不扩大SKIP、不修改验证入口。完整源码前后像、两份完整diff、安装和加载身份、全日志及安全归档固定后停止，状态为 D_REPAIR_AUTHOR_RECEIPT_COMPLETE / AWAITING_INDEPENDENT_D_VALIDATION，不是 D_PASS。

# 新架构 v1.2 / Mini PRE-C

## D006 continuation after MA B_PASS (2026-10-22)

Current user authorization resumes the full D result after Mini-newarch-MA-B001.
The immutable before-image is 2356 files, manifest fad65e5b7edb1bd3cd3b3314700daa3a24aa454deba84c80b728dc5c6928d1f9.
The six formal MA B/C originals match their supplied bytes and SHA256. The exact
installed C remains 0.6.0-newarch.1 / 164903 bytes / 5b969fb664069c1895de376cce78cc03ade6df1e0468cab80308ddaad900d012.
All earlier sections below retain their historical scope; they are not renewed
WAITING_C or PRE-C stops. Sole author, Sol/max; no helper or Validator dispatch.

Applicable acceptance is D01-D06/T1-T8 and the latest user prompt sections 4-5:
the actual normal Browser/Application/Profile chain and all eight seams,
retained Case/Decision capabilities, real synthetic-data IR/calculation and
independent verification, review/manual adoption/save/reopen, opaque durable
public work primitives and NS-01 step 6 allowed, Session origin/passive reopen/
lawful continuation without replay. Business states never substitute physical
settlement; UNKNOWN and missing settlement facts fail closed.

Ordinary deleted-producer API/type/import, business fact binding, fixtures and
UI consumers are rebuilt within D, preserving safety/business assertions.
No compatibility shells, old records/authorities or test exclusions are allowed.
Only a real new substantive retirement, fixed SDK public defect, missing
authority/isolation or unknown effect invokes section 6's partial stop.

MA/CA business publication reconstruction: one immutable authorized business
intent binds its existing source snapshot, formal baseline, owner, business
Session/lifecycle epoch, actual recipient, configuration and trusted work root.
Use existing business receipt persistence; no attempt/status/recovery record or
new balance. SDK completion is read through the same AnalysisAgent business
port from public audit/Session facts; caller labels cannot authorize publication.
Pending MODEL proposals are validated before a native run ends, then saved only
after actual completion/settlement is checked. Manual edits/adoption preserve
that committed intent and its provenance, source/head/CAS/epoch checks and exact
receipt replay. Closed/expired/revoked or UNKNOWN calls cannot publish. Child
work inherits its source ancestry; a new command or Session does not reset work.

Evidence root is the existing parent/new-architecture-v1.2-d-candidate-006.
Normal product commands also retain requirement co-design, proposal-only revision
previews and explicit conversation controls through this same executor. A preview
may compile a proposal but has no calculation/report publication authority; its
tool feedback says saved:false until actual qualified completion is persisted.
Requirement proposals likewise become durable only after public SDK settlement.
Passive conversation views expose business text/positions and honest availability,
not a product-owned Session/queue authority. Explicit input/fork/navigation maps
to public native operations; none resets the original work or consumption.
An Open-analysis business child may select the actual source Task's user question
as history. This is a source-bound projection (observed at link time), not an
invented model/user exchange or a new grant. SDK observations qualify pending
physical work; business lifecycle alone never means settled or successful.
Desktop professional drafts retain one immutable disclosed business permission:
explicit command, owner/current source row, payload hash, actual recipient,
configuration and original Case work ancestry. An additive business record stores
that permission, durable revocation and at most one qualified publication fact;
it contains no model Running/attempt/recovery balance or scheduling state. The
existing draft keeps this permission id as provenance. A new public Adapter
completion check precedes publication, then source/CAS/revocation is rechecked in
the same business transaction. Cancel closes business admission before signalling
the SDK; no control ACK is physical settlement. No old rows are migrated. Current
source/config/disclosure and explicit revocation bound permission lifetime; no
arbitrary cumulative deadline is added. Desktop and retained Member use only the
disclosed primary candidate, without gaining analysis-purpose fallback receivers.
Member D closure uses immutable disclosed Task/source/epoch/policy/config permission,
MODEL proposal material with actual native invocation and optional public SDK
completion, and separately qualified real preprocessing/calculation. No model
attempt/state/usage table is reinstated. Question/report publication requires
actual SDK settlement; program proposal can be selected explicitly by the Agent
for local conversion before the native operation finishes. Only explicit user
answer/authorization starts the next business command; reads never do. Source
headers mean actual header values, with types only, never row identifiers/data.
The fresh-task approved Member policy moves forward to revision 2 with
32768/600000, preserving the original MiMo Pro recipient, local process protection
and one conversion correction. Older policy files are not migrated or overwritten.
SDK model observations and local process accounting remain distinct in readback.
Retained Member follow-up is a new explicitly confirmed Case intent against a
current human-closed analysis, never resumption of the originating Task. Its
source binds the real current preparation/plan and original Task work ancestry.
The existing immutable Case business authorization is its sole permission fact;
no synthetic-only TaskResourceProfile/grant is recreated to impersonate that
permission, no model/time/token counter is copied. The original Task/source epoch
and policy identity are bound and checked before effects. Revocation, source/head
changes and any explicit authorization expiry close admission. No arbitrary
300-second (or replacement total) lifetime is introduced. Only approved MiMo Pro
receives safe selected text, aliased business references and verified overall M1
facts; original rows/identity/group labels remain local. Model views cannot use a
missing Member origin to enter the generic unrestricted Case material route.
Retained-plan reading is distinct from current execution/review admission. A
closed Task's current human-final report may expose its exact settled, verified
plan/source provenance for a new Case disclosure. It cannot reuse the old grant
or become execution authority. Existing review/compute guards still require an
active matching original grant. The read path verifies owner, current finding,
Succeeded run, Completed revision/final report and qualified stored preparation;
it never relaxes those execution guards or creates/resumes any Task.
Commands: complete npm run typecheck; focused public SDK/Adapter, durable work,
normal Workspace/Profile/browser, business calculation/verification/publication,
resource/Session/parameter tests; applicable project build and canonical offline
tools/harness/validation/run. Each run retains exact argv, environment boundary,
full stdout/stderr and exit. First assembly FAIL is not causal behavior RED.
Behavior changes use a real public-boundary failing assertion before correction.
Synthetic Provider IO only; new owned roots/processes, external IO blocked, own
instances closed. No credentials/old data/services, SDK/dependency changes or
installation, Provider, Git writes/delivery, publication or other-session contact.
Stop after complete fixed D author receipt or a real section 6 boundary; no D_PASS
or product/CI claims follow from author or historical mechanism evidence.

2026-10-21。沿整体精简原任务；用户转回整体 B_PASS 后的新实现分段，不恢复暂停修补线。
固定输入为 `Mini-new-architecture-v1.2-B-repair001-final`（2351文件清单 SHA256
`143202e49c5ac2ef9b52e137580fae3cdfe8a82a727aa7c14b183c09c2ffa4cf`）。
原 A/T1–T8、受影响 AS-01–20、NS-01 定稿及本轮用户 Prompt 是前向合同。
完整输入、开工快照及结果在原 artifact 根的 `new-architecture-v1.2-pre-c-001/`。

## 当前结果与接口

- PC01/R01/R02：Application 提供当前授权业务能力集合，唯一 parameters schema 和 executor；
  `prepare` 只绑定业务上下文并返回能力，不调用模型、不主持工具顺序、不持 Session/重试。
  所有能力及派生资料读取均检查调用取消、当前业务授权与来源。Task/配置/来源由可信调用方绑定；
  唯一当前方案省略机械引用时直接绑定，显式旧引用、跨上下文引用不能被替换。
- PC02/R04：真实效果前引用拒绝由业务生产者给出安全 code/reason、accepted=false、
  saved=false、calculation_performed=false、effect_state=not_started。非该生产者错误不作此断言；
  已完成计算、保存失败和 UNKNOWN 保持错误/真实回执，不统一 catch 成成功。
  这只是业务事实；映射至 SDK 受信载体等待 C_PASS。
- PC03/R01：真实 Semantic Context/Binding → 完整 IR → 本地计算 → 独立核验及真实 Store
  保存读回。探索始终 MODEL_EXPLORATION/not_performed；业务读回不重新计算。
  拒绝伪核验、范围/hash不匹配、撤权/取消及保存未确认；模型自称完成不形成正式成果。
- PC04/R06：只核实专业资源/草稿资格及长成果同版规则；原生 Skill、文件、Session/压缩归 SDK。
  发现保留 draft Store 的旧 admit/recovery/阶段期限/版本兼容余项，先回交受影响退役核销，
  不修改或调用该旧控制接点，不重建替代文件引擎。
- PC05/R05/R07/R08：准备可信 work/Task/用途关系、原子持久职责及联合验收矩阵。
  SDK 公共持久接口、恢复账户及数据结构、新 Adapter、正常入口联合调用均 WAITING_C_PASS。
  NS-01 第6步允许；C+U+R≤1，G仅历史。Mini不增竞争计数或调度器。

## 范围与验证

允许现有 packages/application、ports、product-core 的专业业务接点及对应合成测试、必要规格。
Storage/analytics 仅实际触及的专业检查与测试，不读旧数据。条件路径是当前业务消费者的失效测试包装；
Browser/Profile只记录未来装配位置，本段不接新运行链。禁止 SDK/vendor/lock/node_modules、其他树、
旧业务Task、Provider/凭据/真实数据、Git写入、服务控制与发布。所有运行使用独立合成根。

先保存确定性缺失行为的 RED，再以相同入口/断言 GREEN；复用专业 Core/Store 的受影响回归。
不运行包含旧SDK入口的整个历史长成果套件，不为全仓编译补兼容壳/throw占位。
整体构建、正常入口、SDK/DTO、共享恢复持久实现、真实模型/用户体验均 NOT_RUN。
当前仅提交 PRE-C 作者回执并停止；不是独立 C/D PASS，也不是新SDK采用或产品接受。

## PC01/PC02 受影响类型断口核销

PRE-C 实际专业依赖中的身份仍引用 B 已删除的 OpenAnalysisRun。沿原 AnalysisRequestIdentity
的业务字段投影定义 OpenTaskIdentity（仅去除模型/provider/input摘要），替换本次实际业务依赖中的
悬空类型引用；不恢复 OpenAnalysisRun、Session/历史模型或兼容导出，不改变持久字节/存储结构。
只清理 open-analysis.ts 本次已不调用的旧报告/提示导入；其他 Case 执行断口仍待 C 后同一实现接线。

## D 接续（2026-10-21，本轮用户明确授权）

本轮起点为最新 Mini-new-architecture-v1.2-r06-f1-b-targeted001：完整2351文件清单
e41585d4f36cca51dca64254470de8db73c122f38b3418af041177b8bb680740。
HEAD仍50c2f3e7，实际含全部既有WIP。F1 B_PASS与SDK C_PASS原件已通过定向SSH取得和校验；
精确C为0.6.0-newarch.1，164903bytes，SHA256
5b969fb664069c1895de376cce78cc03ade6df1e0468cab80308ddaad900d012。
它只授权本候选采用，不升级其他消费者。首件逐符号判断见本轮证据根
new-architecture-v1.2-d-candidate-001/FIRST-RESPONSIBILITY-JUDGMENT.md：受限专业草稿是薄
ExecutionEnvironment消费者，无需额外退役；原两组preparation保留业务正反例责任，重建实际事实装配。
若后续发现额外实质退役，停受影响接点按A/B回交，不用兼容壳绕过。

- D01/T1–T3：正常Browser/Application/Workspace和实际Case/Decision消费者复用同一Pi执行；
  业务prepare的一份schema进入原生DTO、参数准备、执行。静态声明在授权用途内可用；无工程解锁或宿主逐步排程。
- D02/T4：只把当前调用绑定的可信效果前业务拒绝交SDK refuse；业务生产者之外的异常、
  已完成、投影/保存失败和UNKNOWN不冒充未执行。授权、撤权、取消、审计/账本故障仍硬停。
- D03/T5/R05：Mini实现公开work.read/atomic的真实事务/耐久/幂等、可信work/Task/chain/config/
  用途/原生operation关联和业务停止校验。持久SDK记录对Mini不透明，是唯一恢复权威；
  不实现恢复分类、余额或attempt镜像。新存储使用新合同专属位置，不读迁移旧记录。
  NS-01严格not-sent核销后保留L1停止/G1；同W独立合法L2可新原子预留G2并额外发送一次；
  重复核销不释放L2，ACK不明/UNKNOWN/已发送不退款或重放。
- D04/T5：各用途主32768/已有备16384；模型600000、工具硬300000、命令软120000、control30000；
  cumulative unlimited持久计量，无累计300秒或阶段60/120秒。用途/参数/工具/资源/期限语义在首请求前固定。
  R1逐候选窗口/协议开销/余量与输出预留继续检查；估算不宣称Provider实测。
- D05/T6/R06：SDK原生Skill/模板/read/write/edit/Session/上下文是唯一算法。Mini只给批准资源、
  路径/版本/内容/授权端口；完整UTF8/尾部/bytes/hash进入真实专业计算，分页展示不替代完整输入。
  三核心、IR计算、独立核验及正式同版报告资格/全文审查/既有有限修订/保存读回保留。
  MODEL_EXPLORATION/not_performed不能升格。合法停止/被动重开零推进，显式续接不重跑原探索。
- D06/T7–T8：专属新Session来源门先于原生repair；正常封存可重开，未知/旧/篡改/链接/未封存崩溃字节关闭。
  Pi管运行事实，产品管业务事实；不造第二循环、Session、恢复/文件平台或固定答案。

验证seam沿用用户批准的正常Application/Workspace/Browser、专业函数、SDK公共factory/DTO/工具/持久原语；
不新开seam审批。仅合成资料/响应和独立新根，明确父子进程外发阻断；不读凭据、旧Task或真实业务数据。
按当前政策区分B过渡语法/装配失败（非产品RED）、真实因果RED→GREEN与复用C证据。
受影响测试/typecheck/构建/适用规范离线回归须记录完整命令和失败；不补旧fixture或削弱断言凑绿。
本轮唯一证据目录为既有父根的new-architecture-v1.2-d-candidate-001；最终固定完整D作者对象交回即停，
MINI_D_AUTHOR_RECEIPT_COMPLETE/OVERALL_D_PENDING，不派Validator、不称D_PASS，不执行Provider/Git/发行/生产。

## D continuation after RH B_PASS (2026-10-21, current authorization)

Start from Mini-new-architecture-report-history-B001:2356 actual source/WIP files,
manifest e9cdb6d53450afbf10801ed4b3fe81983fa95e57e1b082bb2ec90bfe01078004.
Exact RH B_PASS and C_PASS originals now read back, hashes matched and full text read.
D002 SSH failure remains historical; original D001/A/B/C and role disposition unchanged.
Current evidence: existing persistent parent/new-architecture-v1.2-d-candidate-003.
Continue existing AnalysisAgent, professional prepare and public opaque work primitives
to current Workspace/Profile/Browser and applicable Case/Decision consumers; one Pi engine.
D01-D06/T1-T8 and RH-01-RH-11 remain required. NS-01 step6 allowed, G historical only,
UNKNOWN/sent never released. Preserve actual three-core compute/verification and saving.
Meter projection/private wiring corrections do not change accounting authority.
Checks: focused tsc; current Agent/persistence/Workspace integration; two preparation
groups; actual normal-entry offline consumer; applicable canonical offline validation.
Record exact commands/environments/source/install identities/full logs per run.
New producers/fixtures implement approved contracts; extra substantive retirement follows
current prompt section6 affected A then stop. No helper/Validator dispatch.
Synthetic Provider only, owned new roots, verified external IO blocking. No SDK/dependency
change/install, existing service/old Task, Git/release/production. D author receipt only.

## D004 continuation after ARL B_PASS (2026-10-22)

Current immutable before-image: Mini-new-architecture-request-ledger-B001, 2353
files; manifest f8ab93263c5845eab2ee78eb60e89f63250242b21284968255280940d1e3a987.
ARL B_PASS and C_PASS report/verdict/receipt originals are received, byte/hash
matched and fully read. The previous D004 WAITING_INPUT is historical; no source
was changed at that stop. D004 evidence remains in the same persistent parent.
Use the already installed exact C package, without installation/dependency changes.

Known D assembly gaps now authorized: normal Profile/Workspace/Browser and
applicable retained Case consumers connect the existing AnalysisAgent and opaque
public persistence. Business busy, stop/resume, diagnostics and UI derive from
current public accounting/observations; missing or unreadable facts fail closed.
Retained fixtures and validation/typecheck inventories reconnect to that actual
implementation, preserving their business and safety purposes. They do not
justify restoring old request DTOs, loops, controllers or compatibility branches.

Acceptance is D01-D06/T1-T8 above plus ARL safety purposes, actual production
persistence NS-01, Session passive read and explicit lawful resume, real
synthetic-data computation/independent verification/result save/reopen. Runtime
parameters remain fixed; no output/context/recovery budget relaxation. Tests use
the approved normal entry, public SDK/transport/DTO/tool and persistence seams.
Synthetic bottom fetch only; no credentials, real Provider or old data roots.
Owned isolated loopback/random-port processes may be used and must be closed.
First complete typecheck/assembly failures are recorded before correction;
deterministic behavior gets appropriate causal evidence, not fabricated RED.
Final full applicable checks and complete source/WIP/package/loading/result
identities are required before D_AUTHOR_RECEIPT_COMPLETE. Extra substantive
retirement outside approved A/B stops at a fixed affected-A receipt before deletion.
No helpers, Validator dispatch, other-session contact, Git or publication.

## D005 continuation after CA B_PASS (2026-10-22)

The exact Mini-newarch-CA-B001 before-image has 2356 files; source manifest
e4d268e1501eba876b3439e875340440e23e05119a3224f024934a277fa051e4.
The user returned the independent CA B_PASS; its three originals were received
through authorized SSH, receipt hashes and the entire current source, index and
54 installed C members matched. This supersedes the starting image only: all
earlier failures, consumption, pending effects and UNKNOWN remain historical.
Current evidence is the existing parent/new-architecture-v1.2-d-candidate-005.

CA-D01–09 now permit rebuilding the retained business publication seam. Durable
business authorization binds the selected source, formal baseline, session and
lifecycle; it contains no runtime status, retry balance or attempt controller.
The same AnalysisAgent executes Case and analysis intents. Only current public
SDK completion/settlement facts permit model material publication. The Store
retains source/head/version/lifecycle/permission checks and atomic, idempotent
formal adoption; UNKNOWN or unavailable completion cannot publish a draft or
child result. Manual revisions retain their real immutable grant provenance.
The child work root follows its trusted business ancestry, never a new child or
SDK Session UUID. MODEL material remains distinct from independent evidence.

Continue the already approved normal-entry, public Session observation/control,
resource, parameters, persistence, fixture and regression reconnection. The
protected business and UI tests retain their safety purposes; they are ordinary
D work, not a new retirement Gate. New substantive retirement outside approved
A/B still stops before deletion at an exact affected-scope receipt. No new
runtime/compatibility layer, dependency change, Provider or existing service is
authorized. A complete fixed D author receipt, or a real stated boundary, is the
next stop; author checks do not become independent D_PASS.

### D006 normal launcher after approved retirement
The normal Node launcher shall load a closed non-secret v2 deployment locator
(version, exact profile_root, analysis with explicit analysisModel and
judgmentReviewAllowed, optional metricAssetDisclosureAllowed), rejecting unknown
keys/choices, links, noncanonical/mismatched paths and malformed/oversized files
before service/model admission. It shall directly compose the same current
startIndependentBrowserService. No old first-loop, per-Task route, stage deadline
or request-ledger options return. This version is deployment choice, not an old
Task/Session migration. Passive composition reads no credential and sends no model.

### D006 pure step definition refusal
A completed pure step graph compilation rejection before any framework save or
calculation shall emit trusted PLAN_INVALID with bounded identity diagnostics,
accepted/saved/calculation_performed false and effect_state not_started. The
Adapter forwards that exact business refusal to native Pi within its existing
one correction allowance. The catch is limited to the pure compiler, never
authorization, resource IO, save, audit, computation or arbitrary execution errors.
No automatic parameter correction, counter or alternative loop is introduced.

### D006 native presentation resource
The normal analysis/preview entry passes its actual persisted brief/professional
preference as a closed neutral presentation choice. The Pi Adapter uses the
current public Session template operation and loaded template arguments, not
slash-command guessing, an inline template parser or another model stage.
Native template expansion remains subject to full actual request R1, authorization,
work binding and existing parameters. Invalid names or navigation ambiguity refuse
before sending. Fixed report/document/review contracts remain their existing
separate purposes and payloads.

Known public request-admission CONTEXT_LIMIT projects to the existing neutral
CONTEXT_LIMIT diagnostic. It does not become an unknown effect merely because
no physical request was sent for that refused next request. Prior completed
tools, counted native summary and accounting remain intact.

### D006 live SDK handle ownership
A competing rejected SDK admission cannot replace the issued operation's native
control handle or settlement handle. The Adapter retains only live SDK references
for waiting; it does not infer a new Running/terminal/accounting authority. Native
control selection changes only after the SDK's durable bindOperation acknowledgement.
All issued handles remain awaited until their actual public waitForIdle resolves,
including after the logical run result/cancel returns early. No queuing or retry
is added; concurrent admission still belongs to the SDK.

### D006 current native purpose controls
Requirement co-design retains its actual requirement_design native Session for
passive history, explicit queued input/withdrawal and lawful settled navigation.
Analysis commands retain analysis. Product controls must not silently address a
different purpose namespace. Fork/navigation while preparing refuse TASK_BUSY;
queue acknowledgements are actual SDK facts and never physical settlement proof.
The same real requirement capability factory is used at navigation without a
second controller, synthetic tools or automatic business draft publication.

### D006 unconfigured manual preparation and incomplete recording
An actual current-contract requirement Task that still carries the product's
unconfiguredRequirementHash cannot have admitted an SDK model operation: the
real configuration must first be fixed. Manual-only material revisions therefore
remain not_started across their explicit revisions; no counter is reset. This
does not reclassify a configured, in-flight, failed or UNKNOWN native operation.
A persisted native run admission without a readable accounting record is observed
and unconfirmed, never empty/not-started or zero-metered. No missing field invents
physical settlement, and all existing model/tool usage remains preserved.

### D006 professional asset result projection
Optional simple-plan grouping/filter fields are omitted when not part of the
actual specialized IR. The product must emit a valid public JSON result without
undefined placeholders, without normalizing/dropping arbitrary SDK output. Real
specialized IR, calculations, independent proof and adoption scope remain intact.
A qualified net-sales result retains its real six-metric adoption receipt inside
the same immutable Outcome transaction, including exact asset/source/IR/proof
identities. No model prose, old terminal or native completed flag creates it.

### D006 credential authorization lifecycle
Case and Desktop use the existing LocalModelAccess credential permission: the
accepted preview fixes its credential generation, checked before SDK admission;
the existing credential lease remains occupied until the public SDK has actually
settled. Logical cancellation/close or a failed local result is not settlement.
This is credential authorization/rotation protection, not a new Session, queue,
recovery counter or model execution ledger. SDK still owns those facts.
Close is checked after asynchronous business reads and permission writes. A
late permission is durably revoked before refusing, and closed instances cannot
create or accept a fresh disclosure. No late model publication is adopted; raw
SDK usage/reservations and UNKNOWN remain untouched.

### D006 / AC-XDESK-008 native physical guard reconnection
Desktop conflicting business writes and affordances read the actual public
AnalysisAgent diagnostic for each immutable professional permission. Unconfirmed
physical effects (including absent settlement facts/UNKNOWN after revocation)
block new writes before effects; exact existing command receipts remain reads.
Cancel is offered for a current unrevoked permission with unconfirmed effects,
not inferred from business row version or unpublished status. This is a live
read-only projection, not a durable/runtime mirror, scheduler or recovery count.
Causal RED170: actual pending native request admitted local CPU work instead of
MODEL_BUSY. Same current Application/real SDK/bottom synthetic fetch must GREEN.

### D006 / LA36 work-wide effect uncertainty
The SDK public reconcile callback consumes existing durable public audit facts
for the trusted work ancestry. Any terminal tool outcome marked started/partial/
unknown keeps reconciliation unknown across purpose/run/new authorized child;
no new physical request can bypass it by changing a command or Session. This is
read-only fact qualification, not a product recovery classification or balance.
Existing BudgetStore reservations still guard uncertain model consumption.
RED172 shows one extra request after passive reopen when the callback inspected
only model reservations; exact current Adapter/C/real persistence is the target.

### D006 / JR110 bounded full-document revision checkpoint
The existing review Store requires revision_attempted:true on a revising
checkpoint. The normal Workspace must persist this fact at revision admission
before sending the one allowed revision, both on initial delivery and a current
review update. This preserves the original bounded revision contract; no new
round or recovery grant. RED175/176/177 actual valid conflict review stops at
JUDGMENT_REVIEW_INVALID; deterministic probe178 confirms the submitted review
compiles and isolates the missing checkpoint flag from Provider/SDK behavior.

### D006 / JR112 same-input bounded review failure preservation
After an actual settled, qualified model completion, a trusted synchronous
review/revision parser failure in the existing explicit-retry code set preserves
the already computed/verified numeric report and current failed review checkpoint
(including its actual revised document/claims). It remains unqualified, with no
new decision or model repair. Only that narrow parser boundary may finish a
readable report with failed review; authorization/cancellation/SDK/tool/storage/
audit errors and UNKNOWN still hard stop and cannot be reclassified. A same-input
explicit retry inherits prior revision consumption and cannot request another
merged revision; a materially changed condition remains its own existing review
input. RED183: real recheck parse failure lost the accessible report/retry surface
despite preserving verified steps; no fabricated completion or Outcome is used.

### D006 / normal HTTP async business receipt
The normal report-edit HTTP consumer must await the current asynchronous
Application admission and return its real receipt/error, never serialize a
Promise as success. Other current async Open-analysis routes are checked at the
same consumer boundary. RED186 reached real normal service save/review/export,
then observed missing edit receipt plus an unhandled operation after close.
Manual content save and explicit expression re-review remain distinct commands;
the former does not itself send a model request.

D006 measurement precondition: bind_measurement without a clear current unit interpretation is a trusted no-effect refusal (MEASURE_BINDING_INVALID / unit_interpretation_required), before source/binding/persistence/calculation. Existing SDK bounded correction may consume that fact; all other errors remain unclassified and retain stop semantics. No automatic host correction. Operating method verification uses actual new Task semantic message IDs, real parsed CSV inputs and all retained independent proof/corruption assertions. Historical199 is retained, with fixture and business boundary separately diagnosed.

D006 delegation: a native delegate_analysis tool may create one authorized business child and execute that child through the same public Agent, preserving selected material/privacy/work ancestry and returning only a qualified MODEL result. No host drain, phase loop, automatic replay or human adoption. Settlement must wait only the issued child operation, not its still-running caller. Existing duplicate/stopped child cannot be restarted by renamed instructions; Stop closes child business admission before native abort. Retained human child return/review/adoption remains distinct from model execution.

D006 work-wide UNKNOWN: the existing public reconciliation boundary reads original SDK accounting for every trusted Task/purpose association of the same work, not only the requesting purpose. A known-settled failed extra permits a separate authorized normal purpose but no second extra; unknown final usage preserves its original reserve and blocks a different purpose too. Read-only account observations add no product recovery counter, release, reclassification or new admission policy.226 is causal RED for the missing cross-purpose accounting read;224/225 mixed-protocol error fixture used wrong final-usage keys and failed to establish known settlement.

D006 semantic validation seam: pure interpretation/measurement/step compilation may report a trusted structured pre-effect business refusal with the exact safe semantic validation code, bounded field/label prerequisites and no calculation/save. Bind only after the whole pure definition is accepted; rejected replacements cannot poison accepted semantics. IO/source authorization/cancel/unknown/audit/persistence failures remain hard stops and are outside this pure catch. Use the same existing native refusal carrier/correction limit, no host parameter rewrite/retry. Proposal-only authority never calculates/publishes; deleting the old host readiness loop does not certify a scalar candidate as a fulfilled multi-method Outcome.

D006 diagnostic effect projection: translate trusted SDK not-started/started/partial/completed/unknown separately; never collapse a proven pre-effect refusal to UNKNOWN. Carry the safe public refusal/reason code; the UI describes model-result error without guessing a transport delivery failure. Actual partial/unknown still blocks and completed effects retain receipts.240 is causal RED for the old diagnostic collapse after genuine semantic self-correction succeeded.

D006 current adopted context: render the exact current Task context_materials as a labelled read-only business context card, preserving MODEL and user-adopted-for-this-revision qualification and limitations. Do not reconstruct the retired checkpoint or forge chat authorship from host prompts. Escaping/key order/passive no-mutation are checked; scope/acceptance remains enforced in the existing business Store, never the view.246 is causal RED for the missing current material projection.

### D006 PREP-J01 — current native preparation persistence

Current authorized professional producers must persist their task-owned MODEL preparation through the existing `preparation.save/read` Port before reporting their tool result. Acknowledged semantic/business/candidate state must survive passive reopen without model, calculation or automatic adoption. Framework/Outcome authority is unchanged. Save/readback failure after a tool started is not a trusted no-effect refusal and must stop the native operation; committed-but-ACK-unknown facts stay recorded and are not replayed or released. Existing source/identity/lease checks and snapshot limits remain. Current causal RED: D006 command254/PREP-J01 actually passed through normal Profile/Adapter/C but contained zero persisted snapshots. This is an absent current call, not a new persistence schema or a replacement SDK controller.


## SM01 — 使用实测可用的模型（2026-10-23，用户新方向）

以用户本轮明确方向为准，保留成功模型，停止对MiniMax-M3.1-Flash进行专属适配修补。正常新任务和同work所有用途的主/备中，以已测通的MiniMax-M3替换该失败型号；现有MiMo Flash主/备和Pro报告、Flash审查职责不变。不新增候选、自动fallback、协议修改、故障恢复、自纠或Session机制。原生SDK及端点、thinking策略、窗口/准入、32768/16384、600/300/120/30秒、持久unlimited计量均保留。凭据复用既有默认MiniMax-M3接收方，删除仅为M3.1型号存在的覆盖参数；不读取或迁移旧Task。

SM01-AC01：正常v2启动配置、Profile与实际固定SDK的首请求，以及主备/各用途最终DTO均只含当前获准型号；旧M3.1配置在发送前拒绝，不能藏在MiMo的备用里。
SM01-AC02：模型选择进入现有config_sha256；不重绑旧Task/未知预留、不沿用旧候选的D_PASS认定新模型业务质量。
SM01-AC03：复用现有正常入口、各用途参数、跨用途一次恢复/UNKNOWN、原生read/write/edit、Skill、多轮、计算/独立核验/报告同版保存与被动重开回归；只替换受影响合成DTO型号，不删除或放宽断言。当前三模型短消息200只证明文本连通，不证明工具/正式业务链。

工程增量不授权旧Task恢复、真实业务数据、额外接收方/凭据来源、Git、发行或生产。DeepSeek保留为官方文本已通的待用候选，不在本次增加产品Provider接线。

## SM02 — 第三候选官方 DeepSeek 完整试用（2026-10-23）

用户后续明确要求继续第三候选后再判断整轮失败。此项前向取代SM01最后一句对本轮不接DeepSeek的范围：正常v2配置和同一Profile/Adapter/Pi执行链接受deepseek-flash，官方接收方固定https://api.deepseek.com，openai-completions、thinking off、窗口1000000沿用固定Pi目录与前次成功探针，不提高既有候选窗口。仅新增该主选择，不增加其备用；原M3/MiMo主备及Pro报告/Flash审查不变。所有既批单次参数、R1、共享恢复、真实效果、UNKNOWN、计量和旧Task停止语义不改。

SM02-AC01：正常配置、真实npm子进程、首请求和各用途经过精确C投影实际型号/端点/输出上限；非法型号/接收方不能发送。新配置身份固定，旧记录不重新解释。
SM02-AC02：复用封闭启动环境，仅新增定向DEEPSEEK_API_KEY供后台绑定固定官方接收方；未授权refresh不读/不发，缺失/非法key不发送，撤权清除私有快照，状态不公开key。不开放任意环境、URL或凭据路径，不将key写入配置/日志/存储。实际从用户已指定MacBook Pi deepseek条目经私有管道使用，不使用火山引擎。
SM02-AC03：复用当前正常界面和固定合成题目/CSV，Pi自主选择工具；人工oracle不入模，不宿主代写结果。M3与MiMo各自停止事实不改；第三候选新Task不是重放UNKNOWN work。当前新候选离线证据和真实第三模型结果分别声明，不自动修补前两接点、修改SDK或宣称产品接受。

## IF01 — 纯框架定义拒绝忠实回交 Pi（2026-10-23）

三个实际候选均已完成本轮观察且未产正式成果；成功环节复用，按用户新指令逐个核销失败接点。IF01的真实set_framework参数在当前纯IR中因日期ge/le不是数值而PLAN_INVALID，保存/计算均未发生。仅该纯定义校验边界可通过已有受信无效果拒绝载体把安全错误码和数值范围前提交回同一Pi循环，沿用一次有界纠正；不伪造保存、不自动改参/删日期、不新增时间比较或恢复。

IF01-AC01：实际Application/Adapter/精确C收到原类非法日期范围定义时，Pi可见PLAN_INVALID及准确numeric-range前提，效果not-started、保存/计算0；不因普通纯定义拒绝产生UNKNOWN。模型显式选择下一合法动作，不视为原业务目标已经完成。
IF01-AC02：数据加载/授权在纯catch外，框架持久化在catch后；来源IO、提交/回执失败即使也带PLAN_INVALID代码仍按真实UNKNOWN/停止处理。取消/撤权、不可确认和已完成效果不能被此规则降级。SDK/原生注册及共享恢复不修改。

## OC-B001 — 已核开放计算退役范围的前向适用记录（2026-10-23）

用户转回的受影响 A_PASS 绑定 Mini-newarch-open-computation-A001 加 F01-supplement001／ATTEMPT002。PC03 的“完整 IR”不再要求已退役的有限版本/方法枚举、框架或步骤图前置；IF01 的原失败事实与当时合同保留，不能据此保留旧编译/数值范围门、hash资格门或纠正身份计数实现。当前行为依据为该固定 A 的 TARGET-CONTRACT.md 及 F01 补件，旧时点文字不被追改为新实现已通过。

本阶段仅删除和清失效引用；必要业务/物理保护及独立核验责任按已核 KEEP／REBUILD_LATER 承接，不降低标准。B-after 未经独立 B_PASS 前不新建，当前不宣称计算、报告、恢复或产品验收链可运行。


## RF01 — 删除原生文件单草稿限制（2026-10-25）

用户明确要求查到限制直接删除并重测，免本次独立核验；当前允许无本地计算，数字后核验延后。受测链不再声明/调用Python，原生read/write/edit不再被单个内存draft路径收窄。使用同一精确C的真实独占Task文件环境；保留只读业务资料/已批准Skill、目录/链接/授权保护、计量/取消/UNKNOWN与原共享恢复。报告由真实模型形成并保存读回，不标独立核验或正式Outcome。新配置身份，不改旧Task/SDK/Git。具体当前范围、因果断言和证据见 /Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/new-architecture-v1.2-native-report-files-repair-001/REPAIR-CONTRACT.md。旧独立核验PASS仅属旧固定对象，本修正不继承为新PASS。


## TC01 — 用户前向批准的三核心未核验报告路径

- 正常 Personal Profile/Workspace 的新Task以显式 `model_unverified` 报告策略接回 SCR（含 Binding）、薄分析合同和同一 Pi Harness；策略参与配置身份。
- 薄合同消费当前真实问题、获准来源及已保存业务/语义上下文；资料不足仍允许已获准观察，只暂停受影响动作。来源、任务及版本不能由模型重填或替换。
- 本模式无本地计算、独立数字核验或强制报告前重算；实际工具和Skill声明必须一致。Pi自主选择业务/语义及原生read/write/edit，报告由既有report_edit用途形成，不预制答案。
- 真实Store事务保存 `MODEL_ANALYSIS_REPORT`，标记 `verification:not_performed`、`calculation:not_performed`、`human_judgment:not_recorded`；不能冒充已核验数字成果或对话结果。
- 保存前重核对来源、业务上下文、授权和已结算模型完成事实；保留取消、越界、UNKNOWN停止语义。被动重开逐字读回同版报告和合同，不执行新请求。
- 验证：实际Workspace公共入口的因果RED/GREEN、受影响原生文件/参数/安全回归，以及同题同CSV同模型路线一次真实新Task。用户批准后续本地计算和数字后核验前不恢复这些功能。


## TCUI01 — 同一未核验报告路径的正常浏览器入口与展示

- 用户追加批准一次正常前端全链路实测；沿TC01模式、相同原题/CSV/模型路线及固定SDK；独立新短根、新服务和新Task。
- 受控部署文件的model_unverified模式经正常启动器/服务/Profile传入同一Workspace；不在分析任务挂载本地执行或数字核验工具。
- 快速及专业视图读取同一真实model_report及公开报告投影，明确未独立核验；不展示已计算/独立核验通过，不另造UI。
- 实际浏览器界面提交资料/题目，运行到报告保存、刷新和重开读回；被动读取不新增请求。无Provider模拟或预制答案替代实测。只关闭本轮新服务。


## PRC01 — 保存后数字核验、结论及策略审查（2026-10-25）

当前用户批准三层本次一起实现；沿当前2384文件WIP，精确C包0.6.0-newarch.1不变。前向取代本新模式永不执行数字后核验/审查的试用范围；不恢复有限计算IR、旧Python执行器、旧控制器、旧Task兼容或旧时间覆盖。报告主链仍为SCR/业务语义/Binding→Pi自主分析→MiMo Pro报告→真实Store保存。

- PRC01-01：R0在任何核验/审查请求之前真实保存并可读；后处理状态与报告保存状态分离。被动重开零执行。
- PRC01-02：逐同版全文数字出现位置登记；日期/ID/假设/不可解释数字如实覆盖或未核验，不按方法白名单限制Pi。缺前提只暂停相关数字/建议。原始源SHA、全表/工作表/行列、单位/窗口/业务条件来自实际获准资料。
- PRC01-03：独立原生上下文只得问题、数字定义及条件/获准完整来源，不得报告期待值、作者公式/程序或中间结果。只有核验用途启用固定SDK原生受控进程，报告仍仅read/write/edit；不自建执行器。实际执行及读来源证据、程序/输出身份和独立方法审查齐备才能比较；模型同意或exit0不能冒充独立核验。缺能力则标不足并保留报告。
- PRC01-04：差异保留原数字/重算值/证据和限制；精确比较适用单位及明确舍入，不擅定容差。未覆盖片段不得报告全通过。
- PRC01-05：分离上下文完整送审同版全文、数字结果、来源及业务条件；结论/策略分别有支持/有条件支持/证据不足/存在冲突，运行失败/停止/UNKNOWN与四判断分离。模型审查不是中文确定性证明、因果认证或未来收益保证。
- PRC01-06：全批最多一次合并内容修订、一次全文重审；同work共享原有一次故障额外请求，主备/辅助/压缩等均可靠计量。不自动新Task、换样例/模型/SDK或扩轮。R0与新保存版本/审查分别保留，版本变化失效，不静默覆盖。
- PRC01-07：快/专业/下载/依据/人的选择同一版本与状态；未审稿可读保存下载，冲突/关键条件未满足的建议不可当已认可正式建议。内容确认不授行动权、不解除缺口。分析任务不强迫造策略，补证建议不虚构干预预算。
- PRC01-08：授权/范围/撤权/取消/账本审计/未知/迟到安全门不降低。失败保留报告及部分真实结果；未知占用不清零、退款或重放。新配置身份只用于本轮新Task，旧任务不迁移/续跑。

批准原方案的两个明确边界：沿用judgmentReview授权控制后处理而非报告生成；未授权时仍保存可读未核验R0，不向核验/审查用途发请求。R1纯文字变化且逐项数字原文、定义、单位、范围、来源及条件全部不变时，复用同Task/同源的实际核验证据，再全文重审；任一数字语义或来源变化则补受影响核验，不能借新文本机械重跑已完成效果。

PRC01-V001/V002受影响修正：已知数字资格沿主证据及必要条件的证据引用同样传播，unverified/difference不能换个引用位置取得可采纳资格。数字清点只表达业务定义及原文位置，关联编号由系统确定，不要求模型填写机械身份，更不能将自由编号或期待值送入盲复算；实际请求、结果回映射、同版与未变项证据复用均保留核验。

持久决定：使用现有任务body_json附加版本化报告后处理记录，无新SQL表/迁移；Pi仍为运行/Session/恢复权威。Store仅校验同Task/源/报告版本、事务与真实业务授权，附加事实不创建竞争计数。公开测试接点为现有Personal Profile/Workspace→Adapter→精确SDK→合成transport/原生文件进程→Store→正常HTTP/UI报告投影。

本轮只离线合成；允许本轮独立测试根和自有测试进程。禁止真实Provider/真实凭据/真实业务资料、触碰旧Task/现存产品服务、SDK/依赖变更、Git写入/同步/发布。正常浏览器真实模型质量、QS04及产品/阶段接受不由离线PASS替代。沿用已批准Change007产品/UI保证边界与当前先产报后审查用户决定，不恢复其已取代的旧参数合同。

PRC01-V003/V004/V005：主张关联以不含报告期待值的语义/范围/来源及重复出现身份稳定绑定，不能因纯重排或无关插入机械重算。系统已知uncovered数字的重叠/明确依赖同样限制相关审查资格，不一刀切整报告。独立方法审查须获准完整读取该次原生执行前封存的自有工作文件/程序内容与SHA；命令中的文件名不能代替实际程序，缺失/变动/未读事实不得冒充完整方法证据。复用固定SDK原生执行，Adapter只采集本Task独占执行目录的事实，不新建执行器/Session或开放其他目录。

语境数例外只用于实际用户题目中已给定、无来源/未知前提依赖的context片段，不接受模型仅改kind标签便免除缺证；假设不变现实已满足。所有真实执行回合的不可审阅工作文件均保持资格不足，不因最后一条命令可读而掩盖先前缺口。它们是证据资格检查，不新增Runtime输出/累计/重试/资源限流。


## CW01 — 对话式分析需求三核心（2026-10-25）

本聊天用户已确认IR保留为可读上下文、最终确认版三核心及自然多轮前端并明确授权代码。当前前向范围/删除归属/AC以[CW01薄规格](conversational-three-core.md)为准；不改历史规格、失败或旧候选。固定SDK/旧任务停止/UNKNOWN/消耗保留。当前结果与下一动作在原verification.md追加，证据根为同批conversational-three-core-001。


## PRC02 — 后处理输入合同与系统定位收敛（2026-10-26）

用户已直接授权完成CW01后接续修复C组核验/审查失败。CW01 local006独立native-004已PASS。原C组R0及清单失败原件保留，不能用转换旧响应或重放旧Task证明新合同成功。

工程影响决定：退役模型wire中的全文UTF16 start/end、report_sha256/numeric_sha256/phase复述及自由主张id；保留内部规范化位置、报告/来源版本、完成事实和所有持久校验。模型只提供必要业务选择/判断；当前报告和当前物理响应由现有调用链绑定。不增加数据库表、迁移、SDK层、恢复平台、重试或兼容wire分支。

- PRC02-01：系统从已保存本版全文产生数字出现候选ref、字面量及相邻上下文；模型仅选择实际ref并给定义、单位、范围、源和缺口。系统确定精确位置，未知/重复ref及未经声明字段拒绝；未选择的出现仍是uncovered。稳定业务量身份及未变证据复用不变。
- PRC02-02：全文审查模型仅选择实际段落ref及其中逐字、唯一的quote，再给结论/策略四判断、依据、条件与限制；不能模糊匹配、猜偏移或自动改写引文。系统绑定当前全文范围、报告/数字结果摘要及实际审查阶段，持久记录共用同一规范校验。
- PRC02-03：后处理文本输出事前统一声明为一个完整JSON对象或唯一完整json Markdown围栏；不从散文截取JSON、不补字段/尾部、不为某模型或题目增加特例，也不追加调用。原始输出保留。
- PRC02-04：继续先保存R0、后真实独立执行/方法审查/数字比较及全文结论策略审查。来源/范围/单位/格式/真实执行/完整程序/盲上下文/资格传播、一次合并修订和重审、安全门及累计策略均保持PRC01标准。信息不全只限制受影响项。
- PRC02-05：正常快/专业、下载及重开同版。关联ReportStudio的可选组件未配置应如实显示不可用，不发无效关联读取或伪报暂时读失败；实际读取故障仍保留已有副本和准确失败。该准备不安装/启用插件，不改变分析报告资格。

允许：现有postprocessing业务/应用接口、受影响现有合成Provider及测试、必要浏览器只读状态投影。禁止：有限计算方法分支、旧Runtime/IR兼容链、SDK/依赖、真实模型或凭据（两项工程成功前）、旧Task/服务、Git/发行（条件满足前）。固定SDK0.6.0-newarch.1不变。复用PRC01有效安全与独立计算证据，仅补新wire、实际入口和相邻负例。

PRC02同类接点核销补充：独立方法审查的subject_sha256也由当前真实调用绑定，不要求模型复述。目标选择id、完整实际资料/程序读取与三项方法判断仍显式保留；模型响应不能注入另一subject或存储摘要。持久证明的真实subject摘要继续存在并参与原完整证明。此为同一后处理文本合同的机械字段收敛，不改SDK、执行/恢复/预算或核验资格。

PRC02-V001限定修正合同：系统候选不能把改变数值含义的符号、单一数字的括号表示或数字复合写法截成可认证的十进制片段。原文与完整跨度必须保留；当前精确十进制比较不支持的表示保持unverified，不猜归一化、不按正数计算。该资格沿主证据/条件/整句结论与建议、快专业/导出/持久重开传播；其它完整可核验数字继续真实执行。不要求通用中文数量理解，不据零候选宣称全文数字全核验，不新建计算方法DSL或旧wire回退。来源、程序、真正效果、共享恢复和累计均不变。

PRC02-V001续修边界（local002独立FAIL保留）：相邻数字之间只含符号、标点及横向空白时，不能因空格或某一运算/分组字符把同一复合表示裁成独立数字。按文本边界保留整体，不新增运算求值或操作符方法分支；行、表格单元格和语句分隔仍分别定位。只识别当前前端已支持的成对强调/行内代码分隔符以保留原位，不把正常强调内的十进制无故变成不支持表示，也不借格式删除真实复合内容。保守答案提示检测与数字定位继续分离。原四反例30 / 2、30*2、30^2、30_000及同类符号/空白组合须经实际Workspace、真实原生计算旁项、保存与重开验证；仍未支持的整项及依赖保持未核验，其它合法标量继续执行。

同一续修合同包含Unicode组合标记与格式字符：呈现选择符、组合修饰及连接字符不得被丢在数字/符号边界之外，从而裁出正数片段。不将这些字符归一化成支持的数值，也不按单个符号/模型扩展规则；完整保留原文，对当前非规范十进制表示仍只给未核验。标准数字与普通格式正例、安全门及同报告合法项继续保持。

## NR01 — 原生能力归属与读取封装退役（2026-10-26，用户直接删除授权）

用户连续明确要求删除read_delegation_materials、彻底核对Pi官方工具并删除Pi已有能力的宿主重复实现。本轮以官方工具/SDK文档及本机固定0.86.1/0.6.0-newarch.1公开能力逐项核销；不依靠名称相似删除业务职责，不以旧测试、旧阶段或兼容为保留理由。保留原WIP、独立PASS/FAIL、真实失败Task与UNKNOWN，不恢复旧业务或换SDK。

- NR01-01：退役模型侧inspect_selected、read_project_metric_asset、read_delegation_materials、read_delegation_results专用读取工具及其发现/提示/投影别名，统一使用现有SDK原生read，不新增另一套读取引擎、解析器或新工具别名。
- NR01-02：业务层仍提供当前Task获准资料目录、批准企业资产、可委派材料及已返回MODEL意见的实际资源视图；由既有readMaterial接点提供，页读/截断由原生read执行。资源在调用前可发现，空目录如实返回空，不将“缺少已核验材料”冒充运行错误或新授权。
- NR01-03：只读目录去除旧running/saved阶段前提；存在/身份/版本/资料范围、取消/撤权、停止与UNKNOWN拒绝继续有效。委派创建、实际计算/保存和独立核验资格仍由业务效果合同判断，不能因读取成功获得这些资格。
- NR01-04：沿实际正常Workspace→Adapter→固定SDK→合成transport验证模型DTO无退役工具，初始ready可原生read目录、继续自然对话并持久保存；业务资料/已批准资产及合法材料完整读取，越界/另一Task/陈旧身份/内容变化/取消仍拒绝。验证不能重新使用专用读取工具或独立模拟分发器。
- NR01-05：对所有本轮真实入口、文件读写/编辑/执行、发现、Skill、Session/队列/压缩/恢复、参数准备、调用控制、结果投影进行完整归属清单。已由SDK原生承担的机制不留产品副本；必要授权、来源、真实效果、可靠计量、业务保存与后核验职责保留并具体说明，不把它们变成新的Agent流程门。
- NR01-06：新Task配置摘要前向更新，旧Task配置/恢复/账本不迁移。因果RED/GREEN及受影响回归后固定新完整候选，独立只读核验；限定离线证据不冒充真实模型、QS04、CI或Git。用户条件真实测试/Git授权按已明确范围保留，未通过不自动扩大权限。
# NR02 — 用户确认的整线原生能力退役（2026-10-26，前向）

用户确认先前完整清单：以“新流程必需且 Pi 没有”举证保留；取消 NR01 中将委派资料/结果换成另一组读取目录的保留方案。旧证据不改写。

- NR02-01：正常默认入口只有一条执行路线。需求/资料 → 按需读取获准 metric-factory 资产 → 可见业务理解及用户补充 → 最终确认版三核心作为上下文 → Pi 自主分析 → 报告形成并先保存 → 数字后核验、结论与策略审查。不依赖 reportMode 选择新路线，不隐藏旧回落。
- NR02-02：从本流程删除 inspect_selected、read_project_metric_asset、read_delegation_materials、read_delegation_results、execute_program、execute_independent_program、describe_business、describe_meaning、interpret_meaning、assess_meaning、bind_measurement、ask_user、request_report、delegate_analysis 及专属构造、助手、导出、参数提示、阶段门与旧测试。无别名/兼容壳。委派不属于本流程必需步骤；其他已存在的产品业务资产不因退役而删除。
- NR02-03：复用固定 SDK 的原生 read/write/edit；后核验实际受控执行复用原生 bash。Pi 持有工具参数、循环、Skill、Session、队列、压缩和恢复。宿主仅提供已授权且版本固定的资源、业务保存/资格判断、公开持久事实和必要效果前授权。Native read 的分页/截断不由宿主另建一套。
- NR02-04：信息不全仍能讨论、分析及形成有限报告，只限制依赖缺项的判断/动作。真实确认、来源/字段/资产版本与授权由产品记录；模型解释不升级为企业定义/用户确认/独立核验。R0 保存不能被后核验失败撤销。
- NR02-05：保留原参数、同 work 的 SDK 共享恢复、取消/撤权、真实执行及持久计量、未结算/UNKNOWN/迟到关闭语义，不因删除旧执行器消除真实效果或补发额度。新配置身份前向变化，不重绑定旧 Task 或清账。
- NR02-06：验证接缝复用已批准的正常 Workspace → 实际 Pi Adapter → 精确 SDK → transport 和正常浏览器 API/UI；合成回复只替代 Provider。保留因果默认入口 RED、GREEN、原生读取/来源权限正反例、R0→后核验→有界审查、停止/重开及真实独立执行覆盖；旧工具行为测试退役时迁移仍适用安全断言。
- NR02-07：完成完整候选与独立只读核验后，按用户既有题目/CSV/模型路线/接收方/定向凭据/费用授权做一次全新正常前端试用。精确 SDK 不变；旧任务及 UNKNOWN、预留/累计原件不动。真实通过不代答用户 QS04，也不等于完整产品/阶段验收或发行授权。
- NR02-08：真实试用前完成本线“墓碑代码”清理：按当前真实入口及生产消费者检查退役链专属不可达符号/文件、失效导出与引用、空包装、旧开关/提示和测试接线；不以改名/隐藏或仅保留旧测试维持它们。清理进入固定候选和独立复核；保护历史归档、SDK、原始数据、旧任务和全部失败/UNKNOWN证据。仍适用的安全测试迁移到真实新接点。

NR02-V001/V002限定修正：企业资产版本界面仅按实际批准资产的指标定义、方法引用及真实口径字段展示，不假设存在退款/净销售字段；缺少可选字段如实不展示。选择只保存真实资产/版本及选择动作，用户问题和已保存用户输入逐字保留，不由宿主追加金融含义或伪称用户陈述。选择本身不发模型请求或执行分析，原报告留在历史；后续正常原生读取应消费当前选定批准正文。保留幂等、冲突、版本、撤权和历史展示边界。相关无消费者的旧采纳回执入口及异议草稿/下载空参数一并退役，不恢复旧行为或新建替代引擎。

版本选择属于业务元数据动作：尚无资产、已选同版本及尚未启动的需求对话均须给出真实持久回执；同一命令重复不创建修订，冲突命令拒绝。未配置的需求草稿不因选择资产读取凭据或获得模型授权，首次模型请求仍从原配置准入接点绑定。当前执行中、未结算/UNKNOWN、停止请求及用户输入捕获未完成时不能用选择版本绕过安全门；选择后仍需原有明确开始动作，不自动分析或复用旧执行许可。

NR02-V003：在途版本选择必须服从之后的显式Stop/关闭。复用本工作区现有业务操作取消句柄；真实事务提交时还须匹配动作起始的既有epoch，拒绝另一连接已持久停止的过期动作，不新增持久结构或恢复控制器。Stop之后才发起的新明确选择仍按原授权/结算条件办理；禁止更早动作迟到发布新修订或把stopped改回ready。已保存报告遇Stop时不应被取消动作抹去或生成新版本；同命令只读回原事实，不增加执行权。

V003状态矩阵补清：每次新显式Stop对ready、saved、failed、stopped均持久形成当前epoch栅栏；终态的报告、身份、业务state与计量保留，仅使更早动作失去提交资格。此控制请求没有可重放的业务命令ID，不把连续明确Stop冒充同一业务效果重试；UNKNOWN及已有pending_stop_epoch继续原拒绝/核销语义，不清预留或再造执行事实。覆盖同工作区与另一存储连接，不能依靠进程内取消句柄代替持久裁决。
