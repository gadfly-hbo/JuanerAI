# 附件：Xanthil 首个 Change 两场景验收合同

> 状态：`xanthil-phase-one-product-plan.md` 的冻结产品规划附件
> 日期：2026-08-23
> 适用范围：首个假设先行分析 Change 的两个合成验收场景
> 边界：本文冻结场景产品语义、确定性 oracle、Hypothesis/Strategy 映射与正负验收边界；不授权 OpenSpec、实现、依赖、Schema、分支、真实数据或真实模型调用。

## 1. 共同行为

- 两个输入都是产品验收包提供的闭合合成 fixture；首个 Change 不接收真实用户数据或任意 CSV。
- 每个 fixture 的精确字节、source identity/checksum、Artifact 编码与资源上限由 OpenSpec 固化，但不得改变本文的行、字段、值、业务语义或 oracle。
- 输入必须完整匹配对应闭合 Schema；缺列、额外列、重复 identity、非法值、时间不合法、值域不符或 source identity 不一致均 fail closed，不得静默清洗为另一个场景。
- Gate 1 只允许用户确认字段解析、只读输入和不覆盖原文件的准备计划；这两个 fixture 不需要排除重复记录或填补业务值。
- Gate 2 只确认本文冻结的 Hypothesis、计算、Evidence、LLM egress payload 和停止条件；首个 Change 不支持在 Session 内改写场景语义。
- Gate 3 只确认或拒绝带 Evidence 的报告与非执行性 Action Recommendation；任何 Recommendation 都不授权 Action。
- 每个场景只允许本文列出的只读 Hypothesis/Strategy 条目。条目以本文 identity 和附件版本或内容 hash 进入 `ScenarioLibrarySnapshot`。

## 2. 场景 M：会员复购率下降

### 2.1 问题与边界

- 用户：Data Analyst。
- 问题：`2026-08-08` 至 `2026-08-14` 的窗口内复购会员率是否相较 `2026-08-01` 至 `2026-08-07` 下降；哪些 `member_segment`、`channel` 或 `product_category` 的可观察结构与组内变化对差值形成负向贡献？
- Decision 边界：支持分析师决定下一步验证哪个分群或业务口径；不决定会员触达、优惠、资格、价格或任何自动动作。
- 粒度：每行一个不同的合成订单；`order_id` 唯一。
- 人口：每个窗口内至少有一个订单的会员；窗口互相独立。
- 基准期与近期均为含首尾日期的 UTC 日历日。

### 2.2 闭合 fixture `member-orders-v2`

```csv
order_id,member_id,ordered_at,member_segment,channel,product_category,order_amount,discount_amount
ORD-001,M-001,2026-08-01,core,web,A,100.00,0.00
ORD-002,M-001,2026-08-02,core,web,A,120.00,10.00
ORD-003,M-002,2026-08-01,core,store,B,80.00,0.00
ORD-004,M-002,2026-08-03,core,store,B,90.00,5.00
ORD-005,M-003,2026-08-02,core,web,A,110.00,0.00
ORD-006,M-003,2026-08-04,core,web,A,130.00,10.00
ORD-007,M-004,2026-08-03,premium,store,A,200.00,20.00
ORD-008,M-004,2026-08-05,premium,store,A,220.00,20.00
ORD-009,M-005,2026-08-06,premium,web,B,150.00,0.00
ORD-010,M-006,2026-08-07,premium,store,B,160.00,10.00
ORD-011,M-001,2026-08-08,core,web,A,105.00,0.00
ORD-012,M-002,2026-08-08,core,store,B,85.00,0.00
ORD-013,M-003,2026-08-09,core,web,A,115.00,5.00
ORD-014,M-004,2026-08-10,premium,store,A,205.00,15.00
ORD-015,M-005,2026-08-11,premium,web,B,155.00,0.00
ORD-016,M-006,2026-08-12,premium,store,B,165.00,10.00
ORD-017,M-007,2026-08-13,new,web,A,70.00,0.00
ORD-018,M-008,2026-08-14,new,store,B,75.00,0.00
ORD-019,M-009,2026-08-13,new,web,B,60.00,0.00
ORD-020,M-009,2026-08-14,new,web,B,65.00,0.00
```

字段语义：

| 字段 | 规则 |
|---|---|
| `order_id` | 非空、唯一、`ORD-[0-9]{3}` |
| `member_id` | 非空、`M-[0-9]{3}`；仅为合成描述 identity |
| `ordered_at` | 严格 `YYYY-MM-DD`；决定窗口归属 |
| `member_segment` | `core | premium | new`；同一会员在 fixture 内保持一致 |
| `channel` | `web | store`；同一会员在 fixture 内保持一致 |
| `product_category` | `A | B`；同一会员在 fixture 内保持一致 |
| `order_amount` | 非负两位小数 |
| `discount_amount` | 非负两位小数且不大于 `order_amount` |

