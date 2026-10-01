# 蓝图能力证据索引

核对日：2026-10-01。首版集成基准：`5a8fe7b38ebdb1c2a8d49dcb5bdc5fa9d4bc3041`（PR #50）；随后核对Change003已发布记录，固定版本为 `2bb18d7356289781a87a672dc3f7b9bd40341d87`（PR #52）。回填003时本地尚在首版基准，使用只读GitHub记录而未同步产品代码，因此新增来源保留固定版本链接。此处描述证据采集时点，不宣称读者当前工作树HEAD；后续文档发布／同步不改变原证据范围。本索引为[能力清单](register.md)提供来源，不代替原始验收记录或工程状态。

本轮读取了仓库档案及实现／测试入口，没有重跑产品测试、启动应用或调用 Provider。Mini 原始日志、冻结候选和安装工件未在本机逐件读回；下列历史 PASS 是已归档记录的结论，不是本轮重新执行的结论。合成数据经过真实执行路径，也不等于真实客户效果、长期使用或商业价值已得到验证。

<a id="e-bp"></a>

## E-BP — 当前产品目标

- [Blueprint v3.0](../2026-09-30/juanerai-product-development-blueprint-v3.0.md)，文件 SHA-256：`7aadfbd59da22df7bb4889cd8b25e77cb0e46711b1cdc4e7ba2cc0997de98113`；本轮本地计算核对。
- §4 为六条产品主线及 A/B 两项贯穿能力；§5–6 为阶段和纵切路线；§7 保留待决产品定义；§9 为模块边界及复用基础；§10 为价值假设与证据要求。
- 蓝图是目标来源，不是完成证据。Research Demo、未来路线和原有模块复用声明分别保持其原有证明范围。

<a id="e-001"></a>

## E-001 — Change001：会员复购可信分析

