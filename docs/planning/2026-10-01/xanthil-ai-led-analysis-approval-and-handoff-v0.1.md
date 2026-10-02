# P1 产品／UI批准与Change004需求交接 v0.1

2026-10-01 · MacBook Product Manager。

状态：`USER_PRODUCT_UI_APPROVED / PUBLICATION_AUTHORIZED / FREEZE_CONDITIONS_PENDING / ENGINEERING_INTAKE_UNCONFIRMED`。本记录保存批准及本次交接范围，不另设Gate、工程状态或执行政策。

## 1. 直接用户批准与权限

用户在当前产品chat（`01a0e87b-25c6-7a10-b66a-597e38fb0e01`，标题“ChangeAgent-002—>003”）明确要求：

> UI等已审核通过，提交、推送；然后将本change的开发需求转发给Mac mini session：change-004

据此记录当前P1产品／UI方案通过用户审核；UI Gate为PASS。允许MacBook在现有工作分支提交并推送本包、按正常Git流程创建PR，然后将固定开发输入转发给已存在的Mini `change-004`。不把这条消息扩为main合并、生产实现、依赖安装、Provider、真实业务数据、服务、部署、试用或其他chat消息权限，也不宣称完整冻结或工程就绪。

Mini先核对准确输入、实际工作与停线；已接受产品方向和UI不重复审批。资源／体验等承重缺项须集中关闭后才能完成正式输入冻结、确认Engineering Intake及取得适用启动权限。F2是产品内任务资源profile，不是给工程代理新增修正次数或命令额度。

## 2. 身份与固定输入

