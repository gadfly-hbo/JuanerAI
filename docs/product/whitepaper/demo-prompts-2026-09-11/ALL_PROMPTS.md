# JuanerAI 开发前验证：21 份独立 Session Prompt

逐项复制完整代码块；每一项已经包含工作目录、上下文入口、范围与交付要求。使用方式与依赖见 [索引](README.md)。

## A01 · DAME 方法资产→IR→真实计算

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A01 DAME 方法资产→IR→真实计算
路线图编号：A01
白皮书章节：9.5–9.7、14.4、附录 G。
唯一验证问题：版本化 Method Asset 能否被两个领域复用、进入 IR 并实际计算，且适用性与证据边界可独立验证？

验证场景与成功信号：选一个 M1 对比和一个 M2 贡献分解，版本化方法声明→适用性审阅→编译→SQL/Python→证据；同一方法用于两个领域，独立算例复算正确；输出保留方法完整身份。
三类关键失败：前提不满足；方法版本/参数漂移；相关或分解被升级为因果。
复用与开发时点：复用 009/014/032；先验证方法资产是可执行对象。无需一次实现六类全部算法，也不强制 Model Pack。DAME/Core 扩展开发前。

本项实施约束：以会员和门店两个合成领域检验同一 M1 对比与 M2 贡献分解。独立期望值不能由被测实现自己生成；方法执行与 Domain Pack 领域选择分责。查旧 DAME PRD 只作历史参考，不按旧文档任务清单执行。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-009-autonomous-exploration
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-014-analysis-ir
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A02 · A/B Test Analysis 可运行最小闭环

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A02 A/B Test Analysis 可运行最小闭环
路线图编号：A02
白皮书章节：10.4–10.5、附录 H。
唯一验证问题：能否从既有实验形态数据得到可复算、保留不确定性且满足实验合同的分析建议？

验证场景与成功信号：一份外部实验形态的合成 assignment/exposure/outcome 数据；确认实验单元、主指标、窗口、停止规则→数据健康/SRM→固定单一方法的效应量/区间→建议。以独立算例核验；不显著保留不确定性。
三类关键失败：分组/曝光/随机化单元不合格；观察未成熟/不足以判断；护栏或多指标/探索切片被越权用于主结论。
复用与开发时点：复用 022/034 的主张边界；A01 方法资产方式优先复用。真实统计计算但不跑线上实验；不一次覆盖 CUPED/序贯全部分支。M3 和效果评估开发前。

本项实施约束：首轮建议一个固定随机化单元、一个二值主指标和一个护栏，明确 assignment 与 exposure 的不同用途。选择统计方法前核对官方文档或原始方法资料，记录前提、预期误差与独立参考算例；不得把拟运行样例写成实际结果。A01 尚未完成时可以先收敛统计合同，不复制一个假 Method Asset。

前序路线图依赖：A01。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-022-channel-roi-attribution-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-034-strategy-action-outcome-review

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A03 · 本地文件导入→数据质量→不可变快照

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A03 本地文件导入→数据质量→不可变快照
路线图编号：A03
白皮书章节：12.1、16.4、16.10。
唯一验证问题：用户实际导入的文件能否形成质量可审阅、口径已确认、可重放且不会覆盖历史的数据快照？

验证场景与成功信号：分析师导入两份合成 CSV（订单/会员），确认类型、时间、金额口径和清洗→快照→Binding→实际查询；数据变化产生新快照，旧查询仍可复算。
三类关键失败：键重复/Join 放大；类型/单位/时区导致静默误算；补数/替换文件覆盖旧快照。
复用与开发时点：复用 009 的语义建模与 032；验证未预装成数据库的输入。先一种格式，其他格式按首发需求增补。数据接入开发前。

本项实施约束：首轮只接两份本地合成 CSV，不做全部格式。使用用户可操作的真实文件选择/导入路径，再实际查询；保留原文件指纹、解析与清洗规则、排除行依据和快照身份。不得只在界面假装导入预装数据。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-009-autonomous-exploration
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A04 · 需求→上下文→方法→计算→报告，同一条实际链

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A04 需求→上下文→方法→计算→报告，同一条实际链
路线图编号：A04
白皮书章节：11、16、18.7、22。
唯一验证问题：真实需求共创产物能否驱动同一条 Context、方法、IR、计算和报告链，且修改输入能改变最终报告？

