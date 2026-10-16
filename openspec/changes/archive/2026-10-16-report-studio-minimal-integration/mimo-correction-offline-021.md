# 021离线实现、冻结及真实执行前停止

2026-10-16 · **OFFLINE_VALIDATED_FOR_PROPOSED_022 / 原021严格正例FAIL保留 / 真实场景未开始。**

用户明确批准“021全部范围，先离线通过并冻结，再实测一次”。已完成可授权的临时控制工程、离线诊断和固定证据；实际发现正常核对会计入本地activeMs，与021“全部计量不变”不符，因此没有对真实019核对或调用Provider。需用户决定[022单项修订](mimo-reconciliation-amendment-022.md)，不能把本轮技术通过当成原条件已满足。

## 实现范围与因果证据

仅修改 `tools/report-studio/trial-control.mjs`，新增 `trial-correction-control.test.mjs`；原018的 `trial-control.test.mjs`逐字未变。没有改产品、供应源、SDK/锁、安装资源、认证或Task配置。

RS-TRIAL-REV-01 / AC-REV1～7来自020/021边界：

- 先用安装内原SDK复现RED：正常第二轮注释edit被post_check_write拦截；同批越界计划前的页edit已经生效。red-001两项FAIL及原源/夹具保留。
- 可选修正模式最多两个版本周期，每周期8次四个既有页文件write/edit；显式render→QA→两页look→新图进入请求。第三周期、额外渲染/QA、重复或第三页、跳步/旧证据导出、Bash/路径越界均在后效前拒绝。
- 修改开启新周期即清除旧结构/图像/投递资格。按文件hash及执行顺序绑定PPTX/HTML，防止未观察变化；锁住deck.mjs/框架/材料等输入。本固定合成草稿的可见PPTX/HTML文字按忽略空白的原文保留，允许注释和排版修正；若等价改写触发这一保守检查会停止，不暗中放宽。插件日常自由制作不使用此临时模式。
- 新look通过内存中的工具结果关联、历史出现次数与当前图片hash证明进入本周期后续请求；相同JPEG可以有效重检，但旧同hash图片不能顶替新结果。额外证据不保存调用ID/参数原文，只有周期、工具/页标签、hash和封闭原因。
- 最新QA须解决headline问题；原建议flag保留。模型正常完成后，主Agent核对最终两页四项结论/当前文件，显式释放本地导出许可；三格式正常UI各一次配对保存/下载，导出前后再核对版本。该内部控制不是新产品界面或用户重复确认。
- 原SDK工具名/参数/ID、软失败停止、32派发/96工具/30分钟/16384、原授权/计量、单main和UNKNOWN保留。没有修写模型回复或安装新的执行器。

## 真实验收前发现的权限差异

严格集成integration-002：合成019形态的旧run已物理结束、usage_known=false/预留16384；正常UI核对调用原SDK本地abort，activeMs由715→730，**增加15ms**。六项其他计数完全不变，但“全部计量相同”断言FAIL。没有将其忽略后回填PASS。

后续诊断另设明确的 `RS_DIAG_LOCAL_ACTIVE_MS=1` 模式，只证明拟议022边界的技术可行性；默认严格模式则验证拒绝这种增量、保留原unknown且不启动新main。原失败的正例、输入源码和结果完整留存；新的严格负例PASS不等于原严格正例PASS。原生本地核对最多两次abort/检查，原30000ms控制上界保持；新临时guard可在仅拟议022模式接受合计≤60000ms的非负实际增量，并逐项验证模型/工具/输入/输出/预留/resourceUnits、配置及limits不变。它不写或退款任何预算。

真实019仍保持state=unknown、physical_settled=true、usage_known=false、active=false/预留16384。没有为了继续实测点击真实“核对运行状态”、换Task、清账或直接改数据库。

## 适用离线结果

| 证据 | 本轮结果 | 证据含义 |
| --- | --- | --- |
| 原默认018控制 | 24/24 PASS | 原断言及默认行为保持；final-001固定同一控制/default测试字节 |
| 当前新模式与核对守卫 | 12/12 PASS | final-003-diag；**仅拟议022例外**的合成技术结果 |
| 严格021边界负例 | 1/1 PASS | final-002-strict；原生activeMs增加时停止，Provider0/新main0 |
| 原021全部计量不变正例 | **FAIL保留** | integration-002，不升级为通过 |
| 无022批准的实际启动组合 | 预期拒绝PASS | 退出1，准确因authorized-022.json缺失，在凭据/服务阶段之前停止 |

