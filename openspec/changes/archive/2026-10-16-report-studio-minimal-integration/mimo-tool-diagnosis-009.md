# MiMo INVALID_TOOL 离线诊断009

用户于2026-10-16明确继续离线排查三个分支，能确认才修复，证据不足保持UNKNOWN。现有产品/UI/就绪审查复用；不新增真实Provider调用、不部署、不发布Git，不改SDK/锁、既有项目、凭据或MacBook。

原native008真实失败为`proj_71ca530f`/`dbf84b18-7e58-46cc-bc68-3559a91d4d72`；具体坏回复未在SDK批次准入拒绝前持久化，不能从通用错误帧复原。证据根继续Mini的`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/`，本次子目录`mimo-tool-diagnosis-009`，历史在`mimo-vision-007/retest-008-*`。

## RS-DIAG-01：限定诊断行为

只在独立合成目录，以固定SDK0.4.1、实际供应SessionHost与MiMo OpenAI SSE转换器复现：

- 未声明工具名：合法批次中加入未注册名字；原SDK必须整个批次拒绝，零工具效果。
- 参数schema：保留合法工具名和唯一ID，违反真实工具schema；仍拒绝整个批次，零工具效果。
- 重复调用ID：分别验证同批次重复和同一run跨轮重复；当前批次不产生工具效果，已完成旧轮保留。新run合法复用与错误ID形状另作边界，不能把它们混为同一规则。

诊断使用Node本机`inspector.Session`在固定SDK三个实际throw位置记录封闭分支名。核对SDK文件完整SHA-256，未知字节/未命中/多个命中不得推断分支。不改SDK、模型回复、工具参数或ID，不捕获scope/模型正文/参数值/密钥；不开放inspector TCP端口、不建立第二工具循环、不执行真实Provider。探针是工具目录中的离线诊断材料，不进入产品包或改变旧任务配置。

先运行缺少分类能力的探针，取得**诊断缺失**的因果RED（不是原MiMo根因RED），再补最小分类实现。记录原SDK拒绝、用量/预留、批次原子性及正常对照；安全负例和历史失败保留。原真实失败只有在得到对应证据时才可更新UNKNOWN，合成复现通过不能替代真实制作通过。

## 离线定位结果

| 分支 | 最小复现 | 实际结果 |
| --- | --- | --- |
| 工具名 | 保留合法ID与参数，名称换成未注册的`functions.propose_outline` | SDK第209行拒绝，`undeclared_tool_name`；同批次合法write未执行 |
| 参数 | 保留合法名称/唯一ID，pages传字符串；另测缺pages、1页、25页、缺title | SDK第214行拒绝，`arguments_schema`；同批次合法write未执行 |
| 调用ID | 同一中立回复批次重复ID；另测同run跨轮重用之前read的ID | SDK第206行拒绝，`duplicate_call_id`；当前批次无新效果，已完成read保留 |

合法两页框架对照成功。ID不必是UUID；新run可以复用历史ID而不更换session/task/账本。空ID、非object参数在更早的回复结构校验得到`INVALID_OUTPUT`。错误skill路径通过schema后进入现有软read失败，不直接触发`INVALID_TOOL`。这些结果只区分错误层次，不证明原坏回复内容。

旧真实项目12文件与实际账本再次独立回读一致；已保存的3条成功assistant回复只有5次read，名称均已声明、可见ID无重复，最后只有空content的通用错误帧。不能从旧成功帧排除**最后未保存回复**的任何一个分支；三候选没有可信排序。名字/参数/同run重复ID三假设分别预测实际命中209/214/206，只有真实命中才可归因。

补齐的是**本机诊断能力缺口**，不是已确认的MiMo业务根因修复。探针只存分支、行号、固定SDK哈希和schema版本；未修改产品包、工具声明、回复、ID、参数、校验或旧任务配置。源82项aggregate仍`513cd53be4b4a87f9e70a535293138f10b140b3b4be552994616b5f6f4eff70b`。旧A2048未知预留、原B和008失败/消费均保留；配置元数据revision3仍仅MiMo，未读取Keychain。

