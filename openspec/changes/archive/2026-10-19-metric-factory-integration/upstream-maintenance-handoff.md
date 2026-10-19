当前用户已接受本机浏览器结果并授权Git回流；供应PR #2及固定维护源码映射见[git-delivery.md](git-delivery.md)。以下旧维护说明保留历史时点；原仓未跟踪工作不得覆盖。

# 可转交供应原仓的只读核对说明

当前为 Mini 本地候选，未 Git 回流、未发行；请勿将此记录解释为切换 MacBook 原仓、启动实例、读取凭据/用户数据或调用模型的授权。

原仓固定base：169faa8d45e1c5616c004f8fb844a7ca68add156。维护候选位于 Mini 的 /Users/bendandebaba/Dev/Projects/metric-factory-juanerai-integration，work/mac-mini/juanerai-integration。固定快照 supplier-snapshot-017，SHA 238f5dc0b3818790c8e030c468be93537979665bf0e0bbce4b8de3955e70e331；可读证据根 /Users/bendandebaba/JuanerAI-artifacts/metric-factory-integration/intake-20261019-001（当前仅 Mini 可访问，不冒充 MacBook 已收到）。

中立业务接点仍在供应仓：src/ui/integration.ts、integration-paths.ts、server.ts；src/integration/entry.ts、publication.ts；src/llm/integrated-client.ts、budget-store.ts；src/sap/release.ts增加显式方法库与集成体系身份注入；默认独立版身份不变。HTML/CSS保持当前生产字节；app/api保留已批准配置说明和真实停止接线；app另有绑定DTO身份字段透传的一行修复，未改可见UI。独立版默认路径和现有业务规则保留。

宿主专属实现只在 JuanerAI 的 metric-factory Port/Application/Adapter/Profile/HTTP 与固定包构建接点；SAP保存没有变成安装/消费，不加入Case默认输入。正式采用须分别核对：供应维护提交、独立入口回归、JuanerAI固定目标包实际包含，不能由一方commit或版本号推定三者相同。

当前增量：补齐既有Apache-2.0声明对应官方LICENSE原文；原源无NOTICE保持事实。独立src/llm/index.ts改用固定中立ModelConfig数据，1495项旧解析结果/拒绝逐项相同，Pi metadata保留MIT通知；SDK0.4.3未升级。D-MF-01口径显示/执法差异保留、未修未豁免。请对事实源确认，不能凭说明直接改业务语义。

获准后通过 Git 固定维护提交和交付，不把当前本机快照直接覆盖原仓；原MacBook工作树及未跟踪my-instance等保持。供应当前323PASS/9SKIP、宿主21PASS；F-MF-06/07修复已离线验证；具体候选、旧失败、宿主结果与未完成接受见 verification.md。


本地纠错007：每个集成实例以经校验相对路径的SHA256获得稳定体系身份，回执/下载绑定精确版本；保存失败重开不显示已交付，同版恢复确认后返回成功。旧混淆数据不自动迁移，新sourceSnapshot拒绝接管旧identity。固定bundle007 manifest963f1b2dfe8fe0ebc78ecf51b49c7f70b580980142ef0a6d9a51ed9cff5bb094；原Validator001 FAIL与反例保持。请分别核对这几个中立接点、独立版回归及固定bundle包含，不根据文件名或供应base推断已发布。

历史009新增F-MF-03不可变快照保护和供应永久测试：非空发布目录缺索引拒绝重建，wx排他创建拒绝覆盖旧版/孤儿。当时bundle009 manifest8c02d15f8a1b7d5a3961edfd176016c34a4001e2ca55c82ba17edd8e25e48db6；007描述为历史纠错，原002 FAIL与被覆盖反例保留。

历史010：登记与快照集合双向校验，空/非空部分索引、孤儿或缺快照均拒绝，不自动修复。固定bundle010 manifestf0dc1e53c2d54b1480c4573fe09cbb6645c9b6e94e8acc1db25176d113eb4524。独立003 FAIL及跨体系原始反例保留；完整候选004待独立复验。

历史011：修复合法既有回执兼容，receipts目录内SAP仍须登记；原UI不变。固定manifest4aac5ee84761d59b4788324dea517f01dbe9b958993329375510dbc39c40cc5c；完整技术候选已获原生005与用户指定Astra/high CLI002限定离线技术PASS；本次CLI角色证据闭合，整体仍有真实模型/许可/独立版标准缺口；004 FAIL及回执反例保留。

