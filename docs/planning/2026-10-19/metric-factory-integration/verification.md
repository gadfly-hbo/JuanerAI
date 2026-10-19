# metric-factory 接入 · 当前结果与接续

2026-10-19，Mac mini；当前为规划／盘点结果，工程未接收、未完成接线。唯一当前结果在本记录；没有改写其他 Change 的工程看板、WIP 或旧失败。

## 身份与证据

- 宿主工作区：`/Users/bendandebaba/.codex/worktrees/e7fc/JuanerAI`；入场 detached HEAD `41e6c1f167cea578960a2d0c75e86e5f31a9190e`，tree `adfee55bfd25b24f4cff06b5589aab0db9e470ed`，起点干净。已在同一工作区建立 `work/mac-mini/metric-factory-integration`，只写本规划目录。
- 供应原仓：`macbook:/Users/huangbo/Dev/Projects/metric-factory`，main，`169faa8d45e1c5616c004f8fb844a7ca68add156`，tree `5abc15b6cbf5773fd63ee5cfc128fa95d48f9ff4`。未跟踪 `.codebase-memory/`、`.flow/archive-m3-20261018/state.json`、`my-instance/` 保留且未复制；没有远端写入。
- `f9c08fd`→`169faa8` 仅启动文档改动；业务源未变。kickoff 实读为更正后的整个产品插件接入，不是 SAP 安装。
- 持久证据根：`/Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001`，归 Mini。`source-readonly.tar` 为 222 文件研究子集，3450880 bytes，SHA-256 `db2810ad9e2c346d5fb8faafa247012b8d2e0203c92c2e365496d4d4c727e327`；`source-identity.json` 有逐文件清单并已独立读回。没有 vendor SDK、运行依赖、真实实例或 releases，不是交付包。
- `supplier-prototype-identity.json` 固定供应产品原型 7 文件研究快照；来源 `/Users/huangbo/Documents/Codex/2026-10-18/task/metric-factory-product-prototype`。原字节在 `supplier-prototype/`，未启动原产品。
- 本机标准最后修改提交 `6756546a1423162b16a552b24b83bdaa1e834e50`（PR93）；当前宿主基线已包含。standard SHA `cd37ea5686df1819e360f4e04aaa3e691d432f7bfff1e14d2f63f46baa3b5f10`；reference SHA `f9eb323b278b960bbeeae730222639058bbb91d98234fca2fdcb7194ee06e110`；checklist SHA `754382cb2a71db3ba9393a6ef3b20843bf8579f29bc6ff02410bd862e57abe89`。
- MacBook 指定宿主 `/Users/huangbo/JuanerAI` 当前 HEAD `c01b68b639156344b2257e45a69892268c17693f`，三个指定标准文件实际不存在；SSH 读取摘要 exit 1。未切分支、同步或修复该工作区。标准采用以上本机已发布字节。
- 已完整读取本机 `~/Dev/Projects/pi-agent-runtime/docs/AGENT-RUNTIME.md`；文档与 SDK 版本分别固定。此本机 checkout 不代表供应 SDK 已满足当前标准。
- 旧工程看板仍是其他任务历史快照，不作为本任务 WIP 空闲证明。旧 active-change pointer 的实际位置本轮未确认，记 UNKNOWN；未编辑或启动旧 Host Loop。确认本次工程 intake 前重新核查；不阻止当前只读研究与产品输入准备。
- 实际主会话模型／effort 的可验证读回本轮未提供，UNKNOWN；工具边界为 danger-full-access / approval never。没有将配置文件当角色已加载证据，未启动工程 Validator 或 CLI 替代角色。

## 发现与适用性

事实源：固定快照中的 src/llm/env-auto.ts:32–96、pi-client.ts:93–162、index.ts:1–5；src/ui/server.ts 的 createUiServer／save-as-method／deliver；src/ui/public/app.js 的 stop-generation；docs/工作台使用指南.md。通过代码图定位接点后读实际源码。图不索引 public 前端，使用已知文件的定向读取。

盘点发现已经纳入 proposal §4：目录发现、宿主准入、稳定任务与账本、真实停止、Pi 直接依赖、只读模板与用户方法目录、宿主副本和完整随包资源。上述为实码差异，尚无修复，不宣称标准符合。供应历史 13 lint／478 tests(+1 skip)／contract 及 Xiaomi 成功／MiniMax 失败只保留为 kickoff 声明，未重跑或抹去失败。

C01–C12 均按本次产品实际能力评估；C04 仅用户显式输入／模板／选中材料的外发，首接不导入宿主 Case；C10 必须验证合成实际 SDK 并保留真实 Provider 未授权未执行。SAP 消费反例不冒充本 Change 安装验证，本任务只检查保存的产物身份／篡改拒绝。

