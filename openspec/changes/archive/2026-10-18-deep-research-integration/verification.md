# deep-research 当前交回011：已授权Git正式交付，执行中

当前交付入口为[Git交付011](git-delivery-011.md)。用户已允许005合成范围的Git／CI／PR／合并／适用归档与安全同步；下方010及更早未授权语句保留历史。WIP UNKNOWN、禁止提权／旧指针／Host Loop／安装／真实Provider继续有效。

---

# deep-research 当前交回010：候选005交付清单与Git发布前剩余项

2026-10-18，Mac mini。本轮仅整理与只读核对，沿用009的合成范围产品接受和已停服务状态；不生成新技术候选，不提交、发布、安装、归档、启动服务或调用真实Provider。WIP UNKNOWN继续保留，具名例外仅限本任务；不再提权、不读改旧指针、不启动Host Loop。

## 交付身份与内容

- 工作分支 `work/mac-mini/deep-research-integration`；HEAD `35177f9a9741cd7385b78bbf8143819a7df2ba33`，HEAD tree `3b3c07f1b69f6d46f32a7789de5c05033e6cb537`。HEAD/tree是基线，不是包含未提交实现的发布身份。当前索引无已暂存差异，实现及记录仍在工作区。
- 固定插件源 `3a3f8c3a910460423a8b7a2638655a100a2aa8e6`；candidate005清单SHA `3ee960a21cfd47474d9f2ee3b95c270ddb563a89431b98dbd8af2d406a1e5ea6`。本轮重新逐文件核验130个冻结原件全部匹配；清单内当前文件只有verification.md、status.json记录差异；清单外还有后续看板事件、能力登记／地图与快照。实现、测试和规格保持005身份。
- bundle009 manifest SHA `fabb1adaad46b96d48ad88782ad5ca7388fc4b1f2f178ba17c19b274cf10e1f9`，17411文件／317906174字节（已有完整包独立核验，本轮未重算整个资源树）。冻结源码、资源包与原始证据位于下述E，不随本次整理重新构建。

| 交付部分 | 主要材料与已实现范围 |
|---|---|
| 产品输入 | 本目录ui-contract.md R01–R10、clickable/、readiness-review.md、engineering-intake.md；DR-002 UI PASS，完整原工作台，原计划／框架确认保留，首期关闭记忆与追问 |
| 工程合同 | spec.md、design.md；宿主任务私有研究空间、权限与外部效果边界、运行／取消／UNKNOWN、原发布版本与稳定成果副本 |
| 宿主接线 | packages/ports/deep-research.ts、packages/application/deep-research.ts、profiles/personal/deep-research.ts、adapters/deep-research/；apps/browser研究入口及必要service／membership接缝 |
| 固定随包资源 | tools/deep-research/源码与MCP身份、build/stage配方；Forge／Vite／runtime-resources接线；固定原UI／业务源码，原SDK0.4.3；本机macOS arm64/Python3.14资源闭包 |
| 永久验证 | tests/integration/deep-research/、tests/fixtures/deep-research/；宿主相关回归、资源构建与canonical入口适配；保留原断言和历史失败 |
| 接受与交回 | 本verification.md、项目看板、能力登记及完整地图快照；candidate005冻结副本、独立报告、浏览器证据、合成验收数据与停止证明在E |

E=`/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/engineering-003-20261018`。重点定位：`candidate-005/identity.json`及`source/`、`cli-validator-005/review/response.md`及`completed-readback.json`、`focused-014.log`、`portable-011.log`及summary、`browser-006/`、`product-acceptance-005-001/`及`stop-001/verified-stop.json`。源码／永久测试／合同进入后续Git交付清单；运行数据、密钥、node_modules、机器工具链与大型本机原始证据不混入源码提交。E仅本机持久保存，尚非远端备份或可供另一设备直接读取的交付物。

## 已通过的验收

| 层次 | 当前结论 | 证据范围 |
|---|---|---|
| 产品输入／UI | readiness PASS；用户DR-002 UI PASS | 批准完整工作台及确认交互，非真实Provider许可 |
| 专项与宿主回归 | focused014：24 PASS／0 FAIL／0 SKIP；portable011：4938 PASS／0 FAIL／24 SKIP，19阶段exit0 | 本机离线证据；两个命令范围分别列示，不能互相替代 |
| 类型／构建 | host-typecheck011 exit0，resource-build005：1 PASS；固定资源build009／stage009成功 | 固定资源与installed-entry构建，不等于完整.app安装或发行 |
| 独立复核 | 同一Astra/high、read-only、never的具名CLI例外PASS | 实际加载已回读；004四项发现关闭，003撤权修正持续通过；部分真实进程／磁盘测试为检查作者证据，并非独立重跑 |
| 工程接受 | 固定005工程接线与离线范围PASS | 不扩大为真实研究质量或完整Change正式交付 |
| 产品接受 | 用户明确候选005合成范围PASS | 原计划／框架确认保留；不补造用户逐项操作回执 |
| 停止与保留 | 正常exit0，宿主65549／子进程67630退出，65267／65481关闭 | 18个持久文件内容不变；仅两个SQLite运行时锁journal正常回收；验收数据与证据保留 |

## 未验证／明确延后

- 真实Provider、真实搜索／采集／材料、语义与来源质量、真实成本／效果均未验证；生产外部效果默认拒绝。真实能力启用必须另有明确任务范围与授权。
- 完整新.app／DMG、干净机安装、跨架构分发、总体再分发许可审查尚未完成；固定资源树成功不替代这些证明。这些属于后续安装／发行范围，不能据此宣称可安装发布。
- 严格MCP物理子进程收尾未量测；独立Validator未重跑真实监听器、进程和文件系统故障测试。保留边界，不能把内存检查扩大为物理崩溃耐久性。
- 原插件421 PASS／12项缺历史夹具失败、宿主24项环境门SKIP、原生Validator历史失败／安全中断均保留。005有限独立PASS不追溯抹去历史，也不把失败改成通过。
- Git提交／PR／最终提交对应托管CI／合并／安全main同步／适用OpenSpec归档均未完成。当前远端main、分支保护与必需检查未在本轮联网刷新，保持未核验；不从本地基线推断远端状态。
- 记忆／追问是批准的首期不启用项；C2-02登记为局部实现。完整Deep Research目标、N12/S4及其他能力未因此完成。[完整能力地图](../../../../docs/planning/capability-coverage/latest.md)与[005合成接受快照](../../../../docs/planning/capability-coverage/snapshots/deep-research-005-synthetic-accepted-2026-10-18.md)继续有效。

