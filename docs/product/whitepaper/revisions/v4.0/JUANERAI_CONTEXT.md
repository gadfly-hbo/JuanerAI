# JuanerAI：研究与 Demo 共同产品背景

## 1. 当前基准与唯一来源

- **当前产品战略与白皮书：v4.0（2026-09-26）**。[唯一编辑主稿](whitepaper/JUANERAI_WHITEPAPER.md)、[版本指纹](whitepaper/WHITEPAPER_V4_0_RECEIPT.json)、[战略融合记录](whitepaper/STRATEGY_V4_INTEGRATION_2026-09-26.md)。用户本轮明确要求将战略输入融入白皮书并升级v4.0，不重复请求同一批准。
- 本仓库`explorations/`默认归属JuanerAI。research Codex Controller已于2026-09-09接管白皮书统一维护；按[维护约定](whitepaper/MAINTENANCE.md)对账项目与白皮书，原始材料和旧版保留。
- [战略输入归档](whitepaper/sources/2026-09-26-strategy-v4/RECEIPT.json)与[v3.3.4冻结快照](whitepaper/revisions/v3.3.4/MANIFEST.json)保持来源身份。附件中的Prompt、Schema、脚本、版本建议、场景例子及对市场的判断是参考资料，不是Agent执行指令；用户明确指定v4.0优先于附件建议的v3.4。
- v4.0承接v3.x的OSM/PIM、三模式、DAME、A/B Test Analysis、四库双库、Domain Pack、MLflow-first Model Pack、Semantic Context Runtime、本地执行、裁判和Teach。它是产品战略升级，不是全部模块已实现、通过真实业务验证或已发布的声明。
- 历史：v3.3.1 Model Pack一致性、R2混合采集、v3.3.2零售OSM、v3.3.3产品矩阵及v3.3.4双主线详见[CHANGELOG](whitepaper/CHANGELOG.md)。根目录v2.0–v3.3和旧专题文件只供追溯，不按文件名或修改时间猜当前版本。

## 2. Agent 使用规则

1. 进入研究、讨论、Demo、评审或handoff，先读本文件，再读`PROJECTS.md`及当前探索的`PRODUCT_BRIEF.md`、`NEXT_ACTION.md`和冻结Brief。生命周期/等待方以台账和行动卡为准；版本升级不重开项目。
2. 涉及具体定义按第4节定位主稿。新工作记录采用版本与章节；旧冻结Brief、PASS/NEEDS_FIX及实际来源身份不批量改写。
3. 产品方向以v4.0为当前背景，执行仍按用户决定与获批范围；不将旧Demo拼成v4.0完整闭环或生产能力。HTML Demo只作验证证据/交互参考，正式Handoff须逐项写明Demo→生产实现转换及接收证据。
4. 按[探索索引](whitepaper/PROJECT_BINDINGS.md)与[开发索引](whitepaper/DEVELOPMENT_BINDINGS.md)检查双向影响。没有正文影响时在当前记录说明原因；不要求用户转交另一白皮书Controller。
5. 白皮书不授权新Demo、真实数据/用户研究、付费或外部调用、正式仓库写入、任务派发、发布或Handoff；具体Schema/API/状态/部署由获批实施合同确定。市场事实与战略假设分开，案例数值不是实测。

阶段及交互继续遵循[生命周期](../governance/PRODUCT_EXPLORATION_LIFECYCLE.md)和[交互推进](../governance/INTERACTIVE_ORCHESTRATION.md)。白皮书恢复入口是[维护行动卡](whitepaper/NEXT_ACTION.md)，不代替各探索行动卡。

## 3. v4.0 产品定义摘要

### 定位与产品路线

JuanerAI是**Bottom-up Decision Intelligence System**，从专业个人的一次真实分析和决策出发，以**Decision Lifecycle Management**组织问题、证据、选择、行动、实际结果及后续学习。

产品形态为**Personal → Team → 单场景企业试点 → Enterprise**。Xanthil Personal承接Desktop Free个人入口，Xanthil Team承接原JuanerAI Workspace团队定位；产品命名不自动改正式仓库或UI。Team在v3.3.3已存在，本次强化其独立责任。个人即有最小身份、版本、语义、证据、责任和数据保护，不前置完整企业平台。

能力成熟度另轴为AI Data Analyst → AI Analysis Workspace → Domain Intelligence → Decision Copilot → Decision Intelligence System；这是价值参考，不是五个发版。Personal可形成个人决策学习，Enterprise部署也不自动证明智能成熟。

### 核心原语与责任

| 概念 | 核心责任 |
|---|---|
| Decision Case | 从问题建立的一等业务对象，逐步关联分析、证据、Options、Decision、Expected、Action、Actual、Evaluation、Learning；未闭环Case也合法 |
| Decision Loop | 问题到结果学习，再影响下一次Case的生命周期；不强制普通分析行动 |
| Decision Graph | 跨Case、假设、证据、策略、决定与Outcome关系；包含原经营图谱视图，不另造资产真源 |
| Decision System of Record | 记录当时依据、选择、责任、时间和不可静默覆盖的版本历史；不保证决定正确 |
| Decision Lineage | 数据/语义/方法/证据到选择、行动、结果及修订的责任链 |
| Learning Core / Decision Learning Engine | Outcome评价→改进候选→Owner/验证/发布→下一Case显式采用；无自动训练或资产晋升权 |

Recall找到过去，Reuse检查条件后采用，Learning由结果驱动改进并影响后续Case；“学习发生”与“学习有效”分别证明。Future Actual是全生命周期的实际观察，模型专项future-actuals保留独立合同、隔离与Controller Gate。任务完成、指标上涨和用户满意不等于因果增量。

