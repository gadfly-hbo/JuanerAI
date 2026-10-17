# decision-platform · 用户 UI 批准与产品输入冻结

2026-10-17，Asia/Shanghai；Mac mini，同一接入任务。

## 用户决定与绑定对象

用户在当前会话、006r1看板与汇报稿交付之后直接回复：

> 审核通过

据此记录当前受影响可点击 UI Contract 的 **用户 UI Gate PASS**。接受对象为006r1：新版PR90宿主工作台上的决策看板接缝、统一暖白/浅灰绿/深绿视觉、完整看板、汇报总览与逐条拍板、可见退出、来源与返回原分析。它结合本任务已明确确认的完整看板、不启用飞书、插件人工记录和项目teach边界，形成当前固定产品输入；无需再询问相同UI决定。

这不是已实现产品的 Product Acceptance，也不推定用户执行过代理未观察的全部浏览器/键盘/故障步骤。代理侧浏览器视觉、真实DOM/键盘验证仍为NOT_RUN，静态检查/独立源码复核保持原作用域。UI稿明确展示的模型/消费候选不构成任何真实Provider、报告外发或实际消费授权。

## 固定身份与原件

- manifest：[candidate-006r1.json](reviews/candidate-006r1.json)，7312 bytes，SHA256 `0fc7123a93281ac73b5f1228a84b68a1e07dfda1ae708f8b7e9e01ba4a3cddcc`。
- 33文件在写本记录前重新独立读回，长度与SHA全部一致。已批准原件继续保存在本机证据根的 `review006r1-input/`，没有回写历史候选。
- UI合同：[ui-contract.md](ui-contract.md)；看板：[index-006-board.html](clickable/index-006-board.html)；汇报：[index-006-presentation.html](clickable/index-006-presentation.html)；完整流程：[index-006.html](clickable/index-006.html)。
- 产品计划就绪沿已完成004评审及005/006r1对应纠偏复核；006的R006-01失败与对应RED保留，006r1关闭该问题。独立结论见 [readiness-006r1.md](reviews/readiness-006r1.md)。
- 当前设备/工作树：Mac mini，`/Users/bendandebaba/.codex/worktrees/12b3/JuanerAI`；分支 `work/mac-mini/decision-platform-integration`；HEAD `a0b6491ddc4700fef881317f44f2c51c699d8f9c`，tree `f2a64ed123c110188927e28f48a4a6e013ddbcc1`。
- 证据根：`/Users/bendandebaba/JuanerAI-artifacts/decision-platform-integration/intake-20261017`。是本机持久材料，不冒称MacBook备份或Git集成。

已冻结proposal/tasks/UI正文中的候选/PENDING标签保留为当时输入快照；本记录更新其当前批准状态。design.md仅是当前接点设计的身份快照，不把普通工程路径/参数/私有类型预冻结为不可调整的产品合同。

## 当前状态与授权

| 项目 | 当前结论 |
|---|---|
| 本轮受影响用户UI Gate | PASS，绑定006r1 |
| 当前产品/UI输入 | 已按上述身份冻结；复用此前产品方向与业务效力决定 |
| 工程正式Intake/接线 | 待固定运行材料取得与核验；未因UI通过伪造可执行的插件契约 |
| 固定插件源 | 只有18项获准UI素材；完整源、依赖锁、vendor包尚未接收 |
| Provider/真实报告/凭据/实际消费 | 没有新增授权，未执行 |
| 安装、迁移、运行采用、产品实际接受 | 未执行/未成立 |
| Git提交、推送、PR、合并、发布 | 未执行；本分支文稿与原型仍为本地WIP |

## 下一步所需固定材料

启动Prompt §2.3明确：“接线/打包阶段需要的插件源码或固定物料……由用户在届时另行提供并记录身份”；“向用户申请获准的运行材料，不自取”。前次授权仅覆盖离线UI素材；本次UI批准不自动扩为完整运行源获取。

现对齐、Adapter设计、用户UI批准均已具备，接线前只需解决这一材料入口：由用户提供包/位置，或明确授权Mini经SSH只读导出MacBook插件仓的固定提交快照。所需集合：

1. `8ae652ce53fc27d3be92098517643a419f9b73eb` 的固定源码快照，含构建/服务端/前端与package.json；若用户提供不同候选，先记录并核对差异，不追随main。
2. 该快照的package-lock.json，采用时重新计算身份。
3. `vendor/pi-agent-runtime-0.4.1.tgz`及依赖/第三方通知资料；核对实际字节与Prompt历史指纹，不以文件名代替验证。
4. 精确提交、打包清单和tar长度/SHA。无外置依赖的情况如实记录缺件，不自行从活动目录或缓存补取。

固定取材不包含`.env`、独立版data、用户报告、运行日志或密钥；不启动MacBook服务、不改变其工作树。收到材料后先核验身份与可读性，再在同一任务闭合实际接点和工程Intake。真实Provider/报告和发布另按有效许可执行。

NEXT_ACTION：解决固定运行材料的供应方式；当前不再等待UI批准。
