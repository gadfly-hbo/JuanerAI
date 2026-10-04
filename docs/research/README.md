# JuanerAI 研究成果索引

2026-10-03随白皮书迁移建立。覆盖research台账中的59项探索；原始Demo、冻结Brief、评审与运行证据保留在research，本索引不重新验收、不改阶段，也不把研究PASS解释为产品实现。

## 使用方式

1. 产品方向读[白皮书](../product/whitepaper/JUANERAI_WHITEPAPER.md)，开发执行读[Planning Index](../planning/README.md)。
2. 按下表定位探索；原文路径与SHA见[PROJECT_INDEX.json](PROJECT_INDEX.json)。白皮书中的具体引用见[REFERENCES.md](REFERENCES.md)。
3. 所需研究结论应写入正式产品输入，标明采用、仅参考、不采用与生产差距。需要原始UI、代码、Brief或夹具时，由输入包提供获准且可取得的固定材料；本索引不承诺跨设备具有完整Demo。
4. 路径以research仓库根为基准，读取历史字节时核对SHA。台账/行动卡可能有不同更新日期，本轮只登记来源，不裁定冲突。

## 研究成果如何进入产品

| 研究线索 | 可参考探索 | 正式采用时要核对 |
|---|---|---|
| 需求澄清、框架与可信分析 | PX-030、014、031、032、038、041、042、043 | Contract、IR、Context、计算及验证是否真实接续 |
| 三种分析方式与工作台体验 | PX-004、006、009、010、012、013、021 | 已批准交互、确定性回放与真实模型证据分别采用 |
| 目标、策略、行动、结果与复盘 | PX-029、033、034、037、048、049、050、051、059 | 独立批准、执行回执、观察窗口、效果与未知 |
| 资产治理、Pack、Teach与后续采用 | PX-001、002、003、015、016–028、035、036、040、054 | 正确Owner、精确版本、回归及新任务显式采用 |
| Model Pack及专项模型验证 | PX-005、007、008、046、055–058 | 消费、运行、未来效果、Serving分别验收 |
| 来源、恢复、权限、外部检索与真人验证 | PX-009 U01、044、045、047、052、053 | 冻结范围、真实/合成证据、权限与尚未执行项 |

该分组是定位导航，不是重新排序或新任务授权。更细章节关系见[PROJECT_BINDINGS](../product/whitepaper/PROJECT_BINDINGS.md)。

## 全部探索

