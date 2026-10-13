# metric-factory ↔ JuanerAI 语义资产交换契约 v0.1（草案）

| 项目 | 内容 |
| --- | --- |
| 版本 | `v0.3`（消费方基线事实勘误 + 手动安装/采用回执正文化） / 2026-10-12；v0.2（修订冻结，2026-10-09）与 v0.1 历史（2026-10-08 冻结 + errata.1–3）见文末变更记录；**v0.1/v0.2 冻结面（包格式、身份/版本/指纹语义、fail-closed 不变量）零改动** |
| 状态 | **v0.3 修订冻结**（用户授权 2026-10-12，纯文档修正；v0.2 修订冻结（2026-10-09，两轮 readiness gate 第 2 轮 PASS）继续有效）；errata 不再单列，已并入正文 |
| 供应方 | metric-factory（独立开源，Apache-2.0，仓库 `/Users/huangbo/Dev/Projects/metric-factory`） |
| 消费方 | JuanerAI（`/Users/huangbo/JuanerAI`）。**v0.3 实测基线（2026-10-12 只读核对；本地 main == origin/main `7e137598`，工作树干净）**：在案权威 = Blueprint v1.0/v1.1（白皮书 v3.3.3）+ Xanthil local-analysis 切片（`apps/cli/xanthil.ts` + `packages/product-core/local-analysis.ts`，唯一真实分析面：单案例受控执行，CSV 源 SHA-256 钉死，八阶段管线）；此前所记"白皮书 v4.0 + Blueprint v4.2（2026-10-04 已生效，main 已发布）"在本机不可定位（全仓及 origin/main 均无 v4 文件与 2026-10 提交），A-02/N04 无可定位对象——**以实测为准**，核对记录见 §9 与变更记录 |
| 命名声明 | 本文 **SAP = Semantic Asset Package（语义资产包）**的缩写，**与 SAP SE（德国 ERP 软件公司）无关**；跨仓文档引用本契约时请用全名「语义资产包 / Semantic Asset Package」以避免歧义（用户裁决 C，2026-10-08） |
| 用户已裁决 | ①《分析体系工作台方案 v1.0》（JA-ABS-PRD-001）**有效**，且 metric-factory 即「分析体系工作台」的产品名，范围 = 分析体系设计 + 指标体系建设，不再维护两个重叠工具；②先评审后实施；③metric-factory 保持独立开源，未来作为平台插件接入；④三方关系按本文 §2.2 统一理解（正式蓝图命名与范围同步后置） |
| 本文性质 | 纯静态契约草案；不构成实现声明、验收证据或工程授权 |

## 1. 目的与范围

定义 metric-factory 作为 JuanerAI 平台插件时双方交换的**语义资产包（Semantic Asset Package）**格式、身份与版本语义、治理不变量及 Adapter/工具边界。

metric-factory 的产品定位（本契约的供应侧基线）：

> **metric-factory 是「分析体系工作台」**——面向业务的工作台。用户在这里明确业务目标、拆问题树、设计指标、选择分析方法、绑定数据，并评审发布可复用配置。它回答「这个业务问题应该怎样分析、衡量」。

非目标（显式排除）：

- 不定义任何运行时行为（Contract/IR 消费、执行、恢复属于 JuanerAI A-03/A-04，不在本契约内）
- 不定义存储方案（metric-factory 以 git 为持久层；JuanerAI 侧存储由其架构决定）
- 不使 metric-factory 获得 Ontology/Data 权威；不建立第二套语义真源；不承担本体建模维护（见 §2.2）
- 不恢复 JuanerAI 已作废计划，不修改在研 Change005 的任何冻结输入

## 2. 角色与权威边界

### 2.1 供应/消费权威

原则援引：JuanerAI `docs/architecture/asset-and-model-capability-architecture.md` —— Data 与 Ontology 是 foundational authority；**authoring tool 在 publication Gate 完成前不具有权威性**。

```text
metric-factory（业务工作台/资产供给方）            JuanerAI（权威方）
  分析体系配置 · 指标契约 · 绑定草案                  Data / Ontology 权威
  问题树 · 方法引用 · 证据标准                        发布门（publication Gate）
  provenance / fail-closed 门                │
            │ 语义资产包（单向，只读快照）              │
            └──────────────►  导入 → 治理 → 发布门 → 被 Case / A-02 / N04 消费
```

