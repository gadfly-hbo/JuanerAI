# JuanerAI 共享合同及集成热区清单

> 状态：治理文档已由用户于 2026-08-23 冻结；纯文档 governance PR 待合入
> 日期：2026-08-23
> 仓库：`/Users/huangbo/JuanerAI`
> 基线：`main` = `origin/main` = `60e13514ffec01c09dc407e4271492458e9f4105`
> 边界：本文盘点当前合同、接缝与热区，并给出变更停线规则；不批准新 Port、Schema、Adapter、路径迁移、实现或产品 PR。用户只单独授权本冻结包的纯文档治理分支与 PR。

## 1. 共享合同判定规则

满足以下任一条件的 Interface 或数据边界属于共享合同，由 MacBook Integration Controller 控制：

1. 生产者与消费者属于不同设备或不同模块；
2. 数据需要跨 Run、进程或版本读写；
3. 同一 Application 能力由 CLI、Desktop、Console 或其他产品面消费；
4. Profile 组合不同所有者的实现；
5. 多个 Adapter 必须通过同一套契约测试。

共享合同不只是类型定义，还包括业务含义、粒度、身份、生命周期、调用顺序、错误、取消、超时、重试、幂等、权限、数据边界、来源、兼容、迁移、激活、回滚、不变量，以及对应的正负契约测试。

协作规则：

1. 跨端 Port、跨版本 Artifact、跨产品面 Application API 和 Profile 激活均纳入共享合同；
2. MacBook Integration Controller 持有合同文本、类型、验证器和跨端契约测试的写入权；Mac mini 实现冻结合同并返回验证/交付证据；
3. 当前三个 Local Analysis Port 保持场景专用，不提前扩展为自动化通用平台；
4. `apps/console/**` 与 `adapters/storage-local/**` 在首次双端并行写入前，必须先分配互不重叠的子路径；
5. 发现合同漂移时，依赖分支停线并提交 `docs/templates/CONTRACT_CHANGE_REQUEST.template.md`。

本文将接缝分成四类，避免把所有跨文件类型都称为同一种合同：

| 类别 | 含义 | 变更权威 |
|---|---|---|
| 显式共享合同 | Provider/Consumer、跨版本、跨 Profile 或多 Adapter 必须共同遵守的业务语义与可执行验证 | MacBook Integration Controller |
| 隐性合同 | 尚未进入 `packages/contracts/**`，但已经被 Adapter、Artifact 或其他模块直接消费的 Product Core/类型行为 | 原路径所有者实现；合同语义由 Controller 冻结 |
| Provider 私有实现 | 训练算法、特征工程、MLflow 参数/内部对象、Builder 实现细节、构建工具和未发布 Artifact | Mac mini；不得泄漏为包/Runtime 业务合同 |
| Consumer 产品路径 | Xanthil 输入准备、Application 顺序、CLI/Enterprise 体验、产品报告和消费侧 Adapter | MacBook；不得反向修改 Provider 私有实现 |

## 2. 当前共享合同地图

