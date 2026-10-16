# 真实 Provider 与 MacBook 验收授权请求 003（待用户确认）

2026-10-16 · Mini 牵头 · 本文只准备授权范围，不表示已经批准。原产品/UI/就绪审查004继续复用，不新增技术审批节点。可以分别批准 A、B、C；安装不包含 Provider，配置密钥不等于允许发请求。

## 本次已完成与固定对象

Mini 已按用户本轮指令更新用户目录试用安装，保留原应用和独立数据。native-004 真实安装副本的 22,710 个模块文件及签名校验通过，产品能力入口打开 Studio，既有“Mini 原生安装合成验收”项目保留，仍未配置模型、未启用本地制作。实际安装资源内 Node/buildDeckExports 导出合成 PPTX，Keynote14.4 原生标题、中文正文、表格100→101、图表100→101实际编辑、另存、关闭重开及ZIP回读通过。本实例空闲正常退出后全部自有进程和两个端口结束。

本轮没有调用 Provider、写 MacBook、部署或发布 Git。只是 Mini 合成子范围通过，不代表完整 Change、用户产品接受或干净机安装通过。

- 工作树 `/Users/bendandebaba/.codex/worktrees/323d/JuanerAI`，分支 `work/mac-mini/report-studio-integration`，HEAD `1446276011917ec46b369eadaed40c059db46b34`；实现仍为 WIP。
- 固定源码候选 `candidate-002`，102文件 aggregate `0d6df3e55d10e8b2d5ee6cbd0cf5fcbe1b7a683152337259a948a8352d26c72c`。本轮只更新安装和记录，没有改产品代码/依赖/锁。
- 模块 `0.1.0-juanerai.1` / supplier `74ebb609fd73cf263614ffc9301dafaafcec4230` / protocol `1`。
- 模块 manifest SHA-256 `be468c2ff939ae372becc6fb07148e8c3cf914f467df2fdc137e29adf7ca7d5f`；app.asar SHA-256 `4f68b63fd58b374ea29c8c35e3481f895bade64379c498f4bf9b1a9af3526a8b`。ad-hoc 校验不等于 Developer ID、公证或正式发布。
- Mini 当前安装 `/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app`；旧应用保留为同目录 `Xanthil-native003-preserved-20261016.app`。数据根 `/Users/bendandebaba/Library/Application Support/JuanerAI/Workbench`。
- 证据根 `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/`，本轮 `native-mini-trial-002/`；见[验证增量023](verification.md#mini修正版安装复验增量023)。

## A：Mini 主模型真实验收（建议先批准这一小轮）

### 接收方、材料与凭据

只配置 `minimax-cn` / `MiniMax-M3`，`anthropic-messages`，固定基础端点 `https://api.minimaxi.com/anthropic`；用途为 PPT 制作/修改及图片理解。目标来自固定供应 `src/agent/model.ts` 与内置 `model-targets.ts`，不是已实测可用或价格承诺。

允许外发：本任务新建的合成两页报告提示、合成季度数值100/120/135、仅含合成文字/表格的材料、报告页面代码与模型工具结果；图片理解仅使用本任务合成图片。若批准截图外发，只含该合成报告的页面截图，不含整个桌面、其他窗口或业务文件。调用可能发送会话上下文和上述工具结果。没有真实企业数据、个人业务文件、仓库全文或历史其他项目。

用户在**内置版制作设置**自行输入并提交 API Key；不要发到聊天。只准保存/读取本内置版自己的 Keychain 项：service `com.juanerai.report-studio.builtin.minimax-cn`，account `api-key`。若该项已存在，先显示不含密钥的配置状态，覆盖/删除须用户另作明确选择；不读取 `.pi`、`.zcode` 或独立版凭据，不从其他设备复制密钥。系统若要求新的权限则停在提示处，不更改钥匙串访问策略或系统隐私设置。

### 本地执行与网络边界

需要明确批准可信本地制作模式，以及项目内提示/合成材料、代码执行与网络、合成页面截图许可。**当前产品将代码执行与网络合为一个许可**：实际生成代码/Bash/Node以当前macOS用户权限运行，不是OS强沙箱；不能声称只允许模型端点或只允许项目目录。渲染浏览器已有列明网络负例保护，不能推广为任意生成代码的网络隔离。

本轮操作约束：只使用随包资源和合成项目，不请求联网搜图、第三方素材、额外软件/依赖安装、任意网址采集或其他本机文件。出现额外外发接收方、路径或权限要求立即停止。若不接受上述现有可信本地风险，则保持模型制作未授权，另议更强隔离方案；不在本请求中擅自新增工程。

### 一轮工作量与消费决定

只建立一个独立合成项目：完成一次两页报告（含框架提出和一次明确确认）、一次定向修改、一次合成图片理解，以及一次在途停止/退出/明确核对场景；成功后本地导出 PPTX/HTML/PDF，核对同账用量、物理结束、未知保留与重开。每个场景仅一次，失败保留，不自动另开项目/清账/多轮重试；不得为追求通过而新增一轮。未知状态仅允许明确核对，不发新模型请求，先报告再决定。

**这不是“四次 API 请求”的承诺**：一次制作可包含多次模型、工具和图片调用；固定供应SDK0.4.1采用累计计量的 unlimited 模式，现有产品没有人民币硬上限。请求数、Token/时间上限及两页目标不等于货币限额，Provider账户实际账单也尚未验证。

批准 A 时还须明确选择：

- 接受上述一次任务范围消费及“无产品金额硬上限”的已知限制；或
- 指定金额上限，并由用户先在 Provider 侧设置可执行的账户硬限额，再核对后运行；无法设置/核对时不以提示词或人工估算冒充硬限额。

本请求不授权充值、购买套餐或接受新条款。模型不可用、权限拒绝、计量未知、停止未物理结束或超出场景范围时，记录失败并停，不自动换模型、升级SDK或修复Provider账户。

## B：MiMo 备模型与主备链（可暂缓，A不包含B）

另行配置 `xiaomi-token-plan-cn` / `mimo-v2.6-flash`，`openai-completions`，固定基础端点 `https://token-plan-cn.xiaomimimo.com/v1`；文本制作用途，不承诺图片能力。Keychain service 为 `com.juanerai.report-studio.builtin.xiaomi-token-plan-cn`，account `api-key`，仍由用户自行输入和提交。

批准 B 才允许：一个额外的两页合成文本制作场景及一次主备切换/回退场景；同一组非敏感合成上下文可发送给这两个具名接收方。接收方改变须在产品中重新明确许可；不靠隐藏的全局批准跳过。保留同账累计消费、失败与UNKNOWN，不通过清账模拟恢复。B的消费选择须与A分别明确或明确共用同一可执行额度。未批准B时只配置MiniMax，不让真实调用静默落到MiMo；主备真实验收保持NOT_RUN。

## C：MacBook 同一候选安装与离线验收（不含Provider）

批准后先只读复核主机/用户名、macOS/Keynote版本、目标路径、正在运行的相关进程与空间；不改变 MacBook 独立仓库 `/Users/huangbo/Dev/Projects/reports-factory`、其WIP、数据或凭据。已知目标为M5 arm64/macOS26.5.2/Keynote14.4；变化则记录，不自动推广到其他macOS版本。

允许通过已配置SSH传输**同一native-004冻结应用压缩包、合成样张和验收脚本**，不传密钥、Mini数据根、用户材料或整个开发仓库。执行前按附录SHA逐字节核对，解包后再次完整模块及签名核对。不是git clone/pull，也不在MacBook安装开发依赖。

拟写入路径仅限：

| 用途 | MacBook绝对路径 |
|---|---|
| 传输包、身份清单、原始日志/截图和合成副本 | `/Users/huangbo/JuanerAI-artifacts/report-studio-acceptance-20261016/` |
| 用户目录试用应用 | `/Users/huangbo/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app` |
| 应用自己的数据/日志/缓存/合成项目 | `/Users/huangbo/Library/Application Support/JuanerAI/Workbench` |

若应用/数据目标已有未知内容、同bundle应用正在运行或出现非本任务标记，停止并报告，不覆盖、清理、收养或强杀；已建的证据目录只追加本任务不存在的具名文件。只启动准确路径的本候选和现有Chrome/Keynote/Preview，无登录项、系统服务、管理员、网络暴露、全局PATH变更。需要额外系统访问或远程GUI权限时另行确认。

验收包含：插件入口及后台按需启动、未配置与许可默认、历史保留/返回；用随包工具离线生成合成三格式并本地查看；Keynote标题/正文/表格/原生图表编辑、另存、关闭重开；正常退出并核对自有进程/端口。**SSH不等于远程GUI控制许可**：若当前工具不能直接操作MacBook原生UI，由用户在MacBook完成具名操作并回传结果；不会启用屏幕共享/远程管理或用未批准的AppleScript绕行。Mini已有的限定AppleScript退出例外不自动扩展到MacBook。

全程不配置MacBook真实密钥、不调用模型、不复制Mini钥匙串。MacBook真实Provider若需验收，应在C完成后针对该机另批A/B等效范围。保存失败/UNKNOWN和工件，不卸载独立版或删除原安装；Keynote编辑前指定本地证据目录，不默认iCloud。

本轮只能证明指定机器的同包个人试用；它本来就有独立仓库。空数据根不等于“没有Report Studio源码/开发环境的干净Mac”。AC01的真实干净环境仍NOT_RUN，除非另获可验证的干净设备/用户环境授权；不为验证而移走或卸载原仓库。

## 共同保留项和下一动作

- Mini初次图表丢失、诊断试验/回归失败、旧审查NEEDS_CLARIFICATION、规划NOT_RUN、iCloud历史同步UNKNOWN及本次ZIP字符串断言失败均保留，后续成功不改写过去。
- 在途原生退出真实UI、真实模型质量/计量、MacBook、干净机、完整三格式质量与内容等价仍有未验证项；A/B/C各自通过也只覆盖实际执行范围。
- `buffers@0.1.1`许可缺口、私有SDK对外许可及再分发通知待核实；个人试用批准不等于对外商业分发许可。
- 最终完整固定候选独立Validator、required CI、工程接受、用户Product Acceptance、OpenSpec归档均未完成；实现Git授权仍缺。
- 不部署、不发布Git、不升级SDK/锁、不接真实业务材料、不更改Host Loop/权限/服务；不重跑仍有效方案/UI就绪审查。
- 用户批准前，保持已验证应用关闭，保留全部WIP/证据；批准后只执行具名授权块，缺少凭据、消费选择或可用GUI时停在对应缺口。

## 固定传输包身份（只在Mini准备，尚未传MacBook）

Mini本地文件：`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/native-mini-trial-002/Xanthil-native004-arm64.zip`。字节数 `468255811`；SHA-256 `b33b6cc818b429169aee08b1ef440b378afc2e926be38ca2cdc07463772bcc86`。全ZIP CRC及内嵌模块manifest读回通过，明细`native-mini-trial-002/transfer-archive-001.json`。尚未传MacBook；未集成Git，不是正式Release。执行C前仍须确认目标状态及归档/解包读回一致，不用版本名代替字节身份。


## 用户实际决定 · 2026-10-16

用户在本任务明确回复：“批准 A、B、C，接受本轮任务范围消费、无产品金额硬上限；密钥由我在内置版界面输入。按授权稿范围继续验收，保留所有失败和未验证项，暂不部署、不发布 Git。”

据此只执行上述具名A/B/C场景；接受任务范围消费限制，不等于Provider账单已验证或扩大次数。密钥输入/提交由用户在内置版完成；不读取其他工具认证。C不含MacBook模型/凭据，也不含远程GUI权限。原待批快照保留在native-mini-trial-002/records/。本轮证据追加acceptance-003/，此前所有记录保留。
