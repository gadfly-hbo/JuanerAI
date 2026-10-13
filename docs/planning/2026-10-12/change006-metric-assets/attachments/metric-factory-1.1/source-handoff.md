供应侧修正与双版本正式发布已完成并集成到 main。以下为 Change006 只读接收回传包。

# Change006 回传包：净销售 SAP 资产修正与双版本发布

## 1. 设备／仓库／分支／集成状态

- 设备 `huangbodeMacBook-Pro.local`；仓库 `/Users/huangbo/Dev/Projects/metric-factory`（GitHub `gadfly-hbo/metric-factory`）；工作分支 `fix/net-sales-sap-1.1.x`（合并后已删，commits 保留于 main）
- 起点核对：`main` @ `a7c08185…` 与消费方固定研究来源一致；既有脏文件 `examples/ecommerce-instance.yaml`（无关示例微调）全程保留、未提交、未混入
- **发布集成 commit = `8f47913c954f5650c8718a341add9feeea50d5d0`（merge commit），tree = `47672b4110444190afecbfdc841d26bfa301ee76`**，`origin/main` 与本地一致
- PR：https://github.com/gadfly-hbo/metric-factory/pull/1（MERGED，2026-10-13T02:41:45Z）；required CI `verify` 在 PR 与 main 两轮均 pass（PR：actions/runs/38337953605；main：actions/runs/38338109312）
- 提交链：`88a8d82`（源修正）→ `02e8012`（发布+登记）→ `8f47913`（merge）；generator 记录的 `+88a8d82` 即源修正 commit，在 main 上可追溯

## 2. 两版发布物固定身份

| 项 | `net-sales-instance@1.1.0`（支付归属） | `net-sales-instance@1.1.1`（完成归属） |
| --- | --- | --- |
| Git 相对路径 | `releases/net-sales-instance/1.1.0.sap.yaml` | `releases/net-sales-instance/1.1.1.sap.yaml` |
| 字节数 | 42363 | 42364 |
| 文件 SHA-256 | `5fec3d3f9695b690066b397b79f25d80aa6d649b845dd842482ced340cd13363` | `5a926e16240b1a10828967d91544d06df5dc1f57c52971299c20e2e5637fa67e` |
| Git blob | `902cb8a7d9960fa3ef3d634fe752e28d42ebd118` | `5bbed6284acd4fe8265246855982c362e29dcbde` |
| package_fingerprint | `sha256:140e9ecf1510d3d64bf9f954a2d402cfa55bb88c398452c991ea53dec19dfa5b` | `sha256:6252da0699b8ab492351b44271e67e1dc9991a22ce1aa2f8161457ff7d1198bf` |
| content_fingerprint | `sha256:128bb1dc71a2104a0e11eb37968514c70c94b226eb78383417595a118b775595` | `sha256:3b4cd8cfa7f62ab7526dbef454b8fc2e8cad883cbdded44e0ce788406c573675` |
| created_at | 2026-10-13T02:37:26.306Z | 2026-10-13T02:37:39.537Z |
| generator（同一） | `metric-factory@0.1.0+88a8d82` | 同左 |

登记：`releases/index.yaml`（2357 字节，SHA-256 `ddf064c7…767ff389a81b16780ab6abf9e9f`，blob `05879a25e351938dd8d350c826e51d66ae2e1501`）追加为第 3／4 条，`file` 字段如上路径；`sap="0.1"`、`kind=instance`、`runtime_state=design_only`、56 指标／2 场景／0 bindings（Binding 草案仍为空，真实数据 Binding 属后续任务）。

## 3. 所选闭包、场景、方法与规则位置

- **闭包 6 指标**（定义正文均在两版快照 `metrics` 段；源文件 `examples/net-sales-instance.yaml`）：
  - `gmv`（simple 基础度量，无 type_params；原始成交金额、含后来退款订单、gross 只计一次、不先净额化；`include_refund=true` 与 net_sales 勾稽；运费/内部渠道为设计态声明默认、字段由任务 Binding 定）
  - `order_count`（队列分母；`include_refund` 翻为 true=含已退款订单，与 gmv 资格/窗口一致）
  - `refund_amount`（资格/身份/单位/超额阻断 + 两种期间归属语义；`include_pending_refund=false`，首期不支持翻 true）
  - `net_sales`（derived，`expr: "gmv - refund_amount"`；显式声明期净额可为负、不得因负拒绝合格非全空输入）
  - `refunded_order_count`（新增加队列分子；1:N 退款按订单去重；队列口径不随归属开关变化）
  - `refund_rate`（ratio，显式 `numerator: refunded_order_count / denominator: order_count` + `ratio_policy: recompute_from_parts`；零分母=证据不足不填 0%/Infinity）
- **场景** `net_sales_review@0.2.0`：13 周周序列、用户指定两段期间、总体 + 声明适用分组 `category`（按关联订单属性）、`[开始,结束)` 边界、时区/观察截止/单位由 Binding 显式声明、无交易周明确展示≠全空——见其 `evidence_requirements`；受限完成规则（可受限终点=净额序列与拆解；必须未完成终点=退款率数值判断与风险结论；九类阻断）见其 `output_spec`
- **方法** `dame.descriptive_delta_decomposition@0.1.0`（设计态，Δ净额=Δ成交总额−Δ退款额，非因果归因/预测；输入/窗口/分组/公式/结果限制/核验条件全文）：`docs/net-sales-method-refs-v0.1.md`；未硬别名 `dame.m2`，未声称 JuanerAI 已实现
- 有限消费范围与采用回执判别规则：同文档 §2／§3

