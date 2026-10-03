# 开发前 Demo：逐项 Session Prompt

2026-09-11。来源：[验证队列](../DEMO_VALIDATION_ROADMAP_2026-09-11.md)。共 21 份：12 项优先验证、8 项条件专项和 1 项真人试用。

用法：工作目录设为 `/Users/huangbo/Dev/Projects/research`，每次将一个文件中的完整代码块转发给一个 **Codex Controller session**，无需另外拼接通用说明。Controller 负责查重、恢复/登记、最小 Brief 和后续评审；Demo 构建仍按现行流程由用户手动转交 OpenCode。已有批准会沿用，缺少批准时仅提出一次最小 Gate。B01 的实际付费模型、B07 的企业范围和 U01 的真人参与分别核对本项授权，不随文档打包自动获批。

建议先 A01，随后按 A01–A12 顺序或实际模块时点推进。表中的依赖是路线图编号，目标 session 会查对应实际 PX 和产物；前序未完成时可以先准备后序研究，不能伪造接续。B05 为领域入口，一次只选一个域；B06 只选实际需要的一种复杂设计；U01 复用已有 Demo，不建页面。

每项 Prompt 文件为编辑源；[全部 Prompt 合集](ALL_PROMPTS.md) 是本次生成的便于复制版本，后续若修改源文件需同步重建合集。当前没有创建新 session、登记新探索、启动 Builder 或改变项目阶段。

| 编号 | 独立 Prompt | 前序路线图依赖 |
| --- | --- | --- |
| A01 | [DAME 方法资产→IR→真实计算](A01-dame-method-assets.md) | 核对既有探索即可 |
| A02 | [A/B Test Analysis 可运行最小闭环](A02-ab-test-analysis.md) | A01 |
| A03 | [本地文件导入→数据质量→不可变快照](A03-local-import-snapshots.md) | 核对既有探索即可 |
| A04 | [需求→上下文→方法→计算→报告，同一条实际链](A04-requirements-to-report.md) | A01, A03 |
| A05 | [六级裁判对同一证据链的独立判别](A05-six-level-validation.md) | A04 |
| A06 | [运行退出、取消、重试与人工等待恢复](A06-run-recovery.md) | A04 |
| A07 | [已安装 Model Pack 的日常推理与业务证据](A07-model-pack-daily-inference.md) | A01, A04 |
| A08 | [本地优先、最小上下文与失效权限](A08-local-data-permission.md) | A03, A04 |
| A09 | [目标树、指标驱动与跨目标冲突](A09-objective-tree.md) | 核对既有探索即可 |
| A10 | [策略组合与资源约束的真实数值决策](A10-strategy-optimization.md) | A01, A09 |
| A11 | [同一目标案例的经营闭环接续](A11-same-case-business-loop.md) | A02, A04, A05, A06, A09, A10 |
| A12 | [周期报告/目标刷新：新一期真实计算](A12-periodic-analysis.md) | A04, A06 |
| B01 | [真实 LLM 的需求访谈与自主探索质量](B01-live-llm-quality.md) | 核对既有探索即可 |
| B02 | [深度研究实际采证与引用核验](B02-research-evidence-retrieval.md) | 核对既有探索即可 |
| B03 | [Ontology / Knowledge / Memory 的 Owner 后端接续](B03-asset-owner-backend.md) | 核对既有探索即可 |
| B04 | [通用方法纠错与跨域回归发布](B04-method-teach-release.md) | A01 |
| B05 | [高风险 Pack 的实际业务方法](B05-domain-numerical-methods.md) | A01, A02, A07, A10 |
| B06 | [A/B 复杂设计扩展](B06-advanced-ab-design.md) | A02 |
| B07 | [Phase 2 企业 Serving 消费路径](B07-enterprise-serving.md) | 核对既有探索即可 |
| B08 | [行动任务适配器与独立回执接续](B08-action-adapter-receipts.md) | 核对既有探索即可 |
| U01 | [代表用户试用：需求、证据与行动理解](U01-representative-user-study.md) | 核对既有探索即可 |
