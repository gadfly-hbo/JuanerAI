# P0-only 局部去重：正式主线交付

2026-10-13 用户批准从 candidate-005 撤回 P1、形成 candidate-006，并在后续明确授权本项 P0 提交、工作分支推送、PR、适用验证和 required CI 通过后的 squash 合并及安全 main 同步。分支 `work/mac-mini/browser-readonly-sync-pilot`；原候选及 fetch 固定目标基线均为 `4df7604621fff2c8ec27281d59cf4a788deae47b`，没有目标基线增量。

当前范围仅共享三处相同上传 envelope 检查/解码和两个客户端 GET JSON 叶函数，附必要测试与本包追踪。保持 HEAD 原生 DOM、列表、任务切换、1500ms 轮询及写请求机制。没有新业务能力、UI、公开契约或持久格式变化，稳定能力覆盖增量为零。P1 依赖/接线/构建/元组保持撤回。

candidate-005 试点规格、失败、UNKNOWN、诊断与原 PASS，以及 candidate-006/PASS 均为不改的本机历史证据，不纳入本 P0 PR。原3→8来自列表/协作/请求3、额外状态1、前后权限/项目4；并发状态读取局部2→1不足以证明整体提效，故不追认性能提升。

允许路径：`apps/browser/client.mjs`、`quick-analysis-client.mjs`、`local-server.ts`、`read-json.mjs`；现有 browser-workbench-ui-check fixture、browser-client/node-entry/open-analysis-http 测试及 read-json 单测；本目录规格、设计、任务和验证。禁止扩大重构、产品行为/UI/业务合同/持久化、Runtime/模型、流程/CI/主机变化。产品工作树、索引、依赖、配置、服务和数据均只保护；不复制或整合 WIP。

Mini 唯一任务证据根标签 `browser-readonly-sync-pilot` 下保留全部005/006材料，另记 publication-007、candidate-007 与独立复核；实际设备路径写在设备本地交付回读中，不把机器路径或原始日志入 Git。本次完整 PR 只显式暂存14个 P0 路径，旧试点5个未跟踪文档不提交。

回退为另一个经审核的普通 PR 取消本次 P0：还原三个修改的 browser 源、移除 helper 及其静态接线/相关测试，无数据迁移，不默认重启P1。任何在研产品采用仍须其交付节点确认，本次 main 集成不迫使采用。
