# Change 003／Blueprint v3.0 批准、规则整合与产品输入冻结记录 v1.0

## 1. 用户决定、适用对象与当前身份

- 日期：2026-10-01；拥有设备／职责：MacBook Product Manager。
- Change：`xanthil-desktop-fork-subagent-collaboration`。
- 用户原文：**“审核通过”**。本次回复承接已交付的 [正式审核包](change-003-user-review-package-v1.0.md)，对象为 Blueprint v3.0／产品计划全文、增量 UI Contract 及其可点击附件；不是仅范围讨论的重复批准。
- 记录结果：Blueprint v3.0 全文 `APPROVED`；产品计划全文 `APPROVED`；用户 UI Gate `PASS`。
- 独立 Product Plan Development-Readiness：[新鲜 Review 002](reviews/xanthil-fork-subagent-and-blueprint-v3-development-readiness-review-002.md) 对蓝图与具体计划均为 `PASS`。旧 Review 001 的 NEEDS_CLARIFICATION、蓝图 Review 001 PASS 及其各自适用输入完整保留；后续用户批准不倒写旧审查。
- Product Input Freeze：`PRODUCT_INPUT_FROZEN_LOCALLY`。产品目标、范围、边界、可见行为、验收与禁止项按已批准正文固定；工程内部类型、Schema、路径、事务／窗口机制、资源配置、验证命令及工程拆分未预冻结。
- 当前仓库：`/Users/huangbo/.codex/worktrees/e1d5/JuanerAI`；分支：`work/macbook/xanthil-outcome-follow-up-product-plan`（沿用已有产品规划分支，不切换或重命名）。
- 基础 HEAD：`e3fe084a6d877ac5ebec6dabd603781d0edd78e4`；tree：`5d76b848dc4e1d17d5c856f7474e46ec3f2386f2`。这两项只识别原实现基线，**不是本冻结包已发布 commit／tree**。
- 冻结包 Git 身份：`UNPUBLISHED`，提交／集成 commit 与 tree 待单独授权并完成发布后解析。
- Mac mini 固定版本接收／采用与 Engineering Intake：`UNCONFIRMED / NOT_STARTED`；不推断远端当前工程状态。

## 2. 冻结内容与明确返回点

一片同时覆盖受控 Fork 和单层、单个、用户发起的 Subagent，先 Fork 后 Subagent，两项完成后才算 Change 完成。父／子／三辅助等模型任务顺序执行；独立窗口、精确继承与独立授权；Fork 人工回流，Subagent 成功自动回流待审；回流与人工采纳分开。采纳只追加父对话 MODEL 材料，不直接改变 Evidence／Finding、正式决定／预期或报告。停止、关闭、迟到、过期、失败与重开按产品计划及 UI Contract 验收；本地恢复不自动重发模型。

延续 Change 001／002 的分析、计算、证据、正式记录、报告与存储基础；不重造，不由旧 SDK 或新 UI 推定 Runtime 迁移。Pi 内部仍在 Adapter，沿现有 Product Core → Application → Port → Adapter → Profile 边界。其他 Preview、工具扩权、递归／并行派发、行动执行和结果回访不在本片。完成后返回结果回访 → 改进与下一 Case 显式采用；原回访讨论稿的 D1–D6 未获本次批准。

UI 继续使用 Change 002 的标准、JuanerAI logo 与“持续做出更好的决策”slogan，不抽换主题。每个 Change 定向参考早期 research Demos，提高效率；采用／参考／不采用与生产缺口纳入自包含输入，旧 Demo 或其嵌入 Prompt 不是执行授权。

## 3. 受审／用户批准时的正文身份

以下为 Review 002 及用户审核时的正文。批准后只更新文档控制、状态和记录引用，不改变产品要求：

| 正文 | bytes | SHA-256 |
| --- | --- | --- |
| `juanerai-product-development-blueprint-v3.0.md` | 55119 | `a722ebdad4b8577064eacafbe256d6a3bee04cf863d66d5bbde5228d8b04ad2f` |
| `xanthil-fork-subagent-product-plan-v1.0.md` | 20337 | `3bed07a63c649927b4ffc17a4f5ce08030be9fe91dd0c51336250cace55a8a65` |
| `xanthil-fork-subagent-ui-contract-v1.0.md` | 11658 | `a8a32946129f13cd6caa11ce71efa61c405dae780d0bd5f58f57b23fb2d3607f` |

[精确控制信息差异](reviews/approval-control-update-diff-v1.0.json)保存上述三份正文的每个旧／新行块、位置和前后 SHA。只读核对可从当前正文按 `afterLine` 倒序逆替换恢复受审字节，再计算上述原 SHA；不需改写文件。它是本次身份核对附件，不是新的工作流 Gate 或产品语义来源。计划 §1–9 和 UI Contract §1–5 与受审输入逐字相同。

