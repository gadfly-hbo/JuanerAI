# 027：HTML完整页面与CSS隔离离线修复

2026-10-16。用户批准：先离线修复HTML导出丢失页面CSS，补两页样式隔离和PDF共用路径回归，保留自由制作能力及全部失败/UNKNOWN/未知预留；通过后列更新安装与本地续验范围。本轮Provider/安装/部署/Git均禁止。原方案/UI/readiness004和Mini-led规则继续适用；不新增UI流程或审批节点。

## 当前消费者、增量与边界

消费者是原Studio成果页、export_deck既有HTML/PDF导出路径；026实际下载的两页合成报告丢失head/style。修复在JuanerAI固定供应准备配方，独立MacBook仓库、原固定source.tar和SDK/锁文件不改。原PPTX导出、自由write/edit/bash/render/look与图检流程、身份/认证/许可/计量/UNKNOWN原样保留。不要求模型重新制作、不迁移Task或强制行内CSS。

允许：`tools/report-studio/prepare-source.mjs`中的精确固定导出器修复、永久`tools/report-studio/supplier-export.test.mjs`和必要源配方断言、现有Change工程/spec/verification/coverage/状态板；在原设备证据根新`html-export-repair-027/`准备隔离源和合成回归。复用既有固定依赖与浏览器，不安装下载。禁止：真实数据根/安装树写入、真实Studio服务/Provider/凭据/SDK真实任务执行、MacBook写入、部署、Git发布、改供应归档或SDK/锁。

## 需求与验收

RS-EXPORT-CSS-01（既有三格式导出正常行为的缺陷修复）：

