# 附件：JuanerAI Model Pack 模型接受、锁定与发布生命周期

> 状态：`model-pack-two-phase-product-plan.md` 的冻结规划附件；产品语义已确认，精确文件路径、Schema、命令与自动化待对应 OpenSpec Change 冻结
> 日期：2026-08-23
> 适用范围：Model Pack 第一期的模型规划、训练、评估、候选接受、锁定、发布，以及 `ModelPackBuilder` 的输入 Gate
> 来源方式：只读学习 ModelEvol E1–E9 后转译为 JuanerAI 自有流程；本附件可独立使用，实施不读取、不调用、不修改 ModelEvol 仓库

## 1. Agent 使用规则

当任务涉及第一期 MLflow 模型训练、评估、候选接受、模型锁定、模型发布或 `ModelPackBuilder` 输入时，先读取本附件，再起草 OpenSpec 或实现。

本附件定义产品流程和证据门禁，不直接授权创建状态机、Schema、CLI、依赖、训练任务或服务。实施 Agent 必须把适用条目转成当前 Change 的 Requirement、Acceptance Criteria、RED 测试和 allowed paths；不得运行 ModelEvol 命令，也不得把 ModelEvol 路径、状态文件或工具作为 JuanerAI 的运行依赖。

## 2. 转译结论

ModelEvol E1–E9 中应保留的是阶段分离、角色分权、可复现证据、返修回路、不可变锁定和发布前检查，不是 ModelEvol 的仓库、命令、worker 名称或产品适配方式。

JuanerAI 将其转译为 `MP1–MP9`：

| JuanerAI 阶段 | 含义 | 对应的只读学习来源 | 阶段结果 |
|---|---|---|---|
| `MP1 planned` | 模型能力与实验规划 | E1 | 获批的实验简报和数据/评估计划 |
| `MP2 assigned` | 单一执行责任与范围冻结 | E2 | 一个执行者、一个候选目标、无重叠写入范围 |
| `MP3 training_evaluating` | 训练、MLflow 记录与评估 | E3 | 可复现的 MLflow Run 和 Registry 精确候选版本 |
| `MP4 handoff_ready` | 候选与证据移交 | E4 | 完整、可审查的候选证据包 |
| `MP5 controller_review` | 独立审查与决定 | E5 | `changes_requested`、`candidate_accepted` 或 `rejected` |
| `MP6 changes_requested` | 有界返修 | E6 | 同一执行者按闭合 blocker 清单返修后回到 MP3 |
| `MP7 candidate_accepted` | 候选接受 | E7 | 候选达到锁定准备状态，但尚未锁定或发布 |
| `MP8 model_locked` | 不可变模型锁定 | E8 | 精确模型版本、Artifact 和 checksum 被锁定 |
| `MP9 model_released` | JuanerAI 模型发布 | E9 | 获准进入 `ModelPackBuilder` 的发布输入包 |

`MP9 model_released` 只表示模型供给侧已经获准打包，不表示 Model Pack SDK 已生成，更不表示独立 Consumer 或 Xanthil 已验收。

## 3. 第一期主链路

```text
MP1 规划并冻结目标、数据和评估合同
  -> MP2 分派一个执行者和一个候选目标
  -> MP3 本地训练
       -> MLflow Run / 参数 / 指标 / Evaluation / Artifact / Signature
       -> MLflow Registry 精确模型版本
  -> MP4 候选证据移交
  -> MP5 Controller 审查
       |-> MP6 changes_requested -> 同一执行者返修 -> MP3
       |-> rejected -> 终止该候选
       `-> MP7 candidate_accepted
              -> MP8 model_locked
              -> MP9 model_released
              -> ModelPackBuilder
              -> 可安装 Model Pack SDK
              -> 独立 Consumer 本地 load/predict
              -> Xanthil 本地消费与产品验收
