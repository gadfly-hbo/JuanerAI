# Open analysis runtime boundaries — current opt-in behavior

归档来源：pi-r1-r4-repair，R1～R4及用户批准D1～D8 A；仅已接受的离线合成、显式opt-in范围。当前规格整合已经实现/验证的行为，不是新Runtime、通用仓库或生产启用授权。历史spec及完整REQ/AC/RED/GREEN映射保留在 [归档](../../changes/archive/2026-10-15-pi-r1-r4-repair/spec.md) 与矩阵005/006/007；工程接受附本候选F-ROLE-01具名豁免，原正式Validator BLOCKED保留。用户已明确接受本冻结离线产品，真实Provider/生产/安装发行不在验收内。

## R1 — final context admission and selected material read

R1-CTX / R1-WIRE-01/02 / R1-SCHEMA-OWNERSHIP-01：新opt-in请求在受信phase完成说明/schema/输出cap/signal与候选投影后，对同一个最终DTO做正式SDK准入；每候选、摘要/压缩与恢复后重新检查，包含历史、完整当前工具尾部及输出预留。用structuredClone隔离Adapter拥有的schema，冻结最终DTO不冻结借用的Application动态schema。成功后原样进入物理reserve/issue、对应凭据和发送；策略null或不合格窗口在这些效果之前拒绝，不用合成默认值兜底。SDK/原生Session拥有唯一工具/压缩循环。

R1-READ / R1-SELECTED-READ-01～03：仅对当前Task/scope已选不可变来源，经createExecutionTools(host,['read'])消费原生content/details/offset/limit；宿主仅做业务资料映射和每次前后授权/撤权/source hash复核，不开放任意磁盘、URL、shell或完整搜索。小目录保留全部实际来源/表/字段身份；长cell和原source_value通过512 Unicode码点窄JSON行保持所有原字符、位置、reader/status/限制。OCR未确认不升级为事实。预览/读取片段不代替完整本地IR计算或核验；原生50KiB/2000行成功截断和续读不是工具失败/宿主限额。

R1-CAPACITY-JOINT-01：已验证具名边界为8MiB/100000cells单源count999、32MiB四源count3996，以及32×64表完整目录到末表可达/明确末表count1；不外推2048表全局计算或所有容量组合。200k current-tail安全拒绝与明确1M合成候选成功分别保留；512/8192与961743bytes观察不证明生产token安全。

## R2 — physical accounting, safe failures and readback

R2-STORE-01 / R2-WIRE-01～06 / R2-AUDIT-01/02：实际SDK ModelOutcome与每物理尝试原子recordModelUsage接入原持久BudgetStore/账本。known-zero、partial下界和UNKNOWN分列；仅final且output已知可释放对应输出预留，未知保留全部预留，不退款或把无用量猜0。非法/矛盾载体、预留缺失、账本/审计事务失败均失败关闭，不部分确认。所有主备、摘要和恢复共用原Task账本，不清零/换ID逃避历史。

R2-FAIL / R2-CODEC-PHYSICAL-01 / R2-STRUCTURED-RETAINED/REPORT-01：每个实际HTTP/codec物理尝试均有计量，无隐式HTTP重试绕过账本。普通Agent长度/context恢复共享一次extraAttempts，已完成工具不重放。retained_case/report_edit既有完整结构化JSON合同拒绝length；保留真实错误/已知用量，不用Agent摘要再造另一份JSON。保留原retained单候选及2048 cap和旧省略策略。

R2-AUDIT / R2-DIAGNOSTIC-READ-01 / R2-UI-STATUS-01：只接受实际SDK正式匹配的安全ModelOutcome/ToolOutcome；完整invocation、name/effect/resource/receipt/status/modelOutput与模型usage各自保真。Pi类型留Adapter，中立业务DTO经Store→HTTP/client/既有中文执行诊断读回；不泄露原始异常、凭据或未授权路径。被动刷新、重开和历史浏览不触发新模型/工具，不把UNKNOWN呈为成功或可重放。

READ-CARRIER-004 / READ-CARRIER-004-LATE-UI：ToolOutcome.failureCategory为可选封闭枚举not_found/not_directory/is_directory/permission_denied/invalid/not_supported/cancelled/timeout/limit_exceeded/unknown；映射中立file_failure_category。只从正式载体消费，不从message/cause/code或名字猜。旧缺字段/未知外部值读回unknown，旧原件不回填。顶层reason、效果和modelOutput独立；多数read失败仍TOOL_FAILED，host限额为BUDGET_EXHAUSTED，运行cancel/deadline原因不得反转。显式CANCELLED优先附带errno。

取消立即关闭新准入，不等于物理已停止；冻结UNKNOWN/pending不被晚到结果改写。晚到tool.finished/model.finished另存，停止后诊断取event.reason优先、缺省取正式toolOutcome.reason，只有CANCELLED/DEADLINE_EXCEEDED标after_stop；即时工具取消/超时但运行TOOL_FAILED不误标迟到。未实际idle不释放占位，停止后不发布、不自动重试/重放或退款。

## R3 — bounded model observations with complete business evidence

R3-CORRECTION-01/02：探索错误和拒绝目标变更的回包不灌入完整inspection/rows/cells；保留真实纠错身份、输入摘要hash、执行位置和既有一次明确纠正。SOURCES[0]和真实执行器仍取得原获准全量资料；不以改目标/绑定/total_check规避失败，也不把探索成功当独立证明。

R3-OUTPUT-02～04 / R3-MODEL-OUTPUT-01：固定新策略每工具maxBytes=1048576仅为SDK字节上界，不代表token安全。Application小投影进入正式Tool.modelOutput.project，完整IR/计算/Proof/引用/业务原件和Outcome保持；不另造输出仓库或工具循环。proof.primary/independent/group_labels正文及rewrite已保存facts不重复回灌；只有资料source.question与quote完全相同才移除重复副本，唯一原文、用户消息和冲突文字不删。失败输出不否认completed效果/真实receipt/invocation/resourceUnits和已知用量，投影失败/超限不自动重做工具。

