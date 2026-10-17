# 031：本Change最终Validator的只读CLI通道例外申请

2026-10-16 · **仅待用户决定的验证通道授权，不改变产品或工程角色，不启动额外真实Provider。**

## 为什么需要

完整实现候选030已固定，离线canonical4804项、供应119项、宿主3项、临时控制40项与包内Node/浏览器渲染通过。当前原生独立`juaner_validator`正在收集全部发现，主工程不中断安全工作。

该原生Agent实际反馈：工具环境显示danger-full-access/approval never，仅有角色指令约束只读；实际模型/推理档位不能从当前接口读回。其只读观察有价值，但不能据此宣称已证明Sol/high/read-only装载。原生报告和该限制都保留，不能由作者自审代替。

[唯一执行政策 Native-first Role Execution](../../../../docs/governance/product-change-execution-policy.md#native-first-role-execution)明确要求：

> Before using it, obtain the user's explicit consent identifying the task/role, concrete reason, bounded scope and endpoint.

这是使用CLI替代工程角色的明确要求；普通开发或“推进整体完成”不自动授予此例外。本申请不把普通测试/构建命令变成审批。

## 具体申请范围

1. 仅本任务`report-studio-minimal-integration`的**独立最终Validator**允许一次连续的CLI只读评估通道；主工程仍在当前原生上下文牵头，不转交作者职责，不新增Worker/Spec/Test或其他工程角色。
2. 先收齐并确认当前原生Validator结束，再使用已有Codex CLI；不并行重复派同一角色。CLI必须实际装载并读回`gpt-6.1-sol / high / read-only`与既定Validator指令。不能装载/核实则如实停止，不切模型、不降级推理、不放宽权限、不安装CLI/插件、不修改全局或项目规则。
3. 评估对象为完整冻结030候选：原HEAD `1446276011917ec46b369eadaed40c059db46b34`、3154项WIP源码快照，清单SHA `c012b0643ee7fb9a598cb2172a8ea3a39a923ca7598f559fbc49bce79f26b522`，冻结JSON SHA `a9b6cd4904059ada2ab9ff930e5b6f8c901bab31edb0747648f041f20526c82c`，模块`8fe218b1…`、应用25591项。完整记录位于原证据根`engineering-closeout-030/candidate-freeze-030.json`。
4. 先从已批准验收/合同推导，再核对全候选、关键实际边界、正负例/测试敏感性/历史RED与证据。不读真实业务/凭据，不启动用户试用实例，不变更源码、规格、测试、账本或项目板。必要合成检查只在实际只读权限允许范围运行；不能写夹具的检查明确NOT_RUN，不自动扩大sandbox。
5. 保留原生报告及所有失败、UNKNOWN、未知预留和未验证。完整原始输出由主工程写入同一持久证据根，不把只读Validator变成写入者。终点是独立完整报告；发现允许范围内缺陷时，仍由主工程修复、重验并重新冻结；本通道可对同一Change内这些必要修正版做受影响独立复核，无需每条命令再次批准，不扩展产品、外部效果或角色边界。
6. 这使用Codex工程审查通道；**不调用Report Studio的MiMo/MiniMax或其他产品Provider**，不读取/复制其密钥，不增加其SDK计量。新增安装、MacBook写入、干净机/真实场景、旧UNKNOWN核对、部署及Git提交/推送/PR/合并/发布仍未授权。

可以明确回复：**“批准031，允许本Change最终Validator使用Sol/high/read-only CLI通道，按稿收尾及必要修复复核；产品Provider、安装、部署和Git权限不变。”**

此项批准不是Validator PASS、工程/产品接受、许可授予或Git/部署授权。其他真实验收与产品决策缺口仍按030逐项保留；届时以具体候选和动作单独处理。


## 用户决定

用户明确回复“批准031，按稿使用只读CLI验证通道”。授权仅上述角色通道及必要修复复核，其他权限不变。先收齐并结束当前原生审查，再核对既有CLI实际装载；不因批准预填验证PASS。原申请副本及回执保存在原030证据根。
