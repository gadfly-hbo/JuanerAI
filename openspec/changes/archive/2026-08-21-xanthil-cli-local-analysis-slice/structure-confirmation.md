# Xanthil CLI First Run Contract — Structure Confirmation

## Status

- Change: `CHG-xanthil-cli-local-analysis-slice`
- Confirmation package: `XCLI-STRUCTURE-001`
- Date: 2026-08-20
- Status: **APPROVED**
- Scope: `.xanthil/runs/` durable layout and the first run's machine-readable records
- Exception: none

## Approval Record

- User decision: approved all 13 recommended A options
- Approved at: 2026-08-20
- Structural modifications: none
- Separate environment decision: Pi default model changed to `xiaomi-token-plan-cn/mimo-v2.5-pro`; this does not alter the structural package

This is the complete pre-implementation structural decision package required by `agentharness-structure-grill`. It proposes the minimum durable structure needed by the approved slice; it does not create a schema or authorize implementation.

## Evidence and Existing Constraints

- The product plan proposes `summary.md`, `evidence.md`, `queries/`, `scripts/`, `outputs/`, and `run.json` under `.xanthil/runs/`.
- `AGENTS.md` requires source, lineage, time, transformation, model, and run provenance.
- `docs/architecture/data-authority.md` distinguishes source data, analytical output, model result, Decision, Action, and audit evidence.
- `docs/architecture/security-boundaries.md` forbids treating Pi as a security boundary and requires explicit egress.
- No existing Xanthil product run schema, migration, compatibility obligation, or historical data exists.

## Confirmation Package

### 第 1 项：业务目的、所有者和非目标

**我的建议：** 持久结构只保存一次已确认分析的生命周期、输入快照、可复算资产、Evidence 和人类可读 Summary；由 Application 拥有业务写入语义，由 Local Artifact Adapter 执行文件写入。

**原因：** 这足以支持首切片的可复算与失败可见性，同时避免把本地目录扩张成 Session 数据库、Trace Platform 或业务事实库。

- 建议选项 A：采用上述最小运行记录。
- 替代选项 B：只保留 Markdown，无机器合同；实现更快，但无法可靠验证状态、来源和 Evidence 引用。
- 替代选项 C：增加 SQLite/完整 Trace；超出首切片并混淆运行状态与分析数据职责。

### 第 2 项：持久对象及权威含义

**我的建议：** 只定义四类持久记录：

1. `Run Manifest`：一次运行的生命周期、运行时身份、输入和资产索引；它是运行 ReadModel，不是业务事实。
2. `Analysis Contract Snapshot`：用户确认的业务问题、目标、数据范围、指标口径和输出要求；它是任务边界快照。
3. `Evidence Index`：分析 Finding、支持状态、Evidence 项和资产引用；它是分析输出，不是 Decision。
4. `Human Documents and Analysis Assets`：`summary.md`、`evidence.md`、SQL、Python 和输出文件。

**原因：** 生命周期、用户确认、机器可验证 Evidence 与人类阅读关注点不同，分开后每个文件保持单一职责。

- 建议选项 A：四类记录分离。
- 替代选项 B：全部塞入 `run.json`；文件少，但合同过宽且容易产生部分更新冲突。
- 替代选项 C：只保存 Pi Session；Session 是上下文，不是权威 Evidence 或运行合同。

### 第 3 项：粒度与创建时点

**我的建议：** 一个 run 表示“一个已确认 Analysis Contract 的一次执行尝试”。只有 Analysis Gate 获得用户明确确认后才创建 run；确认前的探索对话不进入该运行合同。

**原因：** 一次确认可能失败、取消或重试。把每次尝试独立保存，状态与 Evidence 才不会相互覆盖；同时避免把未确认对话误记为正式分析。

- 建议选项 A：一份确认合同、一次执行尝试、一个 run。
- 替代选项 B：同一 run 内原地重试；会混合多次执行的模型、时间和资产。
- 替代选项 C：CLI Session 即 run；会把 Memory/对话上下文错误提升为权威运行记录。

### 第 4 项：稳定身份、目录名和去重

**我的建议：** Application 生成 UUIDv7 `run_id`；目录固定为 `.xanthil/runs/<run_id>/`。显示标题不参与身份或路径。相同问题再次执行产生新 `run_id`，不自动去重。

**原因：** UUIDv7 可排序、无业务含义、不依赖不安全的用户文本，也不会把重试伪装成原运行。

