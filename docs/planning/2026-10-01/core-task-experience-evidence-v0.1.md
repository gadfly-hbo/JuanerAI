# 核心任务体验审查：证据索引 v0.1

2026-10-01 原始体验审查的证据索引。这里区分源码、历史原生画面和当时草图；不声明本轮原生完整旅程 PASS。

发布说明：只将本索引的事实及限制作为 Blueprint v4.0 的背景依据。原审查建议 `core-task-experience-review-v0.1.md`、低保真 HTML 及其截图未获产品接受，保留在源 MacBook 工作树的本目录，未纳入本次 Git 发布；下方相关记录仅为历史，不是新 UI Contract。原生截图仍位于注明的本机持久证据根，不宣称接收方已取得。正文中的“本轮”指原体验审查时点，不是持续在线状态或本次发布验证。

## 当前代码与接受记录

- 固定代码：`2bb18d7356289781a87a672dc3f7b9bd40341d87`，tree `4fc456d4e7142075d7dbef300eab51feea97a111`。
- 本机从 clean main 正常建立 `work/macbook/core-task-experience-review`。Mini 通过只读 SSH 核对为同提交 clean main；未移动其任何 ref／工作树。
- [001 原生接受](../../../openspec/changes/archive/2026-09-27-xanthil-desktop-membership-repurchase-decision-case/acceptance.md)、[002 接受](../../../openspec/changes/archive/2026-09-30-xanthil-desktop-case-assistant-decision-record/acceptance.md)、[003 接受](../../../openspec/changes/archive/2026-10-01-xanthil-desktop-fork-subagent-collaboration/product-acceptance.md)、[003 Git交付](../../../openspec/changes/archive/2026-10-01-xanthil-desktop-fork-subagent-collaboration/git-delivery.md)。历史测试结果只引用原记录，本轮未重跑。
- [专业工作台代码](../../../apps/desktop/renderer.tsx)、[Assistant代码](../../../apps/desktop/case-assistant-workspace.tsx)、[原生专业旅程脚本](../../../tests/e2e/xanthil-desktop/xanthil-desktop.e2e.test.ts)、[原生 Assistant 脚本](../../../tests/e2e/xanthil-desktop/case-assistant-native.e2e.test.ts)、[协作原生脚本](../../../tests/e2e/xanthil-desktop/case-collaboration-native.e2e.test.ts)。脚本不等于本轮执行结果。

## 六张历史原生截图

源设备：`bendandebabadeMac-mini.local`。

源根：`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-fork-subagent-collaboration/controller/keychain-full-host-002`。

副本设备：MacBook；持久根：`/Users/huangbo/JuanerAI-artifacts/core-task-experience-review-20261001/native-evidence`。

只读 scp 复制，保留原始图片未裁剪／改图。源端 `shasum -a 256` 与副本 `shasum -a 256` 六项一致；副本 `wc -c` 共 1,179,608 bytes。全部已逐张查看。复制和源／副本校验命令均退出0。表中“原生”指真实 Renderer 原生测试画面；测试状态和模型传输为合成，不是用户那次实录。

| 源根下相对路径 | 本机文件／字节 | SHA-256 | 本轮实际看到的内容 |
| --- | --- | --- | --- |
| `case-assistant/quick-unapproved-1440x900.png` | `quick-unapproved-1440x900.png` / 188700 | `1375e328484410f281cdd00398187fafcf55df576957958e7eb25369914175bd` | 已关联Case；模型未配置；正文与Inspector突出配置／授权；Fork/Subagent按钮 |
| `case-assistant/authorization-1440x900.png` | `authorization-1440x900.png` / 242580 | `316e8d7dbfc5f92e3c189f81f19d010e1ceb3fd31e19b902cdde7ec6fcf50b44` | 精确授权弹窗，revision、毫秒、类别枚举、hash与JSON；文本外发确认 |
| `case-assistant/pending-1440x900.png` | `pending-1440x900.png` / 240757 | `c4f48a1d491ad3153229f041f4693e30cdf8a1683777860cffd5ddda7b0eecc1` | 待采纳草案、Decision Record和Expected Outcome、编辑／拒绝／采纳；合成提示保留 |
| `case-assistant/ui-fidelity-stages/professional-entry-1440x900.png` | `professional-entry-1440x900.png` / 187414 | `44349f5e958f8a1ed2ab65d66a135cbb544a5c881d7d0d6ed4569a3fd7ca2ac7` | 六阶段工作台，在原分析Closure之后进入Assistant记录正式决定 |
| `desktop/u2-finding-1366.png` | `u2-finding-1366.png` / 210163 | `47b279a7565d519c9b42ab8f2a4516d25004584e23f92cc066940216c3501b81` | 第4阶段H1不支持；两期2活跃1复购、1/2、金额以分表示；专业页的Preview文字不用于推断Quick协作未实现 |
| `collaboration/fork-1440x900.png` | `fork-1440x900.png` / 109994 | `ed03aff5a2712d698b0e79120419bedaed6608d02e709882ab07b4463c6b36b1` | 独立Fork窗、父来源与分叉点、等待授权、材料默认不选、MODEL意见限定 |