| ID | 合同 | 当前载体 | 所有权与消费者 | 状态 |
|---|---|---|---|---|
| SC-01 | 产品术语与数据权威 | `CONTEXT.md`、`docs/architecture/data-authority.md`、`docs/architecture/security-boundaries.md` | MacBook Controller；所有模块消费 | 全局基础合同 |
| SC-02 | Xanthil 数分助手 Application 接口 | `packages/application/local-analysis.ts` | MacBook；CLI 当前消费，Desktop 未来可能消费 | Xanthil 内部跨产品面合同 |
| SC-03 | Agent 分析 Runtime | `packages/ports/local-analysis.ts` 中的 `AgentAnalysisRuntime` | MacBook 冻结；Pi Adapter 实现；Xanthil Application 消费 | 当前主要跨端合同 |
| SC-04 | 本地分析执行 | `packages/ports/local-analysis.ts` 中的 `LocalAnalysisExecution` | MacBook 冻结；DuckDB Adapter 实现 | 当前主要跨端合同 |
| SC-05 | Run Artifact 写入与读取语义 | `packages/ports/local-analysis.ts` 中的 `RunArtifactStore`，以及 `packages/product-core/local-analysis.ts` | 生产端、Local Storage Adapter 和 Run Evidence 共同依赖 | 跨模块、跨时间合同 |
| SC-06 | Artifact `1.0` 数据与来源合同 | `packages/product-core/local-analysis.ts`、`openspec/specs/run-evidence-console/spec.md` | 生产端、存储端、Run Evidence 共同依赖 | 已存在但物理位置分散 |
| SC-07 | Run Evidence Reader | `packages/ports/run-evidence-reader.ts` | 全链路属于 MacBook 明确例外 | 合同，但不是双端合同 |
| SC-08 | Personal Profile 组合与激活 | `profiles/personal/local-analysis.ts` | MacBook Controller 独占 | 跨端实现的最终集成点 |
| SC-09 | Adapter 契约测试 | `tests/fixtures/xanthil-local-analysis/port-contracts.ts` 及对应 contract tests | MacBook 冻结；实现侧必须原样通过 | executable contract authority |

当前主要生产接缝：

```text
MacBook Xanthil Application
        |
        |-- AgentAnalysisRuntime --- Pi Adapter
        |-- LocalAnalysisExecution - DuckDB Adapter
        `-- RunArtifactStore ------- Local Storage Adapter