## 4. 修正清单与差异核对

相对旧包修正：① 移除 `gmv=uv*cvr*aov` 恒等式（消除 `gmv↔aov` 依赖环）；② GMV 重定义为原始成交（旧定义“默认剔除退款订单”与 `include_refund=true` 矛盾已消除）；③ `order_count` 分母含已退款订单；④ `refund_rate` 从纯文字定义改为显式分子/分母 + 队列口径；⑤ 新增 `refunded_order_count`；⑥ `refund_amount` 补齐跨期不漏、历史订单不预过滤、身份/单位/超额阻断；⑦ 场景 0.1.0→0.2.0（13 周+分组+受限完成）；⑧ 方法引用换设计态定义。

**两版完整内容差异 = 仅 `refund_amount.caliber_switches.refund_to_payment_period: true → false`**（oracle 深度 diff 断言，其余 metrics/scenarios 逐字节相同；版本/时间/指纹元信息另计）。退款率、订单资格、完成标准两版一致。

旧版本不变核对：`1.0.0`/`1.0.1` 文件 SHA-256 = Prompt 固定值（`f78f606b…`／`319fd15f…`），blob 与任务起点 `a7c0818` 完全相同（`24da5c7a`／`54c0657e`）；index 前两条登记与原条目深度相等（oracle 钉死）。

未选内容（明确仍为未消费设计参考，勿与修正闭包混用）：其余 49 项模板指标（含 aov、uv、cvr、take_rate 等，保留模板默认口径与 `include_refund=false` 等开关）+ 模板种子场景 `gmv_gap_diagnosis@0.1.0`（仍含 uv×cvr×aov 参考树）。**未支持能力**：`include_pending_refund=true`、任意 eval/SQL/跨包公式/滑窗、因果归因方法。

## 5. 合成验证、检查结果与证据位置

- 可重放 oracle：`test/unit/net-sales-oracle.test.ts`（14 用例全绿）。固定值表 P1/P2、两期总计 180/30/150、退款订单数=1、历史订单本期退款（完成归属 0/30/−30、队列 0/0=不足非 0%）、13 周逐周序列、`[开始,结束)` 精确末端（支付与退款双例）、截止后完成排除、退款中/失败/取消排除、1:N、九类阻断（全空/资格失败/孤儿/缺历史订单/重复订单/重复退款/负退款/币种不符/超额/缺完成时间/同期混币）、分组重算且总体=分组和、合法零分母=restricted_complete vs 数值 0% 判别、方法恒等式逐对核验
- 包级检查：SAP 校验器零 issues、双指纹用 `src/sap/canonical.ts` 实际实现复算并与登记对账、闭包自包含且无环（旧包 `gmv↔aov` 环留证）、引擎负例（悬空分子/未知维度/不支持表达式/场景悬空引用→对应 rule 拒绝）、**源→发布可复现**（从 main 上的实例源+模板重导出，内容指纹与登记一致）
- 先红后绿证据：发布物生成前 oracle 7/14 失败（快照缺失+实例 true 态），发布后 14/14 绿；commit message 与 PR 描述均有记录
- 全量验证（在合并后 main 上复跑）：`npm run lint`（7 模板 PASS）／`typecheck` 0 错／`npm test` 318/318（51 文件）／`npm run contract-test` 1/1；CI 同命令两轮绿
- 未运行／不适用项：未调用任何 LLM/Provider、未安装依赖、未产生也不应产生消费者回执（供应侧合成验证不冒充 JuanerAI 运行、独立核验或真实采用）；消费方 IR/实际执行/独立核验未接通——本包不证明

## 6. 缺口与正向要求满足情况

- 发现并钉住（未修，超本任务边界）：未选模板指标 `commission_revenue`（`gmv*take_rate`）↔`take_rate`（分子 `commission_revenue`）构成第二个既有依赖环，新旧包同样存在，已在 oracle 断言与方法文档 §4 显式登记，修复留待模板任务
- 合同最小缺口（未扩 schema）：SAP 0.1 无包级共享语义段，时区/截止/状态映射等语义分散于指标 definition 与场景/方法文本；`modified` patch 不能改 type_params（故 gmv/refund_rate 走 removed+重加，provenance=manual 带 fork 说明）；SAP 校验器不镜像 type_params 引用（消费方义务，消费指引 §4 已有）；引擎无 expr 成环检测（模板存在历史环，故未加引擎规则以免破坏模板 lint）
- Prompt 正向材料要求逐项已满足：双版本发布与登记、闭包自洽、队列退款率两版一致、13 周场景+分组+受限完成、设计态方法引用及可访问定义、oracle 与阻断判别、旧版本与原登记零改动、正式 Git 集成（PR+required CI+merge）

**已到停止点**：供应修正、正式发布与回传完成。固定两版资产与登记可转回 Change006 做只读差异核对、新候选与独立就绪复审；未启动、未通知、未宣布 JuanerAI 侧任何工作，供应 CI/发布不构成消费者产品或 UI 验收。