## 验证与未执行

当前源读取与副本哈希已完成。四个审核 JS 的 `node --check` 均 exit 0；本地 Markdown／HTML 引用核对没有缺失；供应原型三核心文件逐字保持；十份正式供应附件 SHA 读回相符。见证据根 `planning-static-checks-001.json`、`planning-static-checks-002.json`。这只证明语法与材料完整性。

浏览器工具拒绝 `file://`，且禁止经其他服务或控制面绕过；未绕过。实际浏览器交互、截图及 1440×900／1366×768／390px 均 `BLOCKED_NOT_RUN`。审核 HTML 可由用户手动打开；不能据静态检查宣称视觉或正常路径 PASS。

首次独立产品计划审查为 [NEEDS_CLARIFICATION / G1](reviews/readiness-001.md)：缺可独立使用的生产业务门。原候选保存在 `planning-candidate-001/`。已补 [正式业务附件](supplier-business-baseline.md) 及固定原文，并明确 D-MF-01 指南／界面与服务端口径门不一致及待批准修正。新的独立 Reviewer 返回 [计划 PASS](reviews/readiness-002.md)，无必需修正，首次失败保留。其实际模型／effort 读回 UNKNOWN；实际只读但没有只读沙箱，不宣称已验证角色加载。

当前完整规划候选保存为证据根 `planning-candidate-002/`；`planning-candidate-002-identity.json` 记录逐文件字节／SHA，复制后独立读回。规划 PASS 不代替 UI、工程或产品接受。审查提醒原型“继续编辑”尚未定位精确项目，正式 UI 合同要求仍保留，生产验证不得跳过。

当前没有工程测试 PASS，没有固定集成物料、安装或 Product Acceptance。依赖安装、供应源修改、真实插件进程、Provider、真实用户数据、MCP、Git 提交／推送／合并和设备采用均未执行。

本目录是本地工作分支未提交候选；同机 evidence 不是跨设备备份，也不宣称永久项目资产已 Git 保存。

## 用户 UI 更正与当前输入（2026-10-19）

用户明确指出旧 UI 错误，并指定“metric-factory 现在的 UI 已经最新，可以直接照搬，不用改”。当前 [产品输入 v0.2](proposal-v0.2.md) 与 [UI 合同 v0.2](ui-contract-v0.2.md) 已据此改用原仓 `src/ui/public`。上文旧候选与两次审查仅为历史，不能充当当前输入通过。

已重新 SSH 读回供应 HEAD 169faa8 与四前端文件 SHA：index/app/api/style 与固定生产源相符。旧独立原型的 index/app 不同且没有真实 api 层，证实上次选错参考。旧 clickable 已在 planning-candidate-002/ 逐字保存后从当前输入撤回；生产源逐字参考在 reference/current-production-ui/，未做独立运行 Demo。完整身份见证据根 current-production-ui-readback-003.json。

用户选择原样复用当前生产 UI，撤回我添加的宿主条、审核下拉、第二次保存步骤与交付历史界面；保留原创建／审核／发布／下载。必要准入、取消与保存接点以服务端兼容优先，只有无可见改动的必要 JS 接线可调整，必须说明并验证，不能宣称改后仍原字节。D-MF-01 仅保留现有业务差异，不自动扩大成这次修复或豁免。

此次核查是生产源码与资源核对；默认端口4173没有观察到监听。没有声称看过正在运行页面，没有启动原工作区、读业务实例或模型配置。旧 file URL 工具拒绝未绕过。

## NEXT_ACTION

按原接入任务继续，对 v0.2 做必要 fresh 独立 readiness，再核查工程 intake／独立源码所有权。不再要求用户批准旧UI或重新设计。上文旧 WAIT_USER_UI 已由本次用户生产 UI 直接复用决定取代。工程代码、Provider、真实数据、安装与 Git 发布截至本记录仍未执行。

旧 active-change.json 是 sole policy 的“Legacy Authority and Global WIP”段，仅用于未启用的签名 Host Loop；不把它未定位误设为当前半自动新任务的审批门。保留其 UNKNOWN，不启动、改写或推定旧状态。当前工作区独立 work/mac-mini/metric-factory-integration，仅本规划目录改动。

## 当前接续（用户两项反馈批准后）

用户明确“允许仅修正这两处反馈，其余 UI 原样保留”。fresh readiness004 PASS，已确认 Engineering Intake；OpenSpec `metric-factory-integration` 为当前薄行为规格。供应 Mini 独立分支已开始显式注入与真实取消接点，HTML/CSS 保留。此状态取代上文“待 readiness/intake”的接续描述；不改写旧失败。宿主接线、完整验证、独立 Validator、产品接受及固定交付仍未完成。
