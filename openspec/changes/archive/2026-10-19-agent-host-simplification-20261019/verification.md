# Git交付：当前限定接受与返回点

2026-10-19用户另行明确授权候选003按规范完成Git交付。工程主Agent据此记录
[限定工程接受](ENGINEERING-ACCEPTANCE.md)，归档本次离线工程并维护
[当前行为基线](../../../specs/agent-host-simplification/spec.md)。旧两线保持停止。
真实Provider、真实业务数据、发布／生产切换仍未授权；用户产品接受与真实Q均不代签。

交付行为／测试／SDK／依赖字节仍为独立PASS的固定003；1175个行为文件摘要
`56ff310856a3c3cb10d312f07664f566522bb8180c7cc70001dd9e26dc0f2c89`。
本轮仅增加授权／接受／归档／能力记录和project-control；不将这些作者记录称作新增独立复核。
完整003的原始独立结论、5091 PASS／8 SKIP及历史001／002 FAIL、累计消耗、UNKNOWN不变。
实际原件和代码身份在设备持久证据根下`git-delivery-001/`单独读回。

本提交时Git交付检查待执行；最终实际PR head、CI、squash、双端main身份及任何同步限制，
以设备证据根`git-delivery-001/FINAL-GIT-DELIVERY-RECEIPT.json`与GitHub PR实际记录为准。
这些外置结果避免把本提交内尚未发生的检查和合并写成成功，也不需要自引用提交。

以下为已完成离线接收时的历史原文，所有未授权措辞按当时生效，不覆盖本次明确Git授权。

# 当前结果与证据

状态：本次授权的完整离线候选003与独立证据已收口。Canonical083为5091 PASS／0 FAIL／8保留SKIP；独立只读Validator离线PASS，三项发现关闭。001／002历史FAIL及全部原件保留。正式工程／产品完成未签，真实权限／Git／正式归档／发布和生产未开启。
本轮实际 `gpt-6.1-sol / max`，用户明确授权 effort 例外；同一 Mini 主上下文唯一作者。
当前 worktree `/Users/bendandebaba/.codex/worktrees/agent-host-simplification/JuanerAI`，
分支 `work/mac-mini/agent-host-simplification`，基线 HEAD
`41e6c1f167cea578960a2d0c75e86e5f31a9190e` / tree
`adfee55bfd25b24f4cff06b5589aab0db9e470ed`。HEAD仍为基线，未提交。

设备本机持久证据根：
`/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001`。
下列证据路径均相对此根。材料根是其相邻
`verified-materials-8262153b4b77/MINI-AGENT-HOST-SIMPLIFICATION-START-v0.1-20261019`。
完整八类决定、入口／资源与测试资产说明见 design.md；AH-01～10及C1～C6见 spec.md。

## 当前收口结论

工程主Agent接收本次授权的完整离线候选与独立证据；这是启动Prompt规定的安全终点。
完整独立报告见[independent-validation-003.md](independent-validation-003.md)，外置结果收据为
证据根`VALIDATOR-003-RESULT.json`。实际CLI角色全文／Astra/max／read-only／never均经
原生日志回读，`agent_role=null`未伪称原生角色；原生sandbox不符记录和用户CLI授权均保留。

固定归档`JuanerAI-agent-host-simplification-offline-candidate-003.tar.gz`为59684852 bytes，SHA256
`3310e3d306e3a82c581b0188c9a34c396d76a42a8c284a8b7ffccead9623d854`；
MANIFEST为594569 bytes，SHA256 `9a27190ec1bc4da618bc40b47029553e0fd40007c31b126afefee8211cd51b7a`。
完整2351源码文件和2567个安全归档文件逐一bytes／SHA／mode读回一致，源清单SHA
`3bbc7f550d844945595b1dc2bc2c225e98af3807db7d7c668b6e0b6c372f7d8b`。
固定发行时的PENDING标签不覆盖独立报告；原归档／收据不改写，外置离线交付收据及收口后
仅文档变化说明见证据根`OFFLINE-DELIVERY-003.json`、`post-review-bookkeeping091.json`。

八类均已有实际消费方、复用／改薄／保留或兼容去向，见design.md；独立结论覆盖C1～C6、
三核心、全部受影响入口、长成果／同版消费者及生命周期，必要改动没有退回旧两线。
LA09只是其中一条真实产品装配合成链。F-STORE-01、F-RECOVERY-01、F-RECOVERY-02全部关闭；
003首次原生恢复摘要获准，后续第二次额外请求仍not-sent，绝对期限／撤权／取消／迟到／
UNKNOWN及错误父关系的17项独立相邻检查通过。原Outcome不改，被动重开无模型调用。

