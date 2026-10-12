# v1.3 产品／可点击附件检查记录

2026-10-09 · MacBook，仅本轮产品准备；不是生产实现、用户接受或工程验证。

## 1. 已完成的检查与修正

- 主作者完整核对本轮 A–E 决定、原 OA／OA-RT／D1–D5、FM 与 RS 批准语义，明确保留／强化／替代。最新用户 SDK 单独派发决定已写入，不另组织升级或消息 Mini。
- JS `node --check`通过；原样式／保留 PX-004 及五时刻／沙盘参考、本地资源引用存在。正式文档本地引用及来源身份另对最终候选读回。
- 独立于可点击作者的主会话运行离线合成状态检查：首轮 **22/22 PASS**，9个本地HTML引用存在。覆盖自动父子／孙任务、回流消费、只整理、歧义／权限、UNKNOWN不绕过、IR参数与结果绑定、用户协作、停根／停子、显式恢复、部分失败、不代签人审及版本历史。该检查只执行审核件的内存模型，不验证真实 Agent、Provider、持久化或浏览器。
- 作者另提供针对性检查；不以作者自评替代本轮独立规划就绪审查，也不把作者断言数量计作产品能力。
- 最终候选独立模型检查 **25/25 PASS**，JS SHA `c445582f9f87cf3286b103a38ff381805b5c6882cc1fe1c1ccbd1d952638a69a`；增补目标采纳no-op、无在途直接停止、不再派发范围已排除分支。语法检查通过；候选18项来源／附件身份读回无漂移。历史首轮输出仍按其旧JS身份保留。
- 上条是Review001候选的历史检查，并未覆盖“缺权限／歧义→停止→恢复”。[Review001](reviews/development-readiness-001.md)对此发现B1并给出NEEDS_CLARIFICATION；候选JS现仅修此类状态接缝，产品／UI合同／流程正文不变。修正后主会话组合检查 **29/29 PASS**，JS SHA `217986276cb9578de672b3f3fe6cdfe8dc61afc2132209805b598abbb46526f0`；追加缺权限、歧义和只整理的停止恢复、权限组合负例。恢复先读回独立阻断及首次执行意图，不生成新许可。结果文件名为 `review001-negative-probes-result.json`，记录的是本次修正后探针通过，不冒称其为修正前失败输出。Review001失败事实和旧身份始终保留，新的18项身份交fresh Review002。
- 首轮人工检查发现并修正：停止／待对账仍创建待调度任务、把已停子任务写成已返回消费、参数更新但成果回链旧 IR、显式恢复缺失分支、人审未算结果及业务目标差异未同步。修正只在新增合成审核件中，不改旧合同／生产代码，保留首轮实际结果和各自身份。

## 2. 浏览器与真实运行的限制

尝试用内置浏览器打开本地 `file://` 审核件，工具以 URL 安全政策拒绝。**浏览器实际渲染／点击、截图、桌面及390px响应式、键盘和焦点实测均为 NOT_RUN**。没有换浏览器、开启HTTP服务、raw CDP或间接绕过。用户可以直接打开本地HTML自行审核；静态CSS和状态检查不冒充实测。

Provider、真实业务资料、凭据、生产工具／服务、安装、业务回归、OpenSpec、required CI、Git提交／推送／合并及Mini派发：本轮 **NOT_RUN／NOT_SENT**。SDK工作副本只用于只读事实核对，不执行或发布，不证明Mini采用。

## 3. 可重现输入与证据根

沿用既有005证据根，设备为MacBook：

`/Users/huangbo/.codex/worktrees/e1d5/JuanerAI/.xanthil/publication-evidence/change005-five-moments-20261006/v13/`

其中 `ui-state-check.mjs` 是审核件离线模型的检查源，`ui-state-check-first-result.json`保留实际首轮完整输出，`ui-state-check-candidate-result.json`为最终候选完整输出。运行方式：

```sh
node .xanthil/publication-evidence/change005-five-moments-20261006/v13/ui-state-check.mjs
node --check docs/planning/2026-10-09/change005-v1.3-autonomous-analysis/clickable/autonomy.js
```

旧结果按其 SHA 和时点解释，不覆盖成新版本通过。[source-identities](source-identities.json)记录正式来源及可点击候选字节；后续必要修正另生成候选与结果。本机原始证据不是Mini默认可读副本；正式验收语义、身份与检查结论在本产品包中自包含，不要求工程从外部仓库救缺口。

