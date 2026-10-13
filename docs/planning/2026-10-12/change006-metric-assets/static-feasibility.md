# Change006 · 静态可行性与集中架构评估请求

2026-10-12 · 依据 JuanerAI `4df7604621fff2c8ec27281d59cf4a788deae47b` 和 metric-factory `a7c08185ee1691e641011b53d5bb87374d0b5b89` 的实际源码。**本轮静态评估，不是运行验证、工程接收或另一个架构session的结论。** 产品行为、决定与验收以[方案](proposal-v0.1.md)为准。

## 1. 结论

架构上有可复用链，不需重选Runtime或先建设完整语义平台。但不能称“仅接一个导入按钮”：缺少SAP候选／批准与精确消费记录，现有IR没有通用资产公式／比率解析，退款净额也没有退款侧状态／完成期间筛选与双归属合同。

原供应两包的公式环／ratio缺失／未知精确方法作为历史反例保留；2026-10-13已收到并核对正式修正版@1.1.0／@1.1.1及设计态方法定义，见[接收记录](supplier-receipt-2026-10-13.md)。D1～D3已采用，本轮继续规划复审，不启动工程；已有源码接点评估不因供应资产发布变成消费者实现证明。

## 2. 已有真实调用链与最小增量

| 面 | 原样复用的源码／已有证据 | 必要接线或增量；不是现有事实 |
| --- | --- | --- |
| Context／Binding | [open-analysis-context.ts](../../../../packages/product-core/open-analysis-context.ts) `compileOpenAnalysisContext`：获准源／表头、任务目的、语义／单位、当前物理Binding与范围检查；不是事后摘要 | 受批准资产的业务类型／版本来源进入Context，专业定义与客户字段映射分离；供应binding仅草案。项目一次配置可复用，当前任务仍重绑 |
| 实际IR与提交 | [open-analysis.ts](../../../../packages/application/open-analysis.ts) `persistFramework` 实际编译、context hash、Store保存；`calculate_and_verify` 真执行选定plan、重读source、调用config.verify并保存合格步骤 | 资产定义／公式／聚合与任务数据通过同一准入；不能经另一条计算后补hash。任务框架／结果／采用记录的真实提交边界需工程补齐 |
| IR支持面 | [open-analysis-ir.ts](../../../../packages/product-core/open-analysis-ir.ts) 已声明1.0～2.3的sum/count/min/max/mean、union、会员、文档引用、退款关联、单位、加权、份额、贡献、分配、对账 | 增补有限资产度量／count-distinct／同包无环算术／ratio；安全解析、单位／粒度／依赖检查。已有group_share不是任意ratio，任意Python探索也不能自动变成已核验资产计算 |
| 退款关联 | [open-analysis-join.ts](../../../../packages/product-core/open-analysis-join.ts) `compileOpenJoinIR`：唯一订单／退款ID、孤儿／负值拒绝、1:N退款合法；`calculateJoin`原订单金额只计一次、多退款累计扣减 | 当前退款端 `group_by:null,filters:[]`，所有退款跟随被选订单分组，无退款状态／完成时间／观察截止参数；两种归属及窗口外订单本期退款须实质增量，不能称refund_net已支持它们 |
| 独立核验 | [open-analysis-verification.ts](../../../../adapters/analytics-duckdb/open-analysis-verification.ts) `verifyRefundNet`反向读原始行，以订单身份归组并独立精确算术；[join单测](../../../../tests/unit/xanthil-desktop/open-analysis-join.unit.test.ts)覆盖多退款／伪结果／关联冲突／混合换算 | 新资产公式／状态／期间／去重／ratio各自相称独立路径，源提取资格另验；不能只重用主执行闭包结果或同一代码 |
| 方案／历史复用 | [open-analysis-plan-reuse.ts](../../../../packages/product-core/open-analysis-plan-reuse.ts) 去除旧数据／事实／执行ID、保留适用recipe；[workspace](../../../../packages/application/open-analysis-workspace.ts) 需求沙盘、preview/adopt revision、读回报告等 | SAP新版本与原历史方案不是同一对象；保存不可变包与一次批准范围，结果／回执绑定实际采用身份，旧消费者继续可读 |
| 运行／安全 | 005 [release-v13](../../../../openspec/changes/xanthil-browser-multisource-membership-analysis/release-v13.md)限定真实多轮、停止／UNKNOWN、SDK0.4.3／Pi0.86.1、持久账本及浏览器正常路径证据；现有Pi Adapter／业务Ports／Profile | 新资产业务工具经过原授权与停止，不另写Pi/Harness循环；资产导入无Provider效果。标准入口已读，旧标准头部“未采用”不覆盖005真实接收记录；本期无SDK升级 |
| 导入／回执 | 当前packages/adapters/profiles/apps定向搜索未找到SAP或metric-factory消费；供应格式源码在本包附件 | 安全文件入口、合法候选／复用批准、精确版本不可变Store及采用回执出口。不能把现有通用文件理解当专门资产合法校验 |

匹配当前HEAD的codebase_memory索引不可用（53索引中无本工作树／本HEAD）；本轮用当前rg／源码复核，未以旧图冒充生产结构，未重建索引。这里给接点而非冻结Mini的路径、类型、命令或schema。

## 3. 原两包与供应实现的历史静态差异

[source-readback](source-readback.json)含逐原件字节／SHA／Git blob、完整YAML解析、两种指纹重算与逐字段差异。