- 建议选项 A：UUIDv7 作为唯一身份和目录名。
- 替代选项 B：时间戳加 task slug；可读但有碰撞、字符安全和重命名问题。
- 替代选项 C：内容哈希；相同输入在不同模型、时间或配置下仍是不同运行，不适合身份。

碰撞或已存在目录必须 fail closed，不覆盖、不合并。

### 第 5 项：目录布局和文件职责

**我的建议：** 固定以下 v1 布局：

```text
.xanthil/runs/<run_id>/
├── run.json
├── analysis-contract.json
├── evidence.json
├── summary.md
├── evidence.md
├── queries/
│   └── Q-001.sql
├── scripts/
│   └── S-001.py
└── outputs/
    └── O-001.<ext>
```

空资产目录可省略；核心 JSON 文件名固定。Markdown 是人类视图，JSON 是机器合同。不得保存完整 Pi transcript、凭证、环境变量或源数据副本。

**原因：** 保留产品计划中的熟悉布局，同时补足机器可验证的 Analysis Contract 与 Evidence。

- 建议选项 A：采用上述布局。
- 替代选项 B：取消 `evidence.json`；更轻，但 Finding 与 Evidence 的引用只能靠脆弱的 Markdown 解析。
- 替代选项 C：复制全部输入与 Session；复算看似方便，但扩大隐私、容量和权威边界。

### 第 6 项：`run.json` 逻辑字段组

**我的建议：** v1 只包含以下必需逻辑字段组；正式 JSON Schema 在批准后按这些语义创建：

| 字段组 | 含义 | 必需性与空值语义 |
|---|---|---|
| `schema_version` | Run Manifest 合同版本，首版精确为 `1.0` | 必需；不允许空值 |
| `run_id` | UUIDv7 运行身份，与目录名一致 | 必需；不允许空值 |
| `analysis_kind` | 首版唯一允许值 `analyst_assistant` | 必需；closed enum |
| `status` | `in_progress`、`succeeded`、`failed`、`cancelled` | 必需；closed enum |
| lifecycle time | UTC RFC 3339 `started_at`；终态必有 `ended_at` | 必需；进行中不出现 `ended_at`，不用 `null` |
| runtime | Xanthil 版本、Pi Adapter 版本、Pi 版本 | 必需；不记录安装路径 |
| model | provider、model ID；可选 thinking level 仅当运行时明确返回 | provider/model 必需；绝不记录 credential |
| contract reference | `analysis-contract.json` 相对路径和 SHA-256 | 必需；不允许空值 |
| sources | 一到多个已批准 source descriptor | 必需；首版至少一个 CSV |
| artifacts | Application 分配的资产 ID、类别、相对路径、媒体类型、SHA-256 | 允许进行中为空；终态记录全部保留资产 |
| evidence reference | 成功时 `evidence.json` 的路径和 SHA-256 | 仅 `succeeded` 必需；其他状态不得伪造完成 Evidence |
| terminal detail | 失败阶段与稳定错误码，或取消阶段 | 仅对应终态必需；message 必须经过脱敏且不可作为稳定枚举 |

**原因：** 用 status-discriminated closed schema 消除 `null` 与“半成功”歧义，同时保留复现和故障诊断所需最小信息。

- 建议选项 A：采用上述字段组和按状态区分的 closed schema。
- 替代选项 B：所有字段可选或 `null`；实现简单，但状态组合不可验证。
- 替代选项 C：记录完整配置、Prompt 和环境；信息更全，但泄露面和兼容负担过大。

### 第 7 项：Source Descriptor 与数据时间

**我的建议：** 每个 source 记录 Application 分配的 `source_id`、closed `kind=csv`、Workspace 内规范化相对路径、内容 SHA-256、字节数、读取时刻和 fixture 数据版本；禁止绝对路径、`..`、Workspace 外 symlink 解析和原始行副本。业务时间范围由 fixture 合同定义并在 Analysis Contract 中引用，不从文件 mtime 猜测。

**原因：** 内容哈希确认实际快照，相对路径保证可移植与最小暴露；文件修改时间不是数据发生时间。

- 建议选项 A：相对路径 + SHA-256 + fixture 版本。
- 替代选项 B：只存文件名；无法确认输入快照。
- 替代选项 C：存绝对路径和完整副本；泄露本机信息并扩大数据保留边界。

首切片不做跨来源实体去重，也不定义通用 source identity。

### 第 8 项：Analysis Contract Snapshot 字段组

**我的建议：** 必须包含 `schema_version=1.0`、`run_id`、确认时间、原始业务问题、分析目标、被引用的 source IDs、分析时间范围、指标定义列表、输出要求和明确约束。每个指标至少具有稳定 `metric_id`、显示名、业务定义、分析粒度、目标人群/集合和单位；不允许缺口由模型自行补默认值。

