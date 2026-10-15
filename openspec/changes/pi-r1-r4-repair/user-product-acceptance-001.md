## 当前用户产品接受（2026-10-15）

用户在本任务直接表示“采纳，接受产品”，本冻结候选的既有离线合成/显式opt-in交付范围 Product Acceptance 已收到；详见 [产品接受](product-acceptance.md)。原F-ROLE-01具名豁免及正式Validator BLOCKED、历史失败和UNKNOWN保留。没有逐项本人复跑或真实Provider/生产/Git/归档通过的推断；下文PENDING/尚未用户验收均按此前时点历史阅读。冻结代码/SDK/依赖/测试不变，原合成业务Task状态与用户产品决定分列记录。

## 当前交互环境增量（2026-10-15）

用户现已明确授权本任务本机离线交互环境，六项场景已启动：[访问地址及本人操作步骤](offline-interactive-acceptance-001.md)。仅这一项服务停止点按新授权解除；真实Provider/生产/Git停止线、F-ROLE-01、原BLOCKED/UNKNOWN不变。下文“方式B未启动”等为材料准备时历史，当前以本增量及环境回执为准。用户产品接受仍PENDING，判定表未代填；六项入口不冒充全部16项已本人复跑。

# 本冻结候选用户产品验收清单与操作步骤 001

2026-10-15，Mac mini；沿用 `pi-r1-r4-repair`、`work/mac-mini/pi-r1-r4-repair` 与原 WIP。本文件将既有规格和证据整理为用户审阅步骤，不新增产品要求、实现合同或验收授权。本轮只准备材料，**用户 Product Acceptance 尚未发生；所有用户勾选和结论留空**。

## 先选择可以执行的验收方式

| 方式 | 本轮状态 | 能证明什么、不能证明什么 |
|---|---|---|
| A. 静态离线证据审阅 | 现在可做：打开本文链接的既有 MD/JSON/日志/PNG；不运行脚本，不打开 localhost，不启动应用服务 | 用户可以判断已展示的结果、失败边界和说明是否可接受；不是本人重新操作应用，不把历史工程 PASS 当用户已接受 |
| B. 离线交互复跑 | **未启动**。既有自动化脚本会创建临时任务、SQLite、localhost 服务和浏览器，当前“暂不启动服务”前提下不执行 | 后续须另行允许本任务独占服务/合成 transport 和新测试空间，确认当前固定策略 opt-in 入口；不能用正常生产 Profile 顶替或把探针称为已交付交互 Demo |
| C. 真实 Provider 场景 | **NOT RUN**，仍需明确授权 | 实际编解码之外的真实模型行为、完整 token 准入依据、供应方用量/计费、模型质量与真实主备效果；离线结果不替代 |

本轮不会创建新测试任务/服务、调用 Provider、读取凭据/业务数据、改变生产配置或执行 Git 写操作。本文出现的“读取、刷新、重开、停止、采纳”若指既有记录，是审阅动作；若要求在应用中再操作，则属于 B/C，停在授权之前。保留 UNKNOWN 不能视为该项目验收通过。

## 固定身份与结论边界

