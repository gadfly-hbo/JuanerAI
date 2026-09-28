# Xanthil Case 决策助手产品计划 v1.0

## 0. 文档控制

- Product Change：`xanthil-desktop-case-assistant-decision-record`
- 产品负责人：MacBook Product Manager
- 日期：2026-09-28
- 状态：`PRODUCT_INPUT_FROZEN`
- 规划基线：Git `9aff1f88a24fd29a6d843b3614d014ef50192be3`
- 适用产品：Xanthil Desktop Personal / Local Profile
- 上位依据：Product Development Blueprint v2.0，尤其是 §4、§5–6、§7–10 与 §6.2
- 增量 UI Contract：`xanthil-case-assistant-ui-contract-v1.0.md`
- 可点击 UI Contract：`clickable-ui-contract-case-assistant-v1.0/dist/index.html`
- UI 品牌输入：用户提供的 JuanerAI 标识，合同内副本 `dist/assets/juanerai-logo-slogan.png`，SHA-256 `56bdb1196e9f1bbaef64c973c4108d12294246de6e941fa00821a2769e3e0e21`；固定 slogan `持续做出更好的决策`
- 首轮就绪审查：`reviews/xanthil-case-assistant-development-readiness-review-001.md`，结论 `NEEDS_CLARIFICATION`，历史保留
- 第二轮就绪审查：`reviews/xanthil-case-assistant-development-readiness-review-002.md`，结论 `NEEDS_CLARIFICATION`，确认 R1–R4 / R6 已关闭并把剩余缺口收敛到可点击附件的 Gate C–F，历史保留
- 第三轮就绪审查：`reviews/xanthil-case-assistant-development-readiness-review-003.md`，结论 `NEEDS_CLARIFICATION`，确认字段编辑已闭合，并把剩余问题收敛为 r7/r8 上下文一致性、修订状态优先级、完整历史读回与同 revision 当前决定冲突场景，历史保留
- 第四轮就绪审查：`reviews/xanthil-case-assistant-development-readiness-review-004.md`，结论 `NEEDS_CLARIFICATION`，确认 Review 003 的主要缺口已关闭，并把最后阻塞收敛为同 revision 当前决定冲突后的正式版本接续，历史保留
- 第五轮就绪审查：`reviews/xanthil-case-assistant-development-readiness-review-005.md`，结论 `NEEDS_CLARIFICATION`，确认直接版本接续已关闭，并把剩余问题收敛为该重基任务停止/继续后的修订身份与正式基线披露，历史保留
- 第六轮就绪审查：`reviews/xanthil-case-assistant-development-readiness-review-006.md`，结论 `PASS`；确认正式基线跨停止/继续保留、DR-002 / v2 → DR-003 / v3 接续及动态修订说明闭合。此 PASS 仅为 Product Plan Development-Readiness；审查当时仍等待用户 UI Gate
- 用户 UI Gate 与 Product Input Freeze：`xanthil-case-assistant-ui-gate-and-product-input-freeze-v1.0.md`；用户于 2026-09-29 明确 `UI Gate PASS`，MacBook Product Manager 据此冻结本 Change 的产品输入；在冻结记录写入时，Git 发布及 Mac mini Engineering Intake 尚未发生
- 用户决定记录：本规划 session 中用户在澄清 Pi 边界、Fork / Subagent 范围和产品切片后明确选择“一次性待决定的问题包，全部按推荐”；本计划只把该批准转写为正式输入，不扩充授权

本计划把此前经用户一次性批准的第二个 Change 决策固化为正式产品输入。Development-Readiness Gate PASS、用户 UI Gate PASS 与 Product Input Freeze 已分别记录；这些 Gate 本身不授权 OpenSpec、依赖安装、实现、外部数据访问、真实模型调用、Git 集成或工程派发。Git 发布、Mac mini 固定版本接收及用户明确的 Engineering Intake 指令属于独立后续动作。

## 1. Change 要解决的用户问题

第一 个 Change 已让专业模式能够完成从数据准备、独立复算、分析、证据判断到报告与人工结论的六阶段流程，但用户仍需独自把已确认的证据转化为可追踪的决策及预期结果。快速模式只有 Preview，不能真正承接一个 Case 的证据并协助完成决策闭环。

