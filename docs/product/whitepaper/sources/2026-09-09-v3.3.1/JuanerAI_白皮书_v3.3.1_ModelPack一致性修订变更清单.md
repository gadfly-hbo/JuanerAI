# JuanerAI 白皮书 v3.3.1 Model Pack 一致性修订变更清单

**产品基线：** JuanerAI v3.3  
**白皮书修订版：** v3.3.1  
**修订号：** MP-ALIGN-01  
**修订日期：** 2026-09-09  
**修订性质：** 文档一致性修订，不是产品主版本升级  
**原始基线 SHA-256：** `afe465e73b0b8df104d590a27a30d11ab072e7e67ffcc8b1da9f3a8c5bca5dfb`

## 一、修订范围

本次仅修订 JuanerAI v3.3 白皮书中与 Model Pack 直接相关的产品定位、两期路线、职责边界、验收证据、研究快照和配套图示，同时同步必要的执行摘要、设计原则、“6+1”架构、产品路线、成熟度、原创性、术语与附录。

以下主线保持不变：

- OSM 是目标与策略管理中枢；
- Xanthil Desktop 是统一数据分析工作台；
- DAME 采用六类方法体系；
- A/B Test Analysis 只分析已有实验数据，不建设在线实验平台；
- Domain Pack 是被工作台装配的领域能力包；
- 四库、双库及企业 Ontology 的边界不变；
- Semantic Context Runtime 仍是 Analysis Core 与共享资产、本地执行之间的稳定接缝；
- “6+1”总体架构不增加新的平行层。

## 二、逐项回应六项修订要求

### 1. 补回 Phase 1 的 Desktop 实际集成验收

**原有歧义：** v3.3 将 Independent Consumer、future-actuals、Phase 1 验收和 Xanthil Catalog 直接串联，容易把隔离消费验证写成 Desktop 产品集成已完成，也没有把测试安装与生产目录准入分开。

**本次修订：**

- 将 Phase 1 正式改为：

```text
Model released
→ Thin Builder
→ Independent Consumer 安装验收
→ Xanthil Desktop 安装同一精确 Pack
→ 独立 AnalyticalModelRuntime 实际推理与失败路径验证
→ Desktop Integration Receipt
→ Controller-held future-actuals / 场景效果 Gate
→ Phase 1 Product Acceptance
→ Production Catalog Admission
```

- 把 Independent Consumer、Desktop Integration、future-actuals / 场景效果定义为三类独立证据；
- 区分 `research-only / shadow / restricted validation` 与生产可消费目录；
- 明确研究切片中的 `phase1_accepted` 只代表冻结 Demo 范围，不能证明完整 Phase 1 产品已经完成。

**修改位置：** 18.12、18.15、18.17、18.18、第二十五章、附录 I。  
**图示：** `fig15_ModelPack_MLflow生命周期.png`、`fig17_Consumer_DesktopRuntime边界.png`。

### 2. 补回 Phase 2 企业 Serving 路线

**原有歧义：** v3.3 只有本地 Consumer / Desktop 路线，缺少 2026-08-27 两期计划中的企业 Serving 路线，容易让读者误以为企业版继续由 Frontend 或 Desktop 直接调用 MLflow。

**本次修订：**

```text
Xanthil Enterprise Frontend
→ Enterprise Backend
→ thin MLflowServingAdapter
→ MLflow OSS Model Serving
→ Serving Receipt / Prediction Artifact
→ local / serving parity
→ 企业场景、数据 / 运行合同、用户授权与运行 Gate
→ Phase 2 Serving Acceptance
```

- Frontend 不直连 MLflow；
- 同一已验收 Pack 保持 identity、Signature、合同与 Provenance；
- local / serving parity 独立验证；
- Phase 2 需要独立企业场景、数据合同、运行合同和用户授权；
- PX-007 仅代表最小 Serving / parity Spike，不代表企业 Phase 2 已获授权或完成。

**修改位置：** 18.12、18.15、18.19、18.21、第二十五章、附录 I。  
**图示：** `fig15_ModelPack_MLflow生命周期.png`、`fig19_Phase2企业Serving路线.png`。

### 3. 把预测专用规则限定为首发 Profile

**原有歧义：** v3.3 将非负金额、折扣、currency、cutoff、连续日期×品类矩阵、合同外字段拒绝、rolling-origin、interval coverage 和连续 future-actuals 写得过于接近 Model Pack 通用规则。

**本次修订：**

