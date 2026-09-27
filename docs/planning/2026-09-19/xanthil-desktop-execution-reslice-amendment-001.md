# PKG-XANTHIL-DESKTOP-001 — Execution Reslice Amendment 001

## 1. 决定、状态和适用范围

2026-09-19 用户确认[执行拆分方案 v0.1](xanthil-desktop-execution-reslice-proposal-v0.1.md)。
本文将该方案整理为本包的正式续接补充；不改变 Blueprint、产品目标或已接受 UI。
**当前：独立准备就绪审查 PASS；用户已授权发布、手动转发及按本补充续接。**
2026-09-19 用户在 Controller 明确说明 §2 残余 UNKNOWN 和 §6 新批次预算后授权。
以下执行条款在原 Mini 任务完成固定 Git 身份接收后生效；接收前 Mini 仍停止。
该授权不是本文已经提交、推送、送达或角色 Gate 已通过的证明。

| 绑定 | 精确值 |
|---|---|
| 包 / Change | `PKG-XANTHIL-DESKTOP-001` / `xanthil-desktop-membership-repurchase-decision-case` |
| 原 Mini 任务 | `纵切-1.0 / 01a0b45a-13ad-7b92-a2b4-cdde980558e1`，继续此任务，不另建或迁移 |
| 执行仓库 / 独占分支 | `/Users/bendandebaba/JuanerAI` / `work/macbook/whitepaper-blueprint-v1` |
| 接收前 HEAD / tree | `f5e4f62bd632360c282b5b93c5f2664498e311c6` / `009ed7849fed0e8430382b744049385af3a54c9b` |
| upstream | `origin/work/macbook/whitepaper-blueprint-v1` |
| MacBook 发布分支 | `work/macbook/wip-preflight-exception-disposition`，不写 Mini 分支 |
| 当前停止 | `TEST_RESUME_STOPPED_INVALID_EVIDENCE_BUDGET_EXHAUSTED`；旧 Recovery 2/2 用尽 |
| 新包身份 | 授权发布后，由发布回执绑定实际 commit/tree/parent、完整文件清单及各文件 bytes/SHA-256；禁止猜测 SHA |

生效后，本文只覆盖[原包](xanthil-desktop-first-product-change-execution-package-v1.0.md)
及 Recovery/Resume 补充的整包 Test→Worker 粒度、单次续接预算、下述 P4/P5 阶段约束
和一次定向 Spec 收口权限。此前冻结文档原文保留，耗尽额度不能重放。
[技术决策委托](xanthil-desktop-technical-decision-amendment-001.md)、
[执行政策](../../governance/product-change-execution-policy.md)、
[角色路由](../../governance/agent-model-routing.md)、
[复杂度控制](../../governance/change-complexity-control.md)、
[测试政策](../../../.ai-coding/policies/testing.md)及
[完成标准](../../../.ai-coding/definition-of-done.md)其余边界不变。
本次不会改长期状态机或扩大 Host Loop 权限。

## 2. 接受哪些残余不确定性，不接受哪些结论

本补充的整体续接授权须明确包括：保留本次已披露的语法命令/环境/输入归属缺失，
以及错误命令中两个未获证实目录效果的 UNKNOWN，接受它们继续作为历史未决事实，
从已封存现场建立新的有效证据；不追认命令偏差、不恢复撤回的 PASS、不重跑补造历史。
两个目录是 Mini 仓库内 `.juanerai/toolchains/xanthil-desktop-001` 和
`/private/tmp/xanthil-desktop-matrix-001`。后续不使用、探查修复或清理它们；只使用
原批准工具根及新建的隔离测试 Project。新操作的副作用未知不在此接受范围内。

已捕获的 coverage 命令退出 127、Node 未启动；它不是工具链损坏或有效 RED。
测试实质缺口仍须修正，31 份现场保全不代表正确。旧四次纠正及 Recovery 2/2
均保留，Worker 未启动，不能把新的阶段名称当成旧失败已经关闭。

