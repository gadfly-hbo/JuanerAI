# N01/N02 首试 UI 合同可点击附件（修订005 · 待用户审核）

固定输入：`d89f7d45f6c5ecab7440d66e4747ee3ef6625826`。从该对象的 `docs/planning/2026-10-03/pc-task-experience-prototype-v0.2/` 复制 HTML、CSS、需求共创及任务界面源码后作限定差异；旧 Demo、生产实现、规范、工程状态均未修改。

本附件是产品准备草案，不是 UI Gate PASS、Product Input Freeze、工程接收、真实运行或产品验收。配套范围和正式文字以父目录产品输入及 UI Contract 为准。

## 查看

打开本目录 `index.html`。它是离线静态页面，不依赖服务器、安装、Provider、API 或构建。支持从仓库现有静态预览中查看本目录；本次没有启动服务或打开真实产品。Logo 引用仓库现有 `apps/desktop/assets/juanerai-logo-slogan.png`，须保留仓库相对目录。

页面始终标示“UI合同演示 · 非真实执行”。资料、报告、授权、进度、保存、恢复与下载状态全部为合成演示；只存本页内存，真正刷新／关闭会重置。本地固定关键词不代表模型理解能力。本原型没有文件选择器、真实读取、上传、模型、数据库、执行器、持久化、下载或遥测。

## 复用与差异

沿用亮色中性底、橙色重点、原 Logo 与 slogan、简单／专业模式、项目／任务双层导航、原 surface/dialog/表格/框架组件。CSS 原文件字节序列完整保留，仅末尾添加必要的换行约束；没有新增品牌、tokens、字体、依赖或第三套布局。

使用 `saas-product-ui-system` 约束既有组件复用，`product-ui-redesign` 仅做差异检查；既有产品视觉优先，未执行新的视觉重设计。没有浏览器截图，不能宣称视觉验收已通过。

首试默认核实总体变化，已知用途和期间直接进入简要方向。保留按需深入讨论，不预设下降或原因。首试报告／证据只有 M1；M2、完整专业模式、修改／重算、正式决定／事前预期、Fork／Subagent 明确归 S1 后续且未开放，不以假响应冒充可用。

沿用既有 Xiaomi Token Plan CN／MiMo 2.6 Pro。用户新决定：单任务累计调用数、累计 Token、累计运行时间暂不设消费上限；仍逐步保留使用和未知在途记录、单次上下文／输入输出保护、传输超时／取消、授权／来源核验、显式停止和人审收口。到待审／待输入停止点，不无限循环或永久后台运行。

同一失败模型操作最多自动重试 1 次，保持同 Provider／模型／有效配置、任务授权、目的、获准材料和来源。UNKNOWN 或原物理槽未释放先等待读回；成功只读回，不能并发补发。停止、失效、权限、输入、材料、资格错误不自动重试。自动次数属于原操作，重开／单次尝试不刷新；本附件只在内存示意，不证明生产持久化。

模型调用权限等经确认并在产品配置生效后，后续 Change 复用，不重复询问；仅用户明确要求变更才调整。每任务后台 grant／consent／source 绑定与单次有效性仍检查。当前附件未使实际产品配置生效；材料按用户当前决定检查；环境有效性与首试观察安排仍待核对，没有执行真实调用。

## 正常点击路径

