# Change005 — 浏览器 M1 多源完整路径：工程规格

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
