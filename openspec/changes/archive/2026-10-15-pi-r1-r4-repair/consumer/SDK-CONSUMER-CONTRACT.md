# JuanerAI → pi-agent-runtime：R1～R4 最小消费者需求 v1

状态：Mini 已形成可转交材料；SDK 未接收/确认，新包未交付。不是 SDK 已实现合同。由用户转交，不跨聊天派工。

## 固定来源

Mac mini；工作树 `/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI`；分支 `work/mac-mini/pi-r1-r4-repair`；来源 HEAD `8265a3920ee1205faec7dede8b0c84e648105d9d`。生产消费者取自该 HEAD，交接脚本是本次未提交产出，以 manifest 固定。原报告 bundle-001 四文件 SHA256 校验通过。报告的 MacBook 真实故障原因仍 UNKNOWN，没有复制真实 Session、凭据或业务资料。

当前 SDK0.4.3 固定 tgz SHA256 `475480217d5f644a15264b2f838e5567d3e2c2e431b8a23c061a0665dbdbfa70`；108617 bytes；49 个已安装文件与归档逐字节一致（installed-identity.json）。Pi core/ai0.86.1；coding-agent0.84.2 兼容路径保留。不要根据版本号推断安装身份。

## 当前实际消费者

正常 browser composition → personal profile → Application 的业务工具 → `adapters/agent-pi/native-open-analysis.ts` → 安装包 createSessionRuntime / createPiTransport。源码副本和逐文件哈希见 sources/ 与 manifest。

Adapter 在 transport 内替换工具 description/schema，才做物理账本 reserve/issue、凭据访问和实际 HTTP。因此 SDK 更早的通用工具投影不能证明最终请求安全。当前 compaction 开启 reserve16384/keep8192，native retry关闭；modelRecovery.extraAttempts=1。SDK是唯一原生Session/Agent循环所有者；historyOwnership避免另造对话循环。

四用途 analysis/proposal_prepare/report_edit/retained_case 当前每个只声明一个model。MiniMax-M3窗口200000/输出4096；另有 MiMo 配置窗口1048576（分析/报告既有用途配置和授权各自有效）。不能将报告用途或名为backup的变量当作已接候选链。

27项 native 业务工具由 `createNativeBusinessTools` 固定注册。Application 负责当前阶段实际 schema、授权、业务执行与本地证据，Adapter负责Pi转换。全部名单见 sources/open-analysis-adapter.ts。旧CLI工具和旧任务本轮不退役。

## 必需的共享接口语义（名称由SDK固定交付，Mini按实际API接入）

| 需求 | SDK输出/行为 | Mini输入/责任 | 拒绝/失败语义 |
|---|---|---|---|
| R1-READ | 复用createExecutionTools(host,['read'])，原生offset/limit和截断提示；不提供shell绕限建议 | 主机控制逻辑引用→获准文件映射、全量本地计算、撤权，按当前标准执行只读环境 | not_found、permission_denied、unsupported、取消、限额分别可判；不把所有FileError归一 |
| R1-CTX | 在最终产品投影后、物理发出前可强制执行的准入接缝；不能只是异常被吞的observer hook | Adapter提供候选实际model、最终messages/system/tools及输出上限；账本reserve/issue顺序与SDK对齐 | 含schema/history/current tail/图像与协议开销；按真实候选窗口；压缩后重查，不足即安全拒绝 |
| R1-COMPACT | 原生压缩与恢复；摘要请求也进入最终准入、授权和同Task物理计量 | 产品不删除历史、不缩减全量计算范围、不另建压缩器 | 单次当前巨型tool保留尾部仍不安全时不能照发；无虚报1M窗口 |
| R2-FAIL | 保留stop、可确认的failure category、known usage、physical state、安全诊断及真实model | Adapter转换为JuanerAI中立字段；产品保存/HTTP/client/UI读回；不把原文异常/提示写入安全诊断 | 已知usage不归零；未知保留UNKNOWN；不得由output=1反推length或400 |
| R2-RECOVER | Worker拒截断；Agent安全长度/overflow可原生恢复；fallback/retry/recovery共享一次额外尝试 | 固定同Task/purpose/config，传撤权/取消、持久budget和副作用回执 | 已有成功工具不重放；未结/撤权/取消/不兼容时不再调；摘要等物理调用仍计量 |
| R3-OUTPUT | 工具输出约束和原生read引用的最小组合接缝；说明执行后超限如何保留效果 | 产品逐业务工具小结果/可读材料/证据provenance；完整inspection、计算和报告留本地 | 超限不是未执行；不能丢回执、再执行工具或把探索当proof |
| R4-ROUTE | 复用现有purpose.fallbacks，每候选重新最终准入、授权和能力检查，实际模型身份可记账 | 仅装配已批准用途、provider接收方、模型、协议/思考/图像能力；旧任务配置不变 | 较小窗口重新检查；同一不安全上下文不盲切，恢复上限不叠加 |