验证场景与成功信号：真实运行 030 共创产物→显式转换/确认→031 Resolve→方法/IR→032 型计算→021 型报告；输入改动改变结果与报告，逐段可反查；含无 OSM/无 Pack 普通分析对照。
三类关键失败：草稿/旧批准直接运行；跨段版本/口径错配；计算变化却继续展示旧报告。
复用与开发时点：依赖 A01/A03；014 是否可直接消费需先对账，适配必须显式。只一个会员场景，不整合所有页面。共享分析链正式集成前。

本项实施约束：重点补 030→031 和局部 IR→方法编译接缝。先逐字段核对源任务、口径、时间窗、Pack 版本及授权语义；030 草稿不是执行许可。明确是直接消费、显式适配还是受限新实现，保持原产物只读。增加无 OSM、无 Pack 普通分析对照。

前序路线图依赖：A01、A03。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-030-analysis-requirement-co-creation
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-014-analysis-ir
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-021-report-template-module
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-028-domain-pack-workbench-consumption

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A05 · 六级裁判对同一证据链的独立判别

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A05 六级裁判对同一证据链的独立判别
路线图编号：A05
白皮书章节：19、21。
唯一验证问题：不同层级的真实错误能否被独立裁判检出，且人工审批和下游绿灯都无法掩盖硬阻断？

验证场景与成功信号：在 A04 基线上挂真实检查，覆盖适用的 G0–G5；分别注入可检出的错误并保留合法对照，显示阻断位置、修复条件和未验证项；无 OSM 时 G0 说明不适用。
三类关键失败：上游无效仍被下游绿灯覆盖；生成与复核共同信任伪 Evidence；人工批准绕过硬阻断。
复用与开发时点：复用 011/031–035；各级可参数化反例，不另造六套工作台。G5 先接 034 的受限分支，A11 再贯通。正式整合裁判前。

本项实施约束：用 A04 的真实链作为主体，各级反例归并为三类失败。G0 对无目标任务可为不适用；G5 在尚未接入同一原始案例时只能使用明确标注的 034 独立对照，不能称全链统一裁判已完成。区分生成和验证依据，保留合法孪生对照。

前序路线图依赖：A04。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-011-analysisops-judge-hitl
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-033-objective-snapshot-gap
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-034-strategy-action-outcome-review
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-035-context-commit-routing

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A06 · 运行退出、取消、重试与人工等待恢复

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A06 运行退出、取消、重试与人工等待恢复
路线图编号：A06
白皮书章节：11.4、17。
唯一验证问题：实际子进程退出、取消和人工等待恢复后，能否保留正确运行事实而不重复提交或接受迟到结果？

验证场景与成功信号：用 A04 的一个实际本地子进程任务：启动→检查点→停止进程→新进程重读→人工确认后继续；已完成证据不重复写，未完成不显示成功。
三类关键失败：超时/取消后的迟到结果；写入与应答之间退出造成重复；批准等待跨重启丢失/旧批准复活。
复用与开发时点：复用 002/032/035 已有持久化证据，仅补跨步骤与真实进程故障。单用户、两任务即可；不建通用调度平台。长任务/恢复功能前。

本项实施约束：仅一个本地任务类型、单用户和两个测试任务。真实停止隔离测试进程并用新进程读取状态；禁止操作其他 session 的进程或服务。只新增跨步骤恢复的必要机制，不建立通用调度平台；人工批准跨重启仍必须绑定精确输入。

前序路线图依赖：A04。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-002-dual-library-e2e-slice
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-035-context-commit-routing

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A07 · 已安装 Model Pack 的日常推理与业务证据

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A07 已安装 Model Pack 的日常推理与业务证据
路线图编号：A07
白皮书章节：18.17–18.19。
唯一验证问题：已安装的精确 Model Pack 能否经独立 AnalyticalModelRuntime 完成日常推理并形成业务 Evidence，且异常时维持安装和运行边界？

