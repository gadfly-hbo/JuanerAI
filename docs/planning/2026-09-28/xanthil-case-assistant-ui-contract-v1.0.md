# Xanthil Case 决策助手增量 UI Contract v1.0

## 0. 合同身份

- Change：`xanthil-desktop-case-assistant-decision-record`
- 日期：2026-09-28
- 状态：`UI_GATE_PASS_PRODUCT_INPUT_FROZEN`
- 基线合同：
  - `2026-09-18/xanthil-desktop-ui-contract-v1.0.md`
  - `2026-09-18/xanthil-desktop-ui-contract-v1.1.md`
  - `2026-09-18/xanthil-ui-reference-adoption-map-v1.0.md`
  - `2026-09-18/xanthil-ui-state-and-closure-matrix-v1.0.md`
- 视觉责任：PX-2026-004 继续负责专业模式完整流程；PX-2026-006 继续负责快速模式、模式切换和 Fork / Subagent 位置。
- 可点击附件：`clickable-ui-contract-case-assistant-v1.0/dist/index.html`
- 品牌附件：`clickable-ui-contract-case-assistant-v1.0/dist/assets/juanerai-logo-slogan.png`，SHA-256 `56bdb1196e9f1bbaef64c973c4108d12294246de6e941fa00821a2769e3e0e21`
- 用户验收：`xanthil-case-assistant-ui-gate-and-product-input-freeze-v1.0.md`，2026-09-29 `UI Gate PASS`

本合同只定义第二个 Change 对既有 Xanthil Desktop 的可见增量。未明确修改的基线合同继续有效；本合同不得被解释为重做主导航、六阶段流程或整体视觉系统。

### UI-00 品牌标识

全局壳层使用用户提供的 JuanerAI 标识及精确 slogan `持续做出更好的决策`。`JuanerAI` 是项目品牌，`Xanthil Desktop` 是产品名；二者应同时可辨认。禁止继续使用原型中的字母 `X` 临时图标，也不得改写 slogan。紧凑顶部栏可以从同一附件裁切显示图形标志，并以可访问文本完整显示品牌名和 slogan；关于/启动等有空间的表面使用完整原图。

## 1. 用户必须一眼分清的四种状态

所有相关界面必须用文字和结构同时区分：

1. **Agent 建议**：普通对话内容，无业务写入；
2. **待采纳草案**：结构已校验但仍可编辑/拒绝，无业务写入；
3. **正式记录**：用户采纳后写入来源 Case；
4. **Preview**：功能尚未执行，不能产生任何模拟成功状态。

仅用颜色或图标区分不合格。

## 2. 桌面壳层与模式关系

### UI-01 顶部模式切换

保留 PX-2026-006 的 `快速模式 / 专业模式` 双入口。进入 Case Assistant 时快速模式高亮，并在标题旁显示 `已关联专业 Case`。

切换模式只切换视图：

- 不把 Quick Session 转换为 Professional Session；
- 不改变来源 Case revision；
- 不清空当前对话、草案或专业阶段状态；
- 返回专业模式时定位到来源 Case 的阶段 6。

### UI-02 全局真实状态标签

原型和测试环境固定显示 `UI Contract · 合成状态 · 无真实模型调用`。真实产品不得显示虚假的“已连接”或“执行成功”；Provider 未授权时明确显示未授权。

## 3. 快速模式布局

沿用 PX-2026-006 的三栏结构：

- 左栏：Session 列表与来源 Case；
- 中栏：Case Assistant 对话、Attempt 状态、草案；
- 右栏：授权、来源、Skill / Prompt、工具历史和报告版本。

桌面宽度不足时右栏可成为抽屉，但授权与来源信息不能被永久隐藏。

### UI-03 左栏 Session 项

每个 Case Assistant Session 显示：

- Session 标题；
- 来源 Case 名称；
- 绑定 revision；
- 最近 Attempt 状态；
- 是否存在待采纳或过期草案。

新建入口命名为 `关联一个 Case`，不能使用暗示通用空白聊天的 `新建对话`。只有具有 accepted Finding、有效 Decision Closure、Completed 状态和 final report 的 revision 合格。其他状态逐项说明缺失条件，不能创建模型 Attempt。

### UI-04 中栏页头

必须显示：

- Case Assistant Session 标题；
- 来源 Case + revision；
- `打开专业模式来源`；
- 当前任务状态；
- `停止`（仅运行中可用）；
- 更多菜单中的归档/重命名等既有 Session 操作。

禁止把 Fork 或 Subagent 放在主要执行按钮位置。

## 4. 任务授权

### UI-05 授权卡与详情

任务未授权时，中栏顶部显示阻断卡；右栏默认打开 `任务授权`。至少呈现：

- 来源 Case / revision；
- Provider / Model；
- 初始任务文本逐字内容，以及“后续每次发送会逐字发给该 Provider”的持续提示；
- 数据类别及“不会发送”的数据；
- 获准 `020_clean` artifact / subset 的精确身份、字段和聚合范围；
- 新 Attempt 将外发的具体历史消息、工具回执摘要和报告摘要；
- 只读工具清单；
- 轮次、模型执行时间、等待截止时间、费用硬上限；
- Skill 名称与版本；
- Prompt 版本与查看入口；
- `确认并开始` 与 `取消`。