- 新增“所有 Model Pack 的通用要求”：身份、合同、权限、来源、Snapshot、Provenance、兼容性及场景 Gate 一致；
- 明确具体字段、合法值、缺失规则、评估指标、阈值和独立验收方式由冻结场景合同定义；
- 完整保留首发“28 天产品品类需求预测”Profile 的严格门禁；
- 明确分类、聚类、评分、允许负值的回归等模型不得默认继承预测 Profile 的金额、currency、日期矩阵、rolling-origin、coverage 或连续 28 天 actuals 规则。

**修改位置：** 18.14、18.18、术语表。  
**图示：** `fig18_ModelPack通用合同与首发Profile.png`。

### 4. 补清 ModelEvol 与 Model Pack Controller 分工

**原有歧义：** v3.3 只笼统提到 ModelEvol 与模型训练、评估、重训和版本治理，没有说明 ModelEvol 与 Controller 谁拥有最终发布权，也没有解释 E1–E9 与 MP1–MP9 的关系。

**本次修订：**

- ModelEvol 负责训练供给组织和统一工作区中的需求、方案、Worker、训练尝试、返修体验；
- Model Worker 负责真实训练；
- MLflow 负责记录和注册；
- Model Pack Controller 独占候选接受、锁定、发布、Builder 授权和后续产品验收；
- E1–E6 表达训练供给过程，E7–E9 只能投影 Controller 的 MP7–MP9 决定；
- 新增 MP1–MP9 ↔ E1–E9 的职责和证据映射，明确这不是两套竞争状态机；
- 训练原始行进入隔离数据入口，Agent 默认只使用 schema、画像、质量、权限和 checksum 摘要；
- 明确这是产品职责定义，不声称真实 ModelEvol 集成已完成。

**修改位置：** 执行摘要、4.4、L5、13.1、18.13、18.15、18.19、附录 J。  
**图示：** `fig16_ModelEvol_ModelPack职责映射.png`。

### 5. 区分 Independent Consumer 安装验收与 Desktop 日常 Runtime

**原有歧义：** v3.3 的 `verify → install → offline load → predict → receipt` 容易被读成 Xanthil 每次推理都需要重装 Pack，失败回滚也可能被误解为删除已有有效安装。

**本次修订：**

- 将产品过程拆成“安装 / 验证 / 受限候选”“Desktop 实际集成”“已安装精确版本日常执行”“撤销 / 退役 / 回滚”；
- Independent Consumer 在隔离事务目录运行，只回滚本次事务变更；
- 已有 active version、旧安装和历史 Receipt 必须保留；
- Xanthil 日常推理由独立 AnalyticalModelRuntime 完成，不重复安装；
- 明确兼容性、权限、撤销 / 退役、取消、deadline、输入和输出校验；
- 安装成功不授予额外数据库、文件或网络权限；
- AnalyticalModelRuntime 负责确定性模型执行，Agent Runtime 负责规划、调度和任务状态；
- 正式 SDK、API 和包格式仍由产品合同冻结。

**修改位置：** 13.1、14.4、18.17、18.18、18.19、术语表、附录 I。  
**图示：** `fig17_Consumer_DesktopRuntime边界.png`。

### 6. 明确 MLflow-first 的薄封装原则

**原有歧义：** v3.3 虽然说明 MLflow 是证据与 Registry 底座，但 Builder 章节容易被理解为要把 MLflow Model 重打成 JuanerAI 私有模型格式；“离线”也可能被错误理解为不得 import MLflow。

**本次修订：**

- 优先引用或封装原始 MLflow Model；
- 复用 Signature、input example、依赖、精确版本、本地加载和 MLflow OSS Serving；
- JuanerAI 只增加产品合同、Controller 决定、准入、Provenance、权限、Receipt 和完整性信息；
- “不依赖运行中的 Tracking / Registry”不等于“不允许使用 MLflow 库”；
- 记录 PX-005 Consumer 当前使用 `mlflow.pyfunc.load_model`；
- 把 PX-008 极端离线 ZIP / manifest / adapter 限定为研究验证条件，不冻结为产品标准；
- 正式 SDK、API、Archive、依赖交付方式仍由后续产品合同决定。

**修改位置：** 4.4、L5 / L6、13.1、18.10、18.11、18.16、18.17、18.21、术语表。

## 三、两处同步表述

### A. 两次历史快照分开列示

18.20 现分别列出：

