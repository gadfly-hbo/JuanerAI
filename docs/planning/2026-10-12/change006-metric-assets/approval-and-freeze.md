# Change006 · 用户产品／UI批准与 Product Input Freeze

2026-10-13 · MacBook Product Manager。追加当前效力，不修改受审产品／UI、正式源附件、历史候选或审查结论。

## 1. 用户直接批准及授权

用户在本任务直接要求：

> Change006产品方案和UI审核通过，冻结、提交并发布，生成可转发Mac mini的prompt，由我转发；暂不启动开发。

本次完整[产品方案](proposal-v0.1.md)、[增量UI Contract](ui-contract-v0.1.md)及可点击附件已获用户审核通过；**新增／受影响 UI Gate PASS，Product Input Freeze 成立**。本次是产品输入批准，不是工程实现或正式产品交付验收。

复用新鲜[独立复审003](reviews/development-readiness-003.md)的产品计划就绪PASS；001／002的NEEDS_CLARIFICATION、原候选及源负例全部保留。003审查后仅有状态回执、56项当前数量和检查限制的非实质文字整理，原字节可由候选003原件恢复；没有新增产品取舍或重画UI，不重复整套Gate。

本次有界Git发布授权按现行Publication Completion完成：提交、工作分支推送、PR、适用审查和required CI、条件满足后的squash合并、安全main同步及实际发布回执。**用户自行转发接收Prompt，MacBook不直接消息Mini。用户“暂不启动开发”继续有效：即便收到用户转发，Mini也只能只读接收、核验采用与返回点，等待用户另行启动指令。** 不写生产／测试／OpenSpec，不新建开发分支，不启动服务／Provider／自动跟进，不凭冻结或Git合并恢复旧工程。

## 2. 冻结身份

完整60项文件的字节数／SHA-256见[frozen-inputs-2026-10-13.json](frozen-inputs-2026-10-13.json)，相对本目录解释。其涵盖当前产品及附件和必要历史原件；本批准记录、接收指令和后续发布回执不参与自身递归哈希。发布后接收方以用户携带的固定Git提交／tree核验全包，不能仅相信文件名、最新main或旧聊天。

| 核心附件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| [产品方案](proposal-v0.1.md) | 38573 | `ce3d1a06821a3e5cf109ca84caa852d6f003f3b2b3deb5bb2048f5b275f0e50c` |
| [UI Contract](ui-contract-v0.1.md) | 7905 | `1e17c06c6f1a4d8f6a5070fbc29467a5d0888a1681d7bf5d0f90870f93598240` |
| [可点击HTML](clickable/index.html) | 7997 | `12332f70e3ebe9b6d3133c789d2cbb0242775a26278f3931fa36edff9d2e8abd` |
| [交互JS](clickable/assets.js) | 22450 | `8379351aa6a1a0e255846f8239e9b4a2ad834089ef6bf9db1505e2ad3815163d` |
| [增量CSS](clickable/assets.css) | 3564 | `88b76d25e32fba3c2df9c2d78b9a90decac0149d68433840530ef7b280e2822b` |
| [独立复审003全文](reviews/development-readiness-003.md) | 10428 | `4def63e10cbdef1fae24ce149489ab8bf09c6de797f1eac96fcf294f44e50b03` |

规划／审查代码基线为`4df7604621fff2c8ec27281d59cf4a788deae47b`。发布前远端已有已合并浏览器修正`fa5a30b822cfedad349d4c6ecfc9f47146b1f983`，当前产品分支正常快进至该提交，未覆盖规划材料；该差异不修改本包产品、UI或权威规则。旧身份保持原时点，不回写为新发布基线。

正式供应身份仍为`metric-factory@8f47913c954f5650c8718a341add9feeea50d5d0`，tree `47672b4110444190afecbfdc841d26bfa301ee76`；新@1.1.0／@1.1.1与登记、方法和旧反例附件已在本包，不要求Mini访问MacBook供应仓。身份和限制见[接收结论](supplier-receipt-2026-10-13.md)与[接收清单](supplier-release-readback-2026-10-13.json)。各自56指标、所选6项、未选50项；历史55计数和49项源文案不能扩大或改变批准范围。

## 3. 当前有效解释与保留边界

受审正文、D1～D3原决定、Review003和接收记录中的“待UI／未冻结／等待发布”均是其形成时点。**后续用户产品／UI接受与冻结以本记录为准**，不回写历史；供应发布、Mini采用、Engineering Intake、开发授权、实现及验收仍分别确认。浏览器NOT_RUN及合成原型限制不因用户UI接受变成实际浏览器或业务运行证明。

D1～D3已经采用，不重问口径Owner或产品方向。当前仅批准本项目所选净销售闭包、精确版本、13周／总体及category／两期比较、两种退款金额归属和支付队列退款率，沿用MF-01～09、MFS-01～04、MFC-01～07、MFX-01。资产必须真实影响Context／Binding／IR及计算，独立核验不复用主算或供应参考函数；两项源oracle漏拒绝作为消费者反例保留。未知方法／语义拒绝，不别名到会员M2；设计态SAP不变成可执行插件。

005及001～004、Blueprint v4.2／40稳定ID／20候选／六＋二／后续回访路线保留。严格沿用已接受005壳层及本增量UI：PX-006快速、PX-004完整专业、中文绿色、JuanerAI字标／slogan、无图片Logo和紧凑按钮；不复制供应编辑器或另造工作台，不用专业iframe占位、合成推进或假数字代替真实能力。

既有有效模型、资料、额度、环境决定按适用范围复用，只有失效／变化／真正缺失项集中补决；本次不新增SAP正文外发、006实际Provider／资料／服务／部署许可。体验按005同任务基线→形成性试用→正式评价前确认量化目标，不把点击减少替代业务价值。相关动作未获权时NOT_RUN；当前不进行这些动作。

## 4. 发布／接收返回点

Git发布身份、CI及每设备main同步结果由本轮实际回执提供，不预填完成。不为同步切换、清理或覆盖任何活跃工作树；安全跳过须报告。main同步不是Mini接收或恢复。

正式[只读接收指令](handoff-instructions.md)由用户附实际固定发布身份转发，Mini核验后简短回传采用版本、设备／仓库／分支／HEAD／tree、原现场保留、有效权限及下一动作。**下一允许动作仅为只读接收核对；开发须等待用户另行明确启动。** 本轮不预冻结普通工程类型／路径／命令／事务，不写Mini工程看板或累计能力实现状态。
