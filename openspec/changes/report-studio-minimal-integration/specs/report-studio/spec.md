# Report Studio 集成增量规格

本规格逐行为扩展，不取消冻结方案的其他 M/AC/RUI 承诺。

## Requirement RS-DIAG-01：固定SDK工具拒绝分支的限定诊断

对应既有M04/M10与AC04/14的可追踪/失败保护，不新增产品入口或运行权限。详细范围与证据见[mimo-tool-diagnosis-009.md](../../mimo-tool-diagnosis-009.md)。

- 固定SDK真实SessionHost分别复现未声明名称、参数schema失败、同run重复调用ID，验证完整中立工具批次在任何效果前拒绝，旧轮完成效果和消费保留。
- 合法框架、跨run合法ID复用、软read失败及较早INVALID_OUTPUT对照必须能区分，不把它们误称同一错误。
- 本机探针按固定SDK完整字节定位真实throw，只保留封闭分支/位置/hash；未知源码拒绝，不开放调试端口、不检查scope或记录敏感内容，不改SDK/回复/工具护栏。
- 临时诊断范围控制只允许MiMo主制作、6次派发/10分钟和read/propose_outline；原回复中的未知名称/坏参数/重复ID仍交原SDK校验。上限/范围拒绝不清预留或伪造已知消费。
- 工具目录材料不进入产品包；既有项目和配置不迁移。未保存的真实坏回复继续UNKNOWN，合成GREEN不能替代真实制作或正式独立验证；新增真实调用须用户批准010。

## Requirement RS-PPTX-COMPAT-01：固定供应图表的可编辑导出

对应AC12/M03。Mini实际Keynote14.4试用发现，固定PptxGenJS4.0.1生成的嵌入XLSX中，table的范围带一个多余尾部单引号（例如`A1:B4'`），Keynote因此丢弃整个原生图表。仅改该字符的合成副本恢复原生图表及100/120/135数据，原始失败保留。

- 内置PPTX导出只修正此已复现的嵌入工作簿table范围序列化错误；保留全部文字、原生表格/图表、数值、公式、部件与关系，不栅格化、不删除未使用部件，不升级依赖。
- 不修改制作项目中的原始deck.pptx；稳定导出保存的是修正后的字节和其真实哈希。重复读取已保存导出不再转换。
- 没有该错误时字节不变；独立版导出分支字节不变。不以结构测试或诊断副本取代实际Keynote修改/关闭重开验收。

## Requirement RS-BUNDLE-01：内置固定版本启动前校验

对应 M06/M09，AC01/10/11，RUI-10。Application/Profile 在任何内置 Studio 进程启动前，必须核对可信宿主固定的包版本、来源提交、协议、清单原始哈希以及完整安装资源树。此行为不授权启动或安装。

### Scenario：匹配固定包

- GIVEN 安装根是普通目录、manifest.json 和所有资源均为无软链的普通文件，清单版本/来源/协议及字节哈希符合宿主固定值；必要 server/web/skills/node/browser/dependencies/licenses 角色完整；无重复路径和清单外文件。
- WHEN 校验。
- THEN 返回 ready 及已验证清单，不执行文件或联网、不改变文件/用户数据。

### Scenario：不存在、未知或损坏

- GIVEN 根不存在，清单不是有效闭合 v1、协议未知、字段不符、缺角色、资源缺失/大小/哈希不符，或存在未列出文件。
- WHEN 校验。
- THEN 返回 unavailable，原因分别可区别 missing/invalid/incompatible/corrupt；不连接独立版，不创建数据，不尝试下载、修复或启动任何资源。

### Scenario：路径或身份攻击

- GIVEN 绝对路径、反斜杠、点/上级片段、空片段、重复/大小写冲突、清单自指、软链或特殊文件；或整份清单/预期包身份不匹配。
- WHEN 校验。
- THEN unavailable，不沿软链读取外部材料，不返回原始文件内容。

### Scenario：独立版本共存

- GIVEN 本机有独立 Report Studio，但内置固定包不可用。
- WHEN 校验内置根。
- THEN 只报告内置包不可用；不扫描独立仓库、进程、凭据或数据目录，不采用其他版本。

