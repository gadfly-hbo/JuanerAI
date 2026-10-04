# 白皮书 → 正式开发关联索引

当前研究产品战略/白皮书为 **v4.0**。用户已批准本次战略升级；正式开发仍以已采用的版本化Blueprint及活动执行包为准。[v4.0指纹](WHITEPAPER_V4_0_RECEIPT.json)、[融合记录](STRATEGY_V4_INTEGRATION_2026-09-26.md)、[正式只读回执](sources/2026-09-26-strategy-v4/FORMAL_READBACK.json)。

## 2026-09-26 正式输入核对

| 本地位置 | 只读事实 | 解释边界 |
|---|---|---|
| `/Users/huangbo/.codex/worktrees/caaa/JuanerAI`，main `6c4cecbc3bb75bb32fb8c7fa2662d56e6b8db22f` | `docs/planning/README.md`以Blueprint v1.3为当前最高开发指引；v1.3 SHA `e4ba6ca3052f377a24ecd7580316dfdeb3d9336612da342b9061da191e01fa62`，明确绑定v3.3.4 SHA `429a58a6772aacf162b49d66e86b36dc2c5f0b068af7e25b1554206ec7703f4b` | 本地main/缓存ref观察，无fetch；不推断远端最新或Mac mini采用 |
| `/Users/huangbo/JuanerAI`，`work/macbook/wip-preflight-exception-disposition`，`c01b68b639156344b2257e45a69892268c17693f` | 保留较早Blueprint v1.1和该批次执行材料 | 不是用旧checkout否定main v1.3；活动批次仍按自身冻结输入和实际接收回执 |
| 正式Planning Index的历史撤回段 | 2026-08-27/28尚未执行Desktop/Model Pack计划于2026-09-18已VOID | 不恢复D1–D5、member-orders-v2或DA_REQUIRED_COMPLETE旧路线；已存在代码、永久规范及证据仍可复用 |

只读核对纠正研究侧截至9月19日“v3.3.4从未联动”的过期陈述，不对真实开发进展作验收。旧R1恢复包原样保留，本轮不恢复其集成、不写正式仓库。

<a id="v40-development-impact"></a>

## v4.0 待蓝图采用的实质差异

| 白皮书落点 | 已采用的产品方向 | 正式Blueprint采用时的具体工作 |
|---|---|---|
| 3–4、28 | Bottom-up DI / Decision Lifecycle；竞争与长期优势均需证据 | 更新价值主线及竞争评价，区分已确认方向和待验证商业假设 |
| 25、27 | Personal/Team/Enterprise；产品形态与能力成熟度分轴 | 对齐既有Desktop/Workspace命名，决定UI/包名是否及何时调整；不自动重命名 |
| 25.4–25.6 | Decision Loop MVP五项，增加结果回访与后续采用 | 从原会员复购Case切片向后映射增量，明确哪些另起纵切；不扩大当前Change |
| 29、附录L | Case一等对象、Decision Record / System of Record | 复用既有Case revision、Session/Run及不可变证据；明确最小业务对象，不直接移植附件YAML |
| 13–14 | 五类Core逻辑职责 | 映射现有前端/业务/执行模块；禁止从五个名称推成五个新服务 |
| 12、15.6、30 | 双库纳入Graph，补Decision Lineage | 保留各Owner/生命周期与底层权威；先选择最小跨Case查询，不默认引入图数据库或迁库 |
| 20.6–20.7、31 | Future Actual全产品化、Learning候选与显式采用 | 冻结场景预期/窗口/实际来源及评价设计，验证回收成本、偏差与学习有效性 |
| 11、16 | Case驱动Context编译、IR与执行/证据约束 | 精确绑定版本和时点，拒绝未来信息泄漏；不新建Decision IR |
| 18.1–18.9、18.23 | 可执行领域决策方法；模型/决策效果分开 | 复用DAME、Pack合同及发布Owner；Model Pack两期是产品定义，旧执行顺序不恢复 |
| 7、19、22.6 | 保留PIM无目标入口、OSM经营责任；报告表达受控Case | 对齐UI/AC、G0适用性、决定与行动权限；无结果时不能报闭环 |

采用链：明确通知/采用输入 → 冻结v4.0版本及SHA → 对照当前Blueprint逐项采用/延期/不适用 → 用户批准版本化蓝图修订 → 新鲜就绪审查 → 项目规则整合 → 后续获批Change。当前批次不被白皮书静默改写；本轮没有新Requirement/AC、实现、发布或设备接收记录。

**下面保留2026-09-09至19的历史定位和差异表。其中旧计划、旧待集成说法不再作为当前规划权威；真实采用以上方9月26日核对为准。**

## 已定位的入口