- 工程结果：冻结 R1～R4＋D1～D8 推荐 A 的离线合成、显式 opt-in 结果已 Engineering Acceptance，附 **F-ROLE-01 本候选具名豁免**。原始正式 **Validator BLOCKED** 保留，技术评估 PASS；不是无条件 Validator PASS。见 E01/E02/E24。
- HEAD `8265a3920ee1205faec7dede8b0c84e648105d9d` 只是来源基线，不能代替 WIP。原87文件 aggregate `a5f0a8c11c3b4760b92953c7ce198d2ad2fff336d85b54b7651ad984804b8fd4`；工程接收绑定88文件 aggregate `b9b796ee8c0cb624fc7640c37f32c2b08f2c2b692b69bb5cfb9d192b6cf1a16a`。后续工程收口记录层、本文资料层单独列身份，不重新命名旧冻结快照。
- 实际 SDK `0.5.1-r1r4.3`：146131 bytes，SHA256 `e02175ff42eaa83b994e6f49a1e041b4b3f0b9c807b0b8c192a7dfd836f70cce`；51安装文件一致，解析本任务 node_modules。完整 SRI/lock/解析路径见 E23。
- canonical002：4610 PASS／1 真实 Provider SKIP／0 FAIL，17组 exit0。独立131 PASS，另有反例、类型及两尺寸实际 Chrome 证据。它们是既有工程事实，本轮不重跑、不累计为新的产品验收次数。
- 生产 overhead/margin/image 参数仍 **UNKNOWN**；512/8192 是合成参数，961743 bytes 只是观察值，不能证明 token 安全。旧1-token故障原因仍 UNKNOWN。
- 本机材料不是 Git 已集成资产或跨设备备份。旧005/.2、006/.3窄范围资料中的“尚未完整评审/DEFERRED”按各自时点阅读；当前完整工程接收以 E01/E02/E25 为准，不覆盖原件。

## 本轮用户可以直接执行的步骤（方式 A）

1. 打开 E01，再打开 E02 第一屏和 E24。确认“本候选具名豁免”“正式 BLOCKED”“离线技术 PASS”“尚未用户产品验收”四件事分开。若希望无风险豁免的正式角色 PASS，停在这里；本材料不能给出该结论。
2. 打开 E03 与 E23，核对当前统计及 SDK 身份。只打开文件，不执行其中的命令；如身份不符、文件缺失或链接不可访问，记为“待核对”，停止该条结论，保留现场，不重装或补丁修正。
3. 按下面 R1→R2→R3→R4 的条目打开指定文件，查看指定字段/关键词，对照预期。在末尾表格填“已阅可接受／不接受／待核对”；操作方式一律填“静态证据审阅”。需要亲手重现时填“待离线交互”，不将其勾为已复跑。
4. 打开 E26/E27 截图，再看 E05 的文字和调用计数。判断中文诊断是否易懂、读数是否能区分已知下界和未知预留、界面是否可读。PNG 是历史截图，点击图中按钮不会执行刷新；不要将静态图片操作当作交互验收。
5. 对“停止、刷新、重开不新增调用”等不可由图片单独证明的项目，交叉查看 E04/E05/E19/E21 的原断言/结果；若仍不足以作产品判断，填“待离线交互”。不在历史数据库上点恢复/重放以补证。
6. 阅读真实 Provider 待验表和准确停止点。用户可决定是否接受**仅已阅离线范围**并明确保留待验项；没有用户直接决定时，Product Acceptance 保持 PENDING。整理清单本身不产生接受。

下面 UA 编号仅为本次用户审阅索引，追踪既有 R1～R4/V01～V17/PREP 合同，不是新增行为或测试编号。

## R1：资料完整性、获准读取和上下文准入

| 用户审阅条目 | 具体操作 | 预期结果与通过边界 | 证据/原验收点 |
|---|---|---|---|
| UA-R1-01 大资料留本地，小目录按需读取 | 先看 E04 的 `R1-SELECTED-READ-01/03`，再打开 E06 对照 source 和 audit；需要看宽表/多表边界时，沿 E25 指向005 V02～V05 | 本地原值和来源身份保留；长 cell 通过原生 offset/limit 的窄行取得，包含 source_value 与读取限制。小反馈不代表模型已读全量，计算/核验使用完整本地资料。2048表证据是末表可达，不是全部表均已计算；8/32MiB/100000cells不是所有参数组合成功 | R1-READ、V02～V05/V17；E04/E06/E25 |
| UA-R1-02 窗口不足或策略未核定时拒绝 | 打开 E07，再在 E04 搜 `R1-WIRE-01/02`，对照 `R1-SELECTED-READ-01` 两候选记录 | 200k保留尾部时安全拒绝；明确1M合成候选可读；两者不能混算。最终 DTO 的说明/schema/历史都参与 guard，拒绝发生在该次物理预留、凭据和发送之前。未知策略不能默认套用测试值出站 | R1-CTX、V06；E04/E07 |
| UA-R1-03 长历史和摘要后继续守同一边界 | 在 E04 搜 `R2-NATIVE-RECOVERY-01` 的 length/context/oversize-summary/revoke-summary，并读 E02 的对应实测说明 | 每次摘要/恢复仍核验授权与准入、分别计量；已完成工具不重做；无法安全摘要/未知效果时停。不是所有上下文组合或真实模型压缩质量保证 | R1-CTX、V07；E02/E04 |
| UA-R1-04 越权、撤权或来源变化不泄露 | 在 E04 搜 `R1-SELECTED-READ-02` 的 outside/missing-cell/source-changed/revoked-during-read；与 R2 的read分类表一起看 | 仅当前所选资料/作用域可读；拒绝越界/已撤权/变更来源，不把异常当“可重试”。长行提示不开放 shell；没有通用磁盘读取/grep/find/ls权限 | R1-READ、V17；E04/E18/E19 |

