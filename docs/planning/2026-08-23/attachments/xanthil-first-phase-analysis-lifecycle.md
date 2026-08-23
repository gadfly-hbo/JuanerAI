# Xanthil 第一期分析生命周期与边界

> 状态：Xanthil 第一期产品方案冻结附件
> 日期：2026-08-23
> 适用范围：首个假设先行分析 Change，以及后续 Xanthil Model Pack Consumer Change 的验收衔接
> JuanerAI 基线：`main = origin/main = 60e13514ffec01c09dc407e4271492458e9f4105`
> 只读研究基线：pi-xanthil `refactor/main = c38a3cd1e0e19509c93a61ab01424b005b29a8bb`
> 权威边界：本文把只读研究中可复用的产品语义转译为 JuanerAI 自有要求。它不授权 OpenSpec Change、代码、依赖、Schema、真实数据访问或真实模型调用，也不让 pi-xanthil 成为依赖、集成目标、发布 Gate 或实施权威。

## 1. 使用方式

设计或实施首个假设先行分析 Change 前，Agent 必须读取：

1. `xanthil-phase-one-product-plan.md`；
2. 本附件；
3. `attachments/xanthil-first-change-scenario-contracts.md`；
4. JuanerAI 当前的 `openspec/specs/local-analysis/spec.md`；
5. `docs/governance/xanthil-first-slice-reuse-baseline.md`；
6. `docs/adr/0003-business-runtime-port-strategy.md`；
7. 涉及数据、模型或 Agent 工具时的 `docs/architecture/data-authority.md` 与 `docs/architecture/security-boundaries.md`。

这些 JuanerAI 文档足以提供首个 Change 的产品和兼容边界。未来 Agent 不需要为了理解本流程重新打开 pi-xanthil；只有用户再次明确要求只读学习时，外部仓库才可作为新研究来源。

本附件冻结产品语义、必需证据和 fail-closed 边界。精确 TypeScript 名称、序列化 Schema、命令、文件路径、资源上限和 fixture 数值仍由对应 OpenSpec Change 冻结，不得由 Worker 临场发明。

## 2. 状态模型纠正

历史材料中的 `S1.1–S3.6`、`S2.4.5`、`S10–S15` 和“十五状态”只记录研究来源，不是 JuanerAI 的实现合同。只读调查已经确认，不同历史文档与 pi-xanthil 当前实现对这些编号的集合和语义并不完全一致。直接继承会迫使 Agent 猜测，也会把外部实现误当作依赖。

Xanthil 第一期改用两个明确分层：

- **产品生命周期 `A1–A5`**：向用户解释分析从问题到锁定报告的进展；
- **Run 执行状态**：沿用当前 JuanerAI `local-analysis` 的 `in_progress`、`succeeded`、`failed`、`cancelled` 兼容语义。

`A1–A5` 是产品阶段，不要求一对一实现为持久化枚举。人工 Gate 决定也不是 Run 状态。OpenSpec 可以在不改变下述行为的前提下选择最简单的状态表达。

## 3. `A1–A5` 产品生命周期

### A1 明确问题（Problem intake）

**进入条件**

- 用户选择假设先行分析；
- 提供一个本地单表 CSV 和一个业务问题；
- 当前 Personal Profile、Pi Adapter 和冻结模型选择通过既有 preflight。

**必须明确**

- 要回答的业务问题、分析对象、观察窗口和对比口径；
- 用户希望支持的 Decision，以及明确不执行的 Action；
- 已知约束、未知业务规则和不可自行补全项；
- 输入来源身份和用户声明的数据权限。

**产物**

- 问题说明；
- 初始数据合同候选；
- 未决项与非目标。

**退出条件**

- 问题可由获准的单表数据和白名单确定性能力验证；
- 缺少的业务口径仍显式为未决，不被模型补写。

无法形成可检验问题时停止，不进入数据准备。

### A2 准备数据（Prepare data）

**必须执行**