| 白皮书主题 | Research 决策/证据入口 | 正式仓库入口（相对 `/Users/huangbo/JuanerAI`） | 当前联动判断 |
| --- | --- | --- | --- |
| 18.10–18.22，Model Pack 两期路线 | PX-005/007/008，见探索索引 | `docs/planning/2026-08-27/model-pack-two-phase-product-plan.md`；`attachments/model-pack-desktop-consumer-delta.md` 位于同日计划目录 | 文档方向已对照；正式计划采用范围/修订仍由正式 Controller 明确 |
| 18.14、18.16–18.18，包合同与 AnalyticalModelRuntime | PX-005 首发场景、008 接缝 | `docs/contracts/model-pack.md`；`openspec/specs/model-pack-contract-enabler/spec.md`；`openspec/changes/archive/2026-08-24-model-pack-contract-enabler/` | 现有规范只覆盖 MP-C01–MP-C05 与受限 Port；不能因白皮书薄封装就改其冻结合同或声称完整 Consumer 集成 |
| 22 章，Desktop 统一工作台 | PX-004/006/021 | `docs/planning/2026-08-27/xanthil-desktop-phase-one-product-plan.md`；`docs/planning/2026-08-27/attachments/xanthil-desktop-required-capabilities.md` | 保留 Desktop-first，继续 CLI 开发在正式仓库仍暂停；白皮书的伴随入口不自动重启 CLI 路线 |
| 9–11 章，分析方法与任务执行 | PX-009/010/012/013/014/030 | `openspec/specs/local-analysis/spec.md`；`docs/planning/2026-08-27/attachments/pi-xanthil-business-function-transfer-matrix.md` | 已找到相关既有规范；不将其认定为 DAME 六类、完整 IR 或 A/B Test Analysis 已实现 |
| 四库/双库、资产与能力边界 | PX-001/002/003/015–028/035 | `CONTEXT.md`；`docs/architecture/asset-and-model-capability-architecture.md`；`docs/planning/2026-08-27/attachments/asset-promotion-and-writeback-gates.md` | 需按资产类型核对 Owner、准入与回流；不能自动改正式术语或升级历史 Demo 结论 |
| OSM、Semantic Context Runtime、Bundle/Binding 与物化 | PX-029–035 | 后续产品计划/proposal 中显式定位，不由本轮补造 Change/Requirement ID | 当前仅挂研究与白皮书入口；尚未登记针对本修订的正式采用记录 |

表中的项目详情链接见 [PROJECT_BINDINGS.md](PROJECT_BINDINGS.md)。正式侧文件已在上述 commit 中检查存在；实现入口如 `packages/contracts/model-pack.ts`、`packages/ports/analytical-model-runtime.ts` 仅说明代码位置，完成状态必须另查精确版本证据。

## 2026-09-19 · v3.3.4 双主线与主线总览待正式采用的差异

