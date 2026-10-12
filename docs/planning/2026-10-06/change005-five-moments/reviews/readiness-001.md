# 五个关键时刻补充 · 独立开发就绪审查 001

2026-10-06；独立只读支持Agent `/root/change005_five_moments_readiness_001`，按现行MacBook路由请求 `gpt-6-astra / medium`、无对话历史继承。以下保存其返回正文；不是Mini工程Validator或用户UI批准。

## 1. What I Would Build

在原 Change005 v1.1 开放分析工作台中补齐五个可操作时刻，继续使用快速对话、按需抽屉和原专业六阶段：

- 分析前，给出口径及其真实来源；影响结论的冲突阻断依赖计算，修正只产生当前任务快照。
- 开始时，允许修改可读方案，修改真正进入 Binding、IR、方法、参数及执行范围。
- 执行中，以真实业务步骤显示计算与核验状态；异常暂停受影响分支及下游，保留有独立资格的部分。
- 结果时，每条重要发现直接定位自己的依据、版本和限制，允许绑定精确版本提出异议。
- 下次使用时，显式选择同项目内已确认、持久保存的方案，建立独立新任务；重新检查当前资料、适用性及授权并计算当前事实。

标志性交互是“修改→影响预览→新版本与失效→实际重算和核验→新旧对照”。新旧成果均保留；版本选择不等于正式 Decision、Expected 或现实行动。

依据：[产品补充 §4–6](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/2026-10-06/change005-five-moments/product-addendum-v1.1.md:43)、[UI 补充 §2–3](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/2026-10-06/change005-five-moments/ui-addendum-v1.1.md:11)。

交付终点仍受原 OA-08 约束：有据成果或明确待补证成果已保存、可读回，停止本轮自动推进；失败、停止、UNKNOWN 和用户认可分别表达。不得以取消一个分支宣称原问题全部完成。

## 2. Required Guessing

未发现需要工程补猜的承重产品规则。

以下反例均已有明确裁定；它们是我从验收独立推导的检查要求，**不是本次运行通过的测试**：

| 承重反例 | 合同给出的确定结果 |
|---|---|
| 退款重复归属，但订单金额复核成功 | 暂停净销售额及相关解释；订单金额可作为部分成果保留，不能把净额标合格。FM-03、FM-A03 |
| 运行中切换人群，旧 Run 随后返回 | 封闭旧受影响步骤推进／发布；迟到成果不得进入新 revision。FM-X 第3项、FM-AX2 |
| 指标名称没变，但来源或方法身份变化 | 不能复用旧计算冒充新结果；无法证明未变则扩大重算。FM-X 第4项 |
| 用户点“保留原版本” | 仅改变展示及适用版本认可；不删除新版、不回滚数据、不撤销正式人的历史记录，也不再次计算。FM-X 第5项 |
| 历史方案已确认，但当前资料权限失效 | 不继承旧权限，不读取失权引用；当前任务按实际授权处理。FM-05、FM-A05 |
| 历史没有旧 IR 或可用方案 | 不伪造旧 IR；无合格方案时仍可直接新建。FM-05、FM-A05 |
| 分组对账成功，但没有发券对照资料 | 可以定位销售变化，不能宣称优惠券增量效果或原因成立。FM-02、FM-04 |
| 原附件写“仅结构及汇总外发” | 以最新已批准材料边界为准，必要明细可在有效主任务授权内外发；严格零明细仍延期。FM-03及原批准记录 D1 |

[产品补充 §2.1](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/2026-10-06/change005-five-moments/product-addendum-v1.1.md:23)明确把 FM-05 限为 C6-01/A-02/A-03 的同项目方案消费者；未创建受治理改进版本、效果评价或 N08/S3 完成声明。这与 [C6-01 原定义](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/capability-coverage/register.md:343)及蓝图对保存、找回、复用、学习的区分相容。

## 3. External Study Required

无产品语义层面的外部补读前置。

附件的五时刻及采用／不采用处置已经写入本包；不需要通过 Research 原仓库、Mini 源码或外部设计指南补出业务规则。未访问这些外部来源。

[产品补充 §3](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/2026-10-06/change005-five-moments/product-addendum-v1.1.md:29)中的 Mini HEAD、候选及 PASS 是产品经理记录的时点事实，本次未独立核验，不能作为新增行为已经实现的证据。它不构成本次产品就绪结论的前提；实际工程接收仍应核对现场。

