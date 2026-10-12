# Change005 — 浏览器 M1 多源完整路径：工程规格

## R1 当前有效增量（2026-10-07 用户批准）

以下只替代旧默认显示/方法强制行为，原业务、安全、兼容及其负例继续。依据 product-input-revision-v1.1.md RV-01～08 和 ui-contract-revision-v1.1.md UI-RV01～06；冻结批准记录见同目录 approval-and-freeze-r1.md。

### R1-UX01 对话优先、按需检查（RV-06/08、UI-RV01/02/04/05/06）
- 快速模式默认对话、答案/必要限制与简短真实状态；不把五时刻口径/方案/步骤/成果卡组插入对话。不删能力：口径、完整实际方案/步骤、证据/异议、影响和沿用均通过原抽屉/成果/更多可达。
- 当前实际冲突只就地呈现必要问题及影响；重大限制/有效部分/UNKNOWN不得因简化隐藏。默认已保存答案不重放全部工具过程；过程可查。完整专业六阶段不改。
- 默认操作为添加资料/更多/查看报告；Skill/Prompt/分支/子任务/显式同项目方案复用在更多。Stop仅当前运行/在途时显示，不承担收回回复。发送、被动读回、迟到/停止/刷新边界不变。
- 已选可选方法保留有真实作用及适用条件；不选方法/不存在完整任务模板不能阻断合法分析。用户手动选择与当前目标冲突时仅处理差异。

### R1-AG01 对焦与自主推进（RV-01～05/07）
业务/指标与 Agent 共同形成有来源任务级 Context/Binding；依赖项充分时自行推进，真歧义才问。复用有效业务定义材料，无库不虚构；自然语言由 LLM 理解，后台验证来源/权限/实际消费。
固定目标/口径/材料内的真实观察可新增检查/调整方法/生成受控 Python；每次对应实际 IR/代码及独立证据，不能只有聊天/固定会员模板。业务含义或范围改变形成 FM-X 新版本/失效/重算；方法内推进不逐步人审。生成代码退出0不是事实核验；越权、网络/安装/原件写入、凭据或未知物理状态阻断受影响动作。具体私有契约随下一纵切闭合后实施。

2026-10-04 · juaner_worker · **S/D1–D6/L 已由 [engineering-decisions.md](engineering-decisions.md) 有条件接受。** 本文继续细化受影响实现；条件与权限以该决定为准。最初提案及hash保存在Controller `contract-decision-001/received-spec.md`。

D2 worker健康检查的EPERM/exit78保持有效且不重试。Mini已实际核验普通host健康及十项固定探针PASS；仅支持其限定行为。最新追加决定已授权四项剩余隔离验证与产品executor实现，普通host由Mini审读执行；不是再请求用户许可。D2当前合并执行证据见verification；实际Provider仍未授权。最新用户明确仅新建项目及其保存/重开/恢复适用，既有项目迁移/副本方向已撤回（§46–47）。

当前结果、固定身份和唯一下一步见 [verification.md](verification.md)。本文件合并最小行为规格、设计和已决定的material contract事项；不另设 Spec/Test Gate，不修改 [intake](intake.md) 或产品承诺。

## 1. 输入、结果与顺序

权威输入为固定 `2628cec8c16e489489537a2d39a066806b733404` 下的 [产品输入](../../../docs/planning/2026-10-04/browser-first-n01-n02/product-input-v0.1.md)、[UI Contract](../../../docs/planning/2026-10-04/browser-first-n01-n02/ui-contract-v0.1.md)、全部五个 clickable 附件、Review004 和验证历史。[批准记录 §§5–6](../../../docs/planning/2026-10-04/browser-first-n01-n02/approval-and-handoff-v0.1.md)覆盖历史候选停止状态。规则采用 intake 指定执行政策、Blueprint v4.1 §§4–10；图示或历史 CI 不能证明本 Change 实现。

按Mini已接受的S采用**两个串行正式 Change**，不创建并行 WIP：

| 顺序 | 完整工程结果 | 保留的阶段责任 |
|---|---|---|
| Change005（当前） | 浏览器正常入口：问题／必要澄清 → 至少三份 CSV/XLSX（含实际参与计算的多 sheet）→ 获准结构理解和生成 Python → 隔离准备及提取／转换资格 → 既有真实 M1／独立复算 → 有据报告 → 精确 analysis-only 收束；停止、保存、恢复及本机安全同时交付 | 首试 M1，BF-R01–13、SC01–04、CAP01–04、UI01–10 的适用范围；不冒领 S1 或旧 E2 |
| 后续一个正式 Change（编号／intake 由 Mini 定） | 在同一基础上接通本批全部其余格式、M2、完整专业检查、深入框架变体、点评／合法期间重算、Decision/Expected、003 单层协作兼容，并对固定整合版本做 S1 场景／能力／体验验收 | MD/PDF/DOCX/DOC/PPTX/PPT/图片全部留在本批；Q1 内容能力、具体资料／格式资格、S1 质量与体验条件在相应执行前落实；不默默转为未来无归属 backlog |

拆分依据是首个可独立使用的完整分析终点及其共享安全／持久化基础；不为技术层各立 Change。后续能力未开放须诚实呈现，保留已有后端与历史接受。首次可试用不等于 Change005 正式完成；正式验证、Mini 工程接受、适用用户接受与归档仍适用。第二Change的正式身份由Mini在顺序到达时记录，整批S1归属不变。

## 2. 最小行为规格

| ID／产品接受引用 | 输入 → 成功输出 | 失败及禁止效果 | 必要决定 |
|---|---|---|---|
| E01 · BF-R01–04、SC01/02、UI01–03 | 已选任务文字、资料身份和有效配置 → 必要语义澄清、实际消费的 Contract/Binding；已知期间和用途复用 | 未获准文字不先外发分类；不预设下降；不支持筛选／因果须说明，不静默降级 | D1、D4 |
| E02 · BF-R04/13、CAP01/04、SC04、UI02/10 | ≥3 CSV/XLSX，含工作簿 ≥2 个有效数据 sheet → 不可变原始快照、提取证据、准备版本、合格规范数据及逐层来源 | 漏页／错列／错误关联／重复或丢行／未知转换／来源漂移不进入计算；全空阻塞，不把有文件当可信 | D1、D2 |
| E03 · BF-R03/06/13、CAP02/04 | 授权覆盖、可信结构与受检生成代码 → 在隔离区内读取批准输入、产生待资格检查的派生产物 | 无网络、凭据、任意目录、Shell/子进程、安装、修改源文件；隔离未知或失败即不执行；stdout/异常不外发 | D2、D4 |
| E04 · BF-R05、CAP01、SC02 | 合格准备版本、确认语义、M1 计划 → 真实 DuckDB + 固定 Python 复算匹配，本轮证据报告 | 两条路径均不执行 M2；合法期间必须影响结果；全空拒绝，单期零分母为不足；解释失败保留事实但不谎称报告完成 | D1、D4 |
| E05 · BF-R07/08/13、SC03/04、UI04–06 | 同一任务／操作、有效 grant → 无累计消费阈值的持久计量；临时模型失败最多一次重试，可纠正准备失败最多一次纠正 | 不按 Attempt/重启重置次数；物理未结束／UNKNOWN 不补发；停止、来源变更、失效、永久失败不自动重试或纠正；迟到不得发布 | D3、D4、D5 |
| E06 · BF-R08/11、CAP02/03、UI05/06 | 本机正常启动、当前控制者 → 真实 Application 状态；刷新只读回，关页后后台到待审／缺口；重启先读回 | 不跨站／LAN／多页／Desktop 双写；端口冲突不杀进程，缺工具不安装；不自动恢复执行、不重发未知命令 | D5 |
| E07 · BF-R09、CAP03、SC03、UI07 | 精确 Finding/报告/合法不足收束及明确 analysis-only 确认 → 原事务整体接受 Finding、Closure、Completed、追加 final、关闭任务 grant | 缺合法摘要／过期来源拒绝；取消／待补证不产生正式接受；无 Decision/Expected/行动；未知只读同一 intent receipt | D6 |
| E08 · BF-R10/12、UI07–09、UX01/02 | 同一保存版本在简洁／专业面查看、查看依据／历史、请求报告副本 | 下载请求不等于落盘；历史不更换当前版本；未开放 S1 不造响应；不预设速度收益或伪进度百分比 | D1、D5、D6 |

## 3. 原始实现基线与已落实消费者（当前结果见verification）

以下保留初始源码差距，用于追溯实现职责；当前实现及实际结果以verification为准，**此表自身不是执行 PASS**；对应文件哈希在原始证据 `supplement.json`。

| 现有实现 | 可复用职责 | 必须改变的消费者 |
|---|---|---|
| `packages/product-core/member-analysis.ts`：Plan 1.0、Selection 2.0、Start 2.0、Manifest/Evidence 4.0、Output 2.0 | M1/M2 选择、期间、哈希、零分母与全空规则 | 原始来源固定 members/orders 两份；不能把派生双 CSV 伪装成全部原始来源 |
| `packages/application/member-task.ts`、`packages/product-core/member-task.ts` | 任务、grant、epoch、保存、停止、实际分析调度、审阅入口 | `synthetic_only`、有限累计 profile、双源 outbound；read 含既有协调副作用，不可直接当浏览器纯查询 |
| `adapters/storage-local/member-task.ts`、`member-analysis-schema.ts`、`desktop-state.ts` | SQLite 任务/使用/receipt；现有 schema 100/110；精确人审同事务提交 | 新准备／操作身份、持久重试和 uncapped 模式；现有 unresolved 不能当 settled 或删掉；新建120及未知版本拒绝；100/110原消费者保留，升级迁移不在本次范围 |
| `adapters/analytics-duckdb/xanthil-desktop-decision-case.ts` | 真正按计划选择的 DuckDB 主算、固定 Python 独立复算 | 两条指标路径前增加独立提取与转换资格；复算一致不能证明转换正确 |
| `adapters/analytics-duckdb/process.ts` | 受信固定程序进程封装 | 只有无 shell、简化环境和超时；无文件／网络／进程隔离，输出累积也未设硬容量；不得用于不可信代码 |
| `profiles/personal/xanthil-desktop.ts`、`packages/application/provider-settings.ts`、`adapters/agent-pi/xiaomi-local.ts` | Personal 装配、既有 Keychain 责任、Pi 0.84.2、固定 Xiaomi 路由、共享物理模型槽 | 真实 membership Runtime 尚未接通；产品配置需持久引用；现有文本 Adapter 返回不足以完整计量，旧 finite cost reservation 不适用新任务 |
| `apps/desktop/main.ts` 的 native dialogs／source reader | 项目目录能力、真实本地选择、NOFOLLOW 读取、导出读回 | 目前双 CSV；浏览器不能接受前端任意 path；原生入口与服务的生命周期互斥需要新增契约 |
| `appendMembershipReview` / `withMembershipState` | 精确来源、不可变 final、故障注入、receipt、关闭 grant | 同事务接纳新计划版本，生成合法 M1 不足摘要；不能重建第二套人审存储 |

## 4. D1 — 版本化多源、准备、来源消费者及持久兼容

**D1已接受：下列版本链及schema120可实现并作合成验证；120仅新建与可信同项目重开；旧版本基线保留，迁移/副本不在本次范围。** 分类：边界内public/persistent合同；不增加指标／业务语义。

形状与真实消费者：

1. `SourceSet 1.0`：`id, owner, selected_at, sources[]`；每项含稳定 `source_id`、格式、显示名、字节长、SHA-256、本地不可变工件引用。位置是 `source_id/sheet_id/row/cell`，CSV 用行／列；用户路径不出站。全 workbook sheet 清单含隐藏状态，每项须有消费或明确排除依据，不静默忽略。浏览器上传不提供原始绝对路径时如实缺省，不捏造路径。
2. `Preparation 1.0`：精确 source-set hash、已确认语义／关联规则、代码 hash、可信提取器版本、变换声明 hash、隔离策略／执行回执、规范 members/orders 工件长/hash、来源映射工件 hash、三个独立阶段的状态。模型自报的 lineage 不是资格证明。代码输出先隔离保存；只有可信资格回执可令其成为 M1 输入。
3. `PreparedTask 2.0`、`MembershipPlan 2.0`、`PlannedSelection 3.0`、`Start 3.0`：显式绑定 SourceSet、Preparation、规范数据 hash，以及既有 owner/确认/scenario/Contract/Binding/期间/方法/验证要求。Plan2 只允许 M1；既有 Plan1 继续允许其原范围。真实消费者在准入、计算前、证据发布、人审读回分别核对整链；不能丢掉准备身份后调用旧入口冒充原始双源。
4. `Run Manifest/Evidence 5.0`、计算 `Output 3.0`：绑定同一 Plan2 hash、Preparation hash、计算与复算实现 hash。内部可复用既有 M1 算法，但对外完整返回上述身份。报告引用原文件到单元格、代码／配置、规范数据、计划／核验与本轮报告，不仅列两个中间 CSV。

最小可信提取／转换：使用现有 Python 标准库 CSV、ZIP/XML 能力实现受限表格提取，不引入未锁定的 openpyxl 或借用 Pi 私有 XML 依赖。XLSX 普通值单元格、共享／内联字符串、明确日期系统和数值类型形成资格规则；密码、损坏 ZIP、外部关系、宏、需执行的公式、无法可靠解释的格式或单元格返回具体缺口，不猜原值或执行内容。容量、压缩比、sheet/行/单元格上限是单输入保护，超限明确拒绝而不截断。发现本机 openpyxl 3.1.5 仅为能力记录，不成为依赖批准。

生成 Python 仍实际读取选定的只读 CSV/XLSX 快照并完成提取／拼接／规范化。独立可信提取器另读这些快照，逐 sheet 统计并保留定位；转换资格器按已确认声明独立检查投影／追加、唯一键关联、日期与精确金额规范化、行级对应和排除原因。首版声明仅覆盖本 M1 所需变换；不允许任意表达式。全量检查重复键、错误匹配、漏行／造行、日期／金额失真与来源漂移；不能只比总行数或再次计算相同错误输入。共享底层 ZIP/XML 解析的共因风险以手工构造、独立期望的工作簿 fixtures 验证；不能把同一生成函数当 oracle。

持久形状（D1已接受，私有列形状可随实际消费者细化）：保留现有SQLite运营库、不可变文件和表职责，不建新数据库。

| 关系／约束 | 内容与消费者 |
|---|---|
| `membership_source_sets`，PK source_set_id，FK task_id + owner，UNIQUE(task_id, source_set_id) | canonical body/hash；实际所选源快照及提取清单 |
| `membership_preparations`，PK preparation_id，FK(task_id,source_set_id)，UNIQUE(task_id,preparation_id) | canonical body/hash；每次纠正产生新不可变版本、前驱及同一 operation；合格回执与派生产物完整性 |
| `membership_plan_preparations`，PK plan_id，FK plan_id 及 (task_id,preparation_id) | Plan2 强制且唯一准备绑定；旧 Plan1 不回填虚构记录 |
| D3 的 operations/usage 扩展 | 同库同事务约束身份、计数、准入及计量；不要独立 JSON 充当第二权威 |

现有 snapshot/confirmation 仍描述合格规范输入，必须经 plan-preparation 链回到全部原件。`membership_plans` 保留 plan body/hash 的版本分派；`analysis_runs` 接受明确版本5，不能通配未知版本。schema120用于本入口独占创建的新项目及可信同项目重开，完整验证未知版本拒绝、来源身份、原子持久化和恢复。现有100/110有限Profile及旧Plan/Run/报告消费者保持原合同和防回归；本Change不将其迁移、回写或降版本。旧库升级/备份迁移验收已由最新用户范围决定撤回；不是以未执行测试冒充PASS。

## 5. D2 — 不可信 Python 隔离及首轮可行性证据

**D2已接受失败关闭候选及追加的四项host验证。** 分类：security/authority合同。worker EPERM继续保留且不重试；Mini十项固定探针PASS仅限原脚本，产品executor003已合并22PASS，后续settlement增量的当前补验见verification。执行权来自engineering-decisions.md最后追加决定，不来自旧已耗尽的一次授权。

本机 `/usr/bin/sandbox-exec` 存在；本地 man 明示其 deprecated，sandbox 手册也提示已打开 FD 的限制。现有 `-I -B`、AST 检查、进程超时或 Pi 均不能实现本合同。首选最小实现为 Adapter 内可信 Python 启动器：隔离前只加载固定所需解释器／标准库，关闭额外 FD、清空非白名单环境，不接触凭据；在执行任何生成代码前通过系统 sandbox API 安装 deny-default 进程策略。只读当前复制快照，写本次准备隔离目录；拒绝其他文件、网络、进程创建／exec、动态安装和无关 IPC。启动器必须确认策略安装成功；平台不支持或权限拒绝时直接返回 `ISOLATION_UNAVAILABLE`，不得 fallback 到普通 Python。

内核限制须覆盖 ctypes/原生调用、symlink、路径穿越、已打开 FD、子进程等绕过方式；语言 API 黑名单仅作额外输入检查。少量平台运行时读取需求须逐项验证、收窄到固定工具链，不使用“整个 HOME / /Users / 项目可读”。代码没有持有后端 Keychain 或模型能力的进程内存。可信父进程限制 CPU、wall-time、输出文件总量、stdout/stderr容量并等待物理退出；达到保护终止、保留非成功回执。产物读取用无符号链接的已核验目录／文件身份，结果在资格通过前不可发布。输出原文和异常只留授权本地证据，不反馈模型；反馈为可信固定诊断枚举和获准结构。

最早纵切先使用确定性合成代码与合成文件，证明隔离和失败关闭，再接真实数据准备逻辑；真实模型生成代码仍受 Q1/Q2/Q4。请求测试效果仅限 worker 持久证据下独立测试目录：

- 创建三份合成 CSV/XLSX、只读快照、隔离派生区，以及**任务自有**区外 canary/假凭据文件；不探读真实 Keychain、业务文件或别的项目。
- 在限定子进程内执行正常准备代码及恶意合成代码，证明读 canary／列目录／写源／symlink 逃逸／fork/exec/Shell/安装被内核拒绝且无副作用。检查原件字节和 canary 读写标记；禁止动作没有结果不等于证明其未发生。
- 仅为网络拒绝测试创建一次临时 `127.0.0.1` trap，记录零连接；禁止 DNS 或公网探针。另检查 Unix socket／继承 FD 绕过。结束关闭 trap 和子进程，不装服务、不改系统设置。
- 策略安装失败、资源超限、停止、父服务中断、未知执行、输出夹带明细均须被检测；隔离无证据时业务路径不会执行。没有安全可行路径即交 Mini 根因／限制，不反复尝试或扩大权限。

原worker失败、host健康及十项探针的完整原始证据不改写。当前新增授权覆盖四项剩余领域的受审普通host运行，Mini执行且回传同一worker；本worker只运行独立安全检查。新安装／改变sandbox／真实资料等额外效果仍关闭。合并产品suite见§12；准备完成即内部交回，不请求重复用户授权。

## 6. D3 — 无累计阈值、持久操作与独立计数

**D3已接受新的TaskResourceProfile/Grant/Usage 2.0与同库操作身份模型。** 分类：persistent/authority；产品的uncapped、一次重试、一次纠正已经批准，不重复索取产品决定。

- `consumption_policy: {mode:'uncapped_metered'}` 是明确 tagged 模式；旧1.0 finite照原规则。不以零、null、缺失或巨大正数模拟无限；没有累计调用／token／活动／等待／local run阈值。每次技术容量、超时、串行执行、有效授权依然强制。当前 Adapter 的60秒／2048输出token／12000输入文本容量是初始可测技术约束，若不能容纳实际脚本，按合成证据调整单次保护，不扩大累计或资料权限。
- 一个 `operation_id` 绑定 task、明确用户意图／推进阶段、输入版本／范围及操作类型；任务自动推进复用已成功结果，到报告／必要缺口／人审即停。同一失败不能靠新 UUID、Attempt、继续或刷新变成新操作。只有真实新输入／语义或合法新用户意图才形成可解释的后继关系；为换 ID 而无意义变更字段拒绝。
- `membership_operations`：PK operation_id，FK task，UNIQUE(task_id,intent_id,stage,input_fingerprint)；kind=model/preparation，parent_operation_id可空；`retry_used` 0..1、`correction_used` 0..1，类型不适用字段必须0；epoch及状态 reserved/issued/settled/unresolved，结果/失败分类及body/hash。在同一 SQLite 事务中准入、占用本次序号并登记使用；只能有一个尚未结清的物理执行。D1准备版本引用该操作。
- 模型逻辑操作最多物理请求 index0/1；准备操作最多代码版本 index0/1。纠正中的代码生成是该准备操作下的模型操作，自己的暂时失败重试独立计量；不能把一次模型重试算成本地再执行资格。保留父子身份以及全部失败、请求和代码版本。
- 新 `membership_operation_usage`：PK usage_id，FK(task_id,operation_id)，UNIQUE(operation_id,execution_index,usage_kind)；grant/epoch、开始结束、physical状态及 calls/input_tokens/output_tokens/local_runs/active_ms/wait_ms；每个可测量值是非负十进制或显式 UNKNOWN+reason，保留已知下界。不填造“0费用”，不把旧 synthetic cost/固定价格当套餐实际账单。旧 membership_usage原记录保留；v2视图合并适用账本，重启重算累计而不清零。
- 对 issued/unresolved，先读回及物理身份结算；不能释放槽后补发。明确确认进程已经结束但精确消费不可取得时，消费仍UNKNOWN，保存结算证据，再按原操作剩余资格决定；重启不自动调用。stop提高epoch封闭准入，晚到只更新实际使用／物理结算，不产生可信结果／报告／正式接受。永久失败、停止、失效、来源漂移或隔离失败不可自动重试/纠正。

任何修订不能改变现有有限 profile 和002/003的独立限制；新策略只在新版本消费者中生效。事务竞争、崩溃前后、物理未退出、第二次失败与换ID绕过必须有负例。

## 7. D4 — 复用真实 Runtime、产品配置和材料投影

**D4已接受在现有Personal/ProviderSettings责任内增加非秘密ProductModelPolicy 1.0及membership Pi消费者的实现和合成验证。** 分类：public/authority；真实设置／Keychain／Provider未开放，不新增Runtime或配置平台。

配置最小字段为 policy_id/version/hash、既有批准引用、固定 `xiaomi-token-plan-cn / mimo-v2.6-pro`、会员任务用途、允许材料类别、`uncapped_metered` 与一次重试／纠正策略、适用状态。配置存于现有本机设置责任下的原子文件，项目只存其非秘密身份／范围快照；Key仍由现有受控凭据链独占，不进项目、浏览器、prompt、导出或日志。工件路径是本机实现细节，不能创建跨项目通用配置服务。任务grant引用精确配置、所选材料身份、目的、披露类别、epoch和有效性；grant更新不意味着重新批准产品配置。产品批准是历史权威，凭据是否可用是当前事实，不能混为一项。

Personal composition复用既有 Pi adapter、固定路由、模型独占槽；扩展 membership专用受限输出和 v2 usage回执，不从Core泄漏 Pi types。只有受限意图（澄清/准备方案/执行合格计划/解释核验事实），没有自由工具调用。旧synthetic入口与 finite Runtime测试保持原负例，新真实入口不靠将synthetic开关改名激活。

三类出站投影单独校验：①所选任务文字／必要语义；②CSV/XLSX普通表头、类型、结构、别名与必要语义（无明细、样例、路径、身份值或群组标签）；③本轮已独立核验 M1总体聚合及可信验证摘要。模型准备失败仅接收可信分类诊断，不回传任意stdout/异常。不同文件内容路径在后续S1按原批准完整接通，不能用格式改名绕过明细限制。已识别凭据／敏感内容停止并报告，不声称能自动识别任意秘密。

Q1实际配置／账户／材料能力、Q2精确试用文件/期间/状态/出站身份、Q4资料保存及服务权限须在受影响真实执行前落实；当前不得读凭据或调用Provider。模型声明image能力不是实际内容消费证明；S1具体格式路径须有真实消费者，不能暗换模型或强制一律摘要。普通合成Runtime测试可验证机制，不能充作真实模型质量证据。

## 8. D5 — 本机浏览器控制、项目排他和读回

**D5已接受Browser Transport 1.0、同机后端／项目排他及限定loopback合成测试。** 分类：public/authority/security；适用新项目及同项目重开，必须保持独立Node服务的同profile实例排他、共享核心的项目排他、可信项目能力与UNKNOWN恢复；旧库迁移/旧活句柄切换方案已撤回。

当前入口为浏览器 → 独立Node本机后端 → 既有Personal/Application/Store/Pi/隔离执行器，用户不需启动Electron。项目与模型设置均由网页操作；后续桌面壳复用相同能力。早期Electron companion选择已由用户明确取代，仅保留历史证据。正常 `web:start/open/stop/status` 管理同一profile服务，启动命令结束后服务继续存活；关闭网页不结束服务，明确停止关闭准入并保留实际执行状态。不可达不等于已退出，未证实的锁持有状态返回UNKNOWN，不启动第二写者；不安装daemon。

