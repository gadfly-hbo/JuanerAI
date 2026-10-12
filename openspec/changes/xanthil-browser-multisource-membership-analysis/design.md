## Browser-fit001：用户已批准浏览器窗口适配修正（实施前）
2026-10-08用户确认“那么就修正下前端Ui”。在原Change/WIP/accepted布局内，仅去掉模拟桌面window外边框/圆角/阴影/最大宽度，改为viewport全幅容器，以flex让品牌/工具栏真实高度参与分配，不再固定减86/110px及520px最低工作区。保留PX006左会话/中央/右抽屉、绿色字标、输入区和PX004六阶段。中央和抽屉各自滚动，短窗口输入按钮可达，专业与打印不裁掉正文；不改业务/模型/权限/保存/事件。公开实际浏览器视口是既有验收seam，先截图保留旧桌面容器表现，再CSS实现/93既有UI回归/实际宽窄与短窗口检查。此低风险样式修正不写镜像CSS实现的单元测试。原完整005保留，受影响样式新身份；完成后受影响独立审查，回到用户验收。

# Change005 v1.1：自然语言语义接续设计修订

## SEP16：R1 默认成果摘要，完整报告按需展开（实施前）
current052正常网页050已实际自动saved，16净额proof/1Python/11模型请求；后端重要交付成立。实际默认对话仍显示完整assembled报告事实表，违反UI Contract R1 §2经营报告完成行，不是新需求。保留原中央对话/展开报告/右抽屉/专业六阶段；只对现有assembled报告的普通成果消息投影为有据发现、业务限制，宿主生成范围比较长句及完整核验表保留原展开报告/下载，不抹掉重大NO_DATA限制。单一标量成果可显示实际核验值，不能将多指标最后一个局部值冒充整项答案。原件、模型解释、报告、历史及账本不变；查看/刷新不发模型。用actual050固定task在公开client seam做因果RED，完整报告/专业/下载及重要限制断言保留，当前真实页面复查，无需重跑未改变的模型计算。

## SEP15：标准化关键交付必须真正进入执行（实施前）
current051普通网页049实际只形成总体/期间3proof，未调用既有required_plans，因此SEP12/13可选声明被跳过，地区/商品关键净额未完成。仅增加提示或重复模型请求不能修复该接线。原生产agent-led/report任务在首次计算前通过现有read_analysis_evidence(required_plans)绑定需求所需的重要IR；没有绑定时calculate_and_verify返回明确needs_required_calculations，未执行核验，Agent在同一原多轮中完成绑定。模型根据describe_business的交付及资料自行决定所需计算、分组和筛选；无需用户额外确认，不解析业务关键词、不把全部探索矩阵强制核验。实际绑定后沿SEP13一次消费缺少proof的IR。既有read工具同时只读返回current_plan，便于显式续接/已采纳框架的Agent读取实际方案再绑定；不根据旧结果复制权限，不自动执行。只要求声明不是完备性自然语言认证，最终仍以具体真实场景和独立审查证明履约；不得一项任意计划就声称全部需求满足。无资料对话、proposal、旧已完成只读及专业原通道不增要求。已有保存checkpoint中成功read工具要求可复用。
MiMo本轮真实输出含未转义ASCII引号造成REPORT_EVIDENCE_INVALID，仍拒绝，不能静默修复或添额外请求。仅完善原输出协议指令：严格JSON字符串转义，正文用中文引号；结构/引用/负例及次数上限不变。

## SEP14：中断后当前方案与核验指针读回（实施前）
SEP13真实执行逐项保存框架与凭证；中断可能发生在后续报告checkpoint之前。显式续接应只使用当前identity、当前plan/hash匹配的已保存独立凭证，不将旧checkpoint计算指针配到新框架。优先当前方案匹配的qualified proof；无匹配时只保留自身plan/result/source hash一致的checkpoint，否则不发布旧结果、不重算已核验事实。沿原Application seam以合计11→平均11/2的实际核验及旧checkpoint模拟中断，RED需证明错误旧值，GREEN需正确指针且无新增计算。无新增UI、权限、自动恢复或成功追认。

## SEP12：关键交付的实际计算要求（独立004之后，实施前）

### SEP13：实际网页048收回后的包内修正（先于实施）
source049 正常网页实际完成关键净额，但 Agent 声明22项后仍漏4项辅助计算，另2项交叉筛选真实NO_DATA，最后文字仍称完成；SEP12拒绝保存，45轮已收回FAIL，不追认。仅要求模型反复逐项调用或机械阻断仍不能交付，不能盲目重试。
按 R1 的标准化需求/IR→实际执行分工，在原实际 agent_led 非proposal任务、同版本范围/权限内，Application在最终报告前一次消费Agent已声明但未形成凭证的支持IR，复用现有calculate_and_verify执行及独立核验，并保存真实凭证；已匹配凭证不重算，不新增模型请求或代码生成。模型继续决定目标、合法IR及自由探索；后台不是自然语言裁判，不扩大范围。既有步骤依赖图与任何权限/源变化/UNKNOWN失败仍不可绕过。
真实NO_DATA单独记不可用，不能变成0或独立通过，不强迫空切片阻塞所有有效成果；最终MiMo输入及宿主报告明确实际范围无可纳入记录。其他失败不自动豁免。已执行/不可用范围进入原报告audit checkpoint，失败与部分成果保留，不伪造模型tool调用。现有报告恢复/迟到/撤权守卫、自动跟进PAUSED及用户验收停止线不变。不是模型重试/critic/新Runtime/新UI/新增效果权限。原049失败和1552+本次实际消费保留，因果RED应证明缺实际IR消费导致不能保存；GREEN需新增真实净额proof，而非放松missing判定。

独立004确认当前任务有总体净额与gross切片，但缺关键净额切片；部分报告诚实，不满足 RV04/05、OA-S01/C01。不能重跑未变输入碰运气、强迫所有探索独立核验、解析业务关键词或改 MiMo 职责。原 main Agent 把重要交付绑定成当前材料上的 proposal IR；现有 read_analysis_evidence 增加可选 required_plans，只编译和读取，不计算、不变当前框架、不锁定所有探索。可增量追加，已声明要求不能通过下一次读取删除。宿主按实际计划结构核对当前身份 proof，目标文字不是计算权威；gross/总体/其他切片/生成程序自称核验不能抵扣不同净额要求。模型负责判断哪些要求对应业务目标，后台不认证自然语言。

要求及其读回沿现有真实 tool checkpoint 持久化，不新增数据库、Runtime、自动修复循环或 UI。恢复仅消费同一任务已存工具结果及当前材料，实际凭证仍按现有 identity/hash/独立 verifier 校验。最终不把未满足的已声明要求写成完成；保存过的凭证及探索保持。普通 Agent 自行通过现有 calculate_and_verify 等工具补足，再交原 MiMo 无工具报告。既有权限/停止/迟到/UNKNOWN/共享一次额外请求不变。

原 Application/runtime-tool 公共 seam 内做因果 RED：当前总体净额+gross组无法满足声明净额分组；实际补净额 proof 后满足且保存，read不执行、不新增Provider；生成代码自称核验不新增proof；增量及恢复不丢要求。旧完成 checkpoint 被动读取不追认此新私有输入。新完整候选与真实普通网页仍需重新验证，不能以此设计关闭004。

## R1 实施设计入口（2026-10-07 已获用户批准）
R1 当前规格优先于此前默认强制卡片/Skill与方法内整套方案采纳。三核心继续原 Context/IR/Harness，不能新建 Runtime 或长期知识平台。所有既有记录读取保持；下列分段决定先于依赖代码。

R1-UX01：原 renderQuickAnalysisWorkbench/client 的快速默认主区只投影对话和状态/必要限制；原 detail/context/plan/evidence/execution 保持检查能力，专业布局保持。方法和协作搬入原抽屉的更多检查面，用 data-action/data-open 既有事件路由，不创建独立页面/iframe或新服务。Stop根据实际 taskState/在途状态，不能使用已保存状态的通用停止按钮。实际范围差异保留可读原→现与失效摘要，完整影响按需展开。测试沿用公开 render/client 及 HTTP/实际浏览器接口。

R1-AG01 首轮勘查发现：当前框架已确认后固定全部方法、步骤图完全固定、生成Python只允许部分预置聚合IR；需要在原材料/语义权威/作用域内闭合动态方案和代码消费者。不能只改提示词宣称已完成。后续对应私有契约在此落盘，先 RED 后代码；不重做用户规划或增权限。

2026-10-07；用户指令“那你修改设计”。本节承接既有 engineering-decisions.md 中的其他设计，只修订 Q11-UX-C03/FM-A01/FM-X 的语义接续机制。固定产品输入 a940947、五时刻补充0c6834d、PX-006/PX-004及现有权限不变。设计已落盘，不代表生产实现或验证通过。

## 1. 问题及取代项

当前设计将规范值、逐字引文和用户确认混为一项；通过字串包含关系选候选。这样既不能自然解释“万，人民币”→人民币万元，也不能可靠判断真正的歧义。C03修正版解决了部分接线及读回缺陷，但不作为新设计的通用实现。

取代 C03 中“规范值必须包含在用户引文中”“新增值追加到候选字符串再按出现位置选取”的规则。引文仍必须真实；解释后的规范值不必逐字出现。不得继续扩充中文表达白名单、逐个同义词分支或硬编码示例。通用结构仍有明确的能力范围，不承诺任何业务问题都能解释正确。

## 2. 原流程内的一条接续链

既有 composer 提交消息→Application形成实际待补充问题、当前消息、相关历史、当前版本方案及授权资料上下文→既有Pi Agent解释并调用语义工具→Product Core检验结构与证据→实际Binding/IR→本地计算及独立核验→原工作台保存与展示。

只使用现有Runtime与工具通道；不另加翻译Agent、分类模型、第二Runtime、常驻语义服务或模型评审循环。不在每条消息前强制新增模型调用；解释在当前已授权多轮内完成。正常补充直接接续当前任务。明确方案变更保留原有修改影响/采纳机制。

## 3. 单一语义Module与Interface

在现有Product Core语义Module内形成一个验证/解析Interface。调用方交入：真实任务/版本身份、宿主提供的用户消息索引、当前待补充问题、模型提出的结构化解释、已有语义状态及真实资料/Binding约束。返回：可消费的语义状态或明确的缺失/冲突/无效证据观察；不在该Module里调用模型、读密钥、执行工具或写数据库。

解释至少包含：涉及的维度、规范化含义、实际适用对象、所引用消息及原文位置、仍存在的实质歧义。模型不自行授予确认等级、计算成功或工具权限。沿用metric/formula/unit/population/grain/period/time_zone/filter/join/precondition维度，只消费当前IR支持的结构；不建立通用Ontology或任意公式执行器。

证据中的消息身份由宿主基于任务、版本及真实保存消息位置提供。后台检验消息属于该任务的有效上下文、引文位置及内容一致、维度/适用范围合法，并禁止用模型回复/工具文字冒充用户话。不得把匹配到一段真引文称为已证明语义解释正确；这仍是模型解释，需要合同场景测试及可修正的产品展示。

## 4. 来源、解释及人工确认分开

用户原话逐字保留。规范化含义单独保存为“依据用户表达的模型解释”；模型建议仍是候选；资料事实仍由真实读取确定。只有存在实际明确确认行为的对象才标为用户确认，不能让模型输出USER_CONFIRMED升级自己的权威。

普通且有充分上下文的解释可按既有任务授权执行，无逐条新增确认。未回答的关键冲突不得因模型自称确定或高置信度消失。若存在不同可执行含义、与当前资料/方案矛盾、缺少必要字段或超出支持能力，保留真实等待并只询问决定结果所必需的信息。不要因值与原句不完全相同反复追问。未知原因作为限制，不能妨碍无关有效算术。

## 5. 单位：含义与数值处理分开

模型将自然表达解释为金额维度、币种及每个原始数值对应的单位倍率。例如结合当前统一金额单位问题，“万，人民币”可提出currency=CNY、scale=10000；这里的规范值无须出现在引文中。该例是验收输入，不是专用生产分支。

后台验证结构、精确正倍率、币种兼容性及每个实际输入的单位绑定。既有来源事实优先：订单明确为元、退款明确为万元时，不能让一个泛化回答把二者悄悄改成相同原单位。适用对象必须确定；订单与退款是否同单位确实不明时才澄清。

必须区分输入单位和输出单位。两表都是万元、同单位减法：50.75−5.25=45.50万元，不乘10000后仍标万元。若明确要求换算成元，已有计算/IR路径必须实际消费精确倍率、产出455000元，并由独立路径从原始行及倍率复算；仅换标签禁止。不支持的数值转换保持具体能力缺口，不能输出假成功。跨币种不猜汇率，不新增网络/数据授权。

金额度量、单位倍率与实际Binding/IR一同持久绑定；单位不同、无法确定的混用或语义与计划不一致，均不能发布已核验成果。核验等级只证明实际计算及适用单位转换，不证明业务原因或用户人工认可。

## 6. 版本、历史及兼容

新语义记录采用明确的私有版本，与当前Context/IR哈希和任务版本绑定。保留v1.0逐字型历史语义及旧Context的既有读取逻辑；不得原地迁移旧任务、把旧候选升级为解释确认或改写旧失败。新解释只在用户正常接续/修改所产生的新版本中记录，宿主不自动重发原任务。

持久读回检验同一结构、来源身份、实际Binding及哈希，不重新调用模型判断旧记录，不再用候选中文字串数量重判含义。普通刷新不运行；重启不自动执行；未知/迟到/停止边界及持久计量沿用现有机制。

用户纠正含义、单位或范围时按FM-X形成新版本，显示实际变化及受影响成果，失效后真实重算和独立核验；原成果及引文留在历史。专业模式与快速模式消费同一实际语义/执行记录。

## 7. 最小工程影响决定

修改点集中在现有语义Module、Application工具描述/上下文及保存读回连接、现有计划/IR消费者和对应测试。若需要私有记录字段及版本增量，在原任务JSON和Context内明确版本分派；不改公开Port为Pi类型、不新建数据库、表或Runtime，不改变授权合同。新记录结构必须在因果测试前具体闭合，并进行旧记录读取/哈希负例测试，不能靠容忍未知字段兼容。

用户当前批准的是设计修订，未借此扩大Provider、材料、依赖、主机或Git权限。原Model/凭据/重试上限及已核验授权仍有效；只有真实缺项影响动作时集中报告。这里的解释机制是已批准开放分析及五时刻的工程实现，不重新设计产品/UI。

## 8. 验收及实施次序

先落最小版本化契约→原接口因果RED→垂直接通补充解释、实际单位Binding/计算/保存读回→负例和原同义表述回归→同版本快速/专业/FM-X回归→最终固定候选与独立Validator。文档修订不伪造RED或PASS。

| 场景族 | 必须观察的结果 |
|---|---|
| 未逐字规范值 | 万，人民币/人民币万元/金额以万元计：允许不同原句解释为相同CNY、10000，而非要求重复候选 |
| 对话接续 | 用户只说万，继承真实已确认人民币上下文；没有币种依据且结果需币种时只补问币种 |
| 原单位与输出单位 | 同单位扣退款45.50万元；显式转换成元须真实计算455000元，不仅改单位标签 |
| 实质歧义 | 元还是万元我没确定：保持等待、零依赖计算/成果；不把词出现当选择 |
| 多个对象 | 订单元、退款万元：按各自真实Binding处理；单位适用对象不明则澄清 |
| 引文与权威攻击 | 假消息ID、他任务引文、模型/工具冒充用户、过期版本均拒绝；真引文不升级为人工确认 |
| 修改影响 | 从万元改为元影响当前IR/证据/成果，保留旧版本，实际重算核验和新旧比较 |
| 通用维度 | 日期/筛选/分组的同义表达消费真实字段和支持IR；未知年份/时区不默认填入 |
| 历史及生命周期 | 旧v1.0读回保持；新记录保存后重开不再解释/调用；停止/迟到/UNKNOWN不显示成功 |
| 模型可靠性 | 主备合成真实路径覆盖不同措辞和负例；用未作为实现分支的表述检验泛化，失败如实保留 |

例子用于验收，不穷举自然语言、不为每个例子新增生产代码；更不能声称结构检验已经证明LLM永不误解。

## C04执行契约 / 2026-10-07

用户已授权实际实现。新工具interpret_meaning沿用当前Pi工具通道，输入interpretations与conflicts。宿主提供task_id及按task_id+实际用户消息文字哈希生成的message_id，模型只引用ID及逐字quote；规范value独立于quote。每条解释声明clear或ambiguous、维度及可选实际度量。evidence空的解释为MODEL_CANDIDATE，不解除关键冲突；有真实证据的解释为USER_INTERPRETED，不是USER_CONFIRMED。明确歧义保留未解决状态，clear解释只解除同维度冲突，其他维度不消失。原逐字assess_meaning读取/测试保留用于旧协议，默认生产指引改为interpret_meaning。

私有Semantic1.1增加task_id、解释证据及明确解释状态；Context1.2绑定它。新记录读回检验任务ID、真实问题列表、证据ID/引文、解释/冲突关联及哈希；旧Semantic1.0/Context1.0或1.1原样验证。新版本不自动迁移现场，旧已解析状态只在新接续记录中承接来源，并保留旧权威等级。

度量说明包括currency、各真实source/sheet/金额column的输入倍率，以及输出倍率/输出标签。倍率为1至10^12间的十进制幂；使用精确十进制移位，无汇率/浮点近似。实际执行绑定必须一一覆盖所有消费金额字段；未知/混币种/字段错配不能按新标签输出。原有无单位解释的历史计划/结果不被重新标为单位已核验。测试接口沿用已批准Core语义/IR、Application/Store、浏览器/主备真实合成接口，不新增人工接口批准。

C04 数值接线：私有 IR 1.8 包含原有 base IR 与结构化 measure；base 保持原字段、分组、筛选及原始行含义，不迁移旧记录。编译时必须精确覆盖消费的金额字段，禁止重复/多余/漏绑；单币种，十进制幂缩放，输出单位在 measure 中声明。退款净额分别转换订单/退款后扣减；单源与同倍率多源的 sum/min/max/mean 精确缩放输出，count 不作为金额转换。多源不同倍率暂返回具体 MEASURE_INCOMPATIBLE，不假称可直接合并；不影响原未测量多源能力。独立核验分别重遍历原始退款行，或独立验证原值与转换关系；不调用主计算器。measure 与 base 均进入 Binding/plan hash 与版本失效判断。

C04真实SDK反馈后的接口修正：非单位维度不要求 unit 字段，缺省表示无金额绑定，不改变自然语言含义。仅 unit 维度可含单位对象；不是给每个维度附加无关 null/对象的必填表单。实际单位换算仍须闭合输入字段与倍率。

C04完整上下文：Application从当前/同材料上一等待版本提供实际clarification.text，与真实用户消息分开标为模型问题。短答由模型结合问题区分原始输入单位与输出要求，旧模型候选不提供默认输入倍率；未知不能自动赋1。真实验证primary002已揭示错误倍率并保留失败及调用，算术核验成功不能替代业务理解正确。

C04可用性修正（真实primary001～003失败）：Runtime向模型公开两个小工具，interpret_meaning只处理维度/解释/状态/真实引文，bind_measurement只处理单币种/实际金额字段/倍率/输出。不让模型在每个业务维度中嵌套无关单位对象；不接受伪造参数的静默修补。内部Semantic1.1仍保存unit维度的绑定，不新增持久schema或平行Runtime。bind_measurement更新同一已解释unit记录与其冲突摘要键，并重新编译同版Context/IR；已确认方案仍受原修订边界。输入输出依据完整实际提问解释，数值成功不代表业务理解已被用户确认。

C04用户已回答不再审批：解释/单位工具返回真实剩余冲突与下一动作。clear且无剩余冲突即可按既有材料授权推进，不因标为USER_INTERPRETED再次求人工确认；只有新的具体实质歧义才澄清。旧原表未印单位不自动否定当前用户解释。primary004重复询问已解释单位的实际FAIL保留。

### C04-B01 执行资格修正（独立002 FAIL后）
Context编译在新的clear单位解释缺少度量时拒绝MEASURE_REQUIRED；Application计算入口在缓存/步骤成果早返前，以最新语义及当前资料重编译框架并校验计划摘要，阻断绑定缺失或已变更。不增加词汇解析器。Store持久Context读回沿用同一编译资格。

### 当前澄清的含义优先（主真实006/007失败增量）
保留真实失败：主模型把资料单位回答误作输出单位，并猜原始基本单位；算术核验不证明此模型解释正确。继续由LLM判断答复所补属性，不新增词汇匹配器；Runtime明确区分原始资料属性与展示请求，短答首先回应实际澄清的对象，未指明的另一属性不得靠默认补齐；不确定则保留歧义。真实提问/原话作为任务上下文，旧模型候选不升事实。

### 澄清对话接续
真实等待问题不只放在System说明：在本轮已排队的用户短答前，若现有标准checkpoint缺少紧邻的真实澄清问句，将当前已保存的模型问句以assistant/calls:[]补入Runtime上下文。保留原问题、真实所有消息和turn，已有问句不重复；没有新的用户短答不追加或自动推进，proposalOnly保持原机制。不编造模型内容或用户权限，不新增Pi类型/Schema。dialogue-red001先证明短答作为孤立需求，随后验证实际问答顺序。

### 已有框架的真实下一动作
bind_measurement已在当前资料上将原等待框架重编译、持久保存且无剩余冲突时，工具next_action明确calculate_and_verify，不让模型重复重新填写已完成的同一框架。框架不存在时仍bind_framework_and_calculate；执行资格和最终保存守卫不变。真实主010已正确理解输入/输出单位，但重复重填无分组传空字符串导致PLAN_INVALID并耗尽8轮；该实际失败保留，不用纠错次数或词法放宽掩盖。

### C04-B02 私有兼容影响决定
在Semantic1.1 Interpretation增加可选unscaled_unit:{input_label,output_label}。仅unit维度、两label相同、不能与OpenMeasure并存；其含义是无币种、无换算的原单位数值，不是扩大换算方法。由LLM分类及规范化，Core不解析中文。未出现字段的旧1.1格式/原hash完整兼容；原1.0/SQL/Port不变。Context对声明执行原有IR并消费同一label，金额缺绑定守卫/缓存及最终save资格仍保持。不同label或同时货币绑定显式拒绝。Runtime工具返回真实可执行下一动作，不要求数量用户提供币种。该私有可选表示修复已支持数量能力，无上边界/权限/UI方向变化；工程总控在既有批准包内决定，先unscaled-red001再实现。

C04正常Runtime缺前提反馈：没有framework时calculate_and_verify不执行、不核验、不保存，向模型返回FRAMEWORK_REQUIRED和set_framework工具提示，允许同轮显式补齐；最终缺少框架仍不能提交成果。权限、来源变化、取消、未知、独立核验失败仍硬停止，不将FRAMEWORK_REQUIRED误作未知执行或强行计算。nonmonetary-primary002实际模型先调用计算而未绑定失败是因果证据；新增永久负例验证零执行后可按真实工具补齐，不新增重试或请求预算。

C04 Semantic1.1未解决含义的正常修正：calculate_and_verify仍阻止实际算术，但仅反馈冲突和interpret_meaning，不立即锁住所有工具来强制人审。LLM可按已存在真实用户消息更新含义，再实际计算；若本轮结束仍有冲突，持久保存waiting澄清并不形成成果。旧Semantic1.0历史行为保持，新的真实ask_user、取消和权限仍停止。conflict-feedback-red001证明原自动question锁阻止同轮模型更新；继任保留未解冲突零verify/零保存负例。

C04缺少单位解释的工具反馈：bind_measurement必须保留实际明确unit解释前提，不按绑定参数偷造用户事实；缺前提时返回MEASURE_BINDING_INVALID／next_tool:interpret_meaning／dimension:unit，要求LLM在该维度引用真实用户消息，信息真的不足保持ambiguous并问具体业务问题。真实金额绑定参数不能代替业务解释，但工具反馈不得误导为缺资料、另换步骤或重复人审。meaning-feedback-red001源独立脚本直接复现原反馈缺项、零计算；继任永久测试保留相同断言。

C04 Runtime待澄清上下文的权威分层：历史未核实候选alternatives仍完整留在任务、冲突消解、UI及历史，不删除；发给模型的等待说明仅投影待解决dimension/question和有真实用户依据的定义，避免将旧模型猜测连同当前问题当作业务依据。明确解释仍由LLM输出，不用程序判断中文含义。真实用户消息与上一实际问题保留。未核实候选不是默认输入单位；只可作为待解问题，而非本次计算事实。

## R1-BASIS01 — 选定业务说明的任务级解释（实施前契约）

保持同一Agent和选定资料观察，不另建库、服务或模型调用。interpret_meaning增加来源引文形式：source:{source_id,source_sha256,sheet_id,row,column},quote。只接受当前授权inspection中唯一、可读取、哈希一致的真实单元格/文档文本引文；不访问模型提供路径。持久分类SOURCE_INTERPRETED，区别USER_INTERPRETED/USER_CONFIRMED，不自动成为项目指标标准。旧用户形式/语义1.0和1.1兼容；来源解释为1.2，读回对同一输入身份再次核对引文。

单位可由用户或资料说明理解并绑定实际倍率；规范值由LLM理解，不做短语词典。依据清楚且适用无需重复人审；真实矛盾保留冲突并阻断依赖计算。当前用户覆盖沿已有新版本链，不覆盖原材料。来源/单位在Context和详情可查。伪造、失权、哈希变化、跨任务/错行引用拒绝；既有confirmed_plan不得静默改变业务语义。

验证：semantic编译/读回、Application工具、Store持久读回因果RED/GREEN；完整候选真实主备合成资料验证。

## R1-EVOLVE01 — 同版本内真实执行演进（实施前契约/影响决定）

业务版本和执行计划分离。既有task/revision/grant身份不变，Context的用户目标、业务对象/范围和已理解语义稳定；方法、分组/检查和合法步骤可按实际观察演进。不得删除原基础筛选、改变基础单位或覆盖已核验步骤。新输入/业务含义或范围变更仍走原FM-X。步骤图可追加，原节点/依赖/真实核验不变，且新图仍按真实IR编译、检查循环和依赖；未执行步骤方法替换使用新节点保留旧未完成状态及具体说明，本轮先支持追加和单计划方法演进。

原Store的confirmed_plan锁定全部IR会阻断此合法行为。采用可选agent_led标记及任务execution_evolution:{basis,frames}，basis保存演进前不可变框架，frames保存实际后续框架；旧记录不变，confirmed_plan继续指向原确认basis，不伪造用户确认。JSON任务正文兼容字段，无新数据库或跨项目迁移；持久读取逐个核对来源、Context、演进关系及确认原点，失败/UNKNOWN/预算不重置。演进仅当前主工作区启用；旧数据读回兼容，不能借标记降低来源/权限检查。

作用域约束：同一任务问题、business目的/对象/范围、语义及当前inspection；原绑定中已存在筛选必须保留，同绑定不能改变输出单位或值映射/关联规则。新分组/方法及不扩大基础筛选的检查允许。已声明图只追加原样保留节点，真实下游依赖仍按核验通过才执行。无实质变化不追加虚假历史；最多128次方法演进，命中实际资源边界明确停住。

这是R1已批准动态IR的私有落盘接线，并非新的模型/材料权限；主工程Agent在原允许路径决策、先RED再代码。回归包含旧确认链、变更作用域拒绝、来源变动、持久历史及同候选停止/迟到。

## R1-CODE01 — 真实生成Python探索及分层核验（实施前契约）

Agent可生成新分析/转换/组合指标/图表程序，不以Skill或完整预置模板作白名单。在现有Analysis IR能力内增加kind=exploration的私有执行IR：目标、当前Context/inspection身份、真实source/sheet/列/筛选绑定及只读快照哈希；不是第二Runtime，也不提供Shell/SQL/HTTP。探索前须有当前框架，业务含义/范围稳定。后台从当前许可快照生成精确子集，应用基础筛选及本次收窄筛选；代码只能读这一真正受限输入，不能依赖提示词限制全量行。

原OpenAnalysisCodeExecution增加可选explore入口，复用同一真实隔离监督器、资源、输入/代码/输出身份、停止/迟到和持久预算。一次失败最多一次纠正；成功探索的新动作不是失败重试。物理成功仅保存MODEL_EXPLORATION/verification=not_performed，不能生成qualified算术凭证；UNKNOWN封闭后续工具。探索IR/代码hash/输出hash/物理回执及观察持久化同一任务，并供后续同一Agent真实观察。

探索输出限定summary、observations及图表数据（bar/line、具名数值点及单位），不用不可信HTML/SVG。前端同一成果/证据位置可查看明确未独立核验的探索图表和来源/方法；不能因总报告含某个已核验值就把所有探索认证。关键数值通过已有独立路径真实重算，生成程序自检/重复运行不当核验。保留支持能力局部边界，统计/预测/因果方法欠资格时说明限制而非全面禁用探索。

验收用未预置完整模板的多期间/地区/商品经营任务，生成程序消费过滤后的实际快照、产生经营观察和图表，同一Agent据真实结果选后续检查并对关键事实独立核验。越权文件/网络/子进程/改原件实际无效果，不只测字符串；当前候选真实主备及有界主机测试与原OA-RT一起收回。

### R1-METHOD01 private correction
The existing method validator validates preference identity only; actual grouping is enforced by the chosen executable IR, not a global Skill whitelist. Group-summary description recommends final grouped comparison with compatible baseline steps. No role/runtime/schema boundary added.

### R1-RT-ENDPOINT01
Pi Adapter binds an immutable request credential endpoint from the explicitly validated composition selection, after validating the discovered provider/model and one of the two approved source endpoint identities. Key stays callback-private; discovery files/config are not rewritten. Tests must use the same unmodified credential Port as production, no test-only endpoint wrapper.

### R1-PLAN-SCHEMA01
Replace private set_analysis_steps permissive plan properties with the existing eight versioned proposal shapes. This is an interface description correction for already supported calculations; backend compile remains authoritative. No automatic normalization of invented business values. Real primary002 malformed nested arguments are retained, not replayed as valid.

### R1-RT-CODEC01
Real primary003 emits malformed nested tool arguments (nested empty arrays and fields outside steps) despite complete schema. Add one private Pi transport codec for nested shapes: arguments_json string with original schema in tool description; validated decode with installed validateToolArguments, canonical history and inverse restore. Public Runtime Port remains business JSON; SDK quirks do not escape Adapter. Same codec all selected providers, no parallel Runtime or new request.

### R1-CODE01 refund snapshot
Recompile/execute existing refund IR before scope materialization, then derive eligible original order keys using fixed base filters. Before column projection apply refund membership predicate. No new join semantics or arbitrary SQL. Unavailable member-period/value-mapping snapshot remains a specific denied exploration path.

### R1-BASIS02
Real primary004 failed because model rewrote a quotation and added an ellipsis, rejecting its whole semantic proposal. Move evidence text retrieval to backend: optional quote on interpret_meaning evidence; omitted means full actual referenced cell/message. Do not normalize forged quotes or silently repair IDs. This changes private evidence assembly, not business meaning or long-term authority. Existing persisted evidence invariants unchanged.

### R1-EVOLVE02 — 核验子问题不等于业务口径改变
真实 primary006 总净额1050已核验，退款小计步骤被总框架measure/join的整对象相等限制阻断。既有已授权分析可核验原订单/退款小计；不要求每个检查都重复净额公式。同版本问题、语义、business范围不变，输入倍率按实际字段一致，输出币种/单位一致。完整步骤图原节点仍不可覆盖。涉及关联时保留原关联规则；从受筛选订单关联范围切到独立退款全量禁止，避免扩大物化范围。无订单筛选的同任务小计是合法检查。先RED证明，保留旧失败。

### R1-CODE02 — 成功探索不是失败纠正
同一合法探索快照可由Agent据真实观察提出不同程序；成功输出不消耗失败纠正次数。物理UNKNOWN仍封闭，真实失败同一步最多一次额外执行，改变代码或重开不能重置已失败记录。此为R1-CODE01原契约纠正，先真实三次生成程序测试RED，再仅改探索预算计数，已有受控算术预算行为不变。

### R1-CODE03 — 真实快照诊断支撑一次纠正
备用001实际代码将rows对象误作cell数组，且SOURCES[1]不存在。返回同一次受控探索真实物化input（plan/inspection），并明确唯一SOURCES[0]、row.cells及列标识，而不是只给无上下文失败码。只在已有一次纠正回执加入同权限真实快照；不修造代码、数据或成果，不增加重试。工具正常描述同样完整说明现有输入形状。真实错误细节仍仅安全类别，不泄露文件路径或非授权内容。

### R1-CODE04 — 探索展示投影不把可附加数据当成执行失败
primary008纠正程序实际生成正确净额矩阵，点附订单数触发闭合字段拒绝。探索原始result.json及输出SHA仍完整封存；已知展示投影只消费summary/observations/charts及title/type/unit/points、label/value，按既有长度/数量/数值界限验证。额外JSON属性不消费、不展示、不升级核验，不要求模型为合法附带属性重写计算。原输入授权/物理监督器不变，非JSON/必需字段缺失/超界/不可绘制数据仍拒绝。原始输出不会因投影而改写，保存/读回均用同一投影再核验已知字段。此是私有探索输出消费者纠正，不改变用户口径或专业依据。先额外字段/恶意展示属性保留但不渲染的RED再实现；独立重要事实证明不降低。

### R1-CODE05 — 探索小数与既有持久编码一致
backup002实际生成44.1860%等合法小数，但taskHash/encodeTask只接受安全整数number；之前图表类型仅number与持久层冲突。不得全局放宽业务编码。探索已知展示值投影：安全整数保留number兼容历史，有限非整数投影为规范十进制/指数string（String(number)，数值界限不变）。后台读回接受并核对同一规范非整数string；整数伪字符串/NaN/无穷/非规范拒绝。图表前端只将已验证值Number用于绘图，保留原字符串展示；原Python输出及输出SHA不改，算术重要事实仍精确独立核验。因果RED含taskHash/生成Python实际保存读回/显示，小数探索不会伪装独立核验。

### R1-BASIS03 — 新Runtime只提交引用标识，引用原文由后端管理
primary010实际连续伪转写quote导致失败，模型在可选quote字段仍试图概括。新interpret_meaning工具Schema只提供真实message_id/source位置，不提供quote字段；引用内容全部后台按位置实际读取。产品Core和旧存储/调用的quote兼容验证仍严格，提供伪引文继续拒绝，不删来源验证。自然语言value由模型理解，不由keyword匹配；新工具不要求模型抄写/机械改格式。源位置不存在/错hash/跨任务仍拒绝。先正式Runtime参数证据RED，后最小schema/说明修正，不放宽权限或新增请求。

### R1-EVOLVE03
primary011的合法订单count被金额basis整体measure/unit约束拦截。仅独立count且无measure的已编译IR可在同业务范围绕过金额单位比较；资料筛选、关联范围、Context和旧节点保持。原unscaled_unit同样不覆盖count单位。非count数值方法的度量约束不放宽。先因果RED和金额/筛选负例，再最小修正。

### R1-UX02
浏览器60929实测session200/projects200/methods400。非认证失败；在项目选择前调用项目级methods所致。启动保留选择界面，延后项目级方法/任务读回至明确选择；选择后原消费者继续。实际bootstrap失败仍拒绝。先DOM公开入口RED，不引入绕过token或读取私有cookie。

### R1-BASIS04
primary013先设置缺语义框架，计算正确拒绝，但后续正常理解被Storage首框架basis误当口径更改。将已有requireSemanticAssessment前置到persistFramework入口，返回解释工具下一步，形成Context前不写basis。不是删除演进边界或自动确认业务；意义由同一LLM完成。missing语义框架先RED再最小Application修正，不需要语义的兼容Profile保持。

### R1-RT03
primary012误调用未声明execute_step，经未分类STEP_NOT_FOUND转换LOCAL_OPERATION_FAILED并造成AUTHORITY_REQUIRED。只将该未执行前置错误返回为真实结构化工具观察，指向已有绑定/声明入口；绝不构造step或事实，不修改已消耗调用或请求重试。

### R1-DIALOGUE01 / R1-RT04 engineering decision
复用现有 revision_previews 的 source/baseline/lease/idempotency/lifecycle fences，增加 answered 终态，framework=null、非空模型 text、failure_code=null。answered 不可采纳为框架，不改变 task revision/outcome/history/verified_steps；原始回复持久保留，并作为同基线后续 Agent 对话上下文。采用原框架的真实已核验结果和解释作为可解释依据，不复制核验到新回复。正常对话展示在既有中央消息区域，不弹出修改影响；真实 ready/waiting/失败保持原 UI。主 Agent 的 LLM 根据上下文选择回复或提交新框架，后台不解析自然语言意图；排除所有物理执行工具。STEP_PLAN_CHANGED 为已知前置条件，返回原图与追加步骤指引，不修改图或自动修复模型参数。

### R1-CODE06：语法编译失败不冒称已执行未知
受信 supervisor 在身份核验之后、fork/沙箱/模型程序执行之前捕获 SyntaxError，发出 adapter-private compile_rejected 回执并退出65。Executor 仅在该精确回执、无 child_created、正常关闭exit65且无协议/超时故障时标记 not_started / PREPARATION_EXECUTION_FAILED；其他异常保持UNKNOWN/原隔离错误。语法错误不产生探索成果，计入失败纠正预算；同操作最多一次真实模型纠正，不能消除旧UNKNOWN或绕过沙箱。正常续话 composer 不自动打开方案抽屉；可见修改影响仍在原对话位置，主动详情入口保持。

### R1-FOCUS01 / RV02、04、05：任务范围独立于子计算范围
共同对焦中的业务提议可声明结构化 execution_scope（当前资料中的 source_id/sheet_id/filters），经真实 inspection 编译规范化后随业务 Context 持久保存；它是模型对当前需求的理解，不是新增资料授权或长期标准。固定用户问题、语义、业务目标和该 scope；单次 IR 的额外筛选是分析切片，不反过来锁死整个任务。后续方法必须属于该 scope、包含其必要筛选；新来源/删除任务筛选/修改单位或口径仍阻断并版本化。没有结构化 scope 的历史/普通框架继续保守沿用原 IR 筛选，不自动清除。金额字段可从已解释且真实绑定的同一 unit 证据选择子集，不以第一个子计算字段集封锁已解释的其它金额字段。生成 Python 快照按该固定任务范围与本次额外筛选物化，不靠 prompt 隐藏外部行；有退款关联仍限制到合法任务订单。不得据第一子计算的完成宣称整个经营报告完成。

### R1-CODE07：失败纠正前置条件准确反馈
同一 Agent 收到真实探索失败及一次纠正额度后，若改变目标/绑定/物化输入而非纠正原程序，后台在执行前返回原失败任务的精确 goal/bindings/input 和未启动事实，不自动重写代码或开启新预算。继续仅能提交原任务的一次真实纠正；成功后可推进后续新分析。持久 executor 的两次失败上限、未结清任务与UNKNOWN检查原样保留，内存提示不替代其权威。


