# 蓝图能力证据索引

核对日：2026-10-01。首版集成基准：`5a8fe7b38ebdb1c2a8d49dcb5bdc5fa9d4bc3041`（PR #50）；随后核对Change003已发布记录，固定版本为 `2bb18d7356289781a87a672dc3f7b9bd40341d87`（PR #52）。回填003时本地尚在首版基准，使用只读GitHub记录而未同步产品代码，因此新增来源保留固定版本链接。此处描述证据采集时点，不宣称读者当前工作树HEAD；后续文档发布／同步不改变原证据范围。本索引为[能力清单](register.md)提供来源，不代替原始验收记录或工程状态。

本轮读取了仓库档案及实现／测试入口，没有重跑产品测试、启动应用或调用 Provider。Mini 原始日志、冻结候选和安装工件未在本机逐件读回；下列历史 PASS 是已归档记录的结论，不是本轮重新执行的结论。合成数据经过真实执行路径，也不等于真实客户效果、长期使用或商业价值已得到验证。

<a id="e-bp"></a>

## E-BP — 当前产品目标与历史基线

- 当前规划来源：[Blueprint v4.1](../2026-10-01/juanerai-product-development-blueprint-v4.1.md)及其[批准／评审采用记录](../2026-10-01/blueprint-v4.1-approval-and-rule-integration.md)。本次只更新产品规划引用与清单映射；以下 E-001～E-LEGACY、历史状态及快照的证据边界未变，Git 发布及接收采用另证。
- v4.1 §4.1 沿用本清单唯一维护机制；§5.1 明确非全串行路线，§6.2／§9.2／§9.4 记录本期实际链缺口及静态评审采用，§10 要求同一候选三类验收。静态依据不是新的运行 PASS，不升级既有实现状态。

历史建表来源（原身份保留，下面章节号指 v3.0）：

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

<a id="e-004-wip"></a>

## E-004-WIP — Change004 在研，尚无完整 P1 接受

2026-10-02，Mac mini Engineering Controller 对本机阶段快照独立字节／哈希读回。以上历史 E-001～003 的采集说明保持原时点，本节使用当前本机证据。工程起点 commit `c413bee3356a7d26be6ef4ea6bbd8e218fca4d79`、tree `74e042fa0680a22ba29fd68e87f67f8ca6428301`；工作树含未提交实现，HEAD 不是新增实现候选。产品输入固定于 `989deeb536a770dc0067a82a73f20f17220cbd40`。权限和所有权见 [intake](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/intake.md)，具体工程边界见 [工程决定](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/engineering-decisions.md)。

原始证据唯一根为 `/Users/bendandebaba/JuanerAI-artifacts/change-004`，归 Mac mini；以下均相对于该根。接收方 Controller 可在同设备读取，尚无跨设备备份或 Git 发布证据。

| 固定阶段 | 身份与支持范围 |
| --- | --- |
| 首个实际计划消费链 | `worker/implementation-001/candidate-manifest.json` SHA-256 `312eb62cdee3d59aafea791f85473411e74a6135abf38c59ad863fd9e35bc4ac`；44 聚焦及 502 旧路径检查、类型检查通过。Controller 回执 `controller/worker-implementation-001/controller-readback.json`。 |
| 任务／共享物理模型占位 | `worker/stage-a-20261001T232433Z/checkpoint-physical-001/candidate.json` SHA-256 `a6827c1dc6bc9540e091301cb45ae247df206a6cf1b155cc7b55c8ce3d77a1aa`；101 最终受影响回归、类型及离线构建通过。回执 `controller/worker-stage-a-002/controller-readback.json`。 |
| 配置／授权补充与原生阻点 | `worker/stage-ab-20261002T010119Z/native-blocker-001/source-delta.json` SHA-256 `4e9745182df687b6f99c99cfe1dad84725c8420f1a23e2bec2061b389c0f87b1`，绑定上一阶段 baseline；34 聚焦检查、补充配置检查、类型及离线构建通过。17 源码增量及 5644 证据文件已读回，回执 `controller/worker-stage-b-001/controller-readback.json`。 |