- 资产包为**不可变快照**：消费方不得回写；修正以**同谱系 ID、版本递增**的新包进行。
- 包内一切内容在 JuanerAI 侧发布门前均为 **candidate**，不得当作企业正式口径。
- metric-factory 不复制 Ontology 权威：包内指标/维度/绑定/概念引用是「声明与草案」，正式语义身份由消费方发布门赋予。

### 2.2 三方关系：metric-factory · Protégé · Semantica

| 角色 | 是什么 | 负责 | 不负责 |
| --- | --- | --- | --- |
| **metric-factory** | 面向业务的工作台 | 分析配置与指标契约：问题树、指标、方法选择、数据绑定、评审发布可复用配置 | 本体权威维护（引用不拥有）；底层语义组件选型 |
| **Protégé** | 专业本体建模辅助工具 | 专家维护客户、订单、商品等概念、关系与逻辑约束；本体有明确维护与发布归属（Owner） | 指标定义、分析流程、产品工作台 |
| **Semantica** | 背后的工程组件候选 | 组织、检索概念与知识关系；可为工作台或 JuanerAI 语义运行时提供支持 | 工作台产品流程；不自动定义正确指标 |

关键约束（用户原话固化）：**三者共享概念 ID 和版本，但不能默认 OWL 导入和推理已经互通。** v0.1 只承诺平面概念引用（`concept_refs`，见 §3.3），不承诺任何 OWL/推理互操作。

示例链（「提升会员复购」）：

```text
metric-factory：设计问题树、复购指标、验证方法
        │ 指标引用本体中的「会员」「订单」「有效购买」等已确认概念（concept_refs）
        ▼
Protégé（可选）：复杂本体由专家建模检查；概念经 Owner 发布为带版本快照
        │
        ▼
语义资产包发布 → JuanerAI Semantic Context Runtime 解析适用定义/指标/绑定
        → Analysis Core / IR 组织执行；Semantica 可参与语义检索与组织
```

## 3. 语义资产包结构（v0.1 承诺级）

```yaml
sap: 0.1                      # Semantic Asset Package 合同版本
package:
  id: <kebab-case 唯一 ID>     # 稳定 ID，标识资产谱系
  version: 0.1.0              # semver
  kind: template | instance | blueprint | binding-spec
  created_at: <ISO-8601>
  generator: metric-factory@<version>[+<git-sha>]
  namespace: mf.<package-id>
  fingerprint: sha256:<规范化序列化的 SHA-256>
scenarios: []                  # 分析体系配置（§3.1，v0.2 起正式段，结构已冻结）
metrics: []                    # 见 §3.2 契约等级
dimensions: []                 # 维度名数组（透传，§3.2）；维度字典为预留槽位
concept_refs: []               # 本体概念引用（§3.3，v0.1 已定义形状，可为空）
bindings: []                   # BindingSpec 条目（§3.4）
review: {}                     # 包级审查状态（§3.5）
runtime_state: design_only     # v0.1 恒为 design_only（§3.6）
```

占位符说明：`kind` 已随首个实现批次冻结为 `instance` 字面量（校验器按字面拒绝其余取值）；其余 kind（template/blueprint/binding-spec）的段组成规则仍随后续批次冻结。`sap` 合同版本未知（非 `0.1`）的包，`validate_import` 拒绝（fail-closed）。

### 3.1 场景条目（v0.2 正式段，结构已冻结）

分析体系设计资产（JA-ABS-PRD-001 F03 对象模型的最小集）。**ScenarioSpec v0.1 已随 v5 批次冻结（2026-10-09，两轮独立 REVIEW）**，仓库事实源 = `src/schema/scenario.ts`：

- `id`（snake_case；裸 id 唯一由上游 lint 与物化合并保证，包级执法键为 id@version，见 §4）/ `version`（semver）/ `title`
- `decision_purpose` 必填非空（无决策用途不可保存——ABS AT02 门）
- `question_tree`：平面节点表 `{id, label, parent?, metric?}`；parent 引用同场景节点、禁自指/成环；metric 引用包内指标
- `metric_usages`：`{metric, role: outcome|driver|guardrail, note?}`——场景角色，不是新指标定义
- `method_refs[]`（引用不实现，如 `dame.m2.driver_decomposition@1.0.0`）/ `evidence_requirements` / `output_spec` / `review_rules`（文本）