**原因：** 这些正是 Analysis Gate 需要冻结的语义。缺少它们时，即使 SQL 正确也无法判断是否回答了同一个问题。

- 建议选项 A：保存完整已确认快照。
- 替代选项 B：只保存用户原始 Prompt；无法证明口径和范围得到确认。
- 替代选项 C：保存全部对话；混入未确认意见并扩大敏感内容。

首切片的一份 Contract Snapshot 与 run 一对一，用 `run_id` 作为关联身份，不额外引入可复用 Contract 实体。

### 第 9 项：Evidence Index、Finding 状态和引用

**我的建议：** `evidence.json` 必须包含 `schema_version=1.0`、`run_id`、Findings 和 Evidence Items：

- Finding 使用 Application 分配的 `F-001` 顺序 ID、陈述、closed 状态 `supported | contradicted | inconclusive`、Evidence ID 列表和明确 limitations。
- Evidence Item 使用 `E-001` 顺序 ID、说明、source IDs、一个或多个资产 ID，并可记录机器可验证的结构化结果引用。
- SQL/Python/output 资产使用 `Q-001`、`S-001`、`O-001`；ID 只在单次 run 内稳定。
- `summary.md` 和 `evidence.md` 必须从已验证结构生成或与其一致性校验，不能成为另一套权威事实。

**原因：** `supported`、`contradicted`、`inconclusive` 区分正向证据、反证和证据不足；稳定引用让每个结论可追到实际计算资产。

- 建议选项 A：结构化 Evidence Index + 人类 Markdown 视图。
- 替代选项 B：只存自然语言 Evidence；难以做完整性和负向验证。
- 替代选项 C：把 Finding 标成 Decision/Truth；违反 JuanerAI 数据权威与决策边界。

### 第 10 项：写入、读取、原子性和不可变性

**我的建议：** 只有 Application 的运行记录能力可以写核心 JSON/Markdown；模型不可获得通用 `write/edit` 权限。分析 Tool 只能通过受控 Artifact 接口创建编号资产。JSON 和 Markdown 使用同目录临时文件 + 原子 rename；资产文件以新 ID 追加，不原地覆盖。run 进入终态后全部结构只读。

读取入口仅为当前 CLI 的结果显示、复算验证器和测试；`sessions/list/delete` 产品命令不在首切片。

**原因：** 避免模型篡改自己的状态和 Evidence，也避免崩溃产生看似成功的半文件。

- 建议选项 A：Application 单写者、原子核心文件、资产 append-only、终态不可变。
- 替代选项 B：模型直接写全部文件；无法信任状态和 Evidence。
- 替代选项 C：SQLite 事务；超出首切片且引入新的存储职责。

### 第 11 项：生命周期、失败、取消与重试

**我的建议：** 唯一允许状态转换：

```text
in_progress -> succeeded
in_progress -> failed
in_progress -> cancelled
```

终态不可逆。失败和取消保留已完成的编号资产，但不得存在“成功 Evidence”引用或完成结论；失败阶段和稳定错误码必须记录。没有产品级自动重试；用户重试会创建新 run。

**原因：** 这是最小、可测试、不会混淆多次执行的生命周期。

- 建议选项 A：四状态单向生命周期，新 run 重试。
- 替代选项 B：增加 paused/retrying/partial_success；首切片没有对应恢复行为，会形成假状态。
- 替代选项 C：失败后原 run 回到进行中；会破坏不可变审计和资产归属。

若进程在写终态前崩溃，遗留 `in_progress` 不自动宣称失败；下次只读检查可以报告 `abandoned candidate`，恢复/修复命令另行设计。

### 第 12 项：版本、兼容、迁移、保留与回滚

**我的建议：** 每个 JSON 合同独立携带精确 `schema_version=1.0`；读者只接受明确支持的版本，未知版本 fail closed。首版无迁移、backfill、dual-read 或自动升级。CLI 不自动删除 run；用户按普通文件所有权管理保留。回滚只停用入口/Adapter，不删除既有 Artifacts。

**原因：** 当前是 greenfield，无历史数据；提前设计迁移器没有证据，但版本与 fail-closed 必须从第一天存在。

- 建议选项 A：精确版本、无首版迁移、未知版本 fail closed。
- 替代选项 B：无版本直到以后；首个持久文件会立即成为无名兼容债务。
- 替代选项 C：先建通用迁移框架；超出当前证据和预算。

