# 结果023：021唯一MiMo续作及022定向核对

2026-10-16 · **整套场景FAIL，已按首错停止并正常收尾。** 两页修正、当前新图进入MiMo和正常逐页结论已取得；PPTX保存下载完成后，临时控制因正常项目更新时间变化而停止。HTML/PDF及原生格式查看未执行，不追认完整场景PASS，不追加场景。

## 授权和固定输入

用户先批准“021全部范围，先离线通过并冻结，再实测一次”，再批准“022，继续原021唯一验收”。复用已批准方案/UI/readiness004、原默认24项及拟议022下12项、严格停止负例1项；021原严格核对activeMs+15ms正例FAIL不回填。

Mini分支`work/mac-mini/report-studio-integration`、HEAD`1446276011917ec46b369eadaed40c059db46b34`、原WIP不变。沿用规则提交`b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`的Mini全程牵头、直接用户决定、原Gate/权限和主Agent持续持有规则；MacBook不是审批节点。

安装仍017候选：manifest`a58986f2a07eea1c2eb290b1bcdfb0b13b713e4668da2f722cb5c1d95c226c01`，22714资源、SDK0.4.1/Pi0.86.1、供应源74ebb609…；原89工程源及固定临时控制未改。冻结组合SHA`d997cf8f3158a31183e0b5793c7e58d88aae36800148d2e88aaf0e4a0640cf06`，实际022回执独立保存；冻结时“待批准”字段为历史快照。

只在Mini原`proj_e27f124c`、原Task和原native会话、已确认v1两页/深蓝经典续作一次，固定指令通过正常对话界面发送一次。仅MiMo原保存凭据路径，不恢复MiniMax，不新增项目、框架确认或main。没有安装、写MacBook、部署或Git提交/推送/PR/合并。

## 实际执行

| 项目 | 结果 |
| --- | --- |
| 019一次正常UI核对 | unknown→stopped，physical_settled=true、usage_known=false、原cancelled保留。activeMs175037→175050（+13ms），其余六项用量、旧16384、Task配置/limits/policy不变；核对阶段Provider0。 |
| 新main | 4次MiMo派发、6次SDK工具：edit×2、render_deck×1、qa_deck×1、look_page×2；正常成功/物理结束/本次用量已知。未进入第二周期，未用Bash、模型导出或其他工具。 |
| 修改 | 仅page_01.mjs的headline声明补冒号、page_02.mjs的headline声明改为已确认完整标题；可见内容/四个页文件中的两个HTML、deck.mjs、材料和框架不变。原019 edit具体意图仍UNKNOWN。 |
| 当前检查 | 显式QA及PPTX保存时8项检查均pass，2页/31文本框。两页新look工具结果关联通过冻结控制进入实际MiMo请求，正常最终回复给出内容、遮挡/溢出、对齐、可读性逐页结论且不要求再修正。 |
| 图片证据 | 仍为agent-html近似图。仅修改注释，JPEG可与019相同；本次新render/look执行、冻结守卫对新工具结果的关联/出现次数检查及原生会话新增图记录共同证明，不能仅凭同hash认定。原生图记录每页出现次数2→4（含存储重复表示，不等于4次look）。不冒充Keynote实际PPTX截图。 |
| PPTX UI保存/下载 | 原正常成果界面保存一次`exp_001`，随后“下载”链接下载一次；80759字节，记录/产物/下载/持久副本SHA均`0f6d5763fdeb47c3df8b63a4f37884cf42fe7c6ec2f87553c69f26b19c00954e`。可解包2页，可见文字/100、120、135/声明/来源/适用边界保留。 |
| 首错 | 配对导出结束时`revision_artifact_changed`，临时控制local_exports未确认、finished=false。真实PPTX保存和下载已发生，不回滚、不抹除，也不能将控制失败写成通过。 |
| 未继续 | HTML/PDF保存下载均0；Keynote/Chrome/Preview三格式原生查看未执行；无第二main/补测/新增派发。 |