没有新增SKIP/TODO/only，也未删改原018测试。当前12项采用最终同一控制字节；原24项的控制/default测试hash与当前逐字一致。final-001曾整组36PASS；随后仅完善严格负例的测试表达，再以当前测试源完成final-002-strict及final-003-diag，保留每次实际输入身份，不冒充旧日志验证后来的测试字节。

拟议022整合正例：实际安装内SDK/Chromium、注入MiMo SSE、原正常UI，先用3次注入请求/4工具建立019形态UNKNOWN，再正常UI核对（真实Provider0）；保留原Task/nativeSession/配置/limits、旧16384及usage_known=false，随后8次新增注入请求/11工具完成两个周期、4张新look及一次模型导出，正常UI三格式实际下载/逐字hash读回。第7个新序列化请求中保留历史及两轮新图，证明没有仅凭tool名字/元数据判断送图。

最终合成核对activeMs增量6ms；前序诊断15ms/8ms/15ms均保留，不归一化成固定值。新main可单独usage_known=true，累计旧16384依然UNKNOWN。下载PPTX51064字节/2页、HTML646字节/2页、PDF47039字节/2页，本地文件读回通过；这是合成执行链证据，不是MiMo真实图像判断、Keynote原生产品质量或Provider可靠性验收。

## 固定身份与保存

- 控制SHA `50f14bbe2d0f7c0733698184d10c4b4eb502058873b20065f902436a9d87e0f6`。
- 原默认测试SHA `12c7ea3d40ed6de93055f1c06f49db499d868f3da1fb8dccee3f9c413e4c095f`，保持原018字节。
- 新修正/核对测试SHA `734eb0795e7eb4dd5e0b1c256b06936cb01926636e63588399f523c56287bcee`。
- 原根 `.../engineering-intake-20261016/mimo-correction-021/scope-freeze-022.json` SHA **d997cf8f3158a31183e0b5793c7e58d88aae36800148d2e88aaf0e4a0640cf06**；冻结时 `user_022_approved=false`。控制/测试/启动组合、022待审文本快照、原项目/operation输入、完整日志/命令回执均有可读副本/bytes/hash。准备的session-021-after-022.mjs须同时匹配021原批准、另行022批准及该冻结身份，当前未启动。

分支仍 `work/mac-mini/report-studio-integration`，HEAD `1446276011917ec46b369eadaed40c059db46b34`；Mini-led规则提交b182d5d0…及原方案/UI/readiness004保持。017安装manifest a58986f2…的22714资源/签名、89原工程源完整核对不变；112真实普通数据文件/五预算/策略库以及019全部历史证据逐项不变，真实材料、框架、草稿和凭据配置未改。

本轮真实Provider0、真实试用服务启动0、真实核对0、凭据操作0、安装0、部署0、Git0、MacBook0。Node/Chromium/依赖均使用现有安装；测试服务和子进程正常收尾，只有隔离合成数据产生原生日志/消费样本。

## 新旧失败与未验证

- integration-001未等待UI就读取许可，结果缺字段，原响应未存、具体状态仍UNKNOWN；增加界面就绪等待、响应200断言和保存后通过，不归为应用403缺陷。
- integration-002严格activeMs相等FAIL按前文保留，是本次真实停止原因。
- integration-003夹具遗漏被锁定的materials.json，原SDK新run在transport前STATE_FAILED；补齐合成夹具并等待实际chat响应后完成后续诊断。旧异常和源码/数据不删，未改真实项目或放宽文件检查。
- 三处路径猜测读取失败（错误edit实现位置、旧Pi依赖路径、错误UI文件名）保留，按MCP图/实际import/声明解析到现行实现；未安装或升级依赖。原skill invalid_metadata告警原样保留。

原019范围停止和edit意图UNKNOWN、新16384、A2048/01016384、008/010根因UNKNOWN以及所有旧失败、未知预留/未验证全保留。实际物理中断、较大图、主备、许可/私有SDK再分发、干净机、MacBook限定接受/缺编辑文件、完整质量等价、完整候选最终Validator/required CI/工程产品接受及归档仍未完成。没有以作者自检替代独立验证；本次只改临时验收工具，复用017不变产品范围的供应115/根19/type/build/宿主2证据，未声称重跑canonical全量或CI。C5-09仍IN_PROGRESS，正式接受增量0。

## 下一允许动作

请用户审核022唯一activeMs修订。确认前保持真实019/账本不动、Provider0；021批准和唯一场景未开始保留。确认后复用仍有效的离线结果/原方案/UI审查，先核对冻结身份和真实起点无漂移，再继续原021一次续作；不新增场景或重新安装。若不批准，保留当前阻塞，不绕过原生核对。
