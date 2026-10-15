## 当前正式归档准备（2026-10-15）

原路径完整WIP已固定在源提交 `cd491fcb9da4bebf91937f2ccdc65a34b855061c`，包含原冻结技术字节和接受记录；本分支现将该Change归档并提升已接受行为到当前规格。归档/链接和正式收据复制是记录层变更，不是新的实现或生产采用。历史快照不改写，旧相对路径按源提交读取；当前最新清单/全图指向本归档。原始完整Validator BLOCKED、F-ROLE-01、历史失败/UNKNOWN保留。PR/CI/merge/sync尚待实际完成，不以本段称已发布。

## 当前正式Git交付授权（2026-10-15）

用户已在本任务明确授权本冻结离线候选正式Git交付及OpenSpec归档，当前按 [publication.md](publication.md) 推进。此授权取代下文“Git/归档未授权”的历史停止点，仅限本任务；真实Provider、生产、其他产品与共享SDK正式发布边界不变。保留F-ROLE-01具名豁免、原Validator BLOCKED/历史失败/UNKNOWN，不改写为无条件PASS。

## 当前用户产品接受（2026-10-15）

用户在本任务直接表示“采纳，接受产品”，本冻结候选的既有离线合成/显式opt-in交付范围 Product Acceptance 已收到；详见 [产品接受](product-acceptance.md)。原F-ROLE-01具名豁免及正式Validator BLOCKED、历史失败和UNKNOWN保留。没有逐项本人复跑或真实Provider/生产/Git/归档通过的推断；下文PENDING/尚未用户验收均按此前时点历史阅读。冻结代码/SDK/依赖/测试不变，原合成业务Task状态与用户产品决定分列记录。

## 当前工程接收回填（2026-10-15）

冻结 R1～R4＋D1～D8 A 的离线合成 opt-in 结果已 Engineering Acceptance，附用户仅针对本候选的 **F-ROLE-01 具名豁免**。独立正式 **BLOCKED F-ROLE-01** 原文保留，技术评估 PASS，不改写为无条件 Validator PASS。canonical002：4610 PASS／1 真实 Provider SKIP／0 FAIL；独立131 PASS。详细候选/安装身份、风险、原报告及返回点见 [工程接收](engineering-acceptance.md)。本次只回填记录，不改冻结代码、SDK、依赖或测试。下文较早“当前/待评审/未接收”均为对应时点历史，不覆盖此结论；历史失败与 UNKNOWN 保留。用户 Product Acceptance、生产准入、Provider、Git 和正式归档均未完成或放行。

# R1～R4 修复任务

- [x] 核实 Mini、远端 main、现有 WIP，创建独立 clean 工作树与分支。
- [x] 保存用户原始请求、共享标准副本及旧包身份，独立重读哈希。
- [x] 静态核对生产接缝，形成 SDK 最小需求草案。
- [x] 取得完整审计报告，逐项映射 finding→R→产品/SDK→spec/test→证据→未关闭项及 V01～V17 适用性。
- [ ] 完成适用原规格/UI合同及接缝核对，取得 SDK 接口回执并记录兼容影响。
- [ ] 按结果大小细化规格/允许路径；采用 TDD 技能完成因果 RED→实现→GREEN 和受影响回归。
- [ ] SDK 待交付期间推进不依赖新行为的已授权产品实现；依赖新 SDK 的断言保持待验证。
- [ ] 固定新包及全部交付材料可读后核对安装树，完成真实生产链离线合成联合验证。
- [ ] 覆盖用户所列规模/Session/codec/故障/IR/store→HTTP→UI/历史边界；执行类型、构建及适用规范验证。
- [ ] 冻结完整候选与证据，按项目规则派独立 `juaner_validator`；不得作者自判独立 PASS。
- [ ] 分别记录工程验证、用户验收、真实 Provider、Git 发布与生产采用状态及未关闭项。