## Git发布前剩余项与下一步

1. **发布授权尚无，当前停在准备态。** 用户产品验收不自动授权Git。以后明确授权本任务Git交付时，继续保留WIP UNKNOWN及旧指针／Host Loop禁令；无需为了发布将UNKNOWN改成已知或再次提权。
2. **锁定完整提交范围。** 对005冻结身份与拟提交diff逐项核对，把后续接受记录、能力登记／快照一并纳入；核对未跟踪源码／测试没有遗漏、合成运行目录和敏感资料没有混入。保留历史候选，最终提交SHA/tree与005对应关系需明确；不以当前基线HEAD冒充候选提交。
3. **核对当前集成基线。** 在授权后的发布流程读取实际origin/main与分支保护。若基线前进或需冲突修正，按正常非强制方式集成，重验受影响行为并复核失效证据；不把旧005 PASS自动套给变更后的候选。行为不变时复用仍有效的工程／合成产品接受，不重复造Gate。
4. **完成最终提交的CI与专项证据绑定。** 本地`.github/workflows/ci.yml`为PR触发的Ubuntu Canonical validation，执行portable全量；不会配置DR_PROGRAM_ROOT／DR_BUNDLE_ROOT等外置物料专项。后续必须同时呈现最终代码适用的24项本机专项与required CI，不能把专项缺物料SKIP当通过，也不把托管绿灯当安装／Provider证明。现有配置只是本地读取，实际required checks要在发布时核实。
5. **集中完成交付与适用归档。** 在届时明确授权范围内执行显式暂存、提交、工作分支push、PR、必要检查与独立证据核对、squash合并、安全main同步和回读；同时按实际许可安排OpenSpec归档与最终地图记录。对活动工作区不切换、不重置；对端不可达或同步未授权时如实报告部分完成。任何安装／真实Provider仍另行授权。

当前结论：005的已批准合成接线范围没有已知未关闭工程阻断；**尚不满足“已经Git正式交付”的状态**。上述正式交付手续与未验证的安装／真实质量范围须分别报告，不将后者无条件扩大成本次代码发布的新产品范围。本轮整理结束后服务保持停止，下一允许动作等待用户明确任务；本轮不启动发布链。

---

# deep-research 当前交回009：005合成范围产品接受，验收服务已停止

2026-10-18，Mac mini。用户明确：“候选005合成范围产品验收通过。停止本次验收服务并核实进程退出，保留验收数据和证据。继续保留WIP UNKNOWN，暂不安装、Git发布或调用真实Provider。” **固定005合成范围Product Acceptance PASS已记录；正常关闭本次验收服务完成，全部自有进程和监听端口已核实退出。** 下方008入口不再可用；不自动重启。工程005独立PASS及限定离线Engineering Acceptance保持。未把用户本次声明补造成逐项操作回执；真实Provider／来源质量及完整安装／发行仍未验。

## 停止与保留证明

证据仍为 `E=/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/engineering-003-20261018`。用户原话、停止前后清单及回读在 `E/product-acceptance-005-001/stop-001/`。

- 停止前核实PID65549精确指向本次trial.mjs，唯一研究child67630指向本次resources/deep-research/child.mjs；父子关系、命令和监听器保存在before.json。仅向已核实的父服务发送SIGTERM，走service.close正常关闭，不强杀、不提权。
- stop.json记录closed=true，exit.json为exit0；交互session65065已结束。PID65549、67630均不存在，原65267／65481端口连接拒绝，见verified-stop.json。没有新增Host Loop或常驻启动项。
- 停止前20个工作区文件，停止后18个持久文件逐字节SHA-256全部一致，无新增或变更。仅两份各512字节的SQLite运行时锁journal在正常关闭中回收：browser-companion.lock.sqlite-journal、service-lock.sqlite-journal；前态bytes/SHA保留，未进行手工清理或删除验收项目。所有现存工作区、资源、脚本、截图、DOM、日志和既有冻结候选／失败证据继续保留原位置。
- 固定005的实现、测试和规格不变；本轮只更新接受／停止记录、能力登记与看板，不构成新的技术候选。资料仍为本机持久保存，未进行跨设备备份或Git集成。

## 接受范围与下一步

接受对象为candidate005清单SHA `3ee960a21cfd47474d9f2ee3b95c270ddb563a89431b98dbd8af2d406a1e5ea6`、bundle009 manifest `fabb1adaad46b96d48ad88782ad5ca7388fc4b1f2f178ba17c19b274cf10e1f9`、本机浏览器／同机服务、原完整工作台与明确合成外部能力的接入子范围。原计划／框架确认保留，记忆／追问首期禁用。此前421 PASS／12缺夹具失败、24环境门SKIP、严格MCP物理收尾未量测、旧原生角色失败／中断和所有UNKNOWN不改写。

C2-02由“待核验”更新为“局部实现”：新增固定完整工作台合成范围接受，**完整Deep Research目标／S4未完成**。相关C1-01、C3-01、A-05、B-01/02/03增加接缝证据，状态不扩张；40稳定ID不变，没有新增“完整能力已完成”。[累计完整地图](../../../../docs/planning/capability-coverage/latest.md)及[本次快照](../../../../docs/planning/capability-coverage/snapshots/deep-research-005-synthetic-accepted-2026-10-18.md)。

**NEXT_ACTION：本轮本机合成验收已收口，服务保持停止，等待用户后续明确任务。** WIP UNKNOWN继续保留；不安装、不Git发布／合并／同步／归档、不调用真实Provider，不触碰旧指针或Host Loop。正式Git保存／集成和适用归档尚未完成，不宣称完整Change已经正式交付。

---

# deep-research 当前交回008：候选005本机合成产品验收入口

2026-10-18，Mac mini。用户已授权准备候选005本机可点击完整工作台，仅合成数据，暂不安装或Git发布。**入口已打开并有意保持服务运行；当前停在原“研究计划待确认”，计划／框架均未由主Agent代确认。用户Product Acceptance仍PENDING。** 工程005独立PASS与限定离线工程接受见下方007，不因启动试用增加接受范围。