### 第 13 项：阶段分类、治理和后续边界

**我的建议：**

- Mainline：Run Manifest、Analysis Contract Snapshot、Evidence Index、Summary 和引用资产。
- Supporting structure：目录布局、原子写入、校验和、ID 分配。
- ReadModel：`run.json` 与人类 Markdown；它们都不是业务事实库。
- Later：Session resume、run listing/deletion、retention policy、真实数据分类、加密、跨 Workspace 身份、Workflow 状态、SQLite、Trace Platform。

实现后逐项对照本决策账本验证；任何新增字段、状态、默认值、目录或写入口都必须暂停并提交结构 addendum。

**原因：** 明确主线和延期项可阻止首切片吸入平台化需求。

- 建议选项 A：采用上述阶段分类和 drift stop line。
- 替代选项 B：为后续 Workflow 预留开放字段；会削弱 closed schema。
- 替代选项 C：现在同时设计全部未来结构；违反 Keep It Small 与 greenfield_fast_path 预算。

## 不适用项说明

- 数据库表、索引、事务隔离：不适用；首切片不引入数据库。
- 跨 Base identity 或 joint contract：不适用；不接入 Ontology、Knowledge、Memory 或 Console。
- 关系删除级联：不适用；CLI 不提供删除行为。
- 多租户、用户身份、RBAC：不适用；批准范围是 personal Profile 单用户本地边界。
- 加密和 residency：不适用当前非敏感合成 fixture；真实数据 Change 必须重新决策。

## 完整性检查

- [x] 每个持久对象有目的和所有者。
- [x] grain、identity、source identity 和去重语义明确。
- [x] 字段组含义、必需性、空值、枚举、时间和版本语义明确。
- [x] 关系方向和一对一/一对多基数明确。
- [x] provenance 和 lineage 可跨输入、资产、Finding 保存。
- [x] 写入、读取、原子性和终态不可变明确。
- [x] ReadModel 未被误当作业务实体或事实。
- [x] migration、compatibility、retention 和 rollback 已处理。
- [x] mainline、support、ReadModel 和 later 已分离。

## Approved Decision Ledger

| Sequence | Topic | Recommendation | Reason | User decision | Consistency | Status | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | 目的和所有者 | A | 最小可复算运行记录 | A | 一致 | Confirmed | Product plan; AGENTS.md; user approval 2026-08-20 |
| 2 | 持久对象 | A | 分离生命周期、合同、Evidence 与视图 | A | 一致 | Confirmed | Data authority; user approval 2026-08-20 |
| 3 | 粒度 | A | 一份确认合同的一次尝试 | A | 一致 | Confirmed | Approved slice; user approval 2026-08-20 |
| 4 | 身份 | A | UUIDv7，重试新 run | A | 一致 | Confirmed | Greenfield; user approval 2026-08-20 |
| 5 | 布局 | A | 五个核心文件与编号资产目录 | A | 一致 | Confirmed | Product plan; user approval 2026-08-20 |
| 6 | Run 字段组 | A | status-discriminated closed schema | A | 一致 | Confirmed | Failure contract; user approval 2026-08-20 |
| 7 | Source descriptor | A | 相对路径、SHA-256、fixture 版本 | A | 一致 | Confirmed | Provenance policy; user approval 2026-08-20 |
| 8 | Analysis Contract | A | 保存完整确认快照 | A | 一致 | Confirmed | Analysis Gate; user approval 2026-08-20 |
| 9 | Evidence | A | 结构索引与 Markdown 视图 | A | 一致 | Confirmed | Evidence First; user approval 2026-08-20 |
| 10 | 读写与原子性 | A | Application 单写者、append-only 资产 | A | 一致 | Confirmed | Pi safety boundary; user approval 2026-08-20 |
| 11 | 生命周期 | A | 四状态单向、新 run 重试 | A | 一致 | Confirmed | Fail-closed; user approval 2026-08-20 |
| 12 | 版本与回滚 | A | 精确 1.0、无首版迁移、保留旧文件 | A | 一致 | Confirmed | Greenfield; user approval 2026-08-20 |
| 13 | 阶段分类 | A | 主线最小化、未来项延期 | A | 一致 | Confirmed | MVP scope; user approval 2026-08-20 |

## Approved Structural Result

13 项 A 方案已整体批准。现在授权在本 Change 的 Specification/Design 中形成对应 closed schemas 和合同；依赖安装、测试和产品实现仍分别受 Spec Gate、Test Design/RED 与 Implementation Gate 约束。