验证场景与成功信号：消费 005/008 的精确真实 Pack；安装验收与日常 load/validate/predict 分离；最小工作台消费者经独立 AnalyticalModelRuntime 执行，预测经 Binding 变成 Evidence；修改输入实际改变输出。
三类关键失败：安装失败保留原 active；取消/截止后迟到预测；版本/输入/权限/撤销不合格仍生成证据。
复用与开发时点：复用 005/007/008，A01/A04 的身份方式；先 research 隔离消费者，不冒称正式 Desktop 集成完成。正式产品路径仍须在目标仓库验收。模型消费开发前。

本项实施约束：读取 005/008 的实际 Pack、Consumer Receipt 与原始 MLflow Model；正式合同只读核对。不得把独立 Consumer 再跑一遍称为 Desktop 实际集成。research 只做最小消费者与独立日常推理接缝，Semantic Context Runtime 负责业务增强；真实 Desktop 产品路径留给正式侧验收。

前序路线图依赖：A01、A04。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-005-model-pack-demon
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-007-model-pack-mlflow-spike
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-008-model-pack-builder-consumer-spike
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A08 · 本地优先、最小上下文与失效权限

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A08 本地优先、最小上下文与失效权限
路线图编号：A08
白皮书章节：12.4、16.10、21。
唯一验证问题：应用能否只把获准摘要送入模型请求，在来源恶意或权限变化时停止未获准的数据消费并保留可解释的历史？

验证场景与成功信号：用带虚构敏感标记的合成数据，实际采集“准备发送给模型”的请求与日志；仅允许批准摘要；撤权后禁止继续读取/消费，旧 lineage 保留可解释的不可用状态。
三类关键失败：原始行/隐私标记混入请求、日志或导出；来源文本诱导越权；冻结后撤权/到期仍继续使用。
复用与开发时点：复用 013/019/031，依赖 A03/A04；先本地记录器，零真实外发。只证明应用路径，不把 Personal trusted-local 解释成 OS 沙箱。联网分析和共享数据前。

本项实施约束：全部原始数据、身份和敏感标记均为人工合成。用本地记录器截获真实待发送请求、日志和导出，不能真的发给外部模型；固定恶意来源只作不可信数据。区分留存引用和继续读取已撤权 payload。结论仅限应用路径，不承诺 OS 沙箱或企业隔离。

前序路线图依赖：A03、A04。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-013-autonomous-exploration-llm
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-019-consumer-insight-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A09 · 目标树、指标驱动与跨目标冲突

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A09 目标树、指标驱动与跨目标冲突
路线图编号：A09
白皮书章节：6.2–6.3、6.8。
唯一验证问题：上层目标与子目标的贡献、依赖和冲突能否正确计算和解释，且修订不改写旧基线？

验证场景与成功信号：一个上层利润目标、两条子目标与毛利护栏；显示贡献依据/依赖，重算合法汇总，目标修订产生新版本并预览受影响计划。
三类关键失败：重复计算/百分比非法相加；方向冲突/资源竞争被忽略；子目标调整悄悄改历史基线。
复用与开发时点：复用 033/037；公式关系、经验关系和因果关系分开。仅三节点/一个组织切片，不造完整 OKR 套件。目标拆解模块前。

本项实施约束：建议一个利润目标、两条子目标和一项毛利护栏。按已确认公式计算可加总关系，经验或因果驱动明确证据强度；不把比率直接相加。目标调整输出新版本与影响预览，不自动批准相关计划变更。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-033-objective-snapshot-gap
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-037-future-action-dashboard

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A10 · 策略组合与资源约束的真实数值决策

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A10 策略组合与资源约束的真实数值决策
路线图编号：A10
白皮书章节：6.6、M6。
唯一验证问题：有限策略在预算、容量、依赖与冲突约束下能否生成可独立复核的组合，并解释无解和不执行选项？

