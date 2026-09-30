# Xanthil 受控 Fork／Subagent 协作 产品计划 v1.0

## 0. 身份、批准与停止线

- Change：`xanthil-desktop-fork-subagent-collaboration`；日期：2026-09-30。
- 状态：`PRODUCT_INPUT_FROZEN_LOCALLY`；2026-10-01 用户全文批准及 UI Gate PASS，精确身份见[批准与冻结记录](xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md)。尚未 Git 发布／Engineering Intake。
- 用户先确认[范围与路线调整](change-003-scope-and-route-decision-v1.0.md)，随后明确“讨论稿同意，继续推进正式路线版本、可点击增量 UI Contract 和相应 Gate；UI 标准在 change2 时已经确定，注意做延续”。[讨论稿 v0.1](xanthil-fork-subagent-product-proposal-v0.1.md)中的根入口、分叉点、关闭及回流恢复建议由此进入本正式计划；本计划不增加自主程度或工具／数据权限。
- 基线：`e3fe084a6d877ac5ebec6dabd603781d0edd78e4`；tree `5d76b848dc4e1d17d5c856f7474e46ec3f2386f2`。
- 已批准路线：[Blueprint v3.0](juanerai-product-development-blueprint-v3.0.md)，已在 MacBook 本地整合；[v2.0](../2026-09-26/juanerai-product-development-blueprint-v2.0.md)保留为历史，不倒写其内容。新鲜 [Review 002](reviews/xanthil-fork-subagent-and-blueprint-v3-development-readiness-review-002.md) PASS。
- 可见行为：[增量 UI Contract v1.0](xanthil-fork-subagent-ui-contract-v1.0.md)及[可点击附件](clickable-ui-contract-fork-subagent-v1.0/index.html)。2026-10-01 用户“审核通过”，UI Gate PASS。

本次完成产品／UI 批准、独立只读就绪审查、本地规则整合与 Product Input Freeze。无工程 Intake、OpenSpec、生产代码、测试资产、依赖、真实模型、业务数据、Git 发布或 Mac mini 派发授权。就绪 PASS 与用户全文／UI 批准分别记录，产品冻结不启动工程。

## 1. 用户、任务与完整结果

用户是已有专业会员复购 Case 的业务／分析人员，使用已关联的根 Quick Case Assistant。用户需要另一条讨论路径或一次明确检查，但不希望混乱的聊天历史、同源意见冒充新证据，或子任务替其发布决定。

完整任务是：从有效父对话选择讨论分叉点或提交一个检查任务 → 在独立子窗口以自己批准的上下文真实执行 → 回流一份完整、有来源的结果 → 人工查看、采纳或拒绝 → 若继续父模型，再明确授权新 Attempt。正式决定仍沿用原人工采纳流程。

首个验收场景为已有会员复购 Case：Fork 比较一个已有候选与“不行动／暂缓”；Subagent 检查同一候选的反证及限制。候选、Evidence／Finding 和数值从具体已验证来源读取，不预定新候选或虚构真实业务数据。原型使用明确标注的合成示例；工程沿已有固定夹具准备合格来源，负例不得靠隐藏修改产品定义。

## 2. 继承的实际基线与范围差异

[现行 Case Assistant 规范](../../../openspec/specs/case-assistant/spec.md)及[Change 002 验收](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/acceptance.md)提供独立根 Quick Session、精确来源、授权、选择历史／报告、只读多轮、停止／新 Attempt、用户草案处理、正式决定／预期和不可变报告历史。[Desktop 规范](../../../openspec/specs/xanthil-desktop-decision-case/spec.md)提供专业六阶段、CSV、DuckDB／Python、Evidence／Finding 和导出。

本片新增产品父子关联、选定分叉历史、独立子窗口、子检查结果、回流及对父材料的采纳。它不是去掉 Preview 文案，也不复制一套计算、决定或报告能力。旧规范 REQ-CA-003 的禁止模型自行 forks／subagents 保持：新能力由用户启动、Application 控制，不开放 Runtime 递归工具。REQ-CA-006 的 Fork／Subagent Preview 行为在本 Change 后仅对这两项获批能力作增量替代，其他 Preview 不解锁。

