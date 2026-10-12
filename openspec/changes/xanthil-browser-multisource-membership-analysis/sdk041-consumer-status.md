# SDK0.4.1 产品消费者状态（未验收）

固定发行 commit703a2649090e5e145a86479dce0ced675d011035，tgz SHA256 1ddace3a5b7ff97e80627dc4660d9f300ac402a4bfc67f43144380d3352d6da5。证据根 /Users/bendandebaba/JuanerAI-artifacts/n01-n02/controller/v12-pi-sdk040-001；041增量 sdk041-successor001。以下是实际生产源码及已收回证据，不是共享SDK机制PASS的转写。

|能力|实际消费者与配置|当前证据/条件|
|---|---|---|
|N01/N02持续分析与停止|service-main→openModel.createRuntime→native-open-analysis→createSessionRuntime；Application持有业务授权/成果|real-application-result041-005：真实多轮工具/双模型保存报告；NEG02单次30秒截止、物理占用、迟到拒绝。当前UNKNOWN补验记录仍保留|
|N03/N19持久会话与单写入者|persistent-runtime-state sessionStorage，专属0700目录，0600独占writer-lock；bindOperation幂等|SDK041-03实际子进程重开/历史消费/累计保留，损坏与竞争既有测试；NEG03实际JSONL失败关闭工具效果|
|N04历史/副本/导航|原执行抽屉→sessionControl→native fork/history/navigate；改变位置不执行分析|controls-final001 HTTP授权链、运行中拒绝、历史读回及位置切换通过；正常空白网页启动/重开已观察；有内容网页052实际fork/navigation；053重开后读回nextRun并撤回，零Provider调用。新fork首次run前原生queue-authority缺失，仅inspect/history只读投影，queueAvailable=false|
|N05/N06专业内容|显式可信resources/skills与templates，实际run选择|native-selection因果RED/GREEN；专业内容进入请求。真实专业质量仍由IR/证据核对承担|
|N07压缩|显式compaction enabled/reserve16384/recent8192；同Task模型账本|真实29/30两次请求与compaction JSONL已保存。原006后续消费被预算拒绝FAIL保留；用户增量授权后007真实请求完整消费同一持久摘要并读回1050，Task不变|
|N08分支摘要|Adapter navigate支持summarize；网页当前显式false|无自动启用摘要；真实Provider用途补验未闭合|
|N09队列|原生control steer/followUp/nextRun/cancelQueued；查看/撤回现有抽屉|native-control离线重建后查看/撤回，无模型调用；不能将任意排队文本当新增资料/范围授权|
|N10/M01/M02模型用途|MiniMax-M3分析/准备，MiMo v2.6 Flash报告；预声明用途、统一Task；native retry关闭/extraAttempts1|真实产品005报告complete及1050/1100/50独立算术凭证属于报告切换原生Session之前；042原生Flash文本响应PASS不替代当前1.3结构化Application报告证据，当前补验068未运行。备用故障路由不能用报告角色成功代替相应用途验证|
|N11/N12进度与投影|业务步骤/历史及原生snapshot安全投影；Pi类型留Adapter|HTTP/UI受影响测试通过；不透传原始工具参数或思考。无需为未采用的hook/custom entry造消费者|
|N13工具/IR|共享analysis_tool转发Application受控业务工具，当前语义/版本进入请求|真实005工具结果消费、本地计算、独立核验、来源/版本回链；audit/ledger/save故障关闭效果|
|N14/N15执行环境|业务Python/IR继续使用既有验证过的隔离后端|host-code001 11PASS/0SKIP。未开放SDK任意read/write/edit/bash：当前任务无任意shell/网络授权；不回退无限Node环境，不宣称SDK单进程环境能执行多进程Python|
|N16计量/审计|原子SQLite claimUncapped/settleModelUsage、安全audit；单次4096输出/30秒模型/60秒工具/10秒控制IO|overflow/已知超量/损坏/audit负例，所有实际模型辅助经相同transport。旧有限身份不可直接切换；显式迁移尚未实施|
|N17搜索|产品原业务历史搜索保留；SDK仅history，不提供内置搜索引擎|不将接口名称宣称搜索能力|
|N18代理/M03 deferred/M04多模态/E01实验入口|本次无获准部署消费者/相应Provider能力|条件未启用；不自动代理、异步Provider、音视频、实验Runtime|

## 仍待关闭的真实缺口