本机打开示例：[Finding原生画面](/Users/huangbo/JuanerAI-artifacts/core-task-experience-review-20261001/native-evidence/u2-finding-1366.png)、[授权原生画面](/Users/huangbo/JuanerAI-artifacts/core-task-experience-review-20261001/native-evidence/authorization-1440x900.png)、[专业到正式决定](/Users/huangbo/JuanerAI-artifacts/core-task-experience-review-20261001/native-evidence/professional-entry-1440x900.png)。本机副本不是全量Mini证据备份；未复制其他证据或包，也未重验完整历史 manifest。

## 架构评估

原任务 `JuanerAI 技术架构-v1.0`（`01a0e5c7-83ed-7143-a785-59aaeb483f4d`），本轮评估 turn `01a0f65f-cc59-76a0-8074-a6d55cb2242a`。用户请求技术约束评估后发送只读范围，未派发生产角色。该任务完成源码／规范评估，原答复保留在原任务；关键结论已纳入审查稿§5.1。

- 可复用确定性本地编排，无需新Runtime。
- 自动预检／确认并分析要定义跨命令部分成功、取消和重试。
- 未完成Case接入Agent以及首次人工正式草案均不是现有纯UI变化。
- 人工首次草案须真正确立人工来源，不能假造模型Attempt。
- 授权、业务口径、Finding接受与正式决定责任不能删除。
- 可用隔离开发入口／原生合成夹具做后续观察，但当前环境无现成安全启动条件；本轮未执行。

## 当前未测项目

当前用户在Mini的真实逐步操作、所用数据和Provider状态；从空白到正式决定的连续原生操作；准备草稿丢失的实机复现；完成率、首次有用结果时间、实际点击／确认次数、真实模型帮助质量。全部 UNKNOWN，未用规划文档、截图或旧PASS填补。

## 方案草图

当时的低保真 `core-task-experience-lowfi-v0.1.html` 是未获接受的提案，不属于上述产品证据；其 SHA-256 为 `a934292a713ddd49c6be8f01e6cd09396f98816f3c9124b0ee375f05b2087f73`。不访问数据／Provider，不持久化业务状态，不作为当前产品、当前能力或改善已实现的证明。

本轮在本机内置浏览器实际检查了草图：未选文件／未确认时禁用下一步；两文件→明确口径／三声明→有限结果→人工接受→比较；暂缓与未形成正式决定的区分；人工首次记录标为待批准且无正式保存；导航保留页面输入；模拟复算不一致禁止采纳、仅本地重试恢复；修改期间撤销三项确认并禁止采用旧结果。这里的 PASS 仅指上述草图交互观察，不是生产验证。

初次预览发现草图两个 option 标签格式错误，已修正并从入口重走；一次精确 label 定位失败后按新读回状态使用已有元素 ID 继续。它们是本轮草图／检查过程，不计作产品缺陷。只读支持 Agent 检查审查稿事实与范围，返回无必须修正项；这不是正式开发就绪 Gate。

本轮静态核对：27 个本地文档链接存在；HTML 内联 JavaScript 语法检查通过；规划文本无行尾空白；既有 tracked 文件 diff 为空；无业务代码、依赖或工程状态变更。未运行完整索引或产品测试，未 commit／push。

草图结果截图 `core-task-experience-lowfi-result-v0.1.jpg`，114452 bytes，SHA-256 `30429c94e2429e46e8ee11002ea10e6e2fd870286fb85737c4b2ad1ad8a7fbee`。它是本机保留的合成提案画面，不能与上面的历史原生截图混用。
