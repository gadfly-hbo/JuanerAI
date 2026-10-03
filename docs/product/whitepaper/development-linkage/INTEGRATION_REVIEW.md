# 正式开发联动：待集成文档变更

日期：2026-09-09。范围为正式仓库 14 个文档/快照文件；已准备和检查，未提交、推送或合并。原开发 checkout 的分支、HEAD 与已有 tracked 修改保持原样。

## 可审查结果

- [正式侧联动规则](/private/tmp/JuanerAI-whitepaper-development-linkage/docs/governance/whitepaper-development-linkage.md)
- [正式侧快照入口](/private/tmp/JuanerAI-whitepaper-development-linkage/docs/product/whitepaper/README.md)
- [正式侧 Agent 入口](/private/tmp/JuanerAI-whitepaper-development-linkage/AGENTS.md)
- [输入模板](/private/tmp/JuanerAI-whitepaper-development-linkage/docs/templates/DOMAIN_HANDOFF.template.md) / [交付反馈模板](/private/tmp/JuanerAI-whitepaper-development-linkage/docs/templates/HANDOFF_BACK.template.md)
- [精确 14 文件清单、SHA 与检查结果](PREPARED_CHANGE.json) / [可恢复变更包](juanerai-documentation-change.zip)

## 改变什么

产品规划、相关规范变更和验收时，Controller 读取冻结白皮书版本并登记采用范围。正式 Requirement/AC 与具体实现证据逐项可追溯，交付反馈返回 research 更新唯一主稿。另一台机器可通过 Git 获得相同字节的快照，不依赖 MacBook 路径。

正式 OpenSpec、CONTEXT 术语、权限、Model Pack 合同和现有生命周期继续保持权威；没有新增产品行为或自动启用 Runtime。十三张缺图明确登记，不伪称完整出版包。规则由 Controller 在相关 Gate 执行，不宣称已加入 CI 自动阻断。

## 验证

- 14 文件写入范围精确匹配，包含两份治理/快照入口文档、四份现有入口/模板修改、一份白皮书、一份 manifest 和六张 PNG。
- 主稿与冻结快照字节和 SHA 一致；六图逐一匹配，十三个缺失引用单独记录。
- 14 份入口/相关文档的围栏与 62 个本地链接通过；13 个正式计划/规范/合同/代码入口在记录的 base 中存在。
- 两仓库 scoped `git diff --check` 通过，恢复 ZIP CRC 与 payload 字节一致；原开发分支及未提交工作未改变。
- 首次范围检查遇到 Git 对中文文件名的转义输出，改用 NUL 分隔路径后复核通过；未因此修改产品文件。
- 文档变更未运行生产测试；没有声称新的产品验证或验收。

## 集成下一步

用户于 2026-09-09 决定：先保持本变更待集成，选择当前开发的合适检查点再合并。当前停止提交、推送、PR 创建和合并，不设后台监控。后续相关会话确认当前开发完成一轮验收/合并或用户指定稳定检查点后，再恢复集成：先只读刷新远端、核对 main 变化和冲突，再只提交本次 14 个文件；不包含原分支的 Coordinator 修改或 project-control。经差异与检查复核后按正常 PR 流程集成。若当前分支命名与目标仓库发布检查要求不符，调整本次独立文档分支命名，不修改仓库 Git 政策。合并后记录 PR、完整合并 SHA 和正式采用状态，更新 research 的集成状态与恢复卡。

本轮 base 为本地 main / 缓存 origin/main `1fe517a1b820ae4bae1e5dede6a8f69a6bffabbd`，没有联网刷新；当前不声称远端或其他设备已生效。