## Requirement RS-BUILTIN-01：内置模式凭据与工具环境

对应 M04/M10、AC04、RUI03。内置供应构建明确设置 REPORT_STUDIO_BUILTIN=1；这不是用户模式接受或模型许可的替代。此模式导入模型模块及显式调用其历史凭据加载函数，都不得探测 .pi/.zcode 等工具认证文件。未提供显式产品配置的模型保持不可用。

### Scenario：无凭据导入

- GIVEN 内置模式、未提供任何模型配置；存在其他工具认证与否都无关。
- WHEN 导入模型模块或显式调用 loadKeysFromDisk。
- THEN 对外部认证路径零探测/零读取，不自动产生配置，不进行 Provider 请求。

### Scenario：生成代码环境

- GIVEN 制作进程可能持有已明确配置的模型密钥及其他宿主变量。
- WHEN 内置模式执行生成代码/Bash或render_deck启动Node。
- THEN 子进程仅接收 PATH/HOME/TMPDIR/LANG/LC_ALL及装配显式设置的PLAYWRIGHT_BROWSERS_PATH等必要平台环境，不默认继承模型密钥、集成控制令牌或其他未知宿主变量。保持批准的可信本地系统访问能力说明，不能把此环境处理称为严格沙箱。

### Scenario：独立维护不变

- GIVEN 未选择内置模式的独立版。
- THEN 此兼容补丁不改变其已有凭据函数或环境行为；内置版启动器后续必须明确选择内置模式，不能靠省略设置获得隔离承诺。

## Requirement RS-SOURCE-01：准确版本与选定材料投影

对应 M02/M10、AC02/04/06/07、RUI02/07/08。材料目录从宿主权威保存的指定 task/revision 产生，不能以全局当前版本替换。源身份包括 project/task/revision/outcome及其哈希、材料范围身份。没有可保存成果的版本拒绝；取消或仅浏览目录不创建项目或复制原始文件。

### Scenario：旧版成果仍按旧版读取

- GIVEN 当前任务已有新revision，历史中保留已保存旧revision。
- WHEN 请求旧revision材料目录。
- THEN 输出旧版成果与版本身份，当前与历史对象不被修改。旧版未保存或不存在时拒绝，不回退当前。

### Scenario：最小材料范围

- WHEN 用户选择目录中的结论和/或汇总表。
- THEN 仅产生选中材料副本，每份强制携带对应来源身份、核验范围与限制。结论保持MODEL解释身份，汇总表保持原计算核验级别；原始明细/完整会话/凭据/其他版本不进入副本。
- 未知、重复或空选择拒绝。此投影不发送模型、不创建项目，后续实际传入Studio还须对应授权和持久接线。

## Requirement RS-ASSOCIATION-01：来源绑定与创建回执

对应 M02/M08、AC05/06/08/13。每个宿主project/task/revision仅绑定一个关联工作项目。宿主先持久保留来源/输入快照及稳定association_id、studio_project_id，之后才请求插件幂等创建。未取得真实插件回读前保持pending，不假称打开成功；重试使用同一身份。ready后只重开既有项目，项目已删除时不自动重建。

- 相同来源、相同输入的重复准备返回既有绑定，不重复分配项目；不同来源版本分别保留。
- 同版本来源/输入身份发生冲突时拒绝，不悄悄覆盖旧输入；正常UI继续制作复用已保存快照。
- 只有指定绑定从pending→ready可确认成功，确认幂等。目录浏览或取消不调用准备写入。
- 绑定、源与数据空间固定到当前宿主project；不同project不能重开同一宿主数据库。重启可读取原绑定，不触发创建或模型调用。

## Requirement RS-DELIVERY-01：稳定交付原子保存与读回

对应 M03/M08/M10、AC05/06/07/08/13。关联操作只接受指定ready绑定中的一个已保存导出，不接受任意路径或独立项目事后挂接。保存完整产物副本与来源、格式、hash/大小、时间和质检提示，并回读副本及关联后才显示成功。宿主存储此副本，不取得插件工作项目写权。

