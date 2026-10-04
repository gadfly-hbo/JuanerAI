# JuanerAI 白皮书维护恢复卡

- 当前版本：**v4.0（2026-09-26）**，产品战略与文档主版本同时升级。[主稿](JUANERAI_WHITEPAPER.md)、[当前指纹](WHITEPAPER_V4_0_RECEIPT.json)、[融合记录](STRATEGY_V4_INTEGRATION_2026-09-26.md)。
- 授权与范围：用户明确要求阅读战略附件并升级v4.0；本轮已完成research内正文、图、来源归档、前版冻结、背景与关联维护，不需要重复批准该升级。
- 已完成：Bottom-up DI / Decision Lifecycle定位，Case / Loop / Graph与System of Record，Decision / Learning Core分责，全产品Future Actual、Lineage、Outcome Learning、双库和Domain Pack升级、Personal/Team/Enterprise双轴、Decision Loop MVP、竞争事实核对、正式采用差异。
- 当前状态：白皮书文档交付；不代表新产品能力实现或Demo验收。验证明细见本版收据，原始缺图仍有保留，本轮未导出PDF/DOCX。
- 历史：v3.3.4原文/已有配图/原收据已精确冻结到[revisions/v3.3.4](revisions/v3.3.4/MANIFEST.json)。旧来源、旧图、旧收据和探索元数据保留。
- 正式联动：本地main `6c4cecb`当前Blueprint v1.3已采用v3.3.4；原工作checkout `c01b68b`有其较早冻结输入，活动设备采用不推断。旧待执行Desktop/Model Pack计划已VOID。v4.0尚待明确蓝图采用，本轮未写正式仓库、提交、推送、发消息或操作远端。
- 等待方：`user_input`（白皮书维护的下一项产品输入，不是探索生命周期变更）。
- 唯一下一步：若用户决定进入正式开发规划，则以本次[开发差异表](DEVELOPMENT_BINDINGS.md#v40-development-impact)准备版本化Blueprint采用；未有此新指令时保留当前白皮书交付，不启动实施。
- 停止线：不新增/重开Demo，不恢复U01，不启动Builder或其他Agent，不修改冻结Brief/Task Bus/在研Change，不恢复旧R1包集成或旧计划。

## 2026-09-26 · v4.0 战略升级

本轮战略方向已采用，实施细节继续由后续获批纵切收敛：首个Decision Loop范围和观察成本、Case/Record与既有身份的映射、Graph最小查询、Future Actual评价设计、Learning采用证据、产品命名落地、团队迁移与价值指标。它们不阻塞本次白皮书升级，也不因出现在附件而成为已冻结Schema或任务。

下列2026-09-19及更早条目保持历史原文；其中“当前版本/待集成/旧开发顺序”仅代表当时记录，现状以上述v4.0恢复卡及正式只读回执为准。

## 2026-09-19 · v3.3.4 OSM / PIM 与六条主线

- 用户已明确要求将双主线定位与命名材料融入主稿，升级至 v3.3.4，并纳入六条主线与两项贯穿能力完整四列表及 Demo 链接；该融合已获授权，无需重复请求批准。恢复先读 [本轮融合记录](OSM_PIM_MAINLINES_INTEGRATION_2026-09-19.md)、[来源指纹](sources/2026-09-19-osm-pim/RECEIPT.json)和[前版快照](revisions/v3.3.3/MANIFEST.json)。
- PIM 正式采用 Problem & Insight Management，OSM 保留 Objective & Strategy Management System；QEA 仅作循证方法解释，不新增产品、引擎或业务主线。双线共享三模式、方法、语义、执行和证据，问题可独立开展，不强制绑定 Objective。
- 主稿新增 4.5 主线表、7.3.1–7.3.4 双主线定位与接续、14.2.1 统一工作台职责及附录 D 的 PIM / QEA 术语。Demo 仅提供对应范围的证据入口，不能把离线、受限 PASS 或返修等同于正式实现；各探索行、阶段、冻结版本和历史结论保持。
- “6+1”、OSM 八模块、Model Pack 两期、先 C 后 B 与正式门禁不变。本次不写正式仓库或 Task Bus，不启动 Demo、正式开发或暂缓中的 U01；2026-09-09 正式联动待集成决定继续有效，后续实施仍按具体计划、冻结合同和独立验收推进。

## 2026-09-17 · v3.3.3 产品矩阵与先 C 后 B

- 用户已明确要求融合产品矩阵并影响后续开发顺序；已按免费本地 Desktop 真实个人价值 → JuanerAI Workspace 团队协作 → 单场景企业试点 → Enterprise → 有条件有限域自动化写入当前产品定义。先 C 后 B 已获批准，不再次请求方向确认。[本轮融合记录](PRODUCT_MATRIX_INTEGRATION_2026-09-17.md)、[来源指纹](sources/2026-09-17-product-matrix-v1.0/RECEIPT.json)是恢复依据。
- 本轮替代旧白皮书 CLI 先行及 OSM 早于团队的阶段顺序。CLI 保持伴随入口定位，Packs 横向扩展；共享 Contract / Context / IR、Decision Case 等语义不构成并行开工或新技术合同。个人即需最低语义、方法可信性和数据保护，团队迁移须显式授权。
- 后续正式计划按25.7映射新增与既有范围，继续遵守独立就绪审查；现有 D1–D5 与 D05 七段依赖、`DA_REQUIRED_COMPLETE`、公开发布 Gate 和 Model Pack 两期不由本次文档自动改写，个人留存不成为新增 Model Pack 硬前置。
- 仍需具体化 Decision Case、迁移与脱敏、版本兼容、首期新增能力、免费/模型费用边界、WVAT与遥测口径及团队试点进入条件。本轮不写正式仓库或 Task Bus，不启动 Demo，不恢复暂缓中的 U01；现有项目等待方和2026-09-09正式联动待集成决定保持。

## 2026-09-16 · 用户指定版本升级为 v3.3.2

- 用户明确“融合后，要将版本升级到v3.3.2了”，已完成主稿、当前入口、关联索引与版本记录同步；当前版本以v3.3.2为准，R3仅保留来源与历史。
- 本轮只做版本标识与追溯同步，不增加产品范围、Demo授权或正式开发动作；既有R1联动包仍待合适检查点。后续恢复仍以[融合记录](OSM_RETAIL_INTEGRATION_CHANGE_2026-09-16.md)中的未决实施问题为准。

## 2026-09-16 · R3 OSM 零售目标管理融合

- 用户已明确“批准融合”，本轮已将目标候选形成、多维计划一致性、策略贡献与三类指标职责融入产品定义；无需重复请求本次融合批准。恢复先读 [R3 变更记录](OSM_RETAIL_INTEGRATION_CHANGE_2026-09-16.md) 与[来源归档指纹](sources/2026-09-16-osm-retail-v1.0/RECEIPT.json)。
- OSM 正式名称、八模块、Core / Domain Pack / DAME / Semantic Context Runtime 的职责及 Xanthil Desktop 统一工作台保持。目标候选、预测、批准目标，以及策略预期贡献、实际结果、因果增量分别表达。
- 后续算法口径（含权重、边界、缺数和重叠处理）、Retail OSM Pack 独立或子能力、正式首发场景与新增 Demo，仍待进一步具体输入后收敛；本轮未冻结这些实施选择，未创建或启动 Demo。
- Model Pack 两期、正式开发先后、既有探索的冻结范围与状态不变。正式侧 14 文件 R1 恢复包继续待合适检查点集成，本轮不向正式仓库写入，也不声明 R3 已在正式开发生效。

## 2026-09-11 验证队列恢复点

- 用户希望尽可能在对应正式开发前完成可做的 Demo 验证。已按现存范围/评审、关键源码与白皮书整理 12 项优先单元、8 项条件专项和真人验证，详情读上述盘点。
- 当前 A03 session：[PX-2026-041](../../../explorations/PX-2026-041-local-file-quality-snapshot/NEXT_ACTION.md) 的受限 Demo 结论已于 2026-09-13 获用户明确接受并收口；保持 `Demo已评估 + user_input`，等待新的明确产品输入。Controller 不自动进入 Handoff、正式开发或下一队列项，其余项目状态不自动改变。
- 白皮书影响：无正文修改；Repair Round 1 为 12.1、16.4、16.10 既有的可复算事实、含时间范围 Binding 和本地计算要求增加受限支持证据，没有新增产品定义或生产成熟度。既有联动变更继续待合适检查点集成。

- 2026-09-11 交付补充：按用户“每一项都写一个 prompt”生成 A01–A12、B01–B08、U01 共 21 份独立文件和可复制合集。Prompt 交付不等于新探索立项、Demo 批准或正式开发授权。
- 2026-09-13 A01 / [PX-2026-038](../../../explorations/PX-2026-038-dame-method-asset-execution/PRODUCT_BRIEF.md)：用户已接受 [Demo Brief v1.0 第四轮最终独立复审](../../../explorations/PX-2026-038-dame-method-asset-execution/DEMO_BRIEF.md) 的 synthetic/fixed/local `PASS`，项目在 `Demo已评估 + user_input（已验收收口）` 停止。冻结 Brief 使用 R1；当前 R2 只涉及 PX-2026-044 外部证据采集，对 A01 无实质差异。白皮书正文无影响：这是既有 Method Asset/immutable IR/执行身份定义的受限支持证据，不等于完整六类 DAME、生产成熟度、Handoff 或正式开发授权。
- 2026-09-11 A02 [PX-2026-039](../../../explorations/PX-2026-039-ab-test-analysis/PRODUCT_BRIEF.md) Repair Round 1 最终独立复审为 synthetic/fixed/local `PASS（受限）`：37/37、逐用户 outcome 门禁、非空 store 后置拒绝原子性、fresh-process 与真实 Chromium 均成立；首轮 `NEEDS_FIX` 仍是有效历史。白皮书正文无影响：这是对 10.4–10.5、附录 H 既有定义的受限支持证据，不证明真实业务效果或生产成熟；正式联动继续待集成。
- 2026-09-11 A03 已登记为 [PX-2026-041](../../../explorations/PX-2026-041-local-file-quality-snapshot/PRODUCT_BRIEF.md)：PX-009 `14/14 + 19/19`、PX-032 `53/53` 只作有完整指纹的适配依据。首轮 `NEEDS_FIX` 历史保留；Repair Round 1 经 `31/31`、独立窗口与首次 claimed-ID 原子性攻击、真实 Chromium v1→v2→v1 最终复审为 synthetic/fixed/local `PASS（受限）`，用户于 2026-09-13 明确接受并收口。白皮书正文无影响，正式联动继续待集成。

## 2026-09-13 B08 研究准备增量

[PX-2026-059 行动卡](../../../explorations/PX-2026-059-action-task-adapter/NEXT_ACTION.md)：2026-09-14第四轮独立复评，66/66与必要浏览器主链成立；服务启动时实际取得PX-034来源锚点，完整自洽四对象伪造链在任何写入前被拒绝，合法换请求ID重试仍回到原任务。用户已接受冻结 synthetic/fixed/local 范围的受限PASS，Demo已评估/user_input停留本项；白皮书正文无影响、正式联动待集成。

## 2026-09-13 · U01 代表用户试用准备

恢复 [PX-009](../../../explorations/PX-2026-009-autonomous-exploration/NEXT_ACTION.md) 既有研究并交付 [U01 研究包](../../../explorations/PX-2026-009-autonomous-exploration/user-research-u01/RESEARCH_PACK.md)，复用030/021/037三类独立场景，不新立项或重造Demo。当前 `讨论中 + user_gate`，只获准备授权，真人场次0，等待用户批准有限人工试用；没有联系/招募/录制或Builder授权。原批准与PASS历史保持。

核对v3.3.1 / MP-ALIGN-01-R2第21、22章及路线图来源断点；R1→R2的9.3外部采证修订不扩大本项。正文影响：无，材料准备不提升用户理解或生产成熟度；正式联动继续待集成。不同Demo不冒充同一运行链，037重置依当前服务端内存实现而非旧README末尾描述。

## 2026-09-13 · U01 批准与暂缓执行

用户：“批准，但暂缓执行后续”。[PX-009行动卡](../../../explorations/PX-2026-009-autonomous-exploration/NEXT_ACTION.md)同步为`讨论中 + user_input`；U01研究包已批准，等待用户明确恢复，当前不执行后续。真人场次0，主持人/参与者/同意未齐备；不自动招募、联系、录制、试用或启动Builder。原准备与批准历史保留，不重复请求同一Gate。白皮书正文无影响，正式联动继续待集成。
