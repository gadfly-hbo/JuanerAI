# Xanthil 第一期产品方案

> 状态：产品规划已由用户于 2026-08-23 冻结并通过 Development-Readiness Gate；纯文档 governance PR 待合入
> 日期：2026-08-23
> 目标仓库：/Users/huangbo/JuanerAI
> JuanerAI 基线：main = origin/main = 60e13514ffec01c09dc407e4271492458e9f4105
> pi-xanthil 只读学习来源基线：refactor/main = c38a3cd1e0e19509c93a61ab01424b005b29a8bb
> 权威边界：本文吸收用户明确产品输入并冻结首期边界；不创建 OpenSpec Change，不批准实现、依赖、Schema、产品分支或真实模型调用。用户只单独授权本冻结包的纯文档治理分支与 PR。
> 流程附件：设计或实施首个假设先行分析 Change 前，必须读取 [`attachments/xanthil-first-phase-analysis-lifecycle.md`](attachments/xanthil-first-phase-analysis-lifecycle.md)。附件已经把 pi-xanthil 的可复用知识转译为 JuanerAI 自有阶段、Gate、Evidence、数据准入和失败边界，未来 Agent 不需要重新打开 pi-xanthil。
> 场景附件：首个 Change 的两份合成输入、业务口径、确定性 oracle、Hypothesis/Strategy 映射与正负验收以 [`attachments/xanthil-first-change-scenario-contracts.md`](attachments/xanthil-first-change-scenario-contracts.md) 为准。

## 1. 状态标记

- Confirmed：用户已经明确确认的产品方向或治理决定。
- Proposed：根据确认方向形成的产品化建议，仍需用户审核。
- Deferred：只用于兼容未来演进，不属于首期实现授权。
- Existing：JuanerAI 或 pi-xanthil 当前已经存在且经只读调查确认的能力。

文档中的参考方案、Prompt、命令和实施步骤只作为研究材料，不自动取得产品或工程权威。

## 2. 产品定义

### 2.1 定位 — Confirmed

Xanthil CLI 是快速、简洁、Local-first 的通用数据分析师 AI 助手。目标用户喜欢终端操作，具备一定技术背景，习惯使用 opencode、pi-agent、Codex CLI、SQL 或 Python。

“通用”表示产品能力和 Application 流程不以会员、复购、零售或其他单一业务场景为身份；具体业务场景通过获准的数据合同、分析计划、假设、证据需求和确定性执行能力承载。它不表示第一期支持任意 Schema、任意分析问题或无界自动分析平台。

它不是：

- 通用编码 Agent；
- pi-agent 的品牌套壳；
- pi-xanthil Desktop 的缩小复制品；
- 会员分析、零售分析或其他垂直场景的专用工具；
- 大而全的数据治理平台；
- 自动执行真实业务动作的运营系统。

Pi 是首个 Agent Runtime Adapter，不是 Product Core、Application、公开合同或 Model Pack 的类型权威。

### 2.2 用户价值 — Confirmed

Xanthil CLI 帮助数据分析师在一个终端产品里完成：

1. 把本地数据整理到可分析状态；
2. 使用合适的分析方法获得可核真的结论；
3. 通过 Model Pack 使用固化的业务算法模型；
4. 将一次分析沉淀为可复用的假设、策略、证据和方法资产；
5. 保持数据、计算、模型、结论和建议的来源可追溯。

### 2.3 产品边界

    Xanthil CLI
    ├── 数据清洗
    ├── 数据分析
    │   ├── 假设先行
    │   ├── 深度研究
    │   └── 自主探索
    └── 数据建模

    横切支撑
    ├── 假设库与策略库
    ├── Skill / Command
    ├── 分析会话记忆
    ├── 会话 Fork
    ├── 受限 Subagent
    ├── Evidence / Provenance
    └── Run Evidence

“数据清洗、数据分析、数据建模”是产品模式；“假设先行、深度研究、自主探索”是数据分析内部的方法；Agent、Runtime、Skill 和 Command 是实现或调用机制。三者不得混为同一层产品术语。

## 3. 终端体验

### 3.1 交互原则 — Confirmed

- 快速进入，不要求先配置复杂项目；
- 主界面简洁，借鉴 opencode 的克制 TUI；
- 用户始终能看到当前产品模式、运行状态、重要 Gate 和输出位置；
- 命令面板用于发现能力，避免堆叠菜单；
- 复杂控制状态按需展开，不把内部状态机全部暴露给用户。