重复身份（§4）覆盖场景 id@version；scenarios→metrics 引用一致性为校验器正式规则（消费侧镜像，契约 §6）。

### 3.2 指标条目与契约等级

- **维度条目（v0.1 冻结）**：`dimensions` 为**字符串数组透传**（仅维度名称，与现行 `TemplateSchema.dimensions` 一致）；维度字典（名称/说明/可加性标记）为**预留槽位**，v0.1 不承诺。
- **L0（v0.1 承诺）**：即 metric-factory 现行 `MetricSchema` 字段——name / display_name / display_name_en（可选）/ type / definition / definition_en（可选）/ dimensions / time_grains / owner_role / caliber_switches / type_params / provenance / review。枚举未穷尽显有可选字段，以现行 schema 为准。
- **L1（v0.2 已冻结，v4 批次交付 + 独立 REVIEW 证据）**：三件套可选字段——
  - `aggregation?: { allowed_dimensions: string[]; disallowed_dimensions: string[]; ratio_policy?: "recompute_from_parts" }`（两表 ⊆ 模板 dimensions 且互不相交；指标 dimensions 为空时不得存在）
  - `statistic_object?: ConceptRef`（与包级 concept_refs 同形）
  - `caliber_type?: CaliberFamily[]`（**多值枚举数组、去重**；8 族：refund_adjustment / fee_composition / scope_inclusion / validity_threshold / attribution_window / proration_rule / cap_anomaly_rule / measurement_anchor——2026-10-08 普查冻结，336 指标回填验证）
  - 消费方对未实现的可选字段忽略而非报错（向前兼容原则不变）
  - 执法面注记：aggregation 语义约束（两表 ⊆/不相交/空边界）执法点在供应侧模板 lint；SAP 校验器**有意不镜像**该约束（与 v4 REVIEW N3 的 LLM 规则同类取舍——闭包复核不重复上游语境校验），消费侧如需可随 v6 补

### 3.3 概念引用（concept_refs）

```yaml
concept_refs:
  - id: <概念稳定 ID>
    version: <版本>
    source: <概念快照定位符>    # v0.1 约束：非空不透明字符串；格式随 §8 开放问题 4 冻结
    role: <在本包中的用途，如 statistic_object / dimension_semantics>
```

语义：**引用，不拥有**。metric-factory 只引用经确认的概念 ID@version；概念的真值、生命周期与发布归属在 Ontology Owner（Protégé 工作流或其后续治理流程）。不默认 OWL 导入与推理互通。`source` 在 v0.1 为**非空不透明字符串**（不含结构语义）；消费方不得解析其内部结构，格式随开放问题 4 冻结。

### 3.4 绑定条目

即现行 `MappingEntrySchema`：metric / model / column / agg? / confidence / signals / confirmed_by? / confirmed_at?。语义：「指标 → 物理模型.列」的**设计态草案**；运行时冻结 Binding Manifest 由 JuanerAI A-02 负责，本契约不定义该过程。

### 3.5 审查与 fail-closed 不变量

- provenance 三来源：`template`（须 template_ref）/ `llm`（须 model + prompt_version）/ `manual`。
- **阻断半径（v0.1 冻结）**：与 metric-factory export gate 的**整批阻断**等价——`validate_import` 对含任一 `origin=llm` 且无 `reviewed_by` 条目的包**整体拒绝**，不做条目级剔除或降级放行。
- **导出门关系（v0.1 冻结）**：SAP 导出**复用** metric-factory 现有 export gate——未审核 LLM 指标在导出侧即被整批阻断，正常路径不会产生「带未审核清单的包」；导入侧校验是针对手工构造包的纵深防御，语义同为整批拒绝。
- 包级 `review` 段随包携带（形状已冻结，见 §10 登记表），供消费方核对与审计。

### 3.6 双状态

- metric-factory 只声明 **design 完备性**；运行就绪（数据资格、权限、A-02 解析）由消费方计算。
- v0.1 包一律 `design_only`；`executable` 语义待消费方 A-02/N04 有真实实现后另行修订契约。
- **校验规则（v0.1 冻结）**：`runtime_state ≠ design_only` 的包，`validate_import` **拒绝**（fail-closed：不改写、不降级标注，因该状态声明了 v0.1 不存在的语义）。

