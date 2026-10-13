# Change007 · 固定事实与来源读回

2026-10-13，MacBook产品规划，只读调查；没有新模型调用、真实数据读取或现场业务验收。

## 1. 设备、工作与发布身份

- 仓库 `/Users/huangbo/.codex/worktrees/e1d5/JuanerAI`。起点 `work/macbook/change006-metric-assets` / HEAD `8d14eb28514977de168c94e99d1d8613e175aeb4`，工作树干净。
- 用户指定提交已在本地Git对象中；`main`／`origin/main`读回为 `8dfc50528d342028ae1fcc3d0911ebca4a213e95`。这不证明Mini当前没有未发布工作。
- 安全创建独立 `work/macbook/change007-conclusion-strategy-review`，HEAD为上述固定提交，tree `d622004e2f80c3b5127c169cc346a05e16c8d7c2`。未强制同步、改写／删除006分支或变动Mini工作树。
- GitHub原生 `gh pr view 80`：MERGED，mergeCommit与固定提交一致，head `8b19bd1077d4d02e7c18b3e97741d930efccaae2`，mergedAt `2026-10-13T13:08:15Z`。[PR80](https://github.com/gadfly-hbo/JuanerAI/pull/80)。未据此推断任何新任务已获授权。
- 本轮只新增本目录规划材料，不改业务、accepted specs、覆盖清单、工程状态或历史。附件旧起点 `f6e5395…` 被用户当前固定006交付基线取代。

## 2. 006交付与限制（固定归档读回，不重跑验收）

[ARCHIVE](../../../../openspec/changes/archive/2026-10-13-xanthil-project-metric-assets/ARCHIVE.md)、[工程接受](../../../../openspec/changes/archive/2026-10-13-xanthil-project-metric-assets/engineering-acceptance.md)、[正式评价](../../../../openspec/changes/archive/2026-10-13-xanthil-project-metric-assets/formal-evaluation.md)、[用户处置](../../../../openspec/changes/archive/2026-10-13-xanthil-project-metric-assets/user-experience-decisions.md)、[发布记录](../../../../openspec/changes/archive/2026-10-13-xanthil-project-metric-assets/publication.md)。

- 精确净销售SAP闭包、六指标、Context/Binding→有限IR实际消费、DuckDB主算／Python独立核验、当前新资料重新绑定、第二任务复用和明确换版已接受子范围可用。
- 第一任务净额150元（两期70／80），第二任务160元（80／80）；是两个任务，不自行改造成真实单次160→150比较。第一数字报告complete，第二partial；拒绝的 `REPORT_UNBOUND_NUMBER` 留存。
- 数字资格、语义／因果与模型解释是不同维度；当前没有独立语义／因果认证。模型自己称“未对账”也不是工程核验结论。
- 原记录101请求／97成功／4取消UNKNOWN，历史FAIL、角色BLOCKED与用户具名例外保留；本轮没有增加调用。007不得继承006角色或风险豁免。
- 006报告墙钟含首次失败与修复；用户劳动、理解等未实测UNKNOWN。后续成功样例不能倒改首次失败或给007体验达标背书。
- Desktop E2 OPEN/BLOCKED、Supplier条件NOT_RUN及S1／完整Domain Pack缺口仍开放。
- 原始工程证据仍在Mini `/Users/bendandebaba/JuanerAI-artifacts/change006/controller`。本轮只读Git内归档和定位，不声称检查了所有Mini原始日志或取得跨设备备份。

## 3. 实际报告链的核对范围

| 当前源码 | 已核对行为与007缺口 |
| --- | --- |
| `packages/product-core/open-analysis-report-review.ts` | 完整读取。事实片段、口径／采用身份、报告整理、协作意见MODEL／not_performed；模型解释明确未独立语义或因果核验 |
| `packages/application/open-analysis.ts` 报告段（约410～433行） | 定向读取。组装实际证据与报告身份；`purpose:'report_edit'`、`tools:[]`；数字编译／保存。已核对该报告链没有主张／策略独立判定→修订→重审的消费者闭环；不以定向检查声称整库不存在其他功能 |
| `packages/product-core/open-analysis-numeric-report.ts`（约305～385行等相关段） | 数字／来源／范围检查与partial，保持有效事实；不是语义／因果独立证明 |
| `open-analysis-delegation-instruction.ts` | 完整读取。精确资料引用与单调子集、反证等调查动作、避免同工作递归；不认证业务真值 |
| `open-member-review.ts`、`case-assistant.ts` | 完整读取。人的显式整体提交，analysis／more_evidence／choice，正式决定及Expected验证／历史标签；字段与引用合法不证明策略合理 |
| `profiles/personal/open-analysis.ts`、Pi Adapter／runtime Port、报告集成测试 | 定向核对装配／用途／工具和现有断言；未执行产品测试、模型、服务或新增RED |

SDK基线依赖0.4.3，vendor精确包 `475480217d5f644a15264b2f838e5567d3e2c2e431b8a23c061a0665dbdbfa70.tgz`。本轮不升级／安装。Codebase Memory先查询的Oct02索引未命中报告入口，是旧索引限制，不作不存在证据；以当前固定源码补核。

用户审查后定向补核005的复用任务：固定基线中的[发布接受](../../../../openspec/changes/xanthil-browser-multisource-membership-analysis/release-v13.md)保留原001～004兼容、开放资料／IR／核验链及模型解释非认证；[verification-v13](../../../../openspec/changes/xanthil-browser-multisource-membership-analysis/verification-v13.md)real041段（约413行）记载实际订单合计1100元、退款合计50元独立核验及报告保存，明确0子任务、不能关闭AS04，模型“不能相互冲抵”仍非新业务事实。本期选该已支持的分别汇总消费者作为T007-B复用验证，**没有读Mini原始资料、重跑旧任务，或将旧解释当认证**。T007-A按006总体／品类，不使用地域分组暗示新能力。

## 4. 共享标准、研究与UI

完整读取共享 `pi-agent-runtime/docs/AGENT-RUNTIME.md`（文档v0.3，与SDK版本分开）。保留任务级预授权、按用途校验、原生多轮／工具／会话复用、权威持久账本和安全审计、取消／UNKNOWN／显式恢复。当前项目已批准累计不封顶及一次额外物理请求；标准历史“尚未采用／候选”标签不覆盖JuanerAI当前0.4.3消费者事实。元数据／hash不是完整可读证据，模型返回成功不是业务接受。

现有005 v1.3／006产品、批准、UI与可点击壳层优先，PX-004专业六阶段／PX-006快速双模式分工不改；完整读取公共UI基线 `/Users/huangbo/.agents/ui-design/DESIGN.md`，不覆盖项目合同。本轮采用SaaS skill补新状态、密度、键盘访问，不引入新配色／导航。

定向研究：PX-043六级判别链的冻结要求／README相关段；PX-034策略行动结果复盘冻结要求／判定相关段。只参考分责、反证／条件和不偷推成功；未执行研究脚本、服务或模拟行动，未把其完整历史执行记录宣称本轮验收。

本机讨论稿 `JuanerAI_分析能力与产品方向简报_20261013.md`完整读取，只有本轮任务书采用方向进入产品；TOC／FMEA／新方法不自动采用。研究文件不是Receiver必读依赖，必要观点已进入自包含产品方案。

关键文件字节／SHA见[source-readback.json](source-readback.json)。指纹证明所核材料身份，不证明计算、采用、模型质量或UI接受。产品候选和审核原型不是工程已完成证据。
