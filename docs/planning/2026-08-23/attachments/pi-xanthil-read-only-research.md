# Xanthil 第一期：pi-xanthil 只读研究底稿

> 状态：随规划包冻结的只读研究审计底稿；不是实施依赖或权威
> 研究日期：2026-08-23
> 只读来源：`/Users/huangbo/Dev/Projects/pi-xanthil`，`refactor/main` = `c38a3cd1e0e19509c93a61ab01424b005b29a8bb`
> 对比对象：`xanthil-phase-one-product-plan.md` 与 `model-pack-two-phase-product-plan.md`
> 结论用途：为 Xanthil 产品方案增加一个 JuanerAI 自有、可实施的附件；不是对 pi-xanthil 的依赖、迁移或实现授权。

## 1. 结论

**需要增加附件。** 当前 Xanthil 第一期方案已经清楚规定产品目标、首个用例、数据总边界与不采用项，但仍有六个会让后续 Agent 猜测的实施级产品语义：

1. `S1.1–S3.1` 到五个用户可见阶段之间没有自包含的阶段字典、进入/退出条件或合法回退；
2. 数据合同、清洗 Preview、用途准入和 LLM egress 声明没有最小记录结构及拒绝语义；
3. 假设、反证、确定性计算、Evidence、限制、结论状态和报告锁定之间没有可执行的最小关系；
4. 三个人工 Gate 的输入、可选决定、拒绝后的效果，以及部分失败、取消和重试的产品行为没有定义；
5. “演进现有 `local-analysis`”虽规定了兼容目标，但没有说明哪些行为必须保留为兼容回归、哪些 pi-xanthil 历史机制绝不可继承；
6. Model Pack 方案已经要求 Xanthil Consumer 用用户届时提供的真实用例数据验收，但 Xanthil 方案没有把这项要求明确落在**后续 Consumer Change**，容易被误解为首个合成 CSV Change 已可代表整个一期验收。

建议新增唯一附件：

`attachments/xanthil-first-phase-analysis-lifecycle.md`

该附件应仅服务“首个假设先行分析 Change”和“后续 Model Pack Consumer Change”的边界衔接。深度研究、自主探索、Fork、持久记忆、Subagent 和通用 Skill 管理在首个 Change 中均未启用，不应把它们的 pi-xanthil 实现细节带入本附件。

## 2. 应转译为 JuanerAI 自有产品知识