### 3.2 主界面方向 — Confirmed

主界面保留：

- 当前模式及可用状态：数据清洗 / 数据分析 / 数据建模；
- 当前 Agent Runtime 或模型的简要标识；
- 单一主要输入区；
- 当前任务的阶段、Gate 或阻塞原因；
- Command Palette、模式切换、会话和 Evidence 的快捷入口。

opencode 的 Agent selector 可以作为交互参考，但用户选择的是产品模式或分析方法。不同 Agent/Profile 如何承载这些模式属于组合根决策。产品方案不预选 TUI 框架。

### 3.3 第一 Change 体验边界 — Confirmed

第一 Change 只激活假设先行分析，并在闭环中包含最小数据准备；不宣称独立的数据清洗模式已经完整交付。终端只实现当前阶段、数据源、业务问题、计划预览、确认/拒绝、执行状态、Evidence 状态和结果位置。

数据建模、深度研究和自主探索可以在帮助信息中明确显示“未启用”，但不得提供看起来可执行的占位命令。第一 Change 不建设完整全屏 TUI、通用工作流画布、复杂多 Agent DAG、Skill 实验场、统一管理控制台或 Desktop 交互。Anax 与通用工作流搭建暂不吸收。

## 4. 数据清洗模式

### 4.1 首期目标 — Confirmed

第一期以简单、跑通为主。复杂 Data Foundation 方案只作为未来方向。

建议证明一条最短产品闭环：

    导入本地数据
      → 快速体检
      → 展示少量清洗建议
      → 用户确认
      → 确定性工具执行
      → 输出新数据集与变更摘要
      → 生成安全聚合
      → 进入数据分析

### 4.2 不可省略的底线 — Confirmed

- 原始文件只读，绝不覆盖；
- LLM 可以提出或解释 Cleaning Plan，但不直接修改 DataFrame；
- 清洗由确定性本地工具执行；
- 原始明细和清洗后明细都不默认进入 LLM；
- 高风险修改需要用户确认；
- 输出保留输入身份、变换摘要、输出位置和运行身份；
- 失败或未知业务规则不得被模型自行补全。

### 4.3 数据状态与用途准入 — Confirmed

数据处理状态与数据用途必须分开表达：

    处理状态：
    raw → prepared_detail → aggregate

    用途准入：
    analysis_ready
    training_ready
    llm_context_allowed

清洗后明细可以供本地确定性分析或模型训练使用，但仍可能包含敏感行级数据。只有经过粒度、行数、敏感字段和来源检查的聚合结果，才可能进入 LLM Context。

“cleaned”“analysis-ready”“training-ready”“LLM-safe”不得互为同义词。

### 4.4 第一 Change 白名单能力 — Confirmed

- 每个 Run 只接收一个本地单表 CSV；
- 列名和字符串首尾空白规范化；
- 按用户确认的数据合同解析日期与数值；
- 标记 Null、非法值和精确重复；
- 仅在用户确认后排除精确重复记录；
- Preview、确认、确定性执行；
- 输出不覆盖原文件的新数据集、变更摘要和来源指纹；
- 生成通过用途准入检查的聚合结果。

自动业务填补、模糊去重、异常值裁剪、类别语义合并和未知业务规则修复均不在白名单内。

### 4.5 明确延后 — Deferred

- YData 深度画像；
- 完整 Pandera 三级合同；
- 统一 Data Quality Score；
- 完整 Quarantine 平台；
- SQLite 元数据平台；
- Cleaning Recipe Library；
- 多数据库与 API 连接器；
- 通用 Data Foundation SDK；
- 企业 RBAC、审计、数据目录和 Observability。

长期可沉淀资产包括 Data Contract Library、Cleaning Recipe Library、Business Rule Library、Dataset Semantic Metadata 和 Quality Evaluation Rules，但一期不提前建设资产平台。

## 5. 数据分析模式与三种方法

### 5.1 共同治理层 — Confirmed

三种方法共享：

- 数据准入与原始数据隔离；
- 事实、推断和建议的区分；
- 数字与来源追踪；
- 人工裁决；
- 假设库、策略库的受控读取与写入；
- 报告、Evidence 和 Action Recommendation 边界。

三种方法不共享一条万能执行工作流。它们可以复用治理能力，但必须拥有各自的产品行为、顺序、失败和取消语义。

### 5.2 假设先行 — Confirmed

