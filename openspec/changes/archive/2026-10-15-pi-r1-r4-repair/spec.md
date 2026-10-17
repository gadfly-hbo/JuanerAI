# R1～R4 当前工程行为规格

来源：已批准路线 B 与 bundle-001 完整报告/修订 Mini 提示，HEAD 8265a3920ee1205faec7dede8b0c84e648105d9d。不是新产品计划，不改业务授权、IR、UI 或旧任务。

## 需求与验收

- R1-CTX：实际最终 Provider 请求含全部 system/schema/history/current tool/reasoning/图片协议开销与输出预留，在每候选、压缩后、摘要调用前重新准入。SDK 接缝未交付时保持 UNKNOWN，不用768KiB或bytes/4证明tokens安全。
- R1-READ：Application 小目录引用由 Pi Adapter 接既有原生 read 工厂，文件映射/授权/撤权/本地全量计算属产品；不得引入 bash 或第二分页引擎。所有裁剪资料必须可在批准边界内继续取得。
- R2-FAIL：Agent 长度恢复、Worker 拒截断、原生错误分类、已知usage与未知物理状态分开；所有恢复共用一次额外尝试，工具已完成不重放；安全诊断从账本/Store读回UI，刷新无新模型调用。
- R3-CORRECTION-01：首次探索失败的模型回包及变更目标被拒回包不含原始 inspection、rows 或cells；返回既有纠错身份、原始请求、真实输入摘要哈希及执行位置。SOURCES[0] 保留完整原始物化输入，模型代码仍由现有执行器取得获准全量资料。该位置不是新提供的模型read引用，不冒充R1已完成。
- R3-CORRECTION-02：保留一次纠错上限、明确纠错入口、原目标/绑定/total_check、相同资料校验、已执行/未执行状态、safe diagnostic；不允许变更目标规避失败，也不把探索成功当独立证明。
- R3-OUTPUT：逐工具约束模型回包；全量结果与证据本地保留，适用原生read引用；超限不否认已发生效果，不自动重放，不删原生历史。已实现纠错inspection、本地物理proof正文、rewrite事实及完全重复资料quote投影；唯一大结果及执行后超限回执仍待闭合。
- R4-ROUTE：按每个已批准purpose装配真正候选链；每候选检查接收方、能力、协议、窗口和授权，实际模型身份持久化。保留retained/旧任务配置，不能复用backup变量推导新授权。

## finding → 范围 → 证据映射

| finding | 本轮责任 | 验证与剩余项 |
|---|---|---|
| F01/F03 | R1 SDK最终准入/原生压缩；产品最后投影接点 | C06接缝缺口探针；V06/V07完整压缩验证待新包 |
| F02/F06 | R2 SDK恢复/分类；产品持久读回 | C03/C04/C07及V08、V10–V14，UI未知 |
| F04 | R1 inspection、R3全工具回包 | J01实际链旧输出，纠错切片R3-CORRECTION；V02–V05、V15/V16待联合 |
| F05 | R4用途候选链 | C05中立消费者成功；实际产品候选链未接 |
| F07 | R3必要重复投影 | 保留historyOwnership及原生历史；不整体重写 |
| F08/F09 | R6大范围兼容/队列退役延期 | 保留旧包旧任务；必要回归V14不授权替换 |
| F10 | R1原生read错误分类 | C02旧包误报；V17 read部分，完整搜索延期 |

## V01～V17 适用性

| V | 范围/当前材料 | 尚未关闭 |
|---|---|---|
| V01 | 小资料实际业务链 | IR差异产生不同结果、proof/store/client联合 |
| V02 | J01两份2985行真实生产链投影 | 本地全量计算与Outcome，不声称token故障复现 |
| V03 | 合法边界unicode/escape规模 | 8MiB/32MiB/100k cells组合 |
| V04 | 多文件/2048sheet目录 | 有界目录且全部可达 |
| V05 | C01原生read续行 | 10000列/32767长cell/单行JSON及引用端到端 |
| V06 | C06后投影未接准入探针 | 200k/1M候选、输出预留和最终guard |
| V07 | 实际native session已启动 | 当前巨型tool保留尾部与压缩后重查 |
| V08 | C03/C04/C07 length与真实SSE | HTTP400/context/402/429/5xx/network完整分类及共享恢复 |
| V09 | C05同Task native用途fallback+工具一次 | 产品purpose配置及不同窗口候选 |
| V10 | C05工具完成再模型失败 | 全部partial effects与已知usage组合 |
| V11 | 既有原save断言保留 | SDK/native/ledger/business持久失败联合 |
| V12 | 后续产品链 | Store→HTTP→client→renderer诊断持久化、刷新不调用 |
| V13 | 既有取消/UNKNOWN未改 | 新包恢复机制取消、撤权、迟到、未结 |
| V14 | 保留0.84.2兼容与0.4.3历史 | 新包旧任务/skills/fork固定配置回归 |
| V15 | 27工具清单、纠错回包切片 | 逐工具bytes/token预算与证据/副作用保真 |
| V16 | 保留原独立proof与目标完整约束 | 新包完整报告事实/观点/不足/lineage |
| V17 | C01路径/链接拒绝；C02缺文件分类 | 撤权、超长行、不支持能力；grep/find/ls不属本轮 |

## 验证级别

中立SDK消费者是安装包真实native+合成transport，预算memory store不证明生产持久化；C07真实pi-ai编解码+离线fetch。J01经过实际Application/Adapter/安装包，但停于inspection且无Outcome。R3应用测试用合成执行Port证明投影和调用边界，不称真实Python/Provider。完整候选独立Validator尚未派发。

## 2026-10-14 继续工程：独立输出切片

用户明确只暂停依赖SDK实际接口/固定包的部分，002已转交SDK（采纳/实现仍未知）。工程继续使用原任务与WIP。

