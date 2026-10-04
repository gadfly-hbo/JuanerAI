# JuanerAI v3.3 Model Pack：定位与功能一致性校验

校验日期：2026-09-09。结论：**核心定位一致；发现 3 项实质范围/验收差异，以及 3 项需要补清的职责与接口边界。建议白皮书 Controller 修订，不能直接用新版摘要覆盖已有批准方案。**

本次是文档、源码和既有运行产物的交叉核对；没有重新训练、运行浏览器或重新裁决 Demo PASS。没有修改任何冻结 Brief、行动卡、Demo 或真实产品仓库。白皮书原文原样保存。

## 证据与采用顺序

| 来源 | 本轮使用范围 |
| --- | --- |
| [v3.3 白皮书](../../JuanerAI_数据分析与决策操作系统白皮书_v3.3.md) | 9.5–9.7、13 章 L5、14.4、18.10–18.20、附录 I；被校验对象 |
| [PX-005 产品讨论](../../explorations/PX-2026-005-model-pack-demon/PRODUCT_BRIEF.md) | 第 54–78 行：两期链与首发场景；101–128 行：后续用户明确批准的 MLflow-first、ModelEvol 与真实 Phase 1 Demo；优先采用后续决策，不能把早期“仅静态”描述当成当前全部状态 |
| [PX-005 行动卡](../../explorations/PX-2026-005-model-pack-demon/NEXT_ACTION.md) | 当前为已接受的 Phase 1 研究链及 UI；Phase 2、Handoff、真实产品开发未授权 |
| [PX-005 Demo Brief 与历次评审](../../explorations/PX-2026-005-model-pack-demon/DEMO_BRIEF.md) | 第 839–854 行：2026-08-29 v0.2-rev1；605–613 行：2026-08-31 v0.2-ui-rev1；历史快照分开核对 |
| [两期正式产品计划 Desktop Revision](/Users/huangbo/JuanerAI/docs/planning/2026-08-27/model-pack-two-phase-product-plan.md) | 第 76–187 行：供给、独立 Consumer、Desktop Runtime、两期验收边界。只读补充证据；其中早期训练 UI 非目标已被 research 后续用户决策调整，不能倒推覆盖后续决定 |
| [PX-007](../../explorations/PX-2026-007-model-pack-mlflow-spike/NEXT_ACTION.md)、[PX-008](../../explorations/PX-2026-008-model-pack-builder-consumer-spike/NEXT_ACTION.md) | MLflow Serving/parity 与 Builder/独立 Consumer 的研究 Spike 已有 PASS；不能等同完整企业产品实现，008 的极端独立性约束也不是通用产品规范 |
| [现存 evidence.json](../../explorations/PX-2026-005-model-pack-demon/demo/training-slice/evidence/evidence.json) | 本轮实际读取；Run、完整 Pack SHA 与 2026-08-31 最终评审吻合，文件 SHA-256 为 `8f833fafba9fbc84a401812e39bd821be61a279fcebe59e4f7e7173ebdb75cfa`；这是既有执行记录，非本轮重跑结果 |

## 已一致的核心定位

- Model Pack 是有身份、版本、合同、来源和限制的可执行模型能力；不等于权重文件、MLflow Registry 条目、Domain Pack 或分析方法。
- MLflow 记录/注册，Worker 执行训练，Controller 接受/锁定/发布，Builder 交付，Consumer 验真；统一工作区不要求普通用户往返多个技术产品。
- 未发布不能构建；消费执行记录不等于 Consumer Gate；future-actuals 隔离与重算；旧 Run、版本与身份链保留。
- 合成研究结果不证明真实业务质量、生产级 LLM Agent 或 Xanthil 生产集成。v3.3 18.20 已写出这些限制，应保留。
- DAME 定义方法、Domain Pack 约束领域用法、Model Pack 提供需要独立生命周期的模型实现，是兼容现有定位的新分层。不能据此把所有统计方法都变成 Model Pack。

## 三项实质差异

### R1：Phase 1 完成条件遗漏 Desktop 实际集成验收（高）

**新版位置**：18.12 将 `Independent Consumer → future-actuals → Phase 1 验收 → Xanthil Desktop 可消费目录` 排成主链；附录 I 同样把 Desktop Catalog 放在 Phase Acceptance 之后。18.20 同时承认 Desktop 生产接口尚未集成。

**已有约定**：PX-005 产品讨论第 68 行将 independent Consumer、Desktop local `AnalyticalModelRuntime`、future-actuals 分列；两期计划 6.5 明确独立 Consumer 通过之后，还需 Desktop 在 macOS/Windows 安装同一 Pack、真实推理、记录来源并验证失败路径，才能完成产品 Phase 1。研究切片的 `phase1_accepted` 只代表其冻结范围。

**影响**：主链会让读者把供给侧合成 Gate 当成整个 Phase 1 产品验收，把 Desktop 集成变成验收后的附属工作。18.20 的限制说明不能代替主链中的独立 Gate。

