# 016整套临时控制离线复验018

用户授权用017新接缝完成016临时控制离线验证并准备新候选授权，当前Provider/部署/Git禁止。原分支work/mac-mini/report-studio-integration、HEAD1446276011917ec46b369eadaed40c059db46b34、安装manifest a58986f2a07eea1c2eb290b1bcdfb0b13b713e4668da2f722cb5c1d95c226c01不变。沿用规则b182d5d0…及有效方案/UI/readiness004；本次是已授权连续Mini工程，不重新冻结产品/UI。

## RS-TRIAL-CONTROL-01 / AC-TC

1. 仅验收组合导入tools/report-studio/trial-control.mjs，产品/安装/SDK/工具声明/不可变配置不改。创建时注入toolObserver及transport包装，绝不再改defaultTools执行器。无临时控制时沿用017默认自由行为证据。
2. 同一指定项目、一个main阶段；仅固定MiMo/16384请求。32物理派发、96工具准入（回包整批预检），首次派发后1800000ms；含恢复/辅助调用。到限不再派发/执行；SDK自己的计量可因被拒的准入多出一次未知预留，不能清零或退款。
3. read/write/edit/bash/render_deck/qa_deck/export_deck/look_page限定；首个异常、软失败/非零退出、硬QA错误、越界、取消、超时或新UNKNOWN后停止新准入，调用原停止并等待物理结束。保留原结果/参数/ID/SDK校验。诊断仅封闭原因/阶段/计数/标签/hash，不保存原参数、HTTP回包、密钥或思考。
4. page_01/page_02各一次look_page；图像成功且hash与后续模型请求中的图像匹配，缺图不计成功。第一次看图后不再改代码/重渲染；两图、QA结构两页及模型正常完成后方可UI导出。模型export_deck最多一次，三格式子集；UI三格式各一次，通过可信控制器前后检查与原业务policy.begin/finish限定。它不新增产品权限守卫或永久限制，不声称是OS沙箱。
5. 失败先于同批后效；截止时晚回复不得发布新工具。已开始的本地导出按原收尾等待完成，结果保留，不能声称撤销已写文件；新导出被拦。QA建议性flag保留披露，不擅自全升硬失败。图片语义/可读性和真实三格式质量仍需真实验收，不用合成PASS替代。
6. 实际安装内SDK/工具/Chromium，合成transport或注入SSE、默认外网拒绝；验证正向两页制作/逐页图像进入请求/模型导出与正常UI三格式记录，以及全部限制/失败/同账旧未知。原103文件/五预算/既存UNKNOWN逐字不变。

先保留旧016控制在新安装上的因果反例，再用新接缝最小修正。计数/时间使用可控时钟的等值边界和真实短定时取消共同验证，不等待实际30分钟。产品与验收控制身份分别固定；后续真实范围使用新的授权稿，原016批准不自动迁移。原失败/未知/未验证和最终Validator/CI/接受/归档全保留。

允许：本临时工具/离线测试及Change记录、项目板/能力证据；条件是只在原证据根trial-control-offline-018合成子目录运行。禁止安装更新、产品源码/SDK/权限/真实数据与凭据修改、真实模型及MacBook写入。本次不需重新封装017。


## 实际结果 · 增量041（2026-10-16）

**PASS_BOUNDED_OFFLINE_CONTROL，真实Provider0。** 017安装候选保持a58986f2…/22714资源；分支/HEAD不变，原89工程源逐项不变。本轮只新增临时验收工具和测试，不重新封装/安装，不改产品、SDK、声明、原配置/账本或守卫。未注入控制时的自由制作证据复用017，不新加产品预算。

固定`tools/report-studio/trial-control.mjs` SHA be308a7e59c6cf52e9e41dcd758d5c88d3b4e600eeb0969c6c93c98aadf16447；测试SHA 12c7ea3d40ed6de93055f1c06f49db499d868f3da1fb8dccee3f9c413e4c095f。最终源码及副本逐字/hash一致，日志control-final-011/exit0，**24/24 PASS、0FAIL/0SKIP**。使用安装内Node/SDK/Chromium，默认外网拒绝、只有准确loopback测试服务获准；实际MiMo序列化和SSE以注入fetch替代，未使用真实密钥或Provider。没有inspect frames/scopes、隐藏重试、SDK修改或公开defaultTools执行器替换。