本 Change 的最小用户结果是：

> 用户从一个已完成必要证据判断的专业模式 Case 出发，在独立的快速模式 Case Assistant 会话中与受约束 Agent 多轮协作，形成一个待采纳的 Decision Record 与 Expected Outcome 草案；用户审阅、修改并明确采纳后，来源 Case 才产生正式记录及一个新的报告版本。

用户拿到的可验收结果不是一段聊天文本，而是：

1. 与来源 Case revision、证据和分析限制绑定的 Decision Record；
2. 与该决策绑定、可在后续 Change 被观察和复盘的 Expected Outcome；
3. 记录采纳人、采纳时间、来源及变更历史的新报告版本；
4. 可回看但不冒充业务事实的对话、工具回执、停止与继续历史。

本 Change 不执行行动、不观察真实结果，也不把草案自动写回业务记录。

## 2. 与 Blueprint 的关系

### 2.1 顺序一致性

本 Change 直接实现 Blueprint v2.0 §6.2 的默认下一片：Decision Record + Expected Outcome。它没有把“通用快速分析助手”提前到产品主线，因此不修改 Blueprint 的纵切顺序。

但本轮调查确认一个必须显式记录的差异：Blueprint v2.0 §6.2 的原始当前边界写有“不实施新的模型调用”，而用户随后在本规划 session 明确批准以受约束多轮 Agent 完成这一用户结果。本 Change 因此以当前用户决定作为**仅限本 Change 的范围修订**：允许本计划定义的模型调用、只读工具和任务级授权；它不把 Blueprint 改写成普遍授权，也不解锁其他 Preview 能力。由于用户同时批准保持既有纵切顺序且不引入通用 Quick 助手，本轮不另行修订 Blueprint v2.0；若未来要把 Agent 扩展为通用路线能力，再按版本规则修订 Blueprint。

本 Change 结束后的明确返回点仍是：

1. outcome follow-up；
2. 将被验证的结论显式采纳到下一个 Case；
3. 其他产品线能力按 Blueprint 的 Change 选择规则重新比较。

### 2.2 六加二覆盖

| 覆盖面 | 本 Change 的增量 | 明确不做 |
| --- | --- | --- |
| PIM / Analysis | 从已验证证据形成决策与预期结果 | 新的数据分析方法、自动证据采纳 |
| Xanthil Desktop | 快速模式真实 Case Assistant；专业模式入口与回流 | 新造一套替代工作台 |
| Agent Runtime | 受约束多轮任务、只读工具、停止与继续 | 通用自主 Agent、跨任务无限会话 |
| Skills / Prompts | 一个内置版本化 Skill；Prompt 可查看 | Skill 市场、Prompt 编辑管理 |
| Data / Governance | 来源 revision、工具回执、采纳审计 | 任意文件、Shell、Web、外部写操作 |
| Reporting | 采纳后生成新报告版本 | 草案即报告、静默覆盖旧报告 |
| OSM | 仅提供后续结果观察所需的目标表达 | 执行行动、组织绩效管理 |
| Domain / Model Packs | 复用现有 Case 语义和模型选择边界 | 新 Domain Pack、Model Pack 平台 |

### 2.3 竞争价值假设与证据

价值假设：相较于只生成总结的聊天助手，把 Agent 限定在一个已验证 Case，并要求正式决策由用户采纳，可以减少“重新解释上下文”和“聊天结论无法追踪”两类摩擦，同时保留业务控制权。

本 Change 必须产生的验证证据：

- 用户能从专业 Case 进入已绑定来源的快速模式会话；
- Agent 只能读取授权范围内的业务视图，并只能提交待采纳草案；
- 停止、失败、来源 revision 变化和拒绝草案均不产生正式业务写入；
- 用户采纳后，Decision Record、Expected Outcome 和新报告版本具有一致来源；
- 对话和工具历史可解释过程，但不能覆盖正式业务记录。

## 3. 复用基线与产品边界

### 3.1 必须复用