假设先行是数据分析模式中的默认半自动主流程：

1. 明确业务问题与约束；
2. 从用户输入、假设库和方法资产形成假设树；
3. 为每个假设定义证据需求和证伪条件；
4. 使用本地数据、内部文档和业务规则收集证据；
5. 对假设给出 Supported、Rejected 或 Inconclusive；
6. 输出根因优先级、边界和不确定性；
7. 从策略库匹配 Action Recommendation。

关键结论必须包含“假设—证据—证伪”。缺证时不得输出伪确定性。

### 5.3 首期分析生命周期、合规检查与三层裁判 — Confirmed

历史参考材料中的 `S1.1–S3.6`、`S2.4.5` 和“十五状态”只保留为只读研究来源，不是 JuanerAI 的状态枚举、路径、依赖或实施合同。不同历史材料与 pi-xanthil 当前实现对这些编号并不完全一致，未来 Agent 不得自行补齐或复制。

首个 Change 使用 JuanerAI 自有的五阶段产品生命周期：

    A1 明确问题
      → A2 准备数据
      → A3 确认假设与分析计划
      → A4 执行与核真
      → A5 报告复审、锁定与建议转译

`A1–A5` 是产品阶段，不要求一对一持久化为枚举。Run 执行状态继续沿用当前 `local-analysis` 的 `in_progress`、`succeeded`、`failed`、`cancelled` 兼容语义；人工 Gate 决定与 Run 状态分开。

内部保留三层裁判：

1. Semantic Validity：问题、口径和数据语义是否合法；
2. Evidence Validity：计算、证据、反证和因果表述是否可信；
3. Authority / Confidence：结论的使用是否越权，人工确认是否满足。

第一 Change 覆盖 `A1–A5` 的需求、Schema、约束、上下文、数据探查、分析执行、Evidence 审核、合规检查、人工复审、结论锁定和结论转译。用户需要确认三个 Gate：数据合同与准备计划、假设与分析计划、报告与 Action Recommendation。每个阶段的进入/退出条件、最小记录、拒绝/取消、数据 egress 和失败语义以 [`Xanthil 第一期分析生命周期与边界`](attachments/xanthil-first-phase-analysis-lifecycle.md) 为准。

部署、业务执行、数据回流、效果评估和迭代触发全部延后。当前产品止于可追溯的 Action Recommendation。

### 5.4 深度研究 — Confirmed

深度研究通过 Skill 或 Slash Command 调用，面向已有问题框架但内部数据无法独立解释的开放世界问题。

它要求：

- 研究计划和证据清单；
- 外部来源及引用；
- 可信度与相关性筛选；
- 事实、推断和观点分离；
- 反证、替代解释和不确定性；
- 最终关键结论仍接受“假设—证据—证伪”。

允许联网是产品能力方向，不等于每次运行自动取得网络、数据或第三方模型授权。

### 5.5 自主探索 — Confirmed

自主探索通过 Skill 或 Slash Command 调用，目标是发现未知问题、异常结构、新模式和候选机制。

真正的自主探索应遵循：

    Blind Explorer
      → Knowledge Matcher
      → Validator
      → Librarian

Blind Explorer 尽量不预读假设库，避免锚定偏差；发现后再匹配 CORE/TAIL。生成与评估隔离，搜索过程采用 Search → Score → Prune → Drill Down，而不是无界笛卡尔积。

发现阶段不强制先有假设，也不强制完整证伪；进入正式结论、双库或报告前仍需要来源、下钻证据、数字核真和人工审核。

现有先加载 CORE 再排查的 S0–S15 更接近带先验的自动化分析，不能直接改名为纯自主探索。

## 6. 双库与双循环

### 6.1 假设库 — Confirmed

假设库是业务因果先验库，不是字段百科或普通 RAG 文档集合。

它服务三种分析方法：

- 假设先行：提供根因候选、证据需求和验证路径；
- 深度研究：提供研究方向，承接稳定外部规律；
- 自主探索：在盲探索完成后匹配已有假设，并承接新候选。

长期条目至少需要业务域、触发条件、支撑指标、诊断解释、反证条件、验证路径、来源、置信度、验证记录和关联策略。

建议生命周期：

    Candidate → Tail → Validated → Core → Deprecated

### 6.2 策略库 — Confirmed

策略库是行动知识库和 SOP 决策库，不是通用话术集合。

    Cause × Context → Strategy