验证场景与成功信号：复用已有策略比较，只补一个有限候选组合问题：合成成本/容量/依赖→枚举或小型求解→可行方案与“不执行”对照→解释权衡。独立穷举核对，预算变化应改变解或判无解。
三类关键失败：无可行解却输出建议；冲突/受众重叠造成重复收益；用预测期望当已实现增量。
复用与开发时点：复用 001 v1.8、020、034、037；依赖 A01/A09 的方法/目标口径。已有参数沙盘不能被说成完全没做，本项验证组合计算增量。策略优化开发前。

本项实施约束：先读 PX-001 v1.8 的策略比较/参数沙盘，保留已验证结论。新增价值是实际有限组合求解。以小集合和独立穷举构建真值，不让被测求解器自证最优；预期收益始终标记为合成假设，不能当实际增量。

前序路线图依赖：A01、A09。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-001-dual-library
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-020-inventory-allocation-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-034-strategy-action-outcome-review
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-037-future-action-dashboard

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A11 · 同一目标案例的经营闭环接续

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A11 同一目标案例的经营闭环接续
路线图编号：A11
白皮书章节：7、12.8、23。
唯一验证问题：同一目标、范围与来源链能否贯通分析、行动、独立观察、复盘和受控学习，同时保持历史不可变？

验证场景与成功信号：从新的一致合成场景实际生成 033 型 Gap→A04 分析→候选→034 型批准/模拟行动→A02 型独立观察评估→035 分类→036 修订/回归/显式新任务采用；037 只消费此链的视图。新任务重新计算，旧链可重放。
三类关键失败：不同目标/人群/时期/方法强接；任务完成或数值上涨就关 Gap；旧批准/学习回流改变旧任务。
复用与开发时点：依赖 A02/A04/A05/A06/A09/A10；每次仅接一个缺口、复用已验证段，受阻先停在该接缝，不重建全平台。若一期不含 Teach，先止于 Review，发布接续留到该模块前。

本项实施约束：这是接续验证，不是重建经营平台。先做依赖可消费性盘点和逐段身份对账；原 035 的两条分支与 037 自包含 fixture 不可换 ID 后假装同一案例。按一段段实际接续验收；前序不兼容时停在最小缺口。首个可审查终点可到 Review，Teach 段待同一场景来源齐备后再冻结增量范围，不能把阶段性成功写成全部完成。

前序路线图依赖：A02、A04、A05、A06、A09、A10。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-029-osm-objective-strategy
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-030-analysis-requirement-co-creation
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-033-objective-snapshot-gap
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-034-strategy-action-outcome-review
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-035-context-commit-routing
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-036-review-teach-pack-adoption
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-037-future-action-dashboard

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## A12 · 周期报告/目标刷新：新一期真实计算

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：A12 周期报告/目标刷新：新一期真实计算
路线图编号：A12
白皮书章节：6.4–6.5、17、22。
唯一验证问题：两期数据的周期计算在重复触发、补数和版本变化时，能否产生独立结果并保留旧报告与批准？

验证场景与成功信号：同一模板两期新数据→实际计算→待审报告/Gap；推进合成时钟模拟重复触发、漏期和补数；本地周期状态可重读，发布仍显式确认。
三类关键失败：重复触发生成重复任务/Gap；迟到数据污染已发布期；模板/口径变化继承旧批准。
复用与开发时点：复用 021/033/A04/A06；只单计划、合成时钟、本地账；不接消息分发或生产定时器。周期分析/自动刷新开发前。

本项实施约束：只一个本地计划、两期合成数据和可推进合成时钟。周期触发驱动实际计算；重复触发与进程恢复需独立对账。迟到补数产生新修订；发布保持显式确认。无需生产 cron、通知或外部分发。

前序路线图依赖：A04、A06。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-021-report-template-module
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-033-objective-snapshot-gap
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-032-semantic-materialization-local-evidence

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B01 · 真实 LLM 的需求访谈与自主探索质量

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B01 真实 LLM 的需求访谈与自主探索质量
路线图编号：B01
白皮书章节：9.1、11.1、14.5、16.10。
唯一验证问题：真实 LLM 在未见合成诉求上的追问、框架和探索建议是否优于固定规则基线，且保持引用与权限边界？