R3-VERIFIED/BOUND-MEANING/EXPLORATION/SAVED-PLAN/SAVED-STEPS/FACT-COLLECTION-READ / R3-DELEGATION-RESULT/CATALOG / R3-CHILD-CONTEXT / R3-COLLAB-PROOF：仅当前已确认保存的各具名原件可给业务专用小回执/完整目录和精确读定位。大集合保留全部真实ID/依赖/选择与原件可达，长预览显式标截断；每次重取同一当前原件及scope/hash/owner/授权，来源变更、撤权、错版本/错hash/其他Task拒读。子Context不得借父资料命名空间，MODEL意见/探索不升格为独立事实。现代analysis_tool共享JSON桥按完整同一invocation关联原业务name/value，不猜包装字段或伪换SDK效果身份。

R3-CANDIDATE-SAVED-01 / R3-CANDIDATE-MEANING-READ-01：proposalOnly编译/准备不等于当前框架已保存，saved:false、未采纳/未计算保持；未保存Context不能借已保存meaning namespace读取。原旧required_calculations.execution_plan、finish_result.result及checkpoint/child消费者完整保留，越限继续失败关闭，不删字段伪GREEN。

## D1～D8 A — named preparation ownership and lifecycle

PREP-S01 / PREP-A01 / PREP-J01～05：只有显式preparationSnapshots:v1的新Task1.4能在原tasks表JSON保存具名semantics/business/framework/candidates快照；旧1.0～1.3不迁移/回填，能力随固定产品material/model-output策略身份，不增加SDK Task/观察开关或通用存储。真实执行lease或当前preparing Preview持完整identity/epoch/source/config/producer与Context/IR编译校验才能写入。保存确认后才给preparation/{id}/{sha}/{semantics,business,framework,candidates}.txt精确引用，每次读取复核当前owner和原件；旧/错hash/foreign/revoked拒绝，不回退latest。

快照同owner/内容幂等、仅追加，事务前限单项16MiB、当前及history合计64MiB/1000项、候选64；超限保持原件，无自动删除/压缩/重试。写前失败不伪saved；commit后ACK丢失保留原文但仍未知，工具完成后模型失败保留已知消费/UNKNOWN预留。取消/旧epoch/unknown owner不能迟写，独立晚到事实不覆盖冻结状态。

保存准备不改正式framework/Outcome/Preview状态；两批候选Preview ready仍未采纳/计算。用户显式采纳后新revision重新绑定原受支持IR与当前资料，真实计算和独立核验才能形成Outcome。修订将旧快照连同原Preview owner元数据留history，新scope快照数组为空；仅同baseline/source的既有后继准备继承适用，不能跨owner借原件。旧状态只读重开不发模型。回滚冻结新写/引用，保留Task、账本和UNKNOWN，不让不兼容旧版自动resume新状态。

## R4 — purpose-specific authorized candidates and shared allowance

R4-ROUTE / R4-PURPOSE-01～03：新opt-in analysis/proposal_prepare各自MiniMax-M3(200000,Anthropic)主、mimo-v2.6-flash(1048576,OpenAI)备；report_edit保留Flash/thinking-off为主、MiniMax备。每用途独立purpose.fallbacks，统一modelRecovery.extraAttempts:1且关闭native retry；不叠宿主循环。retained_case仍原mimo-v2.6-pro单候选，无跨用途授权迁移。

每次最终guard/物理reserve前检查候选provider/id/protocol/endpoint/window/output/thinking及现授权/撤权/signal；凭据在guard后按同candidate再次匹配。小窗口/未授权/额度耗尽均安全拒绝；物理未知不能盲切或重做工具。实际RunResult配置candidate与Provider报告的responseModel分列，已完成效果/已知消费保留。旧Task/skills/fork/队列省略配置保持原immutable身份，不热绑或自动迁移。

## Acceptance and non-activation boundaries

实际固定.3包及51安装文件、原子账本/持久Session→Store/HTTP/client/UI和合成codec联合验证成立；参见 [矩阵007](../../changes/archive/2026-10-15-pi-r1-r4-repair/joint-verification-matrix-007.md)、[工程接收](../../changes/archive/2026-10-15-pi-r1-r4-repair/engineering-acceptance.md)、[用户接受](../../changes/archive/2026-10-15-pi-r1-r4-repair/product-acceptance.md)、[正式交付](../../changes/archive/2026-10-15-pi-r1-r4-repair/publication.md)。

生产protocol overhead/margin/image仍UNKNOWN，合成参数/字节数不能放行生产；真实Provider五项NOT RUN与原1-token归因UNKNOWN保持。工程接受以本候选具名F-ROLE-01豁免满足独立角色条件，原报告BLOCKED不改写。Git归档/依赖采用不授予真实Provider、业务数据、生产激活/安装发布、历史Task迁移恢复重放、其他产品升级或共享SDK正式发布权限。


## Forward policy qualification — normal-entry unified-v1

The explicit new-task policy approved2026-10-20 has the limits/lifetime specified
by [NE01–NE07](../agent-host-simplification/spec.md).
Only this opt-in supersedes earlier GB4096, retained-case2048 and short/cumulative
runtime walls; retained-case still uses its original MiMo Pro recipient and no
new fallback/authority. R1/R2/R3/R4 safety, independent qualification and all old
config/task behaviors remain. Buffers4096/8192 are engineering policy, not actual
Provider/tokenizer guarantees. Historical frozen specs/evidence are unchanged.
