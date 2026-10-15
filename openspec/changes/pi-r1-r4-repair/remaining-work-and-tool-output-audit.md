# 剩余依赖与 R3 业务工具输出审计（2026-10-14 续行）

沿用 `/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI`、`work/mac-mini/pi-r1-r4-repair`、HEAD `8265a3920ee1205faec7dede8b0c84e648105d9d` 与原 WIP。用户已确认002转交SDK；SDK已用原收据确认取得002，中间R1 API回执已核验；固定新包仍未交付。上轮以SDK依赖覆盖整体停止的边界过宽，本次按用户纠正逐项恢复独立工作。没有新任务/分支/工作树。

证据根：`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-output-002/`。

## 三类剩余工作

| 分类/工作 | 当前实际处理 | 精确依赖/返回点 |
|---|---|---|
| 1：当前注册和动态阶段逐工具审计 | 已枚举主应用/子任务源码输出分支；实际运行10种phase登记，观察集合27项与native固定名单一致 | static-tool-output-final.json、dynamic-tool-output-inventory.json；登记只跑只读工具，不冒充全部效果分支验收 |
| 1：完整物理证明回灌 | R3-OUTPUT-02已修正模型verification及report_evidence，保留grade/hash/物理ID，完整primary/independent/group_labels仍在本地proof与Outcome | 因果RED→GREEN、原会员真实执行回归；不改变本地验收用proof |
| 1：改写报告准备回灌完整facts | R3-OUTPUT-03已改为原请求状态+未计算标志+facts_sha256；callback实际校验成功和撤权后check保留 | 既有后续report_edit独立读原完整facts，hash不是新读取引用，也不是报告已保存 |
| 1：语义回包重复原文 | R3-OUTPUT-04仅省去资料source引用中与quote完全相同的question（用户message引用question及定义/冲突user_question保留）；精确quote、位置、来源等级与不同原文保留 | 本地canonical semantics未改；相同/不同文本和真实引用校验测试通过 |
| 1：大资料/效果/保存/UNKNOWN读回准备 | 六项真实安装包离线链测试已完成：两份2985行CSV实际sum/mean、Tool后模型失败/UNKNOWN、proof/Outcome保存失败；真实Store与HTTP被动读回 | synthetic modelTransport，旧SDK0.4.3；没有模拟新API。状态原因的新版安全诊断/Renderer联合仍待2/3类 |
| 1：合法大资料夹具 | 已生成10000列含32767字符的真实CSV、32个64sheet的真实XLSX、原生read用长单行JSON，逐文件hash；另capacity-fixtures-001生成精确8MiB/100000cells及32MiB批次并实际正/负读取通过 | 两个上传批次分别是单个wide CSV和32个XLSX；不把33个文件合并提交。JSON仅供原生read，不新增产品上传格式 |
| 1：19跳过核对与本地可补验项 | 18项已在真实本机资源下补验，另1项真实Provider明确未执行 | 逐项见 skipped-19-followup.md；不冒充Hosted CI/native安装/新SDK验收 |
| 1→3：R1最后投影准入、压缩后重查 | 实际admitModelRequest/contextAdmission合同已收到，接线设计/策略缺口/六项真实guard消费者已准备 | sdk-api-alignment-001.md；旧包无guard，新包后再接真实Adapter并验证零物理reserve/issue/凭据/HTTP、各候选和摘要重查，生产policy值仍需核定 |
| 1/2/3：R1获准read/长单行/续读与错误类别 | 既有createExecutionTools/read及原生offset/limit已明确；产品映射/窄文本责任可独立设计 | 新content/classification不能套到旧0.4.3；独立限额类别待API增量；实际获准映射/撤权/续读及全部目录可达待联合，不能补通用读取器 |
| 2：R3真实大集合/长字段 | 本次仅去重复信息，不裁剪唯一业务结果、方案、证据或可选材料 | SDK既有输出/原生read组合机制：返回可实际授权读取的材料、越限后receipt/效果语义。先按下表各返回点对齐再改 |
| 2：R2 failure/known usage/physical状态 | 新载体/持久安全诊断字段没有猜造 | SDK实际stop/error/usage/物理状态载体与一次额外尝试统一语义→Adapter→账本/Store/HTTP/client/Renderer；状态刷新不调用模型 |
| 2：R4用途候选链 | 既有SDK fallback机制已用中立消费者局部证明；产品真实链未装配 | 先闭合R1/R2的每候选准入/授权/恢复，共用额外尝试；不能先开盲切。具体已有purpose字段仍按实际回执消费 |
| 3：新包实际消费者联合验证 | 尚未开始，不用mock新API证明接通 | 新精确tgz/hash/依赖/内容manifest/合同可读→隔离安装→解析/字节核验→Application/Adapter/实际包/IR/proof/Outcome/HTTP/client/Renderer |
| 3：R1/R2→R4→完整R3与独立评审 | 尚未完整候选 | 先实际证明上下文/恢复/计量，再验证主备真实接续；完成V01～V17，冻结完整候选后派独立juaner_validator |

