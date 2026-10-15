# R1～R4完整候选准备矩阵007：D1～D8 A

2026-10-15用户整体批准A后接续；005/.2、006/.3及review001均为历史原件。本文件整合适用范围，不将窄read PASS扩大为完整验收。固定工作树/分支/HEAD不变，当前WIP及实际安装独立绑定；canonical001已过；新增J05后完整canonical002已通过，完整独立评审已返回：技术 PASS／正式 BLOCKED F-ROLE-01；用户本候选具名豁免后离线 Engineering Acceptance，详见 [工程接收](engineering-acceptance.md)。

当前证据根（Mini本机，非跨设备备份）：
`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/`。

## 具名准备正文接缝

| 验收接点 | 当前实际证据 | 边界与保留 |
|---|---|---|
| D1/D2 所有权、结构、粒度 | PREP-S01真实SQLite Task1.4、savePreparation/原子task hash、只追加/幂等/重开；PREP-S02非法producer不得借已保存回执 | 无新表、业务仓库或SDK状态；完整identity/epoch/preview owner；正式framework/Outcome不被保存草稿推进 |
| D3 写入/物理上限 | S04有效1000条/接近64MiB历史行读回后追加拒绝，旧hash不变；S05重算行摘要不能绕过owner/闭合字段/时间/版本/来源编译 | 16MiB单快照/64MiB当前及历史/1000条/64候选为宿主物理边界；行夹具不是1000次真实工具执行，不代表token安全 |
| D4 读取/失效 | A05六项current success→stale/hash/foreign locator/revoked/source changed/aborted拒绝；W02父owner locator不可跨用 | 固定四种JSON窄行派生，重复source/auth检查；旧snapshot保留但不自动成为当前模型输入，无通用latest恢复 |
| D5 等待、准备及继承 | W01真实Store clarification waiting；W02父waiting Preview完整business在后继同baseline/source候选继承，未采纳/计算；S03/S07修订保留旧owner+Preview元数据、新scope无快照继承 | 用户显式修订/采纳沿既有入口；不对历史业务Task迁移、恢复、重放；新增business私有参数不是SDK配置 |
| 大business/唯一SOURCE解释 | A01/A02分别前框架保存、原saved:false不变；J01三物理/三工具App→Adapter→.3 native持久Session→Store→HTTP/client/renderer读回零新增调用 | J01只读原生2行是片段；完整唯一语义另由J04证明，不混称模型已读全部business |
| 唯一语义完整原生消费 | J04实际CSV inspector→4维×16不同源码原句→小确认反馈→多次原生read offset/limit→完整重组对象等于保存semantics→真实clarification waiting→重开 | SOURCE解释仍MODEL解释，不提升为业务事实；保留所有quote/位置，不压缩/删除来源正文 |
| proposalOnly框架、两批步骤及IR | A03四大节点+append第五节点全条件；A04长value mappings/current_plan/evidence/candidate handles保真；J03实际SDK合法candidate句柄、两批、read、ready；正式framework/Outcome均null | J03 6物理/5工具。J05新Task1.4的真实个人Profile：Preview ready→用户显式adopt→revision2声明IR/计算/独立核验→目标复核→数值报告/Outcome→HTTP/client/renderer→重开，8物理/4工具，旧准备及Preview历史保留。旧Context封印误带入新步骤的有效RED003→最小重新绑定修正→GREEN005；001脚本错句柄、004脚本错误JSON解析分别保留 |
| 持久失败/UNKNOWN/迟到 | J02五项实际native+真实SQLite，故障注入仅业务保存Port：写前失败、commit后ACK丢失、工具成功后模型未知、保存前/后取消 | 不修改SDK，未提交写不伪保存；已提交正文保留；第一模型known7/3不丢；第二模型UNKNOWN预留4096保留；冻结UNKNOWN与tool.finished迟到事实并存；无重试/重放/退款 |
| D6/D7 旧恢复字段 | required_calculations.execution_plan、finish_result.result及原checkpoint/finishChild消费者保留；当前全量运行其既有协议/恢复/child负向 | 未定义替代引用、SDK shared output或通用恢复；旧字段超限仍原最终guard/执行后限额失败关闭，不许删除字段伪GREEN |
| D8 激活/兼容/回滚 | 显式preparationSnapshots:v1＋新的固定product material/model-output策略身份，新Task1.4；S06旧1.1无回填/未知optin拒绝；旧配置/skills/fork/队列当前回归 | 缺新能力不能执行新Task；旧配置策略v15不热改；默认production未启用。回滚冻结新写/引用，保留Task和UNKNOWN，不旧版自动resume |

## 与原V01～V17整合

V01～V09、V16的实际Source/IR/核验/Outcome、容量、两候选codec和主备链证据沿005记录，当前未改其业务方法或候选授权。V10/V11/V13增加J02；V12增加J01；V14增加新旧Task严格版本与历史；V15前框架/准备正文的具体缺口由上述A/J补齐；V17新增四种材料namespace授权，原read/API004九组及负向/晚到合同沿006且当前全部回归。

27工具/20阶段是实际登记清单，不是所有最大参数组合均成功；所有输出仍受固定SDK执行后限额和最终投影guard约束。大工具输入和旧完整恢复字段继续占用上下文；J01最初200k最终guard拒绝历史保留，显式1M合成候选成功不能改写它。

## 当前质量与未验证

- affected-regression-001：470总计/468 PASS/2条件SKIP/0FAIL；两项为R2-BROWSER-DIAGNOSTIC quota/unknown，未设Chrome执行路径；canonical按原批准Chrome补验，不冒充全量。typecheck-005 exit0。全量canonical-001按此前批准toolchain/Chrome/PDF/Office/OCR环境执行，001 exit0；新增J05后002 exit0：17组全部通过，4611总计/4610 PASS/1真实Provider SKIP/0FAIL，quality002源码无漂移。两项Chrome条件补验在002已启用并通过。
- .3 tgz146131bytes/SHA e02175ff42eaa83b994e6f49a1e041b4b3f0b9c807b0b8c192a7dfd836f70cce，51个实际安装文件逐字节匹配；package/lock与review001完全未变，764非SDK条目未漂移。见product-installation-recheck-001.json。
- 生产protocol overhead/margin/image参数UNKNOWN；512/8192仅合成参数，961743bytes只是旧观察。未执行真实Provider/凭据/业务数据、生产部署服务、历史Task迁移恢复重放、Git提交推送合并发布、其他项目升级。Git受限意味着当前WIP与本机证据尚非已集成项目资产。
- complete candidate independent verdict、Engineering Acceptance、用户Product Acceptance、适用归档分别记录，不以安装/SDK内部PASS替代。

NEXT_ACTION：完整候选独立评审及附 F-ROLE-01 具名豁免的离线工程接收已完成，原正式 BLOCKED 保留；本次只同步收口记录。用户 Product Acceptance、生产 UNKNOWN 参数/激活、真实 Provider、历史恢复、Git 与正式归档沿 [工程接收](engineering-acceptance.md) 的具体返回点保持停止，不启动新候选或重复评审。
