# 精简接点与来源决定

本候选基于 main `41e6c1f167cea578960a2d0c75e86e5f31a9190e`；在独立 Mini 工作树
`work/mac-mini/agent-host-simplification` 兼容接收固定119的必要业务／测试增量。
主输入为包内 README、启动 Prompt、整体方案 v0.2、职责原则 C1～C6，产品效力沿用
已批准 Change007 GB 与 UI v0.3。新工程只形成完整离线候选，不恢复两条旧工程。

正常控制链为 Browser → Personal Profile → OpenAnalysis Application业务能力 →
业务 Runtime Port → Pi Adapter → 固定 `.5` → Pi Session/Harness。
Pi 负责正常工具与模型推进；Application 保留授权、语义、IR、受限执行、独立核验、
正式报告审查和成果效力。确定性计算、委派等待续接与已有正式审查不是新的通用 Agent 循环。

## 八类接缝去向

| 接缝 | 实际消费方及本次决定 | 对应可执行证据 |
|---|---|---|
| 工具合同 C4 | `open-analysis-proposal-schema` 将版本共同约束提至同一根，分支继续闭合允许字段、版本及必填；固定 `.5` 负责原生参数准备和最终 codec。保留真实业务编译及结构诊断，不新增 converter、宽松替代 schema 或 SDK 实现。 | `agent-host-proposal-contract`：所有支持版本正例、缺字段／额外字段／错类型，原完整 schema 对照；R1-WIRE、VC10、LA21/26/34。 |
| 发现／阶段 C2 | `firstLoopToolView` 复用 RC18 的同源声明状态：已声明工具只说明声明与前提，未声明的复杂工具保留完整用途并给出精确 `read_tool_contract`。当前授权及业务前提仍在效果前检查。原生代码路径自动采用现有按需合同，不在每轮重复四份长 IR。 | 真实 Browser LA09 三对照；R3 大目录／计划读回、V13-CURRENT-CHOICES108、native discovery／原参数反例。 |
| 确定性手续 C6 | Application 在执行已绑定计划时登记既有 required-calculation 身份；报告 `draft/report.json` 的 ID、版本与全文 hash 由既有 Store 管理，模型调用空参数 `complete_artifact`。仍用当前 source／meaning／Binding／IR，不按文字推断业务参数。 | AH-FILE 两例、LA07/22/23/32、原数值／步骤独立核验与源变化、撤权反例。 |
| 错误循环 C1/C5 | 删除 Application 在正常完成后追加的 `GOAL_COMPLETION_REVIEW` 模型调度。Agent 在同一原生循环选择工具；缺依赖继续硬拒绝。恢复 main 的候选准入、读能力、model/tool 回执关联及 UNKNOWN 栅栏；已执行、未送出与未知效果不互相替代。 | control-loop 因果 RED034／GREEN035；原三次计算、委派读回和全覆盖断言仍在；R1～R4、LA06/08/11/36/42。 |
| 运行策略 C1/C6 | 复用现行批准资源和 `.5` public ModelAttempt，不另造超时／重试治理层。共享 work 统一计量和一次恢复、原绝对期限不续期；普通首循环与 GB 有各自批准口径。 | R1/R2/R4 purpose／fallback／usage，LA03/04/11/19/27/38～40/42/43/44、预算与并发反例。 |
| 文件／长内容 C3/C5 | 复用原生 read/write/edit、真实持久完整代码草稿和原监督器；完整 IR 执行后独立核验。报告原生文件完成后同版封存和全文逐页审查；兼容旧 build_artifact 载体只保留其已有消费者。 | LA09 原 none/syntax/sandbox、实际 HTTP Browser 三例、原 Mac 监督器联合路径；LA01/02/05/07/15/16/17/22/23/32/41、AH-FILE、JR109～112。 |
| 新旧入口 C1/C6 | 同一 `createIndependentBrowserOpenModel` 工厂用于实际服务与离线测试；保留原默认装配身份，显式 harness／shared-work 选择纳入其配置身份。新任务选定路径不回落旧工具循环。旧兼容导出／读取合同仍有测试消费者，不以“看似不用”删历史恢复或改旧 Task。 | LA29～32/35/37、agent-host Browser codec 联合链；现行 native／legacy runtime suites、已有插件回归。 |
| 状态／恢复 C5/C6 | 业务 Store／IR／Outcome 为业务权威，SDK Session／accounting／物理回执各守其职责。首循环用公开 `inspectFacts` 和会话控制；私有历史解析仅留有明确 guard 的旧兼容恢复。旧账本不读、不迁、不清零；新合成 UNKNOWN 被动重开仍 UNKNOWN。 | R2、R3-FAULT、PREP-J、LA14/17/25/26/36/38～44、JR112、恢复／Fork／并发套件。 |

