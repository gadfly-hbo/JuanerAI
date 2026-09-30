# 增量可点击 UI 检查记录

状态：`AUTHOR_OFFLINE_CLICKABLE_CHECK_COMPLETED`。日期跨 2026-09-30／2026-10-01；不是用户 UI Gate、工程验收或真实模型证据。

主任务通过本机 HTTP 静态入口，在 Codex In-app Browser 的独立父／子标签中操作；所有模型状态由显式合成场景推进，不是 SDK／Provider 响应。`node --check app.js` 通过；浏览器已检查的父／子页面错误日志为空。精确源文件身份见[Review 002](../reviews/xanthil-fork-subagent-and-blueprint-v3-development-readiness-review-002.md)。

所有操作只影响本附件命名空间中的离线合成状态。不调用 Provider，不操作真实业务数据。

## 实际回放

| 检查 | 实际结果 |
| --- | --- |
| 父分叉位置 M-02 | M-03 变为未选且不可勾选；子窗口只显示 2 条继承历史，创建后仍待授权 |
| 独立父／子地址 | 真实独立浏览器标签，使用相同 origin／epoch，跨标签看到子状态和结果；不是父内联消息代替 |
| Fork R1 → R2 | 下一授权默认所有自身历史未选；明确选择 R1 后预览准确项；创建 A2，R1 与 R2 同时保留；人工只回流 R2 |
| 资格确认竞争 | 父打开采纳确认后，子将 eligible 设为不足；确认显示缺 Closure／没有写材料；取消仍待审；恢复后再次确认才采纳 |
| 采纳及父继续 | 采纳仅增加 MODEL 材料，12 Evidence／4 Finding／DR-002／EO-002／v2 保持；父新授权材料默认不选，逐项确认才能纳入 |
| Running／Waiting 互斥 | 父 Running 时子创建阻断；显式停止后才创建。子 Waiting 时父创建也阻断；无队列或暗停 |
| 导航与追问 | 子 Waiting 时父切专业页后子仍 Waiting；回答当前可见文本继续原 S-01-A1，不增加 Attempt |
| Subagent 正常成功 | S-02-A1 完成后自动回流一个待审项，未启动父模型，无手动成功回流步骤 |
| 回流失败／重复 | S-01 成功但回流失败保留结果；本地重试建立待审；重复显示已经回流、不增加项 |
| 拒绝 | 拒绝终结为历史保留，无材料／正式记录变化，不再出现此版本采纳动作 |
| 子失败 | S-03-A1 Failed，显示没有完整结果和成功回流；历史／原因保留 |
| 父实际关闭 | 活动 S-03-A2 时先取消关闭，仍活动；确认关闭则 Interrupted；模拟迟到完成被拒绝。重开父不运行模型，重开子保留 Interrupted 与旧历史 |
| 成功未回流恢复 | S-03-A3 成功／回流失败后模拟重开 → 待回流恢复；明确重试才建立待审，没有自动模型或回流 |
| revision 变化 | r7 → r8 后旧历史保留；待审采纳／拒绝禁用，继续模型显示来源变化阻断，不自动重绑 |
| 可访问性 | 新授权中初始未确认时开始禁用；Escape 取消后焦点返回新 Attempt 入口；原生 dialog、文本状态与可见焦点 |
| 两个视口／长内容 | DOM clientWidth／clientHeight 与截图尺寸确认父 1440×900、父与子 1280×720；scrollWidth 等于视口宽，无横向溢出；修正后长结果只滚中部，顶栏／来源／停止／composer 保持 |

本轮并未遍历每一种场景开关。原生 OS 关闭／崩溃、完整 Keyboard-only／屏幕阅读器审计、真实成本／计时／超时、结构校验、事务／不确定提交、全部接入配置变体、工程回归和真实模型未验证；不得用上表声称通过这些事项。

## 保留的问题及修正

1. IAB 未在 inventory 中呈现 `window.open` 子弹窗。附件补上始终可见的精确独立窗口链接，本轮据页面披露 URL 打开独立标签验证。浏览器自动弹窗／原生多窗口不因此宣称通过，后续 Desktop 工程仍须真实验证。
2. 授权对话框底部初始部分裁切；增量 sticky footer bottom 修为 0，后续 1280 截图确认按钮可达。
3. 独立 Plan Review 001 提出自身历史 B1，已补正文和默认未选选择；新 Review 002 PASS，旧 NEEDS_CLARIFICATION 不删。
4. 长结果的初次截图 11 中整壳滚走，不能作合格布局。补网格行／min-height 后重载、定位确切结果，截图 12／13 的顶栏／停止／composer 均保持。保留截图 11 作为历史失败，不覆盖成修正后证据。

## 截图与用户入口

- 最终可审阅布局：[1280×720](screenshots/12-review-ready-contained-scroll.jpg)／[1440×900](screenshots/13-review-ready-contained-scroll-1440.jpg)。
  - 1280 图：104281 bytes，SHA-256 `0fd333cc64eb59467a442a4be8f82436cf824ef3300c9a012a332173c851cf66`。
  - 1440 图：116349 bytes，SHA-256 `ba68b16e075c76a9932d4f18d0c41ce85a6c5554be0d69e2b98976ca64cf1116`；已从保存路径独立读回检查。
- 独立子授权：[1280×720](screenshots/08-subagent-authorization.jpg)；专业不变面：[1280×720](screenshots/10-professional-retained-1280.jpg)。
- 历史步骤截图 01–11 保留，其文件名和实际 JPEG 尺寸核对；没有把截图前尝试当成成功结果。
- 为用户保留父入口中一份 Fork 手动回流及一份 Subagent 自动回流的待审合成结果，未采纳、未启动父模型。先前探查合成状态仅按本附件命名空间重置；可按 README 重放，不清其他附件／业务数据。

上述检查完成时：技术检查和 Reviewer 的静态就绪 PASS 都不代替用户 UI Gate；当时未发布、未冻结产品输入、未派发 Mac mini。所有原始截图为本机规划附件；未提交的文件不是已经 Git 保存的项目资产。

## 后续用户批准（2026-10-01）

用户收到完整正式审核包后回复“审核通过”。适用增量 UI Gate PASS 及 MacBook 本地 Product Input Freeze 见[批准与冻结记录](../xanthil-fork-subagent-approval-and-product-input-freeze-v1.0.md)。这项用户决定不提升以上作者检查的工程证明等级，也不补足未验证项。HTML／CSS／JS 和截图字节保持不变；Git 发布、Mini 接收与工程启动仍未执行。