当前返回点见 [verification.md](verification.md)。已授权实施不需要另问启动许可；原缺报告输入缺口已关闭，SDK 尚未交付是后续集成依赖，不作为未来阻断独立产品工程的理由。

当前增量：报告已补齐，已安装旧固定包并形成中立/实际链消费者；SDK未交付仅阻止后续新包联合验证。见spec.md。

## 续行进度

- [x] 接收完整报告与修订输入，核验四项SHA256，映射F01～F10及V01～V17。
- [x] 独立安装固定SDK0.4.3，逐字节核对49文件，记录真实解析与工具链。
- [x] 形成最小合同、中立native消费者、两份2985行实际Application消费者、原始输出和manifest；推荐交接 mini-consumer-002（001保留历史）。
- [x] R3纠错回包切片：规格→两项因果RED→最小实现→两项GREEN；保留单次纠错、范围与本地全量数据。
- [x] 受影响回归250通过/8环境项跳过，typecheck通过；补备本地描述文件后真实Python 9/9通过。
- [x] canonical portable整体检查通过；完整R1～R4完成仍待共同接口、新包联合验证，不混同。
- [ ] SDK实际API回执后接R1小目录/read引用/最终准入，接R2安全诊断/usage与共享恢复，再接R4实际purpose链；完成R3剩余工具输出约束。
- [ ] 固定新包安装树、联合验证、完整候选独立Validator及其他原Gate均待完成。

## 当前阶段追加

- [x] 核验SDK中间001的10校验项/12文件身份和54项aggregate，读取完整接续/合同/收据/README。没有源码快照或新包。
- [x] R1接线设计、当前用途候选/窗口/输出声明及策略缺口核对；六项真实guard消费者准备，行为断言待固定新包。
- [x] R3三个私有输出投影完成因果RED/GREEN；用户精确message引用兼容回归8/8。
- [x] 实际27工具/10phase枚举、完整物理证明及业务结果保存核对。
- [x] 六项实际App/Adapter/旧安装包/IR/Store/HTTP故障及sum/mean差异检查。
- [x] 原19跳过逐项说明；18项本机资源补验通过，真实Provider仍未授权。
- [x] 10000列/32767cell/2048真实sheet夹具通过实际source inspector；read/guard/完整Outcome组合未验。
- [x] 当前完整离线回归结束：4454通过、1真实Provider跳过、0失败；历史失败保留。
- [x] 资料身份/窄文本责任/SDK工具登记及phase过滤接点设计收口；实际codec九组/十八次测量完成。
- [ ] 生产准入policy开销/余量/图片预算核定：实际bytes差不等token开销，当前UNKNOWN，不用合成值启用产品；guard/read接線测试待固定新包。
- [ ] 接收R2/R3/read限额API增量、固定新包后按原精确返回点接线及联合验证。

- [x] 8MiB/100000cells单文件、32MiB批次边界资料生成及实际source inspector正/负检查通过；全窗口/read/Outcome组合仍待。

- [x] 用户授权本轮仅固定R1增量交接003：9组/18次必要合成输入、源码WIP身份、脚本、结果、Prompt及121文件校验，002/历史不覆盖；SDK实际送达仍未核实。未继续生产接线。

## 固定0.5.1-r1r4.2接续（当前，前述待包为历史）

