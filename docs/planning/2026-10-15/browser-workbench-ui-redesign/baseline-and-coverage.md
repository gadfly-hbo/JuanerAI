# 基线、采用与能力保留

本表的“保留”是新方案不得回退的要求，不等于本原型实现该能力。写作基线 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`；试用磁盘基线 `187c356625260d84ca58bc1f5741e081e89662cd`。两者之间仅治理文件变化。运行截图仅查看了无业务任务的试用首屏；其余当前能力来自代码及固定提交文档，不声称本次逐项实跑或 Mini 现场验收。

## 1. 不可丢失的入口与含义

| 现有能力／证据入口 | 改造后位置 | 必须保留／区分 |
|---|---|---|
| `apps/browser/quick-analysis-workbench.mjs`：需求／框架、revisionPreview；005v1.2 | 首页三入口、对话方案卡、专业新建分析 | 保存、预演、修改diff、确认、开始不同；旧版只读 |
| 同文件 `professionalStages`／`professionalBody` | 专业六阶段实际内容页 | 新建分析／数据准备／本地处理／循证分析／报告／执行反馈；不是装饰进度 |
| 同文件资料预览；client `openTaskView` | 数据准备、检查器口径与资产→资料 | 前10行／全量区别，格式限制与错误；稳定身份缺失不可伪造引用 |
| `frame`／`detail(execution)`、005v1.3 | 本地处理、检查器过程 | Context/Binding→IR、适用计算／Python核验、partial／unsupported与限制 |
| `findings`／`evidence`／`professionalEvidence` | 对话发现卡、依据目录 | 逐数字来源、假设与事实区别；算法核验不是因果证明 |
| client 模式、阶段、展开／draft／selected状态 | 单任务三视图及专业导航 | 切换不创建任务／重跑，不丢草稿／引用／阅读位置 |
| 报告 `report`、`reportCopy`；`OpenReportEditCommand` | 单一当前主稿＋历史，受控导出 | 原事实／模型解释／用户表达可追溯；兼容旧追加文本，不补造新确认 |
| `OpenAnalysisJudgmentCommand`、application `judgmentTarget` | 报告认可历史／分析判断区 | 旧“认可分析”只绑定旧结果，不代表新内容确认 |
| `formalReviewDialog`、`nativeReviewSummary` | 执行反馈、报告→正式评审链接 | 仅原适用方案；analysis/more_evidence/choice、no_action/defer/candidate、Owner等原字段保留 |
| Skill／Prompt按钮与既有方法 | 输入器更多能力、本地处理 | 已支持方法及Prompt选择不消失，不扩大能力清单 |
| Fork／Subagent／嵌套协作，005v1.3 | 同任务更多能力、协作树／独立对话、过程 | 血缘／范围／独立授权／停止；返回、父使用、核验、正式采纳分别记录 |
| 方案复用／旧版本比较 | 项目最近任务→复用方案；版本历史 | 创建独立任务，不复制旧结果／授权，不自动采用 |
| 项目口径导入／注册／任务采用，006 | 项目菜单→口径维护；检查器口径与资产 | 候选／批准／未来默认／本任务采用分离；版本不兼容／零分母／不适用保留 |
| R1–R4 准备正文、受控执行、账本、UNKNOWN／迟到 | 对话方案卡、过程、恢复面板 | 原opt-in／MODEL-only／资源／主备／安全范围不扩大；旧失败证据保留 |
| 停止、续跑、只读／控制权、读取保存状态 | 状态条和异常面板 | 请求接受≠已停；读回不自动恢复／抢占；累计资源不重置 |
| 侧栏／右栏调整、搜索／项目、设置／预留账号与插件 | 单侧栏、可访问项目菜单、底部低优先入口 | 布局设置可用；未接入产品能力明确标注，不造新账号／插件平台 |

代码定位为写作调查线索，不冻结后续私有模块或接口。实际入口读取自本基线：`apps/browser/quick-analysis-client.mjs`、`apps/browser/quick-analysis-workbench.mjs`、`apps/browser/quick-analysis-workbench.css`、`packages/application/open-analysis-workspace.ts`、`packages/ports/open-analysis-store.ts`、`adapters/storage-local/open-analysis.ts`。

## 2. 已批准 UI／研究引用及采用范围

- [005 UI恢复 v1.1](../../2026-10-05/change005-ui-contract-recovery/ui-contract-v1.1.md)：保留品牌、专业性、数据与报告入口；本次整体布局由用户新方向提出，等待替换相应视觉批准。
- [005 Five Moments](../../2026-10-06/change005-five-moments/ui-addendum-v1.1.md)：保留任务连续性、来源／发现、报告与决定不同。
- [005 需求沙盘 v1.2](../../2026-10-08/change005-v1.2-requirement-sandbox/ui-contract-v1.2.md)：采用三入口、需求草稿、答案预演、保存／确认／开始和变化对照。
- [005 自主分析 v1.3](../../2026-10-09/change005-v1.3-autonomous-analysis/ui-contract-v1.3.md)：保留已批准自主探索／协作和方法核验；不倒退到旧版本逐次人工确认。
- [006 指标口径资产](../../2026-10-12/change006-metric-assets/ui-contract-v0.1.md)：保留任务采用／未来默认、版本与受限适用性。
- [007 结论与策略](../../2026-10-13/change007-conclusion-strategy-review/ui-contract-v0.1.md)：已冻结的独立产品输入，不当成已实现。预留既有“循证分析／报告／执行反馈”的自然呈现位置，不静默改写其有支持／有条件支持／证据不足／存在冲突语义。
- [研究索引](../../../research/README.md)：保留项目AGENTS要求的已接受PX-2026-004/006工作台模式；本包的报告单稿等新增交互以用户附件及已自含的本候选合同为来源，不从未读研究原件外推。索引中PX-032为语义物化、PX-041为本地文件质量快照、PX-056为流失评分／校准，不能误称Report Studio／假设判断／Loop。本包不将其作为新增UI依据，也不要求外部研究仓库补业务决定；不采用完整版排版／协作编辑／因果引擎／行动自动化。原Demo无执行权限。
- 用户 v0.1 压缩包：本地冻结副本与散列见 [来源记录](reference/source-record.md)。附件自报PASS不继承。

## 3. 六＋二覆盖关系（计划贡献，不改累计登记）

| 家族 | 本包关系 | 继续保留的未覆盖目标 |
|---|---|---|
| C1 业务双主线 | C1-01 PIM、C1-03任务过程的体验与状态可见性 | 完整OSM、行动／Actual闭环 |
| C2 分析模式 | 现有分析／自主探索的可见面保留 | 全量Deep Research／新增分析引擎 |
| C3 产品矩阵 | C3-01 Personal浏览器主范围 | Desktop壳、Team／Enterprise／持续商业留存 |
| C4 方法扩展 | 既有专业方法／口径／核验入口保留 | 新算法、完整Domain／Model Pack |
| C5 决策与价值 | C5-08同任务助手、C5-03/04协作保留，C5-09单稿编审必要子集 | 完整Report Studio／真实行动／效果 |
| C6 资产与进化 | C6-01旧任务与资产／历史保留 | 通用学习、长期效果、自动资产晋升 |
| A 数据语义执行 | A-01/02资料与语义、A-03 IR、A-04受控执行、A-05来源 | 无新连接器／格式／模型数据权限 |
| B 治理与责任 | B-01依据、B-02权限、B-03人类确认与决定 | 无企业治理／现实行动授权 |

权威累计状态仍在 [register](../../capability-coverage/register.md)／[六＋二全图](../../capability-coverage/latest.md)。本次不写工程覆盖登记，不提升40ID完成率、不称S1收口。计划贡献与已有接受分开。

## 4. 已知交付／接受与未核验

基线当前登记记录005v1.3用户产品/UI接受；006附具名限制接受；R1–R4离线合成／显式opt-in交付范围接受，原Validator角色BLOCKED与具名风险历史保留；SDK0.5.1受控采用经PR84进入main且限定工程接收，不增加新用户接受。真实Provider／生产与完整产品目标仍不能由此推定。

本包未重跑这些工程验收，未核验Mini现场、Mini产品服务、当前候选与本次UI范围是否存在在研重叠；本次无权抢占同一修复范围。后续工程接收前由用户／既有交接明确作者与分支；Mini继续无关工作。旧规则发布、实际产品baseline、实际服务版本、用户验收、Mini采用五者分开。