完整Canonical083与SDK、程序／89 DTO、Store证据见本文件末尾当前作者验证和原始证据。
8项SKIP仍为3项云归档／成员证明、1项真实Pi验收及4项安装文档／OCR reader；打包Electron／
安装GUI、跨设备真实体验、真实Provider／业务数据、真实Q质量、用户Product Acceptance、
托管CI、Git提交／推送／PR／合并、正式OpenSpec归档、发布和生产切换均未运行／未授权。
H结构保证不代签Q；R仍Q_FAIL。旧119、repair-2、A/B、QS04、Desktop／Supplier义务不变。

独立非阻断建议中，两条薄文档来源元数据已按不可变003清单在外置
`source-assessment/fixed-candidate003-provenance090.json`精确补正，原084及冻结包保持原样；
它们不是最终文档的逐字节身份权威。另保留内部摘要反例强化为后续既有测试维护项；
当前实际守卫已独立拒绝更强反例，此项不阻断本离线候选，也没有引入新Gate。

累计消耗见`consumption090.json`：唯一工程session各计一次，CLI三次审查及preflight不重加；
缓存输入、其它输入、输出和其中推理输出分列。费用UNKNOWN；主上下文截至采样仍活跃，
不是最后回复后的全程结算，不支持成本下降声明。旧376／33组UNKNOWN及repair-2范围另列保留。
完整六加二／40ID快照见[全图](../../../../docs/planning/capability-coverage/snapshots/agent-host-simplification-offline-2026-10-19.md)，状态与接受增量0。

当前下一步：本次离线请求已交付，检查进程已收集结束；没有后台待收集审查。
后续真实质量／业务试用、用户产品接受、Git交付／正式归档或发布，须用户另行指定和授权。
本机可读源码与证据尚未Git集成，不等于跨设备备份。以下阶段记录为历史，以本段为当前结论。

## 固定输入和安装

`INTAKE.json`核实外置收据、主归档和独立解包：10625506 bytes，SHA256
`8262153b4b77c3912740f6b3388c8c1141677cd6ab73516ec8639d9459d8385d`，
975安全条目／737文件（含MANIFEST）；736载荷精确文件集合及bytes/SHA全相等。
内外启动Prompt一致；两旧原包及各自清单、固定SDK原包条目安全通过。
收据的MacBook路径只作来源定位，没有连接其他设备或原session。

仅新树执行 `npm ci --offline --ignore-scripts --no-audit --no-fund`，716包；
`sdk-final044.json`再次独立核对原tgz175327 bytes／SHA
`5b98a720a6bc1981662ef5254328bf15d6a79984ed7b0dcb0b673c65c31088fd`，
安装57文件逐一bytes/SHA相等，非SDK锁条目不变。
实际解析入口 `node_modules/pi-agent-runtime/dist/index.js` 为52177 bytes，SHA
`f3f615329eeb0715cd42445f5885de70258f6a3c39374fc51e23f30a9cb9f664`。
`dependency-resolution-final044.json`记录实际 Pi／SDK／codec 入口身份。
`toolchain-deployment-final044.json`及`trusted-toolchain.json`绑定原已存在受信工具链：
Node26.0.0、npm11.12.1、Python3.14.4、DuckDB1.5.2；没有升级其他依赖或修改SDK。

## 因果、机制与回归