同一根因在不同对象、资源、成本和风险边界下可以对应不同策略。长期条目包括前置条件、目标对象、动作清单、资源、风险、指标、观察窗口、成功判定和历史效果。

建议生命周期：

    Candidate → Trial → Proven → Core SOP → Deprecated

### 6.3 双循环 — Confirmed

    知识循环：
    数据 → 发现 → 候选假设 → 验证 → 假设库升级

    行动循环：
    根因 → 策略建议 → 执行 → 业务反馈 → 策略库升级

首期 CLI 可以覆盖知识循环和行动循环中的“策略建议”。真实执行、Outcome 回流与效果归因需要独立授权、幂等、审计和恢复合同。

### 6.4 写入治理 — Confirmed

- Agent 不静默修改 CORE；
- 新发现默认进入待审核区；
- 用户或分析师确认后才能正式写入；
- 所有条目保留来源、版本、作者和验证记录；
- 记忆不是权威业务事实；
- 双库可以消费 Ontology、Knowledge 和 Memory，但不物理合并这些数据权威。

### 6.5 第一 Change 行为 — Confirmed

两个验收用例各自携带少量只读假设与策略条目，条目属于场景资产而不是 Product Core/Application 代码。报告必须记录引用条目。第一 Change 不支持 Candidate 写入、晋升、持久化或静默修改 CORE。

## 7. 数据建模模式与 Model Pack

### 7.1 产品关系 — Confirmed

数据建模模式在 Xanthil 第一期内消费经过校验的固化 Model Pack SDK，例如会员流失或销量预测。Model Pack 一期只有在 SDK 可交付给 Xanthil、并由 Xanthil 完成本地安装、校验和实际推理后，才形成完整产品价值。Xanthil 不直接依赖 MLflow、模型训练工作区、外部项目仓库或其他供应侧基础设施。

    Model Pack 一期供给侧
      → 发布可安装 Model Pack SDK
      → Xanthil CLI 安装与校验
      → Xanthil 数据建模 Application
      → AnalyticalModelRuntime 本地实现
      → 输出业务结果、Pack/模型版本和来源

### 7.2 第一期终点与 Change 切分 — Confirmed

必须区分“首个假设先行分析 Change”和“Xanthil 第一期完整产品终点”：

- 首个假设先行分析 Change 仍不消费 Model Pack，数据建模在该 Change 中如实显示未启用；
- Model Pack Provider 由 Mac mini 在 JuanerAI 仓库内生产可安装 SDK，并先通过独立 Consumer 供给侧验证；
- Xanthil Model Pack Consumer 由 MacBook 在后续但仍属于第一期的 Change 中安装真实 SDK，通过 `AnalyticalModelRuntime` 业务 Port 完成本地推理并激活数据建模体验；
- 独立 Consumer PASS 只是 SDK 供给侧验收，不能替代 Xanthil 实际消费和产品验收；
- Xanthil Consumer 的一期验收必须使用用户届时提供的真实用例数据完成实际测试；合成数据、示例数据和 fixture 不能替代该验收；
- 共享 Model Pack 包合同、Runtime 合同和契约测试由 MacBook Integration Controller 先冻结，Provider、Consumer 和最终 activation 的具体 Change 拓扑由 `first-parallel-changes` 决定。

首组 planning Change 拓扑已经收敛为：`CHG-model-pack-contract-enabler`（E）先合入；随后 MacBook 的 `CHG-xanthil-hypothesis-first-analysis`（H）与 Mac mini 的 `CHG-model-pack-local-provider`（P）跨设备并行；H 合入后 MacBook 才启动 `CHG-xanthil-model-pack-consumer`（C），C 可先用冻结 double 开发但最终 GREEN/合入等待 P 的真实 MP9 SDK；`CHG-xanthil-model-pack-activation`（A）在 E/H/P/C 全部合入、真实数据和实际推理授权到位后最后执行。H 的产品行为不依赖 E/P/C，但为避免 MacBook/root 热区并写，实际启动基线排在 E 之后。

首组 PR 严格串行合入顺序是 E → H → P → C → A。H/P 的并行只发生在开发阶段；P 即使先完成，也在 H squash 后重基线再合入。

第一期不提前创建 Capability Marketplace、Runtime registry、自动 fallback、热切换或宽泛的通用 Runtime 平台。

## 8. 轻量支撑能力

### 8.1 Skill / Command — Confirmed

