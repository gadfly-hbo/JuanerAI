# JuanerAI Model Pack 分两期产品方案

> 状态：产品规划已由用户于 2026-08-23 冻结并通过 Development-Readiness Gate；纯文档 governance PR 待合入
> 日期：2026-08-23
> 目标仓库：`/Users/huangbo/JuanerAI`
> JuanerAI 基线：`main` = `origin/main` = `60e13514ffec01c09dc407e4271492458e9f4105`
> 权威边界：本文以 JuanerAI 产品定义、架构边界和用户明确批准的 MLflow 两期主链路为权威；JuanerAI 仓库之外的项目仓库只允许按用户指令只读学习，不是依赖、集成目标、发布权威或可写范围。本文不批准 OpenSpec Change、依赖安装、Schema、Runtime、训练、服务部署、产品分支或产品 PR；用户只单独授权本冻结包的纯文档治理分支与 PR。
> 流程附件：设计或实施一期模型训练、评估、接受、锁定、发布或 `ModelPackBuilder` 输入前，必须读取 [`attachments/model-pack-release-lifecycle-gates.md`](attachments/model-pack-release-lifecycle-gates.md)。
> 首发场景附件：用户已于 2026-08-23 明确确认 [`attachments/model-pack-first-scenario-contract.md`](attachments/model-pack-first-scenario-contract.md) 中的一期首个用户、业务问题、真实数据合同、baseline、指标/阈值、Pack Runtime 与 Consumer 验收；该确认不授权实施。

## 1. 状态标记

- Confirmed：来自 JuanerAI 当前权威文档或用户本轮明确确认的边界。
- Proposed：为形成可讨论产品方案而提出的建议，尚未取得用户批准。
- Pending：必须在对应 Change 前决定，本文不填默认答案。
- Deferred：明确不属于当前阶段。

两期产品架构已经由用户明确确认：一期以 MLflow OSS 贯穿本地训练、评估、Registry 和固定模型发布物，再生成可安装 Model Pack；二期复用同一发布模型进入 MLflow OSS Model Serving，并通过 Xanthil Enterprise Backend 内的薄 Adapter 暴露业务 API。外部项目仓库中的生命周期名称、路径、SHA、当前 Artifact、版本和部署现状不继承为本文事实。

## 2. 产品定义

### 2.1 JuanerAI Model Pack — Confirmed

Model Pack 是可复用的 JuanerAI Product Module，也是一个带版本的可执行业务模型包。它必须声明：

- 稳定 identity、语义版本和 Artifact checksum；
- 支持的 JuanerAI 合同版本；
- 业务用途与禁止用途；
- 类型化输入与输出；
- Runtime 和依赖要求；
- 训练或来源 provenance；
- 评估指标、限制和置信度语义；
- 数据、模型与网络权限；
- 确定性或随机性属性；
- 验证、回滚和退役策略。

Model Pack 不是单个模型文件、算法脚本、训练仓库镜像或某个供应商服务的别名。生产工具、模型来源和运行基础设施可以替换，但包的 JuanerAI 业务合同保持稳定。

### 2.2 用户价值 — Proposed

Model Pack 让 Xanthil 或其他 JuanerAI 产品在不继承训练环境、仓库绝对路径和供应工具内部结构的前提下，可靠地安装、校验和运行已发布业务模型，并把模型 identity、输入快照、版本、来源、评估证据和限制带入 Decision Loop。

模型输出是带来源的分析证据，不自动成为 Decision，更不授权 Action。

### 2.3 外部仓库只读学习边界 — Confirmed

JuanerAI 项目仓库之外的项目仓库只用于用户明确安排的只读学习：

- 不向外部仓库写文件、创建分支、提交、推送或创建 PR；
- 不把外部仓库列入 JuanerAI Change 的 allowed paths、Provider、Consumer、发布 Gate 或集成依赖；
- 不要求 JuanerAI Runtime、构建、验证、发布或运行时读取外部仓库路径；
- 不把外部仓库的生命周期名称、内部状态或发布流程直接写成 JuanerAI 必须执行的产品合同；
- 可以吸收经过用户确认的设计思想，但必须重新表述为 JuanerAI 自有的产品需求、架构决定、Gate 和测试。

