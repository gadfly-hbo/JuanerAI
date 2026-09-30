# FAIL — 固定 Candidate009

发现 **4 项实质缺陷**，均已用冻结生产代码及合成内存依赖独立复现。当前不能给出 Validator PASS。

## 固定身份与范围

核对了完整 Change002 WIP：**693 个源文件、88 个变更路径**，未将重叠的旧代码整文件排除。源文件、18,013 个证据文件及交付物的长度/SHA 均与清单一致。

- [Manifest](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-009/manifest.json)：`cfed44b3da46f8b79461259851765d145f1ecfbdbca34ff585d52b3a654302f5`
- Base：`dfe2fa5d88f23e9049476423b222d29b22edc579`
- Base tree：`0c46c4fd985a71cc6da05fc2538f356c2b098e21`
- Package017/internal013 ASAR：`70666f14f08d1d88e3ed918a6305957205b2bee6131cc5abe1062e8efb03e081`
- DMG010：233,663,319 bytes；`348db40b61985cf617c4c6211d9be05edf7f9a9a15c32e4dd45c45c02166bf2b`

按要求先读批准验收/UI/Freeze/Intake及原 Change1/2 合同，形成正向、失败与并发预期，再检查作者实现和测试。

## 实质阻断项

### F1：重新打开的窗口没有关闭清理

**边界：PS-02/05/07；关闭必须取消测试并丢弃迟到结果。**

[main.ts:508](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-009/source/apps/desktop/main.ts:508) 把窗口 `close` 监听器放在仅执行一次的 IPC 注册分支内。通过 `activate` 创建的第二个窗口没有该监听器。

独立 VM 检查执行冻结 Main 代码，结合真实 Settings Application、模拟窗口事件和延迟探针：

```text
firstCloseListeners: 1
secondCloseListeners: 0
testCompletedAfterSecondWindowClose: true
proofReturned: true
```

**影响：**普通关闭→Dock 重开→再次关闭路径无法保证取消；迟到测试仍生成有效证明。

**复验条件：**每次创建窗口都具有有效清理；覆盖第二及后续窗口的测试、pending start、Running/Waiting和迟到结果。

### F2：关闭窗口后，待启动的一次性辅助仍会发出请求

**边界：PS-05/07及本次 brief 明确要求的 pending one-shot 授权失效。**

Main 关闭处理只取消设置测试、关闭 Case Assistant。[一次性 Application:101](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-009/source/packages/application/xanthil-desktop-decision-case.ts:101) 在取得凭据后等待 preflight/admission，没有关闭取消令牌或对应清理入口。

独立执行真实 Application：

1. 准备并确认精确披露；
2. 将 preflight 暂停；
3. 执行窗口关闭时实际调用的设置取消；
4. 恢复 preflight。

结果：**关闭后调用模型替身 1 次，Attempt 最终 succeeded**。

**影响：**任务可以在窗口关闭后继续使用已取得的凭据。三个原辅助共用这条启动路径。

**复验条件：**取消尚未完成的启动和活动执行，释放凭据；迟到 admission/preflight 不得触发新请求。三个辅助及 Case Assistant 均需覆盖，重开后重新准备授权。

### F3：写入前取消，仍会提交新 Key

**边界：关闭/取消使测试证明失效；PS-02/03/05。**

[provider-settings.ts:76](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-009/source/packages/application/provider-settings.ts:76) 只在保存入口检查证明，随后等待旧 Key 读取，写入前不再检查取消或证明有效性。

独立反例：新 Key 测试成功→保存暂停在写入前读取→窗口取消→恢复读取：

```text
writes: 1
oldKeyRetained: false
saveSucceeded: true
```

**影响：**尚未发生存储副作用时，关闭已撤销的证明仍可用于替换旧 Key。

**复验条件：**写入前取消必须阻止提交；覆盖关闭、取消与延迟读取。已发出的写入仍应按真实读回报告结果，不能假称回滚。

### F4：已确认失效的 Key 可被失败重试和本地恢复重新启用

**边界：PS-04禁止失效配置误启用。**

[provider-settings.ts:14](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-009/source/packages/application/provider-settings.ts:14) 将失效判定绑定到 `lastTest`；后续网络失败会覆盖该值。

独立复现普通恢复路径：