### R1-FOCUS02 / UI-RV02 — inspect overall scope separately from method slice
In the existing on-demand plan drawer, project the actual Business Context execution_scope using selected source/sheet/header labels and fixed filters. Keep current IR binding, grouping and filters separately visible; an individual period slice must not be presented as the whole task scope. No new default cards, confirmation or layout. Legacy Context without an explicit scope must not invent one. This projection also participates in version impact comparison.


### R1-RT05 — bounded step correction includes actual accepted graph
On a rejected step replacement, the existing one-correction response includes the actual accepted current_steps and explains that new dependent nodes must be appended together with their unchanged prerequisites. No graph merge/repair is performed automatically, no retry is added, and no prior proof or dependency guard is weakened. The Agent explicitly resubmits the complete valid graph.


### R1-RT06 — atomic exact-IR calculation in existing tool
calculate_and_verify may accept a complete plan IR for an agent-led task. The Application reads authorized sources, compiles Context/IR, persists the exact accepted framework, then invokes the existing local computation and independent verifier in that same tool call. It does not auto-merge dependencies, repair invalid input, expand task scope or bypass semantic/measurement/method/source/lease/stop/receipt checks. Existing {} and approved code arguments remain compatible; proposal-only contexts have no calculation tool. A batch of different exact-IR calls must yield each corresponding result, rather than only the last globally framed plan. This is a private tool argument, no new Runtime or persistence schema.


### R1-REVISION01 — semantic-only revision is not a ready executable plan
In a proposal-only continuation, metadata/semantic updates of an inherited old plan cannot count as explicit new IR binding. Track successful framing/step tools separately. If semantic metadata changed but no actual framing tool bound the modified IR, return waiting with a precise unfinished-binding boundary, no ready/adoptable framework. Direct discussion with no semantic/framework proposal remains answered. The normal preview prompt requires binding actual filters/groups/sources and forbids claiming calculation or independent verification in this non-executing phase. Existing UI explains model candidate vs actual executed evidence. Preserve old saved result.


### R1-UX03 / UI-RV06 — revision details remain on demand
In the existing central modification-impact card, present change/outcome impact and adoption. Keep the complete candidate framework/source/filters/grouping under a closed details disclosure in that same position; no new page, layout or extra confirmation. Render model explanation with the existing escaped Markdown renderer, preserving the candidate/not-executed label and actual field diffs.


### R1-DIALOGUE02 — current accepted execution supersedes historic preview intent
When frameworkConfirmed and not proposalOnly, the same Agent receives the actual current execution stage: the existing application action already accepted the plan for computation. Historic preview-only language does not require another same-plan confirmation; execution boundaries still derive from actual grant/lease/identity, not this prompt. Replies lead with business result/findings/limits and use ordinary source names; internal IR/tool/hash details remain inspectable in existing details rather than recopied into every answer. Product/business acceptance and real-world action authority remain separate.

### R1-CONTEXT01 — avoid duplicate execution snapshot in Agent framing feedback
Actual collected primary020 and backup009 terminate on the existing bounded operation timeout after many correct facts; no timeout/retry expansion. The agent-led framing tool currently repeats full raw inspection in every frame response, although inspect_selected already supplies authorized source observations and explore_with_python returns its exact execution snapshot when needed. Agent-led framing feedback will retain exact bound IR/hash and qualification labels but omit this redundant legacy execution_input. Persistent full Context/Binding, source checks, actual snapshot passed to execution and independent verification remain unchanged. Non-agent-led legacy code callers retain the existing input response. This is a private feedback projection, not source filtering, unapproved summarization, hidden context mutation or new Runtime. Test at existing Application/Runtime tool seam verifies no duplicate snapshot while generated exploration still receives the authorized source and current bound plan.

### R1-CODE08 — explicit correction identity instead of retyping descriptive goal
Primary021 actual repeated CODE_STEP_UNRESOLVED despite identical bindings: Agent shortened the descriptive goal by dropping its purpose clause. Do not relax immutable source/business/grant/snapshot or persistent retry identity, and do not add phrase equivalence. A failed exploration response exposes correction_of equal to the already fixed plan identity. The same tool accepts {correction_of,code}; it recompiles the original exact goal/bindings against current source/frame and requires the same key before executing one correction. The Agent need not recopy descriptive language. Wrong/stale token, simultaneous new goal/bindings, changed source/frame remain rejected before execution. Full original request and executor step key remain unchanged; historical recorded goals are not rewritten and retry budget cannot reset. Legacy identical goal/bindings correction remains compatible. Private tool boundary only, no new persistence contract.

### R1-RT07 — default composition follows approved R1 endpoint
R1 product §6 explicitly retains api.minimaxi.com/anthropic; previous default runtime and visible credential host still retained earlier cn endpoint while current real tests passed explicit minimaxi override. Adopt approved endpoint as actual runtime/recipient/status default. Already approved .zcode cn source remains a credential-source alias only, not current outbound target; no file or host configuration edit. Same source precedence, model/tuple validation, ambiguity rejection and private read bounds retained. Both formerly approved explicit test endpoints stay allowed for immutable diagnostic history, but omission uses minimaxi. No new Provider/network/credential authority or model/budget change. Verify actual default through installed Pi seam with no endpoint override and credential projection; previously explicit-override real PASS is attributed as such until current-default evidence collected.


### R1-RT08: project compiled steps to original proposal under plan; omit internal framework/context duplicates from Agent feedback only. Durable graph and validation are unchanged. This corrects the feedback boundary, not model-authored invalid arithmetic.


### R1-RT09: after existing compiler rejection only, project invalid/duplicate UUID identity locations in the model-provided graph. This is feedback about the existing technical contract, not interpretation of business language or permission expansion.


### R1-RT10 supersedes RT05 no-merge advice only for an explicit append operation: Application combines immutable prior public proposals with supplied new nodes, then recompiles and runs all existing graph/evolution/authority/lease checks. Durable graph contract is unchanged; optional tool update_mode defaults to replace for compatibility. Unknown mode and duplicate/replaced IDs fail. Agent need not repeatedly transcribe historic nodes.


### R1-RT11: optional step_id at the existing tool input only; fill omitted IDs with the existing platform randomUUID then pass the complete graph through the unchanged Core contract. No persistent schema, migration, alias registry, new Runtime or business inference. Dependent new steps may be added after obtaining the parent ID; supplied IDs remain strictly validated. This removes model obligation to manufacture technical UUIDs without guessing business facts.


### R1-RT12: pure ephemeral input reference normalization before existing graph compiler: known canonical column/step IDs remain unchanged; exact unique source header and exact unique current/batch title map to existing/generated identity. Only explicitly selected sources/sheets are consulted. No case folding, prefix stripping, fuzzy matching, business inference or persistent alias registry. Recompile entire graph with existing immutable-node/evolution/authority/source/proof guards. Missing plan/dependency reference diagnostics must identify the field without inventing a supported method. This removes technical identifier friction, not professional validation.


R1-RT13：实际 backup016 已完成首次核验，随后步骤图被 FRAMEWORK_REVISION_REQUIRED 拦截。原因是 execution_scope 分支使用语义单位原始表头与编译 IR 列标识直接比较。演进检查以当前已编译 Context 的真实 source_facts 唯一表头解析语义字段，和实际 measure 字段比较；未知/重复/不同来源、倍率变化仍拒绝。不改语义原文、持久 schema 或 Runtime 重试。


R1-RT14：backup017 真实工具参数 JSON 反复多一个右括号，Pi只回 TOOL_ARGUMENT_INVALID，模型重抄已编译 Binding 而没有计算。Pi Adapter 在decode失败时返回isError结构化反馈/合法schema，不输出原错误原文或凭据；同一Agent正常后续请求纠正，无内部重试/额外请求预算。Application calculate_and_verify说明已绑定方案优先{}，新方法才提交严格proposal。


R1-UX04：真实经营网页运行中显示模型JSON错误诊断，违反复杂细节后台处理/按需查看。仅在现有快速 conversation renderer 的running分支折叠模型中间文本；真实执行/部分成果仍用现有状态投影，最终回复或waiting澄清照常可见；不关键词过滤或改写模型记录，专业六阶段不改。

### R1-RT15：在现有工具回执中集中报告依据
在 Application 内使用已存在 qualifiedStepResults 的真实计划与结果、及当前通过独立 verifier 的结果构建 report_evidence。复用当前授权、身份、材料哈希与 proof 匹配；恢复只读原有效证据，不启动第二个 Runtime 或模型审查器。不新增持久表／结果类型。calculate_and_verify、execute_step 和探索结果返回同一业务依据汇总，明确 report_verification=not_performed；Python 自写 summary 的声称不能决定等级。系统提示要求最终数字来源与实际核验范围一致，派生／因果保持模型属性。这是改善证据消费的普通接线，不声称能确定性证明自由文本真实。原报告及原始失败保留；新增真实回归必须单独核对数字与等级。

### R1-RT16：复用既有精确引用解析
复用 open-analysis-input-references 的 binding 与字段解析，先 source／sheet，再字段。普通单源／多源／退款框架使用同一解析器；不新建语意识别器或数据 schema。ID 精确命中优先，否则唯一完整真实名称；失败保留原参数与路径，工具回执给模型当前选定资料的可用引用，普通技术纠正由 Agent 自行执行。临时合成主链失败及调用消耗保留，真实运行已加载旧版本不得称新修正通过。


R1-RT17 最小通用纠正：main027 生成程序选择中漏掉分组地区列与退款关联键，两次实际 KeyError 已落盘。只完善已有工具对列选择的说明：生成程序前从获准 inspection 对齐全部读列；固定输入中缺列不得假装存在，纠正只能在原材料内修正程序或明确失败。保持同一 Runtime、工具、权限、绑定和预算；不新增预览 Gate、补列或模板替换。


R1-UX05：网页失败路径发现data-detail点击只设置detail，没有设置drawer=true，抽屉初始关闭时按钮无可见效果。沿用既有事件处理器增加打开状态；以真实事件边界核验执行／资料／证据切换及无POST。


R1-UX06 私有呈现对齐：当前真实主模型报告有自检／核验表述矛盾，程序核验仅覆盖实际IR。使用既有消息标签和报告内容区域标明AI解读及证据范围，不改主题、布局、任务流程或Agent自由文本，不把报告整篇升级为独立核验。实际探索与保存失败仍保留；必要时独立Validator判定阻断。

### R1-B1：报告交付前的同 Runtime 证据校对
完整候选 independent001 实际 FAIL：正常网页已保存报告含350/1150→250/1050矛盾与无凭证交叉“独立核验”。旧原文、下载、全部凭证和FAIL保留，不回写。此修正不增加用户确认、UI流程、Provider、数据或自主计算权限。

工程影响决定：报告整理是既有模型解释能力内的有界编辑操作，复用同一 Pi Adapter/Port 和已有凭据/计量/请求边界，不引入第二Runtime、独立模型验真机构或报告核验等级。原RT15不启动模型审查器的实现决定由本节受影响替代；模型校对不是独立核验。Agent分析与Python选择仍自由，后台不以自然语言词典判断业务意图。

主分析得到真实凭证后，用同一Runtime执行一次无工具报告编辑：输入原始草稿、真实独立回执、实际探索输出、用户目标；模型整体理解草稿中的数字、范围、推导及核验表述，返回整理后的中文报告与重要事实对应清单。清单必须引用真实计划/分组/结果/等级；后台精确核对声明数值与对应计算，不能由模型填“verified”升级探索。不增加报告语义纠正循环，编辑请求仍最多一次临时失败额外请求，与备用共用；失败/UNKNOWN保持失败，已有有效计算保留。

分析草稿与校对输入/输出沿既有checkpoint持久保留。Application控制的报告编辑消息使用固定协议标识，同版本恢复读取实际尾段，不重发已完成编辑；普通消息投影只隐藏该内部尾段，不改历史草稿或用户文字，当前答案和下载使用整理后解释。采用独立请求操作命名空间，保持Session/Run/Attempt、材料/权限身份不变；无工具编辑不能触发新计算、联网工具或变更IR。停止、授权、来源变化在编辑前后及保存前再次核对。模型编辑不得决定独立等级，报告仍MODEL_EXPLANATION，真正范围沿原回执可查。

敏感负例覆盖草稿错误交叉认证和数字矛盾、伪造/错误事实引用、未核验探索升级、编辑失败/取消不发布、完成checkpoint不重复调用。正例必须主备真实请求、普通Send自主Python/独立凭证/持久读回及快/专业/下载一致；保持聊天、表达修改、历史/FM-X、账本与重试回归。程序匹配只证明清单引用一致，不宣称确定性证明所有自由文本；当前真实报告全文仍须独立审阅。

R1-RT18（main030实际FAIL）：模型先后将 sheets 数组当成 sheet_id 字典，两次生成相同TypeError，原纠正额度耗尽后保持失败及9次调用。工具契约补足 sources/sheets 都是数组、按实际ID选择元素的通用读取形状；不加入经营算法/答案、自动补代码或额外纠正。此仅澄清已有输入结构，原supervisor/材料范围/单次纠正边界不变。保留实际失败并以继任真实调用核对。

R1-RT19（main031实际FAIL）：生成程序退出0、算出正确探索值，但漏图表unit；输出被拒后模型重抄64位纠正ID发生单字符错误，未启动纠正，原失败/6次调用保留。受影响工程契约采用同任务唯一待纠正操作的 code-only correct_exploration_code 工具，由后台读取并绑定真实pending身份；不要求模型重抄Opaque哈希。旧显式ID接口仍精确检查，新增接口只有确实存在当前pending且已用次数允许才执行；没有pending、其他任务、改变范围、第三次物理执行仍拒绝。不新增纠正额度、输入或运行权限。输出校验反馈仅返回固定字段路径与缺失属性，不泄露原件、异常路径或凭据；原unit字段仍必须由模型正确填写，不能默认补单位。此是已有受控纠正的深接口，不添加业务模板。

R1-B1-REF02（backup021实际FAIL）：实际多轮/探索及10个核验端点已完成，编辑输出将单切片凭证写成不存在的复合group_key，且重抄长plan哈希失真，后台拒绝发布；27次请求及完整草稿/编辑保持FAIL。报告整理采用后台生成、仅本次固定证据内有效的F1…短引用，每个实际分组值或非分组结果绑定唯一引用；模型只返回引用与值，不能自填核验等级或假造分组。旧1.0显式引用保持严格读回，不改历史。1.1清单引用不会提升整份报告，任何未知/错值引用仍拒绝。编辑输入同时包含本任务当前获准原始资料，避免把探索文字推断当原始业务事实；原SDK出站大小/权限限制照旧。短引用只是私有投影，不是新持久ID、资源或权限。


### R1-B1-REF03：最终报告输入与分析草稿隔离
main032 实际报告编辑仅接收编辑尾部 messages，但 prompt 含原错误 draft，重复正文中的演算/自我更正，且把事实清单 value 写成描述句。B1 仍未通过；不能把失败清单转成可接受值，也不能手工更改真实报告作为生产证据。
在同一业务 Session/Run/Attempt、原 Pi Adapter 与已授权配置内，报告整理使用聚焦上下文：当前用户目标、当前获准原始材料、真实凭证短引用及实际探索。不复用分析草稿/错误助手文本作为模型输入；后台完整 checkpoint 仍保留草稿及原调用历史。仅编辑模型的上下文投影改变，不新增 Runtime、角色或持久库；报告内部操作仍有独立持久请求身份，一次额外请求/停止/UNKNOWN/重开语义不变。
报告编辑 prompt 的版本化业务体保留草稿 SHA 而不将 draft 文本发给整理模型；checkpoint 的同身份 body 仍保存原草稿供审计及恢复匹配。完成检查依据实际计算引用，value 为实际结果字符串（例如 430），不含币种、说明或认证句。模型新报告仍需真实全文验证和最终独立审查，程序不假装覆盖自由语言语义。
生成 Python 的标准入口明确只提供 SOURCES 文件路径列表及 OUTPUT 目录；模型须自行 json.load(open(SOURCES[0]))，不存在隐式 x/df/data 变量。NameError 反馈要求用已发出的安全诊断及重新提交完整程序，不替模型写业务算法或增加纠正次数。


### R1-B1-REF04：成功纠正的探索必须进入真实报告输入
main033 实际 Python 第二次纠正成功并保存探索，但原 report 输入只按 explore_with_python 工具名收集，遗漏 correct_exploration_code 成功回执，且包含首次 needs_code_correction。编辑因此将实际已有图表说成执行仍失败。报告输入收集同一 checkpoint 内两种当前工具的真实成功 value/receipt（verification=not_performed）；排除 failed / needs_code_correction，无成功原错误也不伪造。历史失败仍在原完整 checkpoint/执行证据，不能以纠正成功抹除。该修正不变更来源、范围、权限、计算或核验等级。


### R1-RT20：受控程序失败的可用定位
backup023 两次实际 IndexError 均来自 SOURCES[1]，安全诊断仅 category，模型纠正了无关读取逻辑。保留单次纠正上限；给出原生成代码内的有界 payload_line（不暴露 traceback、路径、业务值或异常正文）。仅从 co_filename=<preparation> 的真实 traceback 取最后一帧行号，限定 1..代码行数；Adapter 只转发正整数 1..65536。其他诊断/沙箱/执行资源/文件权限保持不变。该字段是程序定位，不是自动修复或新增 Provider 请求。


### R1-B1-REF05：报告消费实际执行公式
main035现场19项凭证中存在目标写净额但实际单源sum的计划，原报告投影仅goal/operation/filter/group/result，缺少实际IR结构，编辑无法区分gross与refund_net。保留目标为模型意图，不据标题认证业务含义。报告输入为每条已核验计算追加原实际execution_plan；包括多源关联、基础计划、金额倍率等原结构，不由后台猜测或改写口径。grounded_facts同样携带该执行计划，使短引用与实际公式一致。无新计算、权限、持久schema或Runtime；原draft、失败、调用和原候选保留。模型据真实IR及当前资料自由说明，正文仍需真实完整检查，算术等级不认证整个报告。以REF05因果测试证明实际计划进入无draft编辑输入；不把结构测试当报告真实性PASS。


### R1-B1-REF06 scalar reference metadata
Backup026 actual report has correct numeric short references but supplies an unnecessary JSON traversal path for scalar facts. For version1.1, a path is structural metadata and only traverses when the referenced actual value is composite JSON. When the exact scalar value already matches the host-owned fact, a structurally safe redundant path adds no authority and does not reinterpret its source. Reject prototype keys, oversized/nonstring paths, forged references and wrong values unchanged. Composite values still require real own leaf traversal. No text keyword rewrite or new model retry. Add RED/GREEN for scalar metadata vs false values and unsafe paths; original backup026 FAIL remains. Main036 API saved result remains scoped: report prose defects are not closed by protocol PASS.


### R1-RT21 identical rejected binding has no progress
Backup027 repeated set_framework with BINDING_NOT_FOUND more than140 times without a calculation or changed material. Keep all actual calls and elapsed resources. Per run, remember rejected binding call key (tool+args+error). First failure returns the existing diagnostic; an unchanged call failing again closes BINDING_CORRECTION_EXHAUSTED and prevents subsequent runtime actions. New parameters may proceed; successful correction is not blocked. No cumulative spend ceiling, extra retry, provider, changed authority, schema or UI. Stop on no-progress rather than blindly repeating. Scope set_framework/set_multisource_framework/set_joined_framework with PLAN_INVALID/BINDING_NOT_FOUND. Negative TDD must preserve correction with changed actual field and forbid third call/publication after repeated identical rejection.


### R1 报告职责最小调整提案（待用户选择，不是已采用）
当前 main037 的数值链路和落盘通过，但整篇表格把缺少对应核验的切片标为已核验；同时把南区增长主要归于Coffee，而该区Coffee只增加50元、Tea增加100元。原报告保留。report-check-diagnostic001一次有界同Runtime检查仍错误ready，因此不继续同类盲目试跑。
最小可见差异限既有报告展开区，对话/左右栏/抽屉及PX006/PX004布局保持：
1. 后台提供“已核验事实”，只从真实执行计划及结果呈现数字、单位、分组筛选与实际核验状态。示例：1月净额430元，2月620元；1月北230/南200，2月北270/南350；1月Coffee280/Tea150，2月Coffee520/Tea100。各条标识仅来自对应实际凭证，不能由模型标题代替公式。
2. Agent提供“分析解释与推导”，例如净额增加190元、Coffee增加240元、Tea减少50元，并说明相关性不等于因果。这部分可自由探索和解释，不能认证自己、扩大后台核验范围；不把整篇报告或Python自检认证为已核验。
3. 原始输出、失败、历史和核验详情保留；不要求用户逐步确认；原件/越界/真实行动权限不变。
这将改变报告事实与解释的呈现职责，故先给出此具体最小差异，等待用户确认后再实施，不重开原产品方向，不把提案当已完成程序。

### R1-B1-SEP01 用户已确认采用／工程契约
2026-10-07 用户明确“确认。继续实现、回归及独立审查，到用户验收时停住。”采用上面的最小报告调整；先前待选文字保留为历史。
当前报告不再接收模型生成的整篇事实表与核验宣称。私有编辑输出1.2为解释段落（真实短引用列表＋interpretation）及可选比较（before/after真实短引用＋interpretation）；不允许模型填写事实值、单位、计算式或核验等级。后台从当前真实结果、IR及来源生成事实表，比较值与差额由后台精确计算，明确为结果推导、不冒充新独立凭证。模型解释自由表达业务意义、限制和假说，仅归于模型解释、不归于核验事实；不对自由文本声称完整语义证明。
已确认测试边界沿用当前报告Application交付、核心报告组装与网页/下载实际消费者。检查旧整篇自认证输出在当前发布入口被拒、实际公式/来源/筛选/分组与数值直接呈现、未知引用/不相容单位/伪造等级拒绝、原失败/停止不发布、同版本持久恢复不新增调用。旧1.0/1.1历史读回不变；新操作记录output_contract=1.2，不能把未完成旧编辑升级为新结果或静默重新请求。保持单Runtime、材料范围、一次额外请求、账本、全部权限及原UI布局；不引入语言特例词典或额外模型审核循环。


### SEP01 accepted continuation 2026-10-07
用户确认最小报告职责调整并继续实现/回归/独立审查，到用户验收停。原UI/Runtime/材料/权限/账本不变；自动跟进PAUSED。current-input038继任037，非完整候选。separation001/red.log、application-red.log、scope-red.log为真实因果RED；application-green局部14PASS。当前入口仅接收1.2解释/真实比较引用，后台直接组装实际事实/范围/等级/差额，旧历史合同保留。新增共享测试fixture只跟随协议，保留拒绝/停止/历史断言；网页/真实主备/完整回归/独立验收待收回，不宣称B1关闭。


### SEP05 最终整理输入边界（当前继任，2026-10-07）
接受的 SEP01 报告职责包内修正：自由 Agent 分析仍消费已授权真实资料与工具；最终无工具报告整理只消费真实 execution_plan/独立事实、资料行数概要及实际结构化图。原始单元格、未经核验的探索 summary/observations 不再在此环节重新分析；原 audit/checkpoint、草稿、原件与探索证据保持，图不提升为独立核验。assembly-context-red.log 先实际断言失败，实施后 assembly-context-green.log 17PASS。该私有输入投影不新增 Runtime、模式、权限、重试或用户确认。
当前真实 main038 11请求两次生成程序 KeyError 后 FAIL；backup028 17请求9凭证/1探索后连接超时 FAIL；browser039 正常 Send 自动失败，无 Stop，6凭证/1探索保留，未形成最终报告。报告探针001主备各1次结构FAIL；002主备各1次结构/事实组装PASS，但主模型解释仍含错误子类归因和Tea稳定概括，因此整体语义FAIL，不能以探针机械PASS关闭B1。
canonical031全17阶段通过仅继承未变范围；canonical032在前端真实 scope 修改后旧测试仍要求 goal 标题，desktop-unit FAIL 保留。受影响 FM-A03 测试改为实际来源/中性计算标题，其部分失败、证据/等级/无整项完成负例不删。最终独立审查未派发；全部真实失败/UNKNOWN/资源与用户验收停止线不变。


### RT22 私有语义资料引用输入简化（设计先于实施）
backup029 真实失败归因：模型将 64 位指标资料摘要漏写一位，准确 source_id/sheet/row/column 仍被拒绝，并在唯一纠正中复制同一个错误摘要。不能接受错摘要或增加重试。批准 R1 的包内最小修正：新 Agent 资料引用可只提交当前获准资料的精确 source_id/sheet/row/column；后台在当前 task inspection 中唯一查找并补入真实 sha256，再保存原有 1.2 来源记录。显式提交的摘要必须正确；错误/跨资料/不可见/OCR 未确认/不存在单元格均继续拒绝。持久读回仍携带摘要，资料变化或删去已保存摘要仍拒绝。该私有输入简化不是猜业务语义、长期资产权威或新材料权限，不变更存储版本、Runtime 和一次纠正上限。

### SEP06 — actual comparison axes and refund cardinality (independent002 follow-up; spec before code)
Independent002 FAIL preserves complete-candidate-r1-002. B1: grouped region/product totals were read as two-series time trends, the existing before/after example wrongly suggested time direction even for arbitrary groups. B2: host reportPlan invented one-to-one cardinality for refund_net. This ordinary private correction adds actual group-field/key and filter field/value context to report facts, not guessed business periods; comparison reference order is not a temporal guarantee. The same host report surface labels scope comparison, with actual evidence scope. Editor explicitly distinguishes category differences from within-category cross-period change, and must not expand observed periods. No lexical censor, template-only business reasoning, new runtime, model critic or extra retry. Refund text states exact key equality, each refund matched to its unique order, all distinct matching refunds summed; it does not assert an order has only one refund. Old audit/historical reports remain unchanged. Add sensitive RED for actual grouping context and multi-refund report scope; preserve duplicate order/refund and orphan rejection. A report-only real check on retained main039 evidence is a bounded precursor, not a new whole task PASS or B3 closure.

### SEP07 — preserve usable scoped report, do not demand a Cartesian proof set
Actual report-only004 on main039 evidence: primary declined all report output because not every period×region×product combination had proof; backup returned truthful scoped comparisons and explicit missing-cross limits. R1/SEP01 permits partial valid findings, not an exhaustive Cartesian confirmation gate. Within the same editor contract, clarify ready can contain the supported period/category comparison and inspectable limits; absent cross proof restricts that cross conclusion/attribution only. blocked applies when no grounded explanation is possible. No blocked_reason field, fabricated proofs, additional loop, changed retry/authority or renamed outcome. Original current-input043 and report004 FAIL preserved. New bounded real report check is justified by this concrete prompt correction, not an unchanged retry.

### SEP08 — exact comparison facts are report input, not fresh model arithmetic
report-only005 mechanical main/backup PASS but semantic FAIL retained: primary mislabels duplicate net F3/F4 and F7/F8 as two distinct bases; backup describes equal gross region550/550 as slightly lower. Deterministic factual projection therefore supplies each fact's actual calculation kind (refund_net vs true source operation) plus exact pair relation/difference only for same unit, grade and group field. The backend does not infer time or business cause. These are transparent derivations of accepted facts, not a new independent proof, keyword rule, report template, model critic or request. Existing exact rational difference implementation is reused. Original evidence and IR remain available; current editor may freely explain business meaning/limitations but must observe numeric relations and actual basis. Causal RED checks equal region totals, net vs gross and category contrast; old historical output/contracts remain unchanged. One new actual check is justified by new deterministic input, not an unchanged semantic rerun.

### RT23 — explicit program-line transport, not heuristic code repair
Current browser042 automatically failed with 4 independently checked results preserved: first real Python IndexError at payload20 (SOURCES[1]), the unique correction then had no actual LF and100 literal backslash-n separators. A raw code string cannot be safely auto-unescaped because valid one-line Python can intentionally contain string escape sequences. Private exploration and correction tools therefore support explicit code_lines:string[] as an alternative to existing code:string. Each entry is exactly one source line (indentation preserved); Application joins entries with LF once, without guessing or replacing escapes within a line. Exactly one representation is accepted, nonempty bounded lines and total existing64KiB budget apply. Code execution Port/executor receives the unchanged plain program and keeps actual code hash; original tool arguments remain in history. No Pi types cross Adapter boundaries, no schema version/new Runtime/new host/network authority. Existing code-string callers remain compatible. Same pending correction identity, immutable material, maxone correction, sandbox, output checks, source/lease/late/publication guards all unchanged. Agent may generate any lawful analysis program through either explicit representation. This is package-private transport normalization, not natural language interpretation or hidden syntax repair. Ambiguous mixed representation, embedded physical line breaks in one line, nonstring/empty/oversized input are rejected before execution. Add causeRED at existing Application tool seam and meaningful real controlled host line-program test; preserve escaped characters inside Python string literals.

### UI-RV04/FUI04 — grouped partial values are business text, not raw result JSON
Actual browser042 retained valid partial group results but exposed JSON key/value/rows syntax in existing outcome cards. Faithful existing PX006/PX004 projection will display each real group label and value separated by business punctuation, with the original unit and per-step proof label unchanged. Raw result, group rows, identity and proof remain in original storage/inspectable evidence; no JSON reparsing of arbitrary model prose, invented groups, new card/page/theme or UI redesign. Existing member-method special business projection remains compatible. Add client seam causeRED for grouped partial values in failed and historical task states; renderer continues escaping all labels.

### SEP09 — concise business report within existing request time budget
backup031 completed11proofs/1realexploration then report CONNECTION_TIMEOUT;30physicalcalls retained. This does not prove the network/SDK cause. The final editor currently tends to emit repeated limits for every available fact, even though backend already supplies the fact table. Request a concise prioritized business explanation (3–5 interpretation paragraphs, at most3 comparisons, roughly600–1200Chinese characters) rather than repeated per-fact boilerplate. Keep parser/history32-item compatibility, exact references/facts, user goal and truthful uncertainty; no hard style Gate/template, token setting, timeout/retry extension or added physical model check. This is a bounded latency/output hypothesis, not claimed causal network repair or deterministic RED. Actual complete current main/web/backup evidence must decide; no unchanged repeated whole task tests.

### RT24 private incremental tool observations (2026-10-07, spec before code)
Backup032 actual checkpoint contains677113bytes, execute_step tool messages500966bytes across14outputs and a late physical input172271tokens. Each calculation currently repeats all previous qualified scopes; append graph feedback repeats retained nodes. This is a demonstrated quadratic context growth mechanism, not proof that every connection error is caused by it.
Main Controller impact: within accepted R1 observation-driven Agent/Pi Application seam, calculation tool report_evidence becomes current-scope-only; prior actual observations already remain in Pi history and durable qualified_steps. Add read_analysis_evidence as authorized read-only complete current-identity evidence retrieval when needed; final report assembly still reads all genuine current-identity proofs. Explicit append returns new nodes with real IDs and total node count, preserving old nodes/IR/proofs internally. No raw evidence/history rewrite, data/authority widening, source truncation, semantic blacklist, new Runtime, request/retry/timeout/model change. Legacy saved histories remain readable.
Causal RED checks incremental receipt vs repeated previous scope; GREEN also checks full readback and foreign-run exclusion. Existing RT15 accumulated evidence assertions move to explicit full readback, not retired. Normal history retains each scope's value, actual plan, grade and dependencies; final full report remains independent assembly. Current045 real report contradiction and backup032 timeout retained, semantic completeness remains open.

### SEP10 comparison presentation within approved SEP01 (spec before code)
Current046 browser044 andbackup033 bothsaved, actual calculation/chart/ledger evidence retained; canonical037 all17exit0. Backup033 comparison selected NorthJan230 andSouthFeb350 but free comparison paragraph called sameSouth two-period growth, while general interpretations correctly describe actual region/product evidence. Fix redundant output responsibility at existing assembler: host owns scope/value/difference paragraph; current report no longer repeats comparisons.interpretation, which is still schema/type checked and retained in raw audit. Agent business interpretations remain fully displayed in interpretations; model still selects actual pair references. No language blacklist, extra model/corrector, new Runtime, change of model/budget/authority, or UI surface. Ordinary report quality correction under accepted SEP01/R1 concise experience, not new product direction. Stored previous reports/audit/history stay immutable. Test causal RED wrong comparative paraphrase appears despite correctly assembled scope; GREEN confirms exact scopes/delta and free business interpretation remain, malformed field/reference rejection remains.
### SEP11 最终解读路由（先于代码）
复用 Application 已存在的 business purpose `report_edit`，仅在原 Pi Adapter 的模型选择处把 first 指向现有 MiMo，正常分析的 first/fallback 逻辑不变。report_edit 必须 tools=[]；备用凭据未配置便失败，不请求 MiniMax。复用原 ledger report operation 身份、同一 extra 循环、停止/迟到/collect、restore 与 SDK 抑制重试；不增加 Profile、Runtime、版本、Prompt 修补或 UI。已保存旧响应仍历史可读，但不作为新成功证据。
测试沿已批准 Runtime→现有 Pi transport seam：分析实际 MiniMax、报告实际 MiMo、配置缺失无请求、拒绝工具、最多两次 MiMo请求、停止迟到不可发布及 completed checkpoint 无重复。真实验证以固定旧合成材料/证据比较地区排序、商品变化和来源说明，事实仍独立计算。一次有界变更若无实质进展，停止重复模型尝试并如实报告，B1 不能以偶然好输出或机械 PASS 关闭。
## R2 工程设计：报告数字与派生核验（2026-10-08）

接收后在既有 Product Core→Application→Port→Adapter→Profile 边界实施，不新增Runtime或存储表。当前Semantic Context负责业务含义，Binding对接真实字段，IR由Agent增量提出并实际消费；主计算为现成工具或生成Python执行，适用核验器从重读资料另路检查，不能调用主执行来证明同一个错误正确。

### 方案与兼容
- 保留旧1.0/1.1/1.2编辑协议和旧成果读回；生产R2使用新的报告编辑协议。报告阶段仍MiMo/无工具，主模型分析/探索不变，单次额外请求共享上限不变。
- 数值目录从当前真实合格计算与plan/scope生成，稳定身份绑定task/revision/source/plan/group/leaf/单位；不得把模型goal当scope事实。生成程序、图表、自检仍未独立核验。
- 模型只组织自然文字和引用/公式请求，受信数字由后台投影。重要数值主张引用绑定目录；非数量的真实日期/标识可表达。假设/探索单独明确，不能冒作独立事实。无效解释/公式保留诊断与真实有效事实，JSON结构完全不可读仍真实失败，不增加修复模型循环。
- 派生表达式为有界四则树，使用真实引用而非自填操作数；输入精确有理数、单位/币种。独立核对采用运算恒等式而非重复执行求值器；百分比显示显式倍率与舍入，分母0不适用，负基数说明解释限制。存储基础引用、表达式、精确值、显示规则、核验范围。
- 在既有Outcome中增加可选版本化numeric report payload，不增SQL表/索引/并行账本。保存与读回依据当前已验证step/框架/来源重建检查，篡改值、公式、身份、scope或展示文本拒绝。原Outcome无该payload保持原级别，不升级旧PASS。
- 现有quick/pro/下载投影统一使用保存报告与数值目录。UI数字安全链接采用专用data属性而非任意HTML；只展开现有证据标签；输入引用往返保留真实来源焦点。直接HTML、脚本、未知引用不注入DOM。

### 测试及材料边界
原计算/保存/报告/网页公共边界是本次已批准验收所要求的测试seam，不为私有实现参数另设审批。一个纵切先RED再最小GREEN，继续错误/单位/生命周期案例。先离线固定合成数据和正常HTTP/浏览器，再既有授权内有界真实主模型/MiMo整合，保留用量/失败/UNKNOWN；不以模型探针代替原生角色加载读回。

允许：上述现有模块及受影响测试、原OpenSpec、能力增量；条件：正常服务更新/合成材料真实验证沿已核验的权限、重启收回和固定候选身份；禁止：业务数据/凭据明文/安装/新增Provider/宿主改造/新基线/Git发布/自动跟进。唯一证据根 `controller/v11-numeric-reliability-r2-001`，原历史资源不清零。最终独立Validator对完整候选负责，作者不能自签PASS。

R2 实测发现资料引用缺字段后，现有一次语义纠正只返回通用错误，模型误改了正确的消息引用。仅补充有界的参数位置诊断（维度／证据序号／缺失字段），不猜引用、不改变来源验证、不增加纠正或模型重试次数。用于普通工具错误闭环，不为具体单位自然语言增加特例。

R2 经营报告整合回放发现：共同对焦已明确“全部订单与退款”的执行范围，但第一项期间切片误被退款补充计算当作全任务范围。修正仅以已存业务 execution_scope 的订单过滤为防线；无该合同仍保持原首项方案限制。单个临时切片不得覆盖已明确的任务范围；确已限定期间的退款独立总额仍不能越界。原失败、有效净額核验与探索全部保留。

### R2 real-run correction: settled optional exploration failure
A supplementary Python exploration may fail once and fail its single permitted correction. When the trusted execution Port reports PREPARATION_EXECUTION_FAILED / PREPARATION_OUTPUT_INVALID with physical_status settled or not_started, retain the failed operation and return a terminal failed exploration result, without another execution. Independent IR facts remain usable. The report must explicitly state that the supplementary exploration failed and is not evidence. UNKNOWN, source/authority changes, required calculation failure and unresolved dependencies remain stopping boundaries. This implements existing FM-03 partial-result behavior; it grants no new execution or retry authority.

### R2 evidence calculation decomposition
The numeric drawer must show real gross and associated refund operands for a verified net value. Reuse the existing primary join traversal to expose its decomposition without changing public calculation/verification receipts or replaying it as independent proof. Bind decomposition to the same source, plan, slice, unit and actual net result; reject disagreement. Label it calculation decomposition; the separate original-data verifier remains the authority for net arithmetic. Never promote these display operands to independently checked report facts solely from decomposition.
The new calculation_trace is optional display metadata. A numeric bundle saved earlier without it must still validate its original immutable values, text, references and hashes; absence does not invent a trace or change a historical result. Present trace metadata must exactly match current deterministic decomposition. Old R1 outcomes without any numeric bundle remain unchanged.

### R2 report date identity correction
Real final MiMo response correctly calculated the derived result but the quantity guard rejected source periods written as Chinese calendar dates. Preserve amounts as references; normalize valid source calendar identities (ISO year/month/day and their ordinary calendar display forms) rather than requiring literal spelling. Unobserved dates and unbound quantities still cannot inherit calculation proof. This is report identity normalization, not natural-language business interpretation or a case-specific phrase rule.


