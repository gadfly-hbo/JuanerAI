# Blueprint v4.2 批准与本地规则整合记录

2026-10-04 · MacBook 产品蓝图 session。

本地固化时状态：`USER_APPROVED / PLANNING_READINESS_PASS / LOCAL_RULES_INTEGRATED / GIT_NOT_PUBLISHED / RECEIVER_ADOPTION_UNCONFIRMED`。后续Git发布及双端main同步授权见§6，实际结果另以发布回执证明。

## 1. 用户决定

用户明确“确认蓝图v4.2”。采用[完整蓝图](juanerai-product-development-blueprint-v4.2.md)及其[HTML系统蓝图](juanerai-system-blueprint-v4.2.html)：**能力建设为主轴，完整用户任务约束交付，阶段成果约束验收**。

白皮书 → 能力地图＋用户旅程 → 双向对应 → 有限阶段成果 → 结果型Change。四个核心视图、六条主线＋两项贯穿能力、40个稳定ID、N01～N20及S1～S6保留。HTML是规划阅读件，不是产品UI Contract或新的状态权威；AI-CRM只提供展示参考，没有采用其业务能力、排期或工程规则。

本次批准及本地整合不包括提交、推送、PR、合并、主机同步或向其他session发消息；不重放历史Git授权。不安装依赖、调用Provider、启动Change、修改UI合同或业务代码。

## 2. 已批准增量及在研保护

- 双向梳理完整任务、能力消费者、阶段与依赖；不新增能力，不增删、改名、重排20候选，也不把它们变成20个已批准工程任务。
- 汇总既有浏览器＋同机服务方向与工程减负政策；Desktop资产和旧E2缺口保留，不以浏览器证据冒充原生验证。
- 复用001～004，特别是004已有受限MembershipPlan消费链；不回退为“IR只有记录”，也不外推通用能力完成。
- 如实标明005相对修订002已独立批准的多源准备、两条模型材料路径、模型与资源策略，以及N03/N04必要子集；这些不是v4.2新增授权。
- 在研Change005 / `xanthil-browser-multisource-membership-analysis`继续原有效产品包、UI、授权和工程边界。**本次不要求在研session重新采用、暂停、返工或重开已批准决定。**
- 默认仍是N01/N02首试→S1收口→N05/N06回访评价→N07/N08改进及下次采用；必要数据语义随消费者接通，专业子集按真实阻塞和用户决定进入。

## 3. 精确身份与审查沿用

| 资产 | 字节／SHA-256 | 当前解释 |
| --- | --- | --- |
| [完整正文](juanerai-product-development-blueprint-v4.2.md) | 61706 bytes；`3f9600fd44f0d869a2ae4632b92c3f6c182d40d3e2223c7cd75619fb7b438cf3` | 原`4.2-draft.1`受审字节完整保留；现批准为v4.2 |
| [独立就绪Review001](reviews/blueprint-v4.2-development-readiness-review-001.md) | SHA `34c9fbfd37f89059a2ec78444605260a249528ea50b01383ba22cb027fe92b27` | 独立只读规划PASS；原“待确认”是审查时点，不回写旧结论 |
| [HTML阅读件](juanerai-system-blueprint-v4.2.html) | 86287 bytes；`c94ec111258f002aca28a4f8315ea32698ea527ff07ce74b5805a1c5dd821ce0` | 本轮只更新批准／发布状态文案，能力及交互数据未变 |

正文文档控制、§12及Review001中的草案、待确认、未整合字样保留其历史时点；**后续用户批准及本地规则整合状态由本记录确定**，不是要求重新批准。正文语义没有修改，沿用适用独立规划审查，不新增一轮产品Gate。该PASS不等于20项开工就绪、005工程完成、UI接受或产品运行验证。

批准前HTML的SHA为`e5e2ad0475312bbf827a51b5a1138d408fb280aa33da74e6be89907fc4928039`；其40项、20候选和6阶段已与完整正文对应表核对，关联中的A-01↔N01/N02只表示005已批准子集，C3-04↔S1/S3只表示贯穿价值观察。本文不把交互逻辑检查升级为浏览器实际渲染验证。

## 4. 本地整合及未变范围

在原分支`work/macbook/blueprint-v4-2`进行整合；本轮起点HEAD `0db323bc2aa8b4c44e357e4f6e0986b83465ac56`、tree `b37116651c3981f006664ef041db13dc1ccb50e3`。

- `AGENTS.md`、`CONTEXT.md`、规划README和product-brief的现行指向更新为v4.2，加入必要双向方法与在研保护；原则和权限边界不变。
- 累计能力register、latest及evidence仅调整规划指向，标明v4.1历史解释与004后补证据的时序；能力条目、工程状态、已有证据和阶段快照不改。
- v4.1及更早蓝图、修订002两份规划、旧原型及本工作树既有未跟踪材料保留；正文与Review001保持上述指纹。
- 不修改执行政策、状态机、角色配置、工程看板、在研005、旧WIP或任何业务实现，不建立额外管理框架。

本地规则整合不等于Git保存。后续如获Git授权，以实际发布commit/tree及正常验证结果交付；不从当前HEAD预填发布身份。未来新任务读取正式入口和精确版本，在研任务不强制追新。同步本地main不等于现有session采用；本轮不代写Mini或Change session回执。

## 5. 本轮本地核验

- 314处本地文件／锚点引用有效；首次检查把已有`codex://`深链误当本地文件，修正检查器的协议分类后通过，未为此修改来源文档。
- 正文、Review001和HTML指纹匹配§3；HTML语法及40能力／20候选／6阶段数量检查通过。本轮只改HTML状态文字，未做浏览器渲染或产品验证。
- 266份既有跟踪规则／规划／状态文件的前后指纹仅有上述7份规划整合文件变化；累计清单各能力条目、004工程补充以后内容、历史快照、工程状态和旧版本未变。
- 原生只读支持Agent `/root/blueprint_v42_approval_consistency`（按现行路由请求Astra/medium）读回本地候选，未发现批准状态、版本引用、权限或在研保护的实质不一致。这是整合一致性检查，不是新Gate或工程Validator。
- `git diff --check`通过。未运行full-index、Canonical CI、业务测试、UI、构建或Provider；未暂存、提交、推送、合并或通知接收方。

## 6. 后续Git发布与双端main同步授权

用户随后明确“提交、推送、合并或同步 Mac mini”。据此允许在当前分支发布本次v4.2正文、HTML、审查、批准记录及7份必要规则／规划引用，创建PR，正常CI通过后squash合并，再按现行`sync-main`安全同步MacBook和已配置Mac mini的本地main。原有未采纳补充和v0.1原型不纳入；不删除本地分支，不切换、重置或覆盖在研工作树。

本记录§1／§5及正文／HTML“未发布”等字样是各自固化时点；本节记录后续授权，不预填提交、PR或同步成功。实际发布回执保存在MacBook持久目录`/Users/huangbo/JuanerAI-artifacts/blueprint-v4.2-publication-20261004`；本机保存不等于跨设备证据备份。

本次含离线交互HTML，保留现行CI范围判定及正常required check，不因“规划”标签更改CI或加豁免。当前工作树没有安装依赖；本地执行文档／指纹／HTML针对性验证，GitHub依现行策略执行完整portable回归，不把它当Desktop原生或产品体验接受。代码图索引不是当前Git发布前置，不沿用历史索引豁免。

双端同步只更新各自main的安全镜像；任务分支、索引和文件保持原状。若main被占用、分歧或SSH不可用，则报告精确跳过／失败，不强制修复。同步不等于在研session规则采用，不发送通知，不重开005的产品／UI或工程权限。
