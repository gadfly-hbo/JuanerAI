# Change 003 Development-Readiness Review 001

日期：2026-10-01（跨日审查）；独立支持 Agent `change003_plan_readiness_001`；`gpt-6-astra / high`。新鲜无作者上下文，只读，无工程权。本文由 Product Manager 忠实记录返回结论，不是作者自评。

审查输入：正式产品计划 v1.0、增量 UI Contract v1.0、research 采用说明、范围／路线记录、Blueprint v3 候选、可点击附件及其明确引用的本仓库权威与接受记录。审查时自身历史选择修订尚未加入；不以修正后的文件冒充本轮输入。未访问外部 research、未写文件、未操作浏览器、未调用模型。

## 1. What I Would Build

在有效根 Case Assistant 增加受控 Fork 与单层单个 Subagent。Fork 独立授权、人工选成功结果回流；Subagent 有界检查与追问、成功自动回流。全局一个模型任务，Waiting 占用。回流、材料采纳和正式发布分开，父继续新授权。过期、失败、停止、迟到、关闭、重开不自动运行或发布。两条路径完整验收后返回结果回访。

## 2. Required Guessing

**B1：Fork 跨 Attempt 的上下文延续未完整落实。** FS-R04 承诺独立多轮及新 Attempt，但正文明确的历史选择主要是父分叉历史；附件 `authorize()` 固定只从 `c.inherit` 取父历史，正文明确仅带继承项和当前任务文本，没有自身历史选择。

反例：成功保存 R1 后问“展开上一条结果的第二点”，用户不能选择、查看和授权 R1。实施者会自行发明这是无关联重新开始，还是增加自身消息／回执／结果选择；涉及可见行为和外发范围，不是私有工程细节。其余已审查准入、顺序、成功、人工处理、父继续、来源和生命周期无另列实质缺口。

## 3. External Study Required

无。正式包引用的现行 REQ-CA-002／003 足以提供新 Attempt 和选定历史原则，不能用未给出的作者解释救缺口。

## 4. Untestable Requirements

B1 使真实跨 Attempt 多轮缺少确定预期：首次成功结果如何选入下一 Attempt、未选历史如何排除、新结果如何保留旧版本及授权关系。其余可派生正例／拒绝／故障终点。原生、事务、崩溃和 Adapter 证据属于后续工程，不把待用户 UI Gate 当缺陷。

## 5. Correctly Deferred

Schema／API、事务／幂等、窗口通信、资源机制、限额、测试及命令归工程。真实 Provider、结果回访、跨 Case 学习、第二 Runtime、递归／并行及行动合理延期或禁止。

## 6. Required Plan Additions

B1 最小修订：FS-R02／04 写明自身保存消息、只读回执及成功结果逐项选择／精确内容来源／未选排除，父快照不更新，继续重查资格；UI-FS-05／07 增加对应选择；AC-FS-04 加 R1 显式选择→R2、未选不外发及旧版本保留场景。

非阻断建议：区分新材料／来源／限额扩权与原授权内 Waiting 逐条确认可见回答，引用现行 later Send。

## 7. Verdict

**NEEDS_CLARIFICATION**，仅 B1 阻断。修正正文和 UI 后须新 Reviewer，本 Reviewer 不成为修正作者或二次审查者。

历史保留：作者随后补上述选择和 later Send 说明，UI 提供默认不选及精确预览；本结论不改为 PASS，修正由 Review 002 独立判断。