| 缺口 | 为什么会猜测或回看 pi-xanthil | 应在附件固定的最小语义 | pi-xanthil 一手依据 |
| --- | --- | --- | --- |
| 内部流程与状态 | 主方案只列 `S1.1–S3.1`，但没有说明每个状态代表什么、何时允许重做或结束。 | 用中性、JuanerAI 自有的 `A1–A5` 表示：Intake、Prepare、Plan confirmation、Deterministic execution and verification、Report review and lock。每步写入条件、产物、可见状态、下一步和可回退范围。`S1.1–S3.1` 只作为历史来源范围，不作为实现 enum。 | pi 的 Discovery 合同明确要求未知状态 fail-closed、状态迁移显式化，并把 bounded plan、确定性计算、人工 Gate 分离：`server/src/analysis-projects/contracts/discovery.ts:10-19,23-64`。扫描服务还证明运行状态、活动运行拦截、预算和 abort 不能留给 Agent 自由发挥：`server/src/analysis-projects/application/discovery/discovery-scan-service.ts:75-89,106-150,199-308,329-383`。 |
| 数据合同、准备与用途准入 | 主方案说明 `raw → prepared_detail → aggregate` 与三种用途，但没有指定一次 Run 如何证明“这个 aggregate 可进入 LLM”。 | 定义 `DataContractRecord`、`PreparationPreview`、`DataAdmissionDecision` 和 `LlmEgressRecord` 的最小字段。至少保存 source fingerprint、单表 schema/时间字段、允许变换、确认人/时间、aggregate identity、行级/敏感字段检查结论、允许进入 LLM 的仅聚合摘要和拒绝理由。`prepared_detail` 默认不能进入 LLM；未通过准入时不得降级为“少量样本”。 | pi 的项目规则将 raw 明细、聚合、报告和数据探索明确分层：`AGENTS.md:12-24`；生产计算 Adapter 只返回安全聚合、Artifact 元数据和可重放摘要，明确不返回 raw rows、绝对输入路径或 sample：`server/src/analysis-projects/adapters/discovery-compute-port.ts:8-18,228-290`；行守卫对疑似明细超限直接阻断：`server/src/ai-tool-row-guard.ts:30-70`。 |
| 分析计划、假设与反证 | 主方案要求“假设—证据—证伪”与 Supported/Rejected/Inconclusive，却未固定一条假设的最小字段，Agent 会各自设计另一套结构。 | 为每项 `HypothesisPlanItem` 固定：`id`、表述、可观察预期、证据需求、反证条件、限定范围、确定性计算引用、初始状态；Plan Gate 只能 Confirm 或 Reject，Reject 不创建 Run。不得把相关性写成因果。 | pi 的 Evidence Chain 将叙述、来源 finding、指标快照、限制和置信度分开，并显式标记是否作因果主张：`server/src/analysis-projects/contracts/discovery.ts:335-356`；它的机会生成默认 `causalClaim: false`：`server/src/analysis-projects/application/discovery/discovery-review-service.ts:247-296`。 |
| Evidence 与结论锁定 | 当前报告要求有 Evidence、反证、限制、Run Evidence，但没有规定计算 identity 或无来源数字如何处理。 | 为每个 `EvidenceRecord` 固定：输入 aggregate identity、确定性计算 identity/版本、参数、输出值/单位、来源位置、可重放 hash、支持或反证的 hypothesis id、限制。结论状态只能是 `supported`、`rejected`、`inconclusive`；没有 Evidence 或 Evidence 与报告不符时为 `inconclusive` 或 BLOCK，不能补写数值。 | pi 的 `MetricSnapshot` 将值、content hash 和 computation identity 绑定：`server/src/analysis-projects/contracts/discovery.ts:277-296`；验证记录明确区分 report value、artifact value、PASS/WARN/BLOCK、公式和 block reason：`server/src/analysis-projects/contracts/discovery.ts:360-378`；其验证逻辑把找不到来源的报告数字当作 BLOCK：`server/src/analysis-projects/application/discovery/discovery-review-service.ts:745-754`。 |
| 人工 Gate、失败和取消 | 当前只有“用户确认三个 Gate”；没有定义确认/拒绝/取消后是否生成 Artifact、是否允许报告继续或重试。 | Gate 1（数据合同和准备计划）、Gate 2（假设和分析计划）、Gate 3（报告和 Action Recommendation）各自只能 `confirmed`、`rejected`、`cancelled`。拒绝或取消不得产生被锁定结论；执行期间的失败必须记录 `failed`、安全错误摘要、已完成 Evidence 与未完成项，且报告必须标明 partial，不得静默使用部分结果。首个 Change 不承诺后台恢复；重试创建新 Run 并关联 prior run。 | pi 的运行将 `succeeded`、`failed`、`aborted` 和 `budget_exceeded` 明确区分：`server/src/analysis-projects/contracts/discovery.ts:67-104`；abort 只允许活动 Run、记录原因并回到可重新规划状态：`server/src/analysis-projects/application/discovery/discovery-scan-service.ts:329-383`；人工审查只能 approve/reject/context-added，已审项目不允许再次审查：`server/src/analysis-projects/contracts/discovery.ts:175-208`、`server/src/analysis-projects/application/discovery/discovery-review-service.ts:478-542`。 |
| 确定性工具与输出边界 | “确定性工具执行”未说明工具选取、输出形状和 LLM 之间的不可穿透边界。 | 第一 Change 每项计算能力必须由场景 Analysis Plan 显式引用；未注册、输出未知或行级输出的工具不可经自动 Agent 路径调用。工具输出只允许安全 aggregate/Evidence；Artifact 正文不自动注入 LLM。 | pi 的 Tool Policy 禁止 unknown/row-level 输出进入 autonomous MCP 或 subagent，并要求 command/workflow 不注入此类 Artifact 正文：`server/src/tool-policy.ts:154-203`；Discovery Compute Port 还要求工具先通过 analysis category 与 exposure policy：`server/src/analysis-projects/adapters/discovery-compute-port.ts:115-149`。 |
| 双库首期只读语义 | 主方案说场景资产只读，但没有说明报告怎样引用、什么不允许发生。 | 第一 Change 的场景资产使用 `ScenarioLibrarySnapshot`：hypothesis/strategy 条目 identity、版本/内容 hash、只读标记。报告记录实际引用 id；不得创建 Candidate、Tail、Core、promotion 或持久写入。 | pi 把 hypothesis/strategy 生命周期、Tail 来源和 status 都持久化：`server/src/analysis-projects/contracts/discovery.ts:381-419`，并要求 Tail 写入用户明确确认：`server/src/analysis-projects/contracts/discovery.ts:469-496`。这些只提供“人工确认、无静默写入”的产品原则，不能迁入一期的库平台。 |
| Model Pack Consumer 的一期验收衔接 | Model Pack 方案已经把真实用户数据设为一期验收前提；Xanthil 方案只在首个 Change 写合成 CSV，容易造成两份方案冲突的错觉。 | 在附件单列“Consumer Change 追加验收”：首个假设先行 Change 的两份合成 CSV 只用于该 Change；后续 Consumer 必须用用户提供的真实用例数据，安装并校验已发布 SDK，经场景化 `AnalyticalModelRuntime` 本地推理，记录 Pack/model/checksum、输入快照、Runtime、provenance、限制和兼容失败。合成 fixture 不得替代此验收。 | 这项不是从 pi-xanthil 继承；应以 `model-pack-two-phase-product-plan.md:94-126,136-151,276-286` 为 JuanerAI 产品权威。 |

