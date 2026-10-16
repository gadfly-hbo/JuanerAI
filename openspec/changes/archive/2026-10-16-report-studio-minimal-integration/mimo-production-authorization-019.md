# 申请019：新候选仅MiMo两页制作、逐页看图和三格式导出

**待用户批准，当前不调用Provider、不启动真实验收服务。** 原016已批准但真实场景未开始；017改变了安装身份，因此不能直接使用原批准。本申请保持原场景和消费边界，明确绑定新候选及018临时控制。018离线结果不能替代真实制作或产品接受。

## 拟批准的一次场景

仅在Mini，使用同一 `proj_e27f124c`“Mini MiMo 合成框架诊断013”、015的两页v1框架和默认“深蓝经典”，沿原会话及 `task_proj_e27f124c` 同账执行一次：正常UI确认框架 → 两页制作 → page_01/page_02各一次look_page发给MiMo检查 → 正常成果界面保存并下载PPTX、HTML、PDF各一次。不重提框架、不换项目、不插话或追加修复补测。

| 事项 | 授权范围 |
| --- | --- |
| 唯一模型 | `xiaomi-token-plan-cn / mimo-v2.6-flash`，`openai-completions`，`https://token-plan-cn.xiaomimimo.com/v1`；原dual-v3主制作用途。无MiniMax、主备实验或独立图片理解场景。 |
| 文字外发 | 原315字节合成材料、100/120/135、两页框架/同项目合成会话、固定随包技能、生成代码及必要工具结果/系统上下文。不外发真实业务资料、其他项目、仓库全文或凭据。 |
| 图像外发 | 只准当前报告page_01/page_02的look_page预览图，各一次，1280×720 JPEG；同一主制作请求接收，记录图像hash及agent-html/fallback来源。不截桌面或其他窗口。 |
| 本地制作 | 仅当前项目的read/write/edit/bash/render_deck/qa_deck/export_deck/look_page。使用随包Node/Chromium/依赖/技能；不安装、升级、联网取材、抓网页、下载素材、改源码/安装资源或其他用户文件。第一次看图后不再改代码或重渲染；发现问题即停。 |
| 临时服务与控制 | 允许Mini临时启动固定安装模块及本机可信验收组合，通过017创建时接缝注入018工具观察器、原transport和业务policy的收紧检查；仅当前项目一个main阶段。原SDK授权/计量/审计/声明/不可变配置和认证保留。不把此控制写入产品包或限制日常自由制作。 |
| 正常UI | 以014原生新标签地址栏方法进入，只打开当前项目；通过既有材料与外发范围界面，将该项目许可扩展到合成截图及现有“代码/Bash及联网”组合选项。使用原UI确认一次框架。 |
| 导出 | 模型export_deck最多一次、格式限pptx/html/pdf子集；正常成果UI分别保存三格式各一次，实际下载并复制读回证据。模型deck/export不代替UI导出记录。临时控制对正常UI动作和原业务begin/finish做前后检查；未获控制器许可或重复格式不执行。 |
| 本地查看 | 用现有Keynote/Chrome/Preview只读打开三格式合成副本，核对两页、内容和可读性；不做Keynote编辑/.key另存/iCloud保存或新模型修改。 |
| 凭据 | 只经原configuration→native credential helper→SDK内存路径使用已保存MiMo密钥。不显示、导出、保存、删除或恢复配置；若不再仅MiMo、凭据不可用或有新系统权限提示，停止。 |
| 总量 | **最多32次新增物理模型派发、96次SDK工具准入；首次新增派发起30分钟，直至本轮检查/三格式保存结束；每次输出上限16384。** 辅助/恢复/重试全计入上限。限额不是应使用的次数，未用完不增加场景。 |
| 消费 | 请求沿用已接受的任务范围消费、**无产品金额硬上限**。次数/时间/token不构成金额封顶，Provider实际账单未核实；不授权充值、购买或接受新条款。 |

**现有可信本地边界须接受：** 当前产品把代码和网络合为一个许可，生成代码/Bash以当前macOS用户权限执行，没有OS强沙箱。限定项目/不联网取材是本轮授权约束，不能声称任意生成代码被系统强制限制在目录或仅能访问MiMo。浏览器网络保护不等于Bash网络隔离。不得暗中改系统权限、更换SDK/执行器来扩张边界。

