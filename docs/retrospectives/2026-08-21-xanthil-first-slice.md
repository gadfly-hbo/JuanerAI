# Xanthil 首个纵切复盘

- 日期：2026-08-21
- 范围：`xanthil-cli-local-analysis-slice`
- 结果：独立 Validator PASS，Controller ACCEPTED，当前规范已发布并归档
- 当前行为基线：`openspec/specs/local-analysis/spec.md`
- 完整历史：`openspec/changes/archive/2026-08-21-xanthil-cli-local-analysis-slice/`

## 结论

首个纵切的高复杂度主要来自一次性建立产品、架构、运行时、持久化、安全、测试和角色编排基线，而不是一个普通业务功能本身需要如此多轮工作。质量链路仍应保留，但后续普通功能必须消费本次已经验证的边界和测试资产，目标形态应收敛为：小型 Change、少量新增 RED、一次最小 Worker、聚焦回归、独立 Validator。

如果普通功能再次出现多轮 Spec clarification、Test correction、Worker revision、大面积既有测试迁移或反复模型升级，应视为流程报警：先定位缺失的用户决策、合同歧义、测试缺陷、环境漂移或切片过大，再回到所属 Gate；不得把 repair loop 当成正常交付方式。

## 最终成果

- 16 项 Requirement、51 项 Acceptance Criteria、22 个测试标识和 10 个任务完成闭环。
- Unit `250/250`、Contract `198/198`、Integration `243/243`、默认 E2E `131` PASS 加 1 个真实模型门控 skip。
- 正式 `minimax-cn/MiniMax-M3` 运行 PASS，无 fallback、产品重试或原始 provider 内容泄漏。
- Product Core、Application、三个业务 Port、四个 Adapter/Profile/CLI 边界通过独立验证。
- 失败、超时、取消、source provenance、actual runtime state、原子发布和 terminal immutability 形成当前行为基线。
- `juaner_spec`、`juaner_test`、`juaner_worker`、`juaner_validator` 的持久 Gate 调度规则已建立。
- 项目板、decision brief、current spec、archive 和证据哈希链已经实际跑通。

## 成本事实

归档包包含：

- 14 个 correction 文件；
- 18 个 revision 文件；
- 2 个 replan 文件；
- 23 个 Worker handoff；
- 28 个 Test handoff；
- 12 个 Spec clarification/revision 文件；
- 两轮独立 Validator FAIL，随后一轮最终 PASS。

归档 `verification.md` 达 1,757 行、60 个二级标题。它保留了完整过程，但证明单文件追加日志不能同时充当可靠的 current read model：归档时顶部 Verdict 仍落后于文件末尾的 PASS、ACCEPTED 和 ARCHIVED。

## 值得保留的摩擦

### Gate 阻止了错误证据进入生产

Controller 多次拒绝不完整或因果倒置的测试，没有允许 Worker 通过削弱断言取得 GREEN。测试与实现角色隔离在最困难的修复阶段仍然成立。

### Worker stop line 防止了隐藏 repair loop

Worker 在预算内失败后停止并完整报告，Controller 能区分测试问题、规范问题和生产缺陷。虽然产生了 revision，但没有发生测试与生产互相迁就或无记录重试。

### 独立 Validator 找到了全绿矩阵没有覆盖的真实缺口

第一轮发现物理预检顺序、主动 deadline、实际 Pi 状态、真实 read provenance 和证据冲突；第二轮发现 Artifact admission cancellation、fixture deletion 分类和 Pi runtime/model 分类。独立验证不是重复跑测试，而是发现测试和规范共同遗漏的边界。

### 真实模型失败没有被隐藏

第一次正式 M3 运行失败，后续正式运行通过。失败被保留，没有 fallback 或产品重试，也没有把诊断运行冒充正式证据。

### 冻结合同后的非重叠并行有效

Analytics 与 Pi remediation 在测试冻结、路径不重叠、Controller 统一验收的条件下并行成功。共享 Application、测试或规范的修正仍保持串行。

## 可避免的摩擦

### 首切同时承担过多基础决策

语言与构建策略、Pi SDK 接法、真实模型、Profile、运行目录、Artifact 结构、错误词汇、deadline/cancel 和角色调度都在一个 Change 中首次落地。它验证了系统，但让产品切片与平台冷启动成本叠加。

### 终态词汇先于竞态语义冻结

系统较早定义了 `succeeded`、`failed`、`cancelled` 和 `TIMEOUT`，却没有同时定义 admission、linearization point、已发出工作、终态赢家和迟到结果。`commitSuccess` 与 user cancellation 的决策因此在后期才回到用户。

