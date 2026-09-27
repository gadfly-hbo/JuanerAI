# Xanthil Desktop 执行拆分修订方案 v0.1

状态：**讨论稿，未批准执行，非任务包**。2026-09-19 用户同意的是制作本方案；
不代表解除 Mini 停止、增加预算、修改 OpenSpec、发布转发或启动生产角色。
Blueprint v1.0/v1.1、已接受 UI 和首纵切最终产品目标不变；本文件只提议改变执行粒度。

## 1. 当前事实与最小复盘

- 原包 `PKG-XANTHIL-DESKTOP-001`；原 Change
  `xanthil-desktop-membership-repurchase-decision-case`；原 Mini 任务
  `纵切-1.0 / 01a0b45a-13ad-7b92-a2b4-cdde980558e1`，不新建任务或 Change。
- Mini 独占 `work/macbook/whitepaper-blueprint-v1`；2026-09-19 只读核对 HEAD
  `f5e4f62bd632360c282b5b93c5f2664498e311c6`。4 tracked 修改、27 untracked、无 staged。
  MacBook 在独立的 `work/macbook/wip-preflight-exception-disposition` 制作本稿。
- 当前 `TEST_RESUME_STOPPED_INVALID_EVIDENCE_BUDGET_EXHAUSTED`；历史四次纠正保留，
  Recovery 2/2 已用尽。无有效 RED，TDD_READY 未通过，Worker 未启动。
- Mini 已报告 Spec/ponytail/受影响 Spec Gate 及 P1–P4 通过；这些阶段记录保留，
  不是本稿重新验证的产品 PASS。最终 GREEN、Validator、验收、archive 均未完成。
- 原件保留于 Mini 唯一证据根
  `/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001/technical-decision-001/`。
  `test-resume-stop-index-001.json`：95836 bytes，SHA-256
  `e3e639db8c58f1ac47165b90c3f37bbab1b1a681dc654d5363e12769eb36353b`；
  `test-resume-exception-receipt-001.md`：11840 bytes，SHA-256
  `8538980fb2b3342c708d45b4bc494768a9f955f051bfbff46a7f431854e54573`。
  MacBook 已读原文、核对索引内 213 项文件身份引用并抽查测试源码；本轮再次核对
  两份原件 hash。保全核对不等于测试正确性、持续在线证明或跨端备份。

按[复杂度控制](../../governance/change-complexity-control.md)及
[复盘模板](../../templates/CHANGE_RETROSPECTIVE.template.md)进行本次阶段复盘：

| 观察与根因分类 | 最早可纠正处 | 本次提议 |
|---|---|---|
| 已批准绝对工具路径仍被替换；缺原始执行证据却报告 PASS：执行与证据错误 | 派发命令、阶段读回 | 原样携带批准命令；无原始输出不授予 PASS |
| 缺失 judgment 被默认值掩盖、测试自建连接代替生产连接、Preview 只检查文字：无效/不完整测试 | Test Design | 每次针对真实业务接缝、独立预期和禁止副作用证明 |
| 91 AC、16 Test 路径整批补全，多轮后仍无 RED：执行单元过大是有证据支持的组织风险，不是每次错误的已证实唯一原因 | task slicing / Test Design | 按用户流程分单元，在单元内做小步 RED/GREEN |
| Controller 连续调整预算/诊断权限，未及时缩小单元 | 首次重复纠正返回 | 不再原样重跑整包，不以新增规则或工具工程替代产品推进 |

角色隔离、禁止把工具失败当 RED、及时停止和封存现场应保留；它们阻止了错误测试
进入 Worker。无需改变模型、修 Host Loop 或重装工具。未捕获的命令/目录影响继续
UNKNOWN，不重放补历史；恢复前仍需用户明确接受已披露残余风险。

## 2. 四个内部单元，一个产品交付

下面是同一个 Change 内的开发顺序，不是四个新产品、四次 UI 重新审批或四次发布。
完整六阶段 UI 和 PX-2026-004/006 模式从 U1 就保留；未实现路径不得显示假成功，
不得把最终承诺的真实能力改成永久 Preview。U1 不是复活已撤回的 session-bootstrap。