测试数量来自不同阶段且可重叠，不能相加为唯一覆盖。失败记录保留，详细归属见 [verification](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/verification.md)。原生 Electron 在产品 Main 前 SIGABRT，清理报 EPERM，根因 UNKNOWN；未执行到真实组件／IPC 断言。Decision003 允许继续不受影响的离线 B，实现授权不等于豁免此验证。

B、完整集成候选及其回归、独立 Validator、工程接受、用户体验／产品接受、真实 Provider 质量和安装／发布均不能由这些阶段记录推出。[在研全景快照](snapshots/change-004-in-progress-2026-10-02.md)不是完成快照；后续完成需追加固定候选证据。

## E-004-REVIEW-001

2026-10-02，完整离线候选冻结并完成首轮独立审查。唯一证据根、Mac mini 所有权、工程起点和产品输入身份沿用 E-004-WIP；以下路径相对于 `/Users/bendandebaba/JuanerAI-artifacts/change-004`。这些是当前本机可读证据，尚无 Git 集成或跨设备备份。

- 固定根：`worker/stage-d004-20261002T0325Z/integrated-offline-001`。`receipt.json` SHA-256 `b93d3214f31c24af1a0f900e8fe1d84e1769ac5ca846838a590b4c55e7105b1e`；`candidate.json` SHA-256 `aa40363193d046d8e59d83b186d010a0001f6f5fbb4aa4fc44bcb1faf7a65859`。184 源码文件、25 依赖文件和 16133 证据条目。
- Controller 独立读回：`controller/worker-cross-entry-001/controller-readback.json`，16564 次读取、2193255880 字节、零不一致；字节身份不代表行为接受。
- 作者离线回归 `daily-028`：2390 PASS／0 FAIL／1 个既有真实 Pi 门控 SKIP。后续界面修正有定向回归、`types-complete-043`及当前源码重新构建的 `package-fixed-042`；具体快照和限制见 Change verification，重叠检查不相加。
- 独立报告：`controller/validator-review-001/last-message.txt`，SHA-256 `9e2f1af040f44cb0b3d8b50d6fc362ffb009836faa23d8d97aaa530895167e44`。实际角色 `juaner_validator`，gpt-6-astra/high/read-only/never；有效配置见同目录 `turn-context-attestation.json`，完整独立命令和输出见 `stdout.jsonl`。
- 独立结论 **FAIL**：F1 绝对路径外发过滤遗漏；F2 默认有据人审摘要／已知项复用缺失；F3 正式提交后显示矛盾；F4 点评保存失败清空原文。正在同一 `juaner_worker` 上下文修正，尚无新候选接受。
- 独立正面证据：真实 DuckDB/Python 的 M1／M1+M2、判别性期间修改、零值／零分母／全空、错配和取消；M1 执行分支观察；表达替换与原事实保留；21 项协议及 2 项物理结算测试、类型检查通过。
- E1 **BLOCKED**：独立持久化整链、主／子任务和故障复跑在 `mkdtemp` 被 read-only sandbox 拒绝，未进入业务断言。作者已有真实 SQLite／SIGKILL／热日志／唯一重试证据，但不能冒充独立执行。
- E2 **BLOCKED**：原生启动、打包 GUI、键盘／焦点／视口和完整原生验证未完成。Decision003 仅允许离线开发继续，未豁免此责任；没有重试或绕过权限。

首轮快照见[完整六＋二覆盖图](snapshots/change-004-review-001-2026-10-02.md)。F1/F2/F4 真实激活决定、实际 Provider 质量／费用、UX01–07 及用户产品接受仍未完成；这里的产品决定编号与 Validator 缺陷编号分属不同记录。原 40 项稳定 ID 和 001～003 已接受子范围保持，不将工程包、离线检查或独立有限通过升级为交付。

## E-004-REVIEW-006

2026-10-02，当前离线修复候选及独立复核。唯一证据根仍为 `/Users/bendandebaba/JuanerAI-artifacts/change-004`（Mac mini），以下为相对路径。历史失败、候选和各次复核均保留；工作树尚未提交／集成，跨设备备份 UNKNOWN。