1. 对原文件只读生成 source fingerprint；
2. 读取 Schema、粒度、日期/数值解析候选、Null、非法值和精确重复统计；
3. 生成 Preparation Preview，列出拟执行变换、风险、输出位置和不会执行的业务修复；
4. 在 Gate 1 获得用户确认后，才由确定性本地工具执行；
5. 写出不覆盖原文件的 prepared dataset、变换摘要和安全 aggregate；
6. 对每个输出分别作 `analysis_ready`、`training_ready`、`llm_context_allowed` 用途判定。

首个 Change 的 `llm_context_allowed` 是闭合 fixture-only 规则：source 必须是产品验收包内获准的 `member-orders-v2` 或客服工单合成 fixture，source identity 与对应闭合 Schema 必须完全匹配，aggregate 必须由 Analysis Plan 中枚举的确定性计算产生并通过 Evidence 绑定。任意真实用户数据、其他 CSV、未知字段、未知 aggregate 形状或来源不一致均判定为禁止，不允许发送少量样本作为降级。

**产物**

- Data Contract Record；
- Preparation Preview；
- 用户确认后的 prepared dataset；
- aggregate 与 Data Admission / LLM Egress 记录。

**退出条件**

- 变换与用户确认一致；
- 原文件未覆盖；
- aggregate 通过来源、粒度、行数、敏感字段和用途准入检查；
- 未获准进入 LLM 的内容保持本地且未被抽样替代。

Gate 1 被拒绝或取消时，不执行准备计划，不进入 A3。

### A3 确认假设与分析计划（Confirm analysis plan）

**必须执行**

- 从用户问题、场景自带只读假设条目和获准 aggregate 形成有界假设集合；
- 每条假设声明可观察预期、Evidence 需求、反证条件、适用边界和确定性计算引用；
- 默认不作因果主张；相关性、结构贡献和因果解释必须区分；
- 计划声明预计进入 LLM 的 aggregate 摘要、确定性工具、输出 Artifact 和停止条件；
- 在 Gate 2 向用户展示完整计划。

**产物**

- Analysis Plan；
- Scenario Library Snapshot；
- 假设与策略条目引用；
- 预计数据 egress 声明。

**退出条件**

- 用户确认计划；
- 所有工具均为该场景获准的确定性能力；
- 所有假设都有 Evidence 需求和反证条件；
- 未知工具、未知字段、未知输出形状或越界数据请求均已阻断。

Gate 2 被拒绝或取消时，不创建分析 Run，不执行计算。

### A4 执行与核真（Execute and verify）

**必须执行**

1. 创建一个 `in_progress` Run，并绑定已确认的数据合同、计划、输入快照、Profile、Runtime 和模型 provenance；
2. 只调用计划中获准的确定性计算能力；
3. 为每个结果生成 Evidence Record，不把原始明细、prepared detail、Artifact 正文或未知形状输出自动注入 LLM；
4. 把每条假设判定为 `supported`、`rejected` 或 `inconclusive`；
5. 执行 Semantic Validity、Evidence Validity、Authority / Confidence 三层检查；
6. 生成 PASS / WARN / BLOCK 的合规结论和实际 LLM egress 记录。

**产物**

- Evidence Records；
- 假设判定与反证；
- 三层检查结果；
- 合规结论；
- Run Evidence 与实际 egress 声明。

**退出条件**

- 报告中的每个数字都能定位到 Evidence 和确定性计算；
- Evidence 与报告不一致、来源缺失或使用越权时为 BLOCK；
- 缺证时结论保持 `inconclusive`；
- 只有非 BLOCK 的完整结果才可进入 A5。

失败或取消时，Run 分别进入 `failed` 或 `cancelled`。已完成 Evidence 可以作为失败 Run 的诊断证据保留，但不得被包装为成功报告或锁定结论。

### A5 报告复审、锁定与建议转译（Review and lock）

**必须执行**

