# Xanthil TypeScript 零行为迁移复盘

- 日期：2026-08-22
- Change：`CHG-xanthil-typescript-migration`
- Change 类型：R2 boundary change
- 目标：将已闭合的 Xanthil local-analysis 21 文件图从 `.mjs` 一对一迁移到原生 TypeScript，不改变可观察行为
- 结果：Validator 004 PASS，Controller ACCEPTED，当前规范已发布，Change 已归档
- 实现提交：`1b8ea673706883d838716be390ea7e4d6418974e`
- 回滚基线：`a0ab053`
- 当前行为规范：`openspec/specs/local-analysis/spec.md`
- 完整证据：`openspec/changes/archive/2026-08-22-xanthil-typescript-migration/verification.md`
- 归档内 Gate 复盘：`openspec/changes/archive/2026-08-22-xanthil-typescript-migration/retrospective.md`

## 结论

迁移最终实现了严格 `NodeNext`、`noEmit`、21/21 原生 TypeScript、零严格诊断和完整离线回归，同时保持运行时包名、公共命名空间、CSV、测试身份及产品行为不变。它证明了当前架构能够承接严格 TypeScript，但过程也暴露出一个关键认识：**零行为变化不等于零设计工作**。JavaScript 允许隐含的类型关系、测试替身和第三方声明边界，在严格 TypeScript 下必须有明确所有者。

主要返工并非生产行为复杂，而是迁移前没有同时冻结以下五件事：跨层类型所有权、测试侧静态边界、声明包与运行时包的解析语义、唯一环境入口，以及与诊断拓扑匹配的 Worker 路由。后续迁移应把这些内容放入 Explore、Spec 和 Test Design 前置检查，而不是等严格编译或 Validator 逐轮发现。

独立 Validator 的三轮 FAIL 属于值得保留的质量摩擦；相同缺陷若再次只能由 Validator 发现，则属于可避免的流程失败。目标不是减少 Validator 的严格性，而是让 Test Design 在第一次 evidence freeze 前具备同等级的静态证据。

## 最终成果

- 8 个生产文件和 13 个测试/helper 文件完成一对一 `.mjs` 到 `.ts` 迁移；旧扩展名、构建产物、运行时 loader 和双模式均未保留。
- 冻结 TypeScript `5.9.3`、`@types/node` `22.19.19`、严格 `NodeNext`、`noEmit`，未引入 JavaScript bridge 或额外构建阶段。
- 5 项 Requirement、19 项 Acceptance Criteria 由 Validator 004 独立 PASS。
- 严格类型检查零诊断；Unit `250`、Contract `198`、Integration `243`、E2E `131` PASS，另有恰好 1 个真实 Pi 门控 skip。
- TypeChecker 审计覆盖 471 个测试到生产 seam 调用、405 个参数，`TypeFlags.Any` 为零。
- 44 个 checked helper 调用全部收敛到语义上确属 malformed operational input 的场景。
- Pi SDK 类型问题被限制在 Pi Adapter 内；没有 SDK 类型泄漏到 Product Core、Application、Port、Profile 或 CLI。
- 未调用真实 Pi、provider 或模型，未访问外部数据，未发生 schema 或数据迁移。

## 成本事实

- Spec Gate 后发生 1 次类型所有权 Correction 001。
- Test Design 共发生 6 次 correction。
- Worker 发生 1 次规则内模型路由升级和 1 次有界生产类型修正。
- 独立 Validator 连续 3 轮 FAIL，Validator 004 最终 PASS。
- 严格测试迁移首次产生 1,174 行诊断输出；首轮 Worker 后仍有 607 条跨 8 个生产模块及 Pi 传递声明的严格诊断。
- 发生 1 次由非 canonical PATH 导致的 npm 版本环境假失败。
- 归档后额外发现一次 verification 顶部 current verdict 落后于终态，回移、修正并重新归档后才形成一致 read model。

这些成本说明本次虽然没有改变行为，却不是可以跳过完整 Gate 的机械 R0 工作。迁移触及跨层类型合同、第三方 Adapter 声明边界和验证工具链，因此 R2 分类是正确的。

## 六项关键事件复盘

