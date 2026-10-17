# 浏览器工作台 UI 改造 · 批准与产品输入冻结 v0.1

产品任务：BUI-20261015。产品输入包：`BUI-20261015-PI-v0.1`。冻结对象：`BUI-20261015-004`。记录日期：2026-10-15，MacBook Product Manager。

## 1. 用户批准原文与准确含义

用户在本任务直接确认：

> 这版 UI 改造方案和可点击 UI Contract 我确认通过。先冻结产品输入，整理给 Mini 的工程交接材料和启动提示词，暂不进入开发，也不自动发送或恢复 Mini 任务。

据此：本版产品方案审核 **PASS**；本版可点击 UI Contract 的用户 **UI Gate PASS**；本地 **PRODUCT_INPUT_FREEZE 完成**。这不是已实现产品的 Product Acceptance、Engineering Acceptance、Engineering Intake、开发授权或 Git 发布授权。

本记录是后续批准状态入口。既有README、方案正文、UI Contract、原型页面及评审中的“候选／待审核／PENDING／未冻结”保留为审核时点原字节，由本记录更新其后续批准／冻结状态，不回写历史。原型的“合成审核／无真实执行”限制始终有效。

## 2. 精确冻结身份

- 产品方案、UI合同、能力保留、视觉系统、原型及参考附件等，以[已核验candidate-004.json](reviews/candidate-004.json)中的26文件为固定集合；该manifest本身为 **4408 bytes**，SHA-256 **`2a169062cacc2c0ff2ec83a4c0c1ad75cddea3a0f268ec4529c6021f32a85fcc`**。
- 本次冻结前独立逐文件回读26项全部匹配；不以Git HEAD代替未提交文稿身份。交接扩展文件的身份见[freeze-manifest-v0.1.json](handoff/freeze-manifest-v0.1.json)。
- 产品／源码调查基线：`b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`。它是写作时fetch后的origin/main固定点，不宣称现在Mini工作树或服务也在该点。
- 规则发布身份：PR #87，commit `187c356625260d84ca58bc1f5741e081e89662cd`，tree `a5d2f80596a326c993d02fdaaaf644735b2f5128`；写作基线还包含PR #88治理修订，未降级规则。
- 编写分支：`work/macbook/browser-workbench-ui-plan`，单写入设备MacBook。尚未交出该分支写权，也没有供Mini checkout的已推送产品输入提交。

## 3. 已批准范围、验收与禁止项

产品语义权威为[完整方案](proposal-v0.1.md)、[UI Contract](ui-contract-v0.1.md)、[能力保留表](baseline-and-coverage.md)、[视觉系统](visual-system.md)，不另造同义规格。已批准BUI-R01–R12及A01–A08；可见页U01–U11以合同为准。

范围为当前Personal浏览器＋同机服务工作台，整体对齐附件，保留专业六阶段和既有适用能力；稳定引用／选区、单稿编审、冲突保稿、表达来源、报告内容确认与失效按本版合同冻结。旧分析认可、报告内容确认、正式决定、现实行动分别记录；旧数据／历史不覆盖，不从旧认可补造新版报告确认。

Desktop壳、完整Report Studio、Change007实现、企业权限／多人编辑、新连接器／Runtime迁移／依赖升级、现实行动和完整Actual闭环不进入本包。必要应用／存储契约增量不是“只改CSS”；精确设计、兼容和工程影响决定留给获授权后的Mini主工程Agent，不能据此提前建schema或迁移数据。

本次UI通过不把合成原型当真实产品，不继承附件作者自报PASS，不免除后续真实浏览器／同机后端、持久化、权限、兼容、负例、受影响回归、独立工程验证及用户实际产品接受。

## 4. 独立开发就绪与既有证据复用

[fresh Review002](reviews/review-002.md)为Product Plan Development-Readiness PASS；[003](reviews/review-003.md)、[004](reviews/review-004.md)对非实质勘误具名回读通过，复用002结论；没有新增承重产品语义，本次不重复Gate。001的NEEDS_CLARIFICATION及原件、RED、修正、UNKNOWN和未验证项保留。

既有作者证据为27项原型检查、Chrome合成交互及1440–390宽度检查；[verification](verification.md)明确实际范围。Reviewer未独立实跑这些检查，不混称工程Validator PASS；本次也不重跑产品验证或执行模型／业务动作。

## 5. 授权与接收状态

| 状态 | 本次结论 |
|---|---|
| 产品方案／UI Gate | 用户明确通过，绑定004固定身份 |
| 产品输入冻结 | 本地已冻结；无额外产品范围变更 |
| 本地交接文稿／启动提示词／离线材料包 | 本次允许准备；是否实际发出分别记录 |
| Git提交／推送／PR／合并／main同步 | 未授权、未执行；文稿尚非Git集成项目资产 |
| Mini材料到达／可读／散列核验 | UNKNOWN，未发送，不宣称远端可读 |
| Mini接收／采用／Engineering Intake | 未发生、未核验，不代填回执 |
| 开发／OpenSpec／测试或产品代码编写 | 明确暂不进入；尚未授权 |
| Mini在研任务／服务／控制板 | 未操作，现场与重叠未核验 |

后续即使用户手动转发[启动提示词](handoff/mini-start-prompt-readonly-v0.1.md)，也只启动其具名“只读接收核对后停止”动作；不恢复任何Mini任务，不创建工程状态或执行实现。要进入开发，仍需用户另行明确授权并由Mini核对现场后确认Engineering Intake；不得重问已有效通过的相同产品／UI问题，只有受影响新增歧义／失效边界直接问用户。

## 6. 下一动作与材料可用性

本任务止于本地冻结和[工程交接准备](handoff/engineering-handoff-v0.1.md)。材料索引及实际传输包身份见[handoff/README](handoff/README.md)和[transfer-receipt](handoff/transfer-receipt-v0.1.md)。包只为用户后续手动转发准备，不通过SSH、Git推送、跨任务消息、调度器或任务恢复自动送达。

完整源和历史证据继续使用MacBook既有根`/Users/huangbo/JuanerAI-artifacts/browser-workbench-ui-plan/`。MacBook的绝对路径与127.0.0.1预览地址不是Mini入口；接收方须报告实际收到的本机路径和核验结果。没有这份回执，不称已交接／已采用。