- 固定根：`worker/stage-fixes5-20261002T090727Z/corrected-offline-005`。Receipt SHA-256 `c20455d7f53b1eab9dbb13cf30f12dfa54ebaa260b32a0bd56dd6ec25ac759b4`；candidate `080a55f9abb23d8e1b358b96a6b6e410ef0707b095cfc2bc734a2b52b9e3009a`；evidence `0d0703f692f86b7e9465c214dc789973e0002c322f04a3ff6e1b510e08f13b2b`。184 源码文件、25 依赖、2037 证据条目，完整历史关联见 `prior.json`。
- 作者最终证据：273 Runtime 契约 PASS、39 定向集成 PASS、类型检查 PASS、当前静态包 PASS。前序 338／375 项及完整 daily 2446 PASS／0 FAIL／1 既有真实 Pi 门控 SKIP 仅对未变范围复用，未宣称在最终候选重跑全套；数量重叠不相加。
- Controller 机械冻结及独立回读：`controller/worker-validator-fixes-005/controller-readback.json`，2500 次、646671004 字节、零差异。此前代理收尾无进展的中断／恢复记录保留，非产品测试失败；最终作者调用退出 0。
- 独立报告：`controller/validator-review-006/last-message.txt` SHA-256 `9716fa6decb9f3e346e27aa4d40522874e9a5714861db6b53aa8c82860e4a45b`；完整独立命令／输出与实际 gpt-6-astra/high/read-only/never 配置同目录保存。结论：**整体 BLOCKED，最后 F1 实现修复限定范围 PASS，无剩余实质实现缺陷**。F2/F3/F4 生产实现未再变化，沿用此前独立有限结论。
- 独立执行：273 Runtime 契约通过；20 个支持表达在 11 个材料入口共 220 次原文一致性检查通过；124 个违规表达跨 11 个入口共 1364 次拒绝，凭据、模型构造和传输均为零。此为有限验证，不宣称通用文本识别或安全完备。独立回读 2468 次、645416160 字节、零差异；184 个实时源码执行前后匹配。
- 包身份 `1395539bad39479781990bc9bccbfcd4a3c37c927e14700194c3d837e817f756`；app.asar 122560660 字节，SHA-256 `d0e2b3efa4b45f98e91749cb847ad9af7b962b1622b04449366fa49d78789c8b`。仅静态工程包，未启动、安装或发布。
- E1/E2 继续 BLOCKED：独立持久化执行受 read-only 临时写入限制；原生 Electron 在 Main 前退出及清理 EPERM 未解决。未更换路线规避权限。作者 SQLite／恢复证据不能替代独立执行，离线组件证据不能替代原生验证。