- 第一 个 Change 的真实 Session / Case revision、CSV 数据准备、快照确认、DuckDB 计算、Python 独立复算、Evidence、Finding、报告版本、导出与人工决定记录；
- PX-2026-004 的专业模式完整六阶段工作台；
- PX-2026-006 的快速模式、模式切换及 Fork / Subagent 可见位置；
- Product Core → Application → Port → Adapter → Profile 边界；
- 现有模型辅助入口能够复用的业务 Port、Provider 配置与审计语义。
- 用户在本规划 session 提供的 JuanerAI logo 与 slogan；Xanthil 仍是 Desktop 产品名，品牌标识不得改成临时字母占位。

### 3.1.1 已验收首切片基线

本 Change 的前置不是产品经理推断，而是以下仓库内正式记录：

- `openspec/changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/acceptance.md`：记录用户于 2026-09-27 明确 Product Acceptance PASS、工程接受、证据归属与交付边界；
- 同目录 `verification.md`：记录 `本 Change 产品验收通过` 的原始任务决定、Engineering Acceptance 与本机真实六阶段路径；
- 集成由 PR #43 及其后续交付修订完成，当前规划基线 commit 为 `9aff1f88a24fd29a6d843b3614d014ef50192be3`。

这些记录证明首切片适用于本 Change 的产品基线；它们不授权真实 Provider、下一 Change 工程执行或便携式发布。

### 3.2 不得把现有入口误认为已完成

- 快速模式现状仍是 Preview；
- 专业模式虽有三类模型辅助 UI、接口和 Adapter，但 Desktop Main 默认 `assistanceConfig` 为 `null`；
- Skill、Prompt、Fork、Subagent 尚未在产品中真实执行；
- 当前 Pi 使用进程内 `pi-coding-agent` SDK，不是 CLI/RPC 黑盒。

### 3.3 Runtime 方向

工程方向是把 `pi-agent-core + pi-ai` 放在 Pi Adapter 内承接本 Change 的多轮 Agent 能力。它不是第二个业务 Runtime，也不改变既有分层：

- Product Core、Application、业务 Ports、Profile 与公共合同不得暴露 Pi 类型、事件、工具或 session；
- Product Session、Case revision、Analysis Run、Assistance Attempt 与 Pi 内部 session 必须保持不同身份和生命周期；
- 迁移期间旧 `pi-coding-agent` 与直接的 `pi-agent-core + pi-ai` 可以同时存在于 Pi Adapter 内，但一次 Attempt 只能选择一条明确执行路径；
- 本 Change 不授权 runtime registry、fallback、热切换或通用 Runtime 接口；
- 产品验收依据是本计划的用户行为，而不是内部包替换完成。

具体包版本、Adapter 内拆分和私有会话实现由 Engineering Controller 在不改变上述边界的前提下决定。

## 4. 核心领域对象与身份

### 4.1 来源 Case

专业模式 Session 中的指定 Case revision 是业务事实来源。Case Assistant 每次任务必须绑定一个明确 revision，不能默认追随“最新”。

### 4.2 Case Assistant Session

快速模式中的独立产品会话，引用一个来源 Case。它保存用户可见对话、任务历史、授权摘要和草案历史，但不是来源 Case 的替代品，也不能转换为专业模式 Session。

同一来源 Case 可以有多个 Case Assistant Session；每个 Session 必须显示自己的来源和当前绑定 revision。

### 4.3 Assistance Attempt

一次用户明确发起的受约束 Agent 任务。每次 `开始` 或中断后的 `继续` 都创建新的 Attempt，并记录：

- 来源 Case 与 revision；
- 用户授权的 Provider / Model；
- 可用数据类别与只读工具；
- 轮次、时间和费用等硬上限；
- 实际模型请求摘要、工具调用回执、完成/停止/失败状态；
- 生成的草案版本或未生成原因。

中断的 Attempt 不恢复内部 Pi session；`继续` 使用已有产品历史和回执创建新 Attempt。

### 4.4 Pending Decision Draft

Agent 输出只能成为待采纳草案。草案允许用户编辑、拒绝或采纳；草案自身不是 Decision Record，不触发报告版本。

### 4.5 Adopted Decision Record 与 Expected Outcome

用户采纳后，Application 通过确定性业务命令把经用户确认的字段写入来源 Case，并创建新报告版本。Agent 不直接持有正式写权限。

## 5. 用户工作流

### 5.1 从专业模式进入