### R2 NU06 / NR01 实际接线纠正 019
专业循证分析中的最终消息复用快速模式的安全会话投影，真实数字按钮使用同一当前事实目录；历史消息不取得当前凭证。保留六阶段及现有抽屉，不展示内部数字链接语法。
真实 focused-001 显示首次一月子计算误充整体范围，后续二月被拒绝。R2 原生自主模式首次执行绑定前必须由同一 Agent 使用 describe_business.execution_scope 明确整体获准来源/工作表/固定筛选；缺失时返回未执行的具体工具续接信息，不锁定第一子切片，不向用户重复确认、不默认扩大全部资料。已保存旧框架仍保持原范围与修订约束，真实越界不能通过该续接绕过。


### R2 NR07 范围检查与未支持分支 028
整体 execution_scope 验证只验证真实来源、工作表和固定筛选包含关系，不提前执行算法/关联唯一性检查。步骤编译仍在其原有方法检查处记录未支持/关联失败，已核验前置与失败分支可共存。复测026的3项失败是范围预检提前抛出方法错误导致，保留日志作为因果RED；不移除负例或把失败支改为成功。


### R2 NR02 数字与范围一致性 029
最终报告不是通用自然语言证明器。对实际分组键与明确等值筛选，后台按真实事实目录检查数值所在短句的来源字面标签/有效日历别名是否与引用一致；明确互换期间/地区不能得到数字按钮身份，含混多范围句不冒称已核验。未覆盖的自由业务解读仍明确未做独立语义/因果核验；底层事实表永远采用真实 scope。占位已经带真实单位，不接受在其后另写万元/币种/百分号造成换单位。此为报告投影的来源与量纲检查，不替代Agent自然语言理解，不向用户逐数字确认。

报告范围检查继任以 numeric_report.scope_contract=1.1 标明实际算法，旧无此字段的已保存报告按其原契约精确读回，不改写旧哈希或追认新的检查。仅当前新生成报告采用新检查；所有字面匹配不是自由语义证明。


### R2 NR09 已失败补充探索的显式恢复 035
一次纠正后的已停止失败必须从既有 checkpoint 的 needs_code_correction.correction_of 与随后 failed/rem0/not_performed 回执还原，不因刷新/显式恢复丢失失败说明或重新取得第三次执行机会。仅识别既有两类准备失败的已终结回执；UNKNOWN、未完成纠正、撤权或源身份不符不转为可忽略失败。不新增会话/账本/表。

### R2 独立审查002后的既有NR02呈现修正（实施前）
派生名称与正文使用相同的数字、实际输入范围及核验声称边界；公式正确不能使模型名称中的无源金额或错范围成为事实。仅放行语法上明确的列表编号/版本标记和本段references内的真实F/D引用，不放宽金额、数量、百分比或不存在的引用。保持LLM理解业务，程序不加入业务词典。范围与单位检查仍有效。
新增可选scope_contract 1.2表示该呈现规则，原1.1及无标记报告按原规则读回，不改写历史文档/哈希。Context内部开关只用于已保存版本的确定性读回，不对模型开放。此为既有Outcome内的兼容呈现版本，不新增存储体系或权限。
先保留标签注入/已知错范围/版本编号/裸事实引用因果RED，再实现通用规则及原报告身份回归。实际浏览器下载UNKNOWN保留，必须真实下载文件与同版本数字/限制读回，不用后端副本替代。

### R2 正常网页验证发现的资料提示修正（实施前）
NU01/既有资料授权边界：新建分析清空待提交资料时，同时清除上个草稿的选定资料提示，不显示与实际提交范围矛盾的旧状态。采用现有快速工作台点击与文件选择公共交互做因果RED/GREEN；不继承资料权限、不改变上传、模型路由或已保存历史。normal044旧失败保留，normal046北区场景单独收回。

### R2 当前部分报告的默认答案兜底（实施前）
NR02/NU01：normal046第2版真实有效80/270/190/237.50与partial无源解释并存。默认摘要若完全没有已绑定数字链接，不隐藏已有报告的事实/派生段，而在现有对话位置保留它们及限制；不采用被拒模型数字、不重发模型、不变更已保存报告或核验等级。正常已含数字链接的摘要及历史无数字合同报告保持原显示；沿用原表格/链接渲染和布局。

### R2 实际下载呈现修正（实施前）
NU05：normal046浏览器实际报告文件已落盘，事件超时保留；下载数字依据附录不得把已有百分号display再次拼接百分号单位。仅修正副本字符串呈现，保持精确值、报告哈希及历史Outcome不变；使用现有编译报告到副本公开接口的因果RED/GREEN。

## R2独立继任002原因声明修正051（实施前）
NR07/产品§4禁止把数字公式核验当成原因、因果、业务定义或资料完整性核验。现有派生标签能注入“原因已验证”。在既有compileNumericReport公开边界增加此类超出数值证据权限的正向核验声明检查；正文及标签同一边界，普通“原因待分析/尚未验证/无原因资料”仍可表达。因持久1.2报告已存在，新增scope_contract1.3只用于新报告；显式1.2/1.1/无标记保留原确定读回，不改旧哈希。不增加模型重试或新Runtime/存储。因果RED在旧实现证明注入能进入verified，GREEN保证拒绝且保留其他有效数字、旧1.2逐字读回；完整回归及独立复核。

## R2默认自然答案修正052（实施前）
独立B04：048把全部核验表放入默认对话，违反NU01/NR08。本修正仍在现有openTaskView公开UI投影边界，不修改已保存结果、Agent文本或业务事实。当解释缺少可用数字链接时，从同Outcome的有效numeric_report.values生成简短自然段：最多3个基础数值、4个派生数值，使用原标签/显示单位和原引用，长标签仅在摘要省略，完整含义在原抽屉及展开报告。不以模型被拒段落填充答案；保留简短缺口提示，完整解释/核验表按需展开。正常有数字解释和旧非数字合同保持原摘要。使用保留真实normal046第二版不新增模型请求，核对正常1440视口首屏、数字按钮及专业/导出同值。历史默认展示可适配，原Outcome/报告哈希不重写。

052正常读回追加：默认基数名称截断不能让两期看起来相同；仅压缩生成核验标签中的关联及倍率技术后缀，保留实际来源与筛选/期间前缀；派生自然名称保持。使用现有UI投影反例保证两期可辨，无新增模型调用。

052标签含义补正：压缩倍率后缀，但不得删除主表达式的减退款部分；否则会把净额错误标为订单求和。基础值显示原标签首个倍率分隔段（不删减号右部），派生名称照原；抽屉保留全部。053测试的“隐藏关联退款”意图应改为保证关联含义保留，仅隐藏倍率，这不是用户要求隐藏业务计算口径；保留数值/期间/无核验表全部原断言。

## R2认证同义声明边界055（实施前）
独立003确认B04关闭但认证“原因已被验证”“因果关系核验通过”绕过狭窄谓词。采用按语句检查的证据权限边界：原因/因果/业务含义/定义/资料完整性主体后有认证谓词，除局部明确否定、待办或疑问以外，不能进入数字证据支持的解释或标签。支持被动句和无“已”的核验通过句，不依赖两个新样例的逐字名单；“原因尚未验证/原因需要进一步核验/不能证明因果”保持可表达。新scope_contract1.4，1.3用既有窄声明版本确定读回，旧1.2/1.1继续原规则；不回写历史。新增公开compileNumericReport正反例/旧1.3身份保持；既有104重点、适用完整回归、类型、独立复核，不新增模型调用。

### R2多声明检查057（实施前）
独立004指出同分句首项否定遮蔽后项肯定认证。检查须遍历各认证匹配，否定只作用当前匹配，不放行整个分句；正文/派生名同一路径。新报告1.5，旧1.4以冻结single语义读回，不重写旧哈希。不扩大算术核验为因果证明；不新增Provider、Runtime或资料权限。公开compile反例先RED，再最小修正与兼容回归。

### 用户试用比例修正059（实施前）
用户截图及正常Mini网页显示主区1390px而thread/composer各限860px，右侧闲置530px。沿PX006左会话/中对话/右抽屉，不另造UI。内容与输入区在可用主区占满并对齐；抽屉打开时按剩余主区适配，窄屏不横向溢出，保留滚动、输入与旧双模式。只修改既有样式覆盖；不改变数字/模型/任务/持久记录。沿既有真实浏览器布局公开边界，geometry RED→GREEN及原77客户端/工作台回归；不新增测试缝或审批。


## Workspace060 用户试用增量（2026-10-08）
用户批准现有左右分界线拖动、资料点击部分预览、缺失分析目录补齐。沿用 PX006。
UX60：桌面左右分界线可拖动／键盘调整，保护中间宽度，抽屉关闭不占位；窄屏保持既有覆盖抽屉。保存浏览器布局偏好，不触发业务写入或模型。
UX61：资料卡在原资料 tab 内展开当前展示版本的真实工作表表头与前10行。标注预览／总行数，值转义，表格独立滚动；无资料不伪造。
FS60：项目已有 Projects/<创建命令UUID>。新分析为草稿，首次发送持久任务时建立项目内 analyses/<task UUID>；修订复用目录，独立新任务另建。目录标识文件说明UUID与数据库位置；现有数据库仍是资料、历史、核验与报告的权威。不批量迁移旧任务。拒绝链接或已有冲突目录，目录失败不得宣称创建成功。
沿用公共渲染／任务视图／Store 接口检查，不增加 schema 或并行状态权威。

UX62 用户继续明确批准增量：顶部侧栏收起／展开；最左独立窄入口栏，插件入口只占位（web-crawl/data-cleaning/model-mlflow/reports-factroy/decision-platform/metric-factory），现有Xanthil仍是当前工作台；不实现插件／外部权限。账户为明确静态占位，不伪造登录、额度、身份。设置提供实际本机布局重置。收起不丢任务、草稿或资料，刷新保留布局选择。沿用绿色与现有三栏，不照搬Codex品牌。

## R3 engineering contract decision / first weighted slice (before code)
Add additive executable IR 1.9 weighted_mean with explicit value column, weight_column, existing group/filter/source bindings. All 1.0–1.8 bytes retain deterministic readback. Primary execution reads every selected pair, uses checked scaled integer accumulation; independent adapter rereads original rows in reverse with separately implemented BigInt rational arithmetic. It never calls the primary executor. Negative/missing/non-numeric weights refuse affected calculation; zero weights contribute zero; total zero is explicitly WEIGHT_TOTAL_ZERO, cannot produce a numeric proof (not-applicable presentation remains an affected integration task). Exact result, selected row coverage, grouping, source and unit identities checked before proof. Existing measurement wrapper scales value field only; weights remain dimensionless. Model business schema/reference resolution expose actual supported operation, not arbitrary Python promoted to a proof. Existing serialized IR gains a version and optional weight binding, no database migration/new persistence authority. Candidate store/report/reuse consumers require affected tests before declaring slice integrated. Existing public compile/execute/verifier and application/store/UI seams are retained under approved engineering ownership.

R3权重凭证契约补充：新增可选weighted操作数元数据，分子与权重总额及各分组由独立路径逐项重算并比较，不只是结果相等。旧Value缺字段保持历史身份；新1.9必备操作数，度量包装保留输入原倍率操作数，不将无量纲权重标成货币数值。

R3现有数字依据接线（实施前）：复用calculation_trace可选显示合同，为实际1.9凭证显示已独立核对的Σ(value×weight)、Σweight及精确商；度量包装显示输入/输出倍率，区分权重无量纲与结果单位。仅本项数值/操作数受支持，不提升业务/因果结论。无trace历史仍用includeTrace原确定性读回；原三栏与证据tab不变。实际Store保存/重开报告验证该投影。

R3零权重不适用纵切（实施前）：同1.9凭证重核实际分子、权重总额、纳入行数。总权重零的标量/分组输出null字面，不造零或除零；凭证证明的是适用性检查，数字目录标status=not_applicable/value=null。有有效分组时保留其数值，不因另组零权重丢弃全部。度量包装保留null，报告、默认答案、抽屉及持久读回必须明确不适用，不把它呈现成数值核验通过。已有零权重拒绝历史保留；独立adapter也重核null条件，不接受非零权重伪造null。

## R3占比纵切契约（实施前）
Add IR2.0 group_share: same selected numeric source, explicit one grouping field and filters; amount sums within each mutually exclusive physical group divided by the same all-group signed total, multiplied by100 with percent unit. Reuse decimal sum base1.2 actual all-row execution and its independent original-source audit; ratio relation verified by separate inverse cross multiplication. It is a row-bound additive amount share, not implicit distinct entity count or proof that external population is complete. Zero total => null/not applicable per group, signed shares remain negative or above100, no clamping. Partial display cannot redefine denominator; source filtering deliberately defines entire population. Required group/aggregate operands carried by new optional relation metadata and independently checked; old IR1.x unchanged. Actual source/hash/method/coverage/unit and full grouping retained, exposed through existing tool schema and evidence/report/store consumers. No new runtime, storage authority or permission.

## R3可加总贡献纵切（实施前）
Add IR2.1 group_change over two explicit grouped decimal-sum bindings (comparison/current), same declared input unit and additive group basis, no guessed periods. Primary reuses each bound all-row sum, aligns the union of actual group keys (new/disappeared group has absent side zero), calculates per-group changes and signed total-change shares. Independent adapter runs original-source audit on both component receipts, then independently checks subtract/inverse share equations and changes sum total. New optional comparison metadata binds both original totals, each group operands, total change and ratio; outputs remain under same immutable Outcome. Total change zero retains absolute changes and marks contribution ratio not applicable; no causal claim or arbitrary multifactor interaction decomposition. All current/old/derived facts trace the same result proof; UI/numeric catalog must distinguish money and percentages and preserve actual sources/filters. Ordinary numeric evidence display and current steps reused, no new approvals or runtime.

## R3成本分摊纵切契约（实施前）
IR2.2 proportional_allocation explicitly binds one ungrouped cost-pool numeric sum and one grouped weight field (one unique row/object after declared filters), declared final amount unit, rounding.decimals 0–6 and rounding.method=largest_remainder/tie_break=object_key. No omitted rounding default, equal split fallback or secret adjustment. Positive/nonnegative weights, nonempty unique object keys; zero total weight refuses affected allocation. Signed cost pools use mathematical floor at declared quantum and distribute remaining integer quanta by largest fractional remainder, then stable object key. Pool must exactly fit quantum; otherwise require a real rounding decision. Optional existing measure applies to cost field only before allocation; weights are dimensionless ratios. Independent verifier rereads both bound components via existing audits, checks each amount against floor/ceil proportional entitlement, total conservation and remainder ranking using extremal selected/unselected comparison rather than repeating primary sorting/allocation. Individual checks mandatory; conservation alone never PASS. Output/optional allocation operands remain same immutable Outcome, without new storage/runtime/permission.

### R3 多表核对增量合同（IR2.3）
VC-06首期沿两个明确来源／工作表、实际金额字段、精确键及筛选执行一行一键的一对一核对。模型明确左右显示名、粒度one_row_per_key与cardinality=one_to_one；不猜去重、期间、单位或关联键。复用已绑定分组金额计算；单位换算在原measure边界先进行。独立路径分别从原资料重核左右分组金额与记录数，另行按键集合检查漏配、差额与总额关系，不调用主核对执行器。重复键定位并阻断完整核对，不汇总掩盖多对多；空筛选沿既有NO_DATA边界，不冒称空账为零。结果同时保存实际左右记录、匹配状态和差额；核对检查一致仅指差异结果可靠，账目一致须所有键两侧匹配且差额为零。重要差异、漏配和未核验范围随答案说明。新增IR及结果元数据仅在现有工具、凭证、Store、报告／版本／抽屉消费，不建立独立对账系统；原历史版本不改写。

### R3 多方法语义接线纠正
真实多轮回执暴露同一formula维度重复而无invalid_fields诊断，模型将其误判为来源字段问题。保持既有语义维度唯一合同，不 silently 拼接不明口径、不放宽证据；工具描述要求同一维度用完整组合说明，诊断精确标出重复维度及single_interpretation_per_dimension。只复用原一次纠正，不增加重试／Provider权限。多个方法仍由模型理解并在各自IR绑定实际范围。

### R3 单位绑定拒绝的原子性
真实003显示：bind_measurement先替换内存semantics，再编译/保存框架；失败后旧框架与新内存不一致。继任修正要求候选语义先完整编译与保存成功才替换活动语义；拒绝绑定保留既有口径及凭证，下一合法计算仍可推进。不放宽币种、倍率、来源或修订边界。

### R3 换算对账结构沿用
2.3经过现有1.8单位包装仍保留其左右名称、键粒度和基数结构；提取结构以实际底层operation为准，不以顶层版本号漏掉方法信息。新任务重新绑定和核验，不复制原成功。

### R3 金额与占比的同任务推进
真实004完成加权平均575/2后，被同来源占比的输出百分比阻断。执行演进比较应区分输入金额与输出比例：2.0引用input_unit作为输入单位，比例本身不套货币换算；保持任务语义、金额字段及固定范围不变时，可转到占比。币种/输入单位改变及范围越界仍拒绝。

### R3 业务等待结束当前Runtime回合
Application已形成真实澄清/修订等待时，通过可选只读shouldYield回调告知既有Pi Adapter。Adapter在下一次模型请求前结束回合、保存实际工具历史并交回Application持久等待；不是用户取消、不调用账本stop，不发额外Provider请求。显式用户停止、权限撤销及迟到UNKNOWN仍走原路径。旧Runtime消费者可省略回调。

### R3 VC-05有限守恒检查纵切
在既有Python探索记录上增加可选total_check请求：明确图表和真实成本池proposal，后台实际计算/独立核对成本池，再将探索图表全部序列化数值按精确小数求和比较。仅证明该图表合计与指定成本池数值一致，不证明逐对象权重、覆盖、业务规则或算法正确。保留MODEL_EXPLORATION/not_performed；新1.1探索记录追加有限检查回执，旧1.0不变。失败同样保存，报告/既有证据位置显示重要限制。不执行新程序、Provider或真实资料；不新增核验平台。


### R3 混合计量字段：同一任务的金额与非金额数值不能被一个全局货币标签覆盖。在有来源的计量绑定增加可选 unscaled_inputs（实际 source/sheet/column 与原样单位 label），由 Agent 解释绑定，不按中文关键词推断。所有实际指标字段均属于同一已声明原样单位时可原样计算；货币字段仍按原倍率换算，未绑定、混合单位、重叠声明拒绝。无此可选字段的历史 hash 不变。固定业务范围及语义下只允许已声明字段演进，不放宽货币单位和筛选。


### R3 报告呈现契约1.6：有实际数值凭证的父引用可解释其自身已存在的子项；不存在或越父的子引用仍拒绝。描述执行参数（例如小数位）须对应实际引用方法的真实IR，不从模型自由文字推断；不豁免金额、比例或因果认证。以scope_contract1.6保存新呈现逻辑，历史1.0～1.5按原规则重新核对，保留旧partial、FAIL、报告hash。


## R3 分摊执行范围纠正（VC-05/13）
成本池及权重操作数均须逐一核对原 execution_scope；IR2.2 继承成本池 base 不意味着忽略 inputs[1]。allocation-scope-red001 为前置条件导致已拒绝的诊断 PASS，不作因果 RED；red002 使用同一合法分摊计划及固定权重筛选，实际漏拒绝，建立因果 RED。只纠正操作数遍历，不扩大资料、工具或业务算法。


## R3 正式离线测试接线（VC-08/11）
canonical-portable001实际exit1，CI-CHECK-001固定fixture清单遗漏本增量新增测试；新coverage-ui-r3.unit.test.mjs还未出现在正式desktop-unit命令。补齐本期固定清单并显式加入该现有UI测试，不删除旧测试、不自动接受未来未知测试，不改分档/required数量/工具链/真实模型禁用条件。本次保持完整portable入口与失败阻断。


### R3 normal Runtime parameter-feedback correction
VC-08/09 normal browser found malformed proposal extra fields rejected by existing SDK anyOf validation, then model interpreted the truncated generic errors as unavailable current versions. Preserve exact original schema, arguments, failed checkpoint and effect denial. On decoded business-schema validation failure, return TOOL_ARGUMENT_INVALID with the current tool parameters and explicit no-execution/no-auto-repair information, retaining the original validation detail. This applies uniformly to nested business tools, not special data labels or methods. A corrected model call must still pass the identical validator; no hidden retry, argument rewrite or relaxed assertion. Public Pi Runtime seam causal test verifies rejected arguments execute zero effects, real tool-result feedback exposes current parameters, corrected parameters execute once, original checkpoint and request ledger remain exact.

### R3 native percentage presentation correction (VU-02/03)
Current native share/contribution values are already percentage units; display must append %, without multiplying again. Successor report scope 1.7 includes this presentation; prior scopes 1.0–1.6 recompile with their original bytes and remain immutable. Existing UI can append a missing percent sign when reading historical numeric values, without changing stored proof or report. Model report references must copy actual catalog IDs, including exact structured IDs when present; no invented example child paths, automatic repairs or new retries.

### R3 revision preview stage alignment (VC-10/13, FM-X)
Normal-preview013 retains94 requests and original saved revision3; latest preview fails BINDING_CORRECTION_EXHAUSTED, no new calculation. Proposal-only tools correctly exclude physical calculation/code execution, but shared system text still directs those calls and final numeric reporting. Keep common meaning/scope/IR binding and every effect check; condition physical execution/exploration/report completion instructions on the existing execution stage. Preparation ends with actual candidate Binding and change impact, no new fact/report certification. No new role/runtime/retry/scope/UI or automatic adoption. Public Application preparation test verifies current instructions agree with available tools, changed Binding compiles, writes/physical executions/verification remain zero.

Preparation feedback must also agree with physical capability: interpret_meaning/bind_measurement cannot report a persisted framework or request calculate_and_verify in proposal-only mode. Return saved=false and next_action=bind_framework after clear measurement, retaining real unresolved-conflict and missing-measurement actions. Preparation must bind actual changed IR even when an old framework was recompiled in memory; only execution-stage feedback may claim its actual saved receipt or request calculation. No automatic reframe or extra Provider retry.

Proposal-only instructions must require an explicit compiled candidate via the existing framework or step tools. Execution-only required_plans auto-consumption instructions cannot tell preparation to skip framework binding; historical facts remain historical and no preparation action computes or adopts a revision.

### R3 preparation history authority correction
Existing answered discussion previews are incorrectly projected as "当时待澄清的问题". Preserve their bytes and all user questions, but label them as historical model replies, never current pending questions, execution instructions or authority. The genuine current waiting question remains in clarificationQuestion and semantic evidence stays separate. No keyword classification, forced calculation or automatic adoption; this is a private prompt projection correction, not a new persistent contract or UI. Test verifies historical answered instructions remain available and accurately classified while current natural intent and explicit Binding/effect checks are retained.

### R3 immutable historical semantic provenance readback
Normal adoption019 and isolated frozen Store replay020 both fail CONTEXT_CHANGED. Current rev3 framework context validates against actual11 current/history/preview user questions but fails against its own single question. revise snapshots deliberately omit nested history; decode currently validates each snapshot alone, losing real prior-user-message provenance. Keep stored snapshots byte-for-byte and the existing schema. At decode only, supply a private validation view of earlier same-task/same-selected-scope snapshots and matching earlier preview user questions; do not import later revisions, other sources, Provider grants, current facts, outcomes or verification success. Preserve every identity/hash/context validation and foreign/unknown-message rejection. This is an internal validator-context repair, not schema creation/migration, permission expansion or automatic resumption. Causal public Store test covers third revision after second-revision semantics cites first-revision message; assert original snapshots and failures survive, reopening reads back, unknown-message frame remains rejected.

### R3 accepted execution semantic-stage alignment
Normal022 shows real adoption succeeded (rev4), then the Agent followed generic pre-calculation interpretation instructions, attempted to re-interpret the already accepted semantic context, hit unchanged FRAMEWORK_REVISION_REQUIRED and stopped with zero new proofs. Preserve that failure and fixed semantic boundary. Execution of a confirmed framework should consume its existing meaning/measurement/source context, inspect materials and advance tools; initial common-focus instructions apply only before acceptance. Explicitly expose accepted semantics in this existing stage prompt and request new meaning only for an actual business ambiguity/conflict. Do not weaken equality/authority/scope checks, rewrite model arguments, introduce auto-retries, or silently grant new input units. The same known execution public seam verifies stage prompt no longer orders initial interpretation and autonomous appended IR still computes independently under the fixed basis.


### R3 VC-10 / FM-X preparation transaction correction025
Actual normal preview after narrowing a task returns FRAMEWORK_REVISION_REQUIRED. Evidence-only diagnostic025 reproduces without Provider: describe_business sets the candidate north scope; interpret_meaning then recompiles the inherited all-scope frame before any changed IR is provided, failing the existing fixed-scope check. Preparation must accumulate candidate business/semantics/measurement without automatically rebinding an inherited or intermediate plan. Its explicit set_framework/set_analysis_steps must compile the new source-bound candidate against those values before ready; no write/calculation/adoption is implied. Execution behavior remains unchanged, including semantic equality, actual scope/measure checks and confirmed-plan protections. Preserve old frame bytes and reject an explicitly proposed candidate that violates the new fixed scope. Add causal preparation regression covering both unscaled interpretation and monetary binding, valid narrowed candidate and wrong-scope candidate; no semantic authority or sandbox expansion.


### R3 VC-10 candidate business scope027
normal-preview026 compiled5 methods but two omitted the requested region filter; inherited old all-source execution_scope silently remained the candidate business scope. Do not parse Chinese or rewrite IR arguments. For a preparation whose inherited framework has an explicit execution_scope, that prior scope is historical context rather than a freshly focused candidate scope. The same model must submit describe_business for the candidate before set_framework/set_analysis_steps or other actual Binding. Until then return a machine-readable needs_business_scope tool receipt (no extra user confirmation). Once submitted, the existing compiler enforces every actual IR against that candidate scope; a full-scope node against north-only candidate remains rejected. Plain initial/simple preparation without a prior explicit scope retains existing behavior. No new permission, schema, runtime, retry or UI.


### R3 VC-10 focused preparation history030
Normal preview029 ended BINDING_CORRECTION_EXHAUSTED with no candidate; all153 calls are terminal. Preparation prompt repeatedly embeds entire answered model drafts, including obsolete full-company denominators, even after explicit north-only correction. Project user history and immutable preview records remain intact. Project only historical user requests into the current preparation model prompt; include the immediate parent clarification only when actually continuing its waiting preview. Prior assistant drafts remain inspectable history, not repeated candidate instructions. Current user request stays last; semantic user-message IDs remain unchanged; actual scope/measurement/IR compiler, no-calculation preparation, authority and retry limits stay enforced. Causal test replaces the former draft-retention assertion with preservation of user history and exclusion of obsolete assistant instructions, and tests an actual active clarification remains available. No UI or persistence contract changes.


### R3 bounded preparation recipient comparison031
User explicitly approves one bounded same-material comparison: existing MiMo prepares revised actual IR, MiniMax executes analysis, MiMo edits reports. Use existing business Runtime run purpose proposal_prepare, no SDK-specific type leak. Pi Adapter accepts optional exact preparationComparisonTaskId; only matching task and purpose select existing backup as first recipient. Nonmatching tasks/execution retain current route; absent backup fails without silently selecting MiniMax. Shared one extra request, authority, scope, tool checks, deadlines and ledger remain unchanged. Service composition has a temporary exact synthetic-task binding for this comparison, removed on collection; no global credentials/config, UI, new Runtime, Provider or persisted schema. Tests at existing public Pi Runtime seam prove matching preparation and nonmatching/execution routes, actual tool observations and durable recipient records. Failed comparison stops, no fresh model rerun.


### R3 preparation native arguments032
User agrees to preparation tool/context correction and one bounded same-material real recheck, preserving original MiniMax execution/MiMo report route. Introduce business run purpose proposal_prepare solely to select a Pi Adapter transport projection. For this stage expose existing original structured parameters directly through the installed Pi tool API, with no arguments_json wrapper or duplicate schema in description. Validate original schema before any business effect, preserve malformed/failed parameters/checkpoints, actual scope and calculation boundaries. Execution keeps historical codec behavior and replay compatibility; no global schema retirement or public persisted migration. Existing Runtime/Application seams test nested actual argument consumption, bad/extra fields rejection, corrected real tool result observation and checkpoint roundtrip. No Chinese parser, silent argument repair, Provider switch or retry increase. The one normal synthetic verification is bound to existing task and capped at12 model turns as a command-local bound; record its tool history in approved local evidence using existing continuation callback, remove diagnostic/bound from service composition afterward. Not a new production budget or automation.


### R3 precise measurement feedback033
Actual native032 trace distinguishes rejected share input_unit label (CNY元 vs bound CNY/人民币元), allocation output label disagreement and malformed argument structure from arithmetic scale mismatch. Preserve every check and original model argument; return a bounded safe detail field from the existing business compiler at the share input_unit conflict and expose it through the existing tool error receipt. Tell the model current field, supplied label and approved alternatives, not to split calculations due to falsely asserted scale mismatch. No unit alias guessing or auto-normalization; model corrects and rebinds. Existing preparation native transport is retained; no additional real call authorized after032 collection.


### R3 incomplete multi-step preparation034
Actual032 returned ready after rejected multi-step binding followed by several single-framework calls, retaining only the last scalar cost sum. Once preparation attempts set_analysis_steps, the complete multi-step proposal must successfully bind before it can be offered as a ready replacement. Single framework calls remain useful intermediate checks, but do not clear this unresolved multi-step intent. Track this within the active Application run only, clear on valid step plan, otherwise end ANALYSIS_INCOMPLETE without adoption or user clarification invented. No persisted schema, text parsing, calculation or additional confirmation. Plain single-method preparation is unaffected.


### R3-036 Native validation feedback
Real035 exposes native Pi pre-validation anyOf errors naming unrelated branches when weighted_mean/group_share/etc are supported but required fields omitted. Keep exact advertised business schema and unchanged arguments. Use installed Pi tool prepareArguments only to run the same original validator first, returning structured current-parameter error on rejection, without executing or normalizing. Pi validation remains enabled. Preserve bad call/error and allow model correction; no automatic repair/request or semantic guessing. Contract test through real installed Pi must reject native bad args with current schema, then accept model-corrected args once.

### R3-039 Idempotent measurement binding
Real038 shows identical monetary binding reordered in inputs rejected as revision. After full existing validation, compare exact same field mappings as unordered sets (including scale and nonmonetary labels), fixed currency/output scale/label; if equivalent return original semantic assessment unchanged. No normalization of meanings, currencies, labels/scales or loss of history. Genuine differences still generate changed semantics and existing FRAMEWORK_REVISION_REQUIRED gate. Tests require reorder equality and unchanged previous hash, with scale/currency/drop/label negative differences.

### R3-041 Adopted step execution readback
Real040 model redeclares plans rather than consumes accepted multi-method graph; initial runtime context exposes first plan, not accepted IDs/proposals, and evidence reader omits current graph. Return current_steps with exact stored step IDs/proposals and put this same approved graph in confirmed execution context. With graph present direct model to execute existing ready nodes; no mandatory second required_plans declaration. Keep actual dependency/source/scope checks and model responsibility to choose execution; no synthesized plan, automatic permission or waiver.


### R3-043 stored step execution context after waiting
A waiting reply can clear confirmed_plan while retaining the currently bound step graph. Runtime receives the actual stored IDs/proposals for any retained graph, explicitly as existing proposals rather than a renewed confirmation. It may consume nodes through execute_step; existing authorization, identity, business-scope, dependency and semantic checks remain authoritative. No DB restoration, graph replacement or automatic acceptance. Model must not retype the same graph and accidentally omit fixed filters. Existing Application seam tests cover confirmed execution and waiting continuation.


### R3-048 branch-local schema diagnostics
Actual MiniMax preparation emitted numeric IR versions and string-valued empty filters; long anyOf errors from irrelevant versions caused repeated wrong corrections. Add bounded diagnostic parameter_issues derived from the same existing tool schema, selecting exact discriminator branches when unambiguous, then checking field types/required fields. No parameter rewriting, aliases or extra retries; installed validator still accepts/rejects. Preserve full original schema and original bad parameters; diagnostics only help model make its next explicit correction. Test at existing native Pi Adapter contract seam, invalid types do not execute, corrected model tool call executes once.


### R3-052 Pi multi-step preparation wire codec
051 normal MiniMax complex multi-step preparation still cannot bind string IR versions/scale and empty arrays, despite field diagnostics; response-only with no executable candidate.050 native and existing JSON carrier both preserve a small exact plan. Reuse existing execution JSON carrier only for proposal_prepare set_analysis_steps, retaining other preparation tools native. This changes Pi wire representation only; decode validates unchanged business arguments, original schema and business Ports remain unchanged. prepareArguments validates decoded original before SDK outer carrier validation. Malformed/raw arguments and ledger are retained; no coercion, aliases, model/provider or extra retry change.


### R3-054 keep preparation and execution instructions separate
053 actual response-only: model obeyed043 stored-graph consume/no-rebind instruction during proposalOnly, preventing an executable candidate. Scope that continuation instruction to execution only. Preparation retains read-only stored graph facts but must explicitly bind candidate through the existing setters; calculation tools remain excluded. This is a phase-correctness repair, not a new workflow or automatic adoption. Causal Application test starts with an existing graph, prepares a real successor and verifies no execution tool is offered.

054 RED additionally exposed an unconditional existing-node immutability guard in set_analysis_steps: it applied to proposalOnly and rejected a changed successor before candidate return. Restrict this guard to execution; preparation still cannot execute, save an outcome or publish an accepted framework. Existing execution evolution guards remain unchanged.

### R3-057 runtime-local semantic reference handles
056 actual semantic correction failed: model truncated a64-character message_id while combining duplicate formula dimensions. Use runtime-local message:1..N handles in model-facing message list and interpret_meaning; exact lookup resolves to existing canonical semanticMessageId before Product Core validation. Canonical stored provenance/schema unchanged, no fuzzy match or fabricated evidence. Unknown handle still rejected. This private tool representation does not change meaning, acceptance, authority, retries or UI. Test causal RED for known handle binding, unknown handle rejects, persisted evidence remains exact canonical identity.

### R3-059 preparation instructions require actual binding when preparing/revising
058 normal model returned description and asked adoption, no executable candidate; reply cannot be adopted. Current proposalOnly instruction explicitly says only describe proposed plan and impact, conflicting with binding requirement. Replace that wording with actual binding requirement for a preparation/revision request, retaining response-only ordinary discussion and no calculation/adoption in preparation. No keyword router, new UI or automatic conversion of model prose into IR. Test existing successor preparation system explicitly states binding requirement.

### R3-062 fixed-scope preparation feedback
061 real group_share omitted the explicit north predicate, correctly rejected by context compiler. Application treated this proposal-phase failure as an accepted execution revision and yielded to user. Add exact missing-scope diagnostics (source/sheet/current/required/missing filters), retain the same strict rejection. Only proposal preparation receives one bounded scope-correction return, shared existing step correction allowance; never auto-add filters. Execution revision guard remains unchanged. Uncorrected preparation remains waiting/unbound, not accepted. Model explicitly resubmits corrected IR.

### R3-064 incremental preparation follows existing step-tool contract
063 real FAIL STEP_CORRECTION_EXHAUSTED after5 successful calls. Stop repeating large full-graph retries. Existing tool says prefer append, yet proposalOnly workspace lacks agentLed and rejects append. Permit append within proposal preparation (still no execution/publish), allowing first replace batch then incremental subsequent batches with real returned IDs. Existing compilation/scope/semantic/dependency validation and shared correction limit unchanged. Execution append still requires agentLed. Preparation instructions explicitly distinguish old graph vs new candidate start. Test two actual batches resolve dependency and return complete candidate, zero calculation/saves.

### R3 067 adopted execution action in runtime turn
066実际采纳后模型仍被原始准备问题驱动，7成功请求、零凭证。已确认采纳的执行回合在Runtime当前消息中明确传递产品动作元数据，原始业务问题/用户原话/语义引用保持不改写；仅当frameworkConfirmed且非proposalOnly成立时追加执行动作，准备、普通讨论、未确认任务均不获得该动作。动作不授予新资料/Provider/业务权限；仍由身份和工具授权检查，停止/未知保持有效。不靠模型自由文本宣称新授权。

067排查更正：Application已经在modelPrompt附加采纳执行动作，不能重复修正该处。真正缺口在Pi Adapter：只要有continuation就continue，忽略本回合input.prompt。针对末尾user与当前prompt不同，追加当前Application消息后再执行；末尾tool继续收回，末尾已完成assistant保持被动读回，不重放工具/模型。原始用户消息保留。初次red067误用Run.question而非prompt，非因果证据；撤回该测试，正式因果RED067b在真实Pi seam证明当前prompt丢失。

### R3 070 new proposal working graph is separate from historical graph
069单项方案真实5次调用仅answered无候选，原候选图仍限制新单项绑定。proposalOnly准备的working stepPlan从空开始；原config.framework及持久历史不修改，讨论不绑定时仍只是回复。新多步候选通过replace/append从真实新节点构建，不把历史图默认复制进候选；实际执行继续复用已采纳图及immutability。单项变更用实际framework工具可落单项候选，不必重抄历史步骤图。业务语义、原授权、源身份、版本采纳及工具检查保持。

### R3 073 owned current-action message projection
072单项真实计算核验/主备报告保存通过，但Application generated current action显示为用户气泡。只在task.confirmed_plan存在且checkpoint user文字与Application实际生成前缀+本任务原question完全一致时，投影不显示该内部消息；不以关键词隐藏用户文字，不改持久checkpoint或语义引用，真实用户问题与回复仍展示。历史查看按各版本自身question及confirmed_plan核对。

### R3 076 报告正常表达约束对齐
真实075五项计算/独立核验通过但报告partial：模型在每段添加未绑定的“节点1”等序号，并把加权收入解释为单价。保持当前数字/范围/单位/语义核验，不对白名单扩大、不删失败、不复制已验数字为模型自由值。报告生成指导用实际方法/范围命名，不附数字节点序号；方法不改变业务指标含义。原partial与超时保留，随后仅在同一任务已有资格内重新生成报告并读回。

### R3 077 Engineering impact decision: report-only continuation
076 response-only exposes missing report continuation. Add no-argument rewrite_saved_report tool only with current saved numeric evidence, selected by Agent rather than keyword routing. Workspace reuses report_edit Runtime and numeric compiler. Optional preview.report={outcome_id,outcome_sha256,numeric_report} is backward-compatible and allowed only on answered; validate original outcome hash, baseline, current proofs and source. Ledger uses preview model-request identity; numeric qualification uses original outcome identity. Select latest report for same outcome in normal dialogue/report/export, retain all earlier expressions and original outcome. USER expression edits remain separate. No new table, Runtime, Provider, UI surface or permission; additive internal contract within approved VC-10/11/12. Existing ownership/stop/current-config fences apply.

080诊断：078/079正常报告续接连续CONNECTION_FAILED，无新报告、原计算不变。为定位真实接入错误，在Pi Adapter内存中仅提取HTTP400-599、明确status_code/API Error数字码与固定error type白名单；日志只含请求ID/provider/这些安全字段，不保存SDK错误文本、body/header/Key或资料。不改变重试/路由/授权，也不将失败追认为通过。