| 事件 | 根因 | 本次处理 | 最早可预防 Gate | 可复用教训 |
|---|---|---|---|---|
| 严格编译首次暴露 1,174 行测试侧诊断 | 测试 doubles、正负样本和回调依赖 JavaScript 隐式形状；生产 Application/Port seam 尚无清晰类型所有者 | 拒绝 TDD_READY，返回 Spec，形成类型所有权 Correction 001 | Explore / Spec | 在改测试扩展名前先证明共享业务类型由生产 seam 所有；测试不能靠复制业务类型或广义 callable 消除诊断 |
| `TEST-XCLI-021` 裸解析 `@types/node` 失败 | 把纯声明包误当成具有运行时入口的 ESM 包；它没有可供 bare runtime resolve 的 `main`/`exports` | 改为解析 `@types/node/package.json`，保持依赖版本与产品合同不变 | Test Design | 依赖存在性测试必须按包的发布语义取证；纯声明包验证 metadata subpath，不制造 runtime bridge |
| 测试 helper 复制对象后丢失冻结状态 | `Object.fromEntries(Object.entries(value))` 在“收窄”时创建了新引用，使身份与 property descriptor 语义漂移 | helper 改为运行时收窄并返回原引用 | Test Design | 零行为迁移中的测试 helper 也受行为等价约束；收窄函数默认不得复制、解冻、重排或重新序列化被测值 |
| 非 canonical PATH 解析到 npm `11.16.0` 并产生假失败 | 角色直接使用宿主 PATH，没有从规范工具链唯一入口执行 | 用 canonical PATH 复现 npm `11.12.1` 并通过，排除环境噪声 | 每次执行前 / Evidence freeze | 版本合同必须由单一可执行入口落实；宿主环境结果不能覆盖 canonical runner 证据 |
| Terra/high Worker 面对数百条跨模块诊断无法完成 | 任务表面是扩展名迁移，实际需要同时建模八个模块、测试图和第三方声明闭包，初始路由低估了诊断拓扑 | Worker 按 stop line 返回；Controller 核实无权限、架构或范围冲突后，唯一升级到 Sol/high 完成；未允许第二次升级 | Explore sizing / Worker dispatch | 路由应依据受影响 seam 数、诊断分布和第三方声明闭包，而非“零行为”标签；升级必须保持 scope、合同和 rollback 冻结 |
| Pi SDK 传递声明与严格 `NodeNext` 不兼容 | 第三方 SDK 声明闭包进入 TypeScript 静态解析后，与本项目严格配置不兼容 | 仅在 Pi Adapter 内用运行时组合但值完全相同的包名执行动态导入，继续使用结构化本地 facade | Explore / Adapter design | 第三方声明缺陷应在 owning Adapter 止血；保持真实 runtime identity，不新增桥接包，不把 SDK 类型传播进业务层 |

## 其余重要发现

### 类型所有权不能由测试临时补齐

Validator 001 在全绿运行时矩阵之外发现了广义 `Function`、测试侧重复业务类型和直接绕过 checked boundary 的 malformed 调用。根因不是缺少几个 annotation，而是 Test migration 把“让编译通过”误当成“证明类型归属”。Correction 001 最终明确：

- Product Core、Port 和 Application seam 拥有跨模块共享的 type-only contract；
- Adapter、Profile 和 CLI 的局部类型默认留在本层；
- runtime trust entry 接受 `unknown` 并收窄；
- 已 admission 的正向业务流保持强类型；
- 测试只在确需注入非法 operational input 时使用一个局部、可审计的 checked helper。

这套所有权模型应成为后续 JavaScript 到 TypeScript 迁移的输入，而不是再次从编译错误中推导。

### checked helper 的边界必须按语义审计

第一次修正解决了 malformed input 无法静态调用的问题，但 Validator 002 发现 helper 又扩散到成功调用和合法输入引发的状态失败。只按“这里编译是否困难”决定是否使用 helper，会把强类型正向路径变成普遍逃生口。

最终边界是：helper 只服务于缺字段、多字段、非法枚举、非法 descriptor/deadline/model/tool input 或缺少 cancellation signal 等故意违反 admitted contract 的值；生命周期冲突、取消、源文件变化、symlink、终态不可变、run collision 和文件系统阻塞等合法输入失败必须直接调用强类型 seam。

### 搜索源码中的 `any` 不等于证明没有 `any`

Validator 003 发现 `Object.create(null)` 由标准库签名推断为 `any`。源文件没有显式 `any` token，但未标注的 negative matrix 把该类型传播到了生产 seam 参数。随后全图 TypeChecker audit 又在 E2E matrix 找到同根问题。

因此，“无 `any`”证据不能只依赖文本搜索、lint 或零编译诊断。对 trust boundary 和测试到生产 seam，必须解析真实调用目标并读取 TypeChecker 的实参类型。最终 471 个 seam 调用、405 个参数的零 `TypeFlags.Any` 结果，才是本项声明的充分证据。

### 正向链必须作为一个合同检查

