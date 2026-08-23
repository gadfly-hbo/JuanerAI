# 附件：Model Pack 一期首发场景与验收合同

> 状态：用户已于 2026-08-23 明确确认并随五份正式文档冻结，作为 Model Pack 一期首发产品输入
> 日期：2026-08-23
> 适用范围：Model Pack 一期 MP1 输入、Provider/独立 Consumer/Xanthil Consumer 验收
> 边界：用户确认只冻结本文的首发产品语义与验收输入；不授权 OpenSpec、训练、MLflow 安装、依赖、Schema、真实数据读取、真实模型调用、产品分支或产品 PR。本冻结包的纯文档治理分支与 PR 已单独授权。

## 1. 首发能力

- Pack identity 候选：`juanerai.sales-demand-forecast`；精确命名和语义版本由 OpenSpec 冻结。
- 用户：需要评估未来四周订单与收入走势的 Data Analyst。
- 业务问题：基于获准的每日品类订单聚合历史，预测未来连续 28 个 UTC 日历日的 `order_count` 与 `net_order_amount`，按 `product_category` 输出点预测和 80% prediction interval。
- 支持的 Decision：分析师决定哪些品类需要进一步做库存、营销或经营计划审查。
- 禁止用途：不自动补货、定价、投放、触达或修改业务系统；不输出会员级预测；不把预测写成已观察 Outcome、因果结论或已授权 Decision。
- 模型性质：本地、固定版本、固定随机性控制、无在线学习、无外部特征、无推理网络访问。精确候选算法是 MP1 实验设计与 OpenSpec 的实现选择，不改变本文的业务输入、输出和验收合同。

## 2. 真实数据合同

用户在对应 Change 获批后提供两个本地文件；现在不提前索取或读取：

1. `history.csv`：截止 `cutoff_date` 至少连续 196 个 UTC 日历日；
2. `acceptance-actuals.csv`：紧接 `cutoff_date` 的连续 28 日，只由 Controller 保管；Provider/MP3–MP9 Worker 永远不得读取。只有 MP9 SDK、C 的 Consumer Head 与 A 的真实运行授权均已就绪后，Controller 才在 A 中打开它做 Xanthil 产品验收。

两个文件使用同一闭合字段：

| 字段 | 规则 |
|---|---|
| `business_date` | 严格 `YYYY-MM-DD` UTC 日期 |
| `product_category` | 非空、稳定业务 category identity；不得含直接个人标识或自由文本 |
| `order_count` | 非负整数 |
| `gross_order_amount` | 非负定点十进制，统一使用用户声明的单一 currency |
| `discount_amount` | 非负定点十进制，且不大于 `gross_order_amount` |

派生 `net_order_amount = gross_order_amount - discount_amount`。每个日期与 category 恰好一行；缺失日期/category 组合不得被实现者自行解释为零。额外字段、重复键、负数、非法日期、货币不一致、历史与验收日期重叠或不连续均 fail closed。

用户随数据声明：source authority、导出时间、UTC/currency、允许用于本地训练与产品验收的权限、敏感性/许可证、保存与删除要求。数据、Schema、统计、Artifact 和预测默认 local-only；未经另行批准不得发送第三方、模型 Provider 或外部项目仓库。MLflow 一期也必须是获批的本地 OSS 配置。

无法提供完整 196+28 日、闭合字段、权限声明或无泄漏隔离时，首发场景保持 blocked，不得更换问题、填补数据或使用外部数据救场。

## 3. Split、baseline 与评估合同

### 3.1 训练/评估

- `acceptance-actuals.csv` 不参与 MP3 训练、调参、阈值选择或候选审查。
- `history.csv` 内使用三个按时间递进的 28 日 rolling-origin folds；每个 fold 只能使用预测起点之前的数据训练，禁止随机打散未来记录进入过去。
- 模型可使用历史目标值的日历与 lag/rolling 特征；不得使用未来促销、库存、价格、外部数据或验收 actuals。
- baseline 为 seasonal-naive：每个 category、每个目标分别使用 `t-7` 的已观察值预测；缺少该 lag 时该候选数据集不合格。

### 3.2 指标

对 `order_count` 与 `net_order_amount` 分别计算：

`WAPE = sum(abs(actual - prediction)) / sum(abs(actual))`

总体或必要分组分母为零时，不伪造 `0` 或无限值；对应 fold/验收为不可判定并阻断接受。Key category 定义为在相应训练窗口内占 `net_order_amount` 至少 5% 的 category。

候选进入 `candidate_accepted` 必须同时满足：

1. 三个 rolling-origin folds 合并后，`order_count` 总体 WAPE 相对 baseline 至少改善 5%；
2. `net_order_amount` 总体 WAPE 相对 baseline 至少改善 10%；
3. 任一 key category 的任一目标 WAPE 不得比 baseline 恶化超过 5 个百分点；
4. 所有点预测非负，lower/upper interval 有序且 lower 非负；
5. 名义 80% interval 在两项目标合并的滚动验证观察上，实际 coverage 位于 70%–90%；
6. 相同 Pack、输入和 Runtime 重复推理产生逐值相同结果。