082实际081诊断HTTP529/overloaded_error，原CONNECTION_FAILED记录保留。只将已识别529服务过载归类NETWORK_UNAVAILABLE临时服务不可达，复用现有共享一次额外请求，不新增类别/SDK重试/主端点或权限；未识别HTTP400仍普通失败。需因果RED/GREEN及真实继任验证。

084实际083只有answered说明、未选择rewrite_saved_report且未另存报告，不追认GREEN。为Agent显式声明：用户要求保存/重写现有报告且不改变实际范围时，应选择已提供rewrite_saved_report；普通解释/致谢可普通对话；改范围走准备。选择仍由LLM完成，后台不关键词路由/臆造选择，不新造UI。需因果测试及真实继任。

085真实报告续接2MiniMax+1MiMo全部成功，另存MODEL报告，原Outcome/五凭证不变；report partial含REPORT_UNBOUND_NUMBER/REPORT_UNSUPPORTED_CLAIM，normal-report085保留。086修正通用报告指令：探索存在时才说明探索状态，不虚构；精度等方法配置留在范围明细，不填无引用数字；原核验器不放松。085作为实际RED，需真实继任GREEN，当前尚非整体完成。

092 NR07/VC-09因果限制语句修正（代码前）：091逐段重编译定位第三段“不是原因证明”误拒绝；不得通过降低因果认证检查解决。检查每个主语/谓语，支持紧邻主语之前的明确否定系词；该否定只作用于当前主张，不能掩盖同句后续肯定认证。保持历史报告不重写，真实091仍partial，需继任真实补验。

092兼容性决定：报告检查语义必须版本化为scope_contract1.8，新增仅否定主语解析；1.1～1.7仍按各自原规则验证，不迁移或重编译旧报告，不改变原计算/凭证。沿用既有可选检查版本字段，无新表/Runtime/权限。

096 VC-08/09通用绑定纠正：已说明货币与无量纲字段时，首次框架之前完成任务所需字段单位绑定；未绑定字段返回真实字段位置及缺失绑定，不冒称缺少用户单位说明。保留固定语义/范围及已有结果不可改写限制，不靠修改币种、倍率或逐项人工审批解决。095已收回19请求、0凭证、waiting；保留失败，补当前反馈因果RED/GREEN，再真实继任验证。

098 VC-10真实097发现方法2.1/2.2/2.3参数误提交compiled字段后反馈parameter_issues为空，Agent误认不支持，反复重写。通用诊断须在已选version分支报告多余属性具体路径；不删除参数、不转换、不接受错误、无内部重试。097已有4凭证及Python探索保留，报告partial与准备阶段实际执行冲突均为失败待修，不能称五方法泛化PASS。

101续话准备边界：LLM理解用户实际意图；已授权正常执行仍连续推进。用户明确仅准备/等采纳时，先绑定实际候选，调用既有ask_user结束本轮等待执行选择；不得仅最终文本声称未执行却让声明IR被后台落实。复用已有等待/clarification/框架保存，不新增Runtime、状态、审批系统或关键词分流。测试必须声明真实多方法IR、保存框架后等待，确保无主计算/独立核验/Outcome，再以实际正常继任补验；指令测试不能冒充真实模型理解PASS。

103 VC-09/13单位包裹分组结果一致性：102b实际篡改外层value后group_change错误未拒绝，为因果RED。逆单位核验前核对外层value所编码分组与实际groups完整一致；允许JSON对象键顺序差异以兼容当前持久读回，字段/类型/数值/分组不能差异。不能重建并覆盖错误输入使其获证；沿用独立逆关系和来源重新核算，无新算法/权限。原RED及不受影响计算保留。

107实际RED：105五节点准备成功、采纳被CONTEXT_CHANGED拒绝；隔离106追踪到历史decode中的exploration(x,t)，它漏用了其他消费者已有validationTask。最小修正统一采用已按task/scope/revision过滤的历史验证上下文，不变更持久schema、来源/权限或语义检查。


### R3 报告113包内决策
normal-report111及diagnostic112真实最小复现：不构成对变化原因的证明被误判；普通贡献比例本身已独立核算。在现有否定主语分支允许有限名词修饰，遇转折/肯定认证谓语仍不放行。仅新scope_contract1.9使用该规则，1.8与以前兼容重编译沿用旧分支。既有numeric_facts附其已生成/核验的calculation_trace，不新造报告算法/Runtime/权限；后端核算事实存在时报告按现状解释，不继承旧准备指令。保留原份额/分摊错误自由解释为MODEL失败证据；实际新版模型验证另行取证。


119: normal-scope118六成功请求后answered，无新框架/凭证却声称后台将计算，为真实FAIL。read_analysis_evidence说明适用于实际执行，准备分支却仍返回相同声明回执。最小分支返回needs_candidate_binding，复用stepProposalPending拒绝未纠正的结束；成功set_analysis_steps原分支关闭该pending。不是关键词路由、新Runtime或自动重试。

119回归纠正：已成功绑定的同一候选IR随后只读声明不得重新置为未完成。仅对不属于本轮explicitlyBound候选的结构声明置pending；来源、方法、筛选、单位结构比较复用requiredCalculationKey。旧框架不构成本轮绑定，未绑定负例继续拒绝。green119c九项真实回归失败保留，green119b另含未设置工具链的来源读取失败。

122准备反馈：120真实waiting/框架空；ask_user当前只有text把执行选择等同业务问题并在返回时丢弃候选。增加仅工具可选purpose business_clarification/execution_choice（默认前者），Agent语义选择，不用关键词；proposalOnly且本轮explicitlyBound完整候选且无pending/未解决semantic冲突时，执行选择回执交已有采纳控件并返回真实proposal；不执行、不自动采纳、不得绕过真实business question。

127真实125 trace明确set_framework weighted_mean+numeric_mode:integer被PLAN_INVALID拒绝，却仅回needs_information。保持现有weighted rational合同禁止numeric_mode/value_mappings；抛method_parameters安全诊断，由原safeTool回needs_parameter_correction并明确未绑定。工具numeric_mode描述说明适用方法，不增加重试、业务关键词或接受错误。


130 VC-10/FM-X：方案准备输入须区分历史与当前要求。历史问答完整保留为明确标注的非执行上下文数据，不把旧报告重写/旧范围等指令重新呈现为本轮待执行命令；当前用户消息单独标注为本轮有效要求，Agent负责意图理解与工具选择。实际权限、候选绑定、采纳与核验边界不变，不新增中文关键词路由或隐式重算。129真实选择旧报告而忽略仅东部方案为失败证据；永久输入契约负例及真实继任验证，不把指令测试冒称模型成功。


132 VC-10/FM-X: Preparation supplies the actual saved proposal recipe and explicitly unbound current candidate. Historical model claims are not tool receipts. Recipe includes methods/sources/filters but no compiled Binding identity or inherited authority/proof. Current tool binding/adoption/recomputation remain required. Real131 asked for adoption without any actual candidate: FAIL. No new runtime or persistent contract.


136 VC-10/11: A saved report-expression preview must retain immutable earlier same-task/scope semantic-message provenance when its base becomes historical after adoption. Validate its original calculation, frame and report against the exact base and actual prior messages, not against the narrowed snapshot alone. No later-revision/different-scope message may rescue invalid provenance. Real133 ready five steps; normal134 adoption failed CONTEXT_CHANGED. Isolated135/135b reproduces at previewValidate report→outcome→historical semantic evidence. No weakening of source, plan, proof or numeric report identity.

138 VC-09/10/12: Report-only model input declares actual grounded-calculation availability and current expression action separately from historical question text. Numeric facts are current computed/check-qualified inputs; historical prepare wording is not an active wait/adoption instruction. Each interpretation must list every used placeholder locally and state the specific supported method/range, preserving existing numeric/reference/certification checks. Real137 five new independent proofs saved, report partial rejected missing reference and unsupported claim; only expression successor may change, no repeated calculation.

## R3 independent review144 correction145 (before code)
VC10/VU05/06: do not mutate model semantic/background or immutable persisted tasks to fabricate current understanding. Current UI labels saved semantic/business as background when precise execution_scope exists, explicitly shows actual compiled scope and actual state first in both quick/pro context. Original preparation request remains explicitly historical intent; current state derives from actual task lifecycle, not text heuristics. Task current scope, step filters and actual proofs remain inspectable; no new UI/page or model call.
VC04/06/09/VU02: new numeric trace_format1.1 applies scale to entire signed difference, grouped fractions and missing side arithmetic neutral operand with explicit nonmatch status. Legacy stored report without format keeps original validation/hash; new report owns corrected trace. Optional versioned trace metadata in existing report, no separate storage or permission. Negative/fraction scales and legacy roundtrip tests required. Existing results/history never rewritten. Recovered exact historic session transcript supplies RED test inputs/commands/order only if actual outputs corroborate.

## v1.2 frame co-creation — design boundary and first result

The business draft precedes executable OpenFrameworkCheckpoint. Preserve existing task authority and SQLite operational storage; do not equate a draft/preview/review with an active lease, computation, permission grant or evidence. Keep shared Product Core/Application/Port/Adapter/Profile boundaries and Pi infrastructure types private. Existing methods and proof contracts remain unchanged.

First integrated result: same-task clarify-only draft -> real allowed auto-save/readback -> optional branch view and whole-framework review -> explicit qualified execution consuming the exact accepted frame -> current-version results/coverage. Professional first stage projects this same state. No separate sandbox navigation/runtime/state authority.

Persistence contract decision before code: additive optional draft/version/source records in the existing task body, legacy records remain readable and immutable; keep command identity, optimistic revision check and atomic write. No new database, user file migration or permission schema. Confirmed execution plan remains tied to executable identity; draft-only edits cannot upgrade it. Reject concurrent stale writes and preserve caller edits on failure. A material comparison must use business structure (purpose/scope/method/evidence) with provenance; not infer meaning through keyword routing or hash changes. Model proposes normalized structure, backend validates it; no-op never clears valid review.

Candidate provenance and review/qualification separate from calculation proof. Changed frame contributes real Context/Binding/IR parameters/steps/evidence inputs; unsupported branch exposes unmet requirement rather than fabricated conclusion. Results need exact basis references, not merely preview text. Authority filtering uses existing selected-source/grant and ledger boundaries, no prompt-only enforcement.

Runtime-specific contract and implementation are pending the required actual standard; no SDK/default migration implied by newer standard. UI composition proceeds from accepted new seam and existing later R3 shell. Source comparison already shows accepted draft references shared PX006/brand/workspace styles while production has its separate quick-analysis-workbench styles; this indicates drift risk, not a proven computed-style root cause. Actual matched-viewport visual readback is required before claiming fidelity.


## v1.2 Runtime v0.3 impact decision (before implementation)
Latest user adopts v0.3 and permits required conflict correction; this supersedes the prior pending-standard/no-SDK-migration assumption. Keep one existing business Runtime Port and Pi Adapter; replace its infrastructure implementation by exact shared package, not a parallel runtime. Application owns framework/IR/state/evidence; SDK owns Pi loop/protocol and neutral effect callbacks. Existing SQLite operational authority supplies persistent atomic budget/audit adapter with stable task identity; do not put SDK state in UI or reuse a memory-only store. Proposed configured limits must be explicitly closed before dependent production admission. Existing historical ledger records and unknown requests retain identities; do not manufacture reserves for old requests or claim they were SDK runs.
Public SDK configuration hashes include model route, limits, tools and options. Product tools currently vary by purpose/plan and final-report interpretation deliberately uses a different route; all these must be tested against same-task CONFIGURATION_CHANGED before implementation, never evade via per-call task IDs. If no compatible neutral mapping exists, record the precise shared-contract gap rather than fork SDK or weaken stable-task budgets. Existing attempt accounting and once-extra retry must compose with SDK fallback without duplicate admission/accounting. No automatic activation of thinking/parallel or settings UI replacement; preserve approved layout and host isolation.



## User decision — fivefold finite cumulative task limits

User explicitly supersedes the preceding unlimited policy for Change005 v1.2: modelCalls=1000, toolCalls=5000, outputTokens=4000000, wallTimeMs=18000000 (300 minutes / 5 hours cumulative active time, not a 5-hour calendar lifetime). All physical attempts, main/backup requests and relevant tool effects share the same stable business-task account. Refresh, new Attempt, framework revision, service restart and Runtime reconstruction never reset it. Unknown use retains conservative reservations; historical use/UNKNOWN is preserved, not silently zeroed or guessed. Exhaustion closes new admission, preserves valid partial results/history and gives an accurate explanation; it is not permission for automatic budget extension, new task IDs or retries. Existing per-request timeout, once-extra-request maximum, authorization and explicit stop fences remain.

The project-local install authorization and concrete limits are now closed; no repeat startup confirmation. Exact SDK0.3.0 dependency installed with scripts disabled, using fixed tgz SHA76c379b611593b1753de50e2d43ef8c136bdf4e1c562351daf864d54bdaf69d5. Offline cache miss retained; subsequent authorized installation exited0. Installation and policy recording do not establish actual SDK Adapter/budget consumption or product validation. Continue causal RED→GREEN and implementation at the existing approved seams; independent review/user acceptance remain pending and automatic follow-up PAUSED.


## RT12-03 first persistence slice — controller contract decision
Existing task/request databases validate exact schemas; adding SDK tables would break legacy readback. Use one project-local SQLite operational sidecar `.xanthil/desktop/pi-runtime.sqlite` for SDK budget/audit in the existing personal Adapter boundary, without migrating or modifying old task/ledger data. This supersedes earlier speculative task-body accounting; not a new business state authority. BEGIN IMMEDIATE/FULL acknowledged commits enforce cross-instance lease/config/limits identity. Active ownership persists after crash; no expiry/autoresume/force release. Historical usage/UNKNOWN reconciliation is required before real activation, not cleared by this slice. Public seam: budget.claim and lease snapshot/reserve/settle/release. Focused pinned Node --test tests/integration/xanthil-desktop/shared-runtime-state.integration.test.ts followed by typecheck/old ledger regression.


## V12-03 non-executing draft save slice
Reuse OpenStoredTask with an additive optional requirement_draft record (ownversion1.0), independent draft business revision and receipt sequence. Content holds normalized MODEL_PROPOSAL business scope, investigation methods/evidence and optional support/refutation/insufficient previews; never proof or execution permission. Persist at existing atomic task-store boundary. Save command includes expected draft revision/sequence and command UUID; exact retry is idempotent and conflicting retry is rejected. No running/UNKNOWN/pending-stop edit changes in-flight input. Save/readback preserves task identity/state/epoch/framework/outcome; actual outcome invalidation/admission happens only through later explicit revision/execution path. Normalized content comparison owns draft business revision, raw user message changes do not force material revision. This is data storage, not claim that the model already produced qualified Context/IR. Focused tests at actual Store save/read seam; empty source inspection already supported by current conversation tasks.

### Shared SDK fixed-purpose plan (user-authorized compatibility)

Keep analysis/proposal/report business purposes in the existing Pi Adapter. The shared SDK0.3.1 candidate snapshots each purpose's mode, ordered model route, tools and execution/thinking policy at runtime construction. Entire plan plus task limits forms a single immutable BudgetStore configuration. Rebuilding with the same plan preserves usage; changing any purpose cannot silently continue an old task. Tools execute only the construction-time host capability. No new parallel Runtime, per-phase business-task identifier or quota reset. Old task admission requires historical use/UNKNOWN reconciliation before production activation; no automatic migration. Phase selection does not add a retry; once-extra physical request rules remain. Durable snapshot is a copy of last acknowledged commit; effect admission/settlement still atomically checks current owner.


## V12-03 Application draft save admission (before code)
Expose the existing non-executing Store save through the same Workspace. No model, configuration/credential read, inspection, computation or grant is triggered by save. Respect service close, current local execution/admission and same-task durable reserved/issued/UNKNOWN requests before save; the Store still owns optimistic receipts and input-state fencing. Existing results/identity remain unchanged. The draft is not an execution framework; adoption/Context/IR consumers remain a separate incomplete slice. Focused causal tests at Workspace save/read/reopen, physical pending and close boundaries.

V12-03 transport: authenticated current page control may POST the versioned draft command to the existing task requirement-draft endpoint (bounded128KiB); passive normal task GET returns persisted candidate state. Reuse current same-origin/session/control checks, Application admission and Store receipt; no standalone authorization or execution endpoint. Conflict/save failure keeps acknowledged prior state and caller edits; no model or file effect in this route. Test real loopback HTTP plus real personal Profile/SQLite with all model/credential/reader callbacks forbidden.

V12-03 client: a draft save uses one generated command UUID plus expected receipt sequence. Persist only task/command/sequence identity in existing pending storage, never contents or permission. Lost/5xx response remains pending; refresh only reads same-task durable receipt and cannot execute or resend. Acknowledged 4xx rejection clears this operation marker so retained editor input may be retried with current sequence. Validate receipt before clearing pending; acknowledged save does not grant analysis.


## V12-RT credential composition correction (user authorized 2026-10-09)
The user confirms zcode uninstalled and authorizes reconnecting existing Keychain and actual MiMo validation. Normal host credentials use current environment/Pi main source and the existing development Xiaomi LocalCredentialStore supplied privately by composition. No zcode scan unless explicit legacy compatibility fixture/source option. No SDK key discovery, duplicate credential store or global reconfiguration. Private snapshot refresh still requires permission; status/model dispatch never rescans. Keychain unavailable is unreadable, absent is missing, malformed is invalid; do not silently substitute an alternate source on conflict. Revocation fences late refresh results. Public tested seam remains authorized credential refresh/status/withCredential; same previously approved models/routes, no Key in public status/audit/evidence. Existing synthetic legacy-source fixtures explicitly opt in and remain.

### V12-RT stable SDK tool boundary (before implementation, 2026-10-09)
The shared purpose manifest must stay fixed while the Application chooses a narrower current business tool set and richer descriptions for framing/execution. Keep one private Pi Adapter dispatch tool with stable SDK metadata; its current catalog is supplied as business context, never as mutable SDK configuration. Its captured host callback resolves only the current OpenAnalysisRun tools, rejects duplicate/unknown names and malformed JSON, validates the original schema using existing direct TypeBox dependency without coercion, then rechecks current authority/stop/yield immediately before local execution. Model-provided names cannot widen authority. SDK types remain in the existing Adapter. No new Runtime, SDK loop, dependency or public Port is introduced.
The first slice verifies this boundary with the installed public SDK and a deterministic neutral transport, including exact actual local result observation, two current tool catalogs under one pinned task and common persistent budget, invalid argument/name and revoked/stop denial. This is not production activation: legacy request-ledger settlement, checkpoint/yield semantics, historical budget import/UNKNOWN and real production route migration remain explicit next work. Error-to-business waiting/correction mapping must preserve original contract before the production factory is switched.

### V12 RSUI-05/09 saved draft display slice (before code, 2026-10-09)
Project the actually acknowledged requirement_draft from the same task Store into quick/pro shared task view, separated from compiled execution framework, identity and any existing numeric result. In the accepted central card expose 查看完整框架 using the existing expandable workspace; professional first stage reads the same record/version, not a second draft. Methods, required evidence, unknowns and qualitative previews remain candidates; previews use a closed native disclosure marked 待验证，不是分析结果. Saved draft/history and existing results coexist without granting execution, resetting state or treating preview as a Finding. All text is escaped with existing prose utilities. This slice is readonly display/readback; AI generation, editing/autosave UI, review/admission and real Context/IR consumption remain explicitly open, and no static prototype replay is activated.

## V12 SDK 中性检查点与持久确认（授权后实施）

共享 SDK 的 runAgent 公共边界为测试与实现接点。宿主提供版本化中性消息历史，持有产品任务／Run／Attempt 身份、事务及可读证据；SDK 只转换至 Pi 原生 Agent 并推进原生循环。模型完整输出（包括工具调用及 reasoning 续接块）在交给 Pi 执行前等待宿主保存确认；工具结果在继续模型前等待确认。保存失败返回 STATE_FAILED，不绕过或依赖观察用 onEvent。回调收到副本，不可修改运行输入。停止或截止发生在保存期间时，不再准入工具或下一模型，也不发布迟到成功。后续纵切补充业务 yield、显式输入恢复与历史结构校验，旧公开入口默认行为不变。

### v1.2 共享 SDK 旧资源接收

生产接线前，在既有 project-local Runtime State 中新增内部历史接收回调。新 SDK budget 第一次 claim 同一业务 task 时，以可信宿主核实的旧模型／工具／输出 token／资源单位／累计活动时间初始化；保留来源指纹。只接收已对账、非负安全整数且明确完备的记录；不可核实或 UNKNOWN 必须返回 STATE_FAILED，不能猜零、自动解除旧占用或启动 Provider。初始化与 lease claim 在同一 SQLite 事务，失败不能留下部分新账本；已有 SDK 消耗不被再次初始化或重置。该回调只由 Profile/Adapter 维护，不接受模型内容、网页按钮或检查点作为资源权威。旧证据／账本保留，不删除，真实生产迁移另外核对唯一写者与旧 Runtime 已收回。

### CK-03 Adapter 私有检查点持久 ACK
在现有 pi-runtime.sqlite 中新增私有检查点表，与预算及安全元数据分开存储。宿主提供稳定业务 operation 键及中性 SDK 检查点；事务 FULL 提交后 Promise 才确认。读取校验摘要、所属任务和 operation，不自动运行、发现其他会话或给予权限；SDK 仍负责完整协议历史验证。保存前拒绝已停止信号，正文最大 2MiB；不进入审计或业务 Port。原 v2 数据无损迁移到 v3，其他未知 schema 拒绝；失败不替换已确认记录。生产 factory 尚未接入，不能以表存在宣称能力完成。

## V12 需求沙盘主线纵切：只理需求与自然共创
沿现有 Workspace/Store/Runtime Port 及原浏览器接缝，新增 submit.mode=requirements 只创建同任务，不启动分析；默认 submit 不变。discussion 命令绑定任务、draft sequence、command UUID 和本轮用户原话；只在现有模型/材料授权有效、无正在运行或 UNKNOWN 时调用原 proposal_prepare 用途。当前资料与草稿提供模型上下文，仅公开 update_requirement_framework 工具，不提供计算、Shell、资料扩展或结果保存工具。模型组织业务框架、方法、证据、质性支持/反证/不足预演，以及最高价值澄清；后台只核对结构/身份/权限/来源，不能硬编码业务问卷。实际工具调用原子保存框架和本轮用户/模型对话，持久回执后业务 yield，不新增第二次模型请求。自动保存失败保留旧确认及 caller 输入；无工具提交不标成功。下一回答消费上一草稿及保存对话；纯表述不升业务 revision。后续整体审阅与开始分析是另一显式效果，不能由沙盘工具准入。
验收沿已批准 Workspace/Store、真实 HTTP/client/UI 和原 Context/IR 消费 seams：至少两个回答改变实际框架；本纵切先验证无分析效果、保存回执、停止/迟到/UNKNOWN/idempotence。生产 SDK 迁移和真实 Provider 必须另有实际证据，不以 Port 合成响应冒称模型智能已验收。

### V12 需求沙盘审阅、材料与实际执行纵切
仅原主 Agent 实施，SDK0.3.2接入及自动跟进保持暂停。复用原 Workspace/Store/HTTP/client/UI 与分析 Application，不改变 Runtime factory。
在原任务 JSON 中增加可选审阅回执和本次执行引用（业务框架版本/content hash、材料 hash、分析 revision），不新增数据库或表。审阅整体框架仅保存人类审阅回执，不调用模型或计算；no-op保留审阅，内容/材料变更使旧审阅不再适用但不删除。显式开始由 Workspace 核对当前版本/审阅、物理请求占用和有效模型配置，原任务版本内冻结框架输入；历史成果保留，新的执行使用原 Application 和真实 Context/Binding/IR/计算核验链。模型看到实际目的、方法、证据和获准来源，不能仅传 hash；候选预演不作为计算事实或报告证据。已有执行范围约束照常落实。
只理需求创建和手工保存无需模型配置，不伪称模型回复；在显式模型共创或开始前才核验/绑定有效配置。手工编辑为可选完整框架自然语言块，不做强制问卷。资料添加只在用户选定且显式提交时进行本地检查，保存不运行，材料变更保留旧历史并使审阅失效。UNKNOWN先对账，运行中禁止改输入，迟到保存无效。HTTP所有写操作沿用当前会话/control/origin保护；lost ACK仅被动读回精确回执。

### V12 非底座保存／资料／版本续接（2026-10-09）
用户明确仅继续不依赖底座改动的产品逻辑、保存与 UI。所有共享 SDK、Pi Adapter、依赖和相关真实调用保持 USER_PAUSED；本纵切不更换 production factory。
沿既有任务 JSON 保存资料增补命令回执，绑定 command/input hash/current identity，追加仅用户本次选择的资料。检查后重新核对当前任务；停止、修订或占用变化时不发布迟到资料。相同命令同内容只读回已提交回执，不再次检查；新材料产生新的分析身份、保留历史，使旧框架审阅失效。浏览器只暂存命令身份，不持久保存文件内容；未知回执只 GET 对账，不重复上传。
手工草稿停止后可显式恢复编辑，不调用凭据或模型；有在途或 UNKNOWN 时仍先对账。正常分析修订剥离当前旧 requirement_execution，旧执行引用仍保存在历史，不将旧框架冒称新版本。
需求执行快照增加实际用户原话来源：手工命令消息与已确认对话用户文字，按当前框架版本冻结。Application 的原 semantic message 来源目录接收这些文字，保存与验证仍核对来源身份；模型回复和候选预演不能成为用户事实来源。方法／证据进入原 Application Context/Binding/IR 消费，不修改 SDK。
现有完整框架显示业务前后差异、重审／重算影响及历史；口径／方案抽屉在未执行阶段显示当前需求候选，专业第一阶段显示同一任务版本。手工保存不声称已理解或已绑定未明确范围，缺失内容保留待明确。

### 产品话术标准采用（2026-10-09）
用户已批准 [产品话术标准 v0.1](../../../docs/governance/product-language-standard.md)。本次仅替换生产网页固定文案与状态投影，不改按钮效果、业务流程、权限或底座。原用户文字／模型回复／历史报告原样保留；保存成功仍须真实ACK，UNKNOWN不变为成功，核验覆盖及外发告知不省略。测试沿已有网页renderer/client接缝，检查待确认方案与开始分离、未保存不显示已保存、未知不能继续，以及原R3分级。

### SDK040 authority seam and persistence impact
复用persistent-runtime-state的同一SQLite budgets/audit；新增SDK040绑定元数据仅存Session/Operation→Task/purpose与配置身份，不存第二份对话/队列。JSONL唯一会话内容权威，目录project/.xanthil/desktop/pi-sessions，0700，禁止模型文件工具访问；所有访问包围跨进程O_EXCL锁，崩溃残留锁不偷取，UNKNOWN先核账。显式输入与current授权决定读/控制范围，close不删除。审计增加中立session/invocation/失败标志及session.control，字段逐项验证，不存原文。旧预算/审计/checkpoints不改值；新增schema幂等向前兼容，旧包回滚不读取新会话。新任务和已知无调用任务可建立原生所有权；存量未知或旧配置budget不能静默改身份。专业内容固定版本在原methods目录，raw Pi类型只在SDK内；Adapter只消费中立值，Port仍业务语义。

### SDK040 native interaction boundary
The neutral Runtime Port owns session inspection and queue control. Application supplies the current task identity and authority; inspection never creates a session or issues a model request. Queue messages remain in native JSONL, not business SQLite. Native branch navigation advances only on an explicit authorized command. Historical model checkpoints are retained and require reconciliation before migration; new native tasks do not generate Application protocol checkpoints. Returned history is an evidence projection, not another continuation owner. Selected professional resources are passed as existing business preferences and expanded by the native loader.

SDK040 对话分支只复制原生已结算对话，不复制/新建业务Task、授权或预算。私有宿主登记分支会话的Task/purpose归属和当前选中会话；队列/消息仍仅原生JSONL保存。显式导航通过SDK navigate推进并共用Task预算；读回/选择元信息不发模型请求。业务版本与结果不因对话分支变更而取得新验证效力。发生未核实原生在途操作时核账返回UNKNOWN，单有bindOperation记录不能证明外部效果已关闭。

### SDK041 persistence impact
沿既有budgets JSON行增可选策略及inputTokens/reservedOutputTokens，无另造Session或账本。finite行形状与值不改变；新行严格校验策略/安全整数，reserve/settle/release在BEGIN IMMEDIATE/FULL内原子确认，任何溢出回滚。未知预留不能结算为零。新旧配置拒绝直接互换；迁移未实现时明确保留旧任务，不复制消费到零任务。040包/预像保留，回滚不将unlimited行交旧包。

SDK041 单次配置关闭：用户明确采用工具60000ms、控制IO10000ms；模型输出4096/请求30000ms复用既有有效配置。新获准任务unlimited；旧有限身份直接切换仍拒绝，待显式核账迁移。当前真实补验累计10/30次、2792/120000输出token，30分钟窗口从原real-validation-budget001 began计，不因041重置。

041真实接入发现声明IR发生在bind_measurement之前，实际执行经Context编译成measured IR，但requirement匹配仍保存旧plain IR。修正readback/收尾判定：对未显式measured的声明按当前获准source/business/semantics重新编译，匹配actual structural key；显式measured保持固定。复用原编译器与来源检查，不剥离倍率/来源/范围字段，不改计算/独立核验器。

SDK041-UI01 在既有运行控制接缝补齐中性位置投影（entryId、角色、最多120字符摘要），不公开Pi类型/工具原始参数，不另造历史引擎。默认无摘要模型调用的导航只选择上下文，原业务SQLite成果仍按当前版本显示；新分析继续原Application核验。未知/在途状态在Application和授权回查双重拒绝分支/导航。

SDK041-REC01 沿historyOwnership分支消除Application输入旧协议副本；持久业务检查点完整保留，并继续作为报告/核验引用。测试用已保存业务检查点和真实原生Adapter验证重建下一轮的实际输入。

SDK041-REC02 为当前Application运行增加中性当前业务状态（当前版本、当前方案与当前核验条数）输入，明确原生历史不承继本版完成状态；不清空Session、不新增模型请求、不修改执行鉴权或数字护栏。

## SDK041 独立审查修正（2026-10-10）
候选041-001独立FAIL保留。控制目标由实际运行用途、或持久native_operations最新已绑定用途确定，不从业务主run/attempt猜测；当前业务Task/revision/grant/scope/config仍须完全匹配，控制不能获得新材料或执行权。复用现有操作绑定表，不新增会话引擎或持久schema。准备、分析、报告各有独立原生Session，控制作用于当前用途；重开从真实持久绑定读回。报告仍固定MiMo且无工具，通过SDK支持的agent模式空工具Session调用持续运行，不使用未公开的runText session参数。用途集合在新任务初次准入时固定；旧配置任务不得静默迁移或清账，保留原数据并明确拒绝不兼容配置。先补行为RED，再实现；真实模型补验需要新的有效时间窗口，当前不发请求。

### SDK041-FIX02旧业务消费者接入影响决定
工程总控在本次完整SDK采用授权内关闭技术接缝：会员与Case的现有业务授权、输出验证和效果保存保持；Application向Adapter显式提供稳定业务Task、当前操作/授权/资料身份和撤权回调，不能从模型文字或任意payload猜测Task。原会员Task直接复用task_id；Case使用其持久业务会话的根身份，派生会话不得靠新的Pi会话清空账本，已有开放Task来源沿原父Task绑定。Pi Session仍为Adapter内部ID。生产按项目配置创建运行消费者，复用同一Native Adapter及同一持久Task账本、固定用途集合；旧Pro模型只用于既有会员/Case用途，保留现有材料范围，不擅自改成主模型或Flash。
首次采用前核对旧业务物理历史；已有调用但没有共享SDK权威账本的Task明确要求核账迁移，保留旧历史，不补零或悄悄重建。新Task才按本次unlimited策略准入，所有单次保护和业务效果权威继续成立。增加业务类型的可选Adapter授权字段是兼容工程合同增量；旧测试/旧只读历史不强制迁移。真实Pro补验需要当前问题中明确的用途与预算批准；离线工程不调用模型。


### SDK041-FIX02 新 Case 的统一计量策略
依据用户 0.4.1 直接输入，新共享会话 Case 明确消费 uncapped_metered：不再以 open_origin 是否存在来判断累计策略。现有业务授权、正式采纳、资料范围与单次保护不变；只有共享会话入口可消费该策略。旧有限授权不改写，旧物理消耗无共享会话对账时拒绝继续。非共享旧入口仍保留原累计约束。通过真实 Application→Adapter 的离线合同证明新 Case 的两轮同 Task、账本累加及磁盘读回，而非仅测试工厂。


### SDK041-FIX02 bounded Case conversation ownership
Child Case conversations share the stable parent business Task accounting, but must not share the parent JSONL conversation implicitly. Application supplies its existing business conversation ID; Adapter maps that ID to a separate native Session owned under the same Task and fixed retained_case purpose. No new Runtime, SDK purpose, database table or copied Session engine. Only granted context enters a newly created child Session; existing business events remain authoritative. Sessions are persisted in the existing ownership table with a conversation namespace. This is an internal Port metadata extension; no frontend authorization or material scope expansion.


### SDK041-FIX02 professional auxiliary consumer
The professional disclosed assistance entry must use the existing native retained_case purpose and authoritative Task ledger, not private Pi. Its existing professional business session_id is the stable Task identity across revisions and attempts; the disclosure ID remains the grant and the exact disclosed payload hash the scope. No new schema, Runtime or purpose. Historical attempts without a native Task ledger require reconciliation, not a new zero Task. Cancellation, editable draft validation and business adoption remain in Application. Production composition selects the project-owned Adapter; legacy offline injection stays compatible.

### SDK041 FIX03: no-tool purpose model instructions
Real supplement036 proved Flash report emitted a simulated Skill file read instead of a supplied-value explanation. The report/retained purpose is immutable and tools remain empty. Its system instruction must explicitly state that no tools or file reads are available and all content is supplied; it must not simultaneously instruct use of the analysis dispatcher. Analysis/preparation retain their actual authorized catalog. No text repair, SDK copy, permission expansion or automatic extra request is added. Preserve real failure035/036 and metering. Validate affected purpose contract RED/GREEN and bounded real report response before activation.

### SDK041 FIX04 retained Case closed JSON instruction
Real Case request39 returned a Markdown-fenced JSON object; existing strict parser rejected it. Keep strict parsing, no unwrapping or extra recovery. For retained_case, explicitly require a raw single JSON object with no Markdown/code fences/prefix/suffix. This retains the existing business contract and no-tool policy. Pro supplementation is separately approved for at most2requests/10min, cumulative<=42, output<=120000; prior39/10839 not reset.

### SDK041 FIX05 parent control after child Case
Generic analysis controls select the latest validated parent purpose, skipping namespaced child Case bindings without normalizing their identity. Child histories remain isolated and cumulative Task accounting unchanged. While a child owns the live runtime, parent controls reject TASK_BUSY rather than selecting or exposing its conversation. No new table, Runtime or Provider request. Causal failure056 retained; cover two children and host reconstruction.

### SDK041 FIX06 connection probe production consumer
The explicit settings connection test is a standalone, profile-owned fixed-text task, not an analysis task. Its stable task ID is connection-test-xiaomi-pro-v1 within profile-private persistent storage, preserved across retries/restarts and credential changes. It uses SDK runText, persistent BudgetStore/AuditSink, fixed MiMoPro128token/30s, no tools/fallback or automatic retry. Keys remain ephemeral in the requested transport only. Passive startup/save/read performs no model request. Existing settings cancellation and proof ownership remain. Corrupt/unknown accounting closes admission. Production browser and desktop compositions replace only the legacy probe consumer; historical compatibility tests remain. No new table, Provider, credential search or real call authority.


## v1.3 第一个纵切：开放分析嵌套协作
复用 CaseAssistant Application／Store Port／SQLite 协作关系、返回与生命周期表，不新增 Runtime、会话引擎或数据库表。部署配置显式选择 open_analysis_v13；只有具有有效 open_origin 的来源消费此策略。旧正式 Case 和会员的单层规则继续有效。

工程影响决定：本纵切仅增加构造器的可选部署策略，不改变现有 1.1 前端请求合同、持久 schema、正式采纳合同或 Pi 类型边界。子任务的选定报告和汇总在 Application 与原子 Store 双重核对父关系；Store 沿现有关系读回全部祖先，防止绕过应用或根停止。生命周期关闭改为事务内遍历子树，保留既有 lost-COMMIT 读回。继任动作须再读来源与全部祖先；事务内不能靠内存缓存断言有效。

结果回流、主模型工具、根 Task 账本和原生会话隔离属于下一纵切：先核对 SDK 的单写入者／工具运行控制，不能在正在运行的 Runtime 中递归启动另一运行来绕过独占；不得用新的子 Task 清账。正式评审只在完整候选冻结后安排。


### V13-METER01 影响决定
CaseAssistant 通过可选的业务 openTaskIdentity 配置回调从现有分析任务 Store 读取当前根身份，不从模型内容、原始 key 或任意请求猜测。v1.3 策略要求来源 task/revision/run 与权威回调一致；旧配置回调不存在时拒绝 v1.3 运行，而不是创建子 Task。中性 conversation_id 沿现有 Runtime Port 传递，Pi Adapter 以 analysis:<业务子会话ID> 登记原生 Session，SDK 的固定 analysis 用途、工具定义和单写入者不改变。root control 跳过子会话绑定；共享账本保存历史与 UNKNOWN，不修改共享 SDK。


### V13-RETURN01
沿既有协作结果与返回表读回；不新增采纳表或自动正式决定。Application 的 returnedResults 在当前来源及正式基线一致时返回带 MODEL 分类的精确 result。prepareCollaboration 将其及稳定引用加入 authorized_context，后续模型实际读取；父开放分析工具也复用同一读取接缝。旧 prepareParent/user_review 合同不变。


### V13-D201 接缝决定
来源桥显式提供 stepOwner(task_id,step_id)，以真实持久 verified_steps 的 step_id 作为材料引用的 revision_id，根业务 Task/revision/run 仍来自原任务。仅 allowQualifiedSteps 配置消费；原 owner/read 的已保存成果规则不变。open_origin 可选 material_kind=verified_step 标明材料资格，已有 optional 字段与 JSON body 存储兼容，无表迁移。读回该具体步骤而不是最新步骤，避免后续合法计算将先前分支材料意外改写。根版本变化或停止仍拒绝准入。