- R3-OUTPUT-02：模型侧核验回包保留真实grade/method/plan/source/result hash、value/rows和物理证明ID及哈希；`native_evidence.primary`、`independent`、`group_labels` 属本地证明全文，不重复进入模型工具回包。计算结果本身保持完整，原proof在核验、持久化、Outcome和报告验收时保持完整。本需求不能作为大计算结果有界或R1准入已完成的声明。
- R3-OUTPUT-03：rewrite_saved_report仍只在已批准报告准备路径调用原本地事实校验，成功后返回原状态/未计算标识及事实摘要身份；不将整份facts回灌准备模型。后续既有report_edit路径从原保存状态重新读取完整事实并校验/保存，无新增引用、读取、分页、SDK接口或事实权限。事实校验失败、撤权或源状态变化仍阻止后续保存，不能把请求回执当报告已保存。
- R3-FAULT-01：Tool已成功、后续模型失败时保留实际效果和证据；存储失败不发布假Outcome、不自动重放计算。现有SDK不能证明的新恢复/错误语义保持待验，使用旧固定包测试只记录其真实行为。
- R3-STATE-01：被动读回已失败/UNKNOWN任务及账本，不新增模型/工具效果，不退款已知usage，不用重开任务掩盖未知。新增SDK诊断字段及UI呈现等待实际语义回执，不模拟接口通过。

允许路径增量：本Change材料；`packages/application/open-analysis.ts`上述两项私有工具投影；现有`open-analysis-application.integration.test.ts`与`open-analysis-autonomous-native-session.integration.test.ts`的相应验收测试。测试资产保留原断言，检查完整本地proof、效果/未知/保存否决与实际安装包接缝。其他大集合/长字段若需要原生续读支持，列入精确依赖清单，不引入产品替代机制。

- R3-OUTPUT-04：语义工具反馈保留精确quote、解释值/来源等级、真实source/message身份与位置。仅在资料source引用中question全文与quote完全相等时，省去模型回包中的重复引用内question；用户message引用的question、定义/冲突的user_question和所有不同文本原样保留，不裁剪引用或解释。interpret_meaning、bind_measurement、assess_meaning及describe_meaning代理路径复用此私有投影。本地semantics、Framework/Clarification、原合法引用校验保持原完整字段，模型反馈不能作为canonical语义存储格式。

## SDK中间合同接续001

R1新增guard签名、冻结DTO及配置身份已确定，具体顺序/策略缺口/消费者待包断言见sdk-api-alignment-001.md。旧包尚无该导出，准备测试未执行，不计集成GREEN。R2完整载体、R3执行后越限回执、read独立限额类别仍未确定。2048sheet/10000列/32767cell夹具实际source inspector已通过，目录可达/模型read/guard与Outcome组合仍待验证。

## R1-POLICY-DIAG-01：独立策略测量

在未取得新包时，可使用既有Application/实际Adapter/安装0.4.3/createPiTransport/真实Pi codec及显式离线fetch，测量已批准候选配置和真实phase schema下最终ModelRequest.messages包络与编码后HTTP body。仅使用本任务合成资料、synthetic API key，不读取凭据或访问Provider；读到缺口/失败如实记录。此为诊断消费者，不改生产行为，无guard模拟实现，也不作为因果RED/GREEN或新包集成。

记录每次实际请求的候选/protocol/output cap、消息数/角色、工具声明字节、UTF-8 messages包络、HTTP body字节及其编码区别，关联现有产品账本。Unicode、转义、长字段、10000列和2048sheet资料使用既有实际解析结果；本地原件保持完整。HTTP字节差异不等同token差异，不足以证明protocolOverheadTokens/safetyMarginTokens/imageTokens。任何新策略数值若无可验证依据继续UNKNOWN。下一源码范围只增加consumer诊断脚本和本Change结果记录，不扩展生产允许路径。

## 固定0.5.1-r1r4.2接续：当前切片规格与影响决定

原授权允许精确固定新包受控采用，当前合同003已核验，R2/R3/read公共接缝不再缺定义。只在本工作树增加vendor新精确包、package.json/lock和独立安装；旧0.4.3 vendor与原锁/安装证据保留，不消费SDK源码或其他工作树node_modules。原Provider/业务重放/部署/Git停止线不变。接口定义已到不意味着产品接通。

R2-STORE-01：Pi Adapter的现有持久BudgetLease在有限/不封顶两策略实现recordModelUsage；按同一task/owner/reservedTokens在现有SQLite事务中确认消费。final且output已知才释放对应输出预留；known-zero正常结算；部分/unknown增加已确认输入或输出下界而保留全部预留；非法值、缺真实预留、事务失败不能部分写入或声称已确认；快照/重开/旧配置保持原合同，调用故障失败关闭。此切片复用已有usage.inputTokens/outputTokens/reservedOutputTokens和reservations记录，不新增SQL表/列/版本、迁移或历史重放；保留原SDK消费字段含义，不新增business schema。SDK每物理尝试一次原子callback是接口前提，不建立宿主恢复循环。

R2-AUDIT-01：现有Pi Adapter内部审计JSON只接受SDK已确定的安全可选modelOutcome/toolOutcome，逐字段及父事件模型/工具/invocation关系验证，unknown/partial/final/physical/responseModel及completed效果保持原语义；拒raw prompt、错误正文、任意extra字段或异常形状，不自动sanitize后声称原件安全。旧未带新字段的audit读回完全保持。无SQL表/列/存储布局改变；新增可选载体仅由Pi Adapter拥有，不泄漏SDK类型到Core/Ports。未来业务Store/HTTP/UI载体另在本Change闭合中立映射，不将本审计切片冒充完整R2。

允许路径本阶段扩展：vendor/pi-agent-runtime/0.5.1-r1r4.2/（只新增固定复制）；package.json/package-lock.json（固定依赖）；adapters/agent-pi/persistent-runtime-state.ts（原子callback/安全audit）；现有shared-runtime-state.integration.test.ts（保留全部原断言，新增SDK公共消费者及事务/历史负向用例）。不新增结构Gate或第二角色，按当前明确用户接续和上述既有字段影响决定开展TDD。

后续R1最终guard、R3模型输出/read桥接、R4候选及业务持久/UI联合仍由主Agent原地推进，逐行为先规格后因果RED。生产准入数值仍UNKNOWN，不将SDK合成policy启用到正常生产Profile。无完整候选时不派最终Validator。