本轮最多接受以上**离线安全行为**。生产 token 预算、实际图片成本和真实模型选择阅读/压缩的效果仍停在 RP-01/03，不因为上述拒绝测试通过而放行生产。

## R2：失败可解释、用量不丢、停止不伪成功

| 用户审阅条目 | 具体操作 | 预期结果与通过边界 | 证据/原验收点 |
|---|---|---|---|
| UA-R2-01 额度/网络失败和用量分列 | 打开 E26/E27 查看“执行记录／查看运行状态”，用 E05 的 snapshots.text 对照；在 E04 搜 known-zero、partial network、contradictory observations | 样本显示“网络请求结果未确认／物理状态未确认”；已知输入至少13/输出至少4，与4096未确认输出预留分开。不把缺用量填0，不把失败当未收费；矛盾载体失败关闭，无伪成功 | R2-FAIL、V08/V10/V12；E04/E05/E26/E27 |
| UA-R2-02 read九组、限额与原生截断 | 打开 E18 的九组表；用 E19/E21 的 `READ-CARRIER` 项确认本候选受影响回归。查看真实 Session 类别与顶层 reason，不能只看直接factory结果 | 九组类别按下表保留；限额失败与原生成功截断/续读分开；未知或旧字段显示未知，不从错误文字猜。模型/工具各1次的样本计量与missing底层probe2分开，不能多算成模型重试 | R2-FAIL、V12/V17；E18/E19/E21 |
| UA-R2-03 停止、超时及迟到确认 | 在 E04 搜 `R2-WIRE-06`；在 E19/E21 搜 late/cancel/timeout；对照 E18 的优先级修正说明 | 原返回 UNKNOWN/pending 不被后来确认改写；晚到事实另记，不发布、退款或自动重放。显式 CANCELLED 附 ETIMEDOUT 仍按取消；账本/审计失败关闭，未实际 idle 不放占位 | V11/V13；E04/E18/E19/E21 |
| UA-R2-04 刷新/读回不启动新计算 | 打开 E05 看 calls=1；读 E04 的 `R2-DIAGNOSTIC-READ-01` 与 E21 的浏览器读回结果 | 已存状态可读，恢复入口在 UNKNOWN 场景不得可用；历史刷新/重开检查没有新增模型/工具调用。截图不能单独证明计数，不满意则标“待离线交互”而非现在启动服务 | R3-STATE-01、V12/V14；E04/E05/E21 |

read 九组预期（此表属于安全诊断，不授予恢复/重放权）：

| 组 | failureCategory | 原顶层 reason |
|---|---|---|
| missing | not_found | TOOL_FAILED |
| permission | permission_denied | TOOL_FAILED |
| unsupported | not_supported | TOOL_FAILED |
| cancelled、runtime-cancelled | cancelled | TOOL_FAILED（立即工具故障；外部运行取消另测 CANCELLED） |
| host-timeout、timeout | timeout | TOOL_FAILED（立即工具故障；运行 deadline 另测 DEADLINE_EXCEEDED） |
| limit | limit_exceeded | BUDGET_EXHAUSTED |
| unclassified | unknown | TOOL_FAILED |