当前 Provider 访问排他，父 Waiting 也占用。首期只允许一个活动模型任务，沿用模型设置／三辅助的既有互斥边界；没有父模型挂起等待子模型的自动编排。父 Attempt 终结以后才运行子任务，子完成以后父继续创建新 Attempt。

## 3. 产品身份、准入与数据边界

### FS-R01 — 来源与父子关系

- 仅根 Case Assistant 创建本片的 Fork／Subagent，子窗口无派生下一级执行入口。
- 根必须仍关联当前 Completed revision、accepted Finding、有效 Closure 和 final report；缺失条件逐项解释，无可用子对话或模型 Attempt。
- 每个子对话固定关联原父对话、Case／revision、创建时当前正式决定基线、分叉点或任务、所选历史与报告和获准聚合子集。父对话模式不变，不建立新分析 Case／revision，不复制原始快照。
- 用户只可选择分叉点之前已保存的父消息／回执和显示的报告摘要；继承项标明来源，不冒充子对话新消息。未选择的历史不隐式继承。之后新增父消息不会改变子快照或单独导致过期。
- 创建本地子对话不调用模型；创建失败／取消无半成品可用会话。外发授权拒绝时，已成功创建的本地子对话可保留“未授权”，无模型 Attempt 或调用。

### FS-R02 — 每个子 Attempt 独立授权

- 本片使用现有本机已配置 Provider／Model，不新增接入选项、Key 或 fallback；未配置／失效时先修复接入。
- 开始前展示精确任务文本、所选历史／报告／子材料、020_clean artifact／hash／字段范围、五种既有只读业务工具、Provider／Model、Skill／Prompt 标识和轮次／执行时间／等待截止／费用硬上限；独立确认自由文本外发。
- 保留原只读工具：读取 Case、证据、候选、聚合及报告；无原始行、010_draw、任意文件／SQL／Shell／Web、其他 Case、密钥、未选日志或工具扩权。每轮／工具前重查来源与授权，拒绝不产生工具结果或下一模型轮。
- 只允许已确认上下文；其精确模型载荷沿既有审计规则记录。子材料进入父模型也必须用户选择后再披露，不能凭回流／采纳自动外发。
- 具体限额由既有配置／任务设置和工程合同确定，不冻结新数值；缺一项不可开始。上限变化、新上下文或新来源须重做预览／授权、新 Attempt，不在旧 Attempt 上扩权。
- Waiting 中的回答沿用[现行规范](../../../openspec/specs/case-assistant/spec.md) REQ-CA-002 的 later Send 行为：用户逐条确认当前可见回答文本，且仅在原任务／数据／工具／限额内继续同一 Attempt。该回答不是自动外发整段历史或扩权；增加其他数据、历史／结果材料、来源、工具或限额须终结后新预览和新 Attempt。

### FS-R03 — 顺序执行

父或任何其他模型任务 Running／Waiting 时，创建子任务的推进动作显示占用与结束当前任务的入口；不隐式停止、不队列自动启动。用户须显式停止或等其终结后重试。浏览父／子历史、查看来源、处理已完成结果无需启动模型；子运行时父可浏览，但不能运行父模型、三辅助或变更模型接入。

## 4. Fork 与 Subagent 的真实行为

### FS-R04 — Fork

用户从根选择明确分叉点、继承项及讨论目的；预览后创建独立子窗口。窗口有标题、类型、父来源／分叉点、范围、自己的消息／Attempt 历史、授权和停止入口。用户可按已授权边界多轮讨论。

Fork 下一 Attempt 可逐项选择本子对话此前已保存的用户消息、模型消息、只读回执及成功结果版本，默认不勾选；每项显示确切内容、来源、原 Attempt 和状态。原父分叉继承项也在新授权中逐项披露，不隐式追加整个子历史。“展开上一版第二点”必须先选定该上一版结果或确切历史，不从 Pi session 隐式恢复。停止前部分文字可以作为明确标注“未完成”的所选历史，不能成为完整成功子结果；过期内容仍阻断。新授权记录这些选择，未选择项不进入载荷。正在执行的同一 Attempt 内，只使用该 Attempt 已披露的上下文及范围内逐条确认的回答。

