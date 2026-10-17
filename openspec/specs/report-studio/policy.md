# RS-POLICY-01：明确模式、材料用途与持久运行状态

对应M04/M05/M10、AC03/04/08/09、RUI03/09/10。在内置Studio自己的数据空间持久化模式接受、项目用途许可和运行状态；不读取或继承独立版/宿主分析授权。此Personal机制处于用户与本地代码共享的信任边界，不宣称抵御同用户恶意代码的安全沙箱。

- 首次可信本地模式默认未接受；接受/撤销有版本和历史。模型配置不等于模式接受或外发许可；读取状态不启动任务/模型。
- 每个项目许可绑定实际配置的接收方集合SHA及明确材料source_id/原件SHA/kind，不绑定凭据内容。问题文字、图片理解、页面截图和联网取材的用途分别明确；已有许可覆盖的材料/接收方/用途不重复确认，移除材料不使其余许可失效，新增或更改材料只显示缺口。缺许可材料可本地保留，不自动图片理解。
- mode未接受、问题用途未许可、接收方变化或当前材料缺口时拒绝模型/工具准入。生成代码/Bash可能联网且有当前用户系统权限；没有联网/代码许可时不准入Bash或render_deck。页面截图发模型另外检查截图用途。撤销立即关闭新的受影响调用，不假称撤回已发送内容或物理停止。
- 本地导出/预览不需要模型外发许可；接受本地模式后可在不调用模型且关闭未许可网络的条件下操作。查看/下载已保存产物不依赖新的制作许可。
- 每项目新操作先持久化唯一operation，再进入SDK（本地导出/预览不是模型调用）；main/image/export/preview互斥，活动/停止结算/未核对UNKNOWN不能靠换操作或刷新绕过。任务SDK账本仍固定同一业务taskId，图片侧路进入原生purpose及同一Runtime/BudgetStore/Audit，不复制计量循环或直调transport。
- 停止请求只把running转stopping，保留在途状态。逻辑结果与物理settlement分别记录；未settled或usageKnown=false进入unknown，不能显示succeeded/stopped。已持久记录物理settled且无新效果的UNKNOWN可由用户显式核对后转stopped，保留未知消费及历史；无物理证据拒绝核对，不提供清账/任意强制成功。
- 服务重启将未完成running/stopping保留为unknown，不自动继续、重发或清账。已有settled凭据可检查；没有原操作物理凭据就保持阻断，不能用新Runtime的空idle状态证明旧执行已停。
- SQLite v1仅位于明确Studio数据根，包含模式历史、每项目许可历史、operation及状态事件；操作不写宿主原分析数据库。未知版本/应用ID、软链/硬链接/损坏记录拒绝。持久历史保留失败、停止与UNKNOWN，不是全内容审计或跨设备备份。

图片路径采用固定purpose：材料原件经许可后才可进入SDK准入后的专属图片transport，或由原生图片读取工具返回；图片阶段必须实际读取该图后才接受描述。它可产生正常的多轮请求，全部进入同一任务账本；不隐式增加失败重试，不改SDK或Provider版本。具体接法按RS-IMAGE-03；真实Provider另行授权。

内置SessionHost没有显式业务准入回调时拒绝创建；SDK模型/工具/发布与用户控制的准入均回到该回调，abort保留单独准入。主会话与图片用途配置一次固定，图片用途只读当前获准图片；任务账本/审计位于各项目，避免多个内存Store共写中心文件。逻辑返回不释放物理busy，等待原SDK physical idle；仅有绑定文件不允许对旧开放操作判定ready。当前增量尚未开放服务制作入口。

内置本地HTML截图/PDF默认阻止远端资源及Service Worker，浏览器子进程不继承模型凭据；这不宣称对用户本地生成代码形成OS沙箱或撤回已发送数据。Standalone路径保持原行为。

## RS-CONFIG-01：内置配置与凭据

只支持供应固定的minimax-cn与xiaomi-token-plan-cn模型链，不自动读取独立版、宿主分析、.pi、.zcode或通用环境变量中的凭据。内置配置不变更Provider/模型版本。密钥由专属macOS Keychain service `com.juanerai.report-studio.builtin.<closed-provider>` 保存；固定编译helper以私有stdin/stdout传递，不放在argv/环境/配置文件/日志。后台读取仅访问用户已为内置Studio明确配置的条目，不请求OS交互；显式保存/移除可由用户交互触发。

