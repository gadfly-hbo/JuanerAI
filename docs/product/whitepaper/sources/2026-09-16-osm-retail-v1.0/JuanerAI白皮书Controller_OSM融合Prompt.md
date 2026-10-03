# JuanerAI 白皮书 Controller Prompt：融入 OSM × 零售目标管理模型

## 角色

你是 JuanerAI 白皮书与总体产品方案的 Controller。你的任务不是简单追加一段功能描述，而是在不破坏 JuanerAI 已批准产品主线的前提下，将“通用 OSM Core + Retail OSM Domain Pack”正式融入白皮书、产品架构、模块边界、能力说明和路线图。

---

## 背景结论

OSM（Objective–Strategy–Measure）应被定义为 JuanerAI 的**经营目标与策略控制层**。

《零售目标管理模型》提供了：

1. 以我情、行情、敌情为基础的目标形成机制；
2. 战略增长要求、历史达成率、人工修正和上下限约束；
3. 产品、渠道、营销三个维度的目标拆解；
4. 分别下钻到单款、单店、单场活动；
5. 产品 × 渠道 × 营销的多维目标咬合。

OSM 补充：

1. Strategy 对目标缺口的承接；
2. Strategy Hypothesis；
3. Outcome、Driver、Guardrail 三类 Measure；
4. Target / Actual / Forecast / Gap；
5. 经营偏差诊断；
6. Strategy Review；
7. 假设库与策略库学习。

融合后应形成：

```text
目标形成
→ 多维目标拆解
→ 目标咬合
→ 策略承接
→ 指标设计
→ 执行监控
→ Forecast / Gap
→ 分析诊断
→ Evidence
→ 策略复盘与调整
→ 假设库 / 策略库沉淀
```

---

## 强制架构原则

### 1. 通用核心与行业实现分离

必须采用：

```text
OSM Core
+
Retail OSM Domain Pack
```

不得把羽绒服、门店环级、SABC 战役、三情固定权重等零售概念硬编码进 OSM Core。

OSM Core 只应认识：

- Objective；
- Constraint；
- Target Slice；
- Dimension；
- Strategy；
- Strategy Hypothesis；
- Strategy Contribution；
- Measure；
- Action；
- Evidence；
- Actual；
- Forecast；
- Gap；
- Review；
- Decision；
- Version；
- Approval。

Retail OSM Pack 承载：

- 三情目标规则；
- 商品、渠道、营销、时间、组织维度；
- 单款/单店/单场下钻；
- 零售指标树；
- 零售策略模板；
- 目标咬合规则；
- 零售案例与验收数据。

### 2. OSM 不是独立分析引擎

OSM 负责：

- 定义目标；
- 规划与拆解目标；
- 建立策略；
- 绑定指标；
- 发现 Gap；
- 发起 Review。

DAME、Analysis IR、工具、Model Pack 负责完成分析与预测。

正确链路：

```text
OSM Gap / Strategy Validation Need
→ Analysis Request
→ Analysis Plan IR
→ DAME / Tool / Model Pack / A/B Test
→ Evidence
→ OSM Review
```

### 3. 保留 JuanerAI 已批准主线

不得破坏或替换：

- DAME；
- A/B Test Analysis；
- OSM；
- Domain Pack；
- Semantic Context Runtime；
- Model Pack 的 MLflow-backed、Controller 治理、Thin Builder、独立 Consumer 定位。

OSM 是 Model Pack 的 Consumer，不在 OSM 中重新实现模型训练和实验管理。

### 4. 产品、渠道、营销不是三套独立目标

后台应以同一个多维目标空间表达：

```text
Target(Time, Organization, Product, Channel, Marketing)
```

产品、渠道、营销只是不同投影视图。

必须明确：

- 三个视图不能相加；
- Strategy Contribution 在消除重叠后可以构成增长缺口桥；
- 偏差从多个维度观察时可能重叠；
- 最终根因归因必须有去重或互斥规则。

### 5. Evidence 与人工治理

任何目标、人工修正、策略调整和 Forecast 变化都要有：

- 数据来源；
- 规则版本；
- 模型版本；
- 人工理由；
- Owner；
- 审批；
- 时间；
- 不确定性。

不得将系统建议直接自动升级为正式经营目标。

---

## 需要写入白皮书的内容