## 4. 身份、版本与指纹

- 引用一律 `id@version`（指标、场景、概念、依赖包均同）；消费方必须按精确版本绑定，**禁止 latest 跟随**（对齐 JuanerAI「Run binds immutable version」原则）。
- fingerprint = SHA-256（UTF-8 无 BOM、LF、按键名排序、无空行的规范化序列化）；规范化算法与自引用裁决**已冻结并实现**（精确规则见 §10 登记表与 `src/sap/canonical.ts`）。
- **指纹失配语义（v0.1 冻结）**：`validate_import` 重算指纹与包内声明不一致时**拒绝**该包并视为不可信（fail-closed）。
- **重复身份语义（v0.1 冻结）**：包内出现重复 `id@version` 即非法——供应方导出校验拒绝产出，消费方导入校验拒绝接收。
- 包内跨引用必须在同一包内可解析；包间引用（含 concept_refs 的 source）须显式声明 `id@version`。**v0.1 不含跨包依赖声明机制**，其引入随 L1/场景批次另行冻结。
- **指纹自引用决策（冻结算法时不可回避）**：冻结算法时必须显式裁决 `fingerprint` 字段自身是否计入哈希（建议排除/置空后计算），不得遗留默认行为。

## 5. 与 Semantica / DuckDB / SQLite / Protégé 的边界

总原则：四者均为可替换实现或独立工具；**本契约只依赖稳定语义，不依赖任何具体组件**。metric-factory 保持「设计态、git-native、零运行时服务依赖」。

### 5.1 Semantica（JuanerAI `adapters/semantic-semantica`，当前为空模块边界）

- 定位：工程组件候选——组织、检索概念与知识关系，为工作台或 JuanerAI 语义运行时提供支持；不承担工作台产品流程，不自动定义指标。
- metric-factory 对 Semantica **零依赖、零引用**；概念引用的解析不由 Semantica 独占（任何符合 §3.3 语义的 Ontology 实现均可）。
- 未来若 JuanerAI 以 Semantica 承接 Ontology 服务，映射由该 adapter 负责；metric-factory 义务仅为：概念引用保持可平凡映射的平面结构（id/version/source/role），不预设图 schema 或 OWL 本体格式。

### 5.2 Protégé（专业本体建模辅助工具，独立工具）

- 本体权威维护工作流归 Ontology Owner；Protégé 是专家侧建模与检查工具，不在本契约交换面内。
- metric-factory 与 Protégé 无直接接口；二者通过**已发布的概念快照**（共享 ID@version）间接对齐：Protégé 侧 Owner 发布 → metric-factory 引用 → JuanerAI 发布门确认。
- OWL 导入/推理互通**不默认成立**；如未来需要，另立契约修订。

### 5.3 DuckDB（JuanerAI `adapters/analytics-duckdb`，有真实实现）

- metric-factory 不做事实计算、不存事实数据；DuckDB 的实际计算角色在消费方运行时。
- metric-factory 侧独立演进项（不属于本契约承诺）：未来可用 DuckDB 对本地文件（Parquet/CSV）做 schema 内省以**辅助绑定发现**（`map` 命令的新 adapter 源）。该演进不改变资产包格式，bindings 引用 duckdb 表列时与引用 dbt 模型列同构。

### 5.4 SQLite（JuanerAI `adapters/state-sqlite`，当前为空边界）

- 运营状态存储，纯消费方内部实现；**本契约不涉及 SQLite**。

## 6. 消费接口（逻辑契约，非 API、非协议）

| 操作 | 输入 | 输出 | 责任方 |
| --- | --- | --- | --- |
| `resolve_package` | `id@version` | 资产包 + 指纹 + review 状态 | 消费方读快照 |
| `validate_import` | 资产包 | 校验结果；以下任一即**整体拒绝**（fail-closed）：结构不合法 / 未知 `sap` 合同版本 / 含未审核 LLM 条目 / `runtime_state ≠ design_only` / 指纹失配 / 重复 `id@version` | 消费方执行 |
| `publish_gate` | 候选资产 | 正式语义身份 / 拒绝 | JuanerAI 独有权威，metric-factory 无写路径 |

### 6.1 安装与采用（v0.3 升格为正文；手动文件模式）