| 日期 / 版本 | 失败触发器 / 判别回归 / 浏览器断言 / 身份链对账 | Run | Pack SHA |
|---|---|---|---|
| 2026-08-29 · PX-005 v0.2-rev1 · 第十三轮 | 58 / 14 / 36 / 17 | `7935ba1d318043b4a691ca3aee6db13b` | `793a49c745ed916ba44e96a4ce9bf1cf0c167a688dbe3ec0444a8ac28bd07b2a` |
| 2026-08-31 · PX-005 v0.2-ui-rev1 · 第三轮 | 58 / 14 / 71 / 17 | `758a624d078a4c69920177a8e2bd7e36` | `e1ebf90f8c3223cb55671af3fb09f2967019ea55d33844670b2cf88839e753de` |

修订明确：

- 36 与 71 不能混用；
- 71 不能配旧 Run / SHA；
- 本次文档修订没有重新执行这些测试；
- 两行均为历史执行快照，不是当前重新测试结果。

### B. 预测结果到业务行动的链路

18.17 与 18.21 统一为：

```text
Prediction Artifact
→ Semantic Enrichment 与输出验证
→ Evidence
→ 独立策略评审 / 人工审批
→ 适用 Action / Workflow
```

Consumer、Desktop Integration、future-actuals、Serving 或 parity 通过，都不会自动创建 Decision、Action、Outcome，也不会自动证明策略增量。

## 四、同步修改的其他章节

- 封面元数据：增加白皮书 v3.3.1、修订号 MP-ALIGN-01、基线快照与非授权说明；
- 执行摘要：加入 ModelEvol、Controller、Desktop Gate、Enterprise Serving 和 Runtime 分工；
- 第四章设计原则：由 20 项扩展为 22 项；
- 第十三章“6+1”：L5 / L6 说明 ModelEvol、AnalyticalModelRuntime 与 MLflow Serving；
- 第十四章：方法需要模型时可解析到 Phase 1 本地或 Phase 2 Serving 执行面；
- 第二十五章：产品路线加入 Phase 1 Desktop Gate 和 Phase 2 Enterprise Serving；
- 第二十七章：成熟度模型加入 Desktop Integration、Serving parity 与产品化 Gate；
- 第二十八章：原创性说明加入证据 Gate 分离和两期路线；
- 附录 D：新增或重写 ModelEvol、Released Model Identity、Installed Model Pack、Serving Projection、AnalyticalModelRuntime、Desktop Integration Gate、MLflowServingAdapter 和 Local / Serving Parity；
- 附录 E：更新十分钟表达；
- 附录 I：重写两期生命周期与证据链；
- 附录 J：新增 MP1–MP9 与 E1–E9 映射。

## 五、新增和调整的图示

| 文件 | 状态 | 作用 |
|---|---|---|
| `fig07_6plus1总体架构.png` | 调整 | 保留 6+1，补充 ModelEvol、AnalyticalModelRuntime 与 MLflow Serving 位置 |
| `fig15_ModelPack_MLflow生命周期.png` | 重绘 | 展示 MLflow-first 主链、Phase 1 与 Phase 2 两期路线及独立 Gate |
| `fig16_ModelEvol_ModelPack职责映射.png` | 新增 | 展示 E1–E9 与 MP1–MP9 的职责 / 证据映射及唯一发布权威 |
| `fig17_Consumer_DesktopRuntime边界.png` | 新增 | 区分安装验收、Desktop 日常推理、失败回滚和撤销 / 退役 |
| `fig18_ModelPack通用合同与首发Profile.png` | 新增 | 区分通用合同和 28 天需求预测首发 Profile |
| `fig19_Phase2企业Serving路线.png` | 新增 | 展示 Enterprise Frontend → Backend → Adapter → MLflow Serving 路线 |

## 六、决策冲突检查

没有发现本次明确产品决策与 v3.3 的 DAME、A/B Test Analysis、OSM、Domain Pack、四库双库或 Semantic Context Runtime 主线发生冲突。

发现的是三类文档差异：

1. **遗漏：** v3.3 未写回 Desktop Integration Gate 和 Phase 2；
2. **范围过宽：** 首发预测合同被写成近似通用 Model Pack 约束；
3. **边界不足：** Consumer / Desktop Runtime、ModelEvol / Controller、MLflow Model / Thin Pack 的分工不够精确。

本修订按 research 已批准结论恢复和澄清这些边界，没有静默覆盖新的明确产品决策。

## 七、非授权与停止线

本次只交付文档和图示，不授权：

- 新 Demo；
- ModelEvol 或 Xanthil Desktop 实现；
- 正式 SDK、API、Schema、Archive 或 Serving Contract；
- 真实数据接入；
- 外部模型或业务调用；
- Phase 1 / Phase 2 产品验收；
- 部署、Handoff、分支、发布或生产目录变更。