R2-AUDIT-02：实际固定SDK的v1迟到确认必须在取消返回后独立持久记录model.finished/tool.finished安全载体（reason为CANCELLED/DEADLINE_EXCEEDED），不能因原signal已abort拒绝该既成事实；依然拒绝其他取消写入和未知extra。原RunResult冻结UNKNOWN快照不改、已知输入增量持久但输出预留不退款、实际idle前owner不释放、不发布或重试。现有SQLite审计存储负责记录，不创建第二取消/恢复机制。用真实安装SDK与本产品持久BudgetStore/AuditSink确认同进程迟到及重开读回，不把transport合成SSE数字叫Provider实测。

R1-WIRE-01/R2-WIRE-01：原Pi Adapter增加可信composition私有r1r4配置（contextAdmission为实际固定SDK策略或null未核定标识），仅用于获准新Task；未传仍是旧固定配置兼容，不能给旧Task新策略强绑。配置固定到SDK新Task身份。完成实际phase schema/description及retained cap/signal投影，核验候选接收方后，在产品ledger.reserve/issue/凭据/HTTP之前对同一final DTO正式guard，成功后原样发送。null策略明确未核定，安全拒出站、不使用默认合成值。SDK Runtime与实际PiTransport成对v1；自定义回复必须有真实匹配outcome，缺载体按UNKNOWN失败关闭。

physical ledger用现有OperationUsage.Meter.kind/known_lower_bound映射真实known-zero、部分已知和UNKNOWN，不新增业务持久schema。失败outcome.confirmed/unknown分别决定已有ledger失败状态；物理未知不重试，迟到/撤权/取消不发布，SDK接收真实安全载体，不因host后置throw丢掉已知用量。完整modelOutcome/toolOutcome由当前已验证的Adapter安全audit保存，actual model标识来自outcome，responseModel仍分开；下游完整业务诊断读回尚需中立映射，不称R2已完成。

允许路径追加adapters/agent-pi/native-open-analysis.ts和其既有open-analysis-autonomous-native-session.integration.test.ts。R1生产策略UNKNOWN，现有服务/普通Profile未启用实验policy；新composition若明确进入r1r4但无核定policy须拒，离线fixture策略仅为测试输入。旧Task使用旧省略配置，采用新的SDK包不授权改绑、迁移或重放。

R1-SELECTED-READ-01（API003实际后、规格先行）：新策略的业务Runtime宣告selectedMaterialRead:v1，并接Application.readSelectedMaterial私有业务Port回调；仅当前immutable Task/scope已选来源可读。资料path采用既有source_id/source_sha256/sheet_id/row/column：source/<id>/<sha>/sheets.txt；.../sheet/<编码sheet>/columns.txt、rows.txt、cell/<row>/<编码column>.txt。它们是本次授权资料的派生文本定位，不能读任意磁盘、URL、目录或别的Task；不是新SDK合同或通用资源仓库。source()原Grant、撤权/取消与scope hash复核在异步前后保持。旧Task/省略配置保留旧inspection预览，不强绑read。

新inspect_selected仅给完整32来源内小目录及每来源sheet目录路径/总数；工作表目录列出全部可见sheet并给字段/行位置目录，字段目录逐字段保留真实column身份、表头短预览和原cell可读定位，行目录列出所有真实row与实际column，不从物理CSV行推断业务row。列/行目录由原生read offset/limit续读，宿主不做第二分页。长cell以512个Unicode码点一行的窄JSON文本片段保留全部原字符及原source/sheet/row/column/type、码点位置，原value留本地；片段是派生读取视图，不变更2000字符语义quote上限或原精确引用校验，不得以预览/片段代替完整IR计算。

Pi Adapter直接createExecutionTools(host,['read'])；SDK原生content/details/offset/limit负责呈现、裁剪和续读。SDK固定工具登记、selectedTools、各purpose和可信最终phase投影均显式包括获准read，保留native description/schema；不经analysis_tool参数编码破坏。host只解析当前虚拟资料目录与readSelectedMaterial，复用业务scope权威，resolve/stat/read分别前后核验，write/exec拒绝。未授权/源变更/取消/缺失/不支持/限额使用API003已确定类别，不把任意异常推断为not_found。所有read逐Task授权/计量/审计、每后续模型请求仍正式guard；长行提示不开放bash。完整source/计算/核验/Outcome仍走原全量流程。

此为已授权R1资料映射私有影响决定：增加业务Port可选回调/能力标识和本次派生视图，不新增业务持久表/列/版本、权威、存储引擎或SDK类型。允许路径新增packages/ports/open-analysis-runtime.ts及packages/application/open-analysis.ts上述业务映射，既有Adapter/native和app测试；保持原断言。原native配置信息加入read policy身份，只用于获准新Task，不迁移/重放旧任务。

R1-SELECTED-READ-03：小目录和原cell视图保留来源document的reader身份、status与limitations；OCR未确认不升级为事实。cell.type/value及可选source_value的区别明确，原source_value全文也以窄文本片段保留；相同全文可以显式标识相等，缺失不能猜补。原语义精确引用/数值编译仍读完整原字段，view不改变权限或核验等级。

R4-PURPOSE-01：在已经明确新策略的analysis/proposal_prepare用途，按当前明确首选装配已批准MiniMax-M3/200000/Anthropic与mimo-v2.6-flash/1048576/OpenAI候选链；report_edit按原Flash/thinking-off合同为首选、MiniMax为备用。每个用途独立拥有SDK purpose.fallbacks，共用现有modelRecovery.extraAttempts:1与关闭的原retry，不堆叠宿主重试或新循环。retained_case旧membership合同只批准mimo-v2.6-pro，未获该用途新候选授权，维持单候选及2048 cap，不把其他用途批准迁移到保留业务。未显式新策略的旧Task purpose配置不改。