- **模式裁决（用户 2026-10-12）**：前期以文件交付为唯一方式——供应侧 `release` 发布 `releases/<package-id>/<version>.sap.yaml` 快照 + `releases/index.yaml` 登记，人工交付给消费方安装；**不做 API/MCP 接口打通，待使用成熟后再议**（§8-Q5 的具体化）。
- **发布 = 登记**：供应侧 `release` 是唯一写登记的动作；`export --format sap`（含 `--package-version`）恒为临时导出，不进登记。
- **安装三步（消费方职责）**：①按精确 `id@version` 取得快照（禁 latest）；②`validate_import` 全量校验（上表；移植供应侧校验器须补未审 LLM 规则）；③**采用**——包内指标口径（`caliber_switches`/`type_params`/`aggregation`）真实进入消费方本次分析的 Context/Binding/IR 并影响计算；把整份文档放进提示词不构成采用。`scenarios.question_tree` 是参考骨架，不是必须机械执行的路径；`bindings` 是设计态草案，真实文件/字段由消费方任务 Binding 承接。
- 消费面字段语义、净销售样板勾稽示例与对账方法的事实源：metric-factory `docs/sap-consumption-guide.md`。

### 6.2 adoption receipt（采用回执，v0.3 升格为正文）

消费方每完成一个真实任务，按以下格式回传 YAML 回执；供应侧登记（回执登记的供应侧实现随后续批次交付）：

```yaml
task_id: <消费端任务唯一标识>
package:
  id: <package-id>
  version: <semver>
  content_fingerprint: sha256:<64hex>   # 与供应侧 releases/index.yaml 对账（五键内容指纹，G10）
  package_fingerprint: sha256:<64hex>   # 包完整性校验（含时间戳成分）
adopted_metrics:  [{ name: <metric> }, …]   # 实际进入本次计算口径的指标
adopted_scenarios: [{ id: <scenario> }, …]
issues_found:   # 口径歧义 / 缺失信息 / 试用问题
  - kind: caliber_ambiguity | missing_data | trial_issue
    metric: <可选，指向具体指标/场景>
    detail: <一句话问题描述>
computed_at: <ISO-8601>
```

## 7. 演进路线（与用户裁决对齐）

1. **v0.1**（本轮）：契约评审，冻结包格式与不变量；零代码。
2. **v4 批次**：metric-factory schema 对齐 L1 指标契约字段（汇总规则、统计对象、口径类型）+ `concept_refs` 进入实例数据。
3. **v5 批次**：场景编辑器落地，`scenarios` 结构冻结；模板升级为 Domain Pack 候选格式（对齐 `packages/domain-pack-sdk`，若其已可用）。
4. **v6 批次**：消费方有真实接入面后，修订 `executable` 状态语义与导入触发方式。**v0.3 注（2026-10-12 实测）**：消费端载体 = Xanthil local-analysis 切片（单案例受控执行，暂无可插拔口径输入面）；A-02/N04 在本机不可定位，未来接入面命名随消费方 Spec 冻结，不由本契约预设。
5. **跟踪项（已按用户裁决搁置，2026-10-09）**：Blueprint 正文落位**无限期后置**——理由：①产品处边做边改阶段，不成熟；②metric-factory 是未来向 JuanerAI **提供能力的独立方，非隶属于平台**。搁置期间，双方关系由**本契约单独管辖**（双边、版本化、带身份链），不追求蓝图承认；未来若重启，优先评估「能力提供方登记」形态而非蓝图正文隶属式写入（素材包 `docs/blueprint-sync-proposal-v0.1.md` 已标记搁置备查）。

## 8. 开放问题处置（2026-10-08 用户批准：一次性给方向，细节随实现批次冻结）

已裁决并冻结（v0.1 正文）：

1. ~~序列化主格式~~ → **YAML 1.2 为唯一规范序列化**（人读优先，metric-factory 原生）；JSON 可由消费方自行转换，指纹仍以 YAML 规范化字节计算。
2. ~~`concept_refs.source` 最小约束~~ → **非空不透明字符串**（§3.3）。
3. ~~重复 `id@version` 语义~~ → 供应方导出拒绝 + 消费方导入拒绝（§4）。

方向已定（细节随相应实现批次冻结）：