“相对改善”定义为 `(baseline_WAPE - candidate_WAPE) / baseline_WAPE`。baseline WAPE 为零时，该目标不允许以相对改善规则接受，必须返回 Controller 重新决定场景或指标，不得除零或自动换阈值。

未满足阈值只能 `changes_requested` 或 `rejected`；数值接近、总体提升但关键分组回退、漂亮的 MLflow 图表或模型解释都不能替代 Gate。

## 4. MP1 产品简报

MP1 冻结：

- 本文的用户、业务问题、28 日 horizon、输入/输出、禁止用途和成功终点；
- 两个本地真实数据提供物及隔离；
- rolling-origin、seasonal-naive baseline、WAPE/interval/key-category Gate；
- 只允许本地 MLflow OSS 记录 Run/Evaluation/Artifact/Signature/Registry；
- 一个实现 Worker、一个候选目标、固定随机性、无外部网络或数据；
- stop conditions：数据不合格、泄漏、baseline/指标不可判定、关键分组回退、Artifact/Signature/checksum/权限冲突、真实验收失败。

精确算法、MLflow 版本/端口/存储、训练代码路径、manifest 字段编码和命令属于 OpenSpec/Design，但不得改变上述产品和评估合同。

## 5. Model Pack 与本地 Runtime 合同

Pack 的业务输入是：

- `as_of_date = cutoff_date`；
- 截止该日、至少连续 56 日的闭合每日 category 历史，字段与 §2 相同；
- currency 与支持的 Pack/contract version。

Pack 输出对未来 28 日每个 category 提供：`business_date`、`product_category`、`predicted_order_count`、`predicted_net_order_amount`、两项目标各自的 lower/upper 80% interval，以及 Pack/model/Runtime provenance。输出不得含训练路径、MLflow URI、供应工具错误或外部仓库结构。

场景化 `AnalyticalModelRuntime` 必须覆盖：预检 Pack identity/version/checksum/contract/Runtime/permission/revocation，确认输入快照，单次本地 predict，取消与 deadline，输出验证，稳定业务错误和 provenance。它不复用 `AgentAnalysisRuntime`，不提供 registry、fallback、热切换或多模型路由。

## 6. Consumer 行为与真实验收

### 6.1 独立 Consumer

在无训练工作区、无 MLflow 服务、无外部项目仓库连接和无网络的环境中：安装真实 SDK，验证 Pack 与输入，使用 `history.csv` 截止 `cutoff_date` 的数据完成 28 日预测，并证明同输入重复输出一致。该结果只证明供给侧可交付。

### 6.2 Xanthil CLI/Personal Consumer

用户选择数据建模模式、选择已安装的首发 Pack 和本地 `history.csv`；产品展示 Pack identity/version/checksum、用途、禁止用途、输入 snapshot、28 日 horizon、数据保持本地和拟输出位置。用户确认后，Application 通过场景化 `AnalyticalModelRuntime` 本地推理，输出：

- 28 日总体与品类预测表及 interval；
- 相对 seasonal-naive 的验收指标；
- key-category 回退检查；
- Pack、固定模型、输入、Runtime/Adapter/Profile 和运行 provenance；
- prediction 非 Decision、Recommendation 非 Action 的声明。

产品验收使用 Controller 保管的 `acceptance-actuals.csv`；它在 MP8 锁定、MP9 SDK 生成、C 合入且 A 获得真实运行授权之后才打开，并与同一真实 SDK 的预测比较。最终 28 日实际验收必须满足 §3.2 的 5%/10% 总体改善、5 个百分点 key-category 回退上限、非负/区间和可重复性要求；不满足时 Model Pack 一期与 Xanthil 第一期均不得声明完成，且不得在 Xanthil 侧改合同或阈值救场。

## 7. Fail-closed 验收

以下任一情况不得运行或不得产出成功结果：

- Pack identity/version/checksum/Signature/contract/Runtime/权限/许可证/撤销状态缺失、未知或冲突；
- 输入不足 56 日、日期不连续、字段/类型/枚举/货币错误、重复键、缺失 category 组合、历史越过 `as_of_date`；
- 推理发生未声明网络访问、读取 MLflow/训练工作区/外部仓库或尝试写源数据；
- 输出缺日期/category、出现负数、interval 无序、provenance 不完整或结果非确定；
- 用户拒绝/取消、deadline、Runtime 失败或输入在确认后发生变化；
- acceptance actuals 在 A 获准打开前泄漏或被任何 Provider Worker 读取、真实验收未达到阈值、或待验收 Head/Pack identity 与证据不一致。

具体稳定错误码和 Artifact Schema 由 OpenSpec 冻结，但用户必须看到不兼容、输入无效、权限不足、取消、超时、Runtime 失败或验收失败中的准确业务原因；失败不得伪装为部分成功或自动 fallback。

## 8. 二期衔接

二期只允许把同一已发布 Pack 的同一输入/输出与 provenance 语义映射到 Xanthil Enterprise Backend 内的 `MLflowServingAdapter`。本文不批准二期实现；企业场景、身份、网络、超时、幂等、审计、恢复、部署与回滚仍须独立产品/Structure/OpenSpec Gate。