最小验证与三类失败：一组未用于调规则的新合成诉求，比较固定规则与真实模型的追问/框架/引用；失败为编造数据可用性、约束遗漏/注入、超时无效输出。固定模型与预算并保存实际输出。
既有基础与限制：030 纯规则；013 明确 `LIVE EVIDENCE WAIVED`。先做离线盲题夹具，实际 Provider/费用需另行授权；不追认旧豁免为 live PASS。

本项实施约束：先完成盲题集、评价标准、无模型基线、Provider 请求预览及明确预算；按接入点分阶段评价，不能把四项一次串成自动 Agent。013 的真实 live 已被明确豁免，本 Prompt 不撤销该历史决定或授权费用。只有本 session 用户明确授权实际模型、数据边界和预算后才能运行；此前停在 live-ready，不能宣称本题已验证。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-013-autonomous-exploration-llm
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-030-analysis-requirement-co-creation
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-009-autonomous-exploration

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B02 · 深度研究实际采证与引用核验

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B02 深度研究实际采证与引用核验
路线图编号：B02
白皮书章节：9.3、10.1–10.3、12.4、16.7。
唯一验证问题：真实检索与抽取能否把研究主张绑定到原始片段，并处理来源重复、冲突和恶意文本？

最小验证与三类失败：用本地合成文档集合真实检索/抽取→出处/原文片段→相互冲突证据→报告；失败为找不到出处、重复来源冒充独立证据、不可信文本越权。需要联网时再验证一个指定只读来源。
既有基础与限制：010/012 的 UI/replay 已做。先本地实际检索，外网/Provider 另定；不重新做模式切换 UI。

本项实施约束：先用本地合成文档集合实际检索与抽取，以来源文件哈希和片段位置回链，主张必须由独立核对支持。保留来源之间的转载关系，不能把重复文档当独立支持。首轮不依赖外部搜索或付费 LLM；联网来源是后续显式范围，不得把本地验证称为联网研究引擎验证。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-010-deep-research-workbench
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-012-deep-research-autopilot
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B03 · Ontology / Knowledge / Memory 的 Owner 后端接续

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B03 Ontology / Knowledge / Memory 的 Owner 后端接续
路线图编号：B03
白皮书章节：12、15、16.8–16.9、20.1。
唯一验证问题：经正确 Owner 审核的语义候选能否实际进入隔离后端发布，并由新任务解析到精确新版本？

最小验证与三类失败：先选一个 Ontology Candidate：035 Proposal→003/既有隔离发布接缝→新版本→031 新任务解析；失败为 Owner 不符、发布内容漂移、过期/撤权源误召回。Knowledge/Memory 后端若采用不同实现再加合同变体。
既有基础与限制：001–003 已有真实语义接缝，不能当空白；035 仍为本地模拟账。更换真实 Adapter 时复用同一行为测试，不为每种存储造一套平台。

本项实施约束：首轮只选 Ontology Candidate；核对 035 的实际输出是否能进入 003/已有发布接缝，保留显式适配与版本证据。使用独立隔离副本或账库；真实企业库不在范围。Knowledge/Memory 仅记录后续不同后端所需验证，不在首轮同时建设四库。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-001-dual-library
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-002-dual-library-e2e-slice
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-003-semantica-ontology-hub
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-031-context-resolve-binding
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-035-context-commit-routing

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B04 · 通用方法纠错与跨域回归发布

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B04 通用方法纠错与跨域回归发布
路线图编号：B04
白皮书章节：9.6–9.7、20.1。
唯一验证问题：一个通用方法错误能否修成实际可执行的新版本，通过跨域回归并仅被新任务显式采用？

最小验证与三类失败：从 A01 的数值反例生成 Method 修订，对两个领域跑 old-fail/new-pass 与非回归→批准→新任务采用；失败为错交 Domain Pack Owner、只修单案例、旧任务方法被替换。
既有基础与限制：015 有跨资产治理，036 实际修的是领域规则；新增价值是可执行通用方法修复。模型实例衰减沿 005 既有链增补，不另造通用训练平台。

本项实施约束：首轮从 A01 方法选一个可复现计算错误，修复只归 DAME/Analysis Core 对应 Owner。独立复现 old-fail/new-pass，加另一个领域非回归；保留旧方法版本和历史运行。036 的领域规则修复不是本项通用算法修复证据。

