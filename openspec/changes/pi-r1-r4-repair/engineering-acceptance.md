## 当前用户产品接受（2026-10-15）

用户在本任务直接表示“采纳，接受产品”，本冻结候选的既有离线合成/显式opt-in交付范围 Product Acceptance 已收到；详见 [产品接受](product-acceptance.md)。原F-ROLE-01具名豁免及正式Validator BLOCKED、历史失败和UNKNOWN保留。没有逐项本人复跑或真实Provider/生产/Git/归档通过的推断；下文PENDING/尚未用户验收均按此前时点历史阅读。冻结代码/SDK/依赖/测试不变，原合成业务Task状态与用户产品决定分列记录。

# R1～R4 工程接收：本冻结候选附 F-ROLE-01 具名豁免

2026-10-15，Mac mini Engineering Controller。用户授权仅回填工程收口记录；原任务、分支、工作树和 WIP 沿用。**Engineering Acceptance 已成立，仅限冻结 R1～R4＋D1～D8 推荐方案 A 的离线合成、显式 opt-in 实现及固定 SDK 联合验证。独立 Validator 正式结论仍为 BLOCKED F-ROLE-01，候选离线技术评估 PASS；不得表述为无条件 Validator PASS。** 用户 Product Acceptance、完整 Change 归档及 Git 交付尚未完成。

## 用户具名决定与适用边界

> 仅针对本冻结候选，接受 F-ROLE-01 的沙箱残余风险，以已核验的只读行为及前后哈希一致作为具名豁免，继续工程收口；不得改写为无条件 Validator PASS，不修改候选，保留历史失败和 UNKNOWN，Provider、生产及 Git 停止线不变。

F-ROLE-01：原生 Validator 实际为 danger-full-access / never，缺少所要求的强制只读沙箱。仅针对本冻结候选，用户接受以已核验的只读行为及前后哈希一致作为具名豁免；这不改变角色配置、规则或未来候选的要求，不豁免其他缺陷。独立检查的初次 Chrome 临时目录未固定限制及正确 TMPDIR 重跑另记，不归入本豁免。此前一次 Sol CLI 请求 HTTP400/exit1 的失败及所有历史失败保留，没有重试换模型。

## 固定来源与证据

| 身份 | 固定值与限制 |
|---|---|
| 产品工作树/分支 | `/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI`；`work/mac-mini/pi-r1-r4-repair` |
| HEAD | `8265a3920ee1205faec7dede8b0c84e648105d9d`，只是基线，不能单独代表修复 |
| 原冻结 87 文件 aggregate | `a5f0a8c11c3b4760b92953c7ce198d2ad2fff336d85b54b7651ad984804b8fd4` |
| 接收绑定 88 文件 aggregate | `b9b796ee8c0cb624fc7640c37f32c2b08f2c2b692b69bb5cfb9d192b6cf1a16a`；增加项仅此前中断项目板元数据，技术内容未漂移 |
| 固定 SDK | `0.5.1-r1r4.3`，146131 bytes，SHA256 `e02175ff42eaa83b994e6f49a1e041b4b3f0b9c807b0b8c192a7dfd836f70cce`；51 个实际安装文件一致，764 个非 SDK lock 条目未漂移 |
| SDK SRI | `sha512-EwiDQpDwtxob2Gu56P5DdTsIP2HbcvRYga3Q0r8BeaJNZbIEDYzQPqy8xMYYzC+nHHtObasfLzOD53BOwb5N4Q==` |
| 原 Validator 报告 | 18151 bytes，SHA256 `f418f9b0dda05632ca09dd3856a1588e6e9032cbea4649eb74d2f2c523c9a5b7`；原 BLOCKED 不改写 |
| canonical002 | 17 组 exit0，4611 总计／4610 PASS／1 真实 Provider SKIP／0 FAIL |
| 独立检查 | 131 PASS／0 FAIL／0 SKIP；另有效果保真、超限、owner-stop 反例与 1366×768、1440×900 实际浏览器检查，类型 exit0 |