### 2.3 计算与 oracle

窗口内复购会员率沿用当前 `local-analysis` 的精确定义：

- `member_order_count(m,w) = count(distinct order_id)`；
- `active_member_count(w) = count(distinct member_id where member_order_count >= 1)`；
- `repeat_purchaser_count(w) = count(distinct member_id where member_order_count >= 2)`；
- `repurchase_member_rate(w) = repeat_purchaser_count / active_member_count`；
- `delta_pp = (recent_rate - baseline_rate) * 100`。

总体 oracle：baseline `10` 单、`6` active、`4` repeat、`66.7%`；recent `10` 单、`9` active、`1` repeat、`11.1%`；差值 `-55.6 pp`，`H-M-001` 为 `supported`。整数精确比较，率使用精确有理数计算、显示到一位小数。

对每个维度分别计算 midpoint decomposition。对分组 `g`，`w` 是该组 active-member share，`r` 是该组窗口内复购率：

`contribution_g = (w_recent - w_baseline) * (r_recent + r_baseline) / 2 + (r_recent - r_baseline) * (w_recent + w_baseline) / 2`

每个维度内各组贡献之和必须等于总体 rate delta；不同维度之间不得再次相加，也不得解释为因果。oracle：

| 维度 | 分组贡献 |
|---|---|
| `member_segment` | `core -50.0 pp`、`premium -16.7 pp`、`new +11.1 pp` |
| `channel` | `store -33.3 pp`、`web -22.2 pp` |
| `product_category` | `A -50.0 pp`、`B -5.6 pp` |

### 2.4 Hypothesis 与 Strategy

| identity | 内容 | 判定 |
|---|---|---|
| `H-M-001` | 近期窗口内复购会员率低于基准期 | delta `< 0` 为 `supported`；delta `>= 0` 为 `rejected`；分母无效或证据不一致为 `inconclusive`/BLOCK |
| `H-M-SEGMENT` | 至少一个会员分层对差值形成负向描述性贡献 | 最小组贡献 `< 0` 为 `supported`，否则 `rejected` |
| `H-M-CHANNEL` | 至少一个渠道对差值形成负向描述性贡献 | 同上 |
| `H-M-CATEGORY` | 至少一个品类对差值形成负向描述性贡献 | 同上 |

| strategy identity | 允许触发 | Recommendation |
|---|---|---|
| `STR-M-OVERALL-VERIFY` | `H-M-001 supported` 且总体 Evidence PASS | 在更长、获准的数据窗口复核下降是否持续；不宣称原因、不执行会员动作 |
| `STR-M-GROUP-VERIFY` | 任一分组 Hypothesis `supported` 且对应 decomposition Evidence PASS | 优先验证该维度中负向贡献最大的分组及替代解释；不把贡献写成根因 |

任何 Hypothesis 为 `rejected`/`inconclusive`、Evidence BLOCK 或映射条件不完整时，不生成对应策略；报告写“无获支持的策略建议”。

## 3. 场景 T：客服工单处理时长异常

### 3.1 问题与边界

- 用户：Data Analyst。
- 问题：`2026-08-08` 至 `2026-08-14` 打开的已解决工单，其平均处理时长是否高于 `2026-08-01` 至 `2026-08-07`；哪些 `channel`、`priority` 或 `issue_type` 分组对差值形成正向描述性贡献？
- Decision 边界：支持分析师决定下一步检查哪个分组和流程环节；不调整排班、优先级、SLA、员工绩效或工单状态。
- 粒度：每行一个不同的合成已解决工单。
- 人口：在对应 UTC 窗口打开、且 `resolved_at >= opened_at` 的工单。
- 处理时长：`resolved_at - opened_at` 的精确小时数；总体指标是窗口内算术平均值。

### 3.2 闭合 fixture `support-tickets-v1`

