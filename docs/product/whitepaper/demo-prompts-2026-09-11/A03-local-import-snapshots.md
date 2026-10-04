# A03 · 本地文件导入→数据质量→不可变快照

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
