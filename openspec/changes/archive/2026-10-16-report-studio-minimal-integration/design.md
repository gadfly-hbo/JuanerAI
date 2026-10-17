# 工程设计与影响决定

## RS-DIAG-01：本机离线工具准入诊断

2026-10-16用户连续离线诊断授权内，增加工具目录探针/诊断gate及供应SDK真实边界测试，详细设计与条件性010范围见[mimo-tool-diagnosis-009.md](mimo-tool-diagnosis-009.md)。不进入产品包、不改变版本化合同/持久结构、模型或purpose配置、旧任务和SDK。探针采用本机inspector.Session（不开端口），先匹配固定pi-adapter.js完整hash，再只观察三个throw位置的命中，立即恢复执行；不读取调试scope或模型/参数内容。诊断gate限制未来明确批准的一次合成场景，不复制工具循环、schema验证器或修写响应。

真实008坏回复未保存，三候选均保留UNKNOWN；只修复可证明的诊断缺失，不将合成GREEN称为MiMo完整制作修复。真实场景尚未授权。SDK usageKnown在范围拒绝时可能true而持久预留仍非零，继续复用既有业务消费receipt处理UNKNOWN，不改共享SDK或清账。

## 既定边界

Mini 在已批准产品边界内决定私有工程接口。报告制作不取得分析数据写接口，不更改原分析核验或正式 Decision。宿主只持有稳定交付，插件只持有工作项目；跨模块使用版本化合同。固定供应身份、显式配置、外发与本地模式接受分别成立。

首个消费者是 Personal Profile 的内置 Report Studio 启动器。先校验资源，再允许后续启动器使用其位置；无通用注册表、动态安装、默认独立版回退或第二 Agent Runtime。首个增量只有只读文件校验，不创建用户持久结构、启动进程或读取认证。

## RS-BUNDLE-01：固定资源清单

工程私有 `ReportStudioBundleManifest` v1：模块固定 `reports-factory`；精确 `version`、40位 `source_commit`、接口 `protocol_version=1`；文件项包含 POSIX 相对路径、字节数、SHA-256 及角色。必要角色为 server/web/skills/node/browser/dependencies/licenses，另允许 resource。服务器资源须含唯一 entry，Node须唯一 runtime；这些职责和资源存在不证明它们已能执行。

可信宿主装配固定预期 version/source_commit/protocol_version/manifest_sha256。按清单原始字节核对身份，不接受资源自报最新版本，也不自动挑选本机其他包。未知字段/协议、非规范路径、重复/大小写冲突路径、缺少角色或资源不符均拒绝。

校验根和子树不允许 symlink、特殊文件、缺失文件或清单外文件；manifest.json 是唯一不自哈希的清单文件。使用只读句柄、O_NOFOLLOW、同一文件描述符的 stat/read/stat 和 SHA-256。资源须处于由可信宿主指定的只读安装树；哈希检测一致性，不能冒充发布者签名、严格沙箱或消除同用户可写资源并发替换的风险。启动前仍须重新检查，未来正式包必须固定真实构建与签名上下文。

返回业务状态 ready/unavailable 和封闭原因；不返回原始路径错误、文件内容或认证。只有 ready 返回经核对的 manifest，随后实际生命周期仍要就绪握手验证；ready 不等于服务已启动、模型已配置或安装验收完成。

## 验证/激活/回退

先使用合成真实文件树测试正向与损坏、错版本、协议、路径、漏包、多包、软链、角色缺失。测试不导入供应代码、不发网络请求。必须先以已存在的 stub 得到行为断言失败，不以缺少 import/依赖当因果 RED。

默认无已验证供应包，功能保持不可用。后续供应端固定构建与 manifest 的生成、许可证/字体/Chromium、活动/未知任务和升级保护另补实现规格。版本回退仍不得操作不兼容数据；此增量不修改现有资源或用户数据。

## RS-BUILTIN-01：固定供应兼容补丁