- 入口 `http://127.0.0.1:65267/`，Codex已认证标签页5；宿主项目“候选005 · 合成验收”，主任务“合成验收：行业研究”，另备“隔离检查：另一任务”。新浏览器若无认证需本对话生成新一次性入口；历史token不作为持久链接。
- HEAD、分支和候选005冻结身份不变；130文件核验仅允许结果／看板记录差异。实际运行bundle009副本17411文件／317906174bytes，manifest `fabb1adaad46b96d48ad88782ad5ca7388fc4b1f2f178ba17c19b274cf10e1f9`。真实service、项目与任务链保留；本次验收夹具显式注入合成模型／搜索／网页／解析适配器，不修改已验证产品源。
- 本次原件与说明 `E/product-acceptance-005-001/ENTRY.md`，其中E仍为下方工程持久证据根。runtime.json、candidate-readback.json、entry-readback.json、ready.png/DOM包含身份与起始状态。网络guard同时加载到宿主及研究子进程，外部连接的精确拒绝异常已验证；私有HOME/TMP与始终拒绝的credential helper，不读取真实密钥。界面模型／token数为合成用量，不是真实消费。
- 服务PID65549、研究child67630、交互session65065，均为本次拥有且有意保留供用户试用；不是旧全局服务。停止／新入口办法见ENTRY.md，未经核实不强杀、不删除验收数据。旧007“进程已退出”仅指此前验证批次。
- 简短路径：编辑确认计划→编辑确认框架→查看合成有限交付并发布为版本→顶部查询版本／保存→下载副本→返回核草稿→重开及切另任务验隔离。情报库／设置原界面保留；首期记忆／追问禁用。

**NEXT_ACTION：用户在已打开入口验收并反馈；不代签产品通过，不自动安装、Git发布或调用真实Provider。** WIP UNKNOWN保持，未提权、未改旧指针、未启动Host Loop。

---

# deep-research §7 当前交回007：固定005独立复验PASS

2026-10-18，Mac mini。**候选005在用户具名授权的同一Astra/high只读CLI例外下独立复验PASS；004四项发现全部关闭，F-DR-003-01持续通过，无新实质阻断。主Agent据当前规格、适用实跑证据与独立结论，记录本次固定005“工程接线与离线验证范围”的Engineering Acceptance PASS。** 此接受不覆盖真实研究质量、完整安装／干净机发行或用户Product Acceptance；完整Change的产品接受、Git集成及适用归档尚未完成，不宣称正式Change完成。下方006及更早状态保持历史，不是当前停止点。

## 固定身份、实际加载与独立结果

- 设备／目录：Mac mini，`/Users/bendandebaba/.codex/worktrees/7a90/JuanerAI`，`work/mac-mini/deep-research-integration`，HEAD `35177f9a9741cd7385b78bbf8143819a7df2ba33`。实现尚未Git提交／集成，不是已保存到主线的项目资产。
- 证据根沿用 `E=/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/engineering-003-20261018`；本机持久保存，不等于跨设备备份。005身份清单SHA-256 `3ee960a21cfd47474d9f2ee3b95c270ddb563a89431b98dbd8af2d406a1e5ea6`，130个冻结文件完整回读一致。bundle009及浏览器实用副本各17411文件／317906174字节，manifest `fabb1adaad46b96d48ad88782ad5ca7388fc4b1f2f178ba17c19b274cf10e1f9`。原200源、原UI／业务字节与固定插件commit不变；004原件未改。
- 用户本轮明确授权005；原文在 `E/cli-validator-005/user-authorization.md`。沿同一CLI会话 `01a14dac-fcb6-74a1-8c45-06920d4a0355`，两次预检与实际复验的启动头／三个turn_context均确认 `gpt-6-astra/high/read-only/never`，见 `review/completed-readback.json`，不是模型自报。
- 首次预检因模型元数据不向Validator暴露、旧004范围残留返回BLOCKED；主Agent提供实际加载读回和用户新授权，第二次确认005范围READY。普通内存测试命令的一次JavaScript default标识符语法错误在原只读范围修正；没有新服务端安全拦截、提权、全局／项目角色配置变更或权限扩大。MCP图工具NOT_AVAILABLE，未重试；旧原生角色失败／中断不追溯清除。
- 完整原报告：`E/cli-validator-005/review/response.md`，6503字节，SHA-256 `6ce49a1aa82bcdd006cb5dd83d486f8d65af85e7f4efae8dae8354d912082bcf`。CLI exit0仅为完成；PASS来自报告明确判定。PID37124已退出，完整命令／输入／输出／退出及逐字回读同目录保存。复核期间产品、测试和规格均不变，仅主Agent更新一个状态文件及新增一个状态事件；本007及最终看板为复核后的记录更新。

| 原发现 | 独立复验结论 |
|---|---|
| F-DR-004-01 旧view迟到写入 | 正文、HTTP授权、附件授权、配置读取、发布锁和handler交接等待的旧view均拒绝；当前view／owner正常；异步宿主任务和控制权撤回拒绝。Resolved |
| F-DR-004-02 启动失败毒化关闭 | 实际坏manifest在mkdir/spawn前拒绝后可读idle并重复关闭；内存生命周期仍拒绝已spawn失败、UNKNOWN及非正常退出。正常服务坏包后的切项目／关闭证据核对通过。Resolved |
| F-DR-004-03 保存状态串任务 | 实际client的另一任务、另一项目同taskId、回复前返回原任务及丢回复重试通过；不会误标其他任务，也不重复save。Resolved |
| F-DR-004-04 正常入口缺证 | 实际descriptor→service→项目／任务路径、保存／回程草稿／重开／重复保存／下载的代码、日志、截图和字节一致性核验通过。仅合成预置研究，生产Provider仍拒绝。Resolved within scope |
| F-DR-003-01 宿主保存撤权 | 实际HTTP/Application内存复查正文及导出等待撤权、reservation保留、当前控制权重试、读回与冲突／幂等通过。Remains resolved |

独立新执行Node26内存路径及 `tsc --noEmit --incremental false` exit0。独立核验作者focused014的24 PASS／0 FAIL／0 SKIP、portable011的4938 PASS／0 FAIL／24既有SKIP和19阶段exit0、resource-build005的1 PASS；没有声称Validator自行重跑全量。测试负例与历史RED、重复关闭失败均保留，没有削弱断言。原R01–R10／C01–C12使用新修复路径和核实未变的004覆盖评估。

