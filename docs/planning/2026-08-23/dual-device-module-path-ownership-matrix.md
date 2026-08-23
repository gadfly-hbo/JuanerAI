# JuanerAI 双端模块与路径所有权矩阵

> 状态：治理文档已由用户于 2026-08-23 冻结；纯文档 governance PR 待合入
> 日期：2026-08-23
> 仓库：`/Users/huangbo/JuanerAI`
> 基线：`main` = `origin/main` = `60e13514ffec01c09dc407e4271492458e9f4105`
> 边界：本文只回答模块与路径默认由哪一端写入；不冻结共享合同，不批准路径迁移、产品 Change、Schema、实现、产品分支或产品 PR。用户只单独授权本冻结包的纯文档治理分支与 PR。

## 1. 所有权模型

JuanerAI 采用“两条开发泳道 + 一个集成权”的双端协作方式：

| 泳道 | 默认设备 | 责任 |
|---|---|---|
| Xanthil 产品泳道 | MacBook | Xanthil 产品行为、Product Core、Application，以及 CLI、Desktop 和未来 Enterprise 产品体验 |
| JuanerAI 共享能力泳道 | Mac mini | 四库一台、Model Pack Provider/SDK 与包内逻辑、共享能力、非 Xanthil 专属的具体基础设施 Adapters 及其他中后台模块 |
| Integration Controller | MacBook | 产品术语、架构、共享 Interface、OpenSpec Gate、project-control、Profile 组合、集成验收和用户沟通 |

设备是默认执行地，不是不可转移的架构所有者。模块所有权保持稳定；确需跨设备接手时，按正式 Git handoff 转移分支写入权。

设备所有权不替代 `Orchestration.md` 中的 domain 边界，也不替代 Spec、Test、Worker、Validator 的角色隔离和生命周期 Gate。具体 Change 仍以获批的 allowed、conditional 和 forbidden paths 为准。

本文区分三种所有权：模块实现所有权决定哪一端默认修改模块私有实现；合同与决定所有权决定谁能冻结共享业务语义、接受候选、锁定/发布或激活；分支写入权决定某次获批 Change 中唯一实际写分支的设备。

Mac mini 负责 Model Pack Provider 实现，不取得共享包合同、`AnalyticalModelRuntime`、MP7–MP9 决定或 Xanthil activation 权威。MacBook 负责 Xanthil Consumer，不取得 Provider 包内训练/构建实现所有权。

本矩阵的唯一仓库范围是 `/Users/huangbo/JuanerAI`。其他仓库没有本计划的模块所有者、allowed path、分支、PR、Provider/Consumer 身份或发布 Gate；只有用户再次明确指示时才可作为只读学习来源。

## 2. 模块所有权矩阵

| 模块或能力 | MacBook | Mac mini | Integration Controller 说明 |
|---|---|---|---|
| Xanthil 目标管理、数分助手、自动化 | 产品行为、Core、Application、体验 | 只实现已冻结合同要求的共享能力或 Adapter | 产品术语、跨端 Interface 与最终验收由 MacBook 控制 |
| Xanthil CLI、Desktop、Enterprise 产品面 | 主责 | 不直接修改产品体验 | Enterprise 精确结构需后续 Structure Gate |
| 数据库、记忆库、知识库、本体库 | 消费侧产品行为 | 共享能力与基础设施实现 | 不因同一基础设施产品而合并四种业务合同 |
| JuanerAI 通用控制台 | Run Evidence 例外和 Xanthil 专属体验 | 通用控制台能力 | 混合目录在并行前拆成不重叠子路径 |
| Model Pack | Xanthil Consumer、数据建模体验、本地/Enterprise 消费侧 Adapter | Model Pack Provider、SDK、`ModelPackBuilder` 私有实现、训练/评估/打包与独立 Consumer | 包合同、场景化 `AnalyticalModelRuntime`、MP1/2/5/7/8/9 决定、发布授权与最终 activation 由 Controller 持有 |
| Domain Pack | Xanthil 消费体验 | Domain Pack SDK 与包内逻辑 | 产品级合同仍由 Controller 冻结 |
| 具体基础设施 Adapter | Xanthil 纵切专属 Adapter 例外，包括当前 `local-analysis`、Run Evidence、未来 Model Pack Consumer/Serving Adapter | 共享/Provider/非 Xanthil 专属 Adapter 默认主责 | Adapter 不拥有业务合同；例外必须列出精确文件 |
| Profile、共享合同、架构与 OpenSpec | Integration Controller 独占 | 只读消费冻结结果 | 发现漂移时提交 Contract Change Request |
| Run Evidence | 全链路主责 | 不负责产品能力，可返回本端验证/交付证据 | 产品 Run Evidence 与开发验证证据不得混称 |

