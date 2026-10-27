# Blueprint v4.3草案 · 原目标映射与事实依据

2026-10-25 初稿／2026-10-27 补充 · [主草案draft.2](juanerai-product-development-blueprint-v4.3-draft.md)的静态附件；非新增进度系统，不替代既有累计能力图或工程状态。v4.2仍生效，本附件不启动任何Change。

## 1. 来源身份与事实分层

| 来源 | 本轮采用范围与证据边界 |
| --- | --- |
| 已发布仓库 | GitHub `gadfly-hbo/JuanerAI`；本草案绑定的main为`ad41474d5e01cb9743a16b0af5914b2c40f94f0a`，tree`9055d8c455863e28c8922905f3e2b4112571d057`；与本地main／origin/main及文档分支起点一致，不构成远端持续最新证明 |
| 生效蓝图 | [v4.2正文](../2026-10-04/juanerai-product-development-blueprint-v4.2.md)及[批准记录](../2026-10-04/blueprint-v4.2-approval-and-rule-integration.md)；正文旧草案标签是历史，批准记录确定生效。40ID、20索引、S1～S6和原能力完成条件不变 |
| 核心参考 | 已采用[白皮书v4.0原文](../../product/whitepaper/revisions/v4.0/JUANERAI_WHITEPAPER.md)；不重新全量采纳技术候选，不因本草案新增愿景或商业承诺 |
| 后补已确认路线 | [原总拆解§10.3～10.10](../2026-10-03/juanerai-blueprint-v4.1-full-change-roadmap-v0.1.md#10-2026-10-17-统一建设路线用户已确认)：默认主线、业务记忆、库存候选、最小探索前移条件；原文件名保留v4.1不代表当前蓝图倒退 |
| 工程与产品累计事实 | [能力register](../capability-coverage/register.md)、[完整图](../capability-coverage/latest.md)及下列具名交付；分清已接受子范围、代码／接入存在、离线工程结果、真实模型及用户接受 |
| 现行职责与执行边界 | [AGENTS](../../../AGENTS.md)、[Orchestration](../../../Orchestration.md)、[唯一执行政策](../../governance/product-change-execution-policy.md)、[Git工作流](../../governance/git-development-workflow.md)；PR114已将Change准备交给同一Mini主Agent，本稿不恢复旧必经交接 |
| 现有架构 | [Ports／Adapters](../../architecture/ports-and-adapters.md)、[资产角色](../../architecture/asset-and-model-capability-architecture.md)、[数据权威](../../architecture/data-authority.md)、[安全边界](../../architecture/security-boundaries.md)、[插件接入标准](../../engineering/plugin-integration/standard.md)；H分组不是新部署层／服务／通用schema |

状态说明：以下“已有”只陈述对应来源已证明的有限结果；“在研”为原任务当时的进度，不是独立接受；“仅规划”不代表没有任何旧代码；“待核验”也不等于不存在。任何表格均不构成持续在线证明。

## 2. 已有成果及在研现场

### 2.1 宿主基础：保留成果，不恢复退役入口

| 事实 | 版本／入口及限制 |
| --- | --- |
| 宿主确有存储、计算、决策和报告，不是只有前端 | [desktop-state](../../../adapters/storage-local/desktop-state.ts)保存项目／会话、Case修订、资料与分析结果；[历史计算Adapter](../../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts)和[Application](../../../packages/application/xanthil-desktop-decision-case.ts)有DuckDB／Python真实消费；[正式Case Assistant规格](../../../openspec/specs/case-assistant/spec.md)及[会员任务规格](../../../openspec/specs/member-analysis-task/spec.md)保留正式Decision／Expected、人审与报告关系。源码存在不是全量当前运行验证 |
| 004／005的真实受限计划与开放分析成果 | [004工程接受](../../../openspec/changes/archive/2026-10-02-xanthil-ai-led-member-analysis/engineering-acceptance.md)、[005 v1.3发布接受](../../../openspec/changes/xanthil-browser-multisource-membership-analysis/release-v13.md)；保留原场景、数据／方法、模型质量及体验限制，不用旧“IR只有日志”抹去后补证据 |
| 006专业资产运行侧复用 | [现行project-metric-assets规格](../../../openspec/specs/project-metric-assets/spec.md)、[006归档记录](../../../openspec/changes/archive/2026-10-13-xanthil-project-metric-assets/ARCHIVE.md)：精确版本、六指标／13周／已支持分组、独立复算、第二任务重绑定和明确换版；二次报告partial、劳动未测、Supplier等原限制不由本稿关闭 |
| 精简／repair001／正常入口参数已有主线工程增量 | [整体精简](../../../openspec/changes/archive/2026-10-19-agent-host-simplification-20261019/verification.md)、[repair001](../../../openspec/changes/archive/2026-10-19-agent-host-exploration-resume-repair-20261019/engineering-delivery.md)、[正常入口参数](../../../openspec/changes/archive/2026-10-20-agent-host-normal-entry-parameters-20261020/engineering-delivery.md)；均按各自固定旧基线、离线范围理解，不代签后续新架构、F-B01／realQ／A-B／QS04或用户／阶段接受 |

这些源码和接受记录是复用与历史依据，不是恢复旧执行器的指令。当前已获准新架构的删除范围、固定SDK、统一配置和合法会话优先；不得为保持旧文档名字而恢复退役settings/UI、旧运行／恢复入口或有限计算兼容链。反过来，新Pi产报路径也不自动证明原A-02／A-03长期目标已经全部完成；后续按实际支持消费者补证，不能把JSON或自然语言计划当执行消费。

### 2.2 四个插件的具名交付

| 插件／已集成身份 | 正式来源 | 可复用部分与保留缺口 |
| --- | --- | --- |
| metric-factory，PR108／`363c756` | [当前规格](../../../openspec/specs/metric-factory/spec.md)、[交付与接受](../../../openspec/changes/archive/2026-10-19-metric-factory-integration/git-delivery.md)、[供应业务限制](../2026-10-19/metric-factory-integration/supplier-business-baseline.md) | host014／supplier017／bundle018本机浏览器固定包已接受，原生007与集成008复核有证据；经营稿人工修正不等于自动质量认证。SAP消费另案；D-MF-01、UNKNOWN／预留、实际.app／安装／干净机未测保留 |
| reports-factory／Report Studio，PR91／`3deeaae` | [当前报告规格](../../../openspec/specs/report-studio/spec.md)、[用户接受及未测边界](../../../openspec/changes/archive/2026-10-16-report-studio-minimal-integration/product-acceptance.md) | 固定源`74ebb609fd73cf263614ffc9301dafaafcec4230`／`0.1.0-juanerai.1`；实际制作／修改／导出和条件式Mini接受有证据。干净机风险接受、MacBook本轮免测不算新包实测；全部原失败、格式限制、UNKNOWN及未证明的物理停止保留 |
| deep-research，PR104／`0705e86` | [当前规格](../../../openspec/specs/deep-research/spec.md)、[归档与接受范围](../../../openspec/changes/archive/2026-10-18-deep-research-integration/README.md) | 固定源`3a3f8c3a910460423a8b7a2638655a100a2aa8e6`，005限定离线工程和合成产品接受；真实来源／Provider／研究质量、安装、相关许可及严格MCP收尾未充分验证；首期记忆／追问关闭，外部效果默认拒绝 |
| decision-platform，PR100／`f803ddc` | [当前规格](../../../openspec/specs/decision-platform/spec.md)、[固定012用户接受](../../../openspec/changes/archive/2026-10-17-decision-platform-integration/product-acceptance.md) | 固定源`c11f8da`；隔离合成浏览器子范围接受，工程附具名豁免，原BLOCKED保留。看板／任务／反馈不自动成为宿主正式Decision／Actual，插件teach不等于共享资产改进；真实业务／Provider、安装及许可缺口保持 |

实际[service-main装配](../../../apps/browser/service-main.ts)中，Metric Factory／Report Studio读取部署资源，研究需要固定资源配置，decision-platform需显式装配。这证明有真实接点，不证明任意设备或新SDK组合均已默认可用。后续只对届时受影响接点核验，不重验无关已过项。

### 2.3 2026-10-25原Mini任务只读快照

本轮通过应用的只读任务接口读取“Pi-宿主精简工程”：thread `01a151e9-fc5a-7f60-bd4c-23b99a0a4ada`，host为Mac mini；不是发送消息、接管或批准。最新读取turn `01a17234-32d5-7e13-bab2-23589708f992`仍为`inProgress`。

该turn的直接用户指令（message `01a17234-3350-7210-9d21-ba19ec382b82`）明确同意三层一起实施，并限定：

> 保持先产报保存、后核验审查，信息不全只暂停受影响动作，不恢复有限计算规则和旧兼容链。

同一指令要求沿原session／工作树完成受影响离线验证、固定新候选及独立复核；SDK不变，不调用真实Provider，不做Git交付／发布，旧Task、UNKNOWN及累计消耗保留。本草案只记录其已存在授权，不将其延伸给蓝图任务或未来Change。

| 当前可说的事实 | 尚不能推导 |
| --- | --- |
| 工程主Agent自报原工作树、HEAD `50c2f3e`加已归属WIP，固定`0.6.0-newarch.1`；见message `msg_0905af8efc978631016addc153a2bc8191a4f6d1568498cfad` | 不是main已采用新SDK的证明；本轮未独立冻结或逐文件读取Mini WIP |
| 主Agent自报报告保存先于后处理、受限原生进程独立核算及方法审查已接线，仍补反例；见message `msg_0905af8efc978631016addc594913c8191b7b83204a5e576b8` | 不是独立D_PASS，也不是原Change007全部正式场景、真实模型或用户接受通过 |
| 最新读取仍在修正数字比较舍入问题，并自报取消保留UNKNOWN／32768预留、报告可读；见message `msg_0905af8efc978631016addc8aa7ca08191b278acbc0c8971fe` | 旧问题未被本稿重判；自报离线测试不能替代固定候选独立复核或实际可视体验 |

既有[007保证边界产品输入](../2026-10-17/change007-review-guarantee-boundary/product-addendum-v0.1.md)及[用户批准记录](../2026-10-17/change007-review-guarantee-boundary/approval-record.md)继续解释“系统硬检查≠语义绝对保证”。当前先保存后审查是上述原Mini任务后续直接决定；旧产品正文中的“审查后交付”、旧预算与旧停止标签按各自时点、任务和后续有效授权解释，不摘取旧值重新限制当前研发，也不反向改写旧FAIL或自动完成Change007。

### 2.4 2026-10-27能力中心补充依据

本次只补充能力中心的产品安排；§2.3仍是10月25日的原快照，不伪装成10月27日工程完成状态。本轮不为更新草案重新接管或推进Mini任务。

| 来源／观察 | 已证明到哪里；不能推导什么 |
| --- | --- |
| 本机WorkBuddy V5.8.3，只读UI观察（本对话上一轮） | 可见专家／专家团队、技能、连接器、搜索／详情／版本／我的能力等模式；团队详情呈现角色／阶段。只观察界面，不证明实际执行、质量、兼容性或其资产可用于JuanerAI |
| WorkBuddy连接器及MCP管理界面，只读打开后取消 | 可见不同连接方式，MCP只是其中一种；插件所带连接器可在管理面呈现。没有保存连接、安装、调用或读取凭据；不复制私人地址、会话参数、第三方技能正文或运行配置 |
| JuanerAI已有目录：[入口](../../../apps/browser/quick-analysis-workbench.mjs)、[客户端](../../../apps/browser/quick-analysis-client.mjs)的`reportStudioPlugins()`及[固定装配](../../../apps/browser/service-main.ts)，基线`ad41474…` | 已有“产品能力与插件”、状态检查和Report Studio／决策看板／Metric Factory打开路径；另有尚未接入项。是首期复用基座，本次限定检索未发现通用安装／升级／卸载链，不代表所有设备已安装启用或已完成广义市场 |
| 10月27日Mini只读源码抽查：原工作树`work/mac-mini/agent-host-simplification`，HEAD `50c2f3e…`加既有WIP | `adapters/agent-pi/professional-agent.ts`／`harness-resources.ts`有固定Skill／模板消费及原生Subagent接点；`adapters/deep-research/runtime.mjs`／`mcp-entry.py`有特定MCP接入。WIP未冻结，不能仅由HEAD复原；不等于用户可安装专家团队或通用连接管理已完成，不是产品试用证据 |

因此可复用的是既有目录、专业资产采用规则、固定技能／模板消费者、Pi原生机制及特定接点。需要产品增量的是三类供给的统一发现与状态、受支持资源的维护／连接以及任务内采用的连续体验；实际支持类型、连接器、接口及授权在后续Mini产品准备中明确。WorkBuddy仅提供交互参考，不成为JuanerAI的依赖、架构标准或质量证明。

## 3. N01～N20：原索引全部保留

本表是归属和已有路线的映射，不是20个同时获准工程任务。名称、目标和关键依赖继续以[v4.2 §8](../2026-10-04/juanerai-product-development-blueprint-v4.2.md#8-n01n20逐项对照与change组织)及原总拆解为准。新增／删除／改名／重编号／强制拆并均为0；draft.1增加H／插件归属，draft.2新增最后一列，显式说明能力中心对各项的影响。新管理与使用体验不冒称原已完成；N05／N06默认顺序不变，无在研范围变化。

| 索引／原名称 | 宿主主责／专业承载 | 保留依赖与次序 | 能力中心增量／后置边界 |
| --- | --- | --- | --- |
| N01 需求与框架真正驱动分析 | H1／H3，H4支撑 | 复用004／005；框架真实影响Contract／Binding／计划与执行，不支持拒绝；当前成果做稳 | 任务需求驱动匹配；不要求先选专家／Skill再开始 |
| N02 受控真实AI与双模式完整任务 | H1／H2／H3／H7 | 同一核心、真实任务、支持变体及适用协作兼容；当前接线和验收按原任务，不重开005 | 首期完整任务消费资产／工具，快速／专业视图共享实际采用事实 |
| N03 新数据源成为可执行分析输入 | H4；专业来源／准备工具可扩展 | 有真实消费者才扩来源；授权、资格、快照、变化检测；已有子集不重建，不先造连接器大全 | 首期一个有用的只读连接器；连接成功不免除当前资料资格与Binding |
| N04 业务语义与专业配置可复用 | H3／H4／H6；Metric Factory供给 | 版本、Owner、适用性和漂移；不等全N03，不把发布物当运行采用；随消费者补增量 | 首期主承接：资产目录、来源／版本／适用性和实际采用，有限维护，不造全量资产平台 |
| N05 行动记录与合格实际结果 | H5／H4；可复用decision-platform | 正式Decision／Expected前态；人工或外部实际、窗口／资格、未执行／迟到更正；下一默认成果，不是自动行动 | 不增加能力中心前置；插件使用记录不冒充Action／Actual |
| N06 结果评价与复盘报告 | H5／H7 | 依N05；执行／观察／校准／归因／当时判断分开；与N05成完整成果，普通回访不等N14 | 后续效果反馈来源；首期采用回执不冒充业务效果评价 |
| N07 假设／策略资产与受治理Teach改进 | H6；维护插件可参与 | 合格N06评价→Owner审阅→版本；另一类资产完整生命周期保留返回N07子包／N09，不建全量发布平台 | 延续批准／撤回／新版本；导入Skill、收藏或模型建议不能自动升级为可信经验 |
| N08 跨Case找回、显式采用与学习评价 | H6→H1／H3 | 依N07版本及真实分析消费者；权限、适用性、后续可比／留出证据；采用≠有效，旧Case不变 | 后续跨Case与学习评价；安装≠采用≠有效，不要求全部学习先行才可复用合格资产 |
| N09 Domain Pack与可复用假设／描述／诊断 | H3／H6；Metric Factory及领域工具 | 真实分析链＋方法正确性／反例＋Pack消费；库存候选沿主文条件；非全学习闭环前置 | 首期只补必要实际消费；目录有Skill不等于完整Domain Pack，库存仍另按候选条件 |
| N10 Model Pack与预测任务 | H3／H8；ModelEvol／模型工具候选 | 必要数据语义和S1消费者；复用模型模块及contract-enabler；本地质量独立验证，Serving按需N19 | 后续模型资产／工具可呈现；首期不新建模型训练或预测任务 |
| N11 Report Studio可复用交付 | H7基础＋reports-factory增强 | 复用证据／报告／版本；必要交付改进可前移，不等N07／08；回访报告才接N06 | 复用已有插件发现／打开／成果关联；不借目录增量重做高级编审或全部格式 |
| N12 有来源的深度研究 | H1／H3／H4；deep-research | 分析消费者、合格来源及适用网络／模型授权；有引用／限制和停止；已有合成接入不是完整研究验收 | 呈现真实接入状态；目录入口不自动授权联网或补做真实研究验收 |
| N13 有界自主探索与探索方法 | H1／H3／H7；可选探索工具／工作台 | 分析、报告及适用审查链可用后可提有限前移；范围、资源、停止和方法分别验证；不启动本版开发 | 专家／团队配置可供后续复用，不以卡片证明自主性，不启动探索开发 |
| N14 可识别条件下的因果分析 | H3／H4；专业方法工具 | 合格设计／数据及真实分析链；服务回访时接N06，识别不足拒绝归因 | 后续合格方法资产供给；专家名称或Skill声明不证明因果方法成立 |
| N15 约束下的优化与方案比较 | H3／H5；专业优化工具 | 决策消费者和可核验求解；N10／14仅按实际方法依赖；现实执行另获授权 | 后续工具与方法供给；首期不新增求解器、仿真或现实执行 |
| N16 OSM经营目标到复盘 | H1／H5，其他适用宿主责任协同 | 目标／指标／差距权威独立于PIM；完整闭环消费S2，不等全DAME或Enterprise；不预定新插件项目 | 可消费合格资产；目标／策略／行动权威不迁入能力目录 |
| N17 Team协作、复核与资产共用 | H1／H4／H6及贯穿治理 | S1＋真实多人需求；共享学习才依S3；权限、冲突、维护和退出／迁移，不用子Agent冒充Team | 首期个人／项目可用不等于多人共享；Agent团队配置与Team产品能力分开 |
| N18 单场景企业试点 | 场景所需H1～H8及专业插件 | 用户、Owner、价值基线、停止／接管／退出明确；必要企业安全先满足，不等全蓝图 | 将来按试点扩来源和批准范围；不为首期预建企业市场或添加无关门槛 |
| N19 Enterprise多团队／多域与部署扩展 | 对已成立宿主／插件按需求扩展 | 依N18和真实扩展需求；隔离、身份、恢复和价值分别验，不默认云、多租户、SSO全做 | 跨组织分发／云市场／集中策略非首期，不删除将来适用治理目标 |
| N20 有限域现实行动自动化 | H5／H2／H8＋专项工具 | 依N05／06、已验证动作和适用治理；专项授权、幂等、回执、停止／接管及适用撤销补偿；不等完整N19 | 首期连接只读；安装／连通不授予写入、发送、交易等外部效果 |

Change001～006及后续正式任务沿各自身份、交付与权限保留；Change007不是N07。D006是新架构工程候选标识，不是正式Change006；本稿不将这些编号互换、取消、归档或重新启动。

## 4. 40项能力：原目标不缩减

下表保留[v4.2 §4.2](../2026-10-04/juanerai-product-development-blueprint-v4.2.md#42-40项反向映射每项能力服务什么任务)的40个ID、名称和完成要求摘要；详细长期条件继续由[原register](../capability-coverage/register.md)拥有。本版只添加宿主／插件归属，不重写累计实现状态。宿主有主责不等于算法必须在宿主仓库实现。

| 原能力ID／名称 | 宿主／可选专业承载 | 保留的完成要求摘要 |
| --- | --- | --- |
| C1-01 PIM问题澄清与独立调查 | H1／H3；研究／探索扩展 | 声明的问题族能完成调查，未知可结束，不强造OSM目标 |
| C1-02 OSM目标到经营复盘 | H1／H5；看板可参与呈现 | 目标、差距、分析、策略、行动记录和复盘真实接续 |
| C1-03 Case全过程组织 | H1，H5／H6／H7接续 | 稳定身份贯穿适用阶段，分析／决定／行动／评价不混同 |
| C2-01 假设先行分析 | H3／H6；领域工具 | 声明假设类型有真实方法、计算与不足／拒绝结果 |
| C2-02 深度研究 | H1／H3／H4；deep-research | 真正消费获准来源、独立核对时效／反证，不用模型记忆冒充检索 |
| C2-03 自主探索模式 | H1／H3；探索专用面可选 | 有界主动探索可停止，候选与正式结论分开 |
| C3-01 Personal可持续使用工作台 | H1～H8按任务组合 | 正常交付入口可独立完成任务；浏览器承接近期载体，旧Desktop证据保留 |
| C3-02 Team协作、复核与复用 | H1／H4／H6，贯穿治理 | 真实多人消费、权限与冲突／退出处理，不以子Agent冒充团队 |
| C3-03 Enterprise场景与治理 | 场景适用宿主及插件 | 每个环境的安全、责任与运行边界有证据 |
| C3-04 任务、留存与商业价值 | 全部宿主／插件的价值观察 | 独立完成、重复使用、愿付费与实际收益分开观察，不由测试推出 |
| C4-01 描述方法 | H3；领域／方法工具 | 声明方法真实执行、数值正确、有边界及反例 |
| C4-02 诊断方法 | H3／H7；领域／方法工具 | 证据支持的诊断及不支持结论区分，不把贡献当原因 |
| C4-03 因果方法 | H3／H4；因果工具 | 识别条件、合格设计、独立验证及条件不足拒绝 |
| C4-04 预测方法 | H3；模型工具 | 样本外质量、限制与模型身份可检查，不替代人的承诺 |
| C4-05 探索方法 | H3；探索工具 | 适用性、选择偏差／不确定性、核验，与探索模式分别证明 |
| C4-06 优化方法 | H3／H5；优化工具 | 目标和约束被实际求解、可行性核验，人作最终选择 |
| C4-07 Domain Pack | H3消费／H6治理；插件可供给 | 精确版本被Context／IR和真实任务消费，不是只有包目录 |
| C4-08 Model Pack | H3推理消费／H8装配；插件可供给 | 安装／激活、实际消费、质量与来源链分别验证，复用独立模块 |
| C5-01 比较与正式决策 | H5／H7；decision-platform可呈现 | 有依据备选、理由、责任与明确人工效果，不隐式批准行动 |
| C5-02 事前预期与观察 | H5 | 事前版本、条件和护栏可见，后续观察资格可判断 |
| C5-03 Fork分支比较 | H1／H2 | 同根来源、单层有界讨论、停止、回流与明确采纳 |
| C5-04 单个有界Subagent | H1／H2 | 独立授权、受限执行及MODEL材料回流，不等于独立计算证明 |
| C5-05 行动批准、执行与回执 | H5；N20专项工具 | 批准、记录、真实执行和回执等级分开；未执行可如实记录 |
| C5-06 合格Actual与回收 | H5／H4 | 来源、窗口、口径、成熟度和迟到更正有效，不由Expected生成 |
| C5-07 结果评价与复盘 | H5／H7；专业呈现可扩展 | 执行、观察、校准、归因与当时判断分开，缺证保留未知 |
| C5-08 Case Assistant | H1／H7，H2授权 | 合格上下文、来源和独立授权；新未完成任务不暗改旧资格 |
| C5-09 报告／Report Studio | H7基础＋reports-factory增强 | 本轮证据驱动表达，意见／版本对应；报告导出不冒充完整Case迁移 |
| C6-01 历史找回与关系复用 | H6／H4；检索可增强 | 权限、关系和适用性准确；读取历史／重放／新数据复用分开 |
| C6-02 改进候选与治理版本 | H6；专业编辑器可参与 | 正确Owner、验证／批准与不可变新版本，拒绝可追溯 |
| C6-03 下一Case显式采用 | H6→H1／H3实际消费 | 新任务实际消费获批版本、记录采用效果，旧Case不变 |
| C6-04 学习有效性 | H6及跨任务可比证据 | 独立留出／后续可比任务证据、成本与不确定性，不以采用数替代 |
| A-01 数据接入与资格 | H4；专业来源／准备工具 | 来源真实消费、质量和漂移检查，不合格拒绝 |
| A-02 Context与Binding | H3／H4／H6 | 正确语义权威、物理绑定与精确版本，不凭列名猜业务事实 |
| A-03 Contract／IR驱动执行 | H3；专业方法消费者 | 合法计划变化改变实际执行及验证，不支持／错配拒绝 |
| A-04 受控执行与运行管理 | H2，H1／H3接续，H8装配 | 实际授权、状态与运行相符，恢复不重复副作用，不默选Runtime |
| A-05 来源、版本与历史 | H4／H6，贯穿全部 | 输入→语义／计划→执行→证据→结果可回链，历史不可篡改 |
| B-01 证据、反证与不确定性 | H4／H7，贯穿H3／H5／H6 | 独立验证、来源强度及限制能支撑具体主张，不用模型自证 |
| B-02 授权、隐私与作用域 | H2／H4／H8，贯穿全部 | 批准对象与实际访问／出站／工具一致，未授权路径拒绝且无越界效果 |
| B-03 人审、Owner与确认 | H5／H6／H7，其他分组遵循 | 精确版本、真实人的效果、权限和Owner不被系统代签 |
| B-04 有限域行动自动化 | H5／H2／H8；专项行动工具 | 单独授权、幂等、回执、停止接管及适用撤销／补偿，不由分析授权推导 |

原六条主线C1～C6及两项贯穿A／B完整保留；它们是能力分类，不是八个独立产品，也不与H1～H8一一对应。C2分析模式、C4方法类型、快速／专业UI模式仍为不同维度。

能力中心首期主要服务C3-01、A-01～05及B-01～03的受选范围；只有真实提供并消费领域方法时才关联C4-07，团队配置不直接计为C3-02或自主探索完成。上表原完成要求逐字保留，目录增量不自动改变任何累计实现／集成／验收状态。

Fork／Subagent在本表保留原能力定义，不把2026-10-04正文的人工单层说明当作对后续已批准005 v1.3的追溯禁令；具体当前自主协作范围仍按各自有效合同，不由本版增删。

## 5. 本轮验证边界与后续采用

本次仅检查草案、映射、引用、范围和独立产品计划就绪；不运行产品测试、构建、真实模型、可视业务验收、安装或服务。代码图索引是早期快照，与本轮固定main不匹配，故仅作定位参考，以本轮源码／规格／接受记录复核，不重建索引或重放历史索引豁免。

draft.1两份原文件已按原字节复制保留在MacBook持久目录`/Users/huangbo/JuanerAI-artifacts/blueprint-v4.3-20261025/pre-draft2-20261027/`；对应[brief001](reviews/blueprint-v4.3-readiness-brief-001.md)／[审查001](reviews/blueprint-v4.3-development-readiness-review-001.md)的PASS仅适用于其原大小和SHA-256，不能覆盖本次新增能力中心。draft.2另作固定候选就绪审查；原审查不改写，持久副本不等于跨设备备份。

本附件不是新的验收回执。旧F-B01失败、realQ／A-B／QS04及适用Desktop／Supplier／跨设备未完成项仍属原任务；旧预算及UNKNOWN不清零，不将它们全部变成每个未来Change的无差别前置。当前新链、指定插件及下一会员回访各自只核验适用接点，真实调用、产品接受、Git发布与生产采用各按实际授权分别处理。

用户确认本草案之前，生效入口不变；确认后也不自动提交Git或通知Mini，不要求在研任务改合同／改分支／停工／重审。本稿不另建工程状态、统一配置实现、插件注册服务或新管理文档体系。
