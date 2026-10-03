# P1 来源、产品基线与采用说明 v0.1

2026-10-01 · `USER_REVIEW_PROPOSAL_NOT_FROZEN` · MacBook 产品规划附件。

本文供[阶段产品计划](xanthil-ai-led-analysis-stage-product-plan-v0.1.md)和[验收与能力覆盖](xanthil-ai-led-analysis-acceptance-and-coverage-v0.1.md)共同使用。它说明本轮据什么提出方案、复用到哪里、哪些事实仍未知；不建立工程状态或新的执行权限。

本节版本绑定完成后，用户已批准当前产品／UI并授权提交、推送、转发给Mini `change-004`，见[批准及交接记录](xanthil-ai-led-analysis-approval-and-handoff-v0.1.md)。下文“待用户审核／不发布”等保持其此前观察时点，当前批准效力以该记录为准；资源／体验／外部权限等余项与原审查身份不因此清除。

## 1. 来源身份与效力

<a id="11-本轮有效规划依据blueprint-v41"></a>

### 1.1 本轮有效规划依据：Blueprint v4.1

依据用户本次正式发布通知，本P1包采用**已发布Blueprint v4.1**作为当前规划依据。只读核对GitHub [PR55](https://github.com/gadfly-hbo/JuanerAI/pull/55)返回`MERGED`，合并提交与下列身份一致；固定对象已在本地，无fetch、pull、切分支或覆盖工作树。发布记录只证明该固定版本发布，不推断此刻main HEAD、Mini工程接收或本P1产品／UI接受。

| 固定发布项 | 精确身份／效力 |
| --- | --- |
| 发布提交／tree | `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79` / `74e042fa0680a22ba29fd68e87f67f8ca6428301` |
| [Blueprint v4.1](juanerai-product-development-blueprint-v4.1.md) | `docs/planning/2026-10-01/juanerai-product-development-blueprint-v4.1.md`；53578 bytes；SHA-256 `38639d60b0234c5c5922eb9fdc0c5220e47019374940240ab1915f22b4168052` |
| [批准／规则整合记录](blueprint-v4.1-approval-and-rule-integration.md) | 固定提交同路径；SHA-256 `a6099bba31b1f125ebea2f7e8c431f89a4e2933c61e4ea459e53cbcdac875c3b`；保留本地固化、后续Git授权与实际发布不同时间点 |
| [v4.1规划就绪Review001](reviews/blueprint-v4.1-development-readiness-review-001.md) | 固定提交同路径；SHA-256 `56c96a245cc1787a8ee6fad9a2af3cd05b5ce8190cb58e849d2e377588bb4ace`；PASS仅限蓝图规划与P1准备指引，不代签本包、UI或工程 |

已完整读回以上三个固定文件和PR55的全部适用规则增量：AGENTS、CONTEXT、规划入口、产品brief及覆盖register／latest／evidence。增量是v4.1指针、阶段路线及规划映射；唯一执行政策、40项原能力正文与工程接受状态不变。本工作分支的tracked规则仍是原基点副本，不在此次同步；本包以本节明确适用的新依据与既有执行政策继续准备。

三份发布附件逐字从固定Git对象复制，旧v4.0正文、建议、来源记录、PR54观察及审查原文保留。发布附件中的旧权限／时态是其历史快照，实际发布身份以本节核对与用户通知为准，不回写源正文。历史上下文链接可在固定Git提交读取，不作为当前P1行为合同必读附件，也不靠其他工作树或旧聊天补猜。蓝图批准记录和本chat的原技术评审附件各保留自己的字节身份，不互相替换。

**差异结论：无实质差异，仅更新版本绑定。** 路线／技术补充已经在当前候选吸收：

| v4.1要求 | 本P1既有对应位置 |
| --- | --- |
| §5.1／§6.2体验＋可复用核心、最低数据／语义同期接通 | 阶段计划§0、§2、P1-R01；Change组织§1、§3第2～4项；验收§1及CAP-01～03 |
| §9.2计划真正决定分支／参数、M1-only两路径不执行M2、拒绝与同计划回链 | 阶段计划P1-R01；验收CAP-02／03及SC-02／04／10／12 |
| §9.4后台复用有效任务授权、Attempt不同于grant、累计预算不清零 | 集中决定§3.3；阶段计划P1-R02、§4；UI-P1-09／10；验收CAP-05／09 |
| §6.2／§9.4 A预顾B整体人工审阅与提交，不前置全B、不增前台审批 | Change组织§3第2项及末段；阶段计划§4末；集中决定§4；验收CAP-07、§6 |
| §9.4全空阻断、单期零分母不足、Expected护栏与历史可读 | 阶段计划§2、P1-R03；UI合同§3.2；验收SC-05／11、CAP-07；集中决定§4 |
| §5.1／§6.3～6.4来源足够即回访→受审核改进→下一Case显式采用；试用仅条件性讨论 | 阶段计划§5～6；Change组织§3末；验收§6；集中决定F4；均非P1新增交付／权限 |
| §4.1／§10保留40ID，区分规划／实现／集成／验收，同一候选SC／CAP／UX，先基线再目标 | 验收§1、§4～6及全量40项表；Change组织§5；集中决定F2／F3 |
| 既有Xanthil／PX004、006及中文优先UI | UI合同§1～3；可点击附件保持原字节，不重画或改行为 |

本次仅更新八份当前提案正文的依据／历史时点说明，附上述固定发布材料；未修改规范性行为、40项条目、可点击UI、accepted specs、tracked治理文件或工程状态。保留[本包Review003](reviews/xanthil-ai-led-analysis-development-readiness-review-003.md)对Candidate003及其已读回非实质修订的规划PASS与原身份；纯版本绑定不重跑整套Gate。此前Review001的NEEDS_CLARIFICATION与其他固定候选结论继续有效于各自范围。

剩余集中决定仍是决定包§8的F1～F4：模型材料／小群体／屏蔽边界，实际资源上限，体验观察范围与基线后事前目标，以及所需真实数据／Provider／部署／试用权限；本P1行为建议和新UI仍待用户审核。没有新产品取舍或额外方向审批。后续正式包明确携带本节commit／tree／SHA及批准／审查身份，由Mini在Engineering Intake核对采用、WIP与停止边界；本轮不唤醒已完成003、不发送消息、不冻结或开工、不发布Git。

### 1.2 原始v4.0输入及此前观察（历史时点，保留）

用户已确认以下两份文件作为本轮阶段设计的方向输入；源文件自己的草案标签、文字和历史链接原样保留。单凭该确认不能推断发布／采纳。本轮开场后另一路PR54已发布并更新GitHub规则指针，见[只读补记](xanthil-ai-led-analysis-pr54-readonly-observation-v0.1.md)；不据此推断Mini工程接收、新UI或本期工程获批。

| 本地源副本 | SHA-256 | 本轮用途 |
| --- | --- | --- |
| [Blueprint v4.0 draft.2](juanerai-product-development-blueprint-v4.0.md) | `38d2a760b7014a425f36c74f35aebf04fa20dd8064a9a358f2ad8ba57b93b162` | 人机与前后台分工、有限阶段完整设计、六＋二全景、三类验收方向 |
| [阶段建设与下一纵切建议 v0.1](xanthil-ai-led-analysis-next-slice-proposal-v0.1.md) | `c141a365518bd3b35c085cf2033f1f79a531e4b06c50f68f90b595dee485a98d` | P1 会员分析任务族、G1／G2／G3 组合、拟议合同变化与排除范围 |

两份副本的身份已核对。源工作树 `/Users/huangbo/.codex/worktrees/caaa/JuanerAI` 保持只读；分支 `work/macbook/core-task-experience-review`，HEAD `2bb18d7356289781a87a672dc3f7b9bd40341d87`，tree `4fc456d4e7142075d7dbef300eab51feea97a111`；读取时仅 `docs/planning/2026-10-01/` 为未跟踪新增目录。这些是读取时的记录，不声称持续反映源工作树。

源副本中的现状索引、旧讨论、low-fi、research 定位和历史相对链接只用于理解来源沿革，**不纳入新 UI Contract 的必读附件，也不承担补足本方案业务语义的职责**。本轮正式提案以阶段计划及其列出的新附件为可独立阅读的包。旧 low-fi／简化人工流程方案未获采用，不能成为新主路径的隐含约束。

[独立规划就绪 Review 002](reviews/blueprint-v4.0-stage-development-readiness-review-002.md) 的 PASS 只评价上述固定源文件在“蓝图与阶段选择建议”层面的完整性；它没有评价本轮新产品计划和 UI，不是新产品输入就绪、工程可行性或用户产品验收。该历史结论与其限制一并保留。

本轮产品包的历史 [Review001](reviews/xanthil-ai-led-analysis-development-readiness-review-001.md) 为 `NEEDS_CLARIFICATION`；[Review002](reviews/xanthil-ai-led-analysis-development-readiness-review-002.md) 的 `PASS` 只绑定 [Candidate002](reviews/xanthil-ai-led-analysis-review-candidate-002.md)。本轮吸纳用户意见后的修订须另形成固定候选并接受新鲜独立复审，历史结论不改写、不外推。

用户已在当前 chat 提供 [静态架构评估001原文](reviews/xanthil-ai-led-analysis-static-architecture-assessment-001.txt)，完整附件为 **16053 bytes**，SHA-256 `d69abcf5a2daffe0c224ecbc380f4c21f937533e61d4cc52cba6867ede41652e`。对象是 [Candidate001](reviews/xanthil-ai-led-analysis-review-candidate-001.md)，结论支持 P1 方向与 A→B 的静态可行性。原文是该固定对象的意见与证据记录；其中建议由本轮产品包明确吸纳，不能自动成为执行指令或已批准合同。它未验证本轮修订、运行效果、具体合同、披露边界、资源阈值或 UX，也未取得 Mini 实时状态；不是本轮 Gate PASS 或工程开工许可。

本分支的 [AGENTS](../../../AGENTS.md)、[规划入口](../README.md)仍为PR53基点的v3指针；最新GitHub的同名入口已经指向批准v4，具体差异及批准记录见只读补记。本轮完整读过v4并依照其阶段组织方向，保留[唯一执行政策](../../governance/product-change-execution-policy.md)；不自动同步规则文件，也不静默替换canonical specs或既有批准。

## 2. 工作与工程基线

| 对象 | 已核对或收到的证据 | 可据此判断／不能据此判断 |
| --- | --- | --- |
| 当前规划设备 | `huangbodeMacBook-Pro.local`；工作树 `/Users/huangbo/.codex/worktrees/e1d5/JuanerAI` | 本轮产品文档与 UI 的工作位置；不是工程接收端 |
| 产品业务代码基线 | `2bb18d7356289781a87a672dc3f7b9bd40341d87`；tree `4fc456d4e7142075d7dbef300eab51feea97a111` | 001～003 已集成业务代码／规范的固定观察基线；不外推 Mini 当前未发布内容 |
| 规划分支基点 | `work/macbook/ai-led-member-analysis-product-plan`；HEAD `3a5e9185d688b6274c88c03b7639b49dea930d67`；tree `46599fd131802fe39b1b65ecf48f2f29881790ef` | 标准 `start-work` 的 fetch 纳入 PR53 的 15 个覆盖规则／文档变更，业务代码未变；此 Git 动作已披露，本文不再触发同步 |
| GitHub 最新观察 | 开场PR53为3a5e918；后续只读main为 `c149998c349043347499d698012a96b4baf84530`（PR54） | v4正文及规则入口已发布；一次观察非持续在线证明，本輪新包仍未发布 |
| 本地 project-control | 同步副本记录 Change003 `ARCHIVE / complete` | 表示最近同步的完成记录；不是 Mini 实时 WIP 权威 |
| Mini 当前状态 | 本轮只读 SSH `myhost` 到 `100.106.28.2:22` 连接超时；没有取得实时回报 | 实际 Change、分支、未提交工作、停止点均 `UNKNOWN`；不能推断 WIP 空闲，也不能据此接管或重排 |
| 架构评估收到 | 用户已在当前 chat 提供静态架构评估001完整原文，身份见上 | 已取得 Candidate001 静态可行性意见；本轮修订和具体合同仍待适用检查，运行／披露／资源／UX 未验证 |
| 跨 chat 接收 | 本轮未向其他 chat 发消息；原评估由用户带入当前 chat | 不据收到原文推定 Mini 采纳、接收或开工；发布与工程接收另需证据 |

后续工程接收须由 Mini 在原任务核对真实分支、WIP、未提交工作和停止条件；如与本期建议冲突，保留既有工作并把具体影响交用户。连接失败不改变任何任务的授权和历史。

## 3. 已接受成果、当前缺口与本期复用

此处归纳固定基线与[累计登记](../capability-coverage/register.md)；未重跑原验收，不把历史接受变成本轮新测试结果。

| 资产／路径 | 已有且须保留 | 本期要补的真实消费者与缺口 |
| --- | --- | --- |
| [001 Desktop 规范](../../../openspec/specs/xanthil-desktop-decision-case/spec.md) | 双 CSV 资格／快照、固定复购意义、DuckDB 主算、Python 独立复算、有限 Finding、候选／不足、Closure、报告与修订 | 从新任务复用这些 Application 能力；可复用场景配置、有限计划实际约束方法／参数、新任务连续推进尚待建设和验收 |
| [002 Assistant 规范](../../../openspec/specs/case-assistant/spec.md) | 合格 Completed Case 的有界只读助手、Provider 配置／授权、正式 Decision／Expected、原子发布与报告追加、历史 | 新入口可在 Draft／Ready／Review 工作，但旧助手资格不降低；新增业务工具、任务授权、待审材料与连续最终审阅是需明确批准的新合同 |
| [003 协作规范](../../../openspec/specs/case-collaboration/spec.md) | 单层、用户启动、独立授权、顺序 Fork／Subagent、精确回流、人工 MODEL 采纳、停止／恢复 | 保留原资格及工具边界；新任务未完成有效人审／Closure／final 来源前不提前开放；不新增自主派发、并发、递归或授权继承 |
| 固定 IR 与执行 | IR 已生成、保存和校验；现行 Contract／Binding 参数确实进入计算与复算 | 现有执行由固定 Application 流程组织；本期须证明受支持计划的方法、参数、依赖实际改变调用及结果；即使源有合法组字段，M1-only 也不执行 M2；主算／独立复算及报告可回链同一实际计划，不以展示差异代替消费 |
| 报告与人的判断 | 既有 Markdown／HTML、导出、版本及正式决定来源保留 | 本次 Evidence 真正进入待审报告；点评被分类且触发适用新版本／重算；清楚的人审动作保存整体可核实的正式效果 |
| Runtime／架构 | 复用 Pi Adapter、业务 Ports、Personal Profile、SQLite 与 DuckDB 分责；旧 CLI／Core／Pack 资产保留 | 新任务工具只接批准 Application 能力；不以 AI 主导为由引入第二 Runtime、任意 SQL／Shell／Web 或新企业平台 |

原始源码核对与测试文件阅读来自源建议 §2.2 的固定基线。它支持“固定方法执行真实存在、可变计划消费仍有缺口”的判断；本轮没有执行其测试，也没有据此宣布新运行器已实现。更广能力以累计登记的范围为准；`待核验` 表示证据不足，不等于资产不存在。

静态架构意见与用户本轮明确意见的采用范围：

- 计划在准入、执行、发布三处由后台检查；真实方法／参数、独立验证及结果来源共同决定是否通过，不能只信自报计划 ID 或哈希。
- 新任务后台先核验现有 grant；来源、范围、期限及剩余预算仍有效时沿用，必要时重新授权。失败不自动重试或换 Provider；新 Attempt 本身不等于每次重新审批，累计消耗与在途预留须持久保存。停止、关闭、App 重开、过期及实质范围变化仍封闭新准入；恢复保留显式继续及授权核对，已封闭 grant 不能自行复活。
- 最终人审整体正式生效需要精确待审／幂等身份及提交边界。A 确定任务、结果和存储合同时先考虑 B 的这些要求，不前置完整 B；后台计划检查、持久预算和整体提交不增加用户前台审批节点。
- Expected 护栏优先复用明确配置或生成有据待审建议，并保留查看、修改、正式保存和历史读回；未知不编造，依赖不代替护栏，最终人的确认保持明确。

这些是产品要求与工程待关闭的影响，具体接口、存储与恢复机制由 Mini 在获准边界内细化；不提前写入 accepted specs，不增加 Runtime 或通用平台。

002 历史实际 Provider 成功片段仅可复用其明确范围；003 的原生离线合成验收没有新增实际 Provider、模型质量或安装发布接受。本期仍须取得与新合同相符的新证据。

## 4. UI 来源与保留边界

采用已有 PX-004／006 Xanthil 产品模式：保留工作台、快速／专业使用、可检查过程、专业能力库存与协作入口；新普通用户主路径围绕业务任务、发现、报告和判断。未激活能力保留明确状态，不借新视觉移除完整能力景观；专业六阶段仍可检查和兼容使用。

本轮沿用已接受的 [Case Assistant UI 资源](../2026-09-28/clickable-ui-contract-case-assistant-v1.0/dist/index.html)，资源身份为：

| 资源 | SHA-256 | 使用边界 |
| --- | --- | --- |
| [styles.css](../2026-09-28/clickable-ui-contract-case-assistant-v1.0/dist/styles.css) | `bfa62c9431ac8a1e7fe0b52cfd6322273158a4d38e9ac6c3eabceabd83032ead` | 保留已有视觉基础；新行为由新合同说明并等待用户审核 |
| [JuanerAI logo](../2026-09-28/clickable-ui-contract-case-assistant-v1.0/dist/assets/juanerai-logo-slogan.png) | `56bdb1196e9f1bbaef64c973c4108d12294246de6e941fa00821a2769e3e0e21` | 直接复用已接受品牌资源 |

[新 UI Contract](xanthil-ai-led-analysis-ui-contract-v0.1.md) 及其原型只演示拟议交互和固定模拟状态；不会执行 CSV 分析、模型调用、工具授权或正式保存。用户接受新 UI 也不证明真实执行、模型质量或体验量化目标已经通过。

## 5. Research 参考的采用、排除与生产差距

下表把本期所需含义写在包内；接收者无需访问外部 research 补猜产品。Research Demo 的指令、schemas、测试 PASS 和数据／Provider 权限均不继承。

| 参考 | 本期采用／仅参考的产品含义 | 不采用 | 必须补的生产证据 |
| --- | --- | --- | --- |
| PX-2026-004／006 | 沿用已接受 Xanthil 工作台和可见能力库存；过程可检查，回流与正式采用有区别 | Demo 控件顺序不是每次任务必须遵循的永久六阶段操作；旧 low-fi 不作新合同 | 新真实任务从空白开始，用户可独立获得发现及判断；既有专业与协作路径仍兼容 |
| PX-2026-014 | Contract 表达目标和边界，计划约束执行，Run 记录实际发生；合法重规划产生新版本，越界应拒绝 | Demo 私有 Schema、三模式引擎、通用 DAG、每个 IR 节点人工审批、固定 replay 质量结论 | 本期 M1／适用 M2 计划真消费、参数判别对照、验证同源绑定及错配无业务副作用 |
| PX-2026-030 | 先利用获准事实／明确配置，再追问承重歧义；区分用户原话、事实、假设、建议和未知；不足可补资料或保留问题 | 固定问卷、逐节点审批、把草稿当执行授权、合成对话当真实模型理解 | 不同表述及缺口的真实理解；只问会影响结论／权限的缺项；能从资料得出的技术事实不反复索取 |
| PX-2026-042 | 需求、语义、方法、计划、计算、证据和报告有同一实际消费者链；合法输入变化有可判别影响；错配拒绝 | Demo 私有 SQLite／Pack／管理查看器、生产框架照搬、合成局部链等于产品完成 | 在正常 Desktop 入口复用实际能力；证据回链和报告数字能独立检查；旧版本不变，拒绝后不回退隐藏固定答案 |

这里仅采用上述有限含义；未采用完整研究平台、全量语义／资产管理、通用 Pack 激活或多引擎。后续结果回访、正确 Owner 的改进版本、下一 Case 显式采用仍按蓝图返回；保存点评、重复运行和 MODEL 材料采纳不计为学习完成。

## 6. 本轮证据等级与待补项

| 内容 | 本轮结论 | 关闭条件 |
| --- | --- | --- |
| 文件身份、来源和既有范围 | 固定副本核对；本轮文档编写可引用 | 发布时另外绑定提交和完整包身份 |
| 新产品行为与交互 | 方案／UI 模拟；[Review003](reviews/xanthil-ai-led-analysis-development-readiness-review-003.md)为固定候选规划PASS，待用户审核 | 用户关闭集中产品决定并批准适用UI；沿用适用就绪结论，后续实质修订才依规则复审 |
| G1／G2／G3 实现和集成 | 未实施、未验收 | 获批输入与 Mini intake 后的真实链路证据及独立验证 |
| 体验／相对价值 | 首个验证发现耗时、人工负担、独立完成、真实理解均 `UNKNOWN` | 先测可比 Change003 基线，用户事前固定样本／阈值／资源边界，再运行获准候选评估 |
| 技术架构静态可行性 | 用户提供的 Candidate001 原评估支持 P1 与 A→B；原文字节及 SHA 已核对 | 对本轮修订处理适用影响；具体合同及运行证据待工程，新增披露／安全边界仍交用户；不外推为本轮就绪、资源或 UX 通过 |
| Mini WIP | 当前 WIP `UNKNOWN`；没有新的实时回报 | 原任务核对真实分支、WIP、未提交工作及停止点；收到静态评估不替代接收或复工授权 |
| 数据、模型、Git 和执行 | 本轮不授予这些新权限 | 按对应用户决定及现行执行政策分别取得权限与回执 |

本轮不运行产品测试、不调用实际 Provider、不读取真实业务数据、不启动服务或安装依赖。文档与 UI 检查只能证明交付包可读／原型可操作，不是场景、能力或体验实现验收。