1. 来源必须是专业模式中一个 `Completed` revision，且具有已接受 Finding、有效 Decision Closure 和 final report。`Draft`、`Ready`、`Review`、`Needs attention` 或存在待复核 Finding 的 revision 均不可开始本 Change 的决策任务。
2. 用户在既有阶段 6 `Execution feedback / 执行反馈` 中选择 `用 Case Assistant 记录正式决定`。
3. Desktop 新建或打开一个快速模式 Case Assistant Session，并显式显示来源 Case、revision、证据数量和限制摘要。
4. 原专业模式 Session 保持不变；这不是模式转换。

用户也可以在快速模式通过现有 Session 搜索选择一个满足条件的来源 Case。未满足条件时界面必须逐项指出缺少的 Finding acceptance、Decision Closure、Completed 状态或 final report，并提供返回专业模式的入口；不能让工程自行判断“证据足够”。

来源 `Completed` revision 继续不可变。本 Change 的采纳不会重写它的 Finding、Decision Closure、完成状态或 final report 内容；正式决定以 Case 级、绑定该 revision 的追加版本保存。

### 5.2 授权并开始任务

首次任务开始前，用户查看一个任务级授权面板，其中必须显示：

- 来源 Case / revision；
- Provider / Model；
- 初始用户任务文本的逐字内容，并明确后续点击 `发送` 的文本也会逐字发给同一 Provider；
- 将发送的数据类别，以及获准 `020_clean` artifact / subset 的精确身份、字段和聚合范围；
- 新 Attempt 将实际携带的历史消息、规范化工具回执和报告摘要清单；
- 可调用的只读工具；
- 明确的轮次、时间和费用硬上限；
- 禁止能力；
- 内置 Skill 与 Prompt 版本。

用户确认后才可开始。以下任一变化必须重新确认：来源 revision、Provider / Model、数据类别、工具范围或上限扩大。预算缩小、纯 UI 变化和同一 Attempt 内的工具选择不要求重复确认。

产品计划不冻结具体数值上限；真实调用前 Profile 必须提供并在 UI 显示确切数值。缺少任何必需上限或 Provider 授权时，任务必须 fail closed。

自由文本与历史的外发规则为：

- 初始任务文本逐字展示，并要求用户单独确认其可能包含敏感业务内容；
- 授权后的每次 `发送` 都是该条可见文本的明确外发动作，Composer 持续显示 Provider / Model；不自动附加剪贴板、附件、路径、日志或其他文本；
- 产品历史默认只在本地可见，不因“继续”自动全部重发；每个新 Attempt 的授权面板必须列出将重发的具体消息、回执摘要和报告摘要；
- 旧 revision 的 Evidence、Finding、工具结果、报告内容和模型文本不得带入重新绑定的新 revision；只有用户自己写下的选择约束可在逐项显示并再次确认后带入；
- 报告历史默认只发送获准的当前报告版本摘要，其他版本须逐个选择；
- 实际 payload 以可审计记录保存，不能用“数据类别已授权”替代实际内容记录。

### 5.3 多轮协作

Agent 可以在一个 Attempt 的预算内：

- 询问用户的选择、约束、责任人、观察窗口或接受条件；
- 读取已授权的 Case 业务投影、已验证 Evidence / Finding、分析限制、来源 Decision Closure 中已保存的候选、批准的 `020_clean` 精确子集摘要和获准报告摘要；
- 检查 Decision Record 与 Expected Outcome 的必填语义是否完整；
- 解释所引用证据及不确定性；
- 形成一个待采纳草案。

确定性执行保留给 Application：revision 读取与校验、权限检查、完整性校验、草案结构校验、正式写入、报告版本创建、历史记录与导出。

Agent 不得访问原始上传文件、任意本地文件、Shell、任意 SQL、互联网、外部系统写接口或行动执行接口。

Agent 可以建议三类 Decision Record，但不能创建新的第一 Change DecisionCandidate：

- `选择候选`：必须引用来源 Decision Closure 已保存的一个候选；
- `不行动`：记录当前明确不采取候选行动及理由；
- `暂缓`：记录推迟条件、重新评估触发点和责任人。

### 5.4 草案审阅与采纳

