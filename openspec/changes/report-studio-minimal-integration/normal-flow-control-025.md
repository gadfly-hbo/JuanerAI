# 临时验收控制025：对齐独立版正常制作与导出流程

2026-10-16。用户明确授权先离线修正/回归，通过后准备真实验收范围供确认。本轮Provider0、不安装/部署/Git、不写MacBook；不更改产品或供应源码、真实报告/账本/配置，不复活021场景。Mini保持原分支/HEAD/WIP和唯一证据根`engineering-intake-20261016/control-normal-flow-025/`。

依据[023实际失败](mimo-correction-result-023.md)及Mini同根macbook-reference-024/reference-assessment-024.md只读对照：独立版look_page允许发现问题后修改、重渲染、重检；正常saveExport会更新project.json.updated_at。原临时控制的修正模式已保留有界改后检查失效，但整文件冻结与正常导出冲突。保留023真实失败及原37项实际覆盖，不回填PASS。

## 实施范围和验收点（先于实现）

只改`tools/report-studio/trial-control.mjs`及其临时验收测试、必要工程记录。不是改变插件日常自由制作、认证、SDK配置、工具声明、权限或预算。默认018行为及原024项测试不变；现有有界版本/新图关联/首错/限额和严格核对负例仍需回归。

- **AC-NORMAL1**：使用真实启动的完整锁集合、实际安装WorkspaceStore正常保存路径与正常UI导出。模型完成/两页当前图检和人工检查成立、单格式许可被原policy实际认领且成功/物理结束/本次消费已知之后，才允许该导出造成的project.json.updated_at变化。其他受检文件严格不变，不能通过删除整个project.json锁绕过。导出完成后保存新的元数据hash，后续检查以该已接受状态为准。
- **AC-NORMAL2**：项目除updated_at外的全部语义字段仍完全相同（包括未知/新字段）；时间需合法ISO且不倒退。导出前/无许可/失败或UNKNOWN结算/未完成配对时的更新时间变化拒绝。项目标题、品牌、身份、额外字段、材料、框架、模型计划、页源码/HTML/PPTX变化仍拒绝；不得因允许时间更新而吞掉其他变化。
- **AC-NORMAL3**：正常图检后在已有授权范围内修改仍使旧结构/QA/图片/人工检查失效，再渲染/QA/两页新图进入实际请求后才导出；两周期、写数/工具/派发/时间、原SDK名字/参数/ID及未知预留等旧负例全部保留。日常产品不导入临时控制。
- **AC-NORMAL4**：合成同Task/同会话带历史未知预留，定向核对后经正常UI完成三格式保存/下载，bytes/hash/2页/关键内容核对，完整锁集合与真实输入显式比对；其他预算/配置/历史未知不变。真实调用由注入假transport替代，外部网络拒绝；安装包、真实数据和MacBook不动。

预计私有实现：正常localExport在验证成功结算后显式接纳这一元数据变化，其他阶段仍严格snapshot；保留异常/闭锁与证据失效。无需新产品状态、持久结构、第三方依赖或SDK迁移。因果RED、GREEN、回归/固定身份和失败证据在本文件追加；本稿不提前宣称通过。

真实续验拟优先复用有效制作/图检/PPTX证据，仅补未完成导出及原生查看；具体固定输入、动作/权限/上限与停止线待离线结果后另列。新范围未批准前不启动真实服务或读取凭据，不以旧021余量启动新场景。


## 实际结果：离线通过，真实范围仍待确认

- 因果RED：red-002.log exit1，完整真实锁集合下实际UI保存成功后旧控制报revision_artifact_changed，与023一致；对应源码固定在red-002-inputs/。red-001.log的合成SourceAsset格式错误导致400，未到目标行为，单独保留为夹具失败，不作因果RED。
- GREEN：只在localExport被原policy认领并成功/物理结束/本次消费已知后，接纳项目updated_at合法、非倒退且落在该导出执行窗口的变化；其他项目字段和所有受检文件严格不变。无配对/失败/UNKNOWN/导出前变化不接纳，原冻结仍生效。只记录闭合原因与文件hash，不新增真实参数/密钥/调用ID原文。
- 回归：原默认24项、修正模式15项、严格停止负例1项均exit0，合计40项适用输入。另先跑3项定向检查作反馈；15项后补强本地导出Provider0/全部Task字段不变断言，再只重跑受影响AC-REV6 exit0，其他14项实现/断言不变，未重复计数。原默认测试文件字节不变，未删断言、负例、用例或添加skip。
- 实际安装SDK/Chromium、合成同Task/会话、历史16384预留、两个修改重检周期、新图关联、三格式正常UI保存下载/bytes/hash/2页内容均通过。UI导出阶段wire无新增，整个SDK Task记录前后完全相等；这一证据支持下一次仅本地续验Provider0，不提升真实HTML/PDF结果。
- Node26对两份变更ESM文件syntax check exit0。未改产品/供应源码，故本轮不重跑未受影响的产品type/build；原89源、017的22714资源及严格签名逐项核验通过。完整Change尚未就绪，本轮不是正式独立Validator/required CI/工程或产品接受。
- 真数据114普通文件/117项、五预算、policy和配置字节全部不变；旧021/023/024冻结证据读回不变。Provider0、真实凭据使用0、真实服务启动0、安装0/部署0/Git0/MacBook0；原所有失败、UNKNOWN、旧A2048/01016384/01916384及完整未验证保留。原skill invalid_metadata警告仍保留。

固定控制SHA `549aad99216e605987002b969d88b7b76d31229b06f5adfd038202d3779489e6`；最终修正测试SHA `484424b6f60d8127186c9b33efdaf578f8998b7efca4ba5a295dde30dbe0e146`；原默认测试SHA `12c7ea3d40ed6de93055f1c06f49db499d868f3da1fb8dccee3f9c413e4c095f`。三份可读源码副本及清单位于control-normal-flow-025/fixed-control/。候选冻结JSON SHA **bfddcec59d58e1c3008c081d50ce974d83fb0356beb85af22fd688bffdf37899**，不自动授真实效果。

证据目录还保留before-data及清单、scope-025.json、各case源码/日志/退出回执、全部合成夹具/原图/下载/失败、verify-and-freeze-025.py/.log。原完整方案/UI/readiness不重跑；临时控制仍不进产品包，插件自由制作不变。

NEXT_ACTION_025：用户审核[026本地续验范围](local-export-authorization-026.md)。建议复用有效MiMo制作/图检和PPTX，只补HTML/PDF保存下载及三格式原生查看，新增Provider0；未批准前不启动真实服务、不导出或原生查看。本轮离线目标已完成，原023真实FAIL不回填，正式能力接受增量0，[全40ID图](../../../docs/planning/capability-coverage/latest.md)保持在研。