Port 输出与下游输入曾被分别标注，导致 `calculation_kind` 在一端 optional、另一端 required。各模块孤立看来都可解释，组合后却无法保证正向链。修正方式不是增加 cast，而是让生产拥有的共享合同表达真实必需字段，再由因果 RED 驱动一处有界生产修正。

迁移设计应至少选取一条完整正向调用链做 assignability proof，不能只逐文件消除诊断。

### 证据摘要也需要机器可复核

首轮冻结曾把 TEST/AC 身份和断言数量写成错误摘要；AST 复核得到 22 个 TEST、54 个 accepted AC identity，以及当前 Integration 468 个 assertion call、基线 464 个。归档时还出现顶部 current verdict 与文件末尾终态不一致。

测试全绿不能证明证据 ledger 正确。计数应从当前树自动提取并与声明比对；归档前必须从顶部 verdict、traceability、board、archive record 和 canonical regression 五个视角重新读取终态。

## 根因归纳

### 迁移范围按文件数量估算，而不是按类型关系估算

21 个文件看似有限，但真正工作量取决于跨层 seam、正负样本、替身数量和第三方声明闭包。以后 sizing 应记录类型关系图和诊断分布，不用“机械迁移”或“零行为变化”推断低难度。

### Test Design 同时承担运行时等价与静态合同证明，却只充分设计了前者

原测试对业务行为覆盖很强，但迁移后新增了类型所有权、无 inferred `any`、helper 消费者分类和对象身份保持等静态义务。这些没有在第一版 Test Plan 中形成可执行证据，导致严格编译和 Validator 逐层补课。

### 证据方法过度依赖人工摘要与 lexical scan

文本搜索可以发现显式 suppression，却无法发现 TypeChecker 推断、resolved signature 所属模块或 helper 的业务语义。人工计数也容易与当前树漂移。该类声明需要结构化、可重复运行的证据程序。

### 环境合同存在，但执行入口尚未成为唯一习惯

canonical runner 能固定 Node/npm 并移除真实模型 gate，但个别角色仍直接使用宿主 PATH。流程上应把“从 canonical entrypoint 开始”视为证据有效性的前提，而不是失败后的排查手段。

### 初始模型路由没有计入旧 JavaScript 的隐式设计债务

Terra/high 的停止是正确 stop-line 行为，不应通过无记录续跑掩盖。问题在于 dispatch 前只看预期行为 delta，没有看跨模块诊断拓扑。后续可先用只读 strict scratch 和第三方声明探针帮助选路；升级仍应是例外，而非默认预留。

## 值得保留的摩擦

- Spec Gate 在 1,174 行测试诊断出现后拒绝 TDD_READY，避免测试自己发明生产合同。
- `ponytail-review` 两次删除无当前消费者的 leaf exports、declaration stubs 和其他预留机制，最终结论为 lean。
- Worker 在测试缺陷、路由不足和合同冲突处停止，没有通过 cast、suppression、弱化断言或扩大范围伪造 GREEN。
- 三个 fresh Validator 分别发现类型所有权、helper 语义扩散和 inferred `any`；这些都不是重复跑测试能够发现的问题。
- 模型升级只有一次，升级前由 Controller 证明 scope、authority、contract 和 rollback 未变化。
- canonical runner 和 real-model gate 保证全程离线、确定性，环境噪声没有进入正式结论。

## 可避免的摩擦

- Explore 没有在 Spec 前运行完整 test-side strict scratch 并分类诊断所有权。
- Test Plan 没有把声明包解析、对象 identity/frozen state、helper 消费者语义和 TypeChecker seam audit 列为迁移不变量。
- 初始 Worker sizing 没有记录第三方声明闭包和跨模块诊断分布。
- evidence freeze 使用手工摘要，未先由 AST/TypeChecker 提取身份、计数和实参类型。
- canonical 环境虽已存在，仍有命令绕过唯一入口。
- archive read model 缺少自动终态一致性检查。

## 下一次 TypeScript 迁移基线

### Explore

1. 清点生产、测试、helper、配置和 runner 的完整扩展名图，以及所有静态 import、动态 import 和 public namespace。
2. 在不改仓库的 scratch 配置中运行严格编译，按所有者分类诊断：生产 seam 缺失、测试负样本、fixture/double、第三方声明、环境或真实产品冲突。
3. 对每个依赖区分 runtime package、declarations-only package 和 metadata subpath；探测第三方声明闭包是否兼容当前 module resolution。
4. 记录一条完整正向调用链和所有 runtime trust entry，确认对象 identity、freeze、key order、serialization、错误、timing 和 side effect 均属零行为合同。
5. 用诊断拓扑而非文件数选择初始角色路由。