1. 点“核实两期会员复购与复购收入变化”，或输入受支持问题。复购收入从第二笔有效订单起计，不代表全部销售额。
2. “查看分析方向”展示选定业务文字、接收方／模型建议、用途、累计使用／一次自动重试及材料边界。取消不发送；“演示：仅梳理这段需求”只模拟文字授权，不使实际产品配置生效。未经适用授权，正式产品不得先把问题或追问发给模型。
3. 简要方向直接沿用示例中的用途／期间；必要缺口就地补充。可进入深入讨论或直接调整框架。
4. 确认方向后添加合成会员.xlsx（两张工作表）、订单上期.csv、订单本期.csv；可再加两期订单补充.csv 或经营说明.md。按资料角色和两期覆盖检查，不按固定文件数；缺来源等待。选择后的受信本地画像不调用模型或执行生成代码。全空阻断与单期零分母证据不足仍分开。
5. 一次任务级模型材料／代码边界覆盖：CSV／XLSX 的普通结构给模型，明细留本地；普通文档／图片可按有效配置及任务材料范围直接提供文本或图片，不强制先摘要或生成代码。混合资料按类别覆盖，不逐文件／逐字段勾选；凭据禁发、敏感内容和越界明细阻断，不靠文件扩展名豁免。已核验 M1 总体聚合／可信摘要可用于报告，普通文档不自动成为可信量化证据。
6. “演示：按有效任务授权开始”后自动推进结构理解、表格 Python 生成、隔离转换、源提取／规范转换资格，再接既有 DuckDB M1 与固定独立 Python 核验和报告。普通文档作为同任务模型上下文，只有表格明细走代码链。不逐步骤或逐脚本审批；代码纠正与模型请求重试独立，各最多 1 次。报告仍不暗中运行 M2。
7. 查看同一任务的证据／口径／历史；专业模式只是首试按需检查。确认前展示精确待审版本、期间／范围、有效事实、有依据的收束建议及整体效果。人的结果为“确认限定分析及收束”或“保留待补证／暂不判断”；取消、未采纳、无法计算不伪造正式决定。

本轮 M1 不制造策略比较候选：正常上升／持平只核实总体事实，不能验证原因或策略效果，因缺少经营方案比较证据而保留无方案偏好的不足收束。单期零分母明确该期复购率和两期率差不可计算；可以确认有限核验事实与这项不足，但不得显示总体比较成功。收束建议来自本轮事实和受限方法，不以“暂无决定”代替证据不足理由。

“仅确认分析”保留旧整体语义：一次演示接受精确来源 Finding、保存合法收束、将任务完成并追加新的 final 报告，原待审版本不变；旧 grant 关闭、累计使用保留，没有 Decision／Expected／行动。界面不引入 Closure 术语审批节点，也不要求逐条勾选。

## 审核情境

每页“审核演示情境”可载入一个新的合成任务快照；旧任务仍在本页列表。这是审稿工具，不是拟交付的产品操作。

| 情境 | 可审核行为 |
| --- | --- |
| 正常 M1／上升 | 自动推进后只有核验一致才生成待审报告；后端保存与浏览器副本分开 |
| 下降前提未成立／持平 | 不制造下降，不运行分组归因 |
| 缺订单等待 | 已选会员不能开始计算；补订单后才检查资料 |
| 两期筛选后无有效行 | 不可计算、无报告；资料面板可重新选择合格演示资料，不扩成任一会员字段为空就阻断 |
| 合格输入／单期零分母 | 可计算事实已核验；零分母一侧显示不可计算，两期变化证据不足；可保留待判断或确认有限事实与明确不足，不生成 0%、下降或总体比较成功结论 |
| 独立核验失败 | 没有可信发现、成功报告或接受按钮；提示修复对应问题，不进入 Provider 重试，也不靠重跑掩盖 |
| 无法计算 | 保留任务范围、解释失败；不产生分析成功 |
| 报告解释失败 | 原有失败快照：自动重试 1 / 1 已用完；已核验事实可查看，等待用户处理，不通过恢复刷新次数 |
| 授权失效 | 原累计和在途保留；先读回，检查有效产品配置和当前任务绑定，不因 Change／尝试重复批准模型权限 |
| 断连只读 | 最后状态不当作当前真实进度；写入按钮禁用，重连只读回 |
| 停止请求结果未知 | 尚未确认已停止；禁止重复停止／继续，先读回停止状态；确认停止后仍保留原累计与在途 UNKNOWN，不自动续跑 |
| 已确认停止后重开 | 原累计和在途 UNKNOWN 不清零；先读回，再“检查授权并继续”，有效授权可复用 |
| 服务重启 | 不自动新建执行或续跑；读回原状态后由人检查授权并继续 |
| 另页只读 | 只读按钮与事件守卫阻止写命令；明确 Desktop 不能同时写同一项目 |
| 下载失败 | 后端报告仍保留；客户端显示演示失败，不伪造落盘回执 |
| 确认结果未知 | 提交后禁用重复确认并有状态守卫；只能读回结果，不重复提交 |
| 收束内容缺失 | 原待审报告与事实可看；合法内容未齐，禁确认／Completed／final；保留待审或补证，直接状态函数也拒绝 |
| 模型解释：一次自动重试成功 | 同一失败操作自动使用唯一机会，不重算；成功停在待审报告 |
| 模型解释：一次重试后仍失败 | 唯一机会用完，核验事实保留、报告未完成；重开／重复渲染／继续不刷新次数 |
| 模型解释：请求未知先读回 | 保持原物理槽与 UNKNOWN，无并发补发；读回失败且释放后才使用一次机会，读回成功不重试 |

