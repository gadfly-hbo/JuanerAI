# Change006 engineering design

第一叶为无副作用SAP import边界：文件Adapter将受限YAML/JSON与登记解析为标准对象，重建供应规范化双指纹、全包结构与审核验证；Core只处理JuanerAI业务定义、六指标可计算闭包与适用性。解析不执行供应源码，不引入供应SDK/运行依赖。已装YAML解析器仅在Adapter使用，限制大小/文档/别名/tag/重复键。

后续持久化与IR增量在受影响实现前补齐此处：精确版本/原字节不可变、原子批准、原Store兼容及rollback；资产定义进入现有IR/context而非旁路计算；主算与核验从原始快照采用分开的算法。公共业务类型保持无Pi/供应schema库。真实Provider、试用环境及出站材料不由工程类型决定授予。

## Project asset persistence (MF-01/02/03)

持久对象的业务意义、粒度、Owner/项目范围、不可变id@version、candidate/approved/revoked、以后默认与旧任务分离均来自冻结输入。这里关闭普通私有存储细节：在项目既有`.xanthil`下独立`metric-assets.sqlite`，不修改旧005数据库。`assets`每精确包一行，原始SAP/登记字节及业务hash，碰撞拒绝；`decisions`每明确批准/停用command一行，幂等输入hash、Owner、时间、批准闭包/范围及生效状态；`configuration`保留当前项目后续任务默认与有效批准。SQLite单事务，beforeCommit故障必须rollback；重复command不同输入拒绝。读取重新从原字节导入/hash核对，项目身份不符或文件symlink拒绝。原版本读取不修改。新功能停用仅停新准入，历史配置/结果保留；旧版本无此DB不做自动迁移、不改旧task/history schema。

当前AGENTS及唯一政策直接授予主Agent批准范围内普通工程类型/事务/schema细节的责任；本工程不属于AgentHarness跨base schema设计，不引入另一套结构Gate。新的业务字段、权限或公开兼容意义仍不能由私有布局授权。

YAML2.9.0已在原完整锁树中；现将其声明为直接精确依赖，沿用现有安装，不运行包管理安装/脚本、不改Pi版本或供应依赖。

测试接点由本已授权工程包确定：SAP导入业务入口、项目批准/读回、现有Context/IR/执行/Verifier/Store、正常浏览器入口。项目连续工程政策允许主Agent决定这些普通实现接点，通用TDD技能的逐接点确认不追加审批。因果RED只接受行为断言失败，缺模块/import/fixture故障不计RED。

每日先focused，完整收口需类型/适用完整offline regression、实际浏览器与安全/停止/保存路径、新鲜独立Validator及用户产品接受。旧Desktop E2不由browser证据关闭。

## Required risk guardrail and partial completion

冻结方案§6、MFC-04/06及场景output_spec区分净额受限终点与任务承诺的可用风险护栏。私有2.4参数`refund_guardrail_required:boolean`由Agent根据本次已明确需求声明；它不另开用户问卷、不猜风险阈值、不授予行动权限。参数必填，无隐式默认。零分母总计允许受限净额报告；若本次承诺可用护栏，声明总体/周/两期/category任一相关退款率不足就保留“部分结果完成，风险判断未完成”，回执仍列真实六指标，但不列场景完成。不能根据金额正常或主算成功冒称风险正常。字段进入真实IR、报告和本地不可变完成记录，供应回执保持原字段。

## Existing task and runtime path

正常Personal profile挂接项目资产Store与既有OpenAnalysisWorkspace。新任务创建时固定批准默认的id@version；原任务无资产不因后台默认变化自动加入资产。Application以宿主批准生成六指标投影，原完整56项仅保留本机，模型不能提供审批身份。当前声明字段、明确两期、91天自然周、截止、单位/状态/运费/内部渠道及风险护栏承诺编译为IR2.4；IR被原Context、计算、独立核验、数字报告实际消费。Pi Adapter只将两个新增业务工具加入现有原生目录，不改SDK协议或运行架构。已安装SDK离线回合测试核对实际工具结果、未授权与额外字段拒绝。

主算订单优先聚合；核验从原始资料退款优先重建关系和各窗口，并分别构造总体、13周、两期、category及每category差额。只共享无副作用有限表达式语法和精确有理数；不共享主算资格集合、bucket结果或供应oracle。每层双向来源/hash绑定，勾稽不代替原始资格核对。

`metric_asset_choice`是原Task私有可选增量。首次选择/换版调用原Store.revise，生成ready新修订，无旧framework/outcome/checkpoint；历史报告/回执不变。当前选择与以后默认独立；仅以后启用已经批准的同一Owner版本保留原approval.command_id，不撤销当前任务依据。明确执行与原停止/恢复、账本/单writer结合；刷新和重开不dispatch。决策输出hash验证后幂等返回；lost-response从对应command/task修订读回，错项目/错版本不当成功。

