# 035A：Mini通知补齐包安装与保全核对

2026-10-16。用户仅批准035A，并决定MacBook免做本轮验证、直接接受。**Mini实际安装更新PASS；MacBook未访问、未更新、未做034实测。** 本轮不启动应用/服务、不调用Provider、不部署、不发布Git。

## 实际结果

Mini目标为`/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil.app`。更新前旧027应用25591项、签名及033结束的159项Studio数据逐项一致；lsof和进程检查没有发现目标/数据的活动使用。旧应用、完整Studio数据先独立备份并逐项读回，再将034应用复制到同目录暂存位置，核对后以重命名替换，最后重复整应用、签名、模块及数据检查。preflight、backup、stage、install四阶段均exit0，无新失败/UNKNOWN；未执行回滚。

| 核对 | 实际结果 |
|---|---|
| 固定来源 | 034交付ZIP468266662bytes/SHA `793a67d1a2aa9f6e5682563a07c07ee6fa1e62a235e83174e62c9998b95fa4a0`与冻结身份一致；安装来自同一已独立验证的应用目录 |
| 整应用 | 25593项文件/链接逐项长度、SHA或链接目标一致，清单SHA `fd26ae55e33778c4b9453711f5d88a19f74beaf6425828373e50cc910cfb9fe8`；codesign deep/strict exit0 |
| 内置模块 | 22716资源，manifest `d59d0554314c7e3c832944dd9f6bc6c8a31df3b7c862b119bd7a540c5551da19`，部署身份一致；buffers通知/来源与固定原件逐字相同 |
| 原数据 | `Library/Application Support/JuanerAI/Workbench/user-data/report-studio`全部159项与033/034冻结清单一致；配置、同任务账本、全部旧UNKNOWN/预留和两份交付保持 |
| 源码 | 034完整快照中的1794项非状态/验收记录文件逐字未变，未新增实现/测试/SDK/锁文件；本轮不重复离线测试或独立代码审查 |
| 副作用 | 应用/服务启动0，Provider/SDK模型/工具/控制调用0，MacBook操作0，Git变更/部署0；未读Keychain或解释/输出凭据 |

版本仍0.1.0-juanerai.1/协议1，固定供应74ebb609；相对027仅许可材料及相应身份/签名变化。原033正常制作/图检、三格式、关联交付2、继续制作与用户条件式接受，按034独立功能等价结论复用。本轮不是034新运行验收、干净机实证、Developer ID/公证或未来报告质量保证。

## 备份及恢复位置

原旧应用保留为`/Users/bendandebaba/Applications/JuanerAI-ReportStudio-Trial/Xanthil.rollback-027-before035.app`，25591项逐项读回。原034持久根下`install-update-035/backup-027/Xanthil.app`为第二份独立应用备份；`backup-data/report-studio`为159项数据的本机不解释内容备份，未跨机传输。本轮不删除任何旧备份、不重置账本；代码回滚不等于数据回滚。

实际脚本、四阶段退出/时间、安装前后闲置检查、完整复制回执、备份/暂存/现装签名结果及`installed-readback-035.json`，均保存在：

`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/engineering-closeout-030/license-followup-034/offline-candidate-034/install-update-035/`。

原分支`work/mac-mini/report-studio-integration`、HEAD`1446276011917ec46b369eadaed40c059db46b34`与WIP保持。MacBook用户免测接受按原话记录，不伪写同包安装或实测PASS；以后不再索取本项验证。

## 保留与下一边界

032失败产物/交付1、033接受产物/交付2、原008根因与019意图UNKNOWN、A2048/01016384/01916384未知消费/预留、PDF中文精确搜索UNKNOWN、较大图片限制、主备未验、物理Provider中断NOT_PROVEN及全部历史失败/未验证保留。AC01用户风险接受仍不是干净机实测；整体通知索引PENDING不改为法律保证。

035A允许事项已完成。当前固定候选的工程接受见[工程接受记录](engineering-acceptance.md)；正式Change/Git/required CI/适用归档仍未完成。下一实际权限为[036 Git交付范围](git-delivery-authorization-036.md)，未批准不提交、推送、合入main或创建PR；本轮安装授权不扩为Git/部署权限。