首期只需要发现、查看、选择和运行受信任 Skill/Command 的最小能力。深度研究和自主探索优先以策划好的 Skill 或 Slash Command 提供，不建设完整 Skill 生命周期、自动蒸馏和实验平台。

### 8.2 会话 Fork — Confirmed concept

Fork 指分析会话分叉，不是 Git 分支。它用于探索替代假设或并行思路，结果经用户选择后回流主分析。

### 8.3 记忆 — Confirmed concept

首期记忆只支持当前分析需要的最小用户、项目或会话上下文。原始数据、敏感行和未经确认的业务事实不能进入统一记忆。

### 8.4 Subagent — Confirmed concept

首期只提供少量策划好的分析角色，并限制数据文件、工具、网络和输出位置。不建设通用多 Agent DAG 或可视化工作流平台。

### 8.5 第一 Change 边界 — Confirmed

第一 Change 不实现深度研究、自主探索、会话 Fork、持久记忆、Subagent 或通用 Skill 管理。这些能力保留在 Xanthil CLI 产品方案中，由后续各自的真实用户场景驱动。

## 9. pi-xanthil 只读学习的已转译结论

### 9.1 已封闭到 JuanerAI 附件的知识

本轮只读学习已经把首个假设先行闭环需要的知识封闭到 [`Xanthil 第一期分析生命周期与边界`](attachments/xanthil-first-phase-analysis-lifecycle.md)：

- 有界计划、明确状态、未知 fail closed；
- 原始数据隔离、确定性准备与计算、行级输出阻断；
- 假设、Evidence、反证、限制和报告数字来源的最小关系；
- 三个人工 Gate、PASS/WARN/BLOCK 合规检查、失败和取消；
- 双库首期只读引用、无静默写入；
- 现有 JuanerAI `local-analysis` 兼容边界；
- 后续 Model Pack Consumer 使用用户真实用例数据的验收衔接。

未来 Agent 直接读取主方案、该附件和 JuanerAI 当前规范，不需要重新研究 pi-xanthil。外部仓库只在用户再次明确要求时用于只读学习，不能形成路径、依赖、运行机制、发布 Gate 或跨仓联动。

深度研究、自主探索、会话 Fork、持久记忆、Subagent 和通用 Skill 管理仍只是延后方向。启动其中任何独立 Change 前，必须先形成对应的 JuanerAI 自有产品说明或附件；不得凭本方案中的概念段落直接实现，也不得自行从 pi-xanthil 复制 HTTP、SQLite、Desktop、Pi session、工具、路径或状态机。

### 9.2 不采用

- “专业”模块；
- Anax 和通用工作流搭建；
- 多 Agent DAG Builder；
- Skill Lab、自动蒸馏和完整评测平台；
- Desktop React 控制面；
- 旧 Pi SDK 类型进入 Product Core 或公开合同；
- 任何隐藏 fallback、真实数据越界或未明确来源的默认业务规则。

## 10. 首期产品边界

### 10.1 Confirmed

- 首个产品面仍是 Xanthil CLI；
- 快速、简洁、终端优先；
- Xanthil 是通用数据分析产品，会员场景只作为验收用例，不定义产品身份；
- 第一组 MacBook Change 建设包含最小数据准备、业务场景可迁移但能力边界受限的单表假设先行分析闭环；
- 会员复购下降作为首个完整端到端验收用例；“客服工单处理时长异常诊断”作为一个异领域最小可迁移性验收用例，证明不存在业务场景硬编码；
- 数据清洗第一期简单跑通；
- 假设先行是数据分析主流程；
- 深度研究和自主探索使用 Skill/Command；
- 原始明细不进入 LLM；
- 双库是分析资产核心；
- Model Pack 一期由 Mac mini 供给侧生成可安装 SDK，并在同一期由 MacBook 完成 Xanthil 本地消费与数据建模激活；
- CLI 完成后再推进 Desktop。

### 10.2 第一 Change Confirmed

