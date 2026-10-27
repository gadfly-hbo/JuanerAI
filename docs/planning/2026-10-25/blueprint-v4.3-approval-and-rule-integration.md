# Blueprint v4.3 批准与规则整合记录

2026-10-27 · MacBook蓝图Agent · `USER_APPROVED / PLANNING_READINESS_PASS / RULES_INTEGRATED`。

本记录形成时，Git发布及双端同步尚未执行；用户已在本轮明确授权完整Git交付，实际PR、CI、merge SHA及逐端同步身份在最终发布回执中读回，不预填成功。本机证据根为`/Users/huangbo/JuanerAI-artifacts/blueprint-v4.3-20261025/publication-20261027`；本机保存不等于跨设备原始证据备份。

## 1. 用户决定及采用范围

用户明确：“确认蓝图v4.3，更新项目规划入口和相关规则，提交、推送、合并到main，并安全同步双端本地main；不改变在研Change，不启动开发。”

据此采用[正式Blueprint v4.3](juanerai-product-development-blueprint-v4.3.md)作为JuanerAI最高产品开发执行指引，替代v4.2对新任务的现行规划地位。白皮书v4.0仍是核心产品参考与商业化纲领；本次不修改白皮书，不重新采纳其全部技术候选。

- 日常按八类宿主统一责任＋可选业务插件组织；共同事实、状态、权限与资格保持原权威，Pi／SDK承接原生Agent机制。
- 明确增加“分析资产＋连接器＋业务插件”能力中心的管理与使用体验，不冒称纯重命名或原已实现。首期复用现有目录、有限合格专家／Skill及专业资产、一个有真实需要的只读来源，在正常任务中真实采用并可追溯。具体资源与连接器在后续产品准备中确定。
- 主承接N04，N03接资料来源，N01／N02验证任务采用，N09只补必要方法消费；N07／N08保留评价驱动改进及跨Case学习。发现、安装、连接、授权、采用、执行与有效性不同，Agent团队配置不等于多人Team能力。
- 保留四核心视图、六条主线＋两项贯穿能力、40个稳定ID及原目标、N01～N20名称／关键依赖和S1～S6。无N21、无新的正式Change编号，无强制拆并。
- 当前分析／报告链做稳→下一默认N05＋N06回访评价→N07／N08改进与下一Case采用。能力中心可做后续产品／UI准备，工程另获授权；不成为默认主线前置，不自动插队。原有业务记忆、库存及最小探索条件式候选保留，不启动它们。

## 2. 受审身份与正式正文

| 文件 | bytes／SHA-256 | 采用解释 |
| --- | --- | --- |
| [受审draft.2](juanerai-product-development-blueprint-v4.3-draft.md) | 30155；`6e23685d1ea0dedc75ec8301114d4979ffc66ccaed392781e95e2d33c9b3bf0b` | 用户确认的产品候选，原字节保留 |
| [静态映射与事实附件](blueprint-v4.3-mapping-and-evidence.md) | 27572；`f8201caab871f90850cb7f70ff3fa7ee234ffcb9308ccc3ef5509884cf565ddd` | 20索引／40目标及具名工程事实、限制与时点，原字节保留 |
| [正式正文](juanerai-product-development-blueprint-v4.3.md) | 31093；`4b65bf9d6abd87837b2e191291018dee2c45a99a0410df71547f4d1a4d24a977` | 沿用draft.2产品语义，仅整合正式版本、批准／发布授权状态、导航与§7采用边界 |

[brief002](reviews/blueprint-v4.3-readiness-brief-002.md)及[独立就绪审查002](reviews/blueprint-v4.3-development-readiness-review-002.md)证明上述固定draft.2候选规划就绪PASS，不是工程Validator或用户产品接受。正式正文§1～6与受审候选在机械称谓整合后保持一致；本次不新增一轮产品审批。

受审草案、附件、brief及审查中的“待确认／v4.2仍生效／未获Git权限”属于其固化时点，本记录和正式正文确定后续批准与授权状态。review001仍只适用draft.1旧指纹，不升级为draft.2的审查；两份draft.1原字节已保留在附件注明的MacBook持久目录，未声称跨设备备份。v4.2原文、批准、HTML和更早蓝图均不改。

## 3. 项目入口与规则整合

现有分支`work/macbook/blueprint-v4-3-host-plugins`，起点／发布前main为`ad41474d5e01cb9743a16b0af5914b2c40f94f0a`，tree`9055d8c455863e28c8922905f3e2b4112571d057`。

- `AGENTS.md`切换现行权威、共同原则及选Change阅读入口到v4.3；采用实际§1～7和映射附件，不把旧§8～11机械套给新版本。研究Demo要求显式保留v4.2 §11来源。
- `CONTEXT.md`更新蓝图定位及能力中心词义；`docs/product/product-brief.md`更新现行组织、范围与顺序。
- `docs/planning/README.md`置顶v4.3正文、批准、审查及映射；旧日期记录和v4.2区块按历史阅读，不以旧“当前”覆盖新入口。未制作新的HTML或产品UI Contract，旧v4.2 HTML明确保留为历史阅读件。
- `capability-coverage/register.md`、`latest.md`和`evidence.md`只调整规划来源、章节解释及新增短规划段；不改任何能力条目、状态类、原目标、具名工程证据、时间或阶段快照。
- 两份原统一路线材料只更新顶部阅读导航，保留原20项和所有具名历史，能力中心边界与顺序读取v4.3。

不修改Orchestration、唯一执行政策、状态机、角色、SDK／运行配置、代码／测试、OpenSpec、工程看板、在研任务或任何旧状态。不增加管理框架、额外技术签字或重复审批。

## 4. 发布及同步边界

本轮明确授权上述规划文件及规则的提交、工作分支推送、PR、适用独立一致性核对、当前required CI、正常squash合并以及双端main安全同步；不是checkpoint-only，不需再次例行询问合并。按原CI分类运行，不改workflow或重放索引／Git／角色例外。

同步使用现有`tools/harness/git/sync-main`，核验实际合并main后只做安全快进。main未被检出时只更新ref；占用、分歧、身份不符或SSH不可用按实际结果停止／报告，保留已成功一端，不强制覆盖、切换、stash、reset或清理。双端在研分支、HEAD、索引和工作树保持；不发跨session通知，也不以main更新宣称在研采用。

此发布不启动工程、Provider、真实数据访问、依赖安装、SDK升级、服务／Host Loop、产品发布或生产切换。历史接受、失败、BLOCKED、UNKNOWN、消耗、预留和未完成验收保留；规划／CI／合并不替代完整业务、模型质量、UI或阶段产品验收。

## 5. 验证与实际结果定位

本地只核验获批内容保留、入口／章节／链接、文档格式、变更范围、能力与历史不变，以及正式文件和受审候选身份；不运行产品或真实模型。本地核验、独立整合一致性结论、实际CI和双端同步结果记录于上述持久证据根及最终Git交付回复，不在执行前预填PASS。

托管CI依当前可信基线分类器与required check执行；文档名称不构成跳过完整回归的理由。实际CI不等于Desktop、安装、Supplier、真实模型、跨设备产品或用户产品接受。
