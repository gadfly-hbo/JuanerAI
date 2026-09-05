# JuanerAI 自动化修复主计划

## 身份、当前授权与终点

- 计划 ID：`JUANERAI-AUTOMATION-REPAIR-20260905`；路线版本：v1。
- 用户于 2026-09-05 明确同意 M0–M4 路线和支线回归规则，并要求“先固化这个修复任务项目计划，然后进行推进”。这是当前计划与按 Gate 推进的授权；历史交接中的只读限制属于已完成轮次，不重放历史角色实例批准。
- 路线状态：用户已批准。Development-readiness：独立 [review 001 PASS](reviews/plan-review-001.md)，仅认证可进入 M1；M0 完成。当前执行位置始终以动作卡和正式 Gate 证据续接。
- 唯一目标：在重启 xanthil-desktop 前，修通并验证 JuanerAI 自动化交付链，完成修复集成和运行主机准备，提交“可进入 Desktop 启动决策”的证据。
- 本任务结束于 M4。首次真实 Desktop DISPATCH、Desktop 产品实现、真实 provider/model 调用在任务之外；不能以离线验证声称这些动作已经发生。
- 本文件固定任务路线与完成条件，不替代 AGENTS.md、已批准 OpenSpec、signed authority、WIP 或 Controller Gate。路线批准不等于任一 Spec Gate、TDD_READY、Validator PASS 或外部动作已获批准。

正常交付链：签名 DISPATCH → Worktree → Spec → Test RED → Worker GREEN → Regression/Retirement → 精确 STAGE → Candidate commit/readback → Final Validation → Validator → branch push/readback → Candidate freeze → PR/readback → Handoff → AWAITING_CONTROLLER。

## 执行入口与固定顺序

每次续接本任务，先读本文件、[NEXT_ACTION.md](NEXT_ACTION.md) 和动作卡引用的上一份固定进度回执，再读当前 Change verification 与证据；从未通过的验收点继续。动作卡是恢复游标，项目板是观察面，两者均不授予 Gate 权限。

| 阶段 | 工作与依赖 | 交付物及完成条件 |
|---|---|---|
| M0 固化主计划与合同分流 | 保存路线、B0–B5、当前附件、必要合同选择及授权边界；新鲜只读 implementation-worker 视角 Reviewer 检查计划 | 路线可执行、M1 输入无关键猜测；下游合同选择有明确 owner、冻结 Gate 和 stop line。PASS 只允许进入 M1，不宣称 M2 Spec 或实现已 ready |
| M1 关闭 WVEB | M0 后，现有六文件 Spec clarification → 完整七文件审查/ponytail/Spec Gate → 379 Test adoption → 因果 RED/Readiness → 新 TDD_READY → 两生产文件最小 Worker → GREEN/regression/canonical/retirement → 新 Validator | B0 关闭，WVEB 正式 Acceptance、合并、归档与 live-main readback；历史失败保留。达到这一点前 L3 保持锁定 |
| M2 修通完整交付链 | M1 后，一次性闭合下游合同包；按 B1→B2→B3→B4→B5 实施。先 Regression→Candidate 检查点，再 Candidate→Handoff 检查点 | 生产组合在隔离临时 Git 中，从实际 Worker 文件修改经四个公共方法到完整 Handoff；正常、失败、一次允许的 Validator 修复和第二次失败停止均有证据 |
| M3 修复验收、集成与运行部署 | M2 后，冻结完整质量/Retirement/traceability 证据，新 Validator，Controller Acceptance、合并归档；具备具体部署/回滚授权后更新运行主机 | live main、验证的修复代码、Mac mini 安装态相符；权限、服务、EMPTY pointer canary 通过；重新生成 D1 包并读回 MacBook/Mac mini/Host Loop 基线与 WIP |
| M4 Desktop 重启前结论 | M3 后逐项核销 B0–B5、环境和授权前提 | 给出证据支持的“可进入 Desktop 启动决策”，明确首次授权产品运行才能完成的外部正向证据。若仍有阻塞，继续本任务的对应阶段，不虚报完成 |

