# Report Studio 最小接入方案 · 产品输入冻结记录 v1.0

2026-10-15（Asia/Shanghai）。任务标识：`report-studio-minimal-integration`。**产品输入已冻结，暂不开发。**本 v1.0 是完整材料包的冻结版本，不是新增产品行为或 Report Studio 软件版本。

## 用户决定与适用对象

本任务先前用户已批准 [方案 v0.1](proposal-v0.1.md)。本次用户明确决定：

> 两机兼容范围和新增 UI 合同审核通过，把完整接入方案整理冻结，暂不开发。

据此，[兼容补充 v0.2](compatibility-v0.2.md) **用户批准**；[新增 UI Contract v0.2](ui-contract-v0.2.md)及其绑定[可点击附件](clickable/index.html) **用户 UI Gate PASS**；完整产品输入 **FROZEN**。审批指向上一轮交付的固定候选，清单 SHA-256 为 `cfc6b254d2066305b5b5ea3ea5d81d6b62ec80ec877a5adee35f1cbb21678193`，其8项文件逐项重新核对一致。

复用 [独立就绪审查 004](reviews/development-readiness-004.md) 的固定候选规划静态复核 PASS；本次仅整理、记录批准并冻结，无产品语义修订，不重跑仍有效的审查。旧审查 001–003 的 NEEDS_CLARIFICATION、旧候选及已修正的问题保留。用户接受不把工具未运行项改成已实测。

## 冻结范围

- 关联模块，Report Studio 独立维护、固定版本随 JuanerAI 交付、后台按需启动，保留自由制作。
- 原方案 M01–M10 必须改动、自由制作能力、暂缓项、数据／来源／权限／版本／生命周期语义及 AC01–AC14 全部保留。
- 两机支持组合：M4 Mini + macOS 26.3.1(a)；M5 MacBook + macOS 26.5.2。两机 Keynote 14.4 为 PPTX 编辑验收对象；对应已列版本 Chrome／Preview 验网页、HTML／PDF。不是全 Mac 或 macOS“及以上”承诺。
- 新增 UI RUI-01–10 及合成可点击附件，复用已接受的 Xanthil 工作台与 Report Studio 制作布局；首次可信本地模式、材料许可、来源版本定位与显式交付按合同执行。
- 路线关联为 C5-09／N11，相关 C3-01、A-04、A-05、B-01、B-02；不据此把能力登记为已实现或重排其他在研 Change。

完整阅读入口为 [冻结版完整接入方案](frozen-plan-v1.0.md)。它按已批准原文汇编，消除已解决的兼容待决表述和审核邀请，未新增或删减要求。批准原件保持原字节，是内容追溯依据；汇编如出现编辑歧义，以这三份批准原件加本记录的后续效力为准。

## 身份与保存

[冻结清单](frozen-inputs-v1.0.json)记录正式材料的相对路径、字节数、SHA-256，以及可点击附件实际引用的本仓库资源、规范参考及 Mini 证据位置。原 `candidate-v0.2.json` 保持原字节与候选时点标签；不把旧“待审核”文本回写为虚构的历史通过。

- 原工作树：`/Users/bendandebaba/.codex/worktrees/323d/JuanerAI`。
- 原分支：`work/mac-mini/report-studio-minimal-integration-plan`。
- 原 HEAD：`187c356625260d84ca58bc1f5741e081e89662cd`。
- 只读采用政策：`b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`（PR #88），Mini-led Plugin Integration；同任务 Mini 牵头，不新增 MacBook 审批／交接节点。
- 持久证据仍为 Mini 的 `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/`，本机保存不等于跨设备备份。

本次为**本地产品内容冻结**，文件仍属未提交 WIP；未进行 Git 提交、推送、PR、合并或其他设备同步，不宣称已经成为 Git 集成资产。

## 当前状态与停止线

| 项目 | 状态 |
| --- | --- |
| 原方案、两机范围、新增 UI | USER_APPROVED／UI_GATE_PASS |
| 固定候选产品就绪 | PASS，复用审查 004，限规划静态审查 |
| 完整产品输入 | FROZEN |
| Engineering Intake | NOT_STARTED；不因产品冻结自动确认工程接收 |
| 实施／OpenSpec／产品测试与代码 | NOT_STARTED，用户明确暂不开发 |
| 浏览器视觉／实际点击／键盘／响应式 | NOT_RUN；本地 file:// 被工具策略拒绝，用户 UI 接受不改写此事实 |
| 实际安装、模型制作、Keynote 编辑、集成回传 | NOT_RUN；MacBook 独立版已有使用经验不替代本集成验收 |
| 安装、Provider、真实数据、主机／部署、Git发布 | 未由本次批准新增权限 |

未知、未运行及各类历史失败继续保留；不把冻结当作工程完成或真实产品接受。后续若用户授权开发，Mini 在同一任务核对实际基线、依赖、WIP与各项效果权限，确认有界 Engineering Intake，再遵循正式 Change、SDD/TDD、独立最终 Validator、required CI与适用用户实际产品验收。当前下一允许动作是按用户指示维护冻结材料或回答问题，**不自行启动工程、安装、调用、服务或发布**。
