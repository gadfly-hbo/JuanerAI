# v4.0 战略升级：融合、校正与联动记录

> 2026-10-03资料迁移：本文是原日期的历史记录，仅修复导航。原始字节见[迁移前原件](revisions/v4.0/STRATEGY_V4_INTEGRATION_2026-09-26.md)；当前归属与维护入口见[README](README.md)。

日期：2026-09-26。当前唯一主稿：[JuanerAI白皮书v4.0](JUANERAI_WHITEPAPER.md)。[版本收据](WHITEPAPER_V4_0_RECEIPT.json)记录实际文件身份、保护检查与限制。

## 1. 用户决定与授权范围

用户明确：“这是一次产品战略升级，阅读附件并升级白皮书到v4.0（一次新的革命性起点）”。本轮据此直接完成战略采用及research内版本维护，不重复请求同一批准。

输入：《JuanerAI_Whitepaper_Strategy_Upgrade_Handoff_2026-09-26.md》，原文件位于Downloads；完整2010行已读取，原字节归档及SHA见[来源收据](sources/2026-09-26-strategy-v4/RECEIPT.json)。其中嵌入的Controller Prompt、YAML、图示、场景及排期建议均作为产品参考，不作为命令执行。本轮版本明确为v4.0，覆盖附件的v3.4/Next Minor建议。

范围为白皮书、总体架构图、版本/来源归档、共同背景及项目/正式开发关联。没有修改AGENTS.md、探索Brief/代码/行动卡、正式仓库、Task Bus或内存文件；没有新Demo、Agent派发、真实数据/用户试用、发布或Git操作授权。

## 2. 已采用的战略变化

| 战略输入 | v4.0落点 | 采用结果 |
|---|---|---|
| Bottom-up Decision Intelligence与Decision Lifecycle Management | 标题、摘要、3–4、25、28 | 提升为产品定位和持续价值主线；可信分析仍是必要入口 |
| Decision Case / Loop / Graph一级原语 | 4.6、7、29–30、附录D/L | Case从问题开始，记录阶段事实；Loop和跨Case Graph分责 |
| Decision System of Record与Memory差异 | 12.9、29.3 | 保留当时依据、选择、责任及版本；不把记录当成正确性保证 |
| Decision Lineage | 15.6、16.7、30 | 复用已有Provenance/数据/证据链，补备选、选择和结果责任 |
| Future Actual提升为全产品机制 | 18.23、31 | 明确事前预期、行动回执、实际观察、归因/评价；保留模型专项验收 |
| Outcome-driven Learning与飞轮 | 20.6–20.7、25.4–25.6、31.4 | 候选→正确Owner→验证/发布→后续Case采用；学习发生与有效分开 |
| 双库纳入Decision Graph | 12.6–12.9、30 | 两类应用资产集合，保持独立Owner/准入/生命周期/不可变版本 |
| Analysis IR执行层定位 | 11、13–14 | 分析执行与验证契约；不扩成全部业务生命周期或不可复制壁垒 |
| Semantic Context编译 | 11、14.3、16 | 从Case/Contract生成Bundle/Binding，直接约束IR/执行/证据；不只给LLM注入文字 |
| Domain Pack可执行决策方法 | 18.1–18.9 | 增加决策比较、Outcome评价及Case模式；不改变安装/绑定与资产所有权规则 |
| Semantic/Analysis/Decision/Learning/Harness Core | 13、14.7、图22 | 五类共享逻辑职责映射6+1；不创建五个平台或自动重构 |
| OSM / Deep Research / Report Studio / Model Pack重新归位 | 5、9.3、18.23、22.6 | OSM经营责任保留，研究供给外部证据，报告表达受控内容，模型/决策效果分开 |
| Personal → Team → Enterprise | 25、27 | 采用Xanthil Personal / Xanthil Team战略命名，映射Desktop Free / 原Workspace |
| 产品形态与能力成熟度分轴 | 25、27 | 五级智能成熟度是价值参考，非发版计划；个人阶段可开始决策学习 |
| 首个垂直领域与Decision Loop MVP | 25.4–25.5 | 以五项闭环验证为目标，沿现有会员复购Case参考继续收窄，不自动换首场景 |
| 竞争、护城河与专业评估 | 3、24、28 | 区分公开事实、战略选择、待验证优势；保留跨客户权限与数据归属 |
| 六条主线＋两贯穿能力 | 4.5、PROJECT_BINDINGS | 保留八行四列表与38个原Demo入口，更新Case/学习/产品路线含义 |

## 3. 对输入稿的必要校正