只有成功终结的 Attempt 中已完整保存、结构及来源引用合格的结果／摘要可以回流；中断前部分内容仅历史，不作为本片成功子结果。Fork 显式选择一份结果，点击 `回流到来源对话`，不默认回流整份历史。新结果拥有可区分版本，旧结果不覆盖；同一版本只在原父对话出现一份待审项。运行新 Attempt 不撤销先前已成功且仍合格结果的历史。

### FS-R05 — 单个 Subagent

用户从根输入一次有界检查，选择上下文并授权。独立任务窗口显示任务／来源／范围、运行状态、只读回执与限额，可在该窗口回答一次或多次追问；等待时执行计时暂停，等待截止继续，仍占用唯一模型任务位置。

成功是完整结果通过结构／引用／当前来源核对并保存，不是模型自称完成。结果是模型检查意见：摘要、可查的已有来源引用、限制／未知；无新 Evidence／Finding、计算值或正式决定。无法支持结论可以作为成功返回的“依据不足”意见，不冒充任务失败或经营成功。

成功后自动向原父对话回流一个待审项，子窗口显示 `已回流`，不启动父模型。失败／停止／执行或等待超时／预算耗尽／Interrupted 无成功结果身份和成功回流；保留真实历史／原因，父仍可用。

任务成功但回流失败／超时分别显示。成功结果仍在子窗口，父无虚假待审项；`重试回流` 只本地提交原结果，不重新跑模型。重复回流不会产生新结果、材料或报告。

## 5. 回流、采纳与历史权威

### FS-R06 — 结果处理

每个待审项固定显示子类型／身份、结果版本、父来源、revision／正式决定基线、范围、执行与回流状态和来源打开入口。回流只是待审，既不进入父已采纳材料，也不发给 Provider。

`采纳到父对话`／`不采纳` 先展示确切结果版本、来源和“不会改变 Evidence／Finding、草案、正式决定／预期、报告”的确认。取消无状态变化；可记录可选原因。提交绑定实际审阅目标／版本，期间目标或来源变化阻断；重复提交幂等，失败无半成功。一个结果的采纳／拒绝是一次终结处理，不通过重试把拒绝变采纳；新意见形成新结果版本。

采纳只追加标明“模型生成、用户采纳”的父材料及审阅记录，不编辑原草案／用户文字。拒绝不进入父材料，仍可看子历史。后续父 Attempt 的授权逐项选择这份材料，包含其内容和来源；只有明确新 Attempt 的模型输出可形成新的待采纳草案，用户再按原正式采纳流程发布 Decision Record／Expected Outcome／报告。子窗口没有正式发布通道。

### FS-R07 — 来源变化

Case revision、当前正式决定基线、数据资格或授权失效时，运行、继续、回流、采纳和外发均重新核对并阻断；显示变化前后，不自动 latest 重绑。旧子对话、已回流项和已采纳材料保留为过期历史，但不能在新来源下直接采用或外发。

重新开始须显式回到根绑定当前来源，新子对话／新 Attempt。跨 revision 仅允许逐项重新授权的用户自写约束，旧模型文字、证据／Finding、报告／工具回执和子材料不自动携带。Parent 只新增普通消息不失效；正式决定链更新，即使 revision 相同也失效。

## 6. 停止、关闭、恢复与局部失败

### FS-R08 — 生命周期