草案至少包含：

**Decision Record**

- 选择：执行某候选、明确不行动或暂缓；
- 决策理由；
- 责任人；
- 确认时间；
- 采用的 Evidence / Finding；
- 已比较的替代项；
- 限制与仍未知事项。

**Expected Outcome**

- 基线及其来源；
- 观察对象与指标；
- 预期方向、范围或明确不确定性；
- 观察窗口；
- guardrails；
- 计划中的未来结果来源及其 Owner；
- 后续评估安排与责任人。

当选择“不行动”或“暂缓”时，Expected Outcome 可以标记为不适用，但必须记录原因、重新评估触发条件和责任人。

用户可以进入字段编辑、查看证据来源、取消未确认编辑、拒绝草案或点击 `采纳到 Case`。取消或关闭编辑只丢弃未确认编辑，不生成正式决定、不改变先前草案。采纳前系统必须再次验证来源 revision 仍是该 Case 当前可采纳的 `Completed` 分析 revision、没有更新的当前 Decision Record、字段完整且授权仍有效。

采纳后的精确效果是：

- 来源分析 revision 保持 `Completed` 且字节/历史不被重写；
- 在该 Case 的决策历史追加一版正式 Decision Record 与 Expected Outcome；
- 创建包含原 final report 引用和新正式决定的报告新版本，旧 final report 保留为 superseded history；
- Case 的“当前正式决定”指向新版本，但分析完成与行动/结果状态不因此改变。

同一 Case / source revision 只有一条当前正式 Decision Record 版本链。多个 Case Assistant Session 可以并行保留草案；一个草案采纳后，其他基于旧“当前决定”的草案全部变为过期。用户后续改选或调整预期时必须从当前正式记录创建新 draft revision；确认后追加新的 Decision Record / Expected Outcome / 报告版本，旧版本保持可读。取消未确认修订不产生新版本。实际结果一旦进入后续 Change，旧 Expected Outcome 不得倒写。

### 5.5 专业模式中的 Agent 参与

现有三类一次模型辅助继续采用逐次精确披露与一次调用：

- 阶段 1 `New analysis` 或确认计划：`帮我整理问题`；
- 阶段 4 `Evidence-based analysis` 的 Review：`帮我解释证据`；
- Finding acceptance 后的候选准备：`帮我起草候选`（在既有阶段 5 / 6 工作流中出现）。

这三项的允许草案、精确 payload、二次自由文本确认、失败回到手动路径及禁止改变固定方法/判断等规则完全沿用 UI Contract v1.0 §7 和 Session / Runtime Boundary；本 Change 不把它们改成“分析框架建议”或新的自动能力。它们不共享 Case Assistant 的任务级授权。阶段 6 `Execution feedback` 的 Case Assistant 入口承担本 Change 的多轮协作；采纳结果回流后，专业模式在不改写六阶段名称和原 Decision Closure 的前提下显示正式 Decision Record、Expected Outcome 和报告版本。

### 5.6 Case 准入、采纳与修订矩阵

| Case / Decision 状况 | Case Assistant 行为 | 可否采纳 | 确定性结果 |
| --- | --- | --- | --- |
| Draft / Ready / Needs attention | 显示缺失的分析前置条件 | 否 | 返回对应专业阶段 |
| Review，Finding 未接受或无有效 Decision Closure | 可查看入口和缺失项，不创建模型 Attempt | 否 | 先完成既有人工判断与 Closure |
| Completed，有 final report，尚无正式 Decision Record | 可创建绑定该 revision 的 Session / Attempt | 是 | 追加 DR-v1 / EO-v1 / 报告新版本；来源 revision 仍 Completed |
| Completed，已有当前正式 Decision Record | 默认打开当前记录与历史；新任务是“修订决定” | 是 | 确认后追加下一版本，不覆盖旧记录 |
| 多个 Session 对同一当前记录有草案 | 均可审阅；先采纳者胜出 | 仅第一个仍基于当前版本的草案 | 其他草案变过期，必须新 Attempt 重基 |
| Case 出现新的分析 revision | 旧 Session / 草案保持可读并标记来源过期 | 否 | 选择新 Completed revision，重新授权并创建新 Attempt |
| 未确认编辑被取消、关闭或崩溃 | 丢弃该次未保存字段编辑，保留上一个草案/正式版本 | 否 | 不追加 Decision/Outcome/报告版本 |
| 后续已有 Future Actual | 原 Expected Outcome 只读 | 只能创建新修订解释，不能倒写原预期 | 历史显示原预期与新解释的时间顺序 |

