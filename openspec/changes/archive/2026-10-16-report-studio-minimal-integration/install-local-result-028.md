# 028实际结果：Mini安装更新通过，本地续验部分完成后按停止线结束

2026-10-16 · 用户直接批准“批准A+B”。执行原[028授权稿](install-local-authorization-028.md)；**A PASS，B STOPPED_NEW_NATIVE_TOOL_ERROR / PARTIAL**。没有新增Provider、真实SDK模型/工具/控制调用、MacBook写入、部署或Git发布。原方案/UI/readiness004继续复用，自由制作能力不变。

## 身份与范围

Mini原任务`report-studio-minimal-integration`，分支`work/mac-mini/report-studio-integration`，HEAD `1446276011917ec46b369eadaed40c059db46b34`及原WIP保持。本轮没有生产源码变更。继续采用PR88固定规则提交`b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`的Mini-led分工；不新增MacBook审批或重复有效审查。

原固定027候选更新到`/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app`，模块manifest `8fe218b18626112394bf977acc21f9d3d3b8bf0bd64ca1d4be33347a3e70651c`，22714资源；整应用25591项与清单`0a170d7e08f6b7218ea5187bb1d741b57fd2d0c728e6349145f537e4388a872a`逐项相同，签名验证通过。ad-hoc签名不代表公证、正式发布或许可结论。

## A：实际更新和保全 PASS

在无本次应用进程、数据无打开句柄且原数据/旧UNKNOWN核对后，独立复制旧应用与完整数据，核对普通文件inode不同、bytes/hash及符号链接字面值一致；固定候选先在相邻路径验证后正常替换，旧原件另外完整保留。替换前后未启动桌面宿主，原116普通文件/3链接逐字不变，未迁移或回滚用户数据。

所有本轮证据沿原设备根：
`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/html-export-repair-027/local-continuation-028/`（下称N）。

- `N/installed-before-028/Xanthil.app`：旧应用独立备份。
- `N/replaced-original/Xanthil.app`：替换时保留的旧应用原件。
- `N/before-data/`：完整原数据独立备份，最终再次读回不变。
- `installation-result-028.json`、`install-steps-028.jsonl`、原始`install-028.log`及两次安装签名日志；最终`final-codesign-028.log`。
- `authorized-028.json`保留用户原文及范围解释，`approved-scope-028-original.md`保存执行前授权稿；不以事后结果改写批准对象。

## B：保存下载与HTML显示通过，原生查看未完成

只启动一次自有回环模块服务`127.0.0.1:53827`/PID62114；启动固定组合不创建Pi传输或读取凭据，拒绝新增模型/图片/SDK工具调用，仅原项目`proj_e27f124c`的正常UI本地导出获准。不是完整桌面宿主重新验收。

| 项目 | 实际结果 |
| --- | --- |
| HTML保存/对应记录下载 | 各一次，`exp_003`，8989字节，SHA `40ad047f603d38a038cc148abc7d0c2627f7bee27f2cc11993c4f693463e17b8`；记录/原工件/下载/副本一致 |
| HTML实际Chrome查看 | 两页均查看并保存原生截图；第一页100/120/135三卡、第二页深蓝/红色边界两卡独立生效，标题/来源/非业务事实声明及边界总结可读 |
| PDF保存/对应记录下载 | 各一次，`exp_004`，324729字节，SHA `52d63a0b617770599c3efab7ec579232029af44bf6a98c15c3263c2946cf2be1`；记录/原工件/下载/副本一致 |
| PPTX | 复用已有80759字节有效下载副本，SHA `0f6d5763fdeb47c3df8b63a4f37884cf42fe7c6ec2f87553c69f26b19c00954e`；没有新保存/下载 |
| Preview实际PDF查看 | **NOT_VERIFIED**：取得Preview应用接口时超时，在发送文件打开命令/路径之前停止；不据此判定PDF文件损坏 |
| Keynote两页/原生文字对象 | **NOT_VERIFIED**：因前述首个新工具错误未继续；未打开PPTX、未编辑或保存.key/iCloud |
| PDF中文精确搜索 | 027部首码点差异继续**UNKNOWN**；本轮未新增文本层/搜索验证，不用HTML或027离线PDF证据替代本次原生PDF查看 |