证据唯一根沿用
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`，
下列文件位于其 `technical-decision-001/`：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `test-resume-stop-index-001.json` | 95836 | `e3e639db8c58f1ac47165b90c3f37bbab1b1a681dc654d5363e12769eb36353b` |
| `test-resume-exception-receipt-001.md` | 11840 | `8538980fb2b3342c708d45b4bc494768a9f955f051bfbff46a7f431854e54573` |

MacBook 已只读读取原件、核对索引内 213 项文件身份引用并抽查具体源码；本补充
准备时再次核对接收 HEAD/tree、31 路径状态及封存身份。没有重跑产品矩阵、P4、
工具安装、WIP 或服务；不是产品验收或跨设备备份。旧 Change 仍为
`BLOCKED / DISPATCH_ORPHAN_READY`，不是 CLOSED。

## 3. 正式续接的第一步

Mini 在原任务核对发布回执、设备/仓库/branch/upstream 和无竞争写入。只定向取得
已发布的精确提交，核对 tree、唯一 parent、完整 diff 和各文件身份；对索引中
31 份现场/封存副本读回，保存新接收前快照后一次 ff-only 接收，再证明现场不变。
已有同提交则核对后跳过。差异、未知文件或冲突停止，不 reset/stash/clean/覆盖，
不为了 clean 提前提交。此次不重新取得特权或读取旧 WIP 权威。

协调者仅更新现有 `verification.md/traceability.md/tasks.md`：注明本补充已生效、
历史异常/预算、待收口的执行合同及下一许可动作。原 Spec PASS 是先前字节的记录，
不会自动覆盖新的阶段规则；Test 和 Worker 此时仍锁定。

## 4. 一次定向 Spec 收口

在 Mini 派发全新正式 `juaner_spec / R2 xhigh`；沿用配置模型，不替换为普通 Agent。
其唯一写集为原 Change 中这十二份既有 Markdown：
`proposal.md`、`design.md`、`tasks.md`、`test-plan.md`、`verification.md`、
`traceability.md`、`path-contract.md`、`decision-brief.md`、`dependency-decision.md`、
`structure-decision.md`、`specs/xanthil-desktop-decision-case/spec.md`、
`specs/local-analysis/spec.md`。不写源码、测试、配置、看板或旧状态。

只收口以下内容，不重新选择 Runtime、数据库、依赖、目录或产品语义：

1. 将方案中的四单元划为有序的小循环，列全 AC 证据叶、公共业务接缝、依赖、
   每次 Test/Worker 精确文件与行为写集、焦点命令、健康检查、回归及停止线。
   U1 起呈现已批准真实 Desktop UI；小循环可以先实现必要接缝，但 U1 交付必须
   是真实 `.app` 的创建/保存/重开，不把纯底层成果当成 U1 完成。
2. 保留全部 91 AC 的最终验收内容；仅定向调整执行阶段/配置措辞，不声称原文全未变。
   未到达的断言标未验证；同一 AC 跨循环时，全部必需证据叶完成才算整个 AC 完成。
3. 冻结有限临时开发配置元组：每项列确切 manifest/build/TypeScript 文件图和可执行
   验证入口。原 43 文件保留，新增只取原 P5 枚举的 25 文件，最终是原完整 P5。
   只能精确匹配已列元组；无任意子集、通配图、运行时阶段选择器、假导出/空文件、
   第二 app、宽松类型检查或依赖变化。已有辅助模块尚未实现不能用伪成功填充。
4. 调整 TEST-XCLI-021 及 validation runner 的阶段配置预期，使已经实现的行为可
   验证、未实现行为仍未验证。仅本批准许这些临时配置；最终删除临时配置识别分支，
   恢复完整 P4/P5 判定与全量 P5 runner。旧业务断言、TEST-XCLI-022 和 lock 不变。
5. 定义命令的确定性环境和原始结果记录，沿用既有 Test 原生故障控制/真实进程/
   SQLite/文件接缝，不创建新 fault API、通用测试框架或管理系统。

正式 Spec 返回后，对完整 OpenSpec diff 作 ponytail 审查及受影响 Spec Gate。
若需要范围外决定、无法形成可构建的精确元组或仍有承重歧义，停止回 Controller；
不是派发 Test 再猜。本文只授一次定向 Spec 修订返回；需要再一次实质返修须交回，
不能消费 Test 额度代替。审查不改变已接受 UI，亦不重新进行旧 D1-A 或签名流程。

## 5. 四单元内的小步 Test / Worker 流程

| 单元顺序 | 用户行为与关闭点 | 同步证明的边界 |
|---|---|---|
| U1 案例工作台 | 真实专业 Session、问题/背景等手工表单、三目录完整创建及关闭重开 | 既定完整 schema/身份约束、Session COMMIT 未知结果、Main/IPC/Renderer 隔离、Preview 零作用；不调用模型 |
| U2 本地复购证据 | 双 CSV 确认→独立计算一致→Review Finding | 原始数据零外发、数值/过滤边界、Run 3.0 两点发布、终态/崩溃恢复/完整性、旧 CLI 兼容 |
| U3 手工决策报告 | Finding 接受→候选比较或证据不足→单独完成→导出/重开 | 非关闭选择、历史及 Completed 保护、报告故障、实际内容与 provenance |
| U4 可选辅助 | 原三个 UI 动作的披露、Draft 编辑/采纳/拒绝与失败手工回退 | Runtime Port/Adapter 合同、隐私、准入/终态、真实 Application/store、同生产 app 读取合成持久状态；不调用真实 Provider |

用户操作顺序不变：U4 完成后“帮我整理问题”仍可在导入/聚合前使用。Quick/Fork/
Subagent/通用 Skill/Prompt 仍按原合同可见但 Preview，不激活其真实执行。
U1 起保留完整已接受 UI 层级；未接通的首纵切入口明确为开发未完成，不能伪造结果，
也不能成为最终交付的永久降级。最终 UI 必须满足原已批准行为。

每个小循环严格串行：

1. 新上下文正式 `juaner_test / R2 xhigh` 先读取冻结输入及既有缺陷，派发限一个
   可观察行为及必要正/负/故障条件；先查独立 oracle、夹具/原生控制健康。
   表格行不是一次打包派发全部测试的理由。作用域内通过原始命令证明因果 RED。
2. Mini 协调者在原记录核对并授予**仅该范围的 TDD_READY**：确切测试身份、
   已执行断言/未验证部分、健康检查、因果 RED、测试资产分类、前置 GREEN、
   Worker 精确路径/允许行为与禁止行为。不是整包 PASS，也不提前释放同文件其余功能。
3. 新上下文正式 `juaner_worker / R2 xhigh` 只实现该范围，测试/规范只读。
   新行为必须先有 RED；原已通过行为作为基线，不伪造 RED。只改实现直到焦点 GREEN
   并完成受影响旧/新回归；测试冲突返回正式 Test，不允许 Worker 改断言。
4. 协调者检查证据并记录该循环完成，正常进入下一已冻结循环，无需用户逐轮转发。
   共享文件变动触及先前结论时重跑受影响证据，不能只引用旧 hash 的 PASS。

RED 的边界：工具、依赖、语法、夹具、装载错误不是产品 RED。初始确无公共实现时，
只能把健康驱动在已批准接缝观察到的该能力缺失作为其最小接缝实现的 RED；它不证明
其余数值、故障、并发或 GUI 断言正确，不释放整套模块。对应入口建立后，这些行为
必须逐项建立自身因果证据。真实实包/原生 GUI 后置到该构建可用，不用缺 app 报错
冒充 GUI RED；生产 UI 实现仍由已冻结的 UI/IPC 行为约束及适用因果 RED 驱动。

测试写集仅原 16 路径：`tests/fixtures/xanthil-desktop/` 下既有
`coverage-map.ts`、`desktop-contract-drivers.ts`、`desktop-e2e-harness.ts`、
`desktop-fixtures.ts`、`members.csv`、`orders.csv`；既有两份 unit、四份 contract、
两份 integration、一份 e2e 文件及 `tools/harness/validation/run.test.mjs`，
精确清单从停止索引 `files` 中 Test 项读回并写入正式 brief，不能改用目录通配授权。
额外只重新开放 `tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts`
中 TEST-XCLI-021 的原配置 oracle/局部 helper/相关测试体，用于临时元组及最终退休；
其他 TEST-XCLI 不变。Worker 只用原 `path-contract.md` 的明确 P5 文件集合的本循环
子集，新增文件名或目录不由本补充授权。协调者不代写永久测试或生产代码。

## 6. 命令、预算和记录

批准的 Mini 工具 bin 是原证据根下
`dependency-preflight-001/toolchain-001/bin`，命令局部
`JUANERAI_TOOLCHAIN_BIN` 及 `PATH=<该绝对 bin>:/usr/bin:/bin` 不得更换。
Node 命令必须使用该 bin 下的 `/node` 绝对路径；npm 使用同 bin 的绝对入口。
保持原批准版本和清洁环境，不读取/打印全局环境或凭据，不继承真实模型 gate。
正式 Spec/协调者从既有批准记录继承其余环境字段，在 `test-plan.md` 展开成完整
argv/cwd/env 与输出位置后才派发。角色收到完整命令，不能自行猜路径或临时配置。

允许范围内离线语法、夹具健康检查在编写期进行；用原生 `--check`、`--test` 及
已批准 npm/build/validation 入口，不安装、不联网、不重做 P1–P4。焦点选择器只
改变本循环验证范围，不代表最终全量 GREEN；最终使用未删减的全量命令。
保留命令、输入 hash、开始/结束、数字退出码/信号和完整 stdout/stderr；失败不能被
静默重定向、管道或进程替换隐藏。复用已有记录方式，不造新 runner。

激活后预算为：一次定向 Spec 返回、冻结小循环清单内各一次 Test 编写/首次验证，
**整批额外 Test 纠正—验证最多 2 次，同一根因最多 1 次**。新额度起点为 0/2，
与历史四次纠正、已耗尽 Recovery 2/2 分列，不重置、追认或抵扣历史。
首次分段编写必须明确继承并修正已知缺陷，不能把它们宣称为未发生过的新问题。

纠正开始前协调者登记根因、变化、路径/命令及余额；一次纠正包括一组必要不同入口
各一遍验证。再次修改/重跑失败入口再计；命令装配、测试体、夹具修正合并计数，
不能额外叠加长期自纠正的 3 轮。健康检查失败后修订再验证同样计数。合法因果 RED
转 Worker→GREEN 不消耗 Test 纠正额度。只读静态检查不消耗，但不借此运行产品。
后续循环不重新发额度，改名称/Agent/Spec/文件不能重置；清单冻结后不能增加循环
来将同一问题改称首次验证。Worker/Validator 的既有修订和复杂度停止线不扩张。

无根因收敛、预算耗尽仍有阻塞、新的证据或副作用未知、权限/业务/合同范围越界，
均停止集中交回。不得将缺输出的辅助检查自动提升为产品失败或有效 RED；若影响能
证明仅在已批准隔离范围，按现有规则记录无效证据，在剩余预算内处置，无逐命令审批。

## 7. 最终关闭及未授予权限

完成四单元不等于 Change 完成。最终必须：所有 91 AC 的适用证据叶、完整 P5 图和
原有回归、真实打包全流程/两尺寸/键盘与失败恢复、同一冻结 `.app` 的正常无调试
原生 chooser 验收、[测试资产退休 Gate](../../governance/test-asset-retirement.md)、
全新独立 `juaner_validator / R2 xhigh`、MacBook/用户最终验收。
真实 Provider 仍 NOT RUN，不作为离线通过的一部分。临时配置/测试分支只在接替
证明和退休 Gate 下移除；不删除无继承者的行为测试或原始失败证据。

原包 Validator PASS 后的 Mini commit/push/PR 权限保持；不新增提前交付、merge、
main 写入、archive 或 release 权限。MacBook 获准提交推送本补充并生成一次手动
转发回执，不自动发送；原 Mini 任务接收后才生效。
一次性 full-index 豁免不复用。除本补充明确阶段/配置条款，其余停止线保留。
禁止重做 WIP/安装、操作旧 Host Loop/State/pointer/pause/Ledger、真实数据/Provider、
改主机权限、清理未知目录或扩展产品范围。

## 8. 审查与发布状态

- 用户已确认：执行拆分方案；不重新请求同一产品/UI 决定。
- [独立只读准备就绪审查 001](reviews/execution-reslice-readiness-review-001.md)：PASS；
  仅审查本补充的可执行性/边界，不代替 Mini Spec Gate，也不授予重新选择既定 Run 合同的权限。
- 发布/手动转发与异常续接整体授权：用户于 2026-09-19 明确授予，含 §2 残余 UNKNOWN 及 §6 新批次预算；不追认历史偏差。
- 实际 commit/tree/文件 hash：发布后填入单独发布回执；固定接收前不声明 Mini 已激活。