- 两个验收用例均使用小型、可合成、可复现的单表 CSV；异领域用例只证明同一 Application 流程、数据准入、人工 Gate、Evidence、Artifact 和 Run Evidence 合同可迁移，不扩展为第二套完整产品体验；
- 首个 Change 的 LLM egress 只对这两个由产品验收包提供、且 source identity 与闭合 Schema 均通过验证的合成 fixture 开放；任意用户真实数据、其他 CSV、未知字段或未知 aggregate 形状均不得进入 LLM，并在没有后续获批数据合同前 fail closed；
- 允许进入 LLM 的内容只包含 Analysis Plan 预先枚举、由获准确定性计算生成并绑定 Evidence identity 的聚合摘要：会员用例的整体及 `member_segment`、`channel`、`product_category` 分组计数、基准期/近期复购指标和结构贡献；工单用例的整体及 `channel`、`priority`、`issue_type` 分组计数、处理时长窗口比较和结构贡献。`order_id`、`member_id`、`ticket_id`、原始行、prepared detail、自由文本、逐行时间戳、Artifact 正文及未枚举字段一律禁止；Gate 2 必须展示并确认实际待发送 payload identity/hash；
- 首个闭环同时覆盖最小数据准备与假设先行，而不是先建设空 TUI；
- 用户可见进度采用附件定义的 `A1–A5` 五个阶段；阶段不是空枚举，具体进入/退出、Gate、Evidence、失败和取消语义必须一起实现；
- 双库只使用场景自带的内置只读条目；
- 每条只读策略条目必须显式声明可关联的 hypothesis identity、允许的 hypothesis status、必要 Evidence identities、适用条件和限制；首个 Change 只有 `supported` 且 Evidence Validity 非 BLOCK、全部必要 Evidence 与适用条件准确匹配时才可产生对应的非执行性 Action Recommendation。`rejected`、`inconclusive`、缺少映射或条件不满足时输出“无获支持的策略建议”，不得由模型补配；描述性相关或结构贡献不得改写成已证明根因，只能形成带限制的后续验证建议；
- 深度研究、自主探索和数据建模在首个假设先行分析 Change 中只显示真实的未启用状态；该状态不是 Xanthil 第一期最终交付边界；
- 演进现有 `local-analysis`，不建设旁路第二套业务核心；现有 v1 行为、Artifact、Run Evidence、错误和测试继续作为兼容回归；
- 实施前读取当前 `openspec/specs/local-analysis/spec.md`、`docs/governance/xanthil-first-slice-reuse-baseline.md` 和分析生命周期附件；现有 JuanerAI 规范是兼容权威，pi-xanthil 不是；
- 实施前还必须读取场景附件；OpenSpec 可以冻结精确文件编码、hash、Schema 和测试资产，但不得重新发明窗口、指标、分群贡献、Hypothesis/Strategy 或 oracle；
- 新的共享 Product Core/Application 名称与合同不得包含会员、复购或零售场景词，场景字段、指标、假设与确定性执行能力留在场景边界；
- 继续复用现有 Pi Adapter、Personal Profile 和已冻结模型选择，不增加 Runtime 或重选模型；
- 离线确定性证据是必需验收，真实 Provider 调用需要另行授权。

### 10.3 Deferred

- 完整 Data Foundation；
- 真实外部研究与网络抓取；
- 纯自主 Blind Discovery 的大规模扫描；
- 双库完整生命周期平台；
- Desktop 与 Enterprise；
- 行动执行和 Outcome 学习；
- 通用工作流、Runtime registry、fallback 和热切换；
- Model Pack Marketplace、企业 Harness 和自进化模型 Loop。

## 11. 成功定义 — Confirmed

Xanthil CLI 的下一产品阶段不应以目录、UI Shell 或安装依赖为完成标准。首个新产品切片应让一名分析师：

1. 导入一个获准的本地数据输入；
2. 看懂体检结果和拟执行变换；
3. 确认后获得不覆盖原文件的新数据；
4. 确认假设与分析计划；
5. 由确定性工具执行计算；
6. 得到带数据版本、计算、Evidence、反证、不确定性和策略建议的报告；
7. 明确知道哪些数据进入了 LLM、哪些没有。

同一 Change 还必须使用“客服工单处理时长异常诊断”证明：会员、复购、零售字段、指标和假设不在 Product Core 或 Application 中硬编码；更换获准的数据合同、分析计划和确定性执行能力后，上述闭环与治理证据仍成立。该用例使用合成单表 CSV，至少包含 `ticket_id`、`opened_at`、`resolved_at`、`channel`、`priority` 和 `issue_type`，验证处理时长的窗口比较、分群证据、假设状态与限制。它只需通过同一 Application 的最小集成/合同验收，不建设第二套完整 TUI，也不授权通用分析 DSL、工具注册表、任意 Schema 自动分析或 Universal Runtime。

