# Change007 · 技术架构集中评估请求（可转发）

**用途：只读静态评估，不是开发／跨session消息授权。由用户选择转发。**

请评估当前产品候选[proposal-v0.1](proposal-v0.1.md)、[增量UI](ui-contract-v0.1.md)、[决定包](decisions.md)和[基线读回](baseline-readback.md)。代码固定基线 `8dfc50528d342028ae1fcc3d0911ebca4a213e95` / tree `d622004e2f80c3b5127c169cc346a05e16c8d7c2`；006已交付归档。007不是N07、不新增N21；目标是证据→结论→策略的独立审查、必要修订和真实交付消费。

产品方向和视觉不重开选型：延续三核心、Product Core→Application→Port→Adapter→Profile、Pi类型Adapter私有和现有SDK0.4.3；不复制Harness。具体普通实现由Mini负责，本请求不预冻公共schema、工具名、代码路径或部署。不继承006的一次性角色／风险例外。

请按以下七项集中回答“最小可行方案／可复用／需新增／风险与验证／是否需用户决定”，不要创建OpenSpec、安装、调用Provider、读取真实资料、启动服务或修改工程状态：

1. **独立评估的真实性**：如何分离生成与评估的输入、职责和上下文，又让评估实际看到当前证据／反证、口径和条件而非生成者自述？同模型可用但不等于独立事实；哪些判断须确定性核验或外部证据，哪些只能带模型判断边界？
2. **现有用途与工具**：复用Subagent调查是否足够，还是需业务审查用途／消费者？现有 `report_edit` 工具为空，不能暗加执行权。仅只读证据快照够哪些任务，何种缺口须调用已有获准工具？最小工具、资料子集及提示注入／任意路径防护如何沿用？不借机另造Runtime。
3. **身份与失效**：任务、证据／核验、Context/Binding／实际IR、报告、主张、选项和约束如何精确绑定？上游改变仅失效受影响链，依赖不明不能误复用。纯排版与实质变更怎样区别，旧保存记录／导出兼容怎么保持？
4. **交付与人审消费者**：四判定和审查不可用如何真实限制摘要／正文／推荐／下载版／人审输入？数字partial独立保留。整体Closure／Decision／Expected提交不增前台审批，用户判断不改审查资格；现有存储与正式提交边界最小接入在哪里？
5. **授权与实际资源**：当前主备模型／接收方、材料和任务权限是否覆盖审查及子集？不能每Attempt重批，也不能由“配置有key”推定额外用途／资料许可。未覆盖部分列精确缺口；暂不设累计封顶、持久计量、一次额外物理请求（备用共用）、停止／迟到／UNKNOWN不变。
6. **有界纠错与故障**：候选D3初审→最多一次合并修订→一次重审怎样与现有多轮Agent路线自由、物理重试、根停止、保存／重开、服务重启兼容？意见冲突不能多数投票或换Agent直到通过。无法完成时保留有效事实但不交付假认证，哪些结果须持久化后才可读回？
7. **合同／共享包影响**：必要的业务Port／持久记录／公开兼容变化、SDK能复用与不能复用的部分，是否需工程合同影响决定？无产品／安全扩展由Mini在原边界设计；涉及额外外发、权限、新方法或承诺改变集中交用户。区分静态可行、待运行验证、工程就绪，不以本评估代替产品／UI批准。

定向代码入口：`profiles/personal/open-analysis.ts`；`packages/application/open-analysis.ts`报告链；`packages/product-core/open-analysis-report-review.ts`、`open-analysis-numeric-report.ts`、`open-analysis-delegation-instruction.ts`、`open-member-review.ts`、`case-assistant.ts`；`packages/ports/open-analysis-runtime.ts`；`adapters/agent-pi/open-analysis.ts`。实际SDK固定依赖见`package.json`／lock。006归档、能力图及保护项见事实附件，不重新验收006。

适用规则：[数据权威](../../../architecture/data-authority.md)、[安全](../../../architecture/security-boundaries.md)、[资产架构](../../../architecture/asset-and-model-capability-architecture.md)、[ADR0003](../../../adr/0003-business-runtime-port-strategy.md)、[唯一执行政策](../../../governance/product-change-execution-policy.md)及共享 `pi-agent-runtime/docs/AGENT-RUNTIME.md`。共享原文须读取可访问正式对应材料；版本更新不自动授权升级或新增调用。

回传集中评估即可，不自动唤醒Mini、不启动007、不重写006历史。用户尚未确认的D1～D3按候选评估，不称已冻结。
