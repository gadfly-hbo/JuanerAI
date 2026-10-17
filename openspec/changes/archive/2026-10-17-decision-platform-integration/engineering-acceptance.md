# 012 工程接受：具名风险处置后限定接受

2026-10-17，Asia/Shanghai；同一Mini工程主Agent、原工作树/分支/HEAD。依据当前执行政策的 Engineering Acceptance → required Product Acceptance → authorized delivery/integration/archive 顺序及 Definition of Done 的具名风险条款。

**Engineering Acceptance：ACCEPTED_WITH_NAMED_WAIVERS，仅限固定012的浏览器宿主集成与隔离合成范围。** 原独立报告结论仍为 BLOCKED，不改称角色合规PASS。后续用户已明确012产品验收通过，见[产品接受](product-acceptance.md)与[本地收口](local-closeout.md)；正式Change完成、Git交付、发布和归档未成立。下方验收准备返回点保留其原时点，不再是当前待办。

## 固定对象和验证

- 工作树 `/Users/bendandebaba/.codex/worktrees/12b3/JuanerAI`；分支 `work/mac-mini/decision-platform-integration`；基线HEAD `a0b6491ddc4700fef881317f44f2c51c699d8f9c`，本Change未提交WIP由完整012快照固定。
- 源码manifest `28ce87cbae9f8aa47db8ff85025b9a375d752aac21b4fa9cc6b22302750e387a`，3522项；证据manifest `58eaa98eecc2571690987e57e3146fac11acd779ccbfd6e026f5f0055b92c7b1`，405项。原件位于既有证据根 `host-candidate-012/`。
- 固定上游 `c11f8da8d8db3b2d5ae2424941a24307471ad972`；插件SDK0.4.1、宿主SDK0.5.1；17127项资源摘要 `0c2ee1e9beca44af100b1b0aab44e87919937e736f0edcf374b186e6d5f86f64`。原仓修正归属不变，没有SDK升级或业务副本分叉。
- 已批准006r1/UI Gate、现行行为规格与权限/来源/运行设计复用。SDK逐次授权、获准业务写入/原回执核对、看板/汇报完整合成闭环均有证据，见verification.md当前结果。
- 032 canonical portable实际退出0：4903项，4882PASS/0FAIL/21原条件SKIP，含实际Chrome、根类型、39项DP和UI构建；独立复核汇总一致。原断言及测试覆盖保留。
- 完整012独立复核关闭来源展示缺陷及固定故障补取证缺口，未发现新增实现阻断。固定源码/证据/资源首尾读回无差异。完整回报位于既有证据根 `validator-host-012/review.md`。

## 两项具名风险，不改写历史

1. R-012-HISTORICAL-RED：用户明确“接受012历史RED具名豁免”。最初source/Profile/HTTP/UI缺少实现前RED的事实保留；本轮各修正的真实RED不替代旧历史，也不覆盖未来新行为。
2. F-ROLE-012：用户明确接受“012本次只读沙箱具名例外”，并要求保留原BLOCKED和权限事实。实际环境danger-full-access、approval never、无强制只读保护；行为只读及首尾哈希一致仍不叫角色合规PASS。原生角色定义固定Sol/high，额外独立运行时读回不可用的事实保留。

完整用户回执位于既有证据根 `validator-host-012/user-decisions-012.json`。这是本固定候选的风险处置，不授予新权限、不自动扩为未来候选或发布许可。

## 接受边界与返回点

本地浏览器加同机服务、固定SDK、合成模型与隔离数据范围内接受。真实Provider/业务数据、正式安装发行、干净机/其他架构、Desktop-shell、远端CI/PR/Git交付及生产切换仍未执行或未授权；私有插件发行许可UNKNOWN保留。010/011、历史FAIL/BLOCKED/UNKNOWN、原反馈及空库证据不改。

下一步由同一主Agent准备固定012的Mini真实宿主合成产品验收入口，给用户明确操作步骤；用户实际Product Acceptance另行记录。此前不宣称完整Change完成、不更新能力为正式交付、不做归档或Git发布。代码与正式记录仍为本地WIP，尚未通过Git持久集成；设备本地证据不是MacBook备份。