## 接受边界与下一步

实际监听器、子进程和文件系统故障测试未在只读Validator内重跑，独立审查其已有实跑证据；内存检查不证明物理崩溃持久性或MCP进程收尾。原插件421 PASS／12缺历史夹具失败、24环境门SKIP、严格MCP物理收尾未量测继续保留。真实Provider／数据／语义质量、完整.app安装／干净机发行、hosted CI、用户产品接受及其他设备操作仍NOT_RUN；不通过本轮工程接受豁免这些后续义务。

**NEXT_ACTION：向用户交回固定005离线候选及独立报告，进入所需用户产品验收决策；不自动开始真实研究、安装、Git发布或归档。** DR-002原计划／框架确认保留，首期不启用记忆／追问。WIP UNKNOWN保留；没有提权、旧指针修改或Host Loop操作。所有本任务验证进程已退出；后续试用需重新启动明确的合成试验入口，历史URL不作为仍在运行的入口。

当前能力增量是C2-02（N12/S4研究子范围）及C1-01、C3-01、A-05、B-01/02/03相关接缝的离线工程证据；40稳定ID／阶段的正式接受状态增量为0，不将单个插件离线候选升级为完整能力或S4。正式交付时更新登记与快照；本次复验结果链接既有[累计完整地图](../../../../docs/planning/capability-coverage/latest.md)，不提前标记已交付。

---

# deep-research §7 当前交回006：候选004独立FAIL与修复候选005

2026-10-18，Mac mini。**候选004的同一 Astra/high 只读 CLI 复核已经完成：FAIL，三处可复现缺陷及一项正常入口证据缺口。主Agent完成修复和离线验证，固定候选005；尚未对005作独立复验，不宣称工程或产品接受。** 下方003–005为保留的历史状态，其停止语句已被后续用户接续授权替代。WIP UNKNOWN、禁止提权／旧指针修改／Host Loop／真实Provider均保持。

证据根沿用 `E=/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/engineering-003-20261018`。设备、分支、HEAD、固定插件源／标准／Runtime基线、DR-002全部决定与下方003相同；无Git发布、安装、其他设备操作。原200源文件不变。

## 独立复核004的实际范围

完整原报告 `E/cli-validator-004/continuation-004/response.md`。同一会话 `01a14dac-fcb6-74a1-8c45-06920d4a0355` 五次实际turn_context均为 `gpt-6-astra/high/read-only/never`，见该目录 `runtime-readback.json`；不是配置文件或模型自报。最终进程exit0只代表报告交回，结论仍FAIL。原生角色权限缺口／安全中断、CLI历史heredoc失败与Git/xcrun兼容问题均不追溯改写；MCP图工具要求批准但approval=never，明确NOT_AVAILABLE且未重试。后续使用已列清单文件的纯读与内存检查，没有新服务端安全拦截、写入权限或角色扩权。

Validator核验004的121个冻结文件、bundle008全部17411文件和原200源；独立验证F-DR-003-01保存撤权修复、权限默认拒绝、幂等及ZIP负例。完整004仍有以下阻断：

| 编号 | 独立发现 | 主Agent修复及现有证据 |
|---|---|---|
| F-DR-004-01 | 旧view在正文／授权等待后仍能写入 | server各await边界重核view，Profile异步授权重核任务／许可；永久HTTP分段正文、授权等待、projects/settings正反例 |
| F-DR-004-02 | 坏包在spawn前失败后，state/close一直重抛，阻断宿主切换项目与关闭 | 区分可证明未spawn失败与进程已存在的不确定状态；真实坏descriptor入口503后仍可切换项目／关闭；正常关闭重复检查不再查询退出子进程 |
| F-DR-004-03 | 任务A迟到保存成功误标任务B入口 | 更新入口前核当前project/task，A面板保留正确结果；实际client延迟回复＋换任务＋返回A的永久反例 |
| F-DR-004-04 | 旧browser夹具直接装配Profile，缺正常配置服务链 | 真实descriptor→startIndependentBrowserService→实际项目／任务→研究保存／重开／故障恢复；生产服务默认Provider拒绝 |

`review-red-005.log`保留前两项真实失败；`client-red-005.log`保留跨任务误标。`review-green-005.log`3 PASS。`configured-service-002.log`在主流程通过后重复关闭时报DR_SERVICE_UNAVAILABLE，已修正；003为2 PASS。001错误引用证据根中的不存在网络guard是命令错误，保留原日志。没有移除或降低旧断言。

## 修复后的正常入口与物料

- bundle009 / staged-resources009：manifest SHA-256 `fabb1adaad46b96d48ad88782ad5ca7388fc4b1f2f178ba17c19b274cf10e1f9`，17411文件；descriptor SHA-256 `543f007f8d7daf98e4b8d2f395cb02e61cef6a973bfa9853ac986ec2efaa8384`。build-009、stage-009均成功，旧包不覆盖。
- `browser-006/`实际通过正常配置服务选择任务→完整原UI→查询版本→保存→返回原任务保留草稿→显式重开→重复保存仍一个副本→实际下载。5281字节下载与原任务research.zip摘要均为 `7676e6a7b678b0ec36cecd342ef8f50a430c784224ba00b12f21bc86b8d1b7f3`，原限制文本随副本保留；截图／DOM／receipt与独立回读记录在同目录。
- 合成研究在生产服务首次打开前用原管线和两确认门预置；运行正常服务时没有Provider factory覆盖或真实调用。工具链descriptor使用本机明确验证的Python3.14.4/DuckDB1.5.2；凭据helper固定拒绝，不读真实密钥。此处证明正常服务接线，未证明完整.app／干净机安装。
- browser005的一次性启动token在60秒后过期，正常拒绝；browser006采用新鲜入口后通过，不改生产TTL。浏览器夹具允许stdin的open指令申请新的一次性入口。自有fixture PID23125与child24973均退出，63708／64032端口不可达；005的PID6798及63450也已停止，见evidence-readback.json。
- 新永久normal-service、view-wait与bad-start测试在显式持久证据根保留运行材料。`focused-014.log`24 PASS / 0 FAIL / 0 SKIP，exit0；`host-typecheck-011.log`exit0；`resource-build-005.log`1 PASS，exit0。
- `portable-011.log`：canonical全量离线回归4938 PASS / 0 FAIL / 24既有SKIP，exit0，逐阶段退出见portable-011-summary.json。测试证据落位修正后新增专项以focused014最终身份通过；canonical不包含这组外置物料专项。portable010因新证据父目录未预建导致5项ENOENT，exit1保留，未据此改产品或降低断言。