不可把授权折叠成一个无内容的复选框。自由文本必须有独立的敏感业务内容确认。确切预算/等待截止时间未配置、Provider 未授权或来源不合格时，`确认并开始` 禁用，并提供唯一明确修复入口。

Composer 持续显示 Provider / Model 和“发送当前可见文本”；不自动附加历史、附件、路径或本地内容。任务级授权替代的是重复弹窗，不是实际 payload 记录。

### UI-06 重新确认

来源 revision、Provider / Model、数据类别、工具范围或上限扩大时：

- 显示 `授权已失效`；
- 不自动继续；
- 列出变化前后；
- 用户重新确认后创建新 Attempt。

重新绑定 revision 时，旧 Evidence、Finding、报告、工具回执和模型文本默认全部排除。只有用户自写约束可在逐项显示并再次确认后携带。

## 5. 对话、工具与 Attempt

### UI-07 消息

每条消息显示角色、时间和 Attempt 编号。Agent 消息标为 `建议`；引用 Evidence / Finding 时提供可打开的来源标记。

输入区允许自然语言追问；发送前若没有有效任务授权，先打开授权面板，不能静默调用模型。

### UI-08 工具回执

每次工具调用以可展开回执显示：

- 业务动作名，例如 `读取已验证证据`；
- 读取对象、Case revision、时间；
- `只读`；
- 完成/失败/拒绝状态；
- 结果摘要和实际 payload 审计入口。

不得显示或依赖 Pi 内部 tool 名、事件名、session id。禁止工具请求显示 `已拒绝：超出任务授权`，且不能伪造结果。

### UI-09 预算与停止

运行中固定显示剩余轮次、已用时间和费用状态。`停止` 是可见主操作，点击后：

- 状态立即变为 `正在停止`，随后为 `已停止`；
- 输入区冻结，停止后重新开放；
- 不再出现新模型轮次或新工具调用；
- 显示 `继续此工作`，并解释它会创建新 Attempt。

等待用户回答时，界面同时显示 `模型执行计时已暂停` 与继续流逝的等待截止时间；仍可停止。关闭 Session、退出应用或等待到期会终结 Attempt，而不是后台无限等待。

### UI-10 继续

`继续此工作` 打开新 Attempt 摘要，逐项列出将外发的产品消息、规范化工具回执摘要、报告摘要和草案，以及明确排除的历史，并显示新的授权。用户确认后创建新 Attempt；界面不使用“恢复 Pi 会话”等实现术语。

应用重启后，运行中任务显示为 `已中断`，行为与停止后的继续一致。

## 6. 草案、采纳与报告

### UI-11 Pending Decision Draft

草案用独立卡片呈现，标题固定为 `待采纳决策草案`，并显示：

- 草案版本和生成 Attempt；
- 来源 revision；
- Decision Record 所有字段；
- Expected Outcome 所有字段，或不适用原因和重新评估条件；
- 计划结果来源、结果 Owner 与后续评价责任人；
- Evidence / Finding 引用；
- 限制与未知事项；
- `编辑`、`拒绝草案`、`采纳到 Case`。

Agent 的自由文本不能直接替代该卡片。

### UI-12 编辑

`编辑` 打开真实字段表单，支持 `选择已有候选 / 不行动 / 暂缓` 三个互斥分支及各自必填项。用户可保存或取消：保存后卡片标示 `经用户修改` 并重新执行确定性完整性检查；取消只丢弃本次未确认编辑。Agent 不自动重写用户字段。

### UI-13 拒绝

拒绝前必须打开确认面板并说明“来源 Case 不会改变”。确认后草案状态变为 `已拒绝`，记录时间和可选原因。取消确认无状态变化；拒绝不得删除对话或旧草案历史。

### UI-14 采纳

采纳前确认面板必须列出将创建的对象和来源 revision。采纳期间按钮防重复提交。成功后显示：

- `正式 Decision Record` 身份；
- `正式 Expected Outcome` 身份；
- 采纳人和时间；
- 新报告版本；
- `返回专业模式查看`。

采纳失败时保留草案，不显示半成功；界面提供可验证的失败原因和安全重试。

来源 Completed revision、原 Decision Closure 和原 final report 不被改写。新报告版本包含新正式决定，旧报告显示为可读 superseded history。已有当前正式决定时，采纳创建下一版本；同基线的其他草案立即过期。

### UI-15 revision 冲突

若来源 revision 已变化：

- 草案顶部显示 `来源已变化，草案已过期`；
- `采纳到 Case` 禁用；
- 展示旧、新 revision 及 `查看变化`；
- 唯一推进路径是重新绑定后创建新 Attempt；
- `查看变化` 必须可打开 revision / 当前 Decision Record 差异；`基于当前版本重新开始` 进入明确排除旧 revision 数据的新授权面板；
- 旧草案和引用仍可查看。

### UI-16 报告

草案阶段只能预览报告增量，明确标注 `未生成报告版本`。采纳成功后才在右栏 `报告版本` 出现新版本；旧版本始终可访问。