采用证明与报告在原不可变outcome同一事务提交，保存/核验/停止/来源变化失败无成功回执。下载重试只读取保存字节；UI只能声明下载开始，不能声明用户下载完成或Supplier登记。回执保持固定Supplier字段，实际固定Zod ReceiptSchema运行验证尚未进行，不冒称Supplier读取/登记通过。

## Browser composition and affected checks

复用原项目菜单、展开主区、五类检查抽屉及同一任务双模式。低频导入/维护者批准/差异与当前执行在原面；不新增业务导航、指标编辑器或问卷。HTTP沿用control-token、origin、路径/体积保护。整包导入只有受限字节，错误返回安全code/中文说明；文件在保存失败后保留。项目决策、当前版本、执行与回执下载分别读回。

试用SAP外发必须先有用户授权；`startIndependentBrowserService`增加可信composition布尔选项，默认false。普通Task现有确认文案显示将提供的精确六指标/场景，未加第二确认。未授权资产正文不从工具返回；恢复已有资产framework时在Runtime前阻断。工具catalog存在不授权执行。

CI变更仅维护现行固定manifest/lock的yaml直接声明和8项独立类型/验证根。原005及更早元组、SDK pinned integrity、负例均保留；不从被测tsconfig反推期望清单。prepare-ci-install精确byte/hash更新仅反映这两个当前文件。依赖副本无包管理器/脚本，历史工具链只读复用。

## Numeric label compatibility (MFUI-02)

实际试用已存在不可变2.4数字报告；改变label会影响其逐字重编译hash。工程影响决定：仅增加原内部报告可选`asset_label_format:1.0`，新2.4报告使用资产中文display_name及实际bucket标签；无标记的历史报告按原label生成核对，不迁移或改写。未知标记、移除当前标记或修改数字仍拒绝。无新持久表、业务定义、权限、SDK或公共Supplier字段变化。当前任务选择、原保存结果/回执hash及停止计量规则沿用。

## MF-STOP-01 实际取消模型后的显式续接

实际正常停止留下已物理取消的模型请求（用量UNKNOWN）及SDK未结束run；进程正常退出，重开无请求，显式继续被STATE_FAILED阻断。工程影响决定：仅在既有Pi Adapter增加私有收尾，复用SDK inspect/result/abort，不新增Runtime、SDK循环或数据迁移。只允许当前相同task/grant/scope/config内、不晚于当前修订的准确旧revision的一个模型admission、无任何该operation工具admission、唯一准确取消回执及时间/身份（SDK admission的通用消息digest与Provider投影消息SHA是不同身份，不假称相等；同一操作唯一admission、同业务Attempt唯一取消及准确计量reserve共同归因）、预算owner空/无writer/无物理pending、唯一当前native lane且无inbox。UNKNOWN请求状态、排队/工具效果/身份或账本变化均阻断。明确run入口才执行abort，再继续当前正常请求；构造/读回/重开不执行。保留历史native字节前缀、审计、请求、未知输出保留额；不得合成model.finished、清账或自动重放。旧无工具报告和中断execute_step专用恢复规则原样保留。

## MFX-01 / MFUI-03 正式评价修正

用户采用正式量化目标后，首任务在已批准1.1.0下再次询问退款归属，记机械确认失败，不补答后冒称通过。工程影响决定：在现有Application私有工具回执及系统上下文中，明确当前精确版本的项目批准是生效定义权威；退款金额归属来自该版本实际开关，支付队列退款率独立不变。用户提出不同定义时仍走原明确换版/真实冲突，不新增默认、不猜资料、不把工具内容冒充用户消息，不改审批/外发边界。因果测试覆盖1.1.0和1.1.1实际版本；模型行为仍须正常入口重新实测。

切项目成功后清空旧项目的任务瞬态：待上传文件、输入草稿、资产导入缓存、提示、协作/数字/复用定位。清理只在正常服务返回成功后发生；失败保留原项目内容。持久成果/资产不删除，布局模式仍可保留，不新增UI或存储协议。
# MF-05/MFC-03 原始金额资格修正（candidate010独立发现）

含运费支付额相减后的非负值不能证明原始支付额和运费合法。Product Core主算分别拒绝负原始支付额、负原始运费及运费大于支付额；Analytics Adapter从获准快照独立重读并分别实施同样的资格规则，不调用主算的资格函数。所有合格订单均检查，即使支付时间不在报告窗口；原有观察截止、期间和分类筛选继续各自重建。正比例单位换算不改变符号；零运费合法。此修正不改变资产定义、归属版本、持久结构、UI或Provider权限。

## CI-SOURCE-002 current-input fixture alignment

正式GitHub CI执行现有云归档路径，暴露测试仍固定旧manifest/lock字节身份。仅更新prepare-ci-install.test.mjs两个独立常量为当前获准yaml2.9.0清单的精确1909/375853字节及固定SHA；不从被测prepare模块反推期待、不动态计算期待、不删除或弱化任何原断言/负例。实际package/lock、依赖、运行实现及原CI策略不变。原旧tuple随Git历史及owned before-source留存，当前合同始终要求当前批准原件；这不是供应/运行模型或产品权限变化。
