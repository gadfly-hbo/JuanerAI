# Xanthil Case 决策助手 Product Plan Development-Readiness Review 003

- 日期：2026-09-29
- Reviewer：第三名 fresh independent read-only support Agent，implementation-worker perspective
- 被审候选：产品计划状态 `REVISION_02_AFTER_DEVELOPMENT_READINESS_REVIEW_002` 及其增量/可点击 UI Contract
- 权限：只读；未修改文件，未创建 OpenSpec、测试或生产代码，未调用真实模型或业务数据

## 1. What I Would Build

构建绑定专业 Case 的独立快速模式 Case Assistant。来源须为具备 accepted Finding、有效 Decision Closure 和 final report 的 Completed revision；用户确认模型、精确数据、外发历史、只读工具及硬上限后，Agent 多轮协作生成 Decision Record / Expected Outcome 草案。只有用户采纳后的确定性命令可以追加正式记录及报告版本，原分析 revision 保持不变。停止、失败、拒绝和过期不得产生正式写入；继续创建新 Attempt；Fork / Subagent 保持 Preview。

Blueprint §6.2 原始边界排除新的模型调用；当前计划把后续用户决定限定为本 Change 的范围修订，并保留真实 Provider、Model、数据和预算另行授权要求，没有泛化为其他 Change 或 Preview 的执行授权。

## 2. Required Guessing

Review 001 的 R1–R4、R6 文字缺口保持关闭。Review 002 的 R5-A 已实质改善：完整字段进入表单和保存对象，候选分支具有额外必填集，普通字段编辑取消后会从已保存草案恢复。

R5-B / R5-C 尚未完全关闭：

1. r8 授权已列出 E-13/E-15、F-05、r8-v1 并排除 r7，但开始任务仍固定生成 r7 的 E-07/E-11、F-03、report v1 回执；重绑没有替换 `draftData`，再次停止/继续还会固定回到 r7 与未必发生过的 A-01/T-01。
2. 创建修订没有从当前正式版本重新复制，取消也没有恢复它；`isRevisionDraft` 会覆盖 rejected / stale 的禁用判断，使被拒绝或过期的修订仍可能采纳。
3. 报告读回只有决定类型、Owner、预期和窗口，缺少理由、Evidence、替代项、限制、基线、Guardrail、结果来源和评价安排；来源使用当前绑定身份而不是当版固定身份。附件也缺少同一 analysis revision 下“当前正式决定被其他 Session 更新”的独立场景。

## 3. External Study Required

无需外部仓库、业务数据或历史聊天。当前正式包足以确定预期语义和差异。

本轮结论来自正式文档与 HTML / JS / CSS 的只读审查及事件路径推演；Reviewer 未声称完成浏览器交互、真实模型或生产实现验证。

## 4. Untestable Requirements

- Gate C / E：继续清单对应真实已发生历史；r8 授权、工具结果和草案一致，且 r8 后再次继续不退回 r7。
- Gate D / F：已编辑修订取消后从当前正式记录重新开始；拒绝和过期修订不能采纳。
- Gate E / F、AC-13：同 revision 的当前决定冲突，以及各历史版本的完整依据和预期读回。

## 5. Correctly Deferred

私有类型、接口、持久化 schema、事务机制、Adapter 内部分解、包版本、普通性能参数、离线夹具和证据目录可继续交给工程。具体 Provider、Model 和资源数值可在真实调用前确定；必需项缺失即禁止开始的语义已闭合。本轮不要求 OpenSpec、生产实现或新的工程治理机制。

## 6. Required Plan Additions

最小修订仍集中在可点击附件：

1. 授权、实际合成回执和草案共同使用当前绑定 revision；继续只列出确实存在且明确选择的历史，并覆盖 r8 后停止/继续。
2. 创建修订时从当前正式版本复制，取消后丢弃该修订；拒绝、过期必须优先禁用采纳。
3. 保存并读回每版正式记录的完整确认字段及固定来源身份；补齐同 revision 下当前决定更新导致另一草案过期的场景。
4. 复核 Gate C–F，再交 fresh Reviewer；保留 Review 001、002 的历史结论。

## 7. Verdict

`NEEDS_CLARIFICATION`

产品文字语义与权限停止线已基本完整，但 R5-B / R5-C 的可点击合同仍与其冲突，尚不足以支持完整 UI Gate 和 Product Input Freeze。模型调用的 Change 限定不是阻塞项。