每个request须在最终guard/physical reserve前与该用途批准candidate的provider/id/protocol/endpoint/window/output/thinking声明匹配，原Grant/撤权/取消也重检；凭据只在guard之后取得，并再次按该candidate endpoint/id匹配。200k过大/未知物理不能作为盲切理由；每次请求、summary/compaction及备用仍同Task独立计量/审计。已成功工具不重放；unknown工具安全停止。产品成功结果provider/model读actual RunResult.modelOutcome配置candidate，reported model单独审计。新方案纳入SDK immutable Task配置，旧配置仍拒CONFIGURATION_CHANGED；生产policy UNKNOWN，不启用normal Profile，不声称真实Provider验证。

read窄视图实现已加入document/source_value保真；host read policy固定为juanerai-selected-material-v2以避免旧interim v1配置热换。200k current-turn完整长cell尾部在实际guard触边拒绝是安全预期，1048576明确批准候选在合成策略下完整读取通过；没有放大配置窗口或删除尾部。前述200k初始读测PASS只绑定当时view，不能继承到新增原值/观察限制后的candidate。

R3-MODEL-OUTPUT-01：新策略中每个实际注册SDK工具明确固定modelOutput policyVersion与maxBytes=1048576（原SDK字节上界，不代表token安全）。Pi Adapter把业务Tool可选modelResult纯输出投影接到正式Tool.modelOutput.project；不创建工具循环、共享输出仓库或通用读取器。业务Port只用unknown/标准JSON/AbortSignal，不泄漏SDK类型。project失败/撤权/保存拒绝时保留SDK已记录completed、真实resourceUnits/invocation和已有回执；旧省略策略工具配置不改。

R3-VERIFIED-READ-01：calculate_and_verify与execute_step的模型结果若超过64KiB，在上述project接点给出小的已核验计算回执、真实goal/operation/rows/unit/grade、plan/result/inspection身份；短scalar value（<=8192 bytes）原样给出，长value/全部groups/完整IR及proof按evidence/<plan_sha256>/facts.txt获准读取。完整JSON在现有qualifiedStepResults/当前已核验fact及已有Store/Outcome保存，不新增JSON仓库；read回调按原identity/scope和plan/result hash再次确认后给窄完整文本片段，使用原生offset/limit。该path必须实际可读，hash单独不是引用。仅当真实calculation/verification匹配才投影，不把需求/未执行/失败分支包装成verified。小结果及旧Task保留原回包；其它大业务工具按各实际返回点继续闭合，不假称全27已完成。

私有影响决定/允许路径追加：packages/ports/open-analysis-runtime.ts的可选纯业务modelResult callback；Application上述已核验fact的非持久视图；native Adapter Tool.modelOutput桥接及原native/app tests。无DB表/列/存储格式或新权威，无新SDK输出合同；read工具host policy升到juanerai-analysis-material-v3（source+既有verified facts），SDK新Task拒旧interim配置强绑。

R3事实read的外发范围：完整calculation/IR与既有modelVerification安全证明身份/范围可读；native_evidence.primary/independent/group_labels全文及私有执行日志/路径继续只留本地Store/Outcome，不通过read重新外发。read不是绕过原R3-OUTPUT-02数据边界的后门。host material policy v4与model-output policy v2固定这项语义；旧interim v3/v1任务不热换。

R3-EFFECT-01：业务callback已成功返回后，dispatcher的撤权/取消或平台JSON序列化失败属于结果交付失败，不能改写既成效果为未执行。新策略将实际SDK invocation透传到dispatcher；只在这个已返回点提供匹配name/effect/resourceUnits/invocation的真实ToolOutputFailure(completed)。callback自身抛错仍unknown，不能推断完成。Native名与兼容analysis_tool名在Adapter内按真实外层注册名称映射；旧省略策略保留原Error.code行为。SDK正式modelOutput.project/maxBytes失败沿用已completed语义，不补造receipt，不重放、不退已知消耗；完整真实资料/保存结果保留本地。

允许新增Adapter内部open-analysis.ts上述实际已完成点载体与原测试。没有更改业务effect授权、SDK实现、共享合同或持久结构。

R2-UNKNOWN-TOOL-01：新策略SDK安全audit中write/external ToolOutcome仍unknown时，Application把本次任务保留unknown，已有verified_steps/proof不丢；物理model全部已结也不能作为业务工具效果已确认的证据。Runtime提供业务中立只读hasUnconfirmedEffects(task_id)；按真实invocation最新terminal事实判定，历史unknown记录保留，不从异常/旧数字推断完成。原未带新载体任务不补猜，不能自动补收据/清账。恢复、重新启动/采纳新revision等依赖可执行动作须先拒未确认工具效果；读回/当前原生停止检查不派发模型。只复用现有audit/Task未知状态，无新持久字段或恢复机制。旧停止/明确reconciliation范围保留，SDK实际补事实不会改冻结旧snapshot。

允许路径packages/application/open-analysis-workspace.ts、业务Runtime Port、Native Adapter只读helper及既有native tests；对原新策略proof-save负向分类改为unknown，旧省略策略的failed历史不改。

R2-DIAGNOSTIC-READ-01：从已有安全audit及持久accounting投影业务中立只读诊断（无新Task持久字段/表/布局）。保留所有model known0/partial/physical/usageFinal/实际配置与reported model、tool completed/unknown/delivery/真实receipt和根预算预留；故障码来自真实安全载体或run.finished.reason，不从0/output1/HTTP字节或前一次quota猜最后原因。原生Session预reserve拒绝只给INVALID_REQUEST时显示请求未被接受/具体原因UNKNOWN；前次physical观察单列。Runtime成功不等业务Outcome保存成功，业务failed但没有持久原因时明确核验/保存阶段原因未确认，不补造保存成功/精确失败类别。legacy不补猜新v1事实。历史版本与当前身份过滤，根累计消费/UNKNOWN不重置。