## 3. 推荐附件的最小目录

```text
# Xanthil 第一期分析生命周期与边界

1. 适用范围与非目标
   - 首个假设先行 Change；后续 Model Pack Consumer 追加验收
   - 不包含深度研究、自主探索、Fork、记忆、Subagent、Skill 管理
2. A1–A5 生命周期
   - 输入、允许状态转移、用户可见阶段、输出、失败/取消
3. 四个最小记录
   - DataContractRecord / PreparationPreview / AnalysisPlan / EvidenceRecord
4. 三个人工 Gate
   - confirm、reject、cancel 的语义及 Artifact/Run 影响
5. 数据与 LLM egress
   - raw/prepared_detail/aggregate 的准入矩阵和 egress ledger
6. 假设、证据和报告锁定
   - hypothesis status、反证、限制、非因果默认、Action Recommendation 非执行性
7. Run、错误、取消与兼容
   - 状态、partial rule、retry、既有 local-analysis 兼容回归边界
8. Model Pack Consumer 追加验收
   - 真实用户数据、SDK identity/validation/local predict/provenance/fail-closed
9. 明确不继承的 pi-xanthil 实现
```

这个目录让后续 Agent 可以从 JuanerAI 规划包读完所需语义，而不是重新打开 pi-xanthil 的 Discovery、Desktop、SQLite、HTTP 或 Tool 管理源码。

## 4. 明确不应继承的历史实现或外部依赖

以下内容只能作为研究事实，不能写成 JuanerAI 的路径、运行依赖、合同或实施要求：

