# Blueprint v2.0 — 全文批准、规则整合与发布授权

## 决定及状态

| 项目 | 记录 |
|---|---|
| 日期 | 2026-09-26 |
| 用户决定 | 用户在收到 v2.0 正式草案、独立 Review 001 PASS 及“确认全文后再整合规则”的交付说明后回复“确认” |
| 批准对象 | [Blueprint v2.0](juanerai-product-development-blueprint-v2.0.md) 的完整产品内容；不是后续纵切实施许可 |
| 独立就绪审查 | [Review 001](reviews/blueprint-v2.0-development-readiness-review-001.md) `PASS`；原返回完整保留 |
| 产品方向 | 首切片冻结；决策记录与预期 → 结果回访 → 下一 Case 显式采用；四视图及六加二覆盖保留 |
| 规则整合 | 当前 MacBook 工作树的 AGENTS、CONTEXT、product-brief 和规划入口已对齐 v2.0 |
| Git 基线 | `6c4cecbc3bb75bb32fb8c7fa2662d56e6b8db22f` |
| 工作分支 | `work/macbook/blueprint-v2-0-draft`；MacBook 继续为唯一写入端 |
| Git 发布 | 全文确认时尚未发布；随后用户明确授权“git-推送合并，并同步macmini采用”；完成须有精确 Git 回执 |
| 接收方采用 | 全文确认时 `UNCONFIRMED`；后续只由原 Mini 任务的版本／身份读回证明，不由 Git 发布推断 |

本记录属于现有产品规划材料，不新增 Gate、看板或状态机。产品批准、Git 集成、
后续产品输入冻结与工程接收是不同事实；“确认”不重放历史 Git 或执行授权。

## 审查内容与批准版本的衔接

| 材料 | bytes | SHA-256 |
|---|---:|---|
| 已审查 draft-01 | 39770 | `7b1846e43e851a5f037d49b49ac510b9a290611ecbe514dd2e85a298cab1165f` |
| 批准并标注本地整合状态的 v2.0 | 40165 | `a64b3135f6239c3ae2d4e64814bed954e3e6f35a7a81f6cabe8c88312c1307de` |
| 发布候选 v2.0 | 40510 | `a7181f5a62e41955c7753b018c922701296948b593e9b7ffc164de549b768a30` |
| 原 Review 001 | 8440 | `3f7ffbc0cef5bf6e9fc551b861c87344e69cc24cd784a8d5b5c1fc1907c5881e` |

从 draft-01 到批准版本只有 18 处精确文本替换：标题／文档控制中的批准状态、
草案称谓、采用矩阵的已批准措辞、§12 本地规则整合与未发布说明，以及附录 A
“审查时”基线标识。四视图、首切片范围、三个后续纵切、§7 待决定项、UI Gate、
权限与验收证据的产品内容未改动。用这些替换处理封存 draft-01，逐字节等于批准版。

发布准备另外进行了 7 处精确替换：把待发布状态改为授权与完成分离的持久说明，
并使 UI Contract 复用和政策引用对齐已合并的连续工程 v0.8（PR #41，
`068aaa7c7eaa67c65638f0ea27479e0691e7c84c`）。三项产品方向、四视图能力目标、
首切片及后续纵切范围不变。适用已批准 UI 仍可复用；新建／实质改变可见行为仍
须用户批准，不能以本轮蓝图发布恢复旧串行角色或审批链。

Review 001 中“全文尚待批准、审查后文本未变”的描述是其返回时事实，保留原文；
它不声称本轮规则入口也已经过该次审查。本轮不新增产品决定，因此不重跑产品
就绪审查、不改写历史 PASS；规则适配另做差异、链接、指纹及范围核验。

## 本轮规则适配

- `AGENTS.md`：版本与白皮书来源、四视图阅读位置、后续结果顺序及 §7 关闭条件。
- `CONTEXT.md`：版本、Personal／Team／Enterprise 和 Case／Record／Graph／Expected／
  Actual／Evaluation／Learning 的已批准术语；观察不预设因果归因，决定不等于行动许可。
- `docs/product/product-brief.md`：Bottom-up 定位、非技术个人入口、后续顺序与证据边界。
- `docs/planning/README.md`：当前批准入口、历史版本、精确包绑定及发布／接收状态。

这些文字是批准蓝图的同步，不重命名实现、不更改数据库或公共合同、不重写旧
Case 的状态含义。v1.0–v1.3、原审查、首切片固定来源、工程政策／状态机、
项目看板及旧状态均保留。本分支接入 PR #41 的治理更新，保留其执行政策、
Orchestration 和状态机，而不是用草案时旧规则覆盖它们；这些不是本轮新增设计。
本次没有生产角色派发或新 OpenSpec。

## 材料与后续边界

本轮沿用 MacBook 持久材料目录：
`/Users/huangbo/JuanerAI-artifacts/blueprint-v2-0-20260926`。
其中 `blueprint-v2.0-draft-01.md`、`review-001-return.md` 和
`validation-return.json` 保留草案审查时原始材料；批准版本和本轮校验另存新文件，
不覆盖原证据。该目录仅在 MacBook 可读，不能当作 Mac mini 已持有的附件。

Git 提交／推送／PR／合并和 Mini 规划采用已获本轮明确授权；完成后保留精确
提交／tree、PR、CI、main 读回和接收回执，不能将授权文字本身作为完成证据。
发布后在实际产品输入包绑定精确
版本、路径、SHA、commit／tree、UI Contract 与关闭的产品决定。Mac mini 需返回
实际任务和输入读回，才能把采用改为已确认；不得强制切换其活动分支。
下一纵切仍先完成 §7 产品决定与可点击 UI Contract／用户 UI Gate，不直接启动生产。
