# 015：按013固定范围恢复的唯一MiMo真实诊断结果

2026-10-16，Mini原任务，`work/mac-mini/report-studio-integration` / HEAD `1446276011917ec46b369eadaed40c059db46b34`。用户明确要求按已批准013继续一次真实诊断，使用014修正入口，保留失败、UNKNOWN和全部未测，失败或新UNKNOWN即停、不追加场景、不部署/Git。采用规则提交仍 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`，Mini直接牵头，原方案/UI/readiness004复用。

**结论：PASS_BOUNDED_FRAMEWORK_DIAGNOSIS。** 013原来未开始的唯一场景本次已执行并用完：仅MiMo，1次UI发送，4次模型派发、read×3/propose_outline×1，约24.760秒后正常完成两页待确认框架。固定随包技能完整读取成功，未确认制作、读图、渲染或导出，没有追加场景；不是整个Report Studio Change完成或完整两页制作PASS。

## 固定对象、入口和权限

- [013原授权及历史失败](mimo-diagnosis-authorization-013.md)和[014入口修正](local-entry-403-014.md)继续有效。本轮明确恢复013，覆盖此前“暂不调用Provider”的临时停止；只恢复其原固定一次范围，不恢复其他真实场景或变更SDK/安装权限。
- 安装仍为012固定模块0.1.0-juanerai.1/协议1/源74ebb609，manifest `75884cb93ccebedd66468c7f08a99c79ede84cf550639407d204f541e66b94b8`；全部22712资源、codesign、固定SDK和仅MiMo配置元数据预检通过。87源逐项未变，011 aggregate仍 `e37b8ae1150fb6aef3ba813bb90be746b7a662390e0d1d04041a6b99883720a4`。
- 013已修正的原诊断脚本、预检、gate和固定SDK分支探针逐字复制至原证据根的新子目录；没有更改执行逻辑、安装、SDK、锁、工具目录或原任务配置。此前013/014证据不覆盖。
- 原 `startBuiltinStudio` 组合入口沿原数据根/owner独占/认证启动，仅本次新项目可进入Host，五个旧项目均拒绝。凭据只沿原配置→native helper→SDK内存路径使用，没有读取/显示/导出密钥或修改配置。
- 原生Chrome新标签地址栏setValue/Return打开有效一次性bootstrap，正常进入真实安装模块，再按准确URL/ID绑定标签111104418。没有403、header/cookie覆盖、后台chat API代发或认证修改。
- 仅新建 `proj_e27f124c`“Mini MiMo 合成框架诊断013”；上传315字节固定材料SHA `7634b9bd68440dda3a5631f8172847de261eb8c738ce6f06ff841b3fc83a4c92`，UI固定提示SHA `e34fd6cba0a3a6419bc3672cbfaa0aca2d0a571c7e0087f4c00b1a0b1ba8436d`。接收方仅 `xiaomi-token-plan-cn/mimo-v2.6-flash` / `https://token-plan-cn.xiaomimimo.com/v1`，只授文字与该材料许可，截图/Bash关闭。
- gate每次仍核对模型/端点/协议及输出上限16384，总上限6实际派发/10分钟/read+propose_outline，原HTTP retry和SDK校验不变。不把剩余2次派发或时间余量用作新场景。

## 实际结果和计量

| 项目 | 本次结果 |
| --- | --- |
| 唯一UI发送 | 1；未插话、重发或确认“按此框架生成” |
| 实际模型派发 | 4，全部通过仅MiMo固定gate |
| 工具 | read×3、propose_outline×1，四个原生toolResult均isError=false |
| 固定技能 | 一次read返回全文9688字节，与安装SKILL逐字一致；SHA `b62a10aeaa8cc58090f63d27c2b5ae04538d95c966eb958c2ce273989cf9ef39` |
| 其余读取 | 仅当前项目材料元数据及合成提取文；原生read-log与三个成功结果一致 |
| 框架 | outline v1/current两页/confirmed=false；第一页100/120/135、合成非业务事实与材料来源；第二页适用边界，不外推原因/利润/增长/业务行动 |
| 问题/停止端点 | 模型询问默认配色并等待用户确认；按013终点停止，未回复或生成 |
| SDK拒绝探针 | duplicate_call_id/undeclared_tool_name/arguments_schema均未命中；gate无范围停止或异常 |
| 权威账本 | 4模型/4工具/resourceUnits8；输入4375、已结算输出587、reservedOutputTokens0，activeMs24760 |
| 业务操作 | `4045556a-c97b-4011-b917-8c6bd6032e2a` succeeded/physical_settled=true/usage_known=true；SDK run `84227ad5-4e94-4258-a9ed-c6aa8d16230e` |