```

MLflow 是训练与模型资产基础设施；`MP1–MP9` 是 JuanerAI 的接受、锁定与发布治理。MLflow 中存在 Run、Artifact 或 Registry 版本，不自动通过 `MP7–MP9`。

## 4. MP1–MP9 执行合同

### MP1 planned

负责人：Integration Controller。

必须完成：

- 明确模型支持的业务决定、用户、目标输出、禁止用途和成功标准；
- 明确是新能力还是既有能力迭代，并给出 baseline；
- 冻结输入/输出语义、标签或 taxonomy、缺失值策略、时间窗口、数据新鲜度和禁止假设；
- 区分 active training、holdout/evaluation、future prediction 和历史归档；
- 冻结 split 方法、泄漏检查、评估指标定义、分群指标和接受阈值；
- 明确训练假设、候选 Artifact 目标、MLflow 记录要求、验证方法、非目标和 stop conditions；
- 明确数据隐私、网络、许可证和敏感信息边界；
- 取得用户对产品目标和实验策略的确认。

完成标准：实验简报、数据合同、数据清单、split 计划、评估计划和候选目标均可审查；未知业务事实保持 Pending。未满足时不得进入 MP2。

### MP2 assigned

负责人：Integration Controller。

必须完成：

- 为本实验指定一个执行者、一个候选版本和一组互斥 allowed paths；
- 冻结执行简报、输入数据、候选输出位置、验证要求、禁止项和移交格式；
- 确认执行者无权接受、锁定、发布模型或修改 Xanthil Runtime；
- 确认 active inputs 中不存在未解决的重复业务 ID、混入的历史 Artifact 或数据放置错误。

完成标准：责任、范围、输入、输出和 stop conditions 无歧义。出现范围重叠、数据混放或合同漂移时返回 MP1。

### MP3 training_evaluating

负责人：获准的模型实现 Worker。

必须完成：

- 按冻结 split 处理数据并记录实际行数、字段、来源、checksum、隐私分类和泄漏检查；
- 运行 baseline 与候选训练或校准，记录精确代码版本、配置、特征、超参数和随机性控制；
- 把参数、指标、评估、Artifact、Signature、Runtime/依赖和 provenance 写入 MLflow；
- 对整体、关键分群、错误样本、时间外 holdout 和已批准负向场景进行评估；
- 在 MLflow Registry 中产生可精确寻址的候选模型版本；不得用 `latest`、可漂移 alias 或未固定路径代替精确 identity；
- 生成候选 Artifact metadata，至少包含 MLflow Experiment/Run identity、Registered Model name/version、Artifact URI、checksum、size 和候选状态；
- 如范围包含 future prediction，分别产生机器可读结果和用户可读报告，并标注它是预测而非已观察事实。

完成标准：数据与 split 清单为 ready；训练和评估可复现；候选版本、Artifact 与 checksum 可核验；要求的测试实际执行。缺项时不得进入 MP4。

### MP4 handoff_ready

负责人：模型实现 Worker。

移交包必须包含：

- 完成摘要、读取文件、修改文件和实际数据；
- 实际 split、样本数、重复 ID 与泄漏检查结果；
- MLflow Experiment ID、Run ID、Registry model name 和精确 version；
- 候选 Artifact URI/path、SHA-256、size、Signature 和生成命令；
- 每个指标的定义、baseline、candidate、delta、适用数据集和产品可解释性；
- 分群表现、错误分析、限制、风险和未决问题；
- 验证命令、完整结果和失败项；
- 推荐 `candidate_accepted`、`changes_requested` 或 `rejected`，但 Worker 无权作最终决定。

完成标准：Controller 能仅凭移交包和引用证据复核候选。缺少数据清单、split、指标语义、Artifact identity/checksum 或真实验证结果时，移交无效。

### MP5 controller_review

负责人：与模型实现 Worker 逻辑隔离的 Integration Controller。

必须审查：

- 工作是否满足简报、allowed paths、数据和安全边界；
- 数据来源、split 可复现性、泄漏、偏差、漂移、样本量和时间有效性；
- 指标定义是否一致，是否真正优于 baseline，分群或关键场景是否回退；
- Artifact、MLflow identity、Signature、checksum 和 Runtime/依赖是否一致；
- 限制、禁止用途、置信度语义和产品影响是否诚实；
- 正向、负向和失败证据是否足以支持决定。

合法决定只有：

- `changes_requested`：进入 MP6；
- `candidate_accepted`：进入 MP7；
- `rejected`：终止当前候选，重新规划才可开始新候选。

完成标准：Controller review 记录决定及其证据。数值提升本身不能替代指标语义、数据质量、Artifact 和风险审查。

### MP6 changes_requested

负责人：原模型实现 Worker；Controller 保持审查权。

每个 blocker 必须同时记录：问题与证据、根因或“根因未知”、有界修复方向、重新验收标准。返修保持原目标、原合同和原所有权；需要改产品目标、数据合同、共享 Schema、安全边界或 allowed paths 时，停止并返回 Controller 决策，不得在返修中暗改。

完成标准：同一执行者完成有界返修，更新候选和证据后回到 MP3，再走 MP4 和 MP5；不得从 MP6 直接进入 MP7。

### MP7 candidate_accepted

负责人：Integration Controller。

必须确认：

- MP5 已给出 `candidate_accepted`；
- 候选 Artifact identity、checksum、Signature、指标、限制和验证证据完整；
- 所有阻塞项关闭，剩余风险被明确接受或记录为非阻塞限制；
- 待锁定的 MLflow Registered Model 精确版本已固定。

完成标准：候选具备锁定条件。此状态不允许 `ModelPackBuilder` 取包，也不允许 Xanthil 消费。

### MP8 model_locked

负责人：Integration Controller；模型实现 Worker 无锁定权限。

必须完成：

- 锁定 capability identity、release candidate version、MLflow Experiment/Run、Registered Model name/version 和 Artifact URI；
- 重新计算并记录 Artifact checksum/size，确认路径或对象真实存在；
- 固化输入/输出 Signature、Runtime/依赖、训练代码引用、评估报告和 provenance；
- 记录获准用途、禁止用途、已接受限制、上一稳定版本、回滚对象和触发条件；
- 把锁定 Artifact 设为不可覆盖；任何变化必须产生新候选版本并重新进入生命周期。

完成标准：锁定记录可唯一解析到一个不可变模型 Artifact，且 rollback 可执行。缺少精确版本、checksum、评估或回滚时不得进入 MP9。

### MP9 model_released

负责人：Integration Controller；模型实现 Worker 无发布权限。

发布前必须验证：

- Release manifest 与 release note 指向 MP8 的同一精确 identity 和 checksum；
- MLflow 中的 Run、Evaluation、Signature、Registry version 和 Artifact 可核验；
- release check 读取当前锁定对象，而非历史硬编码版本或 `latest`；
- 许可证、依赖、数据/网络权限、已知限制和撤销/回滚信息完整；
- `ModelPackBuilder` 所需输入包齐全且不存在训练工作区绝对路径依赖；
- 未把模型发布误报为 SDK、Consumer 或 Xanthil 产品验收完成。

完成标准：生成一个 JuanerAI 发布输入包，并显式授权该精确版本进入 `ModelPackBuilder`。发布记录改变必须产生新发布版本，不原地覆盖。

## 5. `ModelPackBuilder` 输入 Gate

`ModelPackBuilder` 只能接收 MP9 发布输入包。逻辑上至少需要：

- capability identity 与发布语义版本；
- MLflow Experiment ID、Run ID、Registered Model name/version 和 Artifact URI；
- Artifact checksum、size、Signature 及输入/输出合同；
- Runtime 与依赖要求；
- 训练/来源 provenance 和评估摘要；
- 业务用途、禁止用途、限制和置信度语义；
- 数据、模型、文件与网络权限声明；
- 许可证、兼容版本、撤销和回滚信息；
- Controller 发布决定、时间和证据引用。

任一必需 identity、checksum、Signature、合同、权限或发布决定缺失/冲突时，Builder 必须 fail closed。精确字段名、Schema、序列化格式和落盘路径由 Model Pack 第一期 OpenSpec Change 冻结。

## 6. 最小验证矩阵

后续 Test Design 至少覆盖：

| 场景 | 预期结果 |
|---|---|
| MP1 未完成即尝试分派 | 拒绝进入 MP2 |
| 数据或 split 清单未 ready 即移交 | 拒绝进入 MP4 |
| 指标无定义、无 baseline 或 Artifact 无 checksum | Controller 不得接受候选 |
| MP5 要求返修 | 只能进入 MP6，并经 MP3/MP4 重新提交 |
| Worker 尝试接受、锁定或发布 | 拒绝且保持原状态 |
| MP7 候选尚未锁定即调用 Builder | 拒绝 |
| 锁定目标使用 `latest` 或可漂移 alias | 拒绝进入 MP8 |
| checksum 与真实 Artifact 不一致 | 拒绝锁定或发布 |
| MP8 未完成 release precheck | 拒绝进入 MP9 |
| MP9 输入完整且一致 | 允许 Builder 消费该精确发布版本 |
| MP9 后尚无 SDK/Consumer/Xanthil 证据 | 只能声明模型发布完成 |

## 7. 不继承的 ModelEvol 机制

JuanerAI 不继承以下实现细节：

- ModelEvol 仓库路径、`npm run modelevol:*` 命令和现有工具代码；
- E-state 文件格式、Task Bus adapter、worker runtime 名称和历史产品 PLS；
- ModelEvol 的 capability 目录、Artifact 目录或产品 adapter 目录；
- 任何历史模型、指标阈值、数据字段、版本、SHA、运行状态或部署结论。

这些内容只有在 JuanerAI 的独立 OpenSpec、合同和测试中重新获批后，才能形成 JuanerAI 实现。

## 8. 只读学习来源

本附件依据 ModelEvol 仓库快照 `06a440c0f34544ba6deb5fc95de48d92ce8471cc` 提取，来源仅用于审计本次转译：

- `AGENTS.md`：模型源、实验、评估、锁定/发布、角色和产品采用边界；
- `skills/modelevol-controller/SKILL.md`：E1–E9 Controller 责任与 Gate；
- `skills/modelevol-worker/SKILL.md`：训练、评估、候选和移交责任；
- `skills/modelevol-review/SKILL.md`：候选审查、返修、接受、锁定和发布硬停止；
- `docs/lifecycle.md`：能力上下文、建模和产品化阶段；
- `docs/process-exports/modelevol-v0.4-e1-e9-flow.html`：一次 E1–E9 实际闭环证据；
- `templates/INTAKE_SUMMARY.template.md`、`DATA_CONTRACT.template.md`、`WORKER_BRIEF.template.md`、`WORKER_HANDOFF.template.md`、`EVALUATION_REVIEW.template.md`、`CONTROLLER_REVIEW.template.md`、`MODEL_LOCK.template.md`：最小证据字段。

后续 Agent 以本附件和 JuanerAI 当前权威为工作输入；无需重新读取 ModelEvol。若本附件与 JuanerAI 当前用户批准、项目宪章、OpenSpec 或架构决定冲突，以 JuanerAI 权威为准并停止请求 Controller 决策。