### Spec 与 Design

1. 冻结每个共享类型的唯一生产所有者；禁止测试复制业务类型。
2. 明确哪些入口接收 `unknown`、如何收窄，以及 admission 后从哪里开始保持强类型。
3. 第三方类型不兼容时只允许在 owning Adapter 内隔离，并证明 runtime identity、错误传播和调用时机不变。
4. 把 no bridge、no build output、no dual mode、no SDK leakage 和 canonical toolchain 写成可验证的非目标/禁止项。
5. 在 Spec Gate 前对完整 diff 运行 `ponytail-review`，删除无当前消费者的类型导出、shim、wrapper 和未来模式。

### Test Design

1. 先证明 helper 与环境健康，再建立因果 RED；不得把 helper 自身漂移误判为生产失败。
2. 负样本 matrix 显式以 `unknown` 保存非法值，避免标准库 API 传播 inferred `any`。
3. checked helper 只允许 malformed operational input；success 和 valid-input state failure 必须直接走强类型 seam。
4. 对所有测试到生产 seam 运行 TypeChecker resolved-call audit，并要求参数 `TypeFlags.Any` 为零。
5. 迁移 helper 必须验证原引用、冻结状态、descriptor、key order 和 serialization 未改变。
6. 依赖测试按包语义解析；纯声明包验证其 `package.json`，不要求不存在的运行时入口。

### Worker、验证与归档

1. Worker 只在冻结路径内消除诊断；不得加 suppression、广义 cast、测试专用生产导出或 JavaScript 兼容桥。
2. 若诊断跨多个模块或第三方声明闭包，Worker 按 stop line 返回完整分布；Controller 再判断是合同缺失、测试缺陷还是路由不足。
3. 所有正式证据从 canonical runner 或其明确列出的 command-local 环境产生；宿主 PATH 结果只可作为诊断信息。
4. evidence freeze 前机器提取 TEST/AC identity、assertion ledger、resolved seam types、文件图和版本，不手写估算。
5. fresh Validator 必须审计静态所有权和证据真实性，而不只是复跑 runtime suite。
6. 归档后再次运行 canonical validation，并核对顶部 verdict、current spec、archive record、traceability 和项目板终态一致。

## 后续治理候选

以下项目是本次复盘确认的治理债务，不在本文档中自动生效，也没有在本动作中修改 `AGENTS.md`、Skill、模板、runner 或产品代码。应按用户后续逐项授权处理：

1. 为 JavaScript 到 TypeScript Change 增加 migration preflight checklist，覆盖类型所有权、声明包解析、对象语义、canonical 环境和第三方声明闭包。
2. 建立可复用的 TypeChecker audit，自动列出测试到生产 seam 的 resolved target、实参类型、`TypeFlags.Any` 和 checked-helper consumer；该工具需作为独立治理 Change 设计和验证。
3. 在 Test/Validator brief 模板中加入 helper 语义分类和 no-inferred-`any` 证据要求，避免只扫描显式 token。
4. 强化 canonical validation entrypoint 的版本自检和证据标识，使绕过环境的输出不能被误收为正式证据。
5. 为 archive 增加 read-model invariant 检查，自动比对顶部 verdict、acceptance、archive record、current spec 和 project-board 状态。
6. 把角色 sizing 从文件数量扩展为 seam 数、诊断拓扑、第三方声明闭包和负样本密度；保留唯一升级与无第二次自动升级的 stop line。

## 成功标准

在后续三个同类迁移或边界 Change 中跟踪：

- TDD_READY 前是否已闭合生产类型所有权，目标是零次 Gate 后所有权 Correction；
- 第一次 evidence freeze 是否已实现生产 seam 参数零 `TypeFlags.Any`；
- checked helper 是否在首次 Validator 前已全部按语义分类；
- 是否所有正式证据都来自 canonical 环境，目标是零次版本假失败；
- 是否在初始 dispatch 前记录诊断拓扑与第三方声明闭包；
- TEST/AC/断言/文件图计数是否由可重复程序提取；
- 第一次归档是否已经满足 current read-model 终态一致性。

如果相同问题再次依赖独立 Validator 才发现，应把对应候选治理项提升为正式治理 Change，而不是继续把 correction loop 当作迁移常态。

## 本文档边界

本文档沉淀已经发生的事实、已验证的可复用经验和待审批的治理候选。它不修改产品行为，不重开已归档 OpenSpec，不授权新工具、依赖、模型、外部调用或流程规则，也不把一次项目经验自动升级为全局 Agent 行为。
