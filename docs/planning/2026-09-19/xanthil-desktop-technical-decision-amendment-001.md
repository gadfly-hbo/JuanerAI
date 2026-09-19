# PKG-XANTHIL-DESKTOP-001 — Technical Decision Amendment 001

## 授权、身份与优先级

用户于 2026-09-19 批准长期“范围内技术决策权”，并明确将当前 Run 合同适配
纳入本批次。唯一长期规则见
[执行政策](../../governance/product-change-execution-policy.md#in-scope-technical-decision-authority)。
本补充是当前冻结批次的采纳记录，不是新的产品计划、UI Gate 或生产验收。

- Package：`PKG-XANTHIL-DESKTOP-001`。
- Change：`xanthil-desktop-membership-repurchase-decision-case`。
- 原 Mac mini 任务：`纵切-1.0` / `01a0b45a-13ad-7b92-a2b4-cdde980558e1`。
- Mini 仓库：`/Users/bendandebaba/JuanerAI`；独占分支
  `work/macbook/whitepaper-blueprint-v1`。
- 接收前 HEAD：`672f2b23d60248f817fe0b845761f61a125dbf37`；
  tree：`a9eeb97d2cf774578d279b99d4631be7342c0bad`。
- MacBook 仅在 `work/macbook/wip-preflight-exception-disposition` 发布本补充；
  固定发布 commit/tree/文件 hash 见随附转发回执，不切换或写入 Mini 分支。

本次在半自动模式中替换原执行包 Stage 2/4/5、Path authority、Preauthorized
role progression 里“任何新共享合同/技术设计都必须回 MacBook”的一律停止条款，
以及整体依赖/结构决策 §4 对 Run 合同“原样复用”的解读。替代范围仅为新政策
允许的技术决策；原七份包/补充字节保留，其余产品、权限、预算和 Gate 不变。
Spec Gate 的技术决策批准可由受委托的 Mini 协调者给出，不再要求 MacBook
逐个批准版本号、字段名、Port/factory 名称或批准模块内的具体文件名。

## 已核对的停止点与证据限度

当前停止码为 `BLOCKED_CONTRACT_DECISION_REQUIRED`。MacBook 已通过只读连接
读取 Mini 完整回执及 `decision-brief.md`，核对 Git HEAD、回执大小和 SHA-256，
并从本地同 HEAD 源码确认旧 Run Store 的单固定 CSV／模型必填限制。
Mini tracked/staged 无改动，十二份未提交草案保留；这不是 clean 全工作树声明。

唯一原始证据根属于 Mac mini：
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`。
以下相对路径均位于该根的 `dependency-preflight-001/baseline-integrity-001/`：

- `controller-exception-001.md`：10960 bytes；SHA-256
  `f88a9971de52e841744a813cd04b6fc26eaf0676bb07de2f0865b9c41e881801`。
- `run-store-contract-precheck-001.json`：回执记录 21124 bytes；SHA-256
  `69767ed425e985f44a8238cc73f83f326b315540b284fd2aa6892dd3eca314fd`。
- `controller-exception-index-001.json`：原回执、十二份草案及差异的索引。
- `p3-final-coverage-001.json`：Mini 当前完整 P3 结论；保留较早的部分证据和
  `p3-coverage-correction-001.md`，不把过早的完整 PASS 标记重放为结论。

六归档校验、六字段补全和 P1/P2/P3 PASS 是 Mini 已报告的依赖准备结果。
本次 MacBook 未重跑探针或独立复核全部原始依赖证据，不宣称产品验收或跨设备备份。
无输入变化时沿用这些阶段证据，不因合同授权续接而重做安装、解析或成功探针。
新 candidate lock（位于原根 `dependency-preflight-001/package-lock.json`）
为 319836 bytes / SHA-256
`861326061cd570b0e81584f149012b13228aec3da6528d82536f89cbb5d535c0`。
仓库 manifest/lock 仍未在 P4 采纳；接收本补充不提前解锁 P4。

## 当前 Run 适配：批准方向，不预定物理 schema

采用决策简报 A 的目标：为已批准的双 CSV、无模型确定性分析提供最小必要的
Run 合同支持，同时保留独立 `.xanthil/runs/<run_id>/` 证据。

Mini 协调者可组织正式 Spec 决定闭合 schema、版本、证据形状和最小业务
Port/storage factory，复用适用的物理原语；并在原执行包列明的候选模块根内
确定精确文件清单，在相关角色写入前冻结。不要求再次向用户提交这些技术命名。
这不是直接批准历史草案里的“3.0”，也不要求引入新 factory 或另造通用存储系统。
规范必须同时满足：

1. `members.csv`、`orders.csv` 的实际快照身份和证据可追溯；无模型运行如实
   表示没有 provider/model 调用，不填虚构模型、Pi 执行信息或旧 fixture。
2. 既有 schema 1.0/2.0 的受支持读取能力、CLI/Console 行为、Port/factory 和
   固定 fixture/model 合同保持兼容；历史 Run 文件不改写、不迁移、不删除。
   新旧消费者/版本路由须明确，不能要求旧消费者静默接受未知的新版本。
3. 独立 Run 工件、SQLite 操作索引、源快照、聚合和报告仍分别承担已批准职责；
   保留既有及本 Change 已批准的失败、取消、deadline、发布和终态不可变语义。
4. 复用只针对真正适配的部分。以原断言和旧行为回归保护既有成果，并为新路径
   增加相应合同/正负证据；不能泛化或删除旧校验来使新场景“通过”。

删除独立 Run 证据或将 SQLite/报告改为其替代权威（简报 B）未批准。
新增业务含义、架构/安全边界、第二 Runtime、依赖版本/来源/脚本权限、真实
Provider/数据或主机操作仍不在本补充授权内。

## 原任务续接与关闭条件

1. 按随附固定提交回执核对 Git 身份、唯一 parent、完整文件清单和 hash，保全
   十二草案后在 Mini 原分支 ff-only 接收；接收前后逐份原文 bytes/hash 一致。
   已接收则核对后跳过；未知冲突/并行写入停止，不 reset/stash/清理或覆盖。
2. 在现有 `verification.md/traceability.md/tasks.md` 记录本授权、采纳结果和
   实际阶段。协调者将当前 Run 决策归入已授权技术适配，解除“缺少 Controller
   合同决定”这一停止原因；这不等于 SPEC_READY、Spec Gate 或产品 PASS。
3. 正式 `juaner_spec / R2 xhigh` 在原 Change 完成最小修订，协调者依长期政策
   审查合同闭合、兼容性和精确路径。按现有规则完成整包 ponytail review、
   Spec Gate；通过后才进入原 P4、Test/有效 RED、TDD_READY、Worker、回归、
   测试资产退休和独立 Validator。保持角色隔离和原获准 Git 交付顺序。
4. 后续同类范围内技术决定在本任务按现有记录和 Gate 解决，不再要求一项一张
   MacBook 补充包。若已过 Gate，暂停受影响实现并局部返回 Spec/Design，刷新
   受影响的批准和测试证据后再继续；不跳过 Gate、不改断言来掩盖实现失败。
5. 成功阶段不逐次转发。仅实际超出委托、缺失业务决定、预算耗尽或无法安全
   解决的异常回传 MacBook。当前三轮执行纠错和其他明确预算不重置、不扩大。

当前人工转发方式保持：用户转发到原任务；MacBook 本轮不自动发消息、新建
任务或派发生产角色。Stage 0/1 与已接受 WIP 处置不重做；旧 Host Loop、
State/pointer/pause/Ledger 和旧工作树不动。旧 Change 仍为
`BLOCKED / DISPATCH_ORPHAN_READY`，不是 CLOSED。

本治理修订以规则无冲突、原冻结输入不变、发布身份可核对且原任务可续接为
完成条件；Run 实现和产品验收留在原生产流程，不由本补充冒充完成。

## 最小回顾

按现有复杂度回顾要求记录本次用户纠正：这是 R0 治理修订，产品仍是原 Foundation/R2
Change，尚无 Spec Gate、产品 RED/GREEN、Validator 或 Acceptance。
有效摩擦是阻止假模型/假来源及未经授权的证据边界变化；可避免摩擦是早期将
“复用旧基础”误写成“合同原样兼容”，并只委托命令纠错而未委托必要技术设计。
最早应在任务包准备/复用核对阶段识别。持久修正归执行政策，本包仅绑定当前
适用范围；无需新自动化工具、管理框架或重复产品规划审查。原失败和处置历史
保留，后续返回点是原任务 Stage 2 Spec/Design，不是重新启动项目。