最初夹具有两项错误：同HTTP SSE批次重复ID在上游转换后只留下一个调用，随后预设回复耗尽；outline实际页数位于current.pages。`causal-diagnostic-red-001.log`和合成项目完整保留，包括该假响应耗尽产生的**离线**预留，不混入真实消费。改为中立批次直接注入重复ID、跨轮ID继续经过真实MiMo SSE转换，纠正outline结构后，`causal-diagnostic-red-002.log`为4项分类缺失RED/1项合法对照PASS，随后分类GREEN。不能混同归一化前/后批次，也不把这一合成SSE现象断言为原MiMo根因。

诊断gate的4项边界先在`diagnostic-gate-red-006.log`得到RED。实际SDK整合008曾错误预期SDK的usageKnown=false；实际为true但持久账本仍有16384预留。修正为同时断言SDK原值、原账本和既有业务receipt的operation_usage_known=false，不清预留或削弱未知保护。相关失败全部保留；这是诊断夹具纠正，不是新的真实消费。`[skills] invalid_metadata`警告仍保留，没有修改harness资源/旧配置hash，也没有将其等同于最后拒绝分支。

正式完整Change独立验证、required CI、工程/产品接受和归档仍待完成。真实制作FAIL/具体分支UNKNOWN未关闭。

## 真实诊断范围010申请原文（随后用户已批准；执行结果见下）

目的仅为捕获一次新故障的实际拒绝分支；即使新场景成功，也不能倒推旧008根因或代替完整两页制作验收。

1. **机器/程序**：仅Mini，复用native008固定安装内模块和原数据目录。先确认无活动实例/未保存工作及独占owner；临时以原`startBuiltinStudio`组合入口启动同一服务并附本机探针，通过已有in-process接缝接入诊断gate。不修改安装文件/SDK/锁/模型配置，不安装依赖、不开放inspector端口。这是临时诊断启动，不冒充原生宿主验收；结束后核对自有服务退出。
2. **唯一场景/材料**：在内置界面新建一个合成诊断项目，只发一次框架准备指令。仅100/120/135及“合成、非业务事实”文字，不用真实业务数据、分析明细、图片或截图。只允许新项目`read`和`propose_outline`；不确认生成或导出。其他已声明工具在SDK执行前由诊断gate停止；未知名称保持原回复交SDK校验。
3. **外发对象/凭据**：仅`xiaomi-token-plan-cn/mimo-v2.6-flash`，固定`https://token-plan-cn.xiaomimimo.com/v1`，外发合成指令、该项目必要上下文及工具声明。密钥只在原configuration→credential helper→SDK执行路径内存使用，不读取/显示/导出密钥，不移除或保存配置。非MiMo、图片purpose或配置变化即停止，不做主备实验。
4. **次数/时间/消费**：一次场景，最多6次模型transport派发，包含既有失败恢复；固定Pi transport自身HTTP重试关闭，真实模型外发不超过6次。从首次派发起10分钟，超时拒绝后续派发，在途请求合并截止信号。沿用既有任务范围消费/无产品金额硬上限，美元账单仍未核实。限制触发可能留下SDK预留：保留UNKNOWN，不退款、清账、迁移或换task逃避历史。合成新任务用途是诊断，不是旧失败的清账或恢复。
5. **证据/停止**：额外本地诊断只存封闭分支/计数/SDK账本和正常合成项目记录，不额外保存参数值、调用ID、推理或原始HTTP回复。命中INVALID_TOOL、范围/次数/时间限制、新UNKNOWN或框架场景结束即停止，不自动重发。范围外工具可能使结果仍UNKNOWN，不扩大授权。
6. **原边界**：不写MacBook、不部署、不发布Git。MiniMax恢复仍由用户本人重输；原失败/UNKNOWN/未验证、正式Gates全部保留。

工具目录的诊断gate已按6次跨wrapper共享计数、MiMo主制作用途、10分钟截止、范围外工具阻断及原回复不修写建立离线负例；不进入产品、不新增产品金额或累计限制、不改旧任务合同。第7次SDK准入可以被拒绝而没有第7次外发，账本预留仍可能存在；使用原业务receipt判定UNKNOWN，不能只信SDK usageKnown。用户明确批准010后才可启动真实诊断。