“演示刷新：只读回”不发送新建、执行、停止或确认命令。真实页面刷新会清空原型内存，因此此控件只是将产品要求变成可检查的交互表述。断连场景的读回示例明确为后端原已停止状态，不推断断连等于停止。关闭网页不等于停止的提示在任务入口与授权处可见。

## 实际检查（2026-10-04）

- 两个 JavaScript 文件的 `node --check` 通过。
- 第一轮 Node VM + 最小 DOM 桩通过正常路径、已知用途／期间简要入口、计算／核验／解释失败、全空／缺订单、有效授权复用、失效授权、UNKNOWN 不清零及确认未知禁止重复提交检查；当时覆盖 14 个情境。
- 本次最小修正增加单期零分母与停止请求结果未知，合计 16 个审核情境；同时给 change 事件增加只读／断连守卫，防止 radio/select 改变任务。原口径澄清保留待补说明，移除未接通的确认按钮。
- 修正后两个 JavaScript 语法检查通过；本轮 VM 通过正常 M1、精确全空阻断、单期零分母有效事实与待判断、停止请求未知的禁重复／读回／累计记录、只读及断连 radio/select 守卫、无死口径按钮，以及 16 个情境双模式渲染检查。
- 本轮首次零分母检查的文本正则误匹配解释性文案“不能……写成 0%”而失败；改为检查指标单元格和指标数值后整组重跑通过，保留禁止伪造结果的断言。未因此修改业务判断或弱化指标检查。
- 静态检查未发现 fetch、XHR、WebSocket、FileReader、文件 input、localStorage 或 sessionStorage。CSP 保留 `connect-src 'none'` 和 `form-action 'none'`。
- 与固定对象比对确认 CSS 以原样完整源文件开头，仅有尾部必要换行规则。Logo 五层相对路径指向已存在的同一仓库资产。
- 第一次 VM 检查末尾的 CSS 比对因检查脚本 `execFileSync` 参数形状写错而退出 1；修正为 `{encoding:'utf8'}` 后整组重跑通过。该失败不是产品执行证据，未隐去。

### R1 整体人审修正的实际检查

新增收束内容缺失后，当前为 **17 个情境**。两 JS 语法检查通过；本轮 VM 以下检查首轮全部通过，没有浏览器检查：

| 对精确来源版本的结果 | 实际检查 |
| --- | --- |
| 合法确认 | 正常上升、持平、单期零分母分别确认；接受源 Finding、保存有理由／有依据／无偏好的收束，Completed，追加一个 final；源待审报告字节表示不变，关闭旧 grant 且 usage 不变 |
| 取消／补证 | 确认面板取消（含关闭处理）或转补证后，不接受 Finding、不保存正式收束、不 Completed、不追加 final；直接 submit 也无效果 |
| 内容缺失／来源漂移 | closureMissing、理由缺失、依据缺失、不合法偏好、期间改变、原文改变均阻断整体效果；按钮与状态函数均检查 |
| 未知结果读回 | 绑定同一原待审源与收束，禁重复提交；读回只应用一次相同整体效果；再次读回不追加，源版本不变、usage 保留；源收束漂移时继续未知，不伪造完成 |

17 个情境简单／专业两模式渲染无 JavaScript 异常。静态检查确认所有内置金额标签为“复购收入”，口径说明从第二笔有效订单计，未新增网络、文件或持久化能力。上述状态与对象均为离线演示，不是旧业务生产实现或真实原子性证据。

