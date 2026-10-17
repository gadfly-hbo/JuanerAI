# 工具执行观察接缝017

用户批准有界离线修复、封装及Mini试用安装；禁止Provider、部署、Git发布及MacBook写入。复用已批准方案/UI/readiness004、原分支/HEAD和证据根；016反例及未消费真实场景保留，不向新候选转移实际调用权限。

## RS-TOOL-OBS-01 / 验收

- AC-OBS-01：仅可信创建装配可注入可选观察器，软化后的原执行器在交给固定SDK前包装。before在效果前、after在原结果/异常产生后完成；提供当前原AbortController的停止函数。观察器抛错或请求停止后不得执行同批后续工具。
- AC-OBS-02：原参数、调用上下文、返回/异常、工具名称/schema、SDK授权/计量/审计链不改。观察器只在内存接触结果，不自动记录参数、密钥或内容；不提供HTTP/模型配置入口。
- AC-OBS-03：未注入时不包装，保留自由制作、软失败自纠及现有授权。观察器是受信本机机制，不声称是企业隔离边界或产品永久预算。
- AC-OBS-04：实际固定SDK离线反例验证read软失败→同批write停止，另验before拒绝、Bash非零、异常/取消、成功及默认自由行为、不可变配置/同账恢复。新旧未知预留不退款或重建任务。
- AC-OBS-05：固定新源码/构建/manifest，保留012安装及真实数据，更新原Mini试用入口；实际安装包离线复验。Provider0、原真实账本/未知记录及数据逐字/hash不变。

## 私有设计与范围

允许：tools/report-studio/prepare-source.mjs、supplier-tool-observer.test.mjs、supplier-hosts.test.mjs（证据保存修正）；adapters/report-studio/supplier/agent-pi/{builtin-hosts,tool-observer}.ts；相应Change记录/项目板/能力证据。隔离供应源由固定原始源码和配方再生。tool-observer只位于供应Pi Adapter，函数不进入SDK配置序列化、原业务协议或持久层。after接收成功结果或原异常；观察器失败停止并抛出，原执行异常优先保留。调用方自行判定软失败；默认产品不新增失败停线。

条件：仅已有工具链/锁定依赖/浏览器离线编译封装，Mini试用目录原入口更新并保留旧包。禁止：SDK/Harness/公共业务合同/工具声明/权限守卫/旧账本或配置迁移、凭据操作、额外依赖安装/升级、真实Provider、MacBook、部署/Git。

## 验证计划

先在旧实际SDK+供应Host上运行新增AC-OBS-01因果RED，再最小实现GREEN。运行全部供应套件、type/build及映射根测试；安装后用随包Node/SDK/Chromium重跑供应、宿主主链及离线导出smoke。仅此接缝通过不代表016的32/96/30分钟/逐页质量临时控制全部验证，也不代表真实制作完成。完整候选最终独立Validator、required CI、工程/产品接受和归档仍待后续。

证据继续位于原工程根tool-execution-observer-017；历史FAIL/UNKNOWN/未验证均保留。实际结果待完成后追加。

## 实际结果 · 2026-10-16（增量040）

本有界离线接缝及Mini更新完成，非完整Change接受。分支work/mac-mini/report-studio-integration / HEAD1446276011917ec46b369eadaed40c059db46b34不变；沿用已采用规则b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d及有效方案/UI/readiness004，不重跑有效审查。

### 实现与证据

- 在软化后的工具交给createSessionRuntime之前注入before/after；异常仍向原SDK传播，停止使用原Host控制器，效果经过原SDK授权/计量/审计。builtin-hosts创建装配按项目注入，不通过HTTP、用户模型配置或提示词开关。没有注入时返回原工具集合，保留软失败自纠/自由制作。观察器不自动记录参数、结果内容或凭据。
- 原SDK+供应Host因果RED：原实现忽略创建选项，观察事件为空且同批write执行；默认自由模式对照PASS。最小接缝后同一反例GREEN。11项新增测试覆盖实际同批停止、异步before拒绝/停止、after抛错、Bash非零、SDK原权限及schema拒绝、声明/配置不变与同账重开、未知预留不清、默认自纠、真实builtin创建装配、原输入/返回/异常身份、等待before时取消。
- 固定供应10套件115/115 PASS、0FAIL/0SKIP；映射根源19/19 PASS；根及供应typecheck、供应服务/web构建通过。prepare-source幂等及未知/半补丁拒绝覆盖保留。未改SDK/Harness、锁、模型用途、工具声明、公共业务协议、守卫或旧账本。
- 测试证据保存发现同一负例建立两夹具导致目录EEXIST，修正为每夹具独立目录后发现符号链接校验未覆盖；增加逐链接目标读回，普通文件仍逐字/hash比较。两次114PASS/1FAIL及原目录保留，未降低产品断言；新测试和全部既有104项最终通过。两个未完成临时证据根复制至retained-failed-fixtures并独立读回，原临时目录也未删除。项目板一次不支持的running枚举在写入前拒绝，改为合法active；原拒绝记录保留。