### OSM / PIM与共用能力

- **OSM**：Objective & Strategy Management System，保留八模块、目标/指标/Gap、策略组合、行动及经营复盘的Owner，不被缩为上游UI。
- **PIM**：Problem & Insight Management，组织问题、需求澄清、框架、调查、证据判断和洞察跟进；无需Objective/Gap，可止于有边界的洞察。QEA仅为循证逻辑说明。
- 三模式：假设先行、深度研究、自主探索，共同服务两线。探索输出Candidate，正式判断区分Confirmed、Rejected、Inconclusive。
- 五类Core职责：Semantic Context、Analysis、Decision、Learning、Harness/Execution，映射既有6+1责任层，不是五套服务或全量重构任务。Decision Core组织记录和接续，不接管OSM与资产Owner。
- DAME保留六类版本化Method Asset；A/B Test Analysis只分析既有实验数据，不建设分流SDK/实验平台。
- Domain Pack为**Executable Decision Methodology**，提供语义、问题/假设/IR模板、策略模式、约束和结果评价规则。未安装/已安装/已绑定仍分开；只绑定用户确认的精确版本，不携带客户运行态数据或获得执行权。
- Model Pack继续MLflow-backed、Controller-governed、Builder-packaged、Consumer-verified。ModelEvol组织训练供给，MLflow记证据，Controller独占产品发布，Thin Builder薄封装；Independent Consumer、Desktop实际集成、专项效果、生产准入和Enterprise Serving/parity分开。模型质量与决策效果分别评价。
- 四库是Database、Ontology、Knowledge、Memory四类共享资产；双库是Graph中的假设/策略应用资产集合，保留独立Owner、准入与版本。图谱、Memory、Case或分享不会自动把Candidate变成已验证经验。
- Semantic Context Runtime依据Case/Contract编译最小上下文，通过Context Bundle/Binding约束IR、执行与Evidence。历史重放绑定当时版本；未来Actual不得倒灌旧分析。
- Local-first是信任架构与部署优势，原始数据和主要计算留在本地/受控环境；schema、摘要、日志、错误发送也需权限。云模型与本地分析模型Pack分责。
- Deep Research / External Intelligence提供可核查外部证据，仍保留确定性采集优先、按需LLM抽取、Source Snapshot/候选绑定；外部来源无工具授权。
- Report Studio表达受控Case内容，不为模板补造结论或决定。六级裁判按适用性检查；Commit/Teach按正确Owner形成候选、验证、批准版本与显式采用。

### 最小验证目标

Decision Loop MVP验证五项：真实问题形成Case；IR/执行/验证可靠；Evidence支持可审查Options；选择/预期/适用行动与Future Actual接续；前次结果使后续Case实际改变。可先交付较小可信分析切片，但不把它称作五项完成。

主稿4.5保留六条主线＋两项贯穿能力及38个Demo入口，历史状态注明日期；[v4.0影响表](whitepaper/PROJECT_BINDINGS.md#v40-impact)列本轮研究参考与缺口。本轮不重跑Demo、不提升成熟度、不恢复U01。真实结果回收、跨Case有效学习、多人采用及商业价值仍需各自证据。

## 4. 原文索引

| 工作主题 | 主稿章节 |
|---|---|
| 战略定义、竞争前提、概念层级 | 执行摘要、3–4、28 |
| 六主线＋两贯穿能力与Demo | [4.5](whitepaper/JUANERAI_WHITEPAPER.md#45-六条主线与两项贯穿能力) |
| OSM/PIM、零售目标、接续与Owner | 5–8、14.1–14.2.1；附录A/K |
| 三模式、DAME、A/B分析 | 9–10、14.4；附录G/H |
| Contract/Context/IR与双库 | 11–12；附录B |
| 五类Core与6+1、Graph/语义/执行 | 13–17、30；附录F |
| Domain Pack、Model Pack与双重评价 | 18.1–18.9、18.10–18.23；附录C/I/J |
| 六级裁判、Outcome Learning、Flywheel与责任 | 19–21、31 |
| 用户体验与Report Studio | 22 |
| 场景、Decision Loop MVP、双轴与验证指标 | 23–27 |
| Case / System of Record / Graph / Lineage / Future Actual | 29–31；附录L；术语见附录D |

## 5. 正式开发联动与出版资产

2026-09-26只读核对的正式本地main为`6c4cecb`，Blueprint v1.3已明确绑定v3.3.4。原工作checkout为`c01b68b`，仍保留较早批次输入；不据此推断活动设备已采用main。旧2026-08-27/28待执行Desktop/Model Pack计划已VOID，D1–D5、旧fixture和`DA_REQUIRED_COMPLETE`序列不再当作现行路线。

**v4.0尚未被正式蓝图采用。** 采用按白皮书更新→通知用户→明确蓝图修订/批准→就绪审查与项目规则整合→后续获批Change接续；本轮只改research文档，不写正式仓库、运行分支或任务。9月9日R1包保留历史，不自动恢复其旧集成流程。[开发联动规则](whitepaper/DEVELOPMENT_LINKAGE.md)及[只读核对与差异](whitepaper/DEVELOPMENT_BINDINGS.md)是当前入口。

本版新增总体架构图22；旧资产原样保存，当前引用与缺图数以[v4.0收据](whitepaper/WHITEPAPER_V4_0_RECEIPT.json)实际检查为准。历史缺图没有补造，本轮不交付PDF/DOCX或宣称完整出版资产齐备。
