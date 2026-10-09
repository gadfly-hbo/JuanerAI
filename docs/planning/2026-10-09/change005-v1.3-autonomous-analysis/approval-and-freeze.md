# Change005 v1.3 · 用户批准、前向适用与 Product Input Freeze

2026-10-10，MacBook Product Manager。追加当前效力，不改受审产品／UI／流程／源附件、历史批准或审查身份。

## 1. 用户直接批准与本轮授权

用户在本产品任务直接回复：

> v1.3 方案全部审核通过，进行冻结发布，生成可转发Mac mini启动生产的prompt，由我转发。

本次适用于完整 v1.3 产品、增量 UI Contract、可点击附件和流程：**产品审核通过；新增／受影响 UI Gate PASS；Product Input Freeze 成立**。复用新鲜独立 [Review002](reviews/development-readiness-002.md) 的规划就绪 PASS；[Review001](reviews/development-readiness-001.md) 的 NEEDS_CLARIFICATION、旧候选和失败事实保留。

按现行 Git Publication Completion 规则，本轮有界材料获准提交、推送、PR、满足条件后的 squash 合并及安全 main 同步。用户自行转发 [工程接收／启动指令](handoff-instructions.md)，MacBook **不直接发送 Mini 消息**。用户的手动转发为原 Change005 v1.3 的明确生产推进指令；Mini 核对采用并完成增量 intake 后，在仍有效权限内连续执行，不另要求常规启动批准。

此处“启动生产”是 Mini 开始获准范围的生产代码工程，不是部署、对外发布、真实数据或模型权限的自动扩大，也不授权恢复旧自动 Host Loop／定时跟进。

## 2. 冻结身份：与 Review002／用户审核候选相同

| 正式附件 | 字节 | SHA-256 |
| --- | ---: | --- |
| [产品 AU-01–10、AS／AC／AX](product-input-v1.3.md) | 33294 | `387223babe84dc6873cffb05ba1661d8f9da253ce1b16e9ade67b49cc5f360e4` |
| [UI Contract AUUI-01–10](ui-contract-v1.3.md) | 9328 | `7b77456358c20515c816d2fedd7b182d29f80c5818043c19df574339ebf58408` |
| [v1.2／v1.3 流程对比](flow-comparison.md) | 5452 | `a2cbcfbfa089d6d251cf0b3ce294bea070c055da316a941fd142cfcbeac73ff6` |
| [可点击 HTML](clickable/index.html) | 6810 | `e9215882f5889bd64d1de203e83141e038ac25fb2ee74e02703cd51fc89d9f97` |
| [可点击交互 JS](clickable/autonomy.js) | 31531 | `217986276cb9578de672b3f3fe6cdfe8dc61afc2132209805b598abbb46526f0` |
| [增量 CSS](clickable/autonomy.css) | 2660 | `8bf034d927e6a72e4e2a2a9c6a73796a627eb972b96869df25fce429afacd39f` |
| [原自主程度决定 A–E](../change005-v1.3-agent-autonomy-decisions.md) | 10888 | `70c7304e115011c8add9b5c9f67d2143049bedc83762fa3abe8bad29c2d89146` |

[来源清单](source-identities.json) 保留准备／审查时点的18项身份及旧分支／HEAD，不回写成发布身份。产品、UI、流程、决定和 review-and-status 的“候选、待审核、不冻结发布、无开工授权”是各自形成时点；**后续批准、冻结及生产推进效力以本记录和用户实际转发为准**。用户 UI 接受不把浏览器工具 NOT_RUN 改成已实测，不将原型合成检查冒充工程 RED／GREEN。

## 3. 最小前向适用说明：不修订蓝图历史正文

Blueprint v4.2 的固定正文与批准身份、40项稳定ID、N01–N20、S1–S6和路线保持不变。仅对**接收后的 Change005 v1.3**应用产品§2的已批准差异：

- Blueprint §9.4／C5-03/04、OA-07／OA-S06／Q11-09及 v1.1 D2 中旧的“仅用户发起、单层、顺序、不自动派发／递归／并发”限制，按 AU-06 替代：用户与主 Agent 均可发起有目的协作、必要后代和独立分支调度；有界容量、收敛及真实能力仍必须成立。D2 的材料资格／精确子集保留，不将根明细许可自动传给所有后代。
- 回流自动用于调查、比较、补查和合格待审证据，不以逐条手动采纳为探索前置；核验等级与正式人的效力仍按 AU-07 及原 Finding／会员整体提交／Decision／Expected／Owner 合同成立。
- RS-06 初次明确执行意图和“只整理不计算”保留；运行中有效范围内的普通路线调整不重走整套审阅／启动。业务承诺、关键含义和权限变化仍触发相应参与。
- 暂不设累计额度上限；持久计量、历史失败／预留／UNKNOWN、单次保护和根／后代停止保留。原请求加一次额外请求，备用与失败重试共用；正常下一分析步骤不等同失败重试。

此说明不扩张为所有后续产品的无限协作许可，不回写旧审查、验收或 accepted specs。新产品规范由 Mini 在原工程 Change 内按已批准输入形成实际 spec delta；不因本轮发布静默重排在研工作或抹掉 v1.1／FM／RS／R3 的剩余义务。

## 4. 已闭合与受影响动作前的条件

产品§3–7的闭合行为及AUUI要求已整包接受，不重开产品方向、视觉或原有效模型／材料／调用决定。严格沿用 PX-006 快速壳层、PX-004 完整专业交互、五时刻和需求沙盘、中文／绿色／JuanerAI字标与 slogan、紧凑新建分析按钮和无图片Logo；**Mini 不自行重新设计 UI**。原型评审控件和合成状态不得直接交付为真实能力。

SDK0.4.1 升级由用户单独转发，v1.3 仅引用其真实固定身份、采用和兼容结果；不重复派发升级、不宣称已安装。不能兼容时停止受影响运行激活，保留其他安全工程；不另造 Runtime／Harness 循环、不清账重建。旧 [SDK请求载体](../pi-agent-runtime-no-cumulative-cap-request.md)仅历史参考，不是本轮另发给共享包的任务。

真实试用资料、权限、样本／体验目标复用有效记录；确有缺失、过期、新范围或不兼容时，在受影响动作／正式体验评价前集中交用户，不以本次批准补造授权或数值SLA。原停止线、未发布工作、失败与UNKNOWN完整保留；本次推进解除的是等待本版产品批准的阻断，不解除未核清的安全／权限阻断。

## 5. 发布、采用与下一允许动作

本记录签入时：产品／UI接受及冻结 **CONFIRMED**；Git发布办理中；Mini消息 **NOT_SENT_BY_USER_INSTRUCTION**；Mini采用／增量intake **NOT_CONFIRMED**；不主张 v1.3 工程实现或验收通过。

最终发布回执及可转发 prompt 将携带实际固定 commit／tree／PR／CI和冻结附件身份，而不是正文旧HEAD。用户转发后 Mini 先读回自身工程现场、有效权限、采用差异和下一允许动作，完成增量 Engineering Intake，随后按现行唯一政策执行 SDD／TDD、实际多轮与三核心消费者、回归和独立 Validator、适用用户产品验收、required CI及获准交付／归档。发布、main同步、接收、intake、工程接受和用户产品接受分别记实，不互相推定。
