# Metric Factory 固定插件接入 · 当前行为规格

2026-10-19；Mini-led，同一主 Agent；Engineering Intake 确认。用户原始任务授权整个产品固定接入，最新决定采用当前生产 UI，仅允许修正集成配置说明与真实停止反馈。当前产品输入：../../../docs/planning/2026-10-19/metric-factory-integration/proposal-v0.2.md、ui-contract-v0.2.md、supplier-business-baseline.md；fresh readiness004 PASS，原 FAIL／旧 UI 撤回保留。正式接受仍需独立工程 Validator 与用户。

## 固定起点与边界

宿主 branch work/mac-mini/metric-factory-integration，HEAD 41e6c1f167cea578960a2d0c75e86e5f31a9190e；工程前仅本任务规划目录 WIP。供应在 Mini 独立 clone /Users/bendandebaba/Dev/Projects/metric-factory-juanerai-integration，branch work/mac-mini/juanerai-integration，从169faa8d45e1c5616c004f8fb844a7ca68add156建分支，干净。MacBook原仓main及未跟踪工作保留，不写远端。旧签名Host Loop未启用，旧全局指针UNKNOWN不作为当前半自动任务新审批门，不操作旧任务。

允许：供应 src/ui、src/llm、src/integration、src/sap/release.ts（显式方法库与集成体系包身份注入、不可变发布文件保护；独立版身份缺省不变） 及对应test、构建配置/固定锁必要接点；宿主 metric-factory 专属 Port/Application/Adapter/Profile、现有浏览器插件入口/composition、固定资源/构建脚本、对应测试及既有 canonical 固定文件清单合同的精确追加（保留旧负例）；本Change与当前工程看板/必要追踪记录。条件：依赖仅按已固定锁安装，新增/升级依赖或业务规则变化先做影响判断；普通中立接点本地供应分支维护。禁止：重画UI，修改HTML/CSS原字节（现有四文件身份已固定）、SAP消费/安装、Case默认输入、SDK升级、凭据发现/真实Provider/真实业务数据、远端发布、全局服务或安装替换、旧WIP/账本清理。

持久证据根 /Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001；所有命令/输出/退出/固定候选在此追加。声明的SDK为供应0.4.3，宿主现有版本独立，不统一。

## 结果与接点

MF-01 固定来源/资源：精确源码快照+清单hash，内置模板、运行依赖、Node和通知齐全；启动前校验，未知/缺失/改字节/链接逃逸失败，无开发仓路径fallback。构建/包/安装分别证明。

MF-02 生命周期：宿主owned子进程、loopback与owner握手，懒启动并发复用；未知进程不接管。关闭前核对活动/unknown，拒绝热换；自有空闲才关闭。

MF-03 准入：供应server接收显式中立integration hooks。集成每次LLM请求只用宿主注入客户端/配置，不触发resolveLlmEnvAuto、独立env或默认链。缺配置/授权通过现有错误路径拒绝；保持本地模板编辑。稳定逻辑任务身份与账本，所有物理请求授权/计量/审计；实际SDK合成codec证明边界，provider仍NOT_RUN。

MF-04 数据：固定程序/内置模板只读；独立插件workspace内实例、pending、用户模板/方法、发布、ledger；宿主copies分离。所有输入路径限定根，绝对/穿越/符号链接拒绝，不读取原仓真实实例。重开不自动跑模型；未知保持。

MF-05 交付：现有deliver请求先做供应发布业务门，取得精确release快照；host copy保存读回后才返回成功。发布已成功但copy失败/响应丢失：保留原版本，按原id/version/hash恢复同一次交付，不再生成、不清账、不覆盖。repeat same-content不造版本。现有download路径取已固定版本；即使工作稿不存在，宿主稳定副本保持。现有业务正负例按正式附件；D-MF-01仅记录，不扩大修复。

MF-06 UI：index.html/style.css原字节。app/api只必要接线，配置说明说明宿主配置/无faux；现有停止动作发cancel，accepted/pending/settled/unknown用现有toast/错误反馈，只有确认物理结算才显示已停止。关页不等于停止，不新增按钮/弹层/宿主条/额外保存。供应当前全工作台共用业务。

MF-07 取消：先关闭新准入，AbortSignal进入真正runtime。结果写入前重验任务状态；停止后迟到不能发布/保存或创建草稿。无法证实消费或终止则unknown、拒绝新调用与换版，不通过新taskId重置。用户返回首页需求文本保留；只有显式新请求经有效授权才能运行。

## 验证与回滚

