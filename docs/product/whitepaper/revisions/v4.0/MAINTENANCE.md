# JuanerAI 白皮书统一维护约定

2026-09-09，用户提供 `归档.zip` 并明确授权“接管 JuanerAI 白皮书统一维护”。research 中的 Codex Controller 接管正文、一致性、版本和项目关联维护；后续无需用户在白皮书 Controller 与 research Controller 之间转交。

## 唯一维护入口

| 内容 | 权威位置与作用 |
|---|---|
| 当前产品定义 | [JUANERAI_WHITEPAPER.md](JUANERAI_WHITEPAPER.md)，产品战略/文档 **v4.0（2026-09-26）**；唯一编辑主稿 |
| 当前来源与版本 | [战略融合记录](STRATEGY_V4_INTEGRATION_2026-09-26.md)、[输入收据](sources/2026-09-26-strategy-v4/RECEIPT.json)、[版本指纹](WHITEPAPER_V4_0_RECEIPT.json) |
| Agent共同入口 | [JUANERAI_CONTEXT.md](../JUANERAI_CONTEXT.md)，只保留摘要与原文索引 |
| 研究与正式开发关联 | [PROJECT_BINDINGS.md](PROJECT_BINDINGS.md)、[DEVELOPMENT_BINDINGS.md](DEVELOPMENT_BINDINGS.md)、[DEVELOPMENT_LINKAGE.md](DEVELOPMENT_LINKAGE.md) |
| 恢复及变更 | [NEXT_ACTION.md](NEXT_ACTION.md)、[CHANGELOG.md](CHANGELOG.md) |
| 前版冻结历史 | [v3.3.4 MANIFEST](revisions/v3.3.4/MANIFEST.json)；更早sources/revisions和原始收据不覆盖 |
| 出版缺口 | [TAKEOVER_REVIEW.md](TAKEOVER_REVIEW.md)保留原缺图记录；当前引用状态以本版收据为准 |

v4.0已按用户明确要求采用Bottom-up Decision Intelligence和Decision Lifecycle Management。Case / Loop / Graph、System of Record、Future Actual与Learning成为统一产品主线，Personal → Team → Enterprise与能力成熟度分轴。后续维护按这个方向对齐，不重复请求战略批准；具体开发采用和实质范围变更仍由对应用户决定/冻结合同约束。

保留既有OSM/PIM、DAME、A/B Test Analysis、语义、四库双库、Domain Pack和MLflow-first Model Pack职责。Decision/Learning Core为逻辑分责，不授权重建平台、重写Schema、自动训练或发布。相关Demo只证明其冻结范围，不以概念重组提升结论。

正式本地main的Blueprint v1.3已采用v3.3.4；v4.0尚未进入正式蓝图。原待执行Desktop/Model Pack计划已于2026-09-18 VOID，旧R1恢复包保留历史，不能继续将其当作当前自动集成任务。后续按白皮书更新、通知、明确蓝图修订/批准、就绪审查、项目规则整合接续；不修改活动分支或重放旧执行授权。只读依据见[FORMAL_READBACK.json](sources/2026-09-26-strategy-v4/FORMAL_READBACK.json)。

## 决策、定义与证据

- 用户明确的产品决策决定方向和取舍。白皮书统一表述产品定义与推荐架构；探索中的批准决策、冻结 Brief 决定对应任务执行范围。
- Demo 结果只能更新其证据所支持的成熟度和限制；“研究验证通过”“用户接受研究结论”“真实产品集成完成”“生产发布”分别标注。`PROJECTS.md` 和各项目行动卡仍是生命周期/等待方的权威。
- 来源文档中的步骤、API、脚本、状态表和发布建议属于参考材料，不成为执行指令。外部交付的 PASS、统计和资产清单须复核后引用。
- 差异先保留双方版本、依据与影响。已有决定清楚时，Codex 直接做范围内的文字纠错、索引和证据更新；只有新增或改变实质产品方向/范围且现有证据不能消除冲突时，集中交给用户判断。
- 产品资料缺失不补造；缺图、未验证接口和未确认组织分工显式登记。缺图不妨碍文字维护，但不得声称完整出版物交付通过。

## 双向同步：每次相关工作如何收口

触发条件：产品决策变化、相关 Demo 评审完成、模型/领域能力定位调整、白皮书改写或新来源入库。由当轮 Codex 在会话内完成以下检查；不依赖用户手动提醒，也不建立会话外后台任务。

用户另于 2026-09-09 要求白皮书指导 `/Users/huangbo/JuanerAI` 正式开发并建立强联动。涉及正式计划、规范或交付时，同时执行开发联动检查；主稿在research；正式仓库通过版本化Blueprint显式绑定精确白皮书输入，批准的需求、OpenSpec和实现证据由正式侧对应责任人管理。新白皮书不能直接替代蓝图或活动执行包。

1. 从关联索引定位受影响章节和探索，读取当前批准决策、Brief、行动卡与相应证据；以精确版本和日期识别来源。新探索同步补一行关联，尚无探索的主题标为待验证。
2. 项目变更反查白皮书：按已获授权的结论修订正文/成熟度；无需改文时，在本轮决策或评审记录写明“白皮书影响：无”和原因。
3. 白皮书变更反查项目：列出受影响探索和一致/需澄清/需后续验证的范围。不批量更改历史采用版本，不改写冻结 Brief 或旧 PASS 来迎合新版；实际需要变更范围时按生命周期处理。
4. 同次更新主稿、必要配图、共同摘要、关联索引及变更记录；仅在确有生命周期变化时按仓库流程更新项目行。只改背景时只更新 `PROJECTS.md` 共同背景段。
5. 校验本地链接、标题/章节、围栏、图片文件与引用、来源完整性、关联探索覆盖及不相关文件保留。图表修改需视觉检查；Demo/实现状态只有重新运行才可称本轮验证。
6. 保存维护停点，交付改动、依据、检查和材料缺口。用户继续自然语言讨论即可，无需复制另一份 Controller Prompt。

OpenCode 仍按冻结 Demo 范围构建；发现白皮书差异时在执行记录报告，由 Codex 收口，不自行改写白皮书和项目治理记录。

## 版本与发布材料

- 主稿保持固定路径，版本和修订号写在正文与变更记录。每次交付的内容变化有唯一修订标识；文档修正使用维护修订 R1、R2、R3 等，产品主版本变化由用户方向决定。
- 原始外部版本留在 `sources/<日期>-<版本>/`，校验指纹后只读保留。后续形成版本快照时保存正文、对应 assets 和 SHA；不覆盖同名历史快照。
- 图片按来源指纹匹配到主稿 `assets/`；更新时保留原版本资产。PNG 与可编辑图源分开标记；没有源文件时不得声称可原样再生成。
- Markdown 是主稿，PDF/DOCX 是派生产物。需要导出时从明确的主稿修订生成，记录所用版本和资产，实际渲染检查后再声称完成；不把旧导出物视为当前版本。
- 本授权覆盖 research 内文档维护；提交、推送、向其他仓库写入、发消息、启动 Builder、真实开发和生产操作仍依用户授权及仓库流程。