| 证据 | 效力 |
|---|---|
| `la09-red001.log` | 原119 LA09三例先在原完整程序／200k／4096下CONTEXT_LIMIT；保留原失败。 |
| `la09-schema-green002.log`、`native-python004/005.log`、`native-python006.log` | schema同合同复用先通过旧载体；原生文件首轮仍失败；发现合同去重后9个正负用例通过。这些是因果历史，不拼成最终完整PASS。 |
| `control-loop-red034.log`／`control-loop-green035.log` | 删除正常完成后的宿主模型补跑；原覆盖和缺依赖反例保留，Application128项通过。 |
| `canonical032.log`、`canonical042.log`、`canonical047.log` | 集中回归失败均保留：032发现main R1～R4兼容缺口，042发现GB／retained用途关联，047仅LA43并发SQLite元数据锁冲突。各轮行为源码前后hash一致；不宣称通过。 |
| `affected041.log` | R1长字段／R3当前recipe／UNKNOWN／实际步骤和委派读取23项通过；失败断言没有降级。 |
| `long045.log` | 90项长成果与自然全文审查通过，包括原生报告文件、原LA09、32页原子审查、全部同版消费者、工作期限／恢复、H/Q/R反例。 |
| `r4-host046.log` | 14项普通R4路由／实际回执、显式恢复及macOS原生监督器通过；仅启用合成host gate，不启用real-model gate。 |
| `sqlite-red052.log`／`sqlite-long-green053.log` | 新增确定性独占锁争用反例；只前移现有1000ms busy设置，保留恢复槽与UNKNOWN断言。053结果见原日志。 |
| `canonical054.log` | 默认portable全组PASS：5063通过／26保留SKIP，行为源码前后相等；仍是补验前的历史候选。 |
| `host-browser056.log`／`exploration-green057.log` | 现成Mac Python／Chrome合成补验发现3项大图当前读映射缺口；恢复main已有成功保存映射，全部原图、陈旧／越界反例保持。 |
| `canonical058.log`／`canonical058-result.json`／`canonical058-summary.json` | 最终同一源码完整portable回归PASS：5089项，5081通过、0失败、8保留SKIP；19组全部exit0，包括语法、类型、现行全部离线套件、适用Python／Chrome、插件UI构建检查。运行362.356s，real-model gate关闭。 |
| `native-host059.log`／`native-host059-result.json` | 最终相同源码再确认原生监督器两项，结果存原始记录；不与Canonical相加冒充新全量。 |

Canonical：`JUANERAI_TOOLCHAIN_BIN=<固定bin> JUANERAI_TEST_EVIDENCE_DIR=<本轮已建目录> tools/harness/validation/run --portable`。
每轮完整命令／cwd／exit／时长存对应result.json。Canonical总入口主动移除
`XANTHIL_REAL_PI_ACCEPTANCE`；未启用真实模型。独立Provider响应、凭据及业务资料为
纯合成；实际Browsercodec用拦截的合成SSE并拒绝未声明出站IO，实际执行与保存不mock。

最终LA09见 `la09-final059.json` 和 `canonical058-data/ah-la09-http-*/RESULT.json`。
独立只读提取本轮新合成运行库为 `la09-readback059/`：正常探索49、独立核验7、saved；
两负例failed且无Outcome，三例完整payload SHA与原完整程序一致，越界canary未变。
最终none为33414 bytes／33次合成物理请求；syntax33011／28、sandbox33189／28；真实Provider均0。
DTO各分量峰值：工具77085 bytes、system／Skill10559 bytes、历史／结果正常89814、syntax85158、sandbox85598 bytes，输出预留始终4096。
8项SKIP分组为validation-contracts 3、local-e2e 1和桌面集成4项安装文档／OCR reader；明细在完整log。
Portable未运行Electron二进制／打包Main／安装GUI／人工产品接受；这些不由本轮代签。
行为文件清单运行前后相等，SHA256
`f254b66c765fff957e5010f9340e4a7bceac4e5b131d748d1dc0e4094d4e6fa6`；只排除Markdown和可变project-control。
每个最终物理DTO独立保留：tools、system／Skill、messages历史／结果均按
`Buffer.byteLength(JSON.stringify(component))`记录UTF8 bytes；输出预留记录原DTO字段。
这与R1上下文tokens准入口径不同，不能把字节或合成usage冒充真实Provider token消费。
完整程序原生成表达式、64KiB上限、200k窗口、4096预留不改；正常探索49、独立核验7、
保存、HTTP／重启被动读回；syntax／sandbox真实抵达监督器并拒绝越界效果。

## 来源、保全和未授权范围

`source-assessment/adopted-increments-001.json`保留最初37项有来源迁入记录，
必要交叠按现行main R1～R4／Task1.4／PR90/91／插件兼容修正；不是整枝合入119。
最终逐文件归属见 `source-assessment/final-provenance060.json`；原37项记录不改写为最终状态。
固定候选将由 `fixed-candidate-001/MANIFEST.json`／`CANDIDATE-001-RECEIPT.json` 绑定全部源码、原输入、依赖／实际入口和原始证据。独立验证只评这份固定候选。

`retention-final044.json`再次核对原聊天树仍clean，原Change007树HEAD／tree及405条WIP
精确状态SHA仍与接收一致。主归档重新hash相等。未打开旧运行DB、原业务XLSX或重试旧任务。
旧119仍 `AUTHOR_OFFLINE119_FAIL_RETURN_INTERFACE_ASSESSMENT`；原下一拒绝DTO仍UNKNOWN。
4 Task／376物理记录／33组token UNKNOWN／费用UNKNOWN只引用冻结收据；repair2的27次
仅该live12，整线累计仍UNKNOWN。精确live12拒绝项未保留，不声称本轮精确复现。