- 同一association/export的重复提交或丢回执后重试返回同一delivery/交付序号；同export身份的字节、格式或警告记录变更拒绝，不能重写旧交付。
- 新export产生递增交付版本；旧字节/来源/警告保持可读。警告允许保存但不转成“已核验”，delivery固定标记为可编辑报告、非原分析新增核验或正式Decision。
- 缺失、hash/大小不符、格式不支持或插件尚未确认ready时拒绝；事务失败不产生半关联。重开只读，不自动重交付；已commit回执丢失先按association/export读回。
- 独立插件项目删除或编辑不能改变宿主副本；本存储不提供跨侧级联删除或任意迁移入口。副本持久化不是跨设备备份。

## Requirement RS-WORKSPACE-01：Application 持续消费同一来源和回执

真实Gateway接入之前，Application需先实际消费权威版本投影和事务Store：

- 新关联先保存pending，再向Gateway提交固定association/project/snapshot；Gateway返回完全相同项目与快照身份才转ready。失败保留pending；重试同一身份，不能重新分配。
- ready的继续制作只读取既有工作项目，不再次ensure/生成。插件项目不存在或身份错配时拒绝，已保存交付仍可下载。
- 首次材料选择与已绑定快照冲突时拒绝覆盖；正常“继续制作”直接使用既有绑定。
- 只读取明确ready项目下的已保存export，核对所属project，调用Store保存和提交后读回；重复请求优先读回原副本。Gateway不可用、错误归属、目标被删除或来源改变时，不能产生新的成功关联。
- 全部操作不得执行分析、模型、正式Decision或任意文件路径读取。此Application增量尚不代表HTTP/UI/Gateway已集成。

## Requirement RS-LOCAL-01：内置服务本地请求保护

对应 M04/M07，AC04/10；不覆盖企业隔离。Studio使用独立loopback origin及内置实例随机会话，不复用宿主分析控制令牌。仅可信宿主owner通信可管理桥接接口；浏览器用一次bootstrap换取HttpOnly/SameSite=Strict会话。nonce过期/重放拒绝，关闭实例清除准入。

- 必须匹配127.0.0.1连接、实际Host，禁止cross-site及不匹配Origin、重复关键头；mutating浏览器API必须相同Origin，POST/PUT及其他带body操作必须JSON类型。兼容既有无body DELETE。
- 只有无数据的首页/固定静态构建资源公开；项目/资料/产物API需有效会话。路径越界/编码绕过拒绝，不能借静态资产读服务器其他文件。
- owner桥接接口必须独立owner token、无浏览器Origin/Cookie/fetch上下文；浏览器会话或主分析停止不能冒充owner。
- bootstrap短时单次使用，失败保持未授权；刷新/重开需可信宿主签发新bootstrap，不自动启动制作。准入成功只代表连接会话，不代表可信本地模式接受或模型/材料许可。

## Requirement RS-SUPPLIER-01：实际供应服务关联协议v1

对应M01–04/M07/M08；先接通无模型的项目与导出接缝，模型与本地执行准入仍须另外实现和验证，不能因此自动启用。

- 只启动明确built-in模式、指定独立数据根的供应实例；旧独立版入口不改变。真实Fastify所有请求经过RS-LOCAL-01；owner桥接可幂等准备指定项目、查询精确快照身份、读取已保存导出与签发bootstrap。无owner的请求不可调用桥接。
- association/project/snapshot绑定在插件自有持久回执中；崩溃中断后只补齐同一固定创建，不增加另一个项目。ready回执下的项目被删除后返回不存在，不能重建。不同association不能接管既有项目。
- 选定材料以含来源/核验/限制的副本写入插件自身资料系统，不自动向模型提问或发送图片理解。不同来源版本保持不同项目。
- 已保存export必须属于该项目，只读取记录指定的项目exports内普通文件，核对hash/非空和支持格式，保留质检警告；拒绝路径/软链/损坏记录，不将任意文件暴露给宿主。
- 内置数据、关联回执与程序资源分离；没有模型配置也能管理和重开项目/产物。实际干净安装与真实制作验收仍NOT_RUN。