| 接受点 | 实际证据 |
| --- | --- |
| AC-TC1/2范围与上限 | 创建时observer；模型/端点/16384校验；实际32派发允许、第33准入不外发；96工具允许、超限回包整批不执行。SDK拒绝准入产生的第33计数/未知预留保留。 |
| AC-TC2截止/取消 | 零时钟起点的1800000ms等值边界；晚模型回复不得写；真实短定时取消在途注入transport及实际owned Bash子进程，sleep后的shell写入和同批下一工具均不存在。不是等待实际30分钟的墙钟测量。模型结束后截止仍保护UI导出。 |
| AC-TC3首错/未知 | read软失败、Bash非零、QA/渲染失败及页数错误，均阻断后续效果；原SDK名称/schema/重复ID仍拒绝，不修写回复。原业务准入拒绝也关闭临时控制；新UNKNOWN不重试，旧UNKNOWN不核对。注入503只有一次wire，无HTTP/恢复重试。 |
| AC-TC4图片和顺序 | 两页各一次look，第三页/重复/缺页/无图/不匹配hash不得通过；原JPEG hash与后续SDK messages.images匹配，且注入MiMo HTTP序列化确有两张图。第一次看图后写/edit/bash/重渲染拒绝；提前/重复/越格式导出拒绝。 |
| AC-TC4单场景/UI导出 | 原业务policy.begin/finish在可信创建组合中收紧；仅目标main一次，拒绝独立image/其他项目。UI导出必须由控制器一次格式许可配对，未配对/重复/本地失败之后的格式不执行。控制不替代原权限或持久状态。 |
| AC-TC6完整合成正例 | 正常UI确认两页，实际SDK执行5write/render/qa、两look、一次模型export（共10工具），4次注入MiMo派发；之后UI三格式各一次创建记录/实际下载。三份下载与应用导出文件/记录hash一致；PPTX解包2页、PDF2页/数字和边界文字可提取、HTML浏览器本地2页/数字与边界文字可读。服务按原ownerLost/正常等待收尾，测试退出0，当前自有进程为空。 |
| AC-TC6同账/保留 | 同task/nativeSession/不可变配置恢复；旧2048+16384合成预留仍18432，新消费只追加。全部103真实数据/五预算、旧策略/owner库逐字/hash不变；未启动真实项目验收或读取密钥。 |

正例输出：PPTX51090字节/SHA3f08c928…，HTML707/SHA697bde88…，PDF64230/SHA45879a1b…；完整hash在正例exports-readback.json。QA建议digit_guard flag确实保留，没有全升硬失败或静默删除。PDF文本提取出现兼容汉字（如适⽤边界），以NFKC比较验证语义同时保留原文件；不宣称所有字体/复制语义或实际PPTX/PDF显示等价已通过。两页图是agent-html来源，仍不是Keynote实际PPTX截图。

### 原失败和新离线失败保留

原016控制在新安装上的RED再次复现：公开包装后同批write仍发生，作为原失败保留，不追认016为PASS。新创建接缝的初始用例GREEN。control-matrix001/002错误地把原native read(path=3)视为SDK schema必拒；实际SDK准入后才在执行时软失败，先前write已发生，控制从该实际首错处停止。没有把它改称原008的根因或削弱首错后禁止后效断言；改用工具明确声明的expected_slides类型负例验证SDK schema，原read反例和日志保留。

004夹具默认网络拒绝也拦loopback bootstrap，修正为只允许准确本地测试origin，其他全拒；005/006等待了错误的对话视图，补上正常成果页签操作。006同时给出了原业务准入失败未关闭临时控制的因果RED，最小补齐后GREEN。007读回错用了HTTP摘要中未提供的artifact_path，改读同一export_id的应用原生记录，再逐字/hash核对下载。008为当时21项全通过；新增文件检查后的009兼容汉字比较失败、010预设HTML class失败均保留，分别改用NFKC和实际DOM两页检查，不改产物或产品。一次只读codesign预检误指向Contents目录，纠正准确.app后完整签名校验通过，不重签。011最终全24通过；测试期间全部源/合成文件/日志保留，不用最后PASS覆盖历史失败。

### 身份、收尾与限度

实际安装完整22714资源/签名再次读回不变，原89工程源及103真实文件/五预算逐项不变。配置元数据revision3/ready/仅MiMo，只读元数据而没有调用native credential helper；旧2048/01016384及UNKNOWN不变。当前项目仍015待确认框架/4模型4工具/4375入587出/预留0。原B/008/010/013/014/015/016/017全部失败、UNKNOWN及未验证项原样保留。

测试正例耗时约92.6秒，包含三次正常浏览器下载及收尾；临时控制没有超时。未将测试等待时间归因为真实产品性能问题或声称优化完成。所有本轮自有测试进程已结束，原用户工作台未触及；原生日志/合成文件保存在同一Mini持久证据根，非Git保存或跨机备份。部分较早离线迭代未逐次冻结完整脚本快照，原日志/输入夹具和Codex工具历史保留；最终011已在运行前固定两份源码及hash，不伪造早期源码身份。

24项合成PASS证明范围控制和原边界上的可执行路径，不证明真实MiMo会按要求制作、读图判断正确或真实导出质量。真实新候选仍必须通过[申请019](mimo-production-authorization-019.md)获用户批准；原016未开始/未消费事实保留但权限不自动转移。019尚未批准，当前不启动真实验收服务或调用Provider。继续保留许可/干净机/MacBook限定接受/较大图/主备/真实物理中断/完整质量及最终独立Validator、required CI、工程/产品接受和归档。C5-09仍IN_PROGRESS、正式接受增量0。