- **AC-CSS1 完整性**：导出保留每页head/style、body样式、中文/引号/实体/内嵌素材，不改变页源码或PPTX，不依赖外部CSS文件。026两页合成副本通过实际导出函数后，卡片/标题/数值/来源/声明样式成立。
- **AC-CSS2 隔离**：同名class/id、全局html/body/*/:root/自定义变量、媒体规则各自只作用于本页；不以简单合并CSS或脆弱选择器改写实现。使用原生独立文档容器，保持1280×720页面，不提供新的权限/认证机制。
- **AC-CSS3 PDF共用**：实际buildDeckPdf和buildDeckExports走相同完整页面合集；两页PDF尺寸/可搜索文字、页面顺序、每页颜色/布局及中文内容成立，无空白/额外页。实际渲染结果检查，不能仅检查PDF头或文件非空。
- **AC-CSS4 兼容与副作用**：空目录原错误、缺HTML时原fallback、PPTX字节/可编辑内容、源文件不变；原built-in context级HTTP/WebSocket/RTC/环境守卫保留，frames不能新增外发。离线测试不接真实Provider/凭据/账本，安装及116普通真实数据/3链接全部不变。026原FAIL及所有历史项保留。

## 最小工程设计

原extractBody只取body，导致head/style必丢；直接合并style会使两页同名.canvas/.card及body/:root发生污染。采用原生iframe srcdoc，将完整文档作为经过HTML属性转义的内容嵌入每页固定section。iframe独立文档保留页面自身CSS，不做CSS解析/重写、不引入库/存储/新执行器；原browser context守卫覆盖全部frames。原始页面内脚本策略和既有可信本地边界不另扩展，不宣称iframe是安全沙箱。

PDF仍使用该HTML合集及原本地浏览器入口；先用测试证明分页、文本与像素，不提前另造一条PDF专用样式路径。常规实现细节由Mini在本包闭合；若发现需扩大权限/持久化/网络边界则停止相关部分向用户说明。

## 离线验证配方（实施前固定）

- Node26 + 新隔离固定供应构建 + 原Playwright1.63.0/headless1243；只读使用既有依赖。所有fixtures/日志/PNG/PDF/退出码持久保存于原证据根027。
- 首先运行`REPORT_STUDIO_BUILTIN=1 JUANERAI_REPORT_STUDIO_SOURCE=<027/source> JUANERAI_REPORT_STUDIO_EXPORT_EVIDENCE=<027/red> PLAYWRIGHT_BROWSERS_PATH=<existing task browser> node --test tools/report-studio/supplier-export.test.mjs`，建立原实际导出函数的CSS/隔离因果RED。环境/导入/工具失败另存，不冒充RED。
- 修复后同一永久测试、原026合成副本、实际HTML/PDF渲染、固定准备配方精确身份/幂等/未知输入负例及受影响browser回归。原工具/计量/授权测试复用有效证据；需要时只补受影响主链，不宣称全量CI或完整Change已完成。
- 通过后固定源码/构建/依赖/测试/输出/保全身份，列明更新安装和本地续验动作。当前不打包安装或启动真实续验，不将027离线PASS回填026或完整Change的Validator/CI/接受/归档。

## 实际结果与冻结（追加）

**限定离线CSS修复通过；真实安装/本地续验尚未执行，完整Change未接受。** `diagnosing-bugs`流程沿026已确认原因直接进入实际函数因果RED，不重复臆造多分支根因；原生文档隔离消除了样式丢失与跨页污染。实现只在精确准备配方替换pageSection/extractBody及其调用：使用完整HTML的iframe srcdoc与属性转义，不合并或重写CSS、不引入依赖；PDF仍调用同一buildDeckHtml，原上下文HTTP/WebSocket/RTC守卫不变。

### RED、GREEN与回归

- `red-001`夹具缺少listDeckPages要求的mjs标记，3用例“没有页面”失败；另1兼容用例通过。原脚本/日志保留，不作产品RED。
- `red-002`在原实际导出器上复现：卡片computedStyle背景透明而非预期颜色，实际PDF像素白色而非本页print CSS；1兼容用例通过。是AC-CSS1/2/3因果RED，另一个guard用例被同CSS失败遮蔽，不声称其负例在RED阶段已跑完。
- 最小修复后永久新`tools/report-studio/supplier-export.test.mjs` **4/4 PASS**，同名class/id、全局html/body/*/:root、变量/媒体规则/特殊引号实体、两页定位/宽度/字号均保留；实际PDF2页/1280×720像素（960×540pt）、顺序/数值/中文文本层/来源与逐页print颜色通过；空目录/缺HTML fallback/PPTX字节/输入不变，以及新嵌入frames下HTTP/WebSocket/RTC守卫通过。本地探针服务器收到0请求，不访问外网。
- 原供应服务/浏览器/默认控制/修正控制组合第一次 **61/62 PASS**；唯一旧UI断言只读取外层body，iframe内文字不会包含在外层innerText中，失败保留。必要测试适配仅改为读取各frame正文再用**原有同样的100/120/135和“适用边界”断言**核对；两section、正常保存下载、hash、SDK计量、默认/未知/权限负例不删。定向AC-TC6复验1/1 PASS，未改的另61项证据复用，不把初次全组合改写为62全量同次PASS。
- 完整锁集合/原WorkspaceStore正常核对与同Task三格式UI额外正向变体1/1 PASS（合成SDK、允许本地activeMs诊断上界模式；不是021严格原条件通过或真实Provider）。组合内严格021拒绝本地计量变化负例仍PASS。临时控制本体和修正控制测试未改。
- 根源配方/来源检查8＋11＝19 PASS，固定归档/精确身份/幂等/拒绝未知或半补丁等覆盖保留；供应服务TypeScript及内置Vite前端构建、JS语法/空白检查通过。
- 当前 **86项适用检查成立**（62原组合的当前逐项证据＋19根源＋4新导出＋1额外元数据UI变体）；不把定向重复运行重复计数。新4项又在**实际随包模块及其随包浏览器**复验4/4 PASS。028准备所复用的本地限制另4/4 PASS，未批准回执时入口在任何真实数据/服务/凭据之前拒绝，不属于本轮真实验收。

### 026原两页合成材料的离线重放

只复制既有026不可变证据中的deck/page文件到027隔离目录，不读写真实项目制作。最终`replay-026-004/result.json`：两页HTML完整head/style各自保留，第一页3卡宽355px、第二页2卡宽545px，标题24px/left69与深蓝条均成立；两页原文本/数字/来源/边界保留，原文件hash和80759字节PPTX完全不变。HTML8989字节，SHA `40ad047f603d38a038cc148abc7d0c2627f7bee27f2cc11993c4f693463e17b8`。实际PDF2页，渲染PNG逐页看见数值/边界卡、声明和来源，无明显缺页/裁切/乱码；PDF图为实际PDF栅格化结果，不用HTML图冒充。`html-page-1/2.png`与`pdf-1/2.png`均已逐页查看。