R2-CORRELATION-01：ModelRequest无SDK run/session参数，实际native audit的model.admitted→transport→model.finished在单owner序列中成对。Adapter记录实际admission key，物理reserve后保有真实receipt；仅匹配本次admission的finished在现有可选digest写入稳定请求回执身份hash（request_id+input_sha256+provider+model），不替换model.admitted原digest。它是明确标注的宿主关联补充，不冒充SDK原始body或虚拟物理调用；guard未发送或无匹配不写回执关联。读取只在ledger唯一匹配时回传request_id，不靠时间/名字推断。旧事件和fixed包不改。

只读HTTP diagnostics endpoint沿用现有本机同源权限；GET/刷新不调用Model/Tool。客户端中立中文摘要进入原执行详情events列表，保留已接受壳层/抽屉/交互，UNKNOWN效果恢复按钮禁用；实际模型/预算/下界与保存状态分开，不新增批准/迁移UI。所有正文转义，私有路径/凭据/原始错误不外发。适用已批准AUUI-01/07/09与v1.3 UI合同/公共DESIGN/DEVICE说明；本机无项目根DESIGN.md，按已批准合同与公共补充实施文字/真实信息绑定，不另造布局。

允许路径增加apps/browser/local-server.ts、quick-analysis-client.mjs及d.mts的只读endpoint/现有投影/执行列表绑定；业务Runtime Port的中立ReadModel、Workspace只读diagnostics、原native/client契约验收测试。不涉及新持久结构、真实服务切换、Provider、其他工程或Git。

R2-NATIVE-RECOVERY-01：用本产品实际持久Budget/Audit/ledger及固定包native Session检查一次length/context恢复；摘要与恢复每次最终guard、当前授权及物理消费均独立记录，同一Task。已完成业务工具仅执行一次。再次length、未知物理、摘要返回后撤权或超大摘要导致后续guard否决时不发布完整结果、不补宿主恢复；每逻辑调用额外额度仍由SDK独占。超大摘要夹具是恶意/违约transport回包，不宣称合法Provider输出或生产参数有效。保留原会话原件及重开预算/audit，不把SDK memory消费者替代本产品持久证据。本节是原联合矩阵的覆盖补验；若原代码已经满足，记录实测而不伪造RED。

R3-EVIDENCE-READ-01：新策略read_analysis_evidence的已核验大calculation集合复用当前evidence/<plan_sha>/facts.txt及完整本地事实；模型侧逐真实已核验fact给小回执与可读定位。当前execution_plan/required_calculations/recipes/candidate及身份字段原样保留，不能删去旧checkpoint恢复合同或把missing改为verified。只有大结果超64KiB时使用已有可读事实映射，不创建通用结果存储、新SDK引用或新的读取权限。旧Task和小回包不变。

R1-WIDE-ROWS-01：10000字段的获准资料行目录须通过原生read可读取；不得形成超50KiB单行后提示未授权bash。业务行目录按每128个实际column标识给窄JSON文本行，显式保留row、columns_start、column_count及cell位置，不丢列、不从分页序号猜业务row；这是资料派生视图，不增加宿主分页。现有columns/cell全文映射、native offset/limit和当前授权复核保持；material policy升级v5，旧interim配置不热绑。实际CSV inspector→native read→全量IR/独立核验→SQLite/Outcome验证，不拿预览代替计算。

R3-FRAMEWORK-INPUT-01提案撤回：宽资料夹具set_framework缺实际required group_mode，在dispatcher参数验证前停止，ToolOutcome是unknown，并非1MiB模型输出上限。Workspace实际agentLed:true本就不返回execution_input；没有证据支撑本次改变非agent旧回包。相关试改已撤回，旧合同保留；当前只实施已测R1窄行及R3事实投影，model-output v4记录事实目录投影语义。

R2-BROWSER-DIAGNOSTIC-01：在任务专属临时localhost测试server、实际已安装Chrome及纯合成ProviderFailure上验证Profile→Application→Adapter→固定包持久audit/ledger→HTTP→实际client paint→既有执行抽屉。只读查看/刷新不得新增请求。已确认quota零与未知network部分用量分别显示；未知不出现可用恢复。1440/1366宽度不改变现有布局合同，截图/实际DOM/错误列表存本任务证据。此为离线测试server，不启动生产服务、凭据或Provider。

R2-UI-STATUS-01：执行详情旧物理账本列表把已定义status投影为中文状态文字，不显示temporary_failure等实现枚举；状态值/原因/预算不改，未知值以未确认文字显示，不推断用量。保持provider/model实际身份便于检查，不添加用户决策流程。

R1-CAPACITY-JOINT-01：复用已固定capacity/large-fixtures逐文件bytes/SHA身份，实际inspector→新策略native目录/read→正式候选200k/1M guard→全量count IR/独立核验→SQLite/Outcome重开。100000cells精确8MiB单源count999；32MiB四源count3996；2048sheet全部保留且原生读至最后source最后sheet，只对明确最后sheet计数1，不冒充2048sheet全局方法。实际原件和scope全量保留；每新案例/候选新合成Task，不重放原失败Task，无生产policy或Provider声称。覆盖补验脚本位于consumer/fixed-package-large-joint.mjs，现有实现满足则不伪造RED。

R3-BOUND-MEANING-READ-01：仅新策略且已有真正保存的当前Framework/context时，大semantic反馈可复用该context.semantics原件，给assessment_sha256及meaning/<sha>/assessment.txt私有可读定位；保留saved/classification/next_action原状态。读取须当前Task/scope/源身份和当前context/semantics一致，每次重查，不能读取旧解释或其他Task。完整语义引用/原句/位置/倍率仍存在现有Framework/Context/Outcome结构，不新增持久字段/表/通用结果仓库。未绑定、未保存或原件不一致的semantic反馈不套此投影，保持原上限/拒绝及精确待决定点，不能谎称已持久保留。此私有模型视图只在大回包使用；旧策略/小语义回包不改。原生read负责offset/limit，宿主仅512码点窄JSON视图；不新建分页/Session。material policy v6/model-output v5固定已保存语义视图的新Task组合，不热绑旧interim配置。