- 生成包含数据身份、准备摘要、确认计划、假设状态、Evidence、反证、限制、不确定性、双库引用和 egress 声明的报告候选；
- 从已核真的根因和场景自带只读策略条目形成非执行性 Action Recommendation；
- 策略条目只能按其显式声明的 hypothesis identity、允许 status、必要 Evidence identities、适用条件和限制进行匹配；只有 `supported` 且 Evidence Validity 非 BLOCK、全部必要 Evidence 与条件匹配时才生成对应 Recommendation；
- `rejected`、`inconclusive`、缺少映射或适用条件不满足时，明确输出“无获支持的策略建议”，不得由模型补配；描述性相关或结构贡献不得被改写成已证明根因，只能形成带限制的后续验证建议；
- 明确 Recommendation 不等于 Decision，更不等于 Action；
- 在 Gate 3 由用户确认、拒绝或取消报告与建议；
- 确认后锁定不可变报告、Artifact 清单和 Run Evidence，Run 才进入 `succeeded`。

**退出条件**

- 报告、Evidence、输入/输出 identity、确认记录和 provenance 一致；
- Action Recommendation 有适用条件、限制和来源；
- 没有真实业务 Action 被执行；
- 被拒绝或取消的报告不形成锁定结论，Run 不得标记为 `succeeded`。

第一期到此结束。部署、真实业务执行、Outcome 回流、效果归因和自动迭代不属于本生命周期。

## 4. 三个人工 Gate

| Gate | 用户看到的最小输入 | 合法决定 | Confirmed 的效果 | Rejected / Cancelled 的效果 |
|---|---|---|---|---|
| Gate 1：数据合同与准备计划 | source identity、Schema/粒度、拟执行变换、风险、输出位置、用途准入候选 | `confirmed` / `rejected` / `cancelled` | 执行获准的数据准备 | 不执行变换，不生成可供分析的 prepared output |
| Gate 2：假设与分析计划 | 假设、Evidence 需求、反证条件、确定性工具、预计 egress、停止条件 | `confirmed` / `rejected` / `cancelled` | 创建并执行分析 Run | 不创建分析 Run，不调用计算工具 |
| Gate 3：报告与 Action Recommendation | 假设状态、Evidence、反证、限制、合规检查、实际 egress、建议及非执行声明 | `confirmed` / `rejected` / `cancelled` | 锁定结果并将 Run 标记为成功 | 不锁定结论，不得标记成功 |

Gate 决定必须绑定候选内容 identity、决定人、时间和对应 Run/会话。确认不能复用于内容已改变的新候选；内容改变后必须重新确认。

## 5. 最小产品记录

以下名称是产品语义，不预先批准代码类型或文件格式。

### 5.1 Data Contract Record

至少记录：source identity/fingerprint、文件类型、单表 Schema、业务粒度、时间字段与窗口、字段解析、获准变换、未知业务规则、权限声明、确认 identity。

### 5.2 Preparation Preview

至少记录：Null/非法值/精确重复统计、拟执行和明确不执行的变换、预期输出、风险、原文件不覆盖声明、确定性工具 identity。

### 5.3 Data Admission / LLM Egress Record

至少记录：Artifact identity、数据处理状态、用途准入逐项决定、粒度/行数/敏感字段检查、允许进入 LLM 的确切 aggregate 摘要、实际 egress、拒绝理由。

`llm_context_allowed` 缺失、未知或失败时必须视为禁止，不得退化为“只发少量行”或“只发样本”。

首个 Change 允许进入 LLM 的闭合集合只有：

- 会员合成用例：整体及按 `member_segment`、`channel`、`product_category` 分组的计数、基准期/近期复购指标和结构贡献；
- 工单合成用例：整体及按 `channel`、`priority`、`issue_type` 分组的计数、处理时长窗口比较和结构贡献。

实际 payload 必须只包含上述枚举字段、对应 Evidence identity、单位和必要窗口标签，并在 Gate 2 展示其 identity/hash。`order_id`、`member_id`、`ticket_id`、原始行、prepared detail、自由文本、逐行时间戳、Artifact 正文及未枚举字段始终禁止。因为首个 Change 只处理产品提供的合成 fixture，不把该规则推广为真实数据的隐私阈值；真实数据 egress 必须由后续独立数据合同重新冻结。