### V13-DRIVE01 技术接缝
Application 仅通过业务型 OpenAnalysisCollaboration Port 读合格材料、排队、收回与读返回。Pi 继续拥有原生多轮模型/工具协议；Application 在委派这一业务等待边界调用既有 shouldYield，收回一次原生运行后处理子任务，再调用原生会话续接，不复制 Pi Agent 内部循环。产品 Store/授权/真实计算/核验仍由原 Application 持有。Port 在部署 composition 选择实现，不在 Core 导入 SDK。未配置该能力的旧入口不新增工具。

### V13-DRIVE02 — 原生让出后的嵌套调度
仅 v1.3 开放任务的受控委派入口可以在当前父模型运行期间保存子任务队列；该动作不发模型请求。原生 Adapter 必须在本轮 SDK 已返回后才调用 Application 提供的空闲委派回调，临时释放父会话模型占用，执行精确材料子集的后代，然后在授权、epoch、来源和配置仍有效时重新取得模型占用并继续同一会话。旧正式 Case 和人工入口不放宽忙碌检查。持久层独立限制活跃任务只可属于父祖先链；无关会话仍阻断。父停止中断全部后代，停止或未知不能通过重入获得新请求。

### V13-DRIVE04 — 等待业务问题不占物理模型
v1.3 子任务实际 SDK 回合结束后，如仅等待用户补充信息，应释放物理模型占用，保留持久 Waiting 状态和原截止边界，使兄弟任务和主任务可以保留并继续有效部分工作。明确回复时必须按原模型配置 generation 重新取得占用并核对来源及根任务授权；配置变化或停止不得自动重授权。旧正式 Case 维持既有占用规则。

### V13-RESUME01 — 显式根恢复与后代停止分责
根任务显式恢复仍先按原入口核对真实空闲、UNKNOWN、账本、配置和授权。通过后、启动模型前，仅重新打开本版本根材料父会话；旧后代保持关闭和历史 Interrupted，不自动重跑或复制成功。模型读回包含停止/失败事实，再在当前授权内选择下一动作。停止收回未确认不能恢复。重启/读回不执行此路径。


### V13-STOP-ALIAS01 — 停止分支后的创建准入
自然语言换名无法成为可信的“不同工作”证明。利用既有持久父子 lifecycle/epoch：本轮存在用户已关闭、其直接父级尚未显式恢复的分支时，拒绝新的自主委派创建，返回 DELEGATION_STOPPED。已有无依赖的兄弟任务及根任务的读取、合法计算、部分成果与报告继续；不重放已停止任务。用户显式恢复父级/分支后，原历史后代仍不自动运行；恢复权威的新 epoch 可允许后续新工作。该暂时的创建停止线不限制常态嵌套深度、容量或永久禁用自主委派，不新增持久表或成本上限。


### V13-ARG01 — 准入前的参数错误是可观察反馈

真实real001中的参数不满足已发布工具schema，尚未执行，却被SDK终止为TOOL_FAILED。保留严格schema和有效业务权限；仅v1.3明确启用的分析/子任务输入，在调用业务工具前返回现有TypeBox的安全路径/关键字诊断，允许同工具一次显式模型纠正，重复错误终止。不给参数填默认、不改自然语言含义、不重试物理操作、不隐藏失败、不改共享SDK。JSON/结构/schema错误与授权/版本/秘密/UNKNOWN/执行后失败分开；后者仍失败关闭。旧入口默认保持严格终止。正常下一模型读取反馈，计入同根账本，不是免费内部重试。


V13-ARG02：Pi Adapter从TypeBox Errors实际结构只投影instancePath/keyword/schemaPath与requiredProperties字符串数组，不回显错误原值或任意params/message。仍每工具每run一次执行前纠正，其他效果/授权错误不变。real005缺evidence重复失败为原始证据；argument002-red证明字段级诊断缺失。


V13-HISTORY02影响决定：只修正v1.3 qualified-step来源投影的open_history ID散列，加入step_id；既有saved根Task的ID生成保持原值，无SQLite表/迁移/账本变更。全局events主键意味着仅task/run/index/text不能区分同一Task不同材料父来源。未启用的候选中旧失败Case与其历史保留为原证据，不能冒称新投影身份相同或成功；不重写其events。material-parent001两材料真实Profile→SDK→Fork派发因LOCAL_OPERATION_FAILED失败，为受影响行为RED。


V13-SCOPE01：real007的实际输入通过describe_business后在绑定阶段因同一来源/工作表重复范围失败。提前检查已有唯一范围合同，并向模型返回重复位置；不合并筛选、不扩大资料、不改用户意图，不新增权限或物理重试。模型显式纠正整体范围，切片仍由IR表达。


V13-STOP02：用户对子任务显式停止沿用CaseAssistant.stop的Stopped/user_stopped；随后closeSession关闭该分支家族及epoch，后代保留Interrupted/session_closed。宿主退出/普通关闭语义不改，账本不另用子session ID去stop根账本。affected005原兼容用例得到Interrupted而非Stopped，是有效回归RED。


V13-UI04：沿用PX006现有本项目会话列表，在当前主分析条目内展示其实际分支/子任务/孙任务入口，层级来自已读回relation，不另造页面或审批。复用原data-child打开独立对话与返回主分析；状态不把MODEL返回误记核验。


V13-ARG03：real010 两次无法解析的业务 JSON 保留为 FAIL；原反馈只有 valid_json，未提供实际解析位置。Adapter 仅从平台 JSON.parse 错误提取数字 position/line/column（可观察时），不回显 parser message、原字符串或错误附近文本；不修复 JSON，不放宽 schema，不增加纠正次数。该安全诊断由下一正常模型回合消费，物理请求照常计量。缺少位置时仍报告 valid_json，不猜位置。

V13-SEMANTIC-FOCUS01：real010/011保留为真实失败（011第一次JSON语法错误，纠正后又为无证据的time_zone定义漏必需evidence）；分析协议从未要求每轮穷尽全部语义维度。仅澄清工具描述：当前业务所需、已有来源的定义才提交；不适用维度省略，仍适用的每项必须有实际evidence。不得自动补证据、删除冲突、修改单位或放宽校验。真实原命令为现有行为失败回路；后续真实结果决定修正是否有效，不以提示文本匹配宣称GREEN。

V13-SCOPE02：real012实际把两个期间的比较误编成同列两个不同eq的AND整体范围，后续绑定因此误报需采纳方案，保留Waiting。在describe_business准入前拒绝已能确定矛盾的AND等值筛选：同一列eq不同字符串；不自动OR、不删用户条件、不从中文猜范围。返回实际路径和AND约定，由模型显式重提候选。正确但零匹配的筛选仍合法，不把零数据等同矛盾。正式已确认范围变更依然须原版本流程。

V13-DISCOVERY01影响决定：real010/011/013重复在高体积嵌套业务JSON参数失效，根首轮输入约3.6万token；停止盲目重开相同试例。仅v1.3根自主分析采用渐进工具合同读取：现有Business Port增加私有可选toolDiscovery，Application提供只读read_tool_contract，只返回本阶段实际提供的工具的原schema；Adapter目录保留名称/说明，模型按需读取具体schema。不修改共享SDK固定analysis_tool元数据/配置/JSONL/用途/预算；旧入口及未启用的子运行保留原目录。不自动填参、解析修复或增加纠正；不可用工具/其他阶段/撤权拒绝。此为当前参数收敛的一次有界替代，之后实测决定是否有效；无进展时停止受影响真实重试，离线原合同仍推进。

V13-UI-TRACE01：在现有Runtime Port增加可选只读collaborationTrace，Pi Adapter经已安装SDK.history读本任务明确选定session，投影实际成功analysis_tool的delegate_analysis/read_delegation_results和后续assistant位置。不读其他会话、原始reasoning、凭据或全量内容；无新schema、会话引擎、恢复或模型调用。Profile仅补当前Task关系的派发者、材料与使用位置；用户发起依赖既有已受理命令回执。运行中读无法安全绑定时标暂不可用，不能猜已使用。


V13-NATIVE-TOOLS01：固定25个原生具名工具JSON object外层声明，当前业务schema、执行前权限和一次参数纠正仍通过共享既有业务验证器；SDK中不存在的名字不映射。既有session owner分析用途保持analysis，新自主root以analysis_native保留私有协议身份，子孙同前缀、报告原用途；现有SQLite session映射保存，不建新表/会话引擎。每个Task固定一组SDK用途配置，Adapter只缓存相同SDK的两种不可变配置以兼容存量Task，不并发执行、无热切换。旧Task有analysis会话时新输入flag不能改协议，新Task重开有analysis_native时flag不能退回旧协议；同根报告/子孙读取该身份。旧UNKNOWN与历史不迁移、不清账；未经真实证明不启用自动备用/协作。


V13-NATIVE-TOOLS02：real015第一轮调用root未提供的read_authorized_context，后台拒绝，88次累计保留。按SDK原生extensions.transformContext只收窄ModelMessage.tools，具名目录不包含当前未开放能力，read_tool_contract展示精确小schema；完整业务参数仍按需读取，业务Check不变。transport发出前核对广告名称属于当前input.tools，hook无效/失败时拒绝且不reserve物理账本。旧dispatcher配置无扩展保持身份。因果named005-red（广告多于当前阶段）须GREEN；不以文字提示代替这一消费者。


V13-NATIVE-TOOLS02 只读SDK核对修正：0.4.1 transformContext只改messages/system，不提供原生tools覆盖；工具集合在Pi执行assistant时单独注入，因此named006/007失败、物理0保留，不能宣称hook完成。最小受信Provider Adapter投影将SDK固定集合收窄为当前Application集合，保留相同工具名字/执行器、严格schema与权限；不复制SDK/会话/循环，不修改共享包。产品physical receipt.input_sha256绑定实际发送的收窄请求，SDK审计仍是固定声明目录身份；二者用途明确，不假称同一摘要。具体工具schema按需读取，目录收窄不增加权限。旧dispatcher调用内容/配置不变，原先未启用的试验extension取消，试验记录不抹除。


V13-NATIVE-SCHEMA01：real016累计93次/40188输出，修正语意参数时conflicts仍被写成字符串，严格拒绝保留。Provider投影从实际成功read_tool_contract回执识别已发现合同，name与当前Application工具且参数hash一致才采用当前参数schema；直接将精确schema送入原生函数声明，正文回执仍保留。不把历史/模型回流伪造参数提升为当前合同，不松Check、不自动改类型、不增纠正/重试次数。子任务没有toolDiscovery时显示其完整当前schema。模型须真正消费后证明，schema001 RED/GREEN不代替真实场景。


### V13-NATIVE-SCHEMA02 — 原生声明完整参数
real017完成真实净额计算与核验，但同轮三个delegate_analysis均遗漏必填kind，第一条反馈后余下调用被严格拒绝。新原生接法不得隐藏当前Application工具参数；每个实际物理请求直接声明当前授权工具完整schema，不依赖先读正文合同。原dispatcher任务与其按需发现保持兼容。删除新接法仅按历史discovery升级schema的重复机制，read_tool_contract仍可只读解释合同。工具名称、授权、执行前严格类型、一次纠正及同Task账本不变；不默填kind、不弱化拒绝、不改SDK。初始输入成本可能增加，须真实验证，不以离线PASS关闭完整协作。


### V13-ARGUMENT-FEEDBACK02 — 字段结构反馈（AU04/AC03/AC06）
real018中interpret_meaning将evidence数组重复写为对象，首次安全反馈只提供路径/keyword，读取完整合同后仍失败。通用dispatcher应从当前可信工具schema的错误schema_path读出字段结构，随第一次pre-effect拒绝返回有界expected_schema。只返回工具声明，不返回无效输入值、异常原文或凭据；不改写模型参数、不推断语义、不扩大工具集合、不增加物理重试或第二次纠正。相同结构对任意工具/字段适用。第二次无效提交继续失败。原生具名工具与旧dispatcher共用校验路径，完整候选仍需真实补验。AC04自由任务文字出处缺口不因此关闭。


### V13-MATERIAL-HANDLE01 — 当前材料短引用（AU06/AC03/AC04）
real019在完成订单/退款分项算术核验后，模型跳过read_delegation_materials并猜测UUID，实际队列拒绝、零后代。当前运行通过只读材料列表提供material:序号，Application保存短引用到真实材料ID的映射；生产委派必须消费此次真实列表才可解析。原UUID兼容仅限同次已读列表，未知/过期引用不猜测，最终队列仍重新检查权威交集。根和后代使用同一规则，回执/历史保留真实ID；模型提示与UI不暴露新增管理流程。引用映射不是资料授权、不关闭自由task文字的AC04缺口。


### V13-NATIVE-CATALOG03 — 单一原生业务声明
当前Provider投影只覆盖原生Tool参数，description仍为SDK通用占位；真实模型主要从长系统正文另找业务含义。修正为当前Application Tool的完整description+parameters共同投影，并在原生模式移除重复正文业务catalog，仅通过真实native declarations提供当前工具职责及合同。旧dispatcher正文保留。当前工具子集、执行前严格校验、计量输入hash仍针对实际出站；不修改SDK，不改变用途或重试。独立因果合同测试须证明首请求正确description且正文无重复catalog。历史失败不改写，仍需真实成功证明。


### V13-PROTOCOL-STAGE01 — 同Task分析→方案准备兼容（AS03/AS06/AC06/AC07）
离线实际Adapter两次连续调用复现：新Task已用analysis_native会话，再进入proposal_prepare，SDK固定purpose仍使用analysis_tool，Provider却把所有工具过滤掉且系统正文要求具名工具。proposal-protocol002-red及observation确认实际空tool声明，0真实Provider。Task固定nativeMode继续用于SDK/会话身份与不可变用途集合；仅实际analysis阶段使用nativeBusinessPhase投影具名工具和对应正文。proposal_prepare保留原dispatcher及系统合同，不改Task/config/授权/账本，不强迁旧方案Task。加入同Task首次分析→准备实际工具执行→返回的永久测试，保留旧/新协议与报告无工具负例。


## V13-AC04-INSTRUCTION01 — 用户接受后的委派合同
用户本轮“接受”确认ac04-handoff-impact001.md的有界调整。工程接缝沿用生产Application委派→持久父子关系→真实Runtime出站，不再询问已批准接缝或产品/UI。
自动委派指令使用通用专业动作（来源检查、一致性、限制、反证、解释、比较）及选定材料内真实JSON引用路径、完成条件引用。动作不绑定销售/会员示例或固定子任务数量；模型自由选择材料、动作、合法引用、不同子任务和嵌套。未知动作/不存在路径/未选材料在效果前拒绝；不透传任意事实文本。原task自由目的保留为根任务私有历史/自动关系私有元数据，子任务实际目标由可信专业内容和所选引用生成。
自动关系保存可识别v1指令，既有JSON关系体的前向可选字段，不增数据库表/列，不批量迁移旧关系。已知旧自动队列没有合格指令不得自动出站；原用户明确手动任务仍按旧实际授权。
所有出站文字（task、initial_text、visible_message、source.case_name、Fork历史、回流source投影）一并处理。自动Fork仅继承系统从所选材料生成的明确历史；保留原生分支/JSONL机制，不复制父完整历史。单写者和当前来源/材料交集、祖先停止、幂等、根账本不变。
因果RED必须通过实际生产队列后读回child授权payload，显示原行为会夹带根私有目的/历史；GREEN证明子和孙出站无这些文本、选定证据仍可用且不同合法目的可表达。至少两个合法动作、移除/错误路径/未知动作负例、旧人工兼容及跨磁盘读回回归。受控传输不代替真实AS04/AC03。

V13-AC04-METADATA02：自动材料视图也不透传模型自由IR goal；原完整IR及proof身份仍保留，出站提供独立标识的结构投影及原材料hash引用，不把改写内容冒称原hash。当前路径目录与执行前检查均基于同一投影，goal路径不可引用。ac04-metadata002-red已证明goal元数据可夹带同样私有文字；此修正属于已批准全部父子文字投影边界，不新增模型/权限/业务算法。


## V13-SCOPE-BIND01：业务范围先绑定真实资料

real020 接受不存在的 execution_scope 占位 ID，随后污染所有框架绑定。describe_business 必须在变更本轮业务状态前，按当前获准 inspection 核对来源、工作表与筛选；只允许实际 ID 或唯一完整资料名／表名／表头。错误返回 Agent 可纠正的真实元数据诊断，保持原状态，不能扩大权限、删除用户筛选或编造业务事实。复用现有引用解析和 IR 范围校验；恢复后仍执行原计算与独立核验。

## v1.3 协作引用纠正及紧凑会话标题（2026-10-10）
真实 real022：已完成真实净额 1050 和独立核验，但第二委派 completion_reference_paths 不属于所选集合；子任务将 8 个路径误作 8 个 allowed_references 引用。保留失败，不扩大材料。生产子任务 finish_result 的模型参数声明必须按真实合法引用数量约束索引；索引与 JSON pointer 路径含义分清。委派参数错误只返回真实诊断、未创建结果，并允许同一运行一次显式模型纠正；重复错误、真实授权缺失、停止、越界材料保持原拒绝。原生 SDK 仍负责参数纠正，不另造推理循环或自动改写指令。
既有 Application delegate_analysis、子任务 Runtime finish_result 为已批准测试边界；因果 RED→GREEN 在这些实际消费者验证，不降低负例。
UI 对照现有合成保存任务发现侧栏全文高度 410px：沿 PX006 紧凑会话，将列表标题限制两行；完整问题保留对话并可悬停查看，子任务状态保留。使用同一保存任务实际截图/几何/切换交互验证，不重画 UI。

### 协作路径参数声明补齐
real023 参数把 material:1/2/3 句柄错作 JSON pointer。核心已拒绝，但模型 schema 没有表达必须以 / 开头，且同批多个无效指令消耗纠正机会。将已有真实验证条件投影到参数 schema（^/），由共享原生参数检查先返回准确 non-execution 反馈；不得猜测或替换路径，材料句柄仍只用于 material_id。保留 runtime 拒绝与一次纠正上限。


### v1.3 真实语义引用诊断与说明修正（2026-10-10）
real025在真实Provider SSE已读回有效JSON，工具参数未被共享SDK重组；失败来自模型将整体范围引用仅写到工作表，遗漏现行必填row/column，明确一次纠正仍遗漏，准入关闭。保留real024原始响应未捕获的归因未知。只补工具说明：资料依据是精确单元格，整体范围可引用实际用户消息；不改变schema/权限/重试、不把缺参自动补造、不新增Runtime。后续真实主/子/孙/报告验证仍需实测。


### V13-IR-FEEDBACK01 原生计算声明读回
real026正确绑定了净额IR，但计算前声明提示只返回说明，模型随后将编译Binding而不是proposal提交required_plans，结构失败。复用已存在openAnalysisProposal投影，在needs_required_calculations反馈中返回本轮current_plan（未绑定为null）。Agent仍须显式声明完整重要计算，不自动把一个总额当所有需求；不执行、不新增授权、不忽略分组/关联/单位等条件。因果测试从真正Application入口证明投影可被原声明消费者接收，原准入与missing负例保留。


## v1.3 退款端参数反馈（real028）
真实19请求未形成子任务/报告，反复在退款端填group_by；目前编译器正确拒绝却仅PLAN_INVALID。给该既有约束附safe_details，Application返回准确参数含义及一次纠正机会；第二次同类无效参数不因字符串变化重置计数。没有自动清除参数、放宽计算或建立额外推理循环。订单端保留真实用户分组，join字段不作为group_by。


### V13-YIELD-FEEDBACK01：正常暂停不伪装TOOL_FAILED
real030 Provider一次提交3个委派，首个queue成功后createSharedAnalysisTool的shouldYield分支抛ANALYSIS_YIELD；共享SDK安全遮蔽成TOOL_FAILED，模型后来重复提出未创建工作，导致更多轮次。只将这个已获授权、尚未执行的正常边界投影为deferred/ANALYSIS_YIELD/executed:false；保持assertAuthority在前，真正撤权/取消仍拒绝。不执行同批剩余工作，不持有新队列，不修改共享SDK或原生循环；复用SDK会话记录与Application既有drain/续接。该修正不保证模型必然收敛，完整真实报告仍须独立实测。


#### V13-VERSION-FEEDBACK01 diagnosis and private projection
real031 request253 feedback spent its 12-issue limit on earlier IR union variants, hiding the actually declared 1.7 refund input missing group_by. The following model attempt again omitted that required property and was rejected. Select a uniquely matching trusted schema version only for diagnostic projection; full Check and all business validation are unchanged. Do not repair arguments or retry requests internally. No new persistent/public contract or SDK change. Update the old V12 business-wait test to assert deferred+executed:false+zero effects, retaining revoke/stop/late identity negative assertions, as required by V13-YIELD-FEEDBACK01.


### V13-REPEAT-FEEDBACK01 / AS04, AC03/04/06
real032真实子任务使用与祖先相同action、reference_paths及completion_reference_paths，私有task文字变化不改变实际任务。保留Application的REPEATED_DELEGATION效果前拒绝；生产子任务Adapter将该拒绝作为一次可纠正反馈，明确未创建及repeats_ancestor_instruction。模型须自行选择不同合法action或聚焦不同选定引用；后台不改指令、不扩材料、不自动重放，不把缺少孙任务或失败意见算作回流成功。复用既有一次delegationCorrections额度，重复拒绝仍DELEGATION_CORRECTION_EXHAUSTED；撤权、取消及其他失败不转成功。
测试边界沿用户已批准的真实Application委派、持久Store和子任务Pi Adapter，模型仅替代传输边界；证明原拒绝存在、无新增效果，明确模型纠正后合法孙任务真实创建/运行/回流，第二次重复及撤权仍拒绝。先因果RED后实现GREEN，真实Provider完整闭环仍须另验。无新SDK/持久公共合同或权限。


### V13-COMPLETION-REFERENCE01 / AC04
依据completion-reference-impact001工程决定：完成条件可聚焦同次选定JSON对象内部真实后代字段。所有completion路径先在当前材料投影resolve，再核对与reference路径相同或位于其完整片段子树，不允许近似字符串前缀/兄弟路径/不存在字段/被排除goal/其他材料。原选定对象内容本已通过授权history整体传输，不新增资料或文字外发许可。保留一次纠正、循环/停止/身份护栏，路径值不自动替换。生产Application队列因果RED→GREEN，保留原completion_not_selected拒绝测试及实际后代payload可用。real033与最终AUTHORITY_REQUIRED历史保留，新增完整实测不冒充旧任务恢复。


### V13-REPORT-COLLAB01 / AS04, AC03/04/05/06
真实real035中子任务两次模型超时，未有返回意见；最终MiMo报告输入却没有真实协作回执，报告叙述了不存在的回流影响。最终报告须从当前身份与授权的Application协作results取得真实已返回观点及失败/等待状态，作为模型意见提供给报告用途；失败/无返回不能投影成成功观点或独立核验。仅投影child/result身份、已返回summary/limitations/unknowns及实际状态/安全原因；不透传完整Store记录、私有委派目的、未选历史或原始资料。旧checkpoint无此可选字段保持无回执，不追认历史。报告消费观点不把它变成独立证据；实际计算与数字核验规则保持不变。
测试沿已批准Application、真实协作Store及委派消费者/模型Port边界：实际已返回不同意见改变最终无工具报告输入，真实失败状态没有summary，撤权在读取/报告前拒绝；原派生数字及来源、停止、未知和一次额外请求负例保留。先因果RED再实现。


### V13-IR-REFERENCE01：当前计划引用与停止回执（AS04／AC03／AC06／AS07）
Agent 可在 read_analysis_evidence 明确声明 required_current_plan:true，引用本任务当前已绑定真实 IR，不要求重复序列化整个计划。此引用只加入必要计算集合，不执行、不授予权限、不清除其他声明；没有当前绑定时失败。仍核对当前来源、授权、版本及单位；追加不同计划仍显式提交真实 proposal。准备模式不得触发计算，撤权立即关闭准入。
报告协作投影保留 Stopped 的真实停止状态，与 Interrupted/Failed 同样不得显示为返回意见；已核验成果不因停止回执的合法枚举而丢失。


### V13-VALIDATION-TIMEOUT01（real-authorization010）
本次合成验证专用Adapter固定单次模型60秒；生产默认30秒、工具60秒、控制10秒及4096输出不变。只允许在composition创建时配置，不在稳定Task运行中切换；所有用途及后代共用同一固定值，持久账本CONFIGURATION_CHANGED仍拒绝旧任务改配置。不能只修改外层transport而让原生SDK仍30秒。实际落盘limits与默认/切换拒绝均测试；不修改共享SDK或旧UNKNOWN。

### V13-DELEGATION-DIAGNOSTIC01
产品私有参数验证保留最多12引用、真实路径和完成子集约束。在已有 safe_details 中增加 argument_path 和 available_reference_paths，让既有主/子工具反馈进入下一次计量模型请求；不增加纠正次数、SDK改动、隐式修复或资料范围。修正原因：real037 第二次反馈只有 reference_path_not_found，无法定位多项引用中具体错误。

### V13-CATALOG-PRECONDITION01
real038首次委派发生在读取目录和实际核验之前，短引用尚未建立却产生笼统 TOOL_FAILED。私有临时引用解析器区分“目录未读”与“目录已读后的越界”，由根/子工具返回需要读取目录、未执行反馈。无隐式读取、计算、绑定或重试，不改变一次参数纠正、任务权威或SDK。

### V13-BATCH-CORRECTION01
real039同响应的三个委派都越界：第一条语义反馈尚未被模型看到，第二条已经耗尽纠正。Pi Adapter仅延后该批余下delegate_analysis，返回deferred/created:false/executed:false；在下一次实际模型调用边界重置批次标记。既有产品一次纠正计数不重置、不隐藏重试或运行循环，SDK及任务权限不变。用真实安装SDK、Application/Store验证下一模型消费与再次无效关闭。


### V13-CALCULATION-REFERENCE01 · 用户批准的执行引用修正（2026-10-10）

对应 AC03/AC04/AS04：Agent 对新方法仍提交真实完整 proposal IR；对已通过来源绑定的 required_calculations，可通过 calculate_and_verify.calculation_ref 消费，无须再次重写 IR。引用绑定本次完整运行身份、当前来源及实际编译计划；跨任务/版本/Attempt、未知或含义变化后的旧引用拒绝，不猜参数、不扩大权限。声明/读取引用不执行；执行仍经过原 Context/Binding/IR、授权、实际本地计算、独立核验及保存。plan 与 calculation_ref 同时提交拒绝。重复引用仅在同身份/同计划合格凭证存在时读回，不重复计算。现有 {} 和新 proposal plan 入口兼容。

工程影响决定：复用既有 requiredCalculations 和合格凭证，不新增持久 schema、注册表、Runtime 或 SDK 改动。受影响路径仅 Application 工具、既有 Application/原生集成测试及本 Change 规格设计验证。原有失败/UNKNOWN与累计消耗不变。

验收 seam 沿用已确认 Application.run 实际工具消费者及现有原生 SDK 集成入口；预期 RED 是读回没有可执行引用。GREEN 须以合成数值 11 / 11/2、真实核验和保存回执证明，并覆盖未知/混用/跨身份/来源及含义变化拒绝。完整真实协作及用户验收仍未通过。


## V13-ARGUMENT-FEEDBACK03 — 根对象缺失字段的真实结构反馈
对应 AC03/AC04/AS04。real042 子任务 finish_result 首次缺少 limitations/unknowns，原诊断只列字段名，schema_path=# 未投影真实 schema；模型第二次把数组写成字符串，仍按既有一次纠正条件失败。工程修正仅让可信根 schema 指针 # 与已有 #/ 子路径同样返回有界 expected_schema；不读取或回显无效输入、不填默认值、不修复参数、不放宽校验或增加纠正次数。根 schema 过大继续不返回，所有授权/停止检查保持。原生实际生产 Adapter 的下一模型轮须消费根数组结构，明确重提完整参数后才执行一次。重复错误及撤权仍拒绝。real042 的主任务/子孙失败、物理消耗与旧 UNKNOWN 保留；完整协作仍未通过，不以此单项修正代替 AS04。


### V13-BATCH-QUEUE01 · 同轮合法委派逐项排队（AS04／AC03／AC04／AC06）
真实043第一项委派保存后，同回复其他委派被业务yield挡住，模型续接以自身推理替代独立意见；AS04未通过。主Agent工程影响决定：仅在Application确认等待的是合法委派队列、没有业务提问/结果终结/撤权/取消时，允许当前原生回复中的其他delegate_analysis逐项校验并保存。计算、发布、其他工具及下一模型请求仍让出；原生空闲后使用现有顺序drain，不并行运行，不自动重放未执行调用。旧入口无显式能力回调保持原语义。
每项完整材料/引用/祖先重复检查、单次纠正、停止及同Task账本不变；发生needs_instruction_correction后的同批委派仍推迟，下一真实模型观察后才能纠正。通过公开生产Profile及实际安装SDK证明同批不同工作子任务持久化、顺序执行、孙任务回流、真实后续消费及IR/报告；负例证明提问、取消、撤权、普通工具不得绕过yield。没有SDK/持久schema/Provider/UI/预算/外部权限变化。

端口增加可选canQueueDelegation回调，主/子Application在queued且无question/终结时提供；Adapter仅对delegate_analysis核对此能力，其余shouldYield行为保持。回调不含Pi类型，不赋予材料权限，工具执行前后仍断言当前授权。


### V13-CORRECTION-SCOPE01／V13-REPORT-METADATA01（AS04／AC03/04/05）
real046：3不同根子，2返回，1子在祖先重复纠正时修改selected references却保留旧completion；0孙。21请求全部结算，432请求/196583已知输出/12288历史未知预留。1050净额独立核验、报告partial保留；没有完整AS04 PASS。MiMo在正常解读中重复了回流result_id/child_id与revision、倍率配置数字，严格数值校验正确拒绝，不降低该校验。
普通工程修正：祖先重复的首次可信反馈明确同步completion范围（当前选引用及真实子字段），一次纠正仍只一次，未选引用/循环/撤权仍拒绝。报告业务模型投影不携带内部Task身份、草稿hash、子/结果UUID；原审计输入、Runtime身份、原始协作回执及后端回链保留原值。报告仅解释业务单位及已核验事实，不铺列内部倍率/配置或标识；数值仍仅用事实引用/真实推导占位，不过滤或修补模型输出以冒称完整。
不改变共享SDK、模型/预算/外部权限、材料交集、JSONL和持久表/UI；仅公开业务工具的可信反馈补足及已批准人类可读报告投影纠偏。先因果RED、实际Application/Store返回消费GREEN及原数值/权限负例，再完整回归；真实结果单独记录。


### V13-CATALOG-REFRESH01 / AS04 AC04
空目录不建立可用委派短引用。Agent在真实计算之前读取空目录，随后实际计算和独立核验后，必须明确重新读取当前目录，再从真实返回材料选择引用。空目录后的委派返回既有DELEGATION_CATALOG_REQUIRED及read_delegation_materials，不自动读取、绑定、猜材料或投递。非空目录中的未知/移除材料保持RESULT_OUTSIDE_AUTHORIZATION；队列继续核对当前来源、材料、任务身份及停止权威。既有Profile/SDK生产消费者覆盖先空目录→计算→虚构引用拒绝→模型明确刷新→双子/孙回流与报告，保留原权限负例，不改变SDK/外部权限或重放旧失败。


### V13-INDEPENDENT-VIEW01 / AS04 AC03-04
real049保存了数字核验通过的报告，但主Agent把自身计算/Python自检当成独立调查视角，未创建任何协作任务，AS04真实失败。独立算术核验与独立模型意见分属不同用途；用户当前调查需要独立Agent意见时，自身推理或Python复算不能替代。应从当前真实材料目录选择必要不同问题，消费真实返回意见并调整调查/草稿；没有返回时如实保留该部分缺口。简单任务不强制协作，不预定子任务数量/工具序列，不将MODEL意见升级为独立算术证据或业务事实。
普通包内工程修正仅补充根模型受信职责说明；不新增持久结构、关键词分类器、运行循环、自动委派、参数修补或隐藏请求。已存在实际生产Profile/SDK集成覆盖协作返回消费及负例，复用并回归；指令文字一致性不冒称模型行为GREEN。真实real049为行为缺失证据，继任真实用例明确独立Agent视角这一业务需要，不指定结构数量/方法ID/引用路径，须单独核对AS04实际消费与草稿影响。


### V13-ARGUMENT-BATCH01 / AC03 AC06 AS04
真实real050在同一模型响应提交两项错误filters结构，第二项在模型看到第一项反馈前已耗尽纠正机会并失败。首次schema反馈后，该原生响应余下业务操作保持deferred/executed:false，不消耗新纠正机会、不自动重放。下一真实模型请求消费提示后可明确重提正确参数；同一运行同工具第二次无效仍失败。每次延后或实际执行之前仍检查授权和取消，合法先前效果不重放，持久账本及额外模型请求上限不变。
私有Adapter共享dispatcher接收可选实际模型轮次读回，记录首次schema失败发生轮次；仅该响应后续操作延后。原生transport进入下一实际请求时递增轮次，已拒绝工具集合不清零。原direct dispatcher无轮次入口保持原拒绝语义。复用原生SessionRuntime及公开run seam；不变更SDK/持久schema/Business Port或业务参数，不造默认值/修补JSON/忽略schema。对correct、invalid-again、revoked分别以真实安装SDK验证实际反馈消费、零旧重放、第二次错误拒绝及撤权零效果。


### V13-REFERENCE-CHOICE01 / AC04 AS04
已核验材料目录中的真实reference_paths允许按该当前有序目录的零起点索引明确选择，instruction用action/reference_indices/completion_reference_indices；旧精确路径入口保留且禁止混用。后台仅把显式索引解析成该已读、当前、所选材料的实际路径，继续原AutomaticDelegationInstruction、授权交集、完成子集及祖先重复检查；不猜字段、不新增材料或自动纠正。无目录、已移除材料、超界/负数/非整数/重复索引拒绝且无委派效果。MODEL意见仍不等于算术证据，子孙不能绕过此合同。
普通包内工程影响决定：real051第一次将material短编号抄成JSON路径，下一次猜测标量材料的groups导致正确拒绝。私有Application瞬时目录映射复用既有短材料引用和实际有序路径；新增可选模型输入形式，不改持久业务合同/schema、SDK、Runtime、Provider、预算或UI。字段与完成条件都由Agent选择，后台只解引用现成目录，仍在队列端核对真实来源。复用已确认Application工具与实际原生生产Profile测试seam，先新增indexed消费与失效/越界/混用负例RED，再GREEN；真实行为另验，不把控制transport自动化当自治成功。


### V13-ARGUMENT-PRESERVE01 / AC03 AC06 AS04
real052真实第一次参数纠正删除了不合法计划，却在其余已正确关联输入中漏掉必须显式提供的可空字段，第二次schema拒绝且业务未执行。通用首次纠正反馈明确：保留未出错字段和required可空字段的显式null，纠正后核对完整当前schema再提交。字段内容仍由Agent明确提供，不自动填null、不增纠正次数、不隐式重放、不放宽schema或材料权限。仅私有Adapter可信反馈话术补足；既有实际原生SDK正反消费者回归，真实行为另以继任补验，静态文字或测试量不代替真实自治GREEN。


### V13-UI-BUSINESS-TITLE01 · 只读展示纠偏
在既有 collaborationCards 投影内识别 relation.automatic_instruction，action 使用现有业务词汇，goal 从该 relation.aggregate.content.framework.goal 读取。父任务名称应用同一投影；缺少业务 goal 时显示“所选证据”。人工标题保持不变。仅纠正现有执行抽屉文字，无布局、持久模型或权限变化。真实截图 RED 与永久投影／渲染测试配合，不以测试代替实际页面一致性。


### V13-BUSINESS-INVESTIGATION01 · 真实协作回归039
real054把目录起始的revision/framework/base及hash选为核心检查，并四层递归相同元信息；虽然引用合法且意见返回，未形成业务调查。只将同一投影目录中的calculation、verification、framework放在revision及其它身份字段之前，不删除引用；模型仍显式选择，不后台改参数。可信专业动作说明与根/子工具职责补充：检查数字、方法范围和解释限制，hash只用于来源身份，不以合理不同hash推断业务矛盾；对当前材料能完成的问题直接形成意见，必要的不同问题才继续委派，不预置数量/深度。不透传自由task/goal，不改SDK、持久合同、范围或重试。目录与实际Application出站因行为缺失建立RED→GREEN；真实模型效果另验，不能由文字断言宣称通过。


## 2026-10-10 V13 有界多摘要业务交接041

用户于本轮确认business-handoff-impact040。采用 additive automatic instruction version 1.1；多材料选择以稳定UUID、Task identity及有序唯一step IDs保存到既有业务Task JSON（不建表、不造会话引擎），只在获准当前核验资料内注册。Collaboration Source按当前身份重新读取这些不可变proof并构成materials map，每项business_binding仅投影实际IR所用列及其绑定源headers/单位，排除自由业务文本。现有Case Assistant保持一个bundle aggregate/report身份及原生父子关系；1.1专业指令使用materials下的真实JSON pointers，出站投影只保留选定路径及必要binding。Application和Store均校验后代路径是父路径相同或真实子字段；祖先等价工作仍拒绝。模型工具增加显式additional_materials，复用当前catalog短引用与index解析，禁止隐式补选。旧单摘要1.0按原路径运行。新增持久记录完整验证并随Task历史保留，不更改旧proof/relations或账本。


### 041 停止／恢复兼容纠正
多摘要的持久身份与读回不因 task 暂停或 ready 丢失；这些状态必须读回 eligible=false，不能因此授权计算或派发。明确恢复先读回同一父会话生命周期，再由实际 running 权威恢复准入；旧停止子任务不重放。复用 V13-DRIVE05 的实际停止／显式恢复回归，portable041 已因 NOT_FOUND 失败，保留原因及历史。


### V13-AC04-SELECTION-RECEIPT01 / UI-BUSINESS-TITLE02
real060 实际模型在本地 task 文本列举多份材料，但调用仅选择一份，原回执只显示首项 material_id，不能证明跨材料交接。保持已批准明确选材/自由目的不外发合同：实际主/子工具回执须显示全部实际所选材料ID、数量及“task仅本地；子任务只收到这些材料”的事实；不自动补选、扩大权限、硬编码数量层级或解释自然语言。保持 queued 原生让出边界。
既有协作标题及材料位置复用当前实际选材与有来源绑定含义，为新bundle显示各选定资料字段、期间/地区筛选等；单摘要及人工标题兼容。不重画UI、不显示技术路径为目的、不将private purpose冒充实际子目标。回执/标题做因行为缺失RED→GREEN；真实模型小规模实际消费单独检查，不以说明文字测试代替AS04。


### V13 checkpoint044：已选多摘要参数反馈（实施前）
复用createOpenAnalysisDelegation.queue的实际选材准入；校验现有统一action和合计12项引用上限，在selectionOwner/link前集中提供safe_details.issues的字段位置、现有允许值/数量。Application/子Adapter现有一次纠正分支直接消费，不增加恢复循环，不改SDK/持久schema/权限或UI。预先同合同校验避免第一次仅报action、第二次才报数量的串行错误。永久实际Application测试证明首次失败无选材/子任务作用、诊断不泄露私有目的、显式合法修正可入队、再次错误拒绝。


