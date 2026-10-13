# SAP 语义资产包消费指引（metric-factory → JuanerAI）

> 面向消费端（JuanerAI 侧）的安装与消费指引。供应侧事实源：契约 `docs/juanerai-semantic-asset-contract-v0.1.md`（v0.2 修订冻结，本指引不改动其冻结面）+ `src/sap/release.ts`（发布登记实现）。本指引为批次 2 契约 v0.3 修订的输入，属逻辑契约，非 API。

## 1. 模式与边界

- **文件交付**：metric-factory 导出 SAP 资产包，手动交付给 JuanerAI 安装消费（用户裁决 2026-10-12）；不做 API/MCP 接口打通，待使用成熟后再议。
- **单向只读**：包是不可变快照，消费方不得回写；修正以同谱系 id、版本递增的新包进行（契约 §2.1）。
- **发布 = 登记**：供应侧 `release` 是唯一产生登记的动作；`export --format sap` 恒为临时导出，不进登记。

## 2. 取得（resolve）

1. 发布物在供应侧 `releases/` 目录：
   ```
   releases/
     index.yaml                          # 登记簿（append-only 数组）
     <package-id>/<version>.sap.yaml     # 不可变快照
   ```
2. 消费方**按精确 `id@version` 取得**（index 条目的 `package` + `version` 字段），**禁止 latest 跟随**（契约 §4）。
3. `index.yaml` 条目字段：`package` / `version` / `content_fingerprint` / `package_fingerprint` / `created_at` / `released_by` / `note` / `file`。`file` 为相对 releases/ 基目录的快照路径。
4. 当前首个发布物：`net-sales-instance@1.0.0`（净销售样板，见 §6）。

## 3. 校验（validate_import）

对每个交付包独立校验，任一命中即**整体拒绝**（fail-closed，不做条目级剔除或降级放行）：

| # | 规则 | 说明 |
|---|---|---|
| 1 | 结构合法 | `sap: "0.1"` 字面；package 段齐全；scenarios/metrics/concept_refs/bindings/review 形状（`src/sap/validate.ts` SapPackageSchema） |
| 2 | 指纹一致 | 对整包规范化序列化重算 SHA-256 = `package.fingerprint`（自引用置空规则已实现于 `src/sap/canonical.ts`） |
| 3 | 无重复身份 | 指标按 `name`；concept_refs 按 `(id, version, role)`；场景按 `id@version` |
| 4 | runtime_state | 恒 `design_only`；其他值拒绝（契约 §3.6） |
| 5 | 未审 LLM 条目 | `origin=llm` 且无 `reviewed_by` 的指标 → 整批拒绝。**注意**：供应侧校验器 `src/sap/validate.ts` 有意不含此规则（正常路径被导出门拦截）；消费方移植该校验器时**必须补此规则**（纵深防御，针对手工构造包） |

## 4. 字段消费语义（安装即生效，不是塞提示词）

消费端必须把下列字段解析进本次 Context / Binding / IR 并影响计算；把整份 YAML 放进提示词**不构成接入**：

- **`caliber_switches`（布尔开关）**：口径开关直接改变指标计算。例：`gmv.include_refund` 开/关决定成交总额是否剔除退款；`refund_amount.refund_to_payment_period` 决定退款归属支付期间还是退款期间。开关取值以**包内为准**（任务数据不得覆盖包口径）。
- **`type_params`**：公式契约。`expr`（如 `gmv - refund_amount`）中的 token 引用包内其他指标；`measure`/`numerator`/`denominator` 同理。
- **`aggregation`**：可加性契约。`allowed/disallowed_dimensions` 约束聚合范围；`ratio_policy: recompute_from_parts` 表示比率类指标必须由分子分母重算，不得对比率值直接聚合。
- **`caliber_type`**：口径族标签（如 `refund_adjustment`/`measurement_anchor`），提示该指标的口径敏感面，供消费端选择核验点。
- **`scenarios`**：**参考骨架，不是必须机械执行的固定路径**。`question_tree` 供主 Agent 理解「这个问题通常怎么拆」；`metric_usages` 的 `outcome/driver/guardrail` 角色供核验侧选择护栏指标；`evidence_requirements` 是证据要求声明。主 Agent 保留结合需求与数据动态调查的自由度。
- **`method_refs`**：纯引用标识（如 `dame.m2.driver_decomposition@1.0.0`），包内不含方法实现；消费方按自身方法库解析，解析不到不得臆造。
- **`concept_refs` / `statistic_object`**：本体概念平面引用（id@version+不透明 source），引用不拥有；未接本体时可整体忽略，不阻塞消费（契约 §3.3）。
- **`bindings`**：**设计态草案**（指标→模型.列映射建议，含置信度）。真实文件、字段、数据快照由消费端任务 Binding 承接；**不得把某次客户文件的映射当通用定义**。