- 停止可达且不被 pending start/send 阻塞；立即封住新模型／工具调用。迟到回执不恢复 Running、不形成新成功结果或自动回流。
- 导航、模式切换、返回来源、查看另一个已保存对话不等于关闭；不停止、不扩大授权。
- 独立子窗口关闭前，若有 Running／Waiting，明确确认 `关闭并停止`；取消留原状态，确认中断本子活动 Attempt、作废其待用授权。无活动任务可直接关闭；已保存结果／回流／采纳历史不删除。
- 实际 `关闭父会话` 明确确认会停止该父关系下所有未结束子任务并作废待用授权；取消不关闭。父视图离开不触发此行为。父明确关闭后禁止子迟到自动回流；重新打开父和检查当前资格后才允许本地重试已成功结果。
- 退出应用／崩溃后重开，持久 Running／Waiting 变 Interrupted；所有待用模型授权失效，不恢复 Pi session 或自动重发调用。
- 成功但未回流的 Subagent 在重开后显示 `待回流恢复`，用户明确本地重试；不自动继续回流／模型。已回流结果直接读回，不重复产生项。过期时保留并阻断。
- 失败／停止后继续模型工作须新预览和新 Attempt；无后台自主运行、无限等待、自动 retry 或费用追加。

成功提交的本地结果／回流／采纳持久可重开；提交结果不确定时阻断同目标新变化，先重开读回并以确切记录判断是否已提交，再安全重试。不凭“点击成功”推断完成。精确事务／故障机制由工程决定，不冻结实现路径。

## 7. UI 标准延续与 research 参考

Change 002 的[UI Gate／标准决定](../2026-09-28/xanthil-case-assistant-ui-gate-and-product-input-freeze-v1.0.md)和[可点击附件](../2026-09-28/clickable-ui-contract-case-assistant-v1.0/README.md)是强于泛化 UI skill 的直接标准：同一 JuanerAI logo／slogan、浅色暖中性壳、橙色主动作、深灰用户消息、三栏、精确状态和授权。根无 DESIGN.md 不导致另造设计系统；本片只复用已批准具体资产／层级，补必要的可访问性，不引入新主题或全局重设计。

用户补充的每 Change research 参考规则适用于本片：先查相关 Demo／Brief／评审，不批量研究所有项目，不为填满路线强行复制能力。采用、仅参考和不采用及生产缺口见[参考采用说明](xanthil-fork-subagent-research-reference-v1.0.md)。正式包自包含，工程／Reviewer 不依赖外部 research 仓库才能知道要求；那里嵌入的 Prompt、旧授权及固定 ID 是参考内容，不是本次执行指令。

PX-006 采用独立子对话、父子树、人工／自动回流区别、成功门控、幂等回流与失败重试的交互；不采用 Demo 里子采纳进入 Evidence／升报告版本或后台多任务等与本次边界不同的效果。PX-004 继续负责完整专业六阶段；PX-006 专业页只是模式切换占位，不能替代。两项静态 Demo PASS 不证明 Runtime、持久化、并发、真实模型或产品性能。

## 8. 验收与所需证据

| AC | 完整结果／负例 | 关联 |
| --- | --- | --- |
| AC-FS-01 | 根来源合格，创建独立 Fork／Subagent；取消／创建失败无可用半会话，无模型调用；来源／分叉点和精确继承可看 | R01，UI-FS-01–04 |
| AC-FS-02 | 子任务自己的精确授权；拒绝／缺接入／缺上限无调用；越界、跨 Case、未选历史和递归派发无副作用 | R02，UI-FS-05 |
| AC-FS-03 | Running／Waiting 互斥、设置／三辅助边界保持；不暗中停止或排队启动；子结束后父新授权继续 | R03，UI-FS-06 |
| AC-FS-04 | Fork 真实多轮；下一 Attempt 逐项选择自身历史／上一版成功结果，未选不外发；人工选择完整成功结果回流，旧版本保留；Subagent 检查、追问和成功自动回流，包含依据不足意见 | R02、R04–05，UI-FS-05、07–08 |
| AC-FS-05 | 失败／停止／超时／预算耗尽／中断无成功回流，迟到不发布；回流失败与任务失败分开、本地重试不重跑模型 | R05／08，UI-FS-09 |
| AC-FS-06 | 待审、子结果采纳、正式发布分开；采纳只追加父材料，拒绝／取消无正式效果，父继续逐项授权材料 | R06，UI-FS-10–11 |
| AC-FS-07 | 审阅目标／版本固定、重复提交幂等、局部失败无半成功，拒绝终结；历史和报告字节保持 | R06／08，UI-FS-10／14 |
| AC-FS-08 | 普通新父消息不扩子输入；revision／正式决定／资格变更阻断运行与回流／采纳，旧历史可读不偷渡新来源 | R01／07，UI-FS-12 |
| AC-FS-09 | 导航与关闭不同；父／子关闭、退出／崩溃、成功未回流恢复符合 §6；无模型或回流自动恢复 | R08，UI-FS-13 |
| AC-FS-10 | 六阶段、数据／计算／Evidence／Finding、三辅助、原多轮、草案／正式版本／导出／Provider 及其他 Preview 回归保持 | §2／7，UI-FS-14 |