复审前状态文案限定修正：最终报告先展示“本轮确认／收束（已完成的当前效果）”，再展示“原待审报告原文（保留当时的阶段表述）”；历史原文中的待审措辞不充当当前状态。确认摘要只显示版本、两期与 M1，内部报告／范围／发现标识置于按需来源详情。`app.js` 语法检查及正常、有限事实、未知读回三条限定 VM 检查通过；逐字核对最终报告历史段与源原文一致、旧版本不变、主摘要不暴露内部标识。未增加视觉或浏览器验证。

### 新消费／重试／跨 Change 复用决定的实际检查

当前为 **20 个审核情境**，原 17 个及整体人审效果保留。本轮两 JS 语法检查通过；限定 VM 首次运行通过模型解释一次重试成功、一次后失败、UNKNOWN／占槽禁止补发、读回成功不重试、同操作重复渲染／重开／继续不重置、停止及授权／来源／材料／输入／配置／资格无效时不重试。计算和独立核验失败、人工确认 UNKNOWN 保持独立，旧解释失败明确为机会已用完。正常整体确认、未知读回一次完成、原待审版本不变与 closureMissing 阻断检查通过；20 个情境双模式渲染通过。

这只证明离线状态模板及守卫，没有验证生产逐步计费、重试次数持久化、真实超时／取消、物理执行槽或跨 Change 产品配置复用；没有浏览器、服务、Provider、业务文件、网络或持久化操作。上述作者首轮检查当时通过；其未覆盖的迟到成功问题由随后父 Agent 的独立负例发现，见下段。上文历史检查失败原样保留。

### 迟到成功负例与最小修正

父 Agent 独立 probe 退出 1：载入 `modelRequestUnknown` 并等待演示回调，点击停止得到 `stopped`，再触发 `settleModelSuccess`；旧附件实际变为 `ready` 且追加报告，而要求是保持 `stopped`、零报告、自动重试次数为零。原 probe 与失败输出由父 Agent 留存；这是此前作者检查通过但遗漏的真实附件缺陷，未改写 Review001／002 历史。

修正只增加原模型操作的发布守卫与开始时点绑定。迟到成功可结算原请求、释放物理槽并保留累计使用及原来源绑定；显式停止、服务重启、授权失效、来源／材料／输入／配置不匹配、只读／断连或停止结果未知时不发布报告、不改变原任务阶段。被禁止发布的旧成功固定保留为不可发布，后续恢复或重新检查不能借 succeeded 分支复活它，也不通过重算补救。

修正后两 JS 语法检查及限定 VM 首轮通过：原样父 probe、停止／重启／grant／来源／材料／输入／配置／范围和原文／开始时点／stopUnknown／只读／断连负例，验证只结算、不发布、不复活且原累计与绑定保留；原模型解释三路径、成功不重试、次数不刷新、整体人审（合法／取消／缺失／未知读回）及 20 情境双模式回归通过。该结论仍仅为离线 VM，不是浏览器或生产恢复验证。

未运行：浏览器点击／截图、键盘焦点与缩放、真实上传／计算／Provider、跨进程保存与崩溃恢复、多标签并发锁、真实下载回执、模型质量、真实权限与预算验证。VM 只证明本离线演示的状态分支和模板能执行，不能替代真实浏览器或工程验证。

残余风险：新提示较长，窄屏／200% 缩放及 dialog 焦点需后续浏览器检查；合成快照不能证明真正的后台恢复和多页面排他写入；示例口径不是新业务合同；自由文字识别范围有限。未经用户审核，不提升为 UI 接受或生产能力。

## 修订005：多源、两条材料路径与代码准备回放

本节记录本次作者实际检查，不是独立 Review、用户 UI Gate 或工程验证。用户“按推荐采用”后新增两路径直接决定：仅 CSV／XLSX 结构供模型、明细本地处理；MD／PDF／DOCX／DOC／PPTX／PPT／常见图片直接读取，可在有效配置和当前任务材料范围内将文本内容或图片提供给模型。不再沿用“全部格式必须先本地代码转换／正文图片一概不外发”的旧建议。

选择资料授权受信同机本地准备；现有有效配置和本任务材料覆盖检查在外发与生成代码执行之前，一次按类别说明，范围内自动复用。隐私按内容判断，凭据密钥禁发；将 CSV 明细变成 PDF／图片不会豁免边界。普通文档内容是解释上下文，不因模型读过变成已核验量化证据。首试 M1 仍消费 CSV＋XLSX 的规范数据链；其他格式读取、图片／旧 Office 兼容在本批／S1 接通，当前没有真实读取能力，也不暗换模型。

