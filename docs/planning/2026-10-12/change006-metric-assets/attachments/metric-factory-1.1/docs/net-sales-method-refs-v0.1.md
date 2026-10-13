# 净销售方法引用定义（设计态）v0.1

> 供应侧：metric-factory。本文档定义净销售修正版资产（`net-sales-instance@1.1.0`／`@1.1.1`）场景
> `net_sales_review@0.2.0` 引用的方法。**状态：设计态（design）**——由 metric-factory 定义，
> JuanerAI 未实现；消费方解析不到时不得臆造、不得静默替换为其他方法。本文档是有限范围的方法
> 定义（仅服务本修正），不构成通用方法注册平台。

## 1. 方法条目

### dame.descriptive_delta_decomposition@0.1.0

净销售额两期描述性拆解（Descriptive Delta Decomposition）。

| 项 | 定义 |
| --- | --- |
| 目的 | 对用户指定的两段期间，把净销售额变化拆为成交总额侧与退款侧两个加性成分，回答「变化来自销售侧还是退款侧」 |
| 输入 | ① 近 13 周周粒度序列：`gmv`、`refund_amount`、`net_sales`；② 订单原始记录（订单身份、支付时间、支付金额、币种、支付状态、已声明分组属性）；③ 退款原始记录（退款身份、关联订单、退款金额、币种、退款状态、退款完成时间）；④ 显式声明的时区、`[开始,结束)` 期间边界、观察截止、金额单位、两段比较期间（由用户在 13 周内指定） |
| 窗口／分组 | 期间边界 `[开始,结束)`（左闭右开）；周按声明时区自然周（周一始）；比较期间 P1、P2 由用户指定；输出总体与声明适用分组（`category`，按关联订单属性分组，不暗改分类）两套结果 |
| 拆解公式 | `Δ净额 = Δ成交总额 − Δ退款额`（对每对期间、每个分组分别计算；`Δx = x(P2) − x(P1)`）。退款金额归属期间随包内开关 `refund_amount.refund_to_payment_period`（true=按支付期间，false=按完成期间）；支付队列退款率两版一致，按分子/分母重算 |
| 结果限制 | **描述性比较/拆解，不是因果归因，不是预测**。不回答「为什么变化」的因果贡献，只报告两侧加性成分。支付队列退款率（`refunded_order_count / order_count`）不等于本期全部完成退款金额的风险占比：完成归属下历史订单的本期退款计入退款额，但不入本期支付队列；报告必须区分两者。不得平均组内比例，不得聚合比率值 |
| 核验条件 | ① 恒等式核验：逐对（期间×分组）独立复算 `Δnet = Δgmv − Δrefund`；② 比率核验：退款率由分子分母独立重算；③ 资格核验：订单/退款身份唯一、每笔退款恰关联一个合格订单、状态映射符合包内声明；④ 异常阻断：孤儿退款、重复身份、负退款、混币、无合法解释的累计超额退款 → 阻断依赖，不静默剔除；⑤ 全空输入或全部订单资格失败 → 阻断；⑥ 合法零分母（合格非全空输入、所选窗口无合格支付订单）→ 退款率证据不足，按受限完成规则输出 |

#### 与 dame.m2.driver_decomposition@1.0.0 的关系

不做硬别名。`dame.m2.driver_decomposition@1.0.0` 在消费方（JuanerAI）未定位到对应精确实现，
且其语义（会员复购 M2 驱动拆解）与净销售两期拆解不同。消费方如需实现本方法，按本文档语义实现
并另行版本化；不得把本引用解析为 `dame.m2` 或任何会员域方法。

## 2. 有限消费范围（包语义承诺边界）

`net-sales-instance@1.1.0`／`@1.1.1` 所选闭包（`gmv`、`order_count`、`refund_amount`、`net_sales`、
`refunded_order_count`、`refund_rate`）承诺的消费能力仅限：

- 明确基础度量：sum（金额）、count／业务键 count-distinct（订单/退款身份去重）；
- 同包无环加减乘除派生式（`net_sales = gmv - refund_amount`）；
- 从显式分子/分母指标重算的比率（`ratio_policy: recompute_from_parts`）;
- 声明适用的维度（closure 各指标 `dimensions` ⊆ 包 `dimensions`）与粒度（day/week/month）；
- 两种退款金额期间归属（`refund_to_payment_period` true/false）。

不支持且不引入：任意 eval／SQL／脚本执行、跨包公式、滑动窗口、复杂 DSL、隐藏执行引擎。
`include_pending_refund` 两版均为 false，首期不支持翻为 true（翻 true 的效果未定义）。

## 3. 受限完成（restricted completion）规则

场景 `net_sales_review@0.2.0` 的 `output_spec` 与本节共同声明：

- **受限可完成的终点**：合格非全空输入中退款率出现数学零分母，且净额组件（gmv/refund_amount/
  net_sales 序列与拆解）和不足判定均通过独立核验 → 交付「分析完成 · 退款率证据不足」受限报告；
  不填 0%、Infinity，不宣称「风险正常」。
- **必须保持未完成的终点**：退款率数值判断与风险结论。若场景或用户承诺要求可用风险护栏，
  状态为「部分结果完成，风险判断未完成」，不得以受限报告取消承诺。
- **阻断（非受限、非成功）**：全空输入、资格失败、孤儿退款、重复身份、负退款、混币、无合法
  解释的超额退款 → 阻断依赖；不得把异常静默剔除后输出仿成功结果。
- 采用回执语义：真实执行且不足判定已核验的退款率可列入 `adopted_metrics`，同时以
  `issues_found.kind = trial_issue` 记录证据不足（脱敏一句话说明）；消费成立不等于数值可用。
  仅当场景明确允许该限制且其他必需证据满足时，才列入 `adopted_scenarios`。缺资料、提取不可信、
  计算或独立核验失败 → 不得输出仿成功回执或完整场景成功。

## 4. 供应侧验证与证据（不证明消费侧已接通）

- 源侧 oracle（可重放）：`test/unit/net-sales-oracle.test.ts`——合成订单/退款原始记录、显式
  时区/边界/观察截止、13 周范围与 category 分组、固定预期值表（含两种归属、队列退款率、历史
  订单本期退款、边界/截止/状态/1:N/阻断判别例），并对已发布快照做 schema 校验、双指纹复算、
  无环依赖与登记一致性检查。
- 供应侧 oracle 证明**定义与发布一致**，不证明消费方 IR、实际执行或独立核验已接通；该验证属于
  消费方（JuanerAI Change006 及后续任务）。
- 已发布快照：`releases/net-sales-instance/1.1.0.sap.yaml`（支付归属）、
  `releases/net-sales-instance/1.1.1.sap.yaml`（完成归属）；登记见 `releases/index.yaml`。
- 已知未选内容缺陷（显式钉住，不静默）：基模板 `ecommerce-marketplace@0.1.0` 的未选指标
  `commission_revenue`（expr `gmv * take_rate`）与 `take_rate`（numerator `commission_revenue`）
  构成第二个既有依赖环，与 `gmv↔aov` 环同源（模板历史缺陷），在新旧发布物中均存在。本修正按
  任务边界只修所选净销售闭包；该两指标属未消费设计参考，消费方不得将其与修正闭包混用，
  修复留待后续模板任务。
