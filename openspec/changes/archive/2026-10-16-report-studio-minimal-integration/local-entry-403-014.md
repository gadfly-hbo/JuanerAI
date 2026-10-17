# 014：本地入口403离线定位与诊断进入方式修正

2026-10-16，Mini原任务/分支 `work/mac-mini/report-studio-integration`，HEAD `1446276011917ec46b369eadaed40c059db46b34`。采用规则提交 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d` 的 Mini-led Plugin Integration；Mini单作者，复用已批准方案、UI和readiness004。本轮按用户要求仅离线/本机loopback，禁止Provider、部署、Git发布及MacBook写入。

## 结论与适用范围

**已修正本轮诊断的进入方式；没有修改或放宽应用认证守卫。** 原安装守卫和完整安装服务均复现：工具直接导航到本地根页面时，请求带 `Sec-Fetch-Site: cross-site`，应用返回403；从原生Chrome新标签页地址栏进入同一URL时带 `none`，应用返回200。完整服务随后用原一次性bootstrap建立会话成功，项目列表200；原生普通刷新后根页面和项目列表仍200，实际界面正常。

浏览器工具观察问题另列：403页和200页的只读 `Page.getFrameTree` 本轮都可用，故原始CDP暂停不是本轮403发生的必要条件。正常200页面刷新后，DOM快照的 `Runtime.evaluate` 又出现3000ms超时，但原生AX/截图和应用端请求仍正常。**不宣称浏览器工具通道已修复。** 013没有留下请求分类，不能倒填其历史请求一定为cross-site；013具体准入分支和“暂停文档响应”的内部原因仍UNKNOWN，新DOM观察超时原因也UNKNOWN。

固定安装仍为012：模块0.1.0-juanerai.1/协议1/源74ebb609，manifest `75884cb93ccebedd66468c7f08a99c79ede84cf550639407d204f541e66b94b8`。原安装守卫编译文件4373字节/SHA `2b7ca36745adfad47c5335a0920f058fd13d50879087cb264e14e1f467711efd`。87源码仍为011 aggregate `e37b8ae1150fb6aef3ba813bb90be746b7a662390e0d1d04041a6b99883720a4`；本轮没有生产代码、SDK、锁、安装或UI变更。

## 因果对照与保留的失败

先按三种假设区分：应用是否真正拒绝请求；是否为工具暂停造成的假403；是否需更改应用认证。证据均从应用侧只读观察取得，未覆写浏览器请求或响应。

| 层次/动作 | 应用端分类与结果 | 工具/界面结果 |
| --- | --- | --- |
| 原安装守卫最小夹具，工具直接导航 | 根GET、loopback和Host正确、无Origin/重复关键头，fetch-site=cross-site →403 | 真实拒绝；只读FrameTree可用 |
| 同夹具、同URL、原生新标签地址栏输入 | 其他准入条件相同，fetch-site=none →200 | 正常页面；FrameTree可用 |
| 完整安装模块、隔离空数据，工具直接导航 | 请求1：根403/cross-site | 可见JSON拒绝；FrameTree可用 |
| 同完整模块，原生新标签地址栏打开有效bootstrap | 请求4：根200/none；请求7：session200/exact Origin/same-origin；请求12：projects200 | Report Studio真实页面；仅查看、未配置模型、尚无项目 |
| 已建立会话后原生重新加载 | 请求14：根200/same-origin；请求21：projects200 | AX/截图正常；浏览器DOM读取超时另存，不当应用403 |

完整服务还记录了other分类请求403/404；路径没有保留，不能推断其具体资源或将整页所有资源均记为成功。响应的 `response_type=other` 只表示Node响应接口未暴露可识别的Content-Type，不能据此断言实际MIME类型。原生正常页面、会话及项目API成功支持本轮入口结论，不提升成完整功能验收。

原浏览器4绑定不可用、重绑已确认可用的Chrome5，以及刷新后DOM超时均保留。没有把旧失败抹成PASS，也没有重试模型或用后台chat API替代UI。

## 后续诊断进入步骤（已在隔离实例验证）

1. 核对固定候选及本次自有实例；继续保留owner独占、精确Host、IPv4 loopback、Origin、fetch-site、重复关键头、路径、JSON、会话和单次bootstrap等原检查。不要接受cross-site、手工注入会话cookie或移除认证。
2. 由原owner桥签发短时、一次性bootstrap。不要把令牌写入诊断证据；过期则按原机制处理，不重放已使用令牌。
3. 通过原生Chrome“新标签页”按钮建立新标签，在可访问性树确认的地址栏使用 `setValue` 写入完整URL，再按Return。本轮这一完整步骤成功；旧013的地址导航尝试不追认为成功。
4. 核对根页面200、正常bootstrap/session及界面后，从新鲜标签清单按准确URL/ID绑定已有标签，供后续观察。不要再通过工具 `goto`/新建导航代替本次原生入口，也不要借工具暂停操作浏览器拦截器或调试恢复。
5. 若工具DOM/CDP观察失败，保留失败并使用原生AX/截图判断可见状态；应用准入和工具状态分别记录。需要真实模型时仍先遵守当时有效的用户权限和停止线。

这是诊断操作说明，不是产品新限制；不改变Report Studio日常自由制作能力，不要求普通用户手工配置请求头。

## 离线边界、验证与收尾

持久证据唯一根继续Mini的 `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/`，本轮子目录 `local-entry-403-014/`。最小夹具直接导入原安装guard；完整夹具直接使用安装内 `startBuiltinStudio`，数据根仅该子目录的 `isolated-studio-data`。凭据read/save/remove和模型Host入口均替换为失败关闭的诊断依赖；没有实例化真实SDK模型transport。Node fetch仅容许本实例loopback控制请求。该接缝仅用于诊断，未写入产品包。

Node26现有RS-LOCAL-01四项集成测试4/4通过，保留Host/Origin/重复头/路径、会话/owner、单次/过期/关闭及写请求负例；另一个真实HTTP的只读observer一致性测试1/1通过。真正的RED/GREEN是浏览器进入方式的403→200对照，**不虚构原guard存在待实现缺陷**。没有因为应用准入正确而增加一份镜像实现测试。有效的011/012供应104项、宿主2项和多格式smoke仅按原未变输入范围复用，本轮不称重新运行全部canonical、CI或最终Validator。

主要证据：`entry-guard-probe.mjs`、`request-classifications.jsonl`、两张guard对照图、`cdp-path-contrast.json`；`full-studio-probe.mjs`、`full-app-request-classifications.jsonl`、`full-app-state.json`、两个full-app-cdp分类；`full-app-native-admitted.ax.txt`、`full-app-native-200.png`、`browser-observation-failures.json`；`guard-baseline-001.log`、`http-observer.test.mjs`、`http-observer-001.log`及独立读回记录。分类不保存秘密、令牌、cookie值、参数正文、调用ID或原始回复。

两夹具正常close、退出码0；PID9809/端口56443和PID14155/端口56746均核对结束，仅本轮自有四个测试标签关闭，原用户空白标签保留。凭据调用0、模型调用0、Provider派发0；真实数据90文件和四个预算逐字/hash不变，旧2048/16384未知预留未核销，旧UNKNOWN记录不修改。诊断源/输入/结果留在持久证据中，不因其为探针而删除。

## 013及下一停止线

[013批准与原实际结果](mimo-diagnosis-authorization-013.md)保留：批准事实有效、唯一真实场景尚未开始/未消耗。本轮未把离线服务启动算成该场景，也不把入口成功自动转为重开真实诊断的许可；用户最新明确“暂不调用Provider”继续优先。本轮停于该实际权限边界，下一步可审核本记录；只有用户明确恢复真实诊断后才按仍适用的013固定对象/数据/工具/数量/消费/未知即停范围继续，发生范围变化则重新列明差异。

原008具体INVALID_TOOL分支、010被拦工具名、013历史准入分支/工具暂停、新DOM超时仍UNKNOWN。所有历史FAIL、未知预留、NOT_PROVEN、MacBook限定接受/缺编辑文件、较大图限制、真实完整制作与主备、物理中断、许可、干净机、完整质量等价、完整候选独立Validator、required CI、工程/产品接受及归档缺口继续保留。C5-09仍IN_PROGRESS，正式已接受能力增量0；没有部署、Git发布或跨机备份。