- [x] 固定tgz/归档/API003/83源码WIP/完整195payload及安装51文件核验；旧包/旧失败保留。
- [x] 独立consumer-kit原脚本offline通过；受控独立缓存补齐、不借其他安装树。
- [x] 同一原分支/工作树精确依赖采用，764其他lock身份无漂移。
- [x] R2生产持久callback/安全audit/迟到事实因果RED/GREEN，9新测/61回归及类型通过。
- [x] R1最终phase/schema/cap/signal正式guard、未核定policy拒出站；R2物理ledger载体/partial/UNKNOWN/取消；实际2协议codec及旧Task固定配置补验。
- [x] 原native产品回归174通过；环境缺toolchain失败保留。
- [x] R1来源小目录/长cell派生视图、实际原生read登记/phase/offset/limit初始闭环；完整原值/计算资料保留。
- [ ] Application→Adapter→实际新包→IR/核验→Outcome→HTTP明确新策略联合六场景，及read全部边界/大目录。
- [ ] R2中立诊断完整读回/HTTP/client/UI，保存故障与UNKNOWN工具效果阻止自动重放。
- [ ] R4实际各用途候选链与统一额外额度、实际模型身份；剩余R3显式modelOutput及全量资料引用。
- [ ] 当前完整V01～V17证据矩阵、适用canonical回归、候选固定后独立Validator；生产policy/Provider/Git/生产采用仍未通过。

## 当前固定包产品联验增量（不改写历史待包记录）

- [x] 新旧策略7×2实际IR/核验/Store/HTTP/client/现有renderer联合场景PASS；只读刷新不产生效果。
- [x] R2中立诊断读回、真实物理关联/known0/partial/UNKNOWN、未确认效果UI恢复否决；读失败因果RED/GREEN。
- [x] SDK原生length/context恢复在本产品持久Session六场景通过（摘要逐次计量/guard、再次length、UNKNOWN、撤权、超大摘要）。
- [x] read_analysis_evidence大fact小回执→原生read→完整400行200组Outcome，两实际路径PASS。
- [ ] 宽10000列/32767cell实际Outcome最终GREEN核对；8MiB/100000cells/32MiB/2048sheet余项组合。
- [ ] R3其余业务返回点逐项关闭/明确依赖；实际浏览器显示与当前回归/完整V矩阵。
- [ ] 当前完整候选冻结/独立Validator/工程与用户验收；无生产采用、Provider或Git授权。

- [x] 合法10000列/32767cell原生窄目录、全量IR/独立核验/持久Outcome，及16项原native中断停止共17 PASS。
- [x] 精确8MiB/100000cells、32MiB四源、2048sheet目录至末表/明确末表Outcome，在200k/1M分别组合六项PASS。
- [x] 实际Chrome两诊断场景/1440及1366客户端paint与只读刷新；中文物理状态原因果RED/GREEN。
- [x] affected-regression-005 365 PASS、typecheck-native-007 PASS（浏览器/UI新改之后完整复验仍待）。

- [x] 已保存大SOURCE语义212548bytes→小receipt/原生read→4×16原句/位置完整Framework/Context→16行sum136/独立核验/Outcome；red-002→green-001。未保存语义未套用。
- [x] 当前实际27业务名称、legacy及新read能力10×2阶段动态输出/参数枚举（Application只读级别）。
- [ ] 新已保存语义视图负向/当前类型与回归；未保存大语义/大探索/子任务Context唯一内容的精确返回点。

- [x] R3真实Python2图×200长标签→小MODEL回执/原生read→全部原探索本地保留；另IR独立sum80200/Outcome。current/stale/outside三项通过及实际SQLite记录的HOST/App重构/外Task否决。
- [ ] 父/子委派最小Context、大MODEL结果/材料目录及未保存大语义/recipes准确接点；当前最终回归尚待。

- [x] 实际PiCodec429/503/401/network无未计量HTTP重试，四个物理计量/安全载体组合PASS。
- [x] 新策略retained/版本化report JSON拒length原因果RED→GREEN，原Agent六恢复同时PASS。旧scope/用途mode不改。
- [x] 当前6文件受影响回归426 PASS/0 skip，typecheck-native-010 PASS；最终canonical和完整候选仍待。

- [x] 大子任务Context原因果RED→小授权view/native read；实际SDK current/foreign/parent-source/revoked四项通过，完整父组结果保留。
- [x] Source模型视图private proof正文投影单元RED/GREEN；旧Source保留。实际M1/M2消费者仍待。
- [ ] 当前协作/proof/child变化适用类型与回归，剩余大MODEL/材料目录/recipes/read分类、canonical与V矩阵。

