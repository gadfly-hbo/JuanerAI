# Xanthil Case Assistant Development-Readiness Review 004

## 1. What I Would Build

构建独立的快速模式 Case Assistant，绑定具有 accepted Finding、有效 Decision Closure 和 final report 的 Completed revision。用户确认精确外发内容、只读工具与预算后，Agent 进行受约束多轮协作，形成 Decision Record / Expected Outcome 草案；用户采纳后才追加正式记录和报告版本。停止、拒绝、失败及过期不产生正式写入，继续创建新 Attempt，Fork / Subagent 保持 Preview。

依据：产品计划 §5.1、§5.4–5.6、§6.2–6.3。

Blueprint §6.2 的模型调用例外被明确限定到本 Change；真实 Provider、数据、费用仍需另行授权。产品计划审查、用户 UI Gate、Product Input Freeze 和 Engineering Intake 仍有独立停止线，未发现自动扩大执行权限。

## 2. Required Guessing

R1–R4、R6 的文字缺口保持关闭：

- 专业六阶段与三类一次辅助沿用原合同。
- 准入、不可变 Completed revision、追加版本、取消与多 Session 冲突语义明确。
- 自由文本、精确 subset、历史外发及旧 revision 排除规则明确。
- 等待预算、停止、退出与超时语义明确。
- 首切片验收已绑定正式记录，且包含用户 Product Acceptance PASS。

Review 003 的修正结果：

1. **r8 上下文和继续历史已实质修正。** 草案、授权与实际回执按绑定 revision 生成；继续从实际消息、实际完成回执构造清单，没有固定制造 A-01/T-01。
2. **修订复制、取消恢复和拒绝/过期优先禁用已修正。** 创建与取消均复制当前正式记录；`stale`、`rejected` 不再被修订标记绕过。
3. **各版正式内容及固定 revision 读回已补齐；同 revision 冲突场景仍有一个承重不一致：**
   - 点击“当前决定版本变化”会先重置记录，只设置 `currentDecisionVersion = 'DR-002'`，没有建立该已存在的正式版本及报告历史。
   - 点击“基于当前正式决定重新开始”后，只生成默认草案；后续采纳按空的 `formalVersions.length + 2` 再创建 **DR-002 / EO-002 / v2**，而非接续已声明存在的当前决定。
   - 因此该场景能展示禁用，却不能一致展示“当前正式决定已更新 → 重基 → 追加下一版本并保留历史”。

## 3. External Study Required

无需外部仓库、业务数据或历史聊天。缺口可以在正式附件内修正。

本轮依据为文档及 HTML / JavaScript 事件路径只读审查。Reviewer 未完成浏览器交互验证；未修改文件、创建测试或调用真实模型。

## 4. Untestable Requirements

同 revision 当前决定冲突的完整恢复路径尚不能提供一致的 Gate E / F、AC-13 证据：界面声明另一个 Session 已采纳 DR-002，但后续历史缺少该记录，再次采纳重复使用其身份。

其余 Review 003 指出的 r8 回执/草案一致性、停止继续、修订取消恢复及拒绝/过期禁用，源代码事件路径已具备对应行为；这不替代用户 UI Gate。

## 5. Correctly Deferred

私有类型、持久化 schema、事务实现、Adapter 内部分解、包版本、普通性能参数、离线夹具和证据目录可以继续交给工程。具体 Provider / Model 和资源数值可在真实调用前确定，缺失即禁止开始的产品语义已闭合。

## 6. Required Plan Additions

只需修正同 revision 冲突的合成状态与恢复路径：

- 场景声明“另一个 Session 已采纳”时，同时建立可读的当前正式记录、Expected Outcome 和报告版本。
- 新 Attempt 以该当前正式版本为基线；再次采纳追加下一版本，并保留先前版本供完整读回。
- 用该路径检查 Gate E → F；无需新增产品范围或工程合同。

非阻塞改进：正式历史读回可同时显示每版采纳人、确认时间。

## 7. Verdict

`NEEDS_CLARIFICATION`

本轮大部分修正已关闭；剩余阻塞仅为同 revision 当前决定冲突后的版本接续。文字语义和权限停止线完整，不需要扩大规划或提前编写 OpenSpec。

被审 `app.js` SHA-256：`64f1cfc18ba8d0b09615841d6e99ade045a7bf8c77a8bd6568c8ac3783c0d10c`。