表中测试标识是覆盖入口，最终新跑结果及完整候选身份统一见 verification.md。
不能用早期局部 PASS 替代最终完整回归，也不能用合成模型通过判定真实 Q 质量。

## 活动入口与保留边界

| 入口 | 装配／当前处理 |
|---|---|
| 正常 Browser 未选择 harness | 仍为现有 Personal Profile → Native Pi Session 工厂。保留默认授权配置身份和工具兼容；本次删除宿主补跑同样适用。没有启动真实服务或切换用户生产配置。 |
| Browser `harnessFirstLoop.version=v0.2` | 固定 `.5` 原生工具准备／批次准入、SDK 原生循环和 R1 上下文准入；当前实际执行工具与声明来自同一合同。 |
| 上述选择 `work_recovery=v1` | 同一工厂添加既有共享 work 与长成果能力；不把旧 Task 当新 work，不修改默认配置。分析／形成／逐页审查共用期限、物理尝试与一次恢复。 |
| Personal Profile／Workspace | 继续负责源材料授权、明确需求／语义及真实 IR、受限执行和保存；只向 Port 传 JuanerAI／平台类型。新文件能力是标准字节 read/write 回调，不泄漏 Pi 类型。 |
| analysis／proposal_prepare／report_edit／conclusion_strategy_review／retained_case | 使用现有 SDK purpose 和获准候选链；实际回执报告实际模型，准入先于物理预留；GB维持固定用途路由，普通主线保留已批准fallback。正式报告形成／复核轮次维持 GB，不形成额外正常 Agent 调度者。 |
| 队列、停止取消、迟到、重开、显式恢复、Fork／跨用途 | 保留现有业务授权和 SDK 会话边界。持有未结算模型或工具效果时拒绝恢复／改版；不能靠换 ID、Fork 或新 runtime 清账。 |
| `createPiOpenAnalysisRuntime` 旧导出 | 图谱 inbound 无生产调用；静态引用仅 `xiaomi-local` 兼容转出和既有 `open-agent-runtime` 测试。保持原兼容合同供回归，正常 Browser 不选择它；未证明仓外消费者和历史兼容可删，故不删除导出或历史格式。 |
| 旧115长输出 workPolicy | 固定 `.5` 无该未发布合同，显式拒绝，0 模型／0 旧账修改；不写 SDK 替代物。旧原夹具及失败保留。 |
| Desktop／Supplier、其它插件 | 仅适用共享源码／类型与现有回归；没有打包安装、真实 GUI 产品接受或 Supplier 验收。main 已集成 PR90/91、decision-platform、deep-research 保留。 |

入口调查优先使用图谱 search/trace；图谱不含集成测试时才以静态精确引用补足。
导出存在不等于正常产品装配调用，有限静态证据也不证明仓外消费者不存在。

## 资源、合同与工程影响决定

- 当前非共享普通首循环保留主32768／备16384输出预留、600000ms模型、300000ms工具、
  30000ms控制及原 uncapped 累计政策；GB review-policy 与共享 work 维持其4096口径。
  旧 GB 原300秒绝对 work 期限、一次共享恢复、native retry 关闭保持。LA09仍200000窗口、
  原4096预留和65536字节程序上限。不同范围不相互覆盖。
- Pro报告与retained-case虽然同名，输出预留／凭据入口按purpose区分；retained-case仍2048，GB报告仍4096。
- 并发SQLite元数据初始化先设置原有busy_timeout=1000，再设置synchronous=FULL；只调整原生等待策略生效顺序，不新增重试、等待时间或持久结构。LA44真实独占争用因果RED／GREEN补充LA43两进程原子恢复槽。
- 根字段复用不删版本分支的字段闭合和必填；legacy 诊断同时读取根约束与选择分支，
  不把诊断实现当新的执行验证器。
