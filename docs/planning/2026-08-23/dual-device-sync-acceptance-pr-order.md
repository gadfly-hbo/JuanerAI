# JuanerAI 双端同步、验收和 PR 合入顺序

> 状态：治理文档已由用户于 2026-08-23 冻结；纯文档 governance PR 待合入
> 日期：2026-08-23
> 仓库：/Users/huangbo/JuanerAI
> 基线：main = origin/main = 60e13514ffec01c09dc407e4271492458e9f4105
> 边界：本文冻结通用协作机制与首组 E/H/P/C/A 的计划级同步、验收和严格产品 PR 顺序；不创建或批准 OpenSpec Change、产品分支、产品 PR、实现、真实数据访问、模型运行或合入。用户只单独授权本冻结包的纯文档治理分支与 PR。

## 1. 集成权威

1. origin/main 是唯一集成权威；本地 main 是只读镜像。
2. MacBook 长期担任默认 Integration Controller。
3. .juanerai/project-control/** 只有 MacBook Controller 写入。
4. Run Evidence 全链路和集成验收归 MacBook。
5. 两端可以并行开发，但不能并行决定共享合同、Profile、OpenSpec 或当前项目状态。
6. 设备所有权不替代 Spec、Test、Worker、Validator 的角色隔离和生命周期 Gate。

本文只约束 `/Users/huangbo/JuanerAI` 仓库内的双端协作。JuanerAI 之外的项目仓库只在用户明确指示时用于只读学习，不参加 Change 交付、分支 handoff、PR、运行依赖或集成；任何学到的设计必须重新落为 JuanerAI 自有的产品、合同和实现。

页首 `60e13514ffec01c09dc407e4271492458e9f4105` 是本规划收敛时已核验的文档基线，不是未来每个 Change 可重复使用的启动 SHA。每次实际启动由 Controller 发布当时最新的精确 `origin/main`；任何端不得在 main 已前进后仍从本页历史 SHA 启动。

## 2. 每组并行工作的启动条件

MacBook Integration Controller 必须先发布：

- 共同 origin/main SHA；
- 每个 Change 的产品目标与 Change ID；
- 设备和模块所有者；
- allowed、conditional 和 forbidden paths；
- 共享合同与版本；
- 依赖图；
- focused、contract、integration、regression 与 canonical 验证要求；
- 数据、网络、依赖、真实模型和副作用权限；
- PR 预期拓扑和最终 activation 条件。
- 如使用外部仓库作为只读学习来源，记录 source root、SHA、学习目的和不形成依赖/联动的声明。

两端必须确认：

- Git root 正确；
- 本地 main 已 fast-forward 到共同 origin/main SHA；
- worktree clean；
- 没有其他设备正在写同一分支；
- 路径不重叠；
- 共享合同已经冻结或明确不需要。

任一条件不满足，不进入并行实现。

## 3. 分支与设备写入权

1. MacBook 使用 work/macbook/<slug>。
2. Mac mini 使用 work/mac-mini/<slug>。
3. 每个分支只承载一个 coherent Change 或治理任务。
4. 一个分支同一时间只有一个写入设备；另一设备可以只读审查。
5. 两端可读全仓，但只修改获批 Change 的路径和本泳道所有权范围。
6. 两端不把对方工作分支相互 merge、rebase 或 cherry-pick 作为正常同步方式。
7. 不通过复制未提交文件同步工作。
8. 不使用 force-push、reset 或替代分支掩盖冲突或丢弃历史。
9. 不在外部项目仓库创建本计划的分支、提交或 PR，也不把外部仓库纳入 Git handoff；学习结果只能在 JuanerAI 获批路径内重新实现。

正式 Git handoff 必须记录：

- 分支名；
- 当前准确 HEAD；
- worktree clean；
- 已提交并 push；
- 已运行验证及结果；
- 未完成项、风险和下一步；
- 接手设备确认；
- 原设备停止写入。

## 4. 共享合同变化

满足以下任一情况视为共享合同变化：

- 跨设备或跨模块的输入输出改变；
- Artifact、Schema、identity、lifecycle 或 error semantics 改变；
- Profile 组合或 capability activation 改变；
- 多消费者 Application API 改变；
- Adapter contract test 需要改变；
- 数据权限、网络、来源、版本、回滚或兼容语义改变。

处理规则：

1. 依赖分支立即停线；
2. Mac mini 不直接修改 Port、共享类型、验证器或契约测试；
3. 提交 Contract Change Request；
4. MacBook Controller 重新确认产品和架构影响；
5. 共享合同重新冻结后，依赖分支才继续；
6. 旧 Head 和旧 Validator PASS 不证明新合同下的新 Head。

## 5. 开发期间同步点

并行开发期间不持续追赶 main。只在以下同步点处理新 origin/main：

1. 共享合同、术语、Profile 或其他 Controller 热区发生变化；
2. 准备冻结实现证据并派发独立 Validator；
3. 准备 PR 最终验收或合入；
4. 同组另一条相关 PR 已经合入；
5. Controller 明确宣布新集成基线。

无关 main 变更可以延后到最终验收前。正常同步合并最新 origin/main，不改写已发布工作分支历史。

## 6. 四层验收

### 6.1 A — 分支自证

分支所属设备负责返回：

- allowed/conditional/forbidden path 检查；
- Change-specific focused validation；
- 适用的单元、契约、集成、E2E 和回归；
- 适用时的 canonical offline validation；
- 分支名、准确 HEAD、命令、完整结果；
- 风险、限制和未验证项；
- 依赖、真实数据、外部访问和副作用声明。

Mac mini 返回分支验证与交付证据，但不写 `project-control`。产品能力 `Run Evidence` 仍由 MacBook 负责，两者不得混称。

### 6.2 B — 独立验证

1. 实现与证据冻结后，由 MacBook Controller 派发独立只读 Validator。
2. Validator 验证准确 PR Head SHA，不实施修复、不批准产品范围。
3. MacBook 可以只读审查 Mac mini 远程分支，但不因此取得写入权。
4. Head 更新后，旧 Validator 结论不再证明新 Head。
5. changes_requested 由原写入设备在原分支修订。
6. 修订后重新冻结 Head 和受影响证据。

### 6.3 C — PR 合入验收

MacBook Controller 检查：

- OpenSpec、Requirements/AC、Design、Tasks 和允许路径；
- 术语、架构和共享合同没有漂移；
- expected RED、GREEN、回归、契约测试和 traceability；
- 数据、安全、来源、依赖和副作用；
- PR diff、提交范围、Validator 结论、风险和回滚；
- 未混入其他 Change、设备配置、密钥或机器状态。

这一层 PASS 只表示 PR 可合入，不表示整组并行工作完成。

### 6.4 D — origin/main 集成验收

相关 PR 合入后，由 MacBook 在最新 origin/main：

- 核对 squash merge 后的目标树；
- 运行 Change-specific 跨端集成检查；
- 运行适用的 canonical offline validation；
- 验证 Profile、组合根、共享合同和激活状态；
- 检查适用的产品 `Run Evidence`、分支验证/交付证据、scope、traceability 和残余风险；
- 更新 project-control；
- 完成最终验收和后续 OpenSpec archive。

只有 D 层通过，集成交付才可声明完成。

## 7. PR 发布与修订

1. 每个设备只 push 自己拥有的工作分支，PR 指向 main。
2. PR 包含准确 Head、范围、验证、风险、依赖和下一步。
3. MacBook Controller 负责最终 PR 验收和用户沟通。
4. changes_requested 由原写入设备在原分支修订，除非正式 Git handoff。
5. 修订后重新冻结 Head 和证据，不沿用过期 PASS。
6. Git 流程不替代 OpenSpec、TDD、Independent Verification 或用户产品批准。

## 8. PR 严格串行合入

即使两个 PR 完全独立，也不同时合入：

1. Controller 一次只选择一个已验收 PR 做 squash merge；
2. 第一个 PR 合入后，确认 intended tree 已进入 origin/main；
3. 两端同步新的 main；
4. 剩余相关 PR 合并最新 origin/main，形成新 Head；
5. 剩余 PR 重跑受影响的 focused、contract、integration、regression 和 canonical checks；
6. 必要时对新 Head 重新独立验证；
7. Controller 验收并 squash merge 下一条 PR。

严格串行的目的是让每个集成节点都有唯一、可复现的主干状态。

## 9. 合入顺序由依赖图决定

不冻结“MacBook 永远先”或“Mac mini 永远先”：

| 情况 | 合入顺序 |
|---|---|
| 存在新共享合同或必要 enabler | 合同/enabler 最先 |
| Provider 与 Consumer 依赖已冻结合同 | 可并行开发；默认 Provider 先、Consumer 后 |
| 两个完全独立 Change | 先完成验收者可先合入，但仍严格串行 |
| Profile、组合根或 capability activation | 永远最后由 MacBook 合入 |
| Run Evidence | 由 MacBook 负责 |
| 发生合同漂移 | 暂停依赖 PR，先处理 Contract Change Request |

通用情况下，Consumer 若在未激活状态能独立通过全部验证，可以先于 Provider 合入；但首组由 §9.1 明确覆盖为 P 先于 C，真实 activation 仍等待双方就绪。

### 9.1 首组严格 PR 顺序

首组覆盖通用“Consumer 可先合入”的可选规则，固定为以下顺序；即使后序 PR 先完成，也等待前序节点集成和重基线：

| PR 顺序 | Planning Change / 计划分支 | 合入前最低条件 |
|---|---|---|
| 1 | E `CHG-model-pack-contract-enabler` / `work/macbook/model-pack-contract-enabler` | `MP-C01..05` Spec/TDD/Validator 完整；共享合同与关闭状态无产品激活 |
| 2 | H `CHG-xanthil-hypothesis-first-analysis` / `work/macbook/xanthil-hypothesis-first-analysis` | 在 E 后最新 main 完成两场景 A1–A5、现有 local-analysis 回归和独立验证 |
| 3 | P `CHG-model-pack-local-provider` / `work/mac-mini/model-pack-local-provider` | 合并 E/H 后重验；MP1–MP9、真实 SDK、Builder Gate、独立 Consumer 与 Provider Validator 完整 |
| 4 | C `CHG-xanthil-model-pack-consumer` / `work/macbook/xanthil-model-pack-consumer` | 从含 E/H/P 的 main 冻结；真实 MP9 SDK 取代 double；本地 Runtime/Product GREEN 与新 Head Validator 完整；保持 Profile 未激活 |
| 5 | A `CHG-xanthil-model-pack-activation` / `work/macbook/xanthil-model-pack-activation` | 从含 E/H/P/C 的 main 冻结；精确 Pack/Runtime/Profile、真实 28 日 actuals、rollback、独立验证和用户实际运行授权满足 |

H 与 P 可以在 E 合入后并行开发，但 H 先合入。该次序让 C 的基线同时包含最终 Xanthil hypothesis-first 行为和真实 Provider SDK，并避免 H 在 C 之后再次改变 MacBook Product Core/Application/CLI 热区。P 即使先完成也不得绕过 H；它在 H 合入后合并最新 `origin/main` 并重跑受影响证据。

C 可以在 P 运行时基于 E 的冻结 contract double 开发，但 double 证据不得成为最终 GREEN、Validator 或合入依据。首组禁止 C 先于 P 合入。A 只做冻结的 activation/rollback/integration，不得顺手修 P/C 或改变阈值。

## 10. 每次合入后的双端收敛

每次 squash merge 后：

1. MacBook 与 Mac mini 切回本地 main；
2. fast-forward-only 更新并 prune 远程引用；
3. 确认 HEAD == main == origin/main；
4. 确认 worktree clean；
5. 确认目标文件真实存在于集成树；
6. 检查未合入分支是否需要同步和重新验证；
7. 远程分支按 PR 规则处理；
8. 本地工作分支不自动删除，删除需要用户明确批准。

### 10.1 首组逐次重基线验证

| 已合入节点 | 仍在工作的分支必须做什么 | 失效证据 |
|---|---|---|
| E | H、P 合并最新 main；H 重跑现有 local-analysis/contract/canonical 回归，P 运行 `MP-C01..05` suites；重新检查 forbidden paths | 任何基于 E 之前合同或 root graph 的 Head/Validator |
| H | P 合并最新 main并确认无 Provider 路径/合同漂移；C 只从含 E/H 的 main 启动 | P 在旧 main 的 root/canonical 证据；任何早于 H 的 C Head |
| P | C 合并最新 main，锁定真实 MP9 SDK identity/checksum，替换 double，重跑 package/runtime/consumer 全矩阵并派发新 Validator | 所有 double-only GREEN、P 合入前的 C Validator、旧 SDK identity |
| C | A 只从含 E/H/P/C 的 main 启动；锁定 Consumer Head、Pack、Runtime 与 Profile candidate | C 之前的 activation proof、任何未绑定精确 Pack/Consumer Head 的结果 |
| A | 两端 fast-forward 最新 main；MacBook 运行 Change-specific 真实产品验收与适用 canonical offline validation；Mac mini 只读核对 Provider Artifact identity | activation 分支 Head 的旧 PASS；任何未在 squash 后 origin/main 重跑的 D 层声明 |

“合并最新 main”使用普通 merge，不改写已发布工作分支历史。每次 merge 产生新 Head，必须记录新 SHA、diff、受影响测试选择和完整结果；是否需要全新 Validator 按变更影响判断，但 P→C 的真实 SDK替换、C→A 的 activation 和 A squash 后 D 层始终需要新的当前-Head/当前-main 证据。

## 11. 停线条件

遇到任一情况停止合入并保留证据：

- 基线、Head、设备所有权或 worktree 状态不明确；
- 两个设备同时写同一分支；
- allowed paths 重叠或 diff 越界；
- 共享合同、Profile、术语、数据或安全边界未批准变化；
- Validator SHA 与待合入 Head 不一致；
- 合并最新 origin/main 后验证失败；
- squash merge 目标树与预期不一致；
- 冲突解决可能丢弃任一设备提交或用户已有改动；
- 依赖、网络、真实模型或外部副作用超出授权；
- project-control 与 Git 集成事实冲突且会造成错误状态声明；
- E 未合入就启动 P/C，或 P/C 需要改变 `MP-C01..05` 而没有 Contract Change Request；
- H 建立第二套 Product Core/旁路 Adapter，或与 C 同时写 MacBook Xanthil/root 热区；
- P 在任何阶段读取由 Controller 隔离到 A 的 `acceptance-actuals.csv`、修改 Xanthil/Profiles/共享合同，或把 MP9 误称 SDK/产品完成；
- C 以 contract double、示例 Pack、synthetic 数据或未发布 SDK 作为最终 GREEN/Validator/合入证据；
- A 在 activation 中修改 Provider/Consumer 行为、评估阈值、真实数据合同、共享 Schema 或 rollback 语义；
- 实际 PR 顺序不是 E → H → P → C → A，或任一后序分支未吸收前序 squash 后 main；
- 精确 Pack identity/checksum、Provider PR Head、Consumer PR Head、Validator Head 或待验收 main 不一致；
- 真实 28 日 actuals 未获数据/运行授权、提前泄漏、未达到首发阈值，或只在 activation 分支而非 squash 后 main 通过。

不得通过 reset、force-push、跳过验证、修改契约测试断言或新建替代分支掩盖异常。需要改变合同、范围、Schema、路径所有权或产品行为时，返回 Controller 和用户决策。

## 12. 第一组 Change 拓扑与 Change-level 参数

首组数量、planning ID、Owner 和依赖已确定；本文仍不创建 Change、分支或 PR：

| 节点 | Planning Change ID | Owner | 依赖 |
|---|---|---|---|
| E | `CHG-model-pack-contract-enabler` | MacBook Integration Controller | 产品方案 Reviewer PASS 与首发场景确认 |
| H | `CHG-xanthil-hypothesis-first-analysis` | MacBook | 产品上独立；为避免共享热区，在 E 合入后的基线上启动 |
| P | `CHG-model-pack-local-provider` | Mac mini | E 合入、MP1/MP2、真实 history 与依赖/本地 MLflow/训练授权 |
| C | `CHG-xanthil-model-pack-consumer` | MacBook | E/H 合入；可用 double 开发，最终证据/合入依赖 P 的真实 MP9 SDK |
| A | `CHG-xanthil-model-pack-activation` | MacBook Integration Controller | E/H/P/C 合入、真实 actuals/推理授权、独立验证和 rollback 就绪 |

E 后 H 与 P 跨设备并行；C 不与 H 并行写 MacBook Xanthil/root 热区，但可与尚未完成的 P 有界重叠；A 永远最后。规划级 allowed/conditional/forbidden paths 以 `shared-contracts-integration-hotspots.md` §7.1 和所有权矩阵为准。

本票已冻结 E → H → P → C → A 的严格 PR 顺序、§9.1 的计划分支名、§10.1 的逐次重基线验证和 §11 的 activation/真实验收停线条件。每个实际 OpenSpec Change 仍必须基于启动时的最新 `origin/main`，分别冻结 focused/contract/integration/regression/canonical 命令、精确 allowed/conditional/forbidden paths、数据/依赖/模型运行授权和回滚命令；这些属于 Change-level 参数，不能由本规划文档预造。