R3-CANDIDATE-SAVED-01（现合同修正）：proposalOnly 中即使已绑定候选 plan，assess_meaning/describe_meaning 反馈仍须 saved:false；只有非准备执行路径真正保存当前框架后才可返回 saved:true。候选编译不构成持久确认；原已有框架不变，不执行计算或保存 Outcome。测试接缝为现有 Application 动态工具 execute → 反馈与最终候选，使用既有合成 Runtime 边界，不新增存储合同。

R3-CANDIDATE-MEANING-READ-01（现合同修正）：meaning/assessment 私有读取除现有当前语义/源/授权匹配外，必须有当前 plan 已保存身份；proposalOnly 的未保存 context 不得借“已保存框架”标签开放该 namespace。拒绝保留完整候选及原历史，不造读取回退、通用仓库或恢复。测试接缝为 Application 的 readSelectedMaterial；已保存语义的既有实际 SDK 正向/失效读取回归保留。

PREP-S01（用户2026-10-15整体批准D1～D8 A）：显式新任务1.4可在原Task JSON保存具名准备快照；原1.0～1.3不回填。真实执行lease或当前preparing Preview才能写入，完整身份/epoch/source/Context/语义/业务/候选IR闭合，只有保存确认才能给小回执。相同owner/内容幂等，原数组仅追加，无删除/退款/重放。单项16MiB、当前及历史合计64MiB/1000项、候选64，事务内超限拒绝且旧原件不变。新旧严格读取、状态转移/修订/重开保持载体版本和历史；取消/unknown/旧epoch不能晚写；保存不改变正式框架/Outcome/Preview状态。

PREP-A01/PREP-J01：具名生产者经Application保存完整准备正文后，再以固定preparation/{id}/{sha}/{semantics,business,framework,candidates}.txt读取原件，小反馈明示草稿未采纳/未计算。读取逐次校验owner/当前Source/config/权限，旧快照/错SHA/其他Preview/撤权拒绝。Store/HTTP/client/UI读回零模型效果；模型read按真实SDK计量。新Runtime产品能力只随新固定material/model-output身份启用，不增加SDK观察或Task配置字段。旧required_calculations.execution_plan和finish_result.result及消费者保留，不缩减。实际App→Adapter→固定.3 native Session→Store→HTTP/client/UI与大资料、故障、重开、旧配置必须联合验证，不用模拟接口证明。

R3-EXPLORATION-READ-01：新策略的成功探索/纠正大value仅在原saveExploration已真实确认后给小MODEL_EXPLORATION/not_performed回执和exploration/<execution_id>/<value_sha256>/result.txt可读定位；保留摘要、图表标题/type/unit、各完整点数及观察数，唯一点/标签/完整观察通过该当前已保存业务原件可读。私有App配置接收现有Task.explorations作为重开视图材料，按Task/revision/scope/config身份过滤，不增Store字段/SQL/持久格式或通用结果仓库。派生read仅返回既有展示value及原not_performed/适用有限total_check，不外发receipt中的本机路径、代码、stdout或私有执行资料。完整原始输出及既有业务记录继续保留，探索不升格为独立proof；关键数字仍走原IR独立核验。失败/needs_code_correction/未知保存不生成成功引用，一次纠正上限不改；旧策略和小输出保持原回包。material v7/model-output v6固定新组合，不热绑旧interim。

R2-CODEC-PHYSICAL-01：通过实际安装createPiTransport/native Session与产品持久callback/audit/ledger，以离线fetch制造429/503/401及network，逐次比较fetch次数、physical ledger数量、凭据withCredential次数与SDKmodel.finished/预算modelCalls；不能让底层codec自动HTTP重试越过物理计量。未知network不得自动换候选/重试，已收到且允许恢复的rate/unavailable共享一次额度；安全载体不含原始error正文。若出现共享包隐式重试则保留最小复现/固定身份并暂停受影响发送接点，不改SDK。此为原验证矩阵覆盖补验，不预填PASS。

R2-STRUCTURED-RETAINED-01：retained_case现有业务合同只接受单个完整原始JSON，新策略实际transport收到length时以真实安全ModelOutcome/known usage及INVALID_OUTPUT失败关闭，不把截断片段进入Agent长度恢复/摘要/报告。不改变旧Session purpose.mode、候选或2048 cap，旧省略策略保留固定合同。SessionRuntime.run公开接口是runAgent；不猜造持久worker/text Session签名或切换模式。此为Adapter执行已有结构化完整性合同，未新增Worker/Session机制；实际Provider codec长度与持久账本/审计已知消费同时验证。

R2-STRUCTURED-REPORT-01：新策略report_edit在真实JuanerAI.report-edit.v1结构化调用合同下也拒length，保留真实已知用量，不用Agent摘要恢复生成另一份JSON。普通自然语言Agent长度恢复保持；不猜worker/text持久Session入口。整体新SDK purpose-plan modelOutput policy v7固定该宿主结构化完整性规则，旧省略策略仍原固定配置。

R3-CHILD-CONTEXT-01（私有影响决定）：仅新read能力且当前已选authorized_context超过64KiB时，子任务prompt及read_authorized_context只给完整allowed_references、真实source.owner和collaboration/<context_sha>/context.txt定位。完整材料仍从现有Case Source/受限授权context获得；native read只接受当前这一个context路径，每次重检request.authorize/sourceOwner/signal，绝不复用父任务source/facts目录或读原始表格/其他Context。无新持久字段、共享SDK引用合同、仓库/分页/Session引擎；旧/小context保持原回包，finish_result/result恢复字段保持完整。当前namespace由既有native read映射支持，material v8/model-output v8固定新Task。只读view阈值不是token安全参数，仍每次最终guard。允许路径增加adapters/agent-pi/open-analysis-collaboration.ts上述最小授权视图与现有Native Adapter/test。Source最小材料的私有proof正文外发边界另按已有R3-OUTPUT-02收口，不以read扩大来源。