PIM（Problem & Insight Management，问题与洞察管理）已成为与 OSM 对应的正式业务能力名称。它为现有问题驱动流程补充统一定位，复用 Xanthil、Analysis Core、Contract / Context / IR、本地计算、证据及治理，不新增一套分析内核。QEA 仅解释问题—证据—判断的方法逻辑。主稿 [4.5 四列表](JUANERAI_WHITEPAPER.md#45-六条主线与两项贯穿能力)提供六条主线、两项贯穿能力与已有 Demo 的对应关系；关联不表示完整模块已实现，也不是开发任务的并行清单。

| v3.3.4 章节 | 已采用的定义 / 研究参考 | 正式采用时需对账的差异 |
| --- | --- | --- |
| [7.3.1–7.3.2 双主线与 PIM](JUANERAI_WHITEPAPER.md#731-osm-与-pim-的正式定位)、附录 D | OSM 管目标达成，PIM 管问题调查和洞察跟进；PX030 / PX042 提供需求到报告的部分受限证据 | 对照现有 Desktop / local-analysis 计划、Requirement/AC 和用户入口，显式映射问题、框架、证据、结论及跟进职责；不因命名而补造 PIM Core、独立 IR、新权限或持久化合同 |
| [7.3.3 三种接续](JUANERAI_WHITEPAPER.md#733-双主线的三种接续) | 目标触发分析、分析返回经营、经验证机会形成新目标；参考 PX029 / PX033 / PX034 / PX048 / PX050 / PX059，各自冻结范围保留 | 核对来源、目标/问题关联、人工确认、行动授权、独立观察和版本历史；PX050 仅 S1，不能填为完整 OSM / PIM 端到端验收。普通问题不应被新增 Objective / Gap 前置门槛 |
| [14.2.1 工作台分责](JUANERAI_WHITEPAPER.md#1421-双主线与统一工作台的职责)、[7.3.4 命名与实施顺序](JUANERAI_WHITEPAPER.md#734-命名与实施顺序) | Xanthil 统一呈现两类任务；OSM 保留经营对象权威，三种分析方式同时服务两线；参考 PX004 / PX006 / PX014 / PX031 / PX032 | 将用户可见入口与现有 Core / Application / Port / Adapter 分工对应，不复制方法、语义或执行设施。先 C 后 B、Desktop-first、既有 D1–D5 / 七段依赖及当前 CLI 暂停状态保持 |
| [4.5 六条主线＋两项贯穿能力](JUANERAI_WHITEPAPER.md#45-六条主线与两项贯穿能力) | 汇总业务入口、分析方式、产品矩阵、方法与扩展、价值验证、资产进化，以及数据/语义/执行和可信治理 | 将表作为产品覆盖与参考导航，不用八行代替具体 Requirement/AC、实现计划或验收证据；最低语义、可信性和数据保护从个人阶段具备。Model Pack 两期、`DA_REQUIRED_COMPLETE`、独立启动与公开发布 Gate 不因新分类变更 |

上述差异已在研究主稿生效，正式侧仍按其实际采用的冻结输入执行。到合适检查点再记录精确 v3.3.4 快照/SHA、采用章节、已批准 Requirement/AC、调整或延期项及验证证据；历史采用版本与 R1 联动恢复包不原位更新。此次只补充文档关联，未写入正式仓库、重排任务、改动代码、授权新 Demo、真实数据或 Handoff。来源与具体证据边界见 [探索关联索引](PROJECT_BINDINGS.md#2026-09-19--v334-双主线与主线总览采用)及[本轮融合记录](OSM_PIM_MAINLINES_INTEGRATION_2026-09-19.md)。

## 2026-09-17 · v3.3.3 产品矩阵待正式采用的差异

已批准的产品进入市场顺序为 **Desktop Free → Workspace → 企业场景试点 → Enterprise**，CLI / Packs 提供并行支撑；旧白皮书的 CLI 先行、OSM 先于团队工作区路线不再是当前战略。主稿[第25章](JUANERAI_WHITEPAPER.md#第二十五章-产品形态与发展路线)是产品方向，既有正式 D1–D5／七段依赖及 Model Pack 两期是冻结实施依据，本轮不直接改写后者，也不重排在研任务或提前授予 CLI、模型训练、Serving、企业实施与公开发布权限。

| v3.3.3 章节 | 已生效的研究定义 / 参考证据 | 正式采用时需对账的差异 |
| --- | --- | --- |
| 25.1 产品矩阵 | Desktop Free 为个人入口，Workspace 为团队桥梁，Enterprise 为企业闭环；CLI / Packs 支撑。PX004 / PX006 仅支持各自 UI/Handoff 范围 | 与 `xanthil-desktop-phase-one-product-plan.md` 及现有产品边界映射；不因品牌矩阵新建第二套 Core 或新增产品 Change |
| 25.2 共享对象、Decision Case 与迁移 | PX014 / PX021 / PX051 可参考个人版本与复算，PX035 / PX036 / PX054 可参考受控回流与采用 | 统一对象语义并另行冻结必要合同；保存、导出不等于已完成跨 Workspace 授权迁移，不能迁移即晋升权威或混入公共资产 |
| 25.3 免费 / 付费边界 | 免费个人层应提供完整个人工作价值，团队/企业付费对应协作、治理及连接执行；PX016 / PX028 / PX046 / PX058 提供受限能力参考 | 许可、模型费用、服务责任、计费及付费功能范围需进入获批产品计划；不将方法可信性、语义或最低保护移到收费后才具备 |
| 25.4 个人首期闭环 | PX041 / PX042 / PX045 / PX047 支持部分输入、计算、来源、恢复及最小上下文边界 | 逐条映射已批准 Requirement/AC 和平台验收；附件新增格式、Decision Case、迁移等要求不自动扩大当前 Change，合成 fixture 不冒充真实用户业务数据 |
| 25.5 阶段顺序 | 先验证个人真实使用与复用，再团队，继而企业单场景试点；PX034 / PX050 / PX059 仅参考将来的经营接缝 | 战略已获批准，不再回到 CLI 先行或绕过 Workspace；现有 Desktop 七段不重排，CLI 支撑定位不自动恢复开发，Model Pack 两期及 `DA_REQUIRED_COMPLETE` / 独立启动 Gate 保持 |
| 25.6 阶段指标 | U01 仍暂缓、真人0场；PX052尚未 live。当前未找到 WVAT、留存、团队付费或真实 ROI 的研究证据 | 明确真实任务分母、用户确认、周期、复用/留存及试点价值口径；遥测与真实数据采集另按权限，合成 PASS 不能作为商业指标 |
| 25.7 对正式计划的影响 | 研究侧已采用 v3.3.3；本节及[探索影响索引](PROJECT_BINDINGS.md)提供差异入口 | R1恢复包继续待集成；到合适检查点再登记精确版本/SHA、章节、采用/调整/延期项及 Requirement/AC，不补造接收、实现或验收记录 |

本轮未向正式仓库写入，未新立项、发任务或启动执行；不是正式仓库已经接收 v3.3.3。旧 Demo 的精确批准和冻结版本继续作为原范围证据，真实个人使用、完整 Decision Case、多人协作、跨域迁移、团队付费与经营 ROI 仍需各自验证。

## 2026-09-16 · R3 待正式采用的差异

以下R3融合内容已按用户指定升级为当时白皮书v3.3.2，当前v3.3.4继续承接；本节记录“研究定义已生效、正式采用待检查点”的差异，不补造正式 Change、Requirement 或 AC，不将研究证据升级为实现验收。各项来源及受限证据见 [探索采用/影响矩阵](PROJECT_BINDINGS.md#2026-09-16--r3-osm-零售融合采用与影响)；改稿前评估保留在 [OSM_RETAIL_INTEGRATION_REVIEW_2026-09-16.md](OSM_RETAIL_INTEGRATION_REVIEW_2026-09-16.md)。

| R3 章节 | 待采用的定义差异 | 研究参考与正式采用边界 |
| --- | --- | --- |
| 6.1 | 带来源、规则版本、约束及人工修正的目标候选；候选与预测分开 | PX033 / PX044 可参考有效性及来源链；三情目标形成专项未登记/授权，正式规则与验收范围待明确 |
| 6.2 | 同一目标计划的多维投影、切片聚合、冲突与版本历史 | PX048 仅验证受限金额树，不证明多维交叉咬合；不由本轮冻结 Cube Schema、求解器或存储方案 |
| 6.3 | 结果/驱动/护栏指标角色，以及语义权威、物理 Binding、目标实例参数分责 | PX033 / PX048 / PX034 可参考；不新增第二套指标真源，不把 Outcome Metric 与 Outcome 对象合并 |
| 6.6 | 带基准和重叠规则的预期策略贡献、剩余差额及证据分层 | PX029 / PX049 可参考候选与有限组合；合成贡献不是实测增量，不提前赋予行动执行或模型调用授权 |
| 6.8 | 执行/回执/观察/护栏/效果分别判断，三类差距分开，保留尚不能判断 | PX034 / PX059 / PX050 / PX051 可参考各自接缝；050 仅 S1，不能拼接成完整零售闭环验收 |
| 18.9 | 零售目标规划领域能力参考，复用 Pack 版本与消费规则 | PX016 / PX028 可参考；独立 Pack 或子能力尚未冻结，会员增长参考 Pack 和正式首发场景不因此替换 |
| 19 / 20 | 目标规则与分配的适用验证 Gate；经验/校准经 Owner、Commit/Teach、批准和新版本采用 | PX033 / PX035 / PX036 可参考；不自动晋升长期资产、修改旧目标或扩张发布权限 |
| 附录 K | 零售目标形成、多维计划与贡献的合成说明案例 | 来源见归档收据；算术示例不是运行证据、真实预测或经营效果验收 |

目标候选形成、多维计划一致性、策略承接与指标角色证据分层这三项专项验证问题，均尚未登记、冻结或授权执行。R3 正文采用不使它们变成已完成 Demo，也不重排已有探索或开发任务。

正式侧仍使用其实际已采用的冻结输入；R1 恢复包与 R3 研究主稿的版本差异在合适检查点对账，采用时另行登记精确快照/SHA、章节、获批 Requirement/AC 及证据。**本轮不改变 Model Pack 两期路线及各期 Gate，不改变 Desktop-first，不扩大现有 Requirement/AC，也不影响当前开发分支。** 联动待集成状态保持，不能将本索引更新解释为正式仓库已接收 R3。

## 后续每个开发切片登记什么

在正式项目既有计划/proposal/traceability 中维护详细表，本索引只链接结果，避免两份动态状态互相漂移：

| 白皮书版本 / SHA / 章节与主张标识 | 研究决策与证据附件 | 正式计划 / Change | Requirement / AC | 采用方式与差异 | 实现证据 / 精确 head / 验收状态 | 回流记录 |
| --- | --- | --- | --- | --- | --- | --- |
| 每次采用时填写明确引用 | 精确版本，不只填 PX 名称 | 现存或获批后建立的标识 | 未批准时留待定，不虚构 | 采用/调整/延期/不适用及原因 | 测试不等于验收，验收不等于发布 | 链接主稿修订或无影响原因 |

当前没有新开发切片通过本轮接收自动获批；本表不提前填入虚构的 Requirement、AC、验收或发布记录。联动运行按 [DEVELOPMENT_LINKAGE.md](DEVELOPMENT_LINKAGE.md)。