`Completed` 在本表中仍表示第一 Change 的分析案例完成，不表示行动已执行或结果已观察。

## 6. 用户可见运行行为

### 6.1 对话与历史

- 每条消息显示发送者、时间、所属 Attempt 和状态；
- 工具调用显示业务名称、读取对象、来源 revision、结果摘要和状态，不暴露 Pi 内部事件；
- 用户可展开查看实际发送的数据类别与可审计 payload 记录；敏感内容继续服从既有数据边界；
- 历史按产品 Session 持久化，并与正式 Case 记录分区显示；
- Agent 文本必须标为建议或草案，不能使用“已决定”“已写入”等误导状态。

### 6.2 停止、失败与继续

- `停止` 立即阻止后续模型轮次和新工具调用；已开始的不可取消读操作可完成回执，但不得产生正式写入；
- 等待用户回答时不消耗“模型执行时间”或费用预算，模型轮次上限不变；独立的等待截止时间继续流逝，其确切值必须在授权面板显示，缺少该值不得开始；
- 等待状态仍可点击 `停止`；用户回答后同一 Attempt 继续，前提是来源、授权和等待截止时间仍有效；
- 用户关闭当前 Product Session、退出应用或等待截止时间到达时，Attempt 终结为 `已中断` 或 `等待超时`，不得在重启后继续同一 Pi session；
- 停止、执行超时、等待超时、预算耗尽、Provider 错误或应用关闭均把 Attempt 终结为对应状态；
- 已完整生成且通过结构校验的草案可以保留为“中断前草案”，但仍只能由用户审阅采纳；
- `继续` 逐项展示将重新发给 Provider 的产品消息、回执摘要、报告摘要和用户约束，并创建新 Attempt；未列出的本地历史不会外发；
- 来源 revision 变化时，现有草案标记过期，采纳按钮禁用。用户查看变化后可创建绑定新 revision 的 Session / Attempt；旧 revision 的 Evidence、Finding、报告与工具结果不会继承。

### 6.3 Fork 与 Subagent

本 Change 中 Fork 和 Subagent 均保持 Preview：

- 不创建分支会话；
- 不启动子代理；
- 不伪造执行结果；
- 点击仅展示能力说明、未启用原因和返回入口。

未来启用顺序仍为 Fork 先于 Subagent；它们需要各自的新产品 Change、UI Gate 和工程合同。

### 6.4 Skill、Prompt 与报告

- 只启用一个内置、版本化 Skill：`Case 决策与预期 v1.0`；
- 用户可查看 Skill 目的、输入边界、输出结构、Prompt 版本和变更说明；
- 本 Change 不提供 Prompt 编辑、导入、市场或自定义 Skill；
- Agent 可生成待采纳的报告增量预览；只有采纳正式记录后才创建报告新版本。

## 7. 数据、权限与安全边界

### 7.1 可读取

- 当前授权 Case 的业务投影和明确 revision；
- 已验证 Evidence、已采纳 Finding、限制、候选行动；
- 授权面板列明精确 artifact、字段及聚合范围的 `020_clean` 子集摘要，而非原始数据；
- 用户明确选择的报告版本摘要；默认只有当前 final report 摘要；
- 当前 Case Assistant Session 中被新 Attempt 授权逐项选中的产品消息与规范化工具回执。

### 7.2 禁止

- 原始上传数据或未确认快照；
- 任意文件系统、Shell、通用 SQL、浏览器或 Web 搜索；
- 其他 Case、其他 Session 或未授权 revision；
- 外部业务系统写入、消息发送、行动执行；
- Agent 直接采纳 Evidence、Finding、Decision Record 或 Expected Outcome；
- 把记忆、对话或 Pi transcript 当作权威业务事实。

### 7.3 真实模型授权