## 3. MacBook 默认路径所有权

### 3.1 Xanthil 产品路径

| 范围 | 当前或目标路径 |
|---|---|
| Xanthil CLI | `apps/cli/**` |
| Xanthil Desktop | `apps/desktop/**` |
| Xanthil Enterprise 产品面 | `apps/enterprise/xanthil/**`，精确结构待后续 Structure Gate |
| 目标管理 Product Core | `packages/product-core/xanthil/goal-management/**` |
| 数分助手 Product Core | `packages/product-core/xanthil/analysis-assistant/**` |
| 自动化 Product Core | `packages/product-core/xanthil/automation/**` |
| Xanthil Application | `packages/application/xanthil/**` |
| Xanthil 产品测试 | `tests/unit/xanthil-*/**`、`tests/e2e/xanthil-*/**`、`tests/fixtures/xanthil-*/**` |
| Xanthil 示例 | `examples/xanthil-*/**` |

当前扁平路径在结构 Change 前继续归 MacBook：

- `apps/cli/xanthil.ts`；
- `packages/product-core/local-analysis.ts`；
- `packages/application/local-analysis.ts`；
- `tests/**/xanthil-local-analysis/**`；
- `examples/member-analysis/**`。

目标路径只是所有权标识。任何目录创建、文件迁移或根构建图修改仍需要获批 Change。

### 3.2 Xanthil 纵切 Adapter 例外

为保证“演进当前 `local-analysis`，不另建旁路核心”和第一组 MacBook Xanthil Change 的端到端所有权，以下当前实现属于 MacBook Xanthil 纵切例外，不按“具体 Adapter 默认归 Mac mini”处理：

- `adapters/agent-pi/local-analysis.ts`；
- `adapters/analytics-duckdb/local-analysis.ts`；
- `adapters/storage-local/local-analysis.ts`；
- 这些实现对应的 Xanthil unit/contract/integration/E2E/fixture 路径。

这不转移业务合同：`packages/ports/local-analysis.ts`、跨 Adapter contract driver、Profile 与共享 provenance 仍由 Integration Controller 冻结。第一项假设先行 Change 若保持上述 Adapter 不变，应把它们列为 forbidden 并只跑回归；若确需修改，仍在同一个 MacBook-owned Change 中声明精确 delta、兼容和测试，不另开 Mac mini 旁路实现。

### 3.3 Run Evidence 明确例外

Run Evidence 全链路归 MacBook，优先于“通用控制台或具体 Adapter 默认归 Mac mini”的一般规则。

当前相关路径包括：

- `packages/product-core/run-evidence.ts`；
- `packages/application/run-evidence-query.ts`；
- `packages/ports/run-evidence-reader.ts`；
- `adapters/storage-local/run-evidence-reader.ts`；
- `tests/**/run-evidence-console/**`；
- 当前只承载 Run Evidence 的 `apps/console/xanthil-console.ts`；
- 相关 Profile。

未来新增的 JuanerAI 通用 Console 能力仍归 Mac mini；Run Evidence 不因此转回 Mac mini。

### 3.4 Model Pack Consumer 与 Enterprise Adapter 例外

以下未来目标属于 Xanthil 产品消费侧，因此由 MacBook 持有；路径只表示所有权，不批准创建：

- `packages/product-core/xanthil/data-modeling/**`；
- `packages/application/xanthil/data-modeling/**`；
- Xanthil CLI/Personal Consumer 对应路径；
- 包装真实已安装 SDK、实现场景化 `AnalyticalModelRuntime` 的本地 Consumer Adapter；
- `apps/enterprise/xanthil/**` 内未来获批的业务 API 与内部 `MLflowServingAdapter`；
- `tests/**/xanthil-model-pack-consumer/**` 与 `tests/**/xanthil-enterprise-model-runtime/**`；
- 最终 Profile/activation 变更。

Frontend 永不直连 MLflow；`MLflowServingAdapter` 虽使用 MLflow OSS Serving，仍是 Xanthil Enterprise Backend 的消费侧薄 Adapter，不属于 Mac mini Provider 私有实现。

## 4. Mac mini 默认路径所有权