### 新增入口（原20情境保留，现30个）

从“审核演示情境”选择以下合成快照：

| 情境 | 检查点 |
| --- | --- |
| 表格＋普通文档混合资料 | 三表格源＋合成 MD；查看材料，区分表格本地代码与普通文档直接内容 |
| 普通文档敏感内容阻断 | 尚未外发、无代码操作；可排除文档，再检查剩余来源，不新增逐文件审批 |
| 代码隔离策略拒绝 | 网络请求被分类拒绝，不执行、不自动纠正 |
| 资料无法解析 | 本地检查失败，无模型结构理解、无代码操作 |
| OCR 提取不确定（S1 边界） | 当前读取未接通，诚实报缺口；不冒充可信数据或切换模型 |
| 字段关联真实歧义 | 只询问订单关联会员编号还是客户编号；回答后原操作继续，无逐字段表单 |
| 代码准备：唯一纠正成功 | 同一操作受信分类诊断，唯一纠正后资格通过，再进入 M1 |
| 代码准备：唯一纠正用尽 | 1 / 1 后停止，重开／继续不补次数或换标识 |
| 本地代码执行未知先读回 | 不重复执行；读回原成功后再查资格，停止后迟到成功不发布或复活 |
| 资料准备中来源变化 | 原操作失效，不纠正、不换标识重跑、无可信报告 |

“处理依据与模型材料”按需显示结构、来源角色、工作表、两条材料路径及三层可信状态。表格源提取、规范转换、指标复算不混同；DuckDB／独立 Python 一致不能证明原始提取正确。新建本地项目入口仍只建页面内存对象，明确不创建目录。

### 作者静态／VM检查的实际结果

修订005第一轮（两路径追加前）两 JS 语法检查退出0；Node VM 首轮输出通过：三源授权链、隔离拒绝、纠正成功／用尽、未知／来源变化、必要歧义、无法解析／OCR、停止后的迟到代码结果、整体人审、旧模型重试，以及28情境双模式渲染。

两路径追加后的限定 VM 整组退出0，实际输出：

```text
PASS actual click path: missing period -> 3 sources -> local-only inspection -> single task authorization -> M1
PASS 2/3/4/5 sources: role + period coverage, no fixed file-count gate
PASS isolation/source change/UNKNOWN/correction success+exhaustion; no fresh operation
PASS one genuine relationship question, same operation continues
PASS mixed direct-document path, sensitive-content exclusion, unreadable/OCR boundary
PASS 13 late-code-success authority/source/stop/restart negative fences
PASS unknown success readback once; stop preserves consumed correction and cannot revive
PASS human whole-review effect, source immutable, unknown idempotence, missing-closure block
PASS original model retry and stopped late success
PASS 30 scenarios x 2 modes + materials/data dialogs
PASS static no network/file/storage APIs; original CSS prefix and CSP retained
```

测试使用 Node VM、最小 DOM 桩和手动定时器队列，仅执行这两个离线原型脚本。2源场景是会员工作簿＋覆盖两期的补充订单，3源是默认组合，4／5源分别增加补充订单／普通文档；没有 `files.length===2` 准入或发布条件。13个迟到代码负例覆盖停止、重启、grant失效、授权过期、来源／材料／输入／配置、只读／断连、范围／文件变更和停止结果未知。

改稿期间一次补丁生成脚本在内存字符串匹配时退出，未调用文件写入；没有影响候选或隐去检查失败。随后将本地解析／敏感材料问题从代码操作记录分开，避免授权前被误读为已创建生成代码操作；此小修正的实际复检见下文。

未运行浏览器点击、截图、焦点／缩放或视觉验收；未绕行已有 file 协议安全限制，未启动服务。没有读取真实资料／凭据，没有网络／Provider、Python执行、生产数据处理、持久化、实际费用或平台隔离验证。本页内存回放不等于生产真实多源转换、模型读图能力、工程 PASS 或用户 UI Gate PASS。CSS 本轮未修改，保留旧品牌、布局、组件与完整原始前缀。