- [x] 实际M1/M2完整proof→安全Source→固定SDK子任务组合通过，原完整Outcome留本地。
- [x] 真实保存三份MODEL意见→小反馈/native read/完成复核两回灌点因果RED/GREEN；Case原件不变。
- [ ] 当前协作范围负向/类型/受影响回归、剩余大目录与方案/read类别；完整候选仍待。

- [x] 新三份MODEL意见当前/旧SHA/他结果/撤权及实际24目录五项、真实嵌套child读回一项通过；原件不变。
- [x] 新v1撤权SDK RuntimeFault在Adapter内转换为中立业务code；保留carrier/原消费，旧省略不改。
- [ ] 当前v11类型、全部动态阶段、canonical与V矩阵；未保存唯一正文/recipes/finish_result恢复边界继续核对。

- [x] 精确SDK采用CI/local installation oracle对齐，原历史/负向保留；canonical007 4541 PASS/1真实Provider SKIP，只绑定当时v11源。
- [x] current WIP61文件可读snapshot008；当前安装51文件/764非SDK依赖再核验。
- [x] v12已保存大IR/value映射 current/stale/outside三项及HOST重构；sum3240完整Outcome。
- [x] 真实HTTP400 context/known0→native摘要恢复计量四调用，工具不重放。
- [x] v13实际24大图/recipes→原生read→全部24IR独立核验/保存；原所有长条件保留。
- [ ] v13图/recipe恢复负向、当前回归/完整canonical及V矩阵/未保存唯一正文精确合同点；完整候选独立验证仍待。

## 当前v15收口（历史勾选只代表当时范围）

- [x] schema所有权隔离、64facts累计投影因果RED/GREEN；原全量IR/Store保持。
- [x] 新MD实际读取/引用级核验/Store/HTTP/client，以及未保存大解释的真实准入停止点覆盖。
- [x] 当前canonical0084552PASS/1ProviderSKIP/0FAIL、补充native022类型、dynamic005实际27工具/20阶段枚举；实施/测试文件hash无漂移。
- [x] 正式六指标批准正文+1M候选实际IR/核验/Store/六指标Outcome；200k完成计算后的guard拒绝原失败保留。
- [x] read九类实际factory/公共Session/产品持久Session复现，明确详细FileError未进入安全RunResult/audit/UI的返回点。
- [x] 逐V01～V17范围/UNKNOWN/不适用/未验证矩阵；原19跳过逐项原因仍保留。
- [ ] SDK确认支持的精确read安全失败载体；若需实现修复，回交新不可变版本及完整身份，逐接缝核验安装。
- [ ] 未保存唯一语义/业务正文、proposalOnly与旧checkpoint/finish_result原件，先关闭所有权/重开/失效/兼容合同；不伪造saved或新增通用warehouse/恢复机制。
- [ ] 上述未闭合点实际补验后冻结完整候选，再派独立Validator；工程验收/用户验收/生产策略各自独立未完成。

## API004/.3窄接续（2026-10-15）

- [x] 原工作树/WIP66身份无漂移，.3/归档/API004/273校验/84来源snapshot/SDK151非rootlock核验。
- [x] 专属k53安装消费者RUN-OFFLINE完整通过；同任务产品精确vendor/lock/51安装文件采用，764非SDKlock不变；最初六项元数据漂移原件保留。
- [x] 产品九组持久audit拒新字段因果RED→最小允许/中立诊断/UI映射GREEN；完整App→Session→Store→HTTP/client/renderer及刷新零调用。
- [x] 原Mini public/product九组脚本原样重跑、迟到/取消优先级/伪造匹配/auditfault九项、旧/未来enum三项、实际Chrome缺失场景；现有client声明补齐。
- [x] 当前.3适用全量范围及三Chrome读回；候选002修正后421受影响回归/类型/21关键检查，固定70文件独立窄评审PASS；未改原R3剩余正文/恢复合同。
- [ ] 正式全R1～R4候选/独立Validator及ProductAcceptance仍按原剩余项，Provider/生产/Git不在本次。