| 范围 | 当前或建议目标路径 |
|---|---|
| JuanerAI 通用控制台 | `apps/console/**`，排除 Run Evidence |
| 数据能力 | `packages/product-core/data/**`、`packages/application/data/**` |
| 记忆 | `packages/product-core/memory/**`、`packages/application/memory/**` |
| 知识 | `packages/product-core/knowledge/**`、`packages/application/knowledge/**` |
| 本体 | `packages/product-core/ontology/**`、`packages/application/ontology/**` |
| 控制面 | `packages/product-core/control/**`、`packages/application/control/**` |
| Domain Pack SDK | `packages/domain-pack-sdk/**` |
| Model Pack SDK | `packages/model-pack-sdk/**` |
| Model Pack Provider 私有实现 | 未来获批的训练、MLflow 记录、`ModelPackBuilder`、包构建与独立 Consumer 子路径；精确目录待 Structure/OpenSpec Gate |
| Pi/Agent Runtime Adapter | `adapters/agent-pi/**`，排除当前 Xanthil `local-analysis.ts` |
| 分析数据 Adapter | `adapters/analytics-duckdb/**`，排除当前 Xanthil `local-analysis.ts` |
| 运行状态 Adapter | `adapters/state-sqlite/**` |
| 语义能力 Adapter | `adapters/semantic-semantica/**` |
| 本地存储 Adapter | `adapters/storage-local/**`，排除当前 Xanthil `local-analysis.ts` 与 Run Evidence |
| LLM Adapter | `adapters/llm/**` |
| 共享模块私有测试 | 与 data、memory、knowledge、ontology、control、capability-packs、console 等模块对应且不改变跨端合同的测试 |

这些目标路径不代表目录或包已经获批创建。第一项真实行为 Change 必须在 Structure/Spec Gate 冻结精确路径。

Model Pack 一期中，Mac mini 只在用户批准的 Change、数据和依赖边界内执行 MP3/MP4、Provider 实现、SDK 构建与独立 Consumer 验证。MLflow 数据库、进程、缓存、训练数据和未发布 Artifact 是设备本地运行状态，不因 Provider 所有权自动进入 Git。MP1/MP2、MP5、MP7、MP8、MP9 的决定由 MacBook Integration Controller 作出；如这些决定需要持久化，必须在 Change 前把 Controller 写入路径与 Provider 证据路径拆成互不重叠子路径。

## 5. MacBook Integration Controller 独占路径

以下范围由 MacBook Integration Controller 持有，Mac mini 普通模块 Change 不直接修改：

- `CONTEXT.md`；
- `AGENTS.md`；
- `Orchestration.md`；
- `docs/architecture/**`；
- `docs/adr/**`；
- `docs/governance/**`；
- `openspec/**`；
- `packages/ports/**` 中新增、删除或改变跨模块行为的 Interface；
- `packages/contracts/**`；
- `docs/contracts/**`；
- Model Pack 包合同、manifest/Builder 输入合同、场景化 `AnalyticalModelRuntime` 与 Adapter-independent contract suite；
- MP1/MP2 范围与分派、MP5 审查、MP7 接受、MP8 锁定、MP9 发布授权；
- `profiles/**`；
- `.juanerai/project-control/**`；
- `.codex/**`；
- `.agents/**`；
- `.ai-coding/**`；
- 根依赖、lockfile、构建和 TypeScript 配置；
- `.github/**`；
- `tools/harness/**`；
- 同时覆盖 Xanthil 与共享能力的跨泳道集成测试。

Mac mini 如发现必须改变共享 Interface、术语、架构、Profile 或其他独占路径，停止依赖实现并向 MacBook Integration Controller 提交 Contract Change Request。

## 6. 混合所有权目录

以下目录当前包含不同所有者内容，在真正并行写入前必须由 Controller 分配互不重叠的子路径：

| 目录 | MacBook 内容 | Mac mini 内容 |
|---|---|---|
| `apps/console/**` | Run Evidence 与 Xanthil 专属体验 | JuanerAI 通用控制台 |
| `adapters/agent-pi/**` | 当前 Xanthil `local-analysis.ts` | 未来非 Xanthil 专属 Pi Adapter |
| `adapters/analytics-duckdb/**` | 当前 Xanthil `local-analysis.ts` | 未来共享分析数据 Adapter |
| `adapters/storage-local/**` | 当前 Xanthil `local-analysis.ts` 与 Run Evidence Reader | 其他本地存储 Adapter |
| `tests/fixtures/**` | 跨端合同、Run Evidence、Xanthil 分析与 Model Pack Consumer 验收夹具 | Provider/共享模块私有夹具，且不得改变冻结合同 |