已实读供应 model.ts 的模块级 loadKeysFromDisk 自动探测 .pi/.zcode，exec-env.ts 的 Bash 未传 env 因而全量继承。内置模式在 loadKeysFromDisk 函数入口拒绝发现；Bash环境仅允许 PATH/HOME/TMPDIR/LANG/LC_ALL。保留独立模式的既有行为。后续所有内置测试在导入前设置明确模式，并不提供真实密钥。

维护小型、可重复的构建补丁，而不合并两个源码库或复制SDK。`tools/report-studio/prepare-source.mjs` 对固定 source_commit 下两份原始源码的精确SHA校验后应用唯一补丁；未知源码或半补丁拒绝，不猜最新版本。源archive与补丁是可追溯的供应构建输入，实际供应源码保持独立版本；原MacBook WIP不修改。补丁源码归本实施分支，隔离构建目录只是可重建输出。后续集成API/UI仍需逐行为补齐，不把安全修正当整体接通。

## RS-SOURCE-01：权威版本投影

直接消费既有 OpenStoredTask 的 current/history 和保存结果；指定revision只精确匹配。投影模块不取得Store写接口，不读取原文件或会话，不复用模型请求历史。结论来自该版本表达结果，标明MODEL解释；主要汇总表只含计算value/unit/rows及groups的值，不序列化整份Task/Outcome或原始source.rows。

来源说明仅带 project/task/revision/outcome/hash/scope 身份，不携带原始路径或引用原文。源核验级别约束其适用部分，不把解释或后续制作视为已核验。必需限制在每份材料中不可被选择动作剥离。材料投影本身不授予模型外发权限，项目/授权/来源版本后续分别持久绑定。

## 关联与交付持久边界影响决定

在批准M02/M03/M08语义内新增当前宿主project私有 `.xanthil/report-studio.sqlite`，不改原分析库、SDK库或插件数据库。SQLite运营状态存关联与幂等记录；完整导出副本作为独立不可变BLOB与交付元数据在同一事务保存，避免文件成功/关联失败的半交付。它是宿主可下载的真实字节副本，不是对插件目录的动态引用。后续打包UI可定位数据空间；不是跨机备份。

v1私有存储：meta固定project_id/schema；associations按project/task/revision唯一，内容含稳定association/project ID、输入快照、来源、创建时间和pending/ready；deliveries按association/export唯一，并固定交付ID、单关联递增sequence、内容BLOB、格式、时间、SHA/大小、警告及来源。元数据另做完整性hash；每次读副本重新核对字节hash。预先拒绝未知库版本/应用ID、软链/硬链接和其他project，不迁移或覆盖未知旧数据。

Application持有语义与ID/时间输入；Store端口落实事务、唯一约束与不可变保存。重复相同输入返回旧结果；来源或同导出身份冲突拒绝。ready前不能交付。事务提交后回读；提交后回执故障可按同export读回。独立项目保持插件自有，不在此库增加任意挂接API。创建绑定只是pending准备，不是Studio进程或模型已运行。后续真实Gateway必须按持久association id幂等，不可用临时内存Map证明跨重启语义。

## 宿主HTTP与运行器接线

实际宿主HTTP→Personal→供应子进程→Store链路初次创建成功但交付404。原因是旧宿主通用URI只允许小写数字/斜线/连字符，而供应export_id含下划线；仅为report-studio前缀允许合同内的ASCII token字符，其余路由字符规则不变。新增正向export_大写/下划线及负向其他命名空间/编码越界回归；不重命名供应导出或放宽通用路由。

Personal显式组合验证资源、Store、Application、HTTP Gateway、专用子进程；普通反复查询已有且本运行器仍持有的live连接不重新遍历22685项资源（真实链路发现原先约18秒反复全树校验）。每次创建/重启子进程前仍完整校验；当前状态仍可显式只读校验。IPC观察到exit后live连接立即失效，不靠端口扫描推测存活。适用可信只读安装根假设不变。

## 固定供应SDK模型链与配置变化