本计划和 UI Contract 不授权任何真实 Provider 调用。工程验收所需的离线证据与未来真实模型产品验收必须分开标注。真实路径仅可在用户另行批准 Provider、Model、数据类别、预算及专用验证命令后执行。

## 8. 状态与失败语义

| 状态 | 用户可见行为 | 正式业务副作用 |
| --- | --- | --- |
| 未授权 | 显示任务授权与缺失项，不能开始 | 无 |
| 运行中 | 流式对话、工具回执、预算剩余、停止 | 无 |
| 等待用户 | 模型执行时间/费用暂停，等待截止时间继续；可回答或停止 | 无 |
| 等待超时/应用关闭 | Attempt 终结为等待超时/已中断；只能新 Attempt 继续 | 无 |
| 已停止 | 显示停止点、已完成回执、继续入口 | 无 |
| 失败/超时/预算耗尽 | 显示原因和可重试范围 | 无 |
| 草案待审 | 显示结构化草案、来源和编辑/拒绝/采纳 | 无 |
| 草案过期 | revision 差异提示，采纳禁用 | 无 |
| 已拒绝 | 保存拒绝历史，可创建新 Attempt | 无 |
| 采纳中 | 确定性校验；重复提交必须幂等 | 仅成功时一次写入 |
| 已采纳 | 正式记录和新报告版本可见 | 追加 Decision Record + Expected Outcome + 报告版本 |

应用崩溃或重启后，任何 `运行中` Attempt 进入 `已中断`，不得声称继续同一模型会话。已采纳结果必须从正式 Case 状态重建，而不是从对话重放。

## 9. 产品验收标准

### AC-01 来源绑定

只有 §5.6 允许的 Completed revision 能进入。快速模式显示正确 Case、revision、证据/限制摘要；专业 Session 未被转换，来源 revision 和原 final report 未被覆盖。

### AC-02 任务级授权

首次真实任务前，用户能看到并确认 Provider / Model、初始自由文本逐字内容、精确 `020_clean` 子集、将外发的历史项、只读工具、执行/等待硬上限、Skill / Prompt 版本。任一必需项缺失或范围扩大未重确认时，Attempt 不得开始；后续每次 `发送` 只发送用户可见的该条文本。

### AC-03 受约束多轮

Agent 能进行至少一次用户追问、一次经授权只读业务工具调用和一次结构化草案提交；不能调用禁止工具或读取范围外内容。

### AC-04 人工控制

数据确认、Evidence / Finding 采纳、Decision Record 采纳与报告版本创建均需要既有或本 Change 明确的用户动作。Agent 完成不等于业务写入。

### AC-05 草案完整性

选择已有候选、不行动和暂缓三种选择都能形成语义完整、来源可追踪的 Decision Record；Expected Outcome 包含计划结果来源与 Owner，或带理由的不适用记录满足 §5.4。

### AC-06 停止与继续

用户停止后不再发生新模型轮次或新工具调用；等待用户时执行预算暂停但等待截止时间继续。停止/退出/重启后的 Attempt 保留历史；继续创建新 Attempt，并逐项显示将外发的复用上下文和新授权。

### AC-07 revision 冲突

来源 revision 变化会使草案过期并禁止采纳；重新绑定前不能用旧草案覆盖新 Case。

### AC-08 采纳与报告

采纳成功只追加一次正式 Decision Record、Expected Outcome 和新报告版本；来源 Completed revision 与旧报告字节不变，旧报告成为可读 superseded history；重复提交不产生重复记录。

### AC-09 历史与权威

重启后可以回看产品对话和规范化工具回执；正式业务状态从 Case 记录恢复，不依赖 Pi session 或 transcript。

### AC-10 Preview 诚实性

Fork、Subagent、Prompt 编辑、自定义 Skill、Web 和行动执行都不可实际运行；界面明确标为 Preview 或未启用。

### AC-11 专业模式回流

采纳结果在原专业 Case 阶段 6 可见，并显示来源、采纳人、时间和报告版本；三类一次辅助继续维持逐次披露边界。

### AC-12 可访问与可理解

关键授权、停止、过期、拒绝和采纳路径支持键盘与清晰焦点；状态不只依靠颜色表达；非技术用户可以从界面区分“建议/草案/正式记录”。

### AC-13 编辑、改选与历史