## 固定身份及执行前检查

- Mini应用：`/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app`。供应源74ebb609fd73cf263614ffc9301dafaafcec4230、模块0.1.0-juanerai.1、协议1；017 manifest **a58986f2a07eea1c2eb290b1bcdfb0b13b713e4668da2f722cb5c1d95c226c01**，22714资源，完整资源/签名仍须执行前一致。本轮不换候选、不重新封装安装。ad-hoc签名不代表公证或正式发布。
- SDK0.4.1 / Pi0.86.1；pi-adapter.js SHA `193a457e960d0596ff40df70d2b4de7b8ade980580db1e72c255ebaff0dd3248`。原89工程源aggregate `081702a2773db3f733be2afedb78a8a1e42be864b8606048e97269357de586cc`；分支work/mac-mini/report-studio-integration，HEAD1446276011917ec46b369eadaed40c059db46b34。
- 018临时控制及离线验证固定身份见本文件末尾；源/配方/启动组合改变导致证据不适用时，先离线重验，不借旧PASS发模型。
- 项目根：`/Users/bendandebaba/Library/Application Support/JuanerAI/Workbench/user-data/report-studio/proj_e27f124c`。outline仍v1/两页/confirmed=false，1126字节，SHA `0d21b99cbed96a3b76885681a79e965e3482baefeaa2479379e8ec5eb7637150`。
- Task配置身份 `51577fd327c18b4b3523432dc5f3fb5e90e25e0364a6a634fa88448470af65f4`；budget SHA `ca6c441de05c0606d57b195a0c8fa5645f3cf7cdf49c0e0fe378d20a1b4a8b16`。起点4模型/4工具/输入4375/输出587/预留0；新32/96按增量计算，不清零旧消费。不可变任务原32768上界不改，实际主请求仍16384。

执行前保留103原数据文件/五个预算、旧策略行及原项目13文件；只读核对仅MiMo配置元数据、原owner独占、没有活动试用任务。旧010 UNKNOWN只允许已知physical_settled=true/usage_known=false的原记录逐字段一致保留；新UNKNOWN、未结束操作、框架/账本/资源或权限不明即停。不核销或核对旧未知以继续制作。

## 通过条件和停止线

1. 第1页保留100/120/135、合成测试/非业务事实及材料来源；第2页说明仅用于工具接入诊断，不证明原因、利润、增长或业务行动。不新增业务事实或页数，不将数值卡当原生表格/图表验收。
2. 两次look_page成功，图像hash与后续实际MiMo请求中的图像相符；MiMo给出逐页内容、遮挡/溢出、对齐和可读性检查。只有工具名/图片生成或发送，不算模型检查通过。look_page是HTML/代码近似图，不是Keynote实际PPTX截图；fallback须披露限制。
3. UI实际导出记录、落盘文件及副本逐字/hash一致。PPTX可解包且2页、文字可选；HTML本地两页、不依赖外部素材；PDF2页且本地可读。对照主旨、数字、合成声明和适用边界，无明显缺页/裁切。文字提取的Unicode兼容字符可作NFKC比较，同时保留原文件和提取差异，不据此宣称所有复制/字体问题已解决。
4. 原Task计量只追加，给出本轮增量及累计、预留、active/physical_settled/usage_known；其余四预算/其他项目及旧策略行不变。只正常关闭本次自有服务、端口和标签，不能证明物理结束则UNKNOWN。

**首次失败/UNKNOWN即停止，不自动补测。** 包括Provider/SDK/工具异常、软ok=false、Bash非零、QA硬错误/页数错误、越界、限额/截止、截图明确缺字或布局错误。关闭新准入、请求原停止并等待原收尾；保留已写文件、失败和消费。已经开始的本地导出可能完成落盘，不能声称取消撤销了文件；不开始后续导出。QA建议flag原样披露，不全升硬错误或隐藏。

HTTP自动重试保持关闭；原SDK恢复设置不改，首错后控制拒绝新派发。同批超限整批拒绝，因被拒准入留下的SDK计数或未知16384预留保留，不退款/清账。任何权限提示、依赖/空间不足或未知效果均停，不安装、管理员操作、放宽认证或恢复旧任务。

只在完整制作、两页真实模型检查、三格式本地证据及正常结算/收尾均满足时记有限场景PASS；缺证据PARTIAL/UNKNOWN，失败FAIL。不会自动进入修复、追加截图/导出、第二次确认或新Task。

