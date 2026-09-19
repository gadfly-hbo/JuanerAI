# PKG-XANTHIL-DESKTOP-001 — Test Recovery Amendment 001

## 用户决定与适用范围

用户于 2026-09-19 批准对 `EXECUTION_CORRECTION_BUDGET_EXCEEDED` 作一次
明确处置：保留超限和失败历史，完成一次定向 Spec 收口，由新上下文的正式
Test 完成一轮完整补全，另授最多两轮纠正—验证预算；真正达到 TDD_READY 后
再恢复原 Worker 流程。不是追溯授权、永久加预算、产品重批或质量豁免。

- Package：`PKG-XANTHIL-DESKTOP-001`。
- Change：`xanthil-desktop-membership-repurchase-decision-case`。
- 原任务：`纵切-1.0` / `01a0b45a-13ad-7b92-a2b4-cdde980558e1`。
- Mini 仓库：`/Users/bendandebaba/JuanerAI`；独占分支
  `work/macbook/whitepaper-blueprint-v1`。
- 接收前 HEAD：`944bbcdbd07a2677b2d8354d9666dea3c070de0f`；
  tree：`7c83923c647cb6d4ce5fc3b3b55bd139c2033303`。
- MacBook 仅从 `work/macbook/wip-preflight-exception-disposition` 发布；
  新提交/tree/唯一 parent/五文件清单及 hash 绑定随附固定发布回执。

[技术决策委托](xanthil-desktop-technical-decision-amendment-001.md)继续有效；
[长期执行政策](../../governance/product-change-execution-policy.md)不变。
本补充仅为本次被冻结的 Spec/Test 返回增加下述明确额度，不重置原四次纠正
或其他预算，不自动授权第二个恢复批次，不增加 MacBook 产品执行权限。

## 接受异常事实，不接受未完成测试

MacBook 已只读核对 Mini HEAD、4 个 tracked 修改、27 个 untracked 文件、
无 staged 修改，以及 31 份当前文件与 31 份封存副本的大小/SHA-256。
读取完整回执、Test 审查和执行记录，并抽查测试源码和原始失败日志；未重跑
产品测试、依赖探针或 P4。这是身份/范围/问题核对，不是全部测试正确性验收。