前序路线图依赖：A01。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-015-teach
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-036-review-teach-pack-adoption

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B05 · 高风险 Pack 的实际业务方法

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B05 高风险 Pack 的实际业务方法
路线图编号：B05
白皮书章节：9.5、18.9、18.19、19。
唯一验证问题：选定高风险 Domain Pack 的真实数值方法能否在领域前提与成本约束下工作，且不越权生成行动？

最小验证与三类失败：分批选择：023 分类评分/校准和误判成本；024 数值价格/促销情景；025 数量补货；026 数值漏斗/窗口；019/M5 分群；027 人群重叠/频控；022 非随机归因需明确识别条件。共同三类失败为数据/方法前提不成立、目标泄漏/不合理数值、结论越界。
既有基础与限制：当前不少 Pack 明确“无数值/无数量审阅”。不是新做七张资格页；相同方法直接复用 A01/A02/A07/A10，只测本领域差异。每个业务场景单独小 Brief；不一次批准所有模型与算法。

本项实施约束：本项是领域专项入口，不是一轮实现七个 Pack。先只读对照已有资格 Demo，选定一个业务域；优先按实际开发顺序，无新排期时推荐先讨论 023 流失评分/校准。准备该领域一条主链和最多三类失败，其他域留停车场。只把选定域真正需要的 A 类产物作为依赖，不等待所有 A 项。模拟标签或评分不能宣称真实模型质量；使用合成真值的实际计算并明确限制。

前序路线图依赖：A01、A02、A07、A10。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-019-consumer-insight-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-022-channel-roi-attribution-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-023-churn-early-warning-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-024-pricing-promotion-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-025-replenishment-fulfillment-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-026-product-funnel-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-027-marketing-campaign-audience-pack-boundaries

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B06 · A/B 复杂设计扩展

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B06 A/B 复杂设计扩展
路线图编号：B06
白皮书章节：10.4–10.5、附录 H。
唯一验证问题：选定的一种复杂实验设计能否在正确分析单元与停止规则下生成可校准的统计证据？

最小验证与三类失败：仅选择实际需要的一种：聚类随机、比率指标、CUPED 或序贯；使用独立已知真值/仿真校准；失败为分析单元错配、前置数据泄漏、停止规则/多重比较无约束。
既有基础与限制：A02 只证明一种基础设计。没有该类首发输入就延期，不建完整统计平台；冻结方法前核对一手方法资料。

本项实施约束：先查实际首发合同是否需要聚类随机、比率指标、CUPED 或序贯；有需求时只选一种，暂无需求则输出有依据的延期结论。冻结前读一手统计方法资料；用独立参考计算/仿真检查，不以自报 p 值和置信区间证明正确。

前序路线图依赖：A02。通过其 PRODUCT_BRIEF.md 中的路线图编号找到实际 PX、评审和导出；不同实现可替代的依赖要说明依据，不凭编号或旧 PASS 判断可消费。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-022-channel-roi-attribution-pack-boundaries
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-034-strategy-action-outcome-review

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B07 · Phase 2 企业 Serving 消费路径

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B07 Phase 2 企业 Serving 消费路径
路线图编号：B07
白皮书章节：18.21、附录 I.3。
唯一验证问题：同一精确 Model Pack 经企业型消费链到 MLflow Serving 时，能否满足身份、调用权限和 local/serving parity 边界？

最小验证与三类失败：在获批隔离环境做 frontend→backend→薄 MLflowServingAdapter→Serving，同一精确 Pack 的 local/serving parity；失败为身份/版本错配、无权直调、超时/故障却成功。
既有基础与限制：007 已验证 OSS Serving 技术链，005 有静态路线。只补企业路径增量；目前正式仓库方向仍将 enterprise 作为 future work，不借此提前建企业平台。

