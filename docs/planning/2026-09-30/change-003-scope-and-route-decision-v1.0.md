# Change 003 范围确认与路线调整记录 v1.0

## 1. 已收到的用户决定

日期：2026-09-30。用户在本产品规划 chat 询问 Fork／Subagent 能否在 Change 003 激活；产品经理给出下述完整建议后，用户回复 **“同意”**。

确认的范围为：

1. Change 003 改为 **受控 Fork 与 Subagent 协作**，原结果回访方案顺延，不叠加到本片。
2. Fork 与 Subagent 在同一产品 Change 内先后交付：先 Fork，后单层、单个、用户发起的 Subagent；不做递归派发或多个并行子代理。
3. Fork 是独立子对话，选择历史与获准数据，用户手动回流结果；Subagent 是独立有界任务对话，成功后自动回流待审结果。
4. 回流不等于采纳。用户查看、拒绝或采纳；采纳仅加入父对话材料，不直接改写 Finding、正式决定或报告。
5. 模型任务顺序执行：父 Attempt 结束后才启动子任务；子任务运行时父对话可以查看，不同时运行模型。
6. 保留停止、失败原因、历史重开及来源过期阻断；不自动恢复模型执行。
7. 延续 Change 001／002 与既有 UI 标准，复用现有能力，不重造分析、计算、正式决定或报告流程。

这是产品范围／方向的批准，不是详细产品计划全文、蓝图新版本全文、UI Gate、Product Input Freeze、工程启动、真实模型调用、业务数据处理或 Git 发布的批准。草案细化须标为建议，不反向扩充这次确认。

## 2. 与此前批准文本的差异

| 原来源 | 原约定 | 本次明确调整 |
| --- | --- | --- |
| [Blueprint v2.0](../2026-09-26/juanerai-product-development-blueprint-v2.0.md) §6／8 | 决定与预期 → 结果回访 → 下一 Case 显式采用 | 在决定与预期之后插入本片的受控分支／子任务协作；随后回到结果回访 → 下一 Case 显式采用 |
| [Change 002 产品计划](../2026-09-28/xanthil-case-assistant-product-plan-v1.0.md) §6.3 | Fork 先于 Subagent，各自的新产品 Change／UI Gate／工程合同 | 同一 Change 003 内先 Fork、后受限 Subagent；新 UI／验收覆盖两项完整结果，不以 Fork 完成冒充整个 Change 完成 |
| [原结果回访讨论稿](xanthil-outcome-follow-up-product-proposal-v0.1.md) | 建议作为第三个 Change，D1–D6 尚待选择 | 保留为延期参考；它的指标、数据、行动和模型建议没有因此获批 |

旧 Blueprint、Change 002 冻结计划、UI Gate 和归档保持原文及历史效力。本记录不倒写旧规范，不声称 Fork／Subagent 已经激活，也不替换现行 canonical spec。

## 3. 版本化路线修订的拟议内容

本次改变后续纵切顺序，不把它包装成非语义文字修正。按 Blueprint v2.0 §1.1，建议正式路线修订采用 **v3.0**；此处是差异输入，不是已经批准或就绪的 Blueprint v3.0 全文。

拟修订顺序：已验收可信分析 → 已验收决定／预期与 Case Assistant → 受控 Fork／单个 Subagent → 结果回访与复盘 → 改进与下一 Case 显式采用。

| 四视图 | 拟议差异／保持内容 |
| --- | --- |
| 能力全景（§4） | 提前激活已有 Fork／Subagent 可见能力；六主线＋两贯穿能力全部保留，不解锁通用 Quick、Deep Research、自主探索或其他 Preview |
| 阶段与纵切（§5–6／8） | Personal 阶段插入本片；结果回访／学习接续保持返回点；不提前宣称 Decision Loop MVP 完成或进入 Team |
| 架构与责任（§9） | 业务父子身份、精确来源和回流／采纳由 Product Core／Application 拥有；Runtime 执行仍在 Adapter，Profile 组合；不引入第二 Runtime 或通用调度平台 |
| 价值与证据（§10） | 新增“分支比较／有界检查减少主对话混杂”的待验证价值假设；需要真实 UI 可用与软件正确性证据，模型意见不成为独立业务佐证或决策效果证明 |

完成正式版本稿、独立 Development-Readiness Review、用户全文确认和规则整合之前，[规划入口](../README.md)仍把 v2.0 标为现行已批准蓝图，同时明确展示本次用户范围调整。Mac mini 不得仅凭本记录开始工程。

## 4. 当前下一步和停止线

本节保留首次范围确认后的状态：当时活动草案为 [Fork／Subagent 产品讨论稿 v0.1](xanthil-fork-subagent-product-proposal-v0.1.md)，新增连接处仍待讨论稿确认。后续状态见下节，不倒写首次授权。

产品输入在适用路线版本、产品细节、独立就绪审查和用户 UI Gate 完成前不冻结。不创建 OpenSpec、测试或生产代码，不安装依赖、调用模型、处理业务数据、更新工程看板、提交／推送、发送其他 chat 或通知 Mac mini 开工。

## 5. 后续讨论稿批准与正式候选

用户随后明确：“讨论稿同意，继续推进正式路线版本、可点击增量 UI Contract 和相应 Gate；UI标准在change2时已经确定，注意做延续。”因此讨论稿的根入口、选定分叉历史、独立子窗口、父子关闭和回流恢复进入[正式产品计划候选](xanthil-fork-subagent-product-plan-v1.0.md)，不再作为未决建议重复询问。

用户再补充每个 Change 参考此前 research Demo、只是参考以提高效率。本片的[参考采用说明](xanthil-fork-subagent-research-reference-v1.0.md)和 [Blueprint v3.0 候选](juanerai-product-development-blueprint-v3.0.md)明确采用分类和生产缺口，不赋予旧 Demo 新执行权。

正式版本的独立就绪审查、用户 UI Gate／蓝图全文确认、规则整合、Product Input Freeze 和 Git 发布仍未由上述批准推断；本次只产出待审正式包。

## 6. 正式审核批准与本地冻结（2026-10-01）

用户在收到 Blueprint v3.0、产品计划、增量 UI／可点击附件和新鲜 Review 002 PASS 的完整审核包后回复“审核通过”。因此本轮全文批准及 UI Gate PASS 已取得；[批准与产品输入冻结记录](xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md)固定受审与批准后文档控制身份、MacBook 本地规则整合和冻结范围。

前五节保留各次决定发生时的授权和状态，不倒写为当时已经完成后续 Gate。本次审核通过不授权 Git 发布、发送 Mac mini、更新其工程看板、启动工程或真实 Provider／业务数据调用。