### 5.4 Analysis Plan

至少记录：业务问题、边界、Hypothesis Plan Items、Evidence 需求、反证、确定性计算引用、场景条目快照、预计 egress、停止条件、Gate 2 identity。

每个 Hypothesis Plan Item 至少具备稳定 identity、表述、可观察预期、Evidence 需求、反证条件、范围、计算引用和初始状态。

每个只读 Strategy Item 至少具备稳定 identity、可关联的 hypothesis identities、允许的 hypothesis status（首个 Change 只能是 `supported`）、必要 Evidence identities、适用条件、限制和非执行声明。没有满足完整映射时，报告只能写“无获支持的策略建议”。

### 5.5 Evidence Record

至少记录：输入 aggregate identity、确定性计算 identity/version、参数、输出值与单位、来源 Artifact 位置、可重放 hash、支持或反证的 hypothesis identity、限制。

报告中没有对应 Evidence 的数字不得补写、估算或用模型常识替代。

### 5.6 Report Lock / Run Evidence

至少绑定：报告 identity/hash、全部 Artifact identities、输入/输出 identities、计划和三个 Gate identities、实际 egress、Profile、Runtime/Adapter/model provenance、终态和错误/取消摘要。

## 6. 数据与 LLM 准入矩阵

| 数据状态 | 本地确定性分析 | 本地 Model Pack 推理 | 进入 LLM Context |
|---|---|---|---|
| `raw` | 只读输入；不得被 Agent 或 LLM 直接操作 | 未经具体 Consumer 数据合同批准不得使用 | 禁止 |
| `prepared_detail` | 仅在确认的数据合同内允许 | 由后续 Model Pack Consumer Change 按具体模型输入合同决定；允许本地推理不等于允许进入 LLM | 默认禁止 |
| `aggregate` | 允许使用获准的确定性结果 | 由具体模型输入合同决定 | 仅在 `llm_context_allowed` 明确通过后允许 |

`analysis_ready`、`training_ready` 和 `llm_context_allowed` 是三个独立决定。任意一个通过不推导另外两个通过。

## 7. 三层裁判

### Semantic Validity

- 问题、字段、粒度、窗口和业务口径一致；
- 未知业务规则保持未知；
- 没有把相关性、结构贡献或模型预测写成已证明因果。

### Evidence Validity

- 数字与 Evidence Record、Artifact 和计算 identity 一致；
- 支撑证据、反证和限制同时可见；
- 缺失来源、无法重放或报告值不一致时为 BLOCK；
- 缺证时使用 `inconclusive`，不生成伪确定性。

### Authority / Confidence

- 结论用途不超出用户声明的 Decision；
- LLM egress、数据权限和三个人工 Gate 满足；
- Action Recommendation 保持非执行；
- 置信表达与 Evidence 强度相称。

三层检查是横切验证，不是三个新 Agent，也不要求另建裁判平台。

## 8. 失败、取消、重试与兼容

- `failed`、`cancelled` 与 `succeeded` 必须可区分，未知终态 fail closed；
- deadline、用户取消、工具失败、Schema 不兼容、Evidence 不一致和数据越界不得转成成功；
- 首个 Change 不承诺后台恢复、断点续跑或自动重试；用户重新提交时创建新 Run，不覆盖旧 Run Evidence；
- 是否在 CLI 展示失败 Run 的部分 Evidence、以及新旧 Run 的精确关联结构，由 OpenSpec 冻结；但部分结果不得伪装为完整报告；
- 演进现有 `local-analysis`，不建设旁路第二套业务核心；当前规范的 preflight、明确确认、单 Run、不可变 Artifact、失败/取消/deadline、数据 egress、provenance、错误和离线回归行为必须继续受兼容测试保护；
- 新的 Action Recommendation 是获批后的行为增量，不得倒推当前 `local-analysis` 已经具备该能力。

