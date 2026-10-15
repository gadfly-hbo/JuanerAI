# 冻结方案 Git 发布记录

2026-10-15（Asia/Shanghai）。用户在本任务授权：“把这份冻结的完整接入方案按仓库流程提交、推送并通过 PR 合并保存，保留所有审查和未验证项，暂不开发。”

## 发布对象和后续效力

发布 [完整冻结方案 v1.0](frozen-plan-v1.0.md)、[冻结记录](freeze-v1.0.md)、[冻结清单](frozen-inputs-v1.0.json)、批准原件、可点击审核附件及全部历史审查。冻结清单 SHA-256 为 `c9e0bc202cf26233cd8915eecc59e654e1aa79239bcd2502a1e0e60e37471d97`，本次不修改其内容或所绑定文件。

冻结文件中的“本地未提交／未获 Git 发布授权”记录的是冻结时点；本次授权仅推进这些材料的 Git 保存，由本记录及最终 GitHub PR/merge 事实提供后续效力。既有原件、候选、审查、哈希与 NOT_RUN 不回写为新历史；冻结本身的范围与效力不变。

发布范围仅 `docs/planning/2026-10-15/report-studio-minimal-integration/`。新增此记录及发布一致性审查，不触及产品代码、依赖、OpenSpec、运行配置、治理规则或其他任务。离线 HTML/CSS/JS 是已批准的 UI 审核附件，不激活产品功能。

## 检查与限制

本地发布检查覆盖：冻结包与引用文件字节身份、汇编与批准原件的一致性、完整文件范围、语法／JSON／引用路径、明显敏感内容及 Git 差异；发布一致性审查复用既有产品就绪和用户批准，不另做产品决策。

PR 必须完成仓库实际要求的 CI 与规则核对。当前 CI 对包含 HTML/JS/CSS/JSON 的规划包会选择全量路径；不得为规避检查删附件、改工作流或把可执行附件当作纯 Markdown。Hosted CI 的结果独立记录，不代替浏览器 UI、原生安装、Keynote 编辑或真实模型验收。

保留：审查 001–003 的 NEEDS_CLARIFICATION；审查 004 的限定规划 PASS；浏览器 file:// 策略阻断；视觉、点击、键盘、响应式、干净安装、模型制作、Keynote 编辑与集成工程验收的 NOT_RUN。MacBook 独立工具正常使用仍仅为已知使用事实，不是新增集成验收。

## 交付与停止线

当前分支 `work/mac-mini/report-studio-minimal-integration-plan`，准备时 HEAD `187c356625260d84ca58bc1f5741e081e89662cd`；实际 origin/main 为已采用政策提交 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`。按授权执行提交、推送、PR、适用检查和 squash 合并，并使用仓库 sync-main 安全同步 main；不切换活动工作分支、不改另一任务的 WIP、不强制覆盖或重启服务。

本记录写入时发布办理中；最终 PR、精确提交、CI、合并及逐设备同步结果以实际回执为准，不预填成功。Mini 持久发布证据位于原证据根 `reports-factory-assessment-20261015/` 下 `publication/`，归属 Mini，本机保存不等于远程备份。

**产品输入冻结及用户 UI Gate PASS 保持；Engineering Intake 和实施继续 NOT_STARTED，暂不开发。**本次 Git 授权不增加安装、Provider、真实业务数据、主机运行、部署或产品实现权限；合并不等于产品部署或其他会话已采用。