## 4. Untestable Requirements

没有发现缺少判别条件而无法派生测试的新增功能要求。

FM-A01～05、FM-AX1～3已经要求真实消费者、合法变更、拒绝路径、局部失效、恢复、当前事实重算及同版本联合验收，能够区分“界面有按钮”和“行为真正接通”。

体验量化判定尚未完成：FM-UX 明确先记录基线，正式测量前固定任务、参与者、样本、帮助条件及目标，缺失项集中交用户。因此目前不能宣称体验提升或正式体验验收通过；这属于已指明关闭时点的验证安排，不需要工程自行编造阈值，也不阻止范围内实现。

本次未进行浏览器视觉／点击验证，没有证明窄屏、焦点返回或实际交互可用性。增量脚本是明示的合成状态展示；专业 iframe 也明确只是原视觉参考，不证明快速／专业已共享后台。

依据：[FM-UX](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/2026-10-06/change005-five-moments/product-addendum-v1.1.md:115)、[UI 评审边界](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/planning/2026-10-06/change005-five-moments/ui-addendum-v1.1.md:35)。

## 5. Correctly Deferred

可以安全留给 Mini 的普通工程工作包括：

- 私有 Schema、类型、存储结构、依赖表示、实现路径、工程分包及验证命令。
- 在已明确身份与失效规则内确定具体增量计算／扩大重算实现。
- 将原专业六阶段接入同一任务、发现、版本与授权事实。
- 依实际方法确定独立核验方式，但不得使用同代码重跑或模型自评替代。

完整 Ontology／资产治理、Teach、Report Studio、跨项目受治理改进采用、学习效果、N05～N08完整路线及现实行动均有明确返回点，不因这五个时刻提前取得实现或完成权限。

这符合 [执行政策 Product Input and Engineering Intake](/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/docs/governance/product-change-execution-policy.md:78)对产品语义与普通工程决定的分工。

## 6. Required Plan Additions

无阻断性必补条目，不要求增加 Schema、工程 Gate、审批链或额外平台。

继续保留现有停止线即可：增量用户产品/UI接受、冻结、授权发布和 Mini 实际采用分别记录。原 v1.1 的历史批准和 PASS 不自动覆盖本次增量；本次审查也不追认未来修改。

## 7. Verdict

**PASS — 当前固定候选具备产品开发就绪性。**

五个时刻、FM-X、同项目新任务复用的范围、失败语义、数据权限、历史保护和可验收结果自包含；未发现必须由工程侧发明的承重产品规则。

此 PASS 不代表用户已接受新增 UI、不授权发布或派发、不确认 Mini 已采用，也不是工程或产品运行验收。

输入身份已实际读回：

| 文件 | SHA-256 |
|---|---|
| product-addendum-v1.1.md | `de324456083441f7529d04bc72b8bf92a7fd10d68546f9ca5aa3ca9a6164955b` |
| ui-addendum-v1.1.md | `f2867a54e19b19f17585eaa39605c43d4717d7a34e0ed9a052377154eed8f360` |
| clickable/index.html | `6de9c21b7aea264abca10cb5de3841bf8ed50e1210d628e48ff6bce484962ff6` |
| clickable/moments.js | `cfe0d43d7d11d8f03217bb94d88f3285816d1a3b04e42a323d8cc0a5bedc9779` |
| clickable/moments.css | `432d35ee5886650e6f9a24f84c6a76e62343af18e207997a2a9e810f31f72a6a` |
| references/分析核心三角.txt | `b1181ae06b2d3a49ba13f7cf720c4ff5f1727a9319f09c56ba41293f63d17bb6` |

原产品 v1.1、原 UI v1.1、Blueprint v4.2 的实际 SHA 与本包引用一致。完整读取了新增产品/UI/参考文本及增量 HTML、JS、CSS，先读取产品验收再查看交互脚本；另核对原 v1.1 产品/UI/批准记录、原 v1.1 点击稿及必要权威段落。

执行保持只读：未写文件、未操作 Git、未启动服务、未调用 Provider、未读取真实业务资料／凭据、未访问 Mini 或外部仓库。