- 只bind `127.0.0.1`，Host严格为实际地址／端口，无 CORS放行；服务仅匿名提供精确最小bootstrap shell/script以完成fragment交换（见§22及Mini决定），工作区及其静态资源和业务命令均认证后提供；不暴露任意文件／SQL／shell／代理。随机启动凭据一次性从URL fragment交换，本地日志不记录；host-only、HttpOnly/SameSite=Strict且无持久寿命的session cookie（不宣称浏览器物理不落盘）；写命令还需Origin校验及页面内存控制nonce。防DNS rebinding、跨站请求、恶意Origin、未认证读取、WebSocket若引入时的同样检查。只读页面也须认证。
- BrowserRequest1 含 command_id、任务owner、expected row_version/epoch、受限operation和payload，严拒未知字段／方法。mutation以持久receipt实现幂等；同id不同fingerprint冲突。GET只返回持久投影或receipt，禁止触发已有`read`里的停止／清除待审等副作用；必要恢复由Application协调器的显式恢复事务完成。页面刷新只GET；未知mutation先GET同id，不重新POST。
- 一任务一个写入控制者，另页只读；控制nonce不存localStorage，不随复制页复制。控制lease丢失不终止已获准任务，显式接管需服务端fence旧控制者；控制权不授予新的数据／模型权限。启动epoch隔离旧连接，服务重启显示有效结果与interrupted/UNKNOWN，不自动继续。
- 同一profile服务持有SQLite EXCLUSIVE事务锁及私有目录/控制身份，不能仅凭端口、探测失败或PID文件断定旧服务退出。锁不可取得时拒绝重复启动；停止只有确认锁已释放才报告结束。项目仍通过共享核心按realpath/device/inode的可信来源和项目lease打开，不能由不同入口同时写同一项目。旧Electron全局实例锁证据不替代当前Node服务生命周期证据。
- 未注册来源、未知版本或替换的项目身份拒绝激活；本次不创建旧项目迁移/owner交接平台。保留现有格式严格拒绝及旧有限功能回归，不能将撤回提案解释为削弱实例/当前项目保护。
- 项目新建仅提交名称，由后端在配置的Projects根独占创建；重开仅提交当前profile已登记项目的不透明ID，服务重新核验来源能力，不从HTTP接受任意绝对path；文件选择可用浏览器File上传到该项目的不可变来源区，服务只接受受限格式／容量和新生成ID，拒绝客户端路径、覆盖、symlink与跨项目引用。仅选择触发受信本地检查，不能自动授予模型或生成代码权限。原件不变，上传副本绑定字节身份和可得来源名。
- 仅提供已授权报告的下载副本；服务保存／核验与浏览器下载状态分开，没有浏览器落盘回执时提示检查下载列表。报告HTML做可信模板／转义及CSP，模型或来源内容不执行脚本。

合成主机验证仅使用任务自有profile、loopback和固定材料，无真实Provider/凭据。独立Node正常启动、网页设置/项目/分析/人审/重开，以及真实Node中断后的UNKNOWN/显式Stop分别由固定主机包覆盖，身份和结果见verification。Electron仅作现有测试Chromium工具，不是产品依赖；所有自有进程和端点均需收回。不安装、不改Host Loop、不访问LAN或业务项目。

## 9. D6 — 复用精确 analysis-only 人审事务

**D6已接受保留Review 1.0人审意义和事务、扩展精确来源解析到Plan2。** 分类：public/persistent/authority；不建立第二人审协议。

Application先形成待审合法Closure建议：本轮M1事实、期间／来源、核验范围、不能据描述性比较选择因果／业务策略的具体不足，以及无方案偏好的依据。单期零分母须说明该期证据限制；“用户暂不行动”本身不是证据不足理由。字段缺失时停在可理解的待补内容，不能填假的actor／事实。当前合法已知信息应自动带入，不要求普通用户手填内部对象。

明确确认绑定 review_id/version/intent_id、owner/row_version、Finding/run/Plan2/Preparation及report id/version/hash。前端与后端都限制当前首试只能analysis-only或待补证；恶意请求Decision/Expected拒绝，不能靠隐藏按钮。复用`submitReview → withMembershipState → appendMembershipReview`，一个事务接受Finding、保存合法Closure、Completed、追加不可变final、写receipt并撤销旧grant；不修改待审原版，不生成Decision/Expected。既有正式Decision路径和003历史保持。

事务前生成不可变文件、事务内绑定引用的既有做法继续：故障留下的未提交文件不构成报告成功，恢复按数据库权威读回，不能再次发布。故障注入覆盖每个正式写点和commit结果未知；同一intent返回唯一receipt，来源改变拒绝。取消／质疑可保存待补证草稿但正式效果为零。stop/epoch变化及review准备/提交竞争不能绕过授权封闭。

## 10. 当前适用验证入口与范围

已落实的验收映射、当前输入/结果和历史RED见verification。canonical offline为 `tools/harness/validation/run --portable`，覆盖contract/integration/retained旧finite及当前browser事件/服务入口；具体计数和输入绑定以当轮结果为准。typecheck使用`node node_modules/typescript/bin/tsc --noEmit`。正常独立网页命令为 `npm run web:start`、`web:open`、`web:status`、`web:stop`，不要求Forge/Electron编译；复用既有固定工具链descriptor与开发helper产物，缺失时可理解地失败，不自动安装/构建/读取凭据。保留Desktop构建与资源组装的适用回归，不将其当独立网页启动前置。

当前真实入口证据为Mini审阅的`browser-independent-host-002`及`browser-independent-unknown-host-001`：正常Node命令退出后服务独立存活、网页项目/设置/分析/人审、重开、真实Node崩溃UNKNOWN。凭据/模型transport为合成替身；业务终态由真实共享核心与计算产生。既有executor004固定22例及先前业务恢复包仅按未变化源码和明确差异复用。portable不能代替macOS隔离/渲染；旧Desktop E2不因本Change合成网页PASS而关闭。

主要永久消费者包括`browser-{preparation,membership-plan,membership-recovery,model-runtime,model-policy,workspace,local-transport,client,companion,independent-profile,service-auth,project-catalog}.integration.test.ts`及实际canonical清单中的service/workspace事件测试。原合同和旧finite负例继续进入canonical。隔离固定22案例在`tools/harness/validation/browser-preparation-host.mjs`，Worker仅可运行离线检查，实际payload由Mini收回。无真实Provider/业务资料/安装/发布权限；合成机制证据不冒充模型质量、用户体验接受或后续格式/M2交付。

## 11. 已接受决定与继续边界

| 项 | 需要的确切决定 | 当前状态 |
|---|---|---|
| S | 两个串行正式Change；第二项保留完整剩余S1，不并行开工 | ACCEPTED |
| D1 | 版本链、规范双源与全部原件强绑定、可信提取/转换、schema120历史兼容 | ACCEPTED；新建120及原版本基线，迁移已撤回 |
| D2 | deny-default及限定synthetic验证，失败关闭 | ACCEPTED候选；worker EPERM保留，旧host10项PASS；产品executor003已22PASS；当前settlement增量补验见verification |
| D3 | uncapped、持久操作identity／两类计数／UNKNOWN结算 | ACCEPTED |
| D4 | 现有配置职责、Pi消费、授权投影／usage | ACCEPTED代码和合成设置；真实Q1未核验 |
| D5 | 本机控制、排他、纯查询及限定临时测试 | ACCEPTED；新建/保存/重开/恢复适用，旧迁移方向已撤回 |
| D6 | 原Review事务、新来源链、合法不足及analysis-only | ACCEPTED |
| L | 依赖隔离复制／前后身份与symlink检查，不安装／下载／运行lifecycle scripts | ACCEPTED；不改变依赖版本或原checkout |

不请求用户重定既定模型、累计策略或重试规则。同一worker持续工程，普通纠正不再返回审批；涉及新安装、改变实际执行限制／旧数据安全、真实资料／Provider／主机权限或产品承诺变化，才返回相应边界。实现／测试和遗留UNKNOWN以verification当前记录为准，原提案证据保留。

## 12. E03-c — 产品执行器与合并host验证（D2追加决定）

接受引用 E03/BF-R03/06/13/CAP02/04；按已批准D2，不改变权限。业务准备Adapter增加executePreparation：输入固定版本1.0、复制的来源bytes/显式hash、代码/hash、此前不存在的任务run目录、AbortSignal；输出仅为待独立资格检查的members/orders bytes及实际执行身份，不返回“隔离已证明”布尔值。未授权上层不得装配为活产品入口。

先验证取消、输入/代码hash与容量，之后才建立run目录或启动进程。Python受信supervisor接收固化request；fork固定解释器子进程，父stdin是生命管道，子进程等待父收到PID后发出的go。子进程预加载标准库/原生库，清环境，关闭所有继承FD（除重定向stdio及一次性策略状态管道），设CPU/单文件/FD/core硬限制，再sandbox_init deny-default，仅读精确快照、写本次输出。策略管道在执行payload前关闭；安装失败exit78，绝不执行代码。stdout是完全不可信本地诊断，不能作为policy或成功凭证。

监督器独立监测物理子进程：wall 4秒、CPU soft1/hard2秒、RSS 96MiB（libproc原生观测，10ms采样，记录峰值；这是检测后终止阈值，不能冒充无瞬时超越的硬配额）、stdout+stderr64KiB、单文件1MiB、最多两个输出/总量2MiB、FD32、core0。资源监测不可用则payload前失败关闭。内存验证最多分配128MiB、分块触页且每块暂停，避免无界压力；原生malloc绕过Python分配也走同一监督。OS虚拟地址硬限仅在平台支持且不破坏正例时可补充，不把未验证RLIMIT_AS当硬内存保证。

父服务死亡/pipe EOF/取消/期限/输出或内存越界立即杀死唯一自建payload PID并waitpid；子异常/信号退出拒绝部分结果。supervisor异常退出时，仍存活的Node父杀死已经握手确认的payload PID；握手前子只能等待，supervisor管道关闭即退出。整个机/两个监督层同时丢失不推断已结清；重启不自动发布或续跑。Node仅在监督正常退出、waitpid成功、无取消、源hash未变且输出目录inode未变后NOFOLLOW打开恰好两个regular/nlink1文件，校验限额并读回hash；任何部分/迟到/链接/额外文件/异常退出均不进入转换资格。

合并验证：一条host命令驱动真实产品Adapter→supervisor→固定synthetic代码→可信独立资格→真实M1/复算；随后串行Unix IPC/native调用/FD、CPU/memory/stdout/file/wall、子crash、父crash/取消/迟到/输出资格负例。每个负例先实际policy安装及有用转换，随后记录attempt；独立父检查trap/canary/源字节/文件身份/物理退出，子自报不足以PASS。有限正例和失败回执不是浏览器/Change完成。所有payload固定入manifest，无模型调用。每case<=8秒，whole-run<=150秒，首次失败停止并保存。只清理本次创建的PID/Unix endpoint，无进程名扫描。

focused：现有browser-preparation.integration.test.ts覆盖安全的执行准入与产物资格，无policy安装；node --test同一路径与npm run typecheck。真实隔离合并suite由Mini普通host执行，worker只做语法/类型/fixture检查；不把host NOT_RUN冒充GREEN。因果RED先覆盖实际缺失executePreparation入口，host行为的RED/首次结果按实际host运行保留，尚未运行不得补造。

当前交回停止覆盖：engineering-decisions.md最后“User stop at current Worker handoff”已读。本轮仅完成在途准备/交接；host套件、后续工程和Validator均等待用户新开发模式规则及适用继续指令。之前批准的技术范围和原始证据保留，不越过后来停止线。

### E03-c host input correction after executor-host-001

The adopted 410f236 rules and final Controller resume decision lift only the workflow pause; current Worker is Controller-verified gpt-6-astra/medium/workspace-write/never, retaining historical high evidence. The first host health run rejected fixture UUIDv7 sources before supervisor creation. Source IDs retain the existing UUIDv4 contract; correct the fixed producer, never widen membershipUuid. A shared synthetic producer supplies both runnable cases and frozen inputs. The static suite sends every exact fixed payload/source request through actual executePreparation with an already-existing task directory: PREPARATION_DIRECTORY_INVALID (or non-mac ISOLATION_UNAVAILABLE after identity validation) proves admission passed while guaranteeing no directory creation, helper or policy execution. Invalid UUID/hash variants must still reject as PREPARATION_IDENTITY_INVALID. Host001 setup failure is not isolation RED/PASS. Freeze a linked host002; Mini executes and returns results in this same context. Full portable scope applies to the executable/safety/CI package; focused correction evidence is not full validation.


### E03-c CPU enforcement correction after host002

Mini's current D2 correction supersedes the earlier unverified CPU hard-kill claim, preserving it as historical design. BF-R13/CAP04: input is trusted libproc child user/system CPU accounting; at observed total >=2 seconds the supervisor kills only its owned payload, reaps it, records CPU_LIMIT and publishes no candidate receipt. Keep RLIMIT_CPU(1,2) as defense, wall4s, poll10ms and all other limits. This is a sampled CPU termination threshold, not a strict kernel quota; wall termination cannot satisfy the CPU case. Correct Mach tick conversion uses the host timebase; unavailable/invalid accounting or self-calibration fails before payload. The trusted final wait4 CPU must remain 1.8<=CPU<3, elapsed<4, SIGKILL for the fixed CPU case. Unit/native-self accounting (no payload/policy) must distinguish CPU work from sleep, verify conversion/boundaries and reject unavailable measurement. Actual executor enforcement remains for Mini's same22-case host003. Host002's7 PASS and CPU WALL_LIMIT at4.006849 CPU/4.00865 elapsed remain retained;14 later cases NOT_RUN.