| 探索 | 原台账名称 | 记录的阶段 | 原仓库位置 |
|---|---|---|---|
| <a id="px-2026-001"></a>PX-2026-001 | 假设库与策略库双库建设方案 | 讨论中 | `explorations/PX-2026-001-dual-library` |
| <a id="px-2026-002"></a>PX-2026-002 | 双库端到端纵向打通验证 | Demo已评估 | `explorations/PX-2026-002-dual-library-e2e-slice` |
| <a id="px-2026-003"></a>PX-2026-003 | N01-B Semantica Ontology Hub 体验验证 | Demo已评估 | `explorations/PX-2026-003-semantica-ontology-hub` |
| <a id="px-2026-004"></a>PX-2026-004 | Xanthil Desktop 数分助手静态 Demo | Demo已评估 | `explorations/PX-2026-004-xanthil-uidemo` |
| <a id="px-2026-005"></a>PX-2026-005 | Model Pack 统一工作区：Phase 1 完整纵向 + Phase 2 静态产品链 Demo | Demo已评估 | `explorations/PX-2026-005-model-pack-demon` |
| <a id="px-2026-006"></a>PX-2026-006 | Xanthil Desktop 快速 / 专业双模式 | 已Handoff | `explorations/PX-2026-006-xanthil-dual-mode` |
| <a id="px-2026-007"></a>PX-2026-007 | Model Pack 最小可运行链路：MLflow 技术可行性 Spike | Demo已评估 | `explorations/PX-2026-007-model-pack-mlflow-spike` |
| <a id="px-2026-008"></a>PX-2026-008 | ModelPackBuilder → versioned Pack → independent Consumer 最小接缝 | Demo已评估 | `explorations/PX-2026-008-model-pack-builder-consumer-spike` |
| <a id="px-2026-009"></a>PX-2026-009 | 自主探索数据分析 Demo | 讨论中 | `explorations/PX-2026-009-autonomous-exploration` |
| <a id="px-2026-010"></a>PX-2026-010 | Xanthil 深度研究工作台 Demo | Demo已评估 | `explorations/PX-2026-010-deep-research-workbench` |
| <a id="px-2026-011"></a>PX-2026-011 | AnalysisOps 三级裁判与分层 HITL | Demo已评估 | `explorations/PX-2026-011-analysisops-judge-hitl` |
| <a id="px-2026-012"></a>PX-2026-012 | Xanthil 深度研究工作台全自动版 | Demo已评估 | `explorations/PX-2026-012-deep-research-autopilot` |
| <a id="px-2026-013"></a>PX-2026-013 | 自主探索 LLM 四接入点验证 | Demo已评估 | `explorations/PX-2026-013-autonomous-exploration-llm` |
| <a id="px-2026-014"></a>PX-2026-014 | Analysis IR：JuanerAI 分析编译器 | Demo已评估 | `explorations/PX-2026-014-analysis-ir` |
| <a id="px-2026-015"></a>PX-2026-015 | Teach：组织级分析纠错与能力发布 | 讨论中 | `explorations/PX-2026-015-teach` |
| <a id="px-2026-016"></a>PX-2026-016 | 参考 Domain Pack：会员增长与复购 | Demo已评估 | `explorations/PX-2026-016-domain-pack-reference` |
| <a id="px-2026-017"></a>PX-2026-017 | 门店经营 Domain Pack 合同一致性验证 | Demo已评估 | `explorations/PX-2026-017-store-operations-pack-conformance` |
| <a id="px-2026-018"></a>PX-2026-018 | 商品经营 Domain Pack 一致性验收 | Demo已评估 | `explorations/PX-2026-018-merchandise-operations-pack-conformance` |
| <a id="px-2026-019"></a>PX-2026-019 | 消费者洞察 Domain Pack：身份、分群、来源与隐私边界 | Demo已评估 | `explorations/PX-2026-019-consumer-insight-pack-boundaries` |
| <a id="px-2026-020"></a>PX-2026-020 | 库存与分货 Domain Pack：受约束建议与人工批准边界 | Demo已评估 | `explorations/PX-2026-020-inventory-allocation-pack-boundaries` |
| <a id="px-2026-021"></a>PX-2026-021 | 数据分析报告模板与周期复用 | Demo已评估 | `explorations/PX-2026-021-report-template-module` |
| <a id="px-2026-022"></a>PX-2026-022 | 渠道 ROI 与归因 Domain Pack：增量主张边界 | Demo已评估 | `explorations/PX-2026-022-channel-roi-attribution-pack-boundaries` |
| <a id="px-2026-023"></a>PX-2026-023 | 流失预警 Domain Pack：风险分层与人工复核边界 | Demo已评估 | `explorations/PX-2026-023-churn-early-warning-pack-boundaries` |
| <a id="px-2026-024"></a>PX-2026-024 | 定价与促销 Domain Pack：价格建议与审批边界 | Demo已评估 | `explorations/PX-2026-024-pricing-promotion-pack-boundaries` |
| <a id="px-2026-025"></a>PX-2026-025 | 补货与履约 Domain Pack：建议资格与执行隔离 | Demo已评估 | `explorations/PX-2026-025-replenishment-fulfillment-pack-boundaries` |
| <a id="px-2026-026"></a>PX-2026-026 | 产品漏斗 Domain Pack：诊断资格与发布隔离 | Demo已评估 | `explorations/PX-2026-026-product-funnel-pack-boundaries` |
| <a id="px-2026-027"></a>PX-2026-027 | 营销活动与人群策略 Domain Pack：资格审阅与触达隔离 | Demo已评估 | `explorations/PX-2026-027-marketing-campaign-audience-pack-boundaries` |
| <a id="px-2026-028"></a>PX-2026-028 | Xanthil Desktop 消费 Domain Pack：能力装配与调用 | Demo已评估 | `explorations/PX-2026-028-domain-pack-workbench-consumption` |
| <a id="px-2026-029"></a>PX-2026-029 | OSM 目标与策略管理：新增目标经营路线 | Demo已评估 | `explorations/PX-2026-029-osm-objective-strategy` |
| <a id="px-2026-030"></a>PX-2026-030 | 分析需求调研与框架共创 | Demo已评估 | `explorations/PX-2026-030-analysis-requirement-co-creation` |
| <a id="px-2026-031"></a>PX-2026-031 | 任务上下文解析与绑定 | Demo已评估 | `explorations/PX-2026-031-context-resolve-binding` |
| <a id="px-2026-032"></a>PX-2026-032 | 语义物化、本地计算与业务证据 | Demo已评估 | `explorations/PX-2026-032-semantic-materialization-local-evidence` |
| <a id="px-2026-033"></a>PX-2026-033 | 目标有效性、指标快照与差距生成 | Demo已评估 | `explorations/PX-2026-033-objective-snapshot-gap` |
| <a id="px-2026-034"></a>PX-2026-034 | 策略候选到行动、结果与经营复盘 | Demo已评估 | `explorations/PX-2026-034-strategy-action-outcome-review` |
| <a id="px-2026-035"></a>PX-2026-035 | Context Commit 分类回流 | Demo已评估 | `explorations/PX-2026-035-context-commit-routing` |
| <a id="px-2026-036"></a>PX-2026-036 | 经营复盘到 Teach、新 Pack 与显式采用 | Demo已评估 | `explorations/PX-2026-036-review-teach-pack-adoption` |
| <a id="px-2026-037"></a>PX-2026-037 | 未来行动看板：人机决策、执行反馈与经营学习 | Demo已评估 | `explorations/PX-2026-037-future-action-dashboard` |
| <a id="px-2026-038"></a>PX-2026-038 | DAME 方法资产→IR→真实计算 | Demo已评估 | `explorations/PX-2026-038-dame-method-asset-execution` |
| <a id="px-2026-039"></a>PX-2026-039 | A/B Test Analysis 可运行最小闭环 | Demo已评估 | `explorations/PX-2026-039-ab-test-analysis` |
| <a id="px-2026-040"></a>PX-2026-040 | JuanerAI Agent 测评体系及工具 | Demo已评估 | `explorations/PX-2026-040-agent-evaluation-system` |
| <a id="px-2026-041"></a>PX-2026-041 | 本地文件导入→数据质量→不可变快照（路线图 A03） | Demo已评估 | `explorations/PX-2026-041-local-file-quality-snapshot` |
| <a id="px-2026-042"></a>PX-2026-042 | 需求→上下文→方法→计算→报告，同一条实际链（路线图 A04） | Demo已评估 | `explorations/PX-2026-042-analysis-chain-e2e` |
| <a id="px-2026-043"></a>PX-2026-043 | 六级裁判对同一证据链的独立判别（路线图 A05） | Demo已评估 | `explorations/PX-2026-043-six-level-judge-chain` |
| <a id="px-2026-044"></a>PX-2026-044 | 外部证据采集与信息底座 | Demo已评估 | `explorations/PX-2026-044-external-evidence-acquisition` |
| <a id="px-2026-045"></a>PX-2026-045 | 运行退出、取消、重试与人工等待恢复（路线图 A06） | Demo已评估 | `explorations/PX-2026-045-run-recovery` |
| <a id="px-2026-046"></a>PX-2026-046 | 已安装 Model Pack 的日常推理与业务证据（路线图 A07） | Demo已评估 | `explorations/PX-2026-046-model-pack-daily-inference` |
| <a id="px-2026-047"></a>PX-2026-047 | 本地优先、最小上下文与失效权限（路线图 A08） | Demo已评估 | `explorations/PX-2026-047-local-first-minimal-context` |
| <a id="px-2026-048"></a>PX-2026-048 | 目标树、指标驱动与跨目标冲突（路线图 A09） | Demo已评估 | `explorations/PX-2026-048-goal-tree-conflict` |
| <a id="px-2026-049"></a>PX-2026-049 | 策略组合与资源约束的真实数值决策（A10） | Demo已评估 | `explorations/PX-2026-049-strategy-portfolio-optimization` |
| <a id="px-2026-050"></a>PX-2026-050 | 同一目标案例的经营闭环接续（路线图 A11） | Demo已评估 | `explorations/PX-2026-050-same-goal-business-loop` |
| <a id="px-2026-051"></a>PX-2026-051 | 周期报告/目标刷新：新一期真实计算（路线图 A12） | Demo已评估 | `explorations/PX-2026-051-periodic-report-refresh` |
| <a id="px-2026-052"></a>PX-2026-052 | 真实 LLM 的需求访谈与自主探索质量（路线图 B01） | Demo已评估 | `explorations/PX-2026-052-live-llm-quality` |
| <a id="px-2026-053"></a>PX-2026-053 | 深度研究实际采证与引用核验（路线图 B02） | Demo已评估 | `explorations/PX-2026-053-local-research-citation-verification` |
| <a id="px-2026-054"></a>PX-2026-054 | Ontology / Knowledge / Memory 的 Owner 后端接续（路线图 B03） | Demo已评估 | `explorations/PX-2026-054-ontology-owner-backend` |
| <a id="px-2026-055"></a>PX-2026-055 | 通用方法纠错与跨域回归发布（路线图 B04） | Demo中 | `explorations/PX-2026-055-method-correction-cross-domain` |
| <a id="px-2026-056"></a>PX-2026-056 | 高风险 Pack 的实际业务方法：流失评分/校准（路线图 B05） | Demo已评估 | `explorations/PX-2026-056-churn-numerical-method` |
| <a id="px-2026-057"></a>PX-2026-057 | A/B 复杂设计扩展（路线图 B06） | Demo已评估 | `explorations/PX-2026-057-ab-complex-design` |
| <a id="px-2026-058"></a>PX-2026-058 | Phase 2 企业 Serving 消费路径（路线图 B07） | Demo已评估 | `explorations/PX-2026-058-enterprise-serving-consumption` |
| <a id="px-2026-059"></a>PX-2026-059 | 行动任务适配器与独立回执接续（B08） | Demo已评估 | `explorations/PX-2026-059-action-task-adapter` |

原资料身份与本轮归档边界见[迁移说明](../product/whitepaper/MIGRATION_2026-10-03.md)。