## 4. 批准后可交接正文与正式附件

相对路径均相对于本记录目录。下表绑定产品正文、自包含研究说明、合成可点击附件、使用／验证说明、截图和历史审查。截图 11 是保留的历史布局失败，不能作为合格布局；12／13 为最终布局。可点击 HTML／CSS／JS 和截图未因本次批准而变化。

| 附件 | bytes | SHA-256 |
| --- | --- | --- |
| [juanerai-product-development-blueprint-v3.0.md](juanerai-product-development-blueprint-v3.0.md) | 55600 | `7aadfbd59da22df7bb4889cd8b25e77cb0e46711b1cdc4e7ba2cc0997de98113` |
| [xanthil-fork-subagent-product-plan-v1.0.md](xanthil-fork-subagent-product-plan-v1.0.md) | 20639 | `e8762f1a485108efc564a8bebd8f5cb84a50275626560f14db84998e6095a56a` |
| [xanthil-fork-subagent-ui-contract-v1.0.md](xanthil-fork-subagent-ui-contract-v1.0.md) | 11975 | `7642abb73102d761a705ac99d54ae00958b35b9a9a8ec7e713d595868e60f4c4` |
| [xanthil-fork-subagent-research-reference-v1.0.md](xanthil-fork-subagent-research-reference-v1.0.md) | 4572 | `7ba218a1aef2448a2abac115d502596b65d908408bd7644e2000a7940b3606f9` |
| [clickable-ui-contract-fork-subagent-v1.0/index.html](clickable-ui-contract-fork-subagent-v1.0/index.html) | 8203 | `63aeaabf5d86ab4b46315c01a350d03030c4781e6112b6436f42ff2ade39e7e1` |
| [clickable-ui-contract-fork-subagent-v1.0/app.js](clickable-ui-contract-fork-subagent-v1.0/app.js) | 48005 | `daa6c16a5aff47e70b68db397fbcf0076151ace7733eebc3635d2631c4ce3b3f` |
| [clickable-ui-contract-fork-subagent-v1.0/incremental.css](clickable-ui-contract-fork-subagent-v1.0/incremental.css) | 8402 | `9e26bb3a531886a5370729116b48be4b8072edd8cce59ded59fcf9d741542793` |
| [clickable-ui-contract-fork-subagent-v1.0/README.md](clickable-ui-contract-fork-subagent-v1.0/README.md) | 10687 | `3f1e168936d6216aae55a1199bb3d78d9769470bb1efa26e5d0cc4ccbf31eeb8` |
| [clickable-ui-contract-fork-subagent-v1.0/verification.md](clickable-ui-contract-fork-subagent-v1.0/verification.md) | 6023 | `d5f207ca457bbc328572bf26de3309e0830e039a4da9564076330661908e42cb` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/01-parent-ready-1440.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/01-parent-ready-1440.jpg) | 95372 | `17802ff9b98374829e9180de849251588b549a08ad0f8ca3d4f2d79dd20a52db` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/02-fork-adopted-parent-1440.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/02-fork-adopted-parent-1440.jpg) | 121333 | `e2452afc83d29bc001130be699414cdacd419e0fdb9fee3ddf38617d26985e01` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/03-professional-retained-1440.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/03-professional-retained-1440.jpg) | 88510 | `be98b95b1d3ee0a9a0b0dfcccd81a94b0769fe21ce87476cf59e6df3b525f3d3` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/04-subagent-waiting-1280.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/04-subagent-waiting-1280.jpg) | 70344 | `c0fe4a1292481c6c5e363442ad137c72dc37ce7f7ca3badc6585236dfa723418` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/05-subagent-return-failed-1280.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/05-subagent-return-failed-1280.jpg) | 70652 | `0fe71bd050af25a79e7e42c16f4897c9e83693dc18bd4d7fe3886f6bd3182df4` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/06-parent-adopted-declined-1440.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/06-parent-adopted-declined-1440.jpg) | 104421 | `4e419147bae3b9403715b4587e65056a103972408db1f30ed6a62df6eda837c5` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/07-subagent-auto-returned-1280.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/07-subagent-auto-returned-1280.jpg) | 84474 | `6ee10cc3ec354b8c24de35c277dbe8a573dacd7871cacb478fc65218058b92a4` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/08-subagent-authorization.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/08-subagent-authorization.jpg) | 80293 | `61399a11012b55268209a85c9515cf916abadf3580f5a0d96b5cecc3a4feed5f` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/09-parent-results-1280.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/09-parent-results-1280.jpg) | 102824 | `c2c9e1e6a243977928286aea440caa3df91b6429b5abefda234f34edb5f16b7a` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/10-professional-retained-1280.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/10-professional-retained-1280.jpg) | 81016 | `787dd75f2cd187126e1161540563cd9c7dd4234825d23528e9ca86886c743695` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/11-review-ready-parent-1280.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/11-review-ready-parent-1280.jpg) | 81617 | `9fd1da34f9bc2eb1587e163956830a83553325605d95994426660bf17237602b` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/12-review-ready-contained-scroll.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/12-review-ready-contained-scroll.jpg) | 104281 | `0fd333cc64eb59467a442a4be8f82436cf824ef3300c9a012a332173c851cf66` |
| [clickable-ui-contract-fork-subagent-v1.0/screenshots/13-review-ready-contained-scroll-1440.jpg](clickable-ui-contract-fork-subagent-v1.0/screenshots/13-review-ready-contained-scroll-1440.jpg) | 116349 | `ba68b16e075c76a9932d4f18d0c41ce85a6c5554be0d69e2b98976ca64cf1116` |
| [reviews/approval-control-update-diff-v1.0.json](reviews/approval-control-update-diff-v1.0.json) | 17989 | `51d5ae0d16dbd6e2ac497c435a39df721938f05272b492bbb94bc869db7d4c23` |
| [reviews/blueprint-v3.0-development-readiness-review-001.md](reviews/blueprint-v3.0-development-readiness-review-001.md) | 3162 | `ec5ffee6a1737c75c40dbca7bb50a3bca5b48292fdad03f729966438dccf5d5c` |
| [reviews/xanthil-fork-subagent-and-blueprint-v3-development-readiness-review-002.md](reviews/xanthil-fork-subagent-and-blueprint-v3-development-readiness-review-002.md) | 4992 | `3a70f9bb876a9ca735360bbf945a3170ea0887f7fc9652d9257d569e12bbae23` |
| [reviews/xanthil-fork-subagent-development-readiness-review-001.md](reviews/xanthil-fork-subagent-development-readiness-review-001.md) | 3390 | `a01b57e2318f0ebaecb74d009f4524bdee754223966995200a0e15986a1b05d8` |