## 010实际执行结果 · 2026-10-16

用户明确答复“批准010，一次限定诊断”。按原范围执行一次，原产品/UI/就绪审查复用，没有扩大工具、次数或数据范围。结论是**SCOPE_STOP / INCONCLUSIVE**，不能宣称真实框架或MiMo INVALID_TOOL修复通过。

- 实际安装全22710资源校验ready、SDK hash193a457e…匹配、无已有试用进程和活动operation。临时组合入口保留原owner独占，阻止全部4个旧项目进入本次Host，只接受新`proj_75d8cc9f`“Mini MiMo 工具分支诊断010”。新项目dual-v3；315字节合成Markdown，仅100/120/135及非业务事实限制，文字外发许可保存，截图/Bash联网均未开。
- 真实使用同一内置配置路径，仅MiMo。唯一一次UI发送产生5次模型派发、4次read、83.231秒。前两次成功读取材料目录和提取文本；后两次读取**确实存在的固定随包SKILL.md绝对路径**，被项目范围read接口软失败关闭。`read-path-classification-010.json`只保存路径分类/匹配布尔值，没有额外复制调用ID/参数值。技能资源存在与当前read入口边界不匹配已确认，但不能据此断定原008最后INVALID_TOOL根因。
- 第5个回复触发诊断gate的已声明范围外工具限制，SDK结果`AUTHORITY_REQUIRED`，任何该批次工具均未执行。由固定gate代码和5次派发/83秒/无第6准入可确定为回复范围停止；具体被阻断工具名没有保存，仍UNKNOWN，不猜为Bash或write。原SDK三个INVALID_TOOL位置均未命中，原008仍FAIL/具体分支UNKNOWN；没有outline/deck、未确认生成/导出/图像或主备场景。
- 原账本新项目modelCalls5/toolCalls4/inputTokens5264/outputTokens18232（其中已记录输出1848、未知输出预留16384）。不能把已记录token称为全部5次实际消费，最后回复因gate停止未由原SDK结算；美元账单未核实。业务operation `95e9ead3-8057-49c2-99c6-e44e5ea12d49`，run `b9887395-4ba6-4d7c-98f1-dd60aad60a0e`，state=unknown/physical_settled=true/usage_known=false。保留新增16384预留，不点击核对、不清账或退款。010一次场景已用，即使只派发5次也没有追加新场景权限。
- `settled-project-010`完整12文件复制并逐字读回，result-010.json和result-010.png保留实际UI停止/原SDK reason/累计与事件口径差异；三个旧任务预算与before-010逐字相同，A旧2048预留未变。正常内存凭据路径内使用，未读取显示/导出密钥或修改配置。
- 首次浏览器直接导航出现RS_LOCAL_REQUEST_REJECTED/403，具体初始拒绝条件UNKNOWN；按正常Chrome地址导航再完整Reload准入成功，未改guard、token校验或认证策略，首个模型前派发仍0。旧skill invalid_metadata警告保留。
- 确认物理结束后正常调用本次服务ownerLost收尾，保留UNKNOWN；进程93833退出0、53260不再监听，owner释放。仅本任务标签页关闭，用户原50424工作台标签保留；没有启动或退出其他工作台。证据session-010-state.json为closed及result-010.json独立进程/端口核对。安装与产品/SDK未改、未部署/发布Git/写MacBook。

新增真实证据仍不足以归因原INVALID_TOOL，不能盲改工具名、schema或ID、允许范围外工具或再发Provider来声称通过。后续若继续，应先在离线范围处理已确认的技能资源/read错配及诊断缺口，保持旧任务不可变配置/预留；新真实响应、工具范围或其他外部效果须另明确授权。原B失败、008失败、A2048及本次16384未知、其他NOT_RUN/NOT_PROVEN和正式完整Change缺口全部保留。最终独立Validator/required CI/工程及完整产品接受/归档仍未完成。