**独立检查义务**：消费端须自行检查支持范围（如聚合函数种类）与包内引用完整性（scenarios→metrics、type_params→metrics、aggregation 两表 ⊆ dimensions）；供应侧已保证包内闭包，消费端不复核上游语境校验（如 aggregation 两表 ⊆ 模板 dimensions），但必须复核**自身可计算性**。

## 5. 版本、不可变与对账

- **同 id@version 不可重复发布**：供应侧拒绝；消费端如收到同 id@version 的两个不同字节包，视为交付事故（校验指纹即暴露）。
- **`content_fingerprint`（内容指纹）**：登记侧对包做规范化序列化、置空五键（`package.fingerprint`、`package.created_at`、`review.exported_at`、`package.version`、`package.namespace`）后取 SHA-256。
  - **同内容重导出 → 内容指纹不变**（时间戳不干扰对账）
  - **版本递增但业务内容零变化 → 内容指纹不变**（供应侧会发同内容警告）
  - **业务内容变化（口径/公式/场景/指标集）→ 内容指纹必变**
  - **`generator` 变化（工具重建/升级）→ 内容指纹变**：工具来源属包内容（红队 R1 裁决）；对账时如仅 generator 行差异，属工具链漂移而非业务变化
- `package_fingerprint` 含时间戳成分，每次导出必不同——**不可**用它做业务对账，只做包完整性校验。
- 消费端建议在安装记录中同时保存双指纹（receipt 格式见 §7）。

## 6. 净销售样板（首个样板资产）

`net-sales-instance@1.0.0`，fork 自 `ecommerce-marketplace@0.1.0`：

- 指标：`gmv`（开关翻为 `include_refund: true` 含退款）、`refund_amount`（退款额；`refund_to_payment_period` 默认开 = 归属支付期间；`include_pending_refund` 默认关）、`net_sales`（`expr: "gmv - refund_amount"`）
- **勾稽前提**：`net_sales` 公式成立要求 `gmv.include_refund = true`——模板默认是关（剔除退款），直接套公式会**双重扣减**。消费端核验时应检查该前提（definition 内已声明）。
- **合法口径修改示例**：把 `refund_amount.refund_to_payment_period` 翻为 `false`（归属退款完成期间）→ 发布新版本 → 同一批数据的 `net_sales` 计算结果真实变化（退款计入不同期间）。**该演示已发布**：`net-sales-instance@1.0.1`（v1.0.0 = 归属支付期间，v1.0.1 = 归属退款完成期间；内容指纹不同，v1.0.0 快照字节不变），消费端可直接用两版做"合法改口径 → 计算真实变化"的对照验收。
- 场景：`net_sales_review`（净销售额 ← 销售侧 gmv / 退款侧 refund_amount；guardrail `refund_rate`）。问题树是参考骨架——Agent 发现退款数据缺失或归属歧义时应转向调查（如先补数据），不得硬算。

## 7. adoption receipt（采用回执，格式冻结）

消费端每完成一个真实任务，回传一份 YAML 回执；工作台侧登记（批次 2 实现）：

```yaml
task_id: <消费端任务唯一标识>
package:
  id: net-sales-instance
  version: 1.0.0
  content_fingerprint: sha256:<64hex>     # 与 releases/index.yaml 对账
  package_fingerprint: sha256:<64hex>     # 包完整性校验
adopted_metrics:                            # 实际进入本次计算口径的指标（非全部包内指标）
  - name: net_sales
  - name: gmv
  - name: refund_amount
adopted_scenarios:
  - id: net_sales_review
issues_found:                               # 口径歧义 / 缺失信息 / 试用问题
  - kind: caliber_ambiguity                # 枚举：caliber_ambiguity | missing_data | trial_issue
    metric: refund_amount                  # 可选，指向具体指标/场景
    detail: <一句话问题描述>
computed_at: <ISO-8601>
```

## 8. 批次 2 状态（2026-10-12）

- **2a 已完成**：契约修订为 v0.3（消费方基线事实勘误——Blueprint v4.2/A-02/N04 本机不可定位，实测基线 = Xanthil local-analysis 切片；手动安装模式与 adoption receipt 升格为 §6.1/§6.2 正文）
- **2b 已备料待启动**：JuanerAI 侧 Change 输入包见 `docs/juanerai-change-input-xanthil-sap-install-v0.1.md`（按 JuanerAI 自身宪法流程带入：UI 门 → OpenSpec → Test → Worker → Validator）；metric-factory 不直接改 JuanerAI 代码
- 批次 3（净销售端到端五点验收）待 2b 落地后执行