R3-COLLAB-PROOF-01：新read能力的真实Personal Profile使用Source模型证据视图；aggregate.content中的verification仅移出native_evidence.primary/independent/group_labels完整本地证明正文，保留既有独立grade/method/计算/执行身份及其摘要hash。原完整Task/Outcome/proof不改；open_origin.outcome_sha仍指真实原Outcome，aggregate.sha按实际投影content重算，字段与引用来自真实投影，不把旧sha冒充新内容。明确model view说明。旧省略策略/Source默认保持原内容与sha，不强改旧冻结Source/子任务。此为已有R3-OUTPUT-02跨实际消费者落实，不新增持久schema/权限/数据接受方或SDK字段；新数据策略model-output/material v9随SDK不可变purpose-plan固定。允许新增adapters/storage-local/open-analysis-collaboration.ts和profiles/personal/open-analysis.ts私有配置/投影及现有测试。

R3-COLLAB-PROOF-02覆盖补验：实际members/orders CSV inspector→受信DuckDB primary+独立Python M1/M2→原Store/Outcome全部native_evidence→Source模型视图→实际固定SDK子任务Context；确认正文不进入child最终DTO，原完整Proof和Scope/hash保留。不用projection单元假proof替代该联合证据，无真实Provider。

R3-DELEGATION-RESULT-01：对当前授权Parent/子conversation通过既有collaboration.results实际取得的大MODEL意见集合，仅模型侧用真实result.id/version/sha定位collaboration-result/<id>/<version>/<sha>/value.txt；完整value、来源和review继续由现有Case Assistant记录拥有。已保存结果的小模型视图明确saved_result_view，保留原合法references、摘要（<=8192 bytes才原样内联，否则仅给可读正文）、limitations/unknowns计数；失败/等待/UNKNOWN状态条目全部原样保留，不删唯一意见或伪造摘要/成功。read重新取当前同一授权results并匹配精确身份后只给完整ChildResultValue/MODEL标识，任何其它结果/版本/sha不读。领域专用纯投影/文本函数复用Root/child，非通用输出仓库/读取/分页或SDK替代合同。旧及<=64KiB结果保持；finish_result恢复字段不改。model-output/material v10固定新组合。允许现有Application delegation模块、Root/child调用及既有测试，不新增持久字段。

R3-DELEGATION-RESULT-02：根任务GOAL_COMPLETION_REVIEW消费同一既有results集合时，亦仅在新read能力将大MODEL意见纯投影后放入模型prompt；原意见完整Case记录和准确read身份保持，completion review不新增授权、计算或Outcome。否则不得以仅工具modelOutput已压小声称所有实际回灌点闭合。

R3-DELEGATION-CATALOG-01：当前read_delegation_materials真实大目录仅模型回包使用小目录视图，仍列全部真实material短ref、来源/核验标记与view数量；过长label只显示明确截断的预览，完整唯一label、所有views/path/合同保留在同一当前目录的delegation-materials/<catalog_sha>/catalog.txt。原生read现场重新经既有collaboration.materials授权及同一短ref/views注册构造目录，匹配完整SHA，旧/其它任务/已改变目录拒读；选择仍由原validateViewSelection及queue再验，不扩大授权。只此业务目录及原读工厂，非分页引擎/通用仓库。小<=64KiB和旧省略策略保持原数组；模型目录读取不创建子任务、不计算、不保存新成果。Root/recursive均相同业务helper，material/model-output v11固定语义。允许现有delegation模块/Root/child/Adapter已授权路径及现有测试。

R3-DELEGATION-CATALOG-01身份澄清：Native producer已存在对instruction_contract的flat/view参数说明改写，因此locator绑定真实material短ref/label/verification/actions及全部真实view身份（无view的旧目录还绑定reference_paths），而不是非权威说明文案；read另外报告完整原目录content_sha256。参数以本轮实际工具声明/read_tool_contract为准，不让历史目录说明扩大schema/权限。所有真实选择内容及授权视图仍参与身份，不单靠label或数量。

R2-FAULT-BOUNDARY-01：新v1 Runtime在撤权后的SDK history/cleanup等分支抛出RuntimeFault时，Pi Adapter将正式reason转换为原中立业务code再回到Application；完整实际carrier仍由既有ledger/audit拥有，不把SDK实例/未审查正文传入业务Port，不改变撤权、消费或UNKNOWN。旧省略策略异常行为保留。

R1R4-FIXED-CI-01：精确0.5.1-r1r4.2本工作树采用需要将既有prepare-ci-install唯一固定SDK及repository manifest/lock pins更新到已核验新身份；只改版本/path/SHA/SRI/dependency和相应夹具常量，保留原archive、node-gyp唯一三transport字段、manifest/lock漂移拒绝、隔离prepare/finalize/无npm/Git及所有负向断言。旧SDK vendor/历史pins/失败日志留存，不修改SDK或CI workflow、不运行远端CI、不取得Git/发布权限。允许tools/harness/validation/prepare-ci-install.mjs及其现有.test.mjs；为本Change固定依赖采用所需私有验证输入更新。

R1R4-FIXED-CI-02：local-analysis集成测试的闭合安装oracle追加唯一PiR1R4Repair tuple（新固定SDK路径，其余完整manifest、172根tsconfig及configuration inventory原样）；原Change006/SDK043及更旧历史tuple常量和全部拒绝断言留存。只对当前实际root/lock断言选择新oracle，禁止浮动包路径、同版本不同SHA、依赖/根列表漂移。允许现有tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts中的oracle及新固定采用负向测试，不修改其他产品/CLI行为或本机全局配置。

R3-SAVED-PLAN-READ-01：只在当前实际saveFramework已确认（或已加载的本任务Framework原件）且plan/source身份仍一致时，对set_*_framework的大binding反馈作模型侧saved_plan_view；保留原current_plan_ref/plan_sha/候选及原unit_authority标记，完整IR、value_mappings及preview存于原Framework，analysis-plan/<plan_sha>/plan.txt通过原生read取完整当前IR派生文本。SHA/当前计划/源变化/撤权拒读；只读不计算、不提升模型映射的业务可信等级。旧省略、小回包及proposalOnly未保存回包保持，不改execution_input或checkpoint恢复字段，不新增持久存储/通用reader。允许既有App/Adapter原生路径桥接及现有native集成测试。material/model-output v12在GREEN后固定。