## R3：唯一正文不丢、准备不冒充采纳、真实效果不重放

| 用户审阅条目 | 具体操作 | 预期结果与通过边界 | 证据/原验收点 |
|---|---|---|---|
| UA-R3-01 前框架保存与唯一语义完整可读 | 打开 E08 看 task.state、preparation_snapshots、framework/outcome 和 view.status；再打开 E09 看 calls/reads/restored，与 E04 的 PREP-J01/J04 对照 | J01为 waiting/“需要你补充说明”，3物理3工具、一个准备快照，正式framework/Outcome均null。J04为24物理、22原生read，完整重组的唯一语义等于已保存原文，而非只读片段；SOURCE解释保持MODEL等级 | R3-OUTPUT、D1～D5；E04/E08/E09 |
| UA-R3-02 proposalOnly两批候选不能自动执行 | 打开 E10 对照task的准备记录/Preview与framework/outcome；查看 E04 PREP-J03，随后与 E11 的正式结果比较 | J03有两批完整候选，6物理5工具；Preview ready仍waiting，framework/Outcome为null，不算用户采纳、IR计算或正式完成。保存/准备回执不等于正式效果 | D2/D5、V15；E04/E10/E11 |
| UA-R3-03 显式采纳才进入IR/核验/成果 | 打开 E11，按task→http→view顺序核对 revision2、outcome.calculation.value/unit、verification、numeric_report和状态；与 E04 PREP-J05 对照 | 同一实际固定 .3 链路8物理4工具；显式采纳后revision2进入声明IR/实际计算与独立核验，计算value="7"、unit="items"，状态“本轮成果已保存”，准备历史仍保留。数值核验不认证因果，解释文本明确合成数量不证明业务原因 | D5/D8、V01/V15/V16；E04/E11 |
| UA-R3-04 保存失败、确认丢失和模型失败分清 | 依次打开 E12/E13/E14，对照 boundary、calls、task.state、preparation_snapshots；看 E04 PREP-J02 全五组 | 保存前失败无快照；commit后ACK丢失有原快照但仍unknown，不能伪称确认成功。工具成功后模型失败仍保留快照、已知7/3与第二请求UNKNOWN/4096预留；1/1/2物理调用不自动多发。保存前/后取消另组保留，无假Outcome/重放/退款 | R3-FAULT-01、V10/V11/V13；E04/E12/E13/E14 |
| UA-R3-05 输出超限不否定已发生效果 | 打开 E15，查看 completed 与 modelOutput rejected/failed、真实 effect、receipt/invocation、已知usage；读 E02 反例结论 | 工具效果一次发生，投影超限或投影异常后不再向模型发请求；completed与反馈失败同时保留，已知11/5不丢。结果安全失败不是整项未执行；不靠删原历史或自动重做拿成功 | R3-OUTPUT/R3-FAULT、V10/V15；E02/E15 |
| UA-R3-06 所有权、失效与旧恢复字段兼容 | 在 E20 看 PREP-S/A/W 的owner/hash/revoked/legacy/limits；读 E25 的D3/D4/D6/D7/D8 | 来源/owner/epoch变化使新读取失效但原记录保留；16MiB/64MiB/1000项/64候选为物理上限，不能当token安全。旧 required_calculations.execution_plan、finish_result.result保留；旧1.0～1.3不回填，新1.4必须显式opt-in；不自动旧版resume新状态 | D1～D8、V14/V15/V17；E20/E25 |

E25中27工具/20阶段枚举用于覆盖实际登记，不表示所有工具最大组合均可成功，也不承诺任意资料/方法的完整业务质量。超出安全预算的组合可以拒绝；不得靠新增通用仓库/分页/恢复或删旧字段来“通过”。

## R4：每个用途的主备链与统一额外额度