M1 的 WVEB 集成关闭是 M2 的硬依赖，不延迟到 M3。M3 负责下游修复的最终集成与统一安装。每个 Change 自身仍走完整 Gate，不以主计划阶段代替。

M2 的两个检查点不预订 Change 数量。Controller 在合同闭合后选择最少独立可验证批次；批次调整不改变 M0–M4、B0–B5 或最终验收条件。

## 有限阻塞与验收映射

以下是 2026-09-05 已完成全链路只读审查的登记，不要求重新泛化调查。源码行号可能随修复变化，证据应绑定当次完整 SHA。

| ID / 阶段 | 分类、生产者与消费者缺口 | 最小工作与关闭条件 |
|---|---|---|
| B0 / M1 | WVEB 已证实 cwd/head 类型消费顺序缺陷；数组 prototype 与 root 输入/身份分类需 Spec 明确。L1 snapshot 与 L2 execution 接收 caller-owned 值 | 完整复用两份附件；279 retain + 100 add = 379；不新增第三生产文件。新叶允许已有正确案例直接 PASS，不把所有新增叶强制算 RED |
| B1 / M2 | Coordinator REGRESSION 丢弃签名完整 definitions，只发 validation_scope 与 baseline；WVEB 消费完整 definition/WorktreeSubject；receipt 与 Ledger 不闭合 | 签名定义与固定用途映射、实际 post-Worker subject、两次执行完整 receipt 和 Ledger readback；失败产生持久 closed state；才可进入 STAGE |
| B2 / M2 | STAGE 使用旧 clean evidence 或要求实际 Worker 修改后仍 clean；scope 规则被作为实际 path list；Candidate/index/readback 和事件细节不全 | Worker 后新鲜完整实际路径，scope/index 检查、精确 stage、无 remainder；parent/tree/branch/commit/index 一致；提交后 clean；完整 Candidate event；四个公共方法可达 |
| B3 / M2 | Final Validation 仍发旧 SHA 请求；WVEB 仅支持 WORKTREE/REGRESSION，Candidate receipt/ref 不闭合 | 现有 validation gateway 的 Candidate 分支须经 Spec 冻结；Final Validation 实际执行绑定 Candidate，完整 receipt 校验、Ledger readback、candidate.validation_refs 一致 |
| B4 / M2 | Validator FAIL 第一次无分类直接修复；PASS 从请求推导 validator_head，而非报告证明 | 读取 exact Validator head 与 finding classification；只有同范围 implementation finding、attempt=0 可一次修复；合同/范围/权限等问题立即 BLOCKED，第二次 FAIL BLOCKED |
| B5 / M2 | PR producer 缺 idempotency_id；Handoff 空字段占位、错误 diff contract ID、receipt/Ledger refs 缺失；gateway throw 可逃逸；事件细节不足 | 补齐现有 PR 请求；Handoff 真实 changed_paths、validation receipts、Ledger refs、delivery/PR/Candidate 身份、风险与未验证项；使用 JUANERAI_GIT_DIFF_V1；四个已有恢复边界内 readback，所有失败正确闭合 |

B1：AC-DTF-002-03/07、005-02/08；B2：AC-DTF-004-01、005-03/04；B3：AC-DTF-004-02、005-08；B4：AC-DTF-003-02/03/04、004-02；B5：AC-DTF-001-08、003-06、004-03..08、005-01..08。规范见 [Foundation spec](../../../../openspec/specs/dual-device-transition-foundation/spec.md)；后续 Spec 在 Test 前将这些验收要求映射到明确测试，不从本表发明新的 AC。

事实依据：当前 [Coordinator](../../../../tools/harness/change-coordinator/coordinator.mjs)、[production composition](../../../../tools/harness/change-coordinator/production.mjs)、[Git adapters](../../../../tools/harness/change-coordinator/adapters.mjs)、[host loop](../../../../tools/harness/change-coordinator/host-loop.mjs)；原始 [D1 阻塞与解除条件](../../2026-08-28/d1a/evidence/coordinator-regression-pre-dispatch-blocker-001.md)。这些是审查证据，Reviewer 不必通过重扫实现来补计划语义。

