# 固定候选接入差异 DP-RECOVERY-01

## 已批准要求和实际反例

006r1冻结产品输入proposal.md“002补充”规定：主请求后的备用/失败恢复共用一次额外尝试，native retry关闭，不允许叠加恢复；若固定插件/SDK不满足，先报告实际差异，不擅改业务副本。

本次固定业务源`8ae652ce53fc27d3be92098517643a419f9b73eb`、SDK0.4.1原tgz、原lock，以及实际安装SDK45文件逐字节核对后，用**原createExtractionRunner + 原createRuntime/createPiTransport + 原FileBudgetStore/JsonlAuditSink**执行合成反例：

1. 主请求的注入HTTP响应503；真实codec分类为可恢复失败。
2. SDK一次备用请求返回SSE中的坏JSON；真实codec正常解码文本，插件解析失败。
3. 插件格式修复又调用一次runText，新请求重新获得一次SDK恢复额度。
4. 新主请求503，备用返回有效JSON；最终返回成功行动项。

实际模型调用顺序`primary, fallback, primary, fallback`，计数4；批准上限2。账本记录modelCalls=4、inputTokens=20、outputTokens=16424、reservedOutputTokens=16384；未知预留没有退款。本反例不指控漏计，不把未知预留解释为真实费用。

证据在同一持久根：`check-extraction-recovery-codec.mjs`、`recovery-synthetic-002.log`（exit1，违反恢复额度断言）、`recovery-synthetic-002/result.json`、`recovery-synthetic-002/{ledger.json,audit.jsonl}`。夹具先验证最终确有一条行动项，再断言请求数，避免未进入分支的假通过。前次普通Error夹具只产生1次调用，没有触发可恢复分类，保留为`recovery-synthetic-001`，不能作为恢复边界PASS。

没有真实Provider网络、密钥或报告；所有HTTP响应由createPiTransport的fetch注入在内存返回。native maxRetries=0静态可见，本反例的4次不是HTTP客户端自动重试。

## 工程判断

固定实例的HTTP/DB闭环已验证；此失败阻断把当前抽取链直接采用为已符合006r1消费合同的产品实现。不得通过放宽宿主为4次、修改固定副本业务、清掉原FAIL或只测试成功首请求来收口。

首选在插件原仓修正抽取链的恢复协调，形成新固定候选后由宿主核对差异再采用。它属于已有业务解析重试与运行恢复的真实重叠，不是新功能或通用插件平台。宿主仍必须实施材料/接收方/权限准入；不把额外的重复恢复算法塞进宿主来分叉插件业务。具体协调机制留给原仓实现，不预定新增SDK接口或升级。

## 建议授权的最小修正包（尚未执行）

- 插件原仓的隔离工作分支，从上述固定业务提交建立；保留MacBook当前活动工作树/独立版和全部旧包。
- 仅修正`server/agent/extract.ts`及必要的既有装配接点/对应测试，必要文档记录；以一次逻辑抽取共用恢复额度为验收，不重复实现抽取/normalize，不新增Runtime、不升级SDK。
- RED为上述真实codec反例；GREEN至少覆盖首请求成功、首请求有效但坏JSON后修复、主失败后备用成功、主失败后备用坏JSON不得再发第三次；同taskId历史累计和并发项目不能串额度，手动重抽须沿已有已核清前置而非自动新Task ID重置。
- 所有尝试仍经原授权/账本/审计；未知预留不清零、不退款、不伪造取消。保留独立版兼容路径；若修正必须改变独立版批准业务策略或SDK公共合同，先报告这个具体增量。
- 仅合成确定性验证；无Provider、真实数据/凭据、飞书、旧数据迁移、现有服务切换或发布。修正后的源码必须有新固定身份和差异说明，当前8ae652ce原件不覆盖。
- 原仓修正完成后回到本JuanerAI分支，复验新物料同一闭环及恢复边界，再继续来源关联、宿主UI和生命周期接线。此授权不代替最终Validator、产品接受或Git发布许可。

当前原仓权限仅只读取材；需要用户授权这个新增写入范围。用户可选择暂缓此修正并保留当前可读/合成验证成果；不能将暂缓记录为接入完成。