运行起止2026-10-16T06:00:49.410Z～06:01:14.192Z（北京时间14:00:49～14:01:14）。没有新增未知预留；token不是美元账单，Provider账单金额仍未核实。固定技能实际成功读取且随后提出框架支持本次接入修复的限定真实结论，不能证明模型对所有技能规则或所有报告的质量遵循。

未生成deck.json，无导出文件。项目初始化存在空exports目录，未将空目录误记为真实导出，也不删除现场。用户未确认两页制作，不能用本次框架代替真实两页制作/截图/导出验证。

## 保留的本轮失败及未知

1. 首次启动命令误加 `--import tsx`，Node报ERR_MODULE_NOT_FOUND并退出1，诊断脚本尚未执行/服务和场景未开始/Provider0。原stderr和launcher-failure-001.json保留；去掉多余加载参数，以现有获准Node26原生TS支持执行**逐字相同脚本**，没有安装依赖、模型重试或新增场景。
2. 结算后的两次本地JSONL检查错误假设原生记录总为字典，出现list.get错误；实际记录包含数组及重复视图。按类型遍历、以内部toolCallId去重后四个工具结果一致，ID/参数原文不另存。两个检查失败单独保留，没有修改原生数据或降低成功断言。
3. 首次无导出检查错误断言exports目录不存在，失败源保留为verify-result-015-v001.py。独立确认没有deck且空目录零输出文件后，按真实验收条件检查无导出产物，通过；不改产品、产物或模型结果。三次本地检查失败均非Provider重试。
4. 安装技能的 `invalid_metadata` 原告警仍保留；本次实际SDK读取固定正文成功，不静默修元数据或将告警当原008根因。

原008 INVALID_TOOL的具体分支仍UNKNOWN；本次未复现不等于补出旧坏回复或证明所有路径修好。010被拦工具名、013历史403分支/浏览器暂停、014 DOM超时原因、所有原失败/NOT_PROVEN/未测均不追认关闭。

## 历史保护、证据与收尾

唯一持久证据根继续Mini `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/`，本轮 `mimo-diagnosis-015/` 是013继续执行的证据序号，不是第二诊断场景。`resume-authority-015.json`、原授权及逐字脚本、全部失败/告警、许可AX、result-015.ax.txt/.png、settled-state-before-close-015.json、closed状态、result-015.json、verify-result-015.py及实际读回日志均保留。

新项目13文件在settled-project-015/完整复制并逐字/hash独立读回，有manifest；原生合成会话按原机制保存，不额外落密钥、参数原文、调用ID、未知名称、原始HTTP回复或内部思考。验证阶段仅输出封闭分类/完整技能匹配与固定计量，未检查inspector frames/scopes。

执行前90原数据文件已独立备份；执行后四个旧预算和86个旧项目文件字节/hash均不变。全局仅 `.juanerai-policy.sqlite` 因新增本次许可/成功操作而变化；只读比较四表确认原1条mode、4条grant、17条operation和35条event全部不变，只新增当前新项目1条grant、当前操作1条operation/2条event。旧010 UNKNOWN `95e9ead3…` 逐字段不变，physical_settled=true/usage_known=false，旧2048/16384未核销或退款。

空闲后正常service.close，退出码0；PID44896消失、端口57293无监听，固定分支/HEAD/源码/安装不变，只关闭本次自建标签，用户原空白标签保留。未写MacBook、未配置其他Provider、未升级SDK或安装依赖、未部署/Git。证据仅Mini持久保存，不是Git集成或跨设备备份。

## 当前边界与下一动作

013唯一真实诊断场景**已消耗并正常结束**，其授权不再提供追加请求或新场景；当前只记录/审核本次限定结果。后续完整两页制作、真实页面截图/图片、主备或新诊断若要继续，需用户另定具体外发/工具/次数范围，不自动复用余量。

两页实际制作/新报告Keynote编辑、真实物理中断、较大图限制、主备、许可、干净机、完整三格式质量等价、MacBook限定接受/缺编辑文件，以及完整候选独立Validator、required CI、工程/产品接受和归档等仍保留。复用011/012未变输入范围的离线证据，本轮没有新增全量canonical/CI或最终Validator声明。C5-09仍IN_PROGRESS，正式已接受能力增量0；[全40ID图](../../../docs/planning/capability-coverage/latest.md)不变。