副本在`N/copies/mimo-028.html`、`mimo-028.pdf`、`mimo-028.pptx`。下载接收文件为`/Users/bendandebaba/Downloads/report-exp_003.html`和`report-exp_004.pdf`。保存下载回执`export-html.json`、`export-pdf.json`、`download-html-028.json`、`download-pdf-028.json`已逐字读回。

`html-native-page1.png`、`html-native-page2.png`为实际Chrome截图；`exports-native-028.png`展示四条导出记录、累计15模型/20工具及旧16384未知预留。HTML AX只保存报告内容，不保存其他用户页面。Preview接口错误`Computer Use server error -10005: timeoutReached`如实保存在`native-view-stop-028.json`；不重试、不换工具绕过，不触发额外权限。

## 计量、旧失败和正常退出

- 新增Provider与真实SDK模型/工具/控制调用均0，所有五预算、SDK会话/审计/配置/输入/页源码/旧导出字节不变；累计15模型/20工具/输入20162/已知输出11983+未知预留16384、resourceUnits37、activeMs225909保持。SDK聚合outputTokens28367包含预留，不作为真实消费确认。
- 原policy模式1条/许可历史6条保持，全部旧22操作/47事件逐行保留，只增加2条成功本地export与4事件，最终24/51。两次新增操作均`succeeded/physical_settled=true/usage_known=true/sdk_run_id=null`。仅正常project.updated_at与原policy库改变；新增四个exp003/004文件，删除0。最终120普通文件/3链接。
- 原019已核对stopped仍usage_known=false；原010未知操作、A2048及010/019各16384未知预留完整保留，不核对、清账、退款或修改配置。全部008/010/013/016/019/021/023/026失败、UNKNOWN和未验证继续保留。
- 服务在取得Preview接口前已正常`close`，`service-exit.json`exit0；最终PID62114不存在、53827拒连。两个自有Chrome标签已正常关闭，原用户新标签页保留。未给Preview输入文件路径，Keynote未操作，不向用户原有应用/文档发送退出或关闭命令，不强杀。
- 安装前只读提取器曾误读SQLite字段、最终证据比较器曾误用HTML回执字段，分别保留`preflight-parser-failure-001.json`及`verify-final-parser-failure-002.json`/失败脚本；纠正只读解析后完成读回，不重发场景。原skill metadata警告保留。提取失败文件为工具输出摘录，不冒充完整原始stderr流。
- `verify-final-028.py`最终核对通过，结论`final-verification-028.json`；`after-data-manifest-028.json`为最终完整数据清单。临时启动组合及冻结hash未改，实际安装整应用/签名及两个旧应用副本最终逐项核对。

## 当前停止点与下一动作

028唯一服务/保存下载已用；不再启动第二服务或重复导出。当前只提交可审核的实际结果。下一最小建议是**仅对已有两份合成副本补做Preview/Keynote原生查看（服务0、安装0、Provider0、不重复导出）**；须用户明确允许越过本轮“首新错停止”后才执行，原失败不撤销。

C5-09仍IN_PROGRESS，正式接受增量0。许可/私有SDK再分发、公证/干净机、MacBook限定用户接受及缺编辑文件、物理中断、较大图/主备、完整质量、最终独立Validator/required CI/工程接受/所需产品接受/归档未完成；完整Change尚未冻结，不派最终Validator或用作者检查代替。无Git提交/推送/PR/合并/发布；本地WIP不是已保存到Git的正式交付。全能力状态见[全40ID图](../../../../docs/planning/capability-coverage/latest.md)。


## 029后续完成记录（保留本页028历史结论）

用户随后要求“继续完成”，已在不重启服务/制作/导出、Provider0条件下完成已有PDF/PPTX副本的Preview/Keynote两页查看和原生文字对象选择；原文件/原数据不变并正常关闭。PPTX第二页标题末字单独换行作为质量局限保留，PDF精确中文搜索UNKNOWN不提升。[029实际结果](native-view-result-029.md)为后续证据，本页028的工具超时/PARTIAL不追改。