不要求SDK承接JuanerAI业务schema、UI、业务判断或数据库。具体新字段、限制估算方法、已知usage错误载体、摘要记账钩子、执行后超限回执契约，待SDK以真实API/测试回执确认。此为必要双方接缝，不是创建第二运行层的许可。

## 可运行材料与证据级别

`consumer/sdk-consumer.test.mjs`（在仓库内为本文件同目录）：只依赖实际安装的包；真实native Session/read和pi-ai codec，合成模型transport/HTTP响应；memory budget与reconcile ready仅测试host，不证明生产持久安全。源码内global fetch拒绝网络；C07仅注入离线fetch和虚构key。

```sh
SDK_CONSUMER_ROOT=/absolute/isolated/installed-consumer \
SDK_CONSUMER_EVIDENCE_DIR=/absolute/new/persistent/run \
node --test consumer/sdk-consumer.test.mjs
```

SDK_CONSUMER_ROOT包含package.json/node_modules，须先安装独立核验的固定tgz。禁止指向SDK在研源码/可变链接。推荐本次实际运行Node26.0.0。每次用新证据目录，避免覆盖。没有新SDK包时当前脚本仍可复现旧包。

`consumer/juanerai-consumer.test.mjs` 要求 SDK_CONSUMER_ROOT 是固定 JuanerAI 检出及其安装树。它生成两份各2985行CSV，真实Application→Adapter→安装包，捕获Adapter最终ModelRequest，真实产品request ledger。停于inspection，刻意不保存Outcome；不等于完整V02。本次源资料为合成，所捕获请求可转交。

冻结执行8项：4 PASS、4 FAIL，exit1，见 evidence/frozen-run-001.log 与 run-result.json。

- C01 PASS：原生read2000行边界与offset续读、目录越界/绝对外部路径/软硬链接拒绝（V17局部）。
- C02 FAIL：缺失文件实际code=permission_denied（F10因果复现）。
- C03 FAIL：Agent length→INVALID_OUTPUT，1次调用，usage7/3已知；未恢复（F02）。不声称这个合成例丢失usage。
- C04 PASS：Worker length拒绝、validate未调用。
- C05 PASS：原生purpose候选回退，工具效果恰好一次；产品实际配置尚未接通（F05）。
- C06 FAIL：模拟实际host后投影接缝，膨胀请求到达wire stand-in。这是API接缝探针，不能要求SDK阻止任意绕开API的host；新API回执后必须改为消费正式guard，不可原样作为新包验收。
- C07 PASS：真实pi-ai OpenAI SSE codec保留length和usage19/4。不是Agent恢复PASS。
- J01 FAIL：实际产品两份2985行inspection投影仍超过原生read50KiB目标；final-projected-request/measurement证据完整。50KiB是read页目标，不是已冻结catalog总预算；bytes也不是tokens，不声称真实Provider拒绝复现。

历史首轮 sdk-run-001 有两项夹具问题：C02只查message误PASS，后改查code；C05漏固定purpose.tools导致INVALID_REQUEST，修正后PASS。保留历史，不把它们计SDK缺陷。冻结最终run为当前有效材料。

## 尚未验证及接收要求

V01～V17适用矩阵见 spec.md。还未完成：200k/1M真实最后准入、压缩保留当前tool、全HTTP分类/已知usage错误、长单行和宽表引用、所有工具输出、生产主备、实际IR/proof/store→HTTP→renderer、取消/撤权/迟到/未知/保存失败、旧tasks/skills/fork、新包实际安装。无独立Validator PASS、工程完成、用户验收、真实Provider或Git发布声明。

请SDK回交：新精确版本不可变tgz+SHA256、内容/依赖manifest、共享合同/API文档、可运行测试及结果、兼容/回滚/旧任务限制、上述接缝逐项支持/缺口。Mini可读交付位置 `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-handoff/2026-10-14/sdk-incoming/<version>/<sha>/`。不要求先发布正式Release。Mini核验字节与实际解析后才采用，继续真实消费者联合验证。