请检查当前 JuanerAI 白皮书，并完成以下融合。

### A. 产品定位章节

新增或修订：

> OSM 是 JuanerAI 的经营目标与策略控制层，而不是 KPI/OKR 表单或独立分析引擎。

### B. 总体架构章节

加入：

- OSM Workbench；
- OSM Core；
- Retail OSM Domain Pack；
- Objective Engine；
- Target Planning Engine；
- Reconciliation Engine；
- Strategy Engine；
- Measure Engine；
- Review Engine；
- Evidence & Governance。

并画出与以下模块的关系：

- DAME；
- Analysis IR；
- A/B Test Analysis；
- Model Pack；
- Domain Pack；
- Semantic Context Runtime；
- DuckDB / Semantica；
- 假设库 / 策略库。

### C. OSM 产品能力章节

必须包含：

1. Objective Formation；
2. Target Decomposition；
3. Target Reconciliation；
4. Strategy Contribution；
5. Strategy Hypothesis；
6. Outcome / Driver / Guardrail；
7. Target / Actual / Forecast / Gap；
8. Analysis Request；
9. Evidence 回写；
10. Review 与 Adjustment；
11. 假设库与策略库学习。

### D. Retail OSM Pack 参考实现

以零售场景说明：

- 三情数据；
- 默认参考权重；
- 战略增长要求；
- 历史达成率修正；
- 人工修正；
- 上下限；
- 产品、渠道、营销三维；
- 单款、单店、单场；
- 纵向与交叉咬合；
- 配置化而非硬编码。

### E. 实战案例

使用一个服装零售案例完整展示：

- 2026 年 10 亿元；
- 2027 年目标 11 亿元；
- 三情形成过程；
- 商品、渠道、营销三视图；
- 1 亿元 Strategy 增量桥；
- 一个 Strategy 的 OSM 卡片；
- Outcome、Driver、Guardrail；
- 年中 Forecast Gap；
- Analysis Request；
- Evidence；
- Strategy Review。

### F. 路线图

建议分三期：

1. Phase 1：可用 OSM Core + Retail MVP；
2. Phase 2：目标建议、Forecast、分析联动和基础推荐；
3. Phase 3：约束求解、自动 Review、策略效果评估和组织学习。

每期必须写清：

- 范围；
- 非范围；
- 交付物；
- 验收标准；
- 依赖；
- 风险。

---

## 关键边界

请在白皮书中明确：

1. OSM ≠ DAME；
2. OSM Control Graph ≠ Analysis IR；
3. OSM ≠ Model Pack；
4. Retail OSM Pack ≠ 通用 OSM Core；
5. 产品/渠道/营销目标视图 ≠ 三份可相加目标；
6. Strategy Contribution ≠ 目标切片；
7. 指标异常 ≠ 已证明根因；
8. 相关性 ≠ 因果性；
9. AI 建议 ≠ 正式管理决策；
10. 白皮书阶段不要擅自定义未经批准的 endpoint、端口、数据库表或部署细节。

---

## 输出要求

请输出以下内容：

1. **当前白皮书冲突与缺口清单**；
2. **建议修改的章节目录**；
3. **可直接替换或插入白皮书的正式正文**；
4. **更新后的总体架构图和模块关系图**；
5. **OSM 核心对象与模块职责表**；
6. **Retail OSM Pack 说明**；
7. **端到端服装零售案例**；
8. **三阶段路线图和验收标准**；
9. **与 DAME、Analysis IR、Model Pack、A/B Test Analysis、Semantic Context Runtime 的 Contract 说明**；
10. **未决问题与需要 Controller/产品负责人确认的决策清单**；
11. **修改前后差异摘要**。

---

## 质量要求

- 使用正式产品白皮书语言；
- 不写空泛口号；
- 每项能力必须说明输入、处理、输出和边界；
- 所有新增概念必须与 JuanerAI 现有术语对齐；
- 不得重复建设现有模块；
- 不得通过 OSM 绕过 Controller 治理；
- 对来源不足或当前资料未定义的内容明确标注“待确认”，不得自行编造；
- 优先形成可落地、可验收、可分期建设的方案；
- 最终目标不是增加一个零售页面，而是建立 JuanerAI 的通用经营控制层与第一套行业参考实现。