### 停止恢复与最终限定复检

父 Agent 指出最初停止后的准备操作只有拒绝恢复，缺少合法“显式继续”路径。最小补丁保留原操作身份、来源绑定和纠正次数：从代码执行未知 → 停止 → 读回原执行成功仍保持停止、无规范数据／报告；用户点“检查授权并继续”后重新核验授权与来源，仅继续未完成的资格检查，不再次生成或执行原代码。读回失败、来源／权限失效、隔离拒绝及纠正用尽不借恢复重新执行，保留待处理。这里不声称解决所有生产中断恢复。

最新两个 `node --check` 退出0。最终限定 VM 退出0，实际输出：

```text
PASS actual click path: local-only inspection before task authorization
PASS role/period gates accept qualified 2/3/4/5-source combinations
PASS isolation/correction/UNKNOWN/source-change and genuine ambiguity
PASS direct-document materials, content-risk exclusion, local failures create no code operation
PASS 13 late-code-success negative fences; readback never republishes stopped output
PASS explicit stopped-success recovery: same operation/binding/count, qualification only; failed/invalid recovery refused
PASS original review/failure/model-retry/stopUnknown/read-only regression
PASS 30 scenarios x 2 modes; no count/network/file/storage gate; CSS prefix/CSP preserved
```

可复制的完整复检命令（在仓库根目录运行；不读业务数据、不连接服务）：

