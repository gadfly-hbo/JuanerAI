## 当前正式Git交付授权（2026-10-15）

用户已在本任务明确授权本冻结离线候选正式Git交付及OpenSpec归档，当前按 [publication.md](publication.md) 推进。此授权取代下文“Git/归档未授权”的历史停止点，仅限本任务；真实Provider、生产、其他产品与共享SDK正式发布边界不变。保留F-ROLE-01具名豁免、原Validator BLOCKED/历史失败/UNKNOWN，不改写为无条件PASS。

## 当前用户产品接受（2026-10-15）

用户在本任务直接表示“采纳，接受产品”，本冻结候选的既有离线合成/显式opt-in交付范围 Product Acceptance 已收到；详见 [产品接受](product-acceptance.md)。原F-ROLE-01具名豁免及正式Validator BLOCKED、历史失败和UNKNOWN保留。没有逐项本人复跑或真实Provider/生产/Git/归档通过的推断；下文PENDING/尚未用户验收均按此前时点历史阅读。冻结代码/SDK/依赖/测试不变，原合成业务Task状态与用户产品决定分列记录。

# Pi 接入 R1～R4 修复：接收核对

## 当前接续状态（2026-10-15，原接收文本为历史）

冻结 R1～R4＋D1～D8 A 的离线合成 opt-in 结果已 Engineering Acceptance，附用户仅针对本候选的 **F-ROLE-01 具名豁免**。独立正式 **BLOCKED F-ROLE-01** 原文保留，技术评估 PASS，不改写为无条件 Validator PASS。canonical002：4610 PASS／1 真实 Provider SKIP／0 FAIL；独立131 PASS。详细候选/安装身份、风险、原报告及返回点见 [工程接收](engineering-acceptance.md)。本次只回填记录，不改冻结代码、SDK、依赖或测试。下文较早“当前/待评审/未接收”均为对应时点历史，不覆盖此结论；历史失败与 UNKNOWN 保留。用户 Product Acceptance、生产准入、Provider、Git 和正式归档均未完成或放行。

当前状态：2026-10-14续行，报告已补齐、最小合同/消费者已交付、独立纠错切片已完成本地验证。SDK实际接口/固定新包联合验证待完成。下文初次缺材料记录为历史；当前接收增量及verification.md优先。

## 权限与固定身份

用户当前直接授权路线 B 严格边界组合：独立工作树、R1～R4 必要规格/TDD/实现、离线合成验证、独立审查，以及 SDK 新精确固定包交付后的受控采用。禁止真实 Provider/凭据调用、业务恢复重放、服务/试用安装切换、迁移、其他产品升级，以及提交/推送/合并/发布。

- 设备：`bendandebabadeMac-mini.local`；唯一写入者：当前聊天的原生 Mini Engineering Controller。
- 工作树：`/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI`。
- 分支：`work/mac-mini/pi-r1-r4-repair`。
- fetch 后基线与随后远端 main readback：`8265a3920ee1205faec7dede8b0c84e648105d9d`。
- 原入口 `/Users/bendandebaba/.codex/worktrees/3098/JuanerAI` 保持 clean detached；没有切换原目录分支。
- 已读其他工作树的 Git 状态，存在 WIP；只留状态清单，不复制 WIP，不改其他任务的状态、依赖、服务或停止线。本工作树从 main 带来的项目板仅是历史副本，原件留在 evidence，自己的板只描述本任务。
- 主线变化和 Change007 重叠路径仍须在未来集成时按实际 diff 核对；隔离不等于免冲突。

## 缺失正式输入与真实停止点

完整报告 `JUANERAI-PI-FULL-STACK-AUDIT-2026-10-14.md` 只给出 MacBook 路径 `/Users/huangbo/.codex/visualizations/2026/09/28/01a0e5c7-83ed-7143-a785-59aaeb483f4d/`；该文件本机不存在。本机 attachments、visualizations、JuanerAI-artifacts 的同名文件查找未取得副本。这是有界查找，不声明全盘不存在。

按用户“材料缺失时明确请求该材料，不从旧聊天补猜；可继续不依赖缺失内容的只读核对”，已请求可读副本。报告 finding/V01～V17 对应关系保持未核对。不能把旧 PR82 修复记录代替该报告，也不能把 MacBook 故障当作本机复现。

SDK 最小需求草案见 [design.md](design.md)，尚未经报告和 SDK 项目回执完成双方对齐；不命名尚未交付的新 SDK 版本，不创建产品内临时 SDK 替代物。不向其他聊天自行发消息。

## 本次结果与边界

R1：小业务 catalog、原生有界获准读取、全资料本地计算；实际 Provider 投影后每次完整上下文准入及压缩后重查。

R2：stop/error/known usage、一次额外尝试、全部物理调用同 Task 计量，以及安全诊断和持久/UI 读回保真。

R3：全部实际业务工具输出预算、完整证据本地保留、适用引用读取；纠错回执不外发完整 inspection，保留一次明确纠错。

R4：每个用途内真实消费已批准主备候选，重新检查接收方、窗口、协议与能力；分析和报告用途不同不等于 fallback。

复用 Application/业务 Port → Pi Adapter → 固定共享包 → Pi 原生机制；不建第二工具循环、Session、分页/压缩/恢复引擎。R5 完整 grep/find/ls、R6 全面兼容退役与 Session 后端替换延期。本轮没有删除项。

当前允许写入只有本 Change 材料、自己工作树的项目板以及专属证据根。生产代码与测试尚未更改；待报告取得并完成适用原规格、UI 合同与共同接缝核对后，在本 Change 细化实现允许/条件路径。禁止其他工作树写入、旧包字节修改、SDK 工作目录/可变链接接入、真实业务库读写。

当前读完 AGENTS/CONTEXT、执行政策 v0.9、testing/DoD、ADR0003、数据/安全边界、Ports/Adapters、部署/包合同和共享 AGENT-RUNTIME v0.3。读过 PR82 原修复记录和相关源码。适用 OpenSpec 全文/UI 合同及剩余接点核对未完成，不声称正式 intake、规格冻结、RED/GREEN 或工程接受。此处仅为修复接收记录，不新建产品计划或额外 Gate。

本轮材料尚未提交；仅本机留存，不是已 Git 集成的永久项目资产。

## 当前接收增量（取代上文缺材料停止状态，保留历史）

2026-10-14：报告、修订 Mini/SDK 提示与启动文件来自 `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-handoff/2026-10-14/bundle-001/`；四项 SHA256SUMS 核验通过。用户明确纠正：最小合同及合成消费者是本任务产出，不是外部前置材料。本次先交付它们，继续无 SDK 新接口依赖的修正。

当前允许路径增加：`packages/application/open-analysis.ts`（模型侧纠错回包）；`tests/integration/xanthil-desktop/open-analysis-application.integration.test.ts`（保留原执行/纠错约束的受影响测试）。后续 Adapter/账本/持久/UI 变更按新 SDK 接缝细化，不授权非 R1～R4 内容。SDK0.4.3 已独立 npm ci --ignore-scripts 安装；49 文件与固定 tgz 逐字节一致，源码和 lock 未更改。

UI 外观和已批准分析流程本切片不变；仍是原单次纠错、真实 SOURCES[0]、原始范围/IR、原成功条件。可读资料投影/续读完整 R1 接通仍待联合实现，不宣称完成 R3。原范围限制和 Git/Provider 禁止继续有效。