配置文件只含版本、修订、已配置Provider集合和当前写操作元数据。没有配置时status不读取钥匙串；保存必须先持久saving，再执行一次OS写入及读回，原子保存ready并独立读回。配置已保存/密钥可读取与Provider请求验证分开；本Change离线检查统一保留provider_verification=not_performed。没有自动Provider探测、自动重试或恢复写入。

凭据写入/删除结果或配置保存不确定时保留unknown；重启或刷新不自动重放、不准入制作，不能通过配置另一Provider掩盖该状态。只可由用户显式重设或移除同一待核对Provider解决此配置缺口，操作仍需当前修订及无活动/UNKNOWN制作。已有制作操作的UNKNOWN不由配置操作清除。未知文件版本/损坏/链接拒绝，不覆盖修复。凭据元数据不声明跨设备同步或主机系统权限隔离。

SDK0.4.1的usageKnown仅说明累计账本快照可读，不等于每次Provider消费已结算。业务消费状态另依据原账本reservedOutputTokens：在无其他同任务活动且物理settled的边界，对比操作开始前预留与操作后实际账本；新增预留未结算则本次usage_known=false。历史UNKNOWN预留保持原额，用户核对后后续已结算操作可标本次消费已知，但累计消费仍未知，不迫使重复确认同一历史缺口。缺基线/快照或不一致仍未知。不得修改SDK原usageKnown、清预留、退款、重跑或自行估算真实用量。

原账本的内存快照不能替代持久读回：结算写盘失败时采用磁盘保留的预留与UNKNOWN；已用账本缺失/异常不得视为新零账本。原SDK operation绑定附business_operation_id，未知/损坏绑定表不覆盖为新空表。

用户显式核对须先有同一业务操作的物理结束凭据，再核对持久SDK lease身份与计量；仅可释放该已结束lease，读回计量不变并重新装载同一Store。若原生operation仍open，仅能以匹配该业务绑定的SDK原生abort结束，再用原生reconcile回调确认open为空；不执行模型/工具、不续跑旧operation、不重放素材或清账。缺绑定/不匹配/多open/缺物理证据或核对失败继续UNKNOWN。核对请求按项目合并，同一在途核对不重复执行，配置/关闭期间不得越过该控制操作。

RS-RUN-01：实际chat/框架确认通过固定Factory加载本模块明确配置、当前mode/材料/接收方/用途许可，再进入SDK。信号停止不等于物理完成；builtin Bash/render_deck只管理自己创建的独立进程组，取消/超时后观察close和组退出，SessionHost结算还须等待本项目已登记原生执行。不得扫描其他PID或结束独立版/宿主任务。可信本地代码可另建会话脱离组，这不是OS沙箱或企业强隔离声明。

项目删除通过同一Factory关闭该项目新准入、核对无活动/UNKNOWN/核对/原生执行、关闭空闲Host后调用原删除规则；在途删除期间不接收新制作，失败不吞掉未决状态。既有宿主稳定交付不随插件项目删除。SDK原生核对可累计控制耗时，模型/工具/Token/资源与未结算预留不得清除或退款。

RS-IMAGE-01：builtin上传图片仅保留原件及pending材料索引，不直接调用vision transport，不把未尝试理解称为失败或已生成描述。用户核对当前材料/接收方并明确点击理解，固定Pi Adapter才按同一taskId/原生purpose/账本执行；每次模型/图片读取校验该source_id/真实哈希仍在当前许可材料，不能靠移除材料后的子集许可发送旧图片。只接受实际读取图片且成功的描述；标模型生成、非原文，写回前再核原件身份。Standalone原流程保留。遗留direct vision函数在builtin拒绝，不能作为侧路。

RS-LOCAL-01：用户本地导出及预览只需本地模式，不需要模型配置/外发许可。按项目登记本地operation及实际HTTP handler；同一成果视图并发缩略图可加入同一个仍running的已拥有preview operation，新的模型或导出不能混入。模式撤销/停止后不加入新请求；最后一个本地渲染结束才记物理完成。停止将状态转stopping，已发渲染在现有有界超时内结束后记stopped，不假称HTTP停止回执已终止。退出/owner loss保留所有权等待在途handler和副本写入。创建或写回材料期间禁止删除该项目，URL查询不绕过对象计数。