GB-H技术资格、Q真实语义质量与R受控共同误判分列；R仍Q_FAIL。
本轮离线机制不能认证真实Provider质量或业务成功。A/B、QS04、Desktop／Supplier义务保留。
累计40能力覆盖状态delta=0；register及本轮完整map快照只增加离线工程可见性。

真实Provider、真实业务数据／试用、真实质量与用户Product Acceptance、托管CI、Git提交／
推送／PR／合并／正式OpenSpec归档、安装发布和生产切换均NOT_RUN或未授权。
本机源码／证据可读不等于Git集成或跨设备备份；原有角色／OS／CLI豁免不继承。

NEXT_ACTION：固定完整源码／依赖／实际入口 → 独立只读Validator →
同一离线候选收口；不在局部GREEN停止，也不自动开启后续真实试用或Git工作。

## 独立候选001结果与当前修正

原生派发因实际sandbox不符而BLOCKED，未审查候选；用户随后明确授权本次CLI只读Validator，并将沙箱LLM指定为gpt-6-astra/max。CLI实际会话01a1526f-d0f3-7742-9a7b-e1f7660a365e的两轮turn_context及完整角色指令均独立回读符合read-only/never。

固定候选001归档58326951 bytes／SHA256 `7977506e0d1f45e7ef56ccaafc411b3b33b1d5f433bc3e0130a8c4b8f506dc5c`保持原样。完整独立报告见independent-validation-001.md及证据根validator-cli-001/report.md；结果身份见VALIDATOR-001-RESULT.json。该候选保持FAIL，不由作者通过覆盖。

F-STORE-01：decode遗漏原119的review_policy、review_checkpoint和review_updates校验；需在实际持久Store读写入口恢复并验证重算摘要的非法记录仍拒绝。
F-RECOVERY-01：Native实际model准入没有将正常／恢复通知传给artifactWork，Store仍用首次窗口；需在实际Browser/Profile完整组合验证跨首次窗口的合法形成、修订、逐页审查及原取消／撤权／UNKNOWN／一次恢复／300秒总期限。

当前唯一后续动作：补实际入口因果RED，修正两项接线并跑影响和完整回归，形成新固定候选。新候选的独立复核须遵守本次CLI例外的明确范围；不从候选001的FAIL推导新候选PASS。

### 两项修正的实际入口因果与进展

`correction066-red.log`中的六项Store反例，在ready/saved两态通过真实Store API被原候选接受：未知policy、错身份checkpoint、无效更新链；外层行摘要已重新计算。恢复夹具在066～068先遇到安全失败载体／模拟时钟及夹具patch问题，这些失败原样保留，不作为F-RECOVERY-01的目标RED。`correction069-red.log`改用现成network安全载体、统一Date模拟，实际Browser→Profile→Workspace→Native成功抵达恢复响应，随后形成／修订130秒及逐页审查70秒仍被提前拒绝，构成该缺陷的实际组合RED。

修正只恢复Store原有三处校验，以及Native已获准modelAttempt到既有artifactWork的正常／恢复事实通知。未改草稿格式、表／迁移、SDK、额度或重试层。`correction070-green.log`保留8通过／1失败：负例已被正确拒绝，但测试期望码漏了共享封闭命令验证的现行VALIDATION_FAILED。`correction071-green.log`保持“非法记录必须拒绝且不改写”断言，补上该现行错误码并增加14个实际持久更新链反例，9项全部通过。

新增反例覆盖重算摘要后的前序hash、同版身份、预览正文、修订正文／claims配对及额外retry；恢复正例经实际生产Browser装配与Personal Profile完成形成、合并修订和逐页审查，原Outcome保持，完整同版结果保存且重开不发模型。每例原始输入／结果及本轮新合成库在correction071-data保留。完整Canonical072已通过，独立复核尚未完成。

本轮工程LLM累计消耗按唯一session的实际累计计数保存于`consumption073.json`，区分缓存输入、其它输入、输出和其中的推理输出。CLI累计已含preflight，不重复相加；费用仍UNKNOWN。它与产品Provider物理记录、旧376／33组UNKNOWN和repair2累计范围分别保留，不宣称本轮节省成本。

### 候选002完整作者验证

`canonical072.log/result/summary.json`：19组全部exit0，5098 tests／5090 PASS／0 FAIL／8原有SKIP，363.532秒；相同受信工具链与Mac Python／Chrome合成gate，real-model gate关闭。两项FL-A11/A16、FL-A09/A10原生监督器检查已在本次完整回归中通过，不再重复计数。运行前后行为源码清单完全相等，SHA256 `a81e10ec359937108ad7899edc4ae9c16f51e48a3faabbd45dd2dcafacb22a7e`。