## 合同登记与实施前 stop line

Controller 拥有合同选择和 Spec Gate；角色只编码已给出的选择。当前用户批准的是路线和按 Gate 推进。以下下游接口建议不是已批准的 schema delta，M2 实施前必须形成一个完整可审决策包；M1 不依赖其先行实现。

| 决策 | 推荐方向 / 当前状态 | 冻结点 |
|---|---|---|
| C1 WVEB admission | M1 沿已同意的 379 方案推进 Spec：六个 caller-owned 数组要求当前 realm Array.prototype、dense own enumerable data indices；frozen/readonly 合法；cwd/head primitive string 先检查；root 非 lexical-normal 为 INPUT_INVALID、合法词法后的真实身份冲突为 SUBJECT_MISMATCH | M1 六文件 Spec clarification；Spec Gate 前规范化；新 TDD_READY 前固定新 Test 身份 |
| C2 signed definitions | 推荐保留 signed 六字段 definition；明确两个验证的固定 ID、顺序、Regression/Retirement 对应和 Final Validation 定义选择，不依赖索引猜测 | M2 下游 Spec Gate 前；涉及签名结构改变则先用户决定 |
| C3 STAGE | 推荐前置 clean 指正确 branch/HEAD 和空 index，工作树可有且仅有允许修改；inspectWorktree 提供封闭实际路径清单；提交后才全 clean | M2 Spec Gate 前，冻结新鲜观察到 stage/readback 的一致性和失败规则 |
| C4 Candidate 路径证据 | 推荐由现有 canonical-diff receipt 返回精确排序 changed_paths，Freeze/Handoff 时重新 readback，不增加 Candidate State 字段 | 这是 gateway output 合同选择，需用户确认及 Spec；尚未实现或宣称可用 |
| C5 Final Validation | 推荐同一个 validation.execute 上封闭 WORKTREE/REGRESSION 与 CANDIDATE/FINAL_VALIDATION 两分支，后者绑定 Candidate 和干净候选工作树 | 新请求/receipt 分支先用户确认及 Spec；不在 WVEB 中扩大范围 |
| C6 Validator RESULT | 推荐增加 exact validator_head 与 finding classification；只允许同范围 implementation 自动修复一次 | 新 output/settlement 字段先用户确认及 Spec；精确 enum/序列化由获批语义派生 |
| C7 Handoff 与错误 | 既有完整事件、receipt、PR idempotency、diff contract ID 及真实证据必须恢复；ledger_refs 推荐用现有 Ledger readback；异常映射既有 reason/action | M2 Spec 冻结 delivery ID 生成先后、证据来源和闭合失败结果；如需新 authority/恢复边界先用户决定 |

C1 详见 [379 candidate](attachments/wveb-379-candidate.md)，其 379 是计划数量而非执行结果。仅六个现有 Spec 文件：design、delta spec、test-plan、tasks、traceability、verification；proposal、REQ/六 AC、公共方法、receipt/hash、timeout 和路径边界保留。Test 仅现有唯一文件追加 N114..N213；原 C001..C166、N001..N113 正文、顺序、helper 保留。Worker 仅 snapshot module 与 production.mjs 的相关私有 guards。

## 支线回归规则

1. 每次推进记录当前 M、B、交付物、下一验收点。状态汇报不能只报局部修复名称或测试数。
2. 新发现先落入 B0–B5；不阻塞本次验收的记录延期。确实阻塞才建立必要支线，并写证据、owner、最小范围、完成条件、返回位置。
3. 支线修完先重跑被挡住的原验收点，证据通过后关闭支线并返回；不能沿支线另立主目标。
4. 新公共合同、持久状态、权限、产品范围或恢复机制需要用户决定，使用既有 Contract Change Request；不默默吸收，不重复请求已获得的同范围授权。
5. Test/helper/oracle 错误返回 Test Design，冻结生产；production 缺陷返回当前合同内最小 Worker；环境问题恢复已批准环境，回原检查。
6. 同类第二次修正触发既有复杂度 root-cause review；记录原因和 release condition，不改变主计划终点或降低测试。
7. PSP 与其他完成能力继续复用，只有新的直接证据证明它阻塞本任务验收才限定重开。旧终止 Candidate/RGE 尝试不恢复。
8. 所有主计划变更记录原路线、具体证据、影响、最简单替代和用户决定；版本变更后保留旧决定。Gate 状态变化只更新动作卡/证据，不改路线版本。

