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

相对当前上游，本工程作者唯一非Markdown／board修正为open-analysis-long-artifact.integration.test.ts中的测试登记
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


## 当前基线组合（PR107纳入后）

本地检查点29bedd3保存原修正；随后在同一分支以无冲突merge a3dcefd02纳入
origin/main 8b391f18f5e560916e3ab87e64217a6c643e68e8（PR107）。上游10项CI／治理改动
与本PR既有提交路径零重叠；原29bedd3、完整fixed003、全部旧失败与中断证据均保留，
没有rebase／amend／reset／stash／force-push或其他工作树切换。

新组合的1175个行为输入摘要为
09ab5ff28ba58c128cfafe173247bb7c3e30d57d25209f714cc5be7da930629d。
相对修正001，仅5个上游非Markdown路径改变：独立角色TOML、CI工作流、配置检查器、
CI分类器及其测试；逐项字节精确等于8b391f18的Git blob。运行源码、SDK、package／lock、
LA09测试和6588字节原函数均不变。BASE-107-BEHAVIOR-DELTA.json保存归因。
Canonical-git002的原5091 PASS不冒充这些新CI输入的整体验证；新完整Canonical-git003另列。

在安全中断和角色源文件更新后，使用新鲜独立CLI上下文加载当前完整4693字节角色指令
（SHA ad0636e84f8a1a19d5a5aa3ea316dfd7f8b067f4d3c77d902fa4f585b875b9fc），
仍在同一明确的本次Git修正必要只读复核授权内，最终结论尚未收集。预检实际Astra/max、
read-only／never与原生developer全文匹配已核验。旧上下文和中断前消耗不清除；新上下文
按唯一session另计。PR107的原生行为只读说明不被冒充OS隔离，也不撤销本任务CLI强只读条件。

当前新基线组合Canonical-git003已收集：19组exit0，5156 tests／5148 PASS／0 FAIL／8保留SKIP，374.89秒，前后行为源码摘要一致，real-model gate关闭。
据此固定完整候选再交独立评估。当前HEAD托管CI／合并／
同步仍未执行或接受；最终实际结果仍在同一外置Git收据与PR记录，不能预填未来PASS。


## 当前组合独立复核与限定接受

当前固定Git修正002的完整2355文件在审查前后字节／mode均一致。独立CLI
Astra/max、技术read-only／never及当前完整4693字节角色实际核验符合；
[完整原始报告](independent-validation-git-ci-002.md)为7345 bytes，SHA256
`8d78ab039b873b2a4b3f4429ec55351bab492ad7514d5482d3fff32cd5ed4e9a`，结论PASS、无材料性阻断。
该结论覆盖平台适用、原6588字节函数／全部断言、实际Mac正负证据、Store读回、
上游CI／配置输入和未变生产行为的适用复用；新的完整Canonical为5148 PASS／0 FAIL／
8保留SKIP、19组exit0、374.89秒。独立审查收集exit0，相关进程已结束，
本次CLI例外于最终结论收集处结束；无后台审查和后续角色权限推断。

工程主Agent据此维持当前组合的ENGINEERING_ACCEPTED_OFFLINE_WITH_LIMITS。
真实Provider、业务数据、真实Q、用户产品／阶段接受、发布和生产不代签；旧两线停止，
R仍Q_FAIL，40ID增量0。原001／002 FAIL、原生BLOCKED、基线推进时未完成审查exit1、
首次CI FAIL及全部UNKNOWN／累计消耗保留，不由此PASS改写。

独立建议仅为逐字保留三份旧报告末尾空行，以及旧内部摘要损坏永久夹具强化建议；
前者不做字节规范化，后者未伪称新增覆盖。当前Git提交仅补充报告、接受／任务和
能力投影记录；行为输入1175项摘要仍`09ab5ff28ba58c128cfafe173247bb7c3e30d57d25209f714cc5be7da930629d`。
当前推送后的精确HEAD托管CI、squash、逐端安全main同步尚待实际收集，不能提前记PASS。
这些事实只补入现有PR／回复或本机持久证据根git-delivery-001/FINAL-GIT-DELIVERY-RECEIPT.json，
不为未来事实递归新增记录PR；本提交时的待执行标签保留其时点。