| pi-xanthil 历史实现 | 不继承原因 | JuanerAI 应保留的抽象原则 |
| --- | --- | --- |
| `analysis-projects/**` 的 Express Router、SQLite migrations、workspace/project IDs、HTTP idempotency 和 Discovery `S10–S15` | Xanthil 首个 Change 是 CLI 的假设先行闭环，不是 Desktop 的 Discovery 服务；主方案已明确不吸收现有控制面。 | 状态显式、未知 fail-closed、计划有界、证据可重放、人工 Gate。 |
| `DiscoveryComputePort` 的 Node 子进程、`summary.json`、绝对路径、`clean_data` 目录名和工具 registry | 属于 pi-xanthil 的基础设施和目录约定；直接复制会把外部仓库的运行假设带入 JuanerAI。 | 仅准入的确定性计算、行级输出阻断、安全错误摘要、可重放计算 identity。 |
| `subagent-core.ts` 的 Pi session、`.mcp.json`、本地路径沙箱和模板配置 | 首个 Change 不实现 Subagent；而且 Pi 类型/会话结构不能进入 JuanerAI Product Core。 | 后续启用时遵循最小数据文件、最小工具、固定输出目录、网络默认关闭的原则。证据见 `server/src/subagent-core.ts:85-120,161-222`。 |
| `skills.ts` 对 `.pi/skills`、home directory 与自动生成 bridge 的扫描/写入 | 首个 Change 不实现通用 Skill 管理；这些都是 pi-specific 文件布局。 | 后续 Skill 选择应验证显式声明的、可用的受信任 Skill；`undefined` 继承、空数组禁用、非空列表校验的三态可以作为设计启发，不能复制路径。证据见 `server/src/skills.ts:104-141`。 |
| `memory-injection.ts` 的统一记忆、评分、token budget、全局池和 UI | 首个 Change 只使用场景自带的只读条目，持久记忆明确延后。 | 未来若实施，先决定候选过滤、来源、选择理由、token budget 和 egress；不得把 memory 当作权威事实。当前 pi 实现本身包含复杂治理过滤和多信号评分：`server/src/memory-injection.ts:325-398`。 |
| 任何 pi-xanthil 的测试、fixture、模型、运行目录、版本/SHA 或已部署状态 | 它们不能证明 JuanerAI 行为；Xanthil 的兼容基线是 JuanerAI 当前 `local-analysis`，不是 pi-xanthil 运行结果。 | 在 JuanerAI Change 内重新写 Specification、RED/GREEN、contract/integration test 和验收证据。 |

## 5. 对 Xanthil 主方案的最小修改建议（供 Controller 决定）

1. 在 `§5.3` 的 `S1.1–S3.1` 说明后，链接推荐附件，并声明附件中的 `A1–A5` 是实施用的 JuanerAI 自有阶段字典；
2. 在 `§9.1` 的“可转化设计启发”之后，改为链接该附件，而不是把 `analysis-projects/discovery`、工具、Subagent 和 Memory 列成要求 Agent 继续研究的开放线索；
3. 在 `§10.2` 或 `§11` 明确：合成 CSV 仅覆盖首个假设先行 Change；Model Pack Consumer 的一期验收必须遵循 Model Pack 方案，使用用户届时提供的真实用例数据；
4. 在 `§13` 把“精确 Port、Schema、fixture 值”等 Pending 保留给 OpenSpec，但不再把流程、Gate、错误和 Evidence 语义留空。

## 6. 未决点

- `A1–A5` 的最终中文显示名、Artifact 文件格式、具体字段编码和命令名不应由本研究决定，应在 OpenSpec 中冻结；本附件只应冻结产品语义与 fail-closed 边界。
- “prepared_detail 是否允许进入本地 Model Pack 推理”的数据合同，需要 Consumer Change 基于具体模型用途、用户真实数据和安全边界决定；它不等于允许进入 LLM。
- 首个 Change 是否需要细粒度的 `partial` 报告展示还是仅保存失败 Run、以及 Retry 是否暴露在 CLI 中，仍需由该 Change 的产品/SPEC Gate 冻结；但“不得把 partial 伪装为成功结论”应固定。