目录拆分必须属于以后获批的结构或产品 Change；本文不批准立即迁移。

## 7. Provider / Consumer / activation 冲突检查

| 接缝 | Provider / Mac mini | Consumer / MacBook | Integration Controller / MacBook |
|---|---|---|---|
| 首发模型与 MP1–MP9 | MP3 训练评估、MP4 证据移交、MP6 有界返修 | 不修改训练候选 | 冻结 MP1/MP2；决定 MP5/MP7/MP8/MP9 |
| Model Pack 包合同 | 只读消费并实现 | 只读消费并验证安装 | 冻结 identity/version/checksum/manifest/input/output/permission/rollback 与 contract suite |
| `ModelPackBuilder` | 实现 Builder 私有逻辑，只接受 MP9 输入 | 不修改 Builder | 冻结 Builder 输入合同并授权精确 MP9 release |
| SDK 与独立 Consumer | 生成真实 SDK，完成供给侧离线正负验收 | 不把独立 Consumer PASS 当产品验收 | 验收交付证据与精确 Pack identity |
| 本地 `AnalyticalModelRuntime` | 不修改 Xanthil Consumer Adapter | 实现 Xanthil 场景化本地 Adapter 与产品输出 | 冻结 Port、provenance、contract suite、Profile 与 rollback |
| 二期 Serving | 供应已发布 Pack；非 Xanthil 私有服务运维实现仍需未来任务 | Enterprise Backend 内实现薄 `MLflowServingAdapter`；Frontend 只调业务 API | 冻结 Enterprise 业务合同、Profile、激活与集成验收 |
| activation | 不修改 `profiles/**` 或声明产品已启用 | 提交消费侧候选，不自行越过 Gate | 最后合入 Profile/activation，并在 `origin/main` 做真实验收 |

冲突检查结论：Provider 不拥有 Consumer 产品路径；Consumer 不拥有 Provider 私有实现；两端均不拥有共享合同或自行 activation。MP9、SDK、独立 Consumer、Xanthil Consumer 和 activation 是不同终点，不得合并声明。

### 7.1 首组 Change 的设备归属

| Planning Change ID | 唯一默认写入端 | 所有权说明 |
|---|---|---|
| `CHG-model-pack-contract-enabler` | MacBook Integration Controller | 先冻结 `MP-C01..05`、共享 suites、package namespace 与必要 shared build/dependency seam |
| `CHG-xanthil-hypothesis-first-analysis` | MacBook | 演进当前 Xanthil Core/Application/CLI 与获批的三个 `local-analysis` Adapter 例外 |
| `CHG-model-pack-local-provider` | Mac mini | 只写 Provider/SDK/Builder/独立 Consumer 私有路径；返回 MP3/4/6 证据，不写 Controller 状态 |
| `CHG-xanthil-model-pack-consumer` | MacBook | 只写 Xanthil data-modeling Consumer 路径；保持 Profile 关闭 |
| `CHG-xanthil-model-pack-activation` | MacBook Integration Controller | 最后写 Profile/CLI activation、跨端验收和 rollback；不得顺手改 P/C 合同或实现 |

H 与 P 可在 E 合入后跨设备并行；C 只在 H 的 MacBook 热区完成后启动，并可用冻结 double 与仍在进行的 P 有界重叠；A 等待 E/H/P/C 全部合入和真实验收条件。

## 8. 新增模块判定规则

未来新增模块按以下顺序判定：

1. 属于 Xanthil 产品行为、用户体验或 Run Evidence：归 MacBook；
2. 属于 JuanerAI 共享能力、Capability Pack 包内逻辑、中后台或具体基础设施：归 Mac mini；
3. 涉及术语、架构、跨模块 Interface、Profile、OpenSpec、project-control 或集成权威：归 MacBook Integration Controller；
4. 无法明确归属或跨越两条泳道：先由 Integration Controller 拆分，不允许双端直接共同修改；
5. 出现新的明确例外时，由用户确认后补充到矩阵。

## 9. 本文未批准

- 第一组具体 Change、Change ID、分支或 PR；
- 现有扁平路径向目标目录迁移；
- 新 Port、版本化合同、持久化结构或 Runtime；
- Model Pack 已确认使用本地 MLflow OSS 和 28 日品类需求预测首发场景；但精确算法、依赖/版本、训练与证据路径、Schema、包格式、服务部署和实现仍未批准；
- 四库一台的完整产品范围；
- Enterprise 身份、租户、权限、策略、审计、部署和恢复能力；
- OpenSpec、测试、代码、依赖安装或真实模型调用。
