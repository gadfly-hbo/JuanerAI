# 独立验证结论：PASS

**candidate003 已关闭 V01–V06；未发现新的实质阻塞项。** 本结论仅适用于本次固定候选及已授权的离线验证范围。

## 预期行为

基于合格 Completed revision 创建独立 Case Assistant Session，按精确授权进行有预算、可停止的多轮协作。草案经人工审阅采纳后，原子追加 Decision Record、Expected Outcome 和报告版本；失败、停止、拒绝、过期确认不得产生正式写入。历史及第一 Change 行为保留，Fork/Subagent 保持 Preview。

本次沿用未变的已批准产品／UI 输入及此前独立审查结论，复查完整候选、六项修复及关联风险。

## 身份与执行边界

- 当前沙箱：**read-only**；审批策略：**never**。未修改文件、依赖、配置、项目控制或 Git。
- 当前模型／effort 的实际 rollout 由 Controller 独立核验；本报告不以自我判断或旧 preflight 替代当前记录。
- HEAD：`dfe2fa5d88f23e9049476423b222d29b22edc579`
- Tree：`0c46c4fd985a71cc6da05fc2538f356c2b098e21`
- 分支：`work/mac-mini/case-assistant-decision-record`
- [candidate003 manifest](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/candidate-003/manifest.json)：**161376 bytes**
- Manifest SHA-256：`9de0b688a6b771148c202405ca8f01620e1a3f247ce9fffb2fed0bc9c7760bc0`
- Package006 app.asar SHA-256：`7ba04105a5174218d3b9659f0cdf1bda2bf98ab891a96ecda60fe26ce8837938`

结束前再次执行 **5091 次字节／哈希核对**：652 个源文件的工作树与快照、1879 个索引证据及原件、producer、包身份文件全部匹配，**无漂移**。

## 六项发现关闭情况

| 发现／要求 | 独立复查结果 |
|---|---|
| **V01 — AC-04，UI-11/14** | [审阅身份校验](/Users/bendandebaba/JuanerAI/apps/desktop/case-assistant-workspace.tsx:73)绑定 Session、draft ID、版本和字段。21 种变化探针均阻断旧确认；合法编辑、拒绝、采纳仍提交原审阅身份。原生三项证据通过。 |
| **V02 — AC-06，UI-09** | [Stop 独立处理](/Users/bendandebaba/JuanerAI/apps/desktop/case-assistant-workspace.tsx:78)可越过未返回的 start/send；授权面板及时关闭，迟到响应不能恢复运行状态。独立处理器探针及原生鼠标／键盘四项证据通过。 |
| **V03 — AC-06/09，失败语义** | [初始事件失败处理](/Users/bendandebaba/JuanerAI/packages/application/case-assistant.ts:81)将已保存 Attempt 终结为 Failed。独立 Application 故障探针通过；实际 SQLite／原生证据确认首次失败零模型调用、零正式对象，显式重试可恢复。 |
| **V04 — UI-01** | [顶部模式切换](/Users/bendandebaba/JuanerAI/apps/desktop/renderer.tsx:230)读取关联来源并定位阶段6。独立处理器探针通过；原生首次关联、先前另一 Case、重开三种场景均保留 Quick 连续性。 |
| **V05 — AC-02/06，UI-05/10** | 授权按精确身份集合比较，逆序选择可开始；缺项、重复及替换项仍拒绝。独立五组探针及原生未选择内容不外发断言通过。 |
| **V06 — AC-13，UI-12** | [时间校验与规范化](/Users/bendandebaba/JuanerAI/packages/product-core/case-assistant.ts:33)接受带时区的合法时间并保存同一 UTC 时刻。无效日期／时间继续拒绝；原生保存及取消证据通过。 |

## 验证与证据

**本次独立执行：**

- Core、IPC、已安装 Pi SDK 的合成测试：**5/5 PASS**，无真实 Provider 调用。
- TypeScript `--noEmit --incremental false`：**PASS**。
- 生产 UI 处理器的内存探针，以及真实 Application 配合内存 Store 的故障探针。它们不冒充原生 GUI 或实际 SQLite 执行。
- Package006：49 个生产输入、36 个包内资源、144 个锁定依赖版本、14633 个依赖文件逐项匹配；测试注入及开发工具未进入产品包。

**已审查 Controller 执行的原始证据：**

- [canonical-correction-001](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/canonical-correction-001/stdout)：15 组，**2141 次执行／2140 PASS／0 FAIL／1 gated real-Pi SKIP**，exit 0。
- [correction-native-controller-002](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/correction-native-controller-002/stdout)：**17 PASS**，exit 0；审查了绑定源、实际投影、截图及键盘断言。
- Running／Waiting × 正常关闭／SIGKILL：重开均为同一 Attempt 的 Interrupted，历史保留，无自动续跑或新增正式对象。
- 不确定 COMMIT：提交前／后故障及回执不可读均阻断不安全写入；核对后重放只产生一组正式对象。
- 六项 causal RED 与修复后 GREEN 对应有效。历史 native001 六次失败属于已处置的 Playwright 进程句柄生命周期错误，未算作产品 RED。

最终 canonical 与候选之间仅有三份结果／交接文档更新；生产代码和测试一致。测试修订未删除或弱化第一 Change 的行为与负向断言。存储原子性、回放、历史、预算、数据权限、Pi 隔离及既有架构结论未被本次修复推翻。

## 阻塞、建议与限制

- **实质阻塞：无。**
- **另列非阻塞建议：无。**
- **待 Controller 补跑请求：无。**

未重复全量回归或在只读沙箱启动 GUI。真实模型质量、真实业务数据及付费 Provider 验证仍为 **NOT RUN**；合成 transport 证据不证明真实模型质量。

此 **Validator PASS** 是独立工程验证证据，**不授予 Engineering Acceptance、用户 Product/UI Acceptance、Git 集成、OpenSpec archive 或真实 Provider 执行权限**。