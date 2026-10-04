# 白皮书与 JuanerAI 正式开发的强联动

用户于 2026-09-09 明确要求：白皮书指导 `/Users/huangbo/JuanerAI` 开发，必须建立强联动。研究仓库维护产品方向与证据，正式仓库通过已批准的范围和 OpenSpec 将其转成实现；两边建立明确版本与可追溯反馈，用户无需重复搬运说明。

## 当前联动状态与采用链（2026-09-26）

research当前白皮书 **v4.0**；正式本地main已由Blueprint v1.3采用v3.3.4，精确身份见[开发索引](DEVELOPMENT_BINDINGS.md)与[只读回执](sources/2026-09-26-strategy-v4/FORMAL_READBACK.json)。v4.0尚未在正式蓝图生效。本轮未fetch、未向正式仓库写入或操作活动设备，不推断设备已采用main。

白皮书是产品/商业参考；版本化Blueprint是正式开发最高执行指引。新白皮书经通知、逐项采用/延期/不适用、用户批准蓝图修订、新鲜就绪审查和项目规则整合后，由后续获批Change采用。文档更新、Git存在、main合并或发出消息均不等于活动任务接收或实施通过。

旧待执行Desktop/Model Pack计划已于2026-09-18 VOID。Model Pack两期产品能力定义仍可继续维护，但旧启动顺序、任务和权限不恢复。下方9月9日至19日内容保留其历史身份，“待集成”不是当前恢复旧包的命令；旧R1文件与恢复包不覆盖、不自动重建或合并。

## 两个仓库各自负责什么

| 位置 | 唯一职责 |
| --- | --- |
| research 的 [白皮书主稿](JUANERAI_WHITEPAPER.md) | 产品定义、推荐架构、路线与成熟度；唯一可编辑全文 |
| research 的 [探索索引](PROJECT_BINDINGS.md) | 白皮书章节 ↔ Demo 决策/冻结 Brief/验证证据 |
| research 的 [开发关联索引](DEVELOPMENT_BINDINGS.md) | 白皮书章节 ↔ 正式产品计划/OpenSpec/Requirement/AC/实现证据 |
| JuanerAI `docs/product/whitepaper/` | 可随 Git 同步的冻结参考快照、完整指纹和接收说明；不是第二份编辑主稿 |
| JuanerAI `docs/planning/README.md` / 当前Blueprint / 获批OpenSpec | 版本化开发权威、批准范围和验收合同；白皮书不直接覆盖它们 |
| JuanerAI 实现、验证与接收记录 | 正式实现事实；反馈 research 后才能据此提升白皮书成熟度 |

主链为：**白皮书版本/指纹/章节 → 采用决定及研究证据 → 正式计划 → Requirement/AC → 实现与精确版本验证 → Controller 验收 → 白皮书反馈**。方向、冻结范围和完成事实分别有权威。

## 必须执行的联动检查

1. **开发前**：正式侧按当前Blueprint及任务包读取精确白皮书输入，核对SHA与实际接收身份；在既有产品计划/proposal 中登记章节、采用/调整/延期/不适用、原因、研究附件及 Requirement/AC。没有明确采用的白皮书远期能力不成为当前隐含范围。
2. **规范冻结前**：核对 CONTEXT、已批准产品计划和 OpenSpec 的差异；影响本轮任务的冲突按原有批准/Contract Change Request 流程解决。新或实质修订的产品计划仍需独立 development-readiness review。
3. **开发中**：Worker 使用冻结输入，不追随主稿的 latest。白皮书升级由 Controller 判断影响，保留运行中任务的旧绑定；需要变更才走既有范围修订。不得为追平白皮书直接改旧测试、枚举或项目状态。
4. **交付时**：在现有 traceability / handoff-back 中登记“章节 → Requirement/AC → 代码路径 → 测试/证据 → 完整 commit → 验收/发布状态”。运行成功、独立验证、用户验收和真实发布分别记录。
5. **反馈时**：research Codex 直接读取正式仓库的确定版本和已验收证据，更新主稿、开发索引与变更记录；没有影响也记录原因。不得以 Demo PASS、旧 head 或计划文件存在冒充实现完成。

正式侧已准备 `AGENTS.md` 入口、术语入口、治理文档、输入/交付模板字段及本地文档快照。机制是会话内 Controller 检查与普通 Git 同步，不是后台监控、自动 CI 强制检查或自动切换 Agent。

## 版本和跨设备

- 在同一机器，可直接只读访问两个仓库；正式 Worker、另一台机器和独立 Reviewer 只依赖正式仓库冻结快照及明确随附材料，不依赖 MacBook 的 research 绝对路径。
- 新版本接收后记录来源、修订、SHA、相关章节、资产缺口和采用范围；旧 Change 不自动切换。只保留一份编辑主稿，正式快照按版本目录保存。
- 新增正文修改或证据更新，由本轮 Codex 主动完成无需重新请求“转交”；跨仓库写入遵循目标仓库分支/路径规则，提交、推送与合并仍按用户授权。
- 原六项 Model Pack 差异的文档修订不直接迁移正式 `MP-C01–MP-C05`、SDK、Runtime 或 Profile。正式合同已有的固定场景约束继续有效。