新增main已记录输入3261/输出1235、resourceUnits11、activeMs50859；022核对另+13ms。累计15模型/20工具/输入20162/已知输出11983、resourceUnits37、activeMs225909，未知输出预留仍16384，累计outputTokens28367包含预留，**不是全部实际输出或金额**。本次新增预留0，本次main与本次export均succeeded/physical_settled=true/usage_known=true；旧019消费仍UNKNOWN。实际Provider账单未核对。

## 停止后的只读定位

对最后受检版本所有冻结文件逐个重算hash：两页mjs/html、deck.pptx、deck.mjs、材料、outline及模型计划均与受检版本一致，**唯一变化为project.json.updated_at**：`2026-10-16T06:00:07.822Z`→`2026-10-16T08:55:10.192Z`。

固定供应代码`WorkspaceStore.saveExport`本来在保存记录后调用`touch`，后者仅更新`updated_at`。临时修正控制却将整个project.json纳入冻结，导出后的`revision.forExport()`因此拒绝。确定的是临时控制与正常保存元数据的兼容缺口；不据此归因于MiMo、产物变化或INVALID_TOOL。离线同Task/UI三格式夹具只冻结deck.mjs/outline/materials，未包含真实启动组合的project.json整文件条件；37项旧PASS的具体覆盖仍成立，但未覆盖此组合。

本次只读定位与证据保存，不修控制、不删project.json冻结项、不放宽认证或范围、不回填断言、不重开场景。下一允许动作仅为记录/审核；后续可另行授权有界离线修复，精确保留项目语义字段、只容纳正常导出的updated_at并补充真实启动锁集合回归。新增Provider调用仍需另行明确范围。

## 收尾和证据保全

本次自有服务正常`close`，进程exit0；PID4824不存在、127.0.0.1:64298拒绝连接（connect_ex=61），临时Chrome标签关闭，原用户空白标签保留，无强杀。当前114普通文件/117项完整复制、字节/hash及3个符号链接目标独立读回；其他四预算及其他项目/配置/许可不变，原预算配置/limits/policy不变。

policy旧行除019的state/updated_at及其一致hash外全部保留；旧operation_events逐行保留，正常核对事件、新main与export仅正常追加。原native/audit/exec历史字节为当前文件前缀。原019证据树、2117项冻结离线证据、89原工程源、22714安装资源及严格签名核验通过。

Mini唯一证据位置：`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/mimo-correction-021/live-021-after-022/`。主要文件：授权原稿/回执/冻结组合；before-real-021与after-real-021及清单；reconciled-before-main-021.json、completed-main-before-export-021.json、session-state-021.json；final-model-text-021.txt、两张JPEG、image-delivery-evidence-021.json；downloads/mimo-021.pptx及download-pptx-021.json；ui-pptx-before-close-021.png；readonly-stop-diagnosis-021.json；preserve-and-verify-021.py/.log及preservation-result-021.json。最终证据清单另读回，不含凭据或新诊断参数/调用ID原文；原生SDK记录按原合同保留。

辅助观察失败也保留：旧Chrome扩展句柄不可用，后用已验证原生Chrome入口；两次只读journal提取器假设顶层为对象，遇SDK压缩数组行报AttributeError，改为递归嵌套只读提取后取得完整正常最终回复及图像；没有因此重发Provider或产品工具。既有skill invalid_metadata警告仍在，不静默删除。控制回执为会话输出的摘录，不声称另存了完整原始PTY字节流；原生业务/SDK日志完整随数据副本保存。

保留021原15ms严格失败、019失败/edit意图UNKNOWN、A2048/01016384/01916384及所有前序失败/UNKNOWN/未知预留；许可/私有SDK再分发、干净机、MacBook限定接受及缺编辑文件、真实物理中断、较大图、主备、完整质量、最终独立Validator/required CI/工程和产品接受/归档均不提升。C5-09仍IN_PROGRESS，正式已接受能力增量0；方案/UI/readiness不重跑。[全40ID图](../../../../docs/planning/capability-coverage/latest.md)保持原状态。

当前仅Mini本地保存，未Git集成或跨机备份。021唯一真实场景已使用，剩余次数/时间不能授权新场景。