- 原审查发现的新case/membership/专业入口旧Pi旁路已修正；service-main、browser-native、xanthil-desktop正常新任务采用native工厂。旧物理历史无本次native所有权时拒绝自动续接；不批量迁移、不覆盖历史。真实036专业和会员、048Case均PASS，受影响完整portable051已通过。
- portable002完整浏览器离线矩阵已收回（3903PASS/0FAIL/18SKIP）；正常空白网页启动/服务重开已观察。真实压缩后续消费007已收回；有内容原生网页控制052/053已验证；生产回滚、固定候选独立Validator及用户验收尚未闭合。
- 测试预算拒绝发生在实际Provider发出前，但Adapter已记issued，形成UNKNOWN；预算只读读回owner=null/reserved4096，失败和预留保留。007形成源脚本/30条物理回执核账证据后显式known-zero失败结算物理记录，原UNKNOWN读回/失败及SDK4096预留保留；不删行/清零/换Task。
- 新生产任务策略unlimited与本次验证总30请求/12万输出token是不同边界。用户增量4次获准后真实验证31/34次，原消耗不清零；产品累计策略不替代本次补验权限。

## 审查002后当前增量（尚未启用）
- FIX05：普通分析控制跳过 namespaced child Case，不把子会话归并为父会话。保持共享Task计量；活动子会话拒绝父控制，防止读错历史。因果RED058/独立旧候选失败056保留，修正059GREEN；新增活动子会话用例进入完整069。
- FIX06：三处正式settings入口改用 native-connection-probe→共享 SDK runText。该单次辅助入口无需持续JSONL；固定profile私有 connection-test-xiaomi-pro-v1，128token/30s，无工具、备用或自动重试，账本与审计跨实例保留；保存/刷新不调用。旧Pi仅保留历史兼容函数/测试，不再由这三处生产探针选用。064二十项受影响检查和类型通过；069为当前完整回归。
- 060缺模块是测试接入失败；066是修正后对hash匹配的原候选legacy入口作出的旧行为重现，不伪称预实施因果RED。065缺测试清单、067 VM fixture缺新factory均保留，assertions未削弱。
- 真实Case048本轮PASS，累计40physical/10992output，不重置；旧Case window到期。新增真实068及SDK设置探针需要待回复的8次/30min窗口。原UNKNOWN4096预留不消除。
- 回滚源核对057尚缺17文件，包括旧Adapter/Application等运行代码；没有完整旧R3执行目标。可安全停止新入口和保留旧入口/历史，但不能假称完整SDK退回可执行。已向用户提出有限回滚条件，未答复前不启用。


### SDK041 accepted supplement078–081
User 允许 approved12new/30min cumulative60/output120000; original48/12118 preserved. Old UNKNOWN076 normal resume rejected TASK_UNCONFIRMED. A new task in same project078 correctly failed TASK_BUSY before physical invocation because global pending history remains; not cleared. Independent synthetic validation project079 used same cumulative external allowance and actual Application/native production factory, not migration or budget reset. Real10requests (MiniMax9 + native MiMoFlash1), actualIR/local calculation1050 and independent bigint_source_recheck1050, report saved. Strict1.3 numeric compiler rejected unbound numeral in interpretation (input/output倍率均为1), statuspartial withREPORT_UNBOUND_NUMBER; valid fact1050 and evidence retained. Exit1 is strict complete-report assertion FAIL, not whole chain PASS. No prompt repair or guard weakening. New normal settings shared SDK probe080 passed one physical MiMoPro call,128max output and persistent audit. Total59physical/14387output,0physicalUNKNOWN/0reserved, one allowed request remains, no automatic use. Prior SDK4096 reservations/businessUNKNOWN persist. No source change after portable073 (3924PASS/0FAIL/18conditionalSKIP). User 同意，接受 explicitly accepted limited rollback stopping new entry and preserving previous entries/data; complete prior executableSDK restoration unavailable. Full evidence: sdk041-successor001/checkpoint081.json. Final independent review and activation remain pending.


## 本机启用085（条件工程接受，用户验收待完成）
原profile及正常webentry已受控启用SDK041-003/0.4.1；activation-readback085保存实际端口、包hash、七任务未变、0自动模型调用。独立003原BLOCKED历史RED缺口获当前用户明确接受，只记豁免；无其他接入功能安全阻断。有限回滚接受、partial报告严格FAIL、旧UNKNOWN和条件能力全部保留。本人验收PENDING，不继续其他v1.2或自动跟进。详见sdk041-engineering-acceptance.md。
