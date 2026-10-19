# Git交付中的LA09平台适用修正

本记录是候选003的有界Git交付修正，不替换其固定归档，不重开旧两线。真实Provider、
真实业务数据、发布／生产仍未授权。原001／002 FAIL、全部固定包、累计消耗和UNKNOWN保留。

## 准确失败与因果

首个提交ffc7caccfbca9e73a68212b607eac9eb61adb9e7在
[CI39235077405](https://github.com/gadfly-hbo/JuanerAI/actions/runs/39235077405)失败。
Ubuntu的LA09 none／syntax／sandbox三例读取build/xanthil-toolchain-deployment.json时
ENOENT，尚未执行模型或Python。desktop-integration为1805 tests／1775 PASS／3 FAIL／
27 SKIP，exit1、803秒；portable exit1、926秒。不是20分钟作业或1080秒外部超时。
gh合并显示日志缺尾，原生logs.zip及其中完整step.log已另行保存，不能据缺尾猜测挂起。

原执行器member-preparation-executor.ts明确在非darwin拒绝ISOLATION_UNAVAILABLE；
LA09与已有LA22同样需要真实macOS监督器和本机部署描述。向Ubuntu复制Mac路径，或者
改用无沙箱Python，均不能履行原沙箱反例。修正只对LA09登记process.platform不为darwin
时的显式SKIP，理由为“real macOS supervisor is required; no inherited sandbox exception”。
不按描述文件缺失、CI环境变量或断言失败自动跳过；Mac失败仍是FAIL。

唯一非Markdown／board改动为open-analysis-long-artifact.integration.test.ts中的测试登记
及两行说明。所有用例正文、原程序、长内容约束、原生工具路径、真实执行／独立核验／
保存读回断言、syntax／sandbox负例和canary不变。生产代码、执行器、SDK、package和lock不变。
未增加超时、输出窗口、恢复次数或重试，也未删除任何断言或用例。

## 可重复检查与证据效力

设备证据根仍为JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001，
本次子目录git-delivery-001，不另建证据权威。

- CI39235077405-native-logs.zip、CI39235077405-native-step.log及log-readback.json：原生失败原件。
- run-la09-portability.py：相同LA09实际测试入口的有界诊断。实际宿主是Mac；platform-linux-preload.mjs只注入平台判断，不能冒充Linux执行或Linux安全证明。
- la09-portability-red：修正前、无部署描述，三例准确ENOENT；0.842秒、exit1。
- la09-portability-green：修正后、同一注入条件，3显式SKIP／0 FAIL、exit0。
- la09-native-green：真实Mac和原部署描述，三例均实际执行PASS／0 SKIP，约4.124秒。
- la09-native-missing-descriptor：真实Mac缺少部署描述仍3 FAIL／0 SKIP，禁止缺材料静默豁免。
- CI-CORRECTION-SCOPE.json及behavior-source-git002-pre/post：1175个行为输入仅上述一项改变，
  1174项字节相同；当前摘要7ced6bb3405b7a6da2768c3d7882106cbcff6f0ae071332d4af044dbf0158863。

本修正当前完整本地Canonical回归、受影响独立复核及当前HEAD托管CI分别记录，未完成
不称PASS。Mac真实LA09继续作为AH-07证据；Ubuntu增加的3项SKIP只表示平台不适用。
原候选003完整审查复用于未变生产行为；新测试登记的独立检查不得由作者自审替代。
原生角色未加载只读沙箱的失败事实保留；前次CLI例外已到离线收口终点，本次若需CLI
替代须得到用户明确例外授权并核验实际角色全文、Astra/max和read-only／never后执行。

当前源码修正已完成完整Canonical本地回归：19组exit0，5099 tests／5091 PASS／0 FAIL／
8保留SKIP，384.416秒，前后源码摘要一致；real-model gate关闭。新结果为
canonical-git002-result.json／summary.json／log；未覆盖原Canonical083历史。
用户随后明确授权本次Git修正必要CLI只读复核；实际配置预检和审查turn均为
Astra/max、read-only／never。审查尚未收口时远端main新增PR107（8b391f18），涉及CI
输入与审查治理。主Agent先中止未完成审查，保存原输出和exit1，核验全部8个任务进程
已停止、2355源文件／mode未变；未产生或收集最终审查结论。此项是基线推进中断，
不改称候选FAIL或PASS。计划在同一工作分支安全纳入无重叠的10个上游路径后，以新的
完整固定组合完成仍在原授权终点内的必要复核。历史原生BLOCKED及强只读CLI条件保留。合并前仍须
当前HEAD托管CI成功及base／规则复核。最终Git／CI／同步身份以外置FINAL-GIT-DELIVERY-RECEIPT.json
和GitHub实际结果为准；失败原件永久保留，不把后续PASS改写成首次通过。