导航审核包及范围决定记录提供时间线，不覆盖正式行为合同。本记录不将自身纳入自引用 SHA；发布后精确 commit／tree 覆盖完整输入包及规则整合。

## 5. Blueprint 规则整合与历史保留

必要项目入口已在 MacBook 本地衔接 v3.0：

- `AGENTS.md`：当前蓝图、路线和四视图入口；每 Change research 参考规则只指向蓝图 §11，不建立新权限或重复政策。
- `CONTEXT.md`：当前蓝图及路线版本；v2 已采用的 Decision Loop 产品术语保持原意。
- `docs/product/product-brief.md`：当前蓝图、受控协作顺序及返回点。
- `docs/planning/README.md`：已批准路线、当前冻结记录、精确正文身份、未发布／未接收状态。

Blueprint v1.0–v2.0、Change 001／002 冻结输入、accepted specs、归档、原失败与批准记录不改写。原 v2 蓝图 SHA 为 `a7181f5a62e41955c7753b018c922701296948b593e9b7ffc164de549b768a30`。继承的 Change 002 CSS SHA 为 `bfa62c9431ac8a1e7fe0b52cfd6322273158a4d38e9ac6c3eabceabd83032ead`，品牌 PNG 为 `56bdb1196e9f1bbaef64c973c4108d12294246de6e941fa00821a2769e3e0e21`，均须保持原字节。

本次控制信息更新不构成产品语义修订，复用 Review 002 的就绪结论。只读批准／规则一致性核对是本轮交付检查，不增设 Development-Readiness、Spec 或工程批准阶段。

独立[批准控制一致性核对 001](reviews/approval-control-consistency-review-001.md) PASS：三份正文的 24 个更新块可精确恢复受审身份，26 项附件读回正确，四个规则入口与停止线一致。Research 说明中的“v2 已整合／v3 候选”保留 2026-09-30 调查时标签；当前效力以本记录及已批准正文为准，不倒写调查或审查历史。

## 6. 当前停止线与交接条件

本次用户批准不授权提交、推送、PR、合并、发送其他 chat／通知 Mac mini、更新工程看板、Engineering Intake、OpenSpec、测试资产、生产实现、依赖安装、真实 Provider／业务数据或外部行动。产品冻结、Git 保存、接收方采用及执行分别举证；本地未提交文件不是已保存的集成项目资产。

后续只有在用户明确授予 Git／交接权限后才发布本输入；由接收方读回实际 task／device、branch、commit／tree、v3 版本／路径／SHA、计划与 UI 合同身份并确认采用。Mini 取得明确推进指令及确认 Engineering Intake 后，再按现行工程政策开始；产品批准不是自动派发。真实 Provider 验证仍须另行批准合成输入、Provider／Model、预算和专用命令。