## 写入和保留范围

允许写当前项目原生会话/预算/审计、deck/pages及预览、deck.pptx、deck/export和exports记录，原应用必要的新许可/操作记录；原工程证据根后续`mimo-production-019/`保存日志/截图/导出副本/manifest。正常依赖引用可建立，不能改依赖。若Downloads出现本次准确识别的新文件，仅复制到证据目录并保留来源，不清理或浏览其他下载。

原生日志沿原合同完整保留；额外控制诊断只存封闭原因、工具标签、阶段、序号和hash，不另落凭据、参数/调用ID原文、原始HTTP回复或思考，不检查inspector frames/scopes。

旧A2048/01016384、B/008 FAIL及根因UNKNOWN、010被拦工具UNKNOWN、013历史403/暂停、014DOM超时、015失败/metadata告警、016控制失败、017证据保存/项目板拒绝及018全部离线失败保留。主备、实际物理中断、较大图、许可/私有SDK再分发、干净机、MacBook限定接受/缺编辑文件、完整质量等价及最终Validator/required CI/工程产品接受/归档均不关闭。

不写MacBook、不恢复MiniMax、不触及真实业务资料，不授予部署、Git提交/推送/PR/合并或发布权限，不重跑有效方案/UI/readiness004。全部材料当前仅Mini本地持久保存，未Git集成或跨机备份。

## 用户确认

018完整离线验证及固定身份现已补齐，可回复：**“批准019，沿用015框架和深蓝经典，按新候选及018控制完成一次；接受现有可信本地执行边界及任务范围消费、无产品金额硬上限。”**

未批准前Provider0，不启动真实验收服务、不使用密钥。原016未消费事实保留，不将其自动视为本稿批准。

## 018固定控制证据 · 已补齐，真实授权仍待批准

实际安装内SDK/Chromium，默认外网拒绝和注入MiMo SSE的整组24/24 PASS、0FAIL/0SKIP。最大派发32/工具96、等值1800000ms与真实短定时取消、同批停止、原SDK拒绝/原权限、模型/项目/图片/导出边界、图像hash进入实际MiMo序列化请求、正常UI三格式下载/两页文件读回、旧2048+16384合成预留同账保留均覆盖。正常正例为4次注入物理请求/10工具/两页agent-html图、一次模型export、三次UI保存下载；真实Provider0。QA建议digit_guard flag及PDF原始Unicode兼容字差异保留，不当成真实内容质量通过。

- `tools/report-studio/trial-control.mjs` SHA `be308a7e59c6cf52e9e41dcd758d5c88d3b4e600eeb0969c6c93c98aadf16447`。
- `tools/report-studio/trial-control.test.mjs` SHA `12c7ea3d40ed6de93055f1c06f49db499d868f3da1fb8dccee3f9c413e4c095f`。

固定源码副本、最终日志/exit及合成文件位于Mini原工程根`trial-control-offline-018/control-final-011-*`，验证明细见[018实际结果](trial-control-offline-018.md)。全部103真实数据/五预算、原89工程源及22714安装资源/签名独立读回不变，配置元数据仍revision3/ready/仅MiMo，未读取密钥。019尚未批准；此次没有安装更新、真实项目制作或消费，不把24项离线PASS当作MiMo生成可靠性、真实图像判断能力、完整三格式质量或正式接受。

## 用户批准与执行起点 · 2026-10-16

用户明确回复“批准019，按授权稿完成一次”。原完整申请在mimo-production-019/approved-scope-019-original.md及authorized-019.json中按SHA保留；上文待批标签是准备时快照。当前019批准生效，仅其固定范围；原016未开始事实不变，不扩张为追加场景。执行前已备份103原文件，固定资源/签名/原框架/预算/仅MiMo/旧UNKNOWN通过，临时服务77793/60868已正常启动，尚未确认框架或派发模型。

## 实际结果与停止

019唯一场景已执行并结束：7真实派发/10工具、两页渲染及两图进入MiMo请求；第7次回复请求图检后edit，018控制按批准边界执行前拦截，新增16384预留/UNKNOWN保留。没有模型导出/UI三格式或追加场景。详见[mimo-production-result-019.md](mimo-production-result-019.md)；未用余额不授权补测。