本地Chromium使用最小环境、独立context、禁service worker；context在页面创建前注册HTTP/Socket阻断和禁用实时联网API，空白文档显式重新建立后才setContent，避免初始空白页未装载拦截。静态/普通本地脚本呈现保留，不启用摄像/通信能力，不宣称OS网络沙箱。实际HTTP/WS/弹窗/Beacon/STUN负例见verification；它们不替代任意原生代码的系统隔离证明。


### RS-IMAGE-02：图片purpose与真实transport固定身份一致

对应M04/M10、AC03/04和RUI03/09。图片仍使用既定MiniMax、原生image-understand purpose及同一task账本；图片模型和其transport必须绑定相同完整模型描述（含既定2048输出上限），主制作上限32768不变。保留SDK严格配置相等检查，其他模型/端点篡改仍拒绝；不能动态信任request.model或通过清历史/改SDK绕过。

WHEN图片在主会话后经明确许可理解，THEN真实固定SDK的transport身份护栏必须通过，实际图片读取后方接受描述；无真实密钥/网络的合成protocol阶段可用于离线验证其配置接线。请求/用量继续同账，旧未结算预留不退款；新图片成功不把历史未知改成已知。永久服务集成负例保留未许可不执行、只读批准原图片和主图片同账断言，并新增真实transport配置护栏及非预期模型/端点仍拒绝。

### RS-IMAGE-03：已授权图片进入首个视觉请求，实际读取独立证明

请求004批准范围内，小于等于固定SDK初始图片容量（base64 4194304字符）的图片，在同一既定purpose、SDK已准入的图片transport回调中，通过公开中立ModelMessage.images携入第一个模型请求，不依赖模型先选择工具。原生runAgent.images会被SDK0.4.1验证到未选中的文字用途/备选模型，不能在既定混合plan使用；不升级SDK或篡改备选模型能力来绕过。既有最大32MiB base64入口及较大图片工具路径保留，但实际SDK工具结果1MiB上限导致超大图片失败，本项未解决，不能声称32MiB均理解成功。purpose模型/工具声明/任务配置身份不变，不新增Provider、失败重试或直接模型调用。

只有固定SDK实际调用图片purpose的transport、且请求中携带与本次获准图片相同的内容/类型时，才可记为图片已被读取；虚假Runtime仅返回成功、无图片的文本请求、其他图片、已撤权或已取消均不能证明成功。实际工具读取路径继续可证明读取。每次携图外发前重新检查本次图片许可和取消；SDK仍负责授权准入、同账计量、审计和物理结束。保留错误/取消/撤权/未知负例，不在日志或普通审计写图片base64。


## RS-IMAGE-04 / RS-COMPAT-02：MiMo图像与旧任务计划

用户本轮授权和验收范围见[mimo-vision-007.md](../../changes/archive/2026-10-16-report-studio-minimal-integration/mimo-vision-007.md)。新项目固定双图片purpose：MiniMax优先、仅配置MiMo则选择image-understand-mimo；没有失败后隐式图片回退。MiMo图片模型保留原ID/端点，明确text/image及2048输出上限；主文字purpose不变。所有发送仍经SDK计量、同任务账本和逐次许可检查。旧项目预算存在时固定旧计划；私有`.agent-model-plan.json` v1持久记录计划，严格拒绝未知/损坏/链接，不自动迁移旧SDK配置或清未知预留。仅MiMo图片用于新项目，旧项目收到明确可见说明。图像入口/材料与用途授权布局复用已批准RUI03/09，没有新UI流程。此前“当前增量尚未开放服务制作入口”是早期实现快照，不代表007实现状态。

### RS-IMAGE-05：主制作的页面截图

007真实B场景证明MiMo旧text主purpose不能消费look_page图像，失败保留。修复后新项目默认dual-v3，MiMo主/备制作也声明text/image，仍在原截图用途许可后接收本地JPEG；不升级模型/SDK。既存minimax-v1和dual-v2继续原不可变配置，新声明只用于明确的新计划，不迁移失败任务。因果RED后以实际SDK、实际look_page和本地浏览器证明图片进入主制作下一次请求，重开后账本保持一致；无截图许可仍在工具前拒绝。原B次数已用，另一次真实场景须用户批准。