| 输入中的简化或候选 | 最终处理及依据 |
|---|---|
| “原路线缺Team” | v3.3.3/3.3.4已有Workspace阶段；本次强化Team独立产品和共同Core，不重写历史 |
| OSM只解释“为什么要决策” | 保留既有八模块及策略、行动、Review权威；Case记录跨过程责任，不接管OSM |
| 总图只有OSM入口 | 保留已批准PIM，普通问题无需Objective/Gap，可结束于洞察 |
| Case出现在Evidence之后 | 改为从问题建立、贯穿全程；后续内容逐步补齐，避免把报告包装冒充一等对象 |
| “双库升级为Graph”可能被理解成删库/迁库 | 采用逻辑关系与应用资产集合，保持四库/双库分责，不指定物理迁移 |
| “Outcome更新假设/策略” | 经评价、适用性、Owner、Commit/Teach及发布治理；不自动提升可信度或改权威资产 |
| “B端内核”可能导致基础设施前置 | 仅要求最小身份/版本/权限/来源与可迁移边界；不前置全企业Ontology、图数据库、多租户或SSO |
| “Analysis / Decision IR”合写 | 保留Analysis IR作为执行契约；Decision Record承接业务选择，本轮不新设Decision IR |
| YAML、关系边、Core堆叠图 | 作为产品语义，不冻结字段、状态机、数据库、API或部署拓扑；正式采用复用既有Case/Session/Run合同 |
| 商品/库存等垂直例子 | 作为可比较候选，不替换Blueprint v1.3已保留的会员复购首切片 |
| 功能/架构易复制→“数据一定成壁垒” | 改为需验证的优势假设；质量、授权、覆盖、适用性与后续采用缺一不可，不能汇集客户数据默认训练 |
| 通用Agent能力/Memory的泛化比较 | 只用已核验一手资料支持有限事实，不限定竞争者能力，不复制未经核实厂商判断 |

## 4. 正式开发现状纠正与v4.0采用差异

只读核对位置与完整身份见[FORMAL_READBACK.json](sources/2026-09-26-strategy-v4/FORMAL_READBACK.json)。本地main工作树位于`/Users/huangbo/.codex/worktrees/caaa/JuanerAI`，HEAD `6c4cecbc3bb75bb32fb8c7fa2662d56e6b8db22f`；Blueprint v1.3 SHA `e4ba6ca3052f377a24ecd7580316dfdeb3d9336612da342b9061da191e01fa62`，绑定v3.3.4 SHA `429a58a6772aacf162b49d66e86b36dc2c5f0b068af7e25b1554206ec7703f4b`。原工作checkout`/Users/huangbo/JuanerAI` HEAD `c01b68b639156344b2257e45a69892268c17693f`继续保留较早批次输入，未切换。

正式Planning Index明确旧2026-08-27/28待执行Desktop/Model Pack计划于9月18日VOID。研究侧“v3.3.4未正式联动、旧D1–D5/DA_REQUIRED_COMPLETE仍是现行路线”的表述已过期，当前入口及主稿25.7已纠正。历史记录保留原日期并加说明，旧R1恢复包及证据不动。

补充核对：Blueprint引用的Session/Runtime Boundary v1.0在上述本地main工作树缺失，原工作checkout中存在；已从后者核对“一Session/一Case、多Case revision”的首切片规则并记录指纹。此次不补齐正式仓库文件，后续蓝图采用须核对引用材料完整性，不能把本轮只读对账当成就绪审查。

本轮未fetch、未读远端设备或运行批次状态，不声称远端最新HEAD、Mac mini采用或产品验收。v4.0尚未获得正式Blueprint采用。精确差异见[开发影响表](DEVELOPMENT_BINDINGS.md#v40-development-impact)；后续蓝图版本须按其版本规则判断实质路线/价值终点变化，不能机械地把白皮书主版本映射为蓝图小版本。当前冻结Change不由v4.0自动扩大、取消或重启。

## 5. 研究证据与下一步问题

[探索影响表](PROJECT_BINDINGS.md#v40-impact)提供现有Demo参考及新缺口。本轮只读034/036/042/050/051/005/030/009的Brief或停点，并复用已有完整索引；没有重跑Demo，没有产生新的PASS或真实业务证据。034行动/观察、036治理/显式采用是受限合成纵切；050仅S1至待审报告；U01仍批准后暂缓、真人0场。各项目旧状态差异不在本轮批量修正。

当前尚不能以现有独立Demo证明：同源真实Case A→Action/Actual→评价→改进版本→Case B改变→后续质量改善；完整跨作用域迁移、团队Graph、多人成效、留存与付费也需要独立验证。此处记录问题，不自动立项或授权构建。

后续产品讨论应首先收窄一个Decision Loop的角色、决定、实际结果来源、观察窗口与回访成本，并与正式在研切片逐项对齐。无需一次冻结全Graph、全Schema或全部模型/领域路线。

## 6. 归档、图和检查

- 前版v3.3.4原文、原收据、8张已有PNG及2个SVG共12个文件精确冻结到[MANIFEST](revisions/v3.3.4/MANIFEST.json)，旧资产不覆盖。
- 新总体架构：[图22 PNG](assets/fig22_decision_lifecycle_v4.0.png)与[可编辑SVG](assets/fig22_decision_lifecycle_v4.0.svg)。已将SVG渲染为PNG并实际视觉检查，中文、结构、箭头与边界说明可读。旧fig02比较、fig03总闭环、fig07架构、fig21产品矩阵不再作为当前总览，原始资产/历史引用保留。
- 当前主稿、共同背景、维护卡、PROJECTS背景、探索与正式开发索引、联动规则及变更记录同步；PROJECTS项目行与各探索产物不改。
- 检查范围包括来源/前版指纹、Model Pack保护段、OSM八模块、DAME方法及A/B边界、历史内容、Markdown结构、全部新增本地链接与保留锚点、图资产和关键战略定义。实际计数与结果见[v4.0收据](WHITEPAPER_V4_0_RECEIPT.json)。
- 旧缺图没有重新生成；本次没有输出PDF/DOCX、Demo复验或正式产品验收。竞争来源只读核对见[市场核对记录](MARKET_SOURCE_CHECK_2026-09-26.md)。