配置只保存本模块自己的两家既定Provider凭据，不改变SDK或模型版本。生产SessionHost将一次声明既有完整主备链、仅MiniMax、仅MiMo及图片理解四个固定purpose：它们正好对应原candidateChain按密钥可用性选择的三种路径和图片用途，不是可扩展插件/模型注册表。全部purpose配置在首次任务前固定，同一业务taskId、同一BudgetStore/Audit；依据明确配置选择已有purpose，密钥不入配置签名。这样增加/移除本模块凭据时无需forceNextClaim、自动接受CONFIGURATION_CHANGED或清理旧账本。配置改变仅在全局无活动/UNKNOWN时生效，清除空闲Host内存中的旧密钥，保留会话和事件连接；下一实际请求重新加载明确内置凭据；接收方变动仍需相应项目外发许可。未配置候选不允许进入模型准入，也不把“缺密钥”当成一次真实Provider失败计量。

SDK原usageKnown与业务实际消费状态分开：操作前保存只读预留基线，操作后等待原Runtime物理idle并读原账本；新增未结算预留保留UNKNOWN，历史UNKNOWN不被清零，也不把每个后续已知操作重复当成新缺口。计量由SDK完成，宿主只解释现有账本字段和持久化状态。

原生控制核对采用SDK支持的abort操作及reconcile回调，避免依赖0.4.1不存在的通用idle snapshot/close。业务physical receipt与原生绑定ID分开保存、相互核对；显式核对只结束已确定物理结束的旧原生操作，第二次原生回调确认无open，不允许Provider/工具。回执UNKNOWN不从缓存预留零值推断成功，实际持久计量读回后才恢复同一Store；同一原生会话与SSE继续使用，不新建第二写者或改业务taskId。

## RS-OWNER-01 / RS-RETURN-01：精确来源和交付的私有回程

仅已验证、由本启动器持有的子进程可使用既有Node IPC发送闭合v1业务请求。操作只含context/deliver/receipt，绑定association、Studio项目、输入快照hash、原分析完整身份及具体export ID；无宿主控制令牌、路径、原始业务资料或SDK对象。回程只有精确来源状态/返回地址及稳定交付元数据；大文件仍经已有owner HTTP gateway校验读取。未知字段/版本/改绑/非字面loopback返回地址拒绝。

Personal按已注册原项目只读打开来源Store和独立报告Store，不激活分析Runtime、不切换当前项目，也不暴露分析写接口。普通宿主HTTP仍只可操作当前选择的项目；仅此私有回程可访问已绑定原项目，读前/后核对原注册和根身份。来源新版只提示，返回地址保留旧revision；目标不可用保留两侧既有独立资产，不改成其他目标。

同一关联/export在当前回程交付中合并；receipt在仍有交付Promise时明确pending，不能把暂无记录当失败重提。提交后必须独立读回稳定副本；回执丢失只读回，不自动重发。保存成功与消费/制作完成、分析核验或正式决定分离。宿主关闭还检查其自身在途回程，子进程超时或请求断开不解除仍在进行的宿主保存。

返回只在公开壳页接受三个规范、非敏感身份参数；数据接口仍要求既有会话/控制。bootstrap在加载工作台前移除fragment/query，将身份只在内存传给正常工作台。只打开所指定项目/task/revision的已保存成果，不调用模型/重新分析或自动创建默认项目；缺原版本不退到最新版。必要接线包含现有bootstrap及类型声明，属于已批准RUI04/07/08与M01/M02的条件路径，不扩大认证、控制或数据权限。

## RS-EXIT-01：退出意图与真实关闭分离

RUI10 的等待/停止并等待/取消由本任务的原生启动器承接。内部 owner gateway 新增只读生命周期快照及 wait/stop/cancel 三个闭合意图；不传路径、密钥或任意命令。等待只关闭新制作和写入准入，不中断已准入任务的后续模型/工具步骤；其原有许可与模式仍逐效果核对。停止仅发送本实例持有任务的 abort，并把本地导出/预览标为 stopping，等待既有实际处理器结束。两者均不自动核对 UNKNOWN、不退款、不重放。