4. **命名空间机制 → 前缀约定**。包级 `namespace` 字段（前缀格式 `mf.<package-id>` 已随 v4 批次冻结并实现，见 §10），不采用注册表分配——零中心化服务依赖；Workspace 映射规则仍留 v6 窗口。
5. **导入触发 → 手动文件导入**。v0.1～v6 窗口以文件快照导入为唯一方式（本地优先、git 可管）；git 引用拉取与发布包登记作为消费方后续选项，随 v6 窗口评估。
6. **`concept_refs.source` 结构格式 → 平面定位符**。形式为「发布方标识 + 条目 ID@version」的不透明定位符（不承诺解析语义）；与本体 Owner 发布产物的对接时点 = 消费方 A-02/N04 有真实实现后的 v6 窗口。
7. ~~`scenarios` 结构冻结时点~~ → **已随 v5 批次冻结**（ScenarioSpec v0.1，见 §3.1；原 Q7 关闭）。
8. ~~L1 指标字段最小集~~ → **三件套已冻结并实现**（v4 批次，见 §3.2；原 Q8 关闭）；维度字典（名称/说明/可加性）仍预留。

## 9. 证据与审查边界

- 本文档为静态草案；无代码、无测试、无运行时证据；不构成任何一方的实现完成声明。
- 依据文档：JuanerAI AGENTS.md（工程宪法）、白皮书 v4.0、Blueprint v4.1/v4.2、asset-and-model-capability-architecture.md；metric-factory PRODUCT_PLAN.md、README.md、JA-ABS-PRD-001《分析体系工作台方案 v1.0》。
- 未读未引：消费方 A-02/N04 尚无可调用实现（截至 2026-10-08），§6 接口为逻辑契约。**v0.3 核对（2026-10-12，只读）**：消费方仓 origin/main == 本地（`7e137598`），全仓无 Blueprint v4 文件、无 semantic-asset 消费代码、`adapters/semantic-semantica` 与 `packages/domain-pack-sdk` 为空目录；唯一真实分析面 = Xanthil local-analysis 切片（会员复购单案例）。本文档头部 v0.2 所记消费方基线据此勘误。
- readiness review 第 1 轮（2026-10-08，全新只读 Reviewer）结论 NEEDS_CLARIFICATION；draft.3 按其 Required Plan Additions 七项完成修订。第 2 轮（新鲜 Reviewer 复评，同日照宪法执行）结论 **PASS**：预期产品复述准确，无承重猜测；draft.4 为 PASS 后按评审 §6 五项建议做的非语义文本加固（语义与 stop line 未变，无需再评审）。

### 附：readiness review 自检预填（按 JuanerAI 宪法七项；评审前留档，评审结论见 §9）

1. **What I Would Build**：一个单向、只读、不可变的语义资产包交换格式，使作为「分析体系工作台」的 metric-factory 能把分析体系配置（问题树/场景预留）、指标契约、本体概念引用与绑定草案作为 candidate 交给 JuanerAI，经其发布门后成为正式语义资产；fail-closed（整批阻断半径已冻结）、精确版本、引用不拥有本体三项不变量全程保持。
2. **Required Guessing**：§8 开放问题 4–8（命名空间机制、导入触发、source 结构格式、scenarios 冻结时点、L1 最小集）；已逐项标注「用户裁决后随首个实现批次冻结」，不构成隐藏猜测。
3. **External Study Required**：无——本包自包含；不依赖外部仓拯救缺失内容（消费方 adapter 现状与三方工具边界已在本契约内声明）。
4. **Untestable Requirements**：§6 接口在消费方无实现前不可测（消费侧强制语义在消费方验收）；v0.1 的可测面为包格式本身（schema 校验 + 指纹对账 + fail-closed 负例 + `design_only` 恒等式），可在 metric-factory 侧以零网络测试覆盖。
5. **Correctly Deferred**：运行时绑定冻结、executable 状态、scenarios 内部结构、实体/关系建模、OWL/推理互通、导入工程化——均显式后置到 v4–v6 批次或独立修订。
6. **Required Plan Additions**：第 1 轮七项已在 draft.3 完成；第 2 轮 PASS 附五项非语义加固，已在 draft.4 落地（`kind` 占位说明、未知 `sap` 版本拒绝、指纹自引用决策项、谱系 ID 措辞、跨包依赖机制注记）。
7. **Verdict**：第 2 轮 PASS（独立 Reviewer）；本草案不自我裁决。