| 单元 | 非技术用户可见的真实结果 | 随该行为一起通过，不能拖到最后的约束 |
|---|---|---|
| U1：建立并重开分析案例 | 在真实打包 Desktop 选择 Project，创建专业 Session，保存问题/标题/背景/备选解释，关闭重开仍是同一案例；三目录为 `010_draw/020_clean/060_reports` | 真实 Main→Application→SQLite/文件；完整创建或不可用、COMMIT 结果待核对、身份/重复命令、所需 schema/所有权约束、Main/Renderer 安全、Preview 零作用、手工路径且无模型调用 |
| U2：得到可审查的复购证据 | 原生选择双 CSV，确认字段、时期、状态和数据权限，执行本地分析，看到真实 Review Finding 与证据；失败可辨认且保留既有结果 | CSV/金额/时区/过滤/独立数值 oracle；DuckDB 与 Python 一致性；Run 3.0 与 SQLite 两点发布；溢出、取消、超时、owner 崩溃/重开、引用产物损坏和旧 CLI/Run 兼容 |
| U3：完成手工决策闭环 | 接受或暂不接受 Finding；比较至少两个候选或选择证据不足；单独完成案例、导出报告并重开历史 | 非关闭选择不冒充 Closure；同修订身份、不可变报告、失败重跑保留 Completed；Markdown/HTML 实际内容与 provenance；报告发布故障和导出损坏标记 |
| U4：加入可选智能辅助 | 在原来的三个 UI 位置整理问题、解释证据、起草候选；逐次披露，Draft 可编辑/采纳/拒绝，失败后继续手工操作 | 真实 Application 生命周期及 Pi Adapter 合同；精确 payload、拒绝零调用、并发/终态竞争、Attempt 中断重开、三类 Draft 的真实 GUI 流转与持久身份；无真实 Provider 调用 |

U4 的开发顺序靠后，不改变“帮我整理问题”在产品内可先于数据导入/聚合使用的规则。
运行时替身仅隔离外部模型：按现有合同通过真实 Application/store 形成合成状态，
关闭写入者后由同一个生产 `.app` 读取和操作；不把替身装进生产入口。
Pi 合同/离线 GUI 证据不能宣称真实 Provider 质量通过。

每个单元内一次 Test 派发只处理一个可观察行为及其必要负向/故障条件；共享文件可
分次修改，但同工作树串行。不得把上表整行又变成另一次“几十个标题先写完”的任务。
首个小循环建议为 U1 的 Session 完整创建/不可用及重开；schema 和 Main 安全等真实
前置条件仍需证明，不能承诺它只是一个无风险 UI 小改。

## 3. 全部验收义务怎样保留

Mini 当前两个 delta spec 共 91 个 AC：主规范 79 个，local-analysis 兼容增量 12 个。
下表是执行归属，不是覆盖 PASS。正式 Spec 收口时在原 `traceability.md` 为每个 AC
细分其可观察证据叶；跨单元 AC 只有全部必需叶通过后才能整体通过，不另建覆盖系统。

| 原 Requirement / AC 家族 | 实现与证明归属 |
|---|---|
| XDESK-001（5） | U1 shell/Preview；U2 后台状态；U3/U4 对应对话框；最终完整键盘/尺寸回归 |
| XDESK-002（6） | U1 创建/重复/未知结果；U2–U4 各新增历史的真实重开 |
| XDESK-003（5） | U1 Draft；U2 数据修订/Review；U3 Completed/历史；U4 不越权改变业务状态 |
| XDESK-004（7）、005（7） | U2 导入、计算、判断与 Run/结果发布 |
| XDESK-006（8） | U4 全部辅助行为；其手工表单与持久字段在 U1/U3 先实现 |
| XDESK-007（7） | U2 Review Finding；U3 接受、两类 Closure、报告及导出；U4 采纳不越权 |
| XDESK-008（7） | U2 Run；U4 Attempt；U3 已完成结果保护；错误 UI 随相关行为引入 |
| XDESK-009（6） | U1 建立基础隔离；每个单元扩展命令时同时验证准入/零副作用/去重 |
| XDESK-010（6） | U1 composition；U2 计算/Run 兼容；U4 Runtime；每单元运行受影响旧回归 |
| XDESK-011（8） | U1 完整既定 schema/连接/Session；U2 数据/Run；U3 报告；U4 Draft/Attempt；相关原子性、完整性、故障与恢复同单元关闭 |
| XDESK-012（7）及 LA-001/002/004（各4） | U1 起验证渐进构建与安全入口；每单元保持旧行为；最终恢复并证明完整 P5、全图、实包自动及独立正常启动验收 |

旧测试/夹具只按真实义务复用或定向修订，不整体删除重写。既有好断言保留，错误
断言由正式 Test 修正；Worker 不迎合错误测试。测试退休仍按
[Test Asset Retirement](../../governance/test-asset-retirement.md)执行。

## 4. Gate 粒度提议——尚未生效

现行冻结包仍要求整包 TDD_READY；它目前未通过。提议经用户批准并在 Mini 完成
正式 Spec 收口、整包 ponytail 和受影响 Spec Gate 后，改为：

`本小循环 Test → 真实因果 RED → 范围限定的 TDD_READY → Worker → GREEN/受影响回归 → 下一小循环`

- 在原 `test-plan.md/tasks.md/verification.md/traceability.md` 写明 AC 证据叶、
  前置已通过行为、测试/夹具身份、确切命令、允许生产路径及本次禁止行为；
  `TDD_READY` 必须标明所覆盖的范围，不能写成整包已通过。
- 每次只释放该范围的 Worker 写集；没有该行为的有效 RED 就不实现它。之前单元
  GREEN 是基线，不为已经存在的行为伪造 RED；新行为仍先有独立约束和有效 RED。