取消恢复新准入但不撤销已发送的停止。生命周期快照含真实在途操作及项目标题、配置未知和请求数；读取不计入自身在途请求。只有实际无活动/UNKNOWN、配置无未知、供应处理器和宿主交付均结束才允许原关闭路径完成。正常浏览器关闭不发退出意图。失去宿主仍使用原有物理停止与保留未知的故障路径。

## 已安装浏览器 Profile 的随包入口

首版继续交付已批准浏览器工作台与同机服务，不恢复已延期的旧 Desktop renderer。固定包选项仅将同一 Electron 容器的 Main 指向 `apps/browser/installed-main.ts`；默认既有 Desktop 构建不变。容器仅提供单实例、打开工作台及原生退出三选项；不使用登录守护进程、自动安装或更新器。等待时菜单明确等待/未知需核对，并可取消退出；后台只读轮询真实生命周期，不推进工作。首次选择窗口默认取消。取消不能撤回已发送的停止请求。

安装树显式传入只读 resourcesRoot 与宿主自己的 Keychain helper；Studio使用其独立 helper。工作数据固定在应用支持目录 JuanerAI/Workbench 的私有标记空间，与开发工作区、MacBook 独立仓库及程序树分离。不自动接管旧数据或独立版配置。原 `prepareDevelopmentRoot` 的既有开发标记/目录行为不变，仅新增明确的 installed-browser 标记模式，未知目录/另一标记拒绝。已安装组合忽略开发文件读取器环境覆盖；宿主原有按任务授权的认证行为不变。

Forge 条件资源包含已核对宿主工具链、原有 notices、固定 Studio 包/descriptor，以及完整当前工作台静态模块；开发资源位置不是安装依赖。当前可用 Python 为开发工具链，尚未找到批准的可再定位 Python payload；真实整包构建/干净安装仍未验证。仅编译宿主入口不能关闭该缺口。

后续已核对并复用既有可再定位工具链1934项，详见verification020–021；上述未找到是调查时点记录，不是当前缺少构建输入。Mini原生安装/启动试用已获准；新候选/两机/Provider/完整接受状态以实际验证记录为准。

## Mini 原生试用发现的 PPTX 兼容修正

RS-PPTX-COMPAT-01只在内置`buildDeckExports`的PPTX副本路径调用现有JSZip依赖：对固定PptxGenJS生成的嵌入`Microsoft_Excel_WorksheetN.xlsx`内`xl/tables/tableN.xml`，修正合法A1区域后多出的单个尾部单引号。无匹配直接返回原字节；制作源deck、工作簿其余内容/关系、原生图表以及独立模式均不变。不删部件，不升级供应依赖，不以图像代替编辑对象。已保存导出的正常读回不重复修正，沿用原有hash/稳定副本权威。

因果证据包括原始导入缺图表、最小复现、嵌入工作簿定位及仅修正该字符即恢复原数值；诊断副本不替代真实导出。回归必须通过实际PptxGenJS→buildDeckExports路径，核对原件未改、其他部件逐字节不变、已有合法输出/无图表/独立模式字节不变。Keynote14.4实际编辑并关闭重开另记，不宣称MacBook或全格式内容等价已经通过。


## 图片接线修正004

复用私有Pi Adapter的固定图片单次上限，为图片purpose和其credential-bound transport构造同一2048模型描述；制作主备继续原固定32768/16384配置。单一私有常量消除两处上限漂移，SDK/公共HTTP/IPC/持久结构/历史账本不改。实际SDK配置守卫在服务测试中使用已取消请求和虚拟密钥/禁止fetch执行，先复现旧模型不一致的因果RED，再验证新图片两轮和随后主会话三请求共享同账；额外篡改端点仍须CONFIGURATION_CHANGED。真实补测仅用户批准的一次，新的未知继续保留并停。

## 图片实际读取修正005（请求004）