```text
认证拒绝 → 重测网络失败 → 钥匙串拒绝
→ 用户“重新读取钥匙串”
→ state=configured，available=true
→ 同一个被拒绝的 Key 可取得任务凭据
```

期间没有成功测试或替换 Key。

**影响：**界面和任务准入错误地恢复可用状态。

**复验条件：**同一凭据的认证失效事实应穿过网络、超时、额度和钥匙串恢复流程保留；只有适用的成功验证或已验证替换才能清除。此前有效配置的临时网络失败也不能被误判为永久失效。

## 验收覆盖

| 验收 | 结论 |
|---|---|
| PS-01 | 两尺寸、两模式、无 Project 入口及键盘/清空/错误流程有绑定原生证据支持。 |
| PS-02 | 固定单次探针、修改失效等有支持；F1/F3 阻断关闭及迟到处理。 |
| PS-03 | 实际 Keychain CRUD、普通启动、包身份有证据；F3 阻断完整替换生命周期结论。 |
| PS-04 | 错误分类、模糊写入后读回有支持；F4 阻断。 |
| PS-05 | 共享锁和 generation 检查有支持；F1–F3 阻断完整竞态验收。 |
| PS-06 | 四消费者接入及原 payload/确认边界有证据；关闭生命周期仍未满足。 |
| PS-07 | 来源/revision、只读工具、采纳、不可变报告和 Preview 保护有支持；F1/F2 阻断完整结论。 |
| PS-08 | **目标 MacBook 用户产品验收仍待完成**；Mini 原生证据不替代它。 |

对照冻结可点击合同检查了 **1440×900、1280×720** 原生截图，未发现额外的实质样式偏离。Preview 标识及无 Key 手动流程有回归证据。未把静态示例计数当生产数据，也未把“正在生成”截图当完整草案证明。

## 独立执行与证据归属

**本次亲自执行：**

- Settings/Case unit：**18 PASS**。
- 实际已安装 Pi SDK 的离线请求构造检查：**3 PASS**，使用模拟传输并禁止网络连接。
- 自行构造的 Case 正常问答/草案、禁止工具、错误 revision、无效草案、Stop 后迟到结果、过期授权检查通过。
- Waiting 配置锁、Stop 释放，以及“写入已提交但读回被拒绝”的诚实恢复检查通过。
- 上述 **4 个反例复现成功**。

**作者/Controller 证据，已核对原始输出及绑定：**

- Canonical：**2211 PASS / 0 FAIL / 1 real-provider gate SKIP，15 groups**。
- 类型检查、构建、签名、安装、原生及 LaunchServices 证据已检查；本次未重新执行这些宿主操作。
- plan003 **整体 FAIL，6 请求**；plan005 **整体 FAIL，4 请求**；plan006 **PASS，2 请求**。保留历史失败，原拒绝文本缺失的细分原因仍为 **UNKNOWN**。
- 接受有源码适用性证明的旧成功 Case、整理/解释片段与当前 candidate-only JSON-mode 成功证据组合；不要求仅为“更新日期”重复付费请求。它们不能覆盖本次新发现的竞态。

检查了 causal RED 和测试调整：初始缺失行为 RED 有实际失败依据；admission RED 中一次性辅助的 fixture 错误不能计作因果 RED。未发现通过删除原拒绝、手动或负向断言获得 GREEN，但现有测试遗漏了上述组合路径。

本次**没有运行原生 GUI、真实 Provider 或 Keychain 写入**，没有修改仓库、候选、Git或项目板。源码与内存执行不标作原生运行 PASS。

## Advisory 与复验范围

`closeSession` 仍保留未消费 preview；旧 preview 可经后续 `start` 使用。尚未证明普通 UI 暴露该关闭路径，故不单独列为阻断；建议随生命周期修复覆盖。

修复后需要新固定候选，并对四消费者、窗口关闭/重开、凭据证明和错误恢复做受影响回归。建议 Controller 补一次有界合成原生检查：暂停写入前读取和任务 preflight，关闭/重开窗口，记录请求数、提交数、迟到结果与锁释放；无需真实 Provider 或用户凭据。

**本结论仅为 Candidate009 的独立工程验证 FAIL。Engineering Acceptance、MacBook 用户 Product Acceptance及 Git/归档仍由 Controller/用户负责。**