| 证据层 | 入口与可支持的结论 |
|---|---|
| 批准范围 | [执行包](../2026-09-19/xanthil-desktop-first-product-change-execution-package-v1.0.md)、[归档 proposal](../../../openspec/changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/proposal.md)；Blueprint §6.1 保留该限定场景。 |
| 当前规格 | [Desktop Decision Case](../../../openspec/specs/xanthil-desktop-decision-case/spec.md)、[local-analysis](../../../openspec/specs/local-analysis/spec.md)。 |
| 实现入口 | [Desktop Application](../../../packages/application/xanthil-desktop-decision-case.ts)、[local-analysis Application](../../../packages/application/local-analysis.ts)、[Desktop Main](../../../apps/desktop/main.ts)。文件存在本身不构成验收。 |
| 测试入口 | [Application integration](../../../tests/integration/xanthil-desktop/xanthil-desktop-application.integration.test.ts)、[storage integration](../../../tests/integration/xanthil-desktop/xanthil-desktop-storage.integration.test.ts)、[Desktop E2E](../../../tests/e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts)。 |
| 执行、独立与用户验收 | [verification](../../../openspec/changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/verification.md)、[最终 acceptance](../../../openspec/changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/acceptance.md)：candidate004/correction9 独立工程／原生验证通过；2026-09-27 用户产品验收通过。历史原始 Main RED／截图缺口的限定豁免仍保留。 |
| Git 身份 | [PR #43](https://github.com/gadfly-hbo/JuanerAI/pull/43)，集成提交 `9626e78fa79f9af6b2676a8589da87d99088d722`，已在本轮本地 Git 历史核对。 |

已支持：限定会员／订单 CSV、CNY／Asia Shanghai 的问题与计划确认、真实本地计算和独立验证、证据及限制、Finding／候选建议、保存重开／重跑及报告导出。不是通用 DAME、OSM 或 Decision Loop 全部完成；“优先验证”建议也不是已批准执行的业务行动。

验收记录所列便携 CI 包含 contracts 25/25、Desktop contracts 313/313、integration 225/225，另有一个真实 Provider 跳过。Ubuntu CI 明确未执行 Electron／打包 GUI／原生人工验收，不能替代各自的 Mac 证据。

原始证据归 Mini 所有：`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001/technical-decision-001/`。具体候选与原生日志入口见 acceptance；本轮未读取该远端目录。

<a id="e-002"></a>

## E-002 — Change002：Case Assistant、Decision Record 与 Expected Outcome

| 证据层 | 入口与可支持的结论 |
|---|---|
| 批准范围 | [产品方案](../2026-09-28/xanthil-case-assistant-product-plan-v1.0.md)、[UI Gate／冻结](../2026-09-28/xanthil-case-assistant-ui-gate-and-product-input-freeze-v1.0.md)、[单一 Provider 设置补充](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/provider-settings-product-input-v1.md)。 |
| 当前规格 | [case-assistant](../../../openspec/specs/case-assistant/spec.md)，与已验收的 Desktop／local-analysis 基线叠加。 |
| 实现入口 | [Application](../../../packages/application/case-assistant.ts)、[Main](../../../apps/desktop/case-assistant-main.ts)、[工作区 UI](../../../apps/desktop/case-assistant-workspace.tsx)、[Provider Application](../../../packages/application/provider-settings.ts)。 |
| 测试入口 | [integration](../../../tests/integration/xanthil-desktop/case-assistant.integration.test.ts)、[native E2E](../../../tests/e2e/xanthil-desktop/case-assistant-native.e2e.test.ts)、[Provider native E2E](../../../tests/e2e/xanthil-desktop/provider-settings-native.e2e.test.ts)。 |
| 执行与独立验收 | [verification](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/verification.md)、[最终独立验证 Candidate010](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/independent-verification-provider-002.md)、[工程验收](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/engineering-acceptance.md)。 |
| 用户验收与交付 | [acceptance](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/acceptance.md)、[completion](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/completion.md)：2026-09-30 目标 MacBook 用户确认 candidate010／DMG011；2238 PASS／0 FAIL／1 gated real-model SKIP，含 66 native PASS。 |
| Git 身份 | [PR #46](https://github.com/gadfly-hbo/JuanerAI/pull/46)，集成提交 `fbd72e1bc7d54d516a1303322f8dda42b4cff98c`，tree `79783d6a9a8ccc57c99b91a8a90c745e96704594`；completion 后续由 PR #47 记录。 |

已支持：从有效 Completed Case revision 绑定独立 Quick Session、精确授权的只读上下文／工具、受限多轮问答、人工审阅并采纳草案、追加 Decision Record／Expected Outcome／报告版本，以及单一 Xiaomi Token Plan CN 设置。保留原专业分析流程；**该版 Fork／Subagent 只是 Preview**。Actual Outcome、事后评价、学习采用与其有效性不是本 Change 的交付。

真实 Provider 证据必须按[最终独立报告](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/independent-verification-provider-002.md)的边界解释：历史成功片段只复用于已证明未变的 Pi／请求／payload／解析分支；该报告记录的 plan003、plan005 整体仍为 FAIL，缺失拒绝文本细节仍为 UNKNOWN，不能被早期 PASS 标题或本地生命周期测试抹去。离线替身、原生合成宿主、真实模型片段、用户产品验收各自支持不同结论；本轮无新增调用或授权。

固定候选 manifest SHA-256：`62be1c4ce46740f8c199b411362948db8ecd70838f984d18c4d1175365853f83`；DMG011 SHA-256：`32ee23123e5d443c9558614d9645897e9c9eb2d93c10bcbe6ec43e736f450b57`。原始文件归 Mini：`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record`；本轮仅核对仓库记录，未在本机校验这两个远端文件。

<a id="e-003"></a>

## E-003 — Change003：已验收并交付的有界 Fork／Subagent

- 批准输入：[产品方案](../2026-09-30/xanthil-fork-subagent-product-plan-v1.0.md)、[UI Contract](../2026-09-30/xanthil-fork-subagent-ui-contract-v1.0.md)、[批准／冻结](../2026-09-30/xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md)、[发布／派发授权](../2026-09-30/change-003-publication-and-dispatch-authorization-v1.0.md)。这些是计划与权限证据，不是运行或验收证据。
- 本次实际读回：[Mini 原任务](codex://threads/01a0f481-89c1-7702-9597-62cae040f1a5)最新回执报告完成、任务 idle；另以 GitHub API 独立确认 [PR #51](https://github.com/gadfly-hbo/JuanerAI/pull/51) 和 [PR #52](https://github.com/gadfly-hbo/JuanerAI/pull/52) 均为 MERGED，并读取下列固定版本文件。任务回执、Git事实与原始运行证据的证明范围分开。

| 证据层 | 固定版本入口与结论 |
|---|---|
| 已接受行为 | [case-collaboration spec](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/openspec/specs/case-collaboration/spec.md)：FS-R01–08、AC-FS-01–10、UI-FS-01–14；合格根Case上单层、用户启动的Fork/Subagent，两条完整路径及关键负面边界。 |
| 实现入口 | [Application](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/packages/application/case-assistant.ts)、[Store](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/adapters/storage-local/case-assistant.ts)、[Main](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/apps/desktop/case-assistant-main.ts)、[工作区UI](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/apps/desktop/case-assistant-workspace.tsx)。路径见已合并PR；不凭文件存在推断行为通过。 |
| 测试入口 | [协作integration](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/tests/integration/xanthil-desktop/case-collaboration.integration.test.ts)、[生命周期integration](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/tests/integration/xanthil-desktop/case-collaboration-lifecycle.integration.test.ts)、[native E2E](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/tests/e2e/xanthil-desktop/case-collaboration-native.e2e.test.ts)。 |
| 工程与独立验收 | [engineering-acceptance](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/openspec/changes/archive/2026-10-01-xanthil-desktop-fork-subagent-collaboration/engineering-acceptance.md)：candidate003＋supplement002，Validator review004 PASS，F1–F6关闭；完整默认离线canonical **2305 PASS / 0 FAIL / 1真实模型门控SKIP**，含native **73/73 PASS**。 |
| 用户验收 | [product-acceptance](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/openspec/changes/archive/2026-10-01-xanthil-desktop-fork-subagent-collaboration/product-acceptance.md)：2026-10-01 14:23:12（Asia/Shanghai）记录用户“验收通过”；基于固定工程包及隔离合成Project，无配置真实模型；不从简短用户结论推断具体手工步骤或模型调用。 |
| Git交付与归档 | [git-delivery](https://github.com/gadfly-hbo/JuanerAI/blob/2bb18d7356289781a87a672dc3f7b9bd40341d87/openspec/changes/archive/2026-10-01-xanthil-desktop-fork-subagent-collaboration/git-delivery.md)：PR51于2026-10-01 15:09:38（Asia/Shanghai）合并为 `2cad5cd11480e8221ac2b1a554562a70bdc7a16b`，与 reviewed head `270dede6cca6241d43b964ede41e43e44d27cf04` 同 tree `c9cd9a2bd7c917dca6453cfb6a92f0203da9563f`；PR52于15:19:54合并为 `2bb18d7356289781a87a672dc3f7b9bd40341d87`，保存完成回执。 |

累计能力结论：**C5-03／C5-04的批准目标范围已验收**。实际链路为001有效Case及002根Assistant → 独立子窗口、精确材料与单独授权 → Fork人工回流／成功Subagent一次自动回流 → 父会话人工审阅 → MODEL-only材料；后续父模型继续需要重新明确选择和授权。此结论基于上述已发布验收记录，不是本轮重新执行。C1/C3/C6/A/B只扩大相应子范围，不升级为全蓝图完成。

固定身份：candidate003 manifest `04eb3655b40b6674ae65e58e944a24cafbdaee9e7d9bccb3d5a37debbce08911`；supplement002 manifest `140ef5e45d61fde9d3b6cc1e20e298ccfad214ee374b4255e5168e998a72da8d`；ASAR `e4ff0e58fb57ca4f30c6ead79f0b5574a12bf298505714d86d840ec1a0dd99c9`。独立原始报告摘要及SHA由engineering-acceptance绑定，本轮未读回Mini原始工件。

保留限制：

- 真实原生组件与本地Store的离线验证使用合成数据／SDK传输；**没有新增实际Provider执行、模型质量、安装或发布验收**。工程包不等于新DMG发布，用户PASS不扩大这些结论。
- hosted CI run36828295533 PASS与本地native结果是不同证据。首次CI旧100/104入口断言失败、修正后27/27 CI contract、历史候选失败及U2取消标记超时原因UNKNOWN保留；后续通过不覆盖历史。
- 仅支持已批准sidecar100→101迁移与生命周期规则，未知schema及旧程序打开101拒绝；没有降级／用户数据恢复授权。正式Decision/Outcome/Evidence/Finding/报告仍由原人工流程控制；其他Preview、递归／模型自主派发、任意工具及行动自动化未获交付。
- 原始证据仍归Mini：`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-fork-subagent-collaboration`。本机只读了发布文档与任务回执，未备份或逐件复核远端原始数据。

### 保留的在研观察（非当前状态）

2026-10-01约12:43（Asia/Shanghai）原任务为active，报告77/77定向回归通过，尚待全量回归和固定新候选。当时没有最终工程／用户验收及Git交付读回；只能支持“实现中”。该历史转述保留在[在研快照](snapshots/change-003-in-progress-2026-10-01.md)，不改成当时已通过；当前完成结论由上面的后续证据建立。

<a id="e-dev"></a>

## E-DEV — Desktop 开发模式：工程支撑

[completion](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-development-mode/completion.md)、[verification](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-development-mode/verification.md)、[独立验证](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-development-mode/independent-verification.md)记录：隔离的原生 Desktop 开发模式、三种 HMR 状态及正式后端 SQLite／DuckDB／Python 计算、报告／导出／重开验证通过。集成 [PR #48](https://github.com/gadfly-hbo/JuanerAI/pull/48) 为 `ef145f909b0695b6f56787e9f5709cb45545b57a`；PR #49 的交付回执为 `e3fe084a6d877ac5ebec6dabd603781d0edd78e4`。

这是提高迭代效率的工程支撑，不新增业务能力完成率，不替代固定代码的业务验收或受影响的安装工件检查。没有新 DMG／真实 Provider 调用；未验证历史真实 Project 字节一致性、MacBook 环境或整份新发布包。原始证据仅位于 Mini 的 `/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-development-mode`，本轮未重跑或复制。

<a id="e-legacy"></a>

## E-LEGACY — 既有可复用基础的核验边界

Blueprint §9 明确保留 CLI、Core、本地计算、Model Pack contract enabler 等基础。[现有规格入口](../../../openspec/specs/README.md)、[Model Pack contract enabler](../../../openspec/specs/model-pack-contract-enabler/spec.md)可用于后续定向核验。本轮没有全库验证这些基础在 Blueprint v3 各目标范围下的当前集成、真实执行和用户验收，故相关广义能力保留“待核验”或已证明的局部范围，而不是声称其不存在，也不凭旧代码／Demo／规格存在判定整个能力完成。