### V13-AC04-SELECTION-FEEDBACK02：目录索引与整组引用一次反馈
实际 real067 的未知目录索引不能只返回 invalid_instruction，隐藏同组其他已知冲突。主/子 delegate_analysis 在所有所选材料身份有效后、任何选择持久化或派发前，返回索引字段的错误位置及当前目录长度，并同时报告整组统一动作/合计引用上限冲突。仍最多一次模型显式纠正，不替模型裁剪、补选、扩范围或改变动作；合法修正实际交接精确多材料，重复错误关闭本轮。仅诊断已批准材料，私有目的及原始资料不进入错误。生产Application委派工具与既有真实Store/Pi Adapter缝隙继续作为本次测试边界，未新建接口权威、Runtime或审批。


### V13-AC04-MATERIAL-LIST01：明确材料列表的兼容短格式
real069 真实模型已消费一次错误反馈，仍把整组12项上限误用为每份12项，重复嵌套引用而失败。提供私有模型工具兼容短格式 material_ids 加统一 instruction（真实 reference_paths/completion_reference_paths）。每份材料显式列出，共同路径在每份当前目录中分别核对，编译到既有首项与additional_materials，不自动猜材料或补引用；保留原字段入口。整组最多8材料/12引用，后代单调子集、统一动作、单次纠正、前置权限检查不变。混用两种格式、重复/未知材料及任一材料不合法引用拒绝，未产生选择或模型效果。这是工程主Agent在已获准多摘要交接中的私有参数兼容/人体工学决定，不改变存储、公有业务合同、UI、SDK或安全边界。生产App/Pi Adapter/Store原已获准测试缝隙；一次有界实测检验能否消除当前错选/冗余引用，不用新格式静态GREEN声称完整AS04。


## V13 checkpoint047 — 已选对象真实子字段目录兼容
V13-AC04-MATERIAL-LIST04：既有单调授权允许所选对象的真实子字段；046简短格式不能因子目录只列顶层对象而拒绝合法completion。子目录从实际已裁剪材料中枚举，并严格限制在祖先明确选中路径及其真实子字段；不枚举额外business_binding、其他材料、兄弟路径或未选原文。保持64项目录上限、原8材料/合计12引用/一次纠正/停止围栏；实际Application→子Adapter→孙消费者验证合法子字段和拒绝未选字段。不把真实070的失败重写或直接恢复失败子任务。


## V13 checkpoint048 — 报告输出聚焦完整结果
真实070的MiMo688响应前置英文推理/草稿后才输出JSON，物理输出4096token被截断，保留INVALID_OUTPUT与实际用量；不能修补不完整JSON后称通过。报告消费者的已有严格JSON要求补明：有限单次输出优先完整最终结果，不输出推理、草稿、格式说明，不逐事实重复演算，按当前目标仅请求必要派生。保持原1.3格式、事实引用/通用公式/方向/证据与失败护栏、4096token/原模型与重试/累计账本不变。先有完整原响应RED，后以实际MiMo+生产Report Prompt/编译/真实Store保存收回诊断；规划文字测试不能替代真实GREEN，不改变或掩盖实际070失败。


## v1.3 correction049 — accurate semantic precondition feedback

Actual normal BrowserProfile real073 persisted multiple valid frameworks, but compileOpenExplorationIR emitted FRAMEWORK_REQUIRED for two still-unresolved semantic conflicts. The model repeatedly rebound the framework rather than updating semantic interpretations. Existing absence/identity checks remain unchanged; unresolved meaning is separately SEMANTIC_CONFLICT, with the same actionable conflict questions and interpret_meaning route used by calculation. No exploratory execution, calculation or proof is admitted until the actual context has been updated and rebound. Natural-language claims alone do not close stored conflicts; source/user evidence and existing interpretation rules remain authoritative. No new defaults, material grants, runtime, model changes or retries.

Acceptance SEM-FEEDBACK01: a real Application with a persisted valid conflicting framework returns SEMANTIC_CONFLICT plus actual questions, not needs_framework; execution count remains zero. SEM-FEEDBACK02: in the same run, explicit legitimate meaning update plus framework binding admits exploration and subsequent independently checked calculation. Missing/stale framework checks still refuse. Causal RED before code; affected regression after. real073 failure and all physical consumption remain historical.


## v1.3 correction050 — show actual execution before asking the user

AUUI-01/03: real073 was still running source/meaning checks, yet the central current moment displayed “需要你的说明” merely because unresolved candidate semantics existed. The existing task projection is authoritative: running/pending shows execution; failed, stopped and UNKNOWN retain their actual state instead of being replaced with a clarification prompt. Only a waiting/ready clarification may display the existing meaning question. All conflicts remain inspectable in the approved context drawer, and execution guards are unchanged. No new UI, lifecycle, automatic conflict closure or permission.

Acceptance UI-STATE01: through the existing production renderQuickAnalysisWorkbench seam, actual running/pending/failed/stopped/UNKNOWN states cannot masquerade as waiting for user clarification; their current execution remains visible. UI-STATE02: a genuinely waiting task still displays the real question and alternatives. Causal RED and negative regression are required; normal browser screenshot is reported separately from static render verification.


## v1.3 报告参数归属修正051（真实076因果失败）

真实生产入口已经本地计算/独立核验1500人民币元并保存MiMo完整JSON，但真实绑定配置“输入倍率与输出倍率均为1”被报告业务数字防编造检查误拒绝。本修正沿用已批准数字依据/范围合同：解释可陈述所引用实际IR的输入/输出倍率参数，仅检查参数值及语义角色相符；多输入不同倍率时不能笼统说输入倍率一致。配置参数不升级为核验的业务结果，错误倍率、漏引用、跨事实套用、金额/比例/数量仍拒绝；不改模型/SDK/权限/重试/UI。采用可回读新呈现版本2.0，旧1.1～1.9报告按原规则重验/历史内容不改写。已批准测试接缝compileNumericReport/validateNumericReport新增METADATA01真实模式与负例；因缺失行为RED后最小GREEN，再真实生产补验。


## v1.3 程序逐行协议反馈修正052（真实078）

真实078提交语义/单位成功，但explore_with_python.code_lines单个字符串含真实换行；程序入口拒绝CODE_INVALID，schema却允许，因而没有原生一次结构纠正反馈，终止后AUTHORITY_REQUIRED掩盖原因。保持已批准逐行数组或完整code字符串合同不变：code_lines每项不含CR/LF须显式反映到explore及correct_exploration_code实际schema。模型看到实际pattern问题后，可显式选择完整code或正确逐行数组；无后台拆行/解码/默认源码/隐式重放。零物理执行前拒绝；一次纠正仍有限；真撤权/停止/业务范围负例保留。实际Application＋原生业务工具接缝LINE01因行为缺失RED→GREEN，随后原生产Profile验证，不改SDK/模型/隔离/UI。


## V13 053/054 — real079/080 反馈遗漏修正

沿用 createDelegationMaterialReferences 的私有短引用解析。身份完整通过后收集共同路径缺失/两类总量/完成引用不在选择内；diagnostic 只含所选目录交集、数量和既有上限，不读取额外材料或替Agent决定工作。旧 resolveSelection 不改，queue 再核对不改，所有调用仍最多一次纠正。
报告 numericReportEditSystem 中原伪JSON被真实MiMo759照抄；改成加引号的有效JSON示例（包括派生例）。保持消费者JSON.parse/数值与来源guard，048最终JSON优先及0512.0历史兼容不改。真实079四项计算已核验但无协作/报告；0801500元已核验但无报告。原失败、32768 UNKNOWN预留、当前759物理消耗和SDK0.4.1保留，未有在途。


## v1.3 native catalog055 — bounded eager small and discovered large schemas
Real083 raw778/779 are unfinished JSON at hypotheses, both rejected before effects. Actual181179-byte request repeats >30KB IR schemas in four tools. Keep exact full declarations for schemas<=8192 UTF8 bytes (including delegation/meaning/units). For explicit toolDiscovery only, larger schemas use object parameter declaration with description directing read_tool_contract; actual trusted returned schema promotes only that current matching name/schema, using run-local observations already collected by Adapter. A live unknown schema may not be fabricated from model content or persisted history. Promotion changes only trusted Provider projection, not immutable SDK tool metadata, arguments, strict business Check, correction allowance, scope, retries, session engine or permissions. Non-discovery and compatibility paths retain full projection. System describes progressive contracts accurately. Diagnose same failure before another real run; no SDK change or silent JSON repair.


## V13-CATALOG03 - 056 implementation decision

Add an optional native execute contract-discovery callback before the existing business dispatcher, default unchanged. Current authorized Application tool definition is the only schema authority. Reuse run-local discoveredContracts hash and modelTurn: unknown large first use returns exact parameters/executed:false, later same-response operations defer until the model observes feedback. Verify signals, current authorization and phase availability before disclosure; yield goes to original dispatcher. Clear each run; fixed SDK capability declarations and stable Task accounting unchanged. No argument storage/replay, defaults or Check relaxation. Existing forged-read negative stays; trusted first-use disclosure may then promote the exact schema. New negatives retain one correction and revocation.


## V13-NULLABLE-BINDING01 - private diagnostic decision (057)

Add only a group-field boolean to the existing exact-reference resolver's field helper. On unresolved group_by, append conditional no-group null semantics to expected; never transform value or broaden actual bindings. Keep source/sheet identity and Core compilation unchanged. The qualifier is necessary because allocation weights require a real group. Existing public pure resolver/Core test seam is approved and reused, no new persistence/API/SDK/UI boundary. Real086 failure and source056/full055 evidence remain.


## V13-CATALOG04 - 058 private correction

Pass original args to the existing optional native callback. Only the first unfamiliar large contract uses trusted full Check to decide whether discovery is necessary; valid input returns to unchanged dispatcher, which rechecks and invokes actual Application. Schema-invalid first input gets exact current contract; no transformation. This small duplicate first-use Check avoids a new shared dispatcher strategy/interface and never substitutes for business/authorization checks. Keep run-local discovered hashes and same-response contract-defer marker. Explicitly retain all prior failure evidence; update056 valid-first tests to invalid-first for preserved discovery negatives, add a causal valid-reference test reproducing087. No SDK, persistence, UI, model, retry or authority change.


## V13-LINE02 — private trusted schema diagnostic (059)
Add the same physical-line description only to explore_with_python and correct_exploration_code code_lines item schema. Existing expected_schema projection then includes the meaning at the actual rejected item path; no rejected input echo or parameter inspection/repair. Reuse approved Application/native dispatcher test seam; regression drives actual schema rejection followed by model-explicit valid line array, asserts exact joined code, preserved indentation/string escape and unchanged not_performed grade. Keep full-code compatibility and existing one-correction, cancellation, authority, execution-scope and output guards.


## V13-DELEGATION-CORRECTION02 — private counter lifetime (060)
Reset only Application delegationCorrections after original delegate_analysis successfully returns business state queued or returned, following actual full material/path/creation/authority checks. This is resolution of pending instruction, not an additional correction for rejected input. Same unresolved repeat keeps global blockedCode stop; no reset on feedback/deferred/exception. Reuse actual Store/application delegation fixtures and unchanged native batch tests. No map/new persistence, SDK, budget, model or UI changes. Current real089 one queued child remains historical failure and is not replayed.


## V13-ARGUMENT-CORRECTION03 — pending structural operation lifetime (061)
Real090 completed an explicitly corrected initial step plan and four actual independent net checks, then a later malformed append was denied first feedback because native schema rejection was retained for the entire tool lifetime. Keep the failed run and consumption. Successful original tool execution, still-authorized publication and valid JSON result resolve the pending structural correction for that tool. A later independent operation may receive first feedback; repeated invalid unresolved arguments still stop. No clear on schema failure, deferred batch, exception, revoked/late authority or invalid result. Preserve same-model-response feedback deferral, exact Check, untouched arguments, physical extraAttempts=1, permissions, SDK and ledger. Through installed native SDK, test invalid -> valid effect -> later invalid -> valid effect plus later repeated invalid failure and no new effect. No auto repair/replay or broader code-correction allowance.

061 affected regression exposed four existing program-line allowance negatives. Preserve them unchanged: explore_with_python / correct_exploration_code retain the existing per-run code correction bound; successful non-program structural operations alone resolve pending schema feedback. Initial061 GREEN attempt failed those four negatives and is retained, not relabeled.


## V13-NATIVE-JSON01 — bounded existing Adapter transport contrast (062)
Raw Provider841/842 reconstructed JSON equals native SDK decoded arguments: malformed nested step arrays originate before Adapter/SDK interpretation, not a host repair bug. Preserve real091 FAIL/842 calls/472764 known output/32768 old UNKNOWN. One bounded alternative reuses the existing Pi Adapter arguments_json transport for large (>8192-byte) discovered business contracts while retaining native named tools. Provider declares one exact JSON string; the product Adapter parses it losslessly and passes the original business object through the same trusted Check, current authority, Application/Core/IR consumer and ledger. No model/SDK/runtime replacement, sidecar repair, defaults, relaxed validator, permission or retry change. Small contracts and non-discovery compatibility retain original declarations; old direct valid named calls remain accepted. Malformed text, repeated invalid business structure, mixed wrapper fields, unavailable/withdrawn tools and same-response feedback remain denied/deferred before effect. Current trusted read_tool_contract returns unchanged full business schema. Private wire representation only, no public business/persistence contract change; fixed SDK metadata remains unchanged and no old UNKNOWN replays. Native integration must prove actual consumer receives exact nested object/string bytes and later model consumes its actual result, cumulative requests settle once. Next same material/question real092 is the single bounded complete contrast; if the same non-convergent problem persists without meaningful improvement, stop affected real work and seek a concrete approach decision, not more attempts.

## V13-NATIVE-JSON03 / checkpoint064 — 用户批准063接入方式

本轮“同意”采用063提案，不重新启动Change。原生命名工具中含嵌套object/array（沿用既有兼容Adapter的properties/anyOf选择规则）的参数采用既有单独arguments_json字符串入口；大合同既有入口保留。纯标量/空参数保持直接入口。小结构合同在当前工具描述中完整提供，大合同仍由read_tool_contract读取；不增加强制往返。旧直接有效调用兼容。

文本仅JSON.parse为实际对象后送原schema/身份/授权/业务消费者；不补值、不改类型、不转换XML。无额外模型纠正/主备重试，无SDK/Core/IR/权限改变。原生JSONL保留原始线格式；协作只读投影精确解码有效单字段对象以关联实际委派/返回/后续消费，不将未执行/失败包装认作成功。

验收：真实安装SDK的生产Adapter公开入口证明小嵌套合同在首轮可见、整数/数组/null/中文文本原样抵达业务消费者及后续模型；字符串行号/畸形/额外包装/撤权无效果，重复未解决错误关闭；纯标量入口不变。磁盘重开协作记录证明真实委派身份与后续消费，读回不调用模型、不重置账本。既有因果负例及直接入口保持。真实完整同任务双子/合法孙任务/回流消费/MiMo报告仍OPEN；一次对照若同类格式仍无进展，停止路径并集中提出具体取舍。

授权020实时时窗已过期（本轮UTC2026-10-10 22:16:46）；已提出只续展时窗请求，未发Provider。848/1040次、475256已知输出、32768 UNKNOWN预留、56万上限不重置；自动跟进PAUSED，用户验收停止线保留。


## V13-MODEL-PURPOSE01 · 067 用户批准 MiMo 工具分析对照

用户已批准一次MiMo Flash工具分析对照，最多40次请求/60分钟，计入1040次/56万总上限，852次/476946已知输出/32768 UNKNOWN预留不重置。只用原后端入口及investigation049合成材料；只创建隔离的新测试任务，旧任务不改配置/不重放。当前默认MiniMax分析与MiMo报告不变。AS04仍未通过，完整候选/独立验证/用户验收未完成。

接受边界：生产Pi Adapter创建时显式选择获准分析型号MiniMax-M3或mimo-v2.6-flash，创建后固定；同一选择进入SDK不可变用途集合的analysis与proposal_prepare，report_edit固定MiMo无工具，retained_case固定历史Pro。不得在transport替换型号或错记返回身份/账本。主根/子孙会话共用实际配置和稳定Task账本；旧Task更换用途集合必须由SDK拒绝，不能清账。恢复原默认无需迁移。未验证用途不对普通生产任务自动启用。

TDD seam沿用户已批准的原生Adapter/实际安装SDK/本地RequestLedger与真实Profile入口：验证工具结果被下一模型轮消费、根与子会话均实际采用所选模型、report无工具且保留用途，Provider/返回身份/历史账一致、非法选择在effects前拒绝、重建后改变旧Task配置拒绝。替身模型机制证据不作为真实MiMo用途PASS。真实对照沿用全部原参数schema与JSON codec/权限/IR/本地计算/独立核验/协作回流/一次纠正及额外请求合同，不修复模型输出或降验收。若再次发生同类非收敛，先保留诊断，不盲重跑。

## V13-BUSINESS-HANDOFF01 · 069 有界业务子问题

用户明确批准“允许有界业务子问题交接”。新增可选 business_question，作为模型在获准任务及所选核验材料内拟定的具体业务子问题；不是直接转发本地 task/private_purpose、根原话、未选历史或秘密。原 action、精确引用及完成引用仍控制实际材料；问题文字不取得任何额外数据或工具权限，不作为已核验事实。旧无字段指令按原投影读回。

先验证当前身份/停止线和完整材料集合，再校验非空有界文本及拒绝直接复制本地私有目的/根原话；落盘问题与精确引用，并在实际子模型 authorized_context/visible_message 中交付。孙任务可拟定更聚焦问题，但不能重新获取父任务排除材料；问题措辞变化不能绕过祖先同 action/引用工作的重复委派检查。语义是否切题由模型及任务质量验收判断，字段/引用校验不冒称自然语言含义或秘密识别证明。专业内容、执行/核验、原生SDK、重试、预算、未知及停止边界不变。

SDD/TDD沿已批准实际 Application队列→持久子任务→模型授权payload/公开Runtime seam：正例检查具体业务问题、合法孙任务和持久读回；负例覆盖私有目的/根原话直接透传、空/未知字段、未选引用、陈旧身份、停止及重复祖先工作。保留旧隐私负例；不靠夹具生成的孙任务宣称真实AS04。真实验证仅在授权022剩余额度/窗口内，默认MiniMax不变；新问题不保证模型一定委派孙任务。


### V13-PREPARE-REF01 — choose already validated candidate IR without re-copying
real110 same-task preparation successfully consumed structural correction and bound source meaning/units. read_analysis_evidence compiled eight actual proposed IRs; repeated serialization of the same long set_analysis_steps JSON failed and the existing correction cap ended preparation. Preserve this failure and stop paid repetition. One bounded engineering hypothesis: proposal preparation returns run-local candidate references for its already validated plans; set_analysis_steps accepts exactly one original plan OR current plan_ref for each step. Agent still chooses title/dependency/hypothesis/evidence/limits and actual candidate. Lookup never repairs model text, manufactures methods, selects a default, computes or adopts. Resolve only candidates issued by this preparation run under identical Task/revision/grant/source/config, semantic and business context; missing, previous-run, changed-context and mixed plan/ref are denied before binding/effects. Recompile the same actual IR through existing Context/Binding consumers and preserve scope/unit validation. Existing complete plan input remains compatible. No new tool names, SDK purpose/config/Runtime, persistent schema, public API, model, permission, or UI. References are private ephemeral transport, not persisted authority; reopen must reread current plans. Formal plan and history continue storing real bound IR, not ephemeral references. Tests use actual Application and real compiler for success/equivalence and negative paths; no Provider until causal RED/GREEN and affected checks. If paid same serialization/loop/timeout recurs, stop that route rather than enlarge correction limits.

## V13-NATIVE-OBJECT01 — approved native object wire (decision026)
User explicitly approves original Provider object/array/null schemas in the product Pi Adapter, with no SDK/UI/model change. New opted-in Tasks use named native tools for analysis and proposal preparation. Existing sessions retain their exact registered tool/purpose set and legacy JSON-text compatibility; durable owner binding fixes the mode across restart. Full schema and business authority, actual IR compilation/execution/verification, metering and bounded correction remain authoritative; no repair/coercion or automatic replay. Exactly one new synthetic product Task may verify within authorization025 (effective967 requests/640000 output/09:23:20 deadline), historical failure and UNKNOWN unchanged. Causal native SDK declaration/consumer tests plus legacy restart/controls and affected regressions are required; real full-chain success is separate from offline checks.


## V13-PLAN-VARIANT080 — approved bound plan reference channel

User decision027 authorizes private Application correction within v1.3. Existing read_analysis_evidence exposes current_plan_ref bound to full current identity, Context, plan and source. required_variants references that exact current plan, names a goal and supplies explicit input-index changes to column, group_by and/or filters. Unspecified fields inherit the referenced plan unchanged. No model, SDK, tool-name registry, UI, persistence schema, budget or authority change. Full required_plans remains compatible.

AC080-01: two meaningful explicit changes produce different complete IR, actual local numbers and independent verification, preserving original method, unit and join. AC080-02: omitted fields remain unchanged; malformed, stale/foreign reference, absent input, unsupported method or nonexistent field denied without effects. AC080-03: existing source, Context and business scope checks, revocation, authorization and required-calculation consumers remain authoritative. Tests use existing Application tool boundary and actual IR/independent verifier, then installed native SDK boundary; external model substitution is offline evidence only.

Allowed: packages/application/open-analysis.ts, private Application variant helper, corresponding integration tests and this OpenSpec. Forbidden: SDK, profiles, UI, model/provider/credentials, public schemas, Task migration/new Task, budget reset or expansion. Same failed Task may only use supported explicit revision continuation after reconciliation; old failure/UNKNOWN remains. Paid time expiry blocks only physical calls, not safe offline engineering.


# Proposal phase feedback081

Observed actual957 tool declaration excludes calculate_and_verify but read_analysis_evidence descriptor positively instructs it. Fix only model-facing phase instruction: preparation reads and binds candidate/variants, execution remains unavailable; no hidden transition or permission change. Maintain original full-IR/reference channels. Existing private engineering authority includes this causal correction; paid route remains stopped during diagnosis.

AC081: actual Application and installed native SDK proposal-only tool declaration/receipt never positively instruct unavailable calculation; original phase denies forbidden calculation, allows candidate reference variants and binding; execution phase description and actual calculation remain unchanged.
### V13-SAME-QUESTION-ADOPT082

Real114 returned a ready preview but adoption raised TASK_BUSY. The storage adapter's unchanged-input optimization returned the old failed Task before inspecting `adopt_preview_command_id`; Application then tried to begin that failed Task. Restrict the no-op optimization to ordinary input revision without explicit preview adoption. Keep existing closed-field, baseline, grant, ledger and idempotency checks. Public Profile regression exercises failed Task → same-question preview → explicit adoption → real calculation/independent verification, preserving failure history and rejecting unconfirmed/stale previews. Evidence: `controller/v13-autonomous-analysis-001/same-question-adoption082/` under the existing Mini evidence root. No new schema, grant, runtime or UI.
### V13-EXECUTION-REFERENCE083

Real116 proved082 explicit adoption works (same Task revision2, old failed revision1 retained), but the blocked calculate receipt still instructed full IR for other calculations. Three invalid full-plan submissions followed; four settled physical requests, no new UNKNOWN, no collaboration/report. Align this receipt and the evidence descriptor with the already-approved reference-plan route: include current_plan_ref and prefer explicit variants for the same method. Keep complete schemas and full-plan path for new methods; do not repair model arguments silently or inject oracle results. Causal public Application and installed native SDK tests consume this exact blocked-calculation reference, declare current/full-period and filtered January recipes, and verify real1050/430 through existing independent verifier. Evidence controller/v13-autonomous-analysis-001/execution-reference-feedback083/.
### V13-REFERENCE-BIND084

Real117 failed in preparation while rewriting joined inputs, before execution feedback083. Approved reference route027 was incompletely exposed: variants existed for calculation declaration, while the existing single-framework setter still required copying every field. Add a closed reference branch to the two existing binding entries, keeping full schemas as the compatibility branch. Resolve current identity/Context/plan-scoped reference, preserve unchanged recipe, apply only explicit080 edits and compile current Context/IR via existing persistFramework. Exact unchanged recipe requires no fake edit; optional goal is explicit and all method/source/unit/join remain inherited. No new SDK name/configuration, Task, permission, graph or UI. Causal tests at existing Application and native SDK seams precede code. Evidence controller/v13-autonomous-analysis-001/referenced-framework-binding084/.

# V13-BINDING-REFERENCE-RECEIPT085

Already approved reference route027, no new tool/schema/table/Task/SDK/model/UI or authority. Real118 successfully consumed short variants and locally independently checked January/February nets, then correctly bound new gross methods using original setter. Its binding receipts give full compiled IR but no current_plan_ref or declaration-next instruction. Request993 guessed unavailable calculation_ref;994/995 recopied full new-method plans with numeric version/object filters and failed TOOL_FAILED. Physical975–99521SUCCESS/7731output, revision3 failed retained,2valid proofs,0children/report/newUNKNOWN. Stop paid route.

Minimal correction: existing persistFramework receipt returns actual current_plan_ref after successful compiler/source/evolution/save checks. For execution requiring declarations, direct read_analysis_evidence.required_current_plan then actual returned calculation_ref; other key variants refer to receipt hash. Preparation may bind the returned current reference but never calculate. New methods still use normal full setter once; no schema repair, silent required calculation or force-calculation. Same source, semantics, bounds, current-only reference expiry. Public Application and installed SDK tests: setter new source method -> receipt ref -> current declaration -> actual local calculation/independent verification; no hand-built completeIR. Old prior receipt is rejected after changing recipe or Context; source/revocation/save guards remain. Full current validation frozen084 must finish before source edits.

# V13-BOUND-CANDIDATE-RECEIPT086

Complete approved reference route027 using existing078 candidate handle compiler, not a new tool/session/method. Real119 six settled requests996-1001/2483output, failed preview, rootrevision3 unchanged, two prior valid proofs retained, no children/report/newUNKNOWN. Provider accepted joined binding then recopied malformed full plan and invented undeclared dependency into set_analysis_steps; paid route stopped.085 reference receipt fixes single-framework path but does not give the existing step-plan reference handles.

Minimal private feedback: successful proposal-only persistFramework receipt exposes candidate_refs:referenceCandidates([actualCompiledNext]) and actual current_steps. Model chooses existing set_analysis_steps with returned plan_ref; must explicitly submit titles/dependencies/hypotheses/evidence/limitations and first replace/append against actual graph. No automatic graph, business guess, parameter repair or calculation. All original reference token/current Context/source/evolution checks stay, existing full plans stay compatible. Unit receipt also enters same actual helper.

Public Application causal RED missing binding candidate handle; GREEN binds two explicit scopes then existing step compiler consumes handles and output IR really locally calculates and independently verifies, proposal never executes. Installed native SDK consumes these actual receipts without recopying IR. Existing stale/foreign/mixed candidates and undeclared dependencies remain denied. No new tool/schema/Task/SDK/model/UI/permission. Full closure stillOPEN; sameTask paid continuation only after relevant proof, within028 resource bounds.

### V13-KNOWN-UNISSUED-RECOVERY087 engineering impact and acceptance

Authorization029 raises only supplemental output2000000, preserves1047requestcap/deadline11:21:49.236 and1015calls/566419known/69632historicalUNKNOWN. Actual SDK inspect124 proves current native run f41d9541-d2aa-4e62-891a-0d38177c4c91 terminalfailed, no pending operation. External123 refusal before dispatch verified; internal UNKNOWN remains real until supported reconciliation. Existing native failed result plus settled physical receipts may close UNKNOWN as stopped, never as successful calculation.

Engineering Controller impact: extend existing business Runtime/Store recovery seam privately (optional native terminal check and stopped-failure settlement) without Pi types in Port, new schema/table, SDK or UI changes. Only explicit resume of knownidle source-bound sameidentity Task, all ledger receipts terminal, SDK model reservations settled, native stored result terminalfailed, audit has no unmatched tools, and product step events have no unknown local computation may reconcile to stopped then original resume. Existing qualified checkpoint path remains. True UNKNOWN model/effect, active writer, missing terminal result, changed identity/scope/config/revocation, unsupported runtime, success receipt mistaken for failure all deny. Original failures, history, usage and original checkpoint remain unchanged. No new Task/automatic resume or duplicated session engine.

Existing public Profile resume and actual installed nativeSDK boundaries are the approved test seams. CausalRED: settled known pre-dispatch refusal + terminalfailed runtime cannot resume because no calculation checkpoint. GREEN must permit explicit continuation, retain failed/unknown historical receipts and identity, execute only after explicitresume; genuine native computationUNKNOWN and unsettled provider tests remain rejecting. Adapter checks actual native inspect/result/audit and existing ledger/budget, not a fabricated model claim. External known-unissued reconciliation uses original authoritative ledger.settle and budget lease settleModelUsage after receipt verification; request/resource counters retained, actual zero usage replaces only exact unissued reservation. No raw DB writes.


### V13-PLAN-REFERENCE-FEEDBACK088

# V13-PLAN-REFERENCE-FEEDBACK088

Real125: twelve physical successful MiniMax requests1016–1027,4527output. Six actual independently verified net slices saved on sameTask/revision4. No child, MiMo report or complete AS04. External physical calls1027/1047,known570946,historicalUNKNOWN69632; output2000000/original11:21:49.236 deadline. Requests all settled; paid route stopped at first terminal TOOL_FAILED/AUTHORITY_REQUIRED. Last required_variants references old504e... after six variant calculations replace current recipe. Source/Task/grant/business/semantics unchanged; original compiled recipe remains historical reference, not current binding. It also repeats input_index0 updates; current one-object-per-input contract stays enforced.

Engineering correction within approved reference-channel scope: remember only references actually emitted in the current Application run with exact candidateContext (Task identity+business+semantics). A stale same-context reference may receive pre-effect needs_current_plan diagnostics, current recipe/current reference and explicit correction instructions. It is NEVER resolved to an old plan, rebound automatically, computed or accepted. Foreign references, prior Context, changed source, revoked authority, unknown fields and omitted method guards remain denying. Full method changes cannot be expressed as variants. Same input's filters/group/column must be in one explicit change object, no silent merge.

Public Application and installed native SDK are existing accepted seams. CausalRED: model receives old reference, computes one declared variant (current recipe changes), then references the old handle with unchanged Context; current route terminates instead of offering no-effect correction. GREEN: actual native next model consumes needs_current_plan, explicitly chooses fresh handle/correction, actual second local computation+independent verification succeeds; malformed/foreign/revoked/context/source negatives remain. No SDK/UI/schema/provider/model/permission/budget/newTask changes. Retain125failure, all receipts and sixproofs. SameTask candidate preview/adoption is existing approved continuation after settled failure; no automatic retry of UNKNOWN.


088 bounded correction: one pre-effect stale-reference diagnostic until an explicitly fresh-reference variant has successfully compiled and passed the existing scope checks. Repeating stale input without that progress must refuse CANDIDATE_REFERENCE_INVALID; no automatic merge/rebase/replay. RED003 proves the repeated stale input previously received unlimited feedback; red002 failed to append its fixture due encoding and is not causal evidence.
# 089：目标复核复用原生分析循环

在 Application 当前委派让出／drain／续接循环内加入一次有界目标复核；仅 agentLed、原生持有历史、已开放协作的实际执行适用。复核仍调用现有 analysis 用途和同一 tools，无新增 SDK 配置、工具、会话引擎、持久 schema、Provider 或公开合同。复核提示携带原目标及真实返回摘要；选择工作仍归 Agent。queued 时复用既有调度、权限子集和回流消费者。authority/source/signal 检查先于复核和下一次请求。准备、已待信息和旧 report-edit 续接不进入；最多一次复核，不用重复提醒直到强行凑齐验收。完整协作及报告仍需真实补验。


### V13-DELEGATION-WIRE090：原生对象入口的扁平委派参数

真实128在第1055/1056次请求连续把两个引用数组写成 {item:[...]}，执行前拒绝，两次消耗保留；13次物理请求全部结算，当前同Task版本6 failed、5项真实核算凭证，未创建子任务，不是AS04通过。127准备失败也保留。授权030为累计1207请求、200万输出、UTC07:28:54截止；当前1056请求/587845已知输出/69632历史UNKNOWN预留。

工程影响：仅当前已选择原生对象通道的 Pi Adapter 私有参数投影。模型收到一个扁平对象：kind/task/business_question(可选)/action/material_ids/reference_paths/completion_reference_paths。没有嵌套 instruction 或 anyOf 索引格式。明确数组和材料引用；收到合法对象后无损构建原 business instruction，原 Application 的目录、真实路径、总体12引用、最多8材料、授权子集、业务问题及停止检查仍执行。错形数组不展开、不强转、不自动补材料或路径。不复制SDK、不改变固定SDK用途/Task配置/模型/权限/UI/持久合同。历史及非对象通道、旧直接业务合同和索引选择保持兼容。

read_tool_contract 与当前原生声明返回同一投影合同；材料目录只调整入口用法说明，不改变实际目录/可见路径。旧历史工具参数只作历史，下一次调用遵守当前声明。公开Runtime/实际生产Profile与已安装SDK为既有测试入口。因果RED：模型按扁平合同提交，当前运行拒绝、零委派效果；GREEN须经过真实SDK调度准确到原业务 executor。负例保留 {item}拒绝、未知字段/伪造路径/超出总引用/撤权零效果；原生完整协作Profile、传统JSON/索引/历史回归通过后，再用同Task正常续接补验。真实Provider尚未通过，不凭替代模型测试宣称AS04。


### V13-NATIVE-READ-CONTEXT091

Real129 consumed090 flat native delegation correctly after one explicit reference-selection correction. One actual child345aae43-8828-4688-bae0-da4aaca312ad was created, but no child Attempt began: runtime.run returned TASK_BUSY. Ten physical calls1057-1066 are settled. SameTask revision7 failed, five actual proofs retained; AS04/report OPEN. Global1066/1207,590636known output/69632historicalUNKNOWN/2moutput and030deadline retained. Normal browser execution-drawer/status reads overlapped this run. Idle snapshot/trace currently borrow the Adapter current writer sentinel; next authorized native run rejects that temporary reader as TASK_BUSY. Four public installed-native-SDK tests reproduce this race: snapshot/trace plus root/child continuation all reject while the read itself succeeds. No Provider is called by these substitute-model tests.

Engineering impact is private Adapter authorization-context lifetime. Idle read completion is awaited before the next already-authorized run rechecks signal, authority and physical idle. Real running/writing controls still reject a second writer. Idle reads are serialized around the existing context, release on failure and cannot clear a different active writer, change grants, reset ledgers or call models. Waiting can be cancelled. No new session engine, business queue, SDK change, Port/schema/persistence/configuration/UI or permission. Existing product contract requires readback to be non-executing and to preserve task continuation. Public Runtime and installed SDK remain test seams. CausalRED is TASK_BUSY despite settled previous run and successful idle read; GREEN must preserve both read and next authorized run with one request per run and none from read. Retain second-writer rejection, cancellation/revocation and existing session/queue/recovery negatives.

090 portable result:4153total,4135PASS,18conditionalSKIP,0FAIL,source_drift=[],exit0. Real129failure and child are retained; no automatic replay of unknown effects. red001 also contains a failed documentation-write command from stdin encoding; it is not claimed as spec-order evidence. Canonical091 impact is now recorded before implementation; rerun the causal tests after this record.


### V13-NATIVE-IDLE-BOUNDARY092

Real130 repeated TASK_BUSY after creating a child, with no child Attempt, ten settled physical calls1067-1076, five current proofs and no report. Keep failedrev8, old queuedchildren, all1076/592671/69632 historical usage and authorization030. portable091 exit0/source_drift=[]; this is not AS04 PASS. SDK run may return an aborted terminal result before its physical work/lease/session-writer cleanup completes. Product Adapter currently reads history and clears its live authorization context immediately after that early return. The SDK already exposes waitForIdle(task); use this existing physical-boundary primitive, never another run/replay or a new queue/engine. Establish a causal public Adapter+installedSDK timeout test before changing implementation.

Acceptance: while an admitted tool is still settling after timeout, keep the existing authorization context and single-writer ownership; do not read native disk history or allow another run before SDK physical idle. Once settlement is complete, retain actual terminal reason and negative publication/UNKNOWN behavior. No fabricated timeout success. Preserve cancellation/revocation, queue/branch/history and exact effect receipts. Private Adapter orchestration only; no SDK/model/default timeout/UI/limits/Port/persistence changes or new authority. Whole sameTask paid route remains stopped for diagnosis until this repair is proven.


### V13-STORAGE-AUTHORITY-READ094：无变化记录的验证复用

已复现生产公开Store.read在同一第10版原始字节未变时冷读512.66ms、后续读回454–464ms。其历史重编译发生于每次授权检查，真实131委派／子任务工具耗时长。该观察证明重复验证热路径成本，不证明131原生控制超时的唯一根因；恢复会话诊断已排除简单JSONL扫描迟缓。

普通私有Storage Adapter修正：每次继续独立查询最新SQLite行、校验路径/符号链接/数据库schema。仅在任务ID、完整body_json字节及body_sha256三个值与已完整解码验证的单条缓存完全一致时，复用已验证值，并返回新的深拷贝。缓存只保留一个任务，进程/Store重开为空；任何字段、历史、摘要、数据库行变化均重新走原完整decode，异常不能进入缓存。写入、保存验证、事务、最新epoch/停止/授权/来源读取与所有业务完整性条件不降低，不凭摘要一致忽略字节差异。不改数据库schema、SDK、UI、Provider或权限。缓存值不授予执行权，也不成为磁盘以外状态权威。

既有公开Store/Profile读回是已批准验证seam。先保存真实冷/热成本因果RED，再验证相同记录热读显著改善；永久回归须证明返回值修改不污染、另一Store的停止/恢复立即可见、旧租约仍拒绝、正文或摘要篡改与重新计算摘要的非法历史仍拒绝。对生产原任务的验证只读；不得改原现场来制造测试。


### V13-NATIVE-MODEL-PENDING095：超时返回与物理隔离分离

portable092实际发现SDK041-NEG02物理模型gate未返回时，新增无条件waitForIdle让Runtime.run无法返回超时，测试阻塞超过5分钟；SIGTERM只停止本任务自有离线测试子进程，原未完成记录保留。092已准入工具必须完成实际清理的要求继续有效；不能靠等待未知模型永远返回来显示停止或超时。

