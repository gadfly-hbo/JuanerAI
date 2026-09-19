# Xanthil Desktop 依赖与持久化整体决策包 v1.0

## 状态与适用范围

| 项目 | 内容 |
|---|---|
| 决策包 | `XDESK-DECISION-001`，v1.0，2026-09-19 |
| 绑定执行包 | [PKG-XANTHIL-DESKTOP-001](xanthil-desktop-first-product-change-execution-package-v1.0.md)及 [Routing Amendment 001](xanthil-desktop-first-product-change-routing-amendment-001.md) |
| 唯一 Change | `xanthil-desktop-membership-repurchase-decision-case` |
| 当前状态 | `APPROVED_FOR_BOUNDED_STAGE2_RESUMPTION`；用户于 2026-09-19 整体确认第 1–12 项；[独立开发就绪 Review 002 PASS](reviews/dependency-structure-readiness-review-002.md)；不是 Spec Gate PASS |
| 已有用户决定 | 同意 Forge/Vite、本机 arm64 `.app`、SQLite 操作状态加不可变文件、当前投影加保留业务记录、opaque Session 目录，以及 300/30 秒、零自动重试方向；同意整理本完整决策包 |
| 本次整体确认 | 精确依赖、逻辑字段组、发布/恢复细则、测试驱动、分阶段 lock/安装权限及本机工具链装配，均按第 1–12 项批准；当前台账见第 14 节 |
| 执行地点 | MacBook 制定和审查；Mac mini 原任务 `纵切-1.0` 执行。正式角色不在 MacBook 启动 |

原执行包字节保持不变。本文经用户整体批准并经 Git 交接后，仅补充其
Stage 2 的依赖/结构决策及下述有限准备权限，不重启 Change、不重做 UI，
不把已通过的 WIP 处置解释为旧 Change CLOSED。整体批准现已完成；接收端核对 Git
冻结身份后才可按第 11 节逐段执行。真实模型调用和主机修改仍未授权，产品实现仍须
Spec Gate 和有效 RED/TDD_READY。本次 MacBook 仅登记批准与发布，未执行这些阶段。

### 输入与证据

产品语义继续由以下已批准附件约束；本文不另建产品状态机：

- [Blueprint v1.0](../2026-09-18/juanerai-product-development-blueprint-v1.0.md)及 [v1.1 修正](../2026-09-18/juanerai-product-development-blueprint-v1.1.md)。
- [UI Contract v1.0](../2026-09-18/xanthil-desktop-ui-contract-v1.0.md)及 [v1.1](../2026-09-18/xanthil-desktop-ui-contract-v1.1.md)、[状态/闭环矩阵](../2026-09-18/xanthil-ui-state-and-closure-matrix-v1.0.md)、[UI 采用表](../2026-09-18/xanthil-ui-reference-adoption-map-v1.0.md)、[自包含视觉参考](../2026-09-18/attachments/xanthil-ui-reference/README.md)。
- [Session/Runtime 边界](../2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md)。
- [复用基线](../../governance/xanthil-first-slice-reuse-baseline.md)、[数据权威](../../architecture/data-authority.md)、[安全边界](../../architecture/security-boundaries.md)、[Ports/Adapters](../../architecture/ports-and-adapters.md)、[Runtime ADR 0003](../../adr/0003-business-runtime-port-strategy.md)。
- [半自动执行政策](../../governance/product-change-execution-policy.md)、[复杂度控制](../../governance/change-complexity-control.md)、[Git 工作流](../../governance/git-development-workflow.md)、[模型路由](../../governance/agent-model-routing.md)。