| 用户审阅条目 | 具体操作 | 预期结果与通过边界 | 证据/原验收点 |
|---|---|---|---|
| UA-R4-01 主备候选按用途真实切换 | 打开 E16/E17 比较actual result模型、requests和audit；在 E04 搜 `R4-PURPOSE-01/02` 和 `R4-CODEC-01` | analysis/proposal_prepare为已批准MiniMax主、Flash备；report_edit为已批准Flash主、MiniMax备。各用途独立候选链；实际结果身份与responseModel分开，已完成工具只做一次；同Task统一一次额外恢复额度，不叠宿主重试 | R4-ROUTE、V09；E04/E16/E17 |
| UA-R4-02 备用不满足条件时也必须停 | 在 E04 找 `R4-PURPOSE-03` 的exhausted/revoked/smaller-window；与R1 guard、R2 UNKNOWN检查一起读 | 备用的授权/协议/接收方/窗口独立检查；额度耗尽/撤权/小窗口拒绝，UNKNOWN效果不能借换模型重做。retained旧用途仍原单候选，旧Task不热绑新链 | R4-ROUTE、V06/V09/V13/V14；E04/E25 |

以上为真实安装包/实际Pi编解码器＋**合成离线响应**，并非向真实 MiniMax/Flash 发送请求。真实主备可用性、延迟、响应质量、用量结算与跨协议模型行为停在 RP-02/04。

## 仍需真实 Provider 的项目（全部 NOT RUN）

| 返回点 | 当前离线已证/仍缺什么 | 后续所需明确输入与验收观察 | 准确停止点 |
|---|---|---|---|
| RP-01 真实token/图片/协议准入 | 最终guard顺序和合成拒绝已证；生产overhead/margin/image参数、候选实际token安全仍UNKNOWN | 指定provider/model/protocol/endpoint/window/output cap、token计量依据、图片类型/预算及参数来源；用批准的合成资料实测最终请求/使用量。无依据仍UNKNOWN，不能bytes/4或961743bytes推定 | 在批准并接通真实凭据/出站请求之前停；量测通过也不自动启用生产 |
| RP-02 真实错误、用量与流中断 | 离线codec的400context/402/429/5xx/网络/length、known-zero/partial/UNKNOWN已证；供应方实际载体/计费/取消结算未证 | 指定可安全复现的场景、费用上限、取消/迟到观察窗口、单Task预算和停止条件；不主动制造欠费、限流或重复有副作用动作 | 开启真实Provider gate或第一次真实请求之前停；有UNKNOWN不重试/退款/重放 |
| RP-03 真实模型对大资料的工作质量 | 完整原文可达、本地IR/核验和保存链已证；真实模型是否选对资料、完整解释、长历史摘要保真/事实与因果区分未证 | 指定已授权合成数据及问题、完整性/正确性对照、报告与限制观察标准、模型/费用/时间预算；用户判断可理解性、相关性和遗漏 | 不用真实业务数据或凭据“先试一下”；未授权前停。通过单一场景不称所有资料质量PASS |
| RP-04 真实主备与跨协议效果 | 各用途离线主备/guard/统一额度已证；真实端点/模型响应/延迟/用量未证 | 明确两个候选各自用途授权/接收方/协议/模型标识及可安全触发切换条件；同Task检查每次物理请求和工具一次效果。仅用具名合成只读任务，不人为制造不可控失败 | 切换/获取任一真实凭据及发请求之前停；不把另用途授权迁移至retained旧任务 |
| RP-05 原TEST-XCLI-013真实Pi验收 | 原19跳过中18项有本机补验；该真实Provider项仍SKIP，详见E22 | 本Change专用对象/命令/数据/预算授权与前四项中适用的前置依据；不复用旧Task授权，不仅开环境变量就运行 | 专用真实模型命令运行之前停；canonical保持移除真实gate |

RP-01不保证只靠一次Provider试验即可解决所有生产参数；没有可靠来源时继续UNKNOWN。即使RP逐项通过，仍需相应用户产品判断与独立生产采用授权，不能推导发布/部署完成。

## 所有方式共用的停止规则