正常工程修正：SDK已给终态、但权威请求账本仍有未结算物理模型请求时，及时向调用方返回相同失败／取消原因，并保留当前Runtime写入/授权上下文，直到SDK实际waitForIdle结束才清理。新写入仍TASK_BUSY，UNKNOWN/在途不能重放或重试，迟到结果仍不发布。已结算模型而仍有准入工具清理时，继续092等待工具的边界。不得释放账本UNKNOWN、清零预算、变更默认30秒或测试60秒，不新建Runtime或会话。未知物理清理异常保持封闭，不能凭后台Promise声明安全。

已有生产Runtime Port与SDK041-NEG02负例为批准seam。加强同一断言：从实际transport准入起，默认30秒超时须在35秒检查窗口内返回DEADLINE_EXCEEDED；旧实测pending/新写入拒绝/迟到publishable=false及原1次请求断言不删除。因果RED来自无条件等待；GREEN必须同时保持092工具实际清理及全部停止/撤权负例。


### V13-CLOSED-MODEL098: user-approved explicit reconciliation with unknown usage retained

User approved unknown132-decision/decision-brief.md on2026-10-11 after1099 real failure. Existing public Runtime reconciliation/ledger settlement and native budget are agreed seams; no new seam approval needed. Physical request1099 fully returned shortSSE and original native result failed, without dispatch of its incomplete tool call; token usage remains unknown.

Allow explicit sameidentity resume only after authoritative ledger.settle closes a physically finished model failure as failed/REQUEST_FAILED with unknown usage retained. The Runtime must independently verify native terminal failed/MODEL_FAILED, no pending session/active lease, unchanged task/grant/context, exact budget reservation owner, unmatched final model admission unique matching failed receipt, no unclosed or failed tool effect. Actual native inspection must corroborate stored run/operation. No automatic unknown settlement, rawDB write, budget refund/zero, model/tool replay, newTask, schema/SDK/UI/provider/config change. All reservations remain byte-identical; unknown charges continue occupying quota after resume and reopen. Existing087 known-unissued exact0settlement remains separate; original trueUNKNOWN/inflight/effect negatives stay.

Authoring scope: native-open-analysis.ts, existing permanent native-session integration suite, originalOpenSpec records; local evidence098. CausalRED: public explicit reconciliation refuses known-ended ledger failure with unknown tokens/retained reserve; GREEN: sameTask starts new native run, history/reserve survive, zero calls during reconciliation, current actual authorization and negative fences preserved. Source must not mark live unknown failed from model output alone. Real current settlement uses approved fixed1099 evidence+API, preserving oldUNKNOWNbefore image.


### V13-NEW-METHOD099 - reuse the existing compiler producer route
Real133:16 physical calls all settled, one returned root opinion consumed, no grandchild/report; repeated numeric version1.1 caused TOOL_FAILED. Preserve failure/history. New single-source method uses existing set_framework explicit source/method/column/unit/group/filter then read_analysis_evidence.required_current_plan:true and calculation_ref; compiler owns IR version. Same-method reference variants retain original association/method; changing goal does not change math. Complex full proposal compatibility remains strict. Align evidence/calculate descriptions and system; no schema/tool/SDK/data/model/permission/UI changes or coercion/extra retry. Existing085 actual native consumer keeps450 independent arithmetic, adds producer guidance conflict assertions; causal RED002 shows old guidance requires hand-coded IR. Full stable098 before this correction is4169 total/4151PASS/18conditionalSKIP (summary authoritative if totals differ). Target production path packages/application/open-analysis.ts and existing numeric report integration test; ordinary private implementation within current approved v1.3.


## V13-CACHED-CONTEXT100 · approved shared usage correction

User approval received on2026-10-11: bounded SDK cache/context accounting correction, fixed local release and exact adoption. Contract: shared SDK docs/CACHED-CONTEXT-CONTRACT.md UC100-1~6. Existing real134 failure,1139calls/624149known output/73728historicalUNKNOWN reserve retained; no newbudget/model/task/retry/UI/authority. SameTask configuration compatibility must be demonstrated before real continuation. Native compaction only; final fresh independent SDK review required. Evidence: /Users/bendandebaba/JuanerAI-artifacts/n01-n02/controller/v13-autonomous-analysis-001/cached-context100/.


### UC100 fixed SDK and product adoption readback
SDK0.4.3 fixed108617bytes/49files SHA256475480217d5f644a15264b2f838e5567d3e2c2e431b8a23c061a0665dbdbfa70 received fresh native independent Validator PASS, under this explicit single-review sandbox waiver. Actual loaded model/effort unexposed; role declared Sol/high; no reviewer writes/Provider/credentials/install/probe. Full SDK204core+2UI PASS zero skip, type/build and exact package consumer PASS; causal native chronology independently verified. Compatibility005/006 accidentally commented history assertion retained as incomplete;007 executes it and PASS, original unknown reserve/config/JSONL preserved. No source drift across94 frozen paths.
Product causal adoption RED001 exit1 old042 identity -> exact installation scripts-off/offline -> GREEN001318PASS/2conditional cloud archive SKIP/0FAIL; lock changes only root SDK edge and SDK package entry,49installed files match fixed extraction, Pi0.86.1 and all other dependencies unchanged. Current CI manifest/lock exact pins and directly affected active version projection updated; former042bytes/descriptors preserved in cached-context100 preimages. This does not mean Git publication, actual CI or full v1.3 accepted. Real135 same Task allowed continuation remains separate, no new Task/grant/scope/model/retry/timeout; original1139calls/624149known/73728historicalUNKNOWN at adoption preserved. SDK cache漏计已证实，不宣称是134截断唯一原因。
Evidence cached-context100/validator001-result.json,causal-native-tool-chronology001.json,packed-compatibility007.json,product-adoption001.json,product-adoption-red001.log,product-green001.log. Full product regression/type and actual complete AS04/report remain pending, followed by fresh whole-product Validator and user acceptance.


### V13-JOINED-BUILDER-GUIDE101
real135 3 settled calls1140-1142,630906known output,73728historicalUNKNOWN reserve; preparation failed TOOL_FAILED on repeated raw Provider omission of inputs[1].group_by, despite own text saying null. No SDK null removal. Existing nullable-required full builder schema/authority/IR stays strict. Ordinary private description must explicitly state every full input contains group_by; no grouping submits null, refund always null+filters[]. Same-method existing plan uses existing plan_ref route; no schema/default repair,new tool/task,SDK/model/timeout/retry/UI changes. Current native producer test confirms exact guidance arrives through real Adapter→SDK, retains original sum compute/declaration assertions and negative contract. RED before implementation, then affected regression; one controlled sameTask contrast within030 window, same failure stop diagnosis. Evidence joined-builder-guide101. FullAS04 remainsOPEN.


### V13-RECOVERY-TIMING102
Full portable100 preserved failure: existing087 test replaced measured active_ms with fixed1ms, triggering correct CONSUMPTION_REGRESSION under load; isolated run passed and does not erase full failure. Reuse approved Runtime/ledger recovery seam, inject bounded8ms deterministic transport delay to reproduce; reconcile tokens as exact nonissued0 while preserving already measured active_ms/wait_ms. Add decreasing-active negative and exact before/after meter preservation. No production, SDK, authority, UNKNOWN, budget or retry change. Evidence controller/v13-autonomous-analysis-001/recovery-timing102; full stable regression required.


### V13-SAVED-RECIPE-REFERENCE103
Real137 repeated raw nullable-input omission in preparation,3settled calls1147-1149; stopped that paid path before native compaction. Reuse approved084/086 plan and candidate-reference channels: proposal-only read_analysis_evidence may project saved framework step recipes as fresh recompiled candidate_refs against current selected sources, business and semantic Context. No inherited computation, verification, execution authority, auto-binding or forced graph; Agent explicitly chooses set_analysis_steps.plan_ref and dependencies. Source/compiler failure remains unavailable, Context changes invalidate issued candidate handles, out-of-scope or unknown refs remain rejected. No new tool/input schema, SDK/model/retry/UI or credentials. This is private producer/consumer completion of approved reference route; no nullable default repair. Causal actual Application→native Adapter→SDK test consumes saved multi-step recipes without copying full IR, binding differs with scope and retains independent450/430/620 checks; negatives remain. Evidence saved-recipe-reference103. Native explicit compaction separate existing capability; no new Task/history rewrite/navigation.

103 current producer readback: root revision12 has no step graph; its last frame is gross, while same-Task history contains net and gross recipes with identical task/grant/scope/config. Workspace may provide only those compatible same-Task recipe IRs to preparation as recipe candidates (no history text, values, verification, grants or old execution state). Recompile against current sources/Context and invalidate on change. Current frame remains unchanged until explicit new candidate binding; no fabricated step graph. This uses existing authorized root history, never forwards it to child tasks. Add positive actual-native history-recipe consumer and unauthorized-identity filter evidence.

103 real138: native root compact succeeded (1150-1151), subsequent preparation1152-1156 never called read_analysis_evidence and repeated full nullable input omission. Preserve failure; no AS04 PASS. Add explicit current saved-recipe availability hint to actual preparation prompt, directing inspect/scope/read/ref binding without inherited facts or full-IR recopy. Guide causalRED before change; one bounded contrast, if same failure returns stop paid route and report concrete approach boundary, not request more quota.


### V13-PLAN-REFERENCE-CONSUMER104
real139 preparation selected current candidate refs, but goals alone concealed actual filters/grouping and root execution could not append variants using accepted-step refs. Raw Provider1165-1167 repeated full IR errors; no SDK mutation. All11 physical calls settled,1167 total/664852known output/73728historicalUNKNOWN unchanged, root failed revision13; no current AS04/report PASS.
Complete approved084/086 reference route in private Application tools: expose actual proposal recipe with each issued candidate, and current accepted step recipes as fresh Context-bound handles. set_analysis_steps may explicitly append a current issued recipe plus optional field/group/filter changes through the existing openAnalysisPlanVariants and full Context/IR compiler. Changes never choose methods, sources, joins, units, defaults or authority; Agent chooses changes/dependencies. Current scope/source mismatch and changed Context reject old handles, no inherited proof, automatic computation or graph replacement. Preparation remains passive; execution retains prior nodes, prerequisites and proof. No public product/persistence/SDK/model/UI/retry contract change.
AC104-01 actual native read→ref append two actual scopes→explicit execute obtains distinct source-recomputed and independently checked facts; AC104-02 recipe projection exposes real source/method/filter/group/unit regardless title; AC104-03 unknown/stale/out-of-scope refs reject before save/compute, including execution. Existing direct/full IR remains compatible. Scope: Application open-analysis private tools + existing permanent integration tests, spec/verification only. Causal RED external actual native harness is preserved before code; permanent test derives same seam. Evidence plan-reference-consumer104. A single bounded real contrast follows only after offline GREEN; repeated same raw failure stops paid route without quota loop.


### V13-STALE-CANDIDATE105
real140 reused an ephemeral candidate handle from native summary, without establishing this run's references; the original guard correctly rejected binding. Five calls settled; root remains failed revision13,1172 cumulative requests/671156 known output/73728 historical UNKNOWN reserve; no current report PASS. Causal native RED001 demonstrates CANDIDATE_REFERENCE_INVALID terminates before explicit current read.
Within approved private reference channel, return effect-free needs_current_candidate once only for structurally valid candidate:UUID absent from current issued map, directing explicit read_analysis_evidence then explicit selection. Never translate, auto-bind, auto-read or execute. Repeated absent handles, malformed handles, issued references whose Context changed, and scope/source/hash conflicts retain terminal rejection. This is one parameter correction, not a Provider retry or new authority.
AC105-01 actual native stale handle→effect-free feedback→explicit current read→fresh binding succeeds in passive preparation. AC105-02 repeated absent reference remains terminal before persistence/calculation. AC105-03 changed Context, malformed handles and fixed scope negatives preserved. No SDK/model/UI/persistence/permissions/Task/retry changes. Evidence stale-candidate-feedback105. One real contrast only after GREEN within authorization030; same failure again stops paid route for diagnosis.


### V13-CONTEXT-REFERENCE106
real1411173 actually read current candidates,1174 updated valid business Context within unchanged source/grant/config,1175 reused old Context handles. Correct rejection but overly terminal feedback prevents explicit current read. All3 physical calls settled;1175 cumulative/673710known output/73728historicalUNKNOWN reserve; no new calculation/report or physical inflight. Paid identical route stopped. Native causal RED001 reproduces read→business update→stale reference rejection before fresh read.
Extend105 existing one-only effect-free needs_current_candidate feedback to structurally valid issued-but-stale Context references. Old reference remains rejected, never remapped or accepted. Agent must explicitly read actual current recipes, select a fresh reference and submit; compiler rechecks scope and source. No automatic read, bind, save, compute, Context rollback or authority reuse. Second invalid candidate, malformed candidate, source/grant denial and corrupted issued proposal hash remain terminal. Ordinary private parameter feedback, not Provider retry/public or persistent contract/SDK/UI/permission/Task change.
AC106-01 actual native read/update/old-handle→feedback→explicit fresh read/bind preserves passive preparation and exact actual sources; AC106-02 repeated old Context remains rejected with no persistence/calculation; existing source/scope/unknown/malformed negatives retained. This supersedes105 immediate-terminal Context feedback only, never its invalidation rule. Spec-first before implementation; diagnosis/RED/GREEN preserved under context-reference-feedback106. A changed-input real contrast is allowed only after offline repair, within030 original window and cumulative limits; no identical paid retry or quota renewal.


### V13-FOCUSED-TOOL107 — user approved producer contract
User adopted focused tool contract following actual raw Provider1182/1183 malformed complete IR. Existing bound framework/saved recipe consumers receive reference-only joined framework, reference-only step plans, declared current/variant evidence and calculation references. Explicit changes use the existing compiler; no automatic mapping, guessing, calculation, permission or verification inheritance. Current model-visible read_tool_contract must return the same projected schema. Legacy complete IR program executors remain compatible; unbound tasks retain typed method inputs and new methods/Python stay available. Task/model/SDK/UI/budget unchanged.
AC107-01 actual native producer schema excludes complex full IR alternatives when existing recipes are bound; explicit current recipe read, meaning revision, fresh binding and actual native consumers succeed. AC107-02 unbound/new-method and legacy program compatibility remain, stale/malformed/hash/source/authority/repeated negatives preserved. AC107-03 existing compiler variants produce real distinct calculations and independent verification, not replay/hash-only acceptance. Causal native RED before code, focused/native GREEN, type and impacted portable regression; only one changed-route real sameTask contrast under current030 window, no identical paid rerun. Whole AS04/report/independent product review/user acceptance remain OPEN.

107 verification update: actual native producer causal RED002 exposes complex inputs; GREEN001 reference read/Context update/stale feedback/fresh binding passes6 model-transport turns without Provider. Permanent GREEN006169PASS/0SKIP incl actual430/620 native calculation and independent verification, typed new sum450, legacy unbound and bound program full-proposal compatibility, stale/repeated/context/scope negatives retained. GREEN003 historical old producer schema expectations and GREEN004 new test grouped-vs-scalar fixture mismatch retained; assertions updated to approved107 producer contract and exact430/620 grouping, no production numeric repair. GREEN002 accidentally omitted numeric file and standalone document inspector environment SOURCE_INVALID do not count as product RED/PASS; canonical full107 supplies normal supported environment. Type002passed before final test loop refinement; final type/full pending. Model/Task/SDK/UI/ledger/authority unchanged. One changed-route real143 only within030. AS04/report/final whole-product Validator/user acceptance OPEN.


## V13 current recipe choices108
Approved route: use current issued candidate map and current issued bound-plan reference; filter by current Context and intact proposal hash, never issue/select a reference while projecting. Keep projected parameter objects shared through existing runtime wrappers. Refresh choice metadata after every guarded tool (including failures), so Provider projection and explicit contract reads see current choices. Empty choice uses a valid rejecting string schema, never fake IDs or defaults. New-method builders and old guarded executor paths remain. Test through actual native Adapter and current Application compiler; no new session engine or SDK change. Capture causal missing live-choice RED before production edits, then source/context/authority negatives and real distinct arithmetic consumers.

108 compatibility finding GREEN002: generic dispatcher checks parameters before stale-reference feedback; mutating execution schema incorrectly blocks retained105/106/107 guards. Minimal optional business modelParameters projection in the existing Runtime Port separates model advertisement from unchanged execution parameters. Native Adapter uses that optional projection for every request/disclosure, keeping fixed SDK catalog/purposes and dispatcher shape/authority checks unchanged. Application mutates only projected objects, native wrappers share them. This is backward-compatible ordinary engineering interface evolution, no public/versioned serialization, persistent state, new capability or authority. Fresh current bound refs must have actually been issued before acceptance; never issue an incoming guessed ref as a validation side effect. Old complete program proposals and unbound method builders retained. Keep original stale/repeated/source/hash/scope negatives, not weaken expected feedback.


### 108 real144 FAIL and approved-route coverage correction
Authorization031 accepted at2026-10-11T08:03:28Z, deadline09:03:28Z; sameTask47d81599-a8f8-4783-a362-3234b87bd90e, fixed original synthetic049 and models/private entry. real144 issued1189–1193 only, all settled. Actual native enum was consumed in1190; binding required business scope,1191 updated Context,1192 reused invalidated candidate references despite empty choices and one-only explicit-read feedback;1193 chose the existing set_framework reference alternative with an old current hash. Guard rejected CANDIDATE_REFERENCE_INVALID before adoption/computation. Root remains failed revision13; no AS04 or MiMo report. Cumulative1193 requests/686056 known output/73728 historicalUNKNOWN reserve;18 historicalUNKNOWN/0physical inflight. Paid route STOPPED under031 stop-loss; remaining quota/time is not permission to repeat the failing route. AUTHORITY_REQUIRED wrapper is not a new missing user authorization.

Coverage inspection found set_framework's existing plan_ref branch absent from live projection; set_joined_framework already had it. set_multisource_framework has no reference alternative, so no new one was added. Register existing top-level plan_ref projections once, preserving shared anyOf reference branch and full new-method builder. No SDK/model/Task/UI/grant/retry/ledger change. Permanent native test checks all actual current-plan reference alternatives before read, after real read, after Context invalidation and fresh read. red004 fails before correction; green008 passes after correction. red003/green007/diagnosis-coverage001/002 retained: extended fixture mistakenly required a multisource reference branch and is not accepted as complete causal evidence. No prior guard/assertion weakened. green009 retained environment FAIL because new evidence directory was not created; rerun green010 explicitly creates owned directory, no production/test repair. candidate002 fixed after correction; type002 passed; scoped/full regression pending. This correction does not establish that a real model will reread after Context changes.

Evidence: controller/v13-autonomous-analysis-001/current-recipe-choices108/real144-diagnosis001.json,coverage-diagnosis002.md,candidate002.json,red004.log,green008.log,green010.log,type002.log,full002.log; raw real144 inputs/outputs and preview preserved.


108 candidate002 closeout: green010326PASS/0FAIL/0SKIP; type002 and scoped diff-check002 exit0. Canonical full0024181tests/4163PASS/18conditionalSKIP/0FAIL, all17groups exit0; four fixed source/test hashes unchanged throughout. Prior full001 applies only to prior candidate001, not proof of this coverage correction. real144 remains FAIL; no further Provider calls after1193. Global1193/686056known output/73728historicalUNKNOWN reserve unchanged; readonly product Task ledger shows258succeeded/3failed/0issued, rootfailed13. No new adoption/computation/report. Evidence full002-receipt.json,offline-readback002.json,real144-readonly-state002.json. Whole AS04/current MiMo report/final independent product review/CI/user acceptance OPEN.

NEXT_ACTION: paid route stopped under031 nonconvergence. The concrete proposed alternative is next-route-decision002.md: declare the already-required business execution scope before issuing usable recipe choices; Agent still explicitly reads/selects and compiler guards remain. This is only a decision brief, not implementation or execution authority. Await this specific user approach decision, not another startup/product/UI approval or a resource-only renewal. Preserve branch/HEAD/WIP/failed13/history/UNKNOWN/consumption; no new Task, SDK/model/UI/budget/permissions/Git/auto-followup change.


### V13-SCOPE-BEFORE-CHOICES109 — user adopted execution order
User adopted108 next-route-decision002 on2026-10-11. In preparation already requiring explicit current business execution scope before binding, usable candidate/bound-plan references must not be issued before that scope exists. An evidence read still exposes inspectable existing evidence and current framework metadata, but returns effect-free needs_business_scope with no usable candidate_refs/current_plan_ref. Agent inspects selected materials, explicitly declares business scope, explicitly reads current choices, then selects/binds. Host does not inspect for the Agent, declare scope, read/select/bind/compute or grant permission automatically. New-method builders, general evidence inspection and existing executor compatibility remain. Later Context edits still invalidate old references and require explicit fresh read. No new user confirmation, Task/Provider/SDK/model/UI/retry/ledger/authority change.
AC109-01 actual native producer read-before-scope returns no usable refs; explicit inspect→scope→read→select succeeds in passive preparation, choices enter actual IR compiler and independently check430/620. AC109-02 scope declaration alone does not issue choices; old guesses/stale refs and source/revocation boundaries remain rejected; plain history/evidence inspection remains available, unrelated unbound and already-scoped tasks do not gain a new prerequisite. AC109-03 original source/Task/config/grant/ledger and failure/UNKNOWN history retained; one changed-route real contrast only after causal RED/GREEN and affected regression within still-valid031 resources; same failure stops diagnosis, no resource-only renewal.


109 causal/red compatibility readback: red001 is retained fixture failure (partial context missing question.text), not causal behavior RED. Correct full compileOpenAnalysisContext fixture red002 fails exactly because read-before-scope lacks needs_business_scope. green001 actual native6turn inspect/scope/read/select plus actual IR independent430/620 passes. green002 retained new negative fixture wrongly expected proposal after pure inspection; corrected to existing response without binding; no existing assertion changed. green003328PASS/0FAIL/0SKIP; type001PASS. Native/legacy108 choices,105/106 stale feedback and source/authority negatives retained. candidate001 fixed, canonical full001 in progress under fresh evidence root. Real145 prepared, not executed: only remaining031max35calls through UTC09:03:28, cumulative1228/output2million unchanged, source/model/Task/private entry unchanged, one new user-adopted109 route contrast after offline regression.


Authorization032 current direct user resource steering: “增加2倍次数，如果其他额度有不够的风险，均增加2倍”. AtUTC08:32:59, no Provider inflight or145started; current remaining031requests35→70, cumulative1263 with1193preserved; remaining time doubled to Beijing17:33:56.875 on2026-10-11. Known686056output and73728UNKNOWN reservations retained. Output2million not changed because worst-case remaining70*4096 plus preserved output/reserve=1046504, safely below existing limit. No input/percall protection/model/source/Task/retry/stop-loss change. real-authorization032.json and scope-before-choices109/budget-before032.json record exact preimage and atomic update; original031 not rewritten. Only one repaired109 contrast, same-class failure still stops diagnosis.


### V13-PREPARATION-STATE110 — truthful current stage and adopted109 ordering
Real145 returned ordinary text with no current tool call (one settled request1194), not a fresh tool denial; preview answered, not ready. Preserve the failure, rootfailed13, native JSONL/history, Task/config/grant/sources and global1194calls/686768known output/73728historical UNKNOWN. The current producer falsely labels the saved recipe as current_framework_bound=true while the same preparation says CURRENT_CANDIDATE_UNBOUND; its leading focused instruction says read first despite adopted109 scope-first order. These are ordinary implementation inconsistencies, not a new product or authority decision.
AC110-01: actual native producer must distinguish saved framework availability from current candidate binding: proposal preparation starts unbound even with a saved framework, while accepted execution remains bound. No implicit binding, history deletion/navigation, Task replacement or placeholder readiness.
AC110-02: leading focused instruction agrees with the existing scope requirement: inspect and declare required current scope before explicitly reading usable references; otherwise preserve normal explicit-read guidance. A real scope/read/select/IR path and authority/source negatives remain unchanged; no additional prerequisite.
AC110-03: preserve all145 failures and settlement, first causal RED then GREEN/affected/type/full fixed candidate. A single changed-input contrast may use only still-valid032 resources after diagnostics; same-class failure stops the route, no blind repeated run. Actual current AS04/MiMo report and final independent/user acceptance remain open.


110 verification update: red001 is a retained command/toolchain error (unnecessary tsx import; project uses Node native TypeScript), not causal RED. red002 failed saved recipe is not current preparation binding (true versus false) in actual native SDK producer. Production change is only current_framework_bound truthful preparation flag and leading adopted109 scope-first guidance. Existing CURRENT_BUSINESS_STATE format outside preparation and original assertions are retained. green001 retained four failures: adding an unnecessary state field broke a pre-existing exact state assertion, and omitted JUANERAI_TOOLCHAIN_BIN caused three source parser setup failures; remove the unnecessary field instead of changing the old assertion, rerun with approved command-local toolchain. green002328PASS/0FAIL/0SKIP; type002PASS; diff-check001PASS. Preparation actual native request now says unbound, keeps SAVED_RECIPE_CONTEXT_ONLY inspectable, scope/read/select produces independently checked430/620. Native accepted execution still says bound and independently computes both periods. Fixed candidate001 recorded; full001 canonical portable offline is running. real145 remains FAIL, no further physical call since1194. Real146 is planned only after full regression, sameTask/grant/config/materials/model/SDK/native history and authority032, no new resources or identical145 rerun.


110 real146 readback: FAIL after9 settled requests. Scope-first preparation and truthful current state were consumed; previewready and existing Task adopted14. In execution model attempted refund-source calculation through an order recipe changes channel; accurate MEASURE_INCOMPATIBLE/FIELD_UNIT_BINDING_MISSING points to orderC (period). Model recognizes incompatible source then produces text announcing resubmit without actual tool_use. Raw Provider1198/1200/1203 are text/end_turn; SDK did not drop a call or truncate at output limit. Current14 has0verified steps/0currentAS04children or returned opinions/noMiMo report;5historical children remain historical. Counters1203/699791known output/73728UNKNOWN reserved,0issued/0newUNKNOWN;032cap1263/output2million/deadlineBeijing17:33:56.875 retained. Entire historical13/failures/UNKNOWN/native138compaction/authorization/usage retained. Evidence preparation-state110/real146-receipt001.json and full raw real146 sources.
- [x] 110 causalRED→nativeGREEN328/typed/full4165PASS,18conditional skips,0failure; candidate hash unchanged.
- [x] Once repaired sameTask real146 contrast completed and genuine failure retained; not AS04 or report success.
- [ ] Complete current AS04/MiMo report, frozen full candidate independent review, required CI and user product acceptance.
NEXT_ACTION: current paid route stopped, no same146 rerun. Concrete optional route decision at preparation-state110/next-route-decision001.md: existing native branch/navigation within same synthetic Task and shared账本; old history remains but current model need not consume all old failed attempts. This changes active persistent session branch/input relative to adopted contrast, so request this narrow route decision before mutation; not startup confirmation or resource renewal. Until decision nofork/navigation/Provider/newTask/model/SDK/UI/source/permission/Git/auto-followup changes.


### V13-NATIVE-CONTEXT-BRANCH111 — approved sameTask native branch contrast
User adopted preparation-state110/next-route-decision001.md. OriginalTaskfailed14 and all history/evidence/UNKNOWN/usage remain. No newTask, model/SDK/UI/data/authority or resources; current032 cap/deadline remain, small contrast max12physical requests including auxiliary/recovery.
AC111-01: existing native fork/navigation must operate through SDK and registered sameTask ownership, only after physical idle/settled effects; leave original native JSONL and history readable and explicit rollback reachable. No manual JSONL edits, history deletion or alternate session engine.
AC111-02: selected native branch continues with current effective business inputs/accepted plan/authority; old failed-dialogue entries do not become current full model context. Budget and call ledger remain sameTask, historical failures/UNKNOWN/reservation never reset; no old proof inheritance. Native config/authority/UNKNOWN/idle checks must not be bypassed.
AC111-03: verify installedSDK native controls, actual current input exclusion and sameTask ledger with causal tests and impact regression before real mutation/calls. If original consumer control cannot navigate under immutable tool configuration, document precise failure and minimal Adapter correction; no SDK edit/CONFIGURATION_CHANGED bypass. Real first max12 frombaseline1203, same models/private approved entry/synthetic049/deadline; recurrence stops paid route. Current fullAS04/MiMo/independent review/user acceptance still required.


## 2026-10-11 AC112: exact non-dispatch reconciliation with historical native reservations

Engineering correction inside existing sameTask recovery, not a new Runtime/Provider/UI or implicit resume. Read-only native result is failed, pending operation/tools/queue are absent, all current tools have finished. A trusted transport gate receipt must prove a request never crossed the physical fetch boundary before current local UNKNOWN may be settled as failed with known zero model usage. Preserve its original UNKNOWN snapshot, measured elapsed, logical call count, every prior failure and historical unknown reserve; known zero must not be inferred from STATE_FAILED alone. Use existing ledger settlement and SDK budget settlement; never raw SQL/reset/newTask.

AC112-01: after exact current non-dispatch settlement, a closed historical MODEL_FAILED reservation from a prior revision of the same Task/scope/config/grant must not falsely block read-only reconciliation. Match each historical owner against its actual native admission/finished audit, binding, failed physical receipt for that historical revision and closed result. Historical unknown usage/reservation is retained byte-for-byte. Current failure alone must remain tied to the current run/revision/authority.
AC112-02: unresolved local UNKNOWN, active native owner, missing/multiple receipts, mismatched historical scope/config/grant, unknown tools or unmatched reservations still deny recovery. No model dispatch, proof inheritance, automatic resume or replay during reconciliation. A new real validation window is required for later actual continuation.

Evidence locator: /Users/bendandebaba/JuanerAI-artifacts/n01-n02/controller/v13-autonomous-analysis-001/native-context-branch111/offline-analysis-replay002.json. This reconstructs all nine root outputs and 15 real verifier proofs offline; all preflight guards pass. The original exact thrown cause remains unproven. Non-dispatch proof uses exclusive durable gate accounting and its only fetch path, not this replay.


### AC112 corrected original evidence readback
The earlier111 summary wrongly stated that real148/model-request-1216.json and real148-admission-denied.json were absent. Direct readback confirms both existed at09:24:25UTC. Request1216 messages SHA exactly equals local9382b3f2 input_sha256; physical denial says calls1215/physical_request:false. Exclusive twelve-call contrast cap1203+12=1215 caused VALIDATION_BUDGET_EXHAUSTED before fetch; the native wrapper maps it to STATE_FAILED. This is a validation authorization boundary, not an established SDK/Provider/input-schema defect. Retain earlier tentative attribution as history, superseded by the fixed original evidence. Current logical/native admission count is not a physical request.

The separate prior-revision recovery defect is now causal RED002 (false instead of true after exact non-dispatch settlement), GREEN9 recovery tests and73 native regression tests. Historical-scope mismatch, active request, unknown tool and unmatched-reserve negatives remain denied. First RED001 lacked its evidence directory; full001 lacked toolchain; full002 lacked admitted evidence directory; these are preserved infrastructure/command setup failures, never claimed causal behavior RED or product PASS.


### AC113 native delegation declaration and dispatcher consistency
real149 stopped after3 settled physical requests1216–1218, no current child/report. Raw MiniMax SSE exactly equals Adapter arguments; no SDK rewriting established. Actual Provider declaration has nested instruction whereas the current dispatcher/feedback requires flat action/reference_paths/completion_reference_paths. Cause: nativeDelegationWire changes parameters but retains Application modelParameters, which the Provider projection prefers. Existing090 fixtures omitted modelParameters and missed this production-consumer mismatch.
AC113-01: native-object delegation wire must expose its same flat authoritative contract in both parameters and modelParameters when the latter exists. read_tool_contract, model declaration and dispatcher must agree; map only explicit valid choices to unchanged original business contract. No argument repair, broadened paths/materials/authority, altered Provider/SDK/runtime/UI or new Task. Non-delegation tools and legacy channels retain their declarations.
AC113-02: production-shaped tool with distinct modelParameters must causally fail before correction, then actual installed SDK sees flat contract, explicitly reads it, executes one exact selected-material delegation and observes result. Object/item array wrappers, extra fields, foreign/missing paths, too-many refs and revoked authority remain rejected before effect. Historical real149 failure/UNKNOWN/calls preserved; no real rerun until causal GREEN and current regression. Global1218/710035known/73728historic UNKNOWN; current033 remains deadline11:06:18UTC and this-run1255cap. Stop-loss diagnosis precedes any further paid contrast.


