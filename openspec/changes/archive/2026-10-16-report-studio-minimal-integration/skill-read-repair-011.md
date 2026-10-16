# 随包技能读取与封闭诊断修复011

状态：离线修复和受影响回归通过；真实 Provider 0，安装/封装尚未执行。复用已批准方案、UI及就绪004，不新增审批角色。

## 证据与问题

010实际请求的绝对SKILL路径与固定随包文件一致，文件存在；项目根read边界拒绝它。该资源已由可信组合根通过loadHarnessResources装入技能目录，但原生read没有对应只读接缝。这是已确认的上下文障碍，不是008 INVALID_TOOL三分支的根因证明。010范围外工具的具体名称未保存，保持UNKNOWN。

唯一新增证据子目录：Mini既有engineering-intake-20261016根下skill-read-repair-011；before.json保存原源码、SDK和四个真实账本的字节身份。原010及008证据不覆盖。

## RS-SKILL-01 / AC-SKILL-01–05

1. 内置版仅允许读取可信组合根指定的ppt/SKILL.md，固定9688字节、SHA256 b62a10aeaa8cc58090f63d27c2b5ae04538d95c966eb958c2ce273989cf9ef39。只接受该绝对路径；不增加目录浏览、邻接文件、相对别名、任意外部路径或通用资源注册。
2. 保留原项目读写及工具准入；该技能不能通过write/edit修改。文件缺失、软链（含父目录）、硬链、内容变化或取消均失败关闭。资源错误只返回封闭代码，不含实际路径、内容或参数。
3. 在实际固定SDK与SessionHost的离线合成调用中，read能将原技能内容交还后续模型轮；不调用Provider。独立版走原执行环境。
4. 原工具定义、policyVersion、harness、模型用途和持久配置不变；使用修复前形成的合成同任务账本重开核对配置及未知预留不变。四个真实账本逐字不变；不核销2048/16384。
5. 诊断gate仅补充首个停止原因、阶段、派发序号及封闭工具标签：九个固定工具名或other。不得保存密钥、参数、未知名称原文、调用ID、提示/回复/文件路径；未知工具名、参数和ID仍由原SDK拒绝，不改写回复或重试。

## 工程影响决定

这是已批准随包专业资源的只读接线纠正，限制在私有Pi Adapter和隔离供应源码，不改变公有合同、工具schema、项目根可变文件权限、模型配置、harness字节或业务持久结构。通过分离只读资源与原env闭包保留write/edit原边界。维持既有policyVersion的依据是未增加任意文件能力，且固定技能本已进入同一批准harness；以工具定义及修复前后真实SDK任务配置相等为验收，不通过改hash、迁移、forceNextClaim或清账掩盖不兼容。若这些相等性不能成立，停止依赖实现并记录，不擅改旧任务。

## 验证及停止线

先保存实际SDK/SessionHost因果RED和诊断元数据缺失RED，再实施、类型/构建、受影响及全部供应离线回归。保留既有断言/负例，不用作者自测代替正式完整Change独立验证。skills invalid_metadata警告与010/008原失败保留，未确认前不归因或静默改元数据。

本轮不封装/更新安装、不启动试用服务、不修改MacBook、不读凭据、不部署、不发布Git。任何新真实Provider场景另列具体范围请求用户确认；010权限不复用。旧FAIL/UNKNOWN/NOT_PROVEN/NOT_RUN、许可、干净机、完整质量及正式收尾缺口全部保留。

## 实际结果 · 2026-10-16

- 因果RED：causal-red-001.log，33项中22通过/11失败。固定SDK/SessionHost实际SKILL读取返回soft file failure，封闭诊断字段缺失；原工具三分支及合法对照仍通过。
- 修复：私有skill-environment.ts只处理固定技能的精确绝对路径，固定字节/hash、no-follow/nonblocking单文件打开、父目录realpath、普通单链接、同句柄前后stat及取消检查；无通用资源列表。write/exec保留原env闭包，实际SDK edit在写回时permission_denied；普通项目read/write/edit正常。仅built-in使用该接缝，独立路径仍用原env。
- 实际SSE后续模型请求及原生持久toolResult都收到完整技能正文；正向/邻接与外部路径/更改/缺失/软链/父目录软链/硬链/取消/写入与编辑/工具定义相等全部覆盖。
- 诊断gate新增首个停止信息：reason、phase、dispatch、tool。reason封闭为cancelled、dispatch_limit、model_outside_scope、deadline、tool_outside_scope、transport_failure；tool只可能九个固定工具名或other/null。快照不可修改内部状态；不收密钥/参数/未知名称原文/ID/提示/回复/文件路径，也不读取inspector frames或scope。原SDK重复ID/名称/schema及全批次拒绝保持。transport错误仍原样交SDK处理，但不抄入新诊断；gate范围、次数和UNKNOWN处理未放宽。
- supplier-regression-003.log：9组供应套件104/104 PASS，0 FAIL/0 SKIP，原92项全部保留；root-source-unit-001.log受影响8/8 PASS。typecheck-001/build-001通过。当前完整canonical未重跑：先前未变组证据仅在原输入范围复用，本次不声称新完整canonical、required CI或最终独立验证。
- 修复前由实际SDK生成两类合成旧任务，修复后重开：任务configuration相同，未知账本逐字不变/16384预留保留；已结算旧任务可通过新read接缝继续。compatibility-before/after.json及持久合成工程保存。四个真实账本逐字未变，旧A2048、新010的16384未知未清理/退款/重核。
- 保留测试纠正：focused-green-001的edit夹具用了旧形状，改为固定SDK要求的edits数组；focused-green-002实际权限拒绝正确，但预期外层错误消息不符，改为同时断言permission_denied和原Host file operation failed cause。未改生产逻辑迎合该误期望。命令工作目录错误也保留command-cwd-failure-001；这些不替换旧业务FAIL。
- 87文件冻结aggregate e37b8ae1150fb6aef3ba813bb90be746b7a662390e0d1d04041a6b99883720a4，fixed-source-manifest-011.json及fixed-source副本保存并独立读回；原82中仅prepare-source.mjs变化，新增私有接缝与独立诊断/测试5文件。SDK及SKILL原字节未改，原010的8份固定原始结果按旧manifest独立回读一致。副本仅Mini持久保存，非Git交付或跨设备备份。

`invalid_metadata`告警仍保留；只读公开SDK实测skills结果仍包含ppt-report，同时返回该诊断。它未阻止本次固定资源read对照，不据此推断告警根因或改变元数据/harness。旧008 INVALID_TOOL的具体分支及010被拦工具名仍UNKNOWN，不能由本轮补造；真实框架/两页制作及页面截图没有新结果。

实际执行：Provider 0、安装/封装0、MacBook写入0、部署0、Git发布0。Mini现有native008安装不含011修复；本轮完成的是隔离源码/离线证据。下一步若需要真实MiMo复验，先准备含新候选身份、场景/派发/数据/停止条件的具体Provider授权范围；封装/更新Mini复用仍有效的安装授权，权限变化才另确认；010旧次数不复用。完整Change独立Validator、required CI、工程/产品接受及归档仍待后续完整候选。