真实Provider以及Git发布/生产切换属于另行授权事项；不借2/3类接收自动执行。

## 当前所有27个native名称及实际输出

主应用：analysis-basic16、analysis-code18、analysis-discovery22、accepted-steps20、metric-ports22；准备：new14、focused14、saved-report15；子任务：manual3、recursive6。只是实际应用可见subset，native固定注册27不表示每个phase都有27项。原analysis_tool/JSON wire兼容与retained CLI工具保留，不作为额外业务工具重复计数。

下面的“有限”指已有业务/编译约束；单次JSON字节 ceiling和资料容量均不等于完整上下文token准入。未知worst-case bytes/token不填数冒充结论。

| 工具 | 成功/分支输出与现有约束 | 大资料/长字段/效果/证据判断及返回点 |
|---|---|---|
| ask_user | 具体问题或candidate_ready/inspect_selected_material，问题≤12000字符 | 有限业务文字；真正等待才随后保存Clarification；保留未执行/未采纳语义，不把文字改成新权限 |
| assess_meaning | task_only语义、冲突，definitions/conflicts≤16、单段≤2000 | OUTPUT04去完全相同的原文副本；唯一的长备选与完整解释不能裁剪，必要read材料机制待2类 |
| interpret_meaning | SOURCE/USER_INTERPRETED语义、next_action，≤16维×16依据 | OUTPUT04保留精确quote、实际source/message/位置；本地canonical完整。sourceEvidence默认整格quote的2000字符约束与32767cell上限存在差异：长格引用能力仍待工程影响核对，不能称SDKread一到即自动解决 |
| describe_meaning | 转入interpret/assess的同类反馈 | 不另建语义权威；与上两项相同投影和未闭合点 |
| bind_measurement | task_only语义及money/unscaled绑定，每类≤16字段 | OUTPUT04只去重复原文；倍率/币种/单位、实际输入字段全部保留；不能删除有效依据或自动补倍率 |
| describe_business | MODEL_PROPOSAL business、saved:false | 用户冻结业务范围由本地框架保留；purpose/scope/deliverables等唯一内容不截断，最坏复杂文本需共享输出/read机制 |
| inspect_selected | 来源/工作表全计数、768KiB字段/行预览、表头截断标志 | 已知旧有界bytes预览；全64sheet/10000字段、长cell和目录本身可能超限。缺失部分必须可实际获准继续读取，待R1read/准入，不能认定R1关闭 |
| set_framework | plan_hash/binding/current_ref、准备candidate或执行说明；旧非agent生成代码路径还含execution_input | 当前普通agent不返回inspection；binding/value_mappings长数组不能静默裁剪。非agent旧执行输入牵涉保留兼容，待明确scope及真实读取接口，不退役旧路径 |
| set_multisource_framework | 同persistFramework，inputs2～32及每项filter≤16 | 保存确认后回执；完整来源/筛选不可丢。大binding/输入资料兼容返回同上 |
| set_joined_framework | 同persistFramework，真实关联/退款关系与范围 | 不把合同变成默认关联或隐式去重；聚焦schema已有current_ref，新共享读取格式待2类 |
| set_membership_framework | 同persistFramework；本地期间/会员派生、实际primary+独立proof | OUTPUT02只移出模型证明全文；原M1/M2实际执行/保存保留。大组结果和完整payload读取待2类 |
| set_document_framework | 同persistFramework，source quote IR | 原文位置/观点分级保留；长位置列表及唯一文档内容需原生read；不把OCR当已核验 |
| set_metric_asset_framework | 同persistFramework，精确asset/approval绑定 | 六指标/13周/品类/期间原业务方法不拆缩水；资产定义/多类结果大集合待2类，不能用gross代替net |
| read_project_metric_asset | 精确选定六指标/scenario/批准scope，或disclosure_required/no_approved_asset | 专业正文非业务实例数据，但须原外发许可；动态登记测到无批准分支，不冒充批准正文worst-case验证。唯一公式/开关保留，正文越限需实际共享read |
| set_analysis_steps | replace完整图或append本批新节点、total_steps及未计算标志；图≤24 | 不返回已编译proof，保留既有节点与依赖；proposal/conditions可能大，不能只保留标题。读引用待2类，append已避免重发旧图 |
| execute_step | 依赖缺口及未计算状态，或实际calculate_and_verify输出 | 开算前保存step event，真实效果receipt不能否认；OUTPUT02复用，全部唯一分组/派生仍待共享大输出支持 |
| calculate_and_verify | 完整calculation、model proof、当前report_evidence；命中缓存不重算；失败纠错一次 | OUTPUT02完整物理证明原件保留本地；calculation和report_evidence中的业务结果仍可能重复/大。大groups/comparison/allocation/reconciliation/asset结果不能缩水，需SDK执行后越限语义与实际read引用。六项故障链证据保留 |
| explore_with_python | exploration/value/charts、not_performed、当前证据、有限守恒结果；失败/一次纠错 | 原inspection已移出纠错回包；original_request和safe diagnostic保留；charts唯一数据不能截断。大结果及完整证据回灌待共享机制；成功探索不是proof |
| correct_exploration_code | 原pending操作一次纠错的上述结果；没有pending拒绝 | 保留原scope/资料复核/第二次失败/第三次不执行；未新增读取。成功结果的大集合返回点同explore |
| read_analysis_evidence | 所有当前verified facts、required recipes/ref、候选/步骤、saved_recipe候选不可用原因；要求≤64、候选≤64 | OUTPUT02去物理proof正文，仍有完整calculation/execution_plan/recipes。有些execution_plan供旧checkpoint恢复使用；不可简单删除或换未知opaque引用。待共享read与兼容接缝对齐 |
| rewrite_saved_report | 小请求回执、calculation_performed:false、facts_sha256 | OUTPUT03；完整facts通过既有后台report_edit再次读原状态。源变化/撤权禁止返回有效请求，不宣称报告保存完成 |
| read_tool_contract | 精确当前description/schema、executed:false | 是有意义的参数合同；动态enum随真实Context发放引用，不能静默删schema分支。实测phase/schema bytes在dynamic inventory；最后请求仍需R1guard |
| read_delegation_materials | 真实选定材料目录、views、出处哈希、actions/path列表 | 主/递归都按原授权和短ref映射；views、引用和长字段目录可大。不能裁掉可选材料或扩大目录；待共享分页/read接口，原0.4 object/native projections保留 |
| delegate_analysis | queued/returned或未创建纠正；真实child/material IDs、完整selected集合/selected_views | 最大8材料/12实际引用；有界receipt本轮未改。排队/创建效应不算完成，唯一一次纠正与停止不重命名绕过；超限不得重放 |
| read_delegation_results | 完整MODEL意见、限制、状态和来源；已省略重复aggregate.content | 该已有投影保留；结果集合/长意见仍可大，不能删失败/UNKNOWN或唯一意见。待共享读取，保留MODEL不是独立proof |
| read_authorized_context | 子任务明确选中context/references/history/report/aggregate | 子任务许可不是父全部资料；不能粗截全文或跳过授权。需与共享read能力组合，不能新增通用读取器或第二Session |
| finish_result | MODEL完整result、pending review、实际选中references | 原history恢复从result字段读回；不能只换成hash导致重开丢结果。长意见/limitations/unknowns及引用集合需共享输出机制与既有持久消费对齐 |