本项实施约束：先读取正式侧当前两期计划和冻结合同，仅做 research 范围设计。企业路线仍为 future work；本 Prompt 不是正式企业启动授权。若已有相应 Demo 批准，仅使用本地回环隔离前端/后端/薄 Adapter/OSS Serving，比较同一输入同一模型；不连接真实企业服务，不修改正式仓库。生产 RBAC、企业部署与验收继续留给正式侧。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-005-model-pack-demon
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-007-model-pack-mlflow-spike
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-008-model-pack-builder-consumer-spike

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## B08 · 行动任务适配器与独立回执接续

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：B08 行动任务适配器与独立回执接续
路线图编号：B08
白皮书章节：6.7、17、21。
唯一验证问题：批准后的行动通过实际服务边界同步并接回独立回执时，能否避免重复执行和虚假完成或回滚？

最小验证与三类失败：只接本地假业务服务，以真实回环 HTTP 发送获批任务、查询状态、接收独立回执；断开并恢复连接后对账。失败为重复请求/应答丢失导致重复创建、过期/错任务回执、部分执行被取消后误记完全回滚。
既有基础与限制：001 v2.1、034/037 已证明模拟执行治理；本项只补进程/服务边界增量，不发送真实业务任务。真实渠道连接仍由正式侧验收。

本项实施约束：使用本机回环 HTTP 的假业务服务，真实请求、持久化与应答故障，业务对象全部合成。区分指令接受、实际执行和独立回执；部分执行后取消仅记录已执行范围与停止结果，不伪称完整回滚。不得连接任务管理/营销/供应链真实系统或发送真实消息。

没有新增 A 类硬前置；先核对下列已有探索的实际产物和本项差异。
已有探索目录（逐项读取最新记录，运行证据需重新核验）：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-001-dual-library
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-034-strategy-action-outcome-review
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-037-future-action-dashboard