### AC113 real150 final result / AC114 returned-opinion projection
real150 FAIL, not fullAS04: revision16 actually re-executed14 independently arithmetic verified facts; two distinct root children returned and their opinions were consumed by the subsequent root model. No actual grandchild and no MiMo saved report. Requests1219–1238 all settled; total1238 /724702 known output /73728 historical physical UNKNOWN reserve, no physical in-flight/new UNKNOWN. Authorization033 consumed23/40,17 remain until2026-10-11T11:06:18Z. Old revisions, failures and reservations retained.
Exact native JSONL result: assistant_error “Assistant request exceeded the context window”. Request1238 Provider returned end_turn with204167 input tokens, exceeding fixed200000 context. Prior1237 automatic compaction saw an empty conversation and retained the large tail; do not attribute to Provider timeout or budget. Tool input contains repeated full returned-source snapshots: final read_delegation_results text71823characters, one source32369 but actual opinion3363. No paid blind rerun. Evidence native-context-branch111/real150-context-failure001.json plus original real150/*.
AC114-01 ordinary private model projection: return complete child opinion, references, limits, unknowns, classification and result/version/source identities; retain source metadata/aggregate identity and scope but omit repeated aggregate.content from model-facing read_delegation_results. Complete persisted source/result and original hash remain unmodified and readable by existing business/UI consumers. Clearly label omitted body; no invented facts, truncating opinion, lost evidence references, new sources/permissions, SDK/session/compaction implementation, contextWindow/config change or history deletion. Apply to root and child model consumers only.
AC114-02 causal RED must prove normal production-shaped returned result redundantly emits aggregate body; GREEN installed native consumer reads the complete projected opinion/references without body duplication, unchanged original stored result/source, and failed/waiting/UNKNOWN outcomes remain unchanged. Current sameTask authority checks precede projection; existing delegation/scope/stale/stop tests and full applicable regression remain required. Projection reduces known duplication; it does not prove empty native compaction resolved, AS04/MiMo/overall completion or user acceptance.


### AC115 flat declaration mirrors existing material-selection invariants
real152 revision17 failed after9 settled physical requests1239–1247:14actual independently arithmetic-verified facts,0current children/grandchildren/report. Raw1245 submits12materials (>8);1246 uses8materials with6common read paths/9completion paths (48/72 references>12 and absent paths);1247 interprets the two common-path arrays positionally and repeats paths. Business resolver correctly denies; no foreign material is admitted. Historical7children are not current evidence. Exact global1247/732722known/73728historicUNKNOWN and original JSONL remain; no current physical pending. AUTHORITY_REQUIRED outer runtime reason does not establish missing human permission. Native JSONL shows exact invalid parameter feedback followed by TOOL_FAILED. Paid route stopped, not retried.
AC115-01 private native-object declaration and read_tool_contract must express the existing business invariants, without new restrictions on valid requests: both common path arrays are unique; each selected material receives the SAME path lists (never zipped/positional); selected-material count times each list size<=12, material count<=8. Use fixed JSON Schema cardinality conditionals and uniqueItems, matching existing business resolver before effect. Remove contradictory legacy/nested-format instructions from this native wire description only; legacy business entry remains unchanged. Preserve kind/task/business_question/action, precise material handles, exact explicit mapping, source permissions, own boundary checks, one correction/extra request policy, no automatic path selection or repair.
AC115-02 causal RED through installed native runtime must show existing declaration admits duplicate/over-total choices to business execution. GREEN rejects them before business effect and exposes schema feedback to the next metered model round; exact valid one-material/twelve-path, two-material/six-path, eight-material/one-path boundaries remain available and unchanged. Original business schema stays unchanged. Existing foreign/stale/stop/material guard regressions and full applicable suite required before a bounded paid contrast. Provider0 for these tests; no actual Task mutation or replay. Real152 failure retained; AS04/report/final review/user acceptance OPEN.
### AC116: canonical serialization performance, unchanged bytes

real154 public same-Task revision18 resume produced six current independently checked calculations but ended DEADLINE_EXCEEDED before collaboration/report. Read-only CPU profile real154-read-profile001 identifies repeated allocation of complete Unicode code-point arrays inside canonical key sorting as the largest self-time cost (3208.8ms of 5488.3ms sampled time). Cold actual task read is 5.38s. This is concrete local overhead; it does not by itself prove the full timeout cause.

Preserve exact canonical JSON and SHA for every supported input, including supplementary Unicode, unpaired surrogates, prefixes, integer-like keys, nested arrays and invalid-input rejection. Compare keys directly by Unicode code points without allocating arrays for every comparator invocation. No cache, persistence/schema change, history removal, weaker validation, SDK/config/Provider change or timeout increase. Test pre/post compatibility and causal relative-performance feedback against the retained prior serializer; remeasure the unchanged actual task read. Keep real154 failed state and all old UNKNOWN/consumption. A faster serializer alone does not close AS04 or authorize blind paid replay.


### AC117 / known-effect interrupted native abort (Engineering Controller impact decision)
real155 pretransport guard correctly refused native pending b0958c07 after real154 tool timeout; Provider0. Read-only audit matches all admitted model/tool completions, ledger all current requests known/succeeded, owner null; native operation retains outcome_ready plus never-issued planned tools. Existing public idle abort only calls SDK control which rejects idle abort. This is an implementation gap in existing explicit-stop/reconciliation contract, not new recovery authority.
Private Adapter correction: only explicit idle abort may run SDK native operation abort after exact current identity/binding/session/branch, known completed physical receipts, matching model/tool admitted-finished pairs, no tool failure, no owner/current reservation/pending provider. Normal prompt/resume/navigation still reject every open operation. Native abort consumes no model/tool, cancels never-issued planned work, preserves original history/config/usage/UNKNOWN, verifies native pending cleared and cancelled result; no Task state rewrite/newTask/SDK/schema/UI. If any effect or receipt is missing/unknown/mismatched, refuse. Historical physical UNKNOWN remains untouched and cannot grant current execution.
Installed SDK causal RED: public idle abort rejects interrupted fixture with actual generated known tool receipts. GREEN must close only known operation without dispatch/replay, preserve counters/history and deny missing completion/unknown/current owner/identity/revoked authority. Fixture interruption truncates only generated test JSONL at actual outcome_ready transaction; never edits production JSONL. Production old branch original bytes copied/readback before explicit abort; old history append-only, not SHA unchanged after approved abort. Ordinary private implementation correction within approved stop/UNKNOWN requirement; no upper-boundary expansion.

AC117 actual-receipt refinement before dependent code: real1560dispatchTASK_UNCONFIRMED reveals four physical ledger rows share businessRun/Attempt: three current pending-native-operation successes and the earlier explicitly reconciled non-dispatch failed0token row, ended11:31:58 before currentnative firstmodel.admitted11:32:55.255. Current helper conflates business Attempt with native operation and demands all four be success; no missing current tool/model receipt. Preserve this refusal/Task18/old failure row/UNKNOWN reserve. Scope known abort checks to current exactnativeoperation audit: every matching physical completion must remain success/known/currentidentity; earlier ended rows may be excluded only when fully known settled successful or failed0input/0output. Any unknown, nonzero failed, unsettled, identity mismatch, overlapping/unmatchedcurrentreceipt still refuses. No dropping/resetting historical ledger rows. Add installed-native causal prior-knownfailure success/prior-unknownfailure refusal, preserve all existing five negative cases and re-run affected/fullcandidate before actualabort. Ordinary private receipt matching correction, no new authority/SDK/sessionengine/timeout/UI.


### AC118 · actual report coordinates (spec before code)
real157 is saved/partial, 13 current independently arithmetic-checked calculations, one current independent Agent opinion returned/consumed, zero grandchildren. AS04 remains FAIL/OPEN; historical children cannot substitute. Cumulative1276 requests/760362 known output/73728 historical UNKNOWN reserve, zero in-flight/new physical UNKNOWN. Initial1264 delegate had empty material/path arrays and was correctly rejected;1268 created the only current child.
Report exact offline replay reproduces two scope conflicts. Counterfactual F5→F6 changes only the incorrect north/south references and removes one conflict; a legitimate dual-period sentence still conflicts with the conservative clause guard. No production task/report rewrite or guard relaxation was performed.
AC118-01: the private numeric report producer supplies each current fact's actual structured group field/value and explicit filters using the existing reportScopeContext projection and grounded fact identities. Reuse existing1.2 projection for1.3; no inferred period, goal, new raw detail or model arithmetic. Root/subpath references map to their exact current base fact; unavailable/foreign inputs still fail current evidence validation.
AC118-02: preserve old report documents, scope contracts/hashes, numeric guards, no new retries/model/SDK/task/UI/budget. The additive private model input does not constitute a verified report or repaired real route. Causal tests check different grouping labels/filters, identical numeric values with distinct coordinates, and exclusion of raw sources/draft/unselected history.
Allowed: packages/product-core/open-analysis-report-review.ts; affected existing numeric-report integration tests; this OpenSpec. Forbidden: sharedSDK, numeric-report persisted contract/guard relaxation, Provider/credentials/permissions, historical Task mutation, UI redesign or newTask. Full-candidate Validator remains deferred until whole acceptance closes.


### AC119 · source-coordinate sequential report scope check
Engineering Controller impact decision: ordinary approved report/numeric-reliability correction, no new data or model authority. The exact real157 first paragraph wrongly fails because the current checker requires every reference to contain both months mentioned anywhere in the same clause. A comparison with explicit successive period labels should bind each reference to the period stated immediately before it; common region constraints must continue to apply. Do not use guessed business semantics, compare identical values to guess identity, change formulas, or automatically repair model output.
AC119-01: use actual source/sheet/group/filter column identities to distinguish dimensions. Within a clause, explicitly mentioned labels update only their own coordinate; actual numeric references must match all currently stated coordinates. Thus a change from one explicitly named period to another is legal while the shared region remains bound. Ambiguous field/value labels, multiple unpaired labels, postfix-only labels or unrecognized coordinate layouts keep the existing conservative clause check.
AC119-02: swapped values, different regions under a shared region statement, common cross-period comparison and arbitrary different category names need causal positive/negative tests. No extra Provider, report reattempt or citation rewriting. Formula, numerical, unit, permission and unsupported-certification guards stay intact.
AC119-03: additive optional persisted report marker scope_sequence='1.0' denotes new checking semantics; old reports without it recompile through the original guard and keep their exact stored identity. Existing scope_contract2.0 and earlier feature flags keep their meanings. New reports only emit the marker when all current scope checks are enabled. Old reports are not bulk rewritten or retrospectively upgraded.
Allowed: packages/product-core/open-analysis-numeric-report.ts, packages/ports/open-analysis-numeric-report.ts, existing numeric-report integration tests, OpenSpec. NoSDK/Runtime/Provider/UI/Task/budget/auth change. This does not close AS04 or real full report; actual producer/consumer proof and complete independent Validator remain required.


### AC120 · current-only report model context, native history retained
Controller impact decision: ordinary private Adapter context correction using fixed SDK0.4.3's supported native extensions.transformContext. Real159 actual MiMo request1280 contains three report fact dictionaries whose short F IDs mean different scope/results; output repeats prior report's incorrect F5 north-versus-south citation, and guard remains partial. This proves context pollution; it does not prove it is the sole model-error cause. Stop affected report paid route pending causal correction;no weakening guards or automatic repair.
AC120-01: only report_edit model context projects the current purpose request's authoritative prompt as one user message using the native hook; system remains current and no tools are added. Previous drafts, report facts, model replies and compaction summaries are not report factual authority and must not accompany the current dictionary. Do not filter analysis/proposal/retained-case model contexts. Preserve native persisted JSONL and old outcome bytes;stable Task/purpose registry, budget, grants,stop/UNKNOWN and one extra-request policy stay intact. This hook is context shaping,not permission enforcement.
AC120-02: installed native Adapter→SDK contract test proves successive reports with changed F identities and disk reopen see only their current dictionary, while old native report history remains on disk and later root analysis still observes its own history. Model/ledger usage is persistent and not cleared;revoked authority remains denied. No new session engine,Task,SDK,Provider,UI,schema or raw-data access.
Allowed: adapters/agent-pi/native-open-analysis.ts, existing autonomous-native-session integration tests, affected OpenSpec/design. Full original v1.3 acceptance and report guard remain mandatory.

AC120 feasibility correction before dependent implementation: SDK0.4.3 requires harness.extensionVersion for a native hook;adding it alters immutable Task configuration and cannot silently apply to original Task. Initialhook candidate rejected INVALID_REQUEST,0Provider. Candidate/source retained native-context-branch111/ac120-hook-candidate001.ts;only this new unadopted hook removed from WIP. NochangeinstalledSDK orTaskregistry. Use previously explicitly approved sameTask native fork/navigation for the existing report purpose as a bounded diagnostic; preserve original report branch/disk history andbudget. Permanent adapter hook/migration is NOTimplemented orauthorized;AC120 nativebranchmechanism test,notautomaticproductcurrent-onlyprojection. Original autonomousbusiness/report/taskrequirements remainOPEN.


### AC121 · production report context reuses approved native branch isolation
Real161 verified supported sameTask report native fork+navigate(null,false):1281–1284settled,MiMo complete/noissues,current request onlysystem+onecurrentfactdictionary. OldTask19identity/outcome/proofs/source/question unchanged,originalreportJSONLexactbytesunchanged,historyUNKNOWN/usagepreserved. This is diagnostic evidence,notyetautomaticproductioncorrection.
Controller ordinary private implementation decision: within existing approved sameTask native branch/navigation route, production report_edit reuses engine.inspect/fork/run(navigate) before a new report prompt when the existing report session has history. No SDK hook/config/purpose migration. Root/proposal/retained-case contexts are unaffected. Verify owned report session physically idle before changing selected report branch;pending/faulted/unauthorized state stops before fork or model. Register native fork through existing persistent owner, retainoriginalJSONL and immutabletaskconfiguration/ledger, navigateempty withoutsummary(model0), then normalreportprompt. Nativeengine remainsauthoritative;no fabricatedsessionrecoveryorreportfacts,no oldUNKNOWNreplay,no newscope/sessionengine/retrybudget/Provider/UIpermission.
AC121-01 causalinstalledproductiontest should remove diagnosticexplicitcontrols and reproduce stale facts;productionAdapter isolation mustmakeitGREEN. Across diskreopen/revisionchange,reportmodel sees current dictionaryonly,oldnativehistoryremainsaccessible,rootcontinuesfullanalysishistory,andusageledgernotreset. Existing revoke/stop/pending/ownership/config/auditnegativecasesremain. Thischange isreportcontextownership,notnumericguard relaxationornewfeatures. Allowed native-open-analysis.ts/existingnativeintegration/OpenSpec;fixedSDK0.4.3unchanged.

AC121 compatibility correction from canonicalfull001:4194PASS/18conditionalSKIP/1FAIL. ExistingSDK041-FIX01 requires stable report sessionID acrosshostreconstruction and subsequentreports. Creatinganewnativeforkfortheautomaticconsumerviolatesit;donotweakenassertion. Keepfixedsession,usenativeengine.navigate(entryId:null,summarize:false)beforeeachlaterreport;oldJSONLentriesarenotdeleted/rewrittenandoldnativeentryIDsremainrestorable. Noextrafilecopy,Task/sessionregistrymigration orSDKconfigurationchange. Themanual161forkdiagnosticremainstruebutisnotproductionidentitypolicy. Causalfullfailurepreserved;newGREENmustincludeunchangedSDK041session-purposescontract.


### AC122–123: truthful private execution feedback
The optional step identity diagnostic distinguishes absence (valid request for generated identity) from malformed explicit identity. Progress is projected from the already accepted step graph and the existing current-qualified plan hash set. read_analysis_evidence and the existing finite completion review consume that same projection; no separate progress engine, persisted schema, SDK hook, UI or permission is introduced. The final all-node check is retained. Historical proof identity and changed calculation hashes cannot qualify current work. Real162 read-only state replay is the failure attribution; synthetic integration RED/GREEN establishes the missing feedback and controlled correction, not a model/AS04 claim.

AC124 private Adapter diagnostic: exacttrustedarraycardinality selects only matching anyOf errors; out-of-range array reports base bound, unrelated alternatives excluded. Feedbackincludes numeric actualcounts/products and trusted capacityrows; no rejectedprivatevalues. FullschemaCheck unchanged, onlyexplicitmodelcorrection, oneallowance andbatchdeferral unchanged. Reproduced real1318 six×four24>12 as two-pathmaximum; repeatedinvalidstillstops. No SDK or Taskconfiguration migration.


## AC125 current snapshot projection — performance correction
Read-only actual revision22 replay demonstrated a six-material bundle performs19 complete Task reads/copies per authorization,1.49–1.58s;19 reads dominate1.49–1.57s. Minimal private source projection now takes one fresh validated snapshot per public read and projects selected members from that same snapshot. Every later read still reads validated current disk state; no cross-call authorization cache,public schema change,source/stop/version bypass or history deletion. Actual same-task replay now1read/75–89ms with identical aggregate SHA and original14,117,909-character DB body/digest unchanged;0Provider/0productwrites. Evidence child-source-performance001/002.json.
CausalRED ac125-red001 actual7reads vs required1 for two-material projection; GREEN00450PASS including exact prior projection equivalence, unselected-row exclusion, invalid owner zero reads, actual running Task stop and subsequent revision invalidation. GREEN001/002 failed because test attempted stop on already saved task (correct existing no-op);GREEN003 retained canonical material-key ordering assertion mismatch. Fixture now uses a genuine running qualified task,then settles stop before revision; compares exact selected set independent of key order. No production state rules/assertions weakened. Initial fixture-edit command Unicode setup failure retained;not causalRED. Full scoped canonical regression pending;not AS04/final productPASS. Resource036 ends15:49:02UTC;no post-window Provider calls. Next paid contrast needs a new valid time window after current fixed regression and route diagnosis closure,not extra startup approval.


## AC126 — responsive scheduling around synchronous local work
Observed real167 normal-entry reads wait28.6s; read-only actual collaboration projection consumes10.75s without one IO turn (54fresh source reads,14historical children). The uncapped Attempt has no overall timer; a native control IO operation has an approved10s limit. Do not increase that limit or remove integrity/source/lifecycle checks. Private scheduling must allow IO between collaboration parent/descendant projections and before each actual business tool in a native batch. After yielding, reacquire current task and recheck cancellation/current run authority before any effect. Preserve every historical parent/child/result,trace and current-source validation; no authority cache, no history suppression, no parallel business execution, no model/SDK/public schema change. Tests: IO progresses before effect and before collaboration completes; revoked/canceled/replaced input cannot execute after yielding. Actual full projection readback must retain identical projection digest and source DB digests. This establishes event-loop fairness,not AS04 PASS or proof of every real167 failure cause; SDK/native failure still requires affected real contrast after GREEN.


## AC127 · validated own-write row reuse / AS01, RT04, RT06

Current private Storage Adapter already reuses one exact fully validated row while every access freshly reads SQLite with path/schema checks. Extend that same reuse to a successful own write: encode/hash once, fully decode/validate before UPDATE, then retain only that exact body/digest/value. This is a private performance correction, no schema/authority/Runtime/UI/retention or publication change. It does not cache authorization, leases, disk identity or errors.

Acceptance: a changed checkpoint already validated for storage is read without a second parse/whole-history validation; returned values cannot mutate cache. Stop/epoch/revision still come from fresh disk. Changed bytes/digest always revalidate and reject corruption; failed UPDATE/rollback cannot expose uncommitted contents. Preserve current history, proofs, UNKNOWN and all budget records. RED must detect repeated own-write decode; GREEN keeps corruption/rollback/stop negatives. Measure original long synthetic row before/after using fixture-only copy, with original SQLite digest unchanged/Provider0; no guessed UX target. Complete original real collaboration acceptance remains OPEN regardless of local optimization.

Pre-code causal measurement save-performance-baseline003: changed checkpoint save2787.65ms; fresh read2377.64ms vs warm86.37ms. Original selected Task row copied into isolated diagnostic fixture only, original bytes unchanged, no original write/Provider. Baseline source/profile retained; this establishes repeated decode cost, not all29s tool latency or terminal guard cause.


## AC128 · 用户确认材料视图引用 / AS04、RT04/06
用户本回合“确认”采用delegation-view-next-route001。仅增加既有生产read_delegation_materials/delegate_analysis模型可见选择通道，不新增SDK/Provider/Task/UI/材料或资源权限。旧完整路径及索引入口保留。
材料目录为当前获准的每份实际摘要给出视图：取已允许路径的最上层对象/字段，具体展开由原读回承担；每个view_ref绑定完整Task身份、材料身份、源摘要hash、精确投影hash与路径，名称/形状来自实际值。模型显式选择view_refs和专业action及可选获准business_question，不能混入完整路径/材料/索引字段。组合最多8材料/12实际引用；不替模型选材料或补不存在字段。解析得到原AutomaticDelegationInstruction，再由原queue及精确子集/祖先重复/停止/私有内容护栏准入。
引用每次效果前新鲜读回materials核对实际源hash/投影与路径；移除、换版、撤权、未知或别Task引用均拒绝，旧读取不构成authority缓存。同源重复view拒绝；有效同材料不同view显式合并精确路径，completion与选择一致。只给真实投影的hash/形状/字段映射，不额外暴露原始行、目标/私有目的或未选兄弟字段。子任务仅在父选子集内发行视图，不自动扩大子集/层级/工作。旧材料无view元数据时仍走旧通道，不生成猜测视图。
测试seams沿已批准Application production工具、实际coord/source投影与installed-native Adapter：先目录真实视图+实际委派及旧摘要未改的因果RED→GREEN，再换源/移除/越权/混用/超额/祖先重复与生产原生声明/dispatch消费。真实补验只在现有有效037窗口/剩余17次内进行；不足不构成自动加额度。整个AS04及报告、独立审查/CI/用户验收未完成，旧失败/UNKNOWN/消耗保留。
Allowed: packages/application/open-analysis-delegation.ts、open-analysis.ts、packages/ports/open-analysis-collaboration.ts、adapters/agent-pi/open-analysis-collaboration.ts、native-delegation-wire.ts、既有对应integration与原OpenSpec。Forbidden: shared SDK/installed package/schema/old Task direct-state rewrite/UI/credentials/Provider routing/Git changes。

## AC129 - Adopted material-view producer projection / AS04, RT04/06
Real169 revision25 closed FAILED. Thirteen actual IR/arithmetic receipts and successful MODEL_EXPLORATION Python observations remain. Eight physical calls1362-1369 settled; no new UNKNOWN. Response1368 mixed view_refs/material_ids; correction1369 duplicated views. Native validation rejected before child creation. No current child/grandchild/report. Paid route stopped for diagnosis, no replay.
Default production producer exposes only kind/task/business_question/action/view_refs, within the approved AC128 explicit-view route. Original Application parameters and native legacy execution schema remain compatible. The producer schema is not authorization; full current source/identity/subset/repeated-work/stop checks remain. Do not select, deduplicate or repair model arguments.
When an actually read nonempty legacy catalog has no views but does have legitimate old paths, expose the retained legacy producer contract and guidance. Empty catalog cannot grant views or material authority. This private declaration adjustment never changes Task/model/tool set/budget/configuration authority or session engine. read_tool_contract and catalog guidance must agree with the actual producer declaration. Default model catalog carries actual view hashes/shapes/exact paths, not a simultaneous old path-building tutorial or duplicated internal metadata. Full original mapping remains in the Application consumer.
TDD at installed native production Profile: default declaration excludes legacy fields; explicit view selection enters original queue and returned opinion consumption. Retained native legacy tests explicitly select old producer projection while keeping all assertions. Mixed/duplicate/unknown/stale/8-material/12-reference/revocation/ancestor boundaries remain. Legacy no-view catalog must transparently retain its original path consumer. No SDK/dependency/Provider/model/credential/schema/UI/Git changes.
This is an ordinary implementation correction inside user-approved AC128, not a new product or permission decision. Only existing Application/private Pi Adapter/integration/OpenSpec paths. Full regression before a new sameTask public revision and native branch under038; failures/UNKNOWN/usage remain.


### AC130: closed read-only report failure reconciliation
Within the existing explicit recovery authority, recognize report_edit with a physically closed model deadline and a subsequent exactly reconciled nonissued extra request. Require current full identity/scope/configuration/grant, no active writer or pending physical receipts, no native tool admissions, exact native operation binding and terminal failed SDK result, matching deadline admission/finished/cancelled ledger receipt and retained one output reservation. The zero-usage nonissued receipt must correspond to the final admission. Preserve physical UNKNOWN usage/reserve, historical failures, call charges and immutable model configuration; never mark the report successful, automatically resume or replay late output. Unmatched reservations, unclosed request, wrong scope/grant, tool effects or missing terminal receipts deny recovery. This is ordinary completion of the already approved closed-effect recovery behavior, not a new Provider or budget permission.


### AC131: previously returned completed opinion survives a closed execution session
Engineering impact decision: persisted Succeeded result plus returned delivery belongs to completed MODEL context, not execution permission. After explicit root recovery, a still-authorized exact source/decision may expose that previously returned opinion when its child remains closed at exactly authorization child_epoch+1. Do not reopen/restart a child, return any late/unreturned output, adopt an opinion as fact, or clear failure/UNKNOWN. Open children retain the original exact epoch requirement. Parent must be currently open and source eligible; source or decision changes, absent returned receipt, unsuccessful attempt, or any additional child lifecycle transition reject reuse. This completes preservation of valid partial results across service close/reopen under AS05/AS07; no persistent schema or new material authority is added.

AC130 historical consistency: the same exact readonly report deadline/nonissued receipt pairing may be checked in a prior revision, using that native operation’s own events/ledger revision; it remains an unknown usage charge, not current execution authority. Current identity/authorization and same scope/configuration/grant must still match; inspect every retained failed SDK operation before explicit recovery. Causal historical-reserve RED and GREEN preserved.


## AC132 — 用户批准的 MiMo 报告思考配置与显式迁移（2026-10-12）
用户批准“允许报告关闭思考及安全配置迁移”。仅报告用途采用 SDK0.4.3 已有显式 mimo-chat thinking-off；MiniMax 分析、MiMo Flash 报告、4096单次输出及全部权限/额度不变。真实173在4096 known output处 length截断；返回意见2项已经实际消费，合法孙任务0仍OPEN。
现有批准测试边界为生产 Pi Adapter→安装的 SDK→Pi Provider wire，以及持久 BudgetStore 与原生 JSONL 续接。先建立报告出站 disabled 的因果RED，再实施。旧配置仍默认保留，不暗中迁移旧Task。显式迁移必须核对原Task、精确旧新配置、同一限额、空闲/外部请求结算、原生操作/队列及有效授权；原子保留全部 usage、reservations、历史关联和失败/UNKNOWN。未知工具效果不迁移、不重放；不能安全迁移则关闭该动作。不得以新Task、直接SQL、改发行SDK或清账绕过。

AC132 工程影响决定：配置历史属于既有BudgetStore预算body，不新建数据库表或第二权威；只追加from/to/approval/reconciliation/accounting digest，usage/reservations/limits/历史指纹原样保留。生产Adapter提供仅受信任后台操作可用的migrateReportThinking，不向业务Port/UI暴露Pi配置。旧新指纹均通过安装的SDK实际dry-claim取得；dry-claim拒绝预算准入，Provider/JSONL/审计效果0，不复制SDK哈希算法。迁移前逐原生操作检查terminal result和无pending，真实队列有项则拒绝。SDK0.4.3没有给从未排队lane写queue-authority，空闲snapshot因此AUTHORITY_REQUIRED；具体实测保留ac132-native-migration-green002.log。仅该明确缺口允许以完整SDK fail-closed session.control审计证明没有任何排队准入（仅已知snapshot/abort hash），不伪造队列所有权或宣布queueAvailable。未知control digest必须拒绝。核对原生文件与审计/绑定快照在持有项目单写锁后未变才原子迁移；未知用量预留原样留下，任何未闭合工具效果不迁移。
18项报告相关GREEN001、迁移state因果RED和43项GREEN001；原生续接因果RED、GREEN0032项及GREEN004完整结果将读回。类型001/002失败留存修正，不算通过。

AC132 历史收据兼容纠正：实际原任务包含已终止 MODEL_FAILED 的模型未知用量（账本 ended_at 是后续核账时间），以及已终止 STATE_FAILED 的“报告超时 + 未发出额外请求”。迁移不得将它们改成成功或清除预留。模型未知用量须按该次原生 admission 的时间窗、同一 Provider/模型/版本/范围/配置及已知 active_ms 对应唯一物理失败/取消收据；该次运行全部工具必须有成功终止收据，原生操作须已终止。允许模型结果/成本保持 UNKNOWN，不允许未确认工具效果；非发出重试仍须已有零用量收据。实际初次迁移被拒绝保留为诊断证据，不据此绕过检查。

AC132 原生终止枚举纠正：共享 SDK result() 返回 completed/declined/aborted/failed，取消的 RunResult 与原生 OperationResult 不使用同一个枚举。迁移必须读取真实原生终止收据，不能把原生 aborted 当作未结束，也不能把 pending 当作 aborted。保留原生显式 abort 的闭合证明、原 JSONL 与工具收据，不重放历史。

AC132 生产接线：浏览器服务 composition root 显式传 reportThinking:'off'，新任务采用获批报告配置。旧任务不自动迁移；其原固定 SDK 配置不兼容时须在 Provider 调用前拒绝，仅在本次原 Task 经明确批准及核账迁移后补验。产品默认模型30秒保持，合成验证60秒仅测试窗口；二者不混淆为同一配置或同一验收证据。factory 不把历史 Task 配置自动改写。

AC132 工程影响决定（原授权安全迁移内）：33个原生会话只读核对后，3个旧子会话存在 pending 原生操作，但所有物理模型收据已结算且工具完成收据齐全。迁移须先完整预检每个会话/队列；仅对旧版本、同Task/同有效父grant、精确旧business identity与原生操作绑定且 knownClosedEffects 完整通过的子会话，使用共享SDK原生 abort 追加停止收据。不恢复/重放/提交新业务工具、不调用Provider、不伪造完成，不删除/截断JSONL或改业务Task/Case状态。任何未知工具效果、未知本操作模型用量、缺失/错配收据、队列、撤权或配置漂移均拒绝。历史全局 UNKNOWN 预留不清除。停止控制本身持久计时允许单调增加；其余模型/工具/输入输出计数、预留、账本与原文件前缀不变，完整前后身份及停止收据进入迁移 reconciliation。配置调整仍仅在全部停止/复查成立后原子提交；中途失败只保留已完成停止记录，不宣称迁移成功。

AC132 文件清单纠正：真实004迁移停止了3个已知闭合子操作并保留配置/账本，但原生JSONL实际位于cwd桶子目录，顶层扫描返回0文件，不能据此声称前缀核对成功。完整递归读取每个JSONL、拒绝空清单和路径内符号链接；预检结束且停止前必须对比原始目录摘要/绑定/物理账本，拒绝预检期间新加或改变的子目录历史。停止后的每个原文件前缀与新增停止记录分别核对。real174为主动停止的中断测试，2次已结算模型请求保留，工具未闭合和持久owner不伪造消除；付费路径保持停止。

## AC133 Explicit interrupted-owner stop (user approved 2026-10-12)
The user approved interrupted-owner-decision001.md with “允许这次受控恢复工程”. No new Provider window/quota. Same Task and immutable SDK configuration; no replay or auto resume. The private recovery seam joins the trusted Application's exact current UNKNOWN Task/step pre-calculation proof, installed SDK binding/admission/physical receipts, and persistent writer/budget CAS. Only a dead original process with the exact retained lock and settled current model calls may hand off ownership for native abort. All old reserves and history survive; no successful calculation/tool receipt is invented.
Persistent budget body adds an append-only interrupted-stop receipt (owner, approval/proof, accounting/lock identities, pending/stopped outcome), without new tables. Normal claim refuses a pending stop. Native abort uses the original lock inode as its exclusive writer; it does not delete that lock until the actual native aborted result has been persisted and verified. Failure leaves the pending barrier and UNKNOWN; neither timeout nor file age authorizes recovery.
Application proof is limited to current agent-led execute_step, exact framework/step/identity, no current computation admission/result/exploration, with the mandatory production saveStepEvent callback preceding calculation. Generic tools, missing/stale proof, started calculation, revoked authority, live PID, queued input, ledger/audit/native drift and storage faults deny takeover. Product state stays UNKNOWN after native stop; only a later explicitly authorized business version may calculate anew.
Tests at the already authorized seams: Application step admission, real SQLite BudgetStore + native writer, and installed SDK production Adapter abort. Cause-specific RED before code, revoked/live/stale/started/physical UNKNOWN/queue/fault negatives, append-only JSONL and no model/tool dispatch. Full regression before any original-Task recovery. No new UI/Provider/SDK/Task.

AC133 metering: the terminated process has no measured lease-release duration. Preserve known activeMs and record its unmeasured interval as UNKNOWN in the interrupted-stop receipt; time spent offline must not be counted as measured active execution. The native abort itself records its measured elapsed time normally.

AC133 native stop readback: append the exact business identity digest to the interrupted-stop receipt. Only an explicitly invoked, authorized Application reconciliation with that same identity may read the installed SDK aborted terminal and queue-empty state; verify the saved terminal digest, exact closed physical calls, unchanged ledger/accounting/audit and native owner admission. Return a read-only boolean, never run a model or automatically change business state. Later other identities continue through the existing recovery contract rather than inheriting this one-off receipt.


## AC134 · 当前报告方法、字段与保存后协作意见消费（2026-10-12）
原 real175 已真实完成3根调查、2合法孙调查及意见回流；报告正常返回但部分完成。保留失败段落与旧报告，不放宽数字/范围/引用护栏、不重复整链。
在现行报告投影 seam 补齐已绑定计算方法和选定工作表表头，仅原授权根材料的字段名称/列位置，不传原始数据行。不同方法和筛选仍由实际IR确定。子任务模型观点只反映其选定材料，不可把子集缺项冒称根资料缺项。
在已有自然报告追问 seam，明确请求更新保存报告时复用原结果身份的当前授权返回意见；生产Profile只显式重开原根读取生命周期，既有 results 按原run/来源/回执/子epoch验证。禁止对子/孙启动、重开、队列或采纳；拒绝过期/撤权/来源变化和迟到，修改后的报告作为追问独立保存，原partial成果不改写。
仅添加私有composition回调，复用现有协作权威，不新增Port/SQLite/Runtime/Task或UI。模型调用仍受039当前窗口/总额度约束。派生公式通过只表示算术与引用检查，不代表总体业务范围或因果通过。
AC134-01：报告生产者传真实 calculation_kind 与表头坐标，不泄漏数据行/旧草稿。AC134-02：报告追问实际消费当前返回MODEL意见，保留限制并逐次核对权限；旧成果/数字/版本保持，停止后拒绝迟到。


## AC135 - User adopted scoped report references (2026-10-12)
User approved report-reference-next-route-decision001, not additional resources. Report producer supplies comparison candidates only from actual verified numeric facts with matching method/source/measure/unit and effective coordinate field sets, changing exactly one explicit coordinate. Deduplicated equal facts do not multiply candidates. No region-specific rules, dates or preset numbers; unsupported/ambiguous coordinates do not acquire same-scope proof. Catalog remains bounded by existing report32-derivation contract, indicating truncation rather than claiming exhaustive coverage.
Current report-edit model format1.4 selects numeric placeholders from base facts and compiler-produced difference/rate references; no authored arithmetic, numeric value or inferred scope name is accepted in this format. Backend builds expressions, exact arithmetic/inverse check, labels and evidence lineage. A selected comparison may describe category or period differences, not causal proof. Optional MODEL commentary remains unverified. New report stores reference_contract1.1 plus original1.4 model document; legacy1.3 documents retain original compile/validation bytes and strict declaration rules.
Paragraph references are compiler-resolved from actual placeholders, not a duplicated model authority list. Unknown/stale IDs, unit/scope/secret/source conflicts and numeric literals still fail; no guessing or value repairs. Invalid paragraphs preserve valid facts/other paragraphs and partial status. New compatibility schema is additive to the existing immutable outcome/report JSON; no tables/Runtime/SDK/Provider/UI or authority change. Main Engineering Controller impact decision: necessary authorized report producer/consumer correction, user explicitly adopted route; existing business and security boundaries preserved.
Seams AC135-01 actual report comparison catalog excludes partial-vs-whole and mixed-method pairs and supplies typed correct relations. AC135-02 current1.4 compiler binds known placeholders, rejects unknown/forged expressions or quantities, persists checked scope names and independently validates math; old1.3 partial output unchanged and tamper rejected. AC135-03 production main and normal saved-report followup select current1.4 only through existing report edit; all current opinions, exact sources, ledger, stop and no-recalculation/history guarantees retained.
Allowed existing report core/Port marker, Application report selection, protocol doubles and relevant tests/OpenSpec. Forbidden shared SDK/install/config/model/UI/source grants, manual old Task/report replacement, new Task, oldUNKNOWN replay or quota reset. Real validation only after fixed tested code within039 remaining88(or current84) requests/deadline07:08:54UTC, atmostone changed-route report contrast; same-class failure stops.

### AC135 real177 followup: bounded current-reference correction
Actual report177 resolved current numbers/comparisons but retained partial due to a brief negative certification ("非原因证明") treated as affirmative. Correct the current1.4 producer-owned reference contract to1.2, accepting only adjacent brief negation; contrast/later affirmative claims remain rejected. Stored1.1/legacy scope contracts revalidate with their original behavior and bytes. Root source headers are authoritative for available fields; returned opinions may describe a narrower subset, not override headers. Clarify this current producer prompt without changing source authorization or claiming semantic/cause certification. Existing public compile/validate and actual report consumer seams remain acceptance seams. One corrected bounded report followup is allowed only after causal RED/GREEN and regression; failure remains retained, no blind rerun or new Task.

### AC136: reuse acknowledged report business yield, not new navigation
Readonly diagnosis of178 found the normal rewrite_saved_report tool had already selected a valid current report rewrite before additional MiniMax prose and two compactions. Infinite loop is not proved. Reuse the existing OpenAnalysisRun.shouldYield business waiting boundary once requestSavedReportRewrite has successfully supplied current facts. No new Port/SDK purpose/session engine, model switch, history navigation, UI, authority or budget contract. The Agent still chooses the tool; Application only yields after acknowledged selection, not by natural-language regex. Existing source, mutually exclusive framework changes, cancellation and authority checks remain. Native transport must demonstrate no next model request after selection and no hidden unknown effect; actual report generation stays separate, checked and saved, not claimed by selection alone. Proposed new preparation navigation is superseded by this narrower ordinary engineering correction, without implementation of navigation.


## AC137 · 已取消无工具报告受控结束（用户2026-10-12批准）
用户明确允许report-cancel-recovery-decision001.md所列受控恢复工程。唯一新增接点为Pi Adapter内部的recoverCancelledReport，不向Agent或UI新增恢复权限。
可信宿主提供当前精确身份、原生session/branch/operation及物理取消与原进程退出证明；完全匹配实际一对一model.admitted与cancelled REQUEST_CANCELLED收据、用途report_edit且tools=[]、无队列/工具/效果、原owner和跨进程锁空闲才允许。未知用量本身不能变成已知；所有UNKNOWN预留和历史账本保持原值。核对前/SDK reconcile时/执行前重查授权与证明，不用恢复扩大授权窗口。通过现有原生abort结束，保存真实aborted结果、安全恢复回执及审批摘要；不伪造原model.finished/run.finished，不手改JSONL/预算归属。
拒绝：跨Task/identity/operation/purpose、活跃物理请求或进程、仍有writer、队列、任何tool事件、未知效果、未匹配/漂移回执、撤权、审计/保存失败。迁移、重放、模型请求、新Task与SDK修改禁止。后续报告只在另有有效当前调用许可时执行。
AC137-01:实装生产Adapter/SDK公开run、sessionControl及新可信控制接点，取消无工具报告可显式结束；取消历史不改写、不退UNKNOWN，Provider0。AC137-02:上述负例均拒绝，不开始新计算/Provider/恢复旧工具。兼容AC133与普通取消/迟到，最终完整候选独立审查仍必需。

AC137 normal product Stop also closes physical ledger rows with cancelled/STOPPED before the transport abort returns. It is the same approved explicit cancellation boundary, not a weaker UNKNOWN acceptance. Match both REQUEST_CANCELLED and STOPPED with identical closed-process, receipt, no-tool/queue, identity and preserved-UNKNOWN checks. Recovery never resumes the product stop fence. real recovery001 was refused before any state/Provider change; retain it.


## AC138：已批准数字事实片段与MODEL解读合同（2026-10-12）
用户批准 report-fact-fragment-decision001 路线及同Task最多12次/60分钟补验。允许既有report生产/消费/Port兼容标记和对应测试；禁止改SDK/模型/UI布局/IR计算/资料权威/存储schema/历史成果。规格先于实现。
新生产文档1.5：version/status/interpretations，status=ready，每段只允许fact_refs（至多32个当前F/D引用，无重复）与interpretation（非数字自然中文，可空）。至少一段有事实或解读。无数值占位、自由label/grade/value/公式字段。模型决定事实顺序和解释；后台选择当前有效同口径比较的派生依赖，按真实label、值、单位、核验等级/限制生成完整事实短句；不允许模型给数字换口径。只有实际当前计算目录可作为事实。
存储OpenNumericReport版本1.0保持，reference_contract=1.3绑定新文档1.5。旧1.3/1.4和reference1.1/1.2读回行为、原partial与历史字节不改。validate从同一来源/identity重新编译校验，拒绝篡改、缺标记及来源版本漂移。完整数字依据继续现有成果/抽屉/下载消费者。
interpretation只作MODEL解读，非事实/核验认证，不带数字、placeholder或任意事实命名模板。后台结构明确未独立语义/因果核验；识别明确正面认证仅作拒绝防线，不以正则通过证明语义正确。一般否定modal在紧邻主语之前也是否认，不能只给“不能视为”单例放行；否定不能遮盖后续肯定认证。未授权/未知引用、裸金额、单位冲突、正面因果/完整性认证必须partial/拒绝并保留有效计算。
AC138-01当前事实/比较完整片段，毛额与净额不能由模型重命名；非零/零基数、非零售方法通用，当前动态来源变动驱动输出。AC138-02模型解释隔离，否认原因证实可保留、肯定认证拒绝；未知/裸数字/自由label/占位/单位重写/伪等级负例。AC138-03生产Application及saved-report Preview真实采用1.5，历史checkpoint继续1.3/1.4；撤权/停止/来源漂移/保存失败保持既有拒绝。AC138-04当前版本保存/读回/原成果不改/现有browser数值引用消费者及可读下载，报告complete只是结构/数值合同通过，非语义或因果认证。
受测seams沿已批准 compileNumericReport/validateNumericReport、reportEditModelPrompt、Application.run、Workspace.previewRevision及现有Browser投影，不增加测试入口/Runtime。因果RED→GREEN后受影响回归及canonical portable，固定候选通过后原Task有界真实报告；同类失败再现停止诊断。


## AC139 · 当前数字依据抽屉的可见焦点返回
沿现行 UI Contract 和公共设计基线的抽屉关闭后合理焦点返回，不改变工作台、布局、数据、执行或授权。数字可能同时存在于隐藏对话和当前展开报告；关闭或返回报告位置必须选择当前可见区域中的同一数字引用，不能聚焦 hidden 祖先内的副本。若引用已失效，保留原拒绝/失效处理，不激活旧版本或业务操作。
验收 seam 为真实工作台：报告展开后打开数字依据，再 Escape/关闭/返回报告，当前可见数字接收焦点；整轮回归和实际正常页面读回。原同版本/来源核对及负例不删。只调整既有两个焦点选择器；不增加持久状态、请求、UI 控件或 Runtime。
## AC140 分支停止范围修正（独立审查后的现有合同履约）

完整候选003独立审查发现全树停止检查误挡无依赖工作。工程选择保留全树历史遍历与 cycle/epoch 防线，但将拒绝条件绑定到新申请的实际工作：先完成现有材料/引用校验和来源投影，再逐项比较已停止分支的材料身份、动作及引用集合。bundle 按实际 material_id 分解，独立同名 JSON pointer 不混同；包含已停止等价工作的新 bundle 仍拒绝。私有目的、业务问题和 kind 不参与解除停止。父/祖先已关闭仍由现有生命周期检查拒绝，当前 Task stop/UNKNOWN 仍由原 guard 拒绝。恢复沿既有显式 epoch 操作，不改 schema、Runtime、模型或 UI。

先在现有持久 Application/Store seam 建立独立 B 被误挡的 RED，后修改私有 guard；保留旧 renamed-stop、后代、未知效果和恢复负例。文档宿主补验另行记录当前组件与实际退出，不以历史环境 PASS 代替本轮。


## AC140 B004-01 普通修正：停止输入范围重叠（2026-10-12）
只修改 Application 的私有停止 guard：按真实材料身份分解 bundle，比较相同 action 下的 input reference 路径段重叠（相等或任一为另一的祖先）。忽略 completion reference 的变化对停止准入的影响，避免模型扩大范围或换完成条件恢复已停工作。保留 parent epoch、closed child、source eligibility 和根 authority guard。通用 sameAutomaticDelegationWork 在祖先递归等其他用途保持原合同。先通过真实 LocalStore queue/lifecycle seam 复现扩大引用绕过的因果 RED，再实现最小修正，逐项加入子树、完成条件、bundle 负例和不重叠允许路径，最后受影响及完整回归。