固定SDK0.4.1公开runAgent.images支持初始视觉输入，但限base64 4194304字符，而且会把该输入校验到所有声明用途，包括未选文字备选；实际混合用途回归已复现INVALID_REQUEST。不能改备选模型input或升级SDK来消除此拒绝。最小调整是在SDK已完成原有准入后的专属图片transport，用公开中立ModelMessage.images附加本次获准图片；仍遵守4194304初始携图边界。较大输入继续原工具路径，32MiB入口不缩减；本轮实际SDK测试另外揭示工具结果1MiB限制，超大图仍失败，明确保留而非声称全部容量成功。

在既定purpose的transport回调中核对中立request.messages.images，拒绝非本次图片；没有图且本次图在初始容量内时，复制request/messages并附加单个user图片消息，不改SDK的原请求对象。携图时重查permission/signal，再委托原credential-bound transport。它只在SDK已准入的回调内部运行，不从run直接调用transport、不复制模型循环/计量。取得返回后仍核对当前slot/取消再记实际读取；虚假runAgent成功但未调用transport不能使read=true。工具execute原读取证明继续保留。初始携图prompt客观描述已附图，较大工具路径仍要求先读工具，不添加额外轮次。实测仍只一次补测；离线必须用实际SDK/真实MiniMax序列化器证明首包有图，并保留假成功/撤权/取消/其他图片/原较大图工具失败/主图片与文字备选同账负例。普通audit不落原图，项目已有材料SHA及许可历史继续承担来源/外发范围证据；不能仅凭SDK请求摘要宣称可完整回放。

## MiMo图片兼容增量007

沿用固定SDK0.4.1及供应74ebb609，工程决定复用原图片purpose helper并允许具名image-understand-mimo。每个图片transport绑定其完整模型描述，SDK外不发请求，不复制计量循环。内置Host首次记录私有计划标记：已有预算→minimax-v1；无预算→dual-v2；标记wx写入及严格读回。重开、移除/恢复凭据不会改变固定purpose清单；坏标记拒绝。旧账本原配置和2048未知预留均保留，不forceNextClaim。新B合成项目是原授权独立场景，不是为逃避A未知而新建。参见mimo-vision-007.md、RS-IMAGE-04/RS-COMPAT-02及真实固定SDK测试。

实际B失败后的v3修复：双图片purpose本身正确，但主制作仍text声明，导致获准look_page返回后SDK INVALID_REQUEST。新默认dual-v3只改变MiMo主/备purpose输入声明为text/image；已有v1/v2保留原配置，版本化标记同时识别三种。直接原生SessionHost构造旧v2计划后，由新Factory重开同账本的离线兼容测试，避免把开发资源路径的harness配置哈希硬套到安装版。真实失败B的bc7e93…保留；不新建任务冒充原B成功，不自动重发模型。

### 011 固定技能接缝影响决定

见skill-read-repair-011.md：在私有Pi Adapter仅覆写精确固定技能的resolve/read/stat；write/exec仍保留原项目env闭包。固定hash、普通单链接、父路径/取消检查，资源错误封闭。工具定义/harness/持久配置不变，以修复前合成账本重开验证；不迁移真实旧任务。诊断gate只存封闭原因/工具标签，不收参数或回复。

## 034固定通知补齐（工程内最小增量）

用户仅授权buffers@0.1.1的许可绑定/通知入包、离线回归与重封装。既有buildReportStudioBundle是唯一消费接缝：保持原第三方包/lock字节和license=null，独立vendor NOTICE/provenance记录原作者许可提交、六原文件hash、README/package仅许可声明差异及可核实版权/文本来源。source-fixture.json仅作为不执行的原始公共字节测试资料，不进入模块运行资源。构建先拒绝不匹配版本/文件/链接，再按原copy/manifest机制携带两个licenses文件，原索引增补该条license_resolution、总体PENDING保持；无新公共运行合同、平台或服务。实际新模块/应用非通知功能等价、原安装/数据保全和既有独立受影响复核是终点，不以本次授权安装/Provider/MacBook/Git/部署。