## 7. 专业模式增量

### UI-17 阶段 6 `Execution feedback` 入口

PX-2026-004 的专业六阶段及原 Decision Closure 保持不变。在阶段 6 `Execution feedback` 加入 `用 Case Assistant 记录正式决定`：

- 前置条件满足时，创建/打开已关联 Quick Session；
- 不满足时显示缺失的证据判断、Finding 或报告前置条件；
- 已有待采纳草案时显示状态和 `继续审阅`；
- 已采纳后显示正式 Decision Record、Expected Outcome 和报告版本。

### UI-18 三类一次辅助

既有三项辅助的名称和位置保持为 `帮我整理问题`、`帮我解释证据`、`帮我起草候选`，并继续显示逐次精确 payload、自由文本二次确认和一次调用状态，不共享 Case Assistant 的任务级授权。它们不得改名为“分析框架建议”或改变固定方法/判断。用户必须能区分 `一次辅助` 与 `多轮 Case Assistant`。

## 8. Skill、Prompt、Fork 与 Subagent

### UI-19 Skill / Prompt

右栏 `能力` 区显示：

- `Case 决策与预期 v1.0`；
- 用途、允许输入、输出结构和版本说明；
- `查看 Prompt 信息`，内容至少包括版本、用途、数据边界和输出约束；
- 无编辑、导入、启用其他 Skill 或切换 Prompt 的控件。

### UI-20 Fork / Subagent Preview

输入区保留 PX-2026-006 的 Fork / Subagent 位置，但必须：

- 带 `Preview` 标签；
- 点击只打开说明面板；
- 明确“本 Change 不执行”；
- 不产生 Session、Attempt、工具回执或成功消息；
- Fork 的说明可注明未来优先于 Subagent，但不得承诺日期。

## 9. 关键空态和错误态

必须可见并可从原型或验收夹具触达：

1. 无来源 Case；
2. 来源 Case 前置条件不足；
3. Provider 未授权；
4. 预算缺失；
5. 工具越界被拒绝；
6. 运行中、等待用户、正在停止、已停止、已中断；
7. Provider 失败、超时、预算耗尽；
8. 草案待审、经用户修改、已拒绝、已过期；
9. 采纳中、采纳失败、采纳成功；
10. Fork / Subagent Preview。

错误信息应说明：发生了什么、Case 是否改变、用户可做什么。不得只显示错误码。

## 10. 可访问性与响应式要求

- 所有主流程支持键盘；
- Dialog 打开后焦点进入，关闭后回到触发控件，Escape 可关闭非破坏性 Dialog；
- 停止、拒绝、采纳必须有文本标签；
- 状态同时使用文字和视觉标记；
- 1440×900 为 UI Gate 主视口；1280×720 不遮挡关键动作；
- 窄视口右栏变抽屉时，授权、来源和草案状态仍可到达；
- 对话流式更新不得抢走用户焦点。

## 11. UI Gate 场景

### Gate A：来源与模式边界

从专业阶段 6 进入快速模式，确认来源 Case / revision 正确、专业 Session 未转换；切回后仍在来源阶段 6。

### Gate B：授权与真实开始

查看初始文本、精确数据 subset、历史外发清单和完整任务授权；分别触发 Provider 未授权、执行预算缺失和等待截止时间缺失，确认无法开始；在合成 UI Contract 中确认授权后的可见运行状态不被误认为真实模型执行。

### Gate C：多轮、工具与停止

实际回答一次 Agent 追问，观察等待期间执行计时暂停、等待截止时间继续、只读工具回执和预算显示；执行停止并确认后续不再出现模型轮次/工具调用；继续时创建新 Attempt，A-01 历史不被改写且新授权显示实际外发清单。

### Gate D：草案与人工控制

查看完整 Decision Record + Expected Outcome 草案；分别切换选择已有候选、不行动、暂缓并触发缺字段校验；编辑后取消不保存，拒绝须二次确认且不会改变 Case；采纳前明确列出追加对象及不变的来源 revision / 原报告。

### Gate E：revision 冲突

触发来源 revision 或当前 Decision Record 变化，确认草案过期、采纳禁用；查看差异并进入重新绑定授权，确认旧 revision Evidence / 报告 / 工具结果被排除。

### Gate F：成功回流

先触发一次采纳失败，确认无半成功且草案保留；再采纳合成草案，确认正式记录、新报告版本及专业阶段 6 回流，来源 Completed revision 不变且旧报告成为可读 superseded history。随后创建并取消一次决定修订，确认不产生新版本。

### Gate G：Preview 诚实性

点击 Fork / Subagent，确认只有说明，无任何执行、Session 或结果。

## 12. 非目标与差异处理

本增量合同不批准新的通用聊天首页、不同于 PX-2026-004/006 的替代导航、Fork、Subagent、Prompt 编辑、Skill 市场、行动执行或 outcome follow-up。

若工程发现必须改变本合同中的模式关系、来源绑定、授权粒度、停止/继续语义、正式写入边界、revision 冲突处理或 Preview 范围，必须返回 Product Manager 和用户，不能以实现便利自行改写。