### Test Design 的完整性检查不足

出现过 helper 健康断言错误、tautological inputs、标题覆盖但 mutation leaf 缺失、mtime 推断原子顺序、过期 composition helper 和错误的 pending-commitSuccess 赢家假设。测试数量不能替代测试设计审计。

### 环境约束只是文字而非单一入口

Shell 曾解析到 Node 24/npm 11.16，而批准环境是 Node 26/npm 11.12.1。最终依靠 command-local PATH 修正，但每个角色重复拼接环境仍然容易出错。

### 真实模型可靠性政策没有前置

规范冻结了模型身份和 no-fallback，却没有定义正式运行次数、诊断预算、成功率或连续通过阈值。最终 Validator 只能依据“无阈值”把混合结果判断为非阻塞，不能按预先批准的可靠性政策裁决。

### 范围审计缺少 VCS 基线

仓库不是 Git repository。角色依靠路径声明和 SHA 清单证明范围，能够验证关键文件，却难以独立证明完整 write set。

### 项目板工具违反自己的原子性声明

`status-cli.mjs` 的 `persist()` 先写 `status.json`，随后才构造并追加 event。使用无效 event type 时命令报错，但 status 已改变。治理工具必须和产品代码一样满足自己的原子性合同。

### 已知成功参考实现进入 Explore 太晚

`/Users/huangbo/Dev/Projects/pi-xanthil` 后期才进入调查。今后对 Pi、数据库、模型或平台接入，应在 Explore 阶段登记用户已有成功实现，明确可迁移模式、版本差异、隐藏前提和禁止复制的产品耦合。

## 已沉淀的复用基线

后续 Xanthil Change 应先读取 `docs/governance/xanthil-first-slice-reuse-baseline.md`，并优先复用：

- 当前 `local-analysis` capability spec；
- Product Core/Application/Ports/Adapters/Profile/CLI 依赖方向；
- Agent Runtime、Local Analysis Execution、Run Artifact Store contract suites；
- fixture oracle、coverage map、Port doubles、CLI/Profile harness、virtual deadline scheduler 和 Pi failure hooks；
- closed error vocabulary、observed model identity、source provenance、single semantic writer、success-last 和 cancellation linearization；
- standing subagent authority、Gate 顺序、独立 Validator 和 project board。

这些资产是未来 Change 的输入，不是每次重新讨论的议题。确需修改时，必须把修改本身作为显式 delta 和相应 contract change。

## 新的复杂度基线

普通功能的目标路径：

1. 读取 current spec 和 reuse baseline。
2. 只描述 intended delta 与 non-goals。
3. 增加少量 AC 和因果 RED，不迁移无关旧测试。
4. 一次最小 Worker 实现。
5. 运行聚焦测试、受影响 contract suite 和风险相称回归。
6. fresh Validator 验证并归档。

以下情况触发复杂度审计：同一行为第二轮 Spec clarification、第二轮 Test correction、第二次 Worker revision/replan、局部功能引发整套测试迁移、未预期跨多个 Port/Adapter、第二次模型升级或 current evidence 互相矛盾。具体规则见 `docs/governance/change-complexity-control.md`。

## 后续行动

### 已在本次学习中完成

- 建立 Change complexity control 规则。
- 建立 Xanthil first-slice reuse baseline。
- 建立 Change retrospective 与 Validator checklist 模板。
- 增强 handoff、handoff-back 和 Controller review 模板。
- 在项目 AGENTS.md 中加入低上下文成本的触发指针。
- 修正归档 verification 顶部的最终 Verdict。

### 需要独立授权和执行

1. 用 TDD 修复 project-board status/event 原子性；在修复前只使用已验证 event type，并在命令后读取 status/event 双证据。
2. 选择 Git 基线或等价 repository snapshot/write-set manifest；不得由复盘文档隐式初始化 Git。
3. 创建 canonical validation runner，统一冻结 PATH、工具版本、默认离线矩阵和 gated real-model 入口。

上述三项是流程基础设施工作，不与 TypeScript migration 或第二个业务纵切混做。

## 成功标准

在接下来的三个普通业务 Change 中跟踪：Spec reopen 次数、Test correction 次数、Worker revision 次数、既有测试修改面积、模型升级次数和 Validator findings。正常目标是单次 Spec/Test/Worker/Validator 路径；触发止损线时必须记录根因和重新切片结果。若普通功能仍复制首切的返工形态，应暂停产品扩张并治理流程。
