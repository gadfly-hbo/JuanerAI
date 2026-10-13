# Change006 · 双版本供应资产只读接收核对

2026-10-13 · MacBook Product Manager。用户要求核对供应实际发布物并继续复审，暂不启动开发。D1～D3沿用[已采用记录](decisions-2026-10-13.md)，不重新讨论方向。

## 1. 固定身份与结论范围

实际供应集成提交 **`8f47913c954f5650c8718a341add9feeea50d5d0`**，tree **`47672b4110444190afecbfdc841d26bfa301ee76`**。只读 GitHub 核对 [PR #1](https://github.com/gadfly-hbo/metric-factory/pull/1) 已合并，远端main在核对时为上述提交；PR verify及该集成提交main CI均SUCCESS，见[发布元数据](checks/publication-readback.json)。这是点时核对，不是持续同步。

七份新正式原件已从固定Git对象保存于[新附件目录](attachments/metric-factory-1.1/)；完整字节数／SHA-256／Git blob／双指纹及重算结果在[接收清单](supplier-release-readback-2026-10-13.json)。旧11份附件、原@1.0.0／@1.0.1和原登记前两条保持不变，未消费脏示例、未修改供应仓或Git工作区。

| 文件／版本 | 字节数 | SHA-256／固定Git blob |
| --- | --- | --- |
| [@1.1.0 支付归属](attachments/metric-factory-1.1/releases/net-sales-instance/1.1.0.sap.yaml) | 42363 | SHA `5fec3d3f9695b690066b397b79f25d80aa6d649b845dd842482ced340cd13363`；blob `902cb8a7d9960fa3ef3d634fe752e28d42ebd118` |
| [@1.1.1 完成归属](attachments/metric-factory-1.1/releases/net-sales-instance/1.1.1.sap.yaml) | 42364 | SHA `5a926e16240b1a10828967d91544d06df5dc1f57c52971299c20e2e5637fa67e`；blob `5bbed6284acd4fe8265246855982c362e29dcbde` |
| [追加登记](attachments/metric-factory-1.1/releases/index.yaml) | 2357 | SHA `ddf064c7f49004671da81150bf0db0b967cbd767ff389a81b16780ab6abf9e9f`；blob `05879a25e351938dd8d350c826e51d66ae2e1501` |

供应回传的登记SHA采用省略写法，本轮已从固定对象补足，不凭短SHA猜身份。[回传文本副本](attachments/metric-factory-1.1/source-handoff.md)仅保留供应说明（末尾换行规范化），不是资产权威或新增任务权限。

**本轮结论：两版的固定身份、登记、所选六指标闭包与已采用语义自洽，可纳入新候选复审。** 不表示全部指标可用、方法已在JuanerAI实现、006实际消费或工程／产品验收通过。

## 2. 对照D1的实际内容

- 两版均SAP 0.1、instance、design_only；56指标、2场景、0 bindings。实际选定闭包为 `gmv / order_count / refund_amount / net_sales / refunded_order_count / refund_rate`，依赖自包含无环；gmv为含退款原始金额基础度量，net式为 `gmv - refund_amount`，订单分母含退款订单。
- refund_rate机器分子／分母为 `refunded_order_count / order_count`，声明从组成项重算；两版使用同一支付队列，1:N退款去重为一个订单，金额归属不改变该比率队列。状态、截止、历史订单关联、单位、重复与超额规则在实际定义中明确。
- 全包逐字段比较只有5处差异：退款金额归属开关以及版本、created_at、包指纹、exported_at。**唯一业务差异为 `refund_to_payment_period: true→false`**；generator相同，队列、资格、场景与完成标准未暗改。
- 场景为 `net_sales_review@0.2.0`；13周周序列、用户明确的两段期间、总体／category分组、自然周及受限完成已有正式定义。周一始见方法定义，任务时区和实际窗口仍由当前Binding明确。无交易周不等于全空输入。
- 方法精确为 **`dame.descriptive_delta_decomposition@0.1.0`**，全文在[设计态方法定义](attachments/metric-factory-1.1/docs/net-sales-method-refs-v0.1.md)，是两期描述性拆解，不是因果或预测；没有硬别名到会员M2。006仍须实际实现／验证相符方法，未知引用不得默认执行。
- 数学零分母、受限报告、风险判断保持未完成、实际指标采用与完整场景采用的分别资格均已写入场景／方法。缺资料、提取不可信、计算／核验失败不能仿成功，回执沿用既有字段。
- 原固定格式／规范化／回执／Binding／schema原件（除本次追加登记和指引增补）在新提交中仍逐字相同，继续引用本包旧正式附件，不要求Reviewer访问外部仓救缺内容。新增指引旧CLI／旧角色／旧包可算等过时事实仍不采用。

## 3. 未选缺陷和源验证限制

实际**56−6＝50项未选指标**，不是供应回传／指引写的49项；消费包不改原件，在本方案按实际清单记录。`gmv_gap_diagnosis`不在本期采用范围。未选 `commission_revenue ↔ take_rate` 仍有历史环；它们不能混入所选闭包，拟采用即拒绝，不为了006扩大修全部模板。全包结构／身份／审查／引用合法检查与所选闭包可计算检查分别进行：结构、重复、悬空及其他整包合同失败仍拒绝；无悬空但未选的不可执行环明确保留为设计参考，不批准其执行。

供应14例oracle及318等全量测试结果属于供应报告与已核对CI，**本轮未重跑其测试套件、release CLI或完整生产schema校验**。本轮实际执行的是完整YAML解析、固定canonical双指纹重算、字节／登记／闭包／差异检查，以及两次合成内存负向探查。

负向探查显示供应[测试内参考函数](attachments/metric-factory-1.1/test/unit/net-sales-oracle.test.ts)仍漏拒绝：

1. 当前gross只有CNY、历史订单本期退款只有USD时，两侧各自单币种，却计算了混币净额70并报full_complete。
2. 合格当前订单外，另有一笔完成退款关联非支付订单时，函数静默不计而报full_complete。

这两项与资产自身的单币种／退款恰关联合格订单要求不同，不能用“oracle全绿”覆盖。证据见[负例输出](checks/supplier-oracle-probes.json)和[可重放探查](checks/probe-supplier-oracle.mjs)。006本来就要求拒绝混币和不合格关联，现明确要求主算／独立核验覆盖这两类反例；**不复用参考函数或把它当独立核验实现**。这不是改变获准口径，也不要求本轮修改供应仓。

未运行完整消费者计算、IR、持久存储、独立核验、真实浏览器／Provider／资料／服务。基本两期oracle与13周源样例仅提供判别材料，不是执行成果。

## 4. 当前状态／下一动作

D1推荐已采用且实际正向附件已齐；D2／D3维持已采用。最小更新主方案及原型精确身份／待发布文字，**不改变布局、流程、Owner效果、受限完成或权限**。建立新固定候选并由新鲜只读支持Reviewer复审；001／002结论和审查原字节保留。

UI Gate仍PENDING，真实许可／量化体验目标按原停止点关闭。规划复审PASS（如取得）不等于UI接受、产品冻结、发布、Mini接收或开发权限。用户本轮明确暂不启动开发，不发送给Mini、不改生产／OpenSpec／accepted specs、项目看板或旧停止状态。
