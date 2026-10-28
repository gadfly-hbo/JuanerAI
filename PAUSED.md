# JuanerAI 暂停状态 — 2026-10-28

用户决定停止进一步修复，将最新产品保存到 GitHub main，随后清除 Mac mini 与
MacBook 的 JuanerAI 仓库、项目文件、历史证据、Task 数据库、未结算／UNKNOWN
记录及旧 WIP；这些本地材料不再备份。此决定只改变保留方式，不把失败改成通过，
也不证明未知效果已经结算。独立 SDK、插件项目及系统凭据不属于清理范围。

## 保存的对象

- 原工程分支：`work/mac-mini/agent-host-simplification`。
- 原 HEAD：`50c2f3e7bc167cd645b6abf6e4d1a92d1d0ec3d1`；它不是最新产品的完整身份。
- 最新产品：`Mini-report-evidence-recheck-local001 / attempt3`，包含累计已授权 WIP。
- 原候选源码清单：2322 文件，SHA256
  `6787557f9bf86c98ccf13c63f43577f25e3dc5ca81c32ce36415f12520ece676`。
- 原源码归档：45901015 bytes，SHA256
  `c2b5f294d04038194b72e0782d7bf253d01c8a6f0c78302ffc480f8a3eb14e05`。
- 本次集成同时保留 main `72570c730067895f01704d620d839e98573de9ed`
  已有的 Blueprint v4.3、PR114 分工与其他规划／治理更新。
- 最终可恢复对象是本文件所属的 Git 提交／tree，不是已删除的设备本地归档。

固定依赖为 `pi-agent-runtime@0.6.0-newarch.1-corrections.2`：182898 bytes，
SHA256 `8b8fa686b9e978ba28ef3ce4eec9a49085cc32ef4f28cd067bcb2307ce09e6bd`。
包在 `vendor/pi-agent-runtime/` 内，由 `package.json` 和 `package-lock.json`
固定。不得把版本字符串当作安装或运行采用证明。本次没有修改 SDK。

## 产品实际停止点

当前主路径为对话式需求与三核心确认、获准资料上的自主计算、先产报保存，随后由
独立上下文子 Agent 执行数字复算、方法对照、结论／策略审查及必要修订。

最新真实试用结果为 **FAIL_SAFE_STOP**：

- 多轮需求、主 Agent 的读取／Bash／写入、R0 保存已经执行。
- 独立来源复算、方法对照及 R0 结论／策略审查已经执行，R1 已保存。
- R1 数字复核子 Agent 返回后，父级 `review_calculation` 为
  `TOOL_FAILED / UNKNOWN`；9 项数字仍未核验，部分数字与证据关联不正确。
- R1 全文重审只准备了输入，没有准入执行，状态为 **NOT_RUN**。
- 快速／专业视图、导出及被动重开读回了同一 R1；重开未发出新请求。
- 该次试用记录 133 次官方 DeepSeek 物理请求，HTTP 200／COMPLETE；
  196 次工具调用；已记录输入 8198322、输出 100754 tokens、资源计数 329。
  输出预留为 0，不等于所有工具效果已确定；UNKNOWN 不因此消失。
  费用 UNKNOWN。该快照不能与较早累计记录相加。

因此，HTTP 200、报告可读、离线验证或独立局部 PASS，均不代表全链路、真实模型
质量、QS04、完整产品或阶段验收通过。旧失败不会因暂停快照而关闭。

## 验证与边界

暂停前最近一次受影响验证为 213 PASS、TypeScript exit 0、正常构建合同 1 PASS；
独立只读复核为 52 PASS。这些只对应原候选的限定离线范围，不能代替本次集成
检查或尚未通过的真实场景。当前发布检查结果记录在本次 PR；未运行项不记 PASS。
本地原始日志按用户决定删除后，这里只保留摘要，不再声称原始日志可取回。

本次为暂停保存，不是 Engineering Acceptance、Product Acceptance、Tag、Release、
npm／应用发行或生产切换。现有 OpenSpec 未完成项保持未完成；不为归档强行关闭。
不再修代码、调用 Provider、恢复旧 Task、清算或重试未知效果。

## 日后恢复

重新克隆 GitHub main，固定实际提交和 tree；检查 vendor 包摘要与 lock，再按仓库
说明准备本地依赖和定向凭据。GitHub 不包含已删除的运行数据库、会话、原始日志、
凭据或旧未公开 WIP；旧 Task 无法由本快照恢复。不要据此自动运行服务或调用模型。

恢复开发／真实测试需要用户新的明确指令，并从上述已知缺口与当时实际环境开始。
此前无限费用授权及循环测试指令不再是恢复许可。