`la09-final074.json`与`la09-readback074/`从本轮新合成库独立读回：正常完整程序33414 bytes／33次合成物理请求、探索49／独立核验7／saved；syntax33011／28、sandbox33189／28均failed且无Outcome，canary不变。三个原完整程序SHA、64KiB／200k／4096、DTO组件峰值均保留，真实Provider均0。实际SDK／旧树保全／来源的本次读回见`*-074`记录；固定候选002身份以`CANDIDATE-002-RECEIPT.json`及其完整MANIFEST为准。

当前NEXT_ACTION：按本次CLI例外的实际范围，对候选002取得有效独立复核条件，重检两项发现及关联风险，随后收集完整独立结论并完成离线收口。作者PASS不替代独立验证；不正式归档、Git交付或开启真实质量／用户产品接受。

### 候选002独立结果与下一修正

完整报告见 independent-validation-002.md 与证据根 VALIDATOR-002-RESULT.json。实际 Astra/max、read-only/never、完整角色指令符合用户本轮必要只读复核授权。F-STORE-01及F-RECOVERY-01原始反例关闭；新增 F-RECOVERY-02：overflow-summary 使用独立逻辑ID，草稿恢复门却要求原正常逻辑ID，当前Native未取其受信任的 recovery.logicalRequestId。实际SDK内存组合为1次物理请求后AUTHORITY_REQUIRED；首次摘要应获准、第二次额外请求仍拒绝。

下一步在实际Browser/Profile装配补因果RED，按既有SDK父关系做最小接线修正，保持一次恢复、总期限、原取消/UNKNOWN和计量边界；相称回归及新固定候选后独立复核。十四条损坏记录的内部摘要强化为非阻断建议，现实现已独立验证可拒绝；不扩展为新Gate。

`correction080-red.log`仅缺少测试内部import，未抵达目标，不冒充因果RED。`correction081-red.log`在完整Browser→Profile→Workspace→Native→SDK→真实持久草稿门确认目标反例：首次合法overflow-summary发送次数1而应2。该次Adapter源码与固定002逐字节相等，绑定见correction081-red-binding.json。

作者只将恢复时传给草稿门的逻辑ID改为`.5`已有受信任recovery.logicalRequestId；原业务work授权先行，原一次额外请求／期限不变。`correction082-green.log`十项定向全部通过：实际摘要获准、后续重发not-sent且无admitted、草稿记录父ID、原Outcome未改且被动重开零调用，同时六Store反例和形成／修订／逐页130/70秒继续通过。完整Canonical083进行中，新固定候选及独立结论另列。非阻断内部摘要强化建议保留为后续测试维护项，当前强化反例已由独立复核确认拒绝。

### 候选003完整作者验证与当前下一步

`canonical083.log/result/summary.json`：19组全部exit0，5099 tests／5091 PASS／0 FAIL／8保留SKIP，373.043秒；原受信工具链与Python／Chrome合成gate，real-model gate关闭。运行前后行为源码完全相等，SHA256 `56ff310856a3c3cb10d312f07664f566522bb8180c7cc70001dd9e26dc0f2c89`。原生监督器检查已包含在本轮，未重复加算历史用例。

`la09-final084.json`及`la09-readback084/`再次从本轮新合成Store只读核对：正常33414 bytes／33次合成物理请求、探索49／独立核验7／saved；syntax33011／28、sandbox33189／28均failed、无Outcome、canary不变。原程序SHA、64KiB／200k／4096和89个完整DTO／组件峰值不变。SDK57文件／包／锁／实际解析入口见`sdk-recheck084.json`；原树HEAD/tree/status及原包身份见`retention-final084.json`，不扩大为旧WIP内容逐字节证明。最终69项来源见`source-assessment/final-provenance084.json`，原37项接收和各次失败来源保留。

本轮工程LLM截至此时的累计见`consumption084.json`：唯一session各计一次，CLI两次审查和preflight已在同一累计内；费用UNKNOWN，主上下文仍活跃，不能当作最终全程结算或成本下降证据。产品真实Provider调用仍0，与旧376／33组UNKNOWN分别保留。

当前NEXT_ACTION：封存完整候选003及精确读回 → 沿用户本轮必要只读复核授权，以同一实际Astra/max、read-only/never独立上下文检查F-RECOVERY-02及相邻风险 → 收集完整结论。独立PASS前不自签收口；真实质量／用户接受／Git交付／正式归档／发布和生产仍未开启。
