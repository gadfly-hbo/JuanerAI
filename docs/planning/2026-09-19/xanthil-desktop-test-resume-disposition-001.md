# PKG-XANTHIL-DESKTOP-001 — Test Resume Disposition 001

## 批准与事实

用户于 2026-09-19 批准处置 `TEST_RECOVERY_STOPPED_EXECUTION_EVIDENCE_UNKNOWN`，
恢复[Recovery 001](xanthil-desktop-test-recovery-amendment-001.md)剩余的一轮，
并允许范围内离线语法、夹具健康检查在编写期间进行。本次仅覆盖该批次的
authoring-only 命令限制和辅助诊断停止线；长期政策、产品/规范、角色隔离、
依赖、数据、Provider、主机及 Git 权限不变，不重开 Spec 或增加预算。

- 原任务：`纵切-1.0` / `01a0b45a-13ad-7b92-a2b4-cdde980558e1`。
- Change：`xanthil-desktop-membership-repurchase-decision-case`。
- Mini 独占 `/Users/bendandebaba/JuanerAI` 的 `work/macbook/whitepaper-blueprint-v1`。
- 接收基线：`ab752834aefa966924f69c834027525c826a737e`；tree：
  `61a77c4291bf5d44c9cf58d7b736a65874127f14`。MacBook 从独立的
  `work/macbook/wip-preflight-exception-disposition` 发布固定提交供手动转发。

唯一 Mini 证据根仍为
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`。
以下文件位于其 `technical-decision-001/`：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `test-recovery-exception-receipt-001.md` | 8240 | `cb4c64fd387527dffa5662bcd8bc4013df3e2b10782ef943b4e4553a78efffee` |
| `test-recovery-stop-index-001.json` | 46359 | `ac2db5661625d880d59ca4abee13dc834c04e2740dc9b925940efcfeec4b23a1` |
| `test-recovery-round1-deviation-001.md` | 2989 | `8b92e7c6cb003324c8405c7c8dbffec4b9a325c0c1ae84dfa9873976dadae7de` |

MacBook 已读取原文并核对回执/索引及其中 31 份现场文件、封存副本和关联证据
的大小/hash，抽查实际测试源码；本次发布前再次核对，100 项文件身份均匹配，
4 tracked 修改、27 untracked、无 staged 的现场未变。这是范围/证据完整性
核对，不是独立 Spec Gate、测试正确性或产品验收，也不是 Mini 原件的跨端备份。

## 本次异常处置

保留越出命令边界、误报退出码及随后更正的原记录。历史 Node 解析路径、环境、
数字退出码和丢弃的 stderr 继续为 UNKNOWN；该诊断不计 PASS、覆盖或 RED，
不重放原命令补造历史。已读源码没有顶层产品/Provider 操作且保护文件未变，
但这不证明历史进程绝对无副作用。用户接受此已披露的残余不确定性，解除
本次等待处置状态，允许从保全现场建立新的有效证据；不是追认越界。

保留 Mini 已完成的定向 Spec、整包 ponytail 和受影响 Spec Gate 记录及
Stage 0/1、WIP 处置、工具/P1–P4 结果。恢复直接返回正式 Test；不重批产品、
重开 Spec、重做安装/成功探针或旧 WIP。历史四次纠正及恢复第1轮均保留。

## 剩余一轮怎样执行

1. Mini 按发布回执核对固定提交/tree/唯一 parent/文件身份，使用上述停止索引
   保全并核对 31 份现场后 ff-only 接收，接收后这些现场字节不变。未知改动、
   冲突或并行写入停止；已有同提交则核对后跳过，不 reset/stash/clean/覆盖。
2. 协调者在现有 `verification.md/traceability.md/tasks.md` 登记处置及第2轮：
   原先已用 1/2，现在仅分配剩余 1 轮。向正式 `juaner_test / R2 xhigh` 下达
   具体缺口、原16路径和验证范围；协调者不代写测试，也不把首次矩阵另算免费额度。
3. 在该轮内，Mini 可自行安排批准工具和隔离、离线、任务局部的语法/夹具健康
   检查，包括经静态确认无顶层外部或产品副作用的夹具导入；可在全部测试编写
   完成前运行，无需逐条返回 MacBook 或新增 authoring-only 人工 Gate。使用已
   批准的 Node 绝对路径和命令局部清洁环境，记录命令/cwd、输入身份、时间、
   数字退出码/信号及完整 stdout/stderr；不用静默管道或进程替换吞掉子进程失败。
   新检查是当前输入的新证据，不恢复历史诊断。辅助检查不替代正式行为矩阵。
4. 辅助检查不是额外免费纠正额度。失败后的再次纠正—验证、同一失败入口重跑
   仍按 Recovery 001 计数；换文件、角色或名称不重置预算。单纯辅助诊断结果
   不可用，若协调者能界定其影响仅在隔离测试环境且安全边界未变，可记录为
   无效证据并继续本轮已授权工作。无法界定副作用、存在业务/外部状态不明、
   越出权限、无进展或额度用尽仍有阻塞，仍停止并集中回传。
5. 完成一轮测试修订后执行冻结矩阵的一遍必要验证，按实际因果区分健康检查
   GREEN、缺失行为 EXPECTED_RED 和无效失败。已在相同输入/环境执行且完整
   记录的相同检查可引用，不为凑矩阵重复成功检查；改动后的输入须重新评估，
   不能引用旧 hash。未具备条件的后置实包/原生人工验收仍标 NOT RUN。

## 必须关闭的实质缺口

沿用 Recovery 001 全部测试义务，不止关闭此次命令偏差：

- SQLite/文件发布故障、COMMIT 响应丢失和不可读分支、终态 Run、实际子进程
  中断重开必须有真实可观察断言；正常成功回执不能代替故障恢复证据。
- Assistance 在真实 Application 上覆盖披露、准入、隐私、Draft 采纳/拒绝、
  持久化及终态竞争；Runtime 替身只隔离外部模型，不能替代被测业务生命周期。
- Main 安全效果及完整真实 GUI 流程需有相应测试；导出读取实际文件内容和
  provenance，重开读取真实持久状态，不能以文件名后缀、标题或标签代替。
- 91 项 AC 对照真实断言并独立核对夹具/映射健康，保留旧回归及测试资产义务。
  补齐测试时不为 Worker 发明接口、削弱断言或修改已批准的业务/验收含义。

达到原 TDD_READY 后才按原授权继续 Worker、回归/退休、独立 Validator 与交付。
一轮仍不满足即带具体剩余缺口停止，不能承诺一定通过或追加第二轮。
旧 Change 仍为 `BLOCKED / DISPATCH_ORPHAN_READY`，不是 CLOSED；旧状态、
Host Loop、旧工作树不动。沿用现有记录和证据根，不新增管理框架或任务。