**建议替换**：

> Phase 1 产品链包括模型发布、Thin Builder、独立 Consumer 验证、Xanthil Desktop 安装及 AnalyticalModelRuntime 实际集成验证、Controller-held future-actuals 和产品验收。独立 Consumer、Desktop 集成与业务效果分别形成证据。研究切片可以在其冻结范围内通过 Phase 1 Demo Gate，但不代表 Phase 1 产品完成。生产目录的正式准入依据适用产品 Gate，测试安装和受限验证不等于生产准入。

### R2：完整两期路线缺少 Phase 2 企业 Serving（高）

**新版位置**：18.10–18.20、附录 I 只展开离线 Pack 与 Desktop。本轮全文检索未找到 `Phase 2`、`Serving`、`AnalyticalModelRuntime` 的对应产品路线定义。

**已有约定**：PX-005 第 55、70 行和两期计划第 7 节明确：同一已验收 Pack 经 Xanthil Enterprise Frontend → Backend → thin `MLflowServingAdapter` → MLflow OSS Model Serving，验证 local/serving parity，并有独立企业入口与运行验收。

**影响**：Model Pack 的范围由本地与企业两期产品链，被压缩成离线交付路线。PX-007 仅证明最小 Serving/parity 技术路径，不能补足白皮书中的产品范围，也不能证明 Phase 2 已完成。

**建议新增**：

> Phase 1 面向 Desktop 本地推理。Phase 2 在另行批准的企业场景、数据和运行合同下，通过 Enterprise Backend 的薄 MLflowServingAdapter 调用 MLflow OSS Model Serving；Frontend 不直连 MLflow。两期保持同一 Pack 身份、业务合同与 Provenance，并独立验证 local/serving parity 和运行条件。Phase 2 仍是后续路线，已有 Spike 不代表企业产品完成或开发授权。

### R3：首个预测 profile 被写成所有 Model Pack 的通用约束（高）

**新版位置**：18.14 用“至少控制”引出金额、折扣、日期连续性、currency 等，又要求“负值”“矩阵缺失”“合同外字段”一律拒绝；18.17、18.18 将 currency、cutoff、连续日期/品类、interval coverage 等写为统一消费与验收条件。

**已有约定**：PX-005 第 56、76–78、117、121 行限定首个 28 天品类需求预测场景及 CPU/scikit-learn profile。[contract.py](../../explorations/PX-2026-005-model-pack-demon/demo/training-slice/scripts/contract.py) 第 1–17、38–100 行将这些规则明确冻结到该场景；并非通用模型规范。

**影响**：例如允许负值的收益预测、标准化特征、无日期品类矩阵的分类/聚类输入，会被这种通用表述错误拒绝。非预测任务也未必采用同样的未来窗口或区间 coverage。

**建议替换**：

> 所有模型核对精确身份、输入输出合同、权限、来源和适用验证门禁；字段合法性、缺失规则、时间约束、金额、完整矩阵、评估指标、阈值及独立验收方式由用户确认的场景合同/profile 定义。首发 28 天需求预测采用严格非负金额、连续日期×品类矩阵、禁止合同外字段、rolling-origin 与 future-actuals 等规则；不得将该 profile 推广为全部模型的固定 Schema。不可判定的适用门禁应阻断，不能静默放行。

## 三项需补清的边界

### R4：ModelEvol 训练供给与 Controller 职责衔接不完整（中，职责缺口）

v3.3 第十三章仍提到 ModelEvol 的训练、评估、重训和版本治理，**并非完全删除 ModelEvol**；但第十八章详细生命周期没有解释其与 Worker、唯一治理 Controller 的关系。

PX-005 第 110–125 行已有用户决定：ModelEvol Controller/Worker 体验作为训练供给控制面，嵌入同一工作区；MLflow 负责模型记录，Model Pack 负责治理发布。MP1–MP9 与 E1–E9 做语义映射，不复制历史状态与外部模型。

建议补一句清晰责任约定：**ModelEvol 承担训练供给组织与 Worker 生命周期，Model Pack Controller 对候选接受、锁定、产品发布及验收负最终责任；两者共用实验/Pack 上下文和证据，映射职责而非产生两套相互竞争的发布状态。** Agent 读取 schema、画像、质量、权限、checksum 摘要；原始训练行进入隔离入口。此处补齐已有决定，不声称真实 ModelEvol 产品已接通。

### R5：Consumer 验证切片与 Desktop 日常 Runtime 合同混用（中，接口歧义及准入遗漏）

v3.3 18.17 先定义 `verify → install → offline load → predict → receipt` 的原子链，再让 Desktop 的已安装 Pack 走“原子 consume”，并要求任何失败回滚安装目录。它未明确独立 Consumer 首次验收与 Desktop 已安装版本的日常执行是否共用安装事务；Model Pack 章节也未充分列明撤销、权限、兼容性、取消、deadline 等消费门禁。