支线记录格式固定在 NEXT_ACTION.md：`ID | M/B | 原验收点 | 证据 | owner | 最小范围 | 关闭条件 | 返回点 | 状态`。这是人工 Markdown 记录，不增加 runtime schema、scheduler、数据库或新框架。

## 固定进度回执（用户批准补充 A1）

2026-09-05 用户明确要求纳入以下汇报规则。它只补充现有 M0–M4 路线和支线回归规则，不新增修复范围、不改变 Gate 或 M4 终点；不触发重新规划或重开已完成任务。

在阶段完成、必要支线返回、遇到阻塞暂停、会话交接时，Controller 必须用以下四项作简短回执，分别标明已完成、尚未验证和被阻塞，证据链接到文件或结果，详细日志另附：

1. **阻塞关闭**：指出本轮关闭的 B0–B5 及其关闭依据；没有关闭必须写“本轮未关闭阻塞”。文档数量、测试数量或角色返回不能替代实际关闭。
2. **链路位置**：明确 Worker真实修改 → Regression/Retirement → STAGE → Candidate/readback → Final Validation → Validator → PR/Handoff 实际验证到哪里、下一道未通过验收点是什么；分开表述组件验证与完整链路验证。
3. **支线回归**：列出开放支线；每条绑定所属 M/B、关闭条件、准确返回点。支线修完先重新通过原验收点并返回主计划，才报告关闭；不沿支线另起主路线。
4. **距离 M4**：列出到“可进入 Desktop 启动决策”剩余的明确事项，以及下一步完成哪一项。新增事项明确归类为原有 B 阻塞、必要支线或需要用户决定的范围变更。

最新回执保存在现有 NEXT_ACTION.md 的进度回执段；动作卡只维护一个最新位置和回执引用，保留前一回执供续接核对。不另建状态系统或平行进度表。每次续接读取上一份回执，从未通过验收点继续；局部 PASS 不能暗示整条链完成。

## 验证与完成判据

- M1：唯一 Test 379 叶的独立 mutation/oracle、自检与真实 child 证据；现有 279 全保留；新叶可既有 PASS；生产仅改因果 RED 指向的两文件范围。GREEN 后 canonical、受影响 suites、Retirement、scope/traceability、新 Validator。
- M2：使用 applyControllerCommand、run、settlement、status 和真实临时 Git；从测试拥有的实际 Worker 文件修改到 Candidate commit/tree 和 Ledger readback，再到 Final Validation/Validator/PR/Handoff。隔离环境允许 synthetic signed inputs 和边界受控的远端/Agent替身；Core、文件修改、Git staging/commit、worktree validation 不能被恒定 PASS double 替代。生产外部 Adapter 须有独立 contract tests，明确替身边界。
- 至少覆盖：合法 Worker dirty 状态可推进、scope 外或 dirty index 被拒绝；两次 Regression identity/receipt 错误不 stage；Candidate parent/tree/index/HEAD mismatch 不验证；Final receipt/Validator head mismatch 不发布；同范围 Validator 一次修复走 causal RED/GREEN，新 Candidate 重验；第二次或范围外 FAIL 停止；PR/Handoff mismatch、Ledger/readback/执行异常不虚假完成。
- 所有期望失败应命中声明 frontier；早期 INPUT_INVALID、helper-only、raw-Git-only 或源代码存在不能证明完整公共链。完整 SHA 严格相等；commit SHA 和 tree SHA 分别证明，不用前缀比较。
- canonical 使用 tools/harness/validation/run，保留 expected real-Pi skip，未授权 provider 不调用。每个实施批次在 Test 前冻结适用 focused/contract/regression 命令，证据绑定确切代码与测试。
- M3：具体部署包先具备 exact integration SHA、安装清单、权限/服务检查、既有状态保留、精确回滚方案和授权；EMPTY canary 不消耗真实产品 WIP，不清理 pointer/evidence/history。重新读回 D1 三方基线与 WIP。
- M4 完成报告同时给出：离线链路 PASS 证据、主机就绪证据、B0–B5 全关闭、必须留待首次授权产品运行的真实 Evidence Ref/branch/PR/Handoff 正向证据、Desktop 仍需单独 DISPATCH 授权。若影响正确性的问题仍未关闭，则回对应阶段，不能写“就绪”。

