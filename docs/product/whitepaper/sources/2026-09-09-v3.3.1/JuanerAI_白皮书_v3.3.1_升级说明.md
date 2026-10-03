# JuanerAI 白皮书 v3.3.1 升级说明

**修订号：** MP-ALIGN-01  
**产品基线：** JuanerAI v3.3  
**性质：** 白皮书补丁版，不是 JuanerAI v3.4  
**日期：** 2026-09-09

## 一、为什么是 v3.3.1，而不是新的产品主版本

JuanerAI v3.3 已经正式确立：

- DAME 六类方法体系；
- A/B Test Analysis，只分析已有实验数据；
- OSM 目标与策略管理；
- Xanthil Desktop 统一工作台；
- Domain Pack 领域装配；
- 四库、双库与 Semantic Context Runtime；
- MLflow-backed Model Pack 基本定位。

本次没有新增另一条产品主线，而是将 v3.3 Model Pack 章节与已批准的 research 产品定位及 2026-08-27 两期路线重新对齐。因此采用白皮书修订版 **v3.3.1 / MP-ALIGN-01**，保留 v3.3 原始快照和 SHA。

## 二、升级后的 Model Pack 一句话定义

> **Model Pack 以原始 MLflow Model、Signature、依赖、Run / Registry 证据和本地加载 / Serving 能力为基础；ModelEvol 组织训练供给，Model Worker 训练，MLflow 记录和注册，Model Pack Controller 决定接受与发布，Thin Builder 做薄交付，Independent Consumer 验安装，Desktop / Enterprise Gate 验产品运行，最终由 Xanthil 调用。**

## 三、两期路线

### Phase 1：Local / Xanthil Desktop

```text
发布模型
→ Thin Builder
→ Independent Consumer 安装验收
→ Desktop 安装同一 Pack
→ AnalyticalModelRuntime 实际推理与失败路径验证
→ future-actuals / 场景效果 Gate
→ Phase 1 产品验收
→ 生产可消费目录
```

Phase 1 不再把 Independent Consumer 当作 Desktop 集成的替代证据。

### Phase 2：Enterprise Serving

```text
同一已验收 Pack identity
→ Xanthil Enterprise Frontend
→ Enterprise Backend
→ thin MLflowServingAdapter
→ MLflow OSS Model Serving
→ local / serving parity
→ 独立企业场景、授权与运行 Gate
```

Frontend 不直连 MLflow。PX-007 只证明最小 Spike，不代表 Phase 2 已完成。

## 四、六个稳定边界

1. **ModelEvol 与 Controller：** ModelEvol 管训练供给体验，Controller 是唯一发布和验收权威；
2. **MLflow 与 Model Pack：** MLflow 管原始模型、证据和 Registry，Model Pack 增加产品治理与交付信息；
3. **Thin Builder：** 复用 MLflow Model，不无必要重写第二套私有模型格式；
4. **Consumer 与 Desktop：** Consumer 验安装，AnalyticalModelRuntime 管日常确定性推理；
5. **通用合同与场景 Profile：** 身份、合同、权限和 Provenance 通用，字段、值域、指标和窗口由场景合同定义；
6. **模型结果与业务决策：** Prediction Artifact 先转为 Evidence，再经策略评审和人工审批进入行动。

## 五、研究证据的新表达

v3.3.1 分开保存两次历史快照：

- 2026-08-29 PX-005 v0.2-rev1 第十三轮：58 / 14 / 36 / 17，Run `7935...`，Pack SHA `793a...`；
- 2026-08-31 PX-005 v0.2-ui-rev1 第三轮：58 / 14 / 71 / 17，Run `758a...`，Pack SHA `e1eb...`。

本修订没有重新运行测试，也没有把第二次 71 项浏览器断言与第一次身份链拼接。

## 六、没有改变什么

- 不改变 DAME 六类方法；
- 不扩大 A/B Test Analysis 为在线实验平台；
- 不改变 Domain Pack 与 Model Pack 的区别；
- 不改变企业 Ontology、四库与双库的定义；
- 不改变 Semantic Context Runtime 的位置；
- 不增加新的 6+1 架构层；
- 不授权实现、部署或产品 Gate。

## 七、阅读建议

重点阅读：

- 4.4 二十二项设计原则；
- 第十三章“6+1”总体架构；
- 14.4 DAME 与 Model Pack；
- 第十八章 18.10—18.22；
- 第二十五章产品路线；
- 附录 D、I、J；
- `fig15`—`fig19` 五张 Model Pack 专题图。