原插件421 PASS／12缺历史夹具失败、既有24项SKIP、MCP严格物理收尾未量测、真实Provider／语义质量、安装／发布／用户Product Acceptance未执行等边界继续保留，不用本轮合成证据替代。

## 当前停止与下一步

当前授权明确点名“同一Astra/high只读CLI复核候选004”。004复核已交回，普通工程修复沿原DR-002工程授权完成；不把新候选005静默塞入004身份。本轮已完成全部适用离线检查，005完整文件副本／diff／身份清单位于 `E/candidate-005/`，交回供用户确认005的同一CLI复验范围。004原件保持不变；最新report回读摘要和PID87122已退出的证明在continuation-004/completed-readback.json。项目政策Native-first Role Execution要求复用例外时仍在其明确边界内。Engineering Acceptance、Product Acceptance、archive仍PENDING；[累计完整地图](../../../../docs/planning/capability-coverage/latest.md)保持验证中。

---

# deep-research 接入：§7 工程交回 003（独立验收前候选）

2026-10-18，Mac mini。**DR-002 UI 已获用户批准，工程接线和离线真实路径已实现；完整候选独立验证、Engineering Acceptance、用户产品接受、安装与发布均尚未完成。** 当前权威为本文003；下方002保留历史，不再是当前停止点。WIP UNKNOWN 依用户具名例外持续保留，无再次提权、旧指针修改或 Host Loop。

## 003 身份、范围与决定

宿主 worktree `/Users/bendandebaba/.codex/worktrees/7a90/JuanerAI`，分支 `work/mac-mini/deep-research-integration`，base HEAD `35177f9a9741cd7385b78bbf8143819a7df2ba33`。完整修改和新增文件由后述候选清单固定；均未提交／发布，不是已集成项目资产。正式批准行为为 [DR-002 R01–R10](ui-contract.md)；工程接收／具名例外见 [engineering-intake](engineering-intake.md)，当前薄规格见 [spec](spec.md)。

消费形态为固定随包 Node 子进程＋受保护 loopback；完整原 UI 保留，宿主提供入口、回程与稳定副本；原计划／框架确认保留；凭据只沿后端白名单环境显式注入；sessionDigests/followup 首期关闭。后端默认拒绝模型／搜索／网页／解析外部效果，未提供真实 Provider 执行权。测试仅明确合成资料和自有本机服务；依赖获取不等于研究外发。

固定插件源仍为 `3a3f8c3a910460423a8b7a2638655a100a2aa8e6` / tree `093d72c2f17cb2959cc811dfac0e093cf4b737f2`，原200文件在每次构建前重验；SDK 0.4.3、lock 与启动文档字节身份不变。当前宿主接入标准 commit 为 `6756546a1423162b16a552b24b83bdaa1e834e50`，C01–C12 适用。共享 Runtime 原文的实际 dirty snapshot 身份见历史身份表，不把工作副本宣称为 HEAD 原件。无上游业务修改，“必须项为零”保持；宿主已补齐监听、确认恢复、任务权限及发布／保存等接缝。

证据根 `E=/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/engineering-003-20261018`，属 Mac mini，本机持久证据不等于跨设备备份。

| 当前物料 | 身份与实际消费者 |
|---|---|
| bundle-008 | manifest SHA-256 `3bbcfc4bb4424eb15f040643d66e51e6e0af7ff6bbefc4879c26912f7527e49f`；17411文件。原业务dist、完整原UI、SDK生产闭包、Node26、固定MCP站点与许可证原件 |
| staged-resources-008/deep-research | 完整复制后逐文件独立验证，manifest同上；focused-011实际子进程从此搬迁路径运行。browser-004实跑007，UI/runtime/child逐字等价见bundle-008-equivalence.json |
| deployment descriptor | SHA-256 见 `stage-008.log` 的 descriptorSha256；host只读固定resources入口，不寻找独立版 |
| MCP | minimax-coding-plan-mcp 0.0.4、mcp<2，40 wheels与官方PyPI文件bytes/SHA逐项一致，见 `mcp-registry-verification.json`；源约束不兼容0.0.5所需mcp>=2，未采用。Python3.14/macOS arm64；使用宿主工具链显式Python，不运行uvx或发现.env |
| 宿主资源 | 实际installed-entry Vite构建共26固定资源，包含新增研究client/css；deep-research及Report Studio两种构建开关各验证。完整新.app／干净机安装未执行 |

## 003 验证结果与证据边界

| 验收面 | 当前证据／结论 |
|---|---|
| R01/R02/R03/R07，原完整 UI、两门、运行 | `browser-004/`：真实宿主iframe＋固定原UI，编辑问题／标题并分别确认→合成运行limited。原追问控件禁用；HTTP旁路、空门、取消后恢复绕门由composition/security测试反验 |
| R04/R05，有限交付与稳定成果 | 原发布生成v1；原完整limitations随真实ZIP和宿主副本保存；browser-004保存5284bytes，刷新／重开后再保存仍一份；源码 tests/process-copies 测试实际生成HTML/PPTX正式版后保存新副本、旧字节保留。PDF打印／真实排版质量未执行 |
| R01/R05/R06，回程、重开与隔离 | browser-002另一任务副本为空、实际下载ZIP独立摘要一致；browser-004回程草稿值“最终固定包回程草稿”保留；重开修正后可再次创建合成项目并查询原副本。profile测试无插件安装时仍能读副本 |
| C01/C02/C03 | build-008/stage-008/resource-build-004，固定清单正反例、实际拥有子进程并发复用、关闭等待exit0、旧端口不可达；未知状态和在途拒绝关闭。MCP实际打包入口只初始化／列工具、阻断网络，原stdio codec搜索用合成transport；真实MCP请求与严格子进程物理收尾仍未量测 |
| C04/C05/R09 | 逐效果授权、真实SDK授权钩子、control/view撤权、路径／来源／压缩／重复头拒绝；显式附件SHA冻结，任意路径和变更字节拒绝；递归配置秘密拒绝／隐藏，生产环境无继承凭据。原独立资料／密钥未访问 |
| C06/C07/C08/C09 | 中断发布pending→UNKNOWN保留、禁止效果重放；command reservation+staging恢复、相同内容幂等、不同正式字节形成独立副本、坏摘要拒绝；取消是受理，UNKNOWN不冒称已停 |
| R08 情报库 | security测试用原handler登记合成文本、保持RESTRICTED、重复登记幂等、取得正文被效果权限拒绝；原库原文／治理测试属于插件可用子集。未操作真实资料／删除 |
| C10/C11 | 固定SDK0.4.3实际codec／账本授权合成测试、原业务管线与原两门，宿主实际用户路径。Provider语义质量、真实数据结论与实际预算消费 NOT_RUN，不从合成结论认定事实充分 |
| C12 | 新目录构建／校验与搬迁，原源和历史包均保留；不原地换活动包；冷启动未结算运行／发布标记阻断。首个宿主候选，无旧宿主采用版可宣称已升级；旧数据降版／正式升级演练 NOT_RUN |

