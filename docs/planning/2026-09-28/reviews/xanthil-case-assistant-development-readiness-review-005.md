# Xanthil Case Assistant Development-Readiness Review 005

## 1. What I Would Build

构建绑定专业 Case 的独立快速模式 Case Assistant。来源必须是具有 accepted Finding、有效 Decision Closure 和 final report 的 Completed revision。用户确认模型、精确数据、外发历史、只读工具及硬上限后，Agent 多轮协作生成草案；用户采纳才追加正式 Decision Record、Expected Outcome 和报告版本。停止、失败、拒绝及过期不产生正式写入，继续创建新 Attempt，Fork / Subagent 保持 Preview。

Blueprint §6.2 的模型调用例外仍只限本 Change；真实 Provider、数据及费用另行授权，用户 UI Gate、Product Input Freeze 和 Engineering Intake 停止线保持独立。

## 2. Required Guessing

Review 004 的原阻塞在不中断的恢复路径已关闭：

- 场景真正建立 DR-002 / EO-002 / v2，包含固定来源、采纳人、时间和完整字段。
- 旧草案禁用；重新开始复制当前正式字段；授权列出 DR-002 摘要并排除旧草案、模型文本与回执。
- 再次采纳追加 DR-003 / EO-003 / v3；v2 标为 superseded，能够读回所有确认字段和采纳信息。

仍有一个关联的承重不一致：**基于当前正式决定重启后，停止再继续会丢失修订语义。**

可见操作顺序：

1. `当前决定版本变化`。
2. `基于当前正式决定重新开始`，确认授权。
3. 等待用户回答时停止。
4. `继续此工作`，确认新授权并回答。
5. 新草案出现，但编辑、拒绝、采纳均被禁用。

源码原因是：另一 Session 采纳后 `adopted=true`；重启尚未设置 `isRevisionDraft`；继续把 `authContext` 改成 `continue`；完成时只有 `decision-rebind` 才设置修订标志。新 pending 草案因此落入 `adopted && !isRevisionDraft` 的禁用分支。

同一路径的新授权还退回 `final report v1`，不再列当前 DR-002 摘要，无法一致解释继续任务的正式基线。

此前 R1–R4、R6 的文字闭合保持有效；Review 003 的普通 r8 重绑/继续、修订复制与取消、拒绝/过期优先禁用、完整历史读回也保持修正。上述新问题限定在“已有正式决定的重基任务 → 停止 → 继续”的组合路径。

## 3. External Study Required

无需外部仓库、历史聊天、真实业务数据或模型调用。

本轮是正式文档及 HTML / JavaScript 事件路径只读审查。未修改文件、创建测试或调用真实模型。Reviewer 未完成浏览器交互验证。

## 4. Untestable Requirements

Gate C 与 Gate E / F 的组合路径仍不能完整演示 AC-06、AC-13：基于当前正式版本重启的任务，在停止并继续后应保持正确授权及修订身份，并允许用户审阅、采纳为下一版本。

要求本身已明确；问题是可点击附件与其不一致。

## 5. Correctly Deferred

私有类型、持久化 schema、事务实现、Adapter 内部分解、包版本、普通性能参数和工程证据机制可继续交给工程。Provider / Model 与具体资源数值可在真实调用前确定；缺失即禁止开始的语义已闭合。无需提前编写 OpenSpec 或生产实现。

## 6. Required Plan Additions

无需新增产品范围。最小修正仍限可点击附件：

- 正式版本基线和“修订任务”身份应跨停止/继续保留，不能仅依赖当前授权面板模式。
- 继续授权应明确列出当前 DR-002 及适用报告摘要，并保留旧草案/模型/回执排除规则。
- 补查上述组合路径：停止并继续后生成可审阅修订，采纳追加 DR-003 / EO-003 / v3，v2 完整可读。

非阻塞文字问题：再次修订 v3 时，修订/取消说明仍写死“当前 v2、不生成 v3”，应随当前版本更新。

## 7. Verdict

`NEEDS_CLARIFICATION`

Review 004 的直接版本接续已修正；关联的停止/继续路径仍使正式基线披露及后续采纳行为不一致。产品文字、Blueprint 例外和权限停止线无需扩大。

被审 `app.js` SHA-256：`566f17fe9de35125a45c69a0317c604f0cdfdf7b682a5448010a984cc0bdb7a6`。
