# Xanthil Case 决策助手 Product Plan Development-Readiness Review 002

- 日期：2026-09-29
- Reviewer：fresh independent read-only support Agent，implementation-worker perspective
- 被审候选：产品计划状态 `REVISION_01_AFTER_DEVELOPMENT_READINESS_REVIEW_001` 及其增量/可点击 UI Contract
- 权限：只读；未创建 OpenSpec、测试或生产代码，未调用真实模型或业务数据

## 1. What I Would Build

构建一个绑定专业 Case 的独立快速模式 Case Assistant。来源须为具有 accepted Finding、有效 Decision Closure 和 final report 的 Completed revision。用户确认模型、精确数据范围、外发历史、工具和预算后，Agent 进行有限多轮协作，生成待采纳的 Decision Record 与 Expected Outcome。用户采纳通过确定性命令追加正式记录和报告版本，原分析 revision 保留；停止、失败、拒绝或来源过期不产生正式写入。继续创建新 Attempt，Fork / Subagent 保持 Preview。

Blueprint v2.0 §6.2 原本排除新模型调用；本计划把后续用户决定诚实记录为仅限本 Change 的范围修订，保留纵切顺序，并仍要求真实 Provider、数据及费用另行授权。未发现普遍解锁模型或其他 Preview 能力的授权。

## 2. Required Guessing

- R1 已关闭：三类一次辅助和六阶段名称已恢复。
- R2 文字语义已关闭：准入、追加版本、多 Session 草案冲突、取消编辑、结果来源及 Owner 已明确。
- R3 文字语义已关闭：逐字自由文本、精确 subset、历史逐项授权及旧 revision 排除规则已明确。
- R4 已关闭：等待期间执行预算暂停、独立等待截止、停止及退出终结规则明确。
- R6 已关闭：计划绑定首切片 acceptance / verification，其记录包含用户 Product Acceptance PASS。
- R5 尚未关闭，可点击附件与文字合同仍有三个承重差异：
  1. 编辑保存忽略修改后的理由与 Guardrail，表单没有覆盖基线、对象/指标、采用证据、替代项和限制等正式字段；三个决定分支共用同一必填集，取消后重开也未证明恢复已保存字段。
  2. `继续` 只显示通用历史类别，实际授权仍固定为初始文本、E-07/E-11、F-03 和 report v1；revision 重绑后清单也没有切到新来源，无法检查旧 revision 排除。
  3. 专业模式正式卡片使用固定的触达试验、责任人与窗口；采纳没有按用户修改回流；报告历史不可打开，也没有从当前正式记录创建并取消修订的入口。

## 3. External Study Required

无需外部仓库或产品研究。正式包和已列明的权威文档足以确定缺口。

本结论来自文档、附件 HTML / JS / CSS 和留存截图的只读审查；Reviewer 未声称完成浏览器交互验证或真实模型验证。

## 4. Untestable Requirements

当前附件不能完整执行：

- Gate C：继续授权显示实际外发历史；
- Gate D：所有正式字段编辑、三个分支完整性和取消后恢复；
- Gate E：重新绑定后的来源与精确内容对应关系；
- Gate F：采纳内容准确回流、旧报告可读、创建并取消决定修订。

## 5. Correctly Deferred

私有类型、接口名、持久化 schema、事务机制、Pi Adapter 内部分解、包版本、普通性能参数、离线夹具和证据目录可以继续交给工程。具体 Provider、Model 和数值上限可在真实调用前确定，缺失时禁止开始的产品语义已经闭合。无需为本 Gate 预写 OpenSpec 或生产实现。

## 6. Required Plan Additions

最小修订集中在附件，不扩展产品范围：

1. 完成草案字段保存、取消恢复和三个决定分支校验，使卡片准确呈现用户已确认内容。
2. 为继续和 revision 重绑显示具体的合成消息、回执、报告及数据身份，让旧来源排除和新来源选择可直接检查。
3. 让采纳后的专业卡片与用户确认内容一致；补齐正式记录修订/取消、旧报告与版本内容读回，以及当前决定变化导致旧草案过期的可点击场景。

修订后应重跑 Gate C–F，并交新的 Reviewer；不能以成功提示文字替代交互。

## 7. Verdict

`NEEDS_CLARIFICATION`

R1、R2、R3、R4、R6 的主要文字缺口已关闭；R5 仍使正式产品包内部不一致，尚不足以支持完整 UI Gate 和 Product Input Freeze。模型调用修订的 Change 边界不是本轮阻塞项。