- `focused-011.log`：当前搬迁包与宿主接缝18 PASS / 0 FAIL / 0 SKIP，exit0。
- `host-typecheck-009.log` exit0；`host-client-007.log`100 PASS；`resource-build-004.log`实际新入口资源构建＋VM消费者1 PASS。
- `portable-008.log`：canonical `tools/harness/validation/run --portable`，4938 PASS / 0 FAIL / 24既有SKIP，exit0。之后 `portable-009.log` 再次4938 PASS / 0 FAIL / 24 SKIP、exit0。新增HTTP不可用映射及requestId守卫的最终受影响检查见focused-011与host-typecheck-009；不把早期日志冒称后改文件身份。
- `plugin-all-002.log`：原插件扩展suite 421 PASS / 12 FAIL，均因未提取的testdata历史包／checkpoint／golden或research-data原历史样本缺失；没有补读真实研究资料或生成新golden冒充基线。原文所述433/433仍只是供应输入基线。原hostAssembly7项及相关业务可用子集实际通过，完整433本次未复现。
- 24跳过项是原Provider、原生／读者／浏览器等显式环境门，详见全量日志；未删除断言，不以SKIP提升相关能力。便携回归不等于Desktop E2或旧native验收。

## 003 历史失败、修复及测试资产

request-path-red-001证明路径型requestId被原handler接受并越出requests目录（合成私有目录内复现）；宿主统一单段ID校验后security-011通过。security-red-001为真实反例：原resume取消待确认门后跳过确认推进limited，宿主恢复durable gate后通过。browser-004发现iframe只改hash不能再次消费bootstrap，已改新建iframe文档并实际重开后写入通过；历史发现保留。bundle-001依赖Homebrew Node动态库不独立，改用固定自包含Node，旧包仍保留。runtime-red-001缺dataDir装配错误已修复。原工具／CUA跨iframe locator失败用同页CDP鼠标输入完成，属于工具限制，未用脚本调用业务API代替点击。

portable-001至007保留原exit：本机默认Python3.9不支持tomllib、固定TS根未登记、Node26原生语法检查不接受原稿有效TS、元组基线、旧fake DOM缺querySelector、B2缺显式证据目录。分别用命令局部工具链、精确新增根、仅冻结原稿的TypeScript parser分支和真实语法反例、保留旧断言的夹具修复、新持久B2目录解决。不是删除失败测试。library初次新增测试错误传sourceId而非versionId，security-009保留，修正按原API参数后的010通过。

测试资产影响已在engineering-intake列明：没有移除旧正反断言；根清单新增项有缺失／重复／替换反验；原稿语法分支同时证明有效TS通过、语法错误失败；宿主资源计数20→22／24→26且按原文件bytes/SHA验证。任务专用fixed包检查独立命令仍必跑，不假称canonical自动覆盖外置物料。

## 修复候选004（当前）

Native独立技术复核003为FAIL：F-DR-003-01发现保存正文／导出等待期间撤权后仍写入。原报告和21份临时合成证据已复制、独立回读至E/validator-003，旧candidate-003保持不变。control-red-001.log记录作者永久HTTP回归200而非预期403，exit1。

修复为HTTP正文读完再次核控制权，Profile把本请求checkControl传入Application，Application在reservation前和异步导出完成后、同步落盘前分别复核。撤权前reservation保留，同命令由当前控制权重试；只读副本／回执和版本幂等保持。focused-012.log为19 PASS / 0 FAIL / 0 SKIP，exit0；host-typecheck-010.log exit0；git diff --check PASS。插件包008未改，不重复构建；此前4938便携通过按未受影响部分复用，不冒称全量在004上重跑。

候选004清单及完整文件副本为E/candidate-004/identity.json、source/。修复后的独立技术复验被服务端安全检查中断，未返回结论（见E/validator-004-interruption.md）；F-ROLE-003-01另为BLOCKED：native实际工具权限danger-full-access，与固定角色read-only要求不同，实际模型/effort加载也未独立确认。配置／行为自律不替代强制沙箱；未擅用CLI替代或改变权限。正式Engineering Acceptance保持PENDING。

## 005 CLI具名复核尝试与当前停止边界

2026-10-18用户明确允许仅本任务固定Astra/high、只读CLI Validator复核候选004，先核实际加载；再次拦截即停止，不绕过。授权原文保存在E/cli-validator-004/user-authorization.md。此例外只覆盖本任务的CLI及模型选择，项目／全局角色配置未改，旧native角色失败和中断不追溯改写。

实际使用Codex CLI0.158.0，同一会话01a14dac-fcb6-74a1-8c45-06920d4a0355先做配置预检，再resume复核。两个CLI启动信息和两个实际turn_context均为model=gpt-6-astra、effort=high、sandbox_policy=read-only、approval_policy=never；见E/cli-validator-004/runtime-readback-complete.json。此处依据运行记录，不是只读配置文件或模型自报。独立Validator只收到固定产品输入、候选与证据和明确例外，主Agent继续唯一写者。

复核结果 **BLOCKED，未完成候选审查**。只读沙箱拒绝shell为身份核验heredoc创建临时文件，原始exit1：`zsh:1: can't create temp file for here document: operation not permitted`。该Python正文未执行；Validator随即停止，没有重试、改写命令、提权或换路线。与之前possible cybersecurity risk内容拦截分开记录，本次是实际文件系统拒绝。审查前仅做工具发现／简短记忆索引查询，未核候选身份／验收内容，因此不把配置预检通过算工程复核通过。