**新增保留项：中文精确文字搜索/提取UNKNOWN。** unpdf提取PingFang生成的实际PDF时出现“增长”的“长”映射为部首U+2ED3等码点，NFKC不能全部消除。初次及NFKC重试的文本断言失败原样保留；最终重放明确允许该已观测字形变体来证明可见内容，并在结果JSON记录literal_chinese_search=UNKNOWN_RADICAL_CODEPOINT_MAPPING，**不声称精确中文检索已通过**。原冻结要求的版面/可读性和数字/来源文本层有独立证据；完整文字检索体验待后续验收，不以本次CSS修复关闭。

辅助错误全部保留：Python环境无fitz、pdftotext不可用（未安装替代）；replay003单行注释误遮蔽后续来源断言/栅格化命令，导致找不到PNG，原脚本/日志保留；改为块注释后replay004执行全部断言。相关工具错误有明确摘录而非冒充原始stderr；既有skill invalid_metadata警告保留。它们不是Provider故障，不回填026原FAIL。

### 离线安装候选（没有安装/激活）

为使待批安装动作绑定具体可审核对象，继续使用既有离线配方/依赖/固定Electron zip在027证据目录完成资源与Forge应用组装，不下载、不安装、不启动应用或真实Studio。本阶段的“离线修复/验证/候选准备”不含用户目录安装；临时实验与全部失败证据保留，不拷贝规则文件或写MacBook。

- 新模块manifest `8fe218b18626112394bf977acc21f9d3d3b8bf0bd64ca1d4be33347a3e70651c`，22714资源；相对旧017仅`studio/dist/agent/export-deck.js`变化，编译SHA `4928f2a5632a56cedb4036f386b65aaded45976a17cd74889d709c91acd582b2`。版本0.1.0-juanerai.1/协议1/固定供应74ebb609不变，依赖锁`15fa17b9…`、SDK0.4.1/Pi0.86.1及实际pi-adapter SHA `193a457e…`保持；未迁移任务配置或存储格式。
- 应用位置`html-export-repair-027/native-027-forge/out/Xanthil-darwin-arm64/Xanthil.app`；25591项完整清单独立读回，清单SHA `0a170d7e08f6b7218ea5187bb1d741b57fd2d0c728e6349145f537e4388a872a`。相对旧应用只变导出JS、模块manifest、部署身份和签名封印；主二进制非签名载荷逐字相同。新候选与旧安装的codesign完整性均通过，不等于公证、许可审查或正式发布。
- 冻结JSON SHA `70a08cc610cfb6bc2e92ba6167c297791bb31277e8e21a87368c65777cf04ffc`，含当前分支/HEAD/WIP背景、3个规范源码/测试文件的可读副本、编译/依赖/模块/整应用身份及真实结果边界。

### 保全与下一动作

Mini仍原`work/mac-mini/report-studio-integration`、HEAD1446276与原WIP。旧安装a58986f2…的22714资源逐项hash及签名不变；真实数据116普通文件/3链接、五预算/审计/会话/policy/配置/原页/PPTX和旧导出逐字不变。027真实Provider0、实际项目模型/工具执行0、真实服务0、安装0、部署0、Git0、MacBook读写0；离线SDK模型/工具仅使用合成transport及隔离夹具，不伪称它们从未执行。

026/023/019/008/010/A及全部失败、UNKNOWN、2048/16384/16384旧预留保持；累计仍15模型/20工具、20162入/11983已知出＋16384未知、resourceUnits37、activeMs225909。许可证/私有SDK再分发、干净机、MacBook限定接受与缺编辑文件、物理中断、较大图/主备、完整质量、最终独立Validator/required CI/工程/产品接受及归档均未提升。当前是日常受影响增量，按唯一政策复用有效方案/UI/readiness与旧证据，不重复正式审查或假冒独立验证。

下一动作仅审核[028安装与本地续验范围](install-local-authorization-028.md)。未明确批准，不更新Mini安装、不启动真实服务/导出/原生查看，不调用Provider、不部署/发布Git。C5-09仍IN_PROGRESS，正式接受增量0。