会员主用例使用新的合成 `member-orders-v2` 单表 CSV，字段冻结为 `order_id`、`member_id`、`ordered_at`、`member_segment`、`channel`、`product_category`、`order_amount` 和 `discount_amount`。精确问题是：近期会员复购率是否相较基准期下降；哪些可观察会员分群、渠道或品类结构贡献了变化；现有证据支持、否定或无法判定哪些解释假设；下一步应验证什么，并可提出哪些未执行策略建议。

报告至少包含数据身份与准备摘要、确认后的分析计划、假设状态、Evidence、反证、限制、非执行性 Action Recommendation、双库条目来源、LLM egress 声明和 Artifact/Run Evidence 定位。

首期不在产品方案中虚构通用数据量 SLA。精确 fixture 行数、资源上限、命令、Artifact Schema 和验收阈值由后续 OpenSpec Change 在可重复 feasibility probe 后冻结；超出批准边界时 fail closed。

Xanthil 第一期整体还必须在后续 Consumer Change 中证明：安装并校验一期发布的真实 Model Pack SDK；通过场景化 `AnalyticalModelRuntime` 本地执行；输出稳定业务结果及 Pack identity、模型版本、checksum、输入快照、Runtime 和 provenance；合同或兼容性不满足时 fail closed；使用用户届时提供的真实用例数据完成实际产品测试。没有这项真实 Xanthil 消费证据，或者只有合成数据、示例数据和 fixture，Model Pack 一期与 Xanthil 第一期都不能声明完整完成。

## 12. 来源与版本

| 来源 | SHA-256 / Git SHA | 用途 |
|---|---|---|
| 十五状态机_三层裁判_Guard_Conditions.md | a80dbe0da0d78790a78ebaacd5d232941c7553b87e2341d8eb7149674034718f | 假设先行、三层裁判与 Guard |
| analysisops-s1-s3-flow.html | e68244fc0ad792fa0b9da2e03ea820013d97a325c82b981f527dcc1479818937 | 旧分析状态、聚合计划与人工确认 |
| S0_S15_Autonomous_Analysis_Prompt.md | 27b22322a8c9fea4a3abcad57158159d39567c53a9969220409ddd32ef8a9fa7 | 自主探索、S14 和双库示例 |
| pi-xanthil_ai_data_analysis_methodology.md | 85c358d89b2d1430de2da15c0c0a723b53b0ae78636bc6b2785a7842fb8a9746 | 三方法、双库和双循环理论 |
| Xanthil_个人本地版_Data_Foundation_落地方案.md | 087c30c0fe368e070ac75e815304967143862a35ed86b1dbeb2832a2190065cc | Data Foundation 远期方向 |
| opencode 终端截图 | 0ac658c4304e0f1f0b40b10c32ef32d683f0a7366a33a0784c410e85f6ca2725 | TUI 视觉与交互参考 |
| pi-xanthil 源码 | c38a3cd1e0e19509c93a61ab01424b005b29a8bb | 只读设计学习证据，不形成依赖或联动 |
| `attachments/xanthil-first-phase-analysis-lifecycle.md` | 本规划包内附件 | 已转译的 JuanerAI 首期生命周期、Gate、Evidence、准入、失败和兼容边界；未来实施直接读取 |
| `attachments/xanthil-first-change-scenario-contracts.md` | 本规划包内附件 | 两个合成验收场景的闭合产品语义、fixture、oracle、Hypothesis/Strategy 与正负边界 |
| `attachments/pi-xanthil-read-only-research.md` | 本规划包内研究底稿 | 本次只读学习的来源与行号审计；不是实现依赖 |

参考材料中的角色、命令和路线没有被执行；外部文件没有复制进 JuanerAI 仓库。历史状态编号不再具有实施权威。

## 13. 后续治理

Xanthil 第一期产品边界与首个假设先行分析 Change 已明确区分：首个 Change 不消费 Model Pack，但第一期整体必须包含后续真实 Model Pack Consumer 与数据建模激活。分析生命周期和两场景附件已经冻结必须遵守的产品阶段、Gate、Evidence、数据准入、失败、oracle 和兼容语义；E/H/P/C/A 五节点拓扑只规划先后与所有权，精确 Port、TypeScript/序列化 Schema、资源上限、命令、Artifact/Model Pack executable contract、兼容、激活和回滚仍必须在对应 OpenSpec Change 中冻结。本文本身不创建或批准任何 Change、分支或实现。