完整返回见E/cli-validator-004/review-response.md，日志、命令、预检及失败工具输出在同目录。CLI正常返回exit0仅表示报告交回，不表示审查PASS。复核进程已退出，process-stop.json复查PID不存在；工作树前后122个WIP文件逐字一致，无新增／缺失（worktree-after-review.json），之后主Agent仅更新本结果和board。候选004的source、identity及产品实现不改；原19项专项GREEN、4938便携通过／24跳过、插件12项缺夹具失败和WIP UNKNOWN保持原证据层级。

**NEXT_ACTION：按用户再次拦截即停止的要求，停止本次复核；等待用户决定是否继续相同只读约束下的独立检查。未经新的明确接续，不自动重试。** Engineering Acceptance、Product Acceptance和OpenSpec archive均PENDING；没有Git发布／安装／Provider、旧指针或Host Loop操作。实际加载差异在本次获准CLI中已解决，但内容复核尚未进行，不能据此解除独立验收缺口。

## 003 当前接受与接续

固定候选清单及原件副本：`E/candidate-003/identity.json`与`source/`；完整diff保存在同目录。独立Validator：003技术FAIL已修复，004原生技术复验INTERRUPTED；获准CLI配置预检PASS、内容复核被只读沙箱阻断，独立验收BLOCKED。Engineering Acceptance：PENDING。用户Product Acceptance：PENDING。Git／完整.app安装／正式采用／真实Provider／其他设备：未授权或NOT_RUN；完整许可再分发结论未声称完成。WIP UNKNOWN继续保留。允许的下一步为完成当前固定候选证据和独立Validator；不是再次询问完整工作台／原确认／记忆范围，不新增MacBook技术批准 hop。

能力对应 C2-02（N12/S4研究子范围）、C1-01、A-05/B-01/B-02/B-03、C3-01；目前为实现中验证，不将[累计完整地图](../../../../docs/planning/capability-coverage/latest.md)改写成已交付。正式交付时再按验收作用域更新登记与快照。

---

# 以下为002历史原件（所有“待批／未安装依赖”等仅对应当时）

> 003 当前状态：DR-002 用户 UI Gate PASS；工程接收已确认，WIP UNKNOWN 按用户具名例外保留。允许工程接线与离线验证，禁止真实 Provider。批准与当前权限见 [engineering-intake.md](engineering-intake.md)。下文002准备状态保留为历史。

# deep-research 接入：§7 交回 002

2026-10-18，Mac mini。**固定源身份核对和静态接缝评估已完成；完整原前端可点击合同已准备。当前仍是产品准备，用户 UI Gate、工程接收、实际接线及真实研究未完成。** 唯一当前结果／接续入口为本文；设计见 [design](design.md)，待审 [UI Contract](ui-contract.md)。源码／UI 的获得不等于工程验收。文件未提交，不是已集成项目资产。

## 1. 本次授权与身份

用户明确允许直接从 GitHub 获取 `3a3f8c3a910460423a8b7a2638655a100a2aa8e6` 固定源码及完整 UI，核对后继续接缝评估和可点击 UI 合同准备；**不调用真实 Provider**。这取代交回 001“等待用户提供源”的停止点；不取代已确认的完整工作台、保留原确认交互和首期不启用记忆／追问的决定。

| 对象 | 实际证据 |
|---|---|
| 宿主 | `/Users/bendandebaba/.codex/worktrees/7a90/JuanerAI`；`work/mac-mini/deep-research-integration`；HEAD `35177f9a9741cd7385b78bbf8143819a7df2ba33`；tree `3b3c07f1b69f6d46f32a7789de5c05033e6cb537` |
| 插件取得 | GitHub exact SHA shallow fetch 到证据根 bare repository；FETCH_HEAD 为 `3a3f8c3a910460423a8b7a2638655a100a2aa8e6`，tree `093d72c2f17cb2959cc811dfac0e093cf4b737f2` |
| 提取与回读 | 按清单提取 200 个源／UI／配置／文档／vendor 文件；逐个 Git blob 校验、bytes/SHA-256，独立回读记录 source-identity.json；671 项未提取。完整 Git 对象可能含历史运行内容，但 research-data、.flow、testdata 未提取为工作材料、未运行或用于研究 |
| SDK | `vendor/pi-agent-runtime-0.4.3.tgz` 108617 bytes；SHA-256 `475480217d5f644a15264b2f838e5567d3e2c2e431b8a23c061a0665dbdbfa70`，与启动说明一致；未安装／执行 SDK |
| lockfile | SHA-256 `299edd520bcfd90342ed96be095325acc7619b90c696b012241f4edbe107ef31`，与启动说明一致；未据此声称生产 install 解析验证通过 |
| 完整 UI | `ui/` TSX、CSS、HTML、图像资源已取得；另复用原 markdown/projectGroups 纯函数；无受跟踪 ui-dist。reference-identity.json 记录原件，不改原 blob |
| 启动文档 | `0f7bb48` 路径 docs/juanerai-integration-kickoff-prompt.md，blob `588d441f68b1fd55ee423904bb17dc21de03baf5`；12497 bytes，SHA-256 `047e75b9229f9158a20bb7e1ae7944e6df0549fa13f4366daf610efb631fe7fd`；此前已核对 1ac4b98／0f7bb48／当时 main 一致 |
| 宿主标准 | plugin-integration standard 实际 commit `6756546a1423162b16a552b24b83bdaa1e834e50`；C01–C12 全适用，具体证据层级见 design §4 |
| Runtime 标准 | 完整实际读取 v0.3，17449 bytes，SHA-256 `b628e5e6ec08a586f00b88cfcd43e62e4f9ebd094e08a9897173d0b1e0519f0c`；共享仓 HEAD `703a2649090e5e145a86479dce0ced675d011035` 文件有未提交修改，不冒称 HEAD 原文 |

## 2. 对齐决定

