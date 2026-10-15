# R3 Contract Change Request 001

## Summary

用户要求具体方案，主方案与逐项台账唯一入口：[r3-preparation-contract-proposal-001.md](r3-preparation-contract-proposal-001.md)。本记录是影响决定，不复制第二份结构合同。

## Current Contract

Framework/Context、Clarification、最终RevisionPreview、finishChild后的ChildResult各自拥有已确认原件。框架前/准备中的唯一MODEL解释没有同等持久原件；旧checkpoint required IR与finish_result完整值仍由真实消费者读取。SOURCE/hash/技术receipt不能替代正文。

## Proposed Contract

D1～D5建议在现Task JSON增加一个具名、类型封闭的准备快照数组；保存草稿不表示正式采纳/计算/核验或恢复；D6/D7继续保留旧控制字段。具体shape、失败关闭和依赖返回点在主方案。

## Reason and Evidence

本轮现合同两错误的因果RED/GREEN及484受影响回归在r3-contract-review001证据根；框架前大唯一语义仍有原guard拒绝，不能认为已修复所有大正文问题。

## Affected Domains

| Domain | Impact |
|---|---|
| OpenAnalysis Application/Port/Store | 新业务Task正文载体和保存确认（仅建议） |
| Proposal Workspace | 草稿与最终Preview的生命周期不等同，采纳入口保留 |
| Pi Adapter/material policy | 复用固定SDK/read，若实施需新固定产品策略身份；不改SDK |
| ChildResult/旧checkpoint | 原件和旧恢复保留，不新增通用恢复或自动迁移 |
| Core/Data/Ontology/Knowledge/Memory/外部服务 | 无跨Base结构/权限/执行扩展 |

## Compatibility

旧1.0～1.3无字段原样；新载体仅显式新任务，严格验证；无历史回填/自动迁移。回滚保留新JSON与消费/UNKNOWN，旧版不能自动resume新状态。字段退役及真实旧Task恢复另授权。

## Validation

正/负/联合验证见主方案D8；新机制断言全部待验证。已执行484及类型只覆盖当前旧合同与两处纠正，不是新准备快照集成完成。

## Boundary Classification

新增持久字段/版本/来源责任及读取能力属于物化业务合同变化，需整体用户决定；两处saved/读取真实性纠正已在原批准边界内推进，无新结构或产品流程。

## Engineering Controller Decision

status: deferred。推荐主方案A，结构实施待整体决定；旧控制字段继续有效。没有风险豁免，不停止不依赖该合同的原授权事项。

## User Decision, If Boundary-changing

status: deferred。仅本轮方案编制已授权，D1～D8建议尚未整体批准；不将“继续工程”解释为新准备快照持久合同采用。