## 9. 双库第一 Change 语义

第一 Change 只读取两个验收场景携带的少量假设与策略条目。每次运行保存条目 identity、版本或内容 hash 和实际引用关系。

不得创建 Candidate、Tail、Core、晋升、持久写入、静默修改或通用库平台。用户在 Gate 3 确认报告，不等于批准把新发现写入双库。

## 10. Model Pack Consumer 追加验收

本节属于 Xanthil 第一期完整产品终点，但不属于首个假设先行分析 Change。

后续 MacBook-owned Consumer Change 必须：

1. 安装并校验 Model Pack 一期发布的真实 SDK；
2. 通过场景化 `AnalyticalModelRuntime` 业务 Port 在本地执行，不连接 MLflow、训练工作区或任何外部项目仓库；
3. 记录 Pack identity/version/checksum、固定模型版本、输入快照、Runtime/Adapter、输出和 provenance；
4. 在合同、checksum、版本、输入或 Runtime 不兼容时 fail closed；
5. 使用用户届时提供的真实用例数据完成实际产品测试。

首个假设先行 Change 的两份合成 CSV，以及 Model Pack 供给侧的示例、合成数据或 fixture，都不能替代第 5 项。真实数据只在对应 Change 明确数据合同、权限、敏感字段处理和本地边界后使用；本附件不授权提前索取或访问。

## 11. 延后能力的停止线

深度研究、自主探索、会话 Fork、持久记忆、Subagent、通用 Skill 管理和双库生命周期平台只有产品概念方向，尚不是可实施合同。

任何一个能力启动独立 Change 前，都必须先形成 JuanerAI 自有、可审核的产品说明或附件，冻结用户场景、数据/网络边界、生命周期、失败/取消、Evidence 和验收。Agent 不得仅凭主方案中的概念段落开始实现，也不得自行回看 pi-xanthil 并复制其 HTTP、SQLite、Desktop、Pi session、工具、路径或状态机。需要新的外部只读学习时，必须由用户明确指示。

## 12. 明确不继承

- pi-xanthil 的 Express/HTTP API、SQLite migrations、Desktop React 控制面和 workspace/project identity；
- Discovery `S10–S15`、历史 `S1–S3` 编号及其持久化状态；
- 外部仓库的工具 registry、绝对路径、运行目录、`summary.json` 或清洗目录约定；
- Pi session、`.mcp.json`、`.pi/skills`、Subagent DAG、Memory UI 和 Skill Lab；
- pi-xanthil 的测试、fixture、模型、部署状态、版本或 SHA 作为 JuanerAI 验收证据；
- 任何外部仓库分支、PR、写入、Runtime/build dependency、release Gate 或跨仓联动。

只保留这些抽象原则：计划有界、未知 fail closed、确定性计算、行级数据隔离、Evidence 可重放、人工 Gate、来源可追溯、无静默写库。

## 13. 研究来源与审计

本附件的外部研究审计底稿为 [`pi-xanthil-read-only-research.md`](pi-xanthil-read-only-research.md)。它记录了本次只读学习的源文件、行号、可转译知识和不继承项。底稿只用于解释附件如何形成，不是未来实现的必读依赖。

只读研究使用 pi-xanthil `c38a3cd1e0e19509c93a61ab01424b005b29a8bb` 的以下一手材料：

- `AGENTS.md`；
- `server/src/analysis-projects/contracts/discovery.ts`；
- `server/src/analysis-projects/application/discovery/discovery-scan-service.ts`；
- `server/src/analysis-projects/application/discovery/discovery-review-service.ts`；
- `server/src/analysis-projects/adapters/discovery-compute-port.ts`；
- `server/src/ai-tool-row-guard.ts` 与 `server/src/tool-policy.ts`；
- `server/src/subagent-core.ts`、`server/src/skills.ts`、`server/src/memory-injection.ts`。

这些来源已被转译并封闭在本文。JuanerAI 当前实现和规范仍由 JuanerAI 仓库本身负责，pi-xanthil 不参与交付。