| 决策 | 当前结果 |
|---|---|
| 消费形态 | 自有子进程＋loopback HTTP；不直接暴露默认无守卫 startServer，使用宿主监听装配复用原 handler |
| 原确认 | 用户已选保留计划／框架两门；首次生成计划也需有效任务授权，不能偷跳门 |
| 完整 UI | 用户已选完整工作台；宿主入口、回程、权限、稳定副本为增量，原六阶段与情报库／配置／版本能力保留。具体 DR-002 UI 仍待用户批准 |
| 密钥 | 宿主后端沿有效保管边界显式 env 注入，前端不接触明文；本次未读取密钥、未授权真实模型路线 |
| 记忆／追问 | 用户已选首期不启用 sessionDigests/followup。不传 sessionCandidates，且真实接口与 UI 一致拒绝；本稿只有合成拒绝 |

## 3. 接缝评估结论

维持插件侧“必须项为零”的输入基线。本次读到 J1 authorize/dataDir、导出的 Ctx 和域 handler，可形成宿主独立装配候选。发现三项宿主必须处理的事实：

1. startServer 监听后才返回，无鉴权原端口不能靠外层代理或事后换 listener 封住；准入必须在自有监听开始前成立。
2. 默认会话装配没有宿主 authorize；省略候选只是不生成纪要，不会自然关闭原 followup 路由与 UI。
3. 完成 run、不可变 research version、可重生成的正式产物和稳定宿主副本是不同效果，必须按实际身份与字节分别读回。

库抓取使用 makeAdapters.page/parser，可复用注入；库登记／更正／范围提升／删除／迁移、配置、预算、发布、正式输出也要独立受同一任务／效果准入约束。未形成需要上游必改的运行反例；也没有装配运行 PASS。具体 source 行号与后续 C01–C12 判据见 design。

## 4. UI 准备与验证层级

[DR-002 可点击原件](clickable/index.html) 使用已批准宿主原外壳＋固定插件原 React UI。预览工具链隔离安装 react/react-dom 19.3.0、react-router-dom 7.18.4（ignore-scripts）；复用本机 esbuild 0.28.2。没有 npm install 插件运行依赖、运行 SDK 或修改宿主 package/lock。

合成 fetch 从不转发真实请求；CSP connect-src none。计划／框架由合成数据产生，结果推进需“审核场景”显式按钮；下载只说明未生成真实产物，保存仅内存。完整原 UI 保留不等于每个效果已模拟。情报库写操作、真实正式输出／ZIP、文件读取和持久性均不能由本稿验收。

浏览器交互／视觉记录见 `source-002-20261018/ui-check.md`；候选摘要见 `candidate-identity.json`（收口后生成）。初次编译因遗漏两个原纯函数失败，补齐原件后成功；失败记录保留，非插件生产构建失败。最终记录不把早期截图当最终构建身份。

| 层级 | 状态 |
|---|---|
| 固定 source / SDK / lock 的字节身份 | PASS，见 source-identity.json |
| 静态源码接缝评估 | 已完成；实现／安全有效性 NOT_RUN |
| 原 UI 合成可点击审核 | 已准备；实际浏览器证据单列，用户 UI Gate PENDING |
| 产品计划独立就绪审查 | PASS，见 [readiness-review.md](readiness-review.md)；不替代用户 UI Gate |
| J1 433/433、typecheck、7 装配测试 | 输入基线记载；本轮未重跑、未认证原测试日志 |
| 正式 C01–C12、真实插件、Provider、研究质量、目标分发 | NOT_RUN，不能由 preview 代替 |
| 工程最终独立 Validator／工程接受／产品接受 | NOT_RUN |

## 5. source-identity／升级差异与保存

| 归属 | 输入基线 → 本次实际状态 | 采用边界 |
|---|---|---|
| 插件源／J1 | 指定 3a3f8c3 → exact commit/tree 与200文件 blob 已核对 | 仅评估／审核源；首次宿主正式采用尚未发生，无旧宿主验收包可声称“升级成功” |
| 插件 SDK／lock | 启动文档摘要 → 本次字节重算一致 | 未安装运行，账本／Session／版本不与宿主合并 |
| 完整 UI | 原源／资源 → 原件摘要＋审核专用编译＋宿主主题与桥 | 预览不是生产 ui-dist；原件不改，preview transforms 明列，目标包包含性未验证 |
| 宿主专属增量 | 无现有 deep-research Adapter → 接缝设计与静态合成桥 | 无生产接线，无插件业务修补或待回流代码；后续若须改原业务仍走原仓 |
| 分发／升级 | 原维护 commit → 固定源的第一段身份链已建立 | Node、生产依赖、第三方通知、安装包、离仓运行、旧数据兼容尚待工程验证；活动／UNKNOWN 不换版 |

### 证据与历史失败

设备本地持久证据根：`/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration`。`intake-20261018` 保留交回 001、启动文档、实际 Runtime 标准副本和原检查；`source-002-20261018` 保存 bare/source、identity、隔离 preview-toolchain、UI 截图／交互记录和后续快照。只证明本机可访问，不是跨设备备份。

旧 WIP 普通读取 `/private/var/db/juanerai/change-coordinator/active-change.json` 退出 1 Permission denied，继续保留 **UNKNOWN**；未提权或修改权限，旧看板历史不能替代当前读回。当前只做明确授权的产品准备，没有确认 Engineering Intake，没有接管旧工程状态或写项目看板。精确主模型／档位未独立验证，不宣称配置加载 PASS。

允许的变更只有本 Change 文档／可点击附件和设备证据；产品源、共享 SDK、其他插件、秘密、业务数据、生产依赖、旧 WIP、Host Loop 未改。未建 PR、未推送／合并／同步 peer、未安装发布。本轮不是正式 Change 交付，因此不把能力全图更新为已实现。

## 6. 精确接续点

**NEXT_ACTION：用户审阅 DR-002 完整工作台合同及可点击稿，确认新增入口／回程／保存呈现。** 准备工作完成后停在真实 UI Gate；依据本仓 AGENTS Startup Stop Line：每个产品 Change 必须绑定适用高保真可点击 UI Contract 和用户 UI Gate PASS，才进入工程执行。此前范围选择不是这个具体 UI 的批准。

收到相应 UI／实施批准后，核清 WIP 与工程接收，在同一主上下文完成薄行为规格→实际宿主装配→适用确定性／真实路径验证→固定候选独立 Validator。真实 Provider、资料源和调用资源保持禁止，直到任务范围另有明确授权；不会把批准 UI 当调用授权。无需重问完整工作台或记忆范围，也无需新增 MacBook 技术批准环节。