历史014固定manifest9fe3e551516c6abd56f48c5d437ecda658d8ddd24a651e8ca83675400140bab2。prompt v1.0.1补足现有scenario字段类型说明；旧原UI四文件不变。真实MiMo前两次分别payload与parse失败，不能以离线PASS推定质量。新宿主装配和固定供应增量尚待fresh独立接受；未经Git发布及MacBook采用。

历史015 manifest860e91153cdf1f8ba03b8f6bfde5e6bed9463b642eb96412180bc8c64e50e1ae。F-MF-05：SPA采纳原绕过applyDraft导致空增量抹除既有指标；现在共用既有合并核心，保留未提及资产且拒绝冲突。永久回归spa-assist.test.ts、因果RED/GREEN和真实提案离线复验均保留。方法/场景修改不扩大为覆盖语义，原UI不变。宿主19项/供应318项/9SKIP，新候选未fresh独立接受。真实累计4任务4请求全部结算，原2输出失败保留。

续授后的宿主扩额回归20PASS/0SKIP，供应015/UI均未改变。真实累计6任务6请求：第五战略0指标、2备选、假设全部待验证的草稿成功；第六在途取消本地结束但Provider消费UNKNOWN，16384预留保持。原经营方法绑定质量不足与parse失败仍保留，未正式接受；不要在原仓试跑或清理未知账本。

历史017 manifest7827206c27bd779d8d55c0abb8de7a6e80e8d7a46195e5298e1954bd069d976f。F-MF-06仅首次空历史初始化、缺失/损坏历史拒绝；F-MF-07现有方法绑定保存422纠错，实例引用与方法模板定义分离、歧义拒绝、四UI文件不变。offline-business003复制合成战略稿经原UI复核发布1.0.0并宿主读回、正常关闭重开；经营稿解除错误占位后缺费用角色仍422阻断，未交付。真实6/6与UNKNOWN/16384预留保持；用户限定终止两个live006进程已完成。native006 FAIL原件保留，当前CLI003一次Astra/high强制只读复核待完成；未正式接受、未回流、未安装。

当前018 manifestc384fe7f3d88890826f580bb85be349fb1938071d719fa9610818bbbf6e2a0c3。CLI003强制只读FAIL三项已修：F-MF-08审计单独缺失/运行中消失拒绝重建；F-MF-09角色由精确方法定义建立，未绑定角色可重绑，提交透传kind/methodRef/roleId防同名歧义；F-MF-10 DTO就绪计算使用真实方法库。供应323PASS/9SKIP、宿主实际包21PASS；offline-business004人工合成完整方法设计经原UI清空/重绑/复核/发布/保存/重开成功。此不替代实际经营AI稿的质量结果；6任务/6请求、UNKNOWN和16384预留不变。新候选独立审查尚未执行，一次CLI例外已消费；未正式接受、未回流、未安装。

2026-10-19 当前更新（取代上文待审停止点）：用户接受F-MF-10历史RED证据偏差并恢复，按PR107普通原生独立只读行为规则复核。offline-business005针对实际AI经营稿完成修正、审核、复核、1.0.0发布、宿主保存和重开；SAP17552字节/SHA1aae8e2090baa182885d1b267f21b018a2c02f822542bb088c047f8c6a08f2d5。四个隐藏场景文本通过现有写门脚本修正，不能说整段修正全由UI完成。此轮无产品代码/UI改动，无新Provider；原6/6、UNKNOWN、失败和RED缺口保留。host014/source017/bundle018待原生完整复核；原仓回流、MacBook采用、Git、app安装、正式产品接受仍未执行。

当前原生Validator007已完成PASS（报告SHAceef708ca24725664123b9fca4e1e9b12d8cabd59fa8f5f77fa6c89ca4bbb77f），Engineering Controller接受host014/source017/bundle018本机浏览器工程候选；Q-MF-01在人工修正设计范围闭合。实际后端模型/effort读回UNKNOWN保留，按PR107不另建OS只读门。用户正式产品接受、Git回流/required CI、MacBook采用及app安装仍待；此说明不授权原仓修改或运行。
