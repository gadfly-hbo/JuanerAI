# Change 003 Git 发布与指定会话派发授权记录 v1.0

## 当前用户指令与适用范围

日期：2026-10-01。用户在本 MacBook 产品规划会话中，在正式审核通过并收到本地冻结完成／等待发布交接的回复后，明确指令：

> 提交、推送或派发 Mac mini，macmini侧已经创建好第三个change的新session change-003

本次授权用于发布已批准的 [Blueprint v3.0／Change 003 冻结产品输入](xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md)，按仓库 Git 工作流提交、推送、PR 审查／集成，并向用户已创建的指定会话发送固定版本交接。它更新此前“尚未授予发布／发送权限”的停止线，不倒写冻结时的历史状态。

本次不改产品范围、UI 标准、工具／数据权限、资源或真实 Provider 调用边界；MacBook 不写工程 OpenSpec／测试／生产代码或接管 Mini 的工程状态。接收方先完成固定版本读回与 Engineering Intake，原“等我通知”不能仅凭消息来源猜成无限开发授权；若工程启动授权仍需直接核实，由 Mini 在指定会话向用户确认。派发消息、接收和开始工程是不同证据。

## 唯一接收目标

- 会话标题：`change-003`（直接用户指定并经会话列表核实）。
- thread ID：`01a0f481-89c1-7702-9597-62cae040f1a5`。
- host ID：`remote-control:env_e_6a101fb533188323aed8e85d6bb2904a`。
- 目标仓库：`/Users/bendandebaba/JuanerAI`。
- 检查时状态：会话空闲，只有用户预建并要求等待开发需求／通知的消息；无工程已启动证据。

不新建、不迁移、不向 `change-001` 或 `change-002` 派发。源工作分支保持 `work/macbook/xanthil-outcome-follow-up-product-plan`，只是保留已有规划分支名称，不恢复顺延的结果回访为当前选题。

## 发布、读回与停止线

发布必须保留原冻结正文、UI 可点击字节及历史审查；包含 Blueprint／计划／UI、新旧身份核对、研究采用差异、截图和必要规则入口。对合成可点击执行附件使用提交规则要求的完整索引及真实分支／HEAD／文件身份核对，不能将它伪称纯非执行文档以绕过检查。

本记录写入时 Git 发布和消息派发尚未发生。实际 PR、发布 commit／tree、检查结果和接收情况由本源会话最终交付及接收方实际读回证明，不在提交前预填成功。基础 HEAD 是 `e3fe084a6d877ac5ebec6dabd603781d0edd78e4`，不是新包发布身份。

接收者须逐项阅读规划入口、批准及冻结记录、新蓝图／正式计划／UI 原文、Review 002、研究采用说明、可点击 README 与适用架构／工程权威，再返回实际设备、会话、仓库、分支、HEAD／tree、工作树、精确输入 SHA、规则／角色加载和下一允许动作。不要替换旧批准合同，不在 MacBook 上开发；未知、脏工作树、身份不符或权限缺失先停止受影响动作并向用户确认。

## 提交前完整索引失败与精确返回点

2026-10-01 实际执行两次 `mode=full / persistence=false`，两次均以当前真实工作树为 `repo_path`，分别使用 JuanerAI 专用和默认可用 MCP 入口。未降级 mode、跳过文件、使用旧图或更换工作区。

| 入口 | 隔离索引名 | 实际结果 |
| --- | --- | --- |
| `mcp__codebase_memory_juanerai__index_repository` | `JuanerAI-change003-publication-20261001` | `status=error; outcome=exit_nonzero; isError=true` |
| `mcp__codebase_memory__index_repository` | `JuanerAI-change003-publication-20261001-default-server` | 同上 |

两入口的完整返回文本均为：

```json
{"status":"error","outcome":"exit_nonzero","hint":"Indexing worker crashed on a file. The crash was contained (the server survived). Re-run to retry; a future release isolates the culprit file.","repo_path":"/Users/huangbo/.codex/worktrees/e1d5/JuanerAI"}
```

索引前后分支／HEAD、porcelain、tracked／staged diff 及全部 37 个待提交文件的 bytes／SHA 指纹完全相同；索引未改变工作树。待提交范围仅四个必要规则入口和 `docs/planning/2026-09-30/`；staged diff 为 0。重跑 `git diff --check`、静态 UI JS `node --check` 均退出 0，26 项冻结身份读回全部匹配。此前 Development-Readiness／UI Gate／批准一致性 PASS 不受工具崩溃倒写。

依 `git-commit-push` 的实际差异分类，本包含执行性合成 UI 附件，不能自动套用纯非执行文档免索引路径。失败发生时停在 **最终暂存之前**；没有提交、推送、PR、合并或派发 Mini。待用户明确授予本次限定的完整索引例外，或工具恢复并通过正确分支／文件身份核对后，再从最终验证与暂存继续；这不是产品／UI NEEDS_FIX。

## 用户批准的本次索引例外

2026-10-01，主任务明确报告两个完整索引入口崩溃，并提出：“仅本次发布的完整索引例外，用逐文件 diff、指纹核对、独立复核及离线 UI 检查替代，不修改长期规则”；用户直接回复 **“批准”**。

据此解除此次提交前的索引失败停止线，继续原授权的提交、推送、PR 集成及向 `change-003` 派发。本次仍诚实标记完整索引失败，不填写图新鲜性／Branch 或文件节点 PASS。例外仅适用于这个已冻结产品规划与合成 UI 包，不适用于后续 Mini 工程代码、依赖、数据／Runtime／Schema 或其他 Change，不修改技能、治理规则或已批准产品要求。

替代检查包括全部待提交路径及实际内容核对、分支／HEAD／文件指纹在检查前后不变、精确冻结附件与历史资产读回、Markdown／HTML／CSS 本地引用、合成 JS 语法与已保存离线交互证据、独立只读复核和 staged diff 范围确认。正式工程及真实 Provider 的验证和授权要求不被豁免。

## 发布前独立复核及执行检查

只读支持 Agent `/root/change003_approval_consistency_001`（`gpt-6-astra / high`）返回 **PASS**，无实质 blocker；复核结束时 staged 为空，没有写文件或执行 Git／模型／业务操作。实际 root、分支、基础 HEAD 与本记录一致。

- 37 个路径全部核对：24 个文本／执行性合成 UI 文件、13 张 JPEG；仅四个必要规则入口和本规划目录，无特殊文件、生产代码、依赖、业务数据或敏感凭证混入。
- 原始截图角色及历史失败保留，完整 JS／HTML／CSS 为单一 synthetic localStorage、同源窗口及 `connect-src 'none'`；无 Provider／业务接口、网络请求、宿主或文件访问能力。
- 26 项冻结附件均再次读回匹配，原正文及保护资产不变。Reviewer 实际检查的 227 项本地引用存在，JS 语法和 `git diff --check` 无错误；此数按 Reviewer 的引用提取口径记录。
- 主任务另外检查 24 个文本的 226 项本地引用、尾空白／凭证模式、JSON、三份正文精确逆向重建、26 项冻结身份及三项历史资产，全部通过；JS 语法和 `git diff --check` 退出 0。
- 例外仅限当前发布包，长期索引规则、Mini 工程、Provider 授权均未豁免；发布、接收与工程启动分别记录。

本节由主任务按实际 Reviewer 返回和工具输出保存。追加仅为检查证据；最终指纹复算、显式暂存、完整 staged diff／对象内容身份、实际发布与派发结果仍由主任务继续核对，不在此预填未来成功。