### 固定候选与Mini更新

89份工程源/测试固定aggregate `081702a2773db3f733be2afedb78a8a1e42be864b8606048e97269357de586cc`，相较原87份仅5个明确文件变更（含2新增），源码副本及freeze独立读回。供应源仍74ebb609fd73cf263614ffc9301dafaafcec4230；模块0.1.0-juanerai.1/协议1，新manifest **a58986f2a07eea1c2eb290b1bcdfb0b13b713e4668da2f722cb5c1d95c226c01**、22714资源。

SDK0.4.1 / Pi0.86.1，pi-adapter.js SHA193a457e960d0596ff40df70d2b4de7b8ade980580db1e72c255ebaff0dd3248；SKILL9688字节/SHA b62a10aeaa8cc58090f63d27c2b5ae04538d95c966eb958c2ce273989cf9ef39及供应锁不变。相较012，资源只新增builtin-tool-observer.js/.d.ts、改变builtin-hosts及session-host的.js/.d.ts，未删除资源。

使用原锁定依赖、Node26、Chromium1243和本地Electron zip离线Forge封装，没有安装/升级依赖、下载或执行Keychain helper。新候选/暂存/安装完整资源和codesign --verify --deep --strict通过；签名仍为本地ad-hoc，不是Developer ID、公证或正式发布。app.asar保持4f68b63fd58b374ea29c8c35e3481f895bade64379c498f4bf9b1a9af3526a8b。

已更新 `/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app`；原012完整保留 `/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil-native012-preserved-20261016-017.app`，更早008保留项未动。安装前确认该试用应用无进程；原独立数据103文件完整复制/逐字/hash读回。没有触及MacBook。

### 实际安装离线复验

用安装内Node/固定SDK/Chromium运行同一10供应套件115/115 PASS（包括11项接缝测试）、正常宿主HTTP与浏览器主链2/2 PASS。合成离线服务启动/owner准入/正常关闭和PPTX/HTML/PDF/PNG输出smoke通过，源deck不变。输出证明范围为离线合成，不替代真实MiMo制作、质量等价、PPTX实际逐页渲染或新原生编辑。Electron壳本轮未启动，复用相同asar的既有限定证据，不冒充新原生验收；Keynote/干净机/MacBook未复验。

最终再次读回22714安装资源、89工程源和全部103真实数据文件；五个真实预算及所有策略/owner数据字节不变。proj_e27f124c仍4模型/4工具/4375入/587出/预留0，v1框架未确认，无新制作/截图/导出；旧2048/01016384及UNKNOWN未核销。自有安装/测试进程为空，宿主/模块离线服务均已正常关闭；无Provider调用、真实凭据访问、部署、Git发布或MacBook写入。

### 边界与接续

本轮修复了016暴露的创建时执行观察缺口；**原016原型和失败记录不改写为PASS**。016的32/96/30分钟及逐页/模型看图/导出范围控制全套仍待用新接缝重新装配并完成独立的离线核对，本轮未将旧原型投入真实使用。原016批准及场景未开始事实保留，但不能自动转移到新安装身份；用户当前明确禁止Provider，后续真实范围须先列明新候选及控制证据、另行确认。

原B/008 INVALID_TOOL FAIL/具体分支UNKNOWN、010被拦工具UNKNOWN、013历史403/工具暂停、014DOM超时、015启动/读回失败、metadata告警、签名/ENOSPC及全部既有失败原样保留。许可/私有SDK再分发、较大图片、真实主备、实际物理中断、完整质量/原生编辑、干净机、MacBook缺证据限定接受仍不提升。完整最终候选独立Validator、required CI、工程/产品接受、归档和Git交付尚未完成；C5-09仍IN_PROGRESS、正式接受能力增量0。

下一允许动作：在当前已批准工程范围内继续离线准备新候选的临时验收控制/授权衔接；不得调用Provider、部署或Git发布。本文及原证据是Mini本地持久保存，尚未Git集成，不是跨机备份。原证据根tool-execution-observer-017中保留authorization、RED/GREEN、三次供应回归、freeze/源码副本、封装安装、实际安装复验、真实数据备份与final-readback；所有文件独立读回结果见evidence-manifest-017.json。