- `artifactFile` 只接获准任务当前 `draft/report.json`；`write` 复用原 Store 原子落盘与 CAS，
  不增加磁盘权限、报告资格或新的持久记录格式。完成仍经过业务校验与同版封存。
- 兼容接收固定119已有的 GB／长成果／共享 work 增量；本轮未另外设计数据库、通用状态
  注册表、迁移平台或 SDK schema。当前 main 已有的 preparation Task1.4、授权、审计和
  R1～R4 逻辑通过现行反例恢复，不能以119较旧实现覆盖它们。成功探索保存后使用main既有readableExplorations映射，保留400点完整图与MODEL／not_performed标签；不因模型投影缺索引而丢当前可读证据。
- 导出接受可选 `x-xanthil-review-sha256`，当前消费者传真实同版审查 hash；不匹配时在
  返回成果字节前 `REVISION_CONFLICT`。原无 header 客户端、`x-xanthil-report-content`
  的 `1.0`／`current` 兼容仍保留，没有改变原审查资格。
- CI 安装身份只更新固定 SDK；非 SDK lock 条目不变。类型清单及 Canonical 测试输入新增
  必要20根／4集成文件，保留全部旧根和缺失／额外／重复／顺序反例，不放宽匹配器。

## 测试资产与来源处理

固定原件不改。采用清单、最终逐文件 main／119／repair2／候选 SHA 和 diff 位于证据根
`source-assessment/`，必要自有修正另标，不把119原 FAIL 候选宣称原样通过。

原有测试文件保持：STEP123、native joint、delegation-result、V13 及普通报告场景的额外
宿主调度断言改为单次原生循环内完成相同实际业务和独立核验；遗漏计算仍拒绝，撤权／
取消／陈旧源／未知效果不放宽。R3 工具失败丢回执的 UNKNOWN 断言保持，修复 main
栅栏和当前 recipe 引用身份匹配，而非降低为 failed 或删掉长标题／方案。

schema 变薄后旧长字段容量负例不再到200k窗口；仅其纯合成长字段重复数4500→7000，
更大窗口候选读取从两页增至三页，仍精确拼回全值。保持原小窗口拒绝、无物理预留和
全部字节断言。LA09原程序／表达式和资源完全未改。

旧长成果载体的测试保留为兼容消费；新 AH-FILE 明确验证原生文件，截断不得封存。
不支持的未发布 workPolicy 路径改为精确显式拒绝，冻结原测试与历史失败继续可查。
LA33维持普通入口INVALID_REQUEST包装和CONTEXT_LIMIT诊断／零过大物理请求；LA34显式选择固定GB政策，普通fallback／恢复仍由R4／R2反例覆盖。
没有通过删除负例、跳过必要反例、放大窗口／期限／补发制造完成。

## 回滚与停止边界

回滚是在另行授权的隔离树按固定 main 及原精确依赖重建装配；保留本次新测试状态、
回执与证据，不把新合同 Task 交旧 SDK 继续，也不清账或重放。未修改两旧树和固定包。
本树及证据根的本机持久副本不是 Git 集成或跨设备备份。

完整离线候选经固定源码／依赖／入口和独立验证后停止；真实 Provider／业务数据、
真实质量／产品接受、Git交付／正式归档、安装发布和生产切换仍需另行授权。

## 候选001独立发现的影响决定

F-STORE-01属于从冻结119向当前main兼容接收时遗漏的既有完整校验。恢复原有合法值、reviewRecord及validateReviewUpdates调用，继续走相同decode/get/save边界；不引入新字段、表、迁移或业务授权。以重新计算行摘要的本轮合成记录从真实Store API验证拒绝，并保留旧格式、main preparation及同版审查的正负覆盖。

F-RECOVERY-01属于既有artifactWork与Native model准入的接线遗漏。将已授权正常尝试及一次恢复事实接入现有草稿准入；不新增重试层、不改变120/240、60/120或300秒绝对期限、不升级SDK或扩大Provider／业务数据权限。用实际Browser/Profile组合覆盖形成、修订和逐页审查以及撤权／取消／UNKNOWN／后续恢复拒绝。若会改变持久合同或既有额度则停止该扩展，先作进一步影响决定。