```csv
ticket_id,opened_at,resolved_at,channel,priority,issue_type
T-001,2026-08-01T09:00:00Z,2026-08-01T11:00:00Z,email,normal,billing
T-002,2026-08-01T09:00:00Z,2026-08-01T12:00:00Z,chat,normal,technical
T-003,2026-08-02T09:00:00Z,2026-08-02T13:00:00Z,email,high,technical
T-004,2026-08-03T09:00:00Z,2026-08-03T14:00:00Z,chat,high,billing
T-005,2026-08-04T09:00:00Z,2026-08-04T12:00:00Z,email,normal,billing
T-006,2026-08-05T09:00:00Z,2026-08-05T13:00:00Z,chat,high,technical
T-007,2026-08-06T09:00:00Z,2026-08-06T11:00:00Z,email,normal,technical
T-008,2026-08-07T09:00:00Z,2026-08-07T14:00:00Z,chat,high,billing
T-009,2026-08-08T09:00:00Z,2026-08-08T13:00:00Z,email,normal,billing
T-010,2026-08-08T09:00:00Z,2026-08-08T15:00:00Z,chat,normal,technical
T-011,2026-08-09T09:00:00Z,2026-08-09T17:00:00Z,email,high,technical
T-012,2026-08-10T09:00:00Z,2026-08-10T19:00:00Z,chat,high,billing
T-013,2026-08-11T09:00:00Z,2026-08-11T14:00:00Z,email,normal,billing
T-014,2026-08-12T09:00:00Z,2026-08-12T16:00:00Z,chat,normal,technical
T-015,2026-08-13T09:00:00Z,2026-08-13T18:00:00Z,email,high,technical
T-016,2026-08-14T09:00:00Z,2026-08-14T20:00:00Z,chat,high,billing
```

字段语义：`ticket_id` 唯一且匹配 `T-[0-9]{3}`；时间必须是严格 RFC3339 UTC；`channel = email | chat`；`priority = normal | high`；`issue_type = billing | technical`。缺失 `resolved_at`、负时长、重复 identity、额外字段或枚举外值均 fail closed，不作为“未关闭工单”静默排除。

### 3.3 计算与 oracle

- baseline：`8` 张，平均 `3.5 h`；
- recent：`8` 张，平均 `7.5 h`；
- recent-minus-baseline：`+4.0 h`；`H-T-001` 为 `supported`。

分组贡献使用与场景 M 相同的 midpoint decomposition，但 `w` 是工单数占比、`r` 是分组平均处理小时数。每个维度内贡献之和必须等于 `+4.0 h`：

| 维度 | 分组贡献 |
|---|---|
| `channel` | `chat +2.125 h`、`email +1.875 h` |
| `priority` | `high +2.500 h`、`normal +1.500 h` |
| `issue_type` | `technical +2.125 h`、`billing +1.875 h` |

计算保持精确有理数，用户显示到一位小时；分组贡献只描述差值构成，不证明流程因果、人员责任或 SLA 违约。

### 3.4 Hypothesis 与 Strategy

| identity | 内容 | 判定 |
|---|---|---|
| `H-T-001` | 近期平均处理时长高于基准期 | delta `> 0` 为 `supported`；delta `<= 0` 为 `rejected`；证据不一致为 `inconclusive`/BLOCK |
| `H-T-CHANNEL` | 至少一个渠道形成正向描述性贡献 | 最大组贡献 `> 0` 为 `supported`，否则 `rejected` |
| `H-T-PRIORITY` | 至少一个优先级形成正向描述性贡献 | 同上 |
| `H-T-ISSUE` | 至少一个问题类型形成正向描述性贡献 | 同上 |

| strategy identity | 允许触发 | Recommendation |
|---|---|---|
| `STR-T-OVERALL-VERIFY` | `H-T-001 supported` 且总体 Evidence PASS | 在更长获准窗口复核时长上升，并检查排队与处理时间是否可分离；不改变真实流程 |
| `STR-T-GROUP-VERIFY` | 任一分组 Hypothesis `supported` 且对应 decomposition Evidence PASS | 优先检查正向贡献最大的分组及替代解释；不归因到员工、SLA 或根因 |

未满足映射时输出“无获支持的策略建议”。

## 4. 最小正负验收

- 两份精确 fixture 产生上述总体与分组 oracle、Hypothesis status、Evidence 和允许的 Strategy 映射；
- 任一确定性计算与独立验证、报告值或 Evidence 不一致时 BLOCK，不能成功；
- 任一输入 identity、字段、枚举、时间、金额或闭合行集被改变时，正向 fixture preflight 失败；
- Gate 1/2/3 的 `rejected` 或 `cancelled` 分别阻断准备、Run 或成功锁定；
- LLM payload 只含主方案与生命周期附件枚举的合成 aggregate 和 Evidence identity；任何 row identity、原始行、prepared detail、自由文本或未知字段均被拒绝；
- 两个维度的贡献不得跨维度相加、不得写成因果，Recommendation 不得被表述为 Decision 或 Action。