本轮不宣称上述所有worst-case输出都有bytes/token硬预算。fixture中16384/2048断言只是固定重复材料样本的尺寸与退化检测，不是新全局业务限额。唯一期望语义仍由Core/既有契约拥有。

## 具体新包返回顺序

1. R1 guard及既有read公共签名已由中间001确认，Mini已形成设计与待包消费者。SDK API增量仍须确认：read内容/续读/错误、最终强制guard、执行后输出超限如何保留effect与receipt、stop/error/known usage/UNKNOWN、摘要计量与共享一次恢复。
2. Mini按每工具业务内容制定小结果/实际授权读取映射；持续保留原执行、完整证据和旧任务。需要改变旧恢复所用字段时先作本Change兼容影响决定，不猜新格式。
3. 固定包可读、hash/内容/依赖完整后隔离安装；新的实际装载来源必须重新固定，旧0.4.3与失败证据保留。2026-10-14本次检查sdk-incoming目录尚不存在；这是约定位置事实，不是全机不存在声明。
4. 实际消费者先R1/R2，再R4候选链，再全部R3大集合/长字段/引用/效果语义与V01～V17；Outcome/UI及完整候选独立验证各自报告。真实Provider另行授权。

当前接口对齐与策略核对见sdk-api-alignment-001.md。本轮独立实现没有增加SDK类型进入业务Core/Port、没有复制guard或修改SDK包；已冻结传送002保留。

