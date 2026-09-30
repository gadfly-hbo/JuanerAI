# PASS — 固定 Candidate010

**F1–F4 均已修复，相邻 closeSession 授权问题也已关闭。**本次未发现新的实质缺陷或阻断性证据缺口；没有使用风险豁免。

## 固定身份

已核对完整候选：**695 个源文件、90 个变更路径、相对 Candidate009 的18处差异**。冻结源与对应工作区文件一致，25,101 个复制证据文件的长度/SHA 全部匹配。

- [Manifest](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-010/manifest.json)：328,933 bytes  
  `62be1c4ce46740f8c199b411362948db8ecd70838f984d18c4d1175365853f83`
- Base：`dfe2fa5d88f23e9049476423b222d29b22edc579`
- Base tree：`0c46c4fd985a71cc6da05fc2538f356c2b098e21`
- Package018/internal014 ASAR：  
  `a209b0eaeccb211160e995c203a5a7b5547d2d203dc06e923a4d2066c6075d70`
- DMG011：232,097,609 bytes  
  `32ee23123e5d443c9558614d9645897e9c9eb2d93c10bcbe6ec43e736f450b57`

原独立报告与冻结的正式验证记录逐字一致，历史 FAIL 未被改写。

## 修复复验

| 项目 | 独立结论 |
|---|---|
| **F1：后续窗口关闭清理** | 同一 VM 检查在 Candidate009 重现第二窗口起返回迟到证明；Candidate010 连续4个窗口均拒绝迟到证明，执行4次清理。 |
| **F2：一次性辅助关闭后继续执行** | 三个辅助在凭据读取、preflight、admission、活动 Runtime、结果提交前读取处关闭，均无迟到请求或草案；释放凭据，旧授权不可重用，新授权成功。 |
| **F3：取消后仍提交新 Key** | 写入前取消/关闭均为零写入、保留旧 Key。已发出的写入分别正确报告已提交、未提交或读回未知，没有假称回滚。 |
| **F4：失效 Key 被重新启用** | 认证拒绝跨网络、超时、额度及 Keychain 拒绝/恢复保持有效；成功验证才能恢复。旧 generation 的迟到失败不会污染替换后的配置。 |
| **closeSession 相邻问题** | 未消费 preview 被删除，进行中的 prepare 不再迟到恢复授权；pending start、Running、Waiting、发送中关闭均安全，新 prepare 仍可使用。 |

检查了修复对原手动分析、历史、草案采纳、报告、共享配置、精确披露和权限边界的影响；没有新增 IPC、业务持久化 schema、Provider、重试或 fallback。

## 本次独立执行

全部通过：

- **28 项**冻结单元测试。
- **15 个**自行构造的三辅助生命周期场景。
- **14 个**Case Session/应用关闭场景。
- **11 个**保存取消、模糊结果及失效凭据恢复场景。
- Candidate009/010 的 Main 对照检查：各连续4个窗口，确认原缺陷敏感性及修复结果。

上述自行构造检查执行冻结生产代码，使用内存 Store/Runtime 替身。没有启动原生 GUI、写真实 Keychain或调用真实 Provider。

## 原生、构建和历史证据

已核对[原始证据汇总及绑定](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-010/evidence/ps-lifecycle-final-readback-001/ledger.json)：

- Canonical：**2238 PASS / 0 FAIL / 1 real-gate SKIP，15 groups**；其中原生 **66 PASS**。
- 当前类型检查通过；Package018 的62个生产/构建绑定均匹配候选。
- DMG 安装后的原生3项及普通 LaunchServices 1项通过。
- host031 生命周期记录：12次关闭/新窗口转换、18次合成 SDK 请求、零 fetch/socket、零取消后保存、旧合成 Key 保留。

**host031 的证明范围明确：**它使用已安装 Electron 和未改动的 ASAR Main，通过测试专用 `window-all-closed` 监听保持合成宿主。监听器身份有前后核对，所有重开阶段 `before-quit=0`，因此全局退出清理没有掩盖窗口缺陷。它不是普通打包应用的 LaunchServices 验证，也不是实际 Keychain或真实模型调用证据。

生成的 `native-synthetic-main.cjs` 运行前版本和实际消费版本均有可访问副本及独立身份记录；canonical 明确重新生成该文件，实际消费身份匹配。**该差异归属充分，不构成生产源码/包漂移。**

历史真实模型成功片段仅复用于已证明未变的 Pi、请求、payload及解析分支。plan003、plan005 整体仍为 **FAIL**；缺失的拒绝文本细节仍为 **UNKNOWN**。无需仅因本次本地生命周期修复重复付费调用。

## 验收与限制

- **PS-01–07：工程验证证据支持通过。**本次重新查看1440×900及1280×720设置截图；UI源未改变，既有键盘、清空、错误、Preview和无 Key 手动流程证据继续适用。
- 原 Change002/Change1 的受影响保护及测试断言保留；F1–F4 有对应因果 RED，环境/夹具失败没有被计作产品 RED。
- **PS-08：目标 MacBook 用户 Product Acceptance仍待用户完成。**Mac mini证据不替代该验收。
- 无新增实质阻断项；无另列非阻断整改建议。无需新增宿主探针。

**本 PASS 仅是 Candidate010 的独立工程证据。Engineering Acceptance、最终交付、MacBook 产品验收以及 Git/归档仍由 Controller/用户负责。**