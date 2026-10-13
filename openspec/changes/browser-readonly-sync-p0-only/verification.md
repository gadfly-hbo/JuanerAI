# P0-only：006证据与正式发布候选

## 冻结历史（均不改）

candidate-006 manifest SHA-256 `6a8205c7bb5a8055296258e3f41e284da377e73d59cbd6e330a736fec0e0fd05`，19个文件，原执行HEAD `4df7604621fff2c8ec27281d59cf4a788deae47b`。独立CLI juaner_validator `gpt-6.1-sol/high/read-only/never` 会话 `01a13310-666e-73c1-b2bf-7b3b357dd98a` 正式PASS。它独立跑96单测、23解码输入×4实现、16GET失败场景；原93测试及全部负例保留。旧005PASS只属于005。

| 要求 | 006任务证据标签 | 实际结果 |
|---|---|---|
| P0-01/02 | p0only-before-characterization | 撤回前4PASS，等价特征不伪造去重RED |
| RB-01 | p0only-rollback-red / p0only-browser | RED因仍存query5.104.2；后续撤回GREEN |
| P0-02 / RB-02 | p0only-green-unit | 96PASS |
| 上传/HTTP权限与跨站 | p0only-http | 17PASS |
| 原UI/启动 | p0only-browser / browser-submit | 34PASS/1SKIP；明确已有Chrome补跑此前SKIP用例1PASS，合成runtime，无Provider |
| tuple/installer | p0only-tuples-green / installer | tuple4PASS；installer14PASS/3NOT_RUN（本机无cloud归档输入） |
| 类型/ESM/认证模块 | p0only-typecheck / quality-green | tsc noEmit、3原生ESM语法与真实认证资产200/未认证401/query404 PASS |
| 请求数/真实重开 | p0only-matched / reopen | 原生Chrome同输入/序列对照及双模式/草稿/显式焦点PASS |

对照同合成输入、GET延迟15ms、interval1500ms、窗口1750ms：首次API4→4/静态8→9，选择A3→3、三个A运行窗口3→3、切换B3→3、接收停止3→3、停止/离开0→0。12个完整轮次各3GET（列表、选中协作、选中请求），不额外读权限/项目/状态。running-B窗口4对6，baseline drain2，两侧完整均两轮×3；禁止把截断或单组波动当提速。HEAD选择/切换直到静默173/182ms，P0-only184/191ms；没有速度比例结论。005原3→8诊断保留。

历史故障不改：精确替换脚本前置断言失败、未认证资产探针期待200实际401、scripts-off安装缺Electron导致tuple一次FAIL，均为诊断/环境失败而非产品RED；随后检查通过。新helper只是叶函数，不删除其余手写业务同步。P1测试退役随明确撤回，完整源/历史证据保留，原负例不削减。

006独立审查建议：旧冻结过滤遗漏候选trace与两张截图的索引，但Validator独立保存哈希并与固定摘要/基线截图一致；补充索引只在设备证据中，未改旧候选或冻结脚本。

## 本轮正式发布

用户新授权仅本P0 PR/合并/安全main同步。fetch目标仍4df7604；所有9个源码/执行测试路径字节匹配006，只修改这5个当前发布规格/追踪文件；5个历史P1文档留本机不提交，因此完整PR14路径。产品branch HEAD `308ddf70e8a7c37b654d888900d6acdb5e6b955f` 的相关提交文件与目标一致，其WIP没有本次路径重叠。

当前证据根标签 `browser-readonly-sync-pilot`，Mini任务独占；本轮 `publication-007`、`candidate-007` 与CLI独立复核保存完整命令/退出/计时/冻结hash、scope、实际运行元组及正式结论。绝对locator及Git身份由本地交付记录提供；此Git文档没有机器路径或原始日志。

本轮先再执行目标基线下受影响测试、HTTP安全、既有Chrome/启动与类型检查，复核package/lock/installer、无P1/原同步身份；只在同一身份/输入/环境下复用006等价和正常浏览器计数证据。发布追踪变化使完整候选更新，独立新上下文检查当前批准PUB/ISO及必要P0边界，不以作者自审代替。

三项cloud归档检查：本机继续NOT_RUN，不借此下载/调用额外云资源。它们验证既有云安装transport/member/integrity，与本次未改的manifest/lock/installer有关但不构成P0叶函数等价的本地缺口。仓库既有canonical CI提供归档，若其适用必需则必须实际通过；required CI等待/失败不得merge或报发布完成。

固定后实际checks/PASS、准确commit/PR/merge SHA、每个main同步结果及产品保护回读由publication-007的不可覆盖发布receipt保存。新证据不覆盖旧失败/PASS。CI、full portable、native/package/Release、Provider/业务资料、产品采用各为独立主张；本地不重新跑无关native或整套portable，PR所选canonical范围以实际workflow/log为准。合并完成且安全同步逐项返回后停止，不自动接入产品、改流程/CI或清理分支。

本轮新执行（均目标4df7604）：`pub007-affected` 148PASS/0FAIL/0SKIP，包含已有Chrome真实首提交/读资料中停止；`pub007-inputs` 20PASS/3NOT_RUN；`pub007-typecheck` exit0；`pub007-quality` exit0，五个还原文件逐字HEAD、query源码/构建/bundle/installed package均不存在，helper认证加载200/未认证401及撤回route404。无需重新安装、构建query或改同步机制。新候选固定后的独立结论只补本轮发布差异和证据适用性，旧候选不变。

## 首次CI与最小兼容修正（008）

PR78原head `781169405b14ab2a7e42f584755163099fb828d6` 的canonical run `38339837177` FAIL：CI-CHECK-001固定Desktop文件清单拒绝新增read-json单测文件，P0行为用例未失败。007候选/PASS及完整失败log保持不变。最小修正将相同3个P0读取用例逐字移入既有open-analysis-client单测，原93用例逐字保留，删除独立文件；仅新增其必需import，不修改清单、runner、workflow或断言。生产实现与006/007一致，原同步机制仍不改。

该首次CI的三项cloud归档检查实际PASS，已保存完整输出；本地三项仍NOT_RUN，不混淆证据级别。修正后的准确head必须再次完成适用canonical CI，旧CI归档PASS不能代替新head。

publication-008另存受影响测试/固定清单、候选008完整manifest、独立只读复核与后续准确Git/CI/合并/安全同步回读。已有HTTP/权限/CSRF/浏览器/类型及边界证据只按未变实现、输入和环境复用。测试资产变更仅位置变化，搬移body摘要与原93用例摘要保存，负例无删除。

008补充检查：`pub008-unit` 96PASS/0FAIL/0SKIP；`pub008-affected` 14PASS/0FAIL/0SKIP（3个P0及既有CI-CHECK-001合同/清单负例）；`git diff --check` PASS。类型/生产实现/原浏览器行为输入未变，复用007适用结果；准确新head CI尚待运行，不能提前宣称通过。