## 联动机制初次准备状态（2026-09-09历史快照）

- research 侧规则、入口和开发关联索引已落盘。
- 正式仓库已有未提交的 Coordinator 工作；保留原 checkout 和修改。独立工作树为 `/private/tmp/JuanerAI-whitepaper-development-linkage`，分支 `codex/whitepaper-development-linkage`。
- 基于本轮读取的本地 main / 缓存 origin/main `1fe517a1b820ae4bae1e5dede6a8f69a6bffabbd`，未联网获取远端最新状态。
- 正式侧 14 个文档/快照文件已准备；[精确文件与 SHA 清单](development-linkage/PREPARED_CHANGE.json)，[可恢复文档变更包](development-linkage/juanerai-documentation-change.zip)。该包仅保存本次文件，不包含在研代码或 project-control。
- **尚未提交、推送或合并，因此尚未对正式仓库默认分支及其他设备生效。** 集成前复核 main 是否前进及规则冲突，保留正在进行的工作。当前不修改生产代码、OpenSpec 或产品状态。

## 用户指定的集成时机（2026-09-09）

联动变更保持待集成，等当前正式开发到达合适检查点再合并。本轮不提交、推送、创建 PR 或合并。后续相关会话确认阶段验收/合并完成或用户指定稳定检查点时，先复核工作树、主线变化与文档冲突，再恢复集成；不设后台监控、不影响当前开发。原工作树如被临时目录清理，可从研究仓库的恢复包按完整 SHA 重建，不能覆盖已有工作。

## 2026-09-16 研究主稿 R3 的联动状态

用户批准的 OSM 零售目标管理融合先以v3.3.1 / MP-ALIGN-01-R3记录，现按用户指定升级为研究主稿 **v3.3.2**，见[融合记录](OSM_RETAIL_INTEGRATION_CHANGE_2026-09-16.md)及[待采用差异](DEVELOPMENT_BINDINGS.md#2026-09-16--r3-待正式采用的差异)。本轮只维护研究资料，不向正式仓库写入；上述14文件恢复包仍为原R1输入，未被R2、R3或当前v3.3.2替换。正式侧继续使用其实际已采用的冻结输入，不把研究主稿的更新理解为已接收。

到达合适检查点后，先对账R1恢复包与当前v3.3.2主稿所承接的R2/R3差异、在研计划及已批准Requirement/AC，再确定采用范围与新的精确快照；这次批准不改变Model Pack两期Gate、Desktop优先级或已有实施范围。

## 2026-09-17 研究主稿 v3.3.3 的联动状态

当前研究主稿升级为 **v3.3.3**，用户已批准将“先C后B”的产品矩阵和推进顺序融入规划，见[融合记录](PRODUCT_MATRIX_INTEGRATION_2026-09-17.md)。这次战略方向无需再次确认；正式采用仍保持2026-09-09约定的检查点，不等于在研分支已切换版本。上文R1/R3状态按各自日期保留，当前指纹见[版本收据](WHITEPAPER_V3_3_3_RECEIPT.json)。

只读核对现有正式计划：Desktop-first与新方向相容；D1–D5、D05七段依赖、member-orders-v2验收夹具、CLI暂停、`DA_REQUIRED_COMPLETE`及独立的`JUANERAI_PUBLIC_RELEASE_GATE`继续有效。Model Pack Phase 1的启动与验收按原计划，Phase 2仍为Enterprise Serving；不得由本次产品商业顺序追加个人留存或Workspace完成等硬Gate。

到达合适检查点时，由Controller按[开发关联索引](DEVELOPMENT_BINDINGS.md)逐项对账新P0/P1/P2、Decision Case、团队迁移、价值指标和企业治理，记录已覆盖、增量、延期或不适用，再按正式仓库既有流程修订相关计划、Requirement/AC和冻结输入。两份附件的PRD、技术方案和任务清单只是后续工作参考，不构成自动创建Task Bus或执行任务的授权。既有14文件R1恢复包保持原样；本次未写入正式仓库、提交、推送或合并。

## 2026-09-19 研究主稿 v3.3.4 的联动状态

当前研究主稿为 **v3.3.4**，已按用户要求正式纳入OSM／PIM双主线和4.5六条主线＋两项贯穿能力表，见[融合记录](OSM_PIM_MAINLINES_INTEGRATION_2026-09-19.md)与[当前指纹](WHITEPAPER_V3_3_4_RECEIPT.json)。上文9月17日状态及v3.3.3收据保留为历史，不能据旧收据校验新版主稿。

PIM是问题与洞察管理流程的正式业务命名，复用既有Contract、Context、IR、方法、执行和治理；不要求普通任务创建OSM目标，不另建分析内核或架构层。新名称、问题跟进和双向接续如何映射正式对象与验收，须在既定检查点登记已覆盖、增量、延期或不适用，遵守原有实质计划变更审查；不自动修改Schema、API、状态或在研任务。

先C后B、Desktop既有冻结范围、Model Pack两期和独立Gate保持；本次没有向正式仓库写入、替换R1恢复包、启动Task Bus、提交或合并。当前正式开发继续使用实际已采用的冻结输入。