Review001旧JS以精确逆补丁恢复到 `readiness-001-autonomy.js`，30591字节；独立读回SHA严格匹配 `c445582f9f87cf3286b103a38ff381805b5c6882cc1fe1c1ccbd1d952638a69a`，不是猜测历史文本。`review001-historical-failure-result.json`重新执行该旧候选，保留权限／歧义／只整理经停止恢复误进入review并创建子任务的失败事实。当前JS和18项固定身份未变，没有拿旧失败源码替换现 UI。

准备收尾：含审查记录的全包43个本地文档引用无缺失，9个HTML资源存在；10项有固定Git对象的历史来源逐字节匹配。最终18项身份无漂移，新增文本／源文件无行尾空白；已跟踪文件diff仍为空，仅保留本轮未提交材料。没有Git发布或accepted specs／业务代码改动。

## 4. 审查与用户接受

新鲜只读产品就绪审查的固定输入、结论和限制记录在 reviews；历史 NEEDS_CLARIFICATION 不改成 PASS。新产品就绪与新增UI用户接受分开，旧UI未变部分沿用，当前完整候选未冻结或工程接收。后续仅在真实用户指令下处理冻结、Git发布、规则最小适用说明和交接。

[Review002](reviews/development-readiness-002.md)已完成：18/18身份匹配、独立13/13组内存探针及JS语法通过，**PASS仅产品计划开发就绪**。Review001的B1、旧候选身份和此前检查仍保留；未将浏览器NOT_RUN、用户UI待接受、SDK实际接收或生产状态改为通过。状态与原决定映射的追加只记录本次结果，不修改受审产品／UI／流程正文和最终点击附件。

## 5. 2026-10-10 批准后冻结／发布检查（追加）

用户完整接受及发布／用户手转启动授权见[批准及冻结](approval-and-freeze.md)。新发布分支为 `work/macbook/change005-v13-autonomous-analysis`，起点 `a762d26d32e034694cb52c08497cf2d5486dcb3e`、tree `732188e6361e35fc2250978a454a4111eef2003b`；创建前已核对它与原工作树已跟踪内容完全相同，全部未提交准备材料保留。未切换／覆盖Mini现场，也未把旧准备HEAD当最终发布身份。

新鲜只读产品支持 `/root/v13_publication_consistency`（按现行路由请求 gpt-6-astra／medium）完成**冻结／发布一致性 PASS，阻断项无**；不是重复产品方向审批或工程Validator。检查本包完整产品／UI／流程／点击三件、来源及历史审查、追加批准／接收指令、README绑定和适用治理，另核对正式引用历史附件及D2原文；没有外读SDK／Research、网络／Mini／Provider／服务操作或文件写入。

其独立核对七项冻结附件及18项来源完全匹配；来源清单自身仍5876字节、SHA `2a465e99718ee7c89436a250adfc40541ac361abe77b8bb71cc58f21bc5dfa1d`。追加批准记录6681字节／SHA `8c675c36bb7135c32904e043e07b5dae80e0286131948cd658baacba887aca0e`，接收指令7834字节／SHA `df5e6eeffc4b584d89cbbeaf9a4c618258dc358f4210df1bebee5731e1d910bd`。确认旧标签由新批准承接，旧失败不改，协作前向差异不扩大D2／人审／权限；SDK独立转交、UI严格沿用、因果RED／GREEN及三类接受、requiredCI和状态分责均保留。9个HTML资源和README新增引用存在。该独立结果仅支持本次产品发布一致性，不是生产验证。

持久根中 `publication-check.mjs prepublication-001` 产生251项静态／身份／引用／语法／合成检查PASS，17个拟发布文件，无秘密形态字面量、行尾空白或Git进行中操作；其中审核件模型仍29/29通过。数字仅是检查记录，不表示产品能力／业务验收。完整stdout／stderr／退出和候选指纹另存唯一标签，不覆盖旧结果。发布前对最终签入范围再次核对；GitHub按可信基线的现行分类器选择CI，含HTML／JS／JSON按full路径，不为本次发布修改分类器或减少CI。

本地未运行生产回归、浏览器、Provider、真实业务资料、SDK安装／迁移或Mini工程。本轮不修改业务代码、OpenSpec／accepted specs、工程看板、治理政策或蓝图固定正文；只在规划入口追加批准绑定，实际commit／PR／CI／同步读回随发布回执与可转发prompt保存。Mini消息不发送，采用／intake仍NOT_CONFIRMED。用户批准与上述新增记录不把本文件旧NOT_RUN／NOT_SENT改成历史已执行。