唯一 Mini 证据根沿用：
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`。
下列路径均相对该根的 `technical-decision-001/`：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `execution-budget-exception-receipt-001.md` | 8974 | `522a6f4babf613d9a1751cd1e2ff0a11964644409c2b1deb9fd49265d8f57b3f` |
| `execution-budget-exception-index-001.json` | 59777 | `0e5e34f035d291622466942d939a06824f7e9e9cda9b9bdf4393cb9fccd7b7cf` |
| `product-test-review-001.md` | 4665 | `a808d2208e0433d3b0462078194c89870245d47e6282df6e32defe46cce704a4` |
| `product-test-001/execution-attempt-accounting-001.md` | 11085 | `b5688fb604b1ec38283712e54d89344ca91f77b0524fbd1efe1c50c9ba318abf` |
| `p4-complete-001.json` | 13130 | `e5737e8b68137b94db05330a2301124fd121217c4430045924cee8cd714cb586` |
| `spec-testability-interrupted-001.json` | 8614 | `e522ac300a9faabda51d5c48b2157590d51f1513e3dff72fd99751701321538d` |

Mini 已报告 P4 canonical 1410 PASS、1 个未授权真实 Pi 测试跳过、0 FAIL，
strict typecheck PASS，Console 82 PASS；保留此阶段结果，不把它升级为产品
RED/GREEN。旧 CVR 删除/恢复及超限执行均保留；后来的 PASS 不消除越界事实。
原始环境/源码身份未捕获的部分继续标注未捕获，不重跑补造历史。
中断 Spec 中的临时 `SPEC_READY` 标签没有正式返回和新 Gate，仍不构成放行。

## 一次恢复流程与新增预算

1. 按固定发布回执在原 Mini 分支 ff-only 接收。先以冻结索引核对并保全 31 份
   当前改动，接收后逐份原文大小/hash 不变，再开始获准修订。已有同提交则核对
   后跳过；未知改动/冲突/并行写入停止，不 reset/stash/clean/覆盖或提前提交。
2. 在现有 `verification.md/traceability.md/tasks.md` 记录本授权和超限处置：
   原预算已耗尽，历史四次计数保留，新增额度尚未消费。解除的只是本次异常等待
   处置状态；Test Asset Retirement、TDD_READY 和下游并未因此 PASS。
3. 正式 `juaner_spec / R2 xhigh` 完成一次定向 testability 收口。只澄清测试
   通过哪些既有公共边界观察行为、如何隔离原生故障控制；保留实际 SQLite/
   文件/进程和故障证据义务，不为迎合错误测试添加产品调试接口、虚构 Core
   API 或改变业务/安全/验收含义。主要修订已有 `design.md`、`path-contract.md`、
   `test-plan.md`，并同步必要阶段/任务记录。保存中断版本及差异，再取得正式
   返回、整包 ponytail 审查及受影响 Spec Gate PASS，冻结 Test 具体输入/路径。
4. 派发新上下文的正式 `juaner_test / R2 xhigh`，不得由协调者代写测试。
   授权一轮完整 Test 补全及其首次验证矩阵：先静态复核全部已知问题，完成
   测试/夹具修订，再按冻结命令组执行。首次矩阵可包含多个不同入口；同一
   入口失败后的修正重跑计入下一项额度，不能藏在“首次补全”内无限迭代。
5. 本次恢复另有**最多两轮纠正—验证，总计两轮**，不是每个文件/AC/命令各两轮。
   一轮是针对已记录失败，修改测试/助手/执行配置并对冻结的受影响入口作一遍
   验证；再次修改或重复失败入口另计一轮。多条必需的不同测试命令不各算一轮。
   预算跨角色和上下文累计；不能换 Agent、改问题名或回 Spec 获得新额度。
6. 每轮执行前由 Mini 协调者在既有记录核对原因、预期变化、命令/写入范围和
   剩余额度，并将本轮上限传给正式 Test；该角色返回结果后协调者才判断下一轮。
   不到最终交付时才补做计数。任何一轮无根因收敛/修复进展、效果未知或额度
   耗尽后仍有阻塞，即停并集中回传。预期的缺失行为 RED 不是“无进展”；测试
   非零退出也不能自动充当有效 RED。只读检查不计纠正，但不能借此执行测试。

本次补全主要写入冻结索引内的 15 份 Desktop Test/fixture 和
`tools/harness/validation/run.test.mjs`。如行为覆盖需要新增叶子，按既有技术
委托在原 Desktop Test 候选目录内冻结精确路径后交 Test，不能扩大到产品源码、
无关测试或新框架。P4 的 package/lock 与既有 local-analysis 集成测试改动
保留，不在本恢复中重写。Spec、Test、协调者的写入职责保持隔离。

## 补全必须解决的已知问题

- 保留 CVR-TEST-001..004 的原正负行为与禁止副作用断言；新增 runner 断言
  观察实际子进程行为，区分 syntax/typecheck 与运行阶段，不用源码扫描代替。
- 正例夹具独立健康：不同用户命令使用不同 ID；只有同意图重复交付才复用 ID。
  文件长度/hash 从实际固定字节计算，快照/confirmation/代码/manifest 关联一致。
  先排除夹具本身必然被正确实现拒绝的情况，不能为通过而削弱产品校验。
- 完成真实存储约束、发布/失败矩阵、终态不可变、损坏保护、重开/崩溃恢复、
  独立计算对照、Assistance 披露/隐私/准入/迟到结算和独立终态竞态测试。
  沿用既有要求，不通过增加公共场景 API 或替代真实被测能力来掩盖缺口。
- 实包 E2E 使用实际启动配置与已批准 UI 标签/状态，覆盖完整专业模式流程、
  两尺寸、键盘/模态、安全、闭环、采纳/拒绝、导出/重开和恢复。常量声明或标签
  存在不等于行为已证。仍不授权真实 Provider，正常无调试原生入口人工验收
  按原计划留到后置阶段并标 NOT RUN，不能在 RED 阶段冒充已验收。
- 91 项 AC 逐项指向具体断言/测试叶子或明确获准的后置人工验收；不以批量生成
  的映射行数当覆盖率，不以 import 缺模块掩盖后续错误断言。只对当前阶段适用
  的自动化行为建立有效 RED，准确记录无法在缺实现阶段执行的后置检查。
- 按[测试资产退休政策](../../governance/test-asset-retirement.md)恢复三类台账：
  permanent regression / temporary evidence / retirement candidate，逐项给出
  消费者、继承者与处置；不静默删除已接受回归、未替代义务或封存中间失败。

## 关闭条件、保留阶段与后续

Mini 协调者复核新的规范身份、逐项覆盖、夹具/环境健康、旧回归保护、因缺少
批准行为而产生的有效 RED、资产台账、精确 Worker 范围及剩余风险。满足原
TDD_READY 条件才释放 Worker；部分 RED、文件数量、P4 PASS 或 Spec 标签不算。
通过后按原 Worker → GREEN/回归 → 测试资产退休 → 独立 Validator → 已授权
Git 交付连续推进，无需逐 Gate 人工转发；本补充不提前授予实现或交付 PASS。

不因本恢复重做 Stage 0/1、WIP、工具安装、P1–P4 或成功探针；仅执行本次
测试修订必要的受影响检查。输入/实际行为变化时按原规则评估相关证据时效，
不把“免重做准备”解释为免产品回归。保持原依赖/来源/脚本、权限、数据、
Provider 与 Git 边界；旧 State/pointer/pause/Ledger/Host Loop 和旧工作树不动。
旧 Change 仍为 `BLOCKED / DISPATCH_ORPHAN_READY`，不是 CLOSED。

沿用原证据根和现有阶段记录，不增加管理框架、自动计数工具或新执行任务。
由用户手动转发到原任务；MacBook 不自动发送或派发生产角色。
最小回顾：根因是初稿测试质量不足和协调者未及时约束纠正循环；关闭点是
合格的 Test/TDD_READY，不是凑够一次 PASS 或完善自动化。既有技术委托不收回，
长期预算不放宽；本补充只发布这一次有界恢复权限，未宣称问题已经修复。