正面工程验证通过真实业务 Application、持久化、受控 Adapter、原生 Desktop 入口；负例覆盖来源／权限／失败／迟到／关闭／重开／幂等与零正式副作用。保留现有契约／断言及覆盖，仅新增因本片明确行为所需增量；没有生产实现前本计划不声称 causal RED／GREEN。

真正 Provider 验证单独批准 Provider／Model、精确合成输入、费用与专用命令；本次授权只够离线 UI。真实任务质量、用户节省时间、多 Agent 更优、业务效果、学习发生／有效各需适用研究，工程 PASS 不能推导。

## 9. 四视图、职责、延期与价值

| 覆盖 | 本片与返回点 |
| --- | --- |
| C1 OSM／PIM | PIM 同一 Case 的比较／检查；不接管 OSM、行动 Owner |
| C2 三模式 | 假设先行场景；不新增 Deep Research／自主探索 |
| C3 产品形态 | Personal 单用户，多个对话不等于 Team |
| C4 方法／Packs | 现有只读业务能力与计算基础不变，无新方法／Pack／因果裁判 |
| C5 决策价值 | 增加可审阅材料；正式发布仍人工，Actual／评价下片 |
| C6 资产进化 | 保存子来源，不自动资产／Skill／Prompt 晋升，下一 Case 采用仍后续 |
| A 数据／语义／执行 | 父子身份、范围、成功结果和回流；复用原 Ports／Adapters／Profile |
| B 可信治理 | 精确权限、顺序、过期、关闭、来源等级和人工采纳贯穿 |

Product Core／Application 拥有产品父子、资格、结果及材料采纳；业务 Ports 表达必要运行／存储；Adapter 执行物理操作；Profile 组合，Desktop 表达控制。依照[复用基线](../../governance/xanthil-first-slice-reuse-baseline.md)、[复杂度控制](../../governance/change-complexity-control.md)、[数据权威](../../architecture/data-authority.md)、[安全边界](../../architecture/security-boundaries.md)、[ADR 0003](../../adr/0003-business-runtime-port-strategy.md)、[Session／Runtime](../2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md)和[产品执行政策](../../governance/product-change-execution-policy.md)。Pi 内部对象只留 Adapter；不重选 Runtime、建通用调度平台或扩大工程上层边界。

工程接收后拥有必要合同、Schema／迁移、窗口传输和恢复机制、资源／事务、运行环境、精确验证命令和拆分；不预冻结 TypeScript 名称、端口、路径、表或包。不能以普通 Session 创建代替父子语义，或以正式 adopt 代替子材料采纳。

价值假设是减少主对话混杂、让用户比较另一条思路／检查反证并作出显式取舍。通过用户独立完成、来源／状态辨认、负例理解和记录负担来判断，不编造效率阈值。完成两项后明确回到结果回访 → 改进与下一 Case 显式采用；Fork 完成不等于本 Change 完成，更不等于 Decision Loop MVP 完成。

## 10. 产品输入与交付条件

本计划、已批准 Blueprint v3、UI 正文／可点击附件及自包含 research 采用说明构成产品输入包。新鲜独立 Review 002 按七项 development-readiness 检查蓝图和具体计划并判定 PASS；Review 001 的 NEEDS_CLARIFICATION 及后续修正历史保留。

2026-10-01 用户审核通过后，全文／UI 批准、MacBook 本地规则整合和 Product Input Freeze 见[冻结记录](xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md)。Git 发布、固定版本接收与工程推进仍需独立适用授权及回执。本 chat 不自动提交／推送／交接，也不操作 Mac mini 的工程状态。