| 发现/准备动作 | 当前处理与返回位置 |
|---|---|
| 与固定候选/SDK/lock/安装身份不一致、证据缺文件、校验失败 | 停该条验收，记录实际路径/差异；回到E23及任务原证据定位，不重装、改包、补丁或覆盖冻结证据 |
| 需要真实点击、刷新、创建Task、故障注入或运行脚本 | 停在启动服务/脚本之前；先明确本任务独占测试目录、合成transport/假凭据、无真实Provider、loopback地址/端口、命令、清理和新证据路径。本清单没有现成可点击的无服务入口，也不授予启动权限 |
| 正常Profile未启用新opt-in/策略或需要替换活动配置 | 停在配置变更之前；不改旧Task或生产Profile来凑验收，旧配置兼容与新Task1.4采用分开 |
| 看到UNKNOWN、保存ACK丢失、工具已完成但模型失败 | 只审阅/记录，保留冻结事实、晚到记录及已知用量；不自动继续、退款或重放；不得以刷新触发新调用 |
| 需要真实Provider、凭据、外部数据 | 在凭据读取/真实gate/首次出站之前停，回RP表逐项明确授权、对象、数据边界与预算 |
| 需要历史Task迁移/恢复/重放、服务/生产采用或其他项目升级 | 保持原停止线，未授权前不操作；回滚不能清UNKNOWN账本，不让不兼容旧版自动resume新状态 |
| 用户接受部分离线范围 | 只记录用户原话、具名范围、方式、保留项；不能自行标全R1～R4/完整产品/S1通过，不升级能力目标状态 |
| 需要提交/推送/合并/发布/正式归档 | 保持原Git/交付停止线；不因为材料齐备或用户审阅即自动执行 |

F-ROLE-01仅承接已有本候选的沙箱残余风险决定，不扩展至新候选、未来复跑、其他风险或UNKNOWN；原BLOCKED、CLI HTTP400失败、初次Chrome TMPDIR限制、所有历史RED/FAIL和旧包原件保持。

## 用户记录表（尚未填写）

填写建议：判定只能选“待审阅／已阅可接受／不接受／待核对／待离线交互”；真实Provider项选“NOT RUN”。有工程PASS证据不自动填写“已阅可接受”。将条目编号、观察和期望一并反馈即可，不需要修改代码或运行脚本。

| 条目 | 本人操作方式 | 本人判定 | 观察/问题与证据 | 接受范围/保留项 |
|---|---|---|---|---|
| UA-R1-01 | 待填写 | 待审阅 | — | — |
| UA-R1-02 | 待填写 | 待审阅 | — | — |
| UA-R1-03 | 待填写 | 待审阅 | — | — |
| UA-R1-04 | 待填写 | 待审阅 | — | — |
| UA-R2-01 | 待填写 | 待审阅 | — | — |
| UA-R2-02 | 待填写 | 待审阅 | — | — |
| UA-R2-03 | 待填写 | 待审阅 | — | — |
| UA-R2-04 | 待填写 | 待审阅 | — | — |
| UA-R3-01 | 待填写 | 待审阅 | — | — |
| UA-R3-02 | 待填写 | 待审阅 | — | — |
| UA-R3-03 | 待填写 | 待审阅 | — | — |
| UA-R3-04 | 待填写 | 待审阅 | — | — |
| UA-R3-05 | 待填写 | 待审阅 | — | — |
| UA-R3-06 | 待填写 | 待审阅 | — | — |
| UA-R4-01 | 待填写 | 待审阅 | — | — |
| UA-R4-02 | 待填写 | 待审阅 | — | — |
| RP-01 | 未运行 | NOT RUN | 未获本轮真实Provider执行授权 | 原停止点保留 |
| RP-02 | 未运行 | NOT RUN | 未获本轮真实Provider执行授权 | 原停止点保留 |
| RP-03 | 未运行 | NOT RUN | 未获本轮真实Provider执行授权 | 原停止点保留 |
| RP-04 | 未运行 | NOT RUN | 未获本轮真实Provider执行授权 | 原停止点保留 |
| RP-05 | 未运行 | NOT RUN | 未获本轮真实Provider执行授权 | 原停止点保留 |

