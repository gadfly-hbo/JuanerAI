# 插件接入沉淀正式Git交付005

本记录冻结时为已授权交付候选，尚未合并；最终状态以真实Git结果及本节所指回执为准。[三资产单一维护入口](../../../docs/engineering/plugin-integration/README.md)继续引用现行政策与各任务合同，不另建平台或全局规则。实际PR/head、full CI、squash和两端安全同步须以真实结果为准，不能从本计划推定完成。

## 授权、身份与保全

用户在同一任务/session/分支/工作树授权最小状态调整、核对最新main、必要验证、提交推送、PR、full CI、审查后squash及安全同步，满足后无需再问常规合并。托管CI可按原workflow及lock恢复依赖构建测试；不准Mini本机安装升级或改CI/白名单/断言绕过失败。插件/SDK升级、重新封装安装、Provider、业务数据凭据、用户服务、生产切换、其他产品或session消息均不在范围。

004 SHA 71222e8fc0e5d854bb9569a345b19962085307a8f094e9d4fea55a79f914dd67 完全符合实际3290文件及原21路径，无额外漂移。原001～004、独立报告、包及所有FAIL/BLOCKED/UNKNOWN原样保留。先显式暂存21项提交保全，再正常merge最新main，无冲突、不改写历史。
原CLI独立报告的原字节末尾空行触发首次staged diff --check，按用户要求保留原文；精确SHA及失败完整输出留证，其他路径正常检查。没有CI、规则或断言修改，也没有将该失败回写为通过。

证据设备Mini，沿用唯一根 /Users/bendandebaba/JuanerAI-artifacts/plugin-integration-consolidation/2026-10-17/execution-mini-v0.3/ ，本阶段在 git-delivery-005/ 。实际结果存publication-receipt-005.json并独立读回。原始运行证据仍是本机文件，不冒称跨机可用；三资产在Git交付后可从仓库入口使用。

## 最新基线、范围与兼容

重新fetch和ls-remote确认main为abeb6e97e45fb499f2ca8e358e0481d0c29423d9，相对3deeaae7为PR92的51项Change007规划/示例冻结及导航增量，没有更改本任务执行权威或Report Studio业务接点。正常整合，不启动Change007；上游内容不计作本任务新增diff。

PR差异按最新main比较：原21项，仅新增本交付记录及必要本树状态事件。原报告及两份历史能力快照字节保持。相对004只调整三资产标题/入口状态和发布身份说明、当前Change返回点、能力投影与本树看板。没有业务、测试、依赖、锁、SDK、CI、Schema、AGENTS或其他任务修改。
同一业务实现独立运行发布、原仓维护、固定物料与随宿主交付/受控升级语义保持；两项修复的原仓回流及未来目标包含性仍UNKNOWN，由原仓开发任务负责，本次不回流、不升级、不新增启动前置。

## 验证与独立核查

新候选身份、相对004和最新main的差异在本阶段candidate-publication-005.json。003正式PASS只复用未变内容/接点；004仅记录性绑定，不冒充新复验。
本任务此前已明确许可的Sol/high/read-only/never CLI限定范围包括必要受影响核对；本次仅复核同一资产的状态/最新基线兼容/完整PR差异。原生旧BLOCKED保留，不沿用原Report Studio031许可。新报告、实际配置及有效性条件在本阶段证据根；不读取或联系其他既有session。

核对链接、状态一致性、完整差异、历史保全与适用合成路径；仅用已有Node26，无本机安装。full CI由实际PR head和现有trusted-base选择器执行，不用R0、92项或旧PASS替代。检查真实ruleset及精确head；范围内文档/元数据纠正后补验，超出则停并报告。
首次95PASS/3环境FAIL、后续92PASS、最小15PASS和原独立11组保持原作用域。三项Profile缺依赖未在本机新树通过，不回写、不豁免新CI。业务覆盖增量0，C5-09仍局部，S1/S4不关闭。

## 合并、同步与停止

独立适用证据、完整精确diff、head full CI和规则满足后squash合并，再读取真实merge SHA。sync-main先check再执行；未检出main时仅快进引用，活跃/被占用/脏或未知检出树不强制更新，不切其他分支、不解除占用、不删树、不改运行版本。安全侧继续，其余如实报告部分同步及返回点。

最终分别报告“资产合入”“源码main同步”“安装/运行采用”；本轮不发生第三项。完成Git交付及安全同步读回后停止，不启动后续工程。
