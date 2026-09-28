# Xanthil Case Assistant Development-Readiness Review 006

## 1. What I Would Build

构建一个绑定专业 Case 的独立快速模式 Case Assistant。来源必须是具有 accepted Finding、有效 Decision Closure 和 final report 的 Completed revision。用户确认精确外发内容、Provider / Model、只读工具和预算后，Agent 进行有限多轮协作并提交 Decision Record / Expected Outcome 草案。只有用户采纳才能通过确定性命令追加正式记录和报告版本；来源分析 revision 保持不变。停止、失败、拒绝及过期不产生正式写入，继续创建新 Attempt，Fork / Subagent 保持 Preview。

Blueprint §6.2 原有“不实施新的模型调用”边界已被诚实披露；后续用户决定仅修订本 Change，未推广为通用 Quick、其他 Preview 或真实 Provider 执行许可。真实调用仍需另行批准 Provider、Model、数据、预算及专用命令。

## 2. Required Guessing

未发现仍需工程自行发明的承重产品规则。Review 005 的唯一阻塞已在当前附件的事件路径中关闭：

- **正式基线独立于授权面板模式。** 重基时复制当前正式字段并保存 `revisionBaseDecision`；停止和继续不清除该身份。完成时依据它恢复修订草案，而不再依赖 `authContext === 'decision-rebind'`。
- **继续授权保留 DR-002 / EO-002 / v2。** 清单取自实际记录的用户消息和已完成回执，同时披露当前正式决定、Expected Outcome、报告版本，并明确排除旧正式基线草案、模型文本及未选择历史。重基开始时清空旧回执，因此旧基线回执不会混入这次继续。
- **回答后修订可编辑、拒绝及采纳。** 完成回调设置修订身份与 pending 状态；按钮禁用判断保留 stale / rejected 优先级，不再因已有正式记录误禁用有效修订。
- **采纳追加 v3，v2 完整保留。** 冲突场景实际建立 DR-002 / EO-002 / v2；下一次采纳追加 DR-003 / EO-003 / v3。每版保存固定 revision、采纳人、时间和确认字段，历史弹窗逐项读回。
- **v3→v4 修订/取消说明动态正确。** 当前对象与下一编号均从正式版本集合计算；取消待审修订恢复当前正式字段且不追加版本。

此前关闭项保持有效：

- R1：六阶段与三类一次辅助沿用基线。
- R2：准入、追加版本、多 Session 冲突、编辑取消及结果来源已明确。
- R3：逐字文本、精确 subset、逐项历史授权及旧 revision 排除已明确。
- R4：等待预算、等待截止、停止及退出终结规则已明确。
- R6：首切片已绑定正式验收，记录明确包含用户 Product Acceptance PASS。
- Review 003 / 004：r8 草案、授权和实际回执按绑定 revision 生成；修订复制/取消、拒绝及过期禁用、完整历史和同 revision 版本接续均保留。

## 3. External Study Required

无。正式包及提供的权威附件足以理解产品、判断本轮修正，不需外部仓库、历史聊天或真实模型。

本轮仅作文件、留存截图及 JavaScript 事件路径的只读审查；未修改文件、创建 OpenSpec、测试或生产代码，未调用真实 Provider。Reviewer 未执行浏览器交互验证。

## 4. Untestable Requirements

未发现因产品规则缺失而无法定义预期结果的要求。Review 005 指出的 Gate C → E / F 组合路径现在具有一致的授权、修订身份和版本接续语义。

这不声明生产持久化、真实调用、重启恢复或浏览器 UI Gate 已通过；这些仍须在其对应阶段取得实际证据。

## 5. Correctly Deferred

私有类型、接口名称、存储 schema、事务实现、Pi Adapter 内部组织和迁移步骤、包版本、普通性能参数、离线夹具及工程证据机制可继续由 Engineering Controller 决定。具体 Provider / Model 与数值上限可在真实调用前确定；缺失即禁止开始的产品语义已闭合。

## 6. Required Plan Additions

无阻塞性补充。

现有停止线保持有效：本次审查 PASS 后仍须用户 UI Gate PASS、Product Input Freeze，以及明确指令下的 Engineering Intake，之后才能进入 OpenSpec、RED 或实现。

## 7. Verdict

`PASS`

Review 005 的正式基线停止/继续阻塞已关闭，v3→v4 动态说明也已修正。当前正式包没有发现承重业务、边界、权威或验收猜测；此结论仅为 Product Plan Development-Readiness，不替代用户 UI Gate 或工程验收。

被审 `app.js` SHA-256：`af8a148b3ced732c99a6fa93ff10a724cace5728529dd6b7d84f558b04f3e480`。