原始证据根：`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001`。实际原件：[独立报告](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/independent-full-002/validator-report-001.md)、[具名豁免](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/engineering-closeout-001/F-ROLE-01-WAIVER-001.json)、[工程接收收据](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/engineering-closeout-001/ENGINEERING-ACCEPTANCE-001.json)、[接收前读回](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/engineering-closeout-001/CANDIDATE-READBACK-001.json)、[SDK 安装身份](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/product-installation-recheck-001.json)。634 文件原审查证据集及原 RED/GREEN/失败均保留。

本次用户新授权解除的仅是上述历史收据中“不得修改候选所以暂不回填记录”的限制。收据、旧冻结清单和审查报告保持原件。本次仅追加记录层：OpenSpec 当前结论、项目板状态及能力覆盖视图。新记录字节不冒充旧 aggregate；记录层前后身份、允许路径差异及保护检查见 [回填核验](/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/engineering-record-backfill-001/RECORD-BACKFILL-VERIFICATION-001.json)。原冻结代码、SDK、依赖、测试和规格合同不变，复用适用的既有测试/独立技术证据，不制造新 GREEN。

## 接收追踪

| 接点 | 本次工程接收范围 | 保留限制 |
|---|---|---|
| R1 | 最终 DTO/schema/历史的投影准入、压缩后重查、本地完整计算与获准原生 read | 生产 overhead/margin/image 准入参数 UNKNOWN；512/8192 为合成参数，961743 bytes 仅观察值，不能证明 token 安全 |
| R2 | ModelOutcome/原子 usage、物理账本、known-zero/partial/UNKNOWN、冻结和迟到事实、持久/HTTP/UI 读回 | 不从错误文字推断状态，不退款未知消费，不自动重试重放；真实 Provider 未测 |
| R3 | Task1.4 唯一准备正文、四种窄视图、保存回执、完整语义消费、proposalOnly 两批候选及显式采纳→IR/核验/Outcome/UI | 保留旧 required_calculations.execution_plan、finish_result.result；没有通用仓库/读取/分页/压缩/恢复机制；超限仍失败关闭 |
| R4 | 每用途获准主备候选、接收方/窗口/协议/能力复核及同 Task 统一额外额度 | 不热绑旧 Task、不自动切生产；未知效果不重放，已知消耗保留 |
| D1～D8 A | 已批准所有权/生命周期/重开/失效/兼容；16MiB/64MiB/1000 项/64 候选物理上限，新 Task 显式 opt-in | 旧1.0～1.3不回填，物理上限不等于 token 安全；历史恢复仍受原权限限制 |

REQ/AC、因果 RED、GREEN、负向、旧配置兼容及完整命令/退出码的既有追踪沿 [矩阵007](joint-verification-matrix-007.md)、[verification](verification.md) 和原独立报告。原19项跳过的逐项说明沿 [清单](skipped-19-followup.md)，18项已有适用补验；真实 Provider 保持 SKIP。原1-token原因 UNKNOWN，不以新成功回写旧失败。

## 覆盖地图及准确返回点

本修复支持 C6-01、A-03/04/05、B-01/02/03 的既有消费者链路；不新增稳定 ID，不改变40项能力的定义、完整目标或累计登记状态。见 [全图](../../../docs/planning/capability-coverage/latest.md)、[登记](../../../docs/planning/capability-coverage/register.md)及 [固定快照](../../../docs/planning/capability-coverage/snapshots/pi-r1-r4-repair-engineering-waiver-2026-10-15.md)。离线工程接收不构成新产品能力全目标、S1、业务效果或用户体验验收。

NEXT_ACTION：本候选离线工程接收及本次记录回填完成；没有需自动重启的修复或新 SDK 等待。真实 Provider/凭据/业务数据须另行对象、数据边界、命令和预算授权；生产准入参数仍 UNKNOWN，采用/部署/服务须另行授权。用户 Product Acceptance、历史 Task 迁移/恢复/重放、其他产品升级、Git 提交/推送/合并/发布和正式归档保持原停止线。本地 WIP 与证据尚非 Git 集成资产或跨设备备份；未向其他聊天发消息。