工程接受、产品接受、OpenSpec 归档及 Git 交付未完成；真实激活 F1/F2/F4 产品决定、模型质量／费用和 UX01–07 仍分别待定。当前返回点及所需验证权限见 [Controller 工程记录](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/engineering-decisions.md#current-disposition--offline-candidate-reviewed-2026-10-02)。[本轮完整覆盖快照](snapshots/change-004-offline-review-2026-10-02.md)保留原 40 个稳定 ID 的范围和已接受子范围，没有新增目标验收。

## E-004-VERIFY-007-008

2026-10-02，用户批准隔离合成测试写入与本机 Electron 启动／清理。唯一证据根和设备仍为 `/Users/bendandebaba/JuanerAI-artifacts/change-004`（Mac mini）；以下相对路径位于 `controller/validator-permitted-001/`。固定 candidate、receipt 和 app.asar 身份沿用 E-004-REVIEW-006；184 个原源码前后零差异。没有改变原 40 项稳定 ID 或已验收范围。

- 实际独立角色 gpt-6-astra/high/never；`runtime-preflight/` 证实隔离目录可写、原源码写入 EPERM，零源码字节写入。各次 `controller-runtime-attestation.json` 绑定实际配置。唯一可写测试根为该证据目录，未修改全局配置。
- **E1 PASS**：`validation-007/persistence-001/`，完整会员集成158 PASS／0 FAIL／0 SKIP，含真实合成分析、SQLite/SIGKILL/热日志恢复、原账本主子任务及 F1–F4。独立报告 `validation-007/last-message.txt` SHA-256 `29d778feb5b9261e189afd47f397ee0df215a876298e4a631d8cd291a6eb295a`。
- **E2 BLOCKED**：`validation-007/native-001/`，构建通过，Electron PID34623 SIGABRT，0 PASS／1 FAIL；未进入窗口／IPC验证。独立清理／进程枚举 EPERM；Playwright观察退出及临时清理。Controller的精确PID读取随后确认该主进程不存在，不能冒充独立全后代清理证据。
- `controller-native-related-log.json` 保存同PID的 kernel/launchd 拒绝记录，明确涉及 WindowServer/LaunchServices；`controller-native-diagnostic.json` 及 `.ips` 副本保存应用注册阶段崩溃。具体沙箱／桌面服务不兼容已获证据；唯一根因或修复有效性仍未证明。没有再次启动或换 host/browser。
- `validation-007/canonical-portable-001/` 保留两项依赖布局失败；未受影响余项1764 PASS／0 FAIL／1既有真实模型门控SKIP。复制现有依赖后 `validation-008/targeted-001/` 匹配4项PASS，原两失败解除，结果SHA-256 `09dba88aed76cb7509b6753fb1c38b8a0d3a278d10b2dfea4bb97fbf95dc4750`。这不是完整canonical单次PASS；各组数量不相加为新增唯一覆盖。
- 完整 native/package 和当前包的注册producer GUI readback仍缺。工程／产品接受、归档、Git／安装／发布没有完成；真实模型及真人体验继续分别待定。当前返回点见[工程记录](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/engineering-decisions.md#verification-result--approved-isolated-execution-2026-10-02)。

[当前完整六＋二快照](snapshots/change-004-isolated-verification-2026-10-02.md)保留累计已证能力和全部缺口；前序快照及失败不覆盖。证据在本机可读，跨设备备份 UNKNOWN，源变更尚未 Git 集成。

独立补验最终报告 `validation-008/last-message.txt` SHA-256 `2931d404bd1d7b449f51a3a4a845c2e1c391021b6595bb342c70b5bc90b66610`，退出0；4/4通过，原依赖、184候选源码及1905副本源码保持原字节。新目录创建／清单形状诊断的两次准备失败保留，均发生在测试前。

## E-004-DELIVERY

2026-10-02，用户在原会话明确：“放行E2，后续再修，交付change004”。这授权固定候选的工程交付及归档，并接受已披露的 E2 及相关完整 native/package 证据缺口。本项不把既有 Validator BLOCKED 改成 PASS，不声明真人体验已完成。

- 固定生产候选沿用 E-004-REVIEW-006：candidate `080a55f9abb23d8e1b358b96a6b6e410ef0707b095cfc2bc734a2b52b9e3009a`、receipt `c20455d7f53b1eab9dbb13cf30f12dfa54ebaa260b32a0bd56dd6ec25ac759b4`，184源码与32项批准产品输入已重新核对。
- 独立验证和历史失败沿用 E-004-VERIFY-007-008；E1关闭，E2明示后置。工程接受、豁免范围／撤销条件和精确返回点见[工程接受](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/engineering-acceptance.md)及[E2后续修复](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/e2-follow-up.md)。
- 当前行为规格、归档映射、文档增量及CI精确入口清单修正的证据由[完成记录](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/completion.md)绑定；Git/CI/两机同步的实际结果由[交付记录](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/git-delivery.md)记录。准备完成不代表已经合并。
- 产品增量：P1 A/B从在研实现转为附E2豁免的工程交付；六＋二累计地图仍按各能力已证范围解释，40项稳定目标、原001～003已接受子范围不变。真人体验、真实模型质量／费用、行动／Actual／评价及学习闭环等缺口保留。
- 本次交付不授权实际Provider/业务数据、安装、发布或下一Change。原始证据根仍为 `/Users/bendandebaba/JuanerAI-artifacts/change-004`（Mac mini）；Git集成不等于这些设备本地原始日志已跨设备备份。

[完整交付快照](snapshots/change-004-delivery-with-e2-waiver-2026-10-02.md)保存固定六＋二覆盖、增量和缺口。