Primary-source diagnosis references: Apple XNU [RLIMIT_CPU handling](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/kern/kern_resource.c) configures the soft CPU timer/SIGXCPU; [rusage](https://github.com/apple-oss-distributions/xnu/blob/main/osfmk/kern/bsd_kern.c) receives task power times and [task accounting](https://github.com/apple-oss-distributions/xnu/blob/main/osfmk/kern/task.c) supplies Mach-time counters. These explain the repair and unit conversion; upstream source is not proof of this installed kernel's behavior. The actual host failure is the decisive counterexample to our prior hard-limit claim.


## 13. E02-c — durable source selection before preparation

D1/BF-R04/08/13, SC02/CAP04: a current fresh-project task, exact command/row version and selected CSV/XLSX bytes enter Application trusted inspection, then immutable source files and SourceSet1.0 metadata are registered in the same SQLite task transaction. SourceSet carries task/owner/selection time, original source identities and extraction inventory; it is not a Preparation receipt, normalized snapshot or model-disclosure authority. Ordinary selection/readback cannot execute Python payloads or a model. Command replay returns the same selection; changed command input conflicts. Readback is read-only and rechecks stored source bytes against exact length/hash and regular-file identity. Corrupt/missing/link artifacts fail closed; old sets remain immutable after reselection. Cancellation, stale row, stopped/closed task or unresolved work cannot publish a new selection. Only existing new-schema120 test projects are used; no old-project activation/migration. Artifact publication may leave an unreferenced immutable directory on transaction failure, never a falsely committed SourceSet. The next Preparation consumer must read these exact originals rather than accept arbitrary replacement bytes.

Focused evidence: extend existing browser-membership-recovery integration with real Application -> inspector -> same SQLite/artifacts -> reopened pure read/qualification, plus source/owner/command/state negatives. No fabricated sandbox or execution receipt. Independent qualifier may consume reopened originals and a hand-authored test candidate strictly as a conversion test; it grants no execution or Plan2 authority.


## 14. E03-d — trusted failure settlement into the operation ledger

D2/D3/BF-R07/13: the preparation Adapter failure includes fixed `physical_status` (`not_started`, `settled`, `unknown`) alongside its fixed error code. Before any spawned supervisor it is not_started. Only a trusted supervisor outcome matching the handshaken child PID and physical wait/reap permits settled; absent/mismatched/abnormal settlement stays unknown even after a best-effort kill. Raw diagnostics remain local and cannot determine this field. Application may release an issued preparation reservation only for not_started/settled; unknown retains its occupied slot and forbids retry/correction. Success still requires actual settlement and independent qualification; no status field grants output/analysis authority. Unit prelaunch causal checks are safe offline; integrated actual failure fields are checked in the next reviewed host path, not inferred from unit PASS.

## 15. E03-e Preparation admission and failure reconciliation

Under BF-R04/07/08/13 and accepted D1/D2/D3, a preparation request binds version1.0, task, selected SourceSet, grant, bindings and code. Before dispatch the same SQLite transaction validates original bytes, latest selected SourceSet and exact grant scope, reserves/issues the preparation operation and records its immutable attempt identity. Code corrections share the source/bindings logical operation; changing code cannot mint retries. Unknown versions, wrong scope, stale source and cancellation before admission create no execution.

The Application obtains failure provenance only from the configured trusted runtime's local error descriptor. Exact task/operation/execution/epoch must match the durable attempt. Confirmed no-child or reaped failures settle that attempt; absent/mismatched provenance remains unresolved and blocks admission. Failed attempts and ledger outcome commit together. No normalized data or successful Preparation may be published on this path. Unknown consumption remains explicit, with token consumption known zero for this local operation and elapsed time unknown unless measured. Reopen is read-only and preserves both failure and unresolved state. Stop/epoch fencing applies independently. This increment does not activate an old project or authorize any new host execution.

## 16. E03-f Successful Preparation integration

The fixed health payload must traverse the fresh-project SourceSet and authorized Application path. Independently compare every normalized row with the trusted original extraction/bindings, then atomically publish the qualified Preparation identity and successful ledger settlement. Preserve immutable original and normalized bytes separately. Reopen returns identical Preparation and normalized bytes without database mutation. A model-shaped success, stale source, Stop/epoch fence, bad conversion or missing trusted physical settlement cannot publish. The existing actual fixed health payload is the positive causal host test; integration-host001 actually failed at missing qualified publication after verified execution and reaping. The implemented consumer adds immutable receipt/provenance, exact predecessor execution for a correction, same-transaction settlement/publication, completed-work reuse, and pure artifact readback. Success remains awaiting the linked host GREEN. Host effects stay within the retained fixed synthetic executor boundary; Worker only runs its static mode.

## 17. E04-a Plan2 and calculation identity

D1/D3, BF-R08/09/CAP01: Plan2 keeps the existing owner, confirmed snapshot, scenario, explicit M1 parameters and implementation verification, and carries an exact qualified Preparation reference plus task/grant/epoch authority. The Preparation reference includes id/hash, owner, SourceSet/hash, task/execution/operation/epoch and normalized/code/receipt/qualification/lineage identities. It uses decimal strings, preserving the existing analysis canonical JSON prohibition on JavaScript numbers; Store consumers resolve and compare the complete persisted Preparation. Plan1's finite task_context remains unchanged and is forbidden in Plan2. Preparation owner, normalized hashes/lengths and task/epoch must match Plan2. Selection3, Start3, Manifest5/Evidence5 and Output3 require Plan2; Selection2/Start2/Manifest4/Output2 continue to require Plan1. Unknown versions and cross-version wrappers reject. Manifest5/Evidence5/Output3 repeat the exact Preparation hash alongside Plan2 hash and primary/verifier implementation identities. M1 and its independent verifier may reuse existing algorithms, but never erase this identity at public boundaries. M2 remains prohibited for Plan2. A recorded actual fixed synthetic Preparation is a contract-test input only, not a new host execution assertion; the full current host path must also pass. Store admission/publication/readback must subsequently bind this contract to its actual persisted Preparation and active grant before product activation.

## 18. E04-b guarded normalized confirmation

Supplemental D1/D3 decision: private confirmPreparedRevision carries closed version1.0 Preparation reference + task/grant/epoch authority to existing confirmation storage. For a task with new SourceSet data, legacy Confirm1 without this context cannot confirm normalized bytes. The Store resolves the actual persisted Preparation and artifacts and compares full reference, owner, active grant/scope/epoch and normalized hashes in the same transaction before any new confirmation write. New-path file staging is inside that guard's write transaction; old finite confirmation remains unchanged. A context-bound confirmation link is immutable and checked on replay and readback; same command with omitted/substituted context conflicts. Start3 repeats the active guard and persists the exact plan-preparation relationship. Unknown/mismatched context, Stop before Store commit, missing preparation, source/normalized substitutions and transaction failure cannot create a confirmed authoritative snapshot. Orphan files after a transaction fault remain uncommitted evidence, never a confirmation.


## 19. E06-a — Plan2 analysis-only review consumer

BF-R10/11, D6: input is an exact current Run5 draft report/Finding/Plan2 reference through existing Review1. Resolve full persisted Preparation via Plan2 before creating/saving/submitting a review; preserve original sources, immutable report hash and exact task epoch. Output is a draft Closure suggestion populated from validated M1 periods/counts/rates, confirmed source and verifier scope, with explicit descriptive-only causal/business-strategy insufficiency and no preferred candidate. Actor remains blank until human input. Legacy Plan1 review remains unchanged. Plan2 choice is rejected before any sidecar/file/SQL effect; analysis-only commits existing acceptance/form/closure/final report/receipt and closes both grant families atomically; more-evidence writes no formal acceptance. Stop/epoch/source substitution rejects, and successful intent replay returns the original receipt.


## 20. E01-b — complete browser readback without recovery effects

BF-R01/07/08/09/13, D5: authenticated GET returns the existing task and question plus the same durable case/report projection, selected-file/sheet counts and cumulative operation ledger. It must use read-only SQLite connections, never invoke legacy task read/reopen, perform hot-journal recovery, expire grants, create files, or start work. Missing/damaged/unknown state returns a bounded failure; explicit coordinator recovery remains separate. Source summaries contain names/formats/identity and sheet/row counts, not raw cells. Existing HTTP auth/Origin/control and receipt semantics are unchanged.

## 21. E01-c — browser task creation and source selection

BF-R01/04/08, D1/D5: an authenticated controller creates a task from a question or selects bounded CSV/XLSX bytes for an exact task/row/epoch. Reuse existing task/source Applications and their durable receipts; no model/preparation authority is granted. GET task list and command result are read-only, including unknown-response recovery; same command cannot change operation/content. Source IDs are UUIDs, names are basenames, base64 is canonical and decoded inputs retain1..32 files/8MiB each/32MiB total limits. Upload JSON is separately bounded at45MiB including encoding overhead; other requests retain4KiB. No HTTP filesystem path or arbitrary method accepted. Stale epoch/row/control, malformed encoding, unknown fields or command conflicts have no persistent effect. Native project capability remains composition-owned, never an HTTP path.

## 22. E01-d — approved browser shell and uncertain-command client

BF-UI01/02/05/06, D5 clarification: exact `/` and `/bootstrap.mjs` are anonymous minimal bootstrap assets only; no workspace/data/substantive asset is returned without the existing session. Script clears the one-use fragment before POST exchange; tokens never enter query, storage or logs. Authenticated refresh opens read-only without a memory controller. Workspace reuses approved light shell, task rail, simple/professional depth and local file selection. Client persists only pending command IDs/kind/task association; control remains memory-only. Any uncertain write disables new mutations and uses GET command readback; refresh does not resend. Completed receipt clears uncertainty; null without a terminal HTTP response remains unknown. No fake workflow, data or progress. Native launch and full rendered normal-entry evidence remain required later.


## 23. E01-e — explicit browser control takeover

BF-R01/07/08, D5: an authenticated read-only page may explicitly request control using a closed version1.0 command, affirmative confirmation and the current transport generation. Same-origin POST atomically compares that generation and rotates the memory-only nonce; the previous page loses mutation authority immediately. GET session may reveal only authentication and generation, never a nonce. Stale/repeated/unknown-version/unconfirmed/foreign-origin/unauthenticated requests do not rotate or write business state. An uncertain takeover response is not retried automatically: the page remains read-only, reads current generation and requires another explicit user action. This transport capability neither grants model/source/execution scope nor resumes any task. Refresh still grants no control. Generation and nonces die with the server; no durable credential or activation effect.


## 24. E06-b — browser review command recovery

BF-R08/10/11, D1/D5/D6: authenticated controller commands open or save an exact task/epoch review; save includes the latest review id/sequence/hash and human fields. A version1.0 browser receipt binds command id, closed input hash, task and resulting full Review1 id/sequence/hash, committed in the same SQLite transaction as the review. Existing persisted review may be referenced without manufacturing a new version. Same command/content replays its saved receipt; changed content or kind conflicts; missing/unknown commands are read-only unknown, never auto-reissued. Every first write revalidates full Preparation/Plan2/current report/epoch and Stop within the transaction. Formal submit uses the existing Review1 intent as command id and its atomic human_review receipt; Plan2 remains analysis/more-evidence only. Browser display shows the actual draft Closure suggestion and blank human actor, allows editing and requires one explicit overall submission. No separate internal-artifact approvals, business decision, model dispatch or credential effect.


## 25. E05-c — explicit membership2 consumer in the existing Pi Runtime

BF-R02/03/07/13, D3/D4: the existing CaseAssistant Port/Pi Adapter gains a version2.0 membership method separate from unchanged finite `turn`. Input binds exact task/operation/execution/epoch, validated fixed-route policy and closed disclosure payload. Payload contains only explicitly selected text/semantics, structure headers/types with source/sheet identifiers, or independently verified M1 aggregates; never source rows, example values, paths, raw errors, credentials or free tools. Output is a bounded question, preparation proposal (untrusted code and exact source bindings) or explanation; none has formal/execution effect by itself. Pi retains one request, no transport retry, no tools, fixed endpoint and command-local limits. Available token counts are returned separately from credit estimates; absent measurements remain UNKNOWN. Runtime-local provenance binds exact operation context and actual terminal stream observation; a caller flag, cancellation notification or ordinary Promise rejection cannot release the physical slot. Unknown terminal state stays unknown. Offline evidence uses the actual installed Pi request builder with synthetic stream/HTTP responses and denied socket creation; it is not actual Provider/configuration/quality evidence. Persistent policy/material-grant and operation admission consumers must follow before activation.


## 26. E05-d — durable material grant and model operation consumer

BF-R03/07/08/13, D1/D3/D4: a new schema120 task material grant records exact source-set bytes/hash, the configured policy hash, selected question disclosure and structure permission, task epoch and validity in the same transaction as its existing operation grant. Source selection alone or an old preparation/finite grant cannot authorize model dispatch. The first vertical model consumer constructs the clarify/generate-preparation payload from revalidated immutable source inspection and the explicitly selected question; browser callers cannot supply rows, paths, arbitrary payloads or result facts. Same-transaction reserve/issue stores exact payload/context before the existing shared model slot dispatch. Completion and usage settlement are atomic; only exact runtime-local provenance may mark physical settlement. Unknown state blocks another operation, cancellation/Stop/epoch/source drift prevents publication, completed logical work reads its saved result without another request, and one temporary retry remains the same logical operation. No actual project migration or Provider activation follows these synthetic consumers.


## 27. E05-e — existing local settings responsibility consumes a fixed non-secret policy

D4/BF-R02/03: local ProviderSettings/Application receives a small policy-file Port, returning only the shipped approved policy identity, fixed recipient/material classes and current model-slot availability. The policy is immutable version1.0/revision1 with Change005 D4 plus the frozen product-input SHA as approval reference; it is not proof that a credential/account or material scope is currently usable. The local Adapter can create that exact non-secret file only in its composition-supplied settings directory, atomically without replacing an existing different file. Missing/edited/unknown-version/symlinked files fail closed; ordinary reads perform no writes. No Keychain, environment credential, actual settings directory or Provider access is needed by this increment. Task authorization consumes the exact currently read policy hash; HTTP cannot supply a policy or change its identity, retry rules or limits.


## 28. E05-f — independently bounded preparation proposals and periods

BF-R04/06/13, D4: before a model preparation proposal reaches the local executor, its bindings must cover every disclosed source/sheet exactly once and include both members and orders, with only exact disclosed headers. Missing, duplicate or foreign sheets reject; model completeness claims cannot replace independent row/byte qualification. New membership2 semantic payloads validate real calendar dates, positive equal-duration non-overlapping half-open periods. These are validation constraints, not defaults: missing semantics remains null and requires clarification before analysis. Legacy finite payload validation is unchanged. Generated code remains untrusted and no proposal grants execution authority.


## 29. E05-g — automatic model proposal to existing Preparation application

BF-R04/06/07/13, D2/D4: a composition-owned workflow accepts only task/grant identifiers and cancellation. It invokes the existing versioned model consumer at generate_preparation; a question returns a durable waiting result without local execution. A preparation proposal is read back from the exact successful persisted model execution and passed to the existing Preparation application with its stored SourceSet and the same grant. No browser-supplied code, binding, source identity or prepared-result shortcut is accepted. Existing source/epoch/Stop/operation admission, trusted physical outcome and independent qualification remain mandatory. This increment does not itself authorize semantic confirmation or M1 when required business inputs are missing.


## 30. E05-h — first selected-text authorization before source selection

BF-R01/03, D1/D4: the same membership2 material-grant consumer accepts an explicit text-only scope for a new task with no selected sources. SourceSet identity is null, structure permission false and selected current question true; the grant binds exact task/revision/epoch/text/policy and operation scope digest. It permits only clarification. Model payload has no structure, source identity, rows or result; source/preparation stages reject before dispatch. A later SourceSet authorization is a different explicit material scope, never inferred from first text consent. Read/replay and current-text/revision/Stop fences remain identical; no implicit Provider activation. New schema120 permits null source foreign-key only for this consumed text scope, while model/source grants and attempts validate their discriminant and full operation binding.


## 31. E05-i — composition-owned background advancement after explicit authorization

BF-R01/07/08, D4/D5: a fresh committed browser material authorization starts exactly one composition-owned background workflow. Text-only scope clarifies; source scope uses the existing model-to-Preparation consumer. HTTP response/connection and readback do not own the work lifetime. Same command replay and GET never launch. The coordinator owns cancellation and collection; Stop requests cancellation after the durable fence, and service shutdown closes admission and requests cancellation without claiming that an abort physically settled anything. Pending completion and unresolved runtime executions remain explicit. A newly constructed coordinator is empty and never scans/restarts saved grants. No timer/scheduler, installed service or automatic post-restart continuation. Browser readback exposes only bounded question/status and grant scope metadata, not generated code or credentials.


## 32. E01-f — natural question does not assert a direction

BF-R01: the browser creation consumer saves the user's exact question and leaves the hypothesis title empty until actually elicited/adopted. It must not inherit the older finite workflow's fixed decline hypothesis. Existing create-session schema accepts an empty title, so no new business default/schema is introduced; legacy finite creation remains unchanged. Command replay keeps the exact original question and creation identity.


## 33. E05-j — optional bounded semantic proposal with exact selected-text attribution

BF-R01/04/06, D4: a preparation output may carry an analysis proposal containing only supported currency/time zone, two independently validated periods, and explicit valid-status values/meanings. Each period and status meaning cites a non-empty verbatim span of the actually selected task text. Missing selected text, fabricated attribution, unknown fields, duplicate/blank statuses or invalid periods reject. Attribution shows what the model interpreted; it does not make that interpretation a user-authored hypothesis, independent source qualification or accepted business fact. Absence remains absent and cannot acquire defaults or authorize analysis. Original selected text remains immutable alongside the structured proposal. Any unresolved semantic ambiguity remains a question before confirmation/M1.


## 34. E04-d — neutral overall-change intent and Finding2

BF-R01/02/05/09, accepted D1 neutral-intent decision: new prepared confirmation version2 records overall_change and an exact intent reference (immutable original-question hash; actual user hypothesis or null). Plan2 requires the same closed intent. Real consumers resolve it against the task revision inside existing authority transactions; missing/substituted/cross-version references reject. The two existing M1 algorithms remain unchanged. New Finding2 stores independently verified aggregate facts with direction decrease/increase/equal/not_comparable, and the same intent identity. A zero denominator prevents affected rate/difference comparison; verified refers only to matched available calculations, never a user hypothesis, cause or strategy. Reports and analysis-only human closure consume those facts and separately identify original intent, actual hypothesis and system interpretation. Legacy Confirm1/Plan1/Run4/Finding1 remain exact.

## 35. E05-k — actual local M1 operation admission and settlement

BF-R07/08/13, existing D3: the fresh schema120 operation ledger also consumes analysis/calculate, keyed by the exact Preparation, normalized selection, neutral intent and method identity rather than a newly generated run/plan ID. Issuance counts one local analysis and zero model calls. It has no model retry or preparation-correction entitlement; a completed identical calculation reuses its existing result, failed identical calculation cannot obtain retry by replacing a grant or run ID. The real Start3 and terminal publication must bind that execution in the same database transactions. Trusted local process outcomes bind actual run/plan/stage and observed close/not-started; ordinary rejection, cancellation or terminal product status is insufficient physical evidence. Unknown physical state retains admission blocking; unknown duration preserves lower bounds independently. Stop/late publication fencing remains independent. Old finite analysis/Plan1 contracts stay unchanged. First loop establishes durable admission/counting; actual Start3/runtime integration is required before this behavior is complete.

Late physical settlement after an already persisted Cancelled/Failed run binds the same run/Plan2/execution and only updates its operation ledger in one transaction. It preserves the original sole terminal receipt, product status and revision version; mismatched owner, plan, execution or terminal kind rejects. A running successful publication settles the meter and formal result atomically. No pending-operation bypass is exposed: only the actual issued operation linked to this Running run may pass its own publication guard; other issued/unresolved operations still block.

## 36. E05-l — qualified model semantics to actual prepared analysis

BF-R01/04/06/08: after model-result readback and independent Preparation qualification, the production coordinator consumes the same persisted model execution and qualified Preparation. An absent analysis proposal remains waiting without confirmation or analysis dispatch. Present periods/status meanings are revalidated against the exact selected task text; normalized columns come only from the canonical independently qualified conversion format. The system-derived M1 scenario identifies its model-proposal execution and system compiler, without representing a maintained user business asset or hypothesis. Confirm2 and Plan2 preserve original intent, exact Preparation and active grant/epoch. Every real consumer repeats the existing transactional guards. Result reuse never dispatches another calculation; Stop or unresolved physical execution never becomes completion. Verified aggregate explanation is a separate third-category model operation and must revalidate the actual successful Finding2; no row/code/path disclosure or automatic expansion from text-only scope.

## 37. E05-m — explicit verified-aggregate material consent

Accepted D4: fresh source grants explicitly store disclose_verified_result and show its third-category scope in the existing material consent form. Missing legacy field means no such permission, never true. Text-only grants cannot enable it. Explain independently resolves the same task/source/epoch/policy plus successful Run5/Plan2/Finding2/aggregate identity and current qualification/Stop fence. Only verified M1 overall facts and necessary semantic/validation summaries leave; rows, code, paths and arbitrary diagnostics do not. Valid consent is reused continuously, with no per-stage approval. Without it, verified local facts remain available and explanation authorization stays pending, without claiming the evidence-backed report finished.

## 38. E05-n — persisted model explanation report successor

Accepted D1/D4: a successful explain attempt does not itself publish a report. The same current verified Finding and immutable parent report receive one immutable successor draft with separately labeled AI interpretation, preserving independently verified facts and evidence. A private exact execution/parent/successor relation and versioned model_explanation source identify the actual persisted model result and verified input hashes. Transactional publication rechecks current task/grant/epoch, Run5/Preparation/Finding/aggregate, exact parent report and Stop/human closure; stale substitutions reject. Replay resolves the same successor without a model call or new version. Original report bytes/source and old finite contracts stay exact. Human review and final closure must bind this successor rather than silently returning to the pre-explanation template. Unknown commit outcome must be read back, never blindly republished.

## 39. E05-o — successful UNKNOWN model consumption

BF-R07/D3: a physically settled successful model result may lack provider token usage. Persist its original trusted result bytes/hash, keep token usage UNKNOWN, and preserve previously recorded lower bounds in the operation ledger. Reopening and replay must accept the exact ledger reconciliation, never require invented known usage or overwrite the original result. Known-result values still match exactly; regressing bounds or unrelated usage changes reject. This corrects the private integrity comparison under the existing D3 contract.

## 40. E05-p — consent renewal continues existing verified result

BF-R01/06/D4: when the current revision already has a successful Run5/Finding2, a new explicit material grant continues at verified-result explanation. The same real result/preparation/grant/epoch guards run before disclosure; no preparation or calculation repeats, and a different grant ID does not reset retry accounting. Without third-category consent the local verified report remains readable and explanation waits. The existing material UI remains available for this missing consent until human closure. Initial work without a current result follows the preparation path; construction/readback never resumes either path.

## 41. E05-q — exact user clarification successor

Accepted D1/D4: a successful current model question may receive an explicit selected answer. Preserve original question/hypothesis; private fresh120 clarification binds task/revision/source-or-null/epoch, question execution/result hash, original question hash, reply and predecessor. A single transaction saves answer plus successor material grant/command identity; replay reads the same result, changed command payload rejects. Outbound membership2 carries original selected text and exact separately selected clarification chain, never a model proposal disguised as user input. Plan2's optional clarification identity resolves the actual record, remains bound through Finding2/report, and absent fields preserve old canonical bytes. Old question/source/Stop/UNKNOWN or failed policy identity rejects before effects. Existing source preparation may be reused only if its bytes/bindings/code remain exact; changed semantics changes the analysis identity.

## 42. E08-a — browser report copy without invented delivery receipt

BF-R10/UI08: authenticated report-copy GET resolves task/current revision/report through the existing verified export projection; returns a bounded HTML attachment with no-store and restrictive CSP. It cannot accept a path, write a file, mark export success or change the current report. The browser offers the current saved report, reports fetch failure separately, and after starting a download asks the user to check the download list; no OS save receipt is fabricated. Existing stored report remains intact after failure. Historical same-revision versions remain read-only.

## 43. E06-c — explicit service exit fences before shutdown

BF-R07/08/D5: closing the owned browser service first denies new HTTP admission, transactionally revokes live task authority/advances epochs, then aborts owned workflow work. Closing a page does none of these. Issued/unresolved executions keep their counted use and physical uncertainty until trusted settlement; closing a service is not a fabricated success or reaping proof. Closed human outcomes remain closed. Reopen/readback never dispatches work or clears retry history. Companion quit collects bounded termination separately and must record unresolved work truthfully.

## 44. E06-d — normal browser companion composition

BF-R01/08/D5: the existing Electron Main chooses browser mode under the same OS-held instance lock as Desktop. A Main-owned native project capability and verified toolchain compose the existing Application/Store, preparation/M1, shared model access/Pi Adapter, persistent policy, workflow and authenticated server. No Desktop workspace window is created in browser mode. Only after readiness does Main open the fragment bootstrap in a browser. Closing the page leaves companion work alive; explicit quit closes admission and fences tasks before abort/collection. Synthetic host verification uses an isolated userData/lock domain and existing Electron binary, never the real installed application's domain or Keychain. Its only substituted dependencies are synthetic provider transport/credentials and native selection of the owned fresh project, not terminal business outcomes.

## 45. E06-f — trusted fresh-project reopen

Accepted D5: project create/reopen is explicit through the current web entry (§51). Exclusive new-directory creation registers the complete120 project identity in a separate trusted-backend-owned origin catalog, binding canonical root/device/inode and database identity; copying a project or its marker cannot grant origin. Reopen acquires an OS-held project lease and checks the same complete schema and project identity before effects. Replaced paths or a concurrent holder reject. Startup atomically revokes old admission, fences live task epochs and marks issued execution physically unresolved without reducing use or resetting retries. Stored results and closed outcomes remain. No construction/GET/reopen dispatches work; explicit later continuation still checks physical uncertainty and exact current scope. Old100/110 and unregistered projects remain activation-closed. Existing-project migration/safe-switch is OUT_OF_SCOPE_WITHDRAWN by the latest user decision; it is not a remaining acceptance gate.

## 46–47. Withdrawn prelaunch legacy-project proposals

OUT_OF_SCOPE_WITHDRAWN by the user's2026-10-05 scope correction, recorded in the latest engineering-decisions section: this unreleased product has no user projects. Current acceptance covers new creation and the same project's save/close/reopen/refresh/Stop/crash recovery. Prior in-place migration, owner handoff and snapshot-copy/unique-copy proposals are not current requirements, blockers or accepted implementations; their UI approval wait is withdrawn. Original product input remains immutable and its corresponding legacy-project expectation is explicitly superseded by this current user decision. No baseline finite Profile/Plan1/Run3/4 consumer is removed.

Complete prior spec and UI bytes, candidate identities and static checks remain at worker/d5-copy-proposal-static-003 (spec08f39176d09c7429e141e90e8e7d1042429483466b02b84753699c30553affd5, UI255730c386709554d84d18759d05b6e8693369b4019ca6f8af06b174af43e506); review001 PASS/002 NEEDS_CLARIFICATION/003 PASS and legacy diagnostic failures remain historical evidence. Active ui-d5-copy.html is removed, not a retired production behavior or test. No migration/snapshot/platform is required for this candidate.

## 48. Validator P1 correction loops (candidate001 remains FAIL)

E01/BF-R01/02: for the already supported explicit `比较YYYY-MM-DD至YYYY-MM-DD与YYYY-MM-DD至YYYY-MM-DD` form, the actual four selected dates must equal the compiled comparison/current dates in that order. The latest authorized clarification containing a period supersedes prior quoted periods; ambiguous/unsupported expressions cannot compile by quoting unrelated accurate text. Preserve legacy finite semantics and equal-length/date validation. This is bounded parsing of existing supported input, not a general natural-language date platform.

E03/E05/BF-R06/13: a trusted physically settled conversion/output qualification failure may request one corrected preparation proposal and one second execution on the SAME preparation operation. Temporary model retry remains separate and bounded; Stop/UNKNOWN/expired authority/source change/isolation failure never trigger automatic correction. Persist failure and expose readable failure state after exhaustion.

E05/E06/BF-R07/08: explicit new authorization may reference independently revalidated immutable prior clarification/preparation/verified draft under the same task/source/intent, retaining original epochs/receipts/counts. No old grant revival, implicit restart, repeated completed calculation or UNKNOWN release. The exact reuse binding is covered by the accepted Mini D1/D3 decision below; no pending contract gate remains.

Mini accepted the bounded D1/D3 reuse correction: Store-derived optional grant `reuse:{version:'1.0',predecessor_grant_id,clarification_sha256,preparation_execution_id,run_id}` (nullable artifact references), exact task/revision/source/question and no pending physical state, no cycles. Revoked predecessor grants provide provenance only. Optional `authority.resume_preparation_sha256` in this unpublished Plan2/confirmation path permits current authority to consume an old-epoch Preparation only after Store resolves the current grant's exact reuse; absent field retains the strict same-epoch rule. Existing successful Run/Plan/result bytes remain immutable; current grant authorizes new explanation/human effects. Failed authorization rolls back atomically. Unknown or substituted identity cannot manufacture a reuse record.

Corrected-preparation reuse resolves the original settled model output by the actual qualified Preparation code/bindings/source/epoch and current grant reuse identity, never merely the first generator result. Byte-identical rejected code/bindings cannot consume a duplicate local attempt; a distinct correction uses execution index1 on the same operation. Exhausted conversion failure has a readable current status and does not display the prior model-success advancement message. Native recovery evidence must preserve every earlier usage/Preparation/Run value and prove zero dispatch before explicit renewed authorization, then only the missing operations.

## 49. Necessary clarification during a bounded correction

BF-R01/06/13, SC04, UI04/10: after a settled preparation conversion failure, a current answerable correction question remains visible and usable alongside the retained failure/usage. Current status says necessary information is awaited; exhausted failure without a question still suppresses stale model-success advancement text. Submitting the answer captures its exact text before busy rendering and uses existing current-grant clarification handling. The same preparation operation permits only its remaining index1 execution; answering cannot reset prior attempts, revive an old grant, release UNKNOWN or bypass Stop/expiry/source checks. This repairs the accepted clarification path, with no new state framework or product scope.

## 50. Retained Desktop entry wiring (historical browser host; superseded by §51)

BF-R11, SC01, Q4/spec44: the existing desktop:start command accepts either no application argument (unchanged Desktop) or exactly --xanthil-browser. Both wrapper→Forge and Forge→Electron preserve that explicit flag; other arguments reject before process/build/import effects. Existing owned process-group termination remains unchanged. Main's trusted compiled development decision selects the existing development keychain helper for both window/browser assembly; packaged mode retains its existing helper. No arbitrary helper environment path, credential namespace change, Provider probe or new settings system. Missing/unavailable helper retains existing unavailable state and no fallback/automatic model work. Build artifacts are generated through the existing normal developer build, not presumed pre-existing.

Normal Main bundling additionally emits a fixed seven-file runtime resource set (supervisor.py, browser index/bootstrap/workspace/client/styles and logo), with source-byte SHA256/length manifest. The Main-only Vite plugin replaces exactly one module-relative URL in each of executor/local-server and fails missing/duplicate/changed matches or conflicting assets. Source modules remain platform independent and execution logic unchanged. Built development resolves beneath its own bundle directory; built packaged mode uses Electron's trusted app.isPackaged/resourcesPath and the same fixed subdirectory copied by Forge extraResource. No source-checkout path, arbitrary environment path or dynamic resource scan. Existing toolchain resources/internal signing remain intact. Offline actual dev/prod bundle evaluation and resource reads establish this assembly; no installed-app/signing/real-Provider acceptance is inferred.


## 51. Independent local web entry (current; supersedes Electron host choice)

BF-R01/07/08/11, UI01/05/06 and the 2026-10-05 explicit user correction: a normal Node service owns the existing Application/Store/ProviderSettings/Pi/executor composition. Electron is not a startup or use prerequisite. The preceding Electron entry/build checks remain historical scoped evidence. No replacement business core, legacy migration, installation, actual Provider permission or system daemon is introduced.

The project assembly can be constructed and closed independently of an HTTP listener. It exposes the existing workspace and readback consumers, registers a newly created project through existing origin identity, and reopens only those exact capabilities. Construction/readback/reopen never dispatch model work. Closing collects the existing workflow and preserves unresolved occupancy. The legacy companion composes this same assembly with its existing listener; its existing tests remain.

The webpage creates by a validated display name under a configured Projects root, or selects an opaque identity from the existing origin registry. It never submits a filesystem path. Origin realpath/device/inode/schema checks remain authoritative; arbitrary copied or missing directories cannot acquire authority. User experience files are excluded from engineering fixtures.

One private profile owns a held SQLite exclusive service lock and owner-checked 0700 directory/0600 control record. Normal start/open/stop operate one independent local Node service; a launcher or page exiting does not terminate tasks. Explicit service stop collects bounded existing work; crash/restart preserves records, fences stale epochs and never automatically dispatches. Unknown termination is not inferred from PID disappearance.

The local control credential is distinct from browser sessions and only admits exact local control requests without browser Origin/Cookie. It issues bounded one-use bootstrap fragments, never logged or persisted. Browser exchange creates host-only HttpOnly SameSite=Strict cookies without persistent lifetime; restart revokes sessions. Exact Host/Origin/CSRF and no-CORS remain. A bootstrap grants read access only. First explicit project creation/selection may claim an unowned control slot; another page remains read-only until explicit takeover. Configuration uses existing sanitized read and explicit refresh/test/save/delete/proof/shared-slot consumers, never passive credential reads or probes. Tests use synthetic credentials/transport only.

### 51.1 Pending selection versus explicit takeover

BF-R08/11: a project selection captures its admitted control generation before asynchronous body/selection work. If another page explicitly takes control before completion, the old response must not disclose that page's new nonce or grant stale write access. An already-admitted project effect may have persisted; the old page reads the exact command receipt without repeating selection and without obtaining authority. First unowned selection may claim control only if its generation stayed unchanged; existing-owner selection retains only its admitted generation. New owner remains usable. A rejected or lost response does not erase receipts, infer rollback, automatically resend, or add a user confirmation.


## v1.1 OA-RT02 — backend bounded credential discovery

Private Pi Adapter initialization/explicit refresh only, with explicit effective credential-read authorization. Discover only approved recipient-matched environment tuple, zcode provider entries at exact approved endpoint, and pi auth minimax-cn/minimax entries. Primary MiniMax-M3/minimax-cn and backup mimo-v2.6-flash/xiaomi-token-plan-cn retain fixed endpoints. No access before permission; no unmatched environment pairing, duplicate same-priority candidate selection or arbitrary scanning. Missing/damaged/unreadable sources produce safe specific status; same-tier conflict blocks that recipient. Status exposes only provider/host/configuration-readiness, never keys or paths; discovered key remains backend-only. Readiness is not actual Provider compatibility, request authorization or OA-RT PASS. Readback never rescans; explicit refresh replaces a private snapshot. Tests inject synthetic source contents; actual specified-file discovery uses granted authority only. OA-RT05/06 persistent requests and actual models remain subsequent consumer work.


## v1.1 OA-RT05/06 — durable request admission

Versioned business request identity separates product task/revision/Run/Attempt from Pi state. Same task+revision+logical-operation retains at most original and one extra physical request across restart/Run/Attempt/provider fallback; changed scope/input under an existing operation is a conflict, not a fresh retry. Reserved request has no physical usage; issue records one call durably before dispatch. Issued/UNKNOWN prevents new work until actual reconciliation; not resolved by refresh or new Attempt. Only terminal temporary_failure may retry and stop/expired authorization blocks it. Known/UNKNOWN usage and failure history persist; unavailable billing never becomes zero. Explicit stop fences issuance and late publication; late terminal usage may still reconcile. Explicit resume preserves budget and unknowns. Readback neither creates storage nor auto-resumes. No secret, raw prompt/model output or internal thought in ledger.

### v1.1 open IR first executable method (partial OA-S/OA-C)
The first consumer binds a selected visible source/sheet and one existing column, including immutable full inspection hash, source hash and actual header binding. Changing the metric binding changes the computed value. Execution checks all those identities before reading every bound row. Numeric values must be complete safe integers for this method; missing, duplicated, unsupported/decimal or unsafe values are explicit errors, never excluded silently. Result includes plan/input provenance, unit as provided (no inferred currency), row count and checked-integer method identity. Source drift invalidates the result. This increment is not a report/UI/independent-verification acceptance claim or authority to generalize existing M1 rows.


## v1.1 网页纵切接线（实施前规格，OA-S01/05、OA-C02/03、OA-RT03/04/06、Q11-01/11）

既有同机 HTTP 鉴权与项目所有权保持。开放分析命令独立于会员合同，位于 /v1/open-analysis；不把未知业务问题送进会员默认流程。Profile 注入原 Pi Runtime、现有文件检查器、SQLite Task/请求账本和独立核验。普通启动/读回/刷新不读取凭据、不调用模型。

用户提供问题与选定材料并同意本任务共享后，后台建立不可变选定资料快照及接收方配置身份。命令ID也是任务ID，重复提交同一ID读回已有任务；ID内容冲突拒绝。必须在模型出站前保存 running 与 Run/Attempt/grant 身份。HTTP立即返回持久状态，模型/工具在服务中运行；关页不会停止。GET只读。成果保存后才能显示保存成功。停止先持久围栏并取消；迟到不得发布。服务重新接管只把 running 置 UNKNOWN，绝不自动重新执行。

当前纵切仅证明选定数值列求和；不得宣称开放方法、完整快速能力或专业模式完成。无材料/权限/有效主备配置有明确缺口且零出站。历史读回使用同一项目的真实任务列表，原项目之外不给路径或任务读写。

测试边界：正常鉴权 HTTP → Profile/Application → 实际文件检查、SQLite保存读回及独立计算。离线测试只替换外部模型/凭据来源，不替换存储与计算。真实Provider同候选证据后补，Stub不计OA-RT可用性PASS。每个新增行为在实现前保留真实RED。

CSV 接线修正：工作表身份使用现有检查器的精确 csv/OOXML sheet ID，不要求 UUID；按显式整数求和方法接受规范十进制整数字符串与 number 单元格。空值、前导零、非整数、非数值类型和安全范围溢出拒绝。独立核验从同一来源快照以 BigInt 独立重算；不赋予字段业务身份或单位权威。

工具协议修正（OA-RT01/C01）：机器IR的 version 固定由 Application 拥有，不要求模型选择或回显。set_framework 模型参数只含业务目标、精确来源/工作表/列、受支持方法和单位建议；Application 编译为既有 1.0 IR。模型不得选择其他内部合同版本。SDK公开schema必须带明确类型；模型工具语义不能靠猜测常量类型。

字段绑定修正（OA-C01/RT02）：模型可以使用精确物理列 ID 或精确唯一表头名称提出绑定；Compiler 解析为同一不可变物理列。二者命中不同列或表头重复时拒绝歧义，不猜列、别名或模糊匹配；后续执行和核验只消费编译后的物理绑定。


## v1.1 受控显式恢复与持久对话（实施前，OA-S05、OA-RT04/05/06、Q11-11）

沿同一产品Task/Run保存Adapter独立的可见对话与工具结果检查点；排除思维链、Key、SDK类型及原始错误。检查点带已消费模型轮次，已完成计算/独立核验另存，可校验身份与输入范围。写入回执未确认立即围栏，不作为已保存。记录版本1.1只增加本任务JSON内容，SQLite表结构不迁移；新读者保留1.0读回，历史输入不重写。

显式继续仅允许已停止且物理请求已结清的任务；UNKNOWN/issued/reserved仍拒绝。先核对同一材料/配置身份，保持原计量及逻辑操作，不清账、不自动续跑。模型已观察过的资料/工具结果在恢复时真实重建；已完成计算不重做。被停止的未完成模型操作只能在用户显式继续后消费剩余一次请求，原请求+额外请求仍最多两次；停止本身不发额外请求，未知不能靠重试解决。新问题或范围修改与恢复区别记录，旧报告不覆盖。

本轮先验证持久检查点及已结清停止恢复；重启UNKNOWN需要实际对账条件，缺条件时准确保留UNKNOWN。后台新JSON字段/原Pi Adapter内的消息转换由工程主Agent负责，不引入第二Runtime或新的数据/Provider权限。

## v1.1 同材料自然追问与版本保留（实施前，OA-S03/05、Q11-03/10/12）

同一任务的自然追问沿既有选定材料与有效授权，不重复首次材料许可。只有明确发送触发新轮，不由刷新触发。仅允许已保存/失败/已结清停止版本；在途/UNKNOWN拒绝。修改命令绑定expected_revision和唯一command_id，原子保存前一版本的完整来源、框架、计算、核验、解释和对话，当前版本+1及新Run/Attempt/逻辑操作，原调用账本不变。并发旧版本命令拒绝，重复同一命令读回而不重新执行。JSON 1.2记录包含版本历史，不变更SQLite表结构，保留1.0/1.1读回。

模型真实读取前序可见上下文并选择是否改框架。沿同源同框架的已核验计算可复用，仅改表达不重算；新框架绑定/方法不同清除下游计算，必须实际重算和核验，旧报告不能显示为新成果。版本历史只读，切换视图不执行；没有新报告时明确新版本尚未交付。新增材料/改变接收方仍按已有材料授权差异机制处理，本增量不自动加入任何新资料或扩大Provider权限。

## v1.1 可组合本地查询增量（实施前，OA-S01/03、OA-C01）

保留原1.0整数求和合同与承重负例；新增1.1框架允许sum/count/min/max/mean、精确列分组和多个eq/ne/ge/le筛选组合，不以会员模板选题。Compiler绑定实际唯一表头到物理列并对整个检查快照及所有筛选/分组表头签名；未知方法、非规范数值、漏列、重复行和篡改拒绝。框架版本由Application拥有，模型只选择业务方法与参数；组合改变真实消费者输出，而非只改hash。

本增量数值仍为规范安全整数；mean表示约分后的精确分数，不用浮点虚假精度；分组输出保留类别、行数及值，独立反向BigInt算法重新选择全量资料并复核每组、覆盖行数及输出身份。无匹配行按明确NO_DATA处理，不将零行平均值写成0；count只核对已绑定字段完整性，非空规则不由产品臆造。展示图表只能消费保存的实际分组结果，表格同源可读。多源关系与受控生成Python仍为整体必做后续，不以本增量替代完整开放分析验收。

### 工具可空分组的真实故障记录

真实MiMo的一个修改回合将group_by输出为字符串"null"，Compiler按不存在字段正确拒绝；原始可见消息检查点与工具事件均保存这一参数。实际已安装SDK的空值转换正例通过，不能归因SDK，更不能把该通过补作因果RED。工具契约继续允许省略或JSON null，明确禁止将无分组写成字符串"null"；不自动把一个可能真实存在的同名字段改成空值。该失败5次模型消耗保留，后续继任真实候选重核。

## v1.1 内建Skill／Prompt真实选择（实施前，OA-S06、Q11-08）

复用当前内建方法及提示消费，不安装外部包或读取任意指令。提供版本化一般分析、分组汇总两种内建Skill；一般分析允许已实现方法，分组汇总要求真实group_by绑定且实际消费分组查询，缺少分组不得生成成果。Prompt提供专业结构/简洁表达；只改变报告表达指令，绝不改变语义、材料、允许工具或核验资格。

网页选择可查看用途、版本、资料条件，选择本身不运行。首次提交或同材料明确追问记录选项身份，持久读回并供该Run真实消费；历史保持旧选项。未知Skill/Prompt拒绝。普通选项默认内建一般分析/专业表达，不赋予字段业务权威。参数变化在明确新版本命令内处理，原有材料授权不扩大。

## v1.1 同任务专业六阶段接线（实施前，Q11-01/04/05/06、OA-C03）

模式切换在当前同一网页控制器内完成，不再进入历史legacy表单工作台，不发请求、不创建任务/Session、不换材料/账本。保留PX004新建分析/数据准备/本地处理/循证分析/报告/执行反馈六阶段导航、来源组件class及绿色文字品牌；内容只消费当前后台Task/version/source/framework/实际工具结果/报告。历史专业会员能力随后接线，不能以开放任务六阶段壳声称OA-S02完整。

资料区显示当前选定资料真实检查结构及前10行预览，标明预览并保留全量行数；执行区只显示真实持久工具/请求记录；报告区复用真实保存图表/核验/模型解释；没有正式Decision/Expected的开放任务在反馈区如实表明，不能写模拟行动。导航/模式仅切视图，不等同执行完成阶段或资格。快速与专业保留相同当前任务、版本与回执。

### Explicit tool grouping protocol and final commit receipt

Two genuine MiMo successor attempts decoded the no-group parameter as the string "null" and correctly failed binding. Retain both failures; the direct installed SDK JSON-null test passed, so no causal RED or SDK fault is claimed from that test. The model-facing tool now has an explicit group_mode none/column choice. None compiles to internal null and does not consume a group field; column requires an actual exact group field. The legacy direct nullable proposal remains supported internally. No string-to-business-fact guessing is added; the explicit selector determines the consumer branch.

An atomic saveOutcome receipt closes the running lease. Application validates that committed receipt, rather than querying running authority after the save and incorrectly reporting rejection. Store admission still checks current identity/epoch/authority before commit; expired and late writes remain rejected. Stop after a committed saved outcome does not un-save historical facts.

### OA-C01/RT02 controlled analysis code consumer
The existing deny-default local preparation supervisor is reused for analysis Python. The composition root selects a fixed result.json output contract; model code cannot select paths or output admission rules. Only exact selected snapshots enter a fresh owned run. Output admission rejects extra files, links, directory replacement, oversized or malformed JSON. A trusted receipt binds code, snapshots, policy, physical outcome and output bytes. Such output remains unqualified until the independent selected-IR verifier succeeds. Existing member CSV conversion output and its tests remain unchanged. Cancellation/unknown physical settlement cannot be reported as qualified completion.

Controlled-code correction is bounded by durable execution admissions for the exact operation: at most two code executions including the original. A physically settled code/output/proof failure may return one correction observation to the model. Authority, changed source, cancellation, unconfirmed save or UNKNOWN settlement fences further requests. The generated program must read SOURCES[0] JSON (plan and inspection); OUTPUT is an existing absolute directory variable, not a literal relative directory. Grouped value is the canonical JSON serialization of sorted groups; independent verifier, not model self-check, determines qualification.

Analysis-only code diagnostics may expose a fixed exception category and, for NameError, an ASCII Python identifier. No exception message, traceback, path, cell value or arbitrary code output is sent to the model as a diagnostic. The existing member preparation path retains its previous no-diagnostic behavior. Trusted supervision still establishes physical settlement independently of this untrusted diagnostic.

### OA-S03/C02 material amendment in the same task
Adding or replacing task-selected material is an explicitly confirmed revision, not silently ignored and not a new analysis task. Source inspection reads only supplied bytes, verifies exact identities/hashes, and merges by source_id with the existing immutable selected scope. A material scope change receives a new grant and revision/Run/Attempt/operation while retaining prior versions and reports. It invalidates the previous framework/calculation/proof; visible history survives, but the agent must reinspect current material. Unconfirmed change performs no inspection, credential read or model dispatch. Duplicate amendment must compare question, preferences and exact material bytes against the already accepted revision; reads/refresh do not repeat execution. UNKNOWN or physical pending remains blocked.

Grouped code outputs are qualified by facts, not JSON object property insertion order. Before verification the host validates exact group fields and that the model value decodes to those same groups; it canonicalizes field order for durable result serialization. A different value, missing/extra group fields, counts or numbers still fails; no numeric correction or inferred fact is permitted.

Code output may use a finite exact decimal or rational string for a numerical fact; host serialization reduces it to the same exact rational form used by current IR. This is representation normalization only, never rounding or changing a numeric value. Different fractions fail independent verification. Explicit null for unused groups is equivalent to absent; nonempty groups for an ungrouped plan still fail. Analysis-specific trusted stdlib math/decimal/fractions/statistics are loaded before isolation, without installing dependencies or extending sandbox authority.

### OA-S06/C02 source authority bridge
A product003 collaboration source may explicitly identify a saved open-task origin. It resolves from actual current task/Run, scope, qualified report and independent proof; no formal Finding/Acceptance/Closure is fabricated. Legacy Case reads retain their existing prerequisites. Source mismatch or unsaved/UNKNOWN origin is ineligible. Open-origin parent/child cannot adopt formal Decision or Expected through this bridge. Existing child lifecycle, exact subset/result version, return, review and stopping semantics remain applicable and require actual integration evidence before being called delivered.

### OA-RT04 physical request collection
Logical abort is not physical completion. Before closing an aborted lease as stopped, the Application collects owned Runtime requests for a bounded five seconds and consults the durable request ledger. Any reserved/issued/UNKNOWN request keeps the task UNKNOWN and prevents explicit resume and late publication. Runtime collection never dispatches a request, reads credentials or changes the retry budget. Late provider completion may update accounting only; pending physical code remains governed by EXECUTION_UNKNOWN independently. A settled stopped lease can resume only by the existing explicit command.

For an owned explicit model stop whose physical collection times out, retain the stop lease until trusted late ledger accounting settles. The user's explicit resume may reconcile that same owned stop lease to stopped, then use the existing resume budget. Recovery after service restart clears ownership and remains UNKNOWN; code EXECUTION_UNKNOWN also clears the stop lease, so model accounting cannot resolve an unknown native process. No read or late response restarts execution.

### OA-08/Q11-10 exact open-outcome judgment and report copy
A user acknowledgment is a separate atomic durable record of an exact saved outcome/version/hash, never a mutation of computed facts or a formal Case/Closure/Decision/Expected. Command replay reads the same receipt even after later revisions; contradictory command content or stale version/outcome is rejected. Revision retains old judgments with old outcomes and clears current judgments. Judgment does not call a model, renew grants, restart analysis or change saved task completion. Cancel writes nothing; lost response is recovered by command readback, not resubmission.
The authenticated report-copy endpoint returns the saved exact version's existing facts, limitations, model explanation and evidence identities as UTF-8 Markdown, without raw detail or arbitrary paths. Copy/download request and browser actual file persistence are distinct states. Current and historical report views must label their exact version and never substitute a previous report as current. UI retains the approved report/workspace/card-actions and judgment explanation dialog.

### OA-S06/RT05 open-origin collaboration consumption
For explicitly configured uncapped_metered open-origin collaboration, no cumulative turn, duration or monetary ceiling is imposed by the legacy Assistant shell. Unknown money is null rather than a zero estimate. Legacy Case/member policy remains unchanged. The actual runtime must still persist every original/one-extra request, obey per-request deadlines, selected-subset authorization, sequential ownership and physical cancellation. Open configuration cannot grant this policy to a formal Case source. Finite legacy limit fields retained for compatibility are not active cumulative limits in this mode.

The composed Pi Runtime has one sequential active model owner across parent and child task identities. Starting another task while an owner is active must reject before issuing a provider request. Runtime instances are composed once per active project and shared by parent and child; model/session identities never determine parallel entitlement.

Runtime must collect ordered durable continuation writes before returning its successful response to Application. Asynchronous SDK event subscription is not a durable save receipt. A failed checkpoint write fences outcome publication; stop rejects queued late writes. This applies equally to parent and scoped collaboration consumers of the same Pi Adapter.

### OA-S06 scoped child Runtime reuse
An open-origin child consumes the same composed OpenAnalysisRuntime/Pi Adapter as its parent, with only its explicitly selected history, selected report summaries and independently qualified minimal aggregate. It exposes a read-authorized-context tool and a finish-result tool; no parent raw-source, arbitrary file/network, formal-decision or independent-validator authority is inherited. Result references bind exact authorized reference entries by host-owned index. All output remains MODEL material pending user return/review.
Product003 Attempt may retain a business-visible continuation checkpoint tied to a deterministic logical child operation. Explicit stopped resumption preserves committed messages/ordinal and the durable original-plus-one request budget; changing approved task text/material creates a distinct scope. Runtime callbacks cannot update after stop or source change. Parent revision invalidates the child's source before further outgoing/tool/result effects. Request ledger identities remain product task/Run/Attempt/grant identities and are not Pi session IDs.

### OA-S06/C02 — 子任务真实 Runtime 身份与恢复
开放分析子任务复用父任务的 Pi Runtime 与项目持久请求账本。授权上下文的精确摘要、子任务 session 和配置共同绑定 operation/grant；相同已授权工作显式恢复复用原 operation 及持久 checkpoint，避免清空重试次数和重复工具。仅当前来源及生命周期有效、未停止的运行可保存 checkpoint。真实返回 Provider 必须属于该授权配置的主/备用精确配对；未知费用保留 null。既有正式 Case 的模型、上限及输出验证不改变。恢复前不得存在未结清的物理请求，读取不得发出模型调用。

### OA-S06/C02 — 网页协作入口的 composition 与读取边界
正常 Profile 使用同项目 OpenStore/003Store、同 Pi Runtime 和同项目账本。协作父来源仅为当前已保存且独立核验成果；旧版本或父材料改变不能继续。创建/启动/停止/发送/回流/采纳均要求正常 HTTP 控制权与 closed command；GET 只读。启动前显式核对当前配置身份与父授权；该操作的未结清物理请求禁止恢复或项目切换。003 已有结果身份、版本、sha、用户采纳记录原样复用，采纳不新增正式 Case/Decision/Expected。独立子任务默认只选择明确报告及最小已核验汇总，不传父原始文件。

子对话需要业务说明时可用 ask_user 返回具体问题，不得编造答案。保存问题及 checkpoint 后进入既有 Waiting；用户回复须实际追加到业务 continuation 后才继续。子结果的人工关联采纳仅存003材料关系；普通界面保持批准的独立子对话展开与返回主对话，不另造页面或节点审批。

### Q11-09/OA-S06 — Fork 的真实可见历史
Fork 继承明确选择、截止于真实父对话锚点的可见用户/助手消息；没有有效锚点不能创建。开放任务读取保存的业务 checkpoint（排除工具及内部思维），稳定消息身份绑定实际 Run/Attempt 和原文摘要。003 兼容存储可导入这些可见消息，并显式记录来源与导入时间；不伪造003模型 Attempt 或模型费用。重复导入同源消息幂等，内容改变、跨任务或过期来源拒绝。子 Runtime 仅消费已选消息及报告/最小汇总；回流与采纳仍沿原003精确结果身份。

### Q11-09 — 人工采纳材料真正进入父分析
只有003已明确采纳、来源仍对应当前任务/版本/材料的精确结果可在后续父分析中选择使用。父任务保存最小材料记录（材料/结果ID、结果版本及摘要、来源任务版本/材料摘要、MODEL分类、user_adopted和结果值）；不保存整个子任务源上下文或把意见变成核验事实。Runtime 必须看到该已选材料，checkpoint/版本历史可读回。材料变动生成新分析版本；表达保持核验事实，计算方法变化仍实际重算。变更原始材料时清除这些旧范围材料，历史保留。普通读取/采纳本身不触发父模型，HTTP不能自行提交伪造材料对象。

### OA-C01/S03 — 十进制数值组合方法
增加IR1.2，显式 decimal 数值模式，保留1.0/1.1全部兼容和负例。基于真实选定字段及全量行绑定，支持十进制 sum/count/min/max/mean、分组与筛选，精确有理数结果不做隐式浮点舍入或默认币种。主执行采用统一十进制刻度的安全整数累计；刻度或累计不安全、非规范数值、缺行/歧义/空集合明确拒绝。独立核验从原始受检值反向逐行作BigInt有理运算，不调用主计算器或复用其累计结果，核对筛选/分组/行覆盖/计划/值。生成代码仍走已有实际隔离与两次上限，并受相同独立核验约束。既有整数版本不自动放宽，模型必须选择当前支持数值模式。

### OA-S04/Q11-02/12 — 在主对话说明真实缺项
新增主任务 ask_user 工具，保存具体问题和有效身份后进入 waiting，尚未形成成果不标 saved/PASS。保存/权限/停止/源身份/未知执行等硬失败仍终止。受支持方法的绑定缺失、数值条件不满足、空结果等业务条件返回具体有限工具反馈，让模型依据实际观察提出必要说明或合法修正，不能把所有业务缺项都当授权失败。后台不编造答案。用户在同一对话回复创建可追溯版本，读取、刷新、重启不自动回复或运行；已授权相同材料不重复批准。旧失败和问题记录仍保留。
# OA-RT05 deadline correction
An operation-local model deadline is a temporary failure only after the owned physical response has settled. It may use the one shared extra request (backup included), with SDK retries disabled. User stop/revocation never retries. A deadline whose response remains in flight after bounded collection stays UNKNOWN and fences further requests. Late deadline output is never publishable. This corrects the observed backup clarification timeout without changing the approved time or request budget.

## OA-S03/C01 multi-source union method increment
An explicit union_all framework binds 2–32 distinct selected source/sheet pairs and each input's metric, optional group and filters. It preserves all selected row occurrences; it does not infer joins, deduplicate business records or invent cross-file relationships. The shared operation/unit/numeric mode must be stated. Each source digest and physical binding is part of the immutable IR. Full local calculation and separate reverse rational/integer verification consume every bound input, including fields mapped from different headers. A source/mapping mutation invalidates the plan; duplicate pairs and group-shape disagreement reject. Model-generated code receives the original authorized inspection and bound inputs, never fabricated file identities. This is a reusable multi-source method, not a declaration that all relationships or whole Change acceptance are complete.

## Professional membership framework / source qualification increment
The main task may propose M1 or M1+M2 against distinct actual source/sheet bindings. Each role maps exact existing physical/header columns into the existing canonical member/order calculation fields. M2 requires an actual group field; M1 may explicitly disable that field, represented as a local disabled empty value rather than claimed original data. Original values/row identities are preserved; source hashes, per-sheet mapping, derived byte hashes and lineage bind the materialization. Only explicit source bindings are consumed, and other sheets remain listed as excluded, never silently treated as computed. Existing date/amount/status/relationship preparation rules still qualify all bound rows before filtering. Business periods/currency/time zone/status must be provided and unresolved meaning returns to the same dialogue. A new bound source or parameter creates a new task framework/version and invalidates old qualified result. No fabricated formal records or new model Runtime. The existing native standalone method contract consumes this qualified materialization; independent verification rereads and rematerializes the same original bindings. Saving a descriptive membership result does not record a formal decision or Expected.


### Professional membership consumer increment
Main Agent continues full v1.1; no new execution approval or acceptance. Original professional/member/lifecycle regression collected: member-adapter-regression-001 253 PASS. Source-bound membership framework causal RED member-framework-red001; GREEN member-framework-green001. Multi-order-sheet causal RED member-multifile-red001. Same-task Runtime consumer causal RED member-consumer-red001; member-integrated-green001 27 PASS includes actual DuckDB/Python, M1/M2, changed reread, cancellation, durable independent reopen and corrupted proof rejection. member-native-green001 fixture import FAIL retained; successor002 PASS. member-consumer-quality001 and member-native-quality001 typecheck PASS; final post-integration quality pending. Framework supports one actual member source plus multiple distinct actual order sheets, exact row values/lineage, local derived empty group only for M1 without grouping. Native physical run maps to actual Task Run/Attempt and full primary/independent envelopes are persisted. No formal Case/Decision owner is fabricated. UI and real Provider consumer validation are next; full candidate, independent final verification and user acceptance remain unclosed. Historical FAIL/UNKNOWN/resources preserved.


### Open business Context before executable framework
Within the frozen OA-01/C01/UI requirement, main Agent adopts a private version1 context record on the existing frame/SQLite task body, not a new Runtime or management system. Build Context from exact current/historical user words and authorized source facts before compiling the plan. Keep MODEL_PROPOSAL goal/method/unit/grain/relationship separate from USER_SAID and SOURCE_FACT; undefined business authority stays unknown, not inferred from a header. Bind its SHA to the actual executable IR and save frame+context atomically. Store readback checks exact task-question lineage/source identity and recompiled binding; wrong/missing context or a forged source fact is rejected. Same physical framework may reuse its original Context on expression-only revisions; retained history prevents invented current user words. No new UI gate or per-tool approval, no extra Provider/credential/data permission. Expose concise classified context in the confirmed card/drawer; advanced identity remains inspectable. Existing context-free historical frames retain scoped semantics and must not be relabeled as Context evidence. Focused unit/Application/store/IR/verifier tests named before implementation, causal RED retained.

### OA-S06/RT04 — Exact browser collaboration command receipts
Normal quick/pro client assigns one command UUID to each child mutation, keeps its full pending identity across lost replies, and recovers only from an exact backend durable receipt. Read of a task or family is not evidence that a particular command was accepted. Reuse the existing product003 receipts table with a namespaced command fingerprint; no parallel Runtime or schema. Reserve before any effect, persist accepted only after action collection, and leave an interrupted reservation UNKNOWN. A repeated reserved command never dispatches; accepted repeats return current read-only state, conflicting body rejects. Scope/task/action are bound to receipt; arbitrary other command or parent cannot be read as acceptance. Legacy consumers without command IDs retain existing behavior, but cannot claim exact-command recovery. No new model permission or budget. Focused store/Profile/client/HTTP and legacy003 regressions apply.

### OA-S01/S04/Q11-07 — Actual local document source extraction
Selected MD/DOCX/PPTX/PDF/DOC/PPT/image originals keep original format, byte identity and source origin. The open-only reader returns full observed text/page/paragraph rows and parser limitations, not fictitious table rows or success from a truncated preview. Explicit failure for encrypted, unsafe archive, unsupported parser, blank/scanned PDF without qualified OCR and incomplete conversion; upstream UI retains originals and explains the specific next step. No silent passthrough or external hyperlinks/macros. Only fixed composition-selected installed readers may run; passive readback never parses or issues a Provider call. Legacy member CSV/XLSX routes retain their own strict format qualification. Focused reader/normal-open Profile/storage/UI tests bind source identity and uncertainty. Full-format current candidate qualification still required.

### Q11-02 / OA-01 — business understanding in the existing Context
Before an executable framework, the Agent may propose purpose, analysis object, scope, deliverables, hypotheses and concrete unknowns through a bounded business tool. These remain MODEL_PROPOSAL/MODEL_HYPOTHESIS rather than user statements or findings. Exact user text and actual selected-file observations remain separate. Framework persistence binds the normalized business proposal into the same Context/IR identity. A changed business proposal cannot silently reuse an older Context; unchanged expression-only tasks retain the already qualified physical plan. Existing quick drawer and professional analysis positions expose the saved fields without a new approval form, stage, asset promotion or authority. Unsupported/missing values remain unknown and can produce the existing ask_user path.

### OA-RT04 / Q11-11: service closure during selected-source inspection
Source reading belongs to the same task-owned lifecycle as model/tool work. Closing the service aborts and collects in-flight source inspection before any configuration discovery, task activation or Provider request; late reader success cannot start a task. Readback stays passive. This does not represent unknown native work as successful or create a new execution permission.

OA-C02/Q11-07: mixed selected-source requests validate every source identity, display name, format and aggregate byte boundary before the first parser effect. Invalid later entries cannot leave earlier unapproved parse work.

## OA-S01/S04/C01 — 文档引用成果消费者（实施前）

已读取的文档不是数值表格模板。新增同一开放IR的source_quotes分支：模型只提出目的及精确资料/工作表/行/文本字段引用，不提交事实内容；后台从当前有效材料全量快照抽取原文与位置，逐项源绑定。最多32个引用、每条最多12000字符，不遍历其他资料或路径。持久Context、框架、工具结果、成果与读回沿现有链路。

复核从独立读回的相同授权资料反向定位引用，不调用主抽取函数；拒绝不存在/重复/被篡改引用、隐藏表和OCR未经确认原文。等级source_attribution仅证明原文对应及引用完整性，不证明原文观点正确、数值计算、因果或模型解释。报告和专业/快速工作区必须分别显示原文引用与模型解读；不得标独立算术核验或正式Finding。

不允许运行生成代码替代引用核对，不新增Runtime、原件写入、网络、权限或SQLite结构。旧算术和会员等级/反例保持。文档原文可在既有明确选材许可内供模型阅读；无法读取格式保留真实FAIL/UNKNOWN及可操作缺口。

Q11-10中文展示：报告、模型解释、可见对话及报告副本把已知内部核验等级名转为准确中文；原始模型/工具/存储证据不改写。只替换已知等级符号，不提升结论、不删失败/UNKNOWN、不把文档引用变成算术核验。

### Q11-05/06 professional hypothesis and collaboration projection
The PX004 analysis thread renders saved MODEL hypotheses as unverified cards, a report evidence link only when a saved outcome exists, and actual existing003 child lifecycle/result/return/review projections. No arithmetic verification promotes a cause hypothesis; missing result is not success. Opening a child is read-only; existing explicit child start/stop/resume/return/adopt controls retain their authority fences. Both modes retain the same task identity and dialog.

### OA-RT04/06 initial material-read stop and receipt
A confirmed first submission has one durable command identity before local inspection. It is stoppable before a Task exists. Parser cancellation is physically collected, late inspection or configuration cannot start a model or publish a task, and restart/readback never restarts. Pending and UNKNOWN remain visible and block a second write until exact receipt settlement; terminal failure/stopped receipt preserves the original request fingerprint, rather than inventing a successful analysis.

### OA-S06/C02 authorized document child subset
A saved document source_quotes outcome with valid source-attribution proof may supply its exact referenced quotation subset to an existing003 child. Child material contains only selected quotation text/location/source identity and its proof; not whole documents, other selected files, raw tool outputs or arbitrary paths. Qualification is attribution, not independent arithmetic, truth or formal Finding. Unconfirmed OCR, absent/changed proof, stale revision and unfinished tasks remain blocked. Parent grant and existing explicit child authorization/return/review fences still apply.

### OA-S04/Q11-02 business understanding before an executable plan
When describe_business is followed by a genuine clarification before any executable framework, persist its normalized MODEL_PROPOSAL understanding with the exact clarification identity and selected-source scope. Passive reload must show the same purpose/object/scope/deliverables/hypotheses/unknowns. No invented IR/Binding/Finding is required to save this unfinished understanding; it does not qualify calculations or child materials. Legacy clarification without business remains readable.

### OA-S02/Q11-10 formal member source admission
Formal professional review consumes a genuine source-bound member Finding admitted under a real Case owner from the current saved independently checked OpenTask result. It must not substitute an acknowledgment, fabricate a legacy preparation/native-run receipt, promote a model hypothesis to a causal claim, or bypass old Plan2 choice prohibition. Stale source/proof or unresolved physical status blocks formal submission. Preserve the existing three human outcomes and complete Expected constraints/atomicity; only explicit valid human choice creates Decision and Expected, with current report/source references and durable receipt.

### OA-S02 formal-member origin prerequisite
Before any formal-store admission, qualify only a saved, non-stopping current IR1.4 task whose task/frame/outcome identities, selected inspection and plan hashes agree. Independently recompute original bound member facts; both persisted native envelopes must name the same actual physical Run, distinct DuckDB/Python implementations and the actual Task Run/Attempt, method/code/materialization, exact result and source identity. Expose an explicit version1 open_member_evidence origin with original outcome and source hashes; it creates no Case/Finding/acceptance/Decision/Expected by itself and cannot qualify non-member, pending/UNKNOWN, altered proof, stale revision or model-only explanation. This is the source admission prerequisite to the already recorded genuine Case bridge, not its delivery.

### OA-S01 / Q11-07 normal reader deployment
The normal web composition reads a closed optional version1 reader descriptor. Each non-null reader has an absolute canonical regular executable path and actual SHA-256; reject malformed, extra-field, symlink-substituted, non-executable or byte-mismatched deployment before use. Missing descriptor retains the existing explicit environment/numeric fallback; no startup parser/model/credential probe or install. This local descriptor is deployment evidence, not portable product packaging or full format qualification. Legacy Office bootstrap FAIL remains unqualified; current installed PDF/OOXML Python and pinned image binary can be bound without copying any user data.

### OA-S01 bounded legacy-reader bootstrap and identity correction
The existing DOC/PPT converter may open literal root only as native loader anchor; never grant recursive root/user read, source write or network. Keep own-job writes, macro restriction, bounded process collection and original identity checks. Record actual production profile for executable boundary negatives. DOC/PPT provenance binds both the actual helper and converter byte SHA; changed executable invalidates reader identity. Scanned-PDF absence/OCR uncertainty remains explicit and cannot be published as verified numeric evidence.

### OA-S02 formal member owner admission prerequisite
Only independently qualified current saved membership source can request a genuine Case using the existing composition-owned project Application. No Task/Run ID can masquerade as Case/Session/Revision. Bind the source/outcome and question to a deterministic operation receipt, so same-source retries/restart recover the same actual owner without recalculating or calling a model. Recheck source ownership/state after asynchronous admission; changed/stopped/current-question mismatch cannot publish an association. Any already-created Draft remains an actual saved record, not a Finding or completed human review. No fake hypothesis/confirmation/preparation. This prerequisite introduces no visible UI variation and no Decision/Expected effect.

### OA-S01 scanned PDF observation
Read existing text layer with page/line positions. For blank text-layer pages only, render selected bytes using existing local PDF renderer and actual installed image reader, bounded page pixels/page count/overall process deadline. Preserve original identity and page/OCR positions/confidence, mark the entire mixed observation OCR_UNCONFIRMED, never silently promote to arithmetic evidence or verified source quotes. Unavailable renderer/OCR, oversized page, encrypted document and empty recognition return precise failures; no links, scripts or provider calls. PDF reader identity includes actual OCR binary when configured.

Reader identity is captured before actual parsing and rechecked before publication; the persisted job identity and returned observation agree. Executable/helper changes during an owned read reject publication as SOURCE_READER_CHANGED.

### OA-S02 immutable genuine open-member source record
Explicit current-source admission can persist an immutable source-origin record in existing desktop state, bound to actual Case owner and independently qualified saved Task/Revision/Run/Attempt/outcome. Closed physical130 successor from current browser120 is transactional and must preserve legacy rows; passive reads never upgrade and100/110 are forbidden. Full source/framework/result/native envelopes are digest-bound and revalidated on reopen; a corrupt digest or self-consistently changed proof cannot become qualified. Current source changes/stops reject new admission; history remains immutable. Same command/source retry returns same record, conflicting reuse rejects; no Provider or native recalculation. Origin persistence alone does not create Finding/Closure/Decision/Expected or complete Case.

### OA-S02/S03 native amendment proof ownership
A legitimate changed membership question or semantic version creates a new Task Run identity and invalidates current native calculation/verification checkpoint; the original native envelopes remain only in immutable history. Do not relabel old physical proof to the new Run/Attempt. An unchanged question/preferences/scope is a true no-op and preserves current identity without re-execution. Recompilation/recalculation for changed member scope follows normal authorized tools; no Provider or execution occurs during revision persistence itself.

### OA-08 report expression edits
An explicit user edit saves a versioned USER expression bound to the exact current saved outcome and prior expression sequence. It cannot replace independently checked facts, model explanation, source/proof, grant, Run or formal Decision. Atomic same-command readback/retry and history/restart preservation; stale outcome/sequence and conflicting reuse reject. Pure reads/download/recovery never issue Provider requests. Original expression and all user versions remain inspectable.

### Native member formal review source-current fence
Historical origin/facts remain readable without execution. Before using them for a current formal review, read the actual current task and current genuine Case owner; compare exact qualified source and current question to immutable origin. A changed Run/Attempt/revision/outcome/scope, unresolved stop or owner revision rejects without migration, Provider, re-inspection or Case mutation. Historical validity alone never grants current review authority.

### OA-S02/OA-08 native formal Finding publication
Explicit same-command publication from current qualified origin creates one genuine Finding and draft report under the real Case, transitions Draft→Review, increments row version exactly once and preserves original native proof. Native facts3 carries arithmetic Verified only; no confirmation, legacy Run/aggregate or H0 fabricated. Duplicate command returns same receipt; changed inputs conflict; pure receipt/projection/restart reads cannot calculate, call Provider or migrate. Wrong current owner, source/outcome/Run/stop or integrity reject before publication. Historical130 input remains historical; physical140 is a distinct successor preserving legacy rows/schema semantics. This is not acceptance/Closure/Decision/Expected.

### Native professional overall human review
One exact current native Finding/draft report supports analysis-only, more-evidence and actual business choice. Review2 binds actual origin and Task/Run/Attempt/outcome, real Case row, exact draft report SHA/version/evidence and baseline Decision head. Draft changes have immutable versions/receipts, no model call or formal effect. Explicit submit checks current source, review identity/hash and actor. Analysis-only saves acceptance/analysis closure/final report and no Decision/Expected; more-evidence saves questions/receipt and no acceptance/completion; choice requires complete validated human Decision and appropriate Expected/dependencies/guardrails/inapplicability, atomically saving existing Case/Decision/report/head authorities. Stop/stale source/changed head and incomplete fields reject; UNKNOWN same-command readback never resends. This reuses approved whole-review semantics, not chat acknowledgement or repeated confirmations.

Native review normal web transport is source-bound to actual task/project and uses existing owner control/cookie/origin. Passive review/target/receipt reads do not admit Case, publish Finding or amend fields. Explicit prepare admits/publishes only missing same-source current records, saves empty-authority draft; fields amendment creates next immutable version/hash in Application. Browser cannot supply false source/Run or compute authority hashes. Same-command lost response recovers exact draft/submission via pure GET; no resend on refresh. UI remains in confirmed report/human-review location, not new workflow pages.

### Native formal report download compatibility (OA-08/C03)
Formal native report downloads use the matching saved human-review report for the exact task revision/outcome. An unavailable native review capability (HTTP404) leaves ordinary saved report downloads available. Other read failures remain failures, never substitute a different report. Downloads and receipt recovery are read-only; no Provider or task dispatch.

Native formal review operations are owned by the active local service composition. Once that composition closes, even receipt-only calls through its stale handle reject SERVICE_CLOSED; a newly opened normal composition can read durable receipts without dispatch. This does not prohibit authorized historical readback through a fresh owner.

### OA-S04 professional period clarification
Preserve the existing M1/M2 requirement that comparison/current windows are valid, positive, equal length and non-overlapping (start inclusive/end exclusive). The open framework consumer reports MEMBER_PERIOD_INVALID before source materialization when these constraints fail; the Agent receives a specific next step to confirm both boundaries, then uses the existing ask_user dialogue. No automatic alteration of user periods, no relaxation of existing native rules. Legal period revisions must actually change selected orders/results with old reports preserved.

A natural follow-up submitted from an expanded result returns to the same task’s approved central conversation, showing current clarification/waiting and retaining old reports in history. Successful explicit saved-result readback replaces an obsolete transient UNKNOWN notice; failed recovery remains pending and cannot claim success.

### OA-08/C03 formal report presentation copy
A saved USER expression edit after formal human review appears in the downloaded copy of that exact task revision/outcome, clearly separate from the immutable original facts/human Decision/Expected report. The copy references saved expression version and original final report identity; it does not rewrite the formal report, create a new formal acceptance or execute calculation/Provider. Historical revision copies consume only their own saved edits.

The existing report/feedback human-review position exposes saved Expected baseline, object, metric, window, dependencies, guardrails or explicit inapplicability, result source/owner and assessment/owner through an optional read-only detail in the same card. It shows actual saved fields only, has no Actual/action execution and no new page or theme. This is the accepted Q11-10/PX004 feedback inventory, not a replacement UI.

OA-RT01 single auxiliary successor: a run with no tools uses the installed pi-ai stream directly inside the existing Pi Adapter, without creating a pi-agent-core Agent. It shares the same private credential, exact endpoint/payload fence, durable request accounting, stop/UNKNOWN handling and original-plus-one-extra limit as multi-round runs. Autonomous tool runs retain pi-agent-core. A no-tool continuation containing a tool call/result is rejected before dispatch; a saved completed auxiliary continuation reads back without another call. No separate runtime/session is introduced.

B2 corrective contract (OA-S05/RT04,Q11-11): startup remains passive and marks abandoned running work UNKNOWN. A user-explicit resume may reconcile a recovered task only after valid current configuration/authority, no issued/reserved/UNKNOWN provider request, and a durable current independently qualified calculation checkpoint whose tool-call/result sequence is complete. The Store rechecks exact task identity, source/framework/proof and recovered epoch before transitioning this settled recovery to stopped/ready for missing continuation. No new grant, fake Stop acknowledgement, auto-run or new Attempt retry entitlement is created. Unresolved native work (no qualified current checkpoint), pending tools, stale/corrupt checkpoints and pending provider requests remain TASK_UNCONFIRMED. The existing conversation may expose Continue only for that same qualified state; reads/refresh never execute. This is a private existing task-store transition, not a new Runtime or general UNKNOWN waiver.

B1 corrective contract (product§2/OA-S01,S04/Q11-01): ordinary natural conversation may start with zero selected files and explicit current question authorization. Skip the file parser for an exactly empty selection; do not read any other material. Use the existing Pi Adapter no-tools pi-ai path for a structured answer or concrete necessary clarification, with the same durable model ledger/private configuration/stop bounds. Save a distinct MODEL_CONVERSATION outcome (unverified response, not a quantitative outcome); no numerical IR, verification, Finding, Case, Decision or Expected is fabricated. Versioned existing task-body successor1.3 owns this optional conversation outcome and preserves old1.0–1.2 decoding. History, ordinary copy/expression/acknowledgement target the exact outcome identity; UI labels conversation/model advice without a calculation seal or raw response JSON. Later selected files require the existing explicit material consent, create a real scoped revision, preserve conversation history and enter the original real framing/IR/local computation/verification path. Clarification replies use the same dialogue and actual continuation. No new page, Runtime, global schema or user-visible configuration workflow.

B3 corrective contract (D3/OA-RT05): each accepted plan/source-bound code calculation is a distinct lawful step only after the preceding step has independently qualified. Durable admission is linked to original task operation and deterministic plan/source step identity, not code text or Attempt. A physical success remains unqualified until the Application supplies the independently checked calculation/proof and the Adapter verifies their exact admission/source/plan/result binding. A failed or unqualified step permits at most one correction for that same step; changed code/plan, refresh, restart or a new Attempt cannot renew this entitlement. An unresolved physical admission remains UNKNOWN and blocks all successors. At least three distinct independently qualified steps may run in one operation. The existing calculation tool and local isolation supervisor remain unchanged in authority; no new runtime, UI approval or external effect is added. Application correction messaging is per-step and unresolved failure cannot be evaded by changing the framework.

B1/B2 recovery intersection: an exactly empty-source, no-framework conversation with a saved complete assistant structured answer/clarification and no tools may also reconcile after explicit resume, current authority/configuration and a physically settled request ledger. This resumes persistence of the already received reply via the existing no-tools Pi continuation; it does not issue a replacement request, fabricate verification, or resolve any missing/pending response. Empty-source checkpoints ending in a user prompt, malformed replies or any tool material remain unconfirmed.

OA-S04 technical-selection correction: source_id and sheet_id are backend-selected material identities, discoverable through inspect_selected; users are not asked to supply them. If ask_user proposes those implementation identifiers, return a business-neutral tool observation directing the Agent to inspect/bind the already authorized selection, without entering user-waiting or marking progress complete. Real missing business semantics still use the normal specific clarification path. No unselected material, extra authority or fabricated identifiers are added.

### Q11-03/05/12 existing UI scope and revision-impact correction
The existing plan card/drawer must project the current consumed IR, not infer execution from the user's natural text. Show exact bound file/sheet, measurement and unit, grouping (explicit none), all filters with conjunctive semantics (explicit none), multi-input append without deduplication, transformations, membership bindings/period/status/timezone or document quotation selection as applicable. Resolve source/column labels from that version's saved selected inspection; missing binding labels remain unconfirmed, never substitute an unselected source or expose JSON.
The existing history/execution positions compare each consecutive saved revision with its successor, including question, actual selected source/sheet/identity changes, method/units/group/filter/binding/semantic changes, Skill/Prompt and adopted material changes. Before a new framework exists, state that its actual plan is not yet formed, not infer a new filter. Old results remain historical and are not applicable as current; name actual old artifacts requiring recalculation/reverification/re-explanation (or quotation recheck/model reply for those result kinds). If current result is saved, say the new version is saved without claiming history was recalculated. Expression-only edit stays on same revision, original facts preserved and no recalculation implied. Pure projection/read/refresh triggers no tools or Provider. Existing quick/pro components are reused; no new page or approval.
Tests at existing public openTaskView→renderQuickAnalysisWorkbench boundary, plus normal history dialog and ordinary production browser path. Preserve candidate002 PASS as predecessor; changed UI requires successor identity and affected independent review. No Runtime/Provider/authority expansion.

Retained P1-B-ATOMIC-05 regression correction: two authorized same-intent cold formal submissions must not both fail solely because their first sidecar initialization observes an uncommitted empty database. Serialize the existing private sidecar initialization/identity check with an exclusive SQLite transaction and bounded1second connection-local lock wait, then restore zero busy wait; retain existing project/schema/metadata validation, fail closed on existing empty/corrupt/unrecognized sidecars, exact idempotency and main/assistant atomic formal effect. No schema/version, activation eligibility, API, worker/service concurrency, Provider retry or new Runtime changes. Cold creation only belongs to the caller that observed absence; after lock admission, a prior creator's committed valid sidecar is read/validated without recreating schema. A contender may fail while another commits; the existing formal transaction/retry identity remains unchanged. Actual canonical015 failure and both child stderr records are causal prior evidence; do not erase them.

### Q11-02/11 normal reply collection correction
After submitting or revising a normal conversation, the UI must passively collect and display the saved reply without Stop, manual readback, refresh, or another dispatch. Stop only interrupts genuine in-flight work. Preserve UNKNOWN/receipt fences and no duplicate model calls; refreshing remains read-only. A delayed normal Runtime completion across initial and subsequent revisions is the causal browser regression seam. No approved layout or Runtime/data authority changes.

Direct task selection is also an authoritative current-state read: it must fence earlier list replies, concurrent older selections, and selection completion after New Analysis/project change/pagehide. No selection/read may dispatch a model call or require Stop to display a saved reply.

Search result selection uses the same current-task read and stale-response invalidation as the task list. Older task/list responses must not replace a newer search selection (Q11-01/04). Existing layout, passive collection and pagehide guards remain.

Q11-04 late command/readback receipt: after a newer task/search/New/project selection or pagehide, recover/resume/stop/revise/initial submission replies remain durable server receipts but must not replace current selection. No automatic replay, cancellation or extra Provider request is introduced. Intended command target and inputs bind before asynchronous paint.

## Five Moments requirements (approved 0c6834d addendum)
FM-A01:task-only semantic snapshot distinguishes USER_CONFIRMED,SOURCE_FACT,MODEL_CANDIDATE and unconfirmed definitions. Metric/formula/unit,population/grain/period/timezone/filter/join/physical source identity and preconditions are inspectable. Material ambiguity blocks dependent calculations; no fabricated project/Pack definition or silent default. Clarification consumes actual IR/Binding; no long-term definition write.
FM-A02:editable actual business steps, hypotheses/evidence needs and limitations. A supported composite plan consumes concrete query/group/filter/period and checked refund association steps; deleted/cancelled step never executes. Missing coupon/causal method remains unexecuted and insufficient. Unsupported branches don't invalidate independently qualified description results.
FM-A03:state is actual source/method/tool/check evidence; tool exit differs from independent verification. Failed dependency stops downstream, qualifying independent outputs may persist as explicitly partial; uncertain dependency expands invalidation. Corrected mapping requires new plan/source identity. Stop/UNKNOWN/refresh/restart/explicit resume and persistent request/retry guards retained.
FM-A04:each key finding refers to its precise revision/claim/scope/plan/calculation/verifier/evidence/chart, visible limits and actual support; no invented refutation/causal certainty. Objection references exact finding/outcome version and enters real amendment; expression-only retains facts. Display acceptance never creates formal Decision/Expected.
FM-A05:read-only list only same-project user-confirmed persisted eligible plans; explicit adoption creates separate task with exact source revision/components. Current selected source/meaning/period/structure/method/authorization rechecked and independently computed. No old data/numbers/proofs/permissions/acknowledgment/Decision/Expected/op receipts copied; no old IR means no invented eligible plan. No cross-project reading or machine search.
FM-AX1..3:modify intent→necessary clarification→pre-execution impact preview→new revision/invalidated dependent artifacts→real recomputation/independent checks→old/new comparison and persistent display choice. Proven identical dependencies only can reuse non-affected checks; otherwise openly recompute all. In-flight changes first fence old progression and settle actual physical requests; no current revision writes while uncertain. Late/failed/stopped/UNKNOWN new result never replaces old checked result as current success. New/old display choice never mutates/delete histories, executes code or revokes formal human records. Shared quick/pro/task/reload/report export identities/limits and original OA requirements remain.
UI:reuse fixed FUI01..05/X cards in original quick layout/drawers/expanded results and professional six stages. No replay/iframe/static samples as production, no new theme/questionnaire. Evidence and safety details are progressively exposed; material limits default visible.

FM-A01 implementation slice: task meaning assessment closes definitions/critical conflicts with exact current-user quotations, preserving unresolved conflicts across tool updates. Context v1.1 hashes the exact assessment with source facts and executable proposal. Calculation cannot pass an unresolved assessment; unrelated causal unknowns remain limitations and do not block valid arithmetic. Legacy v1.0 records validate unchanged. New semantic metadata is not Provider/data/tool authorization.

FM-A03 partial-result slice: each actually completed local calculation/source-attribution step receives a durable exact task/revision/run/plan/source/independent-check receipt before subsequent Runtime tools execute. A later unavailable method, clarification, stop, failure or UNKNOWN never promotes the task to saved and does not delete completed steps. Display qualified partial facts in existing thread/evidence/professional locations with their own scope and grade; no fabricated final report, decision, causal proof or branch success. A new revision clears current step receipts and retains the old snapshot; old facts never become current merely by copying metadata. Remaining explicit multistep plan/dependency editing is separate unfinished implementation inside FM-A02/03.

FM-A05 incremental executable contract: same-project exact confirmed, qualified framework can be explicitly selected as a non-authoritative recipe for a new task; current materials and authority must be independently supplied. Old facts, permissions, proof and continuation must not enter the new task. Duplicate command with a different reuse source is a conflict; stale or unresolved source is rejected before material/configuration access. Read-back and restart never launch a reuse task.

FM-A02/03: human-readable source-bound step proposals have exact IDs and acyclic prerequisite relationships, method/assumption/evidence/limitation descriptions and compiled IR. The Runtime executes only the declared step IR and must return independently qualified receipts before dependent steps. Missing methods and local failures block their dependent descendants, preserving unrelated qualified receipts. Execution states are actual receipts, not invented timeline labels. Editing alters the stored executable plan and actual calculations. Entire-task success requires all required branches qualified under the current scope; cancellation is explicit scope reduction, not original-goal completion.

FM-A03 refund IR contract: exact two-source refund-net association, source-bound physical fields, unique order association and refund identity, no unmapped refund or sign guessing. Duplicate association fails before any qualified net result. Current proof, scope and persistent local calculation must correspond to the new IR; independent verifier does not call the main join calculator. Such failed branch does not invalidate independent gross-source arithmetic absent a real dependency.

FM-A01 candidate tool usability: ordinary derived meaning uses a closed dimension-keyed object, each dimension once. Its values always compile as MODEL_CANDIDATE with null quote; no external schema/receipt changes. Existing assess_meaning remains the exact user-quotation/conflict-resolution path. Candidate conflicts are unresolved and remain calculation blockers; no silent confirmation, conflict removal or extra retry.

### FM-UX-P01 当前进度渐进展开（用户验收修正，2026-10-07）
依据固定五时刻产品§2/4、FUI01～05及用户反馈：快速中央对话按真实任务状态突出当前用户时刻，不将口径、方案、各步核验、发现、报告并排一次全展开。口径关键冲突优先显示且阻断误成功；形成未执行方案时以可读摘要和原方案展开为主；真实执行／局部失败／等待／UNKNOWN呈现相应进度、合格部分与下一步；保存成果时以具体发现、重大限制和报告入口为主，口径／方案、每步核验与版本diff按需查看。第五时刻仍为明确沿用方案的新任务，不另造五页／机械审批。历史版本选择、修改影响预览、停止／恢复、精确异议与旧成果均保留；仅折叠不删除，不修改后台事实或权限。专业六阶段内容和消费者不受此快速默认可见性改变。显示阶段来自真实task.state及已存在语义／预览／成果，而非推断中文状态文本；当前未知／失败不因旧保存成果而伪显完成。
验收：已有所有材料的已保存任务默认不同时显示口径/方案/步骤核验；展开后仍访问全部；执行或关键口径冲突不提前显示成果成功；部分失败保持合格部分及限制；预览优先，不隐藏待决修改；切模式／刷新／折叠不触发请求或重算。

### Q11-UX-R02 延迟读回及截图呈现修正（2026-10-07）
每轮已保存回复必须自动出现，不依赖停止／手动刷新；被动读回慢于轮询周期时不得不断丢弃可用结果，也不得并发堆积请求。保留显式选择／命令的旧响应隔离、UNKNOWN、停止与无重复派发。快速对话及报告中的模型Markdown按安全可读文本、段落、强调、标题、列表和表格呈现；原始HTML与危险链接不执行、不加载。过程消息保留可检查，当前成果以可读答案与真实发现为主，沿用当前对话位置与折叠过程，不另造UI或机械五步审批。最终消息不能作为已核验计算的替代证据；当前失败、部分及重大限制保持真实可见。
验收：延迟读回超过1.5秒仍能自动收回连续回复，无Stop或再派发；已保存结果的过程对话不与最终答案堆为多个同权模块；表格有实际表头／行，特殊HTML安全转义，原文与历史保留；原专业六阶段／修改影响／旧响应隔离回归。

## Q11-UX-C03: clarification replies continue the waiting analysis

Acceptance binding: original v1.1 business clarification/runtime continuity and FM-A01/FM-X; this corrects existing PX006 message wiring and adds no UI or permission scope. When the selected current task is waiting on an explicit clarification, sending the requested explanation (including “万，人民币”) through the existing composer continues that analysis with the reply and existing granted materials/context. A previously proposed framework must not route this answer into scheme-change preview/adoption. Preserve the original goal and checkpoint, version/history and causal compute/verification; do not invent unit or conflict resolution. Settled ordinary plan modifications and exact finding objections retain preview/adoption. In-flight/UNKNOWN, pending physical requests and lost receipts retain existing fences; read/refresh never re-dispatch. The visible clarification reply must lead to actual automatic continuation/result, or an honest actionable failure, without Stop or redundant scheme adoption.

C03 meaning detail: an exact current-user definition for the same unresolved dimension may supply a different value than model-proposed alternatives (e.g. literal “万，人民币” defines unit). It resolves that dimension with the literal value, current question and quote; preserve original alternatives and append this cited value as an alternative. Mere MODEL_CANDIDATE, missing/nonliteral citations, ambiguous multiple-option selections, unrelated dimensions and unresolved other conflicts remain blocked. This does not promote inferred conversions or establish project-wide meaning; changed scope stays task-versioned and recomputed/independently verified.

C03 continuation context: Runtime receives the actual current task unresolved semantic assessment before choosing tools, labeled as pending definitions/choices, and the current user answer separately. Prompt text alone is not confirmation; only validated quoted tool input can resolve meaning. This avoids re-asking a question already answered or computing before consuming the pending answer.

C03 visible identity: a clarification continuation keeps the analysis goal as conversation/header title; the user answer remains a real message and task-versioned Runtime input, not a new analysis title. Ordinary scope/goal revisions still show their own title.

C03 durable literal clarification: a specific quoted unit such as 万元人民币 must survive persisted semantic/context readback even if a former generic option 元 is its substring. More specific literal alternatives take precedence over their contained generic text; independently mentioned mutually exclusive options remain invalid. Do not infer conversion or rewrite user quotations. Preserve the compiler/reader round-trip across subsequent assessment updates.

## Q11-UX-C04 自然语言语义接续设计修订（取代C03字面值限定）

用户2026-10-07批准修改设计。以design.md为必要工程契约说明，沿用FM-A01/FM-X与原UI。真实用户引文和规范化含义分开；合法解释的规范值不要求逐字出现在引文，停止用候选字符串包含关系确认业务含义。来源核验只证明引用真实性，模型解释不标为人工确认；充分上下文的普通补充在既有授权内继续，不增加每条人工审批。关键歧义、错误来源、超权限、不支持绑定阻断依赖计算。单位/倍率须消费实际Binding/IR，数值换算与标签分开并独立核验。新私有版本只在显式用户接续/修改中写入，旧记录/失败/权限保持；读回/刷新不调用模型。设计已采用、实现及RED/GREEN尚未完成，不以C03 PASS代替。

C04执行：解释规范值与真实引文不同仍合法；host按task_id生成证据消息ID，拒绝跨任务/假引文。clear且有引用的解释只解除同维度关键冲突，标USER_INTERPRETED；MODEL_CANDIDATE或ambiguous不解除。新Semantic1.1/Context1.2版本读回不重询模型，旧逐字记录不改写。实际金额字段输入单位和输出单位消费精确IR；倍率上限10^12十进制幂，混币种不猜汇率。用户授权实施，受影响因果测试与正式独立验证须实际执行，不以设计或旧PASS代替。

### C04-B01 必需度量绑定资格
Semantic1.1已解释的单位作用于数值计算时，未绑定实际输入/输出倍率不得设置可执行框架、计算、复用缓存核验或保存成果；合法绑定后以实际IR换算。此为C04单位真实消费的缺陷关闭，不新增产品方向、短语规则或人审。旧1.0、count、文档与会员现有独立合同保持。

### C04-B02 原单位非金额计算
已支持的非货币数量sum/mean/分组不得要求虚构currency。LLM解释明确同一原始/输出单位且无换算时，以结构化unscaled_unit声明消费原数值与同一单位；新声明不支持比例变化，不等于已验证业务含义。未声明/未知单位保持未绑定，金额换算仍必须真实measure；无词语识别器或人审。

### R1-BASIS01（RV-01/02/03）
选定有效业务定义资料可作为任务级解释依据，由同一Agent引用并理解，不要求用户重述文件定义。保存来源、哈希、行列与引文；读回核验当前授权输入，分类为资料依据的模型理解，不称人的确认/永久标准。无源、错源、哈希变化拒绝。货币单位按真实依据绑定输入/输出，实际计算和独立核验照常执行；真实冲突未关闭时依赖计算不执行。旧用户引用及保存资料继续可读。

### R1-EVOLVE01（RV-04/07）
Agent在固定业务Context和授权范围内可增加可核验步骤、改变分析方法，无需逐节点人审。每个新计划仍真实消费IR并持久记录；原确认/核验身份保持，可读回原点及各计划。业务语义/单位/基础筛选/关联规则改变、删除原节点或复用未核验依赖拒绝，按FM-X处理。仅更改方法不得新增业务版本或重置计量/失败纠正。

### R1-CODE01（RV-04/05）
支持受控生成Python分析/图表的真实消费者。必须绑定当前Context及真实选定子集的执行IR、代码/输出身份和持久物理回执；不局限完整预置分析模板。成功探索保存为未独立核验观察，关键计算另经独立路径，不能把退出0或自评当已核验。基础筛选在输入物化时强制应用，快照只读，权限/代码纠正/UNKNOWN/停止边界不放宽。探索图表中文明确核验覆盖与来源，原成果位置按需展开。

### R1-METHOD01 — Optional method guidance
Selecting group-summary recommends actual grouping but must not prohibit necessary ungrouped baseline checks or alternative supported/generated analysis. Preferences remain validated, visible grouping supported; they never expand data or execution authority.

### R1-RT-ENDPOINT01
Current explicit approved minimaxi.com endpoint must be bound in actual browser composition and private transport/payload checks. Existing credential discovery source remains unchanged; its historic .cn discovery label cannot silently override the approved request recipient. Backup fixed endpoint and all outbound/secret/redirect negatives retained.

### R1-PLAN-SCHEMA01
Runtime schema must describe the complete existing executable step IR shapes including required operation/column and typed nested inputs/filters. Malformed data must produce actionable tool validation, not opaque permissive schemas or implicit repair. Existing retry bound remains.

### R1-RT-CODEC01
Existing Pi Adapter may encode nested business arguments as a strict JSON string for provider transport; it must decode/validate the original schema before actual tool execution. Original business checkpoint/observations remain canonical; codec cannot fabricate values, infer fields, broaden authority or retry. Plain empty tools remain native. Malformed/oversize/mixed args denied.

### R1-CODE01 refund scope successor
For an already qualified refund relationship, exploratory snapshot must materialize base order filters and include only refunds whose original order belongs to those eligible orders. It retains original selected columns and source identity, no independent-grade promotion. Empty eligible refund subset is legal; original inconsistent relationship still rejects.

### R1-BASIS02 — Backend resolves cited evidence
LLM may cite a real user message_id or exact selected source/hash/sheet/row/column without retyping a quote. Backend resolves the actual immutable text and persists original quotation/offsets. A supplied quote remains strictly checked; unknown message/source/hash/coordinates still reject. Interpretation remains model interpretation, not human confirmation; no phrase dictionary.

### R1-EVOLVE03 — 计数不是金额换算
同一已授权业务范围内，Agent可核验订单笔数等明确count方法；保留真实字段、基础筛选、Context及身份，计数不继承金额measure或金额输出单位。金额sum/mean等仍须原倍率/币种，count不得冒称净额。单字段group_by必须引用一个实际字段，多维探索通过既有受控Python处理，不能拼接虚构列。

### R1-UX02 未选项目的正常启动
有保存项目但没有当前项目时，正常入口显示现有项目选择，不因项目级方法/任务读回在选择前被拒而误报授权失败。只有明确选择后加载该项目资料和方法；不自动激活旧项目、不启动任务，选择/刷新无模型请求。

### R1-BASIS04 对焦前不锁定执行依据
需要业务理解的正常任务，缺少语义评估时，框架绑定返回needs_semantic_assessment，由同一Agent读取真实依据/解释后续接，不保存无依据框架为固定basis。无计算、无新用户确认；已固定依据的真实更改仍按FM-X。

### R1-RT03 未声明步骤的真实前置失败
execute_step只执行已声明真实IR。尚未声明或不存在的step返回STEP_NOT_FOUND/未计算与可行动下一步，不伪造执行、不误标主机权限丢失。依赖未核验、真实安全错误、纠正预算、UNKNOWN及停止仍按原边界；错误调用不启动另一个请求重试。

### R1-DIALOGUE01 / RV01、RV07：同一 Agent 理解非计算续话
已保存分析上的普通讨论、暂停意愿或表达修改，由同一现有 Agent 根据用户文字与当前真实成果理解，不使用短语字典或另行分类模型。若没有提出新执行框架，保存未重新计算的模型回复，与原版本事实分开；不得强造 IR、失效原事实或提升核验等级。真实口径/范围改变仍准备修改影响、显式采纳后新版本重算。等待中的真实冲突保持等待。准备阶段不得提供计算、步骤执行或 Python 执行工具。
### R1-RT04：已声明图的执行前置反馈
当 Agent 绑定图中未声明的新方法时，返回 STEP_PLAN_CHANGED 及未执行事实，要求保持既有图并追加声明，不移除依赖、已核验部分或安全边界；不能直接把未声明方法当作执行成功。

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

### R1-CONTEXT01 (RV04/05)
Agent framing feedback preserves exact bound IR and hash without repeatedly copying whole observed raw sources. Generated exploration still obtains its fixed actual input; persistent source evidence and non-agent-led legacy execution feedback are unchanged. Operation timeout and shared one extra request remain unchanged.

### R1-CODE08 (RV04/05)
A generated analysis failure can be corrected through its explicit fixed operation reference rather than requiring exact retyping of a natural-language goal. The original executed request and material/identity remain fixed. Invalid/stale correction references and changed scope do not execute; one durable correction and UNKNOWN/stop fences remain.

### R1-RT07 (OA-RT01/02/03)
Approved R1 §6 primary endpoint is https://api.minimaxi.com/anthropic (anthropic-messages), including ordinary composition with no explicit override. Private source discovery may reuse the already approved cn credential-source tuple without reverting current outbound host. Wrong provider/model/host and same-tier ambiguity stay rejected; status contains only current recipient host and no Key.


### R1-RT08 (RV04/05): accepted step feedback must use the resubmittable public input shape, retaining exact accepted plan, node metadata and dependencies. Recompilation and a legal append preserve previous proofs; malformed new nodes remain rejected without automatic rewriting.


### R1-RT09: invalid step identity feedback names the structural field path and required identity format, without rewriting identifiers, dependencies, or business parameters. Single correction and no-execution failure bounds remain.


### R1-RT10 (RV04/05): explicit append mode for the same authorized graph accepts only new model-provided nodes and preserves prior accepted nodes and proofs. Legacy replacement remains exact full graph. No inferred IDs, business repairs, deleted old steps, permission or retry expansion.


### R1-RT11: the backend owns technical IDs for new model-authored analysis steps. A step_id may be omitted, and an actual UUID is generated before existing compilation. Returned IDs are used for execution/dependencies. Explicit invalid/duplicate IDs still reject; business plan, boundaries, immutable accepted graph, proofs and correction limits unchanged.


### R1-RT12 (RV04/05): bind an exact unique header name to its actual selected source/sheet column identity; accept an exact unique step title as a dependency reference and resolve to its assigned identity. Unknown/ambiguous headers or titles reject without guessing or execution. Original arguments remain in Runtime history, canonical bindings/proofs remain unchanged. No business language heuristics, unit/method defaults, scope expansion or extra correction.


R1-RT13 / RV02、RV05：同一受信单位字段以唯一真实表头或列标识表示时，方法演进按来源/工作表及实际字段身份比较；币种、倍率、整体范围、既有步骤与成果约束不放宽。


R1-RT14 / RV04、RV05：不可解析的工具参数必须作为失败持久保留且零业务执行；反馈说明完整合法 JSON 和实际工具 schema，不能静默修复或执行错误对象。已绑定方案可用空参数执行，不必重抄 compiled Binding。


R1-UX04 / UI-RV01、02：运行中默认保留用户需求和真实任务状态/部分核验/停止入口，模型工具调试及中间对话放现有关闭的“查看对话过程”；完成回复、真实澄清、失败/UNKNOWN不可隐藏，不删除原记录或另造UI。

### R1-RT15 / RV05：报告事实依据与核验等级
正常网页复杂报告产生过错误订单笔数、将模型 Python 自检写成独立核验，保留 browser-business-001 原失败。每个计算／探索工具回传当前同身份、同材料、已匹配计划及结果哈希的核验范围汇总：业务目标、执行方法、实际结果、分组及行数、真实等级。汇总不是整份报告核验；行数不是任意业务对象去重数。模型生成的探索 summary／observations 即使含“独立核验”字样仍为 not_performed，不得升级。Agent 根据此依据自由解释；新增关键指标须实际计算核验，未核验推导明确为模型推导或探索。不使用业务词特例、自然语言正则分类、隐式模型重试或额外人工确认。
实际报告准确性仍需真实 Provider 和网页情景核对；工具汇总测试 PASS 不等于报告准确性 PASS。

### R1-RT16：真实来源名称与表头的统一绑定
真实 main026 对 CSV、金额等完整实际名称连续收到模糊 BINDING_NOT_FOUND。沿现有 RT12 精确引用规则扩到普通框架：ID 优先；仅实际选定资料中的唯一完整 display_name、可见 sheet.name 与唯一完整表头可解析为真实 ID。未知、重名、模糊别名、组合列不猜测，返回真实引用路径与当前可用引用。不能补业务含义、关联条件、筛选或授权。保持 Core 编译及演进核验；不因 Agent 选择业务名称要求用户配置技术标识。


R1-RT17：生成代码的输入选择必须涵盖实际读取的分组、关联和数值字段。字段选择是实际物化边界，不是描述性清单；不自动扩大材料。失败纠正保持同一输入和一次纠正预算。


R1-UX05：对话中查看执行／来源等既有检查入口必须实际打开对应详情抽屉，不能只改变不可见分类。保持普通对话与专业六阶段布局；不发送模型或重复计算。


R1-UX06/RV05：模型报告文字是AI解读，即使原文自称已核验也不成为独立核验证据。既有最终回复与展开报告清楚区别AI解读和真实核验范围，保留原文与数值，不以关键词改写模型意见。

### R1-B1 / RV-05 当前报告与真实凭证一致
正常分析的当前答案、保存解释、快/专业与下载应呈现同一经过证据校对的报告。草稿矛盾及错误认证不能只加提示后继续作为当前交付。重要数值清单对应真实结果与核验范围；无适用凭证的探索/推导不得声明独立核验。报告编辑本身仍是模型操作，不提升整篇等级。编辑失败/UNKNOWN/取消不发布新成果，已核验局部计算保留。草稿、历史失败与调用消耗保留；完成编辑刷新/恢复不重复请求。不增加逐步骤人工确认或限制Agent的方法探索。
# R1-B1-SEP01 已批准报告职责调整（叠加原R1）
当前交付的报告中，后台仅依据当前真实执行计划、结果与独立凭证呈现核验事实、来源/工作表、筛选分组和等级。Agent输出解释与有真实依据的比较选择，不能填写后台事实或认证整份报告。比较差额由后台从真实相容单位数值推导，明确推导等级；解释和假说不升级为算术核验。布局和报告位置保持既有合同。未知引用、伪造事实/等级、单位不相容、失败/取消不得发布；历史原文和旧合同读回保留。当前独立验证需覆盖原B1真实错误、主备真实链路及普通网页自动收回/保存/重开/专业/下载；旧PASS不代替本增量。


### RT22 私有语义资料引用输入简化（设计先于实施）
backup029 真实失败归因：模型将 64 位指标资料摘要漏写一位，准确 source_id/sheet/row/column 仍被拒绝，并在唯一纠正中复制同一个错误摘要。不能接受错摘要或增加重试。批准 R1 的包内最小修正：新 Agent 资料引用可只提交当前获准资料的精确 source_id/sheet/row/column；后台在当前 task inspection 中唯一查找并补入真实 sha256，再保存原有 1.2 来源记录。显式提交的摘要必须正确；错误/跨资料/不可见/OCR 未确认/不存在单元格均继续拒绝。持久读回仍携带摘要，资料变化或删去已保存摘要仍拒绝。该私有输入简化不是猜业务语义、长期资产权威或新材料权限，不变更存储版本、Runtime 和一次纠正上限。

### R1-RT23 — exact generated program transport
Exploration/correction may submit either a complete plain code string or an explicit ordered array of source lines. Application deterministically joins lines once; it never guesses an escaping layer or changes intended Python string literal escapes. Existing generated program, permission, material, isolation, execution identity and once-correction contracts stay in force. Exact-one representation and existing size bound apply before a physical execution. This private tool variation adds no new execution capability or user confirmation.

RT24/RV01/RV05: each new calculation observation carries its actual current scope/value/proof, not repeated earlier proofs. Actual complete qualified evidence remains retrievable read-only by the current authorized identity and used for final report. Appended node observations supply real new IDs without replacing earlier nodes or their evidence. Full evidence excludes other runs/revisions; readback does not dispatch provider or physical calculation.
### SEP11 用户批准的最终解读分工（2026-10-07）
在原 R1/RV05、OA-RT05/06、FM-A04 范围内，用户明确“允许有界调整并验证”：MiniMax 保持理解、探索及计算推进；现有无工具 `report_edit` 仅由已接入 MiMo 生成最终解读。沿用同一获准事实、合成验证材料、Runtime、私有凭据及持久账本。MiMo 不可用时如实失败，不隐式回到已知解释失败的主模型；此目的带工具一律拒绝。每次操作仍最多一次额外请求，SDK 无重试，未知/停止不得再发或发布。完成 checkpoint 读回不新增请求，不重写历史报告；该调整不豁免报告事实一致性和用户验收。
# SEP12 受影响行为（实施前）
RV04/05、OA-S01/C01：模型在共同对焦后将关键交付落实为当前材料的可执行计划，并可依据探索增量追加。后台只读对照实际独立凭证；不同操作、关联、单位、分组或筛选的凭证不能充当目标凭证。未完成已声明关键计算不形成完整交付；有效部分成果、原失败与UNKNOWN保留。不存在新的用户逐步确认、业务关键词判定、第二Runtime或MiMo计算角色。


### SEP15 / RV04-05 标准化计算交付实际绑定
原生产报告任务首次计算前，Agent必须使用现有read_analysis_evidence.required_plans绑定重要数值交付的实际IR；缺失时返回可行动的工具观察而不执行计算。Agent完成绑定后由原执行消费者核验，不新增前端步骤、模型重试、自然语言关键词或平行Runtime。实际声明不自动证明覆盖全部自然语言目标，真实验收仍核对各重要交付。严格报告JSON无效仍拒绝，无隐式纠错。
## R2 数字可靠性增量（NR-01～09 / NU-01～06）

产品权威：`docs/planning/2026-10-08/change005-numeric-reliability-r2/approval-and-freeze-r2.md`，叠加原v1.1/R1/FM-X，不替换它们。

### NR-R2-01 实际凭证与报告引用
新增报告协议用当前任务/版本/来源/plan/结果身份绑定数字；正文、事实表、摘要、图表及保存/导出同一数值身份。业务定量引用由后台从真实凭证投影，不接受模型凭空填写已核验值/grade。数字字符检查不能把真实日期、订单标识或版本序号误作金额。无依据、错范围、旧版本/单位引用不能取得受信身份；原文审计/失败保留，局部有效结果可继续展示。旧协议历史可读，不追认证明。

### NR-R2-02 派生公式
已核验标量之间的四则组合按输入身份和单位计算；差值、比例、增长率精确计算及独立恒等式/余数核对后保存。零分母不适用；缺失不补零，负基数标明限制；展示舍入不损失底层精度。不同币种/不相容单位不得任意组合，不按示例字段或16项数量硬编码。派生公式核验不提升成新的独立原始数据或因果证明。

### NR-R2-03 范围、状态与生命周期
现成主计算与核验逻辑独立；漏扣/重复扣/错期间/错单位结果必须拒绝。同程序重跑及生成Python退出0不证明核验。已核验基础值、已核验派生、探索/部分检查、失败/UNKNOWN分别呈现。R2不增加成本分摊/预测算法。FM-X的新版本使受影响依据、公式和报告失效；旧历史保持；表达修改不重算，被动刷新/重启不执行，停止/迟到/恢复及预算保持。

### NR-R2-04 现有UI接线
PX006/PX004、中文绿色品牌/字标/slogan、浏览器尺寸适配保持；默认答案先给结果，按需点击数字进入现有证据抽屉，操作数可层层查看且返回原公式。不用全局“报告全部核验通过”、不增加阶段/页面/逐数字确认。专业、快速、报告和导出共享当前版本事实。完整候选回归/独立审查后停用户验收。


## Workspace060（本轮用户直接批准的工作区增量）
本节汇总实施前 design.md Workspace060 已落盘的行为与验收编号，非新产品方向或追认测试。
- UX60：既有侧栏／详情边界支持拖动和键盘调整。收起详情无占位；尺寸偏好只在本浏览器保存。窗宽变化／刷新不能让侧栏挤压中心，701～950保护中心380px；≤700隐藏侧栏，详情继续采用已有覆盖抽屉。
- UX61：资料tab卡片点击展开当前展示任务／版本的真实表头和最多10行，每工作表标明样本行／总行。对内容转义，独立滚动；预览不调用模型、不追加外部传输或文件权限。
- UX62：顶部会话侧栏收起／展开不丢分析与草稿；最左功能栏保留Xanthil工作台、插件、账户与设置。已规划六插件明确尚未接入；账户明确静态预留，无伪造登录／身份／额度。设置支持真实布局重置，无账户体系实现。
- FS60：已有项目UUID目录保留。空白新分析为草稿，首次接受持久任务建立 analyses/<task UUID>；修订复用，新任务另建。不批量改旧项目／旧任务。目录README只定位现有权威SQLite，不冒称已导出全量文件。既存冲突／链接不覆盖；明确回滚只清理本次创建且原生身份和内容未变的目录与标识文件；提交不确定保留现场并由既有回执读回，不自动执行。
验收映射及历史失败／继任关系见 verification-workspace060.md。原R2全部业务、安全与用户产品验收仍有效。

## R3 approved verification coverage increment
规范绑定 docs/planning/2026-10-08/change005-verification-coverage-r3/product-input-r3.md VC-01–13 和 ui-contract-r3.md VU-01–07，全文为验收依据。优先复用原聚合、派生比例、原始资料重核和持久证据；新增加权平均、明确总体占比、可加总贡献、单成本池比例分摊、多表对账的实际核验覆盖。关键数值发布前检查并准确区分原资料独立重算、派生公式、部分检查、探索未核验、FAIL/UNKNOWN及不适用。新权重/范围/关联使受影响结果失效并实算新版本，原版本保留。沿用原三栏/抽屉/双模式，不加逐方法审批、预测或新Runtime。

### VC-10/11/12 Report-only natural continuation
After a current saved numeric result, the Agent may explicitly choose to rewrite only the report in response to natural language. Reuse actual current proofs; no preparation, calculation, source change or copying historical proof into a new identity. Reject mixing this choice with proposal binding. No tool when current evidence is absent. Persist model-origin expression separately, original outcome unchanged; display/read/export agree. Preserve partial/failure/UNKNOWN and stop/late/retry boundaries.

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

107 VC-10/11：包含探索记录的旧版本转入历史时，应沿用真实更早同任务、同scope用户说明校验其语义证据；不能因快照不嵌套历史而拒绝合法修订，也不能接受未来或其他scope说明。历史探索仍not_performed，不重新执行或改写。


### R3 VC-09/10/12 报告依据续接113
报告整理消费当前已核验数值及实际核算公式/限制，不重新猜测分母、覆盖或合计。不把历史需求中的仅准备说法作为已经取得凭证的当前计算状态。自然否定认证（包括否定词与主语间的修饰语）不误判为肯定；同句后续肯定业务/因果认证仍拒绝。新增报告检查版本须保留1.1～1.8原有读回字节与检查语义；旧partial不追认PASS。数字、范围、单位与来源检查不放松。


VC-10/13: proposalOnly中的required_plans声明不等于可采纳框架，更不能表示后台将执行。未真正绑定候选时返回set_analysis_steps反馈并以ANALYSIS_INCOMPLETE拒绝伪完成；无参数读证据和仅报告操作不受影响，正常执行仍消费required IR。

VC-10/VU-01: Agent区分真实业务问题和执行选择；已绑定候选的执行选择由已有采纳控件承接，不把执行确认误存为业务缺失或丢弃候选。没有实际候选、未解决语义冲突、普通业务提问仍等待且不能被执行选择认证。

VC-10方法参数错误不是业务未知：已支持加权方法错误附带numeric_mode时，返回具体禁止字段与原工具纠正方式；仍拒绝错误参数，不冒称绑定成功或要求用户解释单位。


130 VC-10/FM-X：方案准备输入须区分历史与当前要求。历史问答完整保留为明确标注的非执行上下文数据，不把旧报告重写/旧范围等指令重新呈现为本轮待执行命令；当前用户消息单独标注为本轮有效要求，Agent负责意图理解与工具选择。实际权限、候选绑定、采纳与核验边界不变，不新增中文关键词路由或隐式重算。129真实选择旧报告而忽略仅东部方案为失败证据；永久输入契约负例及真实继任验证，不把指令测试冒称模型成功。


132 VC-10/FM-X: Preparation supplies the actual saved proposal recipe and explicitly unbound current candidate. Historical model claims are not tool receipts. Recipe includes methods/sources/filters but no compiled Binding identity or inherited authority/proof. Current tool binding/adoption/recomputation remain required. Real131 asked for adoption without any actual candidate: FAIL. No new runtime or persistent contract.


136 VC-10/11: A saved report-expression preview must retain immutable earlier same-task/scope semantic-message provenance when its base becomes historical after adoption. Validate its original calculation, frame and report against the exact base and actual prior messages, not against the narrowed snapshot alone. No later-revision/different-scope message may rescue invalid provenance. Real133 ready five steps; normal134 adoption failed CONTEXT_CHANGED. Isolated135/135b reproduces at previewValidate report→outcome→historical semantic evidence. No weakening of source, plan, proof or numeric report identity.

## v1.2 requirement-framework behavior delta (approved RS/RSUI)

- V12-01 / RS01,02,04; RSUI01,02,04: direct and clarify-only entries create the same task kind. No-file clarify draft is legal. AI asks relevant consequential gaps; unknown secondary context is a visible limitation. Clarify-only never admits analysis tools or extends materials/egress. Metadata existence does not prove eligibility.
- V12-02 / RS03; RSUI03: optional possible-support/refutation/insufficient branches preserve questions, evidence required, judgment impact and limits; candidate/user/material/verified-fact sources remain distinct. Preview has no invented numerical result/probability/benefit and never enters Finding/Decision/Expected or verified report facts. Selecting focus does not select truth.
- V12-03 / RS05; RSUI05,06: answers/edits auto-save allowed task content with actual receipt. Failure leaves editable pending content and retry; no false saved state. Explicit save-and-defer/readback never runs. Material purpose/scope/period/method/evidence changes create a new framework revision and affected invalidation, retaining history. Pure wording/no-op preserves business revision and valid confirmations. Concurrent stale edits reject without overwriting.
- V12-04 / RS06; RSUI07,10: whole-framework review is independent from explicit start/admission. Current-version Context/Contract/Binding and supported IR consume real method/parameters/evidence changes; at least two meaningful variations demonstrated. No hash-only mapping or fixed replay. Outcomes refer to actual current framework/source identity. R3 proofs keep actual per-item level/limitations. Unsupported or unqualified IR cannot silently fall back; no M2 for M1-only.
- V12-05 / RS07; RSUI08: in-flight execution retains original input; edit cannot replace it. Saving/reopen/refresh/mode change and service restart do not issue calls or reset grant/consumption. Explicit stop fences late publication; UNKNOWN reconciles before new execution. Close-page is not explicit stop.
- V12-06 / RS08; RSUI09: quick and professional first stage edit/read the same framework/revision/source/limits; keep professional six stages, existing side collapse/resizers/settings/material preview and five drawer tabs. Accepted fixed clickable styles/structure are visual reference, never production replay. Compare same viewport/window scale and real content state; address fonts/spacing/sizing/scroll clipping while preserving accepted later features.

Acceptance seams: existing Application/store/HTTP/client boundaries and existing real Pi Adapter, not new mock authority. Causal RED must demonstrate missing behavior before production changes; offline transport tests do not establish real model quality. Joint RS-S1..3/C1..3/U1 with original OA/FM/R1/R2/R3/member/dual-mode regression remains required. No implementation/PASS is asserted here.


## v1.2 Runtime adoption delta — RT12-01..06
- RT12-01: actual Pi imports/runtime calls confined to shared exact SDK0.3.0/Pi0.86.1; product ports expose business types. All affected real entry points consume SDK, no active coding-agent-directory loading or copied loop.
- RT12-02: runAgent consumes real tools; runText supports no-tool plain text; runWorker validates structural/business JSON. Model selection uses validated backend configuration, safe explicit credentials, no UI authority expansion.
- RT12-03: persistent atomic stable-task BudgetStore across instances/refresh/restart; capped reservations, conservative unknown usage, configuration identity and active lease fencing. No quota numbers until explicit decision; legacy actual usage/UNKNOWN retained and never reinterpreted as zero.
- RT12-04: each model/tool/publish effect checks current authorization and acknowledged persistent audit. Faults reject subsequent effects; audit metadata excludes prompt/data/thinking/keys. Official evidence remains readable scoped product records.
- RT12-05: classified main/ordered-backup switching shares the once-extra request ceiling, budget and already completed tool results. No blanket fallback, hidden SDK/app retry or replayed tool effects. Product explicit stop/late/UNKNOWN/recovery and existing MiMo final interpretation remain valid.
- RT12-06: synthetic positive/negative public consumer plus current actual main/backup purpose-specific evidence, store crash/atomicity/UNKNOWN, original R3/member/dual-mode regressions. Producer SDK PASS does not count as product acceptance. New limits/dependency activation remain scoped pending authority.



## User decision — fivefold finite cumulative task limits

User explicitly supersedes the preceding unlimited policy for Change005 v1.2: modelCalls=1000, toolCalls=5000, outputTokens=4000000, wallTimeMs=18000000 (300 minutes / 5 hours cumulative active time, not a 5-hour calendar lifetime). All physical attempts, main/backup requests and relevant tool effects share the same stable business-task account. Refresh, new Attempt, framework revision, service restart and Runtime reconstruction never reset it. Unknown use retains conservative reservations; historical use/UNKNOWN is preserved, not silently zeroed or guessed. Exhaustion closes new admission, preserves valid partial results/history and gives an accurate explanation; it is not permission for automatic budget extension, new task IDs or retries. Existing per-request timeout, once-extra-request maximum, authorization and explicit stop fences remain.

The project-local install authorization and concrete limits are now closed; no repeat startup confirmation. Exact SDK0.3.0 dependency installed with scripts disabled, using fixed tgz SHA76c379b611593b1753de50e2d43ef8c136bdf4e1c562351daf864d54bdaf69d5. Offline cache miss retained; subsequent authorized installation exited0. Installation and policy recording do not establish actual SDK Adapter/budget consumption or product validation. Continue causal RED→GREEN and implementation at the existing approved seams; independent review/user acceptance remain pending and automatic follow-up PAUSED.

### RT12-CK03 旧资源与检查点接收

共享 SDK 替换不得使原任务调用、工具、输出 token 或累计活动时间归零。第一次创建 SDK 预算账本时接收可核验且已对账的历史；旧 UNKNOWN／无法确认的历史先停止准入，不把未核实解释为无消耗。刷新、重启、修订、新 Attempt 与用途选择不再重复初始化。所有新准入仍共享用户批准的同任务上限及固定用途，不能以新 UUID 隐藏原任务历史。检查点原文与 SDK 安全元数据分开持久化，生产运行必须等待真实宿主确认；私有字段不得扩散至业务 Port。

### V12-RS01/02/05 只理需求及共创接缝
requirements 提交保持 ready 同任务且不启动分析/计算；当前有效许可下显式 discussion 只允许更新候选框架，保持来源分类、关键未知和质性预演。工具实际保存并读回本轮原话、模型回复及对应草稿版本后才显示成功。失败、停止、迟到、UNKNOWN 不接受新内容；重试同命令返回既有回执不重复模型。草稿/对话不得变成 Finding/Decision/Expected 或执行授权；至少两次有意义回答改变框架，后续执行消费属于仍待完成 RS06。

### V12-RS04/05/06 需求沙盘接续约束
无模型资格可以创建/手工保存候选框架，不调用模型，不显示模型回答。整体审阅、保存待补、刷新和切模式不执行。执行必须用户显式开始、当前框架审阅仍适用、原材料资格和模型许可有效、无物理UNKNOWN占用；冻结同任务精确框架与材料身份。内容/资料变更保留旧成果/确认并显示失效影响；no-op不制造业务版本。实际 Application 消费框架目的/方法/证据/范围，至少两个有意义修改由原计算与独立核验消费者产生可追踪的不同结果，预演不得进入事实证据。未支持方法保留明确限制，不虚构执行成功。

### V12 非底座补充验收澄清
- RS01/03/05：requirements-only 的手工保存／显式恢复编辑无需凭据，不执行模型或计算；仅显式模型共创及分析开始适用原模型权限检查。
- RS03/05：用户选择的新资料可以同任务保存而不分析；材料变更保留原历史，旧审阅不再适用。重复命令不重复检查；停止期间或检查后身份变化拒绝迟到提交。
- RS04/05：实际用户自然语言来源随已审阅框架版本冻结至原语义来源目录；候选预演不作计算事实。普通分析修订保留旧执行历史，不沿用旧当前执行引用。
- RSUI05/09：框架变化在原完整框架位置展示前后及成果影响；未执行口径／方案显示候选身份，不显示为核验事实；原专业六阶段和快速布局保留。
以上是已批准合同的实现澄清，不解除底座暂停；真实模型自然共创及整版验收尚需对应未暂停候选的真实证据。

### 产品话术标准采用（2026-10-09）
用户已批准 [产品话术标准 v0.1](../../../docs/governance/product-language-standard.md)。本次仅替换生产网页固定文案与状态投影，不改按钮效果、业务流程、权限或底座。原用户文字／模型回复／历史报告原样保留；保存成功仍须真实ACK，UNKNOWN不变为成功，核验覆盖及外发告知不省略。测试沿已有网页renderer/client接缝，检查待确认方案与开始分离、未保存不显示已保存、未知不能继续，以及原R3分级。

## SDK040: approved native Harness adoption
SDK040-01: 固定0.4.0发行字节及0.86.1传递依赖，真实生产入口消费createSessionRuntime；旧兼容Worker/Text/purpose集合共用持久Task预算。
SDK040-02: 新任务原生JSONL持续会话，原生历史/分支/导航/显式恢复/停止/队列；重启读和撤回不调用模型。专属目录限制访问保留，跨进程独占不偷锁，bindOperation幂等且不改归属，reconcile拒绝UNKNOWN/撤权/未核账。
SDK040-03: 专业方法原生Skills/templates；显式自动压缩，模型实际消费专业内容、工具结果及摘要。所有辅助与主备/retry计量同Task。
SDK040-04: 原Analysis IR实际计算、独立核验、产物版本/来源回链不降级；权限/预算/审计失败/保存失败/取消迟到关闭效果和发布；旧任务原检查点/消耗/失败保留，明确核账迁移和回滚。
SDK040-05: 自有网页进度/历史/分支/队列/取消接线，沿已确认布局，不引入coding-agent终端/主题/命令/包管理。环境复用已验证隔离计算，不无限Node回退。能力消费者逐项证据、完整固定候选独立只读审查，适用通过后Mini启用并停用户验收。未获对应Provider用途验证不能自动启用。

## SDK041-01 持久不封顶与单次保护
新获准任务显式unlimited，不采用Infinity/大数/清账。所有用途/辅助/压缩/分支共用Task账本；原子claimUncapped/settleModelUsage记录已知input/output、未知预留、次数、资源与累计时间。账本损坏/溢出/审计失败关闭准入。旧有限身份直接改变返回CONFIGURATION_CHANGED，历史和UNKNOWN保留。最多一次额外请求，native retry关闭，UNKNOWN工具不重放。单次必需值缺失拒绝生产启用。验收接缝沿已授权BudgetStore/Runtime/实际Application与浏览器，不新增审批阶段。

SDK041-IR01：单位解释/绑定后，单位绑定前声明的同来源/字段/操作/范围计算项必须按当前有权威依据的单位编译，再匹配真实核验凭证。已显式声明的倍率/单位不得被宽松匹配覆盖；不同筛选/关联/分组仍分别要求实际证据。不重复计算同一实际计划，不将旧未绑定计划当已核验。

SDK041-UI01：现有执行记录抽屉可查看同任务原生对话位置、建立同任务会话副本、选择继续位置；切换不执行计算或复制成果。运行中/UNKNOWN/停止未收回时禁止改变会话位置或建立副本。查看和撤回队列不发模型；切换任务清除旧会话投影。业务范围调整仍进入原修订链，不因会话导航获得权限。

SDK041-REC01：原生任务的业务证据检查点仅用于成果/来源读回，Application不得将其传为旧协议continuation。普通文本、资料分析及报告用途均由原生Session续接；旧Runtime保留原checkpoint支持。实际修订仍保留Task与预算，不清除历史检查点。

SDK041-REC02：持续会话中的旧成功回执只属于原版本。新版本的当前方案/实际核验状态须进入模型输入；没有当前方案或当前凭证时不可以历史文字直接发布本版报告。该状态不规定Agent工具路径，不复制旧结论。


## v1.3 自主分析增量（固定输入 7e137598）
继承 v1.1／五时刻／R1-R3／v1.2 与 SDK041 的有效规则；批准输入只增加自主推进与协作，不授予新 Provider、材料或外部效果权限。AU01-10／AS01-07／AC01-07／AX01／AUUI01-10 以本次固定 product-input-v1.3.md 和 ui-contract-v1.3.md 为验收权威。

### V13-COL01：合法嵌套与精确材料继承（AS04／AC01／AC02／AC05）
开放分析的明确 v1.3 策略允许子任务继续派发子任务。新子任务只接收原 D2 合格来源及父任务已经选择的报告／汇总／合法对话子集；不能通过访问根来源重新扩大材料。正式 Case／会员既有协作保持原策略。重复祖先工作拒绝继续派生；损坏或循环关系关闭准入。磁盘重开不放宽来源和停止状态。

### V13-COL02：停止传播（AU09／AC06）
显式关闭根或分支在一次存储事务内关闭全部后代并中断其业务 Attempt；应用随后收回实际执行，不将业务 Interrupted 当成物理请求已结束。任一祖先已停止时，不允许新的后代创建、模型／工具准入或结果发布。重开父任务不会隐式重开子任务。历史结果及 UNKNOWN 保留。

### 后续完整验收保留
V13-COL01/02 的离线通过不代表主模型自主派发、返回消费、共享 Task 计量或真实 AS04／AC03 已完成。后续必须从生产入口证明主 Agent 创建不同子任务及合法孙任务、后续模型消费回流影响分析、动态 IR 计算和适用独立核验；沿原 UI 接线、同版本专业与会员回归、AX 基线和用户验收。当前旧真实补验窗口不能复用。


### V13-METER01：协作统一任务账本与原生对话隔离（AU09／AC05／AC06／OA-RT04）
部署在 v1.3 开放分析中的子孙会话使用来源分析任务的稳定 Task 身份、当前根配置与授权，不能用子会话 ID 新建消费账本。资料 scope 仍为精确子集，不继承根明细。不同子会话拥有不同原生 JSONL；重开仍隔离，不公开根或兄弟历史。旧未采用协作入口保持原身份与明确兼容边界，不把其历史请求搬零。


### V13-RETURN01：返回结果直接用于后续探索（AU08／AC03／AC04）
v1.3 开放分析的已返回、当前来源与版本一致的完整子结果自动成为父任务后续模型可观察的 MODEL 材料；不要求用户逐条手工采纳。来源、子任务、Attempt、结果版本/hash、限制与 UNKNOWN 一并传入，引用继续按实际授权校验。未返回、失败、不完整或旧版本结果不混入当前模型输入。此消费不创建正式 Finding/Decision/Expected，也不把模型结果标为独立核验。旧正式 Case 的人审材料规则保留。


### V13-D201：分析中合格步骤的委派材料（AU07／AS04／AC01）
原 D2 最小已核验汇总／精确授权文档子集可以来自本轮已经真实保存并核验的步骤，不必等整个报告结束。引用稳定 step_id 和当前根 Task/revision/run；多个步骤各有材料身份。步骤尚未核验、过期、UNKNOWN 或根已停止时不得用于新委派。不把步骤伪造为整项报告、正式 Finding 或已完成任务；原表格明细不会因此给子任务。


### V13-DRIVE01：主 Agent 选择委派与消费观察（AU01／AU07／AS04／AC03）
真实主任务提供只读合格材料及回流记录工具、精确子集委派工具。Agent 可以根据观察选择不同任务；不是模板回放或预先固定的子任务。委派工具保存队列但不在活动原生运行中递归启动另一运行；原生运行交回后才调度获准子任务，返回后继续同一主任务会话并实际读取材料。普通下一分析步骤不是失败重试；所有实际请求共用根账本。仅整理需求／候选预演入口不提供这些执行工具。取消／撤权／UNKNOWN 立即关闭后续调度、请求和最终成果发布。


### V13-UI-COL01 — 真实协作投影

既有子任务卡片与独立对话显示实际父子关系、分支种类、当前生命周期及回流状态。请求计入根任务账本，待确认状态通过子任务真实 Attempt 身份关联。嵌套回流依据对应父对话的持久回执。回流意见自动供 Agent 继续分析，不要求人工逐次采纳；意见仍不是独立核验或正式决定。停止、失效或历史意见保留但不显示为当前可用。不得新造 UI 布局。


### V13-STOP-BRANCH01（AU09/AS07）

从产品正常子任务停止入口关闭所选分支及全部后代的持久授权和真实在途工作，不停止无依赖的兄弟工作或清空根Task账本；父任务收到真实中断状态，可保留已核验部分成果。只有显式恢复该分支才重新开放自身；停止的后代不自动重跑，祖先已停止时不可恢复。


### V13-STOP-ALIAS01（AU10/AC04）

用户停止的分支在显式恢复前不能靠换名重新创建；无依赖的有效工作和已核验部分成果可继续。创建拒绝必须以持久停止身份判断，不信任模型改写任务名称。


### V13-ARG01（AU01/AC03/AC04）

合法工具的未执行参数错误可由Agent依据实际诊断修正一次并继续；未经授权工具、撤权、来源失效、未知效果不获得纠正例外。未执行的错误不生成事实或核验凭证；每次后续真实模型请求持久计量。


### V13-ARG02 — 有效的缺参诊断
真实 real005 证明仅返回required和数组路径不足以定位缺失项。ARG01的执行前诊断须提供当前schema路径及required属性名；不回显模型提交值、不补默认、不增加纠正次数。模型自行纠正后仍接受原schema与业务授权检查。


### V13-HISTORY02 — 同任务不同核验材料的分支历史身份
同一根Task的两个已核验材料可分别发起Fork，导入的同文字用户历史须以其精确材料来源区分身份，不能互相覆盖或因全库记录ID碰撞阻止合法派发。每个Fork仍只消费自己选择的材料和历史；旧saved Task历史身份及旧正式合同保持。真实real006失败与离线material-parent001行为RED保留。

### V13-DISCOVERY01/02（AU01/AC03/AC04）
自主根分析可按需读取本阶段真实工具合同，首次目录不强制加载全套schema。合同读取不执行、不授权、不返回其他阶段或未提供工具；原严格schema和执行前权威校验不变。后续真实模型消费已返回合同，所有调用计入根账本，旧入口兼容。

### V13-SCOPE02（AU03/AC04）
明确矛盾的同列不同eq AND整体范围必须在接受候选/计算前反馈，不自行合并为OR或移除条件，不把模型编译错误冒充人的未决业务选择。模型显式纠正后仍按真实资料/范围校验。

### V13-UI-TRACE01（AUUI04/05）
协作展开面从持久原生对话中已成功的实际委派/读取回执及后续模型回复定位发起与使用。只有回流没有后续模型记录时仍显示已返回，不显示已使用或已核验。历史只读不执行模型、不写账本或恢复任务；撤销读权限拒绝。旧记录无证据标明发起位置未确认，不猜用户/Agent。资料子集/目的来自既有关系，正式采纳仍独立。


### V13-NATIVE-TOOLS01（AU01/04/07、AC03/04/05）
新自主分析任务使用固定原生具名工具集合与JSON object实参，当前阶段未提供的业务能力仍拒绝；不依赖模型将参数再转为JSON字符串，不将未知native名称自动改写。旧原生任务、历史消耗与UNKNOWN继续原配置。新任务的主模型、子孙和报告用途共享稳定根Task配置/账本，重开保持接法，不自动恢复执行。实际工具结果/协作读取与后续模型输入有真实证据。


V13-NATIVE-TOOLS02：SDK固定用途的工具集合不能把当前阶段未开放的能力广告给模型。用原生transformContext扩展投影当前业务目录；物理请求前再核对可见具名工具是否属于Application当前集合，扩展故障不能携带越阶段目录外发。历史/SDK配置集合保留，实际效果仍独立授权；不得把目录收窄当扩大权限。


V13-NATIVE-TOOLS02实现位置纠正：已核实SDK transformContext不能调整tools；适用目录收窄在受信Provider Adapter投影、发出物理请求之前完成。物理receipt输入摘要绑定实际发送内容，SDK固定工具声明/审计仍保留。两种身份不混称，既有执行器/schema/授权不变。


V13-NATIVE-SCHEMA01：成功读取当前工具合同后，Provider下一物理请求的该具名工具声明须带当前精确schema，而非只提供正文说明/泛object。以当前Application参数为准，不相信历史返回的不同/过期schema。未读的大型合同仍按需发现；子任务无渐进发现时展示完整当前合同。授权及业务Check独立保留。


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


V13-IR-FEEDBACK01：要求重要计算声明但本轮已有已绑定IR时，反馈返回其当前可提交proposal，保留准确来源、关联、单位、筛选。该反馈不声明要求、不计算；Agent显式提交后由既有实际消费者计算并独立核验。未绑定时null，不猜用户目标或继承旧版方案。


V13-JOIN-FEEDBACK01：退款净额方案拒绝退款端自行分组/过滤时，返回准确的退款端参数诊断，而不是向用户索取业务说明。关联键属于join，退款端必须group_by:null、filters:[]；订单端原分组/筛选保持不变。首次错误不绑定/计算/保存，只允许Agent一次显式纠正；重复该类错误（即使变换字段别名）停止本轮，不能盲目换方法、删掉用户条件或声称成功。沿用现有原订单关联及唯一性、独立核验，不改算法/权限或SDK。实际Application负例→纠正→净额核验为因果RED/GREEN。


### V13-YIELD-FEEDBACK01 / AS04、AC03、AC06：正常让出后的同批工具状态
原生分析同轮请求多个工具时，首个工具形成等待/委派让出边界之后，同批其余工具不得执行业务效果；正常未执行状态须以结构化deferred反馈进入原生会话，明确executed:false及ANALYSIS_YIELD，不冒称工具执行失败、已创建或已完成。授权撤销、显式取消及任务身份变化仍先拒绝。后续获准续接的模型可观察这些状态并自行选择剩余操作；后台不自动重放，不新增权限、Runtime或请求重试。实测原生SDK批量工具→磁盘历史→独立分支→原会话续接，另验撤权不被deferred反馈掩盖。


### V13-VERSION-FEEDBACK01 (AC03/AC06): explicit IR version receives relevant pre-effect schema feedback
When a rejected tool argument declares a uniquely supported version in a schema union, bounded diagnostics must identify the requirements of that version rather than exhaust the diagnostic limit on unrelated versions. Original full schema validation remains authoritative; no coercion, automatic repair, wider permission, extra correction or execution occurs. Unknown/ambiguous versions retain ordinary rejection. Probe the approved native Runtime→tool→next-model seam; retain zero effects before correction, one correction maximum, secret-free feedback and metering.


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

### V13-DELEGATION-DIAGNOSTIC01 — 可行动的限定材料引用反馈
无效委派引用不创建子任务；反馈指出出错参数的 JSON Pointer 序号，并提供当前已授权材料的真实引用目录。完成引用越界时仅提供本次选定引用。反馈不回显私有目的、原始无效值或材料内容，不扩大权限。模型显式纠正一次；再次无效仍停止。目录是可选项而非要求遍历的清单，对象引用包含其真实子字段。

### V13-CATALOG-PRECONDITION01
在尚未读取当前委派材料目录时调用委派，返回未创建及下一步读取目录的反馈，不猜测或自动绑定 material:1，不以此表示用户授权缺失。读过目录后，失效/越界引用仍拒绝。读取空目录不会取得原始明细权限或自动计算。

### V13-BATCH-CORRECTION01
同一模型响应批次里，一项委派返回需显式纠正后，余下委派未执行并保留可见反馈，不作为模型读过反馈后的新纠正。下一次模型请求实际携带反馈后才能显式纠正；再次无效仍停止。不得创建未经准入的子任务，已执行合法部分不重放，撤权/停止仍关闭准入。


### V13-CALCULATION-REFERENCE01 / AC03-04
Agent 对新方法仍提交真实完整 proposal IR；对已通过来源绑定的 required_calculations，可通过 calculate_and_verify.calculation_ref 消费，无须再次重写 IR。引用绑定本次完整运行身份、当前来源及实际编译计划；跨任务/版本/Attempt、未知或含义变化后的旧引用拒绝，不猜参数、不扩大权限。声明/读取引用不执行；执行仍经过原 Context/Binding/IR、授权、实际本地计算、独立核验及保存。plan 与 calculation_ref 同时提交拒绝。重复引用仅在同身份/同计划合格凭证存在时读回，不重复计算。现有 {} 和新 proposal plan 入口兼容。
规范依据为实施前记录的 design.md 同名批准工程决定；不修改被冻结产品/UI输入或将定向补验当AS04通过。


## V13-ARGUMENT-FEEDBACK03 — 根对象缺失字段的真实结构反馈
对应 AC03/AC04/AS04。real042 子任务 finish_result 首次缺少 limitations/unknowns，原诊断只列字段名，schema_path=# 未投影真实 schema；模型第二次把数组写成字符串，仍按既有一次纠正条件失败。工程修正仅让可信根 schema 指针 # 与已有 #/ 子路径同样返回有界 expected_schema；不读取或回显无效输入、不填默认值、不修复参数、不放宽校验或增加纠正次数。根 schema 过大继续不返回，所有授权/停止检查保持。原生实际生产 Adapter 的下一模型轮须消费根数组结构，明确重提完整参数后才执行一次。重复错误及撤权仍拒绝。real042 的主任务/子孙失败、物理消耗与旧 UNKNOWN 保留；完整协作仍未通过，不以此单项修正代替 AS04。


### V13-BATCH-QUEUE01 · 同轮合法委派逐项排队（AS04／AC03／AC04／AC06）
真实043第一项委派保存后，同回复其他委派被业务yield挡住，模型续接以自身推理替代独立意见；AS04未通过。主Agent工程影响决定：仅在Application确认等待的是合法委派队列、没有业务提问/结果终结/撤权/取消时，允许当前原生回复中的其他delegate_analysis逐项校验并保存。计算、发布、其他工具及下一模型请求仍让出；原生空闲后使用现有顺序drain，不并行运行，不自动重放未执行调用。旧入口无显式能力回调保持原语义。
每项完整材料/引用/祖先重复检查、单次纠正、停止及同Task账本不变；发生needs_instruction_correction后的同批委派仍推迟，下一真实模型观察后才能纠正。通过公开生产Profile及实际安装SDK证明同批不同工作子任务持久化、顺序执行、孙任务回流、真实后续消费及IR/报告；负例证明提问、取消、撤权、普通工具不得绕过yield。没有SDK/持久schema/Provider/UI/预算/外部权限变化。


### V13-CORRECTION-SCOPE01／V13-REPORT-METADATA01（AS04／AC03/04/05）
real046：3不同根子，2返回，1子在祖先重复纠正时修改selected references却保留旧completion；0孙。21请求全部结算，432请求/196583已知输出/12288历史未知预留。1050净额独立核验、报告partial保留；没有完整AS04 PASS。MiMo在正常解读中重复了回流result_id/child_id与revision、倍率配置数字，严格数值校验正确拒绝，不降低该校验。
普通工程修正：祖先重复的首次可信反馈明确同步completion范围（当前选引用及真实子字段），一次纠正仍只一次，未选引用/循环/撤权仍拒绝。报告业务模型投影不携带内部Task身份、草稿hash、子/结果UUID；原审计输入、Runtime身份、原始协作回执及后端回链保留原值。报告仅解释业务单位及已核验事实，不铺列内部倍率/配置或标识；数值仍仅用事实引用/真实推导占位，不过滤或修补模型输出以冒称完整。
不改变共享SDK、模型/预算/外部权限、材料交集、JSONL和持久表/UI；仅公开业务工具的可信反馈补足及已批准人类可读报告投影纠偏。先因果RED、实际Application/Store返回消费GREEN及原数值/权限负例，再完整回归；真实结果单独记录。


### V13-CATALOG-REFRESH01 / AS04 AC04
空目录不建立可用委派短引用。Agent在真实计算之前读取空目录，随后实际计算和独立核验后，必须明确重新读取当前目录，再从真实返回材料选择引用。空目录后的委派返回既有DELEGATION_CATALOG_REQUIRED及read_delegation_materials，不自动读取、绑定、猜材料或投递。非空目录中的未知/移除材料保持RESULT_OUTSIDE_AUTHORIZATION；队列继续核对当前来源、材料、任务身份及停止权威。既有Profile/SDK生产消费者覆盖先空目录→计算→虚构引用拒绝→模型明确刷新→双子/孙回流与报告，保留原权限负例，不改变SDK/外部权限或重放旧失败。


### V13-INDEPENDENT-VIEW01 / AS04 AC03-04
real049保存了数字核验通过的报告，但主Agent把自身计算/Python自检当成独立调查视角，未创建任何协作任务，AS04真实失败。独立算术核验与独立模型意见分属不同用途；用户当前调查需要独立Agent意见时，自身推理或Python复算不能替代。应从当前真实材料目录选择必要不同问题，消费真实返回意见并调整调查/草稿；没有返回时如实保留该部分缺口。简单任务不强制协作，不预定子任务数量/工具序列，不将MODEL意见升级为独立算术证据或业务事实。


### V13-ARGUMENT-BATCH01 / AC03 AC06 AS04
真实real050在同一模型响应提交两项错误filters结构，第二项在模型看到第一项反馈前已耗尽纠正机会并失败。首次schema反馈后，该原生响应余下业务操作保持deferred/executed:false，不消耗新纠正机会、不自动重放。下一真实模型请求消费提示后可明确重提正确参数；同一运行同工具第二次无效仍失败。每次延后或实际执行之前仍检查授权和取消，合法先前效果不重放，持久账本及额外模型请求上限不变。


### V13-REFERENCE-CHOICE01 / AC04 AS04
已核验材料目录中的真实reference_paths允许按该当前有序目录的零起点索引明确选择，instruction用action/reference_indices/completion_reference_indices；旧精确路径入口保留且禁止混用。后台仅把显式索引解析成该已读、当前、所选材料的实际路径，继续原AutomaticDelegationInstruction、授权交集、完成子集及祖先重复检查；不猜字段、不新增材料或自动纠正。无目录、已移除材料、超界/负数/非整数/重复索引拒绝且无委派效果。MODEL意见仍不等于算术证据，子孙不能绕过此合同。


### V13-ARGUMENT-PRESERVE01 / AC03 AC06 AS04
real052真实第一次参数纠正删除了不合法计划，却在其余已正确关联输入中漏掉必须显式提供的可空字段，第二次schema拒绝且业务未执行。通用首次纠正反馈明确：保留未出错字段和required可空字段的显式null，纠正后核对完整当前schema再提交。字段内容仍由Agent明确提供，不自动填null、不增纠正次数、不隐式重放、不放宽schema或材料权限。仅私有Adapter可信反馈话术补足；既有实际原生SDK正反消费者回归，真实行为另以继任补验，静态文字或测试量不代替真实自治GREEN。


### V13-UI-BUSINESS-TITLE01 · 自主协作标题使用业务语言
自动委派的普通协作卡片标题、目的及父任务名称，使用实际 action 的业务标签与该子任务已选核验材料的 goal，不直接展示后台生成的 JSON 引用路径。人工会话名称保持原样；原始引用、身份及授权仍保留在后台，不改变真实父子关系、返回、使用位置或 UNKNOWN 状态。不把私有自由目的透传为其他子任务材料。


### V13-BUSINESS-INVESTIGATION01 — AS04／AC04
自主协作应围绕选定材料的业务结论、计算范围、解释限制与反例。核验材料的目录优先呈现真实计算和核验对象，仍完整保留适用框架及身份引用；目录排序不选择材料、不自动委派、不增加权限。子任务不以hash或版本不同推导业务冲突，不为了产生层级而继续拆分可直接回答的问题。私有目的、自由goal及未选历史继续不出站；实际业务观点消费和完整报告须真实补验。


## 2026-10-10 V13 有界多摘要业务交接041

Requirement V13-AC04-BUNDLE01: 主Agent显式选择当前同Task/Run/Revision/Grant/Config的1～8项核验摘要及每项真实引用，用统一专业动作交接；对应Binding的来源名、所用字段名、单位、筛选、分组、关联可传递，保留来源hash与版本。不得传整个Context、自由goal/用户原话、未选资料或原始行。实际出站只有所选引用及这些摘要所需的绑定含义。后代目录只见父已选材料与路径，后代只能收窄，不能从同源bundle重新获取被排除字段。旧1.0及手动入口不改写。错身份、未核验/未选项、过期许可、停止、伪造继承在模型出站前拒绝；失败UNKNOWN不迁移、不重放。最终仍须单一真实任务AS04闭环与报告，不以离线GREEN替代。


### V13-AC04-SELECTION-RECEIPT01 / UI-BUSINESS-TITLE02
real060 实际模型在本地 task 文本列举多份材料，但调用仅选择一份，原回执只显示首项 material_id，不能证明跨材料交接。保持已批准明确选材/自由目的不外发合同：实际主/子工具回执须显示全部实际所选材料ID、数量及“task仅本地；子任务只收到这些材料”的事实；不自动补选、扩大权限、硬编码数量层级或解释自然语言。保持 queued 原生让出边界。
既有协作标题及材料位置复用当前实际选材与有来源绑定含义，为新bundle显示各选定资料字段、期间/地区筛选等；单摘要及人工标题兼容。不重画UI、不显示技术路径为目的、不将private purpose冒充实际子目标。回执/标题做因行为缺失RED→GREEN；真实模型小规模实际消费单独检查，不以说明文字测试代替AS04。


## V13-AC04-SELECTION-FEEDBACK01：多材料指令一次可纠正反馈
真实066已选多摘要使用混合action、合并引用超出现有12项上限；现有笼统反馈无法指出冲突。实际委派入口在任何选材持久化/父会话/子任务副作用前，集中返回全部已确认action和引用数量冲突及参数位置。模型显式修正，后台不更改action、不增选资料、不扩大引用/次数/权限；首次反馈后同类无效纠正仍终止。诊断不包含task、资料原文或未选材料。原统一action及合计12引用合同保持。


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


## V13 053/054 — 一次纠正的完整约束及可消费报告示例

V13-AC04-LIST-FEEDBACK01：显式 material_ids 的共同指令同时有无效路径、引用总量超限或 completion 越界时，先核对所有所选材料身份，再在创建任何副作用前同时返回实际问题；只显示所选目录共有真实路径与既有每类12引用上限，用户/模型仍须明确选择并提交一次纠正。不得自动改参数、增加资料或纠正次数；重复无效仍停止。原单材料/旧格式及后代单调子集继续。

V13-REPORT-JSON01：实际生产报告提示中宣称JSON的完整输出及派生公式示例必须是严格JSON，能由未放宽的报告消费者读取；模型照抄示例不得因为程序提供的未加引号字段名被拒绝。实际080无效JSON失败保留，不自动加引号/宽松解析，不宣称新的真实报告PASS。


## V13-CATALOG02
Only explicitly toolDiscovery-enabled native v1.3 analysis may use progressive large contract disclosure. Small current tools retain complete exact schemas. Large current schemas remain available through existing read_tool_contract; a genuine successful observation with matching current tool and schema hash promotes that exact schema, while forged, stale, unavailable or mismatched observations do not. Unknown dynamic plan fields are not guessed/defaulted. Existing Application full Check, one explicit correction, phase authority, Task budget and SDK immutable declarations remain unchanged. Protocol malformed responses and historical failures stay failures; this alternative must be proved with causal offline evidence and bounded actual Provider result before claiming improvement.


## V13-CATALOG03 - native contract first, explicit execution later (056)

Real085 skipped a complex contract and guessed IR versions/types; the original Check rejected it. Preserve that failure. At the existing production Runtime seam, explicit toolDiscovery returns an undiscovered current authorized large schema on first use as tool_contract, executed:false. Do not validate, repair, cache or execute original arguments, or spend their correction allowance. A next model turn must explicitly submit arguments; complete Check and one argument correction remain. Subsequent same-response batch calls wait without execution or replay. Revocation, cancellation and unavailable tools disclose no schema. Existing business yield, small contracts, non-discovery and retained entrances remain. No SDK, permission, model, persistent format or UI expansion.

Acceptance: real native SDK boundary with substitute model proves even valid first-use arguments have no business effect; a later model consumes exact contract and explicitly submits. One invalid correction remains; repeated invalid fails safely. Same-batch, revoked and unavailable negatives remain. Offline substitute results do not replace actual Provider closure.


## V13-NULLABLE-BINDING01 - honest grouping feedback (057)

Real086 raw Provider792/793 submitted empty group_by even while prose claimed null. Existing field resolution safely rejected, but diagnostics only offered column names, omitting the current method's no-group alternative. Grouping-field diagnostics shall explain explicit null where the current method permits no grouping, distinguish it from empty string, and retain actual selected unique columns. Required columns/weights/joins/filters shall not be described as optional. The selected Core method remains authoritative: allocation weights still require grouping. No input coercion, defaults, extra correction/retry, new scope or Core acceptance relaxation.

Public resolver causal test: empty grouping throws and input stays unchanged; its diagnostic identifies explicit null conditional on method. A model's explicit valid null then compiles and actually calculates the known7 fixture. Invalid required columns remain rejected without nullable advice; existing wrong/ambiguous/hidden references and allocation constraints retained. Substitute tests do not claim actual model quality.


## V13-CATALOG04 - valid submissions must not require a discovery gate (058)

Supersedes private056 valid-first withholding, based on real087 regression: five exact returned calculation references were unnecessarily deferred; the model rebuilt correct references into wrong full plans. Preserve056 tests, records and real087 failure history, without retroactive PASS. A current authorized schema-valid native submission proceeds through original complete dispatcher/Application/Core checks and permissions; no mandatory schema-reading round trip. For an unfamiliar complex schema-invalid submission only, return exact contract and executed:false before one argument-correction allowance; never repair/cache/replay parameters. Same-response calls wait after contract feedback, not after a valid result. Revocation/cancellation/unavailable/yield, small and non-discovery unchanged. No original validation is removed.

Acceptance at native SDK seam: valid opaque reference is actually consumed once and subsequent model sees its business result, with no discovery gate. Existing invalid-first contract disclosure, explicit correction/repeated-error rejection, same-batch, revoked/unavailable and compatibility cases remain. Actual Provider evidence is separate; offline scripted collaboration remains not a quality PASS.


## V13-LINE02 — exact physical-line diagnostics (059)
Real088 failed before Python execution: each code_lines item included an actual trailing LF; schema feedback exposed only a regex, which the model misread as whitespace. Preserve this failure. Existing Application/native tool seam shall expose trusted plain-language line requirements with the pattern: each item is one physical line without a CR/LF terminator; remove the terminator when explicitly generating a correction or submit a full legacy code string. Preserve indentation and Python string escapes inside the line. Native validation remains exact, no host trim/split/unescape/repair, no additional correction/retry. Positive valid code_lines must reach the executor unchanged; malformed CR/LF must not. Actual Provider improvement remains to be measured.


## V13-DELEGATION-CORRECTION02 — completed instruction does not consume a later instruction's correction (060)
Real089 first invalid instruction was explicitly corrected and queued; the second independent instruction's first invalid path failed globally because the completed first correction was still counted. Preserve seven real proofs, queued child, failure and consumption. The existing one-correction contract applies to the outstanding instruction: successful original queue acceptance resolves it, so a later independent instruction can receive its first feedback. A repeated invalid outstanding instruction still fails closed; feedback/deferred/failed/unconfirmed queue results do not resolve it. No auto-selection, extra physical recovery, replay or child permission expansion. Actual Application/native/Store seam must demonstrate two distinct instructions each invalid -> explicit valid -> actual separate child/returned opinion, plus repeated invalid after first success still rejects without creating second child.


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


## AC126 — responsive scheduling around synchronous local work
Observed real167 normal-entry reads wait28.6s; read-only actual collaboration projection consumes10.75s without one IO turn (54fresh source reads,14historical children). The uncapped Attempt has no overall timer; a native control IO operation has an approved10s limit. Do not increase that limit or remove integrity/source/lifecycle checks. Private scheduling must allow IO between collaboration parent/descendant projections and before each actual business tool in a native batch. After yielding, reacquire current task and recheck cancellation/current run authority before any effect. Preserve every historical parent/child/result,trace and current-source validation; no authority cache, no history suppression, no parallel business execution, no model/SDK/public schema change. Tests: IO progresses before effect and before collaboration completes; revoked/canceled/replaced input cannot execute after yielding. Actual full projection readback must retain identical projection digest and source DB digests. This establishes event-loop fairness,not AS04 PASS or proof of every real167 failure cause; SDK/native failure still requires affected real contrast after GREEN.


## AC132 — 用户批准的 MiMo 报告思考配置与显式迁移（2026-10-12）
用户批准“允许报告关闭思考及安全配置迁移”。仅报告用途采用 SDK0.4.3 已有显式 mimo-chat thinking-off；MiniMax 分析、MiMo Flash 报告、4096单次输出及全部权限/额度不变。真实173在4096 known output处 length截断；返回意见2项已经实际消费，合法孙任务0仍OPEN。
现有批准测试边界为生产 Pi Adapter→安装的 SDK→Pi Provider wire，以及持久 BudgetStore 与原生 JSONL 续接。先建立报告出站 disabled 的因果RED，再实施。旧配置仍默认保留，不暗中迁移旧Task。显式迁移必须核对原Task、精确旧新配置、同一限额、空闲/外部请求结算、原生操作/队列及有效授权；原子保留全部 usage、reservations、历史关联和失败/UNKNOWN。未知工具效果不迁移、不重放；不能安全迁移则关闭该动作。不得以新Task、直接SQL、改发行SDK或清账绕过。


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

## AC140 · 分支停止不扩大为无依赖工作停止
落实冻结 AU-10/AS-07：停止 A 及其后代后，主任务仍可推进当前授权、无依赖的 B。停止保护按实际已选核验材料、专业动作及引用/完成引用判断，不按私有目的或业务问题改名判断。相同材料上重复同一停止动作仍拒绝；将 A 混入多材料新申请不能绕过。不同材料或不同且无依赖的动作允许，仍须原来源、子集、当前身份和授权检查。来自已关闭祖先的申请仍拒绝；根停止、未解决 UNKNOWN 和失效身份不放开。显式父会话恢复产生新 epoch，不自动恢复旧子孙；旧 epoch 的停止与意见原样保留。
现有 Application→CaseAssistant→LocalStore 为测试 seam，未增加工具、持久字段、UI 或权限。因果 RED：在真实本地 Store 停止 A 后，同合同独立材料 B 无法排队。GREEN 验证独立 B、新独立动作可创建；改名重复 A、含 A 的合并重放、已停止祖先、根停止和 UNKNOWN 拒绝；磁盘重开及显式恢复不清除历史。受影响回归与完整固定候选独立复验后才关闭此项。

## AC141 · 当前文档组件的实际兼容与隔离证据
OA-S01/AC04/AC07 的宿主验证必须绑定当前 descriptor、源码和实际组件身份。恢复的普通 LibreOffice 25.2 在既有隔离下 exit=0 但无转换文件，保留真实失败；不得将它记为合格消费者。复用本机已安装、由当前工作区依赖工具确认的 headless 组件，不安装/升级依赖、不改全局环境、SDK、模型、UI、资料范围或任何隔离权限。新 hash 不冒称旧 headless 身份。先实际验证当前合成 DOC/PPT、越界文件读写/网络拒绝，以及 PDF 全页/位置、扫描与混合 OCR 不确定等级、取消和来源身份；通过后只原子更新既有本机 reader descriptor 的 legacy_office 路径/hash，备份旧 descriptor 并验证正常 composition 消费。组件变更仍由原 hash 检查关闭准入，不隐藏未来缓存更新导致的失效。


### AC140 复验澄清：停止范围覆盖引用树（B004-01，2026-10-12）
在既有 AU10/AS07 下，同实际材料、同专业动作的申请，只要输入引用与已停止输入引用存在祖先/子树或相同路径的重叠，即仍包含停止工作，必须拒绝。扩大引用、缩到其子树、改变完成引用、或在 bundle 中混入这些引用均不得解除停止；判断 JSON Pointer 的路径段，不用字符串前缀把无关同名字段误判。完成条件变化不构成恢复授权。不同材料、独立动作及同材料真正不重叠的引用仍可按原权限推进。根/祖先/后代停止、显式恢复 epoch、旧子任务不自动恢复、UNKNOWN 准入及幂等历史不变。测试沿用已批准 Application queue/lifecycle 及真实持久 Store seam；不调用 Provider、不改通用祖先等价合同。


### AC142 正式CI依赖完整性
保留固定依赖图和SDK0.4.3，仅为现有六项Pi兼容0.84.2 registry依赖补官方tarball SHA512校验。实际公开包字节必须与声明一致；CI继续拒绝缺失或不合法SRI，不升级版本、不绕过固定安装视图。规格先行，当前真实CI install-view因missing registry integrity退出1为RED，保留旧锁及失败。锁定字节变化须同步精确安装identity，再跑合同、类型及当前CI。


### AC143 测试证据根可移植性
OA-C01/RT02固定输出的既有正反例必须在CI配置的JUANERAI_TEST_EVIDENCE_DIR内实际运行，不依赖Mini用户目录。保留所有大小/额外文件/畸形/符号与硬链接/身份拒绝断言。原CI run38260548884的ENOENT是夹具可移植性失败，非产品因果RED；原安全断言继续。