Mac mini 已回传并由 MacBook 只读核对的异常证据：
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001/STAGE2_DEPENDENCY_EXCEPTION-20260919T010800Z.md`，
11,047 bytes，SHA-256 `251a91eab568bcc5ec4023183fd2f4fcb71e1e412d6cc4c22ae81740f6da8078`。
该次回执 Stage 0/1 PASS，正式 `juaner_spec / xhigh` 已返回 12 份未提交草案，
停于 `DEPENDENCY_DECISION_REQUIRED`。平台未独立回显实际运行配置的限制保留。
草案仅是决策输入，不是批准规范；MacBook 不直接改写 Mini 的草案。

本轮 MacBook 基线为 `ed3ac662e5bfd1067d0593631644371fbaaebf7a`，
分支 `work/macbook/wip-preflight-exception-disposition`；Mini 独占
`work/macbook/whitepaper-blueprint-v1`。后续交接刷新精确提交和文件哈希，
不能把本次观测当持续在线证明。

## 1. 构建依赖：固定版本，不增加第二套构建框架

建议 A：使用以下完整直接依赖矩阵；保留现有 Pi `0.84.2`、typebox `1.3.7`、
TypeScript `5.9.3`、`@types/node 22.19.19`、npm `11.12.1` 和 Node 引擎下限
`>=22.19.0`。替代 B：改换 packager 或任一版本，返回此项重新确认，不自动降级。

| 包 | 精确版本 | 位置 | 注册表报告许可证 |
|---|---|---|---|
| electron | 44.4.3 | devDependencies | MIT |
| react | 19.3.0 | dependencies | MIT |
| react-dom | 19.3.0 | dependencies | MIT |
| vite | 8.3.0 | devDependencies | MIT |
| @vitejs/plugin-react | 6.1.1 | devDependencies | MIT |
| @electron-forge/cli | 7.11.2 | devDependencies | MIT |
| @electron-forge/plugin-vite | 7.11.2 | devDependencies | MIT |
| @types/react | 19.3.0 | devDependencies | MIT |
| @types/react-dom | 19.3.0 | devDependencies | MIT |
| playwright-core | 1.63.0 | devDependencies，仅测试 | Apache-2.0 |

理由：延续既定 Electron/React/TypeScript；Forge/Vite 同时负责 Main、preload、
Renderer 与打包；`playwright-core` 配合既有 `node:test`，不另加测试运行器或浏览器。
2026-09-19 对这十个精确 npm 版本的只读元数据请求均返回 HTTP 200；引擎及
React/Vite 必需 peer 范围未见直接冲突。这只证明候选存在及声明关系，不证明
完整依赖图、许可证合规、构建或 Electron 44 的实际兼容性。

使用一个根 `package.json` 和 `package-lock.json`。新增开发元数据建议为
`name=xanthil-desktop`、`productName=Xanthil`、`version=0.1.0`、保留 `private=true`。
这是本地开发包版本，不是 Blueprint 版本或发布承诺；Mini 草案的“已保留产品
1.0.0”没有当前依据，不予沿用。只新增 `desktop:start`、`desktop:package`
和 `desktop:test` 三个显式脚本，保留现有 typecheck/test。精确入口/config 文件名
在 Spec 冻结；不得新增 make/publish/updater/postinstall 或隐式联网 lifecycle。

[Forge 官方文档](https://www.electronforge.io/config/plugins/vite)将 Vite 插件标为
experimental；必须固定版本并证明打包后相对资源路径可用，不能以开发服务器成功
代替打包成功。完整 lock 的来源、integrity、许可证及安装脚本审查按第 11 项进行。

## 2. 交付物与工具链：真实本机 `.app`，不冒充可分发安装包

建议 A：只生成 Mac mini 的 macOS arm64 本地 `.app`；正常 macOS 入口打开。
替代 B：DMG、ZIP、x64/universal、签名、公证、自动更新或公开分发，另立授权。
理由：当前验收对象是用户可操作的桌面产品，不是发行基础设施。

这里的本地 `.app` 不承诺携带完整分析工具链。继续使用已有 DuckDB `1.5.2`、
Python `>=3.9` 和命令局部 Node `26.0.0` / npm `11.12.1` 验证环境；不得安装或
升级系统工具。Electron 内嵌 Node 是另一运行环境，要单独记录版本。

为避免 Finder 启动丢失 shell PATH，建议构建时读取机器本地明确提供的
`JUANERAI_TOOLCHAIN_BIN`，核对其现有 DuckDB/Python 的绝对路径、可执行性和版本，
将这两个解析结果及实际版本写入仅随本地输出生成的部署描述，不进入 Git、Renderer、
Provider 或报告。Desktop Profile 只从该描述装配命名分析能力，不给 UI 任意命令或
路径执行权限，不读取 shell rc、不修改系统 PATH。该描述不是 Project 业务结构或
新设置中心；精确格式和装配路径由 Spec 冻结。CLI 既有 Profile/验证入口不变。

工具不存在或漂移时，显示本地计算不可用、保留 Session/手工输入，不默默安装、
查找其他工具或调用模型。受控验收主机的部署配置由执行协调者准备，业务用户不用
写配置或操作终端。该方案的限制是 `.app` 仅在核验过的本机工具链上验收；可携带的
完整运行时封装留待后续产品 Change。

## 3. SQLite 运行层：优先内置 API，不新增原生数据库 npm 包

建议 A：`node:sqlite` 的 `DatabaseSync`，仅在存储 Adapter 内使用，Profile 装配；
不用 ORM、better-sqlite3、sqlite3 npm 包或 Python 数据库代理。替代 B：只有受控
兼容性探针失败才返回 Controller 选择其他驱动，不自动增加依赖。

理由：内置 API 可减少原生 ABI 重编译和额外驱动。官方已记录 Electron 内置 SQLite
支持修复；Node 22.19 的 API 仍标为 active development，因此不是已证实的稳定性
保证。[Electron 修复记录](https://releases.electronjs.org/pr/47756)、
[Node 22.19 文档](https://nodejs.org/download/release/v22.19.0/docs/api/sqlite.html)。

限定使用连接、参数化 statement、事务和关闭等基本操作；禁用扩展加载，开启外键，
不开放用户 SQL。SQLite 仅承载短小的业务记录事务；大文件/分析在现有分析 Adapter
完成，不在 Main 中执行长时间同步查询。一个应用实例、一个 Application 语义写入者；
优先用 Electron 原生单实例机制，不新增锁服务、多写者或分布式协调。

建议初版使用 SQLite rollback journal（DELETE）和 FULL synchronous；不引入 WAL
管理/checkpoint 后台任务。连接忙时立即拒绝，不循环重试；业务状态提交都在一个数据库
事务中完成。实际 SQLite 引擎版本由 Node/Electron 锁定的二进制提供，探针记录
`sqlite_version()`，不把嵌入版本另当 npm pin。

必须先在基线 Node 及精确 Electron 的打包 `.app` 中证明：基本读写/回滚、关闭重开、
约束拒绝、进程中断后读回和安全 Renderer 均工作。探针仅操作独立合成目录，不能
拿产品数据试错。失败就停止本项，不偷偷切换存储家族。

## 4. 存储分工、目录与读取入口

建议 A（已确认方向）：SQLite 保存操作状态/关联索引，文件保存不可变业务工件。
替代 B：多文件操作数据库，需要自建多记录事务，未选用。理由：Session、当前修订、
确认和闭环必须一致提交，SQLite 更适合承担这一职责；它仍不解决数据库外文件的原子性。

拟批准布局：

```text
<project>/.xanthil/desktop/state.sqlite
<project>/.xanthil/desktop/staging/<operation-id>/   # 未发布暂存，不可用作业务结果
<project>/<session-id>/010_draw/                    # 原始快照
<project>/<session-id>/020_clean/                   # 派生聚合
<project>/<session-id>/060_reports/                 # 报告工件
<project>/.xanthil/runs/<run_id>/                    # 保留既有 Run Artifact 合同
```

Session 目录只用产品生成的 opaque/path-safe ID，显示名可重复且不决定路径；
不引入 `030_reports`。SQLite 自有 journal 属本库操作，不是新业务资产。
应用通过用户选择的本地 Project 打开数据库；重启可重新选择同一目录恢复，不要求
新增全局最近项目数据库或跨项目搜索索引。绝对根路径只在 Main/Adapter 内解析。

Core/Application/Port 不出现 SQLite 或 Pi 类型；Renderer 只读取业务投影。
DuckDB 仍是分析引擎，SQLite 索引不是原始数据或计算证据。现有 Run store、取消/
deadline/terminal immutability 与 CLI 合同复用，不能以旧固定 fixture 支持代替
新双 CSV 导入及复购收入算法；其差异仍由本 Change 的 local-analysis delta 和测试闭合。

## 5. 完整逻辑记录表：批准含义，不提前编写物理 schema

建议 A：批准下表逻辑字段组；Spec 只将其映射成精确字段/表/类型和命名，不得新增
业务含义。替代 B：现在编制通用 event sourcing、迁移/资产管理系统，不在当前范围。
理由：保留当前投影和独立业务记录足以满足恢复、历史和可追溯性。

共同约定（适用于新 Desktop 记录；不改写既有 Run 格式）：

- 身份为必填非空产品 ID；创建时生成，不用展示名、路径、Pi ID 或内容 hash 当实体 ID。
  每个记录携带归属 ID；引用跨 Project/Session/revision 时拒绝。版本计数是正整数。
- 创建时刻必填 UTC RFC3339；状态变化/确认/终结时刻只在对应事件发生时填写，未发生
  明确为空，不以创建时刻冒充。业务日期解释仍为 `Asia/Shanghai`。持久时刻只供追溯，
  不能据此续跑超时进程。
- 记录 envelope 版本为 `1.0`；既有工件各自版本不变。以下“无”采用显式 `null`；
  已知空集合用 `[]`；未知值不使用空字符串、0 或推测默认值。当前状态默认值仅下表给出。
- 定稿记录只追加；Running attempt 可终结一次、之后不可变。当前投影/表单草稿可按
  已批准转换更新。内部并发比较版本不是第二条业务 revision 轴。
- hash 是 SHA-256；字节长度为非负整数；相对 locator 无绝对路径、穿越或符号链接逃逸。
  日志/历史不复制原始数据、Provider 密钥或 Pi transcript。

| 逻辑组 / 粒度 | 必填字段组及类型含义 | 有条件/空值、默认与关系 |
|---|---|---|
| Project / 每个选定目录一个 | 稳定 Project ID、显示名称、创建时刻、schema 版本 | 目录通过 Main 选择；无云/租户 ID；1:N Session；不自动认领已有非本产品数据库 |
| Product Session / 每个工作空间一个 | Session/Project ID、显示名、固定 `professional`、创建时刻、唯一 Case ID、当前 revision 引用 | 发布后必有一个 Case 和一个 Draft revision；无 Session revision；关闭不删除；quick 仅 Preview |
| Case revision / 每次业务修订一个 | Case/Session/revision ID、递增顺序、状态、名称/问题草稿、创建/更新时间、完整性标记 | 初始 Draft、未检测损坏；前序 revision、新快照、已确认计划、当前 Finding/acceptance/Closure/report 引用均无则 null；修改计算输入生成新 Draft，旧修订保留 |
| 数据/计划确认 / 每个 revision 的一次已确认输入组合 | 原始快照引用、双文件映射、期间、CNY/时区、过滤/订单状态/问题处理、分组选择、H1/固定方法、授权及处理确认时刻、Contract/Binding/IR 工件引用 | Draft 可未齐全，但 Ready 时全部必填；无分组是显式不分组而非未知；确认后不可修改，改变组合须新 revision |
| 原始快照 / 一次确认后的 members+orders 文件对 | snapshot ID、两文件相对位置/显示名/hash/长度、来源及读取/确认时间、归属 revision、包含/排除计数及处理依据 | 必须两文件齐全；不以外部源文件当前位置作权威；确认前不发布快照；重复相同内容的显式新导入不合并用户意图 |
| 聚合工件 / 一次确定性派生版本 | artifact ID、snapshot/revision/生成 Run 引用、方法和代码身份、列及计量含义、位置/hash/长度、生成时刻 | 只有成功产生且验证过的版本可被引用/批准；分组伪名限定当前 revision，原值映射仅本地；无获准聚合不伪造空结果 |
| Analysis Run 索引 / 一次执行 | run_id、归属 Session/revision、输入确认引用、Profile/方法/代码身份、状态、开始时刻 | Running/Succeeded/Failed/Cancelled；终结时刻与原因初始 null；证据 locator 仅指向已发布既有 Run 工件；历史失败保留，不复制 Run ledger |
| 模型披露/决定 / 一次明确辅助动作的授权或拒绝 | 决定 ID、Session/revision、三种动作之一、披露类别、精确 payload hash、请求 provider/model、决定及时间 | 同意/拒绝明确保存；问题整理含自由文本额外确认；聚合引用集合对问题整理可为空，其余必须精确；拒绝不创建已发出的 Attempt、不联网；不存重复原始 payload |
| Assistance Attempt / 一次获准请求 | Attempt ID、披露决定引用、Session/revision、动作、Profile、Runtime/Adapter 身份、请求模型、开始时刻及状态 | Running/Succeeded/Failed/Cancelled；实测模型及终结时间/原因/输出 Draft 引用未产生为 null，不冒充实测；超时/中断记 Failed 原因；不占用 run_id |
| 辅助 Draft 与采用决定 / 每个成功输出及用户处置 | Draft ID、Attempt/revision 引用、标签化文本/候选草稿、生成时刻；采用记录含目标表单及用户确认时刻 | 初始待处理，可显式编辑后采用或拒绝；失败无输出 Draft；仅更新允许的表单草稿，不改方法、计算、Finding 接受或 Closure；不形成长期 Knowledge/Memory 资产 |
| Finding / 每个成功 Run 的可审阅结果版本 | Finding ID、Run/revision 引用、支持/反证或替代解释/限制、结果及分母、Confirmed/Rejected/Inconclusive 判断、方法/证据引用、创建时刻 | 失败/mismatch 无 Finding；未接受的版本不得覆盖原接受结果；本 slice 不实施 Preview 子任务的真实回流存储 |
| Finding acceptance / 一次明确接受 | acceptance ID、精确 Finding/revision 引用、用户接受动作、时刻 | 没有动作就没有记录，不以布尔默认 true 替代；同一确认重复交付不重复追加；接受不等于闭环 |
| 决策表单/非闭环历史 / 每个 revision 当前草稿及明确处置 | revision、候选集合或证据不足选择、用户编辑内容；明确保存/不采纳/暂缓/补证动作及时间 | 初始候选 []、未选择路线；候选含证据、风险、适用条件、未来验证指标，0/1 优先项，优先须理由；不足路线须非空理由且无优先项；暂缓理由/日期可 null；不产生 Closure |
| Decision Closure / 每次明确完成 | Closure ID、revision、acceptance、已保存有效路线、完成动作/时间 | 仅两路线：至少两个有效候选的比较，或证据不足/暂不选择；不可在没有接受 Finding 时生成；一个明确完成产生一个记录，rerun 产生的新闭环保留旧记录 |
| 报告版本 / 每份已发布内容 | report ID、Session/revision/Finding 引用、版本顺序、内容工件 locator/hash/长度、创建时刻、来源及证据集合 | draft/final/superseded 投影遵守 UI 矩阵；final 必有 acceptance+Closure；发布内容不可覆盖，变化生成新工件并切换当前引用；历史 final 不因 rerun 失败降级 |
| 有限命令收据 / 每个有副作用用户意图 | 命令身份、业务操作种类、归属和输入 fingerprint、最终结果引用/拒绝原因 | 与相应状态同事务写；只防创建/导入确认/执行/采用/接受/完成/发布重复交付；同 ID 同输入返回既有结果，不同输入拒绝；不是通用消息总线或可重放任务队列 |

归属均为产品 Application 语义写入，具体数据由存储/文件 Adapter 持久化。
1 Project:N Session；1 Session:1 Case；1 Case:N revision；每个 revision:N Run、
Attempt、Finding/报告版本；每个 accepted Finding 通过独立 acceptance 引用；
Closure 引用其精确 acceptance；当前指针每类至多一个，历史不据此删除。
Run/Attempt 跨 revision 并发不扩大为平台能力；本地实例串行处理状态提交。

不增加产品删除/retention UI、自动清理、备份服务或数据迁移。所需唯一性约束为
产品 ID、Session 唯一 Case、Case revision 顺序、报告版本顺序、命令身份及每
revision 唯一活动 Run/Attempt。FK 限制跨归属引用、不级联删除；索引只服务当前
Session 列表、revision 历史及精确 ID 查询。具体表名/SQL 类型/必要索引由 Spec
映射后在 Spec Gate 核对，不让 Worker 猜业务字段。

## 6. 发布与中断：先工件，后数据库可见性

建议 A：数据库事务是业务可见性的提交点；外部文件先准备完整，再建立引用。
替代 B：把 DB+filesystem 当同一个原子事务或另造两阶段提交协调器，不采用。
理由：[SQLite 原子提交](https://www.sqlite.org/atomiccommit.html)覆盖数据库，
不自动涵盖外部目录。

1. 验证 Project、归属、版本和命令身份；只在本 Project 同文件系统隐藏 staging
   中创建本次唯一内容。Session 创建先准备完整三个目录；文件发布先算 hash/长度。
2. 持久化文件和目录元数据，原子 rename 到独占最终位置；不得替换已有目标。
   目标冲突时只对精确同身份、同内容的已提交操作返回原结果；其余明确拒绝。
3. 同一 SQLite 事务提交业务记录、当前引用和命令结果；成功提交后才返回成功。
   Session 的三个目录已齐全才可插入可用 Session。Finding/report/acceptance/Closure
   及当前指针的相关转换同事务提交，不暴露半完成。
4. rename 前失败：无业务记录；保留隔离暂存。rename 后 DB 提交前失败：可有孤立
   文件/目录，但 Session list/open 只能从已提交且完整的记录解析，不能按扫描目录
   “找回成功”。无引用内容不被导入、发送、Run 或报告消费。
5. COMMIT 返回异常或回复丢失：先读回同一命令收据。已提交则返回同一成功；未提交
   则失败；数据库不可读则显示“结果待核对”，阻止重发，不能宣称失败后自动重做。
6. 重启只对已提交记录做完整性核验；未登记孤立目录仍不可用，保留供人工处理，不
   自动删除或追认。明确新的创建意图用新 ID，禁止与不明残留合并。重发同意图优先
   查命令收据，不能复制一个 Session。

没有后台扫描修复或通用 recovery service。SQLite 自身事务回滚不等于产品自动
重试。文件消失、hash 不匹配、未知格式都不通过补默认值“修好”；显示可读历史，
阻止依赖损坏数据的新操作，沿 UI 合同允许新快照/新 revision 或带标记导出。
工件更改采用新内容发布，不覆盖旧 bytes；报告状态是操作投影，不把旧 final 文件
改写成 superseded 内容。

## 7. 运行、截止时间、取消与恢复

建议 A（预算方向已确认）：Analysis Run/Assistance Attempt 各 300 秒绝对上限；
DuckDB/Python 每次各 30 秒且不得超过外层剩余时间；产品自动重试 0。
替代 B：改数值要明确修订，不用 Provider 默认无限等待。

同一 revision 的 Run 与 Assistance 互斥；第一次成功持久准入者获胜，冲突立即
拒绝，不排队。数据确认和可调用性检查须先通过；不持有数据库事务等待分析或网络。
重复命令返回原身份，不二次启动外部工作。

取消、超时、结果成功竞争同一 terminal 转换；已提交 terminal 后晚到返回不得
发布新 Finding/报告/辅助 Draft。取消只请求结束已发工作，不声称撤回已发送的
模型 payload；基础 Adapter 的取消、清理、late-settlement 约束继续生效。
成功发布前必须再次核对绝对 deadline 和已受理的取消；到期后不能因为 timer 回调
延迟就提交成功，读取到结果也不等于已赢得终结竞争。
到期不再准入新工具调用；已发 subprocess 必须终止/收束并留下无成功发布的证据。

重开时仍 Running 的历史 attempt 标为 Failed/中断，仅允许这次终结记录和对应
失败投影，不恢复 Pi Session、不重新发送请求。首次分析失败按原合同进入 Needs
attention；已有成功/Completed 不倒退；Assistance 的任何终结都不改变 Case 或 Run
状态。用户明确重试是新身份并重新披露，旧 terminal 不改写。

## 8. 数据披露与敏感内容保全

建议 A：严格沿用已确认的三类辅助动作，不扩大“可以调用 LLM”的含义。
替代 B：自动附加 Session/raw 文件或默认继承后续数据授权，禁止。

`帮我整理问题` 可以在没有聚合前调用，仅用明确展示并确认的用户文本、期间标签和
聚合列名，自由文本另行确认；`010_draw`、原始行/文件、路径/原始 ID/分组值、密钥
与未选日志不能进入自动组装 payload。后两种动作还要求精确 `020_clean` 子集及
既定 Review/Finding 接受 guard。提交前 payload hash 必须仍等于确认对象，输入或
revision 变化则要求新披露。这里只定义产品能力，不授权开发期间真实 Provider 调用。

披露历史只保存类别、hash、引用和决定；用户手工表单及采用的 Draft 可以在本地
业务记录保留，不重复保存 Provider 原始请求、原始响应日志或 Pi transcript。
模型成功仅产生 Draft，采用亦不能替代 Finding 接受/完成动作。

## 9. 安全与版本合同

建议 A：本地可信单用户边界，仍保留窄 IPC、Adapter 可替换性和失败封闭。
替代 B：企业身份/租户/加密/审计平台，另行 Change。

Renderer 固定 `nodeIntegration=false`、`contextIsolation=true`、`sandbox=true`；
packaged 只加载本地资源、CSP 禁止 unsafe-eval；禁止任意导航、新窗口、权限请求、
外部 URL 及未授权网络。Main 校验 sender/frame、版本、闭合形状、归属/状态/授权；
preload 只暴露具名业务方法及标准可克隆值，不暴露原始 IPC、路径读写或执行接口。
SQLite、Pi、DuckDB、Python 各限于对应 Adapter；不添第二 Runtime。

只创建 greenfield `1.0` Desktop 库；未知/malformed/更新版本只读诊断并拒绝业务
写入，不自动迁移。旧 CLI 工件照旧读写；回滚停用 Desktop 入口/装配，保留所有库和
文件，不自动降级或删除。Schema SQL 是后续 Worker 实现；本决策不生成迁移系统。
跨 Ontology/Knowledge/Memory/Model Pack 的新结构均不适用，因为当前没有新消费者。

## 10. E2E：测试真实打包产物，同时保留正常启动检查

建议 A：`playwright-core 1.63.0` 的 Electron 驱动配合 `node:test`，启动生成的
`.app/Contents/MacOS/…`；不新增 @playwright/test，不下载独立 Chromium/WebKit。
替代 B：换驱动或放宽沙箱，先返回 Controller，不以浏览器 UI 或 IPC 直调替代 E2E。
理由：可自动操作真实 Renderer，并观察 Main/文件系统；不增加第二测试体系。

[Playwright Electron](https://playwright.dev/docs/api/class-electron)支持该入口但仍是
experimental。测试必须显式 `chromiumSandbox=true`、不 bypass CSP、不加 no-sandbox。
驱动所需调试能力只由测试启动参数启用，不在产品中增加 debug IPC、远程调试默认值
或数据注入后门。若驱动与精确 Electron 不兼容则停止，不假报兼容。

用两个证据层证明同一冻结构建：

1. 自动化：真实 packaged 主进程、Renderer、SQLite、文件和分析进程，完整六阶段、
   close/reopen、取消、故障及禁止副作用。必要的原生对话框替身必须明确标记，其余
   导入/验证/计算不能替换；测试 trace 不收集密钥或业务原始数据。
2. 正常启动：macOS 常规打开同一 `.app`，无测试调试参数，实际选择 Project/两个
   合成 CSV，完成手工主路径、保存/关闭/重开；验证真实原生选择器、实际资源路径和
   分析工具链。优先使用可用 UI 自动化，否则一次人工验收；未取得则记录待验收，不能
   以被替换的对话框、dev server 或源码调试入口顶替。

真实外部 Provider 仍 `NOT RUN`；允许离线 Adapter/transport doubles 证明披露、拒绝、
失败、取消和 Draft 采用合同，但不能声称模型质量或线上调用已验收。Test Plan 必须
将这种证据限制与真实本地端到端证据分开，独立 Validator 按同样边界报告。

## 11. 准备权限分段：解除 lock 循环，但不越过 TDD

以下均为**整体批准后才生效**的补充权限；适用 Mac mini 原任务和原 Change。
不用新状态机/角色/主机服务；在既有 `verification.md`/回执记结果即可。

| 阶段 | 允许 | 停止条件 |
|---|---|---|
| P1，Stage 2 决策采纳后、Spec Gate 前 | 协调者在现有证据根下的独立 `dependency-preflight-001/` 中复制基线根 manifest/lock，加入第 1 项精确矩阵；只运行 `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`，不修改仓库 manifest/lock，不安装 node_modules | 非批准直接依赖、registry 外/浮动 Git 来源、非预期已有依赖变化、peer 冲突、未知许可证/来源或需要新权限即停止 |
| P2，P1 完整图审查通过、Spec Gate 前 | 同一隔离目录按冻结 candidate lock 执行 `npm ci --ignore-scripts --no-audit --no-fund`；只安装锁定包，不运行任意 lifecycle；核对包实际许可证/脚本。记录批准图和包 integrity | 图/bytes 漂移、影响既有依赖且无法由新增依赖解释、未知脚本需运行即停止 |
| P3，P2 核验后、Spec Gate 前 | 唯一有限脚本例外是核验过的该精确 Electron 包的官方二进制安装入口；仅下载官方 macOS arm64 对应版本及校验文件。使用锁定的本地 Forge/Vite/Playwright 工具做独立合成构建、SQLite/沙箱/packaged E2E 健康探针 | 缺失入口、需其他安装脚本/原生 rebuild/系统工具/新依赖、签名权限或探针失败，保留输出并返回 Controller；不自动放宽 |
| P4，完整 Spec Gate PASS 后、Test 前 | 协调者仅将已审查 candidate manifest/lock 按 bytes 采纳至根目录；按相同 scripts-off+Electron 唯一例外安装开发依赖，证明基线及工具健康。Test 可写测试/fixture/harness，不能写产品实现；缺工具/无打包入口的失败不算有效 RED | Spec 路径/矩阵不匹配、工具健康不通过或非预期 baseline 失败即停止 |
| P5，Test 的有效 RED/TDD_READY 后 | 正式 Worker 实现冻结路径，包括 Desktop build config、Profile、SQLite schema/Adapter 和产品行为；执行冻结脚本及回归。全量 lock 复核、Test Asset Retirement 和独立 Validator 保留 | 产品/合同/依赖/权限扩张返回 MacBook |

P1 的 candidate 与 P2/P3 探针源、输入、输出/hash 保存在上述证据目录，不把实验
实现复制为正式代码；不使用旧 canonical/candidate 执行库。P3 可用最小合成表证明
SQLite 自身工作，不能预写 Session/Case schema 或六阶段产品逻辑。后续相同已核验
lock 重装可复用该授权，不可更换版本或扩大脚本集合。

P2 还须在任何安装脚本执行前，记录精确 Electron 包的 lock integrity、安装入口
相对路径及 SHA-256、允许的官方 darwin-arm64 下载来源/版本，并从该已校验 npm
包内随附的 checksum 清单固定目标二进制压缩包的预期 SHA-256。P3 仅运行此已审查
入口，保留预期/实得 SHA-256 及匹配结果，再解包使用；安装入口须能证明先校验后
使用。禁止使用环境中的自定义 mirror 或跳过/改为远程 checksum 的 override。
包中缺失该锚、脚本无法满足校验顺序、来源/平台/版本/hash 不符或需要额外脚本时
立即停止，返回 Controller；不能以同源另下载的 checksum sidecar 单独替代此锚。
本项复用 npm lock integrity 与官方包内元数据，不另建签名或供应链管理系统。

下载权限只涵盖公共 npm registry 的锁定包，以及 Electron 官方发布二进制和校验
资产所需 CDN 跳转；记录来源，不发送项目文件/真实数据或凭证。npm audit/fund 联网
关闭，不运行 npx 动态取包、brew/pip 安装、独立浏览器安装或系统权限修改。
[npm 官方安装选项](https://docs.npmjs.com/cli/v11/commands/npm-install/)说明了
package-lock-only 和 ignore-scripts 的区别；本包不把“生成 lock”与“执行安装脚本”混同。

Spec Gate 由 Mini 在 P1–P3 合格、完整 schema 映射/路径/版本/IPC/错误/命令/测试计划
闭合且整包 ponytail review 完成后执行。不能在仍有 `TBD/PENDING` 的负载决策时通过。
精确 SQL/TS 字段名可由 Spec 映射本表；若需改变业务粒度、状态、权限或新增字段含义，
仍须 Controller 决定。此条是当前 Change 有限补充，不是全项目 pre-RED 实现豁免。

## 12. 验证、接受与停止点

建议 A：每一决定都落到正例、拒绝、失败/中断和禁止副作用证据；保留 Test/Worker
隔离。替代 B：以快照/源码扫描/既有 12/12 看板测试代替产品测试，不接受。

最少验收映射：

- 1–3、10–11：exact lock/许可证/脚本审查，工具健康，packaged SQLite+驱动+正常启动。
- 4–6：三目录任一点失败、DB/rename 前后中断、回复丢失、同意图重复、损坏/未知版本，
  证明可用 Session、当前引用和 immutable bytes 没有假成功或覆盖。
- 5、7：每个归属/唯一性约束，首 Run 和 rerun、互斥、deadline/cancel/late success，
  不恢复 Provider/Run、不把旧 Completed 降级。
- 5、8：拒绝及 stale disclosure 零网络，精确 payload、无 raw 数据自动附加，Draft
  采用不改变权威结果；仅离线协议证据，不冒充真实模型验收。
- 5、9：完整确认/接受/闭环/报告版本链；父子归属、schema 不支持、IPC 越权、路径逃逸。
- 10：同一真实 `.app` 的用户六阶段及正常重开，UI 保留 PX-004/006 已接受模式和 Preview 标注。

继续原执行包的回归、独立 Validator、Git 权限和最终 MacBook 接受步骤；无新 commit/
push/PR/merge 权限提前下放给 Mini。新决定不重开已作废方案，不更改 WIP 旧材料。

## 13. 提请整体确认时的决策台账（历史保留）

下表保留提请整体确认时的授权状态及原建议，不抹除历史。用户后来作出的整体确认
逐项记录在第 14 节；以第 14 节作为当前审批状态。

| 序号 | 主题 / 建议 | 原因 | 用户决定与一致性 | 当前状态 / 证据 |
|---|---|---|---|---|
| 1 | Forge/Vite + 十个精确 pin + 开发版 0.1.0 | 一套构建/测试依赖，避免假定产品已发布 | 构建方向一致；pin/元数据待整体确认 | 部分 confirmed；§1、Mini dependency brief |
| 2 | 本机 arm64 `.app` + 现有工具链本地装配 | 真正桌面入口，避免 Finder PATH 假成功 | `.app` 方向一致；装配细则待确认 | 部分 confirmed；§2、既有 validation runner |
| 3 | 内置 node:sqlite，限定 API/事务和探针 | 避免 native npm driver/rebuild | SQLite 家族一致；具体 API/参数待确认 | 部分 confirmed；§3、官方文档 |
| 4 | SQLite 操作状态 + 不可变文件，opaque Session 目录 | 事务与大工件分离、保留 Run 合同 | 方向一致；具体库/暂存位置待确认 | 部分 confirmed；§4、Session/Runtime §3–4 |
| 5 | 16 个逻辑记录组及明确空值/关系/入口 | 消除业务字段猜测、不提前写 schema | 当前投影+历史方向一致；完整表待确认 | 部分 confirmed；§5、UI/Runtime 合同 |
| 6 | 先文件后 DB、命令收据、保留孤立内容 | 明确跨存储失败与重复处理 | 待整体确认 | pending；§6、SQLite 原子性边界 |
| 7 | 300/30 秒、重试 0、单 revision 互斥与一次终结 | 复用已有取消和迟到约束 | 预算方向一致；具体终结/恢复映射待确认 | 部分 confirmed；§7、UI 状态机 |
| 8 | 三动作精确披露、local-only raw、仅 Draft | 保持已批准的人工与模型边界 | 原规则已确认；存储表达待确认 | 部分 confirmed；§8、Runtime §5 |
| 9 | 窄 IPC、schema 1.0、无自动迁移/删除 | 最小安全和替换边界 | 原边界一致；新库策略待确认 | 部分 confirmed；§9、架构文件 |
| 10 | playwright-core + node:test、自动/正常入口两层证据 | 真实 app、原生对话框不被 mock 掩盖 | 待整体确认 | pending；§10、官方 API |
| 11 | P1–P5 有限工具准备权限 | 消除 lock 循环且保留有效 RED | 同意整理，不等于安装许可 | pending；§11、原包 Stage 2 stop |
| 12 | 按上述矩阵验证并返回既有流程 | 不新建治理平台、不省略独立验证 | 验证方向一致；完整补充待确认 | 部分 confirmed；§12、原包后续 Gate |

提请时统计：12 项整体决策；已有方向确认 10 项，新增细则当时尚待整体批准；
2 项（测试驱动、分段权限）当时无先行细节授权。结构覆盖：业务目的/所有者、对象粒度、
身份、字段组/空值/枚举、关系、生命周期/时间/版本、来源、读写、约束、治理、回滚均
见 §4–9；跨其他 base 的新结构明确不适用；§5 为当前主线/支持结构，投影不是新权威，
企业/通用迁移/Preview 执行留到后续。

提请时的请求是整体批准第 1–12 项，再发布冻结补充，由用户手动转发至原 Mac mini
任务；未经整体批准不得执行。当前批准及接收条件如下。

## 14. 用户整体批准记录 — 2026-09-19

用户在 MacBook Controller 提请整体确认本包第 1–12 项、说明“确认后提交、推送，
供用户手动转发至原任务”后，明确回复：**“确认”**。没有指定替代项或扩大范围。
因此批准的是各项建议 A 及其附带边界、风险和停止条件，不是无条件安装或直接实现。

用户确认时的文档为 36,804 bytes，SHA-256
`f7c278d58d197f2c1aef02689cd1347a7dd67b88f7ac7989feb06678239e865f`。
其 MacBook 原文封存在
`/Users/huangbo/JuanerAI-artifacts/PKG-XANTHIL-DESKTOP-001/dependency-structure-decision-20260919/user-confirmed-input.md`；
大小、shasum 与 OpenSSL 独立读回一致。第 1–12 项决策正文不变，本次仅登记批准、
保留原台账并明确同批次接收步骤。

| 序号 | 主题 / 实际用户决定 | 与原建议 | 当前状态 / 依据 |
|---|---|---|---|
| 1 | 批准 Forge/Vite、十个 exact pin、0.1.0 开发元数据 | 一致 | confirmed；整体“确认”及 §1 |
| 2 | 批准本机 arm64 `.app` 及现有分析工具链装配 | 一致 | confirmed；整体“确认”及 §2 |
| 3 | 批准 node:sqlite 限定 API、事务参数和受控探针 | 一致 | confirmed；整体“确认”及 §3 |
| 4 | 批准 SQLite/文件分工、opaque Session 与目录布局 | 一致 | confirmed；整体“确认”及 §4 |
| 5 | 批准 16 类逻辑字段组、空值/关系/读写约束 | 一致 | confirmed；整体“确认”及 §5 |
| 6 | 批准先工件后 DB、命令收据与失败/孤立内容规则 | 一致 | confirmed；整体“确认”及 §6 |
| 7 | 批准 300/30 秒、重试 0、互斥、终结和重启规则 | 一致 | confirmed；整体“确认”及 §7 |
| 8 | 批准三动作披露及其本地记录、仅 Draft 权限 | 一致 | confirmed；整体“确认”及 §8 |
| 9 | 批准窄 IPC、schema 1.0、无自动迁移/删除 | 一致 | confirmed；整体“确认”及 §9 |
| 10 | 批准 playwright-core/node:test 和真实正常入口验收 | 一致 | confirmed；整体“确认”及 §10 |
| 11 | 批准 P1–P5 分段权限、Electron 校验锚及全部停止线 | 一致 | confirmed；整体“确认”及 §11 |
| 12 | 批准验证矩阵及既有回归/Validator/Git/接受流程 | 一致 | confirmed；整体“确认”及 §12 |

当前统计：12/12 confirmed，0 个异议，0 个未决产品方向。未证明的完整依赖图、
SQLite/Electron/Playwright 兼容性和真实 `.app` 能力仍是待执行验证，不标为 PASS。
精确 SQL/TS/IPC 映射仍须正式 Spec 闭合；新增业务含义或权限仍返回 Controller。

## 15. 同批次人工转发与有界接收

接收任务固定为 `纵切-1.0`，ID `01a0b45a-13ad-7b92-a2b4-cdde980558e1`，
Mac mini 仓库 `/Users/bendandebaba/JuanerAI`。这是原批次 Stage 2 异常补充，不是
新批次；按既有政策保留原任务，不新建/迁移，不自动发送消息。

本次只读接收侧核对：`mac-mini`，分支 `work/macbook/whitepaper-blueprint-v1`，
HEAD `ed3ac662e5bfd1067d0593631644371fbaaebf7a`，tree
`924950033b592a139499c75bd7347987f5e72d3d`。没有 tracked/staged 改动，只有本
Change 下已知 12 份未跟踪 Markdown 草案：decision-brief、dependency-decision、
design、path-contract、proposal、structure-decision、tasks、test-plan、traceability、
verification，以及 specs/local-analysis/spec 和 specs/xanthil-desktop-decision-case/spec。
这次观测不是持续在线证明。

1. 用户把含固定 commit/tree/本文 SHA-256 的发布回执转发给该任务。Mini 先核对设备、
   路径、branch/HEAD、上述草案清单与当前独占写入；如与预期不符，保留现场并停止。
2. 记录这 12 份草案的字节数和 SHA-256，保留原文；不得为满足 clean 条件而 reset、
   stash、清理、覆盖或提前提交它们。本次补充允许在只有这些已知、无冲突 untracked
   草案时接收，不把它们当成“意外脏树”。
3. Fetch 源分支 `work/macbook/wip-preflight-exception-disposition`，验证发布回执的
   固定提交、tree、本文 hash、原执行包 hash 及预期父提交 `ed3ac662…`。检查完整
   diff：只能是本决策/审查/规划入口/产品说明和 Controller 看板记录，不能触碰 Mini
   草案路径、生产源码或角色配置。远端 ref 漂移、路径重叠或存在未预期变更即停止。
4. 仅授权在 Mini 已有分支执行一次 `git merge --ff-only <固定提交>`；不切换 main、
   不改分支所有者。若已处于该提交，核对后跳过。导入 Controller 看板记录不授予 Mini
   看板写权限。合并后逐份复核草案 hash/大小与前值一致；有差异即停止。
5. 保留 Stage 0/1 PASS 与 WIP_DISPOSITION_COMPLETE；不重复 sudo、pointer/State/
   pause/Ledger/Host Loop 处置。按已批准 §11 从 Stage 2 的 Spec 修订及 P1–P3 开始，
   将 Mini 草案 XDESK-DEP-001/XDESK-STRUCT-001 映射为本文批准决定，不沿用旧 1A
   多文件操作库建议或错误的产品 1.0.0 假设。
6. 后续按原包连续执行正常 Gates；Spec Gate 不是因本批准自动通过。正式 Spec/Test/
   Worker/Validator 各用其 R2 xhigh 路由，仍由 Mac mini 协调者组织。超出批准范围
   或触发停止条件，保留证据并回传一次异常，不扩建工具或自行换依赖。

MacBook 本次只提交并推送此文档/状态补充，不派发生产角色、不执行 Mini 命令；
不新增 PR/merge/主机/Provider/真实数据权限。原执行包字节及其他权限保持不变。
