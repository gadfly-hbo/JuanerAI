# 016：离线停止控制未通过，真实制作未开始

2026-10-16，Mini原任务，分支 `work/mac-mini/report-studio-integration` / HEAD `1446276011917ec46b369eadaed40c059db46b34`。用户明确批准[016固定范围](mimo-production-authorization-016.md)，沿用015框架和深蓝经典，接受既有可信本地执行及任务消费边界；失败或UNKNOWN即停，不追加场景、不部署/Git。原方案/UI/readiness004及Mini-led规则 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d` 复用。

**实际结论：BLOCKED_BEFORE_SCENE_OFFLINE_CONTROL。** 同批工具的首次软失败停止控制未通过，不能按016可靠执行。真实Provider0、凭据访问0、应用服务启动0、UI确认生成0；一次真实制作场景未开始/未消耗，未制作、看图或导出。批准事实保留，但不自动跳过前置控制、换候选或放宽停止线。

## 已批准的前置条件及本次工作

016要求先离线验证32新增模型/96工具/30分钟、逐页看图次数和失败停止；其原文为：

> 批准后先离线准备并验证该场景的临时控制和停止逻辑，未验证前不发模型。

并限定仅用既有组合接缝，不改SDK、Harness、工具声明、任务不可变配置或产品包；若不能保留这些身份实现限制，先报告差距。016还明确未授权升级、改源码/安装、换候选或重新封装。

本轮按此只在原Mini持久证据根 `mimo-production-016/` 创建控制原型/离线测试及合成夹具，直接使用原安装内固定SDK和SessionHost，默认网络全部拒绝，模型只用内存合成transport。没有写产品源码/SDK/安装或真实项目。

原产品会将部分工具失败软化成普通返回，允许模型自纠；016这一次验收要求首次失败关闭新准入。必须验证这一较严格的验收停止行为，不能依靠模型自觉不继续。

## 因果RED和公开接缝验证

反馈命令为 `REPORT_STUDIO_BUILTIN=1 [现有Node26] --test mimo-production-016/control-sdk.test.mjs`；基线另设 `RS_CONTROL_BASELINE=1`。运行前约定的接缝写在control-contract-016.md，真实数据103文件已备份/独立读回。

| 证据 | 实际结果 |
| --- | --- |
| control-red-001.log | 原固定SDK：同一批先read不存在的合成文件，再write合成标记；读取失败后后续写入仍发生，期望ENOENT断言失败。是缺少016控制的因果RED。 |
| trial-control原型 | 使用既有makeTransport及公开defaultTools()/control()，包装原execute；保留名称/参数/描述/计量声明和原输出，尝试在软失败后调用原abort。未触碰SDK内部或修改回复。 |
| control-green-001.log | 清理时尝试恢复执行器遇只读属性错误，退出1；该清理失败遮挡后续断言，不计GREEN。原型v001/测试v001和全部夹具保留；没有解除对象只读保护。 |
| control-green-002.log | 移除不必要的已关闭实例恢复动作后，重新使用独立夹具；同一“后续写入不得发生”断言仍失败，没有降低断言。 |
| control-seam-confirmation-003.log | 加入只含封闭元数据的观察，再次保留同一失败断言。transport经过控制2次，但工具包装执行数0；原SDK完成read及write，工具声明逐字不变，失败后的合成标记文件仍存在。 |

因此通过defaultTools()修改公开返回对象的execute，**没有改变SDK实际执行的已绑定回调**。这个原型不能用于真实验收，CONTROL_NOT_VALIDATED.json明确记录false及其源码hash。

另外只读核对并在夹具中确认：公开工具完成事件没有给出该软失败标志（failed为null）；运行中通过公开history读取原生结果会出现TASK_BUSY。SDK的history接点自身会检查busy并获取会话writer，不能作为运行中同步结果检查的可靠接点。没有使用私有runtime字段、改SDK/Harness、篡改工具声明、检查inspector frames/scopes或通过定时盯文件冒充执行前保护。

这里的2次transport/2次工具均为离线合成夹具计数，**实际Provider0**。原型的32/96/30分钟、Bash非零、QA失败、逐页次数、真实同账恢复等其余控制尚未取得足够集成证据；发现关键停止缺口后不再用其他局部通过掩盖它，也不进入真实场景。

## 保留项与收尾

唯一证据根继续 `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/`，本轮子目录 `mimo-production-016/`。approved-scope-016-original.md的SHA仍 `e275e316d0be8d228fdc4f55dbab093308f4861d144f615eb7e1b5f70c114332`，用户完整批准存authorized-016.json。失败日志、各版原型/测试、全部合成夹具和control-observation.json保留，不删除成功写出的反例标记。

最终独立读回103个真实数据文件（含当前项目13文件、五个预算和策略/owner库）全部字节/hash不变；87源仍011 aggregate `e37b8ae1150fb6aef3ba813bb90be746b7a662390e0d1d04041a6b99883720a4`。015仍4模型/4工具/输入4375/输出587/预留0，v1框架未确认。旧2048/16384、010 UNKNOWN和全部原失败/未验证没有核销或改写。

离线测试进程全部结束，没有应用服务/Provider进程启动；原015服务及端口此前已正常结束。没有浏览器动作、其他设备写入、依赖安装、封装/安装更新、部署或Git发布。没有新增模型消费或预留，不把此结果记为MiMo制作FAIL或三格式PASS。

原B/008失败、008具体分支UNKNOWN、010被拦工具UNKNOWN、013历史403/工具暂停、014 DOM超时、015启动/读回失败及metadata告警保留。完整两页制作/截图/三格式、原生编辑、主备、实际物理中断、较大图、许可、干净机、MacBook限定接受、最终完整候选独立Validator/required CI/工程及产品接受/归档均不提升。C5-09仍IN_PROGRESS、正式接受能力增量0。

## 最小后续工程建议（本轮未实施或获准）

在**Report Studio供应适配器的创建组合处**，于工具软化之后、交给SDK固定执行器之前增加可选的工具执行前/后观察接缝，由宿主在创建时注入本次临时控制。原效果仍经过SDK授权、计量和审计；执行后读取原结果的ok=false/退出码等封闭状态并调用原停止，不修写原参数/回复/ID，不改工具名称/schema或旧任务配置。未提供观察器时保持产品原自由制作/软失败自纠行为。

拟影响供应源准备补丁及对应SessionHost/builtin-hosts私有装配与针对性测试；优先保持SDK及公共业务合同不变。先用本次已保存的“软read失败→同批write不得发生”用例验证，再覆盖正常路径、非零退出、异常/取消、限额/截止及同账/旧未知负例；最后固定新manifest、封装并更新Mini试用版、离线复验。实际文件和补丁设计需在获得该工程权限后基于源码闭合，不把这个建议当已完成设计或可执行保证。

这将修改016固定源码/安装身份，超出016现有限制，**当前不能实施**。下一允许动作是用户审核本缺口和决定是否授权该有界离线修复/封装安装；若获准，新候选身份及后续真实Provider范围仍需明确衔接。不能把尚未消耗的016次数自动迁移到新候选，或改成人工观察后直接调用。当前停止所有真实效果；无需重跑仍有效的产品/UI/就绪审查。