MLflow OSS 是用户明确选择的基础设施能力，不等于授权读取或联动任何本地外部项目仓库。实际依赖安装和运行仍需对应 Change 授权。

### 2.4 MLflow 官方入口 — Confirmed

涉及 MLflow 源码、安装和配置事实时，Agent 必须优先使用以下固定的官方入口，不再猜测本地仓库、第三方镜像或从 ModelEvol 等外部项目反推：

- 官方开源仓库：[mlflow/mlflow](https://github.com/mlflow/mlflow)；
- 官方文档：[MLflow Documentation](https://mlflow.org/docs/latest)；
- Tracking 安装与配置入口：[MLflow Tracking Quickstart / Setup](https://mlflow.org/docs/latest/ml/tracking/)。

这些链接只提供 MLflow 自身的源码与安装指南依据，不把 MLflow 仓库变成 JuanerAI 的可写范围、跨仓依赖或产品合同权威。Agent 可以只读查阅；实际安装、版本锁定、进程启动、存储配置和服务部署仍必须在对应 JuanerAI Change 中取得授权并冻结。

## 3. 两期总览

| 阶段 | 产品终点 | 主要消费者 | 不包含 |
|---|---|---|---|
| 第一期：MLflow 本地模型发布与 Model Pack | 本地训练、评估和 Registry 形成固定 MLflow 模型发布物，生成可安装 Model Pack SDK，并由 Xanthil 完成本地消费 | 独立 Consumer 做供给侧验证；Xanthil CLI/Personal 是产品消费者 | 企业推理 API、自建训练/实验平台、Desktop/Enterprise 激活 |
| 第二期：MLflow 企业服务化 | 同一发布模型进入 MLflow OSS Model Serving，并通过 Xanthil Enterprise Backend 内的 `MLflowServingAdapter` 提供业务能力 | Xanthil Enterprise Backend；Frontend 只调用 Xanthil 业务 API | 前端直连 MLflow、另建通用 Serving 平台、自动 Action、未经批准的企业安全实现 |

两期可以在产品层同时规划，但开发必须逐期、逐 Change 授权。第二期不能反向扩大第一期包合同，也不能以未来企业需求为由提前建设平台。

## 4. 第一期：本地 Model Pack

### 4.1 产品目标 — Confirmed

第一期用一个获批的、确定性优先的代表性业务模型，证明以下完整闭环：

```text
MP1 规划
        -> MP2 单一执行者与范围冻结
        -> MP3 本地训练、MLflow Run / Evaluation / Artifact / Signature
        -> MLflow Registry 精确候选模型版本
        -> MP4 候选移交
        -> MP5 Controller 审查
             |-> MP6 有界返修 -> MP3
             `-> MP7 候选接受 -> MP8 模型锁定 -> MP9 模型发布
        -> ModelPackBuilder
        -> 形成并校验版本化 Model Pack SDK
             |-> 独立本地 Consumer -> 供给侧可交付证明
             `-> Xanthil CLI 安装与校验
                    -> 数据建模本地推理
                    -> 业务结果、模型 provenance、限制和验证证据
```

MLflow 负责记录训练 Run、参数、指标、评估、Artifact、Signature、Runtime/依赖并承载 Registry 精确模型版本。JuanerAI 自有的 `MP1–MP9` 生命周期负责计划、分派、训练移交、独立审查、返修、候选接受、不可变锁定和发布；只有 `MP9 model_released` 的精确模型版本可以进入 `ModelPackBuilder`。完整阶段、证据、退出条件和负向 Gate 见 [`模型接受、锁定与发布生命周期附件`](attachments/model-pack-release-lifecycle-gates.md)。该附件已把只读学习的 ModelEvol E1–E9 转译为 JuanerAI 自有要求，实施不引用 ModelEvol 仓库、命令或状态文件。

“模型生产完成”不是终点。独立 Consumer 脱离训练工作区和 MLflow 服务完成校验、加载和推理，只证明 SDK 可交付；Model Pack 一期只有在 Xanthil 安装真实 SDK、通过本地业务 Runtime 调用并产生符合合同的产品结果后，才完成产品验收。

第一期验收必须使用用户届时提供的真实用例数据完成实际测试；仅使用合成数据、示例数据或测试 fixture 不能通过第一期验收。

首发代表性能力采用用户已确认的 `attachments/model-pack-first-scenario-contract.md`：预测未来 28 日的品类订单量与净订单金额。它面向 Data Analyst，以用户以后在获批 Change 中提供的本地每日品类聚合历史和隔离的 28 日 acceptance actuals 验证；预测只支持经营计划复核，不授权补货、定价、营销或其他 Action。后续 Agent 不得替换为其他模型或自行发明输入、指标和阈值。

### 4.2 最小产品能力 — Proposed

第一期至少包含：

1. 本地 MLflow Run、Evaluation、Artifact、Signature 和 Registry 固定版本；
2. `MP1–MP9` 模型接受、返修、锁定和发布 Gate 的完整证据；
3. 只有 MP9 精确发布版本可以进入 `ModelPackBuilder` 的 fail-closed 输入 Gate；
4. 同一固定模型版本的本地 load/predict 与 MLflow Serving compatibility smoke；
5. 一个封闭、版本化的 Model Pack manifest；
6. Artifact identity、版本和 checksum 校验；
7. 类型化输入/输出及 fail-closed validation；
8. Runtime 与依赖声明；
9. 业务用途、禁止用途、指标、限制和置信度语义；
10. 训练或来源 provenance，以及 JuanerAI 发布依据；
11. 本地 load/predict 入口；
12. 安装验证、兼容性检查、回滚和退役信息；
13. 独立 Consumer 的正向与负向供给侧验收证据；
14. Xanthil CLI/Personal 安装真实 SDK、执行本地推理并生成业务结果的产品验收证据。
15. 使用用户提供的真实用例数据完成第一期实际验收测试。

包格式、编程语言、依赖管理和分发方式均为 Pending。本文不把建议目标路径等同于已批准目录或 Schema。

### 4.3 独立 Consumer 供给侧验收 — Proposed

独立 Consumer 必须证明：

- 不依赖模型生产仓库的绝对路径；
- 不复制生产仓库源码作为运行前提；
- 不连接 MLflow Tracking/Registry、训练工作区或任何外部项目仓库也能完成本地推理；
- identity、version、checksum、contract 或 Runtime 不兼容时 fail closed；
- 输入缺失、类型错误、未知字段和越界值按冻结合同处理；
- 输出可追溯到 Model Pack、输入快照、运行身份和实际 Runtime；
- 不把预测结果表述为 Decision 或已执行 Action；
- 不发生未声明的网络或数据外传。

该验收不代表 Xanthil 已经消费 Model Pack，也不能替代 Xanthil Application、业务 Port、Profile、产品输出和用户体验验收。

### 4.4 与 Xanthil 第一期的关系 — Confirmed

Model Pack 一期的完整产品终点包含真实 Xanthil 本地消费，但按所有权拆分交付：

- MacBook Integration Controller 先冻结 Model Pack 包合同、场景化 `AnalyticalModelRuntime` 合同和 Adapter-independent contract suite；
- Mac mini Provider 在 JuanerAI 仓库内生成真实可安装 SDK，并完成独立 Consumer 供给侧验证；
- MacBook Consumer 在 Xanthil Application/Profile 中安装和校验同一 SDK，完成本地推理、业务输出、provenance 和失败边界；
- Mac mini 不修改 Xanthil Product Core、Application、CLI 或 Profile；MacBook 不修改 MLflow/Model Pack 供给侧私有实现；
- 真实 activation 最后由 MacBook 完成。

首个假设先行分析 Change 可以与 Model Pack Provider 工作保持独立，但它不是 Xanthil 第一期的全部。Provider、Consumer、合同 enabler 和 activation 的实际数量与并行关系由 `first-parallel-changes` 冻结。

首组实际拓扑已冻结为五个 planning ID：E `CHG-model-pack-contract-enabler` 先合入；H `CHG-xanthil-hypothesis-first-analysis` 与 P `CHG-model-pack-local-provider` 跨设备并行；C `CHG-xanthil-model-pack-consumer` 在 H 后启动，可先基于 E 的 contract double 开发，但真实 SDK GREEN、最终 Validator 和合入必须等待 P；A `CHG-xanthil-model-pack-activation` 在 E/H/P/C 合入及真实 28 日验收条件满足后最后执行。P 的独立 Consumer 仍只是供给侧证据，不能跳过 C 或 A。

严格 PR 合入顺序是 E → H → P → C → A；P 即使在并行开发中先完成，也必须等待 H 集成、合并最新 main 并重跑受影响证据。

### 4.5 第一期非目标

- 不自建一套替代 MLflow 的通用模型训练、实验、Registry 或 Serving 平台；
- 不把任何外部项目仓库变成模型生产、发布或运行依赖；
- 不复用 ModelEvol 的 E-state 实现、命令、目录、Task Bus adapter 或 worker runtime；只采用已经转译进 JuanerAI 附件的产品语义；
- 不创建自动训练、自动评估、自动发布或自我进化闭环；
- 不把模型生产生命周期整体纳入 Model Pack 合同；
- 不建设 Runtime registry、自动 fallback、热切换或通用多 Runtime 平台；
- 不部署企业远程推理接口；
- 不激活 Xanthil Desktop 或 Enterprise 数据建模；Xanthil CLI/Personal 的本地消费属于一期终点；
- 不处理真实 Action 或 Outcome 自动化。

## 5. 第二期：企业服务化

### 5.1 产品目标 — Confirmed

第二期让第一期已经发布和验证的同一 Model Pack 进入企业服务侧执行，同时保持 identity、版本、输入/输出、provenance、评估与限制语义一致。

```text
Xanthil Enterprise Frontend
        -> Xanthil business API
        -> Xanthil Enterprise Backend
        -> scenario-owned Analytical Model Runtime Port
        -> MLflowServingAdapter
        -> MLflow OSS Model Serving
        -> phase-one released model
```

Frontend 不直接调用 MLflow Tracking/Registry 或 `/invocations`。MLflow OSS Model Serving 是已确认的二期服务引擎；`MLflowServingAdapter` 是 Xanthil Enterprise Backend 内部的薄 Adapter，不是另建的微服务或模型平台。精确协议映射、部署拓扑和安全配置由二期 Change 冻结，不进入 JuanerAI 业务合同。

### 5.2 第二期前置条件 — Proposed

进入第二期前至少需要：

1. 第一期 Model Pack identity、manifest、checksum 和本地执行证据稳定；
2. 一个已批准的 Xanthil Enterprise 业务场景；
3. 业务输入、输出、错误、超时、取消、幂等和 provenance 语义冻结；
4. `AnalyticalModelRuntime` 是否需要创建或场景化命名，经独立 OpenSpec Change 决定；
5. 该业务 Port 与 `MLflowServingAdapter` 的行为、错误和 provenance 合同冻结；
6. 本地与 MLflow Serving 执行是否真正满足同一完整合同，由 Adapter-independent contract suite 证明；
7. Enterprise 数据、安全、身份、网络、审计和恢复边界获得对应 Change 授权。

### 5.3 第二期产品能力 — Proposed

- Xanthil Enterprise Backend 暴露业务 API，而不是供应工具 API；
- `MLflowServingAdapter` 隔离 MLflow 请求格式、模型 URI、版本语义、技术错误和运维结构；
- Runtime identity、Runtime version、Adapter version 与 Model Pack provenance 可观察；
- 服务端验证 Model Pack identity、版本、checksum、兼容性和输入合同；
- 本地与服务路径对关键业务语义运行同一契约测试；
- 超时、取消、重试、幂等、错误映射和回滚在业务合同中明确；
- 模型结果保持“证据/建议”边界，不越权执行 Action。

### 5.4 第二期非目标

- 不预先建设独立通用 Model Serving 平台；
- 不让 Frontend 直接依赖 MLflow Tracking/Registry 或 `/invocations`；
- 不自动批准 SSO、RBAC、租户隔离、密钥、TLS、网络策略、审计、弹性、灰度和灾备实现；
- 不承诺本地与服务 Runtime 可以热切换或自动 fallback；
- 不把模型服务健康等同于 Xanthil 业务能力可用；
- 不授权自动 Decision 或 Action。

## 6. 产品与架构边界

### 6.1 Product Module 边界 — Confirmed

Model Pack 是 JuanerAI 可复用模块，不是 Xanthil 私有基础设施。包内逻辑可以位于未来获批的 `packages/model-pack-sdk/**`，但产品级合同、Runtime Port、Profile 和跨端契约测试仍由 Integration Controller 冻结。

### 6.2 Runtime 边界 — Confirmed

确定性 Model Pack 推理使用独立的业务 Runtime Port 方向，不依赖 Agent Harness，也不复用或扩大当前 Pi-backed Agent Runtime。

当前 `AnalyticalModelRuntime` 只是 ADR 方向，尚未创建。第二个生产 Runtime 必须通过独立 OpenSpec Change 冻结场景、完整合同、Runtime identity、Adapter、Profile、provenance、激活和回滚；本文不授权 Runtime registry、fallback、热切换或通用 Runtime Interface。

### 6.3 供应链边界 — Confirmed

Model Pack 属于供应链输入。未来安装必须验证来源、版本、checksum、声明权限、兼容、许可证和撤销状态。包代码不会因为被安装而自动获得文件、网络、数据或执行权限。

### 6.4 数据与决策边界 — Confirmed

- 企业数据默认 local-only；任何外发需要批准的数据流合同；
- 模型结果必须关联 Model Pack identity 和输入快照；
- prediction 不是 Decision；
- Action Recommendation 不是 Action；
- 自动 Decision 与 Action 需要单独的策略、授权、审计和恢复合同。

## 7. 成功定义

### 7.1 第一期成功 — Proposed

第一期只有同时满足以下条件才算完成：

1. 一个真实代表性模型被封装为版本化 Model Pack；
2. 该模型在 MLflow 中完成 Run、评估、Registry 固定版本、本地 load/predict 与 Serving compatibility smoke；
3. 同一候选通过 MP1–MP9，且 `candidate_accepted`、`model_locked`、`model_released` 三个决定保持分离；
4. `ModelPackBuilder` 只接受 MP9 的精确 identity、版本和 checksum，缺失或冲突时 fail closed；
5. manifest 覆盖产品定义要求的最小声明；
6. 独立 Consumer 在无训练工作区、无 MLflow 服务、无外部项目仓库连接的环境中完成安装、校验、加载和推理；
7. checksum、contract、Runtime、权限或输入不兼容时 fail closed；
8. 输出包含准确 provenance、评估限制和非 Decision 声明；
9. 正向、负向、回滚、离线和契约证据齐全；
10. Xanthil 安装并校验同一真实 SDK，通过场景化业务 Port 完成本地推理和产品输出；
11. Provider 私有实现与 Xanthil Consumer 路径保持所有权隔离，最终 Profile/activation 由 MacBook 完成；
12. 使用用户届时提供的真实用例数据完成实际测试；仅有合成数据、示例数据或 fixture 证据不能通过第一期验收；
13. 通过对应 OpenSpec、RED/GREEN、回归、独立验证、验收和归档。

### 7.2 第二期成功 — Proposed

第二期只有同时满足以下条件才算完成：

1. 复用第一期同一已发布 Model Pack，而不是创建旁路发布物；
2. Frontend 只依赖 Xanthil 业务 API；
3. `MLflowServingAdapter` 隔离 MLflow，业务合同不暴露其内部类型或 `/invocations` 结构；
4. 本地与服务执行的 identity、输入/输出、关键预测语义和 provenance 一致；
5. 企业安全、数据、超时、取消、幂等、审计和回滚边界按该期批准范围验证；
6. Provider、Consumer、Profile/activation 按依赖图串行合入并在最新 `origin/main` 完成集成验收。

## 8. 第一项 Change 前必须决定

首发场景的用户、业务问题、数据提供物、split、baseline、指标/阈值、Pack 输入输出、Consumer 行为和真实验收已由用户确认的 `attachments/model-pack-first-scenario-contract.md` 冻结。其余实施问题仍为 Pending，不能从外部仓库事实或旧调查结论自动填入：

1. 精确候选算法、训练代码与固定随机性实现；
2. MLflow 的精确版本、存储、端口、进程和环境隔离；
3. `MP1–MP9`、发布输入包和 Builder Gate 的精确文件路径、Schema、状态持久化、命令与自动化边界；高层责任、证据和失败条件已由流程附件确定；
4. Model Pack 的包格式、语言、依赖管理和安装方式；
5. manifest 的精确字段、版本规则和兼容策略；
6. 精确 allowed、conditional 和 forbidden paths；
7. focused、contract、integration、regression 和 canonical 验证命令；
8. 用户按首发数据合同提供的真实历史/验收文件，以及真实模型、依赖安装和本地 MLflow 权限；
9. 第二期的首个 Enterprise 业务场景、部署拓扑和安全边界。

在这些问题通过产品与 Spec Gate 前，不创建实现、依赖、Schema、Runtime、Profile、训练任务或服务部署。

## 9. 权威来源

本文的产品与架构合同只使用 JuanerAI 当前权威：

- `CONTEXT.md` 的 Model Pack 产品定义；
- `docs/architecture/package-contracts.md` 的包合同与治理边界；
- `docs/adr/0003-business-runtime-port-strategy.md` 的独立 Analytical Model Runtime 方向和 stop line；
- `docs/architecture/data-authority.md` 的模型结果与 provenance 规则；
- `docs/architecture/security-boundaries.md` 的供应链、企业安全和数据外发边界；
- `Orchestration.md` 的 capability-packs、共享合同和角色责任。
- 用户提供的 2026-08-23 两期方案确认记录：MLflow 一期主链路、二期 OSS Model Serving、Backend 内薄 Adapter、Frontend 不直连以及逐期开发。
- [`attachments/model-pack-release-lifecycle-gates.md`](attachments/model-pack-release-lifecycle-gates.md) 的 JuanerAI `MP1–MP9` 模型接受、锁定、发布和 Builder 输入 Gate。
- [`attachments/model-pack-first-scenario-contract.md`](attachments/model-pack-first-scenario-contract.md) 的首发 28 日品类需求预测、真实数据、评估与 Consumer 产品验收提案。

MLflow 自身的源码、能力和安装配置事实只查阅以下官方来源，不由 Agent 猜测：

- [MLflow 官方开源仓库](https://github.com/mlflow/mlflow)；
- [MLflow 官方文档](https://mlflow.org/docs/latest)；
- [MLflow Tracking 安装与配置指南](https://mlflow.org/docs/latest/ml/tracking/)。

ModelEvol E1–E9 只作为本次附件形成时的只读学习来源；未来 Agent 直接读取 JuanerAI 附件即可，不需要重新打开 ModelEvol。JuanerAI 仓库之外的项目仓库只在用户明确指示时用于只读学习。任何学习结果必须重新落为 JuanerAI 自有的产品、架构和合同；不得形成跨仓联动、运行依赖、发布 Gate、写入任务或集成计划。