- 发布责任：MacBook `huangbodeMacBook-Pro.local`；工作树 `/Users/huangbo/.codex/worktrees/e1d5/JuanerAI`；分支 `work/macbook/ai-led-member-analysis-product-plan`，发布前HEAD `3a5e9185d688b6274c88c03b7639b49dea930d67`。保持已有工作，无切分支、重置、重写历史或其他工程状态变更。
- 正式蓝图：[v4.1](juanerai-product-development-blueprint-v4.1.md)，PR55固定 `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`，tree `74e042fa0680a22ba29fd68e87f67f8ca6428301`，53578 bytes，SHA-256 `38639d60b0234c5c5922eb9fdc0c5220e47019374940240ab1915f22b4168052`；批准／审查与差异映射见[来源§1.1](xanthil-ai-led-analysis-source-and-baseline-v0.1.md#11-本轮有效规划依据blueprint-v41)。接收方明确确认采用，不从Git发布推定。
- 业务基线：001～003固定 `2bb18d7356289781a87a672dc3f7b9bd40341d87`；保留原规范、计算、存储、证据、报告、Decision／Expected及协作成果，Mini实际分支／未发布工作／WIP仍待其读回。
- 产品行为、范围、组织与验收：[阶段计划](xanthil-ai-led-analysis-stage-product-plan-v0.1.md)、[A/B组织](xanthil-ai-led-analysis-change-organization-v0.1.md)、[D1～D6及剩余决定](xanthil-ai-led-analysis-product-decisions-v0.1.md)、[三类验收／40项覆盖](xanthil-ai-led-analysis-acceptance-and-coverage-v0.1.md)。
- UI：[增量Contract](xanthil-ai-led-analysis-ui-contract-v0.1.md)和[可点击附件](clickable-ui-contract-ai-led-analysis-v0.1/index.html)、[回放说明](clickable-ui-contract-ai-led-analysis-v0.1/README.md)。继续002标准、PX004／006和中文优先。用户批准的四个可点击文件未再改动；不是实际IR／Provider／持久存储证据。
- 静态技术意见：[完整原文](reviews/xanthil-ai-led-analysis-static-architecture-assessment-001.txt)，仅静态可行；[回应及余项](xanthil-ai-led-analysis-architecture-assessment-request-v0.1.md)不重复派发。
- 独立规划：[Review003](reviews/xanthil-ai-led-analysis-development-readiness-review-003.md)限定Candidate003规划PASS，非实质纠正／中文读回分别绑定；v4.1仅版本对齐。001 NEEDS_CLARIFICATION、002限定PASS、原manifest和archive全部保留。此次批准状态更新不新增行为，不重复整套Gate。

后续发送消息必须给出实际已推送commit／tree、工作分支及PR身份，不在本文件自填未来提交SHA。此记录及下列输入由同一实际发布commit绑定；PR未合并时只表示分支交付，不称main已集成。

## 3. 给Mini的开发需求与责任

一个有限P1结果：非技术会员运营负责人从空白需求及获准双CSV开始，系统复用场景配置，持续推进到经独立验证的有限发现、可点评报告和人的明确下一步。支持总体M1、适用M2分组、表达点评、合法期间修改；错误前提、缺数／歧义、失败、停止／重开及提交不明有诚实结果。不是通用平台、第二行业、因果分析或现实行动自动化。

按已审核组织建议先A后B，工程内部仍小步可测试／回退。A先贯通G1和最小G2/G3真实消费者，从空白到验证发现和首待审报告，停止／有效成果保存／重开不自动执行不可后移；确定任务、结果和持久身份时先考虑B复合人审身份、精确版本、唯一提交及整体生效，不前置全B。B在同一能力上完成点评、必要重分析、完整恢复和最终人审。`change-004`是接收session名称，不预建OpenSpec ID，不因交接默认开放A/B并行或更多产品Change；具体包／合同由Engineering Controller按既有依赖与WIP组织。

必须实证：语义和方法配置被真实消费；合法计划决定执行分支及参数，M1-only的主算／独立复算均不执行M2，不支持／错配／无资格拒绝且不暗回固定流；结果和报告回链同一计划。任务grant不同于Attempt，后台复用有效授权、逐次准入、累计消耗及在途预算持久保留；三处计划校验和整体提交不变成前台审批。保留全空阻断、单期零分母不足、Expected护栏独立于依赖、查看／修改／保存／历史及有依据建议。

最终人审明确三个出口和正式效果；未知保存先读回、不能重复发布；系统验证不伪造人的接受。专业旧路径、Completed Assistant、旧Run／报告与003单层人工协作边界不降低。Pi内部对象留Adapter，复用现有Application／业务Port／计算／存储，不更换Runtime或从零重造。

阶段完成必须在同一固定集成候选同时通过SC／CAP／UX，保留40稳定ID的历史范围、预计增量及剩余缺口。随后来源足够就回访Action登记／Actual／评价，再受审核改进与下一Case显式采用；该完整闭环及资产库不加入P1。三类通过后仅可另议有界试用，权限另给。

## 4. 未关闭条件与下一允许动作

| 项 | 已批准／保持的边界 | 必须闭合或禁止推定 |
| --- | --- | --- |
| F1披露 | 按决定包封闭材料、用户明确选择文本、原始行／ID／组标签禁外发的保守建议准备；组计算与本地显示不等于模型披露 | 实际出站载荷、Provider接收方及小群体口径／阈值／遮蔽未由本次泛化批准填值；不外发组级材料，扩大或未明确的安全边界集中交用户 |
| F2产品任务资源 | 有限profile、任务累计预算／在途预留、恢复不清零；不用原型数值当默认 | 实际轮次／输出／计算／等待／有效期等仍UNKNOWN，冻结前根据既有控制能力提出推荐并由用户关闭；不批准新付费资源 |
| F3体验 | 先基线后目标，首次配置／首次任务／重复任务及隐藏维护劳动一起测 | 观察范围／权限、实际基线和事前目标未取得；集中提出测量安排，不能补猜门槛或把点击少／快报缺数当通过 |
| F4外部使用 | 当前交付离线合成方案及原型；本次仅Git与指定需求消息 | Provider、真实业务数据、依赖／服务／部署／安装／试用无新权限；工程内既有获准工具与新外部效果分开核对 |
| 完整冻结／接收 | 产品／UI审核与适用规划审查可沿用 | 不将本记录叫完整Product Input Freeze；Mini读回后集中解决剩余条件，在现行流程确认冻结、Intake及启动权限；不能跳过、不能重问已通过UI |

接收方先只读核对设备／仓库／分支／HEAD／tree／工作树、当前AGENTS／规划入口／执行政策／实际角色／真实WIP及旧停止条件，保存已有工作。通过Git取得下列精确输入；不在Mini现有工作树强切、重置、覆盖，也不接管MacBook发布分支写入。若产品输入分支未合入main，先作为固定需求源读取，不在旧main上默认开工；正常整合或独立工作分支方案须符合接收侧权限。

若缺项阻断，向用户集中提交带推荐的一份决定包；无需向MacBook寻求普通实现审批。完成读回前采用未确认；此前“等我通知”与未授启动边界不靠本记录转述消除。本次只向`change-004`转发需求，其他已完成／暂停任务不唤醒。

## 5. 发布与接收证据

本包包含Markdown产品输入、离线可点击HTML／JS／CSS和固定历史archive。无production、accepted specs、依赖、Runtime配置、工程看板或规则文件变更。**有可执行原型，不按纯docs-only跳过git-commit-push的适用full-index要求**；发布前完整范围／指纹、语法／引用／历史保护、独立一致性与fresh图身份／文件覆盖结果以本次实际回执为准，不预填验证PASS。

### 本次索引失败与用户一次性豁免

完整`mode=full / persistence=false`索引连续两次返回worker crash，已保留[原始失败记录](reviews/xanthil-ai-led-analysis-publication-index-failure-001.txt)，当时在暂存前停止，未提交／推送／转发。随后产品经理明确向用户请求“仅本次产品规划／离线UI包豁免完整图索引，按已完成语法、引用、来源哈希及独立一致性检查继续提交、推送并转发change-004”；用户直接回复“批准”。

据此只豁免本包此次发布的fresh图身份及图节点覆盖检查，继续实际文件／范围／指纹、语法、引用、历史保全、完整staged diff与独立一致性核对。不声明索引PASS、不将本包改称纯docs-only，不修工具或改政策。豁免不适用于后续生产、runtime、依赖、schema、测试／工具变更，也不放宽F1～F4、完整冻结／Intake、main合并或其他外部权限。

作者浏览器检查仍受file协议限制，未有实际渲染／点击／键盘／视口QA；用户已给UI Gate PASS，二者分开。业务测试、真实模型／数据、SC／CAP／UX实现及安装验证未运行，不据文档发布宣称产品能力完成。

正式材料与历史archive随本分支Git发布可由接收方取得；发布前未提交副本不算已Git保全资产。发布commit／tree、完整文件指纹、PR与发送工具回执见本次交付对话／PR；接收方回执必须说明采用版本、逐项读取／哈希结果、实际WIP和下一允许动作，不能由MacBook替填。Mini原始工程日志不存在于本包，没有声称跨设备保存那些日志。