| 检查 | 静态结果／对方案的影响 |
| --- | --- |
| 版本／双指纹 | 两份包与index匹配；各55指标、2场景、bindings为空；package/version/时间/generator及退款归属开关有差异。指纹匹配不等于公式可算 |
| 可计算闭包 | `gmv=uv*cvr*aov`，`aov=gmv/order_count`；依赖环真实存在。禁止在Xanthil将gmv默认为金额sum，同时假称消费原公式 |
| ratio | refund_rate没有type_params；order_count旧开关排除已退款订单。供应需明确真正分子分母／同窗／订单口径，不拿文字／LLM猜测补成固定正确性事实 |
| method | 包引用`dame.m2.driver_decomposition@1.0.0`；当前代码精确字符串搜索未定位它。会员M2是不同任务，不自动别名。供应修正版引用须与消费方支持方法语义相符 |
| 场景完成 | net_sales_review声明13周序列／退款记录。可以自主路线，不能声称仅两期两个数字即完成整个场景；建议合成13周+两段比较统一验证 |
| 消费校验 | [validate.ts](attachments/metric-factory/src/sap/validate.ts)确实缺未审LLM消费拦截，也不检查完整公式依赖环／ratio参数完备／consumer计算支持；不直接复制当全部安全规则 |
| 规范／schema | 合同文件名v0.1、正文v0.3；SAP schema字符串0.1；发布版本1.0.x分别识别。固定[canonical.ts](attachments/metric-factory/src/sap/canonical.ts)采用五键content清空／package自引用清空；不以普通JSON或自造YAML摘要代替 |
| 回执 | [receipt.ts](attachments/metric-factory/src/sap/receipt.ts)采用task_id slug文件拒绝重复；仅id@version＋content匹配作对账，不独立核算。每次正式采用结果须唯一task_id且本地能反查产品任务／revision／Run；不把成功根task_id无限复用 |

本轮只执行只读固定文件解析、byte comparison和纯canonical函数；未运行供应CLI／服务／发布／回执登记、未运行产品分析或安装依赖。既有供应单测／CLI测试作为上述格式及不可变发布规则参考，未重跑，不借其PASS证明006消费者。

## 4. 分层责任与安全

保持 Core→Application→业务Port→Adapter→Profile。建议：SAP格式／字节／YAML规范化在文件Adapter边界解析成JuanerAI业务对象；Core负责适用定义／批准／不支持与IR约束；Application唯一业务状态与提交协调；原Store Adapter保留不可变来源／记录；Profile选择装配。具体模块／存储位置／兼容迁移由Mini决定，不把供应TS/Zod/Pi类型带进业务Core、不建立通用插件注册表。

最小Owner不要求企业权限平台，但必须明确本项目批准主体、范围、版本、撤销与新任务复用条件；reviewed_by仅供应审核来源。concept source不访问网络，也不声称Ontology已解析；所选计算确需未知概念或客户解释时阻断依赖。

不可变保存、candidate→approved配置提交、计算／核验／报告→采用完成提交是三个不同效果。无需都做成前台步骤；要有原子生效、冲突拒绝、失败读回和旧结果可读的业务合同。后台记录不授予资产代码／外发／路径权限，不自行清旧状态或创建新服务。

## 5. 归类

- **原样复用：**005工作台／沙盘、任务范围与许可、现有IR／计算器与独立核验基础、持久框架／报告／历史、有效Runtime及停止恢复。
- **最小接线／增量：**文件SAP校验与项目批准、精确语义版本进入现有链、有限公式与ratio、双退款归属及独立核验、回执／来源可见。
- **决定与剩余：**D1～D3已采用、正向修正版已接收；仍待新增UI接受、适用复审、实际试用／新增材料许可与取得基线后的量化目标。普通事务／类型／接口不加跨Controller审批。
- **暂缓：**全平台、API／MCP、跨包、完整Ontology／Domain Pack、自动供应同步、专业方法大全、Runtime升级、自动行动；完整N04／N09及反馈闭环留原路线。

## 6. 供用户转发的集中架构评估请求

> 请只读评估本Change006方案、UI Contract及固定附件，不启动生产或修改供应仓。消费基线4df7604621fff2c8ec27281d59cf4a788deae47b，正向供应8f47913c954f5650c8718a341add9feeea50d5d0（@1.1.0／@1.1.1，净销售六指标闭包、场景0.2.0、dame.descriptive_delta_decomposition@0.1.0设计态定义）；原供应a7c08185ee1691e641011b53d5bb87374d0b5b89只作历史反例。请按“可原样复用／必需增量／承重产品取舍／普通工程细节”返回一份结论，不再泛化Runtime选型。
>
> 重点：①SAP安全格式Adapter到现有Context／Binding／IR的业务接点；②退款双归属、状态、观察截止、窗口外订单与1:N以及ratio／去重的主算与独立核验范围；③有限无环算术／所选聚合／精确method refs与拒绝语义，当前原两包循环和ratio缺失不能暗改；④项目Owner一次批准、旧任务精确版本、新任务重新数据绑定／授权和停止恢复；⑤双指纹、同id@version字节冲突、配置及结果／采用记录提交、supplier task_id唯一和回执脱敏；⑥浏览器来源／文件安全与无新代码／网络效果。SDK机制复用，产品语义、存储、事务和数据许可仍归宿主。
>
> 判断建议范围能否形成同一版本的净销售完整任务；若有不能满足的承诺，提供最小替代及影响，不删护栏、改验收或扩成平台。D1～D3已采用且两版正向材料已固定；模型／资料权限未新增，供应设计态方法仍须真实实现。静态可行不等于冻结或开工。

本请求尚未发送；用户自行需要时转交。没有另一个session的新结论，不虚报“架构已批准”。