执行与交付：
1. 在 PROJECTS.md 和 explorations/*/PRODUCT_BRIEF.md 查本项名称及“路线图编号”，先恢复已存在的同主题探索；确认没有后，按台账分配唯一 PX ID，先登记再建 PRODUCT_BRIEF.md/NEXT_ACTION.md。A/B/U 是路线图编号，不是可直接替换成 PX 的流水号。写入前重读共享文件，只合入本项最小增量，保留其他 session 的改动。存在并发登记冲突时先对账，不覆盖。
2. 读取上游各自 PRODUCT_BRIEF.md、NEXT_ACTION.md、DEMO_BRIEF.md 最新评审，再核对实际公共入口/导出与来源指纹。区分实际消费、适配、仅参考和未验证；不以手填同名对象、换 ID 或复制预置结果冒充接续。前置产物未就绪时，先完成本项可独立的讨论和 Brief 草案，列出一个最小待补输入；保持受依赖执行未开始，不代做其他项目。
3. 为本项准备七项最小输入：目标用户、一个场景、唯一问题、一条主链/最多三类失败、数据与依赖边界、可观察验收、可写路径/启动方式。范围内可逆选择直接给推荐，不追加生产 Schema、完整治理平台或冗长审批包。需要实质选择时只问最高价值问题。
4. 若本 session 或已登记决策已明确批准相同范围，直接沿用批准并冻结 Brief；否则七项输入齐备后只提出一次 Demo Gate，并停在该 Gate。获批后再生成逐项明确的 OpenCode 接力 Prompt 并停止，由用户手动转交；不自动启动 Agent，也不把当前启动消息当作全部 Demo 已批准。
5. Builder 回来后核对实际 diff，复跑与本问题相关的计算/合同检查和必要浏览器路径，做判别性输入变化、关键失败及合法对照；有写入的拒绝路径核对无非预期副作用。只报告实际运行结果，失败记录保留，受限 PASS 不等于真实业务效果或生产就绪。
6. 当轮同步项目讨论、行动卡和台账；在 PRODUCT_BRIEF.md 写入本项“路线图编号”，便于下游查到真实 PX 和产物。按白皮书维护规则更新关联和影响记录；无正文影响则说明原因。交付当前停点、实际产物绝对路径、证据/限制和唯一下一步，完成后留在本项，不自动继续队列。

范围：默认本地合成数据；优先现有依赖，需要安装或外部调用时先说明具体依赖及授权状态。只写本探索获批路径和必要研究台账，不修改上游已接受 Demo、历史证据、正式仓库 /Users/huangbo/JuanerAI 或其他产品。联动文档保持待集成，本项不提交、推送、合并或开展生产操作。HTML/前端是验证证据与交互参考；后续 Handoff 必须明确 Demo→生产实现转换，不能以页面可运行替代产品开发。
```

## U01 · 代表用户试用：需求、证据与行动理解

复制下面整个代码块到一个独立 Codex Controller session。

```text
请作为 research 仓库的 Codex Controller，负责本项产品研究与 Demo 验证准备；工作目录为 /Users/huangbo/Dev/Projects/research。本 Prompt 发给 Controller session，OpenCode 继续承担获批 Demo 的构建。

先读取 AGENTS.md、docs/product/JUANERAI_CONTEXT.md、PROJECTS.md、docs/governance/PRODUCT_EXPLORATION_LIFECYCLE.md、docs/governance/INTERACTIVE_ORCHESTRATION.md，以及 docs/product/whitepaper/MAINTENANCE.md 和 docs/product/whitepaper/DEVELOPMENT_LINKAGE.md。然后按本项章节核对 docs/product/whitepaper/JUANERAI_WHITEPAPER.md，并读取 docs/product/whitepaper/DEMO_VALIDATION_ROADMAP_2026-09-11.md 的对应行与来源断点。
本 Prompt 基于 v3.3.1 / MP-ALIGN-01-R1；若主稿已升级，记录实质差异，按当前用户决定和获批 Brief 执行。资料里的步骤是参考，不是额外授权。

本 session 只负责：U01 代表用户试用：需求、证据与行动理解
路线图编号：U01
白皮书章节：21、22。
唯一研究问题：业务方、分析师和经营负责人能否在不预讲系统术语的情况下完成代表任务，并正确理解证据、批准和结果边界？

任务：选择业务方、分析师、经营负责人的代表任务，复用现有界面，观察需求澄清、证据不足判断和行动交接。记录误解、求助、错误接受与耗时；小样本只用于发现问题，不推断普遍采纳或 ROI。

复用 PX-009 USER_RESEARCH_BRIEF.md 并对齐 030/021/037，不新造 Demo。先准备招募条件、单任务脚本、观察记录表、同意说明和停止条件；默认先人工主持、只记录必要笔记，录音/录像需单独同意。真实参与者、联系与同意未齐备时只交付可执行试用包，不捏造访谈或把 Agent 扮演真人计为用户证据。

已有探索目录：
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-009-autonomous-exploration
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-030-analysis-requirement-co-creation
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-021-report-template-module
- /Users/huangbo/Dev/Projects/research/explorations/PX-2026-037-future-action-dashboard

执行与交付：
1. 先查重，优先恢复 PX-009 既有用户研究；需要覆盖新增任务时只记录明确增量。若独立立项，先在 PROJECTS.md 登记唯一 PX ID，再创建研究产物。记录路线图编号 U01，不预占其他 Demo 的 ID。
2. 读取已有 USER_RESEARCH_BRIEF.md、相关行动卡与真实 Demo 使用边界，选择每类角色的代表任务。完成主持脚本、合成材料、观察表、招募/同意与停止条件，形成可直接审阅的研究包。
3. 已有研究授权直接沿用；缺少真实试用授权、参与者或同意时，先交付准备完成的研究包，只询问当前必须确定的一项，不招募、不联系、不录制。AI 预演可检查脚本但不计入真人证据。
4. 获得相应授权与真实参与记录后，按观察事实整理问题严重度、影响任务和对应 Demo 改进建议。不要把小样本当成市场验证，不擅自改 Demo 或开启新的构建。
5. 同步研究记录、行动卡、PROJECTS.md 和白皮书影响；保留旧评审/批准历史。交付实际研究材料、已完成/未完成事实及一个下一动作。此项是用户研究，不生成 OpenCode 构建授权。

范围：只用合成业务材料；当前仅准备真人验证，不读取真实会员资料、不向第三方发送消息、不修改正式仓库、不提交推送或合并。未来如果需要改 Demo，回到该探索的最小变更流程。白皮书正文无影响时明确记录，开发联动继续待集成。
```