```sh
node --check docs/planning/2026-10-04/browser-first-n01-n02/clickable/app.js
node --check docs/planning/2026-10-04/browser-first-n01-n02/clickable/discovery.js
node <<'NODE'
const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict'),cp=require('node:child_process');
const base='docs/planning/2026-10-04/browser-first-n01-n02/clickable/';
function H(){
 const timers=new Map(),listeners={},els=new Map();let serial=0;
 const el=id=>{if(!els.has(id))els.set(id,{id,innerHTML:'',value:'',open:false,classList:{add(){},remove(){}},addEventListener(){},showModal(){this.open=true},close(){this.open=false},focus(){},closest(){return null}});return els.get(id)};
 const c=vm.createContext({console,URLSearchParams,location:{search:''},document:{getElementById:el,activeElement:null,addEventListener:(n,fn,capture)=>(listeners[n]??=[]).push({fn,capture})},setTimeout:fn=>{timers.set(++serial,fn);return serial},clearTimeout:id=>timers.delete(id)});
 for(const f of ['discovery.js','app.js'])vm.runInContext(fs.readFileSync(base+f,'utf8'),c);
 const x=s=>vm.runInContext(s,c),step=()=>{const t=timers.entries().next().value;if(t){timers.delete(t[0]);t[1]()}};
 return {x,el,step,flush(){let n=0;while(timers.size){a.ok(++n<100,'no timer loop');step()}},click(action,data={}){let stopped=false;const target={disabled:false,dataset:{action,...data},closest(){return this}},e={target,stopImmediatePropagation(){stopped=true},preventDefault(){}};for(const {fn} of [...(listeners.click||[])].sort((p,q)=>!!q.capture-!!p.capture)){fn(e);if(stopped)break}},load(id){x("loadScenario("+JSON.stringify(id)+")")}};
}
let h=H();h.x("task().question=sampleQuestion;task().framework.confirmed=true;task().periodChosen=true;task().stage='needData'");
for(const file of ['members','ordersPrevious'])h.click('addFile',{file});
h.click('finishData');h.flush();a.equal(h.x('task().stage'),'needData');
h.click('addFile',{file:'ordersCurrent'});h.click('finishData');h.flush();
a.equal(h.x('task().stage'),'authorize');a.equal(h.x('task().codeOp'),null);a.equal(h.x('task().grant'),false);
h.click('authorize');h.flush();a.equal(h.x('task().stage'),'ready');
console.log('PASS actual click path: local-only inspection before task authorization');
for(const files of [['members','ordersExtra'],['members','ordersPrevious','ordersCurrent'],['members','ordersPrevious','ordersCurrent','ordersExtra'],['members','ordersPrevious','ordersCurrent','ordersExtra','brief']]){
 h=H();h.load('normal');h.x('task().files='+JSON.stringify(files));h.click('authorize');h.flush();a.equal(h.x('task().stage'),'ready');a.equal(h.x('task().reports.length'),1);
}
console.log('PASS role/period gates accept qualified 2/3/4/5-source combinations');
for(const [id,stage,count] of [['isolationRejected','preparationBlocked',0],['codeCorrectionSuccess','ready',1],['codeCorrectionExhausted','preparationBlocked',1],['codeUnknown','codeUnknown',0],['sourceChanged','preparationBlocked',0]]){
 h=H();h.load(id);h.click('authorize');h.flush();a.equal(h.x('task().stage'),stage,id);a.equal(h.x('task().codeOp.corrections'),count,id);
 const identity=h.x('task().codeOp.id');h.click('retry');h.flush();a.equal(h.x('task().codeOp.id'),identity);a.equal(h.x('task().codeOp.corrections'),count);
 if(stage!=='ready')a.equal(h.x('task().reports.length'),0);
}
h=H();h.load('relationAmbiguous');h.click('authorize');h.flush();a.equal(h.x('task().stage'),'preparationBlocked');
const identity=h.x('task().codeOp.id');h.click('resolveRelation');h.flush();a.equal(h.x('task().stage'),'ready');a.equal(h.x('task().codeOp.id'),identity);
console.log('PASS isolation/correction/UNKNOWN/source-change and genuine ambiguity');
for(const id of ['unparseable','ocrUncertain','sensitiveDocument']){
 h=H();h.load(id);h.click('authorize');h.flush();a.equal(h.x('task().stage'),'preparationBlocked');a.equal(h.x('task().codeOp'),null);a.equal(h.x('task().grant'),false);
}
h.click('excludeDocument');h.flush();a.equal(h.x('task().stage'),'authorize');a.equal(h.x("task().files.includes('brief')"),false);h.click('authorize');h.flush();a.equal(h.x('task().stage'),'ready');
h=H();h.load('mixedSources');h.click('authorize');h.flush();a.equal(h.x('task().stage'),'ready');h.click('materials');
a.match(h.el('dialog').innerHTML,/普通文档／图片可在材料覆盖后直接提供文本内容或图片/);a.match(h.el('dialog').innerHTML,/不自动成为已核验量化证据/);
console.log('PASS direct-document materials, content-risk exclusion, local failures create no code operation');
const mutations=["stop(task())","task().stage='restarted';task().epoch++","task().grant=false","task().grantExpired=true","task().sourceValid=false","task().materialsValid=false","task().inputValid=false","task().configValid=false","task().readOnly=true","task().disconnected=true","task().scopeRevision++","task().files.push('brief')","task().stopUnknown=true"];
for(const mutation of mutations){
 h=H();h.load('codeUnknown');h.click('authorize');h.flush();h.x(mutation);h.x("settleCodePreparation(task(),'success')");h.flush();
 a.equal(h.x('task().dataQualified'),false,mutation);a.equal(h.x('task().reports.length'),0,mutation);a.equal(h.x('task().codeOp.corrections'),0,mutation);
}
console.log('PASS 13 late-code-success negative fences; readback never republishes stopped output');
for(const correction of [false,true]){
 h=H();h.load(correction?'codeCorrectionSuccess':'codeUnknown');h.click('authorize');
 if(correction){h.step();h.step();h.step()}else h.flush();
 const id=h.x('task().codeOp.id'),binding=h.x('task().codeOp.binding'),count=h.x('task().codeOp.corrections');
 h.click('stop');h.click('readCodeSuccess');h.flush();a.equal(h.x('task().stage'),'stopped');a.equal(h.x('task().dataQualified'),false);a.equal(h.x('task().reports.length'),0);
 h.click('reauthorize');h.flush();a.equal(h.x('task().stage'),'ready');a.equal(h.x('task().codeOp.id'),id);a.equal(h.x('task().codeOp.binding'),binding);a.equal(h.x('task().codeOp.corrections'),count);
 a.equal(h.x("task().events.filter(e=>e.text.includes('隔离处理只读源')).length"),1);
 h.click('refreshRead');h.click('closeTask');h.click('reopen');h.flush();a.equal(h.x('task().reports.length'),1);
}
for(const mutation of ["task().sourceValid=false","task().grantExpired=true","task().materialsValid=false","task().configValid=false"]){
 h=H();h.load('codeUnknown');h.click('authorize');h.flush();h.click('stop');h.click('readCodeSuccess');h.x(mutation);h.click('reauthorize');h.flush();a.equal(h.x('task().stage'),'stopped');a.equal(h.x('task().dataQualified'),false);
}
h=H();h.load('codeUnknown');h.click('authorize');h.flush();h.click('stop');h.click('readUsage');h.click('reauthorize');h.flush();a.equal(h.x('task().stage'),'stopped');a.equal(h.x('task().reports.length'),0);
console.log('PASS explicit stopped-success recovery: same operation/binding/count, qualification only; failed/invalid recovery refused');
for(const id of ['normal','premise','zeroDenominator','unknown','closureMissing']){
 h=H();h.load(id);if(['normal','premise'].includes(id)){h.click('authorize');h.flush()}
 const original=h.x('JSON.stringify(currentReport(task()))');h.click('analysisReview');h.click('submitReview');
 if(id==='unknown'){h.click('submitReview');h.click('readConfirmation');h.click('readConfirmation')}
 a.equal(h.x('task().reports.length'),id==='closureMissing'?1:2,id);a.equal(h.x('JSON.stringify(task().reports[0])'),original);
 if(id!=='closureMissing')a.equal(h.x('task().stage'),'completed');
}
for(const id of ['verification','calculation','explanation']){h=H();h.load(id);h.click('authorize');h.flush();a.equal(h.x('task().reports.length'),0);a.equal(h.x('task().verified'),id==='explanation')}
for(const id of ['modelRetrySuccess','modelRetryExhausted','modelRequestUnknown']){
 h=H();h.load(id);h.flush();
 if(id==='modelRequestUnknown'){h.click('stop');h.click('settleModelSuccess');a.equal(h.x('task().stage'),'stopped');a.equal(h.x('task().reports.length'),0)}
 else{a.equal(h.x('task().modelOp.autoRetries'),1);a.equal(h.x('task().stage'),id==='modelRetrySuccess'?'ready':'modelFailed')}
}
h=H();h.load('stopUnknown');h.click('reauthorize');a.equal(h.x('task().stage'),'stopUnknown');h.click('readStop');a.equal(h.x('task().stage'),'stopped');
for(const id of ['readonly','disconnected']){h=H();h.load(id);const before=h.x('JSON.stringify(task().files)');h.click('addFile',{file:'brief'});h.click('authorize');a.equal(h.x('JSON.stringify(task().files)'),before);a.equal(h.x('task().codeOp'),null)}
console.log('PASS original review/failure/model-retry/stopUnknown/read-only regression');
h=H();const ids=JSON.parse(h.x('JSON.stringify(auditScenarios.map(s=>s[0]))'));a.equal(ids.length,30);
for(const id of ids){h=H();h.load(id);for(const m of ['simple','professional'])h.click(m);h.click('materials');h.click('dismiss');h.click('data');h.click('dismiss')}
const source=fs.readFileSync(base+'app.js','utf8')+fs.readFileSync(base+'discovery.js','utf8');
a.doesNotMatch(source,/files\.length\s*[!=]==?\s*2|\bfetch\s*\(|XMLHttpRequest|WebSocket|FileReader|localStorage|sessionStorage/);
const css=fs.readFileSync(base+'styles.css','utf8'),prefix=cp.execFileSync('git',['show','d89f7d45f6c5ecab7440d66e4747ee3ef6625826:docs/planning/2026-10-03/pc-task-experience-prototype-v0.2/styles.css'],{encoding:'utf8'});
a.ok(css.startsWith(prefix));a.match(fs.readFileSync(base+'index.html','utf8'),/connect-src 'none'/);
console.log('PASS 30 scenarios x 2 modes; no count/network/file/storage gate; CSS prefix/CSP preserved');
NODE
```

此命令的 DOM 为桩对象，定时器由测试队列推动；“PASS”仅指所列离线原型断言。未进行真实浏览器、真实多源读取、模型调用、代码隔离、崩溃恢复或工程验收；最终独立 Review 和用户 UI Gate 均未预填。