R3-SAVED-STEPS-READ-01：仅当前实际已保存的steps graph，set_analysis_steps的大回包、read_analysis_evidence.current_steps及本轮模型system中的graph副本给小步骤视图；仍列全部真实step_id、依赖、available/unavailable原状态及唯一正文计数/明确title预览，并指analysis-steps/<graph_sha>/steps.txt的完整原proposal反馈。当前图的recipe大集合保留真实plan_ref，用明确goal预览及analysis-plan/<saved_node_plan_sha>/plan.txt读同一已保存节点的完整IR，不截掉节点、依赖、待证条件、限制或改scope。read现场匹配当前已保存graph/plan及当前source；未保存/proposalOnly或不属于原已保存图的candidate保持原回包，required_calculations.execution_plan旧checkpoint恢复字段保持。没有新持久字段、SDK格式、通用reader或调度；仍SDK原生read及原execute_step/完整IR/独立核验/Store/Outcome。material/model-output v13在GREEN固定；沿用现有允许路径和native集成测试。

R3-SHARED-WIRE-01：新v1现代Session使用保留analysis_tool JSON gateway时，实际回包是原业务JSON（不是{name,result}包装）。Adapter在execute前仅以正式同一invocation全部身份关联当前已注册业务name，project再把原业务value交给对应modelResult；不改回包形状、不储存业务输出或猜value字段。调用失败及投影结束清关联，无对应invocation失败关闭；无producer/无projection/参数诊断保持原件。SDK ToolOutcome仍为真实analysis_tool invocation/name，不伪换效果身份。旧省略策略原样，不把旧SDK Proxy直接接v1、不迁移旧Task或新增Session。v14固定组合；允许原Native Adapter桥接及现有native tests。原实现设计误假定包装形状已据实际返回点纠正，首次失败保留。

R3-FACT-COLLECTION-01：当前verified_calculations集合整体大于64KiB时，每项实际已保存fact均用小receipt，不以单项未超限为由重灌完整execution_plan；明确goal预览/截断标志及原facts URI保留所有唯一原文。共同阅读指令只放集合外层一次，原fact/IR/proof/Outcome保持，required_calculations.execution_plan旧恢复字段不动。所有scope/hash/auth与完整read来源仍原reportEvidence/Store，非通用分页或仓库。v15固定新组合，沿用既有App/Adapter/native test允许路径。

R1-SCHEMA-OWNERSHIP-01：最终guard递归冻结同一发送DTO，但不能冻结借用的Application动态schema而破坏现有refreshReferenceChoices。Pi Adapter在最终受信phase投影完成时、guard之前用标准structuredClone生成自己拥有的JSON schema，随后同一冻结DTO通过reserve/issue/credentials/send；不在guard后换schema、不复制guard实现、不改SDK/原Core枚举更新。下一请求重新从当前真实合同投影/准入。各schema路径（native object及原JSON wire中直接schema分支）均需此所有权隔离。当前已有64事实用例首先暴露冻结别名回调失败，此段是R1接线因果RED，不算R3输出RED；未验证的collection试改已独立保存后回退本控制器的这一小段，待此R1闭合再建立真正输出RED。

## API004 read安全失败载体窄增量（2026-10-15）

READ-CARRIER-004：只采用固定0.5.1-r1r4.3新增ToolOutcome.failureCategory可选封闭枚举；Pi专有类型留Adapter，业务Port提供中立file_failure_category，同值枚举。持久audit读取/写入允许此可选字段；只从正式toolOutcome读，不解析reason/message/cause/code。旧记录缺省、不认识值读回unknown，不回填原件；顶层reason/效果status/modelOutput/receipt/完整invocation/resource及usage独立，不改变Task配置/恢复/重放。当前用户已授权实际App→Adapter→持久Session→Store→HTTP/client/UI九组和负向/late/兼容，原UI仅既有诊断区域显示稳定中文类别，不改变动作权限或布局。

允许路径追加：既有persistent-runtime-state/native-open-analysis、ports/open-analysis-runtime、browser quick-analysis-client及其既有类型/renderer诊断、native/shared-runtime-state现有integration tests；精确package/lock/vendor新不可变副本和采用oracle原文件。没有SDK源码、node_modules补丁或新业务持久schema。

验收：九类fault的factory与Session分别计数；model1/tool1无重放、known7/3、UNKNOWN效果保留、安全类别与匹配invocation持久重开、HTTP/client/UI刷新0调用。缺字段/未来非法枚举unknown；取消冻结快照不变/late独立保存；显式cancel优先errno。host限额与native截断/续行分开；伪造/不匹配载体、账本/audit故障继续失败关闭。先新包实际消费者，再产品causalRED→最小GREEN和受影响回归。旧.2/API003/历史/UNKNOWN保留；production policy/Provider/服务/Git停止线不变。

READ-CARRIER-004-LATE-UI：独立候选001反例证明实际SDK迟到tool.finished顶层reason缺省，停止原因由正式toolOutcome.reason提供；现审计已据event.reason??out.reason识别late，诊断必须沿同一受信结构化来源标after_stop。既有event顶层原因优先，缺省取正式outcome.reason，且仅CANCELLED/DEADLINE_EXCEEDED标停止后。即时factory cancelled/timeout但顶层运行TOOL_FAILED的正常失败不得误标迟到；不改原冻结UNKNOWN、计量、回执或raw历史。永久补两种实际持久Session→诊断→client/renderer断言及九即时失败的负向after_stop断言。

PREP实施路径登记（D1～D8批准范围的工程细化）：packages/ports/open-analysis-store.ts 与原Runtime Port，packages/application/open-analysis-preparation.ts 纯业务结构/校验私有模块，原App/Workspace、storage-local/open-analysis.ts、native-open-analysis.ts及原App/native测试；无SDK源码或其他工作树。上述原Task JSON字段变化按用户整体A关闭，不重新引入仓库/恢复或公共SDK替代合同。必要参数及验证先后见implementation-design001与原始RED before-images；本路径登记不冒充先前未存在的精确文件冻结。