- 缺工具、语法/夹具错误、入口加载失败不能笼统代表所有后续行为 RED。初始缺入口
  时只能针对已闭合公共接缝证明缺失；尚未到达的断言继续未验证。入口建立后逐项
  激活行为测试，不能借一个失败释放整套模块实现。
- 故障测试与写入行为同时设计和交付。真实 owner 崩溃、COMMIT 未知分支、终态
  不可变、隐私及 IPC 防护不能统一后置为“最后再补的加固”。
- 未到实施时点的测试保留为明确待验证义务；焦点命令限定 TEST ID，不删除/skip
  它们来伪造全量 GREEN。最终命令不再采用单元选择器，覆盖所有 91 AC 的证据叶。
- 全部单元完成后仍执行完整 P5、全量回归/打包 E2E、正常无调试参数原生流程、
  Test Asset Retirement、独立 Validator、MacBook/用户验收，再按权限交付/集成。
  中间演示不要求用户逐轮转发，也不是最终验收或发布。

## 5. 必须同步解决的 P4/P5 配置约束

当前 Mini `dependency-decision.md/path-contract.md` 和 AC-XDESK-012-02、
AC-XDESK-LA-001-02、LA-002-02 将 P5 绑定完整 43+25 文件图；TEST-XCLI-021
只接受完整 P4 或 P5。单纯改派发顺序不会让分段打包成立。

提议仅为本 Change 增加**有限、显式、临时的开发配置元组**：由正式 Spec 在
第一次分段 Test 前列全各单元的精确文件图、manifest/build/validation 条件和归属，
不得运行时猜阶段或接受任意子集。最终 P5 的完整文件图、依赖及业务验收内容不变。
这是需要批准的技术执行约束修订，不称为“91 AC 原文完全不变”。

仅在批准后允许 Spec 定向调整相关阶段措辞；正式 Test 可重新打开
`tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`
中既定 TEST-XCLI-021 配置 oracle 范围，证明精确元组合法、混合/缺项/漂移仍拒绝。
TEST-XCLI-022、所有旧业务断言及依赖版本/lock 保持不变。此配置测试是兼容性证明，
不算产品 RED。最终将临时 oracle 分支按退休 Gate 移除，恢复原有 P4/P5 两状态
验收；保留阶段历史证据，不保留临时生产模式或第二套 app。

不得用空实现、假导出或空文件补齐最终图；不得加通配 include、宽松类型检查、
依赖重解析、安装、生产阶段开关、新测试框架或第二个打包入口。U1 即用真实
生产打包路径；各单元构建版本可不同，最终自动/正常启动验收必须绑定同一冻结构建。
若正式 Spec 证明这一有界方式仍不可行，回到 Controller，不自行扩大配置系统。

## 6. 执行权限、预算和续接条件

本稿没有任何新的执行额度。建议后续整体批准的范围为：一次定向 Spec 收口，
四单元内预先列明的小循环及首次验证；整批至多两次额外 Test 纠正—验证，同一
根因至多一次。命令装配和测试正文纠正都计入该整批上限，不在单元间重新发额度；
辅助健康检查可在编写时进行，不把成功检查机械重跑。首次验证的合法预期 RED
不是纠正失败；失败后改写测试再验证必须计数。小循环清单只能覆盖上表已批准行为，
不能靠继续拆分、新标题、新上下文把同一失败改叫“首次验证”。

以上是**待批准的新分段批次预算提议**，不是恢复已耗尽的 Recovery；历史 4 次
纠正与 Recovery 2/2 永久保留。Worker 的原有纠正/复杂度停止线不扩张，无进展、
新的证据/副作用未知、权限扩张或预算耗尽即停。没有每条命令跨端申请的新 Gate。

正式派发携带批准工具的绝对路径、命令/cwd/环境及测试选择，不允许角色猜 PATH、
另造工具根或吞 stderr。协调者按原始 stdout/stderr、数字退出码/信号和输入身份
确认结果，不能用“Script completed”或角色摘要代替。沿用既有入口与证据记录，
不为此开发新 runner、调度器、状态库或通用修复机制。

若用户同意本稿内容，下一步仍是 MacBook 制作可发布的正式补充：明确接受本次
已披露 UNKNOWN 的范围、批准 Gate/配置改动及新增有界预算、所需正式角色和精确
路径/命令；完成适用审查与 Git 发布授权后再转发原 Mini 任务。正常范围内技术
决定仍由 Mini 协调者按现有授权处理，MacBook 不代写生产规范或测试。

保留 Stage 0/1、旧 WIP 处置和工具/P1–P4 有效证据，不重做安装、成功探针或旧
WIP。旧 Change 仍为 BLOCKED / DISPATCH_ORPHAN_READY，不是 CLOSED。不得操作
旧状态/Host Loop、真实数据/Provider、main、归档或发布。一次性 Git/index 豁免不续用。

当前只交付本讨论稿并等待确认；尚未进行独立开发就绪审查，不宣称可执行或 Gate PASS。