## Requirement RS-SKILL-01：固定随包技能只读接缝

按skill-read-repair-011.md的AC-SKILL-01–05：仅内置固定技能、不可写/链接或变体拒绝、实际SDK读回、旧任务配置/未知保留、封闭诊断隐私。通用项目文件边界和SDK工具护栏不放宽。

## Requirement RS-TOOL-OBS-01：可信创建装配的工具执行观察

按[tool-execution-observer-017.md](../../tool-execution-observer-017.md) AC-OBS-01–05：固定SDK绑定之前可选before/after，软失败结果可见、原停止链阻断同批后效；默认自由制作不变，权限/计量/工具声明/原配置及未知保留，不新增HTTP或持久配置入口。

## Requirement RS-TRIAL-CONTROL-01：单场景验收临时控制

仅验收组合使用[018的AC-TC1–6](../../trial-control-offline-018.md)：固定候选/同账、32派发/96工具/1800000ms、创建时before/after首错即停、两页图像hash进入后续请求、模型导出及正常UI三格式前后检查。默认产品不导入、不迁移原配置或未知；真实效果必须另批准019。

临时控制的正常导出兼容修正适用[025 AC-NORMAL1–4](../../normal-flow-control-025.md)：保留完整真实锁集合，仅在原policy认领且成功结算的配对本地导出后，接纳合法非倒退updated_at变化；项目所有其他语义字段和成果/材料/配置仍严格保护。真实UI/保存路径离线回归，既有版本检查失效/原默认/权限/UNKNOWN负例不削弱。此离线授权不授Provider、安装、部署或Git，不提升原023失败或完整Change验收。

## Requirement RS-EXPORT-CSS-01：HTML完整页面与两页样式隔离

用户授权修复026实际HTML样式失败。对应原三格式正常导出及自由制作，具体验收AC-CSS1–4见[027](../../html-export-repair-027.md)：保留head/body全部页面样式、原生文档隔离同名/全局选择器、实际PDF共用路径两页视觉/文本/分页、不改PPTX与原页/账本/权限守卫。不要求模型采用行内CSS或重跑已有效制作。本轮仅离线修复/回归及后续授权范围准备；真实Provider、安装、部署、Git保持禁止，026/全部历史FAIL/UNKNOWN/预留不撤回。

## Requirement RS-BUNDLE-LICENSE-01：034固定buffers许可依据与随包通知

对应M06及034直接授权，沿既有供应composer→manifest→实际包资源接缝。仅当前buffers@0.1.1许可缺口；不建立通用许可平台，不修改SDK/依赖/锁或功能。

- 为实际包内buffers@0.1.1保留原license=null元数据，并以原作者许可提交、固定六文件字节清单和适用声明记录其MIT/X11→MIT依据。通知及来源索引随模块licenses资源交付，列入原manifest/hash；vendor原source.tar不变。
- 构建含buffers时须在输出树创建前核对实际版本及六文件身份；版本/代码/原包元数据/README不匹配或链接输入拒绝，不能把该通知套用未知版本/代码。无buffers的原合成composer夹具和其他依赖正常路径保持。
- 许可通知资源必须包含可核实的版权/许可/保留条件及来源定位；原PENDING总体索引状态、其他UNKNOWN与已有全文保留，不把单包补证伪称整体法律保证。
- 新模块/应用仅通知正文、来源索引、依赖通知解析项及由此必需的清单/部署身份/签名封印变化；所有功能代码、SDK、依赖字节、锁、资源、运行权限和UI不变。离线封装/验证不启动真实应用/服务、Provider、安装或MacBook/Git/部署。

验收L034-01：正向composer实际输出包含完整通知和溯源，manifest角色licenses可校验、原metadata空值保留。L034-02：错误版本及六文件篡改/链接在创建输出前拒绝，原包不被改变。L034-03：实际新模块/应用所有非通知功能文件与027逐字相同，旧安装/159项真实数据未变；033产品接受/历史失败及旧UNKNOWN不回填。证据须绑定新清单/签名/源码，并由既有独立Validator作受影响复核。