用户可实际编辑所有正式字段、取消未确认编辑、从当前正式记录创建修订，并在重开后读取每一版依据、预期和报告。一个 Session 采纳后，其他旧基线草案过期；实际结果到达后不能倒写原 Expected Outcome。

## 10. 高风险负面验收

必须验证以下拒绝路径零正式业务副作用：

1. 未授权 Provider 或缺少资源上限；
2. Agent 请求越界数据或禁止工具；
3. 用户停止、应用退出、超时、预算耗尽；
4. Provider 返回畸形内容、工具参数非法或草案结构不完整；
5. 来源 revision 在生成后或采纳前变化；
6. 用户拒绝草案；
7. 采纳命令重复提交或中途失败；
8. 重启后错误地把中断 Attempt 标记为完成；
9. 把对话文本、工具摘要或 Pi transcript 当作正式记录；
10. Fork / Subagent Preview 入口误启动执行。

## 11. Change 范围

### 11.1 必须交付

- 来源 Case 绑定的快速模式 Case Assistant；
- 任务级授权与严格预算；
- 有限多轮对话、规范化只读工具回执、停止与新 Attempt 继续；
- Pending Decision Draft；
- 用户编辑/拒绝/采纳；
- Decision Record + Expected Outcome 正式写入与新报告版本；
- 专业模式入口与回流；
- 一个内置版本化 Skill 与只读 Prompt 信息；
- 产品历史、失败语义及可审计边界。

### 11.2 条件范围

- 真实 Provider / Model 路径：只有用户另行批准数据与费用边界后才可执行；
- Pi Adapter 内部迁移与旧 SDK 并存：仅为实现本计划且不得暴露为产品能力；
- 既有三类一次辅助的真实启用：仅在同一批准 Provider / 数据边界内，且不得扩大为多轮自主任务。

### 11.3 明确排除

- 通用空白 Quick 助手；
- Fork、Subagent；
- Prompt 编辑与 Skill 管理平台；
- Web 研究、Shell、通用 SQL、任意文件访问；
- 自动 Evidence / Finding / Decision 采纳；
- 行动执行与外部系统写入；
- outcome follow-up 与跨 Case 自动学习；
- Runtime registry、fallback、热切换或通用 Agent 平台重构；
- 企业身份、租户、远程隔离或生产部署扩展。

## 12. 模块责任与工程可决定项

### 12.1 产品已冻结的责任边界

- Product Core：Decision Record、Expected Outcome、草案/正式状态和 revision 约束；
- Application：授权校验、Attempt 编排、确定性校验、采纳命令和报告版本；
- Business Ports：以 Case Assistant 业务语义表达读取、模型协作和审计需求；
- Pi Adapter：Pi 类型、事件、session、tool schema、provider/model 调用和错误映射；
- Profile / composition root：选择 Adapter、Provider / Model 与硬上限；
- Desktop：用户可见授权、对话、工具回执、停止/继续、草案审阅与回流。

### 12.2 正确延后给工程的事项

- 私有接口和 TypeScript 名称；
- Pi Adapter 内部采用直接 core/ai 的精确组合与迁移步骤；
- 持久化表、序列化格式和索引；
- 不改变用户语义的流式事件节流、重试和性能参数；
- 经用户授权后 Profile 中确切的 Provider、Model 和数值上限；
- 适用的离线测试夹具、mock/fake 与证据目录。

以上事项不得改变 §4–§11 的身份、权限、失败、采纳或验收语义。

## 13. Gate 与停止线

1. 本计划、增量 UI Contract 和可点击 UI Contract 完成；
2. 新鲜只读 Product Plan Development-Readiness Reviewer 返回 PASS；
3. 用户对增量 UI Contract 执行 UI Gate 并明确 PASS，或提出修改；
4. Product Manager 记录 Product Input Freeze；
5. 仅在用户明确指令后，Mac mini Engineering Controller 执行 Engineering Intake；
6. 此后才可创建 OpenSpec、工程设计、RED 测试或生产代码。

当前产品停止线：第 4 步已记录；Mac mini 必须读取已发布的固定 Git 版本，收到用户明确的推进指令并完成 Engineering Intake，才能开始第 6 步。任何 PASS 都不自动跨越下一步。