MacBook Personal Profile 最后选择和激活这些实现
```

这张图描述当前 JuanerAI 实现，不把具体 Adapter 的供应技术提升为产品合同。

## 3. 首个 Model Pack Provider / Consumer 合同包

用户已确认 28 日品类需求预测为 Model Pack 一期首发场景，因此原 F9/F10 触发条件已经满足。以下是规划层冻结的最小语义；精确 TypeScript、序列化 Schema、文件路径、错误码和方法名仍必须由独立 OpenSpec Change 冻结，本文本身不创建 Port 或合同文件。

| ID | 显式共享合同 | 冻结的最小语义 | Provider / Consumer |
|---|---|---|---|
| `MP-C01` | Model Pack package contract | stable identity/semantic version、Artifact checksum、JuanerAI contract version、28 日品类需求预测用途与禁止用途、闭合输入/输出、Runtime/依赖、权限、训练/评估 provenance、限制/置信度、许可证、撤销/回滚 | Mac mini 生成符合合同的 SDK；MacBook 安装并验证 |
| `MP-C02` | MP9 / `ModelPackBuilder` input contract | 只接受 MP9 精确 release；绑定 MLflow Experiment/Run/Registry version、Artifact URI/checksum/Signature、评估、权限、限制、Controller release decision；缺失或冲突 fail closed | Controller 冻结/授权；Mac mini Builder 只读消费 |
| `MP-C03` | 场景化 `AnalyticalModelRuntime` | 业务输入预检、Pack/runtime/Adapter identity、确认后的输入 snapshot、一次 28 日本地预测、取消/deadline、确定性、输出验证、稳定业务失败、provenance；一个 Run 绑定一个 Runtime，不得切换 | MacBook Consumer Adapter 实现；未来 Serving Adapter 只有完整同语义时才可复用 |
| `MP-C04` | Adapter-independent contract suites | package/SDK suite 与 Runtime suite 分离；覆盖正向预测、checksum/contract/runtime/permission/revocation/input/output 负例、无网络/训练路径依赖、取消/deadline、确定性、provenance | Controller 写入并冻结；Provider/Consumer 实现原样通过 |
| `MP-C05` | Profile / activation contract | Profile 选择一个精确 Pack、Runtime Adapter 和版本；无 registry、fallback、热切换或自动路由；activation 最后且 rollback 保留用户证据 | MacBook Integration Controller 独占 |

`MP-C01` 的首发业务输入是截止 `as_of_date` 至少连续 56 日的每日 `product_category` 聚合历史与 currency；输出是未来 28 日每个 category 的 `predicted_order_count`、`predicted_net_order_amount` 及两项目标的 80% interval。训练/最终验收使用的 196 日 history、隔离 28 日 actuals、seasonal-naive baseline、WAPE 5%/10%、key-category 5 个百分点回退上限和 interval Gate 属于产品验收合同，但训练数据本身、实际 MLflow 对象和算法不是 SDK 运行时合同。

### 3.1 可执行合同层次

1. **Package contract suite**：对发布 SDK 和独立 Consumer 证明 manifest/Artifact/Signature/checksum、安装、离线 load/predict、权限与撤销语义；不连接 MLflow 或训练工作区。
2. **Runtime contract suite**：同一套 Adapter-independent 行为驱动运行于确定性 double 与 Xanthil 本地 Consumer Adapter；二期 `MLflowServingAdapter` 只有在完整行为、失败、取消、provenance 与安全语义一致时才加入。
3. **Xanthil product integration/E2E**：验证 Application/CLI、用户确认、真实 SDK、输入快照、产品输出、失败展示与 Profile；它不是 Provider package contract。
4. **真实 acceptance**：在 MP8 锁定、MP9 SDK、C 合入和 A 运行授权全部满足后，才按首发附件打开 Controller 保管的 28 日 actuals 验证同一 Pack；Provider 永远不可读，独立 Consumer PASS、fixture 或 synthetic evidence 均不能替代。

### 3.2 不得进入共享合同的 Provider 细节

- 具体算法、特征工程代码、超参数、训练 Worker 或内部模块名；
- MLflow 请求对象、Tracking/Registry API、内部 URI/alias、服务技术错误；
- 训练工作区绝对路径、缓存、数据库、未发布 Artifact 和机器环境；
- `ModelPackBuilder` 的内部文件布局、临时文件和构建步骤；
- ModelEvol 或任何外部项目仓库的 E-state、命令、路径或运行状态。

### 3.3 Consumer 产品路径不反向成为 Provider 合同

Xanthil 的模式选择、确认 UI、Application sequencing、报告/Artifact 展示、Run Evidence 和 Enterprise 业务 API 属于 Consumer 产品行为。只有跨 Provider/Consumer 所需的输入、输出、identity、错误、provenance、权限与兼容语义进入共享合同；CLI 文案、TUI、Xanthil 内部路径和 `MLflowServingAdapter` 技术映射不得写进 SDK package contract。

## 4. 当前合同状态与漂移

### 4.1 合同索引未反映当前事实

`docs/contracts/README.md` 仍描述冷启动阶段没有冻结产品合同，`packages/contracts/**` 当前也为空；但 Local Analysis `1.0`、Artifact `1.0`、Run Evidence 和三个 Local Analysis Port 已经存在。

这是合同索引状态漂移。本文只记录问题，不批准当前修改。

### 4.2 Product Core 已成为隐性跨端合同

Pi、DuckDB 和 Local Storage Adapters 不仅依赖 Port，也直接引用 `packages/product-core/local-analysis.ts` 中的 `AnalysisProposal`、`Finding`、`SourceDescriptor`、`ArtifactDescriptor`、`RunManifest` 等导出。

这些导出虽然尚未进入 `packages/contracts/**`，也不能被当作 MacBook 私有内部类型自由修改。改变被 Adapter 或 Artifact 消费者依赖的结构或行为时，必须按共享合同变更处理。

### 4.3 当前 Runtime Port 不自动扩大

`AgentAnalysisRuntime` 继续服务当前数分场景。假设先行、深度研究和自主探索应先定义各自产品行为；只有完整的行为、生命周期、顺序、错误、取消、工具、来源与安全语义一致时，才能原样复用现有 Port。

不得为了三种自动化模式预建 `UniversalAgentRuntime`、Runtime 注册表、自动 fallback、热切换或宽泛的通用工具接口。

确定性 Model Pack 推理的首发场景已经触发独立 `AnalyticalModelRuntime` 的规划需要，最小语义见 `MP-C03`。它不是现有 Agent Runtime 的扩展；本文仍不批准创建该 Port、Adapter、Profile 或 executable contract。

### 4.4 根构建与验证入口是集成状态热区

根 `tsconfig.json` 使用显式文件清单，任何新增源码或测试都可能触碰同一个配置。`tools/harness/validation/run` 当前固定执行数分助手和 project-board 测试；Run Evidence 文件进入类型检查，但其测试目录没有直接进入默认 runner。

本文不把该现状直接判定为产品缺陷。以后每个 Change 必须明确 focused validation 与 canonical matrix 的边界，并由 MacBook Controller 处理共享验证入口。

## 5. 集成热区清单

### 5.1 P0：MacBook Integration Controller 独占

| 热区 | 原因 |
|---|---|
| `packages/ports/**`、`packages/contracts/**`、`docs/contracts/**` | 共享 Interface 和版本化合同 |
| Model Pack package/Builder-input/Runtime contract suites | Provider 与 Consumer 的 executable authority |
| `CONTEXT.md`、`docs/architecture/**`、`docs/adr/**` | 术语、数据权威和架构边界 |
| `openspec/**` | Requirements、Design、Tasks 和 Gate |
| `profiles/**` | Adapter 选择及能力激活 |
| `.juanerai/project-control/**` | 唯一项目状态写入端 |
| 根 `package.json`、lockfile、`tsconfig.json` | 双端依赖与构建图 |
| `tools/harness/**`、`.github/**` | 默认验证及集成门禁 |
| 跨 Xanthil 与共享能力的集成测试 | 跨泳道验收权 |

### 5.2 P1：当前跨端代码接缝

- `packages/ports/local-analysis.ts`；
- `packages/product-core/local-analysis.ts` 中被 Adapters 或 Artifact 消费者引用的导出；
- `adapters/agent-pi/local-analysis.ts`；
- `adapters/analytics-duckdb/local-analysis.ts`；
- `adapters/storage-local/local-analysis.ts`；
- `profiles/personal/local-analysis.ts`；
- `tests/fixtures/xanthil-local-analysis/port-contracts.ts` 及对应 contract tests。

写入规则：

- 当前三个 `local-analysis` Adapter 是 Xanthil 纵切的 MacBook 例外；首个假设先行 Change 必须演进这条当前路径，不能由 Mac mini 另建旁路；
- MacBook Xanthil 实现分支可修改获批的当前 Adapter delta，但 `packages/ports/**`、共享验证器、跨端契约测试和 Profile 仍由 Controller 冻结；
- Mac mini 只修改其获批的共享/Provider/非 Xanthil Adapter 私有实现，不通过顺手修改类型、验证器或测试来解决合同不匹配；
- 共享合同未重新冻结前，依赖分支不得继续扩大实现。

计划中的 Model Pack P1 接缝：

| 路径或逻辑范围 | 类别 | 所有权/风险 |
|---|---|---|
| `packages/contracts/**`、`packages/ports/**`、`docs/contracts/**` 中未来获批的 `MP-C01..05` | 显式共享合同 | Controller；Provider/Consumer 开始前最先冻结 |
| `packages/model-pack-sdk/**` 与未来 Provider 私有训练/Builder/独立 Consumer 子路径 | Provider 私有实现 | Mac mini；不得写 Xanthil/Profiles 或改变共享 suite |
| Xanthil data-modeling Product Core/Application/CLI 与本地 Consumer Adapter | Consumer 产品路径 | MacBook；不得依赖 MLflow/训练路径或改 Provider 内部实现 |
| `profiles/**`、根依赖/lockfile/`tsconfig.json`、canonical runner | 集成状态 | Controller；分离 dependency enabler 与最终 activation，避免过早启用 |
| package/runtime contract suites 与跨泳道 integration | executable shared contract | Controller；与 Provider 私有测试、Xanthil E2E 分离 |

### 5.3 P1：混合所有权目录

| 目录 | 风险 |
|---|---|
| `apps/console/**` | Run Evidence 归 MacBook，JuanerAI 通用控制台归 Mac mini |
| `adapters/agent-pi/**` | 当前 Xanthil `local-analysis.ts` 归 MacBook；未来非 Xanthil Adapter 默认归 Mac mini |
| `adapters/analytics-duckdb/**` | 当前 Xanthil `local-analysis.ts` 归 MacBook；未来共享分析 Adapter 默认归 Mac mini |
| `adapters/storage-local/**` | 当前 Xanthil local-analysis 与 Run Evidence 归 MacBook；其他存储 Adapter 默认归 Mac mini |
| `tests/fixtures/**` | 跨端合同、Run Evidence、Xanthil 场景、Provider 私有 fixture 可能汇集；必须用非重叠子路径区分 authority |

并行前必须分配互不重叠的子路径。目录拆分属于以后获批的结构或产品 Change；本文不批准立即迁移。

### 5.4 P2：外部仓库只读学习

JuanerAI 项目仓库之外的仓库只在用户明确指示时作为只读学习来源，不是 Provider、Consumer、共同开发区、发布权威或集成目标。每项被采用的学习结论必须记录：

- source SHA 和原始路径；
- 学到的设计思想及其适用边界；
- 相关依赖、隐藏 fallback、fixture、许可证和来源风险；
- 在 JuanerAI 中重新表述后的产品需求、架构决定、合同和目标路径所有者；
- 独立重写、暂不采用或需要进一步研究的结论。

不得向外部仓库写入、创建分支或 PR，也不得让 JuanerAI 的构建、运行、验证、发布或 Change 依赖外部仓库路径。只读学习不继承来源仓库的产品定义、生命周期名称、架构、数据边界、Runtime 假设、路径所有权或发布权威。

## 6. 未来候选共享合同

以下只是场景触发后的候选，不代表已经批准创建 Port、Schema、Adapter 或 OpenSpec Change：

| 优先级 | 候选合同 | 触发条件 |
|---|---|---|
| F1 | Governed Analytical Data Access | 数分助手开始读取固定 fixture 之外的数据 |
| F2 | Automation Run State / Lifecycle | 自动化需要持久化、恢复、暂停、取消或调度 |
| F3 | Scenario-owned Agent Runtime | 新 Agent 场景证明现有 Runtime 的完整语义不足 |
| F4 | Ontology Access | 分析需要治理后的实体、指标、关系和约束 |
| F5 | Knowledge Access | 深度研究需要有来源、版本和置信度的事实 |
| F6 | Memory Access | 自动化需要保留用户、Session 或 Workflow 上下文 |
| F7 | Goal State Persistence | 目标管理需要共享持久化能力 |
| F8 | Console Read/Control Contract | 通用控制台需要读取或控制共享模块状态 |

F9 Model Pack Package Contract 与 F10 Analytical Model Runtime 已因获批首发场景移至 §3 的 `MP-C01..05`；这只冻结规划语义，不代表 executable contract 已创建。其余候选合同必须由真实业务场景提出最小需要。不得提前为四库一台创建通用 CRUD Port，不得预建通用 Runtime 平台，也不得因为某个实现使用特定工具就把其 API 提升为 JuanerAI 共享合同。

## 7. 第一组并行 Change 的当前结论

以下五个 planning ID 冻结首组实际拓扑；它们不是已创建的 OpenSpec 目录，也不授权分支或实现：

| 顺序节点 | Planning Change ID | Owner | 产品终点 | 硬依赖 |
|---|---|---|---|---|
| E | `CHG-model-pack-contract-enabler` | MacBook Integration Controller | 将 `MP-C01..05` 落为最小关闭合同、contract suites、package/build namespace 与必要共享依赖；不激活产品 | 两份产品方案 Reviewer PASS；用户已确认首发场景 |
| H | `CHG-xanthil-hypothesis-first-analysis` | MacBook Xanthil | 在当前 `local-analysis` 上交付两合成场景的 A1–A5 假设先行闭环 | Xanthil 方案 PASS；产品上不依赖 Model Pack；为避免 MacBook/root 热区并写，在 E 合入后的基线上启动 |
| P | `CHG-model-pack-local-provider` | Mac mini Provider | 本地 MLflow MP1–MP9、真实 SDK、Builder Gate 与独立 Consumer 供给侧证据 | E 已合入；MP1/MP2、真实 history 数据、依赖/本地 MLflow/训练与推理授权到位 |
| C | `CHG-xanthil-model-pack-consumer` | MacBook Xanthil | 关闭状态下安装真实 SDK，经本地 `AnalyticalModelRuntime` 形成 Xanthil 数据建模行为与产品输出；不改 Profile 激活 | E、H 已合入；可在 P 运行时用冻结 double 开发，但最终 GREEN/Validator/合入依赖 P 的 MP9 SDK 与 Provider PR 已合入 |
| A | `CHG-xanthil-model-pack-activation` | MacBook Integration Controller | 绑定精确 Pack/Runtime/Profile，启用数据建模入口，完成真实 28 日 actuals 产品验收和 rollback 证据 | E、H、P、C 均已合入；精确 Pack、Consumer Head、用户数据/实际推理授权、独立验证全部满足 |

并行图：

```text
E merged
  |-- H (MacBook) --------------------|
  `-- P (Mac mini) -----------|        |
                              |        v
                              `-----> C (MacBook, may start on doubles after H)
                                          |
                                          v
                                     A (MacBook, last)
```

H 与 P 是唯一首波真正跨设备并行的行为 Change。C 与仍在进行的 P 可以有有界开发重叠，但 C 的真实 SDK 证据、最终 Head、Validator 和合入都等待 P；H 与 C 不在 MacBook 上并行写重叠的 Xanthil/root 热区。A 永远最后。

严格集成顺序由双端协议冻结为 E → H → P → C → A；开发并行不等于并行合入，也不允许先完成的 P 绕过 H。

### 7.1 规划级路径边界

| Change | Allowed | Conditional / Controller-only | Forbidden |
|---|---|---|---|
| E | 未来获批的 `packages/contracts/**`、`packages/ports/**`、`docs/contracts/**`、共享 contract test/fixture 子路径 | 根依赖/lockfile/`tsconfig.json`/canonical runner、关闭的 package namespace | Provider 训练/Builder 私有实现、Xanthil Product Core/Application/CLI、active Profile |
| H | 当前 Xanthil Core/Application/CLI、三个 `local-analysis` Adapter 例外、场景 fixture 与 Xanthil tests | 现有 Port/Profile/root 配置仅在已批准兼容 delta 下 | Model Pack Provider/Consumer 新路径、外部仓库、真实数据/未授权 Provider call |
| P | `packages/model-pack-sdk/**` 与获批 Provider/Builder/独立 Consumer 私有子路径及私有测试 | 只有 E 未能预见且经 Contract Change Request 重新冻结的共享依赖 | Xanthil Core/Application/CLI/consumer Adapter、`packages/ports/**`、`packages/contracts/**`、`profiles/**`、project-control |
| C | Xanthil data-modeling Core/Application、本地 Consumer Adapter、consumer tests/fixtures | CLI/共享 build graph 仅按 E 冻结结果；真实 SDK identity 由 P 提供 | Provider 私有实现、共享合同、active Profile、外部仓库 |
| A | 精确 Profile/CLI activation、跨泳道 integration/E2E、rollback 与验收记录 | 根 runner/build graph 仅在冻结激活设计内 | 改写 Provider、Consumer 业务行为、合同阈值、真实数据合同或历史证据 |

任何需要扩大上述边界的发现都返回 Controller；不通过在 P/C/A 中顺手修改合同、Schema、阈值或所有权来救场。