接续独立项已追加完成：R1实际codec九组/十八次测量、资料身份/窄文本/phase过滤/Task兼容设计。现有观测不支持生产token参数；下一guard/read桥接实现与联合测试须固定新包，R2/R3/read限额须API增量。具体证据和本次边界见verification.md末节。

## 固定API003/0.5.1-r1r4.2之后：当前返回点（前述待包是历史）

原生guard、ModelOutcome/BudgetLease、ToolOutcome/ToolOutputFailure、Tool.modelOutput、read和purpose.fallbacks接口现已送达、核验并实际安装；以下剩余点不能继续统一写作“等SDK新包”。

| 工具/路径 | 当前实际落实 | 仍需完成的产品工作/精确返回点 |
|---|---|---|
| 全部27业务名称及新native read | Adapter已给明确固定modelOutput v4/1MiB，实际invocation completed/unknown/交付失败保留；模型后续每候选guard | 尚须更新动态10phase实际枚举和每个成功/拒绝/效果分支。1MiB不能证明context或所有合法返回高效 |
| inspect_selected/来源目录/cell | v1小来源目录+原生read；10000列窄rows/完整cell；8MiB/100000cells、32MiB、2048sheet两候选实测 | read分类全部负向及父/子用途资料范围分开；不把2048sheet末表count1当全表全局计算 |
| calculate_and_verify/execute_step/read_analysis_evidence | 已核验大fact给小回执和当前facts.txt，完整IR/安全核验身份可读；Store/Outcome保留全量与私有native proof | 其它comparison/allocation/reconciliation/asset方法的大唯一结果，以及required/candidate/recipe合法最大集合要分别核对，不能删旧checkpoint字段 |
| set_framework及其六入口 | Workspace实际agentLed:true，本来不返回完整execution_input；旧非agent分支未改 | 宽资料失败的非agent归因已撤回。必要检查合法大binding/value_mappings和proposal计划，保留当前真实refs与完整本地原件 |
| assess/interpret/describe_meaning/bind_measurement | 只去完全重复SOURCE quote/question，唯一信息与用户message原件保持；公共cap失败关闭 | 合法最大definitions×evidence/冲突量超限时如何接已有业务事实原件，需要当前scope的私有读取影响决定和真实返回点测试；不猜SDK引用格式 |
| describe_business/set_analysis_steps | 原scope/完整graph及saved/missing状态不改，超过公共cap停止 | 对唯一长范围/step方法正文，先核对本地保存原件和下游checkpoint消费者；仅hash不能替代可读正文 |
| read_project_metric_asset | 原批准/披露否决分支保留，固定实际专业asset | 批准正文及枚举worst-case需使用正式asset fixture验证，不把no_approved分支当正文通过 |
| explore_with_python/correct_exploration_code | 原一次纠错和inspection/proof重复投影已GREEN，原探索结果/图表留Store | MODEL图表/观察的合法大唯一返回可读性需从现有explorations记录派生；不建立通用JSON仓库，不升级成独立proof |
| read_delegation_materials/delegate_analysis | 原短ref/views、真实12引用/8材料与排队创建效应保持；新公共cap和UNKNOWN拒重放 | 目录大集合不能静默裁掉实际可选材料；须核对real max合法目录和各当前授权对象 |
| read_delegation_results/read_authorized_context/finish_result | 原完整MODEL意见/授权引用/恢复result字段保持，公共cap与UNKNOWN safety已在Runtime | 子任务prompt仍显式含完整authorized_context；当前Application的source/facts native read不自动授权子任务读取父全部资料。需要精确最小已选Context的私有视图设计/因果测试，不能套父目录、删恢复字段或新建第二Session |
| read_tool_contract/ask_user/rewrite_saved_report | 原完整参数意义/必要等待/报告事实后台读回保持；固定cap/finalguard | 大合同被guard否决时不得修坏schema；report_edit自己每候选guard。真实超大正文不得把准备回执当正式报告成功 |

