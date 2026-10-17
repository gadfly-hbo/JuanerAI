# 026本地续验结果：HTML保存下载成功，样式验收FAIL后停止

2026-10-16 · Mini · **STOPPED_ON_FIRST_ERROR / HTML_VISUAL_FAIL**。用户明确批准“批准026，仅本地续验、Provider0”。本轮已执行唯一一次本地服务与一次HTML保存/下载；没有执行PDF或其余原生查看，不自动续用未执行动作。原023、019及全部历史FAIL/UNKNOWN/未知预留不回填。

## 固定输入、权限与实际动作

沿[批准范围026](local-export-authorization-026.md)，保留原`work/mac-mini/report-studio-integration`、HEAD `1446276011917ec46b369eadaed40c059db46b34`及WIP；Mini-led规则提交`b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`、原方案/UI/readiness004继续适用。仅原`proj_e27f124c`、v1两页/深蓝经典/原Task/会话与017安装，manifest `a58986f2a07eea1c2eb290b1bcdfb0b13b713e4668da2f722cb5c1d95c226c01`、22714资源及签名启动前核验通过，没有换包或更新安装。

先核对全部114普通文件/3链接，并保留完整起点副本、批准原稿及hash。沿原证据根新目录：

`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/local-export-026/`

临时本地组合不创建Pi transport、不读取凭据：在原policy.begin之前禁止main/image，在SDK工具执行前拒绝；仅原项目preview与显式单次HTML/PDF导出许可可进入原policy。导出按原policy成功/物理结束/usage_known及sdk_run_id=null配对后核对project.updated_at，其他语义字段及全部冻结文件仍须相同；不是伪造已通过的模型状态。已有真实MiMo和PPTX证明直接复用，不重新发消息、确认、渲染或look。

原SessionHost只作为闲置历史读取器；关闭本次自有闲置reader调用其close，不向SDK发abort/control，以免新增activeMs。发现busy则拒绝并保留未知，不假装物理结束。此临时组合仅在证据目录，不进入产品/供应源码或安装；原自由制作能力、正常产品生命周期与认证守卫不变。4项本地控制检查通过（未获许可/越项目/模型/工具拒绝、两格式顺序与未知停止、时间/语义保护、闲置/忙碌关闭）；另在独立合成副本用实际安装SessionHost读取历史并正常close，预算原始字节不变。这些不是完整Change独立验证。

## 实际结果

| 项目 | 结果与边界 |
| --- | --- |
| 一次服务 | 原安装模块回环`127.0.0.1:49848`、PID43323；原生Chrome地址栏bootstrap进入原项目。未发制作请求。 |
| HTML保存 | 正常成果UI“下载HTML”仅点击一次，生成`exp_002`。原policy新export succeeded/physical_settled/usage_known均成立、sdk_run_id=null，project仅正常updated_at变化；025对应元数据兼容问题在此路径未复发。 |
| HTML下载 | 仅该记录“下载”一次，Chrome显示完成；3083字节，SHA `5af77b122cac7a5cb2b55ccb6494ce052daf3ee71daf819fa09eda6b2d097a9b`，记录/原工件/Downloads副本/证据副本逐字相同。 |
| HTML原生查看 | **FAIL**。Chrome只读打开证据副本，文字和两页section存在，但原页面CSS丢失，数值卡布局与深蓝样式消失，成为普通纵向文本，不能通过版面验收。截图`html-native-failure.png`。 |
| PPTX复用 | 沿023已成功下载的80759字节PPTX，SHA `0f6d5763fdeb47c3df8b63a4f37884cf42fe7c6ec2f87553c69f26b19c00954e`，只复制到本轮证据；未新增导出/下载，未进行本轮Keynote查看。 |
| PDF/其余查看 | 首错停止，PDF保存下载0，Keynote/Preview未启动本轮文件。不得将HTML共用路径问题推定为已实测PDF失败，也不得将其记PASS。 |
| 正常收尾 | 自有服务正常ownerLost/idle reader close，进程exit0，PID43323不存在、端口49848拒连；两个本次Chrome标签正常关闭，用户原标签保留，无强杀/新系统权限。服务结束后UI的“运行状态暂不可读”是断开后的显示，不作为停止证明；进程/端口另行核实。 |

## 只读原因核对（没有实施修复）

原页面`page_01.html`与`page_02.html`的样式在head/style。固定供应`src/agent/export-deck.ts`的`buildDeckHtml`将每页交给`extractBody`，只留下body，再追加少量合集分页规则；head中的.canvas/.card/.title等CSS没有带入。实际安装`dist/agent/export-deck.js`也走该路径，导出3083字节正文及Chrome显示相互印证。源码和安装代码的只读副本/hash记录于`readonly-cause-026.json`。

这是本次HTML样式丢失的已确认原因，不是MiMo调用错误或project元数据守卫误报。没有修改代码、样式、生成页或安装，没有为本轮强行补CSS。PDF调用buildDeckHtml，存在同源风险，但本轮未生成/查看，其实际结果仍未验证。024 MacBook只读原版参照继续保留；本轮未读写/重跑MacBook，不能宣称MacBook实际导出也已失败或独立版全部功能有问题。

## 用量和保全

- 新Provider调用0，SDK模型/工具/控制调用0，凭据读取/更改0，安装/部署/Git发布0，MacBook读写0。全部五预算和SDK审计原始字节前后相同；原Task配置/limits、会话与执行记录亦不变。
- 累计仍15模型/20工具、输入20162、已知输出11983＋未知预留16384（SDK合计outputTokens28367不等于实际消费）、resourceUnits37、activeMs225909；active=false。旧019 stopped但消费UNKNOWN、01016384及A2048等原失败/未知/预留保持，不核对旧operation、不退款或清账。
- 原117项中仅policy库和本项目project.json变化；只新增exp_002.html/.json，结束为116普通文件/3链接，未删除。project全部非时间语义字段不变；材料/框架/四页文件/deck.mjs/PPTX/配置/所有旧导出字节不变。
- policy数据库integrity_check通过，mode_history1、grant_history6不变；旧21 operations与45 events逐行保留，仅新增本地export1及events2，没有新UNKNOWN。before/after完整数据副本独立读回并有清单。
- 启动前清单解析器先把symlink当文件读取，EISDIR，服务尚未启动；错误日志/原脚本保留，修正为比较链接目标后preflight通过。技能invalid_metadata警告原样保存，没有把它改写为技能正文读取失败或新的Provider异常。本轮原始stdout/stderr逐行保存；仅一次性bootstrap URL在持久日志中明确省略，不记录API密钥或工具参数原文。

## 当前停止点和下一动作

026唯一续验已执行并因HTML视觉失败停止；不自动追加PDF、原生查看或新一轮保存下载。后续应先在离线合成副本修复HTML合集保留每页样式及作用域的问题，补正常CSS/两页不同样式/无外部资源及PDF共用路径回归；不能通过强制模型改用行内CSS或限制自由制作规避导出器缺陷。**本轮未实施该修复，也未封装、安装或重新验收**；新候选/安装和本地真实续验权限按下一具体范围处理，Provider仍0。

原025离线40项证据继续有效，原023 FAIL不回填；完整正式Validator、required CI、工程/产品接受及OpenSpec归档尚未完成。许可/私有SDK再分发、干净机、MacBook限定用户接受及缺编辑文件、物理中断、较大图、主备及完整质量等未验证继续保留。C5-09仍IN_PROGRESS，六＋二全图和40ID正式接受增量0，见[能力全图](../../../../docs/planning/capability-coverage/latest.md)。