原子链确实来自现有研究代码：[consumer.py](../../explorations/PX-2026-005-model-pack-demon/demo/training-slice/scripts/consumer.py) 第 461–490、588–595 行在本次隔离目录安装，失败删除该目录与本次输出。这证明研究验收事务成立；不能直接推导正式 Desktop 每次调用要重装，或失败时可以删除先前有效安装。

已有产品依据：PX-005 第 54、105 行保留权限、兼容性、撤销/回滚/退役；两期计划 6.3–6.5、8 明确独立 `AnalyticalModelRuntime`、取消/deadline、数据/Ontology 兼容性，安装不授予额外权限。

建议区分：**安装/验证与激活流程**，以及**绑定已安装精确版本后的执行流程**。Runtime 逐次检查适用权限、撤销状态、合同/数据兼容性、取消和 deadline，输出绑定 receipt；失败只回滚本次事务产生的变更，保持既有有效安装和历史证据。撤销/退役通过治理状态控制后续使用，不篡改不可变历史。`AnalyticalModelRuntime` 与 Agent Runtime 分责，正式安装格式与 API 另按产品合同冻结。

### R6：MLflow-first 的薄封装约束需要写得更具体（中，防止误实现）

v3.3 18.11 已明确不重做 Tracking/Registry，18.16 列出 Wrapper、Runtime Adapter、Archive 和成员清单，方向一致；但缺少现有批准方案中“优先封装或引用原始 MLflow Model”的关键约束。

PX-005 第 104–108 行明确：复用 MLflow Model、Signature、依赖、精确加载与 Serving；PX-008 的“不 import MLflow”和自定义 ZIP/manifest/adapter 属于极端 Spike，不能照搬成产品要求。当前 [builder.py](../../explorations/PX-2026-005-model-pack-demon/demo/training-slice/scripts/builder.py) 绑定 MLflow 模型工件，[consumer.py](../../explorations/PX-2026-005-model-pack-demon/demo/training-slice/scripts/consumer.py) 第 472、487 行实际使用 `mlflow.pyfunc.load_model`。

建议补充：**优先复用原始 MLflow Model 及其 Signature、依赖、版本来源和加载能力；只添加经证据证明缺失的 JuanerAI 产品合同、治理、准入与离线完整性信息。推理不依赖运行中的 Tracking/Registry 服务，不等于禁止使用 MLflow 本地加载库。** 白皮书定义完整性要求，研究 ZIP 布局和自定义 wrapper 不自动成为长期标准。

## 不应误判为冲突的事项

### 36 项与 71 项浏览器断言属于不同版本快照

18.20 的 Run `7935ba1d318043b4a691ca3aee6db13b`、Pack SHA `793a49c745ed916ba44e96a4ce9bf1cf0c167a688dbe3ec0444a8ac28bd07b2a`、58/14/36/17，能精确对应 2026-08-29 v0.2-rev1 第十三轮最终评审。

2026-08-31 v0.2-ui-rev1 第三轮最终评审是 58/14/71/17；Run `758a624d078a4c69920177a8e2bd7e36`、Pack SHA `e1ebf90f8c3223cb55671af3fb09f2967019ea55d33844670b2cf88839e753de`，与本轮读取的 evidence 一致。

建议把 18.20 表头写为“2026-08-29，PX-005 v0.2-rev1 第十三轮研究快照”，并另列后续 UI 验收。**不能只把 36 改成 71，保留旧 Run/SHA 后拼成同一次执行。** 本轮未重跑这些检查，指标也不代表真实业务质量。

### 预测到策略/行动的展示链需显式保留后续门禁

18.17 末尾“证据、预测、策略或行动”是有歧义的简图；全文其他章节保留治理，因此不据此断言 v3.3 授权自动行动。建议改为：`Prediction Artifact → 语义增强与验证 → Evidence → 独立策略评审/人工审批 → 适用的行动执行流程`。模型输出不会因通过 Consumer 或 future-actuals 就自动成为 Decision、策略增量、Action 或 Outcome。

## 交给白皮书 Controller 的处理顺序

1. 先修 R1–R3：补完整产品完成条件、两期路线，把 profile 专用约束移回案例。
2. 补 R4–R6：供给/发布权责、Desktop 消费准入与事务边界、MLflow 原生工件复用。
3. 标注历史证据日期与版本，明确预测后的决策/行动门禁。
4. 同步第十三章、14.4、第十八章、附录 I、术语、升级说明及相关图示；新材料注明修订版本或修订号，保留本次 v3.3 原始快照。

可直接转交的完整请求见 [Controller 修订 Prompt](JUANERAI_V3_3_MODEL_PACK_CONTROLLER_PROMPT.md)。以上是修订建议，不是已获批准的新架构或实现任务。