下一步仍有可独立工程：逐上述实际业务返回点闭合合法大集合/当前授权最小资料，不需要新SDK包；现有固定合同不足以表达的接点才列为SDK确认依赖。当前不启动新架构/通用读取/分页/恢复机制。生产policy、Provider、Git和生产采用停止线不变。没有完整固定候选，不派最终Validator。

## v14 当前实际剩余分类（前述统一待包条目均为历史）

SDK API003及精确0.5.1-r1r4.2已实际采用，当前没有“必须等固定新包”才能推进全部产品工作的理由。模型output/material v14是本产品WIP配置身份，不是重打SDK或发布版本。

| 分类 | 当前返回点 | 下一步/依赖 |
|---|---|---|
| 1 当前可独立 | v14正式named native及现代Session保留analysis_tool登记均需当前回归；后者实际回包是业务JSON，按同一真实invocation关联producer，不包造name/result | affected009当前在跑；随后当前canonical/动态20阶段/source身份；旧省略不动 |
| 1 当前可独立 | 已保存大IR/80长映射、24长图/节点recipes、group facts、saved语义、exploration、child Context、MODEL返回意见及材料目录 | 当前正向/旧SHA/目录外及实际Store HOST重构已逐片证明；继续适用历史兼容/读权限和V矩阵，不等SDK |
| 1 当前可独立 | 当前source quotes MD/小资料、物理usage/故障/Store→HTTP→browser和native JSONL/fork/skills | 当前新旧混合canonical、actual codec HTTP400/context/402/429/503/401/network/length已有增量，需逐层标明，而非以SDK253/50代替产品全部验收 |
| 1 当前可独立 | 所有27工具实际动态登记和输出/参数大小归档 | 现20阶段inventory004通过（Application只读层）。最大集合各返回点须核对原件与effect；不是“27都登记所以V15通过” |
| 2 合同/责任需闭合 | 未保存的assess/interpret/describe_meaning/bind_measurement/describe_business；proposalOnly新binding/steps/candidates；finish_result被原history恢复消费的完整result；required_calculations.execution_plan被旧checkpoint恢复读取 | 已保存原件可read的私有projection已实施；这些唯一未保存正文/恢复字段仍原样。精确接点是Tool.modelOutput前的持有原件/当前与重开生命周期、失效/授权/保存效果，以及恢复消费所需字段。现公共SDK project不替宿主建立持久权威；不能补通用输出仓库、新业务持久字段或私造恢复/SDK读取合同。按实际极限样本先保留completed/UNKNOWN/失败关闭和原件证据，必要产品持久影响由Controller形成具体合同决定；不是SDK包尚未到，也不是重复启动许可 |
| 2 SDK载体确认点 | 原生read factory FileError.code可以区分not_found/permission_denied/not_supported/aborted/timeout message/unknown/ExecutionLimitFailure；进入Session的RunResult/audit当前只给TOOL_FAILED/ToolOutcome.reason通用及完成/交付状态，产品UI精确FileError原因尚未证明 | 保留直接factory层实际边界PASS和产品Session的通用UNKNOWN，不从原异常字面猜安全分类。须确认API003是否有可支持的安全read failure载体；无此接口时不新增SDK字段或把通用TOOL_FAILED冒充permission_denied。只有这一具体接口增量若需SDK实现，才待新精确包 |
| 3 固定新包依赖 | 当前固定051已在本工作树装好且51文件再核验，无全局待包项 | 仅当上一SDK carrier确认要求改实现或联验出现共享层缺陷，由SDK回交新精确版本/不可变tgz/合同/完整来源依赖安装验收材料，再独立核验安装后补这一项；不修旧tgz/不原地补丁 |
| 授权停止线 | 生产context准入数值、真实Provider/真实数据/凭据、生产切换/其他产品升级/Git发布、正式Product Acceptance | 仍UNKNOWN/未授权/未完成，各自独立；合成512/8192、961743bytes和当前offline PASS不能自动授权或证明生产token安全 |