采用Continuous SDD/TDD。核心可执行检查：供应 npm run typecheck、指定 test/integration/* 接缝（vitest）、原test/ui与test/llm回归、build/lint；宿主新Port/Store/进程正负合同及browser/plugin affected测试、typecheck；最终 canonical tools/harness/validation/run --portable 使用 /Users/bendandebaba/Dev/Env/juanerai-toolchain/bin（Node26.0.0/npm11.12.1/duckdb1.5.2）。实际命令随测试命名固化在verification；不运行原真实model冒烟，UI浏览器受工具限制时明确NOT_RUN。

先固定源UI字节及现有业务用例基线，再新接缝可失败反例与实现。只在独立clone/当前worktree和专用合成数据根运行。独立版默认行为回归必须保留。独立Validator评估完整最终候选；作者自测不替代独立结果。固定包可回退，数据/历史不回滚删除。最终安装/发布/真实Provider及残余风险必须单独有明确授权或保持未完成。


## Validator001 后普通纠错影响决定

F-MF-01/02 属于 MF-05 已批准交付保证的缺陷，修正不扩大 UI 或业务规则。集成体系包身份采用经过校验的 workspace 相对实例路径 SHA-256，固定前缀 system-；同路径重开稳定，不同体系隔离，不依赖标题或同名文件。供应 release 增加中立可选 packageId 输入，先验证再写盘；独立版沿用原算法。没有改变 SAP 格式、审核门或版本规则。

全部列表/详情 delivered 以该体系精确发布版本和匹配宿主回执共同确认；未保存不得显示交付成功。相同内容且宿主缺副本时重试保存原 id/version/bytes，确认后返回原 UI 成功响应；已保存的重复请求仍保持原422。下载必须指定该体系登记的精确版本，不读全局最新版；缺失或损坏拒绝，不替换为其他版本。工作稿丢失不删除 release 或宿主副本。

旧 build006 及其合成数据/反例保留；新 sourceSnapshot 与旧 identity 不兼容，禁止自动接管/迁移/重标已混淆的 instance 发布记录。旧数据身份保持失败关闭，独立版历史不迁移。此为 Engineering Controller 的接点影响决定，不授权 SAP 消费、真实数据、发布或残余风险豁免。


F-MF-03影响决定：供应原发布承诺已是不可变快照，索引缺失或过旧时覆盖同版文件违背原语义。修复只执行该既有约束：非空发布目录缺索引即拒绝重建；快照以排他创建wx写入，已有版本/中断孤儿保留并报错，索引不改写。不引入新审核门、格式、自动修复/迁移或用户操作；独立版同样保持原不可变承诺及默认身份。原始FAIL和被覆盖反例永久保留。

F-MF-03续检影响决定：独立003证实空索引和非空部分索引都会漏掉其他体系旧物料。读取登记时校验条目路径与实际发布快照的一一对应，未登记、缺文件、重复条目或非法文件结构拒绝后续发布写入，保留所有原物料；不自动恢复登记。该检查执行已有完整历史与不可变保证，不增加业务审核、UI、持久格式或迁移。

F-MF-04兼容纠错：供应既有receipt.ts在releases/receipts/*.receipt.yaml保存收编回执，正常发布应保留且容许这些文件。仅该既有目录内普通.receipt.yaml文件不参与SAP集合核对；同目录SAP文件（包括合法packageId=receipts）仍须逐项登记。无SAP消费接线、格式变更或新增UI。


## 继续接入：模型装配与材料闭合影响决定（2026-10-19）

用户要求继续成功接入，并明确批准 MiMo v2.6 Flash / https://token-plan-cn.xiaomimimo.com/v1，读取宿主已保存的小米凭据；先限虚构经营/战略需求，最多4个任务、8次物理请求、单次输出<=16384 tokens，验证生成/修改/停止，不自动传Case或真实数据。该授权替代上文真实Provider禁止项的这一窄范围；不授予其他模型、真实数据、安装或Git发布。宿主配置读取只在明确AI任务准入时发生，沿已有凭据存储与共享任务lease，未结算/未知不释放或清账，逐次检查当前授权。授权缺失、撤销、额度耗尽或配置变化拒绝；启动/模板/编辑不读密钥。试验授权与累计账本需保留重开计数，不靠新taskId恢复额度。

许可补齐沿供应package.json原有Apache-2.0声明，复制官方LICENSE原文并记录来源/摘要与集成修改；原固定源无NOTICE，保留这个事实，不编造版权主体或原仓回执。固定构建携带LICENSE及修改说明，有供应NOTICE时原样携带；未提交原仓保持待回流。

独立版catalog的最小标准对齐采用显式中立配置：把原精确pi-ai 0.87.1静态目录在工程时投影成现有SDK ModelConfig支持的数据及原拒绝说明，产品运行时仅读取固定配置，不import Pi catalog/types，不增加Runtime/SDK API、不升级SDK。保留原真值表、网关、主备顺序和错误语义；1495个原目录项逐项记录改前/改后解析等价证据，后续配置更新必须重新固定来源与差异。此为原有静态配置的供应维护，非新通用目录服务。若不能证明等价则不移除旧路径，不以改用SDK内部0.86.1目录默默改变兼容集合。


真实合成试验001首请求返回payload FAIL：question_tree节点遗漏label，evidence_requirements返回数组。已结算1次物理请求/1718输入/3888输出，无草稿落盘，无UNKNOWN。供应现有Schema明确要求label与string，原prompt只写question_tree([])且三项文本含混。普通纠错只补足这两项既有输出说明，blueprint prompt provenance升为v1.0.1；不改Schema、审核门、模型修复循环、UI或业务规则。失败原件保留，剩余原授权预算累计沿用（3任务/7请求），不能以换固定包/试验目录清零。新包不自动迁移原工作区；专用合成试验接续必须复制并独立核对已结算授权/SDK账本，保留原目录并明确这是试验夹具续接，不声称用户数据升级已通过。


### F-MF-05 采纳接点纠错（真实合成试验发现）

第四次获准调用返回有效增量提案，但SPA apply-refine把added=[]当全量覆盖，既有指标引用消失导致422；当前UI原稿字节保持。供应既有src/engine/apply.ts的applyDraft已明确：blueprint全量替换，指标/场景增量合并，同名指标/同ID场景拒绝；旧HTML采纳入口已使用该函数。工程影响决定：SPA复用同一applyDraft再走既有writeWithGate，删除绕开的私有全量拼接；不定义新合并规则、不更改UI或Schema、不允许模型代替编辑器覆盖同ID场景。真实第四提案生成了不同ID的新场景，按既有合同是新增，不能冒称已修改原场景。新增保留被引用指标/场景与冲突零写盘回归；不为诊断再次调用模型。


### 用户明确续授（2026-10-19）

本次合成验证任务上限由4增至6，总物理请求仍8，路线/材料/每次16384输出上限不变。原4任务/4请求、失败、SDK账本和配置身份保持。宿主要求新6任务grant精确标识；旧4任务grant不自动获得扩权。原账本authorizationReference作为同一试验历史标识不改写，仅新准入上限增至6，UNKNOWN仍阻断；第7任务和第9物理请求拒绝。新增原4任务保留、6任务上限和旧grant拒绝永久回归。此授权不包含额外CLI角色例外、Git、安装或正式产品接受。


### F-MF-06 历史丢失拒绝（独立006）

独立006只读反例及作者因果RED均确认：整个宿主admission目录丢失会重置任务数；供应strict budget缺文件和tasks缺失/原始值可能成为空历史。此为既有MF-03/04/C09授权/历史保证的缺陷，修复不引入自动恢复。宿主首次创建admission前若发现既有runtime内容即拒绝；当前私有模型注入增加中立historyRequired布尔值，表示宿主已有任务历史，不携带SDK类型或业务内容。供应只有宿主明确无先前历史、tasks/budget/audit均无时才排他初始化两份空账本；任一已有、部分缺失或宿主声明有历史时拒绝初始化。后续strict budget缺失一律STATE_FAILED，tasks须为对象。首次初始化途中失败保留部分文件并拒绝重试，不清零/推定结算。原独立版非strict行为不变。

这是现有双端私有接线与损坏拒绝的工程影响决定，不改变产品业务/UI/公开SAP格式，不迁移既有UNKNOWN试验目录，不扩大模型额度。修复后只做离线合成复验及固定物料构建；无新增Provider。

### F-MF-07 当前生产绑定保存接点纠错

真实草稿的现有“调整绑定”弹窗同时列出指标用途和方法角色；原服务端只识别前三种用途，原样保存即422。当前UI指示引用当前体系而不复制定义，方法定义仍由G8另存流程拥有。Engineering Controller判断：本次仅使已有保存操作按现有实例的精确method_ref/role写回指标引用，不改方法库、不添加角色或修改业务含义；未知指标、未知/歧义显示名、重复方法角色一律零写盘拒绝。保留现有表单完整提交及“尚未绑定”语义；缺失required绑定沿既有引擎复核，不新增自然语言正确性保证。四个UI文件不变。此纠错不授权第七次模型任务或默默补造经营指标；原经营草稿的质量缺口继续保留。

### CLI003 FAIL 后 F-MF-08/09/10 普通纠错影响决定

用户转授的一次CLI003已经完成且结束（实际Astra/high/read-only；完整报告FAIL保留），不得自动再执行。三缺陷属于已批准MF-03/04/05/06正常用户路径：审计文件与tasks/budget共同仅在真正首次使用初始化；任何部分缺失拒绝，追加使用不含O_CREAT的现有文件打开，禁止丢失后重建。方法角色的编辑身份来自既有精确版本方法定义，即使实例解除绑定也保留“尚未绑定”选择；读写共用同一目标映射。现有DTO和表单提交只传递隐含kind/methodRef/roleId，防止相同中文显示名猜错对象；无身份旧请求仅在唯一映射时兼容。HTML/CSS/api.js不变；app.js只将该现有选择项的身份随metric原样带回，无新控件、文案或布局。合法方法的engineReady使用与复核/发布相同的实际方法库；不改变业务门或D-MF-01。三项均补永久反例与受影响回归；无新Provider、无新增模型预算、无数据迁移。费用角色恢复能力不代表经营模型草稿业务质量已通过。