当前canonical00117组exit0：4573PASS/1真实ProviderSKIP/0FAIL（4574总计），desktop1580约261秒，包括三实际Chrome类别/刷新与21新增断言；代码/测试/依赖drift=[]。type002与CIpin17项通过。当前窄read/API004候选可独立评审，完整R1～R4/未保存原件生命周期/用户产品验收仍未完成。


## API004/.3 当前窄结果闭合（2026-10-15，候选002）

固定新包真实安装51文件与764其他lock身份核验；read九组App→持久Session→Store→HTTP/client/UI、迟到/负向/旧历史/三Chrome及刷新零调用通过。独立Validator候选001先FAIL（嵌套停止reason未透传after_stop），保留原件；新规格/两项因果RED→只修正式reason映射→21GREEN，当前421受影响回归/类型通过。候选00270文件aggregate265b21ad1e8a99511f73147039cc8257d8d718caeb63c55cffea1cd34be91bf2，独立复评PASS仅read/API004。

原canonical4573/1SKIP属于候选001，仅复用未变范围；不把它说成候选002全量。实际报告/完整命令/退出码/身份及每层映射在 /Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/sdk-0.5.1-r1r4.3-001/ADOPTION-AND-VALIDATION-004.md 和 independent-validator-001/run-002/。首次FAIL及所有历史/UNKNOWN不改写。

工程接受本窄read增量，不接受完整R1～R4或用户Product Acceptance，不归档未完成Change。完整任务仍有唯一未保存正文/旧恢复合同和生产参数UNKNOWN；精确返回点见matrix006及原r3-unsaved-lifecycle-impact001。已解决read载体不再列为待SDK；不统一暂停原授权，不自动Provider/生产/Git/迁移/重放。


## R3 preparation contract review001（当前）

- [x] 原WIP72身份与同分支/HEAD读回无漂移；实际七类对象/生产者/保存及旧恢复消费者核对。
- [x] D1～D8具体待审合同、字段粒度/身份/原件/生命周期/重开/失效/兼容/回滚与HTML审查材料；旧字段保留。
- [x] 现合同R3-CANDIDATE-SAVED-01及R3-CANDIDATE-MEANING-READ-01逐个因果RED→最小两判断修正→GREEN；484受影响PASS/类型exit0。
- [x] 2026-10-15用户整体批准D1～D8 A；此前未批准状态保留于review001。
- [x] 批准后spec/严格载体/真实保存及固定SDK消费/重开/负向/兼容已闭合，完整候选独立评审已返回；正式 BLOCKED F-ROLE-01 保留，经本候选具名豁免工程接收，非旧 read narrow PASS 外推。


## D1～D8 A 实施（当前已批准）

- [x] 用户整体批准A及同任务77WIP身份核验；保存16MiB/合计64MiB1000项/候选64工程参数闭合，非token策略。
- [x] Store1.4 opt-in保存/重开/幂等、producer/late lease与Preview历史因果修正；旧1.0～1.3无回填。
- [x] App大business、框架前Source解释、两批steps、长value_maps及candidate evidence逐项RED/GREEN；保留原完整IR恢复与child结果。
- [x] 新产品固定策略身份与实际.3 native business→read→waiting→Store/HTTP/client/UI3物理3工具，1M合成样本PASS；200k原guard拒绝保留。
- [x] 上界/严格载体/失效/owner、真实Store保存边界/确认丢失/模型UNKNOWN/取消迟到；父waiting正文继承、两批候选actual native Preview ready且未采纳；唯一大语义完整native续读。参数与测试范围见matrix007，未授权历史恢复不执行。
- [x] 当前类型/受影响与完整canonical002（4610PASS/1ProviderSKIP）、旧配置/历史兼容、矩阵007；精确SDK51安装/package/lock不变。
- [x] 完整WIP/证据固定后 fresh 独立 Validator 已完成，技术 PASS／正式 BLOCKED F-ROLE-01；用户具名豁免后本冻结离线候选工程接收。
- [x] 按本次授权回填 OpenSpec、项目板与六＋二/40ID 能力地图；记录层单独核验，不改技术候选。
- [x] 本冻结候选既有离线范围用户 Product Acceptance，原话“采纳，接受产品”，见 product-acceptance.md；不代填逐项操作结论。
- [ ] 适用正式归档及 Git 交付；保持原停止线，不由产品接受自动启动。