### 当前逐返回点状态

- calculate_and_verify/execute_step/read_analysis_evidence：全部原verified fact/IR/proof留Store，MODEL只读安全fact及精确URI；各方法共用projection，集团/会员原M1M2/宽资料/大分组已真实补验，尚不声称每方法所有worst-case组合。
- set_*_framework：只有已确认saved plan做大binding视图；未saved/prepare/旧非agent execution_input及候选恢复字段不删。v12 current/stale/outside、全量80映射派生sum3240和HOST Frame重构通过。
- set_analysis_steps/read_analysis_evidence.current_steps/current_step_recipes/system graph：只保存原件Marker一致才读小图/真实ref及完整IR。v13全部24节点/条件/limits、24计算/proof/Outcome、图旧SHA拒绝和HOST重构24完整recipes通过；append仍返回实际新增集合，不删除已有图。
- read_delegation_materials/results/read_authorized_context：真实Case材料/精确授权Context/实际saved MODEL值映射；所有choices/限制/UNKNOWN完整保留，根及子SDK读取已补验。finish_result的原result恢复字段没有替换成hash。
- read_project_metric_asset/read_tool_contract/ask_user/rewrite_saved_report：原实际许可/完整schema/等待/后台重读事实保留；越限按现合同失败关闭，不以单次cap或byte当token证明、不把技术receipt当成果。

未完成项归于上述精确返回点和当前适用验证；无新任务/分支/工作树、其他项目操作或停止全部工程。

### v15当前检查结束后的准确依赖

当前类型022、canonical008、dynamic005已经完成；不是仍“在跑”。已保存原件投影与各种方法共用结果路径有当前回归，但27注册/20phase及1MiB限制不证明所有max分支都已关闭。新增正式六指标批准正文/1M IR+Store+Outcome，200k合法工具完成后的上下文拒绝仍保留。新增未保存SOURCE解释九维×16证据样本工具completed、后续guard拒绝，原资料和known消耗保持；未绑定独有语义可读性仍OPEN。

read九类已实际复现到public SDK及product持久Session：factory正确原生code并不等于RunResult/audit/UI具有精确失败类别，当前除limit外通用TOOL_FAILED；cancel底层ECANCELED或RuntimeFault.CANCELLED映射aborted，ECANCELLED拼写unknown，不猜字面。该载体接缝有独立可转交最小脚本；只有确需SDK实现增量时才待新包。全局任务不默认暂停；下一安全动作是明确这些当前合同返回点，不启动新存储/恢复结构。