最终用户结论：**PENDING，尚无本轮产品验收决定**。后续用户回执记录字段：固定候选身份、已阅条目与方式、接受/拒绝/延期的具体范围、未验证项、仍保留F-ROLE-01/原BLOCKED/UNKNOWN、用户原话及时间。不得由准备材料的工程Agent代签。

## 只读证据目录

下列都是既有证据，直接打开文件即可；不要运行JSON/日志中记载的命令。E28仅供核查历史准确命令/环境/退出码，不是本轮执行清单。各引用的字节数/SHA256见本轮专属资料根 `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/product-acceptance-preparation-001/EVIDENCE-REFERENCES-001.json`；本文不复制或改写旧证据。

- **E01** [工程接收与具名边界](/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI/openspec/changes/pi-r1-r4-repair/engineering-acceptance.md)
- **E02** [原始完整 Validator 报告（正式 BLOCKED）](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/validator-report-001.md)
- **E03** [当前冻结候选 canonical002 汇总](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/canonical-summary-002.json)
- **E04** [当前独立47项原生链路日志](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/fresh-key-native-001.log)
- **E05** [最终1366×768/1440×900界面与零新增调用结果](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/independent-ui-768-m6YfgG/result.json)
- **E06** [完整大cell读取与来源](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/r1-selected-read-oocd1O/source-and-readback.json)
- **E07** [200k窗口安全拒绝](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/r1-selected-read-xMZyF8/window-rejection.json)
- **E08** [前框架准备正文与HTTP/client状态](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/preparation-native-wkbqCN/preparation-native-joint.json)
- **E09** [唯一语义完整原生续读](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/preparation-meaning-native-XtkQQe/preparation-meaning-joint.json)
- **E10** [proposalOnly两批候选未采纳](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/preparation-preview-native-4V4QQ2/preparation-preview-joint.json)
- **E11** [独立J05显式采纳后的IR/计算/核验/Outcome/UI](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/preparation-adopt-native-4yf215/preparation-adopt-joint.json)
- **E12** [保存前失败](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/preparation-fault-before-save-ibnJbI/preparation-fault-joint.json)
- **E13** [已提交但确认丢失](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/preparation-fault-ack-lost-mvepE9/preparation-fault-joint.json)
- **E14** [工具成功后模型UNKNOWN](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/preparation-fault-model-failed-D4e4A0/preparation-fault-joint.json)
- **E15** [效果/输出失败/owner-stop独立反例](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/independent-counterexamples-results.json)
- **E16** [分析用途主备读回](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/r4-analysis-chain-Tdwmhs/fallback-readback.json)
- **E17** [两个实际Pi codec的离线候选切换](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/r4-real-codec-lc6qKi/codec-fallback.json)
- **E18** [原read/API004九组及迟到修正采用回执（历史窄范围）](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/sdk-0.5.1-r1r4.3-001/ADOPTION-AND-VALIDATION-004.md)
- **E19** [当前受影响持久化/枚举/账本18项日志](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/fresh-persistence-contracts-001.log)
- **E20** [当前准备正文/兼容/失效29项日志](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/fresh-preparation-guards-001.log)
- **E21** [当前界面/read/业务回归20项最终日志](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/fresh-collateral-ui-002.log)
- **E22** [旧19跳过逐项原因与18补验返回点](/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI/openspec/changes/pi-r1-r4-repair/skipped-19-followup.md)
- **E23** [本候选SDK实际安装/解析/lock身份](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/product-installation-recheck-001.json)
- **E24** [F-ROLE-01用户具名豁免原件](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/engineering-closeout-001/F-ROLE-01-WAIVER-001.json)
- **E25** [完整007矩阵与005/006历史关系](/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI/openspec/changes/pi-r1-r4-repair/joint-verification-matrix-007.md)
- **E26** [1366×768静态截图](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/independent-ui-768-m6YfgG/ui-1366x768.png)
- **E27** [1440×900静态截图](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/independent-ui-768-m6YfgG/ui-1440x900.png)
- **E28** [准确检查命令/环境/退出码（只读，不执行）](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/commands-executed-001.json)