## 已完成能力与历史证据

PSP/pre-Candidate REVISION 已集成，复用其失败分流、同范围 revision、authority/CAS 绑定，不重开。Git commit/readback、branch transport/readback、Candidate Freeze 主体检查、host action/pinned hash 与 artifact/inventory 绑定作为现有基线复用；组件证据不能替代 M2 的整体生产组合证据。

2026-09-05 计划落盘前读回：WVEB branch 为 work/macbook/change-coordinator-worktree-validation-execution-boundary，HEAD/main/origin-main 均为 `33f04a35d13abe64f4394d54eec166b58cb44716`，index 空。Test SHA256 `19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a`；production `757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc`；snapshot `43e72532f3e68069fdc6be8198dcc706c9961ba33457d5c1fde61cd53a4563b0`。这些是当次外部证据身份，不是永久 Test 常量。

已有 Worker Revision 002 日志：focused 279/279、Coordinator 358/358、Board 12/12、canonical 1410 PASS/0 FAIL/1 expected skip。当前 Readiness 不通过、Retirement 未关闭、尚无覆盖最新结果的新 Validator PASS。这些历史运行本次不重跑，不以计数替代 B0–B5。

计划建立时 WVEB verification 仍包含更早 PRE_REVIEW 和 Correction 007 语境；M1 的六文件 Spec clarification 必须把当前 verdict/next Gate 与实际新证据对齐，并将旧结果明确标成历史，不能覆盖旧失败或据旧文字重放批准。本段是 M0 基线快照，不是后续当前状态；完成证据及恢复位置见 NEXT_ACTION。

## 权威与正式附件

独立计划 Reviewer 只读取本文件、动作卡、两个正式附件、下列明确权威及 review brief，不读取 Controller 未公开推理或其他项目仓库：

- [AGENTS.md](../../../../AGENTS.md)：权限、角色隔离、计划 readiness。
- [执行政策](../../../governance/product-change-execution-policy.md)：单 WIP、自动路径、一次有界修复、四个恢复边界与终点。
- [复杂度控制](../../../governance/change-complexity-control.md)：root-cause return、证据、retrospective。
- [模型路由](../../../governance/agent-model-routing.md)：角色 route 与 dispatch 前置条件。
- [Git 流程](../../../governance/git-development-workflow.md)：分支与集成。
- [Foundation spec](../../../../openspec/specs/dual-device-transition-foundation/spec.md) 与其 [适用 Design](../../../../openspec/changes/archive/2026-08-26-dual-device-transition-foundation/design.md)：当前生命周期、Candidate、事件、Handoff 合同。
- [D1 原始阻塞](../../2026-08-28/d1a/evidence/coordinator-regression-pre-dispatch-blocker-001.md)：最终解除条件。
- [WVEB 字段审计](attachments/wveb-field-audit.md)：现有已完成调查，保留原探针边界。
- [379 候选](attachments/wveb-379-candidate.md)：完整 mutation/adoption 方案；历史 stop text 不覆盖本次新授权。

本轮文档工作为 R0 support；不新增治理系统或改全局规则。后续 WVEB/L3 仍是 boundary Change，使用其适用路由与完整 Gate。