## 10. 实现批次登记（v0.2 新增；供应侧事实，均有独立 REVIEW 证据）

| 项 | 冻结事实（仓库事实源） |
|---|---|
| 规范化序列化 | YAML 1.2 子集（NFC/2 空格/块式/禁锚点/键递归排序/保守 plain-safe 正则 `^[a-z0-9][a-z0-9_.\-/]*$`/双引号 JSON 转义）；指纹计算时 `fingerprint` 字段置空（§4 决策项兑现）；`src/sap/canonical.ts` |
| generator 双通道 | 构建期 tsup define 注入 `MF_GIT_SHA_BUILD`（git rev-parse，可 env 覆盖），运行时 `MF_GIT_SHA` 优先，均无则纯版本号；`metric-factory@<version>[+<sha>]` |
| namespace 格式 | `mf.<package-id>`；package-id = 实例文件名去 `.yaml` 后 slugify（小写/非法字符→`-`/折叠）——**「实例名」定义 = D2 裁决**：文件名去后缀；下载产物名为 `<package-id>.sap.yaml`（package-id = slugify(实例名)，非 kebab 文件名两者一致） |
| 包级 review 段 | `{ gate: "metric-factory-export-gate", exported_at, unreviewed: [] }`（正常路径恒空） |
| SAP 校验器规则集 | structure（含未知 sap 版本/场景与绑定段形状/跨段引用镜像）/ runtime-state / fingerprint-mismatch / duplicate-identity（指标 name、concept (id,version,role)、场景 id@version——契约 §4 全覆盖）；`src/sap/validate.ts` |
| SAP 导出管线 | export gate（整批阻断）→ 装配（内含供应侧查重与指纹计算）→ **整包校验（issues 非空即拒绝）** → 规范化写盘；CLI `--format sap` 与工作台下载双出口等价（422 语义一致） |
| golden artifact | `examples/ecommerce-instance.sap.yaml`（53 指标 + gmv_gap_diagnosis 种子场景；随批次再生成，指纹随内容） |
| 回填资产 | 7 模板 336 指标 L1 全量回填：caliber_type 137 填（服饰试点 49 + 其余 6 模板 88）/ aggregation 194 填（30 + 164）；SOP：多值仅真实跨族 / 非默认锚才赋值 / 粒度声明≠排除 / **开关即证据** / 继承留空——`.flow/l1-backfill-*.md` 留档 |

## 变更记录