## 用户产品验收材料001（2026-10-15，未开始执行）

已按用户本轮要求整理 [本冻结候选用户产品验收清单与具体操作](user-product-acceptance-001.md)：16项 R1～R4 离线审阅条目、5项真实Provider返回点、静态证据/未来交互/真实模型三种方式及停止规则。采用原候选/证据，无代码、SDK、依赖、规格或测试变更；没有执行测试/Provider/服务/生产/Git写操作。用户记录表全部待填，Product Acceptance仍PENDING；F-ROLE-01本候选具名豁免、原正式BLOCKED、历史失败和UNKNOWN保留。

NEXT_ACTION：用户可按清单方式A只读审阅旧结果/截图并反馈具名条目。需应用交互复跑则停在任务自有服务/脚本启动前；需真实Provider则停在凭据读取/真实gate/首次请求前，按清单RP-01～05明确对象/数据/预算/命令授权。整理材料不构成启动权限或用户接受，不重启已完成离线修复。

## 本机离线交互验收环境001（用户已授权启动）

2026-10-15沿用冻结候选，真实产品工作台/固定SDK与本任务新合成SQLite空间，六项交互场景已启动。参见 [当前地址/步骤/范围/停止](offline-interactive-acceptance-001.md)。外部harness/导航存于现有证据根，不改冻结代码/SDK/测试；原独立正式BLOCKED、F-ROLE-01及历史失败/UNKNOWN保留。六项可用性及独立副本实际按钮冒烟不等同用户接受；用户adopt会话保留未采纳初态。

NEXT_ACTION：等待用户本人在本机地址操作并反馈具名结论；产品验收PENDING。仅本任务服务已授权，真实Provider/生产/Git及其他项目/历史恢复停止线不变。不重复请求启动权限、不自动重放UNKNOWN。

## 用户产品接受001收口

当前明确用户决定已按 [product-acceptance.md](product-acceptance.md) 回填；仅记录层，原独立BLOCKED/F-ROLE-01/历史失败/UNKNOWN保留，不改冻结技术候选。能力覆盖累计目标状态不提升，增加本候选离线接受子范围和固定快照。

NEXT_ACTION：授权范围内工程/产品接受记录已闭合；真实Provider、生产参数/激活、Git和正式归档沿原停止点，不自行执行。原本任务离线服务保持运行；不自动重试、恢复、重放或迁移历史Task。

## 正式归档执行（2026-10-15直接授权）

- [x] 已接受技术WIP固定源提交；原活动路径源提交可读，Change迁入本归档、当前canonical规格整合、全图与最新引用更新。
- [x] 118文件完整归档候选独立一致性评估PASS；正式BLOCKED F-ROLE-01原样保留；原技术候选29/51/10身份未变，原本候选具名豁免仅维持原范围。
- [ ] 正式Git推送、PR最终head托管CI、squash及每端main同步：执行后以原生PR/Actions/merge和publication-final.json/md逐项回执，不预填成功。

本节取代历史NEXT_ACTION的Git未授权时点，仅本任务离线/显式opt-in候选获得本轮正式Git及归档权限；Provider、生产、其他产品与共享SDK正式发布停止线不变。