| 版本 | 日期 | 变更 |
| --- | --- | --- |
| v0.1-draft.1 | 2026-10-07 | 初始草案（基于蓝图 A 主线语言，误记「工作台方案作废」） |
| v0.1-draft.2 | 2026-10-08 | 按用户更正：①工作台方案有效，metric-factory 即分析体系工作台（分析体系设计+指标体系双范围）；②新增 §2.2 三方关系（metric-factory/Protégé/Semantica）与「提升会员复购」示例链；③包结构新增 scenarios（预留）与 concept_refs（引用不拥有、共享 ID@版本、不默认 OWL 互通）；④§5 重排为四组件边界（新增 Protégé）；⑤开放问题 5 项→6 项 |
| v0.1-draft.3 | 2026-10-08 | 按 readiness review 第 1 轮（NEEDS_CLARIFICATION）material correction：①§3.5 冻结阻断半径=整批拒绝，并明确 SAP 导出门复用 metric-factory export gate（导入侧校验为手工构造包纵深防御）；②§3.6 冻结 `runtime_state ≠ design_only` 即拒绝（fail-closed）；③§3.2 dimensions 改为字符串数组透传承诺、维度字典标预留，L0 补 display_name_en/definition_en；④§4 补指纹失配拒绝语义与重复 `id@version` 双向拒绝；⑤§3.3 source 冻结为非空不透明字符串；⑥§7 加蓝图同步跟踪项；⑦§8 三问转已裁决（序列化=YAML 1.2、source 最小约束、重复身份语义），开放问题重编为 4–8；⑧自检附录与 §9 更新评审状态 |
| v0.1-draft.4 | 2026-10-08 | 第 2 轮 readiness review 结论 **PASS**（新鲜 Reviewer，七项独立评审）；按评审 §6 五项非语义文本加固：①§2.1 修正措辞为「同谱系 ID、版本递增」（与 §4 谱系语义一致）；②§3 加占位符说明（`kind` 为格式占位不影响校验语义；未知 `sap` 版本拒绝）；③§6 `validate_import` 拒绝清单补「未知 `sap` 合同版本」；④§4 加跨包依赖机制注记（v0.1 不含）与指纹自引用决策项；⑤§9 与自检附录更新两轮评审状态。**冻结语义零变更**，无需再评审 |
| **v0.1（冻结）** | 2026-10-08 | 用户批准冻结为正式 v0.1。§8 五问一次性给方向（用户批准「方向已定，细节随实现批次冻结」）：Q4 命名空间→前缀约定（包级 namespace 字段，零中心化服务）；Q5 导入触发→手动文件导入（git 引用/包登记留 v6 窗口）；Q6 source 格式→平面定位符「发布方标识+条目 ID@version」，对接时点=v6 窗口；Q7 scenarios 冻结=v5 批次随场景编辑器；Q8 L1 最小集=三件套（aggregation / statistic_object / caliber_type）进 v0.2，细节随 v4 批次 |
| v0.1-errata.1 | 2026-10-08 | **事实勘误（无语义变更）**：消费方基线更正为 Blueprint v4.2 已生效（用户确认 2026-10-08，GitHub main 已核对；批准记录 `blueprint-v4.2-approval-and-rule-integration.md` 为状态权威，v4.2 正文头部保留草案期冻结字节）；§7 跟踪项同步改写（v4 实现批次不再以蓝图同步为前置，同步以 v4.2 为基线另行完成） |
| v0.1-errata.2 | 2026-10-08 | **命名声明（无语义变更）**：新增文档控制「命名声明」行——SAP = Semantic Asset Package（语义资产包），与 SAP SE（ERP 软件公司）无关；跨仓引用用全名避免歧义（用户裁决 C：保名加声明，不更名） |
| v0.1-errata.3 | 2026-10-09 | **跟踪项处置（无语义变更）**：§7.5 蓝图落位按用户裁决**搁置**（产品处边做边改阶段；metric-factory 为独立能力提供方、非隶属于 JuanerAI）；搁置期间双方关系由本契约单独管辖，未来重启优先评估「能力提供方登记」形态 |
| **v0.2（修订冻结）** | 2026-10-09 | 用户批准开工（v5 收尾序列第 2 项）。修订内容：①§3.1 scenarios 预留→正式段（ScenarioSpec v0.1 结构冻结，v5 批次 + 两轮 REVIEW 证据）；②§3.2 L1 三件套预留→冻结（v4 批次交付，8 族枚举与 336 指标回填验证）；③§8 Q7/Q8 关闭登记；④新增 §10 实现批次登记（规范化/generator 双通道/namespace 与实例名 D2/review 段形状/校验器规则集/导出管线/golden artifact/回填资产 SOP）；⑤errata.1–3 事实并入正文基线。待 readiness review 通过后随用户确认定格 |
| v0.2-rc.2 | 2026-10-09 | readiness gate 第 1 轮 NEEDS_CLARIFICATION：F1 统计口径失实（88/164 为 batch2 小计，7 模板实测 137/194）+ F2-F6 文本残留 → 修正；第 2 轮（新鲜评审员）**PASS**：统计三方对齐、登记与代码逐字一致、v0.1 不变量未触碰；L1-L4 文字残留（kind 字面量说明/文件名 slug 精度/Q4 时态/状态行）随本稿收口。待用户确认定格 v0.2 |
| **v0.3（修订冻结）** | 2026-10-12 | 用户授权的纯文档修正，**v0.1/v0.2 冻结面零改动**。①消费方基线事实勘误：2026-10-12 只读核对（本地 main == origin/main `7e137598`）证实全仓无 Blueprint v4 文件、A-02/N04 无可定位对象，头部基线改为实测（Blueprint v1.0/v1.1 + Xanthil local-analysis 切片为唯一真实分析面），§7-4/§9 同步；②消费模式裁决（用户 2026-10-12：文件导出→手动交付→安装消费，暂不做 API/MCP）与安装三步（取得/校验/采用）升格为 §6.1 正文；③adoption receipt 格式升格为 §6.2 正文；④消费面字段语义事实源指向 metric-factory `docs/sap-consumption-guide.md` |
